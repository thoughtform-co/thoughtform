/* Small drawing parts every permutation shares: bracket tags, plus marks,
   a packet cube, the section-2 timeline. All in viewBox px. */

import { STAGES } from "./copy";

export const GOLD = "#caa554";
export const INK = "#ebe3d6";
/** PT Mono at 12px with 0.08em tracking: the budget for a label's width. */
export const CH = 8.2;

export function Plus({ x, y, c = INK, o = 0.5, s = 4 }: { x: number; y: number; c?: string; o?: number; s?: number }) {
  return <path d={`M${x - s} ${y}H${x + s}M${x} ${y - s}V${y + s}`} stroke={c} strokeOpacity={o} strokeWidth={1} fill="none" />;
}

/** `[ LABEL ]` centred on x. */
export function Bracket({ x, y, text, c = INK, o = 0.85, anchor = "middle" }: { x: number; y: number; text: string; c?: string; o?: number; anchor?: "start" | "middle" | "end" }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fill={c} fillOpacity={o}>
      {`[ ${text.toUpperCase()} ]`}
    </text>
  );
}

/** A small isometric cube: the packet that rides the beam. */
export function Cube({ x, y, s = 7, c = GOLD }: { x: number; y: number; s?: number; c?: string }) {
  const h = s * 0.5;
  const w = s * 0.866;
  return (
    <g stroke={c} strokeWidth={1} strokeLinejoin="miter">
      <path d={`M${x} ${y - s}l${w} ${h}l${-w} ${h}l${-w} ${-h}Z`} fill={c} fillOpacity={0.55} />
      <path d={`M${x - w} ${y - h}v${s}l${w} ${h}v${-s}Z`} fill={c} fillOpacity={0.25} />
      <path d={`M${x + w} ${y - h}v${s}l${-w} ${h}v${-s}Z`} fill={c} fillOpacity={0.12} />
    </g>
  );
}

/** Section 2's progression, one strip under the artifact: four stages, the
    configuration written down above the line, how long an agent runs on its
    own below it. */
export function Timeline({ x0 = 30, x1 = 580, y = 530 }: { x0?: number; x1?: number; y?: number }) {
  const step = (x1 - x0) / (STAGES.length - 1);
  return (
    <g>
      <line x1={x0} y1={y} x2={x1} y2={y} stroke={INK} strokeOpacity={0.25} />
      <line x1={x0} y1={y} x2={x1} y2={y} stroke={GOLD} strokeWidth={2} />
      {STAGES.map((s, i) => {
        const x = x0 + i * step;
        const anchor = i === 0 ? "start" : i === STAGES.length - 1 ? "end" : "middle";
        return (
          <g key={s.when}>
            <rect x={x - 3} y={y - 3} width={6} height={6} fill={GOLD} />
            <text x={x} y={y - 12} textAnchor={anchor} fill={INK} fillOpacity={0.7}>
              {s.when.toUpperCase()}
            </text>
            <text x={x} y={y + 22} textAnchor={anchor} fill={INK} fillOpacity={0.95}>
              {s.runs.toUpperCase()}
            </text>
          </g>
        );
      })}
    </g>
  );
}
