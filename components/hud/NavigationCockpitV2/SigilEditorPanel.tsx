"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { resolveSigilShape, getSigilShapeOptions } from "@/lib/sigil-geometries";
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
// • Max: 750px (extended - allows large/full-bleed experiments)
//
// Shape Categories:
// • thoughtform: New 3D topological shapes
// • geometric: Basic geometric shapes with depth
//
// Render Modes:
// • sigil: 2D flat view (default)
// • landmark: 3D rotating view
//
// Features:
// • Presets: Load saved presets from Orrery
// • Auto-save: Changes are saved automatically (debounced 500ms)
// • Click outside to close: Clicking the backdrop dismisses the panel
// • Scroll containment: Scrolling inside panel doesn't scroll the page
// ═══════════════════════════════════════════════════════════════════

/** Minimum sigil size (compact) */
const MIN_SIGIL_SIZE = 80;
/** Maximum sigil size (extended) */
const MAX_SIGIL_SIZE = 750;
/** Position offset range (-50% to +50%) */
const MIN_OFFSET = -50;
const MAX_OFFSET = 50;
/** Seed range */
const MIN_SEED = 0;
const MAX_SEED = 9999;
/** Particle count range */
const MIN_PARTICLE_COUNT = 50;
const MAX_PARTICLE_COUNT = 2000;
/** Density range (particle square size multiplier) */
const MIN_DENSITY = 0.5;
const MAX_DENSITY = 2.5;
/** Debounce delay for auto-save (ms) */
const AUTO_SAVE_DELAY = 500;

/** Shape preset from Orrery */
interface ShapePreset {
  id: string;
  name: string;
  shapeId: string;
  seed: number;
  pointCount: number;
  density?: number;
  particleSize?: number;
  category: string;
}

