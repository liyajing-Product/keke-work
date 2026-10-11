# Alpine vision — second-screen design

## Direction

Keep the approved first hero's black field, Readex Pro typography, neutral pills and white action. The supplied typography reference is translated into two large offset lines: `Less burden,` inset from the left, then `more freedom` aligned with the section margin. Use weight 400, tracking -0.055em, and line-height 1.04. The supporting copy remains `from first light to the last lift. find your focus. make every turn yours.`

Tokens: black #000000; pill #171717; white #ffffff; secondary text white at 70% and 40%; product finishes derived from the supplied lens and user selection. Display and body both use the approved Readex Pro family; the second-screen display uses weight 400, tracking -0.055em and leading 1.04. No cards, product pricing or unsupported technical claims are added.

## Asset and interaction decisions

Five PNG originals are copied intact from the user's Downloads folder. The active views now use five AI-restored transparent studio images with repaired edges, opaque white markings, and clearer material detail. Their original generated alpha is preserved; fixed product bounds centre each view. Canvas resolution is 1920 × 1230 with high-quality interpolation. A warm-pixel lens mask and enclosed-gap fill separate the lens in the browser renderer; recolouring preserves its luminance texture and leaves the body layer unchanged. Prompts and provenance are recorded in `goggles-hq-prompts.md`.

The photo sequence is front, front quarter, side, back, opposite quarter, then front again. Pointer movement advances one frame per 52px of dominant horizontal/vertical mouse travel. On touch, horizontal movement advances the view while vertical page scrolling stays available. Five source photos support a stepped photographic spin, not a continuously reconstructed 3D object.

The main product uses a grab cursor. Hover movement rotates the photographic sequence; a click selects the front view and separates lens, frame and strap. Frame and strap use AI-generated transparent component illustrations matching the supplied product; prompts and provenance are in `goggles-component-prompts.md`. The lens is the existing photo canvas. The three pieces form a horizontal row: lens on the left, frame at the centre, strap on the right, with captions below each component. The separate lens/frame/strap buttons have been removed. Responsive scaling and spacing keep all three pieces inside the desktop and mobile viewport. Clicking again sends both sides towards the central frame over 650ms; the strap fades after arrival and the assembled body returns. The wider interactive stage remains present until the motion finishes. Rotation and repeated toggling pause during assembly; a colour change can supersede it. Reduced-motion preference restores the product immediately. Touch drags suppress the subsequent click, and keyboard Enter/Space toggles the breakdown. No engineering model is implied.

The old below-product view controls and instruction line are removed. Colour changes use JavaScript Web Animations: lift and throw the old lens off the left viewport, repaint while offscreen, then slide the replacement from the right with a small magnetic seating rebound. Swaps show the front view, pause rotation and inspection, coalesce rapid selection to the last requested finish, and cancel when leaving the scene or unmounting. Reduced-motion users get an immediate change. Navigation and colour selection remain usable throughout.

Desktop composition uses the reference's two-line offset headline above the centred product, with supporting copy on the right. The product is fitted below the headline to avoid covering the text. On mobile, the headline scales with the viewport, with supporting copy below the product. Shared navigation remains above all scenes. Reduced-motion styling removes layer-separation transitions.

## GridScan background revision

The user's React Bits attachment supplies the vertex and fragment shaders for a four-wall perspective grid and a ping-pong scan beam. `src/GridScan.tsx` preserves those shaders and adapts the rendering wrapper to this TypeScript site. The supplied starting values are retained: sensitivity .55, thickness 1, line colour #2F293A, grid scale .1, scan colour #FF9FFC, scan opacity .4, bloom .6, chromatic aberration .002 and noise .01. Three.js and postprocessing render the decorative background. Webcam, face models and device orientation are not part of this background adapter.

The background has 70% layer opacity; a radial black veil behind the product and top/bottom fades preserve image and text contrast. Pointer movement is observed on the section without intercepting product or colour interactions. The render loop pauses outside the active second scene and when the document is hidden. Reduced motion uses a stationary grid/scan frame. A static glow is shown if WebGL is unavailable. Pixel ratio is capped at 1.5, resize follows the container and GPU resources are released on unmount.

## Delivery

Local preview only, consistent with the existing task's publication preference. The approved first hero and final snowboarding scene are preserved. The old second-screen content is replaced. The HQ image revision uses built-in image_gen edits of all five supplied photographs. No automated test suite is added or run.
