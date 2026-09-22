"""
gold — the deterministic gold grade, measured off the Architect (ADR-082 U31).

⚠ "GRADE THE LIGHT, CODE THE SCREEN". The doctrine was "bake the light": the
image model drew each era as a gold hologram in one step. The eras drawn that
way came back as emissive sculptures with blown eyes (interior p75 luma 181.8
and 191.1), and the owner read Latent Land as "too glowing" beside the
Architect — who was made in TWO steps: a photoreal colour still, then a restyle
into gold. This module is that second step made deterministic: the model draws
the man in full colour (`generate.py --stage plate`), and the gold is a CURVE and
a RAMP, measured once, frozen here, applied to every era the same way.

⚠ THE LITERALS ARE MEASURED, AND THE MEASUREMENT IS REPRODUCIBLE.
Provenance: the Architect's photoreal `canonical-02.jpg` (wave
`20260826-thoughtform-v3`) against the model's own restyle of that exact frame,
`style-holo-emissive-black.jpg` (wave `20260826-thoughtform-v5`, the still his
shipped idle was made from). Same 848x1264 geometry — edge correlation peaks at
zero offset (0.79), so the restyle is the photo, pixel for pixel, re-lit.

  CURVE  photo luma -> gold luma. Binned medians over the figure's interior
         (the restyle's own luma matte, eroded 6px), then a count-weighted
         monotone fit (pool-adjacent-violators). ⚠ Two bins (photo luma 94 and
         98) are the grey BACKDROP between his arm and his body, lit by the
         restyle's contour glow; left in, they flattened the fit's middle third
         to one value. A bin under half the running maximum is dropped.
  RAMP   gold luma -> RGB. Median RGB of the restyle at each of its own luma
         levels. The luma of `RAMP(t)` is `t` to within a unit, which is the
         check that the two tables compose.

  Held out (a 32px checkerboard: fit on one colour, score on the other) the
  frozen tables reproduce the model's restyle to 9.3/255 mean absolute error
  per channel on his true outline (10.5 on the restyle's own luma matte). The model disagrees with ITSELF by 19.6/255 re-drawing the same
  frame (ADR-082 U14). The deterministic grade is closer to the model's own
  output than the model is.

⚠ THE TOE IS REAL DATA, NOT A FLOOR FOR TASTE. His black turtleneck reads ~42 in
the restyle and the darkest photo values land at ~44 — black cloth becomes a dim
even deep amber, never a hole. That lift is what lets a LUMA key hold the
silhouette together (`grade.py`'s fragmentation gate), and it is why the eras
drawn as "a hologram" had to over-light their cloth to survive the key.

⚠ THE EDGE IS NOT DARKER THAN THE INTERIOR, AND THIS FILE ONCE SAID IT WAS.
Measured against the restyle's own luma matte, the outermost 2px read 57 against
68 inside — but that matte's boundary sits IN the glow, so the "edge" was the
glow's tail. Measured against the TRUE outline (the photo's figure: the
restyle's region, its cloth holes kept, minus whatever still matches the studio
sweep) the edge reads 79-84 against 73-79 inside: no falloff. What the Architect
does have is a soft OUTER bloom, and it is not a constant fringe: it is 12.5
luma off his face and 14.6 off his hands but 2.3 off his dark trousers, so it
follows the LIGHT behind it, weighted toward highlights. Fitted on the ring 1.5
to 40px outside his outline: `0.695 · gauss(σ 24.3px per 1280) * (luma²/255)`,
1.5 luma mean error (a constant-width fringe managed 4.5 and lit the legs as
brightly as the face). His delivery was LUMA-keyed (`clip((L-8)*12)`), which is
what turned that bloom into real alpha on site; `glow()` rebuilds it the same
way, so a two-step era composites over the corridor the way he does. A bright
RIM on every edge is the one-step draws' tell, and it is what "too glowing" was
reading.

⚠ AN EXPOSURE GATE, NEVER A HISTOGRAM MATCH. Every delivery's deep interior
must sit where the Architect's does: p75 luma in [80, 130] (he reads ~103) and
at most 12 % of it above 200. Measured, the shipped `genai-v2` and `expanse-v1`
fail it and the Architect passes. Matching histograms would drag every era onto
his wardrobe's distribution; one exposure scalar, clamped, is all a correction
may ever be.

  python scripts/voidwalker-avatar/gold.py --selftest
  python scripts/voidwalker-avatar/gold.py --plate <plate.png> --out <dir>
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

#: photo luma -> gold luma. See the module note for provenance.
CURVE_KNOTS: tuple[tuple[float, float], ...] = (
    (0, 43.7), (8, 43.7), (16, 46.0), (24, 61.4), (32, 76.5), (40, 92.5),
    (48, 108.9), (56, 126.2), (64, 143.3), (80, 166.4), (96, 182.6),
    (112, 199.5), (128, 214.5), (144, 227.8), (160, 236.6), (192, 249.6),
    (224, 250.6), (255, 251.4),
)

#: gold luma -> RGB. Below 28 is the restyle's own edge and falloff (the figure
#: matte starts at 28); 0 is black because an alpha of 0 is black.
RAMP_KNOTS: tuple[tuple[float, tuple[int, int, int]], ...] = (
    (0, (0, 0, 0)), (12, (27, 10, 0)), (20, (37, 18, 1)), (28, (50, 27, 3)),
    (36, (57, 33, 6)), (44, (66, 40, 9)), (52, (77, 47, 11)), (64, (93, 58, 16)),
    (80, (114, 74, 24)), (96, (134, 89, 32)), (112, (154, 104, 40)),
    (128, (172, 120, 50)), (144, (188, 137, 62)), (160, (206, 153, 75)),
    (176, (222, 170, 90)), (192, (234, 187, 110)), (208, (244, 204, 131)),
    (224, (252, 224, 159)), (240, (255, 242, 196)), (255, (255, 253, 229)),
)

#: The Architect's outer bloom, measured outside his true outline (see above):
#: highlight-weighted (luma**GAMMA), blurred, scaled. Sigma is per 1280 of height.
BLOOM_GAMMA = 2.0
BLOOM_SIGMA_PX = 24.3
BLOOM_K = 0.695
#: His delivery's luma key — the alpha a glow pixel of luma L carried on site.
ARCH_KEY_OFF, ARCH_KEY_GAIN = 8.0, 12.0

#: The exposure gate, on the deep interior (the matte eroded by ~1.65 % of the width).
EXPOSURE_P75 = (80.0, 130.0)
EXPOSURE_HOT_SHARE = 0.12
HOT = 200

sys.path.insert(0, str(Path(__file__).resolve().parent))
from grounds import KEY_GROUNDS, ground_rgb  # noqa: E402

KEY_GROUND = KEY_GROUNDS["blue"][0]  # #0A28D2 — the plate lock's default ground

SKILL_WAVES = Path(r"C:\Users\buyss\.claude\skills\voidwalker-avatar\waves")
PAIR_PHOTO = SKILL_WAVES / "20260826-thoughtform-v3" / "canonical-02.jpg"
PAIR_RESTYLE = SKILL_WAVES / "20260826-thoughtform-v5" / "style-holo-emissive-black.jpg"
REPO = Path(__file__).resolve().parents[2]


def luma(rgb: np.ndarray) -> np.ndarray:
    return 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]


def grade(rgb: np.ndarray, exposure: float = 1.0) -> np.ndarray:
    """Full-colour pixels -> the Architect's gold. `exposure` scales the photo
    luma before the curve; it is the ONE correction the chain allows, clamped."""
    exposure = float(np.clip(exposure, 0.85, 1.35))
    kx, ky = zip(*CURVE_KNOTS)
    t = np.interp(np.clip(luma(rgb) * exposure, 0, 255), kx, ky)
    rx = [k for k, _ in RAMP_KNOTS]
    return np.stack([np.interp(t, rx, [c[i] for _, c in RAMP_KNOTS]) for i in range(3)], -1)


def _ground_channels(ground) -> tuple[list[int], list[int]]:
    """The ground's own channels (within half of its brightest) and the rest."""
    g = [float(v) for v in ground]
    top = max(g)
    own = [c for c in range(3) if g[c] >= 0.5 * top]
    rest = [c for c in range(3) if c not in own]
    if not rest or top - max(g[c] for c in rest) < 80:
        raise ValueError(f"ground {tuple(round(v) for v in g)} is not a saturated key colour")
    return own, rest


