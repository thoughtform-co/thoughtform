/**
 * probe-services-masthead-ink — the masthead's survey chrome, read at the park
 * (ADR-044, update of 2026-09-23).
 *
 * The 9.5px designations, the state chip and the title's gold line are text
 * the mechanical gate cannot see: the chrome is `display: none` under PRM and
 * `opacity: 0` until the stage parks on a plain run, and the gate does not
 * scroll. This rolls to `#services` with real wheel steps, waits for the
 * masthead's decode (`data-reveal` typing → done), reads the COMPUTED colours
 * of those elements and runs the gate's own arithmetic on them against body's
 * background — the ground the gate composites on. It prints every ratio,
 * shoots the masthead band per theme, and exits 1 when one of the three moved
 * elements sits under its floor (4.5 for the 9.5px chrome, 3 for the
 * display-size em line). The 8px coord stamps are printed and not judged:
 * they are faint by the survey grammar, an owner call.
 *
 * ⚠ HEADED — the corridor is WebGL; a headless context leaves the canvas dead
 * and the park unreached. ⚠ Nothing in CI runs this: a designation alpha that
 * drifts back under the floor fails no test until someone runs it.
 *
 *   node scripts/probe-services-masthead-ink.mjs
 *   node scripts/probe-services-masthead-ink.mjs --theme light --vp 1920x1247 --port 3003
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const THEMES = argOf("--theme", "both") === "both" ? ["dark", "light"] : [argOf("--theme", "dark")];
const PORT = argOf("--port", "3003");
const [VW, VH] = argOf("--vp", "1440x900").split("x").map(Number);
const OUT = argOf("--out", ".cursor/services-masthead-ink");
mkdirSync(OUT, { recursive: true });

/** The elements this pass moved, with the gate's floor for each. */
const JUDGED = [
  ["desig", ".services-masthead__desig", 4.5],
  ["state", ".services-masthead__state", 4.5],
  ["em", ".services-masthead__title-line--em", 3],
];
const PRINTED = [["coord", ".services-masthead__coord", null]];

const browser = await chromium.launch({ headless: false });
let under = 0;
try {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({
      viewport: { width: VW, height: VH },
      reducedMotion: "no-preference",
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
    await page.goto(`http://localhost:${PORT}/?theme=${theme}`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForSelector(".home-v2-stage", { timeout: 120000 });
    await page.waitForTimeout(2500);
    await page.mouse.move(Math.round(VW / 2), Math.round(VH / 2));

    // Real wheel steps down to the park: the decode needs the clock AND the
    // park observer, and a teleport skips the corridor's engagement band.
    let reveal = null;
    for (let i = 0; i < 600 && reveal !== "typing" && reveal !== "done"; i++) {
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(40);
      reveal = await page.evaluate(
        () => document.querySelector(".services-masthead")?.getAttribute("data-reveal") ?? null
      );
    }
    if (reveal !== "typing" && reveal !== "done") {
      console.log(`\n${theme}: the masthead never decoded (data-reveal=${reveal}); nothing read.`);
      under += 1;
      await ctx.close();
      continue;
    }
    // The decode is ~0.9s and the chrome fades in over 620ms.
    await page.waitForTimeout(2600);

    const read = await page.evaluate(
      ({ judged, printed }) => {
        const srgb = (c) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        const lum = ({ r, g, b }) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
        const parse = (c) => {
          const m = c.match(/rgba?\(([^)]+)\)/);
          if (!m) return null;
          const q = m[1].split(/[,/]/).map((x) => parseFloat(x.trim()));
          return { r: q[0], g: q[1], b: q[2], a: q[3] ?? 1 };
        };
        const composite = (fg, bg) => {
          const a = fg.a ?? 1;
          return {
            r: fg.r * a + bg.r * (1 - a),
            g: fg.g * a + bg.g * (1 - a),
            b: fg.b * a + bg.b * (1 - a),
          };
        };
        const contrast = (fg, bg) => {
          const l1 = lum(fg);
          const l2 = lum(bg);
          const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
          return (hi + 0.05) / (lo + 0.05);
        };
        const bodyBg = getComputedStyle(document.body).backgroundColor;
        const bg = parse(bodyBg);
        const m = document.querySelector(".services-masthead");
        const one = ([key, sel, floor]) => {
          const el = m.querySelector(sel);
          if (!el) return { key, missing: true, floor };
          const cs = getComputedStyle(el);
          const fg = parse(cs.color);
          return {
            key,
            text: (el.textContent ?? "").trim().slice(0, 32),
            color: cs.color,
            size: cs.fontSize,
            opacity: cs.opacity,
            ratio: fg && bg ? +contrast(composite(fg, bg), bg).toFixed(2) : null,
            floor,
          };
        };
        return {
          reveal: m.getAttribute("data-reveal"),
          bodyBg,
          rows: [...judged.map(one), ...printed.map(one)],
        };
      },
      { judged: JUDGED, printed: PRINTED }
    );

    console.log(`\n${theme} @ ${VW}x${VH}  data-reveal=${read.reveal}  ground ${read.bodyBg}`);
    for (const r of read.rows) {
      if (r.missing) {
        console.log(`  ${r.key.padEnd(6)} MISSING`);
        if (r.floor) under += 1;
        continue;
      }
      const verdict = r.floor == null ? "printed" : r.ratio >= r.floor ? "ok" : "UNDER";
      if (verdict === "UNDER") under += 1;
      console.log(
        `  ${r.key.padEnd(6)} ${String(r.ratio).padStart(5)}:1  floor ${r.floor ?? "—"}  ${verdict.padEnd(7)} ` +
          `${r.color} at ${r.size} (opacity ${r.opacity})  "${r.text}"`
      );
    }
    if (errors.length) console.log(`  ⚠ page errors: ${errors.join(" | ")}`);

    const clip = await page.evaluate(() => {
      const m = document.querySelector(".services-masthead");
      const a = m.querySelector(".services-masthead__lead").getBoundingClientRect();
      const b = m.querySelector(".services-masthead__intro").getBoundingClientRect();
      const x0 = Math.max(0, Math.min(a.left, b.left) - 70);
      const y0 = Math.max(0, Math.min(a.top, b.top) - 70);
      const x1 = Math.min(innerWidth, Math.max(a.right, b.right) + 70);
      const y1 = Math.min(innerHeight, Math.max(a.bottom, b.bottom) + 70);
      return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
    });
    const still = `${OUT}/masthead-${theme}-${VW}x${VH}.png`;
    await page.screenshot({ path: still, clip });
    console.log(`  still -> ${still}`);
    await ctx.close();
  }
} finally {
  await browser.close();
}
if (under > 0) {
  console.log(`\n${under} reading(s) under the floor.`);
  process.exit(1);
}
console.log("\nevery judged element clears its floor.");
