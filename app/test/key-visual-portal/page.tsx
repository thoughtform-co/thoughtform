"use client";

import { useState, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import { KeyVisualPortal, type KeyVisualPortalConfig } from "@/components/hud/KeyVisualPortal";

// ═══════════════════════════════════════════════════════════════
// TEST PAGE: KEY VISUAL PORTAL
//
// Interactive test harness for the PNG → particle portal
// Includes debug controls for tuning the effect
//
// PROCESSING PIPELINE:
// 1. Image Upload → FileReader converts to data URL (base64)
// 2. Canvas API → Image drawn to offscreen canvas at reduced resolution (max 512px)
// 3. Pixel Sampling → getImageData() extracts RGBA values for each pixel
// 4. Particle Generation → For each sampled pixel:
//    - Position (x,y) from pixel coordinates, normalized to [-1, 1]
//    - Position (z) from luminance (brightness) as pseudo-depth
//    - Color attributes: luma, alpha, edge weight (Sobel operator)
// 5. Three.js Points → Float32Arrays sent to GPU as BufferGeometry attributes
// 6. Custom Shader → GLSL vertex/fragment shaders render particles with:
//    - Simplex noise for turbulence
//    - Curl noise for organic flow
//    - Pointer interaction forces
// ═══════════════════════════════════════════════════════════════

const DEFAULT_TEST_CONFIG: KeyVisualPortalConfig = {
  // Use existing gateway-hero.png as fallback, or upload your own
  imageSrc: "/images/gateway-hero.png",
  depthMapSrc: "", // optional depth map
  primaryColor: "#ebe3d6",
  accentColor: "#caa554",
  scale: 2.0,
  maxParticles: 25000,
  particleSize: 1.2,
  interactionStrength: 0.3,
  turbulenceStrength: 0.02,
  breatheSpeed: 1.0,
  depthScale: 0.5,
  opacity: 1.0,
};

// Upload button component
function ImageUploader({
  label,
  onUpload,
  currentSrc,
}: {
  label: string;
  onUpload: (dataUrl: string) => void;
  currentSrc?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onUpload(dataUrl);
      setIsLoading(false);
    };
    reader.onerror = () => {
      console.error("Failed to read file");
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", marginBottom: 4, opacity: 0.7 }}>{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        style={{
          width: "100%",
          padding: "10px 12px",
          background: isLoading ? "rgba(202, 165, 84, 0.3)" : "rgba(202, 165, 84, 0.15)",
          border: "1px solid rgba(202, 165, 84, 0.4)",
          borderRadius: 2,
          color: "#caa554",
          cursor: isLoading ? "wait" : "pointer",
          fontSize: 11,
          letterSpacing: "0.05em",
          transition: "all 0.2s",
        }}
      >
        {isLoading ? "PROCESSING..." : "↑ UPLOAD IMAGE"}
      </button>
      {currentSrc && (
        <p style={{ fontSize: 9, opacity: 0.5, marginTop: 4, wordBreak: "break-all" }}>
          {currentSrc.startsWith("data:") ? "✓ Custom image loaded" : currentSrc}
        </p>
      )}
    </div>
  );
}

