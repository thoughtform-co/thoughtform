"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import {
  getAllShapes,
  getShapeGenerator,
  toSigilPoints,
  type ShapeDefinition,
  type Vec3,
} from "@/lib/particle-geometry";

// ═══════════════════════════════════════════════════════════════
// SHAPE LAB - Internal preview page for particle shapes
// Previews shapes in both Sigil mode and Landmark mode
// ═══════════════════════════════════════════════════════════════

const GRID = 3;

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

export default function ShapeLabPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedShape, setSelectedShape] = useState<string>("tf_filamentField");
  const [seed, setSeed] = useState(42);
  const [pointCount, setPointCount] = useState(300);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <h1 className="shape-lab__title">Shape Lab</h1>
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

      <style jsx>{`
        .shape-lab {
          min-height: 100vh;
          background: #0a0908;
          color: #ebe3d6;
          padding: 32px;
          font-family: var(--font-body, system-ui);
        }

        .shape-lab__header {
          max-width: 1200px;
          margin: 0 auto 40px;
        }

        .shape-lab__back {
          display: inline-block;
          font-family: var(--font-data, monospace);
          font-size: 12px;
          color: rgba(202, 165, 84, 0.6);
          text-decoration: none;
          margin-bottom: 16px;
        }

        .shape-lab__back:hover {
          color: #caa554;
        }

        .shape-lab__title {
          font-family: var(--font-display, serif);
          font-size: 36px;
          font-weight: 400;
          color: #caa554;
          margin: 0 0 8px;
        }

        .shape-lab__subtitle {
          font-size: 14px;
          color: rgba(236, 227, 214, 0.5);
          margin: 0;
        }

        .shape-lab__content {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 40px;
        }

        .shape-lab__controls {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .shape-lab__section {
          background: rgba(236, 227, 214, 0.03);
          border: 1px solid rgba(236, 227, 214, 0.1);
          padding: 16px;
        }

        .shape-lab__section-title {
          font-family: var(--font-data, monospace);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(202, 165, 84, 0.8);
          margin: 0 0 12px;
        }

        .shape-lab__category-buttons {
          display: flex;
          gap: 8px;
        }

        .shape-lab__category-btn {
          flex: 1;
          padding: 8px;
          background: rgba(236, 227, 214, 0.05);
          border: 1px solid rgba(236, 227, 214, 0.15);
          color: rgba(236, 227, 214, 0.6);
          font-family: var(--font-data, monospace);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.15s;
        }

        .shape-lab__category-btn:hover {
          background: rgba(236, 227, 214, 0.1);
          color: #ebe3d6;
        }

        .shape-lab__category-btn.active {
          background: rgba(202, 165, 84, 0.2);
          border-color: #caa554;
          color: #caa554;
        }

        .shape-lab__shape-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 300px;
          overflow-y: auto;
        }

        .shape-lab__shape-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: transparent;
          border: 1px solid transparent;
          color: rgba(236, 227, 214, 0.7);
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }

        .shape-lab__shape-btn:hover {
          background: rgba(236, 227, 214, 0.05);
          border-color: rgba(236, 227, 214, 0.2);
        }

        .shape-lab__shape-btn.active {
          background: rgba(202, 165, 84, 0.15);
          border-color: #caa554;
        }

        .shape-lab__shape-btn.active .shape-lab__shape-name {
          color: #caa554;
        }

        .shape-lab__shape-name {
          font-family: var(--font-body, system-ui);
          font-size: 13px;
        }

        .shape-lab__shape-category {
          font-family: var(--font-data, monospace);
          font-size: 9px;
          text-transform: uppercase;
          color: rgba(236, 227, 214, 0.4);
        }

        .shape-lab__param {
          margin-bottom: 16px;
        }

        .shape-lab__param:last-child {
          margin-bottom: 0;
        }

        .shape-lab__param-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-data, monospace);
          font-size: 11px;
          color: rgba(236, 227, 214, 0.7);
          margin-bottom: 8px;
        }

        .shape-lab__randomize {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          opacity: 0.6;
          transition: opacity 0.15s;
        }

        .shape-lab__randomize:hover {
          opacity: 1;
        }

        .shape-lab__slider {
          width: 100%;
          height: 4px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(236, 227, 214, 0.15);
          outline: none;
        }

        .shape-lab__slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          background: #caa554;
          cursor: pointer;
        }

        .shape-lab__info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .shape-lab__info-row {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-data, monospace);
          font-size: 11px;
        }

        .shape-lab__info-row span:first-child {
          color: rgba(236, 227, 214, 0.5);
        }

        .shape-lab__info-row code {
          background: rgba(0, 0, 0, 0.3);
          padding: 2px 6px;
          font-size: 10px;
        }

        .shape-lab__previews {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .shape-lab__preview-panel {
          background: rgba(236, 227, 214, 0.02);
          border: 1px solid rgba(236, 227, 214, 0.1);
          padding: 20px;
        }

        .shape-lab__preview-title {
          font-family: var(--font-data, monospace);
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #caa554;
          margin: 0 0 4px;
        }

        .shape-lab__preview-desc {
          font-size: 12px;
          color: rgba(236, 227, 214, 0.4);
          margin: 0 0 16px;
        }

        .shape-lab__canvas-container {
          display: flex;
          justify-content: center;
          align-items: center;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(236, 227, 214, 0.1);
          padding: 20px;
        }

        @media (max-width: 900px) {
          .shape-lab__content {
            grid-template-columns: 1fr;
          }

          .shape-lab__previews {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
