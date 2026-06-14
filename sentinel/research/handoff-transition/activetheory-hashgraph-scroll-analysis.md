# Active Theory / Hashgraph Scroll-Swipe Analysis

Date: 2026-06-14

References:

- Active Theory Work: https://activetheory.net/work
- Hashgraph VC: https://hashgraphvc.com/

Scope: explain the scroll/sweep mechanics that informed the home-v2
post-corridor handoff into `HandoffOrbitEmbed`.

This file supersedes the earlier "blocked/timeout" notes for Active Theory and
Hashgraph in `reference-extractions.md`. The later investigation used live
Playwright sampling, including headed Chrome for Active Theory because its
headless path returned an unsupported-browser screen.

## Executive Summary

The shared effect is not normal document parallax.

Both sites create the feeling of a section "swiping" over the previous scene by
separating the visual world from the document scroll:

1. A persistent full-viewport visual layer remains fixed to the viewport.
2. Scroll input advances a virtual scene/state machine rather than relying on
   ordinary document sections moving at different speeds.
3. The next scene or section is introduced as a full-viewport replacement plane.
4. The previous scene is held underneath long enough to preserve object
   continuity.
5. The incoming plane covers/replaces the previous scene; the previous scene is
   not simply faded out.

For Thoughtform, the useful translation is:

- Keep the completed corridor canvas alive as a fixed backdrop.
- Drive a full-viewport cover plane from `--handoff-cover`.
- Put the first-read "Make the layer useful" copy inside that cover plane.
- Delay the service components until after the cover owns the viewport.
- Keep the corridor canvas opacity at `1`; use a small transform only for depth.

## Hashgraph VC Findings

### Observed Structure

Playwright inspection showed Hashgraph is a virtual-scroll, fixed-layer site:

- `window.scrollY` stayed at `0`.
- The document height matched the viewport instead of a long native-scroll page.
- The `html` element carried a `lenis` class.
- A full-viewport WebGL canvas lived under the page as `div#gl-canvas`.
- The WebGL layer was fixed and behind the UI.
- Content sections were full-viewport fixed layers, not ordinary sections in
  document flow.

Representative visible section nodes included:

- `.home-hero.gutters.fixed-section`
- `.home-investors.grid.fixed-section`
- `.home-portfolio.grid.fixed-section`
- `.home-team.grid.fixed-section`
- `footer.footer--full-height.footer`

Those nodes presented as `position: fixed` at viewport bounds:

```text
rect = { left: 0, top: 0, width: viewportWidth, height: viewportHeight }
scrollY = 0
documentHeight ~= viewportHeight
```

### Motion Model

Hashgraph does not get its swipe feeling from CSS parallax. Wheel input is
captured by Lenis/virtual scroll, then translated into section state. The
current section and next section are both viewport-owned surfaces. The WebGL
scene persists behind them.

What the user perceives:

- The old scene remains spatially present.
- The incoming section occupies the whole viewport.
- The replacement feels like a layer crossing the camera, not like a document
  panel scrolling upward.

What is likely happening mechanically:

- Wheel/touch delta updates a virtual progress value.
- Fixed full-screen DOM sections toggle or animate classes such as
  `is-visible`.
- The WebGL canvas uses the same virtual progress to update camera/material
  state.
- The page root remains effectively stationary while content states change.

### Important Distinction

Hashgraph is not "a background with text scrolling over it." It is closer to a
scene compositor:

```text
fixed WebGL world
  +
fixed viewport section A
  +
fixed viewport section B entering/replacing A
```

The replacement plane is the important part. If the previous WebGL scene fades
out before the next section is visibly covering it, the effect becomes normal
parallax and loses the swipe.

## Active Theory Findings

### Observed Structure

Active Theory required headed Chrome for the useful inspection path. Headless
Chromium hit an unsupported-browser screen.

Playwright inspection showed a fixed app shell:

