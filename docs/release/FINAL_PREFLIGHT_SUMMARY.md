# Final preflight summary — 2026-07-16

## Verdict

**No-go for public release or external private beta.** The codebase is materially better verified, but credential-dependent and real-data journeys remain incomplete. A small internal engineering test using synthetic data is reasonable.

## Completed

- Fixed light-only runtime and removed reachable appearance controls.
- Centralized and tested Free/Plus/Pro entitlements and two-month Plus trial intent.
- Added server-owned profile writes and two-user Firebase isolation test.
- Added release verifier covering TypeScript, tests, builds, API health, audits, scans, billing guard, contracts, and Capacitor sync.
- Built an unsigned macOS arm64 application.
- Built, installed, and launched iOS simulator app; fixed the indefinite splash caused by the web redirect resolver in WKWebView.
- Documented honest QA, packaging, billing, security, and operational gates.

## Exact product status

- Dark mode: unreachable; legacy selectors remain dormant and can be removed later.
- Free/Plus/Pro: catalog and unit contracts pass; real store/server entitlement lifecycle unverified.
- Trial: two-month Plus intent passes catalog tests; store eligibility/configuration unverified.
- Review/Study/PDF/annotations/Appeal/History: implemented and compile-tested; full persisted staging and real-device journeys unverified.
- Connectors/Auto Mode/push/parent/teacher: present but not certified live.
- iOS: simulator build and sign-in-screen launch pass; native Google OAuth, real device, signed archive/TestFlight blocked.
- Android: sync passes; build blocked by Java/tooling.

## Legal and approval gates

Terms, Privacy, EULA, child/parent/school consent, subscription copy, data retention, and store disclosures require qualified review. Every live connector requires the applicable OAuth/vendor/school approval.

## Next ten founder actions

1. Install Java 17+ and run Firebase isolation plus Android builds.
2. Provision a dedicated staging Firebase project and two synthetic test accounts.
3. Configure a staging HTTPS API base URL, Admin SDK, App Check, and exact CORS origins.
4. Choose and implement dedicated native Google sign-in; test Apple/email/Google on real devices.
5. Approve the exact plan/trial matrix and create matching sandbox store/RevenueCat products.
6. Select no more than the first one or two authorized connectors and complete their live staging tests.
7. Run the manual PDF/annotation/Review/Appeal/History persistence suite with sanitized fixtures.
8. Test parent/teacher linking and learner isolation with three staging accounts.
9. Obtain legal/privacy/child-safety and subscription-copy review.
10. Sign/notarize/package builds, run accessibility/performance/device matrices, then invite a very small internal beta.
