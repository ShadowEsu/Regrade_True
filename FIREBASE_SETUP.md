# Firebase setup for this project

## Fix `Firebase: Error (auth/unauthorized-domain)`

Firebase Authentication only allows sign-in from domains you explicitly allow.

**Important:** **Authorized domains** are **not** on **Project settings → General** (project name, project ID, support email). That screen never lists domains. Domains live **only** under **Authentication**.

### Where to click

1. Open [Firebase Console](https://console.firebase.google.com/) and select your project.
2. In the left sidebar, open **Build → Authentication** (not the top **Project settings** gear).
3. At the **top of the Authentication page**, open the **Settings** tab (same row as **Users** and **Sign-in method**).
4. Scroll to **Authorized domains** and use **Add domain** if your URL is missing.

**Direct link for this repo’s default project** (`regrade-75d1a` — see `.firebaserc`):

`https://console.firebase.google.com/project/regrade-75d1a/authentication/settings`

For other projects, replace the ID: `https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication/settings`

### Domains to include

Typical entries (Firebase often adds Hosting defaults for you):

- **`localhost`** — local dev (`npm run dev`).
- **`127.0.0.1`** — **not** the same as `localhost`. If your browser bar shows `http://127.0.0.1:3000`, you **must** add `127.0.0.1` here or Google sign-in returns **`auth/unauthorized-domain`**.
- **`regrade-75d1a.firebaseapp.com`** and **`regrade-75d1a.web.app`** (and **`regrade.web.app`** if that’s your Hosting site) — adjust if your project ID / site ID differs.
- Any **custom domain** from Hosting (e.g. `app.example.com`).
- Preview / tunnel hosts (e.g. **ngrok**, **Cloudflare Tunnel**) — add each hostname you actually open in the browser.

If you open the app from a URL that is **not** in this table (wrong hostname, raw IP, or another preview domain), add that hostname here or Auth returns `auth/unauthorized-domain`.

---

## Android, iOS, or Web in the Firebase console?

One Firebase **project** can include **multiple apps** (Web + Android + iOS). What you click first depends on **how** you ship the mobile app, not whether users hold a phone.

| You are building… | In Firebase, register… | Config in this repo |
|-------------------|------------------------|---------------------|
| **This React/Vite UI in the browser** | **Web** (`</>`) | Local **`.env`** with `VITE_FIREBASE_*` (see §3) |
| **Same React app inside a native shell** (e.g. **Capacitor**, Cordova) | **Web** first (for the JS SDK config above). **Also** add **Android** and **iOS** when you need native pieces (see below). | Same **`.env`** / web config for Firestore + email auth in the WebView |
| **Fully native app** (React Native, Swift, Kotlin — not this repo’s UI) | **Android** and **iOS** (`google-services.json`, `GoogleService-Info.plist`) | You would **not** use this file-only web setup; you’d use native Firebase SDKs |

**If your goal is a mobile app but you keep this codebase:** you are usually on the **hybrid** row: start with **Web** in Firebase and put the same `VITE_FIREBASE_*` values in **`.env`** so `src/lib/firebase.ts` can initialize. Firestore and Email/Password keep working in the embedded browser (WebView).

**When to also add Android / iOS in the same Firebase project (hybrid):**

- **Google Sign-In** on device: popups behave differently in a WebView; teams often add the native Android/iOS apps in Firebase and wire **Capacitor** plugins or OAuth redirect so Google login works reliably.
- **Push notifications**, **App Check** with native attestation, or **Crashlytics** tied to the store listing: native app entries help.

So: **mobile product ≠ “pick Android instead of Web.”** For this stack, you typically need **Web** for config, and **optionally** Android + iOS alongside it.

---

## 1. Create or open a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a project (or select an existing one).

---

## 2. Register a Web app

1. On the project overview, under **“Get started by adding Firebase to your app”**, click **Web** (`</>`).
2. Give the app a nickname (e.g. `regrade-web`). You can skip Firebase Hosting for now.
3. Copy the **`firebaseConfig`** object Firebase shows you (it looks like `apiKey`, `authDomain`, `projectId`, etc.).

---

## 3. Put config in this repo (local `.env` — safe for GitHub)

**Do not commit real keys.** The repo includes **`.env.example`**. Copy it to **`.env`** in the project root and fill in values from your Firebase **Web** app config (the same object the console shows when you register the app).

| Firebase console field | Variable in `.env` |
|------------------------|-------------------|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `measurementId` (optional) | `VITE_FIREBASE_MEASUREMENT_ID` |
| Default vs named database | `VITE_FIREBASE_FIRESTORE_DATABASE_ID` — usually `(default)` |

- **`.env`** is **gitignored**; only **`.env.example`** (placeholders) should be committed.
- **Gemini** belongs in **`server/.env`** as `GEMINI_API_KEY` (server only), not in the Vite app.

### `VITE_FIREBASE_FIRESTORE_DATABASE_ID`

- If you use the **default** Firestore database, set **`(default)`** (no quotes in `.env`).
- If you use a **named** database, set that ID exactly.

`src/lib/firebase.ts` reads these variables. They must match the project and database you use in the console.

**Note:** Vite inlines `VITE_*` values into the **production JavaScript bundle**, so the Firebase **Web API key** is still visible to anyone who inspects the hosted site — that is normal for the client SDK. Restrict abuse with **HTTP referrer** / **App Check** in Google Cloud. The important part for GitHub is: **never commit** `.env`, service account JSON, or `GEMINI_API_KEY` in the client.

---

## 4. Enable Authentication

1. In Firebase Console: **Build → Authentication → Sign-in method**.
2. Enable **Email/Password**.
3. Enable **Google** (and set a support email if prompted).

The login UI lives in `src/views/Auth.tsx`.

---

## 5. Create Cloud Firestore

1. **Build → Firestore Database → Create database**.
2. Pick a location, then create the database.
3. For production, deploy security rules from this repo’s **`firestore.rules`** (do not leave test rules open forever).

Rough collections used by the app (see also `firebase-blueprint.json`):

- `users/{userId}`
- `cases/{caseId}`
- `cases/{caseId}/milestones/{milestoneId}`

---

## 6. (Optional) Deploy Firestore rules

If you use the Firebase CLI:

```bash
npm install -g firebase-tools
firebase login
firebase init firestore
# Select this project and use firestore.rules / firestore.indexes if prompted
firebase deploy --only firestore:rules
```

Point `firebase.json` at your `firestore.rules` file if it is not already.

---

## 7. Firebase Hosting (site `regrade`)

This repo includes **`firebase.json`** and **`.firebaserc`** so you can deploy the **Vite** production build.

- **`public`** is set to **`dist`** (output of `npm run build`), not `public`, because this is a Vite app.
- **`site`** is **`regrade`**. In Firebase Console → **Hosting**, add a site with that ID if it does not exist yet (or change `site` in `firebase.json` to match your console).
- **`.firebaserc`** defaults the CLI project to **`regrade-75d1a`**. If your Firebase project ID differs, edit that file.

Commands (from the project root, after `firebase login`):

```bash
npm run deploy:hosting
```

That runs `vite build`, then:

```bash
firebase deploy --only hosting:regrade
```

Deploy Firestore rules when you change them:

```bash
npm run deploy:rules
```

**AI / Gemini (server-side, secure):** The browser **no longer** holds a Gemini API key. You run the small **Express API** in the `server/` folder. It uses `GEMINI_API_KEY` and verifies **Firebase ID tokens** before calling Gemini. See **“Regrade API (Gemini proxy)”** below.

If you prefer interactive setup, `firebase init` can merge with existing config—use **Hosting** + **Firestore**, and keep **`dist`** as the public directory.

---

## 7b. Regrade API (Gemini proxy)

1. In Firebase Console → **Project settings** → **Service accounts** → **Generate new private key**. You get a JSON file. **Do not commit it.**
2. In `server/`, create `.env` (see `server/.env.example`):
   - `GEMINI_API_KEY` — from [Google AI Studio](https://aistudio.google.com/) (server only; never in Vite).
   - **Firebase Admin** (pick one) — needed so the API can **verify** ID tokens from signed-in users:
     - **`GOOGLE_APPLICATION_CREDENTIALS`** — path to the downloaded service account `.json` file, e.g. `GOOGLE_APPLICATION_CREDENTIALS=./firebase-adminsdk.json` (recommended for local dev), **or**
     - **`FIREBASE_SERVICE_ACCOUNT_JSON`** — the same JSON pasted as a **single line**.
     Download the key from **Project settings** (the gear) → **Service accounts** → **Generate new private key**.
   - `PORT` — default `8787`.
   - `CORS_ORIGIN` — for production, set to your hosted web origin(s), comma-separated, e.g. `https://regrade.web.app,https://yourdomain.com`. For local dev, `*` is fine.

3. Start the API:

```bash
cd server && npm install && npm run dev
```

4. Start the web app (second terminal):

```bash
npm install && npm run dev
```

The Vite dev server proxies `/api/*` to `http://127.0.0.1:8787`, so the UI calls `/api/v1/gemini/...` without extra config.

**Production:** Deploy the `server/` app to any Node host (Render, Fly.io, Cloud Run, etc.). Then build the frontend with:

```bash
VITE_API_BASE_URL="https://your-api-host.example.com" npm run build
```

Firebase Hosting serves only static files; it cannot run Express. The hosted site must know where the API lives via `VITE_API_BASE_URL`.

---

## 8. Run the app locally

```bash
npm install
```

Terminal 1 — API (required for upload / advocate / security scan):

```bash
npm run dev:api
```

Terminal 2 — web UI:

```bash
npm run dev
```

Sign up or sign in; if something fails, check the browser console and verify **Auth providers**, **Authorized domains**, **`firestoreDatabaseId`**, and **rules** match your project.

---

## Quick reference: files involved

| File | Purpose |
|------|---------|
| `.env` (local, gitignored) | Web Firebase `VITE_FIREBASE_*` variables; copy from `.env.example`. |
| `src/lib/firebase.ts` | Initializes Firebase App, Auth, and Firestore from env. |
| `src/AuthGate.tsx` | Listens for login state. |
| `src/views/Auth.tsx` | Sign-in UI. |
| `src/services/userService.ts` | User profile in Firestore. |
| `src/services/caseService.ts` | Cases and milestones in Firestore. |
| `firestore.rules` | Security rules to deploy. |
| `firebase-blueprint.json` | Schema / path reference (documentation). |
| `firebase.json` | Hosting (`dist`) + Firestore rules path. |
| `.firebaserc` | Default Firebase **project ID** for the CLI. |

---

## Mobile wrapper (typical next step for this repo)

This project does **not** yet include Capacitor or native folders. To ship **one** codebase to App Store / Play Store while keeping React:

1. Add **Capacitor** (or similar) and point it at your Vite `dist` build.
2. Keep using the same **web config** in **`.env`** + **`src/lib/firebase.ts`** unless you migrate to native Firebase SDKs.
3. In Firebase: ensure a **Web** app exists; add **iOS** / **Android** apps when your auth or tooling docs require bundle ID, SHA-1, or native config files.
4. Retest **Google sign-in** on a real device early; fix with redirect or native auth if popups fail in the WebView.

---

## If you only registered Android or iOS

Add a **Web** app: **Project settings** → **Your apps** → **Add app** → Web. Copy that config into your local **`.env`** as `VITE_FIREBASE_*` variables (see §3) so this React app can run.
