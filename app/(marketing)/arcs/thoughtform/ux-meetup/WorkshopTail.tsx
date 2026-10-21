"use client";

import { useCallback, useRef } from "react";

import { ArcSectionRenderer } from "@/components/arcs/ArcSectionRenderer";
import { ARC_TERMINAL_MEDIA } from "@/components/arcs/arcMotion";
import { useArcReveal } from "@/components/arcs/useArcReveal";
import { useArcTerminalMotion } from "@/components/arcs/useArcTerminalMotion";
import { UX_MEETUP_ARC } from "@/lib/arcs/content/ux-meetup";

import { FoundationAct } from "./FoundationAct";
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
 * The reader also decides WHICH BEAT IS UP (owner, 2026-10-15: "I don't want
 * any section or any black pane sliding over anything"). Exactly one beat is
 * active at a time, the one whose slot holds the scroll (a slot runs from its
 * park to the next beat's park); only it shows its plane, and the ground is
 * on only while one is active. Before the first beat parks nothing of the
 * talk paints, so the eras finish clean; after the last, the ground switches
 * off in place and the corridor's thesis, already held underneath, is there.
 * The decode hook still types and un-types the words; it no longer decides
 * whether a drawing is seen (that hid whole beats on the way back up).
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

  const state = useRef<{ ground: boolean | null; active: HTMLElement | null }>({
    ground: null,
    active: null,
  });
  const wide = useRef<MediaQueryList | null>(null);
  const onFrame = useCallback(
    (scrollY: number, vh: number) => {
      onBeatFrame(scrollY, vh);
      const root = rootRef.current;
      if (!root) return;
      /* Below the terminal tier the page flows and every beat is plainly
         there, so the ground is simply on: the talk reads on its own void
         and mark from its first beat to its last, and nothing behind it
         shows through between them (ADR-160). No beat to find per frame. */
      wide.current ??= window.matchMedia(ARC_TERMINAL_MEDIA);
      if (!wide.current.matches) {
        if (state.current.ground !== true) {
          state.current.ground = true;
          root.setAttribute("data-uxm-ground", "on");
        }
        return;
      }
      const beats = Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-arc-beat]"));
      const rects = beats.map((b) => b.getBoundingClientRect());
      let active: HTMLElement | null = null;
      for (let i = 0; i < beats.length; i++) {
        const parked = rects[i].top <= 0.5;
        const held = i < beats.length - 1 ? rects[i + 1].top > 0.5 : rects[i].bottom > vh;
        if (parked && held) {
          active = beats[i];
          break;
        }
      }
      const s = state.current;
      if (active !== s.active) {
        s.active?.removeAttribute("data-uxm-active");
        active?.setAttribute("data-uxm-active", "");
        s.active = active;
      }
      const on = active !== null;
      if (on !== s.ground) {
        s.ground = on;
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
      {/* What it can make, then the new interface: one scene over both beats
          (U5), above the terminal tier only. */}
      {MOTION === "terminal" ? <FoundationAct /> : null}
    </div>
  );
}
