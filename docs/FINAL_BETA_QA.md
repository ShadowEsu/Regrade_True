# Regrade Final Beta QA

Date: July 11, 2026  
Scope: Student and parent/supervisor modes  
Result: **Not yet ready for an external beta**

## Decision

The client and server compile, automated tests pass, production dependency audits are clean, and the preview UI can be exercised. However, an external beta must wait until the critical flows below are verified against real Firebase data, real connector accounts, a deployed API, and native purchase sandboxes. Preview data is not evidence that a production integration works.

## Automated verification

| Check | Result | Evidence |
| --- | --- | --- |
| Client TypeScript | Pass | `npm run lint` |
| Client tests | Pass | 48 tests across 7 files |
| Client production build | Pass | `npm run build` |
| Server TypeScript build | Pass | `npm --prefix server run build` |
| Deterministic grading audit | Pass | 13 checks, 0 failures |
| Client production dependency audit | Pass | 0 known vulnerabilities |
| Server production dependency audit | Pass | 0 known vulnerabilities |
| Capacitor asset/plugin sync | Pass with blocker warning | iOS and Android assets/plugins synced; API URL is unset |
| Bundle review | Warning | Firebase chunk is about 520 KB minified; PDF worker is intentionally lazy-loaded |

## Journey matrix

| Journey | Student | Parent/supervisor | Status |
| --- | --- | --- | --- |
| Sign up → onboarding → connector selection → dashboard | Preview UI exercised; persistence code present | Preview UI present | **Needs real Firebase verification** |
| Manual PDF upload → analysis → Review → annotation → Appeal → History | Preview pipeline works; real API path exists | Review access depends on family permissions | **Needs deployed AI and persisted-data verification** |
| Connected import → AI review → notification → Review → Appeal → History | Import metadata exists, but full AI chaining is incomplete | Same limitation through linked learner | **Blocked** |
| Auto Mode enabled | Preference retained, but the full automatic analysis/draft pipeline is not implemented | Not offered as a completed capability | **Blocked** |
| Auto Mode disabled/manual action | Manual analysis UI exists | Parent can inspect/draft only when authorized | **Needs real API verification** |
| Pairing, permissions, dashboard, review, notifications | N/A | Real endpoints exist; preview uses simulated data | **Needs two real accounts and deployed API** |
| Returning user with many exams | Search/filter and 20-item incremental rendering added | Linked learner history uses the same UI patterns | **Pass in UI; needs load test with persisted records** |
| User with no exams | Empty states and primary upload/connect actions present | No-linked-learner state present | **Pass in preview** |
| Failed imports | Connector status and retry messaging present | Same provider status rules | **Needs provider failure test** |
| Incomplete profile | Onboarding/profile recovery paths present | Same | **Needs real persistence test** |
| Expired/disconnected integration | Explicit disconnected/failed/setup states present | Same | **Needs expired-token fixture** |

## Fixes completed in this pass

- Added a shared 25-second API timeout, offline detection, aborted-request handling, and user-safe network errors.
- Added a centralized error translator so Firebase, AI, and upload failures do not expose raw SDK messages, paths, tokens, or stack details.
- Added explicit connector states: Connected, Available, Coming soon, Needs setup, and Connection failed.
- Removed copy that implied the unfinished Auto Mode pipeline was operational.
- Added notification preferences for imports, completed analysis, possible issues, appeal readiness, parent updates, and weekly summaries.
- Added notification grouping and safe in-app deep-link routing.
- Added deletion of an exam record and its stored page images.
- Added multi-page navigation and 75–200% zoom for paper review.
- Added 20-item incremental History rendering to reduce large-list work.
- Increased PDF page controls to 44-point touch targets.
- Added Firestore validation for notification preferences and retained owner-scoped case access.
- Preserved the approved yellow containers and black primary actions.

## Failure-state review

The shared API layer now provides loading-compatible request behavior, offline and timeout errors, and retryable messages. Connector initial loading, connection, disconnection, and saved-connection loading have explicit progress, success, failure, and retry behavior. Upload and AI errors are sanitized.

This does **not** prove every third-party response has been seen. Before beta, use the real-device plan to force timeout, offline, revoked permission, expired OAuth, upload-too-large, corrupted PDF, AI 429/503, payment cancellation, and Firebase permission-denied cases.

## Privacy and safety review

- Firestore cases are owner-scoped; unmatched paths are denied by default.
- Storage documents are scoped under each user and restricted by size/content type.
- Parent access requires an explicit pairing flow in the real API design.
- Uploaded exams can be deleted from History; account deletion code removes user documents and account records when the server is correctly configured.
- Integrations can be disconnected.
- No external appeal send is implemented, so the app cannot silently send an appeal. Any future sending feature must require a final, recorded user confirmation.
- AI language presents findings as possible inconsistencies, not guaranteed teacher errors or recovered marks.
- Application logs were reviewed to avoid raw exam content and user-facing raw errors, but production error-monitoring redaction still needs implementation and verification.

## Annotation review

Multi-page images, page navigation, reopening, scrolling, and zoom are supported. Findings are displayed in a separate evidence rail instead of coordinate overlays. This design avoids false visual alignment after resizing, but it does not yet provide precise red/green boxes anchored to handwriting, diagrams, or page coordinates. Rotation and coordinate-overlay testing therefore remain blocked until an annotation coordinate schema is implemented.

## Accessibility and responsive review

Existing semantic buttons, visible focus styles, reduced-motion CSS, responsive layouts, and 44-point PDF controls were retained or improved. Automated compilation cannot certify screen-reader output, dynamic type, Windows high-contrast mode, VoiceOver/TalkBack order, landscape clipping, or keyboard-only completion. Those are mandatory real-device/manual checks.

## Performance findings

- Views are route-lazy-loaded.
- History now renders in 20-item increments.
- PDF processing remains in lazy chunks/workers.
- Production build succeeds.
- Firebase remains a roughly 520 KB minified chunk and should be profiled on a low-end device.
- PDF rendering, 100+ history records, 25 MB uploads, and background sync still require device/network measurements.

## Critical blockers

1. Deploy the API and set `VITE_API_BASE_URL`; the current native sync warns when it is absent.
2. Complete Auto Mode orchestration from import to AI analysis, saved findings, notification, Review, and History.
3. Verify Firebase rules in the production project using two accounts and emulator/rules tests.
4. Verify each connector marked Available with real OAuth credentials and real graded work.
5. Verify parent pairing and revocation using separate adult and learner accounts.
6. Configure and test APNs/FCM remote notifications; the current implementation is local notification delivery.
7. Configure RevenueCat products and test purchase, restore, renewal, cancellation, and expiration in Apple/Google sandboxes.
8. Install a compatible Java runtime and complete the Android release build/device test.
9. Implement and test production analytics/error monitoring with PII/document redaction.
10. Run the complete real-device test plan and record evidence.

## Beta invitation decision

Do not invite external beta users yet. An internal preview/design test is acceptable because preview mode is clearly simulated. External beta access is allowed only after every critical blocker is closed and the release checklist is signed.
