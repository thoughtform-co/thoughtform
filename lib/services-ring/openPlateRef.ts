// Cross-root bridge for the ADR-050 open state.
//
// Which service is "open" is decided in the services DOM tree, but the open
// state itself now RENDERS in the corridor R3F canvas as the card's own
// drawer (rev 3) — separate React roots, so the flag crosses the seam through
// a module-level ref, the `ringProgressRef` precedent.
//
// Single-writer contract: the surface that owns the open/closed state writes
// `serviceId` — today `CardFaceLabShell` (ADR-050 rev 3; the previous writer,
// the DOM `ServiceOpenPlate`, is deleted). `ServicesCardRing` reads it once
// per WebGL frame to drive the matching card's DRAWER open level. Nobody else
// writes.
//
// ⚠ Rev 2 used this ref to HIDE the card while a DOM plate covered it. That
// channel is gone: the open state is now the card's own in-canvas drawer, so
// the card must never be hidden again.
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