def chroma_signal(rgb: np.ndarray, ground) -> np.ndarray:
    """How much of the GROUND's colour a pixel carries: the ground's own channels
    (their minimum, when there are two) minus the brightest of the others.

    ⚠ FOR BLUE THIS IS EXACTLY `B − max(R, G)`, the U31 key, to the value — the
    generalisation is what lets the 2016 trainer stand on magenta (ADR-082 U33,
    `grounds.py`) without moving a pixel of the blue eras."""
    own, rest = _ground_channels(ground)
    s = rgb[..., own[0]] if len(own) == 1 else rgb[..., own].min(-1)
    o = rgb[..., rest[0]] if len(rest) == 1 else np.maximum(rgb[..., rest[0]], rgb[..., rest[1]])
    return s - o


def corner_ground(rgb: np.ndarray, c: int = 16) -> np.ndarray:
    """The ground as the frame's four corners report it (the median pixel)."""
    px = np.concatenate([rgb[:c, :c].reshape(-1, 3), rgb[:c, -c:].reshape(-1, 3),
                         rgb[-c:, :c].reshape(-1, 3), rgb[-c:, -c:].reshape(-1, 3)])
    return np.median(px, axis=0)


def key_matte(rgb: np.ndarray, ground: tuple[int, int, int] | None = None) -> np.ndarray:
    """Alpha from a flat key ground: `1 − clip((s − .10·sG) / (.75·sG))`, with
    `s = chroma_signal` (for blue, `B − max(R, G)`). Without a `ground` the
    ground and `sG` are read off the CORNERS (grade.py's lesson: a border ring
    reads the hem)."""
    if ground is None:
        g = corner_ground(rgb)
        b = chroma_signal(rgb, g)
        h, w = b.shape
        c = 16
        corners = np.concatenate([b[:c, :c].ravel(), b[:c, -c:].ravel(), b[-c:, :c].ravel(), b[-c:, -c:].ravel()])
        bG = float(np.median(corners))
    else:
        b = chroma_signal(rgb, ground)
        bG = float(chroma_signal(np.asarray(ground, np.float32)[None, None, :], ground)[0, 0])
    bG = max(bG, 40.0)
    return 1.0 - np.clip((b - 0.10 * bG) / (0.75 * bG), 0.0, 1.0)


