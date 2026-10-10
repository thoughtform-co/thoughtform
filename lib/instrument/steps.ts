import type { InstrumentRecord, PartId } from "./types";

/**
 * The organisation altitude, read in steps (the proposal system,
 * 2026-10-10): the order the stack's slabs and callouts light when the beat
 * is pinned, bottom-up: the organisation's slab and the three parts that
 * come with it (the model, the data, the interface), then the layer the team
 * writes and its two parts (the context, the evaluations), then the
 * workstreams and the owner. DERIVED from the record, never authored: a step
 * is a thing on the drawing, in the order a reader builds the stack.
 */
export type InsStepId = "slab-org" | "slab-layer" | "tiles" | PartId;

const ORG_PARTS: readonly PartId[] = ["model", "data", "interface"];
const LAYER_PARTS: readonly PartId[] = ["context", "evals"];

export function insStepOrder(record: InstrumentRecord): InsStepId[] {
  const has = (id: PartId) => record.parts.some((p) => p.id === id);
  const out: InsStepId[] = [
    "slab-org",
    ...ORG_PARTS.filter(has),
    "slab-layer",
    ...LAYER_PARTS.filter(has),
  ];
  if (record.org?.workstreams.length) out.push("tiles");
  if (has("owner")) out.push("owner");
  return out;
}

/** 1-based step of a thing on the drawing, or undefined off the stack. */
export function insStepOf(order: readonly InsStepId[], id: InsStepId): number | undefined {
  const i = order.indexOf(id);
  return i < 0 ? undefined : i + 1;
}
