// Cross-root bridge for the ADR-050 open spec plate.
//
// When a service's DOM plate is open, the WebGL front card must HIDE — the
// plate IS that card popped open, not a second component in front of it
// (owner, 2026-07-26: "this is one entity"). The plate lives in the services
// DOM root, the card in the corridor R3F canvas — separate React roots, so
// the open state crosses the seam through a module-level ref, the
// `ringProgressRef` precedent.
//
// Single-writer contract: `ServiceOpenPlate` (the plate's owner) writes
// `serviceId`; `ServicesCardRing` reads it once per WebGL frame and damps the
// matching card's materials out — while STILL projecting and publishing its
// screen rect, which is what the plate rides to inherit the rig's
// pointer-look. Nobody else writes.
//
// Three-free on purpose (the `ringCtaBox` lesson): the DOM side imports this
// without dragging the WebGL stack into First Load JS.

import type { ServiceId } from "@/components/landing/home-v2/services/serviceData";

export interface OpenPlateState {
  /** The service whose DOM plate is open, or null when none. */
  serviceId: ServiceId | null;
}

export const openPlateRef: { current: OpenPlateState } = {
  current: { serviceId: null },
};