def unmix(rgb: np.ndarray, alpha: np.ndarray, ground: np.ndarray) -> np.ndarray:
    """Take the ground back out of a partial edge pixel: C = aF + (1−a)G."""
    a = np.clip(alpha, 1e-3, 1.0)[..., None]
    return np.clip((rgb - (1.0 - a) * ground) / a, 0, 255)


def ramp_rgb(t: np.ndarray) -> np.ndarray:
    rx = [k for k, _ in RAMP_KNOTS]
    return np.stack([np.interp(t, rx, [c[i] for _, c in RAMP_KNOTS]) for i in range(3)], -1)


def finish_edge(alpha: np.ndarray, px_per_1280: float = 1.0) -> np.ndarray:
    """Choke 1px, then feather sigma 1.6. No falloff — see the module note."""
    hard = ndimage.binary_erosion(alpha > 0.5, iterations=1)
    return np.clip(ndimage.gaussian_filter(hard.astype(np.float32), 1.6 * px_per_1280), 0, 1)


def glow(fig_rgb: np.ndarray, alpha: np.ndarray, px_per_1280: float = 1.0) -> tuple[np.ndarray, np.ndarray]:
    """The Architect's outer bloom as a STRAIGHT-alpha layer: colour is what his
    on-black frame held at that luma, alpha what his luma key gave it."""
    src = 255.0 * (np.clip(luma(fig_rgb), 0, 255) / 255.0) ** BLOOM_GAMMA * alpha
    lum = BLOOM_K * ndimage.gaussian_filter(src, BLOOM_SIGMA_PX * px_per_1280)
    a = np.clip((lum - ARCH_KEY_OFF) * ARCH_KEY_GAIN / 255.0, 0, 1)
    return ramp_rgb(lum), a


