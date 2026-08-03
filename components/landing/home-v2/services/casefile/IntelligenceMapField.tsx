"use client";

import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

import type {
  CaseIntelligence,
  CaseRegistryGroup,
  CaseSkillEntry,
  CaseWorkConfiguration,
} from "@/lib/cases/types";

import {
  layoutConfigurationField,
  type AllocationTierName,
  type MapMode,
  type MapProjection,
} from "./configurationFieldLayout";
import { usePersistentFieldMorph } from "./usePersistentFieldMorph";

const PROJECTIONS: readonly MapProjection[] = ["configuration", "team", "allocation"];

const PROJECTION_LABEL: Record<MapProjection, string> = {
  configuration: "Configuration",
  team: "Team",
  allocation: "Allocation",
};

const FACETS = ["human", "model", "skill", "context", "execution", "eval"] as const;
type FacetKey = (typeof FACETS)[number];

const FACET_LABEL: Record<FacetKey, string> = {
  human: "Human",
  model: "Model",
  skill: "Skill",
  context: "Context",
  execution: "Execution",
  eval: "Eval",
};

const BASIS_LABEL: Record<CaseWorkConfiguration["allocationBasis"], string> = {
  "work-evidenced": "Work evidence",
  "work-evaluated": "Work evaluation",
  "function-signal": "Function signal",
};

const LIFECYCLE_FILL: Record<CaseWorkConfiguration["lifecycle"], string> = {
  "In use": "use",
  "In build": "build",
  Evaluated: "evaluated",
};

const MORPH_STAGGER_MS = 120;

interface RelationshipLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface IntelligenceMapFieldProps {
  configurations: readonly CaseWorkConfiguration[];
  skills: readonly CaseSkillEntry[];
  groups: readonly CaseRegistryGroup[];
  intelligence: CaseIntelligence;
  mode: MapMode;
  projection: MapProjection;
  selectedId: string | null;
  focusedTier: AllocationTierName | null;
  onProjectionChange: (projection: MapProjection) => void;
  onSelectedIdChange: (id: string | null) => void;
  onFocusedTierChange: (tier: AllocationTierName | null) => void;
  onExpand?: (trigger: HTMLButtonElement) => void;
}

function nodeStyle(node: { x: number; y: number; width: number; height: number }): CSSProperties {
  return {
    left: `${node.x * 100}%`,
    top: `${node.y * 100}%`,
    width: `${node.width * 100}%`,
    height: `${node.height * 100}%`,
  };
}

function clusterLabel(configuration: CaseWorkConfiguration, projection: MapProjection): string {
  if (projection === "configuration") return configuration.shape;
  if (projection === "team") return configuration.publicFunction;
  return configuration.allocationTier;
}

function configurationAriaLabel(configuration: CaseWorkConfiguration): string {
  return [
    configuration.work,
    configuration.publicFunction,
    `${configuration.shape} work`,
    `${configuration.allocationTier} capability tier`,
    BASIS_LABEL[configuration.allocationBasis],
    configuration.lifecycle,
  ].join(". ");
}

