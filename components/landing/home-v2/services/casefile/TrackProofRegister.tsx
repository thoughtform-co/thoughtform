import type { CSSProperties } from "react";

import type { CaseTrack } from "@/lib/cases/types";

import { ProofGlyph } from "./ProofGlyph";

/**
 * The selected track's four proof claims, kept beside the brief instead of
 * underneath the visual.
 *
 * A GLYPHED INDEX — ROWS, NOT BOXES (owner, 2026-08-07, ADR-068). The two
 * tiers survive, but the 2×2 plate grid does not: four bordered tiles in the
 * left column RESTATED the right panel, which is the one instrument on this
 * surface, and put a second boxed thing beside it competing for the same
 * read. An index does the opposite job — the LEFT COLUMN LISTS while the
 * RIGHT PANEL OPENS ONE — so each item is now a single row of
 * `mark · claim · sentence` on a hairline, one grammar four times over.
 *
 * TWO TIERS, unchanged (owner, 2026-08-06 — "I really want these to be super
 * clear blocks"): the claim, then one sentence of evidence. The display
 * figure that used to lead each tile is gone, because it could never be one
 * thing: across the four rows its sixteen values carried nine different
 * grammars, and row one's `27` / `47` restated the directory row's own
 * `27 → 47` two boxes away. See `CaseBlock` for the full record.
 *
 * ⚠ THAT REMOVED A WHOLE RAMP, NOT JUST A LINE. The figure carried a
 * `data-wide` branch that dropped values over 12 characters to a smaller
 * clamp — so `SELF-SUFFICIENT` rendered at 11.8px beside `97%` at 14.4px, a
 * type change INSIDE one row, on four of sixteen tiles. It also had no mobile
 * reset, so on a phone those four sat at the 10.5px floor against a 16px
 * sibling. Nothing to keep in step now.
 *
 * ⚠ IT IS A STATIC INSTRUMENT, NOT A SELECTOR. The index mockup carried a
 * lit `.row.on` state because a row there chose the panel; here the DIRECTORY
 * below does that. No hover, no active state, no cursor change, no gold inset
 * bar — a row that lights under the pointer promises a click this surface
 * does not honour, and the host is `pointer-events: none` anyway.
 *
 * ⚠ THE CLASS NAMES ARE LOAD-BEARING. `fl-proof-register`, `__list`,
 * `__item`, `__claim` and `__description` are each keyed by
 * `tests/visual/services-ring-smoke.spec.ts` (four-up count, the claim
 * ladder, the sr-only rung, the prose-is-sans guard). Rename one and the
 * smoke reports a missing zone rather than a renamed one.
 *
 * `readouts` remain a compatibility input, normalized into the same markup —
 * their `value` becomes the claim, which is the shape they always had. They
 * carry no glyph, so the gutter renders EMPTY rather than collapsing: the
 * claims stay on one rail whichever model a track uses.
 */
export function TrackProofRegister({
  track,
  id,
  tabIndex,
}: {
  track: CaseTrack;
  id?: string;
  tabIndex?: number;
}) {
  const items = track.blocks?.length
    ? track.blocks.map((block) => ({
        glyph: block.glyph,
        claim: block.title,
        description: block.desc as string | undefined,
      }))
    : (track.readouts ?? []).map((readout) => ({
        glyph: undefined as string | undefined,
        claim: readout.label,
        description: undefined,
      }));

  if (!items.length) return null;

  return (
    <section
      className="fl-proof-register"
      id={id}
      tabIndex={tabIndex}
      data-fl-zone="proof-register"
      data-fl-panel
      /* The register IS the client's record (ADR-087 Phase B) — see the
         marking note in `ServicesCasefile`. Inert until a second `CaseDef`
         puts a seam in the browse band. */
      data-fl-client-panel
      style={{ "--ci-off": 0.3, "--fl-dx": "-48px" } as CSSProperties}
      aria-label={`${track.project} proof points`}
    >
      <ul className="fl-proof-register__list">
        {items.map((item, index) => (
          <li className="fl-proof-register__item" key={`${track.id}-${index}`}>
            <span className="fl-proof-register__glyph" aria-hidden="true">
              {item.glyph ? <ProofGlyph name={item.glyph} /> : null}
            </span>
            <span className="fl-proof-register__claim">{item.claim}</span>
            {item.description ? (
              <span className="fl-proof-register__description">{item.description}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
