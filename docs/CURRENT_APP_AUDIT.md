# Current App Audit

Audit date: July 12, 2026. This is the baseline before the Regrade 2.0 light-mode mobile redesign.

## Architecture

Regrade is a React 19 + TypeScript + Vite application wrapped by Capacitor for iOS and Android. Screen-level modules are lazy-loaded from `src/App.tsx`; `AuthGate.tsx` controls sign-in, email verification, onboarding, and preview-only states. `Layout.tsx` owns the shared header and five-tab navigation.

The application uses Firebase Authentication, Firestore, and Storage from the client. A separate Express server verifies Firebase tokens, applies App Check/rate limits, calls Gemini, manages encrypted connector grants, imports provider records, verifies billing entitlements, handles family links, and performs account deletion.

## Current navigation

The five student destinations are Home, Appeal, Coach, Review, and History. Profile/Settings opens from the header. Appeal is a state-driven workflow inside `App.tsx`: upload → annotation review → evidence summary → verdict/draft → learning handoff. A paper viewer can open above any tab.

Supervisor accounts reuse Review navigation but render `SupervisorHub`. This is functional only when the deployed family API is configured; preview mode uses a clearly separate synthetic learner.

## What works now

- Firebase sign-in with Google, Apple/native support, email/password, email verification, sign-out, and onboarding persistence.
- Firestore owner-scoped user profiles and case records.
- PDF/image upload processing, multi-page preview images, Storage persistence, page navigation, and zoom.
- Server-side evidence analysis and draft support when the API and Gemini key are configured.
- Review plans derived only from analyzed exam evidence.
- Case History search, filters, reopen, resume, and deletion.
- Connector search and explicit readiness states.
- RevenueCat native purchase/restore integration points and web billing endpoints.
- Notification permission/preferences and local notification deep-link handling.
- Parent pairing/link APIs with explicit learner consent and owner checks.
- Account deletion across Auth, Firestore, Storage, connections, and family links when the server is configured.
- Preview mode for design/demo testing, isolated from production Firebase.

## Incomplete or configuration-dependent

- Auto Mode imports metadata but does not yet complete the entire import → AI → persist → notify → Review → History orchestration reliably.
- Most provider connectors require OAuth applications, scopes, and credentials; unsupported platforms are not functional.
- Remote APNs/FCM notification dispatch and a persisted notification inbox are incomplete; current delivery is primarily local.
- Review annotations are evidence records and page images, not a persisted coordinate-based drawing/highlight/type layer.
- Mr. Whale understands a case when a case ID is supplied, but selected-question/page context is not yet a formal persisted context contract.
- Parent/supervisor preview data is synthetic; real pairing requires a deployed API and two accounts.
- Subscription UI depends on RevenueCat/store configuration; prices and entitlements must not be inferred.
- Analytics and production error monitoring are not configured.

## Preserve during redesign

Preserve all service boundaries, Firebase ownership rules, safe user-facing errors, explicit connector statuses, preview isolation, appeal consent boundary, lazy screen loading, account deletion, document deletion, and the existing evidence-first AI language. The redesign must not invent successful imports, recovered points, appeal outcomes, or parent access.
