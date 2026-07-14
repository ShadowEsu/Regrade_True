# NOTICE

Copyright (c) 2026 Preston Jay Susanto. All rights reserved.

This software and associated materials are the proprietary and confidential property of Preston Jay Susanto. Use is governed by the `LICENSE` file in the root of this repository. Unauthorized use, reproduction, or distribution is prohibited.

See also `CONTRIBUTING.md` for contributor and intern expectations. Signed CIIAA / NDA agreements control for authorized contributors.

## Third party components

This project includes third party open source software. Each third party component is licensed under its own terms. Nothing in the Regrade proprietary license (`LICENSE`) modifies the terms under which these components are made available.

The corresponding upstream license text for each component is reproduced in the `node_modules/<package>/LICENSE` file shipped with this repository and within the compiled application bundle as required by each license.

This list is intentionally non-exhaustive. Regenerate a full attribution list from lockfiles at any time with:

```bash
npx license-checker --production --json > THIRD_PARTY_LICENSES.json
```

### Web client (root `package.json`)

| Component | License | Source |
|-----------|---------|--------|
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

### Server (`server/package.json`)

| Component | License | Source |
|-----------|---------|--------|
| Express | MIT | https://github.com/expressjs/express |
| Helmet | MIT | https://github.com/helmetjs/helmet |
| express-rate-limit | MIT | https://github.com/express-rate-limit/express-rate-limit |
| cors | MIT | https://github.com/expressjs/cors |
| zod | MIT | https://github.com/colinhacks/zod |
| dotenv | BSD-2-Clause | https://github.com/motdotla/dotenv |
| @google/genai (Google Gen AI SDK) | Apache-2.0 | https://github.com/googleapis/js-genai |
| firebase-admin | Apache-2.0 | https://github.com/firebase/firebase-admin-node |
| tsx | MIT | https://github.com/privatenumber/tsx |

### Fonts

The web client loads the following Google Fonts at runtime:

- **Crimson Pro** — SIL Open Font License 1.1 — https://fonts.google.com/specimen/Crimson+Pro
- **Inter** — SIL Open Font License 1.1 — https://fonts.google.com/specimen/Inter

These fonts are not redistributed by Regrade; they are served by Google Fonts under the SIL OFL 1.1.

### AI model usage

The Regrade backend may call **Google Gemini** models through Google's SDK. Use of those models is subject to Google's terms and acceptable-use policies. Regrade does not redistribute model weights.

For the full text of each third party license, see the respective component's repository or distribution.

## Trademark notice

"Canvas", "Gradescope", "Blackboard", "Moodle", "D2L Brightspace", "Schoology", "Microsoft Teams", "Google Classroom", "Turnitin", and other learning-platform names referenced in the application are trademarks of their respective owners. Regrade is not affiliated with, endorsed by, or sponsored by any of these companies. References are descriptive only.

"Gemini" is a trademark of Google LLC.

## Source file header

Apply the following header to new source files where practical:

```
Copyright (c) 2026 Preston Jay Susanto. All rights reserved.
Proprietary and confidential. See LICENSE in the repository root.
```

## Contact

For licensing or attribution questions: pretonjs2024@gmail.com

If you believe a component is missing from this notice or attributed incorrectly, contact the address above and the file will be corrected promptly.
