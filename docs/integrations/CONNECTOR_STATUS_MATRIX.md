# Connector status matrix

Status reflects code capability, not successful production certification.

| Source | Connection | Listing/import adapter | Scheduled Auto Mode | Release status |
|---|---|---|---|---|
| Canvas | Personal token | Implemented | Implemented, 7-day policy | Needs live verification; school can disable PATs |
| Google Classroom | OAuth | Implemented | Implemented, 7-day policy | Needs live verification; Workspace policy/Google verification can apply |
| Google Drive | OAuth | File listing/manual selection | No | Needs live verification |
| Dropbox | OAuth/PKCE | File listing/manual selection | No | Needs live verification; app key required |
| OneDrive | OAuth/PKCE | File listing/manual selection | No | Needs live verification; Entra client/tenant policy required |
| Gradescope | None | Manual upload guide | No | Manual import only |
| Apple Files | Device picker | Manual selection | No | Manual import only |
| Email import | Manual | Manual selection | No | Manual import only |
| Institution-gated public API entries | School authorization | Not implemented | No | School authorization required |
| Partner API entries | School + vendor approval | Not implemented | No | Vendor approval required |

The searchable catalog contains 39 sources for discovery and honest availability labels.
It does not mean 39 production integrations. A returned grade record without the marked
file, rubric, or teacher feedback is incomplete evidence and must not produce a confident
appeal claim.
