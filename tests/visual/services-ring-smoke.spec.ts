import { expect, test, type Page } from "@playwright/test";

import { WIREFRAME_STATIONS, expectWireframeBay, readToolBay } from "./helpers/toolBay";

import {
  BROWSE_HYSTERESIS,
  browseRowBand,
  browseTargetFor,
} from "../../components/landing/home-v2/services/casefile/browseMap";
import {
  SERVICES_PROOF_BROWSE_FRAC,
  SERVICES_PROOF_RUNWAY_VH,
  SERVICES_PROOF_SEGMENTS,
} from "../../components/landing/home-v2/unifiedServicesInstrument";
import { VOIDWALKER_ERA_BAND } from "../../lib/voidwalker/voidwalkerHologramClock";

/* ── THE DWELL SAMPLES ARE DERIVED, NOT COUNTED (ADR-087 Phase B) ────────
   Every number below used to be hand-computed in a comment and typed in as
   a literal — 0.82 as "0.625 + 0.52 × 0.375", 0.42 as "two thirds into the
   browse band", 0.29 as "row two's edge plus the hysteresis". Those comments
   were correct and load-bearing, which is the problem: the dwell is a
   DERIVATION now, and the arithmetic in a comment is the arithmetic that
   does not move when `CASES` grows. A second client re-shapes every band
   edge, and a literal would go on passing while sampling the wrong beat.

   Same precedent as `helpers/toolBay.ts`: the spec imports the production
   arithmetic and targets BEATS rather than offsets. ⚠ Two of these are NOT
   the old literal — the browse targets become their band's CENTRE (0.078125
   and 0.390625 rather than 0.1 and 0.42), which selects the SAME rows with
   more clearance from both edges. The other three are the old literals to
   the last representable digit. ═══════════════════════════════════════ */

/** releaseP → a fraction of the WHOLE dwell (the U13 remap). */
const releaseToTotal = (r: number) =>
  SERVICES_PROOF_BROWSE_FRAC + r * (1 - SERVICES_PROOF_BROWSE_FRAC);

/** A directory row's band CENTRE, as a fraction of the whole dwell — the
 *  same expression a row CLICK pins the scroll to. */
const dwellAtRow = (clientIdx: number, rowIdx: number) =>
  browseTargetFor(SERVICES_PROOF_SEGMENTS, clientIdx, rowIdx) * SERVICES_PROOF_BROWSE_FRAC;

/** Row one — the MAP row, the default panel, and the settled/uncontested
 *  sample every viewport walk starts from. */
const DWELL_ROW_1 = dwellAtRow(0, 0);
/** Row three — the row the scrollspy must reach with no click. */
const DWELL_ROW_3 = dwellAtRow(0, 2);
/** Row two's band, which a CLICK must land the browse channel inside. */
const ROW_2_BAND = browseRowBand(SERVICES_PROOF_SEGMENTS, 0, 1);
/** The interleave crossing, validated at releaseP 0.52. */
const DWELL_INTERLEAVE = releaseToTotal(0.52);
/** The reverse handoff, validated at releaseP 0.40. */
const DWELL_REARM = releaseToTotal(0.4);

console.log(
  `[services-ring-smoke] derived dwell samples — row1 ${DWELL_ROW_1} (was 0.1), ` +
    `row3 ${DWELL_ROW_3} (was 0.42), interleave ${DWELL_INTERLEAVE} (was 0.82), ` +
    `rearm ${DWELL_REARM} (was 0.775), row2 band ${ROW_2_BAND.start}..${ROW_2_BAND.end} ` +
    `(click floor ${ROW_2_BAND.start + BROWSE_HYSTERESIS}, was 0.29/0.5), ` +
    `runway ${SERVICES_PROOF_RUNWAY_VH}vh, browse frac ${SERVICES_PROOF_BROWSE_FRAC}`
);

/**
 * Services card ring smoke (ADR-029).
 *
 * Structural contracts only — no screenshot baselines (mirrors
 * gateway-motion-smoke.spec.ts). Covers:
 *   - ring mode retires the console racks on desktop (the orbiting cards
 *     carry their full C3 copy on the baked face);
 *   - the scroll clock advances the active service (rack copy + step);
 *   - the regenerated photo assets resolve (the embedded/workshop.webp 404
 *     regression);
 *   - the /test/services-orbit lab mounts one sized WebGL canvas;
 *   - mobile + reduced-motion keep the plate accordion, with no ring
 *     overlays in the DOM.
 *
 * Note: WebGL canvas CONTENT is not asserted (corridor canvas runs
 * preserveDrawingBuffer: false); the ring's math is pinned by
 * tests/lib/services-ring-math.test.ts instead.
 */

// The desktop assertions depend on the corridor WebGL pipeline actually
// painting (card anchors publish from useFrame) — running several landing
// pages in parallel against one dev server starves headless GPU contexts
// and the instrument never mounts. Serialize this file's tests.
test.describe.configure({ mode: "serial" });

/** Scroll the window so the services runway sits at `progress` (0..1).
 *
 * MUST use the two-arg `window.scrollTo(0, y)` form (rides the page's
 * smooth scroll), NOT `{ behavior: "instant" }`: an instant teleport skips
 * the corridor's scroll-driven engagement band, the canvas frameloop never
 * wakes, and the instrument (mark + card ring) renders nothing — the smoke
 * then fails on a dead canvas that no real scroll path produces.
 *
 * The runway position MUST be measured AFTER the corridor has mounted and
 * inflated the layout above #services: HomeCorridor is a lazy client chunk
 * (2026-07-14 perf pass), so `.services-stage` appearing does not yet mean
 * the page has its final height — measuring early lands the scroll far
 * above the runway and the step clock reads 0. */
/**
 * Scroll to a given RING progress (0..1).
 *
 * ADR-056 put the proof casefile at the FRONT of the services runway, so
 * runway progress is no longer ring progress — the first
 * `SERVICES_PROOF_RUNWAY_VH` viewports belong to the casefile and the ring
 * is dark across them. Converting here keeps every call site pinned to the
 * BEAT it means rather than to a raw offset that silently shifted.
 */
async function scrollServicesRunway(page: Page, ringProgress: number): Promise<boolean> {
  await page.waitForSelector(".home-v2-stage", { timeout: 20_000 });
  const target = await page.evaluate(
    ({ p, proofVh }) => {
      const runway = document.querySelector(".services-stage-root");
      if (!runway) return null;
      const rect = runway.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const travel = Math.max(0, rect.height - window.innerHeight);
      const proof = Math.min(travel, window.innerHeight * proofVh);
      return Math.round(top + proof + (travel - proof) * p);
    },
    { p: ringProgress, proofVh: SERVICES_PROOF_RUNWAY_VH }
  );
  if (target == null) return false;
  await page.evaluate((y) => window.scrollTo(0, y), target);
  await page.waitForTimeout(600);
  return true;
}

/** Scroll to a fraction of the CASEFILE's dwell at the front of the runway. */
async function scrollCasefileDwell(page: Page, progress: number): Promise<boolean> {
  await page.waitForSelector(".home-v2-stage", { timeout: 20_000 });
  const target = await page.evaluate(
    ({ p, proofVh }) => {
      const runway = document.querySelector(".services-stage-root");
      if (!runway) return null;
      const rect = runway.getBoundingClientRect();
      const top = rect.top + window.scrollY;
      const travel = Math.max(0, rect.height - window.innerHeight);
      return Math.round(top + Math.min(travel, window.innerHeight * proofVh) * p);
    },
    { p: progress, proofVh: SERVICES_PROOF_RUNWAY_VH }
  );
  if (target == null) return false;
  await page.evaluate((y) => window.scrollTo(0, y), target);
  await page.waitForTimeout(600);
  return true;
}

/**
 * Measure one map sheet, in SCREEN space (ADR-062).
 *
 * Runs inside the page, against either the casefile panel
 * The map plate (`.fl-pda`).
 *
 * `preserveAspectRatio="xMidYMid meet"` scales by the MINIMUM of the two
 * box ratios and centres the remainder, so `box.width / viewBox.width`
 * over-reports the board sheet by 16 %. Glyph boxes are therefore compared
 * in the SVG's own user units (`getBBox`) and the stamp in client rects,
 * because the stamp is DOM chrome that never entered user space.
 */
/**
 * Measure the map's current reading, in the drawing's own units.
 *
 * `preserveAspectRatio="xMidYMid meet"` scales by the MINIMUM of the two box
 * ratios and centres the remainder, so `box.width / viewBox.width`
 * over-reports. Glyph boxes are therefore compared in the SVG's own user
 * units (`getBBox`), and the rendered size is derived from the meet scale.
 */
function readPda() {
  const host = document.querySelector<HTMLElement>(".fl-pda");
  const svg = host?.querySelector<SVGSVGElement>(".fl-pda__svg");
  const field = host?.querySelector<HTMLElement>(".fl-con__field");
  if (!host || !svg || !field) return null;
  const vb = svg.viewBox.baseVal;
  const box = svg.getBoundingClientRect();
  const meet = Math.min(box.width / vb.width, box.height / vb.height);

  const items = [...svg.querySelectorAll("text")].map((t) => ({
    text: (t.textContent ?? "").slice(0, 40),
    b: t.getBBox(),
    px: Number.parseFloat(getComputedStyle(t).fontSize) * meet,
    // ⚠ AN AXIS-ALIGNED BOX IS ONLY A PROXY FOR INK WHILE THE TYPE IS
    // HORIZONTAL, and reading 03 sets 52 labels along ARCS (ADR-070 U32).
    // A diagonal run's bbox is mostly empty: two labels in neighbouring
    // cells, cleanly separated by their own 12-unit pad, report a large
    // box intersection. The first live capture of the carrier reported 22
    // such pairs with nothing touching on screen. So the pairwise test
    // splits by how the label is SET, and the arc family is measured with
    // an instrument that suits it — see `arcs` below.
    onPath: t.querySelector("textPath") != null,
    // Per-glyph origins in user space. `getStartPositionOfChar` follows the
    // textPath, so this is where the ink actually lands.
    pts: (() => {
      if (t.querySelector("textPath") == null) return [];
      const n = (t.textContent ?? "").length;
      const out: { x: number; y: number }[] = [];
      for (let c = 0; c < n; c++) {
        try {
          const p = (t as SVGTextContentElement).getStartPositionOfChar(c);
          out.push({ x: p.x, y: p.y });
        } catch {
          /* A character the engine will not position is a character it did
             not paint, so it cannot collide with anything. */
        }
      }
      return out;
    })(),
  }));

  // Every PAIR of HORIZONTAL glyph boxes. 0.5 units of tolerance so boxes that
  // merely touch — adjacent columns of a rail, a label sitting on a divider —
  // are not reported; a real collision is glyphs printing through glyphs.
  const flat = items.filter((i) => !i.onPath);
  const overlaps: string[] = [];
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      const a = flat[i].b;
      const b = flat[j].b;
      const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      if (ox > 0.5 && oy > 0.5) overlaps.push(`"${flat[i].text}" x "${flat[j].text}"`);
    }
  }

  // ── THE SAME QUESTION FOR ARC-SET TYPE ────────────────────────────────
  // Nearest glyph origin between two labels, against half a glyph advance
  // (13 × 0.6 ≈ 7.8 units at the cell rung). Under that the two runs are
  // printing through one another; the drawing's own clearances are an order
  // above it — 12 units of pad per cell end, 26 of course depth — so this
  // reports collisions and not tight fits.
  const arcs: string[] = [];
  const onPath = items.filter((i) => i.onPath && i.pts.length > 0);
  for (let i = 0; i < onPath.length; i++) {
    for (let j = i + 1; j < onPath.length; j++) {
      let near = Infinity;
      for (const p of onPath[i].pts) {
        for (const q of onPath[j].pts) {
          const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
          if (d < near) near = d;
        }
      }
      if (Math.sqrt(near) < 3.9) {
        arcs.push(`"${onPath[i].text}" x "${onPath[j].text}" @ ${Math.sqrt(near).toFixed(2)}u`);
      }
    }
  }

  // ── AND WHETHER AN ARC LABEL IS INSIDE ITS OWN CELL (ADR-070 U34) ─────
  // ⚠ THE ASSERTION THAT WOULD HAVE CAUGHT NINETEEN SPILLED LABELS AND DID
  // NOT EXIST. Every guard on this drawing — here and in `substrate-lab-fit`
  // — measured a label against a MEASURE: an advance against an arc, a line
  // box against a depth, an ink block against `cell.r0`/`cell.r1`. All of
  // those are lengths, and a length is silent about where the label SITS
  // relative to the wall the renderer paints. The plate's rings were
  // twelve-sided while the labels rode circles, so at each of the twelve edge
  // midpoints the wall came 13.1 units nearer than the radius every guard was
  // reading, and 19 of 47 labels printed through their own edge with
  // everything green.
  //
  // ⚠ IT COVERS THE BAND'S FIVE SUBSTRATE NAMES TOO, and that is free rather
  // than incidental: since ADR-070 U36 each band segment is a `.fl-pda-hit`
  // group shaped exactly like a cell's — one path, one `textPath` label — so
  // the walk below asks the same question of the region names it asks of the
  // 47 Skills. Nothing checked those before.
  //
  // This asks the render instead: is the ink inside the cell's own fill?
  // `isPointInFill` is the browser's own hit geometry on the very path the
  // cell is drawn from, so it cannot be satisfied by a model that has drifted
  // away from the drawing.
  //
  // ⚠ THE INK BLOCK IS ASYMMETRIC ABOUT THE BASELINE and testing ±half an em
  // is wrong in both directions: measured on this face a run of PT Mono puts
  // its ascender **0.769em ABOVE** the baseline and its descender **0.231em
  // below** (which is what makes `LABEL_INK_MID` 0.269 the half-difference and
  // `LABEL_INK_HALF` 0.500 the half-sum). ⚠ Swapping those two reports every
  // tight cell as a spill — the first cut of this probe did, and named
  // `Tracker Check` twelve times on a drawing with 5.5u of clearance, because
  // 0.769em is 10 units and the corridor's half-width is 11.9.
  //
  // The up-vector is the left normal of the direction of travel — `(ty, −tx)`
  // in SVG's y-down space — which is what makes one expression serve both
  // halves of the dial, where the arc is reversed so the type is not upside
  // down.
  const spills: string[] = [];
  for (const g of svg.querySelectorAll<SVGGElement>(".fl-pda-hit")) {
    const cell = g.querySelector<SVGPathElement>("path");
    const label = g.querySelector<SVGTextElement>("text");
    if (!cell || !label || label.querySelector("textPath") == null) continue;
    if (typeof cell.isPointInFill !== "function") continue;
    const n = (label.textContent ?? "").length;
    const at = (c: number) => {
      try {
        return label.getStartPositionOfChar(c);
      } catch {
        return null;
      }
    };
    const fs = Number.parseFloat(getComputedStyle(label).fontSize);
    for (let c = 0; c < n; c++) {
      const p = at(c);
      const q = at(c + 1 < n ? c + 1 : c - 1);
      if (!p || !q) continue;
      // Direction of travel, flipped when we had to borrow the PREVIOUS glyph.
      const s = c + 1 < n ? 1 : -1;
      const tx = (q.x - p.x) * s;
      const ty = (q.y - p.y) * s;
      const len = Math.hypot(tx, ty);
      if (len < 1e-6) continue;
      const ux = ty / len;
      const uy = -tx / len;
      for (const [dir, name] of [
        [0.769, "ascender"],
        [-0.231, "descender"],
      ] as const) {
        const pt = svg.createSVGPoint();
        pt.x = p.x + ux * dir * fs;
        pt.y = p.y + uy * dir * fs;
        if (!cell.isPointInFill(pt)) {
          spills.push(`"${(label.textContent ?? "").slice(0, 24)}" ${name} @ char ${c}`);
        }
      }
    }
  }

  return {
    texts: items.length,
    minPx: Number((items.length ? Math.min(...items.map((i) => i.px)) : 0).toFixed(2)),
    overlaps,
    arcs,
    arcTexts: onPath.length,
    spills: [...new Set(spills)],
    spillCells: svg.querySelectorAll(".fl-pda-hit").length,
    /* ⚠ **THE SVG'S FAMILIES, WHICH NOTHING PINNED UNTIL 2026-08-29.** The
       HTML type sweep below explicitly skips SVG, so this surface has twice
       shipped a wrong face here unnoticed: `--font-mono` (IBM Plex Mono)
       leaking into ~200 labels until ADR-085, and the hub asking for a
       weight its font instance did not load. Two roles now, and BOTH are
       asserted — the hub SPEAKS in IBM Plex Sans (ADR-085 U2), every other
       label LABELS in PT Mono. Asserting only the hub would let the mono
       half rot exactly as it did before. */
    hubFonts: [
      ...new Set(
        [...svg.querySelectorAll<SVGTextElement>(".fl-pda-hub-copy text")].map(
          (t) => getComputedStyle(t).fontFamily
        )
      ),
    ],
    labelFonts: [
      ...new Set(
        [...svg.querySelectorAll<SVGTextElement>("text")]
          .filter((t) => !t.closest(".fl-pda-hub-copy"))
          .map((t) => getComputedStyle(t).fontFamily)
      ),
    ],
    // 0.6 units of tolerance for sub-pixel bbox rounding; a real clip is a
    // whole glyph or more.
    clipped: items
      .filter(
        (i) =>
          i.b.x < vb.x - 0.6 ||
          i.b.x + i.b.width > vb.x + vb.width + 0.6 ||
          i.b.y < vb.y - 0.6 ||
          i.b.y + i.b.height > vb.y + vb.height + 0.6
      )
      .map((i) => i.text),
    fieldW: Math.round(field.clientWidth),
    fieldH: Math.round(field.clientHeight),
    drawnW: Math.round(vb.width * meet),
    drawnH: Math.round(vb.height * meet),
    overflowX: field.scrollWidth - field.clientWidth,
    overflowY: field.scrollHeight - field.clientHeight,
  };
}

