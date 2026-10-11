/* P3 · Motherboard, after the Cyberpunk inventory board. Top-down and flat:
   the configuration is the central chip, the brand mark on its lid; the four
   workstreams are chips that feed it through ribbon traces; on the other
   side the company's Claude Enterprise (its agents and models) takes the
   chip's output, with Shopify and analytics already wired to it. */

import { Glyph, type GlyphName } from "@/components/xb-proposal/glyphs";
import { LAYERS, STAGES, TEAM, WRITTEN_MAX, type FrameNo } from "../copy";
import { Mark, MARK_H } from "../Mark";
import { GOLD, INK, Plus, Timeline } from "../parts";
import { Ribbon, route45 } from "../ribbon";

const GROUND = "#0a0908";
const CHIP = { x0: 222, y0: 150, s: 168 };
const TEAM_Y = [112, 182, 252, 322];
const MOD_H = 44;
const ENT = { x0: 462, y0: 128, w: 134, h: 212 };

function Pins({ x, y, len, horizontal }: { x: number; y: number; len: number; horizontal: boolean }) {
  const n = Math.floor(len / 9);
  return (
    <g fill={GOLD} fillOpacity={0.45}>
      {Array.from({ length: n }, (_, i) =>
        horizontal ? (
          <rect key={i} x={x + 6 + i * 9} y={y - 3} width={3} height={6} />
        ) : (
          <rect key={i} x={x - 3} y={y + 6 + i * 9} width={6} height={3} />
        ),
      )}
    </g>
  );
}

function Meter({ x, y, w, v }: { x: number; y: number; w: number; v: number }) {
  const cells = Math.floor(w / 6);
  return (
    <g>
      {Array.from({ length: cells }, (_, i) => (
        <rect key={i} x={x + i * 6} y={y} width={4} height={6} fill={GOLD} fillOpacity={i < Math.round(v * cells) ? 0.9 : 0.16} />
      ))}
    </g>
  );
}

/** A small chip with a glyph, a name and a status line. */
function Module({ x, y, w, name, glyph, sub }: { x: number; y: number; w: number; name: string; glyph?: GlyphName; sub?: string }) {
  const h = MOD_H;
  const tx = x + (glyph ? 38 : 12);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={GROUND} stroke={INK} strokeOpacity={0.55} />
      <rect x={x + 3} y={y + 3} width={w - 6} height={h - 6} fill="none" stroke={INK} strokeOpacity={0.12} />
      {glyph && <Glyph name={glyph} x={x + 10} y={y + h / 2 - 10} size={20} stroke={INK} strokeWidth={1} />}
      <text x={tx} y={y + (sub ? h / 2 - 2 : h / 2 + 4)} fill={INK} fillOpacity={0.95}>
        {name.toUpperCase()}
      </text>
      {sub && (
        <text x={tx} y={y + h / 2 + 14} fill={INK} fillOpacity={0.5}>
          {sub.toUpperCase()}
        </text>
      )}
    </g>
  );
}

