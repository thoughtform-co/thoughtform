import type { CSSProperties } from "react";

import type { CaseTrack } from "@/lib/cases/types";

/**
 * The selected track's four proof claims, kept beside the brief instead of
 * underneath the visual.
 *
 * TWO TIERS: the claim, then one sentence of evidence (owner, 2026-08-06 —
 * "I really want these to be super clear blocks"). The display figure that
 * used to lead each tile is gone, because it could never be one thing: across
 * the four rows its sixteen values carried nine different grammars, and row
 * one's `27` / `47` restated the directory row's own `27 → 47` two boxes
 * away. See `CaseBlock` for the full record.
 *
 * ⚠ THAT REMOVED A WHOLE RAMP, NOT JUST A LINE. The figure carried a
 * `data-wide` branch that dropped values over 12 characters to a smaller
 * clamp — so `SELF-SUFFICIENT` rendered at 11.8px beside `97%` at 14.4px, a
 * type change INSIDE one row, on four of sixteen tiles. It also had no mobile
 * reset, so on a phone those four sat at the 10.5px floor against a 16px
 * sibling. Nothing to keep in step now.
 *
 * `readouts` remain a compatibility input, normalized into the same markup —
 * their `value` becomes the claim, which is the shape they always had.
 */
export function TrackProofRegister({ track }: { track: CaseTrack }) {
  const items = track.blocks?.length
    ? track.blocks.map((block) => ({
        claim: block.title,
        description: block.desc as string | undefined,
      }))
    : (track.readouts ?? []).map((readout) => ({
        claim: readout.label,
        description: undefined,
      }));

  if (!items.length) return null;

  return (
    <section
      className="fl-proof-register"
      data-fl-zone="proof-register"
      data-fl-panel
      style={{ "--ci-off": 0.3, "--fl-dx": "-48px" } as CSSProperties}
      aria-label={`${track.project} proof points`}
    >
      <ul className="fl-proof-register__list">
        {items.map((item, index) => (
          <li className="fl-proof-register__item" key={`${track.id}-${index}`}>
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
