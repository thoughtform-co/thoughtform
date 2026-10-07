#!/usr/bin/env node
/**
 * lattice-round — one round of the lattice loop (ADR-149 §4).
 *
 * The owner's method, in order: "run the page and take a screenshot first, then score
 * while looking at it. Write down what's holding back the lowest category, and keep
 * going until every category is at 7.5 or higher."
 *
 *   1  ratchet   npx vitest run tests/lib/lattice-*.test.ts          (stop on failure)
 *   2  capture   node scripts/capture-lattice.mjs --wave <wave> …    (the stills + MANIFEST)
 *   3  look      print the binding still's path, open it, pause on --wait
 *   4  score     node scripts/design-eval/awwwards.mjs --wave <wave> --runs N --log
 *   5  record    the medians table + the holding-back line, appended to <wave>-rounds.md
 *
 *   node scripts/lattice-round.mjs --wave lattice-01-r02
 *   node scripts/lattice-round.mjs --wave lattice-01-r02 --k LA,LB --setting binding --wait
 *   node scripts/lattice-round.mjs --wave lattice-00-dry --skip-ratchet --skip-capture --skip-score
 *
 * ⚠ A WAVE IS ONE CSS STATE. A fix found mid-round re-shoots every cell: name a new wave.
 * ⚠ Every step is printed with its command before it runs, so a round can be replayed by hand.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] !== undefined && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};
const has = (f) => args.includes(f);

if (has("--help") || has("-h") || !argOf("--wave", "")) {
  console.log(`lattice-round — ratchet → capture → look → score → record (ADR-149 §4)

  --wave <name>     required; one CSS state. Folders: <wave>, <wave>-laptop, <wave>-binding
  --k LA,LB         direction filter, passed to the capture (and lowercased to the jury)
  --setting <s>     capture setting filter (default|laptop|binding), passed to the capture
  --port <n>        the dev server's port (default 3003; read it off the running server)
  --runs <n>        jury runs per cell (default 3)
  --skip-ratchet    skip step 1
  --skip-capture    skip step 2
  --skip-score      skip step 4
  --wait            pause for a keypress after the binding still is printed (look first)
  --no-open         do not open the binding still (darwin only)
`);
  process.exit(argOf("--wave", "") ? 0 : 2);
}

const WAVE = argOf("--wave", "");
const K = argOf("--k", "");
const SETTING = argOf("--setting", "");
const PORT = argOf("--port", "3003");
const RUNS = argOf("--runs", "3");

const ROOT = process.cwd();
const EVAL = path.resolve(ROOT, ".claude/skills/thoughtform-design/eval");
const WAVES_DIR = path.join(EVAL, "subpages/evals/waves");
const WAVE_DIR = path.join(WAVES_DIR, WAVE);
const BINDING_STILL = path.join(
  WAVES_DIR,
  `${WAVE}-binding`,
  "LT - Lattice page",
  "LT-la__void_01.png"
);
const ROUNDS_PATH = path.join(WAVES_DIR, `${WAVE}-rounds.md`);
const RATCHET_TESTS = [
  "tests/lib/lattice-tokens.test.ts",
  "tests/lib/lattice-ratchet.test.ts",
  "tests/lib/lattice-directions.test.ts",
];

const rel = (p) => path.relative(ROOT, p);

/** Run a step's command with the terminal attached; `MSYS_NO_PATHCONV` keeps a Git-Bash
 * shell from rewriting `/test/…` arguments into Windows paths (capture-subpages' finding). */
function step(n, title, cmd, argv) {
  console.log(`\n── ${n}  ${title}\n   $ ${[cmd, ...argv].join(" ")}\n`);
  const r = spawnSync(cmd, argv, {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, MSYS_NO_PATHCONV: "1", MSYS2_ARG_CONV_EXCL: "*" },
  });
  if (r.error) {
    console.error(`   ✗ could not start: ${r.error.message}`);
    return 2;
  }
  return r.status ?? 2;
}

function pause(msg) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      console.log(`   (${msg} — stdin is not a TTY, continuing)`);
      resolve();
      return;
    }
    console.log(`   ${msg} — press any key to continue …`);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once("data", () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve();
    });
  });
}

const fmt = (n) =>
  n === null || n === undefined ? "—" : Number.isInteger(n) ? `${n}.0` : String(n);
const today = () => new Date().toISOString().slice(0, 10);

// ── 1  ratchet ───────────────────────────────────────────────────────────────

if (!has("--skip-ratchet")) {
  const present = RATCHET_TESTS.filter((t) => fs.existsSync(path.join(ROOT, t)));
  const absent = RATCHET_TESTS.filter((t) => !present.includes(t));
  if (absent.length) console.log(`\n   (not on disk yet, skipped: ${absent.join(", ")})`);
  if (!present.length) {
    console.error("   ✗ no lattice test on disk — nothing to ratchet against");
    process.exit(2);
  }
  const code = step(1, "ratchet", "npx", ["vitest", "run", ...present]);
  if (code !== 0) {
    console.error(
      `\n   ✗ the ratchet failed (exit ${code}) — a round does not start on a broken pin`
    );
    process.exit(code);
  }
} else {
  console.log("\n── 1  ratchet   (skipped)");
}

// ── 2  capture ───────────────────────────────────────────────────────────────

if (!has("--skip-capture")) {
  const argv = ["scripts/capture-lattice.mjs", "--wave", WAVE];
  if (K) argv.push("--k", K);
  if (SETTING) argv.push("--setting", SETTING);
  argv.push("--headed", "--port", PORT);
  const code = step(2, "capture", "node", argv);
  if (code !== 0) {
    console.error(
      `\n   ✗ the capture failed (exit ${code}) — only the control can fail a gate; read its report`
    );
    process.exit(code);
  }
} else {
  console.log("\n── 2  capture   (skipped)");
}

