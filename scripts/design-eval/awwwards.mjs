#!/usr/bin/env node
/**
 * design-eval/awwwards — the Awwwards jury for the lattice (ADR-149 §4).
 *
 * Scores a cell (direction × viewport × theme) on the Awwwards sheet — Design 40 ·
 * Usability 30 · Creativity 20 · Content 10, each 1–10 — against two anchors: the
 * committed control still at the cell's own viewport and theme (the NEGATIVE pole)
 * and the turnstone ship's register strip for the theme (the POSITIVE register).
 * Three runs, the median per category, the weighted total computed here, and the
 * USABILITY MEDIAN CAPPED AT 6.0 by the cell's measured report — which is what
 * makes "every category ≥ 7.5" a measurement rather than a self-report.
 *
 *   node scripts/design-eval/awwwards.mjs --wave lattice-01-r01 --runs 3 --log
 *   node scripts/design-eval/awwwards.mjs --shot first.png,full.png --vp 1280x720 --theme dark
 *   node scripts/design-eval/awwwards.mjs --self-test
 *   node scripts/design-eval/awwwards.mjs --wave lattice-01-r01 --dry-run
 *
 * ⚠ THE RUBRIC IS READ FROM DISK AT RUNTIME (`eval/awwwards.md`) — persona, categories,
 * anchors and the JSON schema. The red-flag vocabulary is parsed from `eval/rubric.md`
 * so the house has ONE closed list.
 *
 * ⚠ A MISSING ANCHOR MAKES THE RUN NOT AUTHORITATIVE, and an advisory run refuses `--log`.
 *
 * ⚠ THE JURY MODEL REJECTS `temperature`. Determinism is `--runs` and the median; the
 * request carries `output_config: { format, effort }` and no sampling parameter. If the
 * live call 400s on `output_config`, flip `--mode tool` (the schema as a strict tool's
 * `input_schema`, `tool_choice: auto` plus a naming instruction — forced tool use is
 * a 400 on this model family too).
 *
 * Exit 0 = every scored cell clears the threshold, 1 = any cell below (or the self-test
 * failed), 2 = could not run.
 */
import fs from "node:fs";
import path from "node:path";
import { loadEnv, makeClient, MODEL_DEFAULT_JURY } from "./_client.mjs";

// ── args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] !== undefined && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};
const has = (f) => args.includes(f);

if (has("--help") || has("-h")) {
  console.log(`awwwards — the Awwwards jury for the lattice (ADR-149 §4)

  --wave <name>        score every cell of a wave: <wave>, <wave>-laptop, <wave>-binding
  --shot a.png[,b.png] score one ad-hoc cell (first screen[, full page]); needs --vp and --theme
  --vp WxH             viewport of the ad-hoc cell (default 1280x720)
  --theme dark|light   theme of the ad-hoc cell (default dark)
  --k la,lb            lane filter (direction ids, lowercased)
  --runs N             runs per cell, the median is kept (default 3)
  --model <id>         default ${MODEL_DEFAULT_JURY}; claude-fable-5-1 for a stricter read
  --mode output_config|tool   how the schema is enforced (default output_config)
  --effort <level>     output_config.effort (default high)
  --threshold N        per-category bar (default 7.5)
  --anchors <dir>      override the eval root the anchors are read from
  --no-anchors         run without anchors → NOT AUTHORITATIVE, never logged
  --self-test          score the control stills and the register strips as candidates
  --out <dir>          where awwwards.json / awwwards.md land (default the wave folder)
  --log                append one line per cell to eval/EVAL_LOG.md
  --label <text>       a label for the log and the report
  --dry-run            print the cells, the images and the prompt skeleton; no API call
`);
  process.exit(0);
}

