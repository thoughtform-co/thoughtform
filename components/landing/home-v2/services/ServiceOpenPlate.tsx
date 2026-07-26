"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { useHologramConnectors } from "@/lib/stores/hologramConnectorStore";
import { SERVICE_PLATES, type ServicePlateId } from "./servicePlateData";

/**
 * ServiceOpenPlate — the #services card's OPEN state (ADR-050).
 *
 * The rest face is a baked CanvasTexture on an orbiting WebGL plane, which
 * means its text cannot reflow and is neither selectable, linkable, nor
 * reachable by a screen reader (the reason the front card already needs a fake
 * `<a>` shimmed over its baked CTA box). A spec grid would have needed several
 * more such shims. So the open state is DOM.
 *
 * It is NOT a console beside the card. ADR-029 carries a red-alert guardrail
 * from 2026-07-10 — "never a photo plane plus a separate text console" — and
 * this honours it by HANDING OFF rather than sitting alongside: the plate is
 * seated on the front card's own projected screen rect and grows outward from
 * it while the WebGL card recedes underneath. Exactly one readable object
 * exists at any instant.
 *
 * Content follows the proposal grammar the owner already writes in, minus the
 * `03 / WHO` block (that is what #about is):
 *   01 / WHAT — the lede plus the concrete breakdown
 *   02 / HOW  — the qualification grid (duration, participants, format,
 *               language, what they keep). No price: see `ServiceSpec`.
 */

/** How far the plate grows horizontally, as a multiple of the card's width.
 *  The card is portrait (840×1360 ≈ 0.62); ~2.08× lands a two-column plate
 *  whose photo band keeps the card's proportion on the left. */
const EXPAND_W_MUL = 2.08;
/** Minimum breathing room between the grown plate and the overlay edges. */
const EDGE_MARGIN = 56;
/** Must match the `--svc-open-dur` grow transition in services.css. */
const GROW_MS = 340;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ServiceOpenPlateProps {
  /** The service whose plate is open, or null for closed. */
  serviceId: ServicePlateId | null;
  onClose: () => void;
}