// ── 3  look ──────────────────────────────────────────────────────────────────

console.log(
  `\n── 3  look\n   binding still: ${rel(BINDING_STILL)}${fs.existsSync(BINDING_STILL) ? "" : "   (not on disk)"}`
);
if (fs.existsSync(BINDING_STILL) && process.platform === "darwin" && !has("--no-open")) {
  spawnSync("open", [BINDING_STILL], { stdio: "ignore" });
}
if (has("--wait")) await pause("screenshot first, then score while looking at it");

// ── 4  score ─────────────────────────────────────────────────────────────────

let scoreExit = null;
if (!has("--skip-score")) {
  const argv = ["scripts/design-eval/awwwards.mjs", "--wave", WAVE, "--runs", RUNS, "--log"];
  if (K) argv.push("--k", K.toLowerCase());
  scoreExit = step(4, "score", "node", argv);
  if (scoreExit === 2) {
    console.error("\n   ✗ the jury could not run (exit 2) — the round is recorded without scores");
  }
} else {
  console.log("\n── 4  score   (skipped)");
}

// ── 5  record ────────────────────────────────────────────────────────────────

console.log("\n── 5  record");
const jsonPath = path.join(WAVE_DIR, "awwwards.json");
let scored = null;
if (fs.existsSync(jsonPath)) {
  try {
    scored = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  } catch (err) {
    console.error(`   ⚠ could not parse ${rel(jsonPath)}: ${err.message}`);
  }
}

let round = 1;
let existing = "";
if (fs.existsSync(ROUNDS_PATH)) {
  existing = fs.readFileSync(ROUNDS_PATH, "utf8");
  round = (existing.match(/^## Round \d+/gm) ?? []).length + 1;
}

const L = [];
if (!existing) {
  L.push(`# Lattice rounds — ${WAVE}`);
  L.push("");
  L.push(
    "One record per round: the still looked at, the mechanical result, the jury's medians, the holding-back line, and the edit the human made next. Append-only."
  );
  L.push("");
}
L.push(`## Round ${round} · ${today()}`);
L.push("");
L.push(`- still: \`${rel(BINDING_STILL)}\`${fs.existsSync(BINDING_STILL) ? "" : " (not on disk)"}`);
if (scored?.results?.length) {
  const mech = scored.results.map(
    (r) => `${r.direction} ${r.viewport} ${r.theme}: ${r.mechanical?.summary ?? "n/a"}`
  );
  L.push(`- mechanical: ${mech.join(" · ")}`);
  L.push(
    `- jury: \`${scored.model}\` · ${scored.mode} · ${scored.runs} run(s)${scored.authoritative ? "" : " · **NOT AUTHORITATIVE**"}`
  );
  L.push("");
  L.push("| cell | D | U | C | K | total | verdict |");
  L.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const r of scored.results) {
    L.push(
      `| ${r.direction} ${r.viewport} ${r.theme} | ${fmt(r.medians?.design)} | ${fmt(r.medians?.usability)}${r.usability_capped ? " ⚠" : ""} | ${fmt(r.medians?.creativity)} | ${fmt(r.medians?.content)} | ${fmt(r.weighted_total)} | ${r.verdict} |`
    );
  }
  L.push("");
  for (const r of scored.results) {
    L.push(
      `- **${r.direction} ${r.viewport} ${r.theme}** — holding: ${r.lowest_category ?? "—"} — ${r.holding_back || "—"}`
    );
    if (r.fix?.target || r.fix?.change) L.push(`  fix: \`${r.fix.target}\` → ${r.fix.change}`);
  }
} else {
  L.push(`- mechanical: ${has("--skip-capture") ? "capture skipped" : "see the capture's report"}`);
  L.push(
    `- jury: ${has("--skip-score") ? "score skipped" : scoreExit === 2 ? "could not run" : "no awwwards.json in the wave folder"}`
  );
}
L.push("");
L.push("**Edit made next:** ");
L.push("");

fs.mkdirSync(WAVES_DIR, { recursive: true });
fs.appendFileSync(ROUNDS_PATH, L.join("\n") + "\n");
console.log(`   appended Round ${round} to ${rel(ROUNDS_PATH)}`);

if (scored?.results?.length) {
  console.log("");
  console.log(
    `   ${"cell".padEnd(30)} ${"D".padStart(5)} ${"U".padStart(5)} ${"C".padStart(5)} ${"K".padStart(5)} ${"total".padStart(6)}  verdict`
  );
  for (const r of scored.results) {
    console.log(
      `   ${`${r.direction} ${r.viewport} ${r.theme}`.padEnd(30)} ${fmt(r.medians?.design).padStart(5)} ${(fmt(r.medians?.usability) + (r.usability_capped ? "*" : "")).padStart(5)} ${fmt(r.medians?.creativity).padStart(5)} ${fmt(r.medians?.content).padStart(5)} ${fmt(r.weighted_total).padStart(6)}  ${r.verdict}`
    );
    console.log(`     holding: ${r.lowest_category ?? "—"} — ${r.holding_back || "—"}`);
  }
  const below = scored.results.filter((r) => r.verdict !== "CLEARS");
  console.log(
    `\n   ${below.length ? `${below.length} cell(s) below ${scored.threshold} — edit, name a new wave, run again` : `every cell clears ${scored.threshold} — the owner reads it next`}\n`
  );
}

process.exit(scoreExit === 1 ? 1 : scoreExit === 2 ? 2 : 0);
