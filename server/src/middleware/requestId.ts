import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";

export function requestId(req: Request, res: Response, next: NextFunction) {
  const id =
    (req.headers["x-request-id"] as string | undefined) ??
    (crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex"));
  (req as Request & { requestId?: string }).requestId = id;
  res.setHeader("x-request-id", id);
  next();
}

