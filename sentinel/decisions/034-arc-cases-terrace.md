# ADR-034: Arc Cases Terrace — camera shifts right, one landscape screen rises from the topography; the orbit ring retires

**Date:** 2026-07-13
**Status:** Accepted (supersedes the ADR-033 orbit — its funnel
restructure and mobile/PRM story remain live)
**Scope:** `lib/arc-cases/terraceMath.ts` (+ `arcCasesLevelRef.ts`),
`lib/stores/arcCasesStore.ts` (simplified),
`components/landing/home-v2/arc-cases/**` (terrace components + bake),
`components/landing/home-v2/arcCasesTerrace.ts` (flag),
`components/landing/home-v2/DepthGatewayScene/FlyingCameraRig.tsx` +
`hooks/useWorldDomTracker.ts` (the lateral camera channel),
`DepthGatewayScene/substrateTerrain.ts` (heightfield extraction) +
`SubstrateTopography.tsx` (realm boost),
`DepthGatewayScene/sceneGeom.ts` (stack-label dim),
`CorridorStationHeaders.tsx` (caption iris),
`HomeCorridor.tsx` (CTA mount), `home-v2.css`,
`app/(internal)/test/arc-cases-terrace` (lab),
`tests/lib/arc-cases-terrace.test.ts`,
`tests/visual/arc-cases-terrace-smoke.spec.ts`.

## Context

ADR-033 put the four production cases (Mímir / Vesper / Babylon /
Heimdall) in an orbit ring around the Build-park sphere. Shipped same
day, rejected by the owner on sight of the interaction: the orbit is a
near-clone of the Services card ring (same `ringMath` orbital tracks,
same device slabs, same step-to-front) — the cases read as "services
again" instead of as proof of the Build claim.

The redesign keeps everything ADR-033 got right (click-owned + opt-in,
scroll gates rather than drives, deferred bake, the funnel restructure)
and replaces the REVEAL: instead of a second ring on the same rig, the
**camera itself moves**. Arming shifts the frame laterally right — the
sphere + stack drift to frame-left with the SURFACES fan still visible —
and out of the substrate topography (the ADR-018 realm, ~72% unfurled at
the park) **one wide landscape screen rises from the ground**, showing
one case at a time. The cases stand ON the layer, literally.

## Decision

**Flag:** `ARC_CASES_TERRACE` in `arcCasesTerrace.ts` (ON). Off restores
the pre-ADR-033 corridor byte-identically (every per-frame read
multiplies a literal 0; every mount is conditional). Gate
`ARC_CASES_MEDIA` carried over verbatim (≥1101×760, no reduced motion;
== the CTA layer's CSS hide — gate parity).

### 1. The lateral camera channel (the load-bearing new mechanism)

The corridor camera was a pure Z dolly (X = 0 end-to-end). The terrace
adds ONE additive channel: `arcCameraShiftX(level) = 2.1 × level`,
applied to **camera.position.x AND lookAt.x (equal shift — a pure
translation)** so forward stays −Z and every camera-space depth/focus
helper in `sceneGeom` remains correct WITHOUT knowing about the shift
(explicit non-edit). Applied in **ALL THREE FlyingCameraRig branches**
(corridor dolly / epilogue pose / exit-dissipate lerp — the branch
switch can happen mid-drain; additive-everywhere keeps it continuous)
**AND in `useWorldDomTracker.syncMirrorCamera`** (+ the forward-vector
lookAt re-read) — the DOM mirror and the R3F camera MUST read the same
channel or projected copy visibly slides off the canvas. Verified by
the labels-welded-to-pips probe at 1440.

**Invariant: any future lateral/vertical camera channel must be applied
in BOTH cameras.** This is the one place the "two cameras, one path"
contract (ADR-018) is intentionally parameterized.

The channel rides `arcCasesLevelRef` — single writer:
`ArcCasesTerraceScreen`'s useFrame at **priority −5** (after
MotionFollowerDriver −10, before the camera rig + topography at 0), so
camera and terrain read this frame's level. Level = damped arm level
(`dampLevel`, rate 2.2 — the ADR-033 clock) × the band factor. The
epilogue kill `[0, 0.1]` guarantees zero lateral residue long before
the planet flyover; the flag-off path is a literal 0.

