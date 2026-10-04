"use client";

import { useRef } from "react";

import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { ArcWorkedSwitch } from "@/components/arcs/ArcWorkedSwitch";
import { useArcReveal } from "@/components/arcs/useArcReveal";
import { SURI_LUNCH_AND_LEARN_ARC } from "@/lib/arcs/content/suri-lunch-and-learn";

/**
 * The lunch and learn's arc, mounted into `#workshop` (ADR-147).
 *
 * v2's tail shape (not v3's): one run of sections, no breakdown to split
 * around, and the one island the switched beats need. The switch is mounted
 * HERE, beside the sections it switches, for v2's reason: an island that
 * queries `.arc-root` should be inside the tree that renders it so it cannot
 * outlive it.
 *
 * ⚠ NOT `ArcShell`, for v1's reason: `LandingPage` already brings the HUD
 * chrome, the hero boot and the scroll writer. What is copied is the reveal
 * opt-in and the root's two attributes.
 *
 * Default export, because `WorkshopPortals` mounts it through `lazy()`.
 */
export default function SuriLunchAndLearnTail() {
  const rootRef = useRef<HTMLDivElement>(null);
  useArcReveal({ rootRef, selector: ".arc-reveal", jsClass: "is-arc-js" });

  return (
    <div
      ref={rootRef}
      className="arc-root arc-root--detail tw-arc__root"
      data-arc-format={SURI_LUNCH_AND_LEARN_ARC.format}
    >
      <ArcSectionRenderer sections={SURI_LUNCH_AND_LEARN_ARC.sections} />
      <ArcWorkedSwitch />
    </div>
  );
}
