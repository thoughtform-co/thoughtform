"use client";

import { useState, useEffect, useCallback } from "react";
import { getComponentById } from "../catalog";
import type { UIComponentPreset, StyleConfig } from "./types";
import { ComponentPreview } from "./previews/ComponentPreview";
import { TargetReticle } from "@thoughtform/ui";

// ═══════════════════════════════════════════════════════════════
// VAULT VIEW - Saved Elements & Preview
// ═══════════════════════════════════════════════════════════════

export interface VaultViewProps {
  selectedComponentId: string | null;
  componentProps: Record<string, unknown>;
  style: StyleConfig;
  presets: UIComponentPreset[];
  onLoadPreset: (preset: UIComponentPreset) => void;
  onDeletePreset: (id: string) => void;
  onFocusChange: (focused: boolean) => void;
}

export function VaultView({
  selectedComponentId,
  componentProps,
  style,
  presets,
  onLoadPreset,
  onDeletePreset,
  onFocusChange,
}: VaultViewProps) {
  const def = selectedComponentId ? getComponentById(selectedComponentId) : null;

  // Focus state for multi-element components
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);

  // Check if this is a multi-element component
  const isMultiElement = selectedComponentId === "vectors" || selectedComponentId === "word-mark";

  // Handle element focus for multi-element components
  const handleElementFocus = useCallback(
    (id: string | null) => {
      setFocusedElementId(id);
      // Synchronize with global focus state so the entire interface responds
      onFocusChange(!!id);
    },
    [onFocusChange]
  );

  // Reset focus when component changes
  useEffect(() => {
    setFocusedElementId(null);
    onFocusChange(false);
  }, [selectedComponentId, onFocusChange]);

  // Filter presets if a component is selected, otherwise show all
  const filteredPresets = selectedComponentId
    ? presets.filter((p) => p.component_key === selectedComponentId)
    : presets;

  // Group presets by component type for the "All Presets" view
  const groupedPresets = filteredPresets.reduce(
    (acc, preset) => {
      const key = preset.component_key;
      if (!acc[key]) acc[key] = [];
      acc[key].push(preset);
      return acc;
    },
    {} as Record<string, UIComponentPreset[]>
  );

  return (
    <div className="vault">
      {/* Component Preview Area */}
      <div className="vault__preview">
        {def ? (
          isMultiElement ? (
            // For multi-element components, don't wrap in TargetReticle
            <ComponentPreview
              componentId={selectedComponentId!}
              props={{
                ...componentProps,
                _focusedElementId: focusedElementId,
                _onElementFocus: handleElementFocus,
              }}
              style={style}
              fullSize
            />
          ) : (
            // For single-element components, wrap in TargetReticle
            <TargetReticle>
              <ComponentPreview
                componentId={selectedComponentId!}
                props={componentProps}
                style={style}
                fullSize
              />
            </TargetReticle>
          )
        ) : (
          <div className="vault__empty-preview">
            <span className="vault__icon">◇</span>
            <p>Select a component to preview its specifications</p>
          </div>
        )}
      </div>

      {/* Saved Elements Section - Only show if there are variants */}
      {filteredPresets.length > 0 && (
        <div className="vault__grid">
          {Object.entries(groupedPresets).map(([componentKey, componentPresets]) => {
            const compDef = getComponentById(componentKey);
            return (
              <div key={componentKey} className="vault__group">
                {!def && <div className="vault__group-header">{compDef?.name || componentKey}</div>}
                <div className="vault__items">
                  {componentPresets.map((preset) => (
                    <div key={preset.id} className="vault__item">
                      <button
                        className="vault__item-load"
                        onClick={() => onLoadPreset(preset)}
                        title={`Load ${preset.name}`}
                      >
                        <span className="vault__item-name">{preset.name}</span>
                      </button>
                      <button
                        className="vault__item-delete"
                        onClick={() => onDeletePreset(preset.id)}
                        title="Delete preset"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
