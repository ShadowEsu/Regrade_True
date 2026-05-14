# Regrade Server (API)

This is the small Express API that the Regrade web and mobile clients call.
It exists because the **Gemini API key must never reach the browser**. The
server holds the key, verifies a Firebase ID token on every protected
request, and proxies a narrow set of endpoints to Google Gemini.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET` | `/health` | public | Uptime probe. |
| `POST` | `/v1/gemini/analyze` | Firebase ID token (Bearer) | Run the comprehensive analysis on a submitted assignment + rubric + feedback + optional inline images. Returns a structured `AnalysisResult` JSON. |
| `POST` | `/v1/gemini/advocate` | Firebase ID token (Bearer) | One-turn-at-a-time chat with the Regrade appeal assistant. |
| `POST` | `/v1/gemini/security-scan` | Firebase ID token (Bearer) | Lightweight content-safety screen on user-supplied text. |
| `POST` | `/v1/feedback` | optional API key | Minimal feedback intake. Off by default. |

## Run locally

```bash
cd server
npm install
cp .env.example .env   # fill GEMINI_API_KEY and Firebase Admin credentials
npm run dev            # tsx watch, defaults to http://localhost:8787
```

The Vite dev server proxies `/api/*` to this port, so the web client uses
`/api/v1/gemini/...` with no extra config.

## Required configuration (`server/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | yes | Google AI Studio key. Server-only. |
| `GOOGLE_APPLICATION_CREDENTIALS` | one-of | Path to the Firebase Admin service-account JSON (recommended for local dev). |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | one-of | The same JSON pasted as a single line (recommended for hosted production). |
| `PORT` | no | Defaults to `8787`. |
| `NODE_ENV` | no | `development` or `production`. Controls logging verbosity. |
| `CORS_ORIGIN` | no | `*` for dev; comma-separated allowlist for production. Capacitor needs `capacitor://localhost` and `https://localhost` in this list. |
| `API_KEYS` | no | Comma-separated static keys for `/v1/feedback` only. |
| `RATE_LIMIT_IP_WINDOW_MS`, `RATE_LIMIT_IP_MAX` | no | Per-IP rate limit. Defaults: 60_000 / 120. |
| `RATE_LIMIT_USER_WINDOW_MS`, `RATE_LIMIT_USER_MAX` | no | Per-Firebase-user rate limit. Defaults: 60_000 / 240. |

Without `GEMINI_API_KEY` the server refuses to start. Without a Firebase
Admin credential, every `/v1/gemini/*` request returns 500 at first call.

## Security posture

- **Helmet** standard headers on every response.
- **Helmet CSP disabled here** on purpose — this is an API-only server, the
  CSP lives on the frontend host (Firebase Hosting).
- **Zod validation** + **conservative string sanitization** on every body
  before it touches Gemini (`middleware/validate.ts`).
- **Per-IP and per-Firebase-uid rate limits** (`middleware/rateLimit.ts`).
- **Firebase ID token verification** required on every `/v1/gemini/*` route
  (`middleware/firebaseAuth.ts`).
- **Request IDs** logged in/out for correlation (`middleware/requestId.ts`).
- **No request bodies logged in production** (see error handler in
  `src/index.ts`).

## Build for production

```bash
npm run build   # tsc -p tsconfig.json → dist/
npm start       # node dist/index.js
```

Deploy `dist/` to any Node host (Render, Fly.io, Cloud Run). The Firebase
Hosting site cannot run this server — it serves only static files.
