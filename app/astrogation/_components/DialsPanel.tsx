"use client";

import { memo, useCallback, useMemo, useState, useRef, useEffect } from "react";
import { getComponentById, type PropDef } from "../catalog";
import { ChamferedFrame, type CornerToken } from "@thoughtform/ui";
import {
  BRAND_COLORS,
  BORDER_COLORS,
  NOTCH_ENABLED_COMPONENTS,
  NO_FRAME_CONTROLS_COMPONENTS,
} from "./types";
import { CornerSelector } from "./helpers";
import { NestedSelect } from "./NestedSelect";

// Helper to check if a shape is a notch type
function isNotchShape(shape: string): boolean {
  return shape?.startsWith("inspector") || false;
}

// Helper to check if a shape is a chamfer type
function isChamferShape(shape: string): boolean {
  return shape?.startsWith("cutCorners") || false;
}

// Helper to format label text: camelCase → TITLE CASE with spaces
function formatLabel(name: string): string {
  // Insert space before capital letters, then uppercase everything
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .toUpperCase();
}

// Fill colors for frame backgrounds
const FILL_COLORS = [
  { name: "None", value: "transparent" },
  { name: "Void 40%", value: "rgba(10, 9, 8, 0.4)" },
  { name: "Void 60%", value: "rgba(10, 9, 8, 0.6)" },
  { name: "Void 80%", value: "rgba(10, 9, 8, 0.8)" },
  { name: "Void", value: "#0a0908" },
  { name: "Gold 15%", value: "rgba(202, 165, 84, 0.15)" },
];

// Stroke colors
const STROKE_COLORS = [
  { name: "Gold 30%", value: "rgba(202, 165, 84, 0.3)" },
  { name: "Gold 50%", value: "rgba(202, 165, 84, 0.5)" },
  { name: "Gold", value: "#caa554" },
  { name: "Dawn 15%", value: "rgba(235, 227, 214, 0.15)" },
  { name: "Dawn 30%", value: "rgba(235, 227, 214, 0.30)" },
  { name: "Dawn", value: "#ebe3d6" },
];

// ═══════════════════════════════════════════════════════════════
// COLOR PICKER DROPDOWN (Figma-style)
// ═══════════════════════════════════════════════════════════════

interface ColorOption {
  name: string;
  value: string;
}

interface ColorPickerDropdownProps {
  value: string;
  options: readonly ColorOption[];
  onChange: (value: string) => void;
  supportsTransparent?: boolean;
}

