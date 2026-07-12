# Beta Test Plan

## Gate 1 — configured staging

- Deploy a staging Firebase project and API.
- Populate every required value in `ENVIRONMENT_VARIABLES.md`.
- Deploy Firestore and Storage rules.
- Configure one real Canvas or Google Classroom OAuth fixture before enabling any other connector.
- Configure separate student and supervisor test accounts.

## Gate 2 — core student journey

1. Create an account and resume interrupted onboarding.
2. Connect a platform or explicitly skip it.
3. Upload a multi-page marked PDF and confirm progress, retry, and safe errors.
4. Confirm the real case, pages, AI findings, and source metadata persist after sign out/in.
5. Highlight, draw, and add text on multiple pages; zoom, reopen, resize, and rotate for viewing.
6. Ask Mr. Whale about the current exam and verify the case context reaches the API.
7. Save an appeal draft, edit it, and verify no external send occurs without final consent.
8. Reopen the case and annotations from History.

## Gate 3 — connector and Auto Mode

1. Import a newly graded item inside the seven-day automatic window.
2. Verify duplicate webhooks/import scans create one idempotent job.
3. Verify an item with no returned marked file remains `awaiting_returned_file` and produces no fake finding.
4. Verify a returned file completes analysis, persists findings, creates one notification, and deep-links to the case.
5. Disable Auto Mode and confirm only user-selected imports run.
6. Revoke OAuth and confirm the connector becomes Connection failed with a safe reconnect action.

## Gate 4 — parent/supervisor

1. Pair two real accounts through an expiring, one-use code.
2. Grant and revoke each permission independently.
3. Confirm the supervisor cannot read documents beyond granted learners/cases.
4. Confirm the learner can see supervisor activity relevant to their account.
5. Delete either account and verify links/codes no longer grant access.

## Gate 5 — native and accessibility

- iPhone portrait/landscape, iPad, one current Android phone, macOS Safari/Chrome, Windows Chrome/Edge.
- VoiceOver, TalkBack, keyboard-only, 200% text/zoom, reduced motion, high contrast.
- Permission denied for notifications/photos/files.
- Offline, slow network, timeout, AI 429/503, expired auth, malformed/encrypted PDF, and maximum supported file.

Beta invitations may begin only after every critical item in `RELEASE_CHECKLIST.md` has evidence and no security, data-loss, cross-account, consent, or entitlement blocker remains.
