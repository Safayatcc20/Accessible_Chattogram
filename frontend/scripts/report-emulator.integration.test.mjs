import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { deleteApp } from 'firebase/app';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

const PROJECT_ID = 'accessible-chattogram';
const FIRESTORE_HOST = '127.0.0.1';
const FIRESTORE_PORT = 8080;
const PLACE_ID = 'report-update-test-place';
const REPORT = {
  category: 'place-details',
  fields: ['address', 'area'],
  description: 'The listed address appears outdated; please check it.',
}

const testEnv = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: {
    host: FIRESTORE_HOST,
    port: FIRESTORE_PORT,
    rules: readFileSync('firestore.rules', 'utf8'),
  },
});

const vite = await createServer({
  configFile: 'vite.config.ts',
  mode: 'emulator',
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
});

let app;
let reportId;

function makePlace() {
  return {
    name: 'Report Update Emulator Test Place',
    category: 'other',
    address: '100 Emulator Test Road, Chattogram',
    area: 'Test Area',
    description: null,
    phone: null,
    website: null,
    openingHours: null,
    latitude: 22.3,
    longitude: 91.8,
    isOpenNow: null,
    accessibility: {
      wheelchairEntrance: null,
      ramp: null,
      elevator: null,
      accessibleToilet: null,
      accessibleParking: null,
      tactilePaving: null,
      audioAssistance: null,
      accessiblePathways: null,
      doorWidth: null,
      entranceSurface: null,
      elevatorNotes: null,
      restroomNotes: null,
      parkingDistance: null,
    },
    verification: {
      status: 'unverified',
      lastVerified: null,
      verificationCount: 0,
      communityReports: 0,
      source: 'Local Firestore Emulator fixture',
    },
    createdAt: Timestamp.fromMillis(1_798_000_000_000),
    updatedAt: Timestamp.fromMillis(1_798_000_000_000),
  }
}

function normalize(value) {
  if (value instanceof Timestamp) return { seconds: value.seconds, nanoseconds: value.nanoseconds }
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalize(entry)]))
  }
  return value
}

async function loadLocalEmulatorRules(rules) {
  const response = await fetch(
    `http://${FIRESTORE_HOST}:${FIRESTORE_PORT}/emulator/v1/projects/${PROJECT_ID}:securityRules`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules: { files: [{ content: rules }] } }),
    },
  )
  assert.equal(response.ok, true, `Could not load local Emulator test rules: ${await response.text()}`)
}

try {
  const fixture = makePlace()
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), `places/${PLACE_ID}`), fixture)
  })

  const firebase = await vite.ssrLoadModule('/src/lib/firebase.ts')
  app = firebase.app
  const api = await vite.ssrLoadModule('/src/services/api.ts')

  const placeRef = doc(firebase.db, 'places', PLACE_ID)
  const before = await getDoc(placeRef)
  assert.equal(before.exists(), true, 'Seeded fixture must be readable through the app Firestore client')
  const beforeData = before.data()

  const result = await api.submitReport({ placeId: PLACE_ID, ...REPORT })
  assert.equal(result.success, true)
  assert.equal(typeof result.id, 'string')
  reportId = result.id

  const after = await getDoc(placeRef)
  assert.deepEqual(normalize(after.data()), normalize(beforeData), 'Submitting a report must not change the place document')

  let savedReport
  await testEnv.withSecurityRulesDisabled(async context => {
    const snapshot = await getDoc(doc(context.firestore(), `reports/${reportId}`))
    assert.equal(snapshot.exists(), true, 'Report should be saved in the local Emulator')
    savedReport = snapshot.data()
  })
  assert.equal(savedReport.placeId, PLACE_ID)
  assert.equal(savedReport.placeName, fixture.name)
  assert.equal(savedReport.category, REPORT.category)
  assert.deepEqual(savedReport.fields, REPORT.fields)
  assert.equal(savedReport.description, REPORT.description)
  assert.equal(savedReport.status, 'pending')
  assert.equal(savedReport.reporterUid, null)
  assert.ok(savedReport.createdAt instanceof Timestamp)
  assert.equal(savedReport.reviewedAt, null)
  assert.equal(savedReport.reviewedBy, null)
  assert.equal(savedReport.reviewDecision, null)
  assert.equal(savedReport.rejectionReason, null)
  assert.equal(savedReport.appliedChanges, null)
  console.log('PASS: actual report service creates a pending report in the Emulator and leaves the place unchanged')

  await assert.rejects(
    api.submitReport({ placeId: PLACE_ID, category: 'place-details', fields: ['ramp'], description: REPORT.description }),
    /report-fields-invalid/,
  )
  console.log('PASS: service rejects fields outside the selected category allowlist')

  const originalRules = readFileSync('firestore.rules', 'utf8')
  try {
    await loadLocalEmulatorRules(`rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /places/{placeId} { allow read: if true; allow write: if false; }
            match /reports/{reportId} { allow read, write: if false; }
            match /{document=**} { allow read, write: if false; }
          }
        }`)
    await assert.rejects(
      api.submitReport({ placeId: PLACE_ID, ...REPORT }),
      error => error?.code === 'permission-denied',
    )
    const afterDeniedWrite = await getDoc(placeRef)
    assert.deepEqual(normalize(afterDeniedWrite.data()), normalize(beforeData), 'A denied submission must also leave the place unchanged')
    console.log('PASS: Firestore permission denial is returned to the app and leaves the place unchanged')
  } finally {
    await loadLocalEmulatorRules(originalRules)
  }
} catch (error) {
  console.error('FAIL: report Emulator integration test')
  console.error(error)
  process.exitCode = 1
} finally {
  if (reportId) {
    await testEnv.withSecurityRulesDisabled(async context => {
      const { deleteDoc } = await import('firebase/firestore')
      await deleteDoc(doc(context.firestore(), `reports/${reportId}`)).catch(() => {})
    }).catch(() => {})
  }
  if (app) await deleteApp(app).catch(() => {})
  await testEnv.cleanup()
  await vite.close()
}
