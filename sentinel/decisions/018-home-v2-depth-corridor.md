# ADR-018: Home V2 Depth Corridor

**Date:** 2026-05-21
**Status:** Proposed
**Scope:** `/test/home-v2` only — the production homepage (`/`) is untouched.
**Related:**
[ADR-008 — Landing v7 background layers](008-landing-v7-background-layers.md),
[ADR-013 — Brandmark journey refactor](013-brandmark-journey-refactor.md),
[ADR-015 — Brandmark vector-first](015-brandmark-vector-first.md),
[ADR-017 — Orbit journey + substrate-sphere morph](017-orbit-journey-and-substrate-morph.md).

---

## 2026-06-06 Revision — Wrap-around shell + traveling brandmark + brain artifact

User feedback after the lab-match shell landed: the cage + orbits feel
like they "fight through the brand mark" instead of "wrapping around"
it; the substrate dodecahedron should be one solid abstract artifact
(a brain) rather than a generic geodesic; the constellation should
appear a tad sooner; and the brandmark should be a particle cloud the
moment 3D travel starts, not a DOM glyph that hands off only at the
Build climax. Five-phase revision, all landing in one pass:

### Phase 1 — Encode constellation: wrap + arrive sooner

- `CORRIDOR_TIMELINE.accretion.sources` shifted earlier from
  `{ start: 0.55, peakAt: 0.62 }` to `{ start: 0.47, peakAt: 0.57 }`
  so the orbits begin folding inward BEFORE the Encode park arrival
  rather than landing simultaneously with it. By the time the
  "Encode the judgment." title settles, the constellation is already
  wrapping the mark.
- `ShellSources` swapped from `petalEmerge` to the new `foldEmerge`
  (see Phase 3) so each orbit sub-group's scale starts at
  `FOLD_OVERSHOOT` (1.45x) and closes in to 1.0 — orbits arrive from
  beyond the mark and seat onto their final radii rather than
  inflating through the mark from its centre.

### Phase 2 — Drop the dawn inner geodesic

The faint dawn inner geodesic inside the gold cage was competing for
attention with the brand mark + substrate morph at the centre.
Removed from `ShellSubstrate`; `SUBSTRATE_INNER_RADIUS` retired from
`shellGeom.ts`. (Superseded by Phase 5's brain swap anyway, but the
intermediate state is buildable on its own.)

### Phase 3 — `foldEmerge` (wrap-around envelope)

New `foldEmerge(reveal): { scale, positionFactor }` helper in
`shellGeom.ts`. Each element appears at scale `FOLD_OVERSHOOT = 1.45`
(clearly outside its final radius) and closes in to scale 1.0 via
smootherstep, with a brief 12% entry ramp from 0 → 1.45 so the
oversized state is visible but doesn't pop. Material opacity stays
constant throughout — brandmark Principle 4 (`brandmark-choreography`
skill) honoured by keeping every transition geometric.

Applied to:

- `ShellSubstrate` cage group (uniform scale).
- `ShellSources` per-orbit sub-groups (uniform scale).
- `ShellSurfaces` outer geodesic (uniform scale) and per-port
  sub-groups (positionFactor multiplier on final ring position, so
  ports overshoot beyond the ring radius and settle inward).

### Phase 4 — Traveling brandmark cloud (REVERTED on user feedback)

Phase 4 originally promoted the substrate `SubstrateMorphCloud` to a
TRAVELING brandmark cloud mounted at scene root, with a tight cut
from the DOM glyph at corridor entry so the mark travelled as
particles end-to-end. Shipped, but reverted on user feedback the
same day — the brandmark belongs on the DOM layer across travel and
only hands off to particles at the Build substrate morph (the
original ADR-017 pattern). State of the world after revert:

- `SubstrateMorphCloud` lives inside `IntelligenceGate` again,
  anchored at `STATION_INTELLIGENCE.position + [0,0,0.1]`. Drives
  `uPresence` + `uShapeMorph` from `getIntelligenceSubstratePresence`
  (depth-approach during late passthrough-02, morph envelope during
  the intelligence beat).
- `ProjectedBrandmarkActor` consumes
  `getIntelligenceSubstratePresence(transform).morph` for its DOM
  fade-out — fade engages only when the substrate cloud is actively
  losing the brandmark silhouette for the Fibonacci sphere.
- `TravelingBrandmarkCloud.tsx` is deleted; the
  `BRANDMARK_PARTICLE_CUT_START/END` constants and
  `getBrandmarkParticlePresence` were removed from `sceneGeom.ts`.
- Phases 1, 2, 3, 5 of this revision (constellation timing, dropped
  dawn inner geodesic, `foldEmerge` envelope, brain artifact) are
  retained.

### Phase 5 — Brain artifact (replaces the geodesic substrate cage)

The gold geodesic cage was the most generic piece of the shell — at
parked viewing distance it reads as "a wireframe sphere", not as
"the intelligence". Replaced with a procedural BRAIN ARTIFACT:

- New `lib/brandmark/sampleBrain.ts` samples two ellipsoidal
  hemispheres (separated by a longitudinal-fissure gap along X) on
  a Fibonacci-spiral lattice and displaces each point along the
  ellipsoid normal by multi-frequency 3D pseudo-noise to produce a
  roughened sulci surface. Returns ~1800 desktop / 900 mobile
  surface points + 480 / 220 nearest-neighbour synapse links.
- New `shaders/brainCloud.ts` paints soft additive gold dots with
  per-particle twinkle (same dot family as `brandmarkCloud`, minus
  the brandmark/sphere morph machinery).
- `ShellSubstrate` re-implemented to render `<points>` for the
  brain cloud + `<lineSegments>` for the synapse links. Folds in
  via `foldEmerge` on the same `accretion.substrate` reveal window,
  with the synapse hairlines ramping their opacity over the first
  40% of reveal so they don't pop in at scale 1.45 (the brain
  silhouette POINTS stay at constant alpha — Principle 4; the
  synapse decoration is outside the silhouette so a brief opacity
  ramp on them is the readable surface).
- `SUBSTRATE_CAGE_RADIUS` (0.7) is retained as the source-orbit
  CLEARANCE radius — the brain's max extent is ~0.55 so the
  constellation still has the documented breathing room.

NOTE: the brain is a SUBSTRATE-LAYER ARTIFACT, not a brandmark
painter. The "three painters max" rule from the `brandmark-particle`
skill counts atmosphere + silhouette + substrate-morph as the
brandmark's painters; the brain is part of the accretion shell
around the mark, the same way the source orbits and surfaces ports
are. It does not count against the brandmark painter cap.

### Phase 5 follow-ups (2026-06-06, same day)

- **Larger + smoother first pass.** Ellipsoid radii bumped and sulci
  amplitude + jitter reduced so the point-cloud brain read less
  noisy.
- **Shell-wrap emerge.** The brain originally used `foldEmerge`,
  which starts at scale 0 (a point at the mark centre that balloons
  outward) — it read as "appears from the back and grows through the
  mark." Replaced with `shellWrapEmerge` (`shellGeom.ts`): the shell
  starts LARGE (`SHELL_WRAP_START_SCALE` 1.85x, already surrounding
  the mark) and only ever CONTRACTS inward to scale 1.0, faded in via
  a `presence` (opacity) ramp so the large starting shell doesn't
  pop. Reads as a shell closing around the mark from outside in 3D.
  `foldEmerge` is retained for the source orbits + surfaces ports.
