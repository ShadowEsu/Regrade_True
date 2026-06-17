import type { NextFunction, Request, Response } from "express";
import admin from "firebase-admin";
import { ApiError } from "../http/errors.js";
import { ensureFirebaseAdmin } from "../firebaseAdmin.js";

/** Blocks /v1/gemini/* until the user has aiConsentAt in Firestore (App Store third-party AI rule). */
export function requireAiConsent(req: Request, _res: Response, next: NextFunction): void {
  void (async () => {
    const uid = (req as Request & { firebase?: { uid: string } }).firebase?.uid;
    if (!uid) {
      next(new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Not signed in." }));
      return;
    }

    try {
      ensureFirebaseAdmin();
      const snap = await admin.firestore().doc(`users/${uid}`).get();
      const consent = snap.exists ? snap.data()?.aiConsentAt : undefined;
      if (!consent) {
        next(
          new ApiError({
            status: 403,
            code: "FORBIDDEN",
            message: "Accept AI processing in the app before using analysis features.",
            expose: true
          })
        );
        return;
      }
      next();
    } catch {
      next(
        new ApiError({
          status: 503,
          code: "SERVICE_UNAVAILABLE",
          message: "Could not verify AI consent. Try again shortly.",
          expose: true
        })
      );
    }
  })();
}
