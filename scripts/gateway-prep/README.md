# Gateway Motion prep pipeline

Turns the 4K Gateway key visuals (Dropbox `05_Key Visuals/2026/Web`) into the
derivative sets consumed by the Gateway Motion Lab (`/test/gateway-motion`)
and by the TouchDesigner/Unreal handoff (see `docs/gateway-motion/`).

## One-time setup

Download the Depth Anything V2 (base) ONNX model (~389 MB, gitignored):

```
curl -L -o scripts/gateway-prep/models/depth_anything_v2_vitb.onnx ^
  https://huggingface.co/onnx-community/depth-anything-v2-base/resolve/main/onnx/model.onnx
```

Python needs `numpy`, `pillow`, `onnxruntime` on PATH (no torch/cv2/scipy).

## Usage

```
npm run gateway:prep                          # all 10 visuals (analyze + derive + manifest)
npm run gateway:prep -- --visual gateway-v1   # one visual (csv ok)
npm run gateway:prep -- --stage derive        # skip depth net, re-encode web derivatives
npm run gateway:prep -- --force --size 770    # re-analyze at higher depth-net resolution
```

Frame sequences for the scroll-scrub treatment (proxy from an existing video,
or a TD/Unreal image-sequence directory):

```
npm run gateway:frames -- --input public/videos/thoughtform-key-visual-2-web.mp4 --visual gateway-v1 --fps 24 --width 1280
npm run gateway:frames -- --input "D:/renders/gateway_orbit_png" --visual gateway-v1 --fps 30 --width 1600 --format avif --quality 55
```

## Outputs

- `scripts/gateway-prep/out/<id>/` (gitignored masters): `depth-16.png` (16-bit,
  for TD/Unreal displacement), `mask-artifact.png`, `mask-stars.png`,
  `background.png`, `analyze-meta.json`.
- `public/gateway-motion/<id>/`: plates (2560/1600 avif+webp), `depth-8.webp`,
  `depth-packed.webp` (16-bit as R=hi/G=lo, shader decode
  `(R*255*256 + G*255)/65535`), masks, `background-1600.webp`,
  `frames/f_NNNN.webp` + `sequence-poster.webp` (after `gateway:frames`),
  `meta.json`.
- `public/gateway-motion/manifest.json` — the runtime contract
  (`lib/gateway-motion/manifest.ts`). Hand-edited `tuning` blocks survive
  regeneration.

## Notes

- Depth Anything output is per-image RELATIVE inverse depth — do not compare
  across visuals; tune `uFocus`/`uReliefScale` per visual instead.
- The depth master is guided-filter upsampled against the plate (r=12,
  eps=1e-4) so depth edges snap to the artifact silhouette.
- All child processes are spawned with argv arrays + `shell:false` — the
  Dropbox source path contains spaces.
