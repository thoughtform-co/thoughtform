"use client";

import { useEffect, useMemo, useRef } from "react";

import { SERVICES } from "./serviceData";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { exitProgressForRunway, lerp, smootherstep } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";
import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";

/**
 * ServicesExitPills — the decommission's DOM half (ADR-030 Update 1,
 * "the viewscreen changes modes"): as each orbiting card flies out and
 * fades on the exit clock, a small mono pill (the service's verb chip)
 * lifts off the card's screen position and FLIP-flies to a compact dock
 * on the RIGHT HUD rail — the terminal stowing its cards. The dock then
 * fades as the #tools station goes opaque (`--tools-bg-in`), so the
 * pills live only through the services→tools stretch (regional, per
 * Vince — but persistence later is just this one fade channel).
 *
 * Mechanics:
 *  - Mounted by LandingPage as a FIXED overlay (never inside a station:
 *    `.station` `content-visibility: auto` containment would rebase
 *    fixed descendants — the reason the hit-area precedent rebases
 *    rects, and the reason this layer lives at the page level).
 *  - Everything is a pure function of the scroll-owned exit clock
 *    (`exitProgressForRunway` of the runway progress ref — the SAME
 *    clock the WebGL cards read), so the flight is reversible.
 *  - FLIP: on the exit clock's rising edge the per-card screen rects are
 *    LATCHED from `hologramConnectorStore.ringAnchors` (they must be
 *    captured then — anchors stop updating once a card fades below 0.1).
 *    Pills are laid out AT the dock; per-frame transforms interpolate
 *    from the captured card-chip corner to rest. No capture (hash-nav
 *    landings, WebGL fallback) → pills simply fade in at the dock.
 *  - One scroll-armed rAF; a frame of ref lag vs the stage hook is
 *    sub-frame (both are pure functions of the same scroll position).
 *
 * Desktop-only (the ring's own gate); absent on mobile / reduced motion.
 * Pills are indicators, not controls (aria-hidden, pointer-events none);
 * a click-to-return affordance is a noted future option.
 */

/** Per-pill flight windows in EXIT-CLOCK units — each opens a beat after
 *  its card's RING_EXIT_WINDOWS window so the chip visibly lifts off the
 *  dimming card; all close by 0.96 (flight done before the stage unpins). */
const PILL_WINDOWS: ReadonlyArray<readonly [number, number]> = [
  [0.1, 0.72],
  [0.2, 0.8],
  [0.3, 0.88],
  [0.4, 0.96],
];

/** Source point inside the captured card rect — the baked plate chip sits
 *  at the card face's top-left; the pill reads as that chip detaching. */
const SRC_X_FRAC = 0.08;
const SRC_Y_FRAC = 0.055;

/** Spawn scale at the card (condenses to 1 at the dock). */
const SRC_SCALE = 1.5;

/** Dock fade vs the #tools background clock: gone before the station is
 *  fully opaque (lockstep: --tools-bg-in completes BEFORE the ambient
 *  canvas dies — see useCorridorExitScroll's BG_IN/FADE constants). */
const DOCK_FADE_START = 0.55;
const DOCK_FADE_END = 0.95;

interface LatchedRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function ServicesExitPills() {
  const active = useMediaQuery("(min-width: 961px) and (prefers-reduced-motion: no-preference)");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const pillRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const latchedRef = useRef<Map<string, LatchedRect> | null>(null);

  const labels = useMemo(() => SERVICES.map((s) => ({ id: s.id, verb: s.verb })), []);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let disposed = false;

