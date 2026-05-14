import type { Response } from "express";
import { ApiError } from "./errors.js";

export function respondError(res: Response, err: ApiError, requestId?: string) {
  res.status(err.status).json({
    error: {
      code: err.code,
      message: err.message,
      requestId: requestId ?? null,
      details: err.details ?? null
    }
  });
}

