"use client";

import { memo } from "react";
import { getComponentById } from "../catalog";

// ═══════════════════════════════════════════════════════════════
// SPEC PANEL - Static Data / Documentation
// ═══════════════════════════════════════════════════════════════

export interface SpecPanelProps {
  selectedComponentId: string | null;
}

function SpecPanelInner({ selectedComponentId }: SpecPanelProps) {
  const def = selectedComponentId ? getComponentById(selectedComponentId) : null;

  if (!def) {
    return (
      <aside className="astrogation-panel astrogation-panel--right">
        <div className="panel-header panel-header--filled">SPECIFICATIONS</div>
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
      <div className="panel-header panel-header--filled">SPECIFICATIONS</div>
      <div className="panel-content">
        <div className="panel-content__scrollable">
          <div className="spec-panel">
            <div className="spec-panel__header">
              <h2 className="spec-panel__title">{def.name}</h2>
              <p className="spec-panel__desc">{def.description}</p>
            </div>

            <div className="spec-panel__section">
              <div className="spec-panel__label" data-id="DESIGN_MEANING">
                Design Philosophy
              </div>
              <div className="spec-panel__rationale">
                {def.designRationale || "Technical specification pending detailed design analysis."}
              </div>
            </div>

            {def.inspiration && (
              <div className="spec-panel__section">
                <div className="spec-panel__label" data-id="INSPIRATION">
                  Inspiration Sources
                </div>
                <div className="spec-panel__inspiration">{def.inspiration}</div>
              </div>
            )}

            {def.frontendNotes && (
              <div className="spec-panel__section">
                <div className="spec-panel__label" data-id="FRONTEND">
                  Frontend Implementation
                </div>
                <div className="spec-panel__frontend-notes">{def.frontendNotes}</div>
              </div>
            )}

            <div className="spec-panel__section">
              <div className="spec-panel__label" data-id="COMP_ID">
                Component ID
              </div>
              <div className="spec-panel__value spec-panel__value--mono">{def.id}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Memoized export - prevents re-renders when parent changes but props don't
export const SpecPanel = memo(SpecPanelInner);
