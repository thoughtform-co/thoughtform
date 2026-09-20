#!/usr/bin/env node
/**
 * capture-subpages — the bridge from the sheet's routes into the turnstone
 * ship's wave grammar (ADR-114).
 *
 * It shoots one still per SECTION of each subpage, per (type × theme ×
 * viewport × direction), and writes them into a wave folder the armada's own
 * tools read unchanged:
 *
 *     node scripts/capture-subpages.mjs --wave wave-01-sb --k SB --port 3003
 *     node scripts/capture-subpages.mjs --wave wave-01-sb --k SB --setting laptop --port 3003
 *
 *     <ship>/evals/waves/<wave>[-laptop]/<TYPE> - <Name>/<TYPE>-<subject>__<lane>_<nn>.png
 *     <ship>/evals/waves/<wave>[-laptop]/<TYPE> - <Name>/MANIFEST.jsonl
 *     <ship>/evals/waves/<wave>[-laptop]/mechanical.json      the gate's read, per cell
 *     <ship>/evals/waves/<wave>[-laptop]/report.json          the probe's own read
 *
 * and three calibration modes:
 *
 *     --register                 the two register strips (the subjects' identities)
 *     --control  --wave <w>      the negative pole: today's OLD /arcs from --port-old, lane `sa`
 *     --fixture  --wave <w>      the site's lawful / broken fixture panels, lanes `lawful` / `broken`
 *
 * then, from the ship at <ship>:
 *
 *     python tools/doctor.py
 *     python tools/qa.py --batch evals/waves/<wave> --runs 3
 *     python tools/make_contact_sheet.py evals/waves/<wave> --sort slot
 *     python tools/make_review_gallery.py evals/waves/<wave>
 *     python tools/ledger.py wave evals/waves/<wave>
 *
 * ── THE THINGS THIS SCRIPT KNOWS THAT A GENERIC ONE WOULD NOT ────────────────
 *
 * ⚠ THE FILENAME GRAMMAR TAKES LETTERS BEFORE THE FIRST DASH. `config.parse_name`
 * matches `^([A-Z]+)-([a-z0-9-]+)(__suffix)?__([a-z0-9]+)_(\d\d)`; an id like
 * `S1` falls to its unknown-shape branch — lane empty, draw 0 — with no error
 * anywhere. The section rides in the DRAW, never in a suffix.
 *
 * ⚠ THE WAIT IS ON A VALUE THE PAGE COMPUTED, NEVER ONE THIS SCRIPT SET.
 * `SheetShell` writes `data-sh-ready` on `.sh-root` only after the three faces
 * have loaded, two frames have painted and the rail has a height; the stamp's
 * tail carries the section count and the live rail height. The substrate lab
 * lost a round gating on `location.search`, which it had set itself.
 *
 * ⚠ THE THEME COMES FROM `?theme=`, NEVER `colorScheme`. The site's theme is a
 * pre-paint attribute written by its own bootstrap, which reads the query.
 *
 * ⚠ `reducedMotion: "no-preference"` IS MANDATORY. Under PRM the console is a
 * static column and the pile — one of the things being judged — never stacks.
 *
 * ⚠ THE REGISTRY IS READ BY EXPLICIT PATH, NEVER SEARCHED FOR, and the ship's
 * `armada.toml` is asserted to MIRROR it (a lane per direction, a type per
 * page) before a single still is shot.
 *
 * ⚠ THE MECHANICAL GATE RUNS FIRST, PER CELL. `mechanical.mjs --scope ".sh-root"
 * --exclude ".sh-hud-root" --budget 12`: exit 2 refuses that cell's stills,
 * exit 1 is recorded and never blocks. The join lives here; `qa.py` is untouched.
 */
import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};
const has = (f) => args.includes(f);
const listOf = (f) => {
  const v = argOf(f, "");
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [];
};

const ROOT = process.cwd();
const REGISTRY = path.join(ROOT, "lib", "sheet", "directions.json");
const SHIP = path.join(ROOT, ".claude", "skills", "thoughtform-design", "eval", "subpages");
const SHIP_TOML = path.join(SHIP, "armada.toml");
const WAVES = path.join(SHIP, "evals", "waves");
const REGISTER = path.join(SHIP, "references", "register");
const NEGATIVE = path.join(SHIP, "skill", "assets", "negative");
const MECH = path.join(ROOT, "scripts", "design-eval", "mechanical.mjs");

const PORT = argOf("--port", "3003");
const PORT_OLD = argOf("--port-old", "3004");
const WAVE = argOf("--wave", "");
const ONLY_K = listOf("--k");
const ONLY_TYPES = listOf("--types");
const ONLY_THEMES = listOf("--themes");
const SETTING = argOf("--setting", "default");
const VP_OVERRIDE = argOf("--vp", "");
const HEADED = has("--headed");
const DRY = has("--dry-run");
const MODE_CONTROL = has("--control");
const MODE_FIXTURE = has("--fixture");
const MODE_REGISTER = has("--register");
const NO_MECH = has("--no-mech");
const MAX_CONTROL_STILLS = Number(argOf("--control-stills", "5"));

/** Where a section's head band sits when a still is shot: under the header. */
const PIN = 96;