function ColorPickerDropdown({
  value,
  options,
  onChange,
  supportsTransparent = false,
}: ColorPickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const isTransparent = value === "transparent";
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="color-picker-dropdown" ref={containerRef}>
      <button
        className="color-picker-dropdown__trigger"
        onClick={() => setIsOpen(!isOpen)}
        title={isTransparent ? "None / Transparent" : selectedOption?.name || "Select color"}
      >
        <span
          className={`color-picker-dropdown__preview ${isTransparent ? "color-picker-dropdown__preview--none" : ""}`}
          style={isTransparent ? undefined : { background: value }}
        >
          {isTransparent && <span className="color-picker-dropdown__x">✕</span>}
        </span>
      </button>

      {isOpen && (
        <div className="color-picker-dropdown__menu">
          {supportsTransparent && (
            <button
              className={`color-picker-dropdown__option ${isTransparent ? "active" : ""}`}
              onClick={() => {
                onChange("transparent");
                setIsOpen(false);
              }}
            >
              <span className="color-picker-dropdown__option-swatch color-picker-dropdown__option-swatch--none">
                <span className="color-picker-dropdown__x">✕</span>
              </span>
              <span className="color-picker-dropdown__option-label">None</span>
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt.name}
              className={`color-picker-dropdown__option ${value === opt.value ? "active" : ""}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span
                className="color-picker-dropdown__option-swatch"
                style={{ background: opt.value }}
              />
              <span className="color-picker-dropdown__option-label">{opt.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PROP CATEGORIZATION
// ═══════════════════════════════════════════════════════════════

// Group props by the new simplified categories
function categorizeProp(propName: string): string {
  const name = propName.toLowerCase();

  // Content props - text/labels that go in CONTENT section
  if (["label", "title", "text", "index", "placeholder", "name", "value"].includes(name)) {
    return "content";
  }

  // Style/variant props - also in CONTENT section
  if (["variant", "size", "accent", "accentcolor", "position", "orientation"].includes(name)) {
    return "content";
  }

  // Toggle/boolean props - also in CONTENT section (except notch/chamfer/corner controls)
  if (name.startsWith("show") || ["checked", "disabled"].includes(name)) {
    return "content";
  }

  // Dimension props - CONTENT section (but NOT notch dimensions)
  if (
    ["width", "height", "length", "tickcount", "min", "max", "step", "intensity"].includes(name)
  ) {
    return "content";
  }

  // Fill/background colors - FRAME section
  if (["backgroundcolor", "fillcolor"].includes(name)) {
    return "frame";
  }

  // Shape and notch props (for Panel component) - FRAME section (handled specially)
  if (["shape", "notchwidthpx", "notchheightpx"].includes(name)) {
    return "frame";
  }

  // Stroke/border props - STROKE section
  if (
    ["borderthickness", "bordercolor", "borderstyle", "strokecolor", "strokewidth"].includes(name)
  ) {
    return "stroke";
  }

  // Corner props - STROKE section (will be shown under Corner checkbox)
  if (["cornertoken", "cornerthickness", "cornercolor", "cornersize", "corners"].includes(name)) {
    return "corners";
  }

  return "content"; // Default to content
}

// ═══════════════════════════════════════════════════════════════
// DIALS PANEL
// ═══════════════════════════════════════════════════════════════

export interface DialsPanelProps {
  selectedComponentId: string | null;
  componentProps: Record<string, unknown>;
  onPropsChange: (props: Record<string, unknown>) => void;
  onComponentChange: (categoryId: string, componentKey: string) => void;
  onSavePreset: () => void;
  presetName: string;
  onPresetNameChange: (name: string) => void;
  canSave: boolean;
  children?: React.ReactNode;
}

function DialsPanelInner({
  selectedComponentId,
  componentProps,
  onPropsChange,
  onComponentChange,
  onSavePreset,
  presetName,
  onPresetNameChange,
  canSave,
  children,
}: DialsPanelProps) {
  const def = selectedComponentId ? getComponentById(selectedComponentId) : null;

  // Get the current category from the component definition
  const currentCategoryId = def?.category || null;

  // Check if this component supports various features
  const supportsNotch = useMemo(() => {
    return (
      selectedComponentId &&
      NOTCH_ENABLED_COMPONENTS.includes(
        selectedComponentId as (typeof NOTCH_ENABLED_COMPONENTS)[number]
      )
    );
  }, [selectedComponentId]);

  const supportsFrameControls = useMemo(() => {
    return (
      selectedComponentId &&
      !NO_FRAME_CONTROLS_COMPONENTS.includes(
        selectedComponentId as (typeof NO_FRAME_CONTROLS_COMPONENTS)[number]
      )
    );
  }, [selectedComponentId]);

  // Derive notch/chamfer state from the shape prop (for Panel component)
  const currentShape = (componentProps.shape as string) || "";
  const notchEnabled = isNotchShape(currentShape);
  const chamferEnabled = isChamferShape(currentShape);

  // Corner enabled state
  const cornerEnabled = componentProps.corners !== "none" && componentProps.corners !== undefined;

  const handlePropChange = useCallback(
    (propName: string, value: unknown) => {
      onPropsChange({ ...componentProps, [propName]: value });
    },
    [componentProps, onPropsChange]
  );

  const renderPropControl = (propDef: PropDef, value: unknown) => {
    const currentValue = value ?? propDef.default;

    switch (propDef.type) {
      case "string":
        return (
          <div className="dial-group">
            <div className="dial-group__label">{formatLabel(propDef.name)}</div>
            <input
              type="text"
              className="dial-input"
              value={currentValue as string}
              onChange={(e) => handlePropChange(propDef.name, e.target.value)}
            />
          </div>
        );

      case "number":
        return (
          <div className="dial-group">
            <div className="dial-group__header">
              <span className="dial-group__label">{formatLabel(propDef.name)}</span>
              <span className="dial-group__value">
                {currentValue as number}
                {propDef.name.toLowerCase().includes("thickness") ||
                propDef.name.toLowerCase().includes("width")
                  ? "px"
                  : ""}
              </span>
            </div>
            <input
              type="range"
              className="dial-slider"
              min={propDef.min ?? 0}
              max={propDef.max ?? 100}
              step={propDef.step ?? 1}
              value={currentValue as number}
              onChange={(e) => handlePropChange(propDef.name, parseFloat(e.target.value))}
            />
          </div>
        );

      case "boolean":
        return (
          <label className="dial-toggle">
            <input
              type="checkbox"
              checked={currentValue as boolean}
              onChange={(e) => handlePropChange(propDef.name, e.target.checked)}
            />
            <span>{formatLabel(propDef.name)}</span>
          </label>
        );

      case "select":
        return (
          <div className="dial-group">
            <div className="dial-group__label">{formatLabel(propDef.name)}</div>
            <select
              className="dial-select"
              value={currentValue as string}
              onChange={(e) => handlePropChange(propDef.name, e.target.value)}
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
        const isBorderColor =
          propDef.name.toLowerCase().includes("bordercolor") ||
          propDef.name.toLowerCase().includes("strokecolor");
        const colorOptions = isBorderColor ? BORDER_COLORS : BRAND_COLORS;

        return (
          <div className="dial-group dial-group--color">
            <div className="dial-group__label">{formatLabel(propDef.name)}</div>
            <ColorPickerDropdown
              value={currentColor}
              options={colorOptions}
              onChange={(v) => handlePropChange(propDef.name, v)}
              supportsTransparent={supportsTransparent}
            />
          </div>
        );
      }

      case "corners":
        // Corner selector - rendered separately in STROKE section
        return null;

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

  // Group props by category
  const groupedProps: Record<string, PropDef[]> = {
    content: [],
    frame: [],
    stroke: [],
    corners: [],
  };

  def.props.forEach((propDef) => {
    const category = categorizeProp(propDef.name);
    if (groupedProps[category]) {
      groupedProps[category].push(propDef);
    } else {
      groupedProps.content.push(propDef);
    }
  });

  // Find specific props for special handling
  const cornerTokenProp = groupedProps.corners.find(
    (p) => p.name.toLowerCase() === "corners" || p.name.toLowerCase() === "cornertoken"
  );
  const cornerColorProp = groupedProps.corners.find((p) => p.name.toLowerCase() === "cornercolor");
  const cornerThicknessProp = groupedProps.corners.find(
    (p) => p.name.toLowerCase() === "cornerthickness"
  );
  const cornerSizeProp = groupedProps.corners.find((p) => p.name.toLowerCase() === "cornersize");
  const fillColorProp = groupedProps.frame.find(
    (p) => p.name.toLowerCase() === "fillcolor" || p.name.toLowerCase() === "backgroundcolor"
  );
  const shapeProp = groupedProps.frame.find((p) => p.name.toLowerCase() === "shape");

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
            {/* ─── HEADER ─── */}
            <header className="spec-header">
              <p className="spec-header__desc">{def.description}</p>
            </header>

            {/* ═══════════════════════════════════════════════════════════════
                COMPONENT CLASS SECTION - Reassign to different category
                ═══════════════════════════════════════════════════════════════ */}
            <div className="spec-section">
              <div className="spec-section__label">
                <span className="spec-section__label-text">Component Class</span>
                <span className="spec-section__label-line" />
              </div>
              <NestedSelect
                categoryId={currentCategoryId}
                componentKey={selectedComponentId}
                onChange={(catId, compKey) => {
                  if (catId && compKey) {
                    onComponentChange(catId, compKey);
                  }
                }}
                placeholder="Select component..."
                className="spec-select--compact"
              />
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                CONTENT SECTION - Text, labels, toggles, dimensions
                ═══════════════════════════════════════════════════════════════ */}
            {groupedProps.content.length > 0 && (
              <div className="spec-section">
                <div className="spec-section__label">
                  <span className="spec-section__label-text">Content</span>
                  <span className="spec-section__label-line" />
                </div>
                <div className="dials-category__content">
                  {groupedProps.content.map((propDef) => (
                    <div key={propDef.name}>
                      {renderPropControl(propDef, componentProps[propDef.name])}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                FRAME SECTION - Fill, Notch, Chamfer
                Only shown for components that support frame controls
                ═══════════════════════════════════════════════════════════════ */}
            {supportsFrameControls && (
              <div className="spec-section">
                <div className="spec-section__label">
                  <span className="spec-section__label-text">Frame</span>
                  <span className="spec-section__label-line" />
                </div>
                <div className="dials-category__content">
                  {/* Fill Color */}
                  {fillColorProp &&
                    renderPropControl(fillColorProp, componentProps[fillColorProp.name])}

                  {/* If no fillColor prop exists but component supports frame, add a generic one */}
                  {!fillColorProp && (
                    <div className="dial-group dial-group--color">
                      <div className="dial-group__label">FILL COLOR</div>
                      <ColorPickerDropdown
                        value={(componentProps.fillColor as string) || "transparent"}
                        options={FILL_COLORS.filter((c) => c.name !== "None")}
                        onChange={(v) => handlePropChange("fillColor", v)}
                        supportsTransparent={true}
                      />
                    </div>
                  )}

                  {/* Shape selector for Panel - hidden, we use Notch/Chamfer toggles instead */}
                  {shapeProp && (
                    <div className="dial-group" style={{ display: "none" }}>
                      {renderPropControl(shapeProp, componentProps[shapeProp.name])}
                    </div>
                  )}

                  {/* Notch Toggle - only for notch-enabled components (Panel, Cards, Frame) */}
                  {supportsNotch && shapeProp && (
                    <>
                      <label className="dial-toggle">
                        <input
                          type="checkbox"
                          checked={notchEnabled}
                          onChange={(e) => {
                            // Toggle between notch and chamfer shapes
                            if (e.target.checked) {
                              handlePropChange("shape", "inspectorTicket");
                            } else {
                              handlePropChange("shape", "cutCornersSm");
                            }
                          }}
                        />
                        <span>NOTCH</span>
                      </label>

                      {/* Notch controls - shown when shape is a notch type */}
                      {notchEnabled && (
                        <div className="dial-group--nested">
                          <div className="dial-group">
                            <div className="dial-group__header">
                              <span className="dial-group__label">NOTCH WIDTH</span>
                              <span className="dial-group__value">
                                {(componentProps.notchWidthPx as number) ?? 220}px
                              </span>
                            </div>
                            <input
                              type="range"
                              className="dial-slider"
                              min={80}
                              max={320}
                              step={10}
                              value={(componentProps.notchWidthPx as number) ?? 220}
                              onChange={(e) =>
                                handlePropChange("notchWidthPx", parseInt(e.target.value))
                              }
                            />
                          </div>
                          <div className="dial-group">
                            <div className="dial-group__header">
                              <span className="dial-group__label">NOTCH HEIGHT</span>
                              <span className="dial-group__value">
                                {(componentProps.notchHeightPx as number) ?? 32}px
                              </span>
                            </div>
                            <input
                              type="range"
                              className="dial-slider"
                              min={16}
                              max={64}
                              step={4}
                              value={(componentProps.notchHeightPx as number) ?? 32}
                              onChange={(e) =>
                                handlePropChange("notchHeightPx", parseInt(e.target.value))
                              }
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Chamfer Toggle - only for components with shape prop */}
                  {supportsNotch && shapeProp && (
                    <>
                      <label className="dial-toggle">
                        <input
                          type="checkbox"
                          checked={chamferEnabled}
                          onChange={(e) => {
                            // Toggle between chamfer and notch shapes
                            if (e.target.checked) {
                              handlePropChange("shape", "cutCornersSm");
                            } else {
                              handlePropChange("shape", "inspectorTicket");
                            }
                          }}
                        />
                        <span>CHAMFER</span>
                      </label>

                      {/* Chamfer size selector - shown when shape is a chamfer type */}
                      {chamferEnabled && (
                        <div className="dial-group--nested">
                          <div className="dial-group">
                            <div className="dial-group__label">Size</div>
                            <select
                              className="dial-select"
                              value={currentShape}
                              onChange={(e) => handlePropChange("shape", e.target.value)}
                            >
                              <option value="cutCornersSm">Small</option>
                              <option value="cutCornersMd">Medium</option>
                              <option value="cutCornersTopRight">Top Right Only</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                STROKE SECTION - Border/stroke styling + Corners
                Only shown for components that support frame controls
                ═══════════════════════════════════════════════════════════════ */}
            {supportsFrameControls && (
              <div className="spec-section">
                <div className="spec-section__label">
                  <span className="spec-section__label-text">Stroke</span>
                  <span className="spec-section__label-line" />
                </div>
                <div className="dials-category__content">
                  {/* Render stroke props from the component */}
                  {groupedProps.stroke.map((propDef) => (
                    <div key={propDef.name}>
                      {renderPropControl(propDef, componentProps[propDef.name])}
                    </div>
                  ))}

                  {/* If no stroke props exist, add generic stroke width/color */}
                  {groupedProps.stroke.length === 0 && (
                    <>
                      <div className="dial-group">
                        <div className="dial-group__header">
                          <span className="dial-group__label">STROKE WIDTH</span>
                          <span className="dial-group__value">
                            {(componentProps.strokeWidth as number) ?? 1}px
                          </span>
                        </div>
                        <input
                          type="range"
                          className="dial-slider"
                          min={0.5}
                          max={4}
                          step={0.5}
                          value={(componentProps.strokeWidth as number) ?? 1}
                          onChange={(e) =>
                            handlePropChange("strokeWidth", parseFloat(e.target.value))
                          }
                        />
                      </div>
                      <div className="dial-group dial-group--color">
                        <div className="dial-group__label">STROKE COLOR</div>
                        <ColorPickerDropdown
                          value={
                            (componentProps.strokeColor as string) || "rgba(202, 165, 84, 0.3)"
                          }
                          options={STROKE_COLORS}
                          onChange={(v) => handlePropChange("strokeColor", v)}
                        />
                      </div>
                    </>
                  )}

                  {/* Corner Toggle - only if component has corner props */}
                  {(cornerTokenProp || cornerColorProp) && (
                    <>
                      <label className="dial-toggle">
                        <input
                          type="checkbox"
                          checked={cornerEnabled}
                          onChange={(e) => {
                            handlePropChange("cornerEnabled", e.target.checked);
                            // When disabling, set corners to none
                            if (!e.target.checked && cornerTokenProp) {
                              handlePropChange(cornerTokenProp.name, "none");
                            }
                          }}
                        />
                        <span>CORNERS</span>
                      </label>

                      {/* Corner controls - shown when enabled */}
                      {cornerEnabled && (
                        <div className="dial-group--nested">
                          {cornerTokenProp && (
                            <div className="dial-group dial-group--corners">
                              <CornerSelector
                                value={
                                  (componentProps[cornerTokenProp.name] as CornerToken) ?? "four"
                                }
                                onChange={(val) => handlePropChange(cornerTokenProp.name, val)}
                              />
                            </div>
                          )}
                          {cornerColorProp &&
                            renderPropControl(
                              cornerColorProp,
                              componentProps[cornerColorProp.name]
                            )}
                          {cornerThicknessProp &&
                            renderPropControl(
                              cornerThicknessProp,
                              componentProps[cornerThicknessProp.name]
                            )}
                          {cornerSizeProp &&
                            renderPropControl(cornerSizeProp, componentProps[cornerSizeProp.name])}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

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
