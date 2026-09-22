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


def decode_rgb(src: Path, cut: int | None = None):
    """The clip's frames at the delivery size, as one uint8 array; `cut` keeps
    frames 0..cut."""
    import numpy as np

    buf = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(src), "-vf", f"scale={W}:{H}:flags=lanczos",
         "-pix_fmt", "rgb24", "-f", "rawvideo", "-"], capture_output=True).stdout
    per = W * H * 3
    n = len(buf) // per
    arr = np.frombuffer(buf, dtype=np.uint8)[: n * per].reshape(n, H, W, 3)
    return arr[: cut + 1] if cut is not None else arr


def write_frames(out, fdir: Path) -> None:
    import numpy as np

    fdir.mkdir(parents=True, exist_ok=True)
    for f in fdir.glob("*.png"):
        f.unlink()
    pipe = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-framerate", str(FPS), "-i", "-", str(fdir / "%05d.png")],
        stdin=subprocess.PIPE)
    pipe.communicate(np.asarray(out).clip(0, 255).astype(np.uint8).tobytes())


def build_settle(src: Path, fdir: Path, cut: int | None = None, k_max: int = FPS) -> dict:
    """A SCENE's loop (ADR-082 U33): the clip was drawn with Veo's `last_frame`
    set to its own first frame, so it BEGINS AND ENDS on one held pose. The
    model's last frame lands on frame 0 and is dropped; the frames before it
    are dissolved onto frame 0 over `k` frames, so the join is a still pose
    fading into the same still pose.

    ⚠ THIS IS NOT U14's REFUSED TRICK AGAIN. That asked first=last to close a
    near-still idle, where the model's drift (15.35/255) was as loud as the
    motion (14.19) and there was nothing to hide it in. A scene is held at both
    ends and the drift is dissolved AFTER the fact, on frames the model drew.

    ⚠ GATED AGAINST THE HELD SECOND, NEVER THE CLIP'S AVERAGE. An action clip's
    mean frame step is inflated by the action, and against it any seam passes.
    What the dissolve adds is `drift / (k + 1)` of change per frame ON TOP of a
    held pose, so that step is compared with the held second's own motion (and a
    0.75/255 floor, the encoder's noise on a still frame); `k` grows until it
    passes or reaches a second, which is all the hold there is."""
    import numpy as np

    arr = decode_rgb(src, cut).astype(np.float32)
    n = len(arr)
    if n < FPS * 3:
        raise SystemExit(f"{n} frames is too short for a scene")
    small = arr[:, ::8, ::8].mean(-1)
    steps = np.abs(np.diff(small, axis=0)).mean(axis=(1, 2))
    m = n - 1                                   # frame n-1 is the model's copy of frame 0
    held = float(steps[m - FPS:m - 1].mean())   # the last second, before the copy
    drift = float(np.abs(small[m - 1] - small[0]).mean())
    floor = max(1.25 * held, 0.75)
    k = next((k for k in range(6, k_max + 1) if drift / (k + 1) <= floor), k_max)
    out = arr[:m].copy()
    for j in range(k):
        t = (j + 1) / (k + 1)
        i = m - k + j
        out[i] = arr[i] * (1 - t) + arr[0] * t
    write_frames(out, fdir)
    osmall = out[:, ::8, ::8].mean(-1)
    seam = float(np.abs(osmall[-1] - osmall[0]).mean())
    motion = float(np.abs(np.diff(osmall, axis=0)).mean())
    return {"period": len(out), "blend": k, "frames": len(out), "loop": "settle",
            "drift": round(drift, 3), "held": round(held, 3), "step": round(drift / (k + 1), 3),
            "seam": round(seam, 3), "motion": round(motion, 3),
            "closed": drift / (k + 1) <= floor}


