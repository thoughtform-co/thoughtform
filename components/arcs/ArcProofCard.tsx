"use client";

import type { CSSProperties } from "react";

import { ProofCard } from "@/components/landing/home-v2/services/proof-stack/ProofCard";
import {
  PROOF_STACK_CASE,
  proofStackClient,
} from "@/components/landing/home-v2/services/proof-stack/proofOrder";
import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";
import { getCase } from "@/lib/cases/registry";

import { ArcBeat } from "./ArcBeat";
import { ArcSectionHead } from "./ArcSectionHead";
import { rung } from "./arcMotion";

interface ArcProofCardProps {
  section: ArcSectionOf<"proof-card">;
  index: number;
  motion?: ArcMotion;
}

/**
 * ArcProofCard — one Loop project as the homepage's folder card, at rest, at
 * page width (ADR-128).
 *
 * The pile (ADR-096) and the Trinny pitch (ADR-094) say the practice in this
 * one housing: the client's band, the arc line as the title, the four claims
 * with their sentences, and the closed evidence frame with the record's own
 * plate in it. A flowing proposal reads the same four cards one beat each, in
 * `PROOF_STACK_ORDER`, as what we DO with Loop as the illustration — which is
 * the register the owner asked the proof to keep (ADR-126) and the flat kinds
 * could only approximate with a head over a bare console.
 *
 * ⚠ NOTHING IN THE MODULE CHANGES. `ProofCard` is mounted whole with the
 * pile's own client record; the wrapper is `.pf-stack > .pf-slot`, because
 * every selector in `proof-stack.css` is scoped to that pair and the slot's
 * DECLARED rest state (`--pc-enter: 1; --pc-cover: 0; --pc-depth: 0`) is what
 * seats every arrival channel with no hook. The only thing this host adds is
 * the box (`arcs.css`, `.arc-proof`): the slot is static and takes the films
 * console's height law.
 *
 * ⚠ THE RECORD IS RESOLVED THE PILE'S WAY AND THROWS ON A MISS. A card that
 * silently fell out of a page is the defect every guard stays green on
 * (`proofOrder.ts`'s own reason).
 *
 * ⚠ NO TRAVEL ON THE WRAPPER (`rung(motion, 0.12, 0)`), the films beat's own
 * rule: a translating ancestor becomes the containing block the lightbox
 * portal exists to escape.
 */
export function ArcProofCard({ section, index, motion = "reveal" }: ArcProofCardProps) {
  const def = getCase(PROOF_STACK_CASE);
  if (!def) throw new Error(`[arc proof-card] case "${PROOF_STACK_CASE}" is not in CASES`);
  const record = def.casefile.tracks.find((t) => t.id === section.track);
  if (!record) {
    throw new Error(
      `[arc proof-card] track "${section.track}" is not on the ${PROOF_STACK_CASE} casefile`
    );
  }
  /* A page may say the card's line in its own tense (`section.title`, owner
     2026-09-28): the card reads `arc.title`, so the override is a copy of
     the record with that one field replaced, never a prop on `ProofCard`
     (whose markup the pile and the Trinny pitch share). */
  const track = {
    ...record,
    ...(section.title && record.arc ? { arc: { ...record.arc, title: section.title } } : {}),
    // ADR-147 U4: the lede, the claims and the band's phase, each a copy of
    // the record with one field replaced, the title's own law.
    ...(section.lede && record.card ? { card: { ...record.card, lede: section.lede } } : {}),
    ...(section.claims ? { blocks: section.claims } : {}),
    ...(section.phase !== undefined && record.stamp
      ? { stamp: { ...record.stamp, phase: section.phase } }
      : {}),
  };
  const client = proofStackClient();
  const accent = client.accentRgb
    ? ({ "--pf-accent-rgb": client.accentRgb } as CSSProperties)
    : undefined;

  return (
    <ArcBeat
      id={section.id}
      kind="proof-card"
      className="arc-section arc-sec arc-sec--proof"
      ariaLabel={section.ariaLabel ?? track.arc?.title ?? track.project}
      motion={motion}
    >
      <div className="arc-band arc-band--instrument">
        {section.head ? (
          <ArcSectionHead
            head={section.head}
            kind="proof-card"
            index={index}
            sectionId={section.id}
            motion={motion}
          />
        ) : null}
        <div className="arc-proof arc-reveal" {...rung(motion, 0.12, 0)}>
          <div className="pf-stack" style={accent}>
            <div className="pf-slot">
              <ProofCard track={track} client={client} />
            </div>
          </div>
        </div>
      </div>
    </ArcBeat>
  );
}
