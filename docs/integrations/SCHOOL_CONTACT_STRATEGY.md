# School and vendor contact strategy

Use role inboxes and official vendor portals; do not collect personal staff/student contact data. Lead with a small read-only pilot and never claim approval before written confirmation.

## Who to contact

- Principal / school leader: educational value, boundaries, pilot sponsorship.
- IT director / district technology: identity, LMS/SIS configuration, logging, support, offboarding.
- University IT / LMS admin: developer key/LTI registration, scopes, sandbox course.
- Privacy officer / data protection lead: purpose, consent, retention, subprocessors, overseas disclosure.
- Registrar / records owner: grade-record boundaries and retention.
- Teacher: workflow discovery and a bounded course pilot; not tenant-wide authorization unless empowered.
- Vendor partnership team: API terms, sandbox, certification, marketplace, production review.

## Short introduction

**Subject:** Read-only Regrade pilot for understanding marked work

Hello [role/team],

Regrade helps learners understand marked work, organize evidence, and prepare a respectful appeal draft for their own review. It does not change grades or send anything without the learner’s explicit approval. We would like to discuss a small [platform] pilot using read-only access to graded files, scores, rubrics, and teacher feedback. Regrade minimizes collection, supports revocation and deletion, and does not sell student data. May we send your IT/privacy team our scope list and security package?

Regards,  
Regrade team — regradeteam@gmail.com — https://regradeapp.tech

## Full partnership email

**Subject:** Proposal: limited Regrade learner-review pilot at [institution]

Hello [name/team],

Regrade is a student-support application for reviewing previously graded work. The learner can inspect teacher feedback, possible rubric mismatches, study priorities, and an evidence-backed appeal draft. AI findings are suggestions—not declarations of teacher error or guaranteed mark recovery.

We propose a limited pilot for [one course / cohort / term]. Access would be read-only and limited to the learner’s graded work, score, rubric and feedback. Regrade would not edit the LMS, change a grade, or submit an appeal automatically. Sending externally always requires clear user consent. Users can disconnect the integration, delete uploaded exams, and request account deletion.

We can provide architecture and data-flow diagrams, requested scopes, retention/deletion, encryption controls, subprocessors, AI-use explanation, incident response, consent language, support plan and a security questionnaire. We do not sell student data. Could we schedule a 30-minute discovery call with your LMS, IT and privacy owners?

## Technical integration request

**Subject:** [Platform] read-only application registration for Regrade

Please advise the supported route for a third-party application that needs only: learner identity, course/assignment metadata, graded submission/file, score, rubric and instructor feedback. We prefer delegated OAuth/LTI/OneRoster with least privilege and revocable tokens. We do not need grade-write, submission, roster-wide or messaging permissions. Please confirm sandbox access, admin roles, redirect-URI rules, token lifetime/revocation, rate limits, marketplace/certification requirements, event/webhook support, data residency and production-review steps.

## Pilot proposal

**Subject:** Four-week, one-course Regrade pilot

Scope: [number] consenting learners, [course], [dates], read-only import, no automatic external sending, named school and Regrade support owners, weekly issue review, immediate revocation path and end-of-pilot deletion/export review. Success measures: successful authorized imports, learner comprehension, accessibility, support volume, deletion/revocation evidence and zero unauthorized access. No grade-recovery promise is a success metric.

## Privacy/security follow-up

Thank you for reviewing Regrade. Attached are the permissions inventory, data-flow, retention/deletion schedule, subprocessor list, AI explanation and incident route. Open items are marked pending. Please confirm the institution’s consent basis, retention requirement, data-residency restriction, breach-notification clause, audit evidence, parent/guardian requirements, and whether any state/sector assessment is mandatory before a pilot.

## School IT meeting agenda (30 minutes)

1. Purpose and prohibited actions (3 min)
2. Tenant/site ownership and pilot cohort (4 min)
3. Auth method, exact scopes, token lifecycle and revocation (7 min)
4. Data flow, storage region, retention, deletion and subprocessors (7 min)
5. Consent, parent mode, support and incident routing (5 min)
6. Sandbox, acceptance tests, owners, dates and go/no-go evidence (4 min)

## Vendor API-access request

We are requesting developer/sandbox access for a read-only education workflow. Please provide the partner application, API/LTI/OneRoster documentation, certification criteria, sandbox/test data, commercial terms, security questionnaire, logo/brand rules, support escalation, expected review stages and production activation requirements. Regrade will not represent the integration as available until written authorization and end-to-end verification are complete.

## Follow-up

Hello [team], following up on the read-only Regrade integration request sent [date]. The outstanding items are [items]. We can start with manual PDF/image import while authorization is reviewed; this does not require institutional credentials. Please let us know the correct owner or portal if this request belongs elsewhere.

## Australian school version

**Subject:** Australian read-only Regrade pilot — privacy and school-system review

Regrade is seeking a small, consent-based Australian school pilot. We recognize that authorization and privacy requirements differ across government, Catholic and independent sectors and across states/territories. The proposed pilot uses least-privilege read-only access, no grade changes, no automatic external submission, revocable sharing and a defined deletion period. We will document overseas disclosures/data location, APP alignment, AI safeguards, parent/guardian settings and any department/diocese policy required. Could your ICT and privacy owners advise the applicable assessment and approved integration route for [system]?

## Questions for authorization calls

1. Who is the data controller and authorized technical approver?
2. Is this tenant governed by a department, district, diocese, university or individual school?
3. Which OAuth/LTI/OneRoster/API route is approved, and which versions?
4. Can we restrict to the signed-in learner and exact read-only fields?
5. Which scopes/functions are prohibited?
6. Is vendor marketplace approval, certification, penetration testing or insurance required?
7. Is a sandbox available and may test data leave it?
8. What consent/parental consent and age rules apply?
9. What residency, overseas-disclosure, retention and deletion rules apply?
10. What logging, audit, incident-notification and support SLAs apply?
11. How are access and tokens revoked when a learner leaves or consent ends?
12. Who signs the DPA/pilot agreement and what is the procurement timeline?
