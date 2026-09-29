"use client";

import { useRef } from "react";

import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { useArcReveal } from "@/components/arcs/useArcReveal";
import { THOUGHTFORM_WORKSHOP_ARC } from "@/lib/arcs/content/thoughtform-workshop";

/**
 * The workshop arc, mounted into `#workshop` (ADR-137).
 *
 * ⚠ THE REAL RENDERER, NOT A PAGE-LOCAL SWITCH. The Trinny route switches
 * over five kinds to keep `ArcSectionRenderer`'s graph off its page; this tail
 * needs a dozen (stages, curve, horizon, bench, anatomy, close …), and it is
 * only ever reached through `lazy()` in `WorkshopPortals`, so the renderer —
 * and the holo stage's own `next/dynamic` seam behind it — stays off the
 * route's first paint.
 *
 * ⚠ NOT `ArcShell`: that injects the HUD chrome, the hero boot and the scroll
 * writer, all of which this page already has from `LandingPage`. What is
 * copied is the reveal opt-in (`useArcReveal`, the class and the observer
 * added together) and the root's two attributes, so the workshop format's
 * layout law reaches these beats as it does on a real arc.
 *
 * Default export, because `WorkshopPortals` mounts it through `lazy()`.
 */
export default function WorkshopTail() {
  const rootRef = useRef<HTMLDivElement>(null);
  useArcReveal({ rootRef, selector: ".arc-reveal", jsClass: "is-arc-js" });

  return (
    <div
      ref={rootRef}
      className="arc-root arc-root--detail tw-arc__root"
      data-arc-format={THOUGHTFORM_WORKSHOP_ARC.format}
    >
      <ArcSectionRenderer sections={THOUGHTFORM_WORKSHOP_ARC.sections} />
    </div>
  );
}
