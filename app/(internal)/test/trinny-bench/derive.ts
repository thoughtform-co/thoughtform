/**
 * The bench's reading of a job file (ADR-120 Update 1). Pure: no React, no
 * DOM, so every rule the face draws is pinned in
 * `tests/lib/trinny-bench-derive.test.ts`.
 *
 * ⚠ A STATE, NEVER A SCORE, AND THE COLOUR IS THE RUBRIC'S OWN STRICTNESS.
 * The owner's rule (2026-09-22), Moira's degrees of freedom read through the
 * rubric's severity column: a `gate` check that fails on the majority of runs
 * is red (the product itself is wrong, never keep); a judged check that
 * fails (critical, minor, advisory), a split vote, or a check nobody
 * answered is orange (look again); a check that held on every run is green.
 * The verdict WORD stays the rubric's; only its tone is read here.
 *
 * ⚠ THE COLOUR ROWS SETTLE FIRST. F1/F2 are computed in code before any
 * grade exists (`bench/grade.py` overwrites the grader's answer with the
 * measurement), so their block settles the moment `measurement` lands. A
 * frame the ship could not compare (`not_applied`: a texture frame, too few
 * product pixels) reads n/a here, never a green nobody measured.
 */

import type { BenchConfig, Check, Job, Measurement, RunRecord } from "./types";

export type Tone = "pending" | "running" | "pass" | "review" | "fail" | "na";
export type Mode = "generate" | "upload";
export type View = "run" | "skill" | "evals";

export const SUBJECT_NAMES: Record<string, string> = {
  nakedambition: "Naked Ambition",
  overnight: "Overnight Sensation",
  beyourbest: "Be Your Best",
  discovery: "Skincare Discovery Set",
};

/** The proposal's transparent cut-outs, served by the site itself: the
 *  picker paints at once while the identity tile comes off Drive. */
export const CUTOUTS: Record<string, string> = {
  nakedambition: "/trinny-london/naked-ambition.webp",
  overnight: "/trinny-london/overnight-sensation.webp",
  beyourbest: "/trinny-london/be-your-best.webp",
  discovery: "/trinny-london/discovery-set.webp",
};

export const STATE_WORD: Record<string, string> = {
  within: "within the band",
  off: "outside the band",
  other_sku: "another product's band",
  not_applied: "not compared",
};

export const CHIP_WORD: Record<Tone, string> = {
  pending: "–",
  running: "…",
  pass: "Pass",
  review: "Review",
  fail: "Fail",
  na: "n/a",
};

export const VERDICT_WORDS: Record<string, string> = {
  PASS: "Pass",
  PASS_WITH_NOTES: "Pass, with a note",
  RETRY: "Retry",
  FAIL: "Fail",
  ERROR: "Error",
  DRY_RUN: "Dry run",
};

/** What each block checks, said before anything has looked. Page-authored
 *  summaries of the rubric's rows, keyed by the block's letter. */
export const IDLE_LINES: Record<string, string> = {
  A: "It is this product: one of it, its own wordmark, colour and finish, nothing added, no claim.",
  B: "Not stretched or squashed, a believable size, standing on its ground.",
  C: "Soft matte stays matte; one light, one shadow, one of the brand's grounds.",
  D: "It answers its type's question, photoreal, with nothing from the brand's refused list.",
  F: "The body colour is read in pixels and set against the product's own tile.",
};

export const img = (p: string) => `/api/trinny-bench/img?p=${encodeURIComponent(p)}`;

/* ── the rubric's shape ─────────────────────────────────────────────── */

/** `**It is this subject.** The silhouette…` → `It is this subject` */
export function boldLead(check: string): string {
  const m = /\*\*(.+?)\*\*/.exec(check);
  const lead = (m ? m[1] : check.split(/(?<=\.)\s/)[0]) ?? "";
  return lead.trim().replace(/[.:]$/, "");
}

const lowerFirst = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);

/** "A. Identity. Any failure here stops the asset." → A / Identity */
export function blockLabel(heading: string): { letter: string; name: string } {
  const m = /^([A-Z])\.\s*(.*)$/.exec(heading.trim());
  if (!m) return { letter: "", name: heading };
  return { letter: m[1], name: m[2].split(/[.,]/)[0].trim() };
}

export interface Block {
  letter: string;
  name: string;
  checks: Check[];
}