const WAVE = argOf("--wave", "");
const SHOT = argOf("--shot", "");
const VP = argOf("--vp", "1280x720");
const THEME = argOf("--theme", "dark");
const K = argOf("--k", "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const RUNS = Math.max(1, Number(argOf("--runs", "3")) || 3);
const MODEL = argOf("--model", MODEL_DEFAULT_JURY);
const MODE = argOf("--mode", "output_config");
const EFFORT = argOf("--effort", "high");
const THRESHOLD = Number(argOf("--threshold", "7.5")) || 7.5;
const LABEL = argOf("--label", "");
const SELF_TEST = has("--self-test");
const DRY = has("--dry-run");
const LOG = has("--log");
const NO_ANCHORS = has("--no-anchors");

if (!["output_config", "tool"].includes(MODE)) {
  console.error(`--mode must be output_config or tool, got "${MODE}"`);
  process.exit(2);
}
if (!WAVE && !SHOT && !SELF_TEST) {
  console.error(
    "pass --wave <name>, --shot <first.png[,full.png]> or --self-test (--help for the rest)"
  );
  process.exit(2);
}

// ── paths ────────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const EVAL = path.resolve(ROOT, ".claude/skills/thoughtform-design/eval");
const ANCHOR_ROOT = argOf("--anchors", EVAL);
const RUBRIC_PATH = path.join(EVAL, "awwwards.md");
const FLAGS_PATH = path.join(EVAL, "rubric.md");
const LOG_PATH = path.join(EVAL, "EVAL_LOG.md");
const WAVES_DIR = path.join(EVAL, "subpages/evals/waves");
const CELL_FOLDER = "LT - Lattice page";
/** The three settings a wave is shot at, in jury order — binding first. */
const SETTINGS = [
  { suffix: "-binding", setting: "binding", viewport: "1280x720" },
  { suffix: "-laptop", setting: "laptop", viewport: "1440x800" },
  { suffix: "", setting: "default", viewport: "1920x1247" },
];
const CATS = ["design", "usability", "creativity", "content"];
const WEIGHTS = { design: 0.4, usability: 0.3, creativity: 0.2, content: 0.1 };
const USABILITY_CAP = 6.0;
const SUBJECT_OF = { dark: "void", light: "parchment" };

// ── the rubric, read (never duplicated) ──────────────────────────────────────

if (!fs.existsSync(RUBRIC_PATH)) {
  console.error(`no rubric at ${RUBRIC_PATH} — the jury has no sheet to score against`);
  process.exit(2);
}
if (!fs.existsSync(FLAGS_PATH)) {
  console.error(`no rubric.md at ${FLAGS_PATH} — the red-flag vocabulary lives there`);
  process.exit(2);
}
const rubric = fs.readFileSync(RUBRIC_PATH, "utf8");

/**
 * The closed red-flag list is rubric.md's, parsed — the paragraph under the line that
 * declares it, up to the next blank line, every backticked token. ONE list for the house.
 */
function redFlagsFromRubric() {
  const lines = fs.readFileSync(FLAGS_PATH, "utf8").split(/\r?\n/);
  const at = lines.findIndex((l) => /`red_flags`\s*—\s*CLOSED vocabulary/.test(l));
  if (at < 0) throw new Error("rubric.md: could not find the `red_flags` — CLOSED vocabulary line");
  const flags = [];
  // The list is the first non-blank paragraph after the declaring line (rubric.md leaves
  // one blank line between them); it ends at the next blank line.
  let i = at + 1;
  while (i < lines.length && lines[i].trim() === "") i++;
  for (; i < lines.length && lines[i].trim() !== ""; i++) {
    for (const m of lines[i].matchAll(/`([a-z][a-z-]+)`/g)) flags.push(m[1]);
  }
  if (flags.length !== 15) {
    throw new Error(
      `rubric.md: expected 15 red flags, parsed ${flags.length}: ${flags.join(", ")}`
    );
  }
  return flags;
}

/** The JSON schema is the fenced block under `## Schema` in awwwards.md. */
function schemaFromRubric(flags) {
  const m = rubric.match(/## Schema[\s\S]*?```json\s*([\s\S]*?)```/);
  if (!m) throw new Error("awwwards.md: no ```json block under ## Schema");
  const schema = JSON.parse(m[1]);
  schema.properties.red_flags.items = { type: "string", enum: flags };
  return schema;
}

let RED_FLAGS;
let SCHEMA;
try {
  RED_FLAGS = redFlagsFromRubric();
  SCHEMA = schemaFromRubric(RED_FLAGS);
} catch (err) {
  console.error(err.message);
  process.exit(2);
}

// ── images ───────────────────────────────────────────────────────────────────

/** PNG dimensions off the IHDR — no decoder needed. */
function pngSize(buf) {
  if (buf.length < 24 || buf.toString("ascii", 1, 4) !== "PNG") return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

/** The API downsamples past 1568 on the long edge and rejects past 8000 / ~5 MB; the
 * armada ships a 2048 model-ready copy. Anything larger is downscaled with sharp, which
 * is in node_modules; without it an oversized image fails the cell loudly. */
const MODEL_EDGE = 2048;
const MODEL_BYTES = 4.5 * 1024 * 1024;
const imageCache = new Map();
async function prepImage(file) {
  if (imageCache.has(file)) return imageCache.get(file);
  if (!fs.existsSync(file)) throw new Error(`no such image: ${file}`);
  const raw = fs.readFileSync(file);
  const size = pngSize(raw);
  if (!size) throw new Error(`not a PNG: ${file}`);
  let out = raw;
  let sent = { ...size };
  const needs = Math.max(size.w, size.h) > MODEL_EDGE || raw.length > MODEL_BYTES;
  if (needs && !DRY) {
    let sharp;
    try {
      sharp = (await import("sharp")).default;
    } catch {
      throw new Error(
        `${path.basename(file)} is ${size.w}x${size.h} / ${(raw.length / 1e6).toFixed(1)} MB and sharp is not loadable — cannot make a model-ready copy`
      );
    }
    const scale = MODEL_EDGE / Math.max(size.w, size.h);
    const w = Math.max(1, Math.round(size.w * Math.min(1, scale)));
    const h = Math.max(1, Math.round(size.h * Math.min(1, scale)));
    out = await sharp(raw).resize(w, h, { fit: "inside" }).png({ compressionLevel: 9 }).toBuffer();
    sent = { w, h };
  } else if (needs) {
    const scale = MODEL_EDGE / Math.max(size.w, size.h);
    sent = {
      w: Math.round(size.w * Math.min(1, scale)),
      h: Math.round(size.h * Math.min(1, scale)),
    };
  }
  const rec = { file, size, sent, bytes: out.length, b64: DRY ? null : out.toString("base64") };
  imageCache.set(file, rec);
  return rec;
}

// ── anchors ──────────────────────────────────────────────────────────────────

function anchorPaths(viewport, theme) {
  return {
    pole: path.join(ANCHOR_ROOT, "control", `v0-${viewport}-${theme}.png`),
    register: path.join(
      ANCHOR_ROOT,
      "subpages/references/register",
      `${SUBJECT_OF[theme] ?? "void"}.png`
    ),
  };
}

// ── cells ────────────────────────────────────────────────────────────────────

/**
 * A cell is (lane, subject, setting): the candidate's draw 01 (first screen) and draw 02
 * (full page), its MANIFEST row for draw 01 (the measured report), and its anchors.
 */
function readManifest(dir) {
  const p = path.join(dir, "MANIFEST.jsonl");
  if (!fs.existsSync(p)) return null;
  const rows = [];
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch {
      console.error(`  ⚠ ${p}: unparsable row skipped: ${line.slice(0, 80)}`);
    }
  }
  return rows;
}

function cellsFromWave(wave) {
  const cells = [];
  const seenSettings = [];
  for (const s of SETTINGS) {
    const dir = path.join(WAVES_DIR, `${wave}${s.suffix}`, CELL_FOLDER);
    if (!fs.existsSync(dir)) continue;
    seenSettings.push(`${wave}${s.suffix}`);
    const manifest = readManifest(dir);
    const files = fs
      .readdirSync(dir)
      .filter((f) => /^LT-[a-z]+__(void|parchment)_\d\d\.png$/.test(f));
    const keys = new Map();
    for (const f of files) {
      const m = f.match(/^LT-([a-z]+)__(void|parchment)_(\d\d)\.png$/);
      const key = `${m[1]}|${m[2]}`;
      if (!keys.has(key)) keys.set(key, { lane: m[1], subject: m[2], draws: {} });
      keys.get(key).draws[m[3]] = path.join(dir, f);
    }
    for (const [, c] of keys) {
      if (!c.draws["01"]) continue;
      if (K.length && !K.includes(c.lane)) continue;
      const theme = c.subject === "parchment" ? "light" : "dark";
      const row =
        manifest?.find(
          (r) =>
            r.lane === c.lane && r.subject === c.subject && String(r.draw).padStart(2, "0") === "01"
        ) ?? null;
      const viewport = row?.viewport ?? s.viewport;
      cells.push({
        id: `${c.lane}·${s.setting}·${theme}`,
        wave,
        dir: path.join(WAVES_DIR, `${wave}${s.suffix}`),
        setting: s.setting,
        lane: c.lane,
        direction: row?.dir ?? c.lane.toUpperCase(),
        subject: c.subject,
        theme,
        viewport,
        first: c.draws["01"],
        full: c.draws["02"] ?? null,
        row,
        manifestMissing: manifest === null,
        anchors: anchorPaths(viewport, theme),
      });
    }
  }
  if (!seenSettings.length) {
    throw new Error(
      `no setting folder found for wave "${wave}" under ${WAVES_DIR} (expected <wave>, <wave>-laptop, <wave>-binding)`
    );
  }
  const order = { binding: 0, laptop: 1, default: 2 };
  cells.sort(
    (a, b) =>
      order[a.setting] - order[b.setting] ||
      (a.subject === "void" ? 0 : 1) - (b.subject === "void" ? 0 : 1) ||
      a.lane.localeCompare(b.lane)
  );
  return { cells, settings: seenSettings };
}

function cellFromShot(shot) {
  const [first, full] = shot.split(",").map((s) => path.resolve(ROOT, s.trim()));
  const theme = THEME === "light" ? "light" : "dark";
  return {
    id: `${path.basename(first, ".png")}·${VP}·${theme}`,
    wave: null,
    dir: path.dirname(first),
    setting: "ad-hoc",
    lane: path.basename(first, ".png"),
    direction: LABEL || path.basename(first, ".png"),
    subject: SUBJECT_OF[theme],
    theme,
    viewport: VP,
    first,
    full: full ?? null,
    row: null,
    manifestMissing: true,
    anchors: anchorPaths(VP, theme),
  };
}

/** The golden set: the six control stills (must fail Design) and the two register
 * strips (must clear every category), each scored as a candidate at its own anchors. */
function selfTestCells() {
  const cells = [];
  for (const vp of ["1280x720", "1440x800", "1920x1247"]) {
    for (const theme of ["dark", "light"]) {
      const file = path.join(ANCHOR_ROOT, "control", `v0-${vp}-${theme}.png`);
      cells.push({
        id: `control·${vp}·${theme}`,
        kind: "control",
        expect: "design < threshold",
        wave: null,
        dir: path.dirname(file),
        setting: "self-test",
        lane: "v0",
        direction: "control",
        subject: SUBJECT_OF[theme],
        theme,
        viewport: vp,
        first: file,
        full: null,
        row: null,
        manifestMissing: true,
        anchors: anchorPaths(vp, theme),
      });
    }
  }
  for (const theme of ["dark", "light"]) {
    const file = path.join(ANCHOR_ROOT, "subpages/references/register", `${SUBJECT_OF[theme]}.png`);
    cells.push({
      id: `register·${SUBJECT_OF[theme]}`,
      kind: "register",
      expect: "every category ≥ threshold",
      wave: null,
      dir: path.dirname(file),
      setting: "self-test",
      lane: SUBJECT_OF[theme],
      direction: "register",
      subject: SUBJECT_OF[theme],
      theme,
      viewport: "1440x800",
      first: file,
      full: null,
      row: null,
      manifestMissing: true,
      anchors: anchorPaths("1440x800", theme),
    });
  }
  return cells;
}

// ── the measured report (the cap) ────────────────────────────────────────────

function mechanicalOf(cell) {
  const row = cell.row;
  if (!row)
    return {
      known: false,
      ok: null,
      failed: [],
      summary: cell.manifestMissing ? "n/a (no manifest)" : "n/a",
    };
  const failed = [];
  const gates = row.gates ?? {};
  for (const name of Object.keys(gates)) {
    if (gates[name] && gates[name].ok === false)
      failed.push({ name, detail: gates[name].detail ?? "" });
  }
  const mech = row.mechanical;
  const violations = Array.isArray(mech?.violations) ? mech.violations : [];
  const contrast = violations.filter((v) =>
    /contrast/i.test(typeof v === "string" ? v : JSON.stringify(v))
  );
  if (contrast.length) {
    failed.push({
      name: "contrast",
      detail: contrast
        .map((v) => (typeof v === "string" ? v : (v.detail ?? v.message ?? JSON.stringify(v))))
        .join("; "),
    });
  }
  if (mech && mech.ok === false && !contrast.length) {
    failed.push({ name: "mechanical", detail: `${violations.length} violation(s)` });
  }
  const caps = failed.filter((f) => ["USABILITY", "OVERLAP", "contrast"].includes(f.name));
  return {
    known: true,
    ok: failed.length === 0,
    failed,
    caps,
    summary: failed.length ? `fail(${failed.map((f) => f.name).join(", ")})` : "pass",
  };
}

// ── the prompt ───────────────────────────────────────────────────────────────

const SYSTEM = `You are the Awwwards jury for the Thoughtform design system. Score the CANDIDATE on the sheet below, strictly, as a Site of the Day juror would. You are shown the FLOOR (a 5) and the REGISTER (an 8) first; place the candidate between them.

Return ONLY a JSON object matching the schema in the sheet — no prose, no total, no verdict. Scores are 1–10 in 0.5 steps. \`red_flags\` is a CLOSED vocabulary; use only these strings, and only when you actually see the defect:
${RED_FLAGS.join(", ")}

--- THE SHEET ---
${rubric}`;

function blocksFor(cell, images) {
  const content = [];
  const img = (rec) => ({
    type: "image",
    source: { type: "base64", media_type: "image/png", data: rec.b64 },
  });
  if (images.pole) {
    content.push({
      type: "text",
      text: `IMAGE 1 — THE NEGATIVE POLE: today's shipped casefile at ${cell.viewport} ${cell.theme}; the floor (a 5). Do not score it.`,
    });
    content.push(img(images.pole));
  }
  if (images.register) {
    content.push({
      type: "text",
      text: `IMAGE 2 — THE POSITIVE REGISTER: three reference first screens in the ${cell.subject} register, stacked; what an 8 looks like here. Do not score it.`,
    });
    content.push(img(images.register));
  }
  content.push({
    type: "text",
    text: `IMAGE ${images.pole && images.register ? 3 : content.length / 2 + 1} — THE CANDIDATE'S FIRST SCREEN: direction ${cell.direction}, ${cell.viewport}, ${cell.theme} theme${LABEL ? `, "${LABEL}"` : ""}.`,
  });
  content.push(img(images.first));
  if (images.full) {
    content.push({
      type: "text",
      text: `NEXT — THE CANDIDATE'S FULL PAGE, the same cell, top to bottom.`,
    });
    content.push(img(images.full));
  } else {
    content.push({
      type: "text",
      text: `(This cell has no full-page still; score the first screen alone.)`,
    });
  }
  content.push({
    type: "text",
    text:
      MODE === "tool"
        ? `Score the candidate now. Call the \`awwwards_sheet\` tool exactly once with the verdict and return nothing else.`
        : `Score the candidate now. Return ONLY the JSON object.`,
  });
  return content;
}

function requestFor(content) {
  const req = {
    model: MODEL,
    max_tokens: 8192,
    system: SYSTEM,
    messages: [{ role: "user", content }],
  };
  // Haiku 4.5 takes neither effort nor output_config.format; everything newer does.
  const takesEffort = !/haiku/i.test(MODEL);
  if (MODE === "output_config") {
    req.output_config = { format: { type: "json_schema", schema: SCHEMA } };
    if (takesEffort && EFFORT !== "none") req.output_config.effort = EFFORT;
  } else {
    req.tools = [
      {
        name: "awwwards_sheet",
        description: "Return the Awwwards verdict for the candidate. Call exactly once.",
        input_schema: SCHEMA,
        strict: true,
      },
    ];
    // ⚠ never `{ type: "tool" }` / `{ type: "any" }` — forced tool use is a 400 on this family.
    req.tool_choice = { type: "auto", disable_parallel_tool_use: true };
    if (takesEffort && EFFORT !== "none") req.output_config = { effort: EFFORT };
  }
  // No `temperature`, no `thinking`: the jury model rejects the first and always runs the second.
  // No `fallbacks`: this SDK (0.71.x) does not declare it, so it is omitted rather than guessed.
  return req;
}

function verdictFrom(res) {
  if (res.stop_reason === "refusal") {
    throw new Error(
      `refusal (${res.stop_details?.category ?? "?"}): ${res.stop_details?.explanation ?? ""}`
    );
  }
  if (MODE === "tool") {
    const use = res.content.find((c) => c.type === "tool_use" && c.name === "awwwards_sheet");
    if (!use)
      throw new Error(`no awwwards_sheet tool call in response (stop_reason ${res.stop_reason})`);
    return use.input;
  }
  const text = res.content.find((c) => c.type === "text")?.text ?? "";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`no JSON in response: ${text.slice(0, 200)}`);
  return JSON.parse(m[0]);
}

/** Bounds the API's grammar does not take — validated here, warned, never silently fixed. */
function normalise(v, where) {
  const warn = (s) => console.error(`  ⚠ ${where}: ${s}`);
  const out = { ...v };
  for (const c of CATS) {
    let n = Number(out[c]);
    if (!Number.isFinite(n)) {
      warn(`${c} is not a number (${JSON.stringify(out[c])}); run discarded`);
      return null;
    }
    const half = Math.round(n * 2) / 2;
    if (half !== n) warn(`${c} ${n} is off the half-step; rounded to ${half}`);
    n = half;
    if (n < 1 || n > 10) {
      const cl = Math.min(10, Math.max(1, n));
      warn(`${c} ${n} outside 1–10; clamped to ${cl}`);
      n = cl;
    }
    out[c] = n;
  }
  if (!CATS.includes(out.lowest_category)) {
    const lo = CATS.reduce((a, b) => (out[b] < out[a] ? b : a), "design");
    warn(`lowest_category "${out.lowest_category}" is not a category; derived "${lo}"`);
    out.lowest_category = lo;
  }
  out.holding_back = String(out.holding_back ?? "").trim();
  out.fix = { target: String(out.fix?.target ?? ""), change: String(out.fix?.change ?? "") };
  out.evidence = Array.isArray(out.evidence) ? out.evidence : [];
  if (out.evidence.length > 4) {
    warn(`${out.evidence.length} pieces of evidence; kept 4`);
    out.evidence = out.evidence.slice(0, 4);
  }
  const flags = Array.isArray(out.red_flags) ? out.red_flags : [];
  const unknown = flags.filter((f) => !RED_FLAGS.includes(f));
  if (unknown.length) warn(`red flags outside the closed list dropped: ${unknown.join(", ")}`);
  out.red_flags = flags.filter((f) => RED_FLAGS.includes(f));
  out.total = Number(CATS.reduce((s, c) => s + WEIGHTS[c] * out[c], 0).toFixed(2));
  return out;
}

// ── scoring ──────────────────────────────────────────────────────────────────

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};

