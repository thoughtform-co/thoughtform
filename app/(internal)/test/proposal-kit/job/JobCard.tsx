import { ALLOWS_LABEL, RESULT_LABEL } from "@/components/arcs/ArcJob";
import { ArcBeat } from "@/components/arcs/ArcBeat";
import { Glyph } from "@/components/arcs/ArcLeverage";
import { rung } from "@/components/arcs/arcMotion";
import { crewSeed } from "@/components/arcs/crewParticles";
import { disciplineOf } from "@/lib/arcs/content/shared/disciplines";
import type { ArcSectionOf } from "@/lib/arcs/types";

import { Evidence, two } from "./Evidence";

export type JobVariant = "j1" | "j2" | "j3";

/* Chrome, never content: the fourth box's tab on J1. */
const TOOLS_LABEL = "Tools";

/**
 * The job card, three directions against production. This is `JobStack`
 * (`components/arcs/ArcJob.tsx`) COPIED ONCE, with production's own classes,
 * and a `variant` that changes one thing each:
 *
 *   j1  ONE LADDER. The tools are a fourth box in the three steps' own
 *       frame grammar (same hairline, same tab, full width), where they are
 *       a narrower, centred, dashed green group.
 *   j2  THE SPLIT FOLLOWS THE FIGURE. The column split takes the figure's
 *       aspect and the hairline frame hugs the evidence itself, where a
 *       portrait film floats in a wide empty frame; the result band's two
 *       cards meet on the rule above them.
 *   j3  THE RESULT STRIP. The result is one ruled strip of cells sharing
 *       edges across the card's foot, where it is a headed band of two
 *       framed cards.
 *
 * Every word is the record's, by reference. Server, no state, DOM only.
 */
export function JobCard({
  section,
  variant,
}: {
  section: ArcSectionOf<"job">;
  variant: JobVariant;
}) {
  const { n, title, bucket, ask, did, figure, result, client } = section;
  const titleId = `${section.id}-${variant}-title`;
  const ws = disciplineOf(bucket);
  const saved = result.label ?? RESULT_LABEL;
  const estimated = saved === RESULT_LABEL;
  const tools = section.scale?.tools ?? [];
  const crosses = (["tl", "tr", "bl", "br"] as const).map((c) => (
    <i key={c} className="arc-jstack__x" data-corner={c} aria-hidden="true" />
  ));
  const evidence = <Evidence figure={figure} seed={crewSeed(section.id)} />;

  return (
    <ArcBeat
      id={`${section.id}-${variant}`}
      kind="job"
      className="arc-section arc-sec arc-sec--job"
      ariaLabel={section.ariaLabel ?? title}
      motion="reveal"
    >
      <div className="arc-band">
        <article
          className="arc-lev arc-case arc-plate arc-reveal arc-jstack"
          data-job-bucket={bucket}
          data-job-head="stack"
          data-jv={variant}
          data-jv-fig={figure.kind}
          aria-labelledby={titleId}
          {...rung("reveal", 0.1)}
        >
          <header className="arc-jstack__top">
            <span className="arc-jstack__client">{client}</span>
            <h2 className="arc-jstack__name" id={titleId}>
              {title}
            </h2>
            <span className="arc-jstack__ws">
              <Glyph kind={ws.glyph} />
              {ws.long}
            </span>
          </header>
          <div className="arc-jstack__body">
            <div className="arc-jstack__words arc-jstack__words--arc">
              <div className="arc-jstack__box arc-jstack__step">
                <p className="arc-jstack__tab">01 · Navigate</p>
                <p className="arc-jstack__text">{ask}</p>
              </div>
              <div className="arc-jstack__box arc-jstack__step">
                <p className="arc-jstack__tab">02 · Encode</p>
                <p className="arc-jstack__text">{section.embed}</p>
              </div>
              <div className="arc-jstack__box arc-jstack__step">
                <p className="arc-jstack__tab">03 · Build</p>
                <ol className="arc-jstack__steps" aria-label="Claude did">
                  {did.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ol>
              </div>
              {tools.length ? (
                variant === "j1" ? (
                  /* J1: the tools in the steps' own frame */
                  <div className="arc-jstack__box jv-toolbox">
                    <p className="arc-jstack__tab">{TOOLS_LABEL}</p>
                    <ul className="jv-toolbox__list" aria-label="Plugs into">
                      {tools.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <ul className="arc-jstack__dash" aria-label="Plugs into">
                    {tools.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )
              ) : null}
            </div>
            <figure className="arc-case__fig arc-jstack__fig" data-job-figure={figure.kind}>
              <div className="arc-case__frame arc-jstack__frame">
                {variant === "j2" ? (
                  /* J2: the hairline and its four crosses sit on the evidence */
                  <div className="jv-hug">
                    {crosses}
                    {evidence}
                  </div>
                ) : (
                  <>
                    {crosses}
                    {evidence}
                  </>
                )}
              </div>
              <figcaption className="arc-case__caption">
                <span className="arc-case__fig-n">Fig. {two(n)}</span>
                {figure.caption}
              </figcaption>
            </figure>
          </div>
          {variant === "j3" ? (
            /* J3: one ruled strip, four cells sharing their edges */
            <div className="jv-strip">
              <p className="jv-strip__cell jv-strip__name">
                <span className="arc-jstack__card-k">
                  {saved}
                  {estimated ? " · estimated" : null}
                </span>
                <Glyph kind="clock" />
              </p>
              <p className="jv-strip__cell">
                <span className="arc-jstack__bar-k">Before</span>
                <i className="arc-jstack__bar" data-w="long" aria-hidden="true" />
                <span className="arc-jstack__bar-v">{result.before}</span>
              </p>
              <p className="jv-strip__cell" data-lit="true">
                <span className="arc-jstack__bar-k">Now</span>
                <i className="arc-jstack__bar" data-w="short" aria-hidden="true" />
                <span className="arc-jstack__bar-v">{result.now}</span>
              </p>
              <p className="jv-strip__cell jv-strip__allows">
                <span className="arc-jstack__card-k">{ALLOWS_LABEL}</span>
                <span className="arc-jstack__card-v">{result.allows}</span>
              </p>
            </div>
          ) : (
            <div className="arc-jstack__band">
              <p className="arc-jstack__band-head" aria-hidden="true">
                <i />
                The result
                <span />
              </p>
              <section className="arc-jstack__card">
                <Glyph kind="clock" />
                <p className="arc-jstack__card-k">
                  {saved}
                  {estimated ? " · estimated" : null}
                </p>
                <div className="arc-jstack__bars">
                  <p className="arc-jstack__bar-row">
                    <span className="arc-jstack__bar-k">Before</span>
                    <i className="arc-jstack__bar" data-w="long" aria-hidden="true" />
                    <span className="arc-jstack__bar-v">{result.before}</span>
                  </p>
                  <p className="arc-jstack__bar-row" data-lit="true">
                    <span className="arc-jstack__bar-k">Now</span>
                    <i className="arc-jstack__bar" data-w="short" aria-hidden="true" />
                    <span className="arc-jstack__bar-v">{result.now}</span>
                  </p>
                </div>
              </section>
              <section className="arc-jstack__card">
                <Glyph kind={ws.glyph} />
                <p className="arc-jstack__card-k">{ALLOWS_LABEL}</p>
                <p className="arc-jstack__card-v">{result.allows}</p>
              </section>
            </div>
          )}
        </article>
      </div>
    </ArcBeat>
  );
}
