r"""Cut the second and third formats out of a master, in code.

    python tools/crop.py "<dir of masters>"
    python tools/crop.py "<one file>" --to 9:16 --anchor 0.5

A crop is lossless and it is the same picture. A second draw is a second
picture, and on work whose whole point is that the subject is right, that
difference is the whole argument. So a placement pair is one frame cut twice,
never two draws.

Which master is cut to what is `armada.toml` `[formats.cuts]`, read at runtime.
The table is not in this script and must not be: the day an engagement delivers
a 2:3 master, that is an edit to the toml, not a patch here.

Crops are anchored, not centred. `[formats].anchor` is where the kept area
sits: 0.5 centred, lower sits higher in the master. The default sits high
because a subject usually sits low in the frame and a centred cut takes its
feet off. `--anchor` overrides for one run.

The master is opened and never written. Derives land in `<dir>/_formats/`,
whose underscore keeps them out of `config.candidates` — a crop tiled beside
its own master on a contact sheet is the same picture twice, and asked for
twice in a review. A derive that already exists is left alone: resume by
existence, here as everywhere.
"""
from __future__ import annotations

import argparse
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config  # noqa: E402

Image.MAX_IMAGE_PIXELS = None

EXTS = (".png", ".jpg", ".jpeg", ".webp")


def ratio(spec: str) -> float:
    """`9:16` -> 0.5625. Any ratio the toml names works; nothing is hardcoded."""
    try:
        w, h = spec.replace("x", ":").split(":")
        return float(w) / float(h)
    except (ValueError, ZeroDivisionError):
        config.die("not a ratio: " + repr(spec) + " (expected w:h, e.g. 9:16)")
        return 1.0


def nearest_master(w: int, h: int, cuts: dict) -> str:
    """The declared master ratio this image is closest to. The candidates are
    the keys of `[formats.cuts]` and nothing else: a ratio the engagement does
    not deliver is not a ratio to guess at."""
    r = w / h
    if not cuts:
        config.die("[formats.cuts] is empty in armada.toml — nothing declares which "
                   "masters this engagement delivers, so nothing can be cut from one.")
    return min(cuts, key=lambda k: abs(ratio(k) - r))


def dest_for(path: str, target: str, out_dir: str) -> str:
    """`<out>/<stem>__<ratio>.png`, with the colon written `x`: a colon is not a
    legal filename character on Windows and a delivery folder is opened there."""
    stem = os.path.splitext(os.path.basename(path))[0]
    return os.path.join(out_dir, stem + "__" + target.replace(":", "x") + ".png")


def cut(path: str, target: str, out_dir: str, anchor: float) -> str | None:
    """One cut, written atomically. A half-written PNG beside a wave is worse
    than no PNG: it is picked up by everything downstream and read as a draw."""
    dest = dest_for(path, target, out_dir)
    if os.path.exists(dest):
        print("  " + os.path.basename(dest) + "  exists, left alone")
        return None
    with Image.open(path) as im:
        w, h = im.size
        want = ratio(target)
        if w / h > want:                       # cut the sides, keep the middle
            nw = int(round(h * want))
            x = int(round((w - nw) * 0.5))
            box = (x, 0, x + nw, h)
        else:                                  # cut top and bottom, anchored
            nh = int(round(w / want))
            y = max(0, min(h - nh, int(round((h - nh) * anchor))))
            box = (0, y, w, y + nh)
        os.makedirs(out_dir, exist_ok=True)
        tmp = dest + ".part"
        im.crop(box).save(tmp, "PNG")
    os.replace(tmp, dest)
    return dest


def main():
    ap = argparse.ArgumentParser(
        description="Cut placements out of masters, in code. Reads [formats] from "
                    "armada.toml.")
    ap.add_argument("src", help="a file, or a directory of masters")
    ap.add_argument("--out", default=None, help="default <dir>/_formats")
    ap.add_argument("--to", default="", metavar="RATIO",
                    help="force one target, e.g. 9:16")
    ap.add_argument("--anchor", type=float, default=None,
                    help="override [formats].anchor for this run (0.5 centred)")
    ap.add_argument("--dry-run", action="store_true",
                    help="say what would be cut, write nothing")
    a = ap.parse_args()

    cfg = config.load()
    cuts = cfg["formats"]["cuts"]
    anchor = cfg["formats"]["anchor"] if a.anchor is None else a.anchor

    src = os.path.normpath(a.src)
    if os.path.isdir(src):
        files = [os.path.join(src, f) for f in sorted(os.listdir(src))
                 if f.lower().endswith(EXTS) and not f.startswith("_")]
        base = src
    else:
        files, base = [src], os.path.dirname(os.path.abspath(src))
    if not files:
        raise SystemExit("no masters in " + src)

    out_dir = a.out or os.path.join(base, "_formats")
    n = 0
    for f in files:
        try:
            with Image.open(f) as im:
                size = im.size
        except Exception as e:                  # noqa: BLE001 - str(e), never e
            print("  " + os.path.basename(f) + "  FAIL unreadable: " + str(e))
            continue                            # one file must not kill the run
        master = nearest_master(*size, cuts=cuts)
        targets = [a.to] if a.to else list(cuts.get(master, []))
        targets = [t for t in targets if abs(ratio(t) - ratio(master)) > 1e-6]
        if not targets:
            print("  " + os.path.basename(f) + "  " + master
                  + " — no cut, this is the delivered format")
            continue
        for t in targets:
            if a.dry_run:
                dest = dest_for(f, t, out_dir)
                if os.path.exists(dest):
                    print("  " + os.path.basename(dest) + "  exists, would be left alone")
                    continue
                print("  " + os.path.basename(f) + "  " + master + " -> " + t + "  "
                      + os.path.basename(dest) + "  (dry run)")
                n += 1
                continue
            dest = cut(f, t, out_dir, anchor)
            if dest:
                n += 1
                print("  " + os.path.basename(f) + "  " + master + " -> " + t + "  "
                      + os.path.basename(dest))
    print("\n  " + str(n) + " placement" + ("" if n == 1 else "s")
          + (" would be cut into " if a.dry_run else " cut into ") + out_dir
          + "   anchor " + str(anchor))


if __name__ == "__main__":
    main()
