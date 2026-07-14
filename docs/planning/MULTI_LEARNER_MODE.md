# Multi-Learner Mode

## Implemented foundation

- Onboarding distinguishes Student, Parent/Guardian, and Teacher accounts.
- One adult account can redeem and retain multiple learner links.
- The Family/Teacher workspace provides search, compact learner rows, status badges, and a persisted current-learner selection.
- Switching learner context does not change authentication or expose another learner account.
- Mr Whale reads only the currently selected, actively linked learner's shared cases.
- Learners control exam, AI-finding, appeal-draft, and notification permissions per link and can unlink at any time.
- Pairing codes expire after ten minutes; the learner must approve the pending link.

## Persisted records

- `users/{uid}.accountRole`: `student`, `parent`, or `teacher` (`supervisor` remains accepted only for migration).
- `supervisionLinks/{linkId}`: learner UID, adult UID, status, expiry, permissions, consent timestamp, permission audit timestamps.
- `supervisionLinks/{linkId}/suggestions/{id}`: deduplicated adult review suggestions.
- `localStorage.regrade.family.selectedLink`: non-sensitive UI preference identifying which already-authorized link is selected. Authorization is always rechecked server-side.

## Remaining release work

- Invitation links and school-authorized roster imports are not implemented.
- Class grouping, roster pagination/virtualization, pinning, and bulk notification controls need a production data model.
- Native push messages need per-learner preference enforcement and learner names in payload copy.
- Real two-account isolation, revocation, recovery, and high-volume teacher tests remain mandatory.
