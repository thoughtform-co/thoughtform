#!/usr/bin/env python3
r"""The discovery lane: a free prompt, any references, any model lane.

    python tools/explore.py --name red-dusk --prompt "..." --n 2 --lane gpt
    python tools/explore.py --name red-dusk --prompt-file p.txt --ref a.jpg --dry-run

This lives BESIDE `wave.py` rather than inside it. A wave is the engagement's
contract and stays reproducible from the toml and the markdown; exploration is
allowed to be wrong in interesting ways, and the two must not be able to
contaminate each other. Whatever wins here comes back as a type, a setting or a
clause in those files - never as a special case in the driver.

Output goes to `<creation>/_explore/<name>/`. The leading underscore is
load-bearing: `config.candidates()` skips `_` folders, so nothing drawn here is
ever graded, promoted, or handed over as if it had been. The manifest is
written the same way as a wave's, so a find can be traced back to the prompt
that made it.
"""
from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config  # noqa: E402
import generate  # noqa: E402
import refs  # noqa: E402


def main() -> None:
    cfg = generate.cli_config()
    ap = argparse.ArgumentParser(
        description="Draw a free prompt into the discovery lane. Never graded, never a candidate.")
    ap.add_argument("--name", required=True, help="the exploration's name; becomes the folder")
    ap.add_argument("--prompt", help="the prompt, verbatim")
    ap.add_argument("--prompt-file", help="a file holding the prompt, verbatim")
    ap.add_argument("--ref", action="append", default=[], metavar="PATH",
                    help="reference image; repeatable, and the ORDER IS BINDING")
    ap.add_argument("--lane", default=cfg["models"]["default"],
                    choices=sorted(cfg["models"]["lanes"]))
    ap.add_argument("--n", type=int, default=2)
    ap.add_argument("--ar", default="4:5")
    ap.add_argument("--size", default="2K", choices=("1K", "2K", "4K"))
    ap.add_argument("--quality", default="high", choices=("low", "medium", "high", "auto"))
    ap.add_argument("--out", default="", help="override the output folder")
    ap.add_argument("--dry-run", action="store_true",
                    help="print what would be sent and write nothing")
    a = ap.parse_args()

    prompt = a.prompt
    if a.prompt_file:
        with open(a.prompt_file, encoding="utf-8") as f:
            prompt = f.read()
    if not prompt:
        config.die("give --prompt or --prompt-file")

    if a.out:
        out = a.out
    elif a.dry_run and not (os.environ.get("ARMADA_DRIVE") or cfg["drive"]["root"]):
        out = "(dry-run, no output folder)"      # a plan needs no drive
    else:
        out = os.path.join(str(config.creation_dir(cfg)), "_explore", a.name)
    # A dry run derives nothing: a model-ready copy is a written pixel.
    stack = refs.check(a.ref if a.dry_run else [refs.model_ready(r, cfg) for r in a.ref], cfg)
    print("  explore  " + a.name + "  lane " + a.lane
          + " (" + generate.lane_model(a.lane, cfg) + ")  ar " + a.ar)
    print("  out      " + out + "\n")
    generate.draw(a.name, prompt.strip(), out, stack, lane=a.lane, n=a.n, ar=a.ar,
                  size=a.size, quality=a.quality,
                  meta=generate.meta_row(type_name="explore", aspect=a.ar,
                                         wave="_explore/" + a.name, suffix=a.name),
                  dry_run=a.dry_run)
    if not a.dry_run:
        print("\n  manifest  " + os.path.join(out, "MANIFEST.jsonl"))


if __name__ == "__main__":
    main()
