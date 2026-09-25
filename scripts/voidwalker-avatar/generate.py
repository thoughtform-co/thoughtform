"""
generate — N draws of one era's still, through the Gemini image model.

The call shape is armada's (`eval/armada/tools/generate.py`), kept deliberately
SDK-free: it is one signed POST, so the still lane cannot break on an SDK bump.
What is kept from that harness, and why:

  * the identity reference is attached FIRST and a previous draw is NEVER
    attached — a draw fed back in is a photocopy of a photocopy;
  * `MANIFEST.jsonl` takes one line per draw, and a FAILED draw stays in it
    with `ok: false` — a silence is not a record;
  * resume by EXISTENCE: a draw already on disk is never re-run or overwritten;
  * a 400 naming `imageConfig`/`aspectRatio`/`imageSize` retries ONCE with a
    bare config, because a wave lost to a renamed field is a wave lost to a
    spelling.

⚠ SIX DRAWS, NOT ONE. ADR-082 U14 measured run-to-run variance on this model at
19.6/255 on the SAME frame with the SAME prompt — against 5.0/255 between two
ADJACENT frames of real motion. One draw is not a sample.

⚠ TWO STAGES (ADR-082 U31). `still` is the original one-step hologram draw and
keeps its `--identity` / `--wardrobe` flags. `plate` is the two-step route's
first half: a FULL-COLOUR, identity-locked plate on a flat key ground, which a
deterministic grade (`gold.py`) then turns gold. The Architect — the look
reference — was made in two steps and reads as a gold-toned photograph; the
eras drawn in ONE step ("a volumetric hologram") came back as emissive sculpts
with blown eyes, because a luma key needs black cloth over-lit or it keys out.

⚠ EVERY REFERENCE IMAGE IS PRECEDED BY A TEXT LABEL NAMING ITS ROLE. Without one
the model decides for itself which picture is the face and which the costume —
and an unlabelled painting of a bald bearded man is the most dangerous identity
leak this chain has. A `plate` wave reads its references from
`refs/refs.json`, which lists the PREPARED crops in order with their roles; the
crops are made and LOOKED AT before a draw is paid for (`refs.py`).

⚠ THE KEY TRAVELS IN THE `x-goog-api-key` HEADER, NEVER IN THE URL. A query
string lands in proxies, shell history and exception text; the first cut put it
there, and an `HTTPError`'s repr carries the full URL.

⚠ A PROMPT SIDECAR IS WRITTEN BESIDE EVERY DRAW — the exact prompt, the refs in
order with their roles and hashes, the model and the config — so a pick can be
re-drawn from its own record and not from whatever the prompt file says later.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import mimetypes
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from env import require  # noqa: E402
from prompt import BLOCKED, edit_prompt, plate_prompt, still_prompt  # noqa: E402

MODEL = "gemini-3-pro-image"
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
#: ADR-082 U41: the face edit's second model — the skill's own "identity
#: rescue when face drifts" route (`SKILL.md`, `prompts.md`), never coded until
#: the Expanse's face had drifted through four edits. One signed multipart POST,
#: SDK-free like the Gemini lane; the images travel in `image[]` IN ORDER, so the
#: prompt's `IMAGE n` clauses mean what they mean on the other lane.
GPT_MODEL = "gpt-image-2"
GPT_ENDPOINT = "https://api.openai.com/v1/images/edits"
RETRY_BACKOFF = (0, 8, 16, 24)
REF_MAX_PX = 2048


def shrink(src: Path, dst: Path, max_px: int = REF_MAX_PX) -> Path:
    """Downscale a reference with sharp (already a repo dep) — base64 payload."""
    if dst.exists():
        return dst
    dst.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            "node",
            "-e",
            "const s=require('sharp');s(process.argv[1])"
            ".resize(+process.argv[3],+process.argv[3],{fit:'inside',withoutEnlargement:true})"
            ".jpeg({quality:92}).toFile(process.argv[2]).then(()=>{});",
            str(src),
            str(dst),
            str(max_px),
        ],
        check=True,
        cwd=Path(__file__).resolve().parents[2],
    )
    return dst


def inline(path: Path) -> dict:
    mime = mimetypes.guess_type(path.name)[0] or "image/jpeg"
    return {"inline_data": {"mime_type": mime, "data": base64.b64encode(path.read_bytes()).decode()}}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()[:16]


def post(body: dict, key: str) -> dict:
    req = urllib.request.Request(
        ENDPOINT.format(model=MODEL),
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": key},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        return json.loads(resp.read())


def multipart(fields: list[tuple[str, str]], files: list[tuple[str, Path]]) -> tuple[bytes, str]:
    """A multipart/form-data body by hand — no SDK, no requests."""
    boundary = "----voidwalker-" + hashlib.sha1(str(time.time_ns()).encode()).hexdigest()[:24]
    out = bytearray()
    for name, value in fields:
        out += (
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n"
        ).encode()
    for name, path in files:
        mime = mimetypes.guess_type(path.name)[0] or "image/png"
        out += (
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; "
            f"filename=\"{path.name}\"\r\nContent-Type: {mime}\r\n\r\n"
        ).encode()
        out += path.read_bytes()
        out += b"\r\n"
    out += f"--{boundary}--\r\n".encode()
    return bytes(out), boundary


#: ⚠ A PLATE HAS NO SOURCE FRAME TO TAKE ITS SHAPE FROM (2026-09-25). An edit
#: sent bare comes back at its source's aspect (the Expanse's 936x1680), but a
#: plate's references are square-ish photographs, so the plate lane ASKS for
#: 9:16 and keeps asking — its fallback is the 2:3 portrait, padded to 9:16 with
#: the ground by `pad_to_9x16`, never an `auto` size that could come back square.
#: And it never sends `input_fidelity`, which this model refuses.
GPT_PLATE_SIZES = ("1152x2048", "1024x1536")


def pad_to_9x16(png: bytes) -> bytes:
    """Pad a plate to exactly 9:16 with its own ground (the corners' median), so
    a 2:3 draw reaches Veo and `post.py` at the shape every era is delivered at.
    Padding, never cropping: a crop could take a hand or a sigil off the side."""
    import io

    import numpy as np
    from PIL import Image

    im = Image.open(io.BytesIO(png)).convert("RGB")
    w, h = im.size
    if w * 16 == h * 9:
        return png
    a = np.asarray(im)
    c = 16
    ground = np.median(np.concatenate([a[:c, :c].reshape(-1, 3), a[:c, -c:].reshape(-1, 3),
                                       a[-c:, :c].reshape(-1, 3), a[-c:, -c:].reshape(-1, 3)]), axis=0)
    tw, th = (w, round(w * 16 / 9)) if w * 16 > h * 9 else (round(h * 9 / 16), h)
    canvas = Image.new("RGB", (tw, th), tuple(int(v) for v in ground))
    canvas.paste(im, ((tw - w) // 2, (th - h) // 2))
    buf = io.BytesIO()
    canvas.save(buf, format="PNG")
    return buf.getvalue()


def draw_one_gpt(prompt: str, refs: list[tuple[str, Path]], seed_note: str, key: str,
                 plate: bool = False) -> bytes:
    """One edit through GPT Image 2. The reference ORDER is the label: the body
    opens by naming what each attached image is, in the order it is attached.
    ⚠ `input_fidelity: high` is what keeps a face — it is the whole point of
    this lane — and a 400 naming it (or the size) retries ONCE without, the
    Gemini lane's own rule for a renamed field. `plate` is the plate stage's
    shape: 9:16 asked for, a 2:3 fallback, never a bare `auto` (see above)."""
    legend = "; ".join(f"IMAGE {i} — {role}" for i, (role, _) in enumerate(refs, start=1))
    text = f"The images are attached in this order: {legend}.\n\n{prompt}\n\n{seed_note}"
    files = [("image[]", path) for _, path in refs]
    if plate:
        head = [("model", GPT_MODEL), ("prompt", text), ("n", "1")]
        tail = [("quality", "high"), ("output_format", "png")]
        full = head + [("size", GPT_PLATE_SIZES[0])] + tail
        bare = head + [("size", GPT_PLATE_SIZES[1])] + tail
        return pad_to_9x16(_post_gpt(full, bare, files, key))
    full = [
        ("model", GPT_MODEL),
        ("prompt", text),
        ("n", "1"),
        ("size", "1024x1536"),
        ("quality", "high"),
        ("output_format", "png"),
        ("input_fidelity", "high"),
    ]
    bare = [f for f in full if f[0] not in ("input_fidelity", "size")]
    return _post_gpt(full, bare, files, key)


def _post_gpt(full: list[tuple[str, str]], bare: list[tuple[str, str]],
              files: list[tuple[str, Path]], key: str) -> bytes:
    fields = full
    last: Exception | None = None
    for attempt, wait in enumerate(RETRY_BACKOFF):
        if wait:
            time.sleep(wait)
        body, boundary = multipart(fields, files)
        req = urllib.request.Request(
            GPT_ENDPOINT,
            data=body,
            headers={
                "Content-Type": f"multipart/form-data; boundary={boundary}",
                "Authorization": f"Bearer {key}",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=600) as resp:
                data = json.loads(resp.read())
        except urllib.error.HTTPError as err:
            detail = err.read().decode("utf-8", "ignore")[:400]
            if err.code in (401, 403):
                raise SystemExit(
                    f"the image model refused OPENAI_API_KEY (HTTP {err.code}). Stopping. "
                    "Check it with:\n  python scripts/voidwalker-avatar/env.py --check OPENAI_API_KEY"
                ) from None
            if err.code == 400 and fields is full and any(
                token in detail for token in ("input_fidelity", "size", "quality")
            ):
                print(f"    · 400 on a field; retrying bare once — {detail[:120]}")
                fields = bare
                last = RuntimeError(f"HTTP 400: {detail[:200]}")
                continue
            last = RuntimeError(f"HTTP {err.code}: {detail[:200]}")
            print(f"    · HTTP {err.code} (attempt {attempt + 1}/{len(RETRY_BACKOFF)})")
            continue
        except Exception as err:  # noqa: BLE001 - network shapes vary
            last = RuntimeError(type(err).__name__)
            print(f"    · {type(err).__name__} (attempt {attempt + 1}/{len(RETRY_BACKOFF)})")
            continue
        for item in data.get("data", []):
            if item.get("b64_json"):
                return base64.b64decode(item["b64_json"])
        last = RuntimeError("no image in the response")
        print("    · no image returned")
    raise RuntimeError(str(last))


def parts_for(prompt: str, refs: list[tuple[str, Path]], seed_note: str) -> list[dict]:
    """`IMAGE n — ROLE` text, then the image, for every reference; the prompt
    last. The labels are what the prompt's own `IMAGE n` clauses refer to."""
    parts: list[dict] = []
    for i, (role, path) in enumerate(refs, start=1):
        parts.append({"text": f"IMAGE {i} — {role}"})
        parts.append(inline(path))
    parts.append({"text": prompt + "\n\n" + seed_note})
    return parts


def draw_one(parts: list[dict], key: str) -> bytes:
    full = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": "9:16", "imageSize": "2K"},
        },
    }
    bare = {"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"]}}

    body = full
    last: Exception | None = None
    for attempt, wait in enumerate(RETRY_BACKOFF):
        if wait:
            time.sleep(wait)
        try:
            data = post(body, key)
        except urllib.error.HTTPError as err:
            detail = err.read().decode("utf-8", "ignore")[:400]
            if err.code in (401, 403):
                # ⚠ NAME THE KEY AND STOP — never a fallback to another one.
                raise SystemExit(
                    "the image model refused GEMINI_API_KEY (HTTP "
                    f"{err.code}). Stopping. Check it with:\n"
                    "  python scripts/voidwalker-avatar/env.py --check GEMINI_API_KEY"
                ) from None
            # ⚠ ONE retry with a bare config, and only for a NAMING 400.
            if err.code == 400 and body is full and any(
                token in detail for token in ("imageConfig", "aspectRatio", "imageSize", "aspect")
            ):
                print(f"    · 400 on the image config; retrying bare once — {detail[:120]}")
                body = bare
                last = RuntimeError(f"HTTP 400: {detail[:200]}")
                continue
            last = RuntimeError(f"HTTP {err.code}: {detail[:200]}")
            print(f"    · HTTP {err.code} (attempt {attempt + 1}/{len(RETRY_BACKOFF)})")
            continue
        except Exception as err:  # noqa: BLE001 - network shapes vary
            last = RuntimeError(type(err).__name__)
            print(f"    · {type(err).__name__} (attempt {attempt + 1}/{len(RETRY_BACKOFF)})")
            continue

        for cand in data.get("candidates", []):
            for part in cand.get("content", {}).get("parts", []):
                blob = part.get("inlineData") or part.get("inline_data")
                if blob and blob.get("data"):
                    return base64.b64decode(blob["data"])
        reason = [c.get("finishReason") for c in data.get("candidates", [])]
        last = RuntimeError(f"no image part in the response (finish: {reason})")
        print(f"    · no image part returned (finish: {reason})")
    raise RuntimeError(str(last))


