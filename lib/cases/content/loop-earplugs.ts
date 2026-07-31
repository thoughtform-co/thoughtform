import type { CaseDef, CaseSignalPoint } from "../types";

/**
 * Loop Earplugs — the flagship case (ADR-054), rendered as the casefile at
 * the top of `#services` (ADR-056).
 *
 * SHAPE. `report` + `beats` are the evidence; `casefile` is that evidence
 * recomposed as one interactive viewport. The two share their plates through
 * the hoisted consts below rather than restating them — a rollout-log row
 * edited here changes both surfaces, which is the only way they can be
 * guaranteed not to drift.
 *
 * NUMBERS. Every figure below is sourced; `stat.source` carries the
 * provenance. Where the harvest offered competing denominators the
 * SMALLER, exec-facing one is printed and the other is never shown:
 *   · 22 workshops = the board count of team sessions run. (14 is the
 *     count of teams with published skill cards — a different set.)
 *   · 42 Skills = the exec headline count of skills in motion. (51 is
 *     the registry's card count including scoped placeholders; printing
 *     both invites arithmetic that reconciles to neither.)
 *   · 4 tools = PROJECT_CASES / CASE_TOTAL.
 * "95% of briefings ship with AI" is deliberately ABSENT: it is already
 * published on the ai-keynote arc page (`lib/arcs/content/ai-keynote.ts`),
 * and a second variant of the same claim on a second surface drifts. The
 * Build beat's "days to minutes" line carries that story without a
 * percentage. The `Thoughtform Prime` design handoff printed 15+ teams /
 * 20+ Skills / 90% of paid social — those predate this doctrine and are
 * pinned OUT by `tests/lib/cases-registry.test.ts`.
 *
 * CONFIDENTIALITY. No spend, commit, contract value, or per-seat figure
 * appears here or may be added — see `.claude/rules/proof.md`. Loop staff
 * are first-name only. Tool codenames are in scope for a case study
 * (published precedent: PROJECT_CASES); they stay OUT of general service
 * copy (`services/serviceDesignations.ts`).
 */

/* ── Evidence, hoisted so both surfaces read the same rows ───────────── */

const ROLLOUT_ROWS = [
  { t: "2024", event: "Embedded. First workflows mapped" },
  { t: "Pilot", event: "69 seats, one team at a time" },
  { t: "Q2 2026", event: "Enterprise agreement signed" },
  { t: "Parallel", event: "SSO · connector review · governance" },
  { t: "Q2 2026", event: "22 teams briefed, 45 minutes each" },
  { t: "Now", event: "130+ people, on organic pull" },
] as const;
const ROLLOUT_TAIL = "One workflow worth encoding, per team.";

const SKILL_GROUPS = [
  { name: "Judgment", gloss: "Applies senior judgment to varied inputs." },
  { name: "Voice", gloss: "Writes in a specific Loop voice." },
  { name: "Validation", gloss: "Checks output against a Loop bar." },
  { name: "Stakeholder", gloss: "Frames information for a specific reader." },
  { name: "Pattern", gloss: "Composes structured outputs from recurring inputs." },
] as const;
const SKILL_ROWS = [
  { team: "Legal", name: "NDA pre-check", tag: "Judgment" },
  { team: "Finance", name: "Variance commentary", tag: "Pattern" },
  { team: "Studio", name: "Paid social copy", tag: "Voice" },
  { team: "Performance", name: "Creative strategy", tag: "Judgment" },
  { team: "Design", name: "CMF file generator", tag: "Pattern" },
  { team: "Warehousing", name: "Quality auditor", tag: "Validation" },
] as const;
const SKILL_FOOTER =
  "Grounded in the team's own work — the paid-social Skill alone reads 295 real Loop ads.";

const TOOL_IDS = ["mimir", "vesper", "babylon", "heimdall"] as const;

/**
 * Three paid-social cuts, reused verbatim from the ai-keynote arc page
 * (`lib/arcs/content/ai-keynote.ts`) — same files, same alt text, so the two
 * surfaces cannot end up describing the same ad differently.
 *
 * What deliberately does NOT come across: the arc carries per-ad spend,
 * order value and ROAS. That page is a client deck; this is the public
 * landing, where the confidentiality envelope bans currency outright
 * (`.claude/rules/proof.md`, pinned by the registry test). The panel says
 * "beat the ROAS benchmarks" and prints no figure.
 */
