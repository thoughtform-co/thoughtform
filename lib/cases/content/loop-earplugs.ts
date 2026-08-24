import type {
  CaseDef,
  CaseMapChain,
  CaseMapDistrict,
  CaseMapShape,
  CaseMapWork,
  CaseSkillEntry,
} from "../types";

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
 *   · 22 workshops = the board count of team sessions run. 14 is the count
 *     of teams with published skill cards — A DIFFERENT SET, and since
 *     2026-08-02 BOTH are published, so the wording has to keep them
 *     apart: teams are BRIEFED (22, the rollout log and the governance
 *     row) or they are USING THE LAYER (14, the Intelligence Map foot).
 *     Never "22 teams mapped" — that phrasing claimed the second number's
 *     meaning with the first number's value, and is now pinned out.
 *   · 47+ Skills = the count tagged to one of the five shapes, and the
 *     figure the Intelligence Map plate SUMS ON SCREEN (12 + 7 + 9 + 5 +
 *     14). It replaced 42 on 2026-08-02, everywhere at once: the plate
 *     makes the arithmetic visible, so a surviving 42 anywhere on the
 *     page would be a second variant the reader can check. (51 is the
 *     registry's card count including untagged and scoped placeholders;
 *     printing both invites arithmetic that reconciles to neither.)
 *   · 4 tools = PROJECT_CASES / CASE_TOTAL.
 *   · 97% of paid-social briefings involve AI = the latest Studio figure.
 *     It is intentionally identical here and on the AI keynote arc, with a
 *     parity guard in `tests/lib/cases-registry.test.ts`. Earlier proposal
 *     and arc variants are superseded. The `Thoughtform Prime` design
 *     handoff's older team and Skill totals remain pinned out there too.
 *
 * CONFIDENTIALITY. No spend, commit, contract value, or per-seat figure
 * appears here or may be added — see `.claude/rules/proof.md`. Loop staff
 * are first-name only. Tool codenames are in scope for a case study
 * (published precedent: PROJECT_CASES); they stay OUT of general service
 * copy (`services/serviceDesignations.ts`). The work-configuration records
 * below are stricter: broad public roles only, with no personal names.
 */

/* ── Evidence, hoisted so both surfaces read the same rows ───────────── */

/** ⚠ EXPORTED FOR THE ARCS' PARITY PIN ONLY (ADR-078). The portfolio's
 *  rollout beat states these milestones as sentences rather than log
 *  lines, and `lib/arcs` keeps no `lib/cases` import (the `LOOP_FIGURES`
 *  precedent), so the two are re-authored and pinned to agree in
 *  `arcs-registry.test.ts`. Nothing renders this array twice. */
export const ROLLOUT_ROWS = [
  { t: "2024", event: "Embedded. First workflows mapped" },
  { t: "Pilot", event: "69 seats, one team at a time" },
  { t: "Q2 2026", event: "Enterprise agreement signed" },
  { t: "Parallel", event: "SSO · connector review · governance" },
  { t: "Q2 2026", event: "22 teams briefed, 45 minutes each" },
  { t: "Now", event: "130+ people, on organic pull" },
] as const;
const ROLLOUT_TAIL = "One workflow worth encoding, per team.";

/**
 * The work → intelligence map (2026-07-31), WEIGHTED 2026-08-02.
 *
 * WHAT CHANGED AND WHY. This was a skills registry: the rows named a
 * workflow and the `tag` named which of the five shapes it belonged to. It
 * now names WHAT RUNS THE WORK. That one change is the difference between
 * a list of artifacts and a map.
 *
 * THE WEIGHTS (2026-08-02, ADR-056 U12) are the second change, and they
 * qualify the July ruling rather than reversing it. That ruling — "a count
 * of Skills is not evidence of a transformation" — was about the FOOT of a
 * row claiming a transformation. This row now claims THE MAP ITSELF, and a
 * map with no scale is a diagram: how much of the portfolio each shape
 * carries, and how far it spreads, is exactly what a reader needs to see
 * that the taxonomy is load-bearing and not five words invented for a
 * slide. The counts sum to the 47+ the foot prints, in view, which is why
 * the sweep of that figure had to land in the same change.
 *
 * `count` and `teams` are read from the client's own adoption board (rev
 * 2026.07), where the tagging lives. The BEAT renders name + gloss only, so
 * it is unaffected by the weights it now carries — the two surfaces still
 * share this array by reference, which is what stops them describing the
 * same portfolio differently.
 *
 * A third field naming two Skills per shape was built and CUT: it clipped
 * 59px at 1440×820 and 39px at 1600×900, so it would have shipped as copy
 * visible on roughly one desktop in ten. See the note on `types.ts`.
 *
 * The `Human` row below is the load-bearing one. A map with no human rows
 * is a sales list; the measurement that makes it a decision record is that
 * "stays human" is recorded rather than left as a gap. Do not remove it to
 * make the panel look more automated — that would invert its meaning.
 *
 * The five shapes themselves are unchanged: they are the taxonomy of the
 * work, and they outlive the assignment beside them.
 */
const MAP_GROUPS = [
  {
    name: "Judgment",
    gloss: "Applies senior judgment to varied inputs.",
    count: "12",
    teams: "9 teams",
  },
  {
    name: "Voice",
    gloss: "Writes in a specific Loop voice.",
    count: "7",
    teams: "4 teams",
  },
  {
    name: "Validation",
    gloss: "Checks output against a Loop bar.",
    count: "9",
    teams: "6 teams",
  },
  {
    name: "Stakeholder",
    gloss: "Frames information for a specific reader.",
    count: "5",
    teams: "4 teams",
  },
  {
    name: "Pattern",
    gloss: "Composes structured outputs from recurring inputs.",
    count: "14",
    teams: "10 teams",
  },
] as const;
/**
 * THREE rows — ONE PER ASSIGNMENT. Measured, not chosen.
 *
 * The plate box holds about eight lines and five of them are the groups
 * above, so the row budget is three. Everything past that clips silently,
 * and the clipping is viewport-dependent: at six rows 1280×720 showed
 * three, 1440×800 showed four, and 1920×1080 showed all six, so the defect
 * is invisible on the machine most likely to be authoring it. A fourth row
 * looked fine at 1920 and had its TAG sliced at 1440 — a row with half a
 * tag reads as broken, which is worse than a shorter list.
 *
 * ⚠ THE WEIGHTS SPEND THE SAME BUDGET (2026-08-02), which is why they had to
 * stay on ONE line per group. A second line — two Skills named per shape —
 * cost 71px and clipped at every viewport below ~970h, and these rows are
 * what it would have pushed out. They win that conflict every time: the
 * `Human` row is the one thing on this plate that cannot be lost.
 *
 * The old skills registry had the same budget problem; it just sat on row
 * five where few readers reached it. As the default panel it is the first
 * thing anyone sees.
 *
 * So the list is a KEY, not a census: one exemplar of each answer the map
 * can give. That is also the more honest register — six rows implied an
 * inventory, and the inventory is not what this panel is claiming.
 * ⚠ Adding a fourth row costs the laptop tiers an assignment, and no test
 * will tell you.
 */
const MAP_ROWS = [
  { team: "Legal", name: "NDA pre-check", tag: "Skill" },
  { team: "Studio", name: "Briefing synthesis", tag: "Tool" },
  { team: "Design", name: "CMF sign-off", tag: "Human" },
] as const;
/* NO FOOTER, deliberately. The plate's box holds about nine lines and five
   are the groups, so a footer of any length pushed a row out at 1280×720 and
   1440×800 — and a line that renders only at 1920 is dead copy someone will
   later edit believing it ships. What it said ("Skill, tool, or human —
   every row is a recorded decision") is what the TAGS already show, so this
   cuts a restatement rather than evidence. The 295-ads grounding claim the
   old skills-registry footer carried is still published on the ai-keynote
   arc page; nothing went with this. */

const TOOL_IDS = ["mimir", "vesper", "babylon", "heimdall"] as const;

/**
 * The browsable portfolio (ADR-056 U13, owner: "a minimalistic system à la
 * aether /claude-adoption with an overview of the different skills where
 * users can click on").
 *
 * READ FROM THE CLIENT'S OWN BOARD DATA, verbatim per skill: name, team,
 * shape tag and lifecycle. 47 entries because 47 are tagged to a shape —
 * the same derivation the counts on MAP_GROUPS carry, and the registry
 * test asserts each group's `count` equals its skill-list length here, so
 * the two can never drift apart.
 *
 * `summary` is the ONE field that is not verbatim (ADR-056 U14). U13 held
 * per-skill body copy back as "internal workflow detail"; the owner
 * reversed that when the plate became a map plus a dossier, because a
 * clickable map that answers with a team name and a status is a worse
 * plate than the tab strip it replaced. Each line is REWRITTEN from the
 * source card so that what survives is what the Skill DOES.
 *
 * What still does NOT come across: per-skill OWNERS (client staff names,
 * caught by the registry test's owner-pair guard), version markers,
 * workshop dates, the internal vendor stack a Skill happens to read from,
 * and the four untagged registry cards (the suppressed 51-card
 * denominator — see NUMBERS at the top of this file). Tool CODENAMES do
 * travel: they are in scope for a case study (rules/proof.md).
 */
