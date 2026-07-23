#!/usr/bin/env python3
"""
Website Section Screenshotter
=============================
Loads an arbitrary web page with Playwright/Chromium and saves:
  - one full-page screenshot (00-full-page.png), and
  - one screenshot per visual "section" of the page (01-hero.png, ...).

Section detection is automatic and best-effort: top-level <section> elements
first, then a fallback ladder down to the direct children of <main>/<body>.
Everything is deterministic -- a cheap model (or no model at all) can just run
it. Images land in a per-run subfolder under ~/Downloads by default.

Browsers are provided by the environment (PLAYWRIGHT_BROWSERS_PATH). This
script never installs browsers.

Usage
-----
    python shoot.py https://example.com
    python shoot.py https://a.com https://b.com          # several pages
    python shoot.py https://example.com --out "C:/shots"
    python shoot.py https://example.com --mobile          # ~390px iPhone-ish
    python shoot.py https://example.com --width 1280
    python shoot.py https://example.com --full-page-only
    python shoot.py https://example.com --slices          # viewport-height tiles
    python shoot.py https://example.com --selector "section, .block"
    python shoot.py https://app.com --profile "~/.shoot-profile" --headed
    python shoot.py http://localhost:3003                  # scroll-driven WebGL
                                                           # corridors auto-detected

Scroll-driven / WebGL "corridor" pages (pinned sections whose copy + 3D state
are driven by scrollY, e.g. thoughtform.co) are auto-detected via a
#home-corridor-mount + main.stations pair and captured with a dedicated mode
that keeps the pinning and shoots each station's SETTLED state. Force it with
--corridor or opt out with --no-corridor.
"""
from __future__ import annotations

import argparse
import math
import re
import sys
import unicodedata
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
except ImportError:
    sys.stderr.write(
        "This script needs Playwright.\n"
        "    pip install playwright\n"
        "(Browsers are managed by the environment via PLAYWRIGHT_BROWSERS_PATH; "
        "on a fresh machine run 'playwright install chromium' once.)\n"
    )
    sys.exit(1)


DEFAULT_OUT_DIR = Path.home() / "Downloads"

MOBILE_VIEWPORT = {"width": 390, "height": 844}
DESKTOP_HEIGHT = 900
MOBILE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
)
DESKTOP_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
)

# Only consulted when there are fewer than 2 top-level <section> elements.
FALLBACK_SELECTORS = [
    "[class*='section' i]",
    "[data-section]",
    "[role='region']",
    "main > section",
    "main > div",
]
MIN_SECTION_H = 200     # px -- ignore slivers
MIN_WIDTH_FRAC = 0.6    # element must span >= 60% of viewport width

# Best-effort: hide consent overlays, freeze sticky/fixed chrome, reveal
# scroll-animated content, and stop animations so frames are stable.
HIDE_CSS = """
/* Neutralize sticky/fixed chrome so it can't overlap or repeat in section shots */
*[style*="position: sticky"], *[style*="position:sticky"],
*[style*="position: fixed"],  *[style*="position:fixed"] { position: static !important; }
header, [class*="sticky" i], [class*="navbar" i], [data-sticky] { position: static !important; }

/* Common cookie / consent / privacy overlays (best-effort list) */
#onetrust-consent-sdk, #onetrust-banner-sdk, .onetrust-pc-dark-filter, .ot-sdk-container,
#CybotCookiebotDialog, #cookiescript_injected, #usercentrics-root, #hs-eu-cookie-confirmation,
.cc-window, .cky-consent-container, .fc-consent-root, .truste_overlay, .qc-cmp2-container,
[id*="cookie" i], [class*="cookie-banner" i], [class*="cookie-consent" i], [class*="cookieBanner" i],
[class*="consent" i], [id*="consent" i], [class*="gdpr" i], [id*="gdpr" i],
[aria-label*="cookie" i], .modal-backdrop {
    display: none !important; visibility: hidden !important;
}

/* Undo scroll-lock that consent modals add to <body> */
html, body { overflow: auto !important; }

/* Force scroll-reveal (AOS-style) content to its final visible state */
[data-aos], .aos-init, [class*="reveal" i], [class*="fade" i] {
    opacity: 1 !important; transform: none !important;
}

/* Stabilize frames: kill animations/transitions during capture */
*, *::before, *::after { animation: none !important; transition: none !important; }
"""

