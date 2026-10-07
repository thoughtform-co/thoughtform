#!/usr/bin/env node
/**
 * design-eval/mechanical — stage 1 of the design gate.
 *
 * Computed-style assertions that need no judgment: radius, families, shadows,
 * palette, gradients, contrast — and, since ADR-092, weight, tracking, case,
 * text-shadow and the accent ledger. Everything here is checkable by a machine
 * and therefore should never cost a vision-model call.
 *
 * ⚠ A MECHANICAL FAILURE SHORT-CIRCUITS THE RUN. Do not spend a judge on a page
 * that fails `grep` — and more importantly, do not let a judge's 8/10 launder a
 * page with rounded corners on it.
 *
 *   node scripts/design-eval/mechanical.mjs --url /test/services-card-face-lab
 *   node scripts/design-eval/mechanical.mjs --url / --theme light --scope ".fl-case"
 *   node scripts/design-eval/mechanical.mjs --url / --scope ".fl-case" --exclude ".fl-pda" --prm
 *
 * Flags
 *   --url <path>        default /
 *   --theme dark|light  default dark (light appends ?theme=light)
 *   --scope <sel>       the subtree to measure, default body
 *   --exclude <sel>     a subtree inside the scope to leave out (e.g. the map SVG,
 *                       whose lettering is its own pass)
 *   --vp WxH            default 1440x900
 *   --prm               emulate prefers-reduced-motion: reduce. ⚠ The casefile's
 *                       ≤960/PRM restore block has no other guard.
 *   --budget <n>        accent MARKS allowed in the scope; absent = report only
 *   --json <file>       write the report
 *   --ready <selector>  wait for this selector instead of the fixed 2500ms (a page
 *                       that stamps its own readiness — the lattice lab's
 *                       `.lat-read[data-stamp^="page|"]`, ADR-149); 300ms settle after
 *   --lattice           make the three lattice checks (spacing, typeLadder, chamfer)
 *                       HARD gates; without it they are advisory and only reported
 *   --headed
 *
 * Exit 0 = clean, 1 = violations, 2 = could not run.
 *
 * Rubric: .claude/skills/thoughtform-design/eval/rubric.md (the one source).
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const has = (f) => args.includes(f);

const PORT = argOf("--port", "3003");
const URL_PATH = argOf("--url", "/");
const THEME = argOf("--theme", "dark");
const SCOPE = argOf("--scope", "body");
const EXCLUDE = argOf("--exclude", "");
const PRM = has("--prm");
const BUDGET = argOf("--budget", "") === "" ? null : Number(argOf("--budget", ""));
const [VW, VH] = argOf("--vp", "1440x900").split("x").map(Number);
const JSON_OUT = argOf("--json", "");
const READY = argOf("--ready", "");
const LATTICE = has("--lattice");

/**
 * The lattice's three advisory checks (ADR-149), hard under `--lattice`. Each
 * compares a computed value against a token RESOLVED THROUGH A PROBE ELEMENT
 * in the page — a custom property is a string until something lays it out —
 * and a token that does not resolve (a route without lattice.css) is simply
 * not on the ladder, so the check reports against the scale alone.
 */
const LATTICE_CHECKS = new Set(["spacing", "typeLadder", "chamfer"]);
const LATTICE_SPACING_TOKENS = [
  "--lat-pad-chrome",
  "--lat-pad-cell",
  "--lat-gap-stack",
  "--lat-gap-block",
  "--lat-sec-pad",
  "--lat-head-gap",
  "--lat-air",
];
const LATTICE_TYPE_TOKENS = [
  "--lat-chrome-sm",
  "--lat-chrome-md",
  "--lat-chrome-lg",
  "--lat-copy",
  "--lat-lede",
  "--lat-h3",
  "--lat-h2",
  "--lat-title",
  "--lat-display",
];
const LATTICE_CHAMFER_TOKENS = [
  "--lat-ch-chrome",
  "--lat-ch-seed",
  "--lat-ch-card",
  "--lat-ch-plate",
  "--lat-ch-plate-fluid",
];

/**
 * Sanctioned shadow sites. The shape law bans shadow AS DEPTH; these are the
 * documented exceptions (the ADR-006 focus overlay's layered spec, and its two
 * landing-scope re-declarations on the casefile). Anything else with a shadow
 * that has BLUR is a finding. A zero-blur layer is a hard-edged shape — a ring
 * or a line drawn as a shadow — and is neither depth nor glow (ADR-092).
 */
