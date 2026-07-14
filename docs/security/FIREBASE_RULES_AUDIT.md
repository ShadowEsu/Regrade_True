# Firebase rules audit

`firestore.rules` and `storage.rules` are default deny. Profiles are owner-addressed;
cases, annotations, and notifications check the authenticated UID; uploads are limited
to `users/{uid}/documents/**`, supported MIME types, and 25 MiB.

Before beta, add emulator tests for unauthenticated access, user A versus user B,
forged `userId`, immutable email/owner/created timestamps, oversized fields/files,
unsupported MIME, annotation bounds, queries, update allowlists, and deletion. Admin SDK
code bypasses client rules and must independently authorize every request.
