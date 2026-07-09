/**
 * serviceDesignations — small mono callouts pinned to named wireframe
 * features (`BrandmarkFeatureId`) for the CV / spacecraft-cutaway
 * annotation layer (ADR-025 Update 9, 2026-07-09).
 *
 * The designation set changes with the active service so the mark reads
 * as being interrogated for the service's substance:
 *   Keynote  → the frame (AI STRATEGY, LIVE DEMOS, SHARED LANGUAGE, ...)
 *   Workshop → the material (REAL BACKLOG, ENCODED SKILLS, ...)
 *   Embedded → the layer (GOVERNANCE, TOKEN BUDGETS, ...)
 *   Guided Build → the build seam (ARCHITECTURE, EVAL DESIGN, ...)
 *
 * Copy is intentionally accessible (business terms, not internal
 * codenames — no Vesper / Heimdall / etc. per the external-evidence rule
 * in the strategy skill), and short enough to stay one line in the
 * 12-14ch label box.
 *
 * Each designation points at one `BrandmarkFeatureId` and specifies:
 *   - `side`: "left" | "right" — which side of the anchor the label sits
 *   - `offset`: label displacement from the anchor in css pixels
 *     (positive dy = label BELOW the anchor)
 * Positions are hand-tuned so the four visible labels per service form a
 * legible constellation around the mark and don't collide with the racks.
 */

import type { BrandmarkFeatureId } from "@/components/landing/home-v2/brandmarkScanAnchorsRef";
import type { ServiceId } from "@/components/landing/home-v2/services/serviceData";

export interface ServiceDesignation {
  featureId: BrandmarkFeatureId;
  /** Uppercase mono label (12-14ch max, one line). */
  label: string;
  /** Small mono detail line below the label (18-22ch). Kept brief so the
   *  callout stays a designation, not a body caption. */
  detail: string;
  /** Which side of the ANCHOR the label lands on. Governs the leader
   *  direction and the text alignment: `right` = text starts at the
   *  landing point and grows rightward, `left` = text ends at it. */
  side: "left" | "right";
  /** Label displacement from the anchor, css pixels — kept SMALL so the
   *  label sits INSIDE the mark's footprint (interior-callout pass,
   *  2026-07-09): the leader is a short hook from the part into the type,
   *  like the IMU reference's "STABLE MEMBER". `dx` respects `side`;
   *  positive `dy` is downward. */
  offset: { dx: number; dy: number };
}

const D = (
  featureId: BrandmarkFeatureId,
  label: string,
  detail: string,
  side: "left" | "right",
  dx: number,
  dy: number
): ServiceDesignation => ({ featureId, label, detail, side, offset: { dx, dy } });

/** Four designations per service. Order matters: each takes a stagger
 *  index for the draw-on + the scramble-decode start offset.
 *
 *  Positioning rule (2026-07-09 interior-callout pass, Vince review "they
 *  don't need to live outside"): labels sit INSIDE the mark's footprint,
 *  each a short hook off its own anchor — arm labels grow INWARD (an
 *  upper-left anchor takes `side: "right"` so the type crosses toward the
 *  centre), crown labels tuck just above their anchor, base labels just
 *  below. Wires passing behind the caps are expected — that's the IMU
 *  reference look — and the void text-shadow keeps them legible. The base
 *  slot always carries the service's arc designation (NAVIGATE / ENCODE /
 *  BUILD / HANDOVER DATED). `core` stays published for future use but
 *  hosts no label (the centre is the densest ink — a label there never
 *  reads). */
/** Pocket rule: the mark's interior has four relatively quiet quadrant
 *  pockets between the crossbar and the sword. Arm labels tuck into their
 *  own arm's pocket — a small `dx` hook off the anchor plus a `dy` that
 *  clears the crossbar (±~46px) — with LEFT-pocket text growing rightward
 *  (`side: "right"`) and RIGHT-pocket text growing leftward
 *  (`side: "left"`), so the type stays off the dense center sword. */
/* Keyed by the fixed spatial-slot ids (see servicePlateData). The service in
 * each slot changed 2026-07-09, so the LABELS are re-authored per slot while
 * the spatial params (featureId / side / dx / dy) stay tuned to the rack
 * position they were placed for:
 *   keynote  slot → 01 Strategic Advisory
 *   workshop slot → 02 Embedded AI Partner
 *   embedded slot → 03 Keynote
 *   guided   slot → 04 Workshop */
export const SERVICE_DESIGNATIONS: Record<ServiceId, readonly ServiceDesignation[]> = {
  // 01 Strategic Advisory
  keynote: [
    D("crown", "AI STRATEGY", "the standing read", "right", 36, -26),
    D("upper-left-arm", "WHERE TO INVEST", "and what to ignore", "right", 24, -60),
    D("lower-right-arm", "TESTED LIVE", "against real work", "left", 24, 60),
    D("base", "NAVIGATE", "the operating posture", "left", 36, 36),
  ],
  // 02 Embedded AI Partner
  workshop: [
    D("crown", "OWNED LAYER", "stays with you", "left", 36, -26),
    D("upper-right-arm", "SHIPPED TOOLS", "inside your teams", "left", 24, -60),
    D("lower-left-arm", "TRAINED PEOPLE", "who can run it", "right", 24, 60),
    D("base", "BUILD", "on a fixed term", "right", 36, 36),
  ],
  // 03 Keynote
  embedded: [
    D("crown", "AI STRATEGY", "the shared frame", "left", 36, -26),
    D("upper-right-arm", "LIVE DEMOS", "on the room's work", "left", 24, -60),
    D("lower-left-arm", "SHARED LANGUAGE", "afterward", "right", 24, 60),
    D("base", "NAVIGATE", "the operating posture", "right", 36, 36),
  ],
  // 04 Workshop
  "guided-build": [
    D("crown", "REAL BACKLOG", "the team's own briefs", "right", 36, -26),
    D("upper-left-arm", "JUDGMENT POINTS", "where humans decide", "right", 24, -60),
    D("lower-right-arm", "ENCODED SKILLS", "kept after we leave", "left", 24, 60),
    D("base", "ENCODE", "capture what works", "left", 36, 36),
  ],
};
