# Backend Integration Plan

Completed in this pass: persisted notification inbox model, normalized persisted annotation model, recursive annotation deletion, explicit automation-job/import states, notification deep links to specific cases, and UI calls that record real analysis/appeal-ready events.

Next backend slice: server-owned notification creation, durable Auto Mode worker with leases/idempotency/retry, provider document download, appeal/history event collection, persistent Mr Whale conversation threads, and usage metering attached to billing periods. Each schema change receives validation, owner rules, emulator tests, and deletion coverage before UI is labeled functional.
