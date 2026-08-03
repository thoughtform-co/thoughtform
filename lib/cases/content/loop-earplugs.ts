import type { CaseDef, CaseIntelligence, CaseSkillEntry, CaseTeamDraw } from "../types";

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
    name: "NDA Pre-Check",
    team: "Legal",
    engine: "Judgment",
    status: "In build",
    summary:
      "Clause-by-clause review encoded. Routine deviations get caught and handled, novel ones route to Legal. Four more pre-checks build on its shape.",
  },
  {
    name: "Legal Risk Methodology",
    team: "Legal",
    engine: "Judgment",
    status: "In build",
    summary:
      "Loop's risk methodology as substrate, starting with AI and data privacy. The engine every Legal pre-check calls into.",
  },
  {
    name: "SPA Pre-Check",
    team: "Legal",
    engine: "Judgment",
    status: "Scoped",
    summary: "The NDA pre-check's judgment shape, applied to shareholder purchase agreements.",
  },
  {
    name: "Product Ideation",
    team: "Product Management",
    engine: "Judgment",
    status: "In build",
    summary:
      "Pressure-tests a raw idea against the portfolio, the mission, the value spaces and the roadmap before anyone builds a case for it.",
  },
  {
    name: "Risk Management",
    team: "Program Management & Product",
    engine: "Judgment",
    status: "In build",
    summary:
      "Standardises how a risk gets described, finds the gaps, and surfaces the reasoning behind a decision rather than only its outcome.",
  },
  {
    name: "BRR Generator",
    team: "Product Engineering",
    engine: "Judgment",
    status: "In use",
    summary:
      "Turns intake into a business requirements review on the engineering team's own standard template.",
  },
  {
    name: "Onboarding & POps Processes",
    team: "People Ops",
    engine: "Judgment",
    status: "In build",
    summary:
      "Encodes how People Ops reasons about edge cases, not just the happy path. Reasoning first, automation second.",
  },
  {
    name: "Partnership Inbox Filter",
    team: "Brand & Partnerships",
    engine: "Judgment",
    status: "In build",
    summary:
      "Classifies an inbound partnership request by tier and drafts the response that tier warrants, with its reasoning attached.",
  },
  {
    name: "Cost / Feasibility / Portfolio",
    team: "Manufacturing Programs",
    engine: "Judgment",
    status: "In build",
    summary:
      "Manufacturing-side triage on cost, feasibility and portfolio fit. Shares its judgment engine with the design-side checks.",
  },
  {
    name: "UX Foundations Evaluation",
    team: "Product Design & UX",
    engine: "Judgment",
    status: "In build",
    summary:
      "Reads a concept and returns its alignment against Loop's six UX pillars, naming what fails rather than scoring it out of ten.",
  },
  {
    name: "Concept Triage Engine",
    team: "Product Design & UX",
    engine: "Judgment",
    status: "In build",
    summary:
      "Three checks on one engine: cost, feasibility, portfolio fit. Four design questions answered as a single architectural move.",
  },
  {
    name: "Loop Creative Strategy",
    team: "Performance",
    engine: "Judgment",
    status: "In use",
    summary:
      "The creative-strategy substrate: desire axes, awareness stage and transformation arc, applied to every review, ad and brief. Mímir composes off it.",
  },
  // Voice — 7
  {
    name: "Employer Branding TOV",
    team: "Talent Acquisition",
    engine: "Voice",
    status: "In build",
    summary:
      "Employer-facing tone for job posts, outreach and candidate comms. Pairs with the internal People voice on the other side of the door.",
  },
  {
    name: "People-team Voice",
    team: "People Ops",
    engine: "Voice",
    status: "In use",
    summary:
      "The internal register, encoded from the team's own tone-of-voice doc. Playbook pages first, then emails and decks.",
  },
  {
    name: "Founder Tone of Voice",
    team: "Brand & Partnerships",
    engine: "Voice",
    status: "In use",
    summary:
      "The founder's voice encoded, used for stage prep and for ongoing founder-led communication.",
  },
  {
    name: "Paid Social TOV",
    team: "Brand & Partnerships",
    engine: "Voice",
    status: "In build",
    summary:
      "Paid-social copy rules encoded, so a campaign draft arrives on-brand and human review starts from something real.",
  },
  {
    name: "Loop Paid Social",
    team: "Studio",
    engine: "Voice",
    status: "In use",
    summary:
      "Grounded in the real ad archive across every product, angle, season and collab. Writes primary text, headlines and descriptions in Loop's voice.",
  },
  {
    name: "Loop CRM",
    team: "Studio",
    engine: "Voice",
    status: "Shipped",
    summary:
      "Lifecycle communication end to end: onboarding, retention, escalation, win-back, loyalty, with the privacy guardrails encoded in, not bolted on.",
  },
  {
    name: "Loop Marketplace",
    team: "Studio",
    engine: "Voice",
    status: "Shipped",
    summary:
      "Amazon listing copy: titles, SEO descriptions, bullets, A+ modules, image text. Adapts the base copy for collabs, bundles and new colourways.",
  },
  // Validation — 9
  {
    name: "Tracker Compliance Checker",
    team: "Legal",
    engine: "Validation",
    status: "In use",
    summary:
      "Drives a browser across the Loop webshops every week and reports every consent violation it finds, checked against policy.",
  },
  {
    name: "Interview Debrief",
    team: "Talent Acquisition",
    engine: "Validation",
    status: "Scoped",
    summary:
      "Turns panel notes into a debrief scored against Loop's hiring bars. A fixed rubric, which is what makes it a validation shape.",
  },
  {
    name: "GL Reconciliations",
    team: "Finance & Accounting",
    engine: "Validation",
    status: "In build",
    summary:
      "Takes the ledger extract through its reconciliation checks and flags the anomalies for a human to judge.",
  },
  {
    name: "Belgian VAT Return",
    team: "Finance & Accounting",
    engine: "Validation",
    status: "Scoped",
    summary:
      "Turns the ledger extract into the VAT return, replacing the manual spreadsheet lookups the boxes used to need.",
  },
  {
    name: "Quality Auditor",
    team: "Warehousing & Customer Ops",
    engine: "Validation",
    status: "In use",
    summary:
      "Scores support tickets against the team's own scorecard, compares AI answers to human ones, and reports the outliers.",
  },
  {
    name: "Fraud Detection",
    team: "Warehousing & Customer Ops",
    engine: "Validation",
    status: "In build",
    summary:
      "Pattern analysis over orders: odd addresses, bot activity, suspicious refunds. The output is a flag list, not a verdict.",
  },
  {
    name: "Invoice Processor",
    team: "Warehousing & Customer Ops",
    engine: "Validation",
    status: "In use",
    summary:
      "Reads supplier invoices across every template, cross-checks them against the vendor master, POs and prior invoices, and catches scam patterns.",
  },
  {
    name: "Supplier QA Audit",
    team: "Manufacturing Programs",
    engine: "Validation",
    status: "Scoped",
    summary:
      "Scores supplier quality reports against Loop's bars, alongside the warehousing team's own quality work.",
  },
  {
    name: "Localization",
    team: "Studio",
    engine: "Validation",
    status: "In build",
    summary:
      "Checks locale copy against the approved translations, so a market launch never ships a sentence nobody signed off.",
  },
  // Stakeholder — 5
  {
    name: "Candidate Screening Brief",
    team: "Talent Acquisition",
    engine: "Stakeholder",
    status: "Scoped",
    summary:
      "Structures intake notes into one screening brief a hiring manager can read in a single pass.",
  },
  {
    name: "Program Status Updates",
    team: "Program Management & Product",
    engine: "Stakeholder",
    status: "In build",
    summary:
      "Reads transcripts, checks the risk board, reviews the roadmap, and drafts the cross-team status digest from all three.",
  },
  {
    name: "Market Scan Brief",
    team: "Strategic Insights",
    engine: "Stakeholder",
    status: "In build",
    summary:
      "Structures competitive and category signals into a standing brief the insights team refreshes weekly.",
  },
  {
    name: "Survey Synthesis",
    team: "Strategic Insights",
    engine: "Stakeholder",
    status: "Scoped",
    summary:
      "Turns raw survey exports into themed readouts, each carrying quoted evidence and a note on how confident it is.",
  },
  {
    name: "Feedback Summarizer",
    team: "Studio",
    engine: "Stakeholder",
    status: "In use",
    summary:
      "Turns a sprawling creative feedback thread into a structured summary stakeholders can act on without re-reading it.",
  },
  // Pattern — 14
  {
    name: "Variance Commentary",
    team: "Finance & Accounting",
    engine: "Pattern",
    status: "In use",
    summary:
      "Month-end variance templates encoded. It drafts the commentary and Finance reviews it, and it sounds like the person who used to write it.",
  },
  {
    name: "MEC Tracker",
    team: "Finance & Accounting",
    engine: "Pattern",
    status: "In use",
    summary:
      "The month-end close carried forward as a live project: it surfaces blockers as they appear and drafts the status note.",
  },
  {
    name: "VSME Sustainability Reporting",
    team: "Program Management & Product",
    engine: "Pattern",
    status: "Scoped",
    summary:
      "Structured inputs into the voluntary SME reporting template. Credible disclosures without a dedicated reporting function.",
  },
  {
    name: "Daily Brief",
    team: "Product Engineering",
    engine: "Pattern",
    status: "In use",
    summary:
      "Pulls mail, transcripts and boards into one morning brief for engineering. The multi-source briefing pattern other teams now reuse.",
  },
  {
    name: "Dashboard Consolidation",
    team: "Warehousing & Customer Ops",
    engine: "Pattern",
    status: "In use",
    summary:
      "Harmonises two analytics sources into a single exec-ready readout, on the same briefing pattern.",
  },
  {
    name: "SOP Generator",
    team: "People Ops",
    engine: "Pattern",
    status: "In build",
    summary:
      "Reverse-engineered from Loop's good SOPs: it asks the question flow that elicits a complete one, then drafts it for review.",
  },
  {
    name: "360 Marketing Agent",
    team: "Brand & Partnerships",
    engine: "Pattern",
    status: "In build",
    summary:
      "A marketing assistant lifted out of one person's private chatbot into a shared Skill that can be versioned and used across teams.",
  },
  {
    name: "Trend Scraper",
    team: "Strategic Insights",
    engine: "Pattern",
    status: "In build",
    summary:
      "Pulls external trend signals into a digest the team routes on into its briefing and calendar work.",
  },
  {
    name: "Lead Time Calculator",
    team: "Manufacturing Programs",
    engine: "Pattern",
    status: "In use",
    summary:
      "Encodes lead-time rules across suppliers and lanes, so programme dates stay honest in a planning conversation.",
  },
  {
    name: "CMF File Generator",
    team: "Product Design & UX",
    engine: "Pattern",
    status: "In use",
    summary:
      "Workbook in, manufacturer-ready colour-material-finish PDF with renders out. Wired into Vesper end to end.",
  },
  {
    name: "Loop Packaging System",
    team: "Product Design & UX",
    engine: "Pattern",
    status: "In use",
    summary:
      "Artwork and workbook in, supplier-ready PDFs with info-box overlays and the creative intent brief out. Promotes the whole folder EVT to MP.",
  },
  {
    name: "Product Review Analysis",
    team: "Product Design & UX",
    engine: "Pattern",
    status: "In build",
    summary:
      "Scrapes and structures marketplace reviews, surfacing themes and request patterns across markets.",
  },
  {
    name: "Asset Brief Generator",
    team: "Studio",
    engine: "Pattern",
    status: "In build",
    summary:
      "Drafts a studio brief from campaign inputs, so a producer starts from a complete spec instead of a blank document.",
  },
  {
    name: "GenAI Prompting",
    team: "Studio",
    engine: "Pattern",
    status: "In use",
    summary:
      "How Loop gets useful work out of AI image and video tools: which models want a story, which want keywords, and how one idea becomes a slate.",
  },
];