def build_pingpong(src: Path, fdir: Path, cut: int | None = None) -> dict:
    """The clip forward, then backward: a loop CLOSED BY CONSTRUCTION.

    ⚠ FOR THE IDLE THAT DRIFTS AND NEVER RETURNS (ADR-082 U32, expanse take 2).
    A subtle idle — a breath, a weight shift, one blink — moved 0.3/255 a frame
    and ended 2.0 from its own first frame: no return point for a trim, and no
    tail past the period for `build_loop` to overlap. A long cross-fade was the
    other way out and it GHOSTS whatever moves inside it (a blink in the window
    arrives half-transparent). Played back and forth there is no seam at all —
    the motion reverses, which a breath does anyway — and every frame is one
    the model drew. The cost is length: 2n − 2 frames.

    ⚠ `cut` (ADR-082 U33) is the SCENE's fallback: a scene that will not settle
    back onto its first frame is cut in the middle of a HELD beat (the aim) and
    played back from there. Both turning points are then holds, so the reversal
    has no velocity to bounce off."""
    import numpy as np

    arr = decode_rgb(src, cut)
    out = np.concatenate([arr, arr[-2:0:-1]])
    write_frames(out, fdir)
    small = out[:, ::8, ::8].mean(-1)
    motion = float(np.abs(np.diff(small, axis=0)).mean())
    seam = float(np.abs(small[-1] - small[0]).mean())
    return {"period": len(out), "blend": 0, "frames": len(out), "loop": "pingpong",
            "seam": round(seam, 3), "motion": round(motion, 3), "closed": True}


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