/** Per-frame checks grouped by the rubric's own headings, in file order.
 *  The set-level block (E) is graded across a wave, never on one frame. */
export function blocksOf(checks: Check[]): Block[] {
  const out: Block[] = [];
  for (const c of checks) {
    if (c.set_level) continue;
    const { letter, name } = blockLabel(c.block);
    const last = out[out.length - 1];
    if (last && last.letter === letter) last.checks.push(c);
    else out.push({ letter, name, checks: [c] });
  }
  return out;
}

/** The measured block settles first; the eye's blocks follow in order. */
export function revealIndex(block: Block): number {
  if (block.checks.some((c) => c.computed)) return 0;
  return "ABCDE".indexOf(block.letter) + 1;
}
export const VERDICT_INDEX = 5;

/* ── states ─────────────────────────────────────────────────────────── */

const SETTLED: Tone[] = ["fail", "review", "pass", "na"];
export const isSettled = (t: Tone) => SETTLED.includes(t);

export function checkState(c: Check, job: Job | null): Tone {
  if (!job) return "pending";
  const m = job.measurement;
  if (c.computed) {
    if (!m) return "pending";
    if (m.state === "not_applied") return "na";
  }
  const f = job.status === "done" ? job.final : null;
  if (!f) {
    if (c.computed && m) return measuredCheck(c.id, m.state);
    return job.status === "grading" ? "running" : "pending";
  }
  if (f.unanswered?.includes(c.id)) return "review";
  if (!f.checks || !(c.id in f.checks)) return "na";
  if (f.checks[c.id]) return f.split_answers?.[c.id] ? "review" : "pass";
  return c.severity === "gate" ? "fail" : "review";
}

/** The ship's own rule for the computed rows (`bench/grade.py`): F1 holds
 *  inside the band, F2 unless another product's band is nearer. Both are
 *  advisory, so a miss is orange. */
function measuredCheck(id: string, state: string): Tone {
  if (id === "F2") return state === "other_sku" ? "review" : "pass";
  return state === "within" ? "pass" : "review";
}

export function worst(states: Tone[]): Tone {
  if (states.length === 0) return "na";
  if (states.includes("running")) return "running";
  if (states.includes("pending")) return "pending";
  return SETTLED.find((s) => states.includes(s)) ?? "na";
}

export const blockState = (block: Block, job: Job | null): Tone =>
  worst(block.checks.map((c) => checkState(c, job)));

export function verdictTone(v: string | null | undefined): Tone {
  if (v === "PASS") return "pass";
  if (v === "PASS_WITH_NOTES" || v === "RETRY") return "review";
  if (v === "FAIL") return "fail";
  return "na";
}

/* ── votes and reasons ──────────────────────────────────────────────── */

export type Vote = "pass" | "fail" | "none" | "error" | "pending";

export function votes(id: string, runs: RunRecord[], expected: number): Vote[] {
  const out: Vote[] = [];
  for (let i = 0; i < expected; i++) {
    const r = runs[i];
    if (!r) out.push("pending");
    else if (r.error && Object.keys(r.checks ?? {}).length === 0) out.push("error");
    else if (typeof r.checks?.[id] === "boolean") out.push(r.checks[id] ? "pass" : "fail");
    else out.push("none");
  }
  return out;
}

const norm = (s: string) => s.trim().replace(/[.:]$/, "").toLowerCase();

/** The plain-language caption when the rubric has one (its "Plain language"
 *  table); otherwise the check's own bold lead, said as not held. The ship
 *  fills an empty caption with the lead itself, so equal means none. */
export function failReason(c: Check): string {
  const lead = boldLead(c.check);
  const caption = c.caption?.trim() ?? "";
  if (caption && norm(caption) !== norm(lead)) return caption.replace(/\.$/, "");
  return `not held: ${lowerFirst(lead)}`;
}

function voteNote(c: Check, job: Job): string {
  if (c.computed) return "in code";
  const v = votes(c.id, job.runs ?? [], job.runs?.length ?? 0);
  const answered = v.filter((x) => x === "pass" || x === "fail");
  const failed = answered.filter((x) => x === "fail").length;
  if (answered.length === 0) return "";
  return `${failed} of ${answered.length} runs`;
}

const SEVERITY_ORDER = ["gate", "critical", "minor", "advisory"];