/* ── THE MAP'S HIGHER-LEVEL VIEWS (ADR-056 U16) ──────────────────────────
 * Owner, 2026-08-03: "the thing we're building is the intelligence map.
 * It's not just skills. It's also the model, the connectors it has access
 * to, the tools we build on top of it... substrate/team is a subcategory,
 * a subfilter. We also need higher-level filters based on how we're
 * building that map and configuration."
 *
 * DERIVATION. Everything below is read from the client's own usage
 * snapshots (May, June and July 2026) on the adoption board, and then
 * ROUNDED. The owner's ruling: "it doesn't have to be the exact numbers,
 * it's more to illustrate our case." What the snapshots actually showed,
 * for whoever refreshes this:
 *   · Consumption share by model family moved May → July as the work got
 *     deeper, with the frontier family arriving from nothing to about a
 *     fifth of the draw in three months.
 *   · The inversion is the finding: the light families are on nearly every
 *     seat and carry almost none of the draw; the deep families are on far
 *     fewer seats and carry almost all of it.
 *   · Per-team, firmware/hardware work is the deepest draw per seat in the
 *     company on a handful of seats; Legal is the largest chat-led draw
 *     because the documents are long and the reasoning IS the work;
 *     the Studio is the widest spread at a light per-seat draw.
 *
 * WHAT MAY NEVER TRAVEL HERE (pinned by the registry test):
 *   · Currency of any kind, and any per-seat cost. The €/month band is a
 *     client-deck claim and must not be restated on the landing.
 *   · MODEL FAMILY NAMES. The tiers are generic capability names by owner
 *     ruling — the landing stays model-silent, which both avoids a second
 *     variant of the deck's model advice and survives model churn.
 *   · VENDOR NAMES for connectors. The categories below are the landing's
 *     register; the named connector list belongs to the client deck.
 */
