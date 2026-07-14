# Wispr Flow Research for Regrade 2.0

The product referenced in the brief and screenshots is **Wispr Flow**. This document uses its publicly visible product behavior and the supplied screenshots as design-quality research. It does not authorize copying Wispr's trademark, proprietary artwork, exact screens, or unavailable fonts.

## Sources reviewed

- [Wispr Flow App Store listing](https://apps.apple.com/us/app/wispr-flow-ai-voice-keyboard/id6497229487)
- [Official app navigation guide](https://docs.wisprflow.ai/articles/5096240724-navigating-the-wispr-flow-app-desktop-ios-and-android)
- [Official setup guide](https://docs.wisprflow.ai/articles/3152211871-setup-guide)
- [Official notification controls guide](https://docs.wisprflow.ai/articles/9454889914-how-to-disable-wispr-flow-notifications-on-ios)
- [Official privacy and cloud-sync guide](https://docs.wisprflow.ai/articles/4709791908-understanding-privacy-mode-and-cloud-sync)
- [Official Flow Styles guide](https://docs.wisprflow.ai/articles/2368263928-how-to-setup-flow-styles)
- Seventeen user-provided iPhone screenshots covering onboarding, Home, Dictionary, Snippets, Style, Scratchpad, Account, Settings, notifications, and splash.

## Observed design philosophy

### One idea per screen

Onboarding uses a large editorial statement, one supporting line or demonstration, and one dominant action. Setup steps are explicit and visual rather than explained in dense prose. Progress is shown as a small segmented rail.

### Editorial type paired with utilitarian UI

Large moments use an expressive high-contrast serif. Controls, labels, navigation, and descriptions use a clear sans serif. This contrast creates personality without making operational screens ornamental.

Regrade should preserve this two-font logic rather than attempting to extract or redistribute Wispr's exact font files. Fraunces and Plus Jakarta Sans already provide a legally usable foundation; the refactor should tune their weights, optical sizes, and semantic roles.

### Pale canvas and grouped white surfaces

Operational screens use a faint lavender-gray canvas, white grouped cards, subtle dividers, and almost no heavy shadow. The palette is quiet enough that black text, purple selection, green switches, and red destructive actions remain meaningful.

### Stable five-item bottom navigation

Official documentation confirms five iOS tabs. The screenshots show a floating white navigation capsule with a soft selected background and icon-plus-label anatomy. The selected item changes surface color rather than moving dramatically.

### Contextual education, not permanent marketing

Home can show a dismissible guidance card or carousel relevant to the user. Once dismissed, activity/history becomes dominant. Education is timely and removable rather than repeated on every visit.

### Settings as grouped decisions

Settings separates sections with quiet headings and large white groups. Each row contains a short title, a restrained explanation, and an action or switch. Account information lives in its own destination. Destructive actions are isolated at the end.

### Permission priming

The notification screen explains three concrete benefits and offers both the primary permission action and a lower-emphasis deferral. This precedes the native system prompt, giving the user context and control.

### Empty states remain useful

Scratchpad uses one centered illustration, one sentence, and one action. It does not fill the empty screen with feature lists. Dictionary and Snippets show an introductory card only when useful, followed by simple list rows and a floating add button.

### Personalization is shown through examples

The Style page presents a named choice and an example of its output. Users understand the setting through the result rather than a technical explanation.

## Product-structure findings

Official documentation confirms that Home groups history by date and combines it with a small statistics/guidance carousel. Dictionary and Snippets use search, add, edit, and delete patterns. Settings distinguishes data-use consent from cloud storage instead of collapsing different privacy concepts into one vague switch. Notifications use both system settings and an in-app surface.

These patterns translate well to Regrade:

| Wispr pattern | Regrade translation |
| --- | --- |
| Transcription history by date | Appeal/analysis activity by date |
| Contextual setup card | Dismissible connector, notification, or first-exam guidance |
| Dictionary list | Evidence-backed recurring learning patterns |
| Snippets | Saved appeal phrasing or teacher-safe draft blocks, later consideration only |
| Style example | Appeal-tone preview in Mr Whale settings |
| Notes empty state | Review/History empty state |
| Grouped settings | Profile directory and focused setting pages |
| Notification priming | Explain completed-analysis, new-evidence, and automation alerts before permission |

## What Regrade should not copy

- The Flow name, waveform mark, purple identity, promotional claims, screenshots, or illustrations.
- Exact onboarding copy or keyboard demonstrations.
- Exact proprietary font files or unlicensed typefaces.
- Feature organization that does not match Regrade's appeal-first purpose.
- Wispr's privacy defaults; Regrade must use its own explicit education-data consent model.

## Core lessons

1. Reduce each screen to one immediate job.
2. Let typography create personality and let controls stay quiet.
3. Use grouped surfaces rather than nested cards.
4. Teach through a visual example and a single action.
5. Keep navigation stable and selection motion subtle.
6. Put account, privacy, notifications, and destructive actions in predictable directories.
7. Show recent user work before product marketing.