def compose(fig_rgb: np.ndarray, fig_a: np.ndarray, px_per_1280: float = 1.0) -> tuple[np.ndarray, np.ndarray]:
    """The figure OVER its glow, straight alpha out."""
    g_rgb, g_a = glow(fig_rgb, fig_a, px_per_1280)
    a = fig_a + g_a * (1 - fig_a)
    rgb = (fig_rgb * fig_a[..., None] + g_rgb * (g_a * (1 - fig_a))[..., None]) / np.maximum(a, 1e-6)[..., None]
    return rgb, a


def photo_matte(photo: np.ndarray, restyle_y: np.ndarray, tol: float = 14.0) -> np.ndarray:
    """The Architect's TRUE outline in his photo, for the self-test only: the
    restyle's region with its cloth holes kept, minus anything that still
    matches the studio sweep (the gap between arm and body; the band of glow
    the restyle painted just outside the contour)."""
    fig = figure_mask_from_luma(restyle_y)
    filled = ndimage.binary_fill_holes(fig)
    known = ~ndimage.binary_dilation(filled, iterations=14)
    num = ndimage.gaussian_filter(photo * known[..., None], (40, 40, 0))
    den = ndimage.gaussian_filter(known.astype(np.float32), 40)[..., None]
    sweep = num / np.maximum(den, 1e-6)
    D = np.abs(photo - sweep).max(-1)
    holes = filled & ~fig
    # ⚠ A HOLE IS CLOTH OR SWEEP, AND LUMA TELLS THEM APART. The sweep behind
    # him never falls below ~55; a crease or the shadow under the jacket does.
    # The sweep ESTIMATE cannot decide it deep inside the figure — the
    # normalized convolution has no known pixels there and returns noise.
    y = luma(photo)
    sweep_hole = holes & (D < tol) & (y >= 50)
    # ⚠ THE GLOW BAND IS WIDEST AT THE HEAD (~20px), so the trim is 24px, and
    # it only takes what still MATCHES the sweep: skin, cap and cloth do not.
    rim = fig & ~ndimage.binary_erosion(fig, iterations=24)
    # ⚠ AND A SHADOW OPEN TO THE SWEEP IS STILL CLOTH. The dark under the
    # jacket's hem runs into the gap between his legs, so it is not an enclosed
    # hole and `fill_holes` never reaches it; it is darker than the sweep gets.
    near = ndimage.distance_transform_edt(~fig) <= 40
    shadow = ~fig & near & (y < 45)
    true = (fig | (holes & ~sweep_hole) | shadow) & ~(rim & (D < tol))
    true = figure_mask_from_luma(true.astype(np.float32) * 255, 127)
    return ndimage.binary_fill_holes(true) & ~sweep_hole


def exposure_gate(y: np.ndarray, mask: np.ndarray) -> dict:
    """The deep interior's p75 and hot share, against the Architect's band."""
    erode = max(4, round(0.0165 * mask.shape[1]))
    deep = ndimage.binary_erosion(mask, iterations=erode)
    if deep.sum() < 500:
        deep = mask
    v = y[deep]
    p75 = float(np.percentile(v, 75))
    hot = float((v > HOT).mean())
    ok = EXPOSURE_P75[0] <= p75 <= EXPOSURE_P75[1] and hot <= EXPOSURE_HOT_SHARE
    return {"p75": round(p75, 1), "hot": round(hot, 3), "ok": ok}


def figure_mask_from_luma(y: np.ndarray, threshold: float = 28) -> np.ndarray:
    m = ndimage.binary_opening(y > threshold, iterations=2)
    lab, n = ndimage.label(m)
    if n == 0:
        return m
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    return lab == (1 + int(np.argmax(sizes)))


def load_rgba(path: Path) -> tuple[np.ndarray, np.ndarray | None]:
    im = Image.open(path)
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        a = np.asarray(im.convert("RGBA")).astype(np.float32)
        return a[..., :3], a[..., 3] / 255.0
    return np.asarray(im.convert("RGB")).astype(np.float32), None


def gate_file(path: Path) -> dict:
    """The exposure gate on a delivered poster (alpha if it has one)."""
    rgb, alpha = load_rgba(path)
    y = luma(rgb)
    mask = (alpha > 0.5) if alpha is not None else figure_mask_from_luma(y)
    return exposure_gate(y, mask)


