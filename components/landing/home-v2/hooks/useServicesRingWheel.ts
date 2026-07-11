"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * useServicesRingWheel — direct wheel control of the ADR-029 card ring
 * (Update 2, Vince: "if you hover over the cards in the brandmark, if you
 * scroll with your mouse it rotates. If you move your mouse below it, then
 * it scrolls to the next section").
 *
 * While the services stage is PINNED and the instrument is PARKED, a wheel
 * gesture with the pointer in the INSTRUMENT BAND (the upper portion of the
 * viewport where the mark + cards live) snaps the ring one beat per gesture
 * — implemented through the existing `selectService` smooth-scroll, so the
 * runway scroll position stays the single owner of rotation (no second
 * rotation writer; the spring/dwell choreography plays unchanged).
 *
 * Zones and edges:
 *   - pointer BELOW the band (the readout strip and under): untouched —
 *     native scrolling walks the remaining beats and exits the section;
 *   - wheel DOWN at the last card: consumed and HELD (the instrument keeps
 *     the pin; moving the pointer below is the way onward);
 *   - wheel UP at the first card / during the lead-in: passes through, so
 *     scrolling back out of the section stays natural.
 *
 * The landing page has no smooth-scroll library (no Lenis on this route) —
 * a non-passive window listener with preventDefault owns the gesture
 * cleanly. Desktop-only by construction: the hook is enabled only in ring
 * mode (≥ 961px + no reduced motion), and touch scrolling never emits
 * wheel events.
 */

/** Pointer above this fraction of the viewport height counts as "over the
 *  instrument"; below it (readout strip and under) wheel stays native. */
const INSTRUMENT_BAND_BOTTOM = 0.78;

/** Accumulated |deltaY| that triggers a beat snap (one mouse notch ≈ 100;
 *  trackpads accumulate across a few events). */
const WHEEL_STEP_THRESHOLD = 80;

/** One snap per gesture — ignore further deltas while the smooth scroll to
 *  the next beat is still travelling. */
const SNAP_COOLDOWN_MS = 650;

/** The instrument owns the wheel only once essentially parked (same clock
 *  the anchors publish on). */
const PARKED_DISSIPATE = 0.9;

export interface ServicesRingWheelOptions {
  /** Ring mode active (desktop gate × flag) — hook is inert otherwise. */
  enabled: boolean;
  /** 0-based index of the active service (SERVICES order). */
  activeIndex: number;
  /** True during the step-0 lead-in (no card open yet). */
  leadIn: boolean;
  serviceCount: number;
  /** Snap to service `index` — ServicesStage's `selectService`. */
  onStep: (index: number) => void;
}

export function useServicesRingWheel(
  stageRef: RefObject<HTMLElement | null>,
  { enabled, activeIndex, leadIn, serviceCount, onStep }: ServicesRingWheelOptions
): void {
  // Gesture state lives OUTSIDE the effect: `activeIndex` changes re-run it
  // mid-animation (the step flips while the snap scroll travels), and a
  // fresh closure must not reset the cooldown or the accumulator.
  const accRef = useRef(0);
  const lastSnapRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const onWheel = (event: WheelEvent) => {
      const stage = stageRef.current;
      if (!stage || event.defaultPrevented) return;

      const vh = window.innerHeight || 1;
      // Below the instrument band → native scroll ("move your mouse below
      // it, then it scrolls to the next section").
      if (event.clientY > vh * INSTRUMENT_BAND_BOTTOM) return;

      // Only while the runway pins the stage.
      const runway = stage.parentElement; // .services-stage-root
      if (!runway) return;
      const rect = runway.getBoundingClientRect();
      if (rect.top > 1 || rect.bottom < vh - 1) return;

      // Only once the instrument is parked (entrance/dive stay scroll-owned).
      const raw = parseFloat(
        document.documentElement.style.getPropertyValue("--corridor-dissipate")
      );
      const dissipate = Number.isFinite(raw) ? raw : 1;
      if (dissipate < PARKED_DISSIPATE) return;

      const direction = event.deltaY > 0 ? 1 : event.deltaY < 0 ? -1 : 0;
      if (!direction) return;

      // Reverse at the first card / lead-in exits upward naturally.
      if (direction < 0 && (leadIn || activeIndex <= 0)) return;

      // From here the instrument owns the gesture — including the HOLD at
      // the last card (preventDefault with no snap).
      event.preventDefault();
      event.stopPropagation();

      const now = performance.now();
      if (now - lastSnapRef.current < SNAP_COOLDOWN_MS) return;

      // Direction flip clears the accumulator so opposing residue never
      // cancels a deliberate gesture.
      if (Math.sign(accRef.current) !== direction) accRef.current = 0;
      accRef.current += event.deltaY;
      if (Math.abs(accRef.current) < WHEEL_STEP_THRESHOLD) return;
      accRef.current = 0;

      const next = leadIn && direction > 0 ? 0 : activeIndex + direction;
      if (next < 0 || next >= serviceCount) return; // held at the down-end
      lastSnapRef.current = now;
      onStep(next);
    };

    // Window-level because large stage regions are pointer-events:none (the
    // wheel then targets <body>, bypassing a stage listener). Non-passive:
    // we preventDefault to keep the pin while the pointer is on the
    // instrument. No other wheel listener exists on this route.
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [enabled, stageRef, activeIndex, leadIn, serviceCount, onStep]);
}
