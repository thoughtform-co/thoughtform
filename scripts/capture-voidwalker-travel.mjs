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
 * Usage (dev server must already be running):
 *   node scripts/capture-voidwalker-travel.mjs [--port 3003] [--vp 1440x800]
 *        [--theme light] [--headless]
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/voidwalker-travel");
const HEADLESS = args.includes("--headless");
const THEME = argOf("--theme", "dark");
const [VW, VH] = argOf("--vp", "1440x800").split("x").map(Number);

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

const tag = (n) => `${OUT}/${VW}x${VH}_${THEME}_${n}.png`;
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
await page.goto(`http://localhost:${PORT}/?theme=${THEME}`, {
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
        z: cs.getPropertyValue("--vw-z").trim(),
        w: Math.round(box.width),
        h: Math.round(box.height),
        top: Math.round(box.top),
        bottom: Math.round(box.bottom),
      };
    });
    const painting = beats.filter((b) => !b.far && b.o > 0.01);
    return {
      p: Number(p.toFixed(4)),
      mode: st?.getAttribute("data-vw-mode") ?? null,
      stop: root?.getAttribute("data-vw-stop") ?? null,
      persp: stage ? getComputedStyle(stage).perspective : null,
      axis: root ? getComputedStyle(root).getPropertyValue("--vw-axis").trim() : null,
      year: root ? getComputedStyle(root).getPropertyValue("--vw-year").trim() : null,
      ambient: document.documentElement.getAttribute("data-services-ambient"),
      exit: document.documentElement.getAttribute("data-corridor-exit"),
      painting: painting.length,
      // The parked stop: the one at full opacity, which must FIT the
      // viewport or the reader cannot read it.
      parked: painting
        .filter((b) => b.o > 0.98)
        .map((b) => ({ id: b.id, top: b.top, bottom: b.bottom, h: b.h })),
      overflowing: painting.filter((b) => b.o > 0.98 && (b.top < 0 || b.bottom > vh)).map((b) => b.id),
    };
  });

const rows = [];
const base = g.runwayTop ?? 0;
const span = (g.runwayH ?? VH) - VH;
// Entry dive, then each stop's park, then the foot.
const marks = [
  ["entry-00", 0.0],
  ["entry-mid", 0.05],
  ["entry-end", 0.1],
];
for (let i = 0; i < 10; i++) {
  // Stop homes: ENTRY + ((i+0.5)/n)*(1 − ENTRY − FOOT)
  marks.push([`stop-${String(i).padStart(2, "0")}`, 0.1 + ((i + 0.5) / 10) * 0.78]);
}
marks.push(["foot", 0.97]);

for (const [name, frac] of marks) {
  await walkTo(Math.round(base + span * frac));
  const r = await readTravel();
  rows.push({ name, ...r });
  console.log(
    `${name.padEnd(10)} p=${String(r.p).padEnd(6)} stop=${String(r.stop).padEnd(3)} ` +
      `paint=${r.painting} year=${r.year} ambient=${r.ambient} parked=${r.parked.length} ` +
      `overflow=${r.overflowing.join(",") || "-"}`
  );
  await shot(name);
}

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
say(rows.some((r) => !r.persp || r.persp === "none"), "perspective missing on the stage");

console.log(`\n${bad.length ? "FAIL" : "PASS"}  ${OUT}`);
for (const b of bad) console.log("  ✗ " + b);
await browser.close();
process.exit(bad.length ? 1 : 0);
