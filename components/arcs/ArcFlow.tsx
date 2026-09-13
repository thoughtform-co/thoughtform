import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcFlowProps {
  section: ArcSectionOf<"flow">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcFlow — the pipeline, drawn (ADR-099).
 *
 * Three plates on one row with two connectors between them: the BRIEF that
 * goes in, the RENDERS the setup makes of it, and the SCALE it ships at. The
 * grammar is the tools' authored wireframes' (`casefile/wireframes/**`) —
 * hairline plates, mono micro-labels, quiet content bars standing in for
 * text — because that is this house's way of drawing an interface without
 * photographing one, and the owner asked for "those cool diagrams".
 *
 * ⚠ MINIMALISTIC IS A BUDGET, NOT AN ADJECTIVE (owner: "super clean… keep it
 * minimalistic"). What that buys here: no gold anywhere in the drawing (the
 * head's `em` already spends the page's one gold per beat), no digits, no
 * second typeface, and exactly three lettered registers plus the field names.
 * The reader should get the shape in one look and the detail on a second.
 *
 * ⚠ THE BRIEF'S FIELDS ARE A REAL TEMPLATE'S. They are the eight a creative
 * team actually fills — the set mined from 340 briefs of a working studio —
 * so the plate is a record rather than a mock-up of one. Green ink on the
 * labels is the wireframes' own "operational flow" signal (ADR-068 U5), and
 * it is the one colour the drawing carries.
 *
 * ⚠ SERVER, NO STATE, NO POINTER. Like every drawing on this surface it is
 * static (ADR-021) and `aria-hidden` on the decorative bars — the lettered
 * labels carry the meaning for a screen reader, the bars are texture.
 *
 * Terminal rungs: the three plates rise in sequence, the connectors last —
 * so on the fold the pipeline empties from its ends inward.
 */
export function ArcFlow({ section, index, motion = "reveal" }: ArcFlowProps) {
  const { brief, renders, scale, steps } = section;
  return (
    <ArcBeat
      id={section.id}
      kind="flow"
      className="arc-section arc-sec"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="flow"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="arc-flow">
          {/* ── IN: the brief ── */}
          <section
            className="arc-flow__plate arc-flow__plate--brief arc-reveal"
            aria-label={brief.label}
            {...rung(motion, ladder(0.16, 0.06, 0, 0.4), 0, 28)}
          >
            <span className="arc-flow__kicker">{brief.label}</span>
            <ul className="arc-flow__fields">
              {brief.fields.map((field) => (
                <li key={field} className="arc-flow__field">
                  <span className="arc-flow__fname">{field}</span>
                  <i className="arc-flow__fbar" aria-hidden="true" />
                </li>
              ))}
            </ul>
          </section>

          <ArcFlowStep label={steps[0]} motion={motion} at={0.28} />

          {/* ── THROUGH: what the setup makes ── */}
          <section
            className="arc-flow__plate arc-flow__plate--renders arc-reveal"
            aria-label={renders.label}
            {...rung(motion, ladder(0.16, 0.06, 1, 0.4), 0, 28)}
          >
            <span className="arc-flow__kicker">{renders.label}</span>
            <div className="arc-flow__tiles">
              {renders.images.map((image) => (
                <span key={image.src} className="arc-flow__tile">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
                </span>
              ))}
            </div>
          </section>

          <ArcFlowStep label={steps[1]} motion={motion} at={0.34} />

          {/* ── OUT: every market ── */}
          <section
            className="arc-flow__plate arc-flow__plate--scale arc-reveal"
            aria-label={scale.label}
            {...rung(motion, ladder(0.16, 0.06, 2, 0.4), 0, 28)}
          >
            <span className="arc-flow__kicker">{scale.label}</span>
            {/* ⚠ THE SAME RENDER IN EVERY FRAME, and that IS the claim: one
                approved asset, localised, not four different pictures. A
                placeholder rectangle here drew a grid of empty boxes and said
                nothing — the repetition is the whole reading. */}
            <ul className="arc-flow__markets">
              {scale.markets.map((market) => (
                <li key={market} className="arc-flow__market">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={renders.images[0].src} alt="" loading="lazy" decoding="async" />
                  <span className="arc-flow__mname">{market}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </ArcBeat>
  );
}

/**
 * One connector: a hairline run with a border-drawn head, the step lettered
 * above it.
 *
 * ⚠ A 1px DIV, NEVER AN SVG LINE (the wireframes' own law, ADR-068 U6): a
 * stroked single-axis path reports a zero-height rect, which every collapse
 * guard on this codebase then reads as absent. The arrowhead is a rotated
 * border pair for the same reason.
 */
function ArcFlowStep({ label, motion, at }: { label: string; motion: ArcMotion; at: number }) {
  return (
    <div className="arc-flow__step arc-reveal" {...rung(motion, at, 0, 20)}>
      <span className="arc-flow__verb">{label}</span>
      <i className="arc-flow__run" aria-hidden="true" />
    </div>
  );
}
