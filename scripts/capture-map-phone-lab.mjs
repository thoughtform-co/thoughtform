/**
 * capture-map-phone-lab — drives `/test/map-phone-lab` in single mode at real
 * phone viewports, GATES the three directions, records the shipped lists as a
 * findings ledger, and writes the review stills plus a contact sheet per
 * frame × theme.
 *
 * ⚠ THE VIEWPORTS ARE SET EXPLICITLY. `devices["iPhone 14"]` is 390×664, under
 * the pile's split rung (`min-height: 681px`), so an emulated iPhone would draw
 * the desktop card. 681 is the rung's floor and the CI proxy for the
 * toolbar-shown iPhone frame; 844 the toolbar-hidden iPhone 14; 932 the Pro Max.
 *
 * ⚠ `reducedMotion` MUST BE "no-preference" — the split rung and the console's
 * phone fallback both drop out under reduced motion.
 *
 * ⚠ THE DEFAULT IS THE FULL REGISTRY (the substrate lab's known hole: a
 * direction added later is ungated unless it is named). Waits are on the
 * readout's `data-stamp` (the identity the page measured) AND
 * `document.fonts.ready` — never a sleep, never the URL the script itself set.
 *
 * Gates (the three directions; `shipped` is the baseline and is reported):
 *   · the bay does not overflow — every reading fits ONE bay, no inner scroll;
 *   · no ink outside the bay;
 *   · type floors: mono chrome ≥ 10px, sans prose ≥ 12px, and the face
 *     resolves to PT Mono or PP Neue Montreal (a fallback face is a defect);
 *   · interactive targets ≥ 44px both ways;
 *   · no two text runs print through each other;
 *   · no page errors.
 *
 * Usage (the dev server must be running):
 *   node scripts/capture-map-phone-lab.mjs [--port 3003] [--v pick,rows] [--r work]
 *     [--presets p681,p844,p932] [--themes dark,light] [--out docs/design/map-phone-lab]
 */

import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { chromium } from "@playwright/test";

const require = createRequire(import.meta.url);
let sharp = null;
try {
  sharp = require("sharp");
} catch {
  sharp = null;
}

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const BASE = process.env.BASE_URL ?? `http://localhost:${PORT}`;
const OUT = argOf("--out", "docs/design/map-phone-lab");
const VARIANTS = argOf("--v", "shipped,pick,rows,deck").split(",");
const READINGS = argOf("--r", "work,configuration,layer").split(",");
const THEMES = argOf("--themes", "dark,light").split(",");
const PRESETS = argOf("--presets", "p681,p844,p932").split(",");
const SIZES = { p681: [390, 681], p844: [390, 844], p932: [430, 932] };
const LABEL = { shipped: "Shipped", pick: "One stream", rows: "Readout rows", deck: "Swipe deck" };

const IGNORED_ERROR = /upgrade-insecure-requests' is ignored when delivered in a report-only/;

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = [];
let failures = 0;

