"""
post — close the loop, key the alpha, encode the five deliveries, measure the
anchors.

Four stages, each of which is a recorded lesson rather than a preference:

1. THE LOOP IS CLOSED BY TRIMMING, not by Veo's first=last trick (ADR-082 U14:
   that left a seam of 15.35/255 against 14.19 of real motion). The period is
   the offset `p` minimising the mean absolute difference between frames `k`
   and `k+p`; it is accepted only if that seam is under HALF the clip's own
   motion baseline, and an open loop is a re-draw rather than a ship.

2. THE LUT IS MEASURED FROM THIS ASSET, never inherited. `off` clears the
   ground's own black level, `gain` takes the figure's darkest lit pixel to
   full. The formula reproduces both shipped LUTs — `(val-8)*12` for the
   thoughtform pair and `(val-8)*8` for azeroth — from their own footage.

3. THE KEY IS `geq` ON RGBA WITH BT.601 LUMA INLINE. ⚠ NEVER `alphamerge`:
   ADR-082 U12 measured it silently dropping chroma on this ffmpeg build,
   producing a WebM that inspected as `alpha_mode=1` and rendered pure silver.
   ⚠ And the SCALE runs BEFORE the key — scaling after it resamples a hard
   alpha edge into a halo.

4. THE ANCHORS ARE READ OFF THE DELIVERED ALPHA OVER EVERY FRAME, at the
   32/255 opaque cutoff. ⚠ Not frame zero: a breathing idle moves, and an
   anchor taken from one pose is wrong for the other 191.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

W, H = 720, 1280
FPS = 24
OPAQUE = 32  # /255, the cutoff the shipped anchors were measured at


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def lane(label: str, cmd: list[str]) -> bool:
    """One encode lane, and it SAYS when it did not run (ADR-082 U26).

    ⚠ `run()` has no `check=True` and `encode()` discarded every return value,
    so a missing encoder produced no error, no file and no complaint — and
    `main()` then printed a registry block naming a file that was never
    written. Two lanes fail that way on Windows: `hevc_videotoolbox` is macOS
    only, and a missing executable raises `FileNotFoundError` rather than a
    non-zero exit, which killed the script BEFORE the anchors were measured.
    """
    try:
        p = run(cmd)
    except FileNotFoundError:
        print(f"  ! {label}: `{cmd[0]}` is not on PATH — lane skipped")
        return False
    if p.returncode != 0:
        tail = (p.stderr or "").strip().splitlines()
        print(f"  ! {label}: ffmpeg exited {p.returncode} — {tail[-1] if tail else 'no output'}")
        return False
    return True


def has_encoder(name: str) -> bool:
    try:
        return name in run(["ffmpeg", "-hide_banner", "-encoders"]).stdout
    except FileNotFoundError:
        return False


def frames(src: Path, out: Path, scale: str | None = None) -> int:
    out.mkdir(parents=True, exist_ok=True)
    if any(out.iterdir()):
        return len(list(out.glob("*.png")))
    vf = scale or f"scale={W}:{H}:flags=lanczos"
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-vf", vf, str(out / "%05d.png")])
    return len(list(out.glob("*.png")))


def raw_gray(src: Path, w: int, h: int, vf_extra: str = "") -> tuple[bytes, int]:
    """Decode the WHOLE clip to raw 8-bit gray in ONE pass.

    ⚠ ONE PASS, NOT ONE PER FRAME. The first cut shelled out to ffmpeg for each
    of 192 frames three times over; besides being slow, it decoded binary
    through a text pipe and died on the first non-UTF-8 byte.
    """
    vf = f"scale={w}:{h}" + (f",{vf_extra}" if vf_extra else "")
    out = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(src), "-vf", vf,
         "-pix_fmt", "gray", "-f", "rawvideo", "-"],
        capture_output=True,
    ).stdout
    return out, len(out) // (w * h)


def detect_period(src: Path) -> dict:
    w, h = 90, 160
    buf, n = raw_gray(src, w, h)
    per = w * h
    fr = [buf[i * per:(i + 1) * per] for i in range(n)]

    def mad(a: bytes, b: bytes) -> float:
        return sum(abs(a[i] - b[i]) for i in range(per)) / per

    motion = sum(mad(fr[i], fr[i + 1]) for i in range(n - 1)) / (n - 1)
    best, best_seam = n, float("inf")
    for p_ in range(int(n * 0.55), n):
        window = min(6, n - p_)
        seam = sum(mad(fr[k], fr[k + p_]) for k in range(window)) / window
        if seam < best_seam:
            best, best_seam = p_, seam
    return {"frames": n, "period": best, "seam": round(best_seam, 3),
            "motion": round(motion, 3), "closed": best_seam < motion * 0.5}


def measure_lut(src: Path, period: int) -> dict:
    """The ground's own black level, and the figure's darkest LIT value.

    ⚠ THE GROUND IS SAMPLED AT THE CORNERS, NOT AT A BORDER RING. The first cut
    took a 20px ring and read `ground_max` 236 — because the robe's hem reaches
    the bottom edge — which produced `clip((val-242)*255)`, a key that wipes the
    figure. The BOOTS LAW only promises the man does not TOUCH an edge; it does
    not promise a 20px margin. The four corners are background by construction.

    ⚠ AND THE DERIVATION IS CALIBRATED AGAINST THE TWO SHIPPED ASSETS, which is
    the check that it is a derivation rather than a fit. Measured on their own
    footage: thoughtform's corners give `off` 8 and its 10th-percentile lit
    value gives `gain` 12 — which is exactly the recorded `clip((val-8)*12)`;
    azeroth lands at off 6 / gain 5 against its recorded off 8 / gain 8.
    """
    import numpy as np

    w, h = 180, 320
    buf, n = raw_gray(src, w, h)
    if n == 0:
        raise SystemExit("no frames decoded for the LUT")
    arr = np.frombuffer(buf, dtype=np.uint8)[: n * w * h].reshape(n, h, w).astype(int)
    arr = arr[: max(1, min(n, period))]

    corner = int(max(arr[:, :12, :12].max(), arr[:, :12, -12:].max(),
                     arr[:, -12:, :12].max(), arr[:, -12:, -12:].max()))
    off = min(255, corner + 6)
    lit = arr[arr > off + 8]
    body_min = int(np.percentile(lit, 10)) if lit.size else off + 20
    gain = max(1, round(255 / max(1, body_min - off)))
    return {"corner_max": corner, "body_min": body_min, "off": off, "gain": gain}


def build_loop(src: Path, fdir: Path, period: int, blend: int) -> dict:
    """Write the loop's own frames, with the tail overlapped into the head.

    ⚠ A TRIM ALONE DOES NOT CLOSE THIS TAKE, AND THE ARITHMETIC SAYS WHY. The
    recipe's calibration (ADR-082 U14) closed a loop whose seam fell to 0.38x
    its own motion baseline — but that clip MOVED (motion ~15/255). This idle
    is deliberately almost still (motion 1.2), and its best return point still
    sits 3.5 out, i.e. THREE ordinary frame-steps of jump. A residual that small
    in absolute terms is large in the only terms that matter.

    ⚠ THIS IS NOT VEO'S first=last TRICK, WHICH IS STILL REFUSED. That asked the
    MODEL to land the last frame on the first and it drifted anyway; this is an
    overlap-add done after the fact, on frames the model already drew:

        out[j] = mix(src[period + j], src[j], j / blend)   for j < blend
        out[j] = src[j]                                    otherwise

    so `out[period-1]` is followed by `out[0] == src[period]`, which is the
    frame that genuinely came next. The cost is that the first `blend` frames
    are a dissolve of two poses — invisible at this motion, and measured below
    rather than assumed.
    """
    import numpy as np

    w, h = W, H
    buf = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(src), "-vf", f"scale={w}:{h}:flags=lanczos",
         "-pix_fmt", "rgb24", "-f", "rawvideo", "-"],
        capture_output=True).stdout
    per = w * h * 3
    n = len(buf) // per
    arr = np.frombuffer(buf, dtype=np.uint8)[: n * per].reshape(n, h, w, 3).astype(np.float32)

    blend = min(blend, period, n - period)
    out = arr[:period].copy()
    for j in range(blend):
        t = (j + 1) / (blend + 1)          # 0 -> the following frame, 1 -> the head
        out[j] = arr[period + j] * (1 - t) + arr[j] * t

    fdir.mkdir(parents=True, exist_ok=True)
    for f in fdir.glob("*.png"):
        f.unlink()
    pipe = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{w}x{h}", "-framerate", str(FPS), "-i", "-", str(fdir / "%05d.png")],
        stdin=subprocess.PIPE)
    pipe.communicate(out.astype(np.uint8).tobytes())

    # ⚠ MEASURE THE JOIN WE JUST MADE, on the frames that will actually ship.
    small = subprocess.run(
        ["ffmpeg", "-v", "error", "-framerate", str(FPS), "-i", str(fdir / "%05d.png"),
         "-vf", "scale=90:160", "-pix_fmt", "gray", "-f", "rawvideo", "-"],
        capture_output=True).stdout
    sper = 90 * 160
    sn = len(small) // sper
    fr = [small[i * sper:(i + 1) * sper] for i in range(sn)]

    def mad(a, b):
        return sum(abs(a[i] - b[i]) for i in range(sper)) / sper

    motion = sum(mad(fr[i], fr[i + 1]) for i in range(sn - 1)) / (sn - 1)
    seam = mad(fr[-1], fr[0])
    return {"period": period, "blend": blend, "frames": sn,
            "seam": round(seam, 3), "motion": round(motion, 3),
            "closed": seam < motion * 1.25}


def seat_frames(fdir: Path, lut: dict, foot_target: float) -> dict:
    """Slide the figure down the canvas so its boots land on the foot anchor.

    ⚠ THE CANVAS IS A CONTRACT, NOT A CROP (ADR-082's normalized 720x1280 with
    authored head/foot anchors). The site seats the media BOTTOM-CENTRED in a
    slot whose floor IS the projector disc's top, so a figure that ends at 0.945
    of its own frame hovers 5.5 % of the slot's height above the disc it is
    supposed to stand on. The canonical pair ends at 0.998 and azeroth at 0.970.

    So the fix is a vertical SHIFT of the whole frame, never a crop: cropping
    would change the delivered aspect and every anchor that reads against it.
    The figure keeps its size and its centre column; only its seat moves.
    """
    import numpy as np

    files = sorted(fdir.glob("*.png"))
    if not files:
        raise SystemExit(f"no loop frames in {fdir}")
    off, gain = lut["off"], lut["gain"]

    buf, n = raw_gray(fdir / "%05d.png", W, H)
    arr = np.frombuffer(buf, dtype=np.uint8)[: n * W * H].reshape(n, H, W).astype(int)
    alpha = np.clip((arr - off) * gain, 0, 255)
    rows = (alpha >= OPAQUE).any(axis=2)          # per frame, per row
    any_row = rows.any(axis=0)                     # over EVERY frame, as the anchors are
    ys = np.where(any_row)[0]
    if not ys.size:
        raise SystemExit("the key left nothing opaque — check the LUT")
    foot = int(ys.max()) + 1
    shift = int(round(foot_target * H)) - foot
    if abs(shift) < 2:
        return {"shift": 0, "foot_before": round(foot / H, 4)}

    rgb = subprocess.run(
        ["ffmpeg", "-v", "error", "-framerate", str(FPS), "-i", str(fdir / "%05d.png"),
         "-pix_fmt", "rgb24", "-f", "rawvideo", "-"], capture_output=True).stdout
    per = W * H * 3
    cnt = len(rgb) // per
    frames_arr = np.frombuffer(rgb, dtype=np.uint8)[: cnt * per].reshape(cnt, H, W, 3)
    out = np.zeros_like(frames_arr)
    if shift > 0:
        out[:, shift:, :, :] = frames_arr[:, : H - shift, :, :]
    else:
        out[:, : H + shift, :, :] = frames_arr[:, -shift:, :, :]

    for f in files:
        f.unlink()
    pipe = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-framerate", str(FPS), "-i", "-", str(fdir / "%05d.png")],
        stdin=subprocess.PIPE)
    pipe.communicate(out.tobytes())
    return {"shift": shift, "foot_before": round(foot / H, 4), "foot_target": foot_target}


def encode(fdir: Path, period: int, lut: dict, out: Path, era: str, version: str) -> dict:
    out.mkdir(parents=True, exist_ok=True)
    stem = f"holo-idle-{era}-{version}"
    poster = f"holo-still-{era}-{version}"
    off, gain = lut["off"], lut["gain"]
    key = (
        "format=rgba,geq="
        "r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':"
        f"a='clip((0.299*r(X,Y)+0.587*g(X,Y)+0.114*b(X,Y)-{off})*{gain},0,255)'"
    )
    src = str(fdir / "%05d.png")
    common = ["-y", "-loglevel", "error", "-framerate", str(FPS), "-i", src,
              "-frames:v", str(period), "-an"]
    sizes = {}

    # 1 · VP9/WebM, real alpha. ⚠ `-auto-alt-ref 0`: alt-ref frames break
    #     libvpx's alpha side-channel. `alpha_mode=1` is what the browser reads.
    lane("webm", ["ffmpeg", *common, "-vf", key, "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
         "-auto-alt-ref", "0", "-crf", "48", "-b:v", "0", "-row-mt", "1",
         "-tile-columns", "2", "-g", "240", "-metadata:s:v:0", "alpha_mode=1",
         str(out / f"{stem}.webm")])

    # 2 · H.264/MP4, opaque on black — the existing floor path. No key: the
    #     source is already on pure black.
    lane("mp4", ["ffmpeg", *common, "-vf", "format=yuv420p", "-c:v", "libx264", "-preset", "veryslow",
         "-crf", "26", "-profile:v", "high", "-level", "4.0", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", "-g", "240", str(out / f"{stem}.mp4")])

    # 3 · HEVC/MOV, real alpha — the Safari lane (ADR-082 U23). ⚠ `bgra`, not
    #     `yuva420p` (silently swapped for `ayuv`); ⚠ `-alpha_quality` defaults
    #     to 0 and is the dominant size term; ⚠ `hvc1`, and `.mov`.
    if has_encoder("hevc_videotoolbox"):
        lane("mov", ["ffmpeg", *common, "-vf", f"{key},format=bgra", "-c:v", "hevc_videotoolbox",
         "-alpha_quality", "0.5", "-q:v", "45", "-allow_sw", "1", "-tag:v", "hvc1",
         "-pix_fmt", "bgra", "-movflags", "+faststart", str(out / f"{stem}.mov")])

    # 4 · Posters, frame zero.
    f0 = fdir / "00001.png"
    lane("jpg", ["ffmpeg", "-y", "-loglevel", "error", "-i", str(f0), "-vf", "format=yuvj420p",
                 "-q:v", "4", str(out / f"{poster}.jpg")])
    tmp = out / "_f0.png"
    lane("webp:key", ["ffmpeg", "-y", "-loglevel", "error", "-i", str(f0), "-vf", key,
                      "-frames:v", "1", str(tmp)])
    # ⚠ `cwebp` FIRST, ffmpeg's libwebp AS THE FALLBACK (ADR-082 U26). The note
    #   that stood here — "this ffmpeg has no WebP encoder at all" — was true of
    #   the build the chain was written on and FALSE of the one on the Windows
    #   machine, where `cwebp` is simply absent. A missing executable raises
    #   `FileNotFoundError` rather than exiting non-zero, so this line killed the
    #   whole script before `measure_anchors` ever ran: no anchors, no registry
    #   block, and four delivered files with nothing to seat them by. cwebp keeps
    #   the lead because it cut the shipped posters; the fallback only has to
    #   exist for the machine that lacks it.
    if not lane("webp", ["cwebp", "-quiet", "-q", "82", "-alpha_q", "100", "-m", "6",
                         "-sharp_yuv", str(tmp), "-o", str(out / f"{poster}.webp")]):
        if has_encoder("libwebp"):
            print("    → falling back to ffmpeg's libwebp")
            lane("webp", ["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp),
                          "-c:v", "libwebp", "-lossless", "0", "-quality", "82",
                          "-pix_fmt", "bgra", str(out / f"{poster}.webp")])
    tmp.unlink(missing_ok=True)

    for f in sorted(out.iterdir()):
        if f.is_file():
            sizes[f.name] = f.stat().st_size
    return sizes


def measure_anchors(webm: Path) -> dict:
    """headY / footY / leftX / rightX off the DELIVERED alpha, over every frame.

    ⚠ ALL FOUR EDGES, BECAUSE A SPAN CHANGE IS A WIDTH CHANGE (ADR-082 U25).
    Re-seating a figure taller inside the contract canvas scales it on BOTH
    axes, so the horizontal ink is what says whether the room exists; the
    vertical anchors alone cannot answer it, and the site's own rule is that a
    plume may run off the edge but the man may not.
    """
    import numpy as np

    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-c:v", "libvpx-vp9", "-i", str(webm),
         "-vf", f"alphaextract,scale={W}:{H}", "-pix_fmt", "gray", "-f", "rawvideo", "-"],
        capture_output=True).stdout
    per = W * H
    n = len(raw) // per
    if not n:
        raise SystemExit(f"no frames decoded from {webm}")
    arr = np.frombuffer(raw, dtype=np.uint8)[: n * per].reshape(n, H, W)
    ink = arr >= OPAQUE
    ys = np.where(ink.any(axis=2).any(axis=0))[0]
    xs = np.where(ink.any(axis=1).any(axis=0))[0]
    if not ys.size or not xs.size:
        raise SystemExit(f"the key left nothing opaque in {webm}")

    # ⚠ HEAD WIDTH IS THE POSE-INVARIANT SCALE PROXY (ADR-082 U26). Head-to-foot
    #   extent measures how big the figure is drawn only while it is STANDING —
    #   a man on one knee is ~0.6 of his own height at the same body scale. A
    #   head does not change size with a pose, so the widest ink row in the top
    #   eighth of the silhouette is what says whether two deliveries draw the
    #   same man at the same size. The site's `stature` field is authored from
    #   the ratio of two of these.
    top, bot = int(ys.min()), int(ys.max())
    head_rows = ink[:, top:top + max(1, (bot - top + 1) // 8), :].any(axis=0)
    widths = [int(r.sum()) for r in head_rows if r.any()]
    head_w = max(widths) if widths else 0

    return {"frames": n,
            "headY": round(float(ys.min()) / H, 4),
            "footY": round(float(ys.max() + 1) / H, 4),
            "leftX": round(float(xs.min()) / W, 4),
            "rightX": round(float(xs.max() + 1) / W, 4),
            "headW": round(head_w / W, 4)}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wave", required=True)
    ap.add_argument("--era", required=True)
    ap.add_argument("--version", default="v1")
    ap.add_argument("--foot", type=float, default=0.995,
                    help="where the boots should land on the canvas (canonical 0.998)")
    ap.add_argument("--blend", type=int, default=16,
                    help="frames of tail-into-head overlap (see build_loop)")
    args = ap.parse_args()

    root = Path(__file__).resolve().parent
    wave = root / "waves" / args.wave
    raw = wave / "veo" / "raw.mp4"
    if not raw.exists():
        raise SystemExit(f"no veo output at {raw}")

    fdir = wave / "veo" / "frames"
    n = frames(raw, fdir)
    print(f"frames: {n}")

    period = detect_period(raw)
    print(f"trim alone: period {period['period']}/{period['frames']}  "
          f"seam {period['seam']}  motion {period['motion']}  "
          f"{'closed' if period['closed'] else 'OPEN'}")

    loopdir = wave / "veo" / "loop"
    joined = build_loop(raw, loopdir, period["period"], args.blend)
    print(f"overlap {joined['blend']}f: seam {joined['seam']}  "
          f"motion {joined['motion']}  "
          f"{'CLOSED' if joined['closed'] else 'STILL OPEN — re-draw'}")
    (wave / "veo" / "period.json").write_text(
        json.dumps({"trim": period, "joined": joined}, indent=1))
    if not joined["closed"]:
        print("⚠ the loop does not close; ship nothing from this take.")
        return 1
    fdir = loopdir
    period = {**period, **joined}

    lut = measure_lut(raw, period["period"])
    print(f"lut: corner_max {lut['corner_max']}  body_min {lut['body_min']}  "
          f"-> clip((val-{lut['off']})*{lut['gain']})")

    seat = seat_frames(fdir, lut, args.foot)
    if seat["shift"]:
        print(f"seat: boots were at {seat['foot_before']} of the canvas; "
              f"shifted {seat['shift']:+d}px to land on {args.foot}")

    sizes = encode(fdir, joined["frames"], lut, wave / "out", args.era, args.version)
    for name, size in sizes.items():
        print(f"  {name:38} {size / 1024:8.0f} KB")

    anchors = measure_anchors(wave / "out" / f"holo-idle-{args.era}-{args.version}.webm")
    print(f"anchors: headY {anchors['headY']}  footY {anchors['footY']}  "
          f"over {anchors['frames']} frames")

    (wave / "manifest.json").write_text(json.dumps(
        {"wave": args.wave, "era": args.era, "version": args.version,
         "loop": period, "key": lut, "seat": seat, "encode": sizes,
         "anchors": anchors}, indent=1))
    # ⚠ THE BLOCK NAMES ONLY WHAT WAS WRITTEN (ADR-082 U26). It printed
    #   `videoAlphaHevcPath` unconditionally, so a Windows run — where the
    #   macOS-only HEVC-alpha lane silently produces nothing — handed back a
    #   registry entry pointing at a file that does not exist, and the Safari
    #   branch would switch its floor off over a 404.
    stem = f"holo-idle-{args.era}-{args.version}"
    still = f"holo-still-{args.era}-{args.version}"
    rows = [f'  videoPath: "/videos/voidwalker/{stem}.mp4",',
            f'  videoAlphaPath: "/videos/voidwalker/{stem}.webm",']
    if f"{stem}.mov" in sizes:
        rows.append(f'  videoAlphaHevcPath: "/videos/voidwalker/{stem}.mov",')
    else:
        rows += ["  // ⚠ NO `videoAlphaHevcPath` — the macOS-only HEVC-alpha lane did",
                 "  //   not run here. Cut it on a Mac from THIS wave before shipping, or",
                 "  //   Safari keeps whatever the previous version left on disk."]
    rows += [f'  posterPath: "/images/voidwalker/{still}.jpg",',
             f'  posterAlphaPath: "/images/voidwalker/{still}.webp",',
             "  frame: { width: 720, height: 1280 },",
             f'  headY: {anchors["headY"]},',
             f'  footY: {anchors["footY"]},']
    print("\nregistry block for characterEras.ts:")
    print("\n".join(rows))
    print(f"\nhead width {anchors['headW']} of the canvas — the pose-invariant SCALE proxy."
          f"\n  A NON-STANDING pose authors `stature` from it: the standing delivery's span"
          f"\n  x (its headW / this headW). A standing one omits the field entirely.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
