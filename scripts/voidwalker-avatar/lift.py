"""
lift — open the crushed blacks of a COLOUR PLATE before it is graded or animated.

⚠ WHY THIS EXISTS (2026-09-25, `20260925-genai-v5` / `-v6`). GPT Image 2 draws
the owner's face faithfully and paints a black cloak as BLACK: its Latent Land
plates measured figure p50 18-23 with 19-44 % under luma 16, against the
Expanse plates that shipped at p50 ~34 and ~15 %. `gold.solve_exposure` then
raises the exposure to its ceiling (x1.35) to bring the figure's p75 into the
Architect's band, and the FACE — already the brightest thing on him — is pushed
to a near-white blob with no features: "too glowing" again, in the one place it
matters most. Lifting the darks on the PLATE fixes the cause rather than the
symptom: at gamma 0.8 the same plate solved to x0.93 and his face kept its
detail (measured, `regalia-gpt_01`: p50 23.5 -> 37.4, crush 0.19 -> 0.003).

⚠ A GAMMA ON LUMA, APPLIED AS A RATIO, SO THE COLOUR HOLDS — and on the FIGURE
ONLY, through the plate's own key matte, so the ground's chroma (which the key
reads) is untouched and the matte is the same before and after.

⚠ THE LIFTED PLATE IS WHAT GOES TO VEO. Lift a pick BEFORE `vid.py`, so the
idle and every frame `post.py` keys inherit the same tone; lifting only the
preview would ship a video that grades like the unlifted plate.

  python scripts/voidwalker-avatar/lift.py --wave 20260925-genai-v6 --match gpt
  python scripts/voidwalker-avatar/lift.py --source <plate.png> --gamma 0.8
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import gold  # noqa: E402

GAMMA = 0.8


def lift(src: Path, gamma: float = GAMMA) -> Path:
    """Write `<stem>-lift.png` beside `src`; return its path. Idempotent."""
    out = src.with_name(f"{src.stem}-lift.png")
    if out.exists():
        return out
    rgb = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    alpha = np.clip(gold.key_matte(rgb), 0, 1)
    y = gold.luma(rgb)
    y2 = 255.0 * (np.clip(y, 0, 255) / 255.0) ** gamma
    k = np.where(y > 1, y2 / np.maximum(y, 1), 1.0)
    k = 1.0 + (k - 1.0) * alpha
    Image.fromarray(np.clip(rgb * k[..., None], 0, 255).astype(np.uint8)).save(out)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wave", help="lift every plate in waves/<wave>/plates (never a -lift one)")
    ap.add_argument("--match", default="", help="with --wave: only plates whose name contains this")
    ap.add_argument("--source", type=Path, help="lift one plate")
    ap.add_argument("--gamma", type=float, default=GAMMA)
    args = ap.parse_args()
    if not (0.5 <= args.gamma <= 1.0):
        raise SystemExit("gamma must sit in [0.5, 1.0]: above 1 darkens, below 0.5 greys the cloth")
    if args.source:
        srcs = [args.source]
    elif args.wave:
        plates = Path(__file__).resolve().parent / "waves" / args.wave / "plates"
        srcs = [p for p in sorted(plates.glob("*.png")) if "-lift" not in p.stem and args.match in p.stem]
    else:
        raise SystemExit("give --wave or --source")
    for s in srcs:
        print(f"  {s.name} -> {lift(s, args.gamma).name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
