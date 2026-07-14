# Child and Family Privacy

**Requires professional legal and privacy review before release to children, schools, or families.** Product wording of “8+” is not legal approval and does not by itself satisfy COPPA, FERPA, GDPR/UK GDPR child-consent rules, Australian Privacy Act obligations, school contracts, or regional education requirements.

## Current safeguards

- A parent or teacher sees nothing until a learner generates a short-lived code and approves the link.
- Server authorization checks the signed-in UID, active link, learner ownership, and permission flags for every shared-case request.
- Learners can revoke the whole link or individual sharing categories.
- Mr Whale receives only cases returned for the selected authorized learner.
- Pairing records contain identifiers and permissions, not passwords or provider tokens.
- Appeals are drafts; Regrade does not send them automatically.

## Required pre-release decisions

- Determine who may legally consent for an 8–12-year-old in every launch region.
- Establish verifiable parental consent and school authorization flows where required.
- Minimize birth/age collection; do not infer or collect more than the approved consent design needs.
- Document retention, deletion, breach response, access requests, account recovery, and audit-log retention.
- Complete data-protection impact assessments and vendor/subprocessor reviews for Firebase, AI, analytics, push, and support systems.
- Test that revoked adults immediately lose API, cache, notification, and deep-link access.
