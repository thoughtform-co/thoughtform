import type { ArcBreakdownBeat, ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcClipLoop } from "./ArcClipLoop";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

/** Chrome, never content. */
export const BREAKDOWN_KEPT = "Kept";
export const BREAKDOWN_REJECTED = "Sent back";

/** How many slides a breakdown draws: the hero, then one per beat. */
export function breakdownLength(section: ArcSectionOf<"breakdown">): number {
  return 1 + section.breakdown.beats.length;
}

/**
 * ArcBreakdown — how Claude made one real piece of work (ADR-148 U5, U6), as
 * slides in Prompt to Loop's own format: the shell is the same (`ArcBeat`,
 * the arc's own head, the `.ptl-sec` rhythm), so under the page's case switch
 * the two breakdowns read as one grammar. The hero carries the film beside
 * its facts and the beats' index; each beat is a slide, its paragraph in the
 * head and its evidence under it (stills, rows or measured numbers).
 *
 * ⚠ SERVER, NO STATE; the film is the house's one silent loop
 * (`ArcClipLoop`: muted, plays only in view, never under reduced motion).
 * The stills are square children with a 1px edge, never a notched frame.
 */
export function ArcBreakdown({
  section,
  index,
  motion = "reveal",
}: {
  section: ArcSectionOf<"breakdown">;
  index: number;
  motion?: ArcMotion;
}) {
  const b = section.breakdown;
  return (
    <div className="arc-breakdown" data-case-breakdown={section.id}>
      <ArcBeat
        id={section.id}
        kind="media"
        className="arc-section arc-sec ptl-sec"
        ariaLabel={section.ariaLabel ?? arcTitleText(b.title)}
        motion={motion}
      >
        <div className="arc-band">
          <ArcSectionHead
            head={{ eyebrow: b.eyebrow, title: b.title, sub: b.sub }}
            kind="media"
            index={index}
            sectionId={section.id}
            motion={motion}
          />
          <div className="arc-job__top arc-reveal" {...rung(motion, 0.22)}>
            {b.film ? (
              <figure className="arc-job__film">
                <ArcClipLoop clip={b.film} />
              </figure>
            ) : b.page ? (
              <figure className="arc-job__film arc-job__film--page">
                <ScrollWindow src={b.page.src} alt={b.page.alt} label={b.page.label} />
              </figure>
            ) : null}
            <div className="arc-job__head">
              <dl className="arc-job__facts">
                {b.facts.map((f) => (
                  <div key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
              <ol className="arc-job__index">
                {b.beats.map((beat, i) => (
                  <li key={beat.id}>
                    <a href={`#${beat.id}`}>
                      <span>{i + 1}</span>
                      {beat.key}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </ArcBeat>
      {b.beats.map((beat, i) => (
        <ArcBeat
          key={beat.id}
          id={beat.id}
          kind="media"
          className="arc-section arc-sec ptl-sec"
          ariaLabel={arcTitleText(beat.title)}
          motion={motion}
        >
          <div className="arc-band">
            <ArcSectionHead
              head={{ eyebrow: `${i + 1} · ${beat.key}`, title: beat.title, sub: beat.line }}
              kind="media"
              index={index + i + 1}
              sectionId={beat.id}
              motion={motion}
            />
            <div className="arc-reveal" data-case-beat={beat.id} {...rung(motion, 0.22)}>
              <Evidence beat={beat} />
            </div>
          </div>
        </ArcBeat>
      ))}
    </div>
  );
}

function Evidence({ beat }: { beat: ArcBreakdownBeat }) {
  if (beat.frames) {
    return (
      <div className="arc-job__frames" data-case-frames={beat.frames[0].ratio}>
        {beat.frames.map((f) => (
          <figure key={f.src} className="arc-job__frame" data-case-verdict={f.verdict}>
            {f.ratio === "scroll" ? (
              <ScrollWindow src={f.src} alt={f.alt} label={f.label} />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element -- self-hosted stills at their own size, the arcs' idiom */
              <img src={f.src} alt={f.alt} loading="lazy" decoding="async" />
            )}
            <figcaption>
              {f.verdict ? (
                <b>{f.verdict === "kept" ? BREAKDOWN_KEPT : BREAKDOWN_REJECTED}</b>
              ) : null}
              {f.label}
            </figcaption>
          </figure>
        ))}
      </div>
    );
  }
  if (beat.figures) {
    return (
      <dl className="arc-job__figures">
        {beat.figures.map((f) => (
          <div key={f.label}>
            <dt>{f.value}</dt>
            <dd>{f.label}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return (
    <dl className="arc-job__rows">
      {(beat.rows ?? []).map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A tall page (an email, a phone frame) in a fixed window that scrolls
 * (ADR-148 U6): the page is read at its own width, top first, and the reader
 * scrolls it the way the case did. Server markup; `tabIndex` lets the
 * keyboard scroll it, and the region names what is inside.
 */
function ScrollWindow({ src, alt, label }: { src: string; alt: string; label: string }) {
  return (
    <div className="arc-job__scroll" role="region" aria-label={`${label}, scrolls`} tabIndex={0}>
      {/* eslint-disable-next-line @next/next/no-img-element -- self-hosted stills at their own size, the arcs' idiom */}
      <img src={src} alt={alt} loading="lazy" decoding="async" />
    </div>
  );
}
