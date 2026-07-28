"use client";

import { useId } from "react";

import type { FlSignalPoint } from "./fieldLogData";

/**
 * SignalChart — the adoption-signal plate.
 *
 * The handoff drew this as a hand-authored cubic bezier. Here it is DATA: a
 * list of `{x, y}` in 0..1 plus a Catmull-Rom → cubic conversion, so a second
 * client's curve is four numbers rather than a new path string. Milestone
 * labels sit on the OUTSIDE of the curve — below while the signal is low,
 * above once it climbs — which is what keeps them off the ink without a
 * hand-placed offset per point.
 *
 * The draw-on reveal is a clip rect scaled on X, not a dash offset: the
 * visible stroke is itself dashed, so it cannot also carry a dash animation,
 * and the wipe has to take the diamonds and labels with it anyway.
 */

/** The viewBox aspect is kept close to the plate's own (roughly 2.4:1 at the
 *  desktop band) so `meet` letterboxes as little as possible. `none` is not
 *  an option — it would stretch the mono stamps with the box. */
const VB_W = 700;
const VB_H = 292;
const PAD = { l: 30, r: 38, t: 28, b: 50 } as const;

const PLOT_W = VB_W - PAD.l - PAD.r;
const PLOT_H = VB_H - PAD.t - PAD.b;

const px = (x: number) => PAD.l + x * PLOT_W;
const py = (y: number) => VB_H - PAD.b - y * PLOT_H;

/** Catmull-Rom through every point, emitted as cubic segments. Endpoint
 *  tangents are clamped by duplicating the terminal points, so the curve
 *  neither overshoots the first reading nor flares past the last. */
function curvePath(points: readonly FlSignalPoint[]): string {
  if (points.length < 2) return "";
  const p = points.map((pt) => ({ x: px(pt.x), y: py(pt.y) }));
  let d = `M${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p[i + 1];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d +=
      ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}` +
      ` ${c2x.toFixed(1)} ${c2y.toFixed(1)}` +
      ` ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

interface SignalChartProps {
  points: readonly FlSignalPoint[];
  t0: string;
  now: string;
}

export function SignalChart({ points, t0, now }: SignalChartProps) {
  const clipId = `${useId()}-wipe`;
  const d = curvePath(points);
  const gridX = [0.25, 0.5, 0.75];
  const gridY = [0.25, 0.5, 0.75];

  return (
    <svg
      className="fll-signal"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      /* Default `xMidYMid meet` on purpose — `none` would stretch the mono
         stamps with the box. The sheet gives the element the matching
         aspect-ratio so the plate never letterboxes. */
      role="img"
      aria-label={`Adoption signal, ${t0} to ${now}`}
    >
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <rect className="fll-signal__wipe" x={0} y={0} width={VB_W} height={VB_H} />
        </clipPath>
      </defs>

      {/* Graticule — outside the wipe: the instrument is already there when
          the signal starts drawing across it. */}
      {gridX.map((g) => (
        <line
          key={`x${g}`}
          className="fll-signal__grid"
          x1={px(g)}
          y1={PAD.t - 6}
          x2={px(g)}
          y2={VB_H - PAD.b + 6}
        />
      ))}
      {gridY.map((g) => (
        <line
          key={`y${g}`}
          className="fll-signal__grid"
          x1={PAD.l - 6}
          y1={py(g)}
          x2={VB_W - PAD.r + 6}
          y2={py(g)}
        />
      ))}

      <g clipPath={`url(#${clipId})`}>
        <path className="fll-signal__halo" d={d} />
        <path className="fll-signal__line" d={d} />
        {points.map((pt, i) => {
          const x = px(pt.x);
          const y = py(pt.y);
          const above = pt.y > 0.5;
          const last = i === points.length - 1;
          const anchor = last ? "end" : i === 0 ? "start" : "middle";
          const tx = last ? x + 10 : i === 0 ? x - 8 : x;
          const stampY = above ? y - 30 : y + 27;
          return (
            // Keyed by index, not by content: two milestones may legitimately
            // carry the same stamp and label (the placeholder curve does).
            <g key={i}>
              <rect
                className="fll-signal__node"
                x={-4}
                y={-4}
                width={8}
                height={8}
                transform={`translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(45)`}
              />
              <text className="fll-signal__stamp" x={tx} y={stampY} textAnchor={anchor}>
                {pt.stamp}
              </text>
              <text className="fll-signal__caption" x={tx} y={stampY + 12} textAnchor={anchor}>
                {pt.label}
              </text>
            </g>
          );
        })}
      </g>

      <text className="fll-signal__foot" x={PAD.l - 14} y={VB_H - 10}>
        {t0}
      </text>
      <text
        className="fll-signal__foot fll-signal__foot--gold"
        x={VB_W - PAD.r + 14}
        y={VB_H - 10}
        textAnchor="end"
      >
        {now}
      </text>
    </svg>
  );
}
