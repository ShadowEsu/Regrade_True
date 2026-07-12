# Responsive Layout Plan

- 0–479 px: primary mobile layout, 18 px gutters, five-tab bottom bar, one-column details.
- 480–767 px: large phone/compact tablet, 22 px gutters, wider cards and two-column metrics.
- 768–1099 px: tablet, centered 720 px reading column; detail screens may use document + evidence split view.
- 1100 px and above: desktop shell, persistent navigation rail, 2–3 column dashboard, document/evidence/Whale panes.

Mobile behavior is authored first. Desktop must recompose components rather than stretching a phone canvas. Safe-area insets, portrait/landscape, keyboard focus, 200% zoom, and 44 px touch targets are mandatory.
