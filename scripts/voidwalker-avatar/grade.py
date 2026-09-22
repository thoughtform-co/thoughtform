"""
grade — the deterministic gates, run on every draw before a human looks.

⚠ THE GATE THAT MATTERS IS SILHOUETTE FRAGMENTATION, AND IT TOOK TWO WRONG
METRICS TO FIND IT. This wave's first pick keyed into a figure that "dripped" —
long vertical strips down the robe with the ground showing between them — and:

  * the RAW Veo frames were clean, so it was not the model;
  * the pre-encode and post-encode frames were identical, so it was not VP9;
  * every gain from 5 to 20 produced it, so it was not the LUT;
  * and a "how dark is the hem" metric RANKED THE SHIPPED ASSETS WORSE than the
    broken draw (Architect 0.530, azeroth 0.528, the dripping draw 0.681) while
    both shipped assets read perfectly solid.

What actually distinguishes them is whether the dark cloth reaches the
SILHOUETTE EDGE. The Architect's suit keeps its dark values INTERIOR, ringed by
lit edges, so its alpha stays one piece; a robe lit only along its fold
highlights breaks into vertical bands that run right out to the outline. So the
measure is: how many separate opaque RUNS does a row of the hem contain? A
skirt is one. Trousers are two. Eight is a figure coming apart.

Measured: Architect 1.93 · azeroth 4.15 · the dripping draw 7.87 · the pick 1.90.

⚠ A PLATE (ADR-082 U31, `--stage plate`) IS GRADED ON DIFFERENT GATES, because
it fails differently. It is a full-colour figure on a flat #0A28D2 ground, cut
by a CHROMA key, so fragmentation cannot happen and a dark hem is harmless.
What can go wrong is the ground and the cloth:

  K1  the ground is not the era's flat lock colour (`grounds.py`: blue, or the
      2016 trainer's magenta) — a gradient or a floor keys badly
  K3  ground SPILL on the figure's edge (the model lit him with his own ground)
  P1  crushed blacks: black cloth drawn as black has no folds left to grade.
      ⚠ CALIBRATED ON THE ARCHITECT'S OWN SOURCE, which is darker than intuition:
      his photo has 25.8 % of its figure under luma 16 (p50 26.2) and still made
      the reference look. The Starhaven painting has 42.1 % (p50 19.2) — the
      crushed case the plate lock's key light is there to prevent. The gate sits
      between them at 30 %, never at a round number that fails the reference.
  D2/D3 the boots law — nothing cut at the floor, nothing touching a side wall.

and it writes a free GOLD PREVIEW of every plate (`gold.py`), so the owner picks
from what will actually ship rather than from a colour photograph.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

# The shipped assets set the bar: the Architect reads 1.93 and azeroth — whose
# plume and three companions genuinely are several objects — reads 4.15.
FRAGMENT_MAX = 4.5


def gray(path: Path, w: int = 180, h: int = 320) -> np.ndarray:
    buf = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-vf", f"scale={w}:{h}",
         "-pix_fmt", "gray", "-f", "rawvideo", "-"], capture_output=True).stdout
    return np.frombuffer(buf, dtype=np.uint8)[: w * h].reshape(h, w).astype(int)


def measure(path: Path) -> dict:
    a = gray(path)
    corner = int(max(a[:12, :12].max(), a[:12, -12:].max(),
                     a[-12:, :12].max(), a[-12:, -12:].max()))
    off = corner + 6
    cols = np.where((a > off + 8).any(axis=0))[0]
    rows = np.where((a > off + 8).any(axis=1))[0]
    if not cols.size or not rows.size:
        return {"ok": False, "fragment": 99.0, "corner": corner,
                "why": "nothing lit — the draw is empty or all ground"}
    x0, x1, y0, y1 = cols.min(), cols.max(), rows.min(), rows.max()

    runs = []
    for y in range(y0 + int((y1 - y0) * 0.55), y1 + 1):
        row = a[y, x0:x1 + 1] > off + 4
        if not row.any():
            continue
        d = np.diff(row.astype(int))
        runs.append(int((d == 1).sum() + (1 if row[0] else 0)))
    fragment = float(np.mean(runs)) if runs else 99.0

    h, w = a.shape
    findings = []
    # D1 · the bed is not black
    if corner > 12:
        findings.append(f"the ground is not black (corners {corner})")
    # D2 · the feet are CUT, which is not the same as the feet being LOW.
    # ⚠ The canonical delivery seats its boots at footY 0.998 — essentially on
    # the frame's bottom line — so a gate that fails "within 2 % of the edge"
    # fails the asset this whole chain is matching. What is forbidden is the
    # silhouette running OFF the canvas, so only the last row counts.
    if (a[-1:, :] > off + 8).any():
        findings.append("the figure runs off the bottom edge — the feet are cut")
    # D3 · the man touches a side wall
    if (a[:, :4] > off + 8).any() or (a[:, -4:] > off + 8).any():
        findings.append("the figure touches a side wall (the boots law)")
    # D4 · ⚠ THE BROWN SUIT — the recorded failure this prompt is built against
    rgb = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-vf", "scale=180:320",
         "-pix_fmt", "rgb24", "-f", "rawvideo", "-"], capture_output=True).stdout
    px = np.frombuffer(rgb, dtype=np.uint8)[: 180 * 320 * 3].reshape(-1, 3).astype(float)
    lit = px[px.max(axis=1) > off + 20]
    if lit.size:
        mx, mn = lit.max(axis=1), lit.min(axis=1)
        sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
        if float(np.median(sat)) < 0.30:
            findings.append(f"the figure is not gold — median saturation {np.median(sat):.2f}")
    # D5 · the silhouette holds together
    if fragment > FRAGMENT_MAX:
        findings.append(
            f"the silhouette breaks into strips — {fragment:.2f} runs per hem row "
            f"(shipped: Architect 1.93, azeroth 4.15)")

    return {"ok": not findings, "why": "; ".join(findings), "fragment": round(fragment, 2),
            "corner": corner}


PLATE_CRUSH_MAX = 0.30
PLATE_P50 = (22.0, 60.0)
PLATE_SPILL_MAX = 0.08
#: ⚠ A CEL HAS NO BLACK CLOTH TO CRUSH (ADR-082 U33). P1's p50 band describes a
#: photographed charcoal wardrobe; a flat-colour drawing sits wherever its
#: palette sits, and the band would fail it for being a drawing. The crush share
#: still reports, and the gold preview's exposure gate — the one that says
#: whether it will read "too glowing" — still binds.
CEL_ERAS = {"pokemon-go"}


def measure_plate(path: Path, out: Path, era: str | None = None) -> dict:
    """The plate gates, and the gold preview. See the module note."""
    import gold
    from grounds import ground_name, ground_rgb
    from PIL import Image
    from scipy import ndimage

    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    h, w, _ = rgb.shape
    lock = ground_rgb(era)
    alpha = gold.key_matte(rgb)
    fig = alpha > 0.5
    findings = []

    # K1 · the ground: the four corners against THIS ERA's lock (grounds.py),
    # and its evenness
    c = 24
    corners = np.concatenate([rgb[:c, :c].reshape(-1, 3), rgb[:c, -c:].reshape(-1, 3),
                              rgb[-c:, :c].reshape(-1, 3), rgb[-c:, -c:].reshape(-1, 3)])
    off = float(np.abs(corners.mean(0) - np.array(lock)).max())
    ground = rgb[alpha < 0.02]
    spread = float(ground.std(0).max()) if ground.size else 99.0
    if off > 28:
        findings.append(f"K1 the ground is off the lock by {off:.0f} (corners {corners.mean(0).round(0)})")
    if spread > 14:
        findings.append(f"K1 the ground is not flat (std {spread:.1f})")

    # K3 · spill: the model lit him with his own ground, and the key reads the
    # blue cast as TRANSLUCENCY. ⚠ Measured on a band 2-8px INSIDE the edge,
    # never on the edge itself: an edge pixel is part ground by anti-aliasing,
    # and a gate that counts it fails a perfectly cut figure (it did, at 16 %).
    band = ndimage.binary_erosion(fig, iterations=2) & ~ndimage.binary_erosion(fig, iterations=8)
    spill = float((alpha[band] < 0.9).mean()) if band.any() else 0.0
    if spill > PLATE_SPILL_MAX:
        findings.append(f"K3 {ground_name(era)} spill: {spill:.0%} of the band inside the edge keys as translucent")

    # P1 · readable blacks
    y = gold.luma(rgb)[ndimage.binary_erosion(fig, iterations=4)]
    p50 = float(np.percentile(y, 50)) if y.size else 0.0
    crush = float((y < 16).mean()) if y.size else 1.0
    if crush > PLATE_CRUSH_MAX:
        findings.append(f"P1 {crush:.0%} of the figure is crushed under luma 16 (Architect 26 %)")
    if era not in CEL_ERAS and not (PLATE_P50[0] <= p50 <= PLATE_P50[1]):
        findings.append(f"P1 figure p50 {p50:.0f} is outside [{PLATE_P50[0]:.0f}, {PLATE_P50[1]:.0f}]")

    # D2/D3 · the boots law, on the key matte
    if fig[-2:, :].any():
        findings.append("D2 the figure runs off the bottom edge")
    if fig[:, :3].any() or fig[:, -3:].any():
        findings.append("D3 the figure touches a side wall")
    ys = np.where(fig.any(axis=1))[0]
    top = float(ys.min() / h) if ys.size else 0.0
    bottom = float(1 - (ys.max() + 1) / h) if ys.size else 0.0

    # ⚠ THE PREVIEW IS GRADED AT THE EXPOSURE THAT WILL SHIP (ADR-082 U33) —
    # solved, as post.py solves it — on this era's own ground.
    expo = gold.plate(path, out, exposure=None, ground=lock)
    if era in CEL_ERAS and not expo["ok"]:
        findings.append(f"G the gold preview is outside the Architect's band (p75 {expo['p75']}, "
                        f"hot {expo['hot']}) at exposure x{expo['exposure']}")
    return {"ok": not findings, "why": "; ".join(findings), "ground_off": round(off, 1),
            "ground_std": round(spread, 1), "spill": round(spill, 3), "p50": round(p50, 1),
            "crush": round(crush, 3), "top": round(top, 3), "bottom": round(bottom, 3),
            "gold": expo}


#: The eras a wave's own name can name (`20260922-pokemon-go-v1` → pokemon-go),
#: the way sheet.py reads it.
ERAS = ("pokemon-go", "expanse", "genai", "azeroth", "loop")


def main_plate(wave: Path, era: str | None = None) -> int:
    plates = sorted((wave / "plates").glob("*.png"))
    if not plates:
        raise SystemExit(f"no plates in {wave / 'plates'}")
    era = era or next((e for e in ERAS if f"-{e}-" in wave.name), None)
    out = wave / "gold"
    rows = {}
    for f in plates:
        m = measure_plate(f, out, era)
        rows[f.name] = m
        g = m["gold"]
        print(f"{'ok  ' if m['ok'] else 'FAIL'} {f.name}  ground {m['ground_off']:4.0f}/{m['ground_std']:4.1f}"
              f"  spill {m['spill']:.2f}  p50 {m['p50']:5.1f}  crush {m['crush']:.2f}"
              f"  top {m['top']:.3f} floor {m['bottom']:.3f}"
              f"  | gold x{g['exposure']} p75 {g['p75']:5.1f} hot {g['hot']:.2f} {'ok' if g['ok'] else 'OFF'}"
              + (f"  — {m['why']}" if m["why"] else ""))
    (wave / "plates.json").write_text(json.dumps(rows, indent=1), encoding="utf-8")
    passing = [n for n, m in rows.items() if m["ok"]]
    print()
    print(f"{len(passing)} of {len(rows)} pass the plate gates; gold previews in {out}")
    return 0 if passing else 1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wave", required=True)
    ap.add_argument("--stage", choices=("still", "plate"), default="still")
    ap.add_argument("--era", default=None, help="plate stage: defaults to the era the wave's name carries")
    args = ap.parse_args()
    wave_dir = Path(__file__).resolve().parent / "waves" / args.wave
    if args.stage == "plate":
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        return main_plate(wave_dir, args.era)
    stills = wave_dir / "stills"
    rows = []
    for f in sorted(stills.glob("*.png")):
        m = measure(f)
        rows.append((m["fragment"], f.name, m))
    rows.sort()
    for frag, name, m in rows:
        mark = "ok  " if m["ok"] else "FAIL"
        print(f"{mark} {name}  runs/row {frag:5.2f}" + (f"  — {m['why']}" if m["why"] else ""))
    passing = [r for r in rows if r[2]["ok"]]
    print(f"\n{len(passing)} of {len(rows)} pass; best is {rows[0][1]} at {rows[0][0]} runs/row")
    return 0 if passing else 1


if __name__ == "__main__":
    raise SystemExit(main())
