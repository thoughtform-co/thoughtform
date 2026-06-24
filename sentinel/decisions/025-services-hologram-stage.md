# ADR-025: Services Hologram Stage

**Date:** 2026-06-24  
**Status:** Accepted  
**Scope:** `#services`, `/test/services-demo`, and the Services hologram lab.

## Context

The Services demo had a separate R3F hologram prototype, but its center artifact
was a simplified circle-plus armillary rather than the canonical Thoughtform
brandmark. The production Services stage also still used a 2D SVG orbit map
around a fallback particle mark, while the old fixed in-Services brandmark
runway had already been retired in ADR-021.

The desired direction is a section-owned retrofuturistic hologram: the real
brandmark as a minimal model-wire artifact, service orbits sharing the same 3D
camera, compact CV scan notes, and one expanded service card at a time.

## Decision

- The Services hologram samples `BRANDMARK_FULL_PATHS` through
  `sampleBrandmarkParticles({ basis: "model-wire" })`. The old circle-plus
  armillary is retired.
- The hologram and service orbits live in one R3F scene. Orbit lines render dim
  back passes and brighter front passes so they read as wrapping through the
  artifact.
- R3F publishes projected orbit-node anchors keyed by `ServiceId` through
  `hologramConnectorStore`; DOM scan notes draw connector lines to those live
  anchors.
- Services cards are represented as three compact curated scan notes plus one
  expanded full card. Clicking a note selects the active service.
- Production `ServicesStage` uses this canvas on desktop. Mobile and reduced
  motion keep the existing static brandmark/SVG orbit fallback and the same
  scan-card interaction.

## Guardrails

- Do not reintroduce `data-services-brandmark`, `data-services-pixelate`, or
  `CorridorSeamPixelField` on the production Services path.
- This hologram is section content mounted inside `ServicesStage`, not a fixed
  viewport brandmark actor and not part of the v7 global brandmark journey.
- Scan notes are curated static content for now. They deliberately do not call
  the survey or computer-vision APIs.

## Consequences

- `/test/services-demo` becomes the shared look-dev harness for the production
  Services stage.
- The old `ServiceCelestialCard` and SVG `ServicesOrbitMap` remain in the tree
  as fallback/compatibility surfaces, but the desktop production path is the
  R3F hologram plus `ServiceScanInterface`.
- Future tuning should happen in the hologram scene/sampler first, then be
  checked on both `/test/services-demo` and the homepage Services section.
