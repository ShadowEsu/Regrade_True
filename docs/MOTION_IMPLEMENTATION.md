# Motion Implementation

Regrade 2.0 motion is centralized in `MobilePrimitives.tsx` and shared CSS. `Reveal` handles in-view section entry, `CountUpValue` animates metrics from real values, `ExpandablePanel` reveals streak/evidence detail, `HorizontalScroller` supplies snap browsing, and Motion layout animations handle notification removal and card state changes. Document markers and contextual Whale panels use spring/fade transitions.

Navigation retains one shared active-tab `layoutId`. All continuous, spring, scroll, count-up, and typing animation must collapse to static opacity/state changes under `prefers-reduced-motion` or Motion’s reduced-motion hook.