async function loadImages(cell) {
  const images = { pole: null, register: null, first: null, full: null };
  const missing = [];
  if (!NO_ANCHORS) {
    for (const k of ["pole", "register"]) {
      const p = cell.anchors[k];
      if (fs.existsSync(p)) images[k] = await prepImage(p);
      else missing.push(p);
    }
  }
  images.first = await prepImage(cell.first);
  if (cell.full) images.full = await prepImage(cell.full);
  return { images, missing };
}

async function scoreCell(client, cell) {
  const { images, missing } = await loadImages(cell);
  const authoritative = !NO_ANCHORS && missing.length === 0;
  if (!authoritative) {
    console.error(
      `  ⚠ ${cell.id}: ${NO_ANCHORS ? "--no-anchors" : `anchor(s) missing: ${missing.map((m) => path.relative(ROOT, m)).join(", ")}`} — NOT AUTHORITATIVE`
    );
  }
  const content = blocksFor(cell, images);
  const runs = [];
  const errors = [];
  for (let i = 0; i < RUNS; i++) {
    try {
      const res = await client.messages.create(requestFor(content));
      const v = normalise(verdictFrom(res), `${cell.id} run ${i + 1}`);
      if (v)
        runs.push({ run: i + 1, ...v, usage: res.usage ?? null, stop_reason: res.stop_reason });
      else errors.push(`run ${i + 1}: verdict rejected`);
    } catch (err) {
      errors.push(`run ${i + 1}: ${err.message}`);
      console.error(`  ✗ ${cell.id} run ${i + 1}: ${err.message}`);
    }
  }
  return summarise(cell, runs, errors, authoritative, images);
}

