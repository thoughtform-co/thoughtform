/**
 * consoleFixture — variant v5's lab fixture.
 *
 * `imapData.ts` stays the source of truth for the eight workstreams, the six
 * substrates, the teams, the tiers and the six component values. THIS file adds
 * only what the three-level console needs on top of it, and every record here is
 * traceable to something the owner authored:
 *
 *   · WORKSTREAM NAMES — his round-5 instruction, verbatim: a workstream must
 *     not sound like a Skill. So the verb suffixes come off the `imapData`
 *     titles (PACKAGING QA → PACKAGING, BRAND COPY CHECK → BRAND COPY, INVOICE
 *     CHECK → INVOICE MATCHING, LEDGER CHECK → LEDGER CONTROL) and the four that
 *     already read as workflows are untouched. W-codes are unchanged, so the
 *     rename costs nothing at the port.
 *   · RELATIVE LOAD — the values from his console v3's allocation ledger
 *     (BRAND COPY 46/MID, NDA 84/HIGH, RELEASE AUDIT 94/HIGH, INVOICE 24/LOW,
 *     STATUS DIGEST — his DAILY BRIEF — 29/LOW, IDEA TEST — his PRODUCT
 *     IDEATION — 59/MID). ⚠ TWO ARE MINE: his ledger only carried six rows, so
 *     PACKAGING (41) and LEDGER CONTROL (33) are interpolated from their tier and
 *     mode. They are flagged here and nowhere else.
 *   · CADENCE / INPUT MASS — mine, and the reason L3 exists: a draw figure alone
 *     is a usage chart. Plain words only, never a count.
 *   · WHY THIS INTELLIGENCE — his ledger's last column.
 *   · COMPONENT ROLE CAPTIONS — his console v3 module cards, verbatim.
 *
 * ── WHAT MAY NOT APPEAR HERE (rules/proof.md, Intelligence Map clause) ──────
 * No vendor or model names, no personal names or initials, no currency, no token
 * counts. The MODEL component publishes a generic capability lane (it already
 * does in `imapData`), the PERSON component publishes a ROLE, and the flow at L3
 * is a RELATIVE BAND read against the workload — never a price and never a
 * telemetry figure.
 */

import { TIERS, WORKS, type ComponentKey, type TierName } from "../imapData";

/* ══ The three levels ═════════════════════════════════════════════════════ */

export type Level = 0 | 1 | 2;

export interface LevelSpec {
  level: Level;
  ord: string;
  name: string;
  /** The plain-English sublabel. His round-5 rule: "estate" is out, and a
   *  sublabel has to say what the level READS, not what ratio it is at. */
  sub: readonly string[];
  /** What the next scroll / click does, printed in the hint strip. */
  hint: string;
}

export const LEVELS: readonly LevelSpec[] = [
  {
    level: 0,
    ord: "01",
    name: "WORKSTREAMS",
    sub: ["THE MAP", "OF WORK"],
    hint: "CLICK A WORKSTREAM TO OPEN WHAT RUNS IT · V CHANGES THE VIEW · SCROLL IN TO ZOOM",
  },
  {
    level: 1,
    ord: "02",
    name: "CONFIGURATION",
    sub: ["WHAT", "RUNS IT"],
    hint: "SCROLL IN TO ENERGIZE THIS SWITCHBOARD · SCROLL OUT FOR THE MAP OF WORK",
  },
  {
    level: 2,
    ord: "03",
    name: "OPERATION",
    sub: ["WHAT RUNS", "THROUGH IT"],
    hint: "FLOW IS RELATIVE DRAW READ AGAINST THE WORKLOAD · SCROLL OUT TO LEAVE IT IDLE",
  },
];

/* ══ The three VIEWS — they belong to L1 only ══════════════════════════════
   His round-5 correction: "the shared layer is a way of ORGANIZING the levels,
   not a level on its own." So team / substrate / allocation regroup the same
   eight chips on the same board; they never become a fourth level. ═════════ */

export type View = "team" | "substrate" | "allocation";

export interface ViewSpec {
  id: View;
  label: string;
  /** What the board's organising line says under this view. */
  line: string;
}

