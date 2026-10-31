import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

// Fixed loopback-only target. This script cannot read .env or connect to production.
const PROJECT_ID = 'accessible-chattogram';
const FIRESTORE_HOST = '127.0.0.1';
const FIRESTORE_PORT = 8080;
const PLACE_ID = 'report-update-test-place';

const testEnv = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: {
    host: FIRESTORE_HOST,
    port: FIRESTORE_PORT,
    rules: readFileSync('firestore.rules', 'utf8'),
  },
});

try {
  await testEnv.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), `places/${PLACE_ID}`), {
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
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  })
  console.log(`Seeded only Emulator fixture places/${PLACE_ID} at ${FIRESTORE_HOST}:${FIRESTORE_PORT}.`)
} finally {
  await testEnv.cleanup()
}