const LOOP_INTELLIGENCE: CaseIntelligence = {
  /* Top of the stack first — the reading order is "what they got" down to
     "what it runs on". Counts AGREE with the published figures elsewhere
     in this file (4 tools, 47+ Skills) rather than introducing variants. */
  stack: [
    {
      name: "Tools",
      count: "4",
      gloss: "Built in-house, owned by the teams that use them.",
      items: ["Mímir", "Vesper", "Babylon", "Heimdall"],
    },
    {
      name: "Skills",
      count: "47+",
      gloss: "Encoded judgment. Versioned, team-owned, model-portable.",
      items: ["5 shapes", "14 teams"],
    },
    {
      name: "Connectors",
      count: "6",
      gloss: "Where the work already lives, reached without copy-paste.",
      items: ["Boards", "Mail", "Docs", "Design", "Commerce", "Transcripts"],
    },
    {
      name: "Models",
      count: "4",
      gloss: "One ladder, from instant answers to the hardest builds.",
      items: ["Fast", "Everyday", "Deep", "Frontier"],
    },
  ],
  /* THE INVERSION IS THE PICTURE. Reach runs high at the top and falls;
     draw does the opposite. A reader who only looks at seats concludes the
     light tiers are the system; the draw column is what corrects them. */
  tiers: [
    { name: "Fast", note: "instant answers", reach: 90, draw: 1 },
    { name: "Everyday", note: "the daily driver", reach: 90, draw: 19 },
    { name: "Deep", note: "reasoning-heavy work", reach: 60, draw: 59 },
    { name: "Frontier", note: "the hardest builds", reach: 25, draw: 21 },
  ],
  /* The litmus, in three lines: the map has to explain WHY a team's draw
     looks the way it does, or it is just a usage dashboard. */
  reads: [
    {
      team: "Legal",
      lens: "Chat-led",
      why: "Long, nuanced documents. The reasoning is the work, so the deep tier earns it.",
    },
    {
      team: "Product Engineering",
      lens: "Code-led",
      why: "Firmware is deeper than any page of code. The frontier tier, and the draw to match.",
    },
    {
      team: "Studio",
      lens: "Widest spread",
      why: "Twenty-three people at a light draw each. Breadth is the shape here, not depth.",
    },
  ],
  trend: {
    label: "Frontier share of draw",
    points: [
      { stamp: "May", value: "0%" },
      { stamp: "Jun", value: "3%" },
      { stamp: "Jul", value: "21%" },
    ],
  },
};