export function IntelligenceMapField({
  configurations,
  skills,
  groups,
  intelligence,
  mode,
  projection,
  selectedId,
  focusedTier,
  onProjectionChange,
  onSelectedIdChange,
  onFocusedTierChange,
  onExpand,
}: IntelligenceMapFieldProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [keyboardId, setKeyboardId] = useState(configurations[0]?.id ?? "");
  const [relationshipLines, setRelationshipLines] = useState<RelationshipLine[]>([]);

  const instanceId = useId();
  const panelId = `${instanceId}-panel`;
  const inspectorId = `${instanceId}-inspector`;

  const canvasRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<MapProjection, HTMLButtonElement>());
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const mobileNodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const skillRefs = useRef(new Map<string, HTMLElement>());

  const layoutInput = useMemo(
    () =>
      configurations.map((configuration) => ({
        id: configuration.id,
        shape: configuration.shape,
        publicFunction: configuration.publicFunction,
        allocationTier: configuration.allocationTier,
      })),
    [configurations]
  );

  const layout = useMemo(
    () =>
      layoutConfigurationField({
        nodes: layoutInput,
        projection,
        mode,
        focusedTier: projection === "allocation" ? focusedTier : null,
      }),
    [focusedTier, layoutInput, mode, projection]
  );

  const layoutKey = `${mode}:${projection}:${focusedTier ?? "all"}`;
  const { fieldRef, captureLayout, isMorphing } = usePersistentFieldMorph<HTMLDivElement>({
    layoutKey,
  });

  const configurationById = useMemo(
    () => new Map(configurations.map((configuration) => [configuration.id, configuration])),
    [configurations]
  );
  const skillById = useMemo(() => new Map(skills.map((skill) => [skill.id, skill])), [skills]);
  const tierByName = useMemo(
    () => new Map(intelligence.tiers.map((tier) => [tier.name, tier])),
    [intelligence.tiers]
  );
  const ordinalById = useMemo(
    () => new Map(configurations.map((configuration, index) => [configuration.id, index + 1])),
    [configurations]
  );

  const activeId = hoveredId ?? selectedId ?? configurations[0]?.id ?? null;
  const active = activeId ? (configurationById.get(activeId) ?? null) : null;
  const selected = selectedId ? (configurationById.get(selectedId) ?? null) : null;
  const linkedSkillIds = useMemo(() => new Set(selected?.linkedSkillIds ?? []), [selected]);
  const linkedSkills = useMemo(
    () => (selected?.linkedSkillIds ?? []).flatMap((id) => skillById.get(id) ?? []),
    [selected, skillById]
  );

  const changeProjection = useCallback(
    (next: MapProjection) => {
      if (next === projection) return;
      captureLayout();
      onFocusedTierChange(null);
      onProjectionChange(next);
    },
    [captureLayout, onFocusedTierChange, onProjectionChange, projection]
  );

  const changeTierFocus = useCallback(
    (tier: AllocationTierName) => {
      captureLayout();
      onFocusedTierChange(focusedTier === tier ? null : tier);
    },
    [captureLayout, focusedTier, onFocusedTierChange]
  );

  const onTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, view: MapProjection) => {
      const index = PROJECTIONS.indexOf(view);
      let nextIndex: number | null = null;
      if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + PROJECTIONS.length) % PROJECTIONS.length;
      } else if (event.key === "ArrowRight") {
        nextIndex = (index + 1) % PROJECTIONS.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = PROJECTIONS.length - 1;
      }
      if (nextIndex === null) return;

      event.preventDefault();
      const next = PROJECTIONS[nextIndex];
      changeProjection(next);
      requestAnimationFrame(() => tabRefs.current.get(next)?.focus());
    },
    [changeProjection]
  );

  const focusConfigurationNode = useCallback((id: string) => {
    const desktop = nodeRefs.current.get(id);
    const mobile = mobileNodeRefs.current.get(id);
    const visible = [desktop, mobile].find((candidate): candidate is HTMLButtonElement =>
      Boolean(candidate && candidate.getClientRects().length > 0)
    );
    (visible ?? desktop ?? mobile)?.focus();
  }, []);

  const closeInspector = useCallback(() => {
    const returnId = selectedId;
    onSelectedIdChange(null);
    if (returnId) requestAnimationFrame(() => focusConfigurationNode(returnId));
  }, [focusConfigurationNode, onSelectedIdChange, selectedId]);

  const selectConfiguration = useCallback(
    (id: string) => {
      if (isMorphing()) return;
      setKeyboardId(id);
      onSelectedIdChange(selectedId === id ? null : id);
    },
    [isMorphing, onSelectedIdChange, selectedId]
  );

  const focusNode = useCallback((id: string) => {
    setKeyboardId(id);
    setHoveredId(id);
    nodeRefs.current.get(id)?.focus();
  }, []);

  const onNodeKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
      const position = layout.navRows
        .map((row, rowIndex) => ({ row, rowIndex, cellIndex: row.indexOf(id) }))
        .find((entry) => entry.cellIndex >= 0);
      if (!position) return;

      const { row, rowIndex, cellIndex } = position;
      let nextId: string | undefined;
      if (event.key === "ArrowLeft") nextId = row[cellIndex - 1];
      else if (event.key === "ArrowRight") nextId = row[cellIndex + 1];
      else if (event.key === "Home") nextId = row[0];
      else if (event.key === "End") nextId = row[row.length - 1];
      else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        const step = event.key === "ArrowUp" ? -1 : 1;
        const targetRow =
          layout.navRows[
            (rowIndex + step + layout.navRows.length) % Math.max(1, layout.navRows.length)
          ];
        nextId = targetRow?.[Math.min(cellIndex, Math.max(0, targetRow.length - 1))];
      } else {
        return;
      }

      event.preventDefault();
      if (nextId) focusNode(nextId);
    },
    [focusNode, layout.navRows]
  );

  const measureRelationships = useCallback(() => {
    const canvas = canvasRef.current;
    const node = selectedId ? nodeRefs.current.get(selectedId) : null;
    if (!canvas || !node || !selected) {
      setRelationshipLines([]);
      return;
    }

    const canvasRect = canvas.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const x1 = nodeRect.left - canvasRect.left + nodeRect.width / 2;
    const y1 = nodeRect.bottom - canvasRect.top;

    setRelationshipLines(
      selected.linkedSkillIds.flatMap((skillId) => {
        const pip = skillRefs.current.get(skillId);
        if (!pip) return [];
        const pipRect = pip.getBoundingClientRect();
        return {
          id: skillId,
          x1,
          y1,
          x2: pipRect.left - canvasRect.left + pipRect.width / 2,
          y2: pipRect.top - canvasRect.top + pipRect.height / 2,
        };
      })
    );
  }, [selected, selectedId]);

  useLayoutEffect(() => {
    const firstFrame = requestAnimationFrame(measureRelationships);
    const settled = window.setTimeout(measureRelationships, 650);
    const observer = new ResizeObserver(measureRelationships);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => {
      cancelAnimationFrame(firstFrame);
      window.clearTimeout(settled);
      observer.disconnect();
    };
  }, [layoutKey, measureRelationships]);

  const mobileGroups = useMemo(
    () =>
      layout.anchors.map((anchor) => ({
        anchor,
        configurations: configurations.filter(
          (configuration) => clusterLabel(configuration, projection) === anchor.label
        ),
      })),
    [configurations, layout.anchors, projection]
  );

  const onRootKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    if (selectedId) {
      event.stopPropagation();
      closeInspector();
    } else if (focusedTier) {
      event.stopPropagation();
      captureLayout();
      onFocusedTierChange(null);
    }
  };

  if (!active) return null;

  return (
    <div
      className="fl-plate fl-plate--registry fl-intel-map"
      data-mode={mode}
      data-proj={projection}
      onKeyDown={onRootKeyDown}
    >
      <div className="fl-intel-map__head">
        <div className="fl-intel-map__tabs" role="tablist" aria-label="Intelligence map view">
          {PROJECTIONS.map((view) => (
            <button
              type="button"
              role="tab"
              className="fl-intel-map__tab"
              id={`${instanceId}-tab-${view}`}
              aria-controls={panelId}
              aria-selected={projection === view}
              tabIndex={projection === view ? 0 : -1}
              data-on={projection === view || undefined}
              key={view}
              onClick={() => changeProjection(view)}
              onKeyDown={(event) => onTabKeyDown(event, view)}
              ref={(element) => {
                if (element) tabRefs.current.set(view, element);
                else tabRefs.current.delete(view);
              }}
            >
              {PROJECTION_LABEL[view]}
            </button>
          ))}
        </div>

        <p className="fl-intel-map__register" aria-live="polite">
          <b>{String(ordinalById.get(active.id) ?? 1).padStart(2, "0")}</b>
          <span>{active.work}</span>
          <i>{active.publicFunction}</i>
        </p>

        {onExpand ? (
          <button
            type="button"
            className="fl-intel-map__expand"
            onClick={(event) => onExpand(event.currentTarget)}
          >
            Expand map
          </button>
        ) : null}
      </div>

      <div className="fl-intel-map__decoder">
        <span className="fl-intel-map__facet-key" aria-label="Configuration signature">
          {FACETS.map((facet) => (
            <i key={facet}>{FACET_LABEL[facet]}</i>
          ))}
        </span>
        <p>Each node is work: what it inherits, what runs it, and where judgment remains.</p>
      </div>

      <div
        className="fl-intel-map__stage"
        id={panelId}
        role="tabpanel"
        aria-labelledby={`${instanceId}-tab-${projection}`}
        onMouseLeave={() => setHoveredId(null)}
        onPointerDown={(event) => {
          if (!selectedId) return;
          const target = event.target;
          if (!(target instanceof Element)) return;
          if (target.closest("[data-config-id], .fl-intel-map__inspector")) return;
          closeInspector();
        }}
      >
        <div className="fl-intel-map__canvas" ref={canvasRef}>
          <div
            className="fl-intel-map__field"
            ref={fieldRef}
            data-proj={projection}
            data-focus-tier={focusedTier ?? undefined}
            role="group"
            aria-label={`${PROJECTION_LABEL[projection]} view of eight work configurations`}
          >
            {layout.anchors.map((anchor) => {
              const tier = intelligence.tiers.find((item) => item.name === anchor.label);
              const count = configurations.filter(
                (configuration) => clusterLabel(configuration, projection) === anchor.label
              ).length;
              const style = nodeStyle({
                x: anchor.x,
                y: anchor.y,
                width: anchor.width ?? 0.16,
                height: anchor.height ?? 0.08,
              });

              if (projection === "allocation") {
                return (
                  <button
                    type="button"
                    className="fl-intel-map__anchor fl-intel-map__anchor--tier"
                    style={style}
                    key={anchor.key}
                    data-empty={anchor.empty || undefined}
                    data-focused={anchor.focused || undefined}
                    data-condensed={anchor.condensed || undefined}
                    aria-pressed={focusedTier === anchor.label}
                    onClick={() => changeTierFocus(anchor.label as AllocationTierName)}
                  >
                    <span className="fl-intel-map__anchor-name">{anchor.label}</span>
                    <span className="fl-intel-map__anchor-note">
                      {tier?.note ?? (anchor.empty ? "Ambient" : `${count} configurations`)}
                    </span>
                    {tier ? (
                      <span
                        className="fl-intel-map__meters"
                        aria-label={`${tier.name} reach ${tier.reach} percent, draw ${tier.draw} percent`}
                      >
                        <i data-kind="reach" aria-hidden="true">
                          <em>R</em>
                          <span>
                            <b style={{ "--fl-map-meter": `${tier.reach}%` } as CSSProperties} />
                          </span>
                          <strong>{tier.reach}%</strong>
                        </i>
                        <i data-kind="draw" aria-hidden="true">
                          <em>D</em>
                          <span>
                            <b style={{ "--fl-map-meter": `${tier.draw}%` } as CSSProperties} />
                          </span>
                          <strong>{tier.draw}%</strong>
                        </i>
                      </span>
                    ) : null}
                  </button>
                );
              }

              return (
                <span
                  className="fl-intel-map__anchor"
                  style={style}
                  key={anchor.key}
                  data-condensed={anchor.condensed || undefined}
                  aria-hidden="true"
                >
                  <span className="fl-intel-map__anchor-name">{anchor.label}</span>
                  <span className="fl-intel-map__anchor-count">{count}</span>
                </span>
              );
            })}

            {configurations.map((configuration, index) => {
              const node = layout.nodes.get(configuration.id);
              if (!node) return null;
              const selectedNode = selectedId === configuration.id;
              const activeNode = active.id === configuration.id;
              return (
                <button
                  type="button"
                  className="fl-intel-map__node"
                  key={configuration.id}
                  data-persistent-id={configuration.id}
                  data-config-id={configuration.id}
                  data-fill={LIFECYCLE_FILL[configuration.lifecycle]}
                  data-selected={selectedNode || undefined}
                  data-active={activeNode || undefined}
                  data-condensed={node.condensed || undefined}
                  aria-expanded={selectedNode}
                  aria-controls={inspectorId}
                  aria-label={configurationAriaLabel(configuration)}
                  tabIndex={keyboardId === configuration.id ? 0 : -1}
                  style={
                    {
                      ...nodeStyle(node),
                      "--fl-map-delay": `${Math.round(
                        (index / Math.max(1, configurations.length - 1)) * MORPH_STAGGER_MS
                      )}ms`,
                    } as CSSProperties
                  }
                  ref={(element) => {
                    if (element) nodeRefs.current.set(configuration.id, element);
                    else nodeRefs.current.delete(configuration.id);
                  }}
                  onMouseEnter={() => setHoveredId(configuration.id)}
                  onFocus={() => {
                    setHoveredId(configuration.id);
                    setKeyboardId(configuration.id);
                  }}
                  onClick={() => selectConfiguration(configuration.id)}
                  onKeyDown={(event) => onNodeKeyDown(event, configuration.id)}
                >
                  <span className="fl-intel-map__node-ord">
                    {String(ordinalById.get(configuration.id) ?? index + 1).padStart(2, "0")}
                  </span>
                  <span className="fl-intel-map__node-work">{configuration.mapLabel}</span>
                  <span className="fl-intel-map__signature" aria-hidden="true">
                    {FACETS.map((facet) => (
                      <i
                        key={facet}
                        data-facet={facet}
                        data-state={configuration.facets[facet].state}
                        title={`${FACET_LABEL[facet]}: ${configuration.facets[facet].state}`}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>

          <svg className="fl-intel-map__links" aria-hidden="true" width="100%" height="100%">
            {relationshipLines.map((line) => {
              const bend = line.y1 + Math.max(10, (line.y2 - line.y1) * 0.45);
              return (
                <path
                  key={line.id}
                  d={`M ${line.x1} ${line.y1} C ${line.x1} ${bend}, ${line.x2} ${bend}, ${line.x2} ${line.y2}`}
                />
              );
            })}
          </svg>

          <div
            className="fl-intel-map__reservoir"
            aria-label={`${skills.length} encoded Skills grouped by five work shapes`}
          >
            {groups.map((group) => {
              const groupSkills = skills.filter((skill) => skill.engine === group.name);
              return (
                <span className="fl-intel-map__skill-group" key={group.name}>
                  <b>{group.name}</b>
                  <span className="fl-intel-map__pips" aria-hidden="true">
                    {groupSkills.map((skill) => (
                      <i
                        key={skill.id}
                        ref={(element) => {
                          if (element) skillRefs.current.set(skill.id, element);
                          else skillRefs.current.delete(skill.id);
                        }}
                        data-linked={linkedSkillIds.has(skill.id) || undefined}
                        title={skill.name}
                      />
                    ))}
                  </span>
                  <em>{groupSkills.length}</em>
                </span>
              );
            })}
          </div>
        </div>

        <div className="fl-intel-map__mobile-list">
          {mobileGroups.map(({ anchor, configurations: grouped }) => (
            <section className="fl-intel-map__mobile-group" key={anchor.key}>
              <h4>
                <span>{anchor.label}</span>
                {projection === "allocation" && tierByName.has(anchor.label) ? (
                  <em>
                    Reach {tierByName.get(anchor.label)?.reach}% · Draw{" "}
                    {tierByName.get(anchor.label)?.draw}%
                  </em>
                ) : null}
                <i>{grouped.length}</i>
              </h4>
              {grouped.length ? (
                <div>
                  {grouped.map((configuration) => (
                    <button
                      type="button"
                      key={configuration.id}
                      data-config-id={configuration.id}
                      data-selected={selectedId === configuration.id || undefined}
                      aria-expanded={selectedId === configuration.id}
                      aria-controls={inspectorId}
                      ref={(element) => {
                        if (element) mobileNodeRefs.current.set(configuration.id, element);
                        else mobileNodeRefs.current.delete(configuration.id);
                      }}
                      onClick={() => selectConfiguration(configuration.id)}
                    >
                      <span>{configuration.work}</span>
                      <i>
                        {configuration.publicFunction} · {configuration.allocationTier}
                      </i>
                    </button>
                  ))}
                </div>
              ) : (
                <p>Ambient intelligence. No maintained workflow leans here.</p>
              )}
            </section>
          ))}

          <details className="fl-intel-map__mobile-reservoir">
            <summary>
              {skills.length} Skills · {groups.length} substrate shapes
            </summary>
            {groups.map((group) => (
              <p key={group.name}>
                <b>{group.name}</b>
                <span>
                  {skills
                    .filter((skill) => skill.engine === group.name)
                    .map((skill) => skill.name)
                    .join(" · ")}
                </span>
              </p>
            ))}
          </details>
        </div>

        {selected ? (
          <aside
            className="fl-intel-map__inspector"
            id={inspectorId}
            role="region"
            aria-label={`${selected.work} configuration detail`}
          >
            <p className="fl-intel-map__inspector-top">
              <span>{selected.shape}</span>
              <i>{selected.lifecycle}</i>
              <b>
                {String(ordinalById.get(selected.id) ?? 1).padStart(2, "0")} /{" "}
                {configurations.length}
              </b>
              <button
                type="button"
                onClick={closeInspector}
                aria-label="Close configuration detail"
              >
                ×
              </button>
            </p>
            <h4>{selected.work}</h4>
            <p className="fl-intel-map__inspector-function">{selected.publicFunction}</p>
            <p className="fl-intel-map__inspector-summary">{selected.summary}</p>

            <dl className="fl-intel-map__anatomy">
              {FACETS.map((facet) => (
                <div key={facet}>
                  <dt>{FACET_LABEL[facet]}</dt>
                  <dd>
                    <b>{selected.facets[facet].state}</b>
                    <span>{selected.facets[facet].detail}</span>
                  </dd>
                </div>
              ))}
            </dl>

            <div className="fl-intel-map__inspector-foot">
              <p>
                <span>Human checkpoint</span>
                <b>{selected.humanCheckpoint}</b>
              </p>
              <p>
                <span>Owner role</span>
                <b>{selected.ownerRole}</b>
              </p>
              <p>
                <span>Allocation</span>
                <b>
                  {selected.allocationTier} · {BASIS_LABEL[selected.allocationBasis]}
                </b>
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
        ) : null}
      </div>

      <p className="fl-intel-map__readout">
        <span>
          {configurations.length} work configurations · {skills.length} Skills ·{" "}
          {intelligence.tiers.length} tiers
        </span>
        <i aria-hidden="true" />
        <b>
          {projection === "allocation"
            ? "Reach is not draw"
            : projection === "team"
              ? "Public function roll-up"
              : "Work is the unit"}
        </b>
      </p>
    </div>
  );
}

export type { AllocationTierName, MapProjection };
