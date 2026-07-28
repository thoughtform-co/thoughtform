import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { PROOF_CASE } from "@/lib/cases/registry";

/**
 * fieldLogData — the lab-local content model for the casefile format.
 *
 * Follows `proof-dossier-lab/dossierLabData.ts`: import the CANONICAL
 * modules, add only what this FORMAT needs, and keep the additions here
 * until the design settles. Promotion path is a `CaseCasefile` field on
 * `CaseDef` (`lib/cases/types.ts`) plus a generator branch in
 * `lib/v7-parse/proofStation.ts` — at which point these strings move under
 * `lib/cases/` and `tests/lib/cases-registry.test.ts` starts covering them.
 *
 * NUMBERS. Every Loop figure below is either lifted verbatim from
 * `lib/cases/content/loop-earplugs.ts` or derived from a sentence in it.
 * The `Thoughtform Prime` handoff printed `15+ TEAMS / 20+ SKILLS / 04 TOOLS
 * / 90%` — that predates the ADR-054 numbers doctrine and is NOT used. The
 * canonical four are 22 workshops · 42 Skills · 4 tools · 5 → 130+ people.
 * "90% of paid social" is deliberately absent: it is a near-variant of the
 * "95% of briefings" claim already published on the ai-keynote arc page, and
 * a second variant of one claim on a second surface drifts.
 *
 * CONFIDENTIALITY. Same envelope as `lib/cases/` — no money, no internal
 * links, first names only. Enforced by `tests/lib/field-log-data.test.ts`;
 * treat a failure there as a real incident, never as a test to relax.
 *
 * PLACEHOLDERS. Clients 02 and 03 have no case written yet. They ship real
 * STRUCTURE with template-slot content (`NN`, `NN+`, prose that names what
 * goes there) so the tab switch is judged at full layout weight while being
 * unmistakably non-factual. Their `placeholder` flag drives a gold chip in
 * the head and a console warning.
 */

/* ── Copy primitives ──────────────────────────────────────────────────── */

/** A run of copy. `{ em }` renders as the upright-gold wash marker — the
 *  brand's only emphasis (no italics, ever). */
export type FlSegment = string | { em: string };

/** The client title: plain lead, gold tail. Mirrors `CaseTitle`. */
export interface FlTitle {
  pre: string;
  em?: string;
}

/* ── Visuals ──────────────────────────────────────────────────────────── */

/** One vertex on the adoption-signal curve. `x` runs 0 → 1 across the
 *  timeline, `y` runs 0 (floor) → 1 (present). Data, not a hand-drawn
 *  bezier — a second client's curve is four numbers, not a new path. */
export interface FlSignalPoint {
  x: number;
  y: number;
  /** Mono stamp above the label, e.g. "24.Q4". */
  stamp: string;
  label: string;
}

/** The evidence plate for a track. `log` / `registry` / `tools` are the
 *  ADR-054 `CaseVisual` kinds re-declared for React rendering; `signal`,
 *  `register` and `readouts` are new to this format. */
export type FlVisual =
  | {
      kind: "signal";
      points: readonly FlSignalPoint[];
      t0: string;
      now: string;
    }
  | {
      kind: "log";
      rows: readonly { t: string; event: string }[];
      tail?: string;
    }
  | {
      kind: "registry";
      groups: readonly { name: string; gloss: string }[];
      rows: readonly { team: string; name: string; tag?: string }[];
      footer?: string;
    }
  | { kind: "tools"; toolIds: readonly string[] }
  | {
      kind: "register";
      rows: readonly { k: string; v: string }[];
      footer?: string;
    }
  /** The readout block IS the plate — used by METRICS.DAT. */
  | { kind: "readouts" };

/* ── Track + directory ────────────────────────────────────────────────── */

export interface FlReadout {
  value: string;
  label: string;
}