- `window.scrollY` stayed at `0`.
- `document.documentElement.scrollHeight` matched the viewport.
- `#Stage` owned the full viewport app.
- A full-viewport canvas was present.
- `.FXScroll` existed as a fixed scroll/render layer.
- Multiple `.scrollElement` nodes existed as virtual scroll regions with large
  translated positions.
- Global objects included names such as:
  - `FXScroll`
  - `ScrollController`
  - `ScrollRenderManager`
  - `ScrollPlayer`
  - `AppStore`
  - `FXScene`

### Motion Model

Active Theory is even more explicit than Hashgraph: the site is a WebGL/virtual
scroll app. The browser's native scroll position is not the source of truth.

The page simulates scroll through an internal scene graph:

```text
wheel/touch input
  -> virtual scroll controller
  -> WebGL scene/camera/material updates
  -> virtual DOM scroll elements for accessibility/layout/readout
  -> fixed viewport render
```

At deep scroll, the "work" page does not behave like a stack of native sections.
The project/card/lab states are app states inside a fixed stage. The swipe feel
comes from state replacement inside the stage, with WebGL continuity underneath.

### Important Distinction

Active Theory is not a CSS recipe. It is a render architecture:

- the viewport is the stage;
- scroll is input;
- sections are states;
- WebGL is continuous;
- DOM elements assist the composition rather than own the full behavior.

Trying to match this with a normal sticky section plus opacity fade will always
feel different, because the previous scene is not actually being replaced by an
incoming plane. It is just disappearing behind document flow.

## Shared Swipe Grammar

The sites differ in implementation, but the perceived grammar is shared.

### 1. The Viewport Is the Stage

The important surfaces are viewport-sized and viewport-positioned. They are not
content-width sections inside a padded page column.

Thoughtform invariant:

```css
.handoff-lab__swipe-cover {
  width: 100vw;
  height: 100svh;
}

html[data-corridor-docked="true"] .handoff-lab__swipe-cover {
  position: fixed;
  inset: 0;
}
```

If the cover inherits `.stations` or section padding, the user sees a panel,
not a sweep.

### 2. The Previous Scene Is Held, Not Faded

The old scene must stay materially present until the cover plane has replaced
it. A slight transform can sell depth, but opacity should not be the transition
owner.

Thoughtform invariant:

```css
html[data-corridor-docked="true"] .home-v2-stage__canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100svh;
  opacity: 1;
}
```

Bad pattern:

```css
opacity: calc(1 - cover * 0.82);
```

That turns the transition into fade/parallax and creates a blank interval.

### 3. The Incoming Plane Does the Covering

The cover is an actual opaque plane whose visible region changes with progress.
It is not just a transparent section with a background gradient.

Thoughtform implementation pattern:

```css
.handoff-lab__swipe-plane {
  position: absolute;
  inset: 0;
  background: var(--void);
  clip-path: inset(calc((1 - var(--handoff-cover)) * 100%) 0 0 0);
}
```

The clip is the "swipe." The section is not just scrolling over the sphere; the
plane is progressively occupying the viewport.

### 4. First-Read Copy Belongs Inside the Cover Plane

The first-read copy must enter with the cover, not after it. If the copy sits
below the 100svh cover in normal flow, the user experiences:

```text
old sphere fades/dims
blank dark viewport
new headline appears later
```

That is the opposite of the reference behavior.

Correct structure:

```tsx
<div className="handoff-lab__swipe-cover">
  <div className="handoff-lab__swipe-plane">
    <div className="handoff-lab__scenario-head">
      <h2>Make the layer useful.</h2>
    </div>
  </div>
</div>
```

### 5. Service Components Enter After the Cover Owns the Viewport

If the services grid enters while the cover is still in progress, the result is
two sections colliding. If it enters too late, the cover feels like an empty
interstitial.

The service grid needs a deliberate handoff:

```text
cover progress 0.00 -> 1.00
  sphere held behind
  cover plane clips upward
  first-read copy visible inside plane

post-cover scroll
  services grid enters
  first-read copy fades out
```

