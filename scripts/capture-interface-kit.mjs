#!/usr/bin/env node
/**
 * capture-interface-kit — the bridge from `/test/interface-kit` into the
 * armada's wave grammar.
 *
 * It shoots one still per (direction × viewport × theme), plus one CONTROL
 * still per (viewport × theme) from the shipped panel, and writes them into a
 * wave folder the armada's own tools read unchanged:
 *
 *     node scripts/capture-interface-kit.mjs --wave 2026-09-05-kit-01
 *
 *     <eval>/control/v0-<viewport>-<theme>.png            the six controls
 *     <eval>/waves/<wave>/<TYPE> - <Name>/<file>.png      sixty candidates
 *     <eval>/waves/<wave>/<TYPE> - <Name>/MANIFEST.jsonl  one row per still
 *     <eval>/waves/<wave>/report.json                     the probe's own read
 *
 * then, from the ship at `<eval>/armada`:
 *
 *     python tools/doctor.py
 *     python tools/qa.py --batch ../waves/<wave> --runs 3
 *     python tools/make_contact_sheet.py ../waves/<wave> --sort type
 *     python tools/pick.py ../waves/<wave>
 *     python tools/make_review_gallery.py ../waves/<wave>
 *
 * ── THE THINGS THIS SCRIPT KNOWS THAT A GENERIC ONE WOULD NOT ────────────────
 *
 * ⚠ THE FILENAME GRAMMAR TAKES LETTERS BEFORE THE FIRST DASH. `config.parse_name`
 * matches `^([A-Z]+)-([a-z0-9-]+)(__suffix)?__([a-z0-9]+)_(\d\d)`, and an id
 * like `K1` falls to its unknown-shape branch — lane empty, draw 0 — with no
 * error anywhere, so every tool downstream reads a different file than this one
 * wrote. The registry's ids are `KA…KJ` for that reason and this script asserts
 * it rather than trusting it.
 *
 * ⚠ THE WAIT IS ON A VALUE THE PAGE COMPUTED, NEVER ONE THIS SCRIPT SET. The
 * stamp's tail carries the nav sector and the live `.hud__rail` height, both
 * read off the DOM after two frames. A gate that waits on a number the script
 * provided is not a gate — the substrate lab lost a whole round to exactly that,
 * gating on `location.search` which it had set itself.
 *
 * ⚠ `reducedMotion: "no-preference"` IS MANDATORY. Under PRM the casefile is a
 * static document and the panel view is not the composition being judged.
 *
 * ⚠ THE THEME COMES FROM `?theme=`, NEVER `colorScheme`. This site's theme is a
 * pre-paint attribute written by its own store; emulating a colour scheme
 * changes nothing and every light still would be a dark one.
 *
 * ⚠ AND THE REGISTRY IS READ BY EXPLICIT PATH, NEVER SEARCHED FOR. The site
 * tree is large enough that a recursive walk costs minutes.
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

import { probeFn } from "./design-eval/probe.mjs";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const has = (f) => args.includes(f);

const ROOT = process.cwd();
const REGISTRY = path.join(ROOT, "lib", "interface-kit", "directions.json");
const EVAL = path.join(ROOT, ".claude", "skills", "thoughtform-design", "eval");
const SHIP_TOML = path.join(EVAL, "armada", "armada.toml");

const PORT = argOf("--port", "3003");
const WAVE = argOf("--wave", "");
const ONLY_DIR = argOf("--dir", "");
const ONLY_VP = argOf("--vp", "");
const ONLY_THEME = argOf("--theme", "");
const HEADED = has("--headed");
const DRY = has("--dry-run");
const SKIP_CONTROLS = has("--no-controls");

if (!WAVE && !DRY) {
  console.error("  --wave <name> is required (e.g. 2026-09-05-kit-01)");
  process.exit(2);
}

const reg = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
const DIRECTIONS = reg.directions.filter((d) => !ONLY_DIR || d.id === ONLY_DIR);
const VIEWPORTS = reg.wave.viewports.filter((v) => !ONLY_VP || v === ONLY_VP);
const THEMES = reg.wave.themes.filter((t) => !ONLY_THEME || t === ONLY_THEME);
const LANE = reg.wave.lane;
const KNOB_KEYS = Object.keys(reg.knobs);
const DEFAULTS = Object.fromEntries(KNOB_KEYS.map((k) => [k, reg.knobs[k].values[0]]));

/* ── The mirror ──────────────────────────────────────────────────────────────
 * Two files describe the directions: this registry, which the page draws from,
 * and the ship's `[types]`, which the rubric grades. They are kept in step
 * deliberately rather than shared across repos — so the drift is checked here,
 * loudly, with the block to paste. A type without a direction grades a still
 * nobody shot; a direction without a type shoots a still nobody grades. */
