#!/usr/bin/env python3
r"""One slot, N draws. Prompt in, images out, one manifest line per draw.

    python tools/generate.py --slot H-carafe --prompt "..." --out DIR --n 2 \
        --ref "<identity>.jpg" --lane nano --ar 1:1
    python tools/generate.py --slot H-carafe --prompt "..." --out DIR --dry-run

This file knows two things and nothing else: how to talk to an image API, and
what a draw is on disk. Every judgement about what to ask for lives in
`armada.toml` and `skill/references/generation.md`, and reaches here as a
string.

**Attach order is binding.** The identity reference goes FIRST and is never a
previous draw; a detail view goes second when the shot needs one, a look anchor
third. On the OpenAI edits endpoint the first image is literally the edit
target, so the same ordering is load-bearing in two different ways.

Which API a lane goes to is decided by the model id, not by the lane name:
`gemini*` speaks generateContent, `gpt*` / `dall*` speak /v1/images. The lane
names are the engagement's own (`[models.lanes]` in the toml) and the ids drift
under them, so nothing here may key on a lane name.

Writes `<out>/<slot>[__<suffix>]__<lane>_<nn>.png` plus one `MANIFEST.jsonl`
line per draw carrying the prompt actually sent, the model, the references in
order, the settings and the timestamp. Pixels stay on the drive; the manifest
is the record.

**Resume by existence**: a draw whose file is already there is skipped, never
overwritten. **A failed draw is a record, not a silence**: it stays in the
manifest with `ok: false` and the error, so a wave's log can say what did not
come back and why.
"""
from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import sys
import threading
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config  # noqa: E402
from envload import require  # noqa: E402

# The OpenAI images endpoints take a pixel size, not a ratio. This is an API
# fact, not a judgement about the work, which is why it is here and not in the
# toml; the master ratios themselves live in `[types.*].ar` and `[formats]`.
OPENAI_SIZES = {
    "1:1": "1024x1024",
    "3:2": "1536x1024", "4:3": "1536x1024", "16:9": "1536x1024", "2:1": "1536x1024",
    "2:3": "1024x1536", "3:4": "1024x1536", "4:5": "1024x1536", "9:16": "1024x1536",
}

GEMINI_KEY = "GEMINI_API_KEY"
OPENAI_KEY = "OPENAI_API_KEY"

# Every draw of a wave that shares a type writes into one folder, so several
# threads append to one MANIFEST.jsonl. A short lock is cheaper than a torn line
# in the only record of what was sent. The second lock is for the terminal: a
# wave runs several slots at once and a plan that arrives shredded across four
# threads is a plan nobody reads.
_MANIFEST_LOCK = threading.Lock()
_PRINT_LOCK = threading.Lock()


def say(text: str) -> None:
    """Print one whole message under the terminal lock, so concurrent slots
    never shred each other's lines."""
    with _PRINT_LOCK:
        print(text, flush=True)


# The meta block a manifest row carries. Held here so the wave driver, the
# discovery lane and anything written later agree on the keys without copying
# the list; a grader that reads `meta["setting"]` must never find it absent.
META_KEYS = ("type", "type_name", "question", "channel", "subject", "subject_noun",
             "aspect", "camera", "position", "shape", "wave", "setting", "repair",
             "suffix")


def meta_row(**over) -> dict:
    """A full meta block: every key present, the ones nobody set left empty."""
    out = {k: "" for k in META_KEYS}
    out["repair"] = False
    out.update({k: v for k, v in over.items() if k in META_KEYS})
    return out


def cli_config() -> dict:
    """The engagement config for building a parser - or, when the only thing
    asked for is `--help` and there is no engagement here, an empty stand-in so
    the help still answers. A tool clones with its engagement, but a person
    reading the repo before there is one should still be able to ask what a
    flag does."""
    try:
        return config.load()
    except SystemExit:
        if any(f in sys.argv for f in ("-h", "--help")):
            return {"models": {"default": "", "lanes": {}}, "settings": {"default": {}},
                    "types": {}, "subjects": {}}
        raise


def b64(path) -> str:
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()


def mime(path) -> str:
    return mimetypes.guess_type(str(path))[0] or "image/jpeg"


def lane_model(lane: str, cfg: dict | None = None) -> str:
    cfg = cfg or config.load()
    lanes = cfg["models"]["lanes"]
    if lane not in lanes:
        config.die("unknown lane " + repr(lane) + ". armada.toml [models.lanes] declares: "
                   + ", ".join(lanes))
    return lanes[lane]


