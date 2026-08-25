# ADR-081: The through-line travels the Z axis

**Status:** Accepted (2026-08-25)
**Supersedes:** ADR-074 **on composition only** — its record, its content
laws, its drawings and its cover-role reasoning all still bind, and its
vertical timeline is now the FALLBACK rather than the surface.
**Flag:** `VOIDWALKER_TIME_TUNNEL` (`unifiedServicesInstrument.ts`)

## The complaint

The career through-line was a 2D vertical scroll: nine beats alternating
around a centred gold spine, ~4.4k px of document after the pinned `#about`
deck. The owner's reading, in his own words: a vertical scroll _"doesn't
really fit our design language"_ on a site that travels the Z axis
everywhere else — the corridor, the Arc, the exit dive. And the date
placement on the spine chip was _"really ugly"_.

Two problems, one answer. The site already knows how to fly.

## The decision

**Past `#about` the reader falls into the brandmark parked at the end of
the corridor, a wormhole opens, and the nine beats fly at them
newest-first while the years count backwards on a graduated axis.**

Three things make it a record rather than an effect:

1. **The date grammar is A4 — the graduated axis** (the owner's pick from
   the look-dev sheet). One tick per year between the newest beat and the
   oldest, majors where the record lands, and a marker measured **in
   years, not in scroll**. The gaps between beats become elapsed time you
   can see. This is ADR-078's _"a record plots, it does not list"_, one
   surface later.
2. **The tunnel IS that axis.** One gold ring per year flies past the
   camera, on the same measure the DOM axis draws. The graduation is
   drawn twice, from one source, so the two cannot disagree.
3. **The ordinal is deleted.** On a graduated axis the year IS the
   position, so `//03` restated it — the ruling ADR-066 took for the
   casefile, arriving here.

## Architecture: an extension, not a new canvas

**There is no second WebGL context.** The corridor's R3F canvas already
survives `#about` as a fixed full-viewport backdrop (the services ambient
hold), and `#voidwalker` was the station that KILLED it. The travel
extends that hold and moves the kill one station down to `#practice`.

The beats stay **real DOM on CSS 3D** over that canvas. The alternative —
baking nine typographic plates into WebGL — was rejected because the film
interlude is a live `<button>` into a CSP-pinned player, three press bars
are real links, and every record guard walks rendered DOM text. One
content tree in two presentation modes; the wrappers are
`display: contents` until the mode flips.

### The one number that makes it one space

`travelPerspectivePx(vh, aspect)` derives the CSS `perspective` from the
SCENE CAMERA'S OWN FOV: `P = (H/2) / tan(θ/2)`. A DOM plane at
`translateZ` then projects exactly as the same geometry would in the
canvas behind it. Two layers with different projections read as a sticker
over a video; this is what prevents it.

⚠ `sceneGeom.ts` imports THREE, so the clock cannot import it — the FOV is
MIRRORED in the three-free clock and **pinned equal by the unit test**.

## What the measurements corrected

- **`VW_TRAVEL_SPAN` must exceed 2, and "> 1" is the trap.** A neighbour
  sits 1.0 stop away and the flight only begins outside the park, so the
  reach is `SPAN/2 − PARK/2`. At 1.72 the next beat was pinned at −1
  (invisible) the moment the current one parked — the field was a
  slideshow of one card at a time. 3.8 puts a neighbour at t ≈ −0.46.
- **The foot is sized by the flight, not by eye.** Below ~0.11 the last
  beat was still on screen at `p = 1`, stranded at a couple of percent
  opacity over the foot.
- **Depth on a flat layer is carried by FOCUS, not opacity.** Measured on
  the first live capture: a receding beat at 24 % and half scale stayed
  legible under a pixel of blur, so it read as two paragraphs printed over
  each other. The blur ramp now saturates by |t| 0.55.
- **The subgrid had to be torn down, not re-placed.** `.vw-beat` is
  `grid-template-columns: subgrid`; with `.vw` no longer a grid it
  collapsed to one column, and children still asking for `grid-column: 3`
  CREATED two implicit columns — silently squeezing every plate to a third
  of its width.
- **`data-vw-ready` gates the whole motion block.** The travel hook did not
  write it, so every `--vw-b` it wrote was inert AND the masthead's decode
  ghost stayed painted over the field. Caught by the light-theme capture.
- ⚠ **The wall shader's wrap pinned the tunnel to the camera.** Adding
  `uCamZ` to the point's own phase before wrapping resolves straight back
  to `uCamZ + p.z`: geometrically perfect, and completely frozen. The
  reader flew twenty-six units and the walls never moved.
- **The year rings' spacing is DERIVED** (`26 / 12 ≈ 2.2`), or the rings
  slide against the walls like a separate object.
- ⚠ **`colorScheme` does not flip this site.** The theme is an explicit
  pre-paint attribute from `?theme=`, so a context-level colour scheme
  captures dark twice and reports a light pass that never happened.

## The seam, and its lockstep

`useCorridorExitScroll`'s `nextStation` and `home-v2.css`'s cover rule name
the SAME station under the SAME flag — the ADR-030 §6 bug, recorded a
fifth time. `#voidwalker` keeps its opaque cover rule for every path where
the tunnel does not engage; the travel-mode transparency and its
fail-opaque `--vw-bg-in` shield are gated on the mode attribute, so the two
can never both apply.

## Fallback

Flag-off · mobile · tablet · reduced-motion · no-WebGL · a JS failure
mid-travel — all land on the ADR-074 vertical timeline, fully lit, on an
opaque station, **with zero runway height** (the runway is mode-gated, so
no path inherits fourteen viewports of dead scroll). Verified at 390, 900
and 1440-with-PRM.

The two writers are the same boolean and its negation, so `--vw-b` can
never have two writers.

## Verification

- `tests/lib/voidwalker-travel-clock.test.ts` — 27 cases: monotonicity,
  park coverage, ≤3 stops painting, the FOV mirror, the perspective
  identity, and the CSS↔constant runway pairing read off the sheet.
- `scripts/capture-voidwalker-travel.mjs` — the real landing, real
  scrolls, every stop at its park. Gates: mode engaged · runway inflated ·
  **ambient alive at every stop** · a parked beat that fits the viewport ·
  ≤3 painting · perspective present · no page errors. PASS at 1280×720,
  1440×800, 1920×1080-class and the owner's 1920×1247, dark and light.
- `services-ring-smoke`'s ambient case retargeted: it now asserts the
  canvas SURVIVES the travel and dies under `#practice`.
- Full `npm run verify` green (1064 unit tests), production build clean.

## Left open

- The press artifacts and the scanline treatment are still the look-dev
  sheet's open questions (T1–T4 + the theme call) — deliberately not
  bundled into this pass.
- The journey glyph still draws a vertical spine. It is honest for the
  fallback and cosmetic for the travel; a redraw is its own small pass.
- The tunnel's wall density is tuned against software rendering in
  capture. Worth a look on a real GPU before it is called final.
