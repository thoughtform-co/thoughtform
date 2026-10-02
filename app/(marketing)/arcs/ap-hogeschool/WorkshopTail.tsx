"use client";

import { useRef } from "react";

import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { useArcReveal } from "@/components/arcs/useArcReveal";
import { AP_HOGESCHOOL_ARC } from "@/lib/arcs/content/ap-hogeschool";

import { PromptToLoop } from "./PromptToLoop";

/* The Prompt to Loop breakdown sits where the anchor beat was, between the
   ITP wall and the ambition beat (ADR-141 U3); the arc renders on either
   side of it with its numbering carried across. */
const SPLIT = AP_HOGESCHOOL_ARC.sections.findIndex((s) => s.id === "ambition");
const BEFORE = AP_HOGESCHOOL_ARC.sections.slice(0, SPLIT);
const AFTER = AP_HOGESCHOOL_ARC.sections.slice(SPLIT);

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
      <ArcSectionRenderer sections={BEFORE} />
      <PromptToLoop startIndex={BEFORE.length} />
      <ArcSectionRenderer sections={AFTER} indexOffset={BEFORE.length} />
    </div>
  );
}
