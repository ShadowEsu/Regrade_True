# Regrade 2.0 Component Guidelines

## Page shell

- Mobile gutter: 20 px; compact devices may use 16 px.
- Desktop reading width: 720–960 px depending on content.
- Page title block: eyebrow optional, title required, description optional and short.
- Vertical section rhythm: 28–36 px mobile, 36–48 px desktop.

## Typography

| Role | Family | Guidance |
| --- | --- | --- |
| Editorial display | Fraunces | 40–56 px welcome; 30–42 px major empty state; moderate contrast, no all caps |
| Page title | Plus Jakarta Sans or restrained Fraunces | 28–36 px, one line where possible |
| Section title | Plus Jakarta Sans | 18–22 px, semibold |
| Body | Plus Jakarta Sans | 15–17 px, 1.5 line height |
| Metadata | Plus Jakarta Sans | 12–14 px, secondary color |
| Control | Plus Jakarta Sans | 14–16 px, semibold |

## Surfaces

- `PageCanvas`: the quiet app background.
- `GroupCard`: grouped settings/lists; 20–24 px radius; hairline border optional.
- `ContentCard`: exam, appeal, or recent-work item; 18–22 px radius.
- `InsetRow`: pale nested action row; do not stack more than one level deep.
- `Notice`: status-specific tint with icon and short text.

Avoid nested cards inside cards unless an inner region is interactive and materially distinct.

## Buttons

- Primary: solid ink or Regrade blue, full-width in focused mobile flows.
- Secondary: pale filled button, never an outlined pill by default.
- Tertiary: text/icon action.
- Destructive: red text or red fill only at final confirmation.
- Icon button: 44 x 44 minimum with accessible label.

Only the primary action gets maximum contrast.

## Lists and settings

- Group title sits outside the white surface.
- Row contains leading icon optionally, title, optional description/value, and trailing control/chevron.
- Use dividers between rows; do not make every row an individual floating card.
- Switch descriptions explain what changes, not why the product is great.
- Destructive rows form a separate group.

## Search and filters

- Search is a 44–48 px filled control with leading magnifier and clear affordance.
- Suggested items may appear as three compact chips only before a query.
- Filters use a compact sheet or horizontally scrolling chips; avoid multiple always-open dropdowns.
- Empty search explains how to recover and keeps manual upload available.

## Bottom navigation

- Five equal destinations.
- Floating grouped surface with safe-area spacing.
- Selected item uses a quiet accent fill and stronger icon/text; no vertical jump.
- Badge uses a small count and accessible label.
- Coach stays centered but does not become a larger novelty button.

## Cards for exams and appeals

- Title and subject lead.
- Score/date/status are secondary and aligned consistently.
- One main card action; overflow for secondary actions.
- Expansion uses an internal detail region or sheet, not a nested full page by default.
- Appeal strength always combines label, icon, and color.

## Empty, loading, and success states

- One illustration/mark maximum.
- One short title, one explanation, one action.
- Skeletons match final content geometry.
- Success uses a short check transition and immediately shows the next action.

## Mr Whale

- Pixel whale art may appear at onboarding, Coach empty state, and small contextual help moments.
- No large decorative container behind every whale appearance.
- Avoid constant roaming/looping animation in serious flows.
- Message content uses the same canvas vocabulary as the rest of the app.

