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
import { createConnectionsRouter } from "./connections.js";
import { deleteUserAccountCompletely } from "./accountDeletion.js";
import { ensureFirebaseAdmin } from "./firebaseAdmin.js";
import { createBillingRouter, createRevenueCatWebhookHandler, createStripeWebhookHandler, deleteExternalBillingProfile } from "./billing.js";
import { createAutomationRouter } from "./automation.js";
import { requireAppCheck } from "./middleware/appCheck.js";
import { createFamilyRouter } from "./family.js";
import { createConnectorImportsRouter } from "./connectorImports.js";
import { automaticConnectorJob } from "./jobs.js";
import admin from "./admin.js";

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
const appCheck = requireAppCheck(env);

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
    allowedHeaders: ["authorization", "content-type", "x-request-id", "x-firebase-appcheck"]
  })
);

// Rate limiting: IP + Firebase uid when present (applied before body parsers).
const { ipLimiter, userLimiter } = buildRateLimiters(env);
app.use(ipLimiter);

// Health (public)
app.get("/health", (_req, res) => res.json({ ok: true }));

// Stripe must receive the exact raw request bytes so its signature can be verified.
app.post("/v1/billing/webhook", express.raw({ type: "application/json" }), createStripeWebhookHandler(env));
app.post("/v1/billing/revenuecat/webhook", express.json({ limit: "64kb" }), createRevenueCatWebhookHandler(env));
app.post("/v1/jobs/connector-imports", automaticConnectorJob(env));

// Gemini proxy: large JSON — must run before the global 64kb parser.
app.use(
  "/v1/gemini",
  express.json({ limit: "25mb", type: ["application/json", "application/*+json"] }),
  requireFirebaseUser,
  appCheck,
  userLimiter,
  requireAiConsent,
  createRegradeGeminiRouter(env)
);

app.use(express.json({ limit: "64kb", type: ["application/json", "application/*+json"] }));

app.use("/v1/billing", requireFirebaseUser, appCheck, userLimiter, createBillingRouter(env));
app.use("/v1/automation", requireFirebaseUser, appCheck, userLimiter, createAutomationRouter());
app.use("/v1/family", requireFirebaseUser, appCheck, userLimiter, createFamilyRouter(env));
app.use("/v1/imports", requireFirebaseUser, appCheck, userLimiter, createConnectorImportsRouter(env));

app.post("/v1/session/logout", requireFirebaseUser, appCheck, userLimiter, (req, res, next) => {
  void (async () => {
    const uid = (req as express.Request & { firebase?: { uid?: string } }).firebase?.uid;
    if (!uid) throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Not signed in." });
    await admin.auth().revokeRefreshTokens(uid);
    res.json({ signedOut: true });
  })().catch(next);
});

// Platform connections: encrypted credential store + Canvas token verify.
// This route has a small JSON payload (tokens and connection metadata). It
// needs its own parser because the global parser is intentionally mounted
// later with a much smaller limit.
app.use(
  "/v1/connections",
  express.json({ limit: "16kb", type: ["application/json", "application/*+json"] }),
  requireFirebaseUser,
  appCheck,
  userLimiter,
  createConnectionsRouter(env)
);

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

const AiFeedbackSchema = z.object({
  reason: z.enum(["inappropriate_or_inaccurate"]),
  excerpt: z.string().min(1).max(500),
});

app.post("/v1/ai-feedback", requireFirebaseUser, appCheck, userLimiter, validate(AiFeedbackSchema, "body"), (req, res, next) => {
  void (async () => {
    const uid = (req as express.Request & { firebase?: { uid?: string } }).firebase?.uid;
    if (!uid) throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Not signed in." });
    const body = req.body as z.infer<typeof AiFeedbackSchema>;
    await admin.firestore().collection("aiFeedback").add({ uid, ...body, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    res.status(202).json({ accepted: true });
  })().catch(next);
});

// Account deletion — App Store §5.1.1(v) / Google Play account-deletion policy.
app.delete("/v1/account", requireFirebaseUser, appCheck, userLimiter, (req, res, next) => {
  void (async () => {
    try {
      const uid = (req as express.Request & { firebase?: { uid: string } }).firebase?.uid;
      if (!uid) {
        next(new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Not signed in." }));
        return;
      }
      await deleteExternalBillingProfile(uid, env);
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
