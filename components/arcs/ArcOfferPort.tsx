import type { ArcMotion } from "@/lib/arcs/types";

import { OfferPinned } from "@/components/xb-proposal/offer/OfferPinned";

import { ArcBeat } from "./ArcBeat";

/**
 * ArcOfferPort — S1 · A, the pinned build, ported verbatim from
 * /test/proposition-artifact into a proposal section (owner, 2026-10-11:
 * "port that S1A pin build verbatim into the X Bionic proposal page").
 *
 * The block is mounted exactly as the artifact page mounts it: the kit's
 * own `OfferPinned` (its text column, its drawing, its 320svh runway and
 * sticky pin) inside `.xb`, framed by `xb-in-frame.css` the way
 * `proposition.css` frames it there (the kit's stand-in rails off, the
 * stage's ground clear, the column in the band between the HUD's rails).
 * The only thing left behind is the lab's "1 · S1 · A" reference tag.
 */
export function ArcOfferPort({ id, motion = "reveal" }: { id: string; motion?: ArcMotion }) {
  return (
    <ArcBeat
      id={id}
      kind="leverage"
      className="arc-section arc-sec-port"
      ariaLabel="Where Thoughtform plugs in"
      motion={motion}
    >
      <div className="xb xb-in-frame">
        <OfferPinned />
      </div>
    </ArcBeat>
  );
}
