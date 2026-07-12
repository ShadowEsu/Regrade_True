# Current UI Problems

## Global

- The design vocabulary is inconsistent: editorial serif heroes, glass cards, dense utility panels, and plain settings rows compete instead of forming one system.
- `src/index.css` is nearly 2,000 lines and contains overlapping generations of component styles.
- Mobile content often reads as a responsive website rather than an intentional native command center.
- Header controls and profile/settings navigation compete with the five-tab bar.
- Important actions are frequently embedded in long pages instead of progressive cards, sheets, or detail screens.

## Screen-specific

- Login has all required methods but too much explanatory/secondary content and insufficient mobile hierarchy.
- Onboarding is functional but visually dense, with more copy and controls per step than the approved design.
- Home contains real metrics but is a vertical report; it lacks swipeable attention/recent cards, expandable streak, activity sequence, and contextual Mr. Whale access.
- Appeal screens are visually inconsistent between the start, upload, evidence, and draft stages.
- Review shows evidence reliably but lacks a real annotation toolbar and persistent coordinate layer.
- History is searchable but not modeled or animated as a clear event/outcome timeline.
- Notifications are a quick popover rather than a complete categorized inbox.
- Profile is over 1,000 lines and mixes account, connectors, automation, subscription, legal, preferences, and forms in one module.
- Supervisor mode is functional in structure but visually sparse and preview-heavy.

## Accessibility and motion

Visible focus/reduced-motion support exists, but interaction motion is mostly generic fade/translate. There are no shared card-to-detail transitions, consistent sheets, count-up metrics, connector sync rings, or annotation pin motion. All new motion must remain optional under `prefers-reduced-motion`.
