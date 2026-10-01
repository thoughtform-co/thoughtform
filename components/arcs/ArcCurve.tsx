import type { CSSProperties } from "react";

import type { ArcCurveModel, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcCurveSteps } from "./ArcCurveSteps";
import { ArcHoloStageMount } from "./ArcHoloStageMount";
import { ArcSectionHead } from "./ArcSectionHead";
import { arcTitleText } from "./chrome";
import {
  ANG,
  AXIS_TOP,
  BAND_PAD,
  DH,
  DW,
  END_T,
  LEVELS,
  MESH_T,
  T,
  V_LINES,
  besideSide,
  effortBand,
  effortLine,
  fix,
  floor,
  floorGrid,
  floorOutline,
  floorPatch,
  riser,
  surface,
  type Point,
} from "./framing/curveSurface";

interface ArcCurveProps {
  section: ArcSectionOf<"curve">;
  index: number;
  motion?: ArcMotion;
}

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`;
const at = (p: Point): CSSProperties => ({ left: pct(p.x, DW), top: pct(p.y, DH) });
const money = (n: number) => (Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`);

/**
 * A name, with its list price under it. A plain function returning a keyed
 * element, not a component: a server component mapped in a list and handed to
 * a client island loses its key on the way (Moira's own note).
 */
function named(m: ArcCurveModel, words: readonly [string, string], promo: string) {
  return (
    <span key={m.name} className="arc-cv__name">
      {m.name}
      <span className="arc-cv__price">
        {`${money(m.input)} ${words[0]} · ${money(m.output)} ${words[1]}`}
        {m.promo ? <span className="arc-cv__promo">{promo}</span> : null}
      </span>
    </span>
  );
}

/**
 * ArcCurve — each release finishes longer work, and each costs more per token
 * (ADR-130 U5). The Moira workshop's figure, ported whole: two vendors
 * climbing one curve, the lanes and their models as points on its front edge,
 * a warm strip of floor for the step change, and — the second dial — the same
 * curve at every effort level behind it, a little higher, as a surface. Two
 * buttons bring in the prices and the surface (`ArcCurveSteps`).
 *
 * ⚠ ITS COLOURS ARE THE HOUSE'S: Claude's curve and its lanes in gold, the
 * frontier the one filled mark; the other vendor in dawn. Moira's lane hues
 * do not travel (green is the human on this site, and nothing else).
 *
 * ⚠ SERVER. The drawing and every word are rendered here and handed to the
 * island as two keyed parts; the island holds one attribute and two buttons.
 */