Thoughtform uses dock-window padding to keep the services below the viewport
until the active cover is done:

```css
html[data-corridor-docked="true"] .handoff-lab__services {
  padding-top: 100svh;
}
```

Then the service grid scrolls normally on the opaque services surface.

## Why the Earlier Thoughtform Version Was Wrong

The broken implementation violated the shared grammar in three ways:

1. The incoming surface was not truly viewport-owned. It could inherit page
   constraints/padding, so it looked like a centered or inset section rather
   than a full-screen cover.
2. The old sphere/corridor canvas was being faded out. That made the transition
   read as normal parallax with a disappearing background.
3. The useful service components were below the sticky headline cover. The
   viewport parked on "Make the layer useful" while the actual components were
   hidden further down the flow.

The result was:

```text
section scrolls upward
sphere dims/fades
headline appears
services are delayed/hidden
```

The reference target is:

```text
sphere holds
opaque plane wipes over it
headline is part of that wipe
services enter after the plane owns the viewport
```

## Practical Thoughtform Implementation

The current home-v2 handoff should stay native-scroll for the corridor and only
borrow the reference compositing grammar at the post-corridor splice.

Do not import Lenis or rebuild the whole homepage as a virtual scroll app just
to get this beat. The corridor already works and should remain untouched.

Use this hybrid:

```text
native home-v2 corridor
  -> epilogue lands sphere
  -> post-corridor dock flag promotes live R3F canvas to fixed backdrop
  -> fixed full-viewport cover plane clips upward
  -> first-read copy appears inside plane
  -> cover releases
  -> service components scroll in over opaque services surface
```

The local roles are:

- `useDepthScroll`: owns corridor progress, paint progress, epilogue progress.
- `HandoffOrbitEmbed`: owns the later dock/cover channel only.
- `--handoff-cover`: cover transition clock.
- `data-corridor-docked`: promotes the existing corridor canvas to a fixed
  backdrop during the cover.
- `.handoff-lab__swipe-cover`: viewport owner.
- `.handoff-lab__swipe-plane`: clipped incoming replacement plane.
- `.handoff-lab__services-grid`: useful components that enter after cover.

## Verification Checklist

Use Playwright at a wide viewport such as `2048 x 1024` and sample the handoff.

During active cover:

```text
services.left === 0
services.right === viewportWidth
cover.position === "fixed"
cover.left === 0
cover.right === viewportWidth
canvas.opacity === "1"
plane.clipPath !== "inset(0% 0px 0px)"
servicesGrid.top > viewportHeight
```

After cover release:

```text
cover.position === "sticky"
plane.clipPath === "inset(0% 0px 0px)"
headline.opacity approaches 0 as servicesGrid enters
servicesGrid.top is inside the viewport
```

Visual checks:

- The cover must touch both viewport edges.
- No centered/inset dark rectangle should appear during the sweep.
- The sphere should not fade away before the cover reaches it.
- "Make the layer useful" should be part of the sweep, not a later section.
- The first service component should become visible after the cover beat.
- The old headline should not remain ghosted behind service cards.

## Anti-Patterns

Do not do these:

- Fade the corridor canvas to fake depth.
- Let the services section keep horizontal padding during the cover beat.
- Put the first-read copy after the 100svh cover.
- Let the sticky cover sit above the service grid forever.
- Use a transparent gradient as the only cover surface.
- Treat Active Theory or Hashgraph as ordinary parallax references.
- Replace the working corridor timeline with a virtual scroll system unless
  the whole homepage architecture is intentionally being rebuilt.

## Bottom Line

Active Theory and Hashgraph feel similar because they treat scroll as a
viewport-stage state transition. The old scene persists, the incoming scene owns
the whole viewport, and replacement is achieved by a cover plane/state change,
not by fading the old scene or scrolling a padded section over it.

For Thoughtform, the correct implementation is a native-scroll hybrid:
preserve the current 3D corridor, then use a fixed full-viewport clipped cover
plane for the post-corridor handoff.
