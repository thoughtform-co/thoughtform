/**
 * capture-workshop-holo — the workshop's three LIVE figures (ADR-140).
 *
 * `/arcs/thoughtform/workshop-v2` (and its siblings) draw the stages, the
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
 * THE LAB (round four), by `--path`, whose sections are `#dir-<id>`:
 *
 *   node scripts/capture-workshop-holo.mjs --path /test/workshop-holo-lab --only stages-instrument,curve-instrument,spectrum-instrument
 *   node scripts/capture-workshop-holo.mjs --path /test/workshop-holo-lab --only curve-instrument --video --from 0 --to 12 --fps 30
 *   node scripts/capture-workshop-holo.mjs --path /test/workshop-holo-lab --only curve-instrument --sheet --from 0 --to 12 --n 12
 *
 * `--video` renders FRAME BY FRAME through the lab's frozen clock
 * (`window.__holoClock(t)`: the sim is stepped deterministically to t, so a
 * frame is f(t), the Evangelion engine's own law) and assembles an MP4 with
 * ffmpeg; `--sheet` tiles n frames into one contact sheet. ⚠ Run from
 * PowerShell: Git Bash rewrites a `/test/...` argument into a Windows path.
 *
 * Per figure it waits for live (or not), lets the arrival play, shoots the
 * viewport and the section's own box, and for the curve presses the two
 * buttons and shoots each step. It prints what it measured: the tri-state,
 * the canvas size, the beat's height against the frame, page errors.
 */
import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const BASE = arg("--base", "http://localhost:3003");
const SLUG = arg("--slug", "thoughtform-workshop-v2");
/** A path instead of an arc — the lab: `--path "/test/workshop-holo-lab?life=1"`. */
const PATH = arg("--path", "");
const THEME = arg("--theme", "dark");
const ONLY = arg("--only", PATH ? "stages-instrument,curve-instrument,spectrum-instrument" : "three-ways,the-curve,between");
const FLAT = process.argv.includes("--flat");
const VIDEO = process.argv.includes("--video");
const SHEET = process.argv.includes("--sheet");
const FROM = Number(arg("--from", "0"));
const TO = Number(arg("--to", "12"));
const FPS = Number(arg("--fps", "30"));
const SHEET_N = Number(arg("--n", "12"));
/* ⚠ NOT under `public/` — that ships. `.cursor/arc-shots-*` is gitignored. */
const OUT = arg("--out", path.join(".cursor", `arc-shots-${PATH ? "holo-lab" : SLUG}-holo`));
const [W, H] = arg("--vp", "1920x1080")
  .split("x")
  .map((n) => Number(n));
/** How long the arrival gets after `live` before the still (the intro is 2s). */
const ARRIVE_MS = Number(arg("--arrive", "3400"));
/** The lab's sections are `#dir-<id>`; an arc's are the beats' own ids. */
const sectionId = (id) => (PATH ? (id.startsWith("dir-") ? id : `dir-${id}`) : id);

const ffmpeg = (args) => {
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
  if (r.status !== 0) throw new Error("ffmpeg failed: " + args.join(" "));
};

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

  const wanted = ONLY.split(",").map((s) => s.trim()).filter(Boolean);

  /* The workshop's tail is a lazy nested root (ADR-137): wait for it. */
  await page.waitForSelector(
    PATH ? `#${sectionId(wanted[0])}` : "#the-curve, #three-ways, #between",
    { timeout: 60000 }
  );

  /* ONE FORWARD SWEEP FIRST: the reveal is one-shot and unobserves on first
     intersect, so a beat only draws itself once scrolled through. */
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += Math.round(H * 0.6)) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(70);
  }
  await page.waitForTimeout(600);

  const report = [];
  const shots = [];

  const shoot = async (id, tag) => {
    const file = path.join(OUT, `${id}-${tag}-${THEME}-${W}x${H}${FLAT ? "-flat" : ""}.png`);
    await page.screenshot({ path: file });
    shots.push(file);
    return file;
  };

  /** Two frames of the loop, so a clock write has painted. */
  const settle = () =>
    page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(0))))
    );

  for (const id of wanted) {
    const sid = sectionId(id);
    const exists = await page.$(`#${sid}`);
    if (!exists) {
      report.push({ id, missing: true });
      continue;
    }
    await page.evaluate((s) => {
      const el = document.getElementById(s);
      if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - (s.startsWith("dir-") ? 24 : 0));
    }, sid);
    await page.waitForTimeout(500);

    let live = "absent";
    if (!FLAT) {
      await page
        .waitForFunction(
          (s) => document.getElementById(s)?.getAttribute("data-holo") === "live",
          sid,
          { timeout: 20000 }
        )
        .catch(() => console.log(`⚠ #${sid} never went live — shooting whatever is there`));
    }

    if ((VIDEO || SHEET) && PATH) {
      /* Frame by frame on the frozen clock, the stage box alone. */
      const stage = await page.$(`#${sid} .whd__stage`);
      const tmp = path.join(OUT, `_frames-${id}-${THEME}`);
      await rm(tmp, { recursive: true, force: true });
      await mkdir(tmp, { recursive: true });
      const n = VIDEO ? Math.round((TO - FROM) * FPS) : SHEET_N;
      const t0 = Date.now();
      for (let k = 0; k < n; k++) {
        const t = VIDEO ? FROM + k / FPS : FROM + ((TO - FROM) * k) / Math.max(1, n - 1);
        await page.evaluate((tt) => window.__holoClock?.(tt), t);
        await settle();
        await settle();
        await stage.screenshot({ path: path.join(tmp, `f_${String(k).padStart(5, "0")}.png`) });
        if (k % 30 === 0) console.log(`${id} frame ${k}/${n} t=${t.toFixed(2)} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      }
      await page.evaluate(() => window.__holoClock?.(undefined));
      if (VIDEO) {
        const out = path.join(OUT, `${id}-${THEME}-${FROM}-${TO}s.mp4`);
        ffmpeg(["-framerate", String(FPS), "-i", path.join(tmp, "f_%05d.png"), "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "16", "-preset", "slow", "-movflags", "+faststart", out]);
        shots.push(out);
        console.log("wrote", out);
      }
      if (SHEET) {
        const out = path.join(OUT, `${id}-${THEME}-sheet.png`);
        const cols = 4;
        const rows = Math.ceil(n / cols);
        ffmpeg(["-i", path.join(tmp, "f_%05d.png"), "-vf", `scale=480:-1,tile=${cols}x${rows}:padding=6:color=0x0a0908`, "-frames:v", "1", out]);
        shots.push(out);
        console.log("wrote", out);
      }
      await rm(tmp, { recursive: true, force: true });
      report.push({ id, live: "frozen", frames: n });
      continue;
    }

    await page.waitForTimeout(ARRIVE_MS);
    live = await page.evaluate(
      (s) => document.getElementById(s)?.getAttribute("data-holo") ?? "absent",
      sid
    );
    await shoot(id, "rest");
    if (PATH) {
      const stage = await page.$(`#${sid} .whd__stage`);
      if (stage) {
        const file = path.join(OUT, `${id}-stage-${THEME}-${W}x${H}.png`);
        await stage.screenshot({ path: file });
        shots.push(file);
      }
    }

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
      ({ s, vh }) => {
        const sec = document.getElementById(s);
        const canvas = sec?.querySelector("canvas");
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
      { s: sid, vh: H }
    );
    report.push({ id, live, ...m });
  }

  const arcTall = await page.evaluate(() => document.documentElement.hasAttribute("data-arc-tall"));
  await browser.close();

  console.log(`shot ${shots.length} files → ${OUT}`);
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
