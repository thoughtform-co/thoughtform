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
"""

from __future__ import annotations

import argparse
import subprocess
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


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wave", required=True)
    args = ap.parse_args()
    stills = Path(__file__).resolve().parent / "waves" / args.wave / "stills"
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
