/**
 * capture-proposition-v2 — one still per section of /test/proposition-v2,
 * after its arrival has played.
 *   node scripts/capture-proposition-v2.mjs [--port 3003] [--vp 1470x830]
 */
import { chromium } from "@playwright/test";
const args = process.argv.slice(2);
const argOf = (f, d) => (args.indexOf(f) >= 0 ? args[args.indexOf(f) + 1] : d);
const PORT = argOf("--port", "3003");
const [W, H] = argOf("--vp", "1470x830").split("x").map(Number);
const OUT = "docs/design/xbionic-proposal/v2";
const { mkdir } = await import("node:fs/promises");
await mkdir(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: W, height: H } });
await p.goto(`http://localhost:${PORT}/test/proposition-v2`, { waitUntil: "load", timeout: 180000 });
await p.waitForSelector("#plug .pl-fig", { timeout: 120000 });
await p.addStyleTag({ content: "nextjs-portal{display:none!important} html{scroll-behavior:auto!important}" });
for (const id of ["plug"]) {
  await p.evaluate((id) => window.scrollTo(0, document.getElementById(id).getBoundingClientRect().top + scrollY), id);
  await p.waitForTimeout(3200);
  const small = await p.evaluate((id) => {
    const out = [];
    for (const el of document.querySelectorAll(`#${id} text, #${id} span, #${id} p, #${id} h2, #${id} h3, #${id} div`)) {
      if (el.children.length && el.tagName !== "text") continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const k = el instanceof SVGElement && el.ownerSVGElement ? el.ownerSVGElement.getScreenCTM()?.a ?? 1 : 1;
      const px = fs * k;
      if (el.textContent.trim() && px < 11.95) out.push(`${el.textContent.trim().slice(0, 24)} ${px.toFixed(1)}`);
    }
    return out.slice(0, 12);
  }, id);
  await p.screenshot({ path: `${OUT}/v2-${id}-${W}x${H}.png` });
  console.log(id, "small:", JSON.stringify(small));
}
/* each step link under the flow lands on its own step in the stack */
for (const [i, id] of ["embed", "encode", "run"].entries()) {
  await p.evaluate((id) => {
    const a = document.getElementById(`step-${id}`);
    window.scrollTo(0, a.getBoundingClientRect().top + scrollY);
  }, id);
  await p.waitForTimeout(900);
  const step = await p.evaluate(() => document.querySelector("#embed .es")?.getAttribute("data-step"));
  console.log(`link ${id} → step ${step} (want ${i + 1})`);
}
/* the pinned stack: the intro, then each step */
for (const [name, f] of [["intro", 0.05], ["s1", 0.33], ["s2", 0.6], ["s3", 0.88]]) {
  await p.evaluate((f) => {
    const el = document.querySelector("#embed .es");
    const r = el.getBoundingClientRect();
    window.scrollTo(0, r.top + scrollY + f * (r.height - innerHeight));
  }, f);
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${OUT}/v2-embed-${name}-${W}x${H}.png` });
  console.log("embed", name);
}
await b.close();
