# iOS submission checklist

Audit date: 12 July 2026. **Not ready for App Store submission.** Checked boxes are repository evidence only, not App Review approval.

## Repository evidence

- [x] App name `Regrade`
- [x] Bundle identifier currently `app.regrade.client` in Capacitor and Xcode
- [x] Version `1.0.0`, build `1`
- [x] Education category and camera/photo usage descriptions
- [x] `PrivacyInfo.xcprivacy` exists and declares user defaults plus selected data types
- [x] Sign in with Apple implementation exists alongside Google sign-in
- [x] Native RevenueCat purchase and Restore Purchases paths exist
- [x] In-app account deletion UI/service exists
- [x] HTTPS privacy/terms/EULA constants target `regradeapp.tech`
- [x] Synthetic runtime/preview gates are absent from client builds

## Required manual/configuration gates

- [ ] Confirm Apple Developer ownership and reserve `app.regrade.client`; configure signing team and distribution profile.
- [ ] Confirm app name/trademark and final SKU, version/build sequence.
- [ ] Configure Firebase iOS app, Apple provider, Service ID/key/redirect domains and native Sign in with Apple capability; test new, returning, revoked and email-hidden accounts.
- [ ] Create App Store subscription group/products matching RevenueCat entitlements; configure prices/localization, review screenshots, server notifications and sandbox users.
- [ ] Test purchase, pending/failure, renewal, grace, expiry, restore, cancellation/manage link and account deletion with active subscription.
- [ ] Reconcile the privacy manifest and App Store privacy answers with every production SDK and real data flow. Apple requires accurate third-party disclosure and rejects invalid manifests: [privacy manifests](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files), [App privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy).
- [ ] Host and manually verify privacy policy, support, terms/EULA and privacy-choices/account-deletion URLs from a clean device/network.
- [ ] Add/verify universal links and Associated Domains if notification/deep-link URLs are claimed.
- [ ] Configure APNs/push capability and notification permission timing; test all deep links.
- [ ] Decide age rating and child/education declarations with counsel; verify parent mode consent.
- [ ] Run Xcode privacy report, archive validation, export-compliance answer, TestFlight real-device tests and accessibility audit.
- [ ] Supply App Review credentials or a review-safe sample account/data path. A production demo mode must not expose fake user outcomes; App Review can receive separate review credentials/notes.
- [ ] Prepare final iPhone/iPad screenshots from the actual submitted binary.

## Policy-critical notes

- Digital subscriptions/features must use App Store in-app purchase unless a current guideline exception/entitlement applies. See [App Review Guidelines 3.1](https://developer.apple.com/app-store/review/guidelines/).
- Apps offering third-party primary login must meet Guideline 4.8; keep Sign in with Apple equivalent and working.
- Apps with account creation must let users initiate full account deletion in-app; Sign in with Apple tokens must also be revoked. See [Apple account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app).
- Do not claim automatic appeal submission: external sending must require explicit consent.

## Current blockers

No Apple team/signing evidence, no App Store Connect record/IAP products, no sandbox purchase evidence, no production Firebase/Apple login evidence, no push/deep-link configuration, no clean-device URL verification, no validated archive, and no real-device QA evidence.