function summarise(cell, runs, errors, authoritative, images) {
  const mech = mechanicalOf(cell);
  const medians = {};
  for (const c of CATS) medians[c] = runs.length ? median(runs.map((r) => r[c])) : null;
  const juryUsability = medians.usability;
  let capped = null;
  if (
    mech.known &&
    mech.caps.length &&
    medians.usability !== null &&
    medians.usability > USABILITY_CAP
  ) {
    medians.usability = USABILITY_CAP;
    capped = mech.caps;
  }
  let lowest = null;
  let holding = "";
  let fix = { target: "", change: "" };
  if (runs.length) {
    lowest = CATS.reduce((a, b) => (medians[b] < medians[a] ? b : a), "design");
    const pick =
      runs.filter((r) => r.lowest_category === lowest).sort((a, b) => a.total - b.total)[0] ??
      [...runs].sort((a, b) => a.total - b.total)[0];
    holding = pick.holding_back;
    fix = pick.fix;
    if (capped) {
      holding = `MEASURED: ${capped.map((c) => `${c.name}${c.detail ? ` — ${c.detail}` : ""}`).join("; ")}`;
      fix = {
        target: capped.map((c) => c.name).join(", "),
        change: "clear the measured gate; the jury's number is capped until it passes",
      };
      if (medians.usability <= medians[lowest]) lowest = "usability";
    }
  }
  const total = runs.length
    ? Number(CATS.reduce((s, c) => s + WEIGHTS[c] * medians[c], 0).toFixed(2))
    : null;
  const clears = runs.length ? CATS.every((c) => medians[c] >= THRESHOLD) : false;
  const flags = [...new Set(runs.flatMap((r) => r.red_flags))];
  return {
    id: cell.id,
    kind: cell.kind ?? "candidate",
    expect: cell.expect ?? null,
    wave: cell.wave,
    setting: cell.setting,
    lane: cell.lane,
    direction: cell.direction,
    viewport: cell.viewport,
    theme: cell.theme,
    subject: cell.subject,
    images: {
      pole: images.pole ? path.relative(ROOT, images.pole.file) : null,
      register: images.register ? path.relative(ROOT, images.register.file) : null,
      first: path.relative(ROOT, images.first.file),
      full: images.full ? path.relative(ROOT, images.full.file) : null,
    },
    authoritative,
    mechanical: mech,
    runs,
    errors,
    medians,
    jury_usability_median: juryUsability,
    usability_capped: capped ? capped.map((c) => c.name) : null,
    weighted_total: total,
    lowest_category: lowest,
    holding_back: holding,
    fix,
    red_flags: flags,
    verdict: runs.length ? (clears ? "CLEARS" : "BELOW") : "NOT SCORED",
  };
}

