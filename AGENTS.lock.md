# AGENTS.lock.md — Territory Manifest (source of truth)

Rule for every agent: **You may only create or edit files inside your declared territory.
If you believe you need to edit a file outside it, stop and report to the Orchestrator in
your BLOCKED line. Do not edit it.**

Adapted to the real repo layout (see docs/CURRENT_STATE.md). Feature agents never import
from each other; they import only from `src/contracts` and `src/theme`.

| Agent | ID | Exclusive territory (create/edit) | May read (never write) |
|---|---|---|---|
| Architect | A0 | `src/contracts/**`, `src/theme/tokens.ts` | everything |
| Design System | A1 | `src/components/ui/**`, `src/styles/**` | `src/contracts/**`, `src/theme/**`, `src/index.css`, `src/theme-dark.css` |
| Copy & i18n | A2 | `src/copy/**`, `index.html`, `app.html`, string literals inside existing `src/views/**` and `src/components/*.tsx` (text-only edits: literal → `t('key')`, dash removal; no logic changes) | everything |
| Appeal Integrity | A3 | `src/features/integrity/**` | `src/contracts/**`, `src/services/**`, `src/lib/firebase.ts` |
| Analysis Engine | A4 | `src/features/analysis/**`, `src/lib/ai/**`, `shared/**` + mirror `server/src/shared/**` (both copies, always identical) | `src/contracts/**`, `src/types.ts`, `server/src/regradeGemini.ts` |
| Parent Mode | A5 | `src/features/parent/**` | `src/contracts/**` |
| Tracker & Radar | A6 | `src/features/tracker/**` | `src/contracts/**` |
| Tone Memory | A7 | `src/features/tone/**` | `src/contracts/**`, `src/lib/ai/**` |
| A11y & Dark Mode | A8 | `src/theme/dark.ts`, `src/a11y/**` | `src/theme/**`, `src/components/ui/**`, `src/theme-dark.css` |
| Security | A9 | `src/lib/security/**`, `src/lib/storage/**` | everything |
| Integrator | A10 | `src/App.tsx`, `src/AuthGate.tsx`, `src/main.tsx`, `src/views/**`, `src/components/*.tsx` (wiring), `src/services/**`, `server/src/**` (route wiring), root config (`package.json`, `vite.config.ts`, `firestore.rules`, `firebase.json`) | everything |

Notes resolving spec-vs-repo conflicts:

- `app.html`/`index.html` fixes (theme-color, meta description, title dashes) belong to A2,
  not A1, so no file has two owners. A1 is components/styles only.
- Existing `src/views/**`/`src/components/*.tsx` are edited by A2 in Phase 1 (strings only)
  and A10 in Phase 4 (wiring). Phases are sequential, so still one writer at a time.
- Prompts exist twice (`shared/` and `server/src/shared/`). A4 owns BOTH and must keep them
  byte-identical. No other agent touches either.
- Orchestrator installs the test runner (vitest + jsdom + @testing-library/react) on main
  during Phase 0, acting for A10 on `package.json`, because Phases 1–3 gates require tests.
- Each feature agent ships a `WIRING.md` inside its territory: exact imports A10 must make
  and which screen each surface attaches to. A10 wires; feature agents never do.

Phases (agents inside a phase run in parallel, in separate git worktrees/branches):

```
PHASE 0  A0 alone (main tree)          gate: tsc --noEmit clean, zero `any` in contracts
PHASE 1  A1, A2                        gate: ui components render both themes; dash-grep empty
PHASE 2  A3, A4, A5, A6, A7            gate: index.ts exports, tests pass, no shared-file edits
PHASE 3  A8, A9                        gate: contrast passes programmatically; secrets-grep empty
PHASE 4  A10 alone (main tree)         gate: build green, tests pass, smoke both themes 390x844
```

Branch naming: `agent/a<N>-<slug>`. Orchestrator merges with `--no-ff` in manifest order.
A merge conflict is a manifest bug: fix the manifest, re-run the phase.
