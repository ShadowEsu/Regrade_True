# BUILD_PLAN.md — Regrade multi-agent build (Session 2 output)

Read with AGENTS.lock.md. Each Phase-2 agent receives ONLY its own section plus
`src/contracts/index.ts`. Voice laws bind everyone: no em/en dashes anywhere, no hardcoded
hex outside `src/theme/`, no `#FFFFFF`/`white`, warm plain-English copy via `t('key')`.

## Phase 0 — A0 Architect (main tree, alone)

Create:

1. `src/theme/tokens.ts` — exactly the spec palette/fonts/space/radius:
   navy #0A1F44, navyRaised #1B3464, navyDark #060F22, cyan #4FA8E0, cyanBright #7DD3FC,
   cream #F8F5EE, creamRaised #EFEAE0, border #E8E2D6, muted #6B7280, coral #E27D6B,
   green #4ADE80, gold #F59E0B; fonts Playfair Display / Inter / JetBrains Mono;
   space [4,8,12,16,20,24,32,40,48,64,80,96]; radius {sm:8,md:12,lg:16,card:20,pill:9999}.
   Also export `cssVar` name map so components can reference CSS custom properties.

2. `src/contracts/index.ts` — spec §4 verbatim (DeductionCause, AppealStrength,
   RubricFinding, MissingArtifact, AnalysisResult AS `AppealAnalysis` to avoid clashing
   with legacy `src/types.ts` AnalysisResult, LmsPlatform, SendGateResult, AppealRecord,
   ProfessorToneProfile, HouseholdLink) PLUS the referenced-but-undefined types:

   - `PrepSheet { questions: [string, string, string]; basedOnFindingIds: string[] }`
   - `TransparencyReport { term: string; rows: { courseId: string; assignmentId: string; pointsLost: number; hadExplanation: boolean }[] }`
   - `Deadline { deadlineAt: string | null; daysRemaining: number | null; policySource: 'seeded' | 'unknown_school_default'; warnLevel: 'none' | 'half' | 'eighty' }`
   - `GpaDelta { courseGradeBefore: number; courseGradeAfter: number; gpaBefore: number; gpaAfter: number }`
   - `TermId = string` (e.g. "2026-fall"), `CourseLoad = { courseId: string; credits: number; currentPercent: number }[]`

3. `src/contracts/adapters.ts` — pure functions bridging the legacy pipeline
   (`src/types.ts`, snake_case) into the new contracts:
   - `fromLegacyAnalysis(legacy: LegacyAnalysisResult): AppealAnalysis` — maps
     unexplained_deductions → cause 'unexplained_deduction', potential_calculation_errors →
     'arithmetic_error', case strength ('no_case'→'none'), platform names
     (brightspace→'d2l', teams→'teams_edu', powerschool/sakai/etc→'unknown'), confidence.
   - `toAppealStrength(s: 'strong'|'moderate'|'weak'|'no_case'): AppealStrength`
   No `any`, no `unknown` without a guard. Legacy types imported as type-only.

Orchestrator (same phase, for A10): add devDeps vitest, jsdom, @testing-library/react,
@testing-library/jest-dom; `vitest.config.ts` (jsdom, globals). Script: `"test": "vitest run"`.

Gate: `npx tsc -p tsconfig.app.json --noEmit` clean; `grep -n "\bany\b" src/contracts/*.ts` empty;
`npm test` runs (0 tests ok).

## Phase 1 — A1 Design System, A2 Copy (parallel worktrees)

### A1 — `src/components/ui/**`, `src/styles/**`

All components: React 19 + TS function components, Tailwind arbitrary values using ONLY
`src/theme/tokens.ts` imports (no hex literals), dark-mode aware via existing `.theme-dark`
root class (read `src/theme-dark.css` to see the convention). Files:

- `Button.tsx` (primary navy/cream, secondary cream/navy 1.5px border, ghost cyan text,
  destructive coral; h-52px radius pill; states default/pressed/loading/disabled)
- `Input.tsx` (h-52, radius md, floating label, 2px cyan focus ring, coral error)
- `PillTag.tsx` (variants cyan/coral/green/gold/neutral, semantic)
- `Card.tsx` (radius 20, 1px hairline border, variants default/pressable/highlighted
  3px cyan left border; no drop shadows)
- `AppBar.tsx` (wordmark+avatar | back+title | close+title)
- `UploadZone.tsx` (dashed border, cyan dashed + faint cyan tint on drag-over)
- `RubricRow.tsx` (collapsed: question + PillTag; expanded: evidence, rubricCitation,
  teacherQuote, low-confidence warning when confidence < 0.7; props typed from contracts)
- `StepIndicator.tsx` (3 steps: active filled cyan, complete navy+check, upcoming cream+muted)
- `StreamingText.tsx` (char-by-char with blinking cyan caret; instant when
  prefers-reduced-motion; must not trap screen readers: aria-live polite on completed text)
