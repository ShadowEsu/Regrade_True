# Regrade school-admin one-pager

## Purpose

Regrade helps a learner understand already-graded work, organize possible rubric/feedback inconsistencies, prepare study priorities and draft a respectful appeal. AI outputs are suggestions. Regrade does not change grades and does not send an appeal without explicit user approval.

## Proposed pilot boundary

- One institution, one course/cohort, fixed dates and named owners
- Read-only access to learner identity, course/assignment metadata, marked file, score, rubric and teacher feedback
- No roster-wide access unless strictly required and separately approved
- No grade write, assignment submission, teacher messaging or automatic external sending
- Manual PDF/image import remains available without an institution connector

## Data and user controls

Data is collected for the learner-review purpose, minimized to the approved fields, protected by authenticated user ownership, and processed through controlled backend services. Users can disconnect integrations, delete exams and initiate account deletion. Parent/supervisor access requires explicit pairing and revocable permissions; school credentials are never shared.

## AI and privacy

The AI should distinguish visible evidence from uncertainty, cite the source material and avoid claiming a teacher made an error or promising recovered marks. The production AI provider, hosting region, retention setting and training use must be confirmed in the DPA before a pilot. Regrade does not sell student data.

## Approval request

We request a sandbox or bounded tenant registration with the exact least-privilege scopes listed in the connector appendix. Pilot activation requires institution approval, successful isolation/deletion/revocation tests, signed privacy terms, support contacts and a go/no-go review.

Contact: regradeteam@gmail.com · https://regradeapp.tech
