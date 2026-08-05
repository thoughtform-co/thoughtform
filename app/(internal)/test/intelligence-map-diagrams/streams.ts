/**
 * Work-stream fixture for the three-level diagram instrument.
 *
 * Derived 2026-08-05 from the Aether registry (loop_aether ·
 * content/claude-adoption-teams.ts): 14 teams · 51 cards · 47 tagged.
 * A skill is NOT a work stream — a stream is a recurring workflow, usually
 * served by a combination of skills. The derivation places every one of the
 * 47 TAGGED skills into exactly one stream; the 4 untagged cards stay out,
 * mirrored honestly in the header line ("47 SKILLS TAGGED").
 *
 * Cross-checks that must keep holding (the aether registry's own arithmetic):
 *   - streams reference 47 skills total
 *   - per-engine totals land on JUDGMENT 12 · VOICE 7 · VALIDATION 9 ·
 *     STAKEHOLDER 5 · PATTERN 14
 *
 * Confidentiality: this page is dev-only, but authored lab source stays
 * clean — owner ROLES only (the aether cards carry first names; the map's
 * envelope forbids person names), generic capability lanes (never a vendor
 * or model family), tools as public categories. Mímir / Vesper codenames are
 * published precedent (PROJECT_CASES).
 */

export type EngineKey = "judgment" | "voice" | "validation" | "stakeholder" | "pattern";

export interface Engine {
  key: EngineKey;
  label: string;
  /** The wheel one-liner from the aether registry — the self-explanatory label. */
  verb: string;
  skills: number;
  teams: number;
}

/** Canonical order + counts from the aether registry (CA_SUBSTRATE_ORDER). */
export const ENGINES: readonly Engine[] = [
  {
    key: "judgment",
    label: "JUDGMENT",
    verb: "APPLIES SENIOR JUDGMENT TO VARIED INPUTS",
    skills: 12,
    teams: 9,
  },
  { key: "voice", label: "VOICE", verb: "WRITES IN A SPECIFIC LOOP VOICE", skills: 7, teams: 4 },
  {
    key: "validation",
    label: "VALIDATION",
    verb: "CHECKS OUTPUT AGAINST A LOOP BAR",
    skills: 9,
    teams: 6,
  },
  {
    key: "stakeholder",
    label: "STAKEHOLDER",
    verb: "FRAMES INFORMATION FOR A SPECIFIC READER",
    skills: 5,
    teams: 4,
  },
  {
    key: "pattern",
    label: "PATTERN",
    verb: "COMPOSES STRUCTURED OUTPUTS FROM RECURRING INPUTS",
    skills: 14,
    teams: 10,
  },
];

export type Lane = "FAST" | "EVERYDAY" | "DEEP";

export interface StreamSkill {
  name: string;
  engine: EngineKey;
}

export interface Stream {
  id: string;
  /** Display name, budget <= 20 chars (plate row width at the 1280x720 binding box). */
  name: string;
  skills: readonly StreamSkill[];
  /** Generic capability lane — never a vendor or model family. */
  lane: Lane;
  /** Owner ROLE (never a name). */
  role: string;
  /** Where the person's judgment enters, one short clause. */
  checkpoint: string;
  /** What grounds it — public categories only. */
  context: string;
  /** What it may reach — public categories; tool surfaces by codename. */
  reach: string;
  /** Tool surface composed on top, if one exists. */
  surface?: "MIMIR" | "VESPER";
  /** What lands, one short clause. */
  output: string;
  status: "IN USE" | "IN BUILD" | "SCOPED";
}

export interface Team {
  id: string;
  /** Display name, budget <= 20 chars. */
  name: string;
  /** Braid-rail label, budget <= 13 chars (the fan's left column at 10px mono). */
  short: string;
  streams: readonly Stream[];
}

