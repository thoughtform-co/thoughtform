"use client";

import { useRef } from "react";

import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { PromptToLoop } from "@/components/arcs/prompt-to-loop/PromptToLoop";
import { useArcReveal } from "@/components/arcs/useArcReveal";
import { THOUGHTFORM_WORKSHOP_V3_ARC } from "@/lib/arcs/content/thoughtform-workshop-v3";

import {
  AT_BREAKDOWN,
  AT_CLOSE,
  AT_ECONOMICS,
  AT_JUST_ASK,
  V3_BREAKDOWN,
  V3_CLOSE,
  V3_ECONOMICS,
  V3_JUST_ASK,
  V3_SITUATION,
} from "./runs";

/**
 * The third house cut's arc, mounted into `#workshop` (ADR-143).
 *
 * The AP lecture's tail with one difference besides the record it renders:
 * the breakdown is SPLIT (`runs.ts`), because this page's economics chapter
 * answers its cost slide and the breakdown's last slide closes the proof
 * after it. No worked switch, for the lecture's reason: nothing on this page
 * is switched.
 *
 * ⚠ NOT `ArcShell`, for v1's reason: `LandingPage` already brings the HUD
 * chrome, the hero boot and the scroll writer. What is copied is the reveal
 * opt-in and the root's two attributes.
 *
 * Default export, because `WorkshopPortals` mounts it through `lazy()`.
 */
export default function WorkshopV3Tail() {
  const rootRef = useRef<HTMLDivElement>(null);
  useArcReveal({ rootRef, selector: ".arc-reveal", jsClass: "is-arc-js" });

  return (
    <div
      ref={rootRef}
      className="arc-root arc-root--detail tw-arc__root"
      data-arc-format={THOUGHTFORM_WORKSHOP_V3_ARC.format}
    >
      <ArcSectionRenderer sections={V3_SITUATION} />
      <PromptToLoop startIndex={AT_BREAKDOWN} slides={V3_BREAKDOWN} />
      <ArcSectionRenderer sections={V3_ECONOMICS} indexOffset={AT_ECONOMICS} />
      <PromptToLoop startIndex={AT_JUST_ASK} slides={V3_JUST_ASK} />
      <ArcSectionRenderer sections={V3_CLOSE} indexOffset={AT_CLOSE} />
    </div>
  );
}
