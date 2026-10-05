import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcDecodeTitle, ArcDecodeWord, ArcTypeCopy } from "./ArcDecodeText";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";
import {
  BOARD_H,
  BOARD_W,
  CARD,
  CARD_CUT,
  PLATES,
  PLATE_CUT,
  boardBundles,
  chamfer,
  litFrame,
  pinsOf,
  toPath,
  type PlateIndex,
  type Side,
} from "./heroBoard/heroBoardLayout";

interface ArcHeroBoardProps {
  section: ArcSectionOf<"hero-board">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcHeroBoard — the workshop's opening slide (ADR-137).
 *
 * The Moira workshop template's session hero, ported by hand: the head on the
 * left — a mono designation, the display title, one sentence — and the board
 * in miniature on the right. One piece of work in the middle, wired to six
 * plates; the plates a person writes are lit and one frame holds them.
 *
 * ⚠ THE DRAWING LETTERS NOTHING. It is a promise of the picture the room
 * meets further down, not a copy of it, so every word on the beat is in the
 * head and the svg is `aria-hidden` apart from its one sentence of alt.
 *
 * ⚠ THE SKIN IS THE HOUSE'S, NOT MOIRA'S. Plates and card cut on the lawful
 * diagonal (TR + BL, ADR-065) instead of rounded; the lit wires in gold, never
 * the template's blue; every colour off the ADR-077 ramp so light re-derives.
 *
 * ⚠ A DRAW-ON RUN MAY NOT TAKE `vector-effect` (ADR-106 — the browser then
 * ignores `pathLength`); the static line work may, and does in the sheet.
 * Wires paint before plates and the card, so the plates cover the tucked ends.
 */
export function ArcHeroBoard({ section, index, motion = "reveal" }: ArcHeroBoardProps) {
  const { head, lit } = section;
  const isLit = (side: Side, i: PlateIndex) => lit.some(([s, n]) => s === side && n === i);
  const bundles = boardBundles();
  const frame = litFrame(lit);
  const eyebrow = head.eyebrow ?? `ARC / OPENING · ${String(index + 1).padStart(2, "0")}`;

  return (
    <ArcBeat
      id={section.id}
      kind="hero-board"
      className={`arc-section arc-sec arc-hb${section.plate ? " arc-hb--plate" : ""}`}
      ariaLabel={section.ariaLabel ?? arcTitleText(head.title)}
      motion={motion}
    >
      {section.plate ? (
        // ADR-147 U1 + U5 (owner: "the key visual should be full bleed"): the
        // plate is the beat's ground, edge to edge, the copy over its dark
        // side; no travel (a translating ground would slide under the copy).
        <figure className="arc-hb__bleed" aria-hidden={section.plate.alt ? undefined : true}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="arc-hb__bleed-img"
            src={section.plate.src}
            alt={section.plate.alt}
            width={section.plate.width}
            height={section.plate.height}
            loading="lazy"
            decoding="async"
          />
        </figure>
      ) : null}
      <div className="arc-band arc-hb__band">
        {/* The masthead law (ADR-057): the head never moves and never fades;
            under terminal motion it is marked still and the decode is the
            reveal. */}
        <div
          className="arc-hb__copy arc-reveal"
          {...(motion === "terminal" ? { "data-arc-still": "" } : {})}
          {...rung(motion, 0.06)}
        >
          <ArcDecodeWord text={eyebrow} motion={motion} className="arc-hb__desig" />
          <ArcDecodeTitle title={head.title} motion={motion} className="arc-title arc-hb__title" />
          {head.sub ? (
            <ArcTypeCopy text={head.sub} motion={motion} className="arc-hb__lede" />
          ) : null}
        </div>

        {section.plate ? null : (
          <figure className="arc-hb__visual arc-reveal" {...rung(motion, 0.16, 28, 0)}>
            <svg
              className="arc-hb__svg"
              viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="One piece of work in the middle, wired to six plates around it. The wires to the plates a person writes are lit, and one frame holds them."
            >
              <g className="arc-hb__wires">
                {bundles
                  .filter((b) => !isLit(b.side, b.i))
                  .flatMap((b) => [
                    ...b.lines.map((line, k) => (
                      <path key={`${b.side}${b.i}-${k}`} d={toPath(line)} />
                    )),
                    ...pinsOf(b).map((p, k) => (
                      <rect
                        key={`${b.side}${b.i}-p${k}`}
                        x={p.x}
                        y={p.y}
                        width={p.w}
                        height={p.h}
                      />
                    )),
                  ])}
              </g>

              <g className="arc-hb__lit">
                {bundles
                  .filter((b) => isLit(b.side, b.i))
                  .flatMap((b) => [
                    ...b.lines.map((line, k) => (
                      <path
                        key={`${b.side}${b.i}-${k}`}
                        d={toPath(line)}
                        pathLength={1}
                        data-hb-side={b.side}
                      />
                    )),
                    ...pinsOf(b).map((p, k) => (
                      <rect
                        key={`${b.side}${b.i}-p${k}`}
                        x={p.x}
                        y={p.y}
                        width={p.w}
                        height={p.h}
                      />
                    )),
                  ])}
              </g>

              {frame ? <path className="arc-hb__frame" d={chamfer(frame, PLATE_CUT + 6)} /> : null}

              {(["left", "right"] as const).flatMap((side) =>
                PLATES[side].map((r, i) => {
                  const on = isLit(side, i as PlateIndex);
                  return (
                    <g
                      key={`${side}${i}`}
                      className="arc-hb__plate"
                      data-hb-lit={on ? "" : undefined}
                    >
                      <path d={chamfer(r, PLATE_CUT)} />
                      <rect x={r.x + 22} y={r.y + 30} width={on ? 120 : 96} height="8" />
                      <rect x={r.x + 22} y={r.y + 56} width={on ? 190 : 150} height="8" />
                    </g>
                  );
                })
              )}

              <g className="arc-hb__card">
                <path d={chamfer(CARD, CARD_CUT)} />
                <path
                  className="arc-hb__lip"
                  d={`M${CARD.x} ${CARD.y + 1}H${CARD.x + CARD.w - CARD_CUT - 0.4}`}
                />
                <rect x={CARD.x + 28} y={CARD.y + 34} width="84" height="8" />
                <rect x={CARD.x + 28} y={CARD.y + 62} width="210" height="18" />
                <rect x={CARD.x + 28} y={CARD.y + 118} width="240" height="8" />
                <rect x={CARD.x + 28} y={CARD.y + 140} width="190" height="8" />
                <rect x={CARD.x + 28} y={CARD.y + 272} width="80" height="16" />
                <rect x={CARD.x + 116} y={CARD.y + 272} width="80" height="16" data-hb-on="" />
                <rect x={CARD.x + 204} y={CARD.y + 272} width="80" height="16" />
                <rect x={CARD.x + 28} y={CARD.y + 306} width="200" height="8" />
              </g>
            </svg>
          </figure>
        )}
      </div>
    </ArcBeat>
  );
}
