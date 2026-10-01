"""
morph — an era TRANSITION: one era's figure becomes the next, his face held
through the middle. The probe for ADR-082's next question (scoped 2026-09-24):
can a flow model carry the change, where U42's glitch tears one poster into the
other?

⚠ THE FIRST ATTEMPT READ AS A CROSS-DISSOLVE, AND THE RECORD SAYS WHY. It ran on
2026-09-07 from the offline skill (`waves/20260907-morph-v1..v3`, EVAL_LOG
"Note N") and three causes are on file, none of them "the model cannot":

  1. THE PROMPT ASKED FOR A DISSOLVE. v1 said the cape "dissolves away" and the
     camera "fade[s] into place", with "he does not move" and a locked-off
     camera. The model did exactly that — frame 4 of its strip is a double
     exposure. Nothing here says dissolve or fade; every transition gives the
     body a GESTURE to make the change inside (`PAIR_WORDS`).
  2. THE ENDPOINTS WERE TOO ALIKE (same pose, backdrop, framing), so a
     first/last-frame interpolator has nothing to do but blend.
  3. THE FLW LoRA WAS NEVER RUN AS DESIGNED. v3-B loaded
     `SYSTMS_FLW_V1_LTX23.safetensors` on `fal-ai/ltx-2-19b/...` — the LTX-2
     19B base, not 2.3, and LTX LoRAs do not cross versions — and used it as a
     first/last-frame LoRA. FLW is an IN-CONTEXT LoRA: its shipped workflow
     (`SYSTMS_FLW_LTX23_WF.json`) feeds `LTXVAddGuide` a 97-frame GUIDE of
     shot A (25 frames) + 50 % grey (127,127,127) + shot B (25 frames) at
     frame 0, strength 1, and the LoRA learned to fill the grey. Without that
     guide the trigger word is decoration.

⚠ THE GUIDE IS BUILT SO ITS MIDDLE IS THE DELIVERABLE. Shot A is era A's first
25 frames PLAYED BACKWARDS, so it ARRIVES on A's frame zero at index 24; shot B
is era B's first 25 frames forward, so it LEAVES from B's frame zero at index
72. Both frame zeros are the eras' posters — the identity frames U42's glitch
hands over on — so `out[24:73]` (49 frames, ~2 s) is a transition from one
poster to the other, with real motion on both sides for the model to read.
The two deltas this script prints are measured exactly there.

⚠ THREE LANES, AND ONLY ONE OF THEM IS THE LoRA AS SHIPPED.
  - `run 1a/1b/2a/2b/2c` — fal, `fal-ai/ltx-2.3-22b/image-to-video/lora`: the
    right base, a seed, an end frame, LoRAs by URL. Image-to-video, the step
    the owner asked for first.
  - `run 3` — fal, `.../reference-video-to-video/lora` with our guide as the
    reference, `ic_lora_type: none` and FLW as a custom LoRA. The cheap probe:
    PASS means the output's frames 0–24 reproduce shot A (the guide was read
    in context); FAIL means fal only honours its own IC types, and the Comfy
    lane is the only FLW lane.
  - `prep` writes `comfy-<ground>/`: the shipped FLW workflow patched to our
    shots, audio, prompt and a FIXED seed, with the Gemini prompt node muted.
    The owner runs it on Comfy Cloud; `ingest` brings the result back.

⚠ THE LoRA "TENDS TO PRODUCE ARTIFACTS WITHOUT" INPUT AUDIO (its author's own
note in the graph). Both raw Veo takes carry a soundtrack, so the guide is
muxed with A's take's audio into B's; the gold posters' mp4s carry none.

⚠ PAID CALLS ARE THE OWNER'S TO START. `run` without `--dry-run` spends money
on fal, and the chain's standing rule is that paid calls get his go in the
session: every payload is printable first, the budget is capped (`--max-usd`),
and the sidecar lands BEFORE the first poll so a dropped connection is a
`--resume`, never a second charge.

⚠ THE WAVE NAME PUTS `vN` BEFORE THE PAIR (`<date>-morph-v1-expanse-pokemon-go`).
`generate.py::latest_wave_dir` globs `*-{era}-v*`, so `...-morph-expanse-v1`
would answer as the Expanse's latest canonical wave. `wave_dir()` refuses it.

Usage:
  python scripts/voidwalker-avatar/morph.py check
  python scripts/voidwalker-avatar/morph.py prep --a expanse --b pokemon-go --wave 20260924-morph-v1-expanse-pokemon-go
  python scripts/voidwalker-avatar/morph.py run  --wave 20260924-morph-v1-expanse-pokemon-go --run all --dry-run
  python scripts/voidwalker-avatar/morph.py run  --wave 20260924-morph-v1-expanse-pokemon-go --run all          # PAID
  python scripts/voidwalker-avatar/morph.py run  --wave ... --run 3 --resume
  python scripts/voidwalker-avatar/morph.py ingest --wave ... --ground gold --file <comfy output.mp4>
  python scripts/voidwalker-avatar/morph.py strip <clip.mp4>
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from env import describe, env_path, require  # noqa: E402
from grounds import KEY_GROUNDS, ground_rgb  # noqa: E402

REPO = HERE.parents[1]
WAVES = HERE / "waves"
ERAS_TS = REPO / "lib" / "voidwalker" / "characterEras.ts"
PUBLIC = REPO / "public"

FPS = 24
#: 9:16 exactly, and both sides divide by 64, so multi-scale's half-size pass
#: still divides by 32 (LTX's latent stride). 720 does not divide by 32.
SIZE = (576, 1024)
SHOT = 25  # the shipped graph's `frame_load_cap`, per shot
GUIDE = 97  # the shipped graph's total, 8n+1
GAP = GUIDE - 2 * SHOT  # 47 grey frames: the transition the LoRA fills
GREY = 127
A_ARRIVES, B_LEAVES = SHOT - 1, GUIDE - SHOT  # 24 and 72: the two posters
SEED = 20260924
#: U42's measured hand-over, per 255: the bar a generated end frame is read against.
HANDOVER_BAR = (2.05, 3.46)
#: Per megapixel of generated video (w x h x frames), fal's published rate for
#: the ltx-2.3-22b LoRA endpoints, 2026-09. An ESTIMATE; the dashboard is the bill.
USD_PER_MP_FRAME = 0.001805

EP_I2V = "fal-ai/ltx-2.3-22b/image-to-video/lora"
EP_REF = "fal-ai/ltx-2.3-22b/reference-video-to-video/lora"
QUEUE = "https://queue.fal.run"

LORAS = {
    # In-context transition LoRA (SYSTMS, Apache-2.0). Trigger `FLW`.
    "flw": "https://huggingface.co/systms/SYSTMS-FLW-IC-LORA-LTX-2.3/resolve/main/SYSTMS_FLW_V1_LTX23.safetensors",
    # First/last-frame transition LoRA (joyfox, Apache-2.0). Trigger `zhuanchang`, cfg 4.
    "zhuanchang": "https://huggingface.co/joyfox/LTX-2.3-Transition-LORA/resolve/main/ltx2.3-transition.safetensors",
}
FLW_WORKFLOW = "https://huggingface.co/systms/SYSTMS-FLW-IC-LORA-LTX-2.3/resolve/main/SYSTMS_FLW_LTX23_WF.json"

#: The raw Veo take each shipped delivery was cut from — the colour plate on its
#: key ground, with Veo's soundtrack. ⚠ A HAND-KEPT TABLE: when an era re-ships
#: from a new take, this row moves with it (the record names the delivery, not
#: the take). Expanse -v6 = wave 20260924-expanse-v8 (ADR-082 U41).
RAW_CLIPS = {
    "expanse": "20260924-expanse-v8/veo/plate-expanse-rig-gpt_01.scene-aim.raw.mp4",
    "pokemon-go": "20260922-pokemon-go-v1/veo/plate-pokemon-go_02.raw.mp4",
}
#: ⚠ THE COLOUR GUIDE STANDS BOTH FIGURES ON ONE GROUND, AND IT IS MAGENTA,
#: MEASURED: on blue the 2016 trainer's vest carries key signal (35 % of his
#: pixels over 20), on magenta the commander's armour carries almost none
#: (p99 13, 0.03 % over 20) — cleaner than on his own blue (p99 27).
COMMON_GROUND = "magenta"

NEG_IDLE = (
    "slow blinks, drooping eyelids, eyes closing, face distortion, extra limbs, "
    "extra fingers, camera movement, watermark, text, subtitles, logo"
)
#: Named because the 09-07 v3-A run named them too — and still got a middle
#: that washed out. A negative is a nudge; the GESTURE in the prompt is the fix.
NEG_MORPH = (
    "cross dissolve, crossfade, fade, double exposure, ghosting, transparent overlay, "
    "two people, superimposed figures, " + NEG_IDLE
)

#: The words, per era and per pair. ⚠ A PAIR WITHOUT WORDS IS REFUSED, never
#: templated: the 09-07 lesson is that the prompt IS the transition, so a new
#: pair is authored by looking at both figures first.
ERA_WORDS = {
    "expanse": {
        "idle": (
            "A golden hologram of a bearded man in dark marine plate armour and an "
            "open-visor helmet stands full-length on pure black, pointing forward with "
            "his right arm and holding a rifle low in his left hand. He holds the pose "
            "and breathes, a small shift of weight between his boots; his eyes stay "
            "alert with normal quick blinks. The camera is locked off. Constant warm "
            "gold light on pure black."
        ),
    },
    "pokemon-go": {
        "idle": (
            "A golden hologram of a bearded man drawn as a clean cel-shaded illustration "
            "stands full-length on pure black, touching the brim of his trainer's cap with "
            "his right hand and holding a small capture ball at his chest with his left; "
            "open vest, black T-shirt, rolled jeans, fingerless gloves. He holds the pose "
            "and breathes, a small nod and a shift of weight; his eyes stay alert with "
            "normal quick blinks. The camera is locked off. Constant warm gold light on "
            "pure black."
        ),
    },
}
#: The two figures mirror each other: the RIGHT hand is raised in both (pointing,
#: then at the cap's brim), the LEFT is low in both (a rifle, then a ball at the
#: chest). The transition is that one gesture, and the change rides it.
PAIR_WORDS = {
    ("expanse", "pokemon-go"): {
        # The FLW formula's action slots are NOUN PHRASES ("A speeding rally car
        # escaping explosions seamlessly transforms into a woman riding a
        # hoverbike"); `gesture` is the same move as a sentence, for the others.
        "action_a": "the armoured commander lowering his pointing arm and raising his hand to the brim of his helmet",
        "action_b": "the trainer tipping the brim of his cap and raising a capture ball to his chest",
        "gesture": "the armoured commander lowers his pointing arm and raises his hand to the brim of his helmet",
        "subject_a": "a bearded man in dark marine plate armour, an open-visor helmet and a rifle held low",
        "subject_b": (
            "the same bearded man drawn as a clean cel-shaded illustration in a trainer's cap, "
            "an open vest over a black T-shirt, rolled jeans and fingerless gloves, the rifle "
            "in his lowered hand becoming a small capture ball"
        ),
    },
}
SETTING = {
    "gold": ("a black void", "the same black void", "constant warm gold hologram light on pure black throughout"),
    "colour": ("a flat magenta backdrop", "the same flat magenta backdrop", "constant even studio light throughout"),
}
CAMERA = "the camera is locked off, the figure stays centred and full-length, his boots planted on the same spot"


# ── the era record ────────────────────────────────────────────────────────────


def era_record(era: str) -> dict:
    """The delivery the SITE names for an era, read off `characterEras.ts`.

    ⚠ READ, NEVER HARDCODED: an era re-ships under a new version (the Expanse
    went -v5 -> -v6 on the day this was written, mid-session, in another
    session's hands), and a probe against a delivery the site no longer shows
    measures nothing. An era with no `hologram` resolves to the canonical pair,
    as `resolveCharacterEraHologram` does.
    """
    src = ERAS_TS.read_text(encoding="utf-8")
    m = re.search(rf'^\s*id:\s*"{re.escape(era)}",', src, re.M)
    if not m:
        raise SystemExit(f"era {era!r} is not in {ERAS_TS}")
    nxt = re.search(r'^\s*id:\s*"', src[m.end():], re.M)
    block = src[m.end(): m.end() + (nxt.start() if nxt else len(src) - m.end())]
    h = re.search(r"hologram:\s*\{(.*?)\n\s*\}", block, re.S)
    if h:
        body, canonical = h.group(1), False
    else:
        c = re.search(r"CANONICAL_CHARACTER_ERA_HOLOGRAM\s*=\s*Object\.freeze\(\{(.*?)\}\s*as const", src, re.S)
        if not c:
            raise SystemExit("could not read CANONICAL_CHARACTER_ERA_HOLOGRAM")
        body, canonical = c.group(1), True

    def s(k: str) -> str | None:
        mm = re.search(rf'\b{k}:\s*"([^"]+)"', body)
        return mm.group(1) if mm else None

    def f(k: str) -> float | None:
        mm = re.search(rf"\b{k}:\s*([0-9.]+)", body)
        return float(mm.group(1)) if mm else None

    rec = {
        "era": era,
        "canonical": canonical,
        "video": s("videoPath"),
        "poster_alpha": s("posterAlphaPath"),
        "headY": f("headY"),
        "footY": f("footY"),
    }
    for k in ("video", "poster_alpha"):
        if not rec[k] or not (PUBLIC / rec[k].lstrip("/")).exists():
            raise SystemExit(f"{era}: {k} {rec[k]!r} is not on disk under public/")
    return rec


def pub(path: str) -> Path:
    return PUBLIC / path.lstrip("/")


# ── ffmpeg ────────────────────────────────────────────────────────────────────


def probe(path: Path) -> tuple[int, int, int]:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames",
         "-show_entries", "stream=width,height,nb_read_frames", "-of", "json", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout
    st = json.loads(out)["streams"][0]
    return int(st["width"]), int(st["height"]), int(st.get("nb_read_frames") or 0)


def has_audio(path: Path) -> bool:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True,
    ).stdout
    return bool(out.strip())


def read_frames(path: Path, idx: list[int] | None = None, first: int = 0,
                count: int | None = None, size: tuple[int, int] | None = None) -> np.ndarray:
    """Frames as (N, H, W, 3) uint8, by index list or by a contiguous run."""
    w, h, _ = probe(path)
    vf = []
    if idx is not None:
        vf.append("select='" + "+".join(f"eq(n\\,{i})" for i in idx) + "'")
    elif count is not None:
        vf += [f"trim=start_frame={first}:end_frame={first + count}", "setpts=PTS-STARTPTS"]
    if size:
        vf.append(f"scale={size[0]}:{size[1]}:flags=lanczos")
        w, h = size
    cmd = ["ffmpeg", "-v", "error", "-i", str(path)]
    if vf:
        cmd += ["-vf", ",".join(vf)]
    cmd += ["-fps_mode", "passthrough", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def write_video(frames: np.ndarray, out: Path, audio: Path | None = None, crf: int = 16) -> None:
    n, h, w, _ = frames.shape
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{w}x{h}", "-r", str(FPS), "-i", "-"]
    if audio:
        cmd += ["-i", str(audio), "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "160k"]
    cmd += ["-c:v", "libx264", "-crf", str(crf), "-preset", "slow", "-pix_fmt", "yuv420p",
            "-movflags", "+faststart", "-frames:v", str(n), "-t", f"{n / FPS:.4f}", str(out)]
    subprocess.run(cmd, input=np.ascontiguousarray(frames).tobytes(), check=True)


def build_audio(raw_a: Path | None, raw_b: Path | None, out: Path) -> str:
    """A's take's sound for the first half, B's for the second, exactly GUIDE
    frames long. Silence where a take has none — said, not hidden."""
    total = GUIDE / FPS
    da = (A_ARRIVES + 1 + GAP // 2) / FPS  # A's half ends mid-gap, at 2.0 s
    db = total - da
    fmt = "aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo"
    src, parts, note = [], [], []
    # One input per half, so the half's index IS its input index.
    for i, (raw, dur, fade) in enumerate(((raw_a, da, "out"), (raw_b, db, "in"))):
        if raw and raw.exists() and has_audio(raw):
            src += ["-i", str(raw)]
            f = f"afade=t=out:st={dur - 0.08:.3f}:d=0.08" if fade == "out" else "afade=t=in:d=0.08"
            parts.append(f"[{i}:a]atrim=0:{dur:.4f},asetpts=PTS-STARTPTS,{fmt},{f}[p{i}]")
            note.append(raw.name)
        else:
            src += ["-f", "lavfi", "-t", f"{dur:.4f}", "-i", "anullsrc=r=48000:cl=stereo"]
            parts.append(f"[{i}:a]asetpts=PTS-STARTPTS,{fmt}[p{i}]")
            note.append("silence")
    graph = ";".join(parts) + f";[p0][p1]concat=n=2:v=0:a=1,apad,atrim=0:{total:.4f}[o]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *src, "-filter_complex", graph, "-map", "[o]",
                    "-c:a", "libmp3lame", "-q:a", "3", str(out)], check=True)
    return " + ".join(note)


# ── images ────────────────────────────────────────────────────────────────────


def flat_poster(path: Path, size: tuple[int, int] = SIZE) -> Image.Image:
    """The alpha poster on BLACK — the site composites it onto the void."""
    im = Image.open(path).convert("RGBA")
    bg = Image.new("RGBA", im.size, (0, 0, 0, 255))
    bg.alpha_composite(im)
    return bg.convert("RGB").resize(size, Image.LANCZOS)


def onto_ground(frames: np.ndarray, era: str, ground: tuple[int, int, int]) -> np.ndarray:
    """Key a raw take off its OWN ground and stand the figure on `ground`."""
    import gold  # scipy lives there; only the colour guide needs it

    own = np.asarray(ground_rgb(era), np.float32)
    dst = np.asarray(ground, np.float32)
    out = np.empty_like(frames)
    for i, fr in enumerate(frames):
        rgb = fr.astype(np.float32)
        # ⚠ post.py's own step: Veo's outer pixels are not the ground, so the
        # 4px border is repainted with it BEFORE the key, or it survives as a
        # frame of ink round the picture (it did, on the first prep).
        rgb[:4], rgb[-4:], rgb[:, :4], rgb[:, -4:] = own, own, own, own
        a = gold.key_matte(rgb, tuple(int(v) for v in own))
        fg = gold.unmix(rgb, a, own)
        out[i] = np.clip(fg * a[..., None] + dst * (1 - a[..., None]), 0, 255).astype(np.uint8)
    return out


def mad(a: np.ndarray, b: np.ndarray) -> float:
    """Mean absolute difference per 255 — U42's hand-over unit."""
    if a.shape != b.shape:
        b = np.asarray(Image.fromarray(b).resize((a.shape[1], a.shape[0]), Image.LANCZOS))
    return float(np.abs(a.astype(np.float32) - b.astype(np.float32)).mean())


def head_box(img: np.ndarray) -> tuple[int, int, int, int]:
    """A square around the head: the topmost ink against the frame's corners.
    ⚠ NOT `sheet.py`'s face finder — that is a skin-colour blob and finds no
    face on a gold figure (and found a brick-red foregrip once, U33)."""
    h, w, _ = img.shape
    c = 12
    corners = np.concatenate([img[:c, :c].reshape(-1, 3), img[:c, -c:].reshape(-1, 3),
                              img[-c:, :c].reshape(-1, 3), img[-c:, -c:].reshape(-1, 3)])
    ground = np.median(corners, 0)
    ink = np.abs(img.astype(np.int16) - ground.astype(np.int16)).sum(-1) > 60
    ink[:, :8] = ink[:, -8:] = False  # a generated frame's edge columns are not a head
    ink[:6] = False
    rows = ink.mean(1) > 0.004
    side = int(0.19 * h)
    if not rows.any():
        top, cx = int(0.1 * h), w // 2
    else:
        top = int(np.argmax(rows))
        band = ink[top: top + side]
        cx = int(np.median(np.nonzero(band)[1])) if band.any() else w // 2
    y0 = max(0, top - int(0.015 * h))
    x0 = int(np.clip(cx - side // 2, 0, w - side))
    return x0, y0, x0 + side, min(h, y0 + side)


def strip(mp4: Path, marks: dict[int, str] | None = None, n: int = 13, th: int = 320) -> Path:
    """13 frames across the clip over a head-crop row, labelled by index.
    Written BESIDE the clip (never in a `_` dir) so the preview mirror serves it."""
    _, _, total = probe(mp4)
    idx = sorted({round(i * (total - 1) / (n - 1)) for i in range(n)} | set((marks or {}).keys()))
    frames = read_frames(mp4, idx=idx)
    h, w = frames.shape[1:3]
    tw = round(th * w / h)
    sheet = Image.new("RGB", (tw * len(idx), th + tw + 18), (12, 11, 10))
    d = ImageDraw.Draw(sheet)
    for k, (i, fr) in enumerate(zip(idx, frames)):
        sheet.paste(Image.fromarray(fr).resize((tw, th), Image.LANCZOS), (k * tw, 0))
        x0, y0, x1, y1 = head_box(fr)
        sheet.paste(Image.fromarray(fr[y0:y1, x0:x1]).resize((tw, tw), Image.LANCZOS), (k * tw, th))
        tag = f"f{i}" + (f" {marks[i]}" if marks and i in marks else "")
        d.text((k * tw + 4, th + tw + 3), tag, fill=(232, 196, 110) if marks and i in marks else (200, 196, 188))
    out = mp4.with_suffix(".strip.jpg")
    sheet.save(out, quality=88)
    return out


# ── the wave ──────────────────────────────────────────────────────────────────


def wave_dir(name: str) -> Path:
    if not re.match(r"^\d{8}-morph-v\d+-[a-z0-9-]+$", name):
        raise SystemExit(
            f"wave {name!r} must read <YYYYMMDD>-morph-v<N>-<a>-<b> — vN BEFORE the pair, "
            "or generate.py's `*-{era}-v*` glob takes it for an era's canonical wave"
        )
    return WAVES / name


def load_meta(w: Path) -> dict:
    p = w / "morph.json"
    if not p.exists():
        raise SystemExit(f"{p} is missing — run `morph.py prep` for this wave first (free)")
    return json.loads(p.read_text(encoding="utf-8"))


def prompts(a: str, b: str, ground: str) -> dict:
    pw = PAIR_WORDS.get((a, b))
    if not pw:
        raise SystemExit(f"no PAIR_WORDS for {a} -> {b}: look at both figures and author them first")
    sa, sb, light = SETTING[ground]

    def cap(s: str) -> str:
        return s[0].upper() + s[1:]

    # The author's own example is five SENTENCES, one per slot of the formula.
    flw = (f"FLW, {cap(pw['action_a'])} seamlessly transforms into {pw['action_b']}. "
           f"{cap(pw['subject_a'])} becomes {pw['subject_b']}. {cap(sa)} shifts to {sb}. "
           f"{cap(CAMERA)}. {cap(light)}.")
    plain = (f"{cap(pw['gesture'])}, and the change rides that one gesture: "
             f"{pw['subject_a']} becomes {pw['subject_b']}. Solid armour and cloth moving in real space; "
             f"one continuous figure, never two, the same face and beard throughout. "
             f"{cap(CAMERA)}. {cap(light)}.")
    zhuanchang = (f"Full-length locked-off shot. {cap(pw['subject_a'])}, standing in {sa}. "
                  f"{cap(pw['gesture'])}, and as his hand rises the armour folds flat into cloth: "
                  f"{pw['subject_b']}. Same face and beard throughout, one figure. zhuanchang")
    return {"flw": flw, "plain": plain, "zhuanchang": zhuanchang}


def cmd_prep(args) -> int:
    """Everything free: posters, both guides, the audio, the Comfy kits, evals.md."""
    w = wave_dir(args.wave)
    w.mkdir(parents=True, exist_ok=True)
    a, b = era_record(args.a), era_record(args.b)
    print(f"A {args.a}: {a['video']}\nB {args.b}: {b['video']}")

    # The two posters, flat on black at the probe size: the i2v inputs and the
    # references every delta is read against.
    flat_poster(pub(a["poster_alpha"])).save(w / "poster-a.png")
    flat_poster(pub(b["poster_alpha"])).save(w / "poster-b.png")

    raw_a = WAVES / RAW_CLIPS[args.a] if args.a in RAW_CLIPS else None
    raw_b = WAVES / RAW_CLIPS[args.b] if args.b in RAW_CLIPS else None
    audio_note = build_audio(raw_a, raw_b, w / "morph-audio.mp3")
    print(f"audio: {audio_note}")

    grounds = {}
    # Ground GOLD: the shipped mp4s themselves (the floor branch's opaque gold
    # on black). Shot A = A's first 25 frames REVERSED, so it arrives on A's
    # poster; shot B = B's first 25 forward, so it leaves from B's poster.
    ga = read_frames(pub(a["video"]), count=SHOT, size=SIZE)[::-1]
    gb = read_frames(pub(b["video"]), count=SHOT, size=SIZE)
    grounds["gold"] = (ga, gb, (0, 0, 0))
    # Ground COLOUR: the raw takes in full colour, each keyed off its own
    # ground and stood on COMMON_GROUND, so the model sees one backdrop.
    if raw_a and raw_b and raw_a.exists() and raw_b.exists():
        common = KEY_GROUNDS[COMMON_GROUND][0]
        ca = onto_ground(read_frames(raw_a, count=SHOT), args.a, common)[::-1]
        cb = onto_ground(read_frames(raw_b, count=SHOT), args.b, common)
        rs = lambda fr: np.stack([np.asarray(Image.fromarray(x).resize(SIZE, Image.LANCZOS)) for x in fr])  # noqa: E731
        grounds["colour"] = (rs(ca), rs(cb), common)
    else:
        print("! colour ground skipped: a raw take is missing from RAW_CLIPS / waves/")

    for g, (sa, sb, _) in grounds.items():
        grey = np.full((GAP, SIZE[1], SIZE[0], 3), GREY, np.uint8)
        guide = np.concatenate([sa, grey, sb])
        assert len(guide) == GUIDE
        write_video(guide, w / f"guide-{g}.mp4", audio=w / "morph-audio.mp3")
        write_video(sa, w / f"shot-a-{g}.mp4")
        write_video(sb, w / f"shot-b-{g}.mp4")
        Image.fromarray(sa[-1]).save(w / f"ref-a-{g}.png")
        Image.fromarray(sb[0]).save(w / f"ref-b-{g}.png")
        strip(w / f"guide-{g}.mp4", marks={A_ARRIVES: "A poster", B_LEAVES: "B poster"})
        comfy_kit(w, g, args.a, args.b)
        print(f"guide-{g}.mp4  {GUIDE} frames = {SHOT} A (reversed) + {GAP} grey + {SHOT} B")

    meta = {"a": args.a, "b": args.b, "size": SIZE, "fps": FPS, "seed": SEED,
            "a_record": a, "b_record": b, "raw_a": str(raw_a) if raw_a else None,
            "raw_b": str(raw_b) if raw_b else None, "grounds": list(grounds), "audio": audio_note,
            "prompts": {g: prompts(args.a, args.b, g) for g in grounds}}
    (w / "morph.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    ev = w / "evals.md"
    if not ev.exists():
        ev.write_text(EVALS_TEMPLATE.format(wave=args.wave, a=args.a, b=args.b), encoding="utf-8")
    print(f"\nprepped {w}")
    return 0


# ── the Comfy Cloud kit ───────────────────────────────────────────────────────


def comfy_kit(w: Path, ground: str, a: str, b: str) -> Path:
    """The shipped FLW graph, patched to this pair. ⚠ ONLY WHAT THE PROBE NEEDS
    MOVES: the two shots, the audio, the prompt, a FIXED seed, the output name
    and the resize width. Models, sampler (8 steps, cfg 1, euler_ancestral_cfg_pp,
    linear_quadratic), the guide node (97 frames, grey 0.5) and LTXVAddGuide
    (frame 0, strength 1) stay the author's, so a failure is the pair's and not
    a mis-set graph. The Gemini prompt writer is MUTED and its link to the text
    encoder cut — a paid partner node that writes a prompt we author by hand."""
    kit = w / f"comfy-{ground}"
    kit.mkdir(exist_ok=True)
    orig = kit / "SYSTMS_FLW_LTX23_WF.original.json"
    if not orig.exists():
        with urllib.request.urlopen(FLW_WORKFLOW, timeout=60) as r:
            orig.write_bytes(r.read())
    wf = json.loads(orig.read_text(encoding="utf-8"))
    nodes = {n["id"]: n for n in wf["nodes"]}
    prompt = prompts(a, b, ground)["flw"]
    shot_a, shot_b, audio = f"morph-shot-a-{ground}.mp4", f"morph-shot-b-{ground}.mp4", "morph-audio.mp3"

    def load_video(nid: int, name: str) -> None:
        wv = nodes[nid]["widgets_values"]
        wv.update(video=name, skip_first_frames=0, frame_load_cap=SHOT, force_rate=0)
        if isinstance(wv.get("videopreview"), dict):
            wv["videopreview"].setdefault("params", {})["filename"] = name

    expect = {69: "VHS_LoadVideo", 70: "VHS_LoadVideo", 8: "CLIPTextEncode", 18: "RandomNoise",
              81: "ImageResizeKJv2", 96: "LoadAudio", 26: "VHS_VideoCombine", 61: "GeminiNode", 80: "JoinStrings"}
    for nid, typ in expect.items():
        if nodes.get(nid, {}).get("type") != typ:
            raise SystemExit(f"FLW workflow changed upstream: node {nid} is not {typ} — re-read it before patching")

    load_video(69, shot_a)
    load_video(70, shot_b)
    nodes[81]["widgets_values"][0:2] = [SIZE[0], 0]  # width 576, height from aspect -> 1024
    nodes[96]["widgets_values"][0] = audio
    nodes[18]["widgets_values"] = [SEED, "fixed"]
    nodes[26]["widgets_values"]["filename_prefix"] = f"morph-{a}-{b}-{ground}"
    # The prompt: cut Gemini's string out of the encoder and letter ours.
    nodes[8]["widgets_values"] = [prompt]
    dead = None
    for inp in nodes[8].get("inputs", []):
        if inp.get("name") == "text":
            dead = inp.get("link")
            inp["link"] = None
    wf["links"] = [l for l in wf["links"] if l[0] != dead]
    for o in nodes[80].get("outputs", []):
        o["links"] = [x for x in (o.get("links") or []) if x != dead]
    for nid in (61, 63, 80, 86):  # Gemini, its video feed, the join, the "FLW," primitive
        if nid in nodes:
            nodes[nid]["mode"] = 2  # never execute
    (kit / "SYSTMS_FLW_LTX23_WF.morph.json").write_text(json.dumps(wf, indent=2), encoding="utf-8")
    shutil.copyfile(w / f"shot-a-{ground}.mp4", kit / shot_a)
    shutil.copyfile(w / f"shot-b-{ground}.mp4", kit / shot_b)
    shutil.copyfile(w / "morph-audio.mp3", kit / audio)
    (kit / "prompt.txt").write_text(prompt + "\n", encoding="utf-8")
    (kit / "README.md").write_text(COMFY_README.format(ground=ground, a=a, b=b, seed=SEED, shot_a=shot_a,
                                                       shot_b=shot_b, audio=audio, wave=w.name), encoding="utf-8")
    return kit


COMFY_README = """# FLW on Comfy Cloud — {a} -> {b}, ground `{ground}`

The SYSTMS FLW transition LoRA run AS ITS AUTHOR SHIPPED IT: a 97-frame guide of
shot A + 47 grey frames + shot B through `LTXVAddGuide`, on the LTX-2.3 22B dev
transformer + the distilled LoRA at 0.5, 8 steps, cfg 1. Only the inputs, the
prompt and the seed ({seed}, fixed) are ours.

1. Open https://comfy.org/workflows/5b94a8f404fa-5b94a8f404fa/ and press
   "Try on Comfy Cloud" (the account is yours to create; the free tier covers
   about ten runs of this graph).
2. Replace the canvas with `SYSTMS_FLW_LTX23_WF.morph.json` from this folder
   (drag it onto the canvas).
3. Upload `{shot_a}` into SHOT A, `{shot_b}` into SHOT B and `{audio}` into
   Load Audio (each node's upload button). The names must stay as they are.
4. Queue. One run is one clip of 97 frames at 576x1024.
5. Download the result and bring it back:

   python scripts/voidwalker-avatar/morph.py ingest --wave {wave} --ground {ground} --file <downloaded.mp4>

   That writes the strip and the two hand-over deltas (frame 24 against A's
   poster, frame 72 against B's), and whether frames 0-24 kept shot A.

The prompt is in `prompt.txt`; the Gemini node is muted and cut, so nothing is
spent on a partner API.
"""

EVALS_TEMPLATE = """# {wave}

{a} -> {b}. What each clip answers, and his read of it. The strips sit beside
the clips (`*.strip.jpg`); gold labels mark the two posters.

| clip | lane | answers | end deltas (/255) | read |
| --- | --- | --- | --- | --- |
| 1a | fal i2v, no LoRA | does LTX-2.3 hold the gold figure and his face when it moves at all ({a}) | | |
| 1b | fal i2v, no LoRA | the same on the cel-drawn era ({b}) | | |
| 2a | fal first/last, no LoRA | the 09-07 baseline on the right base, with a gesture and no dissolve words | | |
| 2b | fal first/last + zhuanchang | the one LoRA trained for first/last-frame transitions | | |
| 2c | fal first/last + FLW | FLW off-design (no guide) — the control | | |
| 3 | fal reference + FLW | does fal read our guide in context? frames 0-24 must keep shot A | | |
| comfy-gold | Comfy Cloud, FLW as shipped | the LoRA as designed, on the delivered gold | | |
| comfy-colour | Comfy Cloud, FLW as shipped | the same on the colour takes, graded afterwards | | |

Hand-over bar: U42's glitch lands at 2.05 / 3.46 per 255.
"""


# ── fal ───────────────────────────────────────────────────────────────────────


def data_uri(path: Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    if path.suffix == ".mp3":
        mime = "audio/mpeg"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


#: ⚠ A NAMED USER AGENT ON EVERY CALL. Replicate's Cloudflare front answers
#: Python's default `Python-urllib/3.x` with `error code: 1010` (a 403 that reads
#: like a rejected key, measured 2026-10-01); fal took the default on 09-07, but
#: a fronting rule is not ours to rely on.
UA = "thoughtform-morph-probe/1.0"


def _req(url: str, payload: dict | None = None) -> dict:
    body = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=body, method="POST" if body else "GET", headers={
        "Authorization": f"Key {require('FAL_API_KEY')}", "User-Agent": UA,
        "Content-Type": "application/json", "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"fal HTTP {e.code} on {url}\n{e.read().decode(errors='ignore')[:900]}")


def estimate(payload: dict) -> float:
    vs = payload.get("video_size") or {}
    wpx, hpx = (vs.get("width"), vs.get("height")) if isinstance(vs, dict) else SIZE
    return round((wpx or SIZE[0]) * (hpx or SIZE[1]) * payload.get("num_frames", GUIDE) / 1e6 * USD_PER_MP_FRAME, 3)


def build_run(run: str, w: Path, meta: dict, ground: str = "gold") -> tuple[str, dict, dict]:
    """(endpoint, payload, sidecar extras) for one named run.

    ⚠ `ground` CHANGES THE PICTURE THE MODEL STARTS FROM, NOT JUST A LABEL. Wave
    v1 (2026-10-01) ran every clip on the gold posters and the model RE-LIT the
    figure in five of six — dips to black, a silver pass, a cream repaint, a
    grey studio — which is U31's finding one stage later: a model draws a man in
    colour and the gold is ours to add (`gold.py`). `colour` starts from the two
    raw takes keyed onto one magenta ground (`ref-*-colour.png`, the guide's own
    frames 24 and 72), so the clip can be graded like an idle afterwards.
    """
    a, b = meta["a"], meta["b"]
    p = meta["prompts"][ground]
    common = {
        "video_size": {"width": SIZE[0], "height": SIZE[1]},
        "num_frames": GUIDE, "fps": FPS, "seed": SEED,
        "enable_prompt_expansion": False, "generate_audio": False,
        "video_output_type": "X264 (.mp4)", "video_quality": "high",
    }
    if ground == "gold":
        pa, pb = w / "poster-a.png", w / "poster-b.png"
    else:
        pa, pb = w / f"ref-a-{ground}.png", w / f"ref-b-{ground}.png"
    if run in ("1a", "1b") and ground != "gold":
        raise SystemExit("1a/1b are the gold idles (their words describe a hologram on black); run them on gold")
    if run in ("1a", "1b"):
        era, still = (a, pa) if run == "1a" else (b, pb)
        words = ERA_WORDS.get(era, {}).get("idle")
        if not words:
            raise SystemExit(f"no ERA_WORDS idle for {era}")
        payload = {**common, "prompt": words, "image_url": data_uri(still), "loras": [],
                   "negative_prompt": NEG_IDLE}
        return EP_I2V, payload, {"kind": "i2v", "start": str(still)}
    if run in ("2a", "2b", "2c"):
        lora = {"2a": None, "2b": "zhuanchang", "2c": "flw"}[run]
        prompt = {"2a": p["plain"], "2b": p["zhuanchang"], "2c": p["flw"]}[run]
        payload = {**common, "prompt": prompt, "image_url": data_uri(pa), "end_image_url": data_uri(pb),
                   "image_strength": 1.0, "end_image_strength": 1.0, "interpolation_direction": "forward",
                   "loras": [{"path": LORAS[lora], "scale": 1.0}] if lora else [],
                   # FLW's own graph runs an EMPTY negative; the others name the dissolve.
                   "negative_prompt": "" if lora == "flw" else NEG_MORPH}
        if lora == "zhuanchang":
            payload["video_cfg_scale"] = 4.0  # the LoRA card's setting
        return EP_I2V, payload, {"kind": "first-last", "start": str(pa), "end": str(pb), "lora": lora}
    if run == "3":
        guide = w / f"guide-{ground}.mp4"
        if not guide.exists():
            raise SystemExit(f"{guide} is missing — run `morph.py prep` first")
        payload = {**common, "prompt": p["flw"], "video_url": data_uri(guide),
                   "audio_url": data_uri(w / "morph-audio.mp3"), "audio_strength": 1.0,
                   "video_strength": 1.0, "ic_lora_type": "none", "preprocessor": "none",
                   "match_video_length": True, "match_input_fps": True,
                   # The LoRA's author: artifacts without input audio, so the audio branch runs.
                   "generate_audio": True,
                   "loras": [{"path": LORAS["flw"], "scale": 1.0}], "negative_prompt": ""}
        return EP_REF, payload, {"kind": "guide", "guide": str(guide), "ground": ground}
    raise SystemExit(f"unknown run {run!r} (1a 1b 2a 2b 2c 3, or all)")


def redact(payload: dict) -> dict:
    return {k: ("<data-uri>" if isinstance(v, str) and v.startswith("data:") else v) for k, v in payload.items()}


def report(out: Path, extra: dict, w: Path) -> dict:
    """The strip and the hand-over deltas for one finished clip."""
    kind = extra.get("kind")
    _, _, total = probe(out)
    res: dict = {"frames": total}
    if kind == "guide":
        ground = extra.get("ground", "gold")
        scale = (total - 1) / (GUIDE - 1)
        ia, ib = round(A_ARRIVES * scale), round(B_LEAVES * scale)
        fr = read_frames(out, idx=list(range(0, ia + 1)) + [ib])
        guide = read_frames(w / f"guide-{ground}.mp4", count=SHOT)
        ra = np.asarray(Image.open(w / f"ref-a-{ground}.png").convert("RGB"))
        rb = np.asarray(Image.open(w / f"ref-b-{ground}.png").convert("RGB"))
        res.update(at_a=ia, at_b=ib, a_poster=round(mad(fr[ia], ra), 2), b_poster=round(mad(fr[-1], rb), 2),
                   shot_a_kept=round(float(np.mean([mad(fr[i], guide[round(i / scale)]) for i in range(ia + 1)])), 2))
        strip(out, marks={ia: "A poster", ib: "B poster"})
    else:
        fr = read_frames(out, idx=[0, total - 1])
        # The frames the clip was ASKED to start and end on, whichever ground.
        ra = np.asarray(Image.open(extra.get("start") or (w / "poster-a.png")).convert("RGB"))
        rb = np.asarray(Image.open(extra.get("end") or (w / "poster-b.png")).convert("RGB"))
        if kind == "i2v":
            res.update(first=round(mad(fr[0], ra), 2))
        else:
            res.update(a_poster=round(mad(fr[0], ra), 2), b_poster=round(mad(fr[-1], rb), 2))
        strip(out)
    bar_a, bar_b = HANDOVER_BAR
    line = "  ".join(f"{k} {v}" for k, v in res.items())
    print(f"  {out.name}: {line}   (glitch hand-over {bar_a} / {bar_b})")
    return res


def cmd_run(args) -> int:
    w = wave_dir(args.wave)
    meta = load_meta(w)
    runs = ["1a", "1b", "2a", "2b", "2c", "3"] if args.run == "all" else args.run.split(",")
    if args.ground not in meta.get("grounds", ["gold"]):
        raise SystemExit(f"ground {args.ground!r} was not prepped for this wave ({meta.get('grounds')})")
    if args.ground != "gold" and args.run == "all":
        runs = ["2a", "2b", "2c", "3"]  # the idles are gold-only
    plan = [(r, *build_run(r, w, meta, args.ground)) for r in runs]
    total = sum(estimate(p) for _, _, p, _ in plan)
    for r, ep, p, _ in plan:
        print(f"\n== {r}  {ep}  est ${estimate(p):.3f}")
        if args.dry_run:
            print(json.dumps(redact(p), indent=2))
    print(f"\nestimated total ${total:.2f} (cap ${args.max_usd:.2f}) - an estimate; fal's dashboard is the bill")
    if args.dry_run:
        return 0
    if total > args.max_usd:
        raise SystemExit(f"estimate ${total:.2f} is over --max-usd {args.max_usd}; nothing sent")
    require("FAL_API_KEY")  # stops here, before any submit, if the key is absent

    manifest = w / "MANIFEST.jsonl"
    for r, ep, payload, extra in plan:
        # Gold keeps wave v1's names; another ground is suffixed so it can never
        # answer as (or overwrite) the gold take of the same run.
        out = w / (f"{r}.mp4" if args.ground == "gold" else f"{r}-{args.ground}.mp4")
        side = out.with_suffix(".json")
        if out.exists():
            print(f"{out.name} already on disk — kept (delete it to re-draw)")
            continue
        if side.exists() and args.resume:
            rec = json.loads(side.read_text(encoding="utf-8"))
        else:
            if side.exists():
                raise SystemExit(f"{side.name} exists without its mp4: pass --resume, or delete it to re-submit")
            q = _req(f"{QUEUE}/{ep}", payload)
            rec = {"run": r, "endpoint": ep, "request_id": q.get("request_id"),
                   # ⚠ THE RETURNED URLS, NEVER RECONSTRUCTED: the queue drops the
                   # endpoint's sub-path, and a rebuilt URL 405s on a live job (09-07).
                   "status_url": q.get("status_url"), "response_url": q.get("response_url"),
                   "submitted_at": time.strftime("%Y-%m-%dT%H:%M:%S"), "payload": redact(payload),
                   "estimated_cost_usd": estimate(payload), "pair": [meta["a"], meta["b"]], **extra}
            if not rec["request_id"]:
                raise SystemExit(f"fal returned no request_id: {json.dumps(q)[:600]}")
            side.write_text(json.dumps(rec, indent=2), encoding="utf-8")  # BEFORE the first poll
            print(f"{r}: submitted {rec['request_id']}")
        waited, last = 0, ""
        while True:
            st = _req(rec["status_url"])
            if st.get("status") != last:
                print(f"  {r}: {st.get('status')}")
                last = st.get("status")
            if last == "COMPLETED":
                break
            if last in ("FAILED", "ERROR", "CANCELLED"):
                raise SystemExit(f"{r}: fal job {last}: {json.dumps(st)[:600]}")
            time.sleep(5)
            waited += 5
            if waited > 40 * 60:
                raise SystemExit(f"{r}: still queued after 40 min — `--resume` later")
        res = _req(rec["response_url"])
        url = ((res or {}).get("video") or {}).get("url")
        if not url:
            raise SystemExit(f"{r}: no video in the result: {json.dumps(res)[:600]}")
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=600) as fh:
            out.write_bytes(fh.read())
        rec.update(video_url=url, seed_returned=res.get("seed"), bytes=out.stat().st_size,
                   completed_at=time.strftime("%Y-%m-%dT%H:%M:%S"))
        rec["measured"] = report(out, rec, w)
        side.write_text(json.dumps(rec, indent=2), encoding="utf-8")
        with manifest.open("a", encoding="utf-8") as m:
            m.write(json.dumps({k: rec[k] for k in ("run", "endpoint", "request_id", "estimated_cost_usd",
                                                    "measured", "completed_at")}) + "\n")
    return 0


def cmd_ingest(args) -> int:
    w = wave_dir(args.wave)
    meta = load_meta(w)
    src = Path(args.file)
    n = 1
    while (w / f"comfy-{args.ground}-{n:02d}.mp4").exists():
        n += 1
    out = w / f"comfy-{args.ground}-{n:02d}.mp4"
    shutil.copyfile(src, out)
    rec = {"run": out.stem, "lane": "comfy-cloud", "workflow": f"comfy-{args.ground}/SYSTMS_FLW_LTX23_WF.morph.json",
           "seed": SEED, "prompt": meta["prompts"][args.ground]["flw"], "source_file": str(src),
           "kind": "guide", "ground": args.ground, "ingested_at": time.strftime("%Y-%m-%dT%H:%M:%S")}
    rec["measured"] = report(out, rec, w)
    out.with_suffix(".json").write_text(json.dumps(rec, indent=2), encoding="utf-8")
    with (w / "MANIFEST.jsonl").open("a", encoding="utf-8") as m:
        m.write(json.dumps({k: rec[k] for k in ("run", "lane", "measured", "ingested_at")}) + "\n")
    return 0


def cmd_check(_args) -> int:
    """Names, lengths and one FREE authenticated call — never a value.

    The probe asks the queue for the status of a request id that cannot exist:
    a 401/403 means the key was refused, anything else means fal read it and
    answered about the (absent) job. Nothing is generated and nothing is billed.
    """
    print(f"env: {env_path()}")
    print(describe(["FAL_API_KEY"]))
    for tool in ("ffmpeg", "ffprobe"):
        print(f"  {tool:28} {'present' if shutil.which(tool) else 'MISSING'}")
    url = f"{QUEUE}/fal-ai/ltx-2.3-22b/requests/{'0' * 8}-{'0' * 4}-{'0' * 4}-{'0' * 4}-{'0' * 12}/status"
    req = urllib.request.Request(url, headers={"Authorization": f"Key {require('FAL_API_KEY')}", "User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            code = r.status
    except urllib.error.HTTPError as e:
        code = e.code
    if code in (401, 403):
        print(f"  fal auth                     REFUSED (HTTP {code}) - the key did not authenticate")
        return 2
    print(f"  fal auth                     accepted (HTTP {code} on a request id that does not exist)")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("check")
    p = sub.add_parser("prep")
    p.add_argument("--a", required=True)
    p.add_argument("--b", required=True)
    p.add_argument("--wave", required=True)
    r = sub.add_parser("run")
    r.add_argument("--wave", required=True)
    r.add_argument("--run", default="all", help="1a,1b,2a,2b,2c,3 or all")
    r.add_argument("--dry-run", action="store_true")
    r.add_argument("--resume", action="store_true")
    r.add_argument("--max-usd", type=float, default=3.0)
    r.add_argument("--ground", choices=("gold", "colour"), default="gold",
                   help="gold = the shipped posters; colour = the raw takes on one magenta ground")
    i = sub.add_parser("ingest")
    i.add_argument("--wave", required=True)
    i.add_argument("--ground", choices=("gold", "colour"), required=True)
    i.add_argument("--file", required=True)
    s = sub.add_parser("strip")
    s.add_argument("clip")
    args = ap.parse_args()
    if args.cmd == "strip":
        print(strip(Path(args.clip)))
        return 0
    return {"check": cmd_check, "prep": cmd_prep, "run": cmd_run, "ingest": cmd_ingest}[args.cmd](args)


if __name__ == "__main__":
    raise SystemExit(main())
