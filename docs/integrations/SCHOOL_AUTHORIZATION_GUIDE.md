# School authorization guide

Regrade requests least-privilege, read-only access to the learner's graded work, rubric,
score, and teacher feedback. A school should review data flow, subprocessors, retention,
incident response, deletion, support contacts, OAuth scopes, App Check, and audit controls.

Authorization must identify the tenant, approved users, exact scopes, expiry/revocation,
and whether parent/learner consent is required. Regrade must never ask administrators to
share passwords or broad service-account access when a scoped app grant is available.
