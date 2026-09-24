"""
legs — how much of the figure BELOW THE WAIST an edited plate kept.

A scene runs from the plate to a drawn end pose (`vid.py --scene --ending aim
--last <aimstand>`), and Veo interpolates between the two: a boot that moved
between them SLIDES. ADR-082 U35 picked its aim-stand plate on "legs IoU
0.979" measured by hand; this is that measure as a script, so the next pick is
a number rather than a memory.

The figure is keyed on the era's ground (`grounds.py`, the same arithmetic
`gold.py` keys with), the mask is compared with the SOURCE plate's over the rows
below `--waist` (a fraction of the height, 0.55 by default: the kilt's hem and
everything under it), and the intersection-over-union is printed per plate. A
plate re-sized by another model (GPT Image 2 answers at 1024×1536 where Gemini
answers at 2K) is compared at the source's size.

  python scripts/voidwalker-avatar/legs.py --wave <wave> --source <plate.png> [--glob "plate-expanse-aimstand*.png"] [--waist 0.55]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from grounds import ground_name  # noqa: E402


def key_mask(im: Image.Image, era: str) -> np.ndarray:
    """True where the figure is — the ground keyed out on the era's own colour."""
    a = np.asarray(im.convert("RGB")).astype(np.int32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if ground_name(era) == "magenta":
        s = np.minimum(r, b) - g
    else:
        s = b - np.maximum(r, g)
    # The ground's own saturation, sampled at the corners, sets the gate.
    corners = np.concatenate([s[:24, :24].ravel(), s[:24, -24:].ravel(), s[-24:, :24].ravel(), s[-24:, -24:].ravel()])
    gate = float(np.percentile(corners, 10)) * 0.5
    return s < gate


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wave", required=True)
    ap.add_argument("--source", required=True, type=Path)
    ap.add_argument("--glob", default="plate-*-aimstand*.png")
    ap.add_argument("--waist", type=float, default=0.55)
    ap.add_argument("--era", default="expanse")
    args = ap.parse_args()

    wave = Path(__file__).resolve().parent / "waves" / args.wave
    src_im = Image.open(args.source)
    src = key_mask(src_im, args.era)
    h, w = src.shape
    y0 = int(h * args.waist)
    rows = []
    for path in sorted((wave / "plates").glob(args.glob)):
        im = Image.open(path)
        if im.size != src_im.size:
            im = im.resize(src_im.size, Image.LANCZOS)
        m = key_mask(im, args.era)
        a, b = src[y0:], m[y0:]
        inter = np.logical_and(a, b).sum()
        union = np.logical_or(a, b).sum()
        iou = inter / union if union else 0.0
        # And the head's own box, so a pose that kept the legs but moved the
        # man up or down is not read as a keeper.
        ys = np.where(m.any(axis=1))[0]
        top = int(ys[0]) if ys.size else -1
        rows.append((path.name, iou, top))
        print(f"  {path.name:40} legs IoU {iou:.3f}   ink top row {top}   (source top {int(np.where(src.any(axis=1))[0][0])})")
    if rows:
        best = max(rows, key=lambda r: r[1])
        print(f"\nbest legs: {best[0]} ({best[1]:.3f}) — read its head on the sheet before picking")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
