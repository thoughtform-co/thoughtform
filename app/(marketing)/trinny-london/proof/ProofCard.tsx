import { ProofGlyph } from "@/components/landing/home-v2/services/casefile/ProofGlyph";
import type { CaseTrack } from "@/lib/cases/types";

import { ProofField } from "./ProofField";

/**
 * ProofCard — one Loop project, at a glance (ADR-094).
 *
 * THREE REGISTERS AND NO FOURTH (the Brand Codex card set, distilled in
 * `docs/design/card-reference-analysis.md`):
 *   CLAIM   the project's name, in the display face — `track.project`
 *   FIELD   the record's own visual, bleeding to the card's right and
 *           bottom edges — `ProofField` on `track.visual`
 *   CHROME  the mono kicker in the head strip; nothing floats mid-field
 *
 * The record column under the head is the owner's brief exactly: one
 * paragraph (`track.card.lede`, ≤180) and four bullets — the four
 * `blocks[].title` claims the casefile's register already carries, with
 * their `ProofGlyph` as the bullet mark. The bullets are SANS, not mono:
 * mono never carries the claim.
 *
 * THE HEAD STRIP IS THE PEEK BAND. When a later card covers this one, the
 * head (kicker + name) is what stays visible under it, so the pile indexes
 * itself — the reader sees "these are the four projects" without a
 * directory, which is what the directory was for.
 *
 * No CTA in this pass: the detail tier is a follow-up after the owner's
 * read (the plan's decision 1). The card is not a control.
 */
export function ProofCard({ track }: { track: CaseTrack }) {
  const titleId = `tl-card-${track.id}`;
  const claims = track.blocks ?? [];
  const phase = track.stamp?.phase ?? "Build";

  return (
    <article className="tl-card" aria-labelledby={titleId}>
      <header className="tl-card__head">
        <h3 className="tl-card__title" id={titleId}>
          {track.project}
        </h3>
        <p className="tl-card__kicker">Loop Earplugs · {phase}</p>
      </header>
      <div className="tl-card__body">
        <div className="tl-card__record">
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
        <div className="tl-card__field" data-proof-settled="">
          <ProofField visual={track.visual} />
        </div>
      </div>
    </article>
  );
}
