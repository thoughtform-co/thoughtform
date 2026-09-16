/**
 * capture-services-mobile — the services beat on a PHONE (ADR-108 / ADR-109):
 * the band's composition (h1 above the ring, the paragraph below), the ring
 * at three beats, and the front card TURNED OVER (ADR-110). Stills for the
 * owner's read, plus the numbers the composition is solved against.
 *
 *   PW_CHROMIUM=/opt/pw-browsers/chromium node scripts/capture-services-mobile.mjs --theme dark
 *   node scripts/capture-services-mobile.mjs --theme light --vp 430x932 --out .cursor/services-mobile
 *
 * Emulated iPhone on Chromium (the WebKit descriptors cannot reach the dev
 * server — `.claude/rules/mobile-sections.md` "Verifying"); headless on
 * SwiftShader, which renders the corridor. ⚠ Emulation has no real GPU and
 * lays the page out ~421px wide (ADR-107): the numbers are read, the frame
 * rate is the device's.
 */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const THEME = argOf("--theme", "dark");
const [VW, VH] = argOf("--vp", "390x844").split("x").map(Number);
const OUT = argOf("--out", `.cursor/services-mobile/${THEME}-${VW}x${VH}`);
const PORT = argOf("--port", "3003");
const STOPS = (argOf("--stops", "0.3,0.55,0.8") || "").split(",").map(Number);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PW_CHROMIUM || undefined,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const ctx = await browser.newContext({
  viewport: { width: VW, height: VH },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto(`http://localhost:${PORT}/${THEME === "light" ? "?theme=light" : ""}`, {
  waitUntil: "domcontentloaded",
});
await page.waitForSelector(".services-stage", { timeout: 60_000 });
await page.waitForTimeout(1500);

const settle = async () => {
  await page.evaluate(
    async () =>
      new Promise((res) => {
        const t0 = performance.now();
        let last = scrollY;
        let still = 0;
        const tick = () => {
          still = Math.abs(scrollY - last) < 0.5 ? still + 1 : 0;
          last = scrollY;
          if (still >= 3 || performance.now() - t0 > 1600) res();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      })
  );
};
const roll = async (y) => {
  await page.evaluate(async (t) => {
    const step = Math.max(300, innerHeight * 0.5);
    let a = scrollY;
    while (Math.abs(t - a) > step) {
      a += Math.sign(t - a) * step;
      scrollTo(0, a);
      await new Promise((r) => requestAnimationFrame(r));
    }
    scrollTo(0, t);
  }, y);
  await settle();
};
const bandTop = () =>
  page.evaluate(() => {
    const el = document.querySelector(".svc-ring-runway");
    return el ? el.getBoundingClientRect().top + scrollY : NaN;
  });
/** Seat the band at fraction `p` of its own scroll, converging on its rect. */
const seatBand = async (p) => {
  for (let pass = 0; pass < 5; pass += 1) {
    const target = await page.evaluate((frac) => {
      const el = document.querySelector(".svc-ring-runway");
      if (!el) return NaN;
      const r = el.getBoundingClientRect();
      const vh = document.documentElement.clientHeight;
      return Math.round(r.top + scrollY + frac * (r.height - vh));
    }, p);
    if (Number.isNaN(target)) return;
    await roll(target);
    await page.waitForTimeout(300);
    const landed = await page.evaluate(() => {
      const r = document.querySelector(".svc-ring-runway").getBoundingClientRect();
      return -r.top / Math.max(1, r.height - document.documentElement.clientHeight);
    });
    if (Math.abs(landed - p) < 0.02) return;
  }
};
const read = () =>
  page.evaluate(() => {
    const rect = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: +r.left.toFixed(1),
        y: +r.top.toFixed(1),
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
      };
    };
    return {
      vw: document.documentElement.clientWidth,
      vh: document.documentElement.clientHeight,
      step: document.querySelector(".services-stage")?.getAttribute("data-active-step"),
      open: document.querySelector(".services-stage")?.getAttribute("data-plate-open"),
      title: rect(".svc-ring-band .services-masthead__title"),
      seat: rect(".svc-ring-seat"),
      intro: rect(".svc-ring-band .services-masthead__intro"),
      front: rect(".svc-ring-hits__hit--front"),
      turned: document.querySelector(".svc-ring-hits__hit--front")?.dataset.back === "1",
      close: rect(".svc-ring-hits__hit--close"),
      cta: rect(".svc-ring-hits__hit--cta"),
      plates: document.querySelectorAll(".svc-plate").length,
    };
  });

// Warm the lazy corridor so the document has its real height.
await roll(await bandTop());
await page.waitForTimeout(800);

for (const p of STOPS) {
  await seatBand(p);
  await page.waitForTimeout(600);
  const r = await read();
  console.log(
    `band ${p.toFixed(2)}  step ${r.step}  title ${JSON.stringify(r.title)}  seat ${JSON.stringify(r.seat)}  front ${JSON.stringify(r.front)}  intro ${JSON.stringify(r.intro)}  plates ${r.plates}`
  );
  await page.screenshot({ path: `${OUT}/band-${p.toFixed(2)}.png` });
}

// The turn (ADR-110): tap the front card at the middle stop, shoot it
// mid-turn and turned, then turn it back with the ✕.
await seatBand(0.55);
await page.waitForTimeout(600);
const front = await read();
if (front.front) {
  await page.mouse.click(front.front.x + front.front.w / 2, front.front.y + front.front.h / 2);
  await page.waitForTimeout(220);
  await page.screenshot({ path: `${OUT}/back-mid.png` });
  await page.waitForTimeout(800);
  const r = await read();
  console.log(
    `turned ${r.turned}  data-plate-open ${r.open}  front ${JSON.stringify(r.front)}  close ${JSON.stringify(r.close)}  cta ${JSON.stringify(r.cta)}`
  );
  await page.screenshot({ path: `${OUT}/back-open.png` });
  const close = await page.$(".svc-ring-hits__hit--close");
  if (close) {
    await close.click();
    await page.waitForTimeout(800);
    console.log(
      `turned back  data-plate-open ${(await read()).open}  turned ${(await read()).turned}`
    );
  }
} else {
  console.log("⚠ no front hit target at 0.55 — the ring did not publish");
}

await browser.close();
console.log(`stills in ${OUT}`);
