"""
sheet — the BLIND pick sheet for a plate wave (ADR-082 U31, owner gate G1).

The owner picks one plate per era. What he has to judge is LIKENESS first and
look second, so each column shows, for one draw:

  1  the plate as drawn (full colour, on the key ground)
  2  its gold PREVIEW — what will actually ship (`gold.py`, via `grade.py`)
  3  the FACE, enlarged, beside his own reference face at the SAME face height

⚠ LETTERED, SHUFFLED, AND THE KEY IS A SEPARATE FILE. Draw numbers carry an
order and an order carries a bias (the first draw read as "the original" in the
last wave's review); letters on a shuffled sheet carry nothing.

⚠ THE FACE IS FOUND, NOT ASSUMED — the highest skin-tone blob on the plate
(`find_face`). A lock's framing is a request the model does not always honour, so
the expected box is only the fallback, and a sheet that used it SAYS so under
that column: a face zoom of the wrong region is worse than none.

  python scripts/voidwalker-avatar/sheet.py --wave 20260921-genai-v4
"""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

#: Where the lock asks the face to be, as fractions of the plate: the fallback.
EXPECTED_FACE = {
    "genai": (0.40, 0.09, 0.60, 0.23),
    "expanse": (0.38, 0.34, 0.62, 0.50),
    # ADR-082 U33: standing, cap top ~7 % down, the drawn head a little large.
    "pokemon-go": (0.37, 0.08, 0.63, 0.22),
}
COL_H = 560
FACE_H = 180
#: `identity-1.jpg` (= the photo bank's `face-detail.jpg`, 1200x1194) is ONE
#: fixed file, so its face box is AUTHORED, from the cap's brim to the chin,
#: after looking. ⚠ Its warm beige backdrop is itself skin-toned, so the blob
#: detector below swallows the whole frame on it — measured, not assumed.
REF_FACE_BOX = (330, 470, 870, 1075)


def find_face(img: Image.Image) -> tuple[int, int, int, int] | None:
    """The face as the HIGHEST sizeable skin-tone blob.

    ⚠ NOT A HAAR CASCADE: OpenCV 5 no longer ships `CascadeClassifier`, and a
    detector that silently falls back to the expected box on every column would
    make the face zoom a lie. A plate is FULL COLOUR, which is what makes this
    work: skin is a narrow band in YCrCb, the Expanse hands are gloved, and the
    Latent Land hands hang below the face — so the topmost blob is the face on
    both locks and on the reference photographs."""
    from scipy import ndimage

    ycc = np.asarray(img.convert("YCbCr")).astype(np.int16)
    y, cb, cr = ycc[..., 0], ycc[..., 1], ycc[..., 2]
    skin = (cr >= 135) & (cr <= 178) & (cb >= 80) & (cb <= 132) & (y > 40)
    skin = ndimage.binary_opening(skin, iterations=2)
    lab, n = ndimage.label(skin)
    if n == 0:
        return None
    min_area = (img.width * img.height) * 0.0015
    boxes = []
    for sl, idx in zip(ndimage.find_objects(lab), range(1, n + 1)):
        area = int((lab[sl] == idx).sum())
        # ⚠ A GOLD HALO IS SKIN-TONED IN YCrCb (2026-09-25, genai-v5/v6): its
        # warm ring sits above the head, so "the highest blob" zoomed every
        # column onto the halo. A ring fills a small share of its own box and a
        # face or a hand most of it, so a blob under 35 % of its box is skipped.
        fill = area / max(1, (sl[0].stop - sl[0].start) * (sl[1].stop - sl[1].start))
        if area >= min_area and fill >= 0.35:
            boxes.append((sl[0].start, sl[1].start, sl[1].stop, sl[0].stop, area))
    if not boxes:
        return None
    top, x0, x1, y1, _ = min(boxes, key=lambda b: b[0])
    # a face is taller than wide; the blob can stop at the beard, so square it up
    h = max(y1 - top, int((x1 - x0) * 1.2))
    return int(x0), int(top), int(x1), int(top + h)


