# Regrade 2.0 Animation Guidelines

## Purpose

Motion communicates continuity, progress, selection, and completion. It must never delay access to Appeal or make containers appear to compress/reassemble.

## Timing tokens

- Instant feedback: 90–140 ms.
- Control/state transition: 160–220 ms.
- Page/content entrance: 220–320 ms.
- Focused onboarding transition: 280–420 ms.
- Never use a long animation before an urgent grade-review action.

## Easing

- Standard: `[0.22, 1, 0.36, 1]` for entrances and sheets.
- Selection: ease-out.
- Exit: slightly faster than entrance.
- Spring only for small success checks or draggable pet behavior; never for page navigation.

## Navigation

- Keep the page shell fixed.
- Crossfade content with at most 4–8 px vertical movement.
- Bottom-tab selection changes fill and icon emphasis without jumping.
- Avoid animating height from unknown content during tab changes.

## Lists and cards

- New content may fade/translate once.
- Expanding a card animates the detail region while the card stays anchored.
- Filter results crossfade; do not stagger dozens of rows.
- Swipe/press feedback is subtle scale or tint, never bounce.

## Onboarding

- Progress segment fills between steps.
- Content crossfades with a short horizontal directional cue.
- Demonstrations may have one finite illustration loop, then rest.
- Completion check uses one restrained spring and proceeds after the user can perceive success.

## AI states

- Analysis uses a stable progress list with current/completed states.
- Mr Whale typing uses a low-key three-dot or text-cursor indicator.
- Streaming text should not cause the whole message column to jump.
- Annotation lines/highlights appear only when their evidence anchor is known.

## Notifications

- Bell badge scales/fades on count changes.
- Notification drawer enters as a popover/sheet.
- New in-app toast appears near the top, remains readable, and dismisses without blocking navigation.

## Reduced motion

When `prefers-reduced-motion: reduce` is active:

- Disable transforms, springs, parallax, decorative loops, and stagger.
- Retain immediate opacity changes only where needed for state clarity.
- Never require animation to understand completion or selection.

## Performance rules

- Animate opacity and transform whenever possible.
- Do not animate large blur filters or gradients continuously.
- Do not ship video backgrounds in the core app.
- Lazy-load decorative media.
- Keep animation assets optional and compressed.

