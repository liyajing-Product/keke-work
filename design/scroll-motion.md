# Five-screen depth story

## Why the previous motion was hard to see

The former collection was a one-viewport section at the document bottom. At #collection it was already at maximum scroll; there was no additional travel to animate. The earlier product timeline also had a long still interval. All five scenes now share a perspective stage with continuous scene depth movement.

## Runtime

GSAP 3.13.0 and ScrollTrigger remain CDN scripts at the bottom of index.html. Official references: https://gsap.com/docs/v3/Plugins/ScrollTrigger/ and https://gsap.com/docs/v3/GSAP/CorePlugins/CSS/ . The stage uses CSS perspective (1400px desktop / 1000px mobile) with GSAP z, rotationX, scale and opacity. Native scrolling maps the full 2260svh document to one timeline with .48-second camera scrub; no wheel interception. Only the third scene settles to directional chapter boundaries after scrolling stops.

The user's earlier Lusion about reference was consulted as a visual direction, not as a source of proprietary code. The fourth-screen reference is the user-provided particle-cloud screenshot. The previous SVG orbit and draw animation have been removed. A seeded, silver volumetric particle field slowly rotates with foreground defocus, while the global GSAP clock maps its depth progression. Collection and signature headings share alpine-display; the signature keeps two uppercase lines without shadow, positioned at the bottom of the scene.

## Scroll mapping

| Timeline clock (0–2.7) | Visual narrative |
| --- | --- |
| 0–.285 | Centred SKIING enlarges into the G aperture; video fades and the incoming goggles scene is revealed. |
| .14–.635 | Goggles approach, remain interactive and advance beyond the viewer. |
| .455–.635 | The complete snowboard approaches as the third scene. |
| .6825–1.9325 | Ten snowboard chapters separate the structures; upward scrolling reassembles them. LightRays runs while this scene is active. |
| 1.9825–2.17 | Snowboard recedes and fades. |
| 2.0–2.17 | Signature enters as the fourth scene. |
| 2.01–2.255 | The silver cloud rotates through depth and approaches the viewer; upward scrolling reverses its camera progression. |
| 2.28–2.485 | Signature recedes and fades. |
| 2.295–2.5725 | Equipment index enters as the fifth scene; heading, rules and all 12 rows reveal. |
| 2.5725–2.7 | Settled equipment index at the end of the story. |

Scene destinations are defined by name in `src/storyConfig.ts`: hero=0, goggles=.33, snowboard=.6825, signature=2.255, collection=2.5275. Hashes retain their content identity; #mountain remains a collection alias. The second-screen arrow now leads to snowboard. The company link still leads to the collection, now fifth; support still leads to the fourth-screen particle scene. Navigation is interruptible with wheel, touch or scroll keys.

## Product interaction and performance

Product depth movement lives in .goggles-product-motion, outside the assembly layers, so hover rotation, horizontal part separation and lens replacement retain their coordinate system. The unused old video frame-bank decoder is no longer mounted behind opaque scenes. GridScan remains lazy-loaded. Background rendering windows start before entry and finish after exit; interactive state follows the rendered GSAP timeline, including its scrub tail. LightRays and particles retain their renderer between visits. The particle field uses 24 depth buckets instead of sorting all particles each frame. Goggles masking and recolouring run in a module Web Worker with a five-result cache; full 1920px buffers are preserved.

All four scene handoffs use power2.inOut, a shared incoming pose (z=-300, scale=.94, tilt=2 degrees), and overlapping opacity. Whole-panel blur is disabled to avoid unnecessary full-screen compositing. The signature title exits before the equipment heading enters, keeping both large headlines legible.

## Reduced motion and resilience

Reduced motion bypasses all ScrollTrigger creation and puts five sections in ordinary document flow. Transforms and blur are reset, and the particle volume uses a fixed composition without animation. Videos and product controls keep their previous reduced-motion handling. Dynamic preference changes revert the GSAP context. CDN failure or timeout uses the same readable static layout. Cleanup kills navigation tweens and reverts the scoped context; font readiness refreshes scroll positions.

## Third-screen snowboard chapters

The clock runs 0–2.7 across 21.6 viewports of travel. Eight viewport lengths per clock unit preserve the existing gesture pace. DOM order, stacking order and active-scene indices match the new content sequence.

A dedicated GSAP ScrollTrigger maps .6825–1.9325 to the paused Anime.js timeline with .18-second scrub. Both physical trigger boundaries are computed from the global clock; the final boundary precedes the signature and collection. Only this range snaps to chapter boundaries. The .48-second global timeline controls scene transitions, and reversed scrolling seeks the same part geometry backwards. LightRays starts before the snowboard enters, continues through the visible overlap, and pauses after exit. Its renderer persists on return. See snowboard-engineering.md for structure order, spacing and static fallbacks.
