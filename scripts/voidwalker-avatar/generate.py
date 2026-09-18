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

⚠ THE REFERENCES ARE DOWNSCALED BEFORE ATTACHING. The identity frames are ~3 MB
JPEGs and the payload is base64; armada's `[refs] model_ready_px/mb` is the
precedent (2048px / 6 MB).
"""

from __future__ import annotations

import argparse
import base64
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
from prompt import BLOCKED, still_prompt  # noqa: E402

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


def post(body: dict, key: str) -> dict:
    req = urllib.request.Request(
        ENDPOINT.format(model=MODEL) + f"?key={key}",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=300) as resp:
        return json.loads(resp.read())


def draw_one(prompt: str, refs: list[Path], key: str, seed_note: str) -> bytes:
    parts = [inline(p) for p in refs] + [{"text": prompt + "\n\n" + seed_note}]
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
                raise SystemExit(
                    "the image model refused the key (HTTP "
                    f"{err.code}). Check it with:\n"
                    "  python3 scripts/voidwalker-avatar/env.py --check GEMINI_API_KEY"
                ) from err
            # ⚠ ONE retry with a bare config, and only for a NAMING 400.
            if err.code == 400 and body is full and any(
                token in detail for token in ("imageConfig", "aspectRatio", "imageSize", "aspect")
            ):
                print(f"    · 400 on the image config; retrying bare once — {detail[:120]}")
                body = bare
                last = err
                continue
            last = err
            print(f"    · HTTP {err.code} (attempt {attempt + 1}/{len(RETRY_BACKOFF)})")
            continue
        except Exception as err:  # noqa: BLE001 - network shapes vary
            last = err
            print(f"    · {type(err).__name__} (attempt {attempt + 1}/{len(RETRY_BACKOFF)})")
            continue

        for cand in data.get("candidates", []):
            for part in cand.get("content", {}).get("parts", []):
                blob = part.get("inlineData") or part.get("inline_data")
                if blob and blob.get("data"):
                    return base64.b64decode(blob["data"])
        last = RuntimeError(f"no image part in the response: {json.dumps(data)[:300]}")
        print("    · no image part returned")
    raise RuntimeError(str(last))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--era", required=True)
    ap.add_argument("--wave", required=True, help="waves/<dir>")
    ap.add_argument("--identity", required=True, type=Path)
    ap.add_argument("--wardrobe", required=True, type=Path)
    ap.add_argument("--draws", type=int, default=6)
    args = ap.parse_args()

    if args.era in BLOCKED:
        raise SystemExit(f"era '{args.era}' is blocked: {BLOCKED[args.era]}")

    root = Path(__file__).resolve().parent
    wave = root / "waves" / args.wave
    stills = wave / "stills"
    stills.mkdir(parents=True, exist_ok=True)
    manifest = wave / "MANIFEST.jsonl"

    key = require("GEMINI_API_KEY")
    prompt = still_prompt(args.era)

    refs = [
        shrink(args.identity, wave / "refs" / f"identity{args.identity.suffix or '.jpg'}"),
        shrink(args.wardrobe, wave / "refs" / "wardrobe.jpg"),
    ]
    print(f"era {args.era} · {args.draws} draws · refs: identity, wardrobe")

    made = 0
    for i in range(1, args.draws + 1):
        out = stills / f"style-holo-emissive-{args.era}_{i:02d}.png"
        if out.exists():
            print(f"  {out.name}  · already on disk, kept")
            continue
        note = f"Draw {i} of {args.draws}. Vary only the light's falloff; the wardrobe and the pose are fixed."
        print(f"  {out.name}  · drawing…")
        try:
            out.write_bytes(draw_one(prompt, refs, key, note))
            made += 1
            row = {"draw": i, "file": out.name, "model": MODEL, "ok": True}
            print(f"     -> {out.stat().st_size // 1024} KB")
        except Exception as err:  # noqa: BLE001
            # ⚠ A FAILED DRAW IS RECORDED, NOT SWALLOWED.
            row = {"draw": i, "file": out.name, "model": MODEL, "ok": False, "error": str(err)[:300]}
            print(f"     -> FAILED: {str(err)[:160]}")
        with manifest.open("a") as fh:
            fh.write(json.dumps(row) + "\n")

    print(f"{made} new draw(s) in {stills}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
