"""
mark-mind-anatomy-checks — the pixel side of scripts/capture-mark-mind-anatomy.mjs.

The capture script shoots the pages and writes PNGs; this does the mask work on
them with OpenCV at 512 px, one check per call, and prints one JSON object. It
exists because the first capture (2026-10-20) ran the morphology in plain JS on
1024² Float64 arrays and the session was SIGKILLed under memory pressure.

  python3 scripts/mark-mind-anatomy-checks.py overlay   <ref> <frame> <out_dir> <stage>
  python3 scripts/mark-mind-anatomy-checks.py top       <top_diag> <logo> <out_dir>
  python3 scripts/mark-mind-anatomy-checks.py integrate <top_diag> <top_nomark> <solo> <frame>
  python3 scripts/mark-mind-anatomy-checks.py squint    <ref> <frame> <out_dir>
  python3 scripts/mark-mind-anatomy-checks.py sheet     <out_dir> <stage> <checks.json> <ref> <frame>

The silhouette of either image: ink (max channel > 40), closed with a 15 px disc,
holes filled, the largest piece kept, opened with a 7 px disc (all at 512 px,
the same as the 31/15 px discs at the reference's 1024).
"""
import json
import os
import sys

import cv2
import numpy as np

S = 512


def load(path):
    im = cv2.imread(path, cv2.IMREAD_COLOR)
    if im is None:
        raise SystemExit(f"cannot read {path}")
    if im.shape[:2] != (S, S):
        im = cv2.resize(im, (S, S), interpolation=cv2.INTER_AREA)
    return im  # BGR uint8


def disc(d):
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (d, d))


def silhouette(im):
    ink = (im.max(axis=2) > 40).astype(np.uint8) * 255
    c = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, disc(15))
    ff = c.copy()
    cv2.floodFill(ff, np.zeros((S + 2, S + 2), np.uint8), (0, 0), 255)
    filled = c | cv2.bitwise_not(ff)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(filled)
    if n < 2:
        return filled > 0
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    out = (lab == big).astype(np.uint8) * 255
    return cv2.morphologyEx(out, cv2.MORPH_OPEN, disc(7)) > 0


def iou(a, b):
    u = (a | b).sum()
    return float((a & b).sum() / u) if u else 0.0


def diff_png(a, b, path):
    """grey both, red a only, cyan b only"""
    px = np.zeros((S, S, 3), np.uint8)
    px[a & b] = (90, 90, 90)
    px[a & ~b] = (40, 60, 255)
    px[b & ~a] = (255, 200, 0)
    cv2.imwrite(path, px)


def blue_of(im):
    b, g, r = im[..., 0].astype(int), im[..., 1].astype(int), im[..., 2].astype(int)
    return (b > 180) & (r < 70) & (g < 70)


def gold_of(im, lo=70):
    b, r = im[..., 0].astype(int), im[..., 2].astype(int)
    return (r > lo) & (r > b + 30)


def overlay(ref, frame, out, stage):
    a, b = load(ref), load(frame)
    sa, sb = silhouette(a), silhouette(b)
    diff_png(sa, sb, os.path.join(out, f"sil-diff_{stage}.png"))
    cv2.imwrite(os.path.join(out, f"overlay_{stage}.png"), cv2.addWeighted(a, 0.5, b, 0.5, 0))
    # the same with the channels closed on both sides (a 35 px disc bridges the
    # reference's open slant), so the number tracks the drum, not the cut: the
    # measure the camera solve used
    shut = lambda m: cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_CLOSE, disc(35)) > 0
    return {"silhouetteIoU": round(iou(sa, sb), 4), "silhouetteIoUChannelsClosed": round(iou(shut(sa), shut(sb)), 4)}


def top(top_diag, logo, out):
    t, lg = load(top_diag), load(logo)
    blue = blue_of(t)
    # the drum's disc: the hull of the sector tops (the drum is convex)
    pts = cv2.findNonZero(blue.astype(np.uint8))
    hull = cv2.convexHull(pts)
    dmask = np.zeros((S, S), np.uint8)
    cv2.fillConvexPoly(dmask, hull, 1)
    ours = gold_of(t, 90) | ((dmask > 0) & ~blue)
    mark = lg[..., 2] > 100
    diff_png(mark, ours, os.path.join(out, "top_logo-diff.png"))
    return {
        "topLogoIoU": round(iou(mark, ours), 4),
        "topLogoPixels512": {
            "both": int((mark & ours).sum()),
            "logoOnly": int((mark & ~ours).sum()),
            "oursOnly": int((ours & ~mark).sum()),
        },
    }


def integrate(top_diag, top_nomark, solo, frame):
    def count(m):
        n, _, stats, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8))
        return int((stats[1:, cv2.CC_STAT_AREA] > 100).sum())

    with_mark = count(blue_of(load(top_diag)))
    without = count(blue_of(load(top_nomark)))
    so, fu = gold_of(load(solo)), gold_of(load(frame))
    hidden = float((so & ~fu).sum() / max(1, so.sum()))
    return {
        "integration": {
            "sectorsWithMark": with_mark,
            "sectorsWithoutMark": without,
            "noMarkNoSectors": without <= 1 and with_mark == 4,
            "markHiddenByDrum": round(hidden, 3),
            "partHidden": hidden > 0.05,
            "sharedLight": "structural: the crescent, keys, block and drum walls all take their tone from one toneIndex(normal) under one LIGHT (scene.ts)",
        }
    }


