"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { openPlateRef } from "@/lib/services-ring/openPlateRef";
import { useHologramConnectors, type RingCardAnchor } from "@/lib/stores/hologramConnectorStore";
import type { ServiceId } from "./serviceData";
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

/**
 * Pointer-look amplitude in radians (ADR-021: the parked instrument moves ONLY
 * when the mouse moves — there is no wall-clock term anywhere here either).
 *
 * The derivation MIRRORS `ServicesHologramScene`'s rig exactly — same
 * viewport-normalized pointer, same `yaw = nx · amp`, same
 * `pitch = −ny · amp · 0.6`, same `delta · 4` damping — so the plate leans
 * WITH the instrument behind it rather than against it. Only the amplitude
 * differs: the rig runs 0.12 rad, but the plate is a far larger object on
 * screen, so an equal angle would be a much larger pixel sweep and would cost
 * text crispness. 0.045 rad ≈ 2.6° of yaw reads as the same material without
 * smearing a spec sheet.
 */
const LOOK_AMP = 0.045;
/** Mouse Y is damped harder than X, as on the rig. */
const LOOK_PITCH_RATIO = 0.6;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Seat {
  collapsed: Rect;
  grown: Rect;
}

/**
 * Derive both plate rects from the card's projected anchor (host-local).
 * Pure — called at open, at close, and per frame while tracking, so the
 * grown rect always re-derives from wherever the card currently is.
 */
function deriveSeat(origin: DOMRect, anchor: RingCardAnchor | undefined): Seat {
  // Seat on the card's published rect when we have one. Without it (mobile,
  // an un-parked instrument, or a lab with no canvas) fall back to a centred
  // seat so the plate is never unreachable.
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
  const grownW = Math.min(collapsed.w * EXPAND_W_MUL, Math.max(0, origin.width - EDGE_MARGIN * 2));
  const centreX = collapsed.x + collapsed.w / 2;
  const grownX = Math.min(
    Math.max(centreX - grownW / 2, EDGE_MARGIN),
    Math.max(EDGE_MARGIN, origin.width - EDGE_MARGIN - grownW)
  );

  return { collapsed, grown: { x: grownX, y: collapsed.y, w: grownW, h: collapsed.h } };
}

interface ServiceOpenPlateProps {
  /** The service whose plate is open, or null for closed. */
  serviceId: ServicePlateId | null;
  onClose: () => void;
}

