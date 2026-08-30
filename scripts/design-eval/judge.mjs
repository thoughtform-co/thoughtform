#!/usr/bin/env node
/**
 * design-eval/judge — stage 2 of the design gate.
 *
 * Screenshots a surface and asks a vision model to score it against the rubric,
 * at temperature 0, returning the fixed schema. Everything a machine can check
 * belongs in mechanical.mjs; this stage exists only for the judgments a
 * computed style cannot make — does it read as an instrument, is there one
 * clear first read, is the accent spent once.
 *
 *   node scripts/design-eval/judge.mjs --url /test/design-eval-fixture --scope .fixture-good --surface panel
 *   node scripts/design-eval/judge.mjs --shot shots/variant-a.png --surface card-face
 *
 * ⚠ THE RUBRIC IS READ FROM DISK AT RUNTIME, not duplicated here. Editing
 * `.claude/skills/thoughtform-design/eval/rubric.md` changes the gate, and there
 * is no second copy to drift from it. The thresholds table is PARSED from that
 * file for the same reason.
 *
 * ⚠ CALIBRATION ANCHORS ARE MANDATORY. Without ground truth the judge becomes a
 * critic with no reference and scores everything about an 8 — a failure mode
 * that is invisible because the numbers look reasonable. A missing anchor warns
 * loudly and marks the verdict NOT AUTHORITATIVE rather than failing silently.
 *
 * Exit 0 = passes its surface thresholds, 1 = fails, 2 = could not run.
 */
import Anthropic from "@anthropic-ai/sdk";
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const argOf = (f, d) => {
  const i = args.indexOf(f);
  return i >= 0 && args[i + 1] ? args[i + 1] : d;
};
const has = (f) => args.includes(f);

/** Load .env.local / .env without a dependency — the key lives there, not in the shell. */
for (const f of [".env.local", ".env"]) {
  const p = path.resolve(process.cwd(), f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!m || process.env[m[1]] !== undefined) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

const PORT = argOf("--port", "3003");
const URL_PATH = argOf("--url", "");
const SHOT = argOf("--shot", "");
const SCOPE = argOf("--scope", "body");
const SURFACE = argOf("--surface", "panel");
const THEME = argOf("--theme", "dark");
const [VW, VH] = argOf("--vp", "1440x900").split("x").map(Number);
const LABEL = argOf("--label", SHOT ? path.basename(SHOT) : `${URL_PATH} ${SCOPE}`);
const MODEL = argOf("--model", "claude-haiku-4-5-20251001");

const SKILL = path.resolve(process.cwd(), ".claude/skills/thoughtform-design/eval");
const RUBRIC_PATH = path.join(SKILL, "rubric.md");
const ANCHOR_DIR = path.join(SKILL, "anchors");
const ANCHORS = ["landing-hero.png", "casefile-console.png", "card-face-shipped.png"];

// ── the rubric, read (never duplicated) ──────────────────────────────────────

if (!fs.existsSync(RUBRIC_PATH)) {
  console.error(`no rubric at ${RUBRIC_PATH} — the gate has no definition to run against`);
  process.exit(2);
}
const rubric = fs.readFileSync(RUBRIC_PATH, "utf8");

/** Parse the per-surface threshold table out of the rubric's markdown. */
function thresholdsFor(surface) {
  const row = rubric
    .split("\n")
    .find((l) => l.trim().startsWith(`| \`${surface}\``));
  if (!row) {
    const known = [...rubric.matchAll(/^\|\s*`([a-z-]+)`\s*\|/gm)].map((m) => m[1]);
    throw new Error(`unknown surface "${surface}" — the rubric defines: ${known.join(" | ")}`);
  }
  const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
  const num = (c) => {
    const m = c.match(/≥\s*(\d+)/);
    return m ? Number(m[1]) : null; // "—" means ungated: scored, logged, not enforced
  };
  return {
    grammar_fit: num(cells[1]),
    hierarchy: num(cells[2]),
    density_discipline: num(cells[3]),
    gold_discipline: num(cells[4]),
    instrument_register: num(cells[5]),
    booleans: cells[6],
  };
}

const thresholds = thresholdsFor(SURFACE);

// ── the image ────────────────────────────────────────────────────────────────

async function capture() {
  if (SHOT) {
    if (!fs.existsSync(SHOT)) throw new Error(`no such screenshot: ${SHOT}`);
    return fs.readFileSync(SHOT);
  }
  if (!URL_PATH) throw new Error("pass --url or --shot");
  const browser = await chromium.launch({ headless: !has("--headed") });
  const ctx = await browser.newContext({
    viewport: { width: VW, height: VH },
    reducedMotion: "no-preference",
    colorScheme: THEME === "light" ? "light" : "dark",
  });
  const page = await ctx.newPage();
  const sep = URL_PATH.includes("?") ? "&" : "?";
  await page.goto(
    `http://localhost:${PORT}${URL_PATH}${THEME === "light" ? sep + "theme=light" : ""}`,
    { waitUntil: "domcontentloaded", timeout: 60000 },
  );
  await page.waitForTimeout(2500);
  const el = await page.$(SCOPE);
  const buf = el ? await el.screenshot() : await page.screenshot();
  await browser.close();
  return buf;
}

// ── run ──────────────────────────────────────────────────────────────────────

const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.error("ANTHROPIC_API_KEY not set");
  process.exit(2);
}

