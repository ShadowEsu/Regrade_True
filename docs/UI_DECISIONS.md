# Regrade 2.0 UI Decisions

## Why the Home page changed most

The former Home was partly a signed-in dashboard and partly a product landing page. Returning students need their next action and recent evidence, not repeated proof that Regrade reads rubrics. The new hierarchy makes the primary action immediate and keeps education in one dismissible card.

## Why Regrade did not literally clone Wispr Flow

The useful qualities are structural: one idea per screen, editorial typography, pale grouped surfaces, stable navigation, permission priming, and restrained settings. Reusing Wispr's exact mark, art, copy, layout, or proprietary fonts would weaken Regrade's identity and create intellectual-property risk. Regrade therefore uses its own logo, blue accent, evidence language, Mr Whale, and existing licensed type stack.

## Why serif and sans both remain

Fraunces gives onboarding and major headings a memorable editorial voice. Plus Jakarta Sans keeps grades, rubric details, controls, chat, and settings highly readable. Restricting each typeface to a semantic role creates consistency without making the app sterile.

## Why operational gradients were removed

Gradients competed with marks, statuses, and annotations. Pale solid groups allow evidence colors and destructive/success states to retain meaning, improve dark-mode translation, and reduce rendering work.

## Why Coach is centered but not raised

Coach remains the middle destination, as requested, but it now uses the same geometry as the other tabs. This keeps Mr Whale important without turning the navigation into a novelty control or causing a visual jump.

## Why notifications became a drawer

A bell conventionally represents recent events, while a switch represents a preference. Combining both into a hidden toggle was ambiguous. The drawer shows what happened; the switch inside controls whether future alerts are surfaced.

## Why Profile became a directory

Connections, plan usage, AI/automation, privacy, family access, legal help, and deletion are different tasks. A grouped directory gives each a predictable home and reduces the cognitive load of a single long screen while preserving every capability.

## Why dependency consolidation was rejected

Hoisting client and server dependencies reduced duplication but caused Firebase Admin's secured UUID override to stop applying, introducing six moderate advisories. The optimization was reverted. Development folder size is secondary to backend supply-chain correctness; generated caches remain the safe cleanup target.

