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
 * Mirrors `components/landing/v7/build-cases/buildCaseData.ts` so the
 * Services portal can follow the same content-then-card pattern.
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
 * full-section copy: tightened bodies, no em dashes, voice moved from
 * first-person singular ("I advise") to the practice "we" / neutral.
 * Kept in lockstep with `servicePlateData` — the production card copy.
 * The four ServiceId keys
 * are FIXED SPATIAL SLOTS shared with `servicePlateData` (each id is wired to
 * a rack position, a brandmark anchor, a designation set, and a scan note).
 * The service occupying each slot changed; the id → service mapping is:
 *   keynote  → 01 Strategic Advisory
 *   workshop → 02 Embedded AI Partner
 *   embedded → 03 Keynote
 *   guided   → 04 Workshop
 * `verb` feeds the bottom readout strip; `name`/`tagline`/`body`/`meta` feed
 * the mobile card stack. Ids/index/order/phase are unchanged so every spatial
 * map stays valid. */
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
  intro:
    "A talk, a workshop, or an embedded term building alongside your team. All tuned to the AI decisions you're actually making, and built to leave your team able to run it.",
} as const;

export const SERVICES: readonly Service[] = [
  {
    id: "keynote",
    index: "01",
    verb: "ADVISORY",
    name: "Strategic Advisory",
    kicker: "KNOW WHERE TO INVEST IN AI",
    tagline: "Know where to invest in AI.",
    body: "A monthly read for the people making the AI calls: where to invest, what to skip, what to build. Tested against real work.",
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
  {
    id: "workshop",
    index: "02",
    verb: "EMBEDDED",
    name: "Embedded AI Partner",
    kicker: "WE BUILD INSIDE YOUR TEAMS",
    tagline: "We build inside your teams.",
    body: "We run strategy and build with your teams on a fixed term. You keep the tools, the judgment, and the people who can run them.",
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
    id: "embedded",
    index: "03",
    verb: "KEYNOTE",
    name: "Keynote",
    kicker: "CHANGE HOW YOUR ROOM SEES AI",
    tagline: "Change how your room sees AI.",
    body: "Built for your industry, run on live demos. The room leaves with shared language and a clear next step.",
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
    id: "guided-build",
    index: "04",
    verb: "WORKSHOP",
    name: "Workshop",
    kicker: "YOUR TEAM BUILDS ITS FIRST AI TOOLS",
    tagline: "Your team builds its first AI tools.",
    body: "A hands-on session on your team's real work. They leave with the first patterns encoded and a build list.",
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
];
