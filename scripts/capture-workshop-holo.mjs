/**
 * capture-workshop-holo — the workshop's three LIVE figures (ADR-140).
 *
 * `/arcs/thoughtform-workshop-v2` (and its siblings) draw the stages, the
 * curve and the spectrum twice: an SVG/DOM fallback the server sends, and a
 * WebGL hologram the mount promotes to `data-holo="live"` from its first
 * committed frame. ⚠ HEADED, WITH REAL GL — a headless Chromium falls back to
 * SwiftShader or no GL, and the failure mode is not an error: the beat
 * quietly shows the flat drawing and the shoot looks fine. `--flat` shoots
 * that fallback on purpose (what the handout gets).
 *
 *   node scripts/capture-workshop-holo.mjs
 *   node scripts/capture-workshop-holo.mjs --vp 1280x720 --theme light
 *   node scripts/capture-workshop-holo.mjs --only the-curve
 *   node scripts/capture-workshop-holo.mjs --slug thoughtform-workshop --flat
 *
 * Per figure it waits for live (or not), lets the arrival play, shoots the
 * viewport and the section's own box, and for the curve presses the two
 * buttons and shoots each step. It prints what it measured: the tri-state,
 * the canvas size, the beat's height against the frame, page errors.
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const BASE = arg("--base", "http://localhost:3003");
const SLUG = arg("--slug", "thoughtform-workshop-v2");
/** A path instead of an arc — the lab: `--path "/test/workshop-holo-lab?agent=solid"`. */
const PATH = arg("--path", "");
const THEME = arg("--theme", "dark");
const ONLY = arg("--only", "three-ways,the-curve,between");
const FLAT = process.argv.includes("--flat");
/* ⚠ NOT under `public/` — that ships. `.cursor/arc-shots-*` is gitignored. */
const OUT = arg("--out", path.join(".cursor", `arc-shots-${SLUG}-holo`));
const [W, H] = arg("--vp", "1920x1080")
  .split("x")
  .map((n) => Number(n));
/** How long the arrival gets after `live` before the still (the intro is 2s). */
const ARRIVE_MS = Number(arg("--arrive", "3400"));

const run = async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch(
    FLAT
      ? { headless: true, args: ["--disable-gpu"] }
      : { headless: false, args: ["--enable-gpu", "--use-gl=angle", "--ignore-gpu-blocklist"] }
  );
  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });

  const errors = [];
  const consoleErrors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") consoleErrors.push(m.text().slice(0, 240));
  });

  const url = PATH
    ? `${BASE}${PATH}${THEME === "light" ? `${PATH.includes("?") ? "&" : "?"}theme=light` : ""}`
    : `${BASE}/arcs/${SLUG}${THEME === "light" ? "?theme=light" : ""}`;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });

  /* The workshop's tail is a lazy nested root (ADR-137): wait for it. */
  await page.waitForSelector(PATH ? `#${ONLY.split(",")[0].trim()}` : "#the-curve, #three-ways, #between", { timeout: 60000 });

  /* ONE FORWARD SWEEP FIRST: the reveal is one-shot and unobserves on first
     intersect, so a beat only draws itself once scrolled through. */
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += Math.round(H * 0.6)) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(70);
  }
  await page.waitForTimeout(600);

  const wanted = ONLY.split(",").map((s) => s.trim());
  const report = [];
  const shots = [];

  const shoot = async (id, tag) => {
    const file = path.join(OUT, `${id}-${tag}-${THEME}-${W}x${H}${FLAT ? "-flat" : ""}.png`);
    await page.screenshot({ path: file });
    shots.push(file);
    return file;
  };

  for (const id of wanted) {
    const exists = await page.$(`#${id}`);
    if (!exists) {
      report.push({ id, missing: true });
      continue;
    }
    await page.evaluate((sid) => {
      const el = document.getElementById(sid);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
    }, id);
    await page.waitForTimeout(500);

    let live = "absent";
    if (!FLAT) {
      await page
        .waitForFunction(
          (sid) => document.getElementById(sid)?.getAttribute("data-holo") === "live",
          id,
          { timeout: 20000 }
        )
        .catch(() => console.log(`⚠ #${id} never went live — shooting whatever is there`));
    }
    await page.waitForTimeout(ARRIVE_MS);
    live = await page.evaluate(
      (sid) => document.getElementById(sid)?.getAttribute("data-holo") ?? "absent",
      id
    );
    await shoot(id, "rest");

    /* The curve's two buttons: the prices, then the surface. */
    if (id === "the-curve") {
      const buttons = await page.$$("#the-curve .arc-cv__show");
      if (buttons.length === 2) {
        await buttons[0].click();
        await page.waitForTimeout(1400);
        await shoot(id, "step1");
        await buttons[1].click();
        await page.waitForTimeout(1900);
        await shoot(id, "step2");
        await buttons[1].click();
        await page.waitForTimeout(1900);
        await shoot(id, "step1-back");
        await buttons[1].click();
        await page.waitForTimeout(1900);
      }
    }

    const m = await page.evaluate(
      ({ sid, vh }) => {
        const sec = document.getElementById(sid);
        const canvas = sec?.querySelector(".arc-holo canvas");
        const r = sec?.getBoundingClientRect();
        const c = canvas?.getBoundingClientRect();
        return {
          holo: sec?.getAttribute("data-holo") ?? "absent",
          beatH: r ? Math.round(r.height) : 0,
          overOneFrame: r ? r.height > vh * 1.15 : false,
          canvas: c ? `${Math.round(c.width)}x${Math.round(c.height)}` : "none",
          step: sec?.querySelector(".arc-cv")?.getAttribute("data-step") ?? null,
        };
      },
      { sid: id, vh: H }
    );
    report.push({ id, live, ...m });
  }

  const arcTall = await page.evaluate(() => document.documentElement.hasAttribute("data-arc-tall"));
  await browser.close();

  console.log(`shot ${shots.length} stills → ${OUT}`);
  for (const r of report) console.log(JSON.stringify(r));
  if (arcTall) console.log("⚠ data-arc-tall is SET — the curtain is disarmed");
  if (errors.length) console.log("⚠ page errors:", errors);
  const relevant = consoleErrors.filter((t) => /three|webgl|hydrat|shader|uniform|R3F/i.test(t));
  if (relevant.length) console.log("⚠ console:", relevant);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
