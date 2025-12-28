"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import {
  KeyVisualOverlayPortal,
  type KeyVisualOverlayConfig,
  DEFAULT_OVERLAY_CONFIG,
} from "@/components/hud/KeyVisualOverlayPortal";
import {
  sampleLayeredParticles,
  type LayeredParticleData,
  type LayerKind,
  DEFAULT_ART_DIRECTION,
  DEFAULT_LAYER_CONFIG,
} from "@/lib/key-visual/layered-sampler";
import {
  encodeTFPC,
  downloadTFPC,
  formatFileSize,
  estimateTFPCSize,
} from "@/lib/key-visual/baked-pointcloud";
import { useAuth } from "@/components/auth/AuthProvider";

// ═══════════════════════════════════════════════════════════════
// GATEWAY LAB TAB - STAGED WORKFLOW
//
// Stage 1: Upload images (no particles yet)
// Stage 2: Click "Generate Preview" for low-count preview
// Stage 3: Refine parameters and regenerate
// Stage 4: Bake high-quality final version
// ═══════════════════════════════════════════════════════════════

type WorkflowStage = "upload" | "preview" | "refine" | "bake";

// Preset gateway configurations
interface GatewayPreset {
  id: string;
  name: string;
  imageSrc: string;
  depthMapSrc?: string;
  config: Partial<KeyVisualOverlayConfig>;
}

const GATEWAY_PRESETS: GatewayPreset[] = [
  {
    id: "thoughtform-1",
    name: "Thoughtform Gateway I",
    imageSrc: "/images/gateway/thoughtform-gateway-1.png",
    depthMapSrc: "/images/gateway/thoughtform-gateway-1-depth.png",
    config: {
      scale: 2.5,
      maxParticles: 50000,
      particleSize: 1.0,
      artDirection: {
        ...DEFAULT_ART_DIRECTION,
        depthScale: 1.2,
      },
    },
  },
];

// Initial preview uses fewer particles for speed
const PREVIEW_MAX_PARTICLES = 10000;
const PREVIEW_SAMPLE_STEP = 4;

// Image Uploader Component
function ImageUploader({
  label,
  description,
  onUpload,
  currentSrc,
  previewSize = 120,
}: {
  label: string;
  description?: string;
  onUpload: (dataUrl: string) => void;
  currentSrc?: string;
  previewSize?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (currentSrc) {
      setPreview(currentSrc);
      // Get dimensions
      const img = new Image();
      img.onload = () => setDimensions({ w: img.width, h: img.height });
      img.src = currentSrc;
    }
  }, [currentSrc]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreview(dataUrl);
      // Get dimensions
      const img = new Image();
      img.onload = () => {
        setDimensions({ w: img.width, h: img.height });
        onUpload(dataUrl);
        setIsLoading(false);
      };
      img.onerror = () => {
        onUpload(dataUrl);
        setIsLoading(false);
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      console.error("Failed to read file");
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="gateway-lab__uploader">
      <div className="gateway-lab__uploader-header">
        <label className="gateway-lab__uploader-label">{label}</label>
        {description && <span className="gateway-lab__uploader-desc">{description}</span>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <div className="gateway-lab__uploader-content">
        {preview ? (
          <div className="gateway-lab__preview-container">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="gateway-lab__preview-image"
              style={{ width: previewSize, height: previewSize, objectFit: "contain" }}
            />
            <div className="gateway-lab__preview-info">
              {dimensions && (
                <span className="gateway-lab__preview-dims">
                  {dimensions.w}×{dimensions.h}
                </span>
              )}
              <button
                className="gateway-lab__preview-change"
                onClick={() => inputRef.current?.click()}
                disabled={isLoading}
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
            className="gateway-lab__upload-btn"
          >
            {isLoading ? "Processing..." : "↑ Upload"}
          </button>
        )}
      </div>
    </div>
  );
}

// Slider Control Component
function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix = "",
  disabled = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <div className={`gateway-lab__slider ${disabled ? "disabled" : ""}`}>
      <div className="gateway-lab__slider-header">
        <label>{label}</label>
        <span className="gateway-lab__slider-value">
          {value.toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="shape-lab__slider"
        disabled={disabled}
      />
    </div>
  );
}

