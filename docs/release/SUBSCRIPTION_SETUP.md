# Subscription setup

Native subscriptions use Apple/Google products with RevenueCat verification. Public
SDK keys may be in the app; RevenueCat secret and webhook authorization stay server-side.

Plans currently encode monthly limits: Free 3 exams/25 messages, Student 10/50,
Pro 20/100. Student and Pro include Auto Mode. Confirm product copy, price, tax,
grace period, restore, cancellation, refund, expiry, and account-transfer behavior.

Stripe endpoints exist for web checkout only. Do not route a native digital-feature
purchase through Stripe where store policy requires IAP.
