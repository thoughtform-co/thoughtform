import type { CaseDef } from "../types";

/**
 * Loop Earplugs — the flagship case (ADR-054), rendered as the landing's
 * `#proof` station.
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
 * percentage.
 *
 * CONFIDENTIALITY. No spend, commit, contract value, or per-seat figure
 * appears here or may be added — see `.claude/rules/proof.md`. Loop staff
 * are first-name only. Tool codenames are in scope for a case study
 * (published precedent: PROJECT_CASES); they stay OUT of general service
 * copy (`services/serviceDesignations.ts`).
 */
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
        rows: [
          { t: "2024", event: "Embedded. First workflows mapped" },
          { t: "Pilot", event: "69 seats, one team at a time" },
          { t: "Q2 2026", event: "Enterprise agreement signed" },
          { t: "Parallel", event: "SSO · connector review · governance" },
          { t: "Q2 2026", event: "22 teams briefed, 45 minutes each" },
          { t: "Now", event: "130+ people, on organic pull" },
        ],
        tail: "One workflow worth encoding, per team.",
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
        groups: [
          { name: "Judgment", gloss: "Applies senior judgment to varied inputs." },
          { name: "Voice", gloss: "Writes in a specific Loop voice." },
          { name: "Validation", gloss: "Checks output against a Loop bar." },
          { name: "Stakeholder", gloss: "Frames information for a specific reader." },
          { name: "Pattern", gloss: "Composes structured outputs from recurring inputs." },
        ],
        rows: [
          { team: "Legal", name: "NDA pre-check", tag: "Judgment" },
          { team: "Finance", name: "Variance commentary", tag: "Pattern" },
          { team: "Studio", name: "Paid social copy", tag: "Voice" },
          { team: "Performance", name: "Creative strategy", tag: "Judgment" },
          { team: "Design", name: "CMF file generator", tag: "Pattern" },
          { team: "Warehousing", name: "Quality auditor", tag: "Validation" },
        ],
        footer:
          "Grounded in the team's own work — the paid-social Skill alone reads 295 real Loop ads.",
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
      visual: { kind: "tool-strip", toolIds: ["mimir", "vesper", "babylon", "heimdall"] },
    },
  ],

  meta: {
    title: "Loop Earplugs — Thoughtform case",
    description:
      "Eighteen months embedded at Loop Earplugs: 22 team workshops, 42 Skills encoded, and four production tools built on the layer they created.",
  },
};
