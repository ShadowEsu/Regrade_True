# Production Environment Checklist

Never commit real values. Public `VITE_*` values are embedded in the client bundle; restrict their associated projects and OAuth applications. Server secrets must remain server-only.

## Client build

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Production/native | HTTPS Node API base URL |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web app public key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app identifier |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Exam page Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Push/analytics | Firebase sender identifier |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional | Firebase Analytics measurement ID |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | Yes | Usually `(default)` |
| `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` | Production | Firebase App Check public site key |
| `VITE_DROPBOX_APP_KEY` | Dropbox | Public OAuth app key |
| `VITE_MS_CLIENT_ID` | Microsoft | Public OAuth client ID |
| `VITE_REVENUECAT_APPLE_API_KEY` | iOS IAP | Public RevenueCat Apple SDK key |
| `VITE_REVENUECAT_GOOGLE_API_KEY` | Android IAP | Public RevenueCat Google SDK key |
| `VITE_IAP_STUDENT_PRODUCT_ID` | IAP | Student monthly store product |
| `VITE_IAP_PRO_PRODUCT_ID` | IAP | Pro monthly store product |

There is no simulated preview mode. Development and release builds use the same authentication, persistence, connector, billing, and AI service paths.

## Server

| Variable | Required | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | Server-only AI provider key |
| `GEMINI_MODEL` | Yes | Approved production model |
| `FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS` | Yes | Firebase Admin identity |
| `FIREBASE_STORAGE_BUCKET` | Yes | Server-side deletion/storage access |
| `CONNECTIONS_ENC_KEY` | Connectors | Base64-encoded 32-byte AES key for stored provider credentials |
| `REVENUECAT_SECRET_API_KEY` | Native subscriptions | Server entitlement verification |
| `REVENUECAT_WEBHOOK_AUTH` | Native subscriptions | RevenueCat webhook authentication |
| `REVENUECAT_STUDENT_ENTITLEMENT` | Native subscriptions | Student entitlement name |
| `REVENUECAT_PRO_ENTITLEMENT` | Native subscriptions | Pro entitlement name |
| `FAMILY_PAIRING_PEPPER` | Parent mode | Pairing-code hashing secret |
| `CRON_SECRET` | Automation | Scheduled import authentication |
| `CORS_ORIGIN` | Yes | Exact web and Capacitor origins; never `*` in production |
| `ENFORCE_APP_CHECK` | Yes after rollout | Enforces Firebase App Check |
| `API_KEYS` | Feedback endpoint | Restricted static keys if that endpoint remains enabled |
| `RATE_LIMIT_IP_WINDOW_MS` / `RATE_LIMIT_IP_MAX` | Recommended | Per-IP API limits |
| `RATE_LIMIT_USER_WINDOW_MS` / `RATE_LIMIT_USER_MAX` | Recommended | Per-user API limits |
| `PORT` | Host-specific | API listener port |
| `NODE_ENV` | Yes | Must be `production` |

Optional web-only Stripe billing variables are `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_STUDENT_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, and `BILLING_RETURN_URL`. They must not replace Apple/Google in-app purchase for native digital subscriptions.

Stripe variables remain in the server example for web billing. Native digital subscriptions must use Apple/Google in-app purchases through RevenueCat. Do not route native digital purchases through Stripe.

## OAuth provider configuration

Each connector marked Available needs its own provider console setup, least-privilege scopes, exact production callback URL, privacy/verification materials, token revocation handling, and a synthetic test account. Provider secrets, when required, belong on the server and are not yet standardized into one environment schema.

## Email

Email delivery is not implemented. Before adding it, choose a provider and define server-only API credentials, verified sender/domain, bounce/complaint webhooks, rate limits, templates, and exam-content redaction. Do not invent an email environment variable until a provider is selected.

## Push notifications

Local notification support exists, but remote push is not complete. Production requires APNs credentials, FCM service credentials, device-token storage, token rotation, opt-out enforcement, grouping, deep-link validation, and a server dispatcher. These values must be documented after the selected push architecture is implemented.

## Analytics and error monitoring

No production analytics/error-monitoring provider is currently implemented. Select providers before beta, add environment variables only for the selected SDKs, and verify scrubbing of exam text, names, emails, tokens, paths, and document URLs.

## Safe startup requirements

- Server startup must fail with a clear operator error if production Firebase identity, AI key, CORS origins, pairing pepper, or required entitlement verification is missing.
- Client features must use the centralized release labels: Needs live verification, Manual import only, School authorization required, Vendor approval required, Coming soon, or Unsupported. Connection state is displayed separately.
- Never fall back to preview data in a production build.
- Rotate any key that has appeared in source, logs, screenshots, or support messages.
