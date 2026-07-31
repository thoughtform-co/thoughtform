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
 * Usage (dev server must already be running):
 *   node scripts/capture-hud-instruments.mjs [--port 3003] [--v v1,v2] [--motion]
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
const OUT = argOf("--out", "docs/design/hud-instruments");
const VARIANTS = argOf("--v", "v0,r1,r2,r3,v1,v5").split(",");
const MOTION = has("--motion");

const ALL_VIEWPORTS = [
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
              if (want.heroLift) return de.style.getPropertyValue("--hero-lift") === want.heroLift;
              if (want.phase) return de.getAttribute("data-corridor-phase") === want.phase;
              return document.querySelector(".hud__nav__sector__name")?.textContent === want.readout;
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
const pad = (s, n) => String(s ?? "").padEnd(n).slice(0, n);
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
if (small.some((r) => r.marks > 0)) fail.push("marks drawn at 390x844 — should vanish with the rails");

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
