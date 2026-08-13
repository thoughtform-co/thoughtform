import type { CaseMapShapeKey } from "@/lib/cases/types";

/**
 * THE 47 ENCODED SKILLS — the lab's own fixture of Loop's actual roster.
 *
 * ⚠ **LAB-LOCAL DATA, ON PURPOSE.** The Loop case in production
 * (`lib/cases/content/loop-earplugs.ts`) only carries AGGREGATE counts per
 * pattern (`MAP_GROUPS`: judgment 12, voice 7, validation 9, stakeholder 5,
 * pattern 14 = 47). This file mirrors the specific Skill titles that live
 * in the Loop aether project's `/claude-adoption` page, so the substrate lab
 * can render each Skill by NAME — the whole point of the round-three
 * exploration. Once a lab winner promotes, this fixture converts into a
 * proper `MAP_SKILLS` field on the case content, guarded by the registry
 * test.
 *
 * ⚠ SUBSTRATE COUNTS AGREE WITH THE RECORD BY CONSTRUCTION: voice 7,
 * judgment 12, validation 9, stakeholder 5, pattern 14. Any Skill added
 * here must ALSO tick the Loop case's shape counts, or the two surfaces
 * publish different numbers about the same substrate.
 *
 * ⚠ FOUR SKILLS ARE DELIBERATELY EXCLUDED (untagged in Loop aether too):
 *   - Internal Loopers Personas  — a persona set, not an inputs-to-output
 *     engine
 *   - Retail Marketing Calendar  — a content asset Mímir consumes, not a
 *     Skill
 *   - Sketch to Digital Twin     — modality conversion; does not fit one
 *     of the five substrates
 *   - IT Access Runbook          — SOP-adjacent, no sibling yet
 * These are 51 − 47 = 4, matching what the aether project decided too.
 */

export type SubstrateSkillPattern = Extract<
  CaseMapShapeKey,
  "voice" | "judgment" | "validation" | "stakeholder" | "pattern"
>;

export interface SampleSkill {
  id: string;
  title: string;
  /**
   * ⚠ THE HAND-CRAFTED CARD LABEL — Loop's ordinary shorthand for the
   * Skill, capped at 14 characters so it fits a single line at fs 12 in
   * the module-card window (14 × 12 × 0.68 = 114u, inside the label's
   * 120u measure). This is what people already say in Slack, on Monday
   * boards, and in workshops — "NDA Pre-Check", "Fraud", "VSME
   * Reporting". The full `title` stays as the record's canonical form
   * for surfaces with room to letter it.
   *
   * Populated for every Skill so the drawing has one field to walk and
   * the fit guard has one field to measure. Never optional.
   */
  shortTitle: string;
  /** Team's 3-character code (Loop teams, NOT Thoughtform districts). */
  team: string;
  /** Full team name for hover / read-out contexts. */
  teamName: string;
  owner: string;
  substrate: SubstrateSkillPattern;
  /**
   * ⚠ THE PATTERN'S FLAGSHIP ENCODE — the Skill that was cut FIRST for its
   * pattern. Exactly one per substrate: five in total. The pin-grid's own
   * `CUT BY` grammar, ported down to the Skill level so a green line here
   * points at the same fact the shipped reading points at with a district.
   */
  cut?: true;
}

export interface SampleTeam {
  code: string;
  name: string;
}

/**
 * THE 14 LOOP TEAMS, in the order the /claude-adoption page prints them.
 *
 * ⚠ THESE ARE LOOP TEAMS, NOT THOUGHTFORM DISTRICTS. The shipped pin grid
 * uses 8 districts (CRE · ECM · LEG · FIN · DES · ENG · PRG · OPS) which
 * are role clusters, not org-chart teams. Loop's actual team-count is 14
 * and the lab honours that — collapsing to the district set is a
 * promotion-time concern, not a lab one.
 */
export const SAMPLE_TEAMS: readonly SampleTeam[] = [
  { code: "LEG", name: "Legal" },
  { code: "TAL", name: "Talent Acquisition" },
  { code: "FIN", name: "Finance & Accounting" },
  { code: "PMG", name: "Product Management" },
  { code: "PRG", name: "Program Management & Product" },
  { code: "PEN", name: "Product Engineering" },
  { code: "WHS", name: "Warehousing & Customer Ops" },
  { code: "POP", name: "People Ops" },
  { code: "BND", name: "Brand & Partnerships" },
  { code: "INS", name: "Strategic Insights" },
  { code: "MFG", name: "Manufacturing Programs" },
  { code: "PDX", name: "Product Design & UX" },
  { code: "PFM", name: "Performance" },
  { code: "STU", name: "Studio" },
];

