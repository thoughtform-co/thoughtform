"use client";

import { useCallback, useRef } from "react";

import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { ARC_TERMINAL_MEDIA } from "@/components/arcs/arcMotion";
import { useArcReveal } from "@/components/arcs/useArcReveal";
import { useArcTerminalMotion } from "@/components/arcs/useArcTerminalMotion";
import { UX_MEETUP_ARC } from "@/lib/arcs/content/ux-meetup";

import { TalkAct } from "./TalkAct";
import { TalkGround } from "./TalkGround";
import { useTalkFrame } from "./useTalkFrame";

/**
 * The talk's arc, mounted into `#workshop` (ADR-156).
 *
 * ⚠ NOT `ArcShell`, for v1's reason: `LandingPage` already brings the HUD
 * chrome, the hero boot and the scroll writer. What is copied is the root's
 * attributes and, since U3, the terminal motion (ADR-057): every title
 * decodes where it stands and nothing slides (owner, 2026-10-15: "no
 * movement or travel, just a glitch effect"). Its frames come from the
 * talk's one READER (`useTalkFrame`), never a second scroll writer.
 *
 * The reader also switches the ground on: off while the talk's top is still
 * below the screen's top (the weld lays the talk over the eras' runway, and
 * an opaque ground there would cover the eras), on from the frame it parks.
 *
 * Default export, because `WorkshopPortals` mounts it through `lazy()`.
 */
const MOTION = UX_MEETUP_ARC.motion ?? "reveal";

export default function UxMeetupTail() {
  const rootRef = useRef<HTMLDivElement>(null);
  useArcReveal({
    rootRef,
    selector: ".arc-reveal",
    jsClass: "is-arc-js",
    skip: () => MOTION === "terminal" && window.matchMedia(ARC_TERMINAL_MEDIA).matches,
  });
  const onBeatFrame = useArcTerminalMotion({ rootRef, motion: MOTION, observeDocument: true });

  const groundOn = useRef<boolean | null>(null);
  const onFrame = useCallback(
    (scrollY: number, vh: number) => {
      onBeatFrame(scrollY, vh);
      const root = rootRef.current;
      if (!root) return;
      const on = root.getBoundingClientRect().top <= 1;
      if (on !== groundOn.current) {
        groundOn.current = on;
        root.setAttribute("data-uxm-ground", on ? "on" : "off");
      }
    },
    [onBeatFrame]
  );
  useTalkFrame(onFrame);

  return (
    <div
      ref={rootRef}
      className="arc-root arc-root--detail tw-arc__root"
      data-arc-format={UX_MEETUP_ARC.format}
      data-motion={MOTION === "terminal" ? "terminal" : undefined}
      data-uxm-ground="off"
    >
      <TalkGround />
      <ArcSectionRenderer sections={UX_MEETUP_ARC.sections} motion={MOTION} />
      {/* The proof's particle artifact (U3): above the terminal tier only. */}
      {MOTION === "terminal" ? <TalkAct /> : null}
    </div>
  );
}