- `AnalysisAnimation.tsx` (three paper cards fade in, cyan line draws between, then
  StreamingText final line; reduced-motion renders end state)
- `BottomNav.tsx` (Home, Appeal, Chat, History, Profile; active = navy icon + 4px cyan dot)
- `Gallery.tsx` (dev harness rendering every component in all states, both themes)
- `index.ts` exporting all. Tests: render each component in both themes (vitest).
  Worktree has no node_modules: `ln -s <main>/node_modules node_modules` first.

### A2 — `src/copy/**` + root html + string sweep

1. `src/copy/en.ts` flat keyed object; `src/copy/index.ts` with `t(key)` (typed keys,
   template params via `t(key, {name})`). Structure so a second locale is a file drop.
2. Inventory literals: `grep -rn "\"[A-Z][a-z ]\{4,\}\"" src --include='*.tsx'`, plus all
   108 dash occurrences. Replace user-facing literals in `src/views/**`, `src/components/*.tsx`
   with `t()` keys. TEXT-ONLY edits; never touch logic/JSX structure.
3. Required voice rewrites (spec §6.2 table) + gate copy keys:
   `gate.fairGrade` = "Not this one." + body per spec §6.3; `gate.threeDenied` nudge.
4. Fix `app.html:6` theme-color → #0A1F44 (and the runtime script at ~line 16 that mutates
   it), `app.html:26` meta description → "Regrade reads your graded work, checks it against
   the rubric, and drafts a professional appeal in 60 seconds.", `index.html:6` title →
   "Regrade. Appeal an unfair grade in sixty seconds." Purge every em/en dash in both files
   (index.html placeholder "—" glyphs may become "–"? NO: use "..." or empty; no dashes).
5. Gate: `grep -rn "—\|–" src index.html app.html` empty; tsc clean.

## Phase 2 — Feature agents (parallel worktrees, each + tests + WIRING.md + index.ts)

### A3 — `src/features/integrity/**`

- `sendGate.ts`: `evaluateSendGate(analysis: AppealAnalysis, history: AppealRecord[]): SendGateResult`.
  Blocks when caseStrength none|weak (no override path). Reason strings come from copy keys.
- `consolidate.ts`: `consolidateFindings(findings, courseId, assignmentId): AppealRecord`
  (one record per assignment; findingIds array).
- `rateLimit.ts`: `checkRateLimit(courseId: string, termId: TermId, history: AppealRecord[]): SendGateResult`
  — max 3 sent per course per term, warn at 2. Pure function over history; persistence note
  in WIRING.md: counter derives from Firestore appeal records (server-verifiable), plus a
  `firestore.rules.snippet.md` for A10 with a rule limiting appeal-record creation.
- `nudge.ts`: last three sent appeals all denied → return nudge copy key before drafting.
- NO send/smtp/mailto-auto anything. `generateDraft` lives in A7; integrity only gates.

### A4 — `src/features/analysis/**`, `src/lib/ai/**`, `shared/**`(+mirror)

- `classify.ts`: `classifyFindings(legacy: LegacyAnalysisResult): RubricFinding[]` — every
  lost point gets exactly one DeductionCause, evidence + rubricCitation|teacherQuote
  populated from rubric_items_applied / professor_comments; confidence propagated;
  <0.7 flagged.
- `missing.ts`: `detectMissing(input): MissingArtifact[]` — rubric, comments, prompt,
  original work, grade-post date; `howToGet` strings name the exact LMS screen (use
  `src/lib/platformUploadGuides.ts` as reference, read-only).
- `imageQuality.ts`: blur/glare/rotation/crop heuristics over existing
  `confidence.requires_retake` + per-page metadata; returns specific re-upload guidance.
- `src/lib/ai/circuitTypes.ts`: interface consumed by A9's breaker.
- Prompt deepening in `shared/reasoningSystemPrompt.ts` + `shared/analyticalSystemPrompt.ts`:
  reconstruct-before-judging instructions (redo math, trace code, identify thesis),
  mandatory rubric citation for any unfairness claim, hard refusals (no fabrication,
  no ghostwriting, no dishonesty). Copy byte-identical into `server/src/shared/`.

### A5 — `src/features/parent/**`

- `household.ts`: `linkHousehold(parentAccountId, studentAccountId, educationLevel)` —
  throws unless 'k12' (type-level + runtime). Dedup: `assertSingleAppeal(householdId,
  assignmentId, existing)`; WIRING.md notes Firestore unique key `(householdId, assignmentId)`.
- `prepSheet.ts`: `getConferencePrep(analysis: AppealAnalysis): PrepSheet` — three specific
  questions derived from actual findings (cause-specific templates).
