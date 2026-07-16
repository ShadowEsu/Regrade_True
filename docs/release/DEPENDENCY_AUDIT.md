# Dependency audit

Audit date: 12 July 2026. Lockfiles are retained. `node_modules` is ignored and is the main reason the local folder exceeds 700 MB.

## Client production dependencies

| Package/group | Observed purpose | Decision |
|---|---|---|
| React / React DOM | UI runtime | Keep |
| Vite React/Tailwind plugins, Tailwind | build and styling | Keep (build-time packages currently under dependencies/devDependencies as configured) |
| Firebase | auth, Firestore, storage/config | Keep; largest normal app chunk, already isolated |
| motion | transitions/reduced-motion-aware components | Keep; isolated chunk |
| lucide-react | icons | Keep; isolated chunk |
| pdfjs-dist | PDF render/text/page images | Keep; worker is largest asset, lazy route use |
| KaTeX / DOMPurify | equations and safe formatted AI output | Keep; test WOFF2-only font follow-up |
| Capacitor core/platform/CLI/app | native shell and lifecycle | Keep; CLI could move to dev dependency in a later lockfile-only change |
| Apple sign-in | Guideline 4.8 native login | Keep |
| Local notifications | notification permission/local delivery | Keep; remote push is not configured |
| RevenueCat Capacitor | App Store/Play entitlements, purchase/restore | Keep; substantial native size but required for planned subscriptions |

## Server

Express, CORS, Helmet, rate-limit, Firebase Admin, Zod, dotenv and Google GenAI are used. Stripe is used by web checkout/webhook code; it must not be surfaced from App Store/Play purchase flows. Keep only if Regrade will sell web subscriptions; otherwise remove the web billing feature in a separate tested change.

## Audit results

- `npm audit --omit=dev` and server equivalent are run in the final verification log; findings must be evaluated, not auto-fixed blindly.
- No duplicate direct package was safely removable in this pass.
- No release source maps are generated.
- Native plugin list after Capacitor sync: Apple sign-in, App lifecycle, local notifications, RevenueCat.
- Android cannot be dependency-verified until Java 17+ is installed.

## Packaging recommendation

Keep platform SDKs in production dependencies because Capacitor sync resolves them. Move build-only CLI/plugin/type packages only in a dedicated dependency-maintenance change with clean install, iOS pod sync and Android build evidence.
