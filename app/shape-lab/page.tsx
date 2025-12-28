"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";
import {
  getAllShapes,
  getShapeGenerator,
  toSigilPoints,
  type ShapeDefinition,
  type Vec3,
} from "@/lib/particle-geometry";
import "./shape-lab.css";

// ═══════════════════════════════════════════════════════════════
// SHAPE LAB - Admin-only preview page for particle shapes
// Previews shapes in both Sigil mode and Landmark mode
// ═══════════════════════════════════════════════════════════════

const GRID = 3;

// Preset type
interface ShapePreset {
  id: string;
  name: string;
  shapeId: string;
  seed: number;
  pointCount: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

// Snap to grid (Thoughtform sacred rule)
function snap(value: number): number {
  return Math.floor(value / GRID) * GRID;
}

// Sigil Preview Canvas Component
interface SigilPreviewProps {
  shapeId: string;
  seed: number;
  pointCount: number;
  size?: number;
}

function SigilPreview({ shapeId, seed, pointCount, size = 200 }: SigilPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<
    Array<{
      x: number;
      y: number;
      z: number;
      alpha: number;
      baseX: number;
      baseY: number;
      vx: number;
      vy: number;
      phase: number;
    }>
  >([]);

  // Generate points
  useEffect(() => {
    const generator = getShapeGenerator(shapeId);
    const points3D: Vec3[] = generator({ seed, pointCount, size });
    const sigilPoints = toSigilPoints(points3D, size, {
      rotationX: 0.3,
      rotationY: 0.2,
      scale: 0.35,
    });

    const center = size / 2;
    particlesRef.current = sigilPoints.map((p) => ({
      x: p.x,
      y: p.y,
      z: p.z,
      alpha: p.alpha ?? 0.6,
      baseX: p.x - center,
      baseY: p.y - center,
      vx: 0,
      vy: 0,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [shapeId, seed, pointCount, size]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const center = size / 2;

    function render() {
      if (!ctx) return;
      const time = timeRef.current;

      ctx.clearRect(0, 0, size, size);

      // Sort by depth (back to front)
      const sorted = [...particlesRef.current].sort((a, b) => b.z - a.z);

      sorted.forEach((particle) => {
        // Slight wandering motion
        const noiseX = Math.sin(time * 0.01 + particle.phase) * 0.5;
        const noiseY = Math.cos(time * 0.01 + particle.phase * 1.5) * 0.5;
        particle.vx += noiseX * 0.1;
        particle.vy += noiseY * 0.1;

        // Return force
        const dx = particle.baseX + center - particle.x;
        const dy = particle.baseY + center - particle.y;
        particle.vx += dx * 0.02;
        particle.vy += dy * 0.02;

        // Damping
        particle.vx *= 0.9;
        particle.vy *= 0.9;

        // Update
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Breathing
        const breathe = Math.sin(time * 0.003 + particle.phase) * 0.15 + 1;

        // Depth-based alpha
        const depthAlpha = 0.5 + (1 - particle.z) * 0.5;
        const finalAlpha = particle.alpha * breathe * depthAlpha;

        if (finalAlpha < 0.01) return;

        const px = snap(particle.x);
        const py = snap(particle.y);
        const particleSize = GRID - 1 + (1 - particle.z) * 0.5;

        ctx.fillStyle = `rgba(202, 165, 84, ${finalAlpha})`;
        ctx.fillRect(px, py, particleSize, particleSize);
      });

      timeRef.current++;
      animationRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, background: "rgba(10, 9, 8, 0.9)" }}
    />
  );
}

// Landmark Preview Canvas Component (3D projected view)
interface LandmarkPreviewProps {
  shapeId: string;
  seed: number;
  pointCount: number;
  size?: number;
}

function LandmarkPreview({ shapeId, seed, pointCount, size = 300 }: LandmarkPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const generator = getShapeGenerator(shapeId);

    function render() {
      if (!ctx) return;
      const time = timeRef.current;

      ctx.clearRect(0, 0, size, size);

      // Generate points with slow rotation
      const rotationY = time * 0.002;
      const rotationX = 0.3;

      const points3D: Vec3[] = generator({ seed, pointCount, size: 1 });

      // Project points
      const projected: Array<{ x: number; y: number; z: number; alpha: number }> = [];
      const scale = size * 0.3;
      const centerX = size / 2;
      const centerY = size / 2;

      for (const p of points3D) {
        // Rotate around Y axis
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);
        let x = p.x * cosY + p.z * sinY;
        let z = -p.x * sinY + p.z * cosY;
        let y = p.y;

        // Rotate around X axis
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);
        const newY = y * cosX - z * sinX;
        const newZ = y * sinX + z * cosX;
        y = newY;
        z = newZ;

        // Perspective projection
        const depth = z + 2;
        if (depth <= 0.1) continue;

        const perspectiveScale = 1.5 / depth;
        const screenX = centerX + x * scale * perspectiveScale;
        const screenY = centerY - y * scale * perspectiveScale;

        // Depth-based alpha
        const normalizedZ = (z + 1) / 2; // Normalize to 0-1
        const alpha = 0.3 + (1 - normalizedZ) * 0.7;

        projected.push({ x: screenX, y: screenY, z: normalizedZ, alpha });
      }

      // Sort by depth (back to front)
      projected.sort((a, b) => b.z - a.z);

      // Draw particles
      for (const p of projected) {
        const px = snap(p.x);
        const py = snap(p.y);
        const particleSize = GRID - 1 + (1 - p.z) * 0.5;

        ctx.fillStyle = `rgba(202, 165, 84, ${p.alpha})`;
        ctx.fillRect(px, py, particleSize, particleSize);
      }

      timeRef.current++;
      animationRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shapeId, seed, pointCount, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, background: "rgba(10, 9, 8, 0.9)" }}
    />
  );
}

