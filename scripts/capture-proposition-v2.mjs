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
await p.goto(`http://localhost:${PORT}/test/proposition-v2`, {
  waitUntil: "load",
  timeout: 180000,
});
await p.waitForSelector("#plug .pl-fig", { timeout: 120000 });
await p.addStyleTag({
  content: "nextjs-portal{display:none!important} html{scroll-behavior:auto!important}",
});
for (const id of ["plug"]) {
  await p.evaluate(
    (id) => window.scrollTo(0, document.getElementById(id).getBoundingClientRect().top + scrollY),
    id
  );
  await p.waitForTimeout(3200);
  const small = await p.evaluate((id) => {
    const out = [];
    for (const el of document.querySelectorAll(
      `#${id} text, #${id} span, #${id} p, #${id} h2, #${id} h3, #${id} div`
    )) {
      if (el.children.length && el.tagName !== "text") continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const k =
        el instanceof SVGElement && el.ownerSVGElement
          ? (el.ownerSVGElement.getScreenCTM()?.a ?? 1)
          : 1;
      const px = fs * k;
      if (el.textContent.trim() && px < 11.95)
        out.push(`${el.textContent.trim().slice(0, 24)} ${px.toFixed(1)}`);
    }
    return out.slice(0, 12);
  }, id);
  await p.screenshot({ path: `${OUT}/v2-${id}-${W}x${H}.png` });
  console.log(id, "small:", JSON.stringify(small));
}
/* each label in the flow lands on its own step */
for (const [i, id] of ["embed", "encode", "run"].entries()) {
  await p.evaluate((id) => {
    const a = document.getElementById(`step-${id}`);
    window.scrollTo(0, a.getBoundingClientRect().top + scrollY);
  }, id);
  await p.waitForTimeout(1100);
  const on = await p.evaluate(() =>
    [...document.querySelectorAll("#embed .es-lines li")].findIndex((el) =>
      el.hasAttribute("data-on")
    )
  );
  console.log(`link ${id} → step ${on + 1} lit (want ${i + 1})`);
  await p.screenshot({ path: `${OUT}/v2-embed-${id}-${W}x${H}.png` });
}
/* nothing rises past the stage's top edge at any point on the runway (the
   stage carries no mask), and the steps sit level with the stage's middle */
let worst = Infinity;
for (let i = 0; i <= 40; i++) {
  const t = i / 40;
  await p.evaluate((t) => {
    const r = document.querySelector("#embed .es-runway").getBoundingClientRect();
    window.scrollTo(0, r.top + scrollY + t * (r.height - innerHeight));
  }, t);
  await p.waitForTimeout(60);
  const m = await p.evaluate(() => {
    const stage = document.querySelector("#embed .es-stage").getBoundingClientRect();
    let top = Infinity;
    for (const g of document.querySelectorAll("#embed .es-plate, #embed .es-call[data-on]"))
      top = Math.min(top, g.getBoundingClientRect().top);
    const list = document.querySelector("#embed .es-lines").getBoundingClientRect();
    return {
      air: top - stage.top,
      lift: list.top + list.height / 2 - (stage.top + stage.height / 2),
    };
  });
  worst = Math.min(worst, m.air);
  if (i === 0) console.log(`steps' middle vs stage's middle: ${m.lift.toFixed(1)}px`);
}
console.log(
  `least air above the plates on the runway: ${worst.toFixed(1)}px ${worst >= 0 ? "OK" : "RISES PAST THE TOP"}`
);
/* the plates mid-close, between Encode and Run */
await p.evaluate(() => {
  const r = document.querySelector("#embed .es-runway").getBoundingClientRect();
  window.scrollTo(0, r.top + scrollY + 0.78 * (r.height - innerHeight));
});
await p.waitForTimeout(900);
await p.screenshot({ path: `${OUT}/v2-embed-closing-${W}x${H}.png` });
/* the head of the steps section */
await p.evaluate(() => {
  const el = document.getElementById("embed");
  window.scrollTo(0, el.getBoundingClientRect().top + scrollY);
});
await p.waitForTimeout(900);
await p.screenshot({ path: `${OUT}/v2-embed-head-${W}x${H}.png` });
await b.close();
