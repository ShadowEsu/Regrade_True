# Nightly automation log

## 2026-07-16 — pre-release hardening and native startup repair
- Fixed light-only runtime and removed reachable appearance controls.
- Added a shared Free/Plus/Pro catalog and entitlement/reward tests.
- Added server-owned profile writes, health/contract/billing/secret verification scripts, and a two-user Firebase isolation test (execution blocked by missing Java).
- Built unsigned macOS arm64 package and iOS simulator application.
- Diagnosed iOS splash: Firebase web redirect resolution in WKWebView prevented first paint. Startup now registers auth state immediately and skips the web resolver on native; rebuilt iPhone 17 Pro simulator reaches sign-in.
- Added release, legal-draft, QA, size, handoff, and morning-report documentation. No production service, billing, or user data was touched.

## 2026-07-14 — Tutorial final step can no longer trap the user
- Selected priority 1 (tutorial stuck at end). Verified by code trace: `ProductTutorial.finishTutorial` returned silently when `auth.currentUser` was null (signed-out `?tour=1`, auth races), and a failed `POST /v1/profile/tutorial-complete` left the user blocked behind the `fixed inset-0` overlay with retry as the only option.
- Fix: last step now always calls `onComplete`. Failed server writes record a per-account pending marker (`src/lib/tutorialCompletion.ts`); `App.tsx` treats the marker as complete on next launch and retries the server write in the background; `userService.completeTutorial` clears the marker on success.
- Tests: 7 new (marker helpers + component behavior for success / failure / signed-out). Full suite 56 passed; tsc clean.
- Commit: see `fix(tutorial)` commit on this branch.
