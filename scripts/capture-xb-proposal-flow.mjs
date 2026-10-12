/**
 * capture-xb-proposal-flow — the X-Bionic proposal's opening since
 * 2026-10-12: the plug flow (`#vision`), the steps (`#adoption`) and the
 * first job card, shot on the real page.
 *   node scripts/capture-xb-proposal-flow.mjs [--port 3003] [--vp 1470x830] [--theme dark]
 */
import { chromium } from "@playwright/test";
const args = process.argv.slice(2);
const argOf = (f, d) => (args.indexOf(f) >= 0 ? args[args.indexOf(f) + 1] : d);
const PORT = argOf("--port", "3003");
const [W, H] = argOf("--vp", "1470x830").split("x").map(Number);
const THEME = argOf("--theme", "dark");
const OUT = "docs/design/xbionic-proposal/v2";
const tag = `${W}x${H}${THEME === "light" ? "-light" : ""}`;
const { mkdir } = await import("node:fs/promises");
await mkdir(OUT, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: H } });
await ctx.addInitScript((t) => {
  try {
    localStorage.setItem("tf-theme", t);
  } catch {}
}, THEME);
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(String(e)));
await p.goto(`http://localhost:${PORT}/arcs/x-bionic/proposal`, {
  waitUntil: "load",
  timeout: 180000,
});
await p.waitForSelector("#vision .pl-fig", { timeout: 120000 });
await p.addStyleTag({
  content: "nextjs-portal{display:none!important} html{scroll-behavior:auto!important}",
});
const to = (y) => p.evaluate((y) => window.scrollTo(0, y), y);
const topOf = (sel) =>
  p.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);

/* the order of the opening */
const ids = await p.evaluate(() =>
  [...document.querySelectorAll(".arc-root section[id]")].slice(0, 6).map((s) => s.id)
);
console.log("sections:", ids.join(" · "));

/* the flow, arrived */
await to(await topOf("#vision"));
await p.waitForTimeout(2600);
const plug = await p.evaluate(() => {
  const fig = document.querySelector("#vision .pl-fig").getBoundingClientRect();
  const title = document.querySelector("#vision .xm__title").getBoundingClientRect();
  return {
    titleCentreOff: title.left + title.width / 2 - innerWidth / 2,
    figBottom: fig.bottom,
    vh: innerHeight,
    foot: !!document.querySelector("#vision .pl-foot"),
  };
});
console.log(
  `plug: title centre ${plug.titleCentreOff.toFixed(1)}px off the frame's middle, figure bottom ${plug.figBottom.toFixed(0)} of ${plug.vh}, footer line ${plug.foot ? "PRESENT" : "absent"}`
);
await p.screenshot({ path: `${OUT}/xbp-plug-${tag}.png` });

/* the steps, each label landing on its step, its sentence open */
for (const [i, id] of ["embed", "encode", "run"].entries()) {
  await to(await topOf(`#step-${id}`));
  await p.waitForTimeout(1100);
  const r = await p.evaluate(() => {
    const lis = [...document.querySelectorAll("#adoption .es-lines li")];
    const on = lis.findIndex((el) => el.hasAttribute("data-on"));
    const open = lis.map((el) => el.querySelector(".es-say").getBoundingClientRect().height);
    const stage = document.querySelector("#adoption .es-stage").getBoundingClientRect();
    let top = Infinity;
    for (const g of document.querySelectorAll("#adoption .es-plate"))
      top = Math.min(top, g.getBoundingClientRect().top);
    return { on, open, air: top - stage.top };
  });
  console.log(
    `step ${id} → ${r.on + 1} lit (want ${i + 1}); sentence heights ${r.open.map((h) => h.toFixed(0)).join("/")}; air above the plates ${r.air.toFixed(1)}px`
  );
  await p.screenshot({ path: `${OUT}/xbp-steps-${id}-${tag}.png` });
}

/* the first job card, as the proof-card branch drew it */
const job = await p.evaluate(() => document.querySelector("[id^='job-']")?.id ?? null);
if (job) {
  await to(await topOf(`#${job}`));
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/xbp-${job}-${tag}.png` });
  console.log("first job:", job);
} else console.log("first job: NONE");
console.log("page errors:", errors.length ? errors.join(" | ") : "none");
await b.close();
