# Size optimization report

Measured 12 July 2026 on macOS. Build sizes are local artifacts, not App Store/Play download sizes.

## Results

| Measure | Before | After | Change / caveat |
|---|---:|---:|---|
| Local workspace | ~706 MB | ~710 MB after native sync | Not app size: `node_modules` 512 MB + server dependencies 148 MB; synced native web copies add ~14 MB |
| Git object database | ~12 MB (`8.19 MiB` loose + pack metadata) | ~12 MB | Documentation is uncommitted; Git history rewrite still required before public publish |
| Current tracked/unignored working content | Not captured before this pass | ~5.4 MB | Excludes ignored dependencies/build output |
| Web `dist` | ~6.7 MB | 6.1 MB | ~0.6 MB reduction from right-sizing two raster assets |
| Public assets | ~2.0 MB calculated | 1,354,379 bytes (~1.29 MiB) | Canvas mark 506,836→39,359 B; Regrade wordmark 313,364→127,867 B |
| Bundled fonts | ~1.1 MB | 1,072,948 bytes | KaTeX includes multiple formats; future safe optimization needs equation regression tests |
| iOS Release simulator `.app` | Not previously measured | 33 MB | Universal simulator binary; RevenueCat framework ~21 MB. Not a signed device archive/IPA |
| Android APK/AAB | Not measured | Not available | Java runtime is absent; no APK/AAB was built |

## Largest production web files

| File/chunk | Minified size | Gzip where reported |
|---|---:|---:|
| PDF.js worker `.mjs` | 1,375.84 KB | N/A |
| Firebase chunk | 519.62 KB | 121.15 KB |
| PDF.js worker `.js` | 364.11 KB | 107.19 KB |
| ChatMarkdown/KaTeX | 299.19 KB | 87.08 KB |
| Main CSS | 196.69 KB | 31.99 KB |
| React | 193.81 KB | 60.47 KB |
| Motion | 129.02 KB | 42.29 KB |
| Main JS | 105.45 KB | 33.87 KB |

PDF, Firebase, chat/KaTeX, profile, study and route surfaces are already split into chunks. Source maps are not emitted by the release Vite build.

## Remaining safe opportunities

1. Remove confirmed-unused legacy public files (`coach-whale.png`, legacy logos/marketing tiles and two unused Gradescope guide screenshots) only after visual/browser regression; Capacitor currently copies them into each native app.
2. Replace KaTeX’s all-format font CSS with tested WOFF2-only declarations.
3. Confirm whether both PDF worker outputs are necessary for web/native targets before altering PDF.js bundling.
4. Measure a signed, thinned iOS archive and Android AAB with store tooling; simulator size is not comparable.
5. Consider R8/resource shrinking on Android only after Java 17+, signed release and plugin regression tests.

No dependency was removed merely to improve a number; every declared production dependency has an observed use or native build role.
