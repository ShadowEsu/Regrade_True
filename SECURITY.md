# Security

Regrade handles student coursework and grade data. Treat production configuration as sensitive.

## Architecture

- **Browser** — Firebase Auth only; no Gemini or provider secret keys in the client bundle.
- **API** (`server/`) — Verifies Firebase ID tokens on `/v1/gemini/*`; enforces `aiConsentAt` in Firestore before AI calls; provider keys live in `server/.env` only.
- **Firestore** — Default deny; owner-scoped reads/writes with field allowlists (`firestore.rules`).

## Production checklist

1. **`CORS_ORIGIN`** — Comma-separated hosting origins only (never `*` in production). See `server/.env.example`.
2. **`GEMINI_API_KEY`** — Required when `NODE_ENV=production`.
3. **`FIREBASE_SERVICE_ACCOUNT_JSON`** or **`GOOGLE_APPLICATION_CREDENTIALS`** — Required in production; server fails fast at startup if missing.
4. **`API_KEYS`** — Required for `POST /v1/feedback` in production (or the route returns 503).
5. Production builds never include simulated users, cases, connector success, billing, or AI results.
6. **Restrict Firebase web API key** in Google Cloud Console (HTTP referrers / app IDs).
7. **Deploy Firestore rules** after changes: `npm run deploy:rules`.
8. **Deploy hosting headers** after changes: `npm run deploy:hosting`.
9. **`CONNECTIONS_ENC_KEY`**, **`FAMILY_PAIRING_PEPPER`**, and **`CRON_SECRET`** — Required in production and kept only in the server secret manager.
10. **Pre-publish scan** — Run `bash scripts/check-secrets.sh`; inspect Git history separately.

## Controls implemented

| Layer | Control |
|-------|---------|
| API auth | Firebase JWT on AI routes; preview/fake tokens rejected |
| AI consent | Server checks Firestore `aiConsentAt` before `/v1/gemini/*` |
| Email verification | Email/password users blocked until `emailVerified` (OAuth exempt) |
| Rate limit | Global IP + per-user; stricter bucket on analyze/advocate |
| Input | Zod validation, control-char stripping, image MIME allowlist |
| Security scan | Regex pre-check; LLM scan fail-closed on server; production fails closed if API unreachable |
| Client upload | File size cap, SVG blocked, type gate |
| XSS | DOMPurify on profile, notes, chat, and appeal drafts |
| Firestore | Field allowlists, email immutable, bounded string sizes on cases |
| Hosting | HSTS, CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy |
| API transport | Helmet HSTS in production |

## Reporting issues

Email security concerns to the address in `package.json` (`bugs.url`) without including real student documents or API keys.