export const VIEWS: readonly ViewSpec[] = [
  { id: "team", label: "BY TEAM", line: "RAILS NAME THE TEAM THAT OWNS THE WORKSTREAM" },
  {
    id: "substrate",
    label: "BY SUBSTRATE",
    line: "A JUNCTION MEANS THIS WORKSTREAM DRAWS ON THAT SUBSTRATE",
  },
  { id: "allocation", label: "BY ALLOCATION", line: "LANES NAME THE CAPABILITY THE WORK NEEDS" },
];

export const VIEW_IDS = VIEWS.map((v) => v.id);

/* ══ The six modules — his console v3 cards ════════════════════════════════ */

export interface ModuleSpec {
  key: ComponentKey;
  code: string;
  /** His label, which is PERSON / TOOLS / EVALS where `imapData` says
   *  HUMAN / EXECUTION / EVAL. The switchboard is his, so the labels are his. */
  label: string;
  /** His role caption, top-right of the card. */
  role: string;
}

export const MODULES: readonly ModuleSpec[] = [
  { key: "human", code: "H", label: "PERSON", role: "SETS THE BAR" },
  { key: "model", code: "M", label: "MODEL", role: "GENERAL CAPABILITY" },
  { key: "skill", code: "S", label: "SKILL", role: "ENCODED JUDGMENT" },
  { key: "context", code: "C", label: "CONTEXT", role: "LOCAL GROUNDING" },
  { key: "execution", code: "X", label: "TOOLS", role: "RETRIEVE + CHECK" },
  { key: "eval", code: "E", label: "EVALS", role: "PROOF" },
];

/* ══ The operating contract rail — his three delegation levels ═════════════ */

export const CONTRACT = [
  { mode: "PERSON-LED", note: "AI SUPPORTS · THE PERSON CARRIES THE JUDGMENT" },
  { mode: "SHARED", note: "AI HANDLES THE REPEATABLE MIDDLE · THE PERSON OWNS THE HARD CALLS" },
  { mode: "SYSTEM-LED", note: "STABLE WORK RUNS · THE PERSON HANDLES EXCEPTIONS" },
] as const;

/* ══ Per-workstream operating record ══════════════════════════════════════ */

export type LoadBand = "LOW" | "MID" | "HIGH";

export interface StreamRecord {
  /** The verb-suffix-free workstream name. */
  name: string;
  /** Relative draw, 0–100. NOT a token count and NOT a price — the legend at L3
   *  says so on the glass. */
  load: number;
  band: LoadBand;
  cadence: string;
  inputMass: string;
  why: string;
  /** The last six eval verdicts, newest last. `true` = cleared the bar,
   *  `false` = flagged and escalated to the human checkpoint. */
  verdicts: readonly boolean[];
}

/** Tier → complexity class, in plain words. The tier is the capability lane; the
 *  class is what the work is LIKE, which is the half of the story a draw figure
 *  cannot tell. */
export const COMPLEXITY: Readonly<Record<TierName, string>> = {
  FAST: "ROUTINE",
  EVERYDAY: "BOUNDED",
  DEEP: "NUANCED",
  FRONTIER: "HARDEST",
};

