import type { ClientPageDef } from "@/lib/arcs/clients";
import type { ArcDef } from "@/lib/arcs/types";

import { ArcCard, ArcClientPageCard } from "./ArcCard";

/**
 * The /arcs overview grid — centered auto-fit columns of card faces.
 * The reveal rides the GRID, not the cards: a card's rest state is its
 * own dimmed opacity (0.55), which a per-card `.arc-reveal` would
 * override at higher specificity.
 *
 * A client's non-arc `pages` (ADR-098 U2) lead the grid: they are the
 * client's own surfaces, and inside a band the order is newest first.
 */
export function ArcCardGrid({
  arcs,
  pages = [],
}: {
  arcs: readonly ArcDef[];
  pages?: readonly ClientPageDef[];
}) {
  return (
    <div className="arc-grid arc-reveal">
      {pages.map((page) => (
        <ArcClientPageCard key={page.href} page={page} />
      ))}
      {arcs.map((arc) => (
        <ArcCard key={arc.slug} arc={arc} />
      ))}
    </div>
  );
}
