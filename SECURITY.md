# Security

Regrade handles student coursework and grade data. Treat production configuration as sensitive.

## Architecture

- **Browser** — Firebase Auth only; no Gemini/Anthropic keys in the client bundle.
- **API** (`server/`) — Verifies Firebase ID tokens on `/v1/gemini/*`; provider keys live in `server/.env` only.
- **Firestore** — Default deny; owner-scoped reads/writes with field allowlists (`firestore.rules`).

## Production checklist

1. **`CORS_ORIGIN`** — Comma-separated hosting origins only (never `*` in production). See `server/.env.example`.
2. **`GEMINI_API_KEY`** — Required when `NODE_ENV=production`.
3. **`FIREBASE_SERVICE_ACCOUNT_JSON`** or **`GOOGLE_APPLICATION_CREDENTIALS`** — Admin SDK for token verification.
4. **`API_KEYS`** — Required for `POST /v1/feedback` in production (or the route returns 503).
5. **Do not ship** `VITE_PREVIEW_MODE=true` in production builds.
6. **Restrict Firebase web API key** in Google Cloud Console (HTTP referrers / app IDs).
7. **Deploy Firestore rules** after changes: `npm run deploy:rules`.

## Controls implemented

| Layer | Control |
|-------|---------|
| API auth | Firebase JWT on AI routes; preview/fake tokens rejected |
| Rate limit | Global IP + per-user; stricter bucket on analyze/advocate |
| Input | Zod validation, control-char stripping, image MIME allowlist |
| Security scan | Regex pre-check; LLM scan fail-closed on server; appeals fail-closed if scan API fails |
| Client upload | File size cap, SVG blocked, type gate |
| XSS | DOMPurify on profile + notes/chat text; React escaping elsewhere |
| Firestore | Field allowlists, email immutable, bounded string sizes on cases |

## Reporting issues

Email security concerns to the address in `package.json` (`bugs.url`) without including real student documents or API keys.
