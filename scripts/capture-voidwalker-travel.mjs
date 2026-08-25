/**
 * capture-voidwalker-travel — the VOIDWALKER TIME TUNNEL (ADR-081) on the
 * REAL landing: the #about → travel seam, the entry dive into the parked
 * brandmark, every stop at its park, and the foot.
 *
 * HEADED by default: the travel is a WebGL beat riding the corridor's own
 * canvas (the services ambient hold, extended), and headless leaves that
 * canvas dead — a headless run measures a DOM field over a black hole and
 * tells you nothing about the thing being built. Pass `--headless` to
 * check the DOM/geometry alone.
 *
 * Real scrolls, never a teleport (`.claude/rules/services-ring.md`): the
 * walk steps down in ≤0.5vh so every scroll-driven clock on the way in
 * (corridor exit, the pinned #about deck) runs in order.
 *
 * FLIGHT-GRAMMAR LAB (Phase 1 of the flight-grammar plan):
 *   • `--variant <name>` picks a `PRESETS` entry from
 *     `FlightLabPanel.tsx`. Names carry into the URL of
 *     `/test/voidwalker-flight-lab` verbatim.
 *   • `--all-variants` runs the shipped preset set into
 *     `docs/design/voidwalker-flight-lab/<preset>/` folders — one
 *     contact sheet per axis, ready for owner selection.
 *   • Any variant flag routes through `/test/voidwalker-flight-lab`
 *     instead of `/`; without a variant we still measure production.
 *
 * Usage (dev server must already be running):
 *   node scripts/capture-voidwalker-travel.mjs [--port 3003] [--vp 1440x800]
 *        [--theme light] [--headless] [--variant V2-noomo-swing]
 *        [--all-variants]
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const HEADLESS = args.includes("--headless");
const THEME = argOf("--theme", "dark");
const [VW, VH] = argOf("--vp", "1440x800").split("x").map(Number);
const VARIANT = argOf("--variant", "");
const ALL_VARIANTS = args.includes("--all-variants");
// Preset table mirrors `FlightLabPanel.tsx` PRESETS. Keep in sync if the
// panel gains a preset the owner wants captured — the source of truth is
// the panel; this table is what the CLI recognises.
const PRESET_URLS = {
  "V1-default": "",
  "V2-noomo-swing":
    "pathVariant=curved&curveBend=0.18&rollMax=8&xFar=0.32&xNear=0.78&rotMax=12",
  "V3-housed":
    "pathVariant=housed&curveBend=0.14&rollMax=6&xFar=0.28&xNear=0.7&rotMax=10",
  "populated-field": "span=5&fogIn=0.88&fogOut=0.36&wallDensityMul=1.35",
  "slow-cinema": "tauSeconds=0.32&runwaySvh=18",
  "entry-burst": "entryReactionStrength=1&velocityStrength=1",
};
const DEFAULT_OUT =
  VARIANT || ALL_VARIANTS
    ? "docs/design/voidwalker-flight-lab"
    : "docs/design/voidwalker-travel";
const OUT = argOf("--out", DEFAULT_OUT);

// ⚠ `--all-variants` is delegated: it is a subprocess loop over the
// preset table, spawning THIS script with `--variant <name>` each time.
// Nested loops in one browser were a maintenance mess; a subprocess per
// preset keeps each run's context, page, and error collectors clean and
// makes the CLI honest about its output layout (`OUT/<preset>/…`).
if (ALL_VARIANTS) {
  const { spawnSync } = await import("node:child_process");
  const script = new URL(import.meta.url).pathname;
  // On Windows the pathname begins with `/C:/…`; strip the leading slash.
  const localScript = process.platform === "win32" ? script.replace(/^\//, "") : script;
  let anyFailed = false;
  for (const preset of Object.keys(PRESET_URLS)) {
    const outDir = `${OUT}/${preset}`;
    console.log(`\n── ${preset} → ${outDir}`);
    const forwarded = ["--variant", preset, "--out", outDir, "--port", PORT, "--vp", `${VW}x${VH}`, "--theme", THEME];
    if (HEADLESS) forwarded.push("--headless");
    const r = spawnSync(process.execPath, [localScript, ...forwarded], {
      stdio: "inherit",
      env: process.env,
    });
    if (r.status !== 0) anyFailed = true;
  }
  process.exit(anyFailed ? 1 : 0);
}

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: HEADLESS });
const ctx = await browser.newContext({
  viewport: { width: VW, height: VH },
  reducedMotion: "no-preference",
  colorScheme: THEME === "light" ? "light" : "dark",
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

const label = VARIANT || "prod";
const tag = (n) => `${OUT}/${VW}x${VH}_${THEME}_${label}_${n}.png`;
const shot = (n) => page.screenshot({ path: tag(n) });

/** Scroll in real steps so every scroll-driven clock sees the travel. */
async function walkTo(y) {
  await page.evaluate(async (target) => {
    const step = Math.max(80, window.innerHeight * 0.5);
    const dir = Math.sign(target - window.scrollY) || 1;
    while (Math.abs(target - window.scrollY) > step) {
      window.scrollTo(0, window.scrollY + dir * step);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    window.scrollTo(0, target);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, y);
  await page.waitForTimeout(220);
}

// ⚠ `colorScheme` alone does NOT flip this site — the theme travels as an
// explicit `data-theme` attribute set pre-paint from `?theme=` or storage
// (ADR-058), so a context-level colour scheme captures dark twice and
// reports a light pass that never happened.
//
// Preset routing: any preset picks the flight lab route so the panel
// applies the config; production defaults capture the marketing page.
function urlFor(preset) {
  const params = new URLSearchParams();
  params.set("theme", THEME);
  const presetParams = preset ? PRESET_URLS[preset] : "";
  if (presetParams) {
    for (const kv of presetParams.split("&")) {
      const [k, v] = kv.split("=");
      if (k && v) params.set(k, v);
    }
  }
  const path = preset ? "/test/voidwalker-flight-lab" : "/";
  return `http://localhost:${PORT}${path}?${params.toString()}`;
}
await page.goto(urlFor(VARIANT), {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
// The corridor is lazy and inflates the page late — settle before measuring.
await page.waitForSelector(".home-v2-stage", { timeout: 60000 });
await page.waitForTimeout(2500);
await walkTo(600);
await page.waitForTimeout(1200);

/** Where the travel runway lives, once it has inflated. */
const geom = async () =>
  page.evaluate(() => {
    const st = document.querySelector("#voidwalker");
    const rw = document.querySelector(".vw-travel-root");
    const pr = document.querySelector("#practice");
    return {
      mode: st?.getAttribute("data-vw-mode") ?? null,
      stationTop: st ? st.getBoundingClientRect().top + scrollY : null,
      runwayTop: rw ? rw.getBoundingClientRect().top + scrollY : null,
      runwayH: rw ? rw.getBoundingClientRect().height : null,
      practiceTop: pr ? pr.getBoundingClientRect().top + scrollY : null,
      docH: document.documentElement.scrollHeight,
    };
  });

// Walk down to the station so the mode engages and the runway inflates.
let g = await geom();
await walkTo(Math.max(0, (g.stationTop ?? 9000) - VH * 1.5));
await page.waitForTimeout(900);
g = await geom();
console.log("geom:", JSON.stringify(g));

if (!g.runwayH || g.runwayH < VH * 5) {
  console.log("⚠ runway did not inflate — travel mode is not engaged");
}

/** Read the live travel state at the current scroll position. */
const readTravel = () =>
  page.evaluate(() => {
    const root = document.querySelector(".vw");
    const st = document.querySelector("#voidwalker");
    const rw = document.querySelector(".vw-travel-root");
    const stage = document.querySelector(".vw-travel-stage");
    const vh = window.innerHeight;
    const r = rw?.getBoundingClientRect();
    const travel = r ? r.height - vh : 0;
    const p = travel > 0 ? Math.max(0, Math.min(1, -r.top / travel)) : 0;
    const beats = [...document.querySelectorAll(".vw-beat")].map((b) => {
      const cs = getComputedStyle(b);
      const box = b.getBoundingClientRect();
      return {
        id: b.id,
        far: b.hasAttribute("data-vw-far"),
        o: Number(cs.opacity),
        blur: parseFloat(cs.getPropertyValue("--vw-blur")) || 0,
        z: cs.getPropertyValue("--vw-z").trim(),
        w: Math.round(box.width),
        h: Math.round(box.height),
        top: Math.round(box.top),
        bottom: Math.round(box.bottom),
        left: Math.round(box.left),
        right: Math.round(box.right),
      };
    });
    const painting = beats.filter((b) => !b.far && b.o > 0.01);
    const railEl = document.querySelector(".vw-rail");
    return {
      p: Number(p.toFixed(4)),
      mode: st?.getAttribute("data-vw-mode") ?? null,
      stop: root?.getAttribute("data-vw-stop") ?? null,
      persp: stage ? getComputedStyle(stage).perspective : null,
      // The date instrument is the HUD's own LEFT RAIL now, not a
      // bespoke axis in the gutter (owner, 2026-08-25) — so the marker
      // and the year readout are read off `.vw-rail`, and `railOn` is
      // the positional gate that must be false everywhere but here.
      axis: railEl ? getComputedStyle(railEl).getPropertyValue("--vw-axis").trim() : null,
      year: railEl ? railEl.getAttribute("data-yr") : null,
      lit: railEl ? (railEl.querySelector(".vw-rail__yr[data-now]")?.textContent ?? null) : null,
      railOn: railEl ? railEl.hasAttribute("data-on") : null,
      railYears: railEl ? railEl.querySelectorAll(".vw-rail__yr").length : 0,
      // One gold mark on the rail at a time: the journey diamond hands
      // over to the year car while the reader is inside the timeline.
      diamond: (() => {
        const d = document.querySelector("[data-rail-manifest-root]");
        return d ? Number(getComputedStyle(d).opacity) : null;
      })(),
      // The masthead types in as the wormhole opens and UN-types as the
      // first beat takes the plane (the masthead law). Anything still
      // lettered once the field is running is stranded copy printed
      // across the parked beat — measured, because it is invisible to
      // every geometry gate here.
      head: (() => {
        let n = 0;
        for (const el of document.querySelectorAll("[data-vw-decode]")) {
          n += (el.textContent ?? "").trim().length;
        }
        return n;
      })(),
      // ⚠ THE GHOST MUST PAINT NOTHING, IN BOTH THEMES. It is the layer
      // that survives the un-type, so an inherited colour here strands
      // the whole masthead on screen with the live layer reading empty
      // — which is exactly what a light-theme rule did.
      ghost: (() => {
        const g = document.querySelector(".vw-decode__ghost em, .vw-decode__ghost");
        return g ? getComputedStyle(g).color : null;
      })(),
      ambient: document.documentElement.getAttribute("data-services-ambient"),
      exit: document.documentElement.getAttribute("data-corridor-exit"),
      painting: painting.length,
      // The parked stop: the one at full opacity, which must FIT the
      // viewport or the reader cannot read it.
      parked: painting
        .filter((b) => b.o > 0.98)
        .map((b) => ({ id: b.id, top: b.top, bottom: b.bottom, h: b.h })),
      // ⚠ THE PAIR TEST — the one thing a park-only capture cannot see.
      // Two beats WILL overlap in the middle of a flight; that is depth.
      // What may not happen is two overlapping beats of the SAME weight,
      // which reads as two paragraphs printed over each other rather
      // than as one behind the other. For every intersecting pair, the
      // dimmer one has to be genuinely subordinate.
      crowded: (() => {
        const out = [];
        for (let i = 0; i < painting.length; i++) {
          for (let j = i + 1; j < painting.length; j++) {
            const a = painting[i];
            const b = painting[j];
            const hit =
              a.top < b.bottom && b.top < a.bottom && a.left < b.right && b.left < a.right;
            if (!hit) continue;
            const back = a.o <= b.o ? a : b;
            const front = a.o <= b.o ? b : a;
            if (front.o - back.o < 0.25 && back.blur < 1.8) {
              out.push(
                `${back.id}(o${back.o.toFixed(2)} b${back.blur.toFixed(1)})|` +
                  `${front.id}(o${front.o.toFixed(2)})`
              );
            }
          }
        }
        return out;
      })(),
      overflowing: painting
        .filter((b) => b.o > 0.98 && (b.top < 0 || b.bottom > vh))
        .map((b) => b.id),
    };
  });

const rows = [];
const base = g.runwayTop ?? 0;
const span = (g.runwayH ?? VH) - VH;
// Entry dive, then each stop's park, then the foot.
const marks = [
  // ⚠ ABOVE THE RUNWAY, and it is the only mark that proves a
  // POSITIONAL gate. `data-vw-mode` is set as soon as the path is
  // capable, so anything keyed on the mode is already true here — which
  // is exactly how ADR-081 U1 parked the camera at the tunnel mouth for
  // the whole page with every guard green.
  ["before", -0.12],
  ["entry-00", 0.0],
  ["entry-mid", 0.05],
  ["entry-end", 0.1],
];
for (let i = 0; i < 10; i++) {
  // Stop homes: ENTRY + ((i+0.5)/n)*(1 − ENTRY − FOOT)
  marks.push([`stop-${String(i).padStart(2, "0")}`, 0.1 + ((i + 0.5) / 10) * 0.78]);
}
// ⚠ MID-FLIGHT MARKS. Every other mark lands on a PARK, where a beat is
// centred and flat by construction — so a capture made only of parks
// cannot show the flight, which is the thing being judged. These sit half
// a stop off a home, with beats genuinely in transit.
marks.push(["flight-a", 0.1 + (3 / 10) * 0.78]);
marks.push(["flight-b", 0.1 + (6 / 10) * 0.78]);
marks.push(["foot", 0.97]);

for (const [name, frac] of marks) {
  await walkTo(Math.max(0, Math.round(base + span * frac)));
  const r = await readTravel();
  rows.push({ name, ...r });
  console.log(
    `${name.padEnd(10)} p=${String(r.p).padEnd(6)} stop=${String(r.stop).padEnd(3)} ` +
      `paint=${r.painting} year=${r.year} lit=${r.lit} rail=${r.railOn} dia=${r.diamond} ` +
      `head=${r.head} ambient=${r.ambient} parked=${r.parked.length} ` +
      `overflow=${r.overflowing.join(",") || "-"}`
  );
  await shot(name);
}

// ── The chase, measured live ─────────────────────────────
// ⚠ THE ONE THING A STILL CANNOT SHOW. The field and the camera have to
// be on ONE damped clock; before they were, the camera flew a smoothed
// value while the DOM beats were written from raw scroll, and the cards
// snapped with the wheel while the walls glided. Undamped, a beat's depth
// is final on the frame the scroll lands. Damped, it is still moving.
//
// So: jump, read the next frame, read again after the chase has settled.
// If those two are equal the damping is gone and nothing else here would
// notice.
await walkTo(Math.round(base + span * (0.1 + (2 / 10) * 0.78)));
const chase = await page.evaluate(async () => {
  const read = () => {
    const el = document.querySelector(".vw-beat:not([data-vw-far])");
    return el ? getComputedStyle(el).getPropertyValue("--vw-z").trim() : null;
  };
  window.scrollBy(0, Math.round(window.innerHeight * 1.2));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const first = read();
  await new Promise((r) => setTimeout(r, 600));
  return { first, settled: read() };
});
console.log(`chase      first=${chase.first} settled=${chase.settled}`);

// ── Gates ────────────────────────────────────────────────────────
const bad = [];
const say = (cond, msg) => {
  if (cond) bad.push(msg);
};
say(g.mode !== "travel", "travel mode never engaged");
say(!g.runwayH || g.runwayH < VH * 10, `runway too short (${Math.round(g.runwayH ?? 0)}px)`);
say(errors.length > 0, `page errors: ${errors.slice(0, 3).join(" | ")}`);
// The ambient canvas must survive the WHOLE travel — that is the seam.
const midRows = rows.filter((r) => r.name.startsWith("stop-"));
say(
  midRows.some((r) => r.ambient !== "true"),
  "ambient died mid-travel (the seam retarget is wrong)"
);
// Something must be painting at every stop.
say(
  midRows.some((r) => r.painting === 0),
  "a stop painted nothing"
);
// …and never more than the compositing budget.
say(
  rows.some((r) => r.painting > 3),
  `too many stops painting at once (${Math.max(...rows.map((r) => r.painting))})`
);
// A parked beat that does not fit the viewport cannot be read.
say(
  rows.some((r) => r.overflowing.length > 0),
  `parked beat overflows the viewport: ${rows.flatMap((r) => r.overflowing).join(",")}`
);
// The perspective must be a real derived px value, not the fallback.
say(
  rows.some((r) => !r.persp || r.persp === "none"),
  "perspective missing on the stage"
);
// ⚠ THE MASTHEAD MUST BE GONE once beats are flying. It is absolutely
// centred in the stage, so anything it still letters prints straight
// across the parked beat — and no geometry gate here can see it.
say(
  midRows.some((r) => r.head > 0),
  `the masthead is still lettering during the flight (${Math.max(...midRows.map((r) => r.head))} chars)`
);
say(
  rows.some((r) => r.ghost && !/rgba\(.*,\s*0\)$/.test(r.ghost)),
  `the decode ghost paints ink (${rows.find((r) => r.ghost && !/rgba\(.*,\s*0\)$/.test(r.ghost))?.ghost})`
);
say(
  rows.some((r) => r.crowded.length > 0),
  `beats print over each other at equal weight: ${[...new Set(rows.flatMap((r) => r.crowded))].join(", ")}`
);
say(
  !chase.first || !chase.settled || chase.first === chase.settled,
  `the field is not damped — depth was final on the scroll frame (${chase.first})`
);

// ── The rail is the time axis (owner, 2026-08-25) ──────────────
// The record's years are seated on the HUD's own ladder, a car travels
// it, and the journey diamond hands over so only one gold mark is on
// the rail at a time.
say(
  midRows.some((r) => r.railOn !== true),
  "the rail's date axis is not lit during the travel"
);
say(
  midRows.some((r) => !r.year),
  "the rail reads no year"
);
// ⚠ A LIT RUNG MAY NEVER DISAGREE WITH THE YEAR BEING READ. Not "a
// rung is always lit": the walk lands NEAR a stop's home, not on it, and
// between two years that are two apart (2020 and 2018) a few pixels of
// overshoot reads 2019 — a real year the reader passes through, with no
// rung of its own. Lighting nothing there is correct. Lighting the WRONG
// rung is the drift this is here to catch.
say(
  rows.some((r) => r.lit !== null && r.lit !== r.year),
  `a lit rung disagrees with the year: ${rows.find((r) => r.lit !== null && r.lit !== r.year)?.name}`
);
say(
  midRows.some((r) => r.railYears < 5),
  `the rail is missing its year rungs (${Math.min(...midRows.map((r) => r.railYears))})`
);
// ⚠ GOLD IS WAYFINDING — it marks ONE place. Two gold marks on one
// rail is the frame lying about where the reader is.
say(
  midRows.some((r) => (r.diamond ?? 0) > 0.05),
  "the journey diamond did not hand off to the year car"
);
// ⚠ AND THE HANDOFF MUST BE POSITIONAL, which only the `before` mark
// can show: a rail keyed on `data-vw-mode` would letter years for the
// whole document and fade the journey diamond on the hero, and every
// in-runway assertion above would still pass. ADR-081 U1's defect in a
// second place.
const beforeRow = rows.find((r) => r.name === "before");
say(
  beforeRow?.railOn !== false,
  "the rail is lit above the runway (the gate is modal, not positional)"
);
say((beforeRow?.diamond ?? 1) < 0.5, "the journey diamond is faded above the runway");

console.log(`\n${bad.length ? "FAIL" : "PASS"}  ${OUT}`);
for (const b of bad) console.log("  ✗ " + b);
await browser.close();
process.exit(bad.length ? 1 : 0);
