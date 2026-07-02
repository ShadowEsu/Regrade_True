import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { ApiError } from "../http/errors.js";

function principalId(req: Request): string {
  const id = (req as Request & { auth?: { principalId: string | null } }).auth?.principalId;
  return id ?? `ip_${req.ip ?? "unknown"}`;
}

/**
 * Per-principal limiter for LLM-backed routes. Each route gets its own named
 * bucket — a burst of chat messages must not starve document analysis, and
 * vice versa.
 */
export function buildAiRateLimiter(options: {
  name: string;
  windowMs: number;
  limit: number;
  message: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => `${options.name}:${principalId(req)}`,
    handler: (_req: Request, _res: Response) => {
      throw new ApiError({
        status: 429,
        code: "RATE_LIMITED",
        message: options.message,
        expose: true
      });
    }
  });
}

/** Expensive full-document analysis — the tightest bucket. */
export function buildHeavyAiRateLimiter() {
  return buildAiRateLimiter({
    name: "heavy",
    windowMs: 15 * 60_000,
    limit: 12,
    message: "Too many AI requests. Please wait a few minutes and try again."
  });
}

/** Conversational assistant — cheaper per call, so a roomier bucket. */
export function buildChatRateLimiter() {
  return buildAiRateLimiter({
    name: "chat",
    windowMs: 10 * 60_000,
    limit: 40,
    message: "You're sending messages very quickly. Wait a moment and try again."
  });
}

/** Pre-flight security scans — runs before analyze and chat, so roomiest. */
export function buildScanRateLimiter() {
  return buildAiRateLimiter({
    name: "scan",
    windowMs: 10 * 60_000,
    limit: 60,
    message: "Too many requests. Please wait a moment and try again."
  });
}
