# Regrade native subscription setup

Regrade uses Apple In-App Purchase on iOS and Google Play Billing on Android through RevenueCat. Stripe is web-only. The native app must never display or link to Stripe checkout.

## Product catalog

Create one subscription group named `Regrade Plans` in App Store Connect. Add two auto-renewable monthly subscriptions:

| Plan | Apple / Google product ID | RevenueCat entitlement | Intended price |
| --- | --- | --- | --- |
| Student | `app.regrade.student.monthly` | `student` | USD 9.99/month |
| Pro | `app.regrade.pro.monthly` | `pro` | USD 19.99/month |

Put both products in the same Apple subscription group so upgrades and downgrades are handled as one subscription. Configure the Pro product at the higher service level.

## App Store Connect

1. Accept the Paid Applications Agreement and complete banking and tax information.
2. Create the subscription group and products above, including localized display names and descriptions.
3. Add the App Store Connect In-App Purchase key to RevenueCat.
4. Complete subscription review metadata and attach a screenshot of Profile → Plan & Usage.
5. Add the subscriptions to the app version submitted for review.
6. Test purchase, upgrade, downgrade, cancellation, billing retry, and Restore Purchases with Sandbox accounts.

The paywall must show the localized store price, monthly duration, automatic-renewal language, Terms of Service, Privacy Policy, and Restore Purchases. The implemented Profile paywall does this.

## RevenueCat

1. Create Apple and Google apps in one RevenueCat project.
2. Import the two products from App Store Connect and Google Play Console.
3. Create `student` and `pro` entitlements and attach the matching products.
4. Create a current offering containing both monthly packages.
5. Set the SDK public keys in the client build environment:

   - `VITE_REVENUECAT_APPLE_API_KEY`
   - `VITE_REVENUECAT_GOOGLE_API_KEY`

6. Set the secret verification values only on the API server:

   - `REVENUECAT_SECRET_API_KEY`
   - `REVENUECAT_WEBHOOK_AUTH`
   - `REVENUECAT_STUDENT_ENTITLEMENT=student`
   - `REVENUECAT_PRO_ENTITLEMENT=pro`

7. Register `https://YOUR_API/v1/billing/revenuecat/webhook` in RevenueCat. Set its Authorization header to `Bearer <REVENUECAT_WEBHOOK_AUTH>`.

The server independently calls RevenueCat before granting paid quotas. Public SDK keys may be in the app; RevenueCat secret keys must never be placed in a `VITE_` variable.

## Native release environment

Before `npm run cap:sync`, provide the deployed API origin:

```text
VITE_API_BASE_URL=https://YOUR_API
```

Without it, native AI, billing synchronization, connectors, and account deletion cannot reach the server.

## Google Play follow-up

Create matching monthly subscriptions and base plans in Play Console. RevenueCat handles Billing Library purchase acknowledgement and validation. Configure Real-time Developer Notifications through RevenueCat and test pending purchases, account hold, grace period, restore, upgrade, and downgrade before Android submission.

## Web billing

The web application may continue using Stripe checkout. The native code branches before any checkout request and uses the device store instead. Do not add a Stripe link, pricing redirect, or external purchase call to action to the native paywall unless a storefront-specific entitlement/program has been reviewed and intentionally implemented.