const LOOP_SKILLS: readonly CaseSkillEntry[] = [
  // Judgment — 12
  {
    id: "nda-pre-check",
    name: "NDA Pre-Check",
    short: "NDA Pre-Check",
    flagship: true,
    team: "Legal",
    engine: "Judgment",
    status: "In build",
    summary:
      "Clause-by-clause review encoded. Routine deviations get caught and handled, novel ones route to Legal. Four more pre-checks build on its shape.",
  },
  {
    id: "legal-risk-methodology",
    name: "Legal Risk Methodology",
    short: "Legal Risk",
    team: "Legal",
    engine: "Judgment",
    status: "In build",
    summary:
      "Loop's risk methodology as substrate, starting with AI and data privacy. The engine every Legal pre-check calls into.",
  },
  {
    id: "spa-pre-check",
    name: "SPA Pre-Check",
    short: "SPA Pre-Check",
    team: "Legal",
    engine: "Judgment",
    status: "Scoped",
    summary: "The NDA pre-check's judgment shape, applied to shareholder purchase agreements.",
  },
  {
    id: "product-ideation",
    name: "Product Ideation",
    short: "Ideation",
    team: "Product Management",
    engine: "Judgment",
    status: "In build",
    summary:
      "Pressure-tests a raw idea against the portfolio, the mission, the value spaces and the roadmap before anyone builds a case for it.",
  },
  {
    id: "risk-management",
    name: "Risk Management",
    short: "Risk Mgmt",
    team: "Program Management & Product",
    engine: "Judgment",
    status: "In build",
    summary:
      "Standardises how a risk gets described, finds the gaps, and surfaces the reasoning behind a decision rather than only its outcome.",
  },
  {
    id: "brr-generator",
    name: "BRR Generator",
    short: "BRR Generator",
    team: "Product Engineering",
    engine: "Judgment",
    status: "In use",
    summary:
      "Turns intake into a business requirements review on the engineering team's own standard template.",
  },
  {
    id: "onboarding-pops-processes",
    name: "Onboarding & POps Processes",
    short: "Onboarding",
    team: "People Ops",
    engine: "Judgment",
    status: "In build",
    summary:
      "Encodes how People Ops reasons about edge cases, not just the happy path. Reasoning first, automation second.",
  },
  {
    id: "partnership-inbox-filter",
    name: "Partnership Inbox Filter",
    short: "Partner Inbox",
    team: "Brand & Partnerships",
    engine: "Judgment",
    status: "In build",
    summary:
      "Classifies an inbound partnership request by tier and drafts the response that tier warrants, with its reasoning attached.",
  },
  {
    id: "cost-feasibility-portfolio",
    name: "Cost / Feasibility / Portfolio",
    /* ⚠ NOT "Cost / Feas" — that is where a clip lands, not where a person
       stops. The three-way name has no natural head, so the label takes the
       middle term, which is the one the triage is actually about. */
    short: "Feasibility",
    team: "Manufacturing Programs",
    engine: "Judgment",
    status: "In build",
    summary:
      "Manufacturing-side triage on cost, feasibility and portfolio fit. Shares its judgment engine with the design-side checks.",
  },
  {
    id: "ux-foundations-evaluation",
    name: "UX Foundations Evaluation",
    short: "UX Founds",
    team: "Product Design & UX",
    engine: "Judgment",
    status: "In build",
    summary:
      "Reads a concept and returns its alignment against Loop's six UX pillars, naming what fails rather than scoring it out of ten.",
  },
  {
    id: "concept-triage-engine",
    name: "Concept Triage Engine",
    short: "Concept Triage",
    team: "Product Design & UX",
    engine: "Judgment",
    status: "In build",
    summary:
      "Three checks on one engine: cost, feasibility, portfolio fit. Four design questions answered as a single architectural move.",
  },
  {
    id: "loop-creative-strategy",
    name: "Loop Creative Strategy",
    short: "Creative Strat",
    team: "Performance",
    engine: "Judgment",
    status: "In use",
    summary:
      "The creative-strategy substrate: desire axes, awareness stage and transformation arc, applied to every review, ad and brief. Mímir composes off it.",
  },
  // Voice — 7
  {
    id: "employer-branding-tov",
    name: "Employer Branding TOV",
    short: "Employer TOV",
    team: "Talent Acquisition",
    engine: "Voice",
    status: "In build",
    summary:
      "Employer-facing tone for job posts, outreach and candidate comms. Pairs with the internal People voice on the other side of the door.",
  },
  {
    id: "people-team-voice",
    name: "People-team Voice",
    short: "People-team",
    team: "People Ops",
    engine: "Voice",
    status: "In use",
    summary:
      "The internal register, encoded from the team's own tone-of-voice doc. Playbook pages first, then emails and decks.",
  },
  {
    id: "founder-tone-of-voice",
    name: "Founder Tone of Voice",
    short: "Founder TOV",
    flagship: true,
    team: "Brand & Partnerships",
    engine: "Voice",
    status: "In use",
    summary:
      "The founder's voice encoded, used for stage prep and for ongoing founder-led communication.",
  },
  {
    id: "paid-social-tov",
    name: "Paid Social TOV",
    short: "Paid Soc TOV",
    team: "Brand & Partnerships",
    engine: "Voice",
    status: "In build",
    summary:
      "Paid-social copy rules encoded, so a campaign draft arrives on-brand and human review starts from something real.",
  },
  {
    id: "loop-paid-social",
    name: "Loop Paid Social",
    short: "Paid Social",
    team: "Studio",
    engine: "Voice",
    status: "In use",
    summary:
      "Grounded in the real ad archive across every product, angle, season and collab. Writes primary text, headlines and descriptions in Loop's voice.",
  },
  {
    id: "loop-crm",
    name: "Loop CRM",
    short: "Loop CRM",
    team: "Studio",
    engine: "Voice",
    status: "Shipped",
    summary:
      "Lifecycle communication end to end: onboarding, retention, escalation, win-back, loyalty, with the privacy guardrails encoded in, not bolted on.",
  },
  {
    id: "loop-marketplace",
    name: "Loop Marketplace",
    short: "Marketplace",
    team: "Studio",
    engine: "Voice",
    status: "Shipped",
    summary:
      "Amazon listing copy: titles, SEO descriptions, bullets, A+ modules, image text. Adapts the base copy for collabs, bundles and new colourways.",
  },
  // Validation — 9
  {
    id: "tracker-compliance-checker",
    name: "Tracker Compliance Checker",
    short: "Tracker Check",
    team: "Legal",
    engine: "Validation",
    status: "In use",
    summary:
      "Drives a browser across the Loop webshops every week and reports every consent violation it finds, checked against policy.",
  },
  {
    id: "interview-debrief",
    name: "Interview Debrief",
    short: "Debrief",
    team: "Talent Acquisition",
    engine: "Validation",
    status: "Scoped",
    summary:
      "Turns panel notes into a debrief scored against Loop's hiring bars. A fixed rubric, which is what makes it a validation shape.",
  },
  {
    id: "gl-reconciliations",
    name: "GL Reconciliations",
    /* "GL Recon" is what Finance says out loud, but written down it is
       indistinguishable from a clip — and the reader of this drawing is not
       in Finance. */
    short: "GL Reconcile",
    team: "Finance & Accounting",
    engine: "Validation",
    status: "In build",
    summary:
      "Takes the ledger extract through its reconciliation checks and flags the anomalies for a human to judge.",
  },
  {
    id: "belgian-vat-return",
    name: "Belgian VAT Return",
    short: "VAT Return",
    team: "Finance & Accounting",
    engine: "Validation",
    status: "Scoped",
    summary:
      "Turns the ledger extract into the VAT return, replacing the manual spreadsheet lookups the boxes used to need.",
  },
  {
    id: "quality-auditor",
    name: "Quality Auditor",
    short: "Quality",
    flagship: true,
    team: "Warehousing & Customer Ops",
    engine: "Validation",
    status: "In use",
    summary:
      "Scores support tickets against the team's own scorecard, compares AI answers to human ones, and reports the outliers.",
  },
  {
    id: "fraud-detection",
    name: "Fraud Detection",
    short: "Fraud",
    team: "Warehousing & Customer Ops",
    engine: "Validation",
    status: "In build",
    summary:
      "Pattern analysis over orders: odd addresses, bot activity, suspicious refunds. The output is a flag list, not a verdict.",
  },
  {
    id: "invoice-processor",
    name: "Invoice Processor",
    short: "Invoices",
    team: "Warehousing & Customer Ops",
    engine: "Validation",
    status: "In use",
    summary:
      "Reads supplier invoices across every template, cross-checks them against the vendor master, POs and prior invoices, and catches scam patterns.",
  },
  {
    id: "supplier-qa-audit",
    name: "Supplier QA Audit",
    short: "Supplier QA",
    team: "Manufacturing Programs",
    engine: "Validation",
    status: "Scoped",
    summary:
      "Scores supplier quality reports against Loop's bars, alongside the warehousing team's own quality work.",
  },
  {
    id: "localization",
    name: "Localization",
    short: "Localization",
    team: "Studio",
    engine: "Validation",
    status: "In build",
    summary:
      "Checks locale copy against the approved translations, so a market launch never ships a sentence nobody signed off.",
  },
  // Stakeholder — 5
  {
    id: "candidate-screening-brief",
    name: "Candidate Screening Brief",
    short: "Screening",
    team: "Talent Acquisition",
    engine: "Stakeholder",
    status: "Scoped",
    summary:
      "Structures intake notes into one screening brief a hiring manager can read in a single pass.",
  },
  {
    id: "program-status-updates",
    name: "Program Status Updates",
    short: "PRG Status",
    flagship: true,
    team: "Program Management & Product",
    engine: "Stakeholder",
    status: "In build",
    summary:
      "Reads transcripts, checks the risk board, reviews the roadmap, and drafts the cross-team status digest from all three.",
  },
  {
    id: "market-scan-brief",
    name: "Market Scan Brief",
    short: "Market Scan",
    team: "Strategic Insights",
    engine: "Stakeholder",
    status: "In build",
    summary:
      "Structures competitive and category signals into a standing brief the insights team refreshes weekly.",
  },
  {
    id: "survey-synthesis",
    name: "Survey Synthesis",
    short: "Survey",
    team: "Strategic Insights",
    engine: "Stakeholder",
    status: "Scoped",
    summary:
      "Turns raw survey exports into themed readouts, each carrying quoted evidence and a note on how confident it is.",
  },
  {
    id: "feedback-summarizer",
    name: "Feedback Summarizer",
    short: "Feedback",
    team: "Studio",
    engine: "Stakeholder",
    status: "In use",
    summary:
      "Turns a sprawling creative feedback thread into a structured summary stakeholders can act on without re-reading it.",
  },
  // Pattern — 14
  {
    id: "variance-commentary",
    name: "Variance Commentary",
    short: "Variance",
    flagship: true,
    team: "Finance & Accounting",
    engine: "Pattern",
    status: "In use",
    summary:
      "Month-end variance templates encoded. It drafts the commentary and Finance reviews it, and it sounds like the person who used to write it.",
  },
  {
    id: "mec-tracker",
    name: "MEC Tracker",
    short: "MEC Tracker",
    team: "Finance & Accounting",
    engine: "Pattern",
    status: "In use",
    summary:
      "The month-end close carried forward as a live project: it surfaces blockers as they appear and drafts the status note.",
  },
  {
    id: "vsme-sustainability-reporting",
    name: "VSME Sustainability Reporting",
    short: "VSME Reporting",
    team: "Program Management & Product",
    engine: "Pattern",
    status: "Scoped",
    summary:
      "Structured inputs into the voluntary SME reporting template. Credible disclosures without a dedicated reporting function.",
  },
  {
    id: "daily-brief",
    name: "Daily Brief",
    short: "Daily Brief",
    team: "Product Engineering",
    engine: "Pattern",
    status: "In use",
    summary:
      "Pulls mail, transcripts and boards into one morning brief for engineering. The multi-source briefing pattern other teams now reuse.",
  },
  {
    id: "dashboard-consolidation",
    name: "Dashboard Consolidation",
    short: "Dashboards",
    team: "Warehousing & Customer Ops",
    engine: "Pattern",
    status: "In use",
    summary:
      "Harmonises two analytics sources into a single exec-ready readout, on the same briefing pattern.",
  },
  {
    id: "sop-generator",
    name: "SOP Generator",
    short: "SOP Generator",
    team: "People Ops",
    engine: "Pattern",
    status: "In build",
    summary:
      "Reverse-engineered from Loop's good SOPs: it asks the question flow that elicits a complete one, then drafts it for review.",
  },
  {
    id: "360-marketing-agent",
    name: "360 Marketing Agent",
    short: "360 Marketing",
    team: "Brand & Partnerships",
    engine: "Pattern",
    status: "In build",
    summary:
      "A marketing assistant lifted out of one person's private chatbot into a shared Skill that can be versioned and used across teams.",
  },
  {
    id: "trend-scraper",
    name: "Trend Scraper",
    short: "Trends",
    team: "Strategic Insights",
    engine: "Pattern",
    status: "In build",
    summary:
      "Pulls external trend signals into a digest the team routes on into its briefing and calendar work.",
  },
  {
    id: "lead-time-calculator",
    name: "Lead Time Calculator",
    short: "Lead Time",
    team: "Manufacturing Programs",
    engine: "Pattern",
    status: "In use",
    summary:
      "Encodes lead-time rules across suppliers and lanes, so programme dates stay honest in a planning conversation.",
  },
  {
    id: "cmf-file-generator",
    name: "CMF File Generator",
    short: "CMF Files",
    team: "Product Design & UX",
    engine: "Pattern",
    status: "In use",
    summary:
      "Workbook in, manufacturer-ready colour-material-finish PDF with renders out. Wired into Vesper end to end.",
  },
  {
    id: "loop-packaging-system",
    name: "Loop Packaging System",
    short: "Packaging",
    team: "Product Design & UX",
    engine: "Pattern",
    status: "In use",
    summary:
      "Artwork and workbook in, supplier-ready PDFs with info-box overlays and the creative intent brief out. Promotes the whole folder EVT to MP.",
  },
  {
    id: "product-review-analysis",
    name: "Product Review Analysis",
    short: "Reviews",
    team: "Product Design & UX",
    engine: "Pattern",
    status: "In build",
    summary:
      "Scrapes and structures marketplace reviews, surfacing themes and request patterns across markets.",
  },
  {
    id: "asset-brief-generator",
    name: "Asset Brief Generator",
    short: "Asset Briefs",
    team: "Studio",
    engine: "Pattern",
    status: "In build",
    summary:
      "Drafts a studio brief from campaign inputs, so a producer starts from a complete spec instead of a blank document.",
  },
  {
    id: "genai-prompting",
    name: "GenAI Prompting",
    short: "GenAI",
    team: "Studio",
    engine: "Pattern",
    status: "In use",
    summary:
      "How Loop gets useful work out of AI image and video tools: which models want a story, which want keywords, and how one idea becomes a slate.",
  },
];

