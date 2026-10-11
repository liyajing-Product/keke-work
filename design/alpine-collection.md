# Third screen — ALPINE collection

## Reference

User-provided clipboard screenshot: `codex-clipboard-c69af70d-6609-40f4-bd4d-761c72b13c4d.png`.

The composition follows the screenshot's black canvas, oversized outline typography, large left heading, right-weighted category/count/description grid and full-width fine rules. Readex Pro and the shared pill navigation continue the existing first/second-screen language.

## Requested changes applied

- Heading: `ALPINE°`.
- Background: `GEAR UP. RIDE HARD. BUILT FOR WINTER. MADE FOR MOUNTAINS.` rendered as four oversized outlined lines with gentle scroll parallax.
- The reference's right-hand CTA and copy are omitted. The previously approved global navigation remains shared by all screens.
- The latest revision removes PANTS, LAYERS, GLOVES and ACCESSORIES. The remaining three groups (GOGGLES, HELMETS, JACKETS) contain 12 entries with the supplied descriptions and counts.

## Layout adaptations

- Desktop preserves the wide empty left field, with category labels starting near 46% at 1440px and larger viewports. The middle desktop breakpoint shifts this to 32% to keep descriptions readable.
- Below 768px, all three columns use the screen width: 28% category, 10% count, 62% description. Text can wrap without horizontal scrolling.
- The fifth screen uses `100svh` with a grid containing the heading and table. Responsive height-based type and spacing keep all three groups in one viewport, with no inner scrollbar. Short windows below 650px use compact header and row spacing.
- All five scenes share a perspective stage and one ScrollTrigger timeline. The collection heading and table approach from different depths; each group reveals with scroll, and the scene retreats before the fourth-screen path. Reduced motion and CDN fallback show the complete final layout immediately.

## Implementation

`src/AlpineCollection.tsx` contains semantic grouped table markup and the supplied data. `src/index.css` contains the layout and responsive typography. `src/useScrollStory.ts` manages the scoped GSAP timelines and navigation offsets. The second-screen arrow now announces “explore the alpine collection”.
