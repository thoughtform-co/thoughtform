"""thumb.py — the era band's bust thumbnail, cut from a delivery's alpha poster.

    python scripts/voidwalker-avatar/thumb.py            # backfill every shipped delivery
    python scripts/voidwalker-avatar/thumb.py --only azeroth

ADR-082 U31: the era band is a five-cell THUMBNAIL gallery (owner, 2026-09-21:
"more like a sort of thumbnail gallery that should be a bit more clear"). U23 had
dropped the framed bust WITH five lazily-fetched full posters (~363 KB); this is
how the picture comes back without the weight — one 192x128 WebP per delivery,
<= 10 KB, with alpha, so the bust sits on the void like the figure does.

⚠ THE CROP IS SOLVED FROM HEAD MARKS, NOT FROM THE CANVAS. The five deliveries
draw their heads at different sizes and heights (the Architect's is 174px tall
at y 0.122; azeroth's is 122px at y 0.288, because his proportions are heroic
and his frame is width-bound), so one fixed window gives five busts at five
scales — which a row of thumbnails shows instantly. Every thumb is cut so that:

    crown → beard-bottom   fills  HEAD_FRAC  of the thumb's height
    the eye line           sits   EYE_FRAC   from the top
    the head's own centre  is the thumb's centre

i.e. one head size and one eye line across the row. The marks are read off
FRAME ZERO (the poster is frame zero) and recorded here beside the delivery they
belong to; a re-cut delivery re-marks, it does not inherit.

⚠ THE THUMB'S VERSION IS ITS POSTER'S VERSION (`holo-thumb-<era>-vN.webp`), and
the unit guard pins the pair — so a re-cut figure can never keep a stale bust.
"""

from __future__ import annotations

import io
import sys
from pathlib import Path

from PIL import Image

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

REPO = Path(__file__).resolve().parents[2]
IMAGES = REPO / "public" / "images" / "voidwalker"

SIZE = (192, 128)  # 3:2 — ~2.5x the largest painted cell, so it stays crisp at 2x
HEAD_FRAC = 0.50
EYE_FRAC = 0.42
MAX_BYTES = 10_240

# crown / chin (bottom of the beard) / eye line / head centre-x, normalised to the
# 720x1280 canvas, read off each delivery's frame-zero poster.
MARKS: dict[str, dict] = {
    "thoughtform": dict(poster="holo-still-thoughtform.webp", out="holo-thumb-thoughtform.webp",
                        crown=0.122, chin=0.258, eye=0.205, cx=0.500),
    "genai": dict(poster="holo-still-genai-v2.webp", out="holo-thumb-genai-v2.webp",
                  crown=0.095, chin=0.211, eye=0.166, cx=0.490),
    # v11 = v10 + 33 rows (0.0258): the marks move with the frames.
    "azeroth": dict(poster="holo-still-azeroth-v11.webp", out="holo-thumb-azeroth-v11.webp",
                    crown=0.2875, chin=0.383, eye=0.332, cx=0.465),
    # v4 STANDS (ADR-082 U34, the commander): a new plate, so the marks are
    # re-read off its own frame zero, never carried from v2/v3's kneel. The
    # crown is the cap's top in the head's own columns (the pointing hand is
    # lower and further out); the chin is the beard's bottom above the collar.
    "expanse": dict(poster="holo-still-expanse-v4.webp", out="holo-thumb-expanse-v4.webp",
                    crown=0.1148, chin=0.237, eye=0.174, cx=0.445),
    # 2016's trainer (ADR-082 U33), a cel: the crown is the CAP's top, and the
    # drawn head is larger than a photographed one (0.175 of the canvas against
    # the Architect's 0.136) — the marks centre it, one eye line across the row.
    "pokemon-go": dict(poster="holo-still-pokemon-go-v1.webp", out="holo-thumb-pokemon-go-v1.webp",
                       crown=0.040, chin=0.215, eye=0.145, cx=0.505),
}


def cut_thumb(poster: Path, marks: dict, out: Path, *, size=SIZE, head_frac=HEAD_FRAC,
              eye_frac=EYE_FRAC, max_bytes=MAX_BYTES) -> int:
    """Cut one bust. Returns the bytes written."""
    src = Image.open(poster).convert("RGBA")
    w, h = src.size
    head_h = (marks["chin"] - marks["crown"]) * h
    crop_h = head_h / head_frac
    crop_w = crop_h * size[0] / size[1]
    top = marks["eye"] * h - eye_frac * crop_h
    left = marks["cx"] * w - crop_w / 2
    box = tuple(int(round(v)) for v in (left, top, left + crop_w, top + crop_h))

    # ⚠ PAD WITH TRANSPARENCY, NEVER CLAMP. A window that runs off the canvas (a
    # head near the top edge) must keep the head where the marks put it; clamping
    # the box back inside the canvas slides the eye line per era, silently.
    window = Image.new("RGBA", (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
    window.paste(src, (-box[0], -box[1]))
    thumb = window.resize(size, Image.LANCZOS)

    quality, data = 82, b""
    while quality >= 40:
        buf = io.BytesIO()
        thumb.save(buf, "WEBP", quality=quality, alpha_quality=80, method=6)
        data = buf.getvalue()
        if len(data) <= max_bytes:
            break
        quality -= 6
    if len(data) > max_bytes:
        raise SystemExit(f"{out.name}: {len(data)} B at quality {quality} — over the {max_bytes} B budget")
    out.write_bytes(data)
    return len(data)


def main() -> None:
    only = sys.argv[sys.argv.index("--only") + 1] if "--only" in sys.argv else None
    for era, m in MARKS.items():
        if only and era != only:
            continue
        n = cut_thumb(IMAGES / m["poster"], m, IMAGES / m["out"])
        print(f"{era:12} {m['out']:34} {n:6} B")


if __name__ == "__main__":
    main()
