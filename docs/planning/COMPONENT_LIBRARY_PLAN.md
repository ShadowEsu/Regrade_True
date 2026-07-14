# Component Library Plan

Build reusable primitives under `src/components/mobile` and token/motion helpers under `src/theme`:

1. `MobilePage`, `MobileHeader`, `BottomTabBar`
2. `SurfaceCard`, `MetricCard`, `AttentionCard`, `ExamCard`
3. `StatusBadge`, `FilterChip`, `SearchField`
4. `PrimaryButton`, `QuietButton`, `IconButton`
5. `ProgressStepper`, `CountUpValue`, `ActivityGrid`
6. `BottomSheet`, `Toast`, `SkeletonRows`, `EmptyState`
7. `SettingsGroup`, `SettingsRow`, `ToggleRow`
8. `ConnectorCard`, `SyncRing`, `NotificationRow`
9. `EvidenceMarker`, `EvidenceDrawer`, `ContextualWhale`

Screens should compose these components and retain service calls outside presentation primitives.