const SHADOW_ALLOW = [
  /\.astrogation/,
  /\[role="dialog"\]/,
  /\.focus-overlay/,
  /\.fl-lb\b/,
  /\.fl-lightbox/,
  /\.fl-imap-scrim/,
];

/**
 * Accent painted on STRUCTURE is the finding ADR-091 measured (gold on 200
 * objects, most of them outlines). These are the named exceptions where a gold
 * line IS the object's identity rather than its structure: the housing's lip,
 * the phone seat's chamfer corners, the dossier's three gold objects, the
 * hologram's emitter, and the CTA classes (one per composition — the second CTA
 * in a composition is structure, and R1 in the plan says so; this list cannot
 * count compositions, so the budget does).
 */
const ACCENT_ALLOW = [
  // The lattice lab's CTA (ADR-149): the sheet's own outlined control, one
  // object per section, the composition's one lit thing.
  /\.lat-cta/,
  /\.fl-hz::before/,
  // The proof card's lip (ADR-097) — the housing's own device one object over.
  // ⚠ DECLARATIVE: this stage judges `border*Color` and `outline` and never a
  // pseudo's `backgroundImage`, and `parse()` skips `color-mix()`'s computed
  // `color(srgb …)`, so a clipped ring is invisible to it either way. The entry
  // records the ruling; the smoke's ring read is what measures the lip.
  /\.pf-card::before/,
  /\.fl-mobile-[a-z-]*::(before|after)/,
  /\.arc-dossier__now/,
  /\.arc-dossier__route-arrow/,
  /\.vwh__base__/,
  /\.vwh__edge/,
  /\.btn--solid/,
  /__cta\b/,
  /\.hero__cta__btn--primary/,
  /\.home-v2-signal-cta/,
  /\.home-v2-copy-cta/,
  /\.svc-plate__cta/,
  // The sheet (ADR-114): the one lit timeline node, the picked station and
  // the outlined CTA are the three places gold is SPENT on a subpage, each
  // once per still, inside the twelve-object budget the rubric counts.
  /\.sh-tl__item\.is-lit/,
  // The lit node's BOX carries the gold outline (only `.is-lit .sh-tl__box`
  // is gold in sheet.css; the rule is keyed on the parent, the paint lands on
  // the child, and this stage reads the child's own selector).
  /\.sh-tl__box/,
  /\.sh-stn\.is-on/,
  /\.sh-cta\b/,
  // The generative figure's one seated diamond: a rotated square drawn as a
  // gold border on the mark's ::after. It is the MARK the frame exists to
  // hold (one per figure, ADR-114 §2 `figure`), not a structural line.
  /\.sh-fig__mark::after/,
  // The arcs instrument (ADR-118): gold is STATE there and nothing else — the
  // one lit mark, the NOW cursor (a 1px dotted drop the height of the plot,
  // which the one-long-side rule would read as a structural rule), the one
  // filled row and the dossier's lip (declarative, like the proof card's: a
  // clipped ring is a pseudo's background this stage does not read). Each is
  // one per still, inside the rubric's twelve.
  /\.sh-mon__mark\.is-lit/,
  /\.sh-mon__now/,
  // The filled block (ADR-118 U2): its gold is the PLATE's background and its
  // ring's, so it is declared by the plate's own first class — the entry
  // `.sh-log__row.is-on` could never match a name this stage builds.
  /\.sh-log__plate/,
  /\.sh-dos__in::before/,
];

/**
 * Text allowed above weight 500. Empty since ADR-092 stage 1 landed the map's
 * own pass (the SVG's `fontWeight={700}` presentation attributes are gone); it
 * stays as a list so a sanctioned exception has a place to be named rather
 * than a reason to loosen the rule.
 */
const WEIGHT_ALLOW = [];

/** Purple/blue hue band — the standing anti-pattern, as degrees on the wheel. */
const BANNED_HUE = [230, 300];

/** Tracking tolerance: computed letter-spacing / font-size, em, ±. 0.004em at
 *  13px is 0.05px — sub-pixel, so this is a rounding allowance, not a rung. */
const TRACK_EPS = 0.004;

// ── colour helpers ───────────────────────────────────────────────────────────

function parseRgb(s) {
  const m = String(s).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[,/]/).map((x) => parseFloat(x.trim()));
  if (p.length < 3 || p.some((n) => Number.isNaN(n))) return null;
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
}

