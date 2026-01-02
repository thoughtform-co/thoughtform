"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { ComponentDef } from "../catalog";
import type { StyleConfig, FoundryFrameConfig, UIComponentPreset } from "./types";
import { ComponentPreview } from "./previews/ComponentPreview";
import { TargetReticle, ChamferedFrame } from "@thoughtform/ui";

// ═══════════════════════════════════════════════════════════════
// FOUNDRY VIEW - Component Editor & Preview
// ═══════════════════════════════════════════════════════════════

export interface FoundryViewProps {
  selectedComponentId: string | null;
  componentProps: Record<string, unknown>;
  style: StyleConfig;
  foundryFrame: FoundryFrameConfig;
  def: ComponentDef | null;
  presets: UIComponentPreset[];
  onLoadPreset: (preset: UIComponentPreset) => void;
  onSavePreset: () => void;
  presetName: string;
  onPresetNameChange: (name: string) => void;
  canSave: boolean;
  isFocused: boolean;
  onFocusChange: (focused: boolean) => void;
  onSelectComponent: (id: string) => void;
}

export function FoundryView({
  selectedComponentId,
  componentProps,
  style,
  foundryFrame,
  def,
  presets,
  onLoadPreset,
  onSavePreset,
  presetName,
  onPresetNameChange,
  canSave,
  isFocused,
  onFocusChange,
  onSelectComponent,
}: FoundryViewProps) {
  // Zoom state for the preview
  const [zoom, setZoom] = useState(1);
  // Track which element within a multi-element component is focused
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);

  // Handle wheel zoom on preview area
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 4;
    const ZOOM_STEP = 0.1;

    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((prev) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta)));
  }, []);

  // Handle element focus for multi-element components (like vectors)
  const handleElementFocus = useCallback(
    (elementId: string | null) => {
      setFocusedElementId(elementId);
      // Notify parent of focus state to blur background UI
      onFocusChange(!!elementId);
    },
    [onFocusChange]
  );

  // Check if this is a multi-element component
  const isMultiElement = selectedComponentId === "vectors" || selectedComponentId === "word-mark";

  // Handle click to focus/unfocus (for single-element components)
  const handlePreviewClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't toggle if clicking on a specific element within multi-element components
      const target = e.target as HTMLElement;
      if (target.closest(".preview-vectors__item") || target.closest(".preview-wordmarks__item")) {
        return; // Let the item's own handler manage focus
      }

      e.stopPropagation();
      if (focusedElementId) {
        // If an element is focused (multi-element), clicking outside unfocuses it
        setFocusedElementId(null);
      } else if (!isMultiElement) {
        // Only toggle parent focus for single-element components
        onFocusChange(!isFocused);
      }
    },
    [isFocused, focusedElementId, isMultiElement, onFocusChange]
  );

  // Handle click outside to unfocus
  useEffect(() => {
    if (!isFocused && !focusedElementId) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".foundry__preview")) {
        // Clear element focus (for multi-element components)
        setFocusedElementId(null);
        // Clear parent focus (for single-element components)
        if (isFocused) {
          onFocusChange(false);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isFocused, focusedElementId, onFocusChange]);

  // Reset zoom and element focus when component changes
  useEffect(() => {
    setZoom(1);
    setFocusedElementId(null);
    onFocusChange(false);
  }, [selectedComponentId, onFocusChange]);

  // Show all presets from the Vault as templates
  // These are saved configurations that can be loaded and modified
  const vaultTemplates = useMemo(() => {
    return presets;
  }, [presets]);

  if (!selectedComponentId || !def) {
    return (
      <div className="foundry foundry--empty">
        <div className="foundry__empty-state">
          <span className="foundry__icon">⬡</span>
          <p>Select a component to begin</p>
          <span className="foundry__hint">
            Choose from the Brand System panel to start crafting
          </span>
        </div>
      </div>
    );
  }

  // Calculate zoom - only apply focus zoom for single-element components
  const hasFocus = isFocused || focusedElementId !== null;
  // For multi-element components, individual elements handle their own zoom
  const focusZoom = hasFocus && !isMultiElement ? 1.5 : 1;
  const totalZoom = zoom * focusZoom;

  // Render preview content with optional ChamferedFrame wrapper
  const renderPreviewContent = () => {
    const preview = isMultiElement ? (
      <ComponentPreview
        componentId={selectedComponentId}
        props={{
          ...componentProps,
          _focusedElementId: focusedElementId,
          _onElementFocus: handleElementFocus,
        }}
        style={style}
        fullSize
      />
    ) : (
      <TargetReticle>
        <ComponentPreview
          componentId={selectedComponentId}
          props={componentProps}
          style={style}
          fullSize
        />
      </TargetReticle>
    );

    // Wrap in ChamferedFrame if shape is not "none"
    if (foundryFrame.shape !== "none") {
      return (
        <ChamferedFrame
          shape={{
            kind: "ticketNotch",
            corner: "tr",
            notchWidthPx: foundryFrame.notchWidthPx,
            notchHeightPx: foundryFrame.notchHeightPx,
          }}
          strokeColor={foundryFrame.strokeColor}
          strokeWidth={foundryFrame.strokeWidth}
          fillColor={foundryFrame.fillColor}
          className="foundry__stage-frame"
        >
          <div className="foundry__stage-frame-content">{preview}</div>
        </ChamferedFrame>
      );
    }

    return preview;
  };

  return (
    <div className={`foundry ${hasFocus && !isMultiElement ? "foundry--focused" : ""}`}>
      {/* Preview Area */}
      <div
        className={`foundry__preview ${hasFocus && !isMultiElement ? "foundry__preview--focused" : ""}`}
        onWheel={handleWheel}
        onClick={handlePreviewClick}
      >
        <div
          className="foundry__preview-content"
          style={{
            transform: `scale(${isMultiElement ? zoom : totalZoom})`,
            transformOrigin: "center center",
            transition: hasFocus ? "transform 0.3s ease-out" : "transform 0.2s ease-out",
          }}
        >
          {renderPreviewContent()}
        </div>
        {/* Zoom indicator */}
        {zoom !== 1 && <div className="foundry__zoom-indicator">{Math.round(zoom * 100)}%</div>}
      </div>

      {/* Template Tray - horizontal scrollable bar showing Vault templates */}
      <div className="foundry__template-tray">
        <div className="foundry__template-tray-label">
          {vaultTemplates.length > 0 ? "VAULT" : "NO TEMPLATES"}
        </div>
        <div className="foundry__template-tray-scroll">
          {vaultTemplates.length > 0 ? (
            vaultTemplates.map((preset) => {
              // Extract props from preset config (excluding internal keys)
              const { __style, __foundryFrame, ...presetProps } = preset.config as Record<
                string,
                unknown
              >;
              const isCurrentComponent = preset.component_key === selectedComponentId;
              return (
                <button
                  key={preset.id}
                  className={`foundry__template-item foundry__template-item--thumbnail ${isCurrentComponent ? "foundry__template-item--current" : ""}`}
                  onClick={() => onLoadPreset(preset)}
                  title={`${preset.name} (${preset.component_key})`}
                >
                  <div className="foundry__template-thumbnail">
                    <ComponentPreview
                      componentId={preset.component_key}
                      props={presetProps}
                      style={(__style as StyleConfig) || style}
                    />
                  </div>
                  <span className="foundry__template-item-name">{preset.name}</span>
                </button>
              );
            })
          ) : (
            <div className="foundry__template-empty">
              <span>Save templates in the Vault to see them here</span>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="foundry__info">
        <span>Click to interact • Edit properties in the right panel</span>
      </div>
    </div>
  );
}
