# Light-mode system

- `ThemeProvider` exposes only `light`.
- Legacy stored values (`dark`, `system`) resolve to light.
- App chrome no longer renders a theme toggle.
- Profile no longer renders Appearance controls.
- `index.html` declares a light color scheme before React starts.
- `theme-dark.css` is not imported into the production application.

Some dormant dark selectors remain in source CSS for later cleanup, but no production UI can activate them. `scripts/check-release-contracts.mjs` guards this decision.
