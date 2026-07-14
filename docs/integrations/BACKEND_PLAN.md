# Backend Plan

Preserve existing Auth, Firestore, Storage, AI, connector, billing, family, and deletion services. Add bounded persisted models for annotations, notification inbox events, appeal/history events, and Auto Mode jobs. All records use owner IDs, server timestamps, idempotency keys, and explicit statuses. Extend Firebase rules and server contracts before exposing UI as functional. Development uses the same real service paths as production. Provider credentials, AI keys, RevenueCat secrets, pairing pepper, and notification credentials remain server-only.
