# Gateway Motion — Unreal Engine rebuild brief

Route 5 of the Gateway Motion exploration: rebuild a Gateway artifact as a
real 3D scene in Unreal, matched to the Midjourney plates' lighting and
material language, and export scroll-scrubbable frame sequences (plus AOVs)
for the web. The RTX 5080 in the studio machine handles all of this.

Scope honesty: matching a plate "as close as possible" is a proper 3D-art
project (days, not hours — greeble kitbash + erosion sculpt + lighting
iteration). Phase it: **A. cheap depth-relief proof** (an afternoon) →
**B. modeled hero ring** (the real build) → C. full debris field + flythrough.

## Phase A — depth-relief proof (no modeling)

Recreate the web mesh treatment at render quality to test the pipeline:

1. Import the 4K plate + `scripts/gateway-prep/out/<id>/depth-16.png`.
2. Plane (high tessellation) with a displacement material:
   World Displacement = `(depth − 0.35) × scale` along plane normal
   (or a Nanite-displaced static mesh in UE 5.4+; heightfield mesh also works).
3. Camera: Cine Camera, 35–50 mm, gentle orbit ±10–12° over 6 s + slow
   dolly-in (~10 %). Never let the plane's border enter frame.
4. Render (settings below), package with `gateway:frames`, compare against
   the live `/test/gateway-motion?mode=mesh` treatment. If this already
   reads convincingly at 1600w, Phase B is optional for the hero.

## Phase B — modeled hero ring

**Blockout.** Torus (major R ≈ 5 m, minor r ≈ 1.4 m), slightly elliptical
cross-section, opening tilted 15–20° toward camera like the plates. Cut the
"bite" erosion with booleans (v1's comet-tail gap; v9's crumbled crown).

**Greeble.** Nanite panels kitbashed over the shell (KitBash3D/Quixel or a
PCG scatter of 8–12 authored greeble tiles: stacked plating, conduit runs,
window strips ~0.02–0.05 m scale). Density gradient: densest on the outer
rim, sparser toward the aperture. The plates read as _machined bone_ —
panel seams > antennae.

**Erosion.** Sculpt/boolean crumble on one arc (each plate has exactly one
dominant erosion event). Interior of the break shows stratified layers —
stack thin displaced shells so broken edges expose lamination.

**Material.** Bone/ivory base (albedo ~ #e8e0d2 → #cbb99a), roughness
0.55–0.75 with cavity-driven darkening, faint rust/copper accents
(#8a5a3a) in crevices only (Curvature/AO masks). No metal sheen except
hairline panel edges (metallic 0, specular boosted on edge mask).

**Lighting (match the plates).**

- Key: single warm directional (#fff2dd, ~10–15 lux equiv), from upper-left
  ~30° elevation, ~40° left of camera — hard shadows, long falloff.
- Fill: none. Ambient: near-black skylight (#0a0908, intensity ~0.05).
- Rim: very faint cool bounce card right side (optional, ≤5 % of key).
- Background: pure void (#050403) + sparse star card (or comp stars from
  `mask-stars.png` in post). Volumetric: a whisper of god-ray dust through
  the aperture, forward-scattered from the key.

**FX.** Niagara: slow debris chunks (the prep pipeline's matte shows which
plates carry debris), dust motes in the key light, occasional glint sprites
on rim highlights.

## Render + delivery contract

Movie Render Queue:

- 3840×2160 PNG (or EXR multilayer), 30 fps, 6 s orbit ±12° + 10 % dolly
  (180 frames). Also render a 2 s idle loop (breathing light) if wanted.
- AOVs: **SceneDepth** (normalized → 16-bit — future web relighting/parallax
  hybrid uses it exactly like the DA2 depth), optional Cryptomatte.
- Anti-aliasing: high sample count, motion blur OFF (scrub = stepped frames;
  blur bakes in scrub-direction assumptions).
- Post: film grain OFF in engine (the web layer adds live grain), bloom low,
  vignette off, chromatic aberration off.

Package for the web (same contract as TD):

```
npm run gateway:frames -- --input "D:/renders/gateway_ue_png" --visual gateway-v1 --fps 30 --width 1600 --format avif --quality 55
```

Scroll-sync math is already in the player: scroll progress × frameCount →
frame index (`lib/gateway-motion/scrub-math.ts`). A 180-frame orbit over the
lab page's ~4-viewport runway ≈ 45 frames per viewport scrolled — smooth.

## Acceptance against the plates

Compare a UE still vs Gateway_v1/v9 at 50 % zoom: silhouette erosion reads
as geological strata ✓ · key-light direction and warmth match ✓ · greeble
density comparable at panel scale ✓ · void value ≤ #0a0a0a with grain added
only in comp ✓.
