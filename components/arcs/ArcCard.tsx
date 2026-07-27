import Link from "next/link";

import type { ArcDef } from "@/lib/arcs/types";

/**
 * ArcCard — the collapsed services-card face rebuilt in DOM (ADR-052).
 * Geometry mirrors the WebGL bake (`bakeCardFace`, 840×1360 = 420×680
 * CSS @2x): chamfered shell with a 1px gold gradient hairline (the
 * `.svc-plate` padding-trick), gold-duotone photo under top + ground
 * scrims, a dot-matrix veil that resolves on hover, the filled gold
 * chip top-left, and the bottom-anchored title + lede. The whole card
 * is one link to the arc — no expand/collapse.
 */
export function ArcCard({ arc }: { arc: ArcDef }) {
  return (
    <Link
      href={`/arcs/${arc.slug}`}
      className="arc-card"
      aria-label={`${arc.format}: ${arc.cardTitle}`}
    >
      <span className="arc-card__sh" aria-hidden="true">
        <span className="arc-card__bd">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="arc-card__photo"
            src={arc.cardImage.src}
            alt=""
            width={840}
            height={1360}
            loading="lazy"
            decoding="async"
          />
          <span className="arc-card__scrim" />
          <span className="arc-card__veil" />
          <span className="arc-card__tick arc-card__tick--tr" />
          <span className="arc-card__tick arc-card__tick--bl" />
        </span>
      </span>
      <span className="arc-card__chip">{arc.format}</span>
      <span className="arc-card__copy">
        <span className="arc-card__title">{arc.cardTitle}</span>
        <span className="arc-card__lede">{arc.cardLede}</span>
      </span>
    </Link>
  );
}
