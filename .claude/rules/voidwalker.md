---
paths:
  - "components/landing/home-v2/voidwalker/**"
  - "components/landing/home-v2/hooks/useVoidwalkerScroll.ts"
  - "lib/voidwalker/**"
  - "scripts/capture-voidwalker.mjs"
---

# Rule: The through-line (`#voidwalker`)

The career timeline after the bio — nine beats on one gold spine, six of
them with a drawn wireframe plate — and the OPAQUE COVER that ends the
corridor ambient hold. "Voidwalker" is the station's title by owner
decision (2026-08-23); `.voidwalker*` is the `#about` bio's CSS block and is
never written here — this section is `.vw*` / `.vw-wire*`.

⚠ **SINCE ADR-081 THIS SECTION HAS TWO PRESENTATION MODES, ONE CONTENT
TREE.** On desktop with motion allowed it is the TIME TUNNEL: the reader
falls into the parked brandmark past `#about`, a wormhole opens, and the
beats fly at them on the Z axis while the years count backwards on a
graduated axis. Everything below describes the VERTICAL mode, which is
still the whole record and is now the FALLBACK (flag-off · mobile ·
tablet · reduced-motion · no-WebGL · a JS failure). Both modes render the
same DOM.

**Read first**

- [ADR-081: The through-line travels the Z axis](../sentinel/decisions/081-voidwalker-time-tunnel.md) — the live composition; see §The time tunnel below
- [ADR-074: The through-line](../sentinel/decisions/074-voidwalker-through-line.md) — the record, the drawings, and the vertical mode
- [ADR-047](../sentinel/decisions/047-about-deck-flip-stage.md) (the station before it, whose exit relies on this one's top) · [ADR-056](../sentinel/decisions/056-services-proof-casefile.md) (the cover role's previous holder) · [ADR-068](../sentinel/decisions/068-casefile-glyphed-index-and-tool-dossier.md) (the wireframe grammar this forks) · [ADR-059](../sentinel/decisions/059-rail-instruments.md) (the journey mark, and the telemetry the right guard clears)

## The time tunnel (ADR-081, live)

- **No second WebGL context.** The corridor canvas already survives
  `#about` as the ambient hold; the travel EXTENDS it. The beats are real
  DOM on CSS 3D over it — the film is a live button into a CSP-pinned
  player, the press bars are real links, and the record's guards walk
  rendered text.
- ⚠ **THE PERSPECTIVE IS DERIVED FROM THE SCENE CAMERA'S FOV**
  (`travelPerspectivePx` = `(H/2)/tan(θ/2)`). It is the one number that
  makes the DOM field and the WebGL tunnel one space. `sceneGeom` pulls
  THREE so the clock MIRRORS `CAMERA_FOV` — the unit test pins them equal,
  and without that guard the two layers silently stop sharing a projection.
- ⚠ **`VW_TRAVEL_SPAN` MUST EXCEED 2, AND "> 1" IS THE TRAP.** A neighbour
  is 1.0 stop away and the flight only starts outside the park, so the
  reach is `SPAN/2 − PARK/2`. Under 2 the next beat is pinned invisible the
  moment the current one parks and the field is a slideshow.
- ⚠ **DEPTH ON A FLAT LAYER IS CARRIED BY FOCUS, NOT OPACITY.** A receding
  beat at 24 % and half scale stays legible under a pixel of blur and reads
  as overlapping text. The blur saturates by |t| 0.55.
- ⚠ **`data-vw-ready` GATES THE WHOLE MOTION BLOCK**, including the
  masthead's decode ghost. The travel hook writes it too, or every `--vw-b`
  is inert and the ghost paints over the field.
- ⚠ **A camera-relative wrap must wrap the point's OWN phase.** Offsetting
  it by `uCamZ` first resolves back to `uCamZ + p.z` — the tunnel comes out
  geometrically perfect and completely FROZEN.
- ⚠ **The year rings' spacing is DERIVED** from the camera's cruise
  distance over the record's span, or the rings slide against the walls.
- **The runway is MODE-GATED CSS** (the ADR-047 `#about[data-about-mode]`
  precedent, not the `#services` pre-hydration one) paired with
  `VW_TRAVEL_RUNWAY_SVH`; the unit test reads the sheet. No failing path
  may inherit fourteen viewports of dead scroll.
- **Two writers, one boolean and its negation.** `useVoidwalkerTravelScroll`
  and `useVoidwalkerScroll` take `enabled` from ONE capability decision, so
  `--vw-b` can never have two writers.
- ⚠ **`colorScheme` DOES NOT FLIP THIS SITE** — the theme is a pre-paint
  attribute from `?theme=`. A context-level colour scheme captures dark
  twice and reports a light pass that never happened.

## Contracts

- **The cover lockstep.** `useCorridorExitScroll`'s `nextStation` query and
  `home-v2.css`'s `html[data-corridor-exit="true"] #…` rule name the SAME
  station; the ambient bottom gate and the fade envelope read the SAME rect
  (ADR-030 §6, recorded FIVE times now). ⚠ **ADR-081 MOVED IT**: with the
  tunnel on, `#voidwalker` is itself a pinned TRANSPARENT stage the ambient
  must survive, so the cover is `#practice`. The `#voidwalker` rule stays
  for every non-travel path — the travel-mode transparency and its
  fail-opaque `--vw-bg-in` shield are gated on the mode attribute, so the
  two can never both apply. In the vertical mode the station is plain flow,
  opaque, with NO negative `margin-top` — `#about`'s slide-out exit lands
  on its top edge either way.
