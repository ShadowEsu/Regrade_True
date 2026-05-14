import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { ApiError } from "../http/errors.js";

export type AuthContext = {
  /** Stable identifier used for user-based rate limiting (never the raw key). */
  principalId: string | null;
};

function parseBearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m?.[1]?.trim() || null;
}

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 32);
}

export function authFromApiKeys(apiKeysCsv: string | undefined) {
  const allowed = new Set(
    (apiKeysCsv ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

  return function auth(req: Request, _res: Response, next: NextFunction) {
    // If no keys configured, treat as public (still rate-limited by IP).
    if (allowed.size === 0) {
      (req as Request & { auth?: AuthContext }).auth = { principalId: null };
      return next();
    }

    const key = parseBearer(req);
    if (!key) {
      return next(new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Missing Bearer token." }));
    }
    if (!allowed.has(key)) {
      return next(new ApiError({ status: 403, code: "FORBIDDEN", message: "Invalid API key." }));
    }

    (req as Request & { auth?: AuthContext }).auth = { principalId: `key_${hashKey(key)}` };
    next();
  };
}

