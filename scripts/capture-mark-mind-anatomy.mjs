/**
 * capture-mark-mind-anatomy — stills and checks of /test/mark-mind-anatomy
 * against the round-six reference (cloned from capture-mark-mind.mjs).
 *
 *   node scripts/capture-mark-mind-anatomy.mjs --round r1 [--port 3031] [--stage blockout|bare|full]
 *     --check stills|frame|weights|overlay|top|integrate|squint|sheet  [--q "el=58&k=1.6"]
 *     [--sizes 1440x900,1920x1247]
 *
 * ONE check a call (run them in a shell loop). Each call opens its own browser,
 * closes every page as soon as its PNG is on disk, and hands the pixel work to
 * scripts/mark-mind-anatomy-checks.py (OpenCV, 512 px). The first version ran
 * every check in one process with the morphology in plain JS on 1024² Float64
 * arrays, and was SIGKILLed (exit 137) on 2026-10-20. Keep pixels out of JS.
 *
 * `frame` must run before overlay, integrate, squint and sheet (they read
 * frame_<stage>.png). Results merge into checks.json, one key per check.
 *
 * Needs the dev server running (read the port off it; 3003 is only the default).
 * Writes into docs/design/mark-mind-anatomy/<round>/:
 *   still_<stage>_<w>x<h>.png        the stills at the owner's viewports
 *   frame_<stage>.png                the drawing in the reference's 1024² frame
 *   overlay_<stage>.png              ours at 50% over a0_gpt (512)
 *   sil-diff_<stage>.png             silhouettes: grey both, red reference only, cyan ours only
 *   top_diag.png, top_logo-diff.png  the 90° view, and against the logo: grey both, red logo only, cyan ours only
 *   top_nomark.png, solo_mark.png    the integration views
 *   squint.png                       both blurred and cut to 120 px, side by side
 *   vs-gpt_<stage>.jpg               the sheet, with the numbers as a footer
 *   checks.json                      every number
 */
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const arg = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const port = arg("--port", "3003");
const round = arg("--round", "r1");
const stage = arg("--stage", "bare");
const sizes = arg("--sizes", "1440x900,1920x1247").split(",").filter(Boolean);
const check = arg("--check", "");
const extra = arg("--q", "");
const CHECKS = ["stills", "frame", "weights", "overlay", "top", "integrate", "squint", "sheet"];
if (!CHECKS.includes(check)) {
  console.error(`--check one of ${CHECKS.join("|")}`);
  process.exit(2);
}
const out = path.resolve("docs/design/mark-mind-anatomy", round);
const REF = path.resolve("docs/design/machine-mind/round-06/wave-6/a0_gpt.png");
const LOGO = path.resolve("public/logos/Thoughtform_Brandmark.svg");
const PY = path.resolve("scripts/mark-mind-anatomy-checks.py");
const FRAME = 1024;
/** Diagnostic views (top, no mark, solo) need no more than the checks' 512. */
const DIAG = 512;
// the top view's placement of the logo: plane = mark − O, screen = (cx + u·k, 512 + v·k)
const CAM = { cx: 511.94, k: 1.636, O: [206.7, 229.53] };

await mkdir(out, { recursive: true });
const at = (name) => path.join(out, name);
const frameFile = at(`frame_${stage}.png`);
const base = `http://localhost:${port}/test/mark-mind-anatomy`;
const url = (q) => `${base}?still=1&stage=${stage}${q ? `&${q}` : ""}${extra ? `&${extra}` : ""}`;

const py = (...a) => JSON.parse(execFileSync("python3", [PY, ...a], { encoding: "utf8" }).trim().split("\n").pop());
const merge = async (patch) => {
  const file = at("checks.json");
  const prev = existsSync(file) ? JSON.parse(await readFile(file, "utf8")) : {};
  const next = { ...prev, ...patch, round, stage, port, query: extra || null, at: new Date().toISOString() };
  await writeFile(file, JSON.stringify(next, null, 2));
  console.log(JSON.stringify(patch, null, 2));
};
const need = (f) => {
  if (!existsSync(f)) {
    console.error(`missing ${path.relative(process.cwd(), f)}: run --check frame first`);
    process.exit(2);
  }
};

