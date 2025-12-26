"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  SIGIL_SHAPES,
  SIGIL_SHAPE_LABELS,
  resolveSigilShape,
  getSigilShapeOptions,
} from "@/lib/sigil-geometries";
import { type SigilConfig, DEFAULT_SIGIL_SIZE } from "./SigilCanvas";
import { SigilCanvas } from "./SigilCanvas";

// ═══════════════════════════════════════════════════════════════════
// SIGIL EDITOR PANEL
// Admin-only panel for editing sigil configuration
// Now supports new Thoughtform shapes with 3D depth
//
// Size Control:
// • Min: 80px (compact)
// • Default: 140px (standard)
// • Max: 400px (full bleed - fills card width minus padding)
//
// Shape Categories:
// • thoughtform: New 3D topological shapes
// • geometric: Basic geometric shapes with depth
//
// UX Improvements:
// • Auto-save: Changes are saved automatically (debounced 500ms)
// • Click outside to close: Clicking the backdrop dismisses the panel
// • Scroll containment: Scrolling inside panel doesn't scroll the page
// ═══════════════════════════════════════════════════════════════════

/** Minimum sigil size (compact) */
const MIN_SIGIL_SIZE = 80;
/** Maximum sigil size (full bleed within card) */
const MAX_SIGIL_SIZE = 400;
/** Position offset range (-50% to +50%) */
const MIN_OFFSET = -50;
const MAX_OFFSET = 50;
/** Debounce delay for auto-save (ms) */
const AUTO_SAVE_DELAY = 500;

interface SigilEditorPanelProps {
  config: SigilConfig;
  onSave: (config: Partial<SigilConfig>) => void;
  onClose: () => void;
  cardIndex: number;
}