/**
 * THE MAP'S RECORD (ADR-062) — five shapes, eight districts, 27 work streams.
 *
 * Everything the three sheets draw comes from these three arrays. Nothing is
 * hard-coded in geometry except the district grid, and every published total
 * is DERIVED (`lib/.../mapProjection.ts`): 27 modules, 24 configured, 3
 * person-led, 47 Skills, the tap counts, and the 19-of-24 reuse figure. The
 * prototype hard-coded three of those; a hard-coded total is a number that
 * goes stale the first time a row is edited.
 *
 * PROVENANCE. Districts are Loop's own department structure; work streams are
 * an abstraction over shipped Skills and Tools. This is a dated public
 * abstraction stamped `NORMALISED SIGNAL / ILLUSTRATIVE RECORD` on the
 * surface, not live telemetry — see ADR-062 and `.claude/rules/proof.md`.
 *
 * ⚠ DISTRICTS ARE NOT TEAMS. Eight districts are DEPARTMENTS, the
 * organisational structure the work sits in. They are a different unit from
 * both published team counts — 22 teams BRIEFED and 14 teams USING THE LAYER
 * — and no copy may lend one number another's meaning. Pinned by
 * `cases-registry.test.ts`.
 *
 * CASE. Stored in the case module's sentence case; the drawing uppercases in
 * CSS. Storing shouted strings would bake one design's typography into the
 * content, which is what `MAP_GROUPS` above already avoids.
 *
 * `evalMethod` says what "good" is tested against on this shape. The gloss
 * already answers what the shape MEANS, and the two are deliberately
 * different registers: the gloss is the definition a reader needs, the method
 * is the thing that makes a substrate inheritable — a second team takes the
 * method without taking anyone's judgment. ⚠ It is GENERIC by the map's
 * envelope: a method, never a tool, a vendor, a threshold or a score. And
 * ⚠ it is scanned by `cases-registry` like every other lettered string —
 * a record field outside that scan is how `8 TEAMS` reached the public page.
 */
const MAP_SHAPES: readonly CaseMapShape[] = [
  {
    key: "voice",
    label: "Voice",
    skills: 7,
    first: "W-017",
    gloss: "How the organisation sounds in context",
    evalMethod: "Side-by-side review",
    meaning: "How the organisation sounds when it speaks, held steady across readers.",
  },
  {
    key: "judgment",
    label: "Judgment",
    skills: 12,
    first: "W-004",
    gloss: "What good means under ambiguity",
    evalMethod: "Rubric-graded cases",
    meaning: "What good means when the inputs vary and the answer is not obvious.",
  },
  {
    key: "validation",
    label: "Validation",
    skills: 9,
    first: "W-011",
    gloss: "Cases that make failure visible",
    evalMethod: "Known-failure fixtures",
    meaning: "The bar output is checked against, and the cases that make a failure visible.",
  },
  {
    key: "stakeholder",
    label: "Stakeholder",
    skills: 5,
    first: "W-046",
    gloss: "Framing for a specific reader",
    evalMethod: "Reader sign-off",
    meaning: "Who the work is for, and the framing that reader needs to act on it.",
  },
  {
    key: "pattern",
    label: "Pattern",
    skills: 14,
    first: "W-041",
    gloss: "Recurring shapes / structured output",
    evalMethod: "Reference outputs",
    meaning:
      "The shapes the work keeps returning to, so output arrives structured rather than improvised.",
  },
];

/* Board order. The grid seats four columns × two rows, so the eight are also
   the board's painting order once sorted far-to-near by (a + b). */
const MAP_DISTRICTS: readonly CaseMapDistrict[] = [
  { id: "CRE", name: "Creative + Studio", ab: "Creative" },
  { id: "ECM", name: "Ecomm + Marketplace", ab: "Ecomm" },
  { id: "LEG", name: "Legal + Risk", ab: "Legal" },
  { id: "FIN", name: "Finance", ab: "Finance" },
  { id: "DES", name: "Product Design", ab: "Design" },
  { id: "ENG", name: "Engineering", ab: "Engineering" },
  { id: "PRG", name: "Programs + People", ab: "Programs" },
  { id: "OPS", name: "Operations", ab: "Ops" },
];

/**
 * The 27 modules. Six chip slots per district plate is the geometric ceiling
 * — Creative's five is the current worst case, and a seventh row would fall
 * off its plate rather than clip, so the registry test guards it.
 *
 * `lane: null` is person-led work and carries `cfg: null`. Three of the 27
 * stay that way on purpose: concept ideation, the board narrative and
 * supplier terms. A map that only showed configured work would show what was
 * built and hide what was not, and the negative space is what leadership
 * reads.
 */
