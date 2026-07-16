"use client";

/**
 * ServicesCartridgeDock — the bottom-right HUD console the four service
 * cards seat into across the runway's decommission beat (ADR-046).
 *
 * The WebGL ring cards (ServicesCardRing) miniaturize and FLY here in-world;
 * this component only (a) draws the fixture + sockets, (b) crossfades each
 * DOM cartridge in AT THE SEAT (the DOM never flies — ADR-031's rule stands
 * for DOM chrome), (c) publishes the bay rects the ring targets
 * (`dockSeatRectsRef`), and (d) makes each seated cartridge a real button
 * that glides the page back to that service's beat.
 *
 * Contracts:
 *   - Mounted at HUD level in LandingPage (never inside a station — station
 *     containment rebases fixed descendants, the ADR-030 pill lesson) with
 *     ZERO store subscriptions (LandingPage render-stability rule).
 *   - No new scroll writer: the controller is a rAF-throttled READER of
 *     `servicesRingProgressRef` (one clock, N consumers). CSS vars on the
 *     nav are the mirror, derived from the same pure functions the ring
 *     uses; seated state is a pure function of runway progress (which
 *     clamps at 1 below the runway), so there is no latch and no release
 *     guard — reverse scroll reconstructs by construction.
 *   - Labels are ARRAY-INDEX based from SERVICES (the slot-id remap trap:
 *     ids are spatial slots, not service names).
 *   - Gate parity: JS activates only on the ring's media gate (≥961px +
 *     no-preference) and never on the corridor's WebGL fallback; CSS
 *     belt-hides below the gate. On the capable path the nav is
 *     `visibility:hidden` (NOT display:none) while dormant so the seat
 *     rects stay measurable before the first flight frame.
 */

import { useCallback, useEffect, useRef } from "react";

import { SERVICES } from "./serviceData";
import { SERVICES_CARD_RING, SERVICES_CARTRIDGE_DOCK } from "../unifiedServicesInstrument";
import { servicesBeatScrollTarget } from "@/lib/services-ring/beatScrollTarget";
import { dockFixtureIn, dockTravelEnvelope } from "@/lib/services-ring/dockMath";
import {
  invalidateDockSeatRects,
  writeDockSeatRects,
  type DockSeatSlot,
} from "@/lib/services-ring/dockSeatRef";
import { exitProgressForRunway } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";
import { startRingScrollTween } from "@/lib/services-ring/ringScrollTween";

/** A bay reads as seated once its crossfade has essentially completed. */
const SEATED_AT = 0.999;

/** The dock leaves the inert/hidden dormant state as soon as the exit
 *  clock meaningfully starts (the fixture draw-on owns the visual ramp). */
const LIVE_AT = 0.0005;

