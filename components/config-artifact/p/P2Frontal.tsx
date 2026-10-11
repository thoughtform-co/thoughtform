/* P2 · Frontal stack, after Unsiloed's "from raw document". Seen from the
   front and a little above: the team's plate on top, the configuration as
   the one lit band across the middle, Claude Enterprise's plate below, all
   threaded on one beam. A diagram, not a solid: outlines, plus marks,
   bracket labels and construction lines. */

import { DOWNSTREAM, LAYERS, STAGES, TEAM, WRITTEN_MAX, type FrameNo } from "../copy";
import { Mark, MARK_H } from "../Mark";
import { Bracket, CH, Cube, GOLD, INK, Plus, Timeline } from "../parts";

const CX = 305;
const GROUND = "#0a0908";

/** A plate seen from the front: a trapezoid, top edge narrower. */
function Plate({ y, h, top, bottom, c = INK, fo = 0.03, so = 0.45, dashed }: { y: number; h: number; top: number; bottom: number; c?: string; fo?: number; so?: number; dashed?: boolean }) {
  const d = `M${CX - top / 2} ${y}H${CX + top / 2}L${CX + bottom / 2} ${y + h}H${CX - bottom / 2}Z`;
  return (
    <g>
      <path d={d} fill={c} fillOpacity={fo} stroke={c} strokeOpacity={so} strokeDasharray={dashed ? "3 4" : undefined} />
      <Plus x={CX - top / 2} y={y} c={c} />
      <Plus x={CX + top / 2} y={y} c={c} />
      <Plus x={CX - bottom / 2} y={y + h} c={c} />
      <Plus x={CX + bottom / 2} y={y + h} c={c} />
    </g>
  );
}

/** A label bar, as wide as its own label, opaque so the beam runs behind it. */
function Bar({ y, text, c = INK, o = 0.4 }: { y: number; text: string; c?: string; o?: number }) {
  const w = (text.length + 4) * CH + 28;
  return (
    <g>
      <rect x={CX - w / 2} y={y} width={w} height={22} fill={GROUND} />
      <rect x={CX - w / 2} y={y} width={w} height={22} fill={c} fillOpacity={0.05} stroke={c} strokeOpacity={o} />
      <Bracket x={CX} y={y + 15} text={text} c={c} />
    </g>
  );
}

/** Tags in a row, centred, spaced by their own widths. */
function TagRow({ y, items, c = INK }: { y: number; items: readonly string[]; c?: string }) {
  const widths = items.map((t) => (t.length + 4) * CH);
  const gap = 18;
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  const starts = widths.map((_, i) => CX - total / 2 + widths.slice(0, i).reduce((a, b) => a + b + gap, 0));
  return (
    <g>
      {items.map((t, i) => (
        <Bracket key={t} x={starts[i] + widths[i] / 2} y={y} text={t} c={c} o={0.75} />
      ))}
    </g>
  );
}

export function P2Frontal({ frame }: { frame: FrameNo }) {
  const late = frame === 2;
  const written = late ? STAGES[3].written : 9;
  const cells = 10;
  const lit = Math.round((written / WRITTEN_MAX) * cells);
  const dy = late ? 0 : 36;
  return (
    <g>
      <g transform={`translate(0 ${dy})`}>
        {/* The beam everything threads on. */}
        <line x1={CX} y1={50} x2={CX} y2={452} stroke={GOLD} strokeOpacity={0.55} strokeDasharray="4 5" />

        {/* 01 · the team. */}
        <TagRow y={36} items={TEAM.map((t) => t.short)} />
        <Plate y={52} h={38} top={300} bottom={380} so={late ? 0.3 : 0.5} />
        <Bar y={100} text={late ? "X-Bionic team · deciding" : "X-Bionic creative team"} />
        <Cube x={CX} y={160} />

        {/* 02 · the configuration: the one lit band. */}
        <defs>
          <radialGradient id="p2-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={GOLD} stopOpacity={0.42} />
            <stop offset="1" stopColor={GOLD} stopOpacity={0.06} />
          </radialGradient>
        </defs>
        <path d={`M${CX - 190} 186H${CX + 190}L${CX + 270} 226H${CX - 270}Z`} fill={GOLD} fillOpacity={0.07} stroke={GOLD} strokeOpacity={0.7} />
        <Plus x={CX - 190} y={186} c={GOLD} />
        <Plus x={CX + 190} y={186} c={GOLD} />
        {/* Construction from the plate above out to the band's ends. */}
        <path d={`M${CX - 190} 90L${CX - 270} 226M${CX + 190} 90L${CX + 270} 226`} stroke={INK} strokeOpacity={0.2} fill="none" />
        <rect x={CX - 270} y={226} width={540} height={46} fill="url(#p2-glow)" stroke={GOLD} strokeOpacity={0.9} />
        <Plus x={CX - 270} y={226} c={GOLD} o={0.9} />
        <Plus x={CX + 270} y={226} c={GOLD} o={0.9} />
        <Plus x={CX - 270} y={272} c={GOLD} o={0.9} />
        <Plus x={CX + 270} y={272} c={GOLD} o={0.9} />
        <Mark transform={`translate(${CX - 256} ${239}) scale(${20 / MARK_H})`} fill={GOLD} />
        <text x={CX - 228} y={253} fill={INK}>
          THOUGHTFORM
        </text>
        <Bracket x={CX} y={253} text={LAYERS.map((l) => l.name).join(" · ")} c={GOLD} o={1} />
        {Array.from({ length: cells }, (_, i) => (
          <rect key={i} x={CX + 186 + i * 7} y={242} width={5} height={14} fill={GOLD} fillOpacity={i < lit ? 0.95 : 0.18} />
        ))}
        <Bar y={282} text={`X-Bionic configuration · ${written} written`} c={GOLD} o={0.8} />
        <Cube x={CX} y={346} />

        {/* 03 · Claude Enterprise. */}
        <Plate y={372} h={38} top={300} bottom={380} />
        <Bar y={420} text={late ? "Claude Enterprise · agents run a week" : "Claude Enterprise"} />
        <TagRow y={470} items={DOWNSTREAM.map((d) => d.name)} />
      </g>
      {late && <Timeline />}
    </g>
  );
}