const MAP_WORKS: readonly CaseMapWork[] = [
  /* ── Creative + Studio ────────────────────────────────────────────── */
  {
    id: "W-017",
    title: "Campaign copy",
    dist: "CRE",
    lane: "Everyday",
    shapes: ["judgment", "voice", "validation"],
    seat: "ABOVE",
    vol: "HIGH",
    mass: 4,
    bar: "On-brand / claim-safe / channel-ready",
    evals: "Accepted examples + edge cases",
    cfg: {
      p: ["Creative lead", "Sets the bar / owns final taste"],
      /* ⚠ SUBSTRATE JOIN. `loop-paid-social` (Paid Social, Voice) is the
         encoded voice this stream draws on — flag for owner review: chip
         letters PAID SOCIAL where reading 02 used to say BRAND VOICE. */
      skillId: "loop-paid-social",
      s: ["Brand voice", "Voice rules · claim gates · rejected examples"],
      m: ["Everyday lane", "Generate / critique / revise"],
      a: "Briefing agent",
      c: ["Campaign brief", "Channel / audience / offer"],
      g: ["Product + claim facts", "Approved claims, SKU attributes"],
      k: ["Claims registry", "Briefing board"],
      u: ["Chat + brief tool"],
      o: "Creative lead",
      why: "High volume, bounded stakes. The Skill carries the judgment, so the lane only has to write.",
    },
  },
  {
    id: "W-021",
    title: "Creative briefing",
    dist: "CRE",
    lane: "Deep",
    shapes: ["judgment", "pattern", "stakeholder"],
    seat: "ABOVE",
    vol: "MID",
    mass: 4,
    bar: "A brief the team can build from",
    evals: "Briefs that shipped + briefs that stalled",
    cfg: {
      p: ["Strategy lead", "Owns the angle"],
      /* Flag: chip letters ASSET BRIEFS where reading 02 used to say
         BRIEFING INTELLIGENCE. Same pattern (a brief the team can build from
         a complete spec), narrower scope. */
      skillId: "asset-brief-generator",
      s: ["Briefing intelligence", "Signal priority · brief shape · stall cases"],
      m: ["Deep lane", "Synthesise / contrast"],
      a: "Briefing agent",
      c: ["Insight corpus", "Reviews / performance / competitors"],
      g: ["Campaign + audience facts", "Past campaigns, segments, results"],
      k: ["Insight store", "Ad library"],
      u: ["Brief tool"],
      o: "Strategy lead",
      why: "Synthesis across unlike sources. A lighter lane flattens the contrast that makes a brief useful.",
    },
  },
  {
    id: "W-029",
    title: "Asset declination",
    dist: "CRE",
    lane: "Fast",
    shapes: ["pattern", "validation"],
    seat: "EDGE",
    vol: "HIGH",
    mass: 1,
    bar: "Every format correct at first export",
    evals: "Format cases + crop failures",
    cfg: {
      p: ["Studio designer", "Handles exceptions"],
      /* Flag: no direct "format system" skill exists; the nearest pattern
         match is `genai-prompting` (a slate-from-one-idea pattern the studio
         already runs). Chip letters GENAI instead of FORMAT SYSTEM. */
      skillId: "genai-prompting",
      s: ["Format system", "Format matrix · safe areas · rejected exports"],
      m: ["Fast lane", "Match / flag / resize"],
      a: "Editor plugin",
      c: ["Master artwork", "Grids and safe areas"],
      g: ["Asset + channel facts", "Spec per placement"],
      k: ["Design file API", "Asset store"],
      u: ["Design tool plugin"],
      o: "Studio lead",
      why: "Verifiable output at volume. A heavier lane buys nothing a check cannot already catch.",
    },
  },
  {
    id: "W-034",
    title: "Brand voice QA",
    dist: "CRE",
    lane: "Everyday",
    shapes: ["voice", "validation"],
    seat: "EDGE",
    vol: "MID",
    mass: 2,
    bar: "Off-voice copy caught before release",
    evals: "Voice passes + known drifts",
    cfg: {
      p: ["Brand editor", "Owns the standard"],
      /* `founder-tone-of-voice` is Voice's flagship — the substrate every
         Loop voice QA hangs off. Chip letters FOUNDER TOV. */
      skillId: "founder-tone-of-voice",
      s: ["Brand voice", "Tone tests · drift markers · scored cases"],
      m: ["Everyday lane", "Score / explain"],
      a: "Chat assistant",
      c: ["Voice corpus", "Approved and rejected copy"],
      g: ["Claim + term facts", "Banned terms, trademarks"],
      k: ["Copy registry"],
      u: ["Chat + review queue"],
      o: "Brand editor",
      why: "A bounded check against an encoded standard. The standard does the work, not the lane.",
    },
  },
  {
    id: "W-040",
    title: "Concept ideation",
    dist: "CRE",
    lane: null,
    shapes: ["judgment", "voice"],
    seat: "PERSON",
    vol: "LOW",
    mass: 0,
    bar: "An idea the room has not had yet",
    evals: "Not encoded / live judgment",
    cfg: null,
  },

  /* ── Ecomm + Marketplace ──────────────────────────────────────────── */
  {
    id: "W-051",
    title: "Listing build",
    dist: "ECM",
    lane: "Everyday",
    shapes: ["pattern", "voice", "validation"],
    seat: "EDGE",
    vol: "HIGH",
    mass: 2,
    bar: "Complete, compliant, searchable",
    evals: "Live listings + rejections",
    cfg: {
      p: ["Marketplace lead", "Owns the listing"],
      /* `loop-marketplace` is the Amazon listing skill — same substrate as
         W-056 Marketplace SEO. Chip letters MARKETPLACE. */
      skillId: "loop-marketplace",
      s: ["Listing system", "Field rules · term bank · rejection cases"],
      m: ["Everyday lane", "Draft / check / fill"],
      a: "Chat assistant",
      c: ["Product record", "Specs / claims / assets"],
      g: ["Product master", "SKU tree, variants, markets"],
      k: ["Catalogue API", "Seller console"],
      u: ["Listing console"],
      o: "Marketplace lead",
      why: "Structured output against a known schema, at volume. Stable work belongs off the frontier.",
    },
  },
  {
    id: "W-056",
    title: "Marketplace SEO",
    dist: "ECM",
    lane: "Everyday",
    shapes: ["pattern", "voice"],
    seat: "EDGE",
    vol: "MID",
    mass: 2,
    bar: "Ranks without reading like a robot",
    evals: "Ranked pages + penalised phrasing",
    cfg: {
      p: ["SEO specialist", "Owns the keyword call"],
      /* `loop-marketplace` reuses W-051's substrate — the encoded listing
         voice IS the SEO substrate here. Chip letters MARKETPLACE. */
      skillId: "loop-marketplace",
      s: ["SEO system", "Term weighting · banned phrasing · ranked cases"],
      m: ["Everyday lane", "Expand / rank / rewrite"],
      a: "Chat assistant",
      c: ["Search corpus", "Queries and competitor pages"],
      g: ["Product + market facts", "Category tree per market"],
      k: ["Search data API"],
      u: ["Listing console"],
      o: "SEO specialist",
      why: "Repeated pattern work with a measurable outcome. The encoded term bank is the asset.",
    },
  },
  {
    id: "W-062",
    title: "Ad variant sets",
    dist: "ECM",
    lane: "Fast",
    shapes: ["pattern", "voice"],
    seat: "ABOVE",
    vol: "HIGH",
    mass: 1,
    bar: "Genuinely different, not reworded",
    evals: "Sets that diverged + sets that collapsed",
    cfg: {
      p: ["Performance lead", "Picks what runs"],
      /* `genai-prompting` reuses W-029's substrate — the same "slate from
         one idea" pattern that publishes divergent creative sets. Chip
         letters GENAI where reading 02 used to say VARIANT SYSTEM. */
      skillId: "genai-prompting",
      s: ["Variant system", "Angle spread · collapse tests · divergent sets"],
      m: ["Fast lane", "Diverge / draft"],
      a: "Image + video suite",
      c: ["Winning creative", "Past performance"],
      g: ["Campaign facts", "Placements and results"],
      k: ["Ad library", "Briefing board"],
      u: ["Chat + ad tool"],
      o: "Performance lead",
      why: "High-volume generation under a diversity test the Skill enforces. Light mass per run.",
    },
  },
  {
    id: "W-068",
    title: "Account health",
    dist: "ECM",
    lane: "Fast",
    shapes: ["validation", "pattern"],
    seat: "EDGE",
    vol: "HIGH",
    mass: 1,
    bar: "Nothing breaks quietly",
    evals: "Alerts that mattered + false alarms",
    cfg: {
      p: ["Marketplace lead", "Owns escalation"],
      /* Flag: no direct "health watch" skill; `fraud-detection` is the
         closest validation match (pattern analysis over orders and account
         signals, thresholds, false positives). Chip letters FRAUD where
         reading 02 used to say HEALTH WATCH. */
      skillId: "fraud-detection",
      s: ["Health watch", "Thresholds · escalation logic · false alarms"],
      m: ["Fast lane", "Watch / flag / explain"],
      a: "Scheduled agent",
      c: ["Account history", "Metrics and policy notices"],
      g: ["Account facts", "Policy state per marketplace"],
      k: ["Marketplace API", "Alert channel"],
      u: ["Scheduled agent"],
      o: "Marketplace lead",
      why: "Deterministic monitoring against an encoded threshold. The cheapest lane that clears the bar.",
    },
  },

  /* ── Legal + Risk ─────────────────────────────────────────────────── */
  {
    id: "W-004",
    title: "NDA review",
    dist: "LEG",
    lane: "Deep",
    shapes: ["judgment", "pattern", "validation"],
    seat: "INSIDE",
    vol: "LOW",
    mass: 5,
    bar: "Nuanced risk review / escalate non-standard",
    evals: "Clause cases + unacceptable failures",
    cfg: {
      p: ["Legal reviewer", "Owns consequential judgment"],
      /* `nda-pre-check` is Judgment's flagship — exact match, this is the
         stream that trenched the main. */
      skillId: "nda-pre-check",
      s: ["NDA pre-check", "Clause policy · escalation triggers · never-accept cases"],
      m: ["Deep lane", "Clause reasoning / contradictions"],
      a: "Chat assistant",
      c: ["Legal corpus", "Playbook and precedent"],
      g: ["Counterparty facts", "Entities, prior agreements"],
      k: ["Document store", "Redline tool"],
      u: ["Chat + review queue"],
      o: "General counsel",
      why: "Low volume, consequential calls. Clause reasoning fails quietly on lighter lanes.",
    },
  },
  {
    id: "W-009",
    title: "Contract redline",
    dist: "LEG",
    lane: "Deep",
    shapes: ["judgment", "pattern"],
    seat: "INSIDE",
    vol: "LOW",
    mass: 5,
    bar: "Positions held, deviations named",
    evals: "Redlines accepted + overruled",
    cfg: {
      p: ["Legal reviewer", "Signs the position"],
      /* Flag: no direct "redline playbook" skill; `legal-risk-methodology`
         is the Legal judgment substrate every pre-check calls into. Chip
         letters LEGAL RISK. */
      skillId: "legal-risk-methodology",
      s: ["Redline playbook", "Fallback ladder · red lines · overruled cases"],
      m: ["Deep lane", "Compare / propose"],
      a: "Chat assistant",
      c: ["Contract library", "Standard terms"],
      g: ["Counterparty facts", "Entity graph, obligations"],
      k: ["Document store", "Clause diff"],
      u: ["Review queue"],
      o: "General counsel",
      why: "Negotiation logic across long documents. The lane must hold a whole contract in view.",
    },
  },
  {
    id: "W-014",
    title: "Compliance sweep",
    dist: "LEG",
    lane: "Fast",
    shapes: ["validation", "pattern"],
    seat: "EDGE",
    vol: "HIGH",
    mass: 1,
    bar: "A clean, dated, repeatable record",
    evals: "Known violations + false positives",
    cfg: {
      p: ["Privacy lead", "Owns the finding"],
      /* `tracker-compliance-checker` is the exact skill — a browser sweep
         reporting consent violations against policy. Chip letters TRACKER
         CHECK. */
      skillId: "tracker-compliance-checker",
      s: ["Compliance checker", "Consent rules · tracker classes · false positives"],
      m: ["Fast lane", "Sweep / diff / report"],
      a: "Scheduled agent",
      c: ["Policy set", "Consent policy and vendor list"],
      g: ["Vendor + region facts", "Processors, legal bases"],
      k: ["Site crawler", "Report channel"],
      u: ["Scheduled agent"],
      o: "Privacy lead",
      why: "Mechanical, verifiable, weekly. The checking is encoded, so the lane stays light.",
    },
  },

  /* ── Finance ──────────────────────────────────────────────────────── */
  {
    id: "W-041",
    title: "Ledger control",
    dist: "FIN",
    lane: "Fast",
    shapes: ["pattern", "validation"],
    seat: "EDGE",
    vol: "HIGH",
    mass: 1,
    bar: "Surface anomalies / keep a traceable path",
    evals: "Matches + exceptions + false positives",
    cfg: {
      p: ["Finance reviewer", "Owns exceptions"],
      /* `gl-reconciliations` is the ledger-side validation substrate. Chip
         letters GL RECONCILE. */
      skillId: "gl-reconciliations",
      s: ["Ledger control", "Matching logic · anomaly patterns · false positives"],
      m: ["Fast lane", "Match / flag / explain"],
      a: "Scheduled agent",
      c: ["Entry history", "Entries and counterparties"],
      g: ["Vendor + entity facts", "Supplier master, cost centres"],
      k: ["Accounting API", "Bank feed"],
      u: ["Scheduled agent"],
      o: "Finance lead",
      why: "High volume, verifiable output. A heavier lane would buy nothing here.",
    },
  },
  {
    id: "W-045",
    title: "Invoice matching",
    dist: "FIN",
    lane: "Fast",
    /* ⚠ +VALIDATION (ADR-071): matching invoices against PO and vendor master
       IS validation work — the encoded tolerances are what remove the
       judgment from the run. Added so `invoice-processor`'s substrate
       (Validation) resolves against this stream's shapes. */
    shapes: ["pattern", "validation"],
    seat: "EDGE",
    vol: "HIGH",
    mass: 1,
    bar: "Every line reconciled or named",
    evals: "Matched sets + unresolvable cases",
    cfg: {
      p: ["Finance analyst", "Resolves the remainder"],
      /* `invoice-processor` is the exact substrate — reads templates,
         cross-checks against vendor master and POs. Chip letters INVOICES. */
      skillId: "invoice-processor",
      s: ["Reconciliation", "Match rules · tolerances · unresolvable cases"],
      m: ["Fast lane", "Match / reconcile"],
      a: "Scheduled agent",
      c: ["Export history", "Statements and invoices"],
      g: ["Vendor facts", "Aliases, payment terms"],
      k: ["Accounting API", "Mailbox"],
      u: ["Scheduled agent"],
      o: "Finance lead",
      why: "Deterministic work at scale. Encoded tolerances remove the judgment from the run.",
    },
  },
  {
    id: "W-049",
    title: "Spend forecast",
    dist: "FIN",
    lane: "Deep",
    /* ⚠ +PATTERN (ADR-071): variance analysis IS pattern work — recurring
       month-shape templates whose structured outputs are what makes a
       forecast comparable. `variance-commentary` (Pattern's flagship for
       Finance) resolves against this. */
    shapes: ["judgment", "stakeholder", "validation", "pattern"],
    seat: "ABOVE",
    vol: "LOW",
    mass: 4,
    bar: "A number leadership can act on",
    evals: "Forecasts against what landed",
    cfg: {
      p: ["Finance lead", "Owns the call"],
      /* Flag: no direct "forecast method" skill; `variance-commentary` is
         the substrate closest to Finance forecasting narrative work (the
         encoded month-end variance templates). Chip letters VARIANCE. */
      skillId: "variance-commentary",
      s: ["Forecast method", "Driver definitions · scenario rules · variance cases"],
      m: ["Deep lane", "Model / explain"],
      a: "Chat assistant",
      c: ["Actuals", "History and commitments"],
      g: ["Entity + commitment facts", "Contracts, headcount, run rate"],
      k: ["Finance warehouse"],
      u: ["Chat + board report"],
      o: "Finance lead",
      why: "Reasoning over uncertain drivers. The explanation matters as much as the number.",
    },
  },

  /* ── Product Design ───────────────────────────────────────────────── */
  {
    id: "W-011",
    title: "Packaging system",
    dist: "DES",
    lane: "Everyday",
    shapes: ["judgment", "validation", "pattern"],
    seat: "EDGE",
    vol: "MID",
    mass: 2,
    bar: "Claim-safe / production-ready",
    evals: "Packs + production edge cases",
    cfg: {
      p: ["Design reviewer", "Handles exceptions"],
      /* `loop-packaging-system` is the exact skill — this stream trenched
         Validation. Chip letters PACKAGING. */
      skillId: "loop-packaging-system",
      s: ["Packaging system", "Claim + format rules · process · accept/reject packs"],
      m: ["Everyday lane", "Bounded checks"],
      a: "Editor plugin",
      c: ["Source files", "Production rules"],
      g: ["SKU + market facts", "Mandatory marks per region"],
      k: ["Design file API", "Claims registry"],
      u: ["Design tool plugin"],
      o: "Design lead",
      why: "Bounded checks against an encoded standard. Stable work moves off the frontier.",
    },
  },
  {
    id: "W-016",
    title: "Dieline review",
    dist: "DES",
    lane: "Everyday",
    shapes: ["validation", "pattern"],
    seat: "EDGE",
    vol: "MID",
    mass: 2,
    bar: "Nothing reaches print broken",
    evals: "Approved dielines + print failures",
    cfg: {
      p: ["Packaging engineer", "Owns print release"],
      /* `loop-packaging-system` reuses W-011's substrate — dielines are
         inside the packaging system's structure rules. Chip letters
         PACKAGING. Flag: chip may read as the reuse rather than the
         specific check. */
      skillId: "loop-packaging-system",
      s: ["Dieline check", "Structure rules · bleed logic · print failures"],
      m: ["Everyday lane", "Inspect / flag"],
      a: "Chat assistant",
      c: ["Structural library", "Dielines and materials"],
      g: ["Material facts", "Substrates, suppliers"],
      k: ["File check", "Supplier portal"],
      u: ["Review queue"],
      o: "Design lead",
      why: "Geometric verification against fixed rules. The check is encoded, the lane is cheap.",
    },
  },
  {
    id: "W-022",
    title: "CMF spec check",
    dist: "DES",
    lane: "Deep",
    /* ⚠ +PATTERN (ADR-071): CMF specs are a structured-output pattern —
       tolerance bands · finish tables · sample sheets — which is what
       `cmf-file-generator`'s Pattern engine encodes. Added so the substrate
       resolves against this stream's shapes. */
    shapes: ["judgment", "validation", "pattern"],
    seat: "INSIDE",
    vol: "LOW",
    mass: 4,
    bar: "Material calls the factory can hold",
    evals: "Specs that held + specs that drifted",
    cfg: {
      p: ["Industrial designer", "Owns the material call"],
      /* `cmf-file-generator` is the exact substrate — workbook in,
         manufacturer-ready CMF PDF with renders out. Chip letters CMF
         FILES. */
      skillId: "cmf-file-generator",
      s: ["CMF standard", "Tolerance bands · finish logic · drift cases"],
      m: ["Deep lane", "Compare / reason"],
      a: "Chat assistant",
      c: ["Material library", "Supplier specs and samples"],
      g: ["Supplier + material facts", "Capabilities, certifications"],
      k: ["Spec system", "Supplier portal"],
      u: ["Chat + spec tool"],
      o: "Design lead",
      why: "Physical consequence and subtle trade-offs. Worth a heavier lane per run.",
    },
  },

  /* ── Engineering ──────────────────────────────────────────────────── */
  {
    id: "W-026",
    title: "Release audit",
    dist: "ENG",
    lane: "Frontier",
    shapes: ["judgment", "pattern", "validation"],
    seat: "INSIDE",
    vol: "LOW",
    mass: 5,
    bar: "Surface release risk / trace the evidence",
    evals: "Known failures + release baselines",
    cfg: {
      p: ["Engineering reviewer", "Signs off / owns risk"],
      /* Flag: no direct "release audit" skill; `risk-management` is the
         Judgment substrate closest to surfacing release risk with
         traceable reasoning. Chip letters RISK MGMT. */
      skillId: "risk-management",
      s: ["Release audit", "Repo conventions · failure logic · release baselines"],
      m: ["Frontier lane", "Repo-scale reasoning"],
      a: "Coding agent",
      c: ["Repo + logs", "Hardware history and tests"],
      g: ["Component facts", "Bill of materials, revisions"],
      k: ["Code + test runner", "Issue tracker"],
      u: ["CLI + review queue"],
      o: "VP technology",
      why: "The newest and most consequential work runs on the strongest lane.",
    },
  },
  {
    id: "W-031",
    title: "Risk register",
    dist: "ENG",
    lane: "Deep",
    shapes: ["judgment", "validation"],
    seat: "INSIDE",
    vol: "LOW",
    mass: 4,
    bar: "Risks named before they arrive",
    evals: "Registered risks + missed ones",
    cfg: {
      p: ["Electronics lead", "Owns the register"],
      /* `risk-management` is the exact substrate. Chip letters RISK MGMT. */
      skillId: "risk-management",
      s: ["Risk method", "Severity logic · mitigation shapes · missed-risk cases"],
      m: ["Deep lane", "Assess / rank"],
      a: "Chat assistant",
      c: ["Test history", "Failures and field returns"],
      g: ["Component + supplier facts", "Lead times, failure rates"],
      k: ["Test systems", "Issue tracker"],
      u: ["Chat + register"],
      o: "VP technology",
      why: "Judgment under incomplete evidence. The lane has to reason, not retrieve.",
    },
  },
  {
    id: "W-037",
    title: "Weekly reporting",
    dist: "ENG",
    lane: "Fast",
    shapes: ["pattern", "stakeholder"],
    seat: "ABOVE",
    vol: "HIGH",
    mass: 1,
    bar: "Reliable readout / correct emphasis",
    evals: "Weekly cycles + known omissions",
    cfg: {
      p: ["Electronics lead", "Corrects emphasis"],
      /* `program-status-updates` (Stakeholder's flagship) is the encoded
         status-digest substrate — shared with W-046. Chip letters PRG
         STATUS. */
      skillId: "program-status-updates",
      s: ["Status digest", "Editorial priority · omission checks · reader framing"],
      m: ["Fast lane", "Summarise / structure"],
      a: "Scheduled agent",
      c: ["Project records", "Updates and test results"],
      g: ["Programme facts", "Milestones, owners"],
      k: ["Project board", "Chat channel"],
      u: ["Scheduled agent"],
      o: "Engineering lead",
      why: "A reliable readout, weekly. Encoded emphasis keeps it off heavier lanes.",
    },
  },

  /* ── Programs + People ────────────────────────────────────────────── */
  {
    id: "W-046",
    title: "Status digest",
    dist: "PRG",
    lane: "Fast",
    shapes: ["voice", "stakeholder", "pattern"],
    seat: "ABOVE",
    vol: "HIGH",
    mass: 1,
    bar: "One readout the exec team can act on",
    evals: "Weekly cycles + distortions",
    cfg: {
      p: ["Program lead", "Corrects emphasis"],
      /* `program-status-updates` trenched Stakeholder — this is the stream
         that opened it. Chip letters PRG STATUS. */
      skillId: "program-status-updates",
      s: ["Status digest", "Editorial priority · omission checks · reader framing"],
      m: ["Fast lane", "Summarise / structure"],
      a: "Scheduled agent",
      c: ["Project records", "Updates and decisions"],
      g: ["Programme facts", "Milestones, owners, dependencies"],
      k: ["Project board", "Chat channel"],
      u: ["Scheduled agent"],
      o: "Program director",
      why: "High volume, light mass. The Skill holds the emphasis, so the lane only has to structure.",
    },
  },
  {
    id: "W-052",
    title: "Candidate screening",
    dist: "PRG",
    lane: "Everyday",
    /* ⚠ +STAKEHOLDER (ADR-071): a candidate screening IS a brief framed for
       a specific reader (the hiring manager) — Stakeholder's own definition.
       Added so `candidate-screening-brief` (Stakeholder) resolves against
       this stream's shapes. */
    shapes: ["judgment", "pattern", "validation", "stakeholder"],
    seat: "INSIDE",
    vol: "MID",
    mass: 3,
    bar: "Consistent evidence / no unsupported inference",
    evals: "Role cases + fairness failures",
    cfg: {
      p: ["Talent reviewer", "Owns decision / fairness"],
      /* `candidate-screening-brief` is the exact substrate — intake notes
         into one screening brief the hiring manager can read in a single
         pass. Chip letters SCREENING. */
      skillId: "candidate-screening-brief",
      s: ["Screening brief", "Role criteria · evidence rules · fairness failures"],
      m: ["Everyday lane", "Evidence summarisation"],
      a: "Chat assistant",
      c: ["Role + evidence", "Application and interview"],
      g: ["Role + org facts", "Levels, team structure"],
      k: ["Applicant tracking", "Record store"],
      u: ["Review queue"],
      o: "People lead",
      why: "Summarisation under guardrails. The consequential call stays at the seat.",
    },
  },
  {
    id: "W-057",
    title: "Capacity planning",
    dist: "PRG",
    lane: "Deep",
    shapes: ["judgment", "stakeholder"],
    seat: "ABOVE",
    vol: "LOW",
    mass: 3,
    bar: "A plan the teams recognise as real",
    evals: "Plans that held + plans that slipped",
    cfg: {
      p: ["Program lead", "Owns the commitment"],
      /* Flag: no direct "capacity method" skill; `risk-management` is the
         Judgment substrate — capacity planning reasons about trade-offs
         under uncertainty. Chip letters RISK MGMT. */
      skillId: "risk-management",
      s: ["Capacity method", "Load rules · trade-off logic · slipped-plan cases"],
      m: ["Deep lane", "Model / explain"],
      a: "Chat assistant",
      c: ["Delivery history", "Throughput and commitments"],
      g: ["Org + programme facts", "Headcount, skills, allocations"],
      k: ["Project board", "People system"],
      u: ["Chat + planning board"],
      o: "Program director",
      why: "Trade-offs across competing claims. The lane has to argue, not just tabulate.",
    },
  },
  {
    id: "W-058",
    title: "Board narrative",
    dist: "PRG",
    lane: null,
    shapes: ["voice", "judgment", "stakeholder"],
    seat: "PERSON",
    vol: "LOW",
    mass: 0,
    bar: "One argument the room can act on",
    evals: "Not encoded / live judgment",
    cfg: null,
  },

  /* ── Operations ───────────────────────────────────────────────────── */
  {
    id: "W-063",
    title: "Supplier terms",
    dist: "OPS",
    lane: null,
    shapes: ["judgment", "stakeholder"],
    seat: "PERSON",
    vol: "LOW",
    mass: 0,
    bar: "Terms the relationship can carry",
    evals: "Not encoded / live judgment",
    cfg: null,
  },
  {
    id: "W-069",
    title: "Demand planning",
    dist: "OPS",
    lane: "Deep",
    shapes: ["judgment", "pattern"],
    seat: "ABOVE",
    vol: "MID",
    mass: 3,
    bar: "Stock where it is needed, when",
    evals: "Forecasts against what sold",
    cfg: {
      p: ["Supply lead", "Owns the order"],
      /* `lead-time-calculator` is the encoded Ops pattern substrate —
         supplier lead-time rules that keep planning conversations honest.
         Chip letters LEAD TIME. */
      skillId: "lead-time-calculator",
      s: ["Demand method", "Seasonality rules · lead-time logic · forecast cases"],
      m: ["Deep lane", "Model / explain"],
      a: "Chat assistant",
      c: ["Sales history", "Sell-through and lead times"],
      g: ["SKU + supplier facts", "Order minimums, lead times, channels"],
      k: ["Planning system", "Resource planning"],
      u: ["Chat + planning board"],
      o: "VP operations",
      why: "Pattern plus judgment under uncertainty. Worth reasoning depth per run.",
    },
  },
];

