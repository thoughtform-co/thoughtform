r"""One sheet per wave. Judge the set before the frame.

    python tools/make_contact_sheet.py "<wave dir>"
    python tools/make_contact_sheet.py "<wave dir>" --sort verdict --cols 8
    python tools/make_contact_sheet.py "<wave dir>" --pick
    python tools/make_contact_sheet.py "<wave dir>" --compare "<other wave dir>"

Every note a reviewer sends is about the batch — "they all look the same", "the
ground is a different colour in every one", "three of these answer the same
question" — and none of it is visible one image at a time. So the sheet comes
before anyone sees a candidate, and before anything is handed over.

Tiles carry a verdict-coloured border read from the wave's own
`qa_results.json` when there is one. No grades is a legitimate state: an
unlabelled sheet is the honest picture of an ungraded wave, and it is still
worth looking at.

`--pick` shows the best-verdict draw per slot, one tile each; a repair draw and
the draw it repairs share a slot, so the two are compared, not both shown.
`--compare` puts two waves side by side, slot by slot, which is the only way to
see whether a prompt change moved the set or moved one frame.

Writes `_contact-sheet.png` inside the wave. The leading underscore is load
bearing: `config.candidates` skips it, so the sheet can never tile itself.

Pillow only, and no TTF is required — a sheet with the default bitmap font is
worth more than an exception.
"""
from __future__ import annotations

import argparse
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import config  # noqa: E402

Image.MAX_IMAGE_PIXELS = None

BG = (22, 24, 27)
CELL_BG = (14, 15, 17)
FG = (232, 230, 225)
DIM = (150, 147, 140)

VERDICT_COLOUR = {
    "PASS": (47, 158, 99),
    "PASS_WITH_NOTES": (110, 160, 90),
    "RETRY": (217, 154, 43),
    "FAIL": (198, 70, 62),
    "ERROR": (110, 110, 118),
    "SKIPPED": (90, 92, 98),
    "": (58, 62, 68),            # ungraded: a dark border, not a missing one
}

# Ranking is `config.VERDICT_RANK`, higher is better, with one addition the
# contract cannot make: where an *unknown* verdict sits. It sits here, above
# FAIL and below RETRY. On a prior engagement an unrecognised verdict string
# fell through to a default of -1 and so scored BELOW an explicit FAIL, which
# surfaced the failed draw of every slot whose other draws carried the
# unrecognised word. An unknown verdict must never outrank nothing and must
# never rank below a verdict that was actually decided.
UNGRADED_RANK = config.VERDICT_RANK["FAIL"] + 0.5


def rank(verdict: str) -> float:
    return config.VERDICT_RANK.get(verdict or "", UNGRADED_RANK)


def font(size: int):
    """First TTF that exists, else the bitmap default. Not having a font is not
    a reason to fail to draw a sheet."""
    for name in ("DejaVuSans.ttf", "segoeui.ttf", "arial.ttf", "Helvetica.ttc",
                 "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def load_grades(wave_dir: str, explicit: str | None = None):
    """`qa_results.json` beside the wave, keyed by filename. A list is accepted
    as well as the `{results: [...]}` envelope: an older results file is still
    a set of grades."""
    path = explicit or os.path.join(wave_dir, "qa_results.json")
    if not os.path.exists(path):
        return {}, None
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError) as e:
        print("  note: unreadable " + path + " — " + str(e) + ". Building an "
              "unlabelled sheet.")
        return {}, None
    rows = data if isinstance(data, list) else data.get("results", [])
    return {r.get("file", ""): r for r in rows if r.get("file")}, path


def ellipsis(d, text, f, width):
    if d.textlength(text, font=f) <= width:
        return text
    while text and d.textlength(text + "…", font=f) > width:
        text = text[:-1]
    return text + "…"


def collect(wave_dir: str) -> list[tuple[str, str]]:
    """Every candidate under the wave with the type folder it sits in.
    `config.candidates` owns the pruning: a folder or file starting with `_` is
    working material (display copies, format cuts, this sheet) and would tile
    the same picture twice."""
    return [(p, os.path.basename(os.path.dirname(p)))
            for p in config.candidates(wave_dir)]


def best_per_slot(items, grades):
    """One tile per slot: the best-verdict draw. Ties keep the first by name —
    a sheet is not a promotion, so a tie here costs nothing. `pick.py` is where
    a tie has to stay undecided."""
    best = {}
    for path, folder in items:
        name = os.path.basename(path)
        slot = config.slot_of(name)
        score = rank(grades.get(name, {}).get("verdict", ""))
        cur = best.get(slot)
        if cur is None or score > cur[0]:
            best[slot] = (score, path, folder)
    return best


