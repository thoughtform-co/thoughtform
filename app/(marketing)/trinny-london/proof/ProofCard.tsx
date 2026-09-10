"use client";

import { useState } from "react";

import { ConsoleRail } from "@/components/landing/home-v2/services/casefile/console/ConsoleRail";
import { ProofGlyph } from "@/components/landing/home-v2/services/casefile/ProofGlyph";
import type { CaseTrack } from "@/lib/cases/types";

import { ProofField } from "./ProofField";
import { proofTabLabel, proofTabs } from "./proofTabs";

/**
 * ProofCard — one Loop project, at a glance (ADR-094, recomposed in U1).
 *
 * THREE REGISTERS AND NO FOURTH (the Brand Codex card set, distilled in
 * `docs/design/card-reference-analysis.md`):
 *   CLAIM   the project's name, in the display face — `track.project`
 *   FIELD   the record's own visual, bleeding to the card's right and
 *           bottom edges — `ProofField` on `track.visual`
 *   CHROME  the head strip: the client, and the row of tabs
 *
 * ⚠ THE HEAD IS CHROME NOW, AND THE NAME IS IN THE RECORD (owner,
 * 2026-09-10: "Loop Earplugs should be in the top-left corner, and the
 * [project] should actually be inside the left frame, so below it"). The
 * strip carries `LOOP EARPLUGS · {phase}` on the left and, where the field
 * has more than one thing to show, the tab row on the right; the name leads
 * the record column above the paragraph, where it can wrap.
 *
 * ⚠ WHAT THAT COSTS, stated because it was a real property of the old
 * layout: the head strip is THE PEEK BAND — the sliver that stays visible
 * when a later card covers this one — and with the name gone it reads the
 * same on all four, so the pile no longer indexes itself by name. The three
 * cards with tabs keep a distinguishing mark; the ads card does not. Taken
 * knowingly; the fallback if it reads badly is a quiet mono name in the
 * head's right slot on that one card.
 *
 * THE TABS ARE THE HOUSE'S OWN RAIL, not a second one. `ConsoleRail` is
 * already on this page (the map's console renders it), it is fully
 * controlled, and it is a `role="tablist"` with roving tabindex and arrow
 * keys — so this card supplies state and stations and nothing else. The
 * skin is route-scoped in `trinny-london.css`: flat, square, the open box
 * filled, no spine (ADR-089 U3/U4's grammar, which never reached this route
 * because every rule of it is `.fl-case`-scoped — that is the gradient and
 * the notch the owner named).
 *
 * ⚠ THE MAP'S RAIL IS PORTALLED, NOT REBUILT. `PdaConsole` owns its three
 * readings and the flight between them; it takes a `railHost` and moves its
 * own rail here. That also makes those readings SELECTABLE on this route for
 * the first time — the card puts a transparent layer over the console so its
 * wheel capture cannot freeze the pinned stack, and the rail was under it.
 *
 * No CTA in this pass: the detail tier is a follow-up after the owner's
 * read (the plan's decision 1). The card is not a control.
 */
export function ProofCard({ track }: { track: CaseTrack }) {
  const titleId = `tl-card-${track.id}`;
  const claims = track.blocks ?? [];
  const phase = track.stamp?.phase ?? "Build";

  const stations = proofTabs(track.visual);
  const [idx, setIdx] = useState(0);
  /* The portal needs its host at RENDER time, so the head's tab slot is
     held in state through a ref callback rather than in a ref. */
  const [railHost, setRailHost] = useState<HTMLDivElement | null>(null);
  const active = stations?.[Math.min(idx, stations.length - 1)];

  return (
    <article className="tl-card" aria-labelledby={titleId}>
      <header className="tl-card__head">
        <p className="tl-card__kicker">Loop Earplugs · {phase}</p>
        <div className="tl-card__tabs" ref={setRailHost}>
          {stations ? (
            <ConsoleRail
              stations={stations}
              activeIdx={idx}
              onActive={setIdx}
              label={proofTabLabel(track.visual.kind)}
            />
          ) : null}
        </div>
      </header>
      <div className="tl-card__body">
        <div className="tl-card__record">
          <h3 className="tl-card__title" id={titleId}>
            {track.project}
          </h3>
          {track.card ? <p className="tl-card__lede">{track.card.lede}</p> : null}
          <ul className="tl-card__claims">
            {claims.map((block) => (
              <li className="tl-card__claim" key={block.title}>
                <span className="tl-card__mark" aria-hidden="true">
                  {block.glyph ? <ProofGlyph name={block.glyph} /> : null}
                </span>
                <span>{block.title}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* `data-proof-settled` is the casefile's arrival gate: the console
            frame and the map's SVG rest at opacity 0 until an ancestor
            carries it. This card writes no corridor channel, so the rest
            state is declared (the arcs' host recipe, arcs.css). */}
        <div
          className="tl-card__field"
          data-proof-settled=""
          {...(active ? { role: "tabpanel", "aria-label": active.name } : null)}
        >
          <ProofField visual={track.visual} idx={idx} railHost={railHost} />
        </div>
      </div>
    </article>
  );
}