def plate_refs(wave: Path) -> list[tuple[str, Path]]:
    """The prepared crops, in order, from `refs/refs.json`.

    ⚠ REFUSES A REFERENCE NOBODY HAS LOOKED AT. `refs.py` writes each crop with
    `looked: false`; a person flips it after opening the file. The last wave
    attached a 3/4 stage shot with the face under 1 % of the frame and a
    four-face group photo, and paid for six draws of the wrong man."""
    spec = wave / "refs" / "refs.json"
    if not spec.exists():
        raise SystemExit(f"no {spec} — prepare the references first (refs.py) and LOOK at them")
    rows = json.loads(spec.read_text(encoding="utf-8"))
    out: list[tuple[str, Path]] = []
    unlooked = []
    for row in rows:
        path = wave / "refs" / row["file"]
        if not path.exists():
            raise SystemExit(f"reference listed but missing: {path}")
        if not row.get("looked"):
            unlooked.append(row["file"])
        out.append((row["role"], path))
    if unlooked:
        raise SystemExit(
            "these references have not been looked at (refs.json `looked: false`): "
            + ", ".join(unlooked)
        )
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--era", required=True)
    ap.add_argument("--wave", required=True, help="waves/<dir>")
    ap.add_argument("--stage", choices=("still", "plate", "edit"), default="still")
    # ⚠ THE EDIT STAGE WRITES INTO ITS OWN WAVE'S `plates/` (ADR-082 U32), so
    # grade.py and sheet.py read an edit exactly as they read a plate — the
    # gates, the gold preview and the blind face zoom come for free.
    ap.add_argument("--source", type=Path, help="edit stage: the picked plate to change")
    ap.add_argument(
        "--design",
        type=Path,
        nargs="*",
        default=[],
        help="edit stage: photographs of the new rifle's (or, --edit-kind rig, the helmet's) DESIGN — "
        "all after ONE flag; optional, the words carry it without them",
    )
    # ADR-082 U33: `aim` draws a scene's END POSE from the picked plate, so its
    # framing is checked before a video is paid for.
    ap.add_argument("--edit-kind",
                    choices=("rifle", "aim", "command", "mouth", "aim-stand", "face", "rig", "outfit",
                             "halo"),
                    default="rifle",
                    help="edit stage: the rifle swap (U32), the scene's aim pose (U33), "
                         "the standing commander (U34), its mouth closed (U34), the "
                         "commander's standing aim through the optic (U35), his own "
                         "face put back from the wave's identity crops (U41), or the "
                         "helmet and the broader build (U41, --design = the helmet frames)")
    ap.add_argument("--model", choices=("gemini", "gpt"), default="gemini",
                    help="plate or edit stage: the image model — gemini (the chain's) or gpt "
                         "(GPT Image 2, the identity-rescue lane)")
    # 2026-09-25: an era may carry a SECOND plate lock (the Latent Land era's
    # second habit, `genai-regalia`); the ground stays the era's.
    ap.add_argument("--lock", default=None,
                    help="plate stage: the PLATE_LOCK to draw (default: the era's own)")
    ap.add_argument("--identity", type=Path, help="still stage: the identity frame")
    # ⚠ MORE THAN ONE WARDROBE REFERENCE IS ALLOWED, and the identity still
    # goes FIRST. `expanse` needs two: a solo full-body frame for the silhouette
    # and a lit group frame where the armour's panels actually read.
    ap.add_argument("--wardrobe", type=Path, nargs="+", help="still stage: wardrobe refs")
    ap.add_argument("--draws", type=int, default=6)
    ap.add_argument("--dry-run", action="store_true", help="print the request's parts, send nothing")
    args = ap.parse_args()

    if args.era in BLOCKED:
        raise SystemExit(f"era '{args.era}' is blocked: {BLOCKED[args.era]}")

    root = Path(__file__).resolve().parent
    wave = root / "waves" / args.wave
    out_dir = wave / ("plates" if args.stage in ("plate", "edit") else "stills")
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = wave / "MANIFEST.jsonl"

    if args.stage == "plate":
        prompt = plate_prompt(args.era, args.lock)
        refs = plate_refs(wave)
        stem = f"plate-{args.lock or args.era}"
        # The GPT lane's plates live beside Gemini's under their own stem, as
        # its edits do (resume-by-existence would read one as the other).
        if args.model == "gpt":
            stem += "-gpt"
        note_tail = "Vary only the draw; the man, the wardrobe, the pose and the light are fixed."
    elif args.stage == "edit":
        if not args.source or not args.source.exists():
            raise SystemExit(f"the edit stage needs --source, an existing plate: {args.source}")
        missing = [d for d in args.design if not d.exists()]
        if missing:
            raise SystemExit("design photograph(s) not found: " + ", ".join(map(str, missing)))
        # The source goes UNSHRUNK: it is the likeness being kept, not a hint.
        refs = [("THE PHOTOGRAPH TO EDIT", args.source)]
        # ⚠ AN EDIT ATTACHES THE IDENTITY CROPS OR IT DRIFTS (ADR-082 U41). The
        # Expanse's face went through four edits that each saw only the plate
        # they were editing — a photocopy of a photocopy — and came out a
        # stranger. When the wave's `refs/` holds identity crops (`refs.py --set
        # face`, looked at and listed) they follow the plate on EVERY edit kind:
        # the face edit is addressed to them by number, and every other edit is
        # told, first, that his face stays exactly theirs.
        identity = plate_refs(wave) if (wave / "refs" / "refs.json").exists() else []
        if args.edit_kind == "outfit":
            # 2026-09-25: the wave's refs.json (`refs.py --set outfit`) holds the
            # identity crops AND his jeans and boots; the prompt numbers each.
            ids = [r for r in identity if r[0] == "IDENTITY"]
            wear = [r for r in identity if r[0] != "IDENTITY"]
            if not ids:
                raise SystemExit("the outfit edit needs the wave's identity crops (refs.py --set outfit)")
            refs += ids + wear
            prompt = edit_prompt(args.era, len(wear), "outfit", n_identity=len(ids))
        elif args.edit_kind in ("face", "rig"):
            # These two address the identity crops (and the rig its design
            # frames) by number themselves.
            if not identity:
                raise SystemExit(f"the {args.edit_kind} edit needs the wave's identity crops (refs.py --set face)")
            refs += identity
            prompt = edit_prompt(args.era, len(args.design), args.edit_kind, n_identity=len(identity))
        else:
            prompt = edit_prompt(args.era, len(args.design), args.edit_kind)
            if identity:
                refs += identity
                # The design photographs, if any, come after the identity crops;
                # the edit's own numbering is re-based FIRST. ⚠ Re-basing after
                # the identity line was prepended renumbered that line too
                # ("IMAGE 5, IMAGE 6 and IMAGE 4 are this man's IDENTITY",
                # caught on the halo edit's dry run, 2026-09-25).
                if args.design:
                    shift = len(identity)
                    for i in range(2 + len(args.design) - 1, 1, -1):
                        prompt = prompt.replace(f"IMAGE {i}", f"IMAGE {i + shift}")
                nums = [f"IMAGE {i}" for i in range(2, 2 + len(identity))]
                keep = (
                    f"{', '.join(nums[:-1])} and {nums[-1]} are" if len(nums) > 1 else f"{nums[0]} is"
                ) + " this man's IDENTITY: his face, his beard and his skin stay exactly theirs and exactly IMAGE 1's — the change below does not touch them."
                prompt = keep + "\n\n" + prompt
        design_role, design_stem = {
            "rig": ("HELMET DESIGN", "helmet-design"),
            # 2026-09-25: the Latent Land halo's stone, from the gateway key visuals.
            "halo": ("HALO MATERIAL", "halo-material"),
        }.get(args.edit_kind, ("RIFLE DESIGN", "rifle-design"))
        for i, d in enumerate(args.design, start=1):
            refs.append((design_role, shrink(d, wave / "refs" / f"{design_stem}-{i}.jpg")))
        if args.edit_kind == "halo":
            stem = f"plate-{args.era}-halo"
            note_tail = "Change only the halo; every other pixel of IMAGE 1 is fixed."
        elif args.edit_kind == "outfit":
            stem = f"plate-{args.era}-outfit"
            note_tail = ("Change the pauldrons, what he wears below the belt and the halo; his face, "
                         "the pose, the sigils and the cloak are fixed.")
        elif args.edit_kind == "face":
            stem = f"plate-{args.era}-face"
            note_tail = "Change only his face; every other pixel of IMAGE 1 is fixed."
        elif args.edit_kind == "rig":
            stem = f"plate-{args.era}-rig"
            note_tail = ("Change the helmet and his build; his face, the rifle, the pose, the "
                         "boots and the ground are fixed.")
        elif args.edit_kind == "aim":
            stem = f"plate-{args.era}-aim"
            note_tail = "Change only the pose above the waist; everything else in IMAGE 1 is fixed."
        elif args.edit_kind == "command":
            stem = f"plate-{args.era}-command"
            note_tail = "Change only the pose; the man, the armour, the rifle and the light are fixed."
        elif args.edit_kind == "mouth":
            stem = f"plate-{args.era}-mouth"
            note_tail = "Change only his mouth; every other pixel of IMAGE 1 is fixed."
        elif args.edit_kind == "aim-stand":
            stem = f"plate-{args.era}-aimstand"
            note_tail = "Change only the pose above the waist; his stance and his size are fixed."
        else:
            stem = f"plate-{args.era}-edit"
            note_tail = "Change only the rifle; everything else in IMAGE 1 is fixed."
        # The GPT lane's draws live beside the Gemini lane's under their own
        # stem, whatever the kind — resume-by-existence otherwise reads the
        # other model's draw as this one's and skips it.
        if args.model == "gpt":
            stem += "-gpt"
    else:
        if not args.identity or not args.wardrobe:
            raise SystemExit("the still stage needs --identity and --wardrobe")
        prompt = still_prompt(args.era)
        refs = [("IDENTITY", shrink(args.identity, wave / "refs" / f"identity{args.identity.suffix or '.jpg'}"))]
        for i, w in enumerate(args.wardrobe, start=1):
            refs.append(("WARDROBE", shrink(w, wave / "refs" / f"wardrobe-{i}.jpg")))
        stem = f"style-holo-emissive-{args.era}"
        note_tail = "Vary only the light's falloff; the wardrobe and the pose are fixed."

    print(f"era {args.era} · {args.stage} · {args.draws} draws · refs: "
          + ", ".join(f"{i}:{role}" for i, (role, _) in enumerate(refs, start=1)))
    if args.dry_run:
        for i, (role, path) in enumerate(refs, start=1):
            print(f"  IMAGE {i} — {role}  ({path.name}, {path.stat().st_size // 1024} KB)")
        print("\n" + prompt)
        return 0

    use_gpt = args.stage in ("plate", "edit") and args.model == "gpt"
    model_name = GPT_MODEL if use_gpt else MODEL
    key = require("OPENAI_API_KEY" if use_gpt else "GEMINI_API_KEY")
    made = 0
    for i in range(1, args.draws + 1):
        out = out_dir / f"{stem}_{i:02d}.png"
        if out.exists():
            print(f"  {out.name}  · already on disk, kept")
            continue
        note = f"Draw {i} of {args.draws}. {note_tail}"
        parts = parts_for(prompt, refs, note)
        print(f"  {out.name}  · drawing…")
        sidecar = {
            "draw": i,
            "file": out.name,
            "model": model_name,
            "stage": args.stage,
            "era": args.era,
            "config": ({"size": list(GPT_PLATE_SIZES), "quality": "high", "padded_to": "9:16"}
                       if args.stage == "plate" else
                       {"size": "1024x1536", "quality": "high", "input_fidelity": "high"})
            if use_gpt
            else {"aspectRatio": "9:16", "imageSize": "2K"},
            "refs": [{"image": n, "role": role, "file": p.name, "sha256_16": sha(p)}
                     for n, (role, p) in enumerate(refs, start=1)],
            "prompt": prompt + "\n\n" + note,
        }
        try:
            out.write_bytes(draw_one_gpt(prompt, refs, note, key, plate=args.stage == "plate")
                            if use_gpt else draw_one(parts, key))
            made += 1
            row = {"draw": i, "file": out.name, "model": model_name, "stage": args.stage, "ok": True}
            print(f"     -> {out.stat().st_size // 1024} KB")
        except Exception as err:  # noqa: BLE001
            # ⚠ A FAILED DRAW IS RECORDED, NOT SWALLOWED.
            row = {"draw": i, "file": out.name, "model": model_name, "stage": args.stage,
                   "ok": False, "error": str(err)[:300]}
            sidecar["error"] = str(err)[:300]
            print(f"     -> FAILED: {str(err)[:160]}")
        out.with_suffix(".json").write_text(json.dumps(sidecar, indent=1), encoding="utf-8")
        with manifest.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(row) + "\n")

    print(f"{made} new draw(s) in {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
