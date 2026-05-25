import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { ApiError } from "../http/errors.js";

function principalId(req: Request): string {
  const id = (req as Request & { auth?: { principalId: string | null } }).auth?.principalId;
  return id ?? `ip_${req.ip ?? "unknown"}`;
}

/** Expensive Gemini routes — tighter than global IP/user buckets. */
export function buildHeavyAiRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60_000,
    limit: 12,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => `heavy:${principalId(req)}`,
    handler: (_req: Request, _res: Response) => {
      throw new ApiError({
        status: 429,
        code: "RATE_LIMITED",
        message: "Too many AI requests. Please wait a few minutes and try again.",
        expose: true
      });
    }
  });
}
