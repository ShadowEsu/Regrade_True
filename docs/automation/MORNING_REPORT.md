# Regrade engineering report — 2026-07-16

## Main results

- Fixed the iOS indefinite splash: Firebase's web redirect resolver was freezing WKWebView before first paint. The rebuilt simulator app now reaches the real Regrade sign-in screen.
- Added a shared, validated Free/Plus/Pro plan catalog and tests.
- Added credential-free release verification, API health smoke, billing live-key guard, release-contract checks, and a two-user Firebase isolation test.
- Strengthened authenticated profile persistence and bounded recoverable-point calculations.
- Verified paper/annotation persistence code paths and the redeemable 30-day streak reward contract.
- Removed reachable dark-mode controls and fixed production startup to light.

## Passed

Client TypeScript, 62 client tests, client build; server TypeScript, 9 server tests, server build; API health; both production dependency audits (0 known vulnerabilities); publishable-file scan; billing guard; release contracts; iOS/Android Capacitor sync; unsigned macOS arm64 packaging; unsigned iOS simulator build and runtime launch.

## Blocked / not verified

Java/Firebase emulator execution, Android native build, dedicated native Google sign-in, real-device Apple/email auth, staging Firebase persistence/isolation, production API/AI, live connectors/Auto Mode, APNs/FCM, parent/teacher staging accounts, RevenueCat/store sandbox, destructive account deletion, signed/notarized artifacts, full accessibility/responsive matrix, and legal review.

## Artifacts

- `release/mac-arm64/Regrade.app` — unsigned engineering package, approximately 253 MB unpacked.
- `artifacts/ios-derived/Build/Products/Debug-iphonesimulator/App.app` — 27,734,755 bytes.
- `artifacts/screenshots/ios-native-redirect-fixed.png` — ignored simulator evidence.
- `artifacts/verify-beta.json` and `.md` — ignored verification reports.

## Morning manual priority

Install Java 17+, provision staging Firebase and a staging HTTPS API URL, choose a native Google sign-in flow, then run the two-account and full persisted manual exam journey before inviting testers.
