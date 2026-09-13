import type { CSSProperties } from "react";

import { ribbonPaths } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import { band, housing } from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";

import type { BoardDiamond, BoardLane, BoardLetter, BoardModule } from "./boardLayout";

/**
 * boardGlyphs — THE BOARD's marks (ADR-100), the proof's R4 grammar copied
 * by hand from `PdaConfiguration`'s module-private primitives: an opaque
 * chamfered module with a dawn lift and a 2-unit top rule that STOPS AT THE
 * CUT, a head band ruled at its floor, eight-wire ribbons at pitch 4, and a
 * diamond that is never a circle.
 *
 * ⚠ EVERY COLOUR IS A `--arc-board-*` TOKEN, declared on `.arc-board` as an
 * alias of the ADR-077 ramp — never a `--pda-*` (those resolve only under
 * the casefile's `.fl-pda`), never a literal. ⚠ NO `transform` ON ANY
 * ELEMENT: the smoke's overlap walk compares `getBBox` boxes, which are only
 * comparable while every text shares one user space.
 */

const INK: Record<BoardLetter["ink"], string> = {
  ink: "var(--arc-board-ink)",
  ink2: "var(--arc-board-ink-2)",
  ink3: "var(--arc-board-ink-3)",
  "gold-ink": "var(--arc-board-gold-ink)",
  "gold-ink-lit": "var(--arc-board-gold-ink-lit)",
  "green-ink": "var(--arc-board-green-ink)",
};

const DASH = "4 5";

interface Paint {
  plate: boolean;
  wash?: string;
  stroke: string;
  dashed: boolean;
  rule: boolean;
}
const PAINT: Record<BoardModule["paint"], Paint> = {
  module: { plate: true, stroke: "var(--arc-board-edge)", dashed: false, rule: true },
  dormant: { plate: true, stroke: "var(--arc-board-edge)", dashed: true, rule: false },
  "card-lit": {
    plate: true,
    wash: "var(--arc-board-gold-wash)",
    stroke: "var(--arc-board-gold-line)",
    dashed: false,
    rule: true,
  },
  "card-led": { plate: true, stroke: "var(--arc-board-green)", dashed: false, rule: true },
  "seat-lit": {
    plate: true,
    wash: "var(--arc-board-green-wash)",
    stroke: "var(--arc-board-green)",
    dashed: false,
    rule: true,
  },
  island: { plate: true, stroke: "var(--arc-board-edge)", dashed: true, rule: false },
};

/** A module: the housing, its lift, its outline, the rule, the head band. */
export function Module({ m }: { m: BoardModule }) {
  const { x, y, w, h } = m.rect;
  const d = housing(x, y, w, h, m.cut);
  const p = PAINT[m.paint];
  return (
    <g className="arc-board__module" data-board-module={m.id}>
      {p.plate ? <path className="arc-board__plate" d={d} fill="var(--arc-board-plate)" /> : null}
      {p.plate ? <path d={d} fill="var(--arc-board-sheen)" /> : null}
      {p.wash ? <path className="arc-board__wash" d={d} fill={p.wash} /> : null}
      <path
        className="arc-board__outline"
        d={d}
        fill="none"
        stroke={p.stroke}
        strokeDasharray={p.dashed ? DASH : undefined}
      />
      {/* ⚠ The rule STOPS at the cut — it runs to the corner the diagonal
          starts from, or it overshoots into the notch (ADR-070 U13). */}
      {p.rule ? (
        <line x1={x} y1={y + 1} x2={x + w - m.cut} y2={y + 1} stroke={p.stroke} strokeWidth="2" />
      ) : null}
      {m.head ? (
        <>
          <path d={band(x, y, w, m.head, m.cut)} fill="var(--arc-board-band)" />
          <line
            x1={x}
            y1={y + m.head}
            x2={x + w}
            y2={y + m.head}
            stroke="var(--arc-board-line)"
            strokeDasharray={p.dashed ? DASH : undefined}
          />
        </>
      ) : null}
    </g>
  );
}

/**
 * A multi-conductor bundle — eight parallel wires at pitch 4. ⚠ The draw-on
 * class goes on each PATH, not the group, and `--l` is the base polyline's
 * length (the offset copies differ by a few units at the corners and a
 * dasharray only has to be at least the path's length).
 */
export function Ribbon({ lane }: { lane: BoardLane }) {
  const stroke = lane.paint === "green" ? "var(--arc-board-green)" : "var(--arc-board-gold-line)";
  return (
    <g opacity={0.85} stroke={stroke} fill="none" strokeWidth="1">
      {ribbonPaths(lane.pts, lane.wires, 4).map((d, i) => (
        <path
          key={i}
          className="arc-board__wire"
          d={d}
          style={{ "--l": lane.len } as CSSProperties}
        />
      ))}
    </g>
  );
}

const DIAMOND: Record<BoardDiamond["paint"], string> = {
  "gold-line": "var(--arc-board-gold-line)",
  green: "var(--arc-board-green)",
};

/** A diamond — a rotated square, never a circle (the shape law). */
export function Diamond({ d }: { d: BoardDiamond }) {
  const path = `M${d.x},${d.y - d.r} L${d.x + d.r},${d.y} L${d.x},${d.y + d.r} L${d.x - d.r},${d.y} Z`;
  return d.filled ? (
    <path className="arc-board__mark" d={path} fill={DIAMOND[d.paint]} />
  ) : (
    <path className="arc-board__mark" d={path} fill="none" stroke={DIAMOND[d.paint]} />
  );
}

/** One lettered string. Size and tracking are ATTRIBUTES (outside the CSS
 *  ratchet); the face is a class the sheet resolves to the house's fonts. */
export function Letter({ l }: { l: BoardLetter }) {
  return (
    <text
      className={l.face === "sans" ? "arc-board__sans" : undefined}
      x={l.x}
      y={l.y}
      fontSize={l.fs}
      letterSpacing={l.face === "mono" ? `${l.track}em` : undefined}
      fontWeight={l.lit ? 500 : undefined}
      textAnchor={l.anchor === "start" ? undefined : l.anchor}
      fill={INK[l.ink]}
    >
      {l.text}
    </text>
  );
}