// Control panel component
function ControlPanel({
  config,
  onChange,
  scrollProgress,
  onScrollChange,
  showStats,
  onToggleStats,
}: {
  config: KeyVisualPortalConfig;
  onChange: (updates: Partial<KeyVisualPortalConfig>) => void;
  scrollProgress: number;
  onScrollChange: (value: number) => void;
  showStats: boolean;
  onToggleStats: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        width: 320,
        maxHeight: "90vh",
        overflowY: "auto",
        background: "rgba(8, 7, 6, 0.95)",
        border: "1px solid rgba(202, 165, 84, 0.3)",
        borderRadius: 4,
        padding: 16,
        fontFamily: "var(--font-mono, 'PT Mono', monospace)",
        fontSize: 11,
        color: "#ebe3d6",
        zIndex: 1000,
        backdropFilter: "blur(8px)",
      }}
    >
      <h3 style={{ margin: "0 0 16px", color: "#caa554", fontSize: 13 }}>
        KEY VISUAL PORTAL // DEBUG
      </h3>

      {/* Image Upload */}
      <ImageUploader
        label="Key Visual Image"
        onUpload={(dataUrl) => onChange({ imageSrc: dataUrl })}
        currentSrc={config.imageSrc}
      />

      {/* Depth Map Upload */}
      <ImageUploader
        label="Depth Map (optional)"
        onUpload={(dataUrl) => onChange({ depthMapSrc: dataUrl })}
        currentSrc={config.depthMapSrc}
      />

      {/* Colors */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", marginBottom: 4, opacity: 0.7 }}>Primary Color</label>
          <input
            type="color"
            value={config.primaryColor}
            onChange={(e) => onChange({ primaryColor: e.target.value })}
            style={{ width: "100%", height: 28, cursor: "pointer" }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", marginBottom: 4, opacity: 0.7 }}>Accent Color</label>
          <input
            type="color"
            value={config.accentColor}
            onChange={(e) => onChange({ accentColor: e.target.value })}
            style={{ width: "100%", height: 28, cursor: "pointer" }}
          />
        </div>
      </div>

      {/* Scale */}
      <SliderControl
        label="Scale"
        value={config.scale || 1}
        min={0.5}
        max={5}
        step={0.1}
        onChange={(v) => onChange({ scale: v })}
      />

      {/* Max Particles */}
      <SliderControl
        label="Max Particles"
        value={config.maxParticles || 30000}
        min={1000}
        max={100000}
        step={1000}
        onChange={(v) => onChange({ maxParticles: v })}
      />

      {/* Particle Size */}
      <SliderControl
        label="Particle Size"
        value={config.particleSize || 1}
        min={0.1}
        max={5}
        step={0.1}
        onChange={(v) => onChange({ particleSize: v })}
      />

      {/* Interaction Strength */}
      <SliderControl
        label="Interaction Strength"
        value={config.interactionStrength || 0.3}
        min={0}
        max={2}
        step={0.05}
        onChange={(v) => onChange({ interactionStrength: v })}
      />

      {/* Turbulence Strength */}
      <SliderControl
        label="Turbulence"
        value={config.turbulenceStrength || 0.02}
        min={0}
        max={0.2}
        step={0.005}
        onChange={(v) => onChange({ turbulenceStrength: v })}
      />

      {/* Depth Scale */}
      <SliderControl
        label="Depth Scale"
        value={config.depthScale || 0.5}
        min={0}
        max={2}
        step={0.05}
        onChange={(v) => onChange({ depthScale: v })}
      />

      {/* Opacity */}
      <SliderControl
        label="Opacity"
        value={config.opacity || 1}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => onChange({ opacity: v })}
      />

      {/* Scroll Progress Simulation */}
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(202,165,84,0.2)" }}>
        <SliderControl
          label="Scroll Progress (simulated)"
          value={scrollProgress}
          min={0}
          max={1}
          step={0.01}
          onChange={onScrollChange}
        />
      </div>

      {/* Toggle Stats */}
      <div style={{ marginTop: 12 }}>
        <button
          onClick={onToggleStats}
          style={{
            width: "100%",
            padding: "8px 12px",
            background: showStats ? "rgba(202, 165, 84, 0.2)" : "rgba(0,0,0,0.3)",
            border: "1px solid rgba(202, 165, 84, 0.3)",
            borderRadius: 2,
            color: "#ebe3d6",
            cursor: "pointer",
            fontSize: 10,
            letterSpacing: "0.05em",
          }}
        >
          {showStats ? "HIDE STATS" : "SHOW STATS"}
        </button>
      </div>

      {/* Pipeline Info */}
      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: "rgba(0,0,0,0.4)",
          borderRadius: 2,
          borderLeft: "2px solid rgba(202, 165, 84, 0.3)",
        }}
      >
        <p style={{ margin: 0, fontSize: 10, opacity: 0.8, lineHeight: 1.6 }}>
          <strong style={{ color: "#caa554" }}>PROCESSING PIPELINE:</strong>
          <br />
          <br />
          <span style={{ color: "#7a9a6a" }}>1. FileReader API</span> → Converts PNG to base64 data
          URL
          <br />
          <span style={{ color: "#7a9a6a" }}>2. Canvas 2D API</span> → Draws image at ≤512px
          resolution
          <br />
          <span style={{ color: "#7a9a6a" }}>3. getImageData()</span> → Extracts RGBA pixel values
          <br />
          <span style={{ color: "#7a9a6a" }}>4. Sobel Edge Detection</span> → Computes edge weights
          <br />
          <span style={{ color: "#7a9a6a" }}>5. Importance Sampling</span> → Prioritizes edges +
          bright pixels
          <br />
          <span style={{ color: "#7a9a6a" }}>6. Three.js BufferGeometry</span> → Float32Arrays to
          GPU
          <br />
          <span style={{ color: "#7a9a6a" }}>7. Custom GLSL Shaders</span> → Noise + interaction +
          render
        </p>
      </div>

      {/* Quick Tips */}
      <div
        style={{
          marginTop: 12,
          padding: 10,
          background: "rgba(202, 165, 84, 0.08)",
          borderRadius: 2,
        }}
      >
        <p style={{ margin: 0, fontSize: 9, opacity: 0.7, lineHeight: 1.5 }}>
          <strong style={{ color: "#caa554" }}>TIPS:</strong> Use high-contrast images with clean
          edges for best results. Move mouse to interact. Scroll slider simulates page scroll.
        </p>
      </div>
    </div>
  );
}

