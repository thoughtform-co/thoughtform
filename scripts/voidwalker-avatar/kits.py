"""
kits — the SYSTMS effects, made ready to run in ComfyUI on any footage.

The owner's first milestone (2026-10-01): "before we dive into the Expanse, I
just want to make sure I can replicate the effects … if I can run these things
in ComfyUI … we can wire up any image we want, any style we want." So this
builds two kinds of kit from ANY two clips — none of it is tied to an era:

  flw        the SYSTMS FLW transition (LTX-2.3 + the FLW IC-LoRA): two
             25-frame shots, the audio the LoRA wants, the author's graph
             patched to them (`morph.patch_flw_ui`) and a prompt on the
             author's formula. Runs on Comfy Cloud, drag-and-drop, free tier.
  timeslice  the SYSTMS TimeSlice slit-scan (model-free): clip A then clip B
             through `TimeSliceEffect`, so the cut sweeps across the frame
             band by band, each band at its own moment in time. An API-format
             graph built in code (`graph.py`), plus — because the node is
             pure tensor arithmetic — a LOCAL preview from the node's own code,
             free, before a Comfy run is spent on it.

⚠ FLW WANTS MOTION AT THE SEAM. Its demos are shots in motion (a rally car
becoming a hoverbike) and the author's tip is to line up "direction of travel,
subject trajectory, prominent colors". The era idles stand still, which is the
likeliest reason wave v1 cut rather than flowed. A kit's shot A is therefore
the 25 frames LEADING INTO the seam (moving at its end) and shot B the 25
LEAVING it (moving at its start); `scan` finds the moving beat of a clip.

⚠ TIMESLICE DUAL CANNOT TRAVEL A -> B ON ITS OWN. Its `mix` (the A/B balance)
is not among the parameters its `animate` flag interpolates (slices, offsets,
angle only — read in the pack's `nodes.py`). The transition is the Effect node
over A++B instead; Dual stays a split-reality look.

⚠ CLOUD INPUT NAMES ARE CONTENT HASHES. Uploading through a node's button in
the editor renames the node's input for you; uploading by API returns the
name to use (`comfy.py` handles it). Never hand-type a kit's local filename
into a cloud graph.

Usage:
  python scripts/voidwalker-avatar/kits.py scan <clip.mp4> [<clip.mp4> ...]
  python scripts/voidwalker-avatar/kits.py flw --a <clip> --a-from 52 --b <clip> --b-from 84 \\
         --name genai-to-expanse --prompt-file <prompt.txt>
  python scripts/voidwalker-avatar/kits.py timeslice --a <clip> --b <clip> --name <n> \\
         [--a-from 0 --b-from 0 --frames 48 --b-reverse] [--slices 14 --offset 2 --angle 90 --blend 0] \\
         [--torch-python <python with torch> --node-pack <TimeSlice-Nodes dir>]
  python scripts/voidwalker-avatar/kits.py ingest --kit <kit dir> --file <downloaded.mp4>
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import textwrap
import time
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import morph  # noqa: E402
from graph import Graph, Ref  # noqa: E402

KITS = HERE / "waves" / "_kits"
FPS, SIZE, SHOT, GUIDE, GREY = morph.FPS, morph.SIZE, morph.SHOT, morph.GUIDE, morph.GREY


def resize_stack(frames: np.ndarray, size: tuple[int, int] = SIZE) -> np.ndarray:
    if frames.shape[2] == size[0] and frames.shape[1] == size[1]:
        return frames
    return np.stack([np.asarray(Image.fromarray(f).resize(size, Image.LANCZOS)) for f in frames])


def motion(clip: Path) -> np.ndarray:
    """Adjacent-frame MAD per frame (/255) at a small size — the beat finder."""
    fr = morph.read_frames(clip, size=(144, 256)).astype(np.float32)
    return np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2, 3))


def cmd_scan(args) -> int:
    for c in args.clips:
        p = Path(c)
        m = motion(p)
        win = np.array([m[i:i + SHOT - 1].mean() for i in range(len(m) - SHOT + 2)])
        best = int(win.argmax())
        per8 = " ".join(f"{m[i:i + 8].mean():.1f}" for i in range(0, len(m), 8))
        print(f"{p.name}: {len(m) + 1} frames, median {np.median(m):.2f}")
        print(f"  per 8 frames: {per8}")
        print(f"  most-moving {SHOT}-frame window starts at f{best} (mean {win[best]:.2f})")
    return 0


def audio_pair(a: Path, a_start: float, b: Path, b_start: float, out: Path) -> str:
    """The guide's soundtrack, `GUIDE` frames long: A's sound in time with shot A
    for the first half, B's in time with shot B for the second. Silence where a
    clip has none — said, not hidden."""
    total = GUIDE / FPS
    half = (SHOT + (GUIDE - 2 * SHOT) // 2) / FPS          # 2.0 s: mid-gap
    b_at = (GUIDE - SHOT) / FPS                            # shot B starts at 3.0 s
    segs = [(a, a_start, half, "out"), (b, max(0.0, b_start - (b_at - half)), total - half, "in")]
    fmt = "aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo"
    src, parts, note = [], [], []
    for i, (clip, start, dur, fade) in enumerate(segs):
        if morph.has_audio(clip):
            src += ["-i", str(clip)]
            f = f"afade=t=out:st={dur - 0.08:.3f}:d=0.08" if fade == "out" else "afade=t=in:d=0.08"
            parts.append(f"[{i}:a]atrim={start:.4f}:{start + dur:.4f},asetpts=PTS-STARTPTS,{fmt},{f}[p{i}]")
            note.append(f"{clip.name}@{start:.2f}s")
        else:
            src += ["-f", "lavfi", "-t", f"{dur:.4f}", "-i", "anullsrc=r=48000:cl=stereo"]
            parts.append(f"[{i}:a]asetpts=PTS-STARTPTS,{fmt}[p{i}]")
            note.append("silence")
    graph = ";".join(parts) + f";[p0][p1]concat=n=2:v=0:a=1,apad,atrim=0:{total:.4f}[o]"
    subprocess.run(["ffmpeg", "-v", "error", "-y", *src, "-filter_complex", graph, "-map", "[o]",
                    "-c:a", "libmp3lame", "-q:a", "3", str(out)], check=True)
    return " + ".join(note)


# ── FLW ────────────────────────────────────────────────────────────────────


FLW_README = """# FLW kit `{name}` — the SYSTMS transition, on Comfy Cloud

