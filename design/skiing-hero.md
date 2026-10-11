# SKIING hero and letter portal

## Content

The first scene keeps the existing ski video and shared ALPINE pill navigation. The only hero copy is one centred, horizontal, uppercase `SKIING` heading. The description, `your` / `data` headings and all three statistics (numbers, labels and diagonal rules) are removed as requested.

## Visual language

White Readex Pro, weight 500, tight spacing and a responsive 26vw display scale capped at 49svh. One heading occupies the centre of the viewport. The background has a quiet black contrast veil. No text shadows or extra controls are added.

## Scroll transition

The global GSAP ScrollTrigger drives the first .245 clock units (about two viewport lengths). The heading grows from scale 1 to 38, targeting the centre of the G counter as its transform origin. Its position recentres that aperture as it enlarges. Origin and pan distance use layout measurements and are refreshed after fonts load or viewport size changes.

The video gently grows to 1.24; its layer fades from .155–.245. The hero overlays the incoming goggles scene so oversized letter strokes can pass across it. At .245–.263 the remaining hero layer disappears, leaving the second screen. Upward scroll reverses the same timeline. No wheel events or autonomous title loops are used; the rest of the scene order and chapter ranges are retained.

Reduced motion or unavailable GSAP displays the centred title statically in ordinary document flow. It does not create the portal zoom. Video retains its existing reduced-motion still-frame behaviour.
