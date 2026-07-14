# CURRENT STATE — Regrade repo (Session 1 Discovery, 2026-07-09)

## Tech stack

- Vite 6 (two HTML entries: `index.html` marketing landing, `app.html` SPA shell)
- React 19 + TypeScript 5.8, no router library (view switching via state in `src/App.tsx`)
- Tailwind CSS 4 via `@tailwindcss/vite`, plus large hand-written CSS (`src/index.css` 1069 lines, `src/theme-dark.css` 746 lines)
- `motion` (animations), `lucide-react` (icons), `dompurify`
- Firebase client SDK (Auth + Firestore), Firebase Hosting (`regrade-75d1a`)
- Capacitor 7 shells for iOS (`ios/`) and Android (`android/`)
- Express API server in `server/` (listens on 127.0.0.1:8787; Vite dev proxies `/api` → it)
- No test runner installed. Zero test files anywhere.

## File tree (depth 3, source only)

```
index.html            marketing landing (large, inline styles/scripts, em dashes)
app.html              SPA entry (theme-color #dce8ff defect at line 6, em dash meta at line 26)
capacitor.config.ts   native shell config
firebase.json / firestore.rules / firebase-blueprint.json
public/               favicon, logos, coach-whale.png, regrade.css, platforms/, gradescope/, legal/
                      NO manifest.json exists (nothing to audit; PWA manifest absent)
shared/               AI system prompts (single source)
  advocateSystemPrompt.ts, analyticalSystemPrompt.ts, extractionSystemPrompt.ts,
  gradeExtractionAudit.ts, platformReadingGuide.ts, reasoningSystemPrompt.ts
server/src/
  index.ts            Express app; routes: GET /health, DELETE /v1/account, POST /v1/feedback
  regradeGemini.ts    (651 ln) router: POST /analyze, POST /advocate, POST /security-scan
  anthropicClient.ts  Claude client        env.ts, firebaseAdmin.ts, accountDeletion.ts
  http/               errors.ts, respond.ts
  middleware/         auth, firebaseAuth, heavyAiRateLimit, rateLimit, requestId,
                      requireAiConsent, validate
  security/           inputGuards.ts
  shared/             mirror copy of /shared prompts (verified IN SYNC as of this doc;
                      must stay in sync — see memory note)
src/
  App.tsx (148)       state-based view switch; preview-mode aware
  AuthGate.tsx, main.tsx, branding.ts, constants.ts, version.ts
  types.ts (151)      EXISTING CONTRACTS: AnalysisResult, CaseAnalysis, Question,
                      TeacherProfile, FairnessReview, AiNotes, SourcePlatform (21 platforms),
                      AiEngine ('hybrid'|'gemini'|'claude')
  index.css, theme-dark.css   dark mode EXISTS already (ThemeContext + theme-dark.css)
  context/            ThemeContext.tsx (only context; no redux/zustand)
  views/              Dashboard, Appeals, UploadCenter (741), EvidenceSummary, VerdictReport,
                      Profile (807), History, Advocate (Mr Whale chat), About, Auth
  components/         ~30 components: Layout, BottomNavIcons, AppealFlowShell/Steps,
                      AppealDraftPanel, AiPipelinePanel, AiEnginePicker, CoachWhale,
                      CoachComposer, BrandSpinner, PlatformRow, Logo, etc.
  lib/                api.ts (fetch wrapper → /api), gemini.ts (client AI path),
                      appealDraft.ts, appealHelpers.ts, imagePrep.ts, pdfPageImages.ts,
                      pdfText.ts, platformUploadGuides.ts, profileContext.ts, sanitize.ts,
                      securityScanner.ts, theme.ts, uploadLimits.ts, firebase.ts, nativeAuth.ts
  services/           caseService.ts, userService.ts, accountService.ts (Firestore CRUD)
  marketing/          waitlist.ts
scripts/              deploy + prepare-capacitor.mjs
```

## Where things live

- **Screens**: `src/views/*.tsx`, switched in `src/App.tsx` (no URL routing inside the app).
- **Copy strings**: inline literals in views/components. No copy module. 108 em/en-dash
  occurrences in `src/`, plus `index.html` title + `app.html` meta description.
- **AI calls**: client → `src/lib/api.ts` → Express `server/src/regradeGemini.ts`
  (`/analyze` = hybrid Gemini extraction + Claude reasoning; `/advocate` = chat;
  `/security-scan`). Client-side `src/lib/gemini.ts` also exists. Prompts in `shared/`,
  duplicated to `server/src/shared/` (in sync).
- **State management**: React local state + ThemeContext. Persistence via Firestore services.
- **Runtime behavior**: development and production use the same real service paths.
  Missing credentials return setup or unavailable states rather than demo data.
- **Security already present**: rate limiters (ip/user/heavy-AI/chat/scan), zod-style
  validate middleware, requireAiConsent, input guards, dompurify sanitize, firestore.rules.
- **Tests**: none.

## Verified defects (spec §5.1 cross-checked against repo)

1. `app.html:6` — `<meta name="theme-color" content="#dce8ff" />` (off-palette). CONFIRMED.
   An inline script at app.html:16 also mutates theme-color at runtime — must update both.
2. `app.html:26` — meta description contains an em dash. CONFIRMED.
   `index.html:6` title also contains an em dash.
3. `public/manifest.json` — DOES NOT EXIST. Spec item is moot unless a manifest is added.

## Violation counts (baseline for gates)

- Hardcoded hex outside theme files in `src/`: 50 occurrences
- `#fff|#FFFFFF|white` in `src/`: 34 occurrences
- Em/en dashes in `src/`: 108 occurrences (plus index.html/app.html)
- Secrets grep (`sk-|api[_-]key\s*=|Bearer `): not yet audited — Phase 3 (A9)

## Deltas between spec assumptions and reality (Session 2 must resolve)

- No `/src/contracts`, `/src/theme`, `/src/copy`, `/src/features`, `/src/components/ui`,
  `/src/a11y`, `/src/lib/ai`, `/src/lib/security`, `/src/lib/storage` directories yet.
  All are green-field; territories can be created without touching existing dirs.
- `src/types.ts` already defines a rich AnalysisResult that OVERLAPS but does not match
  spec §4 contracts (snake_case, different platform list, different case-strength enum).
  A0 must define spec contracts alongside and provide adapters, not break existing pipeline.
- Dark mode already ships (ThemeContext + theme-dark.css); A8 hardens rather than creates.
- Navigation is Layout.tsx + BottomNavIcons.tsx, owned today by no one; assign to A10.
- Server already enforces rate limits/validation; A3's appeal rate-limit (3/course/term)
  is new and belongs server-side per spec.
- Port 3000 is the dev port and is often already taken on this machine (memory note).
- `shared/` ↔ `server/src/shared/` prompt duplication must stay in sync; any agent editing
  prompts must edit both (or better: only A4 touches them, syncing both copies).
