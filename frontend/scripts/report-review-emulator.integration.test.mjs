import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'
import { deleteApp } from 'firebase/app'
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'

const PROJECT_ID = 'accessible-chattogram'
const HOST = '127.0.0.1'
const FIRESTORE_PORT = 8080
const PLACE_ID = 'report-review-emulator-test-place'

const testEnv = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: { host: HOST, port: FIRESTORE_PORT, rules: readFileSync('firestore.rules', 'utf8') },
})
const vite = await createServer({
  configFile: 'vite.config.ts',
  mode: 'emulator',
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
})

let app
let auth
let user
const reportIds = new Set()

function fixture() {
  return {
    name: 'Report Review Emulator Place',
    category: 'other',
    address: 'Original Address',
    area: 'Original Area',
    description: 'Fixture description',
    phone: '0123456789',
    website: 'https://old.example.test',
    openingHours: '9am–5pm',
    latitude: 22.3,
    longitude: 91.8,
    isOpenNow: false,
    accessibility: {
      wheelchairEntrance: false,
      ramp: false,
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
      status: 'admin-verified',
      lastVerified: Timestamp.fromMillis(1_798_000_000_000),
      verificationCount: 4,
      communityReports: 1,
      source: 'Existing admin approval',
      verifiedAt: Timestamp.fromMillis(1_798_000_000_000),
      verifiedBy: 'existing-admin-uid',
      communityVerificationCount: 0,
    },
    createdAt: Timestamp.fromMillis(1_798_000_000_000),
    updatedAt: Timestamp.fromMillis(1_798_000_000_000),
  }
}

function normalize(value) {
  if (value instanceof Timestamp) return { seconds: value.seconds, nanoseconds: value.nanoseconds }
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalize(entry)]))
  return value
}

async function submit(api, input) {
  const result = await api.submitReport({ placeId: PLACE_ID, ...input })
  reportIds.add(result.id)
  return result.id
}

