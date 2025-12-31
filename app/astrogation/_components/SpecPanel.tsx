"use client";

import { getComponentById } from "../catalog";

// ═══════════════════════════════════════════════════════════════
// SPEC PANEL - Static Data / Documentation
// ═══════════════════════════════════════════════════════════════

export interface SpecPanelProps {
  selectedComponentId: string | null;
}

export function SpecPanel({ selectedComponentId }: SpecPanelProps) {
  const def = selectedComponentId ? getComponentById(selectedComponentId) : null;

  if (!def) {
    return (
      <aside className="astrogation-panel astrogation-panel--right">
        <div className="panel-header">SPECIFICATIONS</div>
        <div className="panel-content panel-content--empty">
          <div className="empty-state">
            <span className="empty-state__icon">◇</span>
            <p>Select a component to edit</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="astrogation-panel astrogation-panel--right">
      <div className="panel-header">SPECIFICATIONS</div>
      <div className="panel-content">
        <div className="spec-panel">
          <div className="spec-panel__header">
            <h2 className="spec-panel__title">{def.name}</h2>
            <p className="spec-panel__desc">{def.description}</p>
          </div>

          <div className="spec-panel__section">
            <div className="spec-panel__label">Component ID</div>
            <div className="spec-panel__value spec-panel__value--mono">{def.id}</div>
          </div>

          <div className="spec-panel__section">
            <div className="spec-panel__label">Properties & Schema</div>
            <div className="spec-panel__props">
              {def.props.map((prop) => (
                <div key={prop.name} className="spec-prop">
                  <div className="spec-prop__header">
                    <span className="spec-prop__name">{prop.name}</span>
                    <span className="spec-prop__type">{prop.type}</span>
                  </div>
                  <div className="spec-prop__details">
                    <div className="spec-prop__row">
                      <span className="spec-prop__detail-label">Default:</span>
                      <span className="spec-prop__detail-value">{String(prop.default ?? "—")}</span>
                    </div>
                    {prop.type === "number" && (
                      <div className="spec-prop__row">
                        <span className="spec-prop__detail-label">Range:</span>
                        <span className="spec-prop__detail-value">
                          {prop.min ?? 0}–{prop.max ?? 100}
                          {prop.step ? ` (Step: ${prop.step})` : ""}
                        </span>
                      </div>
                    )}
                    {prop.type === "select" && (
                      <div className="spec-prop__row">
                        <span className="spec-prop__detail-label">Options:</span>
                        <span className="spec-prop__detail-value">{prop.options?.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
