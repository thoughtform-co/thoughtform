/**
 * Profile a key-visual plate's bright (or dark) mass, in IMAGE FRACTIONS.
 *
 * WHY THIS EXISTS (ADR-105 U2). The footer's band has to clear the plate's
 * subject, and U1 settled that question by EYE and answered it by deleting a
 * column: a CTA at ~55 % of the band landed in the ring's bright metal trail,
 * gold mono on near-white. U2 wants the four-column band the owner picked, so
 * the same question has to be answered with a number instead — where does the
 * trail START, as a fraction of the picture?
 *
 * ⚠ IT RUNS PER ASSET, NOT PER VIEWPORT, and that is the whole economy of it.
 * Both plates are `cover` against a box that IS the station box, and every
 * desktop rung this site is read at is HEIGHT-BOUND (station aspect < image
 * aspect: 1.540 at 1920x1247, 1.600 at 1440x900, 1.778 at 1280x720 which is
 * no crop at all). Height-bound means the image's full height is shown, so
 *
 *     image-y fraction === station-y fraction, exactly, on every desktop rung.
 *
 * So `trailTopFrac` measured here once is a STATION fraction verbatim, and the
 * composition can be solved against it without re-measuring per viewport.
 * Only x is cropped: u(imageX) = 0.5 + (imageX - 0.5) * A/S.
 *
 * ⚠ AND THE SAME ARITHMETIC RETIRES AN OPEN ITEM. ADR-105 left "nudge
 * `object-position: center 45%` if the baked caption shows" as the named fix;
 * height-bound means there is no vertical crop to move, so that nudge is a
 * NO-OP at every rung the site is read at and only becomes a lever above 16:9.
 * The caption has to be buried by the scrim's bottom band instead.
 *
 * Usage:
 *   node scripts/measure-plate-luminance.mjs
 *   node scripts/measure-plate-luminance.mjs --asset /images/Gateway_v1b.webp --polarity bright
 */
import { chromium } from "playwright";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const PORT = argOf("--port", "3003");
const GRID_W = Number(argOf("--gw", "240"));
const GRID_H = Number(argOf("--gh", "135"));

/** The two plates the footer swaps between, with the polarity each is read at.
 *  ⚠ ONE PROBE, POLARITY PER PLATE — `Gateway_v1b` is cream-on-void so its
 *  subject is the BRIGHT mass; `Gateway_v2-light` is ink-on-parchment, so its
 *  subject is the DARK mass. Reading both as "bright" would return the light
 *  plate's empty sky. */
const PLATES = [
  { src: "/images/Gateway_v1b.webp", theme: "dark", polarity: "bright", threshold: 0.35 },
  { src: "/images/Gateway_v2-light.webp", theme: "light", polarity: "dark", threshold: 0.45 },
];

const page = await (async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage();
  p.on("console", (m) => {
    if (m.type() === "error") console.error("  page error:", m.text());
  });
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: "domcontentloaded" });
  p.__browser = browser;
  return p;
})();

