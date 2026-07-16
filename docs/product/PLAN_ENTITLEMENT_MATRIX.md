# Plan entitlement matrix

Source of truth: `shared/planCatalog.json`, validated by both client and server.

| Plan | Monthly price | Exams/month | Mr. Whale messages/month | Auto Mode |
| --- | ---: | ---: | ---: | --- |
| Free | $0 | 3 | 25 | No |
| Plus | $6.99 | 10 | 50 | Yes |
| Pro | $11.99 | 20 | 100 | Yes |

Introductory trial: two months of Plus, subject to store eligibility and configuration. Store product ids and server entitlements must match this catalog before sale.
