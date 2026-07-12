# Connector Security

- Credentials are server-only, AES-GCM encrypted, and revocable.
- OAuth/token input never enters URLs, analytics, or user-visible errors.
- Provider calls have 12-second timeout, redirect rejection, and safe 401/403/429 handling.
- Imported records are scoped to the Firebase-authenticated UID.
- Automatic import requires explicit preference plus paid entitlement.
- Imported metadata is not treated as a completed AI finding.
- Production requires exact CORS origins, App Check, credential rotation, least-privilege scopes, and provider callback verification.
