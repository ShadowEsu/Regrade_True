# Regrade production readiness report

Date: July 10, 2026 · Owner: Preston Jay Susanto · Version: 1.0.0

## Honest submission verdict

The repository is release-buildable and the eight production workstreams are implemented on the code side. It is **not yet safe to submit to either store** because production service URLs, App Check, billing products/keys, connector encryption, scheduler secrets, native signing, and store-console declarations are external owner actions and are currently not configured. Submitting the current unsigned/native build would leave AI, purchases, and live connectors unavailable.

## Verification completed

- TypeScript client lint: passed.
- Server TypeScript build on Firebase Admin 14: passed.
- Vitest: 42 tests across 6 files passed.
- Vite production build: passed; `dist` is 6.1 MB.
- Capacitor sync: passed with Apple Sign-In, RevenueCat, App, and Local Notifications plugins.
- Android Release APK compile: passed; unsigned APK is 9.2 MB.
- iOS Release simulator compile and bundle validation: passed; unsigned simulator app is 33 MB.
- Firestore and Storage rule emulators: both loaded successfully.
- Secret scan and `git diff --check`: passed.
- Server production dependency audit: 0 vulnerabilities after Firebase Admin 14 and UUID override.
- Client production dependency audit: no high/moderate vulnerability; one low Windows-only development-server advisory remains in esbuild.
- Real Gemini calls: Gemini 3.5 Flash text, structured exam JSON, math, chemistry, chart format, and handwritten-image reading passed.

## Implemented by task

1. Native metadata/version alignment, icons/splashes/privacy manifest, release builds, and store-compatible bundle ID.
2. Stripe web billing, RevenueCat-backed Apple/Google IAP, restore/manage flows, server quotas, payment lifecycle webhooks, and separately enforced automation toggles.
3. Default-deny Firestore/Storage posture, recursive deletion, encrypted connector credentials, revocation, SSRF protection, App Check, revoked-session checks, safe logging, quota refunds, and external billing cleanup.
4. Live desktop/mobile/dark-mode review, tested 1–5 appeal strength, global reduced-motion behavior, and evidence-honest annotations.
5. Stable Gemini 3.5 Flash, bounded learner history context, KaTeX/mhchem, safe charts, image/PDF vision, and real capability tests.
6. Login/logout/delete, Apple login alternative, public legal/deletion resources, unified support contact, AI response reporting, privacy disclosures, and store checklist.
7. HMAC-protected 10-minute learner codes, supervisor redemption, learner-device approval, unlinking, server-only shared-case access, and idempotent supervisor suggestions.
8. Canvas/Classroom graded-record imports, Drive/Dropbox/OneDrive manual browsing, seven-day server filter, unlimited-age manual selection, deterministic History records, upstream failure states, scheduler endpoint, and web/native alerts.

## Required owner actions before submission

### Critical deployment configuration

- Deploy the Node API and rebuild native apps with `VITE_API_BASE_URL=https://<your-api-host>`. It is missing now; without it native AI, billing sync, pairing, and imports fail.
- Create Firebase App Check web/native registrations, set `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`, and deploy the API with `ENFORCE_APP_CHECK=true`.
- Generate and set `CONNECTIONS_ENC_KEY` (32-byte base64), `FAMILY_PAIRING_PEPPER`, `CRON_SECRET`, and `FIREBASE_STORAGE_BUCKET`.
- Use a Node 22+ production runtime.
- Deploy `firestore.rules`, `storage.rules`, the API, and the legal pages. Schedule `POST /v1/jobs/connector-imports` with the cron bearer secret.

### Billing

- Create Stripe Student/Pro recurring prices and webhook for the web app; set Stripe secret, webhook secret, and price IDs.
- Create Apple and Google subscription products, RevenueCat entitlements/offerings/webhook, and all public/server RevenueCat keys listed in `APP_STORE_IAP_SETUP.md`.
- Run sandbox purchase, restore, renewal, billing failure, cancellation, expiration, upgrade, and account-deletion tests.

### Connectors

- Restrict the public Firebase web key in Google Cloud to approved APIs/domains.
- Add Dropbox and Microsoft OAuth app IDs if those file connectors will be advertised as live.
- Complete Google OAuth verification for Classroom/Drive scopes.
- Test Canvas and Google Classroom using real student sandbox accounts. Institution-gated catalog entries must remain described as gated until each vendor/school provisions access.

### Store accounts

- Select Apple/Google signing teams, archive a signed iOS device build, and create a signed Android App Bundle; the verified local artifacts are unsigned.
- Configure Sign in with Apple in Apple Developer/Firebase.
- Complete App Privacy, Data Safety, AI, age-rating, content-rights, export-compliance, subscription, and account-deletion declarations.
- Provide reviewer accounts/instructions and release-build screenshots. Confirm `regradeapp.tech` serves Privacy, Terms, EULA, and account-deletion pages.

## Known limitations that must not be misrepresented

- Only Canvas, Google Classroom, Google Drive, Dropbox, and OneDrive have implemented student-authorized adapters. Other catalog entries are manual or institution-gated by design.
- Score-only connector records create a History item but require the marked return/rubric before Regrade can make a responsible appeal claim. Auto Prepare must not invent missing evidence.
- Native local notifications work when the app next runs. True remote push for a server-side cron completion requires APNs/FCM registration and a push delivery service; this is not yet configured.
- The main JS entry chunk is about 926 KB minified (252 KB gzip). It is functional and the installed Android artifact is small, but further vendor splitting is optional performance work.

## Final recommendation

Do not submit today. Complete the critical configuration and real sandbox tests above, then run the documented build/test commands once more on signed device builds. After those owner actions pass, the codebase is a credible submission candidate for both stores.
