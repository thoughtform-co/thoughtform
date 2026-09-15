import type { CSSProperties } from "react";

import type { ArcStepsVisual } from "@/lib/arcs/types";

/**
 * ArcStepsVisualView — the stage's drawing for one `steps` item (ADR-103).
 *
 * THE SCAN: a generated packshot in a framed field, read by a machine. A
 * gold edge sweeps the picture top to bottom and reveals it in colour over
 * its own grey ghost; as the edge passes each check's anchor, a node opens
 * on the image, a leader runs out to the right and its label is drawn; the
 * verdict letters last. The checks are the ones the studio's grading gates
 * (the wordmark, the colour, the product, the light), and composition is
 * absent on purpose: on this record that check is the human's.
 *
 * ⚠ EVERY CHANNEL IS A CUSTOM PROPERTY WITH A FINISHED DEFAULT. `--scan-s`
 * is the one input (0 → 1); the route binds it to its scroll clock, and with
 * nothing written the figure renders complete — the static form, no-JS and
 * reduced motion all read the finished pass. No script here, no state.
 *
 * ⚠ THE GRAMMAR IS THE ARCS' OWN: the head's registration crosses, the
 * dot-matrix bed, hairline runs, 1px DIV leaders (never an svg line — a
 * stroked single-axis path reports a zero-height rect to every collapse
 * guard, ADR-068 U6), mono labels on the role tokens. Gold buys ONE thing:
 * the sweep's edge, which parks as the verdict's rule.
 *
 * ⚠ TWO IMAGES, ONE FETCH: the same src twice — the ghost under, static; the
 * live copy over, clipped to the sweep. Plain `<img>`, the flow's own
 * pattern; never `next/image` on an arc plate.
 *
 * THE FIELD: the same frame with nothing plotted yet — a centred node over
 * a mono designation, so a deliverable whose drawing is still to come reads
 * as an instrument awaiting its record rather than a hole.
 */
export function ArcStepsVisualView({ visual, index }: { visual: ArcStepsVisual; index: number }) {
  if (visual.kind === "field") {
    return (
      <figure className="arc-scan arc-scan--field" data-steps-visual="field" data-steps-i={index}>
        <span className="arc-scan__fix arc-scan__fix--l" aria-hidden="true" />
        <div className="arc-scan__field">
          <ScanFrame />
          <i className="arc-scan__node arc-scan__node--centre" aria-hidden="true" />
          <figcaption className="arc-scan__desig">{visual.designation}</figcaption>
        </div>
      </figure>
    );
  }
  const { image, fix, checks, verdict } = visual;
  return (
    <figure className="arc-scan" data-steps-visual="scan" data-steps-i={index}>
      <span className="arc-scan__fix arc-scan__fix--l">{fix[0]}</span>
      <span className="arc-scan__fix arc-scan__fix--r">{fix[1]}</span>
      <div className="arc-scan__field">
        <ScanFrame />
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
            <i className="arc-scan__node" aria-hidden="true" />
            <i className="arc-scan__lead" aria-hidden="true" />
            <span className="arc-scan__label">
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

/** The frame: dashed hairline runs on four edges and a registration cross
 *  centred on each corner. Decorative; the field's own children carry the
 *  meaning. */
function ScanFrame() {
  return (
    <>
      <i className="arc-scan__run arc-scan__run--x" aria-hidden="true" />
      <i className="arc-scan__run arc-scan__run--y" aria-hidden="true" />
      <i className="arc-scan__cross arc-scan__cross--tl" aria-hidden="true" />
      <i className="arc-scan__cross arc-scan__cross--tr" aria-hidden="true" />
      <i className="arc-scan__cross arc-scan__cross--bl" aria-hidden="true" />
      <i className="arc-scan__cross arc-scan__cross--br" aria-hidden="true" />
    </>
  );
}
