"use client";

import { useState } from "react";

import { ConsoleRail } from "@/components/landing/home-v2/services/casefile/console/ConsoleRail";
import { ProofGlyph } from "@/components/landing/home-v2/services/casefile/ProofGlyph";
import type { CaseTrack } from "@/lib/cases/types";

import { ProofField } from "./ProofField";
import type { ProofStackClient } from "./proofOrder";
import { proofTabLabel, proofTabs } from "./proofTabs";

/**
 * ProofCard — one Loop project, at a glance (ADR-094, recomposed in U1 and
 * again in U2).
 *
 * THREE REGISTERS AND NO FOURTH (the Brand Codex card set, distilled in
 * `docs/design/card-reference-analysis.md`):
 *   CLAIM   the project's name, in the display face — `track.project`
 *   FIELD   the record's own visual, bleeding to the card's right and
 *           bottom edges — `ProofField` on `track.visual`
 *   CHROME  the head strip: the client, and this project's beat of the arc
 *
 * ⚠ THE ARC IS THE TITLE (U3, owner 2026-09-10: _"the lines that I said, 'We
 * push the frontiers of AI creative,' should replace the title 'AI
 * Above-the-Line'"_). U2 put the beat in the head beside the name and kept
 * the name as the display heading; the owner's correction is that the CLAIM
 * is what the card is called. So `.pf-card__title` letters `arc.title` and
 * the project's own name goes up into the head as chrome, where it is the
 * FILE this card is of — `01 · AI ABOVE-THE-LINE` beside the client.
 *
 * ⚠ THAT KEEPS THE PEEK BAND WORKING, which is why the name goes to the head
 * rather than away. U1 recorded the cost of emptying this strip: it is THE
 * PEEK BAND — the sliver that stays visible when a later card covers this
 * one — and with only `LOOP EARPLUGS · {phase}` on it, all four would read
 * the same. Chrome names the file, the display makes the claim; nothing is
 * said twice and the pile still indexes itself.
 *
 * ⚠ THE TABS LIVE IN THE FIELD, NOT THE HEAD (owner, same read: they should
 * "live inside the right panel instead of the header … feel like the full
 * frame of the right panel"). So the rail is seated on the field's own top
 * edge at full width — which is `ConsoleRail`'s native `flex: 1 1 0`
 * grammar, the thing U1 had to override when the row was stretched across a
 * ~1180px header bar. It is still the house's one rail: fully controlled,
 * `role="tablist"` with roving tabindex, and this card supplies state and
 * stations and nothing else. The skin stays ADR-089 U3/U4's, route-scoped in
 * `trinny-london.css`: flat, square, the open box filled, no spine.
 *
 * ⚠ THE MAP'S RAIL IS PORTALLED, NOT REBUILT, and moving the host SOLVES a
 * problem rather than re-opening one. `PdaConsole` owns its three readings
 * and the flight between them; it takes a `railHost` and moves its own rail
 * there. The card puts a transparent layer over the console so its wheel
 * capture cannot freeze the pinned stack — that layer is on `.pf-field--map`
 * INSIDE the bay, so a rail seated above the bay is outside its box by
 * construction, where in the head it had to be lifted over it.
 *
 * No CTA in this pass: the detail tier is a follow-up after the owner's
 * read (the plan's decision 1). The card is not a control.
 */
export function ProofCard({ track, client }: { track: CaseTrack; client: ProofStackClient }) {
  const titleId = `pf-card-${track.id}`;
  const claims = track.blocks ?? [];
  const phase = track.stamp?.phase ?? "Build";

  const stations = proofTabs(track.visual);
  const [idx, setIdx] = useState(0);
  /* The portal needs its host at RENDER time, so the field's rail row is
     held in state through a ref callback rather than in a ref. */
  const [railHost, setRailHost] = useState<HTMLDivElement | null>(null);
  const active = stations?.[Math.min(idx, stations.length - 1)];

  return (
    <article className="pf-card" aria-labelledby={titleId}>
      <header className="pf-card__head">
        {/* The client from the RECORD (ADR-097) — this was the one string
            literal on the surface, and the tab's colour now keys off the same
            `CaseDef` the name comes from. */}
        <p className="pf-card__kicker">
          {client.name} · {phase}
        </p>
        {/* ⚠ THE ORDINAL ALONE (U4, owner 2026-09-10: "that subtitle —
            whatever, Intelligence Map, Software for Few — in the top-right
            corner, you can remove that"). U3 put the project's name here as
            the peek band's distinguishing mark; the step keeps that job on
            its own, because `01 … 04` differs per card and is an INDEX
            rather than a second title. The name now letters nowhere on the
            card — the claim is the heading and the rail names the parts,
            which is the whole point of the arc. */}
        {track.arc ? <p className="pf-card__arc">{track.arc.step}</p> : null}
      </header>
      <div className="pf-card__body">
        <div className="pf-card__record">
          <h3 className="pf-card__title" id={titleId}>
            {track.arc ? track.arc.title : track.project}
          </h3>
          {track.card ? <p className="pf-card__lede">{track.card.lede}</p> : null}
          {/* ⚠ THE CLAIM CARRIES ITS SENTENCE NOW (owner: the left panel of
              the homepage "has a bit more information about each specific
              thing — let's also use that information"). `CaseBlock` has
              always been `{ glyph, title, desc }` and this surface printed
              only the title, so the record was there and the card was not
              reading it. The sentence goes sr-only below the height rung in
              `trinny-london.css` — the casefile's own 1070h precedent, and
              the reason is the same arithmetic: four two-line sentences do
              not fit a 424px record column at 1280×720. */}
          <ul className="pf-card__claims">
            {claims.map((block) => (
              <li className="pf-card__claim" key={block.title}>
                <span className="pf-card__mark" aria-hidden="true">
                  {block.glyph ? <ProofGlyph name={block.glyph} /> : null}
                </span>
                <span className="pf-card__claim-body">
                  <span className="pf-card__claim-title">{block.title}</span>
                  <span className="pf-card__claim-desc">{block.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        {/* `data-proof-settled` is the casefile's arrival gate: the console
            frame and the map's SVG rest at opacity 0 until an ancestor
            carries it. This card writes no corridor channel, so the rest
            state is declared (the arcs' host recipe, arcs.css). */}
        <div className="pf-card__field" data-proof-settled="">
          <div className="pf-card__tabs" ref={setRailHost}>
            {stations ? (
              <ConsoleRail
                stations={stations}
                activeIdx={idx}
                onActive={setIdx}
                label={proofTabLabel(track.visual.kind)}
              />
            ) : null}
          </div>
          {/* ⚠ THE BAY IS THE SIZE CONTAINER, NOT THE FIELD. The ads count
              their rows and the wireframes derive their `cqh` height off the
              box they are actually drawn in; left on `.pf-card__field` the
              container would now include the rail's row and every drawing
              would be sized against a box it does not fill. */}
          <div
            className="pf-card__bay"
            {...(active ? { role: "tabpanel", "aria-label": active.name } : null)}
          >
            <ProofField visual={track.visual} idx={idx} railHost={railHost} />
          </div>
        </div>
      </div>
    </article>
  );
}
