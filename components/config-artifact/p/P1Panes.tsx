/* P1 · Exploded panes, after Unsiloed's hero. Isometric and diagrammatic:
   standing panes, never closed slabs. The team's work comes in as four
   sheets on the left; the configuration is three gold panes (context, skills,
   evals) whose cells fill as the team writes; Claude Enterprise's agents and
   models, and the tools it reaches, are tags on the right. Lines with dots
   carry the work from sheet to pane to tag. Labels lie in the panes' plane. */

import { makeIso, type Pt } from "@/components/xb-proposal/iso";
import { DOWNSTREAM, LAYERS, STAGES, TEAM, WRITTEN_MAX, type FrameNo } from "../copy";
import { Mark, MARK_H } from "../Mark";
import { GOLD, INK, Timeline } from "../parts";
import { VB_W } from "../Shell";

const GROUND = "#0a0908";
const U = 20;
/** Panes stand in the y–z plane at a given x; +y runs down-left on screen,
    so a label reads up-right along −y. */
const HALF = 4;
const H = 10;
const SHEETS = TEAM.map((t, i) => ({ ...t, x: i * 0.75, z: (3 - i) * 0.55 }));
const PANE_X = [5.4, 7.0, 8.6];
/** Back panes stand higher, so every pane's head shows. */
const PANE_DZ = [1.1, 0.55, 0];
const TAG_X = 12.2;

type Iso = ReturnType<typeof makeIso>;

/** Path of a pane rectangle at x, spanning y0..y1 and z0..z1. */
function paneD(iso: Iso, x: number, y0: number, y1: number, z0: number, z1: number) {
  const a = iso.p(x, y1, z1);
  const b = iso.p(x, y0, z1);
  const c = iso.p(x, y0, z0);
  const d = iso.p(x, y1, z0);
  return `M${a[0]} ${a[1]}L${b[0]} ${b[1]}L${c[0]} ${c[1]}L${d[0]} ${d[1]}Z`;
}

/** A transform that writes upright 12px text into the pane plane at x,
    starting at (y, z) and reading toward −y. */
function inPlane(iso: Iso, x: number, y: number, z: number) {
  const [e, f] = iso.p(x, y, z);
  return `matrix(0.866 -0.5 0 1 ${e.toFixed(1)} ${f.toFixed(1)})`;
}

function Dot({ at, c = GOLD }: { at: Pt; c?: string }) {
  return <rect x={at[0] - 2.5} y={at[1] - 2.5} width={5} height={5} fill={c} />;
}

function Corner({ at }: { at: Pt }) {
  return <path d={`M${at[0] - 4} ${at[1]}H${at[0] + 4}M${at[0]} ${at[1] - 4}V${at[1] + 4}`} stroke={INK} strokeOpacity={0.55} />;
}

