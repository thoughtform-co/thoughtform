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

export const SERVICE_PLATES: readonly ServicePlate[] = [
  {
    id: "keynote",
    chip: "01 — Keynote",
    statusCode: "NAV-01",
    title: "Install the frame in a room.",
    lede: [
      "One talk that resets how a room sees AI — from software to command to ",
      { em: "intelligence to navigate" },
      ". Tuned to your industry, run on live demos, honest about what works today and what doesn't.",
    ],
    feedLabel: "Feed 01 · On stage",
    feedStatus: "Live",
    includes: ["Live demos", "Custom cases", "Take-home deck", "NL / EN"],
    ctaLabel: "Book a keynote",
    ctaHref: "#contact",
    photo: photo("keynote", "Vince Buyssens delivering a keynote on stage", "50% 12%"),
  },
  {
    id: "workshop",
    chip: "02 — Workshop",
    statusCode: "ENC-02",
    title: "Build the skill by hand.",
    lede: [
      "One to three days building with your team's real work — no slideware. Everyone ships something: working prototypes, automated workflows, and encoded Skills the team keeps using after we leave.",
    ],
    feedLabel: "Feed 02 · In studio",
    // The open plate's feed is live (Collapse canvas: seeds read "Standby",
    // opening flips the feed to "Live" — the old C4 "Locked" fiction retired).
    feedStatus: "Live",
    includes: ["Real backlog", "Working prototypes", "Encoded Skills", "NL / EN"],
    ctaLabel: "Plan a workshop",
    ctaHref: "#contact",
    focus: true,
    photo: photo("workshop", "Vince Buyssens working at a laptop in a studio session", "50% 24%"),
  },
  {
    id: "embedded",
    chip: "03 — Embedded",
    statusCode: "BLD-03",
    title: "The practice moves in.",
    lede: [
      "For teams that want AI in the bloodstream, not on a roadmap. We move in — shipping tools, wiring systems, training people — until the practice runs without us. ",
      { em: "Self-sufficiency is the exit." },
    ],
    feedLabel: "Feed 03 · In residence",
    feedStatus: "Live",
    includes: ["Weekly cadence", "Shipped tools", "Exit by design", "NL / EN"],
    ctaLabel: "Start a residency",
    ctaHref: "#contact",
    photo: photo("embedded", "Vince Buyssens on stage during a residency performance", "50% 12%"),
  },
  {
    // Guided Build (2026-07-09) — the Build-heavy engagement that sits
    // between Workshop and Embedded: the client's engineers ship, we steer.
    // Photo is unshipped for now; the plate renders the schematic dot-grid
    // placeholder in the feed window until `scripts/services-photos/prepare.mjs`
    // is run on a captured session (drop the `photo` field back in to promote).
    id: "guided-build",
    chip: "04 — Guided Build",
    statusCode: "BLD-04",
    title: "Your team ships it.",
    lede: [
      "Your engineers ship the surface; we steer the architecture, evals, and handoff. Substrate stays in your tenancy from day one, and the ",
      { em: "internal capacity to extend it" },
      " is what we leave behind.",
    ],
    feedLabel: "Feed 04 · In build",
    feedStatus: "Live",
    includes: ["Your engineers", "Architecture reviews", "Eval design", "NL / EN"],
    ctaLabel: "Scope a build",
    ctaHref: "#contact",
  },
];