// Toggle Control Component
function ToggleControl({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={`gateway-lab__toggle ${disabled ? "disabled" : ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span>{label}</span>
    </label>
  );
}

// Layer Controls Component
function LayerControls({
  layerKind,
  config,
  onChange,
  disabled = false,
}: {
  layerKind: LayerKind;
  config: KeyVisualOverlayConfig["layers"][LayerKind];
  onChange: (updates: Partial<KeyVisualOverlayConfig["layers"][LayerKind]>) => void;
  disabled?: boolean;
}) {
  const displayName = layerKind.charAt(0).toUpperCase() + layerKind.slice(1);

  return (
    <div className={`gateway-lab__layer ${config.enabled ? "" : "disabled"}`}>
      <div className="gateway-lab__layer-header">
        <ToggleControl
          label={displayName}
          checked={config.enabled}
          onChange={(enabled) => onChange({ enabled })}
          disabled={disabled}
        />
      </div>

      {config.enabled && (
        <div className="gateway-lab__layer-controls">
          <SliderControl
            label="Density"
            value={config.density}
            min={0}
            max={1}
            step={0.05}
            onChange={(density) => onChange({ density })}
            suffix="%"
            disabled={disabled}
          />
          <SliderControl
            label="Opacity"
            value={config.opacityMultiplier}
            min={0}
            max={1.5}
            step={0.05}
            onChange={(opacityMultiplier) => onChange({ opacityMultiplier })}
            suffix="x"
            disabled={disabled}
          />
          <SliderControl
            label="Size"
            value={config.sizeMultiplier}
            min={0.2}
            max={3}
            step={0.1}
            onChange={(sizeMultiplier) => onChange({ sizeMultiplier })}
            suffix="x"
            disabled={disabled}
          />
          <div className="gateway-lab__color-mode">
            <span>Color:</span>
            <button
              className={config.colorMode === "image" ? "active" : ""}
              onClick={() => onChange({ colorMode: "image" })}
              disabled={disabled}
            >
              Image
            </button>
            <button
              className={config.colorMode === "tint" ? "active" : ""}
              onClick={() => onChange({ colorMode: "tint" })}
              disabled={disabled}
            >
              Tint
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Empty State for Preview Panel
function EmptyPreviewState({
  stage,
  hasImage,
  hasDepth,
}: {
  stage: WorkflowStage;
  hasImage: boolean;
  hasDepth: boolean;
}) {
  return (
    <div className="gateway-lab__empty-state">
      <div className="gateway-lab__empty-icon">◉</div>

      {stage === "upload" && !hasImage && (
        <>
          <h3>Step 1: Upload Images</h3>
          <p>Upload your key visual to begin. Add a depth map for 3D particle positioning.</p>
          <div className="gateway-lab__workflow-steps">
            <div className={`gateway-lab__workflow-step ${hasImage ? "done" : "active"}`}>
              <span className="gateway-lab__step-number">1</span>
              <span>Upload key visual</span>
            </div>
            <div className={`gateway-lab__workflow-step ${hasDepth ? "done" : ""}`}>
              <span className="gateway-lab__step-number">2</span>
              <span>Add depth map (optional)</span>
            </div>
            <div className="gateway-lab__workflow-step">
              <span className="gateway-lab__step-number">3</span>
              <span>Generate preview</span>
            </div>
            <div className="gateway-lab__workflow-step">
              <span className="gateway-lab__step-number">4</span>
              <span>Refine & bake</span>
            </div>
          </div>
        </>
      )}

      {stage === "upload" && hasImage && (
        <>
          <h3>Step 2: Generate Preview</h3>
          <p>
            Click &ldquo;Generate Preview&rdquo; to create a quick particle preview (10K particles).
          </p>
          <p className="gateway-lab__empty-tip">
            {hasDepth
              ? "✓ Depth map loaded - particles will have 3D positioning"
              : "No depth map - particles will be flat (2D)"}
          </p>
        </>
      )}
    </div>
  );
}

// Three.js Scene Component - Only renders when we have generated data
function GatewayScene({
  config,
  particleData,
  scrollProgress,
  showStats,
}: {
  config: KeyVisualOverlayConfig;
  particleData: LayeredParticleData | null;
  scrollProgress: number;
  showStats: boolean;
}) {
  // Don't render anything if no particle data
  if (!particleData) {
    return null;
  }

  return (
    <>
      {showStats && <Stats />}
      <ambientLight intensity={0.5} />
      <KeyVisualOverlayPortal
        config={config}
        scrollProgress={scrollProgress}
        visible={true}
        preloadedData={particleData}
      />
      <OrbitControls
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={10}
      />
    </>
  );
}

// Main Gateway Lab Tab Component
export default function GatewayLabTab() {
  const { user } = useAuth();
  const isAdmin = !!user;

  // Workflow stage
  const [stage, setStage] = useState<WorkflowStage>("upload");

  // Source images (separate from config to avoid triggering renders)
  const [imageSrc, setImageSrc] = useState<string>("");
  const [depthMapSrc, setDepthMapSrc] = useState<string>("");

  // Config for rendering (only used after generation)
  const [config, setConfig] = useState<KeyVisualOverlayConfig>({
    ...DEFAULT_OVERLAY_CONFIG,
    mode: "dynamic",
    maxParticles: PREVIEW_MAX_PARTICLES,
    sampleStep: PREVIEW_SAMPLE_STEP,
    sigilMode: false,
    sigilGridSize: 3.0,
  });

  // Generated particle data (pre-sampled)
  const [particleData, setParticleData] = useState<LayeredParticleData | null>(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Baking state
  const [isBaking, setIsBaking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [bakedData, setBakedData] = useState<LayeredParticleData | null>(null);
  const [bakeError, setBakeError] = useState<string | null>(null);

  const handleConfigChange = useCallback((updates: Partial<KeyVisualOverlayConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setActivePreset(null);
  }, []);

  const handleArtDirectionChange = useCallback(
    (updates: Partial<KeyVisualOverlayConfig["artDirection"]>) => {
      setConfig((prev) => ({
        ...prev,
        artDirection: { ...prev.artDirection, ...updates },
      }));
      setActivePreset(null);
    },
    []
  );

  const handleLayerChange = useCallback(
    (layerKind: LayerKind, updates: Partial<KeyVisualOverlayConfig["layers"][LayerKind]>) => {
      setConfig((prev) => ({
        ...prev,
        layers: {
          ...prev.layers,
          [layerKind]: { ...prev.layers[layerKind], ...updates },
        },
      }));
      setActivePreset(null);
    },
    []
  );

  const loadPreset = useCallback((preset: GatewayPreset) => {
    setImageSrc(preset.imageSrc);
    setDepthMapSrc(preset.depthMapSrc || "");
    setConfig({
      ...DEFAULT_OVERLAY_CONFIG,
      mode: "dynamic",
      maxParticles: PREVIEW_MAX_PARTICLES,
      sampleStep: PREVIEW_SAMPLE_STEP,
      ...preset.config,
      artDirection: {
        ...DEFAULT_ART_DIRECTION,
        ...preset.config.artDirection,
      },
      layers: {
        contour: { ...DEFAULT_OVERLAY_CONFIG.layers.contour, ...preset.config.layers?.contour },
        fill: { ...DEFAULT_OVERLAY_CONFIG.layers.fill, ...preset.config.layers?.fill },
        highlight: {
          ...DEFAULT_OVERLAY_CONFIG.layers.highlight,
          ...preset.config.layers?.highlight,
        },
      },
    });
    setActivePreset(preset.id);
    setParticleData(null);
    setBakedData(null);
    setStage("upload");
  }, []);

  // Generate preview particles (quick, low count)
  const handleGeneratePreview = useCallback(async () => {
    if (!imageSrc) return;

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress("Loading images...");

    try {
      // Small delay to let UI update
      await new Promise((r) => setTimeout(r, 50));

      setGenerationProgress("Sampling pixels...");
      await new Promise((r) => setTimeout(r, 50));

      const data = await sampleLayeredParticles(imageSrc, depthMapSrc || null, {
        maxParticles: config.maxParticles,
        sampleStep: config.sampleStep,
        artDirection: config.artDirection,
        layers: {
          contour: config.layers.contour,
          fill: config.layers.fill,
          highlight: config.layers.highlight,
        },
      });

      setGenerationProgress("Rendering...");
      await new Promise((r) => setTimeout(r, 50));

      setParticleData(data);
      setStage("refine");
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : "Failed to generate particles");
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  }, [imageSrc, depthMapSrc, config]);

  // Regenerate with current settings (used after parameter changes)
  const handleRegenerate = useCallback(async () => {
    if (!imageSrc) return;

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress("Regenerating...");

    try {
      await new Promise((r) => setTimeout(r, 50));

      const data = await sampleLayeredParticles(imageSrc, depthMapSrc || null, {
        maxParticles: config.maxParticles,
        sampleStep: config.sampleStep,
        artDirection: config.artDirection,
        layers: {
          contour: config.layers.contour,
          fill: config.layers.fill,
          highlight: config.layers.highlight,
        },
      });

      setParticleData(data);
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : "Failed to regenerate");
    } finally {
      setIsGenerating(false);
      setGenerationProgress("");
    }
  }, [imageSrc, depthMapSrc, config]);

  // Bake particles to TFPC format (full quality)
  const handleBake = useCallback(async () => {
    if (!imageSrc) return;

    setIsBaking(true);
    setBakeError(null);

    try {
      // Use higher quality settings for baking
      const bakeConfig = {
        maxParticles: Math.max(config.maxParticles, 50000), // At least 50K for bake
        sampleStep: Math.max(1, config.sampleStep - 1), // Higher resolution sampling
        artDirection: config.artDirection,
        layers: {
          contour: config.layers.contour,
          fill: config.layers.fill,
          highlight: config.layers.highlight,
        },
      };

      const data = await sampleLayeredParticles(imageSrc, depthMapSrc || null, bakeConfig);
      setBakedData(data);
      setStage("bake");
    } catch (err) {
      setBakeError(err instanceof Error ? err.message : "Failed to bake particles");
    } finally {
      setIsBaking(false);
    }
  }, [imageSrc, depthMapSrc, config]);

  // Download baked TFPC file
  const handleDownload = useCallback(() => {
    if (!bakedData) return;
    const filename = `gateway-${Date.now()}.tfpc`;
    downloadTFPC(bakedData, filename);
  }, [bakedData]);

  // Upload baked TFPC to Supabase
  const handleUpload = useCallback(async () => {
    if (!bakedData || !isAdmin) return;

    setIsUploading(true);
    setBakeError(null);

    try {
      const buffer = encodeTFPC(bakedData);
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      const file = new File([blob], `gateway-${Date.now()}.tfpc`, {
        type: "application/octet-stream",
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", "gateway");

      const response = await fetch("/api/gateway-particles/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();

      // Update config with baked source
      setConfig((prev) => ({
        ...prev,
        bakedSrc: data.publicUrl,
      }));

      alert(`Uploaded successfully!\n\nURL: ${data.publicUrl}`);
    } catch (err) {
      setBakeError(err instanceof Error ? err.message : "Failed to upload");
    } finally {
      setIsUploading(false);
    }
  }, [bakedData, isAdmin]);

  const hasImage = !!imageSrc;
  const hasDepth = !!depthMapSrc;
  const hasParticles = !!particleData;

  const estimatedSize = useMemo(() => {
    return estimateTFPCSize(config.maxParticles);
  }, [config.maxParticles]);

  // Determine if controls should be disabled
  const controlsDisabled = !hasParticles || isGenerating;

  return (
    <div className="gateway-lab">
      <div className="gateway-lab__layout">
        {/* Left Panel - Scrollable Controls */}
        <div className="gateway-lab__controls-wrapper">
          <div className="gateway-lab__controls">
            {/* Stage Indicator */}
            <div className="gateway-lab__stage-indicator">
              <div
                className={`gateway-lab__stage ${stage === "upload" ? "active" : hasImage ? "done" : ""}`}
              >
                <span>1</span> Upload
              </div>
              <div
                className={`gateway-lab__stage ${stage === "preview" || stage === "refine" ? "active" : hasParticles ? "done" : ""}`}
              >
                <span>2</span> Preview
              </div>
              <div className={`gateway-lab__stage ${stage === "refine" ? "active" : ""}`}>
                <span>3</span> Refine
              </div>
              <div className={`gateway-lab__stage ${stage === "bake" ? "active" : ""}`}>
                <span>4</span> Bake
              </div>
            </div>

            {/* Image Upload Section - Always visible */}
            <div className="shape-lab__section">
              <h3 className="shape-lab__section-title">Source Images</h3>

              <div className="gateway-lab__upload-grid">
                <ImageUploader
                  label="Key Visual"
                  description="Main image"
                  onUpload={(dataUrl) => {
                    setImageSrc(dataUrl);
                    setParticleData(null);
                    setStage("upload");
                  }}
                  currentSrc={imageSrc}
                  previewSize={100}
                />

                <ImageUploader
                  label="Depth Map"
                  description="Grayscale (optional)"
                  onUpload={(dataUrl) => {
                    setDepthMapSrc(dataUrl);
                    if (hasParticles) {
                      // Mark as needing regeneration
                      setStage("upload");
                    }
                  }}
                  currentSrc={depthMapSrc}
                  previewSize={100}
                />
              </div>

              {/* Generate Button */}
              {hasImage && !hasParticles && (
                <button
                  onClick={handleGeneratePreview}
                  disabled={isGenerating}
                  className="gateway-lab__generate-btn"
                >
                  {isGenerating ? (
                    <>
                      <span className="gateway-lab__spinner" />
                      {generationProgress || "Generating..."}
                    </>
                  ) : (
                    "⚡ Generate Preview"
                  )}
                </button>
              )}

              {generationError && <div className="gateway-lab__error">{generationError}</div>}
            </div>

            {/* Presets Section */}
            <div className="shape-lab__section">
              <h3 className="shape-lab__section-title">Presets</h3>
              <div className="gateway-lab__presets">
                {GATEWAY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    className={`gateway-lab__preset-btn ${activePreset === preset.id ? "active" : ""}`}
                    onClick={() => loadPreset(preset)}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Render Style - Organic vs Sigil */}
            <div className={`shape-lab__section ${!hasParticles ? "disabled" : ""}`}>
              <h3 className="shape-lab__section-title">Render Style</h3>
              <div className="gateway-lab__mode-selector">
                <button
                  className={!config.sigilMode ? "active" : ""}
                  onClick={() => handleConfigChange({ sigilMode: false })}
                  disabled={!hasParticles}
                >
                  ○ Organic
                </button>
                <button
                  className={config.sigilMode ? "active" : ""}
                  onClick={() => handleConfigChange({ sigilMode: true })}
                  disabled={!hasParticles}
                >
                  ▢ Sigil
                </button>
              </div>
              <p className="gateway-lab__mode-description">
                {config.sigilMode
                  ? "Grid-snapped square particles (Thoughtform sacred grid)"
                  : "Soft circular particles with organic motion"}
              </p>

              {config.sigilMode && (
                <SliderControl
                  label="Grid Size"
                  value={config.sigilGridSize ?? 3}
                  min={1}
                  max={8}
                  step={0.5}
                  onChange={(v) => handleConfigChange({ sigilGridSize: v })}
                  suffix="px"
                  disabled={!hasParticles}
                />
              )}
            </div>

            {/* Particle Settings - Only enabled after generation */}
            <div className={`shape-lab__section ${controlsDisabled ? "disabled" : ""}`}>
              <h3 className="shape-lab__section-title">
                Particle Settings
                {controlsDisabled && (
                  <span className="gateway-lab__section-hint">(generate first)</span>
                )}
              </h3>

              <SliderControl
                label="Max Particles"
                value={config.maxParticles / 1000}
                min={5}
                max={100}
                step={5}
                onChange={(v) => handleConfigChange({ maxParticles: v * 1000 })}
                suffix="K"
                disabled={controlsDisabled}
              />

              <SliderControl
                label="Sample Step"
                value={config.sampleStep}
                min={1}
                max={8}
                step={1}
                onChange={(v) => handleConfigChange({ sampleStep: v })}
                suffix="px"
                disabled={controlsDisabled}
              />

              <SliderControl
                label="Particle Size"
                value={config.particleSize}
                min={0.2}
                max={3}
                step={0.1}
                onChange={(v) => handleConfigChange({ particleSize: v })}
                suffix="x"
                disabled={controlsDisabled}
              />

              <SliderControl
                label="Scale"
                value={config.scale}
                min={0.5}
                max={5}
                step={0.1}
                onChange={(v) => handleConfigChange({ scale: v })}
                suffix="x"
                disabled={controlsDisabled}
              />

              {/* Regenerate button */}
              {hasParticles && (
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="gateway-lab__regenerate-btn"
                >
                  {isGenerating ? "Regenerating..." : "🔄 Regenerate"}
                </button>
              )}
            </div>

            {/* Art Direction - Only enabled after generation */}
            <div className={`shape-lab__section ${controlsDisabled ? "disabled" : ""}`}>
              <h3 className="shape-lab__section-title">Art Direction</h3>

              <SliderControl
                label="Contrast"
                value={config.artDirection.contrast}
                min={0.5}
                max={2}
                step={0.05}
                onChange={(v) => handleArtDirectionChange({ contrast: v })}
                disabled={controlsDisabled}
              />

              <SliderControl
                label="Gamma"
                value={config.artDirection.gamma}
                min={0.5}
                max={2}
                step={0.05}
                onChange={(v) => handleArtDirectionChange({ gamma: v })}
                disabled={controlsDisabled}
              />

              <SliderControl
                label="Depth Scale"
                value={config.artDirection.depthScale}
                min={0}
                max={2}
                step={0.05}
                onChange={(v) => handleArtDirectionChange({ depthScale: v })}
                disabled={controlsDisabled}
              />

              <SliderControl
                label="Depth Gamma"
                value={config.artDirection.depthGamma}
                min={0.5}
                max={2}
                step={0.05}
                onChange={(v) => handleArtDirectionChange({ depthGamma: v })}
                disabled={controlsDisabled}
              />

              <ToggleControl
                label="Invert Depth"
                checked={config.artDirection.depthInvert}
                onChange={(v) => handleArtDirectionChange({ depthInvert: v })}
                disabled={controlsDisabled}
              />

              <SliderControl
                label="Luma Threshold"
                value={config.artDirection.lumaThreshold}
                min={0}
                max={0.3}
                step={0.01}
                onChange={(v) => handleArtDirectionChange({ lumaThreshold: v })}
                disabled={controlsDisabled}
              />
            </div>

            {/* Layer Controls - Only enabled after generation */}
            <div className={`shape-lab__section ${controlsDisabled ? "disabled" : ""}`}>
              <h3 className="shape-lab__section-title">Layers</h3>

              <LayerControls
                layerKind="contour"
                config={config.layers.contour}
                onChange={(updates) => handleLayerChange("contour", updates)}
                disabled={controlsDisabled}
              />

              <LayerControls
                layerKind="fill"
                config={config.layers.fill}
                onChange={(updates) => handleLayerChange("fill", updates)}
                disabled={controlsDisabled}
              />

              <LayerControls
                layerKind="highlight"
                config={config.layers.highlight}
                onChange={(updates) => handleLayerChange("highlight", updates)}
                disabled={controlsDisabled}
              />
            </div>

            {/* Colors - Real-time updates */}
            <div className={`shape-lab__section ${!hasParticles ? "disabled" : ""}`}>
              <h3 className="shape-lab__section-title">Colors</h3>
              <div className="gateway-lab__colors">
                <div className="gateway-lab__color-input">
                  <label>Primary</label>
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => handleConfigChange({ primaryColor: e.target.value })}
                    disabled={!hasParticles}
                  />
                </div>
                <div className="gateway-lab__color-input">
                  <label>Accent</label>
                  <input
                    type="color"
                    value={config.accentColor}
                    onChange={(e) => handleConfigChange({ accentColor: e.target.value })}
                    disabled={!hasParticles}
                  />
                </div>
              </div>

              <SliderControl
                label="Opacity"
                value={config.opacity}
                min={0.1}
                max={1}
                step={0.05}
                onChange={(v) => handleConfigChange({ opacity: v })}
                disabled={!hasParticles}
              />
            </div>

            {/* Motion Settings - Real-time updates */}
            <div className={`shape-lab__section ${!hasParticles ? "disabled" : ""}`}>
              <h3 className="shape-lab__section-title">Motion</h3>

              <SliderControl
                label="Turbulence"
                value={config.turbulenceStrength}
                min={0}
                max={0.1}
                step={0.005}
                onChange={(v) => handleConfigChange({ turbulenceStrength: v })}
                disabled={!hasParticles}
              />

              <SliderControl
                label="Interaction"
                value={config.interactionStrength}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => handleConfigChange({ interactionStrength: v })}
                disabled={!hasParticles}
              />
            </div>

            {/* Scroll Simulation */}
            <div className={`shape-lab__section ${!hasParticles ? "disabled" : ""}`}>
              <h3 className="shape-lab__section-title">Scroll Simulation</h3>
              <SliderControl
                label="Scroll Progress"
                value={scrollProgress}
                min={0}
                max={1}
                step={0.01}
                onChange={setScrollProgress}
                disabled={!hasParticles}
              />
            </div>

            {/* Bake & Export - Only after particles are generated */}
            {hasParticles && (
              <div className="shape-lab__section">
                <h3 className="shape-lab__section-title">Bake & Export</h3>

                <div className="gateway-lab__bake-info">
                  <span>Est. file size: {formatFileSize(estimatedSize)}</span>
                  <span>Particles: {particleData?.totalCount.toLocaleString()}</span>
                </div>

                <div className="gateway-lab__bake-actions">
                  <button
                    onClick={handleBake}
                    disabled={isBaking}
                    className="gateway-lab__bake-btn"
                  >
                    {isBaking ? "Baking..." : "🔥 Bake High-Quality"}
                  </button>

                  {bakedData && (
                    <>
                      <button onClick={handleDownload} className="gateway-lab__download-btn">
                        💾 Download TFPC
                      </button>

                      {isAdmin && (
                        <button
                          onClick={handleUpload}
                          disabled={isUploading}
                          className="gateway-lab__upload-btn"
                        >
                          {isUploading ? "Uploading..." : "☁️ Upload"}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {bakedData && (
                  <div className="gateway-lab__bake-stats">
                    <span>✓ Baked {bakedData.totalCount.toLocaleString()} particles</span>
                    <span>Contour: {bakedData.layers.contour.count.toLocaleString()}</span>
                    <span>Fill: {bakedData.layers.fill.count.toLocaleString()}</span>
                    <span>Highlight: {bakedData.layers.highlight.count.toLocaleString()}</span>
                  </div>
                )}

                {bakeError && <div className="gateway-lab__error">{bakeError}</div>}
              </div>
            )}

            {/* Debug Toggle */}
            <div className="shape-lab__section">
              <button
                onClick={() => setShowStats((s) => !s)}
                className={`gateway-lab__toggle-btn ${showStats ? "active" : ""}`}
              >
                {showStats ? "Hide Stats" : "Show Stats"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="gateway-lab__preview">
          <div className="gateway-lab__canvas-wrapper">
            {hasParticles ? (
              <Canvas
                camera={{ position: [0, 0, 3], fov: 60 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: "transparent" }}
              >
                <GatewayScene
                  config={config}
                  particleData={particleData}
                  scrollProgress={scrollProgress}
                  showStats={showStats}
                />
              </Canvas>
            ) : (
              <EmptyPreviewState stage={stage} hasImage={hasImage} hasDepth={hasDepth} />
            )}

            {/* Loading overlay */}
            {isGenerating && (
              <div className="gateway-lab__loading-overlay">
                <div className="gateway-lab__loading-content">
                  <div className="gateway-lab__loading-spinner" />
                  <span>{generationProgress || "Processing..."}</span>
                </div>
              </div>
            )}
          </div>

          {/* Particle Stats (when showing) */}
          {hasParticles && particleData && (
            <div className="gateway-lab__stats-bar">
              <span>Total: {particleData.totalCount.toLocaleString()}</span>
              <span>Contour: {particleData.layers.contour.count.toLocaleString()}</span>
              <span>Fill: {particleData.layers.fill.count.toLocaleString()}</span>
              <span>Highlight: {particleData.layers.highlight.count.toLocaleString()}</span>
            </div>
          )}

          {/* Processing Pipeline Info */}
          <div className="gateway-lab__pipeline-info">
            <h4>Staged Workflow</h4>
            <ol>
              <li className={hasImage ? "done" : stage === "upload" ? "active" : ""}>
                <span>Upload</span> → Key visual + depth map
              </li>
              <li className={hasParticles ? "done" : hasImage ? "active" : ""}>
                <span>Preview</span> → Quick {PREVIEW_MAX_PARTICLES / 1000}K particle preview
              </li>
              <li className={stage === "refine" || stage === "bake" ? "active" : ""}>
                <span>Refine</span> → Adjust density, contrast, layers
              </li>
              <li className={bakedData ? "done" : ""}>
                <span>Bake</span> → Export high-quality TFPC
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