function isDesktopViewport(page: Page): boolean {
  return (page.viewportSize()?.width ?? 0) >= 961;
}

function expectNear(actual: number, expected: number, tolerance: number, label: string) {
  expect(Math.abs(actual - expected), `${label}: ${actual} vs ${expected}`).toBeLessThanOrEqual(
    tolerance
  );
}

test.describe("Services card ring smoke (ADR-029)", () => {
  test("desktop: the proof casefile holds the stage before the ring arrives (ADR-056)", async ({
    page,
  }) => {
    test.skip(!isDesktopViewport(page), "the casefile layer is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });

    // Inside the BROWSE BAND (ADR-056 U13: the front 62.5 % of the dwell
    // steps the directory; the release owns only the back stretch). This is
    // row one's band CENTRE — the casefile is settled, uncontested and fully
    // live here, and the centre is the furthest a sample can sit from either
    // of the edges the hysteresis guards.
    expect(await scrollCasefileDwell(page, DWELL_ROW_1)).toBe(true);
    await page.waitForTimeout(1400);

    const during = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>(".services-stage");
      const casefile = document.querySelector<HTMLElement>(".fl-case");
      return {
        caseOpacity: casefile ? Number(getComputedStyle(casefile).opacity) : null,
        contentIn: Number.parseFloat(stage?.style.getPropertyValue("--svc-content-in") ?? "1"),
        // The ring's hit anchors are published off the card opacity, so a
        // published anchor here would mean a card is painting — AND that an
        // invisible click target is sitting over the casefile.
        hits: document.querySelectorAll(".svc-ring-hits__hit").length,
        rows: document.querySelectorAll(".fl-row").length,
      };
    });
    expect(during.caseOpacity).toBeGreaterThan(0.9);
    expect(during.contentIn).toBeLessThan(0.05);
    expect(during.hits).toBe(0);
    expect(during.rows).toBeGreaterThan(0);

    // The directory rows are the navigation, and they work while pinned.
    // Since U13 a click also PINS THE SCROLL to the row's browse band —
    // that is the contract that stops the scrollspy overriding the click on
    // the next frame — so the browse channel must land inside row two's own
    // band, past the hysteresis edge the spy would otherwise hold at.
    const secondRow = page.locator(".fl-row").nth(1);
    await secondRow.click();
    await page.waitForTimeout(400);
    await expect(secondRow).toHaveAttribute("aria-selected", "true");
    const browseAfterClick = await page.evaluate(() =>
      Number.parseFloat(
        document
          .querySelector<HTMLElement>(".fl-case")
          ?.style.getPropertyValue("--svc-proof-browse") ?? "-1"
      )
    );
    expect(browseAfterClick).toBeGreaterThan(ROW_2_BAND.start + BROWSE_HYSTERESIS);
    expect(browseAfterClick).toBeLessThan(ROW_2_BAND.end);

    // …and SCROLL drives the same selector (the U13 scrollspy): row three's
    // own band, reached with no click.
    expect(await scrollCasefileDwell(page, DWELL_ROW_3)).toBe(true);
    await page.waitForTimeout(600);
    await expect(page.locator(".fl-row").nth(2)).toHaveAttribute("aria-selected", "true");

    // THE INTERLEAVE (2026-07-29). The casefile's fold and the offer's
    // assembly deliberately OVERLAP — the departure runs 0.13 → 0.66 of the
    // RELEASE and the release ramp spans it, so the offer is already drawing
    // as the panels start to leave. Sampling inside that overlap is the only
    // assertion that fails if the windows are ever pulled back apart into a
    // fade-then-pop, which is the handoff the owner rejected. The crossing
    // was validated at releaseP 0.52 (caseOpacity ≈ 0.43 against content-in
    // ≈ 0.52); since U13 the release owns only the back 37.5 % of the
    // runway, so `releaseToTotal` remaps it — 0.82 today, and whatever the
    // browse band's own length makes it once `CASES` grows. Sample the
    // VALUES here, never the window edges — smootherstep is nearly flat
    // across its first third, so overlapping edges alone prove nothing.
    expect(await scrollCasefileDwell(page, DWELL_INTERLEAVE)).toBe(true);
    await page.waitForTimeout(1000);

    const interleave = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>(".services-stage");
      const casefile = document.querySelector<HTMLElement>(".fl-case");
      const cs = casefile ? getComputedStyle(casefile) : null;
      return {
        caseOpacity: cs ? Number(cs.opacity) : null,
        // The iris is the departure's other half; `none` here means the fold
        // silently regressed to a plain fade.
        clipPath: cs?.clipPath ?? null,
        contentIn: Number.parseFloat(stage?.style.getPropertyValue("--svc-content-in") ?? "0"),
      };
    });
    expect(interleave.caseOpacity).toBeGreaterThan(0.05);
    expect(interleave.caseOpacity).toBeLessThan(0.95);
    expect(interleave.contentIn).toBeGreaterThan(0.1);
    expect(interleave.contentIn).toBeLessThan(0.9);
    // A partly-closed aperture. `none` — or an inset still at rest — means
    // the fold silently regressed to a plain whole-plane fade. Since the
    // 2026-07-29 reticle fix the insets rest at −12px (the crosses overhang
    // the band by a half-arm) and serialize mid-iris as `calc(K% + Mpx)`,
    // where K is still iris × 50.5 — so the first-% parse below keeps
    // reading the iris fraction, with the px term invisible to it.
    expect(interleave.clipPath).toContain("inset");
    const irisPct = Number.parseFloat(/([\d.]+)%/.exec(interleave.clipPath ?? "")?.[1] ?? "0");
    expect(irisPct, `the iris should be mid-close, read "${interleave.clipPath}"`).toBeGreaterThan(
      5
    );
    expect(irisPct).toBeLessThan(50.5);

    // Past the dwell: the casefile is gone and the ring has taken over.
    expect(await scrollServicesRunway(page, 0.18)).toBe(true);
    await page.waitForTimeout(1400);

    const after = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>(".services-stage");
      const casefile = document.querySelector<HTMLElement>(".fl-case");
      return {
        caseOpacity: casefile ? Number(getComputedStyle(casefile).opacity) : null,
        contentIn: Number.parseFloat(stage?.style.getPropertyValue("--svc-content-in") ?? "0"),
        hits: document.querySelectorAll(".svc-ring-hits__hit").length,
      };
    });
    expect(after.caseOpacity).toBeLessThan(0.05);
    expect(after.contentIn).toBeGreaterThan(0.9);
    expect(after.hits).toBeGreaterThan(0);

    // …and it is OUT OF THE HIT TEST, not merely transparent. Opacity 0
    // leaves an element clickable, and the casefile's tabs and rows opt into
    // `pointer-events: auto`, so a departed casefile at z 6 goes on eating
    // clicks meant for `.svc-ring-hits__hit` at z 4 — the front card reads as
    // dead. Assert the real property (does a hit at the card's centre reach
    // the ring?) rather than the mechanism, so a different fix still passes.
    const cardHitReachable = await page.evaluate(() => {
      const hit = document.querySelector<HTMLElement>(".svc-ring-hits__hit");
      if (!hit) return null;
      const r = hit.getBoundingClientRect();
      const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return {
        reached: !!el && (el === hit || hit.contains(el)),
        blockedBy: el?.className ?? null,
      };
    });
    expect(cardHitReachable, "a ring hit area must exist after the handover").not.toBeNull();
    expect(
      cardHitReachable?.reached,
      `the departed casefile is still hit-testable — blocked by "${cardHitReachable?.blockedBy}"`
    ).toBe(true);

    // ── The REVERSE handoff (ADR-056 Update 3) ───────────────────────────
    // Backing out of the offer re-enters the dwell with the stage still
    // PINNED, so the masthead's unpark observer never fires and its
    // REARM_BELOW floor (derived: REVEAL_AT − hysteresis) is the only thing
    // that can blank the title. At releaseP 0.40 the clock reads ≈0.32 —
    // below the floor — so the title must already be re-armed (blanked, not
    // merely faded) while the casefile is repainting. Same U13 remap as the
    // interleave, through the same helper: releaseP 0.40 sits at total 0.775
    // today. The pre-fix absolute floor (0.05) held the resolved title over
    // the reassembled casefile for a third of the dwell, which is exactly
    // what this drive would catch.
    expect(await scrollCasefileDwell(page, DWELL_REARM)).toBe(true);
    await expect(page.locator(".services-masthead")).toHaveAttribute("data-reveal", "armed");
    await expect(
      page.locator(".services-masthead__title-line").first().locator("span").first()
    ).toHaveText("");
    // …and the casefile is back in the hit test (the same gate the forward
    // pass asserts from the other side).
    await expect(page.locator(".services-stage")).toHaveAttribute("data-proof-live", "1");
  });

  test("desktop: the harmonised casefile fits its reference viewports", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "the casefile layer is desktop-only (≥961px)");
    test.setTimeout(300_000);

    // ⚠ 1920×1080 EARNS ITS PLACE, and its absence was a real gap. The
    // `.fl-brief` box hangs off the `--fl-t6` tick seam, which is NOT
    // monotonic in viewport height — measured 199px at 1280×720, 221px at
    // 1440×800 and only 202px at 1920×1080, while `--band-copy` is at its
    // 18px ceiling there. So the commonest desktop size is the WORST case,
    // and it sat in the gap between 1440 and 2017: the Studio brief clipped
    // 19px there, in both themes, for as long as anyone had looked.
    //
    // ⚠ 2560×1330 EARNS ITS PLACE THE SAME WAY (2026-08-07, owner's own
    // window). It is where the tools plate's capture ran to 434px unbounded
    // — and, more importantly, it is the WIDE end of the axis that hid the
    // detail-grid crop: the route's rendered height rides the field's WIDTH
    // while the field rides viewport HEIGHT, so wide-and-short is the
    // binding shape and nothing in this file used to be wide at all.
    // 1920×800 is the short end of that same axis and is the worst case
    // measured (44px of overrun before the fix).
    const viewports = [
      { width: 1280, height: 720 },
      { width: 1440, height: 800 },
      { width: 1920, height: 800 },
      { width: 1920, height: 1080 },
      { width: 2017, height: 1269 },
      { width: 2560, height: 1330 },
    ] as const;

    for (const viewport of viewports) {
      const label = `${viewport.width}x${viewport.height}`;
      await page.setViewportSize(viewport);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".services-stage", { timeout: 15_000 });
      expect(
        await scrollCasefileDwell(page, DWELL_ROW_1),
        `${label}: casefile runway missing`
      ).toBe(true);
      await page.waitForTimeout(1200);
      await expect(page.locator(".fl-pda")).toBeVisible();

      const geometry = await page.evaluate(() => {
        const casefile = document.querySelector<HTMLElement>(".fl-case");
        const brief = document.querySelector<HTMLElement>(".fl-brief");
        const proof = document.querySelector<HTMLElement>(".fl-proof-register");
        const directory = document.querySelector<HTMLElement>(".fl-dir");
        const panel = document.querySelector<HTMLElement>(".fl-panel");
        const visual = document.querySelector<HTMLElement>(".fl-panel__viz");
        const map = document.querySelector<HTMLElement>(".fl-pda");
        if (!casefile || !brief || !proof || !directory || !panel || !visual || !map) return null;

        const c = casefile.getBoundingClientRect();
        const b = brief.getBoundingClientRect();
        const p = proof.getBoundingClientRect();
        const d = directory.getBoundingClientRect();
        const pn = panel.getBoundingClientRect();
        const v = visual.getBoundingClientRect();
        const m = map.getBoundingClientRect();
        const inside = (inner: DOMRect, outer: DOMRect) =>
          inner.left >= outer.left - 1 &&
          inner.right <= outer.right + 1 &&
          inner.top >= outer.top - 1 &&
          inner.bottom <= outer.bottom + 1;

        // ADR-088's rhythm law. `t11` comes off the LIVE `.hud__rail` box, the
        // same source the rail-seating test uses, so a drift between the rail
        // and this file's mirrored geometry fails here rather than reading.
        const rail = document.querySelector<HTMLElement>(".hud__rail");
        const rows = [...document.querySelectorAll<HTMLElement>(".fl-row")];
        const lastRow = rows[rows.length - 1]?.getBoundingClientRect();
        const railBox = rail?.getBoundingClientRect();
        const t11 = railBox ? railBox.top + railBox.height * (11 / 12) : null;

        return {
          // The two seams, measured BOX to BOX. The old `summaryGap` read from
          // the brief's PARAGRAPH, which moves with the selected row's copy —
          // this pair is row-independent and is what the split acts on.
          gapA: p.top - b.bottom,
          gapB: d.top - p.bottom,
          seatOnT11: t11 !== null && lastRow ? lastRow.bottom - t11 : null,
          proofItems: proof.querySelectorAll(".fl-proof-register__item").length,
          proofInside: inside(p, c),
          directoryInside: inside(d, c),
          panelInside: inside(pn, c),
          visualInside: inside(v, pn),
          mapInside: inside(m, v),
          briefBeforeProof: b.bottom <= p.top + 1,
          proofBeforeDirectory: p.bottom <= d.top + 1,
          leftAligned: Math.abs(p.left - d.left) <= 1 && Math.abs(p.width - d.width) <= 1,
          proofOverflow: proof.scrollHeight - proof.clientHeight,
          proofOverflowX: proof.scrollWidth - proof.clientWidth,
          directoryOverflow: directory.scrollHeight - directory.clientHeight,
          directoryOverflowX: directory.scrollWidth - directory.clientWidth,
          visualOverflowY: visual.scrollHeight - visual.clientHeight,
          visualOverflowX: visual.scrollWidth - visual.clientWidth,
          visualBottomDelta: Math.abs(v.bottom - pn.bottom),
          visualHeightRatio: v.height / Math.max(1, pn.height),
          mapHeightRatio: m.height / Math.max(1, v.height),
        };
      });

      expect(geometry, `${label}: harmonised casefile zones are missing`).not.toBeNull();
      expect(geometry?.proofItems, `${label}: proof register is not four-up`).toBe(4);
      expect(geometry?.proofInside, `${label}: proof register escaped the casefile`).toBe(true);
      expect(geometry?.directoryInside, `${label}: directory escaped the casefile`).toBe(true);
      expect(geometry?.panelInside, `${label}: right panel escaped the casefile`).toBe(true);
      expect(geometry?.visualInside, `${label}: visual escaped the right panel`).toBe(true);
      expect(geometry?.mapInside, `${label}: map escaped the visual frame`).toBe(true);
      expect(geometry?.briefBeforeProof, `${label}: brief overlaps the proof register`).toBe(true);
      expect(
        geometry?.proofBeforeDirectory,
        `${label}: proof register overlaps the directory`
      ).toBe(true);
      expect(geometry?.leftAligned, `${label}: proof register and directory rails drift`).toBe(
        true
      );

      // ── ADR-088: the column's slack is SPLIT, and the index sits on t11 ──
      // Before this, the three zones were three top-anchored absolutes, so
      // every viewport taller than the design's own put its whole surplus in
      // one place — the empty band under the last directory row, measured at
      // 137px on the owner's 1920x1247 and 199px at 2560x1330 — while the
      // seam above the directory stayed pinned at 18px. Nothing failed: each
      // box was inside the casefile and none of them clipped. These three
      // assertions are what make that state red.
      // ⚠ PINNED FROM BOTH SIDES. Over-running t11 is a clip; falling short of
      // it is the pooled hole this pass removed, and a one-sided bound would
      // only ever have caught the first.
      expect(
        Math.abs(geometry?.seatOnT11 ?? Number.POSITIVE_INFINITY),
        `${label}: the directory's last row sits ${geometry?.seatOnT11?.toFixed(1)}px off tick 11`
      ).toBeLessThanOrEqual(1.5);
      // The floors, which are what keep the binding viewports byte-near what
      // shipped: seam A is `--fl-brief-clear + --fl-proof-top-gap`, seam B is
      // `--fl-directory-gap`. Both are flat above 1070h (14+14 and 18) and on
      // their `svh` clamps below it.
      expect(
        geometry?.gapA ?? 0,
        `${label}: the brief/register seam collapsed to ${geometry?.gapA?.toFixed(1)}px`
      ).toBeGreaterThanOrEqual(viewport.height > 1069 ? 25 : 17.5);
      expect(
        geometry?.gapB ?? 0,
        `${label}: the register/directory seam collapsed to ${geometry?.gapB?.toFixed(1)}px`
      ).toBeGreaterThanOrEqual(viewport.height > 1069 ? 17.5 : 11.5);
      // ⚠ THE RATIO IS ASSERTED ONLY WHERE THERE IS SURPLUS TO SPLIT. Below
      // 1070h both tracks sit on their floors and seam A is legitimately the
      // LARGER of the two (18.1 against 13.5 at 1280x720) — asserting the
      // ordering there would fail the layout this pass deliberately preserves.
      // Above it the split is 1:2 in favour of the group break, bounded from
      // both sides so a future retune cannot quietly flatten it either way.
      if (viewport.height > 1069) {
        expect(
          geometry?.gapB ?? 0,
          `${label}: the index seam (${geometry?.gapB?.toFixed(1)}px) is not the wider of the two (${geometry?.gapA?.toFixed(1)}px)`
        ).toBeGreaterThanOrEqual((geometry?.gapA ?? 0) - 0.5);
        expect(
          geometry?.gapB ?? 0,
          `${label}: the index seam ran past its 1:2 share of the surplus`
        ).toBeLessThanOrEqual((geometry?.gapA ?? 0) * 2.1 + 2);
      }
      expect(geometry?.proofOverflow, `${label}: proof register clips`).toBeLessThanOrEqual(1);
      expect(
        geometry?.proofOverflowX,
        `${label}: proof register clips horizontally`
      ).toBeLessThanOrEqual(1);
      expect(geometry?.directoryOverflow, `${label}: directory clips`).toBeLessThanOrEqual(1);
      expect(
        geometry?.directoryOverflowX,
        `${label}: directory clips horizontally`
      ).toBeLessThanOrEqual(1);
      expect(geometry?.visualOverflowY, `${label}: visual clips vertically`).toBeLessThanOrEqual(1);
      expect(geometry?.visualOverflowX, `${label}: visual clips horizontally`).toBeLessThanOrEqual(
        1
      );
      expect(
        geometry?.visualBottomDelta,
        `${label}: visual does not fill the panel`
      ).toBeLessThanOrEqual(1.5);
      expect(
        geometry?.visualHeightRatio ?? 0,
        `${label}: visual retained a footer band`
      ).toBeGreaterThan(0.9);
      expect(
        geometry?.mapHeightRatio ?? 0,
        `${label}: map does not fill the visual`
      ).toBeGreaterThan(0.98);

      // -- THE MAP'S THREE SHEETS (ADR-062) ---------------------------
      // ── THE MAP (the PDA console) ─────────────────────────────────
      // A SVG technical drawing, and `<text>` neither wraps nor ellipsises
      // nor reports overflow — a label that runs past its crop simply
      // vanishes at the edge. So walk EVERY reading and measure every glyph
      // box against the drawing's own viewBox.
      for (const [index, view] of ["1", "2", "3"].entries()) {
        await page.locator(".fl-con__stn").nth(index).click();
        await page.waitForTimeout(360);
        await expect(page.locator(".fl-pda")).toHaveAttribute("data-view", view);

        const drawn = await page.evaluate(readPda);
        const where = `${label}/view-${view}`;
        expect(drawn, `${where}: the reading drew nothing`).not.toBeNull();
        expect(drawn!.texts, `${where}: the reading lost its labels`).toBeGreaterThan(10);
        expect(
          drawn!.clipped,
          `${where}: labels run outside the crop: ${drawn!.clipped.join(", ")}`
        ).toEqual([]);
        expect(drawn!.overflowX, `${where}: the map field scrolls`).toBeLessThanOrEqual(1);
        expect(drawn!.overflowY, `${where}: the map field scrolls`).toBeLessThanOrEqual(1);

        // ── LABEL ON LABEL (ADR-063 U1) ────────────────────────────
        // Containment is not legibility. Every guard on this surface
        // asked whether a label was inside the crop; none asked whether
        // two labels were inside EACH OTHER — and when the type grew,
        // two pairs collided (a wrapped cartridge title onto its own
        // second line and onto the lane rail, and 02's DECIDES ALONE
        // onto its value) while every existing assertion stayed green.
        expect(drawn!.overlaps, `${where}: labels overlap: ${drawn!.overlaps.join(" | ")}`).toEqual(
          []
        );

        // ── AND THE SAME QUESTION OF THE ARC-SET LABELS (ADR-070 U33) ──
        // Reading 03 sets 52 labels along arcs, where an axis-aligned box
        // is mostly empty space and the test above cannot be asked — it
        // reported 22 pairs on the carrier's first live capture with
        // nothing touching on screen. This walks per-glyph origins along
        // the path instead, which is the same question with an instrument
        // that suits curved type. ⚠ THE PAIR IS THE GUARD: the flat test
        // going quiet on a reading is only safe because this one speaks
        // there, so the count below is asserted too — a `textPath` that
        // stopped resolving would empty this list rather than fail it.
        expect(drawn!.arcs, `${where}: arc labels collide: ${drawn!.arcs.join(" | ")}`).toEqual([]);
        if (view === "3") {
          // ⚠ **CARRIER-SPECIFIC ASSERTIONS**. `MAP_BACKPLANE` was flipped
          // back OFF on 2026-08-28 U2 (owner: "restore the old pie chart");
          // reading 03 is the compound carrier again and these guards
          // return unconditional. If the flag is ever re-armed for a
          // comparison run, the Backplane's own arithmetic-side guards
          // take over — this suite pins the CARRIER path (arc labels,
          // cell fills, spill probe) that shipped and stays live.
          expect(
            drawn!.arcTexts,
            `${where}: the carrier's arc labels are not being measured`
          ).toBeGreaterThan(40);

          expect(
            drawn!.spillCells,
            `${where}: the carrier's cells are not being measured`
          ).toBeGreaterThan(40);
          expect(
            drawn!.spills,
            `${where}: labels print through their own cell edge: ${drawn!.spills.join(" | ")}`
          ).toEqual([]);

          // ── THE HUB SPEAKS, THE LABELS LABEL (ADR-085 U2) ───────────
          // The carrier's three centre readouts are the one sans-serif
          // instrument on this surface; everything around them is PT
          // Mono. Both halves, because a one-sided assertion here is
          // what let the last two font leaks ship.
          expect(
            drawn!.hubFonts.length,
            `${where}: the hub's readout is not being measured`
          ).toBeGreaterThan(0);
          for (const f of drawn!.hubFonts)
            expect(f, `${where}: the hub letters in ${f}, not IBM Plex Sans`).toMatch(
              /IBM Plex Sans/i
            );
          for (const f of drawn!.labelFonts)
            expect(f, `${where}: a map label letters in ${f}, not PT Mono`).toMatch(/PT Mono/i);
        }

        // ── AND THE TYPE IS ACTUALLY BIGGER ────────────────────────
        // A floor under what the reader sees, not under the authored
        // unit — `xMidYMid meet` scales by the MINIMUM of the two box
        // ratios, so an authored size says nothing about rendered size.
        // These are the measured values less a little headroom; the
        // drawing is height-bound, so a regression here means either a
        // crop grew or the console lost height to new chrome.
        expect(
          drawn!.minPx,
          `${where}: rendered type fell to ${drawn!.minPx}px`
        ).toBeGreaterThanOrEqual(4.3);
      }

      // The reading rail is the navigation and its stations are CONTROLS, so
      // they answer to the chrome floor. It runs HORIZONTALLY across the top
      // of the console (ADR-063) and its names must not ellipsise — a station
      // reading "CONFIGURATI…" is the rail outgrowing its box.
      const rail = await page.evaluate(() => {
        const el = document.querySelector<HTMLElement>(".fl-con__rail");
        const field = document.querySelector<HTMLElement>(".fl-con__field");
        const consoleEl = document.querySelector<HTMLElement>(".fl-con__console");
        if (!el || !field || !consoleEl) return null;
        const r = el.getBoundingClientRect();
        const stns = [...el.querySelectorAll<HTMLElement>(".fl-con__stn")];
        return {
          horizontal: r.width > r.height * 3,
          aboveField: r.bottom <= field.getBoundingClientRect().top + 1,
          spansConsole: r.width / consoleEl.getBoundingClientRect().width,
          truncated: stns
            .map((s) => s.querySelector("b"))
            .filter((b): b is HTMLElement => Boolean(b))
            .filter((b) => b.scrollWidth > b.clientWidth + 1)
            .map((b) => b.textContent ?? ""),
          minFont: Math.min(
            ...stns.flatMap((s) =>
              [...s.querySelectorAll<HTMLElement>("b")].map((e) =>
                Number.parseFloat(getComputedStyle(e).fontSize)
              )
            )
          ),
        };
      });
      expect(rail, `${label}: the reading rail is missing`).not.toBeNull();
      expect(rail!.horizontal, `${label}: the reading rail is not horizontal`).toBe(true);
      expect(rail!.aboveField, `${label}: the reading rail is not above the drawing`).toBe(true);
      expect(
        rail!.spansConsole,
        `${label}: the reading rail does not span the console`
      ).toBeGreaterThan(0.98);
      expect(
        rail!.truncated,
        `${label}: station names ellipsised: ${rail!.truncated.join(", ")}`
      ).toEqual([]);
      expect(
        rail!.minFont,
        `${label}: rail labels fell below the chrome floor`
      ).toBeGreaterThanOrEqual(7.9);

      // ── THE WHEEL, AND ITS RELEASE (ADR-063) ──────────────────────
      // Over the console, scroll changes the READING and the page holds.
      // At the last reading in the direction of travel the wheel goes back
      // to the page — this beat is scroll-pinned, so a console that kept it
      // would be a trap on the whole document. The unit test pins the
      // arithmetic (`tests/lib/pda-wheel.test.ts`); this pins that a real
      // wheel event over the real element behaves.
      await page.locator(".fl-con__stn").first().click();
      await page.waitForTimeout(400);
      const fieldBox = (await page.locator(".fl-con__field").boundingBox())!;
      await page.mouse.move(fieldBox.x + fieldBox.width / 2, fieldBox.y + fieldBox.height / 2);

      const heldY = await page.evaluate(() => window.scrollY);
      const heldRow = await page.evaluate(
        () => document.querySelector(".fl-row[aria-selected='true']")?.textContent ?? ""
      );
      await page.mouse.wheel(0, 140);
      await page.waitForTimeout(620);
      await expect(
        page.locator(".fl-pda"),
        `${label}: the wheel did not change the reading`
      ).toHaveAttribute("data-view", "2");
      await page.mouse.wheel(0, 140);
      await page.waitForTimeout(620);
      await expect(
        page.locator(".fl-pda"),
        `${label}: the wheel did not reach the last reading`
      ).toHaveAttribute("data-view", "3");
      expect(
        Math.abs((await page.evaluate(() => window.scrollY)) - heldY),
        `${label}: the page scrolled while the readings changed`
      ).toBeLessThanOrEqual(2);
      expect(
        await page.evaluate(
          () => document.querySelector(".fl-row[aria-selected='true']")?.textContent ?? ""
        ),
        `${label}: the directory row changed under the console`
      ).toBe(heldRow);

      // THE RELEASE. Past the last reading the page moves again.
      await page.mouse.wheel(0, 240);
      await page.waitForTimeout(600);
      expect(
        await page.evaluate(() => window.scrollY),
        `${label}: RELEASE FAILED — the console traps the page at its last reading`
      ).toBeGreaterThan(heldY + 2);

      // Back to the map's row and its first reading for the checks below.
      expect(
        await scrollCasefileDwell(page, DWELL_ROW_1),
        `${label}: casefile runway missing`
      ).toBe(true);
      await page.waitForTimeout(600);

      // The console carries NO TITLE BAR, NO REPEATED HEADING (ADR-063 U1)
      // and — since the owner's 2026-08-08 declutter — NO FOOT either. The
      // reading's sentence survives only on the small-screen fallback list;
      // on the console the drawing takes the height.
      expect(
        await page.locator(".fl-con__console > .fl-pda__head, .fl-con__head").count(),
        `${label}: the console grew a title bar back`
      ).toBe(0);
      expect(
        await page.locator(".fl-con__foot").count(),
        `${label}: the map console printed a foot again`
      ).toBe(0);

      // A cartridge is the panel's control: clicking one opens reading 02 on
      // that stream (the plate's own `data-view` is the state signal).
      await page.locator(".fl-con__stn").first().click();
      await page.waitForTimeout(300);

      /* ⚠ EVERY CARTRIDGE TAKES A CLICK WHERE A READER CLICKS — the middle of
         the card. A person-led body is `fill: none`, and an unfilled SVG path
         hit-tests on its STROKE alone, so all three person-led streams reached
         the bare `<svg>` and did nothing while the keyboard path worked. No
         assertion here could see it: `data-view` was checked on the first
         cartridge, which is configured. Hit-test every one. */
      const unreachable = await page.evaluate(() =>
        [...document.querySelectorAll(".fl-pda-hit")]
          .map((h, i) => {
            const b = h.getBoundingClientRect();
            const el = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
            return el && (el === h || h.contains(el))
              ? null
              : (h.getAttribute("aria-label") ?? `#${i}`);
          })
          .filter(Boolean)
      );
      expect(
        unreachable,
        `${label}: these cartridges cannot be opened by clicking their centre`
      ).toEqual([]);
      /* The cartridge names its own stream and its own lane in its accessible
         name — read them from the record rather than pinning a title, so a
         reorder of the directory moves this assertion with it. */
      const opened = (await page.locator(".fl-pda-hit").first().getAttribute("aria-label")) ?? "";
      /* ⚠ Only the TITLE is read now. The lane came off the drawing in
         ADR-070 U10, so pulling it out of the label here would be a value
         nothing downstream could check. */
      const openedTitle = opened.split(",")[0]?.trim() ?? "";
      await page.locator(".fl-pda-hit").first().click({ force: true });
      // The flight is 420ms and the foot caption arrives at 760.
      await page.waitForTimeout(800);
      await expect(page.locator(".fl-pda")).toHaveAttribute("data-view", "2");

      // ⚠ IT OPENS ON THE STREAM THAT WAS CLICKED, and the core is that same
      // cartridge grown — which is the object the flight carries across. A
      // configuration showing some other record would still satisfy
      // `data-view`, so the title is the check that means anything.
      expect(openedTitle, `${label}: the grid's first cartridge has no name`).toBeTruthy();
      expect(
        await page.locator(".fl-pda__svg").getByText(openedTitle, { exact: true }).count(),
        `${label}: the configuration opened on a different stream`
      ).toBeGreaterThan(0);

      // ...and it ANSWERS (ADR-069). The modules printed the same questions
      // for all twenty-seven streams until the record's own values reached
      // the drawing.
      //
      // ⚠ THE PROBE USED TO BE THE LANE, AND ADR-070 U10 TOOK THE LANE OFF
      // THE DRAWING — `MODEL` letters the VERBS now, because "everyday lane"
      // is a generic tier no reader can resolve and the envelope forbids
      // naming the model that would make it concrete. So the check moves from
      // "does this one string appear" to the thing it was standing in for:
      // OPEN A SECOND STREAM AND THE ANSWERS MUST CHANGE. That is stronger —
      // a template would satisfy any single-string probe for every record.
      const answers = () =>
        page.evaluate(() =>
          [...document.querySelectorAll(".fl-pda__svg text")]
            .map((t) => (t.textContent ?? "").trim())
            .join("|")
        );
      const firstAnswers = await answers();
      await page.locator(".fl-con__stn").first().click();
      await page.waitForTimeout(300);
      await page.locator(".fl-pda-hit").nth(1).click({ force: true });
      await page.waitForTimeout(800);
      const secondAnswers = await answers();
      expect(
        firstAnswers === secondAnswers,
        `${label}: two different streams drew the identical configuration`
      ).toBe(false);
      expect(firstAnswers.length, `${label}: the configuration letters nothing`).toBeGreaterThan(
        60
      );
      // Back to the stream this case has been reasoning about.
      await page.locator(".fl-con__stn").first().click();
      await page.waitForTimeout(300);
      await page.locator(".fl-pda-hit").first().click({ force: true });
      await page.waitForTimeout(800);

      // ⚠ THE READOUT IS DELETED (ADR-070 U3, owner: "its eating up real
      // estate") — this assertion is the old one INVERTED. No prose letters
      // on the drawing any more: the longest string is a wrapped bar line or
      // a one-line node value (≤ ~36 chars), and a sentence reappearing here
      // is the readout drifting back.
      const longestLine = await page.evaluate(() =>
        Math.max(
          ...[...document.querySelectorAll(".fl-pda__svg text")].map(
            (t) => (t.textContent ?? "").length
          )
        )
      );
      expect(longestLine, `${label}: prose crept back onto the configuration`).toBeLessThan(40);
      // ...and the rest of the chrome the owner named on the live page stays
      // deleted too (U4): the DRAW PER RUN meter with NEVER A PRICE, and the
      // DRAWS ON n OF m caption. Each returning is a decision, not a drift.
      expect(
        await page
          .locator(".fl-pda__svg")
          .getByText(/DRAWS ON|NEVER A PRICE|DRAW PER RUN/)
          .count(),
        `${label}: deleted configuration chrome came back`
      ).toBe(0);

      // Escape returns to the work. Keys are bound on the PLATE, never
      // `document` — the corridor has its own key handling.
      await page.locator(".fl-con__stn").first().focus();
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
      await expect(page.locator(".fl-pda")).toHaveAttribute("data-view", "1");

      // The record the reader opened stays marked on the grid, so the flight
      // has somewhere legible to land and to leave from.
      expect(
        await page.locator(".fl-pda-hit").first().locator("line[stroke*='pda-hot']").count(),
        `${label}: the open record is not marked on the grid`
      ).toBeGreaterThan(0);

      // NOTHING THE MAP DOES MAY PUBLISH A RING ANCHOR. The casefile host is
      // `pointer-events: none` with scoped opt-ins, and the map plate is one
      // of them; it sits at z 6 over `.svc-ring-hits__hit` at z 4, so an
      // anchor published during the dwell is an invisible click-eater.
      expect(
        await page.locator(".svc-ring-hits__hit").count(),
        `${label}: a ring anchor published during the casefile dwell`
      ).toBe(0);

      // ⚠ THE CLAIM READS AT EVERY VIEWPORT, unlike its sentence. The register
      // is a GLYPHED INDEX now (ADR-068) — mark, claim, sentence, one row each
      // — and below 1070h the sentence is sr-only because the register box is
      // 86px at 720p against the 211px four two-line rows need. What must
      // NEVER be reduced is the claim itself: it carries the row's whole
      // meaning, including the figure that used to sit above it. Its
      // predecessor was a 9.5px gold label that clipped 5-9px on every row at
      // these heights, silently.
      const claims = await page.evaluate(() => {
        const list = [...document.querySelectorAll<HTMLElement>(".fl-proof-register__claim")];
        return {
          count: list.length,
          minFont: list.length
            ? Math.min(...list.map((c) => Number.parseFloat(getComputedStyle(c).fontSize)))
            : 0,
          clipped: list.flatMap((c, i) =>
            c.scrollHeight - c.clientHeight > 1 || c.scrollWidth - c.clientWidth > 1
              ? [`claim-${i + 1}`]
              : []
          ),
        };
      });
      expect(claims.count, `${label}: the proof register is not four claims`).toBe(4);
      expect(
        claims.minFont,
        `${label}: a proof claim fell below the 10px control floor`
      ).toBeGreaterThanOrEqual(10);
      expect(claims.clipped, `${label}: proof claims clip: ${claims.clipped.join(", ")}`).toEqual(
        []
      );

      // ── EVERY ROW CARRIES ITS MARK (ADR-068) ──────────────────────
      // The mark is what makes this an INDEX rather than a list, and it is
      // the one part with no text to fall back on: a missing `glyph` key,
      // a renamed drawing or a `PROOF_GLYPHS` entry that stopped resolving
      // all render as an empty gutter that reviews as "a bit plain". The
      // box is measured because size comes from CSS, not attributes — 14px
      // (2px cells) on the compact rung, 21px (3px cells) on the tall one,
      // and never a fractional cell in between.
      const marks = await page.evaluate(() => {
        const spans = [...document.querySelectorAll<HTMLElement>(".fl-proof-register__glyph")];
        return {
          count: spans.length,
          svgs: spans.filter((s) => s.querySelectorAll("svg.fl-proof-glyph").length === 1).length,
          hidden: spans.filter(
            (s) =>
              s.getAttribute("aria-hidden") === "true" &&
              s.querySelector("svg")?.getAttribute("aria-hidden") === "true"
          ).length,
          boxes: spans.map((s) => {
            const r = s.querySelector("svg")?.getBoundingClientRect();
            return r ? `${Math.round(r.width)}x${Math.round(r.height)}` : "none";
          }),
          offGrid: spans.flatMap((s, i) => {
            const r = s.querySelector("svg")?.getBoundingClientRect();
            if (!r) return [`mark-${i + 1}:missing`];
            // ⚠ THE BOUNDS CARRY AN EPSILON, AND IT IS NOT SLOPPINESS. The
            // register is a `[data-fl-panel]` riding `translate3d(...)` on the
            // arrival ladder, so a descendant's rect comes back through a
            // float matrix: a mark declared at exactly 21px measured
            // 21.000015258789062 (21 + 2^-16) on a run sampled mid-strike,
            // failed an exact `> 21`, and passed on the next two runs at the
            // same nominal progress. An exact bound against a transformed rect
            // is a flake generator; half a pixel is far below the 7-unit
            // lattice step this is actually policing (14 vs 21).
            const EPS = 0.5;
            const bad =
              r.width < 14 - EPS ||
              r.width > 21 + EPS ||
              r.height < 14 - EPS ||
              r.height > 21 + EPS;
            return bad ? [`mark-${i + 1}:${r.width}x${r.height}`] : [];
          }),
          // The drawing itself: pixels, never type. A `<text>` node here
          // would also walk into the font guard below with an SVG family.
          rects: spans.map((s) => s.querySelectorAll("rect").length),
          texts: spans.reduce((n, s) => n + s.querySelectorAll("text").length, 0),
        };
      });
      expect(marks.count, `${label}: the index is not four marks`).toBe(4);
      expect(marks.svgs, `${label}: a register row rendered no glyph drawing`).toBe(4);
      expect(marks.hidden, `${label}: a register mark is exposed to the a11y tree`).toBe(4);
      expect(
        marks.offGrid,
        `${label}: marks off the 14-21px ladder: ${marks.offGrid.join(", ")} (all: ${marks.boxes.join(" ")})`
      ).toEqual([]);
      expect(
        Math.min(...marks.rects),
        `${label}: a mark drew fewer than 9 pixels`
      ).toBeGreaterThanOrEqual(9);
      expect(marks.texts, `${label}: a mark printed type instead of pixels`).toBe(0);

      // ⚠ THE COMPACT RUNG IS ASSERTED, NOT ASSUMED. Below 1070h the
      // sentence is present for a reader and absent for the eye — and the
      // failure mode is silent in both directions. A rung that stops
      // applying prints four full sentences into an 86px box (measured
      // during the ADR-068 build: 116px of clip at 1069h, from a media pair
      // that left a gap between `max-height` and `min-height`); a rung that
      // over-applies takes the evidence away from a viewport with room for
      // it. Only the CLIP is checked, never `display: none` — the sentence
      // has to stay in the accessibility tree.
      if (viewport.height <= 1069) {
        const srOnly = await page.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>(".fl-proof-register__description")].map(
            (d) => {
              const cs = getComputedStyle(d);
              const r = d.getBoundingClientRect();
              return {
                position: cs.position,
                clip: cs.clip,
                display: cs.display,
                w: Math.round(r.width),
                h: Math.round(r.height),
                text: (d.textContent ?? "").trim().length,
              };
            }
          )
        );
        expect(srOnly.length, `${label}: the compact rung lost its sentences`).toBe(4);
        const notClipped = srOnly.flatMap((d, i) =>
          d.position !== "absolute" ||
          !d.clip.startsWith("rect(") ||
          d.w > 1 ||
          d.h > 1 ||
          d.display === "none" ||
          d.text === 0
            ? [`description-${i + 1}: ${d.position}/${d.clip}/${d.w}x${d.h}/${d.display}`]
            : []
        );
        expect(
          notClipped,
          `${label}: the compact rung is not the sr-only clip: ${notClipped.join(" | ")}`
        ).toEqual([]);
      }

      if (viewport.height > 1069) {
        const tallProof = await page.evaluate(() => {
          // The brief's paragraph left this read with `summaryGap` (see below):
          // the seam it used to measure is now taken box-to-box in the geometry
          // block, at every viewport rather than only the tall ones.
          const proof = document.querySelector<HTMLElement>(".fl-proof-register");
          if (!proof) return null;
          const descriptions = [
            ...proof.querySelectorAll<HTMLElement>(".fl-proof-register__description"),
          ];
          return {
            count: descriptions.length,
            clipped: descriptions.flatMap((description, index) => {
              const rect = description.getBoundingClientRect();
              const item = description.closest<HTMLElement>(".fl-proof-register__item");
              const itemRect = item?.getBoundingClientRect();
              const issues: string[] = [];
              if (description.scrollHeight - description.clientHeight > 1) {
                issues.push(`description-${index + 1}:clips-y`);
              }
              if (description.scrollWidth - description.clientWidth > 1) {
                issues.push(`description-${index + 1}:clips-x`);
              }
              if (itemRect && (rect.top < itemRect.top - 1 || rect.bottom > itemRect.bottom + 1)) {
                issues.push(`description-${index + 1}:outside-item`);
              }
              return issues;
            }),
          };
        });
        expect(tallProof, `${label}: tall proof register is missing`).not.toBeNull();
        expect(tallProof?.count).toBe(4);
        // ⚠ `summaryGap < 80` IS DELETED (ADR-088), NOT MOVED. It measured
        // from the brief's PARAGRAPH to the register, so it read a different
        // number on every directory row, and its 80px literal was written for
        // a column whose surplus pooled at the bottom. Under the 1:2 split the
        // brief/register seam legitimately reaches 81.8px at 2560x1330 — the
        // bound would have failed a layout that is doing what it was asked to.
        // What it defended (dead space must not reopen above the register) is
        // now the `gapA <= gapB` ordering plus the t11 seating law above, both
        // asserted at every viewport rather than only the tall ones.
        expect(
          tallProof?.clipped,
          `${label}: tall proof descriptions clip: ${tallProof?.clipped.join(", ")}`
        ).toEqual([]);
      }

      // ⚠ ROW 3 IS THE STUDIO SINCE 2026-08-07 (owner reordered the
      // directory: map · tools · studio · films). Row indices in this file
      // are the DIRECTORY's order, so they all moved with it.
      if (viewport.width === 1280) {
        await page.locator(".fl-row").nth(2).click();
        await page.waitForTimeout(220);
        const studioBrief = await page.evaluate(() => {
          const brief = document.querySelector<HTMLElement>(".fl-brief");
          const body = document.querySelector<HTMLElement>(".fl-brief__body");
          if (!brief || !body) return null;
          const briefRect = brief.getBoundingClientRect();
          const bodyRect = body.getBoundingClientRect();
          return {
            briefOverflow: brief.scrollHeight - brief.clientHeight,
            bodyOverflow: body.scrollHeight - body.clientHeight,
            bodyInside:
              bodyRect.top >= briefRect.top - 1 && bodyRect.bottom <= briefRect.bottom + 1,
          };
        });
        expect(studioBrief, `${label}: Studio brief is missing`).not.toBeNull();
        expect(studioBrief?.briefOverflow, `${label}: Studio brief clips`).toBeLessThanOrEqual(1);
        expect(studioBrief?.bodyOverflow, `${label}: Studio summary clips`).toBeLessThanOrEqual(1);
        expect(studioBrief?.bodyInside, `${label}: Studio summary escaped its brief`).toBe(true);
      }

      // ══ THE TOOLS ROW, AT EVERY VIEWPORT ══════════════════════════════
      // ⚠ THIS BLOCK USED TO RUN AT 1280 ALONE, AND THAT WAS THE WHOLE HOLE
      // (2026-08-07). The tools field overran its console by 35.7px at
      // 1800–2560 × 800 with `.fl-detail` pushed clean out of an
      // `overflow: hidden` box — 1.8 % of the first plate still visible at
      // 1920×720 — while every assertion in the file stayed green, because
      // the only two places the tools row was ever measured were 1280 wide
      // (narrow ⇒ short route) and 1440×800 (the LAST width that fits:
      // 1500×800 clears, 1600×800 overruns by 12.7). Nothing here was ever
      // both wide and short. It runs at all six viewports now.
      {
        // Row 2 is Software for Few since 2026-08-07 (owner).
        const toolsRow = page.locator(".fl-row").nth(1);
        await toolsRow.click();
        await expect(toolsRow).toHaveAttribute("aria-selected", "true");
        // The arrival seat is the only entrance left (~0.7s: the blocks'
        // 120+55i ladder — the route entrance died with e3b3386 and station
        // switches are motionless since ADR-068 U3), 0-at-rest by contract —
        // so everything below is measured AFTER it, never during.
        await page.waitForTimeout(1100);
        const toolNames = page.locator(".fl-con__stn > b");
        await expect(toolNames).toHaveCount(4);
        const toolTabs = await toolNames.evaluateAll((names) => {
          return {
            count: names.length,
            text: names.map((n) => (n.textContent ?? "").trim()),
            clipped: names.flatMap((name, index) => {
              const issues: string[] = [];
              const element = name as HTMLElement;
              if (element.scrollWidth - element.clientWidth > 1)
                issues.push(`tool-${index + 1}:clips-x`);
              if (element.scrollHeight - element.clientHeight > 1)
                issues.push(`tool-${index + 1}:clips-y`);
              return issues;
            }),
            minFont: names.length
              ? Math.min(...names.map((name) => Number.parseFloat(getComputedStyle(name).fontSize)))
              : 0,
          };
        });
        expect(toolTabs.count, `${label}: tool switcher is incomplete`).toBe(4);
        expect(toolTabs.minFont, `${label}: tool labels fell below 10px`).toBeGreaterThanOrEqual(
          10
        );
        expect(
          toolTabs.clipped,
          `${label}: tool labels clip: ${toolTabs.clipped.join(", ")}`
        ).toEqual([]);
        // ⚠ THE STATIONS CARRY THE SHORT HANDLES (ADR-068). The full
        // functional name moved to the plate header, and that rename is what
        // paid for the diamond below — so if these drift back to
        // `AI IMAGE & VIDEO SUITE` the rail is 14px short again.
        expect(toolTabs.text, `${label}: the rail is not printing the handles`).toEqual([
          "BRIEFING AGENT",
          "IMAGE & VIDEO",
          "UGC DUBBER",
          "STUDIO PM",
        ]);

        // ⚠ AND THE DIAMOND IS BACK AT FOUR STATIONS. ADR-066 hid it because
        // 22-character labels needed 136px against 122.9 available; ADR-068
        // renamed the labels instead, so the mark returns and the rail is one
        // grammar at two, three and four stations. This assertion is the
        // inverse of the one it replaces — do not "fix" it back.
        const diamonds = await page.evaluate(() => {
          const rail = document.querySelector<HTMLElement>(".fl-con__rail");
          const stns = [...document.querySelectorAll<HTMLElement>(".fl-con__stn")];
          return {
            n: rail?.dataset.n ?? "?",
            shown: stns.filter((s) => {
              const i = s.querySelector("i");
              if (!i) return false;
              return getComputedStyle(i).display !== "none" && i.getBoundingClientRect().width > 2;
            }).length,
          };
        });
        expect(diamonds.n, `${label}: the tools rail is not at four stations`).toBe("4");
        expect(diamonds.shown, `${label}: station diamonds are hidden at data-n="4"`).toBe(4);

        // ── NO DESIGNATION STUTTER, AND THE DATE SURVIVES ──────────────
        // ⚠ THE PLATE HEADER IS DELETED (owner, 2026-08-07). It printed the
        // full functional name one row under a rail station carrying the
        // same string verbatim on two of the four tools — the owner's "we
        // have the briefing agent title underneath the briefing agent tab".
        // The rail is the designation; the full name survives in the
        // walkthrough button's accessible name, which is asserted here so
        // deleting the header cannot quietly cost the plate its only
        // machine-readable identity. `IN SERVICE {year} —` moved to the
        // bay's FEED line, the one band that survives every short-viewport
        // rung (the route's caption row is CROPPED at ≤760h).
        const desig = await page.evaluate(() => {
          const bay = document.querySelector<HTMLElement>(".fl-bay__top");
          const shot = document.querySelector<HTMLElement>(".fl-shot");
          return {
            header: Boolean(document.querySelector(".fl-tool__hd")),
            bayText: (bay?.textContent ?? "").replace(/\s+/g, " ").trim(),
            bayClipsX: bay ? bay.scrollWidth - bay.clientWidth : 99,
            aria: shot?.getAttribute("aria-label") ?? "",
          };
        });
        expect(desig.header, `${label}: the designation stutter came back`).toBe(false);
        expect(desig.bayText, `${label}: the bay lost IN SERVICE`).toContain("IN SERVICE");
        expect(desig.bayText, `${label}: the bay lost the year`).toMatch(/IN SERVICE\s+20\d{2}/);
        expect(desig.bayText, `${label}: the FEED line clips`).toContain("WALKTHROUGH");
        expect(desig.bayClipsX, `${label}: the FEED line clips horizontally`).toBeLessThanOrEqual(
          1
        );
        expect(desig.aria, `${label}: the tool's full name left the a11y tree`).toContain(
          "Briefing Agent"
        );

        // ── AND NO FOOT ON THIS PLATE (owner, 2026-08-07) ──────────────
        // ADR-066's law is unchanged — "a plate with nothing to say still
        // omits it" — and since the owner's 2026-08-08 declutter EVERY
        // plate says nothing there (the box-clipping sweep asserts the
        // absence row by row).
        expect(
          await page.locator(".fl-con__foot").count(),
          `${label}: the tools plate printed a foot`
        ).toBe(0);

        // ── FOUR NOTCHED CAPABILITY BLOCKS (ADR-068 U2) ─────────────────
        // Title + one-sentence claim per plate, read from the tool's own
        // canonical `capabilities`. One notch says ORIENTED / CONNECTED
        // (ADR-065), and since Update 5 it is the BOTTOM-RIGHT — the lower
        // end of THIS HOUSING's diagonal, the console being the law's one
        // enumerated TL+BR object (U2). ⚠ The corner is asserted from BOTH
        // ENDS: the notched corner missing is the defect this pins, but a
        // polygon that notched two corners, or drifted back to BL, would
        // satisfy a one-sided check. The TITLE is the one nowrap line, so
        // it carries the horizontal-clip check; the SENTENCE wraps by
        // design and answers to the prose floor and the painted-plate
        // geometry below instead.
        const detail = await page.evaluate(() => {
          const plates = [...document.querySelectorAll<HTMLElement>(".fl-detail__plate")];
          return plates.map((p) => {
            const clip = getComputedStyle(p).clipPath;
            const pts =
              clip.startsWith("polygon(") && clip.endsWith(")")
                ? clip
                    .slice(8, -1)
                    .split(",")
                    .map((s) => s.trim())
                : [];
            const t = p.querySelector<HTMLElement>(".fl-detail__t");
            const d = p.querySelector<HTMLElement>(".fl-detail__d");
            return {
              title: (t?.textContent ?? "").trim(),
              desc: (d?.textContent ?? "").trim(),
              clip,
              squareTR: pts.some((s) => /^100%\s+0(px|%)$/.test(s)),
              squareBL: pts.some((s) => /^0(px|%)\s+100%$/.test(s)),
              squareBR: pts.some((s) => /^100%\s+100%$/.test(s)),
              clipsT: t ? t.scrollWidth - t.clientWidth : 99,
              descPx: d ? Number.parseFloat(getComputedStyle(d).fontSize) : 0,
            };
          });
        });
        expect(detail.length, `${label}: the detail grid is not four plates`).toBe(4);
        expect(
          new Set(detail.map((d) => d.title)).size,
          `${label}: the capability titles collide`
        ).toBe(4);
        for (const d of detail) {
          expect(d.title, `${label}: a block lost its title`).not.toBe("");
          expect(d.desc, `${label}: "${d.title}" lost its sentence`).not.toBe("");
          expect(d.clip, `${label}: "${d.title}" is not clipped at all`).not.toBe("none");
          expect(d.squareTR, `${label}: "${d.title}" lost its square top-right corner`).toBe(true);
          expect(d.squareBR, `${label}: "${d.title}" lost its bottom-right notch — ${d.clip}`).toBe(
            false
          );
          expect(
            d.squareBL,
            `${label}: "${d.title}" is notched on a second corner — ${d.clip}`
          ).toBe(true);
          expect(d.clipsT, `${label}: "${d.title}" clips its title`).toBeLessThanOrEqual(1);
          expect(
            d.descPx,
            `${label}: "${d.title}" sentence fell below the readable floor`
          ).toBeGreaterThanOrEqual(11.9);
        }

        // ══ THE DETAIL GRID IS INSIDE THE FIELD, AND IT IS SEEN ═════════
        // ⚠ THE ASSERTION THAT CANNOT MISS THIS AGAIN, and it is deliberately
        // NOT another overflow read. `scrollHeight − clientHeight` is a real
        // measure but it is a PROXY: it says the box has more content than
        // room, not that a particular thing is on screen. Two ways it lies,
        // both hit while fixing this pass:
        //   · a `justify-content: center` column with negative free space
        //     overflows SYMMETRICALLY, so half the overrun goes off the TOP
        //     under the rail — measured 30.6px of that at 2560×900 with the
        //     field reporting 0 and `.fl-detail` still ending inside it;
        //   · an intermediate `overflow: hidden` ancestor swallows the
        //     evidence and reports 0 on the box actually being measured.
        // So this measures GEOMETRY instead: the grid's bottom against the
        // field's VISIBLE bottom, and the visible AREA of every plate after
        // intersecting it with each clipping ancestor. A plate cropped to a
        // sliver — 258px² of 13,985 at 1920×720 before the fix — fails here
        // whatever any scroll metric says.
        const fit = await page.evaluate(() => {
          const field = document.querySelector<HTMLElement>(".fl-con__field");
          const grid = document.querySelector<HTMLElement>(".fl-detail");
          const plates = [...document.querySelectorAll<HTMLElement>(".fl-detail__plate")];
          if (!field || !grid || plates.length !== 4) return null;
          const f = field.getBoundingClientRect();
          const g = grid.getBoundingClientRect();
          /* The box actually painted: the element's rect intersected with
             every ancestor that clips (`overflow` or a `clip-path`). */
          const visible = (el: HTMLElement) => {
            const b = el.getBoundingClientRect();
            let [t, l, r, bo] = [b.top, b.left, b.right, b.bottom];
            for (let p = el.parentElement; p; p = p.parentElement) {
              const cs = getComputedStyle(p);
              if (cs.overflow === "visible" && cs.clipPath === "none") continue;
              const pb = p.getBoundingClientRect();
              t = Math.max(t, pb.top);
              l = Math.max(l, pb.left);
              r = Math.min(r, pb.right);
              bo = Math.min(bo, pb.bottom);
            }
            return Math.max(0, r - l) * Math.max(0, bo - t);
          };
          return {
            below: Number((g.bottom - f.bottom).toFixed(1)),
            above: Number((f.top - g.top).toFixed(1)),
            ratios: plates.map((p) => {
              const b = p.getBoundingClientRect();
              const full = Math.max(1, b.width * b.height);
              return Number((visible(p) / full).toFixed(3));
            }),
          };
        });
        expect(fit, `${label}: the detail grid is missing`).not.toBeNull();
        expect(
          fit!.below,
          `${label}: the detail grid runs ${fit!.below}px past the field's bottom`
        ).toBeLessThanOrEqual(1);
        expect(
          fit!.above,
          `${label}: the detail grid runs ${fit!.above}px above the field's top`
        ).toBeLessThanOrEqual(1);
        for (const [i, ratio] of fit!.ratios.entries()) {
          expect(
            ratio,
            `${label}: detail plate ${i + 1} paints ${(ratio * 100).toFixed(1)}% of its own box`
          ).toBeGreaterThanOrEqual(0.99);
        }

        // ── NO ORDINALS IN COSTUME, ANYWHERE IN THE FIELD ──────────────
        // ADR-066 retired every ordinal on this surface and the mockup put
        // one back as a tool id (`T-01`) on the bay's FEED line. The DURATION
        // readouts are excluded on purpose — `1:20` is a length, not a
        // position — so the scan reads LABEL text only, plus a blanket
        // `T-\d` over the whole bay.
        const ordinals = await page.evaluate(() => {
          const ownText = (el: Element) =>
            [...el.childNodes]
              .filter((n) => n.nodeType === 3)
              .map((n) => n.textContent ?? "")
              .join("")
              .trim();
          const labels: string[] = [];
          document
            .querySelectorAll(".fl-con__stn")
            .forEach((s) => labels.push((s.textContent ?? "").trim()));
          document
            .querySelectorAll(".fl-bay__top span, .fl-shot__bar")
            .forEach((s) => labels.push(ownText(s)));
          const bay = document.querySelector(".fl-bay");
          return {
            offenders: labels.filter((t) => t && (/^\s*\d{1,2}\b/.test(t) || /\bT-\d/.test(t))),
            bayId: /\bT-\d/.test(bay?.textContent ?? ""),
          };
        });
        expect(
          ordinals.offenders,
          `${label}: an ordinal came back: ${ordinals.offenders.join(" | ")}`
        ).toEqual([]);
        expect(ordinals.bayId, `${label}: the bay printed a tool id`).toBe(false);

        // ⚠ THE `.fl-caps` TILE FORM STAYS BANNED ON THIS PLATE (ADR-068).
        // The capability COPY is back — the detail blocks above print it —
        // but what must not come back is the FORM: the sixteen-tile foot
        // band behind a four-station rail.
        expect(
          await page.locator(".fl-plate--tools .fl-caps").count(),
          `${label}: the capability tiles came back to the tools plate`
        ).toBe(0);

        // ── THE FILTER LAW IS PER TOOL (ADR-068 D5, all four drawn in U3) ─
        // ADR-064 U2 drew the line at AUTHORED vs CAPTURED. Every station is
        // a wireframe now — no img, no filter, its own exact label set — and
        // the capture half of the law stays EXECUTABLE behind `kind`, for
        // the fifth tool that ships before its drawing. The walk ends back
        // at station 0: drawing↔drawing branch swaps are still keyed
        // conditional renders, and swapping clean is still the risk.
        for (const stn of WIREFRAME_STATIONS) {
          if (stn.idx > 0) {
            await page.locator(".fl-con__stn").nth(stn.idx).click();
            await page.waitForTimeout(700);
          }
          const bay = await page.evaluate(readToolBay);
          if (stn.kind === "wire") {
            expectWireframeBay(bay, `${label} ${stn.id}`, stn.labels);
          } else {
            expect(bay, `${label} ${stn.id}: no tool bay`).not.toBeNull();
            expect(bay!.imgs, `${label} ${stn.id}: the capture branch mounted no image`).toBe(1);
            expect(bay!.hasWire, `${label} ${stn.id}: a capture tool drew a wireframe`).toBe(false);
            expect(bay!.imgFilter, `${label} ${stn.id}: the capture lost its duotone`).not.toBe(
              "none"
            );
            expect(
              bay!.otherFiltered,
              `${label} ${stn.id}: another plate image is filtered: ${bay!.otherFiltered.join(", ")}`
            ).toEqual([]);
          }
          // The bar is the one affordance on every branch; no station's
          // evidence may squeeze it (the failure `.fl-shot` has had before).
          expect(
            bay!.barCut ?? 99,
            `${label} ${stn.id}: the walkthrough bar clipped`
          ).toBeLessThanOrEqual(1);
        }

        await page.locator(".fl-con__stn").nth(0).click();
        await page.waitForTimeout(700);
        expectWireframeBay(
          await page.evaluate(readToolBay),
          `${label} ${WIREFRAME_STATIONS[0].id} (walked back)`,
          WIREFRAME_STATIONS[0].labels
        );
      }
    }
  });

  test("desktop: no casefile box clips its content, on any row (ADR-056 U11)", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "the casefile layer is desktop-only (≥961px)");

    // 1440x800 — a MacBook Air, where the owner reads this, and the viewport
    // that exposed both pre-existing bugs. The project's 1440x900 default
    // hides them: at 900 the foot has room to spare and everything looks
    // authored-at-1920 correct. Set BEFORE the goto so the corridor lays out
    // once, at the height being asserted.
    await page.setViewportSize({ width: 1440, height: 800 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });

    // The settle at the front of the dwell — panels assembled, stage pinned,
    // nothing travelling. Same sample point as the hold assertion above.
    expect(await scrollCasefileDwell(page, DWELL_ROW_1)).toBe(true);
    await page.waitForTimeout(1400);

    // THE ALIGNMENT LAW — the instrument spans the HUD rail's own box
    // (owner, 2026-08-07): the tab strip seats FLUSH on the rail top and the
    // right panel's bottom stops at the rail's last tick, never running into
    // the `--fl-rail-bot` band where the bottom-right HUD cluster lives. The
    // dashed section/viz rules (and their tick assertions) left with the
    // 2026-08-07 declutter pass. Measured against the LIVE rail box, so a
    // divergence between `.hud__rail` and this file's mirrored geometry
    // fails here.
    const geom = await page.evaluate(() => {
      const rail = document.querySelector<HTMLElement>(".hud__rail");
      const tabs = document.querySelector<HTMLElement>(".fl-tabs");
      const panel = document.querySelector<HTMLElement>(".fl-panel");
      if (!rail || !tabs || !panel) return null;
      const r = rail.getBoundingClientRect();
      return {
        stripClearance: tabs.getBoundingClientRect().top - r.top,
        panelTopOff: Math.abs(panel.getBoundingClientRect().top - r.top),
        panelOverrun: panel.getBoundingClientRect().bottom - r.bottom,
      };
    });
    expect(geom, "the casefile and the HUD rail must both be mounted").not.toBeNull();
    expect(
      Math.abs(geom!.stripClearance),
      `the tab strip is ${geom!.stripClearance.toFixed(1)}px off the rail top`
    ).toBeLessThan(1.5);
    expect(
      geom!.panelTopOff,
      `the panel top is ${geom!.panelTopOff.toFixed(1)}px off the rail top`
    ).toBeLessThan(1.5);
    expect(
      geom!.panelOverrun,
      `the panel runs ${geom!.panelOverrun.toFixed(1)}px past the rail's last tick`
    ).toBeLessThanOrEqual(1.5);

    // EVERY ROW, not just the one that opens. The harmonised shell keeps the
    // proof register and directory in the left column while each visual owns
    // the complete right panel. These boxes clip silently, so measure all
    // four project shapes rather than trusting the default map row.
    const rowCount = await page.locator(".fl-row").count();
    expect(rowCount, "the directory holds four rows").toBe(4);

    const clipped: string[] = [];
    const unframed: string[] = [];
    for (let i = 0; i < rowCount; i++) {
      const row = page.locator(".fl-row").nth(i);
      await row.click();
      await page.waitForTimeout(350);

      // ── EVERY ROW IS THE SAME INSTRUMENT (ADR-064) ─────────────────
      // The four plates share one console frame, so the panel reads as one
      // device that changes what it displays rather than four boxes in the
      // same slot. A plate that renders without it is the regression this
      // catches — and it would look merely "plain" rather than broken.
      const frame = await page.evaluate(() => {
        const kind = document.querySelector<HTMLElement>(".fl-panel__viz")?.dataset.kind ?? "?";
        const con = document.querySelector<HTMLElement>(".fl-con__console");
        const plate = document.querySelector<HTMLElement>(".fl-plate");
        if (!con || !plate) return { kind, ok: false, why: "no console frame" };
        const c = con.getBoundingClientRect();
        const p = plate.getBoundingClientRect();
        // It fills the plate less its bezel gap, on all four sides.
        const inset = Math.min(
          c.top - p.top,
          p.bottom - c.bottom,
          c.left - p.left,
          p.right - c.right
        );
        if (!(inset >= 0 && inset < 40)) return { kind, ok: false, why: `bezel inset ${inset}` };
        // ⚠ AND IT NEVER FILTERS THE AUTHORED EVIDENCE. ADR-056 U5 is the
        // ruling and ADR-064 U2 draws the line where it belongs: AUTHORED vs
        // CAPTURED. The stills are Loop's ads and the films their
        // commercials — intended colour, left alone. The tool captures are
        // arbitrary screenshot UI, which is what the duotone was built to
        // normalize, and they carry it.
        //
        // BOTH HALVES ARE ASSERTED. A narrowed ban alone would test less than
        // the blanket one it replaces: it could not tell a deliberate
        // exception from a treatment that silently stopped applying.
        const filtered = [...document.querySelectorAll<HTMLElement>(".fl-plate img")]
          .filter((im) => !im.classList.contains("fl-shot__img"))
          .map((im) => getComputedStyle(im).filter)
          .filter((f) => f && f !== "none");
        if (filtered.length) return { kind, ok: false, why: `img filter ${filtered[0]}` };

        // The capture half is DORMANT since ADR-068 U3 (all four tools are
        // drawn) but stays executable: a fifth tool without a drawing
        // renders `.fl-shot__img` and this branch judges it again.
        const shot = document.querySelector<HTMLElement>(".fl-shot__img");
        if (shot) {
          const f = getComputedStyle(shot).filter;
          if (!f || f === "none") return { kind, ok: false, why: "tool capture is unfiltered" };
          const veil = document.querySelector<HTMLElement>(".fl-shot__frame");
          if (!veil) return { kind, ok: false, why: "tool capture has no veil frame" };
        }

        // ⚠ THE WALKTHROUGH BAR SURVIVES THE SQUEEZE ON EVERY BRANCH, and
        // nothing else catches this. `.fl-shot` is `overflow: hidden`, which
        // makes a flex item's automatic minimum resolve to ZERO rather than
        // to its content — so when the facts grew a line it shrank below its
        // own contents and sliced the bar in half, with every box still
        // reporting zero overflow. The bar is the ONE affordance saying the
        // walkthrough opens; losing it costs the plate its interaction.
        const shotFrame = document.querySelector<HTMLElement>(".fl-shot");
        const bar = document.querySelector<HTMLElement>(".fl-shot__bar");
        if (shotFrame && bar) {
          const cut = bar.getBoundingClientRect().bottom - shotFrame.getBoundingClientRect().bottom;
          if (cut > 1) return { kind, ok: false, why: `walkthrough bar clipped ${cut}px` };
        }

        // ── ONE RAIL, AND NO ORDINALS ANYWHERE (ADR-066) ───────────────
        // Every row switches on the same strip: `.fl-con__rail`, with ONE
        // travelling `.fl-con__spine` and never a marker per station. And
        // the label is the FUNCTION alone — the tools rail's `01 · MÍMIR`
        // chrome line, the films rail's `01 / 02` and the map's `01 02 03`
        // all left together (owner, 2026-08-06), so a bare ordinal
        // reappearing anywhere on this surface is the regression.
        const rail = document.querySelector<HTMLElement>(".fl-con__rail");
        if (!rail) return { kind, ok: false, why: "no shared rail" };
        const stns = [...rail.querySelectorAll<HTMLElement>(".fl-con__stn")];
        if (stns.length < 2) return { kind, ok: false, why: `rail has ${stns.length} stations` };
        const spines = rail.querySelectorAll(".fl-con__spine").length;
        if (spines !== 1) return { kind, ok: false, why: `${spines} spines, expected 1` };
        if (rail.getAttribute("role") !== "tablist")
          return { kind, ok: false, why: "rail is not a tablist" };
        const ordinal = stns
          .map((s) => (s.textContent ?? "").trim())
          .find((t) => /^\s*\d{1,2}\b/.test(t) || /\b\d{1,2}\s*\/\s*\d{1,2}\b/.test(t));
        if (ordinal) return { kind, ok: false, why: `station carries an ordinal: "${ordinal}"` };
        const lit = stns.filter((s) => s.dataset.on !== undefined).length;
        if (lit !== 1) return { kind, ok: false, why: `${lit} stations lit, expected 1` };

        // ── EVERY STATION IS SQUARE (ADR-089) ────────────────────────────
        // This asserted the opposite until the housing shipped, and the
        // reason it flipped is the clause it was written from rather than a
        // change of taste.
        //
        // The leading plate's cut existed because the CONSOLE's chamfer fell
        // on it: the console removed every point where `x + y < --con-ch`
        // (15.9–22px) and the plate removed `x + y < --stn-ch + 2`
        // (10.6–13px), so the leading cut was subsumed by ~8px at every rung
        // and what read as WORK's notch was the housing's (ADR-065 U3 — the
        // housing's chamfer falls on one member of a seated set, so the cut
        // belongs to that member alone). Inside `.fl-hz` the console is a
        // CELL and carries no chamfer at all, so that clause has no subject:
        // the cut would be a 6–11px diagonal with no edge behind it, which is
        // exactly the decorative asymmetry ADR-065 rule 5 forbids and which
        // this guard's own predecessor was written to remove from the
        // trailing plates.
        //
        // ⚠ STILL PINNED FROM BOTH ENDS, just at a different value: EVERY
        // station square, and the console square above them. A one-sided
        // check would pass a console that quietly grew its chamfer back while
        // the rail stayed flat, which is the drift that put a floating
        // diagonal on every tab in the first place.
        const cut = (s: HTMLElement) => getComputedStyle(s).clipPath;
        const notched = stns.filter((s) => cut(s).startsWith("polygon("));
        if (notched.length)
          return {
            kind,
            ok: false,
            why: `${notched.length} station(s) notched inside a chamfered housing`,
          };
        const panel = document.querySelector<HTMLElement>(".fl-con__console");
        if (panel && getComputedStyle(panel).clipPath.startsWith("polygon("))
          return { kind, ok: false, why: `the console kept a chamfer inside the housing` };

        // ⚠ THE SHOULDER IS REVERSED INSIDE THE HOUSING (owner, 2026-09-03),
        // AND THE READ IT PROTECTED MOVED RATHER THAN BEING GIVEN UP. The
        // inset was the LEADING plate's notch shoulder made explicit: a clip
        // clips its pseudos, square plates do not, and a divider running to
        // the rail's top edge turned a row of seated keys back into a divided
        // bar. But inside `.fl-hz` the console is a cell with `clip-path:
        // none`, so there is no notch anywhere on the rail — the inset became
        // a 6–11px stub against a corner with no cut to shoulder against.
        // What says "seated keys" now is the FILL: the lit plate is solid
        // gold with its ink knocked out, the same inverse video the lit
        // directory row uses one column over. So the seam runs the full
        // height and the guard asserts the material instead — dawn, because a
        // key-to-key divider is a region divider and gold .13 was the
        // console's own private vocabulary.
        const seamStyle = getComputedStyle(stns[1], "::before");
        const seamTop = Number.parseFloat(seamStyle.top);
        if (!(seamTop < 1))
          return {
            kind,
            ok: false,
            why: `the plate seam kept its notch shoulder inside the housing (${seamTop}px)`,
          };
        // Gold separates from dawn on the red-blue spread in BOTH themes:
        // gold is 202−84 = 118 dark / 138−32 = 106 light, dawn is 235−214 = 21
        // dark / 17−9 = 8 light. Nothing on this ladder sits between.
        const goldish = (c: string) => {
          const m = c.match(/\d+(\.\d+)?/g);
          return !!m && m.length >= 3 && Number(m[0]) - Number(m[2]) > 40;
        };
        if (goldish(seamStyle.backgroundColor))
          return {
            kind,
            ok: false,
            why: `the plate seam is still gold — ${seamStyle.backgroundColor}`,
          };
        // And the lit plate carries a FLAT fill, never a ramp.
        // `background-image` is `none` on a solid colour and a
        // `linear-gradient(…)` on a ramp, which is the whole distinction the
        // owner's reference set turns on.
        const litPlate = stns.find((s) => s.dataset.on !== undefined);
        const litBg = litPlate ? getComputedStyle(litPlate).backgroundImage : "none";
        if (litBg !== "none")
          return {
            kind,
            ok: false,
            why: `the lit station went back to a gradient — ${litBg.slice(0, 60)}`,
          };

        // ── NO PLATE PRINTS A FOOT (owner, 2026-08-08) ─────────────────
        // The declutter took the last two — the map's reading sentence and
        // the Studio sheets' captions — after the tools row (08-07) and the
        // films (which never had one). ADR-066's law survives as its limit
        // case: today NO plate has anything to say there, and this sweep is
        // what keeps a foot from drifting back one row at a time. The
        // ConsoleFrame slot itself stays, as the context mechanism.
        const foot = document.querySelector<HTMLElement>(".fl-con__foot");
        if (foot) return { kind, ok: false, why: "a console foot came back on this row" };

        // ── AND THE SHEET'S VERDICT IS NOT THAT FOOT ───────────────────
        // The band above is ROW chrome hung off the frame; `.fl-verdict` is
        // SHEET content inside the field, and it switches with the rail
        // (owner, 2026-08-29). Three sheets sharing a rail and nothing else
        // read as three documents, so the band is the template's one shared
        // member — a sheets row without one has lost the thing that made it
        // one instrument.
        if (kind === "sheets" && !document.querySelector(".fl-verdict"))
          return { kind, ok: false, why: "the sheet lost its verdict band" };

        // ── TWO FAMILIES, AND EACH DOES ITS OWN JOB ────────────────────
        // ⚠ THIS IS THE GUARD THAT WOULD HAVE CAUGHT THE LAST TWO FONT
        // BUGS. `--font-sans` was declared nowhere, so the foot rendered in
        // the browser's default; `--font-mono` resolves to IBM Plex Mono, so
        // the console's whole subtree inherited a THIRD family and four
        // lines of body copy set in monospace beside a sans foot. Both were
        // invisible to review — a fallback face just looks like a choice.
        //
        // The type law: PT Mono owns instrument chrome, PP Neue Montreal
        // owns titles and prose. So the assertion is per-ROLE, not just
        // "no third family" — a sentence in mono passes a family count.
        const HOUSE = ["PT Mono", "PP Neue Montreal"];
        const famOf = (el: Element) =>
          getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, "").trim();
        const foreign: string[] = [];
        document.querySelectorAll(".fl-case *").forEach((el) => {
          if (!(el instanceof HTMLElement)) return; // the map's SVG is its own pass
          const own = [...el.childNodes]
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent ?? "")
            .join("")
            .trim();
          if (!own) return;
          const fam = famOf(el);
          if (!HOUSE.includes(fam)) foreign.push(`${el.className || el.tagName}:${fam}`);
        });
        if (foreign.length) return { kind, ok: false, why: `foreign face ${foreign[0]}` };

        // Prose is SANS, by selector — the ones that inherited mono.
        // (`.fl-con__foot p` left the list with the feet, 2026-08-08;
        // `.fl-detail__d` joined with the capability sentences.)
        for (const sel of [
          ".fl-detail__d",
          ".fl-cap__d",
          ".fl-cmp__desc",
          ".fl-proof-register__description",
          // The verdict band's sentence (2026-08-29). Its kicker inherits
          // `--fl-mono` from the band and is covered by the sweep above.
          ".fl-verdict__p",
        ]) {
          const el = document.querySelector(sel);
          if (el && famOf(el) !== "PP Neue Montreal")
            return { kind, ok: false, why: `${sel} is ${famOf(el)}, not sans` };
        }

        // ── ONE PANEL, ONE HAIRLINE, TWO NOTCHES (owner, 2026-08-07) ───
        // ⚠ THIS REPLACES THE ORBIT-ARC BOUND. There is no ring to bound any
        // more: the ellipses and the `.fl-con__outer` bezel are deleted, and
        // `ry < 525` guarded a shape that no longer exists. What has to hold
        // instead is that they stay deleted — three concentric outlines
        // around a screenshot is the read the owner rejected — and that the
        // one surviving box is the mockup's `.panel`.
        if (document.querySelector(".fl-con__orbit"))
          return { kind, ok: false, why: "the orbit ring came back" };
        if (document.querySelector(".fl-con__outer"))
          return { kind, ok: false, why: "the outer bezel came back" };

        // ⚠ ADR-065 U2 IS RETIRED, AND THE CHAMFER IT ENUMERATED IS THE
        // HOUSING'S NOW (ADR-089). This asserted the owner's TL+BR override
        // on the console — the law's one enumerated mirrored object. Inside
        // `.fl-hz` the console is a CELL, and the children of a chamfered box
        // are square (rule 4), so the whole signature moves up one level: the
        // slab carries the canonical TR+BL and the panel carries nothing.
        //
        // Asserted here rather than deleted, because "the panel is square" is
        // only correct while something above it is not — a surface where BOTH
        // are square has lost the machined read entirely, and that is a state
        // no other assertion on this row would notice.
        const hz = document.querySelector<HTMLElement>(".fl-hz");
        if (!hz) return { kind, ok: false, why: "the housing is not mounted" };
        const lip = getComputedStyle(hz, "::before").clipPath;
        const pts = lip.startsWith("polygon(")
          ? lip
              .slice(8, -1)
              .split(",")
              .map((s) => s.trim())
          : [];
        const square = (re: RegExp) => pts.some((p) => re.test(p));
        if (!pts.length) return { kind, ok: false, why: "the housing is not chamfered at all" };
        // The canonical diagonal: square TL and square BR, neither TR nor BL.
        if (!square(/^0(px|%)\s+0(px|%)$/))
          return { kind, ok: false, why: `the housing notched top-LEFT — ${lip}` };
        if (!square(/^100%\s+100%$/))
          return { kind, ok: false, why: `the housing notched bottom-RIGHT — ${lip}` };

        // The console's own hairline goes with its chamfer — it is a cell in
        // a framed box, not a second framed object.
        const bc = getComputedStyle(con).borderTopColor;
        if (!/^rgba\(.*,\s*0\)$/.test(bc))
          return { kind, ok: false, why: `the console kept its own edge — ${bc}` };

        return { kind, ok: true, why: "" };
      });
      if (!frame.ok) unframed.push(`${frame.kind} — ${frame.why}`);

      const overflow = await page.evaluate(() => {
        // The inner map field earns its place here (ADR-061): absolute work
        // nodes can overflow their stage while the enclosing visual still
        // reports 0, because its own `overflow: hidden` swallows the evidence.
        const boxes = [
          ".fl-brief",
          ".fl-proof-register",
          ".fl-dir",
          ".fl-panel__viz",
          ".fl-plate",
          // The map's canvas earns its place here (ADR-062): the SVG is
          // absolutely positioned inside it, so a crop that outgrows the
          // console reports 0 on `.fl-plate`, whose own `overflow: hidden`
          // swallows the evidence.
          ".fl-con__field",
        ] as const;
        const file = document.querySelector<HTMLElement>(".fl-row[aria-selected='true']");
        const out: { box: string; over: number; row: string }[] = [];
        for (const sel of boxes) {
          const el = document.querySelector<HTMLElement>(sel);
          // Visual-specific inner plates may be absent by design; the shared
          // brief/register/directory/panel boxes are always present.
          if (!el) continue;
          out.push({
            box: sel,
            over: el.scrollHeight - el.clientHeight,
            row: file?.textContent?.trim().slice(0, 28) ?? "?",
          });
        }
        return out;
      });

      // 1px of tolerance for sub-pixel rounding on fractional line boxes;
      // anything real is a whole line of type or more.
      for (const o of overflow) {
        if (o.over > 1) clipped.push(`${o.row} — ${o.box} clips ${o.over}px`);
      }

      // ── EVERY SHEET, NOT JUST THE ONE THE ROW OPENS ON ────────────────
      // ⚠ THE SWEEP ABOVE READS EACH ROW ON ITS DEFAULT STATION, so THE
      // LINE and THE RED LINE were never measured on the landing — and
      // the verdict band broke THE LINE at 1280×720 the day it shipped:
      // `.fl-cmp__middle` centres in its row, so content that outgrows the
      // row spills SYMMETRICALLY, the head clipping under the column's
      // `overflow: hidden` while the description printed through the
      // exemplars. **A symmetric spill reports `scrollHeight ===
      // clientHeight`**, so no overflow number could have caught it; the
      // column's own rows are what has to be compared.
      const isSheets = await page.locator(".fl-plate--sheets").count();
      if (isSheets) {
        const stns = await page.locator(".fl-con__stn").count();
        for (let s = 0; s < stns; s += 1) {
          await page.locator(".fl-con__stn").nth(s).click();
          await page.waitForTimeout(360);
          const spill = await page.evaluate(() => {
            const bad: string[] = [];
            const label =
              document.querySelector(".fl-con__stn[data-on] b")?.textContent?.trim() ?? "?";
            for (const col of document.querySelectorAll<HTMLElement>(".fl-cmp__col")) {
              const cr = col.getBoundingClientRect();
              // The head is the first thing a symmetric spill eats.
              const head = col.querySelector<HTMLElement>(".fl-cmp__head");
              const ex = col.querySelector<HTMLElement>(".fl-cmp__ex");
              const mid = col.querySelector<HTMLElement>(".fl-cmp__middle");
              if (head && head.getBoundingClientRect().top < cr.top - 0.5)
                bad.push(`${label}: the column head is clipped above its own box`);
              if (
                mid &&
                ex &&
                mid.getBoundingClientRect().bottom > ex.getBoundingClientRect().top + 0.5
              )
                bad.push(`${label}: the middle row prints through the exemplars`);
            }
            // And the band itself, on every station.
            if (!document.querySelector(".fl-verdict")) bad.push(`${label}: no verdict band`);
            return bad;
          });
          clipped.push(...spill);
        }
        await page.locator(".fl-con__stn").nth(0).click();
        await page.waitForTimeout(260);
      }
    }
    expect(clipped, `boxes clipping at 1440x800:\n${clipped.join("\n")}`).toEqual([]);
    expect(unframed, `rows without the console frame:\n${unframed.join("\n")}`).toEqual([]);

    // ── AND ALL FOUR WIREFRAMES AT THE BINDING BOX (ADR-068 U3) ──────────
    // The row walk above reads the tools row on its default station only, so
    // the other three drawings need their own visit — and 1440×800 is where
    // the frame is at its proportional tightest on the owner's own laptop.
    // Every span in every drawing is a fraction of that box.
    // Row 2 is Software for Few since 2026-08-07.
    await page.locator(".fl-row").nth(1).click();
    await page.waitForTimeout(400);
    for (const stn of WIREFRAME_STATIONS) {
      await page.locator(".fl-con__stn").nth(stn.idx).click();
      await page.waitForTimeout(700);
      if (stn.kind !== "wire") continue;
      expectWireframeBay(await page.evaluate(readToolBay), `1440x800 ${stn.id}`, stn.labels);
      expect(
        await page.evaluate(() => {
          const f = document.querySelector<HTMLElement>(".fl-con__field");
          return f ? f.scrollHeight - f.clientHeight : 99;
        }),
        `1440x800 ${stn.id}: the console field clips`
      ).toBeLessThanOrEqual(1);
    }
  });

  test("desktop: ring mode retires the racks; cards expose their CTA", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "ring mode is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });
    // Arrival beat (5-beat runway, lead-in removed 2026-07-17): beat 0 owns
    // service 0, so Advisory is front on arrival and its CTA is the one to
    // assert. p=0.18 → floor(0.9) = step 0.
    expect(await scrollServicesRunway(page, 0.18)).toBe(true);
    // Step clock + scramble decode settle.
    await page.waitForTimeout(1600);

    const stage = page.locator(".services-stage");
    await expect(stage).toHaveAttribute("data-card-ring", "on");
    await expect(stage).toHaveAttribute("data-active-step", "0");

    // Racks exist in the DOM (mobile path needs them) but render none.
    const rackDisplay = await page
      .locator(".svc-rack")
      .first()
      .evaluate((el) => getComputedStyle(el).display);
    expect(rackDisplay).toBe("none");

    // Leader lines retire with the racks in ring mode.
    await expect(page.locator(".services-scan-connectors")).toHaveCount(0);

    // The cards carry their copy on the baked face; the DOM exposes the
    // front card as a full-rect OPEN button (ADR-050 — the tight face bakes
    // no CTA at all, only a top-right expand chit that is visual chrome, so
    // nothing is shimmed onto the ADR-029 CTA box until the drawer is out
    // and its booking CTA needs one) plus side-card targets.
    // Generous timeout: cold dev-server compile + texture bakes + the
    // parked-anchor gate all precede the first publish.
    await expect(page.locator(".svc-ring-hits")).toHaveCount(1);
    const frontCard = page.getByRole("button", { name: "Open Keynote details" });
    await expect(frontCard).toBeVisible({ timeout: 20_000 });
    await expect(frontCard).toHaveAttribute("aria-expanded", "false");
    // The bottom readout strip is RETIRED (owner, 2026-07-16) — the
    // active-service clock is asserted via data-active-step + the CTA
    // link in the step tests below.
    await expect(page.locator(".services-readout")).toHaveCount(0);

    // The SOURCE BUS right-rail register is RETIRED (ADR-044) — the
    // section masthead carries the services title/intro instead. The
    // masthead is pure DOM (ring mode only), title left / intro right.
    await expect(page.locator(".tools-rail-register__heading--services")).toHaveCount(0);
    await expect(page.locator(".services-masthead")).toHaveCount(1);
    await expect(page.locator(".services-masthead__title")).toContainText("AI CAPABILITY");
  });

  test("desktop: the front card opens its spec drawer, and Escape / scroll dismiss it", async ({
    page,
  }) => {
    test.skip(!isDesktopViewport(page), "the card drawer is desktop-only (ring gate)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });
    expect(await scrollServicesRunway(page, 0.18)).toBe(true);
    await page.waitForTimeout(1600);

    const frontCard = page.getByRole("button", { name: "Open Keynote details" });
    await expect(frontCard).toBeVisible({ timeout: 20_000 });

    // ── The ghost fence (ADR-050's blocking flaw) ────────────────────────
    // Parked and closed, the drawer must not exist in ANY channel: no rect
    // published, no shimmed CTA or close control, no screen-reader copy.
    await expect(frontCard).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(".svc-ring-hits__sr")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Book a keynote" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Close Keynote details" })).toHaveCount(0);

    // ── Open ─────────────────────────────────────────────────────────────
    // The drawer faces bake LAZILY on this first click, so the shims can
    // take a beat longer to appear than the rest of the ring.
    await frontCard.click();
    await expect(frontCard).toHaveAttribute("aria-expanded", "true");
    // The open state dims the section copy behind the enlarged pair
    // (services.css keys --svc-plate-dim off this attribute).
    await expect(page.locator(".services-stage")).toHaveAttribute("data-plate-open", "1");
    // The drawer's baked CTA, reachable as a real link on the second rect.
    await expect(page.getByRole("link", { name: "Book a keynote" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("button", { name: "Close Keynote details" })).toBeVisible();
    // The baked spec copy, readable.
    await expect(page.locator(".svc-ring-hits__sr")).toContainText("Duration:");

    // ── Escape dismisses ─────────────────────────────────────────────────
    await page.keyboard.press("Escape");
    await expect(frontCard).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(".services-stage")).not.toHaveAttribute("data-plate-open", "1");
    await expect(page.locator(".svc-ring-hits__sr")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Book a keynote" })).toHaveCount(0);

    // ── Runway scroll dismisses ──────────────────────────────────────────
    // The drawer is welded to its card and rotates away with it, so moving
    // the ring must close it rather than leave a panel hanging off a card
    // swinging out of front-centre.
    await frontCard.click();
    await expect(frontCard).toHaveAttribute("aria-expanded", "true");
    expect(await scrollServicesRunway(page, 0.3)).toBe(true);
    await page.waitForTimeout(800);
    await expect(page.locator(".svc-ring-hits__sr")).toHaveCount(0);
  });

  test("desktop: the ambient hold survives the pinned #about stage and dies under the next opaque station", async ({
    page,
  }) => {
    test.skip(!isDesktopViewport(page), "the deck-flip stage is desktop-only (ring gate)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });

    // ⚠ SMOOTH SCROLL CAN OUTLIVE THE WAIT.
    // The four scroll waypoints below cover 10+ viewports each; on this
    // machine `waitForTimeout(900)` regularly ends before Chrome's own
    // smooth scroll does, so the reader sits ~1vh short of the target and
    // the "under practice" assertion measures ambient state while
    // `#practice.top` is still positive. Poll until scrollY settles, so
    // the assertion measures the state the scroll target names.
    const scrollAndSettle = async (y: number) => {
      await page.evaluate((ty) => window.scrollTo(0, ty as number), y);
      await page.waitForFunction((ty) => Math.abs(window.scrollY - (ty as number)) <= 2, y, {
        timeout: 4000,
      });
    };

    // #about directly follows #services (ADR-033 funnel; ADR-047 makes it
    // the pinned transparent deck-flip stage).
    const followsServices = await page.evaluate(() => {
      const services = document.getElementById("services");
      const about = document.getElementById("about");
      if (!services || !about) return false;
      return about.offsetTop > services.offsetTop;
    });
    expect(followsServices).toBe(true);

    // Ride the runway to its end, then walk into the pinned #about stage:
    // the ambient hold must SURVIVE (the canvas is the deck's backdrop) and
    // the stage must be engaged + transparent (ADR-047 inverts the ADR-033
    // seam this test used to pin).
    expect(await scrollServicesRunway(page, 0.98)).toBe(true);
    await page.waitForTimeout(900);
    const aboutMid = await page.evaluate(() => {
      const runway = document.querySelector(".about-stage-root");
      if (!runway) return null;
      const rect = runway.getBoundingClientRect();
      return Math.round(rect.top + window.scrollY + (rect.height - window.innerHeight) * 0.5);
    });
    expect(aboutMid).not.toBeNull();
    await scrollAndSettle(aboutMid as number);
    await page.waitForTimeout(600);

    const mid = await page.evaluate(() => ({
      ambient: document.documentElement.hasAttribute("data-services-ambient"),
      exit: document.documentElement.hasAttribute("data-corridor-exit"),
      mode: document.getElementById("about")?.getAttribute("data-about-mode") ?? null,
      aboutBg: getComputedStyle(document.getElementById("about")!).backgroundColor,
      flip: (
        document
          .querySelector<HTMLElement>(".about-stage")
          ?.style.getPropertyValue("--about-flip") ?? ""
      ).slice(0, 6),
      voidwalkerDisplay: (() => {
        const vw = document.querySelector<HTMLElement>("#about > .voidwalker");
        return vw ? getComputedStyle(vw).display : null;
      })(),
    }));
    expect(mid.ambient).toBe(true);
    expect(mid.exit).toBe(true);
    expect(mid.mode).toBe("stage");
    // The station is transparent over the live canvas (ADR-008 Rule 2
    // exception) and the static fallback yields to the stage.
    expect(mid.aboutBg).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|transparent/);
    expect(parseFloat(mid.flip || "0")).toBe(1);
    expect(mid.voidwalkerDisplay).toBe("none");

    // ⚠ THE COVER MOVED ONE STATION DOWN (ADR-081 / ADR-082 U2). The
    // production hologram makes `#voidwalker` a pinned TRANSPARENT stage,
    // so the ambient survives it exactly as it survives pinned #about and
    // terminates under `#practice`. The hook's next-station query and the
    // CSS cover rule name that station together.
    /* ⚠ THE WAYPOINT IS ERA 0's SLICE CENTRE, NOT THE RUNWAY'S MIDPOINT.
       Since ADR-082 U10 scroll IS the era selector, so a progress picks an
       ERA as well as a clock reading — and the midpoint (0.5) resolves to
       era 3, which is why this case's `mastText` pin could never pass. The
       slice centre is the same round-trip-deterministic point a CLICK pins
       (`voidwalkerProgressForEra(0, n)`): from either scroll direction the
       crossing overshoot is a full half-slice, well past the 0.22
       hysteresis, so era 0 seats whichever way the reader arrived.
       ⚠ IT FOLLOWS THE ROSTER — the count is read off the live tabs and the
       band off the clock, so a sixth era returning does not silently retune
       this waypoint to a different era. At five eras it is 0.216, which
       leaves `--vwh-in` at 1 (the entry closes at 0.14) and `--vwh-exit` at
       0 (the exit opens at 0.74).
       ⚠ AND THE BASE IS THE RUNWAY'S OWN TOP, which is what the writer
       derives from (`-rect.top / (rect.height - innerHeight)`). */
    const inTravel = await page.evaluate((band: readonly [number, number]) => {
      const vw = document.getElementById("voidwalker");
      const runway = vw?.querySelector<HTMLElement>(".vw--hologram");
      if (!vw || !runway) return null;
      const count = document.querySelectorAll("[data-vwh-era-tab]").length || 1;
      const [lo, hi] = band;
      const progress = count <= 1 ? lo : lo + ((hi - lo) / count) * 0.5;
      const rect = runway.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      return Math.round(window.scrollY + rect.top + travel * progress);
    }, VOIDWALKER_ERA_BAND);
    expect(inTravel).not.toBeNull();
    await scrollAndSettle(inTravel as number);
    await page.waitForTimeout(600);
    const during = await page.evaluate(() => ({
      ambient: document.documentElement.hasAttribute("data-services-ambient"),
      mode: document.getElementById("voidwalker")?.getAttribute("data-vw-mode") ?? null,
      bg: getComputedStyle(document.getElementById("voidwalker")!).backgroundColor,
      bgImage: getComputedStyle(document.getElementById("voidwalker")!).backgroundImage,
      hologram: !!document.querySelector("#voidwalker .vw--hologram"),
      ready: document.querySelector("#voidwalker .vwd")?.hasAttribute("data-vwh-ready") ?? false,
      enter:
        document
          .querySelector<HTMLElement>("#voidwalker .vwd")
          ?.style.getPropertyValue("--vwh-in") ?? "",
      exit:
        document
          .querySelector<HTMLElement>("#voidwalker .vwd")
          ?.style.getPropertyValue("--vwh-exit") ?? "",
    }));
    expect(during.mode).toBe("hologram");
    expect(during.hologram).toBe(true);
    expect(during.ready).toBe(true);
    expect(during.bg).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|transparent/);
    expect(during.bgImage).toBe("none");
    expect(parseFloat(during.enter || "0")).toBe(1);
    expect(parseFloat(during.exit || "1")).toBe(0);
    expect(during.ambient).toBe(true);

    // Reverse above the pin: the one-shot latch regression. Every visual
    // actor must be hidden again BEFORE native flow can carry the stage, and
    // the outer station must remain a transparent, starless window.
    const beforePin = await page.evaluate(() => {
      const vw = document.getElementById("voidwalker");
      if (!vw) return null;
      return Math.round(
        window.scrollY + vw.getBoundingClientRect().top - window.innerHeight * 0.08
      );
    });
    expect(beforePin).not.toBeNull();
    await scrollAndSettle(beforePin as number);
    await page.waitForTimeout(500);
    const reversed = await page.evaluate(() => {
      const section = document.getElementById("voidwalker")!;
      const stage = document.querySelector<HTMLElement>("#voidwalker .vwd")!;
      const mast = document.querySelector<HTMLElement>("#voidwalker .vwd__mast__title")!;
      const css = getComputedStyle(section);
      return {
        stageTop: stage.getBoundingClientRect().top,
        enter: stage.style.getPropertyValue("--vwh-in"),
        mastOpacity: getComputedStyle(mast).opacity,
        bg: css.backgroundColor,
        bgImage: css.backgroundImage,
      };
    });
    expect(reversed.stageTop).toBeGreaterThan(0);
    expect(parseFloat(reversed.enter || "1")).toBe(0);
    expect(parseFloat(reversed.mastOpacity)).toBe(0);
    expect(reversed.bg).toMatch(/rgba\(0,\s*0,\s*0,\s*0\)|transparent/);
    expect(reversed.bgImage).toBe("none");

    await scrollAndSettle(inTravel as number);
    await page.waitForTimeout(1200);
    const replayed = await page.evaluate(() => {
      const stage = document.querySelector<HTMLElement>("#voidwalker .vwd")!;
      const mast = document.querySelector<HTMLElement>("#voidwalker .vwd__mast__title")!;
      return {
        enter: stage.style.getPropertyValue("--vwh-in"),
        mastOpacity: getComputedStyle(mast).opacity,
        mastText: mast.textContent,
      };
    });
    expect(parseFloat(replayed.enter || "0")).toBe(1);
    expect(parseFloat(replayed.mastOpacity)).toBe(1);
    expect(replayed.mastText).toBe("The Intelligence Architect");

    // Walk under #practice: THIS is where the ambient hold ends now. The
    // bottom gate is keyed to the SAME rect as the fade envelope, so there
    // is no hard cut at the travel runway's end.
    const underNext = await page.evaluate(() => {
      const next = document.getElementById("practice") ?? document.getElementById("contact");
      if (!next) return null;
      return Math.round(
        window.scrollY + next.getBoundingClientRect().top + window.innerHeight * 0.3
      );
    });
    expect(underNext).not.toBeNull();
    await scrollAndSettle(underNext as number);
    // Wait for the corridor's rAF writer to see the settled scroll.
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => {
      const pr = document.getElementById("practice");
      return {
        ambient: document.documentElement.hasAttribute("data-services-ambient"),
        exit: document.documentElement.hasAttribute("data-corridor-exit"),
        prTopVh: pr ? +(pr.getBoundingClientRect().top / window.innerHeight).toFixed(2) : null,
      };
    });
    expect(after.prTopVh, "the walk actually reached inside #practice (top < 0)").toBeLessThan(0);
    expect(after.ambient).toBe(false);
    expect(after.exit).toBe(false);
  });

  test("desktop: the scroll clock advances the active service", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "ring mode is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });

    // (Readout strip retired 2026-07-16 — the active-service clock is
    // asserted via data-active-step + the front card's own hit target. Under
    // ADR-050 that target is the full-rect OPEN button, named for the plate's
    // chip, rather than the CTA link the full face used to bake.)
    // Arrival remap (2026-07-17): the ring holds the first slot through the
    // short arrival, then rotates. `data-active-step` = the front-card index
    // (0..3). Occupancy since the 2026-08-02 harmonization: Keynote /
    // Workshop / Embedded AI Partner / Strategic Advisory. p=0.18 is in the
    // arrival window → Keynote front (step 0).
    expect(await scrollServicesRunway(page, 0.18)).toBe(true);
    await page.waitForTimeout(1600);
    await expect(page.locator(".services-stage")).toHaveAttribute("data-active-step", "0");
    await expect(page.getByRole("button", { name: "Open Keynote details" })).toBeVisible({
      timeout: 20_000,
    });

    // p=0.58 → the ring has turned two quarter-turns: the Embedded AI
    // Partner plate is front (step 2).
    expect(await scrollServicesRunway(page, 0.58)).toBe(true);
    await page.waitForTimeout(1600);
    await expect(
      page.getByRole("button", { name: "Open Embedded AI Partner details" })
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.locator(".services-stage")).toHaveAttribute("data-active-step", "2");

    // p=0.78 → the LAST service (Strategic Advisory) is front (step 3) — its
    // own hit target proves the rotation reached the end of the roster while
    // the hit areas are still alive (they retire in the exit beat).
    expect(await scrollServicesRunway(page, 0.78)).toBe(true);
    await page.waitForTimeout(1600);
    await expect(page.getByRole("button", { name: "Open Strategic Advisory details" })).toBeVisible(
      { timeout: 20_000 }
    );
    await expect(page.locator(".services-stage")).toHaveAttribute("data-active-step", "3");

    // Exit-hold beat (ADR-030): deep in the runway the front-card index
    // stays clamped on the LAST service (3) — an unclamped index would wrap
    // the clock back to the first slot (the bug the clamps kill).
    expect(await scrollServicesRunway(page, 0.95)).toBe(true);
    await page.waitForTimeout(1200);
    await expect(page.locator(".services-stage")).toHaveAttribute("data-active-step", "3");
  });

  test("desktop: wheel over the instrument scrolls natively and rotates the ring", async ({
    page,
  }) => {
    test.skip(!isDesktopViewport(page), "ring wheel is desktop-only (≥961px)");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });
    expect(await scrollServicesRunway(page, 0.3)).toBe(true);
    // Park + texture bakes settle.
    await page.waitForTimeout(4000);

    // 2026-07-15 native-scroll pass: the wheel-snap hijack is retired. A wheel
    // with the pointer OVER the cards is plain native scroll — it advances the
    // runway (scrollY climbs) and the ring rotation follows continuously, with
    // NO discrete one-beat lockout.
    const startY = await page.evaluate(() => window.scrollY);
    const startStep = Number(
      await page.locator(".services-stage").getAttribute("data-active-step")
    );
    await page.mouse.move(720, 400); // pointer over the instrument
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(600);
    const overY = await page.evaluate(() => window.scrollY);
    // Native scroll advanced the runway (not swallowed by a snap hijack)…
    expect(overY).toBeGreaterThan(startY);
    // …and the ring rotated with it (the active step advanced).
    const overStep = Number(await page.locator(".services-stage").getAttribute("data-active-step"));
    expect(overStep).toBeGreaterThan(startStep);

    // Pointer in the dead space beside the cards → also native page scroll
    // (per the "outside the cards → normal scroll-through" decision).
    const heldY = await page.evaluate(() => window.scrollY);
    await page.mouse.move(120, 400);
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(600);
    const movedY = await page.evaluate(() => window.scrollY);
    expect(movedY).toBeGreaterThan(heldY);
  });

  test("regenerated service photos resolve (embedded/workshop.webp 404 regression)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const statuses = await page.evaluate(async () => {
      const urls = [
        "/images/services/strategic.webp",
        "/images/services/keynote.webp",
        "/images/services/embedded.webp",
        "/images/services/workshop.webp",
        "/images/services/strategic.jpg",
      ];
      return Promise.all(
        urls.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "no-cache" });
            return `${url}:${res.status}`;
          } catch {
            return `${url}:0`;
          }
        })
      );
    });
    for (const status of statuses) {
      expect(status.endsWith(":200"), status).toBe(true);
    }
  });

  test("orbit lab mounts exactly one WebGL canvas, sized to the stage", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "the orbit lab is a desktop look-dev surface");

    await page.goto("/test/services-orbit", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("canvas", { timeout: 15_000 });
    // Texture bakes (fonts + photos) take a moment.
    await page.waitForTimeout(2500);

    const canvases = page.locator("canvas");
    await expect(canvases).toHaveCount(1);
    const size = await canvases.first().evaluate((c: HTMLCanvasElement) => [c.width, c.height]);
    expect(size[0]).toBeGreaterThan(400); // not the 300x150 default buffer
    expect(size[1]).toBeGreaterThan(200);
  });

  test("mobile/tablet: the plate accordion is untouched by ring mode", async ({ page }) => {
    test.skip(isDesktopViewport(page), "accordion path is <961px");

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });
    await page.evaluate(() => {
      document.querySelector(".services-stage")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(800);

    // All four plates present and flowing (racks dissolve to contents).
    await expect(page.locator(".svc-plate")).toHaveCount(4);
    // No ring overlays mount below the desktop gate.
    await expect(page.locator(".svc-ring-hits")).toHaveCount(0);
    // The about deck-flip stage never engages below the gate (ADR-047):
    // the static voidwalker owns #about and the runway stays flat.
    const aboutStatic = await page.evaluate(() => ({
      mode: document.getElementById("about")?.getAttribute("data-about-mode") ?? null,
      runwayH: document.querySelector(".about-stage-root")?.getBoundingClientRect().height ?? 0,
      voidwalker: (() => {
        const vw = document.querySelector<HTMLElement>("#about > .voidwalker");
        return vw ? getComputedStyle(vw).display : null;
      })(),
    }));
    expect(aboutStatic.mode).toBeNull();
    expect(aboutStatic.runwayH).toBeLessThan(10);
    expect(aboutStatic.voidwalker).not.toBe("none");
  });

  test("phones retune one bounded Proof instrument", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "explicit phone viewport matrix");

    for (const viewport of [
      { width: 320, height: 568 },
      { width: 390, height: 844 },
      { width: 960, height: 900 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const casefile = page.locator(".fl-case");
      await casefile.scrollIntoViewIfNeeded();
      await page.waitForTimeout(120);

      const readInstrument = () =>
        page.evaluate(() => {
          const required = (selector: string) => {
            const element = document.querySelector<HTMLElement>(selector);
            if (!element) throw new Error(`Missing ${selector}`);
            return element;
          };
          const root = required(".fl-case");
          const surfaces = [".fl-brief", ".fl-proof-register", ".fl-panel"].map((selector) => {
            const element = required(selector);
            const style = getComputedStyle(element);
            return {
              visible: style.display !== "none",
              height: element.getBoundingClientRect().height,
              overscrollY: style.overscrollBehaviorY,
              tabIndex: element.tabIndex,
            };
          });
          const modes = Array.from(document.querySelectorAll<HTMLElement>(".fl-mobile-view"));
          const stops = Array.from(document.querySelectorAll<HTMLElement>(".fl-mobile-rail__stop"));
          const steps = Array.from(document.querySelectorAll<HTMLElement>(".fl-mobile-rail__step"));
          return {
            view: root.dataset.mobileView,
            height: root.getBoundingClientRect().height,
            localOverflow: root.scrollWidth - root.clientWidth,
            surfaces,
            pressedViews: modes.filter((element) => element.getAttribute("aria-pressed") === "true")
              .length,
            currentStops: stops.filter((element) => element.getAttribute("aria-current") === "step")
              .length,
            mobileTitle: required(".fl-mobile-head__title").textContent?.trim() ?? "",
            modeHeights: modes.map((element) => element.getBoundingClientRect().height),
            stopHeights: stops.map((element) => element.getBoundingClientRect().height),
            stopWidths: stops.map((element) => element.getBoundingClientRect().width),
            stepDisplays: steps.map((element) => getComputedStyle(element).display),
          };
        });

      const label = `${viewport.width}x${viewport.height}`;
      const artifact = await readInstrument();
      expect(artifact.view).toBe("artifact");
      expect(artifact.pressedViews).toBe(1);
      expect(artifact.currentStops).toBe(1);
      expect(artifact.height, `${label}: whole Proof instrument`).toBeLessThanOrEqual(
        viewport.height + 1
      );
      expect(artifact.localOverflow, `${label}: local horizontal overflow`).toBeLessThanOrEqual(1);
      expect(artifact.surfaces.filter((surface) => surface.visible)).toHaveLength(1);
      expect(artifact.surfaces.find((surface) => surface.visible)?.tabIndex).toBe(0);
      for (const height of [...artifact.modeHeights, ...artifact.stopHeights]) {
        expect(height, `${label}: touch target`).toBeGreaterThanOrEqual(44);
      }
      for (const width of artifact.stopWidths) {
        expect(width, `${label}: case stop`).toBeGreaterThanOrEqual(44);
      }
      if (viewport.width < 390) {
        expect(artifact.stepDisplays.every((display) => display === "none")).toBe(true);
      }

      const seatHeight = artifact.surfaces.find((surface) => surface.visible)!.height;
      for (const mode of ["brief", "proof"] as const) {
        await page.locator(`#svc-casefile-view-${mode}`).click();
        const state = await readInstrument();
        expect(state.view).toBe(mode);
        expect(state.pressedViews).toBe(1);
        expect(state.currentStops).toBe(1);
        expect(state.surfaces.filter((surface) => surface.visible)).toHaveLength(1);
        expect(state.surfaces.find((surface) => surface.visible)?.tabIndex).toBe(0);
        expectNear(
          state.surfaces.find((surface) => surface.visible)!.height,
          seatHeight,
          1,
          `${label}: ${mode} seat`
        );
        expect(
          state.surfaces.find((surface) => surface.visible)!.overscrollY,
          `${label}: ${mode} releases page scroll`
        ).toBe("auto");
      }

      await page.locator("#svc-casefile-view-artifact").click();
      const titles = new Set<string>();
      for (const stop of await page.locator(".fl-mobile-rail__stop").all()) {
        await stop.click();
        const state = await readInstrument();
        expect(state.surfaces.filter((surface) => surface.visible)).toHaveLength(1);
        expect(state.surfaces.find((surface) => surface.visible)?.tabIndex).toBe(0);
        expect(state.pressedViews).toBe(1);
        expect(state.currentStops).toBe(1);
        expect(state.mobileTitle.length).toBeGreaterThan(1);
        titles.add(state.mobileTitle);
        expectNear(
          state.surfaces.find((surface) => surface.visible)!.height,
          seatHeight,
          1,
          `${label}: case seat`
        );
      }
      expect(titles.size, `${label}: case identity retunes`).toBe(4);
    }
  });

  test("light: the map console's palette carries its contrast (ADR-063 U2)", async ({ page }) => {
    test.skip(!isDesktopViewport(page), "the console is desktop-only (≥981px)");
    // The wireframe walk at the end visits all four stations now (~+3.5s).
    test.setTimeout(60_000);

    // THE FAILURE THIS PINS. The console is a port of a drawing authored on
    // near-black, and gold, green and every recessive alpha carried straight
    // over to parchment where they mean something else — measured at 1.15:1
    // (gold as text), 1.24:1 (line work) and 2.38:1 for the 80 metadata
    // labels on reading 01. The drawing was on screen and unreadable, and no
    // guard on this surface looked at colour at all.
    //
    // A saturated yellow is inherently LIGHT, so it cannot be made to carry
    // contrast on a light ground by tweaking it — hence the role ramp
    // (`--gold-line` / `--gold-ink` / `--gold-ink-lit`), which is the fix
    // ADR-058 wrote down and declined to take at the time.
    await page.goto("/?theme=light", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 20_000 });
    expect(await scrollCasefileDwell(page, DWELL_ROW_1), "casefile runway missing").toBe(true);
    await page.waitForTimeout(900);
    await expect(page.locator(".fl-pda")).toBeVisible();

    for (const [index, view] of ["1", "2", "3"].entries()) {
      await page.locator(".fl-con__stn").nth(index).click();
      await page.waitForTimeout(400);
      await expect(page.locator(".fl-pda")).toHaveAttribute("data-view", view);

      const worst = await page.evaluate(() => {
        const consoleEl = document.querySelector<HTMLElement>(".fl-con__console");
        const svg = document.querySelector<SVGSVGElement>(".fl-pda__svg");
        if (!consoleEl || !svg) return null;

        const parse = (c: string) => {
          const m = c.match(/rgba?\(([^)]+)\)/);
          if (!m) return null;
          const p = m[1].split(",").map((v) => Number.parseFloat(v));
          return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
        };
        const lin = (v: number) => {
          const s = v / 255;
          return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        type C = { r: number; g: number; b: number; a: number };
        const lum = (c: C) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
        // Alpha tokens are COMPOSITED before measuring: an alpha tuned to
        // recede toward black recedes toward parchment after the flip, and
        // judging the raw value would miss exactly that.
        const ratio = (fg: C, bg: C) => {
          const f =
            fg.a >= 1
              ? fg
              : {
                  r: fg.a * fg.r + (1 - fg.a) * bg.r,
                  g: fg.a * fg.g + (1 - fg.a) * bg.g,
                  b: fg.a * fg.b + (1 - fg.a) * bg.b,
                  a: 1,
                };
          const [hi, lo] = [lum(f), lum(bg)].sort((x, y) => y - x);
          return (hi + 0.05) / (lo + 0.05);
        };

        // ⚠ THE BED IS COMPOSITED UP THE TREE, NOT READ OFF ONE ELEMENT
        // (ADR-089). This used to be `parse(consoleEl.backgroundColor)`, which
        // was only ever right while the console painted its own opaque ground.
        // Inside the housing it is a CELL and paints nothing, so that read
        // returns `rgba(0,0,0,0)` — and `parse` happily matches it, so every
        // label was then measured against PURE BLACK. In light that put the
        // map's quietest ink at 1.06:1 and failed a page that reads fine; the
        // same hole in reverse would pass an unreadable one.
        //
        // `console.css` had already written down the general form of this bug
        // ("the walk takes its luminance from the raw RGB, so an alpha here
        // does not move a single ratio it reports"). Walking to the first
        // opaque surface and compositing back down is what a reader's eye
        // does, and it is the same `bedOf()` idiom the wireframe walk below
        // already uses.
        const bedOf = (el: Element) => {
          const layers: { r: number; g: number; b: number; a: number }[] = [];
          for (let n: Element | null = el; n; n = n.parentElement) {
            const c = parse(getComputedStyle(n).backgroundColor);
            if (c && c.a > 0) {
              layers.push(c);
              if (c.a >= 0.99) break;
            }
          }
          let bg = { r: 255, g: 255, b: 255, a: 1 };
          for (let i = layers.length - 1; i >= 0; i--) {
            const f = layers[i];
            bg = {
              r: f.a * f.r + (1 - f.a) * bg.r,
              g: f.a * f.g + (1 - f.a) * bg.g,
              b: f.a * f.b + (1 - f.a) * bg.b,
              a: 1,
            };
          }
          return bg;
        };
        const ground = bedOf(consoleEl);

        let low = { ratio: 99, text: "", fill: "" };
        for (const t of svg.querySelectorAll("text")) {
          const c = parse(getComputedStyle(t).fill);
          if (!c) continue;
          const r = ratio(c, ground);
          if (r < low.ratio)
            low = {
              ratio: Number(r.toFixed(2)),
              text: (t.textContent ?? "").slice(0, 24),
              fill: getComputedStyle(t).fill,
            };
        }

        // Line work that carries the drawing answers to the 3:1 component
        // target; the frame/divider hairlines are decorative and exempt.
        const host = getComputedStyle(document.querySelector<HTMLElement>(".fl-pda")!);
        const lines = ["--pda-amb", "--pda-dim"].map((name) => {
          const probe = document.createElement("span");
          probe.style.color = host.getPropertyValue(name).trim();
          document.body.appendChild(probe);
          const c = parse(getComputedStyle(probe).color);
          probe.remove();
          return { name, ratio: c ? Number(ratio(c, ground).toFixed(2)) : 0 };
        });

        return { low, lines };
      });

      expect(worst, `view ${view}: no console`).not.toBeNull();
      expect(
        worst!.low.ratio,
        `view ${view}: "${worst!.low.text}" is ${worst!.low.ratio}:1 in ${worst!.low.fill}`
      ).toBeGreaterThanOrEqual(4.5);
      for (const l of worst!.lines) {
        expect(l.ratio, `view ${view}: ${l.name} is ${l.ratio}:1`).toBeGreaterThanOrEqual(3);
      }
    }

    // ── AND THE OTHER THREE ROWS, ON THE SAME GROUND (ADR-064) ────────
    // The console frame put every plate on the map's parchment, which is
    // what turned ADR-058's "known cost" into a visible one: a tab ordinal
    // measured 1.25:1 beside a map that had just been fixed to 4.79. Walking
    // the rows here is what stops the four drifting apart again.
    for (let i = 0; i < 4; i++) {
      await page.locator(".fl-row").nth(i).click();
      await page.waitForTimeout(600);

      const row = await page.evaluate(() => {
        const cons = document.querySelector<HTMLElement>(".fl-con__console");
        if (!cons) return null;
        const parse = (c: string) => {
          const m = String(c).match(/rgba?\(([^)]+)\)/);
          if (!m) return null;
          const p = m[1].split(",").map((v) => Number.parseFloat(v));
          return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
        };
        const lin = (v: number) => {
          const s = v / 255;
          return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        type C = { r: number; g: number; b: number; a: number };
        const lum = (c: C) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
        const ratio = (fg: C, bg: C) => {
          const f =
            fg.a >= 1
              ? fg
              : {
                  r: fg.a * fg.r + (1 - fg.a) * bg.r,
                  g: fg.a * fg.g + (1 - fg.a) * bg.g,
                  b: fg.a * fg.b + (1 - fg.a) * bg.b,
                  a: 1,
                };
          const [hi, lo] = [lum(f), lum(bg)].sort((x, y) => y - x);
          return (hi + 0.05) / (lo + 0.05);
        };
        // Same correction as the reading walk above (ADR-089): the console is
        // a cell inside the housing and paints no ground of its own, so its
        // own `backgroundColor` is transparent and reading it measures every
        // label against black. Composite to the first opaque surface instead.
        const bedOf = (el: Element) => {
          const layers: { r: number; g: number; b: number; a: number }[] = [];
          for (let n: Element | null = el; n; n = n.parentElement) {
            const c = parse(getComputedStyle(n).backgroundColor);
            if (c && c.a > 0) {
              layers.push(c);
              if (c.a >= 0.99) break;
            }
          }
          let bg = { r: 255, g: 255, b: 255, a: 1 };
          for (let i = layers.length - 1; i >= 0; i--) {
            const f = layers[i];
            bg = {
              r: f.a * f.r + (1 - f.a) * bg.r,
              g: f.a * f.g + (1 - f.a) * bg.g,
              b: f.a * f.b + (1 - f.a) * bg.b,
              a: 1,
            };
          }
          return bg;
        };
        const ground = bedOf(cons);

        let low = { ratio: 99, text: "", color: "" };
        const walk = (el: Element) => {
          for (const node of Array.from(el.childNodes)) {
            if (node.nodeType === 3 && node.textContent?.trim()) {
              const cs = getComputedStyle(el as Element);
              // A label on its own opaque bed is judged against THAT bed —
              // the tools plate's watch bar is a real surface, not a tint.
              const own = parse(cs.backgroundColor);
              const bed = own && own.a > 0.85 ? own : ground;
              const c = parse(cs.color);
              if (c) {
                const r = ratio(c, bed);
                if (r < low.ratio)
                  low = {
                    ratio: Number(r.toFixed(2)),
                    text: node.textContent.trim().slice(0, 24),
                    color: cs.color,
                  };
              }
            } else if (node.nodeType === 1) {
              walk(node as Element);
            }
          }
        };
        walk(cons);
        const kind = document.querySelector<HTMLElement>(".fl-panel__viz")?.dataset.kind ?? "?";
        return { kind, low };
      });

      expect(row, `row ${i}: no console`).not.toBeNull();
      expect(
        row!.low.ratio,
        `row ${i} (${row!.kind}): "${row!.low.text}" is ${row!.low.ratio}:1 in ${row!.low.color}`
      ).toBeGreaterThanOrEqual(4.5);
    }

    // ── THE TOOLS ROW, ON THE SAME PARCHMENT ──────────────────────────
    // (The accent-bed sampling that lived here left with the accents: the
    // ADR-068 U2 capability blocks are plain ink on the console's own
    // ground, which the row walk above already judges. Row 2 is Software
    // for Few since 2026-08-07 (owner) — the click stays because the
    // wireframe check below needs the tools plate on screen.)
    await page.locator(".fl-row").nth(1).click();
    await page.waitForTimeout(1800);

    // ── AND ALL FOUR AUTHORED WIREFRAMES, ON THE SAME PARCHMENT (ADR-068
    // U3) ─ The row walk above reads each row on its default station only.
    // The drawings' own colour law is the one this surface keeps
    // relearning: AN ALPHA INVERTS ITS OWN MEANING ACROSS THE FLIP.
    // `rgba(ink, .44)` is a quiet label on near-black and 2.4:1 on
    // parchment; the whole `--w-*` set is re-derived in theme.css and this
    // is what holds it there. The LABELS are asserted at the 4.5:1 glyph
    // floor against their OWN OPAQUE BED (the nearest ancestor with a
    // solid ground, composited over the bay — no per-tool selector, so a
    // new drawing's plate is judged automatically); the hairlines answer
    // to a wash target (≥1.5) because they are texture, not reading.
    for (const stn of WIREFRAME_STATIONS) {
      if (stn.kind !== "wire") continue;
      await page.locator(".fl-con__stn").nth(stn.idx).click();
      await page.waitForTimeout(800);

      const wireLight = await page.evaluate(() => {
        const parse = (c: string) => {
          const m = String(c).match(/rgba?\(([^)]+)\)/);
          if (!m) return null;
          const p = m[1].split(",").map((v) => Number.parseFloat(v));
          return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
        };
        const lin = (v: number) => {
          const s = v / 255;
          return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        type C = { r: number; g: number; b: number; a: number };
        const lum = (c: C) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
        const over = (fg: C, bg: C): C =>
          fg.a >= 1
            ? fg
            : {
                r: fg.a * fg.r + (1 - fg.a) * bg.r,
                g: fg.a * fg.g + (1 - fg.a) * bg.g,
                b: fg.a * fg.b + (1 - fg.a) * bg.b,
                a: 1,
              };
        const ratio = (fg: C, bg: C) => {
          const [hi, lo] = [lum(over(fg, bg)), lum(bg)].sort((x, y) => y - x);
          return Number(((hi + 0.05) / (lo + 0.05)).toFixed(2));
        };
        const resolve = (token: string) => {
          const probe = document.createElement("span");
          probe.style.color = token;
          document.body.appendChild(probe);
          const c = parse(getComputedStyle(probe).color);
          probe.remove();
          return c;
        };
        const wire = document.querySelector<HTMLElement>(".fl-wire");
        const inner = document.querySelector<HTMLElement>(".fl-wire__in");
        const shot = document.querySelector<HTMLElement>(".fl-shot");
        if (!wire || !inner || !shot) return null;
        // The drawing's ground is the BAY, not the console — the same value
        // in both themes, but read it rather than assume it.
        const bay = parse(getComputedStyle(shot).backgroundColor)!;
        // A label on an opaque plate is judged against THAT plate: walk the
        // ancestors to the first solid ground and composite it over the bay.
        const bedOf = (el: Element) => {
          for (let p = el.parentElement; p && p !== shot; p = p.parentElement) {
            const bg = parse(getComputedStyle(p).backgroundColor);
            if (bg && bg.a >= 0.85) return over(bg, bay);
          }
          return bay;
        };
        return {
          labels: [...wire.querySelectorAll("*")]
            .filter((el) =>
              [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim())
            )
            .map((el) => ({
              t: (el.textContent ?? "").trim(),
              ratio: ratio(parse(getComputedStyle(el).color)!, bedOf(el)),
              color: getComputedStyle(el).color,
            })),
          lines: ["--w-hair", "--w-hair2", "--w-mark", "--w-green"].map((name) => {
            const c = resolve(getComputedStyle(inner).getPropertyValue(name).trim());
            return { name, ratio: c ? ratio(c, bay) : 0 };
          }),
        };
      });

      expect(wireLight, `${stn.id}: the wireframe is missing in light`).not.toBeNull();
      expect(
        wireLight!.labels.map((l) => l.t).sort(),
        `${stn.id}: the drawing's label set drifted in light`
      ).toEqual([...stn.labels].sort());
      for (const l of wireLight!.labels) {
        expect(
          l.ratio,
          `${stn.id} label "${l.t}" is ${l.ratio}:1 (${l.color})`
        ).toBeGreaterThanOrEqual(4.5);
      }
      for (const l of wireLight!.lines) {
        expect(l.ratio, `${stn.id} ${l.name} is ${l.ratio}:1 on parchment`).toBeGreaterThanOrEqual(
          1.5
        );
      }
    }
  });

  test("reduced motion keeps the accordion and mounts no ring overlays", async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: "reduce",
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".services-stage", { timeout: 15_000 });
    await page.evaluate(() => {
      document.querySelector(".services-stage")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(800);

    await expect(page.locator(".svc-plate")).toHaveCount(4);
    await expect(page.locator(".svc-ring-hits")).toHaveCount(0);
    // Reduced motion keeps the static about (no deck-flip stage) — ADR-047
    // gate parity with the ring.
    const aboutMode = await page.evaluate(
      () => document.getElementById("about")?.getAttribute("data-about-mode") ?? null
    );
    expect(aboutMode).toBeNull();

    // PRM at DESKTOP WIDTH unwraps the console too (2026-08-07). casefile.css
    // puts the casefile into static flow on `(max-width: 960px), (prefers-
    // reduced-motion: reduce)`; console.css's unwrap gate must stay the same
    // pair, or an absolute-positioned console inside an auto-height parent
    // resolves to HEIGHT 0 — measured on all four plates before the fix.
    // The flow casefile renders ONE selected panel; the map may hide its
    // console (it has the stream index). Whatever console is visible must
    // have real height and a non-overflowing field — before the fix it
    // resolved to 0px tall with the field overflowing the invisible box.
    const consoles = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".fl-con"))
        .filter((el) => getComputedStyle(el).display !== "none")
        .map((el) => {
          const field = el.querySelector(".fl-con__field");
          return {
            height: el.getBoundingClientRect().height,
            fieldOverflow: field ? field.scrollHeight - field.clientHeight : 0,
          };
        });
    });
    expect(consoles.length).toBeGreaterThanOrEqual(1);
    for (const con of consoles) {
      expect(con.height).toBeGreaterThan(150);
      expect(con.fieldOverflow).toBeLessThanOrEqual(1);
    }
    await context.close();
  });
});
