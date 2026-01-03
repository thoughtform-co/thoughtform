"use client";

import { useState, useEffect, useCallback } from "react";
import type { ComponentDef } from "../catalog";
import type { StyleConfig, FoundryVariant } from "./types";
import { ComponentPreview } from "./previews/ComponentPreview";
import { TargetReticle } from "@thoughtform/ui";

// ═══════════════════════════════════════════════════════════════
// FOUNDRY VIEW - Component Editor & Preview
// With comparison grid for variants
// ═══════════════════════════════════════════════════════════════

export interface FoundryViewProps {
  selectedComponentId: string | null;
  componentProps: Record<string, unknown>;
  style: StyleConfig;
  def: ComponentDef | null;
  variants: FoundryVariant[];
  onRemoveVariant: (id: string) => void;
  onApplyVariant: (variant: FoundryVariant) => void;
  isFocused: boolean;
  onFocusChange: (focused: boolean) => void;
}

export function FoundryView({
  selectedComponentId,
  componentProps,
  style,
  def,
  variants,
  onRemoveVariant,
  onApplyVariant,
  isFocused,
  onFocusChange,
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

  // Render preview content
  const renderPreviewContent = () => {
    if (isMultiElement) {
      return (
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
      );
    }

    return (
      <TargetReticle>
        <ComponentPreview
          componentId={selectedComponentId}
          props={componentProps}
          style={style}
          fullSize
        />
      </TargetReticle>
    );
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

      {/* Variants Comparison Grid - shows AI-generated alternatives */}
      {variants.length > 0 && (
        <div className="foundry__variants-grid">
          <div className="foundry__variants-header">
            <span className="foundry__variants-label">◇ GENERATED VARIANTS</span>
            <span className="foundry__variants-count">
              {variants.length} variant{variants.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="foundry__variants-scroll">
            {variants.map((variant) => {
              // Merge variant props with default props for the component
              const variantProps = { ...componentProps, ...variant.props };
              return (
                <div key={variant.id} className="foundry__variant-card">
                  <div className="foundry__variant-preview">
                    <ComponentPreview
                      componentId={variant.componentId}
                      props={variantProps}
                      style={style}
                    />
                  </div>
                  <div className="foundry__variant-info">
                    <span className="foundry__variant-name">{variant.name}</span>
                    <p className="foundry__variant-desc">{variant.description}</p>
                  </div>
                  <div className="foundry__variant-actions">
                    <button
                      className="foundry__variant-apply"
                      onClick={() => onApplyVariant(variant)}
                      title="Apply this variant to main preview"
                    >
                      Apply
                    </button>
                    <button
                      className="foundry__variant-remove"
                      onClick={() => onRemoveVariant(variant.id)}
                      title="Remove this variant"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="foundry__info">
        <span>Click to interact • Edit properties in the right panel</span>
      </div>
    </div>
  );
}
