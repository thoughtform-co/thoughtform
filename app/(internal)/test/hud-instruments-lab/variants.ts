/**
 * The design routes under study, and the orthogonal layers they compose.
 *
 * `v0` is always OFF — production verbatim, the A/B control. Its job is to
 * be pixel-identical to the bare frame; if it is not, the harness is lying
 * and no judgement made against it is worth anything.
 *
 * ROUND 2 (owner, 2026-07-31). Round 1's left rail seated its marks at each
 * section's true scroll detent, and the verdict was that it "just feels
 * like showing progression". It did, and the cause was structural rather
 * than cosmetic: detent-proportional placement makes the rail a SCALE, and
 * a scale is a progress bar however it is styled. The roster routes fix it
 * by making position STRUCTURE — six fixed seats, state does the moving.
 * `v1` survives as the reference for the read that was rejected.
 *
 * `v2` (drawn station glyphs) is RETIRED. At 14×10 every silhouette
 * collapsed into the same rectangle; re-cut deeper on an 18×12 box, four of
 * six were still indistinguishable, and the only two that read — services
 * and practice — were distinguished by INNER RULES, not by outline. The
 * finding is kept in `glyphs.ts`, which stays on disk unmounted.
 *
 * ROUND 3 (owner mockup, 2026-08-02) — `r4`. Rounds 1 and 2 both ran the
 * marks along the LEFT RAIL and argued about the spacing; anything on a rail
 * is on a scale, and the roster only escaped the progress-bar read by nailing
 * the seats down. Round 3 leaves the ladder alone entirely and groups the
 * sections by ROLE in the two working corners, so position says what a
 * section IS rather than how far down it sits. It also re-opens the glyph
 * question v2 closed — but as open stroke figures rather than a shared
 * bordered box with a notch cut out of it. See `instruments/sectionGlyphs.tsx`
 * for why that is a fair second hearing and not a repeat.
 *
 * The layers are independent on purpose: the owner should not be stuck with
 * curated combinations. Selecting a route seeds the layer set; toggling a
 * layer overrides it.
 */

export type LayerId =
  /** Left rail: SIX STATIONARY SLOTS, one per section. The round-2 answer. */
  | "lRoster"
  /** Left rail: the active slot expands to its full name. */
  | "lExpand"
  /** Left rail: draw each slot's bounded plate, not just its tab + code. */
  | "lBays"
  /** Left rail: round-1's accruing ordinals at true detents (the rejected read). */
  | "lIndex"
  /** Left rail: round-1's travelling selection bracket. */
  | "lBracket"
  /** Left rail foot: the manifest summary above the wordmark. */
  | "lFoot"
  /** Right rail: printed graduations on every other tick. */
  | "rScale"
  /** Right rail: continuous pointer + range readout. */
  | "rPointer"
  /** Right rail: stacked key/value readouts on ticks 2 / 6 / 11. */
  | "rTelemetry"
  /** Right rail: the active section's name, set vertically. */
  | "rName"
  /** Top-left corner: the sector stamp, working inward from the bracket. */
  | "cTl"
  /** Bottom-right corner: the range register. */
  | "cBr"
  /** Top-left cluster: the whole journey as marks. Round 3. */
  | "nJourney"
  /** Scaffolding: print every mark's name at once, and show reserved space. */
  | "nExplain";

export const LAYER_LABELS: Readonly<Record<LayerId, string>> = {
  lRoster: "L·roster",
  lExpand: "L·expand",
  lBays: "L·bays",
  lIndex: "L·index",
  lBracket: "L·bracket",
  lFoot: "L·foot",
  rScale: "R·scale",
  rPointer: "R·pointer",
  rTelemetry: "R·telemetry",
  rName: "R·name",
  cTl: "C·TL",
  cBr: "C·BR",
  nJourney: "N·journey",
  nExplain: "N·explain",
};

export const ALL_LAYERS: readonly LayerId[] = Object.keys(LAYER_LABELS) as LayerId[];

export interface HudInstrumentVariant {
  /** Also the `?v=` deep-link value and the `data-hil-variant` attribute. */
  id: string;
  label: string;
  /** What to look for when judging it. */
  thesis: string;
  /** The instrument reference it is drawn from. */
  provenance: string;
  layers: readonly LayerId[];
}

export const HUD_INSTRUMENT_VARIANTS: readonly HudInstrumentVariant[] = [
  {
    id: "v0",
    label: "OFF",
    thesis:
      "Production verbatim — the frame as it ships. The control: everything below is judged as a delta from this, so check that it looks like nothing was added.",
    provenance: "thoughtform.co — the shipped HUD frame",
    layers: [],
  },
  {
    id: "r1",
    label: "Station roster",
    thesis:
      "Six STATIONARY seats, one per section, on fixed rungs of the tick ladder. The seat is always there; its designation fills in as you reach it, and the live one lights, plugs into the track and opens to its full name. Position is structure — only state moves. Toggle L·bays OFF to see why the outlines are load-bearing: without them the unreached seats vanish and it collapses back into a progress bar.",
    provenance: "Cyberpunk part list · Stellaris outliner — a roster, not a scale",
    layers: ["lRoster", "lExpand", "lBays", "rScale", "rPointer"],
  },
  {
    id: "r2",
    label: "System bays",
    thesis:
      "The roster with each slot drawn as a bounded bay rather than a tab and a code, plus both corners and the rail foot carrying real values. The densest honest read — check whether the bays earn their outline or whether the tabs were already enough.",
    provenance: "RAVENS-THR cutaway panels · THE SPARK chapter box",
    layers: ["lRoster", "lExpand", "lBays", "lFoot", "rScale", "rPointer", "cTl", "cBr"],
  },
  {
    id: "r3",
    label: "Roster + telemetry",
    thesis:
      "The roster on the left, the key/value register on the right instead of the graduated scale. Left names the places, right reads the state. More words, no more marks.",
    provenance: "RAVENS-THR · THE SPARK's top-right status stack",
    layers: ["lRoster", "lExpand", "lFoot", "rTelemetry", "rName", "cTl"],
  },
  {
    id: "r4",
    label: "Corner clusters",
    thesis:
      "The sections leave the ladder and group by ROLE: five approach beats top-left, five destinations bottom-right, split LOG | DOCK after ABOUT. Each cluster REPLACES its corner bracket and its terminal mark is centred on that rail's track line, so the row and the ladder share an edge instead of being three unrelated objects in a corner. The dock seats on the right rail's bottom terminus — the line already defined as clearing the wordmark and the ADR-058 toggle. Judge two things: whether grouping reads as meaning rather than as leftover marks, and whether the glyphs survive without their labels (N·explain names them, then turn it off). If you need the labels, the set has failed the way v2 did.",
    provenance: "Owner mockup, 2026-08-02 — HUD Rail Instruments",
    layers: ["nJourney"],
  },
  {
    id: "v1",
    label: "Bearing log (round 1)",
    thesis:
      "Kept as the REFERENCE for the read that was rejected. Marks sit at each section's true scroll detent, so the rail is a scale and the result is a progress bar. Useful directly against r1 — same ink, completely different object.",
    provenance: "Departure Mono spec sheet — the bracketed [775] index",
    layers: ["lIndex", "lBracket", "rPointer"],
  },
  {
    id: "v5",
    label: "Full",
    thesis:
      "Every layer at once, including both round-1 and round-2 left rails. Not a candidate — the ceiling, so you can subtract toward what you want.",
    provenance: "—",
    layers: ALL_LAYERS,
  },
];