/** Render mode for sigil */
export type SigilRenderMode = "sigil" | "landmark";

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

  // Presets state
  const [presets, setPresets] = useState<ShapePreset[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(true);
  const [presetsError, setPresetsError] = useState<string | null>(null);

  // Load presets from Orrery
  const loadPresets = useCallback(async () => {
    try {
      setPresetsLoading(true);
      setPresetsError(null);

      // Avoid stale/cached responses (browser/proxy/Next caching)
      const response = await fetch("/api/shape-presets", { cache: "no-store" });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `Failed to load presets (HTTP ${response.status})${text ? `: ${text}` : ""}`
        );
      }

      const data = await response.json();
      setPresets(Array.isArray(data.presets) ? data.presets : []);
    } catch (error) {
      console.error("Failed to load shape presets:", error);
      setPresets([]);
      setPresetsError(error instanceof Error ? error.message : "Failed to load presets");
    } finally {
      setPresetsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  // Get shape options grouped by category
  const shapeOptions = getSigilShapeOptions();
  const thoughtformShapes = shapeOptions.filter((s) => s.category === "thoughtform");
  const geometricShapes = shapeOptions.filter((s) => s.category === "geometric");
  const is3D = (localConfig.renderMode ?? "sigil") === "landmark";
  const effectiveSeed = localConfig.seed ?? 42 + cardIndex * 1000;
  const selectedShapeLabel =
    shapeOptions.find((s) => s.id === localConfig.shape)?.label ?? localConfig.shape;

  // Custom dropdown (native <select> can't be consistently themed across OS/browsers)
  const shapeDropdownRef = useRef<HTMLDivElement>(null);
  const [isShapeDropdownOpen, setIsShapeDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isShapeDropdownOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      const el = shapeDropdownRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) {
        setIsShapeDropdownOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isShapeDropdownOpen]);

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
    setLocalConfig((prev) => ({ ...prev, shape: resolveSigilShape(shape) }));
  }, []);

  const handleParticleCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= MIN_PARTICLE_COUNT && value <= MAX_PARTICLE_COUNT) {
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

  const handleDensityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!Number.isNaN(value) && value >= MIN_DENSITY && value <= MAX_DENSITY) {
      setLocalConfig((prev) => ({
        ...prev,
        animationParams: { ...prev.animationParams, density: value },
      }));
    }
  }, []);

  const handleSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= MIN_SIGIL_SIZE && value <= MAX_SIGIL_SIZE) {
      setLocalConfig((prev) => ({ ...prev, size: value }));
    }
  }, []);

  const handleSeedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!Number.isNaN(value) && value >= MIN_SEED && value <= MAX_SEED) {
      setLocalConfig((prev) => ({ ...prev, seed: value }));
    }
  }, []);

  const handleRandomSeed = useCallback(() => {
    const next = Math.floor(Math.random() * (MAX_SEED + 1));
    setLocalConfig((prev) => ({ ...prev, seed: next }));
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

  // Apply a preset from Orrery
  const handleApplyPreset = useCallback((preset: ShapePreset) => {
    setLocalConfig((prev) => ({
      ...prev,
      shape: resolveSigilShape(preset.shapeId),
      particleCount: preset.pointCount,
      seed: preset.seed,
      animationParams: {
        ...prev.animationParams,
        ...(preset.density !== undefined && { density: preset.density }),
      },
    }));
  }, []);

  // 3D toggle: landmark = 3D rotating, sigil = 2D flat
  const handle3DToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked;
    setLocalConfig((prev) => ({
      ...prev,
      renderMode: enabled ? "landmark" : "sigil",
    }));
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
  const backdropPositionClass =
    cardIndex === 1
      ? "sigil-editor-panel__backdrop--right"
      : cardIndex === 2
        ? "sigil-editor-panel__backdrop--left"
        : "sigil-editor-panel__backdrop--center";

  return (
    // Backdrop: click outside to close
    <div
      className={`sigil-editor-panel__backdrop ${backdropPositionClass}`}
      onClick={handleBackdropClick}
    >
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
          <div className="sigil-editor-panel__section sigil-editor-panel__section--sticky-preview">
            <div className="sigil-editor-panel__label-row">
              <span className="sigil-editor-panel__label">Preview</span>
              <label className="sigil-editor-panel__toggle" title="Enable 3D rotating view">
                <input type="checkbox" checked={is3D} onChange={handle3DToggle} />
                <span className="sigil-editor-panel__toggle-text">3D</span>
              </label>
            </div>
            <div className="sigil-editor-panel__preview">
              <SigilCanvas
                config={localConfig}
                size={Math.min(localConfig.size ?? DEFAULT_SIGIL_SIZE, 160)}
                seed={effectiveSeed}
                allowSpill={false}
              />
            </div>
          </div>

          {/* Orrery Presets */}
          <div className="sigil-editor-panel__section">
            <div className="sigil-editor-panel__label-row">
              <span className="sigil-editor-panel__label">
                Orrery Presets
                {presetsLoading && (
                  <span className="sigil-editor-panel__loading"> (loading...)</span>
                )}
              </span>
              <button
                type="button"
                className="sigil-editor-panel__reload-btn"
                onClick={loadPresets}
                disabled={presetsLoading}
                title="Reload presets"
                aria-label="Reload presets"
              >
                Reload
              </button>
            </div>
            {presetsError ? (
              <div className="sigil-editor-panel__error">{presetsError}</div>
            ) : presets.length === 0 && !presetsLoading ? (
              <div className="sigil-editor-panel__hint">
                No presets saved. Visit{" "}
                <a
                  href="/orrery"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sigil-editor-panel__link"
                >
                  Orrery
                </a>{" "}
                to create presets.
              </div>
            ) : (
              <div className="sigil-editor-panel__presets-grid">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="sigil-editor-panel__preset-btn"
                    onClick={() => handleApplyPreset(preset)}
                    title={`${preset.shapeId} · ${preset.pointCount} particles`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Shape + Seed (variation) */}
          <div className="sigil-editor-panel__section">
            <label className="sigil-editor-panel__label">Shape</label>
            <div className="sigil-editor-panel__select-wrap" ref={shapeDropdownRef}>
              <button
                type="button"
                className={`sigil-editor-panel__select ${isShapeDropdownOpen ? "sigil-editor-panel__select--open" : ""}`}
                onClick={() => setIsShapeDropdownOpen((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={isShapeDropdownOpen}
                aria-label="Select shape"
              >
                <span className="sigil-editor-panel__select-value">{selectedShapeLabel}</span>
                <span className="sigil-editor-panel__select-caret" aria-hidden="true">
                  ▾
                </span>
              </button>

              {isShapeDropdownOpen && (
                <div
                  className="sigil-editor-panel__select-menu"
                  role="listbox"
                  aria-label="Shape options"
                >
                  <div className="sigil-editor-panel__select-group-label">Thoughtform</div>
                  {thoughtformShapes.map((shape) => {
                    const selected = localConfig.shape === shape.id;
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={`sigil-editor-panel__select-option ${selected ? "sigil-editor-panel__select-option--selected" : ""}`}
                        onClick={() => {
                          handleShapeChange(shape.id);
                          setIsShapeDropdownOpen(false);
                        }}
                      >
                        {shape.label}
                      </button>
                    );
                  })}

                  <div className="sigil-editor-panel__select-divider" />
                  <div className="sigil-editor-panel__select-group-label">Geometric</div>
                  {geometricShapes.map((shape) => {
                    const selected = localConfig.shape === shape.id;
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        className={`sigil-editor-panel__select-option ${selected ? "sigil-editor-panel__select-option--selected" : ""}`}
                        onClick={() => {
                          handleShapeChange(shape.id);
                          setIsShapeDropdownOpen(false);
                        }}
                      >
                        {shape.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="sigil-editor-panel__param-row">
              <span className="sigil-editor-panel__param-label">Seed:</span>
              <input
                type="range"
                min={MIN_SEED}
                max={MAX_SEED}
                step="1"
                value={effectiveSeed}
                onChange={handleSeedChange}
                className="sigil-editor-panel__slider sigil-editor-panel__slider--small"
              />
              <span className="sigil-editor-panel__param-value">{effectiveSeed}</span>
              <button
                type="button"
                className="sigil-editor-panel__mini-btn"
                onClick={handleRandomSeed}
                title="Randomize seed"
              >
                Random
              </button>
            </div>
          </div>

          {/* Particles */}
          <div className="sigil-editor-panel__section">
            <label className="sigil-editor-panel__label">Particles</label>

            <div className="sigil-editor-panel__param-row">
              <span className="sigil-editor-panel__param-label">Size:</span>
              <input
                type="range"
                min={MIN_SIGIL_SIZE}
                max={MAX_SIGIL_SIZE}
                step="10"
                value={localConfig.size ?? DEFAULT_SIGIL_SIZE}
                onChange={handleSizeChange}
                className="sigil-editor-panel__slider sigil-editor-panel__slider--small"
              />
              <span className="sigil-editor-panel__param-value">
                {localConfig.size ?? DEFAULT_SIGIL_SIZE}px
              </span>
            </div>

            <div className="sigil-editor-panel__param-row">
              <span className="sigil-editor-panel__param-label">Count:</span>
              <input
                type="range"
                min={MIN_PARTICLE_COUNT}
                max={MAX_PARTICLE_COUNT}
                step="25"
                value={localConfig.particleCount}
                onChange={handleParticleCountChange}
                className="sigil-editor-panel__slider sigil-editor-panel__slider--small"
              />
              <span className="sigil-editor-panel__param-value">{localConfig.particleCount}</span>
            </div>

            <div className="sigil-editor-panel__param-row">
              <span className="sigil-editor-panel__param-label">Density:</span>
              <input
                type="range"
                min={MIN_DENSITY}
                max={MAX_DENSITY}
                step="0.05"
                value={localConfig.animationParams.density ?? 1}
                onChange={handleDensityChange}
                className="sigil-editor-panel__slider sigil-editor-panel__slider--small"
              />
              <span className="sigil-editor-panel__param-value">
                {(localConfig.animationParams.density ?? 1).toFixed(2)}
              </span>
            </div>

            <div className="sigil-editor-panel__hint">
              Density controls particle square size (visual “fill”), not count.
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
