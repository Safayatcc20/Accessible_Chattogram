
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
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
  deleteDoc,
  serverTimestamp,
  runTransaction,
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

    for (const collectionName of ["reports", "contributions", "verificationRequests"]) {
      const testIds = collectionName === "reports"
        ? ["valid-place-details-test", "valid-accessibility-test", "own-uid-test", "rejection-test", "invalid-approval-test"]
        : collectionName === "contributions"
          ? ["approve-test", "reject-test", "already-reviewed-test", "field-change-test", "non-admin-read-test", "public-valid-test", "public-approved-test", "public-extra-field-test"]
          : ["valid-test", "mismatched-name-test", "approved-test", "reviewer-test", "missing-place-test"];
      for (const id of testIds) await deleteDoc(doc(db, `${collectionName}/${id}`));
    }

    await setDoc(doc(db, `admins/${adminUid}`), {
      role: "admin",
    });
    await setDoc(doc(db, "places/verification-place-test"), {
      name: "Verification test place",
      address: "Original test address",
      area: "Test area",
      phone: null,
      website: null,
      openingHours: null,
      accessibility: {
        wheelchairEntrance: null,
        ramp: null,
        elevator: null,
        accessibleToilet: null,
        accessibleParking: null,
        tactilePaving: null,
        audioAssistance: null,
      },
      verification: { status: "admin-verified", verificationCount: 0, communityReports: 1 },
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

function makeValidVerification(overrides = {}) {
  return {
    placeId: "verification-place-test",
    placeName: "Verification test place",
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
    submitterUid: null,
    status: "pending",
    createdAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
    ...overrides,
  };
}

function makeValidReport(overrides = {}) {
  return {
    placeId: "verification-place-test",
    placeName: "Verification test place",
    category: "place-details",
    fields: ["address", "area"],
    description: "The address on this listing appears outdated.",
    reporterUid: null,
    status: "pending",
    createdAt: serverTimestamp(),
    reviewedAt: null,
    reviewedBy: null,
    reviewDecision: null,
    rejectionReason: null,
    appliedChanges: null,
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
    const reporterDb = env.authenticatedContext("reporter-user-001").firestore();
    const publicDb = env.unauthenticatedContext().firestore();

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
      {
        name: "11. Public users can read published places",
        run: () => assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), "places/verification-place-test"))),
      },
      {
        name: "12. Public user can submit a verification request with the canonical place name",
        run: () => assertSucceeds(setDoc(doc(env.unauthenticatedContext().firestore(), "verificationRequests/valid-test"), makeValidVerification())),
      },
      {
        name: "12a. Public user cannot submit a verification request with a mismatched place name",
        run: () => assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), "verificationRequests/mismatched-name-test"), makeValidVerification({ placeName: "A different place" }))),
      },
      {
        name: "13. Public user cannot create an approved verification request",
        run: () => assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), "verificationRequests/approved-test"), makeValidVerification({ status: "approved" }))),
      },
      {
        name: "14. Public user cannot add reviewer fields to a verification request",
        run: () => assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), "verificationRequests/reviewer-test"), makeValidVerification({ reviewedBy: adminUid }))),
      },
      {
        name: "15. Verification request must reference an existing place",
        run: () => assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), "verificationRequests/missing-place-test"), makeValidVerification({ placeId: "missing-place" }))),
      },
      {
        name: "16. Public user cannot read verification requests",
        run: () => assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "verificationRequests/valid-test"))),
      },
      {
        name: "17. Non-admin cannot review or delete verification requests",
        run: async () => {
          await assertFails(updateDoc(doc(nonAdminDb, "verificationRequests/valid-test"), { status: "approved", reviewedAt: serverTimestamp(), reviewedBy: "test-non-admin-001" }));
          await assertFails((await import("firebase/firestore")).deleteDoc(doc(nonAdminDb, "verificationRequests/valid-test")));
        },
      },
      {
        name: "18. Admin can review a pending verification request",
        run: () => assertSucceeds(updateDoc(doc(adminDb, "verificationRequests/valid-test"), { status: "approved", reviewedAt: serverTimestamp(), reviewedBy: adminUid })),
      },
      {
        name: "19. Reviewed verification request cannot be reviewed again",
        run: () => assertFails(updateDoc(doc(adminDb, "verificationRequests/valid-test"), { status: "rejected", reviewedAt: serverTimestamp(), reviewedBy: adminUid })),
      },
      {
        name: "20. Public user can submit a valid pending place-details report",
        run: () => assertSucceeds(setDoc(doc(publicDb, "reports/valid-place-details-test"), makeValidReport())),
      },
      {
        name: "21. Public user can submit a valid accessibility report",
        run: () => assertSucceeds(setDoc(doc(publicDb, "reports/valid-accessibility-test"), makeValidReport({
          category: "accessibility",
          fields: ["ramp", "accessibleToilet"],
        }))),
      },
      {
        name: "22. Report must reference an existing place with its canonical name",
        run: async () => {
          await assertFails(setDoc(doc(publicDb, "reports/missing-place-test"), makeValidReport({ placeId: "missing-place" })));
          await assertFails(setDoc(doc(publicDb, "reports/mismatched-name-test"), makeValidReport({ placeName: "Different place" })));
        },
      },
      {
        name: "23. Report category fields must belong to that category allowlist",
        run: async () => {
          await assertFails(setDoc(doc(publicDb, "reports/invalid-category-test"), makeValidReport({ category: "other" })));
          await assertFails(setDoc(doc(publicDb, "reports/mixed-category-fields-test"), makeValidReport({ fields: ["address", "ramp"] })));
          await assertFails(setDoc(doc(publicDb, "reports/unknown-field-test"), makeValidReport({ fields: ["email"] })));
          await assertFails(setDoc(doc(publicDb, "reports/duplicate-field-test"), makeValidReport({ fields: ["address", "address"] })));
          await assertFails(setDoc(doc(publicDb, "reports/non-list-fields-test"), makeValidReport({ fields: "address" })));
        },
      },
      {
        name: "24. Report requires a non-empty bounded description and at least one field",
        run: async () => {
          await assertFails(setDoc(doc(publicDb, "reports/empty-description-test"), makeValidReport({ description: "" })));
          await assertFails(setDoc(doc(publicDb, "reports/long-description-test"), makeValidReport({ description: "x".repeat(2001) })));
          await assertFails(setDoc(doc(publicDb, "reports/empty-fields-test"), makeValidReport({ fields: [] })));
        },
      },
      {
        name: "25. Public reports must start pending with empty review metadata and exact fields",
        run: async () => {
          await assertFails(setDoc(doc(publicDb, "reports/approved-at-create-test"), makeValidReport({ status: "approved" })));
          await assertFails(setDoc(doc(publicDb, "reports/reviewer-at-create-test"), makeValidReport({ reviewedBy: adminUid })));
          await assertFails(setDoc(doc(publicDb, "reports/extra-field-test"), makeValidReport({ isAdmin: true })));
          const missingDescription = makeValidReport();
          delete missingDescription.description;
          await assertFails(setDoc(doc(publicDb, "reports/missing-description-test"), missingDescription));
        },
      },
      {
        name: "26. Signed-in submitter may store only their own UID",
        run: async () => {
          await assertSucceeds(setDoc(doc(reporterDb, "reports/own-uid-test"), makeValidReport({ reporterUid: "reporter-user-001" })));
          await assertFails(setDoc(doc(reporterDb, "reports/forged-uid-test"), makeValidReport({ reporterUid: adminUid })));
        },
      },
      {
        name: "27. Reports are readable only by admins",
        run: async () => {
          await assertFails(getDoc(doc(publicDb, "reports/valid-place-details-test")));
          await assertFails(getDoc(doc(nonAdminDb, "reports/valid-place-details-test")));
          await assertSucceeds(getDoc(doc(adminDb, "reports/valid-place-details-test")));
        },
      },
      {
        name: "28. Public users and non-admins cannot update or delete reports; admin approval requires an atomic place update",
        run: async () => {
          for (const clientDb of [publicDb, nonAdminDb]) {
            await assertFails(updateDoc(doc(clientDb, "reports/valid-place-details-test"), { status: "reviewed" }));
            await assertFails(deleteDoc(doc(clientDb, "reports/valid-place-details-test")));
          }
          await assertFails(deleteDoc(doc(adminDb, "reports/valid-place-details-test")));
          await assertFails(updateDoc(doc(adminDb, "reports/valid-place-details-test"), {
            status: "approved", reviewDecision: "approved", reviewedAt: serverTimestamp(),
            reviewedBy: adminUid, rejectionReason: null, appliedChanges: { address: "Updated address", area: "Updated area" },
          }));
        },
      },
      {
        name: "29. Admin can atomically approve a report and apply only its selected fields",
        run: async () => {
          await runTransaction(adminDb, async transaction => {
            const reportRef = doc(adminDb, "reports/valid-place-details-test");
            const placeRef = doc(adminDb, "places/verification-place-test");
            const report = await transaction.get(reportRef);
            const place = await transaction.get(placeRef);
            if (report.data().status !== "pending") throw new Error("test report must be pending");
            transaction.update(placeRef, { address: "Updated test address", area: "Updated test area" });
            transaction.update(reportRef, {
              status: "approved", reviewDecision: "approved", reviewedAt: serverTimestamp(),
              reviewedBy: adminUid, rejectionReason: null,
              appliedChanges: { address: "Updated test address", area: "Updated test area" },
            });
            assert.equal(place.data().name, "Verification test place");
          });
          const place = await getDoc(doc(adminDb, "places/verification-place-test"));
          assert.equal(place.data().address, "Updated test address");
          assert.equal(place.data().area, "Updated test area");
          assert.equal(place.data().name, "Verification test place");
        },
      },
      {
        name: "30. Admin cannot re-review a report or change fields outside the selected report fields",
        run: async () => {
          await assertFails(updateDoc(doc(adminDb, "reports/valid-place-details-test"), {
            status: "rejected", reviewDecision: "rejected", reviewedAt: serverTimestamp(),
            reviewedBy: adminUid, rejectionReason: "Changed my mind", appliedChanges: null,
          }));
          await assertSucceeds(setDoc(doc(publicDb, "reports/invalid-approval-test"), makeValidReport()));
          await assertFails(runTransaction(adminDb, async transaction => {
            transaction.update(doc(adminDb, "places/verification-place-test"), {
              name: "Unrelated place rename", address: "Another address", area: "Another area",
            });
            transaction.update(doc(adminDb, "reports/invalid-approval-test"), {
              status: "approved", reviewDecision: "approved", reviewedAt: serverTimestamp(),
              reviewedBy: adminUid, rejectionReason: null,
              appliedChanges: { address: "Another address", area: "Another area" },
            });
          }));
        },
      },
      {
        name: "31. Admin rejection requires a reason and preserves the place document",
        run: async () => {
          const reportRef = doc(adminDb, "reports/rejection-test");
          await assertSucceeds(setDoc(doc(publicDb, "reports/rejection-test"), makeValidReport()));
          await assertFails(updateDoc(reportRef, {
            status: "rejected", reviewDecision: "rejected", reviewedAt: serverTimestamp(),
            reviewedBy: adminUid, rejectionReason: "", appliedChanges: null,
          }));
          await assertFails(updateDoc(reportRef, {
            status: "rejected", reviewDecision: "rejected", reviewedAt: serverTimestamp(),
            reviewedBy: adminUid, rejectionReason: "   ", appliedChanges: null,
          }));
          await assertSucceeds(updateDoc(reportRef, {
            status: "rejected", reviewDecision: "rejected", reviewedAt: serverTimestamp(),
            reviewedBy: adminUid, rejectionReason: "The listed information could not be verified.", appliedChanges: null,
          }));
        },
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
