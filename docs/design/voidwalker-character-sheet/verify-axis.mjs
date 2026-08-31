// ⚠ ARCHIVED — THIS MEASURES A COMPOSITION THAT NO LONGER EXISTS. It walked
// the ADR-082 U11 character sheet (mirrored side columns, the era scrubber on
// the HUD rail); the datum rails replaced that and the losing composition was
// deleted (ADR-082 U19), so every `.vwh__rail` / `.vwh__pip` / `.vwh__side`
// selector below now matches nothing and the script reports empty rather than
// failing. Kept as the record of how this folder's stills were made. The live
// equivalents are `scripts/probe-voidwalker-eras.mjs` and
// `scripts/probe-datum-motion.mjs`.
//
// Verifies the time axis on the live stage: does the rule meet the HUD rails,
// do the two columns share their datums, does anything clip.
const { chromium } = await import(
  new URL("file:///C:/Users/buyss/Manifold Delta/Artifacts/01_thoughtform/node_modules/playwright/index.mjs").href
);

const VPS = (process.env.VPS ?? "1600x1256,1440x900,1280x720,1101x800")
  .split(",")
  .map((s) => { const [w, h] = s.split("x").map(Number); return { width: w, height: h }; });
const THEMES = (process.env.THEMES ?? "dark,light").split(",");
const OUT = process.env.OUT ?? ".";

const browser = await chromium.launch({ headless: false });
let bad = 0;

