import type { FlightVars } from "./pdaFlight";

/**
 * The skill chip's SHAPE MORPH (ADR-071 U1) — two path strings with one
 * command structure, interpolable by CSS `d`. Declared here rather than in
 * `PdaCarrier` because the entry type must not import a drawing: reading 02
 * consumes the same entry, and an entry-module → drawing-module edge is an
 * import cycle waiting for the next refactor.
 */
export interface ChipMorph {
  from: string;
  to: string;
}

/**
 * HOW THE SELECTION ENTERS a reading it has just been shown in.
 *
 * `flight` is the morph — the object travels from the home it had in the
 * outgoing reading (`pdaFlight.ts` computes the pose). `bloom` is the gesture
 * for arriving from a reading that had no home for it. `raster` is everything
 * else, which is the drawing's own staggered entrance.
 *
 * ⚠ **A SKILL FLIGHT CARRIES TWO INSTRUMENTS** (ADR-071 U1): `morph` is the
 * PLATE's journey (the path itself interpolates, so the shape changes en
 * route — no transform involved), and the base `dx/dy/dk/dr` are the NAME's
 * dock vars, computed on the name's OWN rects because the name is
 * left-anchored in the plate and centre-anchored on the arc. Work-card
 * flights carry neither `morph` nor `dr` and are byte-identical to before.
 *
 * In its own module because BOTH readings that own a home for the selection
 * need it, and reading 02's drawing also supplies reading 01's crop — one
 * shared type is what keeps that from becoming an import cycle.
 */
export type PdaEntry =
  | { kind: "raster" }
  | { kind: "bloom" }
  | ({ kind: "flight" } & FlightVars & { morph?: ChipMorph });