/** Open a browser only for the shots; every page is closed as soon as its file is written. */
async function withBrowser(fn) {
  const browser = await chromium.launch({ args: ["--disable-gpu", "--js-flags=--max-old-space-size=512"] });
  try {
    return await fn(async (q, w, h, file, during) => {
      const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      try {
        await page.goto(url(q), { waitUntil: "load", timeout: 180000 });
        await page.waitForSelector("[data-mark-mind-anatomy][data-ready]", { timeout: 60000 });
        await page.waitForTimeout(300);
        await page.screenshot({ path: file });
        return during ? await during(page) : undefined;
      } finally {
        await page.close();
      }
    });
  } finally {
    await browser.close();
  }
}

if (check === "stills") {
  await withBrowser(async (shoot) => {
    for (const size of sizes) {
      const [w, h] = size.split("x").map(Number);
      await shoot("", w, h, at(`still_${stage}_${w}x${h}.png`));
      console.log("ok still", size);
    }
  });
}

if (check === "frame") {
  await withBrowser((shoot) => shoot("", FRAME, FRAME, frameFile));
  console.log("ok", path.relative(process.cwd(), frameFile));
}

if (check === "weights") {
  const weights = await withBrowser((shoot) =>
    shoot("", DIAG, DIAG, at("weights_view.png"), (page) =>
      page.evaluate(() => {
        const seen = {};
        for (const el of document.querySelectorAll("svg path, svg circle, svg line, svg polyline")) {
          const cs = getComputedStyle(el);
          if (cs.stroke === "none" || cs.visibility === "hidden") continue;
          const w = parseFloat(el.getAttribute("stroke-width") || cs.strokeWidth);
          if (!(w > 0)) continue;
          // a stroke in its own fill colour only hides an anti-aliasing seam: it is not a line
          if (el.getAttribute("stroke") && el.getAttribute("stroke") === el.getAttribute("fill")) continue;
          const key = (Math.round(w * 100) / 100).toString();
          seen[key] = (seen[key] || 0) + 1;
        }
        return seen;
      }),
    ),
  );
  const sorted = Object.fromEntries(Object.entries(weights).sort((a, b) => Number(a[0]) - Number(b[0])));
  await merge({ weights: sorted, weightCount: Object.keys(sorted).length });
}

if (check === "overlay") {
  need(frameFile);
  await merge(py("overlay", REF, frameFile, out, stage));
}

if (check === "top") {
  await withBrowser((shoot) => shoot("cam=top&diag=1", DIAG, DIAG, at("top_diag.png")));
  // the logo, placed where the top view puts the plane, rasterised by sharp straight to disk
  const svg = (await readFile(LOGO, "utf8")).replace(/<\?xml[^>]*>/, "");
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  const tx = CAM.cx - CAM.O[0] * CAM.k;
  const ty = FRAME / 2 - CAM.O[1] * CAM.k;
  const placed = `<svg xmlns="http://www.w3.org/2000/svg" width="${FRAME}" height="${FRAME}"><rect width="100%" height="100%" fill="#000"/><g transform="translate(${tx} ${ty}) scale(${CAM.k})">${inner}</g></svg>`;
  await sharp(Buffer.from(placed)).resize(DIAG, DIAG).png().toFile(at("top_logo.png"));
  await merge(py("top", at("top_diag.png"), at("top_logo.png"), out));
}

if (check === "integrate") {
  need(frameFile);
  await withBrowser(async (shoot) => {
    if (!existsSync(at("top_diag.png"))) await shoot("cam=top&diag=1", DIAG, DIAG, at("top_diag.png"));
    await shoot("cam=top&diag=1&nomark=1", DIAG, DIAG, at("top_nomark.png"));
    await shoot("solo=1", DIAG, DIAG, at("solo_mark.png"));
  });
  await merge(py("integrate", at("top_diag.png"), at("top_nomark.png"), at("solo_mark.png"), frameFile));
}

if (check === "squint") {
  need(frameFile);
  await merge(py("squint", REF, frameFile, out));
}

if (check === "sheet") {
  need(frameFile);
  const { sheet } = py("sheet", out, stage, at("checks.json"), REF, frameFile);
  console.log("sheet", path.relative(process.cwd(), sheet));
}
