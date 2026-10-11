import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { AboutOrbitArt } from "@/components/landing/home-v2/about/AboutOrbitArt";

import { ArcBeat } from "./ArcBeat";
import { ArcDecodeTitle, ArcDecodeWord } from "./ArcDecodeText";
import { ArcSectionHead } from "./ArcSectionHead";
import { ladder, rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcPortraitProps {
  section: ArcSectionOf<"portrait">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcPortrait — portrait in a corner-bracketed frame (the HUD corner
 * idiom) beside bio paragraphs and a mono meta list.
 *
 * Terminal: the frame is an aperture (its four corner brackets ride the
 * opening edges, the caption-card law) and the copy column enters from
 * the right — the opposite dimension, so the two halves converge.
 */
export function ArcPortrait({ section, index, motion = "reveal" }: ArcPortraitProps) {
  if (section.layout === "orbit") {
    return <ArcPortraitOrbit section={section} index={index} motion={motion} />;
  }
  const terminal = motion === "terminal";
  return (
    <ArcBeat
      id={section.id}
      kind="portrait"
      className="arc-section arc-sec"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="portrait"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <div className="arc-portrait arc-reveal">
          <figure
            className={`arc-portrait__frame${terminal ? " arc-ap" : ""}`}
            {...rung(motion, 0.2)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={section.image.src} alt={section.image.alt} loading="lazy" decoding="async" />
            <i className="arc-portrait__corner is-tl" aria-hidden="true" />
            <i className="arc-portrait__corner is-tr" aria-hidden="true" />
            <i className="arc-portrait__corner is-bl" aria-hidden="true" />
            <i className="arc-portrait__corner is-br" aria-hidden="true" />
          </figure>
          <div className="arc-portrait__copy">
            {section.bio.map((paragraph, pi) => (
              <p
                key={paragraph.slice(0, 32)}
                className="arc-prose"
                {...rung(motion, ladder(0.34, 0.05, pi, 0.48), 40)}
              >
                {paragraph}
              </p>
            ))}
            <dl className="arc-portrait__meta" {...rung(motion, 0.5, 0, 24)}>
              {section.meta.map((row) => (
                <div key={row.label} className="arc-portrait__meta-row">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </ArcBeat>
  );
}

/**
 * ArcPortraitOrbit — THE HOMEPAGE'S ABOUT, ON A PROPOSAL (ADR-133 U5, owner
 * 2026-09-29: "repurpose the About section from our homepage, with my picture
 * on the right side and the text on the left side, so it becomes uniform").
 * The copy column is the homepage's: the name as the title, the role as one
 * mono line, the bio, the meta cells. The portrait sits at the rings' centre
 * at 3:4 in grayscale, the homepage's own treatment, over the homepage's
 * own orbit drawing (`AboutOrbitArt`, one component for both).
 *
 * ⚠ SERVER, NO STATE. On the ramp (ADR-077), so the light-locked proposals
 * paint it. Below 960px the two columns stack, the portrait first.
 */
function ArcPortraitOrbit({ section, motion = "reveal" }: ArcPortraitProps) {
  const { head } = section;
  return (
    <ArcBeat
      id={section.id}
      kind="portrait"
      className="arc-section arc-sec arc-sec--about"
      ariaLabel={section.ariaLabel ?? arcTitleText(head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <div className="arc-about">
          <div className="arc-about__copy arc-reveal" {...rung(motion, 0.1)}>
            {/* The name block is the section's masthead: under terminal motion
                it holds still and decodes, the house law (ADR-057). */}
            <header
              className="arc-about__head"
              {...(motion === "terminal" ? { "data-arc-still": "" } : {})}
            >
              {head.eyebrow ? (
                <ArcDecodeWord text={head.eyebrow} motion={motion} className="arc-about__eyebrow" />
              ) : null}
              <ArcDecodeTitle
                title={head.title}
                motion={motion}
                className="arc-title arc-about__name"
              />
            </header>
            {head.sub ? <span className="arc-about__role">{head.sub}</span> : null}
            {section.bio.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="arc-about__bio">
                {paragraph}
              </p>
            ))}
            <dl className="arc-about__meta">
              {section.meta.map((row) => (
                <div key={row.label} className="arc-about__cell">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <figure className="arc-about__orbit arc-reveal" {...rung(motion, 0.2)}>
            {/* The drawing behind the portrait is the homepage's own (owner,
                2026-10-11: "take the ones from the home page"): the same
                component the homepage's About stage mounts. */}
            <AboutOrbitArt />
            <div className="arc-about__portrait">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={section.image.src}
                alt={section.image.alt}
                loading="lazy"
                decoding="async"
              />
            </div>
          </figure>
        </div>
      </div>
    </ArcBeat>
  );
}
