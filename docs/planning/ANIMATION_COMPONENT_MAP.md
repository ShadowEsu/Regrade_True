# Animation Component Map

| Experience | Implementation |
| --- | --- |
| Page/tab entry | `Layout.tsx` keyed motion container |
| Active tab | shared `nav-bubble` layout ID |
| Home metrics | `CountUpValue` |
| Home sections | `Reveal` |
| Attention/recent work | snap `HorizontalScroller`, press-scale `SurfaceCard` |
| Streak | `ActivityGrid` + `ExpandablePanel` |
| Notification bell/list | bell keyframes + Motion layout removal |
| Appeal stages | staggered five-step cards |
| Annotation creation | marker scale/fade and SVG path appearance |
| Mr Whale context | expandable panel and existing response typing |
| Empty state | restrained floating icon |

Planned after persisted job support: connector sync ring, Auto Mode job progress, server-confirmed success burst, and card-to-detail shared layout transitions.