export function ServicesCartridgeDock() {
  const navRef = useRef<HTMLElement>(null);
  const bayRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const cartRefs = useRef<Array<HTMLSpanElement | null>>([]);

  const onBayClick = useCallback((index: number) => {
    const targetY = servicesBeatScrollTarget(index);
    if (targetY === null) return;
    // Explicit rAF tween — never scrollTo({behavior:"smooth"}): the landing
    // page's `html { scroll-behavior: smooth }` turns per-frame writes to
    // mush and Chrome drops chained smooth scrolls (ADR-029 Update 5).
    startRingScrollTween(targetY);
  }, []);

  useEffect(() => {
    if (!SERVICES_CARTRIDGE_DOCK || !SERVICES_CARD_RING) return;
    const nav = navRef.current;
    if (!nav) return;

    // Gate parity with the ring mount (CorridorArmillary) — plus the
    // corridor fallback check: on `data-fallback="true"` stages the canvas
    // (and therefore the origin cards) never exists, so the dock must not
    // materialize either.
    const media = window.matchMedia(
      "(min-width: 961px) and (prefers-reduced-motion: no-preference)"
    );
    let stage: HTMLElement | null = null;
    const fallbackActive = () => {
      if (!stage || !stage.isConnected) {
        stage = document.querySelector<HTMLElement>(".home-v2-stage");
      }
      return !stage || stage.dataset.fallback === "true";
    };

    let frame = 0;
    let disposed = false;
    let ready = false;
    let live = false;
    let currentIn = -1;
    const currentSeat = [-1, -1, -1, -1];
    const seated = [false, false, false, false];

    const measure = () => {
      const slots: DockSeatSlot[] = [];
      for (let i = 0; i < SERVICES.length; i++) {
        const cart = cartRefs.current[i];
        if (!cart) return;
        const r = cart.getBoundingClientRect();
        slots.push({ cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height });
      }
      writeDockSeatRects(slots, performance.now());
    };

    const sync = (isTrailing = false) => {
      frame = 0;
      if (disposed) return;
      const active = media.matches && !fallbackActive();
      if (!active) {
        // Dormant: hidden, inert, rects invalidated (the ring falls back to
        // its NDC anchor rather than flying at stale pixels).
        if (live) {
          nav.removeAttribute("data-live");
          live = false;
        }
        nav.inert = true;
        invalidateDockSeatRects();
        return;
      }

      const exitP = exitProgressForRunway(servicesRingProgressRef.current.progress);
      const isLive = exitP > LIVE_AT;
      if (isLive !== live) {
        if (isLive) nav.setAttribute("data-live", "");
        else nav.removeAttribute("data-live");
        live = isLive;
      }
      // Inert is reconciled EVERY sync (the ArcCasesCue stale-inert lesson).
      nav.inert = !isLive;

      const fixtureIn = dockFixtureIn(exitP);
      if (Math.abs(fixtureIn - currentIn) >= 0.001) {
        nav.style.setProperty("--dock-in", fixtureIn.toFixed(4));
        currentIn = fixtureIn;
      }

      for (let i = 0; i < SERVICES.length; i++) {
        const bay = bayRefs.current[i];
        if (!bay) continue;
        const dom = dockTravelEnvelope(exitP, i).domOpacity;
        if (Math.abs(dom - currentSeat[i]) >= 0.001) {
          nav.style.setProperty(`--dock-seat-${i}`, dom.toFixed(4));
          currentSeat[i] = dom;
        }
        const isSeated = dom >= SEATED_AT;
        if (isSeated !== seated[i]) {
          bay.setAttribute("data-state", isSeated ? "seated" : "empty");
          bay.disabled = !isSeated;
          // The seat flash is a time-boxed CSS garnish on the state FLIP
          // (quantized-garnish canon, zero JS timers) — suppressed on the
          // first sync so a deep-link reload paints seated without a flash.
          if (isSeated && ready) bay.classList.add("is-flash");
          if (!isSeated) bay.classList.remove("is-flash");
          seated[i] = isSeated;
        }
      }

      if (!ready) {
        // Flush the initial paint before enabling transition-bearing state
        // (the RailManifest data-ready recipe).
        void nav.offsetWidth;
        nav.setAttribute("data-ready", "");
        ready = true;
      }

      // Trailing tick: rAF callbacks run in registration order, so on a
      // teleport-style jump (deep link, instant anchor scroll) this sync
      // can read `servicesRingProgressRef` BEFORE useServicesStageScroll's
      // rAF writes it in the same frame — and with no further scroll
      // events the stale read would strand the dock. One extra tick per
      // burst re-reads after every other writer has run.
      if (!isTrailing) {
        frame = window.requestAnimationFrame(() => sync(true));
      }
    };

    const requestSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => sync());
    };
    const onResize = () => {
      measure();
      requestSync();
    };

    // Seed every bay disabled BEFORE the first sync: the flip logic below
    // only writes on state changes, and the seeded state must match the
    // `seated[] = false` baseline (the JSX carries no `disabled` prop —
    // see the render comment).
    for (const bay of bayRefs.current) {
      if (bay) bay.disabled = true;
    }

    measure();
    requestSync();
    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("resize", onResize);
    media.addEventListener?.("change", onResize);
    // Settle passes: the services runway hook (a different React root) may
    // hydrate after this mount — its initial progress write must be picked
    // up without requiring a user scroll (deep-link reload at #contact).
    const t1 = window.setTimeout(onResize, 600);
    const t2 = window.setTimeout(onResize, 1800);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("scroll", requestSync);
      window.removeEventListener("resize", onResize);
      media.removeEventListener?.("change", onResize);
      invalidateDockSeatRects();
    };
  }, []);

  if (!SERVICES_CARTRIDGE_DOCK || !SERVICES_CARD_RING) return null;

  return (
    <nav ref={navRef} className="svc-dock" aria-label="Docked service cartridges">
      <span className="svc-dock__label" aria-hidden="true">
        SVC · 04
      </span>
      <ol className="svc-dock__bays">
        {SERVICES.map((service, i) => (
          <li key={service.id} className="svc-dock__slot">
            {/* `disabled` is deliberately NOT a React prop: React's synthetic
                event system reads props.disabled (not the live DOM property)
                and permanently drops clicks on a props-disabled button. The
                controller owns the DOM property (seeded disabled before the
                first sync, flipped with data-state). */}
            <button
              type="button"
              className="svc-dock__bay"
              data-state="empty"
              ref={(el) => {
                bayRefs.current[i] = el;
              }}
              onClick={() => onBayClick(i)}
              aria-label={`Return to ${service.name} — service ${service.index} of 04`}
            >
              <span
                className="svc-dock__cartridge"
                aria-hidden="true"
                ref={(el) => {
                  cartRefs.current[i] = el;
                }}
              >
                {service.index}
              </span>
              <span className="svc-dock__title" aria-hidden="true">
                {service.verb}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
