# API Contracts

All protected routes require a Firebase ID token; production also enforces App Check. Important families:

- `/v1/gemini/*`: structured analysis/chat/draft with AI consent and heavy rate limit.
- `/v1/connections/*`: list/save/revoke/verify connector grants.
- `/v1/imports/{platform}/items|manual|automatic`: safe provider listing/import.
- `/v1/automation/preferences`: paid/consented automation settings.
- `/v1/family/*`: create/redeem/approve/revoke links, shared cases, suggestions.
- `/v1/billing/*`: status, checkout/portal for web, RevenueCat sync/webhook for native.
- `/v1/account`: complete authenticated deletion.

Errors use safe HTTP status/code/message envelopes; the client maps failures to retryable user language. No route auto-sends an appeal.