if (!WAVE && !DRY && !MODE_REGISTER) {
  console.error("  --wave <name> is required (e.g. wave-01-sb), except with --register or --dry-run");
  process.exit(2);
}

const reg = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
const KNOB_KEYS = Object.keys(reg.knobs);
const DEFAULTS = Object.fromEntries(KNOB_KEYS.map((k) => [k, reg.knobs[k].values[0]]));
const POLE = reg.directions.find((d) => d.pole === "negative");
const DRAWABLE = reg.directions.filter((d) => d.knobs !== null);
const DIRECTIONS = DRAWABLE.filter((d) => !ONLY_K.length || ONLY_K.includes(d.id));
const THEMES = reg.wave.themes.filter((t) => !ONLY_THEMES.length || ONLY_THEMES.includes(t));
const VIEWPORT = (VP_OVERRIDE || reg.wave.settings[SETTING] || "").split("x").map(Number);
if (VIEWPORT.length !== 2 || VIEWPORT.some((n) => !n)) {
  console.error(`  unknown setting "${SETTING}" (known: ${Object.keys(reg.wave.settings).join(", ")}) and no --vp`);
  process.exit(2);
}
const subjectOf = (theme) => (theme === "light" ? "parchment" : "void");
const laneOf = (d) => d.lane ?? d.id.toLowerCase();
const knobsOf = (d) => ({ ...DEFAULTS, ...(d.knobs ?? {}) });
const knobStr = (knobs) => KNOB_KEYS.map((k) => `${k}=${knobs[k]}`).join(" ");

/* ── The ship, read by hand ──────────────────────────────────────────────────
 * A minimal TOML read: `[section.ID]` blocks of `key = "string"` lines. The
 * harness parses the same file with a real parser; this only needs the lanes,
 * the types' names and routes, and the subjects' identities. */
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
  const types = [...tomlBlocks(toml, "types").entries()].map(([id, t]) => ({
    id,
    name: t.name ?? id,
    question: t.question ?? "",
    route: (t.shot ?? "").replace(/^ROUTE:\s*/, ""),
    subject: t.subject ?? "",
  }));
  const subjects = [...tomlBlocks(toml, "subjects").entries()].map(([id, s]) => ({
    id,
    identity: s.identity ?? "",
  }));
  return { toml, lanes, types, subjects };
}

/* ── The mirror ──────────────────────────────────────────────────────────────
 * Two files describe the directions: the registry the page draws from, and
 * the ship's lanes. Two more describe the pages: the routes, and the ship's
 * types. Kept in step deliberately rather than shared across repos, so the
 * drift is checked here, loudly. */
function assertMirror(ship) {
  const problems = [];
  for (const d of reg.directions) {
    if (!/^[A-Z]+$/.test(d.id)) problems.push(`direction id ${d.id} is not letters only`);
    const lane = laneOf(d);
    const v = ship.lanes[lane];
    if (!v) problems.push(`no lane "${lane}" in armada.toml [models.lanes] for direction ${d.id}`);
    else if (!/^render-\d{2,5}$/.test(v)) problems.push(`lane "${lane}" is "${v}", not render-<port>`);
  }
  for (const lane of ["lawful", "broken"])
    if (!/^render-\d{2,5}$/.test(ship.lanes[lane] ?? "")) problems.push(`no render lane "${lane}"`);
  for (const t of ship.types) {
    if (!/^[A-Z]+$/.test(t.id)) problems.push(`type id ${t.id} is not letters only`);
    if (!t.route.startsWith("/")) problems.push(`type ${t.id} has no ROUTE in its shot`);
  }
  for (const [typeId, route] of Object.entries(POLE?.routes ?? {})) {
    const t = ship.types.find((x) => x.id === typeId);
    if (!t) problems.push(`the negative pole names type ${typeId} (${route}), which armada.toml lacks`);
  }
  if (ship.subjects.length !== 2) problems.push(`expected two subjects (void, parchment), found ${ship.subjects.length}`);
  if (problems.length) {
    console.error("  THE REGISTRY AND THE SHIP HAVE DRIFTED.");
    for (const p of problems) console.error("    " + p);
    process.exit(2);
  }
}

/* ── The probe ───────────────────────────────────────────────────────────────
 * The kit probe (ADR-091) rooted at the sheet, plus what only this surface
 * knows: the arrangement sequence and the variety law read off the DOM. Every
 * still carries its numbers into the manifest and the report; `qa.py` never
 * sees them, because a grader handed the answer stops looking. */
