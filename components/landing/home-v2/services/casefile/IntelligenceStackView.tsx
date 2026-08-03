import type { CaseStackLayer } from "@/lib/cases/types";

/**
 * IntelligenceStackView — the configuration as LAYERS (ADR-056 U16).
 *
 * The owner's step-back: the intelligence map "is not just skills. It's
 * also the model, the connectors it has access to, the tools we build on
 * top of it." This view is that sentence made into an object: four bands,
 * top of stack first, so the reading order runs from what the teams got
 * down to what it runs on.
 *
 * Deliberately the QUIETEST of the three views. It is an inventory, and an
 * inventory that tries to be a chart is the overwhelm the owner warned
 * about. One count at display size per band, one gloss line, and chips
 * that drop on short viewports because nothing here is load-bearing.
 *
 * The chips carry two standing rules from rules/proof.md: connector chips
 * are CATEGORIES (the named vendor register belongs to the client deck),
 * and the model chips are GENERIC capability tiers, never model families.
 */
export function IntelligenceStackView({ layers }: { layers: readonly CaseStackLayer[] }) {
  return (
    <div className="fl-skills__stack" role="list" aria-label="The configuration, layer by layer">
      {layers.map((layer) => (
        <div className="fl-skills__layer" key={layer.name} role="listitem">
          <span className="fl-skills__layer-count">{layer.count}</span>
          <span className="fl-skills__layer-body">
            <span className="fl-skills__layer-name">{layer.name}</span>
            <span className="fl-skills__layer-gloss">{layer.gloss}</span>
            {/* The chips take a LINE OF THEIR OWN rather than a column
                beside the gloss. Beside it they competed for width with a
                `1fr` track and lost, which sliced them mid-word — "DESIGN"
                rendering as "DE". A chip is a label; half a label is a
                defect, not a compromise. Full width, they all fit. */}
            {layer.items?.length ? (
              <span className="fl-skills__layer-items">
                {layer.items.map((item) => (
                  <i className="fl-skills__layer-chip" key={item}>
                    {item}
                  </i>
                ))}
              </span>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}
