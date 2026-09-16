"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { SERVICE_PLATES } from "./servicePlateData";
import type { ServiceId } from "./serviceData";
import { RING_MOBILE_SHEET_ROOM } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

/**
 * ServicesSpecSheet — the PHONE's open state for a ring card (ADR-109).
 *
 * On desktop a tap on the front card slides out the in-canvas DRAWER (ADR-050):
 * a second baked slab of the same card. At phone size that pair cannot be
 * read — at any width where the open pair fits 390px its largest glyph is
 * under 8 css px and its close chit ~12px — so the phone answers the SAME
 * open state (`openServiceId`, the `openPlateRef` single writer) with the
 * phone's own idiom: a SHEET rising from the band's foot, carrying exactly
 * what the drawer carries (chip · title · `01 / WHAT` breakdown · `02 / HOW`
 * spec · the Book CTA) as real DOM type. The card above it stays exactly as
 * it is: the ring LIFTS clear of the sheet (`sheetTop`, below) and the side
 * cards recede, so the open card and its sheet read as one object.
 *
 * WHERE: absolute inside the sticky `.svc-ring-band`, never `position:
 * fixed` (`mobile-sections.md` §7 — a fixed sheet would need a kill edge of
 * its own; a band-seated one leaves with the band). It clears the HUD's
 * bottom chrome (law 1) by sitting `56px + 12px` off the band's foot.
 *
 * MOTION: pure motion, zero fades (ADR-097 U12's law) — `translateY` alone,
 * 420ms in / 320ms out on the house ease. Click-driven and bounded
 * (ADR-021). The rung this mounts on already requires `no-preference`.
 *
 * DISMISSAL is the stage's (`ServicesStage`): ✕, Escape, a tap on the scrim
 * above the sheet, and THE STEP — the sheet closes when the ring has turned
 * to another card, never on 35px of scroll (the desktop's drawer rule, wrong
 * for a thumb that scrolls in beats).
 *
 * The sheet stays MOUNTED and holds its LAST record while closing, so the
 * copy never blanks under a sheet still in flight; `inert` + `aria-hidden`
 * take it out of the tab order and the tree while shut.
 */
export function ServicesSpecSheet({
  openServiceId,
  onClose,
}: {
  openServiceId: ServiceId | null;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  /* The record shown — held across the close so the slide-out carries the
     same copy it slid in with (state adjusted during render, React's own
     "derive from a prop change" idiom, never a ref read in render). */
  const [shownId, setShownId] = useState<ServiceId | null>(openServiceId);
  if (openServiceId && openServiceId !== shownId) setShownId(openServiceId);
  const plate = shownId ? SERVICE_PLATES.find((p) => p.id === shownId) : undefined;
  const open = Boolean(openServiceId && plate);

  /* THE SHEET'S TOP EDGE, published for the ring (ADR-109). Read off the
     sheet's LAYOUT box (offset against the band, which is the viewport
     while pinned), never its transformed rect — the sheet is in flight when
     this runs. Set on open and on resize; cleared on close, so an absent
     value means "no sheet" to the ring exactly as an absent `seat` does. */
  useLayoutEffect(() => {
    if (!open) {
      servicesRingProgressRef.current.sheetTop = undefined;
      return;
    }
    const publish = () => {
      const el = sheetRef.current;
      const band = el?.offsetParent as HTMLElement | null;
      if (!el || !band) return;
      const bandRect = band.getBoundingClientRect();
      /* The sheet may rise no higher than `RING_MOBILE_SHEET_ROOM` of the
         seat above the seat's top (ringMath — the same law the ring fits
         the card to), so the open card is still a card. Bounded here as a
         max-height in px; the copy scrolls inside it. */
      const seat = servicesRingProgressRef.current.seat;
      if (seat) {
        const seatTop = seat.cy - seat.h / 2 - bandRect.top;
        const ceiling = seatTop + RING_MOBILE_SHEET_ROOM * seat.h;
        const foot = parseFloat(getComputedStyle(el).bottom) || 0;
        el.style.maxHeight = `${Math.max(160, Math.round(bandRect.height - foot - ceiling))}px`;
      }
      servicesRingProgressRef.current.sheetTop = bandRect.top + el.offsetTop;
    };
    publish();
    window.addEventListener("resize", publish);
    return () => {
      window.removeEventListener("resize", publish);
      servicesRingProgressRef.current.sheetTop = undefined;
    };
  }, [open]);

  /* Focus: to the close control on open; back to the front card's target
     on close, one frame late (the `MediaLightbox` lesson — a synchronous
     restore loses to React's commit and lands on `<body>`), and only if the
     focus was inside the sheet, so a scroll-dismissal never yanks it. */
  const hadFocusRef = useRef(false);
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
      return () => cancelAnimationFrame(id);
    }
    if (!hadFocusRef.current) return;
    hadFocusRef.current = false;
    const id = requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(".svc-ring-hits__hit--front")
        ?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <>
      {/* A tap on the band above the sheet closes it. Not a control of its
          own (the ✕ is the accessible dismissal); it only takes the pointer
          while the sheet is out, so the hit layer under it is untouched
          the rest of the time. */}
      <div
        className="svc-sheet-scrim"
        data-open={open ? "1" : undefined}
        aria-hidden="true"
        onClick={onClose}
      />
      <section
        ref={sheetRef}
        className="svc-sheet"
        data-open={open ? "1" : undefined}
        data-service={shownId ?? undefined}
        role="dialog"
        aria-labelledby="svc-sheet-title"
        aria-hidden={!open}
        inert={!open}
        onFocus={() => {
          hadFocusRef.current = true;
        }}
      >
        <div className="svc-sheet__head">
          <span className="svc-sheet__chip">{plate?.chip ?? ""}</span>
          <button
            ref={closeRef}
            type="button"
            className="svc-sheet__close"
            aria-label={plate ? `Close ${plate.chip} details` : "Close"}
            onClick={onClose}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div className="svc-sheet__body">
          <h3 className="svc-sheet__title" id="svc-sheet-title">
            {plate?.title ?? ""}
          </h3>
          <p className="svc-sheet__kicker">01 / What</p>
          <ul className="svc-sheet__list">
            {plate?.breakdown.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="svc-sheet__kicker svc-sheet__kicker--ruled">02 / How</p>
          {plate && (
            <dl className="svc-sheet__spec">
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
              <div className="svc-sheet__spec-wide">
                <dt>Leaves with</dt>
                <dd>{plate.spec.leavesWith}</dd>
              </div>
            </dl>
          )}
          {plate && (
            <a className="svc-sheet__cta" href={plate.ctaHref}>
              <span>{plate.ctaLabel}</span>
              <span aria-hidden="true">→</span>
            </a>
          )}
        </div>
      </section>
    </>
  );
}
