# Regrade 2.0 UI Changelog

Date: July 11, 2026

## Foundation

- Added a complete current-state architecture, feature, and UI audit.
- Added Wispr Flow research, Regrade design principles, implementation plan, component rules, and motion rules.
- Created recoverable pre-refactor branch `backup/regrade-2.0-pre-refactor-20260711` at snapshot commit `f5dfe88`.
- Preserved all existing service contracts, API endpoints, identity, billing, imports, supervisor permissions, and appeal states.

## Visual system

- Replaced operational gradients and glass with semantic pale canvases, grouped surfaces, hairline dividers, and quiet inset rows.
- Tuned the existing licensed Fraunces/Plus Jakarta Sans pairing into editorial and operational roles.
- Standardized buttons, cards, list rows, radius, shadows, metadata, headings, and dark-mode equivalents.
- Kept Regrade blue as an accent instead of a full-screen atmosphere.
- Reduced page movement and removed the raised/jumping Coach navigation treatment.

## Home

- Rebuilt Home as a returning-user workspace.
- Added one dominant “Review an exam” action.
- Added a compact recent-work state, Mr Whale entry, Connections entry, possible-issue notice, and dismissible evidence guide.
- Removed repeated marketing metrics, feature explanations, and duplicated connector/review promotions.

## Navigation and notifications

- Preserved five equal destinations and Coach in the center.
- Added stable, non-jumping selected-tab motion.
- Replaced the binary notification icon behavior with a notification drawer containing recent completed reviews and a master alert switch.
- Added outside-click dismissal and honest empty state.

## Onboarding

- Added a three-slide Regrade introduction: understand marks, appeal with evidence, and learn from exams.
- Preserved separate role, name, institution, and connector setup.
- Added a contextual notification-permission screen before the system prompt.
- Preserved optional connector setup and user-controlled deferral.

## Authentication and source choices

- Simplified sign-in to Apple, Google, and one explicit “Continue with email” disclosure.
- Kept signup email/password visible when creating an account and preserved password reset.
- Added a subtle Regrade image treatment behind the auth card.
- Added a preview-only loading route at `?splash=1` so splash, auth, and onboarding can be reviewed independently.
- Added an explicit “Upload, connect, or automate” choice at the start of an appeal.
- Connected-work imports now ask “Would you like Regrade to review this exam?” with “Yes, review it” and “Not now.”
- Kept the complete searchable connector library and the Profile Auto Mode controls.

## Profile and settings

- Added a clean account summary with plan management.
- Added a grouped profile directory for Connections, Notifications & Automation, and Settings & Account.
- Added focused subpage headers with a predictable return action.
- Moved Appearance out of Connections into Settings & Account.
- Preserved all profile personalization, plan usage, purchases, automation, legal, family, sign-out, and deletion functions.

## Footprint

- Removed unused client dependencies: client-side Express, dotenv, Firebase rules lint plugin, and redundant type packages.
- Removed 157 packages from the client dependency tree.
- Added explicit generated-cache cleanup and clean-install scripts.
- Kept the secure standalone server dependency lock after rejecting a smaller workspace configuration that weakened transitive vulnerability overrides.
