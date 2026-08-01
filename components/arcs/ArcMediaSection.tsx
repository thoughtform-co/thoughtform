import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";
import { arcTitleText } from "./chrome";

interface ArcMediaSectionProps {
  section: ArcSectionOf<"media">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcMediaSection — a framed figure under a two-column head. Video is
 * strictly `preload="none"` + poster (the arc mp4s are 13–20 MB — zero
 * bytes load until play; never autoplay). Content media renders in
 * natural color — the gold duotone is card/chrome treatment only.
 *
 * Terminal: the frame is an APERTURE (`.arc-ap`), not a travelling
 * panel. It unfolds from a centre slit toward both edges — the corridor
 * caption card's motion, scrubbed instead of transitioned — and takes no
 * travel and no stutter, because a sweep and a flicker fight each other.
 * The caption follows as an ordinary rung.
 */
export function ArcMediaSection({ section, index, motion = "reveal" }: ArcMediaSectionProps) {
  const { media, caption } = section;
  const terminal = motion === "terminal";
  return (
    <ArcBeat
      id={section.id}
      kind="media"
      className="arc-section arc-sec"
      ariaLabel={section.ariaLabel ?? arcTitleText(section.head.title)}
      motion={motion}
    >
      <div className="arc-band">
        <ArcSectionHead
          head={section.head}
          kind="media"
          index={index}
          sectionId={section.id}
          motion={motion}
        />
        <figure className="arc-media arc-reveal">
          <div className={`arc-media__frame${terminal ? " arc-ap" : ""}`} {...rung(motion, 0.22)}>
            {media.type === "video" ? (
              <video
                controls
                playsInline
                preload="none"
                poster={media.poster}
                aria-label={caption.label}
              >
                <source src={media.src} type="video/mp4" />
                <a href={media.src}>Download the video</a>
              </video>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={media.src} alt={media.alt ?? ""} loading="lazy" decoding="async" />
            )}
          </div>
          <figcaption className="arc-media__cap" {...rung(motion, 0.44, 0, 18)}>
            <span className="arc-media__cap-main">{caption.label}</span>
            {caption.role ? <span>{caption.role}</span> : null}
            {caption.meta ? <span>{caption.meta}</span> : null}
            <span className="arc-media__cap-src">
              {caption.sourceHref ? (
                <a href={caption.sourceHref} target="_blank" rel="noreferrer">
                  {caption.sourceLabel}
                </a>
              ) : (
                caption.sourceLabel
              )}
            </span>
          </figcaption>
        </figure>
      </div>
    </ArcBeat>
  );
}