/**
 * THE CHAINS — work as it crosses departments.
 *
 * Sheet 01 of the city clusters modules by department and seats them all on
 * one bus. Clustering is not crossing, and crossing is the reason the map is
 * cross-functional rather than six good team-level views: one configuration
 * improves one department's work, and the transformation happens where the
 * work connects.
 *
 * Both runs below are drawn from work streams already on record; nothing here
 * is a new claim about the engagement, only an ordering of existing rows.
 *
 * ⚠ The second run passes THROUGH person-led work, and that is the point
 * rather than a gap. Supplier terms are not encoded, so the handoff between
 * an approved artwork pack and a matched invoice is carried by a person —
 * which is exactly what a map that hides person-led work cannot show.
 */
const MAP_CHAINS: readonly CaseMapChain[] = [
  {
    id: "C-01",
    label: "Campaign chain",
    note: "Brief to on-visual copy to declination to listing. Four encoded steps, two departments, one person carrying the context across every handoff.",
    steps: ["W-021", "W-017", "W-029", "W-051"],
  },
  {
    id: "C-02",
    label: "Pack-to-ledger chain",
    note: "An artwork pack becomes a supplier commitment becomes a matched invoice. Three departments, and the middle step is not encoded at all.",
    steps: ["W-011", "W-063", "W-045"],
  },
];

