/**
 * capture-arc-portfolio — one shot per beat of /arcs/portfolio (ADR-078).
 *
 * The page FLOWS (ADR-076), so there is no corridor to drive and no
 * settle marker to wait on — but the reveal is a ONE-SHOT
 * IntersectionObserver, so a beat only draws itself once it has been
 * scrolled into view. Hence the sweep: scroll to each section, wait for
 * its `.arc-reveal` children to carry `is-in`, then shoot.
 *
 * ⚠ HEADED IS NOT REQUIRED HERE (unlike the landing's corridor captures):
 * nothing on this page is WebGL. Headless renders it faithfully.
 *
 *   node scripts/capture-arc-portfolio.mjs
 *   node scripts/capture-arc-portfolio.mjs --vp 1280x720 --theme light
 *   node scripts/capture-arc-portfolio.mjs --only overview,studio
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const BASE = arg("--base", "http://localhost:3003");
const THEME = arg("--theme", "dark");
const ONLY = arg("--only", "");
const OUT = arg("--out", path.join("public", "captures", "arc-portfolio"));
const [W, H] = arg("--vp", "1440x800")
  .split("x")
  .map((n) => Number(n));

const run = async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    // ⚠ PRM would trip the console unwrap pair and hide every plate's
    // frame — the config lab's own recorded trap, same gates.
    reducedMotion: "no-preference",
  });

  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  const url = `${BASE}/arcs/portfolio${THEME === "light" ? "?theme=light" : ""}`;
  await page.goto(url, { waitUntil: "networkidle" });
  // The reveal drive is stepped; a smooth root would land every scroll short.
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });

  const ids = await page.$$eval(".arc-section", (els) => els.map((e) => e.id));
  const wanted = ONLY ? ONLY.split(",").map((s) => s.trim()) : ids;

  // ONE FORWARD SWEEP FIRST: the reveal is one-shot and unobserves on
  // first intersect, so a beat taller than the viewport never reveals its
  // own foot if you jump straight to it (the smoke's `restAt` does the
  // same thing for the same reason).
  for (let y = 0; y < (await page.evaluate(() => document.body.scrollHeight)); y += Math.round(H * 0.6)) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(600);

  const shots = [];
  for (const id of wanted) {
    if (!ids.includes(id)) continue;
    await page.evaluate((sid) => {
      const el = document.getElementById(sid);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
    }, id);
    await page.waitForTimeout(450);

    const file = path.join(OUT, `${String(ids.indexOf(id) + 1).padStart(2, "0")}-${id}-${THEME}-${W}x${H}.png`);
    await page.screenshot({ path: file });
    shots.push(file);
  }

  const measured = await page.evaluate((vh) => {
    const secs = [...document.querySelectorAll(".arc-section")];
    return {
      tall: secs
        .map((s) => ({ id: s.id, h: Math.round(s.getBoundingClientRect().height) }))
        .filter((s) => s.h > vh * 1.15),
      unrevealed: [...document.querySelectorAll(".arc-reveal:not(.is-in)")].length,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  }, H);

  await browser.close();
  console.log(`shot ${shots.length} beats → ${OUT}`);
  if (measured.tall.length) console.log("⚠ beats over 1.15 viewports:", measured.tall);
  if (measured.unrevealed) console.log(`⚠ ${measured.unrevealed} .arc-reveal never revealed`);
  if (measured.overflowX) console.log("⚠ the page overflows horizontally");
  if (errors.length) console.log("⚠ page errors:", errors);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
