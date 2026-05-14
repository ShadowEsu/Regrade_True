import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  CORS_ORIGIN: z.string().default("*"),
  /** Google AI Studio / Gemini API key — server only; never expose to the browser. */
  GEMINI_API_KEY: z.string().min(1),
  /**
   * Optional: comma-separated API keys for simple auth.
   * Prefer a real auth system later; this is for “public endpoints” protection now.
   */
  API_KEYS: z.string().optional(),
  /**
   * Rate limiting defaults (per-IP and per-user key).
   */
  RATE_LIMIT_IP_WINDOW_MS: z.coerce.number().int().min(1_000).default(60_000),
  RATE_LIMIT_IP_MAX: z.coerce.number().int().min(1).default(120),
  RATE_LIMIT_USER_WINDOW_MS: z.coerce.number().int().min(1_000).default(60_000),
  RATE_LIMIT_USER_MAX: z.coerce.number().int().min(1).default(240)
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

