# Third screen: snowboard engineering

## Visual language

Black canvas, shared Readex Pro display typography and ALPINE navigation. One glacier accent (#83d7e3) with neutral white drafting lines. The pure SVG engineering illustration uses an oblique longitudinal plane, twin-tip outline, narrow waist, wood-grain core, laminate hatching, paired steel edges and one three-piece binding. Geometry and typography are retained from the approved third-screen design.

## Scroll narrative (replaces the automatic loop)

- Arrival / #snowboard: complete assembled snowboard, no automatic motion.
- Ten scroll chapters: screws → binding → top sheet → sidewall → upper laminate → threaded inserts → wood core → lower laminate → both steel edges → sintered base.
- One chapter occupies about one viewport of scroll travel: 3% lead, 82% movement with sine easing, 12% label drawing, then a settled hold.
- A short gesture settles toward the next chapter boundary in its direction. Inertia is disabled so snap destination does not overshoot based on velocity. Longer uninterrupted scrolling may traverse several chapters. No wheel/touch events are intercepted.
- Scrolling upward seeks the same geometry backwards: base first, screws last. Stopping holds the current chapter; the animation never plays independently of scrolling.
- Arrival uses a close camera; the view opens with the first eight chapters to contain the enlarged stack. Footer names the active structure and shows 00–10 progress.

## Implementation

`src/SnowboardScene.tsx`: pure SVG, final viewBox 0 -90 2100 1540, xMidYMid meet. Each main component is enlarged uniformly by 1.6 around the assembly centre; nested binding components are scaled only once. Narrow screens use a 1750-unit horizontal crop with labels hidden. All geometry remains grouped; anime transforms run on wrappers, while projection matrices stay on children. Two edge rails move together as one engineering structure. Binding baseplate, highback and straps retain independent subgroups; eight screws lift with short internal staggering.

`src/snowboardConfig.ts`: palette, exploded poses, label coordinates, chapter sequence and timing. `BOARD_SCROLL` stores the GSAP clock range 0.6825–1.9325 and chapter seek coordinates. Board camera motion remains on the global timeline; part motion uses an independent trigger over the same physical scroll range. All transform values are explicit from/to arrays.

Anime.js v4 ESM uses createTimeline, stagger and svg.createDrawable. The timeline is paused, without loop or autoplay. A dedicated GSAP ScrollTrigger with .18-second scrub drives a mutable render bridge that calls timeline.seek(time, true); it does not set React state every frame. React updates only when the active chapter changes. Label lines draw and unwind with their corresponding structure. Animation cleanup reverts Anime and GSAP independently.

## Access and resilience

Reduced motion and CDN failure use the existing ordinary document flow and a static, complete exploded view. No scrub, chapter snapping or playback controls are created in this mode. SVG title and description list the complete assembly. Scroll gestures, touch, keyboard and scrollbar dragging all use native document scrolling.

## Global scroll mapping

Document height is 2260svh; the global clock runs 0–2.7. Eight viewport lengths per clock unit preserve the existing gesture pace. Snowboard now enters as the third scene at .4725–.6225, remaining assembled until .6825. Its ten chapters finish at 1.9325; the fourth-screen path then enters at 2.01, and the equipment index closes the story as the fifth scene. #snowboard targets the complete board at .6825. The dedicated board trigger ends before the fourth scene, so later scrolling cannot continue disassembly. Static document order matches the animated order.

## Primary references

- https://animejs.com/documentation/timeline/timeline-methods/seek/
- https://animejs.com/documentation/timeline/time-position/
- https://animejs.com/documentation/svg/createdrawable/
- https://gsap.com/docs/v3/Plugins/ScrollTrigger/

## Spacing and continuity correction

The projection is shallower and expanded rotations stay below one degree for full-length board layers. Layer centres are spaced roughly 145–175 SVG units apart, with independent left/right hardware lanes. The canvas grows vertically to contain the enlarged stack. Labels and dimension markers follow the new geometry.

`BOARD_SPREAD_STEPS` moves the still-assembled inner stack down as upper laminate, core, lower laminate and edges are peeled away. A separate SVG wrapper transports the unopened stack using a deterministic sine interpolation of the scroll position; each part has one Anime transform track relative to that wrapper. Reversing scroll restores exactly the same intermediate stack without competing replacement tweens on the same y property. This avoids crossing unopened layers during motion as well as overlap at the final pose.

The global camera retains .65-second scrub. The snowboard geometry uses its own .18-second scrub with .32-second snap delay and .5-second settling duration. Snapping starts after the short scrub has caught up; a .012-chapter tolerance recognises rounded pixel boundaries, avoiding an unintended extra step. Inertia remains disabled, and user gestures can interrupt the snap. The former exponential easing is replaced by a sine curve over 82% of the chapter to avoid concentrated acceleration in the middle of the move.

## Larger product framing

The drawing occupies 75% of the desktop scene height and 57% on narrow screens. A continuous sine camera interpolation expands the viewBox from an 880-unit assembled crop to a 1540-unit exploded view over chapters 0–8. This gives the complete board nearly the full available width on arrival, while keeping the final layered construction inside the viewport. Labels and the dimension rule are repositioned for the larger geometry. The section remains one pinned viewport; scroll chapter distances and reverse assembly are unchanged.

## LightRays atmosphere

The user-supplied React Bits LightRays shader is adapted to TypeScript in `src/LightRays.tsx`, with the `ogl` dependency loaded when the third scene becomes active. Top-centre rays use the existing glacier accent, .55 speed, 1.1 spread and .08 pointer influence. A shaded background layer keeps the white headings and engineering linework legible. The snowboard remains pure SVG; WebGL renders only the decorative background.

The effect has no pointer hit area and does not intercept scroll. Leaving the scene disposes its geometry, program, WebGL context and event listeners. Hidden browser tabs pause the frame loop. Reduced motion or unavailable WebGL uses a static CSS light fan. React StrictMode cleanup cancels asynchronous setup before resources are created.
