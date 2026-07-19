# Regrade release-hardening tasks

This is the implementation checklist for the current release pass. A check is
only marked complete when it is covered by the running code and a relevant test
or live verification. A connected platform, payment provider, or AI provider is
never represented as ready until its required production configuration exists.

| # | Task | Status | Verification / rule |
| --- | --- | --- | --- |
| 1 | Keep Free, Plus, and Pro limits in one shared catalog. | Complete | Shared catalog test verifies Free (3 exams / 25 messages), Plus (10 / 50), and Pro (20 / 100). |
| 2 | Enforce exam and Mr. Whale quotas on the server, not only in the interface. | Complete | Gemini `/analyze` and `/advocate` call server-side `consumeUsage`; failed model calls refund usage. |
| 3 | Use store billing when native and return a clear unavailable state when a payment product is not configured. | Partial | RevenueCat and server checkout paths exist; real store products/webhooks still require owner configuration and sandbox verification. |
| 4 | Parse marked PDFs and images into analysis-ready text and page images. | Complete in code | PDF.js extracts text and renders up to eight page/image inputs; AI pages are saved to the case after analysis. Real-device file-picker testing remains required. |
| 5 | Let students reopen their own graded paper with persisted annotations. | Complete in code | Paper View loads saved page URLs and Document Annotator is case/page scoped. Real Firebase Storage verification remains required. |
| 6 | Only auto-import recent, graded assessment records; keep assignments/files manual. | Complete | Seven-day, future-date, duplicate, and assessment filtering is tested. Manual browsing remains available for all supported work. |
| 7 | Accurately identify connector capability. | Complete in code | Only Canvas and Google Classroom are eligible for automated grade checks; Drive/Dropbox/OneDrive are manual file sources. |
| 8 | Make Auto Mode entitlement- and consent-gated. | Complete in code | Server requires Plus/Pro plus the learner setting; imports create review queues but never send an appeal. |
| 9 | Persist in-app notifications and respect delivery preferences. | Complete in code | Firestore owner rules, preference checks, web/native local delivery, grouping, deep links, and retry UI are implemented. Remote push credentials still need configuration. |
| 10 | Keep streak rewards earned, accumulated, and redeemed explicitly. | Complete | Server test covers one five-day Plus reward per thirty active days and explicit redemption. |
| 11 | Maintain smooth, accessible motion without blocking use. | Complete in code | Motion is short state feedback, with existing `prefers-reduced-motion` fallbacks. Visual/device QA remains required. |
| 12 | Verify the Vite `/api` proxy and Express health endpoint. | Complete locally | API health was live-checked on port 8787; Vite served `/app` on port 3000. |
| 13 | Test errors and never claim a fake result. | In progress | Upload, connector, automation, and notification surfaces have user-facing error paths. Credentialed Firebase, Gemini, OAuth, and payment scenarios still need staging tests. |
| 14 | Validate production configuration before beta. | In progress | Production env validation fails closed for missing AI, Firebase Admin, storage, encryption, App Check, CORS, and security secrets. Owner must supply and deploy these values. |

## Current operating rules

- Auto Mode imports only a recent assessment record; it does **not** claim that
  an exam was fully analyzed until a returned marked file, rubric, or feedback
  is available.
- Manual selection remains available for assignments and files so students keep
  control of what Regrade reviews.
- Possible points are presented as evidence to check, never as guaranteed
  recovered marks.
- No appeal may be sent outside Regrade without an explicit user confirmation.
