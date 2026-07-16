# macOS signing and notarization

Current `.app` is unsigned. Release requires an Apple Developer ID Application certificate, hardened runtime, reviewed entitlements, signing of nested frameworks, notarization credentials, `notarytool` submission, stapling, Gatekeeper verification, and a clean-machine install test. Credentials must remain outside git.
