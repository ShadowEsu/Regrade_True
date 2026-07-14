# Mock vs Real Features

| Feature | State |
| --- | --- |
| Firebase Auth/profile/onboarding/cases/storage | Functional when configured |
| Manual AI analysis and draft | Functional when API/Gemini configured |
| Exam annotations | Functional persistence added; emulator/real-device QA required |
| Notification inbox/local delivery | Functional persistence added; remote APNs/FCM not implemented |
| Canvas/Classroom grade metadata | Connected but requires provider setup; marked document may be missing |
| Drive/Dropbox/OneDrive listing | Connected but requires provider setup and user file selection |
| Full Auto Mode AI pipeline | Incomplete; import job stops honestly when returned evidence is missing |
| Subscription | Connected but requires store/RevenueCat products and sandbox QA |
| Parent API | Connected but requires deployed API and two-account QA |
| Preview fixtures | Mocked and visibly isolated |
| Remaining connectors | Coming soon or Needs setup |
