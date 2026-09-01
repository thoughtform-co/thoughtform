/**
 * capture-hud-instruments — drives `/test/hud-instruments-lab` and both
 * ASSERTS its gates and captures the review stills.
 *
 * HEADLESS ON PURPOSE. Unlike the brandmark captures this route has no
 * WebGL, so a headless context is honest — and it is the only mode that
 * works when the in-app browser pane cannot composite. Three rAF loops do
 * run here (the readout decode, the manifest's `data-ready`, and the lab's
 * journey writer), so every wait below is on an OBSERVABLE, never a sleep.
 *
 * DETERMINISM. `reducedMotion: "reduce"` is the default for stills: it
 * kills the rail curtain clip's transition, the diamond glide and the
 * readout decode in one move. The decode in particular paints RANDOM glyphs
 * for ~0.3–0.5s, and Playwright's `animations: "disabled"` stops CSS, not a
 * JS rAF — a shot taken inside that window is a different image every run.
 * Pass `--motion` for one motion-on pass.
 *
 * TWO LABS, ONE HARNESS (`--lab`). The default is
 * `/test/hud-instruments-lab` — the DESKTOP rail instruments, unchanged.
 * `--lab mobile` drives `/test/mobile-hud-lab`, the ≤960 leitmotif
 * candidates, at three phone shapes in both themes. They share this file
 * because they share the discipline, not the subject: the same
 * wait-on-an-observable rule, the same "a real scroll, then wait for it to
 * ARRIVE, then wait for the thing the state is DEFINED by" sequence, and
 * the same refusal to sample a rAF-driven surface on a sleep. What they do
 * NOT share is a single gate — the desktop lab asks whether the marks
 * vanish with the rails, the mobile lab asks whether new ink stays inside a
 * reserved band, clears 3:1 in both themes and touches no copy.
 *
 * Usage (dev server must already be running):
 *   node scripts/capture-hud-instruments.mjs [--port 3003] [--v v1,v2] [--motion]
 *   node scripts/capture-hud-instruments.mjs --lab mobile
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const has = (flag) => args.includes(flag);

const PORT = argOf("--port", "3003");
/** `hud` (the default, `/test/hud-instruments-lab`) or `mobile`. */
const LAB = argOf("--lab", "hud");
const MOBILE = LAB === "mobile";
const OUT = argOf("--out", MOBILE ? "docs/design/mobile-hud" : "docs/design/hud-instruments");
const VARIANTS = argOf("--v", MOBILE ? "v0,c1,c2" : "v0,r1,r2,r3,v1,v5").split(",");
const MOTION = has("--motion");

/* The mobile lab's three shapes are the two the ≤960 laws were measured at
   (390x844 = the binding phone, 430x932) plus 360x780 — the narrowest
   width the bands were NOT measured at, which is where a ladder inset by
   `--hud-margin` at both ends has the least room to put thirteen ticks. */
const ALL_VIEWPORTS = MOBILE
  ? [
      { id: "390x844", width: 390, height: 844, dsf: 2 },
      { id: "430x932", width: 430, height: 932, dsf: 2 },
      { id: "360x780", width: 360, height: 780, dsf: 2 },
    ]
  : [
      { id: "1920x1080", width: 1920, height: 1080, dsf: 1 },
      { id: "1440x900", width: 1440, height: 900, dsf: 2 },
      { id: "1280x720", width: 1280, height: 720, dsf: 1 },
      { id: "390x844", width: 390, height: 844, dsf: 2 },
    ];
const VP_FILTER = argOf("--vp", "");
const VIEWPORTS = VP_FILTER
  ? ALL_VIEWPORTS.filter((v) => VP_FILTER.split(",").includes(v.id))
  : ALL_VIEWPORTS;

/**
 * Scroll states, resolved from the live runway rather than hardcoded px.
 *
 * `want` is the OBSERVABLE that defines the state, and for every state past
 * the hero that is the READOUT TEXT — not `data-active-station`. The
 * station attribute is written by `useLandingScroll`'s rAF, the readout by
 * `useActiveSection`'s, and the lab's own scalars by a third; sampling on
 * the first of those catches the other two mid-flight. (Measured: at
 * `#services` the corner still read PROOF and the rail still showed two
 * marks, one frame before both settled to SERVICES and three.)
 *
 * Targets sit clear of a beat's exact park for the same reason — 0.48 of
 * the runway lands on `encode`'s threshold and rounds under it, so the
 * sample is genuinely ambiguous. 0.55 is unambiguously inside the beat.
 */