# Corridor mode uses ONLY this trimmed slice: hide consent overlays but keep the
# page's pinning, animations and scroll-driven transforms intact (un-pinning or
# freezing them would break a scroll-driven WebGL corridor).
CONSENT_CSS = """
#onetrust-consent-sdk, #onetrust-banner-sdk, .onetrust-pc-dark-filter, .ot-sdk-container,
#CybotCookiebotDialog, #cookiescript_injected, #usercentrics-root, #hs-eu-cookie-confirmation,
.cc-window, .cky-consent-container, .fc-consent-root, .truste_overlay, .qc-cmp2-container,
[id*="cookie" i], [class*="cookie-banner" i], [class*="cookie-consent" i], [class*="cookieBanner" i],
[class*="gdpr" i], [id*="gdpr" i], [aria-label*="cookie" i] {
    display: none !important; visibility: hidden !important;
}
"""


# ----------------------------------------------------------------------
# CLI
# ----------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("urls", nargs="+",
                   help="One or more page URLs (scheme optional; https:// assumed)")
    p.add_argument("--out", default=str(DEFAULT_OUT_DIR),
                   help="Output directory; a per-run subfolder is created inside it "
                        "(default: ~/Downloads)")
    p.add_argument("--width", type=int, default=1440,
                   help="Desktop viewport width in px (default: 1440)")
    p.add_argument("--height", type=int, default=None,
                   help="Desktop viewport height in px (default: 900; corridor mode: 1000)")
    p.add_argument("--mobile", action="store_true",
                   help="Emulate a ~390px iPhone-ish viewport (overrides --width)")
    p.add_argument("--corridor", action="store_true",
                   help="Force scroll-driven corridor mode (see --no-corridor to disable). "
                        "Default: auto-detect via #home-corridor-mount.")
    p.add_argument("--no-corridor", action="store_true",
                   help="Disable corridor auto-detection; use the generic section/slice path.")
    p.add_argument("--selector", default=None,
                   help="CSS selector to use for sections, bypassing auto-detection")
    p.add_argument("--full-page-only", action="store_true",
                   help="Only save the full-page screenshot; skip per-section shots")
    p.add_argument("--slices", action="store_true",
                   help="Capture fixed viewport-height tiles instead of semantic sections")
    p.add_argument("--headed", action="store_true",
                   help="Show the browser window (default: headless)")
    p.add_argument("--profile", default=None,
                   help="Path to a persistent Chrome profile dir to reuse a logged-in session")
    p.add_argument("--timeout", type=float, default=45.0,
                   help="Per-page navigation timeout in seconds (default: 45)")
    return p.parse_args()


# ----------------------------------------------------------------------
# Browser context
# ----------------------------------------------------------------------

def make_context(pw, args, headed=None, corridor=False):
    """Return (context, browser_or_None). browser is None for persistent profiles."""
    is_headed = args.headed if headed is None else headed
    if corridor:
        # Corridor needs a desktop viewport + real GPU; --mobile is ignored here.
        viewport = {"width": max(args.width, 1280), "height": args.height or 1000}
        ua, dsf, mobile = DESKTOP_UA, 1, False
    elif args.mobile:
        viewport, ua, dsf, mobile = MOBILE_VIEWPORT, MOBILE_UA, 3, True
    else:
        viewport = {"width": args.width, "height": args.height or DESKTOP_HEIGHT}
        ua, dsf, mobile = DESKTOP_UA, 1, False

    launch_kwargs = dict(
        headless=not is_headed,
        args=["--disable-blink-features=AutomationControlled"],
    )
    ctx_kwargs = dict(
        viewport=viewport, user_agent=ua, device_scale_factor=dsf,
        is_mobile=mobile, has_touch=mobile, locale="en-US",
    )
    if args.profile:
        profile_dir = Path(args.profile).expanduser()
        profile_dir.mkdir(parents=True, exist_ok=True)
        ctx = pw.chromium.launch_persistent_context(
            user_data_dir=str(profile_dir), **launch_kwargs, **ctx_kwargs)
        return ctx, None
    browser = pw.chromium.launch(**launch_kwargs)
    return browser.new_context(**ctx_kwargs), browser