def squint_img(path):
    g = cv2.cvtColor(load(path), cv2.COLOR_BGR2GRAY)
    g = cv2.GaussianBlur(g, (0, 0), 4)  # 8 px at 1024 is 4 at 512
    return cv2.resize(g, (120, 120), interpolation=cv2.INTER_AREA)


def squint(ref, frame, out):
    a, b = squint_img(ref).astype(float), squint_img(frame).astype(float)
    r = float(np.corrcoef(a.ravel(), b.ravel())[0, 1])
    up = lambda x: cv2.resize(x.astype(np.uint8), (480, 480), interpolation=cv2.INTER_NEAREST)
    sheet = np.zeros((480, 980), np.uint8)
    sheet[:, :480], sheet[:, 500:] = up(a), up(b)
    cv2.imwrite(os.path.join(out, "squint.png"), sheet)
    return {"squintCorrelation": round(r, 3)}


def sheet(out, stage, checks_path, ref, frame):
    from PIL import Image, ImageDraw, ImageFont

    with open(checks_path) as f:
        c = json.load(f)
    tiles = [("A0 GPT · TARGET", ref), (f"OURS · {stage.upper()}", frame)]
    p = lambda n: os.path.join(out, n)
    if os.path.exists(p(f"overlay_{stage}.png")):
        tiles.append(("50% OVERLAY", p(f"overlay_{stage}.png")))
    if "silhouetteIoU" in c:
        tiles.append((f"SILHOUETTE IOU {c['silhouetteIoU']}", p(f"sil-diff_{stage}.png")))
    if "topLogoIoU" in c:
        tiles.append((f"TOP VIEW VS LOGO · IOU {c['topLogoIoU']}", p("top_logo-diff.png")))
    if "integration" in c:
        tiles.append(("MARK TAKEN AWAY (TOP)", p("top_nomark.png")))
        tiles.append(("MARK ALONE (WHAT THE DRUM HIDES)", p("solo_mark.png")))
    if "squintCorrelation" in c and os.path.exists(p("squint.png")):
        tiles.append((f"SQUINT · R {c['squintCorrelation']}", p("squint.png")))

    cell, bar, gap, cols = 512, 34, 6, 4
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 14)
        small = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", 15)
    except OSError:
        font = small = ImageFont.load_default()
    rows = -(-len(tiles) // cols)
    W = cols * cell + (cols - 1) * gap
    # the numbers, as a footer
    lines = [f"ROUND {c.get('round')} · STAGE {stage.upper()} · {c.get('at', '')[:16]}Z"]
    if "silhouetteIoU" in c:
        lines.append(
            f"overlay   silhouette IoU {c['silhouetteIoU']}   channels closed {c.get('silhouetteIoUChannelsClosed', '–')}   (pass ≥ 0.90)"
        )
    if "topLogoIoU" in c:
        px = c.get("topLogoPixels512", {})
        lines.append(f"top view  logo IoU {c['topLogoIoU']}   both {px.get('both')}  logo only {px.get('logoOnly')}  ours only {px.get('oursOnly')}  (px at 512)")
    if "weights" in c:
        lines.append(f"weights   {c['weightCount']} stroke widths in use: {', '.join(f'{k} px ×{v}' for k, v in c['weights'].items())}   (pass ≤ 3)")
    if "integration" in c:
        g = c["integration"]
        lines.append(
            f"integrate sectors with mark {g['sectorsWithMark']}, without {g['sectorsWithoutMark']} (no mark, no sectors: {'PASS' if g['noMarkNoSectors'] else 'FAIL'})   "
            f"mark hidden by drum {g['markHiddenByDrum']:.1%} ({'PASS' if g['partHidden'] else 'FAIL'})"
        )
    if "squintCorrelation" in c:
        lines.append(f"squint    r {c['squintCorrelation']}")
    foot = 22 * len(lines) + 24
    Hh = rows * (cell + bar) + (rows - 1) * gap + foot
    img = Image.new("RGB", (W, Hh), (34, 34, 34))
    d = ImageDraw.Draw(img)
    for i, (text, path) in enumerate(tiles):
        x, y = (i % cols) * (cell + gap), (i // cols) * (cell + bar + gap)
        d.rectangle([x, y, x + cell - 1, y + bar - 1], fill=(17, 17, 17))
        d.text((x + 12, y + 9), text, fill=(207, 198, 180), font=font)
        t = Image.open(path).convert("RGB")
        t.thumbnail((cell, cell))
        tile = Image.new("RGB", (cell, cell), (0, 0, 0))
        tile.paste(t, ((cell - t.width) // 2, (cell - t.height) // 2))
        img.paste(tile, (x, y + bar))
    y0 = rows * (cell + bar) + (rows - 1) * gap + 12
    d.rectangle([0, y0 - 12, W, Hh], fill=(17, 17, 17))
    for k, line in enumerate(lines):
        d.text((14, y0 + 22 * k), line, fill=(207, 198, 180), font=small)
    dest = os.path.join(out, f"vs-gpt_{stage}.jpg")
    img.save(dest, quality=88)
    return {"sheet": dest}


if __name__ == "__main__":
    cmd, *rest = sys.argv[1:]
    fn = {"overlay": overlay, "top": top, "integrate": integrate, "squint": squint, "sheet": sheet}[cmd]
    print(json.dumps(fn(*rest)))
