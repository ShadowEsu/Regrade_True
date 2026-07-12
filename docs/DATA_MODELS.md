# Data Models

Core client models are `UserProfile`, `Case`, `AnalysisResult`, `StoredConnection`, `SubscriptionSnapshot`, `FamilyLink`, `ExamAnnotation`, and `RegradeNotification`. Coordinates and paths are normalized 0–1 so zoom and resizing do not alter alignment. Notification `groupKey` creates deterministic IDs to prevent duplicate inbox spam. Automation imports/jobs use explicit incomplete states rather than inferred completion.
