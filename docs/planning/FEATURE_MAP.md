# Regrade Feature Map

This map records the implemented product surface before the Regrade 2.0 visual refactor.

## Entry, identity, and onboarding

| Feature | Primary implementation | Data / dependency | Current state |
| --- | --- | --- | --- |
| Boot splash | `BootSplash`, `AuthGate` | Local app state | Implemented |
| Sign in | `views/Auth.tsx` | Firebase Auth | Email, Google, Apple |
| Sign up / reset | `views/Auth.tsx` | Firebase Auth | Implemented |
| Email verification | `VerifyEmailPrompt` | Firebase Auth | Implemented |
| Welcome survey | `WelcomeSurvey` | `userService` | Role, name, institution, connector |
| Product tutorial | `ProductTutorial` | Profile completion + local state | Ten guided steps |
| Preview routes | `previewMode`, `PreviewBanner` | Local fixtures | Sign-in, onboarding, supervisor |

## Primary navigation

| Destination | View | Purpose | Key actions |
| --- | --- | --- | --- |
| Home | `Dashboard` | Personalized launch point | Start review, ask Mr Whale, open connectors, Review, sample verdict |
| Appeal | `Appeals`, then appeal views | Examine grading with evidence | Upload, annotate, summarize, verdict, draft, learning handoff |
| Coach | `Advocate` | Multi-session AI assistant | New/rename agent, attach, prompts, send, report response |
| Review | `StudyPrep`, `StudyReviewStudio` | Exam-only personal learning system | Search/filter exams, inspect patterns, check off tasks, ask AI |
| History | `History` | Saved appeal record | Search, filter, grouped dates, preview paper, continue appeal |

## Appeal workflow

| Stage | View / component | Output |
| --- | --- | --- |
| Entry | `Appeals` | Clear start action or resumable case |
| Evidence collection | `UploadCenter`, upload guides | Marked PDF/images, rubric, feedback, platform context |
| AI analysis | `AiPipelinePanel`, API `/v1/gemini/analyze` | Structured assignment, questions, teacher feedback, uncertainties, case analysis |
| Annotation review | `AnnotatedExamReview`, `PaperView` | Original paper plus evidence-honest annotation rail |
| Findings | `EvidenceSummary` | Visible evidence, possible inconsistency, limitations |
| Verdict and draft | `VerdictReport`, `AppealDraftPanel` | Strength rating, teacher-style analysis, editable respectful appeal |
| Learning handoff | `AppealLearningHandoff` | Review actions derived from the same exam evidence |

## AI and academic rendering

- Gemini multimodal exam analysis and Mr Whale chat.
- Platform-specific reading guidance for LMS and manual documents.
- Deterministic arithmetic, rubric, and unexplained-deduction audit.
- Handwriting/image/PDF input.
- KaTeX and chemistry notation rendering.
- Safe bounded chart/image output in chat.
- Evidence confidence and uncertainty language.
- Response reporting and usage counting.

## Review

- Only previously analyzed exams qualify.
- Starts empty until marked-exam evidence exists.
- Search and course/status filters for larger libraries.
- Exam cards show subject, title, score, date, and AI status.
- Recurring issue detection from questions, rubric items, deductions, and teacher comments.
- Persistent check-off learning actions stored with the user/case data.
- Mr Whale contextual help in the review studio.

## Supervisor mode

- Student or supervisor role selected during onboarding.
- Student generates a short-lived pairing code.
- Supervisor redeems the code; learner approves before sharing.
- Supervisor sees only consented/shared cases.
- Evidence-backed learner focus areas and assessments worth reviewing.
- Supervisor can prepare a teacher email or send a suggestion to the learner.
- Learner remains final approver; supervisor cannot change a grade or silently send an appeal.
- Links can be revoked by either side.

## Connections and imports

- One searchable `PLATFORM_LIBRARY` contains 38 platform/source entries and country aliases.
- Featured examples are Google Classroom, Canvas, and Moodle.
- Direct/import-capable adapters currently exist for Canvas, Google Classroom, Google Drive, Dropbox, and OneDrive.
- Other entries clearly fall back to manual upload or institution-gated setup.
- Automatic import only considers newly graded work from the previous seven days.
- Manual browsing can select older work.
- Search, connection status, connect/disconnect, browse, and manual-upload actions live in Profile.

## Profile, settings, and subscriptions

| Section | Contents |
| --- | --- |
| My Profile | Name, email, school, role/personalization context |
| Connections | Searchable platform library and connection management |
| Plan & Usage | Free/Student/Pro plans, renewal/reset date, exam and message counters, purchase/manage/restore |
| Mr Whale & Alerts | AI consent/context controls, automation, notification preferences |
| Settings & Account | Theme, legal links, support, family pairing, sign-out, permanent deletion |

Plans are enforced server-side. The client supports RevenueCat purchases on iOS/Android and a web billing path. Current plan limits are Free: 3 exams and 25 messages; Student: 10 exams and 50 messages; Pro: 20 exams and 100 messages. Paid tiers include Auto Mode.

## Notifications and automation

- Top-bar notification quick control.
- User notification preferences and local notification permission flow.
- Auto Mode preference separate from entitlement.
- Server-side import job, seven-day policy, analysis scheduling, case/history creation, and alert generation.
- Unread counters for Coach, Review, and History.
- True background APNs/FCM delivery remains external production configuration.

## Legal and production surfaces

- Privacy Policy, Terms of Service, EULA, deletion instructions, and support address.
- iOS privacy manifest and native entitlements.
- Android manifest and ProGuard configuration.
- Store submission and IAP setup documents.
- Production readiness report identifies remaining owner-controlled deployment steps.