export interface FlTrack {
  /** DOM id fragment; also the `?f=` deep-link value. */
  id: string;
  /** The directory row's filename, rendered verbatim in mono caps. */
  file: string;
  /** The directory row's right-hand meta, e.g. "22 WORKSHOPS". */
  meta: string;
  /** `doc` draws the dog-eared page glyph, `dir` the folder glyph. */
  icon: "doc" | "dir";
  /** Right column head, left slot. */
  preview: string;
  /** Right column head, right slot. */
  vizLabel: string;
  visual: FlVisual;
  /** Two to four tiles under the plate. */
  readouts: readonly FlReadout[];
  /** Three dotted-leader rows under the readouts. */
  context: readonly { k: string; v: string }[];
  /** Mono provenance line at the foot of the right column. */
  source: string;
}

export interface FlClient {
  slug: string;
  /** Tab ordinal, e.g. "01". */
  ix: string;
  /** Tab label, rendered in mono caps. */
  tab: string;
  /** TF-<year of first contact>. */
  logCode: string;
  state: string;
  title: FlTitle;
  classLine: string;
  brief: readonly FlSegment[];
  /** The operator's own line, first person. Rendered after `LOG.001 >`. */
  logEntry: string;
  tracks: readonly FlTrack[];
  /** True while the client has no written case — see the docblock. */
  placeholder?: boolean;
}

/* ═══ 01 · Loop Earplugs — the real case ══════════════════════════════ */

const LOOP_BEATS = PROOF_CASE.beats;
const LOOP_STATS = PROOF_CASE.report.stats;

/** The canonical rollout log, re-read as an adoption curve. Milestones are
 *  the log's own rows — the handoff's invented quarters (25.Q2 "skill layer
 *  live", 25.Q4 "4 tools shipped") are not in `lib/cases` and are not used.
 *  The y-axis is the seat count the `5 → 130+` stat already publishes. */
const LOOP_SIGNAL: readonly FlSignalPoint[] = [
  { x: 0.04, y: 0.06, stamp: "2024", label: "Embedded" },
  { x: 0.3, y: 0.24, stamp: "Pilot", label: "69 seats" },
  { x: 0.66, y: 0.62, stamp: "26.Q2", label: "22 teams briefed" },
  { x: 0.95, y: 0.94, stamp: "Now", label: "130+ on the layer" },
];

