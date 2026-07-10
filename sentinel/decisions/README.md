# Architecture Decision Records

> Documenting significant technical decisions with context and consequences.

---

## What is an ADR?

An Architecture Decision Record (ADR) captures a decision that has significant impact on the codebase. It documents:

- **Why** we made the decision (context)
- **What** we decided (the actual decision)
- **What follows** from that decision (consequences)

---

## When to Write an ADR

Write an ADR when you:

- Establish a pattern that others should follow
- Make a decision that might seem wrong without context
- Change direction from a previous approach
- Solve a problem that took significant research

---

## Index

| ADR | Title                                                                     | Status   | Date    |
| --- | ------------------------------------------------------------------------- | -------- | ------- |
| 001 | [Template](001-template.md)                                               | Example  | 2024-12 |
| 002 | [Scroll Animation Architecture](002-scroll-animation-architecture.md)     | Accepted | 2024-12 |
| 003 | [Auth Centralization](003-auth-centralization.md)                         | Accepted | 2024-12 |
| 004 | [Legacy Code Archival](004-legacy-code-archival.md)                       | Accepted | 2024-12 |
| 005 | [Scroll-Captured Content Reveal](005-scroll-captured-content-reveal.md)   | Accepted | 2024-12 |
| 006 | [Focus Overlay System](006-focus-overlay-system.md)                       | Accepted | 2025+   |
| 007 | [Chamfered Card Polygon Design](007-chamfered-card-polygon-design.md)     | Accepted | 2025+   |
| 008 | [Landing v7 Background Layers](008-landing-v7-background-layers.md)       | Accepted | 2026-04 |
| 009 | [Repo Structure Conventions](009-repo-structure-conventions.md)           | Accepted | 2025+   |
| 010 | [Brandmark Choreography](010-brandmark-choreography.md)                   | Accepted | 2026-04 |
| 018 | [Home V2 Depth Corridor](018-home-v2-depth-corridor.md)                   | Proposed | 2026-05 |
| 021 | [Corridor Exit Zoom-Dissipate](021-corridor-exit-zoom-dissipate.md)       | Proposed | 2026-06 |
| 022 | [Hero → Corridor Flip Transition](022-hero-corridor-flip-transition.md)   | Proposed | 2026-06 |
| 023 | [Corridor Brandmark Physics Core](023-corridor-brandmark-physics-core.md) | Active   | 2026-06 |
| 025 | [Services Hologram Stage](025-services-hologram-stage.md)                 | Accepted | 2026-06 |
| 026 | [Symbolic Astral Emblems](026-symbolic-astral-emblems.md)                 | Accepted | 2026-06 |
| 027 | [Gateway Motion Lab](027-gateway-motion-lab.md)                           | Accepted | 2026-07 |
| 028 | [Landing Data Caching](028-landing-data-caching.md)                       | Accepted | 2026-07 |
| 029 | [Services Card Ring](029-services-card-ring.md)                           | Accepted | 2026-07 |

---

## Template

```markdown
# ADR-XXX: [Short Title]

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX

## Context

What is the issue we're facing? What constraints exist?

## Decision

What did we decide to do?

## Consequences

### Positive

- What becomes easier?

### Negative

- What becomes harder?
```
