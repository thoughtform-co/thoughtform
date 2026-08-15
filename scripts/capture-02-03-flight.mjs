import { chromium } from "@playwright/test";

const OUT = "docs/design/map-readings-round4";
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  reducedMotion: "no-preference",
  colorScheme: "dark",
});
const page = await ctx.newPage();
await page.goto("http://localhost:3003/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".home-v2-stage", { timeout: 60_000 });
const target = await page.evaluate(() => {
  const runway = document.querySelector(".services-stage-root");
  if (!runway) return null;
  const rect = runway.getBoundingClientRect();
  const top = rect.top + window.scrollY;
  const travel = Math.max(0, rect.height - window.innerHeight);
  return Math.round(top + Math.min(travel, window.innerHeight * 3.2) * 0.09);
});
await page.evaluate((y) => window.scrollTo(0, y), target);
await page.waitForTimeout(700);
await page.waitForSelector("[data-proof-settled]", { timeout: 30_000 });
await page.waitForSelector(".fl-pda__svg", { timeout: 30_000 });
await page.waitForTimeout(900);
const hit = page.locator(".fl-pda-hit").nth(5);
await hit.click({ force: true });
await page.waitForTimeout(600);
const box2 = await page.evaluate(() => {
  const dock = document.querySelector(".fl-pda-dock");
  if (!dock) return null;
  const b = dock.getBoundingClientRect();
  return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
});
/* Click the SUBSTRATE tab. */
await page.locator(".fl-con__stn").nth(2).click();
await page.waitForTimeout(120);
await page.locator(".fl-con__console").screenshot({
  path: `${OUT}/1280x720_dark_02-to-03-flight-120ms.png`,
});
await page.waitForTimeout(500);
const box3 = await page.evaluate(() => {
  const dock = document.querySelector(".fl-pda-dock");
  if (!dock) return null;
  const b = dock.getBoundingClientRect();
  return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
});
await page.locator(".fl-con__console").screenshot({
  path: `${OUT}/1280x720_dark_02-to-03-settled.png`,
});
console.log("reading-02 card box:", JSON.stringify(box2));
console.log("reading-03 card box:", JSON.stringify(box3));
if (box2 && box3) {
  const dx = box3.x - box2.x;
  const dy = box3.y - box2.y;
  const dw = box3.w - box2.w;
  const dh = box3.h - box2.h;
  console.log(`delta: dx=${dx} dy=${dy} dw=${dw} dh=${dh}`);
}
await browser.close();
