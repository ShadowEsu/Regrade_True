# Responsive QA matrix

| Surface | Automated build | Manual visual QA |
| --- | --- | --- |
| 320×568 / 360×800 | CSS compiles | Required |
| 390×844 / 414×896 | iOS 17 Pro-class launch verified | Remaining screens required |
| 768×1024 / 1024×768 | CSS compiles | Required on tablet |
| 1280×800 / 1440×900 / 1728×1117 | Electron/web builds pass | Required on macOS and Windows |

Acceptance: no horizontal overflow, clipped controls, hover-only actions, obscured safe areas, or inaccessible modals. This matrix is not marked complete until device screenshots and interaction notes exist for every core screen.