export function SigilEditorPanel({ config, onSave, onClose, cardIndex }: SigilEditorPanelProps) {
  // Resolve legacy shapes to new ones
  const resolvedShape = resolveSigilShape(config.shape);
  const [localConfig, setLocalConfig] = useState<SigilConfig>({
    ...config,
    shape: resolvedShape, // Use resolved shape
  });
  const isFirstRender = useRef(true);

  // Get shape options grouped by category
  const shapeOptions = getSigilShapeOptions();
  const thoughtformShapes = shapeOptions.filter((s) => s.category === "thoughtform");
  const geometricShapes = shapeOptions.filter((s) => s.category === "geometric");

  // ─────────────────────────────────────────────────────────────────
  // AUTO-SAVE: Debounced save when config changes
  // Skips first render to avoid saving initial values
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      onSave(localConfig);
    }, AUTO_SAVE_DELAY);

    return () => clearTimeout(timer);
  }, [localConfig, onSave]);

  // ─────────────────────────────────────────────────────────────────
  // SCROLL CONTAINMENT: Prevent scroll from propagating to page
  // Always stop propagation so page doesn't scroll when hovering panel
  // ─────────────────────────────────────────────────────────────────
  const handlePanelWheel = useCallback((e: React.WheelEvent) => {
    // Stop the event from reaching the page
    e.stopPropagation();
  }, []);

  const handleShapeChange = useCallback((shape: string) => {
    setLocalConfig((prev) => ({ ...prev, shape }));
  }, []);

  const handleParticleCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 50 && value <= 500) {
      setLocalConfig((prev) => ({ ...prev, particleCount: value }));
    }
  }, []);

  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert hex to RGB
    const hex = e.target.value;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    setLocalConfig((prev) => ({ ...prev, color: `${r}, ${g}, ${b}` }));
  }, []);

  const handleDriftChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setLocalConfig((prev) => ({
      ...prev,
      animationParams: { ...prev.animationParams, drift: value },
    }));
  }, []);

  const handlePulseChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setLocalConfig((prev) => ({
      ...prev,
      animationParams: { ...prev.animationParams, pulse: value },
    }));
  }, []);

  const handleGlitchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setLocalConfig((prev) => ({
      ...prev,
      animationParams: { ...prev.animationParams, glitch: value },
    }));
  }, []);

  const handleSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= MIN_SIGIL_SIZE && value <= MAX_SIGIL_SIZE) {
      setLocalConfig((prev) => ({ ...prev, size: value }));
    }
  }, []);

  const handleOffsetXChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= MIN_OFFSET && value <= MAX_OFFSET) {
      setLocalConfig((prev) => ({ ...prev, offsetX: value }));
    }
  }, []);

  const handleOffsetYChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= MIN_OFFSET && value <= MAX_OFFSET) {
      setLocalConfig((prev) => ({ ...prev, offsetY: value }));
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // CLICK OUTSIDE TO CLOSE: Handle backdrop clicks
  // ─────────────────────────────────────────────────────────────────
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      // Only close if clicking the backdrop itself, not the panel
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Convert RGB string to hex for color picker
  const colorHex = (() => {
    const parts = localConfig.color.split(",").map((s) => parseInt(s.trim(), 10));
    if (parts.length === 3) {
      return `#${parts.map((p) => p.toString(16).padStart(2, "0")).join("")}`;
    }
    return "#caa554"; // Default Tensor Gold
  })();

  const cardLabels = ["Left (Inspire)", "Center (Practice)", "Right (Transform)"];

  return (
    // Backdrop: click outside to close
    <div className="sigil-editor-panel__backdrop" onClick={handleBackdropClick}>
      <div
        className="sigil-editor-panel"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside panel from closing
        onWheel={handlePanelWheel} // Prevent scroll from propagating to page
      >
        <div className="sigil-editor-panel__header">
          <h3 className="sigil-editor-panel__title">Edit Sigil: {cardLabels[cardIndex]}</h3>
          <span className="sigil-editor-panel__autosave">Auto-saving</span>
        </div>

        <div className="sigil-editor-panel__content">
          {/* Live Preview */}
          <div className="sigil-editor-panel__section">
            <label className="sigil-editor-panel__label">Preview</label>
            <div className="sigil-editor-panel__preview">
              <SigilCanvas
                config={localConfig}
                size={Math.min(localConfig.size ?? DEFAULT_SIGIL_SIZE, 160)}
                seed={42 + cardIndex * 1000}
                allowSpill={false}
              />
            </div>
          </div>

          {/* Size slider - Full Bleed Control */}
          <div className="sigil-editor-panel__section">
            <label className="sigil-editor-panel__label">
              Size: {localConfig.size ?? DEFAULT_SIGIL_SIZE}px
              {(localConfig.size ?? DEFAULT_SIGIL_SIZE) >= 240 && (
                <span className="sigil-editor-panel__badge">Full Bleed</span>
              )}
            </label>
            <input
              type="range"
              min={MIN_SIGIL_SIZE}
              max={MAX_SIGIL_SIZE}
              step="10"
              value={localConfig.size ?? DEFAULT_SIGIL_SIZE}
              onChange={handleSizeChange}
              className="sigil-editor-panel__slider"
            />
            <div className="sigil-editor-panel__hint">
              80px = compact · 140px = default · 400px = maximum
            </div>
          </div>

          {/* Position controls */}
          <div className="sigil-editor-panel__section">
            <label className="sigil-editor-panel__label">Position</label>

            <div className="sigil-editor-panel__param-row">
              <span className="sigil-editor-panel__param-label">X:</span>
              <input
                type="range"
                min={MIN_OFFSET}
                max={MAX_OFFSET}
                step="5"
                value={localConfig.offsetX ?? 0}
                onChange={handleOffsetXChange}
                className="sigil-editor-panel__slider sigil-editor-panel__slider--small"
              />
              <span className="sigil-editor-panel__param-value">{localConfig.offsetX ?? 0}%</span>
            </div>

            <div className="sigil-editor-panel__param-row">
              <span className="sigil-editor-panel__param-label">Y:</span>
              <input
                type="range"
                min={MIN_OFFSET}
                max={MAX_OFFSET}
                step="5"
                value={localConfig.offsetY ?? 0}
                onChange={handleOffsetYChange}
                className="sigil-editor-panel__slider sigil-editor-panel__slider--small"
              />
              <span className="sigil-editor-panel__param-value">{localConfig.offsetY ?? 0}%</span>
            </div>

            <div className="sigil-editor-panel__hint">
              0% = centered · negative = left/up · positive = right/down
            </div>
          </div>

          {/* Shape selector - organized by category */}
          <div className="sigil-editor-panel__section">
            <label className="sigil-editor-panel__label">Shape</label>

            {/* Thoughtform shapes (new, 3D) */}
            <div className="sigil-editor-panel__shape-category">
              <span className="sigil-editor-panel__shape-category-label">Thoughtform</span>
              <div className="sigil-editor-panel__shape-grid">
                {thoughtformShapes.map((shape) => (
                  <button
                    key={shape.id}
                    className={`sigil-editor-panel__shape-btn ${localConfig.shape === shape.id ? "sigil-editor-panel__shape-btn--active" : ""}`}
                    onClick={() => handleShapeChange(shape.id)}
                    type="button"
                    title={shape.label}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Geometric shapes */}
            <div className="sigil-editor-panel__shape-category">
              <span className="sigil-editor-panel__shape-category-label">Geometric</span>
              <div className="sigil-editor-panel__shape-grid">
                {geometricShapes.map((shape) => (
                  <button
                    key={shape.id}
                    className={`sigil-editor-panel__shape-btn ${localConfig.shape === shape.id ? "sigil-editor-panel__shape-btn--active" : ""}`}
                    onClick={() => handleShapeChange(shape.id)}
                    type="button"
                    title={shape.label}
                  >
                    {shape.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Particle count slider */}
          <div className="sigil-editor-panel__section">
            <label className="sigil-editor-panel__label">
              Particle Count: {localConfig.particleCount}
            </label>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={localConfig.particleCount}
              onChange={handleParticleCountChange}
              className="sigil-editor-panel__slider"
            />
          </div>

          {/* Color picker */}
          <div className="sigil-editor-panel__section">
            <label className="sigil-editor-panel__label">Color</label>
            <div className="sigil-editor-panel__color-row">
              <input
                type="color"
                value={colorHex}
                onChange={handleColorChange}
                className="sigil-editor-panel__color-picker"
              />
              <span className="sigil-editor-panel__color-value">RGB({localConfig.color})</span>
            </div>
          </div>

          {/* Animation params */}
          <div className="sigil-editor-panel__section">
            <label className="sigil-editor-panel__label">Animation</label>

            <div className="sigil-editor-panel__param-row">
              <span className="sigil-editor-panel__param-label">Drift:</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={localConfig.animationParams.drift ?? 1}
                onChange={handleDriftChange}
                className="sigil-editor-panel__slider sigil-editor-panel__slider--small"
              />
              <span className="sigil-editor-panel__param-value">
                {(localConfig.animationParams.drift ?? 1).toFixed(1)}
              </span>
            </div>

            <div className="sigil-editor-panel__param-row">
              <span className="sigil-editor-panel__param-label">Pulse:</span>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={localConfig.animationParams.pulse ?? 1}
                onChange={handlePulseChange}
                className="sigil-editor-panel__slider sigil-editor-panel__slider--small"
              />
              <span className="sigil-editor-panel__param-value">
                {(localConfig.animationParams.pulse ?? 1).toFixed(1)}
              </span>
            </div>

            <div className="sigil-editor-panel__param-row">
              <span className="sigil-editor-panel__param-label">Glitch:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localConfig.animationParams.glitch ?? 0.1}
                onChange={handleGlitchChange}
                className="sigil-editor-panel__slider sigil-editor-panel__slider--small"
              />
              <span className="sigil-editor-panel__param-value">
                {(localConfig.animationParams.glitch ?? 0.1).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SigilEditorPanel;