// ── reports ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  n === null || n === undefined ? "—" : Number.isInteger(n) ? `${n}.0` : String(n);
const today = () => new Date().toISOString().slice(0, 10);

function logLine(r) {
  const mech = r.mechanical.summary;
  const scope = r.wave ? `lattice ${r.wave}` : LABEL || "ad-hoc";
  return (
    `${today()} · awwwards · ${scope} · ${r.direction} ${r.viewport} ${r.theme} · MECH ${mech} · ` +
    `D ${fmt(r.medians.design)} U ${fmt(r.medians.usability)}${r.usability_capped ? " (capped)" : ""} C ${fmt(r.medians.creativity)} K ${fmt(r.medians.content)} · ` +
    `${fmt(r.weighted_total)} · holding: ${r.lowest_category ?? "—"} — ${r.holding_back || "—"} · ${r.verdict} ${THRESHOLD} · ${MODEL}` +
    (r.authoritative ? "" : " · NOT AUTHORITATIVE")
  );
}

function markdownReport(results, meta) {
  const L = [];
  L.push(`# Awwwards — ${meta.scope}`);
  L.push("");
  L.push(
    `${today()} · model \`${meta.model}\` · mode \`${meta.mode}\` · ${meta.runs} run(s) · threshold ${meta.threshold}${meta.authoritative ? "" : " · **NOT AUTHORITATIVE**"}`
  );
  L.push("");
  L.push("| cell | D | U | C | K | total | verdict |");
  L.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const r of results) {
    L.push(
      `| ${r.direction} ${r.viewport} ${r.theme} | ${fmt(r.medians.design)} | ${fmt(r.medians.usability)}${r.usability_capped ? " ⚠" : ""} | ${fmt(r.medians.creativity)} | ${fmt(r.medians.content)} | ${fmt(r.weighted_total)} | ${r.verdict} |`
    );
  }
  L.push("");
  L.push("## Holding back");
  L.push("");
  for (const r of results) {
    L.push(
      `- **${r.direction} ${r.viewport} ${r.theme}** — ${r.lowest_category ?? "—"}: ${r.holding_back || "—"}`
    );
    if (r.fix.target || r.fix.change) L.push(`  fix: \`${r.fix.target}\` → ${r.fix.change}`);
    if (r.mechanical.known) L.push(`  mechanical: ${r.mechanical.summary}`);
    if (r.errors.length) L.push(`  errors: ${r.errors.join(" · ")}`);
  }
  L.push("");
  L.push("## Red flags");
  L.push("");
  const any = results.filter((r) => r.red_flags.length);
  if (!any.length) L.push("none");
  for (const r of any)
    L.push(`- ${r.direction} ${r.viewport} ${r.theme}: ${r.red_flags.join(", ")}`);
  L.push("");
  return L.join("\n");
}