function probeFn() {
  const root = document.querySelector(".sh-root");
  if (!root) return { err: "no .sh-root" };
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
  const struct = new Map();
  let accent = 0,
    accentInView = 0,
    bold = 0,
    text = 0,
    minPx = 99,
    radii = 0;

  for (const el of root.querySelectorAll("*")) {
    // The frame is the datum and is never swept (ADR-092): the HUD slice, the
    // header's chapter row, the rail instruments and the shared footer.
    if (el.closest(".sh-hud-root, .hud-nav-overlay, .rin-host, .sh-sec--close")) continue;
    const cs = getComputedStyle(el);
    const bx = el.getBoundingClientRect();
    if (bx.width < 1 || bx.height < 1) continue;
    if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) === 0) continue;

    let isAcc = false;
    for (const s of ["Top", "Right", "Bottom", "Left"])
      if (parseFloat(cs["border" + s + "Width"]) > 0 && cs["border" + s + "Style"] !== "none" && isGold(cs["border" + s + "Color"]))
        isAcc = true;
    if (isGold(cs.backgroundColor)) isAcc = true;
    if (cs.stroke && cs.stroke !== "none" && isGold(cs.stroke)) isAcc = true;
    if (el.namespaceURI?.includes("svg") && cs.fill !== "none" && isGold(cs.fill)) isAcc = true;

    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (hasText) {
      if (isGold(cs.color)) isAcc = true;
      text++;
      if (+cs.fontWeight > 500) bold++;
      bump(fams, cs.fontFamily.split(",")[0].replace(/"/g, "").trim());
      const ls = cs.letterSpacing === "normal" ? 0 : parseFloat(cs.letterSpacing);
      bump(tracks, (ls / parseFloat(cs.fontSize)).toFixed(3));
      minPx = Math.min(minPx, parseFloat(cs.fontSize));
    }
    if (isAcc) {
      accent++;
      // The rubric's budget (A2) is PER STILL: what the viewport shows.
      if (bx.bottom > 0 && bx.top < innerHeight && bx.right > 0 && bx.left < innerWidth) accentInView++;
    }
    if (parseFloat(cs.borderTopLeftRadius) > 0.5) radii++;

    const thin = bx.height <= 2.5 || bx.width <= 2.5;
    if (thin && cs.backgroundColor !== "rgba(0, 0, 0, 0)" && bx.width >= 4) bump(struct, cs.backgroundColor);
    for (const s of ["Top", "Bottom"])
      if (parseFloat(cs["border" + s + "Width"]) > 0 && cs["border" + s + "Style"] !== "none" && bx.width >= 20)
        bump(struct, cs["border" + s + "Color"]);
  }

  const secs = [...root.querySelectorAll(".sh-sec[data-sh-arrangement]")];
  const seq = secs.map((s) => s.getAttribute("data-sh-arrangement"));
  const violations = [];
  if (seq[0] !== "split") violations.push("the first section is not the split");
  if (seq[seq.length - 1] !== "close") violations.push("the last section is not the close");
  if (seq.filter((k) => k === "split").length !== 1) violations.push("split count is not one");
  if (seq.filter((k) => k === "close").length !== 1) violations.push("close count is not one");
  for (let i = 1; i < seq.length; i++) if (seq[i] === seq[i - 1]) violations.push(`two consecutive ${seq[i]}`);
  const counts = new Map();
  for (const k of seq) bump(counts, k);
  for (const [k, n] of counts) if (n > 2) violations.push(`${k} appears ${n} times`);
  if (new Set(seq).size < 3) violations.push("fewer than three arrangements");
  if (root.querySelectorAll('.sh-cells[data-n="3"]').length > 1) violations.push("three cells twice");
  for (const s of secs) {
    const kind = s.getAttribute("data-sh-arrangement");
    if (kind === "timeline" && s.querySelectorAll(".sh-tl__item.is-lit").length !== 1)
      violations.push(`${s.id}: lit items != 1`);
    if (kind === "steps" && s.querySelectorAll(".sh-steps__item.is-open").length !== 1)
      violations.push(`${s.id}: open items != 1`);
  }

  const knobs = {};
  for (const a of root.getAttributeNames()) if (a.startsWith("data-sh-") && !["data-sh-ready", "data-sh-page", "data-sh-k"].includes(a)) knobs[a.slice(8)] = root.getAttribute(a);

  const sorted = [...tracks.entries()].sort((a, b) => b[1] - a[1]);
  return {
    accent,
    accentInView,
    bold,
    text,
    boldShare: text ? +(bold / text).toFixed(3) : 0,
    rungs: tracks.size,
    topRungShare: text && sorted.length ? +(sorted[0][1] / text).toFixed(3) : 0,
    families: [...fams.keys()],
    minPx: Math.round(minPx * 10) / 10,
    radii,
    structureHues: struct.size,
    sections: secs.map((s) => ({ id: s.id, kind: s.getAttribute("data-sh-arrangement") })),
    violations,
    knobs,
    k: root.getAttribute("data-sh-k"),
    ready: root.getAttribute("data-sh-ready"),
    theme: document.documentElement.getAttribute("data-theme"),
  };
}

/* ── Waits ──────────────────────────────────────────────────────────────────*/
async function settle(page, wantK) {
  await page.waitForFunction(
    (k) => {
      const root = document.querySelector(".sh-root");
      const s = root?.getAttribute("data-sh-ready") || "";
      const tail = s.split("|");
      if (tail.length < 3 || Number(tail[1]) < 2 || Number(tail[2]) <= 0) return false;
      return !k || root.getAttribute("data-sh-k") === k;
    },
    wantK,
    { timeout: 90000 }
  );
}

