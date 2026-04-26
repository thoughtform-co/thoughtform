# Latent case showcase

## Prototype

- **Route:** `/test/latent-cases` (dev only — `middleware.ts` rewrites `/test/*` to 404 in production).
- **Entry:** [app/(internal)/test/latent-cases/page.tsx](<../app/(internal)/test/latent-cases/page.tsx>)
- **UI:** [components/landing/latent-cases/](../components/landing/latent-cases/)

## Behaviour

1. Tall scroll track drives local `trackProgress` (not whole-document scroll).
2. Editorial “surface” layer peels away (`surfaceReveal`).
3. **Frontal wormhole:** `tunnelScroll` (0→1) is passed to [`LatentInstrument`](../components/landing/latent-cases/LatentInstrument.tsx) after an ease-in-out curve over the sticky track band. The scene stacks **(a)** a port of the v1 hero portal particle stack — [`LatentPortalContour`](../components/landing/latent-cases/LatentPortalContour.tsx): `SolidShapeRing`, `EdgeGlowRing`, `TunnelDepthRings`, `InnerAccentRing`, `DepthSpiral`, `InteriorFill`, `GoldDepthMarkers` — driven by the same `ShapePointFn` as [`ThreeGateway`](../components/gateway/ThreeGateway.tsx) (duplicated in [`latentShapePointFn.ts`](../components/landing/latent-cases/latentShapePointFn.ts)), with configurable **`shape`** (default `diamond` on [`LatentGatewayStage`](../components/landing/latent-cases/LatentGatewayStage.tsx)), interwoven with **(b)** a celestial weave from [`celestialGatewayGeometry.ts`](../components/landing/latent-cases/celestialGatewayGeometry.ts) with two zones — an **outer celestial field** co-planar with the mouth (cosmological ring + bearing ticks, four cardinal axis lines extending from the mouth contour outward to gold waypoint diamonds, four corner brackets framing the composition, sparse field stars) so the gateway reads as embedded in a celestial instrument when revealed by parallax, and an **inner instrument** threaded through the tunnel (bearing ticks at three depths, four shrinking register frames matching the mouth shape, three tilted ecliptic orbits, eight long dotted spokes from the mouth into deep constellation nodes, plus stacked gold cardinal crosses and waypoint diamonds at each register depth). The weave is wrapped in `<group scale.z={7 * tunnelDepth}>` so its depth `t` (0..1) threads through the same tunnel as `InteriorFill` and ends just inside the deepest `TunnelDepthRings` layer. Camera dolly (`cameraZMax`, `lookAhead`) and late fade (`fadeStart`/`fadeEnd`) match the previous latent travel tuning.
4. `LatentGatewayStage` wraps the instrument in `.latent-gateway-stage` (CSS `gatewayScale` ~1.12, opacity handoff) and forwards optional `shape`. `layerZIndex` keeps it under case chrome.
5. **Exit plane:** `LatentExitPlane` (`exitPlane` intensity) appears before cards, suggesting the latent dock / horizon grid.
6. **Cards:** `caseEntry` brings cards from the exit-plane depth; `orbitFanOut` fans side cards into orbit after the centre docks. Wide viewports use CSS `perspective` / `rotateY`; at `max-width: 720px` only the active case is shown.

## Content

Case copy is typed in [components/landing/latent-cases/caseData.ts](../components/landing/latent-cases/caseData.ts) from the Loop creative-tech showcase (Vesper, Mímir, Babylon, Heimdall). Screenshot galleries are stubbed until `showcase/screenshots/**` from that export exists in-repo or under `public/`.

## Promotion into v7 landing

1. Port `LatentCaseShowcase` (or a slimmer shell) into React beside [components/landing/v7/LandingPage.tsx](../components/landing/v7/LandingPage.tsx) **or** embed markup into [public/prototypes/v7/landing-v7-motion.html](../public/prototypes/v7/landing-v7-motion.html) and hydrate — prefer the React path to avoid `dangerouslySetInnerHTML` limits.
2. Obey **ADR-008 / landing-v7-compositing:** full-bleed section `background: var(--void)`; never put `[data-m]` opacity reveals on wrappers that shield the fixed gateway or sticky hero.
3. Update the Practice handoff link (currently points at this prototype in HTML during R&D).
4. Consider a production-safe cases URL: either ship cases on a public path or keep `/test/*` dev-only and link from README / internal docs only.

## Gateway API

[components/gateway/ThreeGateway.tsx](../components/gateway/ThreeGateway.tsx) accepts optional `hideAfter` (default `0.2`, cockpit behaviour), `layerZIndex` (default `1`), and **`travel?: GatewayTravelOptions`** — backward-compatible camera / fade / rotation tuning (`cameraZMax`, `fadeStart`, `fadeEnd`, `rotationX`, `rotationY`, `verticalInset`, `lookAhead`). Omit `travel` to preserve legacy hero wormhole behaviour.