function Scene({ iso, late }: { iso: Iso; late: boolean }) {
  const written = late ? STAGES[3].written : STAGES[1].written;
  const share = written / WRITTEN_MAX;
  const cols = 3;
  const rows = 5;
  const cellW = (HALF * 2 - 1.6) / cols;
  const cellH = (H - 3.2) / rows;

  return (
    <g>
      {/* The floor: a faint isometric grid. */}
      <g stroke={INK} strokeOpacity={0.06}>
        {Array.from({ length: 17 }, (_, i) => {
          const v = -3 + i;
          const a = iso.p(v, -7, 0);
          const b = iso.p(v, 7, 0);
          const c = iso.p(-3, v - 7, 0);
          const d = iso.p(13, v - 7, 0);
          return (
            <g key={i}>
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
              {i < 15 && <line x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} />}
            </g>
          );
        })}
      </g>

      {/* 01 · the team's work: four sheets, back to front. */}
      {SHEETS.map((s, i) => {
        const front = i === SHEETS.length - 1;
        return (
          <g key={s.id} opacity={late ? 0.55 : 1}>
            <path d={paneD(iso, s.x, -HALF, HALF, s.z, s.z + H)} fill={GROUND} />
            <path d={paneD(iso, s.x, -HALF, HALF, s.z, s.z + H)} fill={INK} fillOpacity={0.03} stroke={INK} strokeOpacity={front ? 0.7 : 0.4} />
            <text transform={inPlane(iso, s.x, HALF - 0.5, s.z + H - 0.5)} y={12} fill={INK} fillOpacity={0.9}>
              {s.short.toUpperCase()}
            </text>
            {front &&
              Array.from({ length: 9 }, (_, r) => {
                const z = s.z + H - 2.4 - r * 0.8;
                const len = [6.4, 5.2, 6.8, 4.1, 6.0, 5.6, 3.2, 6.6, 4.8][r];
                const a = iso.p(s.x, HALF - 0.6, z);
                const b = iso.p(s.x, HALF - 0.6 - len, z);
                return <line key={r} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={INK} strokeOpacity={0.22} />;
              })}
            {[iso.p(s.x, HALF, s.z), iso.p(s.x, -HALF, s.z + H)].map((at, k) => (front ? <Corner key={k} at={at} /> : null))}
          </g>
        );
      })}

      {/* 02 · the configuration: three gold panes, cells filling as the team
          writes. Back to front: context, skills, evals. */}
      {PANE_X.map((x, i) => {
        const layer = LAYERS[i];
        const dz = PANE_DZ[i];
        const filled = Math.round(share * cols * rows * (1.1 - i * 0.12));
        return (
          <g key={layer.id}>
            <path d={paneD(iso, x, -HALF, HALF, dz, H + dz)} fill={GROUND} />
            <path d={paneD(iso, x, -HALF, HALF, dz, H + dz)} fill={GOLD} fillOpacity={0.05} stroke={GOLD} strokeOpacity={0.85} />
            <text transform={inPlane(iso, x, HALF - 0.5, H + dz - 0.45)} y={12} fill={GOLD}>
              {`[ ${layer.name.toUpperCase()} ]`}
            </text>
            {Array.from({ length: cols * rows }, (_, k) => {
              const c = k % cols;
              const r = Math.floor(k / cols);
              const y1 = HALF - 0.8 - c * cellW;
              const z1 = H + dz - 1.6 - r * cellH;
              return (
                <path
                  key={k}
                  d={paneD(iso, x, y1 - cellW + 0.25, y1, z1 - cellH + 0.25, z1)}
                  fill={GOLD}
                  fillOpacity={k < filled ? 0.32 : 0}
                  stroke={GOLD}
                  strokeOpacity={k < filled ? 0.7 : 0.18}
                />
              );
            })}
          </g>
        );
      })}

      {/* The configuration's name bar, standing over the panes. */}
      {(() => {
        const x = PANE_X[2] + 0.6;
        const y0 = 0.2;
        const y1 = -7.0;
        const z = H + 4.6;
        return (
          <g>
            <path d={paneD(iso, x, y1, y0, z, z + 1.1)} fill={GROUND} />
            <path d={paneD(iso, x, y1, y0, z, z + 1.1)} fill={GOLD} fillOpacity={0.18} stroke={GOLD} />
            <g transform={inPlane(iso, x, y0 - 0.35, z + 0.95)}>
              <Mark transform={`translate(0 3) scale(${14 / MARK_H})`} fill={GOLD} />
              <text x={22} y={14} fill={GOLD}>
                CONFIGURATION
              </text>
            </g>
          </g>
        );
      })()}

      {/* Work carried in: from each sheet to the context pane. */}
      {SHEETS.map((s, i) => {
        const a = iso.p(s.x, -HALF + 0.35, s.z + H - 0.55);
        const b = iso.p(PANE_X[0], HALF - 1.0, PANE_DZ[0] + H - 2.4 - i * 1.36);
        return (
          <g key={s.id}>
            <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={GOLD} strokeOpacity={0.6} />
            <Dot at={a} c={INK} />
            <Dot at={b} />
          </g>
        );
      })}

      {/* 03 · what the company runs: tags in the same plane, to the right. */}
      {DOWNSTREAM.map((d, i) => {
        const z = H - 1 - i * 2.4;
        const y0 = -HALF - 1.2;
        const len = d.name.length + (i === 0 && late ? 13 : 4);
        const ty0 = y0 + 0.6;
        const tx = TAG_X;
        const from = iso.p(PANE_X[2], -HALF + 0.4, z - 0.4);
        const to = iso.p(tx, ty0, z - 0.4);
        const yEnd = ty0 - len * 0.43;
        return (
          <g key={d.id}>
            <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={GOLD} strokeOpacity={0.6} />
            <Dot at={from} />
            <path d={paneD(iso, tx, yEnd, ty0, z - 1, z)} fill={GROUND} stroke={i < 2 ? INK : INK} strokeOpacity={i < 2 ? 0.75 : 0.45} />
            <text transform={inPlane(iso, tx, ty0 - 0.3, z - 0.15)} y={12} fill={INK} fillOpacity={i < 2 ? 1 : 0.7}>
              {i === 0 && late ? `${d.name.toUpperCase()} · ${STAGES[3].runs.toUpperCase()}` : d.name.toUpperCase()}
            </text>
          </g>
        );
      })}
      <text transform={inPlane(iso, TAG_X, -HALF - 0.6, H + 1.4)} y={12} fill={INK} fillOpacity={0.6}>
        CLAUDE ENTERPRISE
      </text>
    </g>
  );
}

export function P1Panes({ frame }: { frame: FrameNo }) {
  const late = frame === 2;
  // Fit: the scene's extreme points, centred in the space above the timeline.
  const probe = makeIso(U, 0, 0);
  const pts: Pt[] = [
    probe.p(0, HALF, 0),
    probe.p(0, -HALF, H + 2),
    probe.p(PANE_X[2] + 0.6, -7.0, H + 5.8),
    probe.p(TAG_X, -HALF - 5.5, H),
    probe.p(TAG_X, -HALF - 1, 0),
    probe.p(PANE_X[2], HALF, 0),
    probe.p(13, 7, 0),
  ];
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const w = Math.max(...xs) - Math.min(...xs);
  const h = Math.max(...ys) - Math.min(...ys);
  const room = late ? 490 : 560;
  const ox = (VB_W - w) / 2 - Math.min(...xs);
  const oy = (room - h) / 2 - Math.min(...ys);
  const iso = makeIso(U, ox, oy);
  return (
    <g>
      <Scene iso={iso} late={late} />
      {late && <Timeline />}
    </g>
  );
}
