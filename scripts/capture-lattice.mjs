#!/usr/bin/env node
/**
 * capture-lattice — the bridge from `/test/lattice` into the turnstone ship's
 * wave grammar, with the lattice's mechanical gates (ADR-149 §4).
 *
 * It shoots the lab's boards per (direction × viewport × theme), runs every
 * mechanical gate the ADR names on each cell, and writes the stills, their
 * manifest rows, the gates' report and the mechanical gate's read into a wave
 * folder the armada's tools and `scripts/design-eval/awwwards.mjs` read:
 *
 *     node scripts/capture-lattice.mjs --wave lattice-01-r01 --headed
 *     node scripts/capture-lattice.mjs --wave lattice-01-r01 --k LA --board page --setting binding
 *     node scripts/capture-lattice.mjs --dry-run
 *
 *     <ship>/evals/waves/<wave>[-laptop|-binding]/LT - Lattice page/LT-<lane>__<subject>_<NN>.png
 *     <ship>/evals/waves/<wave>[-…]/LT - Lattice page/MANIFEST.jsonl   one row per still
 *     <ship>/evals/waves/<wave>[-…]/report.json                         every cell's gates
 *     <ship>/evals/waves/<wave>[-…]/mechanical.json                     file → the gate's read
 *
 * Flags
 *   --wave <name>          required unless --dry-run
 *   --k LA,LB              directions (default: every direction in the registry)
 *   --board page,sections  boards (default page,sections,frames; `all` adds grid and type)
 *   --setting default|laptop|binding|all   default all; a setting is a FOLDER SUFFIX,
 *                          never part of a filename (the turnstone convention):
 *                          default = the owner's window (1920x1247, no suffix),
 *                          laptop = 1440x800 (`-laptop`), binding = 1280x720 (`-binding`)
 *   --themes dark,light    default both
 *   --port 3003
 *   --headed               DEFAULT ON — the lab sits in the real HUD frame and a hidden
 *                          document's rAF stalls (ADR-091's trap); --headless turns it off
 *   --no-mech              skip the mechanical gate
 *   --control              copy eval/control/v0-<vp>-<theme>.png into the wave as lane `v0`
 *                          negative-pole rows (the jury's negative anchor)
 *   --timeout 60000        the readiness wait
 *   --dry-run              print the matrix, assert the mirror, exit 0 without a browser
 *
 * ── THE THINGS THIS SCRIPT KNOWS THAT A GENERIC ONE WOULD NOT ────────────────
 *
 * ⚠ THE FILENAME GRAMMAR TAKES LETTERS BEFORE THE FIRST DASH.
 * `^([A-Z]+)-([a-z0-9-]+)__([a-z0-9]+)_(\d\d)\.png` — type `LT`, lane = the
 * direction id lowercased, subject = `void` (dark) | `parchment` (light), and the
 * DRAW is the board: 01 page first screen · 02 page whole · 03 sections ·
 * 04 frames · 05 grid · 06 type. A draw carried in a suffix is a still no tool
 * can find.
 *
 * ⚠ THE WAIT IS ON A VALUE THE PAGE COMPUTED, NEVER ONE THIS SCRIPT SET. The
 * stamp `.lat-read[data-stamp]` is `board|knobs|theme|grid|sector|rail|ticks|rung0`;
 * this script waits on the PREFIX it asked for AND on `ticks === 13 && rail !== 0`,
 * which only the real frame can produce. A gate that waits on a number the
 * script provided is not a gate.
 *
 * ⚠ EVERY LENGTH IS READ THROUGH A PROBE ELEMENT. A custom property is a string
 * until something lays it out (`--lat-ch` is a `clamp()` on three of five rungs).
 *
 * ⚠ CORNERS ARE HIT-TESTED FROM BOTH ENDS. `elementFromPoint` must miss the frame
 * inside a cut AND hit it at the square corners — a serialised polygon is a
 * string, and a string is not a cut.
 *
 * ⚠ ONLY THE CONTROL (`LA`) CAN FAIL THIS SCRIPT. A direction failing a gate is
 * the finding and is written to the manifest as such.
 *
 * ⚠ `reducedMotion: "no-preference"` and the theme from `?theme=`, never
 * `colorScheme` — the site's theme is a pre-paint attribute its own bootstrap
 * reads off the query.
 */
import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";

import { probeFn } from "./design-eval/probe.mjs";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};
const has = (f) => args.includes(f);
const listOf = (f) => {
  const v = argOf(f, "");
  return v
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
};

const ROOT = process.cwd();
const REGISTRY = path.join(ROOT, "lib", "lattice", "directions.json");
const EVAL = path.join(ROOT, ".claude", "skills", "thoughtform-design", "eval");
const SHIP = path.join(EVAL, "subpages");
const SHIP_TOML = path.join(SHIP, "armada.toml");
const WAVES = path.join(SHIP, "evals", "waves");
const REGISTER = path.join(SHIP, "references", "register");
const CONTROL = path.join(EVAL, "control");
const MECH = path.join(ROOT, "scripts", "design-eval", "mechanical.mjs");

const TYPE = "LT";
const ROUTE = "/test/lattice";
const SCOPE = ".lat-doc, .lat-stage";
const EXCLUDE = ".hpl__hud, .hud-nav-overlay, .rin-host, .lat-overlay";

const PORT = argOf("--port", "3003");
const WAVE = argOf("--wave", "");
const ONLY_K = listOf("--k");
const ONLY_BOARDS = listOf("--board");
const SETTING = argOf("--setting", "all");
const ONLY_THEMES = listOf("--themes");
const HEADED = !has("--headless");
const NO_MECH = has("--no-mech");
const DRY = has("--dry-run");
const WITH_CONTROL = has("--control");
const TIMEOUT = Number(argOf("--timeout", "60000"));

if (!WAVE && !DRY) {
  console.error("  --wave <name> is required (e.g. lattice-01-r01), except with --dry-run");
  process.exit(2);
}

/* ── The registry ───────────────────────────────────────────────────────────*/
const reg = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
const KNOB_KEYS = Object.keys(reg.knobs);
const DEFAULTS = Object.fromEntries(KNOB_KEYS.map((k) => [k, reg.knobs[k].values[0]]));
const CONTROL_ID = reg.directions[0].id;
const DIRECTIONS = reg.directions.filter((d) => !ONLY_K.length || ONLY_K.includes(d.id));
const THEMES = reg.wave.themes.filter((t) => !ONLY_THEMES.length || ONLY_THEMES.includes(t));
const LANE = reg.wave.lane;
const knobsOf = (d) => ({ ...DEFAULTS, ...(d.knobs ?? {}) });
/** The stamp's knob half — `app/(internal)/test/lattice`'s `knobString`, byte for byte. */
const knobString = (knobs) => KNOB_KEYS.map((k) => `${k}=${knobs[k]}`).join(",");
const subjectOf = (theme) => (theme === "light" ? "parchment" : "void");
const laneOf = (d) => d.id.toLowerCase();

