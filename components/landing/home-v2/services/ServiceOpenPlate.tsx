"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

import { openPlateRef } from "@/lib/services-ring/openPlateRef";
import { useHologramConnectors, type RingCardAnchor } from "@/lib/stores/hologramConnectorStore";
import type { ServiceId } from "./serviceData";
import { SERVICE_PLATES, type ServicePlateId } from "./servicePlateData";

/**
 * ServiceOpenPlate — the #services card's OPEN state (ADR-050, rev 2).
 *
 * ONE ENTITY, NO CROSSFADE (owner, 2026-07-26 twice: "it should pop open,
 * not introduce a new component", then "why can't you just transform the
 * closed card into the full card without any cheating like cross fades").
 * Rev 1 damped the WebGL card out while this plate faded/grew in — a
 * crossfade wearing a costume. Rev 2 is a buffer swap plus a mechanical
 * transform:
 *
 *  1. MOUNT a pixel-parity DOM replica of the tight baked face on the card's
 *     live projected rect, at full opacity (the CSS values are the bake's ÷ 2
 *     — the parity contract exists for exactly this).
 *  2. SWAP: one painted frame later the WebGL card SNAPS off (no damp; the
 *     replica already covers it, so the swap is invisible).
 *  3. TRANSFORM: the plate's width transitions and the spec DRAWER is
 *     uncovered by the moving edge. Geometry reveals it; nothing on the
 *     entity ever animates opacity.
 *
 * Close plays it backwards: drawer retracts, card snaps back on, replica
 * unmounts a frame later.
 *
 * While open the plate RIDES the hidden card's live rect (the card keeps
 * projecting — see ServicesCardRing's plate-hide channel), inheriting the
 * rig's pointer-look and the bounded ADR-021 sway, with the small rotation
 * tilt on top. All per-frame writes go straight to the element; React state
 * changes only at the open/close boundaries.
 */

/** Preferred drawer width (px); shrinks to fit the viewport margin. */
const DRAWER_W = 440;
const DRAWER_MIN = 300;
/** Minimum breathing room between the grown plate and the overlay edges. */
const EDGE_MARGIN = 40;
/** Must match `--svc-open-dur` in services.css. */
const GROW_MS = 340;
/** Fallback (ms) for the swap when rAF is throttled (hidden documents). */
const SWAP_FALLBACK_MS = 80;

/** Pointer-look amplitude (radians) — the rig's formula at reduced amplitude
 *  (0.045 vs the rig's 0.12: the plate is a far larger on-screen object). */
const LOOK_AMP = 0.045;
const LOOK_PITCH_RATIO = 0.6;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type DrawerSide = "right" | "left";

interface Seat {
  /** The card's own rect (the face replica's footprint). */
  card: Rect;
  /** The full open rect: card + drawer, side-aware. */
  plate: Rect;
  side: DrawerSide;
  drawerW: number;
}

/**
 * Derive the seat from the card's projected anchor (host-local). Pure —
 * called at open, at close, and per frame while tracking. The drawer opens
 * toward whichever side has room; the CARD NEVER MOVES.
 */
