# Australian education-technology research

Research date: 12 July 2026. This is a market/integration map, not a claim of market share, legal compliance or vendor approval. Platform use varies by institution and sector; validate each pilot directly.

## Sector and authorization pattern

- Government schools are commonly governed by state/territory departments, so a single school may not have authority to approve a new data integration.
- Catholic systems may require diocesan/system approval; independent schools may approve locally but often use shared procurement/privacy standards.
- TAFE and universities typically control LMS, identity and privacy centrally.
- Google Workspace and Microsoft 365 identity/file services coexist with Canvas, Moodle, Blackboard or Brightspace; the identity tenant can block user consent even when a vendor exposes OAuth.
- SIS/parent systems contain broader and more sensitive data than Regrade needs. Regrade should request graded-work fields from the LMS/assessment layer, not broad student/medical/finance records.

## Platform map

| System | Typical segment | Public integration evidence | Student self-connect | Regrade feasibility / priority |
|---|---|---|---:|---|
| Canvas | Universities, TAFE, schools | OAuth/REST developer keys; institution controls keys | PAT sometimes; OAuth admin setup | **P0** pilot target; read-only graded work |
| Moodle | Universities, TAFE, schools | Site-admin web services/external services | Usually no | **P0/P1**; open test site, institution configuration |
| Google Classroom / Workspace | Schools | User OAuth plus admin app controls and Google verification | Sometimes | **P0** after production OAuth verification |
| Microsoft Teams Education / OneDrive | Schools, TAFE, universities | Graph Education requires admin consent; file OAuth policy varies | Education data: no | **P0/P1** with education tenant |
| Compass | Government/independent/Catholic schools | Compass publishes integration/API and partner information; approval is school/governing-body specific | No verified path | **P0 Australian partnership**; school + vendor route. [Compass integrations](https://www.compass.education/integrations/) |
| Sentral | Australian schools | REST developer portal exists | No verified path | **P1** with pilot school and vendor credentials. [Sentral developer portal](https://development.sentral.com.au/) |
| Schoolbox | K–12 LMS/community portal | LTI 1.3 and SIS/API integrations are documented for admins | No | **P1** LTI/API discovery with school. [Schoolbox LTI help](https://help.schoolbox.com.au/account/anonymous.php?page=%2Fhomepage%2F2831) |
| TASS | Independent Australian schools/SIS | Public REST API program; school configures API application/security role; certified partner route exists | No | **P1** only if grade/feedback API is sufficient; avoid unrelated SIS data. [TASS APIs](https://www.tassweb.com.au/resources/api-integrations) |
| Daymap | Secondary schools | Integrations are activated at a school’s request; public privacy material, but no verified Regrade grade API | No | **P2 discovery**; vendor and school approval |
| SEQTA | Schools, especially independent/Catholic | No sufficiently public, current Regrade-suitable API evidence verified in this pass | No verified path | **P2 vendor discovery**; show no connect action |
| Blackboard | Universities/TAFE | Admin-registered REST 3LO/LTI | No initial setup | **P1** with institution sandbox |
| Brightspace | Universities/education providers | Admin-registered OAuth | No initial setup | **P1** with D2L sandbox |
| Turnitin / Gradescope | Secondary/tertiary assessment | Certified/validated partner integration | No | **P1 vendor partnership**; manual marked-copy import now |
| Edval | School timetabling | No verified graded-work API for this use case | No | **Unsupported for launch**; not a grading-source priority |
| Synergetic | Independent-school SIS | Vendor/school integration discovery required | No | **P2**; broad SIS access is unnecessary unless exact read-only assessment fields exist |
| Consent2Go | Consent/activities | Not a graded-work source | No | **Unsupported for launch** |
| ClickView | Educational video | Not a primary marked-exam source | User login is not grade authorization | **Unsupported for launch** |
| Education Perfect | Curriculum/assessment | Vendor/institution integration discovery required | No verified path | **P2** if export includes learner-visible marked responses/feedback |
| Schoology / PowerSchool / Infinite Campus / Skyward / Clever / ClassLink | More common in North America but possible in international schools | Admin/vendor routes | No | **P2 for Australia**, higher for US expansion |

## State/territory discovery checklist

For NSW, Victoria, Queensland, Western Australia, South Australia, Tasmania, ACT and Northern Territory, ask the relevant department/system owner: approved cloud/AI vendor process, privacy impact assessment, identity tenant, permitted hosting regions, cross-border disclosure, child consent, school-vs-department approval authority, record retention, accessibility, security certification and incident-notification requirements. Do not infer one jurisdiction’s approval applies elsewhere.

## Recommended first pilots

1. One Australian university/TAFE course using Canvas or Moodle, because scopes and testability are clearer.
2. One independent school already able to sponsor Compass/Sentral/Schoolbox/TASS technical review.
3. Manual-import-only pilot in a government-school context while department authorization is assessed.

Exclude medical, attendance, finance, welfare, parent contact and full-roster data from the initial purpose.
