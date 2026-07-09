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
/* Copy + order rewritten 2026-07-09 (Vince review). The four ServiceId keys
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
export const SERVICES: readonly Service[] = [
  {
    id: "keynote",
    index: "01",
    verb: "ADVISORY",
    name: "Strategic Advisory",
    kicker: "STEER THE WHOLE BET",
    tagline: "Steer the whole bet.",
    body: "A standing read for the people making the AI calls — where to invest, what to ignore, what to build, tested against real work.",
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
    kicker: "THE PRACTICE MOVES IN",
    tagline: "The practice moves in.",
    body: "We run strategy and build inside your teams on a fixed term. You keep the layer, the tools, and the people who can run it.",
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
    kicker: "INSTALL THE FRAME",
    tagline: "Install the frame in a room.",
    body: "One talk that resets how a room sees AI. Tuned to your industry, run on live demos.",
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
    kicker: "BUILD THE SKILL BY HAND",
    tagline: "Build the skill by hand.",
    body: "A working session on your team's real workflows. They leave with the first patterns encoded and a build list.",
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