export function P3Board({ frame }: { frame: FrameNo }) {
  const late = frame === 2;
  const stage = late ? STAGES[3] : STAGES[0];
  const fill = stage.written / WRITTEN_MAX;
  const { x0, y0, s } = CHIP;
  const x1 = x0 + s;
  const y1 = y0 + s;
  const dy = late ? 0 : 46;
  const into = [y0 + 30, y0 + 66, y0 + 102, y0 + 138];
  return (
    <g>
      <g transform={`translate(0 ${dy})`}>
        {/* Ribbons first, so the chips sit on them. */}
        {TEAM_Y.map((ty, i) => (
          <Ribbon key={ty} points={route45(150, ty + MOD_H / 2, x0, into[i], 10)} stroke={INK} opacity={0.32} />
        ))}
        {[0, 1, 2].map((i) => {
          const y = y0 + 44 + i * 40;
          return <Ribbon key={i} points={[[x1, y], [ENT.x0, y]]} stroke={GOLD} opacity={0.75} n={i === 1 ? 7 : 5} />;
        })}
        <Ribbon points={[[ENT.x0 + 40, ENT.y0], [ENT.x0 + 40, 26 + MOD_H]]} n={3} stroke={INK} opacity={0.3} />
        <Ribbon points={[[ENT.x0 + 40, ENT.y0 + ENT.h], [ENT.x0 + 40, 398]]} n={3} stroke={INK} opacity={0.3} />

        {/* 01 · the team. */}
        {TEAM.map((t, i) => (
          <Module key={t.id} x={14} y={TEAM_Y[i]} w={136} name={t.short} glyph={t.id as GlyphName} sub={late ? "Deciding" : "With Claude"} />
        ))}

        {/* 02 · the configuration: the chip. */}
        <rect x={x0 - 16} y={y0 - 16} width={s + 32} height={s + 32} fill="none" stroke={GOLD} strokeOpacity={0.3} strokeDasharray="2 4" />
        <Pins x={x0} y={y0} len={s - 12} horizontal />
        <Pins x={x0} y={y1} len={s - 12} horizontal />
        <Pins x={x0} y={y0} len={s - 12} horizontal={false} />
        <Pins x={x1} y={y0} len={s - 12} horizontal={false} />
        <path d={`M${x0} ${y0}H${x1 - 14}L${x1} ${y0 + 14}V${y1}H${x0}Z`} fill="#16130c" stroke={GOLD} strokeWidth={1.25} />
        <Mark transform={`translate(${x0 + 16} ${y0 + 16}) scale(${30 / MARK_H})`} fill={GOLD} />
        <text x={x0 + 56} y={y0 + 28} fill={GOLD}>
          X-BIONIC
        </text>
        <text x={x0 + 56} y={y0 + 44} fill={GOLD} fillOpacity={0.6}>
          CONFIG
        </text>
        <line x1={x0 + 14} y1={y0 + 60} x2={x1 - 14} y2={y0 + 60} stroke={GOLD} strokeOpacity={0.35} />
        {LAYERS.map((l, i) => {
          const y = y0 + 84 + i * 28;
          const v = Math.min(1, fill * (1.15 - i * 0.12));
          return (
            <g key={l.id}>
              <text x={x0 + 16} y={y} fill={INK} fillOpacity={0.9}>
                {l.name.toUpperCase()}
              </text>
              <Meter x={x0 + 16} y={y + 6} w={s - 32} v={v} />
            </g>
          );
        })}
        <Plus x={x0 - 16} y={y0 - 16} c={GOLD} />
        <Plus x={x1 + 16} y={y1 + 16} c={GOLD} />
        <text x={x0 - 16} y={y1 + 44} fill={INK} fillOpacity={0.5}>
          {`${stage.written} OF ${WRITTEN_MAX} WRITTEN DOWN`}
        </text>

        {/* 03 · Claude Enterprise, with what it already reaches. */}
        <rect x={ENT.x0} y={ENT.y0} width={ENT.w} height={ENT.h} fill={GROUND} stroke={INK} strokeOpacity={0.6} />
        <text x={ENT.x0 + 12} y={ENT.y0 + 22} fill={INK}>
          CLAUDE
        </text>
        <text x={ENT.x0 + 12} y={ENT.y0 + 38} fill={INK}>
          ENTERPRISE
        </text>
        <line x1={ENT.x0} y1={ENT.y0 + 50} x2={ENT.x0 + ENT.w} y2={ENT.y0 + 50} stroke={INK} strokeOpacity={0.25} />
        {["Agents", "Models"].map((name, i) => {
          const y = ENT.y0 + 62 + i * 72;
          return (
            <g key={name}>
              <rect x={ENT.x0 + 10} y={y} width={ENT.w - 20} height={60} fill="none" stroke={INK} strokeOpacity={0.35} />
              <text x={ENT.x0 + 20} y={y + 20} fill={INK} fillOpacity={0.9}>
                {name.toUpperCase()}
              </text>
              <text x={ENT.x0 + 20} y={y + 38} fill={i === 0 ? GOLD : INK} fillOpacity={0.8}>
                {i === 0 ? stage.runs.toUpperCase() : "IN USE"}
              </text>
              {i === 0 && <Meter x={ENT.x0 + 20} y={y + 46} w={ENT.w - 40} v={late ? 1 : 0.12} />}
            </g>
          );
        })}
        <Module x={ENT.x0} y={26} w={ENT.w} name="Shopify" glyph="shopify" />
        <Module x={ENT.x0} y={398} w={ENT.w} name="Analytics" glyph="analytics" />

        {/* Board furniture: passives by the chip, as on a real board. */}
        {[
          [x1 - 40, y0 - 44],
          [x1 - 80, y0 - 44],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`} fill="none" stroke={INK} strokeOpacity={0.25}>
            <rect x={x} y={y} width={14} height={7} />
            <rect x={x + 20} y={y} width={14} height={7} />
          </g>
        ))}
      </g>
      {late && <Timeline />}
    </g>
  );
}