def _sort_key(pair, grades, sort_by):
    path, folder = pair
    name = os.path.basename(path)
    g = grades.get(name, {})
    if sort_by == "verdict":
        # Worst first. A sheet sorted best-first hides its failures below the
        # fold, which is the one thing a contact sheet exists to prevent.
        return (rank(g.get("verdict", "")), folder, name)
    if sort_by == "slot":
        return (config.slot_of(name), name)
    return (folder, name)                      # type


def _tally(items, grades):
    counts = {}
    for path, _f in items:
        v = grades.get(os.path.basename(path), {}).get("verdict", "ungraded")
        counts[v] = counts.get(v, 0) + 1
    return counts


def _paste(sheet, d, path, x, y, cell_w, cell_h, colour, border):
    """One tile. A candidate that will not open becomes a marked cell, never an
    exception: one bad file must not kill the sheet the rest of the wave needs."""
    cell = Image.new("RGB", (cell_w, cell_h), CELL_BG)
    err = ""
    try:
        im = Image.open(path)
        im.load()
        im = im.convert("RGB")
        scale = min(cell_w / im.width, cell_h / im.height)
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))),
                       Image.LANCZOS)
        cell.paste(im, ((cell_w - im.width) // 2, (cell_h - im.height) // 2))
    except Exception as e:                       # noqa: BLE001 - str(e), never e
        err = str(e)
    sheet.paste(cell, (x, y))
    if err:
        d.text((x + 8, y + 8), ellipsis(d, "unreadable: " + err, font(12), cell_w - 16),
               font=font(12), fill=VERDICT_COLOUR["ERROR"])
    d.rectangle([x, y, x + cell_w - 1, y + cell_h - 1], outline=colour, width=border)


def _labels(d, x, y, cell_w, cell_h, name, g, third, colour):
    f_name, f_note = font(13), font(12)
    d.text((x + 2, y + cell_h + 5), ellipsis(d, name, f_name, cell_w - 4),
           font=f_name, fill=FG)
    failed = ",".join(str(f.get("id", "?")) for f in g.get("failed", []))
    line2 = (g.get("verdict") or "ungraded") + ("  " + failed if failed else "")
    d.text((x + 2, y + cell_h + 21), ellipsis(d, line2, f_note, cell_w - 4),
           font=f_note, fill=colour)
    d.text((x + 2, y + cell_h + 34), ellipsis(d, third, f_note, cell_w - 4),
           font=f_note, fill=DIM)


def build(wave_dir, grades, cell_w, cols, out, title, sort_by, pick):
    items = collect(wave_dir)
    if not items:
        raise SystemExit("no candidates in " + wave_dir)

    if pick:
        best = best_per_slot(items, grades)
        items = [(p, f) for _s, p, f in best.values()]
        # A wave whose filenames do not carry the grammar collapses to one tile.
        # Say so rather than showing 1 of 64 and calling it a sheet.
        if len(items) < 3:
            print("  note: --pick produced only " + str(len(items)) + " tiles. If the "
                  "filenames do not follow <TYPE>-<subject>__<lane>_<nn>.png the slots "
                  "have collapsed; run without --pick.")

    items.sort(key=lambda pair: _sort_key(pair, grades, sort_by))

    cols = cols or min(8, max(4, round(len(items) ** 0.5)))
    return _render([(p, f, grades, "") for p, f in items], cell_w, cols, out, title,
                   _tally(items, grades))


def build_compare(wave_a, wave_b, grades_a, grades_b, cell_w, cols, out, sort_by):
    """Two waves, slot by slot, best draw each. Pairs stay adjacent so the eye
    compares the pair and not the row; a slot present in only one wave keeps its
    place with an empty cell, because a missing draw is the finding."""
    a_items, b_items = collect(wave_a), collect(wave_b)
    if not a_items and not b_items:
        raise SystemExit("no candidates in either wave")
    a_best = best_per_slot(a_items, grades_a)
    b_best = best_per_slot(b_items, grades_b)
    label_a = os.path.basename(os.path.normpath(wave_a))
    label_b = os.path.basename(os.path.normpath(wave_b))

    def slot_key(slot):
        if sort_by == "verdict":
            return (rank(grades_a.get(os.path.basename(a_best[slot][1]), {})
                         .get("verdict", "")) if slot in a_best else UNGRADED_RANK,
                    slot)
        return (slot,)

    cells = []
    for slot in sorted(set(a_best) | set(b_best), key=slot_key):
        for side, best, grades, label in ((0, a_best, grades_a, label_a),
                                          (1, b_best, grades_b, label_b)):
            if slot in best:
                cells.append((best[slot][1], best[slot][2], grades, label))
            else:
                cells.append((None, slot, {}, label))   # not in this wave
    cols = cols or 4
    if cols % 2:
        cols += 1                                  # pairs must not straddle a row
    title = label_a + "   │   " + label_b
    tally = _tally([(p, f) for p, f in a_items], grades_a)
    for k, v in _tally([(p, f) for p, f in b_items], grades_b).items():
        tally[k] = tally.get(k, 0) + v
    return _render(cells, cell_w, cols, out, title, tally)


def _render(cells, cell_w, cols, out, title, counts):
    """cells: (path|None, folder-or-slot, grades, third-line-suffix)."""
    rows = (len(cells) + cols - 1) // cols
    cell_h = cell_w                       # square cells: a wave mixes formats
    pad, head, cap, border = 14, 62, 46, 3

    W = cols * cell_w + (cols + 1) * pad
    H = head + rows * (cell_h + cap) + (rows + 1) * pad
    sheet = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(sheet)
    d.text((pad, 14), title, font=font(22), fill=FG)
    d.text((pad, 40), "   ".join(v + " " + str(n) for v, n in sorted(counts.items())),
           font=font(13), fill=DIM)

    for i, (path, folder, grades, suffix) in enumerate(cells):
        r, c = divmod(i, cols)
        x = pad + c * (cell_w + pad)
        y = head + pad + r * (cell_h + cap + pad)
        if path is None:
            d.rectangle([x, y, x + cell_w - 1, y + cell_h - 1],
                        outline=VERDICT_COLOUR[""], width=1)
            d.text((x + 10, y + cell_h // 2), ellipsis(d, folder + " — not in "
                   + suffix, font(13), cell_w - 20), font=font(13), fill=DIM)
            continue
        name = os.path.basename(path)
        g = grades.get(name, {})
        colour = VERDICT_COLOUR.get(g.get("verdict", ""), VERDICT_COLOUR[""])
        _paste(sheet, d, path, x, y, cell_w, cell_h, colour, border)
        worst = g.get("worst_issue") or ""
        if suffix:                       # comparing: which wave this tile is from
            third = suffix + ((" · " + worst) if worst else "")
        else:
            third = worst or folder
        _labels(d, x, y, cell_w, cell_h, name, g, third, colour)

    os.makedirs(os.path.dirname(os.path.abspath(out)) or ".", exist_ok=True)
    sheet.save(out)
    print("  wrote " + out + "  (" + str(sheet.width) + "x" + str(sheet.height)
          + ", " + str(len(cells)) + " tiles)")
    return out


def main():
    ap = argparse.ArgumentParser(
        description="Contact-sheet a wave. Judge the set before the frame.")
    ap.add_argument("wave", help="a wave directory")
    ap.add_argument("--grades", default=None, help="a results file other than the wave's")
    ap.add_argument("--out", default=None,
                    help="default <wave>/_contact-sheet.png (the underscore keeps it "
                         "out of the candidates)")
    ap.add_argument("--width", type=int, default=420, help="tile size in px")
    ap.add_argument("--cols", type=int, default=0, help="0 picks a square-ish grid")
    ap.add_argument("--pick", action="store_true",
                    help="best-verdict draw per slot, one tile each")
    ap.add_argument("--compare", default="", metavar="DIR2",
                    help="a second wave, tiled beside the first slot by slot")
    ap.add_argument("--sort", dest="sort_by", default="type",
                    choices=("type", "slot", "verdict"))
    a = ap.parse_args()

    wave = os.path.normpath(a.wave)
    grades, path = load_grades(wave, a.grades)
    if path:
        print("  grades: " + os.path.basename(path) + " (" + str(len(grades)) + " rows)")
    else:
        print("  no qa_results.json — building an unlabelled sheet, which is the "
              "honest state of an ungraded wave")
    out = a.out or os.path.join(wave, "_contact-sheet.png")

    if a.compare:
        other = os.path.normpath(a.compare)
        grades_b, _p = load_grades(other)
        build_compare(wave, other, grades, grades_b, a.width, a.cols, out, a.sort_by)
        return
    build(wave, grades, a.width, a.cols, out, os.path.basename(wave), a.sort_by, a.pick)


if __name__ == "__main__":
    main()
