# Current Backend Map

## Client services

- `userService`: Firestore user profile, onboarding, tutorial, notification, automation, theme, and study-checklist persistence.
- `caseService`: Firestore cases, analysis/draft updates, case deletion, and isolated local preview cases.
- `documentStorageService`: per-user Firebase Storage page uploads/deletion.
- `automationService`: API settings and recent-grade detection.
- `connectorImportService`: lists/imports provider records through the server.
- `familyService`: pairing codes, links, shared cases, suggestions, and revocation.
- `subscriptionService` / `storePurchaseService`: server entitlement status, web checkout, RevenueCat native purchase/restore.
- `notificationService`: web/native permission, local delivery, grouping, and deep links.
- `accountService`: server-coordinated account deletion.

## Server modules

- `index.ts`: Express composition, security middleware, health and API routes.
- `regradeGemini.ts`: structured Gemini analysis plus deterministic grading completeness audit.
- `connections.ts`: encrypted platform grants and connection state.
- `connectorImports.ts`: provider listing/import policy and seven-day automatic import window.
- `automation.ts` / `jobs.ts`: automation preferences and scheduled execution.
- `family.ts`: short-lived pairing codes, learner approval, shared case access, suggestions, and unlinking.
- `billing.ts`: Stripe web billing and RevenueCat entitlement verification/webhooks.
- `accountDeletion.ts`: user-owned Auth/Firestore/Storage deletion.

## Security baseline

Firebase rules default-deny. User profiles and cases are owner-scoped; Storage is scoped to `users/{uid}/documents/**`, limited to supported PDF/image MIME types and 25 MB. The API uses Firebase ID tokens, optional/enforced App Check, Helmet, origin restrictions, validation, per-IP/per-user/heavy-AI rate limits, and explicit AI consent middleware. Connector secrets are server-encrypted with AES-GCM when `CONNECTIONS_ENC_KEY` is configured.

## Missing backend models

There is no first-class persisted annotation collection, notification inbox collection, detailed appeal timeline/outcome model, persistent Mr. Whale conversation model, or complete Auto Mode job-state machine. These must be added without weakening existing ownership and consent boundaries.
