import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../http/errors.js";

function sanitizeString(input: string): string {
  // Keep this conservative: trim, normalize whitespace, remove control chars.
  const noCtl = input.replace(/[\u0000-\u001F\u007F]/g, "");
  return noCtl.replace(/\s+/g, " ").trim();
}

function sanitizeUnknown(x: unknown): unknown {
  if (typeof x === "string") return sanitizeString(x);
  if (Array.isArray(x)) return x.map(sanitizeUnknown);
  if (x && typeof x === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(x)) out[k] = sanitizeUnknown(v);
    return out;
  }
  return x;
}

export function validate<T extends z.ZodTypeAny>(schema: T, source: "body" | "query" | "params" = "body") {
  return function validateMiddleware(req: Request, _res: Response, next: NextFunction) {
    const raw = (req as any)[source];
    const sanitized = sanitizeUnknown(raw);
    const parsed = schema.safeParse(sanitized);
    if (!parsed.success) {
      return next(
        new ApiError({
          status: 400,
          code: "BAD_REQUEST",
          message: "Invalid request input.",
          details: parsed.error.flatten(),
          expose: true
        })
      );
    }
    (req as any)[source] = parsed.data;
    next();
  };
}