/**
 * Per-team consumption bands for the lattice's TEAM axis — the gradient the
 * owner asked for ("cluster the type of teams or skills based on the work
 * and token consumption").
 *
 * MAPPING. The casefile's team names are the client's own org labels and do
 * not match the usage snapshot's team rows one-for-one. The joins used:
 * Product Engineering ← the engineering and hardware rows (the two deepest
 * in the company); Performance and Strategic Insights ← the analytics and
 * performance rows; Warehousing & Customer Ops ← the support and
 * fulfilment rows. Where a casefile team has no snapshot row of its own it
 * takes the band of its department, which is why so many sit at "light" —
 * that is the true shape, and flattening it would lose the point.
 */
const LOOP_TEAM_DRAW: readonly CaseTeamDraw[] = [
  { team: "Product Engineering", band: "intensive" },
  { team: "Legal", band: "deep" },
  { team: "Performance", band: "deep" },
  { team: "Studio", band: "steady" },
  { team: "Product Design & UX", band: "steady" },
  { team: "Brand & Partnerships", band: "steady" },
  { team: "Manufacturing Programs", band: "steady" },
  { team: "Warehousing & Customer Ops", band: "steady" },
  { team: "Finance & Accounting", band: "light" },
  { team: "Program Management & Product", band: "light" },
  { team: "People Ops", band: "light" },
  { team: "Strategic Insights", band: "light" },
  { team: "Talent Acquisition", band: "light" },
  { team: "Product Management", band: "light" },
];

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

