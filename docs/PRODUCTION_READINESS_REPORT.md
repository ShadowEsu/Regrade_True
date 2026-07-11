# Regrade production readiness report

Date: July 10, 2026 · Owner: Preston Jay Susanto · Version: 1.0.0

## Honest submission verdict

The repository is release-buildable and the eight production workstreams are implemented on the code side. It is **not yet safe to submit to either store** because production service URLs, App Check, billing products/keys, connector encryption, scheduler secrets, native signing, and store-console declarations are external owner actions and are currently not configured. Submitting the current unsigned/native build would leave AI, purchases, and live connectors unavailable.

## Verification completed

- TypeScript client lint: passed.
- Server TypeScript build on Firebase Admin 14: passed.
- Vitest: 44 tests across 6 files passed.
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
9. Landing/SPA cleanup, retained-paper History previews, polished authentication/onboarding, and the current professional navigation structure.
10. Review and History search/filter scalability, grouped History dates, expandable quick previews, quieter cross-theme surfaces, simplified Appeal entry, original-paper annotation preview, stronger KaTeX/mhchem delimiter coverage, academic response rendering inside Review, and vendor chunk splitting.

## July 10 task 10 verification

- Review sample library: search, course filter, status filter, exam cards, review-studio entry, and empty-result state verified in the live app.
- History: search/status controls, month grouping, accessible card expansion, paper preview action, and appeal continuation are implemented without nested interactive controls.
- Appeal: one primary start action; duplicate upload/feature panels removed while preserving the existing upload-analysis-annotation-evidence-draft flow.
- Academic rendering: inline math, multiline display math, single-line `$$…$$`, `\\[…\\]`, fenced `math`/`latex`/`katex`, matrices, mhchem reactions, and bounded charts are covered. Mr Whale's Review responses now use the same renderer as Coach.
- Document review: retained original pages are shown beside the annotation rail when present. Without verified page coordinates, Regrade keeps annotations in the rail and does not fabricate overlays.
- Responsive/theme check: 375px mobile layout had no horizontal overflow; dark Review surfaces rendered `#161b22` with light text rather than white containers.
- Bundle split: the former ~924 KB main entry is now ~99 KB; Firebase, React, Motion, icons, and academic rendering are cached separately. The largest application vendor chunk is Firebase at ~472 KB.

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
