import type { FlightVars } from "./pdaFlight";

/**
 * HOW THE SELECTION ENTERS a reading it has just been shown in.
 *
 * `flight` is the morph — the object travels from the home it had in the
 * outgoing reading (`pdaFlight.ts` computes the pose). `bloom` is the gesture
 * for arriving from a reading that had no home for it. `raster` is everything
 * else, which is the drawing's own staggered entrance.
 *
 * In its own module because BOTH readings that own a home for the selection
 * need it, and reading 02's drawing also supplies reading 01's crop — one
 * shared type is what keeps that from becoming an import cycle.
 */
export type PdaEntry = { kind: "raster" } | { kind: "bloom" } | ({ kind: "flight" } & FlightVars);
