# Data access model

| Actor | Access |
|---|---|
| Student | Own profile, cases, documents, annotations, connections, imports, notices |
| Approved supervisor | Only data exposed through an accepted, revocable family link |
| Browser client | Firebase user-scoped data and authenticated API calls |
| Regrade API | Admin access only after token/App Check/route authorization |
| AI provider | Minimum submitted exam context needed for the requested analysis |
| Connector provider | User-authorized read scopes; no password collection |

Supervisors cannot silently join, change a learner's work, or send an appeal. School
authorization does not replace learner/parent consent. Access must be revocable and audited.
