# Founder handoff — 2026-07-16

## What is verified

Client/server compile, tests, production builds, dependency audits, secret/path scan, API health, release contracts, Capacitor sync, unsigned macOS packaging, iOS simulator build, and iOS launch to the real sign-in screen.

## What is not verified

Staging Firebase isolation (Java blocker), real auth persistence, native Google sign-in, production AI, live connectors, complete Auto Mode, remote push, parent/teacher accounts, store purchases, destructive deletion, Android build, signed/notarized artifacts, real-device accessibility, and legal approval.

## Credentials/tools required

Java 17+ and Android SDK; staging Firebase Admin/App Check configuration; HTTPS API origin; AI provider key/budget; approved connector OAuth/vendor credentials; APNs/FCM; App Store Connect/Google Play/RevenueCat sandbox; Apple/Windows signing; reviewed legal and consent documents.

Do not invite external testers until every critical item in `RELEASE_CHECKLIST.md` has evidence.
