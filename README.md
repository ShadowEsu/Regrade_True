# Regrade

> An AI-assisted grade-appeal assistant for students. Upload graded coursework (Gradescope, Canvas, Moodle, D2L Brightspace, Schoology, Microsoft Teams Education, Google Classroom, Turnitin, or a marked paper), get a rubric-aware analysis, and draft a respectful appeal letter.

**© 2026 Preston Jay Susanto. All rights reserved.** See [`LICENSE`](LICENSE) for source-code terms and [`legal/`](legal/) for the end-user Privacy Policy, Terms of Service, and EULA.

---

## What's in this repo

| Folder | Purpose |
|---|---|
| `src/` | Vite + React 19 web client (Firebase Auth, Firestore, Gemini via server proxy). |
| `server/` | Express API that holds the `GEMINI_API_KEY`, verifies Firebase ID tokens, and rate-limits per IP and per user. |
| `shared/` | System prompts used by the server. |
| `public/legal/` | Public HTML versions of the Privacy Policy and Terms — these are the URLs you give Apple and Google during store review. |
| `legal/` | Markdown master copies of the Privacy Policy, Terms of Service, and EULA. |
| `firestore.rules` | Per-user Firestore security rules. |
| `firebase.json` / `.firebaserc` | Firebase Hosting + project mapping for the web build. |

The original `FIREBASE_SETUP.md` covers Firebase project setup in detail.

---

## Run locally

```bash
# 1. install
npm install
npm --prefix server install

# 2. configure
cp .env.example .env                  # fill VITE_FIREBASE_* (see FIREBASE_SETUP.md)
cp server/.env.example server/.env    # fill GEMINI_API_KEY + Firebase Admin creds

# 3. start (two terminals)
npm run dev:api                       # terminal 1 — Express API on :8787
npm run dev                           # terminal 2 — Vite on :3000
```

The Vite dev server proxies `/api/*` to the Express server on `127.0.0.1:8787`, so the client uses `/api/v1/gemini/...` without extra config.

### Server credentials

`server/.env` must contain:

- `GEMINI_API_KEY` — from Google AI Studio (server-only; never put in Vite).
- Either `GOOGLE_APPLICATION_CREDENTIALS=./firebase-adminsdk.json` (recommended for local dev) or `FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",…}` for the Firebase Admin SDK. Without one of these, the API returns 500 on any signed-in request.

---

## Build

```bash
npm run lint        # tsc --noEmit on the web client (must be clean before release)
npm run build       # produces dist/
npm --prefix server run build   # compiles server to server/dist/
```

The web `dist/` is what Firebase Hosting serves and what Capacitor wraps for the iOS and Android stores.

---

## Deploy

### Web (Firebase Hosting)

```bash
npm run deploy:hosting   # vite build → firebase deploy --only hosting:regrade
npm run deploy:rules     # firestore.rules → Firebase
```

The Express server in `server/` cannot run on Firebase Hosting. Deploy it to a Node host (Render, Fly.io, Google Cloud Run, etc.) and build the client with `VITE_API_BASE_URL=https://<your-api-host>` so the production bundle calls the right URL.

### Mobile (Capacitor → App Store / Play Store)

Regrade ships to the App Store and Play Store as a Capacitor wrap of the same web build. The high-level path:

1. Add Capacitor: `npx cap init "Regrade" app.regrade.client --web-dir=dist`.
2. `npm run build && npx cap add ios && npx cap add android && npx cap sync`.
3. Register the iOS bundle id and Android package name in Firebase Console; drop in `GoogleService-Info.plist` and `google-services.json`.
4. Sign with a real Apple Developer team and a release keystore (`android/keystore.properties` is gitignored — see `android/keystore.properties.template` if you start from this repo's scaffold).
5. Upload `.aab` to Play Console and an Xcode archive to App Store Connect.

The full step-by-step is at the bottom of `FIREBASE_SETUP.md` ("Mobile wrapper") and in the phased plan in [`docs/STORE_LAUNCH.md`](docs/STORE_LAUNCH.md) (if you have generated it).

---

## Legal

This repository is **proprietary**. The source code is licensed under the terms in [`LICENSE`](LICENSE) — all rights are reserved to Preston Jay Susanto. You may read the code if you obtained it through a lawful channel; you may not redistribute, fork publicly, or use it to build a competing product.

The compiled application that users install is separately governed by:

- [`legal/PRIVACY_POLICY.md`](legal/PRIVACY_POLICY.md) — what we collect and why.
- [`legal/TERMS_OF_SERVICE.md`](legal/TERMS_OF_SERVICE.md) — the user-facing contract.
- [`legal/EULA.md`](legal/EULA.md) — install-time end-user license.

Third-party open-source attributions are in [`NOTICE.md`](NOTICE.md).

The public-facing versions of the Privacy Policy and Terms — the URLs Apple and Google require during store review — live in [`public/legal/`](public/legal/) and are served from the hosted site at:

- `https://regrade.app/legal/privacy.html`
- `https://regrade.app/legal/terms.html`

Update the "Last updated" date in **all six** legal files plus `src/version.ts` whenever you make a material change.

---

## Branding

- **App name:** Regrade
- **Display copyright:** `© 2026 Preston Jay Susanto. All rights reserved.`
- **Bundle id / package:** `app.regrade.client` (reserve before first store submission; cannot be changed after first release).
- **Support / privacy contact:** edited centrally in `src/version.ts` (`APP_SUPPORT_EMAIL`).

Trademark notice: "Canvas", "Gradescope", "Blackboard", "Moodle", "D2L Brightspace", "Schoology", "Microsoft Teams", "Google Classroom", "Turnitin", and other learning-platform names referenced in the app are trademarks of their respective owners. Regrade is not affiliated with, endorsed by, or sponsored by any of those companies.

---

## Versioning

Single source of truth for the user-facing version is `src/version.ts` (`APP_VERSION`). Keep in sync with:

- `package.json` `version`
- `android/app/build.gradle` `versionName` / `versionCode` (after Capacitor)
- `ios/App/App.xcodeproj` `MARKETING_VERSION` / `CFBundleVersion` (after Capacitor)
- "Last updated" line at the top of every file under `legal/` and `public/legal/`

Apple requires `CFBundleVersion` (build number) to **increase** on every TestFlight / App Store Connect upload. Google requires `versionCode` (integer) to increase on every Play Console upload. Display version (`APP_VERSION`) follows semantic versioning.