function deriveSeat(origin: DOMRect, anchor: RingCardAnchor | undefined): Seat {
  const fallbackW = Math.min(460, origin.width - EDGE_MARGIN * 2);
  const fallbackH = Math.min(720, origin.height - EDGE_MARGIN * 2);
  const card: Rect = anchor
    ? { x: anchor.x - origin.left, y: anchor.y - origin.top, w: anchor.w, h: anchor.h }
    : {
        w: fallbackW,
        h: fallbackH,
        x: (origin.width - fallbackW) / 2,
        y: (origin.height - fallbackH) / 2,
      };

  const roomRight = origin.width - EDGE_MARGIN - (card.x + card.w);
  const roomLeft = card.x - EDGE_MARGIN;
  const side: DrawerSide = roomRight >= DRAWER_MIN || roomRight >= roomLeft ? "right" : "left";
  const room = side === "right" ? roomRight : roomLeft;
  const drawerW = Math.max(DRAWER_MIN, Math.min(DRAWER_W, room));

  const plate: Rect =
    side === "right"
      ? { x: card.x, y: card.y, w: card.w + drawerW, h: card.h }
      : { x: card.x - drawerW, y: card.y, w: card.w + drawerW, h: card.h };

  return { card, plate, side, drawerW };
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

  const [seat, setSeat] = useState<Seat | null>(null);
  const [open, setOpen] = useState(false);
  /** The service the plate was last open FOR — the close path re-derives its
   *  collapse target from that card's live rect, and the render keeps showing
   *  its content while the retract plays. */
  const lastIdRef = useRef<ServiceId | null>(null);
  /** The follow loop's current plate rect — the close-path render starts the
   *  retract from here instead of a stale open-time rect. */
  const trackedRectRef = useRef<Rect | null>(null);

  useEffect(() => {
    if (!serviceId) {
      // ── CLOSE: retract → swap the card back on → unmount ──────────────
      const host = hostRef.current;
      const lastId = lastIdRef.current;
      if (host && lastId) {
        const origin = host.getBoundingClientRect();
        const anchor = useHologramConnectors
          .getState()
          .ringAnchors.find((a) => a.serviceId === lastId);
        if (anchor) setSeat(deriveSeat(origin, anchor));
      }
      setOpen(false);
      // The card snaps back only AFTER the drawer has retracted onto its
      // rect — swapping mid-retract would show card + half-open plate.
      const swapBack = window.setTimeout(() => {
        openPlateRef.current.serviceId = null;
      }, GROW_MS);
      const unmount = window.setTimeout(() => setSeat(null), GROW_MS + 40);
      return () => {
        window.clearTimeout(swapBack);
        window.clearTimeout(unmount);
        openPlateRef.current.serviceId = null;
      };
    }

    // ── OPEN: mount replica → swap the card off → uncover the drawer ────
    const host = hostRef.current;
    if (!host) return;
    lastIdRef.current = serviceId;
    const origin = host.getBoundingClientRect();
    const anchor = useHologramConnectors
      .getState()
      .ringAnchors.find((a) => a.serviceId === serviceId);
    setSeat(deriveSeat(origin, anchor));

    // The swap waits for the replica to have PAINTED (double rAF), so the
    // card vanishes under an identical set of pixels — never before them.
    // The timeout is the hidden-document fallback (rAF stalls there).
    let swapped = false;
    const swap = () => {
      if (swapped) return;
      swapped = true;
      openPlateRef.current.serviceId = serviceId;
    };
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(swap);
    });
    const swapFallback = window.setTimeout(swap, SWAP_FALLBACK_MS);

    // The transform starts after the swap has landed.
    const grow = window.setTimeout(() => setOpen(true), SWAP_FALLBACK_MS + 20);
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(swapFallback);
      window.clearTimeout(grow);
    };
  }, [serviceId]);

  // Safety: never leave the card hidden past this component's life.
  useEffect(
    () => () => {
      openPlateRef.current.serviceId = null;
    },
    []
  );

  /**
   * Dismissal. Scroll owns which card is front across the 500svh runway, so
   * any scroll closes the plate — `useServicesStageScroll` stays the single
   * scroll writer; a scroll-driven corridor is never scroll-locked.
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

  // Move focus into the drawer so keyboard users land on the new content.
  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  /**
   * Ride the rig. Engages once OPEN (tracking mid-grow would fight the width
   * transition): `data-tracking` kills the geometry transition, then each
   * frame the plate follows the hidden card's live projected rect — which
   * carries the rig's damped pointer-look and the bounded sway — plus the
   * small rotation tilt the flat rect cannot carry. All writes go straight
   * to the element; a setState here would re-render the spec sheet at frame
   * rate.
   */
  useEffect(() => {
    const plateEl = plateRef.current;
    const host = hostRef.current;
    if (!open || !plateEl || !host || !serviceId) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = { pitch: 0, yaw: 0 };
    const damp = { pitch: 0, yaw: 0 };
    const rect: Rect | null = seat ? { ...seat.plate } : null;

    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1; // -1..1
      const ny = (e.clientY / window.innerHeight) * 2 - 1; // -1..1
      target.pitch = -ny * LOOK_AMP * LOOK_PITCH_RATIO;
      target.yaw = nx * LOOK_AMP;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let tracking = false;
    const trackTimer = window.setTimeout(() => {
      plateEl.setAttribute("data-tracking", "");
      tracking = true;
    }, 40);

    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      const delta = last ? Math.min(1 / 30, (t - last) / 1000) : 0;
      last = t;

      // Rotation tilt — the rig's own damping constant.
      const kLook = Math.min(1, delta * 4);
      damp.pitch += (target.pitch - damp.pitch) * kLook;
      damp.yaw += (target.yaw - damp.yaw) * kLook;
      plateEl.style.setProperty("--svc-open-rx", `${damp.pitch.toFixed(4)}rad`);
      plateEl.style.setProperty("--svc-open-ry", `${damp.yaw.toFixed(4)}rad`);

      // Live-rect follow: source is already rig-damped; the light damp here
      // only smooths publish quantisation. Anchor gone → hold; scroll
      // closes us anyway.
      if (tracking && rect) {
        const anchor = useHologramConnectors
          .getState()
          .ringAnchors.find((a) => a.serviceId === serviceId);
        if (anchor) {
          const origin = host.getBoundingClientRect();
          const live = deriveSeat(origin, anchor);
          const kFollow = Math.min(1, delta * 10);
          rect.x += (live.plate.x - rect.x) * kFollow;
          rect.y += (live.plate.y - rect.y) * kFollow;
          rect.w += (live.plate.w - rect.w) * kFollow;
          rect.h += (live.plate.h - rect.h) * kFollow;
          plateEl.style.left = `${rect.x.toFixed(1)}px`;
          plateEl.style.top = `${rect.y.toFixed(1)}px`;
          plateEl.style.width = `${rect.w.toFixed(1)}px`;
          plateEl.style.height = `${rect.h.toFixed(1)}px`;
          plateEl.style.setProperty("--svc-card-w", `${live.card.w.toFixed(1)}px`);
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
      plateEl.removeAttribute("data-tracking");
      plateEl.style.removeProperty("--svc-open-rx");
      plateEl.style.removeProperty("--svc-open-ry");
      // trackedRectRef deliberately survives — the close render starts the
      // retract from it. It reseeds on the next open.
    };
    // `seat` only seeds the follow rect; re-running on the close-path seat
    // write would tear tracking down a frame early.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, serviceId]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  if (!seat) return <div ref={hostRef} className="svc-open" aria-hidden="true" />;

  // Ref reads during render, deliberate (accepted lint warnings — the
  // overlay-layer precedent): the close path renders the LAST service's
  // content while the retract plays (unmounting at null was rev 1's bug —
  // the plate vanished instantly), and the retract must start from the
  // TRACKED rect, not the stale open-time one.
  const displayId = serviceId ?? lastIdRef.current;
  // eslint-disable-next-line react-hooks/refs -- deliberate render-time read, see above
  const plate = SERVICE_PLATES.find((p) => p.id === displayId);
  // eslint-disable-next-line react-hooks/refs -- deliberate render-time read, see above
  const tracked = trackedRectRef.current;
  const rect = open ? (tracked ?? seat.plate) : seat.card;

  return (
    <div ref={hostRef} className="svc-open">
      {plate && (
        <section
          ref={plateRef}
          className="svc-open__plate"
          data-stage={open ? "open" : "face"}
          data-side={seat.side}
          aria-label={`${plate.chip} — details`}
          style={
            {
              left: `${rect.x.toFixed(1)}px`,
              top: `${rect.y.toFixed(1)}px`,
              width: `${rect.w.toFixed(1)}px`,
              height: `${rect.h.toFixed(1)}px`,
              "--svc-card-w": `${seat.card.w.toFixed(1)}px`,
              "--svc-drawer-w": `${seat.drawerW.toFixed(1)}px`,
            } as CSSProperties
          }
        >
          <i className="svc-open__slab" aria-hidden="true" />
          <i className="svc-open__sh" aria-hidden="true" />
          <i className="svc-open__echo" aria-hidden="true" />

          <div className="svc-open__bd">
            {/* ── The CARD — pixel-parity replica of the tight baked face.
                   It never moves and never fades: at the swap frame it IS
                   the card, and it stays the card while the drawer opens. */}
            <div
              className="svc-open__card"
              data-photo={plate.photo ? undefined : "off"}
              style={
                plate.photo
                  ? ({
                      "--photo-webp": `url(${plate.photo.webp})`,
                      "--photo-jpg": `url(${plate.photo.jpg})`,
                    } as CSSProperties)
                  : undefined
              }
              role="img"
              aria-label={plate.photo?.alt ?? ""}
            >
              <i className="svc-open__pbg svc-open__pbg--soft" aria-hidden="true" />
              <i className="svc-open__pbg svc-open__pbg--dots" aria-hidden="true" />
              <i className="svc-open__scrim" aria-hidden="true" />
              <span className="svc-open__chip">
                <i className="svc-open__chip-dia" aria-hidden="true" />
                {plate.chip}
              </span>
              <div className="svc-open__face">
                <h3 className="svc-open__ftitle">{plate.title}</h3>
                <p className="svc-open__flede">
                  {plate.lede.map((seg, i) =>
                    typeof seg === "string" ? (
                      <Fragment key={i}>{seg}</Fragment>
                    ) : (
                      <em key={i}>{seg.em}</em>
                    )
                  )}
                </p>
              </div>
              <span className="svc-open__chit" aria-hidden="true">
                OPEN <i>→</i>
              </span>
            </div>

            {/* ── The DRAWER — spec content, UNCOVERED by the widening root
                   (clipped until the geometry reveals it; never faded). */}
            <div className="svc-open__drawer">
              <button
                ref={closeBtnRef}
                type="button"
                className="svc-open__close"
                onClick={handleClose}
                aria-label="Close details"
              >
                ✕
              </button>

              <div className="svc-open__block">
                <span className="svc-open__desig" aria-hidden="true">
                  01 / What
                </span>
                <ul className="svc-open__list">
                  {plate.breakdown.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

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

          <i className="svc-open__glint" aria-hidden="true" />
        </section>
      )}
    </div>
  );
}