// ⚠ Hue, saturation, isGold and the shadow-layer split are computed INSIDE
// page.evaluate, not here. A function passed to evaluate is serialised and
// cannot close over this scope, so the page-side code inlines its own copies —
// keep them in step if a band, a floor or the gold predicate ever moves.

const srgb = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = ({ r, g, b }) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);

/** Composite fg over bg at fg's own alpha — see the rubric: an alpha is not a colour. */
function composite(fg, bg) {
  const a = fg.a ?? 1;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

function contrast(fg, bg) {
  const l1 = lum(fg);
  const l2 = lum(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// ── token set, parsed from the live CSS (same source design_tokens serves) ───

function liveTokenColors() {
  const css = fs.readFileSync(path.resolve(process.cwd(), "app/styles/variables.css"), "utf8");
  const out = new Set();
  for (const m of css.matchAll(/--[a-z0-9-]+\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))\s*;/g)) {
    const rgb = m[1].startsWith("#") ? hexToRgb(m[1]) : parseRgb(m[1]);
    if (rgb) out.add(`${Math.round(rgb.r)},${Math.round(rgb.g)},${Math.round(rgb.b)}`);
  }
  return out;
}

/**
 * The four ROLE tracking rungs (ADR-092), read off variables.css so the gate
 * enforces the value the browser paints and nothing else. The legacy magnitude
 * names (`--track-wide` …) are returned separately: a match on one of those is
 * a NOTE — live today, gone at stage 4 — never a pass.
 */
function liveTypeTokens() {
  const css = fs.readFileSync(path.resolve(process.cwd(), "app/styles/variables.css"), "utf8");
  const role = {};
  const legacy = {};
  for (const m of css.matchAll(/--track-([a-z]+)\s*:\s*(-?[0-9.]+)(em)?\s*;/g)) {
    const v = parseFloat(m[2]);
    if (["copy", "display", "label", "eyebrow"].includes(m[1])) role[m[1]] = v;
    else legacy[m[1]] = v;
  }
  const lit = css.match(/--weight-lit\s*:\s*(\d{3})\s*;/);
  return { role, legacy, weightCeiling: lit ? Number(lit[1]) : 500 };
}

function hexToRgb(hex) {
  let h = hex.slice(1);
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  if (h.length < 6) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: 1,
  };
}

// ── run ──────────────────────────────────────────────────────────────────────

const tokens = liveTokenColors();
const type = liveTypeTokens();
const browser = await chromium.launch({ headless: !has("--headed") });
const ctx = await browser.newContext({
  viewport: { width: VW, height: VH },
  reducedMotion: PRM ? "reduce" : "no-preference",
  colorScheme: THEME === "light" ? "light" : "dark",
});
const page = await ctx.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));

const url = `http://localhost:${PORT}${URL_PATH}${THEME === "light" ? (URL_PATH.includes("?") ? "&" : "?") + "theme=light" : ""}`;

