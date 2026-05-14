import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../http/errors.js";
import { verifyIdToken } from "../firebaseAdmin.js";

export type FirebaseAuthContext = {
  uid: string;
};

function parseBearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m?.[1]?.trim() || null;
}

/** Express 4-safe async middleware (promises are not auto-caught). */
export function requireFirebaseUser(req: Request, _res: Response, next: NextFunction): void {
  void (async () => {
    const token = parseBearer(req);
    if (!token) {
      next(new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Missing Firebase ID token." }));
      return;
    }

    try {
      const decoded = await verifyIdToken(token);
      (req as Request & { firebase?: FirebaseAuthContext }).firebase = { uid: decoded.uid };
      (req as Request & { auth?: { principalId: string | null } }).auth = {
        principalId: `fb_${decoded.uid}`
      };
      next();
    } catch {
      next(
        new ApiError({
          status: 401,
          code: "INVALID_TOKEN",
          message: "Invalid or expired sign-in. Please refresh the page and sign in again."
        })
      );
    }
  })();
}
