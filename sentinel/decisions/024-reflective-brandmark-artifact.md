# ADR-024: Reflective Brandmark Artifact

**Date:** 2026-06-23
**Status:** Proposed

---

## Context

The brandmark already has two production-grade runtime treatments:

- The v7 landing journey keeps the brandmark as a continuous vector plus particle atmosphere artifact, governed by ADR-013, ADR-015, ADR-017, and ADR-019.
- The home-v2 corridor uses a GPGPU particle core for the in-corridor brandmark, governed by ADR-023.

The new visual target is different: a high-quality solid object with glass, chrome, lighting, reflection, bloom, and subtle refraction, closer to fullscreen WebGL reference compositions such as Active Theory and Lore. Those references use real 3D scenes, environment-driven highlights, postprocessing, and DOM overlays. Lore also uses a GLB with authored PBR texture maps.

This repo already has a code-native mesh path in `components/brand/Brandmark3D`: `SVGLoader` parses the canonical SVG, `ExtrudeGeometry` bevels it, and the internal `/test/brandmark-3d` route tunes the geometry.

---

## Decision

Create a lab-only reflective 3D brandmark artifact using the existing SVG extrusion pipeline.

- Extend `Brandmark3D` with a third material mode, `transmission`, backed by Drei `MeshTransmissionMaterial`.
- Add a generated reflective environment rig made from local lightformers and visible color cards. No external HDR or Blender asset is required for the first pass.
- Add a focused internal lab route at `/test/brandmark-reflective` with presets for gold glass, mercury, dark chrome, oil-slick, and frosted glass.
- Add restrained postprocessing in the lab: bloom, optional chromatic aberration, noise, and vignette. Disable animated highlights and effects under `prefers-reduced-motion`.
- Keep the artifact out of production landing and corridor renderers until a later ADR explicitly promotes it.

This is a separate material study and reusable renderer surface. It does not change `BrandmarkVectorActor`, `BrandmarkParticleCanvas`, `BrandmarkPhysicsCore`, the v7 journey store, or the corridor handoff contract.

---

## Alternatives Considered

### Blender / GLB first

- **Pros:** Highest ceiling for sculpted bevels, UV-authored wear, and baked normal/roughness/metallic maps.
- **Cons:** Adds an asset pipeline before validating whether the canonical SVG extrusion can carry the look.

Rejected for the first pass. Blender remains the next step if the code-native material cannot reach the desired fidelity.

### Particle-core restyle

- **Pros:** Reuses ADR-023 infrastructure and already feels alive.
- **Cons:** The desired target is a reflective solid object. A particle field can support it as atmosphere, but should not replace the mesh.

Rejected as the primary route.

### Production swap immediately

- **Pros:** Faster visual impact on the live page.
- **Cons:** Risks violating the v7 continuous-transform model and the corridor particle-core invariants before the material has been proven.

Rejected. The first pass stays inside an internal lab.

---

## Consequences

### Positive

- The brandmark can be evaluated as a glass/chrome object without leaving the browser.
- The reusable mesh component gains a material path that can later be mounted in v7 or home-v2 if approved.
- The lab establishes lighting, postprocessing, and fallback defaults before production integration.

### Negative

- `MeshTransmissionMaterial` is heavier than the existing matcap/PBR modes and should remain lab-only until performance is measured.
- Animated environment capture is visually useful but expensive; it must stay controllable and reduced-motion aware.

### Neutral

- A future GLB route may still be needed for Lore-level authored textures and surface imperfections.
- This artifact is not counted against the v7 global brandmark particle painter cap because it is not mounted in the v7 journey.

---

## References

- Related ADRs: ADR-008, ADR-013, ADR-015, ADR-019, ADR-023.
- Existing mesh builder: `components/brand/Brandmark3D/buildBrandmarkGeometry.ts`.
- Existing mesh lab: `/test/brandmark-3d`.
- New material lab: `/test/brandmark-reflective`.
