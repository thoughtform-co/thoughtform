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

export type ServiceId = "keynote" | "workshop" | "embedded";

export type ServicePhase = "navigate" | "navigate-encode" | "all";

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

export const SERVICES: readonly Service[] = [
  {
    id: "keynote",
    index: "01",
    verb: "KEYNOTE",
    name: "Keynote",
    kicker: "THE LOOP AS ARGUMENT",
    tagline: "Install the frame in a room.",
    body: "The frame, installed in a room. Your team leaves seeing AI as intelligence to navigate, not software to command.",
    meta: [
      { label: "Runs", value: "Navigate, as story." },
      { label: "Shape", value: "30–90 minutes. NL or EN." },
      { label: "Leaves behind", value: "A shared language and a reason to start." },
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
    body: "We take your real briefs, navigate them together, and encode what works into substrate the team keeps. From a half-day sprint to a multi-week track.",
    meta: [
      { label: "Runs", value: "Navigate and Encode. A first Build on the longer tracks." },
      { label: "Shape", value: "Half-day to multi-week." },
      { label: "Leaves behind", value: "Working substrate, and a team that can steer without me." },
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
    kicker: "THE LOOP UNTIL IT RUNS ITSELF",
    tagline: "Compound the layer.",
    body: "I work alongside the team, loop after loop, until the layer compounds on its own. Navigate, encode, and build thin tools on top of what's encoded.",
    meta: [
      { label: "Runs", value: "The full flywheel." },
      { label: "Shape", value: "Ongoing, scoped to a defined end." },
      {
        label: "Leaves behind",
        value: "An owned intelligence layer, and the habit of extending it.",
      },
    ],
    phase: "all",
    ctaLabel: "Embed the practice",
    ctaHref: "#contact",
    shapeKey: "loop-crystallized",
  },
];