for (const preset of PRESETS) {
  const [w, h] = SIZES[preset];
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    reducedMotion: "no-preference",
  });
  for (const theme of THEMES) {
    for (const v of VARIANTS) {
      for (const r of READINGS) {
        const page = await ctx.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 200)));
        page.on("console", (m) => {
          if (m.type() === "error" && !IGNORED_ERROR.test(m.text()))
            errors.push(m.text().slice(0, 200));
        });
        const url = `${BASE}/test/map-phone-lab?solo=1&v=${v}&r=${r}&preset=${preset}&theme=${theme}`;
        await page.goto(url, { waitUntil: "domcontentloaded" });
        try {
          await page.waitForFunction(
            ([vv, rr, pp, tt]) => {
              const s = document.querySelector(".mpl-read")?.getAttribute("data-stamp") ?? "";
              return s.startsWith(`${vv}|${rr}|${pp}|${tt}|`);
            },
            [v, r, preset, theme],
            { timeout: 60_000 }
          );
        } catch {
          report.push({ preset, theme, v, r, fail: ["never settled"] });
          failures += 1;
          await page.close();
          continue;
        }
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(250);

        const m = await page.evaluate((isShipped) => {
          const bay = document.querySelector(".mpl-pile .pf-slot--field .pf-card__bay");
          if (!bay) return { missing: true };
          const b = bay.getBoundingClientRect();
          const root = isShipped ? bay.querySelector(".fl-pda__list") : bay.querySelector(".mpl-v");
          const overflow = root ? root.scrollHeight - root.clientHeight : NaN;
          // Text runs inside the bay, visible and on screen horizontally
          // within the bay's own box (a deck's off-screen cards are outside it).
          const runs = [];
          const walker = document.createTreeWalker(bay, NodeFilter.SHOW_TEXT);
          for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            if (!n.textContent || !n.textContent.trim()) continue;
            const el = n.parentElement;
            if (!el) continue;
            const cs = getComputedStyle(el);
            if (cs.visibility === "hidden" || cs.display === "none") continue;
            /* A run inside a scroll track (the deck) is clipped by the track,
               not by the bay: its next card PEEKS on purpose. Only ink the
               bay itself would cut is a fit defect. */
            let tracked = false;
            for (let a = el; a && a !== bay; a = a.parentElement) {
              const o = getComputedStyle(a);
              if (/(auto|scroll)/.test(o.overflowX)) {
                tracked = true;
                break;
              }
            }
            const range = document.createRange();
            range.selectNodeContents(n);
            for (const rr of range.getClientRects()) {
              if (rr.width < 1 || rr.height < 1) continue;
              if (rr.right <= b.left + 1 || rr.left >= b.right - 1) continue; // off the visible card
              runs.push({
                text: n.textContent.trim().slice(0, 28),
                x: rr.left,
                y: rr.top,
                r: rr.right,
                bo: rr.bottom,
                size: Number.parseFloat(cs.fontSize),
                family: cs.fontFamily,
                tracked,
              });
            }
          }
          const outside = runs.filter(
            (t) =>
              t.y < b.top - 1 ||
              t.bo > b.bottom + 1 ||
              (!t.tracked && (t.x < b.left - 1 || t.r > b.right + 1))
          );
          const small = runs.filter((t) => {
            const sans = /Neue Montreal/i.test(t.family);
            return sans ? t.size < 12 : t.size < 10;
          });
          const face = runs.filter((t) => !/PT Mono|Neue Montreal/i.test(t.family));
          const collide = [];
          for (let i = 0; i < runs.length; i += 1) {
            for (let j = i + 1; j < runs.length; j += 1) {
              const a = runs[i];
              const c = runs[j];
              const ox = Math.min(a.r, c.r) - Math.max(a.x, c.x);
              const oy = Math.min(a.bo, c.bo) - Math.max(a.y, c.y);
              if (ox > 1 && oy > 1) collide.push(`${a.text} x ${c.text}`);
            }
          }
          const hits = [...bay.querySelectorAll("button, [role='tab'], a")]
            .filter((el) => {
              const rr = el.getBoundingClientRect();
              return rr.width > 0 && rr.right > b.left + 1 && rr.left < b.right - 1;
            })
            .map((el) => {
              const rr = el.getBoundingClientRect();
              return { w: rr.width, h: rr.height, t: (el.textContent ?? "").trim().slice(0, 20) };
            });
          const tiny = hits.filter((t) => t.w < 43.5 || t.h < 43.5);
          // The shipped baseline's findings.
          const green = isShipped
            ? [...bay.querySelectorAll(".fl-pda__list-row > i")]
                .filter((el) => el.textContent === "\u25C6")
                .map((el) => getComputedStyle(el).color)
                .slice(0, 1)
            : [];
          const foot = isShipped ? bay.querySelector(".fl-pda__list-foot") : null;
          return {
            bay: { w: Math.round(b.width), h: Math.round(b.height) },
            overflow,
            runs: runs.length,
            outside: outside.map((t) => t.text).slice(0, 6),
            small: small.map((t) => `${t.text}@${t.size}`).slice(0, 6),
            face: face.map((t) => `${t.text}:${t.family.slice(0, 24)}`).slice(0, 4),
            collide: collide.slice(0, 6),
            tiny: tiny.map((t) => `${t.t}@${Math.round(t.w)}x${Math.round(t.h)}`).slice(0, 6),
            green,
            footPx: foot ? Number.parseFloat(getComputedStyle(foot).fontSize) : null,
          };
        }, v === "shipped");

        const file = `${OUT}/${preset}_${v}_${r}_${theme}.png`;
        await page.screenshot({ path: file });
        const fail = [];
        if (m.missing) fail.push("no bay");
        if (v !== "shipped" && !m.missing) {
          if (m.overflow > 1) fail.push(`overflows the bay by ${m.overflow}px`);
          if (m.outside.length) fail.push(`ink outside the bay: ${m.outside.join(" | ")}`);
          if (m.small.length) fail.push(`under the type floor: ${m.small.join(" | ")}`);
          if (m.face.length) fail.push(`a fallback face: ${m.face.join(" | ")}`);
          if (m.tiny.length) fail.push(`targets under 44px: ${m.tiny.join(" | ")}`);
          if (m.collide.length) fail.push(`text printing through text: ${m.collide.join(" | ")}`);
        }
        if (errors.length) fail.push(`page errors: ${errors.join(" | ")}`);
        if (fail.length) failures += 1;
        report.push({ preset, theme, v, r, file, ...m, fail });
        const tag = `${preset} ${theme.padEnd(5)} ${v.padEnd(7)} ${r.padEnd(13)}`;
        if (v === "shipped") {
          console.log(
            `${tag} bay ${m.bay?.w}x${m.bay?.h}  runs ${m.runs}  inner scroll ${m.overflow}px  foot ${m.footPx}px  mark ${m.green?.[0] ?? "-"}  (baseline)`
          );
        } else {
          console.log(
            `${tag} bay ${m.bay?.w}x${m.bay?.h}  runs ${m.runs}  overflow ${m.overflow}  ${fail.length ? "FAIL " + fail.join(" ; ") : "ok"}`
          );
        }
        await page.close();
      }
    }
  }
  await ctx.close();
}
await browser.close();

