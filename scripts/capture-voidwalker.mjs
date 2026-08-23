/**
 * capture-voidwalker — the through-line (#voidwalker, ADR-074) ON THE REAL
 * LANDING: the about → voidwalker seam, the masthead decode, every beat at
 * its reading line, and the six drawings measured.
 *
 * HEADED by default: the section sits one station below the WebGL corridor
 * and the pinned #about stage, and the ambient-kill seam it inherits only
 * exists with a live canvas. Pass `--headless` to check the DOM alone.
 *
 * Real scrolls, never a teleport (`.claude/rules/services-ring.md`): the
 * walk steps down from the services runway so the corridor-exit clocks run
 * in order, then lands each beat's marker on the 40 % reading line.
 *
 * Usage (dev server must already be running):
 *   node scripts/capture-voidwalker.mjs [--port 3003] [--vp 1440x800] [--theme light]
 */

import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "docs/design/voidwalker");
const HEADLESS = args.includes("--headless");
const THEME = argOf("--theme", "dark");
const [VW, VH] = argOf("--vp", "1440x800").split("x").map(Number);
const READ_LINE = 0.4;

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: HEADLESS });
const ctx = await browser.newContext({
  viewport: { width: VW, height: VH },
  reducedMotion: "no-preference",
  colorScheme: THEME === "light" ? "light" : "dark",
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

const tag = (name) => `${OUT}/${VW}x${VH}_${THEME}_${name}.png`;
const shot = (name) => page.screenshot({ path: tag(name) });

/** Scroll in real steps of ≤ 0.5vh so every scroll-driven clock sees the
 *  travel, then settle. */
async function walkTo(y) {
  await page.evaluate(async (target) => {
    const step = Math.max(80, window.innerHeight * 0.5);
    const dir = Math.sign(target - window.scrollY) || 1;
    while (Math.abs(target - window.scrollY) > step) {
      window.scrollTo(0, window.scrollY + dir * step);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }
    window.scrollTo(0, target);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, y);
}

const readState = () =>
  page.evaluate(() => {
    const html = document.documentElement;
    const vw = document.querySelector("#voidwalker .vw");
    const spine = vw?.querySelector(".vw__spine");
    const beats = [...(vw?.querySelectorAll(".vw-beat") ?? [])];
    return {
      scrollY: Math.round(window.scrollY),
      ambient: html.hasAttribute("data-services-ambient"),
      exit: html.hasAttribute("data-corridor-exit"),
      aboutMode: document.getElementById("about")?.getAttribute("data-about-mode") ?? null,
      ready: vw?.hasAttribute("data-vw-ready") ?? null,
      beat: vw?.getAttribute("data-vw-beat") ?? null,
      p: spine?.style.getPropertyValue("--vw-p") ?? "",
      b: beats.map((el) => el.style.getPropertyValue("--vw-b") || "-"),
      title: vw?.querySelector(".vw-head__title .vw-decode__live")?.textContent ?? null,
      bg: vw ? getComputedStyle(document.getElementById("voidwalker")).backgroundColor : null,
      readout: document.querySelector(".hud__nav__sector__name")?.textContent ?? null,
    };
  });

try {
  await page.goto(`http://localhost:${PORT}/${THEME === "light" ? "?theme=light" : ""}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".home-v2-stage", { timeout: 60_000 });
  await page.waitForSelector("#voidwalker .vw", { state: "attached", timeout: 60_000 });
  await page.waitForTimeout(1500);

  /* ── 1 · the seam: about runway → the cover ───────────────────────── */
  const geo = await page.evaluate(() => {
    const runway = document.querySelector(".about-stage-root");
    const vw = document.getElementById("voidwalker");
    const r = runway?.getBoundingClientRect();
    return {
      aboutTop: r ? Math.round(r.top + window.scrollY) : null,
      aboutH: r ? Math.round(r.height) : null,
      vwTop: vw ? Math.round(vw.getBoundingClientRect().top + window.scrollY) : null,
      vwH: vw?.offsetHeight ?? null,
    };
  });
  if (geo.vwTop == null) throw new Error("no #voidwalker");

  // Mid-about: the ambient must be alive (the pinned transparent stage).
  if (geo.aboutTop != null) {
    await walkTo(Math.round(geo.aboutTop + (geo.aboutH - VH) * 0.5));
    await page.waitForTimeout(700);
  }
  const midAbout = await readState();

  // +0.4vh above the cover's top: still alive; at 0.0vh: dead.
  await walkTo(geo.vwTop - Math.round(VH * 0.4));
  await page.waitForTimeout(500);
  const nearCover = await readState();
  await shot("seam-04vh");
  await walkTo(geo.vwTop);
  await page.waitForTimeout(500);
  const atCover = await readState();
  await shot("seam-00vh");

  /* ── 2 · the masthead ─────────────────────────────────────────────── */
  await walkTo(geo.vwTop + 40);
  await page.waitForTimeout(1400);
  const head = await readState();
  await shot("masthead");

  /* ── 3 · every beat at its reading line ───────────────────────────── */
  const markers = await page.evaluate(() =>
    [...document.querySelectorAll("#voidwalker .vw-beat")].map((b) => {
      const d = b.querySelector(".vw-beat__diamond");
      const r = d.getBoundingClientRect();
      return { id: b.id, y: Math.round(r.top + r.height / 2 + window.scrollY) };
    })
  );
  const beatsAtLine = [];
  for (const [i, m] of markers.entries()) {
    await walkTo(m.y - Math.round(VH * READ_LINE) + 4);
    await page.waitForTimeout(350);
    const s = await readState();
    beatsAtLine.push({ id: m.id, b: s.b[i], next: s.b[i + 1] ?? null, beat: s.beat });
    if (i === 1 || i === 4 || i === 6) await shot(`beat-${String(i + 1).padStart(2, "0")}`);
  }

  /* ── 4 · scroll back above beat 02: it must reset ─────────────────── */
  await walkTo(markers[1].y - Math.round(VH * READ_LINE) - Math.round(VH * 0.5));
  await page.waitForTimeout(350);
  const reversed = await readState();

  /* ── 5 · the drawings, measured ───────────────────────────────────── */
  await walkTo(markers[4].y - Math.round(VH * READ_LINE));
  await page.waitForTimeout(400);
  const wires = await page.evaluate(() => {
    const out = [];
    for (const wire of document.querySelectorAll("#voidwalker .vw-wire")) {
      const id = [...wire.classList].find((c) => c.startsWith("vw-wire--"))?.slice(9);
      const inEl = wire.querySelector(".vw-wire__in");
      const labels = [];
      for (const el of wire.querySelectorAll("*")) {
        const own = [...el.childNodes]
          .filter((n) => n.nodeType === 3)
          .map((n) => n.textContent.trim())
          .join("");
        if (!own) continue;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        labels.push({
          t: own,
          fam: cs.fontFamily.split(",")[0].replace(/"/g, ""),
          px: Math.round(parseFloat(cs.fontSize) * 10) / 10,
          x: r.left,
          y: r.top,
          w: r.width,
          h: r.height,
        });
      }
      let overlaps = 0;
      for (let a = 0; a < labels.length; a++)
        for (let b = a + 1; b < labels.length; b++) {
          const A = labels[a];
          const B = labels[b];
          if (A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h) overlaps++;
        }
      const collapsed = [...wire.querySelectorAll("i, b, svg")].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width < 1 || r.height < 1;
      }).length;
      const box = inEl.getBoundingClientRect();
      out.push({
        id,
        box: `${Math.round(box.width)}x${Math.round(box.height)}`,
        labels: labels.map((l) => l.t).sort(),
        minPx: Math.min(...labels.map((l) => l.px)),
        fams: [...new Set(labels.map((l) => l.fam))],
        overlaps,
        collapsed,
        overflow:
          inEl.scrollWidth > inEl.clientWidth + 1 || inEl.scrollHeight > inEl.clientHeight + 1,
        gold: wire.querySelectorAll("[data-gold]").length,
      });
    }
    return out;
  });
  for (const [i, id] of [
    "pokemon-go",
    "ophef",
    "expanse",
    "coins",
    "classroom",
    "genai",
  ].entries()) {
    const m = markers.find((x) => x.id === `vw-${id}`);
    await walkTo(m.y - Math.round(VH * READ_LINE));
    await page.waitForTimeout(350);
    await page
      .locator(`#vw-${id} .vw-plate`)
      .screenshot({ path: tag(`plate-${String(i + 1).padStart(2, "0")}-${id}`) });
  }

  /* ── 6 · the foot and the hand-off ────────────────────────────────── */
  await walkTo(geo.vwTop + geo.vwH - VH);
  await page.waitForTimeout(400);
  const foot = await readState();
  await shot("foot");

  console.log(
    JSON.stringify(
      {
        viewport: `${VW}x${VH}`,
        theme: THEME,
        geo,
        midAbout,
        nearCover,
        atCover,
        head,
        beatsAtLine,
        reversed: { b: reversed.b, beat: reversed.beat, title: reversed.title },
        wires,
        foot: { beat: foot.beat, p: foot.p, readout: foot.readout },
        errors,
      },
      null,
      2
    )
  );
  console.log(`stills in ${OUT}/`);
} finally {
  await browser.close();
}
