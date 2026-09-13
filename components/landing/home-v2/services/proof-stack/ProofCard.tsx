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
/**
 * Where the card's rail is drawn (the head-rail lab, 2026-09-12).
 *
 * `"field"` is the shipped grammar (ADR-094 U2): the rail seated on the
 * right panel's own top edge. The other two put the stations up in the
 * client's band, which is what the owner asked to see before it is chosen.
 *
 * ⚠ NEITHER MAY CROSS INTO THE RECORD'S COLUMN (owner, 2026-09-12: it
 * "should never extend too much to the left side where the left panel sits,
 * it should remain on the right side"). So the band becomes the BODY'S OWN
 * GRID when a rail is in it — the same `2fr 3fr` tracks — and the rail sits
 * in the second cell, on the field's own insets. The stations then land on
 * the verticals the bay below them already uses.
 *
 *   panel  the shipped station boxes, spanning the field's column exactly.
 *   flat   labels only, from the bay's left edge — the band is chrome, and
 *          a box in it is a control bolted to a label.
 *
 * ⚠ THE DEFAULT IS WHAT SHIPS — back to `"field"` at ADR-097 U7 (owner, on
 * reading U6 live: "I don't think the tabs in the header is working; can't
 * we restore them in their original position?"). `"panel"` and `"flat"` are
 * the lab's, which passes them explicitly; production calls pass nothing and
 * get the ruling.
 */
export type ProofRailSeat = "field" | "panel" | "flat";

export function ProofCard({
  track,
  client,
  railSeat = "field",
}: {
  track: CaseTrack;
  client: ProofStackClient;
  railSeat?: ProofRailSeat;
}) {
  const titleId = `pf-card-${track.id}`;
  const claims = track.blocks ?? [];
  const phase = track.stamp?.phase ?? "Build";

  const stations = proofTabs(track.visual);
  const [idx, setIdx] = useState(0);
  /* The portal needs its host at RENDER time, so the field's rail row is
     held in state through a ref callback rather than in a ref. */
  const [railHost, setRailHost] = useState<HTMLDivElement | null>(null);
  const active = stations?.[Math.min(idx, stations.length - 1)];

  const inHead = railSeat !== "field";
  const rail = stations ? (
    <ConsoleRail
      stations={stations}
      activeIdx={idx}
      onActive={setIdx}
      label={proofTabLabel(track.visual.kind)}
    />
  ) : null;

  return (
    <article
      className="pf-card"
      aria-labelledby={titleId}
      {...(inHead ? { "data-pf-rail": railSeat } : null)}
    >
      <header className="pf-card__head">
        {/* ⚠ THE BAND IS THE BODY'S GRID WHEN THE RAIL IS IN IT. The identity
            takes the record's column and the rail takes the field's, so the
            stations can never reach across the split — and they land on the
            bay's own verticals rather than near them. */}
        {inHead ? (
          <div className="pf-card__headid">
            <p className="pf-card__kicker">
              {client.name} · {phase}
            </p>
          </div>
        ) : null}
        {inHead ? (
          /* ⚠ IT CARRIES `pf-card__tabs` TOO, so the stations are the SHIPPED
             stations — the outline, the gold fill among them, the knocked-out
             diamond, the focus ring. `__headrail` adjusts only the SEATING. A
             head rail that re-described the station would be a second
             description of one object, and the two would drift. */
          <div className="pf-card__tabs pf-card__headrail" ref={setRailHost}>
            {rail}
          </div>
        ) : null}
        {/* The client from the RECORD (ADR-097) — this was the one string
            literal on the surface, and the tab's colour now keys off the same
            `CaseDef` the name comes from. */}
        {inHead ? null : (
          <p className="pf-card__kicker">
            {client.name} · {phase}
          </p>
        )}
        {/* ⚠ THE ORDINAL IS GONE (U7, owner: "remove the numbers (01 etc)").
            It had been the head's whole right slot since ADR-094 U4, kept
            because `01 … 04` differs per card and was what let the PEEK BAND
            tell the pile apart. That job is now unheld: three of the four
            phases read `Build`, so the sliver a covered card shows is
            `LOOP EARPLUGS · BUILD` on cards 1–3 and `· NAVIGATE` on 4.
            Recorded rather than argued — the owner has read the pile with the
            numbers on it for a week. `track.arc.step` stays in the RECORD and
            `trinny-proof-order.test.ts` still pins the sequence against it;
            it simply letters nowhere on the card now. */}
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
          {inHead ? null : (
            <div className="pf-card__tabs" ref={setRailHost}>
              {rail}
            </div>
          )}
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