let report;
try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  if (READY) {
    // A readiness the PAGE computed (ADR-149): the fixed wait is a bet on a
    // paint that may not have landed; a stamp is the page saying it has.
    await page.waitForSelector(READY, { timeout: 60000 });
    await page.waitForTimeout(300);
  } else {
    await page.waitForTimeout(2500); // let fonts settle and the first paint land
  }

  report = await page.evaluate(
    ({
      scope,
      exclude,
      shadowAllow,
      accentAllow,
      weightAllow,
      tokenList,
      bannedHue,
      roleRungs,
      legacyRungs,
      weightCeiling,
      trackEps,
      spacingTokens,
      typeTokens,
      chamferTokens,
    }) => {
      const root = document.querySelector(scope);
      if (!root) return { error: `scope "${scope}" not found` };
      const els = [root, ...root.querySelectorAll("*")];
      const excluded = new Set();
      if (exclude) {
        for (const e of root.querySelectorAll(exclude)) {
          excluded.add(e);
          for (const d of e.querySelectorAll("*")) excluded.add(d);
        }
      }
      const tokenSet = new Set(tokenList);
      const allow = shadowAllow.map((s) => new RegExp(s));
      const accentOk = accentAllow.map((s) => new RegExp(s));
      const weightOk = weightAllow.map((s) => new RegExp(s));
      const roleValues = Object.values(roleRungs);
      const legacyValues = Object.values(legacyRungs);

      const findings = {
        radius: [],
        fonts: [],
        shadow: [],
        gradient: [],
        weight: [],
        tracking: [],
        case: [],
        textShadow: [],
        accent: [],
        palette: [],
        // advisory buckets
        trackingSvg: [],
        trackingLegacy: [],
        textShadowScrim: [],
        accentMarks: [],
        // the lattice's three (ADR-149), advisory unless --lattice
        spacing: [],
        typeLadder: [],
        chamfer: [],
      };

      /* ── The lattice's ladders, resolved ONCE through a probe ──────────
         `width: var(--x)` on an absolutely positioned empty element lays the
         token out as a length; an unresolved token leaves width at 0, which
         is read as "not on this page" rather than as a rung of 0 — except
         `--lat-ch-chrome`, whose 0 is the law (a chrome object is square)
         and which the chamfer check never needs, since a square corner has
         no cut to compare. */
      const resolveTokens = (names) => {
        const probeEl = document.createElement("i");
        probeEl.style.cssText = "position:absolute;visibility:hidden;height:0;padding:0;border:0";
        root.appendChild(probeEl);
        const out = [];
        for (const name of names) {
          probeEl.style.width = `var(${name})`;
          const w = parseFloat(getComputedStyle(probeEl).width);
          if (Number.isFinite(w) && w > 0) out.push(w);
        }
        probeEl.remove();
        return out;
      };
      const spacingLadder = resolveTokens(spacingTokens);
      const typeLadder = resolveTokens(typeTokens);
      const chamferLadder = resolveTokens(chamferTokens);
      const near = (v, ladder, eps) => ladder.some((l) => Math.abs(v - l) <= eps);
      const onScale = (v) => {
        const a = Math.abs(v);
        if (a === 0 || a === 1 || a === 2) return true;
        const m = a % 8;
        return m < 0.5 || 8 - m < 0.5;
      };
      /* The cut a polygon makes at its top-right: the gap between the box's
         right edge and the second point's x. Computed values keep the
         percentage (`calc(100% - 26px)`), so the px terms are summed from
         the calc; a plain px value is subtracted from the box's width. A
         second point at 100% is a square corner and is not a cut. */
      const trCutOf = (clip, width) => {
        const m = String(clip).match(/^polygon\((?:evenodd\s*,\s*|nonzero\s*,\s*)?(.*)\)$/s);
        if (!m) return null;
        // Split on top-level commas only: a `calc()` carries its own.
        const pts = [];
        let depth = 0;
        let cur = "";
        for (const ch of m[1]) {
          if (ch === "(") depth++;
          if (ch === ")") depth--;
          if (ch === "," && depth === 0) {
            pts.push(cur.trim());
            cur = "";
          } else cur += ch;
        }
        if (cur.trim()) pts.push(cur.trim());
        if (pts.length < 2) return null;
        // The point is "<x> <y>"; the y is the last whitespace-separated term
        // (a plain length or percentage — a calc() y never appears second).
        const x2 = pts[1].replace(/\s+(?:-?[\d.]+(?:px|%)|calc\([^)]*\))$/, "").trim();
        if (x2 === "100%") return null;
        if (/^calc\(100%/.test(x2)) {
          let cut = 0;
          for (const t of x2.matchAll(/-\s*([\d.]+)px/g)) cut += parseFloat(t[1]);
          return cut;
        }
        const px = x2.match(/^([\d.]+)px$/);
        if (px && Number.isFinite(width)) return width - parseFloat(px[1]);
        return null;
      };
      const seenColor = new Set();
      const textNodes = [];
      const rungHist = {};

      const describe = (el) => {
        const id = el.id ? `#${el.id}` : "";
        const cls =
          typeof el.className === "string" && el.className
            ? `.${el.className.trim().split(/\s+/)[0]}`
            : "";
        return `${el.tagName.toLowerCase()}${id}${cls}`;
      };

      const parse = (s) => {
        const m = String(s).match(/rgba?\(([^)]+)\)/);
        if (!m) return null;
        const p = m[1].split(/[,/]/).map((x) => parseFloat(x.trim()));
        if (p.length < 3 || p.some((n) => Number.isNaN(n))) return null;
        return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
      };
      // The accent predicate, lifted from scripts/capture-interface-kit.mjs —
      // the one copy that carries the α ≥ .05 floor. Dark gold (#caa554) and
      // light gold-line (138,107,32) both pass; dawn, void and green do not.
      const isGold = (c) => {
        const p = parse(c);
        return !!p && p.a >= 0.05 && p.r > 90 && p.r - p.b > 40 && p.r >= p.g;
      };
      const isVoidish = (c) => {
        const p = parse(c);
        return !!p && p.a >= 0.05 && p.r < 40 && p.g < 40 && p.b < 40;
      };
      // Split a computed shadow list on commas that are not inside a colour.
      const layers = (s) => {
        const out = [];
        let depth = 0;
        let cur = "";
        for (const ch of s) {
          if (ch === "(") depth++;
          if (ch === ")") depth--;
          if (ch === "," && depth === 0) {
            out.push(cur.trim());
            cur = "";
          } else cur += ch;
        }
        if (cur.trim()) out.push(cur.trim());
        return out;
      };
      // Computed layer shape: "rgba(…) x y blur spread [inset]". Blur is the
      // third length. A zero-blur layer is a hard edge — a ring or a rule drawn
      // as a shadow — never depth and never glow.
      const blurOf = (layer) => {
        const nums = layer.replace(/rgba?\([^)]*\)/, "").match(/-?[\d.]+px/g) || [];
        return nums.length >= 3 ? parseFloat(nums[2]) : 0;
      };
      /* ⚠ A PRESSED TOGGLE IS STATE, like a current or a selected one. The
         sheet's picked station (`aria-pressed="true"`) passed this stage only by
         being under 32px: its ACCENT_ALLOW entry `.sh-stn.is-on` never matched,
         because `describe()` names an element by its FIRST class. When ADR-118
         U1 stretched the log's stations to the 36px head strip at 1920, the
         dead entry surfaced as a violation on a control the rubric itself
         names as state. */
      const isStateful = (el) =>
        el === document.activeElement ||
        el.matches(
          '[data-on],[data-active],[data-lit],[data-lead],[data-seat],[data-stack-emphasis],[aria-selected="true"],[aria-pressed="true"],[aria-current]'
        );

      // Gold painted on an edge: mark, allowed, or structure.
      const judgeAccent = (host, cs, pathName, w, h) => {
        const sides = ["Top", "Right", "Bottom", "Left"].filter(
          (s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== "none"
        );
        const goldSides = sides.filter((s) => isGold(cs[`border${s}Color`]));
        const goldOutline =
          parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== "none" && isGold(cs.outlineColor);
        if (!goldSides.length && !goldOutline) return;
        const where = goldSides.length ? goldSides.join("/") : "outline";
        if (isStateful(host) || accentOk.some((re) => re.test(pathName))) {
          findings.accentMarks.push(`${pathName} ${where}`);
          return;
        }
        const small = Number.isFinite(w) && Number.isFinite(h) && Math.min(w, h) <= 32;
        const oneLongSide =
          goldSides.length === 1 &&
          Number.isFinite(w) &&
          Number.isFinite(h) &&
          Math.max(w, h) >= 40;
        if (!small || oneLongSide) {
          findings.accent.push(`${pathName} gold ${where} ${Math.round(w)}x${Math.round(h)}`);
        } else {
          findings.accentMarks.push(`${pathName} ${where}`);
        }
      };

      for (const el of els) {
        if (excluded.has(el)) continue;
        const cs = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) continue; // invisible: not rendered law
        if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") continue;
        const pathName = describe(el);
        const isSvgText = el.namespaceURI === "http://www.w3.org/2000/svg";

        // radius
        for (const corner of [
          "borderTopLeftRadius",
          "borderTopRightRadius",
          "borderBottomLeftRadius",
          "borderBottomRightRadius",
        ]) {
          const v = parseFloat(cs[corner]);
          if (v > 0.5) {
            findings.radius.push(`${pathName} ${corner}=${cs[corner]}`);
            break;
          }
        }

        // spacing — every padding, margin and gap on the scale or on a role
        // token (ADR-149; advisory unless --lattice)
        for (const prop of [
          "paddingTop",
          "paddingRight",
          "paddingBottom",
          "paddingLeft",
          "marginTop",
          "marginRight",
          "marginBottom",
          "marginLeft",
          "rowGap",
          "columnGap",
        ]) {
          const v = parseFloat(cs[prop]);
          if (!Number.isFinite(v) || onScale(v) || near(Math.abs(v), spacingLadder, 0.5)) continue;
          findings.spacing.push(`${pathName} ${prop}=${Math.round(v * 100) / 100}px`);
        }

        // chamfer — a polygon clip's top-right cut sits on the ladder
        if (cs.clipPath && cs.clipPath.startsWith("polygon(") && chamferLadder.length) {
          const cut = trCutOf(cs.clipPath, box.width);
          if (cut !== null && cut > 0.5 && !near(cut, chamferLadder, 0.5)) {
            findings.chamfer.push(`${pathName} cut=${Math.round(cut * 100) / 100}px`);
          }
        }

        // font family — the FIRST declared face is what renders
        const fam = (cs.fontFamily || "").split(",")[0].replace(/["']/g, "").trim();
        if (fam && el.textContent && el.textContent.trim()) {
          if (!/PT Mono|PP Neue Montreal|monospace/i.test(fam)) {
            findings.fonts.push(`${pathName} font-family=${fam}`);
          }
        }

        // shadow — depth or glow needs blur; a zero-blur layer is a line
        if (cs.boxShadow && cs.boxShadow !== "none") {
          const soft = layers(cs.boxShadow).filter((l) => blurOf(l) > 0);
          if (soft.length && !allow.some((re) => re.test(pathName))) {
            findings.shadow.push(`${pathName} box-shadow=${soft[0].slice(0, 60)}`);
          }
        }

        // text-shadow — gold is a glow and fails; a void-family shadow over
        // imagery is a legibility scrim and is noted
        if (cs.textShadow && cs.textShadow !== "none") {
          const colour = (cs.textShadow.match(/rgba?\([^)]+\)/) || [""])[0];
          if (isGold(colour))
            findings.textShadow.push(`${pathName} text-shadow=${cs.textShadow.slice(0, 60)}`);
          else if (isVoidish(colour))
            findings.textShadowScrim.push(`${pathName} ${cs.textShadow.slice(0, 40)}`);
          else findings.textShadow.push(`${pathName} text-shadow=${cs.textShadow.slice(0, 60)}`);
        }

        // gradient hue band
        const bg = cs.backgroundImage || "";
        if (bg.includes("gradient")) {
          for (const m of bg.matchAll(/rgba?\(([^)]+)\)/g)) {
            const p = m[1].split(/[,/]/).map((x) => parseFloat(x));
            const [r, g, b] = p;
            const max = Math.max(r, g, b),
              min = Math.min(r, g, b);
            if (max === min) continue;
            const d = max - min;
            let hh = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
            hh = Math.round(hh * 60);
            if (hh < 0) hh += 360;
            const l = (max + min) / 2 / 255;
            const s = l > 0.5 ? (max - min) / (510 - max - min) : (max - min) / (max + min);
            if (hh >= bannedHue[0] && hh <= bannedHue[1] && s > 0.15) {
              findings.gradient.push(`${pathName} gradient hue ${hh}deg`);
              break;
            }
          }
        }

        // palette — colours not in the token set
        for (const prop of ["color", "backgroundColor", "borderTopColor"]) {
          const raw = cs[prop];
          if (!raw || raw === "rgba(0, 0, 0, 0)" || raw === "transparent") continue;
          const m = raw.match(/rgba?\(([^)]+)\)/);
          if (!m) continue;
          const p = m[1].split(/[,/]/).map((x) => parseFloat(x.trim()));
          const key = `${Math.round(p[0])},${Math.round(p[1])},${Math.round(p[2])}`;
          if (!tokenSet.has(key) && !seenColor.has(key + prop)) {
            seenColor.add(key + prop);
            findings.palette.push(`${pathName} ${prop}=rgb(${key})`);
          }
        }

        // accent on the element's own edges, and on its two pseudo-elements
        judgeAccent(el, cs, pathName, box.width, box.height);
        for (const pseudo of ["::before", "::after"]) {
          const ps = getComputedStyle(el, pseudo);
          if (!ps.content || ps.content === "none" || ps.content === "normal") continue;
          if (ps.display === "none") continue;
          // A pseudo has no rect of its own; its computed width/height serve
          // when definite, and an indefinite one is treated as large.
          judgeAccent(el, ps, `${pathName}${pseudo}`, parseFloat(ps.width), parseFloat(ps.height));
        }
        if (isGold(cs.backgroundColor)) findings.accentMarks.push(`${pathName} fill`);

        // collect text for the contrast, weight, tracking and case passes
        const direct = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (direct) {
          const size = parseFloat(cs.fontSize);
          const weight = parseFloat(cs.fontWeight);
          if (isGold(cs.color)) findings.accentMarks.push(`${pathName} text`);

          // type ladder — every size a rung of the lattice's scale (ADR-149;
          // advisory unless --lattice; silent on a page without the tokens)
          if (typeLadder.length && !near(size, typeLadder, 0.5)) {
            findings.typeLadder.push(`${pathName} font-size=${Math.round(size * 100) / 100}px`);
          }

          // weight — the ceiling
          if (weight > weightCeiling && !weightOk.some((re) => re.test(pathName))) {
            findings.weight.push(`${pathName} font-weight=${cs.fontWeight} at ${size}px`);
          }

          // tracking — one of the four role rungs, or 0
          const ls = cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing) || 0;
          const ratio = size ? ls / size : 0;
          const key = ratio.toFixed(3);
          if (isSvgText) {
            findings.trackingSvg.push(`${pathName} ${key}em`);
          } else {
            rungHist[key] = (rungHist[key] || 0) + 1;
            const onRole =
              Math.abs(ratio) < trackEps || roleValues.some((r) => Math.abs(ratio - r) < trackEps);
            if (!onRole) {
              const onLegacy = legacyValues.some((r) => Math.abs(ratio - r) < trackEps);
              (onLegacy ? findings.trackingLegacy : findings.tracking).push(
                `${pathName} letter-spacing=${key}em at ${size}px`
              );
            }
          }

          // case — the sans does not shout
          if (cs.textTransform === "uppercase" && /PP Neue Montreal/i.test(fam)) {
            findings.case.push(`${pathName} uppercase sans at ${size}px`);
          }

          textNodes.push({
            path: pathName,
            color: cs.color,
            size,
            weight: cs.fontWeight,
            bg: (() => {
              // walk up for the first non-transparent background
              let p = el;
              while (p && p !== document.documentElement) {
                const c = getComputedStyle(p).backgroundColor;
                const mm = c.match(/rgba?\(([^)]+)\)/);
                if (mm) {
                  const q = mm[1].split(/[,/]/).map((x) => parseFloat(x.trim()));
                  if ((q[3] ?? 1) >= 0.85) return c;
                }
                p = p.parentElement;
              }
              return getComputedStyle(document.body).backgroundColor;
            })(),
          });
        }
      }
      return { findings, textNodes, rungHist };
    },
    {
      scope: SCOPE,
      exclude: EXCLUDE,
      shadowAllow: SHADOW_ALLOW.map((r) => r.source),
      accentAllow: ACCENT_ALLOW.map((r) => r.source),
      weightAllow: WEIGHT_ALLOW.map((r) => r.source),
      tokenList: [...tokens],
      bannedHue: BANNED_HUE,
      roleRungs: type.role,
      legacyRungs: type.legacy,
      weightCeiling: type.weightCeiling,
      trackEps: TRACK_EPS,
      spacingTokens: LATTICE_SPACING_TOKENS,
      typeTokens: LATTICE_TYPE_TOKENS,
      chamferTokens: LATTICE_CHAMFER_TOKENS,
    }
  );
} catch (err) {
  console.error(`could not run: ${err.message}`);
  await browser.close();
  process.exit(2);
}

