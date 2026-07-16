# Privacy disclosure matrix

Pre-submission worksheet; validate against network logs, Firebase configuration, AI contract, RevenueCat, crash/analytics tools and store forms.

| Data | Purpose | Linked? | Tracking? | Recipients | Delete/revoke | Store disclosure action |
|---|---|---:|---:|---|---|---|
| Name/email/user ID | Account, support, access control | Yes | No intended | Firebase/Regrade | Account deletion; provider revocation | Declare account/contact/identifier |
| School/role/profile | Personalization and authorization context | Yes | No | Firebase/Regrade | Profile/account deletion | Declare other user content if applicable |
| Marked exam images/PDF | Core review | Yes | No | Storage, Regrade API, configured AI | Delete exam/account; backup SLA pending | Declare photos/videos and user content |
| Score/rubric/teacher feedback | Review/study/appeal | Yes | No | Same as above | Delete exam/account | Declare education/user content as forms permit |
| AI prompt/output/annotations | App functionality | Yes | No | Configured AI and storage | Delete exam/account; provider retention pending | Disclose user content; describe AI processing |
| Connector OAuth token | Authentication/connection | Yes | No | Regrade/server and provider | Disconnect/revoke | Sensitive credential; never analytics/logging |
| Notification token/preferences | App communications | Yes | No | Firebase/APNs/FCM when configured | Disable/delete token | Declare device identifier where applicable |
| Family pairing/permissions | Supervisor feature | Yes | No | Firebase/Regrade | Revoke link/delete account | Declare relationship/other user content as applicable |
| Purchase history/entitlement | Subscription access | Yes or pseudonymous depending config | No | Apple/Google/RevenueCat | Store retention rules; unlink on account deletion | Declare purchases; align RevenueCat manifest |
| Diagnostics/crash data | Reliability, only if tool enabled | Configuration-dependent | No intended | Selected monitoring provider | Provider retention | Remove crash declaration if not collected; otherwise disclose exactly |
| Analytics | Not yet approved/configured | — | No tracking intended | — | — | Do not declare “none” until production SDK/network audit |

No advertising or cross-app tracking is intended. App Store privacy answers must include third-party SDK practices. Google Data safety also requires accurate collection/sharing/security/deletion responses. A privacy manifest is not a substitute for either store form.
