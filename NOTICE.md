# Third-Party Notices

Regrade — Copyright (c) 2026 Preston Jay Susanto. All rights reserved.

The Regrade application incorporates the third-party open-source software
listed below. Each component is the property of its respective copyright
holders and is licensed under its own terms. Nothing in the Regrade
proprietary license (see `LICENSE`) modifies the terms under which these
components are made available. The corresponding upstream license text for
each component is reproduced in the `node_modules/<package>/LICENSE` file
shipped with this repository and within the compiled application bundle as
required by each license.

This list is intentionally non-exhaustive. The authoritative attribution list
is generated at build time from `package-lock.json` and `server/package-lock.json`.
You can regenerate a fresh list at any time with:

```bash
npx license-checker --production --json > THIRD_PARTY_LICENSES.json
```

## Web client (root `package.json`)

| Component | License | Source |
|---|---|---|
| React | MIT | https://github.com/facebook/react |
| React DOM | MIT | https://github.com/facebook/react |
| Vite | MIT | https://github.com/vitejs/vite |
| @vitejs/plugin-react | MIT | https://github.com/vitejs/vite-plugin-react |
| Tailwind CSS | MIT | https://github.com/tailwindlabs/tailwindcss |
| @tailwindcss/vite | MIT | https://github.com/tailwindlabs/tailwindcss |
| Motion (formerly Framer Motion) | MIT | https://github.com/framer/motion |
| Lucide React | ISC | https://github.com/lucide-icons/lucide |
| Firebase JavaScript SDK | Apache-2.0 | https://github.com/firebase/firebase-js-sdk |
| DOMPurify | (MPL-2.0 OR Apache-2.0) | https://github.com/cure53/DOMPurify |
| pdf.js (`pdfjs-dist`) | Apache-2.0 | https://github.com/mozilla/pdf.js |
| Autoprefixer | MIT | https://github.com/postcss/autoprefixer |
| TypeScript | Apache-2.0 | https://github.com/microsoft/TypeScript |
| dotenv | BSD-2-Clause | https://github.com/motdotla/dotenv |
| express (dev dependency for proxy types) | MIT | https://github.com/expressjs/express |

## Server (`server/package.json`)

| Component | License | Source |
|---|---|---|
| Express | MIT | https://github.com/expressjs/express |
| Helmet | MIT | https://github.com/helmetjs/helmet |
| express-rate-limit | MIT | https://github.com/express-rate-limit/express-rate-limit |
| cors | MIT | https://github.com/expressjs/cors |
| zod | MIT | https://github.com/colinhacks/zod |
| dotenv | BSD-2-Clause | https://github.com/motdotla/dotenv |
| @google/genai (Google Gen AI SDK) | Apache-2.0 | https://github.com/googleapis/js-genai |
| firebase-admin | Apache-2.0 | https://github.com/firebase/firebase-admin-node |
| tsx | MIT | https://github.com/privatenumber/tsx |

## Fonts

The web client loads the following Google Fonts at runtime:

- **Crimson Pro** — SIL Open Font License 1.1 — https://fonts.google.com/specimen/Crimson+Pro
- **Inter** — SIL Open Font License 1.1 — https://fonts.google.com/specimen/Inter

These fonts are not redistributed by Regrade; they are served by Google Fonts
under the SIL OFL 1.1.

## AI model usage

The Regrade backend calls **Google Gemini** models via the Google Gen AI SDK.
Use of those models is subject to Google's Terms of Service and Generative AI
Acceptable Use Policy. Regrade does not redistribute Gemini model weights.

## Trademark notice

"Canvas", "Gradescope", "Blackboard", "Moodle", "D2L Brightspace", "Schoology",
"Microsoft Teams", "Google Classroom", "Turnitin", and other learning-platform
names referenced in the application are trademarks of their respective owners.
Regrade is not affiliated with, endorsed by, or sponsored by any of these
companies. References are descriptive only — they exist to help students
identify which platform they used and how to retrieve their graded work.

If you believe a component is missing from this notice or attributed
incorrectly, contact the Regrade owner (see `README.md`) and the file will be
corrected promptly.
