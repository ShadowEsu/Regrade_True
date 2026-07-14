# School security questionnaire

Owner: Regrade. Status: pre-production draft. Answers marked **Open** require documentary evidence before a school pilot.

| Question | Current answer / evidence |
|---|---|
| What data is requested? | Learner identity, course/assignment metadata, graded file, score, rubric and teacher feedback; connector-specific minimization required. |
| Does Regrade write grades or submit work? | No connector is intended to request grade-write/submission. External appeal sending requires explicit user consent. |
| Authentication? | Firebase Authentication; API verifies Firebase ID tokens. Provider OAuth tokens are separate. |
| Authorization/isolation? | Owner-based Firestore rules. Notification ownership rule and server guard tests exist; complete emulator two-account coverage remains required. |
| Encryption in transit? | Production endpoints must use HTTPS/TLS. Deployment scan is **Open**. |
| Encryption at rest? | Provider-managed encryption is expected; production-project and credential-vault evidence is **Open**. |
| Connector secrets? | Intended for server-side encrypted storage, never client-readable. Production key-management verification is **Open**. |
| Logs? | Must exclude tokens and exam content. Production log redaction/retention review is **Open**. |
| Data retention? | User-controlled deletion plus pilot-specific retention. Exact backup/deletion SLA is **Open** pending production vendors/contracts. |
| Account/exam deletion? | In-app paths exist. End-to-end cascading deletion with real services is **Open**. |
| Integration revocation? | Disconnect UI exists. Provider-side token revocation testing is **Open**. |
| Parent access? | Explicit pairing and revocable permission design; real multi-account validation is **Open**. |
| AI provider and training? | Configurable Gemini backend exists. Production model, region, retention and no-training terms are **Open** until contracted/configured. |
| Subprocessors? | Firebase/Google services and selected AI/purchase/error services as configured. Final inventory, regions and DPAs are **Open**. |
| Security testing? | Type checks, unit tests, secret scan and dependency audit are run locally. No independent penetration test/SOC report is claimed. |
| Vulnerability handling? | See `SECURITY.md`. Named operational owner, SLA and disclosure mailbox monitoring are **Open**. |
| Incident response? | Contact is regradeteam@gmail.com. Formal severity, containment, evidence and school-notification runbook is **Open**. |
| Backups/RPO/RTO? | **Open**; must match production Firebase/storage configuration and contract. |
| Data residency/cross-border? | **Open**; must be selected and disclosed per pilot, especially in Australia. |
| Compliance/certifications? | No FERPA/COPPA/GDPR/APP certification, SOC 2 or ISO 27001 is claimed. Legal review is required for each launch market. |
| Accessibility? | Reduced-motion and responsive work exists; real screen-reader/dynamic-type/device audit remains **Open**. |

## Evidence requested from the institution/vendor

Tenant/site identifier; authorized approver; permissible fields/scopes; consent basis; age/guardian rule; residency/overseas-disclosure restriction; retention schedule; required security standard; breach-notification deadline; sandbox/test-data rules; offboarding trigger; support and escalation contacts.
