import type { CSSProperties } from "react";

import { ribbonPaths } from "@/components/landing/home-v2/services/casefile/map/pda/ribbon";
import { band, housing } from "@/components/landing/home-v2/services/casefile/map/pda/substrateKit";

import type { BoardLane, BoardLetter, BoardModule } from "./boardLayout";

/**
 * boardGlyphs — THE BOARD's marks (ADR-100), the proof's R4 grammar copied
 * by hand from `PdaConfiguration`'s module-private primitives: an opaque
 * chamfered module with a dawn lift and a 2-unit top rule that STOPS AT THE
 * CUT, a head band ruled at its floor, and eight-wire ribbons at pitch 4.
 *
 * ⚠ AND ONE OBJECT THAT IS NOT R4's: the LEDGER ROW (`row`, U2). One
 * hairline on the edge the layout names, nothing else — no plate, no
 * outline, no cut. The dormant side is an inventory, so it may not carry the
 * machined grammar at all; drawn as dashed modules it read as the lit board
 * greyed out, which is the thing the before/after had to stop doing.
 *
 * ⚠ AND ONE CORNER THAT IS NOT THE PAIR: the chip's (U4). `notch: "tr"`
 * draws the kit's `band` path — a housing cut top-right and squared at its
 * floor, which is byte-identically the silhouette of the offer's phase
 * plates (ADR-098 U5). Every other object keeps ADR-065's TR + BL.
 *
 * ⚠ NO DIAMONDS (U2, owner: "remove the square diamond icon above The
 * Studio"). The drawing marks nothing with a glyph now — the chip's gold
 * wash is what says which object is the built one.
 *
 * ⚠ EVERY COLOUR IS A `--arc-board-*` TOKEN, declared on `.arc-board` as an
 * alias of the ADR-077 ramp — never a `--pda-*` (those resolve only under
 * the casefile's `.fl-pda`), never a literal. ⚠ NO `transform` ATTRIBUTE AND
 * NO RESTING TRANSFORM ON ANY ELEMENT: the smoke's overlap walk compares
 * `getBBox` boxes, which are blind to an element's own transform, so two
 * texts are comparable only while every group is at identity. A route may
 * scrub the CSS `transform` PROPERTY on a role `<g>` (`transform-box:
 * fill-box`) PROVIDED the value is identity whenever a measurement is taken
 * — the Trinny scene's fold (ADR-102) is identity at its clock's zero, where
 * every guard reads — never on `<text>`, never the attribute.
 */

const INK: Record<BoardLetter["ink"], string> = {
  ink: "var(--arc-board-ink)",
  ink2: "var(--arc-board-ink-2)",
  ink3: "var(--arc-board-ink-3)",
  "gold-ink": "var(--arc-board-gold-ink)",
  "green-ink": "var(--arc-board-green-ink)",
};

interface Paint {
  wash?: string;
  stroke: string;
  rule: boolean;
}
const PAINT: Record<Exclude<BoardModule["paint"], "row">, Paint> = {
  module: { stroke: "var(--arc-board-edge)", rule: true },
  "card-lit": {
    wash: "var(--arc-board-gold-wash)",
    stroke: "var(--arc-board-gold-line)",
    rule: true,
  },
  "seat-lit": {
    wash: "var(--arc-board-green-wash)",
    stroke: "var(--arc-board-green)",
    rule: true,
  },
};

/** A ledger row: one hairline on the edge the layout names. */
function Row({ m }: { m: BoardModule }) {
  const { x, y, w, h } = m.rect;
  const ry = m.rule === "bottom" ? y + h : y;
  return (
    <g className="arc-board__row" data-board-module={m.id}>
      <line x1={x} y1={ry} x2={x + w} y2={ry} stroke="var(--arc-board-line)" />
    </g>
  );
}

/** A module: the housing, its lift, its outline, the rule, the head band. */
export function Module({ m }: { m: BoardModule }) {
  if (m.paint === "row") return <Row m={m} />;
  const { x, y, w, h } = m.rect;
  /* ⚠ `band` IS THE TOP-RIGHT-ONLY HOUSING, not a second path: a header
     band shares its module's top corners and squares off at the bottom,
     which is exactly the chip's silhouette and the plates' own clip. One
     definition for the whole map (substrateKit), used for two things. */
  const d = m.notch === "tr" ? band(x, y, w, h, m.cut) : housing(x, y, w, h, m.cut);
  const p = PAINT[m.paint];
  return (
    <g className="arc-board__module" data-board-module={m.id}>
      <path className="arc-board__plate" d={d} fill="var(--arc-board-plate)" />
      <path d={d} fill="var(--arc-board-sheen)" />
      {p.wash ? <path className="arc-board__wash" d={d} fill={p.wash} /> : null}
      <path className="arc-board__outline" d={d} fill="none" stroke={p.stroke} />
      {/* ⚠ The rule STOPS at the cut — it runs to the corner the diagonal
          starts from, or it overshoots into the notch (ADR-070 U13). */}
      {p.rule ? (
        <line x1={x} y1={y + 1} x2={x + w - m.cut} y2={y + 1} stroke={p.stroke} strokeWidth="2" />
      ) : null}
      {m.head ? (
        <>
          <path d={band(x, y, w, m.head, m.cut)} fill="var(--arc-board-band)" />
          <line x1={x} y1={y + m.head} x2={x + w} y2={y + m.head} stroke="var(--arc-board-line)" />
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
