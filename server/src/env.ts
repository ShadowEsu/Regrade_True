import { z } from "zod";

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(8787),
    CORS_ORIGIN: z.string().default("*"),
    /**
     * Google AI Studio / Gemini API key — server only; never expose to the browser.
     * In development, may be left empty so the process still listens on PORT;
     * `/v1/gemini/*` then returns 503 until configured. Required in production.
     */
    GEMINI_API_KEY: z.string().default(""),
    /** Stripe Billing is optional in local preview and required before paid plans can activate. */
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_STUDENT_PRICE_ID: z.string().optional(),
    STRIPE_PRO_PRICE_ID: z.string().optional(),
    BILLING_RETURN_URL: z.string().url().default("http://localhost:3000/app"),
  /**
   * Optional: comma-separated API keys for simple auth.
   * Prefer a real auth system later; this is for “public endpoints” protection now.
   */
  API_KEYS: z.string().optional(),
  /**
   * Base64 of 32 random bytes. Encrypts stored platform credentials
   * (AES-256-GCM). When absent, /v1/connections returns 503 and nothing is
   * stored. Generate with: openssl rand -base64 32
   */
  CONNECTIONS_ENC_KEY: z.string().optional(),
  /** Firebase Admin SDK — paste single-line JSON (production: required). */
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  /** Firebase Admin SDK — path to service account .json (alternative to JSON env var). */
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  /**
   * Rate limiting defaults (per-IP and per-user key).
   */
  RATE_LIMIT_IP_WINDOW_MS: z.coerce.number().int().min(1_000).default(60_000),
  RATE_LIMIT_IP_MAX: z.coerce.number().int().min(1).default(120),
  RATE_LIMIT_USER_WINDOW_MS: z.coerce.number().int().min(1_000).default(60_000),
  RATE_LIMIT_USER_MAX: z.coerce.number().int().min(1).default(240)
})
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production" && !data.GEMINI_API_KEY.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "GEMINI_API_KEY is required in production",
        path: ["GEMINI_API_KEY"]
      });
    }
    if (data.NODE_ENV === "production" && data.CORS_ORIGIN.trim() === "*") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Set CORS_ORIGIN to your hosting URL(s) in production — wildcard is not allowed",
        path: ["CORS_ORIGIN"]
      });
    }
    if (data.NODE_ENV === "production" && !(data.API_KEYS ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "API_KEYS is required in production for POST /v1/feedback (or remove that route)",
        path: ["API_KEYS"]
      });
    }
    if (data.NODE_ENV === "production") {
      const hasAdmin =
        Boolean((data.FIREBASE_SERVICE_ACCOUNT_JSON ?? "").trim()) ||
        Boolean((data.GOOGLE_APPLICATION_CREDENTIALS ?? "").trim());
      if (!hasAdmin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS is required in production",
          path: ["FIREBASE_SERVICE_ACCOUNT_JSON"]
        });
      }
    }
  });

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(input: Record<string, string | undefined> = process.env): Env {
  const parsed = EnvSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join(".") || "env"}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment:\n${message}`);
  }
  return parsed.data;
}