/* ── Settings: derived from the registry's viewports, never typed twice ─────
 * binding = `wave.binding`; default = the widest viewport (the owner's window);
 * laptop = whatever is left. The setting names are the turnstone's folder
 * suffixes. */
const VPS = reg.wave.viewports;
const widthOf = (vp) => Number(vp.split("x")[0]);
const SETTINGS = {
  binding: reg.wave.binding,
  default: [...VPS].sort((a, b) => widthOf(b) - widthOf(a))[0],
};
SETTINGS.laptop =
  VPS.find((v) => v !== SETTINGS.binding && v !== SETTINGS.default) ?? SETTINGS.binding;
const SETTING_NAMES = SETTING === "all" ? ["default", "laptop", "binding"] : SETTING.split(",");
for (const s of SETTING_NAMES)
  if (!SETTINGS[s]) {
    console.error(`  unknown setting "${s}" (known: ${Object.keys(SETTINGS).join(", ")}, all)`);
    process.exit(2);
  }
const waveDirFor = (setting) =>
  path.join(WAVES, (WAVE || "<wave>") + (setting === "default" ? "" : "-" + setting));

/* ── Boards and draws ───────────────────────────────────────────────────────
 * The draw IS the board (and for the page, which screen of it): the armada's
 * tools sort a slot's stills by draw and the gallery captions them so. */
const BOARD_DRAWS = {
  page: [
    { draw: 1, full: false, what: "the first screen" },
    { draw: 2, full: true, what: "the whole page" },
  ],
  sections: [{ draw: 3, full: true, what: "the sections board" }],
  frames: [{ draw: 4, full: true, what: "the frames board" }],
  grid: [{ draw: 5, full: false, what: "the grid board" }],
  type: [{ draw: 6, full: true, what: "the type board" }],
};
const DEFAULT_BOARDS = ["page", "sections", "frames"];
const ALL_BOARDS = ["page", "sections", "frames", "grid", "type"];
const BOARDS = ONLY_BOARDS.length
  ? ONLY_BOARDS.includes("all")
    ? ALL_BOARDS
    : ONLY_BOARDS.filter((b) => ALL_BOARDS.includes(b))
  : DEFAULT_BOARDS;

/* ── The ship, read by hand (capture-subpages' minimal TOML read) ───────────*/
function tomlBlocks(toml, section) {
  const out = new Map();
  let cur = null;
  for (const raw of toml.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, "").trim();
    const head = line.match(/^\[([^\]]+)\]$/);
    if (head) {
      const parts = head[1].split(".");
      cur = parts[0] === section && parts.length === 2 ? parts[1] : null;
      if (cur && !out.has(cur)) out.set(cur, {});
      continue;
    }
    if (!cur) continue;
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*=\s*"(.*)"$/);
    if (kv) out.get(cur)[kv[1]] = kv[2];
  }
  return out;
}
function tomlSection(toml, header) {
  const out = {};
  const i = toml.indexOf(`[${header}]`);
  if (i < 0) return out;
  for (const raw of toml.slice(i + header.length + 2).split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, "").trim();
    if (line.startsWith("[")) break;
    const kv = line.match(/^([A-Za-z_][\w-]*)\s*=\s*"(.*)"$/);
    if (kv) out[kv[1]] = kv[2];
  }
  return out;
}
function readShip() {
  if (!fs.existsSync(SHIP_TOML)) {
    console.error("  no ship at " + SHIP_TOML);
    process.exit(2);
  }
  const toml = fs.readFileSync(SHIP_TOML, "utf8");
  const lanes = tomlSection(toml, "models.lanes");
  const types = tomlBlocks(toml, "types");
  const settings = tomlBlocks(toml, "settings");
  return { toml, lanes, types, settings };
}

/* ── The mirror ──────────────────────────────────────────────────────────────
 * The registry the page draws from and the ship that grades it: a type for the
 * page, a lane per direction, the binding setting. Checked loudly, every run. */
function assertMirror(ship) {
  const problems = [];
  for (const d of reg.directions) {
    if (!/^[A-Z]+$/.test(d.id)) problems.push(`direction id ${d.id} is not letters only`);
    const lane = laneOf(d);
    const v = ship.lanes[lane];
    if (!v) problems.push(`no lane "${lane}" in armada.toml [models.lanes] for direction ${d.id}`);
    else if (!/^render-\d{2,5}$/.test(v))
      problems.push(`lane "${lane}" is "${v}", not render-<port>`);
  }
  const t = ship.types.get(TYPE);
  if (!t) problems.push(`no [types.${TYPE}] in armada.toml`);
  else {
    const route = (t.shot ?? "").replace(/^ROUTE:\s*/, "");
    if (!route.startsWith(ROUTE))
      problems.push(`[types.${TYPE}] shot is "${t.shot}", not ROUTE: ${ROUTE}…`);
  }
  if (!ship.settings.get("binding")) problems.push("no [settings.binding] in armada.toml");
  else if (ship.settings.get("binding").surface !== reg.wave.binding)
    problems.push(
      `[settings.binding] surface ${ship.settings.get("binding").surface} != wave.binding ${reg.wave.binding}`
    );
  if (!VPS.includes(reg.wave.binding))
    problems.push(`wave.binding ${reg.wave.binding} is not one of wave.viewports`);
  if (DIRECTIONS.length === 0)
    problems.push(`--k names no direction (known: ${reg.directions.map((d) => d.id).join(", ")})`);
  if (problems.length) {
    console.error("  THE REGISTRY AND THE SHIP HAVE DRIFTED.");
    for (const p of problems) console.error("    " + p);
    process.exit(2);
  }
}

/* ── A tiny PNG read (8-bit RGB/RGBA, non-interlaced — what Chromium emits) ──
 * No `pngjs` in node_modules; this is forty lines on `node:zlib` and returns
 * null on anything it does not understand, which the RING gate reads as
 * "skipped", never as a failure. */
function decodePng(buf) {
  if (buf.length < 8 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  let off = 8;
  let w = 0,
    h = 0,
    depth = 0,
    colour = 0,
    interlace = 0;
  const idat = [];
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      depth = data[8];
      colour = data[9];
      interlace = data[12];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  if (depth !== 8 || interlace !== 0 || (colour !== 6 && colour !== 2) || !w || !h) return null;
  const bpp = colour === 6 ? 4 : 3;
  const stride = w * bpp;
  let raw;
  try {
    raw = zlib.inflateSync(Buffer.concat(idat));
  } catch {
    return null;
  }
  const out = Buffer.alloc(w * h * bpp);
  let p = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[p++];
    const row = y * stride;
    const prev = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[row + x - bpp] : 0;
      const b = y > 0 ? out[prev + x] : 0;
      const c = x >= bpp && y > 0 ? out[prev + x - bpp] : 0;
      const v = raw[p++];
      let r;
      if (ft === 0) r = v;
      else if (ft === 1) r = v + a;
      else if (ft === 2) r = v + b;
      else if (ft === 3) r = v + ((a + b) >> 1);
      else if (ft === 4) {
        const pa = Math.abs(b - c),
          pb = Math.abs(a - c),
          pc = Math.abs(a + b - 2 * c);
        r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      } else return null;
      out[row + x] = r & 255;
    }
  }
  const lum = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return null;
    const i = (y * w + x) * bpp;
    return 0.2126 * out[i] + 0.7152 * out[i + 1] + 0.0722 * out[i + 2];
  };
  return { w, h, lum };
}

