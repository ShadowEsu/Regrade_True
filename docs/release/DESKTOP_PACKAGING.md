# Desktop packaging

`npm run desktop:pack` succeeded on macOS. Artifact: `release/mac-arm64/Regrade.app`; unpacked size approximately 253 MB. It is unsigned and intended only for local engineering verification.

Verified: production frontend is bundled, app name is Regrade, and packaging does not require a running Vite server. Required: packaged-app interaction smoke test, OAuth callback verification, backend-unavailable state, hardened runtime review, notarized DMG, and a real Windows build/install test.