# ----------------------------------------------------------------------
# Page prep
# ----------------------------------------------------------------------

def load_page(page, url, timeout_ms, reduce_motion=True):
    # reduce_motion=False for corridor sites: prefers-reduced-motion flips a
    # scroll-driven WebGL corridor to its flat, WebGL-less fallback.
    if reduce_motion:
        try:
            page.emulate_media(reduced_motion="reduce")  # calmer, more stable frames
        except Exception:
            pass
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
    except PWTimeout:
        print(f"  WARN: nav timeout for {url}; continuing with whatever loaded", flush=True)
    # Short settle so JS/React can paint. Never networkidle -- long-poll/telemetry
    # sites (documented in cursor_invoice_bot.py) hang it indefinitely.
    page.wait_for_timeout(1500)


def trigger_lazy_load(page, step_frac=0.9, pause_ms=350, max_steps=60):
    """Scroll top->bottom in steps to fire lazy images / IntersectionObservers,
    re-measuring height as content grows, then return to the top."""
    try:
        vh = page.evaluate("window.innerHeight")
        y, steps = 0, 0
        total = page.evaluate("document.body.scrollHeight")
        while y < total and steps < max_steps:
            page.evaluate(f"window.scrollTo(0, {y})")
            page.wait_for_timeout(pause_ms)
            total = page.evaluate("document.body.scrollHeight")  # page may have grown
            y += int(vh * step_frac)
            steps += 1
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(500)
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(500)
    except Exception:
        pass  # best-effort; capture whatever is loaded


def inject_hide_css(page):
    try:
        page.add_style_tag(content=HIDE_CSS)
    except Exception:
        pass  # best-effort; a visible banner is not fatal


# ----------------------------------------------------------------------
# Section detection
# ----------------------------------------------------------------------

def collect_visible_blocks(page, selector):
    """Return visible, tall-enough blocks for one selector, sorted top->bottom."""
    vw = page.evaluate("window.innerWidth")
    blocks = []
    try:
        handles = page.query_selector_all(selector)
    except Exception:
        return []
    for h in handles:
        try:
            if not h.is_visible():
                continue
            info = h.evaluate(
                """el => {
                    const s = getComputedStyle(el);
                    if (s.display === 'none' || s.visibility === 'hidden'
                        || parseFloat(s.opacity) < 0.05) return null;
                    const r = el.getBoundingClientRect();
                    const hd = el.querySelector('h1,h2,h3');
                    return {top: r.top + window.scrollY, height: r.height,
                            width: r.width, heading: hd ? hd.innerText : ''};
                }"""
            )
        except Exception:
            continue
        if not info or info["height"] < MIN_SECTION_H or info["width"] < vw * MIN_WIDTH_FRAC:
            continue
        blocks.append({"handle": h, "top": info["top"],
                       "height": info["height"], "heading": info["heading"]})
    return sorted(blocks, key=lambda b: b["top"])


def dedup_blocks(blocks):
    """Drop any block vertically contained in one already kept -- removes a
    <section> nested inside another (or a wrapper div), keeping the outer one."""
    kept = []
    for b in blocks:
        b_bot = b["top"] + b["height"]
        if any(b["top"] >= k["top"] - 4 and b_bot <= k["top"] + k["height"] + 4 for k in kept):
            continue
        kept.append(b)
    return kept


