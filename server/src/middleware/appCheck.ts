import type { NextFunction, Request, Response } from "express";
import admin from "../admin.js";
import type { Env } from "../env.js";
import { ApiError } from "../http/errors.js";

export function requireAppCheck(env: Env) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!env.ENFORCE_APP_CHECK) return next();
    const token = req.header("X-Firebase-AppCheck");
    if (!token) return next(new ApiError({ status: 401, code: "UNAUTHORIZED", message: "App verification is required." }));
    void admin.appCheck().verifyToken(token)
      .then(() => next())
      .catch(() => next(new ApiError({ status: 401, code: "UNAUTHORIZED", message: "App verification failed." })));
  };
}
