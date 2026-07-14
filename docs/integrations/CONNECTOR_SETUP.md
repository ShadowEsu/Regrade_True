# Connector setup

All grants are user-authorized and stored server-side encrypted with
`CONNECTIONS_ENC_KEY`. Never request or store a school password.

- Canvas: student creates a personal access token; server validates an HTTPS Canvas host.
- Google Classroom/Drive: Firebase Google sign-in with additional read-only scopes.
- Dropbox: configure `VITE_DROPBOX_APP_KEY` and the exact OAuth callback.
- OneDrive: configure `VITE_MS_CLIENT_ID` and the exact OAuth callback.
- Institution-gated systems: keep unavailable until a school/vendor provisions access.

For each live connector test connect, list, manual import, expiry, revocation, reconnect,
rate limiting, empty results, permission denial, and deletion. Automatic scheduled scans
currently process Canvas and Google Classroom only.
