# Known Limitations

## Critical

- **Native Google sign-in is not release-ready.** The web redirect resolver was removed from native startup because it froze WKWebView before first paint. A dedicated native Google credential plugin/flow and callback test are required; Apple native and email paths remain separate.

- **Auto Mode is incomplete.** Connected imports can create metadata/case records, but they do not yet reliably trigger the complete AI analysis, finding persistence, appeal draft, notification, Review, and History pipeline.
- **Real parent/teacher pairing is unverified.** The code supports expiring learner-generated codes, learner approval, permission changes, unlinking, searchable/filterable/pinnable learner switching, and per-link case isolation. It still requires a deployed API, Firebase Admin credentials, a pairing pepper, and multiple real test accounts; no simulated pairing fallback remains.
- **Real connectors are unverified in this environment.** The app now separates connection state from release status and labels sources as Needs live verification, Manual import only, School authorization required, or Vendor approval required. No connector is certified Live in this pass.
- **Native subscriptions are unverified.** RevenueCat and store product identifiers are wired for configuration, but purchase/restore/renewal/cancellation/expiration were not tested with StoreKit or Google Play sandbox accounts.
- **Remote push is not complete.** Local notification handling and deep links exist, but there is no verified APNs/FCM server dispatch pipeline.
- **Production API URL is not configured locally.** Native builds require a real HTTPS `VITE_API_BASE_URL`.

## Data and AI

- Preview analysis uses deterministic sample output and must never be treated as a real teacher-error finding.
- AI accuracy for handwriting, diagrams, chemistry, and complex mathematics depends on source quality and the deployed model. Every finding requires human review.
- Regrade identifies possible grading inconsistencies; it cannot guarantee a grading mistake, successful appeal, or recovered marks.
- No external appeal is automatically sent. This is intentional until explicit consent, audit logging, delivery confirmation, and revocation behavior are implemented.

## PDF and annotations

- User-created highlight, free-draw, and text annotations persist per case and page using normalized coordinates, so they remain aligned across zoom, resize, reopen, and page changes.
- Pages and their saved overlays can rotate together for viewing. Creating or editing annotations while rotated is intentionally disabled until inverse rotation coordinate mapping is validated; rotate back to 0° to edit.
- AI findings still use a page-aware evidence rail unless the model returns verified page coordinates. Regrade does not invent red/green boxes around handwriting or diagrams.
- Typed notes accept plain math and chemistry text. Rich equation authoring directly on the document canvas is not yet a full WYSIWYG equation editor.
- Very large, malformed, encrypted, or low-resolution PDFs require real-device stress testing.

## Notifications

- Preference switches exist for imports, analysis completion, possible issues, appeal readiness, parent updates, and weekly summaries.
- A persistent in-app inbox supports categories, unread state, archive, grouping, and case deep links.
- Local native delivery exists. Remote APNs/FCM dispatch and background event producers still require production infrastructure.
- Grouped notifications deep-link to a specific case when one is available; a group containing several cases opens the relevant product area.

## Platforms and builds

- iOS simulator compilation and runtime launch succeeded on 2026-07-16 after fixing an indefinite splash. See `IOS_BUILD_QA.md`; real-device OAuth, signed IPA export, thinning report, and TestFlight remain blocked by missing configuration/signing identities/profiles.
- Android release compilation is blocked on this machine until a compatible Java runtime/Android signing setup is installed.
- An unsigned macOS arm64 `.app` package exists for engineering verification. It is not signed/notarized. Windows has not been built or tested on Windows.

## Performance

- The Firebase production chunk is approximately 520 KB minified.
- History uses incremental rendering rather than full row virtualization.
- First-load, cold PDF render, and 25 MB upload timings have not been recorded on low-end devices or slow networks.

## Operations

- Production analytics and error monitoring are not configured.
- Email delivery is not implemented.
- A production backup/restore drill, incident runbook, rate-limit dashboard, and support escalation process are still required.
