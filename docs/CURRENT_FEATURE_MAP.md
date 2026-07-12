# Current Feature Map

| Area | Entry files | State |
| --- | --- | --- |
| Authentication | `src/AuthGate.tsx`, `src/views/Auth.tsx`, `src/lib/firebase.ts`, `src/lib/nativeAuth.ts` | Functional with Firebase configuration; preview has isolated simulated identity |
| Onboarding | `src/components/WelcomeSurvey.tsx`, `src/services/userService.ts` | Functional and persisted; visual flow is denser than approved design |
| Home | `src/views/Dashboard.tsx` | Functional metrics from cases; lacks swipe/expand command-center behavior |
| Appeal list/start | `src/views/Appeals.tsx` | Functional |
| Upload/import | `src/views/UploadCenter.tsx`, `src/services/documentStorageService.ts` | Manual upload functional; provider import requires server/provider configuration |
| Annotation review | `src/views/AnnotatedExamReview.tsx`, `src/views/PaperView.tsx` | Page-aware evidence viewing and zoom work; drawing/highlight/type persistence is missing |
| Evidence/verdict/draft | `EvidenceSummary.tsx`, `VerdictReport.tsx`, `AppealDraftPanel.tsx` | Functional with analyzed case data; never auto-sends |
| Review/Study | `StudyPrep.tsx`, `StudyReviewStudio.tsx` | Functional evidence-derived plan; contextual viewer needs expansion |
| History | `History.tsx`, `AppealCard.tsx` | Functional search/filter/reopen/delete; timeline/outcome model is limited |
| Mr. Whale | `Advocate.tsx`, `CoachComposer.tsx`, `ChatMarkdown.tsx` | Multi-agent UI and case-aware prompts exist; messages are not a persisted server conversation history |
| Profile/Settings | `Profile.tsx`, `ThemePicker.tsx`, `ConnectScreen.tsx` | Broad functionality exists in one very large component; needs compact structure |
| Notifications | `NotificationQuickToggle.tsx`, `notificationService.ts` | Permission/preferences/local delivery work; full inbox and remote push are incomplete |
| Connectors | `features/connect/*`, server `connections.ts` | Encrypted connection store and selected live flows exist; most registry entries need configuration/are coming soon |
| Auto Mode | `automationService.ts`, server `automation.ts`, `connectorImports.ts` | Preference and scheduled detection exist; full AI pipeline incomplete |
| Subscription | `subscriptionService.ts`, `storePurchaseService.ts`, server `billing.ts` | Connected but requires RevenueCat/store/Stripe configuration and sandbox testing |
| Parent mode | `SupervisorHub.tsx`, `LearnerPairingPanel.tsx`, server `family.ts` | API architecture exists; preview is synthetic; real two-account QA required |
| Legal/deletion | `About.tsx`, `DeleteAccountDialog.tsx`, `accountService.ts`, server `accountDeletion.ts` | Functional when API is deployed |