def detect_sections(page, override_selector):
    if override_selector:
        return dedup_blocks(collect_visible_blocks(page, override_selector))

    blocks = collect_visible_blocks(page, "section")          # PRIMARY
    if len(blocks) >= 2:
        return dedup_blocks(blocks)

    for sel in FALLBACK_SELECTORS:                            # FALLBACK LADDER
        blocks = collect_visible_blocks(page, sel)
        if len(blocks) >= 2:
            return dedup_blocks(blocks)

    root = "main" if page.query_selector("main") else "body"  # LAST RESORT
    return dedup_blocks(collect_visible_blocks(page, f"{root} > *"))


# ----------------------------------------------------------------------
# Capture
# ----------------------------------------------------------------------

def slugify(text, max_len=40):
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9]+", "-", text.lower().strip())
    return re.sub(r"-{2,}", "-", text).strip("-")[:max_len].strip("-")


def run_folder(out_dir, url):
    netloc = (urlparse(url).netloc or "page").split(":")[0]
    domain = re.sub(r"[^a-z0-9.-]", "-", netloc.lower()).replace("www.", "")
    stamp = datetime.now().strftime("%Y-%m-%d_%H%M")
    d = Path(out_dir).expanduser() / f"{domain or 'page'}_{stamp}"
    d.mkdir(parents=True, exist_ok=True)
    return d


def shoot_block(block, idx, run_dir):
    h = block["handle"]
    try:
        h.scroll_into_view_if_needed(timeout=5000)
    except Exception:
        pass
    box = None
    try:
        box = h.bounding_box()
    except Exception:
        pass
    if not box or box["width"] < 1 or box["height"] < 1:
        return None  # detached / zero-size -> skip
    name = f"{idx:02d}-{slugify(block['heading']) or 'section'}.png"
    try:
        h.screenshot(path=str(run_dir / name))
    except Exception as e:
        # Extremely tall sections can exceed Chromium's capture limit -- skip.
        print(f"  WARN: section {idx} shot failed ({type(e).__name__}); skipped", flush=True)
        return None
    return name


def capture_slices(page, run_dir):
    vh = page.evaluate("window.innerHeight")
    total = page.evaluate("document.body.scrollHeight")
    n = max(1, math.ceil(total / vh))
    for i in range(n):
        page.evaluate(f"window.scrollTo(0, {i * vh})")
        page.wait_for_timeout(200)
        page.screenshot(path=str(run_dir / f"{i + 1:02d}-slice.png"))
    return n


# ----------------------------------------------------------------------
# Corridor mode -- scroll-driven WebGL "depth corridor" pages
# ----------------------------------------------------------------------
#
# Some pages (e.g. thoughtform.co) pin their sections and drive both the copy
# and a WebGL canvas off scrollY. The generic path fails on them: un-pinning
# throws scroll-positioned copy off-screen and renders the canvas at a scroll-0
# state. Corridor mode instead keeps the pinning, scrolls to each station's
# SETTLED scroll offset, waits for the page's own settle markers, then shoots
# the viewport -- one clean frame per settled state.
#
# Two hard rules borrowed from the site's own Playwright "corridor smokes":
#   1. Never teleport (scrollTo with behavior:"instant") -- it skips the
#      corridor engagement band and the WebGL frameloop never wakes (dead
#      canvas). Use the two-arg window.scrollTo(0, y).
#   2. Measure runway rects only AFTER the lazy corridor chunk (.home-v2-stage)
#      has mounted and inflated the page height.

