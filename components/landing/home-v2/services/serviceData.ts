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
export const SERVICES: readonly Service[] = [
  {
    id: "keynote",
    index: "01",
    verb: "KEYNOTE",
    name: "Keynote",
    kicker: "THE LOOP AS ARGUMENT",
    tagline: "Install the frame in a room.",
    body: "Your team leaves seeing AI as intelligence to navigate, not software to command.",
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
    kicker: "THE LOOP ON YOUR WORK",
    tagline: "Encode what works.",
    body: "We navigate your real briefs together and encode what works into substrate the team keeps.",
    meta: [
      { label: "Runs", value: "Navigate · Encode" },
      { label: "Format", value: "Half-day to multi-week" },
      { label: "Leaves", value: "Working substrate" },
    ],
    phase: "navigate-encode",
    ctaLabel: "Plan a workshop",
    ctaHref: "#contact",
    lead: true,
    shapeKey: "loop-encoding",
  },
  {
    id: "embedded",
    index: "03",
    verb: "EMBEDDED",
    name: "Embedded",
    kicker: "COMPOUND THE LAYER",
    tagline: "The loop until it runs itself.",
    body: "I work alongside the team until the intelligence layer compounds on its own.",
    meta: [
      { label: "Runs", value: "The full flywheel" },
      { label: "Format", value: "Ongoing, defined end" },
      { label: "Leaves", value: "An owned intelligence layer" },
    ],
    phase: "all",
    ctaLabel: "Embed the practice",
    ctaHref: "#contact",
    shapeKey: "loop-crystallized",
  },
  {
    // Guided Build (2026-07-09) — the client's engineers ship the surface,
    // we steer architecture, evals, and handoff. Sits between Workshop and
    // Embedded on the build-heavy end of the arc.
    id: "guided-build",
    index: "04",
    verb: "GUIDED BUILD",
    name: "Guided Build",
    kicker: "SHIP THE SURFACE",
    tagline: "Your team ships it.",
    body: "Your engineers own the surface; I steer the architecture, evaluation, and handover until the internal capacity holds.",
    meta: [
      { label: "Runs", value: "Encode · Build" },
      { label: "Format", value: "Sprints with review gates" },
      { label: "Leaves", value: "A team-built surface" },
    ],
    phase: "encode-build",
    ctaLabel: "Scope a build",
    ctaHref: "#contact",
    shapeKey: "loop-crystallized",
  },
];
