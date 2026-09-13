import Link from "next/link";

import { kindOf } from "@/lib/arcs/clients";
import type { ClientPageDef } from "@/lib/arcs/clients";
import type { ArcDef, ArcKind } from "@/lib/arcs/types";

interface ArcCardFaceProps {
  href: string;
  chip: string;
  title: string;
  lede: string;
  image: { src: string; alt: string };
  kind: ArcKind;
}

/**
 * ArcCardFace — the collapsed services-card face rebuilt in DOM (ADR-052).
 * Geometry mirrors the WebGL bake (`bakeCardFace`, 840×1360 = 420×680
 * CSS @2x): chamfered shell with a 1px gold gradient hairline (the
 * `.svc-plate` padding-trick), gold-duotone photo under top + ground
 * scrims, a dot-matrix veil that resolves on hover, the filled gold
 * chip top-left, and the bottom-anchored title + lede. The whole card
 * is one link — no expand/collapse.
 *
 * The FACE is the props; `ArcCard` maps an arc onto it and
 * `ArcClientPageCard` a client's non-arc page (ADR-098 U2). One markup,
 * two records — the smoke's chip and count assertions read the same class.
 */
export function ArcCardFace({ href, chip, title, lede, image, kind }: ArcCardFaceProps) {
  return (
    <Link
      href={href}
      className="arc-card"
      /* The overview's filter reads this (ADR-098). Server-rendered, so
         the narrowing is CSS over data rather than a list built in the
         browser, and a reader without JS gets the whole grid. */
      data-kind={kind}
      aria-label={`${chip}: ${title}`}
    >
      <span className="arc-card__sh" aria-hidden="true">
        <span className="arc-card__bd">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="arc-card__photo"
            src={image.src}
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
      <span className="arc-card__chip">{chip}</span>
      <span className="arc-card__copy">
        <span className="arc-card__title">{title}</span>
        <span className="arc-card__lede">{lede}</span>
      </span>
    </Link>
  );
}

/** An arc's card: the face over its own record. */
export function ArcCard({ arc }: { arc: ArcDef }) {
  // Two arcs can share a format (a v1 and its terminal-motion cut), and
  // the chip is the only thing distinguishing them at a glance.
  return (
    <ArcCardFace
      href={`/arcs/${arc.slug}`}
      chip={arc.cardChip ?? arc.format}
      title={arc.cardTitle}
      lede={arc.cardLede}
      image={arc.cardImage}
      kind={kindOf(arc)}
    />
  );
}

/** A client's non-arc page (ADR-098 U2): the same face, linking out. */
export function ArcClientPageCard({ page }: { page: ClientPageDef }) {
  return (
    <ArcCardFace
      href={page.href}
      chip={page.chip}
      title={page.title}
      lede={page.lede}
      image={page.image}
      kind={page.kind}
    />
  );
}