# Each entry: name (file stem), spec (where to scroll), settle (marker code),
# delay (extra ms for WebGL/typewriter to finish). Progress values are validated
# starting points and are tuned by eye against the captured PNGs.
# Progress values below are tuned by eye against the running site. #practice is
# intentionally absent: it is an empty 1-viewport transition spacer (no copy).
CORRIDOR_MANIFEST = [
    {"name": "01-hero",              "spec": {"kind": "scrollY", "y": 0},                                 "settle": None,             "delay": 1200},
    {"name": "02-arc-thesis",        "spec": {"kind": "mount", "frac": 0.025},                            "settle": None,             "delay": 1400},
    {"name": "03-arc-navigate",      "spec": {"kind": "mount", "frac": 0.30},                             "settle": "phase:navigate", "delay": 1600},
    {"name": "04-arc-encode",        "spec": {"kind": "mount", "frac": 0.48},                             "settle": "phase:encode",   "delay": 1600},
    {"name": "05-arc-build",         "spec": {"kind": "mount", "frac": 0.70},                             "settle": "phase:build",    "delay": 1600},
    {"name": "06-arc-signal",        "spec": {"kind": "mount", "frac": 0.95},                             "settle": None,             "delay": 1800},
    {"name": "07-services-advisory", "spec": {"kind": "runway", "sel": ".services-stage-root", "p": 0.18}, "settle": "svc:0",         "delay": 2000},
    {"name": "08-services-embedded", "spec": {"kind": "runway", "sel": ".services-stage-root", "p": 0.40}, "settle": "svc:1",         "delay": 2000},
    {"name": "09-services-keynote",  "spec": {"kind": "runway", "sel": ".services-stage-root", "p": 0.60}, "settle": "svc:2",         "delay": 2000},
    {"name": "10-services-workshop", "spec": {"kind": "runway", "sel": ".services-stage-root", "p": 0.80}, "settle": "svc:3",         "delay": 2000},
    {"name": "11-about",             "spec": {"kind": "runway", "sel": ".about-stage-root", "p": 0.68},    "settle": "about",         "delay": 1800},
    {"name": "12-continuum",         "spec": {"kind": "runway", "sel": ".continuum-stage-root", "p": 0.45}, "settle": "continuum",     "delay": 1800},
    {"name": "13-contact",           "spec": {"kind": "anchor", "id": "contact"},                         "settle": None,             "delay": 1000},
]

# Compute a target scrollY from a spec against LIVE geometry. Runway heights are
# dynamic (About/Continuum only expand once scrolled into view), so this is always
# re-evaluated just before scrolling.
_TARGET_Y_JS = """(spec) => {
    const vh = window.innerHeight;
    if (spec.kind === 'scrollY') return spec.y;
    if (spec.kind === 'mount') {
        const m = document.getElementById('home-corridor-mount');
        if (!m) return null;
        const rect = m.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const travel = Math.max(0, rect.height - vh);
        return Math.round(top + spec.frac * travel);
    }
    if (spec.kind === 'runway') {
        const el = document.querySelector(spec.sel);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        const travel = Math.max(0, rect.height - vh);
        return Math.round(top + spec.p * travel);
    }
    if (spec.kind === 'anchor') {
        const el = document.getElementById(spec.id);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        return Math.round(Math.max(0, top - Math.max(0, (vh - rect.height) / 2)));
    }
    return null;
}"""

_RUNWAY_TOP_JS = ("(sel) => { const el = document.querySelector(sel); if (!el) return null;"
                  " const r = el.getBoundingClientRect(); return Math.round(r.top + window.scrollY); }")


def prog_scroll(page, target, step=480, pause_ms=80):
    """Scroll toward target in small steps so the scroll-driven engine + WebGL
    frameloop stay awake (a cold jump / teleport leaves the canvas unrendered)."""
    try:
        cur = page.evaluate("() => window.scrollY")
    except Exception:
        cur = 0
    direction = 1 if target >= cur else -1
    y = cur
    guard = 0
    while ((direction > 0 and y < target) or (direction < 0 and y > target)) and guard < 400:
        y += direction * step
        if (direction > 0 and y > target) or (direction < 0 and y < target):
            y = target
        page.evaluate("(y) => window.scrollTo(0, y)", y)
        page.wait_for_timeout(pause_ms)
        guard += 1
    page.evaluate("(y) => window.scrollTo(0, y)", target)


