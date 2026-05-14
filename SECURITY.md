# Security Policy

## Reporting a vulnerability

If you believe you have found a security vulnerability in Regrade — the web
app, the API server in `server/`, the Firestore security rules, or the
mobile builds — please report it privately. Do **not** open a public GitHub
issue.

Email: _see `src/version.ts` → `APP_SUPPORT_EMAIL` for the current contact
address_. Use the subject line `Security report — Regrade`.

We try to acknowledge within 72 hours and to deploy a fix or mitigation
before any public disclosure.

## What is and is not committed to this repository

This repo is **only the source code**. The following are required to run the
app but are kept entirely outside git:

| Item | Lives in | Why it is out of git |
|---|---|---|
| Firebase web config (`VITE_FIREBASE_*`) | `.env` | Public-by-design via the bundle, but kept out of git so it can be rotated and so the file pattern stays consistent. |
| Gemini API key (`GEMINI_API_KEY`) | `server/.env` | Server-only secret. Direct billing exposure. |
| Firebase Admin service account JSON | `server/firebase-adminsdk.json` (filename ignored) or `FIREBASE_SERVICE_ACCOUNT_JSON` env | Full admin authority on the project. |
| Android signing keystore | `~/keys/regrade-release.jks` (outside repo) | A leaked keystore lets attackers ship malicious updates as you. |
| Android `google-services.json` | `android/app/google-services.json` (gitignored) | Contains app identifiers; some projects also bake numeric keys here. |
| iOS `GoogleService-Info.plist` | `ios/App/App/GoogleService-Info.plist` (gitignored) | Same reasoning as Android. |
| Apple App Store signing keys (`.p8`, `.p12`, provisioning profiles) | Xcode keychain / Apple Developer portal | Identity to publish on the App Store. |

If you ever see one of these files committed, treat it as an incident:
revoke / rotate immediately, then purge from git history.

## Pre-publish checklist

Before running `git init` and pushing this repo to GitHub:

1. **Rotate `GEMINI_API_KEY`.** The current value has been on local disk for
   a while. Visit Google AI Studio → Keys, revoke the old one, and paste a
   new value into `server/.env`. The browser side never holds this key.
2. **Lock down the Firebase web API key.** Google Cloud Console → APIs &
   Services → Credentials → click the web key → set Application restrictions
   to HTTP referrers, and restrict to: `localhost`, `127.0.0.1`,
   `regrade.web.app`, `regrade.firebaseapp.com`, and your custom domain.
   Then enable Firebase App Check in the Firebase console (Play Integrity
   for Android, App Attest / DeviceCheck for iOS, reCAPTCHA Enterprise for
   web).
3. **Run `./scripts/check-secrets.sh`** (or the inline commands at the top
   of that file) to confirm no key material is staged for the first commit.
4. **`git status` before the first commit.** No file matching `.env*`,
   `*serviceAccount*`, `firebase-adminsdk*`, `google-services.json`,
   `GoogleService-Info.plist`, `*.jks`, `*.keystore`, `*.p8`, or `*.p12`
   should appear under "Changes to be committed".

## What we already do

- TLS in transit for all API calls.
- Firebase Auth for identity; Firestore rules deny by default and enforce
  per-user isolation (see `firestore.rules`).
- Server-side input validation with Zod (`server/src/middleware/validate.ts`)
  and a sanitization pass for all string inputs.
- IP- and user-based rate limiting (`express-rate-limit`).
- Helmet security headers on the API.
- Content-safety scan on uploads before they reach Gemini.
- No third-party advertising SDKs and no analytics SDK that collects
  personally identifiable information beyond what Firebase already logs.

## Known accepted risks

- The Firebase **web** API key is necessarily public once the SPA bundle
  ships. We mitigate via key restrictions and App Check, not by hiding the
  key. This is documented at the top of `.env` and in `FIREBASE_SETUP.md`.
- `dist/` and `.firebase/` are local-only build artifacts. They are
  gitignored and may contain copies of the inlined Firebase web config;
  do not host or share `dist/` from outside our authorized infrastructure.
