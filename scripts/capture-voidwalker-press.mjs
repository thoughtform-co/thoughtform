/**
 * capture-voidwalker-press — look-dev samples of the five on-file voidwalker
 * press articles, for the treatment decision (dark duotone / CRT / parchment
 * print / hybrid) presented in docs/design/voidwalker-timeline-refs.html.
 *
 * Captures TWO things per article, because they answer different questions:
 *   {beat}-page.webp  — the top of the article page. Mostly nav chrome and a
 *                       headline on white: what a naive "screenshot the
 *                       article" would give, and the reason ADR-074 drew
 *                       wireframes instead.
 *   {beat}-key.webp   — the article's own og:image, i.e. the key visual its
 *                       publisher authored to BE a thumbnail. This is the
 *                       real candidate for the plate.
 *
 * ⚠ These are reference material for a design decision and stay in docs/
 * (.vercelignore'd). They are NOT shipped assets. If a treatment is chosen,
 * the shipped pipeline is a separate prepare script writing to public/.
 *
 * Usage (no dev server needed): node scripts/capture-voidwalker-press.mjs
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile, rm } from "node:fs/promises";
import sharp from "sharp";

const OUT = "docs/design/voidwalker-press-samples";
const TMP = OUT + "/_raw";

/** Beat id → the href already on file in lib/voidwalker/voidwalkerData.ts. */
const ITEMS = [
  { beat: "genai", outlet: "De Tijd", url: "https://www.tijd.be/ondernemen/technologie/ai-is-een-rekenmachine-voor-de-creatieve-geest/10469709.html" },
  { beat: "classroom", outlet: "MIT Technology Review", url: "https://www.technologyreview.com/2020/12/12/1014220/kids-zoom-fatigue-remote-learning-roblox-instagram/" },
  { beat: "coins", outlet: "CNN", url: "https://edition.cnn.com/2018/11/13/world/wwi-coins-save-soldier-trnd/index.html" },
  { beat: "expanse", outlet: "Newsweek", url: "https://www.newsweek.com/expanse-save-amazon-syfy-season-4-renew-fans-934620" },
  { beat: "ophef", outlet: "De Standaard", url: "https://www.standaard.be/cnt/dmf20161018_02526101" },
];

/** The plate frame is ~2:1 on desktop (voidwalker.css: 16/10 plate less the
 *  top strip and the press bar). Samples are cut to that. */
const FRAME_W = 1120;
const FRAME_H = 560;

await mkdir(TMP, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: "reduce",
  locale: "en-US",
});
const page = await ctx.newPage();
const report = [];

/** Decline non-essential cookies where a consent wall offers the choice. */
async function declineConsent() {
  const labels = [
    /alleen noodzakelijk/i, /noodzakelijke/i, /weiger/i, /afwijzen/i,
    /reject all/i, /decline/i, /only essential/i, /necessary only/i,
    /continue without/i, /doorgaan zonder/i,
  ];
  for (const re of labels) {
    try {
      const b = page.getByRole("button", { name: re }).first();
      if (await b.isVisible({ timeout: 700 })) {
        await b.click({ timeout: 1500 });
        await page.waitForTimeout(600);
        return re.source;
      }
    } catch { /* try the next phrasing */ }
  }
  return null;
}

for (const it of ITEMS) {
  const row = { beat: it.beat, outlet: it.outlet, page: false, key: false };
  try {
    await page.goto(it.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1800);
    row.consent = await declineConsent();
    await page.waitForTimeout(1200);

    // (a) the page top — the naive screenshot
    const raw = `${TMP}/${it.beat}.png`;
    await page.screenshot({ path: raw });
    await sharp(raw)
      .extract({ left: 0, top: 0, width: 1280, height: 640 })
      .resize(FRAME_W, FRAME_H, { fit: "cover" })
      .webp({ quality: 82 })
      .toFile(`${OUT}/${it.beat}-page.webp`);
    row.page = true;

    // (b) the key visual the publisher authored as a thumbnail
    const og = await page.evaluate(() => {
      const pick = (sel, attr) => document.querySelector(sel)?.getAttribute(attr) || null;
      return (
        pick('meta[property="og:image"]', "content") ||
        pick('meta[name="twitter:image"]', "content") ||
        pick('meta[name="twitter:image:src"]', "content")
      );
    });
    row.og = og ? og.slice(0, 110) : null;
    if (og) {
      const abs = new URL(og, it.url).href;
      const res = await ctx.request.get(abs, { timeout: 30000 });
      if (res.ok()) {
        const buf = Buffer.from(await res.body());
        await sharp(buf)
          .resize(FRAME_W, FRAME_H, { fit: "cover", position: "attention" })
          .webp({ quality: 84 })
          .toFile(`${OUT}/${it.beat}-key.webp`);
        row.key = true;
      } else {
        row.error = `og fetch ${res.status()}`;
      }
    }
  } catch (e) {
    row.error = String(e).split("\n")[0].slice(0, 140);
  }
  report.push(row);
  console.log(JSON.stringify(row));
}

await browser.close();
await rm(TMP, { recursive: true, force: true });
await writeFile(`${OUT}/_capture-report.json`, JSON.stringify(report, null, 2));
console.log(
  `\nDONE  page ${report.filter((r) => r.page).length}/${ITEMS.length}` +
    `  key ${report.filter((r) => r.key).length}/${ITEMS.length}`,
);