def scroll_to_target(page, spec):
    """Progressively scroll to a spec's settled position, re-measuring dynamic
    (About/Continuum) runways after they expand. Returns the final Y or None."""
    if spec["kind"] == "runway":
        top = page.evaluate(_RUNWAY_TOP_JS, spec["sel"])
        if top is None:
            return None
        prog_scroll(page, top)          # approach: brings the pinned stage in, expanding its runway
        page.wait_for_timeout(500)
    y = page.evaluate(_TARGET_Y_JS, spec)  # measured against now-current geometry
    if y is None:
        return None
    prog_scroll(page, y)
    return y


def detect_corridor(page):
    """A scroll-driven corridor iff it has the corridor mount + a stations main."""
    try:
        return bool(page.query_selector("#home-corridor-mount")
                    and page.query_selector("main.stations"))
    except Exception:
        return False


def decide_corridor_prelim(args):
    """True/False if forced by flags, else None (auto-detect via a quick probe)."""
    if args.no_corridor:
        return False
    if args.corridor:
        return True
    return None


def quick_detect_corridor(pw, url, timeout_ms):
    """Cheap headless pre-probe: is `url` a scroll-driven corridor? Decided BEFORE
    the real launch so corridor sites can be launched headed (they need a real GPU)."""
    try:
        b = pw.chromium.launch(headless=True,
                               args=["--disable-blink-features=AutomationControlled"])
    except Exception:
        return False
    try:
        pg = b.new_page()
        pg.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
        pg.wait_for_timeout(1000)
        return detect_corridor(pg)
    except Exception:
        return False
    finally:
        try:
            b.close()
        except Exception:
            pass


def settle_expr(code):
    """Map a settle-marker code to a JS predicate (() => bool) or None."""
    if not code:
        return None
    if code.startswith("phase:"):
        ph = code.split(":", 1)[1]
        return ("() => document.documentElement.getAttribute('data-corridor-phase') === '%s'" % ph)
    if code.startswith("svc:"):
        n = code.split(":", 1)[1]
        return ("() => { const el = document.querySelector('.services-stage'); if (!el) return false;"
                " const s = getComputedStyle(el);"
                " const mh = document.querySelector('.services-masthead');"
                " const typed = !mh || mh.getAttribute('data-reveal') === 'done';"
                " return el.getAttribute('data-active-step') === '%s'"
                " && parseFloat(s.getPropertyValue('--svc-content-in') || '0') >= 0.95 && typed; }" % n)
    if code == "about":
        return ("() => { const el = document.querySelector('.about-stage'); if (!el) return false;"
                " const s = getComputedStyle(el);"
                " return parseFloat(s.getPropertyValue('--about-copy-in') || '0') >= 0.9"
                " && parseFloat(s.getPropertyValue('--about-exit') || '0') < 0.15; }")
    if code == "continuum":
        return ("() => { const st = document.querySelector('.continuum-stage');"
                " const sec = document.getElementById('continuum'); if (!st || !sec) return false;"
                " const ss = getComputedStyle(st), sc = getComputedStyle(sec);"
                " return parseFloat(ss.getPropertyValue('--continuum-copy-in') || '0') >= 0.9"
                " && parseFloat(sc.getPropertyValue('--continuum-bg-in') || '0') < 0.5; }")
    return None