def api_for(model_id: str) -> str:
    """Which API a model id speaks. The id decides, never the lane name."""
    m = (model_id or "").lower()
    if m.startswith("gemini"):
        return "gemini"
    if m.startswith("gpt") or m.startswith("dall"):
        return "openai"
    config.die("no API known for model id " + repr(model_id) + ". Ids starting with"
               "\n    'gemini' go to generateContent, 'gpt' or 'dall' to /v1/images."
               "\n    Fix the id in armada.toml [models.lanes], not in the script.")
    return ""


# ------------------------------------------------------------------- gemini ---

def gemini(key, prompt, refs, model, ar="4:5", size="2K", tries=(0, 8, 16, 24)):
    """References in binding order, then the prompt.

    Falls back ONCE to a bare image config if the imageConfig parameter names
    have drifted: the model ids move faster than their request shapes, and a
    wave that dies on a renamed field is a wave lost to a spelling."""
    url = ("https://generativelanguage.googleapis.com/v1beta/models/"
           + model + ":generateContent?key=" + key)
    parts = [{"inline_data": {"mime_type": mime(p), "data": b64(p)}} for p in refs]
    parts.append({"text": prompt})
    configs = [{"responseModalities": ["IMAGE"],
                "imageConfig": {"aspectRatio": ar, "imageSize": size}},
               {"responseModalities": ["IMAGE"]}]
    last = ""
    for i, cfg in enumerate(configs):
        for backoff in tries:
            if backoff:
                time.sleep(backoff)
            req = urllib.request.Request(
                url,
                data=json.dumps({"contents": [{"parts": parts}],
                                 "generationConfig": cfg}).encode(),
                headers={"Content-Type": "application/json"}, method="POST")
            try:
                with urllib.request.urlopen(req, timeout=600) as r:
                    data = json.load(r)
            except urllib.error.HTTPError as e:
                last = e.read().decode(errors="replace")[:400]
                if e.code in (429, 500, 503):
                    continue
                if e.code in (401, 403):
                    config.die(GEMINI_KEY + " was rejected by the API. Fix that key where"
                               "\n    tools/envload.py says it is read from"
                               "\n    (python tools/envload.py --check " + GEMINI_KEY + ");"
                               "\n    do not look for a second copy elsewhere.")
                if e.code == 400 and i == 0 and any(
                        s in last.lower() for s in ("aspect", "imageconfig", "imagesize")):
                    break                      # the one-time fallback to a bare config
                return None, "gemini " + str(e.code) + ": " + last
            except (urllib.error.URLError, TimeoutError) as e:
                last = str(e)
                continue
            for cand in data.get("candidates", []):
                for part in cand.get("content", {}).get("parts", []):
                    blob = part.get("inlineData") or part.get("inline_data")
                    if blob and blob.get("data"):
                        return base64.b64decode(blob["data"]), None
            # A 200 with no image part is a refusal or an empty candidate. Keep
            # the finishReason: it is the only thing that tells the two apart,
            # and the manifest is where that difference has to survive.
            reasons = [c.get("finishReason") for c in data.get("candidates", [])]
            last = "no image in the response (finishReason: " + str(reasons or "none") + ")"
            break
    return None, last


# ------------------------------------------------------------------- openai ---

def _openai_read(req, what):
    last = ""
    for backoff in (0, 15, 30):
        if backoff:
            time.sleep(backoff)
        try:
            with urllib.request.urlopen(req, timeout=900) as r:
                data = json.load(r)
        except urllib.error.HTTPError as e:
            last = e.read().decode(errors="replace")[:400]
            if e.code in (429, 500, 503):
                continue
            if e.code in (401, 403):
                config.die(OPENAI_KEY + " was rejected by the API. Fix that key where"
                           "\n    tools/envload.py says it is read from"
                           "\n    (python tools/envload.py --check " + OPENAI_KEY + ");"
                           "\n    do not look for a second copy elsewhere.")
            return None, what + " " + str(e.code) + ": " + last
        except (urllib.error.URLError, TimeoutError) as e:
            last = str(e)
            continue
        items = data.get("data") or []
        if items and items[0].get("b64_json"):
            return base64.b64decode(items[0]["b64_json"]), None
        if items and items[0].get("url"):
            with urllib.request.urlopen(items[0]["url"], timeout=300) as rr:
                return rr.read(), None
        last = "no image in the response: " + json.dumps(data)[:300]
    return None, last


