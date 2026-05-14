# Regrade — Standing Agent Brief

> Read this at the start of every run. Skip re-discovery for anything written
> here. If a fact below conflicts with what you find in the tree, the tree
> wins, but call out the drift before acting on it.

---

## What this project is

**Regrade** — an AI-assisted grade-appeal assistant for students. Student
uploads graded coursework (PDF/image from Gradescope, Canvas, Moodle, D2L
Brightspace, Schoology, Microsoft Teams Education, Google Classroom, Turnitin,
or a marked paper). The app produces a rubric-aware analysis and a draft
appeal letter, and saves cases for later.

- Owner / copyright: **Preston Jay Susanto**, all rights reserved.
- Bundle id (reserved): `app.regrade.client`.
- Public domain: `regrade.app` (privacy/terms/website URLs come from there).
- Support email: edited in **one place** — `src/version.ts` → `APP_SUPPORT_EMAIL`.

## Stack — exactly what's in the tree

- **Web client**: Vite 6 + React 19 + TypeScript + Tailwind v4 (CSS-first via
  `@theme` in `src/index.css`; the legacy `tailwind.config.js` is **deleted**).
  Motion (formerly Framer Motion), Lucide icons, DOMPurify, pdfjs-dist.
- **Backend**: Express 4 + Zod, Helmet, express-rate-limit, Firebase Admin,
  `@google/genai` (Gemini). All Gemini calls happen here; the browser never
  holds `GEMINI_API_KEY`.
- **Identity**: Firebase Auth (Google + email/password).
- **Database**: Firestore. Per-user rules in `firestore.rules`.
- **Hosting**: Firebase Hosting for `dist/`. Express must run on a separate
  Node host (Render / Fly / Cloud Run); `VITE_API_BASE_URL` points there in
  production.
- **Mobile wrap (planned, not yet added)**: Capacitor → iOS + Android stores.

## Repo layout — don't re-glob to find these

```
src/                    # web client
  App.tsx               # tab + flow state; mounts About via Profile
  AuthGate.tsx          # auth check + user-doc sync
  main.tsx              # BootErrorBoundary, createRoot
  version.ts            # SINGLE SOURCE for app version / owner / URLs / email
  constants.ts          # ICONS + DEFAULT_AVATAR_SRC + THEME tokens
  types.ts              # AnalysisResult, Case, etc.
  components/Layout.tsx, components/Logo.tsx
  context/              # (empty after Cmdly cleanup)
  lib/                  # api.ts, firebase.ts, gemini.ts, pdfText.ts, securityScanner.ts, shuffle.ts
  services/             # caseService.ts, userService.ts
  views/                # Advocate, Auth, Dashboard, EvidenceSummary, History,
                        # Profile, UploadCenter, VerdictReport, About
server/src/             # Express API
  index.ts, env.ts, firebaseAdmin.ts, regradeGemini.ts
  http/{errors,respond}.ts
  middleware/{auth,firebaseAuth,rateLimit,requestId,validate}.ts
  shared/{advocate,analytical}SystemPrompt.ts  # SERVER-SIDE prompts
shared/                 # ROOT copy of the same two prompts (sync by hand)
legal/                  # PRIVACY_POLICY.md, TERMS_OF_SERVICE.md, EULA.md
public/legal/           # privacy.html, terms.html — these are the store URLs
firestore.rules
firebase.json, .firebaserc
LICENSE, NOTICE.md, README.md
                        # NOTE: there is no android/ or ios/ folder yet.
                        # Both will be created by `npx cap add` when we wrap
                        # with Capacitor for the stores.
```

## Commands

```bash
npm run lint        # tsc --noEmit on web client. Must be clean before release.
npm run build       # vite build → dist/
npm --prefix server run dev   # Express API on :8787 (with watch)
npm run dev         # Vite on :3000 (proxies /api → 127.0.0.1:8787)
npm run deploy:hosting        # vite build + firebase deploy --only hosting:regrade
npm run deploy:rules          # firebase deploy --only firestore:rules
npm --prefix server run lint  # server tsc --noEmit
```

## Standing rules for the agent

1. **`git` does not work here.** The `.git` file points at
   `/Users/prestonjaysusanto/Cmdly/.git/worktrees/keen-euler-8f2a3f`, which
   does not exist. Don't propose `git pull`, `git status`, etc. unless the
   user is fixing the worktree itself.
2. **Cmdly leftovers are gone.** All Cmdly source, docs, marketing, and the
   legacy `android/` Kotlin app were removed on 2026-05-13. The strings
   `cmdly` / `aicommandvault` should now appear only in:
   - `.git` pointer (broken worktree path — user removes before `git init`).
   - `server/package-lock.json` (`name: cmdly-server`) — auto-fixes on next
     `npm install` inside `server/`.
   If you find `cmdly` / `aicommandvault` anywhere else, that is a real
   regression — flag it.
3. **Don't read `node_modules/`, `dist/`, `android/`, `server/node_modules/`,
   or `*-lock.json`** unless explicitly asked.
4. **Don't propose React Native fixes.** Regrade is a Vite/React web app
   wrapped (eventually) by Capacitor. No FlatList, no AsyncStorage, no native
   haptics SDK. Translate any RN-flavored request to its web/Capacitor
   equivalent before answering.
5. **`src/version.ts` is the only place to edit branding/contact strings.**
   Do not hard-code copyright, version, owner, support email, or legal URLs
   anywhere else.
