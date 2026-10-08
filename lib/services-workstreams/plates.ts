/**
 * The records the lab's ring bakes: the THREE WORKSTREAMS. The intelligence
 * configuration is not a card — it is the whole section (owner, 2026-10-08),
 * named by the masthead and drawn by the configuration panel; the cards are
 * its workstreams. The ring has four slots, so the fourth is HIDDEN
 * (`ServicesCardRing.hiddenSlots`) and the scroll stops on the third.
 * ARRAY ORDER IS RING ORDER; the ids are the ring's SPATIAL KEYS
 * (`ServicePlateId`) and say nothing about the card.
 *
 * ⚠ LAB COPY. "Creative" is on these faces, which ADR-111 bans on the
 * production bake; promotion is the decision that lifts or keeps that ban.
 * Everything else holds the copy law: no price, no banned word, the team
 * named as the gate, the handover dated.
 */

import type {
  ServicePlate,
  ServicePlateId,
} from "@/components/landing/home-v2/services/servicePlateData";

import { WORKSTREAMS, type Workstream } from "./record";

/** The slot each card sits on, in ring order. */
export const WORKSTREAM_SLOTS: readonly ServicePlateId[] = [
  "keynote",
  "workshop",
  "guided-build",
  "embedded",
];

const SHARED_SPEC = {
  duration: "Fixed term, dated handover",
  participants: "Your team, as the last gate",
  format: "Your keys, your tools",
  language: "NL / EN",
  leavesWith: "The layer, and the team that runs it",
};

function workstreamPlate(ws: Workstream, id: ServicePlateId): ServicePlate {
  return {
    id,
    chip: ws.name,
    statusCode: ws.key.slice(0, 3).toUpperCase(),
    title: ws.name,
    lede: [ws.line],
    breakdown: ws.entries.slice(0, 4).map((e) => e.title),
    spec: SHARED_SPEC,
    feedLabel: ws.name,
    feedStatus: "Live",
    includes: [],
    ctaLabel: `See the ${ws.name.toLowerCase()} work`,
    ctaHref: "#contact",
  };
}

/** The slot the ring hides: the fourth, which no workstream fills. */
export const HIDDEN_SLOT = WORKSTREAMS.length;
export const HIDDEN_SLOTS: readonly number[] = [HIDDEN_SLOT];

export const WORKSTREAM_PLATES: readonly ServicePlate[] = [
  ...WORKSTREAMS.map((ws, i) => workstreamPlate(ws, WORKSTREAM_SLOTS[i])),
  /* The hidden slot's record: the ring bakes four, and this one is never
     shown (its face bakes to bare ground and its anchor never publishes). */
  { ...workstreamPlate(WORKSTREAMS[0], WORKSTREAM_SLOTS[HIDDEN_SLOT]), chip: "" },
];

/** The workstream on a slot, or null for the hidden one. */
export function workstreamForSlot(id: string): Workstream | null {
  const i = WORKSTREAM_SLOTS.indexOf(id as ServicePlateId);
  return i >= 0 && i < WORKSTREAMS.length ? WORKSTREAMS[i] : null;
}

/** The section head, re-cut for the workstreams (lab-local; a module
 *  constant because the masthead's decode effect re-arms on its identity). */
export const WORKSTREAMS_MASTHEAD = {
  titleLines: [
    { text: "ONE CONFIGURATION,", em: false },
    { text: "THREE WORKSTREAMS.", em: true },
  ],
  intro:
    "We build an intelligence configuration inside your marketing team, on your own keys. Creative production, operations and review run on it.",
  survey: {
    titleDesig: "SVC / TITLE · 01",
    briefDesig: "SVC / BRIEF · 02",
    state: "Open",
    titleCoord: "0344 / 0260",
    briefCoord: "1588 / 0260",
  },
} as const;