/**
 * Three paid-social cuts, reused verbatim from the arcs' shared evidence
 * (`lib/arcs/content/shared/loop-studio.ts`, `STUDIO_AD_CARDS` — the keynote
 * and the portfolio arc both draw from it since ADR-072) — same files, same
 * alt text, so the surfaces cannot end up describing the same ad differently.
 *
 * What deliberately does NOT come across: the keynote arc carries per-ad
 * spend, order value and ROAS. That page is a client deck; this is the
 * public landing, where the confidentiality envelope bans currency outright
 * (`.claude/rules/proof.md`, pinned by the registry test). The panel says
 * "beat the ROAS benchmarks" and prints no figure. (The portfolio arc sits
 * inside the same envelope and takes the cards through `ratiosOnly()` —
 * SKU and ROAS only; the arcs registry test scans it for the rest.)
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

/**
 * THE STUDIO ROW IS THREE SHEETS: the output, the rule, the limit
 * (owner, 2026-08-06 — "it's not just the ads, it's also the framework for
 * how we use AI, illustrative versus representative").
 *
 * The row showed only what the studio SHIPPED. Half of the engagement was
 * deciding what AI may and may not make, and that half is the part a reader
 * of a public case actually has to trust. Source: the AI in Studio deck,
 * April 2026 — the imagery policy and the synthetic-creator position.
 *
 * ⚠ GENERICISED ON PURPOSE, and the omissions are not stylistic. The deck
 * names a partner brand in four of its six examples, names three competitor
 * products by name, names an external placement vendor, and frames one risk
 * around revenue share. None of that is ours to publish on a landing page —
 * so the examples are the categories, the tools are "synthetic-creator
 * tools", and the financial risk is stated as the deck itself states it
 * ("the channel that depends most on audience trust"). The argument survives
 * every cut; it never depended on the names.
 *
 * ⚠ EXPORTED FOR THE PORTFOLIO ARC (ADR-078). The arc's `studio` beat mounts
 * `SheetsPlate` on THIS array at page scale, so the rule and the limit reach
 * the forwarded page as well as the landing — and neither surface can edit
 * the studio's own policy without the other seeing it. Pinned `toBe` the
 * row's visual in `cases-registry.test.ts`.
 */
