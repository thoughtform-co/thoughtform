import type { ArcSectionOf } from "@/lib/arcs/types";

import { equilibriumStationHtml } from "@/app/(marketing)/arcs/thoughtform/workshop-v3/equilibrium";

import { ArcBeat } from "./ArcBeat";
import { ArcEquilibriumIsland } from "./ArcEquilibriumIsland";

/**
 * ArcEquilibrium — the Thoughtform equilibrium as a proposal beat (owner,
 * 2026-10-11: "the second section … should actually be like that
 * Holo-inspired thing, but updated … less bloom … super slick").
 *
 * The workshop opener's own station (`equilibriumStationHtml`: the static
 * drawing, the three tracker words, the slot), inside the `.tw-root` scope
 * its sheet keys on, and its own live hologram (`EquilibriumMount`) with the
 * bloom off. The island also carries the hand-off: on the way down the gold
 * mark lifts out of the gate and plugs into the next section's stack.
 */
export function ArcEquilibrium({ section }: { section: ArcSectionOf<"equilibrium"> }) {
  const html = equilibriumStationHtml(
    { title: section.title, labels: section.labels },
    "instrument"
  );
  return (
    <ArcBeat
      id={section.id}
      kind="equilibrium"
      className="arc-section arc-sec-eq"
      ariaLabel={section.ariaLabel ?? section.title}
      motion="reveal"
    >
      <div className="tw-root" data-tw-cut="v3" dangerouslySetInnerHTML={{ __html: html }} />
      <ArcEquilibriumIsland plugInto={section.plugInto} />
    </ArcBeat>
  );
}