/** One line under a settled block: its worst check, said plainly. */
export function blockReason(block: Block, job: Job | null): string {
  const tone = blockState(block, job);
  if (!job || !isSettled(tone)) return IDLE_LINES[block.letter] ?? "";
  const m = job.measurement;
  const computed = block.checks.every((c) => c.computed);
  if (tone === "na") {
    if (computed && m?.state === "not_applied") return m.compare?.line || "Not compared.";
    return "Not graded on this job.";
  }
  const f = job.final;
  const states = block.checks.map((c) => ({ c, t: checkState(c, job) }));
  const off = states
    .filter((s) => s.t === "fail" || s.t === "review")
    .sort(
      (a, b) =>
        (a.t === "fail" ? 0 : 1) - (b.t === "fail" ? 0 : 1) ||
        SEVERITY_ORDER.indexOf(a.c.severity) - SEVERITY_ORDER.indexOf(b.c.severity)
    );
  if (computed && m) return colourReason(m);
  if (off.length === 0) {
    const runs = f?.runs ?? job.runs?.length ?? 0;
    return `Held on all ${block.checks.length} checks, ${runs} of ${runs} runs.`;
  }
  const first = off[0].c;
  let line: string;
  if (f?.unanswered?.includes(first.id)) {
    line = `no answer: ${lowerFirst(boldLead(first.check))}`;
  } else if (f?.checks?.[first.id]) {
    const split = f.split_answers?.[first.id] ?? "";
    const k = /(\d+)\s*\/\s*(\d+)/.exec(split);
    line = `not sure: ${lowerFirst(boldLead(first.check))}${k ? ` · ${k[1]} of ${k[2]} runs passed it` : ""}`;
  } else {
    const note = voteNote(first, job);
    line = `${failReason(first)}${note ? ` · ${note}` : ""}`;
  }
  return off.length > 1 ? `${line} · and ${off.length - 1} more` : line;
}

/** The measured block's line, in the ship's own numbers and lines. A set
 *  keeps the ship's sentence: it names the colours it could not find. */
export function colourReason(m: Measurement): string {
  const c = m.compare;
  if (c?.matches?.length && c.line) return c.line;
  const de = typeof c?.delta_e00 === "number" ? c.delta_e00.toFixed(1) : null;
  const limit = m.lines?.delta_e2000;
  switch (m.state) {
    case "within":
      return de
        ? `Within its band: ΔE ${de}${typeof limit === "number" ? `, inside the line of ${limit}` : ""}.`
        : "Within its band.";
    case "off":
      return de
        ? `Outside its band: ΔE ${de}${typeof limit === "number" ? `, past the line of ${limit}` : ""}.`
        : "Outside its band.";
    case "other_sku": {
      const near = c?.nearest_subject;
      const name = near ? (SUBJECT_NAMES[near] ?? near) : "another product";
      return `Another product's colour: nearer ${name}'s band than its own${de ? ` (ΔE ${de})` : ""}.`;
    }
    default:
      return c?.line || "Not compared.";
  }
}

/** What a stranger saw, never shown for a rehearsal: its read is a stub. */
export function strangerLine(job: Job | null): string {
  if (!job?.stranger) return "";
  if (job.offline || job.stranger.offline) return "No stranger in a rehearsal.";
  if (job.stranger.error) return "The stranger's read failed.";
  const saw = job.stranger.reads_as?.trim();
  if (!saw) return "";
  const parts = job.stranger.part_counts?.trim();
  return `A stranger saw “${saw}”${parts ? `, ${parts}` : ""}.`;
}

/** The verdict card's one line. */
export function verdictLine(job: Job | null, checks: Check[]): string {
  if (!job) return "";
  if (job.status === "error") return job.error ?? "The runner stopped.";
  const f = job.final;
  if (!f) return "";
  const byId = new Map(checks.map((c) => [c.id, c]));
  const runs = job.runs ?? [];
  if (runs.length > 0 && runs.every((r) => r.error && Object.keys(r.checks ?? {}).length === 0))
    return `No run answered: ${runs[0].error}`;
  const failed = f.failed ?? [];
  if (f.unanswered?.length) {
    const ids = f.unanswered.join(", ");
    return `No answer on ${ids}: the rubric counts that as a fail.`;
  }
  if (failed.length > 0) {
    const worstIssue = f.worst_issue?.trim();
    if (worstIssue && !job.offline && !/\(offline\)$/.test(worstIssue)) return worstIssue;
    const gate = failed.find((x) => x.severity === "gate") ?? failed[0];
    const c = byId.get(gate.id);
    return c ? failReason(c) : gate.check;
  }
  if ((f.failed_advisory ?? []).some((x) => x.id === "F1" || x.id === "F2"))
    return "The measured colour disagrees: advisory, not counted.";
  const splits = Object.keys(f.split_answers ?? {});
  if (splits.length > 0) return `Held, though the runs split on ${splits.join(", ")}.`;
  return "Held on every check, three runs out of three.";
}