export const STREAMS: Readonly<Record<string, StreamRecord>> = {
  W01: {
    name: "NDA REVIEW",
    load: 84,
    band: "HIGH",
    cadence: "PER CONTRACT",
    inputMass: "FEW LONG DOCUMENTS",
    why: "NUANCED RISK / NON-STANDARD CLAUSES",
    verdicts: [true, true, false, true, true, true],
  },
  W02: {
    name: "RELEASE AUDIT",
    load: 94,
    band: "HIGH",
    cadence: "PER RELEASE",
    inputMass: "LARGE REPOSITORY + LOGS",
    why: "REPO + LOGS / HARDWARE COMPLEXITY",
    verdicts: [true, false, true, true, false, true],
  },
  W03: {
    name: "IDEA TEST",
    load: 59,
    band: "MID",
    cadence: "PER CONCEPT",
    inputMass: "OPEN BRIEF + RESEARCH",
    why: "AMBIGUITY / SENIOR JUDGMENT",
    verdicts: [true, true, true, false, true, true],
  },
  W04: {
    /* ⚠ INTERPOLATED LOAD (1 of 2). His ledger had no packaging row; 41 sits
       where an EVERYDAY, SHARED, claim-gated stream sits between INVOICE (24)
       and BRAND COPY (46). */
    name: "PACKAGING",
    load: 41,
    band: "MID",
    cadence: "PER SKU",
    inputMass: "MANY SOURCE FILES",
    why: "CLAIM GATES / PRODUCTION RULES",
    verdicts: [true, true, true, true, false, true],
  },
  W05: {
    name: "BRAND COPY",
    load: 46,
    band: "MID",
    cadence: "PER CAMPAIGN",
    inputMass: "MANY SHORT DRAFTS",
    why: "VOICE + CLAIMS + CHANNEL CONTEXT",
    verdicts: [true, true, true, true, true, false],
  },
  W06: {
    name: "INVOICE MATCHING",
    load: 24,
    band: "LOW",
    cadence: "DAILY",
    inputMass: "HIGH VOLUME · SHORT ITEMS",
    why: "BOUNDED MATCHING / ESCALATE EXCEPTIONS",
    verdicts: [true, true, true, true, true, true],
  },
  W07: {
    /* ⚠ INTERPOLATED LOAD (2 of 2). Same reasoning: SYSTEM-LED anomaly review
       over a large but structured ledger draws a little above INVOICE. */
    name: "LEDGER CONTROL",
    load: 33,
    band: "LOW",
    cadence: "MONTHLY CLOSE",
    inputMass: "LARGE STRUCTURED LEDGER",
    why: "ANOMALY TRACE / CONTROL LOGIC",
    verdicts: [true, true, false, true, true, true],
  },
  W08: {
    name: "STATUS DIGEST",
    load: 29,
    band: "LOW",
    cadence: "WEEKLY",
    inputMass: "MANY SCATTERED UPDATES",
    why: "RECURRING INPUT / STRUCTURED OUTPUT",
    verdicts: [true, true, true, true, true, true],
  },
};

/* ══ Flow density ═════════════════════════════════════════════════════════
   THE ONE HARD CONSTRAINT: no gradients. A gradient is off-brand and it also
   lies — it reads as a continuous quantity where there is a band. So flow is
   DISCRETE DOTS travelling the wire, and density is the dash period.

   The period must DIVIDE the animation's dash-offset travel or the loop seams
   visibly. Travel is a flat −100, so every period below is a divisor of 100 and
   the four bands are 5 / 10 / 20 / 25 px — 11, 6, 3 and 2.5 dots per 100px of
   wire. Speed is a constant duration, so only DENSITY carries the reading.
   Reduced motion keeps the dasharray and drops the animation: the same density,
   read as a static dot pattern. ═══════════════════════════════════════════ */

export interface FlowBand {
  /** SVG `stroke-dasharray`. Dot length 2, gap = period − 2. */
  dash: string;
  /** For the legend and the register. */
  word: string;
}

export const FLOW_BANDS: readonly FlowBand[] = [
  { dash: "2 23", word: "SPARSE" }, // period 25
  { dash: "2 18", word: "LOW" }, // period 20
  { dash: "2 8", word: "STEADY" }, // period 10
  { dash: "2 3", word: "DENSE" }, // period 5
];

export function flowBand(load: number): number {
  if (load >= 75) return 3;
  if (load >= 50) return 2;
  if (load >= 30) return 1;
  return 0;
}

/** Lane aggregate: the MEAN relative draw of the workstreams seated in a lane,
 *  which is "what a workstream in this lane tends to draw" — the honest
 *  aggregation. A SUM would just restate how many streams the lane holds. */
export function laneBand(tier: TierName): { load: number; band: LoadBand } {
  const inLane = WORKS.filter((w) => w.tier === tier);
  if (!inLane.length) return { load: 0, band: "LOW" };
  const load = Math.round(inLane.reduce((sum, w) => sum + STREAMS[w.id].load, 0) / inLane.length);
  return { load, band: load >= 65 ? "HIGH" : load >= 38 ? "MID" : "LOW" };
}

export const LANE_AGGREGATE = Object.fromEntries(
  TIERS.map((tier) => [tier, laneBand(tier)])
) as Readonly<Record<TierName, { load: number; band: LoadBand }>>;

/** The eval count, taken off `imapData`'s E component value ("12 REAL CASES"). */
export function evalCount(workId: string): string {
  const work = WORKS.find((w) => w.id === workId);
  return work?.components.eval[0] ?? "";
}

export const streamName = (workId: string): string => STREAMS[workId]?.name ?? workId;

export const LEGEND = "FLOW = RELATIVE DRAW, READ AGAINST THE WORKLOAD · NEVER A PRICE";
