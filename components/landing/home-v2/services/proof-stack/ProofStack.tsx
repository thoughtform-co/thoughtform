"use client";

import { useRef, type CSSProperties } from "react";

import { useStackedCardsScroll } from "@/components/landing/v7/tools-cards/useStackedCardsScroll";
import type { CaseTrack } from "@/lib/cases/types";

import { ProofCard } from "./ProofCard";
import type { ProofStackClient } from "./proofOrder";

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
 * Default export as well as named, because `/trinny-london` mounts it
 * through `lazy()`.
 */
export function ProofStack({
  tracks,
  client,
}: {
  tracks: readonly CaseTrack[];
  client: ProofStackClient;
}) {
  const runwayRef = useRef<HTMLDivElement>(null);
  useStackedCardsScroll(runwayRef);

  return (
    /* The client's colour rides the STACK, not the card — one client per pile
       (ADR-097). Written inline only when the record carries one, so the
       sheet's fallback (house gold) is the resting state and not a second
       declaration of the same value. */
    <div
      className="pf-stack"
      style={
        client.accentRgb ? ({ "--pf-accent-rgb": client.accentRgb } as CSSProperties) : undefined
      }
    >
      <div
        className="pf-stack__runway"
        ref={runwayRef}
        style={{ "--pc-n": tracks.length } as CSSProperties}
      >
        {tracks.map((track, i) => (
          <div
            key={track.id}
            className="pf-slot"
            data-pc-slot=""
            data-pc-index={i}
            style={{ "--i": i, zIndex: i + 1 } as CSSProperties}
          >
            <ProofCard track={track} client={client} />
          </div>
        ))}
        <div className="pf-stack__tail" aria-hidden="true" />
      </div>
    </div>
  );
}

export default ProofStack;
