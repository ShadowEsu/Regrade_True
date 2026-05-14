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
 *  - legal/PRIVACY_POLICY.md  "Last updated"
 *  - legal/TERMS_OF_SERVICE.md "Last updated"
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
export const APP_SUPPORT_EMAIL = 'support@regrade.app';

/** Published URLs reviewers will be asked for. Deploy `public/legal/*.html`. */
export const APP_PRIVACY_URL = 'https://regrade.app/legal/privacy.html';
export const APP_TERMS_URL = 'https://regrade.app/legal/terms.html';
export const APP_WEBSITE_URL = 'https://regrade.app';

/** Disclaimer shown inside the app where AI output is presented. */
export const APP_DISCLAIMER =
  'Regrade is an educational tool, not a law firm, and does not provide legal advice. AI output can be wrong. Always check official school policy and review the original graded work before submitting an appeal.';
