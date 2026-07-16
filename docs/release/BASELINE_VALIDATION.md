# Baseline validation — 2026-07-16

Branch: `automation/regrade-overnight-2026-07-15`.

| Check | Result |
| --- | --- |
| Client TypeScript | Pass |
| Client tests | Pass — 13 files, 62 tests |
| Client production build | Pass |
| Server TypeScript | Pass |
| Server tests | Pass — 9 tests |
| Server production build | Pass |
| API `/health` smoke test | Pass on isolated port 18787 |
| Production dependency audits | Pass — 0 known vulnerabilities in both manifests |
| Publishable-file secret/path scan | Pass |
| Capacitor sync | Pass for iOS and Android |
| Firebase isolation emulator | Blocked: Java is not installed |
| Android native build | Blocked: Java 17+/Android toolchain unavailable |

Generated evidence is stored under ignored `artifacts/`; it is not publishable source.
