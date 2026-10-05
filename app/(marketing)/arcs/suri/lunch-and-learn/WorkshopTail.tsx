"use client";

import { useRef } from "react";

import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { ArcWorkedSwitch } from "@/components/arcs/ArcWorkedSwitch";
import { PromptToLoop } from "@/components/arcs/prompt-to-loop/PromptToLoop";
import { PROMPT_TO_LOOP_SLIDES } from "@/components/arcs/prompt-to-loop/promptToLoopSlides";
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
/* ADR-147 U8: the page up to the loop, then Prompt to Loop from "How it
   runs" to the end, then the ending. One running index across the three runs. */
const SECTIONS = SURI_LUNCH_AND_LEARN_ARC.sections;
const AFTER_LOOP = SECTIONS.findIndex((s) => s.id === "loop-ad") + 1;
const BEFORE = SECTIONS.slice(0, AFTER_LOOP);
const AFTER = SECTIONS.slice(AFTER_LOOP);
const BREAKDOWN = PROMPT_TO_LOOP_SLIDES.slice(
  PROMPT_TO_LOOP_SLIDES.findIndex((s) => s.id === "ptl-runs")
);

export default function SuriLunchAndLearnTail() {
  const rootRef = useRef<HTMLDivElement>(null);
  useArcReveal({ rootRef, selector: ".arc-reveal", jsClass: "is-arc-js" });

  return (
    <div
      ref={rootRef}
      className="arc-root arc-root--detail tw-arc__root"
      data-arc-format={SURI_LUNCH_AND_LEARN_ARC.format}
    >
      <ArcSectionRenderer sections={BEFORE} />
      <PromptToLoop startIndex={BEFORE.length} slides={BREAKDOWN} />
      <ArcSectionRenderer sections={AFTER} indexOffset={BEFORE.length + BREAKDOWN.length} />
      <ArcWorkedSwitch />
    </div>
  );
}
