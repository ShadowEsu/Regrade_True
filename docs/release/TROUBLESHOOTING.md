# Troubleshooting

- Stuck on splash: force quit/relaunch and capture device logs; fixed native builds must not run the web redirect resolver at boot.
- AI unavailable: confirm a production/staging API base URL and authenticated backend health.
- Connector failed: do not retry repeatedly; check status and OAuth/vendor setup.
- PDF failed: preserve the original, retry once, then record type/size/page count without sharing student content.
- Subscription missing: use Restore Purchases; never manually edit client entitlement data.
- Data mismatch: stop and report user/learner context without exposing documents.
