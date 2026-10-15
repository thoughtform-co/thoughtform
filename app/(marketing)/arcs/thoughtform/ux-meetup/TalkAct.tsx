"use client";

import { useEffect, useRef } from "react";

import { ARC_TERMINAL_MEDIA } from "@/components/arcs/arcMotion";

import { subscribeTalkFrame } from "./useTalkFrame";
import { ACT_BEATS, actFrame, type ActAnchors, type ActClock } from "./actClock";

/**
 * TalkAct — the particle artifact that carries the proof across its three
 * beats (ADR-156 U3, owner 2026-10-15: "as you move to the next section, new
 * stuff gets added, removed, or transferred"; after the X-Bionic swarm, never
 * its design).
 *
 * One pool of dots, each with its identity for the whole act: on the content
 * timeline they gather on the content lane's blocks; on the products timeline
 * they move to the same blocks redrawn and the products lane's dots fill in
 * out of its ghosts; on the machine each dot crosses to its panel's tile,
 * then streams into the housing and turns gold in the model.
 *
 * ⚠ A READER, NOT A WRITER: it subscribes to the talk's one frame bus and
 * draws on its own fixed canvas inside the talk. Positions are a PURE
 * function of the scroll (`actClock.ts`), so scrolling back plays it back.
 * The anchors are read from the drawings' own parts at their parked seat
 * (each stage is sticky at the top while parked), measured on mount, on
 * resize and when fonts settle.
 *
 * Mounted only above the terminal tier; below it, and under reduced motion,
 * the drawings stand alone.
 */
export function TalkAct() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!window.matchMedia(ARC_TERMINAL_MEDIA).matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let anchors: ActAnchors | null = null;
    let clock: ActClock | null = null;
    let dpr = 1;
    let lastKey = "";

    const sections = () =>
      ACT_BEATS.map((id) => document.getElementById(id)).filter(
        (s): s is HTMLElement => s !== null
      );

    /** A part's centre at its beat's PARKED seat: the stage is sticky at the
     *  top while parked, so the seat is the part's offset inside its stage. */
    const parked = (el: Element | null, stage: HTMLElement) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = stage.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return { x: r.left + r.width / 2, y: r.top - s.top + r.height / 2 };
    };

    const measure = () => {
      const secs = sections();
      if (secs.length !== ACT_BEATS.length) {
        anchors = null;
        return;
      }
      const [content, products, absorbed] = secs;
      const stage = (s: HTMLElement) => s.querySelector<HTMLElement>(".arc-stage") ?? s;
      const top = (s: HTMLElement) => s.getBoundingClientRect().top + window.scrollY;
      const tail = (s: HTMLElement) => s.querySelector<HTMLElement>(".arc-beat__tail")?.offsetHeight ?? 0;
      /* By date: the drawing paints farthest first, and time runs left to
         right on screen, so the anchors sort by x. */
      const prisms = (s: HTMLElement, lane: string) =>
        Array.from(s.querySelectorAll(`[data-fig-prism^="${lane}-"]`))
          .map((g) => parked(g.querySelector('[data-face="top"]') ?? g, stage(s)))
          .sort((p, q) => (p?.x ?? 0) - (q?.x ?? 0));
      const tiles = (side: 0 | 1) =>
        [0, 1, 2, 3].map((j) =>
          parked(
            absorbed.querySelector(`[data-fig-part-id="tile-${side}-${j}"] [data-face="top"]`),
            stage(absorbed)
          )
        );
      const ribbon = (side: 0 | 1) =>
        parked(absorbed.querySelector(`[data-fig-ribbon="${side}"]`), stage(absorbed));
      const model = parked(
        absorbed.querySelector('[data-fig-part="model"] [data-face="top"]'),
        stage(absorbed)
      );
      anchors = {
        c2: prisms(content, "c"),
        p2: prisms(content, "p"),
        c3: prisms(products, "c"),
        p3: prisms(products, "p"),
        tiles: [tiles(0), tiles(1)],
        ribbon: [ribbon(0), ribbon(1)],
        model,
      };
      clock = {
        tops: [top(content), top(products), top(absorbed)],
        tail: tail(content) || window.innerHeight,
      };
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      measure();
      lastKey = "";
    };

    const draw = (scrollY: number) => {
      if (!anchors || !clock) return;
      const frame = actFrame(scrollY, clock, anchors);
      const key = frame ? `${Math.round(scrollY)}` : "off";
      if (key === lastKey) return;
      lastKey = key;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!frame) return;
      const size = 2.2 * dpr;
      for (const d of frame) {
        if (d.alpha <= 0.01) continue;
        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = d.gold ? "rgb(202, 165, 84)" : "rgb(235, 227, 214)";
        ctx.fillRect(d.x * dpr - size / 2, d.y * dpr - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    };

    resize();
    const unsub = subscribeTalkFrame((y) => draw(y));
    const onResize = () => {
      resize();
      draw(window.scrollY);
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(() => {
      measure();
      lastKey = "";
    });
    ro.observe(document.documentElement);
    document.fonts?.ready.then(() => {
      measure();
      lastKey = "";
    });

    return () => {
      unsub();
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="uxm-act" aria-hidden="true" />;
}
