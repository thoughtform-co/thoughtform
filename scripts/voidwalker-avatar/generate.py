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
        help="edit stage: photographs of the new rifle's DESIGN (optional; the words carry it without them)",
    )
    # ADR-082 U33: `aim` draws a scene's END POSE from the picked plate, so its
    # framing is checked before a video is paid for.
    ap.add_argument("--edit-kind", choices=("rifle", "aim", "command", "mouth", "aim-stand"),
                    default="rifle",
                    help="edit stage: the rifle swap (U32), the scene's aim pose (U33), "
                         "the standing commander (U34), its mouth closed (U34), or the "
                         "commander's standing aim through the optic (U35)")
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
        prompt = plate_prompt(args.era)
        refs = plate_refs(wave)
        stem = f"plate-{args.era}"
        note_tail = "Vary only the draw; the man, the wardrobe, the pose and the light are fixed."
    elif args.stage == "edit":
        if not args.source or not args.source.exists():
            raise SystemExit(f"the edit stage needs --source, an existing plate: {args.source}")
        missing = [d for d in args.design if not d.exists()]
        if missing:
            raise SystemExit("design photograph(s) not found: " + ", ".join(map(str, missing)))
        prompt = edit_prompt(args.era, len(args.design), args.edit_kind)
        # The source goes UNSHRUNK: it is the likeness being kept, not a hint.
        refs = [("THE PHOTOGRAPH TO EDIT", args.source)]
        for i, d in enumerate(args.design, start=1):
            refs.append(("RIFLE DESIGN", shrink(d, wave / "refs" / f"rifle-design-{i}.jpg")))
        if args.edit_kind == "aim":
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

    key = require("GEMINI_API_KEY")
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
            "model": MODEL,
            "stage": args.stage,
            "era": args.era,
            "config": {"aspectRatio": "9:16", "imageSize": "2K"},
            "refs": [{"image": n, "role": role, "file": p.name, "sha256_16": sha(p)}
                     for n, (role, p) in enumerate(refs, start=1)],
            "prompt": prompt + "\n\n" + note,
        }
        try:
            out.write_bytes(draw_one(parts, key))
            made += 1
            row = {"draw": i, "file": out.name, "model": MODEL, "stage": args.stage, "ok": True}
            print(f"     -> {out.stat().st_size // 1024} KB")
        except Exception as err:  # noqa: BLE001
            # ⚠ A FAILED DRAW IS RECORDED, NOT SWALLOWED.
            row = {"draw": i, "file": out.name, "model": MODEL, "stage": args.stage,
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