const STUDIO_SHOTS = [
  {
    src: "/arcs/studio-ads/exp-sb93-filter.jpg",
    alt: "Loop Switch ad: It's parenting, but just the good bits — earplug case with hear/filter checklist.",
    width: 1080,
    height: 1350,
  },
  {
    src: "/arcs/studio-ads/exp-lm103-highlight.jpg",
    alt: "Loop fashion ad: monochrome portrait of a man with a Loop earplug highlighted by a square reticle.",
    width: 1080,
    height: 1350,
  },
  {
    src: "/arcs/studio-ads/exp-sb92-ski.jpg",
    alt: "Loop Engage ad: stress-free ski trips — skier in helmet and goggles, three callout chips around the ear.",
    width: 1080,
    height: 1350,
  },
] as const;

/** Both above-the-line films, self-hosted. CSP is `media-src 'self' blob:`
 *  (`lib/security/headers.mjs`), so these can never be served from a bucket
 *  — a remote src would be blocked the moment CSP leaves report-only. */
const ATL_FILMS = [
  {
    src: "/videos/loop-smug-owl-ai-atl.mp4",
    poster: "/arcs/posters/smug-owl.jpg",
    label: "Smug Owl · Loop ATL",
    meta: "16:9 master · 30 sec",
  },
  {
    src: "/videos/loop-dj-neighbour-ai-atl.mp4",
    poster: "/arcs/posters/dj-neighbour.jpg",
    label: "DJ Neighbour · Loop ATL",
    meta: "16:9 master · 30 sec",
  },
] as const;

/**
 * The rollout log re-read as an adoption curve. Milestones are the log's own
 * rows; the y-axis is the seat count the `5 → 130+` stat already publishes.
 * The handoff's invented quarters ("25.Q2 skill layer live", "25.Q4 4 tools
 * shipped") are not in this module and are not used.
 */
const ADOPTION_SIGNAL: readonly CaseSignalPoint[] = [
  { x: 0.04, y: 0.06, stamp: "2024", label: "Embedded" },
  { x: 0.3, y: 0.24, stamp: "Pilot", label: "69 seats" },
  { x: 0.66, y: 0.62, stamp: "26.Q2", label: "22 teams briefed" },
  { x: 0.95, y: 0.94, stamp: "Now", label: "130+ on the layer" },
];

