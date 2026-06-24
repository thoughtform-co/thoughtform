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

**Home-v2 corridor invariant:** the projected SVG and `BrandmarkPhysicsCoreActor` must share both `getBrandmarkWrapHalfExtent(progress)` and `getBrandmarkCoreBlend(progress)` whenever the SVG -> particle handoff timing changes. Moving only the blend anchor or only the scale envelope creates a visible hard cutoff or tiny-core catch-up during the Navigate substrate wrap.
