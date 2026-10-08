/**
 * capture-services-workstreams — stills of `/test/services-workstreams`: each
 * card face (ladder · run · specimen) × each park (the three workstreams and
 * the configuration) × each theme, at the reference viewports.
 *
 *   node scripts/capture-services-workstreams.mjs
 *   node scripts/capture-services-workstreams.mjs --faces ladder --themes dark --vp 1440x900
 *   node scripts/capture-services-workstreams.mjs --deck 0          # the ring alone
 *   node scripts/capture-services-workstreams.mjs --headless        # SwiftShader
 *
 * HEADED BY DEFAULT — the real WebGL ring under bloom, which SwiftShader
 * renders slowly and not always faithfully.
 *
 * Waits are on IDENTITY, never a sleep: the page stamps
 * `data-stamp="face|theme|park"` only after the ring's baker has resolved a
 * whole set of faces for that face and theme AND the scroll has parked that
 * card — a value the script cannot satisfy by itself. The short settle after
 * it is the bloom's mip chain. The dev server must already be running.
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/services-workstreams/stills");
const FACES = argOf("--faces", "ladder,run,specimen").split(",");
const THEMES = argOf("--themes", "dark,light").split(",");
const PARKS = argOf("--parks", "0,1,2").split(",").map(Number);
const DECK = argOf("--deck", "0");
const VIEWPORTS = argOf("--vp", "1280x720,1920x1247")
  .split(",")
  .map((s) => s.split("x").map(Number));
const HEADLESS = args.includes("--headless");

const IGNORED_ERROR = /upgrade-insecure-requests' is ignored when delivered in a report-only/;

const browser = await chromium.launch({
  headless: HEADLESS,
  args: HEADLESS ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : [],
});
await mkdir(OUT, { recursive: true });

let failures = 0;
for (const [w, h] of VIEWPORTS) {
  for (const theme of THEMES) {
    const context = await browser.newContext({
      viewport: { width: w, height: h },
      colorScheme: theme,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => {
      if (m.type() === "error" && !IGNORED_ERROR.test(m.text())) errors.push(m.text());
    });
    for (const face of FACES) {
      for (const park of PARKS) {
        const url = `http://localhost:${PORT}/test/services-workstreams?face=${face}&svc=${park}&theme=${theme}&deck=${DECK}&console=0`;
        await page.goto(url, { waitUntil: "domcontentloaded" });
        const stamp = `${face}|${theme}|${park}`;
        try {
          await page.waitForSelector(`main[data-stamp="${stamp}"]`, { timeout: 45_000 });
          await page.waitForSelector(".svc-ring-hits__hit--front", { timeout: 15_000 });
          if (DECK === "1") await page.waitForSelector(".svw-folder", { timeout: 10_000 });
          // The bloom's mip chain, and the deck's 560ms aperture + stagger.
          await page.waitForTimeout(1100);
          const file = path.join(OUT, `${face}-p${park}-${theme}-${w}x${h}.png`);
          await page.screenshot({ path: file });
          const deck = await page.evaluate(() => {
            const d = document.querySelector(".svw-deck");
            if (!d) return null;
            const r = d.getBoundingClientRect();
            return {
              folders: d.querySelectorAll(".svw-folder").length,
              overflow: d.scrollHeight - d.clientHeight,
              right: Math.round(r.right),
            };
          });
          console.log(`ok  ${stamp} ${w}x${h}  deck=${JSON.stringify(deck)}  → ${file}`);
        } catch (e) {
          failures++;
          console.log(`ERR ${stamp} ${w}x${h}: ${String(e).split("\n")[0]}`);
        }
      }
    }
    if (errors.length) {
      failures++;
      console.log(`page errors (${theme} ${w}x${h}):\n  ${[...new Set(errors)].join("\n  ")}`);
    }
    await context.close();
  }
}
await browser.close();
process.exit(failures ? 1 : 0);
