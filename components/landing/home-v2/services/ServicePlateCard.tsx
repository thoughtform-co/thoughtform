"use client";

import { Fragment, useEffect, useRef, type CSSProperties } from "react";

import { advanceScrambles, queueScramble, type ScrambleJob } from "@/lib/home-v2/captionScramble";
import { PlateWireOutline } from "./PlateWireOutline";
import type { ServicePlate } from "./servicePlateData";

/** Plate render treatments (ADR-025 Update 8):
 *  `glass` — the original C3/S4 look (dark glass seeds, dimmed siblings).
 *  `wireframe` — seeds re-cut as gold-ink schematics that materialize into
 *  the same open C3 plate (dotted chamfer outline, whisper-void body, gold
 *  halftone band, title scramble-decode on open). Styling is keyed off
 *  `data-variant` in services.css; look-dev switcher at /test/services-prime. */
export type PlateVariant = "glass" | "wireframe";

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
  /** Render treatment; defaults to the original glass look. */
  variant?: PlateVariant;
}

export function ServicePlateCard({
  service,
  state,
  onOpen,
  style,
  variant = "glass",
}: ServicePlateCardProps) {
  const open = state === "open";
  const revealId = `svc-plate-${service.id}-reveal`;

  // Wireframe materialization: the open C3 title scramble-decodes into place
  // (the corridor caption grammar, same kernel). A self-terminating rAF loop
  // lives here because no services-side ticker exists to reuse —
  // useServicesStageScroll rAFs only on scroll events and the connector
  // overlay re-renders off store pushes; piggybacking either would blur their
  // single-writer contracts. The loop is alive only while a job is in flight
  // (~1s per open). React never clobbers the textContent mutation: the vDOM
  // text ({service.title}) is constant, so re-renders skip the text node.
  // SSR/no-JS keeps the real title in markup.
  const titleRef = useRef<HTMLHeadingElement>(null);
  const scrambleJobsRef = useRef<ScrambleJob[]>([]);
  const scrambleRafRef = useRef(0);
  useEffect(() => {
    const el = titleRef.current;
    if (!el || variant !== "wireframe") return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const stop = () => {
      if (scrambleRafRef.current) cancelAnimationFrame(scrambleRafRef.current);
      scrambleRafRef.current = 0;
      scrambleJobsRef.current.length = 0;
    };
    if (!open || reducedMotion) {
      stop();
      el.textContent = service.title;
      return;
    }
    // Decode in from blank; +0.18s start lands the first resolved characters
    // with the __fx--d2 rise so the decode reads as the title coming online.
    el.textContent = "";
    queueScramble(scrambleJobsRef.current, el, service.title, performance.now() / 1000 + 0.18);
    const tick = () => {
      advanceScrambles(scrambleJobsRef.current, performance.now() / 1000);
      scrambleRafRef.current = scrambleJobsRef.current.length ? requestAnimationFrame(tick) : 0;
    };
    scrambleRafRef.current = requestAnimationFrame(tick);
    return () => {
      // Never leave a half-decoded title behind (close / unmount / variant flip).
      stop();
      el.textContent = service.title;
    };
  }, [open, service.title, variant]);
  // The full-bleed layers center on the pre-centered portrait crop; the seed
  // band is a thin landscape strip, so it picks the face band via the
  // per-photo position (both via CSS vars, WebP with JPG fallback).
  const photoStyle = {
    "--photo-webp": `url(${service.photo.webp})`,
    "--photo-jpg": `url(${service.photo.jpg})`,
    "--photo-pos": service.photo.position,
  } as CSSProperties;

  return (
    <article
      className="svc-plate"
      data-state={state}
      data-service={service.id}
      data-variant={variant}
      style={style}
    >
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

              <h3 ref={titleRef} className="svc-plate__title svc-plate__fx svc-plate__fx--d2">
                {service.title}
              </h3>

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
      {/* Wireframe seed outline — SVG sibling AFTER __sh so the dotted
          stroke paints above the shell, outside its clip-path (a CSS border
          would be shaved at the chamfer, ADR-007). Visibility is CSS-owned:
          seeds show it, the open state fades it out fast and hands off to
          the rectangular echo frame (::before). */}
      {variant === "wireframe" && <PlateWireOutline />}
    </article>
  );
}
