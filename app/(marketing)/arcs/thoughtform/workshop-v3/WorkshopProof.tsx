"use client";

import { ProofStack } from "@/components/landing/home-v2/services/proof-stack/ProofStack";
import {
  proofStackClient,
  proofStackTracks,
} from "@/components/landing/home-v2/services/proof-stack/proofOrder";
import {
  WORKSHOP_INTRO,
  type WorkshopIntro,
  type WorkshopProofTrack,
} from "@/lib/arcs/content/shared/workshopIntro";
import type { CaseTrack } from "@/lib/cases/types";
import { PROOF_STACK_SPLIT_MEDIA } from "@/components/landing/home-v2/unifiedServicesInstrument";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

/**
 * The third cut's proof (ADR-143 U3, U6): v1's pile, the same four Loop
 * projects in the cut's own order (the studio after the films, ADR-147 U1), with each card's lede said in one line for
 * the room and the head lettering the client alone.
 *
 * ⚠ A COPY OF THE RECORD WITH TWO FIELDS REPLACED, never a prop on
 * `ProofCard` (whose markup the homepage, Trinny and Pandora share):
 * `ArcProofCard`'s precedent. The lede, and the stamp's phase emptied, which
 * `ProofCard` reads as "no phase" (owner, 2026-10-04: the proof is how the
 * Arc was applied, not one phase of it). Titles and claims stay the
 * record's; the route sheet shows the claims' titles only and lights the
 * last card.
 *
 * `ledes` is a cut's own lines in place of the record's (ADR-156: the UX
 * meetup talk drops the clause that promises a workshop). Not passed, the
 * record's, so v3 and Suri's cut render as before.
 */
type ProofLedes = WorkshopIntro["proof"]["ledes"];

export function workshopV3Tracks(
  ledes: ProofLedes = WORKSHOP_INTRO.proof.ledes
): readonly CaseTrack[] {
  const byId = new Map(proofStackTracks().map((t) => [t.id, t]));
  /* The cut's own order (ADR-147 U1): the studio follows the films. */
  return WORKSHOP_INTRO.proof.order.map((id) => {
    const track = byId.get(id);
    if (!track) throw new Error(`[workshop-v3 proof] "${id}" is not on the pile`);
    const lede = ledes[track.id as WorkshopProofTrack];
    if (lede === undefined) {
      throw new Error(`[workshop-v3 proof] no lede for track "${track.id}"`);
    }
    if (!track.card || !track.stamp) {
      throw new Error(`[workshop-v3 proof] track "${track.id}" has no card or stamp`);
    }
    const claims = WORKSHOP_INTRO.proof.claims?.[id];
    const title = WORKSHOP_INTRO.proof.titles?.[id];
    return {
      ...track,
      ...(claims ? { blocks: claims } : {}),
      ...(title && track.arc ? { arc: { ...track.arc, title } } : {}),
      card: { ...track.card, lede },
      stamp: { ...track.stamp, phase: "" },
    };
  });
}

/**
 * `split` (ADR-160): on the phone rung each project is two sticky panels, as
 * the homepage's pile reads there (ADR-107), and the pile remounts when the
 * query flips, because the stack hook collects its slots once. Opt-in, so v3,
 * Suri's cut and the keynote template render as before; the server snapshot
 * is `false`, so SSR is the whole-card tree everywhere.
 */
export default function WorkshopV3Proof({
  ledes,
  split = false,
}: {
  ledes?: ProofLedes;
  split?: boolean;
}) {
  const phoneSplit = useMediaQuery(PROOF_STACK_SPLIT_MEDIA);
  const on = split && phoneSplit;
  return (
    <ProofStack
      key={on ? "split" : "whole"}
      tracks={workshopV3Tracks(ledes)}
      client={proofStackClient()}
      arrival="glitch"
      split={on}
    />
  );
}