/* Contact sheets: one per frame × theme, rows = directions, columns = readings. */
if (sharp) {
  for (const preset of PRESETS) {
    const [w, h] = SIZES[preset];
    const cw = 300;
    const ch = Math.round((cw * h) / w);
    const pad = 24;
    const labelW = 150;
    for (const theme of THEMES) {
      const cells = [];
      VARIANTS.forEach((v, row) => {
        READINGS.forEach((r, col) => {
          const item = report.find(
            (x) => x.preset === preset && x.theme === theme && x.v === v && x.r === r && x.file
          );
          if (!item) return;
          cells.push({
            input: item.file,
            left: labelW + pad + col * (cw + pad),
            top: pad + 28 + row * (ch + pad),
            row,
          });
        });
      });
      if (!cells.length) continue;
      const width = labelW + pad + READINGS.length * (cw + pad);
      const height = pad + 28 + VARIANTS.length * (ch + pad);
      const bg = theme === "dark" ? "#0a0908" : "#ebe3d6";
      const ink = theme === "dark" ? "#ebe3d6" : "#0a0908";
      const labels = [
        ...READINGS.map(
          (r, col) =>
            `<text x="${labelW + pad + col * (cw + pad)}" y="${pad + 10}" font-family="monospace" font-size="14" fill="${ink}">${r.toUpperCase()}</text>`
        ),
        ...VARIANTS.map(
          (v, row) =>
            `<text x="${pad}" y="${pad + 28 + row * (ch + pad) + 20}" font-family="monospace" font-size="14" fill="${ink}">${(LABEL[v] ?? v).toUpperCase()}</text>`
        ),
      ].join("");
      const svg = Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${labels}</svg>`
      );
      const resized = await Promise.all(
        cells.map(async (c) => ({
          input: await sharp(c.input).resize(cw, ch).png().toBuffer(),
          left: c.left,
          top: c.top,
        }))
      );
      await sharp({ create: { width, height, channels: 3, background: bg } })
        .composite([...resized, { input: svg, left: 0, top: 0 }])
        .png()
        .toFile(`${OUT}/sheet_${preset}_${theme}.png`);
      console.log(`sheet ${OUT}/sheet_${preset}_${theme}.png`);
    }
  }
}

await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log(failures ? `\n${failures} sample(s) failed a gate` : "\nall gates green");
process.exitCode = failures ? 1 : 0;
