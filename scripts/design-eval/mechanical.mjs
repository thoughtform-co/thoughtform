#!/usr/bin/env node
/**
 * design-eval/mechanical — stage 1 of the design gate.
 *
 * Computed-style assertions that need no judgment: radius, families, shadows,
 * palette, gradients, contrast. Everything here is checkable by a machine and
 * therefore should never cost a vision-model call.
 *
 * ⚠ A MECHANICAL FAILURE SHORT-CIRCUITS THE RUN. Do not spend a judge on a page
 * that fails `grep` — and more importantly, do not let a judge's 8/10 launder a
 * page with rounded corners on it.
 *
 *   node scripts/design-eval/mechanical.mjs --url /test/services-card-face-lab
 *   node scripts/design-eval/mechanical.mjs --url / --theme light --scope ".fl-case"
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
const [VW, VH] = argOf("--vp", "1440x900").split("x").map(Number);
const JSON_OUT = argOf("--json", "");

/**
 * Sanctioned shadow sites. The shape law bans shadow AS DEPTH; these are the
 * documented exceptions (the ADR-006 focus overlay's layered spec). Anything
 * else with a shadow is a finding.
 */
const SHADOW_ALLOW = [/\.astrogation/, /\[role="dialog"\]/, /\.focus-overlay/];

/** Purple/blue hue band — the standing anti-pattern, as degrees on the wheel. */
const BANNED_HUE = [230, 300];

// ── colour helpers ───────────────────────────────────────────────────────────

function parseRgb(s) {
  const m = String(s).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(/[,/]/).map((x) => parseFloat(x.trim()));
  if (p.length < 3 || p.some((n) => Number.isNaN(n))) return null;
  return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
}

// ⚠ Hue and saturation are computed INSIDE page.evaluate, not here. A function
// passed to evaluate is serialised and cannot close over this scope, so the
// gradient check inlines its own copy — keep the two in step if the banned band
// or the saturation floor ever moves.

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

function hexToRgb(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length < 6) return null;
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
}

// ── run ──────────────────────────────────────────────────────────────────────

const tokens = liveTokenColors();
const browser = await chromium.launch({ headless: !has("--headed") });
const ctx = await browser.newContext({
  viewport: { width: VW, height: VH },
  reducedMotion: "no-preference",
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
    ({ scope, shadowAllow, tokenList, bannedHue }) => {
      const root = document.querySelector(scope);
      if (!root) return { error: `scope "${scope}" not found` };
      const els = [root, ...root.querySelectorAll("*")];
      const tokenSet = new Set(tokenList);
      const allow = shadowAllow.map((s) => new RegExp(s));

      const findings = { radius: [], fonts: [], shadow: [], palette: [], gradient: [] };
      const seenColor = new Set();
      const textNodes = [];

      const describe = (el) => {
        const id = el.id ? `#${el.id}` : "";
        const cls = typeof el.className === "string" && el.className ? `.${el.className.trim().split(/\s+/)[0]}` : "";
        return `${el.tagName.toLowerCase()}${id}${cls}`;
      };

      for (const el of els) {
        const cs = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) continue; // invisible: not rendered law
        if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") continue;

        // radius
        for (const corner of ["borderTopLeftRadius", "borderTopRightRadius", "borderBottomLeftRadius", "borderBottomRightRadius"]) {
          const v = parseFloat(cs[corner]);
          if (v > 0.5) {
            findings.radius.push(`${describe(el)} ${corner}=${cs[corner]}`);
            break;
          }
        }

        // font family — the FIRST declared face is what renders
        const fam = (cs.fontFamily || "").split(",")[0].replace(/["']/g, "").trim();
        if (fam && el.textContent && el.textContent.trim()) {
          if (!/PT Mono|PP Neue Montreal|monospace/i.test(fam)) {
            findings.fonts.push(`${describe(el)} font-family=${fam}`);
          }
        }

        // shadow
        if (cs.boxShadow && cs.boxShadow !== "none") {
          const path = describe(el);
          if (!allow.some((re) => re.test(path))) findings.shadow.push(`${path} box-shadow=${cs.boxShadow.slice(0, 60)}`);
        }

        // gradient hue band
        const bg = cs.backgroundImage || "";
        if (bg.includes("gradient")) {
          for (const m of bg.matchAll(/rgba?\(([^)]+)\)/g)) {
            const p = m[1].split(/[,/]/).map((x) => parseFloat(x));
            const [r, g, b] = p;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            if (max === min) continue;
            const d = max - min;
            let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
            h = Math.round(h * 60);
            if (h < 0) h += 360;
            const l = (max + min) / 2 / 255;
            const s = l > 0.5 ? (max - min) / (510 - max - min) : (max - min) / (max + min);
            if (h >= bannedHue[0] && h <= bannedHue[1] && s > 0.15) {
              findings.gradient.push(`${describe(el)} gradient hue ${h}deg`);
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
            findings.palette.push(`${describe(el)} ${prop}=rgb(${key})`);
          }
        }

        // collect text for the contrast pass
        const direct = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (direct) {
          textNodes.push({
            path: describe(el),
            color: cs.color,
            size: parseFloat(cs.fontSize),
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
      return { findings, textNodes };
    },
    { scope: SCOPE, shadowAllow: SHADOW_ALLOW.map((r) => r.source), tokenList: [...tokens], bannedHue: BANNED_HUE },
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

const order = ["radius", "fonts", "shadow", "gradient", "contrast", "palette"];
let total = 0;
console.log(`\nMECHANICAL — ${url}  scope=${SCOPE}  ${VW}x${VH}  ${THEME}\n`);
for (const k of order) {
  const list = f[k] ?? [];
  // `palette` is advisory: computed colours legitimately include composited and
  // interpolated values that are not literal token entries. It is printed to be
  // scanned, and does not fail the run.
  const advisory = k === "palette";
  const mark = list.length === 0 ? "PASS" : advisory ? "NOTE" : "FAIL";
  console.log(`  ${mark.padEnd(5)} ${k.padEnd(9)} ${list.length}`);
  for (const item of list.slice(0, 6)) console.log(`        ${item}`);
  if (list.length > 6) console.log(`        … and ${list.length - 6} more`);
  if (!advisory) total += list.length;
}
if (pageErrors.length) {
  console.log(`  FAIL  pageerror  ${pageErrors.length}`);
  for (const e of pageErrors.slice(0, 3)) console.log(`        ${e.slice(0, 120)}`);
  total += pageErrors.length;
}

if (JSON_OUT) {
  fs.writeFileSync(JSON_OUT, JSON.stringify({ url, scope: SCOPE, theme: THEME, findings: f, pageErrors }, null, 1));
  console.log(`\n  wrote ${JSON_OUT}`);
}

console.log(`\n  ${total === 0 ? "MECHANICAL PASS" : `MECHANICAL FAIL — ${total} violation(s)`}\n`);
await browser.close();
process.exit(total === 0 ? 0 : 1);