- **Low-poly mesh (final).** The dense point cloud + synapse web
  still read as busy; the request was for a minimalist "reduce the
  polygon count in Cinema 4D" look. `sampleBrain.ts` was rewritten
  from `sampleBrainPoints` / `buildSynapseLinks` to `buildLowPolyBrain`,
  which deforms an icosahedron (detail 1 desktop / 0 mobile) into a
  brain (ellipsoid + central fissure + lobing noise) and returns
  `faces` / `edges` / `nodes` geometries. `ShellSubstrate` renders a
  gold wireframe (primary) + faint facet fills + small vertex nodes,
  sized a touch larger (radii 0.62 / 0.52 / 0.8, max extent ~0.85
  still inside the 0.88 nearest-orbit clearance). The `brainCloud`
  shader was deleted.

---

## 2026-06-05 Revision — Lab-match shell (icosphere substrate + per-station parkDistance)

User direction after reviewing both the corridor and the standalone lab
`/test/intelligence-artifact` Shell variant: "I really want to be as
close as possible to this. The corridor substrate cage suddenly reads
busy / less elegant than the lab's, and the corridor artifact is too
zoomed in." Two changes land it:

- **Substrate cage swap: dodecahedron -> geodesic icosphere.**
  `ShellSubstrate` previously decomposed a 12-face dodecahedron into
  per-face pentagonal petals that unfolded one-at-a-time. Replaced with
  the standalone shell artifact's exact composition: a single
  `buildGeodesicEdges(SUBSTRATE_CAGE_RADIUS, 1)` icosphere (80 fine
  triangular faces, gold) + a fainter `buildGeodesicEdges(SUBSTRATE_INNER_RADIUS,
2)` dawn inner geodesic. Emerges as ONE CLEAN BODY via
  `splitEmerge(reveal)` — no per-face petals (the source orbits + port
  pips keep their per-element unfold so the accretion narrative still
  reads). `shellGeom.ts` lost `buildDodecahedronFaces`,
  `DodecahedronFace`, and `SUBSTRATE_DODEC_DETAIL`; `SUBSTRATE_DODEC_RADIUS`
  was renamed to `SUBSTRATE_CAGE_RADIUS` (value unchanged at 0.7 so the
  1.27x wrap around the 0.55 morph sphere holds).

- **Per-station `parkDistance` for shell oversight.** New optional
  `parkDistance?: number` field on `StationNode` + `TransitionWaypoint`
  in `corridorMap.ts`, defaulting to `GATE_PARK_DISTANCE` (4.5). The
  shell parks (`navigate`, `diagnostic`, `intelligence`) set it to 6.2,
  which pushes their gates ~1.7 deeper in world Z. The camera path is
  unchanged, so the camera ends up further from the parked gates — the
  composition reads with breathing room instead of filling the
  viewport. The setup beat (`thoughtform`) + waypoint (`interstitial`)
  keep 4.5 so the opening compass composition stays tight.

  `gateZAtParkProgress(parkProgress, parkDistance = GATE_PARK_DISTANCE)`
  takes the distance; `STATIONS` passes each node's value through; the
  resolved `GateStation` carries `parkDistance` as a first-class field
  so downstream consumers (brand-mark lead math, copy anchor reference
  distances) don't hardcode 4.5. Specific ripples in `sceneGeom.ts`:
  - `PARK_LEAD` in `getBrandmarkLeadWorldPosition` re-based on
    `STATION_DIAGNOSTIC.parkDistance - 0.1` so the brand mark still
    coincides with the orbital field plane at the Encode park centre.
  - `navigate.*`, `diagnostic.*`, `intelligence.*` copy anchors:
    `perspectiveScale.referenceDistance` + `depthFade.far` now derive
    from each station's `parkDistance` so titles keep their parked
    apparent size and don't clip at the deeper gates.

- **`AstrogationField` deep extension.** The Build station moves from
  Z≈-17.85 to Z≈-19.55 after the pull-back, and the previous deepest
  seed sat at Z=-12.5 — two additional seeds at Z=-16 and Z=-19 keep
  the deep flight from reading as a void. (Same ADR-018 absolute-Z
  caveat documented in earlier revisions: `AstrogationField` is the
  only consumer keyed to absolute Z, all other layers derive station
  positions from `STATIONS` and follow automatically.)

Walls / wormhole rails / corridor environment / camera path / brand
mark journey / lab `NestedShellSphere` are untouched. Only the
corridor's substrate cage + per-shell-park camera framing change.

---

## 2026-06-05 Revision — Petal-unfold accretion (per-element origami emerge)

The first shell-into-corridor pass below uniformly scaled each layer
from a single point during the preceding transit (substrate started
emerging at progress 0.22 mid-pass-01a). Combined with the camera
dolly, this read as "the cage is coming from a distance" — the layer
appeared to fly in from afar instead of forming around the mark.
Follow-up pass replaces the uniform scale with **per-element petal
unfold** at each park arrival:

- **Per-element decomposition.** `ShellSubstrate` decomposes the
  dodecahedron into 12 pentagonal face sub-groups (new
  `buildDodecahedronFaces(radius)` helper in `shellGeom.ts` — sources
  the canonical vertex set from `THREE.DodecahedronGeometry`, clusters
  triangles by face normal, angle-sorts the 5 pentagon vertices around
  each centroid). `ShellSources` wraps each of its 6 orbits (ring +
  pip) in its own sub-group. `ShellSurfaces` keeps the outer geodesic
  - equator as a uniform-scale backdrop but wraps each of the 6 port
    pips in its own sub-group.

- **Origami unfold per element.** At reveal 0 every sub-group sits at
  the brand mark center collapsed (position 0, scale 0). As its
  per-element reveal ramps, the sub-group's position lerps from
  `(0,0,0)` to its final outward centroid / ring position AND its
  scale lerps 0 → 1, both on the same smootherstep curve. Reads as
  origami petals opening around the mark.

- **Staggered cascade.** Per-element reveals are STAGGERED inside the
  parent layer reveal window via new `petalStagger(reveal, idx, total,
overlap)` helper. With `overlap = 0.55` and 12 faces, each face's
  window spans ~17% of the parent reveal and neighbours overlap by
  ~55% — reads as a cascade through all 12 faces, not a slow
  one-at-a-time parade or a uniform burst.

- **Reveal windows late-bound to park arrival.** `CORRIDOR_TIMELINE.accretion`
  windows tightened to deploy AT each phase park instead of during
  the preceding transit: `substrate: 0.28→0.36` (Navigate park 0.34),
  `sources: 0.55→0.62` (Encode park 0.60), `surfaces: 0.84→0.91`
  (Build park 0.92). Each layer now snaps open as the mark arrives
  at its phase, while the camera has stabilised around the parked
  composition.

- **Inner geodesic + outer geodesic** stay on the legacy uniform
  smootherstep scale (`splitEmerge`, kept as an alias of
  `petalEmerge(reveal).scale`) — they are faint structural backdrops
  and decomposing 20 icosahedron faces would read as visually busy
  at the corridor's read distance.

**Companion NavigateGate cleanup** (same pass): the outer rotated
square armature + corner bearing ticks were removed because they
read as a competing frame around the brand mark + accreted shell
dodecahedron, which together already give the eye plenty of
structure to anchor on. The gate keeps its compass cross + tilted
mid-ring + centre diamond as its Navigate signature.

**New tuning knobs (`shell/shellGeom.ts`):**

| Knob                                                                                     | Effect                                                                                                                                                     |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `petalStagger`'s `overlap` arg                                                           | 0 = strict round-robin (faces unfold one at a time), 1 = uniform (all faces unfold together). Current values: substrate 0.55, sources 0.60, surfaces 0.55. |
| `CORRIDOR_TIMELINE.accretion.{layer}.start`/`peakAt`                                     | The parent window each layer's per-element stagger lives inside. Tighter = snappier deploy.                                                                |
| Per-element `localVertices` / `centroid` (substrate) and `portFinalPositions` (surfaces) | Final outward positions the petals travel to. Element index also controls stagger order — earlier indices unfold first.                                    |