### 2. The terrace screen

`ArcCasesTerraceGate` (media gate + band getter) mounts
`ArcCasesTerraceScreen` in `DepthGatewayScene/index.tsx` next to
`SubstrateTopography` — **world-fixed, NOT inside the pointer-look
instrument** (no armillary scale, no cursor tilt; it's a landscape
object like the terrain). Placement: `x 3.05, z INT_Z − 2.6`, grounded
ONCE on the actual heightfield via `terrainGroundY(x, z)`
(`substrateTerrain.ts` — `terrainHeight` + its constants extracted
behavior-identical from `SubstrateTopography` with the row mapping
inverted). 16:10 slab (`4.35 × 2.72`), slight yaw/pitch so it reads
planted, not billboarded.

Anatomy = the ADR-029/033 device slab re-scaled (chamfered
ExtrudeGeometry glass + EdgesGeometry glint + content planes + dot
veil; `RING_GLASS_*`/glint opacities imported from `ringMath`
unchanged). The whole group renders BELOW renderOrder 0 so later-drawn
terrain rows paint over it while translucent; **depth-write hysteresis
on the settled content plane only (opacity > 0.55)** — while rising the
terrain dots show through (the "emerging from the ground" read), once
settled it occludes cleanly.

**Rise:** `terraceRiseEnvelope(level)` — rise window `[0.05, 0.9]`,
fade `[0, 0.55]` (fade leads so the slab is visible while emerging),
`TERRACE_RISE_DEPTH 1.4` below the parked pose. Exact 0 at level 0,
identity at 1; disarm plays it backwards. While armed the substrate
realm envelope is boosted `max(scrollEnv, level)`
(`terraceRealmTarget`) so the ground fully resolves under the screen —
the cascaded followers chase the boosted target; scroll ownership
returns on disarm.

**Faces:** `caseScreenBake.bakeCaseScreenFace` — 1600×1000 landscape
(the shots are ~1.56:1): header chip row (filled gold codename +
`NN / 04 · STATUS`), dominant contain-fit gold-LUT screenshot with the
hairline frame hugging the DRAWN rect, dot-matrix veil re-profiled to
the band, one tight footer (mode · tagline / headline metric gold /
title runs em→gold / first 6 stack chips). The portrait card's subline
lede is dropped; still **no CTA box** (repos private). Deferred bake +
glEpoch re-bake carried over. **Stepping = crossfade**: two stacked
content planes, incoming damps in at rate 6, back plane adopts at
≥0.999; rapid stepping retargets the same damp (no queue, no rotation,
no wall-clock — ADR-021).

### 3. CTA + stepper (bottom-right rail cluster)

`ArcCasesTerraceCta` is one fixed cluster on the right-rail column
(`right: rail-row datum, bottom: hud-margin + 44px`), mounted in
`HomeCorridor` beside `CorridorProgressRail` — NOT in the station
headers. It drives its own opacity with its own rAF (the progress-rail
pattern): `smoothstep(0.885, 0.915, paintProgress) × (1 − BUILD_OUT) ×
!docked`, inert reconciled EVERY frame (a React re-render re-attaching
refs must never leave a stale inert behind the write-suppression — a
real bug found in build-out). Labels `VIEW THE CASES` ↔ `CLOSE`
(inverse video). The stepper (`◂ 01 02 03 04 ▸` — PT Mono, diamond
prev/next, active chip gold + underline = the right-rail signature)
renders above the chip (DOM order = focus order via `column-reverse`)
and rides the terrace level for its own opacity/inert. Auto-disarm
watcher carried verbatim: `beat !== "intelligence" || epilogue > 0.02
|| docked || !active`.

**Pointer-events carve-out:** the v7 right-rail aside (`.hud__rail--r`)
is a full-height `pointer-events: auto` strip under `.hud > *`, and it
swallowed the cluster's clicks (z-index can't win — the corridor tree
is a lower stacking context). `home-v2.css` now makes the right rail
aside + the register root pass-throughs, re-enabling only
`a`/`button` inside the register. The left rail (rolodex) is untouched.