/** Every reveal inside the viewport has landed and nothing is still animating. */
async function stillLife(page, sectionId) {
  await page.waitForFunction(
    (id) => {
      const scope = id ? document.getElementById(id) : document;
      if (!scope) return true;
      if (!document.querySelector(".is-sh-js, .is-arc-js")) return true;
      const inView = [...scope.querySelectorAll(".sh-reveal, .arc-reveal")].filter((r) => {
        const b = r.getBoundingClientRect();
        /* ⚠ The reveal observer's rootMargin is -10% at the bottom (useArcReveal),
           so a node in the viewport's last tenth never lands until it is
           scrolled further — asking for it is a wait that cannot end. */
        return b.bottom > 0 && b.top < innerHeight * 0.88 && b.width > 0;
      });
      return inView.every((r) => r.classList.contains("is-in"));
    },
    sectionId ?? null,
    { timeout: 20000 }
  );
  // Finite animations get four seconds to end; an infinite one (a scanline,
  // a HUD pulse) is not waited for, and a long one is not a reason to fail.
  await page
    .waitForFunction(
      () => document.getAnimations().every((a) => a.playState !== "running" || a.effect?.getTiming?.().iterations === Infinity),
      null,
      { timeout: 4000 }
    )
    .catch(() => {});
  await page.waitForTimeout(320);
}

async function scrollToY(page, y) {
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
  await page.waitForFunction(
    (top) => {
      const max = document.documentElement.scrollHeight - innerHeight;
      return Math.abs(scrollY - Math.min(top, Math.max(0, max))) <= 1;
    },
    y,
    { timeout: 5000 }
  );
}

/** Drive a stacked console until its second slot pins (real wheel steps). */
async function driveStack(page, sectionId, vp) {
  const n = await page.evaluate((id) => document.getElementById(id)?.querySelectorAll("[data-pc-slot]").length ?? 0, sectionId);
  if (n < 2) return { slots: n, driven: false };
  await page.mouse.move(vp[0] / 2, vp[1] / 2);
  for (let i = 0; i < 120; i++) {
    const state = await page.evaluate((id) => {
      const slots = [...(document.getElementById(id)?.querySelectorAll("[data-pc-slot]") ?? [])];
      return slots.map((s) => s.getAttribute("data-pc-state"));
    }, sectionId);
    if (state[1] === "pinned") return { slots: n, driven: true, state };
    await page.mouse.wheel(0, 160);
    await page.waitForTimeout(70);
  }
  return { slots: n, driven: false };
}

/* ── The mechanical gate ───────────────────────────────────────────────────*/
function runMech(routeWithQuery, theme, vp) {
  if (NO_MECH) return null;
  const argv = [
    MECH,
    "--url",
    routeWithQuery,
    "--theme",
    theme,
    "--scope",
    ".sh-root",
    /* The frame is the datum and is never swept (ADR-092): the HUD slice,
       the header's chapter row, the rail instruments, and the shared footer
       (the close), which has its own ratchet. */
    "--exclude",
    ".sh-hud-root, .hud-nav-overlay, .rin-host, .sh-sec--close",
    "--vp",
    `${vp[0]}x${vp[1]}`,
    /* ⚠ THE GATE COUNTS THE WHOLE PAGE; the rubric's twelve (A2) is per STILL.
       A five-section page letters a gold kicker per section plus its lit
       node, its open step, its CTA and its emphasis run, so the whole-page
       budget is two stills' worth. The per-still number is the probe's
       `accentInView` on every manifest row. */
    "--budget",
    "24",
    "--port",
    PORT,
  ];
  const t0 = Date.now();
  /* ⚠ MSYS PATH CONVERSION. Under Git Bash a child's argument that starts
     with `/` (here the ROUTE, `/home-sessions`) is rewritten into a Windows
     path — `C:/Program Files/Git/home-sessions` — before the child sees it,
     and the gate then navigates to nonsense. `MSYS_NO_PATHCONV` turns the
     conversion off for this one child; PowerShell never had the problem. */
  const r = spawnSync(process.execPath, argv, {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 240000,
    env: { ...process.env, MSYS_NO_PATHCONV: "1", MSYS2_ARG_CONV_EXCL: "*" },
  });
  const out = (r.stdout || "") + (r.stderr || "");
  const lines = out.split(/\r?\n/).filter(Boolean);
  return { code: r.status ?? -1, seconds: +((Date.now() - t0) / 1000).toFixed(1), tail: lines.slice(-12) };
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
    const prior = fs.existsSync(file) ? fs.readFileSync(file, "utf8").trimEnd() : "";
    const body = rows.map((r) => JSON.stringify(r)).join("\n");
    fs.writeFileSync(file, (prior ? prior + "\n" : "") + body + "\n");
  }
}
const nn = (n) => String(n).padStart(2, "0");