---

## 2026-06-05 Revision — Shell-into-corridor (intelligence-layer artifact as the climax)

The brandmark accretion shell that wrapped the travelling mark with
generic decorative layers (`navigateHalo` ring + `encodeNodes` point
cloud + `buildSurfaces` interface planes) is replaced with an
**inside-out reconstruction of the intelligence-layer `shell` artifact**
prototyped at `/test/intelligence-artifact`. Each flywheel phase adds
the next layer of the shell around the guiding-star brandmark, and at
the Build landing the shell is fully assembled around the substrate
sphere — the climax of the corridor is the same artifact the
intelligence-layer lab presents in isolation.

**Three layers, inside-out:**

1. **Substrate core** (`ShellSubstrate`, Navigate adds) — a true 12-face
   golden `DodecahedronGeometry` cage (radius 0.95) + a fainter dawn
   icosahedron-edge geodesic (radius 0.74) sitting in the gap between
   the substrate sphere and the cage. Wraps the brandmark from the
   Navigate park onward.
2. **Source orbits** (`ShellSources`, Encode adds) — a solar-system of
   six 3D-inclined elliptical orbits (`SHELL_ORBITS` in
   `shell/shellGeom.ts`; rx 0.95..1.50, eccentricity 0.4..0.95, XYZ
   Euler tilts spread across every axis so the orbits visibly cross
   when viewed face-on). Each carries a green/gold/dawn diamond pip
   that revolves at its own period + direction + phase. Replaces the
   four flat coplanar ellipses of the retired `DiagnosticOrbitGate`
   _and_ the single Saturn-style band of the lab's `NestedShellSphere`
   sources.
3. **Surfaces skin** (`ShellSurfaces`, Build adds) — the dawn outer
   geodesic (radius 1.85, fits the gate `halfExtent` 2.0) + a faint
   equator hairline + 6 port-pip diamonds. Mirrors the standalone
   `NestedShellSphere`'s surfaces composition.

**Single carrier.** All three layers live inside the existing
`BrandmarkAccretionShell` — its parent group still tracks
`getBrandmarkWorldPosition(paintProgress)` per frame, so the whole
shell follows the mark through Lead mode. Each layer reads the depth
store + accretion helper inside its own `useFrame` (the established
gate-component pattern), and applies geometric **scale-emerge** via
`splitEmerge(reveal)` — brandmark Principle 4 (`brandmark-choreography`
skill): decorations emerge geometrically via scale, NEVER via opacity.
Once revealed, every layer **persists** so the assembled shell stays
present at landing and the `SubstrateMorphCloud` (substrate sphere)
takes over the silhouette at the centre without losing the
surrounding cage / orbits / skin.

**Wiring deltas:**

- `CORRIDOR_TIMELINE.accretion` re-keyed `{ navigateHalo, encodeNodes,
buildSurfaces, buildSubstrateBlend }` → `{ substrate, sources,
surfaces }`. `getBrandmarkAccretionLayers` returns the new triple.
  The previous `buildSubstrateBlend` fade-out is gone — the outer
  surfaces skin sits at radius 1.85, well outside the 0.55 substrate
  sphere, so no fade is needed at the morph handoff.
- `DiagnosticOrbitGate` retired (deleted). The Encode station's
  constellation is now the accreted `ShellSources` — the brandmark
  coincides with the Diagnostic gate plane at park
  (`getBrandmarkLeadWorldPosition`) so the orbits read as centred on
  Encode.
- `BuildArtifact` + `EncodeToBuildStreams` retired (deleted). The
  holographic grid pedestal + descending streams were a placeholder
  for the climax; the assembled shell wrapping the substrate sphere
  IS the climax now. `IntelligenceGate` keeps `SubstrateMorphCloud`
  alone as the centre.
- `GatewayWorld` updated to omit `DiagnosticOrbitGate`; remaining
  gates unchanged.

**Geometry / colour reuse.** The new `shell/` components reuse the
dependency-free geometry + material builders + colour tokens from the
standalone lab (`components/landing/intelligence-artifact/artifactPrimitives.ts`

- `artifactGeom.ts`) so the lab page stays the canonical reference
  for the artifact's vocabulary. The standalone `NestedShellSphere`
  intentionally still uses its single-Saturn-ring sources composition
  — the corridor's solar-system table is corridor-tuned; both share the
  same `buildTiltedRingLineLoop` helper from
  `components/landing/v7/intelligence-layer/celestialRingUtils.ts`.

**Untouched contracts.** Camera path, corridor topology
(`corridorMap.ts`), wormhole walls + apertures + topographic shelves +
intergate debris + latent field tunnel + celestial motes + scroll
streaks + thoughtform atmosphere + static starfield are all
**byte-identical** — the walls / environment the user explicitly
called out as the part they love stay exactly as they were. Only the
accreted shell + the two retired gate-side composites change.

---

## 2026-06-02 Revision — Corridor world expansion (walls / orbit-capture / Build artifact)

A creative expansion that deepens the corridor's narrative architecture
on top of the Navigate / Encode / Build remap. Five moves:

1. **Spatial extension.** `CAMERA_END` deepened `-8 → -11.5`
   (`corridorMap.ts`). Because every gate Z re-solves from
   `gateZAtParkProgress` and all choreography is **progress-keyed**
   (`CORRIDOR_TIMELINE` windows in 0..1), deepening the dolly only
   stretches the _world_ spacing between beats — timing stays valid.
   The front Navigate legs were re-split `12/12/8 → 10/11/11` (sum still 32) to widen the Navigate→Encode approach **without touching any
   `diagnostic`-onward window**, preserving the timeline invariant
   exactly (the load-bearing constraint documented in the 2026-06-01
   declarative-map revision). **Caveat:** `AstrogationField`'s seed
   positions are the one corridor consumer keyed to **absolute Z** (not
   the map) — two deep seeds (~-7, -9) were added by hand so the new
   deep Build run isn't an empty void. Any future `CAMERA_END` change
   must re-check those seeds.

2. **Navigate copy** → "AI isn't software. It's intelligence that sits
   between _tool_ and _collaborator_." The em-tinted _tool_ /
   _collaborator_ tie structurally into move 3.

3. **Tool / Collaborator wormhole walls.** `LatentWormholeWalls` now
   diverges by hemisphere end-to-end: the LEFT (−X) is a rigid cool-steel
   "Tool" lattice (straight rails + horizontal cross-rungs), the RIGHT
   (+X) an organic warm "Collaborator" flow (curved, jittered rails). A
   new `aSide` attribute (0=tool, 1=collab) + `uTime` uniform drive a
   small radial **breathing** displacement on the right side only. The
   brandmark + copy travel the X≈0 seam between the two walls, so the
   metaphor is structural, not labelled.

   **Contract note — narrows the 2026-05-25 "Wormhole wall topology"
   idle-motion clause.** That revision stated the walls "do not rotate,
   pulse, or drift on their own; only the camera moves them." This
   revision deliberately makes a **scoped exception**: the Collaborator
   (right) hemisphere breathes (~0.045 world units, shader-only) to
   express the organic metaphor. The Tool (left) hemisphere, apertures,
   and shelves remain perfectly rigid / camera-only. Idle motion at
   _gates_ (orbiting pips, rotating side bodies) was already established
   precedent; this extends a small, intentional pulse to one wall.