export const SAMPLE_SKILLS: readonly SampleSkill[] = [
  /* ── VOICE (7) ─────────────────────────────────────────────────────
     How the organisation sounds in context. The flagship was Founder
     Tone of Voice (BND) — Sayrade's build, encoded early to unblock
     Tomorrowland prep. Other voice Skills followed on that pattern. */
  {
    id: "employer-branding-tov",
    title: "Employer Branding TOV",
    shortTitle: "Employer TOV",
    team: "TAL",
    teamName: "Talent Acquisition",
    owner: "TA team",
    substrate: "voice",
  },
  {
    id: "people-team-voice",
    title: "People-team Voice",
    shortTitle: "People-team",
    team: "POP",
    teamName: "People Ops",
    owner: "Thais",
    substrate: "voice",
  },
  {
    id: "founder-tone-of-voice",
    title: "Founder Tone of Voice",
    shortTitle: "Founder TOV",
    team: "BND",
    teamName: "Brand & Partnerships",
    owner: "Sayrade",
    substrate: "voice",
    cut: true,
  },
  {
    id: "paid-social-tov",
    title: "Paid Social TOV",
    shortTitle: "Paid Soc TOV",
    team: "BND",
    teamName: "Brand & Partnerships",
    owner: "Brand",
    substrate: "voice",
  },
  {
    id: "loop-paid-social",
    title: "Loop Paid Social",
    shortTitle: "Paid Social",
    team: "STU",
    teamName: "Studio",
    owner: "Chloe",
    substrate: "voice",
  },
  {
    id: "loop-crm",
    title: "Loop CRM",
    shortTitle: "Loop CRM",
    team: "STU",
    teamName: "Studio",
    owner: "CRM",
    substrate: "voice",
  },
  {
    id: "loop-marketplace",
    title: "Loop Marketplace",
    shortTitle: "Marketplace",
    team: "STU",
    teamName: "Studio",
    owner: "Marketplace",
    substrate: "voice",
  },

  /* ── JUDGMENT (12) ─────────────────────────────────────────────────
     What good means under ambiguity. NDA Pre-Check (LEG) was the
     flagship — Olga + Vince's build that unlocked four more Legal
     pre-checks and set the shape for judgment Skills across the estate. */
  {
    id: "nda-pre-check",
    title: "NDA Pre-Check",
    shortTitle: "NDA Pre-Check",
    team: "LEG",
    teamName: "Legal",
    owner: "Olga + Vince",
    substrate: "judgment",
    cut: true,
  },
  {
    id: "legal-risk-methodology",
    title: "Legal Risk Methodology",
    shortTitle: "Legal Risk",
    team: "LEG",
    teamName: "Legal",
    owner: "Vince → team",
    substrate: "judgment",
  },
  {
    id: "spa-pre-check",
    title: "SPA Pre-Check",
    shortTitle: "SPA Pre-Check",
    team: "LEG",
    teamName: "Legal",
    owner: "Legal",
    substrate: "judgment",
  },
  {
    id: "product-ideation",
    title: "Product Ideation",
    shortTitle: "Ideation",
    team: "PMG",
    teamName: "Product Management",
    owner: "Carlota + Vince",
    substrate: "judgment",
  },
  {
    id: "risk-management",
    title: "Risk Management",
    shortTitle: "Risk Mgmt",
    team: "PRG",
    teamName: "Program Management & Product",
    owner: "Sander",
    substrate: "judgment",
  },
  {
    id: "brr-generator",
    title: "BRR Generator",
    shortTitle: "BRR Generator",
    team: "PEN",
    teamName: "Product Engineering",
    owner: "PE team",
    substrate: "judgment",
  },
  {
    id: "onboarding-pops-processes",
    title: "Onboarding & POps Processes",
    shortTitle: "Onboarding",
    team: "POP",
    teamName: "People Ops",
    owner: "Bernice",
    substrate: "judgment",
  },
  {
    id: "partnership-inbox-filter",
    title: "Partnership Inbox Filter",
    shortTitle: "Partner Inbox",
    team: "BND",
    teamName: "Brand & Partnerships",
    owner: "Nathalie + Stan + Vince",
    substrate: "judgment",
  },
  {
    id: "cost-feasibility-portfolio",
    title: "Cost / Feasibility / Portfolio",
    shortTitle: "Cost / Feas",
    team: "MFG",
    teamName: "Manufacturing Programs",
    owner: "Elodie + Alice",
    substrate: "judgment",
  },
  {
    id: "ux-foundations-evaluation",
    title: "UX Foundations Evaluation",
    shortTitle: "UX Founds",
    team: "PDX",
    teamName: "Product Design & UX",
    owner: "Aurélie",
    substrate: "judgment",
  },
  {
    id: "concept-triage-engine",
    title: "Concept Triage Engine",
    shortTitle: "Concept Triage",
    team: "PDX",
    teamName: "Product Design & UX",
    owner: "Elodie",
    substrate: "judgment",
  },
  {
    id: "loop-creative-strategy",
    title: "Loop Creative Strategy",
    shortTitle: "Creative Strat",
    team: "PFM",
    teamName: "Performance",
    owner: "Chloe",
    substrate: "judgment",
  },

  /* ── VALIDATION (9) ────────────────────────────────────────────────
     Checks output against a Loop bar. Quality Auditor (WHS) was the
     flagship — Toby + Maud's build scoring support tickets against the
     Maud scorecard; the shape spread to fraud, invoices, VAT, and QA. */
  {
    id: "tracker-compliance-checker",
    title: "Tracker Compliance Checker",
    shortTitle: "Tracker Check",
    team: "LEG",
    teamName: "Legal",
    owner: "Herman",
    substrate: "validation",
  },
  {
    id: "interview-debrief",
    title: "Interview Debrief",
    shortTitle: "Debrief",
    team: "TAL",
    teamName: "Talent Acquisition",
    owner: "Jenn",
    substrate: "validation",
  },
  {
    id: "gl-reconciliations",
    title: "GL Reconciliations",
    shortTitle: "GL Recon",
    team: "FIN",
    teamName: "Finance & Accounting",
    owner: "Finance",
    substrate: "validation",
  },
  {
    id: "belgian-vat-return",
    title: "Belgian VAT Return",
    shortTitle: "VAT Return",
    team: "FIN",
    teamName: "Finance & Accounting",
    owner: "Thijs",
    substrate: "validation",
  },
  {
    id: "quality-auditor",
    title: "Quality Auditor",
    shortTitle: "Quality",
    team: "WHS",
    teamName: "Warehousing & Customer Ops",
    owner: "Toby + Maud",
    substrate: "validation",
    cut: true,
  },
  {
    id: "fraud-detection",
    title: "Fraud Detection",
    shortTitle: "Fraud",
    team: "WHS",
    teamName: "Warehousing & Customer Ops",
    owner: "Toby + Maud",
    substrate: "validation",
  },
  {
    id: "invoice-processor",
    title: "Invoice Processor",
    shortTitle: "Invoices",
    team: "WHS",
    teamName: "Warehousing & Customer Ops",
    owner: "Davy + Vince",
    substrate: "validation",
  },
  {
    id: "supplier-qa-audit",
    title: "Supplier QA Audit",
    shortTitle: "Supplier QA",
    team: "MFG",
    teamName: "Manufacturing Programs",
    owner: "Manufacturing",
    substrate: "validation",
  },
  {
    id: "localization",
    title: "Localization",
    shortTitle: "Localization",
    team: "STU",
    teamName: "Studio",
    owner: "Studio",
    substrate: "validation",
  },

  /* ── STAKEHOLDER (5) ───────────────────────────────────────────────
     Frames information for a specific reader. Program Status Updates
     (PRG) was the flagship — Robert's build that reads transcripts +
     risk boards + roadmap into a cross-team status digest. */
  {
    id: "candidate-screening-brief",
    title: "Candidate Screening Brief",
    shortTitle: "Screening",
    team: "TAL",
    teamName: "Talent Acquisition",
    owner: "Maxim",
    substrate: "stakeholder",
  },
  {
    id: "program-status-updates",
    title: "Program Status Updates",
    shortTitle: "PRG Status",
    team: "PRG",
    teamName: "Program Management & Product",
    owner: "Robert",
    substrate: "stakeholder",
    cut: true,
  },
  {
    id: "market-scan-brief",
    title: "Market Scan Brief",
    shortTitle: "Market Scan",
    team: "INS",
    teamName: "Strategic Insights",
    owner: "Kuhn",
    substrate: "stakeholder",
  },
  {
    id: "survey-synthesis",
    title: "Survey Synthesis",
    shortTitle: "Survey",
    team: "INS",
    teamName: "Strategic Insights",
    owner: "Insights",
    substrate: "stakeholder",
  },
  {
    id: "feedback-summarizer",
    title: "Feedback Summarizer",
    shortTitle: "Feedback",
    team: "STU",
    teamName: "Studio",
    owner: "Rhodes",
    substrate: "stakeholder",
  },

  /* ── PATTERN (14) ──────────────────────────────────────────────────
     Composes structured outputs from recurring inputs. Variance
     Commentary (FIN) was the flagship — Helen's build turning month-end
     templates into templated narrative, sounding like Helen; the shape
     travelled to MEC, briefs, calendars, and calculators. */
  {
    id: "variance-commentary",
    title: "Variance Commentary",
    shortTitle: "Variance",
    team: "FIN",
    teamName: "Finance & Accounting",
    owner: "Helen",
    substrate: "pattern",
    cut: true,
  },
  {
    id: "mec-tracker",
    title: "MEC Tracker",
    shortTitle: "MEC Tracker",
    team: "FIN",
    teamName: "Finance & Accounting",
    owner: "Jenny",
    substrate: "pattern",
  },
  {
    id: "vsme-sustainability-reporting",
    title: "VSME Sustainability Reporting",
    shortTitle: "VSME Reporting",
    team: "PRG",
    teamName: "Program Management & Product",
    owner: "Vince → team",
    substrate: "pattern",
  },
  {
    id: "daily-brief",
    title: "Daily Brief",
    shortTitle: "Daily Brief",
    team: "PEN",
    teamName: "Product Engineering",
    owner: "Jennifer",
    substrate: "pattern",
  },
  {
    id: "dashboard-consolidation",
    title: "Dashboard Consolidation",
    shortTitle: "Dashboards",
    team: "WHS",
    teamName: "Warehousing & Customer Ops",
    owner: "Rob + Samuel",
    substrate: "pattern",
  },
  {
    id: "sop-generator",
    title: "SOP Generator",
    shortTitle: "SOP Generator",
    team: "POP",
    teamName: "People Ops",
    owner: "Gabriel",
    substrate: "pattern",
  },
  {
    id: "marketing-360-agent",
    title: "360 Marketing Agent",
    shortTitle: "360 Marketing",
    team: "BND",
    teamName: "Brand & Partnerships",
    owner: "Yalis",
    substrate: "pattern",
  },
  {
    id: "trend-scraper",
    title: "Trend Scraper",
    shortTitle: "Trends",
    team: "INS",
    teamName: "Strategic Insights",
    owner: "Insights · Cowork",
    substrate: "pattern",
  },
  {
    id: "lead-time-calculator",
    title: "Lead Time Calculator",
    shortTitle: "Lead Time",
    team: "MFG",
    teamName: "Manufacturing Programs",
    owner: "Alice",
    substrate: "pattern",
  },
  {
    id: "cmf-file-generator",
    title: "CMF File Generator",
    shortTitle: "CMF Files",
    team: "PDX",
    teamName: "Product Design & UX",
    owner: "Damien",
    substrate: "pattern",
  },
  {
    id: "loop-packaging-system",
    title: "Loop Packaging System",
    shortTitle: "Packaging",
    team: "PDX",
    teamName: "Product Design & UX",
    owner: "Ana",
    substrate: "pattern",
  },
  {
    id: "product-review-analysis",
    title: "Product Review Analysis",
    shortTitle: "Reviews",
    team: "PDX",
    teamName: "Product Design & UX",
    owner: "Mattis",
    substrate: "pattern",
  },
  {
    id: "asset-brief-generator",
    title: "Asset Brief Generator",
    shortTitle: "Asset Briefs",
    team: "STU",
    teamName: "Studio",
    owner: "Rhodes",
    substrate: "pattern",
  },
  {
    id: "genai-prompting",
    title: "GenAI Prompting",
    shortTitle: "GenAI",
    team: "STU",
    teamName: "Studio",
    owner: "Studio",
    substrate: "pattern",
  },
];

/** Skills for a given substrate, in the fixture's own order. */
export const skillsIn = (substrate: SubstrateSkillPattern): readonly SampleSkill[] =>
  SAMPLE_SKILLS.filter((s) => s.substrate === substrate);

/** The five pattern keys in the shipped record's order. */
export const SAMPLE_PATTERNS: readonly SubstrateSkillPattern[] = [
  "voice",
  "judgment",
  "validation",
  "stakeholder",
  "pattern",
];

/**
 * Sanity assertion the guard can walk. Any drift between the fixture and
 * the shipped record is a failure — this reading claims to draw the same
 * 47 the pin grid counts, so the two lists cannot diverge silently.
 */
export const SAMPLE_TOTALS = {
  voice: 7,
  judgment: 12,
  validation: 9,
  stakeholder: 5,
  pattern: 14,
  total: 47,
} as const;
