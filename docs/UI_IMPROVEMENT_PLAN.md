# Regrade 2.0 UI Improvement Plan

## Preserve

- Current architecture, service contracts, Firebase boundaries, and API routes.
- Five primary tabs: Home, Appeal, Coach, Review, History.
- Direct Appeal access and the existing appeal state machine.
- Evidence-only Review and supervisor consent model.
- Searchable connector library, subscription enforcement, automation, notifications, themes, legal links, and deletion.

## System-level refinements

1. Establish semantic tokens for canvas, grouped surface, raised surface, text, secondary text, hairline, accent, success, warning, danger, radius, spacing, and motion.
2. Consolidate repeated card/button/list styles into reusable primitives.
3. Replace gradients in operational UI with solid or subtly tinted surfaces.
4. Use serif only for editorial titles; use sans for dense content and controls.
5. Give all lazy-loaded pages a shared skeleton/loader instead of plain “Loading…”.
6. Preserve dark mode with semantic tokens rather than one-off overrides.

## Screen plan

### Splash and authentication

- Minimal ink-colored splash with Regrade mark and short fade.
- Clean sign-in hierarchy: brand, title, Apple/Google, email disclosure.
- Keep required legal and verification information, but reduce visual competition.

### Onboarding

- Add a short, skippable product-introduction carousel before account questions.
- Four focused setup questions remain role, name, institution, connector.
- Add notification education after setup, before requesting native permission.
- Persist progress so interruption does not restart setup.
- Use large editorial titles, small segmented progress, and evidence-themed Regrade illustrations.

### Home

- Returning-user structure: greeting, one primary “Review an exam” action, recent work, one contextual/dismissible guidance card, compact Mr Whale entry.
- Remove repeated product-marketing and metric blocks.
- Empty Home explains one next step; populated Home prioritizes recent work and pending actions.

### Appeal

- Keep the current entry page and workflow.
- Standardize each stage under one flow shell with concise progress.
- Use grouped evidence rows and expandable details.
- Keep the paper/annotation view visually dominant.
- End with “Finish” and a clear handoff to Review, never an implied automatic send.

### Coach

- Use a professional session strip with visible New Agent, rename, and overflow controls.
- Reduce introductory copy after the first message.
- Make assistant/user messages belong to the canvas rather than white chat bubbles.
- Anchor a compact composer; keep academic rendering, attachments, and prompt library.

### Review

- Stable search and filter control.
- Beautiful but restrained exam cards with score, date, course, and AI state.
- Quick expansion or detail sheet before full studio.
- Separate Exam Library, Patterns, and Checklist using tabs/segmented control only when data exists.
- Preserve evidence-based empty state.

### History

- Group by Today, Yesterday, month/date.
- Quiet metadata, consistent status labels, and quick preview.
- Search/filter controls appear compactly and can collapse on mobile.

### Profile and Settings

- Replace the broad dropdown-driven experience with a clean directory.
- Account header contains avatar, name, email, plan, and Manage Plan.
- Directory groups: Account, Connections, Notifications & Automation, Mr Whale, Appearance, Privacy & Data, Family, Help & Legal.
- Dedicated detail surfaces use grouped rows and concise explanations.
- Sign out and Delete Account remain isolated at the bottom of Account.

### Notifications

- Bell opens a lightweight inbox/popover with recent Regrade events.
- Settings contains the master permission state and granular categories.
- Permission primer explains: analysis completion, possible grading issue, and Auto Mode import.

### Supervisor

- Connected learner summary first; pairing second when a learner already exists.
- Focus areas, exams worth reviewing, and learner-approved appeal collaboration as three clear groups.
- Teacher email editor remains review-only until the user explicitly sends outside Regrade.

## Implementation order

1. Tokens, typography, surfaces, buttons, list rows, page shell, loader.
2. Layout header and bottom navigation.
3. Auth, onboarding, and notification primer.
4. Home.
5. Profile/settings and notification inbox.
6. Coach.
7. Review and History.
8. Appeal flow visual standardization.
9. Supervisor polish.
10. Responsive, dark-mode, reduced-motion, and regression verification.

## Success criteria

- No feature removed or hidden behind a new paywall.
- One obvious primary action per screen.
- No horizontal overflow at 375 px.
- Full light/dark parity.
- Keyboard-visible focus and semantic labels.
- No layout-jumping route animation.
- Existing tests pass and added visual-system components are covered where practical.
- Production build remains small and lazy-loaded.