export const TEAMS: readonly Team[] = [
  {
    id: "legal",
    name: "LEGAL",
    short: "LEGAL",
    streams: [
      {
        id: "contract-pre-check",
        name: "CONTRACT PRE-CHECK",
        lane: "DEEP",
        skills: [
          { name: "NDA PRE-CHECK", engine: "judgment" },
          { name: "SPA PRE-CHECK", engine: "judgment" },
          { name: "LEGAL RISK METHODOLOGY", engine: "judgment" },
        ],
        role: "LEGAL REVIEWER",
        checkpoint: "NOVEL CLAUSES ROUTE TO THE REVIEWER",
        context: "CLAUSE LIBRARY + RISK METHODOLOGY",
        reach: "DOCUMENT REVIEW + REDLINES",
        output: "CLAUSE-BY-CLAUSE PRE-CHECK, ESCALATIONS MARKED",
        status: "IN BUILD",
      },
      {
        id: "compliance-watch",
        name: "COMPLIANCE WATCH",
        lane: "FAST",
        skills: [{ name: "TRACKER COMPLIANCE CHECKER", engine: "validation" }],
        role: "LEGAL REVIEWER",
        checkpoint: "VIOLATIONS CONFIRMED BEFORE ACTION",
        context: "CONSENT POLICY",
        reach: "WEBSHOP CRAWL",
        output: "WEEKLY CONSENT-VIOLATION REPORT",
        status: "IN USE",
      },
    ],
  },
  {
    id: "talent",
    name: "TALENT ACQUISITION",
    short: "TALENT",
    streams: [
      {
        id: "candidate-pipeline",
        name: "CANDIDATE PIPELINE",
        lane: "EVERYDAY",
        skills: [
          { name: "CANDIDATE SCREENING BRIEF", engine: "stakeholder" },
          { name: "INTERVIEW DEBRIEF", engine: "validation" },
        ],
        role: "TALENT LEAD",
        checkpoint: "EVERY HIRING CALL STAYS HUMAN",
        context: "ROLE BARS + INTAKE NOTES",
        reach: "CANDIDATE RECORDS",
        output: "SCREENING BRIEFS + SCORED DEBRIEFS",
        status: "SCOPED",
      },
      {
        id: "employer-brand",
        name: "EMPLOYER BRAND",
        lane: "EVERYDAY",
        skills: [{ name: "EMPLOYER BRANDING TOV", engine: "voice" }],
        role: "TALENT LEAD",
        checkpoint: "OUTREACH REVIEWED BEFORE SEND",
        context: "EMPLOYER TONE RULES",
        reach: "JOB POSTS + OUTREACH",
        output: "ON-VOICE CANDIDATE COMMS",
        status: "IN BUILD",
      },
    ],
  },
  {
    id: "finance",
    name: "FINANCE & ACCOUNTING",
    short: "FINANCE",
    streams: [
      {
        id: "month-end-close",
        name: "MONTH-END CLOSE",
        lane: "EVERYDAY",
        skills: [
          { name: "MEC TRACKER", engine: "pattern" },
          { name: "VARIANCE COMMENTARY", engine: "pattern" },
          { name: "GL RECONCILIATIONS", engine: "validation" },
        ],
        role: "FINANCE CONTROLLER",
        checkpoint: "EVERY COMMENTARY REVIEWED",
        context: "ERP EXTRACTS + CLOSE TEMPLATES",
        reach: "LEDGER RECORDS",
        output: "TRACKED CLOSE, DRAFTED COMMENTARY, FLAGGED ANOMALIES",
        status: "IN USE",
      },
      {
        id: "vat-filings",
        name: "VAT & FILINGS",
        lane: "FAST",
        skills: [{ name: "BELGIAN VAT RETURN", engine: "validation" }],
        role: "FINANCE CONTROLLER",
        checkpoint: "RETURN SIGNED OFF BEFORE FILING",
        context: "ERP EXTRACTS + FILING RULES",
        reach: "TAX TEMPLATES",
        output: "PREPARED RETURN, NO MANUAL LOOKUPS",
        status: "SCOPED",
      },
    ],
  },
  {
    id: "product-mgmt",
    name: "PRODUCT MANAGEMENT",
    short: "PRODUCT MGMT",
    streams: [
      {
        id: "idea-pressure-test",
        name: "IDEA PRESSURE-TEST",
        lane: "DEEP",
        skills: [{ name: "PRODUCT IDEATION", engine: "judgment" }],
        role: "PRODUCT LEAD",
        checkpoint: "DIRECTION STAYS WITH THE LEAD",
        context: "VISION BLUEPRINT + PORTFOLIO",
        reach: "RESEARCH TRACE",
        output: "IDEAS TESTED AGAINST MISSION AND ROADMAP",
        status: "IN BUILD",
      },
    ],
  },
  {
    id: "programs",
    name: "PROGRAMS & PRODUCT",
    short: "PROGRAMS",
    streams: [
      {
        id: "program-reporting",
        name: "PROGRAM REPORTING",
        lane: "FAST",
        skills: [
          { name: "PROGRAM STATUS UPDATES", engine: "stakeholder" },
          { name: "RISK MANAGEMENT", engine: "judgment" },
        ],
        role: "PROGRAM LEAD",
        checkpoint: "EMPHASIS CORRECTED BEFORE IT SHIPS",
        context: "TRANSCRIPTS + RISK BOARDS + ROADMAP",
        reach: "PROGRAM RECORDS",
        output: "CROSS-TEAM STATUS DIGEST, STANDARDISED RISKS",
        status: "IN BUILD",
      },
      {
        id: "esg-disclosure",
        name: "ESG DISCLOSURE",
        lane: "EVERYDAY",
        skills: [{ name: "VSME SUSTAINABILITY REPORTING", engine: "pattern" }],
        role: "PROGRAM LEAD",
        checkpoint: "DISCLOSURES APPROVED BEFORE RELEASE",
        context: "STRUCTURED INPUTS + REPORTING TEMPLATE",
        reach: "REPORTING RECORDS",
        output: "CREDIBLE DISCLOSURES WITHOUT A DEDICATED FUNCTION",
        status: "SCOPED",
      },
    ],
  },
  {
    id: "product-eng",
    name: "PRODUCT ENGINEERING",
    short: "PRODUCT ENG",
    streams: [
      {
        id: "engineering-intake",
        name: "ENGINEERING INTAKE",
        lane: "EVERYDAY",
        skills: [
          { name: "BRR GENERATOR", engine: "judgment" },
          { name: "DAILY BRIEF", engine: "pattern" },
        ],
        role: "ENGINEERING LEAD",
        checkpoint: "REQUIREMENTS SIGNED BY THE LEAD",
        context: "MAIL + TRANSCRIPTS + BOARDS",
        reach: "REVIEW TEMPLATES",
        output: "ONE MORNING BRIEF, STANDARD REQUIREMENT REVIEWS",
        status: "IN USE",
      },
    ],
  },
  {
    id: "cx-ops",
    name: "WAREHOUSING & CX OPS",
    short: "CX OPS",
    streams: [
      {
        id: "support-quality",
        name: "SUPPORT QUALITY",
        lane: "FAST",
        skills: [
          { name: "QUALITY AUDITOR", engine: "validation" },
          { name: "FRAUD DETECTION", engine: "validation" },
        ],
        role: "CX QUALITY LEAD",
        checkpoint: "FLAGS REVIEWED, NEVER AUTO-ACTIONED",
        context: "SCORECARDS + ORDER HISTORY",
        reach: "TICKETS + STOREFRONT ORDERS",
        output: "SCORED TICKETS, FLAGGED ORDERS, TREND REPORTS",
        status: "IN USE",
      },
      {
        id: "invoice-control",
        name: "INVOICE CONTROL",
        lane: "FAST",
        skills: [
          { name: "INVOICE PROCESSOR", engine: "validation" },
          { name: "DASHBOARD CONSOLIDATION", engine: "pattern" },
        ],
        role: "OPS LEAD",
        checkpoint: "EXCEPTIONS LAND WITH A PERSON",
        context: "VENDOR MASTER + PRIOR INVOICES",
        reach: "SUPPLIER INVOICES + DASHBOARDS",
        output: "CROSS-CHECKED INVOICES, ONE EXEC READOUT",
        status: "IN USE",
      },
    ],
  },
  {
    id: "people-ops",
    name: "PEOPLE OPS",
    short: "PEOPLE OPS",
    streams: [
      {
        id: "process-encoding",
        name: "PROCESS ENCODING",
        lane: "EVERYDAY",
        skills: [
          { name: "SOP GENERATOR", engine: "pattern" },
          { name: "ONBOARDING & POPS PROCESSES", engine: "judgment" },
        ],
        role: "PEOPLE OPS LEAD",
        checkpoint: "EDGE CASES DECIDED BY THE TEAM",
        context: "GOOD SOP EXAMPLES + PLAYBOOKS",
        reach: "PROCESS RECORDS",
        output: "COMPLETE SOPS, ENCODED EDGE-CASE HANDLING",
        status: "IN BUILD",
      },
      {
        id: "internal-comms",
        name: "INTERNAL COMMS",
        lane: "EVERYDAY",
        skills: [{ name: "PEOPLE-TEAM VOICE", engine: "voice" }],
        role: "PEOPLE OPS LEAD",
        checkpoint: "SENSITIVE COMMS STAY HUMAN",
        context: "PEOPLE TONE RULES",
        reach: "PLAYBOOK PAGES",
        output: "ON-VOICE INTERNAL COMMS",
        status: "IN USE",
      },
    ],
  },
  {
    id: "brand",
    name: "BRAND & PARTNERSHIPS",
    short: "BRAND & PTNRS",
    streams: [
      {
        id: "partner-triage",
        name: "PARTNER TRIAGE",
        lane: "EVERYDAY",
        skills: [{ name: "PARTNERSHIP INBOX FILTER", engine: "judgment" }],
        role: "PARTNERSHIPS LEAD",
        checkpoint: "TIER CALLS CONFIRMED BY THE LEAD",
        context: "TIER GRADIENT EXAMPLES",
        reach: "PARTNERSHIP INBOX",
        output: "CLASSIFIED REQUESTS, TIER-APPROPRIATE DRAFTS",
        status: "IN BUILD",
      },
      {
        id: "founder-campaigns",
        name: "FOUNDER & CAMPAIGNS",
        lane: "EVERYDAY",
        skills: [
          { name: "FOUNDER TONE OF VOICE", engine: "voice" },
          { name: "PAID SOCIAL TOV", engine: "voice" },
          { name: "360 MARKETING AGENT", engine: "pattern" },
        ],
        role: "BRAND LEAD",
        checkpoint: "FOUNDER-LED COMMS APPROVED PERSONALLY",
        context: "FOUNDER VOICE + BRAND RULES",
        reach: "CAMPAIGN DRAFTS",
        output: "ON-VOICE FOUNDER AND CAMPAIGN COPY",
        status: "IN USE",
      },
    ],
  },
  {
    id: "insights",
    name: "STRATEGIC INSIGHTS",
    short: "INSIGHTS",
    streams: [
      {
        id: "market-scanning",
        name: "MARKET SCANNING",
        lane: "EVERYDAY",
        skills: [
          { name: "MARKET SCAN BRIEF", engine: "stakeholder" },
          { name: "TREND SCRAPER", engine: "pattern" },
        ],
        role: "INSIGHTS LEAD",
        checkpoint: "SIGNALS WEIGHED BY THE LEAD",
        context: "CATEGORY + COMPETITIVE SIGNALS",
        reach: "EXTERNAL TREND SOURCES",
        output: "A STANDING BRIEF, REFRESHED WEEKLY",
        status: "IN BUILD",
      },
      {
        id: "survey-synthesis",
        name: "SURVEY SYNTHESIS",
        lane: "DEEP",
        skills: [{ name: "SURVEY SYNTHESIS", engine: "stakeholder" }],
        role: "INSIGHTS LEAD",
        checkpoint: "CONFIDENCE NOTES REVIEWED",
        context: "RAW SURVEY EXPORTS",
        reach: "RESEARCH RECORDS",
        output: "THEMED READOUTS WITH QUOTED EVIDENCE",
        status: "SCOPED",
      },
    ],
  },
  {
    id: "manufacturing",
    name: "MANUFACTURING",
    short: "MANUFACTURING",
    streams: [
      {
        id: "program-feasibility",
        name: "PROGRAM FEASIBILITY",
        lane: "DEEP",
        skills: [
          { name: "COST / FEASIBILITY / PORTFOLIO", engine: "judgment" },
          { name: "LEAD TIME CALCULATOR", engine: "pattern" },
        ],
        role: "MANUFACTURING PLANNER",
        checkpoint: "TRIAGE CALLS STAY WITH THE PLANNER",
        context: "SUPPLIER LANES + COST RULES",
        reach: "PROGRAM RECORDS",
        output: "HONEST PROGRAM DATES, TRIAGED CONCEPTS",
        status: "IN BUILD",
      },
      {
        id: "supplier-qa",
        name: "SUPPLIER QA",
        lane: "EVERYDAY",
        skills: [{ name: "SUPPLIER QA AUDIT", engine: "validation" }],
        role: "MANUFACTURING PLANNER",
        checkpoint: "AUDIT SCORES CONFIRMED",
        context: "LOOP QA BARS",
        reach: "SUPPLIER REPORTS",
        output: "SCORED SUPPLIER QA REPORTS",
        status: "SCOPED",
      },
    ],
  },
  {
    id: "design",
    name: "PRODUCT DESIGN & UX",
    short: "DESIGN & UX",
    streams: [
      {
        id: "packaging-production",
        name: "PACKAGING PRODUCTION",
        lane: "EVERYDAY",
        skills: [
          { name: "LOOP PACKAGING SYSTEM", engine: "pattern" },
          { name: "CMF FILE GENERATOR", engine: "pattern" },
        ],
        role: "DESIGN PRODUCER",
        checkpoint: "SUPPLIER FILES APPROVED BEFORE RELEASE",
        context: "ARTWORK FILES + SPEC WORKBOOKS",
        reach: "SUPPLIER-READY PDFS",
        surface: "VESPER",
        output: "MANUFACTURER-READY FILES, STAGE FOLDERS PROMOTED",
        status: "IN USE",
      },
      {
        id: "concept-evaluation",
        name: "CONCEPT EVALUATION",
        lane: "DEEP",
        skills: [
          { name: "CONCEPT TRIAGE ENGINE", engine: "judgment" },
          { name: "UX FOUNDATIONS EVALUATION", engine: "judgment" },
        ],
        role: "DESIGN LEAD",
        checkpoint: "FINAL READ STAYS WITH THE LEAD",
        context: "UX PILLARS + PORTFOLIO FIT",
        reach: "CONCEPT RECORDS",
        output: "CONCEPTS SCORED ON COST, FEASIBILITY, ALIGNMENT",
        status: "IN BUILD",
      },
      {
        id: "review-intelligence",
        name: "REVIEW INTELLIGENCE",
        lane: "EVERYDAY",
        skills: [{ name: "PRODUCT REVIEW ANALYSIS", engine: "pattern" }],
        role: "DESIGN LEAD",
        checkpoint: "THEMES VALIDATED BEFORE ROADMAP USE",
        context: "MARKETPLACE REVIEWS ACROSS MARKETS",
        reach: "REVIEW EXPORTS",
        output: "THEMES AND REQUEST PATTERNS ACROSS MARKETS",
        status: "IN BUILD",
      },
    ],
  },
  {
    id: "performance",
    name: "PERFORMANCE",
    short: "PERFORMANCE",
    streams: [
      {
        id: "creative-strategy",
        name: "CREATIVE STRATEGY",
        lane: "DEEP",
        skills: [{ name: "LOOP CREATIVE STRATEGY", engine: "judgment" }],
        role: "CREATIVE STRATEGIST",
        checkpoint: "THE STRATEGIST OWNS THE READ",
        context: "DESIRE AXES + HOOK ARCHETYPES",
        reach: "EVERY REVIEW, AD AND BRIEF",
        surface: "MIMIR",
        output: "STRATEGY APPLIED TO EVERY BRIEF",
        status: "IN USE",
      },
    ],
  },
  {
    id: "studio",
    name: "STUDIO",
    short: "STUDIO",
    streams: [
      {
        id: "paid-social",
        name: "PAID SOCIAL",
        lane: "EVERYDAY",
        skills: [
          { name: "LOOP PAID SOCIAL", engine: "voice" },
          { name: "GENAI PROMPTING", engine: "pattern" },
          { name: "ASSET BRIEF GENERATOR", engine: "pattern" },
        ],
        role: "STUDIO PRODUCER",
        checkpoint: "EVERY AD PASSES CREATIVE REVIEW",
        context: "295 REAL ADS + COMPLIANCE RULES",
        reach: "CAMPAIGN DRAFTS",
        surface: "MIMIR",
        output: "ON-BRAND COPY AND COMPLETE BRIEFS AT VOLUME",
        status: "IN USE",
      },
      {
        id: "lifecycle-retail",
        name: "LIFECYCLE & RETAIL",
        lane: "EVERYDAY",
        skills: [
          { name: "LOOP CRM", engine: "voice" },
          { name: "LOOP MARKETPLACE", engine: "voice" },
        ],
        role: "STUDIO PRODUCER",
        checkpoint: "GUARDRAILED SENDS STILL REVIEWED",
        context: "LIFECYCLE RULES + MARKETPLACE FORMATS",
        reach: "CRM + MARKETPLACE COPY",
        output: "LIFECYCLE AND MARKETPLACE COPY IN VOICE",
        status: "IN USE",
      },
      {
        id: "localization-qa",
        name: "LOCALIZATION & QA",
        lane: "FAST",
        skills: [
          { name: "LOCALIZATION", engine: "validation" },
          { name: "FEEDBACK SUMMARIZER", engine: "stakeholder" },
        ],
        role: "STUDIO PRODUCER",
        checkpoint: "LOCALE CALLS CONFIRMED BY A READER",
        context: "APPROVED TRANSLATIONS",
        reach: "LOCALE COPY + FEEDBACK THREADS",
        output: "LOCALE-CHECKED COPY, ACTIONABLE FEEDBACK",
        status: "IN BUILD",
      },
    ],
  },
];

