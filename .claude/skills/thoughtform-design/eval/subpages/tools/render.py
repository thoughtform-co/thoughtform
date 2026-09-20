#!/usr/bin/env python3
r"""The render lane: a page of a running product, captured by headless Chrome.

The harness was built to ask an image model for a picture and grade what came
back. On a design engagement the producer is the product itself: a draw is a
screenshot of one route at one viewport, taken from the dev server that is
already running. Everything downstream — the manifest, the grader, the
gallery, the picker — is unchanged, because a PNG with a manifest row is a
PNG with a manifest row.

`generate.py` dispatches here for any model id that starts with `render`. The
id names the port: `render-3010` captures `http://localhost:3010<route>`. A
second lane at another port is the previous look running from a worktree,
which is what a calibration wave grades the rubric against.

The route and the viewport travel IN THE PROMPT, as the two lines the type and
the setting contribute:

    ROUTE: /reports/evolution?p=2026-08
    VIEWPORT: 1440x900

so a slot's "prompt" is recorded verbatim in `MANIFEST.jsonl` like any other
draw, `wave.py --print-prompt` shows exactly what will be captured, and a
setting swaps the viewport the same way it swaps a place line elsewhere.

Chrome is the one already on the machine. No Playwright, no browser download:
`chrome --headless=new --screenshot` has done this since 2017, and the only
thing it needs is a URL that answers. `PRAXIS_CHROME` overrides the path,
`PRAXIS_BASE_URL` overrides the origin the port would imply (a staging host, a
reference site for register truth, a `file:///` folder for fixtures).

Nothing here reads a credential; a render lane needs none, and `doctor.py`
knows that. The product's own auth gate is off for the dev server the lane
captures from, by whatever switch the product provides.

    python tools/render.py --route / --viewport 1440x900 --port 3010 --out shot.png
    python tools/render.py --route /kit --dry-run        # prints the Chrome command, writes nothing

Promoted from a dashboard engagement's design praxis in 0.2.2, when a second
engagement captured its own product to grade it.
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import tempfile
import time

CHROME_CANDIDATES = [
    os.environ.get("PRAXIS_CHROME", ""),
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "google-chrome",
    "chromium",
    "chromium-browser",
]

ROUTE_RE = re.compile(r"^ROUTE:\s*(\S+)", re.M)
VIEWPORT_RE = re.compile(r"VIEWPORT:\s*(\d{3,4})\s*x\s*(\d{3,4})")
PORT_RE = re.compile(r"render-(\d{2,5})$")

DEFAULT_VIEWPORT = (1440, 900)
# Virtual time lets Chrome fast-forward its own timers, so a chart's resize
# observers and a hydration pass have run before the pixels are read. A page
# with counters or entrance animations wants more: PRAXIS_VIRTUAL_TIME_MS.
VIRTUAL_TIME_MS = int(os.environ.get("PRAXIS_VIRTUAL_TIME_MS", "8000") or "8000")


def chrome() -> str | None:
    for cand in CHROME_CANDIDATES:
        if not cand:
            continue
        if os.path.isabs(cand) and os.path.exists(cand):
            return cand
        found = shutil.which(cand)
        if found:
            return found
    return None


def base_url(model_id: str) -> str:
    env = os.environ.get("PRAXIS_BASE_URL", "").strip()
    if env:
        return env.rstrip("/")
    m = PORT_RE.search(model_id or "")
    port = m.group(1) if m else "3010"
    return "http://localhost:" + port


def route_of(prompt: str) -> str | None:
    m = ROUTE_RE.search(prompt or "")
    return m.group(1) if m else None


def viewport_of(prompt: str) -> str:
    m = VIEWPORT_RE.search(prompt or "")
    if not m:
        return "%dx%d" % DEFAULT_VIEWPORT
    return m.group(1) + "x" + m.group(2)


def command(exe: str, url: str, w: int, h: int, out: str, profile: str) -> list[str]:
    """The Chrome invocation, in one place, so `--dry-run` prints what a draw
    would run and a draw runs exactly that."""
    return [
        exe,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--force-device-scale-factor=1",
        "--user-data-dir=" + profile,
        "--window-size=%d,%d" % (w, h),
        "--virtual-time-budget=%d" % VIRTUAL_TIME_MS,
        "--screenshot=" + out,
        url,
    ]


def capture(prompt: str, model_id: str, meta: dict | None = None,
            timeout: int = 90) -> tuple[bytes | None, str | None]:
    """One draw. Returns (png_bytes, None) or (None, why)."""
    route = route_of(prompt)
    if not route:
        return None, "no ROUTE: line in the prompt; the type's shot must carry one"
    w, h = (int(v) for v in viewport_of(prompt).split("x"))
    exe = chrome()
    if not exe:
        return None, ("no Chrome found. Set PRAXIS_CHROME to the browser executable; "
                      "the render lane needs no other dependency")
    url = base_url(model_id) + route

    work = tempfile.mkdtemp(prefix="praxis-render-")
    out = os.path.join(work, "shot.png")
    profile = os.path.join(work, "profile")
    cmd = command(exe, url, w, h, out, profile)
    t0 = time.time()
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        shutil.rmtree(work, ignore_errors=True)
        return None, "chrome did not finish within %ds for %s" % (timeout, url)
    except OSError as e:
        shutil.rmtree(work, ignore_errors=True)
        return None, "chrome could not start: " + str(e)

    if not os.path.exists(out) or os.path.getsize(out) == 0:
        tail = (proc.stderr or proc.stdout or "").strip().splitlines()[-3:]
        shutil.rmtree(work, ignore_errors=True)
        return None, ("no screenshot written for " + url + " (exit " + str(proc.returncode)
                      + "; is the dev server up?)" + (": " + " | ".join(tail) if tail else ""))
    with open(out, "rb") as f:
        blob = f.read()
    shutil.rmtree(work, ignore_errors=True)
    if meta is not None:
        meta.setdefault("route", route)
        meta.setdefault("url", url)
        meta.setdefault("viewport", "%dx%d" % (w, h))
        meta.setdefault("capture_seconds", round(time.time() - t0, 1))
    return blob, None


def main(argv: list[str] | None = None) -> int:
    import argparse
    import sys

    ap = argparse.ArgumentParser(
        description="Capture one route of a running product with headless Chrome.")
    ap.add_argument("--route", default="/", help="the route to open, e.g. /kit")
    ap.add_argument("--viewport", default="%dx%d" % DEFAULT_VIEWPORT, help="WxH, e.g. 1440x900")
    ap.add_argument("--port", default="3010", help="the dev server's port; PRAXIS_BASE_URL overrides")
    ap.add_argument("--out", default=None,
                    help="where to write the PNG (default: <temp>/praxis-smoke.png)")
    ap.add_argument("--dry-run", action="store_true",
                    help="print the Chrome command and write nothing")
    a = ap.parse_args(argv)

    prompt = "ROUTE: " + a.route + "\nVIEWPORT: " + a.viewport
    model_id = "render-" + str(a.port)
    if a.dry_run:
        exe = chrome() or "<chrome>"
        w, h = (int(v) for v in viewport_of(prompt).split("x"))
        print("  would run: " + " ".join(
            command(exe, base_url(model_id) + a.route, w, h, "<out>.png", "<profile>")))
        print("  writes nothing")
        return 0
    blob, err = capture(prompt, model_id, {})
    if err:
        print("  x " + err)
        return 1
    dest = a.out or os.path.join(tempfile.gettempdir(), "praxis-smoke.png")
    with open(dest, "wb") as f:
        f.write(blob)
    print("  ok " + dest + "  " + str(len(blob)) + " bytes")
    return 0


if __name__ == "__main__":
    import sys

    sys.exit(main())
