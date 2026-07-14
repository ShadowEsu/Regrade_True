# School data-processing overview

Draft for counsel and school review; not a DPA and not legal advice.

## Roles and purpose

The institution’s, learner’s and Regrade’s legal roles depend on the deployment and jurisdiction. Do not assume Regrade is always a processor. The purpose is to help a learner review already-graded work, understand feedback, prepare study actions and draft an appeal for the learner to approve.

## Data categories

- Account: name, email, role, school, authentication identifiers.
- Education: course/assignment metadata, marked exam, score, rubric, teacher feedback and derived review annotations.
- Operations: connector status, consent, notification preferences, support/security logs.
- Family link: pairing identifier and explicitly granted, revocable permissions.
- Purchase: entitlement/status from the store provider; payment-card data should not be collected by Regrade.

## Processing rules

1. Collect only fields approved for the pilot and needed for the learner’s request.
2. Prefer delegated read-only authorization and user-selected files.
3. Do not change a grade, submit work, or send externally without specific user action and consent.
4. Separate visible evidence, AI inference and uncertainty. Do not guarantee teacher error or recovered marks.
5. Do not sell student data or use it for advertising.
6. Restrict staff/support access, log administrative actions without exam content, and apply owner/tenant controls.
7. Honor exam deletion, connector revocation and account deletion; define backup deletion and lawful retention separately.
8. List every production subprocessor, location, transfer mechanism, retention/training setting and change-notice process.

## AI processing

Only the minimum relevant exam context should be sent to the configured AI processor. Before a pilot, contracts and settings must establish data location, retention, training use, human access, deletion, security and incident obligations. The UI must disclose AI assistance and allow correction/challenge.

## Parent/supervisor mode

Pairing must not reveal a learner’s work by possession of an email alone. The learner (and guardian/school where required) grants explicit permissions, can revoke them, and sees who has access. Supervisor drafts or messages do not send automatically. A teacher account is not automatically entitled to a learner’s private Regrade account.

## Deletion and return

The pilot agreement must state active retention, deletion request SLA, backup lifecycle, legal-hold exceptions, export format and end-of-pilot deletion evidence. The app’s current flows require real-service verification before a pilot.

## Australia

Review the Australian Privacy Principles, state/territory public-sector rules, department/diocese policy, child consent/capacity, overseas disclosure, Notifiable Data Breaches obligations, direct marketing restrictions and data-residency expectations with Australian counsel. See `../integrations/AUSTRALIA_PRIVACY_REQUIREMENTS.md`.
