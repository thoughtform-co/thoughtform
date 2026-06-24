# ADR-026: Symbolic Astral Emblems

**Date:** 2026-06-24
**Status:** Accepted
**Scope:** `components/landing/v7/CelestialConnector/shapes/**`, `DiagramSvg.tsx`, `lib/celestial/schema.ts`, `/test/celestial-emblems`.

## Context

The celestial connector system (parametric SVG diagrams between landing
sections, see CLAUDE.md + `lib/celestial`) already had 15 composable primitives
and 14 presets. Vince wanted to reuse it to compose **symbolic astral emblems** —
the gold Saturn / "fig. E" radial-field charts and symmetric talisman references
— rather than only the section-connector diagrams.

An audit found two gaps for that look: spokes were a fixed 3-arm `CompassRose`,
and orbiting nodes were a single animated dot (`OrbitalMarker`). Everything else
(rings, ticks, ecliptic arcs, constellations, reticle) already existed.

## Decision

- **Three new primitives** (pure SVG, gold/dawn tokens, viewBox `-120..120`):
  - `RadialSpokes` — N evenly-spaced radial lines with optional outward
    arrowheads + dash (generalises `CompassRose`); the radiating field of fig. E.
  - `OrbitalNodes` — one or more tilted elliptical orbits each carrying several
    evenly-spaced nodes, optional per-orbit spin via the shared `rotate` /
    `rotateRev` keyframes (generalises `OrbitalMarker`).
  - `PlanetBody` — a central ringed planet (ellipse pair drawn behind the disc,
    near arc redrawn over it) for the literal Saturn; `Reticle` still covers the
    abstract centre.
- **Two new presets** registered in `PRESETS` and routed in `DiagramSvg`:
  - `astralEmblem` — symmetric talisman (concentric rings + 8/4 sunburst +
    bearing-tick ring + node shells + constellation + diamond centre).
  - `orrerySigil` — radial field chart (ringed `PlanetBody` + dashed arrowed
    spokes + tilted moon orbits + stars + corner labels).
    The presets reuse existing config objects (`rings`, `reticle`,
    `constellation`) and hardcode the new-primitive parameters, exactly as the
    other composed presets do — so **no new schema config sub-objects were
    required**; only the two preset names were added to the enum.
- **Look-dev surface:** `/test/celestial-emblems` is a workbench that composes
  the primitives directly from live controls (seed, rings, spokes, orbits, nodes,
  tilt, planet/stars/ticks/spin), alongside the two registered presets rendered
  through `DiagramSvg` as the locked reference.

## Guardrails

- Emblems are **standalone look-dev for now.** Wiring them into live celestial
  slots (data-driven `celestial_designs`) or admin tooling is a later step — keep
  them out of the production connector slots until that decision is made.
- Keep primitives **seed-deterministic** (reuse `shapes/seededRandom.ts`) and on
  the gold/dawn token palette; no new colors.
- `rotate` / `rotateRev` keyframes live in `landing.css` (not global). Any host
  using `OrbitalNodes` spin must provide them — the showcase inlines them.

## Consequences

- The celestial system can now render symbolic emblems, not just connectors.
- New primitives are exported from the shapes barrel and are composable into
  future presets without schema changes.
- If a preset later needs user-editable spoke/node counts via stored designs,
  add a dedicated `emblem` config object to the schema + `validateConfig` then.
