"use client";

import { useRef } from "react";

import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { useArcReveal } from "@/components/arcs/useArcReveal";
import { UX_MEETUP_ARC } from "@/lib/arcs/content/ux-meetup";

/**
 * The talk's arc, mounted into `#workshop` (ADR-156).
 *
 * The lecture's tail without a breakdown to split around: one run of
 * sections, and NO worked switch, because this page carries no switched
 * beats.
 *
 * ⚠ NOT `ArcShell`, for v1's reason: `LandingPage` already brings the HUD
 * chrome, the hero boot and the scroll writer. What is copied is the reveal
 * opt-in and the root's two attributes.
 *
 * Default export, because `WorkshopPortals` mounts it through `lazy()`.
 */
export default function UxMeetupTail() {
  const rootRef = useRef<HTMLDivElement>(null);
  useArcReveal({ rootRef, selector: ".arc-reveal", jsClass: "is-arc-js" });

  return (
    <div
      ref={rootRef}
      className="arc-root arc-root--detail tw-arc__root"
      data-arc-format={UX_MEETUP_ARC.format}
    >
      <ArcSectionRenderer sections={UX_MEETUP_ARC.sections} />
    </div>
  );
}
