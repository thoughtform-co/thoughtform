"use client";

import Image from "next/image";
import type { BuildCase } from "./buildCaseData";

interface BuildCaseFrameProps {
  study: BuildCase;
  /** Slide index — drives image priority for the first card only. */
  slideIndex: number;
  /** "a" mirrors brackets to TL/BR; "b" mirrors to TR/BL. */
  variant: "a" | "b";
}

/**
 * Image plate for a build case. The screenshot lives inside a minimal
 * frame: two corner brackets (alternating side per case) on a thin border.
 *
 * All other HUD chrome — top/bottom bars, depth ladder, reticle pip,
 * inset thumbnail — was stripped when the cases were sparsified. The
 * screenshot is the artifact, not a HUD readout. The bracket survives
 * as the brand stamp.
 */
export function BuildCaseFrame({ study, slideIndex, variant }: BuildCaseFrameProps) {
  const { hero } = study;

  return (
    <figure
      className={`build-case__frame build-case__frame--${variant}`}
      aria-labelledby={`build-case-${study.id}-caption`}
    >
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
            sizes="(max-width: 760px) 100vw, (max-width: 1200px) 60vw, 760px"
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