def ground_frames(loopdir: Path, outdir: Path, foot_target: float, target_p75: float = 105.0) -> dict:
    """ROUTE B (ADR-082 U31/U32): a PLATE's loop — a colour figure on the flat
    key ground — keyed, un-mixed, graded gold on the Architect's own curve,
    bloomed, and seated. Straight-alpha RGBA PNGs out, one per loop frame.

    ⚠ ONE GROUND FOR THE WHOLE CLIP, and its drift is REPORTED. A key read off
    each frame's own corners follows the model's exposure wobble and makes the
    edge breathe; the median of every frame's corners is the ground, and the
    furthest any frame strays from it is `ground_drift` (K2: Veo held it).
    ⚠ ONE EXPOSURE SCALAR FOR THE CLIP, solved on frame one to land the deep
    interior's p75 on `target_p75` (the Architect sits ~91-103) and clamped to
    gold.grade's own [0.85, 1.35]. Never a histogram match: that would re-light
    every era to one picture.
    ⚠ THE SEAT PADS TRANSPARENT. `seat_frames` shifts on-black RGB frames and
    pads with zeros, which a LUMA key reads as ground; under a ground key the
    frame is already RGBA, so the padding is simply alpha 0.
    """
    import numpy as np
    from PIL import Image
    from scipy import ndimage

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import gold

    files = sorted(loopdir.glob("*.png"))
    if not files:
        raise SystemExit(f"no loop frames in {loopdir}")

    def load(f: Path) -> np.ndarray:
        return np.asarray(Image.open(f).convert("RGB")).astype(np.float32)

    c = 16
    corners = []
    for f in files:
        rgb = load(f)
        px = np.concatenate([rgb[:c, :c].reshape(-1, 3), rgb[:c, -c:].reshape(-1, 3),
                             rgb[-c:, :c].reshape(-1, 3), rgb[-c:, -c:].reshape(-1, 3)])
        corners.append(np.median(px, axis=0))
    corners = np.array(corners)
    ground = np.median(corners, axis=0)
    drift = float(np.abs(corners - ground).max())

    k = H / 1280
    # ⚠ VEO LETTERBOXES A PLATE THAT IS NOT EXACTLY 9:16 — 1–3px of BLACK down
    #   both sides for a 1536×2752 plate (0.558 against 0.5625). Black carries
    #   no blue, so the ground key reads it as solid figure; the choke erases a
    #   2px bar and a 3px one survives it, which put `rightX` at 1.0 on the
    #   first take through. The BOOTS LAW keeps the man off every edge, so the
    #   outer band is repainted with the ground before anything is keyed.
    BORDER = 4

    def figure(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        rgb = rgb.copy()
        rgb[:BORDER], rgb[-BORDER:], rgb[:, :BORDER], rgb[:, -BORDER:] = ground, ground, ground, ground
        a = gold.key_matte(rgb, tuple(float(v) for v in ground))
        # Specks: the ground is flat, so anything opaque and SMALL out there is
        # the model's noise, never the man.
        lab, n = ndimage.label(a > 0.5)
        if n > 1:
            sizes = ndimage.sum(np.ones_like(a), lab, range(1, n + 1))
            keep = np.isin(lab, 1 + np.where(sizes >= 400)[0])
            a = np.where(keep | (a <= 0.5), a, 0.0)
        return gold.unmix(rgb, a, ground), gold.finish_edge(a, k)

    fg0, a0 = figure(load(files[0]))
    # One copy of the bisection, shared with the plate preview (ADR-082 U33).
    exposure = gold.solve_exposure(fg0, a0 > 0.5, target_p75)
    gate0 = gold.exposure_gate(gold.luma(gold.grade(fg0, exposure)), a0 > 0.5)

    # ⚠ TWO PASSES, ONE FRAME IN MEMORY. A clip is ~192 frames of 720x1280
    #   RGBA, ~700 MB as one array and several times that once it is shifted and
    #   measured; the seat needs only each frame's lowest and highest opaque row.
    outdir.mkdir(parents=True, exist_ok=True)
    tmp = outdir / "_ungraded-seat"
    tmp.mkdir(exist_ok=True)
    for f in list(outdir.glob("*.png")) + list(tmp.glob("*.png")):
        f.unlink()
    lowest, highest = -1, H
    # ⚠ THE SIDE WALLS ARE WATCHED ON THE KEY, BEFORE ANY SEAT (ADR-082 U33). The
    #   BORDER band above is repainted with the ground, so a muzzle that reaches
    #   an edge is not reported as touching it — it is CUT there, cleanly, and
    #   the matte looks perfect. A scene that swings a rifle is the first idle on
    #   this chain that can do it.
    left, right, top_row = W, -1, H
    for i, f in enumerate(files, start=1):
        fg, a = figure(load(f))
        rgb_out, a_out = gold.compose(gold.grade(fg, exposure), a, k)
        rgba = np.dstack([rgb_out, a_out * 255]).clip(0, 255).astype(np.uint8)
        rows = np.where((rgba[..., 3] >= OPAQUE).any(axis=1))[0]
        if rows.size:
            lowest, highest = max(lowest, int(rows.max())), min(highest, int(rows.min()))
        cols = np.where((a >= 0.5).any(axis=0))[0]
        if cols.size:
            left, right = min(left, int(cols.min())), max(right, int(cols.max()))
        krows = np.where((a >= 0.5).any(axis=1))[0]
        if krows.size:
            top_row = min(top_row, int(krows.min()))
        Image.fromarray(rgba, "RGBA").save(tmp / f"{i:05d}.png")
    wall = BORDER + 2
    walls = [side for side, hit in (("left", left <= wall), ("right", right >= W - 1 - wall),
                                    ("top", top_row <= wall)) if hit]
    if lowest < 0:
        raise SystemExit("the ground key left nothing opaque — check the plate's ground")

    # The seat: the lowest row any frame paints opaque lands on the foot anchor.
    foot = lowest + 1
    shift = int(round(foot_target * H)) - foot
    top_cut = shift < 0 and highest < -shift

    # T2: frame-to-frame change inside the figure — a grade that strobes is
    # the per-frame restyle U14 rejected, arriving by another road.
    diffs, prev = [], None
    for f in sorted(tmp.glob("*.png")):
        fr = np.asarray(Image.open(f))
        seated = np.zeros_like(fr)
        if shift >= 0:
            seated[shift:] = fr[: H - shift]
        else:
            seated[: H + shift] = fr[-shift:]
        Image.fromarray(seated, "RGBA").save(outdir / f.name)
        y = 0.299 * seated[..., 0] + 0.587 * seated[..., 1] + 0.114 * seated[..., 2]
        inside = seated[..., 3] >= 128
        if prev is not None:
            both = inside & prev[1]
            if both.any():
                diffs.append(float(np.abs(y - prev[0])[both].mean()))
        prev = (y, inside)
        f.unlink()
    tmp.rmdir()
    flicker = float(np.mean(diffs)) if diffs else 0.0
    return {"ground": [round(float(v), 1) for v in ground], "ground_drift": round(drift, 1),
            "exposure": round(exposure, 3), "p75": gate0["p75"], "hot": gate0["hot"],
            "exposure_ok": gate0["ok"], "shift": shift, "foot_before": round(foot / H, 4),
            "top_cut": top_cut, "flicker": round(flicker, 2), "frames": len(files),
            "walls": walls, "ink_x": [left, right], "ink_top": top_row}


def encode_rgba(gdir: Path, n: int, out: Path, era: str, version: str) -> dict:
    """Every lane from the graded RGBA frames (ADR-082 U31). ⚠ The MP4 is the
    frame composited OVER BLACK with `overlay`, never `alphamerge` (U12)."""
    out.mkdir(parents=True, exist_ok=True)
    stem = f"holo-idle-{era}-{version}"
    poster = f"holo-still-{era}-{version}"
    src = str(gdir / "%05d.png")
    common = ["-y", "-loglevel", "error", "-framerate", str(FPS), "-i", src, "-frames:v", str(n), "-an"]
    lane("webm", ["ffmpeg", *common, "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
         "-auto-alt-ref", "0", "-crf", "48", "-b:v", "0", "-row-mt", "1",
         "-tile-columns", "2", "-g", "240", "-metadata:s:v:0", "alpha_mode=1",
         str(out / f"{stem}.webm")])
    lane("mp4", ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"color=black:s={W}x{H}:r={FPS}",
         "-framerate", str(FPS), "-i", src, "-frames:v", str(n), "-an",
         "-filter_complex", "[0:v][1:v]overlay=shortest=1:format=auto,format=yuv420p",
         "-c:v", "libx264", "-preset", "veryslow", "-crf", "26", "-profile:v", "high", "-level", "4.0",
         "-movflags", "+faststart", "-g", "240", str(out / f"{stem}.mp4")])
    f0 = gdir / "00001.png"
    lane("jpg", ["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"color=black:s={W}x{H}",
                 "-i", str(f0), "-filter_complex", "[0:v][1:v]overlay=format=auto,format=yuvj420p",
                 "-frames:v", "1", "-q:v", "4", str(out / f"{poster}.jpg")])
    if not lane("webp", ["cwebp", "-quiet", "-q", "82", "-alpha_q", "100", "-m", "6",
                         "-sharp_yuv", str(f0), "-o", str(out / f"{poster}.webp")]):
        if has_encoder("libwebp"):
            print("    → falling back to ffmpeg's libwebp")
            lane("webp", ["ffmpeg", "-y", "-loglevel", "error", "-i", str(f0),
                          "-c:v", "libwebp", "-lossless", "0", "-quality", "82",
                          "-pix_fmt", "bgra", str(out / f"{poster}.webp")])
    return {f.name: f.stat().st_size for f in sorted(out.iterdir())
            if f.is_file() and f.name.startswith((stem, poster))}


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