4. **Tacit-knowledge orbit capture** (`TacitKnowledgeOrbits`, new, mounted
   after `GatewayWorld`). Tacit words (judgment, taste, instinct, …) drift
   in along the Navigate→Encode leg and are captured into three tilted
   orbits around the Encode station via a per-fragment capture factor `c`
   (from camera forward-depth to the station) with a decaying tangential
   swirl so they spiral in rather than slide. Words render as per-word
   billboard sprites (tightly-sized canvas textures — the square token
   atlas would squish them). Fades out once the camera passes Encode.

5. **Build artifact + Encode→Build streams** (`BuildArtifact`, new). A
   wireframe grid pedestal + floating panels + sphere→grid descending
   streams boot up around the substrate sphere as it forms (grid/panels
   ∝ substrate `presence`, streams ∝ `morph` from
   `getIntelligenceSubstratePresence`); mounted **local** to the
   Intelligence gate group. Separately, `EncodeToBuildStreams` (world-
   space, top-level mount) drifts gold/dawn motes from the Encode station
   to the Build station across passthrough-02 so the encoded examples
   visibly stream into the artifact, with a depth-focus window on the
   stream midpoint for emerge/dissolve. All artifact alpha ceilings are
   low so the substrate sphere stays the focal point.

All new layers honour the world-fixed model (geometry generated once;
visibility from progress + camera-space depth) except the single scoped
wall-breathing exception noted in move 3. Mobile-narrow viewports skip
the walls, orbit-capture, and Build artifact (matching the existing
`LatentTopographyContours` gate).

**Follow-up (same revision) — user-review cleanup.** On first preview the
expansion read as cluttered and overboard. Per user direction:

- **Move 3 (walls) REVERTED.** `LatentWormholeWalls` was restored to its
  pre-revision state — the original uniform dawn/gold wormhole. The
  tool/collaborator hemisphere divergence + the `aSide`/`uTime` breathing
  are gone, so the 2026-05-25 "Wormhole wall topology" idle-motion clause
  is **fully back in force** (no self-motion; camera-only). The Navigate
  copy (move 2) stays, but `tool`/`collaborator` no longer have a wall to
  tie into — purely a copy emphasis now.
- **Move 4 (tacit words) REMOVED.** `TacitKnowledgeOrbits` deleted — the
  big legible word sprites overwhelmed the Encode read and bled to other
  stations.
- **Side bodies REMOVED.** The pre-existing flanking Fibonacci-sphere
  "side bodies" (`IntelligenceGate` `SideBody`, + `getIntelligenceSideBodyPresence`
  usage) were deleted; they competed with the substrate sphere and were
  unwanted.
- **Move 5 (Build artifact) PARED BACK.** The floating wireframe panels
  read as ugly empty rectangles and were removed; the grid pedestal +
  descending streams + `EncodeToBuildStreams` remain. Proper holographic
  panels (matching shared reference images) are a pending rebuild in
  `BuildArtifact`.

Net surviving from this revision: the deeper `CAMERA_END` + front-leg
reweight (move 1), the Navigate copy (move 2), and a pared-back Build
artifact (grid + streams, panels pending).

---

## 2026-06-01 Revision — Declarative corridor map + Navigate / Encode / Build remap

Two changes: a structural refactor (the corridor topology becomes
data-driven) and a content remap onto the strategy's Navigate → Encode
→ Build spine. The opening "AI collapsed the distance between thought
and form" setup beat — spine copy, brandmark-to-center pan, compass —
is **unchanged**.

**Declarative corridor map (`lib/home-v2/corridorMap.ts`).** The
corridor is now a single ordered list of `station` / `transition`
nodes. Everything structural DERIVES from it: the `Beat` union,
`BEAT_WINDOWS`, `BEAT_PARK_CENTRES`, `SECTOR_LABELS`, the solved gate
`STATIONS` (world-Z via `gateZAtParkProgress`), `DOLLY_HOLD_END`, and
`resolveBeat`. The camera-path constants + math helpers moved into this
kernel so the store (which re-exports the beat symbols for back-compat)
and `sceneGeom` (whose `STATION_*` are now aliases of the solved
stations) both consume it without a cycle. Adding / moving / reweighting
a landmark is a data edit. The extraction reproduced the prior 5-beat
topology byte-for-byte (weights `[14,32,14,16,24]` → windows
`[0,.14,.46,.6,.76,1]`; parks `.07/.53/.88`; interstitial `.63`).

**Navigate / Encode / Build.** Encode = the former Diagnostic gate,
Build = the former Intelligence gate; section copy (kicker / title /
support) now lives on the map nodes (`NodeContent`), drawn concise and
executive from the `thoughtform-strategy` skill. The four "same pattern,
four ways" orbit labels and the "Trusted sources / Headless surfaces"
chamber labels are dropped (gate GEOMETRY kept as the visuals). Navigate
gets a **place**: a fly-through landmark gate (`NavigateGate` — armature

- tilted ring + compass cross, interstitial-gate family) parked at a Z
  inside `passthrough-01`, carrying the "01 · Navigate" copy. It is a map
  **waypoint**, not a re-tiling parked beat, so it adds zero weight and
  the brandmark / camera / opening choreography stay byte-identical. HUD
  sector labels map to the phases.

**Deferred (needs preview tuning):** promoting the Navigate landmark to
a true parked beat and lengthening the corridor — that re-tiles the
normalized windows (shrinking the setup window below the hardcoded
`0.14`-based opening constants) and requires re-expressing
`CORRIDOR_TIMELINE` window-relatively + recalibrating the brandmark lead
arc and camera chase. The landmark `parkBias` is the primary placement
knob.

## 2026-06-01 Revision — Engagement-gated render loop + corridor-grammar reference

A perf-hardening pass (no behaviour change) plus skill documentation.

- **Engagement-gated `frameloop`** (`DepthGatewayScene/index.tsx`). The
  Canvas is mounted for the whole page but previously ran
  `frameloop="always"`, so it rendered ~60fps even while the corridor
  was scrolled fully off-screen (a large share of the page, especially
  on the 620svh mobile stage). It now runs
  `frameloop={engaged ? "always" : "demand"}` where
  `engaged = active || armed` (subscribed via a boolean selector on the
  store, so it re-renders only on the engage/disengage edge, not per
  scroll frame — the same signal `HomeCorridor` already uses for the
  brandmark-mode handoff). Disengaged ⇔ off-screen, so the GPU idles
  with nothing visible frozen.
- **Why engagement-gated, not velocity-gated.** Four layers animate on
  continuous `clock` time and must keep moving while the user is
  parked-and-reading: `ThoughtformAtmosphere` star twinkle + boot-glow
  breathing (`:339,:393`), `LatentFieldTunnel` embedding-vector twinkle
  (`:722,:737`), `InterGateCorridor` debris-ring rotation (`:145`). A
  velocity-gate would freeze these on-screen the moment scrolling stops.
  Engagement-gating keeps `"always"` for the entire time the corridor is
  visible (including parked dwell) and only stops when off-screen — zero
  visible regression. This supersedes the base-plan "v1.1 deferred"
  note about on-demand rendering; it does **not** relax the idle-motion
  contract (no new idle drift — those four are pre-existing ambient
  animations, now simply paused only when off-screen). `dpr`, MSAA, and
  the context-loss `key` are unchanged and orthogonal.
- **Corridor-grammar reference** (`.claude/skills/thoughtform-design/references/depth-corridor-grammar.md`,
  linked from `SKILL.md`). Captures the invariants this and prior
  revisions depend on: the `paintProgress` timeline law, mirror-camera
  world-space anchoring, aspect-aware FOV, device tiers/capability gate,
  the two-moment mobile composition, and the render-gating contract
  (any `useFrame` animating on `clock` time is allowed only because the
  loop runs while engaged, and must tolerate being paused off-screen).

