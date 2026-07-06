# ADR-025: Services Hologram Stage

**Date:** 2026-06-24  
**Status:** Accepted  
**Scope:** `#services`, `/test/services-demo`, and the Services hologram lab.

## Context

The Services demo had a separate R3F hologram prototype, but its center artifact
was a simplified circle-plus armillary rather than the canonical Thoughtform
brandmark. The production Services stage also still used a 2D SVG orbit map
around a fallback particle mark, while the old fixed in-Services brandmark
runway had already been retired in ADR-021.

The desired direction is a section-owned retrofuturistic hologram: the real
brandmark as a minimal model-wire artifact, service orbits sharing the same 3D
camera, compact CV scan notes, and one expanded service card at a time.

## Decision

- The Services hologram samples `BRANDMARK_FULL_PATHS` through
  `sampleBrandmarkParticles({ basis: "model-wire" })`. The old circle-plus
  armillary is retired.
- The hologram and service orbits live in one R3F scene. Orbit lines render dim
  back passes and brighter front passes so they read as wrapping through the
  artifact.
- R3F publishes projected orbit-node anchors keyed by `ServiceId` through
  `hologramConnectorStore`; DOM scan notes draw connector lines to those live
  anchors.
- Services cards are represented as three compact curated scan notes plus one
  expanded full card. Clicking a note selects the active service.
- Production `ServicesStage` uses this canvas on desktop. Mobile and reduced
  motion keep the existing static brandmark/SVG orbit fallback and the same
  scan-card interaction.

## Guardrails

- Do not reintroduce `data-services-brandmark`, `data-services-pixelate`, or
  `CorridorSeamPixelField` on the production Services path.
- This hologram is section content mounted inside `ServicesStage`, not a fixed
  viewport brandmark actor and not part of the v7 global brandmark journey.
- Scan notes are curated static content for now. They deliberately do not call
  the survey or computer-vision APIs.

## Consequences

- `/test/services-demo` becomes the shared look-dev harness for the production
  Services stage.
- The old `ServiceCelestialCard` and SVG `ServicesOrbitMap` remain in the tree
  as fallback/compatibility surfaces, but the desktop production path is the
  R3F hologram plus `ServiceScanInterface`.
- Future tuning should happen in the hologram scene/sampler first, then be
  checked on both `/test/services-demo` and the homepage Services section.

## Update (2026-06-24): frontal pose · cascade orbits · cool core

> **Superseded by Update 2 below** for orbits + color + rotation. The frontal
> pose stands. Kept for the decision trail.

Vince found the shipped look "too offset" on the pose and the orbits
"discombobulated" (they didn't fit the style). The reference is the corridor's
"BUILD ON THE LAYER" cascading shells. Three refinements, all within the
hologram module:

- **Pose → more frontal.** `REST_TILT_X` −0.3 → **−0.13**, `REST_TILT_Y` 0.5 →
  **0.24** in `VolumetricBrandmarkArtifact.tsx`, now exposed as `restTiltX` /
  `restTiltY` props (lab sliders added) for by-eye tuning. Still a bounded 3/4
  pose — never edge-on (see `brandmark-3d-must-stay-legible`).
- **Orbits → coherent cascade.** `HologramOrbits.DEFAULT_ORBITS` was three rings
  on wildly different planes (X≈76° / X≈9°Y≈30° / X≈53°Z≈54°). Replaced with a
  **near-co-planar cascade**: a shared ~17° lean (small per-ring Z fan),
  graduated radii, slight `eccentricity` (0.9, new `OrbitConfig` field). Three
  rings carry a drifting service node + HUD anchor; **two decorative echo shells**
  (`node: false`, new field — drawn, no node/anchor) thicken the cascade.
- **Rotation about Z, not Y.** Co-planar rings rotated about world **Y** all
  collapse edge-on simultaneously at φ≈90° (a bright vertical "blink"). Rotating
  the cascade about the **view axis (Z)** keeps them as steady nested ellipses
  and preserves the baked front/back depth shading (Z-rotation doesn't change
  depth ordering). Speed calmed to 0.05.
- **Color → cool core + gold orbits.** `DEFAULT_COLOR` gold → **dawn `#ebe3d6`**,
  `DEFAULT_ACCENT` → cool white **`#f4f1ea`** (projected-hologram core); orbits
  stay gold, graduated opacity, with a faint dawn inner whisper. Decision recorded
  with Vince: "cool core + gold orbits."

The SVG `ServicesOrbitMap` fallback (`celestialData.ts`) was re-tuned to a
matching concentric cascade so mobile/reduced-motion reads the same.

**New guardrail:** when a ring set is co-planar, do **not** rotate it about Y —
use Z (view axis) to avoid the synchronized edge-on collapse.

## Update 2 (2026-06-24): Integrated 3D armillary (reverses the cascade)

The cascade above read as "two 2D SVGs around a 3D object… a glorified
PowerPoint" (co-planar concentric circles, a cool core that de-integrated the
mark, and a Z-spin that made the rings _gyrate their orientation_). Reverted in
favour of a genuine 3D **armillary**, confirmed with Vince.

