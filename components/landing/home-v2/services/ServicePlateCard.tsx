import { Fragment, type CSSProperties } from "react";

import type { ServicePlate } from "./servicePlateData";

/**
 * ServicePlateCard — one "Thoughtform Prime" signal plate with two states
 * (collapse handoff, S4 "signal chit" seed → FULL-BLEED C3 open card, per the
 * Collapse States canvas where every cluster frame opens into the original
 * `.sp.c3` plate):
 *
 *   collapsed  a SEED carrying identity anchors: ghost chip + dim status code,
 *              seed title, and a 46px dot-matrix feed band ("Standby").
 *   open       the original full-bleed signal plate: the photo COVERS the
 *              whole card (dots + soft hologram layers + C3 scrim, resolves
 *              on hover), gold chip, status appends "· Open", then — below
 *              the photo window — feed caption, title, lede, includes, CTA.
 *
 * Morph (canvas SEQ choreography): the plate grows (width + the two grid
 * regions trade heights), the seed's title/band collapse while the full-bleed
 * photo fades in over the growing body, then the open text stack rises in
 * small staggered steps and the chip flips ghost → gold. Close is the faster
 * reverse. All transitions live in services.css.
 *
 * The seed's whole plate is clickable via the stretched chip button
 * (`__hit::after`), a real <button> with aria-expanded/aria-controls. Clicking
 * the open card does nothing except its CTA. `state` is owned by the parent
 * (`ServicesPlateCluster`): scroll-owned in production, click-owned in the lab.
 */
export interface ServicePlateCardProps {
  service: ServicePlate;
  state: "open" | "collapsed";
  /** Request this card to open (seed click / Enter). No-op when already open. */
  onOpen: (id: ServicePlate["id"]) => void;
  /** Inline position vars from the cluster layout (desktop spread). */
  style?: CSSProperties;
}

export function ServicePlateCard({ service, state, onOpen, style }: ServicePlateCardProps) {
  const open = state === "open";
  const revealId = `svc-plate-${service.id}-reveal`;
  // The full-bleed layers center on the pre-centered portrait crop; the seed
  // band is a thin landscape strip, so it picks the face band via the
  // per-photo position (both via CSS vars, WebP with JPG fallback).
  const photoStyle = {
    "--photo-webp": `url(${service.photo.webp})`,
    "--photo-jpg": `url(${service.photo.jpg})`,
    "--photo-pos": service.photo.position,
  } as CSSProperties;

  return (
    <article className="svc-plate" data-state={state} data-service={service.id} style={style}>
      <div className="svc-plate__sh">
        <div className="svc-plate__bd" style={photoStyle}>
          {/* ── Full-bleed hologram photo (open state) ── */}
          <i
            className="svc-plate__pbg svc-plate__pbg--dots"
            role="img"
            aria-label={open ? service.photo.alt : undefined}
            aria-hidden={!open}
          />
          <i className="svc-plate__pbg svc-plate__pbg--soft" aria-hidden="true" />
          <i className="svc-plate__pgrade" aria-hidden="true" />

          {/* ── Invariant anchor: the chip row ── */}
          <header className="svc-plate__crow">
            <button
              type="button"
              className="svc-plate__hit"
              aria-expanded={open}
              aria-controls={revealId}
              tabIndex={open ? -1 : undefined}
              onClick={() => {
                if (!open) onOpen(service.id);
              }}
            >
              <span className="svc-plate__chip">
                <span className="svc-plate__dia" aria-hidden="true" />
                {service.chip}
              </span>
            </button>
            <span className="svc-plate__st">
              {service.statusCode}
              {open ? " · Open" : ""}
            </span>
          </header>

          {/* ── Seed body (S4): title + feed band — collapses on open ── */}
          <div className="svc-plate__seed" aria-hidden={open}>
            <div className="svc-plate__seed-inner">
              <div className="svc-plate__seed-title">{service.title}</div>
              <div className="svc-plate__band">
                <i className="svc-plate__band-im" />
                <i className="svc-plate__band-scrim" />
                <div className="svc-plate__cap">
                  <span>{service.feedLabel.split(" · ")[0]}</span>
                  <span className="svc-plate__cap-g">Standby</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Open body (C3): photo window → caption → title → lede → inc → CTA ── */}
          <div className="svc-plate__reveal" id={revealId} aria-hidden={!open}>
            <div className="svc-plate__reveal-inner">
              <div className="svc-plate__pspace" aria-hidden="true" />

              <div className="svc-plate__pcap svc-plate__fx svc-plate__fx--d1">
                <span>{service.feedLabel}</span>
                <span className="svc-plate__cap-g">{service.feedStatus}</span>
              </div>

              <h3 className="svc-plate__title svc-plate__fx svc-plate__fx--d2">{service.title}</h3>

              <p className="svc-plate__lede svc-plate__fx svc-plate__fx--d3">
                {service.lede.map((seg, i) =>
                  typeof seg === "string" ? (
                    <Fragment key={i}>{seg}</Fragment>
                  ) : (
                    <em key={i}>{seg.em}</em>
                  )
                )}
              </p>

              <div className="svc-plate__inc svc-plate__fx svc-plate__fx--d4">
                {service.includes.map((item, i) => (
                  <Fragment key={item}>
                    {i > 0 && <b aria-hidden="true">·</b>}
                    <span>{item}</span>
                  </Fragment>
                ))}
              </div>

              <a
                className={`svc-plate__cta${service.focus ? " svc-plate__cta--solid" : ""} svc-plate__fx svc-plate__fx--d5`}
                href={service.ctaHref}
                tabIndex={open ? undefined : -1}
              >
                {service.ctaLabel}
                <span className="svc-plate__aro" aria-hidden="true">
                  →
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
