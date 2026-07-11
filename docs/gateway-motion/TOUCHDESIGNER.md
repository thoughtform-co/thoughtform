# Gateway Motion — TouchDesigner authoring guide

Route 4 of the Gateway Motion exploration: use TouchDesigner to art-direct
depth-driven motion on the Gateway plates with instant visual feedback, then
export frame sequences that drop straight into the web scrub player
(`ScrubSequenceGateway`) via the SequenceMeta contract.

Honest framing: TD does not export web runtimes. For a _live_ web hero the
GLSL below already runs in the browser (`components/gateway/motion/shaders.ts`
— same math). TD earns its place when you want (a) hands-on-knobs art
direction, (b) longer choreographed camera moves rendered offline,
(c) Substrata exhibition / installation output, (d) social render loops.

## Inputs (from the prep pipeline)

Per visual, `scripts/gateway-prep/out/<id>/` holds the 16-bit masters:

| File                | Use in TD                                            |
| ------------------- | ---------------------------------------------------- |
| `depth-16.png`      | displacement source (16-bit grayscale, near = white) |
| `mask-artifact.png` | limit shimmer/effects to the artifact body           |
| `mask-stars.png`    | twinkle source                                       |
| `background.png`    | clean void plate for deep-parallax reveals           |

The source 4K plate comes from Dropbox `05_Key Visuals/2026/Web/`.

## Network spec (minimal displacement rig)

```
moviefilein_plate  (Gateway_vN.webp, 3840x2160)
moviefilein_depth  (depth-16.png — set Image → Pixel Format: 16-bit fixed)
glsl_displace      (TOP; inputs: [0]=plate, [1]=depth; pixel shader below)
   uniforms: uShift (vec2), uFocus (float, ~0.35), uZoom (float)
lookup / limit     (optional grade)
moviefileout       (PNG sequence, 24 fps)
```

GLSL TOP pixel shader — the SAME reprojection as the web treatment
(keep in sync with `shaders.ts` → `PARALLAX_FRAG`):

```glsl
uniform vec2 uShift;   // parallax shift in UV, e.g. (0.012, 0.004)
uniform float uFocus;  // depth pivot that stays put (~0.35)
uniform float uZoom;   // dolly zoom, 1.0 = none
out vec4 fragColor;

void main() {
  vec2 uv = vUV.st;
  uv = (uv - vec2(0.68, 0.55)) * uZoom + vec2(0.68, 0.55);
  vec2 p = uv;
  for (int i = 0; i < 3; i++) {
    float d = texture(sTD2DInputs[1], clamp(p, 0.001, 0.999)).r;
    p = uv + (d - uFocus) * uShift;
  }
  fragColor = texture(sTD2DInputs[0], clamp(p, 0.001, 0.999));
}
```

## Drive the motion

- `lfo1` (sine, ~0.05 Hz) → `uShift.x` amplitude ±0.012, second LFO with a
  phase offset → `uShift.y` ±0.005 — a slow orbital drift.
- `noise` CHOP (sparse, slow) added on top for non-mechanical wander.
- Scroll-choreography preview: an `animation` COMP keyframing
  `uZoom 1.0 → 0.88` + `uShift` over the clip length mirrors what scroll
  does on the web page.
- Camera POST effects worth adding in TD (cheap wins the web shader skips):
  film grain TOP after displacement, subtle chromatic aberration at frame
  edges, bloom threshold high enough to only catch the rim highlights.

## Export → web contract

1. Movie File Out: PNG sequence, 1600×900 (or 2160p for a hero master),
   24 fps, 6–8 s loop (or a one-way 4–6 s move for scroll-sync).
2. Package for web (resizes + encodes + writes the manifest `sequence` block):

```
npm run gateway:frames -- --input "D:/renders/gateway_v1_td_png" --visual gateway-v1 --fps 24 --width 1600 --format avif --quality 55
```

3. Open `/test/gateway-motion?mode=scrub&visual=gateway-v1` — scroll scrubs
   your TD render. No code changes.

Budget guidance: keep final sequences ≤ 15 MB (AVIF q≈55 at 1600w typically
lands 40–90 KB/frame; 120–160 frames is the sweet spot). WebP q80 for fast
iteration proxies.
