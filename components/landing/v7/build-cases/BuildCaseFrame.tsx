"use client";

import Image from "next/image";
import type { BuildCase } from "./buildCaseData";

interface BuildCaseFrameProps {
  study: BuildCase;
  /** Slide index — drives image priority for the first card only. */
  slideIndex: number;
}

/**
 * Hero plate at the top of a Build case card. A clean image inside a
 * thin border with two gold corner brackets (top-left and bottom-right)
 * — the only HUD chrome that survives on the image. With the
 * surrounding chrome (top/bottom bars, depth ladder, reticle pip,
 * inset thumbnail) stripped when the slide was sparsified, the
 * screenshot is the artifact, not a HUD readout.
 */
export function BuildCaseFrame({ study, slideIndex }: BuildCaseFrameProps) {
  const { hero } = study;

  return (
    <figure className="build-case__frame" aria-labelledby={`build-case-${study.id}-caption`}>
      <div className="build-case__frame__shell">
        <span
          className="build-case__frame__bracket build-case__frame__bracket--tl"
          aria-hidden="true"
        />
        <span
          className="build-case__frame__bracket build-case__frame__bracket--br"
          aria-hidden="true"
        />

        <div className="build-case__frame__hero">
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            sizes="(max-width: 720px) 100vw, (max-width: 1024px) 55vw, 520px"
            className="build-case__frame__hero__img"
            priority={slideIndex === 0}
          />
        </div>
      </div>

      <figcaption id={`build-case-${study.id}-caption`} className="visually-hidden">
        {hero.alt}
      </figcaption>
    </figure>
  );
}
