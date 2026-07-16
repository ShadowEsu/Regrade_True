# Nightly automation state

Updated: 2026-07-16 (pre-release pass)

## Current branch
`automation/regrade-overnight-2026-07-15`. Pushes remain on this feature branch; never merge directly to `main`.

## App status
Web and Electron remain supported; Capacitor sync succeeds. iOS simulator build and launch now reach the real sign-in screen. Client TypeScript and 62 tests pass; server TypeScript and 9 tests pass; production builds/audits/health/release contracts pass.

## Most important known issues
1. Java 17+ is missing: Firebase emulator isolation and Android build are blocked.
2. Native Google must move to a dedicated credential/plugin flow. Web redirect resolution froze WKWebView before first paint and is skipped at native startup.
3. Production API, staging Firebase, AI, connectors, remote push, RevenueCat/store products, and real account/deletion tests are unverified.
4. Real-device accessibility/responsive/PDF tests, signed packaging, and legal review remain release gates.

## Last completed fix
Native startup no longer calls Firebase's web OAuth redirect resolver in WKWebView. That resolver caused an indefinite splash before first paint. The iPhone 17 Pro simulator now reaches the Regrade sign-in screen. A non-blocking auth observer/fallback keeps app boot recoverable.

## Tests last run
`npm run verify:beta` — passed: client/server type checks, 62 client tests, 9 server tests, production builds, API health, production audits, secret/path scan, billing guard, release contracts, and Capacitor sync. Java-dependent emulator rules and Android build are intentionally reported as blocked.

## Next recommended task
Install Java 17+, provision staging Firebase/API configuration, then execute the two-user isolation test and the persisted manual upload → Review → Appeal → History journey with synthetic data.

## Blockers / missing credentials
- Java 17+/Android toolchain; staging Firebase/Admin/App Check; production HTTPS API base; AI/connector/push/store/RevenueCat credentials; signing certificates; legal approval.