function assertMirror() {
  if (!fs.existsSync(SHIP_TOML)) {
    console.error("  no ship at " + SHIP_TOML);
    process.exit(2);
  }
  const toml = fs.readFileSync(SHIP_TOML, "utf8");
  const inToml = [...toml.matchAll(/^\[types\.([A-Z]+)\]/gm)].map((m) => m[1]);
  const inReg = reg.directions.map((d) => d.id);
  const missing = inReg.filter((id) => !inToml.includes(id));
  const extra = inToml.filter((id) => !inReg.includes(id));
  const badId = inReg.filter((id) => !/^[A-Z]+$/.test(id));

  if (badId.length) {
    console.error("  TYPE IDS MUST BE LETTERS ONLY — the armada filename grammar");
    console.error("  takes letters before the first dash. Offending: " + badId.join(", "));
    process.exit(2);
  }
  if (!missing.length && !extra.length) return;

  console.error("  THE REGISTRY AND THE SHIP HAVE DRIFTED.");
  if (extra.length)
    console.error("    in armada.toml, not in directions.json: " + extra.join(", "));
  if (missing.length) {
    console.error("    in directions.json, not in armada.toml: " + missing.join(", "));
    console.error("\n  Paste into armada.toml:\n");
    for (const id of missing) {
      const d = reg.directions.find((x) => x.id === id);
      const knobs = Object.entries(d.knobs);
      console.error(`[types.${d.id}]`);
      console.error(`name = ${JSON.stringify(d.name)}`);
      console.error(`question = ${JSON.stringify(d.question)}`);
      console.error(`channel = "proof casefile - desktop"`);
      console.error(`ar = "16:9"`);
      console.error(
        `camera = ${JSON.stringify(knobs.length ? knobs.map(([k, v]) => `${k}=${v}`).join(" ") : "no knob moved")}`
      );
      console.error(`position = ${JSON.stringify(knobs.length ? knobs[0][0] : "the control")}`);
      console.error(`shape = ${JSON.stringify(d.shape)}\n`);
    }
  }
  process.exit(2);
}

/* ── The probe ───────────────────────────────────────────────────────────────
 * Lives in `scripts/design-eval/probe.mjs` since ADR-149, so the lattice's
 * capture runs the same measurement; the body is unchanged and it is still
 * passed to `page.evaluate` as a plain serialisable function. Every still
 * carries its own numbers into the manifest and the wave log — the human's
 * half: `qa.py` never sees these, because a grader handed the answer stops
 * looking. */

const url = (q) => `http://localhost:${PORT}/test/interface-kit?${q}`;
const knobQuery = (knobs) => KNOB_KEYS.map((k) => `${k}=${knobs[k] ?? DEFAULTS[k]}`).join("&");

async function settle(page, want) {
  await page.waitForFunction(
    (w) => {
      const el = document.querySelector(".ik-read");
      const s = el?.getAttribute("data-stamp") || "";
      if (!s.startsWith(w)) return false;
      // The tail the script cannot set: a sector name and a live rail height.
      const tail = s.slice(w.length).split("|");
      return tail.length >= 3 && tail[tail.length - 1] !== "0";
    },
    want,
    { timeout: 60000 }
  );
  await page.waitForTimeout(450);
}

