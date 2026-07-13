/**
 * revealData — content for the Arc's per-stage reveal consoles (ADR-032).
 *
 * Navigate = a native "signal" card (a LinkedIn-post-shaped artifact in the
 * site's HUD grammar; copy is swappable here so a real post is a data-only
 * change). Encode = a curated handful of skill examples.
 *
 * CONFIDENTIALITY: the Encode entries are GENERICIZED skill SHAPES — no
 * client names, no owner names, no team/engagement attribution. They read
 * as "the kind of judgment we encode", not "here is client X's private
 * skill". Keep it that way (owner, 2026-07-13). The Build reveal reuses the
 * public `PROJECT_CASES` tool data directly (Thoughtform's own tools) and
 * needs nothing here.
 */

/** The four Encode cardinals the skills map onto (JUDGMENT / TASTE / CRAFT
 *  / VOICE — the `SHELL_PRIMITIVES` in the corridor). */
export type SkillCardinal = "judgment" | "taste" | "craft" | "voice";

export interface RevealSkill {
  id: string;
  /** Skill name — kebab/plain, ~2-5 words. */
  title: string;
  /** One line: what the skill does. No client/owner specifics. */
  body: string;
  /** Mono-caps pill, e.g. "IN USE" / "IN BUILD". */
  statusLabel: string;
  /** Which cardinal this skill sits under. */
  cardinal: SkillCardinal;
}

/** Short tag rendered on each row, tying it to the visible cardinal. */
export const CARDINAL_TAG: Record<SkillCardinal, string> = {
  judgment: "JDG",
  taste: "TST",
  craft: "CRF",
  voice: "VOC",
};

/**
 * Curated, genericized skill examples (owner to refine copy). Ordered so
 * all four cardinals appear early; the reveal shows them as a flat list
 * with a cardinal tag per row rather than four grouped headers.
 */
export const REVEAL_SKILLS: RevealSkill[] = [
  {
    id: "risk-precheck",
    title: "Contract Pre-Check",
    body: "Clause-by-clause review encoded — routine deviations caught, novel cases routed to a human.",
    statusLabel: "IN USE",
    cardinal: "judgment",
  },
  {
    id: "risk-methodology",
    title: "Risk Methodology",
    body: "A team's risk framework as substrate — the engine every downstream pre-check calls into.",
    statusLabel: "IN BUILD",
    cardinal: "judgment",
  },
  {
    id: "employer-voice",
    title: "Employer Tone of Voice",
    body: "House voice encoded for posts, outreach, and candidate comms so every surface sounds like one team.",
    statusLabel: "IN BUILD",
    cardinal: "voice",
  },
  {
    id: "feedback-summarizer",
    title: "Feedback Summarizer",
    body: "Turns a sprawling feedback thread into a structured, actionable summary — no re-reading the channel.",
    statusLabel: "IN USE",
    cardinal: "craft",
  },
  {
    id: "brief-generator",
    title: "Brief Generator",
    body: "Drafts a complete brief from campaign inputs, so the work starts from a spec instead of a blank doc.",
    statusLabel: "IN BUILD",
    cardinal: "craft",
  },
  {
    id: "concept-triage",
    title: "Concept Triage",
    body: "Scores early concepts against the house standard, surfacing the few worth building out.",
    statusLabel: "IN USE",
    cardinal: "taste",
  },
  {
    id: "review-analysis",
    title: "Review Analysis",
    body: "Reads product reviews the way a senior would — patterns, not tallies — and flags what to act on.",
    statusLabel: "IN USE",
    cardinal: "taste",
  },
];

export interface SignalMetric {
  label: string;
  value: string;
}

export interface SignalPlaceholder {
  /** Small mono handle line over the post. */
  handle: string;
  role: string;
  timestamp: string;
  /** Post body — a few short lines. Swap for the real post. */
  lines: string[];
  metrics: SignalMetric[];
  /** Status chip, e.g. "ARTIFACT PENDING" while this is a placeholder. */
  statusLabel: string;
}

/**
 * Native signal-card placeholder (Navigate). A LinkedIn-post-shaped
 * artifact rendered in the HUD grammar. Copy is a stand-in until a real
 * post is dropped in — change these fields only.
 */
export const SIGNAL_PLACEHOLDER: SignalPlaceholder = {
  handle: "V. Buyssens",
  role: "Navigator · Thoughtform",
  timestamp: "SIGNAL · LIVE FEED",
  lines: [
    "Most teams treat AI like software to command.",
    "The teams pulling ahead treat it like intelligence to navigate — they brief it, steer it, and judge what comes back inside live work.",
    "That shift is the whole game.",
  ],
  metrics: [
    { label: "reactions", value: "000" },
    { label: "comments", value: "00" },
    { label: "reposts", value: "00" },
  ],
  statusLabel: "ARTIFACT PENDING",
};
