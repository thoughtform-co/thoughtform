"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AdminGate } from "@/components/admin/AdminGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";
import { getAllShapes, getShapeGenerator, type Vec3 } from "@/lib/particle-geometry";
import "./shape-lab.css";

const GatewayLabTab = dynamic(() => import("./GatewayLabTab"), {
  ssr: false,
  loading: () => <div className="lab__loading">Loading Gateway Lab...</div>,
});

// ═══════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════

const GRID = 3;

interface ShapePreset {
  id: string;
  name: string;
  shapeId: string;
  seed: number;
  pointCount: number;
  density?: number;
  particleSize?: number;
  category: string;
  createdAt: string;
  updatedAt: string;
}

type LabTab = "particles" | "gateway" | "landmarks";

function snap(value: number): number {
  return Math.floor(value / GRID) * GRID;
}

// ═══════════════════════════════════════════════════════════════
// THOUGHTFORM LOGO
// ═══════════════════════════════════════════════════════════════

function ThoughtformLogo({ size = 24, color = "#caa554" }: { size?: number; color?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 430.99 436"
      width={size}
      height={size}
      fill={color}
    >
      <path d="M336.78,99.43c18.82,18.93,33.41,41.16,43.78,66.63,5.03,12.35,8.81,24.86,11.42,37.57h19.62c-1.91-18.99-6.54-37.52-13.79-55.54-10.01-24.71-24.56-46.73-43.78-66.02-19.17-19.29-41.16-33.97-65.92-43.99-7.9-3.24-15.9-5.92-23.95-8.1l-1.36,7.49-.9,4.91-1.41,7.49c2.87,1.11,5.79,2.28,8.65,3.54,25.51,10.99,48.06,26.33,67.63,46.02h.01Z" />
      <path d="M383.13,314.65c-8.61,22.23-21.59,41.97-38.85,59.38-16.91,16.61-35.23,29.06-55,37.36-19.78,8.3-40.21,12.45-61.29,12.45-11.68,0-23.35-1.22-34.92-3.7-2.47-.46-4.93-1.01-7.4-1.67-2.42-.61-4.88-1.27-7.3-2.02-7.4-2.18-14.74-4.91-22.14-8.1-1.21-.51-2.47-1.06-3.67-1.62-1.16-.51-2.31-1.06-3.42-1.62-2.37-1.11-4.73-2.28-7.05-3.49-20.78-10.83-39.75-24.86-56.91-42.07-19.98-19.69-35.63-42.88-46.9-69.56-5.38-12.61-9.46-25.36-12.28-38.22-.6-2.53-1.11-5.06-1.56-7.59s-.85-5.06-1.21-7.59c-.81-5.87-1.41-11.85-1.71-17.77-.1-2.53-.2-5.06-.2-7.59-.05-.96-.05-1.92-.05-2.89,0-1.57,0-3.14.1-4.71.45-21.06,4.48-41.21,11.98-60.45,8.1-20.66,20.53-39.49,37.44-56.45,16.86-17.01,35.48-29.57,55.86-37.67,20.33-8.1,41.62-12.2,63.91-12.2,5.99,0,11.93.25,17.86.81l2.72-14.68c-26.82,0-53.19,5.32-79,15.95-25.92,10.63-49.06,26.12-69.39,46.63-20.73,20.81-36.38,43.99-46.95,69.51-6.59,15.85-11.12,32.05-13.59,48.55-.35,2.53-.7,5.06-.96,7.59-.3,2.53-.5,5.06-.7,7.59-.35,5.01-.55,10.02-.55,15.04,0,.91,0,1.82.05,2.73,0,2.53.1,5.06.25,7.59.1,2.53.25,5.06.5,7.59,1.76,19.9,6.49,39.24,14.14,57.97,9.96,24.3,24.56,46.12,43.78,65.41,19.93,19.74,42.57,34.78,67.93,45.21,3.72,1.52,7.5,2.99,11.27,4.25,2.42.86,4.83,1.67,7.25,2.38,2.42.76,4.88,1.47,7.3,2.13,7.5,2.03,15.1,3.59,22.74,4.71,2.52.35,5.03.71,7.55.96,2.52.3,5.03.51,7.55.66,4.88.41,9.76.56,14.64.56,26.87,0,52.84-5.11,78-15.34,25.16-10.23,47.71-25.41,67.68-45.51,20.33-20.81,35.78-44.2,46.35-70.07,7.1-17.42,11.78-35.18,14.09-53.31h-15.1c-.71,21.82-4.98,42.78-12.83,62.88h-.01Z" />
      <path d="M29.12,218.81l132.09-.05v.05H29.12h0Z" />
      <path d="M163.32,250.35l12.58.05h-12.58v-.05Z" />
      <path d="M179.17,408.81l30.34-158.46-29.79,158.61s-.35-.1-.55-.15h0Z" />
      <path d="M430.98,218.81l-5.23,17.77h-184.93l-10.32.05-2.47,13.72h-18.52l-30.34,158.46c-7.2-2.23-14.44-4.96-21.59-8.1l24.05-132.9h-8.86l3.12-17.42h-20.73l2.57-13.77H30.87c-.86-5.87-1.46-11.8-1.76-17.77h132.09l10.32-.05,2.47-13.72h18.52l29.54-157.85,1.36-7.49,1.41-7.44.2-1.21,1.41-7.49,1.36-7.44L230.76.06h23.6l-3.52,19.14-1.36,7.44-1.41,7.49-.65,3.44-1.36,7.49-1.41,7.54-23.9,129.71h.6l13.49.1-4.78,21.52h17.01l-.2,1.16-2.57,13.77h186.69v-.05h-.01Z" />
      <path d="M254.35,0l-33.01,182.26h-.6L254.35,0h0Z" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// INFINITE CANVAS
// ═══════════════════════════════════════════════════════════════

interface InfiniteCanvasProps {
  shapeId: string;
  seed: number;
  pointCount: number;
  density: number;
  particleSize: number;
  trailLength: number;
  autoRotate: boolean;
  rotationSpeed: number;
  rotationX: number;
  rotationY: number;
  gridSnap: boolean;
  vfxEnabled: boolean;
  glowIntensity: number;
  softness: number;
  bloomRadius: number;
}

function InfiniteCanvas({
  shapeId,
  seed,
  pointCount,
  density,
  particleSize,
  trailLength,
  autoRotate,
  rotationSpeed,
  rotationX,
  rotationY,
  gridSnap,
  vfxEnabled,
  glowIntensity,
  softness,
  bloomRadius,
}: InfiniteCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<
    Array<{
      x: number;
      y: number;
      z: number;
      baseX: number;
      baseY: number;
      baseZ: number;
      vx: number;
      vy: number;
      phase: number;
      energy: number;
    }>
  >([]);

  // Generate particles
  useEffect(() => {
    const generator = getShapeGenerator(shapeId);
    const points3D: Vec3[] = generator({ seed, pointCount, size: 1 });

    particlesRef.current = points3D.map((p) => ({
      x: p.x,
      y: p.y,
      z: p.z,
      baseX: p.x,
      baseY: p.y,
      baseZ: p.z,
      vx: 0,
      vy: 0,
      phase: Math.random() * Math.PI * 2,
      energy: 0.5 + Math.random() * 0.5,
    }));
  }, [shapeId, seed, pointCount]);

  // Canvas setup and rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    // Wheel zoom
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
      zoomRef.current = Math.max(0.3, Math.min(5, zoomRef.current * zoomDelta));
    };

    // Pan
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      panRef.current.x += dx;
      panRef.current.y += dy;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    function render() {
      if (!ctx || !canvas) return;
      const time = timeRef.current;
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      // Clear
      if (vfxEnabled && trailLength > 0) {
        ctx.fillStyle = `rgba(10, 10, 12, ${1 - trailLength * 0.1})`;
        ctx.fillRect(0, 0, width, height);
        if (time % 60 === 0) {
          ctx.fillStyle = "#0a0a0c";
          ctx.fillRect(0, 0, width, height);
        }
      } else {
        ctx.fillStyle = "#0a0a0c";
        ctx.fillRect(0, 0, width, height);
      }

      const cx = width / 2 + panRef.current.x;
      const cy = height / 2 + panRef.current.y;
      const baseScale = Math.min(width, height) * 0.35 * zoomRef.current;

      const rotY = autoRotate ? time * 0.01 * rotationSpeed : rotationY;
      const rotX = rotationX;
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const particles = particlesRef.current;
      const projected: Array<{ x: number; y: number; z: number; energy: number }> = [];

      for (const p of particles) {
        let x = p.baseX;
        let y = p.baseY;
        let z = p.baseZ;

        // Y rotation
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        // X rotation
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const scale = 1 / (1 + z2 * 0.3);
        let screenX = cx + x1 * baseScale * scale;
        let screenY = cy + y2 * baseScale * scale;

        if (gridSnap) {
          screenX = snap(screenX);
          screenY = snap(screenY);
        }

        projected.push({ x: screenX, y: screenY, z: z2, energy: p.energy });
      }

      // Sort by z
      projected.sort((a, b) => a.z - b.z);

      // Draw particles
      for (const p of projected) {
        const depth = (p.z + 1) / 2;
        const alpha = 0.3 + depth * 0.7;
        const size = (1 + depth * 1.5) * particleSize * density;

        if (vfxEnabled) {
          // Enhanced glow
          const gradient = ctx.createRadialGradient(
            p.x,
            p.y,
            0,
            p.x,
            p.y,
            size * (2 + bloomRadius * 3)
          );
          gradient.addColorStop(0, `rgba(202, 165, 84, ${alpha * p.energy * glowIntensity})`);
          gradient.addColorStop(
            0.3 * softness,
            `rgba(202, 165, 84, ${alpha * 0.5 * glowIntensity})`
          );
          gradient.addColorStop(1, "rgba(202, 165, 84, 0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, size * (2 + bloomRadius * 3), 0, Math.PI * 2);
          ctx.fill();
        }

        // Core particle
        ctx.fillStyle = `rgba(235, 227, 214, ${alpha})`;
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      }

      timeRef.current++;
      animationRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    shapeId,
    seed,
    pointCount,
    density,
    particleSize,
    trailLength,
    autoRotate,
    rotationSpeed,
    rotationX,
    rotationY,
    gridSnap,
    vfxEnabled,
    glowIntensity,
    softness,
    bloomRadius,
  ]);

  return (
    <div ref={containerRef} className="lab-canvas">
      <canvas ref={canvasRef} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SLIDER CONTROL
// ═══════════════════════════════════════════════════════════════

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  const decimals = step < 1 ? (step < 0.1 ? 2 : 1) : 0;
  return (
    <div className="lab-slider">
      <div className="lab-slider__header">
        <label>{label}</label>
        <span className="lab-slider__value">
          {value.toFixed(decimals)}
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
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TOGGLE CONTROL
// ═══════════════════════════════════════════════════════════════

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="lab-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

// ═══════════════════════════════════════════════════════════════
// PARTICLES TAB CONTENT
// ═══════════════════════════════════════════════════════════════

function ParticlesTab() {
  const [shapeId, setShapeId] = useState("filament-field");
  const [seed, setSeed] = useState(42);
  const [pointCount, setPointCount] = useState(400);
  const [density, setDensity] = useState(1);
  const [particleSize, setParticleSize] = useState(1);
  const [trailLength, setTrailLength] = useState(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [rotationX, setRotationX] = useState(0.3);
  const [rotationY, setRotationY] = useState(-0.04);
  const [gridSnap, setGridSnap] = useState(true);
  const [vfxEnabled, setVfxEnabled] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0.6);
  const [softness, setSoftness] = useState(0.7);
  const [bloomRadius, setBloomRadius] = useState(0.4);

  const [presets, setPresets] = useState<ShapePreset[]>([]);
  const [presetName, setPresetName] = useState("");

  // Default values
  const DEFAULT_POINT_COUNT = 400;
  const DEFAULT_DENSITY = 1.0;
  const DEFAULT_PARTICLE_SIZE = 1.0;

  const resetToDefaults = useCallback(() => {
    setPointCount(DEFAULT_POINT_COUNT);
    setDensity(DEFAULT_DENSITY);
    setParticleSize(DEFAULT_PARTICLE_SIZE);
  }, []);

  // Group shapes by category
  const shapesByCategory = useMemo(() => {
    const allShapes = getAllShapes();
    const grouped: Record<string, typeof allShapes> = {};
    for (const shape of allShapes) {
      const cat = shape.category || "Other";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(shape);
    }
    return grouped;
  }, []);

  // Load presets
  useEffect(() => {
    fetch("/api/shape-presets")
      .then((r) => r.json())
      .then((data) => setPresets(data.presets || []))
      .catch(console.error);
  }, []);

  const savePreset = useCallback(async () => {
    if (!presetName.trim()) return;
    try {
      const res = await fetch("/api/shape-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: presetName,
          shapeId,
          seed,
          pointCount,
          density,
          particleSize,
          category: "custom",
        }),
      });
      const data = await res.json();
      if (data.preset) {
        setPresets((prev) => [...prev, data.preset]);
        setPresetName("");
      }
    } catch (e) {
      console.error(e);
    }
  }, [presetName, shapeId, seed, pointCount, density, particleSize]);

  const loadPreset = useCallback((preset: ShapePreset) => {
    setShapeId(preset.shapeId);
    setSeed(preset.seed);
    setPointCount(preset.pointCount);
    if (preset.density !== undefined) setDensity(preset.density);
    if (preset.particleSize !== undefined) setParticleSize(preset.particleSize);
  }, []);

  const deletePreset = useCallback(async (id: string) => {
    try {
      await fetch(`/api/shape-presets?id=${id}`, { method: "DELETE" });
      setPresets((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const currentShape = getAllShapes().find((s) => s.id === shapeId);

  return (
    <div className="particles-tab">
      {/* Full-screen Canvas Background */}
      <div className="lab-canvas">
        <InfiniteCanvas
          shapeId={shapeId}
          seed={seed}
          pointCount={pointCount}
          density={density}
          particleSize={particleSize}
          trailLength={trailLength}
          autoRotate={autoRotate}
          rotationSpeed={rotationSpeed}
          rotationX={rotationX}
          rotationY={rotationY}
          gridSnap={gridSnap}
          vfxEnabled={vfxEnabled}
          glowIntensity={glowIntensity}
          softness={softness}
          bloomRadius={bloomRadius}
        />
      </div>

      {/* Left Panel - Presets & Shapes */}
      <aside className="lab-panel lab-panel--left">
        <div className="panel-section">
          <div className="lab__save-preset">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name..."
              onKeyDown={(e) => e.key === "Enter" && savePreset()}
            />
            <button onClick={savePreset} disabled={!presetName.trim()}>
              +
            </button>
          </div>
          <button className="lab__reset-btn" onClick={resetToDefaults}>
            Reset to Default
          </button>
        </div>

        {presets.length > 0 && (
          <div className="panel-section">
            <div className="panel-label">Saved</div>
            <div className="preset-list">
              {presets.map((p) => (
                <div key={p.id} className="preset-item">
                  <button className="preset-load" onClick={() => loadPreset(p)}>
                    {p.name}
                  </button>
                  <button className="preset-delete" onClick={() => deletePreset(p.id)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.entries(shapesByCategory).map(([category, shapes]) => (
          <div key={category} className="panel-section">
            <div className="panel-label">{category}</div>
            <div className="shape-list">
              {shapes.map((shape) => (
                <button
                  key={shape.id}
                  className={`shape-btn ${shapeId === shape.id ? "active" : ""}`}
                  onClick={() => setShapeId(shape.id)}
                >
                  {shape.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </aside>

      {/* Canvas Area - Header Only */}
      <main className="lab-main">
        <div className="lab-main__header">
          <span className="shape-name">{currentShape?.label || shapeId}</span>
        </div>
      </main>

      {/* Right Panel - Parameters */}
      <aside className="lab-panel lab-panel--right">
        <div className="panel-section">
          <div className="panel-label">Seed</div>
          <div className="seed-row">
            <Slider label="" value={seed} min={1} max={999} onChange={setSeed} />
            <button
              className="icon-btn"
              onClick={() => setSeed(Math.floor(Math.random() * 999) + 1)}
            >
              🎲
            </button>
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-label">Parameters</div>
          <Slider label="Points" value={pointCount} min={50} max={2000} onChange={setPointCount} />
          <Slider
            label="Density"
            value={density}
            min={0.1}
            max={3}
            step={0.1}
            onChange={setDensity}
            suffix="x"
          />
          <Slider
            label="Size"
            value={particleSize}
            min={0.5}
            max={3}
            step={0.1}
            onChange={setParticleSize}
            suffix="x"
          />
          <Toggle label="Grid Snap" checked={gridSnap} onChange={setGridSnap} />
        </div>

        <div className="panel-section">
          <div className="panel-label">Rotation</div>
          <Toggle label="Auto Rotate" checked={autoRotate} onChange={setAutoRotate} />
          {autoRotate && (
            <Slider
              label="Speed"
              value={rotationSpeed}
              min={0.1}
              max={3}
              step={0.1}
              onChange={setRotationSpeed}
              suffix="x"
            />
          )}
          <Slider
            label="X"
            value={rotationX}
            min={-Math.PI}
            max={Math.PI}
            step={0.01}
            onChange={setRotationX}
          />
          <Slider
            label="Y"
            value={rotationY}
            min={-Math.PI}
            max={Math.PI}
            step={0.01}
            onChange={setRotationY}
          />
        </div>

        <div className="panel-section">
          <div className="panel-label">VFX</div>
          <Toggle label="Enable" checked={vfxEnabled} onChange={setVfxEnabled} />
          {vfxEnabled && (
            <>
              <Slider
                label="Glow"
                value={glowIntensity}
                min={0}
                max={1}
                step={0.1}
                onChange={setGlowIntensity}
              />
              <Slider
                label="Softness"
                value={softness}
                min={0.1}
                max={1}
                step={0.1}
                onChange={setSoftness}
              />
              <Slider
                label="Bloom"
                value={bloomRadius}
                min={0}
                max={1}
                step={0.1}
                onChange={setBloomRadius}
              />
              <Slider
                label="Trail"
                value={trailLength}
                min={0}
                max={5}
                step={0.5}
                onChange={setTrailLength}
              />
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN SHAPE LAB
// ═══════════════════════════════════════════════════════════════

function ShapeLabContent() {
  const [activeTab, setActiveTab] = useState<LabTab>("particles");

  return (
    <div className="shape-lab">
      {/* HUD Frame Elements */}
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />
      <div className="hud-corner hud-corner-bl" />
      <div className="hud-corner hud-corner-br" />

      {/* Left Rail */}
      <aside className="hud-rail hud-rail-left">
        <div className="rail-scale">
          <div className="scale-ticks">
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} className={`tick ${i % 5 === 0 ? "tick-major" : "tick-minor"}`} />
            ))}
          </div>
        </div>
      </aside>

      {/* Right Rail */}
      <aside className="hud-rail hud-rail-right">
        <div className="rail-scale">
          <div className="scale-ticks">
            {Array.from({ length: 21 }).map((_, i) => (
              <div key={i} className={`tick ${i % 5 === 0 ? "tick-major" : "tick-minor"}`} />
            ))}
          </div>
        </div>
        <div className="rail-markers">
          {[
            { id: "particles", label: "01" },
            { id: "gateway", label: "02" },
            { id: "landmarks", label: "03" },
          ].map((marker) => (
            <button
              key={marker.id}
              className={`section-marker ${activeTab === marker.id ? "active" : ""}`}
              onClick={() => setActiveTab(marker.id as LabTab)}
            >
              <span className="marker-label">{marker.label}</span>
              <span className="marker-dot" />
            </button>
          ))}
        </div>
      </aside>

      {/* Navigation Bar */}
      <nav className="lab-nav">
        <Link href="/" className="lab-nav__logo">
          <ThoughtformLogo size={22} color="#caa554" />
        </Link>
        <div className="lab-nav__tabs">
          <button
            className={`lab-nav__tab ${activeTab === "particles" ? "active" : ""}`}
            onClick={() => setActiveTab("particles")}
          >
            <span className="tab-icon">◇</span>
            <span>Particles</span>
          </button>
          <button
            className={`lab-nav__tab ${activeTab === "gateway" ? "active" : ""}`}
            onClick={() => setActiveTab("gateway")}
          >
            <span className="tab-icon">◉</span>
            <span>Gateway</span>
          </button>
          <button
            className={`lab-nav__tab ${activeTab === "landmarks" ? "active" : ""}`}
            onClick={() => setActiveTab("landmarks")}
          >
            <span className="tab-icon">◈</span>
            <span>Landmarks</span>
          </button>
        </div>
      </nav>

      {/* Content Area */}
      <div className="lab-content">
        {activeTab === "particles" && <ParticlesTab />}
        {activeTab === "gateway" && (
          <Suspense fallback={<div className="lab__loading">Loading...</div>}>
            <GatewayLabTab />
          </Suspense>
        )}
        {activeTab === "landmarks" && (
          <div className="lab-placeholder">
            <span className="placeholder-icon">◈</span>
            <h3>Landmarks Lab</h3>
            <p>3D rotating particle landmarks</p>
            <p className="placeholder-note">Coming soon...</p>
          </div>
        )}
      </div>

      {/* Bottom Status */}
      <footer className="lab-footer">
        <div className="footer-coords">
          <span>δ: 0.42</span>
          <span>θ: 45.0°</span>
        </div>
        <div className="footer-hint">Scroll to zoom • Drag to pan</div>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPORT WITH AUTH
// ═══════════════════════════════════════════════════════════════

export default function ShapeLab() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="lab lab--loading">
        <span className="lab__loading">Loading...</span>
      </div>
    );
  }

  if (!user?.email || !isAllowedUserEmail(user.email)) {
    return (
      <div className="lab lab--unauthorized">
        <h1>Shape Lab</h1>
        <p>This tool requires authentication.</p>
        <Link href="/" className="lab__btn">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <AdminGate>
      <ShapeLabContent />
    </AdminGate>
  );
}
