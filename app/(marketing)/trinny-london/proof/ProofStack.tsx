"use client";

import { useRef, type CSSProperties } from "react";

import { useStackedCardsScroll } from "@/components/landing/v7/tools-cards/useStackedCardsScroll";

import { ProofCard } from "./ProofCard";
import { trinnyProofTracks } from "./proofOrder";

/**
 * ProofStack — the four Loop projects as a scroll-stacked pile of cards
 * (ADR-094), mounted into `#services` on the Trinny London page in place of
 * the casefile.
 *
 * THE MECHANIC IS ADR-030's, REUSED, THE SKIN IS THIS ROUTE'S. Each slot is
 * `position: sticky` at `top-base + i·peek`; the covering card is simply the
 * next sibling scrolling up — nothing is synthetic. `useStackedCardsScroll`
 * reads the slots' COMPUTED position and offsets (CSS owns the geometry and
 * the inert path), and writes `--pc-enter` / `--pc-cover` / `data-pc-state`
 * / `data-pc-current` on each slot and `data-pc-active` on the runway. The
 * console-plate skin that used to ride this hook (`tools-cards.css`) is not
 * imported: `trinny-london.css` re-authors the geometry under `.tl-*`.
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
 * Default export, because `TrinnyPortals` mounts it through `lazy()`.
 */
export default function ProofStack() {
  const runwayRef = useRef<HTMLDivElement>(null);
  useStackedCardsScroll(runwayRef);
  const tracks = trinnyProofTracks();

  return (
    <div
      className="tl-stack__runway"
      ref={runwayRef}
      style={{ "--pc-n": tracks.length } as CSSProperties}
    >
      {tracks.map((track, i) => (
        <div
          key={track.id}
          className="tl-slot"
          data-pc-slot=""
          data-pc-index={i}
          style={{ "--i": i, zIndex: i + 1 } as CSSProperties}
        >
          <ProofCard track={track} />
        </div>
      ))}
      <div className="tl-stack__tail" aria-hidden="true" />
    </div>
  );
}
