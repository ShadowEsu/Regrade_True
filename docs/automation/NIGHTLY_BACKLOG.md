# Nightly backlog

## High
- Route remaining client Firestore profile writes through server Admin endpoints (theme, AI consent, analysis alerts, notification prefs, auto mode, grade detection, study checklist, `syncProfile`). Pattern exists in `server/src/profile.ts`.
- Re-test Electron Google OAuth end-to-end (redirect flow in `nativeAuth.ts` / `electron/main.cjs`).

## Medium
- Verify desktop wide layout at ≥1100px in Chrome/Electron (Home landed; check header alignment and "Ask Mr Whale" baseline); widen Review, Appeal, Profile, and Mr Whale chat to match.
- Verify local Stripe checkout + webhook sync (`stripe listen --forward-to localhost:8787/v1/billing/webhook`), intro trial (`ensureIntroTrial`), currency selector.
- Document that passkeys require a real browser (Chrome / `npm run desktop`), not embedded IDE browsers; improve the error message.

## Low
- Persistent left nav rail at ≥1100px per `docs/planning/RESPONSIVE_LAYOUT_PLAN.md`.
- Remove leftover decorative emoji noise if any remain.
- Apple signing / DMG distribution, RevenueCat, App Store IAP, Capacitor mobile polish (deferred until asked).