def label(img: Image.Image, text: str) -> Image.Image:
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 56, 40], fill=(0, 0, 0))
    d.text((14, 8), text, fill=(235, 227, 214))
    return img


def selftest(out: Path) -> int:
    """Grade the Architect's own photo and set it beside the model's restyle,
    blind; score the tables held out; run the exposure gate on every shipped
    poster. Free — no request leaves this machine."""
    out.mkdir(parents=True, exist_ok=True)
    photo = np.asarray(Image.open(PAIR_PHOTO).convert("RGB")).astype(np.float32)
    restyle = np.asarray(Image.open(PAIR_RESTYLE).convert("RGB")).astype(np.float32)
    yr = luma(restyle)
    fig = photo_matte(photo, yr)
    interior = ndimage.binary_erosion(fig, iterations=6)

    h, w = fig.shape
    yy, xx = np.mgrid[0:h, 0:w]
    held = (((yy // 32) + (xx // 32)) % 2 == 1) & interior
    g = grade(photo)
    err = float(np.abs(g[held] - restyle[held]).mean())
    print(f"held-out error, frozen tables vs the model's own restyle: {err:.1f}/255 "
          f"(the model re-drawing the same frame: 19.6)")

    # the grade on the photo's own TRUE outline, over the measured glow, on black
    k = h / 1280
    rgb, a = compose(g, finish_edge(fig.astype(np.float32), k), k)
    ours = (rgb * a[..., None]).clip(0, 255).astype(np.uint8)
    theirs = restyle.clip(0, 255).astype(np.uint8)

    pair = [("grade", ours), ("model", theirs)]
    random.Random(20260921).shuffle(pair)
    key = {"A": pair[0][0], "B": pair[1][0]}
    tiles = [label(Image.fromarray(img), letter) for letter, (_, img) in zip("AB", pair)]
    sheet = Image.new("RGB", (w * 2 + 16, h), (0, 0, 0))
    sheet.paste(tiles[0], (0, 0))
    sheet.paste(tiles[1], (w + 16, 0))
    sheet.save(out / "g0-blind-pair.png")
    (out / "g0-key.json").write_text(json.dumps(key, indent=1))
    Image.fromarray(photo.astype(np.uint8)).save(out / "g0-source-photo.jpg", quality=90)
    print(f"blind pair -> {out / 'g0-blind-pair.png'}   (answer key: g0-key.json)")

    print("\nexposure gate — deep-interior p75 in [80, 130], hot share <= 0.12")
    rows = [("Architect · the model's restyle", exposure_gate(yr, fig)),
            ("Architect · this grade", exposure_gate(luma(ours.astype(np.float32)), fig))]
    for name in ("thoughtform", "genai-v2", "expanse-v1", "azeroth-v11"):
        p = REPO / "public" / "images" / "voidwalker" / f"holo-still-{name}.webp"
        if p.exists():
            rows.append((f"shipped poster · {name}", gate_file(p)))
    for name, r in rows:
        print(f"  {'ok  ' if r['ok'] else 'FAIL'} {name:34} p75 {r['p75']:6.1f}   hot {r['hot']:.3f}")

    arch = rows[0][1]["ok"] and rows[1][1]["ok"]
    loud = [n for n, r in rows if "genai-v2" in n or "expanse-v1" in n]
    loud_fail = all(not r["ok"] for n, r in rows if n in loud)

    print("\nthe key on another era's ground (ADR-082 U33)")
    magenta = selftest_magenta()

    passes = arch and loud_fail and err < 15 and magenta
    print("\nself-test", "PASSES" if passes else "FAILS",
          "— the Architect passes, the two one-step draws fail, the tables hold out,"
          " and the magenta ground keys the trainer's colours whole")
    return 0 if passes else 1


def solve_exposure(fg: np.ndarray, mask: np.ndarray, target_p75: float = 105.0) -> float:
    """The ONE exposure scalar a delivery may carry: bisected inside grade()'s
    own clamp [0.85, 1.35] until the deep interior's p75 lands on `target_p75`
    (the Architect sits ~91-103). A figure that cannot reach it keeps the clamp's
    end and FAILS the gate — which is the report, never a wider clamp."""
    def p75_at(e: float) -> float:
        return exposure_gate(luma(grade(fg, e)), mask)["p75"]

    lo, hi = 0.85, 1.35
    if p75_at(lo) >= target_p75:
        return lo
    if p75_at(hi) <= target_p75:
        return hi
    for _ in range(18):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if p75_at(mid) < target_p75 else (lo, mid)
    return (lo + hi) / 2


def plate(path: Path, out: Path, exposure: float | None = 1.0,
          ground: tuple[int, int, int] | None = None) -> dict:
    """A plate on the key ground -> a gold PREVIEW (RGBA and on-black).

    `exposure=None` SOLVES the scalar the way `post.py` will (ADR-082 U33): a
    preview graded at 1.0 says what the plate looks like at a setting nothing
    will ship at. `ground` defaults to the blue lock; a plate on another era's
    ground passes its own (`grounds.ground_rgb(era)`)."""
    out.mkdir(parents=True, exist_ok=True)
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    g = np.array(ground if ground is not None else KEY_GROUND, np.float32)
    alpha = key_matte(rgb, tuple(float(v) for v in g)) if ground is not None else key_matte(rgb)
    fg = unmix(rgb, alpha, g)
    k = rgb.shape[0] / 1280
    fig_a = finish_edge(alpha, k)
    if exposure is None:
        exposure = solve_exposure(fg, alpha > 0.5)
    gold = grade(fg, exposure)
    out_rgb, a = compose(gold, fig_a, k)
    rgba = np.dstack([out_rgb, a * 255]).clip(0, 255).astype(np.uint8)
    stem = path.stem
    Image.fromarray(rgba, "RGBA").save(out / f"{stem}.gold.png")
    on_black = (out_rgb * a[..., None]).clip(0, 255).astype(np.uint8)
    Image.fromarray(on_black).save(out / f"{stem}.gold-on-black.jpg", quality=90)
    return {**exposure_gate(luma(gold), fig_a > 0.5), "exposure": round(float(exposure), 3)}


def selftest_magenta() -> bool:
    """ADR-082 U33: the key on the MAGENTA ground, on the 2016 trainer's own
    colours — every one of them must key opaque and the ground clear. And the
    blue key on those same colours, to show why the trainer does not stand on
    blue (his vest and jeans would key through)."""
    patches = {
        "crimson cap": (140, 20, 30), "red ball": (220, 30, 40), "navy vest": (25, 35, 80),
        "blue vest": (40, 90, 200), "indigo jeans": (40, 45, 90), "green gloves": (60, 160, 60),
        "dark green": (20, 70, 30), "skin": (220, 170, 140), "white": (240, 240, 240),
        "black": (15, 15, 15),
    }
    ok = True
    for name, rgb_ground in (("magenta", KEY_GROUNDS["magenta"][0]), ("blue", KEY_GROUNDS["blue"][0])):
        img = np.zeros((96, 32 * len(patches), 3), np.float32) + np.array(rgb_ground, np.float32)
        for i, col in enumerate(patches.values()):
            img[32:64, 32 * i + 4:32 * i + 28] = col
        a = key_matte(img, rgb_ground)
        per = {n: float(a[40:56, 32 * i + 8:32 * i + 24].min()) for i, n in enumerate(patches)}
        clear = float(a[:16].max())
        weak = {n: round(v, 2) for n, v in per.items() if v < 0.99}
        print(f"  {name:8} ground clear {1 - clear:.2f} · patches under 0.99: {weak or 'none'}")
        if name == "magenta":
            ok = ok and not weak and clear <= 0.01
        else:
            ok = ok and "blue vest" in weak  # the conflict the magenta ground exists for
    return ok


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--plate", type=Path, nargs="*")
    ap.add_argument("--exposure", type=float, default=1.0)
    ap.add_argument("--out", type=Path,
                    default=Path(__file__).resolve().parent / "waves" / "20260921-calibration-v1")
    args = ap.parse_args()
    if args.selftest:
        return selftest(args.out)
    if args.plate:
        for p in args.plate:
            r = plate(p, args.out, args.exposure)
            print(f"{'ok  ' if r['ok'] else 'FAIL'} {p.name:40} p75 {r['p75']:6.1f}  hot {r['hot']:.3f}")
        return 0
    ap.print_help()
    return 2


if __name__ == "__main__":
    sys.exit(main())
