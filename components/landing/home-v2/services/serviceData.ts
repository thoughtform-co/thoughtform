/**
 * Service content for the production home-v2 landing page (#services).
 *
 * Source of truth for the three "how we run it" terminal cards that
 * stack inside the Services station. Copy adapted from the workshop
 * brief "One loop. Three depths." — Keynote / Workshop / Embedded.
 *
 * Each entry follows the editorial frame in the reference:
 *   - INDEX + VERB headline      (PT Mono index, PP Neue Montreal verb)
 *   - subtitle tag-line          ("The loop as argument.")
 *   - body paragraph             (1-2 sentences, calm and concrete)
 *   - three meta rows            (Runs / Shape / Leaves behind)
 *   - CTA                        (link back to #contact)
 *   - shapeKey                   (drives ServiceSigilField particle visual)
 *
 * The content-then-card pattern came from the retired
 * `build-cases/buildCaseData.ts` (deleted — `PROJECT_CASES` in
 * `tools-cards/toolCardData.ts` is the canonical case module now); this
 * file is its own source, mirroring nothing living.
 */

export type ServiceId = "keynote" | "workshop" | "embedded" | "guided-build";

export type ServicePhase = "navigate" | "navigate-encode" | "encode-build" | "all";

export interface ServiceMetaRow {
  /** Mono label rendered on the left ("Runs", "Shape", "Leaves behind"). */
  label: string;
  /** Sentence value rendered on the right. */
  value: string;
}

export interface Service {
  id: ServiceId;
  /** PT Mono index like "01", "02", "03". */
  index: string;
  /** Display verb ("KEYNOTE", "WORKSHOP", "EMBEDDED"). */
  verb: string;
  /** Title-case name shown in the Services stage left list ("Keynote"). */
  name: string;
  /** Mono kicker that names the loop framing ("THE LOOP AS ARGUMENT"). */
  kicker: string;
  /** Big editorial subtitle ("Install the frame in a room."). */
  tagline: string;
  /** 1-2 sentence body explaining what the engagement actually is. */
  body: string;
  /** Three meta rows — keep value text short, one line each. */
  meta: [ServiceMetaRow, ServiceMetaRow, ServiceMetaRow];
  /** Phase pill ("Navigate", "Navigate · Encode", "Navigate · Encode · Build"). */
  phase: ServicePhase;
  /** CTA label on the card footer. */
  ctaLabel: string;
  /** CTA href — usually #contact. */
  ctaHref: string;
  /** Marks the visually emphasised "lead" card (gold accent). */
  lead?: boolean;
  /** Shape identifier consumed by ServiceSigilField. */
  shapeKey: "loop-forming" | "loop-encoding" | "loop-crystallized";
}

/* Copy rebuilt 2026-07-02 (variant D promotion from /test/services-cards):
 * 5-layer IA — header (index + name, once), one spoken statement (`tagline`,
 * rendered all-caps by the card), one literal support line (`body`), three
 * ≤5-word data rows (Runs / Format / Leaves — the phase pill folds into
 * Runs), one CTA. `kicker` is retained for the mobile card stack only. */
/* Copy + order rewritten 2026-07-09 (Vince review); swept 2026-07-16
 * (first-person voice), then replaced the same evening with the owner's
 * full-section copy. Kept in lockstep with `servicePlateData` — the
 * production card copy. The four ServiceId keys
 * are FIXED SPATIAL SLOTS shared with `servicePlateData` (each id is wired to
 * a rack position, a brandmark anchor, a designation set, and a scan note).
 *
 * HARMONIZED 2026-08-02 (owner copy, verbatim). Every card now leads with
 * ONE OUTCOME STATEMENT — a noun phrase naming what the buyer walks away
 * with — and the four progress deliberately: shared frame → working setup →
 * internal capability → portfolio direction. The occupancy moved WITH that
 * progression, so the id → service mapping is now:
 *   keynote      → 01 Keynote
 *   workshop     → 02 Workshop
 *   embedded     → 03 Embedded AI Partner
 *   guided-build → 04 Strategic Advisory
 * Three of four slot ids re-aligned with their own content in the move
 * (2026-07-09 had rotated them apart); `guided-build` hosting Advisory is
 * the one remaining misnomer — the id is a spatial key, do not rename it
 * (rack position, anchor pick, designation set and scan note all hang off
 * it). Spatial params everywhere stay slot-tuned; labels travel with the
 * service. The Advisory body carries the owner's em dash verbatim — the
 * 2026-07-16 "no em dashes" sweep is superseded where the owner writes one. */