def face_zoom(img: Image.Image, box: tuple[int, int, int, int], face_h: int) -> Image.Image:
    """A square around the face box, scaled so the FACE is `face_h` tall."""
    x0, y0, x1, y1 = box
    fh = y1 - y0
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    half = fh * 0.95
    crop = img.crop((int(cx - half), int(cy - half), int(cx + half), int(cy + half)))
    scale = face_h / fh
    side = int(round(2 * half * scale))
    return crop.resize((side, side), Image.LANCZOS)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wave", required=True)
    ap.add_argument("--era", default=None, help="defaults to the wave's own name")
    args = ap.parse_args()

    wave = Path(__file__).resolve().parent / "waves" / args.wave
    era = args.era or next((e for e in EXPECTED_FACE if f"-{e}-" in args.wave), "genai")
    plates = sorted((wave / "plates").glob("*.png"))
    if not plates:
        raise SystemExit(f"no plates in {wave / 'plates'}")
    gates = json.loads((wave / "plates.json").read_text(encoding="utf-8")) \
        if (wave / "plates.json").exists() else {}

    ref = Image.open(wave / "refs" / "identity-1.jpg").convert("RGB")
    ref_box = REF_FACE_BOX
    ref_face = face_zoom(ref, ref_box, FACE_H)

    order = list(plates)
    random.Random(args.wave).shuffle(order)
    key = {}
    columns = []
    for letter, path in zip("ABCDEFGHIJ", order):
        key[letter] = path.name
        plate = Image.open(path).convert("RGB")
        gold_path = wave / "gold" / f"{path.stem}.gold-on-black.jpg"
        goldi = Image.open(gold_path).convert("RGB") if gold_path.exists() else Image.new("RGB", plate.size)
        box = find_face(plate)
        note = ""
        if box is None:
            fx0, fy0, fx1, fy1 = EXPECTED_FACE[era]
            box = (int(fx0 * plate.width), int(fy0 * plate.height),
                   int(fx1 * plate.width), int(fy1 * plate.height))
            note = "no face found — expected box"
        face = face_zoom(plate, box, FACE_H)

        def fit(im: Image.Image) -> Image.Image:
            im = im.copy()
            im.thumbnail((10_000, COL_H))
            return im

        a, b = fit(plate), fit(goldi)
        w = a.width + b.width + 12
        col = Image.new("RGB", (max(w, face.width + ref_face.width + 12), COL_H + FACE_H * 2 + 90), (14, 13, 12))
        col.paste(a, (0, 40))
        col.paste(b, (a.width + 12, 40))
        col.paste(face, (0, COL_H + 60))
        col.paste(ref_face, (face.width + 12, COL_H + 60))
        d = ImageDraw.Draw(col)
        d.text((6, 8), letter, fill=(235, 227, 214))
        g = gates.get(path.name, {})
        verdict = "gates ok" if g.get("ok") else (g.get("why", "") or "not graded")[:70]
        d.text((30, 8), verdict, fill=(160, 150, 140))
        d.text((6, COL_H + 44), "face · his reference, same face height", fill=(160, 150, 140))
        if note:
            d.text((6, COL_H + 60 + face.height + 6), note, fill=(220, 120, 90))
        columns.append(col)

    width = sum(c.width for c in columns) + 16 * (len(columns) - 1)
    sheet = Image.new("RGB", (width, max(c.height for c in columns)), (14, 13, 12))
    x = 0
    for c in columns:
        sheet.paste(c, (x, 0))
        x += c.width + 16
    out = wave / "sheet.jpg"
    sheet.save(out, quality=88)
    (wave / "sheet-key.json").write_text(json.dumps(key, indent=1), encoding="utf-8")
    print(f"blind sheet -> {out}   (key: sheet-key.json)")

    # ⚠ THE HEADS STRIP (ADR-082 U41): every plate's face at one face height,
    # lettered by the sheet's own key, then a gap, then EVERY identity crop's
    # face, unlettered — the likeness read in one row, against all the
    # photographs rather than the first alone. The identity crops are whatever
    # `refs/` holds (`refs.py --set face` writes three).
    heads = []
    for letter, path in zip("ABCDEFGHIJ", order):
        plate = Image.open(path).convert("RGB")
        box = find_face(plate)
        if box is None:
            fx0, fy0, fx1, fy1 = EXPECTED_FACE[era]
            box = (int(fx0 * plate.width), int(fy0 * plate.height),
                   int(fx1 * plate.width), int(fy1 * plate.height))
        heads.append((letter, face_zoom(plate, box, FACE_H)))
    refs_faces = []
    for ident in sorted((wave / "refs").glob("identity-*.jpg")):
        im = Image.open(ident).convert("RGB")
        box = REF_FACE_BOX if ident.name == "identity-1.jpg" else (find_face(im) or (0, 0, im.width, im.height))
        refs_faces.append(face_zoom(im, box, FACE_H))
    if refs_faces:
        gap = 36
        width = sum(h.width for _, h in heads) + 12 * (len(heads) - 1) + gap + \
            sum(r.width for r in refs_faces) + 12 * (len(refs_faces) - 1)
        strip = Image.new("RGB", (width, FACE_H + 28), (14, 13, 12))
        x = 0
        d = ImageDraw.Draw(strip)
        for letter, h in heads:
            strip.paste(h, (x, 22))
            d.text((x + 4, 4), letter, fill=(235, 227, 214))
            x += h.width + 12
        x += gap - 12
        for r in refs_faces:
            strip.paste(r, (x, 22))
            x += r.width + 12
        hout = wave / "heads.jpg"
        strip.save(hout, quality=90)
        print(f"heads strip -> {hout}   (plates lettered, his photographs after the gap)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