const LOOP_TRACKS: readonly FlTrack[] = [
  {
    id: "report",
    file: "00_MISSION-REPORT.LOG",
    meta: "2.4 KB",
    icon: "doc",
    preview: "Preview — 00_mission-report.log",
    vizLabel: "Viz — adoption signal",
    visual: {
      kind: "signal",
      points: LOOP_SIGNAL,
      t0: "T0 — embedded · 2024",
      now: "Active — 2026.07",
    },
    readouts: LOOP_STATS.map((s) => ({ value: s.value, label: s.label })),
    context: [
      { k: "Role", v: "Embedded AI lead" },
      { k: "Mandate", v: "Adoption · tooling" },
      { k: "Governance", v: "Legal · IT" },
    ],
    source: "Source — metrics.dat · sampled quarterly · rev 2026.07",
  },
  {
    id: "transformation",
    file: "01_AI-TRANSFORMATION/",
    meta: "22 WORKSHOPS",
    icon: "dir",
    preview: "Preview — 01_ai-transformation/",
    vizLabel: "Log — rollout",
    visual: {
      kind: "log",
      rows: LOOP_BEATS[0].visual.kind === "log" ? LOOP_BEATS[0].visual.rows : [],
      tail: LOOP_BEATS[0].visual.kind === "log" ? LOOP_BEATS[0].visual.tail : undefined,
    },
    readouts: [
      { value: "22", label: "workshops run" },
      { value: "5 → 130+", label: "people on the layer" },
      { value: "21", label: "days to a practice" },
      { value: "03", label: "tracks in parallel" },
    ],
    context: [
      { k: "Frame", v: "45 min, every team" },
      { k: "Trigger", v: "Inbound demand" },
      { k: "Handoff", v: "Per-team steward" },
    ],
    source: "Source — rollout log · one workflow worth encoding, per team",
  },
  {
    id: "skill-layer",
    file: "02_SKILL-LAYER/",
    meta: "42 SKILLS",
    icon: "dir",
    preview: "Preview — 02_skill-layer/",
    vizLabel: "Registry — 42 in motion",
    visual: {
      kind: "registry",
      groups: LOOP_BEATS[1].visual.kind === "registry" ? LOOP_BEATS[1].visual.groups : [],
      rows: LOOP_BEATS[1].visual.kind === "registry" ? LOOP_BEATS[1].visual.rows : [],
      footer: LOOP_BEATS[1].visual.kind === "registry" ? LOOP_BEATS[1].visual.footer : undefined,
    },
    readouts: [
      { value: "42", label: "Skills encoded" },
      { value: "05", label: "recurring shapes" },
      { value: "295", label: "real ads read by one Skill" },
    ],
    context: [
      { k: "Owned by", v: "The team" },
      { k: "Versioning", v: "One governed repo" },
      { k: "Grounding", v: "Their own work" },
    ],
    source: "Source — skills registry · exec headline count · rev 2026.07",
  },
  {
    id: "video",
    file: "03_AI-VIDEO/",
    meta: "30+ MARKETS",
    icon: "dir",
    preview: "Preview — 03_ai-video/",
    vizLabel: "Log — production line",
    visual: {
      kind: "log",
      rows: [
        { t: "Built", event: "Dubbing pipeline, with the localization team" },
        { t: "Handover", event: "Product-managed end to end by that team" },
        { t: "Reach", event: "Thirty-plus markets" },
        { t: "Shipped", event: "A world-first AI above-the-line film" },
        { t: "Next", event: "The same pipeline, moving above the line" },
      ],
      tail: "Handed over, not just delivered.",
    },
    readouts: [
      { value: "30+", label: "markets served" },
      { value: "01", label: "world-first AI film" },
      { value: "04", label: "tools on the same layer" },
    ],
    context: [
      { k: "Owner", v: "Localization team" },
      { k: "Mode", v: "Handover" },
      { k: "Stands on", v: "The Skills layer" },
    ],
    source: "Source — production line · rev 2026.07",
  },
  {
    id: "tooling",
    file: "04_TOOLING/",
    meta: "4 TOOLS",
    icon: "dir",
    preview: "Preview — 04_tooling/",
    vizLabel: "Fleet — in production",
    visual: {
      kind: "tools",
      toolIds: LOOP_BEATS[2].visual.kind === "tool-strip" ? LOOP_BEATS[2].visual.toolIds : [],
    },
    readouts: [
      { value: "04", label: "production tools" },
      { value: "42", label: "Skills they stand on" },
      { value: "Days → min", label: "briefing synthesis" },
    ],
    context: [
      { k: "Built with", v: "The workflow owner" },
      { k: "Instead of", v: "Off-the-shelf" },
      { k: "Cadence", v: "Daily" },
    ],
    source: "Source — fleet registry · rev 2026.07",
  },
  {
    id: "governance",
    file: "GOVERNANCE.MD",
    meta: "LEGAL · IT",
    icon: "doc",
    preview: "Preview — governance.md",
    vizLabel: "Register — parallel tracks",
    visual: {
      kind: "register",
      rows: [
        { k: "Agreement", v: "Enterprise, signed" },
        { k: "Access", v: "Single sign-on" },
        { k: "Review", v: "Every connector, legal-reviewed" },
        { k: "Ownership", v: "One steward per team" },
      ],
      footer: "Three tracks, run alongside the rollout — never after it.",
    },
    readouts: [
      { value: "03", label: "tracks in parallel" },
      { value: "22", label: "teams briefed, each with a steward" },
      { value: "21", label: "days to a functioning practice" },
    ],
    context: [
      { k: "Legal", v: "From workshop one" },
      { k: "IT", v: "SSO · connectors" },
      { k: "Cadence", v: "Alongside" },
    ],
    source: "Source — governance track · rev 2026.07",
  },
  {
    id: "metrics",
    file: "METRICS.DAT",
    meta: "4 READOUTS",
    icon: "doc",
    preview: "Preview — metrics.dat",
    vizLabel: "Readouts — sampled quarterly",
    visual: { kind: "readouts" },
    readouts: LOOP_STATS.map((s) => ({
      value: s.value,
      label: s.detail ? `${s.label} · ${s.detail}` : s.label,
    })),
    context: [
      { k: "Client", v: "Loop Earplugs" },
      { k: "Period", v: "2024 · ongoing" },
      { k: "Status", v: "Live" },
    ],
    source: "Source — metrics.dat · sampled quarterly · rev 2026.07",
  },
];

