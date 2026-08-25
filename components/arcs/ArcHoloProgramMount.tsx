"use client";

/**
 * ArcHoloProgramMount — the ONE sanctioned three.js seam on the arc surface.
 *
 * ⚠ `.claude/rules/arcs.md` bans three under `components/arcs/**`. This file
 * is the enumerated exception (ADR-080) and its exception is narrow: the ban
 * is on STATIC imports, and everything here is either three-free or reached
 * through `next/dynamic({ ssr: false })`, so the ~270 kB WebGL graph stays
 * out of the arc route's First Load JS. `tests/lib/arcs-import-doctrine.test.ts`
 * is the mechanical half of that promise.
 *
 * ⚠ THE FALLBACK IS THE FLAT BOARD, AND IT IS THE DEFAULT. `data-holo` is a
 * tri-state on the section host: absent (server-rendered, no JS), "static"
 * (JS ran and the gate said no — reduced motion, ≤960 px, no WebGL, or the
 * canvas threw) and "live". Only "live" hides the flat field, and it is
 * written from the scene's FIRST COMMITTED FRAME rather than from the gate
 * passing — a class set before there are pixels is exactly what makes a
 * flat-to-canvas swap pop.
 *
 * ⚠ IT ADDS NO SCROLL WRITER. `useArcScroll` is the page's one writer
 * (ADR-002). The arming check here is a passive listener that READS
 * `scrollY`, writes nothing, and disconnects the moment it arms.
 */

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import type { HoloWaypoint } from "@/components/holo-program/holoProgramGeom";
import { clearHoloHover } from "@/components/holo-program/hoverRef";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { probeWebGL } from "@/lib/webgl/probe";

/* ⚠ The gate is the BOARD's own static tier, complemented — arcs.css
   releases the flat board to a static list at `(max-width: 960px)`, so the
   instrument may only run above it. NOT the reveal system's 900px: both
   numbers exist on this surface and mixing them leaves 901–960 with a
   canvas over a list. */
const HOLO_MEDIA = "(min-width: 961px) and (prefers-reduced-motion: no-preference)";

/** How far into the first viewport the reader must be before the arrival
 *  plays. The beat is held under the hero by the ADR-076 curtain, so an
 *  IntersectionObserver is useless here — it intersects from frame one. */
const ARM_AT = 0.55;

const HoloProgramCanvas = dynamic(
  () => import("@/components/holo-program/HoloProgramCanvas").then((m) => m.HoloProgramCanvas),
  { ssr: false }
);

export function ArcHoloProgramMount({ waypoints }: { waypoints: readonly HoloWaypoint[] }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const capable = useMediaQuery(HOLO_MEDIA);
  const [gl, setGl] = useState<boolean | null>(null);
  const [loadable, setLoadable] = useState(false);
  const [armed, setArmed] = useState(false);
  const [live, setLive] = useState(false);

  /* Probe once, after mount — never during render, and never on the server. */
  useEffect(() => {
    setGl(probeWebGL());
  }, []);

  const allowed = capable && gl === true;

  /**
   * Load at IDLE, not on intersection.
   *
   * The beat is the first section and sits under an opaque hero card until
   * the reader scrolls a full viewport, so the chunk fetches and compiles
   * behind the curtain and in the typical session the flat→live swap is
   * never seen at all.
   */
  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    const arm = () => {
      if (!cancelled) setLoadable(true);
    };
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(arm, { timeout: 2000 });
    } else {
      const t = window.setTimeout(arm, 1200);
      return () => {
        cancelled = true;
        window.clearTimeout(t);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [allowed]);

  /* Arming: the reader has actually uncovered the beat. A restored scroll or
     a deep link satisfies this on the first read, so the arrival is never
     stranded undrawn. */
  useEffect(() => {
    if (!allowed || armed) return;
    const check = () => {
      if (window.scrollY >= window.innerHeight * ARM_AT) {
        setArmed(true);
        window.removeEventListener("scroll", check);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [allowed, armed]);

  /* The mode signal, on the SECTION so the whole beat's CSS can key off it. */
  useEffect(() => {
    const section = hostRef.current?.closest("section");
    if (!section) return;
    if (gl === null) return; // still probing — leave the server state alone
    section.setAttribute("data-holo", live ? "live" : "static");
  }, [gl, live]);

  useEffect(() => () => clearHoloHover(), []);

  if (!allowed || !loadable) return <div className="arc-holo" ref={hostRef} aria-hidden="true" />;

  return (
    <div className="arc-holo" ref={hostRef} aria-hidden="true" data-live={live ? "" : undefined}>
      {/* A canvas failure must fall back to the flat board, not to a hole —
          so the boundary resets the mode signal on its way down. */}
      <CanvasErrorBoundary fallback={<HoloReset onReset={() => setLive(false)} />}>
        <HoloProgramCanvas
          waypoints={waypoints}
          armed={armed}
          onReady={() => setLive(true)}
          className="arc-holo__gl"
        />
      </CanvasErrorBoundary>
    </div>
  );
}

/** Hands the beat back to the flat board when the canvas has died. */
function HoloReset({ onReset }: { onReset: () => void }) {
  useEffect(() => {
    onReset();
  }, [onReset]);
  return null;
}
