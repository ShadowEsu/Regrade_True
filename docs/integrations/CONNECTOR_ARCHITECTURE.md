# Connector Architecture

The client registry describes every platform and its honest readiness/capabilities. Provider grants never persist in local production storage: the client sends them over TLS to the API, where `connections.ts` encrypts them with AES-256-GCM. `connectorImports.ts` calls provider APIs with timeouts and safe permission errors, applies manual/automatic age policy, and writes imports/jobs under the authenticated user.

An imported grade record without the returned marked file is now `awaiting_returned_file`, not “AI ready.” Only Canvas, Google Classroom, Google Drive, Dropbox, and OneDrive have import endpoints, and file providers still require a user-selected actual file before analysis.
