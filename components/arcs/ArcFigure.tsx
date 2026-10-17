import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcClipLoop } from "./ArcClipLoop";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

/**
 * ArcFigure — the `figure` kind (ADR-156 U3): the section head, then one
 * drawing from the figure registry at the band's width, on the framing's one
 * projection. Every figure is server-rendered and stateless; its words are
 * the record's, its geometry its own model's.
 */
export function ArcFigure({
  section,
  index,
  motion = "reveal",
}: {
  section: ArcSectionOf<"figure">;
  index: number;
  motion?: ArcMotion;
}) {
  const spec = section.figure;
  return (
    <ArcBeat
      id={section.id}
      kind="figure"
      className="arc-section arc-sec arc-sec--figure"
      ariaLabel={section.ariaLabel ?? (section.head ? arcTitleText(section.head.title) : spec.alt)}
      motion={motion}
    >
      <div className="arc-band">
        {section.head ? (
          <ArcSectionHead
            head={section.head}
            kind="figure"
            index={index}
            sectionId={section.id}
            motion={motion}
          />
        ) : (
          <p className="arc-inter__marks arc-fig__marks">
            <i className="arc-inter__x arc-inter__x--origin" aria-hidden="true" />
            <span className="arc-inter__mrule" aria-hidden="true" />
            {section.eyebrow ? (
              <span className="arc-desig arc-fig__eyebrow">{section.eyebrow}</span>
            ) : null}
            <span className="arc-inter__mrule" aria-hidden="true" />
            <i className="arc-inter__x arc-inter__x--close" aria-hidden="true" />
          </p>
        )}
        <div className="arc-fig arc-reveal" data-fig-id={spec.id} {...rung(motion, 0.14)}>
          {spec.id === "interface" ? (
            /* The live drawing is the route's foundation act; this is what a
               phone, reduced motion and no-JS read. */
            <p className="fa-static fa-static--line">
              <strong>{spec.mind}</strong> {spec.line}
            </p>
          ) : null}
          {spec.id === "middle" ? (
            <div className="fa-static">
              <p className="fa-static--line">
                <strong>{spec.line}</strong>
              </p>
              <p>
                <strong>{spec.tool.label}</strong> {spec.tool.line}
              </p>
              <p>
                <strong>{spec.collaborator.label}</strong> {spec.collaborator.line}
              </p>
            </div>
          ) : null}
          {spec.id === "knowledge" ? (
            <div className="fa-static">
              <p className="fa-static--line">
                <strong>{spec.line}</strong>
              </p>
              {spec.layers.map((l) => (
                <p key={l.label}>
                  <strong>{l.label}</strong> {l.domains.join(", ")}
                </p>
              ))}
            </div>
          ) : null}
          {spec.id === "shoggoth" || spec.id === "brain" || spec.id === "layer" ? (
            <p className="fa-static fa-static--line">
              <strong>{spec.title}</strong> {spec.line}
            </p>
          ) : null}
          {spec.id === "bleed" ? (
            <figure className="arc-fig__bleed">
              <ArcClipLoop clip={spec.clip} />
            </figure>
          ) : null}
          {spec.id === "latent" ? (
            <blockquote className="fa-static fa-static--line">
              <p>{spec.quote}</p>
              <cite>{spec.source.label}</cite>
            </blockquote>
          ) : null}
          {spec.id === "capability" ? (
            <ol className="fa-static">
              {spec.cards.map((c) => (
                <li key={c.id} className="fa-static__card">
                  <span className="fa-static__year">{c.year}</span>
                  <strong>{c.title}</strong> {c.caption}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      </div>
    </ArcBeat>
  );
}
