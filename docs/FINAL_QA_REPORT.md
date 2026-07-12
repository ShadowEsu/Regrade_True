# Regrade 2.0 Final QA Report

Date: July 12, 2026

## Outcome

The approved light-mode redesign compiles, the server compiles, 48 automated client tests pass, production dependency audits report zero known vulnerabilities, and Capacitor synchronized the current build to both native projects. The original interface remains recoverable from `backup/regrade-pre-mobile-redesign-20260712` at commit `ced9632`.

This is ready for internal design and configured-development testing. It is **not yet ready for an external beta** because the production API URL, real OAuth connector credentials, remote push, RevenueCat store products, Firebase emulator/rules evidence, and two-account parent tests are unresolved.

## Screens changed

- Home command center
- Appeal entry and five-step workflow framing
- Study / Review library and evidence-only empty state
- Real paper viewer with persistent user annotations
- Contextual Mr. Whale inside exam review
- History metrics and scan-friendly records
- Parent/supervisor dashboard states
- Profile appearance/settings structure
- Notification center
- Connector import and Auto Mode status copy

## Data and backend work

- Annotation documents persist under `cases/{caseId}/annotations/{annotationId}` and are removed with their case/account.
- Notification documents persist under `notifications/{notificationId}` with owner-only rules, read/archive state, category, group, and deep link.
- Automatic imports create explicit automation job records instead of claiming analysis is already complete.
- Analysis and issue notifications are created only after a case has actually been analyzed and saved.
- Appeal-ready notifications are created only after the draft is persisted.
- Appeals still require an explicit human approval; there is no automatic external send.

## Verification performed

| Check | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm test -- --run` | 48/48 pass |
| `npm run build` | Pass |
| `npm --prefix server run build` | Pass |
| Client `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities |
| Server `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities |
| `npm run cap:sync` | Pass; warning that `VITE_API_BASE_URL` is missing |
| `git diff --check` | Pass |

## Browser QA limitation

The required in-app Browser skill could not start because its installed package is missing `scripts/browser-client.mjs`. Per the browser tool instructions, no standalone Playwright or Selenium substitute was used. Therefore visual, pointer, screen-reader, and full journey claims remain subject to manual/in-app Browser retesting after that plugin is repaired.

## Remaining release blockers

1. Deploy the authenticated HTTPS API and rebuild with `VITE_API_BASE_URL`.
2. Deploy/test Firestore and Storage rules with owner, unrelated, learner, and supervisor accounts.
3. Complete the idempotent Auto Mode worker from returned file through AI analysis and notification.
4. Verify every connector labeled Available using its real OAuth application and provider fixture.
5. Configure APNs/FCM remote push and background event delivery.
6. Configure RevenueCat/store products and test purchase lifecycle in sandboxes.
7. Run the real-device, accessibility, large-PDF, rotation, offline, timeout, and many-exam plans.
8. Repair the Browser plugin and complete interactive regression QA with no console errors.

See `KNOWN_LIMITATIONS.md`, `REAL_DEVICE_TEST_PLAN.md`, `ANNOTATION_QA_PLAN.md`, and `RELEASE_CHECKLIST.md` for the detailed gates.
