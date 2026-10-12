"use client";

import type React from "react";
import { useState } from "react";

import { Glyph } from "@/components/arcs/ArcLeverage";
import { ProofGlyph } from "@/components/landing/home-v2/services/casefile/ProofGlyph";
import { ProofCard } from "@/components/landing/home-v2/services/proof-stack/ProofCard";
import { proofStackClient } from "@/components/landing/home-v2/services/proof-stack/proofOrder";
import { disciplineOf } from "@/lib/arcs/content/shared/disciplines";
import { LOOP_PROOF_CARDS } from "@/lib/arcs/content/shared/loopProof";
import type { ArcJobBucket } from "@/lib/arcs/types";
import { getCase } from "@/lib/cases/registry";
import type { CaseTrack } from "@/lib/cases/types";

/**
 * /test/loop-proof-lab: the four Loop proof cards on the X-Bionic proposal,
 * in the job cards' language (block 14 on /test/proof-cards and its one-visual
 * splits), not a copy of them.
 *
 *   the top bar   caps, one face: the client framed, the card's line, and on
 *                 the right either the beat's word or the whole arc of four
 *   the left      the project in one gold-edged box, then its four claims on
 *                 one unbroken gold rail welded to that box's bottom edge
 *   the right     ONE visual: Loop's own plate, the proof card's field, whole
 *
 * Every word is the record's (`CASES`' Loop casefile and the proposal's own
 * titles); nothing is new. The proposal's Pandora reader is not touched.
 */

type Variant = {
  id: string;
  n: string;
  label: string;
  left: string;
  ws: "one" | "spans";
  /** The claims' sentences; off, each claim is its title alone (the live
   *  card's own laptop form), which buys the air back by cutting words. */
  desc?: boolean;
};

/* Round two (owner, 2026-10-12): more air on the left, the left panel
   narrower so the visual carries more of the card, and the workstreams in
   the top-right corner as the job cards have them. Round one (A, B55–B65,
   the arc of four in the corner) is in docs/design/loop-proof-lab/stills. */
const VARIANTS: readonly Variant[] = [
  { id: "c50", n: "C50", label: "One workstream · left 50%", left: "50%", ws: "one" },
  { id: "c45", n: "C45", label: "One workstream · left 45%", left: "45%", ws: "one" },
  { id: "d50", n: "D50", label: "The workstreams it spans · left 50%", left: "50%", ws: "spans" },
  { id: "e50", n: "E50", label: "Claims as titles · left 50%", left: "50%", ws: "one", desc: false },
];

/* ⚠ LAB MAPPING, FOR THE OWNER TO CHECK: the vision's four workstreams onto
   Loop's four cards. `one` is the card's main workstream; `spans` is every
   workstream its own lede names (Tools: "production, operations and the
   review between them"; Studio: "briefing, generating, judging"; the layer
   is "across Loop"). */
const WORKSTREAMS: Record<string, { one: ArcJobBucket; spans: ArcJobBucket[] }> = {
  "practice-frontier": { one: "production", spans: ["production"] },
  "practice-tools": { one: "ops", spans: ["production", "ops", "review"] },
  "practice-studio": { one: "production", spans: ["strategy", "production", "review"] },
  "practice-layer": { one: "strategy", spans: ["production", "ops", "review", "strategy"] },
};

interface Beat {
  id: string;
  word: string;
  title: string;
  track: CaseTrack;
}

function beats(): Beat[] {
  const def = getCase("loop-earplugs");
  if (!def) throw new Error("[loop-proof-lab] the Loop case is missing");
  return LOOP_PROOF_CARDS.map((s) => {
    const track = def.casefile.tracks.find((t) => t.id === s.track);
    if (!track) throw new Error(`[loop-proof-lab] track ${s.track} is missing`);
    return {
      id: s.id,
      word: s.menuLabel ?? track.project,
      title: s.title ?? track.arc?.title ?? track.project,
      track,
    };
  });
}

function startIndex(card?: string) {
  const n = Number(card);
  return Number.isInteger(n) && n >= 1 && n <= 4 ? n - 1 : 2;
}

export function LoopProofLab({ initialCard }: { initialCard?: string }) {
  const all = beats();
  const start = startIndex(initialCard);
  return (
    <div className="lp-root">
      {VARIANTS.map((v) => (
        <Block key={v.id} v={v} all={all} start={start} />
      ))}
      <nav className="lp-index" aria-label="Blocks on this page">
        {VARIANTS.map((v) => (
          <a key={v.id} href={`#lp-${v.id}`} title={v.label}>
            <span>{v.n}</span>
            {v.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

function Block({ v, all, start }: { v: Variant; all: Beat[]; start: number }) {
  const [i, setI] = useState(start);
  return (
    <section className="lp-stage" id={`lp-${v.id}`}>
      <p className="lp-tag">
        {v.n} · {v.label}
      </p>
      <div className="lp-pick" role="tablist" aria-label="Card">
        {all.map((b, k) => (
          <button
            key={b.id}
            type="button"
            role="tab"
            aria-selected={k === i}
            onClick={() => setI(k)}
          >
            {b.word}
          </button>
        ))}
      </div>
      <LoopCard key={all[i].id} beat={all[i]} all={all} index={i} v={v} />
    </section>
  );
}

function Workstreams({ id, mode }: { id: string; mode: Variant["ws"] }) {
  const w = WORKSTREAMS[id];
  if (!w) return null;
  if (mode === "one") {
    const d = disciplineOf(w.one);
    return (
      <span className="lp-ws">
        <Glyph kind={d.glyph} />
        {d.long}
      </span>
    );
  }
  return (
    <span className="lp-ws lp-ws--spans">
      {w.spans.map((b) => {
        const d = disciplineOf(b);
        return (
          <span key={b} className="lp-ws__one" title={d.long}>
            <Glyph kind={d.glyph} />
            {w.spans.length > 2 ? d.word : d.long}
          </span>
        );
      })}
    </span>
  );
}

function LoopCard({ beat, v }: { beat: Beat; all: Beat[]; index: number; v: Variant }) {
  const client = proofStackClient();
  const { track } = beat;
  const claims = track.blocks ?? [];
  return (
    <article
      className="lp-card"
      aria-label={beat.title}
      style={{ "--lp-left": v.left } as React.CSSProperties}
    >
      <header className="lp-head">
        <span className="lp-head__client">{client.name}</span>
        <span className="lp-head__name">{beat.title}</span>
        <Workstreams id={beat.id} mode={v.ws} />
      </header>
      <div className="lp-body">
        <div className="lp-words">
          <div className="lp-box lp-box--lit">
            <p className="lp-tab">{track.project}</p>
            <p className="lp-lede">{track.card?.lede}</p>
          </div>
          <ol className="lp-flow" aria-label="What it showed">
            {claims.map((c) => (
              <li key={c.title} className="lp-step">
                <span className="lp-step__mark" aria-hidden="true">
                  {c.glyph ? <ProofGlyph name={c.glyph} /> : null}
                </span>
                <span className="lp-step__text">
                  <span className="lp-step__title">{c.title}</span>
                  {v.desc === false ? null : <span className="lp-step__desc">{c.desc}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="lp-fig">
          <div className="pf-stack">
            <div className="pf-slot">
              <ProofCard track={track} client={client} panel="field" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
