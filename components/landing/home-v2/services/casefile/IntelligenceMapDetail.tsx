import type { CaseSkillEntry, CaseWorkConfiguration } from "@/lib/cases/types";

import type { MapMode } from "./configurationFieldLayout";

export const INTELLIGENCE_MAP_FACETS = [
  "human",
  "model",
  "skill",
  "context",
  "execution",
  "eval",
] as const;

export type IntelligenceMapFacetKey = (typeof INTELLIGENCE_MAP_FACETS)[number];

export const INTELLIGENCE_MAP_FACET_LABEL: Record<IntelligenceMapFacetKey, string> = {
  human: "Human",
  model: "Model",
  skill: "Skill",
  context: "Context",
  execution: "Execution",
  eval: "Eval",
};

export const INTELLIGENCE_MAP_BASIS_LABEL: Record<
  CaseWorkConfiguration["allocationBasis"],
  string
> = {
  "work-evidenced": "Work evidence",
  "work-evaluated": "Work evaluation",
  "function-signal": "Function signal",
};

interface IntelligenceMapDetailProps {
  configuration: CaseWorkConfiguration;
  linkedSkills: readonly CaseSkillEntry[];
  mode: MapMode;
  ordinal: number;
  total: number;
  id: string;
  onClose: () => void;
}

/**
 * One configuration detail surface in two densities.
 *
 * The compact casefile keeps the six categorical states scannable. The
 * expanded overlay adds the explanatory prose without changing the selected
 * work or its evidence semantics.
 */
export function IntelligenceMapDetail({
  configuration,
  linkedSkills,
  mode,
  ordinal,
  total,
  id,
  onClose,
}: IntelligenceMapDetailProps) {
  const expanded = mode === "expanded";

  return (
    <aside
      className="fl-intel-map__inspector fl-intel-map__detail"
      id={id}
      role="region"
      aria-label={`${configuration.work} configuration detail`}
      data-detail-mode={mode}
      data-selected-id={configuration.id}
    >
      <div className="fl-intel-map__detail-identity">
        <p className="fl-intel-map__inspector-top fl-intel-map__detail-index">
          <span>{configuration.shape}</span>
          <i>{configuration.lifecycle}</i>
          <b>
            {String(ordinal).padStart(2, "0")} / {total}
          </b>
          <button type="button" onClick={onClose} aria-label="Close configuration detail">
            ×
          </button>
        </p>
        <h4>{configuration.work}</h4>
        <p className="fl-intel-map__inspector-function">{configuration.publicFunction}</p>
        <p className="fl-intel-map__inspector-summary">{configuration.summary}</p>
      </div>

      <dl className="fl-intel-map__anatomy fl-intel-map__detail-facets">
        {INTELLIGENCE_MAP_FACETS.map((facet) => (
          <div key={facet}>
            <dt>{INTELLIGENCE_MAP_FACET_LABEL[facet]}</dt>
            <dd>
              <b>{configuration.facets[facet].state}</b>
              {expanded ? <span>{configuration.facets[facet].detail}</span> : null}
            </dd>
          </div>
        ))}
      </dl>

      <div className="fl-intel-map__inspector-foot fl-intel-map__detail-evidence">
        <p>
          <span>Human checkpoint</span>
          <b>{configuration.humanCheckpoint}</b>
        </p>
        <p>
          <span>Allocation</span>
          <b>
            {configuration.allocationTier} ·{" "}
            {INTELLIGENCE_MAP_BASIS_LABEL[configuration.allocationBasis]}
          </b>
        </p>
        <p>
          <span>Owner role</span>
          <b>{configuration.ownerRole}</b>
        </p>
        <p>
          <span>Encoded Skills</span>
          <b>
            {linkedSkills.length
              ? linkedSkills.map((skill) => skill.name).join(" · ")
              : "No encoded Skill · repository context + tests"}
          </b>
        </p>
      </div>
    </aside>
  );
}
