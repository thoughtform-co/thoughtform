/**
 * probe-datum-motion — assert the ported entry/exit choreography actually
 * runs on the datum branch, at real scroll positions on the live landing.
 *
 * The port is only real if three things are true at once: the actors are
 * INVISIBLE before the entry ramp, they are OPAQUE and untranslated at rest,
 * and they are OFF-SCREEN before the sticky releases. A rule that computes
 * correctly and never reaches its element passes none of those and errors on
 * nothing — which is the failure mode this whole surface keeps having.
 */
import { chromium } from "@playwright/test";

const PORT = process.argv.includes("--port")
  ? process.argv[process.argv.indexOf("--port") + 1]
  : "3003";

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`http://localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#voidwalker .vw", { timeout: 90_000 });
await page.locator(".home-v2-stage").first().scrollIntoViewIfNeeded().catch(() => {});
await page.waitForTimeout(1200);

const geom = await page.evaluate(() => {
  const r = document.querySelector("#voidwalker .vw");
  return { top: r.getBoundingClientRect().top + window.scrollY, travel: r.offsetHeight - innerHeight };
});

const sample = async (at) => {
  await page.evaluate(async (to) => {
    let y = window.scrollY;
    while (Math.abs(to - y) > 600) {
      y += Math.sign(to - y) * 600;
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 70));
    }
    window.scrollTo(0, to);
  }, Math.round(geom.top + at * geom.travel));
  await page.waitForTimeout(900);
  return page.evaluate(() => {
    const root = document.querySelector("#voidwalker .vwd");
    const cs = (s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const c = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { op: +(+c.opacity).toFixed(3), tx: c.transform === "none" ? 0 : Math.round(new DOMMatrix(c.transform).m41), x: Math.round(r.left) };
    };
    return {
      in: +(getComputedStyle(root).getPropertyValue("--vwh-in") || 0),
      exit: +(getComputedStyle(root).getPropertyValue("--vwh-exit") || 0),
      morph: +(getComputedStyle(root).getPropertyValue("--vwh-morph") || 0),
      mast: cs(".vwd__mast"),
      title: cs(".vwd__mast__title"),
      scopeHead: cs('.vwd__head[data-cell="ul"]'),
      factsHead: cs('.vwd__head[data-cell="ur"]'),
      rail: cs('.vwd__rail[data-rail="upper"]'),
      figure: cs(".vwd__figure"),
      band: cs(".vwd__band"),
      chip1: cs(".vwd__chip:nth-child(1)"),
      slot: cs(".vwh__slot"),
    };
  });
};

for (const at of [0.0, 0.06, 0.12, 0.2, 0.45, 0.8, 0.9, 0.96]) {
  const s = await sample(at);
  console.log(`at ${at.toFixed(2)}  in=${s.in.toFixed(3)} exit=${s.exit.toFixed(3)} morph=${s.morph.toFixed(3)}`);
  console.log(
    `   mast op=${s.mast.op} tx=${s.mast.tx} | title op=${s.title.op} | scope op=${s.scopeHead.op} tx=${s.scopeHead.tx} | facts op=${s.factsHead.op} tx=${s.factsHead.tx}`
  );
  console.log(
    `   rail op=${s.rail.op} tx=${s.rail.tx} | figure tx=${s.figure.tx} | band tx=${s.band.tx} chip1 op=${s.chip1.op} | slot op=${s.slot.op}`
  );
}

await browser.close();