/* ── the run's phases ───────────────────────────────────────────────── */

export type Phase =
  | "idle"
  | "starting"
  | "queued"
  | "drawing"
  | "placing"
  | "measuring"
  | "stranger"
  | "grading"
  | "done"
  | "error";

export function phaseOf(job: Job | null, busy: boolean): Phase {
  if (!job) return busy ? "starting" : "idle";
  switch (job.status) {
    case "queued":
      return "queued";
    case "drawing":
      return job.origin === "upload" ? "placing" : "drawing";
    case "measuring":
      return job.measurement ? "stranger" : "measuring";
    case "grading":
      return "grading";
    case "done":
      return "done";
    case "error":
      return "error";
    default:
      return "queued";
  }
}

export function phaseWord(job: Job | null, busy: boolean, runsExpected: number): string {
  const p = phaseOf(job, busy);
  switch (p) {
    case "idle":
      return "Ready";
    case "starting":
      return "Starting";
    case "queued":
      return "Queued";
    case "drawing":
      return "Drawing";
    case "placing":
      return "Placing the file";
    case "measuring":
      return "Measuring colour";
    case "stranger":
      return "A stranger looks";
    case "grading":
      return `Grading · ${job?.runs?.length ?? 0} of ${runsExpected} back`;
    case "done":
      return VERDICT_WORDS[job?.final?.verdict ?? ""] ?? "Done";
    case "error":
      return "Error";
  }
}

export type StepState = "pending" | "active" | "done" | "stopped";
export interface Step {
  key: "draw" | "measure" | "stranger" | "grade";
  label: string;
  state: StepState;
  seconds: number | null;
}

const STEP_KEYS = ["draw", "measure", "stranger", "grade"] as const;

/** Which step is in flight: the three grades run in parallel, so "Grade"
 *  is one step that counts its runs back. */
function activeStep(p: Phase): number {
  switch (p) {
    case "starting":
    case "queued":
    case "drawing":
    case "placing":
      return 0;
    case "measuring":
      return 1;
    case "stranger":
      return 2;
    case "grading":
      return 3;
    case "done":
      return 4;
    default:
      return -1;
  }
}

export function phaseSteps(
  job: Job | null,
  busy: boolean,
  runsExpected: number,
  mode: Mode
): Step[] {
  const p = phaseOf(job, busy);
  const upload = job ? job.origin === "upload" : mode === "upload";
  const secs = job?.seconds ?? {};
  const reached = [!!job?.file, !!job?.measurement, !!job?.stranger, !!job?.final];
  const stoppedAt = p === "error" ? reached.findIndex((r) => !r) : -1;
  const at = activeStep(p);
  return STEP_KEYS.map((key, i) => {
    let state: StepState = "pending";
    if (p === "error") state = reached[i] ? "done" : i === stoppedAt ? "stopped" : "pending";
    else if (at > i) state = "done";
    else if (at === i) state = "active";
    const label =
      key === "draw"
        ? upload
          ? "Place"
          : "Draw"
        : key === "measure"
          ? "Measure"
          : key === "stranger"
            ? "Stranger"
            : state === "active"
              ? `Grade ${job?.runs?.length ?? 0}/${runsExpected}`
              : "Grade";
    const raw = secs[key];
    const seconds = state === "done" && typeof raw === "number" && raw > 0 ? raw : null;
    return { key, label, state, seconds };
  });
}

/** Seconds the job has taken, from its own record. */
export function jobSeconds(job: Job | null): number | null {
  if (!job?.seconds) return null;
  const s = Object.values(job.seconds).reduce((a, b) => a + (typeof b === "number" ? b : 0), 0);
  return s > 0 ? Math.round(s) : null;
}

