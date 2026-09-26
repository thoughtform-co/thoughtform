/**
 * serviceDesignations — small mono callouts pinned to named wireframe
 * features (`BrandmarkFeatureId`) for the CV / spacecraft-cutaway
 * annotation layer (ADR-025 Update 9, 2026-07-09).
 *
 * The designation set changes with the active service so the mark reads
 * as being interrogated for the service's substance:
 *   Keynote  → the frame (SHARED FRAME, LIVE DEMOS, SHARED LANGUAGE, ...)
 *   Workshop → the material (REAL BACKLOG, ENCODED SKILLS, ...)
 *   Embedded → the configuration (THREE STAGES, YOUR OWN KEYS, TRAINED PEOPLE, ...)
 *   Home session → the table (AT THE TABLE, THE ARGUMENT, THE SKILL, ...)
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
 * each slot changed 2026-08-02 (the harmonization pass), so the LABELS moved
 * with their services while the spatial params (featureId / side / dx / dy)
 * stay tuned to the rack position they were placed for — the same split the
 * 2026-07-09 remap established:
 *   embedded slot → 01 Embedded      (Advisory folded in, ADR-112)
 *   keynote  slot → 02 Keynote
 *   workshop slot → 03 Workshop
 *   guided   slot → 04 Home session  (ADR-112)
 * The ordinals are RING order since 2026-09-26 (owner: Embedded leads); the
 * record order below stays slot order — it is a map, not a sequence. */
export const SERVICE_DESIGNATIONS: Record<ServiceId, readonly ServiceDesignation[]> = {
  // 02 Keynote
  keynote: [
    D("crown", "SHARED FRAME", "how the room sees AI", "right", 36, -26),
    D("upper-left-arm", "LIVE DEMOS", "on the room's work", "right", 24, -60),
    D("lower-right-arm", "SHARED LANGUAGE", "what the room keeps", "left", 24, 60),
    D("base", "NAVIGATE", "the operating posture", "left", 36, 36),
  ],
  // 03 Workshop
  workshop: [
    D("crown", "REAL BACKLOG", "the team's own briefs", "left", 36, -26),
    D("upper-right-arm", "JUDGMENT POINTS", "where humans decide", "left", 24, -60),
    D("lower-left-arm", "ENCODED SKILLS", "kept after we leave", "right", 24, 60),
    D("base", "ENCODE", "capture what works", "right", 36, 36),
  ],
  // 01 Embedded
  embedded: [
    // The crown's detail names the scope (ADR-124): the three stages run
    // from production to review.
    D("crown", "THREE STAGES", "production to review", "left", 36, -26),
    D("upper-right-arm", "YOUR OWN KEYS", "no seat to renew", "left", 24, -60),
    D("lower-left-arm", "TRAINED PEOPLE", "who run it after", "right", 24, 60),
    // Ownership moves to the base's detail, which is the slot that always
    // reads — stronger than a crown label saying it (ADR-111).
    // ADR-124 U1: the base's detail is where the turn is said on the
    // hologram; ownership sits in the title and `leavesWith`.
    D("base", "BUILD", "for the intelligence", "right", 36, 36),
  ],
  // 04 Home session (ADR-112) — the table, the argument, the skill; the
  // base keeps the arc designation (the session runs Navigate).
  "guided-build": [
    D("crown", "AT THE TABLE", "one morning, Antwerp", "right", 36, -26),
    D("upper-left-arm", "THE ARGUMENT", "in full, with time", "right", 24, -60),
    D("lower-right-arm", "THE SKILL", "by your own hand", "left", 24, 60),
    D("base", "NAVIGATE", "the operating posture", "left", 36, 36),
  ],
};
