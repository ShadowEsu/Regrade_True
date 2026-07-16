# Multi-account test results

Automated test implementation: `scripts/firebase-isolation-test.mjs`.

Scenarios: two authenticated users, own profile/case/annotation access, cross-user read/update denial, and query-leak prevention. Result: **blocked, not passed**, because Firebase emulators require Java and Java is unavailable on this host.

No production accounts or records were used. Run `npm run test:firebase-rules` after installing Java 17+ and attach the emulator output before inviting external testers.
