# Product data flow

> **DRAFT — REQUIRES PROFESSIONAL REVIEW. Not legal advice.**

Typical flow: authentication provider → Regrade profile → manual upload or authorized connector → encrypted transport → Firebase Storage/Firestore → authenticated Regrade API → configured AI provider for analysis → findings/annotations/draft saved to the owner-scoped case → optional user-confirmed external action.

Parent/teacher access is mediated by explicit learner links and scoped permissions. Billing entitlement is verified through the applicable store/RevenueCat path. Production endpoints, subprocessors, retention, and regional routing must be verified before publication.
