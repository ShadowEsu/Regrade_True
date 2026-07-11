# Regrade store submission checklist

Code owner: Preston Jay Susanto · Bundle/application ID: `app.regrade.client`

## Apple App Store Connect

- Create Student and Pro monthly auto-renewable subscriptions using the product IDs in `APP_STORE_IAP_SETUP.md`; attach them to one subscription group.
- Enter localized price, duration, feature limits, Terms of Service, and Privacy Policy before purchase review.
- Configure Sign in with Apple for the bundle ID and Firebase provider.
- Privacy label: disclose name, email, user ID, uploaded photos/documents, academic content, purchase history, support/AI feedback, and crash data if crash reporting is enabled. Mark data as linked for app functionality; Regrade does not track users for advertising.
- Privacy policy URL: `https://regradeapp.tech/privacy.html`.
- Account deletion is in Profile → Settings & account. Add `https://regradeapp.tech/legal/delete-account.html` as the privacy choices/support URL where appropriate.
- Complete age rating honestly (service is 13+, is not submitted to the Kids category), export compliance, content rights, and review-contact fields.
- Give App Review a working non-production reviewer account and explain the upload → annotation → evidence → draft → learn flow, plus how to restore purchases.
- Upload device screenshots captured from a release/TestFlight build. Do not use preview-only claims as evidence of live connectors.

## Google Play Console

- Create matching Student and Pro base plans, connect them through RevenueCat, and test with license testers.
- Complete Data safety for account/profile data, academic documents, AI processing, connector data, purchases, and diagnostics actually enabled in the release.
- Enter the public deletion resource `https://regradeapp.tech/legal/delete-account.html` and confirm in-app deletion.
- Complete the AI-generated-content declaration. Mr Whale includes an in-app “Report response” control; monitor the `aiFeedback` collection and respond to reports.
- Complete content rating, target audience (13+), app access/reviewer credentials, ads declaration (none), and privacy policy.
- Upload phone/tablet screenshots from the signed release build and provide a release-notes summary.

## Before either submission

- Deploy the API with `NODE_ENV=production`, App Check enforcement, Firebase Admin credentials, storage bucket, connection encryption key, Gemini key/model, exact CORS origins, and billing webhook secrets.
- Publish Firestore and Storage rules, legal pages, and the account-deletion page.
- Test purchase, restore, cancellation/expiration, account deletion, login/logout, AI consent, file upload, and every advertised live connector on store sandbox accounts.
- Archive a signed iOS build and generate a signed Android App Bundle; the unsigned local release artifacts are verification builds only.
