# Known Limitations

## Critical

- **Auto Mode is incomplete.** Connected imports can create metadata/case records, but they do not yet reliably trigger the complete AI analysis, finding persistence, appeal draft, notification, Review, and History pipeline.
- **Real parent pairing is unverified.** Preview mode uses simulated pairing data. Production pairing requires a deployed API, Firebase Admin credentials, a pairing pepper, and two real accounts.
- **Real connectors are unverified in this environment.** A connector shown as Available still requires its OAuth application, permissions, callback URL, and a real provider account. Unfinished platforms are labeled Coming soon or Needs setup.
- **Native subscriptions are unverified.** RevenueCat and store product identifiers are wired for configuration, but purchase/restore/renewal/cancellation/expiration were not tested with StoreKit or Google Play sandbox accounts.
- **Remote push is not complete.** Local notification handling and deep links exist, but there is no verified APNs/FCM server dispatch pipeline.
- **Production API URL is not configured locally.** Native builds require a real HTTPS `VITE_API_BASE_URL`.

## Data and AI

- Preview analysis uses deterministic sample output and must never be treated as a real teacher-error finding.
- AI accuracy for handwriting, diagrams, chemistry, and complex mathematics depends on source quality and the deployed model. Every finding requires human review.
- Regrade identifies possible grading inconsistencies; it cannot guarantee a grading mistake, successful appeal, or recovered marks.
- No external appeal is automatically sent. This is intentional until explicit consent, audit logging, delivery confirmation, and revocation behavior are implemented.

## PDF and annotations

- Findings use a page-aware evidence rail, not precise coordinate overlays.
- Red/green region boxes anchored to handwriting or diagrams are not yet supported.
- Rotation-aware coordinate transformations are not implemented.
- Very large, malformed, encrypted, or low-resolution PDFs require real-device stress testing.

## Notifications

- Preference switches exist for imports, analysis completion, possible issues, appeal readiness, parent updates, and weekly summaries.
- Only the currently implemented import/local notification paths can dispatch today; other categories need backend event producers.
- Import notifications deep-link to Review, not always to a single exam when multiple items are grouped.

## Platforms and builds

- iOS simulator compilation previously succeeded; a signed archive and TestFlight upload remain unverified.
- Android release compilation is blocked on this machine until a compatible Java runtime/Android signing setup is installed.
- macOS and Windows are responsive web targets, not separately packaged desktop applications yet.

## Performance

- The Firebase production chunk is approximately 520 KB minified.
- History uses incremental rendering rather than full row virtualization.
- First-load, cold PDF render, and 25 MB upload timings have not been recorded on low-end devices or slow networks.

## Operations

- Production analytics and error monitoring are not configured.
- Email delivery is not implemented.
- A production backup/restore drill, incident runbook, rate-limit dashboard, and support escalation process are still required.
