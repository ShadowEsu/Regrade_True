import admin from "firebase-admin";
import { ensureFirebaseAdmin } from "./firebaseAdmin.js";

const BATCH_SIZE = 450;

/** Deletes all Firestore data for a user, then removes the Firebase Auth record. */
export async function deleteUserAccountCompletely(uid: string): Promise<void> {
  ensureFirebaseAdmin();
  const db = admin.firestore();

  const casesSnap = await db.collection("cases").where("userId", "==", uid).get();
  const caseDocs = casesSnap.docs;

  for (let i = 0; i < caseDocs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const doc of caseDocs.slice(i, i + BATCH_SIZE)) {
      batch.delete(doc.ref);
    }
    await batch.commit();
  }

  const userRef = db.doc(`users/${uid}`);
  const userSnap = await userRef.get();
  if (userSnap.exists) {
    await userRef.delete();
  }

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