function printTable(results) {
  console.log("");
  console.log(
    `  ${"cell".padEnd(30)} ${"D".padStart(5)} ${"U".padStart(5)} ${"C".padStart(5)} ${"K".padStart(5)} ${"total".padStart(6)}  verdict`
  );
  for (const r of results) {
    console.log(
      `  ${`${r.direction} ${r.viewport} ${r.theme}`.padEnd(30)} ${fmt(r.medians.design).padStart(5)} ${(fmt(r.medians.usability) + (r.usability_capped ? "*" : "")).padStart(5)} ${fmt(r.medians.creativity).padStart(5)} ${fmt(r.medians.content).padStart(5)} ${fmt(r.weighted_total).padStart(6)}  ${r.verdict}${r.authoritative ? "" : " (advisory)"}`
    );
    console.log(`    holding: ${r.lowest_category ?? "—"} — ${r.holding_back || "—"}`);
  }
  console.log("");
}

// ── dry run ──────────────────────────────────────────────────────────────────

async function dryRun(cells) {
  console.log(
    `\nAWWWARDS — dry run · model ${MODEL} · mode ${MODE} · effort ${EFFORT} · runs ${RUNS} · threshold ${THRESHOLD}\n`
  );
  console.log(`  rubric: ${path.relative(ROOT, RUBRIC_PATH)}`);
  console.log(
    `  red flags (${RED_FLAGS.length}, from ${path.relative(ROOT, FLAGS_PATH)}): ${RED_FLAGS.join(", ")}`
  );
  console.log(
    `  anchors root: ${path.relative(ROOT, ANCHOR_ROOT) || "."}${NO_ANCHORS ? "  (--no-anchors → NOT AUTHORITATIVE)" : ""}`
  );
  console.log(`  cells: ${cells.length}\n`);
  for (const cell of cells) {
    console.log(`  ▸ ${cell.id}${cell.expect ? `   expects ${cell.expect}` : ""}`);
    const list = [
      ["1 negative pole", cell.anchors.pole],
      ["2 positive register", cell.anchors.register],
      ["3 candidate first", cell.first],
      ["4 candidate full", cell.full],
    ];
    for (const [label, p] of list) {
      if (!p) {
        console.log(`      ${label.padEnd(20)} —  (none)`);
        continue;
      }
      if (!fs.existsSync(p)) {
        console.log(`      ${label.padEnd(20)} ✗  MISSING ${path.relative(ROOT, p)}`);
        continue;
      }
      const rec = await prepImage(p);
      const scaled = rec.sent.w !== rec.size.w ? ` → sent ${rec.sent.w}x${rec.sent.h}` : "";
      console.log(
        `      ${label.padEnd(20)} ✓  ${path.relative(ROOT, p)}  ${rec.size.w}x${rec.size.h}${scaled}`
      );
    }
    const mech = mechanicalOf(cell);
    console.log(
      `      ${"mechanical".padEnd(20)}    ${mech.summary}${mech.caps?.length ? `  → usability capped at ${USABILITY_CAP}` : ""}`
    );
  }
  console.log(`\n  prompt skeleton:`);
  console.log(
    `    system: "${SYSTEM.split("\n")[0].slice(0, 110)}…" + the sheet (${rubric.length} chars)`
  );
  console.log(
    `    user:   [text IMAGE 1 pole] [image] [text IMAGE 2 register] [image] [text IMAGE 3 first] [image] [text NEXT full] [image] [text "Score the candidate now…"]`
  );
  console.log(
    `    request: ${
      MODE === "output_config"
        ? `output_config: { format: { type: "json_schema", schema }, effort: "${EFFORT}" }`
        : `tools: [awwwards_sheet (strict)], tool_choice: { type: "auto" }, output_config: { effort: "${EFFORT}" }`
    } · max_tokens 8192 · no temperature · no thinking param`
  );
  console.log(`    schema required: ${SCHEMA.required.join(", ")}\n`);
}

