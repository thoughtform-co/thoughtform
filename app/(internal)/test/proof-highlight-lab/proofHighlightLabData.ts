import { PROOF_CASE } from "@/lib/cases/registry";

/**
 * Lab-local content for the four highlight directions.
 *
 * The real case is IMPORTED, never copied — `PROOF_CASE` supplies the title,
 * lede, meta and shipped stats, so nothing the lab shows can drift from what
 * the station renders. Only the mockup-only fields live here.
 *
 * Promote into `lib/cases/` (a `CaseHighlight` on `CaseDef`) when a direction
 * wins; `lib/cases/types.ts` keeps zero imports, so these shapes must stay
 * plain data when they move.
 *
 * ⚠ CONFIDENTIALITY. Lab screenshots travel — everything below is inside the
 * `.claude/rules/proof.md` envelope: no money, no board or repo links, first
 * names only. Where a figure is already published on another surface it is
 * printed at the SAME value (see `paid social` below).
 */

export interface LabMilestone {
  /** Mono stamp, e.g. "2024". */
  t: string;
  /** Short label riding the track. */
  label: string;
}

export interface LabStat {
  value: string;
  label: string;
  /** Mono qualifier under the label. */
  detail?: string;
}

export interface LabCallout {
  /** Arc phase tag — the NAV·ENC·BLD linkage the brief asks for. */
  tag: string;
  value: string;
  label: string;
}

export interface LabHighlightExtras {
  /** Header rail identity. */
  logmark: string;
  expedition: string;
  logCode: string;
  /** Subject line under the client name. */
  domain: string;
  /** Who filed the log. */
  operator: string;
  /** One-line pull quote. First name only in the attribution. */
  quote: { text: string; attribution: string };
  /** The condensed summary each direction prints. */
  summary: string;
  /** Mandate row — the one meta field the shipped case doesn't carry. */
  mandate: string;
  /** Capture-panel stamp + phase tag. */
  captureRef: string;
  captureTag: string;
  /** Footer contents rail — the beats the case continues into. */
  contents: string;
  /** The CTA every direction ends on (inert in the lab). */
  cta: string;
  /**
   * The IMPACT stat set (owner's mockup) — outcome-first, as opposed to the
   * shipped activity-first tiles on `PROOF_CASE.report.stats`.
   *
   * The paid-social figure is printed at 95%, matching what is already
   * published on the ai-keynote arc page. The mockup's 90% was a second
   * variant of one claim, which the house rule forbids.
   */
  impactStats: readonly LabStat[];
  /** Phase-tagged callouts for the schematic direction. */
  callouts: readonly LabCallout[];
  /** Track milestones for the orbit direction. */
  milestones: readonly LabMilestone[];
}

export const LAB_HIGHLIGHT_EXTRAS: LabHighlightExtras = {
  logmark: "TF — FIELD LOG",
  expedition: "EXPEDITION 01 · LOG TF-24",
  logCode: "LOG 001",
  domain: "AI ADOPTION · MARKETING → COMPANY-WIDE",
  operator: "OPERATOR — V. BUYSSENS",
  quote: {
    text: "I moved from the AI team into marketing to show AI would elevate them, not replace them.",
    attribution: "Vince",
  },
  summary:
    "Since 2024, an embedded term inside Loop's marketing: navigating teams into AI, encoding how they work into Skills, building the tools they now run daily.",
  mandate: "Adoption · Governance · Tooling",
  captureRef: "REF 112.4 / T+0019",
  captureTag: "NAV · ENC · BLD",
  contents: "CONTENTS — 01 NAVIGATED · 02 ENCODED · 03 BUILT",
  cta: "OPEN FULL CASEFILE",

  impactStats: [
    { value: "04", label: "AI tools", detail: "in production" },
    { value: "20+", label: "workflows", detail: "encoded as Skills" },
    { value: "10+", label: "teams", detail: "self-sufficient" },
    { value: "95%", label: "of paid social", detail: "made with AI" },
  ],

  callouts: [
    { tag: "NAV", value: "22", label: "workshops · one per team" },
    { tag: "NAV", value: "21 days", label: "zero to a working practice" },
    { tag: "ENC", value: "20+", label: "workflows encoded as Skills" },
    { tag: "ENC", value: "05", label: "substrate patterns" },
    { tag: "BLD", value: "04", label: "tools in production daily" },
    { tag: "BLD", value: "30+", label: "markets on the dubbing tool" },
  ],

  milestones: [
    { t: "2024", label: "EMBEDDED" },
    { t: "PILOT", label: "69 SEATS" },
    { t: "Q2 2026", label: "AGREEMENT" },
    { t: "Q2 2026", label: "22 TEAMS" },
    { t: "NOW", label: "130+ ON THE LAYER" },
  ],
};

/** The real case — re-exported so directions take one import. */
export const LAB_CASE = PROOF_CASE;
