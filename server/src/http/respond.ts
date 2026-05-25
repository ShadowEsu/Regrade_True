import type { Response } from "express";
import { ApiError } from "./errors.js";

export function respondError(res: Response, err: ApiError, requestId?: string) {
  const expose = err.expose !== false;
  res.status(err.status).json({
    error: {
      code: err.code,
      message: expose ? err.message : "Request failed.",
      requestId: requestId ?? null,
      details: expose ? (err.details ?? null) : null
    }
  });
}

