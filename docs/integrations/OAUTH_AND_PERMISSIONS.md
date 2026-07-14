# OAuth and permissions

Use authorization code with PKCE for public clients, exact redirect URIs, random state,
short-lived access tokens, refresh-token rotation where supported, and server-side encrypted
storage. Request read-only scopes and show what each scope enables before consent.

Disconnect must revoke at the provider when supported and delete the stored grant. Handle
cancelled, expired, revoked, insufficient-scope, tenant-policy, rate-limit, timeout, and
offline outcomes without exposing provider payloads or tokens.