const STATES = [
  { id: "1-hero", target: () => 0, want: { heroLift: "0.0000" } },
  // NOT `readout: "THE ARC"` — the hero prints the same string (it maps to
  // the Arc row by design), so that predicate is satisfied before the
  // scroll has even left the first viewport. The corridor PHASE is the
  // unambiguous one.
  { id: "2-arc", target: (m) => m.mountTop + 0.55 * m.mountTravel, want: { phase: "encode" } },
  { id: "3-services", target: (m) => m.servicesTop + 2 * m.vh, want: { readout: "SERVICES" } },
  { id: "4-contact", target: (m) => m.maxScroll, want: { readout: "CONTACT" } },
];

/** A benign, site-wide report-only CSP notice — not this route's doing. */
const IGNORED_ERROR = /upgrade-insecure-requests' is ignored when delivered in a report-only/;

const metrics = (page) =>
  page.evaluate(() => {
    const el = (id) => document.getElementById(id);
    const mount = el("home-corridor-mount");
    const services = el("services");
    return {
      vh: window.innerHeight,
      maxScroll: document.documentElement.scrollHeight - window.innerHeight,
      mountTop: mount?.offsetTop ?? 0,
      mountTravel: Math.max(1, (mount?.offsetHeight ?? 0) - window.innerHeight),
      servicesTop: services?.offsetTop ?? 0,
    };
  });

const readHud = (page) =>
  page.evaluate(() => {
    const de = document.documentElement;
    const rail = document.querySelector(".hud__rail--l");
    const clip = rail ? getComputedStyle(rail).clipPath : "";
    return {
      station: de.getAttribute("data-active-station"),
      engaged: de.getAttribute("data-corridor-engaged"),
      phase: de.getAttribute("data-corridor-phase"),
      heroLift: de.style.getPropertyValue("--hero-lift"),
      readout: document.querySelector(".hud__nav__sector__name")?.textContent ?? "",
      detail: document.querySelector(".hud__nav__sector__detail")?.textContent ?? "",
      // RENDERED marks, not mounted ones. Below 960px `.hud__rail` is
      // `display: none`, so the instruments stop painting while staying in
      // the DOM — exactly as the production rail chrome does. Counting
      // nodes would call that a failure; counting boxes calls it correct.
      marks: [...document.querySelectorAll("[data-hil-mark]")].filter(
        (el) => el.getClientRects().length > 0
      ).length,
      railHidden: rail ? getComputedStyle(rail).display === "none" : true,
      // The curtain's top inset — 0px once the hero has lifted clear.
      clipTop: clip.match(/inset\(([^\s)]+)/)?.[1] ?? clip,
      diamondPainted:
        (() => {
          const d = document.querySelector(".rail-manifest__diamond");
          if (!d) return false;
          const cs = getComputedStyle(d);
          return cs.display !== "none" && Number(cs.opacity) > 0.01;
        })() ?? false,
      manifestShown:
        getComputedStyle(document.querySelector("[data-rail-manifest-root]") ?? document.body)
          .display !== "none",
    };
  });

