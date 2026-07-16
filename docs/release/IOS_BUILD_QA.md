# iOS build QA

Xcode 26.6 simulator build succeeded without code signing for iPhone 17 Pro / iOS 26.2. The built simulator `.app` is 27,734,639 bytes. Capacitor sync succeeded.

Runtime finding and fix: the app initially remained on Regrade's splash because Firebase's web redirect resolver ran inside WKWebView before first paint. Native startup now skips that web resolver; a subsequent simulator launch reached the real sign-in screen. Screenshot evidence is under ignored `artifacts/screenshots/ios-native-redirect-fixed.png`.

Still required: real iPhone/iPad, camera/file picker, notifications, Apple sign-in, dedicated native Google sign-in/callback, deep links, background/resume, offline behavior, purchase/restore, archive signing, and TestFlight. The native build lacks a configured production API base URL, so AI calls are not release-ready.