// ── run ──────────────────────────────────────────────────────────────────────

let cells;
let scope;
let outDir;
try {
  if (SELF_TEST) {
    cells = selfTestCells();
    scope = "self-test";
    outDir = argOf("--out", "");
  } else if (WAVE) {
    const w = cellsFromWave(WAVE);
    cells = w.cells;
    scope = `lattice ${WAVE}`;
    outDir = argOf("--out", path.join(WAVES_DIR, WAVE));
    if (!cells.length)
      throw new Error(
        `wave "${WAVE}" has no cells (folders: ${w.settings.join(", ")}; filter --k ${K.join(",") || "none"})`
      );
  } else {
    cells = [cellFromShot(SHOT)];
    scope = LABEL || "ad-hoc";
    outDir = argOf("--out", cells[0].dir);
  }
} catch (err) {
  console.error(err.message);
  process.exit(2);
}

if (DRY) {
  await dryRun(cells);
  process.exit(0);
}

loadEnv();
let client;
try {
  client = makeClient();
} catch (err) {
  console.error(err.message);
  process.exit(2);
}

console.log(
  `\nAWWWARDS — ${scope} · model ${MODEL} · mode ${MODE} · effort ${EFFORT} · runs ${RUNS} · threshold ${THRESHOLD} · ${cells.length} cell(s)\n`
);
const results = [];
for (const cell of cells) {
  console.log(`  scoring ${cell.id} …`);
  try {
    results.push(await scoreCell(client, cell));
  } catch (err) {
    console.error(`  ✗ ${cell.id}: ${err.message}`);
    results.push(
      summarise(cell, [], [err.message], false, {
        pole: null,
        register: null,
        first: { file: cell.first },
        full: null,
      })
    );
  }
}