export const LOOP_EARPLUGS_CASE: CaseDef = {
  slug: "loop-earplugs",
  client: "Loop Earplugs",

  report: {
    title: { pre: "Mission report:", em: "Loop Earplugs." },
    lede: "Eighteen months embedded in one company. Every team briefed on the same forty-five minute frame, the judgment that came out of those rooms encoded as Skills the teams own, and production tools built where off-the-shelf software never fit. The same Arc we teach, run at company scale.",
    stats: [
      {
        value: "22",
        label: "workshops run",
        detail: "one per team",
        source: "adoption board, team-session count",
      },
      {
        value: "42",
        label: "Skills encoded",
        detail: "versioned, team-owned",
        source: "exec headline count; the registry holds 51 cards incl. scoped",
      },
      {
        value: "4",
        label: "production tools",
        detail: "built in-house",
        source: "PROJECT_CASES / CASE_TOTAL",
      },
      {
        value: "5 → 130+",
        label: "people on the layer",
        detail: "in 18 months",
        source: "adoption curve; a 69-seat pilot went company-wide on organic demand",
      },
    ],
    meta: [
      { label: "Client", value: "Loop Earplugs" },
      { label: "Role", value: "Embedded AI lead" },
      { label: "Period", value: "2024 · ongoing" },
      { label: "Status", value: "Live" },
    ],
  },

  beats: [
    {
      id: "proof-navigate",
      phase: "navigate",
      title: { pre: "Every team,", em: "one frame." },
      body: [
        "Every team gets the same forty-five minute kickoff and the same starting question: where does the work actually happen. Nobody leaves with a tool demo. They leave with one workflow of their own worth encoding.",
        "It spread because people asked for it, not because a mandate said so — a pilot of sixty-nine went company-wide on inbound demand alone. Underneath, three tracks ran in parallel so the pull had somewhere to land: the enterprise agreement, single sign-on, and the legal review of every connector. Each team keeps its own steward.",
      ],
      receipts: [
        "Zero to a functioning AI practice in 21 days",
        "Agreement, SSO and legal review — three tracks, in parallel",
      ],
      visual: {
        kind: "log",
        title: "Rollout log",
        rows: ROLLOUT_ROWS,
        tail: ROLLOUT_TAIL,
      },
    },
    {
      id: "proof-encode",
      phase: "encode",
      title: { pre: "Judgment,", em: "encoded." },
      body: [
        "What surfaces in a workshop does not stay in the transcript. It becomes a Skill — versioned, reviewed, and owned by the team in one governed repository rather than by the person who wrote it. Forty-two are in motion across the company.",
        "Every one of them is a variation on five recurring shapes of work. That is the part worth owning: the shapes outlive the model version, the team roster, and whatever surface launches next.",
      ],
      closer: [
        "When the model changes, the ",
        { em: "substrate stays" },
        ". When a team rotates, the ",
        { em: "judgment stays" },
        ". When a new surface launches, it inherits the layer that was already there.",
      ],
      visual: {
        kind: "registry",
        title: "Skills registry · 42 in motion",
        groups: SKILL_GROUPS,
        rows: SKILL_ROWS,
        footer: SKILL_FOOTER,
      },
    },
    {
      id: "proof-build",
      phase: "build",
      title: { pre: "Software for", em: "few." },
      body: [
        "Off-the-shelf software is built for millions, so it is too broad. An agency build is too expensive for a team of ten and too far from the work. The third option is a tool built with the team that owns the workflow, standing on the Skills they already authored.",
        "Four of them run in production daily. The localization managers now product-manage the dubbing tool end to end across thirty-plus markets — it was handed over, not just delivered — and the same pipeline is moving into above-the-line work.",
      ],
      receipts: [
        "A world-first AI above-the-line film, shipped through the same layer",
        "Briefing synthesis: days to minutes",
      ],
      visual: { kind: "tool-strip", toolIds: TOOL_IDS },
    },
  ],

  casefile: {
    ix: "01",
    tab: "Loop Earplugs",
    logCode: "TF-24",
    state: "On record",
    classLine: "AI adoption · marketing → company-wide · 2024 — active",
    // `report.lede` verbatim, with one clause marked for the gold wash.
    // Re-typed as segments rather than sliced out of the string so the
    // emphasis is data, not a fragile substring match.
    brief: [
      "Eighteen months inside one company. ",
      { em: "Every team briefed on the same forty-five minute frame" },
      ", the judgment encoded as Skills they own, and tools built where software never fit.",
    ],
    /* ORDER IS THE DIRECTORY, and the first row is what the casefile OPENS
       ON. The work leads (owner, 2026-07-30): the studio is the strongest
       single piece of evidence, so it is row one and the default panel. The
       mission report closes the file instead of opening it — it summarises
       what the rows above already showed, which is the right place for a
       summary. Its `00_` keeps it reading as the master log rather than a
       sixth project. */
    tracks: [
      {
        id: "studio",
        file: "01_STUDIO/",
        meta: "500 ADS/MO",
        project: "AI Adoption Studio",
        icon: "dir",
        preview: "Preview — 01_studio/",
        vizLabel: "Viz — performance evidence",
        visual: { kind: "stills", shots: STUDIO_SHOTS },
        readouts: [
          { value: "500", label: "ads a month with AI in the chain" },
          { value: "2-3×", label: "faster than the agencies replaced" },
        ],
        context: [
          { k: "Phase", v: "Build" },
          { k: "Surface", v: "Production platform" },
          { k: "Owner", v: "The studio" },
        ],
        source: "Source — studio production line · rev 2026.07",
        stamp: { ord: "01", phase: "Build", ref: "BLD-01" },
      },
      {
        id: "atl-films",
        file: "02_ATL-FILMS/",
        meta: "2 FILMS",
        project: "AI Above-the-Line",
        icon: "dir",
        preview: "Preview — 02_atl-films/",
        vizLabel: "Viz — the films",
        visual: { kind: "films", films: ATL_FILMS },
        readouts: [
          { value: "2", label: "films fully AI-produced" },
          { value: "1", label: "crew shared with live action" },
        ],
        context: [
          { k: "Phase", v: "Build" },
          { k: "Format", v: "Above-the-line" },
          { k: "Owner", v: "The creative team" },
        ],
        source: "Source — creative archive · rev 2026.07",
        stamp: { ord: "02", phase: "Build", ref: "BLD-02" },
      },
      {
        id: "tooling",
        file: "03_TOOLING/",
        meta: "4 TOOLS",
        project: "Software for few",
        icon: "dir",
        preview: "Preview — 03_tooling/",
        vizLabel: "Fleet — in production",
        visual: { kind: "tools", toolIds: TOOL_IDS },
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
        stamp: { ord: "03", phase: "Build", ref: "BLD-03" },
      },
      {
        id: "transformation",
        file: "04_AI-TRANSFORMATION/",
        meta: "22 WORKSHOPS",
        project: "The Workshop Rollout",
        icon: "dir",
        preview: "Preview — 04_ai-transformation/",
        vizLabel: "Log — rollout",
        visual: { kind: "log", rows: ROLLOUT_ROWS, tail: ROLLOUT_TAIL },
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
        stamp: { ord: "04", phase: "Navigate", ref: "NAV-01" },
      },
      {
        id: "skill-layer",
        file: "05_SKILL-LAYER/",
        meta: "42 SKILLS",
        project: "The Skill Layer",
        icon: "dir",
        preview: "Preview — 05_skill-layer/",
        vizLabel: "Registry — 42 in motion",
        visual: {
          kind: "registry",
          groups: SKILL_GROUPS,
          rows: SKILL_ROWS,
          footer: SKILL_FOOTER,
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
        stamp: { ord: "05", phase: "Encode", ref: "ENC-01" },
      },
      {
        id: "governance",
        file: "GOVERNANCE.MD",
        meta: "LEGAL · IT",
        project: "Governance",
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
        stamp: { ord: "—", phase: "Governance", ref: "GOV-01" },
      },
      {
        id: "metrics",
        file: "METRICS.DAT",
        meta: "4 READOUTS",
        project: "Metrics",
        icon: "doc",
        preview: "Preview — metrics.dat",
        vizLabel: "Readouts — sampled quarterly",
        visual: { kind: "readouts" },
        readouts: [
          { value: "22", label: "workshops run · one per team" },
          { value: "42", label: "Skills encoded · versioned, team-owned" },
          { value: "4", label: "production tools · built in-house" },
          { value: "5 → 130+", label: "people on the layer · in 18 months" },
        ],
        context: [
          { k: "Client", v: "Loop Earplugs" },
          { k: "Period", v: "2024 · ongoing" },
          { k: "Status", v: "Live" },
        ],
        source: "Source — metrics.dat · sampled quarterly · rev 2026.07",
        stamp: { ord: "—", phase: "Metrics", ref: "MET-01" },
      },
      {
        id: "report",
        file: "00_MISSION-REPORT.LOG",
        meta: "2.4 KB",
        project: "The engagement",
        icon: "doc",
        preview: "Preview — 00_mission-report.log",
        vizLabel: "Viz — adoption signal",
        visual: {
          kind: "signal",
          points: ADOPTION_SIGNAL,
          t0: "T0 — embedded · 2024",
          now: "Active — 2026.07",
        },
        readouts: [
          { value: "22", label: "workshops run" },
          { value: "42", label: "Skills encoded" },
          { value: "4", label: "production tools" },
          { value: "5 → 130+", label: "people on the layer" },
        ],
        context: [
          { k: "Role", v: "Embedded AI lead" },
          { k: "Mandate", v: "Adoption · tooling" },
          { k: "Governance", v: "Legal · IT" },
        ],
        source: "Source — metrics.dat · sampled quarterly · rev 2026.07",
      },
    ],
  },

  meta: {
    title: "Loop Earplugs — Thoughtform case",
    description:
      "Eighteen months embedded at Loop Earplugs: 22 team workshops, 42 Skills encoded, and four production tools built on the layer they created.",
  },
};
