# Final pre-beta QA report

Date: 2026-07-12

## Outcome

**Internal source/build verification passed. External beta and store submission remain blocked.** No
claim was made that real providers work without configured credentials and persisted
test evidence.

## Automated results

| Check | Result |
|---|---|
| Client TypeScript | Pass |
| Client Vitest | 49/49 pass across 8 files |
| Server TypeScript/build | Pass |
| Server automated tests | 3/3 pass (import window, input guards, production fail-closed) |
| Client production dependency audit | 0 known vulnerabilities at audit time |
| Server production dependency audit | 0 known vulnerabilities at audit time |
| Production Vite build | Pass; Firebase chunk warning remains |
| Capacitor iOS/Android sync | Pass |
| iOS Release simulator build | Pass without code signing; 35,090,403-byte universal simulator `.app` |
| Android APK/AAB | Unavailable: no Java runtime installed |
| Repository secret/path scanner | Pass |
| `git diff --check` | Pass |
| Production dependency audit | Client 0; server 0 known vulnerabilities at run time |

Native sync correctly warned that `VITE_API_BASE_URL` is unset, so native AI routes
cannot work until rebuilt against a deployed HTTPS API.

## Local runtime check

Earlier local checks covered Loading, Welcome, Survey, Home, Review, Appeal, History,
and Profile. This pass loaded the production build at 1280 and 360 pixels:
sign-in had no horizontal overflow and the browser console reported no warnings/errors.
Preview query parameters were inert: no preview toolbar or preview user was exposed.

The app no longer contains a synthetic runtime path. This check does not validate provider
OAuth, store receipts, remote push, Gemini accuracy, or real account deletion; each still
requires configured test services and real test accounts.

## Code/config changes in this pass

- expanded ignore rules for logs, databases, uploads, test reports, artifacts, and private notes
- strengthened the publish scanner for forbidden data files and personal workstation paths
- removed an obsolete tracked internal brief containing a personal path
- completed missing connector encryption and rate-limit environment examples
- restricted client notification updates to read/archive metadata
- reorganized documentation and replaced misleading AI/connector claims
- centralized connector release labels and separated them from connection state
- made production preview behavior impossible unless Vite is running in development `preview` mode
- created school/vendor authorization, Australian expansion and store-submission packets
- right-sized two oversized raster assets; the current production `dist` is 5,944,851 bytes
- restored Mr Whale as the center navigation destination with reusable assistant states and contextual case/learner input
- moved History into the top-right account menu and made light, dark, and system appearance choices functional
- added student, parent/guardian, and teacher roles plus searchable, filterable, pinnable multi-learner switching
- enforced learner-controlled family permissions for exams, AI findings, appeal drafts, and notifications
- measured current web and unsigned iOS artifacts in `APP_SIZE_REPORT.md`

## Remaining critical gates

Follow `RELEASE_CHECKLIST.md`. Highest priorities are Firebase emulator isolation tests,
configured end-to-end data persistence/deletion, live connector certification,
Gemini evaluation, remote push, RevenueCat sandbox lifecycle, and legal review.

Repository publication is also blocked: the initial Git commit still contains a deleted
document with a personal filesystem path. Squash or rewrite history and rerun the scanner
against the final publish branch before pushing publicly.