## 2026-05-29 Revision — Mobile corridor

The corridor was previously gated off for any viewport `< 760px`
(`HomeCorridor.tsx`), so phones fell back to the static text
`FallbackCorridor` — losing both the flythrough and the section-2
brandmark composition. This revision runs the real 3D corridor on
**capable phones** ("corridor-lite") and stacks the Thoughtform copy
above the brandmark in portrait. Plan: `plans/mobile-3d-corridor.md`.

Changes:

- **Capability gate, not a phone block.** The `smallViewport < 760`
  fallback condition is replaced by `corridorCapable()`
  (`lib/hooks/useDeviceTier.ts`): the corridor runs unless WebGL is
  unavailable, reduced-motion is set, or the device is genuinely
  low-end (≤2 cores **and** ≤2 GiB RAM, or a touch device `< 360px`).
  `useDeviceTier()` / `getDeviceTier(width)` centralise the
  `mobile < 760 / tablet < 1280` thresholds the per-layer `pickCount`
  helpers already use.
- **Mobile performance tier** (`DepthGatewayScene/index.tsx`):
  drawing-buffer pixel ratio capped to `[1, 1.4]` on mobile (the
  dominant GPU lever — phones report DPR ~3) and MSAA dropped
  (`antialias: !isMobile`). The two heaviest layers
  (`LatentWormholeWalls`, `LatentTopographyContours`) and
  `CelestialMotes` remain culled on mobile; the existing per-layer
  mobile particle budget (dead until now) carries the rest.
- **WebGL context-loss handling** (new): `webglcontextlost` is
  `preventDefault`-ed and `webglcontextrestored` bumps a Canvas `key`
  so all `useMemo` geometry rebuilds — phones drop contexts under
  memory pressure / backgrounding.
- **Aspect-aware FOV** (`sceneGeom.ts` `getCameraFov(aspect)`): the
  vertical FOV widens on portrait (`aspect < 1`) toward a ~60°
  horizontal target, capped at 70° to avoid fish-eye, so the
  landscape-tuned gate/copy layout keeps horizontal coverage. BOTH
  the live camera (`FlyingCameraRig`) and the DOM mirror camera
  (`useWorldDomTracker`) read the same function + update on resize, so
  canvas geometry and projected copy/brandmark stay in sync.
- **Section-2 stacked layout.** On mobile the Thoughtform composition
  is pre-centred (`getThoughtformCenterOffsetX` returns the centred
  offset for the whole beat instead of panning), the `thoughtform.leftCopy`
  world anchor sits ABOVE the mark with a `bottom-center` origin
  (`CopyAnchors.tsx`), the brandmark world half-extent is bumped to
  compensate for the wider FOV, and the decorative phase labels are
  dropped (`home-v2.css` `@media (max-width: 760px)`).

Known follow-up (R1): the portrait FOV widening can leave gates
slightly under-filled vertically or expose seams tuned for 38°. A
tier-scoped `GATE_PARK_DISTANCE` is the next lever if on-device
testing shows gates overflowing the narrow frame; this revision keeps
the FOV widening modest and leans on the stacked layout. Per-gate
particle budgets for `ThoughtformAtmosphere` / `InterGateCorridor` /
`GatewayWorld` on mobile are unaudited and may need a `pickCount` tier.

**Follow-up (same revision) — split copy + immediate fly-in.** The
first pass put the whole copy block above the mark and held the desktop
pan/dolly window on mobile (dead time, since the mark is already
centred). Two mobile-only refinements:

- **Title above / body below.** The Thoughtform copy splits around the
  mark: `thoughtform.leftCopy` carries only the bridge + title (above,
  `bottom-center`), and a new `thoughtform.lowerCopy` anchor carries the
  two body lines + CTA (below, `top-center`). `CopyAnchors.tsx` branches
  on `useDeviceTier() === "mobile"`; desktop renders the single
  two-column block and has no `lowerCopy` DOM element, so the tracker's
  missing-anchor `continue` skips it.
- **Immediate fly-in.** `getMobilePaintProgress(progress)` (`sceneGeom.ts`)
  remaps the PAINT channel on mobile only: the parked read `[0, park]`
  stretches onto the camera-hold span `[0, dollyHoldEnd]` (nothing moves
  there) and everything past the park is rescaled to run the dolly + ring
  flythrough to completion at `progress = 1`. Applied in `useDepthScroll`
  behind `active && isMobileComposition()`; `progress`/`beat`/`gateProgress`
  stay raw. The remap is continuous + monotonic at the park seam and
  `cameraZDollyT` is 0 across `[0, dollyHoldEnd]`, so the camera Z is
  identical on both sides — no pop. Because every visual reads
  `paintProgress` (scene camera, mirror camera, rings, brandmark, copy),
  the whole timeline shifts coherently with no DOM/canvas desync.

Both are gated behind `isMobileComposition()` / `useDeviceTier`, so
desktop (and tablet ≥ 769px) keep the original two-column layout and the
pan-to-centre scroll motion. Verified at 390×844 (split layout + rings
sweeping immediately past the park) and 1440×900 (unchanged).

**Follow-up (same revision) — two scroll moments + chevron scroll cue.**
The split-around-the-mark layout still crammed copy and brandmark into one
frame. Mobile now sequences the Thoughtform beat into two scroll moments
(the camera held across both), then the fly:

- **Moment 1 — copy:** copy alone fills the viewport as ONE vertically-
  centred column (bridge + title + body + chevron cue) with a harmonised
  type scale, reading as a single cohesive paragraph; brandmark, compass,
  and phase labels are at opacity 0. (Supersedes the earlier title-above /
  body-below split — copy and mark never share the frame, so the split was
  unnecessary; the `thoughtform.lowerCopy` anchor was removed.)
- **Moment 2 — diagram:** the copy fades out and the brandmark slides up
  into centre with the compass rings + NAVIGATE/ENCODE/BUILD labels —
  the same detail desktop shows when its mark pans to centre.
- **Moment 3 — fly:** the existing corridor flythrough.

Mechanism (all mobile-only, desktop = identity):

- **Scroll budget.** Mobile stage height 460→**620svh** (`home-v2.css`);
  `getMobilePaintProgress` reshaped to map the whole `[0, MOBILE_THOUGHTFORM_END=0.38]`
  raw dwell into the camera-hold span `[0, dollyHoldEnd]` (camera still
  through both moments), then fly over `[0.38, 1]`. Continuous + monotonic
  at the seam (`cameraZDollyT(hold)=0`, no pop).
- **Sub-phase helper** `getThoughtformMobilePhase(rawProgress)` → `{copyFactor,
diagramFactor, slideY}` (desktop short-circuits to `{1,1,0}`). Consumers
  multiply it in: copy anchors (`onPaint × copyFactor`), brandmark
  (`ProjectedBrandmarkActor` onPaint `× diagramFactor`), compass
  (`ThoughtformCompassGate` `bootBoost × diagramFactor`, `group.position.y
+= slideY`), phase labels (`onPaint × diagramFactor`, world offsets +slideY).
  Brandmark slide is world-space (`getBrandmarkWorldPosition(progress, rawProgress)`)
  so the mark and rings stay co-located.
- **Beat from paintProgress on mobile** (`useDepthScroll`): with the larger
  remap, `beat`/`gateProgress` are resolved from the painted value so
  cosmetics (brandmark `isParkedBeat`, HUD sector) stay aligned. Note:
  phase-label/copy _visibility_ is keyed off `paintProgress` against
  `BEAT_WINDOWS` (`useWorldDomTracker:283`), and the remap pins paintProgress
  into the thoughtform window across the dwell — so no `BEAT_WINDOWS` change
  is needed.
