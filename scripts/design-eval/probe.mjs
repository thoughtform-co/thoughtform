/**
 * design-eval/probe — the interface kit's probe (ADR-091), lifted out of
 * `scripts/capture-interface-kit.mjs` so a second capture can run the same
 * measurement (ADR-149: `scripts/capture-lattice.mjs`).
 *
 * ⚠ THIS IS A FUNCTION THAT IS SERIALISED INTO THE PAGE. `page.evaluate(probeFn)`
 * sends its SOURCE across the wire and runs it in the document, so it may
 * close over nothing in this module: every helper it needs is declared inside
 * it, and it takes its one input as an argument. The body is the kit's own,
 * moved verbatim; the one change is the root selector as an optional
 * parameter — the kit passes nothing and gets `.fl-case` exactly as before,
 * the lattice passes its own root. Everything keyed on the casefile's own
 * tokens (`--fl-t0` / `--ik-t0`, `.ik-stationbox`) still runs on another
 * surface and reports what it finds there; a caller that is not the kit
 * records those fields and does not gate on them.
 *
 * The same measurement that produced the finding the interface kit is built
 * on, so every still carries its own numbers into the manifest and the wave
 * log. It is the human's half: `qa.py` never sees these, because a grader
 * handed the answer stops looking.
 */
export function probeFn(rootSel) {
  const sel = rootSel || ".fl-case";
  const root = document.querySelector(sel);
  if (!root) return { err: "no " + sel };
  const isGold = (s) => {
    const m = String(s).match(/rgba?\(([^)]+)\)/);
    if (!m) return false;
    const p = m[1].split(/[,/]/).map((x) => parseFloat(x));
    const [r, g, b] = p;
    const a = p.length > 3 ? p[3] : 1;
    return a >= 0.05 && r > 90 && r - b > 40 && r >= g;
  };
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  const tracks = new Map();
  const fams = new Map();
  let accent = 0,
    bold = 0,
    text = 0,
    minPx = 99,
    radii = 0;
  const struct = new Map();

  for (const el of root.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    const bx = el.getBoundingClientRect();
    if (bx.width < 1 || bx.height < 1) continue;
    if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) === 0)
      continue;

    let isAcc = false;
    for (const s of ["Top", "Right", "Bottom", "Left"])
      if (
        parseFloat(cs["border" + s + "Width"]) > 0 &&
        cs["border" + s + "Style"] !== "none" &&
        isGold(cs["border" + s + "Color"])
      )
        isAcc = true;
    if (isGold(cs.backgroundColor)) isAcc = true;
    if (cs.stroke && cs.stroke !== "none" && isGold(cs.stroke)) isAcc = true;
    if (el.namespaceURI?.includes("svg") && cs.fill !== "none" && isGold(cs.fill)) isAcc = true;

    const hasText = [...el.childNodes].some(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 1
    );
    if (hasText) {
      if (isGold(cs.color)) isAcc = true;
      text++;
      if (+cs.fontWeight > 500) bold++;
      const fam = cs.fontFamily.split(",")[0].replace(/"/g, "");
      bump(fams, fam);
      const ls = cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing);
      bump(tracks, (ls / parseFloat(cs.fontSize)).toFixed(3));
      minPx = Math.min(minPx, parseFloat(cs.fontSize));
    }
    if (isAcc) accent++;
    if (parseFloat(cs.borderTopLeftRadius) > 0.5) radii++;

    const thin = bx.height <= 2.5 || bx.width <= 2.5;
    if (thin && cs.backgroundColor !== "rgba(0, 0, 0, 0)" && bx.width >= 4)
      bump(struct, cs.backgroundColor);
    for (const s of ["Top", "Bottom"])
      if (
        parseFloat(cs["border" + s + "Width"]) > 0 &&
        cs["border" + s + "Style"] !== "none" &&
        bx.width >= 20
      )
        bump(struct, cs["border" + s + "Color"]);
  }

  /* ⚠ `--ik-t0` MIRRORS `--fl-t0`'s FORMULA BY HAND and this is where that is
     checked. A ladder documenting a surface it has drifted from is worse than
     no ladder, and the drift would be one pixel — invisible in every still. */
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;font-size:var(--fl-t0)";
  root.appendChild(probe);
  const flT0 = getComputedStyle(probe).fontSize;
  probe.style.fontSize = "var(--ik-t0)";
  const ikT0 = getComputedStyle(probe).fontSize;
  probe.remove();

  const g = (s) => {
    const e = document.querySelector(s);
    if (!e) return null;
    const b = e.getBoundingClientRect();
    return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)].join(",");
  };

  /* ⚠ THE SEAT IS CHECKED AGAINST THE LAYOUT LAW, NOT AGAINST A SIBLING, AND
     THIS GATE EXISTS BECAUSE THE OTHER ONE FAILED TO CATCH ITS OWN CASE.
     The first cut made `.ik-proof-stage` `position: absolute; inset: 0` — and
     an absolutely positioned child resolves its inset against the containing
     block's PADDING box, which INCLUDES the padding, so the stage spanned the
     whole band and handed `.fl-case` a containing block starting at zero. The
     panel sat 145px too far outboard at 1440x800, laid out correctly, painting
     cleanly. And the KA-versus-control box gate passed, because BOTH stills
     were rendered inside the same wrong box: a parity check between two things
     broken the same way reports parity.
     So this one asks the law instead. `.fl-case` insets itself by
     `--instrument-inset + --fl-hz-pad` from a stage that is already inside
     `--hud-content-inset`; that arithmetic is independent of anything else in
     the lab, and it is what a sibling comparison can never see. */
  const box = document.querySelector(".ik-stationbox");
  let seat = null;
  if (box) {
    const cs = getComputedStyle(box);
    const bx = box.getBoundingClientRect();
    const contentLeft = bx.left + parseFloat(cs.paddingLeft);
    /* ⚠ RESOLVED THROUGH A PROBE ELEMENT, NEVER `parseFloat` ON THE TOKEN.
       `--instrument-inset` is a `calc()` of three clamps, so
       `getPropertyValue` hands back the expression verbatim and `parseFloat`
       returns NaN — which coerces to 0 and makes the gate agree with itself at
       every viewport below the instrument tier and disagree by exactly the
       inset above it. Measured: 48px at 1920x1247, and the gate reported the
       PANEL as broken when the arithmetic was. A custom property is a string
       until something lays it out. */
    const probeEl = document.createElement("i");
    probeEl.style.cssText = "position:absolute;visibility:hidden;height:0";
    root.appendChild(probeEl);
    const px = (expr) => {
      probeEl.style.width = expr;
      return parseFloat(getComputedStyle(probeEl).width) || 0;
    };
    const pad = px("var(--fl-hz-pad, 0px)");
    const inst = px("var(--instrument-inset, 0px)");
    probeEl.remove();
    /* `.fl-case` = the stage's content edge, plus the instrument inset, plus
       the housing pad it holds as MARGIN; `.fl-hz` then negates that pad to
       reach the band's own edge. Both are asserted, because the pad is exactly
       the term an off-by-one here would hide. */
    const wantCase = contentLeft + inst + pad;
    const gotCase = root.getBoundingClientRect().left;
    const hzEl = root.querySelector(".fl-hz");
    const gotHz = hzEl ? hzEl.getBoundingClientRect().left : null;
    seat = {
      want: Math.round(wantCase),
      got: Math.round(gotCase),
      pad,
      off: Math.round(gotCase - wantCase),
      hzOff: gotHz === null ? null : Math.round(gotHz - (contentLeft + inst)),
    };
  }

  const sorted = [...tracks.entries()].sort((a, b) => b[1] - a[1]);
  return {
    accent,
    bold,
    text,
    boldShare: text ? +(bold / text).toFixed(3) : 0,
    rungs: tracks.size,
    topRungShare: text && sorted.length ? +(sorted[0][1] / text).toFixed(3) : 0,
    families: [...fams.keys()],
    minPx: Math.round(minPx * 10) / 10,
    radii,
    structureHues: struct.size,
    t0: { fl: flT0, ik: ikT0, match: flT0 === ikT0 },
    seat,
    boxes: {
      brief: g(".fl-brief"),
      reg: g(".fl-proof-register"),
      dir: g(".fl-dir"),
      viz: g(".fl-panel__viz"),
    },
  };
}
