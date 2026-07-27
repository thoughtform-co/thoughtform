import type { ArcDef } from "@/lib/arcs/types";

import { ArcCard } from "./ArcCard";

/**
 * The /arcs overview grid — centered auto-fit columns of card faces.
 * The reveal rides the GRID, not the cards: a card's rest state is its
 * own dimmed opacity (0.55), which a per-card `.arc-reveal` would
 * override at higher specificity.
 */
export function ArcCardGrid({ arcs }: { arcs: readonly ArcDef[] }) {
  return (
    <div className="arc-grid arc-reveal">
      {arcs.map((arc) => (
        <ArcCard key={arc.slug} arc={arc} />
      ))}
    </div>
  );
}