- **Phase labels restored on mobile** (un-hidden; gated by `diagramFactor`),
  offsets pulled inward by `MOBILE_PHASE_SCALE` (0.7) to fit portrait FOV.
- **Chevron CTA** (`CopyAnchors` + `home-v2.css`): mobile replaces "See the
  thesis →" with three down-pointing chevrons glowing in sequence (launch-pad
  runway) as a scroll-down cue; tapping scrolls ~1 viewport. `prefers-reduced-motion`
  → static all-lit. Desktop keeps the text link.

Verified 390×844 on `/test/home-v2` and prod `/` (Moment 1 copy-only →
transition crossfade+slide → Moment 2 brandmark+rings+labels centred → fly)
and 1440×900 desktop unchanged.

## 2026-05-23 Revision — World-Owned Corridor

Status update: ADR-018 now prefers a stricter model than the first proposal below.

The `/test/home-v2` corridor is no longer a "v7 sections in a sticky stage" composition. It is a **world-owned 3D corridor**:

- One R3F canvas owns all diagram geometry: Thoughtform compass, Diagnostic orbits, interstitial gate, Intelligence substrate sphere, side bodies, and inter-gate ring debris.
- The camera follows one continuous path through fixed world-space stations. The X reframe from off-axis Thoughtform to centred Diagnostic is concentrated in passthrough-01.
- The brandmark is a pure world-projected vector actor. It does not DOM-pin to `.sigil__mark`, `.miss__brand-slot`, or `.ilayer__brandmark-anchor` on this route. Its parked positions are rigidly co-located with the active gate group.
- DOM content is copy only. `CopyAnchors` renders text elements with `data-world-anchor` IDs; `useWorldDomTracker` projects named world anchors through the same camera model and writes inline transforms/opacities each frame.
- v7 HTML remains the source for copy and HUD chrome. The corridor no longer renders sliced v7 section markup for diagram layout.

This revision intentionally trades pixel-identical v7 parked layout for **spirit fidelity plus structural depth**. The parked Thoughtform beat should still read as copy-left / compass-right / brandmark-inside-diamond, but the diagram is now a real 3D gate the camera can pass through.

The original proposal's hybrid language ("brandmark rest positions match production dock rects exactly", "sliced v7 sections mount inside the sticky stage") should be read as superseded for `/test/home-v2`.

## 2026-05-24 Revision — Camera-Space Depth Continuity

Status update: the world-owned corridor now uses **camera-space depth/focus opacity** as the default visibility model for 3D diagram geometry.

Star Atlas' reference behavior is not "fade this section out, fade the next section in." Its visual continuity comes from persistent WebGL objects spaced in world Z; opacity is governed by view-space depth/focus windows as the camera moves through them. `/test/home-v2` now follows that rule:

- `sceneGeom.ts` owns shared camera-space helpers: camera forward vector, signed camera-space depth, and focus-window opacity (`near`, `nearFade`, `far`, `farFade`).
- Thoughtform rings no longer hard-cut at flythrough window end. The flythrough window only controls Z travel; opacity comes from the ring's actual depth relative to the camera.
- Diagnostic, Interstitial, and inter-gate debris remain world-rigid objects whose optical presence comes from camera-space focus, not progress-only fade clips.
- The brandmark is a lead artifact during the Diagnostic → Intelligence transit. It stays several world units ahead of the camera and keeps a small, stable plate scale; the Intelligence substrate sphere owns the large scale-up moment.
- Progress windows still matter for narrative pacing, copy visibility, and scroll HUD state, but they should not be the primary way 3D geometry appears or disappears.

This revision preserves the world-owned model while tightening its depth contract: **geometry persists in world space; distance decides visibility.**

## 2026-05-25 Revision — Latent Depth Spacing

Status update: the first travel leg now gets enough physical and world-space distance to read as navigation through a latent field rather than an immediate section reveal.

The Thoughtform → Diagnostic leg keeps the world-owned contract above, but retimes the first corridor:

- `.home-v2-stage` grows from `360svh` to `460svh`.
- `passthrough-01` widens from `0.16 → 0.40` to `0.14 → 0.46`.
- Diagnostic starts at `0.46`, parks at `0.53`, and its station Z is now derived from `BEAT_PARK_CENTRES.diagnostic` instead of a stale literal in `sceneGeom.ts`.
- Thoughtform ring fly-through windows span the longer passthrough, and ring Z overshoot increases so the rings and supporting linework cross the camera plane before fading.
- Diagnostic DOM copy and labels use a camera-space `depthFade` multiplier in `useWorldDomTracker`, so they can register faintly at distance but do not jump to full opacity the moment passthrough begins.
- `LatentArtifactBands` adds world-fixed equation, token, and vector shards between Thoughtform and Diagnostic. These are not camera-relative atmosphere: each artifact has a fixed Z position, approaches via camera dolly, then passes/culls by depth.

This revision does **not** relax the idle-motion contract. `LatentFieldTunnel` remains camera-relative atmosphere with `AMBIENT_DRIFT = 0`; the new semantic artifacts are world-fixed landmarks that only appear to move because the user scrolls the camera through them.

Follow-up tuning from the same review: future gates and semantic artifacts should be discoverable, not pre-visible. Diagnostic orbit geometry now uses a tighter far focus window so it does not sit behind the parked Thoughtform gate as a faint backdrop, then constructs by drawing each ellipse on as the camera approaches instead of appearing through opacity alone. `LatentArtifactBands` begins deeper into the corridor and multiplies depth opacity by a small progress reveal after the Thoughtform dolly starts, preserving fixed-world-Z fly-past behavior without showing the whole latent corridor at rest. The camera-relative `LatentFieldTunnel` keeps its static point field, but its legible token/vector layers are near-silent at idle so notation belongs to travel rather than the parked read.

## 2026-05-25 Revision — Wormhole wall topology

Status update: the world-owned corridor adds a new world-fixed particle layer that gives each passthrough leg an enclosing topology — the "walls of the wormhole" — without changing the gate geometry, camera path, or copy projection.

The earlier corridor between gates was visually open: dust, ring debris, contour shards, and gate construction were the only things the camera passed. The Star Atlas / WorldQuant Foundry reference reads as flying through a tunnel because there is a coherent dotted shell, longitudinal rails, and aperture/depth-gate frames around the corridor — the walls are felt continuously even when sparse. `/test/home-v2` now mirrors that contract on its own terms (Thoughtform palette, no idle drift, world-fixed positions) via a new R3F layer.

- `LatentWormholeWalls` paints two travel-leg shells made of particle dots:
  - Longitudinal dotted rails around an oval cross-section that pulls inward with depth so the shell visibly converges on the optical axis as it recedes — the strongest single cue that the user is flying through a tunnel rather than past a flat scene.
  - Three sparse aperture depth-gate frames per leg with gold corner anchors, dashed rectangular outlines, and short inward arms. The camera passes physically through each frame, reading the gates as stations inside the wormhole.
  - A low-alpha dawn-soft topographic shelf below the optical axis, deterministically waved across X+Z so the latent floor reads as receding terrain instead of a ruled grid.
