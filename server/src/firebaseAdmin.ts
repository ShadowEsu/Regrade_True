import fs from "node:fs";
import path from "node:path";
import admin from "./admin.js";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { ServiceAccount } from "firebase-admin/app";

let initialized = false;

/** Lazily init — avoids crashing server startup when only /health is needed locally. */
export function ensureFirebaseAdmin(): void {
  if (initialized) return;

  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  let credJson: Record<string, unknown>;

  if (rawJson) {
    try {
      credJson = JSON.parse(rawJson) as Record<string, unknown>;
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON.");
    }
  } else if (credPath) {
    const abs = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), credPath);
    try {
      credJson = JSON.parse(fs.readFileSync(abs, "utf8")) as Record<string, unknown>;
    } catch {
      throw new Error(
        `Could not read GOOGLE_APPLICATION_CREDENTIALS file: ${abs}. Use the JSON key from Firebase Console → Project settings → Service accounts.`
      );
    }
  } else {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON (single-line JSON) or GOOGLE_APPLICATION_CREDENTIALS (path to the service account .json file). Project settings → Service accounts → Generate new private key."
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert(credJson as ServiceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET?.trim() || undefined,
  });
  initialized = true;
}

export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  ensureFirebaseAdmin();
  // checkRevoked closes sessions immediately after server-side logout/account deletion.
  return admin.auth().verifyIdToken(idToken, true);
}
