/**
 * capture-casefile — the Studio and ATL rows on the REAL landing, measured.
 *
 * HEADED: the casefile lives inside the scroll-driven WebGL corridor and a
 * headless context leaves the canvas dead. Real scrolls, never a teleport.
 * Rows are selected by CLICK, which pins the scroll to that row's browse
 * band centre — the supported contract, and it does not depend on guessing
 * a dwell fraction.
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const PORT = argOf("--port", "3003");
const OUT = argOf("--out", "shots");
const THEME = argOf("--theme", "dark");
const [VW, VH] = argOf("--vp", "1920x1247").split("x").map(Number);
const ROWS = argOf("--rows", "2,3").split(",").map(Number);

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({
  viewport: { width: VW, height: VH },
  reducedMotion: "no-preference",
  colorScheme: THEME === "light" ? "light" : "dark",
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));

const PROOF_RUNWAY_VH = 3.2;

try {
  await page.goto(`http://localhost:${PORT}/${THEME === "light" ? "?theme=light" : ""}`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".home-v2-stage", { timeout: 60_000 });

  const target = await page.evaluate(
    ({ vh, at }) => {
      const runway = document.querySelector(".services-stage-root");
      if (!runway) return null;
      const rect = runway.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const travel = Math.max(0, rect.height - window.innerHeight);
      return Math.round(top + Math.min(travel, window.innerHeight * vh) * at);
    },
    { vh: PROOF_RUNWAY_VH, at: 0.09 }
  );
  if (target == null) throw new Error("no .services-stage-root — the corridor never mounted");

  await page.evaluate((y) => window.scrollTo(0, y), target);
  await page.waitForTimeout(700);
  await page.waitForSelector("[data-proof-settled]", { timeout: 30_000 });
  await page.waitForTimeout(700);

  for (const idx of ROWS) {
    await page.locator(".fl-row").nth(idx).click();
    await page.waitForTimeout(1100);

    const read = await page.evaluate(() => {
      const px = (n) => Math.round(n * 10) / 10;
      const ov = (el) =>
        el
          ? { x: px(el.scrollWidth - el.clientWidth), y: px(el.scrollHeight - el.clientHeight) }
          : null;
      const box = (el) =>
        el
          ? `${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`
          : null;

      const plate = document.querySelector("[class*='fl-plate--']");
      const field = document.querySelector(".fl-con__field");
      const cons = document.querySelector(".fl-con__console");

      // Visible still tiles, and their rendered size.
      const tiles = [...document.querySelectorAll(".fl-still")].filter(
        (t) => getComputedStyle(t).display !== "none"
      );
      const t0 = tiles[0]?.getBoundingClientRect();

      // Register: real line count per description, ignoring the clamp.
      const regBox = document.querySelector(".fl-proof-register");
      const list = document.querySelector(".fl-proof-register__list");
      const lines = [...document.querySelectorAll(".fl-proof-register__description")].map((el) => {
        const cs = getComputedStyle(el);
        if (cs.position === "absolute") return "sr-only";
        /* A `-webkit-box` clips rather than overflows, so measure a CLONE
           with the clamp unset: the clamp truncating live copy is the bug
           this is looking for, and the clamped box cannot report it. */
        const c = el.cloneNode(true);
        c.style.webkitLineClamp = "unset";
        c.style.lineClamp = "unset";
        c.style.display = "block";
        c.style.position = "absolute";
        c.style.visibility = "hidden";
        c.style.width = el.getBoundingClientRect().width + "px";
        el.parentElement.appendChild(c);
        const n = Math.round(c.scrollHeight / parseFloat(cs.lineHeight));
        c.remove();
        return n;
      });
      const claimPx = (() => {
        const el = document.querySelector(".fl-proof-register__claim");
        return el ? getComputedStyle(el).fontSize : null;
      })();
      const descPx = (() => {
        const el = document.querySelector(".fl-proof-register__description");
        return el ? getComputedStyle(el).fontSize : null;
      })();

      // The production block, if this is the films row.
      const prod = document.querySelector(".fl-filmprod");
      const stage = document.querySelector(".fl-filmstage");
      const frame = document.querySelector(".fl-filmframe");

      /* ADR-088's rhythm, printed beside the type it was traded against. The
         two seams are measured BOX to BOX (row-independent), and the seat is
         the last directory row against tick 11 — which `.fl-left`'s own bottom
         IS, by construction, so this reads the law without needing the rail's
         fixed box while the page may not be at the beat. */
      const left = document.querySelector(".fl-left");
      const dirBox = document.querySelector(".fl-dir");
      const briefBox = document.querySelector(".fl-brief");
      const rows = [...document.querySelectorAll(".fl-row")];
      const rhythm =
        left && dirBox && briefBox && regBox && rows.length
          ? {
              gapA: +(
                regBox.getBoundingClientRect().top - briefBox.getBoundingClientRect().bottom
              ).toFixed(1),
              gapB: +(
                dirBox.getBoundingClientRect().top - regBox.getBoundingClientRect().bottom
              ).toFixed(1),
              seatOnT11: +(
                rows[rows.length - 1].getBoundingClientRect().bottom -
                left.getBoundingClientRect().bottom
              ).toFixed(2),
              dirH: Math.round(dirBox.getBoundingClientRect().height),
            }
          : null;

      return {
        plate: plate?.className.match(/fl-plate--\w+/)?.[0] ?? null,
        field: box(field),
        console: box(cons),
        consoleBg: cons ? getComputedStyle(cons).backgroundColor : null,
        overflow: { plate: ov(plate), field: ov(field) },
        rhythm,
        tiles: tiles.length,
        tile0: t0 ? `${Math.round(t0.width)}x${Math.round(t0.height)}` : null,
        register: {
          box: box(regBox),
          listH: list ? Math.round(list.getBoundingClientRect().height) : null,
          overflow: ov(regBox),
          claimPx,
          descPx,
          descLines: lines,
        },
        films: prod
          ? {
              prodH: Math.round(prod.getBoundingClientRect().height),
              stageH: Math.round(stage.getBoundingClientRect().height),
              frame: box(frame),
              airTop: Math.round(
                frame.getBoundingClientRect().top - stage.getBoundingClientRect().top
              ),
              airBottom: Math.round(
                stage.getBoundingClientRect().bottom - frame.getBoundingClientRect().bottom
              ),
            }
          : null,
      };
    });

    const bad =
      read.overflow.plate.x +
      read.overflow.plate.y +
      read.overflow.field.x +
      read.overflow.field.y +
      (read.register.overflow?.x ?? 0) +
      (read.register.overflow?.y ?? 0);
    /* A description past two lines is TRUNCATED, not wrapped — the clamp
       hides it and reports no overflow, which is the one failure every
       other guard on this column is blind to (ADR-066: a clamp that cuts
       live copy is a bug, never a layout lever). */
    const clipped = read.register.descLines.some((n) => typeof n === "number" && n > 2);
    console.log(
      `${VW}x${VH} ${THEME} row${idx} ${String(read.plate).padEnd(17)}` +
        ` field ${String(read.field).padEnd(9)} tiles ${read.tiles} ${String(read.tile0 ?? "-").padEnd(9)}` +
        ` reg ${read.register.box} ${read.register.claimPx}/${read.register.descPx}` +
        ` lines[${read.register.descLines}]` +
        (read.rhythm
          ? ` seams ${read.rhythm.gapA}/${read.rhythm.gapB} dir ${read.rhythm.dirH} t11${read.rhythm.seatOnT11 >= 0 ? "+" : ""}${read.rhythm.seatOnT11}`
          : "") +
        (read.films
          ? ` film ${read.films.frame} air ${read.films.airTop}/${read.films.airBottom} prod ${read.films.prodH}`
          : "") +
        `  ${bad === 0 && !clipped ? "OK" : "*** OVERFLOW / CLIP ***"}`
    );
    if (bad !== 0 || clipped) console.log(JSON.stringify(read, null, 2));

    await page
      .locator(".fl-con__console")
      .screenshot({ path: `${OUT}/${VW}x${VH}_${THEME}_row${idx}.png` });
    await page
      .locator(".fl-proof-register")
      .screenshot({ path: `${OUT}/${VW}x${VH}_${THEME}_row${idx}_register.png` });
    /* The whole stage, because the console's TRANSPARENCY can only be judged
       against what is behind it — a crop of the console shows the blend and
       not the thing it is blending with. */
    if (args.includes("--stage"))
      await page.screenshot({ path: `${OUT}/${VW}x${VH}_${THEME}_row${idx}_stage.png` });

    // The sheets row has three stations; shoot each.
    const stations = await page.locator(".fl-con__stn").count();
    if (read.plate === "fl-plate--sheets") {
      for (let s = 0; s < stations; s++) {
        await page.locator(".fl-con__stn").nth(s).click();
        await page.waitForTimeout(650);
        await page
          .locator(".fl-con__console")
          .screenshot({ path: `${OUT}/${VW}x${VH}_${THEME}_row${idx}_stn${s}.png` });
      }
      await page.locator(".fl-con__stn").nth(0).click();
      await page.waitForTimeout(400);
    }
  }

  if (errors.length) console.log("\nPAGE ERRORS:", errors);
  else console.log("\nno page errors");
} finally {
  await browser.close();
}
