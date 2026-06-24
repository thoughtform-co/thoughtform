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

**Home-v2 corridor invariant:** the projected SVG and `BrandmarkPhysicsCoreActor` must share `getBrandmarkWrapHalfExtent(progress)`, `getBrandmarkCoreBlend(progress)`, and the exported handoff sub-thresholds in `sceneGeom.ts` whenever the SVG -> particle handoff timing changes. The current model ("crosshair unfurls into the armillary", 2026-06-24): the bold DOM SVG crosshair stays the front, legible mark for MOST of the Navigate wrap while the substrate armillary unfurls from its plane; the SVG drops below the canvas + cuts LATE (`PARTICLE_LAYER_BLEND ≈ 0.82` / `SVG_CUT_BLEND ≈ 0.90`, sphere ~80% formed) so the medium swap is hidden inside the formed sphere; `uDepth` ramps EARLY (`DEPTH_START_BLEND ≈ 0.30`, before the cut) while the core is hidden behind the front SVG, so the revealed core is already 3D. Mechanism is still z-index drop then `display:none` (never an opacity dissolve), and `PRODUCTION_BASIS` must stay `dome-fill` so the core matches the SVG fill. Pitfalls: cutting the SVG EARLY exposes the bare particle core in open space (reads as the mark dissolving into dust — the bug this model fixed); moving only the blend anchor, only one shaped curve, only z-index ownership, or only the scale envelope creates a visible ghosted SVG, hard cutoff, slide-like dissolve, or tiny-core catch-up.
