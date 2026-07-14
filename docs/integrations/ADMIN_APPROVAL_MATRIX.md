# Administrator approval matrix

| Platform | Approver | Mechanism | Vendor step | Regrade deliverable |
|---|---|---|---|---|
| Canvas OAuth | Canvas root admin | Developer key + scopes + redirect URI | Global key only if pursued | Scope list, privacy/security packet, pilot tenant |
| Google Workspace Education | Workspace admin and Google verification team | OAuth app controls; domain allow-list; sensitive/restricted scope verification | Google OAuth verification | Consent screen, scope justification, verified domains, security assessment if required |
| Microsoft Education | Entra tenant admin | Admin consent for Graph Education permissions | Microsoft publisher verification recommended | App registration, permission inventory, consent URL, tenant pilot |
| Blackboard | Learn administrator | REST app/3LO or LTI registration + integration role | Anthology partner route if distributed | LTI/REST config and least-privilege role |
| Moodle | Site administrator | Web services/external service/functions/token | None universal; hosting-specific | Supported versions/functions and admin setup guide |
| Brightspace | D2L system administrator | OAuth app in Manage Extensibility or service user | Partner/sandbox route | Redirect URI, scopes, service-user controls |
| Schoology | School/district admin | App install + OAuth/LTI | App Center approval for distribution | App review, privacy URL, support and token lifecycle |
| Turnitin / Gradescope | Turnitin tenant admin | Certified Core API or validated LTI | Vendor certification/partnership | Use case, UI demo, sandbox evidence, certification artifacts |
| Clever / ClassLink | District admin | District authorization | Vendor app/certification | Data model, rostering purpose, district pilot |
| OneRoster / SIS | District/school SIS admin | REST/CSV credentials and service selection | Often vendor certification | OneRoster profile, endpoint security, deletion plan |
| PowerSchool / Infinite Campus / Skyward | District SIS admin | Vendor-specific integration | Partner program | Partner application and sponsored pilot |
| Compass / Sentral / SEQTA / Schoolbox / TASS / Daymap | School or governing-body admin | Vendor API/LTI/SSO configuration | Vendor approval varies | Australia privacy packet, pilot DPA, exact fields |

Timelines are not promised. Vendor review, procurement, privacy assessment and school calendars vary; record an owner and dated evidence in `VENDOR_APPROVAL_TRACKER.md`.