// Slider control component
function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <label style={{ opacity: 0.7 }}>{label}</label>
        <span style={{ color: "#caa554" }}>{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: "100%",
          accentColor: "#caa554",
        }}
      />
    </div>
  );
}

// Scene component
function Scene({
  config,
  scrollProgress,
  showStats,
}: {
  config: KeyVisualPortalConfig;
  scrollProgress: number;
  showStats: boolean;
}) {
  return (
    <>
      {showStats && <Stats />}
      <ambientLight intensity={0.5} />
      <KeyVisualPortal config={config} scrollProgress={scrollProgress} visible={true} />
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

export default function KeyVisualPortalTestPage() {
  const [config, setConfig] = useState<KeyVisualPortalConfig>(DEFAULT_TEST_CONFIG);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showStats, setShowStats] = useState(false);

  const handleConfigChange = useCallback((updates: Partial<KeyVisualPortalConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(180deg, #0a0908 0%, #050504 50%, #080706 100%)",
      }}
    >
      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 3], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene config={config} scrollProgress={scrollProgress} showStats={showStats} />
      </Canvas>

      {/* Debug Control Panel */}
      <ControlPanel
        config={config}
        onChange={handleConfigChange}
        scrollProgress={scrollProgress}
        onScrollChange={setScrollProgress}
        showStats={showStats}
        onToggleStats={() => setShowStats((s) => !s)}
      />

      {/* Title */}
      <div
        style={{
          position: "fixed",
          top: 20,
          left: 20,
          fontFamily: "var(--font-mono, 'PT Mono', monospace)",
          color: "#ebe3d6",
          zIndex: 1000,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 14, fontWeight: 400, opacity: 0.6 }}>
          TEST // KEY VISUAL PORTAL
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 10, opacity: 0.4 }}>
          PNG → Interactive Particle Cloud
        </p>
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          opacity: 0.03,
          backgroundImage: `
            linear-gradient(rgba(202, 165, 84, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(202, 165, 84, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          zIndex: 0,
        }}
      />
    </div>
  );
}
