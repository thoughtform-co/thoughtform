r"""Web-weight copies of what goes on a board, and their true pixel sizes.

    python tools/figma_prep.py --spec delivery/board.json
    python tools/figma_prep.py --spec delivery/board.json --out "<dir>" --max-edge 2400

A design tool streams image fills lazily, so a page asking a browser for thirty
full-size PNGs sits grey while each one downloads in turn. One engagement
shipped exactly that: twenty-five masters at about 3 MB each read to the client
as *a lot of images missing on the page*. The masters were fine (a key-visual
engagement's finding, 2026-09).

So the board gets progressive JPEGs, longest edge 2400 px, quality 88. A slot
displays at most 1600 px wide, so 2400 leaves headroom for zoom, and the
masters are never touched.

The spec is the judgment and lives in the engagement: a JSON object with
`tiles`, a list of `{"id": "<unique>", "src": "<path>"}` and whatever else the
board needs (captions, sections, order). Everything but `id` and `src` is
ignored here and travels with the spec.

The index this writes carries the **true pixel size of every copy**, because a
board that sets a tile's aspect from a guess crops the picture: a frame's ratio
has to come from the file, not from the slot it sits in.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

MAX_EDGE = 2400
QUALITY = 88


def web_weight(src: str, dest: str, max_edge: int = MAX_EDGE, quality: int = QUALITY):
    """One progressive JPEG, longest edge capped. Returns (width, height)."""
    os.makedirs(os.path.dirname(os.path.abspath(dest)), exist_ok=True)
    with Image.open(src) as im:
        im = im.convert("RGB")
        if max(im.size) > max_edge:
            s = max_edge / max(im.size)
            im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))),
                           Image.LANCZOS)
        im.save(dest, "JPEG", quality=quality, optimize=True, progressive=True)
        return im.size


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Web-weight a board's tiles and record their true pixel sizes.")
    ap.add_argument("--spec", required=True,
                    help='JSON with {"tiles": [{"id": "...", "src": "<path>"}, ...]}')
    ap.add_argument("--out", default=None,
                    help="where the copies go (default: _figma/ beside the spec)")
    ap.add_argument("--max-edge", type=int, default=MAX_EDGE)
    ap.add_argument("--quality", type=int, default=QUALITY)
    a = ap.parse_args()

    with open(a.spec, encoding="utf-8") as f:
        spec = json.load(f)
    tiles = spec.get("tiles") or []
    if not tiles:
        sys.exit("  the spec has no tiles.")
    out_dir = a.out or os.path.join(os.path.dirname(os.path.abspath(a.spec)), "_figma")

    rows, missing, total_in, total_out = [], [], 0, 0
    seen = set()
    for t in tiles:
        tid, src = t.get("id"), t.get("src")
        if not tid or not src:
            sys.exit("  every tile needs an id and a src: " + json.dumps(t)[:120])
        if tid in seen:
            sys.exit("  duplicate tile id " + repr(tid) + " - ids name the files and "
                     "must be unique.")
        seen.add(tid)
        if not os.path.isfile(src):
            missing.append(tid + "  " + src)
            print("  MISSING  " + tid.ljust(26) + src)
            continue
        dest = os.path.join(out_dir, tid + ".jpg")
        w, h = web_weight(src, dest, a.max_edge, a.quality)
        total_in += os.path.getsize(src)
        total_out += os.path.getsize(dest)
        rows.append({"id": tid, "file": os.path.basename(dest), "path": dest,
                     "w": w, "h": h})
        print("  " + tid.ljust(26) + os.path.basename(dest).ljust(34)
              + ("%4dx%-5d" % (w, h)) + ("%5.0f KB" % (os.path.getsize(dest) / 1024)))

    # The copies create this directory as they are written; when every source
    # was missing nothing created it, and the index write used to die with a
    # traceback instead of the report that says which source is gone.
    os.makedirs(out_dir, exist_ok=True)
    index = os.path.join(out_dir, "_index.json")
    with open(index, "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=1)
    print("\n  " + str(len(rows)) + " of " + str(len(tiles)) + " tiles, "
          + ("%.1f MB -> %.1f MB" % (total_in / 1e6, total_out / 1e6)))
    print("  " + index)
    if missing:
        print("\n  " + str(len(missing)) + " source(s) not on disk. Nothing was invented "
              "for them; fix the spec or the path.")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
