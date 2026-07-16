# Regrade application size report

Measured: 2026-07-16, after the light-only, entitlement, verification, and native-startup changes.

## What was measured

These measurements use production artifacts, not the source repository or `node_modules`.
Exact byte counts sum regular files recursively. Filesystem allocation is reported separately from
`du -sk` where useful.

| Artifact | Exact bytes | Approx. decimal MB | Measurement |
|---|---:|---:|---|
| Production web bundle (`dist`) | 5,878,515 | 5.88 MB | Sum of files after `npm run build` |
| JavaScript and module workers | 3,298,808 | 3.30 MB | All `.js` and `.mjs` in `dist/assets` |
| Font files | 1,072,948 | 1.07 MB | All `.ttf`, `.woff`, `.woff2`, and `.otf` in `dist` |
| Other static assets | 2,347,972 | 2.35 MB | Non-JS, non-CSS, non-HTML files in `dist` |
| Current unsigned simulator `.app` | 27,734,755 | 27.73 MB | Files in the iPhone 17 Pro simulator build |
| Unsigned device `.xcarchive` | 85,992,753 | 85.99 MB | Files in archive; 74,788 KiB allocated |
| Unsigned device `App.app` payload | 27,878,918 | 27.88 MB | Files in archived application; 22,804 KiB allocated |
| Compressed unsigned device app proxy | 9,464,103 | 9.46 MB | `ditto` ZIP of the unsigned archived `App.app` |

The archive is not the App Store download. It contains archive metadata and development artifacts.
The 9.46 MB ZIP is a compression proxy only, not an IPA and not an Apple thinning report.

## Store artifacts

| Requested result | Status |
|---|---|
| Exported IPA | Not available: the Mac reports `0 valid identities found`, and no distribution certificate/provisioning profile is configured. |
| Official App Store download estimate | Not available until a signed IPA is uploaded or Xcode produces an App Thinning Size Report. The 9,464,103-byte ZIP is only a local proxy. |
| Estimated installed iOS size | The measured unsigned device payload is 27,878,918 bytes. Signing, encryption, App Store processing, and device thinning will change the delivered size. |
| Android APK | Not available: no Java runtime is installed. |
| Android AAB | Not available: no Java runtime is installed. |
| Google Play download/installed estimate | Not reported without an APK/AAB; a fabricated estimate would not be reliable. |

To complete the missing measurements, install a Capacitor-compatible JDK and Android toolchain,
configure release signing, build both APK and AAB, then use `bundletool get-size total`. For iOS,
install an Apple Distribution identity and provisioning profile, export the archive, and capture the
App Thinning Size Report.

## Largest contributors in the unsigned iOS device app

| File | Bytes |
|---|---:|
| RevenueCat framework | 10,964,576 |
| Swift concurrency library | 7,741,808 |
| Capacitor framework | 1,470,080 |
| PDF.js module worker | 1,375,838 |
| Firebase web chunk | 519,623 |
| PurchasesHybridCommon framework | 425,840 |
| PDF.js JavaScript worker | 364,111 |
| Mr Whale pixel image | 306,945 |
| Chat/KaTeX renderer chunk | 299,192 |
| iOS asset catalog | 295,656 |

## Assessment

The measured 27.88 MB unsigned iOS application payload is reasonable for a Capacitor application
that includes RevenueCat, Firebase, PDF rendering, equation rendering, and offline visual assets.
The 85.99 MB archive must not be described as the user download size. Android size remains a release
blocker because no real Android artifact exists.

Optional future reductions, without removing features:

- load only the required KaTeX font formats instead of shipping every font variant;
- confirm whether both PDF worker formats are required by all targets;
- optimize the 306,945-byte and 226,786-byte Mr Whale rasters after visual regression testing;
- defer Firebase modules and the chat/equation renderer until first use;
- review RevenueCat/Swift binary stripping only through supported release settings.
