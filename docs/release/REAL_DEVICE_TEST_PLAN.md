# Real Device Test Plan

## Required test matrix

Test at minimum:

- Current iPhone and one older supported iPhone, portrait and landscape.
- Current iPad and one compact tablet width.
- One recent Pixel and one lower-memory Android phone.
- Safari and Chrome on macOS.
- Chrome and Edge on Windows at 1280, 1440, and 1920 pixel widths.
- VoiceOver on iOS/macOS and TalkBack on Android.
- Keyboard-only navigation on macOS and Windows.

Use two Firebase test users: one learner and one parent/supervisor. Never use real student records.

## Environment preparations

1. Deploy the server to HTTPS and set `VITE_API_BASE_URL`.
2. Deploy Firestore and Storage rules.
3. Configure test OAuth apps and callbacks for each connector under test.
4. Configure RevenueCat sandbox products and entitlements.
5. Configure APNs/FCM test credentials.
6. Enable production-like App Check in a staging Firebase project.
7. Seed only synthetic graded exams, rubrics, teacher comments, handwriting, equations, and diagrams.

## Student journeys

For every step, record screen, device, build, account, timestamp, expected result, actual result, and a screenshot/video.

1. Create an account, verify email if enabled, complete student onboarding, skip connector setup, and reach the empty dashboard.
2. Sign out/in and confirm name, role, notification choices, subscription, and onboarding completion persist.
3. Connect each supported provider; reject permission once, retry, revoke externally, reconnect, and disconnect inside Regrade.
4. Upload a one-page image, a multi-page PDF, a long PDF, handwriting, essay, math, chemistry, and diagram samples.
5. Test 3G/slow network, offline before upload, offline during upload, server timeout, AI 429, AI 503, corrupted PDF, encrypted PDF, and 26 MB file.
6. Confirm analysis persists after force-close/relaunch and appears consistently in Review and History.
7. Navigate pages, zoom 75–200%, rotate, resize, background/resume, and reopen every annotation sample.
8. Draft an appeal, edit it, leave and return, copy/export it, cancel, and confirm nothing is sent without final consent.
9. Delete an exam and verify its Firestore record and Storage objects are inaccessible afterward.
10. Test 0, 20, 100, and 500 History records; search/filter while scrolling and after relaunch.
11. Enable and disable each notification category; group multiple imports; verify the deep link and badge state.
12. Purchase Student and Pro, cancel, renew, expire, restore on a second device, and test an interrupted/cancelled purchase.
13. Delete the account, then verify login fails and all user-scoped Firestore/Storage data is gone.

## Auto Mode

Run only after orchestration is complete.

1. Enable Auto Mode with explicit consent.
2. Publish synthetic graded work dated within seven days.
3. Confirm one import, one analysis, one persisted finding set, one grouped notification, one Review record, and one History event.
4. Confirm assignments older than seven days are not automatically imported.
5. Confirm duplicate provider webhooks do not create duplicate cases or notifications.
6. Disable Auto Mode and confirm no automatic analysis occurs; manual Appeal must still work.
7. Revoke provider access mid-run and confirm a safe failed state and retry/reconnect action.

## Parent/supervisor journeys

1. Create a separate adult account and select parent/supervisor during onboarding.
2. Generate a short-lived pairing code as the learner; redeem it as the parent; approve it as the learner.
3. Verify the parent sees only approved data and cannot access another learner by modifying IDs or URLs.
4. Test pending, approved, expired, revoked, and reused pairing codes.
5. Change permissions individually for dashboard, exam review, History, appeal drafting, and notifications.
6. Verify the parent can identify a learner struggle and prepare an appeal draft without sending it automatically.
7. Confirm the learner receives the correct account notification when a parent prepares an action.
8. Unpair from each side and verify access disappears immediately, including cached/offline views.
9. Delete either account and verify orphan links/codes are removed.
10. Attempt cross-account Firestore and Storage reads with copied document URLs; every unauthorized request must fail.

## Accessibility

- Complete every primary flow with keyboard only.
- Verify focus never disappears behind sticky navigation or dialogs.
- Verify every icon-only action has a spoken label.
- Test 200% browser zoom and the largest OS text size.
- Test reduced motion, increased contrast, color filters, and dark mode.
- Confirm status is not communicated by color alone.
- Confirm touch targets are at least 44×44 points and no action is hover-only.

## Performance budgets

Measure cold and warm runs on the slowest device:

- First useful screen: target under 3 seconds on a typical mobile connection.
- Dashboard data: target under 2 seconds after authentication.
- Search/filter response: target under 100 ms for 500 records.
- Page switch/zoom interaction: target visually responsive without main-thread stalls.
- Upload progress: must update at least every second and support cancellation/retry.
- Background sync: must not duplicate data or noticeably drain battery.

Do not waive a failed security, data-loss, account-access, consent, or purchase-entitlement test.