/* -- Derived (checked against the aether registry's own arithmetic) -------- */

export const ALL_STREAMS: readonly Stream[] = TEAMS.flatMap((t) => t.streams);

export const STREAM_TEAM: ReadonlyMap<string, Team> = new Map(
  TEAMS.flatMap((t) => t.streams.map((s) => [s.id, t] as const))
);

export const STREAM_BY_ID: ReadonlyMap<string, Stream> = new Map(ALL_STREAMS.map((s) => [s.id, s]));

export const TAGGED_SKILL_COUNT = ALL_STREAMS.reduce((n, s) => n + s.skills.length, 0);

export function teamEngineCounts(team: Team): Map<EngineKey, number> {
  const counts = new Map<EngineKey, number>();
  team.streams.forEach((s) =>
    s.skills.forEach((sk) => counts.set(sk.engine, (counts.get(sk.engine) ?? 0) + 1))
  );
  return counts;
}

export function streamEngines(stream: Stream): readonly EngineKey[] {
  return ENGINES.filter((e) => stream.skills.some((sk) => sk.engine === e.key)).map((e) => e.key);
}

export const DEFAULT_STREAM_ID = "paid-social";

if (process.env.NODE_ENV !== "production") {
  // The registry's own arithmetic, kept honest at dev time.
  if (TAGGED_SKILL_COUNT !== 47) {
    throw new Error(
      `intelligence-map-diagrams: streams reference ${TAGGED_SKILL_COUNT} skills, expected 47`
    );
  }
  ENGINES.forEach((engine) => {
    const n = ALL_STREAMS.reduce(
      (acc, s) => acc + s.skills.filter((sk) => sk.engine === engine.key).length,
      0
    );
    if (n !== engine.skills) {
      throw new Error(
        `intelligence-map-diagrams: ${engine.label} references ${n} skills, expected ${engine.skills}`
      );
    }
  });
}
