# Firebase verification

Profile mutations now use authenticated server endpoints rather than trusting a caller-supplied user id. Firestore rules and the isolation test cover owner-only profile, case, and annotation access.

`npm run test:firebase-rules` creates two emulator users and proves own access plus denied cross-user reads/writes. The test is implemented but was not executed on this machine because Java is unavailable. Production Firebase, destructive tests, and real student data were not touched.

Release gate: run the emulator suite with Java 17+, then repeat a non-destructive two-account test in a dedicated staging Firebase project.
