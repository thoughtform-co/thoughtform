# ADR-027: Gateway Motion Lab — plate-preserving treatment family

**Date:** 2026-07-05
**Status:** Accepted
**Scope:** `components/gateway/motion/**`, `lib/gateway-motion/**`,
`scripts/gateway-prep/**`, `public/gateway-motion/**`,
`app/(internal)/test/gateway-motion`, `docs/gateway-motion/**`.

## Context

The Gateway key visuals (Midjourney 4K plates, Dropbox
`05_Key Visuals/2026/Web/Gateway_v*.webp`) are the founding brand artifact —
gateways into latent space. On the site they ship static; the AI-video
versions are low-res with upscale artifacts. Vince asked for web-asset
routes that bring the plates to life: scroll zoom, depth-map parallax,
"convert to 3D", TouchDesigner depth work, and an Unreal rebuild delivered
as scroll-synced video.

Every prior gateway system in this repo is **particle-based** — it
_re-synthesizes_ the visual (`ThreeGateway` attractor portal,
`ImageParticleGateway`, `lib/key-visual/*` samplers, the home-v2
`DepthGatewayScene` procedural corridor). Nothing preserved the plates'
photographic fidelity while adding motion.

## Decision

1. **A second, plate-preserving family** under `components/gateway/motion/`,
   deliberately separate from the particle family: KenBurnsGateway (DOM/GSAP),
   DepthParallaxGateway (fullscreen-quad reprojection shader),
   DepthMeshGateway (depth-displaced relief plane + inpainted background
   plane), LivingPlateOverlay (2D-canvas star twinkle + motes over the
   still), ScrubSequenceGateway (scroll-scrubbed frame sequences). One
   experiment page (`/test/gateway-motion`) mounts one treatment at a time
   (single GL context) with per-treatment tuning and `?mode=&visual=`
   deep links.

2. **A generated asset contract.** `npm run gateway:prep` (Node orchestrator;
   one Python sidecar for ONNX depth + numpy raster analysis; sharp/ffmpeg
   for derivatives) produces per-visual sets in `public/gateway-motion/<id>/`
   and a root `manifest.json` validated by `lib/gateway-motion/manifest.ts`.
   Depth comes from Depth Anything V2 (relative, per-image — never compare
   across visuals; per-visual `tuning` blocks in the manifest survive
   regeneration). 16-bit masters for TouchDesigner/Unreal stay gitignored in
   `scripts/gateway-prep/out/`.

3. **SequenceMeta is the offline-render handoff.** TouchDesigner/Unreal
   renders (docs in `docs/gateway-motion/`) are packaged by
   `npm run gateway:frames` into `frames/f_NNNN.webp|avif` + a `sequence`
   manifest block; the scrub player consumes them with zero code changes.
   The proxy packaged from the legacy AI video proves the pipeline.

4. **Color pipeline: bytes-through.** Both R3F canvases run
   `<Canvas flat linear>` with `THREE.NoColorSpace` textures, so plate bytes
   reach the framebuffer untouched (WYSIWYG vs `<img>`); grain/sweep effects
   operate in display space. This sidesteps the double-gamma /
   gamma-warped-depth class of bugs entirely and is the family convention.

5. **Canvas budgets** copy `DepthGatewayScene`: dpr `[1, 1.4]` mobile /
   `[1, 1.75]` desktop, `frameloop` demand when off-screen, context-loss
   remount epoch — plus `SizeSync` (timer-burst + resize/visibility events),
   because a Canvas that mounts post-texture-load or in a hidden tab can
   miss R3F's initial ResizeObserver measure (verified live: mesh canvas
   stuck at 300×150 until a resize event without it).

## Consequences

- The lab is self-contained; none of the protected scroll paths
  (`.claude/rules/scroll-animations.md`) are touched. Promoting a winner
  into the landing hero is a separate decision (the v7 prototype's
  `.gateway` div is the intended slot) and must respect ADR-002/018/021/022.
- `public/gateway-motion/` adds ~13 MB for 10 visuals + one 8 MB proxy
  sequence — within existing repo asset norms; plates are 77 KB AVIF at
  2560w (vs the 6.8 MB legacy PNG hero).
- Baked film grain freezes under any reprojection; the family counters with
  live grain (shader hash-noise at 12 fps steps + the ported `.gwm-grain`
  CSS layer). Expect every future treatment to need the same.
- 2.5D relief keeps plate fidelity only at conservative settings
  (relief ≤ ~0.55, orbit ≤ ~2.5° — verified on gateway-v1); the sliders
  allow worse, the defaults don't.
- Depth-8 WebP suffices so far; `depth-packed.webp` (16-bit RG) ships in the
  manifest as the banding escape hatch (`srcPacked`), decodable in-shader as
  `(R*255*256 + G*255)/65535`.

## Verification

`tests/lib/scrub-math.test.ts`, `tests/lib/gateway-motion-manifest.test.ts`
(vitest); `tests/visual/gateway-motion-smoke.spec.ts` (structural Playwright,
no baselines); manual matrix on `/test/gateway-motion` across the five modes
(2026-07-05 session: all five verified in Chrome, RTX 5080 desktop).
