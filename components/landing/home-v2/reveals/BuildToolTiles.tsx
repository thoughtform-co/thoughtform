"use client";

import Image from "next/image";

import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";

/**
 * BuildToolTiles — the Build reveal's content: compact previews of the four
 * production tools (ADR-032), sourced directly from `PROJECT_CASES` (no
 * duplication). Only the public fields are shown (thumb / codename /
 * tagline / status) — the `subline`/`challenge` prose is intentionally NOT
 * rendered here.
 *
 * The panel stands alone; the "open full console" link into the #tools
 * section is gated so retiring #tools later is a one-line flip.
 */
const BUILD_PANEL_TOOLS_LINK = true;

export function BuildToolTiles() {
  return (
    <div className="reveal-tools">
      <ul className="reveal-tools__list">
        {PROJECT_CASES.map((tool) => (
          <li key={tool.id} className="reveal-tools__row">
            <span className="reveal-tools__thumb">
              <Image
                src={tool.image.src}
                alt={tool.image.alt}
                width={96}
                height={54}
                className="reveal-tools__img"
              />
            </span>
            <span className="reveal-tools__meta">
              <span className="reveal-tools__name">{tool.codename}</span>
              <span className="reveal-tools__tagline">{tool.tagline}</span>
            </span>
            <span className="reveal-tools__status">{tool.status}</span>
          </li>
        ))}
      </ul>
      {BUILD_PANEL_TOOLS_LINK && (
        <a className="reveal-tools__more" href="#tools">
          Open full console
          <span className="reveal-tools__more-arrow" aria-hidden="true">
            →
          </span>
        </a>
      )}
    </div>
  );
}
