"use client";

import { memo, useCallback } from "react";
import { getComponentById, type PropDef } from "../catalog";
import type { CornerToken } from "@thoughtform/ui";
import { BRAND_COLORS, BORDER_COLORS } from "./types";
import { CornerSelector } from "./helpers";

// ═══════════════════════════════════════════════════════════════
// PROP CATEGORIZATION
// ═══════════════════════════════════════════════════════════════

// Group props by category for organized display
function categorizeProp(propName: string): string {
  const name = propName.toLowerCase();
  // Content props
  if (["label", "title", "text", "index", "placeholder", "name"].includes(name)) return "content";
  // Style props
  if (["variant", "size", "accent", "accentcolor", "position", "orientation"].includes(name))
    return "style";
  // General color props (background, text, fill)
  if (
    ["backgroundcolor", "textcolor", "fillcolor"].includes(name) ||
    (name.includes("fill") && !name.includes("border") && !name.includes("corner"))
  )
    return "colors";
  // Border props (including borderColor)
  if (["borderthickness", "borderstyle", "bordercolor"].includes(name)) return "borders";
  // Corner props (including cornerColor)
  if (["cornertoken", "cornerthickness", "cornercolor", "cornersize"].includes(name))
    return "corners";
  // Toggle/boolean props
  if (name.startsWith("show") || ["checked", "disabled"].includes(name)) return "toggles";
  // Dimension props
  if (
    ["width", "height", "length", "tickcount", "min", "max", "step", "value", "intensity"].includes(
      name
    )
  )
    return "dimensions";
  return "other";
}

const PROP_CATEGORY_ORDER = [
  "content",
  "style",
  "colors",
  "borders",
  "corners",
  "toggles",
  "dimensions",
  "other",
];

const PROP_CATEGORY_LABELS: Record<string, string> = {
  content: "Content",
  style: "Style",
  colors: "Colors",
  borders: "Borders",
  corners: "Corners",
  toggles: "Options",
  dimensions: "Dimensions",
  other: "Other",
};

// ═══════════════════════════════════════════════════════════════
// DIALS PANEL
// ═══════════════════════════════════════════════════════════════

export interface DialsPanelProps {
  selectedComponentId: string | null;
  componentProps: Record<string, unknown>;
  onPropsChange: (props: Record<string, unknown>) => void;
  onCopyCode: () => void;
  onSavePreset: () => void;
  presetName: string;
  onPresetNameChange: (name: string) => void;
  canSave: boolean;
}

