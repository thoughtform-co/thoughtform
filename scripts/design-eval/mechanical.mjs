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

/**
 * Sanctioned shadow sites. The shape law bans shadow AS DEPTH; these are the
 * documented exceptions (the ADR-006 focus overlay's layered spec, and its two
 * landing-scope re-declarations on the casefile). Anything else with a shadow
 * that has BLUR is a finding. A zero-blur layer is a hard-edged shape — a ring
 * or a line drawn as a shadow — and is neither depth nor glow (ADR-092).
 */
const SHADOW_ALLOW = [/\.astrogation/, /\[role="dialog"\]/, /\.focus-overlay/, /\.fl-lb\b/, /\.fl-lightbox/, /\.fl-imap-scrim/];

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
  /\.fl-hz::before/,
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
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
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
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length < 6) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
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
  await page.waitForTimeout(2500); // let fonts settle and the first paint land

  report = await page.evaluate(
    ({ scope, exclude, shadowAllow, accentAllow, weightAllow, tokenList, bannedHue, roleRungs, legacyRungs, weightCeiling, trackEps }) => {
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
      };
      const seenColor = new Set();
      const textNodes = [];
      const rungHist = {};

      const describe = (el) => {
        const id = el.id ? `#${el.id}` : "";
        const cls = typeof el.className === "string" && el.className ? `.${el.className.trim().split(/\s+/)[0]}` : "";
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
      const isStateful = (el) =>
        el === document.activeElement ||
        el.matches('[data-on],[data-active],[data-lit],[data-lead],[data-seat],[data-stack-emphasis],[aria-selected="true"],[aria-current]');

      // Gold painted on an edge: mark, allowed, or structure.
      const judgeAccent = (host, cs, pathName, w, h) => {
        const sides = ["Top", "Right", "Bottom", "Left"].filter(
          (s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== "none",
        );
        const goldSides = sides.filter((s) => isGold(cs[`border${s}Color`]));
        const goldOutline = parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== "none" && isGold(cs.outlineColor);
        if (!goldSides.length && !goldOutline) return;
        const where = goldSides.length ? goldSides.join("/") : "outline";
        if (isStateful(host) || accentOk.some((re) => re.test(pathName))) {
          findings.accentMarks.push(`${pathName} ${where}`);
          return;
        }
        const small = Number.isFinite(w) && Number.isFinite(h) && Math.min(w, h) <= 32;
        const oneLongSide = goldSides.length === 1 && Number.isFinite(w) && Number.isFinite(h) && Math.max(w, h) >= 40;
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
        for (const corner of ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"]) {
          const v = parseFloat(cs[corner]);
          if (v > 0.5) {
            findings.radius.push(`${pathName} ${corner}=${cs[corner]}`);
            break;
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
          if (isGold(colour)) findings.textShadow.push(`${pathName} text-shadow=${cs.textShadow.slice(0, 60)}`);
          else if (isVoidish(colour)) findings.textShadowScrim.push(`${pathName} ${cs.textShadow.slice(0, 40)}`);
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
            const onRole = Math.abs(ratio) < trackEps || roleValues.some((r) => Math.abs(ratio - r) < trackEps);
            if (!onRole) {
              const onLegacy = legacyValues.some((r) => Math.abs(ratio - r) < trackEps);
              (onLegacy ? findings.trackingLegacy : findings.tracking).push(`${pathName} letter-spacing=${key}em at ${size}px`);
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
    },
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
];
// `palette` is advisory: computed colours legitimately include composited and
// interpolated values that are not literal token entries. The four buckets
// after it are advisory by design: a legacy rung is live until stage 4, SVG
// lettering is the map's own pass, a void scrim is legibility, and marks are
// counted rather than judged — unless a `--budget` was given.
const ADVISORY = new Set(["palette", "trackingLegacy", "trackingSvg", "textShadowScrim", "accentMarks"]);
let total = 0;
console.log(`\nMECHANICAL — ${url}  scope=${SCOPE}${EXCLUDE ? `  exclude=${EXCLUDE}` : ""}  ${VW}x${VH}  ${THEME}${PRM ? "  prm" : ""}\n`);
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
    `\n  tracking readout: ${hist.length} rung(s) on ${textCount} text nodes; top rung ${topKey}em carries ${Math.round((100 * topCount) / textCount)} %`,
  );
  console.log(`        ${hist.slice(0, 8).map(([k, c]) => `${k}em×${c}`).join("  ")}`);
}

if (pageErrors.length) {
  console.log(`  FAIL  pageerror  ${pageErrors.length}`);
  for (const e of pageErrors.slice(0, 3)) console.log(`        ${e.slice(0, 120)}`);
  total += pageErrors.length;
}

if (JSON_OUT) {
  fs.writeFileSync(
    JSON_OUT,
    JSON.stringify({ url, scope: SCOPE, exclude: EXCLUDE, theme: THEME, prm: PRM, findings: f, rungHist: report.rungHist, pageErrors }, null, 1),
  );
  console.log(`\n  wrote ${JSON_OUT}`);
}

console.log(`\n  ${total === 0 ? "MECHANICAL PASS" : `MECHANICAL FAIL — ${total} violation(s)`}\n`);
await browser.close();
process.exit(total === 0 ? 0 : 1);