- **Diverse FIXED planes.** `DEFAULT_ORBITS` is now an armillary centred on the
  mark: a wide near-horizontal orbit, a tall **vertical meridian** (tilt
  `[0, 1.3, 0]`), an inclined **diagonal**, a thin near-horizontal **Saturn
  waist-ring** anchoring the mark as the body, and a faint dashed outer ring.
  Tilts are deliberately diverse so the rings cross and weave THROUGH the mark
  (near arc in front, far arc behind). `buildRing` back-half floor dropped
  `0.3 → 0.16` for a stronger front/back depth read.
- **One rigid rig (the integration fix).** Rest pose + a damped pointer-look
  moved UP from the mark to a shared rig group in `ServicesHologramScene` that
  wraps BOTH the mark and the orbits — so they tilt together as ONE anchored 3D
  object. The mark no longer applies its own pose/parallax (optional self-spin
  only).
- **Motion = fixed planes + travelling bodies + pointer-look.** Orbit planes
  never rotate (the whole-group spin is removed); only the nodes travel along
  their fixed orbits (`bodySpeed` multiplier). The rig owns orientation.
- **Unified gold.** Mark reverted to gold (`#caa554` / `#e9c97a` accent); orbits
  stay gold. SVG fallback (`celestialData.ts`) restored to a diverse armillary in
  gold. Lab "Orbit spin" replaced by "Pointer-look" + "Body speed".

**Guardrails (supersede Update 1):** orbit planes are FIXED and diverse — never
co-planar, never gyrating; the mark + orbits live under ONE rig group and move
together; the system is all-gold (no cool core). The Update-1 "rotate co-planar
about Z" guidance is moot (there is no co-planar set, and nothing auto-rotates).

## Update 3 (2026-06-24): always-3D entrance + gated pointer-look

Two interaction refinements (Vince), both in the `#services` production path:

- **Pointer-look in production, gated to post-entrance.** The rig pointer-look
  (Update 2) now also runs in `#services`, but `ServicesHologramScene` holds the
  rig at its rest pose until the scroll entrance has fully settled (damped
  `--corridor-dissipate` ≥ 0.985), then engages pointer-look — so the fly-in
  plays cleanly and the "grab to rotate the whole instrument" only kicks in once
  it's rendered. Parked hosts (lab/demo, `entrance:"off"`) → pointer-look is
  always live.
- **Entrance is ALWAYS 3D.** New `entranceForm` prop on
  `VolumetricBrandmarkArtifact`: `"dome"` (default) keeps the corridor dome→
  wireframe morph; **`"wire"` (used by `ServicesStage`)** pins `uTransform=1` and
  zeroes the morph glitch, so the mark is the 3D wireframe throughout — it still
  _flies in_ via the opacity + scale (1.7→1) + haze-settle + scan envelopes, but
  never passes through the amorphous dome (which read as a flat/2D blob).

