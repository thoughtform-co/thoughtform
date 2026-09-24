"use client";

import { useEffect, useRef, type CSSProperties } from "react";

import { useStackedCardsScroll } from "@/components/landing/v7/tools-cards/useStackedCardsScroll";
import { setPileHold } from "@/lib/home-v2/pileHoldRef";
import type { CaseTrack } from "@/lib/cases/types";

import { ProofCard } from "./ProofCard";
import type { ProofStackClient } from "./proofOrder";

/* ── THE FIRST CARD MATERIALISES (ADR-097 U11) ────────────────────────
   Owner, 2026-09-13: _"when you scroll into the proof section where you see
   the big cards, we have a cool glitch effect where the first card appears.
   The others can just scroll over it as it is now."_ So this is card 0 alone,
   and everything about the pile's mechanic is untouched.

   ⚠ **THE TRIGGER IS THE CHANNEL, NOT `data-pc-state`.** That attribute has
   no memory of direction: a covered card returns to `pinned` when the card
   above it scrolls back down, which would re-fire the burst on a card that
   never left. `--pc-enter` stays at 1 for the whole time slot 0 is covered, so
   a threshold on it fires exactly once per real arrival and re-arms only on a
   real departure.

   The pair is a HYSTERESIS and the gap is what stops a reader resting on the
   edge from strobing it. `--pc-enter` is already smoothstepped by the hook, so
   0.92 is raw ratio ~0.83 — roughly the last 120px (720h) to 200px (1247h) of
   the card's travel, by which point the plate, record and field windows have
   all saturated. The card is therefore fully composed before it is shown: the
   burst is the only thing moving. */
const ARRIVE_IN = 0.92;
const ARRIVE_OUT = 0.82;

/**
 * ProofStack — one casefile's projects as a scroll-stacked pile of cards
 * (ADR-094, promoted to the site's evidence beat by ADR-096).
 *
 * THE MECHANIC IS ADR-030's, REUSED; THE SKIN IS `proof-stack.css`. Each slot
 * is `position: sticky` at `top-base + i·peek`; the covering card is simply
 * the next sibling scrolling up — nothing is synthetic.
 * `useStackedCardsScroll` reads the slots' COMPUTED position and offsets (CSS
 * owns the geometry and the inert path) and writes `--pc-enter` /
 * `--pc-cover` / `data-pc-state` / `data-pc-current` on each slot and
 * `data-pc-active` on the runway. The console-plate skin that used to ride
 * this hook (`tools-cards.css`) is not imported.
 *
 * ⚠ `--i` MUST BE INLINE ON EVERY SLOT and every slot must resolve to
 * `sticky`, or the hook parks the whole stack (it reads `computed.top` as a
 * pixel length and falls to static mode if any slot is not sticky).
 *
 * ⚠ NO `data-m` ON ANYTHING RENDERED HERE. `useRevealMotion` collects its
 * targets once at LandingPage mount; a nested root's nodes are never
 * observed, so a `data-m` here would rest at opacity 0 forever. Entrance
 * rides `--pc-enter` instead, in CSS.
 *
 * ⚠ THE COMPONENT RENDERS ITS OWN `.pf-stack` WRAPPER, and the two hosts
 * seat that wrapper differently: `/` positions it ABSOLUTELY over the front
 * of the services runway (`services.css`), `/trinny-london` leaves it in
 * normal flow inside `#services`. Everything inside it is identical on both,
 * which is the point of the promotion — see `proof-stack.css`.
 *
 * `tracks` is a PROP because content is by reference and ORDER is by route
 * (`proofOrder.ts`): both surfaces show the same four Loop projects in the
 * record's own arc order today, and a second casefile would not have to.
 *
 * `arrival` is the homepage's OPT-IN to the first card's materialisation
 * (ADR-097 U11). Omitted — which is what `/trinny-london` passes — nothing is
 * observed, no attribute is written and the render is byte-identical.
 *
 * Default export as well as named, because `/trinny-london` mounts it
 * through `lazy()`.
 */
