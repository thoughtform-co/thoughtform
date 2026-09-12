/**
 * capture-proof-stack — the four proof cards on the REAL landing, measured
 * (ADR-096).
 *
 * HEADED: the pile sits over the scroll-driven WebGL corridor and a headless
 * context leaves the canvas dead. Real scrolls, never a teleport — the
 * dissipate clock the cards arrive on is rect-derived.
 *
 * A card is seated by scrolling to its slot's own flow offset inside the
 * runway (that IS its pin point, `top-base + i·peek` from the viewport top)
 * plus a fraction of its dwell. ⚠ Never `scrollIntoView` on a sticky slot:
 * an already-pinned slot's rect is its PINNED position, so the read converges
 * on wherever it already is (the trinny smoke's own finding).
 *
 * Usage:
 *   node scripts/capture-proof-stack.mjs --vp 1440x900 --theme dark
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "shots");
const THEME = argOf("--theme", "dark");
const [VW, VH] = argOf("--vp", "1440x900").split("x").map(Number);
const CARDS = argOf("--cards", "0,1,2,3").split(",").map(Number);

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({
  viewport: { width: VW, height: VH },
  reducedMotion: "no-preference",
  colorScheme: THEME === "light" ? "light" : "dark",
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

const tag = `${VW}x${VH}-${THEME}`;

try {
  await page.goto(`http://localhost:${PORT}/${THEME === "light" ? "?theme=light" : ""}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".home-v2-stage", { timeout: 60_000 });
  await page.waitForSelector(".pf-stack", { timeout: 60_000 });

  /* The geometry the whole beat is derived from, read once. */
  const geo = await page.evaluate(() => {
    const runway = document.querySelector(".services-stage-root");
    const pile = document.querySelector(".services-stage-root > .pf-stack");
    const inner = document.querySelector(".pf-stack__runway");
    if (!runway || !pile || !inner) return null;
    const rw = runway.getBoundingClientRect();
    const slots = [...document.querySelectorAll(".pf-slot")].map((el) => ({
      offset: el.offsetTop,
      top: Number.parseFloat(getComputedStyle(el).top),
      position: getComputedStyle(el).position,
      height: el.offsetHeight,
    }));
    return {
      vh: window.innerHeight,
      runwayTop: rw.top + window.scrollY,
      runwayH: rw.height,
      pileH: pile.offsetHeight,
      innerH: inner.offsetHeight,
      proofRunwayVar: getComputedStyle(runway).getPropertyValue("--svc-proof-runway").trim(),
      pilePosition: getComputedStyle(pile).position,
      slots,
    };
  });
  if (!geo) throw new Error("no .pf-stack — the stack never mounted");

  console.log(`\n── geometry @ ${tag} ────────────────────────────────`);
  console.log(`  viewport            ${geo.vh}px`);
  console.log(
    `  runway height       ${Math.round(geo.runwayH)}px  (${(geo.runwayH / geo.vh).toFixed(2)} vh)`
  );
  console.log(`  pile height         ${geo.pileH}px  (${(geo.pileH / geo.vh).toFixed(2)} vh)`);
  console.log(`  --svc-proof-runway  ${geo.proofRunwayVar}`);
  console.log(`  pile position       ${geo.pilePosition}`);
  console.log(
    `  ring domain         ${Math.round(geo.runwayH - geo.vh - geo.pileH - 1.2 * geo.vh)}px ` +
      `(want ${Math.round(4 * geo.vh)}px)`
  );
  for (const [i, s] of geo.slots.entries()) {
    console.log(
      `  slot ${i}  offset ${String(Math.round(s.offset)).padStart(5)}  top ${String(
        Math.round(s.top)
      ).padStart(3)}  h ${Math.round(s.height)}  ${s.position}`
    );
  }

  for (const i of CARDS) {
    const s = geo.slots[i];
    if (!s) continue;
    /* ⚠ THE RUNWAY'S TOP IS RE-READ PER CARD. The corridor mounts lazily and
       inflates the document late, so a `top` measured once at mount is stale
       by the time the first scroll lands — card 0 reported `incoming` at a
       target solved against a shorter page. */
    /* ⚠ AND IT CONVERGES RATHER THAN SOLVING ONCE. The corridor mounts lazily
       and the document grows UNDER the scroll, so the first landing is short
       by whatever it grew — card 0 reported `incoming` at 0.26 with its own
       seat solved correctly against a page that had since moved. Re-solve
       until the slot publishes `pinned` (the hook's own value, never a rect —
       the trinny smoke's `rollToP` law). */
    for (let pass = 0; pass < 4; pass += 1) {
      await page.evaluate(
        ({ off, top, h }) => {
          const rw = document.querySelector(".services-stage-root");
          const y = rw.getBoundingClientRect().top + window.scrollY + off - top + h * 0.35;
          window.scrollTo(0, Math.round(y));
        },
        { off: s.offset, top: s.top, h: s.height }
      );
      await page.waitForTimeout(pass === 0 ? 900 : 450);
      const seated = await page.evaluate(
        (idx) => document.querySelectorAll(".pf-slot")[idx]?.getAttribute("data-pc-state"),
        i
      );
      if (seated === "pinned" || seated === "covered") break;
    }
    const state = await page.evaluate((idx) => {
      const slot = document.querySelectorAll(".pf-slot")[idx];
      const card = slot?.querySelector(".pf-card");
      const r = card?.getBoundingClientRect();
      const stage = document.querySelector(".services-stage");
      return {
        pcState: slot?.getAttribute("data-pc-state"),
        enter: slot ? getComputedStyle(slot).getPropertyValue("--pc-enter").trim() : null,
        card: r
          ? {
              x: Math.round(r.x),
              y: Math.round(r.y),
              w: Math.round(r.width),
              h: Math.round(r.height),
            }
          : null,
        title: card?.querySelector(".pf-card__title")?.textContent?.trim(),
        arc: card?.querySelector(".pf-card__arc")?.textContent?.trim(),
        stations: [...(card?.querySelectorAll(".fl-con__stn") ?? [])].map((b) =>
          b.textContent?.trim()
        ),
        plate: card ? getComputedStyle(card).backgroundColor : null,
        pile: (() => {
          const p = document.querySelector(".services-stage-root > .pf-stack");
          const q = p?.getBoundingClientRect();
          return q ? { x: Math.round(q.x), w: Math.round(q.width) } : null;
        })(),
        proofLive: stage?.hasAttribute("data-proof-live"),
      };
    }, i);
    console.log(
      `  card ${i}  ${state.pcState ?? "?"}  enter ${state.enter}  ` +
        `${JSON.stringify(state.card)}  ${JSON.stringify(state.title)} / ${state.arc}`
    );
    if (state.stations.length) console.log(`           rail  ${state.stations.join(" | ")}`);
    console.log(`           plate ${state.plate}`);
    await page.screenshot({ path: `${OUT}/proof-stack-${tag}-card${i}.png` });
  }

  /* And the handoff: the offer's masthead past the release. */
  await page.evaluate((pileH) => {
    const rw = document.querySelector(".services-stage-root");
    const y = rw.getBoundingClientRect().top + window.scrollY + pileH + window.innerHeight * 1.4;
    window.scrollTo(0, Math.round(y));
  }, geo.pileH);
  await page.waitForTimeout(1200);
  const offer = await page.evaluate(() => {
    const m = document.querySelector(".services-masthead");
    const stage = document.querySelector(".services-stage");
    return {
      mastheadOpacity: m ? getComputedStyle(m).opacity : null,
      contentIn: stage ? getComputedStyle(stage).getPropertyValue("--svc-content-in").trim() : null,
      step: stage?.getAttribute("data-active-step"),
    };
  });
  console.log(`\n  offer @ +1.4vh past the pile: ${JSON.stringify(offer)}`);
  await page.screenshot({ path: `${OUT}/proof-stack-${tag}-offer.png` });

  if (errors.length) {
    console.log(`\n  ⚠ page errors:`);
    for (const e of errors.slice(0, 6)) console.log(`    ${e}`);
  }
  console.log(`\n  shots -> ${OUT}/proof-stack-${tag}-*.png\n`);
} finally {
  await browser.close();
}
