/**
 * serviceRecut — the FOUR SERVICES, re-cut (owner, 2026-09-19), as a LAB
 * record. Nothing on `/` reads this file.
 *
 *   keynote       01 Keynote          verbatim from production
 *   workshop      02 Workshop         verbatim from production
 *   embedded      03 Embedded         Strategic Advisory FOLDED INTO the embedded
 *                                     offer: the configuration sprint (ADR-111)
 *                                     with the leadership altitude named — the
 *                                     doctrine's "standing session with
 *                                     leadership", the two altitudes of one embed.
 *                                     The chip is EMBEDDED (owner ruling: the
 *                                     doctrine's own flagship word, spanning both
 *                                     altitudes) and the title stays, so the object
 *                                     is named once and the mode once.
 *   guided-build  04 Home session     NEW on the site. The Claude sessions at the
 *                                     owner's home in Antwerp: six to eight people,
 *                                     one morning, individually registered,
 *                                     philosophical register, the skill by hand.
 *                                     Doctrine: thoughtform-strategy
 *                                     05-engagements ("Home session"), ops
 *                                     offering-economics / proposal-template.
 *
 * ⚠ THE IDS ARE FIXED SPATIAL SLOTS AND DO NOT MOVE (`servicePlateData.ts`).
 * `guided-build` hosting the home session is the same documented misnomer that
 * hosted Advisory; the rack position, the anchor pick, the designation set and
 * the scan note all hang off the key.
 *
 * ⚠ EVERY NEW STRING IS A DRAFT for the owner's read in the lab console. What
 * is not a draft is the FIT: `tests/lib/services-recut.test.ts` walks every
 * record through `backFaceLayout` (title ≤ 2 lines, content above the CTA)
 * and the services copy law before any of it can be read on a card.
 *
 * ⚠ NO PRICE. The home session is the one service ops prices per seat, and
 * the card law is that money stays in the proposal. Digits are banned on this
 * record outright (the test) so a rate cannot creep in as "€450".
 */

import { SERVICES, type Service } from "@/components/landing/home-v2/services/serviceData";
import {
  SERVICE_PLATES,
  type ServicePlate,
} from "@/components/landing/home-v2/services/servicePlateData";

const production = (id: ServicePlate["id"]): ServicePlate => {
  const p = SERVICE_PLATES.find((s) => s.id === id);
  if (!p) throw new Error(`no production plate ${id}`);
  return p;
};
const productionService = (id: Service["id"]): Service => {
  const s = SERVICES.find((x) => x.id === id);
  if (!s) throw new Error(`no production service ${id}`);
  return s;
};

const embedded = production("embedded");

export const RECUT_PLATES: readonly ServicePlate[] = [
  production("keynote"),
  production("workshop"),
  {
    ...embedded,
    chip: "Embedded",
    /* ADR-111's record, with the leadership altitude entering through the
       third bullet — the doctrine's "standing session with leadership" is
       what Advisory's monthly read becomes inside the embed. The bullet stays
       two lines on the back (the fit test measures it). */
    breakdown: [
      "Setup and briefing, the first workstream you run alone",
      "Generation and design, run with your team as the last gate",
      "Operations and scaling, and a standing session with leadership",
    ],
    includes: ["Three workstreams", "Your own keys", "Leadership session", "Dated handover"],
  },
  {
    id: "guided-build",
    chip: "Home session",
    statusCode: "NAV-04",
    title: "The skill, for yourself.",
    lede: [
      "Six to eight people at a table in Antwerp for one morning: the argument behind the practice, then the skill by hand, with the time a keynote never has.",
    ],
    breakdown: [
      "The argument in full, then your own work on the table",
      "Six to eight people, each registered for themselves",
      "Food and drinks, a printed handout, and the circle after",
    ],
    spec: {
      duration: "One morning, three hours",
      participants: "Six to eight, individually registered",
      format: "At the table, in Antwerp",
      language: "NL / EN",
      leavesWith: "The skill, and the people you sat with",
    },
    feedLabel: "Feed 04 · At the table",
    feedStatus: "Standby",
    includes: ["Six to eight seats", "One morning", "Antwerp", "NL / EN"],
    ctaLabel: "Reserve a seat",
    ctaHref: "#contact",
    /* The slot's own asset as the LAB's STAND-IN (round four — the portrait
       raster letters the photograph and resolves it on hover, so a card
       without one has nothing to letter). `strategic` is the one shot at a
       table, which is what a home session is; the alt says what the picture
       shows, not what the old service was. Whether mobile keeps photographs
       at all is still ADR-086's open question. */
    photo: {
      webp: "/images/services/strategic.webp",
      jpg: "/images/services/strategic.jpg",
      alt: "Vince Buyssens at the table, mid-session",
      position: "50% 32%",
    },
  },
];

const embeddedService = productionService("embedded");

export const RECUT_SERVICES: readonly Service[] = [
  productionService("keynote"),
  productionService("workshop"),
  {
    ...embeddedService,
    name: "Embedded",
    body: "A modular sprint in three stage-gated workstreams, run on your own keys inside the tools the team already uses, with a standing session for leadership alongside. Proven first on creative work; the same shape takes any team's own workstreams.",
    meta: [
      { label: "Runs", value: "Three workstreams · leadership" },
      { label: "Format", value: "Fixed term · dated handover" },
      { label: "Leaves", value: "The layer, and the team" },
    ],
  },
  {
    id: "guided-build",
    index: "04",
    verb: "HOME SESSION",
    name: "Home session",
    kicker: "THE SKILL, FOR YOURSELF",
    tagline: "The skill, for yourself.",
    body: "Six to eight people at a table in Antwerp for one morning: the argument behind the practice, then the skill by hand, with the time a keynote never has.",
    meta: [
      { label: "Runs", value: "Navigate" },
      { label: "Format", value: "One morning · Antwerp · NL/EN" },
      { label: "Leaves", value: "The skill, and the people" },
    ],
    phase: "navigate",
    ctaLabel: "Reserve a seat",
    ctaHref: "#contact",
    shapeKey: "loop-forming",
  },
];
