/**
 * capture-proposal-swarm-v2 — the case dossier, one still per figure: each
 * panel scrolled to the middle of the screen, as a reader meets it, with the
 * held column showing that panel's words (`data-cs-at` on the run).
 *
 * The page is asked for a still (`?still=1`): nothing rides a clock and the
 * films stand on their posters, so two shoots of one panel are the same
 * picture. `--twice` shoots everything again and says whether they are.
 * Each size also reports what a still cannot show: whether the held column
 * fits the screen, and whether anything is wider than the page.
 *
 * The dossier shows one case at a time (round 02), so each case is opened by
 * its own address (`?case=`) and shot in turn.
 *
 * Usage (dev server already running):
 *   node scripts/capture-proposal-swarm-v2.mjs --port 3031
 *     [--cut short|full] [--case loop,samako,suri]
 *     [--sizes 1920x1247,1976x966,1280x720,390x844] [--themes dark,light]
 *     [--out docs/design/proposal-swarm-v2/round-01] [--only case-loop-ask,…]
 *     [--twice]
 */

import { chromium } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3031");
const CUT = argOf("--cut", "short");
const CASES = argOf("--case", "loop,samako,suri").split(",").filter(Boolean);
const OUT = argOf("--out", "docs/design/proposal-swarm-v2/round-01");
const ONLY = argOf("--only", "").split(",").filter(Boolean);
const SIZES = argOf("--sizes", "1920x1247")
  .split(",")
  .map((s) => s.split("x").map(Number));
const THEMES = argOf("--themes", "dark").split(",");
const TWICE = args.includes("--twice");

const urlOf = (c) => {
  const query = new URLSearchParams({ still: "1", case: c });
  if (CUT !== "short") query.set("cut", CUT);
  return `http://localhost:${PORT}/test/proposal-swarm-v2?${query}`;
};

async function shoot(browser, dir) {
  await mkdir(dir, { recursive: true });
  const shot = [];
  const report = [];
  for (const theme of THEMES) {
    for (const [w, h] of SIZES) {
      const ctx = await browser.newContext({
        viewport: { width: w, height: h },
        deviceScaleFactor: 1,
        reducedMotion: "no-preference",
      });
      await ctx.addInitScript((t) => {
        try {
          if (t === "light") localStorage.setItem("tf-theme", "light");
          else localStorage.removeItem("tf-theme");
        } catch {}
      }, theme);
      const page = await ctx.newPage();
      page.on("pageerror", (e) => console.log(`! page error: ${e.message}`));
      const wide = w > 960;
      const sub = path.join(dir, `${theme}-${w}x${h}`);
      await mkdir(sub, { recursive: true });
      const fits = [];
      const panels = [];
      for (const c of CASES) {
        await page.goto(urlOf(c), { waitUntil: "load" });
        await page.waitForSelector(`#case-${c}`, { timeout: 240000 });
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({
          content:
            "nextjs-portal{display:none!important} html{scroll-behavior:auto!important} *,*::before,*::after{transition:none!important;animation:none!important}",
        });
        const these = await page.$$eval(".csd-panel", (els) =>
          els.map((el) => ({ id: el.id, i: Number(el.dataset.csI) }))
        );
        panels.push(...these);
        await shootPanels(these);
      }
      async function shootPanels(list) {
        for (const p of list) {
          if (ONLY.length && !ONLY.includes(p.id)) continue;
          /* a phone's panel is taller than the screen: shoot it from its top */
          await page.evaluate(
            ({ id, block }) => {
              document.getElementById(id)?.scrollIntoView({ block, behavior: "instant" });
            },
            { id: p.id, block: wide ? "center" : "start" }
          );
          if (wide) {
            await page
              .waitForFunction(
                ({ id, i }) => {
                  const run = document.getElementById(id)?.closest(".csd-run");
                  return run && Number(run.getAttribute("data-cs-at")) === i;
                },
                p,
                { timeout: 4000 }
              )
              .catch(() => console.log(`! ${p.id}: the held column did not change`));
          }
          /* the pictures in view, with a limit: a lazy one below the fold never loads */
          await page.evaluate(async (id) => {
            const imgs = [...(document.getElementById(id)?.querySelectorAll("img") ?? [])];
            const loaded = Promise.all(
              imgs.map((im) =>
                im.complete
                  ? null
                  : new Promise((r) => {
                      im.addEventListener("load", r, { once: true });
                      im.addEventListener("error", r, { once: true });
                    })
              )
            );
            await Promise.race([loaded, new Promise((r) => setTimeout(r, 3000))]);
          }, p.id);
          await page.waitForTimeout(120);
          const fit = await page.evaluate((id) => {
            const run = document.getElementById(id)?.closest(".csd-run");
            const stick = run?.querySelector(".csd-run__stick");
            const sb = stick?.getBoundingClientRect();
            /* the group (the case and its cards) must sit wholly on the screen,
               and the lit card must be the one of the figure in the middle */
            const gb = run?.querySelector(".csd-group")?.getBoundingClientRect();
            const lit = run?.querySelectorAll(".csd-cards .csd-card[data-on]").length ?? 0;
            const clash =
              gb && sb
                ? Math.round(Math.max(sb.top - gb.top, gb.bottom - window.innerHeight, 0))
                : 0;
            return {
              over: stick ? stick.scrollHeight - stick.clientHeight : 0,
              words: lit === 1 ? 0 : 1,
              clash,
              wider: document.documentElement.scrollWidth - window.innerWidth,
            };
          }, p.id);
          fits.push({ id: p.id, ...fit });
          const file = path.join(sub, `${p.id}.png`);
          await page.screenshot({ path: file });
          shot.push(file);
        }
      }
      const bad = fits.filter(
        (f) => (wide && (f.over > 0 || f.words > 0 || f.clash > 0)) || f.wider > 0
      );
      report.push(
        `${theme} ${w}x${h}: ${fits.length} panels` +
          (bad.length
            ? `; ${bad.map((f) => `${f.id} (column over ${f.over}px, lit cards wrong: ${f.words ? "yes" : "no"}, group off the screen by ${f.clash}px, page wider by ${f.wider}px)`).join("; ")}`
            : "; the held column fits, nothing overlaps in it, nothing is wider than the page")
      );
      await ctx.close();
    }
  }
  return { shot, report };
}

const browser = await chromium.launch();
const first = await shoot(browser, OUT);
for (const line of first.report) console.log(line);
console.log(`${first.shot.length} stills in ${OUT}`);
if (TWICE) {
  const again = await shoot(browser, path.join(OUT, "_twice"));
  let same = 0;
  for (let i = 0; i < first.shot.length; i++) {
    const [a, b] = await Promise.all([readFile(first.shot[i]), readFile(again.shot[i])]);
    if (a.equals(b)) same += 1;
    else console.log(`! differs: ${path.basename(first.shot[i])}`);
  }
  console.log(`twice: ${same} of ${first.shot.length} identical`);
}
await browser.close();
