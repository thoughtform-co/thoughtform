"use client";

import { VARIANTS, type Variant } from "./variants";

/**
 * VariantStrip — the lab's ONLY always-on chrome.
 *
 * It is NOT part of the dev strip: `?dev=0` takes the dev strip away for a clean
 * artifact shot, and the variant strip stays, because "which round am I looking
 * at" is never a debug question. Top-centre, PT Mono 9px, one row of chips plus
 * the selected variant's provenance line — discreet enough to sit in a
 * screenshot without competing with the panel, and the reason the shots do not
 * need a separate legend.
 *
 * A chip is a LINK, not a state write. Every variant is a different component
 * tree (and two of them are iframes), so a full navigation is the honest
 * mechanism — it also guarantees the deep link in the report reproduces exactly
 * what was shot.
 */
export function VariantStrip({ active }: { active: Variant }) {
  return (
    <div className="iml-vstrip" aria-label="Design round">
      <div className="iml-vstrip__row">
        <span className="iml-vstrip__label">Round</span>
        {VARIANTS.map((variant) => (
          <a
            key={variant.id}
            className="iml-vstrip__chip"
            data-on={variant.id === active.id || undefined}
            data-kind={variant.kind}
            href={`?v=${variant.id}`}
            title={`${variant.title} — ${variant.provenance}`}
          >
            {variant.chip}
          </a>
        ))}
      </div>
      <p className="iml-vstrip__prov">{active.provenance}</p>
    </div>
  );
}
