import crypto from "node:crypto";
import { Router } from "express";
import admin from "firebase-admin";
import { z } from "zod";
import type { Env } from "./env.js";
import { ApiError } from "./http/errors.js";
import { validate } from "./middleware/validate.js";

/**
 * Encrypted platform-credential store.
 * - Secrets arrive in the request body over TLS, never in a URL.
 * - At rest they are AES-256-GCM encrypted with CONNECTIONS_ENC_KEY.
 * - GET never returns secret material, only labels and timestamps.
 * - DELETE removes the document immediately; revoke means gone, not disabled.
 */

const PLATFORM_IDS = [
  "gradescope",
  "canvas",
  "google_classroom",
  "google_drive",
  "onedrive",
  "dropbox",
  "apple_files",
  "blackboard",
  "moodle",
  "brightspace",
  "schoology",
  "powerschool",
  "turnitin",
  "teams_assignments",
  "sakai",
  "itslearning",
  "managebac",
  "open_edx",
  "fedena",
  "teachmint",
  "dingtalk",
  "lark",
  "wecom",
  "toddle",
  "edunext",
  "vidyalaya",
  "classter",
  "infinite_campus",
  "skyward",
  "alma",
  "veracross",
  "facts",
  "clever",
  "classlink",
  "google_workspace",
  "sharepoint",
  "box",
  "email_import"
] as const;

const SaveSchema = z.object({
  accountLabel: z.string().max(200).nullable().optional(),
  secret: z.string().min(1).max(8_000),
  meta: z.record(z.string().max(500)).optional()
});

const CanvasVerifySchema = z.object({
  baseUrl: z.string().min(8).max(300),
  token: z.string().min(20).max(500)
});

const PlatformParamSchema = z.object({
  platformId: z.enum(PLATFORM_IDS)
});

const PRIVATE_HOST_PATTERN =
  /^(localhost|.*\.local|.*\.internal|.*\.lan|127\..*|10\..*|192\.168\..*|172\.(1[6-9]|2\d|3[01])\..*|0\..*)$/i;
const IP_LITERAL = /^\d{1,3}(\.\d{1,3}){3}$/;

export function safeCanvasBaseUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "443") return null;
  const host = url.hostname.toLowerCase();
  if (!host.includes(".") || IP_LITERAL.test(host) || PRIVATE_HOST_PATTERN.test(host)) return null;
  return `https://${host}`;
}

interface EncryptedSecret {
  alg: "aes-256-gcm";
  iv: string;
  tag: string;
  ciphertext: string;
}

export function encryptSecret(key: Buffer, plaintext: string): EncryptedSecret {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64")
  };
}

export function decryptSecret(key: Buffer, sealed: EncryptedSecret): string {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(sealed.iv, "base64"));
  decipher.setAuthTag(Buffer.from(sealed.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(sealed.ciphertext, "base64")),
    decipher.final()
  ]).toString("utf8");
}

function loadKey(env: Env): Buffer | null {
  const raw = env.CONNECTIONS_ENC_KEY?.trim();
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  return key.length === 32 ? key : null;
}

function uidOf(req: unknown): string | null {
  const r = req as { firebase?: { uid?: string } };
  return r.firebase?.uid ?? null;
}

export function createConnectionsRouter(env: Env): Router {
  const r = Router();
  const key = loadKey(env);

  const requireKey = () => {
    if (!key) {
      throw new ApiError({
        status: 503,
        code: "SERVICE_UNAVAILABLE",
        message: "Credential storage is not configured on this server yet."
      });
    }
    return key;
  };

  const docRef = (uid: string, platformId: string) =>
    admin.firestore().collection("users").doc(uid).collection("connections").doc(platformId);

  r.get("/", (req, res, next) => {
    void (async () => {
      try {
        const uid = uidOf(req);
        if (!uid) throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Not signed in." });
        const snap = await admin
          .firestore()
          .collection("users")
          .doc(uid)
          .collection("connections")
          .get();
        const connections = snap.docs.map((d) => {
          const data = d.data() as { accountLabel?: string | null; createdAt?: string };
          return {
            platformId: d.id,
            accountLabel: data.accountLabel ?? null,
            connectedAt: data.createdAt ?? new Date(0).toISOString(),
            simulated: false
          };
        });
        res.json({ connections });
      } catch (err) {
        next(err);
      }
    })();
  });

  r.put("/:platformId", validate(PlatformParamSchema, "params"), validate(SaveSchema, "body"), (req, res, next) => {
    void (async () => {
      try {
        const uid = uidOf(req);
        if (!uid) throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Not signed in." });
        const platformId = (req.params as z.infer<typeof PlatformParamSchema>).platformId;
        const encKey = requireKey();
        const body = req.body as z.infer<typeof SaveSchema>;
        const sealed = encryptSecret(encKey, body.secret);
        await docRef(uid, platformId).set({
          accountLabel: body.accountLabel ?? null,
          meta: body.meta ?? {},
          secret: sealed,
          createdAt: new Date().toISOString()
        });
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    })();
  });

  r.delete("/:platformId", validate(PlatformParamSchema, "params"), (req, res, next) => {
    void (async () => {
      try {
        const uid = uidOf(req);
        if (!uid) throw new ApiError({ status: 401, code: "UNAUTHORIZED", message: "Not signed in." });
        const platformId = (req.params as z.infer<typeof PlatformParamSchema>).platformId;
        await docRef(uid, platformId).delete();
        res.status(204).end();
      } catch (err) {
        next(err);
      }
    })();
  });

  // Server-side verification so the token never has to hit Canvas from the
  // browser (Canvas does not serve CORS for arbitrary origins). SSRF-guarded.
  r.post("/canvas/verify", validate(CanvasVerifySchema, "body"), (req, res, next) => {
    void (async () => {
      try {
        const body = req.body as z.infer<typeof CanvasVerifySchema>;
        const base = safeCanvasBaseUrl(body.baseUrl);
        if (!base) {
          throw new ApiError({ status: 400, code: "BAD_REQUEST", message: "That address is not a valid Canvas site." });
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8_000);
        try {
          const upstream = await fetch(`${base}/api/v1/users/self`, {
            headers: { authorization: `Bearer ${body.token}` },
            redirect: "manual",
            signal: controller.signal
          });
          if (!upstream.ok) {
            res.json({ ok: false, name: null });
            return;
          }
          const profile = (await upstream.json()) as { name?: string };
          res.json({ ok: true, name: typeof profile.name === "string" ? profile.name : null });
        } finally {
          clearTimeout(timeout);
        }
      } catch (err) {
        if (err instanceof ApiError) next(err);
        else res.json({ ok: false, name: null });
      }
    })();
  });

  return r;
}