export const LOOP_STUDIO_SHEETS = [
  /* ⚠ THE SHEET FEET ARE GONE (owner, 2026-08-08 — the console prints no
     foot on any plate now). The three sentences the sheets printed — the
     live-assets line, the identity-claim/function line and the
     creator-pipeline line — live in git; the LINE sheet's argument is
     still carried by its own two columns. */
  {
    id: "ads",
    label: "THE ADS",
    /* Shared BY REFERENCE with the beat and the keynote arc — re-typing this
       array is how three surfaces start describing the same ad differently. */
    body: { kind: "stills", shots: STUDIO_SHOTS },
  },
  {
    id: "line",
    label: "THE LINE",
    body: {
      kind: "compare",
      columns: [
        {
          kicker: "AI SUITABLE",
          name: "Illustrative",
          claim: "Imagine this scenario.",
          desc: "Shows a context where the product makes sense. Non-descript people in non-descript places — visual shorthand, the way stock photography always was.",
          examples: [
            "Paid-social use-case ads",
            "Crowd and venue scenes",
            "Generic scenario illustrations",
          ],
        },
        {
          kicker: "REAL PHOTOGRAPHY",
          name: "Representative",
          claim: "This is who we are. These are our people.",
          desc: "Makes an identity claim about the brand and its relationship with a culture. Requires authenticity — especially when entering a market for the first time.",
          examples: [
            "Lifestyle product photography",
            "Partnership and athlete imagery",
            "Market-expansion brand imagery",
          ],
        },
      ],
    },
  },
  {
    id: "red-line",
    label: "THE RED LINE",
    body: {
      kind: "facts",
      facts: [
        {
          title: "Credibility collapse",
          desc: "A person recommending the brand who does not exist. Social proof stops being proof.",
        },
        {
          title: "Public backlash",
          desc: "Audiences watch for this. The conversation moves from the product to the deception.",
        },
        {
          title: "Revenue exposure",
          desc: "The channel that depends most on audience trust is the one a backlash reaches first.",
        },
        {
          title: "Creator relationships",
          desc: "The creators who stay loyal through growth are the first ones lost when trust breaks.",
        },
      ],
    },
  },
] as const;

/** Both above-the-line films, self-hosted. CSP is `media-src 'self' blob:`
 *  (`lib/security/headers.mjs`), so these can never be served from a bucket
 *  — a remote src would be blocked the moment CSP leaves report-only.
 *
 *  ⚠ EXPORTED FOR THE PORTFOLIO ARC (ADR-078), like `LOOP_INTELLIGENCE_MAP`
 *  above: the arc's `films` beat mounts `FilmsPlate` on THIS array, so the
 *  two surfaces cannot drift into two different reels. Pinned `toBe` the
 *  row's visual in `cases-registry.test.ts`. */
