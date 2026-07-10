/**
 * servicePlateData — copy + assets for the "Thoughtform Prime" signal-plate
 * service cards (collapse states: open card / collapsed seed). Source of
 * truth shared by the production `#services` cluster (`ServicesPlateCluster`)
 * and the design lab (`/test/services-prime`).
 *
 * Copy is the design handoff's final-intent text (Keynote / Workshop /
 * Embedded). Emphasis segments ({ em }) render as UPRIGHT GOLD, not italic, per
 * the site's no-italics brand rule (the handoff mock used italics).
 *
 * Photos are the subject-centered, web-compressed crops produced by
 * `scripts/services-photos/prepare.mjs` (public/images/services/{id}.{webp,jpg}).
 */

export type ServicePlateId = "keynote" | "workshop" | "embedded" | "guided-build";

/** A run of lede text; `{ em }` marks a gold-emphasis span (upright, not italic). */
export type LedeSegment = string | { em: string };

export interface ServicePlate {
  id: ServicePlateId;
  /** Gold chip label, e.g. "01 — Keynote". */
  chip: string;
  /** Right-aligned status code, e.g. "NAV-01" (the card appends " · Open"
   * to the open plate, per the Collapse States canvas). */
  statusCode: string;
  /** Card headline (rendered uppercase by CSS). */
  title: string;
  /** Body paragraph as segments so emphasis stays data-driven. */
  lede: LedeSegment[];
  /** Feed caption under the photo, e.g. "Feed 01 · On stage". */
  feedLabel: string;
  /** Feed status, e.g. "Live" / "Locked". */
  feedStatus: string;
  /** Inline "includes" chips — the single logistics line. */
  includes: string[];
  ctaLabel: string;
  ctaHref: string;
  /** Reserved emphasis flag. As of 2026-07-09 all four CTAs render as the
   * same filled gold button, so this no longer drives the CTA fill (it did
   * pre-2026-07-09, adding `.svc-plate__cta--solid`). Kept for possible
   * future per-card emphasis; wire a new consumer before relying on it. */
  focus?: boolean;
  /** Optional — services without a shipped hologram photo render a schematic
   * dot-grid placeholder in both the seed feed band and the open photo
   * window (`ServicePlateCard` handles the fallback). Drop the photo in and
   * ship the shape below to promote a service to full C3 hologram plate. */
  photo?: {
    webp: string;
    jpg: string;
    alt: string;
    /** `background-position` for the landscape feed window / sliver. The
     * assets are portrait card crops with the subject horizontally centered
     * (scripts/services-photos/prepare.mjs), so X stays 50% and Y picks the
     * face band. Tuned by vision inspection per photo. */
    position: string;
  };
}

const photo = (id: ServicePlateId, alt: string, position: string) => ({
  webp: `/images/services/${id}.webp`,
  jpg: `/images/services/${id}.jpg`,
  alt,
  position,
});

/* Copy + order rewritten 2026-07-09 (Vince review). The four ServicePlateId
 * keys are FIXED SPATIAL SLOTS (not service names) — each id is wired to a
 * rack position, a brandmark anchor pick, a designation set, and a scan note.
 * The visible service that occupies each slot changed, so the id → service
 * mapping is now:
 *   keynote  slot (left rack, top)    → 01 Strategic Advisory  (no photo)
 *   workshop slot (left rack, bottom) → 02 Embedded AI Partner (embedded photo)
 *   embedded slot (right rack, top)   → 03 Keynote             (keynote photo)
 *   guided   slot (right rack, bottom)→ 04 Workshop            (workshop photo)
 * Keeping the ids as slot keys avoids re-tuning every spatial map; the photo
 * for each slot is pointed at the correct asset by hand. */
export const SERVICE_PLATES: readonly ServicePlate[] = [
  {
    id: "keynote",
    chip: "Strategic Advisory",
    statusCode: "ADV-01",
    title: "Steer the whole bet.",
    lede: [
      "A standing read for the people making the AI calls. Where to invest, what to ignore, what to build — always tested against real work.",
    ],
    feedLabel: "Feed 03 · At the table",
    feedStatus: "Standby",
    includes: ["Monthly cadence", "Strategic memos", "On-call reads", "NL / EN"],
    ctaLabel: "Open an advisory",
    ctaHref: "#contact",
  },
  {
    id: "workshop",
    chip: "Embedded AI Partner",
    statusCode: "BLD-02",
    title: "The practice moves in.",
    lede: [
      "We run strategy and build inside your teams on a fixed term. You keep the layer, the tools, and the people who can run it.",
    ],
    feedLabel: "Feed 04 · On site",
    feedStatus: "Standby",
    includes: ["Fixed term", "Dated handover", "Owned layer", "NL / EN"],
    ctaLabel: "Scope an engagement",
    ctaHref: "#contact",
    photo: photo("embedded", "Vince Buyssens on site during an embedded engagement", "50% 12%"),
  },
  {
    id: "embedded",
    chip: "Keynote",
    statusCode: "NAV-02",
    title: "Install the frame in a room.",
    lede: ["One talk that resets how a room sees AI. Tuned to your industry, run on live demos."],
    feedLabel: "Feed 01 · On stage",
    feedStatus: "Live",
    includes: ["Live demos", "Custom cases", "Take-home deck", "NL / EN"],
    ctaLabel: "Book a keynote",
    ctaHref: "#contact",
    photo: photo("keynote", "Vince Buyssens delivering a keynote on stage", "50% 12%"),
  },
  {
    id: "guided-build",
    chip: "Workshop",
    statusCode: "ENC-04",
    title: "Build the skill by hand.",
    lede: [
      "A working session on your team's real workflows. They leave with the first patterns encoded and a build list.",
    ],
    feedLabel: "Feed 02 · On the floor",
    feedStatus: "Standby",
    includes: ["Workflow mapping", "First skills", "Build list", "NL / EN"],
    ctaLabel: "Book a workshop",
    ctaHref: "#contact",
    photo: photo("workshop", "Vince Buyssens working with a team in a studio session", "50% 24%"),
  },
];