if (report.error) {
  console.error(report.error);
  await browser.close();
  process.exit(2);
}

// Contrast, computed here (node) rather than in the page: compositing is the
// step everyone skips, and it is easier to get right with the helpers above.
// ⚠ The "large text" relaxation is WCAG's: ≥ 24px, or ≥ 18.66px AND bold. Under
// the 500 ceiling nothing is bold, so 18.66–24px text now needs 4.5:1 — expect
// findings on text that used to pass as bold.
const contrastFindings = [];
for (const t of report.textNodes) {
  const fg = parseRgb(t.color);
  const bg = parseRgb(t.bg);
  if (!fg || !bg) continue;
  const ratio = contrast(composite(fg, { ...bg, a: 1 }), { ...bg, a: 1 });
  const large = t.size >= 24 || (t.size >= 18.66 && Number(t.weight) >= 700);
  const floor = large ? 3 : 4.5;
  if (ratio < floor) {
    contrastFindings.push(`${t.path} ${ratio.toFixed(2)}:1 at ${t.size}px (needs ${floor})`);
  }
}

const f = report.findings;
f.contrast = contrastFindings;

// The accent budget: marks are advisory unless a budget was given.
const overBudget = BUDGET !== null && f.accentMarks.length > BUDGET;

const order = [
  "radius",
  "fonts",
  "shadow",
  "gradient",
  "weight",
  "tracking",
  "case",
  "textShadow",
  "accent",
  "contrast",
  "palette",
  "trackingLegacy",
  "trackingSvg",
  "textShadowScrim",
  "accentMarks",
  "spacing",
  "typeLadder",
  "chamfer",
];
// `palette` is advisory: computed colours legitimately include composited and
// interpolated values that are not literal token entries. The four buckets
// after it are advisory by design: a legacy rung is live until stage 4, SVG
// lettering is the map's own pass, a void scrim is legibility, and marks are
// counted rather than judged — unless a `--budget` was given.
const ADVISORY = new Set([
  "palette",
  "trackingLegacy",
  "trackingSvg",
  "textShadowScrim",
  "accentMarks",
  // the lattice's three are advisory by default and HARD under --lattice
  ...(LATTICE ? [] : [...LATTICE_CHECKS]),
]);
let total = 0;
console.log(
  `\nMECHANICAL — ${url}  scope=${SCOPE}${EXCLUDE ? `  exclude=${EXCLUDE}` : ""}  ${VW}x${VH}  ${THEME}${PRM ? "  prm" : ""}${LATTICE ? "  lattice" : ""}\n`
);
for (const k of order) {
  const list = f[k] ?? [];
  const advisory = ADVISORY.has(k) && !(k === "accentMarks" && overBudget);
  const mark = list.length === 0 ? "PASS" : advisory ? "NOTE" : "FAIL";
  const label = k === "accentMarks" && BUDGET !== null ? `${k} (budget ${BUDGET})` : k;
  console.log(`  ${mark.padEnd(5)} ${label.padEnd(15)} ${list.length}`);
  for (const item of list.slice(0, 6)) console.log(`        ${item}`);
  if (list.length > 6) console.log(`        … and ${list.length - 6} more`);
  if (!advisory) total += k === "accentMarks" ? list.length - BUDGET : list.length;
}