- **Three parse-option copies move together**: `app/(marketing)/page.tsx`
  (`CORRIDOR_RELOCATED_STATIONS`, `[voidwalker, about, services]`),
  `tests/lib/rail-manifest.test.ts` and `tests/lib/v7-parse.test.ts`. The
  drift guard is the alarm. `data-station` = `id` = manifest `targetId`.
- **The record is zero-import** (`lib/voidwalker/voidwalkerData.ts`) and its
  facts are at LOCK — `tests/lib/voidwalker-data.test.ts` pins the sourced
  phrasings and bans rounding, currency and model families. A copy change
  is a record edit plus that test. `#practice` is an EMPTY station in
  production; the foot may not point there.
- **A drawing declares what it letters** (`voidwalkerWireLabels.ts`) and
  `voidwalker-wire-markup` walks the rendered text against it: ≤8 labels,
  no digit, no currency, no `<img>`, exactly one `[data-gold]`, ≤50
  elements. Adding a label means adding it to the table in the same commit.
- **The `--w-*` token block on `.vw-wire__in` is the casefile's VERBATIM**,
  and theme.css re-derives both hosts from ONE light rule
  (`voidwalker-wire-tokens`). A new token lands in `casefile.css`,
  `voidwalker-wire.css` and `theme.css` in one commit — or in none.
- **One writer.** `useVoidwalkerScroll` owns `data-vw-ready`, `data-vw-beat`,
  `--vw-p`, per-beat `--vw-b` and the masthead's decode runs. No `<html>`
  writes, no store writes, no per-frame layout reads (the offset chain is
  cached; a `ResizeObserver` on the section AND on `document.body` refreshes
  it). Per-beat channels are hosted on the beat, never the root.
- **The rest state is the finished page.** The motion block is gated on
  `.vw[data-vw-ready]`; absent = every panel lit, the spine drawn, the
  diamonds filled. The hook's only gate is `prefers-reduced-motion:
no-preference` — ⚠ if a width gate is ever added, the CSS rest block in
  `voidwalker.css` takes the SAME pair.
- **The masthead never moves or fades** — it types in and un-types out, in
  place (the caption kernel; each lede run its own target so the gold `em`
  survives). Panels power on through the `--ci-off` ladder; the title's
  words brighten on `--vw-w`; all reversible.
- **The beats ALTERNATE around a centred spine at ≥1280** (ADR-074 U1):
  left beats right-aligned with the plate seated at the lane, right beats
  mirrored. Below 1280 the rules are reset and every beat reads off a
  left-hand spine — keep that reset when touching either block.
  ⚠ **THE SIDE AND THE ORDINAL ARE DATA, NOT `:nth-child`** (U2). The film
  interlude is a row in the same list, so a parity selector flips every beat
  beneath it. Both are computed in the renderer over a count that SKIPS
  interludes; CSS selects `[data-side]`.
- **The marker is a framed CHIP on the rail** (U2) — node, ordinal and year
  on one line, on an opaque ground that BREAKS the spine. ⚠ The rail used to
  be drawn straight through the labels on all nine beats: the diamond
  knocked it out, the type under it did not. Anything added to the chip
  keeps that ground. ⚠ It may be wider than the lane — the gutters are
  empty — but it must clear the content columns by ≥16px at 1280 (measured
  19 / 21 / 29), which is why `--vw-lane` is a CLAMP: at a flat 64px the
  clearance got WORSE as the viewport grew. The widest chip is the range
  (`//09 2014–17`) and it is what the gap, padding and tracking are tuned
  against. Square corners — chrome sits at 0 on ADR-065's depth ladder.
- **The run is REVERSE-chronological** (U2), opening on the Intelligence
  Architect seat dated by the SEAT (2026), not the 2024 joining date, or a
  rail read downward prints 2024 above Thoughtform's 2025.
- **The film interlude is NOT a beat.** No chip, no ordinal, no side — and it
  is skipped by `useVoidwalkerScroll`'s marker walk and by the capture
  script: a `.vw-beat` query without `:not(.vw-beat--interlude)` hands the
  clock a phantom stop. It carries an opaque ground so the spine stops at it.
  ⚠ **The player is the ONE third-party frame on this site.**
  `lib/security/headers.mjs` names `youtube-nocookie.com` in `frame-src`
  (absent before U2, so it fell back to `default-src 'self'`), and
  `security-headers.test.ts` pins `frame-src`, `media-src` and the ABSENCE of
  the cookie-setting host. The iframe is built only inside `MediaLightbox`
  after a click — its `embed` branch is ADDITIVE and the `src` path stays
  byte-identical for the films and walkthroughs that share it. A new origin
  is a decision: measure it with `enforceCsp: true` before adding it.
- ⚠ **Grid rows are EXPLICIT** on the spine (2/4), the beats list (2) and
  the foot (3): auto-placement slid the list under the spine's span and the
  spine measured 0px. ⚠ **The right guard** (`--vw-guard`, 32px below
  1600px) keeps a full paragraph off the right-rail telemetry; the band's
  edge sits 10–22px inside the readouts at the laptop widths.
- ⚠ **On the phone band the FRAME carries the plate's aspect, not the
  plate** — a wrapped headline in the bar otherwise eats the drawing.

## Verifying

`npx vitest run tests/lib/voidwalker-*.test.ts` for the record, the clock,
the drawings and the tokens; `node scripts/capture-voidwalker.mjs --vp
1440x800 [--theme light]` (headed) for the seam, the masthead, every beat at
its reading line, the reversal and the six plates measured; the ring smoke's
"ambient hold survives" case for the cover.