export function ArcCurve({ section, index, motion = "reveal" }: ArcCurveProps) {
  const { axes, step, key, prices, effort, lanes, others, note } = section;
  const front = effortLine(0);
  const wall = `${front} L${fix(floor(1, 0))} L${fix(floor(0, 0))} Z`;
  const corner = floor(0, 1);

  /* The step change spans every frontier point, both vendors, plus a pad, as
     a strip of floor the full depth of the dial. */
  const frontierTs = [
    T.frontier,
    ...others.flatMap((s) => s.points.filter((p) => p.t >= T.frontier - 0.06).map((p) => p.t)),
  ];
  const bandT = [Math.min(...frontierTs) - BAND_PAD, Math.max(...frontierTs) + BAND_PAD] as const;

  const stage = (
    <span key="plot" className="arc-cv__plot">
      {/* The hologram (ADR-140): the same surface, lifted, in the stage's
          parallel camera, framed to this crop; the SVG below is its fallback.
          The record crosses as the lanes' ids and the other vendor's t values. */}
      <ArcHoloStageMount
        scene={{
          kind: "curve",
          data: {
            lanes: lanes.map((l) => ({ id: l.id })),
            others: others.map((s) => ({ points: s.points.map((p) => ({ t: p.t })) })),
          },
        }}
      />
      <svg
        className="arc-cv__svg"
        viewBox={`0 0 ${DW} ${DH}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="arc-cv-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--arc-cv-own)" stopOpacity="0.2" />
            <stop offset="1" stopColor="var(--arc-cv-own)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <path className="arc-cv__floor" d={floorOutline()} />
        {floorGrid().map((d) => (
          <path key={d} className="arc-cv__grid" d={d} />
        ))}
        <path className="arc-cv__band" d={floorPatch(bandT[0], bandT[1])} />
        {bandT.map((t) => (
          <path
            key={t}
            className="arc-cv__bandedge"
            d={`M${fix(floor(t / END_T, 0))} L${fix(floor(t / END_T, 1))}`}
          />
        ))}
        <line className="arc-cv__axis" x1={corner.x} y1={corner.y} x2={corner.x} y2={AXIS_TOP} />

        {/* The second dial: the surface behind the front edge. */}
        <g className="arc-cv__depth">
          {V_LINES.slice(1).map((back, i) => (
            <path
              key={back}
              className="arc-cv__sheet"
              d={effortBand(V_LINES[i], back)}
              style={{ opacity: 0.16 - (0.12 * i) / (V_LINES.length - 2) }}
            />
          ))}
          {MESH_T.map((t) => (
            <path key={t} className="arc-cv__mesh" d={riser(t)} />
          ))}
          {V_LINES.slice(1).map((back) => (
            <path
              key={back}
              className="arc-cv__mesh"
              data-level={(LEVELS as readonly number[]).includes(back) ? "true" : undefined}
              d={effortLine(back)}
            />
          ))}
          {lanes.map((lane) => (
            <path
              key={lane.id}
              className="arc-cv__riser"
              data-lane={lane.id}
              d={riser(T[lane.id])}
            />
          ))}
          {lanes.map((lane) => {
            const tip = surface(T[lane.id], 1);
            return (
              <circle
                key={lane.id}
                className="arc-cv__tip"
                data-lane={lane.id}
                cx={tip.x}
                cy={tip.y}
                r="3.5"
              />
            );
          })}
          {LEVELS.map((level) => {
            const p = floor(0, level);
            return <circle key={level} className="arc-cv__tick" cx={p.x} cy={p.y} r="2.5" />;
          })}
        </g>

        <path d={wall} fill="url(#arc-cv-fill)" />
        {others.map((s) => (
          <path
            key={s.label}
            className="arc-cv__line"
            data-series="other"
            d={effortLine(0, "other")}
          />
        ))}
        <path className="arc-cv__line" d={front} />
        {others.flatMap((s) =>
          s.points.map((p) => {
            const dot = surface(p.t, 0, "other");
            return (
              <circle
                key={`${s.label}-${p.model.name}`}
                className="arc-cv__dot"
                data-series="other"
                cx={dot.x}
                cy={dot.y}
                r="5"
              />
            );
          })
        )}
        {lanes.map((lane) => {
          const dot = surface(T[lane.id], 0);
          return (
            <circle
              key={lane.id}
              className="arc-cv__dot"
              data-lane={lane.id}
              cx={dot.x}
              cy={dot.y}
              r="5"
            />
          );
        })}
      </svg>

      <span
        className="arc-cv__axislabel"
        data-axis="y"
        style={{ left: pct(corner.x + 10, DW), top: pct(AXIS_TOP - 8, DH) }}
      >
        {axes.y}
      </span>
      <span
        className="arc-cv__axislabel"
        data-axis="x"
        style={at({ x: floor(1, 0).x + 12, y: floor(1, 0).y + 18 })}
      >
        {axes.x}
      </span>
      <span
        className="arc-cv__axislabel arc-cv__effort"
        style={{ ...at(besideSide(0.5, 38)), transform: `translate(-50%, -50%) rotate(${ANG}deg)` }}
      >
        {effort.axis}
      </span>
      {LEVELS.map((level, i) => (
        <span key={level} className="arc-cv__level" style={at(besideSide(level, 14))}>
          {effort.levels[i]}
        </span>
      ))}

      {lanes.map((lane) => {
        const dot = surface(T[lane.id], 0);
        return (
          <span
            key={lane.id}
            className="arc-cv__tag"
            /* The two lanes low on the curve have the width below it, so each
               name keeps its price on its own row; the frontier, near the
               stage's edge, stacks them. */
            data-row={lane.id === "frontier" ? undefined : "true"}
            style={{ left: pct(dot.x + 12, DW), top: pct(dot.y + 9, DH) }}
          >
            <span className="arc-cv__lanetag" data-lane={lane.id}>
              {lane.label}
            </span>
            {lane.models.map((m) => named(m, prices.words, prices.promo))}
          </span>
        );
      })}
      {others.flatMap((s) =>
        s.points.map((p) => {
          const dot = surface(p.t, 0, "other");
          const out = p.t > T.frontier;
          return (
            <span
              key={`${s.label}-${p.model.name}`}
              className="arc-cv__tag"
              data-series="other"
              data-place={out ? "out" : "over"}
              style={{
                left: pct(out ? dot.x + 24 : dot.x, DW),
                bottom: pct(DH - dot.y + (out ? 6 : 10), DH),
              }}
            >
              {named(p.model, prices.words, prices.promo)}
            </span>
          );
        })
      )}
    </span>
  );

  const caption = (
    <figcaption key="caption" className="arc-cv__caption">
      <span className="arc-cv__key">
        <span className="arc-cv__keyitem">
          <span className="arc-cv__swatch" data-swatch="own" aria-hidden="true" />
          {key.own}
        </span>
        {others.map((s) => (
          <span key={s.label} className="arc-cv__keyitem">
            <span className="arc-cv__swatch" data-swatch="other" aria-hidden="true" />
            {s.label}
          </span>
        ))}
        <span className="arc-cv__keyitem">
          <span className="arc-cv__swatch" data-swatch="step" aria-hidden="true" />
          {step}
        </span>
        <span className="arc-cv__keyitem arc-cv__unit">{prices.unit}</span>
      </span>
      <span className="arc-cv__captionline">
        <span className="arc-cv__note">{effort.note}</span> {note}
      </span>
    </figcaption>
  );

  return (
    <ArcBeat
      id={section.id}
      kind="curve"
      className="arc-section arc-sec arc-sec--curve"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="curve"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <ArcCurveSteps shows={[prices.show, effort.show]} stage={stage} caption={caption} />
      </div>
    </ArcBeat>
  );
}
