"use client";

/**
 * EquilibriumMount — the opener's hologram (ADR-143 U7), mounted into the
 * station's `[data-tw-eq-canvas]` slot by `WorkshopPortals`.
 *
 * ADR-080's mount shape (`ArcHoloProgramMount`), on this route:
 *   · the canvas is a DYNAMIC chunk (`next/dynamic`, no SSR), so three stays
 *     out of the route's first load — the corridor's own chunk is separate;
 *   · `data-holo` on the station is a tri-state: absent (server, no JS),
 *     `static` (the gate said no: a phone, reduced motion, no WebGL, or the
 *     canvas threw) and `live`, written from the scene's FIRST FRAME;
 *   · it adds no scroll writer: arming reads `scrollY` and disconnects.
 *
 * ⚠ THE WORDS FOLLOW THE OBJECT. The server seats them at the rest pose; once
 * live, the scene publishes where each point IS (the reader may turn the
 * object) and this writes `--ax` / `--at` on the same DOM words, so there is
 * one set of words in both modes, never a second tracked layer.
 */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import { type EqFigureId, isEqFigureId } from "@/components/holo-program/equilibriumFigures";
import { createAnchorChannel } from "@/components/holo-stage/stageAnchors";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useThemeStore } from "@/lib/stores/themeStore";
import { probeWebGL } from "@/lib/webgl/probe";

const HoloEquilibriumCanvas = dynamic(
  () =>
    import("@/components/holo-program/HoloEquilibriumCanvas").then((m) => m.HoloEquilibriumCanvas),
  { ssr: false }
);

/** The phone keeps the static drawing and the words as a list (the sheet's
 *  ≤960 rung), and reduced motion keeps the static drawing everywhere. */
const MEDIA = "(min-width: 961px) and (prefers-reduced-motion: no-preference)";
/** It sits right under the hero: arm as the hero is a third gone, so the
 *  object is already arriving while the hero lifts off it. */
const ARM_AT = 0.3;

/** The page's own ground under the figure: the first opaque ancestor. */
function resolveGround(host: HTMLElement): string | null {
  let el: HTMLElement | null = host;
  while (el) {
    const bg = getComputedStyle(el).backgroundColor;
    const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/.exec(bg);
    if (m && (m[4] === undefined || Number(m[4]) >= 0.999)) {
      const hex = (n: string) => Number(n).toString(16).padStart(2, "0");
      return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}`;
    }
    el = el.parentElement;
  }
  return null;
}

export interface EquilibriumMountProps {
  /** Arm when `scrollY` reaches this fraction of the viewport. The lab, which
   *  has no hero to lift off the figure, passes 0. */
  armAt?: number;
}

export default function EquilibriumMount({ armAt = ARM_AT }: EquilibriumMountProps = {}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const capable = useMediaQuery(MEDIA);
  /* The WebGL probe, and the figure the server drew (ADR-143 U9, off the
     station's `data-eq-variant` stamp): both read once, on mount. */
  const [probe, setProbe] = useState<{ gl: boolean | null; variant: EqFigureId }>({
    gl: null,
    variant: "instrument",
  });
  const { gl, variant } = probe;
  const [loadable, setLoadable] = useState(false);
  const [armed, setArmed] = useState(false);
  const [live, setLive] = useState(false);
  const mode = useThemeStore((s) => s.mode);
  const [ground, setGround] = useState<string | null>(null);
  const channel = useMemo(() => createAnchorChannel(), []);

  useEffect(() => {
    const v = hostRef.current?.closest("section")?.getAttribute("data-eq-variant");
    /* ADR-080's probe shape: the WebGL test may not run during render or on
       the server, and the stamp is on the server's markup, so a mount effect
       is the one place left. */
    setProbe({ gl: probeWebGL(), variant: isEqFigureId(v) ? v : "instrument" });
  }, []);
  const allowed = capable && gl === true;

  /* Load at idle. */
  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    const go = () => {
      if (!cancelled) setLoadable(true);
    };
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
    };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(go, { timeout: 1500 });
      return () => {
        cancelled = true;
      };
    }
    const t = window.setTimeout(go, 900);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [allowed]);

  /* Arm on the hero's lift — an IntersectionObserver is useless under a held
     curtain, the station intersects from the first frame. */
  useEffect(() => {
    if (!allowed || armed) return;
    const check = () => {
      if (window.scrollY >= window.innerHeight * armAt) {
        setArmed(true);
        window.removeEventListener("scroll", check);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [allowed, armed, armAt]);

  /* The ground, re-read a frame after the theme's sheet has applied. */
  useEffect(() => {
    if (!allowed) return;
    const host = hostRef.current;
    if (!host) return;
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => setGround(resolveGround(host)));
    });
    return () => cancelAnimationFrame(raf);
  }, [allowed, mode]);

  /* The mode signal, on the station so the whole figure's CSS keys off it. */
  useEffect(() => {
    const section = hostRef.current?.closest("section");
    if (!section || gl === null) return;
    section.setAttribute("data-holo", live ? "live" : "static");
  }, [gl, live]);

  /* The words follow the object while it is live. */
  useEffect(() => {
    if (!live) return;
    const section = hostRef.current?.closest("section");
    if (!section) return;
    const words = new Map<string, HTMLElement>();
    section.querySelectorAll<HTMLElement>(".tw-eq__word[data-word]").forEach((el) => {
      words.set(el.dataset.word ?? "", el);
    });
    let seen = -1;
    let raf = 0;
    const tick = () => {
      if (channel.version() !== seen) {
        seen = channel.version();
        for (const a of channel.read()) {
          const el = words.get(a.id);
          if (!el) continue;
          el.style.setProperty("--ax", a.x.toFixed(4));
          el.style.setProperty("--at", a.y.toFixed(4));
          el.toggleAttribute("data-hidden", !a.visible);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, channel]);

  if (!allowed || !loadable) return <div className="tw-eq__gl" ref={hostRef} aria-hidden="true" />;

  return (
    <div className="tw-eq__gl" ref={hostRef} data-live={live ? "" : undefined} aria-hidden="true">
      {/* A canvas failure hands the figure back to the static drawing. */}
      <CanvasErrorBoundary fallback={<Reset onReset={() => setLive(false)} />}>
        <HoloEquilibriumCanvas
          channel={channel}
          armed={armed}
          ground={ground ?? undefined}
          onReady={() => setLive(true)}
          variant={variant}
        />
      </CanvasErrorBoundary>
    </div>
  );
}

function Reset({ onReset }: { onReset: () => void }) {
  useEffect(() => {
    onReset();
  }, [onReset]);
  return null;
}
