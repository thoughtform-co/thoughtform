---
name: website-screenshot
description: >-
  Capture screenshots of each section of any website with one command and drop
  them into Downloads, ready to paste into chat. A deterministic Playwright
  script does all the work, so it runs fine on a cheap model (Haiku/Sonnet) or
  with no model at all. Triggers on: screenshot each section, screenshot the
  site/page, capture the sections of a URL, shoot the website, grab section
  images, full-page screenshot, screenshot thoughtform.co or any site, take
  snapshots of a landing page. Also handles scroll-driven WebGL "corridor" sites
  (pinned, scroll-animated pages such as thoughtform.co) via an auto-detected
  corridor mode that captures each settled state. Even simple prompts like
  "screenshot each section of a site" or "grab shots of that landing page"
  should trigger this skill.
---

# Website Screenshot

Capture a full-page screenshot plus one screenshot per section of any web page,
saved into a tidy per-run subfolder in Downloads. Built for the "I want to paste
site sections into chat and ask about them" loop — no more Alt-Tab, scroll, crop,
repeat.

## What it does

Given a URL, it loads the page headless in Chromium, scrolls it to trigger lazy
content, hides cookie/consent banners, then saves:

- `00-full-page.png` — the whole page, top to bottom.
- `01-hero.png`, `02-what-we-do.png`, … — one image per detected section, numbered
  in scroll order and labelled from each section's heading.

Files go to `~/Downloads/<domain>_<YYYY-MM-DD_HHMM>/` (e.g.
`~/Downloads/thoughtform.co_2026-07-22_1430/`). Section detection is automatic:
top-level `<section>` elements first, with a fallback ladder down to the main
layout blocks so it works even on sites that don't use `<section>` tags.

## How to run

This is a thin wrapper around a deterministic script — that is the entire job, so
keep it cheap (Haiku/Sonnet is plenty). Pull the URL out of the request and run:

```bash
python scripts/shoot.py <url>
```

Then report the absolute output folder that the script prints in its summary, so
the user knows where the images landed. Nothing else to reason about.

The script can also be run directly by the user with no model at all:
`python shoot.py https://thoughtform.co`.

## Scroll-driven / WebGL "corridor" sites

Some pages pin their sections and drive the copy **and** a WebGL canvas off the
scroll position — a scroll-animated "corridor" (thoughtform.co is the reference
case). The generic section/`--slices` paths mangle these: un-pinning throws the
scroll-positioned copy off-screen and the 3D canvas renders a scroll-0 frame.

The script **auto-detects** these pages (a `#home-corridor-mount` + `main.stations`
pair) and switches to **corridor mode**, which instead:

- keeps the pinning and motion (no un-pinning, no reduced-motion), and
- scrolls progressively to each station's **settled** scroll offset, waits for the
  page's own settle markers (`data-corridor-phase`, `data-active-step`,
  `--*-copy-in`, `data-reveal="done"`), then shoots the viewport — one clean frame
  per settled state (hero, the Arc beats, each service card, about, continuum,
  contact).

Because the 3D corridor needs a **real GPU**, corridor mode runs **headed** (a
browser window opens; headless software rendering blanks the WebGL). It also
forces a desktop viewport — `--mobile` is ignored for corridor sites (mobile /
reduced-motion flip the site to its flat, WebGL-less fallback). Force or disable
it with `--corridor` / `--no-corridor`.

## Prerequisites

- Python 3.10+ with `playwright` installed: `pip install playwright`.
- A Chromium browser. In managed environments it's provided automatically
  (`PLAYWRIGHT_BROWSERS_PATH`); on a fresh personal machine run
  `playwright install chromium` once. The script never installs browsers itself.

## Common options

- `--mobile` — capture at a ~390px iPhone-ish viewport instead of desktop
  (ignored for corridor sites, which require desktop + a real GPU).
- `--width 1280` — set a specific desktop viewport width (default 1440).
- `--height 1000` — set the desktop viewport height (default 900; corridor: 1000).
- `--corridor` / `--no-corridor` — force or disable scroll-driven corridor mode
  (default: auto-detect via `#home-corridor-mount`).
- `--full-page-only` — just the full-page image, skip per-section shots.
- `--slices` — capture fixed viewport-height tiles instead of semantic sections;
  use this for extremely tall or infinite-scroll pages.
- `--selector "section, .block"` — override auto-detection with your own CSS
  selector when you know the section markup.
- `--out "C:/some/folder"` — write to a folder other than Downloads.
- Multiple URLs are allowed: `python scripts/shoot.py https://a.com https://b.com`
  (each gets its own run folder). It captures the given page(s) only — it does not
  crawl the site.

### Logged-in pages

For pages behind a login, reuse a persistent Chrome profile:

```bash
# First run: opens a visible window — log in once.
python scripts/shoot.py https://app.example.com/dashboard --profile "~/.shoot-profile" --headed
# Later runs: reuse the saved session, headless.
python scripts/shoot.py https://app.example.com/dashboard --profile "~/.shoot-profile"
```

## Caveats

- Consent/sticky-header hiding is best-effort. Occasionally an oddly-named element
  gets hidden, and forcing `fixed` headers to `static` can shift the very top of the
  page a little. `00-full-page.png` is always saved as the least-tweaked overview.
- Very tall pages can exceed Chromium's single-shot capture limit; if the full-page
  image fails, the script says so — rerun with `--slices`.
- Section detection is heuristic. If a site's sections come out wrong, pass an
  explicit `--selector`.
- Corridor mode opens a real browser window (it needs a GPU) and has no
  `00-full-page.png` — it captures one clean frame per settled state instead. Its
  per-station scroll offsets are tuned for thoughtform.co's layout; if that layout
  changes, a shot may land mid-transition and the offsets need re-tuning. `--no-corridor`
  falls back to the generic path.
