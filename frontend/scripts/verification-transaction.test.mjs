import { readFileSync } from 'node:fs';
import { createServer } from 'vite';
import { deleteApp } from 'firebase/app';
import {
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { connectAuthEmulator, signInAnonymously, signOut } from 'firebase/auth';

const PROJECT_ID = 'accessible-chattogram';
const FIRESTORE_HOST = '127.0.0.1';
const FIRESTORE_PORT = 8080;
const AUTH_URL = 'http://127.0.0.1:9099';
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
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true },
});

let api;
let db;
let auth;
let app;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function seedRequest(id, status = 'pending') {
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), `verificationRequests/${id}`), {
      placeId: 'transaction-place',
      placeName: 'Transaction test place',
      accessibility: {
        wheelchairEntrance: true,
        ramp: false,
        elevator: false,
        accessibleToilet: true,
        accessibleParking: false,
        tactilePaving: false,
        audioAssistance: false,
      },
      notes: null,
      submitterUid: null,
      status,
      createdAt: Timestamp.now(),
      reviewedAt: null,
      reviewedBy: null,
    });
  });
}

async function readPlace() {
  const snapshot = await getDoc(doc(db, 'places/transaction-place'));
  assert(snapshot.exists(), 'Expected the existing place to remain present');
  return snapshot.data();
}

async function readRequest(id) {
  const snapshot = await getDoc(doc(db, `verificationRequests/${id}`));
  assert(snapshot.exists(), `Expected request ${id} to remain stored`);
  return snapshot.data();
}

async function expectTest(name, run) {
  await run();
  console.log(`PASS: ${name}`);
}

try {
  const firebase = await vite.ssrLoadModule('/src/lib/firebase.ts');
  app = firebase.app;
  db = firebase.db;
  auth = firebase.auth;
  connectFirestoreEmulator(db, FIRESTORE_HOST, FIRESTORE_PORT);
  connectAuthEmulator(auth, AUTH_URL, { disableWarnings: true });
  await signInAnonymously(auth);
  api = await vite.ssrLoadModule('/src/services/api.ts');

  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async context => {
    const seedDb = context.firestore();
    await setDoc(doc(seedDb, `admins/${auth.currentUser.uid}`), { role: 'admin' });
    await setDoc(doc(seedDb, 'places/transaction-place'), {
      name: 'Transaction test place',
      category: 'hospital',
      address: 'Test Road, Chattogram',
      area: 'Agrabad',
      latitude: 22.3,
      longitude: 91.8,
      accessibility: {
        wheelchairEntrance: true,
        ramp: false,
        elevator: true,
        accessibleToilet: false,
        accessibleParking: true,
        tactilePaving: false,
        audioAssistance: true,
      },
      verification: {
        status: 'admin-verified',
        verificationCount: 3,
        communityReports: 1,
        communityVerificationCount: 0,
        source: 'admin-reviewed',
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  });

  const accessibilityBefore = (await readPlace()).accessibility;

  await seedRequest('approve-once');
  await expectTest('application transaction approves and increments once while preserving admin verification and accessibility', async () => {
    await api.reviewVerificationRequest('approve-once', 'approved');
    const place = await readPlace();
    const request = await readRequest('approve-once');
    assert(place.verification.communityVerificationCount === 1, 'Expected community count 1');
    assert(place.verification.status === 'admin-verified', 'Expected admin-verified status to be preserved');
    assert(JSON.stringify(place.accessibility) === JSON.stringify(accessibilityBefore), 'Expected accessibility data to remain unchanged');
    assert(request.status === 'approved', 'Expected request status approved');
    assert(request.reviewedBy === auth.currentUser.uid, 'Expected reviewer UID on request');
    assert(request.reviewedAt instanceof Timestamp, 'Expected review timestamp on request');
  });

  await expectTest('re-reviewing an approved request does not increment the count', async () => {
    let error;
    try { await api.reviewVerificationRequest('approve-once', 'approved'); } catch (caught) { error = caught; }
    assert(error?.message === 'verification-request-already-reviewed', 'Expected already-reviewed error');
    assert((await readPlace()).verification.communityVerificationCount === 1, 'Expected count to remain 1');
  });

  await seedRequest('reject-no-count');
  await expectTest('rejecting a request preserves history and does not increment the count', async () => {
    await api.reviewVerificationRequest('reject-no-count', 'rejected');
    const request = await readRequest('reject-no-count');
    assert(request.status === 'rejected', 'Expected request status rejected');
    assert(request.reviewedAt instanceof Timestamp, 'Expected rejection timestamp');
    assert((await readPlace()).verification.communityVerificationCount === 1, 'Expected count to remain 1');
  });

  await seedRequest('approve-second');
  await expectTest('approving another request for the same place increments the count to 2', async () => {
    await api.reviewVerificationRequest('approve-second', 'approved');
    assert((await readPlace()).verification.communityVerificationCount === 2, 'Expected count 2 after second approval');
  });

  await seedRequest('approve-concurrent-a');
  await seedRequest('approve-concurrent-b');
  await expectTest('concurrent approvals of separate requests preserve the count', async () => {
    await Promise.all([
      api.reviewVerificationRequest('approve-concurrent-a', 'approved'),
      api.reviewVerificationRequest('approve-concurrent-b', 'approved'),
    ]);
    const place = await readPlace();
    assert(place.verification.communityVerificationCount === 4, 'Expected both concurrent approvals to increment the latest count, producing 4');
    assert((await readRequest('approve-concurrent-a')).status === 'approved', 'Expected concurrent request A approved');
    assert((await readRequest('approve-concurrent-b')).status === 'approved', 'Expected concurrent request B approved');
    assert(place.verification.status === 'admin-verified', 'Expected admin-verified status to remain unchanged');
    assert(JSON.stringify(place.accessibility) === JSON.stringify(accessibilityBefore), 'Expected accessibility data to remain unchanged');
  });

  console.log('\nResults: 5/5 application transaction tests passed.');
} catch (error) {
  console.error('FAIL: application transaction integration test setup or assertion failed');
  console.error(error);
  process.exitCode = 1;
} finally {
  if (auth?.currentUser) await signOut(auth).catch(() => {});
  if (app) await deleteApp(app).catch(() => {});
  await testEnv.cleanup();
  await vite.close();
}