try {
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), `places/${PLACE_ID}`), fixture())
  })

  const firebase = await vite.ssrLoadModule('/src/lib/firebase.ts')
  app = firebase.app
  auth = firebase.auth
  const api = await vite.ssrLoadModule('/src/services/api.ts')
  const identity = await createUserWithEmailAndPassword(auth, 'report-review-admin@example.test', 'local-emulator-password')
  user = identity.user
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), `admins/${user.uid}`), { role: 'admin' })
  })

  const placeRef = doc(firebase.db, `places/${PLACE_ID}`)
  const beforePlace = await getDoc(placeRef)
  const original = beforePlace.data()

  const approvedReportId = await submit(api, {
    category: 'place-details', fields: ['address', 'area'],
    description: 'The address and area have changed.',
  })
  await api.reviewPlaceReport({
    reportId: approvedReportId,
    decision: 'approved',
    expectedCurrentValues: { address: original.address, area: original.area },
    approvedChanges: { address: 'Corrected Address', area: 'Corrected Area' },
  })
  const afterApproval = await getDoc(placeRef)
  assert.equal(afterApproval.data().address, 'Corrected Address')
  assert.equal(afterApproval.data().area, 'Corrected Area')
  assert.equal(afterApproval.data().phone, original.phone)
  assert.equal(afterApproval.data().website, original.website)
  assert.equal(afterApproval.data().latitude, original.latitude)
  assert.equal(afterApproval.data().longitude, original.longitude)
  assert.deepEqual(normalize(afterApproval.data().accessibility), normalize(original.accessibility))
  assert.deepEqual(normalize(afterApproval.data().verification), normalize(original.verification), 'Approval must preserve admin verification and provenance data')

  const approvedReport = await getDoc(doc(firebase.db, `reports/${approvedReportId}`))
  assert.equal(approvedReport.data().status, 'approved')
  assert.equal(approvedReport.data().reviewDecision, 'approved')
  assert.equal(approvedReport.data().reviewedBy, user.uid)
  assert.ok(approvedReport.data().reviewedAt instanceof Timestamp)
  assert.equal(approvedReport.data().rejectionReason, null)
  assert.deepEqual(approvedReport.data().appliedChanges, { address: 'Corrected Address', area: 'Corrected Area' })
  const afterFirstReview = normalize(afterApproval.data())
  await assert.rejects(
    api.reviewPlaceReport({
      reportId: approvedReportId,
      decision: 'approved',
      expectedCurrentValues: { address: 'Corrected Address', area: 'Corrected Area' },
      approvedChanges: { address: 'Twice Applied', area: 'Twice Applied' },
    }),
    /report-already-reviewed/,
  )
  assert.deepEqual(normalize((await getDoc(placeRef)).data()), afterFirstReview, 'A repeated review must not apply a second update')
  console.log('PASS: approval transaction updates only selected fields, stores audit metadata, and preserves verification/accessibility data')

  const rejectionReportId = await submit(api, {
    category: 'place-details', fields: ['phone'], description: 'Please check the phone number.',
  })
  const beforeRejection = normalize((await getDoc(placeRef)).data())
  await assert.rejects(
    api.reviewPlaceReport({ reportId: rejectionReportId, decision: 'rejected' }),
    /report-rejection-reason-required/,
  )
  assert.equal((await getDoc(doc(firebase.db, `reports/${rejectionReportId}`))).data().status, 'pending')
  await api.reviewPlaceReport({ reportId: rejectionReportId, decision: 'rejected', reason: 'The report did not include enough evidence.' })
  const rejectionReport = await getDoc(doc(firebase.db, `reports/${rejectionReportId}`))
  assert.equal(rejectionReport.data().status, 'rejected')
  assert.equal(rejectionReport.data().reviewDecision, 'rejected')
  assert.equal(rejectionReport.data().reviewedBy, user.uid)
  assert.equal(rejectionReport.data().rejectionReason, 'The report did not include enough evidence.')
  assert.equal(rejectionReport.data().appliedChanges, null)
  assert.deepEqual(normalize((await getDoc(placeRef)).data()), beforeRejection, 'Rejection must leave the place unchanged')
  console.log('PASS: rejection requires and records a reason without changing the place')

  const accessibilityReportId = await submit(api, {
    category: 'accessibility', fields: ['ramp'], description: 'A ramp is now installed.',
  })
  const beforeAccessibilityReview = (await getDoc(placeRef)).data()
  await api.reviewPlaceReport({
    reportId: accessibilityReportId,
    decision: 'approved',
    expectedCurrentValues: { ramp: beforeAccessibilityReview.accessibility.ramp },
    approvedChanges: { ramp: true },
  })
  const afterAccessibilityReview = (await getDoc(placeRef)).data()
  assert.equal(afterAccessibilityReview.accessibility.ramp, true)
  assert.equal(afterAccessibilityReview.accessibility.wheelchairEntrance, beforeAccessibilityReview.accessibility.wheelchairEntrance)
  assert.deepEqual(normalize(afterAccessibilityReview.verification), normalize(original.verification))
  console.log('PASS: accessibility approval changes only the selected accessibility feature and preserves admin verification')

  const conflictReportId = await submit(api, {
    category: 'place-details', fields: ['address'], description: 'The address needs review.',
  })
  const staleExpected = (await getDoc(placeRef)).data().address
  await api.reviewPlaceReport({
    reportId: conflictReportId,
    decision: 'approved',
    expectedCurrentValues: { address: staleExpected },
    approvedChanges: { address: 'Freshly reviewed address' },
  })
  console.log('PASS: a report can be reviewed using the current place value')

  const concurrentReportId = await submit(api, {
    category: 'place-details', fields: ['area'], description: 'Please verify this area.',
  })
  const currentArea = (await getDoc(placeRef)).data().area
  const concurrentReview = () => api.reviewPlaceReport({
    reportId: concurrentReportId,
    decision: 'approved',
    expectedCurrentValues: { area: currentArea },
    approvedChanges: { area: 'Concurrent update once' },
  })
  const concurrentResults = await Promise.allSettled([concurrentReview(), concurrentReview()])
  assert.equal(concurrentResults.filter(result => result.status === 'fulfilled').length, 1, 'Only one concurrent transaction should commit')
  assert.equal(concurrentResults.filter(result => result.status === 'rejected').length, 1, 'The retry must see the reviewed status')
  assert.equal((await getDoc(placeRef)).data().area, 'Concurrent update once')
  console.log('PASS: concurrent duplicate approvals produce one committed review')

  const staleReportId = await submit(api, {
    category: 'place-details', fields: ['address'], description: 'Address is outdated.',
  })
  const staleValue = (await getDoc(placeRef)).data().address
  await (await import('firebase/firestore')).updateDoc(placeRef, { address: 'Changed while pending' })
  await assert.rejects(api.reviewPlaceReport({
    reportId: staleReportId,
    decision: 'approved',
    expectedCurrentValues: { address: staleValue },
    approvedChanges: { address: 'Would overwrite newer data' },
  }), /report-place-changed/)
  assert.equal((await getDoc(placeRef)).data().address, 'Changed while pending')
  assert.equal((await getDoc(doc(firebase.db, `reports/${staleReportId}`))).data().status, 'pending')
  console.log('PASS: stale current values block approval without overwriting newer place data')
} catch (error) {
  console.error('FAIL: report review Emulator integration test')
  console.error(error)
  process.exitCode = 1
} finally {
  if (auth?.currentUser) await deleteUser(auth.currentUser).catch(() => {})
  if (testEnv) {
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore()
      for (const reportId of reportIds) await deleteDoc(doc(db, `reports/${reportId}`)).catch(() => {})
      await deleteDoc(doc(db, `places/${PLACE_ID}`)).catch(() => {})
    }).catch(() => {})
    await testEnv.cleanup()
  }
  if (app) await deleteApp(app).catch(() => {})
  await vite.close()
}
