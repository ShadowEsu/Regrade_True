# Production readiness

Assessment date: 2026-07-16

## Decision

**No-go for production and external beta today.** The application
builds, passes the current automated suite, and now launches to the real sign-in
screen in an iOS simulator, but real Firebase, provider OAuth/imports,
Gemini, App Check, push delivery, RevenueCat receipts, and account deletion have
not all been verified together with persisted test data.

## Implemented in code

- Firebase email/password, Google, and Apple authentication paths
- owner-scoped Firestore and Storage rules with default deny
- PDF/image validation, rendering, persistent page storage, normalized annotations
- Gemini server proxy with consent, token verification, App Check hook, rate limits
- review, appeal drafting, history, profile, notifications, and family-link APIs
- encrypted connector credential design and five import adapters
- seven-day automatic eligibility policy; automation never sends an appeal
- RevenueCat entitlement sync and Stripe web implementation (web billing is not a
  substitute for store IAP inside native apps)
- in-app account deletion orchestration

## Blockers

1. Publish a clean/squashed history or remove the deleted workstation-path brief from
   historical commits before making the Git repository public.
2. Deploy rules to a test project and pass emulator/two-account isolation tests.
3. Configure a production API origin, Admin SDK, App Check, Gemini, encryption key,
   family pepper, cron secret, and exact CORS origins.
4. Complete live connector tests; only Canvas and Google Classroom are eligible for
   scheduled auto-detection today.
5. Verify returned-file/rubric retrieval. Current grade-record imports can require the
   student to add the marked file before an evidence-based analysis is possible.
6. Configure APNs/FCM remote push. Current client delivery is local/web notification.
7. Complete RevenueCat sandbox purchase, restore, expiry, refund, and account-change tests.
8. Obtain professional legal/privacy review and school/parent consent review.
9. Run real-device accessibility, rotation, large-PDF, offline, and deletion tests.
10. Replace the unsupported native Google web-redirect path with a dedicated native
    Google credential flow and configure the production HTTPS API base URL.

Preview data is explicitly labeled and must never be enabled in a production build.

## Verified in this pass

- Client: 13 test files / 62 tests; TypeScript and production build pass.
- Server: 9 tests; TypeScript, production build, and isolated health smoke pass.
- Dependency audits: zero known production vulnerabilities in both manifests.
- iOS: unsigned simulator build and runtime launch pass after the native splash fix.
- macOS: unsigned arm64 application package created for engineering use.
- Shared Free/Plus/Pro catalog and two-month Plus trial contracts pass tests.
- Light-only runtime and navigation contracts pass automated checks.
