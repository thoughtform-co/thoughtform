/**
 * capture-arc-portfolio — one shot per beat of /arcs/portfolio (ADR-078).
 *
 * The page FLOWS (ADR-076), so there is no corridor to drive and no
 * settle marker to wait on — but the reveal is a ONE-SHOT
 * IntersectionObserver, so a beat only draws itself once it has been
 * scrolled into view. Hence the sweep: scroll to each section, wait for
 * its `.arc-reveal` children to carry `is-in`, then shoot.
 *
 * ⚠ HEADED IS REQUIRED FOR THE TRAJECTORY BEAT, AND ONLY FOR IT (ADR-080).
 * Every other beat is DOM and SVG, so headless renders them faithfully — but
 * `#overview` now mounts a WebGL instrument, and a headless Chromium either
 * falls back to SwiftShader or gets no GL at all. The failure mode is not an
 * error: it is a beat that quietly falls back to the flat board and a shoot
 * that looks fine. Pass `--holo` to launch headed and wait for the canvas to
 * go live before shooting.
 *
 *   node scripts/capture-arc-portfolio.mjs
 *   node scripts/capture-arc-portfolio.mjs --vp 1280x720 --theme light
 *   node scripts/capture-arc-portfolio.mjs --only overview,studio
 *   node scripts/capture-arc-portfolio.mjs --holo --only overview
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
/* ⚠ NOT under `public/` — that ships. The repo's throwaway shoots live
   under `.cursor/`, which is gitignored (the pda/isl/substrate precedent). */
const OUT = arg("--out", path.join(".cursor", "arc-portfolio-shots"));
const [W, H] = arg("--vp", "1440x800")
  .split("x")
  .map((n) => Number(n));

/** The trajectory beat is WebGL; everything else on this page is not. */
const HOLO = process.argv.includes("--holo");

const run = async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch(
    HOLO
      ? { headless: false, args: ["--enable-gpu", "--use-gl=angle", "--ignore-gpu-blocklist"] }
      : {}
  );
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

    /* The trajectory's canvas promotes `data-holo` from its FIRST COMMITTED
       FRAME, so this waits on real pixels rather than on the mount deciding
       it is allowed to try. Its arrival then needs its own 2.4s. */
    if (HOLO && id === "overview") {
      await page
        .waitForFunction(
          () => document.getElementById("overview")?.getAttribute("data-holo") === "live",
          undefined,
          { timeout: 15000 }
        )
        .catch(() => console.log("⚠ #overview never went live — shooting the flat board"));
      await page.waitForTimeout(2900);
    }

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
      /* ⚠ The two invariants the instrument could break silently: the beat
         must still fit ONE viewport (or `data-arc-tall` disarms the ADR-076
         curtain with nothing on screen to say so), and the canvas must not
         be swallowing the stations' clicks. */
      holo: document.getElementById("overview")?.getAttribute("data-holo") ?? "absent",
      arcTall: document.documentElement.hasAttribute("data-arc-tall"),
      stationHits: [...document.querySelectorAll("a.arc-prog__stn-hit")].map((a) => {
        const r = a.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { href: a.getAttribute("href"), reachable: !!hit && a.contains(hit) };
      }),
    };
  }, H);

  await browser.close();
  console.log(`shot ${shots.length} beats → ${OUT}`);
  console.log(`#overview data-holo="${measured.holo}" · data-arc-tall=${measured.arcTall}`);
  if (measured.arcTall) console.log("⚠ data-arc-tall is SET — the curtain is disarmed");
  const unreachable = measured.stationHits.filter((s) => !s.reachable);
  if (unreachable.length)
    console.log("⚠ stations not clickable (the canvas is eating them):", unreachable);
  if (measured.tall.length) console.log("⚠ beats over 1.15 viewports:", measured.tall);
  if (measured.unrevealed) console.log(`⚠ ${measured.unrevealed} .arc-reveal never revealed`);
  if (measured.overflowX) console.log("⚠ the page overflows horizontally");
  if (errors.length) console.log("⚠ page errors:", errors);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
