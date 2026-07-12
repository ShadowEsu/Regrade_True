# Future Improvements

These are intentionally deferred. They are not required for the current Regrade 2.0 refactor and should not be presented as shipped.

## Product and interaction

- Add URL-addressable internal routes for deep links and browser-native Back behavior.
- Add a dedicated full notification center with read/unread persistence and server push events.
- Add remote APNs/FCM delivery for connector jobs completed while the app is closed.
- Add a focused edit sheet for profile fields so the Profile landing page can become even shorter.
- Add a user-controlled onboarding replay for only the intro, setup, or notification section.
- Add licensed custom Regrade illustrations for onboarding and permission education.
- Add optional saved appeal phrases only after user research confirms a need.

## Review and appeal

- Add coordinate-backed annotation overlays when the extraction pipeline returns verified page coordinates.
- Add subject-specific review templates built from evidence, never generic diagnosis.
- Add comparison across multiple attempts in the same course with explicit user consent.
- Add offline upload staging and retry for unstable mobile networks.

## Engineering

- Replace external Google Fonts loading with locally licensed/subset web fonts for offline reliability and privacy.
- Investigate narrower Lucide imports or an app-specific SVG icon set to reduce installed development dependencies.
- Move PDF rendering into a more isolated lazy boundary and evaluate a smaller worker build.
- Add visual regression snapshots at 375 px, tablet, desktop, light, and dark themes.
- Add an automated bundle budget and native artifact size report to CI.
- Revisit npm workspace consolidation only after the package manager correctly honors the server's security overrides.

## Launch work still owned externally

- Production API host, App Check, signing, connector credentials, store-console declarations, RevenueCat products, sandbox purchase testing, APNs/FCM, and real institution connector approval remain deployment-owner tasks documented in the production readiness report.

