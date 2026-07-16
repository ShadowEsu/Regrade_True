# Android submission checklist

Audit date: 12 July 2026. **Not ready for Google Play submission.**

## Repository evidence

- [x] Application ID `app.regrade.client`, version name `1.0.0`, code `1`
- [x] Compile/target SDK 35 (meets the currently published API 35 minimum for phone/tablet submissions; recheck at upload time). [Target API requirements](https://developer.android.com/google/play/requirements/target-sdk)
- [x] Internet permission only in the checked manifest
- [x] Android backups/data extraction disabled
- [x] RevenueCat purchase/restore implementation exists
- [x] In-app account deletion path exists
- [x] Production preview gate is development-only

## Required manual/configuration gates

- [ ] Create/verify Play Console app and package ownership; create upload key, Play App Signing and protected signing secrets.
- [ ] Configure release `google-services.json` outside Git and correct Firebase SHA-1/SHA-256; test Google sign-in on an internal-track build.
- [ ] Create Play subscription products/base plans/offers and RevenueCat entitlements; test purchase, pending, failure, renewal, hold, grace, expiry, restore and cancellation.
- [ ] Add easy in-app store-subscription management link. Google requires transparent recurring terms and an online cancel route: [subscriptions policy](https://support.google.com/googleplay/android-developer/answer/9900533).
- [ ] Host a public account-deletion web resource and enter it in Data safety in addition to the in-app path. [Account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111).
- [ ] Complete Data safety from measured production behavior, including Firebase, AI, RevenueCat, logs/analytics and deletion.
- [ ] Configure push (FCM), Android 13+ notification permission and notification deep links; no push configuration is proven in this repo.
- [ ] Configure verified Android App Links if claimed; current manifest has launcher intent only.
- [ ] Add release R8/resource shrinking only after a release regression test; it is currently off.
- [ ] Produce signed AAB; run bundletool/device tests across API levels, orientations, offline/failure and accessibility.
- [ ] Prepare actual store screenshots, feature graphic, short/full description, support/privacy URLs, content rating, target audience/families decision and app-access instructions.
- [ ] Verify policy for education/child users, SDK disclosures and any account/data access from supervisors.

## Payment rule

Play-distributed apps charging for in-app digital education features/subscriptions generally must use Google Play Billing unless enrolled in an applicable current program/exception. Do not link to Stripe from purchase/signup flows. See [Google Play payments policy](https://support.google.com/googleplay/android-developer/answer/9858738).

## Current blockers

No Play app/signing evidence, no production Google services config, no subscription product/sandbox evidence, no signed AAB, no push/App Links, no Data safety submission, no deletion website verification and no real-device/internal-track QA.
