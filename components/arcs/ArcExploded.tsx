import type { CSSProperties } from "react";

import type { ArcStackLayer } from "@/lib/arcs/types";

import { ArcHoloStageMount } from "./ArcHoloStageMount";

import {
  LABEL_X,
  XP_VB,
  explodedDust,
  explodedGrid,
  explodedPlates,
  explodedSeats,
  explodedTies,
} from "./framing/explodedLayout";

interface ArcExplodedProps {
  label: string;
  layers: readonly ArcStackLayer[];
}

const seat = (p: { ax: number; at: number }) => ({ "--ax": p.ax, "--at": p.at }) as CSSProperties;

/**
 * ArcExploded — one template, lifted into its layers (ADR-130 U1).
 *
 * Between the workshop's two panels: the campaign template as an exploded
 * axonometric assembly. Five wireframe plates on four dashed verticals over a
 * ruled datum, base first so the paint order is the depth order, each named off
 * to the right on a single straight leader. The top layer is the free zone —
 * drawn DASHED, because a safety margin is a rule the artwork obeys and not
 * something the setup paints.
 *
 * ⚠ GOLD BUYS ONE THING: the base plate, which is what the setup draws. Every
 * layer above it is what the code composes out of the client's own files.
 *
 * ⚠ THE SVG LETTERS NOTHING AND CARRIES NO `transform`. The labels are DOM on
 * `--ax` / `--at` fractions from `explodedSeats`, over an SVG that is
 * `preserveAspectRatio="none"` inside a stage holding the crop's aspect — so a
 * fraction of the stage IS a fraction of the drawing.
 *
 * ⚠ SERVER, NO STATE. `data-readout-*` only.
 */
export function ArcExploded({ label, layers }: ArcExplodedProps) {
  const plates = explodedPlates(layers.length);
  const seats = explodedSeats(layers.length);
  const grid = explodedGrid();
  const last = layers.length - 1;
  return (
    <figure className="arc-xp" data-readout-figure="">
      {/* The client's own template, exploded and turned (ADR-130 U2). It is
          the first beat, so it arms on SCROLL DEPTH rather than on arrival:
          the ADR-076 curtain holds this band under the hero, where an
          IntersectionObserver intersects from frame one. */}
      <ArcHoloStageMount
        scene={{ kind: "exploded", data: { layers: layers.map((l) => ({ id: l.id, dashed: l.dashed })) } }}
        labels={layers.map((l, i) => ({
          id: l.id,
          key: l.label,
          text: l.note ?? "",
          priority: i,
        }))}
        arm="curtain"
        gutters={{ top: 8, bottom: 8 }}
      />
      <div className="arc-xp__stage">
        <svg
          className="arc-xp__svg"
          viewBox={`0 0 ${XP_VB.w} ${XP_VB.h}`}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {grid.along.map((d, i) => (
            <path key={`ga${i}`} className="arc-xp__grat" d={d} />
          ))}
          {grid.across.map((d, i) => (
            <path key={`gc${i}`} className="arc-xp__grat" d={d} />
          ))}
          {explodedDust().map((p, i) => (
            <rect key={`d${i}`} className="arc-xp__mote" x={p.x} y={p.y} width="1" height="1" />
          ))}
          {explodedTies(layers.length).map((d, i) => (
            <path key={`t${i}`} className="arc-xp__tie" d={d} />
          ))}
          {plates.map((plate, i) => {
            // The record is top-first; the plates are base-first.
            const layer = layers[last - i];
            return (
              <g
                key={layer.id}
                className="arc-xp__plate"
                data-readout-layer={layer.id}
                data-readout-dashed={layer.dashed ? "" : undefined}
                data-readout-base={i === 0 ? "" : undefined}
                style={{ "--i": i } as CSSProperties}
              >
                <path className="arc-xp__hidden" d={plate.hidden} />
                <path className="arc-xp__side" d={plate.sides} />
                <path className="arc-xp__face" d={plate.top} />
                <path className="arc-xp__run" d={plate.top} pathLength={1} />
              </g>
            );
          })}
          {seats.map((s, i) => (
            <path key={`l${i}`} className="arc-xp__leader" d={s.leader} />
          ))}
        </svg>
        {layers.map((layer, j) => {
          const s = seats[last - j];
          return (
            <span
              key={layer.id}
              className="arc-xp__lbl"
              data-readout-layer={layer.id}
              style={{ ...seat(s.label), "--xw": `${XP_VB.w - LABEL_X - 8}` } as CSSProperties}
            >
              <span className="arc-xp__name">{layer.label}</span>
              {layer.note ? <span className="arc-xp__note">{layer.note}</span> : null}
            </span>
          );
        })}
      </div>
      <figcaption className="arc-xp__cap">{label}</figcaption>
    </figure>
  );
}
