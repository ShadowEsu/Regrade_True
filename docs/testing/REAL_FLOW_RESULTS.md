# Real Flow Results — 2026-07-14 verification pass

Environment: user's Mac, real Chromium (in-app browser), Vite dev server :3220,
Express API :8787, Firebase Auth + Firestore **emulators** (Java 21, firebase-tools
15.23.0). Emulator wiring added behind `VITE_FIREBASE_EMULATOR=true` in
`src/lib/firebase.ts`; launch config `regrade-emulated` in `.claude/launch.json`.
All flows below were exercised in the running app, not unit tests.

## Auth (live Firebase for error path, emulator for full flows)
| Flow | Result |
|---|---|
| Invalid credentials against LIVE Firebase | PASS — human message "The email or password is incorrect.", form stays usable |
| Student email signup (emulator) | PASS |
| Parent email signup (emulator) | PASS |
| Returning email login | PASS |
| Logout (Profile > Settings & account > Sign out) | PASS — returns to auth screen |
| Cleared local storage + login | PASS — session gone, login works, tutorial does NOT repeat (server-persisted) |
| Signup heading | FIXED — previously stuck on "Welcome back" (AnimatePresence hang) |

## Onboarding (WelcomeSurvey)
| Flow | Result |
|---|---|
| Intro carousel (3 slides) | PASS after fix — previously TRAPPED every new user (see bugs) |
| Student path: role, name, institution, connector skip, notifications skip | PASS — server route `saveOnboardingDetails` writes via Admin SDK |
| Parent path: supervisor branch, no ConnectScreen, consent copy shown | PASS — lands on Family Workspace |
| Mid-flow state | Steps advance one-way; refresh mid-survey re-enters at intro (acceptable, no trap) |

## Tutorial (ProductTutorial)
| Flow | Result |
|---|---|
| Fresh student: 10 steps, final "Start using Regrade" | PASS — overlay closes |
| Completion persists across reload | PASS — no localStorage marker needed (server write succeeded) |
| Completion survives cleared storage + relogin | PASS |
| Fresh parent: supervisor tutorial appears | PASS (walked partially) |
| Signed-out `?tour=1` | N/A — AuthGate gates the app; shows login (no trap) |

## Screens swept (student account)
375px: Home, Review, Mr Whale, Appeal, Profile — 0px horizontal overflow each.
(Mr Whale has an internal horizontal scroller for suggestion chips — by design.)
1280px: all five tabs render full-width (not phone-narrow). Desktop Home is
functionally fine but visually sparse below the streak card.
Auth screen swept at 360/390/414/768/1024/1280/1440 — no overflow at any width.

## Profile data integrity
| Flow | Result |
|---|---|
| First profile write on brand-new account | FIXED — was failing 100% of the time (two stacked bugs, see below) |
| User-chosen name survives app relaunch | FIXED — passive boot sync no longer clobbers (verified at doc level in emulator) |

## Bugs found and fixed this run
1. **Onboarding trap (critical):** `AnimatePresence mode="wait"` exit hang froze the
   intro slide over the survey; every new user stuck at "Get started". Reproduced
   deterministically with slow clicks. Fixed by keyed remount without exit gating.
   Same pattern removed from Auth.tsx title, UploadGuidePanel, AppealDraftPanel
   ("Writing your appeal email…" could have hung forever), Profile section switch.
2. **New-user profile write always failed (high):** `preferredPlatform: undefined`
   crashed `setDoc`; first fix (`?? null`) then failed security rules
   (`isValidPlatformId(null)`). Final fix: omit the optional field until set,
   matching the rules contract. Verified: client create now passes real rules.
3. **Name clobber (high):** AuthGate boot sync overwrote the user's chosen name with
   an email-derived fallback on every launch. Fixed with `passive: true` sync mode
   that only fills missing identity fields. Verified at Firestore-doc level.
4. **Vitest suite broken on Node 25 (tooling):** Node's experimental webstorage
   clobbers jsdom localStorage; 7 tests failed. Pinned
   `NODE_OPTIONS=--no-experimental-webstorage` in the npm test script. 56/56 green.

## Known issues remaining (not fixed this run)
- The in-app browser controller blocked the final localhost visual sweep on
  2026-07-15. The production build and deterministic tests pass, but the latest
  Appearance and paper-review layouts still need a short manual device sweep.
- Sign out is buried (Profile > Settings & account); consider surfacing it.
- First real pointer click on auth buttons can miss during entrance animation
  (observed twice via CDP-dispatched clicks; may be automation-only — verify by hand).
- Desktop (≥1280) Home has a large empty region below the streak card.

## 2026-07-15 integrity and reward follow-up

- **Point estimate integrity:** possible appeal points are deduplicated per
  question, capped by the question's documented loss and by the assignment's
  total score gap. Over-awards never count as recoverable. The UI now calls this
  an evidence estimate and explicitly says it is not guaranteed.
- **Paper visibility:** Evidence Summary links directly to the marked paper.
  Review displays the persisted document and a companion evidence/annotation
  panel side by side on desktop, stacking them on small screens.
- **Activity reward:** the server records one UTC activity day per account per
  day. Every 30 unique activity days banks five days of Plus access. Banked time
  is redeemed only through an explicit user action and extends after any active
  paid/trial period rather than replacing it.
- **Session recovery:** authenticated API requests retry once with a refreshed
  Firebase ID token. A genuinely expired session signs out cleanly instead of
  leaving onboarding trapped behind repeated 401 responses.
- **HMR stability:** the client reuses its React root during hot reloads, removing
  the duplicate-root path that caused the previously observed `removeChild`
  transition crash in development.
- **Verification:** client TypeScript, 58 tests, and production build pass;
  server TypeScript, eight tests, and build pass.
