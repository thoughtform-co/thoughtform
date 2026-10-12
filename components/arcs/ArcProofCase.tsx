"use client";

import type { CSSProperties } from "react";

import { ProofGlyph } from "@/components/landing/home-v2/services/casefile/ProofGlyph";
import { ProofCard } from "@/components/landing/home-v2/services/proof-stack/ProofCard";
import {
  PROOF_STACK_CASE,
  proofStackClient,
} from "@/components/landing/home-v2/services/proof-stack/proofOrder";
import type { ArcMotion, ArcSectionOf } from "@/lib/arcs/types";
import { getCase } from "@/lib/cases/registry";

import { ArcBeat } from "./ArcBeat";
import { rung } from "./arcMotion";

/**
 * ArcProofCase — one Loop project in the job cards' stack housing (owner,
 * 2026-10-12: "with our new redesigned cards for the proof section, they
 * don't have to be exactly the same, because here we build up the
 * narrative"; /test/loop-proof-lab B55).
 *
 *   top    the stack card's: the client framed, and on the right the four
 *          workstreams with this card's lit — the narrative the job cards do
 *          not need, since each of them stands alone
 *   left   the card's title, as the homepage's proof card sets it (owner,
 *          2026-10-12: "not in the top bar but in the left panel"), the
 *          project in one gold-edged box (its lede), then its four claims as
 *          steps on the stack card's one gold rail
 *   right  ONE visual, Loop's own: the proof card's field, whole
 *
 * ⚠ THE HOUSING IS THE JOB CARD'S (`.arc-jstack*`, job-stack.css); only the
 * claims, the arc and the field's seat are this card's (`proof-case.css`).
 * The field is `ProofCard panel="field"` inside the pile's `.pf-stack >
 * .pf-slot` pair, because every selector in proof-stack.css is scoped to it.
 *
 * ⚠ SET BY `layout: "case"` ON THE PAGE, NEVER ON THE RECORD: Pandora's
 * proposal reads the same `LOOP_PROOF_CARDS` and keeps the folder card.
 */
export function ArcProofCase({
  section,
  motion = "reveal",
}: {
  section: ArcSectionOf<"proof-card">;
  motion?: ArcMotion;
}) {
  const def = getCase(PROOF_STACK_CASE);
  if (!def) throw new Error(`[arc proof-case] case "${PROOF_STACK_CASE}" is not in CASES`);
  const record = def.casefile.tracks.find((t) => t.id === section.track);
  if (!record) {
    throw new Error(
      `[arc proof-case] track "${section.track}" is not on the ${PROOF_STACK_CASE} casefile`
    );
  }
  const title = section.title ?? record.arc?.title ?? record.project;
  const lede = section.lede ?? record.card?.lede;
  const claims = section.claims ?? record.blocks ?? [];
  const client = proofStackClient();
  const accent = client.accentRgb
    ? ({ "--pf-accent-rgb": client.accentRgb } as CSSProperties)
    : undefined;
  const beats = section.arcBeats ?? [];
  const at = beats.findIndex((b) => b.id === section.id);
  const titleId = `${section.id}-title`;

  return (
    <ArcBeat
      id={section.id}
      kind="proof-card"
      className="arc-section arc-sec arc-sec--job arc-sec--proof-case"
      ariaLabel={section.ariaLabel ?? title}
      motion={motion}
    >
      <div className="arc-band">
        {/* ⚠ NO TRAVEL (`rung(motion, 0.1, 0)`), ArcProofCard's own rule: a
            translating ancestor becomes the containing block the films'
            lightbox portal exists to escape. */}
        <article
          className="arc-lev arc-case arc-plate arc-reveal arc-jstack arc-lpc"
          aria-labelledby={titleId}
          {...rung(motion, 0.1, 0)}
        >
          <header className="arc-jstack__top">
            <span className="arc-jstack__client">{client.name}</span>
            {beats.length ? (
              <ol className="arc-lpc__arc" aria-label="Loop, in four workstreams">
                {beats.map((b, k) => (
                  <li
                    key={b.id}
                    data-state={k < at ? "past" : k === at ? "now" : "next"}
                    {...(k === at ? { "aria-current": "step" as const } : null)}
                  >
                    {b.word}
                  </li>
                ))}
              </ol>
            ) : null}
          </header>
          <div className="arc-jstack__body arc-lpc__body">
            <div className="arc-jstack__words">
              {/* the title heads the left panel, as the homepage's proof card
                  sets it (owner, 2026-10-12), not on the top bar */}
              <h2 className="arc-lpc__title" id={titleId}>
                {title}
              </h2>
              <div className="arc-jstack__box arc-jstack__box--gold">
                <p className="arc-jstack__tab">{record.project}</p>
                {lede ? <p className="arc-jstack__para">{lede}</p> : null}
              </div>
              <ol className="arc-jstack__flow" aria-label="What it showed">
                {claims.map((c) => (
                  <li key={c.title} className="arc-lpc__claim">
                    <span className="arc-lpc__mark" aria-hidden="true">
                      {c.glyph ? <ProofGlyph name={c.glyph} /> : null}
                    </span>
                    <span className="arc-lpc__text">
                      <span className="arc-lpc__claim-t">{c.title}</span>
                      <span className="arc-lpc__claim-d">{c.desc}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="arc-lpc__fig">
              <div className="pf-stack" style={accent}>
                <div className="pf-slot">
                  <ProofCard track={record} client={client} panel="field" />
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </ArcBeat>
  );
}
