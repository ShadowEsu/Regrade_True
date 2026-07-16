# Firebase setup

1. Create separate development, beta, and production projects.
2. Enable Email/Password, Google, and Apple providers; register exact web/native IDs.
3. Add authorized domains and configure password-reset/verification templates.
4. Create Firestore and Storage in the required region. Deploy `firestore.rules` and
   `storage.rules`; test them before data import.
5. Register web, iOS, and Android App Check providers. Set the public web site key in
   `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`; enable server enforcement only after clients work.
6. Put public web config in build environment variables. Put Admin credentials only in
   the server secret manager, never in the repository or mobile bundle.
7. Configure the API storage bucket and exact production CORS origins.
8. Create test accounts A and B and prove neither can access the other's profiles,
   cases, notifications, annotations, imports, documents, or family data.

See `.env.example`, `.env.production.example`, and `server/.env.example` for names.
