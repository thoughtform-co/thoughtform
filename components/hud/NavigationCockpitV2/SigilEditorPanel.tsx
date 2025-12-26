"use client";

import { useState, useCallback } from "react";
import { SIGIL_SHAPES, SIGIL_SHAPE_LABELS, type SigilShape } from "@/lib/sigil-geometries";
import { type SigilConfig, DEFAULT_SIGIL_SIZE } from "./SigilCanvas";
import { SigilCanvas } from "./SigilCanvas";

// ═══════════════════════════════════════════════════════════════════
// SIGIL EDITOR PANEL
// Admin-only panel for editing sigil configuration
// Similar to ParticleAdminPanel but for individual service card sigils
//
// Size Control:
// • Min: 100px (compact)
// • Default: 140px (standard)
// • Max: 280px (full bleed - fills card width minus padding)
//
// Full bleed means the sigil expands to fill the available container
// while staying contained (no particles escape the card frame).
// ═══════════════════════════════════════════════════════════════════

/** Minimum sigil size (compact) */
const MIN_SIGIL_SIZE = 100;
/** Maximum sigil size (full bleed within card) */
const MAX_SIGIL_SIZE = 280;

interface SigilEditorPanelProps {
  config: SigilConfig;
  onSave: (config: Partial<SigilConfig>) => void;
  onClose: () => void;
  cardIndex: number;
}

export function SigilEditorPanel({ config, onSave, onClose, cardIndex }: SigilEditorPanelProps) {
  const [localConfig, setLocalConfig] = useState<SigilConfig>({ ...config });

  const handleShapeChange = useCallback((shape: SigilShape) => {
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

  const handleSave = useCallback(() => {
    onSave(localConfig);
    onClose();
  }, [localConfig, onSave, onClose]);

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
    <div className="sigil-editor-panel">
      <div className="sigil-editor-panel__header">
        <h3 className="sigil-editor-panel__title">Edit Sigil: {cardLabels[cardIndex]}</h3>
        <button
          className="sigil-editor-panel__close"
          onClick={onClose}
          type="button"
          aria-label="Close editor"
        >
          ×
        </button>
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
            100px = compact · 140px = default · 280px = full bleed
          </div>
        </div>

        {/* Shape selector */}
        <div className="sigil-editor-panel__section">
          <label className="sigil-editor-panel__label">Shape</label>
          <div className="sigil-editor-panel__shape-grid">
            {SIGIL_SHAPES.map((shape) => (
              <button
                key={shape}
                className={`sigil-editor-panel__shape-btn ${localConfig.shape === shape ? "sigil-editor-panel__shape-btn--active" : ""}`}
                onClick={() => handleShapeChange(shape)}
                type="button"
                title={SIGIL_SHAPE_LABELS[shape]}
              >
                {SIGIL_SHAPE_LABELS[shape]}
              </button>
            ))}
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

      <div className="sigil-editor-panel__footer">
        <button
          className="sigil-editor-panel__btn sigil-editor-panel__btn--secondary"
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
        <button
          className="sigil-editor-panel__btn sigil-editor-panel__btn--primary"
          onClick={handleSave}
          type="button"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default SigilEditorPanel;
