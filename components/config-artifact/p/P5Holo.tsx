/* P5 · The centrepiece, after Holo and the owner's own 3D brand mark. The
   configuration is the brand mark standing over a set of instrument rings
   lying on the floor; tracking reticles lock its three layers. Upstream on
   the left, the team's four lanes run in; downstream on the right, lanes run
   out to Claude Enterprise's agents and models and the tools it reaches.
   SVG only, so it reads without WebGL; the mark can be swapped for the 3D
   Brandmark3D later without moving anything else. */

import { DOWNSTREAM, LAYERS, STAGES, TEAM, WRITTEN_MAX, type FrameNo } from "../copy";
import { MARK_PATHS, MARK_H, MARK_W } from "../Mark";
import { GOLD, INK, Timeline } from "../parts";

const CX = 305;
/** Floor circles seen in isometric: an ellipse at this ratio. */
const K = 0.5774;
const R_OUT = 132;
const LANE_Y = [-48, -16, 16, 48];

/** A point on a floor ring at angle a (0 = right, clockwise on screen). */
const on = (cy: number, r: number, a: number): [number, number] => [CX + r * Math.cos(a), cy + r * K * Math.sin(a)];

function Ring({ cy, r, o = 0.35, dash, c = INK, w = 1 }: { cy: number; r: number; o?: number; dash?: string; c?: string; w?: number }) {
  return <ellipse cx={CX} cy={cy} rx={r} ry={r * K} fill="none" stroke={c} strokeOpacity={o} strokeDasharray={dash} strokeWidth={w} />;
}

