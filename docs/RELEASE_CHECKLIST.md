# Release Checklist

An item is complete only when evidence is linked. A compile or preview screenshot is not proof that a production integration works.

## Release gate: critical

- [ ] Staging and production Firebase projects are separate.
- [ ] Firestore and Storage rules are deployed and tested with owner, parent, unrelated user, expired link, and signed-out identities.
- [ ] API is deployed over HTTPS and `VITE_API_BASE_URL` points to it.
- [ ] Auto Mode completes the full import → AI → persist → notify → Review → History pipeline idempotently.
- [ ] Auto Mode cannot send an external appeal without a separate explicit confirmation.
- [ ] Every connector labeled Available succeeds with a real provider account, and revoked/expired credentials fail safely.
- [ ] Parent pairing, permission changes, revocation, and deletion pass with two real accounts.
- [ ] RevenueCat Apple purchase, restore, renewal, cancellation, and expiration pass.
- [ ] RevenueCat Google purchase, restore, renewal, cancellation, and expiration pass.
- [ ] APNs and FCM remote notifications pass, including permission denied and deep links.
- [ ] Account deletion removes Auth, Firestore, Storage, family links/codes, and connector tokens.
- [ ] No unresolved security, cross-account access, data-loss, consent, or entitlement defect exists.

## Product and data integrity

- [ ] Production mode contains no simulated imports, findings, recovered marks, appeals, or parent links.
- [ ] Preview/demo mode is visibly identified and cannot write to production data.
- [ ] Every connector shows Connected, Available, Coming soon, Needs setup, or Connection failed.
- [ ] AI wording consistently says possible issue/inconsistency and never guarantees recovered marks.
- [ ] Duplicate imports/webhooks are idempotent.
- [ ] The seven-day automatic import window is covered by tests.
- [ ] Manual users can select older exams without enabling automatic import.

## Failure handling

- [ ] Auth, upload, sync, AI, payment, connector, and notification flows each have loading, success, empty, timeout, retry, offline, permission-denied, and safe error states.
- [ ] No UI displays stack traces, provider tokens, Firebase internals, paths, or raw server responses.
- [ ] Background failures surface in a recoverable, non-spammy place.
- [ ] Rate limiting and abuse protection are enabled and monitored.

## Privacy, legal, and safety

- [ ] Privacy Policy and Terms match actual data processing and are reviewed for the launch regions.
- [ ] Parent/learner permission language is explicit and age/consent requirements are reviewed.
- [ ] Data retention and deletion timelines are documented.
- [ ] Logs, analytics, and error reports redact exam content, tokens, names, email addresses, and document URLs.
- [ ] App Store privacy labels and Google Play Data Safety declarations match production behavior.
- [ ] Ownership/copyright notices identify Preston Susanto where required.

## Quality

- [x] Client TypeScript passes.
- [x] 48 client automated tests pass.
- [x] Client production build passes.
- [x] Server TypeScript build passes.
- [x] Client and server production audits report zero known vulnerabilities.
- [ ] Firebase emulator/rules tests pass.
- [ ] API integration tests pass against staging.
- [ ] Real-device plan passes on iPhone, iPad, Android, macOS, and Windows.
- [ ] Accessibility audit passes VoiceOver, TalkBack, keyboard-only, large text, contrast, and reduced motion.
- [ ] Load/performance budgets pass with 500 History records and maximum supported files.
- [ ] No production console error or unhandled rejection occurs in a full journey.

## Native distribution

- [ ] iOS signed Release archive builds and validates.
- [ ] TestFlight internal build installs and passes smoke tests.
- [ ] Android Java/SDK/signing setup is installed.
- [ ] Android signed AAB builds and Play internal testing passes.
- [ ] Store product IDs, prices, screenshots, descriptions, support URL, and privacy URL are final.
- [ ] Store reviewers receive a functioning test account and connector explanation.

## Operations

- [ ] Analytics and error monitoring are configured with redaction.
- [ ] Alerts exist for API error rate, AI provider failures, connector failures, auth failures, webhook failures, and purchase entitlement mismatches.
- [ ] Database/Storage backup and restore is tested.
- [ ] Incident, rollback, secret-rotation, and data-deletion runbooks exist.
- [ ] Support and abuse-report inboxes are monitored.
- [ ] A release owner signs the final beta decision.

## Current decision

**Blocked for external beta.** See `FINAL_BETA_QA.md` and `KNOWN_LIMITATIONS.md` for the unresolved critical items.
