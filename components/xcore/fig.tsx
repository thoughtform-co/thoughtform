import type { CSSProperties, ReactNode } from "react";

/**
 * One drawing, one coordinate space. The SVG draws the line work in a
 * viewBox of W × H; the words are DOM, seated by percentages of the same
 * box, so the type keeps its real pixel size whatever the drawing's scale.
 * The box is height-bound (`--xc-reserve` is what the section needs above
 * and below it), so a short screen shrinks the drawing, never the type.
 */
export type Box = { W: number; H: number };

export function at(box: Box, x: number, y: number, w?: number, h?: number): CSSProperties {
  const s: CSSProperties = {
    left: `${(x / box.W) * 100}%`,
    top: `${(y / box.H) * 100}%`,
  };
  if (w !== undefined) s.width = `${(w / box.W) * 100}%`;
  if (h !== undefined) s.height = `${(h / box.H) * 100}%`;
  return s;
}

export function Fig({
  box,
  svg,
  children,
  className = "",
  label,
}: {
  box: Box;
  svg: ReactNode;
  children?: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <figure
      className={`xc-fig ${className}`}
      style={
        {
          "--w": box.W,
          "--h": box.H,
        } as CSSProperties
      }
      aria-label={label}
    >
      <svg
        className="xc-fig__svg"
        viewBox={`0 0 ${box.W} ${box.H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {svg}
      </svg>
      {children}
    </figure>
  );
}

/** An orthogonal trace with 45° shoulders: points in, a path out. */
export function trace(points: readonly (readonly [number, number])[], r = 8): string {
  if (points.length < 2) return "";
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    const inx = Math.sign(x - px),
      iny = Math.sign(y - py);
    const outx = Math.sign(nx - x),
      outy = Math.sign(ny - y);
    const k1 = Math.min(r, Math.hypot(x - px, y - py) / 2);
    const k2 = Math.min(r, Math.hypot(nx - x, ny - y) / 2);
    d += ` L${x - inx * k1} ${y - iny * k1} L${x + outx * k2} ${y + outy * k2}`;
  }
  const [lx, ly] = points[points.length - 1];
  d += ` L${lx} ${ly}`;
  return d;
}

/** A square terminal where a trace meets a node. */
export function Pin({
  x,
  y,
  s = 6,
  lit = false,
}: {
  x: number;
  y: number;
  s?: number;
  lit?: boolean;
}) {
  return (
    <rect
      className={lit ? "xc-pin xc-pin--lit" : "xc-pin"}
      x={x - s / 2}
      y={y - s / 2}
      width={s}
      height={s}
    />
  );
}

/** A housing outline: TR + BL notch (the house corner), square elsewhere. */
export function notched(x: number, y: number, w: number, h: number, c = 12): string {
  return `M${x} ${y} H${x + w - c} L${x + w} ${y + c} V${y + h} H${x + c} L${x} ${y + h - c} Z`;
}
