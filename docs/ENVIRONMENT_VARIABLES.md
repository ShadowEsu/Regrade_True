# Environment Variables

The authoritative checklist is `ENVIRONMENT_CHECKLIST.md`. Production requires client Firebase/App Check/API URL values and server Gemini, Firebase Admin, Storage bucket, connector encryption key, family pepper, cron secret, exact CORS origins, App Check enforcement, RevenueCat verification, and relevant public OAuth client identifiers. Native digital purchases use Apple/Google through RevenueCat; secrets never use `VITE_*`. APNs/FCM, analytics, and error-monitoring variables cannot be finalized until those providers are implemented.
