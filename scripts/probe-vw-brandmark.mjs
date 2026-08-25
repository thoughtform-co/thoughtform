// What is the brandmark doing during the voidwalker entry dive?
// Walks the dive in small steps and reports the camera pose, the
// travel channels, and screenshots each step so we can SEE whether
// the mark is being flown through.
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT = "docs/design/voidwalker-flight-lab/entry-probe";
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 800 } });
const page = await ctx.newPage();

await page.goto("http://localhost:3003/?theme=dark", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".home-v2-stage", { timeout: 30000 });
await page.waitForTimeout(2500);

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
  await page.waitForTimeout(260);
}

await walkTo(600);
await page.waitForTimeout(1000);

const geom = await page.evaluate(() => {
  const rw = document.querySelector(".vw-travel-root");
  return {
    runwayTop: rw ? rw.getBoundingClientRect().top + scrollY : null,
    runwayH: rw ? rw.getBoundingClientRect().height : null,
  };
});
console.log("geom:", JSON.stringify(geom));

// Walk right up to the station, then step through the entry dive in
// fine increments so we can see the mark approach and (hopefully) pass.
const base = geom.runwayTop ?? 0;
const span = (geom.runwayH ?? 800) - 800;
await walkTo(Math.max(0, base - 800 * 2));
await page.waitForTimeout(800);

// Fine sampling across the dive itself: the earlier coarse walk showed
// the whole entry channel resolves between frac 0.02 and 0.10, so the
// pass-through was falling between two frames.
const marks = [
  ["a-pre", -0.06],
  ["b-000", 0.0],
  ["c-025", 0.025],
  ["d-030", 0.03],
  ["e-035", 0.035],
  ["f-040", 0.04],
  ["g-045", 0.045],
  ["h-050", 0.05],
  ["i-055", 0.055],
  ["j-060", 0.06],
  ["k-070", 0.07],
  ["l-090", 0.09],
];

for (const [name, frac] of marks) {
  await walkTo(Math.max(0, Math.round(base + span * frac)));
  const s = await page.evaluate(() => {
    const vw = document.getElementById("voidwalker");
    return {
      mode: vw?.getAttribute("data-vw-mode") ?? null,
      entry: getComputedStyle(
        document.querySelector(".vw-travel-stage") ?? document.body
      ).getPropertyValue("--vw-entry"),
      ambient: document.documentElement.hasAttribute("data-services-ambient"),
    };
  });
  console.log(`${name.padEnd(10)} entry=${String(s.entry).trim().padEnd(7)} mode=${s.mode} ambient=${s.ambient}`);
  await page.screenshot({ path: `${OUT}/${name}.png` });
}

await browser.close();
console.log(`\n→ ${OUT}`);
