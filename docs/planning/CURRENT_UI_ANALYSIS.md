# Current UI Analysis

Audit method: source inspection plus live preview review of Home, Appeal, Coach, Review, History, Profile, Connections, Plan & Usage, Settings & Account, onboarding, sign-in, and supervisor mode.

## What already works

- The five-tab model is understandable and preserves immediate access to Appeal.
- Home greets the user by name and gives direct access to the primary action.
- Appeal is progressive rather than exposing the full workflow at once.
- Review and History have honest empty states.
- Coach has session tabs, a visible New Agent action, attachments, prompt starters, and a compact composer.
- Connections are searchable and expose only three suggested platforms before search.
- Profile sections prevent one extremely long settings screen.
- Dark mode is implemented across the app rather than being a single inverted page.
- Motion is restrained and reduced-motion support exists.
- The UI avoids fabricating annotation positions or unsupported learning claims.

## Current visual system

- Main body font: Plus Jakarta Sans.
- Display/serif font: Fraunces.
- Primary palette: blue, pale blue, parchment/white, navy ink, and dark neutral equivalents.
- Shape language: rounded cards, pills, bordered panels, floating bottom navigation.
- Motion: short fade/vertical entry, selected-nav transitions, button press scale, onboarding slide/fade, loading indicators.
- Layout: centered `rg-app-shell`, sticky header, fixed bottom navigation, safe-area padding.

## Friction and inconsistencies

### Information density

Home currently repeats the product promise across the hero, quick metrics, one-upload card, three-step explanation, connector card, and Review card. Each block is reasonable alone, but together they make a returning-user dashboard feel like a marketing page.

Profile repeats the user identity header across every subsection and mixes appearance controls into the Connections result. Settings & Account contains legal, family pairing, support, and destructive account actions in one long vertical run.

### Component consistency

- Similar surfaces use several card classes and radius/spacing recipes.
- Some headings use serif display treatment while others use standard sans, without a strict semantic rule.
- Buttons vary among large rounded CTA, pill, ghost, chip, and bordered rows.
- Profile has both a dropdown directory and internal section labels; the relationship is functional but not visually elegant.
- Header treatment changes for Coach, which weakens spatial continuity.

### Navigation and hierarchy

- The bottom navigation is clear, but the header has three utility controls plus profile; on small screens this competes with brand/title space.
- Notifications are controlled through a switch-like icon rather than a familiar notification inbox entry.
- The profile dropdown is discoverable only from an avatar/icon without an adjacent account cue.
- App state is held in memory rather than reflected in URLs, so browser back/deep links do not map cleanly to all internal screens.

### Screen-specific findings

**Home**  
Strong greeting and primary actions, but too many secondary proof/education modules for repeat use. The best evolution is a calm daily workspace: one primary review action, a compact recent-work area, a small Mr Whale entry, and a dismissible guidance card.

**Appeal**  
The entry is clear. The internal upload screen is the largest and densest component in the product. The evidence ingredients, platform guidance, upload staging, consent, and pipeline status should remain progressive and use one consistent section shell.

**Coach**  
Feature-complete and structurally professional. It needs more consistent background/surface colors, a clearer session-management affordance, less hero copy, and a composer that visually anchors to the conversation like a focused workbench.

**Review**  
The evidence-only promise is excellent. Empty state is clean. Populated state needs strong card rhythm, a stable search/filter row, and clearer separation among exam library, recurring patterns, and check-off plan.

**History**  
Current empty state is effective. Populated state already supports grouping and quick preview; visual refinement should prioritize scan speed with quieter metadata and a single status vocabulary.

**Profile and Settings**  
This is the largest opportunity. The current content is correct but should adopt an iOS-like directory: calm grouped sections, short labels, secondary values, chevrons, and dedicated detail pages/sheets. Destructive actions must remain visually separated.

**Onboarding**  
The four-step structure, progress indicator, separate questions, and optional connector are correct. It can become more memorable with a brief Regrade intro sequence, larger editorial typography, illustrated evidence examples, and a dedicated notification-permission explanation before the system prompt.

**Supervisor**  
The functionality and consent language are strong. Visual emphasis should move from setup mechanics to the learner summary, with pairing as a secondary action after a learner is connected.

## What should stay exactly the same

- Five primary destinations and Coach in the center.
- Appeal always available; Review never gates Appeal.
- Evidence-only claims and exam-only Review inclusion.
- Existing functional flows, permissions, service boundaries, and data contracts.
- Searchable connector library with manual fallback.
- Mr Whale as the AI identity, not the entire product identity.
- Learner-controlled supervisor consent.
- Legal/account deletion visibility.

## What should be refined

- Typography scale and semantic use of serif versus sans.
- Spacing system, card radius, borders, shadows, button hierarchy, and list-row anatomy.
- Header utility placement and notification presentation.
- Empty/loading/success states.
- Profile directory and detail layouts.
- Home's returning-user hierarchy.
- Coach session management and message surfaces.

## What should be simplified or reorganized

- Remove repeated marketing explanations from the signed-in Home screen.
- Consolidate card styles into a small component vocabulary.
- Move appearance out of Connections.
- Turn Settings/Profile into grouped directories with focused detail screens.
- Present notifications as an inbox/popover with a master preference in settings.
- Keep filters collapsed or horizontally compact until needed.

## Accessibility and motion requirements

- Preserve visible focus states, semantic buttons, labels, and status announcements.
- Maintain 44-point touch targets on mobile.
- Never rely only on color for appeal strength or AI status.
- Respect `prefers-reduced-motion` and avoid looping decorative motion.
- Prefer opacity/transform transitions and avoid layout-jumping animations.
- Preserve readable contrast in both themes.