// The tracking readout — ADR-091's two numbers, standing: how many rungs the
// HTML text sits on, and what share the largest carries. The references ran
// 50–98 % on one rung; the panel measured 20 %.
const hist = Object.entries(report.rungHist).sort((a, b) => b[1] - a[1]);
const textCount = hist.reduce((n, [, c]) => n + c, 0);
if (textCount) {
  const [topKey, topCount] = hist[0];
  console.log(
    `\n  tracking readout: ${hist.length} rung(s) on ${textCount} text nodes; top rung ${topKey}em carries ${Math.round((100 * topCount) / textCount)} %`
  );
  console.log(
    `        ${hist
      .slice(0, 8)
      .map(([k, c]) => `${k}em×${c}`)
      .join("  ")}`
  );
}

if (pageErrors.length) {
  console.log(`  FAIL  pageerror  ${pageErrors.length}`);
  for (const e of pageErrors.slice(0, 3)) console.log(`        ${e.slice(0, 120)}`);
  total += pageErrors.length;
}

if (JSON_OUT) {
  fs.writeFileSync(
    JSON_OUT,
    JSON.stringify(
      {
        url,
        scope: SCOPE,
        exclude: EXCLUDE,
        theme: THEME,
        prm: PRM,
        findings: f,
        rungHist: report.rungHist,
        pageErrors,
      },
      null,
      1
    )
  );
  console.log(`\n  wrote ${JSON_OUT}`);
}

// ⚠ A SCOPE WITH NO TEXT IN IT IS A FAILED RUN, NOT A CLEAN SURFACE. This gate
// does not scroll, and on the landing the casefile is `visibility: hidden` until
// the services dwell publishes `data-proof-live` — so a desktop, non-PRM run
// against `.fl-case` measured NOTHING and printed PASS on every stage. Found
// 2026-09-06, after the owner caught two wrong lines on a panel this had just
// called clean. The honest reading paths are `--prm` and any width <= 960,
// where the casefile is static flow content; for the scrolled state use
// `scripts/capture-casefile-rows.mjs`, which drives real scrolls.
if (report.textNodes.length === 0) {
  console.log(
    `\n  MECHANICAL VOID — scope "${SCOPE}" yielded no text.\n` +
      "  Nothing was measured, so nothing above is a result. On the landing the\n" +
      "  casefile only paints inside the services dwell: re-run with --prm, or at\n" +
      "  a width <= 960, or use capture-casefile-rows.mjs for the scrolled state.\n"
  );
  process.exit(2);
}

console.log(`\n  ${total === 0 ? "MECHANICAL PASS" : `MECHANICAL FAIL — ${total} violation(s)`}\n`);
await browser.close();
process.exit(total === 0 ? 0 : 1);