export function ServiceOpenPlate({ serviceId, onClose }: ServiceOpenPlateProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const plateRef = useRef<HTMLElement>(null);

  /**
   * The seat is measured at open time for the GROW transition, then — once
   * grown — the plate RIDES the card's live projected rect (owner,
   * 2026-07-26: "this is one entity... the opened card should inherit the
   * behaviour of the closed card"). The anchors are read IMPERATIVELY via
   * `getState()` per frame, never subscribed: a subscription would re-render
   * this whole spec sheet at WebGL frame rate. React state only changes at
   * the open/close boundaries; the per-frame follow writes styles directly.
   */
  const [seat, setSeat] = useState<Seat | null>(null);
  const [grown, setGrown] = useState(false);
  /** The service the plate was last open FOR — the close path re-derives its
   *  collapse target from that card's live rect. */
  const lastIdRef = useRef<ServiceId | null>(null);
  /** The follow loop's current rect. Read during render so the close-path
   *  re-render starts the collapse FROM the tracked position instead of
   *  snapping back to the stale open-time rect for one frame. */
  const trackedRectRef = useRef<Rect | null>(null);

  useEffect(() => {
    if (!serviceId) {
      // Re-derive the collapse target from wherever the card is NOW — the
      // ring kept swaying while the plate was open, so the frozen open-time
      // seat may no longer be under the card. Landing the collapse on the
      // live rect is what makes the plate visibly hand BACK to the card.
      const host = hostRef.current;
      const lastId = lastIdRef.current;
      if (host && lastId) {
        const origin = host.getBoundingClientRect();
        const anchor = useHologramConnectors
          .getState()
          .ringAnchors.find((a) => a.serviceId === lastId);
        if (anchor) setSeat(deriveSeat(origin, anchor));
      }
      setGrown(false);
      const t = window.setTimeout(() => setSeat(null), GROW_MS);
      return () => window.clearTimeout(t);
    }

    const host = hostRef.current;
    if (!host) return;
    lastIdRef.current = serviceId;
    const origin = host.getBoundingClientRect();
    const anchor = useHologramConnectors
      .getState()
      .ringAnchors.find((a) => a.serviceId === serviceId);

    setSeat(deriveSeat(origin, anchor));
    // Two paints: mount at the collapsed rect, then transition to the grown
    // one. Spaced by a TIMEOUT, not rAF — rAF is throttled to a standstill in
    // hidden documents, which would strand the plate at card size during
    // headed verification (the services-anchor-lab replay lesson).
    const t = window.setTimeout(() => setGrown(true), 20);
    return () => window.clearTimeout(t);
  }, [serviceId]);

  /**
   * The one-entity bridge (ADR-050): while the plate is open, the WebGL card
   * it grew out of HIDES — `ServicesCardRing` reads this ref per frame and
   * damps that card's materials out while still projecting its rect. Written
   * in the same effect pass as the seat so the card starts receding the
   * moment the plate starts growing.
   */
  useEffect(() => {
    openPlateRef.current.serviceId = serviceId;
    return () => {
      openPlateRef.current.serviceId = null;
    };
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

  /**
   * Ride the rig (the "one entity" contract). Engages only once GROWN — the
   * grow itself is the CSS transition; tracking mid-grow would fight it.
   *
   * After the grow completes the plate switches to `data-tracking` (geometry
   * transitions off — every frame write would otherwise lag by the grow
   * duration) and each frame:
   *
   *  1. FOLLOWS the hidden card's live projected rect. The card keeps
   *     projecting while hidden (see ServicesCardRing's plate-hide channel),
   *     and that rect already carries the rig's damped pointer-look and the
   *     bounded ADR-021 sway — so the plate moves exactly as the card it
   *     replaced would have, rather than mirroring an approximation of it.
   *  2. Adds the small rotation tilt (same rig formula, LOOK_AMP amplitude)
   *     that the flat rect cannot carry.
   *
   * Everything is written straight onto the element — styles and custom
   * props, never React state: this runs at frame rate, and a setState here
   * would re-render the whole spec sheet every frame.
   */
  useEffect(() => {
    const plate = plateRef.current;
    const host = hostRef.current;
    if (!grown || !plate || !host || !serviceId) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = { pitch: 0, yaw: 0 };
    const damp = { pitch: 0, yaw: 0 };
    /** Damped follow rect — seeded from the current React-applied geometry. */
    const rect = { ...(grown && seat ? seat.grown : { x: 0, y: 0, w: 0, h: 0 }) };

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1; // -1..1
      const ny = (e.clientY / window.innerHeight) * 2 - 1; // -1..1
      target.pitch = -ny * LOOK_AMP * LOOK_PITCH_RATIO;
      target.yaw = nx * LOOK_AMP;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    // Geometry transitions off from the first tracked frame.
    let tracking = false;
    const trackTimer = window.setTimeout(() => {
      plate.setAttribute("data-tracking", "");
      tracking = true;
    }, 40);

    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      // First frame has no baseline; seed it rather than integrating from 0.
      const delta = last ? Math.min(1 / 30, (t - last) / 1000) : 0;
      last = t;

      // Rotation tilt — the rig's own damping constant.
      const kLook = Math.min(1, delta * 4);
      damp.pitch += (target.pitch - damp.pitch) * kLook;
      damp.yaw += (target.yaw - damp.yaw) * kLook;
      plate.style.setProperty("--svc-open-rx", `${damp.pitch.toFixed(4)}rad`);
      plate.style.setProperty("--svc-open-ry", `${damp.yaw.toFixed(4)}rad`);

      // Live-rect follow. The source is already rig-damped; the light damp
      // here only smooths publish quantisation. Anchor gone (card occluded,
      // instrument un-parked) → hold the last rect; scroll closes us anyway.
      if (tracking) {
        const anchor = useHologramConnectors
          .getState()
          .ringAnchors.find((a) => a.serviceId === serviceId);
        if (anchor) {
          const origin = host.getBoundingClientRect();
          const live = deriveSeat(origin, anchor).grown;
          const kFollow = Math.min(1, delta * 10);
          rect.x += (live.x - rect.x) * kFollow;
          rect.y += (live.y - rect.y) * kFollow;
          rect.w += (live.w - rect.w) * kFollow;
          rect.h += (live.h - rect.h) * kFollow;
          plate.style.left = `${rect.x.toFixed(1)}px`;
          plate.style.top = `${rect.y.toFixed(1)}px`;
          plate.style.width = `${rect.w.toFixed(1)}px`;
          plate.style.height = `${rect.h.toFixed(1)}px`;
          trackedRectRef.current = { ...rect };
        }
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.clearTimeout(trackTimer);
      window.cancelAnimationFrame(raf);
      plate.removeAttribute("data-tracking");
      plate.style.removeProperty("--svc-open-rx");
      plate.style.removeProperty("--svc-open-ry");
      // Deliberately NOT nulling trackedRectRef here: the close-path render
      // still needs it as the collapse's starting rect. It reseeds on the
      // next open.
    };
    // `seat` is deliberately NOT a dependency: it only seeds the follow rect.
    // Re-running on the close-path seat write would tear tracking down a
    // frame early; the `grown`/`serviceId` flips are the real boundaries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grown, serviceId]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  if (!seat) return <div ref={hostRef} className="svc-open" aria-hidden="true" />;

  // Ref reads during render, both deliberate (the lint warning is accepted —
  // the overlay layers already read layout refs in render, the
  // PlateConnectorOverlay precedent):
  //  · On the close path `serviceId` is already null but the COLLAPSE still
  //    has to play — render the last-open service's content until the seat
  //    clears (unmounting at null was the original bug: the plate vanished
  //    instantly instead of handing back to the card).
  //  · While grown, prefer the follow loop's live rect: the close-path's
  //    first re-render must start the collapse from where the plate actually
  //    IS, not snap back to the stale open-time rect for a frame.
  const displayId = serviceId ?? lastIdRef.current;
  // eslint-disable-next-line react-hooks/refs -- deliberate render-time read, see above
  const plate = SERVICE_PLATES.find((p) => p.id === displayId);
  // eslint-disable-next-line react-hooks/refs -- deliberate render-time read, see above
  const rect = grown ? (trackedRectRef.current ?? seat.grown) : seat.collapsed;

  return (
    <div ref={hostRef} className="svc-open" data-open={grown || undefined}>
      {plate && (
        <section
          ref={plateRef}
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