for (const theme of THEMES) {
  for (const viewport of VPS) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:3003/?theme=${theme}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-v2-stage", { timeout: 40000 });
    await page.waitForTimeout(2500);

    // walk into the hologram runway rather than teleporting - the corridor is
    // scroll-driven and a jump leaves every clock unsettled
    const target = await page.evaluate(() => {
      const r = document.querySelector(".vw--hologram");
      if (!r) return null;
      const top = r.getBoundingClientRect().top + window.scrollY;
      return top + 0.2 * (r.offsetHeight - window.innerHeight);
    });
    if (target == null) { console.log(`${theme} ${viewport.width}x${viewport.height}  NO RUNWAY`); await ctx.close(); continue; }

    await page.evaluate(async (t) => {
      const step = Math.max(80, window.innerHeight * 0.5);
      const dir = Math.sign(t - window.scrollY) || 1;
      while (Math.abs(t - window.scrollY) > step) {
        window.scrollTo(0, window.scrollY + dir * step);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
      window.scrollTo(0, t);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }, target);
    await page.waitForTimeout(700);

    const m = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const box = (s) => { const e = q(s); return e ? e.getBoundingClientRect() : null; };
      const rail = q(".vwh__rail");
      const railBox = rail?.getBoundingClientRect() ?? null;
      const hudL = q(".hud__rail--l .hud__rail__track")?.getBoundingClientRect() ?? null;
      const hudR = q(".hud__rail--r .hud__rail__track")?.getBoundingClientRect() ?? null;
      const stage = q(".vwh")?.getBoundingClientRect() ?? null;
      const pips = [...document.querySelectorAll(".vwh__pip")].map((p) => {
        const r = p.getBoundingClientRect();
        const nm = p.querySelector(".vwh__pip__name");
        return {
          on: p.dataset.on === "true", left: r.left, right: r.right, w: r.width, h: r.height,
          nameOpacity: nm ? getComputedStyle(nm).opacity : "-",
        };
      });
      const disc = q(".vwh__base__disc")?.getBoundingClientRect() ?? null;
      // clipping sweep over every text-bearing node in the sheet
      const clipped = [];
      const vwh = q(".vwh");
      if (vwh && stage) {
        for (const el of vwh.querySelectorAll("*")) {
          if (el.children.length || !el.textContent?.trim()) continue;
          const r = el.getBoundingClientRect();
          if (!r.width || !r.height) continue;
          if (r.left < stage.left - 0.5 || r.right > stage.right + 0.5 ||
              r.top < stage.top - 0.5 || r.bottom > stage.bottom + 0.5)
            clipped.push(`${el.className}@${Math.round(r.left)},${Math.round(r.top)}`);
        }
      }
      return {
        rail: railBox && { l: railBox.left, r: railBox.right, top: railBox.top, bottom: railBox.bottom },
        hudL: hudL && { x: hudL.left, bottom: hudL.bottom },
        hudR: hudR && { x: hudR.right, bottom: hudR.bottom },
        scope: box('[data-vwh-region="scope"] .vwh__panel'),
        facts: box('[data-vwh-region="record"] .vwh__panel'),
        onRecord: box('[data-slot="on-record"]'),
        transmission: box('[data-slot="transmission"]'),
        mast: box(".vwh__mast"),
        title: box(".vwh__mast__title"),
        figure: box(".vwh__slot"),
        disc: disc && { bottom: disc.bottom, left: disc.left, right: disc.right },
        pips, clipped: clipped.slice(0, 8),
        titleFs: getComputedStyle(q(".vwh__mast__title")).fontSize,
        aboutFs: q(".voidwalker__name") ? getComputedStyle(q(".voidwalker__name")).fontSize : "-",
      };
    });

    const tag = `${theme} ${viewport.width}x${viewport.height}`;
    const p = (n) => Math.round(n * 10) / 10;
    const fails = [];
    if (m.rail && m.hudL && m.hudR) {
      if (Math.abs(m.rail.l - m.hudL.x) > 3.5) fails.push(`axis left ${p(m.rail.l)} vs rail ${p(m.hudL.x)}`);
      if (Math.abs(m.rail.r - m.hudR.x) > 7) fails.push(`axis right ${p(m.rail.r)} vs rail ${p(m.hudR.x)}`);
      if (Math.abs(m.rail.top - m.hudL.bottom) > 3.5) fails.push(`axis rule ${p(m.rail.top)} vs rail foot ${p(m.hudL.bottom)}`);
    }
    // the mast and FACTS share row 1; SCOPE sits below the mast in row 2
    if (m.mast && m.facts && Math.abs(m.mast.top - m.facts.top) > 1.5)
      fails.push(`mast.top ${p(m.mast.top)} != facts.top ${p(m.facts.top)}`);
    if (m.scope && m.mast && m.scope.top <= m.mast.top + 40)
      fails.push(`scope.top ${p(m.scope.top)} not below mast ${p(m.mast.top)}`);
    if (m.onRecord && m.transmission && Math.abs(m.onRecord.top - m.transmission.top) > 1.5)
      fails.push(`onRecord.top ${p(m.onRecord.top)} != transmission.top ${p(m.transmission.top)}`);
    if (m.disc && m.rail && Math.abs(m.disc.bottom - m.rail.top) > 3)
      fails.push(`disc bottom ${p(m.disc.bottom)} not on rule ${p(m.rail.top)}`);
    if (m.titleFs !== m.aboutFs && m.aboutFs !== "-") fails.push(`title ${m.titleFs} != about name ${m.aboutFs}`);
    if (m.clipped.length) fails.push(`clipped: ${m.clipped.join(" ")}`);
    const onPip = m.pips.find((x) => x.on);
    if (m.pips.length !== 6) fails.push(`pips=${m.pips.length}`);
    if (m.pips.some((x) => x.h < 43.5)) fails.push(`pip height < 44`);
    if (onPip && onPip.nameOpacity !== "1") fails.push(`active name opacity ${onPip.nameOpacity}`);

    bad += fails.length;
    console.log(`${tag.padEnd(22)} ${fails.length ? "FAIL" : "ok  "} ` +
      `axis[${p(m.rail?.l)}..${p(m.rail?.r)} @${p(m.rail?.top)}] disc@${p(m.disc?.bottom)} ` +
      `mast@${p(m.mast?.top)} scope@${p(m.scope?.top)} facts@${p(m.facts?.top)} seats@${p(m.onRecord?.top)}/${p(m.transmission?.top)}`);
    fails.forEach((f) => console.log("      ! " + f));

    await page.screenshot({ path: `${OUT}/live-${theme}-${viewport.width}x${viewport.height}.png` });
    await ctx.close();
  }
}
await browser.close();
console.log(bad ? `\n${bad} problems` : "\nall green");
