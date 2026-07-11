#!/usr/bin/env python3
"""Gateway Motion prep - analysis masters for one plate.

Consumes a 4K gateway plate; emits master-resolution artifacts to --out:

  depth-16.png      16-bit grayscale depth (near = white), guided-filter
                    upsampled against the plate so edges snap to the artifact.
                    Consumed by derive.mjs (web depth) and TouchDesigner/Unreal.
  mask-artifact.png 8-bit matte of the ring + debris (grain/hairlines removed).
  mask-stars.png    8-bit mask of star points in the void region.
  background.png    Plate with the artifact removed (push-pull fill + grain
                    re-synthesis) - the "clean void" layer behind the mesh.
  analyze-meta.json Dimensions, model, timings, thresholds.

Dependencies: numpy, PIL, onnxruntime (all verified on this machine).
No cv2/scipy on purpose - morphology via PIL Min/MaxFilter, box blur via
cumsum integral images.

Depth model: Depth Anything V2 (ONNX). Output is RELATIVE inverse depth,
normalized per image - cross-visual consistency is not expected; runtime
treatments tune uFocus/uReliefScale per visual via the manifest.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


# ---------------------------------------------------------------- utilities


def log(msg: str) -> None:
    print(f"[analyze] {msg}", flush=True)


def to_luma(rgb: np.ndarray) -> np.ndarray:
    """rgb float32 [0,1] HxWx3 -> luma HxW."""
    return rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722


def resize_f32(arr: np.ndarray, size: tuple[int, int], resample=Image.BICUBIC) -> np.ndarray:
    """Resize a float32 array (HxW or HxWx3, [0,1]) via PIL. size=(w,h)."""
    if arr.ndim == 2:
        im = Image.fromarray((np.clip(arr, 0.0, 1.0) * 65535.0).astype(np.uint16))
        im = im.resize(size, resample)
        return np.asarray(im, dtype=np.float32) / 65535.0
    im = Image.fromarray((np.clip(arr, 0.0, 1.0) * 255.0).astype(np.uint8))
    im = im.resize(size, resample)
    return np.asarray(im, dtype=np.float32) / 255.0


def boxfilter(a: np.ndarray, r: int) -> np.ndarray:
    """Mean filter with window (2r+1) via integral image, edge-normalized."""
    if r <= 0:
        return a.copy()
    h, w = a.shape
    ones = np.ones((h, w), dtype=np.float64)

    def _box(x: np.ndarray) -> np.ndarray:
        c = np.cumsum(x, axis=0)
        top = np.vstack([c[r : 2 * r + 1], c[2 * r + 1 :] - c[: h - 2 * r - 1], np.tile(c[-1:], (r, 1)) - c[h - 2 * r - 1 : h - r - 1]])
        c = np.cumsum(top, axis=1)
        return np.hstack(
            [c[:, r : 2 * r + 1], c[:, 2 * r + 1 :] - c[:, : w - 2 * r - 1], np.tile(c[:, -1:], (1, r)) - c[:, w - 2 * r - 1 : w - r - 1]]
        )

    return (_box(a.astype(np.float64)) / _box(ones)).astype(np.float32)


def guided_filter(I: np.ndarray, p: np.ndarray, r: int, eps: float) -> np.ndarray:
    """Edge-preserving smoothing of p guided by I (He et al.)."""
    mean_I = boxfilter(I, r)
    mean_p = boxfilter(p, r)
    corr_Ip = boxfilter(I * p, r)
    corr_II = boxfilter(I * I, r)
    var_I = corr_II - mean_I * mean_I
    cov_Ip = corr_Ip - mean_I * mean_p
    a = cov_Ip / (var_I + eps)
    b = mean_p - a * mean_I
    return boxfilter(a, r) * I + boxfilter(b, r)


def binary_filter(mask: np.ndarray, size: int, mode: str) -> np.ndarray:
    """Morphology on a boolean mask via PIL rank filters. size must be odd."""
    im = Image.fromarray((mask * 255).astype(np.uint8))
    f = ImageFilter.MaxFilter(size) if mode == "dilate" else ImageFilter.MinFilter(size)
    return np.asarray(im.filter(f)) > 127


def binary_open(mask: np.ndarray, size: int) -> np.ndarray:
    return binary_filter(binary_filter(mask, size, "erode"), size, "dilate")


def binary_close(mask: np.ndarray, size: int) -> np.ndarray:
    return binary_filter(binary_filter(mask, size, "dilate"), size, "erode")


# ---------------------------------------------------------------- depth


def load_session(model_path: Path):
    import onnxruntime as ort

    sess = ort.InferenceSession(str(model_path), providers=["CPUExecutionProvider"])
    inp = sess.get_inputs()[0]
    return sess, inp.name, inp.shape


def model_input_size(shape, plate_wh: tuple[int, int], short_side: int) -> tuple[int, int, bool]:
    """Return (w, h, letterboxed) for the model input.

    Fixed-shape exports (e.g. [1,3,518,518]) force a square letterbox;
    dynamic exports get an aspect-preserving multiple-of-14 resolution
    with the short side at `short_side`.
    """
    fixed_h = shape[2] if isinstance(shape[2], int) else None
    fixed_w = shape[3] if isinstance(shape[3], int) else None
    if fixed_h and fixed_w:
        return fixed_w, fixed_h, True
    pw, ph = plate_wh
    if pw >= ph:
        h = short_side
        w = round(pw * short_side / ph)
    else:
        w = short_side
        h = round(ph * short_side / pw)
    w = max(14, round(w / 14) * 14)
    h = max(14, round(h / 14) * 14)
    return w, h, False


def run_depth(sess, input_name: str, in_w: int, in_h: int, letterboxed: bool, rgb: np.ndarray) -> np.ndarray:
    """Run DA2 on the plate (rgb float [0,1] HxWx3) -> raw depth at plate aspect."""
    h, w = rgb.shape[:2]
    if letterboxed:
        # Pad to the plate's aspect inside the square, filling with the
        # median border color (near-black void) so padding reads as more void.
        scale = min(in_w / w, in_h / h)
        rw, rh = round(w * scale), round(h * scale)
        resized = resize_f32(rgb, (rw, rh))
        border = np.median(np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]]), axis=0)
        canvas = np.tile(border.astype(np.float32), (in_h, in_w, 1))
        x0, y0 = (in_w - rw) // 2, (in_h - rh) // 2
        canvas[y0 : y0 + rh, x0 : x0 + rw] = resized
        net_in = canvas
    else:
        net_in = resize_f32(rgb, (in_w, in_h))

    x = (net_in - IMAGENET_MEAN) / IMAGENET_STD
    x = np.transpose(x, (2, 0, 1))[None].astype(np.float32)
    out = sess.run(None, {input_name: x})[0]
    depth = np.squeeze(out).astype(np.float32)

    if letterboxed:
        depth = depth[y0 : y0 + rh, x0 : x0 + rw]

    lo, hi = np.percentile(depth, 0.5), np.percentile(depth, 99.5)
    depth = np.clip((depth - lo) / max(hi - lo, 1e-6), 0.0, 1.0)
    return depth  # near = 1


# ---------------------------------------------------------------- background


def fill_background(rgb: np.ndarray, hole: np.ndarray) -> np.ndarray:
    """Push-pull fill of `hole` pixels (bool HxW) in rgb float [0,1]."""
    h, w = hole.shape
    img = rgb.copy()
    valid = (~hole).astype(np.float32)
    img = img * valid[..., None]

    # Pull: build coarser levels until everything is known.
    levels = [(img, valid)]
    while levels[-1][1].min() < 0.999 and min(levels[-1][0].shape[:2]) > 4:
        cimg, cval = levels[-1]
        ch, cw = cimg.shape[:2]
        nh, nw = (ch + 1) // 2, (cw + 1) // 2
        pimg = np.zeros((nh, nw, 3), dtype=np.float32)
        pval = np.zeros((nh, nw), dtype=np.float32)
        for dy in (0, 1):
            for dx in (0, 1):
                sub_i = cimg[dy::2, dx::2]
                sub_v = cval[dy::2, dx::2]
                pimg[: sub_i.shape[0], : sub_i.shape[1]] += sub_i
                pval[: sub_v.shape[0], : sub_v.shape[1]] += sub_v
        pimg = pimg / np.maximum(pval, 1e-6)[..., None]
        pval = (pval > 0).astype(np.float32)
        pimg = pimg * pval[..., None]
        levels.append((pimg, pval))

    # Push: fill unknowns from the coarser level.
    for i in range(len(levels) - 2, -1, -1):
        cimg, cval = levels[i]
        pimg, _ = levels[i + 1]
        ch, cw = cimg.shape[:2]
        up = resize_f32(np.clip(pimg, 0, 1), (cw, ch), Image.BILINEAR)
        unk = cval < 0.5
        cimg[unk] = up[unk]
        levels[i] = (cimg, np.ones_like(cval))

    return np.clip(levels[0][0], 0.0, 1.0)


def synth_grain(shape: tuple[int, int], sigma: float, rng: np.random.Generator) -> np.ndarray:
    return rng.normal(0.0, sigma, size=shape).astype(np.float32)


# ---------------------------------------------------------------- main


def main() -> int:
    ap = argparse.ArgumentParser(description="Gateway plate analysis (depth/matte/stars/background masters)")
    ap.add_argument("--plate", required=True, help="Source plate image (webp/png)")
    ap.add_argument("--out", required=True, help="Output directory for masters")
    ap.add_argument("--model", default=None, help="Depth Anything V2 ONNX model path")
    ap.add_argument("--stage", default="all", choices=["all", "depth", "matte", "stars", "background"])
    ap.add_argument("--size", type=int, default=518, help="Depth net short-side target (dynamic models)")
    ap.add_argument("--master-width", type=int, default=2048)
    ap.add_argument("--matte-threshold", type=float, default=0.045)
    ap.add_argument("--star-threshold", type=float, default=0.09)
    args = ap.parse_args()

    t0 = time.time()
    plate_path = Path(args.plate)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    src = Image.open(plate_path).convert("RGB")
    src_w, src_h = src.size
    mw = args.master_width
    mh = round(src_h * mw / src_w)
    log(f"plate {plate_path.name} {src_w}x{src_h} -> master {mw}x{mh}")

    rgb_m = np.asarray(src.resize((mw, mh), Image.LANCZOS), dtype=np.float32) / 255.0
    luma_m = to_luma(rgb_m)
    meta: dict = {
        "source": {"file": plate_path.name, "width": src_w, "height": src_h},
        "master": {"width": mw, "height": mh},
        "params": {
            "matteThreshold": args.matte_threshold,
            "starThreshold": args.star_threshold,
            "netShortSide": args.size,
        },
        "timings": {},
    }

    want = lambda s: args.stage in ("all", s)  # noqa: E731

    # ---- depth (first: the matte uses it as a near-object cue)
    depth_gf = None
    need_depth = want("depth") or want("matte") or want("stars") or want("background")
    if need_depth:
        depth_master_path = out_dir / "depth-16.png"
        if not want("depth") and depth_master_path.exists():
            depth_gf = np.asarray(Image.open(depth_master_path), dtype=np.float32) / 65535.0
            if depth_gf.shape != (mh, mw):
                depth_gf = resize_f32(depth_gf, (mw, mh), Image.BILINEAR)
        else:
            if not args.model or not Path(args.model).exists():
                log(f"ERROR: depth model not found at {args.model!r}")
                return 2
            t = time.time()
            sess, input_name, in_shape = load_session(Path(args.model))
            in_w, in_h, boxed = model_input_size(in_shape, (src_w, src_h), args.size)
            log(f"depth net input {in_w}x{in_h} (letterbox={boxed}, shape={in_shape})")
            rgb_full = np.asarray(src, dtype=np.float32) / 255.0
            depth_raw = run_depth(sess, input_name, in_w, in_h, boxed, rgb_full)
            meta["timings"]["depthNet"] = round(time.time() - t, 2)

            t = time.time()
            depth_up = resize_f32(depth_raw, (mw, mh), Image.BILINEAR)
            depth_gf = guided_filter(luma_m, depth_up, r=12, eps=1e-4)
            depth_gf = np.clip(depth_gf, 0.0, 1.0)
            Image.fromarray((depth_gf * 65535.0).astype(np.uint16)).save(depth_master_path)
            meta["timings"]["depthUpsample"] = round(time.time() - t, 2)
            meta["depthNet"] = {"input": [in_w, in_h], "letterboxed": boxed}
            log(f"depth master written ({meta['timings'].get('depthNet')}s net, {meta['timings']['depthUpsample']}s upsample)")

    # ---- matte (needed by stars + background too)
    # The void is NOT flat black — v1 has a broad charcoal gradient — so an
    # absolute luma threshold fails. Instead: local contrast (luma minus a
    # large-radius blur cancels smooth gradients) plus the depth cue (the
    # artifact is the near object). open(5) kills grain speckle + hairline
    # HUD annotations; close(9) heals texture gaps inside the artifact body.
    matte = None
    if want("matte") or want("stars") or want("background"):
        t = time.time()
        resid = luma_m - boxfilter(luma_m, 64)
        # Depth term stands alone: wide bright bodies have ~zero residual at
        # their center (blur window fits inside), and the depth halo slightly
        # over-including past the silhouette is harmless for fill/shimmer.
        raw = (resid > args.matte_threshold) | (depth_gf > 0.62)
        matte = binary_close(binary_open(raw, 5), 9)
        if want("matte"):
            Image.fromarray((matte * 255).astype(np.uint8)).save(out_dir / "mask-artifact.png")
        meta["timings"]["matte"] = round(time.time() - t, 2)
        log(f"matte: {matte.mean() * 100:.1f}% of frame")

    # ---- stars
    stars = None
    if want("stars") or want("background"):
        t = time.time()
        tophat = luma_m - boxfilter(luma_m, 6)
        bg_region = ~binary_filter(matte, 9, "dilate")
        # Grain speckle is ~2-3 sigma (~0.06) and 1-2 px; stars are brighter
        # (0.15+ over local mean) and larger — the tophat amplitude separates
        # them, with an absolute luma floor as a second guard.
        stars = (tophat > args.star_threshold) & (luma_m > 0.12) & bg_region
        stars = binary_filter(stars, 3, "dilate")
        if want("stars"):
            Image.fromarray((stars * 255).astype(np.uint8)).save(out_dir / "mask-stars.png")
        meta["timings"]["stars"] = round(time.time() - t, 2)
        log(f"stars: {int(stars.sum())} px ({stars.mean() * 100:.2f}%)")

    # ---- background
    if want("background"):
        t = time.time()
        hole = binary_filter(matte, 7, "dilate")
        filled = fill_background(rgb_m, hole)
        # Re-grain the filled region so it matches the void's texture.
        void = ~hole & ~stars
        hp = luma_m - boxfilter(luma_m, 3)
        sigma = float(np.std(hp[void])) if void.any() else 0.01
        rng = np.random.default_rng(1729)
        grain = synth_grain((mh, mw), sigma, rng)
        filled = np.clip(filled + grain[..., None] * hole[..., None], 0.0, 1.0)
        # Keep original void pixels verbatim (real grain + stars).
        filled[~hole] = rgb_m[~hole]
        Image.fromarray((filled * 255.0).astype(np.uint8)).save(out_dir / "background.png")
        meta["timings"]["background"] = round(time.time() - t, 2)
        meta["background"] = {"grainSigma": round(sigma, 5)}
        log(f"background written (grain sigma {sigma:.4f})")

    meta["timings"]["total"] = round(time.time() - t0, 2)
    (out_dir / "analyze-meta.json").write_text(json.dumps(meta, indent=2))
    log(f"done in {meta['timings']['total']}s -> {out_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
