import type { CSSProperties } from "react";

import type { ArcStepsVisual } from "@/lib/arcs/types";

import { Dial, HandoverFigure, RunFigure } from "./steps/DialGlyphs";
import { dialHandover, dialStations } from "./steps/dialLayout";

/**
 * ArcStepsVisualView — the stage's drawing for one `steps` item
 * (ADR-103, recomposed on the DIAL by ADR-106).
 *
 * ONE INSTRUMENT, READ THREE WAYS. Every stage is the house's ring register —
 * the About section's orbit drawing and the gateway's concentric armature,
 * which is the diagram language the owner named (2026-09-15). What changes is
 * what is seated in it:
 *
 *   scan     — the generated packshot, read by a machine. A gold edge sweeps
 *              the dial and the checks the studio's grading actually gates
 *              are called out as it passes their anchor.
 *   loop     — THE RUN. One lit run travelling the track, four stations on it;
 *              a filled node is the team's hand, an open one the model. That
 *              is the deliverable's own claim, drawn: they know what it is
 *              good at and where it gets things wrong.
 *   handover — THE ARC THAT ENDS. The setup is a closed inner circle that
 *              keeps running; the engagement is a short arc on the outer
 *              track that terminates at a capped node.
 *
 * ⚠ EVERY CHANNEL IS A CUSTOM PROPERTY WITH A FINISHED DEFAULT. `--scan-s`
 * is the one input (0 → 1); the route binds it to its scroll clock, and with
 * nothing written every figure renders complete — the static render, no-JS
 * and reduced motion all read the finished pass. No script here, no state.
 *
 * ⚠ THE SVG LETTERS NOTHING. Every string is a DOM label on its own opaque
 * bed, seated by the `--ax` / `--at` fractions `dialLayout` emits. Leaders are
 * 1px DIVS, never svg lines (ADR-068 U6: a stroked single-axis path reports a
 * zero-height rect, which every collapse guard then reads as absent).
 *
 * ⚠ TWO IMAGES, ONE FETCH: the same src twice — the ghost under, static; the
 * live copy over, clipped to the sweep. Plain `<img>`, the flow's own pattern;
 * never `next/image` on an arc plate.
 *
 * ⚠ GOLD BUYS ONE THING PER DRAWING: the sweep's edge on the scan (which parks
 * as the verdict's rule), the lit run on the other two.
 */
export function ArcStepsVisualView({ visual, index }: { visual: ArcStepsVisual; index: number }) {
  if (visual.kind === "loop") {
    const seats = dialStations(visual.stations.map((s) => s.id));
    return (
      <figure className="arc-dial" data-steps-visual="loop" data-steps-i={index}>
        <Fixes fix={visual.fix} />
        <div className="arc-dial__field">
          <Dial>
            <RunFigure />
          </Dial>
          <ol className="arc-dial__stations">
            {visual.stations.map((station, i) => {
              const seat = seats[i];
              return (
                <li
                  key={station.id}
                  className="arc-dial__station"
                  data-steps-station={station.id}
                  data-steps-by={station.by}
                  style={{ "--t0": seat.at0 } as CSSProperties}
                >
                  <i
                    className="arc-dial__node"
                    aria-hidden="true"
                    style={{ "--ax": seat.ax, "--at": seat.at } as CSSProperties}
                  />
                  <span
                    className="arc-dial__tag"
                    style={{ "--ax": seat.labelAx, "--at": seat.labelAt } as CSSProperties}
                  >
                    {station.name}
                  </span>
                </li>
              );
            })}
          </ol>
          <figcaption className="arc-dial__hub">{visual.hub}</figcaption>
        </div>
      </figure>
    );
  }

  if (visual.kind === "handover") {
    const g = dialHandover();
    return (
      <figure className="arc-dial" data-steps-visual="handover" data-steps-i={index}>
        <Fixes fix={visual.fix} />
        <div className="arc-dial__field">
          <Dial>
            <HandoverFigure />
          </Dial>
          <span
            className="arc-dial__tag arc-dial__tag--arc"
            data-steps-mark="outer"
            style={{ "--ax": g.arcLabel.ax, "--at": g.arcLabel.at } as CSSProperties}
          >
            {visual.outer}
          </span>
          <figcaption className="arc-dial__hub">{visual.inner}</figcaption>
        </div>
        <span
          className="arc-dial__mark"
          data-steps-mark="node"
          style={{ "--ax": g.node.ax, "--at": g.node.at } as CSSProperties}
        >
          <i className="arc-dial__node arc-dial__node--lit" aria-hidden="true" />
          <i className="arc-dial__lead" aria-hidden="true" />
          <span className="arc-dial__label">{visual.node}</span>
        </span>
      </figure>
    );
  }

  const { image, fix, checks, verdict } = visual;
  return (
    <figure className="arc-dial arc-scan" data-steps-visual="scan" data-steps-i={index}>
      <Fixes fix={fix} />
      <div className="arc-dial__field">
        <Dial />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="arc-scan__img arc-scan__img--ghost"
          src={image.src}
          alt=""
          aria-hidden="true"
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="arc-scan__img arc-scan__img--live"
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          loading="lazy"
          decoding="async"
        />
        <i className="arc-scan__edge" aria-hidden="true" />
      </div>
      <ol className="arc-scan__callouts">
        {checks.map((check) => (
          <li
            key={check.id}
            className="arc-scan__callout"
            data-steps-check={check.id}
            style={{ "--ax": check.x, "--at": check.y } as CSSProperties}
          >
            <i className="arc-dial__node" aria-hidden="true" />
            <i className="arc-dial__lead" aria-hidden="true" />
            <span className="arc-dial__label arc-scan__label">
              <span className="arc-scan__key">{check.key}</span>
              <span className="arc-scan__reading">{check.reading}</span>
            </span>
          </li>
        ))}
      </ol>
      <figcaption className="arc-scan__verdict">
        <span className="arc-scan__verdict-text">{verdict}</span>
      </figcaption>
    </figure>
  );
}

/**
 * The two designations, on the dial's own diagonal.
 *
 * ⚠ THEY SIT IN THE CIRCLE'S EMPTY CORNERS (top-left and bottom-right), which
 * is `DiagramLabels`' own shape in the celestial kit and what lets the dial
 * take the whole of the stage's height. It also retires the container query
 * the old rectangular frame needed: the two runs shared a row there and
 * collided over a ~200px field at the laptop.
 */
function Fixes({ fix }: { fix: readonly [string, string] }) {
  return (
    <>
      <span className="arc-dial__fix arc-dial__fix--tl">{fix[0]}</span>
      <span className="arc-dial__fix arc-dial__fix--br">{fix[1]}</span>
    </>
  );
}
