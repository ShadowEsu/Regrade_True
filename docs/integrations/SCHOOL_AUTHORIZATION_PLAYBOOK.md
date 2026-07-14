# School authorization playbook

Status: launch planning, 12 July 2026. This is operational guidance, not legal advice. A connector is not “live” until Regrade has completed the vendor/institution setup and an end-to-end test with persisted production data.

## Default authorization path

1. Start with the smallest read-only purpose: graded work, score, rubric, and teacher feedback for the signed-in learner.
2. Identify the data controller: learner, teacher/course admin, school IT, district/tenant admin, or vendor.
3. Send the one-page overview, data-flow, scope list, retention/deletion policy, subprocessors, incident process, and pilot plan.
4. Use a sandbox or single-course pilot. Never request write/submission permissions for import.
5. Record approval owner, tenant/site, scopes, expiry/revocation, data residency, and test evidence.
6. Enable the connector only for the approved tenant. Keep manual PDF/image import available.

## Priority systems

| System | Controller and route | Student alone? | Read-only route | Regrade next action | Public source |
|---|---|---:|---|---|---|
| Canvas | Root account admin registers a developer key; an institution can enable an Instructure-issued global key. The user then completes OAuth. A personal access token may be possible if the institution permits it. | Sometimes, for PAT only | OAuth scopes or user PAT | Replace PAT with OAuth for pilots; ask root admin for scoped developer key; verify grades/submissions endpoints in a test tenant | [Canvas developer keys](https://developerdocs.instructure.com/services/canvas/oauth2/file.developer_keys), [OAuth endpoints](https://developerdocs.instructure.com/services/canvas/oauth2/file.oauth_endpoints) |
| Google Classroom / Workspace Education | User OAuth plus Workspace admin controls. Public sensitive/restricted scopes require Google verification; restricted scopes can require a security assessment. | Sometimes; admin policy can block | Narrow Classroom read-only scopes | Complete OAuth verification, domain test, admin allow-list instructions, and token-revocation test | [Classroom authorization](https://developers.google.com/workspace/classroom/guides/auth), [OAuth consent](https://developers.google.com/workspace/guides/configure-oauth-consent) |
| Microsoft 365 Education / Teams Assignments | Entra tenant admin. Education APIs require school IT/admin consent; application permissions always require admin consent. | No for Education data; ordinary file scopes depend on tenant policy | Delegated Education or file scopes where supported | Register multitenant app; produce admin-consent URL and permission list; test in an education tenant | [Education API overview](https://learn.microsoft.com/en-us/graph/api/resources/education-overview), [permissions](https://learn.microsoft.com/en-us/graph/permissions-overview) |
| Blackboard Learn | Blackboard administrator registers the REST app/LTI tool and assigns least-privilege roles; users authorize a 3LO app within those limits. | No initial registration | REST 3LO or LTI 1.3 | Obtain test Learn tenant, register app, define integration role, test grade/feedback access | [Three-legged OAuth](https://help.blackboard.com/Learn/Administrator/Hosting/System_Integration/Building_Blocks_and_REST_APIs/Three_Legged_OAuth), [LTI](https://help.blackboard.com/Learn/Administrator/Hosting/System_Integration/LTI) |
| Moodle / MoodleCloud | Site admin enables web services, protocol, external service, functions, and token capability. | Usually no | Site-specific web-service token | Publish exact function list and Moodle version support; test on a dedicated site | [Moodle web services](https://docs.moodle.org/502/en/Web_services), [MoodleCloud web services](https://support.moodle.com/support/solutions/articles/80000835783-using-web-services-in-moodlecloud) |
| Brightspace (D2L) | System admin registers an OAuth app in Manage Extensibility; user authorization follows, or a service user is configured for server-to-server. | No app registration | OAuth 2.0 with least scopes | Request sandbox/partner access; document redirect URI and scopes; test revocation | [OAuth app setup](https://community.d2l.com/brightspace/kb/articles/21863-how-to-get-started-with-oauth-2-0), [server-to-server](https://community.d2l.com/brightspace/kb/articles/33526-register-an-oauth2-0-application-for-server-to-server-authentication) |
| Schoology | District/school installs an app; access beyond a local district generally requires Schoology App Center approval. | No | OAuth 1 on behalf of user; LTI for launch | Submit app review package; plan token renewal; pilot with one district admin | [App platform](https://developers.schoology.com/app-platform/), [LTI app approval](https://developers.schoology.com/app-platform/lti-apps/) |
| Turnitin | Turnitin partner/tenant administrator; production use requires certification or LTI validation. | No | Tenant API key / certified Core API or LTI | Apply as integrator, obtain sandbox tenant, complete certification and mutual-customer validation | [Core API certification](https://developers.turnitin.com/turnitin-core-api/certification-review), [LTI validation](https://developers.turnitin.com/turnitin-lti/lti-validation-review) |
| Clever | Clever application plus district authorization; live district data follows certification/onboarding. | No | District-scoped APIs | Create developer app, pass certification, recruit pilot district, verify least-privilege data model | [Getting started](https://dev.clever.com/me/docs/getting-started), [Secure Sync onboarding](https://dev.clever.com/docs/onboarding) |
| OneRoster | Institution/SIS issues credentials and chooses supported services. Certification improves procurement confidence. | No | Institution-scoped REST or CSV | Implement only required services/results fields; validate against 1EdTech certification profile | [1EdTech OneRoster checklist](https://www.1edtech.org/sites/default/files/media/docs/2024/OneRosterChecklistandRFPLanguage.pdf) |
| PowerSchool | PowerSchool partner program plus district configuration. | No | Partner/district integration | Apply to partner program; obtain sandbox and district sponsor | [PowerSchool partners](https://partners.powerschool.com/English/) |
| Compass | School/state-controlled integration; Compass advertises APIs and integration partners. | No | School-approved API where contracted | Contact integrations team with Australian pilot school; obtain written scope/data-location terms | [Compass integrations](https://www.compass.education/integrations/), [partner policy](https://policies.compass.education/integration-partners) |
| Sentral | School-controlled API integration. | No | Sentral REST API where enabled | Request vendor access and pilot-school authorization; verify available grade/feedback fields | [Sentral developer portal](https://development.sentral.com.au/) |

## Other systems

- Gradescope: no verified student-facing import API for Regrade. Use marked-PDF/image import until Turnitin grants partner access.
- Infinite Campus, Skyward, ClassLink: treat as vendor- and district-authorized. Apply through the vendor program before presenting a connect action.
- Google Drive, OneDrive, Dropbox: learner file selection can be possible with delegated OAuth, but education-tenant policy may still require admin approval. Keep file-picker scopes narrow and verify each provider in production.
- Email: only import an attachment explicitly selected or forwarded by the user. Do not request whole-mailbox access for launch.
- Parent portals: never reuse a learner credential. Use explicit learner sharing/pairing and revocable permissions.

## Required approval packet

Use `SCHOOL_ADMIN_ONE_PAGER.md`, `SCHOOL_SECURITY_PACKAGE.md`, `PILOT_IMPLEMENTATION_PLAN.md`, the privacy policy, subprocessors, incident contact, architecture/data-flow, exact OAuth scopes, retention schedule, deletion/revocation procedure, accessibility statement, insurance/contracting status, and a completed security questionnaire. Unknown answers must be marked pending—not inferred.
