import admin from "./admin.js";
import { ensureFirebaseAdmin } from "./firebaseAdmin.js";

const BATCH_SIZE = 450;

/** Deletes all Firestore data for a user, then removes the Firebase Auth record. */
export async function deleteUserAccountCompletely(uid: string): Promise<void> {
  ensureFirebaseAdmin();
  const db = admin.firestore();

  if (process.env.FIREBASE_STORAGE_BUCKET?.trim()) {
    await admin.storage().bucket().deleteFiles({ prefix: `users/${uid}/` });
  }

  for (const [collectionName, ownerField] of [["cases", "userId"], ["aiFeedback", "uid"]] as const) {
    const owned = await db.collection(collectionName).where(ownerField, "==", uid).get();
    if (collectionName === "cases") {
      for (const caseDoc of owned.docs) await db.recursiveDelete(caseDoc.ref);
      continue;
    }
    for (let i = 0; i < owned.docs.length; i += BATCH_SIZE) {
      const batch = db.batch();
      for (const doc of owned.docs.slice(i, i + BATCH_SIZE)) batch.delete(doc.ref);
      await batch.commit();
    }
  }

  const [learnerLinks, supervisorLinks, pairingCodes] = await Promise.all([
    db.collection("supervisionLinks").where("learnerUid", "==", uid).get(),
    db.collection("supervisionLinks").where("supervisorUid", "==", uid).get(),
    db.collection("pairingCodes").where("learnerUid", "==", uid).get(),
  ]);
  for (const link of [...learnerLinks.docs, ...supervisorLinks.docs]) await db.recursiveDelete(link.ref);
  if (!pairingCodes.empty) {
    const batch = db.batch();
    pairingCodes.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  // Firestore does not cascade deletes. recursiveDelete removes billing periods,
  // connector credentials, pairing records, and any future user subcollections.
  await db.recursiveDelete(db.doc(`users/${uid}`));

  try {
    await admin.auth().deleteUser(uid);
  } catch (err: unknown) {
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? String((err as { code?: string }).code)
        : "";
    if (code !== "auth/user-not-found") {
      throw err;
    }
  }
}
