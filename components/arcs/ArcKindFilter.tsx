"use client";

import { useEffect, useRef, useState } from "react";

import { KIND_LABEL } from "@/lib/arcs/clients";
import type { ArcKind } from "@/lib/arcs/types";

const KINDS: readonly ArcKind[] = ["keynote", "workshop", "production"];

/**
 * ArcKindFilter — the overview's one control (ADR-098).
 *
 * Four stations: everything, then the three kinds. Picking one writes a
 * single attribute, `data-arc-kind`, on the arc root; `arcs.css` hides the
 * cards that do not match and the client groups left with nothing in them.
 *
 * ⚠ THE FILTERING IS CSS, AND THE DATA IS SERVER-RENDERED. Every card
 * carries its own `data-kind` and every group the set it holds, so the
 * browser is told what matches rather than asked to work it out — no
 * `:has()`, no client-side list, and the markup a crawler or a reader
 * without JS receives is the whole grid.
 *
 * ⚠ NO ATTRIBUTE MEANS EVERYTHING IS SHOWN. That is the no-JS contract:
 * the page is complete before this mounts, and the control opts INTO a
 * narrowed view — the arcs' own reveal pattern, one surface over.
 *
 * ⚠ IT IS SITE CHROME, NOT A PORTED DECK CONTROL. ADR-052's flattening
 * doctrine freezes an interactive control that came off a slide to its
 * default; the overview is not a deck, and this is the grid's own
 * affordance.
 *
 * The stations are ADR-089 U3/U4: outlined boxes with a MARGIN between
 * them (a gap makes each station `(100% − (n−1)g)/n` and any marker drifts
 * a gap per station), and the picked one FILLED in inverse video — the
 * variable in a set of bounded boxes is fill among outlines.
 */
export function ArcKindFilter() {
  const [picked, setPicked] = useState<ArcKind | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  /* ⚠ THE ROOT IS FOUND FROM THIS ELEMENT UP, never by a document query.
     The overview is a server component, so a ref cannot be threaded in;
     `closest` is the honest alternative and it cannot reach another page's
     root during a client-side entry, which a `document.querySelector` for
     `.arc-root` could. */
  useEffect(() => {
    const root = hostRef.current?.closest<HTMLElement>(".arc-root");
    if (!root) return;
    if (picked) root.setAttribute("data-arc-kind", picked);
    else root.removeAttribute("data-arc-kind");
    return () => {
      // Leaving with a filter on would hand the next render a narrowed
      // grid it never asked for.
      root.removeAttribute("data-arc-kind");
    };
  }, [picked]);

  return (
    <div ref={hostRef} className="arc-filter" role="group" aria-label="Filter the arcs by kind">
      <button
        type="button"
        className={`arc-filter__stn${picked === null ? " is-on" : ""}`}
        aria-pressed={picked === null}
        onClick={() => setPicked(null)}
      >
        All
      </button>
      {KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          className={`arc-filter__stn${picked === kind ? " is-on" : ""}`}
          aria-pressed={picked === kind}
          onClick={() => setPicked(picked === kind ? null : kind)}
        >
          {KIND_LABEL[kind]}
        </button>
      ))}
    </div>
  );
}