/* ── Modes ─────────────────────────────────────────────────────────────────*/
async function newPage(browser, vp) {
  const ctx = await browser.newContext({
    viewport: { width: vp[0], height: vp[1] },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
  return { ctx, page, errors };
}

async function shootWave(browser, ship, waveDir) {
  const types = ship.types.filter((t) => !ONLY_TYPES.length || ONLY_TYPES.includes(t.id));
  const cells = [];
  for (const t of types) for (const theme of THEMES) for (const d of DIRECTIONS) cells.push({ t, theme, d });
  console.log(
    `  wave ${WAVE}${SETTING === "default" ? "" : "-" + SETTING} at ${VIEWPORT.join("x")}: ${types.length} types x ${THEMES.length} themes x ${DIRECTIONS.length} directions = ${cells.length} cells`
  );
  const report = { wave: WAVE, setting: SETTING, viewport: VIEWPORT.join("x"), when: new Date().toISOString(), cells: [] };
  const mechLog = [];
  let failed = 0;

  for (const c of cells) {
    const subject = subjectOf(c.theme);
    const lane = laneOf(c.d);
    const knobs = knobsOf(c.d);
    const query = `?k=${c.d.id}&theme=${c.theme}`;
    const href = `http://localhost:${PORT}${c.t.route}${query}`;
    const folder = path.join(waveDir, `${c.t.id} - ${c.t.name}`);
    const cell = { type: c.t.id, theme: c.theme, direction: c.d.id, lane, href, stills: [], gates: [] };
    process.stdout.write(`    ${c.t.id} ${subject} ${c.d.id} `);

    const mech = runMech(`${c.t.route}${query}`, c.theme, VIEWPORT);
    if (mech) {
      mechLog.push({ type: c.t.id, theme: c.theme, direction: c.d.id, url: href, ...mech });
      cell.mech = { code: mech.code, seconds: mech.seconds };
      if (mech.code === 2) {
        console.log("REFUSED (mechanical exit 2)");
        cell.gates.push("mechanical exit 2");
        report.cells.push(cell);
        failed++;
        continue;
      }
    }

    const { ctx, page, errors } = await newPage(browser, VIEWPORT);
    const t0 = Date.now();
    try {
      await page.goto(href, { waitUntil: "domcontentloaded", timeout: 120000 });
      await settle(page, c.d.id);
      await stillLife(page, null);
      const probe = await page.evaluate(probeFn);
      cell.probe = probe;
      const sections = await page.evaluate(() =>
        [...document.querySelectorAll(".sh-sec[data-sh-arrangement]")].map((s) => ({
          id: s.id,
          kind: s.getAttribute("data-sh-arrangement"),
          top: Math.round(s.getBoundingClientRect().top + scrollY),
        }))
      );
      const N = sections.length;
      for (let i = 0; i < N; i++) {
        const s = sections[i];
        await scrollToY(page, i === 0 ? 0 : Math.max(0, s.top - PIN));
        await stillLife(page, s.id);
        let stack = null;
        if (s.kind === "console" && knobs.card === "stack") {
          stack = await driveStack(page, s.id, VIEWPORT);
          await stillLife(page, s.id);
        }
        const inView = (await page.evaluate(probeFn)).accentInView;
        const file = `${c.t.id}-${subject}__${lane}_${nn(i + 1)}.png`;
        fs.mkdirSync(folder, { recursive: true });
        await page.screenshot({ path: path.join(folder, file), animations: "disabled" });
        const seconds = +((Date.now() - t0) / 1000).toFixed(2);
        cell.stills.push(file);
        addRow(folder, {
          file,
          slot: `${c.t.id}-${subject}`,
          draw: i + 1,
          model: "chromium (playwright)",
          model_lane: lane,
          seconds,
          references: [path.join(REGISTER, `${subject}.png`)],
          reference_names: [`${subject}.png`],
          settings: { ar: "16:9", size: VIEWPORT.join("x"), quality: "dsf1", setting: SETTING },
          prompt: href,
          meta: {
            /* `type_name`, `question` and `channel` are what `qa.py` prints
               on THE IMAGE TYPE line (wave.py writes them for a drawn wave). */
            type: c.t.id,
            type_name: c.t.name,
            question: c.t.question,
            page: c.t.name,
            route: c.t.route,
            theme: c.theme,
            subject,
            viewport: VIEWPORT.join("x"),
            setting: SETTING,
            direction: c.d.id,
            knobs,
            still: `${i + 1} of ${N}`,
            section: { index: i + 1, id: s.id, kind: s.kind },
            stack,
            accentInView: inView,
            mech: cell.mech ?? null,
            subject_noun: `${c.t.name}, ${c.theme} theme at ${VIEWPORT.join("x")}, still ${i + 1} of ${N}: section "${s.id}" (${s.kind}); direction ${c.d.id}, ${knobStr(knobs)}`,
            channel: `${s.kind} - ${s.id}`,
          },
        });
      }
      // Gates, on the house lane only: a direction failing a probe is the finding.
      if (c.d.id === "SB") {
        const fams = probe.families.filter((f) => !/PT Mono|PP Neue Montreal/i.test(f));
        if (fams.length) cell.gates.push(`third face: ${fams.join(", ")}`);
        if (probe.radii > 0) cell.gates.push(`${probe.radii} rounded corners`);
        if (probe.bold > 0) cell.gates.push(`${probe.bold} bold nodes`);
        if (probe.minPx < 8.5) cell.gates.push(`minPx ${probe.minPx}`);
        if (probe.violations.length) cell.gates.push(`variety: ${probe.violations.join("; ")}`);
        if (errors.length) cell.gates.push(`page errors: ${errors.join(" | ")}`);
        if (probe.theme !== c.theme) cell.gates.push(`theme ${probe.theme}, wanted ${c.theme}`);
      }
      if (cell.gates.length) failed++;
      console.log(
        `${N} stills` +
          (cell.mech ? ` mech ${cell.mech.code}` : "") +
          ` accent ${probe.accent} radii ${probe.radii} minPx ${probe.minPx} fams ${probe.families.length}` +
          (cell.gates.length ? `  GATE: ${cell.gates.join("; ")}` : "")
      );
    } catch (err) {
      cell.gates.push(`capture failed: ${String(err.message).slice(0, 200)}`);
      failed++;
      console.log(`FAILED ${String(err.message).slice(0, 120)}`);
    } finally {
      await ctx.close();
    }
    report.cells.push(cell);
  }
  fs.mkdirSync(waveDir, { recursive: true });
  fs.writeFileSync(path.join(waveDir, "report.json"), JSON.stringify(report, null, 2));
  if (mechLog.length) fs.writeFileSync(path.join(waveDir, "mechanical.json"), JSON.stringify(mechLog, null, 2));
  return failed;
}

/** The negative pole: today's OLD /arcs, from the pre-change tree, lane `sa`. */
async function shootControl(browser, ship, waveDir) {
  if (!POLE?.routes) {
    console.error("  the registry has no negative pole with routes");
    return 1;
  }
  let failed = 0;
  const negDir = SETTING === "default" ? NEGATIVE : path.join(NEGATIVE, SETTING);
  fs.mkdirSync(negDir, { recursive: true });
  for (const [typeId, route] of Object.entries(POLE.routes)) {
    const t = ship.types.find((x) => x.id === typeId);
    if (!t || (ONLY_TYPES.length && !ONLY_TYPES.includes(typeId))) continue;
    for (const theme of THEMES) {
      const subject = subjectOf(theme);
      const href = `http://localhost:${PORT_OLD}${route}?theme=${theme}`;
      const folder = path.join(waveDir, `${t.id} - ${t.name}`);
      const { ctx, page, errors } = await newPage(browser, VIEWPORT);
      const t0 = Date.now();
      process.stdout.write(`    control ${t.id} ${subject} `);
      try {
        await page.goto(href, { waitUntil: "networkidle", timeout: 120000 });
        await page.waitForSelector(".arc-root", { timeout: 60000 });
        await page.waitForFunction(() => document.documentElement.getAttribute("data-theme") !== null, null, { timeout: 10000 }).catch(() => {});
        const total = await page.evaluate(() => document.documentElement.scrollHeight);
        const step = Math.round(VIEWPORT[1] * 0.9);
        const N = Math.max(1, Math.min(MAX_CONTROL_STILLS, Math.ceil((total - VIEWPORT[1]) / step) + 1));
        for (let i = 0; i < N; i++) {
          await scrollToY(page, i * step);
          await stillLife(page, null);
          const file = `${t.id}-${subject}__${laneOf(POLE)}_${nn(i + 1)}.png`;
          fs.mkdirSync(folder, { recursive: true });
          const dest = path.join(folder, file);
          await page.screenshot({ path: dest, animations: "disabled" });
          fs.copyFileSync(dest, path.join(negDir, file));
          addRow(folder, {
            file,
            slot: `${t.id}-${subject}`,
            draw: i + 1,
            model: "chromium (playwright)",
            model_lane: laneOf(POLE),
            seconds: +((Date.now() - t0) / 1000).toFixed(2),
            references: [path.join(REGISTER, `${subject}.png`)],
            reference_names: [`${subject}.png`],
            settings: { ar: "16:9", size: VIEWPORT.join("x"), quality: "dsf1", setting: SETTING },
            prompt: href,
            meta: {
              type: t.id,
              type_name: t.name,
              question: POLE.question,
              page: t.name,
              route,
              theme,
              subject,
              viewport: VIEWPORT.join("x"),
              setting: SETTING,
              direction: POLE.id,
              pole: "negative",
              still: `${i + 1} of ${N}`,
              section: { index: i + 1, id: `screen-${i + 1}`, kind: "old-arcs" },
              subject_noun: `${t.name} BEFORE the sheet (the negative pole, ${POLE.shape}), ${theme} theme at ${VIEWPORT.join("x")}, screen ${i + 1} of ${N}`,
              channel: `old arcs - screen ${i + 1}`,
            },
          });
        }
        console.log(`${N} stills${errors.length ? "  errors: " + errors.join(" | ") : ""}`);
      } catch (err) {
        failed++;
        console.log(`FAILED ${String(err.message).slice(0, 120)}`);
      } finally {
        await ctx.close();
      }
    }
  }
  return failed;
}

/** The site's own fixture panels: block A must pass one and fail the other. */
async function shootFixture(browser, ship, waveDir) {
  const t = ship.types.find((x) => x.id === "SK");
  if (!t) return 1;
  let failed = 0;
  for (const theme of THEMES) {
    const subject = subjectOf(theme);
    const href = `http://localhost:${PORT}/test/design-eval-fixture?theme=${theme}`;
    const folder = path.join(waveDir, `${t.id} - ${t.name}`);
    const { ctx, page } = await newPage(browser, VIEWPORT);
    process.stdout.write(`    fixture ${subject} `);
    try {
      await page.goto(href, { waitUntil: "networkidle", timeout: 120000 });
      await page.waitForTimeout(600);
      for (const [lane, sel] of [
        ["lawful", ".fixture-good"],
        ["broken", ".fixture-bad"],
      ]) {
        const file = `${t.id}-${subject}__${lane}_01.png`;
        fs.mkdirSync(folder, { recursive: true });
        await page.locator(sel).first().screenshot({ path: path.join(folder, file), animations: "disabled" });
        addRow(folder, {
          file,
          slot: `${t.id}-${subject}`,
          draw: 1,
          model: "chromium (playwright)",
          model_lane: lane,
          seconds: 0,
          references: [path.join(REGISTER, `${subject}.png`)],
          reference_names: [`${subject}.png`],
          settings: { ar: "16:9", size: VIEWPORT.join("x"), quality: "dsf1", setting: SETTING },
          prompt: href + " " + sel,
          meta: {
            type: t.id,
            type_name: t.name,
            question: `the site's own fixture: does block A pass the lawful panel and fail the broken one? (lane ${lane})`,
            page: "design-eval fixture",
            route: "/test/design-eval-fixture",
            theme,
            subject,
            viewport: VIEWPORT.join("x"),
            setting: SETTING,
            direction: lane,
            still: "1 of 1",
            section: { index: 1, id: sel.slice(1), kind: "fixture" },
            subject_noun: `the site's ${lane} fixture panel (${sel}), ${theme} theme: graded on block A alone`,
            channel: `fixture - ${lane}`,
          },
        });
      }
      console.log("2 stills");
    } catch (err) {
      failed++;
      console.log(`FAILED ${String(err.message).slice(0, 120)}`);
    } finally {
      await ctx.close();
    }
  }
  return failed;
}

/** A generic read of a reference first screen — the register's numbers. */
function registerProbeFn() {
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  const struct = new Map();
  const fams = new Map();
  let radii = 0,
    text = 0,
    bold = 0,
    rules = 0;
  const hues = new Set();
  const hueOf = (s) => {
    const m = String(s).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,/]/).map((x) => parseFloat(x));
    if (p.length > 3 && p[3] < 0.05) return null;
    const [r, g, b] = p.map((v) => v / 255);
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    if (max - min < 0.08) return "neutral";
    let h = 0;
    if (max === r) h = (g - b) / (max - min);
    else if (max === g) h = 2 + (b - r) / (max - min);
    else h = 4 + (r - g) / (max - min);
    return String(Math.round((((h * 60 + 360) % 360) / 30)) * 30);
  };
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    const bx = el.getBoundingClientRect();
    if (bx.width < 1 || bx.height < 1 || bx.top > innerHeight || bx.bottom < 0) continue;
    if (cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) === 0) continue;
    if (parseFloat(cs.borderTopLeftRadius) > 0.5) radii++;
    const thin = bx.height <= 2.5 || bx.width <= 2.5;
    if (thin && cs.backgroundColor !== "rgba(0, 0, 0, 0)" && (bx.width >= 40 || bx.height >= 40)) {
      rules++;
      bump(struct, cs.backgroundColor);
    }
    for (const s of ["Top", "Bottom", "Left", "Right"])
      if (parseFloat(cs["border" + s + "Width"]) > 0 && cs["border" + s + "Style"] !== "none" && (bx.width >= 40 || bx.height >= 40)) {
        rules++;
        bump(struct, cs["border" + s + "Color"]);
      }
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (hasText) {
      text++;
      if (+cs.fontWeight > 500) bold++;
      bump(fams, cs.fontFamily.split(",")[0].replace(/"/g, "").trim());
      const h = hueOf(cs.color);
      if (h && h !== "neutral") hues.add(h);
    }
    for (const c of [cs.backgroundColor, cs.borderTopColor]) {
      const h = hueOf(c);
      if (h && h !== "neutral") hues.add(h);
    }
  }
  return {
    url: location.href,
    title: document.title,
    ground: getComputedStyle(document.body).backgroundColor,
    rules,
    structureColours: struct.size,
    radii,
    text,
    bold,
    boldShare: text ? +(bold / text).toFixed(3) : 0,
    families: [...fams.entries()].sort((a, b) => b[1] - a[1]).map(([f]) => f).slice(0, 4),
    hues: [...hues],
  };
}

