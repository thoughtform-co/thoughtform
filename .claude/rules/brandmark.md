---
paths:
  - "**/useSigilChoreography*"
  - "**/BrandmarkActor*"
  - "components/landing/home-v2/ProjectedBrandmarkActor.tsx"
  - "components/landing/home-v2/DepthGatewayScene/BrandmarkPhysicsCoreActor.tsx"
  - "components/landing/home-v2/DepthGatewayScene/sceneGeom.ts"
  - "lib/home-v2/corridorMap.ts"
  - "components/landing/v7/landing.css"
description: Brandmark choreography and corridor handoff rules
---

# Rule: Brandmark / sigil choreography

Edits here move a brandmark actor across fixed, projected, or in-canvas renderers. Small measurement mistakes show up as hero flashes, between-section float, practice snaps, or a visible SVG-to-particle size jump.

**Read first**

- [ADR-010: Brandmark choreography](../sentinel/decisions/010-brandmark-choreography.md)
- [ADR-023: Corridor Brandmark Physics Core](../sentinel/decisions/023-corridor-brandmark-physics-core.md)
- `.claude/skills/brandmark-choreography/SKILL.md` (checklist + Playwright recipe)
- Related stack: [ADR-008](../sentinel/decisions/008-landing-v7-background-layers.md) (layers)

**Process:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) - run Cycle A after changing triggers; prefer live rects and `onLeave` settlement over new CSS sticky hacks.

**Home-v2 corridor invariant (REWRITTEN 2026-06-25 hybrid):** the live corridor brandmark is **two painters with an invisible seam**, not one. `ProjectedBrandmarkActor` owns the visible mark at full opacity (instant `display: block`, never an opacity fade) while corridor `progress < BRANDMARK_CORE_HANDOFF_PROGRESS` (`0.30`). The instant `progress` crosses that threshold from below, the SVG cuts to `display: none` in the SAME frame that `BrandmarkPhysicsCoreActor` rasterises the SVG's live screen rect (via `rasterizeBrandmarkToWorldPositions` + `worldPositionsToLocal` + `sim.reseed`/`sim.setHomePositions`) into world positions that reproject to those exact CSS pixels — so the eye sees no swap because the particles ARE the SVG at frame N+1. The two painters share a `brandmarkScreenRectRef` (`components/landing/home-v2/brandmarkScreenRectRef.ts`) — the SVG writes its rect every paint frame; the physics-core actor reads it at the swap frame. From there the vertex shader interpolates each particle from its matched-pixel seed to its paired `aTarget3D` (the GLB volumetric wireframe sampled from `/models/brandmark/brandmark.glb` via `sampleBrandmark3D` — the SAME mesh the #services hologram uses) with per-particle staggered `flowT`, +Z recede peaking mid-flow, and low-amplitude XY drift. By `uDepth = 1` (at substrate wrap peak, `progress = 0.42`) every particle has settled exactly on its wireframe home inside the substrate sphere. Pitfalls: cross-fading SVG and particles together (any non-zero opacity overlap reads as the dissolve the user explicitly rejected); using opacity instead of `display: none` for the SVG cut; using a synthetic dome bulge as the morph endpoint instead of `sampleBrandmark3D.armHomes`; making the particles try to look exactly like the SVG at rest (perceptually impossible at corridor density — five revisions tried, all failed; that's why the SVG owns the rest now); lowering `ignite` to create a swirl. The sim stays assembled (`seedAtHome`, `ignite=1`); the render shader owns the wind-blown flat → wireframe interpolation. ADR-023 Invariants 13–14 are the load-bearing contract.