def main_ground(args: argparse.Namespace, wave: Path, raw: Path) -> int:
    """Route B end to end: close the loop, key + grade every frame, encode from
    RGBA, measure the anchors off what was delivered."""
    period = detect_period(raw)
    print(f"trim alone: period {period['period']}/{period['frames']}  seam "
          f"{period['seam']}  motion {period['motion']}  {'closed' if period['closed'] else 'OPEN'}")
    loopdir = wave / "veo" / "loop"
    if args.loop == "pingpong":
        joined = build_pingpong(raw, loopdir, args.cut)
        print(f"ping-pong{f' (cut at {args.cut})' if args.cut is not None else ''}: {joined['frames']} "
              f"frames, seam {joined['seam']}  motion {joined['motion']}  CLOSED")
    elif args.loop == "settle":
        joined = build_settle(raw, loopdir, args.cut)
        print(f"settle: drift {joined['drift']} onto frame 0 over {joined['blend']}f = "
              f"{joined['step']}/frame against the held second's {joined['held']}  "
              f"{'CLOSED' if joined['closed'] else 'STILL OPEN — try --loop pingpong --cut <aim hold>'}")
    else:
        joined = build_loop(raw, loopdir, period["period"], args.blend)
        print(f"overlap {joined['blend']}f: seam {joined['seam']}  motion {joined['motion']}  "
              f"{'CLOSED' if joined['closed'] else 'STILL OPEN — re-draw, or --loop pingpong'}")
    if not joined["closed"]:
        print("⚠ the loop does not close; ship nothing from this take.")
        return 1

    gdir = wave / "veo" / "graded"
    g = ground_frames(loopdir, gdir, args.foot)
    print(f"ground {g['ground']} (drift {g['ground_drift']})  exposure x{g['exposure']} -> "
          f"p75 {g['p75']} hot {g['hot']} {'ok' if g['exposure_ok'] else 'OFF'}  "
          f"seat {g['shift']:+d}px (boots were at {g['foot_before']})  flicker {g['flicker']}")
    problems = []
    if g["ground_drift"] > 12:
        problems.append(f"K2 the ground drifted {g['ground_drift']} over the clip")
    if not g["exposure_ok"]:
        problems.append("the deep interior is outside the Architect's exposure band")
    if g["top_cut"]:
        problems.append("the seat pushed opaque rows off the TOP of the canvas")
    if g["flicker"] > 6.0:
        problems.append(f"T2 interior flicker {g['flicker']} > 6.0")
    if g["walls"]:
        problems.append(f"the figure reaches the {'/'.join(g['walls'])} wall (ink x {g['ink_x']}, "
                        f"top {g['ink_top']}) — the border repaint would cut it there")
    for p in problems:
        print(f"  ! {p}")

    sizes = encode_rgba(gdir, joined["frames"], wave / "out", args.era, args.version)
    for name, size in sizes.items():
        print(f"  {name:38} {size / 1024:8.0f} KB")
    stem = f"holo-idle-{args.era}-{args.version}"
    still = f"holo-still-{args.era}-{args.version}"
    anchors = measure_anchors(wave / "out" / f"{stem}.webm")
    print(f"anchors: headY {anchors['headY']}  footY {anchors['footY']}  "
          f"x {anchors['leftX']}-{anchors['rightX']}  over {anchors['frames']} frames")
    (wave / "manifest.json").write_text(json.dumps(
        {"wave": args.wave, "era": args.era, "version": args.version, "route": "ground",
         "clip": raw.name, "loop": {**period, **joined}, "grade": g, "encode": sizes,
         "anchors": anchors, "problems": problems}, indent=1))
    print("\nregistry block for characterEras.ts:")
    print("\n".join([
        f'  videoPath: "/videos/voidwalker/{stem}.mp4",',
        f'  videoAlphaPath: "/videos/voidwalker/{stem}.webm",',
        "  // ⚠ NO `videoAlphaHevcPath` — HEVC alpha needs macOS VideoToolbox; cut it",
        "  //   on a Mac from this wave's veo/graded/ RGBA frames before shipping one.",
        f'  posterPath: "/images/voidwalker/{still}.jpg",',
        f'  posterAlphaPath: "/images/voidwalker/{still}.webp",',
        "  frame: { width: 720, height: 1280 },",
        f'  headY: {anchors["headY"]},',
        f'  footY: {anchors["footY"]},',
    ]))
    print(f"\nhead width {anchors['headW']} of the canvas — a NON-STANDING pose authors `stature`"
          f"\n  from it (the standing delivery's span x its headW / this headW).")
    return 0 if not problems else 2


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--wave", required=True)
    ap.add_argument("--era", required=True)
    ap.add_argument("--version", default="v1")
    ap.add_argument("--foot", type=float, default=0.995,
                    help="where the boots should land on the canvas (canonical 0.998)")
    ap.add_argument("--blend", type=int, default=16,
                    help="frames of tail-into-head overlap (see build_loop)")
    # ADR-082 U31/U32: `ground` is route B — a colour PLATE's clip on the flat
    # key ground, keyed and graded gold here. `luma` is the one-step route: a
    # clip already gold on black, keyed by brightness.
    ap.add_argument("--matte", choices=("luma", "ground"), default="luma")
    ap.add_argument("--clip", default=None, help="the Veo clip under veo/ (default raw.mp4)")
    ap.add_argument("--loop", choices=("trim", "pingpong", "settle"), default="trim",
                    help="ground route: trim to the clip's own period, play it back and forth, "
                         "or (a scene drawn with last_frame) dissolve its end onto frame 0")
    ap.add_argument("--cut", type=int, default=None,
                    help="ground route: keep frames 0..N first (a scene's ping-pong fallback, cut in a hold)")
    args = ap.parse_args()

    root = Path(__file__).resolve().parent
    wave = root / "waves" / args.wave
    raw = wave / "veo" / (args.clip or "raw.mp4")
    if not raw.exists():
        raise SystemExit(f"no veo output at {raw}")

    if args.matte == "ground":
        return main_ground(args, wave, raw)

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