/* ── The gates, in the page ──────────────────────────────────────────────────
 * ONE serialised function; every helper inside it; its inputs as arguments.
 * Returns what the manifest records per gate. The RING (needs pixels) and the
 * keyboard half of USABILITY (needs real key presses) run from node. */
function gatesFn({ scope, exclude, board, cuts }) {
  const roots = [...document.querySelectorAll(scope)];
  const excluded = new Set();
  for (const r of roots)
    for (const e of r.querySelectorAll(exclude)) {
      excluded.add(e);
      for (const d of e.querySelectorAll("*")) excluded.add(d);
    }
  const inScope = [];
  for (const r of roots)
    for (const el of [r, ...r.querySelectorAll("*")]) if (!excluded.has(el)) inScope.push(el);
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0)
      return false;
    if (typeof el.checkVisibility === "function")
      return el.checkVisibility({ opacityProperty: true, visibilityProperty: true });
    return true;
  };
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
  const isGold = (s) => {
    const p = parse(s);
    return !!p && p.a >= 0.05 && p.r > 90 && p.r - p.b > 40 && p.r >= p.g;
  };
  /* A colour's hue family: neutral below a chroma floor (dawn is a warm
     neutral — 235,227,214 sits at 37°, four degrees off gold's 41° — so hue
     alone would call them one), else the hue rounded to 10°. */
  const hueKey = (s) => {
    const p = parse(s);
    if (!p || p.a < 0.05) return null;
    const r = p.r / 255,
      g = p.g / 255,
      b = p.b / 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    if (max - min < 0.12) return "neutral";
    let h =
      max === r
        ? ((g - b) / (max - min)) % 6
        : max === g
          ? (b - r) / (max - min) + 2
          : (r - g) / (max - min) + 4;
    h = Math.round(((h * 60 + 360) % 360) / 10) * 10;
    return String(h);
  };
  const srgb = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const lum = ({ r, g, b }) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
  const composite = (fg, bg) => {
    const a = fg.a ?? 1;
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1,
    };
  };
  const contrast = (fg, bg) => {
    const l1 = lum(fg),
      l2 = lum(bg);
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
  };
  const bedOf = (el) => {
    let p = el;
    while (p && p !== document.documentElement) {
      const c = parse(getComputedStyle(p).backgroundColor);
      if (c && c.a >= 0.85) return c;
      p = p.parentElement;
    }
    return parse(getComputedStyle(document.body).backgroundColor) ?? { r: 10, g: 9, b: 8, a: 1 };
  };
  /* A length, laid out: `width: var(--x)` on an empty absolute probe INSIDE
     the element whose cascade should answer. */
  const px = (host, expr) => {
    const probe = document.createElement("i");
    probe.style.cssText =
      "position:absolute;visibility:hidden;height:0;padding:0;border:0;margin:0";
    probe.style.width = expr;
    host.appendChild(probe);
    const w = parseFloat(getComputedStyle(probe).width);
    probe.remove();
    return Number.isFinite(w) ? w : NaN;
  };
  const hasDirectText = (el) =>
    [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);

  const frames = [...document.querySelectorAll(".lat-frame")].filter((f) => !excluded.has(f));

  /* ── CHAMFER ──────────────────────────────────────────────────────── */
  const chamfer = { ok: true, detail: [] };
  const ladderNames = ["chrome", "seed", "card", "plate", "plate-fluid"];
  for (const f of frames) {
    const c = px(f, "var(--lat-ch)");
    const ladder = ladderNames.map((n) => [n, px(f, `var(--lat-ch-${n})`)]);
    const onLadder = ladder.some(([, v]) => Number.isFinite(v) && Math.abs(v - c) <= 0.5);
    const named = f.getAttribute("data-ch");
    const want = named ? ladder.find(([n]) => n === named)?.[1] : undefined;
    const matchesNamed = want === undefined || (Number.isFinite(want) && Math.abs(want - c) <= 0.5);
    if (!Number.isFinite(c) || !onLadder || !matchesNamed) {
      chamfer.ok = false;
      chamfer.detail.push(
        `${describe(f)} --lat-ch=${Number.isFinite(c) ? c.toFixed(2) : "unresolved"}` +
          (named
            ? ` data-ch=${named} (${Number.isFinite(want) ? want.toFixed(2) : "unresolved"})`
            : "")
      );
    }
  }
  if (!frames.length) chamfer.detail.push("no .lat-frame in scope");

  /* ── CORNERS — hit-tested from both ends ──────────────────────────── */
  const corners = { ok: true, detail: [], tested: 0 };
  const hits = (el, x, y) => {
    const e = document.elementFromPoint(x, y);
    return !!e && (e === el || el.contains(e));
  };
  /* Bring one edge of the frame into the viewport, clear of the fixed chrome
     at the top (the header's corners) and the bottom (the wordmark row). */
  const bring = (el, edge) => {
    const r0 = el.getBoundingClientRect();
    const want =
      edge === "top"
        ? Math.min(140, innerHeight * 0.2)
        : innerHeight - Math.min(140, innerHeight * 0.2);
    const have = edge === "top" ? r0.top : r0.bottom;
    window.scrollTo({ top: Math.max(0, scrollY + have - want), behavior: "instant" });
    return el.getBoundingClientRect();
  };
  for (const f of frames) {
    if (f.hasAttribute("data-overflow")) continue;
    const c = px(f, "var(--lat-ch)");
    if (!Number.isFinite(c) || c < 8) continue;
    const cut = f.getAttribute("data-cut") || "none";
    if (!cuts.includes(cut)) {
      corners.ok = false;
      corners.detail.push(`${describe(f)} data-cut=${cut} is not one of ${cuts.join("|")}`);
      continue;
    }
    const trCut = cut === "tr-bl" || cut === "tr";
    const blCut = cut === "tr-bl" || cut === "bl";
    corners.tested++;
    const name = describe(f);
    // the top edge: TL must hit, TR must miss inside a cut / hit without one
    let r = bring(f, "top");
    if (r.top < 0 || r.top > innerHeight) {
      corners.detail.push(`${name}: top edge could not be brought into view`);
      corners.ok = false;
    } else {
      const tl = hits(f, r.left + 2, r.top + 2);
      const tr = hits(f, r.right - c * 0.3, r.top + c * 0.3);
      if (!tl) {
        corners.ok = false;
        corners.detail.push(`${name}: TL (square) does not resolve to the frame`);
      }
      if (trCut === tr) {
        corners.ok = false;
        corners.detail.push(
          `${name}: TR ${trCut ? "cut but resolves to the frame" : "square but does not resolve"}`
        );
      }
    }
    // the bottom edge: BR must hit, BL mirrors TR
    r = bring(f, "bottom");
    if (r.bottom < 0 || r.bottom > innerHeight) {
      corners.detail.push(`${name}: bottom edge could not be brought into view`);
      corners.ok = false;
    } else {
      const br = hits(f, r.right - 2, r.bottom - 2);
      const bl = hits(f, r.left + c * 0.3, r.bottom - c * 0.3);
      if (!br) {
        corners.ok = false;
        corners.detail.push(`${name}: BR (square) does not resolve to the frame`);
      }
      if (blCut === bl) {
        corners.ok = false;
        corners.detail.push(
          `${name}: BL ${blCut ? "cut but resolves to the frame" : "square but does not resolve"}`
        );
      }
    }
  }
  window.scrollTo({ top: 0, behavior: "instant" });

  /* ── LEDGER — one hue family, no gold structure off the lip ───────── */
  const ledger = { ok: true, detail: [], hues: [], goldStructure: [] };
  const hueSet = new Set();
  const ordOk = (el) => !!el.closest(".lat-head__ord");
  /* A control's outline is a MARK (the sheet's own `.sh-cta`, the footer's
     CTA): the ledger counts STRUCTURE, so interactive elements are skipped. */
  const isControl = (el) => !!el.closest("a, button, [role=button], input, select, textarea");
  for (const el of inScope) {
    if (!visible(el) || isControl(el)) continue;
    const cs = getComputedStyle(el);
    const bx = el.getBoundingClientRect();
    if (bx.width < 1 || bx.height < 1) continue;
    /* a box under 16px on both axes is a MARK (a diamond, a tick, a dot),
       never structure; the ledger counts lines and frames */
    if (bx.width < 16 && bx.height < 16) continue;
    const colours = [];
    for (const s of ["Top", "Right", "Bottom", "Left"]) {
      const w = parseFloat(cs[`border${s}Width`]);
      if (w >= 1 && w <= 2 && cs[`border${s}Style`] === "solid")
        colours.push(cs[`border${s}Color`]);
    }
    const thinH = bx.height <= 2 && bx.width >= 20;
    const thinV = bx.width <= 2 && bx.height >= 20;
    if ((thinH || thinV) && cs.backgroundColor !== "rgba(0, 0, 0, 0)")
      colours.push(cs.backgroundColor);
    for (const col of colours) {
      const key = hueKey(col);
      if (key) hueSet.add(key);
      if (isGold(col) && !ordOk(el)) ledger.goldStructure.push(`${describe(el)} ${col}`);
    }
  }
  ledger.hues = [...hueSet];
  if (hueSet.size > 2) {
    ledger.ok = false;
    ledger.detail.push(`${hueSet.size} hue families on structure: ${ledger.hues.join(", ")}`);
  }
  if (ledger.goldStructure.length) {
    ledger.ok = false;
    ledger.detail.push(
      `gold on ${ledger.goldStructure.length} structure element(s): ${ledger.goldStructure.slice(0, 6).join("; ")}`
    );
  }

  /* ── OVERLAP — no two text line boxes of different elements intersect ─ */
  const overlap = { ok: true, detail: [], pairs: 0 };
  const boxes = [];
  for (const el of inScope) {
    if (!hasDirectText(el) || !visible(el)) continue;
    for (const n of el.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects())
        if (r.width > 1 && r.height > 1) boxes.push({ el, r });
    }
  }
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const A = boxes[i],
        B = boxes[j];
      if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue;
      const w = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left);
      const h = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
      if (w > 1 && h > 1) {
        overlap.pairs++;
        if (overlap.detail.length < 20)
          overlap.detail.push(
            `${describe(A.el)} × ${describe(B.el)} (${Math.round(w)}×${Math.round(h)}px)`
          );
      }
    }
  overlap.ok = overlap.pairs === 0;

  /* ── The carried gates ─────────────────────────────────────────────── */
  const fams = new Map();
  let minPx = 99,
    radii = 0;
  const textLeaves = [];
  for (const el of inScope) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const bx = el.getBoundingClientRect();
    if (bx.width < 1 || bx.height < 1) continue;
    if (parseFloat(cs.borderTopLeftRadius) > 0.5) radii++;
    if (hasDirectText(el)) {
      const fam = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      fams.set(fam, (fams.get(fam) || 0) + 1);
      minPx = Math.min(minPx, parseFloat(cs.fontSize));
      textLeaves.push({ el, cs, size: parseFloat(cs.fontSize) });
    }
  }
  const host = roots[0] ?? document.body;
  const latCopy = px(host, "var(--lat-copy)");
  const bandCopy = px(host, "var(--band-copy)");
  const carried = {
    minPx: Math.round(minPx * 10) / 10,
    families: [...fams.keys()],
    radii,
    copy: {
      lat: latCopy,
      band: bandCopy,
      match: Number.isFinite(latCopy) && Math.abs(latCopy - bandCopy) <= 0.01,
    },
  };

  /* ── USABILITY (page board): hit boxes and contrast ─────────────────── */
  let usability = null;
  if (board === "page") {
    const pageRoot = document.querySelector(".lat-page");
    const hitsList = [];
    const contrastList = [];
    if (pageRoot) {
      for (const el of pageRoot.querySelectorAll(
        "a, button, [role=button], input, select, textarea"
      )) {
        if (excluded.has(el) || !visible(el)) continue;
        /* The close is the site footer — production chrome measured by its
           own smoke (site-footer); the lattice's hit boxes are its own. */
        if (el.closest(".lat-page__close")) continue;
        const bx = el.getBoundingClientRect();
        if (bx.width < 1 || bx.height < 1) continue;
        const textLink = el.tagName === "A" && !!el.textContent.trim();
        const ok =
          (bx.height >= 44 && bx.width >= 44) || (textLink && bx.height >= 44 && bx.width >= 120);
        if (!ok) hitsList.push(`${describe(el)} ${Math.round(bx.width)}×${Math.round(bx.height)}`);
      }
      for (const { el, cs, size } of textLeaves) {
        if (!pageRoot.contains(el)) continue;
        const fg = parse(cs.color);
        if (!fg) continue;
        const bg = bedOf(el);
        const ratio = contrast(composite(fg, bg), bg);
        const floor = size < 18.66 ? 4.5 : 3;
        if (ratio < floor)
          contrastList.push(`${describe(el)} ${ratio.toFixed(2)}:1 at ${size}px (needs ${floor})`);
      }
    }
    usability = {
      hits: { ok: hitsList.length === 0, detail: hitsList },
      contrast: { ok: contrastList.length === 0, detail: contrastList },
      hasPage: !!pageRoot,
    };
  }

  return { chamfer, corners, ledger, overlap, carried, usability, frames: frames.length };
}

