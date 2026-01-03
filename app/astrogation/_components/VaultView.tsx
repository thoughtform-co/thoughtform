"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getComponentById } from "../catalog";
import type { UIComponentPreset, StyleConfig } from "./types";
import { ComponentPreview } from "./previews/ComponentPreview";
import { TargetReticle } from "@thoughtform/ui";

// ═══════════════════════════════════════════════════════════════
// VAULT VIEW - Saved Elements & Preview
// Shows component with DEFAULT props or selected saved preset
// Does NOT show Foundry working copy
// ═══════════════════════════════════════════════════════════════

export interface VaultViewProps {
  selectedComponentId: string | null;
  componentProps: Record<string, unknown>; // Not used - kept for interface compatibility
  style: StyleConfig;
  presets: UIComponentPreset[];
  onLoadPreset: (preset: UIComponentPreset) => void;
  onDeletePreset: (id: string) => void;
  onFocusChange: (focused: boolean) => void;
}

export function VaultView({
  selectedComponentId,
  style,
  presets,
  onLoadPreset,
  onDeletePreset,
  onFocusChange,
}: VaultViewProps) {
  // Track which saved preset is selected for preview in Vault
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Focus state for multi-element components
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);

  // Get component definition for the selected component
  const def = selectedComponentId ? getComponentById(selectedComponentId) : null;

  // Get the currently selected preset (for preview override)
  const selectedPreset = selectedPresetId ? presets.find((p) => p.id === selectedPresetId) : null;

  // Build DEFAULT props from catalog definition
  const defaultProps = useMemo(() => {
    if (!def?.props) return {};
    const defaults: Record<string, unknown> = {};
    for (const [key, propDef] of Object.entries(def.props)) {
      if (propDef.default !== undefined) {
        defaults[key] = propDef.default;
      }
    }
    return defaults;
  }, [def]);

  // Determine what props to show:
  // - If a preset is selected, use its config
  // - Otherwise, use default props from catalog
  const previewProps = useMemo(() => {
    if (selectedPreset?.config) {
      const { __style, ...rest } = selectedPreset.config as Record<string, unknown>;
      return rest;
    }
    return defaultProps;
  }, [selectedPreset, defaultProps]);

  const previewStyle = selectedPreset?.config?.__style
    ? (selectedPreset.config.__style as StyleConfig)
    : style;

  // Check if this is a multi-element component
  const isMultiElement = selectedComponentId === "vectors" || selectedComponentId === "word-mark";

  // Handle element focus for multi-element components
  const handleElementFocus = useCallback(
    (id: string | null) => {
      setFocusedElementId(id);
      onFocusChange(!!id);
    },
    [onFocusChange]
  );

  // Reset selection when component filter changes
  useEffect(() => {
    setSelectedPresetId(null);
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

  // Handle clicking a preset - preview it in Vault (don't load into Foundry yet)
  const handlePresetClick = useCallback((preset: UIComponentPreset) => {
    setSelectedPresetId(preset.id);
  }, []);

  // Handle double-click to load preset into Foundry
  const handlePresetDoubleClick = useCallback(
    (preset: UIComponentPreset) => {
      onLoadPreset(preset);
    },
    [onLoadPreset]
  );

  return (
    <div className="vault">
      {/* Component Preview Area - Shows default props OR selected preset */}
      <div className="vault__preview">
        {def && selectedComponentId ? (
          isMultiElement ? (
            <ComponentPreview
              componentId={selectedComponentId}
              props={{
                ...previewProps,
                _focusedElementId: focusedElementId,
                _onElementFocus: handleElementFocus,
              }}
              style={previewStyle}
              fullSize
            />
          ) : (
            <TargetReticle>
              <ComponentPreview
                componentId={selectedComponentId}
                props={previewProps}
                style={previewStyle}
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

      {/* Saved Elements Grid */}
      {filteredPresets.length > 0 && (
        <div className="vault__grid">
          {Object.entries(groupedPresets).map(([componentKey, componentPresets]) => {
            const compDef = getComponentById(componentKey);
            return (
              <div key={componentKey} className="vault__group">
                {!selectedComponentId && (
                  <div className="vault__group-header">{compDef?.name || componentKey}</div>
                )}
                <div className="vault__items">
                  {componentPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className={`vault__item ${selectedPresetId === preset.id ? "vault__item--selected" : ""}`}
                    >
                      <button
                        className="vault__item-load"
                        onClick={() => handlePresetClick(preset)}
                        onDoubleClick={() => handlePresetDoubleClick(preset)}
                        title={`Click to preview, double-click to edit in Foundry`}
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

      {/* Show hint when filtering but no presets exist for this component */}
      {selectedComponentId && filteredPresets.length === 0 && (
        <div className="vault__empty-state">
          <p>No saved presets for this component type.</p>
          <p className="vault__empty-hint">
            Edit in Foundry and click &quot;Save to Vault&quot; to create one.
          </p>
        </div>
      )}
    </div>
  );
}