**Store simplified:** `{ armed, slot, arm/disarm/toggle, step(dir),
select(slot) }` — the cumulative index + `shortestCaseDelta` died with
the physical ring (a crossfade has no "short way round").

### 4. Armed dims (labels only — the framing is the camera's job)

ADR-033 dimmed the whole SURFACES fan hard. The terrace keeps the
CANVAS streams/pips fully lit (the owner's framing: surfaces visible
frame-left) and dims only what collides: the stack-label DOM chips
(`gateStackLabel` in sceneGeom — surfaces ×`1 − 0.8·level`, sources
×`1 − 0.35·level`; their anchors project onto the middle of the
shifted frame, straight over the screen) and the caption card
(`CorridorStationHeaders` iris ×`1 − 0.8·level` — its footer band
otherwise overlaps the screen). ShellStack materials are back to
pre-033 (no armed dims).

### 5. Exclusivity + gating (carried over verbatim)

`arcBandFactor` = Build-band rise `[0.845, 0.9]` × epilogue kill
`[0, 0.1]`, × the dissipate guard `(1 − smootherstep(0, 0.15,
dissipate))` at the gate. The services ring needs dissipate ≥ 0.6 ⇒
`epilogueProgress ≥ 0.72`: **the terrace and the services ring can
never co-render** — same pin, new test file. No scroll writers, no
scroll lock, no backdrop (ADR-032 guardrails); no wall-clock motion
(ADR-021).

## Removal inventory (the orbit)

DELETED: `ArcCasesRing/ArcCasesHitAreas/ArcCasesGate/ArcCasesCta`,
`arcCasesOrbit.ts`, `lib/arc-cases/orbitMath.ts`,
`/test/arc-cases-orbit`, the orbit vitest + smoke. REVERTED to pre-033:
BrandmarkPhysicsCoreActor ring mount, HomeCorridor hit-areas mount,
CorridorStationHeaders CTA host, ShellStack armed dims,
`hologramConnectorStore.arcRingAnchors` slice, `.arc-cases-hits*` CSS.
EXTRACTED before deletion: the bake grammar (LUT, chamfer path, text
runs, veil, chip) → `caseScreenBake.ts`. UNTOUCHED: everything ADR-033
§5 (funnel arrays, register split, rolodex roster, exit seam) + the
mobile static chip row + `toolCardData.ts` (still the single canonical
case module) + `lib/services-ring/ringMath.ts` (still imported
unchanged; its pin stays green).

## Alternatives rejected

- Restyling the orbit in place (different radius/tilt/count) — the
  objection was the _pattern_, not the tuning.
- Mounting the screen inside the pointer-look rig — it would inherit
  cursor tilt + armillary scale; a landscape object should sit in the
  world like the terrain it stands on.
- drei `Html`/CSS3D for the screen content — the baked-CanvasTexture
  slab is the established, depth-correct, production-proven pattern
  (ADR-029/033); HTML-in-canvas would break the occlusion story.
- Rotating the lookAt less than the position (parallax charm) — it
  skews every projected DOM anchor direction-dependently; the pure
  translation keeps the mirror-camera contract trivial.

## Verification

Lab `/test/arc-cases-terrace` (real store + screen, level/placement/
shift sliders, ground grid at `terrainGroundY`, bake preview mode).
`tests/lib/arc-cases-terrace.test.ts` (20) pins damp/band/exclusivity/
shift/envelope/realm-boost/step-wrap. Smoke (6 structural): CTA band
arrival/inert, arm → CLOSE + stepper live (proves the R3F level writer
runs), step + select, close drains, scroll-out auto-disarm + clean
re-arm, mobile hidden. Manual at 1440: camera glides right with the
SOURCES/SURFACES label chips welded to their canvas pips through the
whole shift (the mirror-camera probe), screen rises from the resolving
terrain, all four faces crossfade, close reverses everything, epilogue
entry armed leaves no lateral residue. Corridor + services smokes:
same pass/fail set as the pre-change baseline (the 3 scan-notes
failures predate ADR-033 — see its Verification note).

## Updates

(none)
