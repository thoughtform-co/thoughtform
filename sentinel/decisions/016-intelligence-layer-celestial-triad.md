# ADR-016: Intelligence layer — celestial triad + comet stream

**Status:** Accepted  
**Date:** 2026-05-19  
**Supersedes:** [ADR-014 — Intelligence layer orbital triad](014-intelligence-layer-orbital-triad.md)

## Context

ADR-014 rendered three coplanar front-on ring clusters (`OrbitField` + `OrbitalCluster` + `SplitRing`). At perspective `fov 26 / z=4`, the silhouettes overlapped and read as visual noise rather than three distinct chambers composing one layer.

The product story is **one intelligence layer, three chambers** (Sources / Encoded Substrate / Headless Surfaces), with Substrate emphasised as Loop's durable asset.

## Decision

Replace the coplanar ring stack with:

1. **Three `CelestialBody` groups** — shaded icosphere (Fresnel + procedural noise), tilted `TubeGeometry` rings with progress-driven dash fill, per-body atmosphere `Points`, orbital pip on the primary ring.
2. **`CometStream`** — gold additive particles along a `CatmullRomCurve3` through all three bodies; phase driven by `--ilayer-progress` / `ringProgress`.
3. **Orthographic camera** with mild X (~14°) and Y (~6°) tilt so rings read as orbits, not flat ellipses.
4. **Screen-space CSS vars** — `TriadScene` writes `--ilayer-body-{id}-x/y/scale` per frame so `.ilayer__chamber--*` overlays track each body centre in R3F mode.
5. **Static SVG fallback** — three spheres on a horizontal axis (middle larger) for mobile / reduced-motion / no-WebGL.

Layout constants live in `components/landing/v7/intelligence-layer/intelligenceLayerGeom.ts` (`BODY_POSITIONS`, `BODY_SCALES`, `COMET_CURVE_POINTS`).

ADR-014 components are archived under `intelligence-layer/_legacy/` (not imported).

## Consequences

- Journey `splitRotation` remains a no-op stub; `vectorRingOpacity` still drives the brandmark ↔ R3F handoff scalar.
- Chamber copy unchanged; DOM chambers reposition via CSS vars in desktop R3F mode; mobile keeps stacked layout + SVG fallback.
- Performance: three shaded icospheres + three atmosphere fields + comet stream; materials shared where possible (`SHARED_ICO_SPHERE`, shader factories in `celestialMaterials.ts`).

## Verification

- Desktop 1440: three discrete bodies, middle emphasis, ring dash fill on scroll, comet sweep, chambers aligned to body centres.
- Mobile 390: static SVG schematic, no canvas.
- Diagnosis (`#missing-layer`): brandmark parks earlier (`miss.parkViewportFrac` 0.50), orbit system vertically centred, one dotted ghost + four solid numbered orbits.