for (const plate of PLATES) {
  const out = await page.evaluate(
    async ({ src, polarity, threshold, GRID_W, GRID_H }) => {
      const img = new Image();
      img.decoding = "sync";
      img.src = src;
      await img.decode();
      const W = img.naturalWidth;
      const H = img.naturalHeight;

      const c = new OffscreenCanvas(GRID_W, GRID_H);
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, GRID_W, GRID_H);
      const { data } = ctx.getImageData(0, 0, GRID_W, GRID_H);

      // WCAG relative luminance, sRGB-linearised.
      const lin = (v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      const L = new Float32Array(GRID_W * GRID_H);
      for (let i = 0; i < L.length; i++) {
        const o = i * 4;
        L[i] = 0.2126 * lin(data[o]) + 0.7152 * lin(data[o + 1]) + 0.0722 * lin(data[o + 2]);
      }

      const hit = (i) => (polarity === "bright" ? L[i] > threshold : L[i] < threshold);

      // The mask's bounding box, and a per-row max so the FIRST row the
      // subject enters is explicit rather than inferred from the bbox.
      let x0 = 1,
        x1 = 0,
        y0 = 1,
        y1 = 0,
        n = 0;
      const rowMax = new Array(GRID_H).fill(0);
      const rowMaxRight = new Array(GRID_H).fill(0); // only x > 0.5
      for (let y = 0; y < GRID_H; y++) {
        for (let x = 0; x < GRID_W; x++) {
          const i = y * GRID_W + x;
          const v = polarity === "bright" ? L[i] : 1 - L[i];
          rowMax[y] = Math.max(rowMax[y], v);
          if (x / GRID_W > 0.5) rowMaxRight[y] = Math.max(rowMaxRight[y], v);
          if (hit(i)) {
            n++;
            x0 = Math.min(x0, x / GRID_W);
            x1 = Math.max(x1, (x + 1) / GRID_W);
            y0 = Math.min(y0, y / GRID_H);
            y1 = Math.max(y1, (y + 1) / GRID_H);
          }
        }
      }

      // Largest connected component of the mask — the ring and its trail,
      // with speckle excluded. Flood fill, 4-connected.
      const seen = new Uint8Array(GRID_W * GRID_H);
      let best = null;
      for (let i = 0; i < seen.length; i++) {
        if (seen[i] || !hit(i)) continue;
        const stack = [i];
        seen[i] = 1;
        let cx0 = 1,
          cx1 = 0,
          cy0 = 1,
          cy1 = 0,
          count = 0;
        while (stack.length) {
          const j = stack.pop();
          const jx = j % GRID_W;
          const jy = (j - jx) / GRID_W;
          count++;
          cx0 = Math.min(cx0, jx / GRID_W);
          cx1 = Math.max(cx1, (jx + 1) / GRID_W);
          cy0 = Math.min(cy0, jy / GRID_H);
          cy1 = Math.max(cy1, (jy + 1) / GRID_H);
          const nb = [
            jx > 0 ? j - 1 : -1,
            jx < GRID_W - 1 ? j + 1 : -1,
            jy > 0 ? j - GRID_W : -1,
            jy < GRID_H - 1 ? j + GRID_W : -1,
          ];
          for (const k of nb) if (k >= 0 && !seen[k] && hit(k)) ((seen[k] = 1), stack.push(k));
        }
        if (!best || count > best.count) best = { count, x0: cx0, x1: cx1, y0: cy0, y1: cy1 };
      }

      // The top of the subject on the RIGHT half — what U1's collision was
      // actually about, and the number G1 is solved against.
      const T = polarity === "bright" ? threshold : 1 - threshold;
      let trailTopFrac = 1;
      for (let y = 0; y < GRID_H; y++) {
        if (rowMaxRight[y] > T) {
          trailTopFrac = y / GRID_H;
          break;
        }
      }

      return {
        natural: [W, H],
        aspect: Math.round((W / H) * 10000) / 10000,
        maskShare: Math.round((n / L.length) * 10000) / 10000,
        bbox: [x0, y0, x1, y1].map((v) => Math.round(v * 1000) / 1000),
        largest: best
          ? {
              share: Math.round((best.count / L.length) * 10000) / 10000,
              box: [best.x0, best.y0, best.x1, best.y1].map((v) => Math.round(v * 1000) / 1000),
            }
          : null,
        trailTopFrac: Math.round(trailTopFrac * 1000) / 1000,
        rowProfile: rowMax
          .map((v, y) => (y % 9 === 0 ? `${(y / GRID_H).toFixed(2)}:${v.toFixed(2)}` : null))
          .filter(Boolean)
          .join(" "),
      };
    },
    { ...plate, GRID_W, GRID_H }
  );

  console.log(`\n${plate.src}  (${plate.theme}, ${plate.polarity} mass @ L ${plate.threshold})`);
  console.log(`  natural ${out.natural.join("x")}  aspect ${out.aspect}`);
  console.log(`  mask share ${out.maskShare}  bbox [x0 y0 x1 y1] ${out.bbox.join(" ")}`);
  if (out.largest)
    console.log(`  largest component share ${out.largest.share}  box ${out.largest.box.join(" ")}`);
  console.log(`  ⇒ trailTopFrac ${out.trailTopFrac}   (the subject's top on the right half)`);
  console.log(`  row profile: ${out.rowProfile}`);
}

console.log(`
G1 is: bandBottomFrac <= trailTopFrac - 0.04, per plate.
Height-bound on every desktop rung, so these y fractions are STATION fractions.
`);
await page.__browser.close();
