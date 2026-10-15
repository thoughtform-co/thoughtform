import type { CSSProperties } from "react";

import type { ArcFigureSpec } from "@/lib/arcs/types";

import { absorptionFrame, absorptionGrid, absorptionScene, absorptionSeats } from "./layout";

type AbsorptionSpec = Extract<ArcFigureSpec, { id: "absorption" }>;

const seat = (p: { ax: number; at: number }) =>
  ({ "--ax": p.ax, "--at": p.at }) as CSSProperties;

/**
 * Absorption — the frontier labs as a machine taking in what we used to make
 * (ADR-156 U3). Two panels feed it on ribbons of eight wires; the model is
 * the one gold block; the interface rides above it, and the agents in front
 * reach the world through it.
 *
 * ⚠ SERVER, NO STATE. Words are DOM spans on leaders; the SVG letters nothing.
 */
export function Absorption({ spec }: { spec: AbsorptionSpec }) {
  const f = absorptionFrame();
  const grid = absorptionGrid(f);
  const scene = absorptionScene(f);
  const seats = absorptionSeats(f);
  const [content, products] = spec.panels;
  return (
    <div
      className="arc-floor arc-fig__floor"
      data-fig="absorption"
      style={{ "--fig-aspect": (f.w / f.h).toFixed(3) } as CSSProperties}
    >
      <figure className="arc-floor__figure" aria-label={spec.alt}>
        <div className="arc-floor__stage" style={{ aspectRatio: `${f.w} / ${f.h}` }}>
          <svg
            className="arc-floor__svg"
            viewBox={`0 0 ${f.w} ${f.h}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {grid.along.map((d, i) => (
              <path key={`ga${i}`} className="arc-floor__grat" d={d} />
            ))}
            {grid.across.map((d, i) => (
              <path key={`gc${i}`} className="arc-floor__grat" d={d} />
            ))}
            {scene.ribbons.map((r) => (
              <path key={`r${r.panel}`} className="arc-fig__wire" data-fig-ribbon={r.panel} d={r.d} />
            ))}
            {scene.parts.map(({ id, kind, paths }) => (
              <g
                key={id}
                className="arc-floor__housing"
                data-fig-part={kind}
                data-fig-part-id={id}
                data-stages-lit={kind === "model" ? "" : undefined}
              >
                <path className="arc-floor__face" data-face="left" d={paths.left} />
                <path className="arc-floor__face" data-face="right" d={paths.right} />
                <path className="arc-floor__face" data-face="top" d={paths.top} />
                <path className="arc-floor__hidden" d={paths.hidden} />
                <path className="arc-floor__edge" d={paths.visible} />
              </g>
            ))}
            {scene.struts.map((d, i) => (
              <path key={`s${i}`} className="arc-fig__strut" d={d} />
            ))}
            {scene.agents.map((d, i) => (
              <path key={`a${i}`} className="arc-fig__wire" data-fig-agent="" d={d} />
            ))}
            {Object.values(seats).map((s, i) => (
              <path key={`l${i}`} className="arc-floor__leader" d={s.leader} />
            ))}
          </svg>
          <span className="arc-fig__block" data-anchor="end" style={seat(seats.content.seat)}>
            <span className="arc-fig__block-name">{content.label}</span>
            {content.items.join(" · ")}
          </span>
          <span className="arc-fig__block" data-anchor="middle" style={seat(seats.products.seat)}>
            <span className="arc-fig__block-name">{products.label}</span>
            {products.items.join(" · ")}
          </span>
          <span className="arc-floor__tag" style={seat(seats.machine.seat)}>
            {spec.machine.label}
          </span>
          <span
            className="arc-floor__tag arc-fig__lit"
            data-anchor="end"
            style={seat(seats.model.seat)}
          >
            {spec.machine.core}
          </span>
          <span className="arc-floor__tag" data-anchor="end" style={seat(seats.interface.seat)}>
            {spec.machine.interface}
          </span>
          <span className="arc-floor__tag" style={seat(seats.compute.seat)}>
            {spec.machine.compute}
          </span>
          <span className="arc-fig__block" data-anchor="middle" style={seat(seats.agents.seat)}>
            <span className="arc-fig__block-name">{spec.agents.label}</span>
            {spec.agents.tools.join(" · ")}
          </span>
        </div>
        {spec.note ? <figcaption className="arc-fig__note">{spec.note}</figcaption> : null}
      </figure>
    </div>
  );
}
