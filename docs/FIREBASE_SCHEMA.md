# Firebase Schema

- `users/{uid}`: identity/profile, onboarding, role, preferences, notification categories, automation choices, study checklist.
- `users/{uid}/connections/{platform}`: encrypted server-managed connector record.
- `users/{uid}/imports/{importId}`: provider metadata and honest import status.
- `users/{uid}/automationJobs/{jobId}`: durable automation state (initial job creation now implemented; full worker pending).
- `cases/{caseId}`: owner, assignment evidence, AI analysis, draft, status/progress, stored page URLs.
- `cases/{caseId}/annotations/{annotationId}`: normalized page annotation, type/color/geometry/path/text/rotation, owner and timestamps.
- `notifications/{notificationId}`: owner, category, content, deep link, group key, read/archive timestamps.
- `supervisionLinks/{linkId}` and subcollections: learner/supervisor consent, suggestions, audit-related timestamps.
- `pairingCodes/{codeHash}`: short-lived learner-created pairing records.
- Storage `users/{uid}/documents/{caseId}/pages/*`: retained exam page images.

Preview-mode equivalents live only in labeled local storage and never mix with production Firebase.