/* ── the picture ────────────────────────────────────────────────────── */

export interface BoxStyle {
  left: string;
  top: string;
  width: string;
  height: string;
}

/** A normalised `[x0, y0, x1, y1]` (bench/colour.py) as percentages inside
 *  a wrapper that has exactly the image's aspect ratio. */
export function boxStyle(box: number[] | null | undefined): BoxStyle | null {
  if (!box || box.length !== 4 || box.some((v) => typeof v !== "number" || Number.isNaN(v)))
    return null;
  const c = (v: number) => Math.min(1, Math.max(0, v));
  const [x0, y0, x1, y1] = box.map(c);
  if (x1 <= x0 || y1 <= y0) return null;
  const pct = (v: number) => `${+(v * 100).toFixed(2)}%`;
  return { left: pct(x0), top: pct(y0), width: pct(x1 - x0), height: pct(y1 - y0) };
}

/** Where the label sits: above the box unless the box touches the top. */
export const labelBelow = (box: number[] | null | undefined) => !!box && box[1] < 0.08;

/** "4:5" → 0.8 (width over height). */
export function arOf(ar: string | null | undefined): number {
  const m = /^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/.exec(ar ?? "");
  if (!m) return 1;
  const w = Number(m[1]);
  const h = Number(m[2]);
  return w > 0 && h > 0 ? w / h : 1;
}

/** The highlight's tone: the worse of what the eye and the code said about
 *  the product (A and F), once either has settled. */
export function highlightTone(blocks: Block[], job: Job | null): Tone {
  const ids = blocks.filter((b) => b.letter === "A" || b.checks.some((c) => c.computed));
  const tones = ids.map((b) => blockState(b, job)).filter(isSettled);
  return tones.length ? worst(tones) : "pending";
}

export function colourSummary(m: Measurement | null): { de: number | null; word: string } {
  if (!m) return { de: null, word: "" };
  return { de: m.compare?.delta_e00 ?? null, word: STATE_WORD[m.state] ?? m.state };
}

/* ── the evals ──────────────────────────────────────────────────────── */

const SLOT = /^([A-Z]{1,3})-([a-z0-9-]+?)__/;

/** The subject and type a regression case must be checked as. Read off
 *  the file it was derived from, never off its colour: the plum-swap
 *  negative is Naked Ambition, and a colour guess would call it Overnight. */
export function caseTarget(
  file: string,
  derivedFrom?: string | null
): { type: string; subject: string } | null {
  const src = derivedFrom || file.replace(/^pos-/, "");
  const m = SLOT.exec(src);
  if (m) return { type: m[1], subject: m[2] };
  const n = /^neg-([a-z0-9]+)-/.exec(file);
  return n ? { type: "H", subject: n[1] } : null;
}

export function negativeResult(
  n: { held: boolean; must_fail: string[]; hits: Record<string, number> },
  runs: number
): { held: boolean; word: string } {
  const hits = n.must_fail.length ? Math.min(...n.must_fail.map((id) => n.hits[id] ?? 0)) : 0;
  return { held: n.held, word: `${n.held ? "Held" : "Missed"} ${hits}/${runs}` };
}

export function positiveResult(
  p: { pass_fraction: number },
  runs: number
): { clean: boolean; word: string } {
  const clean = p.pass_fraction >= 0.67;
  const passes = Math.round(p.pass_fraction * runs);
  return { clean, word: `${clean ? "Clean" : "Noisy"} ${passes}/${runs}` };
}

/** How strictly each check holds: the rubric's severity column, read as
 *  degrees of freedom. Fixed = the gates; adapted = everything judged. */
export function strictness(checks: Check[]): { fixed: Check[]; adapted: Block[] } {
  const perFrame = checks.filter((c) => !c.set_level);
  const fixed = perFrame.filter((c) => c.severity === "gate");
  const adapted = blocksOf(perFrame.filter((c) => c.severity !== "gate"));
  return { fixed, adapted };
}

export const perFrameCount = (cfg: BenchConfig | null) =>
  (cfg?.checks ?? []).filter((c) => !c.set_level).length;

/** Join a folder and a file name with the folder's own separator. */
export function joinPath(folder: string, file: string): string {
  const sep = folder.includes("\\") ? "\\" : "/";
  return folder.replace(/[\\/]+$/, "") + sep + file;
}
