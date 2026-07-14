# School pilot implementation plan

## Gates

1. **Sponsor and scope:** institution, system, cohort, dates, success measures, prohibited actions and owners documented.
2. **Legal/privacy:** DPA, consent/parent requirements, APP/state/sector policy, subprocessors, data location, retention and incident clauses accepted.
3. **Technical:** sandbox, app registration, exact scopes, redirect URIs, tenant allow-list, rate limits and revocation configured.
4. **Acceptance:** two-account isolation, token expiry/revocation, import accuracy, delete exam/account, disconnect, audit logs, accessibility and failure states pass with test data.
5. **Go live:** small cohort, monitored support, no automatic external sending, daily incident review first week.
6. **Close:** revoke credentials, reconcile/delete pilot data per agreement, export metrics without personal content, record decision.

## Four-week example

| Week | Work | Exit evidence |
|---|---|---|
| 0 | Contract, consent, sandbox, training and test accounts | Signed scope; approved config |
| 1 | 5–10 users, manual import plus connector observation | Successful ownership/import/delete tests |
| 2 | Limited connector use; support and accessibility review | No critical privacy/access incidents |
| 3 | Study/appeal usability; no grade-outcome promises | User feedback and issue register |
| 4 | Offboarding, deletion/revocation, report | Institution sign-off and next decision |

Stop immediately for cross-account access, unapproved scope/data, irrecoverable data loss, exposed credentials, or external sending without consent.