- The layer is WORLD-FIXED. Positions are generated once in `useMemo` from the gate stations; no per-frame motion. Apparent flow comes entirely from the camera dolly.
- Each leg has its own `smoothstep` reveal envelope tied to global progress. Leg 1 lifts inside passthrough-01 and resolves before the Diagnostic park; leg 2 lifts inside passthrough-02 and resolves before the Intelligence park. Parked beats stay clean because the originating leg is fully off and the destination leg hasn't started.
- Per-point camera-space depth fade is computed in the vertex shader so dots ahead of the camera fade in as they approach and clip out as they cross the near plane. Same depth-focus pattern used by every other world-rigid layer on this route — visibility is a function of distance, not progress windows.
- Baseline opacity stays subtle by design: peak center-of-dot final alpha sits around 0.42 once the soft-disk falloff is applied, with a small velocity lift on top during active scroll. The lattice reads as architectural depth but never competes with the gate diagrams or the brandmark for centre attention.
- The layer is skipped on viewports below 760px, matching `LatentTopographyContours`, so the compact composition is not crowded.
- Paint order is fixed: `LatentFieldTunnel` (camera-relative ambient field) is BEHIND the walls, `LatentTopographyContours` (world-fixed contour shards) is IN FRONT so contours register on top of the rail lattice. The shells enclose the same Z bands that already host `InterGateCorridor` ring debris.

The revision does NOT relax the idle-motion contract from the 2026-05-25 latent depth spacing revision. The walls do not rotate, pulse, or drift on their own; only the camera moves them.

## 2026-05-25 Revision — Migration scar tissue purge

Cleanup pass; no contract change. The corridor accumulated several pieces of dead/duplicated machinery from earlier revisions; they have been removed without behaviour change:

- Legacy `chamberA / chamberB / chamberC` fields, `chamberId`, and `deriveChambers` are gone from `depthGatewayStore`. No painter ever consumed them under the world-owned model. HUD sector text is now derived from `beat` inline in `useDepthScroll`.
- `cameraT` field + `cameraTravelT()` are gone. The live camera path is driven by `paintProgress` through `getCameraPosition`; the smoothstep'd `cameraT` channel was written to the store and CSS but never read. The store also drops the unused `reset()` method.
- The X-reframe envelope (`REFRAME_*`, `reframeT`) and camera roll subsystem (`ROLL_MAX`, `getCameraRoll`) are gone from `sceneGeom.ts`. Both were no-ops (`CAMERA_START[0] = 0`, `LOOK_AT_X_*` both 0, `ROLL_MAX = 0`). The camera path is documented as axial end-to-end; any future off-axis beat will need to re-introduce these deliberately. The `ProjectedBrandmarkActor` inner shell now applies only the dolly-driven Y tilt (no Z roll).
- Dead sceneGeom exports purged: `getSideBodyOpacity`, `LEFT_BODY_POSITION`, `RIGHT_BODY_POSITION`, `BRANDMARK_ANCHOR_DIAGNOSTIC`, the `STATIONS` array, and the `MISS_ORBITS / MISS_LABELS / MISS_VIEWBOX / pointOnEllipse` re-exports. Consumers import station constants individually and pull orbit symbols directly from `@/lib/celestial/orbits`.
- `CopyAnchor` / `CopyAnchorPosition` types are unified with `WorldAnchor` / `WorldAnchorPosition` from `useWorldDomTracker`. The two were structurally identical; the cast in `CopyAnchors.tsx` is gone.
- `SUBSTRATE_CROSSFADE_END = 0.2` is exported once from `sceneGeom.ts` and imported by both `getIntelligenceSubstratePresence` and `ProjectedBrandmarkActor`. Previously duplicated.
- `CelestialMotes` now uses the canonical `getThoughtformBootEnvelope` instead of an inline copy. The inline copy had drifted (`0.04 / 0.16 / 0.24` vs canonical `0.03 / 0.14 / 0.22`); the gateway-lit painters now share one beat.
- The duplicate WebGL probe inside `DepthGatewayScene` is removed. `HomeV2Page` already gates the canvas on its own probe + reduced-motion check.
- Orphaned CSS rules `.home-v2-copy-northstar*` deleted (no matching DOM). Unused CSS-var defaults `--depth-progress`, `--camera-t`, `--beat-gate-progress`, `--velocity-mag` removed from `.home-v2-stage` (no `var(--…)` consumers).
- Local `clamp01` helpers in `sceneGeom.ts` and `useDepthScroll.ts` removed in favour of the exported helper from `depthGatewayStore.ts`.

The follow-up note in the original "Consequences" section about trimming `chamberA/B/C` in a later pass is now actioned. The supersession lines about `cameraT` being a camera driver and DOM-dock pinning the brandmark in the original "Decision" body remain accurate as historical context; current behaviour matches the 2026-05-23 + 2026-05-24 + 2026-05-25 revisions above.

## Context

`/test/home-v2` was first built as a "v7-fidelity inside a sticky depth stage" experiment ([home_v2_v7_fidelity](../../.cursor/plans/home_v2_v7_fidelity_58bbc2ce.plan.md)) and later iterated with the [z_axis_travel_feel](../../.cursor/plans/z_axis_travel_feel_cb3e7c19.plan.md) pass (streaming dust + two-station brandmark + sequenced fades). The route now:

- Stacks three sliced v7 sections (`#definition`, `#missing-layer`, `#intelligence-layer`) in one 300svh sticky stage.
- Cross-fades chamber DOM via `--chamber-{A,B,C}-section-opacity`.
- Renders a shallow R3F overlay (`camera z: 8 → 3`, streaming dust, two-station brandmark point cloud, intelligence L/R bodies).