export const LOOP_ATL_FILMS = [
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

/* The ADOPTION_SIGNAL curve (the mission-report row's plate) left with the
   directory trim (ADR-056 U13) — the `signal` kind and `CaseSignalPoint`
   stay in the model for a future case's summary row. */

/**
 * THE INTELLIGENCE MAP'S OWN RECORD, as one object (ADR-076).
 *
 * The casefile row below spreads these five fields into its
 * `intelligence-map` visual; the portfolio arc's `intelligence` section
 * mounts the same console from this export. It is the SAME ARRAYS by
 * reference — `cases-registry.test.ts` pins each member `toBe` the
 * visual's — so the two surfaces cannot publish two portfolios.
 *
 * ⚠ It carries no copy of its own. Everything here is already inside the
 * confidentiality envelope the registry test scans (`CASES` reaches these
 * arrays through the row), and adding a field here that the row does not
 * take would be a lettered string outside that scan.
 */
export const LOOP_INTELLIGENCE_MAP = {
  shapes: MAP_SHAPES,
  districts: MAP_DISTRICTS,
  works: MAP_WORKS,
  skills: LOOP_SKILLS,
  envelope: "WITHIN",
} as const;

export const LOOP_EARPLUGS_CASE: CaseDef = {
  slug: "loop-earplugs",
  client: "Loop Earplugs",

  report: {
    title: { pre: "Mission report:", em: "Loop Earplugs." },
    lede: "Eighteen months inside one company, mapping its work onto the intelligence now available to it. Every workflow encoded as a Skill the team owns, built into a tool where off-the-shelf software never fit, or left human on the record. The same Arc we teach, run at company scale.",
    stats: [
      {
        value: "22",
        label: "workshops run",
        detail: "one per team",
        source: "adoption board, team-session count",
      },
      {
        value: "47+",
        label: "Skills encoded",
        detail: "versioned, team-owned",
        source:
          "count tagged to the five shapes (12+7+9+5+14), the figure the map plate sums; the registry holds 51 cards incl. untagged and scoped",
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
        "What surfaces in a workshop does not stay in the transcript. It becomes a Skill — versioned, reviewed, and owned by the team in one governed repository rather than by the person who wrote it. Forty-seven are in motion across the company.",
        "Encoding it is only half the act. The other half is deciding what should run each piece of work: a Skill the team owns, a tool built on those Skills, or a person, on the record. Every one of them is a variation on five recurring shapes of work — and the shapes outlive the model version, the team roster, and whatever surface launches next.",
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
        title: "Work → intelligence · what runs what",
        groups: MAP_GROUPS,
        rows: MAP_ROWS,
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
    // `report.lede` tightened, with one clause marked for the gold wash.
    // Re-typed as segments rather than sliced out of the string so the
    // emphasis is data, not a fragile substring match.
    //
    // ⚠ LENGTH IS A HARD CONSTRAINT, and it fails SILENTLY. `.fl-brief` is
    // height-boxed against the `--fl-t6` seam with `overflow: hidden` and no
    // scrollbar, so a brief that outgrows its box just loses its tail.
    // Measured 2026-07-31: 1280×720 is the binding viewport at ~154px of box,
    // which is about 195 characters — a 246-character draft lost 23px there
    // and 9px at 1440×800 while looking perfect at 1920×1080. This runs 167.
    // Re-measure at 1280×720 after any edit here; the taller viewports will
    // not tell you.
    //
    // It closes on Skill / tool / human because that is exactly what the
    // row-one map shows — the brief previews the panel rather than
    // restating the mission report.
    brief: [
      "Eighteen months inside one company, ",
      { em: "mapping its work onto the intelligence now available to it" },
      " — encoded as Skills they own, built as tools, or left human on the record.",
    ],
    /* ORDER IS THE DIRECTORY, and the first row is what the casefile OPENS
       ON.

       THE MAP LEADS (owner, 2026-07-31; retitled 2026-08-02). The studio
       held row one while this directory was a list of deliverables, and it
       was the right call then. It is the wrong one now: the studio, the
       films and the tools are OUTPUTS of the mapping work, and leading with
       them presented an output as if it were the engagement. The largest
       thing here is eighteen months of deciding what should run which work
       — so that is row one, and the evidence it produced follows it.

       FOUR ROWS (owner, 2026-08-02: "remove everything from and including
       05_Workshop-rollout … so we only have the first four"). The directory
       is now the four PROJECTS, one browse-band quarter each; the rollout,
       governance, metrics and mission-report rows left with the trim.
       Where their content went, so nothing is restored by mistake:
       · the rollout LOG still renders on the Navigate beat (ROLLOUT_ROWS is
         shared data, and the beat is its remaining consumer);
       · governance's register rows exist only as beats/report copy now;
       · the metrics/report readouts were four duplicates of `report.stats`,
         which remains the single summary surface;
       · the ADOPTION_SIGNAL curve was deleted outright (its kind stays in
         the model).

       Row one's plate mounts WITH the casefile: a media row here puts its
       bytes on page load — that cost 23.6 kB while the studio led, and
       the pure-DOM browser plate keeps that win.

       SOFTWARE FOR FEW MOVES TO 02 (owner, 2026-08-07). The map says what
       the eighteen months WERE; the four tools are the hardest single piece
       of evidence that the mapping produced something a team now runs, so
       they read second and the two creative-output rows follow. Row one is
       untouched — it is still the default panel and still the pure-DOM
       plate that keeps the load win above.

       ⚠ THE ORDINAL IN `file` AND IN `stamp.ord` IS THE ROW'S POSITION, so
       both move with a reorder and the registry test's pinned `meta` /
       `classification` arrays move with them. `stamp.ref` does NOT — a ref
       is the record's own identifier (BLD-01 is the studio's wherever the
       studio sits), and renumbering refs on a reorder is how a reference
       stops being one. Track `id`s do not churn either (precedent:
       `transformation` → `workshop-rollout`). */
    tracks: [
      {
        // NOT `transformation` — that id belonged to the (now trimmed)
        // workshop-rollout row and the plate-sharing guard used to key on
        // it. Kept as a warning: two ids one word apart are a standing trap.
        // Renamed "AI Transformation" → "Intelligence Map" (owner,
        // 2026-08-02). The old title named a CATEGORY OF ENGAGEMENT, which
        // every consultancy's page also claims; this one names the artifact
        // the engagement produced, which only someone who did the work can
        // show. The word is deliberately vague on its own — the brief
        // beside it is what resolves it, and the plate is what proves it.
        //
        // The ID DOES NOT CHURN with the rename (precedent: `transformation`
        // → `workshop-rollout` kept its id). It is a DOM id, and the
        // plate-sharing guard has keyed on plate KIND since 2026-07-31, so
        // nothing downstream reads this string. `file` and `project` DO move
        // together — the registry test normalises one against the other.
        id: "ai-transformation",
        file: "01_INTELLIGENCE-MAP/",
        meta: "27 → 47",
        project: "Intelligence Map",
        icon: "dir",
        preview: "Preview — 01_intelligence-map/",
        // The city (ADR-062) keeps the beat's registry groups and rows BY
        // REFERENCE and adds the three arrays only the casefile draws.
        //
        // MAP_ROWS stays because the beat still renders the exemplars and
        // the sharing guard still asserts that both surfaces use one source.
        // MAP_GROUPS carries the Skills arithmetic the plate sums on screen,
        // and MAP_SHAPES carries the same five counts for the mains below
        // grade — the registry test asserts the two agree, so they cannot
        // drift into two different portfolios.
        visual: {
          kind: "intelligence-map",
          groups: MAP_GROUPS,
          rows: MAP_ROWS,
          skills: LOOP_SKILLS,
          shapes: MAP_SHAPES,
          districts: MAP_DISTRICTS,
          works: MAP_WORKS,
          chains: MAP_CHAINS,
          envelope: "WITHIN",
        },
        // Four proof blocks in the left-column register, and each one is a
        // reading the drawing beside it can be checked against (ADR-062,
        // PRD §10): 27 modules on the board, 47 Skills summed by the five
        // mains, the reuse figure below grade, and the envelope in the
        // chrome. `value` is textual so the fourth can name a status rather
        // than invent a count.
        //
        // ⚠ "14 TEAMS USING THE LAYER" LEFT THIS PANEL with ADR-062, by
        // owner ruling — a deliberate removal, not an erosion. It was the
        // second of the two published team counts (22 BRIEFED / 14 USING);
        // 22 still prints on the ENCODE beat's rollout log, so the pair no
        // longer appears together and nothing has to keep them apart here.
        // The map publishes DISTRICTS, which are departments and a THIRD
        // unit again — never write copy that lets a district count read as
        // a team count (pinned by `cases-registry.test.ts`).
        //
        // "47" and not "47+" on this panel specifically: the mains below
        // grade print the same total as arithmetic a reader can add up, so
        // a hedge beside an exact sum reads as two different numbers.
        blocks: [
          {
            glyph: "board",
            title: "Every stream on one board",
            desc: "Twenty-seven modules, including the work deliberately left person-led.",
          },
          {
            glyph: "encode",
            title: "47 Skills encoded",
            desc: "Judgment made reusable, and kept to one standard.",
          },
          {
            glyph: "reuse",
            title: "Reuse beats rebuilding",
            desc: "Nineteen of twenty-four configured streams drew on a shape already paid for.",
          },
          {
            glyph: "envelope",
            title: "Draw stays within envelope",
            desc: "Relative draw measured against workload. Never a price.",
          },
        ],
        context: [
          { k: "Period", v: "2024 · ongoing" },
          { k: "Scope", v: "Marketing → company" },
          // Key kept SHORT: the three-up register puts this in the rightmost
          // column, and "Unit of done" + a 20-char value ran off the panel
          // edge at 1440. The ≤20 guard on the value alone does not catch it.
          { k: "Unit", v: "One workflow encoded" },
        ],
        // The board is the system of record and is NAMED, never linked — the
        // confidentiality envelope bans the domain outright.
        source: "Source — adoption board · rev 2026.07",
        stamp: { ord: "01", phase: "Navigate", ref: "NAV-01" },
        // THE ONLY PER-TRACK BRIEF (2026-08-01, ADR-056 U11). The standing
        // casefile brief has to serve all eight rows, so it can only describe
        // the engagement — it cannot make this row's claim.
        //
        // OWNER COPY, VERBATIM (2026-08-02). The words are not ours to
        // tighten: the gold-wash marker was placed on an existing phrase
        // rather than rewriting one in, and the split into segments is a
        // display treatment only. It replaced a draft that opened on what
        // "most AI work" does — a frame the reader has to accept before the
        // sentence pays off. This one opens on the client's own before-state
        // and names the thing the row is titled after, which is what makes
        // "Intelligence Map" resolve instead of hang.
        //
        // "Over eighteen months" is the SAME claim as the mission report's
        // lede and the `5 → 130+` stat's detail — one duration, three
        // surfaces, deliberately identical.
        //
        // 299 chars against the ~330 the U11 tick move bought at 1280x720
        // (the binding viewport; the test's 420 is a looser guardrail, NOT
        // the box). Re-measure THERE.
        //
        // ⚠ PRD §10's lede is 390 chars and would clip ~90 of them silently.
        // It was written for the standalone mockup, whose brief column had a
        // whole viewport; `.fl-brief` is height-boxed against `--fl-t6` with
        // no scrollbar. What was cut is the five-question enumeration —
        // "what runs it, what it inherits, what it can reach, how much it
        // decides alone, who owns it" — because sheet 02's own label rail
        // asks those five on screen. Cutting it removes a restatement, which
        // is the same discipline that stripped the rail's provenance labels
        // between v11 and v13; the acceptance criterion "no clipped text"
        // outranks copy fidelity when the two conflict.
        brief: [
          "Every piece of work at Loop, and ",
          { em: "how much intelligence runs in it" },
          ". The board lays out the estate: work streams as modules, clustered by the team that owns them. Open one and it comes apart into its configuration. Below grade runs the shared substrate — encoded once for one team, tapped by the next.",
        ],
      },
      {
        id: "tooling",
        file: "02_SOFTWARE-FOR-FEW/",
        meta: "4 TOOLS",
        project: "Software for Few",
        icon: "dir",
        preview: "Preview — 02_software-for-few/",
        visual: { kind: "tools", toolIds: TOOL_IDS },
        classification: "AI-ASSISTED DEVELOPMENT · INTERNAL TOOLS · ACTIVE",
        /* THE FOUR TOOL-DESCRIBING BLOCKS WERE REPLACED HERE 2026-08-07
           (owner). "Generation platform · Briefing orchestration · Briefing
           intelligence · Localization pipeline" named the four tools one
           tile each — which is what the RIGHT PANEL does, better, with a
           capture beside it. The register was restating the gallery two
           boxes away, exactly the way row one's `27`/`47` restated its own
           directory meta before ADR-067 deleted the figure.

           Where that content still lives, so nothing is restored from
           muscle memory:
           · each tool's one-line description is the right panel's DETAIL
             PLATE (`ProjectCase.tab` / `route` / `detail`);
           · the full four-capability breakdown stays in `PROJECT_CASES`,
             which remains canonical for the Arc card and ToolCardConsole.

           What replaces them is PROGRAM-LEVEL: four claims about the fleet
           as a whole, which is the only thing this register can say that
           the panel beside it cannot. */
        blocks: [
          {
            glyph: "gap",
            title: "Too specific to buy",
            desc: "Four tools in the gap between generic SaaS and an agency build no headcount could justify.",
          },
          {
            glyph: "collapse",
            title: "Rebuilt, not accelerated",
            desc: "Five sources become one surface, five handoffs one flow — and nothing is retyped in between.",
          },
          {
            glyph: "ownership",
            title: "Owned by the teams",
            desc: "Built with the workflow owner; localization now product-manages its own tool end to end.",
          },
          {
            glyph: "substrate",
            title: "One substrate, four tools",
            desc: "The engines share their encoded judgment — one tool was even extracted from another.",
          },
        ],
        context: [
          { k: "Built with", v: "The workflow owner" },
          { k: "Instead of", v: "Off-the-shelf" },
          { k: "Cadence", v: "Daily" },
        ],
        source: "Source — fleet registry · rev 2026.07",
        stamp: { ord: "02", phase: "Build", ref: "BLD-03" },
        brief: [
          "AI made software worth building for workflows ",
          { em: "a conventional product roadmap would ignore" },
          ". Four internal tools grew from live bottlenecks in generation, orchestration, briefing intelligence and localization. Each is built for the few people who need it—and designed so those teams can keep extending it.",
        ],
      },
      {
        id: "studio",
        file: "03_AI-FLUENCY-STUDIO/",
        meta: "500 ADS/MO",
        project: "AI Fluency Studio",
        icon: "dir",
        preview: "Preview — 03_ai-fluency-studio/",
        visual: { kind: "sheets", sheets: LOOP_STUDIO_SHEETS },
        classification: "AI ADOPTION · CREATIVE PRODUCTION · ACTIVE",
        blocks: [
          {
            glyph: "field",
            title: "97% of briefings involve AI",
            desc: "In paid social, AI is the default process rather than a specialist add-on.",
          },
          {
            glyph: "threshold",
            title: "Campaigns beat their target",
            desc: "Three of three, at a return on ad spend of 2.7, 5.33 and 6.14 against a target of 2.",
          },
          {
            glyph: "cadence",
            title: "Two to three times faster",
            desc: "More iterations in less time than the former agency route, at the same craft bar.",
          },
          {
            glyph: "holdfast",
            title: "The studio owns the work",
            desc: "The team briefs, creates, reviews and ships without a specialist in the loop.",
          },
        ],
        context: [
          { k: "Phase", v: "Build" },
          { k: "Surface", v: "Production platform" },
          { k: "Owner", v: "The studio" },
        ],
        source: "Source — studio production line · rev 2026.07",
        stamp: { ord: "03", phase: "Build", ref: "BLD-01" },
        brief: [
          "Creative Technology embedded inside Studio to turn AI from a specialist service into ",
          { em: "a capability the creative team owns" },
          ". Live briefs, reusable workflows and clear ethical lines moved the team from receiving AI output to briefing and judging it. Paid social moves faster, buying back time for the live-action craft AI should not replace.",
        ],
      },
      {
        id: "atl-films",
        file: "04_AI-ABOVE-THE-LINE/",
        meta: "2 FILMS",
        project: "AI Above-the-Line",
        icon: "dir",
        preview: "Preview — 04_ai-above-the-line/",
        visual: { kind: "films", films: LOOP_ATL_FILMS },
        classification: "GENERATIVE PRODUCTION · ATL / CTV · SHIPPED",
        blocks: [
          {
            glyph: "masters",
            title: "Two 30-second masters",
            desc: "Narrative films produced with AI and built for top-of-funnel paid media.",
          },
          {
            glyph: "level",
            title: "One craft standard",
            desc: "Direction, art direction, production, edit, colour and sound matched live action.",
          },
          {
            glyph: "broadcast",
            title: "Ran on YouTube and CTV",
            desc: "The campaign reached connected TV and YouTube as paid media in the US.",
          },
          {
            glyph: "parallel",
            title: "Ran beside live action",
            desc: "The two AI films ran alongside two traditionally produced spots.",
          },
        ],
        context: [
          { k: "Phase", v: "Build" },
          { k: "Format", v: "Above-the-line" },
          { k: "Owner", v: "The creative team" },
        ],
        source: "Source — creative archive · rev 2026.07",
        stamp: { ord: "04", phase: "Build", ref: "BLD-02" },
        brief: [
          "Two ATL films were produced with generative image and video models, ",
          { em: "using the same creative team and quality bar as Loop’s live-action work" },
          ". The project took relatable, acquisition-minded stories into paid media on YouTube and connected TV—expanding the formats Loop could test without treating AI as a replacement for live action.",
        ],
      },
      /* Rows 05–08 (workshop rollout · governance · metrics · mission
         report) were TRIMMED here 2026-08-02 (owner) — see the ORDER note
         above for where each one's content still lives. `05_SKILL-LAYER/`
         had already been retired 2026-07-31 ("we already mentioned it");
         its evidence is row one's plate. */
    ],
  },

  meta: {
    title: "Loop Earplugs — Thoughtform case",
    description:
      "Eighteen months at Loop Earplugs, mapping the company's work onto the intelligence available to it: 22 team workshops, 47+ Skills encoded, and four production tools built on the layer they created.",
  },
};