**Seam note (touches ADR-021/023):** the services mark no longer visually
continues the corridor sphere as a dome; instead the 3D wireframe fades+scales in
while the corridor sphere dissipates. This was the explicit ask ("the fly-in
should always be 3D"); the crossfade reads fine. **Verify the live corridor→
services seam by scrolling** (the corridor hijacks/pins scroll, so it can't be
driven by injected `scrollTo`/synthetic wheel — only real input or a manual
`--corridor-dissipate` scrub).

## Update 4 (2026-06-24): Blender-authored technical wire

The shipped brandmark read too flat and too bright compared with technical
wireframe references. The new direction keeps the all-gold armillary, but makes
the center mark less flashy and gives it a denser constructed-line read.

- Added `scripts/blender/build-brandmark-wireframe.py` and
  `npm run asset:brandmark-wire` to convert the provided Blender source
  (`Thoughtform Brandmark 3D.blend`) into
  `public/models/brandmark/brandmark-wire.glb`. The export duplicates visible
  curve/font/mesh objects, converts them to mesh, triangulates, applies a thin
  Wireframe modifier, adds a micro bevel, and exports a GLB.
- `sampleBrandmark3D` now accepts one geometry or an array of geometries, fits
  their combined bounds, and distributes wire/surface counts by edge length and
  surface area. This supports Blender exports that arrive as multiple mesh
  objects instead of a single merged mesh.
- `VolumetricBrandmarkArtifact` accepts `modelUrl`, `edgeThresholdDeg`,
  `blending`, and `wireStroke`. Production currently keeps the existing GLB as
  the safe fallback until the generated wire GLB exists, but uses a lower edge
  threshold for richer seams.
- Production and lab defaults now use normal blending, lower bloom, a dimmer
  metallic gold palette, thinner wire strokes, more wire points, and much less
  shell/surface haze.

Guardrail: do not point production at `BRANDMARK_WIRE_GLB` until the asset is
actually generated and checked into `public/models/brandmark/`; otherwise the
desktop Services canvas will suspend on a missing model.

## Update 5 (2026-06-24): extrusion struts + thicker engineering lines

The Update-4 runtime wire still read like two unconnected extrusion outlines:
the ring showed front/back circles, but not enough visible ribs between them.
The Services artifact now adds a dedicated `depthStrutCount` sampler pass that
buckets matching XY vertices and draws near-to-far connector particles through
the mesh's Z depth. These struts share the same morph, depth dimming, scan, and
wire shader as the main hard-edge points, so the brandmark reads as one
constructed 3D object rather than separate outline layers.

Production and lab defaults were also thickened: higher wire count, larger point
sprites, wider `wireStroke`, restrained normal blending, and lower bloom
threshold/intensity balance. The aim is a technical illustrated line object, not
a brighter additive glow.

## Update 6 (2026-06-24): distributed orbit labels + quieter relief

The stacked scan-note column plus always-visible lower-right expanded card made
the Services stage read like two UI systems over the hologram. The desktop
interaction is now three distributed orbit labels, each connected to its
projected 3D orbit node. Labels are compact and translucent by default; clicking
one expands the full service detail inline at that label, while scroll remains
only a soft focus signal and does not open text automatically.

The orbit recipe was also retuned for calmer depth: service rings now use more
distinct fixed planes, varied line weights, normal-blended strokes, lower
inactive node opacity, and two faint dashed latitude shells. The goal is a
technical armillary with relief, not a brighter or denser HUD overlay.

Guardrail: do not restore the desktop default bottom-right service card or the
stacked scan-note column. Full service copy should remain click-revealed from
the distributed orbit labels; mobile/reduced-motion may stack the same labels as
a simple accordion.

## Update 7 (2026-06-25): frontal production pose (corridor harmonization)

The corridor in-sphere brandmark (ADR-023) now lands on — and renders as — a
crisp wireframe of the SAME `brandmark.glb` mesh, head-on (its sword is locked to
the substrate sphere's vertical gimbal orbit). Against that, the Services
wireframe's 3/4 rest tilt (Update 1: `restTiltX −0.13`, `restTiltY 0.24`) made the
mark visibly rotate across the corridor→Services seam.

**PRODUCTION now uses a frontal rest pose** — `restTiltX={0} restTiltY={0}` on the
`<ServicesHologramScene>` in `ServicesStage.tsx` — so the Services wireframe faces
head-on like the in-sphere mark and the seam has no rotation pop. Depth still
reads via the wireframe's own Z-extrusion + the orbit armillary + the (still
active) damped pointer-look, so frontal does not flatten the mark into a decal.

**This supersedes the 3/4 parked pose FOR PRODUCTION ONLY.** The
`ServicesHologramScene` component defaults (`REST_TILT_X=-0.13`, `REST_TILT_Y=0.24`)
are unchanged, so `/test/services-*` labs keep the 3/4 look for by-eye tuning. The
corridor↔Services color is also harmonized in the same pass (the in-sphere
wireframe converges to this stage's `#b08b42`/`#dcc176` palette as it settles — see
[ADR-023](023-corridor-brandmark-physics-core.md) 2026-06-25 harmonization
follow-up). Guardrail: keep production frontal (`restTilt 0/0`) while the corridor
in-sphere mark is frontal; if a future change re-tilts one, re-tilt the other (and
re-check the sphere's sword↔vertical-orbit alignment).

### 2026-06-25 — production #services no longer self-renders (unification)

On the capable desktop path, `#services` no longer mounts its own R3F canvas.
The corridor's persistent brandmark core IS the centerpiece and a co-located
`CorridorArmillary` supplies the orbits in the SAME corridor canvas — one
continuous object, no crossfade (see [ADR-023](023-corridor-brandmark-physics-core.md)
2026-06-25 unification). `ServicesStage` gates its canvas on
`showServicesCanvas = useHologramCanvas && !UNIFIED_SERVICES_ARMILLARY`, keeps the
DOM scan UI (`ServiceScanInterface`) always, and keeps the mobile / reduced-motion
DOM+SVG fallback (`ServicesBrandmarkField` + `ServicesOrbitMap`) untouched. **This
stage's `ServicesHologramScene` / `VolumetricBrandmarkArtifact` remain the lab
harness** (`/test/services-demo`, `/test/services-hologram`) for tuning the look,
and the live armillary still imports `DEFAULT_ORBITS` + `HologramOrbits` from here.
The palette now flows from [`lib/home-v2/goldPalette.ts`](../../lib/home-v2/goldPalette.ts)
(`TENSOR_GOLD`/`TENSOR_ACCENT`, a touch more yellow than the former
`#b08b42`/`#dcc176`), shared by the mark, the orbits, and this stage.

### 2026-06-26 — animejs-style card stack + per-service rig rotation

The DOM overlay for `#services` moved from the scattered, click-to-expand
`ServiceScanInterface` orbit-labels to a **top-left collapsing card stack**
([`ServicesCardStack`](../../components/landing/home-v2/services/ServicesCardStack.tsx)),
inspired by animejs.com. The card whose index matches the scroll-driven
`.services-stage[data-active-step]` EXPANDS into a big title (service `name`) +
tagline + paragraph + meta + CTA; the others COLLAPSE to a slim index+name bar.
Expand/collapse is CSS-only (`.svc-stack` rules in `services.css`, keyed off
`data-active-step`); mobile / reduced-motion renders every card expanded.
`ServiceScanInterface` + `ServiceCelestialCard` are retained ONLY as the lab
harness (`/test/services-demo`, `/test/brandmark-reflective`).

The brandmark + armillary rig now **rotates to a distinct bounded pose per
service** so each reveal reads as a turn. The pose is a single source of truth in
[`lib/home-v2/servicePose.ts`](../../lib/home-v2/servicePose.ts) (`getServicePose`,
a symmetric ±yaw sweep through frontal with a small opposed pitch — `SERVICE_POSE_YAW_RAD`
0.34 ≈ 19.5°, deliberately bounded so the shallow-Z mark never tumbles edge-on,
per [`.claude/rules/brandmark.md`](../../.claude/rules/brandmark.md)). It is applied
in BOTH rigs to keep them in parity: the production corridor rig
([`BrandmarkPhysicsCoreActor`](../../components/landing/home-v2/DepthGatewayScene/BrandmarkPhysicsCoreActor.tsx),
composed into the `pointerLookRef` channel, **engaged only when parked** `recT > 0.9`
and damped to identity otherwise so the corridor stays byte-identical — ADR-023
Invariant 11) and the lab rig ([`ServicesHologramScene`](../../components/landing/home-v2/services/hologram/ServicesHologramScene.tsx)).
The active service is read from `hologramConnectorStore` (`activeServiceId`), the
existing cross-tree bridge `ServicesStage` already writes. Guardrail: keep the pose
amplitude bounded; raising it toward edge-on collapses the silhouette to a sliver.

### 2026-07-02 — scan interface promoted to production (spread CV-scan cards)

The desktop DOM overlay swapped BACK from the top-left card stack to
[`ServiceScanInterface`](../../components/landing/home-v2/services/ServiceScanInterface.tsx),
now scroll-driven: `ServicesStage` passes `expandedServiceId={activeServiceId}`
(controlled), so the card whose step matches the runway scroll EXPANDS and the
others sit as compact chips — Keynote top-left, Workshop bottom-left
(bottom-anchored so it grows upward and its connector exit stays fixed),
Embedded top-right. Leader lines land on points ON the brandmark wireframe
itself: `BrandmarkPhysicsCoreWithGLB` derives per-service group-local anchor
points from the sampled GLB homes (corner-direction extremes, so each anchor
sits on a real wireframe edge — `brandmarkScanAnchorsRef`), and
`CorridorArmillary` projects them to screen pixels each parked frame through a
probe group in the mark's `pointerLookRef` space (they ride the per-service
pose + pointer-look) and publishes to `hologramConnectorStore` (the Sutera
CV-scan look this interface was built for; the orbit-node anchor publishing in
`HologramOrbits` remains for the lab). Chip clicks smooth-scroll the page
to that service's runway segment (`selectService` in `ServicesStage`) — scroll
owns the state; in controlled mode the outside-click/Escape dismissal and
click-toggle are disabled (they remain for the uncontrolled lab harness at
`/test/services-demo`).

Card design upgraded to the dark-glass panel language (ADR-006 shadow stack,
12px blur at `rgba(10,9,8,0.85)`, gold corner bracket, PP Mondwest `__name`
headline via `--font-display`, IBM Plex Mono data via `--font-mono` — the dead
`--font-pt-mono`/`--font-pp-neue-montreal` vars are gone from the orbit-label
block). Expansion animates via `grid-template-rows: 0fr→1fr` (detail is always
in the DOM; no mount pop).

`ServicesCardStack` (`.svc-stack`) is DEMOTED to the mobile / reduced-motion
surface only — `ServicesStage` renders it when `useHologramCanvas` is false;
its desktop `data-active-step` expand rules were removed from `services.css`.

**Guardrail — scroll anchoring:** the step-flip expand/collapse changes element
heights inside the pinned stage, which Chrome's scroll anchoring "compensates"
by yanking `scrollTop` back across the step boundary (the section becomes
un-scrollable past step 1). `services.css` excludes the whole runway subtree
(`.services-stage-root, .services-stage-root *`) with `overflow-anchor: none`;
keep that rule when touching the runway DOM.

## Update 8 (2026-07-06): wireframe seeds + structural armillary

The collapsed signal-plate seeds read as dark glass dimmed to 55% — they faded
away instead of belonging to the scene, and Vince asked for a wireframe version
aligned with the mark ("blend in better with the background") while questioning
whether the orbit rings were needed at all. The redesign moves the seeds into
the **diagram layer** (gold hairlines — mark, rings, connectors) and keeps the
open plate as the only **matter** (glass, photo, dawn text): "one instrument;
the open card is the only matter."

- **Seeds = schematics** (`data-variant="wireframe"`, default in production
  via `ServicesStage`; `glass` retained as the regression reference —
  switcher at `/test/services-prime`): whole-plate `opacity .55/.85` dim
  deleted (recession by material, not alpha); body = whisper void
  `rgba(8,7,6,.18)` + `backdrop-filter: blur(0px)` (NOT `none` — `none`
  doesn't interpolate to the open `blur(16px)`); shell gradient at whisper
  alphas (same 4-stop/168° structure so the open interpolation is unchanged);
  scanlines off; seed title `--dawn-60`; halftone band re-graded to gold
  specimen (`sepia(1) hue-rotate(-8deg) saturate(2.2)…` at 0.2, hover 0.4,
  scrim off) — the 4px photo dots read as the mark's particle ink.
- **Dotted chamfer outline** = `PlateWireOutline` SVG (a CSS border would be
  shaved by the `__sh` clip-path — the ADR-007 polygon-border class of bug),
  sibling AFTER `__sh`, `stroke-dasharray: 3 7` (scan-connector grammar) at
  gold 0.35 (hover 0.6), two 3px diamond ticks at the chamfer midpoints.
  **ResizeObserver gotcha:** RO never delivers a usable contentRect for an
  `<svg>` element — observe the HOST PLATE and read `offsetWidth/Height`
  (transform-free) in the callback.
- **Materialization = crossfade handoff**: on open the outline fades out in
  0.14s and the existing rectangular echo frame (`::before`, inset −7px)
  fades in at its existing 0.22s delay; close reverses with the outline
  returning only after the chamfer lands back at 16px (0.26s delay). The SVG
  never animates with `--ch`. A single morphing outline was rejected: CSS
  can't transition polygon points, and chamfer↔rect would need a per-frame
  JS writer against three concurrent CSS transitions.
- **Title scramble-decode on open** (wireframe-scoped): the open C3
  `.svc-plate__title` decodes via the corridor caption kernel
  (`lib/home-v2/captionScramble.ts`, untouched) driven by a self-terminating
  rAF loop in `ServicePlateCard` (~1s per open; no services-side ticker
  exists to reuse). Start +0.18s lands the first resolved chars with the
  `__fx--d2` rise; close/reduced-motion cancels and restores the title.
- **Armillary → `STRUCTURAL_ORBITS`** (production, `CorridorArmillary`):
  waist ring + workshop's meridian plane re-id'd `shell-meridian`
  (`node:false`, 0.5/1.8). The three service rings + three echo shells are
  retired from production: their anchor role moved to the mark's own
  wireframe points on 2026-07-02, and the active-ring highlight duplicated
  the per-service rig pose. `OrbitConfig` gained an optional `reveal` window
  (the index-based `REVEAL_WINDOWS` stagger is coupled to the seven-ring
  order); unset = index fallback, so `DEFAULT_ORBITS` stays byte-identical
  as the LAB set (`/test/services-demo`, `/test/services-hologram` keep the
  full armillary + orbit-node `publishAnchors`). `activeServiceId` stays
  wired (inert against structural rings; future-proof).
- **SVG mobile fallback recorded lab-only**: production mobile (<961px) is
  the stacked plate accordion — `ServicesOrbitMap`/`ServicesBrandmarkField`
  render on no production path (only `/test/brandmark-reflective`), so the
  Update-2 "SVG fallback parity" clause is N/A until a mobile orbit surface
  returns. `celestialData.ts` unchanged.

Guardrails: scroll contract (`--svc-arrive*`, `--svc-content-in`,
`data-active-step`) and the grid-rows collapse mechanics untouched; the open
plate gets NO variant overrides (it must stay the C3 glass); keep the glass
variant rendering pixel-identical while it remains the regression reference.
Known pre-existing issue (both variants, flagged separately): on viewports
under ~1000px tall the open keynote plate overlaps the bottom-anchored
workshop seed.