/** The two register strips: three reference first screens stacked per theme. */
async function makeRegister(browser) {
  const { default: sharp } = await import("sharp");
  const srcFile = path.join(REGISTER, "sources.json");
  if (!fs.existsSync(srcFile)) {
    console.error("  no " + srcFile);
    return 1;
  }
  const sources = JSON.parse(fs.readFileSync(srcFile, "utf8"));
  const shots = path.join(REGISTER, "_shots");
  const readings = path.join(REGISTER, "readings");
  fs.mkdirSync(shots, { recursive: true });
  fs.mkdirSync(readings, { recursive: true });
  const W = 1440,
    H = 900;
  let failed = 0;
  for (const [subject, list] of Object.entries(sources)) {
    if (!Array.isArray(list)) continue; // the file's own `$comment`
    const layers = [];
    for (const src of list) {
      const shot = path.join(shots, `${src.site}.png`);
      process.stdout.write(`    register ${subject} ${src.site} `);
      try {
        if (src.url) {
          const { ctx, page } = await newPage(browser, [W, H]);
          try {
            await page.goto(src.url, { waitUntil: "domcontentloaded", timeout: 60000 });
            await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
            // Cookie banners: click the first obvious consent button, then wait.
            for (const rx of [/^accept( all)?$/i, /^i agree$/i, /^got it$/i, /^ok(ay)?$/i, /^allow all$/i, /accept/i]) {
              const btn = page.getByRole("button", { name: rx }).first();
              if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
                await btn.click({ timeout: 2000 }).catch(() => {});
                break;
              }
            }
            await page.waitForTimeout(1800);
            await page.evaluate(() => window.scrollTo(0, 0));
            await page.waitForTimeout(400);
            await page.screenshot({ path: shot, animations: "disabled" });
            const reading = await page.evaluate(registerProbeFn);
            fs.writeFileSync(path.join(readings, `${src.site}.json`), JSON.stringify({ site: src.site, ...reading, when: new Date().toISOString() }, null, 2));
            console.log(`shot; rules ${reading.rules} radii ${reading.radii} fams ${reading.families.join("/")}`);
          } finally {
            await ctx.close();
          }
        } else if (src.file) {
          const meta = await sharp(src.file).metadata();
          const resized = sharp(src.file).resize({ width: W, withoutEnlargement: false });
          const h = Math.round(((meta.height ?? H) * W) / (meta.width ?? W));
          if (h >= H) await resized.extract({ left: 0, top: 0, width: W, height: H }).png().toFile(shot);
          else await resized.extend({ bottom: H - h, background: subject === "void" ? "#0a0908" : "#ebe3d6" }).png().toFile(shot);
          fs.writeFileSync(path.join(readings, `${src.site}.json`), JSON.stringify({ site: src.site, file: src.file, note: "a local reference still; no live reading", when: new Date().toISOString() }, null, 2));
          console.log("from file");
        }
        layers.push({ input: shot, top: layers.length * H, left: 0 });
      } catch (err) {
        failed++;
        console.log(`FAILED ${String(err.message).slice(0, 120)}`);
      }
    }
    if (layers.length !== 3) {
      console.error(`    ${subject}: ${layers.length} of 3 sources landed; the strip is not written`);
      failed++;
      continue;
    }
    // Every layer is normalised to exactly W×H before compositing.
    const norm = [];
    for (const l of layers) {
      const p = l.input.replace(/\.png$/, ".norm.png");
      await sharp(l.input).resize({ width: W, height: H, fit: "cover", position: "top" }).png().toFile(p);
      norm.push({ input: p, top: l.top, left: 0 });
    }
    await sharp({ create: { width: W, height: H * 3, channels: 3, background: subject === "void" ? "#0a0908" : "#ebe3d6" } })
      .composite(norm)
      .png()
      .toFile(path.join(REGISTER, `${subject}.png`));
    console.log(`    ${subject}.png written (${W}x${H * 3})`);
  }
  return failed;
}

