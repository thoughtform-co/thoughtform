"""reseat_azeroth.py — seat the Azeroth delivery on its disc (ADR-082 U31).

    python scripts/voidwalker-avatar/reseat_azeroth.py [--wave <offline wave dir>] [--rows 33]

ADR-082 U25 named this and left it open: every other era's boots end at
0.993–0.998 of the 720x1280 canvas and azeroth's at 0.9695, so on a slot whose
floor IS the projector disc he hovers — 23.6px at 1920x1247, 27.3px once U29's
overscan magnified it. The close is a pure vertical SHIFT of the rendered
frames. No scale, no crop, no re-render: the canvas has the room (the composite's
lowest inked row is 1245, so 33 rows lands the lowest claw at 1278).

⚠ THE SOURCE IS READ-ONLY. The frames live in the offline skill's wave folder
(`~/.claude/skills/voidwalker-avatar/waves/20260830-azeroth-v5-blender/`), which
is unversioned and is the only copy of a 1.1 GB Blender arc. This script reads
`render/` and `render-solo/` there and writes everything it makes under this
repo's own (gitignored) `waves/`.

⚠ THE ENCODE IS v10's, COMMAND FOR COMMAND (that wave's `encode.py`): VP9
yuva420p at CRF 48 — measured there against the file it replaced — H.264 over
black for the floor branch, a Pillow WebP poster because ffmpeg's libwebp
wrapper writes a lossless alpha it cannot be talked out of. He still ships no
`.mov`: his matte misses the alpha-fidelity standard at every HEVC size
(ADR-082 U23), and nothing about a re-seat changes that.

⚠ THE ANCHORS ARE AUTHORED AS `old + rows/1280`, NOT RE-ROUNDED. The man's
anchors come off the figure-ONLY render (a composite reads an imp's tail), and
re-measuring then rounding head and foot separately gives a span of 0.7344 —
which makes `holoFigureFit` return 0.99986 for the one era whose fit must be
exactly 1. This script prints the measured rows so the authored pair can be
checked against them, and prints the pair to paste.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = Path(__file__).resolve().parent
DEFAULT_WAVE = Path.home() / ".claude/skills/voidwalker-avatar/waves/20260830-azeroth-v5-blender"
OUT_WAVE = HERE / "waves" / "20260921-azeroth-v11"
W, H = 720, 1280
ALPHA_CUT = 32  # /255 — the U13 opaque convention every anchor is read at
OLD_HEAD_Y, OLD_FOOT_Y = 0.2352, 0.9695  # the registry's v10 pair


def opt(flag: str, default: str) -> str:
    if flag in sys.argv:
        return sys.argv[sys.argv.index(flag) + 1]
    return default


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    print("  $", " ".join(str(c) for c in cmd[:7]), "…")
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[-2500:])
        raise SystemExit(f"failed: {cmd[0]}")
    return r


def shift_dir(src: Path, dst: Path, rows: int) -> tuple[int, int]:
    """Shift every RGBA frame down by `rows`. Returns (frames, lowest inked row after)."""
    frames = sorted(src.glob("frame_*.png"))
    if not frames:
        raise SystemExit(f"no frames in {src}")
    if dst.exists():
        shutil.rmtree(dst)
    dst.mkdir(parents=True)
    lowest = 0
    for f in frames:
        a = np.asarray(Image.open(f).convert("RGBA"))
        if a.shape[:2] != (H, W):
            raise SystemExit(f"{f.name}: {a.shape[1]}x{a.shape[0]}, expected {W}x{H}")
        # ⚠ THE ROWS BEING DROPPED MUST BE EMPTY ON EVERY FRAME, not frame zero:
        # the imps' tails and claws move, and a shift that eats one frame's claw
        # is a one-frame flicker at the floor that no still would show.
        if int(a[H - rows :, :, 3].max()) != 0:
            raise SystemExit(f"{f.name}: ink in the bottom {rows} rows — the shift would cut it")
        out = np.zeros_like(a)
        out[rows:] = a[: H - rows]
        inked = np.nonzero(out[:, :, 3].max(axis=1) >= ALPHA_CUT)[0]
        if inked.size:
            lowest = max(lowest, int(inked[-1]))
        Image.fromarray(out, "RGBA").save(dst / f.name, compress_level=3)
    return len(frames), lowest


def anchors(solo: Path) -> tuple[int, int]:
    """Head and foot rows of the MAN, over every frame of the figure-only render."""
    head, foot = H, 0
    for f in sorted(solo.glob("frame_*.png")):
        alpha = np.asarray(Image.open(f).convert("RGBA"))[:, :, 3]
        rows = np.nonzero(alpha.max(axis=1) >= ALPHA_CUT)[0]
        if rows.size:
            head, foot = min(head, int(rows[0])), max(foot, int(rows[-1]))
    return head, foot


def main() -> None:
    wave = Path(opt("--wave", str(DEFAULT_WAVE)))
    rows = int(opt("--rows", "33"))
    name, still = "holo-idle-azeroth-v11", "holo-still-azeroth-v11"

    print(f"source  {wave}")
    print(f"out     {OUT_WAVE}")
    n, lowest = shift_dir(wave / "render", OUT_WAVE / "render", rows)
    print(f"composite  {n} frames shifted {rows} rows; lowest inked row {lowest} of {H - 1}")
    n_solo, _ = shift_dir(wave / "render-solo", OUT_WAVE / "render-solo", rows)
    head_row, foot_row = anchors(OUT_WAVE / "render-solo")
    print(f"figure-only  {n_solo} frames; head row {head_row}, foot row {foot_row}")

    out = OUT_WAVE / "out"
    out.mkdir(exist_ok=True)
    seq = str(OUT_WAVE / "render" / "frame_%04d.png")
    webm, mp4 = out / f"{name}.webm", out / f"{name}.mp4"
    poster_a, poster_j = out / f"{still}.webp", out / f"{still}.jpg"

    print("encoding…")
    run(["ffmpeg", "-y", "-framerate", "24", "-i", seq,
         "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "48",
         "-row-mt", "1", "-an", str(webm)])
    run(["ffmpeg", "-y", "-framerate", "24", "-i", seq,
         "-filter_complex",
         "color=black:s=720x1280:r=24[bg];[bg][0:v]overlay=shortest=1,format=yuv420p",
         "-c:v", "libx264", "-preset", "veryslow", "-crf", "26", "-an", str(mp4)])
    frame0 = OUT_WAVE / "render" / "frame_0000.png"
    Image.open(frame0).convert("RGBA").save(poster_a, quality=80, alpha_quality=70, method=6)
    run(["ffmpeg", "-y", "-i", str(frame0),
         "-filter_complex", "color=black:s=720x1280[bg];[bg][0:v]overlay,format=yuv420p",
         "-frames:v", "1", "-update", "1", "-q:v", "4", str(poster_j)])

    probe = run(["ffprobe", "-v", "error", "-select_streams", "v:0",
                 "-show_entries", "stream=codec_name,width,height,nb_frames:stream_tags=alpha_mode",
                 "-of", "json", str(webm)])
    info = json.loads(probe.stdout)["streams"][0]
    if info.get("tags", {}).get("alpha_mode") != "1":
        raise SystemExit("⚠ THE WEBM CARRIES NO ALPHA (`alpha_mode` absent) — the site would take the floor")

    shift = rows / H
    head_y, foot_y = round(OLD_HEAD_Y + shift, 4), round(OLD_FOOT_Y + shift, 4)
    sizes = {p.name: p.stat().st_size for p in (webm, mp4, poster_a, poster_j)}
    print(json.dumps({"webm": info, "bytes": sizes}, indent=1))
    print(f"measured   headY {head_row / H:.4f}  footY {foot_row / H:.4f}  (rows {head_row}..{foot_row})")
    print(f"AUTHOR     headY: {head_y},  footY: {foot_y}   span {foot_y - head_y:.4f} — must equal 0.7343")
    if round(foot_y - head_y, 4) != 0.7343:
        raise SystemExit("⚠ the authored span is not HOLO_FIGURE_SPAN — the floor era's fit would not be exactly 1")


if __name__ == "__main__":
    main()
