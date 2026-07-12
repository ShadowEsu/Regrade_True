# Security Rules Audit

Firestore and Storage remain default-deny. User and case records require the authenticated owner. Annotation reads/writes verify parent-case ownership, allowed fields, bounded pages/text/path, normalized geometry, and safe types/colors/rotation. Notification reads/writes require the owner and bounded content/type/deep link. Storage requires owner UID, supported PDF/image MIME, and files under 25 MB.

Remaining gate: add Firebase Emulator rule tests for unrelated users, forged owner IDs, oversized paths/text, arbitrary fields, deleted parent cases, notification tampering, and supervisor access. Do not deploy these new collections without those tests and the updated rules.