6. **Legal text lives in two synchronized pairs.** When updating policy,
   update both:
   - `legal/PRIVACY_POLICY.md` ↔ `public/legal/privacy.html`
   - `legal/TERMS_OF_SERVICE.md` ↔ `public/legal/terms.html`
   And bump the "Last updated" date in `legal/EULA.md`.
7. **Server config knowledge:** without `GOOGLE_APPLICATION_CREDENTIALS` or
   `FIREBASE_SERVICE_ACCOUNT_JSON` in `server/.env`, every `/v1/gemini/*`
   request 500s. If a user reports a "broken upload", check this first.
8. **Don't suggest deleting `shared/` or `server/src/shared/` without asking.**
   They are intentionally duplicated; the root copy is referenced by docs and
   the server uses its local copy at build time.
9. **No emoji in commits, code, or chat unless explicitly asked.**
10. **No new files unless necessary.** Always prefer editing existing files.

## Known-good state (as of 2026-05-13)

- `npm run lint` on web: clean.
- `npm run build`: passes. Warnings about pdf.js bundle size and the
  `gemini.ts` mixed import are non-blocking.
- `server/ tsc --noEmit`: clean.
- Firestore rules accept user-doc create without `studentId` (legacy field
  still allowed but no longer required).
- `dist/legal/privacy.html` and `dist/legal/terms.html` are bundled.
- LICENSE, NOTICE, EULA, Terms, Privacy, About screen wired to Profile.

## Recurring pre-submission QA (run only when the user asks for "QA",
## "audit", "pre-submit check", or similar — not every turn)

Adapted from the old Cmdly checklist; React Native items removed; Regrade
specifics added. Output only **problems**, with `file:line — fix`. End with a
single line: `READY TO SUBMIT` or `NOT READY (<n> blocking)`.

**Code quality**
- `console.log` / `console.debug` / `console.info` left in `src/` or
  `server/src/` (warn/error are fine).
- `: any`, `as any`, `<any>` — flag each one (Auth.tsx, Advocate.tsx,
  caseService.ts, validate.ts, index.ts had these as of last audit; tighten
  if practical).
- Unawaited promises or `.then(` chains in event handlers (EvidenceSummary
  and VerdictReport both use `.then(` in effects — fine for now, but flag
  any new ones in handlers).
- Missing top-level error boundary (already present: `BootErrorBoundary` in
  `src/main.tsx`).
- `localStorage` / Firestore reads without try/catch.

**UI / UX (web + Capacitor)**
- Layout works at 360 px (small phone), 414 px (iPhone Pro Max), 768 px,
  and ≥1024 px (Layout.tsx switches to desktop nav at `lg`).
- No text clipping in `History`, `VerdictReport`, `EvidenceSummary` long
  fields.
- Tap targets ≥ 44 px on the bottom nav (Layout's mobile nav is currently
  ~52 px — OK).
- `Auth.tsx` Google popup handles `auth/popup-closed-by-user` and
  `auth/unauthorized-domain` (already does).
- `UploadCenter` shows clear errors for unsupported files and PDF parse
  failures (already does).

**Performance**
- No `import * as X` of large modules at the top of `src/main.tsx`.
- pdf.js loaded lazily via `import('../lib/pdfText')` (already is).
- Gemini SDK is server-side only — never reach `@google/genai` from `src/`.

**Store requirements (Regrade-specific — REPLACE the Cmdly defaults)**
- App icon: 1024×1024 PNG, no alpha, no rounded corners for Apple; Google
  Play uses 512×512 + a feature graphic 1024×500. Source from a single 1024
  master via `@capacitor/assets`.
- Disclaimer text shown in **About** (`src/views/About.tsx`):
  > Regrade is an educational tool, not a law firm, and does not provide
  > legal advice. AI output can be wrong. Always check official school
  > policy and review the original graded work before submitting an appeal.
- Trademark disclaimer present in About: Canvas, Gradescope, Moodle, D2L
  Brightspace, Schoology, Microsoft Teams Education, Google Classroom,
  Turnitin are trademarks of their respective owners; Regrade is not
  affiliated with any of them.
- Privacy URL in both store listings: **`https://regrade.app/legal/privacy.html`**
- Terms URL in both store listings: **`https://regrade.app/legal/terms.html`**
- Apple **App Privacy** + Google **Data Safety**: declare email, name,
  user-uploaded content, crash data, device id (Firebase telemetry). Do
  **not** declare "no data collected" — Regrade does collect uploads.
- Sign in with Apple required on iOS because Google sign-in is offered.
- Content rating: **Teen** on Play (educational with user-generated text),
  **12+** on Apple (infrequent/mild mature themes possible in uploaded
  content). Adjust only after the questionnaire.
- Short description ≤ 80 chars; long description ≤ 4000 chars.

**Offline / cold-start smoke (run from the Capacitor wrap, after Phase 1
of `STORE_LAUNCH` plan)**
1. Cold launch under 2 s on mid-range Android.
2. With airplane mode on: app boots, AuthGate shows sign-in error
   gracefully (no white screen / no crash).
3. Sign in, then airplane mode on: viewing a previously-saved case from
   `History` still works (Firestore offline cache).
4. Submit upload with airplane mode on → see a clear "no connection" error,
   not a crash.
5. `About` screen shows the disclaimer, version from `src/version.ts`, and
   working Privacy + Terms links.

Output format:
```
file.ext:LINE — fix in one sentence
```
End with `READY TO SUBMIT` or `NOT READY (<n> blocking)`.

---

End of brief.
