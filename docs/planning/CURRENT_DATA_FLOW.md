# Current Data Flow

## Authentication and onboarding

Firebase authenticates the user. `AuthGate` synchronizes basic identity to `users/{uid}` and reads `onboardingComplete`. `WelcomeSurvey` updates role, name, institution, preferred platform, notification choice, and completion through `userService`. All user-facing state follows authenticated, persisted service paths.

## Manual exam flow

The user selects PDF/images in `UploadCenter`. Client utilities extract PDF text and render page images. Page images upload to `users/{uid}/documents/{caseId}/pages/*`. The API sends assignment/rubric/feedback to Gemini, merges a deterministic grading audit, and returns structured evidence. `caseService` persists the case, raw input, analysis, page URLs, progress, and later draft. App state advances through annotation review, evidence summary, verdict/draft, and learning handoff. Review and History read the same case record.

## Connector flow

`ConnectScreen` uses a registry to describe capabilities and status. Provider grants go to the encrypted API connection store. Import requests list provider records, apply age/deduplication policy, and create user cases. Today this import path does not guarantee a complete AI analysis job.

## Parent flow

The learner creates a short-lived code. A supervisor redeems it, and the learner must approve before an active link exists. Shared-case endpoints verify the caller is the active linked supervisor and the case belongs to the learner. Suggestions are deduplicated and can be acknowledged by the learner.

## Subscription and deletion

Native purchases use RevenueCat SDK identifiers; the server verifies entitlements. Web billing uses Stripe only outside native IAP. Account deletion is coordinated by the server to remove Auth, user cases/profile, stored documents, connector grants, links, and codes.
