# Final release plan

Status: **pre-beta; blocked on configured-service testing** (2026-07-12).

## Sequence

1. Run `bash scripts/check-secrets.sh` and inspect Git history before publishing.
2. Configure a non-production Firebase project, App Check, API host, Gemini, and
   one connector at a time.
3. Deploy and test Firestore/Storage rules with two unrelated test accounts.
4. Exercise upload → analysis → review → draft → history with persisted data.
5. Exercise account deletion and verify Auth, Firestore, Storage, family links,
   notifications, connections, and billing metadata are removed.
6. Configure RevenueCat and sandbox products; do not enable paid UI until store
   receipts are verified end to end.
7. Run the real-device plan on iOS first, then Android and desktop web.
8. Invite a small closed beta only after every critical release-checklist item passes.

No appeal is sent automatically. Regrade prepares a draft for the user to review.