Shot A: `{a}` frames {a0}-{a1} (moving INTO the seam). Shot B: `{b}` frames
{b0}-{b1} (moving OUT of it). {gap} grey frames between them are what the FLW
LoRA fills. `guide-preview.strip.jpg` shows exactly what the model is given.

1. Open https://comfy.org/workflows/5b94a8f404fa-5b94a8f404fa/ and press
   "Try on Comfy Cloud" (free tier: five runs, no card).
2. Drag `SYSTMS_FLW_LTX23_WF.morph.json` from this folder onto the canvas.
3. In the node titled SHOT A press the upload button and pick `{shot_a}`; in
   SHOT B pick `{shot_b}`; in Load Audio pick `{audio}`. (Cloud renames each
   upload to a content hash and fills the node for you.)
4. Check two things before queueing: the LoRA loader shows
   `SYSTMS_FLW_V1_LTX23.safetensors` (the library's name; patched in), and no
   node is outlined red. Then Queue. One run is {total} frames at {w}x{h}.
5. While the graph is open: File -> Export (API) once, and save it as
   `scripts/voidwalker-avatar/SYSTMS_FLW_LTX23_WF.api.json`. That file is the
   seed the scripted lane (`comfy.py`, `morph.py run --host`) submits; it only
   needs exporting once.
6. Download the output and bring it back:

   python scripts/voidwalker-avatar/kits.py ingest --kit "{kit}" --file <downloaded.mp4>

The prompt (`prompt.txt`) follows the author's formula; the Gemini prompt node
is muted and cut, so nothing is spent on a partner API. Seed {seed}, fixed.
"""


def cmd_flw(args) -> int:
    a, b = Path(args.a), Path(args.b)
    kit = KITS / f"flw-{args.name}"
    kit.mkdir(parents=True, exist_ok=True)
    prompt = (Path(args.prompt_file).read_text(encoding="utf-8") if args.prompt_file else args.prompt or "").strip()
    if not prompt.startswith("FLW"):
        raise SystemExit("the prompt must start with the trigger `FLW,` (the author's formula)")
    sa = resize_stack(morph.read_frames(a, first=args.a_from, count=SHOT))
    sb = resize_stack(morph.read_frames(b, first=args.b_from, count=SHOT))
    if len(sa) != SHOT or len(sb) != SHOT:
        raise SystemExit(f"a shot came back short ({len(sa)}, {len(sb)} frames): pick an earlier --*-from")
    shot_a, shot_b, audio = "flw-shot-a.mp4", "flw-shot-b.mp4", "flw-audio.mp3"
    morph.write_video(sa, kit / shot_a)
    morph.write_video(sb, kit / shot_b)
    note = audio_pair(a, args.a_from / FPS, b, args.b_from / FPS, kit / audio)
    grey = np.full((GUIDE - 2 * SHOT, SIZE[1], SIZE[0], 3), GREY, np.uint8)
    morph.write_video(np.concatenate([sa, grey, sb]), kit / "guide-preview.mp4", audio=kit / audio)
    morph.strip(kit / "guide-preview.mp4", marks={SHOT - 1: "A ends", GUIDE - SHOT: "B starts"})
    wf = morph.patch_flw_ui(morph.flw_original(kit), shot_a=shot_a, shot_b=shot_b, audio=audio, prompt=prompt,
                            seed=args.seed, prefix=f"flw-{args.name}")
    (kit / "SYSTMS_FLW_LTX23_WF.morph.json").write_text(json.dumps(wf, indent=2), encoding="utf-8")
    (kit / "prompt.txt").write_text(prompt + "\n", encoding="utf-8")
    (kit / "kit.json").write_text(json.dumps({
        "kind": "flw", "name": args.name, "a": str(a), "a_from": args.a_from, "b": str(b), "b_from": args.b_from,
        "frames_per_shot": SHOT, "total": GUIDE, "size": SIZE, "seed": args.seed, "audio": note, "prompt": prompt,
        "built_at": time.strftime("%Y-%m-%dT%H:%M:%S")}, indent=2), encoding="utf-8")
    (kit / "README.md").write_text(FLW_README.format(
        name=args.name, a=a.name, a0=args.a_from, a1=args.a_from + SHOT - 1, b=b.name, b0=args.b_from,
        b1=args.b_from + SHOT - 1, gap=GUIDE - 2 * SHOT, shot_a=shot_a, shot_b=shot_b, audio=audio, total=GUIDE,
        w=SIZE[0], h=SIZE[1], kit=kit, seed=args.seed), encoding="utf-8")
    print(f"kit: {kit}\n  audio: {note}")
    return 0


# ── TimeSlice ──────────────────────────────────────────────────────────────


def timeslice_graph(clip_a: str, clip_b: str, frames_a: int, frames_b: int, *, slices: int, offset: int,
                    angle: float, blend: int, direction: str, spacing: str, cascade: str, prefix: str) -> Graph:
    """A then B, through TimeSliceEffect: the cut sweeps across the frame band by
    band. Input names are the TimeSlice pack's own (`nodes.py`, 2026-10-01); the
    VHS widget names are the ones the SYSTMS graph's own VHS nodes carry."""
    g = Graph()
    load = dict(force_rate=0, custom_width=0, custom_height=0, skip_first_frames=0, select_every_nth=1, format="None")
    va = g.add("VHS_LoadVideo", _title="CLIP A", video=clip_a, frame_load_cap=frames_a, **load)
    vb = g.add("VHS_LoadVideo", _title="CLIP B", video=clip_b, frame_load_cap=frames_b, **load)
    ab = g.add("ImageBatch", _title="A then B", image1=va, image2=vb)
    ts = g.add("TimeSliceEffect", _title="TIMESLICE", images=ab, num_slices=slices, offset=offset, angle=float(angle),
               spacing=spacing, direction=direction, loop_mode="trim", blend_width=blend, seed=0,
               cascade_curve=cascade, slice_jitter=0, animate=False)
    g.add("VHS_VideoCombine", _title="SAVE", images=Ref(ts.node, 0), frame_rate=FPS, loop_count=0,
          filename_prefix=prefix, format="video/h264-mp4", pix_fmt="yuv420p", crf=16, save_metadata=True,
          trim_to_audio=False, pingpong=False, save_output=True)
    return g


TS_RUNNER = textwrap.dedent("""
    import sys, json, numpy as np, torch
    sys.path.insert(0, sys.argv[1])
    from nodes import TimeSliceEffect, NODE_CLASS_MAPPINGS
    src, dst, params = sys.argv[2], sys.argv[3], json.loads(sys.argv[4])
    if params.pop("_dump_schema", False):
        info = {k: {"input": v.INPUT_TYPES(), "output": list(v.RETURN_TYPES)} for k, v in NODE_CLASS_MAPPINGS.items()}
        print(json.dumps(info)); raise SystemExit
    x = torch.from_numpy(np.load(src).astype(np.float32) / 255.0)
    out = TimeSliceEffect().apply_time_slice(x, **params)[0]
    np.save(dst, (out.clamp(0, 1).numpy() * 255 + 0.5).astype(np.uint8))
""")


def ts_run(torch_python: Path, node_pack: Path, frames: np.ndarray, params: dict, work: Path) -> np.ndarray:
    src, dst, runner = work / "_ts_in.npy", work / "_ts_out.npy", work / "_ts_runner.py"
    np.save(src, frames)
    runner.write_text(TS_RUNNER, encoding="utf-8")
    subprocess.run([str(torch_python), str(runner), str(node_pack), str(src), str(dst), json.dumps(params)], check=True)
    out = np.load(dst)
    for p in (src, dst, runner):
        p.unlink(missing_ok=True)
    return out


def ts_schema(torch_python: Path, node_pack: Path, work: Path) -> dict:
    runner = work / "_ts_runner.py"
    runner.write_text(TS_RUNNER, encoding="utf-8")
    out = subprocess.run([str(torch_python), str(runner), str(node_pack), "-", "-", json.dumps({"_dump_schema": True})],
                         check=True, capture_output=True, text=True).stdout
    runner.unlink(missing_ok=True)
    return json.loads(out)


TS_README = """# TimeSlice kit `{name}` — the SYSTMS slit-scan transition, on Comfy Cloud

Clip A (`{a}`, {fa} frames) then clip B (`{b}`, {fb} frames{brev}) through
`TimeSliceEffect`: {slices} bands at {angle} degrees, each {offset} frame(s) later
than the last, so the cut from A to B sweeps across the frame over about
{sweep} frames. `loop_mode trim` drops the frames the offsets cannot fill.
{preview}
1. On Comfy Cloud (any open canvas), drag `timeslice.api.json` from this folder
   onto it. TimeSlice Nodes and VideoHelperSuite are preinstalled there.
2. Upload `{clip_a}` into CLIP A and `{clip_b}` into CLIP B (each node's upload
   button), then Queue. No model is loaded: this is arithmetic on frames.
3. Bring the output back:

   python scripts/voidwalker-avatar/kits.py ingest --kit "{kit}" --file <downloaded.mp4>

Every knob is on the TIMESLICE node: `num_slices`, `offset` (frames per band;
negative runs time backwards), `angle` (0 vertical bands, 90 horizontal),
`direction` (forward, reverse, center_out, edges_in), `blend_width` (soft
band edges, px), `cascade_curve`, `spacing`.
"""


def cmd_timeslice(args) -> int:
    a, b = Path(args.a), Path(args.b)
    kit = KITS / f"timeslice-{args.name}"
    kit.mkdir(parents=True, exist_ok=True)
    fa = resize_stack(morph.read_frames(a, first=args.a_from, count=args.frames))
    fb = resize_stack(morph.read_frames(b, first=args.b_from, count=args.frames))
    if args.b_reverse:
        fb = fb[::-1]  # so the batch ENDS on B's first frame (its poster, for an era idle)
    clip_a, clip_b = "ts-clip-a.mp4", "ts-clip-b.mp4"
    morph.write_video(fa, kit / clip_a)
    morph.write_video(fb, kit / clip_b)
    params = dict(num_slices=args.slices, offset=args.offset, angle=float(args.angle), spacing=args.spacing,
                  direction=args.direction, loop_mode="trim", blend_width=args.blend, seed=0,
                  cascade_curve=args.cascade, slice_jitter=0, animate=False)
    g = timeslice_graph(clip_a, clip_b, len(fa), len(fb), slices=args.slices, offset=args.offset,
                        angle=args.angle, blend=args.blend, direction=args.direction, spacing=args.spacing,
                        cascade=args.cascade, prefix=f"timeslice-{args.name}")
    sha = g.save(kit / "timeslice.api.json")
    preview = ""
    if args.torch_python and args.node_pack:
        tp, npk = Path(args.torch_python), Path(args.node_pack)
        schema = ts_schema(tp, npk, kit)
        probs = [p for p in g.validate(schema) if p.split(" ")[1] == g_ts_id(g)]
        if probs:
            raise SystemExit("the TIMESLICE node does not match the pack's own schema:\n  " + "\n  ".join(probs))
        out = ts_run(tp, npk, np.concatenate([fa, fb]), params, kit)
        morph.write_video(out, kit / "preview-local.mp4")
        morph.strip(kit / "preview-local.mp4")
        preview = (f"\n`preview-local.mp4` ({len(out)} frames) was rendered by the pack's own `TimeSliceEffect`\n"
                   "code on this machine's CPU, so a Comfy run should match it up to video compression.\n")
        print(f"  local preview: {len(out)} frames -> preview-local.mp4 (schema-checked against the pack)")
    (kit / "kit.json").write_text(json.dumps({
        "kind": "timeslice", "name": args.name, "a": str(a), "a_from": args.a_from, "b": str(b),
        "b_from": args.b_from, "b_reverse": args.b_reverse, "frames": args.frames, "params": params,
        "graph_sha256": sha, "built_at": time.strftime("%Y-%m-%dT%H:%M:%S")}, indent=2), encoding="utf-8")
    (kit / "README.md").write_text(TS_README.format(
        name=args.name, a=a.name, b=b.name, fa=len(fa), fb=len(fb), brev=", reversed" if args.b_reverse else "",
        slices=args.slices, angle=args.angle, offset=args.offset, sweep=(args.slices - 1) * abs(args.offset),
        preview=preview, clip_a=clip_a, clip_b=clip_b, kit=kit), encoding="utf-8")
    print(f"kit: {kit}")
    return 0


def g_ts_id(g: Graph) -> str:
    return next(nid for nid, n in g.nodes.items() if n.class_type == "TimeSliceEffect")


# ── ingest ─────────────────────────────────────────────────────────────────


def cmd_ingest(args) -> int:
    kit, src = Path(args.kit), Path(args.file)
    n = 1
    while (kit / f"out-{n:02d}.mp4").exists():
        n += 1
    out = kit / f"out-{n:02d}.mp4"
    shutil.copyfile(src, out)
    w, h, frames = morph.probe(out)
    rec = {"run": out.stem, "source_file": str(src), "frames": frames, "size": [w, h],
           "ingested_at": time.strftime("%Y-%m-%dT%H:%M:%S")}
    strip = morph.strip(out)
    try:
        import clipgrade

        rec["grade"] = clipgrade.grade_clip(out)["verdict"]
    except ImportError:
        pass
    out.with_suffix(".json").write_text(json.dumps(rec, indent=2), encoding="utf-8")
    print(f"{out}  {frames} frames {w}x{h}\n  strip: {strip}" + (f"\n  grade: {rec['grade']}" if "grade" in rec else ""))
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("scan")
    s.add_argument("clips", nargs="+")
    f = sub.add_parser("flw")
    f.add_argument("--a", required=True)
    f.add_argument("--a-from", type=int, required=True)
    f.add_argument("--b", required=True)
    f.add_argument("--b-from", type=int, required=True)
    f.add_argument("--name", required=True)
    f.add_argument("--prompt")
    f.add_argument("--prompt-file")
    f.add_argument("--seed", type=int, default=morph.SEED)
    t = sub.add_parser("timeslice")
    t.add_argument("--a", required=True)
    t.add_argument("--b", required=True)
    t.add_argument("--name", required=True)
    t.add_argument("--a-from", type=int, default=0)
    t.add_argument("--b-from", type=int, default=0)
    t.add_argument("--frames", type=int, default=48)
    t.add_argument("--b-reverse", action="store_true")
    t.add_argument("--slices", type=int, default=14)
    t.add_argument("--offset", type=int, default=2)
    t.add_argument("--angle", type=float, default=90.0)
    t.add_argument("--blend", type=int, default=0)
    t.add_argument("--direction", default="forward", choices=["forward", "reverse", "center_out", "edges_in"])
    t.add_argument("--spacing", default="linear", choices=["linear", "ease_in", "ease_out", "ease_in_out", "random"])
    t.add_argument("--cascade", default="linear", choices=["linear", "ease_in", "ease_out", "ease_in_out", "exponential"])
    t.add_argument("--torch-python", help="a Python with torch, for the free local preview")
    t.add_argument("--node-pack", help="a checkout of systms-ai/TimeSlice-Nodes")
    i = sub.add_parser("ingest")
    i.add_argument("--kit", required=True)
    i.add_argument("--file", required=True)
    args = ap.parse_args()
    return {"scan": cmd_scan, "flw": cmd_flw, "timeslice": cmd_timeslice, "ingest": cmd_ingest}[args.cmd](args)


if __name__ == "__main__":
    raise SystemExit(main())