if (MOBILE) {
  /* ══════════════════════════════════════════════════════════════════════
     --lab mobile  ·  /test/mobile-hud-lab
     ══════════════════════════════════════════════════════════════════════

     Three candidates × three phone shapes × both themes × three scroll
     stops, and FOUR gates that are the promotion conditions written as
     arithmetic:

       BAND      every pixel of the candidate is inside the chrome band it
                 claims (`--mobile-chrome-top` / `--mobile-chrome-bottom`,
                 resolved by the engine — see the probe below).
       CONTRAST  every stroke clears 3:1 against its own bed, in BOTH
                 themes. Light is the binding case and it is not close.
       COPY      zero intersection with the runway's GLYPH RUNS.
       LADDER    the strip's detent table is strictly increasing, so a
                 section change always moves the detent.

     ⚠ EVERY TARGET RESOLVES FROM THE LIVE RUNWAY, never from a fraction and
     never from a pixel count — the desktop states above resolve from
     `metrics` for the same reason, and it is landing-corridor-smoke's own
     law. Measured here: the corridor's part runs to **0.636** of the scroll
     range at 390x844, so a "mid" of 0.50 or 0.55 lands on the corridor's own
     exit threshold and the sample is genuinely ambiguous about which row
     owns it — exactly what the desktop lab's `0.55 of the mount` note is
     about, one surface over. So the middle stop is the CASEFILE'S OWN BEAT:
     its first part's top, brought 0.2 of a screen past the observer's
     45 % line so the row is unambiguously seated (the next part is 0.72 of
     a screen further down, so there is no contest). Three stops, three
     different rungs — which is what a still of a travelling detent has to
     show. */
  const MOBILE_STATES = [
    { id: "1-top", target: () => 0 },
    { id: "2-mid", target: (m) => m.midTop },
    { id: "3-deep", target: (m) => m.maxScroll },
  ];

  const THEMES = ["dark", "light"];

  /* Which band each candidate claims. `v0` claims none — it is the control
     and must draw nothing at all. */
  const CLAIMED_BAND = { c1: "top", c2: "bottom" };

  /* The four production painters that survive at ≤960 — the same list
     `tests/visual/mobile-section-seams.spec.ts` measures. Recorded on every
     sample rather than asserted: a candidate that MOVED one of these would
     owe a re-derivation of both band tokens in the same commit, and the
     rects are what makes that visible in the report instead of on a phone. */
  const MOBILE_CHROME = [".hud__nav__btn", ".rin-settings", ".hud__corner--tl", ".hud__corner--br"];

  /** The non-text contrast floor (WCAG 1.4.11). Line work, so 3 and not 4.5. */
  const INK_FLOOR = 3;

  const readMobile = (page, chromeSels) =>
    page.evaluate((sels) => {
      const root = document.querySelector(".mhl");

      /* ── The bands, RESOLVED BY THE ENGINE ─────────────────────────────
         ⚠ `getPropertyValue("--mobile-chrome-top")` hands back the authored
         `calc()`, not a length. A throwaway element that SPENDS them as
         padding is what makes computed style report pixels — the seam
         spec's own trick, reused rather than re-derived, because a second
         parser for the same expression is a second thing to be wrong. */
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:fixed;top:0;left:0;width:0;height:0;visibility:hidden;pointer-events:none;" +
        "padding-top:var(--mobile-chrome-top);padding-bottom:var(--mobile-chrome-bottom)";
      document.body.appendChild(probe);
      const ps = getComputedStyle(probe);
      const bands = {
        top: Number.parseFloat(ps.paddingTop),
        bottom: Number.parseFloat(ps.paddingBottom),
      };
      probe.remove();

      /* ── Colour, composited ────────────────────────────────────────────
         sRGB → linear → relative luminance → WCAG ratio. Done here rather
         than in Node because the whole point is to measure the RESOLVED
         values: `rgba(var(--dawn-rgb), .48)` is two different colours in
         the two themes and only the engine knows which one is live. */
      const parse = (c) => {
        const m = String(c).match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1]
          .split(/[,\s/]+/)
          .filter(Boolean)
          .map(Number);
        if (p.length < 3 || p.some((n) => Number.isNaN(n))) return null;
        return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
      };
      const lin = (c) => {
        const s = c / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
      const over = (fg, bg) => ({
        r: fg.a * fg.r + (1 - fg.a) * bg.r,
        g: fg.a * fg.g + (1 - fg.a) * bg.g,
        b: fg.a * fg.b + (1 - fg.a) * bg.b,
        a: 1,
      });
      const ratio = (x, y) => {
        const a = lum(x) + 0.05;
        const b = lum(y) + 0.05;
        return Math.max(a, b) / Math.min(a, b);
      };

      /* ⚠ THE BED IS THE FIRST ANCESTOR THAT IS ACTUALLY OPAQUE, and α ≥ .85
         is the house threshold (the casefile light-walk's own `bedOf`).
         Compositing a hairline over a translucent parent and calling that
         the ground is how a drawing comes out at 6:1 against a colour
         nothing paints. */
      const bedOf = (el) => {
        let n = el.parentElement;
        while (n) {
          const c = parse(getComputedStyle(n).backgroundColor);
          if (c && c.a >= 0.85) return c;
          n = n.parentElement;
        }
        return parse(getComputedStyle(document.body).backgroundColor) ?? { r: 0, g: 0, b: 0, a: 1 };
      };

      /* An element's own ink. ⚠ AN SVG CHILD HAS NO BACKGROUND — it paints
         with `stroke` unless that is `none`, and then with `fill`. Asking a
         `<line>` for its `background-color` returns transparent, which would
         report every tick on the dial as unmeasurable and pass the gate by
         having nothing to fail. */
      const inkOf = (el) => {
        const cs = getComputedStyle(el);
        if (el.ownerSVGElement) {
          const s = parse(cs.stroke);
          if (s && s.a > 0.01) return s;
          return parse(cs.fill);
        }
        return parse(cs.backgroundColor);
      };
      const rectOf = (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      };

      /* The candidate, if one is mounted. The ROOT goes in the list too and
         is measured for the band: it is the strictest reading of "the
         candidate paints inside its band" — a drawing that fits while its
         host box hangs out of the strip has un-reserved the difference. */
      const host = document.querySelector(".hud__mstrip, .hud__mdial");
      const ink = [];
      /* ⚠ THE LIT MARK'S RATIO AGAINST ITS OWN NEIGHBOURS, WHICH IS A
         DIFFERENT QUESTION FROM ITS RATIO AGAINST THE GROUND — and on these
         two drawings it is the DECISIVE one. Both say "you are here" by
         lighting one member of a ladder, so a lit mark that clears 3:1
         against the bed while measuring ~1.2:1 against the unlit mark beside
         it is a mark nobody can pick out: the gate is green and the
         instrument says nothing. Reported, not gated — the marks also differ
         in HEIGHT (10px against the ticks' 4/7) and carry a bloom, so a
         threshold on colour alone would be a number invented to be passed.
         The owner reads it beside the stills. */
      let litVs = null;
      if (host) {
        ink.push({ key: "root", rect: rectOf(host), colour: null, ratio: null });
        let litC = null;
        let lineC = null;
        let litBed = null;
        for (const el of host.querySelectorAll("[data-mhd-ink]")) {
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden") continue;
          if (Number.parseFloat(cs.opacity) < 0.05) continue;
          const c = inkOf(el);
          const bed = bedOf(el);
          const key = el.dataset.mhdInk;
          if ((key === "detent" || key === "mark") && c) {
            litC = c;
            litBed = bed;
          }
          if (key === "tick" && c && !lineC) lineC = c;
          ink.push({
            key,
            rect: rectOf(el),
            colour: c
              ? `rgba(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)},${c.a})`
              : null,
            bed: bed ? `rgb(${Math.round(bed.r)},${Math.round(bed.g)},${Math.round(bed.b)})` : null,
            ratio: c && bed ? Math.round(ratio(over(c, bed), bed) * 100) / 100 : null,
          });
        }
        if (litC && lineC && litBed) {
          litVs = Math.round(ratio(over(litC, litBed), over(lineC, litBed)) * 100) / 100;
        }
      }

      /* ── Runway ink, as GLYPH RUNS ─────────────────────────────────────
         ⚠ A BOUNDING RECT IS NOT AN INK RECT, and the seam spec's first cut
         failed on exactly that difference: a container 200px tall around a
         39px line of type reports a collision for a headline 90px clear of
         the corner. Range client rects are the real letters, one box per
         line. ⚠ AND `elementsFromPoint` CANNOT DO THIS JOB — it skips
         `pointer-events: none`, which is every piece of chrome on this
         surface, and it answers about a POINT where the question is an
         AREA. */
      const boxes = ink.filter((i) => i.rect.w >= 1 && i.rect.h >= 1).map((i) => i.rect);
      const hits = [];
      for (const block of document.querySelectorAll(".mhl-block")) {
        const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          const text = (node.textContent || "").trim();
          if (text.length < 2) continue;
          const parent = node.parentElement;
          if (!parent) continue;
          const cs = getComputedStyle(parent);
          if (cs.display === "none" || cs.visibility === "hidden") continue;
          if (Number.parseFloat(cs.opacity) < 0.05) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const r of Array.from(range.getClientRects())) {
            if (r.width < 1 || r.height < 1) continue;
            for (const b of boxes) {
              if (r.left < b.x + b.w && b.x < r.right && r.top < b.y + b.h && b.y < r.bottom) {
                hits.push(`"${text.slice(0, 26)}" @[${Math.round(r.left)},${Math.round(r.top)}]`);
              }
            }
          }
        }
      }

      const chrome = sels.map((sel) => {
        const el = document.querySelector(sel);
        return { sel, rect: el ? rectOf(el) : null };
      });

      return {
        vh: window.innerHeight,
        bands,
        theme: document.documentElement.getAttribute("data-theme") ?? "dark",
        variant: root?.dataset.mhlVariant ?? "",
        /* ⚠ `mhlActive`, not `mhlRow` — the runway's PARTS own
           `data-mhl-row`, and the root is their ancestor. */
        row: root?.dataset.mhlActive ?? "",
        detent: root?.dataset.mhlDetent ?? "",
        detents: root?.dataset.mhlDetents ?? "",
        depth: root?.dataset.mhlDepth ?? "",
        frame: Number(root?.dataset.mhlFrame ?? 0),
        ink,
        litVs,
        hits: [...new Set(hits)],
        chrome,
      };
    }, chromeSels);

  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const rows = [];

  try {
    for (const vp of VIEWPORTS) {
      for (const theme of THEMES) {
        for (const v of VARIANTS) {
          const ctx = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
            deviceScaleFactor: vp.dsf,
            /* PRM is the default for stills here for the same reason it is
               on the desktop lab: it kills the detent glide, so a shot taken
               mid-step is not a different image every run. The glide is the
               only motion either candidate owns — the astrolabe's needle is
               SCRUBBED and has no transition to disable, so it is at its
               true angle in every frame either way. */
            reducedMotion: MOTION ? "no-preference" : "reduce",
            colorScheme: theme === "light" ? "light" : "dark",
          });
          const page = await ctx.newPage();
          const errors = [];
          const note = (t) => !IGNORED_ERROR.test(t) && errors.push(t);
          page.on("pageerror", (e) => note(String(e)));
          page.on("console", (m) => m.type() === "error" && note(m.text()));

          /* `?theme=` drives the pre-paint bootstrap in `app/layout.tsx`,
             which is what writes `data-theme` on `<html>` before first
             paint on EVERY route. `colorScheme` alone would not: ADR-058's
             light theme is an attribute, not a media query. */
          await page.goto(
            `http://localhost:${PORT}/test/mobile-hud-lab?v=${v}&theme=${theme}&console=0`,
            { waitUntil: "domcontentloaded" }
          );

          /* The lab is live once its detent table has been MEASURED — the
             `data-ready` gate, the same contract the rail manifest uses to
             avoid painting a diamond at rung 0 and then gliding it out. */
          await page.waitForSelector(".mhl[data-mhl-ready]", {
            state: "attached",
            timeout: 30_000,
          });
          /* And once the runway is all there. Eight parts over seven rows;
             a partial runway measures a short document and every detent in
             the table is then wrong by a proportion nothing reports. */
          await page.waitForFunction(
            () => document.querySelectorAll("[data-mhl-row]").length === 8,
            undefined,
            { timeout: 30_000 }
          );

          const m = await page.evaluate(() => {
            const vh = window.innerHeight;
            const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
            /* The casefile's first journey part — the densest station, and
               the one whose beat the middle stop is. Its OWN offset, so the
               stop follows the runway if a block's height ever changes. */
            const proof = document.querySelector('[data-mhl-row="proof"]');
            const proofTop = proof ? proof.getBoundingClientRect().top + window.scrollY : 0;
            return {
              vh,
              maxScroll,
              midTop: Math.min(maxScroll, Math.max(0, proofTop - 0.2 * vh)),
            };
          });

          for (const st of MOBILE_STATES) {
            const top = Math.round(st.target(m));
            const want = (top / m.maxScroll).toFixed(3);
            let settled = true;

            // A REAL scroll, then a wait for it to ARRIVE.
            await page.evaluate((y) => window.scrollTo(0, y), top);
            await page
              .waitForFunction(
                (y) => {
                  const max = document.documentElement.scrollHeight - window.innerHeight;
                  return Math.abs(window.scrollY - Math.min(y, max)) <= 2;
                },
                top,
                { timeout: 15_000 }
              )
              .catch(() => {
                settled = false;
              });

            /* Then the OBSERVABLE the state is DEFINED by: the lab's own
               committed depth. "The page is at y" and "the lab knows it is
               at y" are two facts one rAF apart, and every gate below reads
               the second. ⚠ It is satisfiable at the TOP stop before any
               scroll has happened, and that is correct — the first write
               already committed 0.000, so a predicate demanding a CHANGE
               would hang there forever. */
            await page
              .waitForFunction(
                (w) => {
                  const d = document.querySelector(".mhl")?.dataset.mhlDepth;
                  return d != null && Math.abs(Number(d) - Number(w)) <= 0.005;
                },
                want,
                { timeout: 8_000 }
              )
              .catch(() => {
                settled = false;
              });

            /* Two frames for the IntersectionObserver's callback to land.
               ⚠ NOT A SLEEP — a bounded flush of the frame queue, the seam
               spec's own `settle()`. The observer reports from the
               compositor and there is no attribute it writes that the
               script could distinguish from the previous state's, since the
               row it resolves to is exactly what is under test. */
            await page.evaluate(
              () =>
                new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
            );

            const h = await readMobile(page, MOBILE_CHROME);
            rows.push({ vp: vp.id, theme, v, state: st.id, settled, ...h, errors: errors.length });

            await page.screenshot({
              path: `${OUT}/${vp.id}_${theme}_${v}_${st.id}${MOTION ? "_motion" : ""}.png`,
              animations: "disabled",
            });
          }
          await ctx.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  // ── Report ────────────────────────────────────────────────────────────
  const pad = (s, n) =>
    String(s ?? "")
      .padEnd(n)
      .slice(0, n);
  const bandOf = (r) => {
    const claim = CLAIMED_BAND[r.v];
    if (!claim) return r.ink.length ? "INK!" : "n/a";
    if (!r.ink.length) return "none";
    const strays = r.ink.filter((i) => {
      if (i.rect.w < 0.5 && i.rect.h < 0.5) return false;
      return claim === "top"
        ? i.rect.y + i.rect.h > r.bands.top + 1
        : i.rect.y < r.vh - r.bands.bottom - 1;
    });
    return strays.length ? `OUT×${strays.length}` : "in";
  };
  const minRatio = (r) => {
    const vals = r.ink.map((i) => i.ratio).filter((x) => typeof x === "number");
    return vals.length ? Math.min(...vals) : null;
  };

  console.log(
    [
      pad("viewport", 9),
      pad("theme", 6),
      pad("v", 3),
      pad("state", 8),
      pad("row", 11),
      pad("rung", 5),
      pad("depth", 6),
      pad("band", 7),
      pad("ratio", 6),
      pad("lit:un", 6),
      pad("copy∩", 6),
      pad("ink", 4),
      "err",
    ].join(" ")
  );
  for (const r of rows) {
    const mr = minRatio(r);
    console.log(
      [
        pad(r.vp, 9),
        pad(r.theme, 6),
        pad(r.v, 3),
        pad(r.state, 8),
        pad(r.row, 11),
        pad(r.detent, 5),
        pad(r.depth, 6),
        pad(bandOf(r), 7),
        pad(mr == null ? "—" : mr.toFixed(2), 6),
        pad(r.litVs == null ? "—" : r.litVs.toFixed(2), 6),
        pad(r.hits.length ? `HIT×${r.hits.length}` : "0", 6),
        pad(r.ink.length, 4),
        r.errors,
      ].join(" ")
    );
  }

  /* The bands, once per shape — they are the denominator of the band gate
     and the rule records them as 56/56, so a shape that resolves something
     else is worth seeing before the gates are read. */
  console.log("");
  for (const vp of VIEWPORTS.map((x) => x.id)) {
    const r = rows.find((x) => x.vp === vp);
    if (r) console.log(`  ${vp}  bands ${r.bands.top} / ${r.bands.bottom}  vh ${r.vh}`);
  }

  /* ── The verdict, per candidate ────────────────────────────────────────
     ⚠ THE FOUR GATES ARE PROMOTION CONDITIONS, NOT A BUILD'S HEALTH. A
     candidate failing one is this harness reporting its RESULT — the whole
     reason the lab exists — and reading that off a flat list of failures
     invites the wrong fix, which is silencing the gate. So each candidate is
     summarised on its own line first, and the failure list below is the
     detail behind whichever line says FAIL. */
  console.log("");
  for (const v of VARIANTS) {
    const mine = rows.filter((r) => r.v === v);
    if (!mine.length) continue;
    const ratios = mine
      .flatMap((r) => r.ink.map((i) => i.ratio))
      .filter((x) => typeof x === "number");
    const lits = mine.map((r) => r.litVs).filter((x) => typeof x === "number");
    const strays = mine.filter((r) => bandOf(r).startsWith("OUT")).length;
    const hits = mine.reduce((n, r) => n + r.hits.length, 0);
    const inked = mine.some((r) => r.ink.length > 0);
    const ok = strays === 0 && hits === 0 && (!ratios.length || Math.min(...ratios) >= INK_FLOOR);
    console.log(
      `  ${pad(v, 3)} ${ok ? "PASS" : "FAIL"}  ` +
        `band ${strays === 0 ? "in" : `OUT×${strays}`}  ` +
        `contrast ${ratios.length ? `${Math.min(...ratios).toFixed(2)}:1` : "no ink"}  ` +
        `lit:unlit ${lits.length ? `${Math.min(...lits).toFixed(2)}:1` : "—"}  ` +
        `copy∩ ${hits}  ` +
        `${inked ? "" : "(draws nothing — the control)"}`
    );
  }

  // ── Gates ─────────────────────────────────────────────────────────────
  const fail = [];

  const unsettled = rows.filter((r) => !r.settled);
  if (unsettled.length)
    fail.push(
      `${unsettled.length} state(s) never reached their observable: ` +
        unsettled.map((r) => `${r.vp}/${r.theme}/${r.v}/${r.state}`).join(", ")
    );

  const errored = rows.filter((r) => r.errors > 0);
  if (errored.length) fail.push(`${errored.length} sample(s) logged a page error`);

  // The bands have to RESOLVE, or every band assertion below is vacuously
  // true against 0 — the seam spec's own first assertion, for the same
  // reason: these are ≤960 tokens and a shape above the gate has none.
  const noBands = rows.filter((r) => !(r.bands.top > 0) || !(r.bands.bottom > 0));
  if (noBands.length) fail.push(`--mobile-chrome-* did not resolve on ${noBands.length} sample(s)`);

  // v0 is the control: it must draw no candidate ink whatsoever.
  const v0 = rows.filter((r) => r.v === "v0" && r.ink.length > 0);
  if (v0.length) fail.push(`v0 (the control) mounted a candidate on ${v0.length} sample(s)`);

  // BAND.
  const outOfBand = rows.filter((r) => bandOf(r).startsWith("OUT"));
  if (outOfBand.length)
    fail.push(
      `candidate ink outside its band on ${outOfBand.length} sample(s): ` +
        outOfBand
          .slice(0, 6)
          .map((r) => {
            const claim = CLAIMED_BAND[r.v];
            const s = r.ink.find((i) =>
              claim === "top"
                ? i.rect.y + i.rect.h > r.bands.top + 1
                : i.rect.y < r.vh - r.bands.bottom - 1
            );
            return `${r.vp}/${r.theme}/${r.v}/${r.state} ${s?.key} y ${s?.rect.y.toFixed(1)}…${(
              (s?.rect.y ?? 0) + (s?.rect.h ?? 0)
            ).toFixed(1)}`;
          })
          .join(", ")
    );

  // CONTRAST — in both themes, which is the point of running both.
  const dim = [];
  for (const r of rows) {
    for (const i of r.ink) {
      if (typeof i.ratio !== "number") continue;
      if (i.ratio < INK_FLOOR)
        dim.push(
          `${r.vp}/${r.theme}/${r.v} ${i.key} ${i.ratio.toFixed(2)}:1 (${i.colour} on ${i.bed})`
        );
    }
  }
  if (dim.length)
    fail.push(
      `${dim.length} ink sample(s) under ${INK_FLOOR}:1 — ` +
        [...new Set(dim)].slice(0, 8).join(", ")
    );

  // COPY.
  const collided = rows.filter((r) => r.hits.length > 0);
  if (collided.length)
    fail.push(
      `candidate ink over runway copy on ${collided.length} sample(s): ` +
        collided
          .slice(0, 5)
          .map((r) => `${r.vp}/${r.theme}/${r.v}/${r.state} ${r.hits[0]}`)
          .join(", ")
    );

  /* LADDER — the detent table must be STRICTLY INCREASING. Two rows on one
     rung makes the strip stand still across a section change: the
     instrument saying nothing at the exact moment it has something to say,
     with nothing on screen and no error to explain it. `snapDetents` fixes
     it by construction; this is what proves the fix is live at every shape,
     since the table is MEASURED and a narrow phone re-measures it. */
  for (const r of rows) {
    if (!r.detents) continue;
    const seq = r.detents.split(",").map(Number);
    const bad = seq.some((n, i) => i > 0 && n <= seq[i - 1]) || seq.some((n) => n < 0 || n > 12);
    if (bad) fail.push(`${r.vp}/${r.theme}/${r.v}: detent table is not monotonic (${r.detents})`);
  }

  console.log("");
  if (fail.length) {
    console.log("GATES FAILED:");
    for (const f of [...new Set(fail)]) console.log("  ✗ " + f);
    process.exitCode = 1;
  } else {
    console.log(`GATES PASSED · ${rows.length} samples · stills in ${OUT}/`);
  }
} else {
  /* ══════════════════════════════════════════════════════════════════════
     --lab hud  ·  /test/hud-instruments-lab  —  UNCHANGED FROM HERE DOWN.
     ══════════════════════════════════════════════════════════════════════ */
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const rows = [];

  try {
    for (const vp of VIEWPORTS) {
      for (const v of VARIANTS) {
        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: vp.dsf,
          reducedMotion: MOTION ? "no-preference" : "reduce",
          colorScheme: "dark",
        });
        const page = await ctx.newPage();
        const errors = [];
        const note = (t) => !IGNORED_ERROR.test(t) && errors.push(t);
        page.on("pageerror", (e) => note(String(e)));
        page.on("console", (m) => m.type() === "error" && note(m.text()));

        await page.goto(`http://localhost:${PORT}/test/hud-instruments-lab?v=${v}&console=0`, {
          waitUntil: "domcontentloaded",
        });
        // The lab is live once the manifest controller has flushed its first
        // measured detent — the same gate production uses.
        // `attached`, not `visible`: `[data-rail-manifest-root]` is
        // `display: none` below 1100px and the whole rail below 960px — both
        // are correct states, not missing markup.
        await page.waitForSelector("[data-rail-manifest-root]", {
          state: "attached",
          timeout: 30_000,
        });
        await page.waitForFunction(
          () => document.querySelectorAll("#leftTicks .hud__rail__tick").length === 13
        );

        const m = await metrics(page);

        for (const st of STATES) {
          const top = Math.round(st.target(m));
          let settled = true;

          // A REAL scroll, and then a wait for it to ARRIVE. `scrollTo` is not
          // instant here — the page has smooth scrolling, so without this the
          // sample lands mid-flight (measured: `--hero-lift` read 0.71 at what
          // should have been the mid-corridor state).
          await page.evaluate((y) => window.scrollTo(0, y), top);
          await page
            .waitForFunction(
              (y) => {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                return Math.abs(window.scrollY - Math.min(y, max)) <= 2;
              },
              top,
              { timeout: 15_000 }
            )
            .catch(() => {
              settled = false;
            });

          // Then wait on the OBSERVABLE the state is defined by, never a sleep.
          await page
            .waitForFunction(
              (want) => {
                const de = document.documentElement;
                if (want.heroLift)
                  return de.style.getPropertyValue("--hero-lift") === want.heroLift;
                if (want.phase) return de.getAttribute("data-corridor-phase") === want.phase;
                return (
                  document.querySelector(".hud__nav__sector__name")?.textContent === want.readout
                );
              },
              st.want,
              { timeout: 8_000 }
            )
            .catch(() => {
              settled = false;
            });

          const h = await readHud(page);
          rows.push({ vp: vp.id, v, state: st.id, settled, ...h, errors: errors.length });

          await page.screenshot({
            path: `${OUT}/${vp.id}_${v}_${st.id}${MOTION ? "_motion" : ""}.png`,
            animations: "disabled",
          });
        }
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
  }

  // ── Report ────────────────────────────────────────────────────────────
  const pad = (s, n) =>
    String(s ?? "")
      .padEnd(n)
      .slice(0, n);
  console.log(
    [
      pad("viewport", 10),
      pad("v", 4),
      pad("state", 12),
      pad("station", 9),
      pad("phase", 9),
      pad("lift", 7),
      pad("readout", 10),
      pad("marks", 6),
      pad("clipTop", 9),
      pad("rail", 6),
      pad("dmnd", 5),
      "err",
    ].join(" ")
  );
  for (const r of rows) {
    console.log(
      [
        pad(r.vp, 10),
        pad(r.v, 4),
        pad(r.state, 12),
        pad(r.station, 9),
        pad(r.phase, 9),
        pad(r.heroLift, 7),
        pad(r.readout, 10),
        pad(r.marks, 6),
        pad(r.clipTop, 9),
        pad(r.railHidden ? "HIDDEN" : "shown", 6),
        pad(r.diamondPainted ? "yes" : "-", 5),
        r.errors,
      ].join(" ")
    );
  }

  // ── Gates ─────────────────────────────────────────────────────────────
  const fail = [];
  const anyNaN = rows.filter((r) => r.heroLift === "NaN" || r.heroLift === "");
  if (anyNaN.length) fail.push(`--hero-lift never resolved on ${anyNaN.length} sample(s)`);

  const unsettled = rows.filter((r) => !r.settled);
  if (unsettled.length)
    fail.push(
      `${unsettled.length} state(s) never reached their observable: ` +
        unsettled.map((r) => `${r.vp}/${r.v}/${r.state}`).join(", ")
    );

  // The hero curtain only exists with motion on: landing.css sets
  // `.hud__rail { clip-path: none }` under `prefers-reduced-motion`, so under
  // PRM the correct assertion is the opposite one — that the branch fired.
  if (MOTION) {
    const heroRows = rows.filter((r) => r.state === "1-hero" && !r.railHidden);
    if (heroRows.some((r) => r.clipTop === "0px"))
      fail.push("rail curtain already open at the hero — the reveal is not being judged");
    const pastHero = rows.filter((r) => r.state !== "1-hero" && !r.railHidden);
    if (pastHero.some((r) => r.clipTop !== "0px"))
      fail.push("rail curtain still clipped past the hero");
  } else if (rows.some((r) => !r.railHidden && r.clipTop !== "none")) {
    fail.push("reduced-motion did not disable the rail curtain clip");
  }

  const errored = rows.filter((r) => r.errors > 0);
  if (errored.length) fail.push(`${errored.length} sample(s) logged a page error`);

  const v0 = rows.filter((r) => r.v === "v0");
  if (v0.some((r) => r.marks > 0)) fail.push("v0 (the control) drew instrument marks");

  const small = rows.filter((r) => r.vp === "390x844");
  if (small.some((r) => !r.railHidden)) fail.push("rails not hidden at 390x844");
  if (small.some((r) => r.marks > 0))
    fail.push("marks drawn at 390x844 — should vanish with the rails");

  // Progressive disclosure: the mark count must never DECREASE as you go down.
  for (const vp of VIEWPORTS.map((x) => x.id)) {
    for (const v of VARIANTS) {
      const seq = rows.filter((r) => r.vp === vp && r.v === v).map((r) => r.marks);
      if (seq.length === 4 && (seq[3] < seq[1] || seq[1] < seq[0]))
        fail.push(`${vp} ${v}: mark count is not monotonic (${seq.join(" → ")})`);
    }
  }

  console.log("");
  if (fail.length) {
    console.log("GATES FAILED:");
    for (const f of fail) console.log("  ✗ " + f);
    process.exitCode = 1;
  } else {
    console.log(`GATES PASSED · ${rows.length} samples · stills in ${OUT}/`);
  }
}
