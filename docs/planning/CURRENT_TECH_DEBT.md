# Current Technical Debt

1. `Profile.tsx`, `UploadCenter.tsx`, and `index.css` are too large and combine unrelated responsibilities.
2. Navigation is string/state based rather than URL-addressable routing, limiting deep links and back-stack fidelity.
3. Preview and real branches are mixed inside several services/views; isolation is safe but increases component complexity.
4. Cases currently carry analysis, raw inputs, draft, and document URLs in one broad record; annotations, notification events, history events, and conversations need separate bounded models.
5. Auto Mode has preference/detection/import pieces without a durable, idempotent job-state machine.
6. The notification system lacks persisted inbox records, remote delivery, read/archive state, and specific exam deep links for grouped events.
7. Annotation coordinates, normalized transforms, rotation, undo/redo, and cross-device persistence are not modeled.
8. Connector capabilities are broader than real provider implementations; registry state must remain explicit.
9. Firebase rules have no emulator test suite in the current client test command.
10. The Firebase bundle remains about 520 KB minified; further modularization/profiling is needed.
11. Android release compilation depends on a local Java/signing setup that has not been completed on this machine.
12. There is no production analytics/error-monitoring redaction verification.
