import type { ArcListGroup } from "../../types";

/**
 * The Loop Skill roster, team by team — SHARED EVIDENCE (ADR-072).
 *
 * Hoisted verbatim out of `ai-keynote.ts` so the keynote and the portfolio
 * arc letter ONE roster: both import this array by reference (pinned with
 * `toBe` in `tests/lib/arcs-registry.test.ts`), so a status change or a
 * renamed Skill lands on both pages in the same edit. The frame around it —
 * the head, the sub, where it sits in the deck — stays authored per arc.
 *
 * Forty-seven tagged Skills across fifteen team groups (the landing's
 * Intelligence Map sums the same portfolio per shape; 42 is superseded and
 * pinned OUT). `meta` carries the owner's FIRST NAME only — the casefile's
 * envelope (`.claude/rules/proof.md`), now guarded on the arcs too.
 */
export const LOOP_SKILL_GROUPS: readonly ArcListGroup[] = [
  {
    id: "legal",
    label: "Legal",
    items: [
      {
        id: "tracker-compliance-checker",
        tag: "IN USE",
        name: "Tracker Compliance Checker",
        body: "Drives Chrome across Loop webshops and produces a weekly consent-violation report. Rule-based check against consent policy.",
        meta: "Herman",
      },
      {
        id: "nda-pre-check",
        tag: "IN BUILD",
        name: "NDA Pre-Check",
        body: "Clause-by-clause review encoded. Catches routine deviations, routes novel cases to Legal. Unlocks four more pre-checks downstream.",
        meta: "Olga + Vince",
      },
      {
        id: "legal-risk-methodology",
        tag: "IN BUILD",
        name: "Legal Risk Methodology",
        body: "Loop risk methodology as substrate, starting with AI and Data Privacy. The engine all five Legal pre-checks call into.",
        meta: "Vince → team",
      },
      {
        id: "spa-pre-check",
        tag: "SCOPED",
        name: "SPA Pre-Check",
        body: "Same judgment-engine shape as NDA Pre-Check, applied to shareholder purchase agreements.",
        meta: "Legal",
      },
    ],
  },
  {
    id: "talent-acquisition",
    label: "Talent Acquisition",
    items: [
      {
        id: "employer-branding-tov",
        tag: "IN BUILD",
        name: "Employer Branding TOV",
        body: "Employer-facing tone encoded for job posts, outreach, and candidate comms. Pairs with People-team voice on internal side.",
        meta: "TA team",
      },
      {
        id: "candidate-screening",
        tag: "SCOPED",
        name: "Candidate Screening Brief",
        body: "Structures intake notes into a consistent screening brief hiring managers can review in one pass.",
        meta: "Maxim",
      },
      {
        id: "interview-debrief",
        tag: "SCOPED",
        name: "Interview Debrief",
        body: "Turns panel notes into a scored debrief against Loop hiring bars. Output is a score against a fixed rubric, which is the Validation shape.",
        meta: "Jenn",
      },
    ],
  },
  {
    id: "finance",
    label: "Finance & Accounting",
    items: [
      {
        id: "variance-commentary",
        tag: "IN USE",
        name: "Variance Commentary",
        body: "Month-end variance templates encoded. The Skill drafts the commentary, Helen reviews. Sounds like Helen. Structured inputs to templated narrative output.",
        meta: "Helen",
      },
      {
        id: "mec-tracker",
        tag: "IN USE",
        name: "MEC Tracker",
        body: "Month-end-close tracker in Claude as a Project. Carries forward month over month, surfaces blockers, drafts the status note.",
        meta: "Jenny",
      },
      {
        id: "gl-reconciliations",
        tag: "IN BUILD",
        name: "GL Reconciliations",
        body: "SAP extract to reconciliation checks with anomaly flags. Same validation cluster as VAT.",
        meta: "Finance",
      },
      {
        id: "belgian-vat-return",
        tag: "SCOPED",
        name: "Belgian VAT Return",
        body: "SAP extract to VAT return automation. Replaces manual Excel Vlookups for the boxes.",
        meta: "Thijs",
      },
    ],
  },
  {
    id: "product-management",
    label: "Product Management",
    items: [
      {
        id: "product-ideation",
        tag: "IN BUILD",
        name: "Product Ideation",
        body: "Loop Vision Blueprint encoded as substrate. Pressure-tests raw ideas against portfolio, mission, value spaces, and roadmap.",
        meta: "Carlota + Vince",
      },
    ],
  },
  {
    id: "program-management",
    label: "Program Management & Product",
    items: [
      {
        id: "program-status-updates",
        tag: "IN BUILD",
        name: "Program Status Updates",
        body: "Reads transcripts, checks risk boards with program codes, reviews roadmap, drafts cross-team status digest.",
        meta: "Robert",
      },
      {
        id: "risk-management",
        tag: "IN BUILD",
        name: "Risk Management",
        body: "Standardizes risk descriptions, detects gaps, surfaces decision reasoning. Same engine shape as NDA Pre-Check.",
        meta: "Sander",
      },
      {
        id: "vsme-sustainability-reporting",
        tag: "SCOPED",
        name: "VSME Sustainability Reporting",
        body: "Voluntary reporting standard for SMEs. Structured inputs to reporting template. Credible sustainability disclosures without a dedicated reporting function.",
        meta: "Vince → team",
      },
    ],
  },
  {
    id: "product-engineering",
    label: "Product Engineering",
    items: [
      {
        id: "daily-brief",
        tag: "IN USE",
        name: "Daily Brief",
        body: "Pulls email, transcripts, and boards into one PE morning brief. Multi-source briefing pattern shared with Program Mgmt.",
        meta: "Jennifer",
      },
      {
        id: "brr-generator",
        tag: "IN USE",
        name: "BRR Generator",
        body: "Generates Business Requirements Reviews from intake into the standardized PE template.",
        meta: "PE team",
      },
    ],
  },
  {
    id: "warehousing",
    label: "Warehousing & Customer Ops",
    items: [
      {
        id: "quality-auditor",
        tag: "IN USE",
        name: "Quality Auditor",
        body: "Scores support tickets against Maud scorecard. Compares AI to human responses across BPOs. Batch trend report with outliers.",
        meta: "Toby + Maud",
      },
      {
        id: "fraud-detection",
        tag: "IN BUILD",
        name: "Fraud Detection",
        body: "Pattern analysis on Shopify orders. Flags weird addresses, bot orders, suspicious refunds. Output is a flag list, which is the Validation shape.",
        meta: "Toby + Maud",
      },
      {
        id: "invoice-processor",
        tag: "IN USE",
        name: "Invoice Processor",
        body: "Supplier invoices across templates. Cross-checks vendor master, POs, prior invoices. Catches scam patterns.",
        meta: "Davy + Vince",
      },
      {
        id: "dashboard-consolidation",
        tag: "IN USE",
        name: "Dashboard Consolidation",
        body: "Harmonizes Klaviyo and Data Inzit into one exec-ready readout. Same briefing pattern plugs into Program Mgmt work.",
        meta: "Rob + Samuel",
      },
    ],
  },
  {
    id: "people-ops",
    label: "People Ops",
    items: [
      {
        id: "people-team-voice",
        tag: "IN USE",
        name: "People-team Voice",
        body: "Tone-of-voice Skill for playbook pages and internal comms. Built live from Thais TOV doc. Extending to emails and decks.",
        meta: "Thais",
      },
      {
        id: "sop-generator",
        tag: "IN BUILD",
        name: "SOP Generator",
        body: "Reverse-engineered from good Loop SOPs. Asks the question flow that elicits a complete SOP, drafts it for review.",
        meta: "Gabriel",
      },
      {
        id: "onboarding-pops-processes",
        tag: "IN BUILD",
        name: "Onboarding & POps Processes",
        body: "Reasoning-first encoding of how People Ops handles edge cases. Includes celebration slides from interview transcripts.",
        meta: "Bernice",
      },
      {
        id: "internal-loopers-personas",
        tag: "IN BUILD",
        name: "Internal Loopers Personas",
        body: "Employee personas for pressure-testing internal comms, playbook drafts, and policies before they go out. Simulates the reader rather than framing for one, so it does not fit Stakeholder.",
        meta: "Astrid",
      },
    ],
  },
  {
    id: "brand-partnerships",
    label: "Brand & Partnerships",
    items: [
      {
        id: "founder-tone-of-voice",
        tag: "IN USE",
        name: "Founder Tone of Voice",
        body: "Loop founder voice encoded. Used for Tomorrowland prep and ongoing founder-led comms.",
        meta: "Sayrade",
      },
      {
        id: "partnership-inbox-filter",
        tag: "IN BUILD",
        name: "Partnership Inbox Filter",
        body: "Classifies partnership requests by tier using gradient examples. Drafts the tier-appropriate response. Output is a draft with reasoning.",
        meta: "Nathalie + Stan + Vince",
      },
      {
        id: "360-marketing-agent",
        tag: "IN BUILD",
        name: "360 Marketing Agent",
        body: "Porting Yalis ChatGPT custom GPT into a Claude Skill for sharing, versioning, and wider Loop workflows.",
        meta: "Yalis",
      },
      {
        id: "retail-marketing-calendar",
        tag: "IN USE",
        name: "Retail Marketing Calendar",
        body: "One year, every retailer. Built in Claude Design, plugged into Mímir as live database PMM team owns together. This is a content asset Mímir consumes, not an inputs-to-output engine.",
        meta: "Pixie",
      },
      {
        id: "paid-social-tov",
        tag: "IN BUILD",
        name: "Paid Social TOV",
        body: "Paid social copy rules encoded so campaign drafts stay on-brand before human review.",
        meta: "Brand",
      },
    ],
  },
  {
    id: "strategic-insights",
    label: "Strategic Insights",
    items: [
      {
        id: "market-scan-brief",
        tag: "IN BUILD",
        name: "Market Scan Brief",
        body: "Structures competitive and category signals into a standing brief format the insights team can refresh weekly.",
        meta: "Kuhn",
      },
      {
        id: "survey-synthesis",
        tag: "SCOPED",
        name: "Survey Synthesis",
        body: "Turns raw survey exports into themed readouts with quoted evidence and confidence notes.",
        meta: "Insights",
      },
      {
        id: "trend-scraper",
        tag: "IN BUILD",
        name: "Trend Scraper",
        body: "Pulls external trend signals into a digest the team can route into briefing and calendar workflows.",
        meta: "Insights · Cowork",
      },
    ],
  },
  {
    id: "manufacturing-programs",
    label: "Manufacturing Programs",
    items: [
      {
        id: "lead-time-calculator",
        tag: "IN USE",
        name: "Lead Time Calculator",
        body: "Encodes lead-time rules across suppliers and lanes so program dates stay honest in planning conversations.",
        meta: "Alice",
      },
      {
        id: "cost-feasibility-portfolio",
        tag: "IN BUILD",
        name: "Cost / Feasibility / Portfolio",
        body: "Manufacturing-side triage on cost, feasibility, and portfolio fit. Shares judgment-engine DNA with design triage.",
        meta: "Elodie + Alice",
      },
      {
        id: "supplier-qa-audit",
        tag: "SCOPED",
        name: "Supplier QA Audit",
        body: "Scores supplier QA reports against Loop bars. Validation cluster alongside warehousing quality work.",
        meta: "Manufacturing",
      },
      { id: "manufacturing-more", name: "+ localization, BOM checks in backlog" },
    ],
  },
  {
    id: "product-design",
    label: "Product Design & UX",
    items: [
      {
        id: "cmf-file-generator",
        tag: "IN USE",
        name: "CMF File Generator",
        body: "Excel schema in, manufacturer-ready PDF with cloud renders out. Wired into Vesper for end-to-end CMF generation.",
        meta: "Damien",
      },
      {
        id: "loop-packaging-system",
        tag: "IN USE",
        name: "Loop Packaging System",
        body: "End-to-end automation for Loop’s packaging production. Editable Illustrator files plus an Excel workbook in, supplier-ready PDFs with info-box overlays plus the wrap-around Creative Intent brief out. Promotes EVT → DVT → PVT → MP folder structures.",
        meta: "Ana",
      },
      {
        id: "ux-foundations-evaluation",
        tag: "IN BUILD",
        name: "UX Foundations Evaluation",
        body: "Reads a concept and returns alignment against Loop six UX pillars: Elevated, Nonconformist, Empowering, and the rest.",
        meta: "Aurélie",
      },
      {
        id: "sketch-to-digital-twin",
        tag: "SHIPPED",
        name: "Sketch to Digital Twin",
        body: "Converts 2D sketches into 3D digital twins. Modality conversion; does not fit one of the five engines.",
        meta: "Tibo",
      },
      {
        id: "concept-triage-engine",
        tag: "IN BUILD",
        name: "Concept Triage Engine",
        body: "Three Skills, one engine: cost estimation, feasibility, portfolio fit. Four design checks as one architectural move.",
        meta: "Elodie",
      },
      {
        id: "product-review-analysis",
        tag: "IN BUILD",
        name: "Product Review Analysis",
        body: "Amazon review scraping and structured analysis. Surfaces themes and request patterns across markets.",
        meta: "Mattis",
      },
      { id: "product-design-more", name: "+ Visual Persona, Context Mapping in backlog" },
    ],
  },
  {
    id: "performance",
    label: "Performance",
    items: [
      {
        id: "loop-creative-strategy",
        tag: "IN USE",
        name: "Loop Creative Strategy",
        body: "The creative-strategy substrate Loop runs on: four axes (Reiss desire, Life Force 8, awareness stage, transformation arc) plus ten hook archetypes, applied to every review, ad, and brief. Mímir composes off this engine.",
        meta: "Chloe",
      },
    ],
  },
  {
    id: "studio",
    label: "Studio",
    items: [
      {
        id: "feedback-summarizer",
        tag: "IN USE",
        name: "Feedback Summarizer",
        body: "Turns creative feedback threads into a structured summary stakeholders can act on without re-reading Slack.",
        meta: "Rhodes",
      },
      {
        id: "localization",
        tag: "IN BUILD",
        name: "Localization",
        body: "Locale-aware copy checks against approved translations. Pairs with Loop Figma localization repair workflows.",
        meta: "Studio",
      },
      {
        id: "asset-brief-generator",
        tag: "IN BUILD",
        name: "Asset Brief Generator",
        body: "Drafts studio briefs from campaign inputs so producers start from a complete spec, not a blank doc.",
        meta: "Rhodes",
      },
      {
        id: "it-access-runbook",
        tag: "SCOPED",
        name: "IT Access Runbook",
        body: "Encodes IT onboarding steps and access checks so Studio and PE requests route with fewer round-trips. SOP-adjacent but borderline; leave untagged until a sibling lands.",
        meta: "Kelly",
      },
      {
        id: "loop-paid-social",
        tag: "IN USE",
        name: "Loop Paid Social",
        body: "Paid social ad copy for Loop Earplugs, grounded in 295 real ads across every product, audience angle, seasonal campaign, and brand collab. Generates Meta primary text, headlines, descriptions, and DPA copy in Loop voice with compliance baked in.",
        meta: "Chloe",
      },
      {
        id: "loop-crm",
        tag: "SHIPPED",
        name: "Loop CRM",
        body: "CRM communications across the customer lifecycle. Onboarding, retention, support escalations, win-back, loyalty. Loop voice with GDPR / CAN-SPAM / TCPA guardrails encoded into the Skill, not bolted on after.",
        meta: "CRM",
      },
      {
        id: "loop-marketplace",
        tag: "SHIPPED",
        name: "Loop Marketplace",
        body: "Amazon marketplace copy for Loop products. Titles, SEO descriptions, bullets, A+ content modules, and PDP image text. Adapts base copy for collabs (Coachella, Tomorrowland), bundles, and new colourways via the proven substitution patterns.",
        meta: "Marketplace",
      },
      {
        id: "genai-prompting",
        tag: "IN USE",
        name: "GenAI Prompting",
        body: "How Loop gets useful work out of AI image and video tools. Knows which models want a story and which want keyword density, uses reference images without copying them, and turns one campaign idea into a slate of distinct ads.",
        meta: "Studio",
      },
    ],
  },
];