const LOOP_CLIENT: FlClient = {
  slug: "loop-earplugs",
  ix: "01",
  tab: "LOOP EARPLUGS",
  logCode: "TF-24",
  state: "On record",
  title: { pre: "Loop Earplugs", em: "." },
  classLine: "AI adoption · marketing → company-wide · 2024 — active",
  // The canonical lede (`PROOF_CASE.report.lede`) verbatim, with one clause
  // marked for the gold wash. Re-typed as segments rather than read off the
  // string so the emphasis is data, not a fragile substring match.
  brief: [
    "Eighteen months embedded in one company. ",
    { em: "Every team briefed on the same forty-five minute frame" },
    ", the judgment that came out of those rooms encoded as Skills the teams own, and production tools built where off-the-shelf software never fit. The same Arc we teach, run at company scale.",
  ],
  logEntry:
    "I moved from the AI team into marketing to show AI would elevate them, not replace them.",
  tracks: LOOP_TRACKS,
};

/* ═══ 02 / 03 · placeholders ═════════════════════════════════════════════
   Real structure, template-slot content. Nothing here is a claim. ══════ */

const PLACEHOLDER_SIGNAL: readonly FlSignalPoint[] = [
  { x: 0.05, y: 0.08, stamp: "NN.QN", label: "Milestone" },
  { x: 0.36, y: 0.3, stamp: "NN.QN", label: "Milestone" },
  { x: 0.68, y: 0.58, stamp: "NN.QN", label: "Milestone" },
  { x: 0.95, y: 0.9, stamp: "NN.QN", label: "Milestone" },
];

function placeholderTracks(prefix: string): readonly FlTrack[] {
  return [
    {
      id: "report",
      file: "00_MISSION-REPORT.LOG",
      meta: "— KB",
      icon: "doc",
      preview: "Preview — 00_mission-report.log",
      vizLabel: "Viz — adoption signal",
      visual: {
        kind: "signal",
        points: PLACEHOLDER_SIGNAL,
        t0: "T0 — awaiting content",
        now: "Awaiting content",
      },
      readouts: [
        { value: "NN", label: "primary readout" },
        { value: "NN+", label: "second readout" },
        { value: "NN", label: "third readout" },
        { value: "NN%", label: "fourth readout" },
      ],
      context: [
        { k: "Role", v: "Awaiting content" },
        { k: "Mandate", v: "Awaiting content" },
        { k: "Governance", v: "Awaiting content" },
      ],
      source: `Slot — ${prefix} mission report · no case written`,
    },
    {
      id: "track-01",
      file: "01_TRACK-ONE/",
      meta: "— ITEMS",
      icon: "dir",
      preview: "Preview — 01_track-one/",
      vizLabel: "Log — track one",
      visual: {
        kind: "log",
        rows: [
          { t: "NN.QN", event: "First beat of the track goes here" },
          { t: "NN.QN", event: "Second beat of the track goes here" },
          { t: "NN.QN", event: "Third beat of the track goes here" },
          { t: "Now", event: "Where the track stands today" },
        ],
        tail: "One line closing the track.",
      },
      readouts: [
        { value: "NN", label: "primary readout" },
        { value: "NN+", label: "second readout" },
        { value: "NN", label: "third readout" },
      ],
      context: [
        { k: "Frame", v: "Awaiting content" },
        { k: "Trigger", v: "Awaiting content" },
        { k: "Handoff", v: "Awaiting content" },
      ],
      source: `Slot — ${prefix} track one · no case written`,
    },
    {
      id: "track-02",
      file: "02_TRACK-TWO/",
      meta: "— ITEMS",
      icon: "dir",
      preview: "Preview — 02_track-two/",
      vizLabel: "Register — track two",
      visual: {
        kind: "register",
        rows: [
          { k: "Field", v: "Awaiting content" },
          { k: "Field", v: "Awaiting content" },
          { k: "Field", v: "Awaiting content" },
          { k: "Field", v: "Awaiting content" },
        ],
        footer: "One line closing the register.",
      },
      readouts: [
        { value: "NN", label: "primary readout" },
        { value: "NN", label: "second readout" },
        { value: "NN+", label: "third readout" },
      ],
      context: [
        { k: "Owner", v: "Awaiting content" },
        { k: "Mode", v: "Awaiting content" },
        { k: "Cadence", v: "Awaiting content" },
      ],
      source: `Slot — ${prefix} track two · no case written`,
    },
    {
      id: "governance",
      file: "GOVERNANCE.MD",
      meta: "— · —",
      icon: "doc",
      preview: "Preview — governance.md",
      vizLabel: "Register — parallel tracks",
      visual: {
        kind: "register",
        rows: [
          { k: "Agreement", v: "Awaiting content" },
          { k: "Access", v: "Awaiting content" },
          { k: "Review", v: "Awaiting content" },
          { k: "Ownership", v: "Awaiting content" },
        ],
      },
      readouts: [
        { value: "NN", label: "primary readout" },
        { value: "NN", label: "second readout" },
      ],
      context: [
        { k: "Legal", v: "Awaiting content" },
        { k: "IT", v: "Awaiting content" },
        { k: "Cadence", v: "Awaiting content" },
      ],
      source: `Slot — ${prefix} governance · no case written`,
    },
  ];
}

