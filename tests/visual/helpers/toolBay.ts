import { expect } from "@playwright/test";

/**
 * The tool bay's smoke contract — ONE source for two surfaces (ADR-072).
 *
 * Hoisted verbatim out of `services-ring-smoke.spec.ts`: the casefile's
 * tools plate (the landing) and the portfolio arc's four dossier beats
 * mount the SAME `ToolField`, so the reader, the per-tool label pins and
 * the assertions a wireframe branch owes live here and both specs import
 * them. A spec cannot import another spec (it would register its tests
 * twice), which is why this is a helper module and not an export.
 *
 * ⚠ `readToolBay` is serialised into the page by `page.evaluate` — keep it
 * closure-free. `WIREFRAME_STATIONS` stays a LITERAL, not an import of the
 * drawings: a drifted literal fails loudly against the rendered text.
 */
/**
 * Read the tool bay's inner element — the CAPTURE or the WIREFRAME (ADR-068
 * D5). One reader for both branches, because the assertion that matters is
 * the PAIR: a capture tool must be filtered and a wireframe tool must have
 * no img and no filter. ADR-064 U2's own note applies twice over here — a
 * one-sided check cannot tell a deliberate exception from a treatment that
 * has silently stopped applying, and now the exception is per tool.
 *
 * `collapsed` earns its place: the drawing is percentage-sized inside a size
 * container, and a mark whose parent lost its definite cross size computes
 * to ZERO — it paints nothing, reports no overflow, and looks like a design
 * choice. Two of them shipped that way in authoring, at 900px wide.
 */
export function readToolBay(rootSelector: string | void) {
  // ⚠ SERIALISED INTO THE PAGE by `page.evaluate(readToolBay, root)` —
  // no closures, no imports inside. `root` scopes the read to ONE bay:
  // the landing mounts one (the casefile's tools plate), the portfolio arc
  // mounts four (ADR-072), and the first `.fl-shot__frame` in the document
  // is the wrong one for three of them.
  const root = (rootSelector ? document.querySelector(rootSelector) : document) ?? document;
  const frame = root.querySelector<HTMLElement>(".fl-shot__frame");
  const shot = root.querySelector<HTMLElement>(".fl-shot");
  const bar = root.querySelector<HTMLElement>(".fl-shot__bar");
  if (!frame || !shot) return null;
  const f = frame.getBoundingClientRect();
  const wire = frame.querySelector<HTMLElement>(".fl-wire");
  const img = frame.querySelector<HTMLImageElement>("img");
  const w = wire?.getBoundingClientRect();
  const bearing = wire
    ? [...wire.querySelectorAll("*")].filter((el) =>
        [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim())
      )
    : [];
  return {
    imgs: frame.querySelectorAll("img").length,
    imgFilter: img ? getComputedStyle(img).filter : null,
    // ⚠ THE OTHER HALF, UNCHANGED: no OTHER plate image on this surface may
    // carry a filter. The stills are Loop's ads and the films their
    // commercials — intended colour, left alone (ADR-056 U5).
    otherFiltered: [...document.querySelectorAll<HTMLElement>(".fl-plate img")]
      .filter((im) => !im.classList.contains("fl-shot__img"))
      .map((im) => `${im.className}:${getComputedStyle(im).filter}`)
      .filter((s) => !s.endsWith(":none")),
    hasWire: Boolean(wire),
    wireFilter: wire ? getComputedStyle(wire).filter : null,
    // The bleed law, measured: the drawing reaches all four console walls.
    fill:
      wire && w
        ? Math.max(
            Math.abs(w.top - f.top),
            Math.abs(w.left - f.left),
            Math.abs(w.right - f.right),
            Math.abs(w.bottom - f.bottom)
          )
        : null,
    labels: bearing.map((el) => {
      const cs = getComputedStyle(el);
      return {
        t: (el.textContent ?? "").trim(),
        px: Number.parseFloat(cs.fontSize),
        fam: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
      };
    }),
    collapsed: wire
      ? [...wire.querySelectorAll("*")]
          .filter((el) => {
            const b = el.getBoundingClientRect();
            return b.width < 0.4 || b.height < 0.4;
          })
          .map((el) => String(el.getAttribute("class") ?? el.tagName))
      : [],
    overflowY: frame.scrollHeight - frame.clientHeight,
    overflowX: frame.scrollWidth - frame.clientWidth,
    barCut: bar ? bar.getBoundingClientRect().bottom - shot.getBoundingClientRect().bottom : null,
  };
}

/**
 * Station order = PROJECT_CASES order (the tab-handle pin below guards it).
 * A LITERAL table, not an import — the spec's own precedent: importing the
 * React components to read their labels would drag .tsx into the spec, and
 * a drifted literal fails loudly against the rendered text.
 * `kind` keeps the capture half of the filter law EXECUTABLE while no
 * station exercises it (ADR-068 U3: all four are drawn; a fifth tool
 * without a drawing renders its duotoned capture and flips its row here).
 */