let shot;
try {
  shot = await capture();
} catch (err) {
  console.error(`could not capture: ${err.message}`);
  process.exit(2);
}

// Anchors. Missing ones are LOUD — see the header.
const anchorBlocks = [];
const missing = [];
for (const a of ANCHORS) {
  const p = path.join(ANCHOR_DIR, a);
  if (fs.existsSync(p)) {
    anchorBlocks.push({ name: a, b64: fs.readFileSync(p).toString("base64") });
  } else {
    missing.push(a);
  }
}
const authoritative = missing.length === 0;
if (!authoritative) {
  console.error(
    `\n  ⚠ ${missing.length} CALIBRATION ANCHOR(S) MISSING: ${missing.join(", ")}\n` +
      `    Expected in ${ANCHOR_DIR}.\n` +
      `    Without ground truth the judge scores everything about an 8. This run is\n` +
      `    ADVISORY ONLY and must not be logged as authoritative.\n`,
  );
}

const content = [];
for (const a of anchorBlocks) {
  content.push({ type: "text", text: `CALIBRATION ANCHOR — this is a real, shipped, sanctioned Thoughtform surface (${a.name}):` });
  content.push({ type: "image", source: { type: "base64", media_type: "image/png", data: a.b64 } });
}
content.push({
  type: "text",
  text: `CANDIDATE — surface type "${SURFACE}", label "${LABEL}". Score this one:`,
});
content.push({ type: "image", source: { type: "base64", media_type: "image/png", data: shot.toString("base64") } });

const system = `You are the design gate for the Thoughtform design system. Score the CANDIDATE image against the rubric below. The calibration anchors are real shipped surfaces — treat them as the standard, not as things to score.

Return ONLY a JSON object, no prose, matching exactly this shape:
{"grammar_fit":<1-10>,"hierarchy":<1-10>,"density_discipline":<1-10>,"gold_discipline":<1-10>,"instrument_register":<1-10>,"corner_law_ok":<bool>,"three_registers_ok":<bool>,"field_bleeds":<bool>,"red_flags":[<strings>],"note":"<one sentence>"}

red_flags is a CLOSED vocabulary. Use only these strings, and only when you actually see the defect:
rounded-corners, purple-blue-gradient, cool-tinted-ground, background-fill-active, gold-overspend, third-font, wrong-diagonal, box-shadow-depth, circular-indicator, green-as-nav, decorative-texture, italic-emphasis, mono-carries-claim, fourth-register, full-width-cta-pair

--- RUBRIC ---
${rubric}`;

const client = new Anthropic({ apiKey: key });
let verdict;
try {
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    temperature: 0,
    system,
    messages: [{ role: "user", content }],
  });
  const text = res.content.find((c) => c.type === "text")?.text ?? "";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`no JSON in response: ${text.slice(0, 200)}`);
  verdict = JSON.parse(m[0]);
} catch (err) {
  console.error(`judge failed: ${err.message}`);
  process.exit(2);
}

// ── report ───────────────────────────────────────────────────────────────────

const SCORES = ["grammar_fit", "hierarchy", "density_discipline", "gold_discipline", "instrument_register"];
console.log(`\nJUDGE — ${LABEL}   surface=${SURFACE}  model=${MODEL}${authoritative ? "" : "  [ADVISORY: anchors missing]"}\n`);

let failed = 0;
for (const k of SCORES) {
  const v = verdict[k];
  const t = thresholds[k];
  const mark = t === null ? "  — " : v >= t ? " PASS" : " FAIL";
  if (t !== null && v < t) failed++;
  console.log(`  ${mark}  ${k.padEnd(20)} ${String(v).padStart(2)}  ${t === null ? "(ungated)" : `needs ≥ ${t}`}`);
}
// Which booleans a surface enforces is named in the rubric's own cell — a
// comma list of short keys ("corner, registers, field"). Card rules
// (three_registers_ok, field_bleeds) apply to cards; corner_law_ok is universal.
const BOOL_KEY = {
  corner_law_ok: "corner",
  three_registers_ok: "registers",
  field_bleeds: "field",
};
const enforcedKeys = thresholds.booleans.split(",").map((s) => s.trim());
for (const [b, key] of Object.entries(BOOL_KEY)) {
  const v = verdict[b];
  const enforced = enforcedKeys.includes(key);
  const mark = !enforced ? "  — " : v ? " PASS" : " FAIL";
  if (enforced && !v) failed++;
  console.log(`  ${mark}  ${b.padEnd(20)} ${v}${enforced ? "" : "  (ungated here)"}`);
}
const flags = verdict.red_flags ?? [];
console.log(`  ${flags.length === 0 ? " PASS" : " FAIL"}  ${"red_flags".padEnd(20)} ${flags.length ? flags.join(", ") : "none"}`);
if (flags.length) failed++;
if (verdict.note) console.log(`\n  note: ${verdict.note}`);

const pass = failed === 0;
console.log(`\n  ${pass ? "JUDGE PASS" : `JUDGE FAIL — ${failed} gate(s)`}${authoritative ? "" : "  (advisory — anchors missing)"}\n`);
console.log(
  `  log line:\n  ${new Date().toISOString().slice(0, 10)} · ${SURFACE} · ${LABEL} · ` +
    `${SCORES.map((k) => verdict[k]).join("/")} · ${flags.length ? flags.join("+") : "no-flags"} · ` +
    `${pass ? "PASS" : "REJECTED"}\n`,
);

process.exit(pass ? 0 : 1);
