# Latent case showcase

## Prototype

- **Route:** `/test/latent-cases` (dev only â€” `proxy.ts` rewrites `/test/*` to 404 in production).
- **Entry:** [app/(internal)/test/latent-cases/page.tsx](<../app/(internal)/test/latent-cases/page.tsx>)
- **UI:** [components/landing/latent-cases/](../components/landing/latent-cases/)

## Behaviour

1. Tall scroll track drives local `trackProgress` (not whole-document scroll).
2. Editorial â€œsurfaceâ€ layer peels away (`surfaceReveal`).
3. **Frontal wormhole:** `tunnelScroll` (0â†’1) is passed to [`LatentInstrument`](../components/landing/latent-cases/LatentInstrument.tsx) after an ease-in-out curve over the sticky track band. The scene stacks **(a)** a port of the v1 hero portal particle stack â€” [`LatentPortalContour`](../components/landing/latent-cases/LatentPortalContour.tsx): `SolidShapeRing`, `EdgeGlowRing`, `TunnelDepthRings` (per-ring phase + density variation so they read as discrete tunnel stations, not a concentric mandala), `InnerAccentRing`, `DepthSpiral`, `GoldDepthMarkers` â€” driven by the same `ShapePointFn` as [`ThreeGateway`](../components/gateway/ThreeGateway.tsx) (duplicated in [`latentShapePointFn.ts`](../components/landing/latent-cases/latentShapePointFn.ts)), with configurable **`shape`** (default `diamond` on [`LatentGatewayStage`](../components/landing/latent-cases/LatentGatewayStage.tsx)), interwoven with **(b)** a five-zone celestial weave from [`celestialGatewayGeometry.ts`](../components/landing/latent-cases/celestialGatewayGeometry.ts):
   - **Outer celestial field** (locked, co-planar with the mouth): cosmological ring + companion ring at `r=1.36R`, 24 outer bearing ticks, four cardinal axis lines extending from the contour outward to gold waypoint diamonds at `r=2.05R`, four corner brackets at `r=2.3R`, and 18 seeded field stars, so the gateway reads as embedded in a celestial instrument under parallax.
   - **Data ring** (slow CW): bearing ticks on the mouth contour at three depths plus two interrupted barcode-like data bands at `r=0.72/0.86`. Reads as a calibrated data readout.
   - **Code ring** (medium CCW): four L-bracket corner registers at inter-cardinal positions, four chevrons on cardinal axes pointing into the tunnel, and gold cardinal crosses at four register depths. Anti-mandala because every element is directional.
   - **Celestial ring** (slow CCW drift): three partial tilted ecliptic arcs (not full ellipses), eight long dotted spokes from the mouth contour into deep constellation nodes, and gold waypoint diamonds at each arc depth.
   - **Topology** (locked architecture): 14 longitudinal tunnel-wall rails from the mouth contour to deep z (alternating full / partial), five topographic floor slices in the lower half (waved horizontal contours that read as a navigable latent landscape), and four rectangular depth-gate frames at `z=0.18/0.45/0.72/0.93` with corner brackets â€” providing the gate-corridor side-wall architecture.

   The four inner zones are wrapped in `<group scale.z={12 * tunnelDepth}>` so their depth `t` (0..1) threads through the same tunnel as the `LatentPortalContour` rings and exposes architecture as the camera dollies forward. Camera dolly (`cameraZMax`, `lookAhead`) and late fade (`fadeStart`/`fadeEnd`) match the previous latent travel tuning.

4. `LatentGatewayStage` wraps the instrument in `.latent-gateway-stage` (CSS `gatewayScale` ~1.12, opacity handoff) and forwards optional `shape`. `layerZIndex` keeps it under case chrome.
5. **Exit plane:** `LatentExitPlane` (`exitPlane` intensity) appears before cards, suggesting the latent dock / horizon grid.
6. **Cards:** `caseEntry` brings cards from the exit-plane depth; `orbitFanOut` fans side cards into orbit after the centre docks. Wide viewports use CSS `perspective` / `rotateY`; at `max-width: 720px` only the active case is shown.

## Content

Case copy is typed in [components/landing/latent-cases/caseData.ts](../components/landing/latent-cases/caseData.ts) from the Loop creative-tech showcase (Vesper, MÃ­mir, Babylon, Heimdall). Screenshot galleries are stubbed until `showcase/screenshots/**` from that export exists in-repo or under `public/`.

## Promotion into v7 landing

The production landing now ships an editorial Build station (`#build`)
that uses the four creative-tech cases without the latent wormhole UI.
See [components/landing/v7/build-cases/](../components/landing/v7/build-cases/)
for the production data + slides; this prototype remains the playground
for the deeper latent / orbit choreography.

If you want to reconcile the two surfaces:

1. Promote the production data file ([buildCaseData.ts](../components/landing/v7/build-cases/buildCaseData.ts)) so this prototype can also consume it instead of duplicating copy in [caseData.ts](../components/landing/latent-cases/caseData.ts).
2. Obey **ADR-008 / landing-v7-compositing:** full-bleed section `background: var(--void)`; never put `[data-m]` opacity reveals on wrappers that shield the fixed gateway or sticky hero.
3. Keep `/test/*` dev-only routes locked via [proxy.ts](../proxy.ts).

## Gateway API

[components/gateway/ThreeGateway.tsx](../components/gateway/ThreeGateway.tsx) accepts optional `hideAfter` (default `0.2`, cockpit behaviour), `layerZIndex` (default `1`), and **`travel?: GatewayTravelOptions`** â€” backward-compatible camera / fade / rotation tuning (`cameraZMax`, `fadeStart`, `fadeEnd`, `rotationX`, `rotationY`, `verticalInset`, `lookAhead`). Omit `travel` to preserve legacy hero wormhole behaviour.
