# ADR-051: Remnant 3D — the Gateway key visual rebuilt as procedural geometry

**Date:** 2026-07-26
**Status:** Accepted (lab surface only; not wired into any production route)
**Flag:** none — `/test/remnant-3d` is dev-only, blocked in production by `middleware.ts`
**Builds on:** ADR-027 (gateway motion lab — the depth/mask derivatives this consumes, and the ~2.5° orbit ceiling this is measured against), ADR-023 (the anti-blob, edge-first sampling doctrine), ADR-025 (the services hologram's GLB→point-cloud precedent).
**Scope:** `components/brand/Remnant3D/**` (new: `remnantSpine.ts`, `buildRemnantRibbon.ts`, `Remnant3D.tsx`, `index.ts`, `generated/`), `app/(internal)/test/remnant-3d/page.tsx` (new), `eslint.config.mjs` (one override for the generated directory).

## Context

The question asked was how far the [img2threejs](https://github.com/hoainho/img2threejs) skill can take the Gateway key visual (`public/images/Gateway_v1b.webp` — the eroded ring-and-tail "REMNANT STRUCTURE") toward a 3D asset. Target agreed up front: a **showpiece with a near-fixed camera**, not a corridor fly-past and not a mesh export.

That target matters, because the tool's single hard limitation is that camera-matched reconstruction only holds near the original viewpoint. When the camera barely moves, that limitation stops being fatal.

## What img2threejs actually is

Not a library — a **Claude Code skill** (Apache-2.0, v1.4.0). Nothing to `npm install`, nothing imported at runtime. It drives an agent through eight vision-gated passes (blockout → structural → form-refinement → material → surface → lighting → interaction → optimization) with hard gates on silhouette IoU, proportion, symmetry, and PBR-inference confidence ≥ 0.7, and emits a TypeScript factory returning a `THREE.Group`. Its Python is stdlib-only; it enforces, the model judges.

## Decision — the tool owns structure and evidence; we own the form

**What the tool genuinely delivered, and delivered well:**

- A **component hierarchy** that survives review: 17 components across macro/meso/micro, with attachment contracts, sockets, colliders and a runtime rig on `root.userData.sculptRuntime`.
- **Material scalars extracted from real pixels**, not invented. `extract_pbr_evidence.py` returned independent albedo/roughness/height/normal/AO for all four materials at confidence 0.83–0.86, and `extract_part_color_recipe.py` produced per-component CIE-Lab colour recipes for all 16 non-material-only components. This is the part that would have been slowest and least reliable by hand.
- **Gates that actually bite.** `--strict-quality` refused the spec until every component carried a colour recipe, every curve-sweep carried an attachment contract, the detail inventory reached its target, and the lighting had concrete key/fill/rim entries. It is not a rubber stamp.

**What it could not deliver, and why:**

- **The form.** `generate_threejs_factory.py` reads `geometryDescriptor.curveSweep`; absent that field it emits ONE hardcoded S-curve placeholder for every curve-sweep component. The spiral had to be solved separately and written into the spec before generation. The tool builds the scaffold, not the shape.
- **The taper.** Even given a spine, the generator sweeps with `THREE.ExtrudeGeometry({ extrudePath })`, which has a **constant cross-section**. The remnant's band runs from full width at the coil to a sliver at the spar tip, and it is a stack of discrete plies rather than one solid. Neither is expressible as a constant extrude, so `buildRemnantRibbon.ts` builds the sweep by hand.
- **The fray.** The plate's identity is a silhouette that is _coming apart_. No primitive assembly reaches that; it is delegated to an edge-weighted point cloud.

So the division of labour is: **img2threejs owns structure, materials and evidence; the repo owns the sweep and the erosion.** That split is the finding, and it is the reusable one.

## Decision — the form model

The object is ONE ribbon of laminated sheet swept along an inward spiral. It is not a torus and not a comet. Reading the plate: the bright face is the outer surface of a rolled sheet, and the dark concentric striations are that sheet's **cut edge** — so the band's width runs along the coil axis and its thickness is radial, exactly like a roll of tape. Along the spar the plies visibly delaminate and shear.

Constants were **measured, not eyeballed** (`remnantSpine.ts`):

- Cavity inscribed radius 104px vs coil outer radius 334px → ratio 0.311, from a distance transform with a 32-ray enclosure test (the mask's ring is broken at the lower left, so a flood-fill hole test finds nothing).
- View tilt: Euler grid search + best-fit 2D similarity against four mask landmarks, rms 0.038 in units of bbox width.
- The spar does **not** lie in the coil plane. No in-plane spar can be shallow enough to hit the measured band centroids while the coil keeps its own fit, and `depth-8.webp` independently shows the spar receding. Hence `SPAR_RISE`.

Two honest caveats recorded in code: the landmark fit put the spar parameters on their search boundaries, which means it was absorbing error rather than converging — the shipped values were picked by sweeping the lab against a difference-blend plate overlay. If more fidelity is wanted, the right move is to extract the medial axis from the mask and lift it with the depth map, giving a measured spine instead of a fitted formula.

## The measured orbit ceiling

This is what the lab exists to answer, and the number is the deliverable.

| azimuth | reads as                                                         |
| ------- | ---------------------------------------------------------------- |
| 0°      | the plate                                                        |
| 8°      | still the plate                                                  |
| 15°     | plausible; the coil begins to open                               |
| 22°     | departing — the cavity shows an inner wall the plate never shows |
| 30–45°  | a different object: a roll of tape seen obliquely                |

**Usable range ≈ ±8° comfortably, ≈ ±15° at the limit** — against ADR-027's measured ~2.5° for the depth-relief treatment on this same plate. Roughly a 6× improvement, and the reason is structural: this is genuinely 3D geometry rather than a displaced plane, so it does not smear, it just starts showing invented surfaces. It never collapses to a degenerate view, which is the gate img2threejs calls "multi-angle or it didn't happen".

## Invariants

1. **The ribbon is built in the coil's own frame (coil axis = +Z), and the view tilt is applied to the whole object as a group rotation.** Baking the tilt into the spine breaks the band's width direction — the builder derives width from the coil axis, and a pre-tilted spine makes world +Z something else, yielding a coiled clock spring instead of a roll of tape. This was a real bug; `TILT_EULER` carries the warning.
2. **The lab drives the camera imperatively.** R3F applies `<Canvas camera={...}>` only on first render. Passing a changing prop moves the readout but not the camera, and the orbit sweep then reads "the silhouette never changes" — the exact opposite of the truth. This was also a real bug, caught only because a 45° orbit looked implausibly stable.
3. **`generated/` is regenerated, never hand-edited.** It is checked in for provenance and exempted in `eslint.config.mjs`; anything affecting how the object looks belongs in `Remnant3D.tsx`.
4. Ply tonal alternation is what makes the lamination legible. Without it the stack reads as one solid and the object stops looking like rolled sheet.
5. The fray samples the ribbon's own vertices weighted by `sweepT`, not an `EdgesGeometry` — `EdgesGeometry` drops custom attributes, and `sweepT` is precisely the density signal needed.

## Consequences

### Positive

- Zero payload cost: code-only output, no GLB, no new `public/` asset. `brandmark.glb` (41 kB) remains the only model shipping.
- The reconstruction is auditable and re-runnable — spec, evidence and generator output are all checked in.
- The measured orbit ceiling is now a recorded number rather than an assumption, and the method for measuring it is reusable for any future plate.
- `scripts/gateway-prep/` derivatives proved their worth as reconstruction inputs, not just motion inputs.

### Negative

- The spar parameterisation is known-imperfect (boundary-pinned fit); the medial-axis path is the honest fix and is not done.
- The surface is currently procedural: the panel plating, scribe linework and greebles are specced but not built. Reaching plate fidelity needs the projection path (`bake_projected_texture.py`), which brings its own angle limit.
- Nothing is wired to production. If this ever graduates to the landing it inherits the `React.lazy` seam in `useCorridorMount.tsx`, and the `landing-performance` doctrine applies.
