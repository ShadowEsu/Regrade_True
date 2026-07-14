# Nightly automation state

Updated: 2026-07-14 (overnight run)

## Current branch
`claude/eager-faraday-onvkkq` — based on `origin/feature/regrade-2-mobile-redesign` (f753546). Pushes from automation go to this branch only.

## App status
Laptop/web first: Vite SPA on :3000, Express API on :8787, Electron shell via `npm run desktop`. Capacitor mobile deferred. TypeScript check clean; vitest suite green (56 tests / 10 files).

## Most important known issues
1. Client Firestore profile writes can hit permission-denied — `userService.setThemePreference`, `acceptAiConsent`, `setAnalysisAlerts`, `setNotificationPreferences`, `setAutoMode`, `setAutomaticGradeDetection`, `setStudyChecklist`, and `syncProfile` still write Firestore directly from the client; onboarding/tutorial already go through server Admin routes (`server/src/profile.ts`).
2. Desktop wide layout needs visual verification at ≥1100px (Home done in `src/index.css` + `Dashboard.tsx`; Review/Appeal/Profile/Mr Whale may still be phone-narrow).
3. Electron Google OAuth end-to-end retest pending; passkeys hang in embedded browsers (needs doc note).
4. Local Stripe billing flow (checkout + `stripe listen` webhook) unverified since desktop shell changes.

## Last completed fix
Tutorial final step could trap the user behind the full-screen overlay: silent no-op when `auth.currentUser` was null, and an infinite blocked-retry state when `POST /v1/profile/tutorial-complete` failed (offline / expired session / permission denied). Now the last step always closes; failed server writes are remembered per-account in localStorage (`src/lib/tutorialCompletion.ts`) and retried on next launch.

## Tests last run
`npm run lint` (tsc) — clean. `npx vitest run` — 56 passed, including new `src/lib/tutorialCompletion.test.ts` and `src/components/ProductTutorial.test.tsx`.

## Next recommended task
Route remaining client Firestore profile writes (settings toggles, theme, AI consent) through authenticated server Admin endpoints, mirroring the onboarding/tutorial pattern in `server/src/profile.ts`. Medium scope, no rules weakening.

## Blockers / missing credentials
- No Firebase credentials or emulator in this container; runtime auth/Firestore flows cannot be exercised here (unit tests use mocks).
- Electron binary download blocked by network proxy (`ELECTRON_SKIP_BINARY_DOWNLOAD=1` required for `npm install`); Electron runtime testing needs the user's machine.
- Stripe test keys and `stripe` CLI are local-only on the user's machine.
