# Rollback plan

Keep the previous signed build and server release addressable. Roll back client distribution through store phased-release controls; roll back web/server through the hosting provider; disable risky integrations with server-side flags where available. Do not roll back database rules/schema blindly. Preserve user work and verify auth, reads, writes, and account deletion after rollback.