/* The frame whose cut corner the RING gate will read: the first of each cut on
   the frames board, brought into view, its rect and its cut returned. */
function ringTargetFn(cut) {
  const f = [...document.querySelectorAll(".lat-frame")].find(
    (el) => (el.getAttribute("data-cut") || "none") === cut
  );
  if (!f) return null;
  const probe = document.createElement("i");
  probe.style.cssText = "position:absolute;visibility:hidden;height:0;width:var(--lat-ch)";
  f.appendChild(probe);
  const c = parseFloat(getComputedStyle(probe).width);
  probe.remove();
  const edge = cut === "bl" ? "bottom" : "top";
  const r0 = f.getBoundingClientRect();
  const want =
    edge === "top"
      ? Math.min(160, innerHeight * 0.25)
      : innerHeight - Math.min(160, innerHeight * 0.25);
  const have = edge === "top" ? r0.top : r0.bottom;
  window.scrollTo({ top: Math.max(0, scrollY + have - want), behavior: "instant" });
  const r = f.getBoundingClientRect();
  return {
    c,
    rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom },
    which: edge === "top" ? "tr" : "bl",
  };
}

/** The ring, measured as ink: a line along the diagonal that differs from the ground 3px further in. */
async function ringGate(page) {
  const gate = { ok: true, detail: [] };
  const readings = [];
  for (const cut of ["tr-bl", "tr", "bl"]) {
    const t = await page.evaluate(ringTargetFn, cut);
    if (!t) continue;
    const { c, rect: r, which } = t;
    if (!Number.isFinite(c) || c < 4) {
      readings.push(`${cut}: cut ${c}px, not measured`);
      continue;
    }
    const png = decodePng(await page.screenshot({ animations: "disabled" }));
    if (!png) return { ok: true, detail: ["skipped: no png decoder for this image"], readings };
    // the diagonal, and the unit normal pointing INTO the frame
    const [x0, y0, x1, y1, nx, ny] =
      which === "tr"
        ? [r.right - c, r.top, r.right, r.top + c, -1, 1]
        : [r.left, r.bottom - c, r.left + c, r.bottom, 1, -1];
    const n = Math.max(6, Math.round(c));
    let hit = 0,
      total = 0;
    for (let i = 0; i <= n; i++) {
      const t0 = (i + 0.5) / (n + 1);
      const X = x0 + (x1 - x0) * t0;
      const Y = y0 + (y1 - y0) * t0;
      const ground = png.lum(Math.round(X + nx * 4.5), Math.round(Y + ny * 4.5));
      if (ground === null) continue;
      let best = 0;
      for (const d of [0, 0.7, 1.4]) {
        const l = png.lum(Math.round(X + nx * d), Math.round(Y + ny * d));
        if (l !== null) best = Math.max(best, Math.abs(l - ground));
      }
      total++;
      if (best > 8) hit++;
    }
    if (total === 0) {
      /* no sample landed on the screenshot: the target was not in the
         viewport — a measurement that did not happen, never a 0 % line */
      readings.push(`${cut}: the ${which.toUpperCase()} cut was not in view, not measured`);
      gate.ok = false;
      gate.detail.push(`${cut}: the cut could not be brought into view`);
      continue;
    }
    const share = total ? hit / total : 0;
    readings.push(
      `${cut}: ${hit}/${total} samples differ from the ground (${Math.round(share * 100)} %) at the ${which.toUpperCase()} cut, c=${c.toFixed(1)}`
    );
    if (share < 0.8) {
      gate.ok = false;
      gate.detail.push(`${cut}: only ${Math.round(share * 100)} % of the diagonal carries a line`);
    }
  }
  if (!readings.length) gate.detail.push("no cut frame found to measure");
  gate.readings = readings;
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  return gate;
}