def wait_for_settle(page, expr, timeout_ms=3500, interval_ms=120):
    steps = max(1, timeout_ms // interval_ms)
    for _ in range(steps):
        try:
            if page.evaluate(expr):
                return True
        except Exception:
            pass
        page.wait_for_timeout(interval_ms)
    return False


def capture_corridor(page, args, run_dir):
    # Corridor needs a desktop viewport + WebGL; give it extra height for framing.
    height = args.height or 1000
    try:
        page.set_viewport_size({"width": max(args.width, 1280), "height": height})
    except Exception:
        pass
    if args.mobile:
        print("  NOTE: corridor mode needs a desktop viewport; ignoring --mobile", flush=True)

    try:
        page.wait_for_selector(".home-v2-stage", timeout=20000)
    except PWTimeout:
        print("  WARN: .home-v2-stage never mounted; corridor may be in its flat fallback "
              "(reduced-motion / small viewport / no WebGL)", flush=True)
    page.wait_for_timeout(1200)  # let layout inflate and the corridor arm
    try:
        page.add_style_tag(content=CONSENT_CSS)
    except Exception:
        pass

    count = 0
    for entry in CORRIDOR_MANIFEST:
        try:
            y = scroll_to_target(page, entry["spec"])
        except Exception:
            y = None
        if y is None:
            print(f"  WARN: {entry['name']}: target not found; skipped", flush=True)
            continue

        expr = settle_expr(entry["settle"])
        if expr:
            wait_for_settle(page, expr)
        page.wait_for_timeout(entry.get("delay", 1000))

        try:
            page.screenshot(path=str(run_dir / (entry["name"] + ".png")))
            count += 1
        except Exception as e:
            print(f"  WARN: {entry['name']} shot failed ({type(e).__name__})", flush=True)
    return count


# ----------------------------------------------------------------------
# Per-URL driver
# ----------------------------------------------------------------------

def process_url(ctx, url, args, timeout_ms, corridor):
    page = ctx.new_page()
    try:
        # Corridor sites must not get reduced-motion (it flips them to the flat fallback).
        load_page(page, url, timeout_ms, reduce_motion=(not corridor))
        run_dir = run_folder(args.out, url)

        if corridor:
            count = capture_corridor(page, args, run_dir)
            return run_dir, count, "corridor"

        trigger_lazy_load(page)
        inject_hide_css(page)

        try:
            page.screenshot(path=str(run_dir / "00-full-page.png"), full_page=True)
        except Exception as e:
            print(f"  WARN: full-page shot failed ({type(e).__name__}); "
                  f"try --slices for very tall pages", flush=True)

        count = 0
        if not args.full_page_only:
            if args.slices:
                count = capture_slices(page, run_dir)
            else:
                for i, b in enumerate(detect_sections(page, args.selector), start=1):
                    if shoot_block(b, i, run_dir):
                        count += 1
        return run_dir, count, "generic"
    finally:
        page.close()


# ----------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------

def normalize_url(u):
    if re.match(r"^[a-z]+://", u, re.I):  # already has a scheme (http, file, ...)
        return u
    return "https://" + u


def main() -> int:
    args = parse_args()
    Path(args.out).expanduser().mkdir(parents=True, exist_ok=True)
    timeout_ms = int(args.timeout * 1000)

    results = []
    with sync_playwright() as pw:
        # Decide corridor mode BEFORE launch: corridor sites launch headed (their
        # WebGL 3D does not render under headless software rendering).
        prelim = decide_corridor_prelim(args)
        if prelim is None:
            prelim = quick_detect_corridor(pw, normalize_url(args.urls[0]), timeout_ms)
        headed = args.headed or bool(prelim)
        if prelim and not args.headed:
            print("[shoot] corridor site detected -> running headed (a browser window "
                  "opens; the WebGL corridor needs a real GPU)", flush=True)
        ctx, browser = make_context(pw, args, headed=headed, corridor=bool(prelim))
        for raw in args.urls:
            url = normalize_url(raw)
            print(f"[shoot] {url}", flush=True)
            try:
                run_dir, count, mode = process_url(ctx, url, args, timeout_ms, bool(prelim))
                results.append((url, run_dir, count, mode, True))
                unit = "settled state(s)" if mode == "corridor" else "section(s) + full page"
                print(f"  OK [{mode}]: {count} {unit}", flush=True)
            except Exception as e:
                print(f"  FAIL {type(e).__name__}: {e}", file=sys.stderr, flush=True)
                results.append((url, None, 0, "-", False))
        ctx.close()
        if browser:
            browser.close()

    print("\n[shoot] Summary")
    for url, run_dir, count, mode, ok in results:
        if ok:
            unit = "settled state(s)" if mode == "corridor" else "section(s) + full page"
            print(f"  {url}\n    {count} {unit} -> {run_dir.resolve()}")
        else:
            print(f"  {url}\n    FAILED")
    return 0 if any(ok for *_, ok in results) else 1


if __name__ == "__main__":
    sys.exit(main())
