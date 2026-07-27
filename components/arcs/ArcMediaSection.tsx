import type { ArcSectionOf } from "@/lib/arcs/types";

import { ArcSectionHead } from "./ArcSectionHead";
import { arcTitleText } from "./chrome";

interface ArcMediaSectionProps {
  section: ArcSectionOf<"media">;
  index: number;
}

/**
 * ArcMediaSection — a framed figure under a two-column head. Video is
 * strictly `preload="none"` + poster (the arc mp4s are 13–20 MB — zero
 * bytes load until play; never autoplay). Content media renders in
 * natural color — the gold duotone is card/chrome treatment only.
 */
export function ArcMediaSection({ section, index }: ArcMediaSectionProps) {
  const { media, caption } = section;
  return (
    <section
      id={section.id}
      className="arc-section arc-sec"
      aria-label={section.ariaLabel ?? arcTitleText(section.head.title)}
    >
      <div className="arc-band">
        <ArcSectionHead head={section.head} kind="media" index={index} sectionId={section.id} />
        <figure className="arc-media arc-reveal">
          <div className="arc-media__frame">
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
          <figcaption className="arc-media__cap">
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
    </section>
  );
}
