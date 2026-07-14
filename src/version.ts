/**
 * Single source of truth for branding and legal metadata that needs to be
 * referenced from multiple UI surfaces (About screen, footer, error states,
 * meta tags). Bumped per release. Keep in sync with:
 *
 *  - package.json `version`
 *  - android/app/build.gradle `versionName` (when Capacitor is added)
 *  - ios/App/App.xcodeproj `MARKETING_VERSION` (when Capacitor is added)
 *  - public/legal/privacy.html "Last updated"
 *  - public/legal/terms.html  "Last updated"
 *  - docs/legal/PRIVACY_POLICY.md  "Last updated"
 *  - docs/legal/TERMS_OF_SERVICE.md "Last updated"
 *  - docs/legal/EULA.md "Last updated"
 */
export const APP_VERSION = '1.0.0';

export const APP_NAME = 'Regrade';

/** Copyright owner as it must appear in the app, the store, and the LICENSE. */
export const APP_LEGAL_OWNER = 'Preston Jay Susanto';

/** Long-form copyright line for footers and About. */
export const APP_COPYRIGHT = `© 2026 ${APP_LEGAL_OWNER}. All rights reserved.`;

/**
 * Public contact email surfaced inside the app, in the privacy policy, in
 * App Store Connect, and in Google Play Console. Edit here in one place.
 *
 * TODO(prestonjay): replace this with your real published support address
 * before submitting to either store. Apple and Google require a real,
 * monitored mailbox.
 */
export const APP_SUPPORT_EMAIL = 'regradeteam@gmail.com';

/** Published URLs reviewers will be asked for. Deploy `public/legal/*.html`. */
export const APP_PRIVACY_URL = 'https://regradeapp.tech/privacy.html';
export const APP_TERMS_URL = 'https://regradeapp.tech/terms.html';
export const APP_EULA_URL = 'https://regradeapp.tech/eula.html';
export const APP_DELETE_ACCOUNT_URL = 'https://regradeapp.tech/legal/delete-account.html';
export const APP_WEBSITE_URL = 'https://regradeapp.tech';

/** Minimum age shown on sign-in (App Store / Play Families & COPPA). */
export const APP_MIN_AGE = 8;

/** Disclaimer shown inside the app where AI output is presented. */
export const APP_DISCLAIMER =
  'Regrade is an educational tool, not a law firm, and does not provide legal advice. AI output can be wrong. Always check official school policy and review the original graded work before submitting an appeal.';

/** Explicit consent before a graded file is sent to Regrade's AI service. */
export const AI_SERVICES_CONSENT =
  'Mr. Whale uses Regrade’s secure AI service to read the graded file, rubric, and feedback you choose to send. AI can make mistakes, so always check the original work before acting.';

/** Short trademark footer for AI surfaces. */
export const AI_TRADEMARK_FOOTER =
  'Mr. Whale is Regrade’s in-app AI assistant. Regrade is not a school, grading authority, or law firm.';