- `termReport.ts`: `getTermlyReport(records, findingsByAssignment): TransparencyReport`.

### A6 — `src/features/tracker/**`

- `tracker.ts` FIRST: `logOutcome(record, status, pointsRecovered)` lifecycle transitions
  (drafted→sent→awaiting_response→granted|partial|denied|abandoned) with validation.
- `deadlines.ts`: seeded per-institution policy table (10/15/30 calendar days + 5 business
  days variants), `getDeadline(record, institution?): Deadline`, warn at 50% and 80%,
  graceful unknown-school default (14 days, flagged 'unknown_school_default').
- `gpa.ts`: `computeGpaImpact(analysis, courseLoad): GpaDelta` (4.0 scale, standard cutoffs).
- `RecoveredCounter.tsx`: animates 0→N with soft cyan glow (tokens only), confetti trigger
  predicate `shouldCelebrate(history): 'first_win'|'25_points'|'fifth_appeal'|null`;
  respects prefers-reduced-motion.

### A7 — `src/features/tone/**`

- `learnTone.ts`: `learnTone(emails: string[]): ProfessorToneProfile` — formality
  (first name vs title), avg reply length, sign-off extraction; professorId = SHA-256 hash
  (Web Crypto), never plaintext; derived profile only, source emails never stored.
- `draftAppeal.ts`: `draftAppeal(record, profile, findings): string` — calm, specific,
  evidence-based, quotes rubric by name, requests review never demands, 120–200 words,
  mirrors formality/sign-off. Pure string return. NO send function.
- `privacy.ts`: `forgetProfessor(professorId)` deletion contract.

## Phase 3 — A8, A9 (parallel worktrees)

### A8 — `src/theme/dark.ts`, `src/a11y/**`

- `dark.ts`: dark token set (base #060F22, raised navyRaised, text #F5F1EA; cyan/coral/gold
  unchanged) exported in the same shape as tokens.ts.
- `a11y/contrast.ts` + `a11y/contrast.test.ts`: WCAG relative-luminance math; tests assert
  every used fg/bg pair ≥ 4.5:1 body (3:1 large) in BOTH themes — programmatic, not by eye.
- `a11y/reducedMotion.ts` hook; `a11y/labels.md` audit of icon-only buttons (read-only
  audit list for A10); min target 44x44 documented per component.

### A9 — `src/lib/security/**`, `src/lib/storage/**`

- `security/circuitBreaker.ts`: wrap AI fetches (closed/open/half-open, timeout, fallback
  message key) implementing A4's `circuitTypes.ts`.
- `security/uploadPolicy.ts`: client mirror of server validation (type allowlist, size caps)
  — reads existing `src/lib/uploadLimits.ts` conventions (read-only), extends without moving.
- `storage/retention.ts`: auto-delete-after-analysis contract (`markEphemeral`,
  `purgeAnalyzed`), minimize-what-is-stored helpers; no PII in URLs helper
  (`assertNoSensitiveParams(url)`).
- Audit: secrets grep, URL-param audit across src (report in `security/AUDIT.md`).

## Phase 4 — A10 Integrator (main tree, alone)

1. Merge order: a1, a2 | a3, a4, a5, a6, a7 | a8, a9 (phases already merged sequentially).
2. Wire per each feature's WIRING.md. Minimum viable wiring:
   - Send gate + nudge + rate limit around draft generation in the appeal flow
     (`AppealDraftPanel` / `appealDraft.ts` call sites), gate copy rendered when blocked.
   - `classifyFindings` + `detectMissing` results into `VerdictReport` via RubricRow.
   - Deadline radar chip on Dashboard/Appeals; tracker statuses in History with
     `logOutcome`; RecoveredCounter on a won appeal.
   - Parent mode entry in Profile (K-12 gate); tone learning + draftAppeal into the
     draft step.
   - BottomNav/AppBar/Button/Card swaps where drop-in; component gallery stays test-only.
3. `firestore.rules` merge from A3 snippet. Root config: keep vitest wiring.
4. Final gates (all must pass):
   - `grep -rn "#[0-9A-Fa-f]\{6\}" src --exclude-dir=theme` → empty
   - `grep -rni "#fff\b\|#ffffff\|'white'\|\"white\"" src index.html app.html` → empty (comments exempt)
   - `grep -rn "—\|–" src index.html app.html` → empty
   - `grep -rn "sk-\|api[_-]key\s*=\|Bearer " src` → empty
   - `grep -rn "function send\|sendMail\|smtp\|nodemailer" src server/src` → empty
   - `npx tsc -p tsconfig.app.json --noEmit` | `npm test` | `npm run build` all green
5. Smoke every authenticated view at 390x844 using a dedicated Firebase test account
   and non-production test project; never substitute synthetic application data.
