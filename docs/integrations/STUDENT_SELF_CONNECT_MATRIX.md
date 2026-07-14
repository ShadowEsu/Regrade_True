# Student self-connect matrix

“Can self-connect” means technically possible for some tenants, not guaranteed by every school policy. No connector below is launch-certified until its status says **Live** in the app.

| Source | Student path | School can block? | Current Regrade status | Fallback |
|---|---|---:|---|---|
| Canvas personal access token | Possible if the Canvas institution exposes token creation | Yes | Needs live verification | PDF/image upload |
| Google Classroom | User OAuth can work when Workspace policy allows the app | Yes | Needs live verification | Download/print marked work; Drive or upload |
| Google Drive | User selects/authorizes files | Yes | Needs live verification | Device upload |
| OneDrive | Delegated file OAuth can be user-consentable | Yes | Needs live verification | Device upload |
| Dropbox | User OAuth | Yes, for managed teams | Needs live verification | Device upload |
| Apple Files | User chooses a file; no account connector | No separate school grant | Manual import only | Native file picker |
| Gradescope | Download marked copy, then upload | N/A | Manual import only | PDF/image upload |
| Email attachment | Explicit attachment import only | Mail policy may restrict | Manual import only | Save attachment to Files |
| All LMS/SIS/roster/parent systems not listed above | No safe universal student grant | Yes | School or vendor authorization required | PDF/image/file-source import |

Required validation before changing “Needs live verification” to “Live”: production OAuth configuration, least scopes, fresh/revoked/expired token tests, two-account isolation, persisted import, deletion, disconnect, failure and rate-limit behavior, and provider review where applicable.
