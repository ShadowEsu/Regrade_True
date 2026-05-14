import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { ApiError } from "../http/errors.js";
import type { Env } from "../env.js";

function getClientIp(req: Request): string {
  // Express trust proxy is enabled in app; this will honor X-Forwarded-For correctly.
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  return ip;
}

function principalId(req: Request): string | null {
  return (req as Request & { auth?: { principalId: string | null } }).auth?.principalId ?? null;
}

export function buildRateLimiters(env: Env) {
  const ipLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_IP_WINDOW_MS,
    limit: env.RATE_LIMIT_IP_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => `ip:${getClientIp(req)}`,
    handler: (_req: Request, _res: Response) => {
      throw new ApiError({
        status: 429,
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again shortly.",
        expose: true
      });
    }
  });

  const userLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_USER_WINDOW_MS,
    limit: env.RATE_LIMIT_USER_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    // If no principal, fallback to IP bucket (still works in “public” mode).
    keyGenerator: (req: Request) => `user:${principalId(req) ?? `ip_${getClientIp(req)}`}`,
    handler: (_req: Request, _res: Response) => {
      throw new ApiError({
        status: 429,
        code: "RATE_LIMITED",
        message: "Too many requests for this client. Please slow down.",
        expose: true
      });
    }
  });

  return { ipLimiter, userLimiter };
}

