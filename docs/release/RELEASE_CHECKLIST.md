# Release checklist

Unchecked items block beta unless explicitly marked non-critical.

## Repository

- [x] Real env files, Admin credentials, logs, caches, builds, uploads, and native local files ignored
- [x] Publishable files pass `scripts/check-secrets.sh`
- [ ] Confirm no secret existed in remote Git history; rotate and rewrite history if found
- [x] Public docs contain no workstation paths or real student content

## Data and security

- [ ] Firestore and Storage rules pass Firebase emulator tests
- [ ] Two-account cross-read/write/delete attempts are denied
- [ ] App Check enforced on the deployed API after clients are configured
- [ ] Account deletion verified across Auth, Firestore, Storage, family, connections, and billing
- [ ] Backup/retention/deletion schedule approved

## Core flows

- [ ] Real sign-up → onboarding → dashboard persists after relaunch
- [ ] Real upload → AI → Review → annotation → draft → History persists
- [ ] Auto Mode on/off verified; only work from the last seven days auto-imports
- [ ] User must approve every externally sent appeal
- [ ] Empty, offline, timeout, permission denied, disconnected, and retry states verified
- [ ] Parent pairing, approval, revocation, and least-privilege access verified

## Services and stores

- [ ] Gemini safety/evaluation set passes
- [ ] Every connector marked live passes its own provider test
- [ ] RevenueCat sandbox purchase/restore/expiry/refund passes on iOS
- [ ] APNs/FCM deep links verified; notification preferences honored
- [ ] Privacy labels, age rating, screenshots, support and deletion URLs approved
- [ ] Legal drafts reviewed by qualified counsel/privacy professional

## Quality

- [x] Client/server type checks, 62 client tests across 13 files, 9 server tests, production build, and Capacitor sync pass on 2026-07-16
- [x] Unsigned iOS simulator build launches to the real sign-in screen after native redirect startup fix
- [x] Unsigned device iOS archive passes; exact artifact sizes are recorded in `APP_SIZE_REPORT.md`
- [ ] Signed IPA/TestFlight and Android APK/AAB pass (0 valid iOS signing identities; Android blocked by missing Java)
- [ ] 360/414/768/1024+ widths, landscape, keyboard, screen reader, large text pass
- [ ] Large multipage PDFs and annotation reopen/resize/rotate alignment pass
- [ ] No unresolved security, account-access, or data-loss blocker remains
- [ ] Dedicated native Google sign-in and OAuth callback pass on a real iOS device
- [ ] Production HTTPS `VITE_API_BASE_URL` is present in native release builds
