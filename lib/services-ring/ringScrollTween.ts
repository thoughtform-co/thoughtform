// Services Card Ring — programmatic runway scroll tween (ADR-029 Update 5).
//
// The wheel-snap and card-click paths used to ride the browser's native
// `window.scrollTo({ behavior: "smooth" })`. That easing is engine-owned:
// short, front-loaded, platform-dependent — and occasionally dropped
// entirely by Chrome when a previous smooth scroll is still in flight, which
// read as a dead gesture. Since the runway scroll position OWNS the ring
// rotation (ADR-029 §2), the browser's abrupt ease WAS the ring's perceived
// motion (the spring only shapes the last degrees). This module replaces it
// with an explicit rAF tween: smootherstep easing (C2 — zero velocity at
// both ends) over a distance-scaled duration, so a snapped beat reads as a
// genuine speed ramp.
//
// Contract:
//   - The tween writes ONLY the window scroll position (two-arg instant
//     scrollTo per frame) — the runway scroll stays the single rotation
//     owner; this is a scroll driver, not a second rotation writer.
//   - Any genuine user scroll intent cancels it instantly: an unconsumed
//     wheel event, a scrollbar grab, a touch, or a scroll key. The user is
//     never fought for the scroll position. (Since the 2026-07-15 native-
//     scroll pass this tween is driven ONLY by click-to-select — the
//     wheel-snap hijack that also used it is retired — so any wheel while
//     a click-glide is in flight now cleanly hands scroll back to the user.)
//   - `ringScrollTweenProgress()` reports glide progress (retained utility;
//     its wheel-snap chaining consumer was retired in the same pass).

import { smootherstep } from "./ringMath";

/** Keys the browser scrolls on — a press hands the scroll back to the user. */
const SCROLL_KEYS = new Set([
  " ",
  "Spacebar",
  "PageDown",
  "PageUp",
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
]);

interface ActiveTween {
  raf: number;
  fromY: number;
  toY: number;
  startedAt: number;
  durationMs: number;
  cleanup: () => void;
}

let active: ActiveTween | null = null;

/**
 * Duration (ms) for a snap travelling `distancePx`. Long enough that a
 * one-beat snap (~100svh ≈ 1000px → ~950 ms) reads as a glide with a real
 * ramp-in/ramp-out, capped so a far-card jump (3 beats) never becomes a
 * cutscene. Pure — exported for tuning/tests.
 */
export function ringSnapDurationMs(distancePx: number): number {
  const distance = Math.abs(distancePx);
  return Math.round(Math.min(1500, Math.max(620, 320 + distance * 0.62)));
}

/** 0..1 progress of the active tween; 1 when idle (nothing to wait for). */
export function ringScrollTweenProgress(): number {
  if (!active) return 1;
  const t = (performance.now() - active.startedAt) / active.durationMs;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function isRingScrollTweenActive(): boolean {
  return active !== null;
}

/** Stop the tween where it is — the scroll position simply stays put and
 *  whoever cancelled (user input, a chained snap) takes over. */
export function cancelRingScrollTween(): void {
  if (!active) return;
  cancelAnimationFrame(active.raf);
  active.cleanup();
  active = null;
}

/**
 * Glide the window scroll to `targetY`. Cancels any tween already in
 * flight (a chained beat restarts the ramp from the current position — the
 * ring spring bridges the small velocity dip).
 */
export function startRingScrollTween(targetY: number): void {
  if (typeof window === "undefined") return;
  cancelRingScrollTween();

  const doc = document.scrollingElement ?? document.documentElement;
  const maxY = Math.max(0, doc.scrollHeight - window.innerHeight);
  const fromY = window.scrollY;
  const toY = Math.min(maxY, Math.max(0, targetY));
  if (Math.abs(toY - fromY) < 1) return;

  const onWheel = (event: WheelEvent) => {
    // The ring wheel hook preventDefaults gestures it owns, but listener
    // order between it and us is not stable (its effect re-registers on
    // every step change), so the consumed check is deferred until every
    // handler on this event has run.
    window.setTimeout(() => {
      if (!event.defaultPrevented) cancelRingScrollTween();
    }, 0);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (SCROLL_KEYS.has(event.key)) cancelRingScrollTween();
  };
  const onGrab = () => cancelRingScrollTween();

  window.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("mousedown", onGrab);
  window.addEventListener("touchstart", onGrab, { passive: true });
  const cleanup = () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("mousedown", onGrab);
    window.removeEventListener("touchstart", onGrab);
  };

  const step = () => {
    if (!active) return;
    const t = (performance.now() - active.startedAt) / active.durationMs;
    if (t >= 1) {
      const finalY = active.toY;
      cancelRingScrollTween();
      // Explicit "instant": the landing page sets `html { scroll-behavior:
      // smooth }` (landing.css anchor-nav feel), and a two-arg / "auto"
      // scrollTo would ride THAT browser animation per write — every frame
      // of this tween would spawn its own smooth scroll and the ramp turns
      // to mush. Instant writes make the tween the sole easing authority.
      window.scrollTo({ top: finalY, behavior: "instant" });
      return;
    }
    const eased = smootherstep(0, 1, t);
    window.scrollTo({
      top: active.fromY + (active.toY - active.fromY) * eased,
      behavior: "instant",
    });
    active.raf = requestAnimationFrame(step);
  };

  active = {
    raf: requestAnimationFrame(step),
    fromY,
    toY,
    startedAt: performance.now(),
    durationMs: ringSnapDurationMs(toY - fromY),
    cleanup,
  };
}
