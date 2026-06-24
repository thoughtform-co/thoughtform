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