/** An arc of a floor ring, from a0 to a1 (radians). */
function arc(cy: number, r: number, a0: number, a1: number) {
  const [x0, y0] = on(cy, r, a0);
  const [x1, y1] = on(cy, r, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${(r * K).toFixed(1)} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

function Ticks({ cy, r }: { cy: number; r: number }) {
  const d: string[] = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const len = i % 6 === 0 ? 9 : 4;
    const [x0, y0] = on(cy, r, a);
    const [x1, y1] = on(cy, r + len, a);
    d.push(`M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}`);
  }
  return <path d={d.join("")} stroke={INK} strokeOpacity={0.35} fill="none" />;
}

/** Corner brackets round a box: a tracking lock. */
function Lock({ x, y, w, h, c = GOLD }: { x: number; y: number; w: number; h: number; c?: string }) {
  const s = 7;
  return (
    <path
      d={`M${x} ${y + s}V${y}H${x + s}M${x + w - s} ${y}H${x + w}V${y + s}M${x + w} ${y + h - s}V${y + h}H${x + w - s}M${x + s} ${y + h}H${x}V${y + h - s}`}
      fill="none"
      stroke={c}
      strokeOpacity={0.8}
    />
  );
}

export function P5Holo({ frame }: { frame: FrameNo }) {
  const late = frame === 2;
  const stage = late ? STAGES[3] : STAGES[1];
  const share = stage.written / WRITTEN_MAX;
  const cy = late ? 318 : 340;
  const markH = 118;
  const markW = (markH * MARK_W) / MARK_H;
  const markY = cy - 100 - markH;
  return (
    <g>
      <defs>
        <filter id="p5-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <linearGradient id="p5-beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={GOLD} stopOpacity={0.28} />
          <stop offset="1" stopColor={GOLD} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Upstream: the team's lanes run in from the left. */}
      <text x={14} y={cy - 112} fill={INK} fillOpacity={0.55}>
        X-BIONIC TEAM
      </text>
      {TEAM.map((t, i) => {
        const y = cy + LANE_Y[i];
        const [ex, ey] = on(cy, R_OUT, Math.PI - LANE_Y[i] / 140);
        return (
          <g key={t.id} opacity={late ? 0.6 : 1}>
            <rect x={14} y={y - 5} width={10} height={10} fill="none" stroke={INK} strokeOpacity={0.7} />
            <text x={32} y={y + 4} fill={INK}>
              {t.short.toUpperCase()}
            </text>
            <path d={`M${120} ${y}C${145} ${y} ${ex - 30} ${ey} ${ex} ${ey}`} fill="none" stroke={INK} strokeOpacity={0.3} />
            <path d={`M${120} ${y}C${145} ${y} ${ex - 30} ${ey} ${ex} ${ey}`} fill="none" stroke={GOLD} strokeOpacity={0.9} strokeDasharray="2 14" className="ca-flow" />
          </g>
        );
      })}

      {/* The rings on the floor. */}
      <ellipse cx={CX} cy={cy} rx={R_OUT * 0.5} ry={R_OUT * 0.5 * K} fill={GOLD} fillOpacity={0.06} />
      <Ticks cy={cy} r={R_OUT} />
      <Ring cy={cy} r={R_OUT} o={0.5} />
      <Ring cy={cy} r={R_OUT - 22} o={0.3} dash="2 5" />
      <Ring cy={cy} r={R_OUT - 44} o={0.25} />
      <path d={arc(cy, R_OUT - 22, -Math.PI / 2, -Math.PI / 2 + share * Math.PI * 2)} fill="none" stroke={GOLD} strokeWidth={3} />
      <Ring cy={cy} r={R_OUT * 0.5} o={0.6} c={GOLD} />

      {/* The beam and the mark standing over the rings. */}
      <path d={`M${CX - 30} ${cy}L${CX - markW / 2} ${markY + markH}H${CX + markW / 2}L${CX + 30} ${cy}Z`} fill="url(#p5-beam)" />
      <g transform={`translate(${CX - markW / 2} ${markY}) scale(${markH / MARK_H})`}>
        <g filter="url(#p5-glow)" opacity={0.6}>
          {MARK_PATHS.map((d, i) => (
            <path key={i} d={d} fill={GOLD} />
          ))}
        </g>
        {MARK_PATHS.map((d, i) => (
          <path key={i} d={d} fill={GOLD} />
        ))}
      </g>
      <Lock x={CX - markW / 2 - 14} y={markY - 14} w={markW + 28} h={markH + 28} />
      <text x={CX} y={markY - 26} textAnchor="middle" fill={GOLD}>
        X-BIONIC CONFIGURATION
      </text>

      {/* Tracking reads: the three layers, locked on the ring. */}
      {LAYERS.map((l, i) => {
        const a = [-2.25, -0.85, 1.35][i];
        const [px, py] = on(cy, R_OUT - 22, a);
        const right = Math.cos(a) > 0;
        const lx = right ? px + 18 : px - 18;
        const ly = py + (i === 2 ? 34 : -26);
        const n = late ? Math.round(stage.written * [0.4, 0.35, 0.25][i]) : Math.round(stage.written * [0.5, 0.3, 0.2][i]);
        return (
          <g key={l.id}>
            <rect x={px - 3} y={py - 3} width={6} height={6} fill={GOLD} />
            <path d={`M${px} ${py}L${lx} ${ly}`} stroke={GOLD} strokeOpacity={0.5} />
            <text x={lx + (right ? 4 : -4)} y={ly + 4} textAnchor={right ? "start" : "end"} fill={GOLD}>
              {`${l.name.toUpperCase()} · ${n}`}
            </text>
          </g>
        );
      })}

      {/* Downstream: lanes out to what the company runs. */}
      <text x={596} y={cy - 112} textAnchor="end" fill={INK} fillOpacity={0.55}>
        CLAUDE ENTERPRISE
      </text>
      {DOWNSTREAM.map((d, i) => {
        const y = cy + LANE_Y[i];
        const [sx, sy] = on(cy, R_OUT, LANE_Y[i] / 140);
        const label = i === 0 && late ? `${d.name} · ${stage.runs}` : d.name;
        return (
          <g key={d.id}>
            <path d={`M${sx} ${sy}C${sx + 30} ${sy} ${465} ${y} ${490} ${y}`} fill="none" stroke={INK} strokeOpacity={0.3} />
            <path d={`M${sx} ${sy}C${sx + 30} ${sy} ${465} ${y} ${490} ${y}`} fill="none" stroke={GOLD} strokeOpacity={0.9} strokeDasharray="2 14" className="ca-flow" />
            <rect x={586} y={y - 5} width={10} height={10} fill={i < 2 ? INK : "none"} fillOpacity={0.8} stroke={INK} strokeOpacity={0.7} />
            <text x={578} y={y + 4} textAnchor="end" fill={INK}>
              {label.toUpperCase()}
            </text>
          </g>
        );
      })}
      {late && <Timeline />}
    </g>
  );
}
