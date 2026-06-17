import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { loadEnv } from "./env.js";
import { ApiError, isApiError } from "./http/errors.js";
import { respondError } from "./http/respond.js";
import { requestId } from "./middleware/requestId.js";
import { authFromApiKeys } from "./middleware/auth.js";
import { buildRateLimiters } from "./middleware/rateLimit.js";
import { z } from "zod";
import { validate } from "./middleware/validate.js";
import { requireFirebaseUser } from "./middleware/firebaseAuth.js";
import { requireAiConsent } from "./middleware/requireAiConsent.js";
import { createRegradeGeminiRouter } from "./regradeGemini.js";
import { deleteUserAccountCompletely } from "./accountDeletion.js";
import { ensureFirebaseAdmin } from "./firebaseAdmin.js";

const env = loadEnv();

if (env.NODE_ENV === "production") {
  ensureFirebaseAdmin();
}

if (env.NODE_ENV !== "production" && !env.GEMINI_API_KEY.trim()) {
  // eslint-disable-next-line no-console
  console.warn(
    "[regrade-api] GEMINI_API_KEY is empty — /v1/gemini/* returns 503 until you set server/.env"
  );
}

const app = express();

// Needed for correct IP-based rate limiting behind proxies (Fly, Render, Nginx, Cloudflare, etc.).
app.set("trust proxy", 1);

app.use(requestId);
app.use(
  helmet({
    contentSecurityPolicy: false,
    hsts: env.NODE_ENV === "production" ? { maxAge: 31_536_000, includeSubDomains: true } : false
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["authorization", "content-type", "x-request-id"]
  })
);

// Rate limiting: IP + Firebase uid when present (applied before body parsers).
const { ipLimiter, userLimiter } = buildRateLimiters(env);
app.use(ipLimiter);
app.use(userLimiter);

// Health (public)
app.get("/health", (_req, res) => res.json({ ok: true }));

// Gemini proxy: large JSON — must run before the global 64kb parser.
app.use(
  "/v1/gemini",
  express.json({ limit: "25mb", type: ["application/json", "application/*+json"] }),
  requireFirebaseUser,
  requireAiConsent,
  createRegradeGeminiRouter(env)
);

app.use(express.json({ limit: "64kb", type: ["application/json", "application/*+json"] }));

// Example “public endpoint” with strict validation/sanitization.
// (Keeps the API useful even before you wire the mobile app to it.)
const FeedbackSchema = z.object({
  kind: z.enum(["bug", "idea", "content"]),
  message: z.string().min(3).max(2_000),
  context: z
    .object({
      platform: z.string().min(1).max(40).optional(),
      commandId: z.string().min(1).max(120).optional()
    })
    .optional()
});

// Account deletion — App Store §5.1.1(v) / Google Play account-deletion policy.
app.delete("/v1/account", requireFirebaseUser, (req, res, next) => {
  void (async () => {
    try {
      const uid = (req as express.Request & { firebase?: { uid: string } }).firebase?.uid;
      if (!uid) {
        next(new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Not signed in." }));
        return;
      }
      await deleteUserAccountCompletely(uid);
      res.status(200).json({ deleted: true });
    } catch (err) {
      next(err);
    }
  })();
});

app.post("/v1/feedback", authFromApiKeys(env.API_KEYS), validate(FeedbackSchema, "body"), (req, res) => {
  const body = req.body as z.infer<typeof FeedbackSchema>;

  // Secure API key handling:
  // - Never echo Authorization header or key material.
  // - Don’t log raw user input here either; wire to a proper sink later.
  // For now we accept and acknowledge.
  res.status(202).json({ accepted: true, kind: body.kind });
});

app.use((_req, _res, next) => next(new ApiError({ status: 404, code: "NOT_FOUND", message: "Not found." })));

app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const requestId = (req as any).requestId as string | undefined;

  if (isApiError(err)) {
    // Graceful 4xx/429 with consistent JSON structure
    return respondError(res, err, requestId);
  }

  // Avoid leaking sensitive details
  const fallback = new ApiError({
    status: 500,
    code: "INTERNAL",
    message: "Unexpected error.",
    expose: false
  });

  // In prod, don’t log request bodies or headers (may contain secrets).
  if (env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  respondError(res, fallback, requestId);
});

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`regrade-api listening on :${env.PORT}`);
});

