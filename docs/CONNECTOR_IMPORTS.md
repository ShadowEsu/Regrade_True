# Connector import behavior

## Live student-authorized connections

- Canvas: personal access token + school Canvas base URL. Reads active courses and returned/graded assignment records.
- Google Classroom: user OAuth through Firebase. Reads active courses, coursework, and the signed-in learner’s returned submissions.
- Google Drive, Dropbox, OneDrive: user OAuth. Browses selected file metadata for manual import; these file stores do not prove that a document was graded, so they are never auto-imported as grades.

All credentials are stored only by the API, encrypted with AES-256-GCM. Revoking a connection deletes the credential document.

## Seven-day rule

The server—not the UI—filters automatic candidates. Only a `graded_record` with a valid `gradedAt` time between now and seven days ago is eligible. Files, unknown dates, future dates, and older records are excluded. Manual browsing and selection never apply a date filter.

Automatic grade detection runs when the signed-in app opens and through `POST /v1/jobs/connector-imports`. Configure a scheduler to call that endpoint every 15–60 minutes with `Authorization: Bearer <CRON_SECRET>`. Paid entitlement and the learner’s automatic-grade-detection preference are rechecked for every account.

## Institution-controlled catalog entries

Blackboard, Moodle, Brightspace, Schoology, PowerSchool, Turnitin, Teams Assignments, Sakai, itslearning, ManageBac, Open edX, Fedena, Teachmint, DingTalk, Lark, WeCom, Toddle, Edunext, Vidyalaya, Classter, Infinite Campus, Skyward, Alma, Veracross, FACTS, Clever, ClassLink, Google Workspace, SharePoint, and Box remain visibly institution-gated until the relevant school/vendor provisions credentials. Regrade does not simulate these integrations. Manual PDF/photo/screenshot upload remains available.

## Response states

- 401: access token expired; reconnect.
- 403: access revoked or blocked by the institution.
- 404: connection/item not present.
- 429/upstream outage/network timeout: retryable platform-unavailable message.
- Empty list: a normal, explicit “no records returned” state.

Imported grade records create a deterministic History item, so repeated polling cannot duplicate an assessment. The learner must still provide the returned marked file/rubric when the upstream API exposes only a score summary.
