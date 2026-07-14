# Teacher Roster Authorization

Regrade currently supports individually approved learner links. School roster connection is not yet implemented or represented as live.

Before adding a roster provider:

1. Obtain written school/district and provider authorization.
2. Use least-privilege, read-only scopes and tenant-admin consent where required.
3. Map teacher, class, learner, and guardian roles without copying passwords.
4. Record roster source, grant owner, scope, expiry, last sync, and revocation.
5. Keep learners isolated by server-side ownership and enrollment checks.
6. Support removal, course changes, graduation, and staff departure promptly.
7. Complete regional education/privacy review and a real multi-tenant security test.

Teacher search, learner switching, and consent-linked access can scale to roster data later, but today each learner must be linked through the existing consent flow.