(async () => {
  assertMirror();

  const cells = [];
  for (const vp of VIEWPORTS)
    for (const theme of THEMES) {
      if (!SKIP_CONTROLS) cells.push({ kind: "control", vp, theme });
      for (const d of DIRECTIONS) cells.push({ kind: "candidate", vp, theme, d });
    }

  console.log(
    `  wave ${WAVE || "(dry)"} — ${DIRECTIONS.length} directions x ${VIEWPORTS.length} viewports x ${THEMES.length} themes` +
      (SKIP_CONTROLS ? "" : ` + ${VIEWPORTS.length * THEMES.length} controls`) +
      ` = ${cells.length} stills`
  );
  if (DRY) {
    for (const c of cells.slice(0, 6))
      console.log(
        "    " + (c.kind === "control" ? "control" : c.d.id) + " " + c.vp + " " + c.theme
      );
    console.log("    …");
    process.exit(0);
  }

  const waveDir = path.join(EVAL, "waves", WAVE);
  const controlDir = path.join(EVAL, "control");
  fs.mkdirSync(controlDir, { recursive: true });

  const browser = await chromium.launch({ headless: !HEADED });
  const report = { wave: WAVE, when: new Date().toISOString(), cells: [] };
  const manifests = new Map();
  let failed = 0;

  for (const c of cells) {
    const [w, h] = c.vp.split("x").map(Number);
    const subject = `${c.vp}-${c.theme}`;
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));

    const t0 = Date.now();
    try {
      const knobs = c.kind === "control" ? DEFAULTS : { ...DEFAULTS, ...c.d.knobs };
      const mount = c.kind === "control" ? "shipped" : "kit";
      const q = `view=panel&mount=${mount}&${knobQuery(knobs)}&theme=${c.theme}&console=0`;
      const href = url(q);
      await page.goto(href, { waitUntil: "domcontentloaded", timeout: 120000 });
      await settle(page, `${mount}|panel|`);

      const probe = await page.evaluate(probeFn);

      let file, dest;
      if (c.kind === "control") {
        file = `v0-${subject}.png`;
        dest = path.join(controlDir, file);
      } else {
        const folder = `${c.d.id} - ${c.d.name}`;
        file = `${c.d.id}-${subject}__${LANE}_01.png`;
        dest = path.join(waveDir, folder, file);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
      }
      await page.screenshot({ path: dest, animations: "disabled" });
      const seconds = +((Date.now() - t0) / 1000).toFixed(2);

      if (c.kind === "candidate") {
        const folder = `${c.d.id} - ${c.d.name}`;
        const row = {
          file,
          slot: `${c.d.id}-${subject}`,
          draw: 1,
          model: "chromium (playwright)",
          model_lane: LANE,
          seconds,
          /* ⚠ ABSOLUTE, AND IT IS THE CONTROL. `refs.py` resolves the subject's
             own `identity` for the grader; this row is what the GALLERY reads,
             so the two must name the same file or a reviewer compares a still
             with a different one than the grade did. */
          references: [path.join(controlDir, `v0-${subject}.png`)],
          reference_names: [`v0-${subject}.png`],
          settings: { ar: "16:9", size: c.vp, quality: "dsf1" },
          prompt: href,
          meta: {
            type: c.d.id,
            type_name: c.d.name,
            question: c.d.question,
            channel: "proof casefile - desktop",
            subject,
            subject_noun: `shipped proof panel, ${c.vp}, ${c.theme}`,
            aspect: "16:9",
            camera:
              Object.entries(c.d.knobs)
                .map(([k, v]) => `${k}=${v}`)
                .join(" ") || "no knob moved",
            position: Object.keys(c.d.knobs)[0] ?? "the control",
            shape: c.d.shape,
            wave: WAVE,
            setting: "default",
            repair: false,
            suffix: "",
            knobs,
            viewport: c.vp,
            theme: c.theme,
            probe,
          },
          timestamp: new Date().toISOString(),
          ok: errors.length === 0,
        };
        if (!manifests.has(folder)) manifests.set(folder, []);
        manifests.get(folder).push(row);
      }

      report.cells.push({
        kind: c.kind,
        id: c.kind === "control" ? "v0" : c.d.id,
        subject,
        probe,
        errors,
      });
      const tag = c.kind === "control" ? "v0  " : c.d.id + "  ";
      console.log(
        `  ${tag} ${subject.padEnd(17)} accent ${String(probe.accent).padStart(3)}` +
          ` bold ${String(probe.bold).padStart(2)} rungs ${String(probe.rungs).padStart(2)}` +
          ` minPx ${String(probe.minPx).padStart(4)} radii ${probe.radii}` +
          ` t0 ${probe.t0.match ? "ok" : "DRIFT " + probe.t0.fl + "/" + probe.t0.ik}` +
          ` seat ${probe.seat && Math.abs(probe.seat.off) <= 1 ? "ok" : "OFF " + probe.seat?.off}` +
          (errors.length ? "  ERRORS " + errors.length : "")
      );
    } catch (e) {
      failed++;
      console.log(
        `  FAIL ${c.kind === "control" ? "v0" : c.d.id} ${subject}: ${e.message.slice(0, 120)}`
      );
    }
    await ctx.close();
  }
  await browser.close();

  for (const [folder, rows] of manifests) {
    const p = path.join(waveDir, folder, "MANIFEST.jsonl");
    fs.writeFileSync(p, rows.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
  }
  fs.mkdirSync(waveDir, { recursive: true });
  fs.writeFileSync(path.join(waveDir, "report.json"), JSON.stringify(report, null, 1), "utf8");

  /* ── The gates ─────────────────────────────────────────────────────────────
   * ⚠ ONLY THE CONTROL CAN FAIL THIS SCRIPT. A DIRECTION FAILING A GATE IS THE
   * FINDING — that is what the wave is for, and a capture that refuses to write
   * a still because the still is interesting has confused itself with the
   * rubric. What the control must satisfy is only that the harness is sane:
   * two faces, no radius, nothing under the floor, no page error, and the
   * kit's own `--ik-t0` still equal to the surface's `--fl-t0`. */
  const controls = report.cells.filter((c) => c.kind === "control" && c.probe && !c.probe.err);
  const bad = [];
  for (const c of controls) {
    const p = c.probe;
    if (!p.t0.match) bad.push(`${c.subject}: --ik-t0 ${p.t0.ik} != --fl-t0 ${p.t0.fl}`);
    if (p.seat && Math.abs(p.seat.off) > 1)
      bad.push(
        `${c.subject}: the panel is ${p.seat.off}px off its seat (want ${p.seat.want}, got ${p.seat.got})`
      );
    if (p.seat && p.seat.hzOff !== null && Math.abs(p.seat.hzOff) > 1)
      bad.push(`${c.subject}: the housing is ${p.seat.hzOff}px off the band edge`);
    if (p.radii > 0) bad.push(`${c.subject}: ${p.radii} rounded corners`);
    if (p.minPx < 8.5) bad.push(`${c.subject}: type floor ${p.minPx}px`);
    if (p.families.length > 2)
      bad.push(`${c.subject}: ${p.families.length} faces — ${p.families.join(", ")}`);
    if (c.errors.length) bad.push(`${c.subject}: ${c.errors.length} page errors`);
  }
  /* And the recomposition must still BE the control, or `KA` is a direction
     wearing a control's name. Boxes, not pixels: the tab strip runs a decode on
     mount and a pixel diff would fail on a letter mid-scramble. */
  for (const vp of VIEWPORTS)
    for (const theme of THEMES) {
      const s = `${vp}-${theme}`;
      const ctl = report.cells.find((c) => c.kind === "control" && c.subject === s);
      const ka = report.cells.find((c) => c.id === "KA" && c.subject === s);
      if (!ctl || !ka || !ctl.probe?.boxes || !ka.probe?.boxes) continue;
      for (const k of Object.keys(ctl.probe.boxes))
        if (ctl.probe.boxes[k] !== ka.probe.boxes[k])
          bad.push(`${s}: KA's ${k} box ${ka.probe.boxes[k]} != control ${ctl.probe.boxes[k]}`);
    }

  console.log("");
  if (bad.length) {
    console.log("  CONTROL GATES FAILED:");
    for (const b of bad) console.log("    " + b);
  } else {
    console.log("  control gates: clean");
  }
  console.log(
    `  ${report.cells.length} stills, ${failed} failed, report at ${path.join(waveDir, "report.json")}`
  );
  process.exit(bad.length || failed ? 1 : 0);
})();
