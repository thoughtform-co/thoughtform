"use client";

import { memo, useCallback } from "react";
import { getComponentById, type PropDef } from "../catalog";
import { ChamferedFrame, type CornerToken } from "@thoughtform/ui";
import {
  BRAND_COLORS,
  BORDER_COLORS,
  type FoundryFrameConfig,
  type FoundryShapePreset,
} from "./types";
import { CornerSelector } from "./helpers";

// Shape preset options for the Frame controls
const SHAPE_PRESETS: { value: FoundryShapePreset; label: string }[] = [
  { value: "none", label: "No Frame" },
  { value: "inspectorTicket", label: "Inspector Ticket" },
  { value: "inspectorTicketCompact", label: "Ticket Compact" },
  { value: "cutCornersSm", label: "Cut Corners (Sm)" },
  { value: "cutCornersMd", label: "Cut Corners (Md)" },
  { value: "cutCornersTopRight", label: "Cut Top Right" },
];

// Frame stroke colors (same as border colors plus transparent)
const FRAME_STROKE_COLORS = [
  { name: "Gold 30%", value: "rgba(202, 165, 84, 0.3)" },
  { name: "Gold 50%", value: "rgba(202, 165, 84, 0.5)" },
  { name: "Gold", value: "#caa554" },
  { name: "Dawn 15%", value: "rgba(235, 227, 214, 0.15)" },
  { name: "Dawn 30%", value: "rgba(235, 227, 214, 0.30)" },
  { name: "Dawn", value: "#ebe3d6" },
];

// Frame fill colors
const FRAME_FILL_COLORS = [
  { name: "Void 40%", value: "rgba(10, 9, 8, 0.4)" },
  { name: "Void 60%", value: "rgba(10, 9, 8, 0.6)" },
  { name: "Void 80%", value: "rgba(10, 9, 8, 0.8)" },
  { name: "Void", value: "#0a0908" },
  { name: "None", value: "transparent" },
];

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
  onCopyFramedCode?: () => void;
  onSavePreset: () => void;
  presetName: string;
  onPresetNameChange: (name: string) => void;
  canSave: boolean;
  foundryFrame: FoundryFrameConfig;
  onFoundryFrameChange: (frame: Partial<FoundryFrameConfig>) => void;
  children?: React.ReactNode;
}

function DialsPanelInner({
  selectedComponentId,
  componentProps,
  onPropsChange,
  onCopyCode,
  onCopyFramedCode,
  onSavePreset,
  presetName,
  onPresetNameChange,
  canSave,
  foundryFrame,
  onFoundryFrameChange,
  children,
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
          <ChamferedFrame
            shape="inspectorTicket"
            className="inspector-frame inspector-frame--empty"
          >
            <div className="panel-empty-state">
              <span className="panel-empty-state__icon">◇</span>
              <p>Select a component to edit</p>
            </div>
          </ChamferedFrame>
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
        <ChamferedFrame
          shape="inspectorTicket"
          className="inspector-frame"
          titleSlot={<span className="inspector-frame__title">{def.name}</span>}
        >
          <div className="spec-panel-v2">
            {/* ─── HEADER (Harmonized with Vault) ─── */}
            <header className="spec-header">
              <p className="spec-header__desc">{def.description}</p>
            </header>

            {/* ─── FRAME CONTROLS ─── */}
            <div className="spec-section spec-section--frame">
              <div className="spec-section__label">
                <span className="spec-section__label-text">Frame</span>
                <span className="spec-section__label-line" />
              </div>
              <div className="dials-category__content">
                {/* Shape Preset */}
                <div className="dial-group">
                  <div className="dial-group__label">Shape</div>
                  <select
                    className="dial-select"
                    value={foundryFrame.shape}
                    onChange={(e) =>
                      onFoundryFrameChange({ shape: e.target.value as FoundryShapePreset })
                    }
                  >
                    {SHAPE_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notch controls - only show for ticket shapes */}
                {foundryFrame.shape.startsWith("inspector") && (
                  <>
                    <div className="dial-group">
                      <div className="dial-group__header">
                        <span className="dial-group__label">Notch Width</span>
                        <span className="dial-group__value">{foundryFrame.notchWidthPx}px</span>
                      </div>
                      <input
                        type="range"
                        className="dial-slider"
                        min={80}
                        max={320}
                        step={10}
                        value={foundryFrame.notchWidthPx}
                        onChange={(e) =>
                          onFoundryFrameChange({ notchWidthPx: parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div className="dial-group">
                      <div className="dial-group__header">
                        <span className="dial-group__label">Notch Height</span>
                        <span className="dial-group__value">{foundryFrame.notchHeightPx}px</span>
                      </div>
                      <input
                        type="range"
                        className="dial-slider"
                        min={16}
                        max={64}
                        step={4}
                        value={foundryFrame.notchHeightPx}
                        onChange={(e) =>
                          onFoundryFrameChange({ notchHeightPx: parseInt(e.target.value) })
                        }
                      />
                    </div>
                  </>
                )}

                {/* Stroke Width */}
                <div className="dial-group">
                  <div className="dial-group__header">
                    <span className="dial-group__label">Stroke Width</span>
                    <span className="dial-group__value">{foundryFrame.strokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    className="dial-slider"
                    min={0.5}
                    max={4}
                    step={0.5}
                    value={foundryFrame.strokeWidth}
                    onChange={(e) =>
                      onFoundryFrameChange({ strokeWidth: parseFloat(e.target.value) })
                    }
                  />
                </div>

                {/* Stroke Color */}
                <div className="dial-group">
                  <div className="dial-group__label">Stroke Color</div>
                  <div className="color-picker">
                    <div className="color-swatches">
                      {FRAME_STROKE_COLORS.map((c) => (
                        <button
                          key={c.name}
                          className={`color-swatch ${foundryFrame.strokeColor === c.value ? "active" : ""}`}
                          style={{ background: c.value }}
                          title={c.name}
                          onClick={() => onFoundryFrameChange({ strokeColor: c.value })}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Fill Color */}
                <div className="dial-group">
                  <div className="dial-group__label">Fill Color</div>
                  <div className="color-picker">
                    <div className="color-swatches">
                      {FRAME_FILL_COLORS.map((c) => (
                        <button
                          key={c.name}
                          className={`color-swatch ${foundryFrame.fillColor === c.value ? "active" : ""} ${c.name === "None" ? "color-swatch--none" : ""}`}
                          style={{ background: c.value === "transparent" ? undefined : c.value }}
                          title={c.name}
                          onClick={() => onFoundryFrameChange({ fillColor: c.value })}
                        >
                          {c.name === "None" && <span className="swatch-x">✕</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
              {foundryFrame.shape !== "none" && onCopyFramedCode && (
                <button
                  className="action-btn action-btn--full action-btn--secondary"
                  onClick={onCopyFramedCode}
                >
                  Copy Framed JSX
                </button>
              )}
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
        </ChamferedFrame>
      </div>
      {/* Assistant dock renders here, anchored to this panel */}
      {children}
    </aside>
  );
}

// Memoized export - prevents re-renders when parent changes but props don't
export const DialsPanel = memo(DialsPanelInner);