function DialsPanelInner({
  selectedComponentId,
  componentProps,
  onPropsChange,
  onCopyCode,
  onSavePreset,
  presetName,
  onPresetNameChange,
  canSave,
}: DialsPanelProps) {
  const def = selectedComponentId ? getComponentById(selectedComponentId) : null;

  const renderPropControl = (propDef: PropDef, value: unknown) => {
    const currentValue = value ?? propDef.default;

    switch (propDef.type) {
      case "string":
        return (
          <div className="dial-group">
            <div className="dial-group__label">{propDef.name}</div>
            <input
              type="text"
              className="dial-input"
              value={currentValue as string}
              onChange={(e) => onPropsChange({ ...componentProps, [propDef.name]: e.target.value })}
            />
          </div>
        );

      case "number":
        return (
          <div className="dial-group">
            <div className="dial-group__header">
              <span className="dial-group__label">{propDef.name}</span>
              <span className="dial-group__value">{currentValue as number}</span>
            </div>
            <input
              type="range"
              className="dial-slider"
              min={propDef.min ?? 0}
              max={propDef.max ?? 100}
              step={propDef.step ?? 1}
              value={currentValue as number}
              onChange={(e) =>
                onPropsChange({ ...componentProps, [propDef.name]: parseFloat(e.target.value) })
              }
            />
          </div>
        );

      case "boolean":
        return (
          <label className="dial-toggle">
            <input
              type="checkbox"
              checked={currentValue as boolean}
              onChange={(e) =>
                onPropsChange({ ...componentProps, [propDef.name]: e.target.checked })
              }
            />
            <span>{propDef.name}</span>
          </label>
        );

      case "select":
        return (
          <div className="dial-group">
            <div className="dial-group__label">{propDef.name}</div>
            <select
              className="dial-select"
              value={currentValue as string}
              onChange={(e) => onPropsChange({ ...componentProps, [propDef.name]: e.target.value })}
            >
              {propDef.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        );

      case "color": {
        const currentColor = currentValue as string;
        const supportsTransparent =
          propDef.name.toLowerCase().includes("background") ||
          propDef.name.toLowerCase().includes("fill");
        // Use subtle border colors for border properties
        const isBorderColor = propDef.name.toLowerCase().includes("bordercolor");
        const colorOptions = isBorderColor ? BORDER_COLORS : BRAND_COLORS;

        return (
          <div className="dial-group">
            <div className="dial-group__label">{propDef.name}</div>
            <div className="color-picker">
              <div className="color-swatches">
                {supportsTransparent && (
                  <button
                    className={`color-swatch color-swatch--none ${currentColor === "transparent" ? "active" : ""}`}
                    title="None / Transparent"
                    onClick={() =>
                      onPropsChange({ ...componentProps, [propDef.name]: "transparent" })
                    }
                  >
                    <span className="swatch-x">✕</span>
                  </button>
                )}
                {colorOptions.map((c) => (
                  <button
                    key={c.name}
                    className={`color-swatch ${currentColor === c.value ? "active" : ""}`}
                    style={{ background: c.value }}
                    title={c.name}
                    onClick={() => {
                      if (currentColor === c.value) {
                        const fallback = supportsTransparent
                          ? "transparent"
                          : (propDef.default as string);
                        onPropsChange({ ...componentProps, [propDef.name]: fallback });
                      } else {
                        onPropsChange({ ...componentProps, [propDef.name]: c.value });
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      }

      case "corners":
        // Corner selector is self-explanatory, no label needed
        return (
          <div className="dial-group dial-group--corners">
            <CornerSelector
              value={currentValue as CornerToken}
              onChange={(val) => onPropsChange({ ...componentProps, [propDef.name]: val })}
            />
          </div>
        );

      default:
        return null;
    }
  };

  if (!selectedComponentId || !def) {
    return (
      <aside className="astrogation-panel astrogation-panel--right astrogation-panel--inspector">
        <div className="panel-header-wrapper">
          <div className="panel-header panel-header--inspector">
            <span className="panel-header__title">FOUNDRY</span>
          </div>
        </div>
        <div className="panel-content panel-content--empty">
          <div className="inspector-frame inspector-frame--empty">
            {/* SVG border that traces the chamfered polygon */}
            <div className="inspector-frame__border">
              <svg viewBox="0 0 340 734" preserveAspectRatio="none">
                <polygon points="0,32 188,32 220,0 340,0 340,734 0,734" />
              </svg>
            </div>
            <div className="inspector-frame__content">
              <div className="inspector-frame__scrollable">
                <div className="panel-empty-state">
                  <span className="panel-empty-state__icon">◇</span>
                  <p>Select a component to edit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Prop ordering within categories (consistent across all components)
  const propOrder: Record<string, string[]> = {
    colors: ["backgroundColor", "textColor", "fillColor"],
    borders: ["borderStyle", "borderColor", "borderThickness"],
    corners: ["cornerToken", "cornerColor", "cornerSize", "cornerThickness"],
  };

  // Group props by category
  const groupedProps: Record<string, PropDef[]> = {};
  def.props.forEach((propDef) => {
    const category = categorizeProp(propDef.name);
    if (!groupedProps[category]) groupedProps[category] = [];
    groupedProps[category].push(propDef);
  });

  // Sort props within categories that have a defined order
  Object.keys(propOrder).forEach((category) => {
    if (groupedProps[category]) {
      const order = propOrder[category];
      groupedProps[category].sort((a, b) => {
        const aIndex = order.indexOf(a.name);
        const bIndex = order.indexOf(b.name);
        // Props not in order list go to the end
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });
    }
  });

  return (
    <aside className="astrogation-panel astrogation-panel--right astrogation-panel--inspector">
      <div className="panel-header-wrapper">
        <div className="panel-header panel-header--inspector">
          <span className="panel-header__title">FOUNDRY</span>
        </div>
      </div>

      <div className="panel-content">
        <div className="inspector-frame">
          {/* SVG border that traces the chamfered polygon */}
          <div className="inspector-frame__border">
            <svg viewBox="0 0 340 734" preserveAspectRatio="none">
              <polygon points="0,32 188,32 220,0 340,0 340,734 0,734" />
            </svg>
          </div>

          {/* Title in step-down area */}
          <div className="inspector-frame__title-row">
            <span className="inspector-frame__title">{def.name}</span>
          </div>

          <div className="inspector-frame__content">
            <div className="inspector-frame__scrollable">
              <div className="spec-panel-v2">
                {/* ─── HEADER (Harmonized with Vault) ─── */}
                <header className="spec-header">
                  <p className="spec-header__desc">{def.description}</p>
                </header>

                {/* Render props grouped by category */}
                {PROP_CATEGORY_ORDER.map((category) => {
                  const props = groupedProps[category];
                  if (!props || props.length === 0) return null;

                  return (
                    <div key={category} className="spec-section">
                      <div className="spec-section__label">
                        <span className="spec-section__label-text">
                          {PROP_CATEGORY_LABELS[category]}
                        </span>
                        <span className="spec-section__label-line" />
                      </div>
                      <div className="dials-category__content">
                        {props.map((propDef) => (
                          <div key={propDef.name}>
                            {renderPropControl(propDef, componentProps[propDef.name])}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Actions */}
                <div className="dials-actions">
                  <button className="action-btn action-btn--full" onClick={onCopyCode}>
                    Copy JSX Code
                  </button>
                </div>

                {/* Save Section */}
                <div className="dials-save">
                  <div className="dials-save__group">
                    <input
                      type="text"
                      className="dials-save__input"
                      placeholder="Name your creation..."
                      value={presetName}
                      onChange={(e) => onPresetNameChange(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && canSave && onSavePreset()}
                    />
                    <button className="dials-save__btn" onClick={onSavePreset} disabled={!canSave}>
                      Save to Vault
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Memoized export - prevents re-renders when parent changes but props don't
export const DialsPanel = memo(DialsPanelInner);
