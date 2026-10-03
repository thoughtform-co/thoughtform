"use client";

import { useRef } from "react";

import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { ArcWorkedSwitch } from "@/components/arcs/ArcWorkedSwitch";
import { useArcReveal } from "@/components/arcs/useArcReveal";
import { THOUGHTFORM_WORKSHOP_V2_ARC } from "@/lib/arcs/content/thoughtform-workshop-v2";

/**
 * The second cut's arc, mounted into `#workshop` (ADR-139).
 *
 * v1's tail with two differences: it renders the v2 record, and it mounts the
 * one island the switched chapter needs.
 *
 * ⚠ THE SWITCH IS MOUNTED HERE, BESIDE THE SECTIONS IT SWITCHES, not in the
 * portals. The portals own what belongs to the PAGE — the ring attribute, the
 * nested roots, the About flow; this belongs to the arc, and an island that
 * queries `.arc-root` should be inside the tree that renders it so it cannot
 * outlive it.
 *
 * ⚠ NOT `ArcShell`, for v1's reason: `LandingPage` already brings the HUD
 * chrome, the hero boot and the scroll writer. What is copied is the reveal
 * opt-in and the root's two attributes.
 *
 * Default export, because `WorkshopPortals` mounts it through `lazy()`.
 */
export default function WorkshopV2Tail() {
  const rootRef = useRef<HTMLDivElement>(null);
  useArcReveal({ rootRef, selector: ".arc-reveal", jsClass: "is-arc-js" });

  return (
    <div
      ref={rootRef}
      className="arc-root arc-root--detail tw-arc__root"
      data-arc-format={THOUGHTFORM_WORKSHOP_V2_ARC.format}
    >
      <ArcSectionRenderer sections={THOUGHTFORM_WORKSHOP_V2_ARC.sections} />
      <ArcWorkedSwitch />
    </div>
  );
}