    const write = () => {
      frame = 0;
      if (disposed) return;
      const root = rootRef.current;
      if (!root) return;

      const html = document.documentElement;
      const exitP = exitProgressForRunway(servicesRingProgressRef.current.progress);
      const bgInRaw = parseFloat(html.style.getPropertyValue("--tools-bg-in"));
      const bgIn = Number.isFinite(bgInRaw) ? bgInRaw : 0;
      // The ambient attribute IS the region signal: alive from the exit
      // beat through the tools lead-in, gone once the fade envelope
      // completes. Past the runway exitP stays clamped at 1, and
      // `--tools-bg-in` is REMOVED with the exit band — so neither can
      // gate the tail on its own (shipped once with pills lingering at
      // full opacity over the card stack). The dockFade reaches 0
      // strictly BEFORE the ambient dies (BG_IN_END > FADE_END), so this
      // gate never pops a visible pill.
      const ambientAlive = html.hasAttribute("data-services-ambient");

      if (exitP <= 0 || !ambientAlive) {
        if (exitP <= 0 && latchedRef.current) latchedRef.current = null;
        if (root.style.visibility !== "hidden") root.style.visibility = "hidden";
        return;
      }
      if (root.style.visibility !== "visible") root.style.visibility = "visible";

      // Rising-edge latch: capture the card rects the moment the exit
      // clock leaves 0 — the cards are provably at full opacity then
      // (beat 4's dwell precedes the exit beat; anchors publish parked).
      if (exitP > 0 && !latchedRef.current) {
        const anchors = useHologramConnectors.getState().ringAnchors;
        const map = new Map<string, LatchedRect>();
        for (const anchor of anchors) {
          if (anchor.visible && anchor.w > 8) {
            map.set(anchor.serviceId, { x: anchor.x, y: anchor.y, w: anchor.w, h: anchor.h });
          }
        }
        latchedRef.current = map; // may be empty → no-FLIP fade-in fallback
      } else if (exitP <= 0 && latchedRef.current) {
        latchedRef.current = null; // reverse out of the beat re-arms capture
      }

      const dockFade = 1 - smootherstep(DOCK_FADE_START, DOCK_FADE_END, bgIn);

      // The dock's viewport rect anchors the FLIP: the pills' offset*
      // values are relative to the DOCK (their absolutely-positioned
      // offsetParent — NOT the fixed overlay), and the dock itself is
      // never transformed, so its rect is the clean world position.
      // (Shipped once with pill.offsetLeft read as viewport-x — every
      // flight vector was off by the dock's own position.)
      const dockRect = dockRef.current?.getBoundingClientRect();

      for (let i = 0; i < labels.length; i++) {
        const pill = pillRefs.current[i];
        if (!pill) continue;
        const window = PILL_WINDOWS[Math.min(i, PILL_WINDOWS.length - 1)];
        const t = smootherstep(window[0], window[1], exitP);
        const appear = smootherstep(0, 0.15, t);
        const opacity = appear * dockFade;

        if (opacity <= 0.003) {
          pill.style.opacity = "0";
          pill.style.visibility = "hidden";
          continue;
        }
        pill.style.visibility = "visible";
        pill.style.opacity = opacity.toFixed(3);

        // FLIP: offsets are transform-independent, so the dock position
        // reads clean every frame even mid-flight.
        const src = latchedRef.current?.get(labels[i].id);
        if (src && dockRect && t < 1) {
          const dockCx = dockRect.left + pill.offsetLeft + pill.offsetWidth / 2;
          const dockCy = dockRect.top + pill.offsetTop + pill.offsetHeight / 2;
          const srcCx = src.x + src.w * SRC_X_FRAC;
          const srcCy = src.y + src.h * SRC_Y_FRAC;
          const inv = 1 - t;
          const dx = (srcCx - dockCx) * inv;
          const dy = (srcCy - dockCy) * inv;
          const s = lerp(SRC_SCALE, 1, t);
          pill.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${s.toFixed(3)})`;
        } else if (pill.style.transform !== "") {
          pill.style.transform = "";
        }
      }
    };

    const requestWrite = () => {
      // Hidden-tab rAF suspension (house pattern — useStackedCardsScroll).
      if (document.hidden) {
        write();
        return;
      }
      if (frame) return;
      frame = window.requestAnimationFrame(write);
    };

    requestWrite();
    window.addEventListener("scroll", requestWrite, { passive: true });
    window.addEventListener("resize", requestWrite);
    document.addEventListener("visibilitychange", requestWrite);
    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestWrite);
      window.removeEventListener("resize", requestWrite);
      document.removeEventListener("visibilitychange", requestWrite);
    };
  }, [active, labels]);

  if (!active) return null;

  return (
    <div
      ref={rootRef}
      className="svc-exit-pills"
      aria-hidden="true"
      style={{ visibility: "hidden" }}
    >
      <div ref={dockRef} className="svc-exit-pills__dock">
        {labels.map((label, i) => (
          <span
            key={label.id}
            ref={(el) => {
              pillRefs.current[i] = el;
            }}
            className="svc-exit-pill"
            style={{ opacity: 0 }}
          >
            {label.verb}
          </span>
        ))}
      </div>
    </div>
  );
}
