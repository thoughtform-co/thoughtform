/**
 * ADR-082 U21 follow-up (pre-launch C9): the ≤700px width reset must WIN.
 *
 * The phone rung's `.vwd__head/.vwd__body` reset was (0,1,0) and lost to the
 * desktop's (0,2,0) `[data-cell]` placements, so `--vwd-measure` (368px)
 * still bound on 410–700px viewports and the visible panel pinned left with
 * dead column beside it. This probe reads the ACTIVE panel's rendered width
 * against its stage at the phone widths, and re-reads the desktop rungs to
 * prove the fix stayed inside its media query.
 *
 *   node scripts/probe-datum-phone-width.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.PROBE_BASE ?? "http://localhost:3003";

const CASES = [
  { w: 410, h: 800, mode: "phone" },
  { w: 600, h: 900, mode: "phone" },
  { w: 700, h: 900, mode: "phone" },
  { w: 900, h: 900, mode: "mid" },
  { w: 1280, h: 720, mode: "desktop" },
];

const browser = await chromium.launch({ headless: false });
let failures = 0;

for (const c of CASES) {
  const page = await browser.newPage({ viewport: { width: c.w, height: c.h } });
  await page.goto(`${BASE}/?theme=dark`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#voidwalker", { timeout: 30000 });
  await page.evaluate(() => {
    document.getElementById("voidwalker")?.scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(1200);

  if (c.mode === "phone") {
    // The phone instrument shows one panel per tab; the default tab may be
    // the figure (no body at all). RECORD owns two cells (ur + lr).
    const tab = page.locator('.vwd__tab:has-text("RECORD"), .vwd__tab:has-text("Record")').first();
    if ((await tab.count()) > 0) {
      await tab.click({ force: true });
      await page.waitForTimeout(400);
    }
  }

  const r = await page.evaluate(() => {
    const stage = document.querySelector(".vwd__stage");
    if (!stage) return { err: "no .vwd__stage" };
    const cs = getComputedStyle(stage);
    // The panel's box is the stage's CONTENT box: clientWidth already
    // excludes the scrollbar, and the inline padding comes off explicitly.
    const stageW =
      stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const bodies = [...document.querySelectorAll(".vwd__body")].map((el) => {
      const cs = getComputedStyle(el);
      return {
        cell: el.getAttribute("data-cell"),
        display: cs.display,
        width: el.getBoundingClientRect().width,
        left: el.getBoundingClientRect().left,
      };
    });
    return { stageW, bodies };
  });

  if (r.err) {
    console.log(`${c.w}x${c.h}: ${r.err}`);
    failures++;
    await page.close();
    continue;
  }

  const visible = r.bodies.filter((b) => b.display !== "none");
  const line = visible
    .map((b) => `${b.cell}:${Math.round(b.width)}px@x${Math.round(b.left)}`)
    .join("  ");
  console.log(`${c.w}x${c.h} (${c.mode}) stage=${Math.round(r.stageW)}px  ${line}`);

  if (c.mode === "phone") {
    // The active panel must fill the stage (tolerance for scrollbar/padding).
    for (const b of visible) {
      if (Math.abs(b.width - r.stageW) > 10) {
        console.log(`  ✗ ${b.cell} is ${Math.round(b.width)}px against a ${Math.round(r.stageW)}px stage`);
        failures++;
      }
    }
    if (visible.length === 0) {
      console.log("  ✗ no visible body on the phone rung");
      failures++;
    }
  }
  if (c.mode === "desktop") {
    // The capable composition is untouched by the phone fix (the reset lives
    // inside the ≤700px media block — the diff is the scope proof). Here the
    // gate is that every body still resolves --vwd-measure: min(100%, 23rem),
    // i.e. ≤368px and never stretched to the stage.
    for (const b of visible) {
      if (b.width > 368.5 || b.width < 320) {
        console.log(`  ✗ desktop ${b.cell} moved: ${Math.round(b.width)}px (expected min(100%, 368))`);
        failures++;
      }
    }
  }
  await page.close();
}

await browser.close();
console.log(failures === 0 ? "OK — all rungs hold" : `FAIL — ${failures} finding(s)`);
process.exit(failures === 0 ? 0 : 1);
