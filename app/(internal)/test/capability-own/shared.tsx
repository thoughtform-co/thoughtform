"use client";

/* What the four variants draw with: the runway that gives each its clock,
   the figure's box (the opening's own, `PlugFlow`'s 1200 × 460), a word
   seated in it, a workstream's chip and the Thoughtform mark as a token.

   A variant is a pure picture of its clock `p` (0 at the top of its runway,
   1 at the foot), so any moment of it can be held for a still with
   `?p=0.42`. */

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { GLYPH } from "@/components/xb-proposal/glyphs";
import { MastheadTitle } from "@/components/xb-proposal/Masthead";
import { TITLE } from "@/components/xb-proposal/plug/PlugFlow";
import { BRANDMARK_PATHS, BRANDMARK_VIEWBOX } from "@/lib/brandmark/brandmarkPaths";

import { clamp01, H, type Pt, type StreamId, W } from "./model";

/** A word's seat in the frame, as the opening seats its words. */
export const at = (x: number, y: number): CSSProperties =>
  ({ "--px": (x / W).toFixed(4), "--py": (y / H).toFixed(4) }) as CSSProperties;

/** The clock of a pinned runway: 0 as its top reaches the screen's top, 1 as
    its foot reaches the screen's foot. `fixed` holds it (a still). */
export function useRunway(fixed: number | null) {
  const ref = useRef<HTMLElement>(null);
  const [live, setLive] = useState(0);
  useEffect(() => {
    if (fixed !== null) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = document.documentElement.clientHeight;
      const next = clamp01(-r.top / Math.max(1, r.height - vh));
      setLive((prev) => (Math.abs(prev - next) < 1e-4 ? prev : next));
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [fixed]);
  return { ref, p: fixed ?? live };
}

/** One variant's runway: a section the height of `screens` screens, a pinned
    screen inside it, and the proposal's own section box and title. */
export function Runway({
  id,
  label,
  screens,
  fixed,
  children,
}: {
  id: string;
  label: string;
  screens: number;
  fixed: number | null;
  children: (p: number) => ReactNode;
}) {
  const { ref, p } = useRunway(fixed);
  return (
    <section
      id={id}
      ref={ref}
      className="arc-section arc-xb-port co-run"
      aria-label={label}
      style={{ "--co-screens": screens } as CSSProperties}
    >
      <div className="co-pin">
        <div className="xb xb-in-frame xb-sec">
          <div className="co">
            <MastheadTitle lines={TITLE} />
            {children(p)}
          </div>
        </div>
      </div>
    </section>
  );
}

/** The figure: the opening's box, its SVG in frame units under its words. */
export function Fig({
  label,
  field = false,
  svg,
  children,
}: {
  label: string;
  field?: boolean;
  svg: ReactNode;
  children?: ReactNode;
}) {
  return (
    <figure className="co-fig" aria-label={label} data-field={field ? "" : undefined}>
      <svg viewBox={`0 0 ${W} ${H}`} className="co-svg" aria-hidden>
        {svg}
      </svg>
      {children}
    </figure>
  );
}

/** A workstream's chip, the opening's own (`.pl-chip`). */
export function Chip({
  id,
  name,
  x,
  y,
  owned = false,
  className = "",
  style,
}: {
  id: StreamId;
  name: string;
  x: number;
  y: number;
  owned?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`pl-chip co-chip ${className}`}
      data-owned={owned ? "" : undefined}
      style={{ ...at(x, y), ...style }}
    >
      <svg viewBox="0 0 24 24" className="pl-ico pl-ico--team" aria-hidden>
        <path d={GLYPH[id]} />
      </svg>
      <span>{name}</span>
    </div>
  );
}

/** The Thoughtform mark, `h` units tall, its middle at `c`. */
export function Mark({
  c,
  h,
  className = "",
  opacity,
}: {
  c: Pt;
  h: number;
  className?: string;
  opacity?: number;
}) {
  const k = h / BRANDMARK_VIEWBOX.h;
  const w = BRANDMARK_VIEWBOX.w * k;
  return (
    <g
      transform={`translate(${(c[0] - w / 2).toFixed(2)} ${(c[1] - h / 2).toFixed(2)}) scale(${k.toFixed(5)})`}
      className={`co-mark ${className}`}
      opacity={opacity}
    >
      {BRANDMARK_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
}

/** A mono word seated in the frame. */
export function Word({
  x,
  y,
  children,
  className = "",
  style,
}: {
  x: number;
  y: number;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`co-w ${className}`} style={{ ...at(x, y), ...style }}>
      {children}
    </div>
  );
}