/** Section masthead copy (2026-07-16, promoted from /test/services-wordmark —
 * ADR-044). SECTION-level register copy ONLY — the title/intro for #services as
 * a whole, never per-card (ADR-029: card copy stays baked on the WebGL faces).
 * The em line renders gold. Owner copy, 2026-07-16 evening sweep: "THREE
 * DEPTHS." returns DELIBERATELY (an earlier pass retired it as stale) — the
 * intro reframes the count: talk / workshop / embedded term are the three
 * DEPTHS of one loop, and Advisory is the standing read alongside them.
 * The "Services · 04" eyebrow is RETIRED (owner, 2026-07-17) — the last
 * station-index eyebrow on the journey; the corridor heads and the v7
 * stations dropped theirs long ago ("headline reads first").
 * Headline rewritten 2026-07-17 (owner): "ONE LOOP. / THREE DEPTHS." read
 * as meaningless abstraction; replaced with the practical positioning line
 * — the capability-handover angle (his differentiator: teams keep the
 * tools + judgment, not consultancy dependency). Intro tightened + matched
 * to it, and de-framed in services.css (owner: the plate frame didn't
 * fit). The em (second) line renders gold.
 * Headline rewritten again 2026-07-20 (owner): "AI YOUR TEAM CAN RUN." →
 * "AI capability your team owns." — same positioning, ownership over
 * ability. Split 2 words / 3 words (was 3/2) to keep both lines close in
 * measure at the title clamp (26–44px); the em line still carries the
 * payoff. `services-ring-smoke.spec.ts`'s masthead-title assertion moved
 * `AI YOUR TEAM` → `AI CAPABILITY` in lockstep — see ADR-044. */
export const SERVICES_MASTHEAD = {
  titleLines: [
    { text: "AI CAPABILITY", em: false },
    { text: "YOUR TEAM OWNS.", em: true },
  ],
  // Owner copy, 2026-08-02 (harmonization pass): two sentences, no dash —
  // the second sentence is the section's whole claim, kept as its own beat.
  intro:
    "From a keynote to an embedded engagement, the work stays grounded in real decisions and workflows. What gets built stays with the people who own the work.",
  /**
   * M2 "survey plate" chrome (design handoff "Band Masthead — M2", 2026-07-21).
   * The title + brief read as two surveyed panels of the instrument, each
   * carrying a PT-Mono designation and a coordinate stamp; the brief also
   * carries the one gold state chip. Purely presentational flavour — the
   * coord strings are the design's registration-mark coordinates (verbatim
   * from the handoff), not live geometry.
   */
  survey: {
    titleDesig: "SVC / TITLE · 01",
    briefDesig: "SVC / BRIEF · 02",
    state: "Open",
    titleCoord: "0344 / 0260",
    briefCoord: "1588 / 0260",
  },
} as const;

export const SERVICES: readonly Service[] = [
  {
    id: "keynote",
    index: "01",
    verb: "KEYNOTE",
    name: "Keynote",
    kicker: "A SHARED FRAME FOR AI",
    tagline: "A shared frame for AI.",
    body: "A grounded argument for treating AI as intelligence rather than software, and for designing its role in work accordingly.",
    meta: [
      { label: "Runs", value: "Navigate" },
      { label: "Format", value: "30–90 min · NL/EN" },
      { label: "Leaves", value: "A shared language" },
    ],
    phase: "navigate",
    ctaLabel: "Book a keynote",
    ctaHref: "#contact",
    shapeKey: "loop-forming",
  },
  {
    id: "workshop",
    index: "02",
    verb: "WORKSHOP",
    name: "Workshop",
    kicker: "A FIRST WORKING AI SETUP",
    tagline: "A first working AI setup.",
    body: "A hands-on session around one real workflow, producing an encoded practice, a working first setup and a clear build path.",
    meta: [
      { label: "Runs", value: "Navigate · Encode" },
      { label: "Format", value: "Half-day to multi-day" },
      { label: "Leaves", value: "First skills + build list" },
    ],
    phase: "navigate-encode",
    ctaLabel: "Book a workshop",
    ctaHref: "#contact",
    lead: true,
    shapeKey: "loop-encoding",
  },
  {
    id: "embedded",
    index: "03",
    verb: "EMBEDDED",
    name: "Embedded AI Partner",
    kicker: "AN AI CAPABILITY THE TEAM CAN RUN",
    tagline: "An AI capability the team can run.",
    body: "A sustained engagement inside the team, turning domain judgment into reusable Skills, tools and tested systems the team can continue to operate and improve.",
    meta: [
      { label: "Runs", value: "Fixed term" },
      { label: "Format", value: "Dated handover" },
      { label: "Leaves", value: "An owned layer" },
    ],
    phase: "all",
    ctaLabel: "Scope an engagement",
    ctaHref: "#contact",
    shapeKey: "loop-crystallized",
  },
  {
    id: "guided-build",
    index: "04",
    verb: "ADVISORY",
    name: "Strategic Advisory",
    kicker: "A LIVE MAP OF WHERE AI BELONGS",
    tagline: "A live map of where AI belongs.",
    body: "A recurring portfolio read across workflows, cost, evidence and ownership—showing what to build, what to change and what should remain person-led.",
    meta: [
      { label: "Runs", value: "Monthly cadence" },
      { label: "Format", value: "Strategic memos · NL/EN" },
      { label: "Leaves", value: "Sharper AI calls" },
    ],
    phase: "navigate",
    ctaLabel: "Open an advisory",
    ctaHref: "#contact",
    shapeKey: "loop-forming",
  },
];
