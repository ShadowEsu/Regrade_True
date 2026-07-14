# Australia connector roadmap

## P0 — verify before any “Live” label

| Connector | Work | Gate |
|---|---|---|
| Manual PDF/image/Files | Multi-page, handwriting, math/chemistry, delete/reopen tests | Real devices and deletion evidence |
| Canvas | Scoped OAuth (PAT only as controlled interim), grade/file/feedback import | Australian institution developer key + production test |
| Google Classroom/Drive | OAuth verification, admin allow-list guide, exact read-only scopes | Verified app + education domain |
| Microsoft OneDrive/Education | Separate user-selected files from Graph Education admin consent | Entra education tenant + admin consent |
| Compass | Partner/school discovery and field-level API feasibility | Written vendor and institution authorization |

## P1 — sponsored integrations

Moodle, Sentral, Schoolbox, TASS, Blackboard, Brightspace, Turnitin/Gradescope. For each: recruit a mutual institution, obtain sandbox, map only graded-work fields, complete privacy/security review, and verify import/revocation/deletion end to end.

## P2 — discovery, no connect button

SEQTA, Daymap, Synergetic, Education Perfect and institution-specific systems. Contact the vendor with a pilot sponsor; request current API/LTI/SSO/OneRoster documentation. Do not infer capability from marketing pages.

## Not launch connectors

Edval, Consent2Go and ClickView are not primary sources for marked exam/rubric/teacher feedback. Keep them out of the production connector list unless a concrete learner-review use case and authorized API are proven.

## Universal fallback

Every unavailable platform directs to PDF, image or device file upload. Google Drive, OneDrive and Dropbox selection are offered only after their production OAuth flows pass live verification. Email should be attachment-specific, not whole-mailbox access.
