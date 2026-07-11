import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAppCheck } from "firebase-admin/app-check";

/** Small compatibility facade while keeping the application on Firebase Admin's
 * modular v14 API. It centralizes service access and avoids hidden global clients. */
const firestore = Object.assign(() => getFirestore(), { FieldValue, Timestamp });

const admin = {
  initializeApp,
  credential: { cert },
  firestore,
  auth: getAuth,
  storage: getStorage,
  appCheck: getAppCheck,
};

export default admin;