export function ServiceOpenPlate({ serviceId, onClose }: ServiceOpenPlateProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  /**
   * BOTH rects are measured once, at open time, and frozen.
   *
   * The ring keeps swaying (the ADR-021 bounded spring) and re-publishes its
   * screen rects every WebGL frame. Subscribing to `ringAnchors` would
   * re-render this component at frame rate and make the plate jitter for as
   * long as it stayed open — so the anchors are read IMPERATIVELY via
   * `getState()` instead. Once open, the plate is a static object and the card
   * behind it recedes.
   */
  const [seat, setSeat] = useState<{ collapsed: Rect; grown: Rect } | null>(null);
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    if (!serviceId) {
      // Play the collapse, then unmount once it has run.
      setGrown(false);
      const t = window.setTimeout(() => setSeat(null), GROW_MS);
      return () => window.clearTimeout(t);
    }

    const host = hostRef.current;
    if (!host) return;
    const origin = host.getBoundingClientRect();
    const anchor = useHologramConnectors
      .getState()
      .ringAnchors.find((a) => a.serviceId === serviceId);

    // Seat on the card's published rect when we have one. Without it (mobile,
    // an un-parked instrument, or a lab with no canvas) fall back to a
    // centred seat so the plate is never unreachable.
    const fallbackW = Math.min(460, origin.width - EDGE_MARGIN * 2);
    const fallbackH = Math.min(720, origin.height - EDGE_MARGIN * 2);
    const collapsed: Rect = anchor
      ? {
          x: anchor.x - origin.left,
          y: anchor.y - origin.top,
          w: anchor.w,
          h: anchor.h,
        }
      : {
          w: fallbackW,
          h: fallbackH,
          x: (origin.width - fallbackW) / 2,
          y: (origin.height - fallbackH) / 2,
        };

    // Grow symmetrically about the card's centre, clamped inside the overlay.
    const grownW = Math.min(
      collapsed.w * EXPAND_W_MUL,
      Math.max(0, origin.width - EDGE_MARGIN * 2)
    );
    const centreX = collapsed.x + collapsed.w / 2;
    const grownX = Math.min(
      Math.max(centreX - grownW / 2, EDGE_MARGIN),
      Math.max(EDGE_MARGIN, origin.width - EDGE_MARGIN - grownW)
    );

    setSeat({
      collapsed,
      grown: { x: grownX, y: collapsed.y, w: grownW, h: collapsed.h },
    });
    // Two paints: mount at the collapsed rect, then transition to the grown
    // one. Spaced by a TIMEOUT, not rAF — rAF is throttled to a standstill in
    // hidden documents, which would strand the plate at card size during
    // headed verification (the services-anchor-lab replay lesson).
    const t = window.setTimeout(() => setGrown(true), 20);
    return () => window.clearTimeout(t);
  }, [serviceId]);

  /**
   * Dismissal. Scroll owns which card is front across a 500svh runway, so a
   * plate that survived scrolling would sit still while the ring rotated
   * behind it. Any scroll closes it — that keeps `useServicesStageScroll` the
   * single scroll writer instead of scroll-locking a scroll-driven corridor.
   */
  useEffect(() => {
    if (!serviceId) return;
    const close = () => onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("wheel", close, { passive: true });
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", close);
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [serviceId, onClose]);

  // Move focus into the plate so keyboard users land on the new content.
  useEffect(() => {
    if (grown) closeBtnRef.current?.focus();
  }, [grown]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  if (!seat) return <div ref={hostRef} className="svc-open" aria-hidden="true" />;

  const plate = SERVICE_PLATES.find((p) => p.id === serviceId);
  const rect = grown ? seat.grown : seat.collapsed;

  return (
    <div ref={hostRef} className="svc-open" data-open={grown || undefined}>
      {plate && (
        <section
          className="svc-open__plate"
          aria-label={`${plate.chip} — details`}
          style={
            {
              left: `${rect.x.toFixed(1)}px`,
              top: `${rect.y.toFixed(1)}px`,
              width: `${rect.w.toFixed(1)}px`,
              height: `${rect.h.toFixed(1)}px`,
            } as CSSProperties
          }
        >
          {/* Device-slab anatomy, matching the WebGL card it grew out of
              (ADR-029 Update 1): an extruded thickness behind the face, the
              chamfered gold shell, the dotted echo frame, and an edge glint
              along the lit corner. Without the slab + glint the plate reads
              as a flat panel and the handoff stops feeling like the same
              object. */}
          <i className="svc-open__slab" aria-hidden="true" />
          <i className="svc-open__sh" aria-hidden="true" />
          <i className="svc-open__echo" aria-hidden="true" />

          {/* The glass body is PADDED — that rim is the device bezel the ring
              cards carry around their readable content. */}
          <div className="svc-open__bd">
            <div className="svc-open__inner">
              {/* Left band: the card's own photo, so the object that grew is
                  visibly the SAME object.
                  The photo URLs go through custom props (the
                  `.svc-plate__pbg` convention) because THREE layers share
                  them: the soft ghost, the dot-masked feed, and nothing else
                  may composite dark dots over a clean photo — that inversion
                  was explicitly rejected on the bake. */}
              <div
                className="svc-open__photo"
                style={
                  plate.photo
                    ? ({
                        "--photo-webp": `url(${plate.photo.webp})`,
                        "--photo-jpg": `url(${plate.photo.jpg})`,
                        "--photo-pos": plate.photo.position,
                      } as CSSProperties)
                    : undefined
                }
                data-photo={plate.photo ? undefined : "off"}
                role="img"
                aria-label={plate.photo?.alt ?? ""}
              >
                <i className="svc-open__veil" aria-hidden="true" />
                <span className="svc-open__chip">
                  <i className="svc-open__chip-dia" aria-hidden="true" />
                  {plate.chip}
                </span>
              </div>

              <div className="svc-open__copy">
                <button
                  ref={closeBtnRef}
                  type="button"
                  className="svc-open__close"
                  onClick={handleClose}
                  aria-label="Close details"
                >
                  ✕
                </button>

                {/* ── 01 / WHAT ─────────────────────────────────────────── */}
                <div className="svc-open__block">
                  <span className="svc-open__desig" aria-hidden="true">
                    01 / What
                  </span>
                  <p className="svc-open__lede">
                    {plate.lede.map((seg, i) =>
                      typeof seg === "string" ? (
                        <Fragment key={i}>{seg}</Fragment>
                      ) : (
                        <em key={i}>{seg.em}</em>
                      )
                    )}
                  </p>
                  <ul className="svc-open__list">
                    {plate.breakdown.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* ── 02 / HOW ──────────────────────────────────────────── */}
                <div className="svc-open__block">
                  <span className="svc-open__desig" aria-hidden="true">
                    02 / How
                  </span>
                  <dl className="svc-open__spec">
                    <div>
                      <dt>Duration</dt>
                      <dd>{plate.spec.duration}</dd>
                    </div>
                    <div>
                      <dt>Participants</dt>
                      <dd>{plate.spec.participants}</dd>
                    </div>
                    <div>
                      <dt>Format</dt>
                      <dd>{plate.spec.format}</dd>
                    </div>
                    <div>
                      <dt>Language</dt>
                      <dd>{plate.spec.language}</dd>
                    </div>
                    <div className="svc-open__spec-wide">
                      <dt>Leaves with</dt>
                      <dd>{plate.spec.leavesWith}</dd>
                    </div>
                  </dl>
                </div>

                <a className="svc-open__cta" href={plate.ctaHref}>
                  {plate.ctaLabel}
                  <i className="svc-open__aro" aria-hidden="true">
                    →
                  </i>
                </a>
              </div>
            </div>
          </div>

          {/* Edge glint along the lit top edge + the two chamfer cuts. Drawn
              LAST so it sits over the glass, the way the WebGL slab's glint
              rides its front face. */}
          <i className="svc-open__glint" aria-hidden="true" />
        </section>
      )}
    </div>
  );
}