User feedback after live review (Star Atlas reference: [experience.staratlas.com](https://experience.staratlas.com/)):

1. The brandmark is barely visible at the Thoughtform section and the centering does not match the homepage.
2. The transition from Thoughtform → Missing layer → Intelligence layer reads as fade between flat panels rather than travel through a depth corridor.
3. Background stars drift even when the user is not scrolling, which breaks the "moving through space" read.
4. There is no sense of foreground/midground geometry passing the camera between sections, so when chamber B's orbits appear they read as "another fade", not "you have arrived at a new gate".

The root cause is structural, not a polish issue: the diagram systems are still flat DOM layers. They never cross the camera plane. The only thing that actually moves in 3D is dust and the brandmark cloud, and both share a single shallow Z window.

## Decision

Rebuild the depth stage as a **3D depth corridor** where the diagram geometry itself is the depth content, and the v7 DOM is reduced to copy + HUD chrome overlay. The brandmark stays homepage-faithful at each rest station but travels through world space between them.

### Five principles (load-bearing for `/test/home-v2`)

1. **Diagram geometry lives in R3F.** Compass rings, diagnostic orbits, interstitial diagram linework, and the intelligence sphere are all world-space objects with a Z position. They scale up as the camera approaches, drift past the viewport edges as the camera passes through, and are replaced by the next gate at depth.
2. **Brandmark rest positions match the homepage.** At the parked beats (Thoughtform / Missing layer / Intelligence layer) the brandmark sits at the same on-screen position and at the same on-screen size as the production v7 docks (`.sigil__mark`, `.miss__brand-slot`, `.ilayer__brandmark-anchor`). In between, the mark is a world-space artefact projected back to viewport pixels — its travel path is a 3D arc, not a 2D lerp.
3. **Stars do not move when you are not scrolling.** A static background star layer paints constantly (so the void is not empty). A separate near-camera dust/streak layer is **scroll-velocity-only**: at idle it is invisible (or perfectly still); at scroll it produces a stream of particles crossing the camera, intensifying the travel read.
4. **Pass-through beats own the transitions.** Between each pair of diagram gates, the previous gate's geometry physically crosses the viewport edges before the next gate materialises. The user sees the rings/orbits stretch past the camera, then a new diagram appears in the distance and approaches. No DOM cross-fade between sections.
5. **The DOM is a copy + HUD overlay.** The sliced v7 sections still mount inside the sticky stage to provide titles, ledes, labels, and the HUD readouts the user trusts (depth diamond, sector text, % progress). But the diagram visuals are hidden in particle mode and rendered by R3F instead. CSS pins the existing reveal vars (`--miss-orbit-emerge`, `--ilayer-progress`, etc.) so the DOM copy is visible whenever its chamber is active, but the heavy SVG/orbital geometry is gated off.

### Architecture

```mermaid
flowchart TB
  ScrollStage["StickyScrollStage (300svh)"] --> Hook["useDepthScroll (rAF)"]
  Hook --> Store["depthGatewayStore<br/>progress + cameraT + beat + gateProgress*"]
  Store --> CameraRig["CameraRig<br/>+Z near to -Z far"]
  Store --> Vector["ProjectedBrandmarkActor<br/>(crisp inline SVG)"]
  Store --> World["GatewayWorld (R3F)"]
  Store --> Stars["StarfieldLayers<br/>(static background + scroll-only streaks)"]
  CameraRig --> World
  World --> ThoughtformGate["ThoughtformCompassGate"]
  World --> DiagnosticGate["DiagnosticOrbitGate"]
  World --> InterstitialGate["InterstitialDiagramGate"]
  World --> IntelligenceSphere["IntelligenceSphereStation"]
  Vector --> SubstrateCut["substrateMorph cut<br/>BrandmarkPointCloud takes over"]
```

The store exposes:

- `progress` — global 0..1 across the sticky stage (existing).
- `cameraT` — camera travel parameter (smoothstep'd progress) (new).
- `beat` — current narrative beat id: `thoughtform | passthrough-01 | diagnostic | passthrough-02 | intelligence` (new).
- `gateProgress` — per-gate local 0..1 with a small dead-band around the parked centre (new). Replaces the `chamberA/B/C` thirds that did not align with the cross-fade windows.
- `velocity` — signed per-second progress velocity (existing). Drives the scroll-only streaks.

### Beat layout

| Beat           | Global progress | Camera Z (world) | What is visible                                                                                                                                                                                                                              |
| -------------- | --------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| thoughtform    | 0.00 → 0.18     | +8 → +4          | Thoughtform compass gate centred; brandmark parked at the right-of-centre sigil position. DOM: `#definition` lede.                                                                                                                           |
| passthrough-01 | 0.18 → 0.32     | +4 → 0           | Compass rings scale past viewport edges. Diagnostic gate appears in the distance ahead. Brandmark in transit.                                                                                                                                |
| diagnostic     | 0.32 → 0.50     | 0 → -4           | Diagnostic orbit gate centred; brandmark parked at viewport centre on the miss anchor. DOM: `#missing-layer` head + pills.                                                                                                                   |
| passthrough-02 | 0.50 → 0.70     | -4 → -8          | Diagnostic orbits drift past the camera. Interstitial diagram (celestial grammar — armature, rings, diamonds) approaches.                                                                                                                    |
| intelligence   | 0.70 → 1.00     | -8 → -12         | Brandmark settles at viewport centre on the ilayer anchor; under projected vector cover, the point cloud takes over and morphs into the substrate sphere. L/R intelligence bodies fade in. DOM: `#intelligence-layer` head + chamber labels. |

### Painters

- **`ProjectedBrandmarkActor`** (new) — a fixed `position: fixed` inline SVG mark (the canonical `BrandmarkGlyph`) whose rect/opacity is computed each frame from a world position projected through the R3F camera. Same vector geometry as production. Primary brandmark painter from beat 1 through the start of the intelligence beat.
- **`BrandmarkPointCloud`** (repurposed) — only paints during the intelligence beat's substrate morph window. Mirrors the v7 substrate cut pattern from ADR-017: when the morph engages, the projected vector cuts off (`display: none`) and the point cloud paints the same brandmark silhouette at the same screen position, then morphs into the Fibonacci sphere.
- **`GatewayWorld`** R3F components — Thoughtform compass, diagnostic orbits, interstitial linework, intelligence sphere station (+ L/R side bodies). Each owns its own world Z position. Visibility uses geometric distance from camera (frustum culling + alpha by depth), never a manual opacity fade between beats.
- **`StaticStarfield`** (new) — background `<points>` instanced at a fixed world position, painted always. No motion. Provides void texture.
- **`ScrollStreaks`** (refactored from `StreamingDust`) — near-camera streaks whose flow is **strictly proportional to `velocity`**. Zero velocity = no streaks. The streak count and length scale with `|velocity|`.

### What the DOM still does

- HUD chrome (gateway gradient, rails, ticks, nav). Unchanged from production.
- HUD readouts (`#depthIndicator`, `#hudProgress`, `#coordD`, `#coordT`, `#hudSector`). Written by `useDepthScroll`.
- Copy: section title, lede, label pills, chamber captions. Visible whenever the chamber's gate is the current beat (no opacity tween — show/hide with the beat boundary, optionally with a 200ms fade for legibility).
- `--miss-orbit-emerge`, `--miss-anchor-emerge`, `--miss-label-emerge`, `--ilayer-progress` pinned to `1` so the DOM doesn't gate the copy off.
- The heavy SVG geometry inside `.miss__system` (orbits + ghost orbits + particles + brand halo) is hidden by a `[data-home-v2-mode="corridor"]` CSS gate. The diagram geometry is owned by R3F instead.

## Consequences

### Positive

- The transition from Thoughtform to Intelligence becomes a single 3D camera path. No more "fade-between-screenshots" read.
- Brandmark rest positions match the homepage exactly because they are projected from world points calibrated to the production dock rects.
- Idle scenes are quiet — no ambient drift, no implied motion when the user is not scrolling.
- Pass-through beats give the route the gateway feel the user requested without changing the homepage architecture.

### Negative

- The route diverges from "v7 fidelity inside a sticky stage". If we ever want to roll the depth corridor back into the production homepage we will need a deeper architectural pass (new ADR).
- More R3F geometry to maintain — compass rings, diagnostic orbits, interstitial linework, intelligence sphere station — instead of reusing the homepage SVG.
- The store and scroll hook grow new fields. `chamberA/B/C` and `chamberId` were kept temporarily for backwards compatibility with the existing painters during the migration and have since been removed — see the **2026-05-25 Migration scar tissue purge** revision above.

### Out of scope

- Production homepage (`/`). Unaffected.
- ~~Mobile fidelity beyond a graceful WebGL / reduced-motion fallback (existing fallback markup still paints).~~ **Superseded by the 2026-05-29 Mobile corridor revision** — capable phones now run the corridor with a stacked section-2 layout; only no-WebGL / reduced-motion / genuinely low-end devices get the static fallback.
- Performance budgets beyond "feels smooth at 60fps on a recent laptop". A first perf pass landed in the **2026-06-01 revision** (engagement-gated render loop so the GPU idles when the corridor is off-screen); deeper budgeting can still follow if needed.

## References

- Star Atlas reference: [experience.staratlas.com](https://experience.staratlas.com/) — depth corridor pattern (camera through persistent world).
- Production brandmark journey: [`lib/brandmark/journey.ts`](../../lib/brandmark/journey.ts), [`components/landing/v7/hooks/useBrandmarkJourney.ts`](../../components/landing/v7/hooks/useBrandmarkJourney.ts).
- Vector actor pattern: [`components/brand/BrandmarkVectorActor/BrandmarkVectorActor.tsx`](../../components/brand/BrandmarkVectorActor/BrandmarkVectorActor.tsx).
- Substrate morph cut pattern: ADR-017.
- Compositing rules (still apply): ADR-008.