def openai_generate(key, prompt, model, size="auto", quality="high"):
    """No references: POST /v1/images/generations, JSON body."""
    body = {"model": model, "prompt": prompt, "quality": quality, "n": 1}
    if size and size != "auto":
        body["size"] = size
    req = urllib.request.Request(
        "https://api.openai.com/v1/images/generations",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json",
                 "Authorization": "Bearer " + key}, method="POST")
    return _openai_read(req, model)


def openai_edit(key, prompt, refs, model, size="auto", quality="high"):
    """With references: POST /v1/images/edits, multipart `image[]`. The FIRST
    image is the edit target, which is why attach order is binding here too.

    Do NOT send `input_fidelity`: the endpoint rejects it and processes every
    input at high fidelity anyway, so the parameter buys nothing and costs the
    whole request."""
    boundary = "----armada" + datetime.now().strftime("%H%M%S%f")
    chunks = []

    def field(name, value):
        chunks.append(("--" + boundary + "\r\nContent-Disposition: form-data; name=\""
                       + name + "\"\r\n\r\n" + str(value) + "\r\n").encode())

    field("model", model)
    field("prompt", prompt)
    field("quality", quality)
    if size and size != "auto":
        field("size", size)
    for p in refs:
        chunks.append(("--" + boundary + "\r\nContent-Disposition: form-data; "
                       "name=\"image[]\"; filename=\"" + os.path.basename(p) + "\"\r\n"
                       "Content-Type: " + mime(p) + "\r\n\r\n").encode())
        with open(p, "rb") as f:
            chunks.append(f.read())
        chunks.append(b"\r\n")
    chunks.append(("--" + boundary + "--\r\n").encode())
    req = urllib.request.Request(
        "https://api.openai.com/v1/images/edits", data=b"".join(chunks),
        headers={"Authorization": "Bearer " + key,
                 "Content-Type": "multipart/form-data; boundary=" + boundary},
        method="POST")
    return _openai_read(req, model)


# ---------------------------------------------------------------------- run ---