/** The keyboard half of USABILITY: Tab up to forty times; at least one focus ring inside the page. */
async function keyboardGate(page) {
  const seen = [];
  let ring = null;
  for (let i = 0; i < 40 && !ring; i++) {
    await page.keyboard.press("Tab");
    const f = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      const page = document.querySelector(".lat-page");
      if (!page || !page.contains(a)) return { outside: true };
      const cs = getComputedStyle(a);
      const outline = parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== "none";
      const shadow = cs.boxShadow && cs.boxShadow !== "none";
      const id = a.id ? `#${a.id}` : "";
      const cls =
        typeof a.className === "string" && a.className
          ? `.${a.className.trim().split(/\s+/)[0]}`
          : "";
      return { desc: `${a.tagName.toLowerCase()}${id}${cls}`, ring: outline || shadow };
    });
    if (!f || f.outside) continue;
    seen.push(f.desc);
    if (f.ring) ring = f.desc;
  }
  return {
    ok: !!ring,
    detail: ring
      ? [`focus ring on ${ring}`]
      : seen.length
        ? [
            `no focus ring on ${seen.length} focused element(s): ${[...new Set(seen)].slice(0, 6).join(", ")}`,
          ]
        : ["nothing inside .lat-page took focus"],
  };
}

/* ── The mechanical gate, per cell ──────────────────────────────────────────*/
const MECH_ADVISORY = new Set([
  "palette",
  "trackingLegacy",
  "trackingSvg",
  "textShadowScrim",
  "accentMarks",
  "spacing",
  "typeLadder",
  "chamfer",
]);
function runMech(query, theme, vp, board) {
  if (NO_MECH) return null;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lattice-mech-"));
  const jsonOut = path.join(tmp, "mech.json");
  const argv = [
    MECH,
    "--url",
    `${ROUTE}?${query}`,
    "--theme",
    theme,
    "--scope",
    SCOPE,
    "--exclude",
    EXCLUDE,
    "--vp",
    vp,
    "--budget",
    "24",
    "--json",
    jsonOut,
    "--port",
    PORT,
    "--ready",
    `.lat-read[data-stamp^="${board}|"]`,
  ];
  const t0 = Date.now();
  /* ⚠ MSYS PATH CONVERSION. Under Git Bash a child's `/route` argument is
     rewritten into a Windows path before the child sees it; this turns the
     conversion off for the one child (capture-subpages' own finding). */
  const r = spawnSync(process.execPath, argv, {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 240000,
    env: { ...process.env, MSYS_NO_PATHCONV: "1", MSYS2_ARG_CONV_EXCL: "*" },
  });
  const seconds = +((Date.now() - t0) / 1000).toFixed(1);
  let parsed = null;
  try {
    if (fs.existsSync(jsonOut)) parsed = JSON.parse(fs.readFileSync(jsonOut, "utf8"));
  } catch {
    parsed = null;
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  const violations = [];
  const notes = {};
  if (parsed?.findings) {
    for (const [k, list] of Object.entries(parsed.findings)) {
      if (!Array.isArray(list) || !list.length) continue;
      if (MECH_ADVISORY.has(k)) {
        notes[k] = list.length;
        if (k === "accentMarks" && list.length > 24)
          violations.push(`accentMarks ${list.length} over budget 24`);
      } else for (const item of list) violations.push(`${k}: ${item}`);
    }
    for (const e of parsed.pageErrors ?? [])
      violations.push(`pageerror: ${String(e).slice(0, 120)}`);
  }
  if (r.status === 2) {
    const tail = ((r.stdout || "") + (r.stderr || ""))
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-4)
      .join(" | ");
    violations.push(`mechanical exit 2: ${tail.slice(0, 200)}`);
  }
  return { ok: r.status === 0, code: r.status ?? -1, seconds, violations, notes };
}

