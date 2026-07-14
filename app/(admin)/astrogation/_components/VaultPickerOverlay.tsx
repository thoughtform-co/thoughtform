"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { getComponentById, CATEGORIES } from "../catalog";
import type { UIComponentPreset, FoundryCanvasItem, ComponentSource } from "./types";
import { ComponentPreview } from "./previews/ComponentPreview";
import { getRegistryKeyForCatalog, isRegistryComponent } from "./registry-map";

// ═══════════════════════════════════════════════════════════════
// VAULT PICKER OVERLAY
// Phase 2.3: Insert approved presets from Vault into Foundry canvas
// ═══════════════════════════════════════════════════════════════

export interface VaultPickerOverlayProps {
  /** Whether the overlay is visible */
  isOpen: boolean;
  /** Available presets from Vault */
  presets: UIComponentPreset[];
  /** Callback to close the overlay */
  onClose: () => void;
  /** Callback when a preset is selected for insertion */
  onInsert: (item: Omit<FoundryCanvasItem, "id" | "frame">) => void;
}

export function VaultPickerOverlay({
  isOpen,
  presets,
  onClose,
  onInsert,
}: VaultPickerOverlayProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Reset state when overlay opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPresetId(null);
      setSearchQuery("");
      setSelectedCategoryId(null);
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filter presets by search and category
  const filteredPresets = useMemo(() => {
    let result = presets;

    // Filter by category
    if (selectedCategoryId) {
      result = result.filter((p) => {
        const def = getComponentById(p.component_key);
        return def?.category === selectedCategoryId;
      });
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(query) || p.component_key.toLowerCase().includes(query)
      );
    }

    return result;
  }, [presets, selectedCategoryId, searchQuery]);

  // Group presets by component type
  const groupedPresets = useMemo(() => {
    return filteredPresets.reduce(
      (acc, preset) => {
        const key = preset.component_key;
        if (!acc[key]) acc[key] = [];
        acc[key].push(preset);
        return acc;
      },
      {} as Record<string, UIComponentPreset[]>
    );
  }, [filteredPresets]);

  // Get selected preset
  const selectedPreset = selectedPresetId ? presets.find((p) => p.id === selectedPresetId) : null;

  // Handle insert
  const handleInsert = useCallback(() => {
    if (!selectedPreset) return;

    // Extract args and styleVars from preset config
    const { __style, ...legacyProps } = selectedPreset.config as Record<string, unknown>;
    const styleVars = __style
      ? ((__style as { styleVars?: Record<string, string> }).styleVars ?? undefined)
      : undefined;

    // Determine if we should use registry source
    const registryKey = getRegistryKeyForCatalog(selectedPreset.component_key);
    const hasRegistry = registryKey && isRegistryComponent(registryKey);

    const item: Omit<FoundryCanvasItem, "id" | "frame"> = {
      name: selectedPreset.name,
      source: (hasRegistry ? "registry" : "legacyPreview") as ComponentSource,
      registryKey: hasRegistry ? registryKey : undefined,
      componentId: selectedPreset.component_key,
      args: legacyProps as Record<string, unknown>,
      props: legacyProps as Record<string, unknown>,
      styleVars,
    };

    onInsert(item);
    onClose();
  }, [selectedPreset, onInsert, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  // Render in portal to escape stacking context
  return createPortal(
    <div className="vault-picker-overlay" onClick={onClose}>
      <div className="vault-picker-overlay__content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vault-picker-overlay__header">
          <div className="vault-picker-overlay__title">
            <span className="vault-picker-overlay__icon">◇</span>
            Insert from Vault
          </div>
          <button
            type="button"
            className="vault-picker-overlay__close"
            onClick={onClose}
            title="Close (Esc)"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Search & Filters */}
        <div className="vault-picker-overlay__filters">
          <input
            type="text"
            className="vault-picker-overlay__search"
            placeholder="Search presets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <select
            className="vault-picker-overlay__category-select"
            value={selectedCategoryId || ""}
            onChange={(e) => setSelectedCategoryId(e.target.value || null)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Content */}
        <div className="vault-picker-overlay__body">
          {/* Preset List */}
          <div className="vault-picker-overlay__list">
            {filteredPresets.length === 0 ? (
              <div className="vault-picker-overlay__empty">
                <span className="vault-picker-overlay__empty-icon">◇</span>
                <p>No presets found</p>
                {searchQuery && (
                  <button
                    type="button"
                    className="vault-picker-overlay__clear-search"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              Object.entries(groupedPresets).map(([componentKey, componentPresets]) => {
                const compDef = getComponentById(componentKey);
                return (
                  <div key={componentKey} className="vault-picker-overlay__group">
                    <div className="vault-picker-overlay__group-header">
                      {compDef?.name || componentKey}
                    </div>
                    <div className="vault-picker-overlay__group-items">
                      {componentPresets.map((preset) => (
                        <button
                          type="button"
                          key={preset.id}
                          className={`vault-picker-overlay__item ${
                            selectedPresetId === preset.id
                              ? "vault-picker-overlay__item--selected"
                              : ""
                          }`}
                          onClick={() => setSelectedPresetId(preset.id)}
                          onDoubleClick={handleInsert}
                        >
                          <span className="vault-picker-overlay__item-name">{preset.name}</span>
                          <span className="vault-picker-overlay__item-date">
                            {new Date(preset.created_at).toLocaleDateString()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Preview */}
          <div className="vault-picker-overlay__preview">
            {selectedPreset ? (
              <>
                <div className="vault-picker-overlay__preview-header">
                  <span className="vault-picker-overlay__preview-name">{selectedPreset.name}</span>
                  <span className="vault-picker-overlay__preview-component">
                    {getComponentById(selectedPreset.component_key)?.name ||
                      selectedPreset.component_key}
                  </span>
                </div>
                <div className="vault-picker-overlay__preview-content">
                  <ComponentPreview
                    componentId={selectedPreset.component_key}
                    props={(selectedPreset.config as Record<string, unknown>) || {}}
                    style={
                      (selectedPreset.config as { __style?: unknown })?.__style
                        ? ((selectedPreset.config as { __style: unknown })
                            .__style as import("./types").StyleConfig)
                        : undefined
                    }
                    fullSize
                  />
                </div>
              </>
            ) : (
              <div className="vault-picker-overlay__preview-empty">
                <span className="vault-picker-overlay__preview-empty-icon">◇</span>
                <p>Select a preset to preview</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="vault-picker-overlay__footer">
          <button type="button" className="vault-picker-overlay__cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="vault-picker-overlay__insert"
            onClick={handleInsert}
            disabled={!selectedPreset}
          >
            <span className="vault-picker-overlay__insert-icon">+</span>
            Insert to Canvas
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
