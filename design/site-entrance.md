# Navigation, entrance and pointer fluid

## User annotations

- Home → first scene (`#scene`).
- Goggles → goggles (`#goggles`).
- Skateboarding → the existing snowboard construction scene (`#snowboard`); the requested label is preserved verbatim.
- Equip → equipment collection (`#collection`).
- The former bitmap lockup is replaced by the same mountain silhouette as an SVG mark plus live brand text. Header text uses font-weight 400 following the latest annotation; the entrance wordmark retains its 300 weight. PNG pixels cannot respond to font-weight; live text makes this annotation meaningful and accessible. The mountain mark is shared between the header and the loader via the HTML SVG symbol.

The longer navigation label moves the middle-pill breakpoint from 768px to 960px. Below that width the existing logo and get started layout remains. Small-screen outer/button padding is bounded to avoid crowding.

## Entrance

An HTML-shell overlay appears before the React bundle, draws the mountain path over 1.35 seconds, then fades away over .65 seconds after the font, hero video first frame and motion CDN are ready. It waits for no more than 3.5 seconds after React starts; an independent 6.5-second HTML fallback releases the page even when the app cannot initialize. No fictitious percentage is shown. Loading copy is “preparing your ride”. Navigation/content are inert until the overlay exits. Loading appears on document entry/reload, not during in-page scene changes. Reduced motion uses the completed mark and immediate exit once ready.

## Global cursor

`SplashCursor.jsx` uses the React Bits WebGL fluid simulation supplied in the attachment, with a TypeScript declaration and a lazy site wrapper. No extra runtime dependencies are required.

Site choices: fixed transparent overlay, pale ice colour #9fcbd0, rainbow disabled, opacity .7, simulation resolution 96, dye resolution 640, 12 pressure iterations, DPR capped at 1.25, fluid render rate capped at 60fps. Pointer events pass through; the standard native pointer and goggles grab cursor remain. It listens to mouse movement globally and works across all five scenes.

The renderer pauses and clears after 3.2 seconds without pointer input, pauses in hidden tabs, cleans up GPU resources and listeners on unmount, and rebuilds after WebGL context restoration. Touch-only/coarse-pointer devices and reduced-motion preferences do not mount the effect. WebGL unavailable leaves the native pointer in place.