def draw(slot, prompt, out_dir, refs, lane="", n=1, ar="4:5", size="2K",
         quality="high", meta=None, quiet=False, dry_run=False):
    """One slot, `n` draws. Returns the list of files written - or, under
    `dry_run`, the list it would have written, having written nothing.

    `slot` may carry its repair suffix (`H-carafe__r2`); it is split back out so
    the manifest records the slot a repair belongs to, not a slot of its own.
    A repair that looked like a new slot would never be compared with the draw
    it repairs, which is the only reason to draw it."""
    cfg = config.load()
    lane = lane or cfg["models"]["default"]
    model_id = lane_model(lane, cfg)
    api = api_for(model_id)
    base_slot, _, suffix = str(slot).partition("__")

    for r in refs:
        if not os.path.exists(r):
            config.die("reference not found: " + str(r))
    cap = int(cfg["prompt"]["max_refs"])
    if len(refs) > cap:
        sys.stderr.write("  note: " + str(len(refs)) + " references on " + base_slot
                         + ". Past " + str(cap) + " the model averages the stack and the"
                         " subject drifts toward a generic one.\n")

    gpt_size = OPENAI_SIZES.get(ar, "auto")
    settings = ({"aspectRatio": ar, "imageSize": size} if api == "gemini"
                else {"size": gpt_size, "quality": quality})

    if dry_run:
        # Assembled whole and printed under one lock: a wave dry-runs several
        # slots at once, and a plan interleaved line by line is unreadable.
        plan = ["  dry-run  " + base_slot + (("  suffix " + suffix) if suffix else "")
                + "  lane " + lane + " (" + model_id + " -> " + api + ")"
                + "  ar " + ar + "  " + json.dumps(settings) + "  n " + str(n)]
        for i, r in enumerate(refs, 1):
            plan.append("      ref " + str(i) + ". " + os.path.basename(r))
        would = []
        for d in range(1, n + 1):
            name = config.draw_name(base_slot, lane, d, suffix)
            dest = os.path.join(str(out_dir), name)
            exists = os.path.exists(dest)
            plan.append("      would " + ("skip  " if exists else "write ") + name)
            would.append(dest)
        if not quiet:
            plan.append("      --- prompt ---")
            plan.extend("      " + line for line in prompt.splitlines())
        say("\n".join(plan))
        return would

    os.makedirs(out_dir, exist_ok=True)
    key = require(OPENAI_KEY if api == "openai" else GEMINI_KEY)
    manifest = os.path.join(str(out_dir), "MANIFEST.jsonl")
    written = []

    for d in range(1, n + 1):
        name = config.draw_name(base_slot, lane, d, suffix)
        dest = os.path.join(str(out_dir), name)
        if os.path.exists(dest):
            # Resume by existence. A killed batch re-runs without redrawing, and
            # an approved final is never overwritten by a later pass.
            if not quiet:
                say("  skip " + name + " (exists)")
            written.append(dest)
            continue
        t0 = time.time()
        if api == "gemini":
            blob, err = gemini(key, prompt, refs, model_id, ar, size)
        elif refs:
            blob, err = openai_edit(key, prompt, refs, model_id, gpt_size, quality)
        else:
            blob, err = openai_generate(key, prompt, model_id, gpt_size, quality)
        elapsed = time.time() - t0

        row = {
            "file": name,
            "slot": base_slot,
            "draw": d,
            "model": model_id,
            "model_lane": lane,
            "seconds": round(elapsed, 1),
            # Absolute so a drive-side wave stays traceable; basenames so a
            # human reading the log sees the attach order at a glance.
            "references": [os.path.abspath(r) for r in refs],
            "reference_names": [os.path.basename(r) for r in refs],
            "settings": settings,
            "prompt": prompt,
            "meta": meta or {},
            "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        }

        if blob is None:
            say("  FAIL " + name.ljust(44) + " " + str(err))
            row["ok"] = False
            row["error"] = str(err)
        else:
            with open(dest, "wb") as f:
                f.write(blob)
            written.append(dest)
            row["ok"] = True
            if not quiet:
                say("  ok   " + name.ljust(44)
                     + ("%5.2f MB %6.1fs" % (len(blob) / 1e6, elapsed)))
        with _MANIFEST_LOCK:
            with open(manifest, "a", encoding="utf-8") as f:
                f.write(json.dumps(row) + "\n")
    return written


def main() -> None:
    cfg = cli_config()
    ap = argparse.ArgumentParser(
        description="Generate one slot. Prompt in, images out, one manifest line per draw.",
        epilog="Output: <out>/<slot>[__<suffix>]__<lane>_<nn>.png plus MANIFEST.jsonl.")
    ap.add_argument("--slot", required=True,
                    help="e.g. H-carafe; becomes the filename prefix")
    ap.add_argument("--prompt", help="the prompt, verbatim")
    ap.add_argument("--prompt-file", help="a file holding the prompt, verbatim")
    ap.add_argument("--out", help="output folder (created if absent); required unless --dry-run")
    ap.add_argument("--ref", action="append", default=[], metavar="PATH",
                    help="reference image; repeatable, and the ORDER IS BINDING. "
                         "The identity reference goes first.")
    ap.add_argument("--lane", default=cfg["models"]["default"],
                    choices=sorted(cfg["models"]["lanes"]))
    ap.add_argument("--suffix", default="",
                    help="repair suffix, e.g. r2, so a redraw cannot overwrite the "
                         "draw it repairs")
    ap.add_argument("--n", type=int, default=1)
    ap.add_argument("--ar", default="4:5")
    ap.add_argument("--size", default="2K", choices=("1K", "2K", "4K"))
    ap.add_argument("--quality", default="high", choices=("low", "medium", "high", "auto"))
    ap.add_argument("--print-prompt", action="store_true", help="print the prompt and stop")
    ap.add_argument("--dry-run", action="store_true",
                    help="print what would be sent and write nothing")
    a = ap.parse_args()

    prompt = a.prompt
    if a.prompt_file:
        with open(a.prompt_file, encoding="utf-8") as f:
            prompt = f.read()
    if not prompt:
        config.die("give --prompt or --prompt-file")
    prompt = prompt.strip()
    if a.print_prompt:
        print(prompt)
        return
    if not a.out and not a.dry_run:
        config.die("--out is required to draw (only --dry-run and --print-prompt run without one)")

    slot = a.slot + (("__" + a.suffix) if a.suffix else "")
    # A dry run never needs a drive: the folder is only used to test for files
    # that would be skipped, and a folder that does not exist skips nothing.
    out = a.out or "(dry-run, no output folder)"
    if not a.dry_run:
        print("  lane " + a.lane + " (" + lane_model(a.lane, cfg) + ")  ar " + a.ar)
        for i, r in enumerate(a.ref, 1):
            print("    ref " + str(i) + ". " + os.path.basename(r))
    draw(slot, prompt, out, a.ref, lane=a.lane, n=a.n, ar=a.ar, size=a.size,
         quality=a.quality, meta=meta_row(suffix=a.suffix, aspect=a.ar), dry_run=a.dry_run)
    if not a.dry_run:
        print("\n  manifest  " + os.path.join(str(out), "MANIFEST.jsonl"))


if __name__ == "__main__":
    main()