export function ProofStack({
  tracks,
  client,
  arrival,
  split = false,
}: {
  tracks: readonly CaseTrack[];
  client: ProofStackClient;
  arrival?: "glitch";
  /**
   * The PHONE's pile (ADR-107): every project as TWO sticky slots — its
   * record panel, then its field panel — instead of one card, so each fits
   * the viewport and the field slides up under the record's head band.
   *
   * ⚠ THE HOST DECIDES, AND REMOUNTS ON THE DECISION. `ServicesStage` reads
   * `PROOF_STACK_SPLIT_MEDIA` and passes this WITH a `key` on the element,
   * because `useStackedCardsScroll` collects its `[data-pc-slot]`s once at
   * mount — a pile that changed from four slots to eight under a live hook
   * would be driven on four. Omitted (the Trinny host, every desktop caller)
   * the render is byte-identical.
   */
  split?: boolean;
}) {
  const runwayRef = useRef<HTMLDivElement>(null);
  useStackedCardsScroll(runwayRef);

  /* ── The pile HOLD (ADR-123 commit B), split mode only ─────────────────
     While the runway spans from above the frame's top 8 % to below its
     bottom 92 %, the eight sticky sheets cover everything but the gutters —
     and the corridor scene under them was still redrawing every frame. Two
     observers, one flag: `hold` is TRUE only while both bands intersect the
     runway. Written to a three-free ref the corridor's `FrameInvalidator`
     reads (never a store field — `servicesAmbient` keeps its one writer) and
     mirrored on `<html>` as `data-pile-hold` for the diag and the smokes.
     ⚠ NOT a scroll listener: an observer fires on the compositor's own
     schedule and costs nothing at rest, which is the whole point. */
  useEffect(() => {
    if (!split) return;
    const runway = runwayRef.current;
    if (!runway || typeof IntersectionObserver === "undefined") return;
    let top = false;
    let bottom = false;
    const publish = () => setPileHold(top && bottom);
    const topBand = new IntersectionObserver(
      ([e]) => {
        top = !!e?.isIntersecting;
        publish();
      },
      { rootMargin: "0px 0px -92% 0px", threshold: 0 }
    );
    const bottomBand = new IntersectionObserver(
      ([e]) => {
        bottom = !!e?.isIntersecting;
        publish();
      },
      { rootMargin: "-92% 0px 0px 0px", threshold: 0 }
    );
    topBand.observe(runway);
    bottomBand.observe(runway);
    return () => {
      topBand.disconnect();
      bottomBand.disconnect();
      setPileHold(false);
    };
  }, [split]);

  /* ── The first card's materialisation (ADR-097 U11) ─────────────────
     Three states on the SLOT, beside the hook's own: `await` (risen, not yet
     shown), `in` (the burst), `out` (the reverse burst). CSS owns every
     pixel; this owns only which of the three is true.

     ⚠ **IT OBSERVES THE HOOK'S WRITES, IT DOES NOT ADD A SCROLL LISTENER.**
     The hook writes `--pc-enter` into the slot's inline style, delta-gated at
     1e-3 — so a `MutationObserver` on that one attribute is silent at rest,
     runs inside the hook's own rAF, and cannot become a second reader of the
     scroll position (which is the thing this surface has one of). */
  useEffect(() => {
    if (arrival !== "glitch") return;
    const runway = runwayRef.current;
    if (!runway) return;
    const slot = runway.querySelector<HTMLElement>("[data-pc-slot]");
    if (!slot) return;

    let shown = false;
    let armed = false;
    /* ⚠ THE INLINE VALUE, NOT THE COMPUTED ONE. `proof-stack.css` declares
       `--pc-enter: 1` on every slot as its SSR rest state, so a computed read
       at mount says 1 for a card that is three viewports below the fold — it
       would fire the burst where nobody is looking and never fire it again.
       The inline property is empty until the hook writes, which is also the
       event this observer is waiting for. (It is the cheaper read besides: no
       style resolution inside the hook's own frame.) */
    const enterOf = () => {
      const raw = slot.style.getPropertyValue("--pc-enter");
      return raw === "" ? Number.NaN : Number.parseFloat(raw);
    };

    const read = () => {
      const enter = enterOf();
      if (!Number.isFinite(enter)) return;
      if (!armed) {
        armed = true;
        /* ⚠ A CARD ALREADY COVERED MUST NOT GLITCH. On a reload deep in the
           pile slot 0 is `covered` with `--pc-enter` at 1: it is behind three
           other cards, so a burst there would fire on something nobody can
           see and then leave it lit under them. Seed it SHOWN, silently. */
        if (enter >= ARRIVE_IN) {
          shown = true;
          if (slot.getAttribute("data-pc-state") !== "covered") slot.dataset.pfArrive = "in";
          return;
        }
        slot.dataset.pfArrive = "await";
        return;
      }
      if (!shown && enter >= ARRIVE_IN) {
        shown = true;
        slot.dataset.pfArrive = "in";
      } else if (shown && enter <= ARRIVE_OUT) {
        shown = false;
        slot.dataset.pfArrive = "out";
      }
    };

    read();
    const observer = new MutationObserver(read);
    observer.observe(slot, { attributes: true, attributeFilter: ["style"] });
    return () => {
      observer.disconnect();
      delete slot.dataset.pfArrive;
    };
  }, [arrival]);

  return (
    /* The client's colour rides the STACK, not the card — one client per pile
       (ADR-097). Written inline only when the record carries one, so the
       sheet's fallback (house gold) is the resting state and not a second
       declaration of the same value. */
    <div
      className={split ? "pf-stack pf-stack--split" : "pf-stack"}
      style={
        client.accentRgb ? ({ "--pf-accent-rgb": client.accentRgb } as CSSProperties) : undefined
      }
    >
      {/* ⚠ `--pc-n` IS THE PEEK COUNT, NOT THE SLOT COUNT. The runway sizes
          every slot for the LAST one — `100svh − top-base − (n−1)·peek −
          bottom-safe` — and on the split pile the last slot (field 3) sits
          under four bands, not seven: a field seats one peek below its own
          record and the NEXT record seats on that same line. So n is
          `tracks + 1`, one band per project plus the field's own step. */}
      <div
        className="pf-stack__runway"
        ref={runwayRef}
        style={{ "--pc-n": split ? tracks.length + 1 : tracks.length } as CSSProperties}
      >
        {split
          ? tracks.flatMap((track, k) => [
              /* ── THE PAIR (ADR-107) ─────────────────────────────────
                 Record k pins at `top-base + k·peek`, exactly as a whole
                 card would. Field k takes `--i: k + 1`: the record's head
                 row IS `--pc-peek`, so `top-base + (k+1)·peek` is literally
                 "record k's top + its band" — the field seats UNDER the band
                 by construction, the ADR-104 `.pf-cardwire { inset:
                 var(--pc-peek) 0 0 0 }` idiom. It is also record k+1's pin
                 line, so the next project covers field k edge to edge and
                 the only thing left of pair k is its band — the tab that
                 says which folder is underneath. Indices stay positional
                 (`2k`, `2k+1`) so every measurement scoped to
                 `[data-pc-index]` still addresses one element. */
              <div
                key={`${track.id}:record`}
                className="pf-slot pf-slot--record"
                data-pc-slot=""
                data-pc-index={2 * k}
                data-pc-panel="record"
                style={{ "--i": k, zIndex: 2 * k + 1 } as CSSProperties}
              >
                <ProofCard track={track} client={client} panel="record" />
              </div>,
              <div
                key={`${track.id}:field`}
                className="pf-slot pf-slot--field"
                data-pc-slot=""
                data-pc-index={2 * k + 1}
                data-pc-panel="field"
                style={{ "--i": k + 1, zIndex: 2 * k + 2 } as CSSProperties}
              >
                <ProofCard track={track} client={client} panel="field" />
              </div>,
            ])
          : tracks.map((track, i) => (
              <div
                key={track.id}
                className="pf-slot"
                data-pc-slot=""
                data-pc-index={i}
                style={{ "--i": i, zIndex: i + 1 } as CSSProperties}
              >
                {/* ⚠ CARD 0 ALONE (ADR-104). The skeleton is what the aperture
                    reveals, and the aperture is card 0's alone — so the two
                    conditions are the same condition and are written as one. */}
                <ProofCard track={track} client={client} wire={i === 0 && arrival === "glitch"} />
              </div>
            ))}
        <div className="pf-stack__tail" aria-hidden="true" />
      </div>
    </div>
  );
}

export default ProofStack;