/* The ADOPTION_SIGNAL curve (the mission-report row's plate) left with the
   directory trim (ADR-056 U13) — the `signal` kind and `CaseSignalPoint`
   stay in the model for a future case's summary row. */

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
       the pure-DOM browser plate keeps that win. */
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
        meta: "5 → 130+",
        project: "Intelligence Map",
        icon: "dir",
        preview: "Preview — 01_intelligence-map/",
        vizLabel: "Map — work to intelligence",
        // The ONLY `registry` track, and the reference-equality guard finds
        // the first one — so this is what keeps the beat/casefile plate
        // sharing live now that the skill-layer row is gone.
        //
        // `skills` makes the plate a BROWSER (ADR-056 U13): engine tabs
        // carrying the group counts, clickable chips for the selected
        // engine, a provenance line for the selected skill. The casefile
        // stops rendering MAP_ROWS visually — the browser shows the real
        // portfolio, which is what the exemplars stood in for — but the
        // rows STAY here because the beat still renders them and the
        // sharing guard still asserts them shared.
        //
        // `intelligence` + `teamDraw` make it the MAP (ADR-056 U16): the
        // lattice becomes one of three views, alongside the configuration
        // stack and the allocation ladder. The row's name finally means
        // what it says — the map is the models, the connectors, the Skills
        // and the tools, not the Skills alone.
        visual: {
          kind: "registry",
          groups: MAP_GROUPS,
          rows: MAP_ROWS,
          skills: LOOP_SKILLS,
          intelligence: LOOP_INTELLIGENCE,
          teamDraw: LOOP_TEAM_DRAW,
        },
        // FOUR BLOCKS, not three readouts (owner, 2026-08-02). The readout
        // trio could only say things that reduce to a number, so the two
        // claims that matter most here — that the layer is one system, and
        // that the teams own it — had no way to appear. The 2×2 grammar is
        // the tool gallery's, and the fourth block deliberately carries no
        // figure at all.
        //
        // This QUALIFIES the July "system numbers, not artifact counts"
        // ruling rather than discarding it: that ruling protected a row
        // claiming a TRANSFORMATION from being evidenced by an inventory.
        // The row now claims THE MAP, and the size of what is mapped is the
        // evidence for it. The two numbers that left (21 days, 05 shapes)
        // are not lost — 21 days still prints on the rollout and governance
        // rows, and the five shapes ARE the plate above.
        //
        // ⚠ "14 teams" is a DIFFERENT SET from the 22 in the rollout log and
        // the governance row (see NUMBERS at the top of this file). The
        // titles are what keep them apart: USING THE LAYER vs BRIEFED. Do
        // not harmonise the wording.
        blocks: [
          {
            stat: "47+",
            title: "Skills in active use",
            desc: "Reusable methods, standards and review logic encoded for AI.",
          },
          {
            stat: "14",
            title: "Teams using the layer",
            desc: "Across creative, legal, finance, product, programs and operations.",
          },
          {
            stat: "1",
            title: "Shared intelligence layer",
            desc: "One system for authoring, testing, versioning, ownership and reuse.",
          },
          {
            // No `stat`. The claim is a property of the layer, not a count
            // of it, and inventing "14" here twice would say less.
            title: "Domain-owned",
            desc: "The teams that know the work maintain the Skills and extend them after handoff.",
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
        // 300 chars against the ~330 the U11 tick move bought at 1280x720
        // (the binding viewport; it was ~195 before). Re-measure THERE.
        brief: [
          "Over eighteen months, Loop's scattered AI experiments became a ",
          { em: "shared intelligence layer" },
          ": domain knowledge encoded as versioned Skills, connected to tools and agents, and mapped to the workflows they support. The result is one maintained system for reuse, evaluation and ownership across the company.",
        ],
      },
      {
        id: "studio",
        file: "02_AI-FLUENCY-STUDIO/",
        meta: "500 ADS/MO",
        project: "AI Fluency Studio",
        icon: "dir",
        preview: "Preview — 02_ai-fluency-studio/",
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
        stamp: { ord: "02", phase: "Build", ref: "BLD-01" },
      },
      {
        id: "atl-films",
        file: "03_AI-ABOVE-THE-LINE/",
        meta: "2 FILMS",
        project: "AI Above-the-Line",
        icon: "dir",
        preview: "Preview — 03_ai-above-the-line/",
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
        stamp: { ord: "03", phase: "Build", ref: "BLD-02" },
      },
      {
        id: "tooling",
        file: "04_SOFTWARE-FOR-FEW/",
        meta: "4 TOOLS",
        project: "Software for few",
        icon: "dir",
        preview: "Preview — 04_software-for-few/",
        vizLabel: "Fleet — in production",
        visual: { kind: "tools", toolIds: TOOL_IDS },
        readouts: [
          { value: "04", label: "production tools" },
          { value: "47+", label: "Skills they stand on" },
          { value: "Days → min", label: "briefing synthesis" },
        ],
        context: [
          { k: "Built with", v: "The workflow owner" },
          { k: "Instead of", v: "Off-the-shelf" },
          { k: "Cadence", v: "Daily" },
        ],
        source: "Source — fleet registry · rev 2026.07",
        stamp: { ord: "04", phase: "Build", ref: "BLD-03" },
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