// Main Shape Lab Content
function ShapeLabContent() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedShape, setSelectedShape] = useState<string>("tf_filamentField");
  const [seed, setSeed] = useState(42);
  const [pointCount, setPointCount] = useState(300);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Preset management state
  const [presets, setPresets] = useState<ShapePreset[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(true);
  const [presetName, setPresetName] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load presets on mount
  useEffect(() => {
    if (mounted) {
      loadPresets();
    }
  }, [mounted]);

  const loadPresets = async () => {
    try {
      setPresetsLoading(true);
      const response = await fetch("/api/shape-presets", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setPresets(data.presets || []);
      }
    } catch (error) {
      console.error("Failed to load presets:", error);
    } finally {
      setPresetsLoading(false);
    }
  };

  const savePreset = async () => {
    if (!presetName.trim()) return;

    try {
      setSavingPreset(true);
      const response = await fetch("/api/shape-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: presetName.trim(),
          shapeId: selectedShape,
          seed,
          pointCount,
          category: categoryFilter === "all" ? "custom" : categoryFilter,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPresets((prev) => [...prev, data.preset]);
        setPresetName("");
        setShowSaveForm(false);
      }
    } catch (error) {
      console.error("Failed to save preset:", error);
    } finally {
      setSavingPreset(false);
    }
  };

  const deletePreset = async (presetId: string) => {
    try {
      const response = await fetch(`/api/shape-presets?id=${presetId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPresets((prev) => prev.filter((p) => p.id !== presetId));
      }
    } catch (error) {
      console.error("Failed to delete preset:", error);
    }
  };

  const loadPreset = (preset: ShapePreset) => {
    setSelectedShape(preset.shapeId);
    setSeed(preset.seed);
    setPointCount(preset.pointCount);
  };

  const shapes = useMemo(() => getAllShapes(), []);

  const filteredShapes = useMemo(() => {
    if (categoryFilter === "all") return shapes;
    return shapes.filter((s) => s.category === categoryFilter);
  }, [shapes, categoryFilter]);

  const selectedShapeInfo = useMemo(
    () => shapes.find((s) => s.id === selectedShape),
    [shapes, selectedShape]
  );

  const handleRandomSeed = useCallback(() => {
    setSeed(Math.floor(Math.random() * 10000));
  }, []);

  if (!mounted) return null;

  return (
    <div className="shape-lab">
      {/* Header */}
      <div className="shape-lab__header">
        <Link href="/" className="shape-lab__back">
          ← Back
        </Link>
        <div className="shape-lab__header-main">
          <h1 className="shape-lab__title">Shape Lab</h1>
          <span className="shape-lab__admin-badge">ADMIN</span>
        </div>
        <p className="shape-lab__subtitle">Preview particle shapes in Sigil and Landmark modes</p>
      </div>

      <div className="shape-lab__content">
        {/* Controls Panel */}
        <div className="shape-lab__controls">
          {/* Category Filter */}
          <div className="shape-lab__section">
            <h3 className="shape-lab__section-title">Category</h3>
            <div className="shape-lab__category-buttons">
              <button
                className={`shape-lab__category-btn ${categoryFilter === "all" ? "active" : ""}`}
                onClick={() => setCategoryFilter("all")}
              >
                All
              </button>
              <button
                className={`shape-lab__category-btn ${categoryFilter === "thoughtform" ? "active" : ""}`}
                onClick={() => setCategoryFilter("thoughtform")}
              >
                Thoughtform
              </button>
              <button
                className={`shape-lab__category-btn ${categoryFilter === "geometric" ? "active" : ""}`}
                onClick={() => setCategoryFilter("geometric")}
              >
                Geometric
              </button>
            </div>
          </div>

          {/* Shape Selector */}
          <div className="shape-lab__section">
            <h3 className="shape-lab__section-title">Shape</h3>
            <div className="shape-lab__shape-list">
              {filteredShapes.map((shape) => (
                <button
                  key={shape.id}
                  className={`shape-lab__shape-btn ${selectedShape === shape.id ? "active" : ""}`}
                  onClick={() => setSelectedShape(shape.id)}
                >
                  <span className="shape-lab__shape-name">{shape.label}</span>
                  <span className="shape-lab__shape-category">{shape.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="shape-lab__section">
            <h3 className="shape-lab__section-title">Parameters</h3>

            <div className="shape-lab__param">
              <label className="shape-lab__param-label">
                Seed: {seed}
                <button className="shape-lab__randomize" onClick={handleRandomSeed}>
                  🎲
                </button>
              </label>
              <input
                type="range"
                min="0"
                max="9999"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value))}
                className="shape-lab__slider"
              />
            </div>

            <div className="shape-lab__param">
              <label className="shape-lab__param-label">Point Count: {pointCount}</label>
              <input
                type="range"
                min="50"
                max="800"
                step="50"
                value={pointCount}
                onChange={(e) => setPointCount(parseInt(e.target.value))}
                className="shape-lab__slider"
              />
            </div>
          </div>

          {/* Shape Info */}
          {selectedShapeInfo && (
            <div className="shape-lab__section">
              <h3 className="shape-lab__section-title">Info</h3>
              <div className="shape-lab__info">
                <div className="shape-lab__info-row">
                  <span>ID:</span>
                  <code>{selectedShapeInfo.id}</code>
                </div>
                <div className="shape-lab__info-row">
                  <span>Category:</span>
                  <span>{selectedShapeInfo.category}</span>
                </div>
                <div className="shape-lab__info-row">
                  <span>3D Depth:</span>
                  <span>{selectedShapeInfo.has3DDepth ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Save Preset Button */}
          <div className="shape-lab__section">
            <h3 className="shape-lab__section-title">Save Current</h3>
            {!showSaveForm ? (
              <button className="shape-lab__save-btn" onClick={() => setShowSaveForm(true)}>
                Save as Preset
              </button>
            ) : (
              <div className="shape-lab__save-form">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name..."
                  className="shape-lab__preset-input"
                  onKeyDown={(e) => e.key === "Enter" && savePreset()}
                />
                <div className="shape-lab__save-actions">
                  <button
                    className="shape-lab__action-btn shape-lab__action-btn--save"
                    onClick={savePreset}
                    disabled={savingPreset || !presetName.trim()}
                  >
                    {savingPreset ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="shape-lab__action-btn shape-lab__action-btn--cancel"
                    onClick={() => {
                      setShowSaveForm(false);
                      setPresetName("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Presets Panel */}
          <div className="shape-lab__section">
            <h3 className="shape-lab__section-title">
              Presets {presetsLoading && <span className="shape-lab__loading">Loading...</span>}
            </h3>
            {presets.length === 0 && !presetsLoading ? (
              <p className="shape-lab__empty-text">No presets saved yet</p>
            ) : (
              <div className="shape-lab__presets-list">
                {presets.map((preset) => (
                  <div key={preset.id} className="shape-lab__preset-item">
                    <button className="shape-lab__preset-btn" onClick={() => loadPreset(preset)}>
                      <span className="shape-lab__preset-name">{preset.name}</span>
                      <span className="shape-lab__preset-meta">
                        {preset.shapeId} · {preset.pointCount}pts
                      </span>
                    </button>
                    <button
                      className="shape-lab__preset-delete"
                      onClick={() => deletePreset(preset.id)}
                      title="Delete preset"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preview Panels */}
        <div className="shape-lab__previews">
          {/* Sigil Mode Preview */}
          <div className="shape-lab__preview-panel">
            <h3 className="shape-lab__preview-title">Sigil Mode</h3>
            <p className="shape-lab__preview-desc">200×200px, for service cards</p>
            <div className="shape-lab__canvas-container">
              <SigilPreview
                shapeId={selectedShape}
                seed={seed}
                pointCount={pointCount}
                size={200}
              />
            </div>
          </div>

          {/* Landmark Mode Preview */}
          <div className="shape-lab__preview-panel">
            <h3 className="shape-lab__preview-title">Landmark Mode</h3>
            <p className="shape-lab__preview-desc">3D rotating view, for manifold landmarks</p>
            <div className="shape-lab__canvas-container">
              <LandmarkPreview
                shapeId={selectedShape}
                seed={seed}
                pointCount={pointCount}
                size={300}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Unauthorized fallback
function UnauthorizedView() {
  return (
    <div className="shape-lab shape-lab--unauthorized">
      <div className="shape-lab__unauthorized-content">
        <h1 className="shape-lab__title">Shape Lab</h1>
        <p className="shape-lab__unauthorized-text">This page is restricted to administrators.</p>
        <Link href="/" className="shape-lab__back-home">
          ← Return to Home
        </Link>
      </div>
    </div>
  );
}

// Main export with AdminGate protection
export default function ShapeLabPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="shape-lab">
        <div className="shape-lab__loading-screen">
          <p>Loading Shape Lab...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminGate>
        <ShapeLabContent />
      </AdminGate>
      {/* Show unauthorized view when AdminGate hides content */}
      <AdminGateFallback>
        <UnauthorizedView />
      </AdminGateFallback>
    </>
  );
}

// Inverse of AdminGate - shows content when NOT admin
function AdminGateFallback({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    // In development, admin content is shown, so hide fallback
    if (process.env.NODE_ENV === "development") {
      setIsAllowed(true);
      return;
    }

    if (isLoading) {
      setIsAllowed(null);
      return;
    }

    // Check if user is allowed using centralized function
    const userIsAllowed = isAllowedUserEmail(user?.email);
    setIsAllowed(userIsAllowed);
  }, [user, isLoading]);

  // Don't render fallback while loading or if user is allowed
  if (isAllowed === null || isAllowed) {
    return null;
  }

  return <>{children}</>;
}