/* ── Waits ──────────────────────────────────────────────────────────────────*/
async function settle(page, prefix) {
  await page.waitForFunction(
    (w) => {
      const el = document.querySelector(".lat-read");
      const s = el?.getAttribute("data-stamp") || "";
      if (!s.startsWith(w)) return false;
      // the tail the script cannot set: sector|rail|ticks|rung0
      const tail = s.slice(w.length).split("|");
      if (tail.length < 4) return false;
      const rail = Number(tail[1]);
      const ticks = Number(tail[2]);
      return ticks === 13 && Number.isFinite(rail) && rail !== 0;
    },
    prefix,
    { timeout: TIMEOUT }
  );
  await page.waitForTimeout(450);
}

/** Walk the document once so any in-view reveal has landed before a whole-page still. */
async function walk(page) {
  await page.evaluate(async () => {
    const step = Math.round(innerHeight * 0.8);
    const max = document.documentElement.scrollHeight;
    const frame = () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    for (let y = 0; y < max; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await frame();
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await frame();
  });
  await page
    .waitForFunction(
      () =>
        document
          .getAnimations()
          .every(
            (a) => a.playState !== "running" || a.effect?.getTiming?.().iterations === Infinity
          ),
      null,
      { timeout: 4000 }
    )
    .catch(() => {});
  await page.waitForTimeout(250);
}

/* ── Manifests ─────────────────────────────────────────────────────────────*/
const manifests = new Map();
function addRow(folder, row) {
  if (!manifests.has(folder)) manifests.set(folder, []);
  manifests.get(folder).push(row);
}
function flushManifests() {
  for (const [folder, rows] of manifests) {
    fs.mkdirSync(folder, { recursive: true });
    const file = path.join(folder, "MANIFEST.jsonl");
    // A re-shoot of the same cell REPLACES its rows (capture-subpages' law).
    const fresh = new Set(rows.map((r) => r.file));
    const prior = fs.existsSync(file)
      ? fs
          .readFileSync(file, "utf8")
          .split(/\r?\n/)
          .filter((l) => l.trim())
          .filter((l) => {
            try {
              return !fresh.has(JSON.parse(l).file);
            } catch {
              return true;
            }
          })
      : [];
    fs.writeFileSync(file, [...prior, ...rows.map((r) => JSON.stringify(r))].join("\n") + "\n");
  }
}
const nn = (n) => String(n).padStart(2, "0");
const okMark = (g) => (g ? (g.ok ? "ok" : "FAIL") : "—");

/* ── One setting's wave ─────────────────────────────────────────────────────*/
async function shootSetting(browser, ship, setting) {
  const vp = SETTINGS[setting];
  const [w, h] = vp.split("x").map(Number);
  const waveDir = waveDirFor(setting);
  const typeName = ship.types.get(TYPE)?.name ?? "Lattice page";
  const folder = path.join(waveDir, `${TYPE} - ${typeName}`);
  fs.mkdirSync(folder, { recursive: true });
  const report = {
    wave: WAVE,
    setting,
    viewport: vp,
    type: TYPE,
    // the registry's own lane name; the FILES carry the direction id lowercased
    registryLane: LANE,
    scope: SCOPE,
    exclude: EXCLUDE,
    when: new Date().toISOString(),
    cells: [],
  };
  const mechanical = {};
  const failing = [];
  console.log(
    `  wave ${path.basename(waveDir)} at ${vp}: ${DIRECTIONS.length} directions × ${THEMES.length} themes × ${BOARDS.length} boards`
  );

  if (WITH_CONTROL) {
    for (const theme of THEMES) {
      const src = path.join(CONTROL, `v0-${vp}-${theme}.png`);
      const subject = subjectOf(theme);
      const file = `${TYPE}-v0__${subject}_01.png`;
      if (!fs.existsSync(src)) {
        console.log(`    control ${subject}: no ${path.relative(ROOT, src)} — not copied`);
        continue;
      }
      fs.copyFileSync(src, path.join(folder, file));
      addRow(folder, {
        file,
        type: TYPE,
        lane: "v0",
        subject,
        draw: 1,
        setting,
        viewport: vp,
        theme,
        board: "control",
        dir: "v0",
        knobs: null,
        stamp: null,
        probe: null,
        measure: null,
        gates: {},
        mechanical: null,
        slot: `${TYPE}-${subject}`,
        model: "chromium (playwright)",
        model_lane: "v0",
        seconds: 0,
        references: [path.join(REGISTER, `${subject}.png`)],
        reference_names: [`${subject}.png`],
        settings: { ar: "16:9", size: vp, quality: "dsf1", setting },
        prompt: `eval/control/v0-${vp}-${theme}.png`,
        meta: {
          type: TYPE,
          type_name: typeName,
          question:
            "the negative pole: the shipped proof panel in the frame, byte-identical from eval/control",
          pole: "negative",
          subject,
          theme,
          viewport: vp,
          setting,
          direction: "v0",
          still: "1 of 1",
          subject_noun: `the shipped proof panel (the control still), ${theme} theme at ${vp}`,
          channel: "control - first screen",
        },
        timestamp: new Date().toISOString(),
        ok: true,
      });
      console.log(`    control ${subject} → ${file}`);
    }
  }

  for (const theme of THEMES)
    for (const d of DIRECTIONS)
      for (const board of BOARDS) {
        const subject = subjectOf(theme);
        const lane = laneOf(d);
        const knobs = knobsOf(d);
        const kstr = knobString(knobs);
        const query = `board=${board}&k=${d.id}&theme=${theme}&console=0`;
        const href = `http://localhost:${PORT}${ROUTE}?${query}`;
        const cell = {
          id: d.id,
          lane,
          board,
          theme,
          subject,
          viewport: vp,
          setting,
          href,
          files: [],
          gates: {},
          errors: [],
        };
        const ctx = await browser.newContext({
          viewport: { width: w, height: h },
          deviceScaleFactor: 1,
          reducedMotion: "no-preference",
        });
        const page = await ctx.newPage();
        page.on("pageerror", (e) => cell.errors.push(e.message.slice(0, 160)));
        const t0 = Date.now();
        try {
          await page.goto(href, { waitUntil: "domcontentloaded", timeout: 120000 });
          await settle(page, `${board}|${kstr}|${theme}|0|`);
          cell.stamp = await page.evaluate(
            () => document.querySelector(".lat-read")?.getAttribute("data-stamp") ?? ""
          );
          const measure = await page.evaluate(() => window.__lattice.measure());
          cell.measure = measure;
          cell.probe = await page.evaluate(probeFn, ".lat-lab");

          /* ── the gates that read the measurement ─────────────────────── */
          const rungBad = measure.rungs.filter((r) => !(Math.abs(r.delta) <= 1.5));
          cell.gates["RUNG MIRROR"] = {
            ok: measure.rungs.length === 13 && rungBad.length === 0,
            detail:
              `${measure.rungs.length - rungBad.length}/${measure.rungs.length}` +
              (rungBad.length
                ? ` off: ${rungBad.map((r) => `${r.n}:${r.delta}px`).join(" ")}`
                : ""),
          };
          const colBad = measure.columns.filter((c) => !(Math.abs(c.x - c.expected) <= 1));
          cell.gates["COLUMN MIRROR"] = {
            ok: measure.columns.length === 13 && colBad.length === 0,
            detail:
              `${measure.columns.length - colBad.length}/${measure.columns.length}` +
              (colBad.length
                ? ` off: ${colBad.map((c) => `${c.n}:${(c.x - c.expected).toFixed(2)}px`).join(" ")}`
                : ""),
          };
          if (board === "page") {
            const inst = measure.frames.filter((f) => String(f.spec).startsWith("instrument"));
            const off = inst.filter((f) => !(f.topDelta <= 1.5 && f.bottomDelta <= 1.5));
            cell.gates["SEAT-Y"] = {
              ok: off.length === 0,
              detail: inst.length
                ? `${inst.length - off.length}/${inst.length} instrument frames on rungs` +
                  (off.length
                    ? `; off: ${off.map((f) => `${f.id} top ${f.topDelta} bottom ${f.bottomDelta}`).join("; ")}`
                    : "")
                : "no instrument frame on the page",
            };
          } else
            cell.gates["SEAT-Y"] = {
              ok: true,
              detail: "skipped: a flowing board does not seat on viewport rungs",
            };
          /* The frames board is a specimen MATRIX on its own three-column air
             grid; only a composed board seats its frames on the twelve. */
          if (["page", "sections"].includes(board)) {
            const off = measure.frames.filter((f) => !(f.leftDelta <= 1 && f.rightDelta <= 1));
            cell.gates["SEAT-X"] = {
              ok: off.length === 0,
              detail:
                `${measure.frames.length - off.length}/${measure.frames.length} frames on column edges` +
                (off.length
                  ? `; off: ${off.map((f) => `${f.id} left ${f.leftDelta} right ${f.rightDelta}`).join("; ")}`
                  : ""),
            };
          } else cell.gates["SEAT-X"] = { ok: true, detail: "skipped on this board" };

          /* ── the first screen, before anything scrolls ───────────────── */
          const draws = BOARD_DRAWS[board];
          const shoot = async (spec) => {
            const file = `${TYPE}-${lane}__${subject}_${nn(spec.draw)}.png`;
            await page.screenshot({
              path: path.join(folder, file),
              animations: "disabled",
              fullPage: spec.full,
            });
            cell.files.push({ file, draw: spec.draw, what: spec.what });
            return file;
          };
          for (const spec of draws.filter((s) => !s.full)) await shoot(spec);

          /* ── the in-page gates (these scroll) ────────────────────────── */
          const g = await page.evaluate(gatesFn, {
            scope: SCOPE,
            exclude: EXCLUDE,
            board,
            cuts: ["tr-bl", "tr", "bl", "none"],
          });
          cell.gates.CHAMFER = {
            ok: g.chamfer.ok,
            detail: g.chamfer.detail.join("; ") || `${g.frames} frames on the ladder`,
          };
          cell.gates.CORNERS = {
            ok: g.corners.ok,
            detail:
              g.corners.detail.join("; ") || `${g.corners.tested} frames hit-tested both ends`,
          };
          cell.gates.LEDGER = {
            ok: g.ledger.ok,
            detail:
              g.ledger.detail.join("; ") ||
              `${g.ledger.hues.length} hue family(ies): ${g.ledger.hues.join(", ") || "none"}; gold structure 0`,
          };
          cell.gates.OVERLAP = {
            ok: g.overlap.ok,
            detail: g.overlap.pairs
              ? `${g.overlap.pairs} pair(s): ${g.overlap.detail.join("; ")}`
              : "0",
          };
          cell.gates["TYPE FLOOR"] = { ok: g.carried.minPx >= 8.5, detail: `${g.carried.minPx}px` };
          cell.gates.FAMILIES = {
            ok: g.carried.families.length <= 2,
            detail: g.carried.families.join(", "),
          };
          cell.gates.RADIUS = {
            ok: g.carried.radii === 0,
            detail: `${g.carried.radii} rounded corner(s)`,
          };
          cell.gates.COPY = {
            ok: g.carried.copy.match,
            detail: `--lat-copy ${g.carried.copy.lat}px / --band-copy ${g.carried.copy.band}px`,
          };
          if (board === "frames") cell.gates.RING = await ringGate(page);
          else cell.gates.RING = { ok: true, detail: "measured on the frames board" };

          /* ── the whole-page stills ────────────────────────────────────── */
          if (draws.some((s) => s.full)) {
            await walk(page);
            for (const spec of draws.filter((s) => s.full)) await shoot(spec);
          }

          /* ── usability, page board ───────────────────────────────────── */
          if (board === "page") {
            const kb = await keyboardGate(page);
            const u = g.usability;
            const ok = !!u?.hasPage && u.hits.ok && u.contrast.ok && kb.ok;
            cell.gates.USABILITY = {
              ok,
              detail: [
                u?.hasPage ? "" : "no .lat-page",
                u?.hits.ok
                  ? "hit boxes ok"
                  : `hit boxes under 44px: ${u?.hits.detail.slice(0, 8).join(", ")}${u && u.hits.detail.length > 8 ? ` (+${u.hits.detail.length - 8})` : ""}`,
                kb.detail[0],
                u?.contrast.ok
                  ? "contrast ok"
                  : `contrast: ${u?.contrast.detail.slice(0, 6).join("; ")}${u && u.contrast.detail.length > 6 ? ` (+${u.contrast.detail.length - 6})` : ""}`,
              ]
                .filter(Boolean)
                .join(" · "),
              hits: u?.hits.detail ?? [],
              contrast: u?.contrast.detail ?? [],
              keyboard: kb,
            };
          }
          cell.gates["PAGE ERRORS"] = {
            ok: cell.errors.length === 0,
            detail: cell.errors.length ? cell.errors.join(" | ") : "0",
          };
        } catch (err) {
          cell.gates.CAPTURE = {
            ok: false,
            detail: `capture failed: ${String(err.message).slice(0, 200)}`,
          };
          console.log(
            `    ${d.id} ${board} ${subject} FAILED ${String(err.message).slice(0, 120)}`
          );
        } finally {
          await ctx.close();
        }

        /* ── the mechanical gate, a separate process ─────────────────────── */
        const mech = cell.files.length ? runMech(query, theme, vp, board) : null;
        cell.mechanical = mech;
        const seconds = +((Date.now() - t0) / 1000).toFixed(2);

        /* ── the rows ────────────────────────────────────────────────────── */
        for (const f of cell.files) {
          const row = {
            file: f.file,
            type: TYPE,
            lane,
            subject,
            draw: f.draw,
            setting,
            viewport: vp,
            theme,
            board,
            dir: d.id,
            knobs,
            stamp: cell.stamp ?? null,
            probe: cell.probe ?? null,
            measure: cell.measure
              ? { seated: cell.measure.seated, frames: cell.measure.frames }
              : null,
            gates: cell.gates,
            mechanical: mech
              ? { ok: mech.ok, violations: mech.violations, notes: mech.notes, code: mech.code }
              : null,
            // the armada's own grammar, so qa.py and the gallery read the row too
            slot: `${TYPE}-${subject}`,
            model: "chromium (playwright)",
            model_lane: lane,
            seconds,
            references: [path.join(REGISTER, `${subject}.png`)],
            reference_names: [`${subject}.png`],
            settings: { ar: "16:9", size: vp, quality: "dsf1", setting },
            prompt: href,
            meta: {
              type: TYPE,
              type_name: typeName,
              question: d.question,
              page: typeName,
              route: `${ROUTE}?${query}`,
              theme,
              subject,
              viewport: vp,
              setting,
              direction: d.id,
              knobs,
              board,
              still: `${f.draw} of 6`,
              section: { index: f.draw, id: `${board}-${f.draw}`, kind: board },
              subject_noun: `${typeName}, ${theme} theme at ${vp}, ${f.what} (board ${board}); direction ${d.id}, ${kstr.replaceAll(",", " ")}`,
              channel: `${board} - draw ${nn(f.draw)}`,
              shape: d.shape,
            },
            timestamp: new Date().toISOString(),
            ok: Object.values(cell.gates).every((x) => x.ok),
          };
          addRow(folder, row);
          mechanical[f.file] = mech;
          const gl = cell.gates;
          console.log(
            `  ${f.file.padEnd(28)} ${vp.padEnd(9)} ${theme.padEnd(5)}` +
              ` rungs ${gl["RUNG MIRROR"]?.detail?.split(" ")[0] ?? "—"}` +
              ` cols ${gl["COLUMN MIRROR"]?.detail?.split(" ")[0] ?? "—"}` +
              ` corners ${okMark(gl.CORNERS)}` +
              ` ring ${okMark(gl.RING)}` +
              ` ledger ${g_hues(gl)}` +
              ` overlap ${gl.OVERLAP ? gl.OVERLAP.detail.split(" ")[0] : "—"}` +
              (gl.USABILITY ? ` usability ${okMark(gl.USABILITY)}` : "") +
              ` mech ${mech ? (mech.code === 2 ? "exit2" : mech.violations.length) : "—"}` +
              `  → ${path.relative(ROOT, path.join(folder, f.file))}`
          );
        }
        report.cells.push(cell);
        if (d.id === CONTROL_ID)
          for (const [name, gate] of Object.entries(cell.gates))
            if (!gate.ok) failing.push(`${d.id} ${board} ${vp} ${theme}: ${name} — ${gate.detail}`);
      }

  fs.writeFileSync(path.join(waveDir, "report.json"), JSON.stringify(report, null, 1));
  fs.writeFileSync(path.join(waveDir, "mechanical.json"), JSON.stringify(mechanical, null, 1));
  return failing;
}
function g_hues(gl) {
  const L = gl.LEDGER;
  if (!L) return "—";
  if (!L.ok) return "FAIL";
  const m = L.detail.match(/^(\d+) hue/);
  return m ? `${m[1]} hue${m[1] === "1" ? "" : "s"}` : "ok";
}

/* ── Main ──────────────────────────────────────────────────────────────────*/
(async () => {
  const ship = readShip();
  assertMirror(ship);

  const cells = [];
  for (const setting of SETTING_NAMES)
    for (const theme of THEMES)
      for (const d of DIRECTIONS)
        for (const board of BOARDS) cells.push({ setting, vp: SETTINGS[setting], theme, d, board });
  const stills = cells.reduce((n, c) => n + BOARD_DRAWS[c.board].length, 0);
  console.log(
    `  wave ${WAVE || "(dry)"} — ${DIRECTIONS.map((d) => d.id).join(",")} × ${SETTING_NAMES.map((s) => `${s}=${SETTINGS[s]}`).join(",")} × ${THEMES.join(",")} × boards ${BOARDS.join(",")} = ${cells.length} cells, ${stills} stills` +
      (WITH_CONTROL ? ` + ${SETTING_NAMES.length * THEMES.length} control rows` : "")
  );
  if (DRY) {
    console.log(
      `  mirror: [types.${TYPE}] "${ship.types.get(TYPE).name}" · lanes ${reg.directions.map((d) => `${laneOf(d)}=${ship.lanes[laneOf(d)]}`).join(" ")} · [settings.binding] ${ship.settings.get("binding").surface}`
    );
    console.log(
      `  folders: ${SETTING_NAMES.map((s) => path.relative(ROOT, waveDirFor(s)) + `/${TYPE} - ${ship.types.get(TYPE).name}/`).join("  ")}`
    );
    for (const c of cells.slice(0, 8))
      for (const s of BOARD_DRAWS[c.board])
        console.log(
          `    ${TYPE}-${laneOf(c.d)}__${subjectOf(c.theme)}_${nn(s.draw)}.png  ${c.vp.padEnd(9)} ${c.theme.padEnd(5)} ${c.board.padEnd(8)} ${ROUTE}?board=${c.board}&k=${c.d.id}&theme=${c.theme}&console=0`
        );
    if (cells.length > 8) console.log("    …");
    process.exit(0);
  }

  const browser = await chromium.launch({ headless: !HEADED });
  const failing = [];
  try {
    for (const setting of SETTING_NAMES)
      failing.push(...(await shootSetting(browser, ship, setting)));
    flushManifests();
  } finally {
    await browser.close();
  }
  console.log("");
  if (failing.length) {
    console.log(`  CONTROL GATES FAILED (${CONTROL_ID}):`);
    for (const f of failing) console.log("    " + f);
    process.exit(1);
  }
  console.log("  control gates: clean");
  for (const setting of SETTING_NAMES)
    console.log(`  wrote ${path.relative(ROOT, waveDirFor(setting))}`);
  process.exit(0);
})();
