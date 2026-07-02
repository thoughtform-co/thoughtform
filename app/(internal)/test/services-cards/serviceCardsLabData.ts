/**
 * serviceCardsLabData — REBUILT services copy for the /test/services-cards
 * design lab (2026-07-02).
 *
 * Information architecture cut from the production card's 8 text layers to 5:
 *
 *   header      "01 / KEYNOTE" — index + name, ONCE (production repeated the
 *               name in the eyebrow AND the headline)
 *   statement   one compressed, spoken declarative — the only "line"
 *               (replaces kicker + tagline + signal, which were three
 *               competing taglines)
 *   support     one literal sentence (optional per variant — the densest
 *               variant drops it)
 *   rows        three data rows, values ≤5 words (production values ran to
 *               full sentences; the phase pill folds into RUNS)
 *   cta         one action
 *
 * The CV-scan fiction (coordinates, confidence %) is dropped from the card
 * body; variant A keeps a single status readout in the title bar as the one
 * technical trace. Promote into `serviceData.ts` when a variant wins.
 */

export type LabServiceId = "keynote" | "workshop" | "embedded";

export interface LabServiceRow {
  label: string;
  value: string;
}

export interface LabService {
  id: LabServiceId;
  index: string;
  name: string;
  statement: string;
  support: string;
  rows: readonly [LabServiceRow, LabServiceRow, LabServiceRow];
  ctaLabel: string;
  /** Single technical trace for the variants that keep one (title-bar readout). */
  status: string;
}

export const LAB_SERVICES: readonly LabService[] = [
  {
    id: "keynote",
    index: "01",
    name: "KEYNOTE",
    statement: "Install the frame in a room.",
    support: "Your team leaves seeing AI as intelligence to navigate, not software to command.",
    rows: [
      { label: "Runs", value: "Navigate" },
      { label: "Format", value: "30–90 min · NL/EN" },
      { label: "Leaves", value: "A shared language" },
    ],
    ctaLabel: "Book a keynote",
    status: "SIG 91%",
  },
  {
    id: "workshop",
    index: "02",
    name: "WORKSHOP",
    statement: "Encode what works.",
    support:
      "We navigate your real briefs together and encode what works into substrate the team keeps.",
    rows: [
      { label: "Runs", value: "Navigate · Encode" },
      { label: "Format", value: "Half-day to multi-week" },
      { label: "Leaves", value: "Working substrate" },
    ],
    ctaLabel: "Plan a workshop",
    status: "SIG 94%",
  },
  {
    id: "embedded",
    index: "03",
    name: "EMBEDDED",
    statement: "The loop until it runs itself.",
    support: "I work alongside the team until the intelligence layer compounds on its own.",
    rows: [
      { label: "Runs", value: "The full flywheel" },
      { label: "Format", value: "Ongoing, defined end" },
      { label: "Leaves", value: "An owned intelligence layer" },
    ],
    ctaLabel: "Embed the practice",
    status: "SIG 88%",
  },
];