export const WIREFRAME_STATIONS = [
  {
    idx: 0,
    id: "mimir",
    kind: "wire",
    labels: [
      "INPUT",
      "ADS DATA",
      "REVIEWS",
      "REDDIT",
      "BLOGS",
      "GENERATE BRIEFINGS",
      "BRIEFING",
      "AD",
    ],
  },
  {
    idx: 1,
    id: "vesper",
    kind: "wire",
    // The composer's placeholder prompt is content, pinned like babylon's
    // transcript cells — short, digit-free, currency-free. NANO BANANA is
    // the card's model tag, gold TEXT on the ramp's ink step.
    labels: ["PROMPT", "ENHANCE PROMPT", "GENERATE", "Loop Switch, golden hour", "NANO BANANA"],
  },
  {
    idx: 2,
    id: "babylon",
    kind: "wire",
    // The four transcript rows are REAL segments from a Loop UGC job
    // (EN → JA), chosen digit-free and currency-free — every cell is a
    // pinned label here, verbatim.
    labels: [
      "TRANSCRIBE",
      "TRANSLATE",
      "DUB",
      "APPROVE",
      "UPLOAD",
      "ORIGINAL",
      "TRANSLATION",
      "here's what you need to know.",
      "これをチェックしてほしい。",
      "Loop Quiet for focus,",
      "集中にはLoop Quiet",
      "They are reusable",
      "Loopは再利用可能",
      "so you can find your perfect fit.",
      "完璧なフィットを見つけられる",
    ],
  },
  { idx: 3, id: "heimdall", kind: "wire", labels: ["BRIEFINGS", "SYNC", "TEMPLATE"] },
] as const;

/** The assertions a wireframe branch owes, at any viewport. Pass the
 *  station's expected label set to pin it exactly (sorted-array equality —
 *  set equality would hide a duplicated label within one tool). */
export function expectWireframeBay(
  bay: ReturnType<typeof readToolBay>,
  label: string,
  expectedLabels?: readonly string[]
) {
  expect(bay, `${label}: no tool bay`).not.toBeNull();
  expect(bay!.hasWire, `${label}: the tool did not draw its wireframe`).toBe(true);
  // AUTHORED evidence: no capture, and no duotone over our own hand.
  expect(bay!.imgs, `${label}: the wireframe branch mounted an <img>`).toBe(0);
  expect(bay!.wireFilter, `${label}: the wireframe is filtered — it is AUTHORED`).toBe("none");
  expect(
    bay!.otherFiltered,
    `${label}: another plate image is filtered: ${bay!.otherFiltered.join(", ")}`
  ).toEqual([]);
  // ADR-064's bleed law: a bezel the content bleeds into, never a letterbox.
  expect(bay!.fill ?? 99, `${label}: the drawing does not fill the bay`).toBeLessThanOrEqual(1);
  expect(
    bay!.collapsed,
    `${label}: wireframe marks collapsed to zero: ${bay!.collapsed.join(", ")}`
  ).toEqual([]);
  expect(bay!.overflowY, `${label}: the bay clips vertically`).toBeLessThanOrEqual(1);
  expect(bay!.overflowX, `${label}: the bay clips horizontally`).toBeLessThanOrEqual(1);

  // ⚠ FIFTEEN LETTERED ELEMENTS IS THE BUDGET, AND NOT ONE NUMBER AMONG
  // THEM (ADR-068 U6 — babylon letters its four REAL transcript rows, so
  // its 7 chrome labels + 8 cells set the ceiling; the pinned per-tool
  // sets are the real guard, this band is the coarse fence). The tools
  // print USD figures; this page may not (the map's `Never a price.` line
  // and the casefile's confidentiality envelope), so a digit or a
  // currency glyph appearing anywhere in a drawing is the regression —
  // which is also why the transcript lines are CHOSEN digit-free.
  expect(
    bay!.labels.length,
    `${label}: the wireframe letters ${bay!.labels.length} elements, budget is 15`
  ).toBeLessThanOrEqual(15);
  expect(
    bay!.labels.length,
    `${label}: the wireframe lost its micro-labels`
  ).toBeGreaterThanOrEqual(3);
  for (const l of bay!.labels) {
    expect(l.fam, `${label}: "${l.t}" is set in ${l.fam}, not PT Mono`).toBe("PT Mono");
    expect(l.px, `${label}: "${l.t}" renders at ${l.px}px`).toBeGreaterThanOrEqual(8);
    expect(l.t, `${label}: "${l.t}" carries a currency glyph`).not.toMatch(/[$€£]/);
    expect(l.t, `${label}: "${l.t}" carries a figure`).not.toMatch(/\d/);
  }
  if (expectedLabels) {
    expect(bay!.labels.map((l) => l.t).sort(), `${label}: the drawing's label set drifted`).toEqual(
      [...expectedLabels].sort()
    );
  }
}
