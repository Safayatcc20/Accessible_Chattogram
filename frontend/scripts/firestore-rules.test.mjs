
import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

const PROJECT_ID = "accessible-chattogram";

const env = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: {
    host: "127.0.0.1",
    port: 8080,
    rules: readFileSync("firestore.rules", "utf8"),
  },
});

const adminUid = "test-admin-001";

async function seedTestData() {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, `admins/${adminUid}`), {
      role: "admin",
    });

    await setDoc(doc(db, "contributions/approve-test"), {
      status: "pending",
      reviewedAt: null,
      placeName: "Approval test place",
    });

    await setDoc(doc(db, "contributions/reject-test"), {
      status: "pending",
      reviewedAt: null,
      placeName: "Rejection test place",
    });

    await setDoc(doc(db, "contributions/already-reviewed-test"), {
      status: "approved",
      reviewedAt: new Date("2026-01-01T00:00:00Z"),
      placeName: "Reviewed test place",
    });

    await setDoc(doc(db, "contributions/field-change-test"), {
      status: "pending",
      reviewedAt: null,
      placeName: "Original test place",
    });

    await setDoc(doc(db, "contributions/non-admin-read-test"), {
      status: "pending",
      reviewedAt: null,
      placeName: "Private test record",
    });
  });
}


function makeValidContribution(overrides = {}) {
  return {
    placeName: "Test Hospital",
    category: "hospital",
    address: "Test Road, Chattogram",
    area: "Agrabad",
    phone: null,
    website: null,
    accessibility: {
      wheelchairEntrance: true,
      ramp: true,
      elevator: false,
      accessibleToilet: true,
      accessibleParking: false,
      tactilePaving: false,
      audioAssistance: false,
    },
    notes: null,
    reporter: {
      name: "Test User",
      email: "test@example.com",
    },
    status: "pending",
    createdAt: serverTimestamp(),
    reviewedAt: null,
    ...overrides,
  };
}

async function main() {
  let failures = 0;

  try {
    await seedTestData();

    const adminDb = env
      .authenticatedContext(adminUid, {
        provider: "google.com",
        email: "admin-test@example.com",
        name: "Test Admin",
      })
      .firestore();

    const nonAdminDb = env
      .authenticatedContext("test-non-admin-001", {
        provider: "google.com",
        email: "user-test@example.com",
        name: "Test User",
      })
      .firestore();

    const tests = [
      {
        name: "1. Admin can approve a pending contribution",
        run: () =>
          assertSucceeds(
            updateDoc(doc(adminDb, "contributions/approve-test"), {
              status: "approved",
              reviewedAt: serverTimestamp(),
            }),
          ),
      },
      {
        name: "2. Admin can reject a pending contribution",
        run: () =>
          assertSucceeds(
            updateDoc(doc(adminDb, "contributions/reject-test"), {
              status: "rejected",
              reviewedAt: serverTimestamp(),
            }),
          ),
      },
      {
        name: "3. Already-reviewed contribution cannot be changed",
        run: () =>
          assertFails(
            updateDoc(
              doc(adminDb, "contributions/already-reviewed-test"),
              {
                status: "rejected",
                reviewedAt: serverTimestamp(),
              },
            ),
          ),
      },
      {
        name: "4. Admin cannot change placeName while reviewing",
        run: () =>
          assertFails(
            updateDoc(doc(adminDb, "contributions/field-change-test"), {
              status: "approved",
              reviewedAt: serverTimestamp(),
              placeName: "Tampered place name",
            }),
          ),
      },
      {
        name: "5. Non-admin cannot read a contribution",
        run: () =>
          assertFails(
            getDoc(
              doc(nonAdminDb, "contributions/non-admin-read-test"),
            ),
          ),
      },
      
      {
        name: "6. Public user can submit a valid contribution",
        run: () =>
          assertSucceeds(
            setDoc(
              doc(
                env.unauthenticatedContext().firestore(),
                "contributions/public-valid-test",
              ),
              makeValidContribution(),
            ),
          ),
      },
      {
        name: "7. Public user cannot submit an already-approved contribution",
        run: () =>
          assertFails(
            setDoc(
              doc(
                env.unauthenticatedContext().firestore(),
                "contributions/public-approved-test",
              ),
              makeValidContribution({ status: "approved" }),
            ),
          ),
      },
      {
        name: "8. Public user cannot submit an extra unauthorized field",
        run: () =>
          assertFails(
            setDoc(
              doc(
                env.unauthenticatedContext().firestore(),
                "contributions/public-extra-field-test",
              ),
              makeValidContribution({ isAdmin: true }),
            ),
          ),
      },
      {
        name: "9. Non-admin cannot create a published place",
        run: () =>
          assertFails(
            setDoc(
              doc(nonAdminDb, "places/non-admin-place-test"),
              { name: "Unauthorized Place" },
            ),
          ),
      },
      {
        name: "10. Admin can create a published place",
        run: () =>
          assertSucceeds(
            setDoc(
              doc(adminDb, "places/admin-place-test"),
              { name: "Admin Test Place" },
            ),
          ),
      },

    ];

    for (const test of tests) {
      try {
        await test.run();
        console.log(`PASS: ${test.name}`);
      } catch (error) {
        failures++;
        console.error(`FAIL: ${test.name}`);
        console.error(error.message);
      }
    }

    console.log(`\nResults: ${tests.length - failures}/${tests.length} tests passed.`);
  } catch (error) {
    console.error("Test setup failed:", error);
    failures++;
  } finally {
    await env.cleanup();
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

await main();
