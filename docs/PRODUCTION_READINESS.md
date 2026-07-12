# Regrade 2.0 production readiness

Last checked: July 11, 2026

## Ready for user testing

- Client TypeScript check, 45 automated tests, and Vite production build pass.
- Server TypeScript build passes.
- The deterministic grading audit passes all 13 scenarios.
- Client and server production dependency audits report zero vulnerabilities.
- Capacitor web assets and plugins sync successfully to iOS and Android.
- The iOS Simulator build succeeds through `App.xcworkspace`.
- Home, Review, History, and Parent Mode were visually exercised in the live app with no console warnings or errors in the tested paths.
- Firebase rules default-deny access and scope user cases/documents to their owner.
- Real analyzed PDF/image pages are retained in user-scoped Firebase Storage and referenced from the saved case.

## Product behavior verified in code

- Manual Appeal runs the same analysis pipeline used by automatic imports.
- Auto Mode imports only newly graded work inside the seven-day policy window.
- Canvas, Google Classroom, Google Drive, Dropbox, and OneDrive have live import adapters.
- The wider platform directory remains searchable and supports connection or guided/manual upload where a provider does not expose a suitable student API.
- Review includes exam-only filtering, search, course/status filters, recurring mistake patterns, saved checklist progress, paper viewing, annotations, and Mr Whale.
- History supports search, filters, grouped dates, quick expansion, saved drafts, and reopening prior work.
- Parent Mode uses expiring one-time codes, learner approval, revocable links, and consent-gated case access.
- RevenueCat handles native purchases and restore-purchases; Stripe remains a web/server option only.

## Required before a real API/device beta

1. Set `VITE_API_BASE_URL` to the deployed Regrade API and rebuild with `npm run cap:sync`.
2. Set the server Firebase credentials, `GEMINI_API_KEY`, `FAMILY_PAIRING_PEPPER`, `CRON_SECRET`, production `CORS_ORIGIN`, and RevenueCat server values.
3. Set `VITE_REVENUECAT_APPLE_API_KEY`, `VITE_REVENUECAT_GOOGLE_API_KEY`, and the matching App Store / Play product identifiers.
4. Deploy the updated Firestore and Storage rules.
5. Configure provider OAuth applications for the live connectors and add their approved redirect URLs.
6. Install a Java 17+ runtime before producing or testing the Android APK/AAB on this machine. Android source/assets are synced, but Gradle could not run without Java.
7. Run real-device tests for sign-in redirects, push-notification permission states, StoreKit/Play Billing, background automation notifications, camera/photo access, and connector token expiry.

## Honest connector boundary

The platform search library is broader than the live automatic-import set. A platform is never shown as live-connected or automatically synced unless Regrade receives a successful authorized provider response. School-controlled or closed systems require provider approval, institution credentials, or a manual export/upload route.

