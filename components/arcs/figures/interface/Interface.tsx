"use client";

import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";

import type { ArcFigureSpec } from "@/lib/arcs/types";

import {
  BEFORE_END,
  BEFORE_TILES,
  OUTPUT,
  TILE_SIZE,
  VB,
  WORK,
  beforeWires,
  brain,
  particlesAt,
  reworkArcs,
  socketBoxes,
  splitWires,
} from "./layout";

type InterfaceSpec = Extract<ArcFigureSpec, { id: "interface" }>;

const at = (x: number, y: number) =>
  ({ "--ax": x / VB.w, "--at": y / VB.h }) as CSSProperties;

/**
 * Interface — one piece of work, two ways downstream (ADR-156 U4, owner
 * 2026-10-15): on the left the way it was done, step by step and hand-off
 * by hand-off; on the right the frontier model as the interface, a brain of
 * circuits fed context, problems and evals. The particles are the work: they
 * crawl the left, stopping at every tile, and run the right straight through
 * to a gold answer, while the scroll plays it.
 *
 * ⚠ A READER (one passive listener, one rAF, the beat's own geometry); it
 * writes only its own canvas. The drawing is server markup; the words are
 * DOM spans; the SVG letters nothing.
 */
export function Interface({ spec }: { spec: InterfaceSpec }) {
  const b = useMemo(() => brain(), []);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const beat = stage.closest<HTMLElement>("[data-arc-beat]");
    const still = !window.matchMedia("(min-width: 961px) and (prefers-reduced-motion: no-preference)").matches;
    let dpr = 1;
    let ink = "rgb(235, 227, 214)";
    let gold = "rgb(202, 165, 84)";

    const size = () => {
      const r = stage.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      const cs = getComputedStyle(canvas);
      ink = cs.color || ink;
      gold = cs.getPropertyValue("--ifc-gold").trim() || gold;
    };

    const progress = () => {
      if (still || !beat) return 0.55;
      const r = beat.getBoundingClientRect();
      let next = beat.nextElementSibling as HTMLElement | null;
      while (next && !next.hasAttribute("data-arc-beat")) next = next.nextElementSibling as HTMLElement | null;
      const end = next ? next.getBoundingClientRect().top - r.top : r.height - window.innerHeight;
      return end > 0 ? Math.max(0, Math.min(1, -r.top / end)) : 0;
    };

    const draw = () => {
      const k = (canvas.width / VB.w);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dot = 2.4 * dpr;
      for (const p of particlesAt(progress(), b)) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.gold ? gold : ink;
        ctx.fillRect(p.x * k - dot / 2, p.y * k - dot / 2, dot, dot);
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    const schedule = () => {
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          draw();
        });
    };
    size();
    draw();
    const ro = new ResizeObserver(() => {
      size();
      draw();
    });
    ro.observe(stage);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [b]);

  const boxes = socketBoxes(b);
  return (
    <div className="ifc" data-fig="interface">
      <div ref={stageRef} className="ifc__stage" style={{ aspectRatio: `${VB.w} / ${VB.h}` }} aria-label={spec.alt} role="img">
        <svg className="ifc__svg" viewBox={`0 0 ${VB.w} ${VB.h}`} aria-hidden="true">
          <path className="ifc__wire" d={splitWires(b)} />
          <path className="ifc__wire" d={beforeWires()} />
          {reworkArcs().map((d, i) => (
            <path key={i} className="ifc__rework" d={d} />
          ))}
          <rect className="ifc__frame" x={WORK.x} y={WORK.y} width={WORK.w} height={WORK.h} />
          {BEFORE_TILES.map((t) => (
            <g key={t.id}>
              <rect
                className="ifc__tile"
                x={t.x - TILE_SIZE.w / 2}
                y={t.y - TILE_SIZE.h / 2}
                width={TILE_SIZE.w}
                height={TILE_SIZE.h}
              />
              {t.thumb ? (
                <image
                  href={t.thumb}
                  x={t.x - TILE_SIZE.w / 2 + 4}
                  y={t.y - TILE_SIZE.h / 2 + 4}
                  width={TILE_SIZE.w - 8}
                  height={TILE_SIZE.h - 24}
                  preserveAspectRatio="xMidYMid slice"
                  opacity="0.7"
                />
              ) : null}
            </g>
          ))}
          <rect className="ifc__tile" data-end="" x={BEFORE_END.x - 70} y={BEFORE_END.y - 18} width={140} height={36} />
          <path className="ifc__brain" d={b.outline} />
          {b.traces.map((d, i) => (
            <path key={i} className="ifc__trace" d={d} />
          ))}
          {b.pads.map((p, i) => (
            <circle key={i} className="ifc__pad" cx={p.x} cy={p.y} r="2.4" />
          ))}
          {boxes.map((s, i) => (
            <rect key={i} className="ifc__socket" x={s.x - 52} y={s.y - 14} width="104" height="28" />
          ))}
          <rect className="ifc__out" x={OUTPUT.x - 80} y={OUTPUT.y - 22} width="160" height="44" />
        </svg>
        <canvas ref={canvasRef} className="ifc__dots" aria-hidden="true" />
        <span className="ifc__word ifc__word--work" style={at(WORK.x + WORK.w / 2, WORK.y + 26)}>
          {spec.work.label}
        </span>
        <span className="ifc__word ifc__word--line" style={at(WORK.x + WORK.w / 2, WORK.y + 60)}>
          {spec.work.line}
        </span>
        {BEFORE_TILES.map((t, i) => (
          <span key={t.id} className="ifc__word ifc__word--tile" style={at(t.x, t.y + TILE_SIZE.h / 2 - 10)}>
            {spec.before.steps[i]}
          </span>
        ))}
        <span className="ifc__word ifc__word--tile" style={at(BEFORE_END.x, BEFORE_END.y)}>
          {spec.before.end}
        </span>
        {boxes.map((s, i) => (
          <span key={i} className="ifc__word ifc__word--socket" style={at(s.x, s.y)}>
            {spec.now.inputs[i]}
          </span>
        ))}
        <span className="ifc__word ifc__word--out" style={at(OUTPUT.x, OUTPUT.y)}>
          {spec.now.output}
        </span>
        <span className="ifc__head" data-side="before" style={at(BEFORE_END.x, 700)}>
          <span className="ifc__head-name">{spec.before.label}</span>
          {spec.before.line}
        </span>
        <span className="ifc__head" data-side="now" style={at(OUTPUT.x, 700)}>
          <span className="ifc__head-name">{spec.now.label}</span>
          {spec.now.line}
        </span>
      </div>
    </div>
  );
}