const PLACEHOLDER_BRIEF: readonly FlSegment[] = [
  "This slot holds the client brief: one paragraph naming the engagement, ",
  { em: "the shape of the work" },
  ", and what changed because of it. It runs about four lines at this measure, which is what the directory below is spaced against. No case is written yet.",
];

const IN_THE_POCKET: FlClient = {
  slug: "in-the-pocket",
  ix: "02",
  tab: "IN THE POCKET",
  logCode: "TF-NN",
  state: "Slot",
  title: { pre: "In The Pocket", em: "." },
  classLine: "Engagement class · scope · period",
  brief: PLACEHOLDER_BRIEF,
  logEntry: "The operator's own line goes here, first person, one sentence.",
  tracks: placeholderTracks("in-the-pocket"),
  placeholder: true,
};

const POPPINS: FlClient = {
  slug: "poppins",
  ix: "03",
  tab: "POPPINS",
  logCode: "TF-NN",
  state: "Slot",
  title: { pre: "Poppins", em: "." },
  classLine: "Engagement class · scope · period",
  brief: PLACEHOLDER_BRIEF,
  logEntry: "The operator's own line goes here, first person, one sentence.",
  tracks: placeholderTracks("poppins"),
  placeholder: true,
};

/* ═══ Registry ═══════════════════════════════════════════════════════════ */

export const FIELD_LOG_CLIENTS: readonly FlClient[] = [LOOP_CLIENT, IN_THE_POCKET, POPPINS];

/** Station chrome that belongs to the format rather than to any one client.
 *  The handoff's `.chap` / `.pgn` corner anchors are NOT here: the live HUD
 *  already owns that corner (the ADR-055 nav readout) and has no pagination. */
export const FIELD_LOG_CHROME = {
  stationLabel: "FLG / Field log · 00",
  system: "TF // Field log — /expeditions/",
  archive: "+ Archive",
  telemetry: "00 · Field log",
  prompt: "Open full casefile",
  /** Where the prompt points. The subpage does not exist yet — see the
   *  plan's open questions. */
  promptHref: "/cases/loop-earplugs",
} as const;

/** Tool rows for the `tools` visual, resolved against the canonical module.
 *  Unknown ids drop out; the guard test pins that none do. */
export function resolveTools(toolIds: readonly string[]) {
  return toolIds
    .map((id) => PROJECT_CASES.find((c) => c.id === id))
    .filter((c): c is (typeof PROJECT_CASES)[number] => Boolean(c));
}

export function getClient(slug: string): FlClient | undefined {
  return FIELD_LOG_CLIENTS.find((c) => c.slug === slug);
}
