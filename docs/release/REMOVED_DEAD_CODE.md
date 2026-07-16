# Removed or isolated dead/demo code

## This pass

- Removed the Vite-defined `VITE_PREVIEW_MODE` switch and the `dev:preview` command.
- Removed synthetic authentication, cases, learner links, connectors, billing, AI results, notification state, and account actions.
- Real document previews remain: they show only files the signed-in user selected or owns.
- Centralized connector release truth in `getConnectorReleaseStatus`; removed duplicated UI inference that called institution integrations “Coming soon” and API records “Direct connection.”
- Right-sized oversized Canvas and Regrade wordmark raster assets, saving about 653 KB in public/native web assets.

## Retained intentionally

No executable preview fixtures or preview-only components remain in the client.

Legacy public assets with zero code references were not deleted because they need a final visual/marketing regression and binary deletion should be isolated. They are listed in `SIZE_OPTIMIZATION_REPORT.md`.

## Earlier repository cleanup in the same working tree

Documentation was reorganized under `docs/{release,planning,training,integrations,legal,security,internal}`, root setup notes were consolidated, build/temp output was ignored, secret scanning was hardened and server guard tests were added. Review the full Git diff before committing because the working tree contains that prior pass too.
