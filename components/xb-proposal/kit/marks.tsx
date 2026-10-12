/* The kit's marks: the small fixed shapes a drawing is punctuated with.
   Each is drawn in the drawing's own units and takes its paint from a class
   (`kit.css`), so a mark is the same mark on every section.

     Tap      a filled square where a line leaves a bus
     Diamond  a station on a ring, or the thing a bearing lands on
     Cross    a registration cross at a corner of a frame
     Bracket  an L at a corner of something framed but not housed
     Junction an open square where several lines become one */

import type { Pt } from "./trace";

export function Tap({
  at,
  size = 6,
  className = "",
}: {
  at: Pt;
  size?: number;
  className?: string;
}) {
  return (
    <rect
      x={at[0] - size / 2}
      y={at[1] - size / 2}
      width={size}
      height={size}
      className={`kit-tap ${className}`}
    />
  );
}

export function Diamond({
  at,
  size = 5,
  open = false,
  className = "",
}: {
  at: Pt;
  /** Half the diagonal. */
  size?: number;
  open?: boolean;
  className?: string;
}) {
  const [x, y] = at;
  return (
    <path
      d={`M${x} ${y - size}L${x + size} ${y}L${x} ${y + size}L${x - size} ${y}Z`}
      className={`kit-diamond${open ? " kit-diamond--open" : ""} ${className}`}
    />
  );
}

export function Cross({
  at,
  size = 5,
  className = "",
}: {
  at: Pt;
  size?: number;
  className?: string;
}) {
  const [x, y] = at;
  return (
    <path
      d={`M${x - size} ${y}H${x + size}M${x} ${y - size}V${y + size}`}
      className={`kit-cross ${className}`}
    />
  );
}

export function Bracket({
  pts,
  className = "",
}: {
  pts: readonly [Pt, Pt, Pt];
  className?: string;
}) {
  const [a, b, c] = pts;
  return (
    <path
      d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${c[0]} ${c[1]}`}
      className={`kit-bracket ${className}`}
    />
  );
}

export function Junction({
  at,
  size = 9,
  className = "",
}: {
  at: Pt;
  size?: number;
  className?: string;
}) {
  return (
    <rect
      x={at[0] - size / 2}
      y={at[1] - size / 2}
      width={size}
      height={size}
      className={`kit-junction ${className}`}
    />
  );
}
