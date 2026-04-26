---
paths:
  - "**/useSigilChoreography*"
  - "**/BrandmarkActor*"
  - "components/landing/v7/landing.css"
description: Fixed brandmark actor + ScrollTrigger choreography
---

# Rule: Brandmark / sigil choreography

Edits here move a **`position: fixed`** actor across **sigil → HUD → orbit**. Small measurement mistakes show up as **hero flashes, between-section float, or practice snaps**.

**Read first**

- [ADR-010: Brandmark choreography](../sentinel/decisions/010-brandmark-choreography.md)
- `.claude/skills/brandmark-choreography/SKILL.md` (checklist + Playwright recipe)
- Related stack: [ADR-008](../sentinel/decisions/008-landing-v7-background-layers.md) (layers)

**Process:** [sentinel/MAINTENANCE.md](../sentinel/MAINTENANCE.md) — run Cycle A after changing triggers; prefer **live rects** and **`onLeave` settlement** over new CSS sticky hacks.
