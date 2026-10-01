"use client";

import { useRef } from "react";

import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { useArcReveal } from "@/components/arcs/useArcReveal";
import { AP_HOGESCHOOL_ARC } from "@/lib/arcs/content/ap-hogeschool";

/**
 * The lecture's arc, mounted into `#workshop` (ADR-141).
 *
 * v2's tail with one difference besides the record it renders: NO worked
 * switch. This page carries no switched beats, so the island that queries
 * `.arc-root` for them is not mounted at all, rather than mounted over nothing.
 *
 * ⚠ NOT `ArcShell`, for v1's reason: `LandingPage` already brings the HUD
 * chrome, the hero boot and the scroll writer. What is copied is the reveal
 * opt-in and the root's two attributes.
 *
 * Default export, because `WorkshopPortals` mounts it through `lazy()`.
 */
export default function ApHogeschoolTail() {
  const rootRef = useRef<HTMLDivElement>(null);
  useArcReveal({ rootRef, selector: ".arc-reveal", jsClass: "is-arc-js" });

  return (
    <div
      ref={rootRef}
      className="arc-root arc-root--detail tw-arc__root"
      data-arc-format={AP_HOGESCHOOL_ARC.format}
    >
      <ArcSectionRenderer sections={AP_HOGESCHOOL_ARC.sections} />
    </div>
  );
}
