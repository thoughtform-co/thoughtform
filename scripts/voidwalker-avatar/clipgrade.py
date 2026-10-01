"""
clipgrade — read a transition clip in CODE before anyone reads it by eye.

Armada's law, one medium over: "a video model does not see motion, so motion
is measured in code". Every clip a morph lane returns (fal, Comfy, a TimeSlice
pass) gets the same four deterministic reads, written beside it as
`<clip>.grade.json`:

  flash     the figure's luminance, frame by frame, against the site's
            no-flashing law (WCAG 2.3.1 as ADR-097 U12 applied it: more than
            three opposing >=10 % swings inside any one second fails) and for
            DIPS: a frame 15 % darker than the brightest frame on BOTH sides
            of it within half a second — a valley, never a level change (the
            two eras are not equally bright, and B ending brighter than A is
            the change, not a flash).
  cut       adjacent-frame difference: a frame that changes far more than the
            clip's own motion does is a CUT, the thing every first/last-frame
            lane in wave v1 did instead of morphing.
  dissolve  each frame fitted as a blend of the frames six either side of
            it, over the pixels that changed between them: a blend explains a
            cross-dissolve (or a fade) almost exactly and a moving form badly.
            Asked only where 15 % of the frame changed strongly.
  relight   the ground's colour drifting (the grey studio, the silver pass) —
            measured on the frame's corners.

⚠ LUMINANCE IS MEASURED OVER THE FIGURE, NOT THE FRAME. On gold-on-black the
frame mean is ~0.08, so a dip to black moves the frame by almost nothing while
being exactly the flash wave v1's evals refused. The region is the union of
every frame's ink against the clip's own ground.

⚠ THE BARS ARE CALIBRATED, NOT GUESSED (2026-10-01): `--calibrate` grades
wave v1's six fal clips beside `evals.md`'s eye reads. Two first-cut bars were
WRONG and moved: dips measured against the clip's MEDIAN read every A/B
brightness difference as a dip (five of six clips flagged), so a dip is a
valley now; and a first/last linear fit never fired (a double exposure over a
changing studio is no blend of the ENDS), so the fit is local. Measured:
1a clean; 1b dip f1-11 + a fade up from black; 2a two dips + cuts; 2b cuts +
a blend through f37-54 + the studio relight; 3 clean; the TimeSlice passes
clean (a slit-scan is not a dissolve).
⚠ WHAT CODE CANNOT SEE: 2c's "hard swap at f32-40" moves LESS per frame than
clip 3's real morph (max 4-frame energy 17.7 against 24.9) — whether a change
rides a gesture or just happens is a judgement, and it is the vision judge's
(`morph-rubric.md` M2), not a threshold's.

Usage:
  python scripts/voidwalker-avatar/clipgrade.py <clip.mp4> [...]
  python scripts/voidwalker-avatar/clipgrade.py --calibrate
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import morph  # noqa: E402

SIZE = (144, 256)
#: WCAG 2.3.1's general-flash pair: a >=10 % swing, more than 3 a second.
FLASH_REL, FLASH_PER_S = 0.10, 3
#: A dip: 15 % below the brightest frame on both sides within DIP_K frames.
DIP_REL, DIP_K = 0.15, 12
#: A cut: an adjacent-frame change above this (/255, at 144x256) AND this many
#: times the clip's own median change. Calibrated on wave v1 (see --calibrate).
CUT_MAD, CUT_RATIO = 12.0, 3.0
#: A dissolve: residual of the local blend under BLEND_RATIO of the change it
#: explains, with the blend weight inside (0.2, 0.8), where at least
#: CHANGED_MIN of the frame changed strongly between the frames BLEND_K apart.
#: Calibrated 2026-10-01: 2b's double exposure 0.05, 3's morph 0.48-0.52,
#: the TimeSlice passes >= 0.26; at a 5 % gate 1a's idle breathing fired.
BLEND_K, BLEND_RATIO, CHANGED_MIN = 6, 0.20, 0.15
#: Relight: the corner ground drifting this far (/255) from its clip median.
GROUND_DRIFT = 20.0


def srgb_luma(rgb: np.ndarray) -> np.ndarray:
    c = rgb.astype(np.float32) / 255.0
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    return lin[..., 0] * 0.2126 + lin[..., 1] * 0.7152 + lin[..., 2] * 0.0722


def corners(fr: np.ndarray, c: int = 8) -> np.ndarray:
    return np.concatenate([fr[:c, :c].reshape(-1, 3), fr[:c, -c:].reshape(-1, 3),
                           fr[-c:, :c].reshape(-1, 3), fr[-c:, -c:].reshape(-1, 3)])


def flashes(series: np.ndarray, fps: int) -> tuple[int, list[int]]:
    """Max opposing >=FLASH_REL swings in any 1-s window, and the swing frames."""
    ref = float(series.max()) or 1.0
    turns, last_ext, direction = [], float(series[0]), 0
    for i, v in enumerate(series[1:], 1):
        d = v - last_ext
        if abs(d) >= FLASH_REL * ref and np.sign(d) != direction:
            turns.append(i)
            direction, last_ext = int(np.sign(d)), float(v)
        elif direction and np.sign(v - last_ext) == direction:
            last_ext = float(v)
    worst = max((sum(1 for t in turns if s <= t < s + fps) for s in range(len(series))), default=0)
    return worst, turns


def runs(mask: np.ndarray) -> list[tuple[int, int]]:
    out, start = [], None
    for i, m in enumerate(mask):
        if m and start is None:
            start = i
        if not m and start is not None:
            out.append((start, i - 1))
            start = None
    if start is not None:
        out.append((start, len(mask) - 1))
    return out


def grade_clip(clip: Path, fps: int = morph.FPS) -> dict:
    fr = morph.read_frames(clip, size=SIZE)
    n = len(fr)
    f32 = fr.astype(np.float32)
    ground = np.median(np.stack([corners(f) for f in fr]).reshape(-1, 3), axis=0)
    ink_each = np.abs(f32 - ground).sum(-1) > 60
    ink_each[:, :, :4] = ink_each[:, :, -4:] = False
    region = ink_each.any(0)
    luma = np.array([float(srgb_luma(f)[region].mean()) if region.any() else float(srgb_luma(f).mean()) for f in fr])
    med = float(np.median(luma))
    ref = np.array([min(luma[max(0, i - DIP_K):i].max(), luma[i + 1:i + 1 + DIP_K].max())
                    if 0 < i < n - 1 else luma[i] for i in range(n)])
    valley = luma < (1 - DIP_REL) * ref
    dips = [{"from": a, "to": b, "min": round(float(luma[a:b + 1].min()), 4),
             "rel": round(1 - float((luma / np.maximum(ref, 1e-6))[a:b + 1].min()), 3)} for a, b in runs(valley)]
    per_s, turns = flashes(luma, fps)

    mad = np.abs(np.diff(f32, axis=0)).mean(axis=(1, 2, 3))
    mmed = float(np.median(mad))
    spikes = [{"frame": int(i + 1), "mad": round(float(v), 2), "ratio": round(float(v) / max(mmed, 0.05), 1)}
              for i, v in enumerate(mad) if v > CUT_MAD and v > CUT_RATIO * max(mmed, 0.05)]

    fits = []
    for i in range(BLEND_K, n - BLEND_K):
        a, b, f = f32[i - BLEND_K], f32[i + BLEND_K], f32[i]
        chg = np.abs(a - b).sum(-1) > 40
        if chg.mean() < CHANGED_MIN:
            continue
        d, x = (a - b)[chg].reshape(-1), (f - b)[chg].reshape(-1)
        w = float(np.clip(np.dot(x, d) / max(float(np.dot(d, d)), 1e-6), 0, 1))
        if not 0.2 < w < 0.8:
            continue
        ratio = float(np.abs(f - (w * a + (1 - w) * b))[chg].mean() / np.abs(a - b)[chg].mean())
        fits.append((i, w, ratio, float(chg.mean())))
    blend = None
    if fits:
        best = min(fits, key=lambda t: t[2])
        blend = {"best_frame": best[0], "best_w": round(best[1], 2), "best_ratio": round(best[2], 3),
                 "changed": round(best[3], 3), "blend_frames": [i for i, _, r, _ in fits if r < BLEND_RATIO]}

    gseries = np.stack([np.median(corners(f), axis=0) for f in fr])
    drift = np.abs(gseries - np.median(gseries, axis=0)).max(axis=1)
    area = ink_each.mean(axis=(1, 2))

    verdict = {
        "flash": "FAIL" if per_s > FLASH_PER_S else ("DIP" if dips else "PASS"),
        "cut": "FAIL" if spikes else "PASS",
        "dissolve": "n/a" if blend is None else ("FLAG" if blend["blend_frames"] else "PASS"),
        "relight": "FAIL" if float(drift.max()) > GROUND_DRIFT else "PASS",
    }
    verdict["overall"] = "FAIL" if "FAIL" in verdict.values() else ("FLAG" if {"FLAG", "DIP"} & set(verdict.values()) else "PASS")
    rec = {
        "clip": clip.name, "frames": n, "measured_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "luma": {"region": "union of every frame's ink", "median": round(med, 4),
                 "series": [round(float(v), 4) for v in luma], "dips": dips,
                 "swings": turns, "swings_per_s_max": per_s},
        "cut": {"median": round(mmed, 2), "max": round(float(mad.max()), 2), "spikes": spikes},
        "dissolve": blend,
        "ground": {"max_drift": round(float(drift.max()), 1), "at": int(drift.argmax())},
        "silhouette": {"area_min": round(float(area.min()), 3), "area_max": round(float(area.max()), 3)},
        "bars": {"FLASH_REL": FLASH_REL, "FLASH_PER_S": FLASH_PER_S, "DIP_REL": DIP_REL, "DIP_K": DIP_K,
                 "CUT_MAD": CUT_MAD, "CUT_RATIO": CUT_RATIO, "BLEND_K": BLEND_K, "BLEND_RATIO": BLEND_RATIO,
                 "CHANGED_MIN": CHANGED_MIN, "GROUND_DRIFT": GROUND_DRIFT},
        "verdict": verdict,
    }
    clip.with_suffix(".grade.json").write_text(json.dumps(rec, indent=2), encoding="utf-8")
    return rec


# ── the vision judge (morph-rubric.md) ─────────────────────────────────────

RUBRIC = HERE / "morph-rubric.md"
JUDGE_MODEL = "gemini-flash-latest"
JUDGE_URL = "https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent"


def rubric_checks(path: Path = RUBRIC) -> tuple[list[dict], str]:
    """The check rows and the `## Grading rules` text, read at runtime."""
    import re

    text = path.read_text(encoding="utf-8")
    rows = [{"id": m[0], "check": m[1].strip(), "fails_when": m[2].strip(), "severity": m[3].strip()}
            for m in re.findall(r"^\|\s*(M\d+)\s*\|([^|]+)\|([^|]+)\|\s*([a-z]+)\s*\|\s*$", text, re.M)]
    rules = re.search(r"^## Grading rules\s*\n(.*?)(?=^## |\Z)", text, re.M | re.S)
    return rows, (rules.group(1).strip() if rules else "")


def _judge_once(parts: list, checks: list[dict]) -> dict:
    import urllib.error
    import urllib.request

    from env import load, require

    ids = [c["id"] for c in checks]
    schema = {"type": "OBJECT", "properties": {
        "reads_as": {"type": "STRING"}, "worst_issue": {"type": "STRING"},
        "checks": {"type": "OBJECT", "properties": {i: {"type": "STRING", "enum": ["pass", "fail", "cannot_tell"]}
                                                    for i in ids}, "required": ids}},
        "required": ["reads_as", "worst_issue", "checks"]}
    body = {"contents": [{"role": "user", "parts": parts}],
            "generationConfig": {"temperature": 0, "responseMimeType": "application/json", "responseSchema": schema}}
    req = urllib.request.Request(JUDGE_URL.format(m=JUDGE_MODEL), data=json.dumps(body).encode(), method="POST",
                                 headers={"x-goog-api-key": require("GEMINI_API_KEY"), "Content-Type": "application/json",
                                          "User-Agent": morph.UA})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            out = json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        key = load().get("GEMINI_API_KEY") or "\0"
        return {"error": f"HTTP {e.code}: {e.read().decode(errors='ignore')[:400].replace(key, '<key>')}"}
    try:
        return json.loads(out["candidates"][0]["content"]["parts"][0]["text"])
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        return {"error": f"unparseable answer: {e}"}


def judge_clip(clip: Path, refs: tuple[Path, Path] | None = None, runs: int = 3, dry_run: bool = False) -> dict:
    """Three runs of the rubric on the clip's strip; majority per check.
    ⚠ A PAID CALL (cents): the chain's rule is the owner's go in the session."""
    import base64

    checks, rules = rubric_checks()
    if not refs:
        checks = [c for c in checks if c["id"] != "M5"]
    strip_path = clip.with_suffix(".strip.jpg")
    if not strip_path.exists():
        morph.strip(clip)
    images = [strip_path] + list(refs or [])
    text = (rules + "\n\nChecks (answer each pass, fail or cannot_tell):\n"
            + "\n".join(f"{c['id']} [{c['severity']}] {c['check']}. FAILS WHEN: {c['fails_when']}" for c in checks))
    if dry_run:
        print(f"judge {JUDGE_MODEL} x{runs} on {[i.name for i in images]}\n---\n{text}")
        return {}
    parts = [{"inline_data": {"mime_type": "image/jpeg" if i.suffix == ".jpg" else "image/png",
                              "data": base64.b64encode(i.read_bytes()).decode()}} for i in images]
    parts.append({"text": text})
    answers = [_judge_once(parts, checks) for _ in range(runs)]
    good = [a for a in answers if "checks" in a]
    votes = {c["id"]: [a["checks"].get(c["id"], "cannot_tell") for a in good] for c in checks}
    quorum = runs // 2 + 1
    majority = {}
    for i, v in votes.items():
        top = max(set(v), key=v.count) if v else "cannot_tell"
        majority[i] = top if v.count(top) >= quorum and v.count(top) * 2 > len(v) else "fail"
    sev = {c["id"]: c["severity"] for c in checks}
    failed = [i for i, v in majority.items() if v != "pass"]
    verdict = ("UNMEASURED" if len(good) < quorum else
               "FAIL" if any(sev[i] == "gate" for i in failed) else
               "RETRY" if any(sev[i] == "critical" for i in failed) else "PASS")
    rec = {"model": JUDGE_MODEL, "runs": runs, "answered": len(good), "votes": votes, "majority": majority,
           "verdict": verdict, "unstable": [i for i, v in votes.items() if len(set(v)) > 1],
           "notes": [a.get("worst_issue") for a in good], "errors": [a["error"] for a in answers if "error" in a]}
    gpath = clip.with_suffix(".grade.json")
    g = json.loads(gpath.read_text(encoding="utf-8")) if gpath.exists() else {}
    g["judge"] = rec
    gpath.write_text(json.dumps(g, indent=2), encoding="utf-8")
    return rec


def compact(frames: list[int]) -> str:
    return ",".join(f"f{a}" if a == b else f"f{a}-{b}" for a, b in runs(np.isin(np.arange(max(frames, default=-1) + 1), frames)))


def line(rec: dict) -> str:
    v, lu, c, d = rec["verdict"], rec["luma"], rec["cut"], rec["dissolve"]
    dips = ",".join(f"f{x['from']}-{x['to']}({x['rel']:.0%})" for x in lu["dips"]) or "-"
    sp = ",".join(f"f{x['frame']}({x['mad']})" for x in c["spikes"]) or "-"
    ds = "n/a" if d is None else (compact(d["blend_frames"]) or f"best f{d['best_frame']} ratio {d['best_ratio']}")
    return (f"{rec['clip']:24} {v['overall']:5} | flash {v['flash']:4} swings/s {lu['swings_per_s_max']} dips {dips}"
            f" | cut {v['cut']:4} {sp} (median {c['median']}) | dissolve {v['dissolve']:4} {ds}"
            f" | relight {v['relight']} drift {rec['ground']['max_drift']}")


EYE = {"1a": "clean, barely moves", "1b": "dips to black f8, repaints cream", "2a": "two black dips, cuts between renderings",
       "2b": "relit silver, grey studio, double exposure ~f48", "2c": "dims, hard swap f32-40 (the judge's, not code's)",
       "3": "continuous, no dips"}


def calibrate() -> int:
    w = HERE / "waves" / "20260924-morph-v1-expanse-pokemon-go"
    for k in ("1a", "1b", "2a", "2b", "2c", "3"):
        rec = grade_clip(w / f"{k}.mp4")
        print(line(rec))
        print(f"{'':24} eye: {EYE[k]}")
    return 0


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("clips", nargs="*")
    ap.add_argument("--calibrate", action="store_true")
    ap.add_argument("--judge", action="store_true", help="also run morph-rubric.md through the vision judge (PAID, cents)")
    ap.add_argument("--refs", nargs=2, metavar=("START", "END"), help="the frames the clip should start and end on")
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--dry-run", action="store_true", help="print the judge's prompt; no call, no key read")
    a = ap.parse_args()
    if a.calibrate:
        raise SystemExit(calibrate())
    for c in a.clips:
        clip = Path(c)
        print(line(grade_clip(clip)))
        if a.judge:
            j = judge_clip(clip, tuple(Path(r) for r in a.refs) if a.refs else None, a.runs, a.dry_run)
            if j:
                print(f"  judge {j['verdict']}: " + " ".join(f"{k}={v}" for k, v in j["majority"].items())
                      + (f"  unstable {j['unstable']}" if j["unstable"] else ""))