const authoritative = results.every((r) => r.authoritative);
const scored = results.filter((r) => r.runs.length);

if (SELF_TEST) {
  // Both directions, on EVERY run — a gate verified one way might be returning a constant.
  let fails = 0;
  for (const r of results) {
    if (!r.runs.length) {
      fails++;
      console.log(`  FAIL  ${r.id}: not scored (${r.errors.join("; ")})`);
      continue;
    }
    const bad = [];
    for (const run of r.runs) {
      if (r.kind === "control" && !(run.design < THRESHOLD))
        bad.push(`run ${run.run} design ${run.design} ≥ ${THRESHOLD}`);
      if (r.kind === "register") {
        for (const c of CATS)
          if (run[c] < THRESHOLD) bad.push(`run ${run.run} ${c} ${run[c]} < ${THRESHOLD}`);
      }
    }
    if (bad.length) fails++;
    console.log(
      `  ${bad.length ? "FAIL" : "PASS"}  ${r.id.padEnd(28)} ${r.expect}  ·  D ${fmt(r.medians.design)} U ${fmt(r.medians.usability)} C ${fmt(r.medians.creativity)} K ${fmt(r.medians.content)}${bad.length ? `  ·  ${bad.join("; ")}` : ""}`
    );
  }
  const pass = fails === 0 && authoritative;
  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, "awwwards-self-test.json"),
      JSON.stringify(
        {
          date: today(),
          model: MODEL,
          mode: MODE,
          effort: EFFORT,
          runs: RUNS,
          threshold: THRESHOLD,
          authoritative,
          pass,
          results,
        },
        null,
        2
      )
    );
  }
  console.log(
    `\n  SELF-TEST ${pass ? "PASS" : `FAIL — ${fails} of ${results.length} cell(s)${authoritative ? "" : "; anchors missing"}`}  (never logged)\n`
  );
  process.exit(pass ? 0 : 1);
}

printTable(results);

fs.mkdirSync(outDir, { recursive: true });
const jsonPath = path.join(outDir, "awwwards.json");
const mdPath = path.join(outDir, "awwwards.md");
fs.writeFileSync(
  jsonPath,
  JSON.stringify(
    {
      date: today(),
      scope,
      wave: WAVE || null,
      label: LABEL || null,
      model: MODEL,
      mode: MODE,
      effort: EFFORT,
      runs: RUNS,
      threshold: THRESHOLD,
      usability_cap: USABILITY_CAP,
      anchors: { root: path.relative(ROOT, ANCHOR_ROOT) || ".", used: !NO_ANCHORS },
      authoritative,
      red_flags_vocabulary: RED_FLAGS,
      results,
    },
    null,
    2
  )
);
fs.writeFileSync(
  mdPath,
  markdownReport(results, {
    scope,
    model: MODEL,
    mode: MODE,
    runs: RUNS,
    threshold: THRESHOLD,
    authoritative,
  })
);
console.log(`  wrote ${path.relative(ROOT, jsonPath)} and ${path.relative(ROOT, mdPath)}`);

const lines = results.filter((r) => r.runs.length).map(logLine);
if (LOG) {
  if (!authoritative) {
    console.error(
      `\n  ⚠ NOT AUTHORITATIVE — refusing to append to ${path.relative(ROOT, LOG_PATH)}. The lines it would have written:\n`
    );
    for (const l of lines) console.error(`  ${l}`);
  } else if (lines.length) {
    fs.appendFileSync(LOG_PATH, lines.map((l) => l + "\n").join(""));
    console.log(`  appended ${lines.length} line(s) to ${path.relative(ROOT, LOG_PATH)}`);
  }
} else {
  console.log(`\n  log lines (pass --log to append):`);
  for (const l of lines) console.log(`  ${l}`);
}
console.log("");

if (!scored.length) process.exit(2);
process.exit(
  scored.every((r) => r.verdict === "CLEARS") && scored.length === results.length ? 0 : 1
);