/* ── Main ──────────────────────────────────────────────────────────────────*/
(async () => {
  const ship = readShip();
  assertMirror(ship);

  if (DRY) {
    console.log(`  registry: ${DRAWABLE.map((d) => d.id).join(" ")} + pole ${POLE?.id}; ship lanes: ${Object.keys(ship.lanes).join(" ")}`);
    console.log(`  types: ${ship.types.map((t) => `${t.id} ${t.route}`).join(" · ")}`);
    console.log(`  setting ${SETTING} = ${VIEWPORT.join("x")}; themes ${THEMES.join(",")}; directions ${DIRECTIONS.map((d) => d.id).join(",")}`);
    for (const t of ship.types) {
      const href = `http://localhost:${PORT}${t.route}`;
      const status = await fetch(href).then((r) => r.status).catch((e) => `ERR ${e.message}`);
      console.log(`    ${t.id} ${href} -> ${status}`);
    }
    if (POLE?.routes)
      for (const [typeId, route] of Object.entries(POLE.routes)) {
        const href = `http://localhost:${PORT_OLD}${route}`;
        const status = await fetch(href).then((r) => r.status).catch((e) => `ERR ${e.message}`);
        console.log(`    pole ${typeId} ${href} -> ${status}`);
      }
    process.exit(0);
  }

  const browser = await chromium.launch({ headless: !HEADED });
  let failed = 0;
  try {
    if (MODE_REGISTER) failed += await makeRegister(browser);
    if (WAVE) {
      const waveDir = path.join(WAVES, WAVE + (SETTING === "default" ? "" : "-" + SETTING));
      fs.mkdirSync(waveDir, { recursive: true });
      if (MODE_CONTROL) failed += await shootControl(browser, ship, waveDir);
      if (MODE_FIXTURE) failed += await shootFixture(browser, ship, waveDir);
      if (!MODE_CONTROL && !MODE_FIXTURE && !MODE_REGISTER) failed += await shootWave(browser, ship, waveDir);
      flushManifests();
      console.log(`  wrote ${waveDir}`);
    }
  } finally {
    await browser.close();
  }
  if (failed) {
    console.log(`  ${failed} cell(s) failed a gate or a capture`);
    process.exit(1);
  }
})();
