# Security and privacy audit

Date: 2026-07-12. Scope: source review and local automated checks; not a penetration test.

## Controls observed

- default-deny Firestore/Storage rules and user-owned document paths
- Firebase ID-token verification; preview/fake tokens rejected server-side
- App Check support, exact production CORS requirement, Helmet, bounded parsers, rate limits
- Zod schemas, image MIME/base64 limits, server-only AI and connector secrets
- AES-256-GCM connector credential design and server-only family-code pepper
- user consent required for AI; appeal output is a draft, not an automatic external send
- account deletion spans Storage, cases/subcollections, feedback, family data, user data, Auth

## Findings and required verification

- High: the initial Git commit contains the now-deleted internal brief with a local
  workstation path. Before creating a public repository, either publish a clean squashed
  history or intentionally rewrite that file from history. Current-tree deletion alone
  does not remove it from old commits.
- Critical: no claim of readiness until deployed rules pass emulator and two-account tests.
- High: production secrets and CORS/App Check must be supplied; startup correctly fails for
  several missing values, but deployment configuration remains external.
- High: remote push and store purchases are not proven end to end.
- Medium: Firestore notification updates were restricted to read/archive metadata in this pass.
- Medium: Firebase web configuration is public by design; restrict the API key by allowed apps
  and rely on rules/App Check, not secrecy.
- Medium: verify deletion under partial provider failure and make it retryable/idempotent.

Never log authorization headers, connector grants, exam bodies, image bytes, or raw AI prompts.
