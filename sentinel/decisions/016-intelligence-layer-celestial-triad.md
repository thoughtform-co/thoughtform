# ADR-016: Intelligence layer — celestial triad + comet stream

**Status:** Accepted (revised 2026-05-19 — sphere constellation rebuild)  
**Date:** 2026-05-19  
**Supersedes:** [ADR-014 — Intelligence layer orbital triad](014-intelligence-layer-orbital-triad.md)

## Context

ADR-014 rendered three coplanar front-on ring clusters (`OrbitField` + `OrbitalCluster` + `SplitRing`). At perspective `fov 26 / z=4`, the silhouettes overlapped and read as visual noise rather than three distinct chambers composing one layer.

The product story is **one intelligence layer, three chambers** (Sources / Encoded Substrate / Headless Surfaces), with Substrate emphasised as the durable encoded asset.

Initial ADR-016 shipped WebGL `CelestialBody` spheres but left chamber copy as flat DOM blocks misaligned with the 3D centres. A follow-up cinematic pass fixed projection and perspective but spheres still read small, rings too thick (TubeGeometry), and copy felt pasted inside orbits rather than a space-map constellation.

## Decision

Replace the coplanar ring stack with an **Astral Frontier / Destiny space-map** register:

1. **Three `CelestialBody` groups** — shaded icosphere, **hairline `LineLoop` rings** (not tubes), per-body functional decoration (Sources inflow arcs, Substrate nested inner rings + cardinal diamonds, Surfaces outward rails), atmosphere `Points`. Scales: sides `1.25`, substrate `1.85`.
2. **`InterSphereTrajectories`** — sweeping `CatmullRomCurve3` hairlines between bodies; two dashed ghost arcs at low alpha; dawn/gold alternation matching `.miss__orbit` grammar.
3. **`CometStream`** — rides the primary (`cometHost`) trajectory from `TRAJECTORY_CURVES` / `getCometTrajectoryPoints()`.
4. **Perspective camera** (`fov: 42`, `position: [0, 0.45, 6.4]`) with mild scene tilt.
5. **Screen-space CSS vars** — `TriadScene` writes `--ilayer-body-{id}-x/y/scale/diameter` and `--ilayer-pip-{body}-{i}-x/y` via `screenSpaceForBody` / `screenSpaceForPoint`. Chamber selectors: `#intelligence-layer[data-ilayer-mode="r3f"] .ilayer__chamber--*`.
6. **HUD captions beside spheres** — `.ilayer__caption` (num / title / sub + hairline rail); mid above, sides below. Substrate stat chips (`.ilayer__substrate-chips--readout`) below the body.
7. **Constellation pip labels** — `.ilayer__pip-label` elements in `.ilayer__pip-layer`, positioned from pip CSS vars; 9px mono uppercase. Pip layout in `BODY_PIPS` (`intelligenceLayerGeom.ts`).
8. **Static SVG fallback** — three spheres on a horizontal axis for mobile / reduced-motion / no-WebGL.

Layout constants: `BODY_POSITIONS`, `BODY_SCALES`, `BODY_RING_RADIUS`, `BODY_PIPS`, `TRAJECTORY_CURVES`, `celestialRingUtils.ts` (hairline ring builders).

ADR-014 components remain archived under `intelligence-layer/_legacy/` (not imported).

## Consequences

- Journey `splitRotation` remains a no-op stub; `vectorRingOpacity` still drives the brandmark ↔ substrate handoff scalar.
- Removed `.ilayer__chamber__field` radial masks and `.ilayer__orbit-labels` (substrate cardinals now pip labels).
- Desktop breakpoint tuning at 1920 / 1440 / 1280 / 1024 via `--ilayer-ring-diameter` and pip label size clamps (mobile out of scope for this pass).
- Performance: three icospheres + hairline line primitives + trajectories + comet; shared `SHARED_ICO_SPHERE` and material factories.

## Verification

- Desktop 1920 / 1440 / 1280 / 1024: three distinct planet bodies, hairline orbits, inter-sphere trajectories, comet on main arc, pip labels track slow body rotation.
- Captions beside spheres on hairline rails; substrate chips as instrument readout below mid body.
- Scroll: ring opacity / comet phase / atmosphere still driven by `--ilayer-progress` / `ringProgress`.
- Mobile 390: static schematic + stacked chamber cards (pip layer hidden).
- Reduced motion: static SVG + readable copy at rest.
