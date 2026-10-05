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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import {
  bearingReadout,
  type EqFigureId,
  isEqFigureId,
  trackerReadout,
} from "@/components/holo-program/equilibriumFigures";
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
  /* Where the eye is: the scene reports it every frame, the tick reads it. */
  const viewRef = useRef({ az: 0, el: 0 });
  const onView = useCallback((az: number, el: number) => {
    viewRef.current.az = az;
    viewRef.current.el = el;
  }, []);

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
    const words = new Map<
      string,
      { el: HTMLElement; coord: Element | null; tag: HTMLElement | null }
    >();
    section.querySelectorAll<HTMLElement>(".tw-eq__word[data-word]").forEach((el) => {
      words.set(el.dataset.word ?? "", {
        el,
        coord: el.querySelector("[data-coord]"),
        tag: el.querySelector<HTMLElement>(".tw-eq__tag"),
      });
    });
    const figure = section.querySelector<HTMLElement>(".tw-eq__figure");
    const azNode = section.querySelector("[data-az]");
    const elNode = section.querySelector("[data-el]");
    let seen = -1;
    let bearing = "";
    let raf = 0;
    const tick = () => {
      if (channel.version() !== seen) {
        seen = channel.version();
        const read = channel.read();
        for (const a of read) {
          const w = words.get(a.id);
          if (!w) continue;
          w.el.style.setProperty("--ax", a.x.toFixed(4));
          w.el.style.setProperty("--at", a.y.toFixed(4));
          w.el.toggleAttribute("data-hidden", !a.visible);
          /* The tracker's readout is where its point IS (holo.ui8's). */
          const text = trackerReadout(a.x, a.y);
          if (w.coord && w.coord.textContent !== text) w.coord.textContent = text;
        }
        /* Readouts stay clear of each other AND of every other tracker's
           brackets (holo.ui8's never sit on a tracked point). Each tag tries
           its own side first (right of its bracket), then the left, and lifts
           on a hairline only if both collide. The gate's marker goes first:
           it sits in the middle, where the others pass. */
        if (figure) {
          const W = figure.clientWidth;
          const H = figure.clientHeight;
          type Box = [number, number, number, number];
          const hit = (p: Box, q: Box) =>
            p[0] < q[2] + 8 && q[0] < p[2] + 8 && p[1] < q[3] + 4 && q[1] < p[3] + 4;
          const items = read
            .map((a) => ({ a, w: words.get(a.id) }))
            .filter((it) => it.w?.tag)
            .map(({ a, w }) => ({
              id: a.id,
              w: w!,
              x: a.x * W,
              y: a.y * H,
              tw: w!.tag!.offsetWidth,
              th: w!.tag!.offsetHeight,
            }))
            .sort((p, q) => (p.id === "encode" ? -1 : q.id === "encode" ? 1 : q.y - p.y));
          const brackets = new Map<string, Box>(
            items.map((it) => [it.id, [it.x - 9, it.y - 9, it.x + 9, it.y + 9]])
          );
          const placed: Box[] = [];
          for (const it of items) {
            const obstacles = [
              ...placed,
              ...items.filter((o) => o.id !== it.id).map((o) => brackets.get(o.id)!),
            ];
            const bottom = it.y - 14;
            const at = (side: "right" | "left", lift: number): Box =>
              side === "right"
                ? [it.x - 9, bottom - lift - it.th, it.x - 9 + it.tw, bottom - lift]
                : [it.x + 9 - it.tw, bottom - lift - it.th, it.x + 9, bottom - lift];
            let side: "right" | "left" = "right";
            let lift = 0;
            if (obstacles.some((o) => hit(at("right", 0), o))) {
              if (!obstacles.some((o) => hit(at("left", 0), o))) side = "left";
              else {
                while (lift < 240 && obstacles.some((o) => hit(at("right", lift), o))) lift += 4;
              }
            }
            placed.push(at(side, lift));
            it.w.el.toggleAttribute("data-flip", side === "left");
            it.w.el.style.setProperty("--lift", `${lift}px`);
          }
        }
      }
      const b = bearingReadout(viewRef.current.az, viewRef.current.el);
      if (b.az + b.el !== bearing) {
        bearing = b.az + b.el;
        if (azNode) azNode.textContent = b.az;
        if (elNode) elNode.textContent = b.el;
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
          onView={onView}
          bare={variant === "instrument"}
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
