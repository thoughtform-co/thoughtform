"use client";

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AdminGate } from "@/components/admin/AdminGate";
import { useAuth } from "@/components/auth/AuthProvider";
import { isAllowedUserEmail } from "@/lib/auth/allowed-user";
import {
  getAllShapes,
  getShapeGenerator,
  getShapesByCategory,
  type Vec3,
} from "@/lib/particle-geometry";
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
// NAVIGATION BAR
// ═══════════════════════════════════════════════════════════════

function LabNavbar() {
  return (
    <div className="lab-navbar">
      <nav className="lab-navbar__inner">
        <Link href="/" className="lab-navbar__logo">
          <ThoughtformLogo size={22} color="#caa554" />
        </Link>
        <Link href="/" className="lab-navbar__link">
          Home
        </Link>
        <span className="lab-navbar__link lab-navbar__link--active">Shape Lab</span>
        <span className="lab-navbar__badge">ADMIN</span>
      </nav>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COLLAPSIBLE SECTION
// ═══════════════════════════════════════════════════════════════

function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="lab-section">
      <button className="lab-section__header" onClick={onToggle}>
        <span>{title}</span>
        <span className="lab-section__icon">{expanded ? "−" : "+"}</span>
      </button>
      {expanded && <div className="lab-section__content">{children}</div>}
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
// INFINITE CANVAS (Scroll to Zoom)
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

  // Generate particles when shape/seed/pointCount changes
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

    // Resize handler
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

    // Pan with mouse drag
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

    // Render loop
    function render() {
      if (!ctx || !canvas) return;
      const time = timeRef.current;
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      // Clear with trail effect
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

      const zoom = zoomRef.current;
      const panX = panRef.current.x;
      const panY = panRef.current.y;
      const centerX = width / 2 + panX;
      const centerY = height / 2 + panY;
      const scale = Math.min(width, height) * 0.28 * zoom;

      // Rotation
      const rotY = autoRotate ? time * 0.003 * rotationSpeed + rotationY : rotationY;
      const rotXVal = autoRotate ? rotationX + Math.sin(time * 0.001) * 0.05 : rotationX;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotXVal);
      const sinX = Math.sin(rotXVal);

      const projected: Array<{
        x: number;
        y: number;
        z: number;
        alpha: number;
        size: number;
        energy: number;
      }> = [];

      for (const p of particlesRef.current) {
        // Subtle animation
        const noiseX = Math.sin(time * 0.008 + p.phase) * 0.015;
        const noiseY = Math.cos(time * 0.006 + p.phase * 1.3) * 0.015;

        const dx = p.baseX - p.x;
        const dy = p.baseY - p.y;
        p.vx += dx * 0.02 + noiseX;
        p.vy += dy * 0.02 + noiseY;
        p.x += p.vx;
        p.y += p.vy;
        p.z = p.baseZ + Math.sin(time * 0.007 + p.phase * 0.7) * 0.02;
        p.vx *= 0.92;
        p.vy *= 0.92;
        p.energy = 0.5 + Math.sin(time * 0.02 + p.phase) * 0.3 + Math.random() * 0.2;

        // 3D rotation
        let x = p.x * cosY + p.z * sinY;
        let z = -p.x * sinY + p.z * cosY;
        let y = p.y * cosX - z * sinX;
        const newZ = p.y * sinX + z * cosX;
        z = newZ;

        const depth = z + 2.5;
        if (depth <= 0.2) continue;

        const perspectiveScale = 2 / depth;
        const screenX = centerX + x * scale * perspectiveScale;
        const screenY = centerY - y * scale * perspectiveScale;
        const normalizedZ = Math.max(0, Math.min(1, (z + 1.5) / 3));
        const depthAlpha = 0.2 + (1 - normalizedZ) * 0.8;

        const baseSize = (2 + (1 - normalizedZ) * 3) * particleSize * density;

        projected.push({
          x: screenX,
          y: screenY,
          z: normalizedZ,
          alpha: depthAlpha,
          size: baseSize * p.energy,
          energy: p.energy,
        });
      }

      projected.sort((a, b) => b.z - a.z);

      if (vfxEnabled) {
        ctx.globalCompositeOperation = "lighter";
      }

      for (const p of projected) {
        const goldR = 212,
          goldG = 175,
          goldB = 55;

        // Glow effect
        if (vfxEnabled && glowIntensity > 0) {
          ctx.save();
          ctx.shadowColor = `rgba(${goldR}, ${goldG}, ${goldB}, ${p.alpha * glowIntensity})`;
          ctx.shadowBlur = p.size * (2 + bloomRadius * 6);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${goldR}, ${goldG}, ${goldB}, ${p.alpha * 0.3})`;
          ctx.fill();
          ctx.restore();
        }

        // Soft particle
        if (vfxEnabled && softness > 0) {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * softness);
          gradient.addColorStop(0, `rgba(${goldR}, ${goldG}, ${goldB}, ${p.alpha})`);
          gradient.addColorStop(0.4, `rgba(${goldR}, ${goldG}, ${goldB}, ${p.alpha * 0.5})`);
          gradient.addColorStop(1, `rgba(${goldR}, ${goldG}, ${goldB}, 0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * softness, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // Core particle
        const coreR = Math.min(255, goldR + 50);
        const coreG = Math.min(255, goldG + 50);
        const coreB = Math.min(255, goldB + 30);

        ctx.fillStyle = `rgba(${coreR}, ${coreG}, ${coreB}, ${p.alpha})`;

        if (gridSnap) {
          const px = snap(p.x);
          const py = snap(p.y);
          const coreSize = vfxEnabled
            ? Math.max(GRID - 1, p.size * (1 - softness) * 0.5)
            : GRID - 1;
          ctx.fillRect(px, py, coreSize, coreSize);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalCompositeOperation = "source-over";
      timeRef.current++;
      animationRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      resizeObserver.disconnect();
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    autoRotate,
    rotationSpeed,
    rotationX,
    rotationY,
    gridSnap,
    vfxEnabled,
    glowIntensity,
    softness,
    bloomRadius,
    particleSize,
    density,
    trailLength,
  ]);

  return (
    <div ref={containerRef} className="lab-canvas">
      <canvas ref={canvasRef} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PARTICLES TAB
// ═══════════════════════════════════════════════════════════════

function ParticlesTab() {
  const [selectedShape, setSelectedShape] = useState("tf_filamentField");

  // Seed
  const [seed, setSeed] = useState(42);

  // Parameters
  const [pointCount, setPointCount] = useState(400);
  const [density, setDensity] = useState(1);
  const [particleSize, setParticleSize] = useState(1);
  const [trailLength, setTrailLength] = useState(0);

  // 3D & Rotation
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [rotationX, setRotationX] = useState(0.3);
  const [rotationY, setRotationY] = useState(0);
  const [gridSnap, setGridSnap] = useState(true);

  // VFX
  const [vfxEnabled, setVfxEnabled] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(0.6);
  const [softness, setSoftness] = useState(0.7);
  const [bloomRadius, setBloomRadius] = useState(0.4);

  // Expanded sections
  const [expanded, setExpanded] = useState({
    seed: true,
    parameters: true,
    rotation: true,
    vfx: false,
  });

  const toggleSection = (key: keyof typeof expanded) => {
    setExpanded((s) => ({ ...s, [key]: !s[key] }));
  };

  // Presets
  const [presets, setPresets] = useState<ShapePreset[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(true);
  const [presetName, setPresetName] = useState("");
  const [savingPreset, setSavingPreset] = useState(false);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      setPresetsLoading(true);
      const res = await fetch("/api/shape-presets", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setPresets(data.presets || []);
      }
    } catch (e) {
      console.error("Failed to load presets:", e);
    } finally {
      setPresetsLoading(false);
    }
  };

  const savePreset = async () => {
    if (!presetName.trim()) return;
    try {
      setSavingPreset(true);
      const res = await fetch("/api/shape-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: presetName.trim(),
          shapeId: selectedShape,
          seed,
          pointCount,
          category: "custom",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPresets((prev) => [...prev, data.preset]);
        setPresetName("");
      }
    } catch (e) {
      console.error("Failed to save preset:", e);
    } finally {
      setSavingPreset(false);
    }
  };

  const deletePreset = async (id: string) => {
    try {
      const res = await fetch(`/api/shape-presets?id=${id}`, { method: "DELETE" });
      if (res.ok) setPresets((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error("Failed to delete preset:", e);
    }
  };

  const loadPreset = (preset: ShapePreset) => {
    setSelectedShape(preset.shapeId);
    setSeed(preset.seed);
    setPointCount(preset.pointCount);
  };

  const shapes = useMemo(() => getAllShapes(), []);
  const thoughtformShapes = useMemo(() => getShapesByCategory("thoughtform"), []);
  const geometricShapes = useMemo(() => getShapesByCategory("geometric"), []);
  const selectedShapeInfo = useMemo(
    () => shapes.find((s) => s.id === selectedShape),
    [shapes, selectedShape]
  );

  const handleRandomSeed = useCallback(() => setSeed(Math.floor(Math.random() * 10000)), []);

  return (
    <div className="lab__workspace">
      {/* LEFT PANEL: Library */}
      <aside className="lab__panel lab__panel--left">
        {/* Save Preset */}
        <div className="lab__panel-section">
          <div className="lab__save-preset">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name..."
              onKeyDown={(e) => e.key === "Enter" && savePreset()}
            />
            <button onClick={savePreset} disabled={savingPreset || !presetName.trim()}>
              Save
            </button>
          </div>
        </div>

        {/* Saved Presets */}
        {presets.length > 0 && (
          <div className="lab__panel-section">
            <h4 className="lab__panel-label">Saved</h4>
            <div className="lab__preset-list">
              {presets.map((preset) => (
                <div key={preset.id} className="lab__preset-item">
                  <button className="lab__preset-load" onClick={() => loadPreset(preset)}>
                    {preset.name}
                  </button>
                  <button className="lab__preset-delete" onClick={() => deletePreset(preset.id)}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thoughtform Shapes */}
        <div className="lab__panel-section">
          <h4 className="lab__panel-label">Thoughtform</h4>
          <div className="lab__shape-list">
            {thoughtformShapes.map((shape) => (
              <button
                key={shape.id}
                className={`lab__shape-btn ${selectedShape === shape.id ? "lab__shape-btn--active" : ""}`}
                onClick={() => setSelectedShape(shape.id)}
              >
                {shape.label}
              </button>
            ))}
          </div>
        </div>

        {/* Geometric Shapes */}
        <div className="lab__panel-section">
          <h4 className="lab__panel-label">Geometric</h4>
          <div className="lab__shape-list">
            {geometricShapes.map((shape) => (
              <button
                key={shape.id}
                className={`lab__shape-btn ${selectedShape === shape.id ? "lab__shape-btn--active" : ""}`}
                onClick={() => setSelectedShape(shape.id)}
              >
                {shape.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* CENTER: Infinite Canvas */}
      <main className="lab__main">
        <InfiniteCanvas
          shapeId={selectedShape}
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
        {/* Shape name overlay */}
        <div className="lab__shape-overlay">
          <span className="lab__shape-name">{selectedShapeInfo?.label}</span>
        </div>
      </main>

      {/* RIGHT PANEL: Settings */}
      <aside className="lab__panel lab__panel--right">
        {/* Seed Section */}
        <Section title="Seed" expanded={expanded.seed} onToggle={() => toggleSection("seed")}>
          <div className="lab__param-row">
            <Slider label="Seed" value={seed} min={0} max={9999} step={1} onChange={setSeed} />
            <button className="lab__icon-btn" onClick={handleRandomSeed} title="Randomize">
              🎲
            </button>
          </div>
        </Section>

        {/* Parameters Section */}
        <Section
          title="Parameters"
          expanded={expanded.parameters}
          onToggle={() => toggleSection("parameters")}
        >
          <Slider
            label="Point Count"
            value={pointCount}
            min={50}
            max={1000}
            step={25}
            onChange={setPointCount}
          />
          <Slider
            label="Density"
            value={density}
            min={0.2}
            max={2}
            step={0.1}
            suffix="x"
            onChange={setDensity}
          />
          <Slider
            label="Particle Size"
            value={particleSize}
            min={0.2}
            max={3}
            step={0.1}
            suffix="x"
            onChange={setParticleSize}
          />
          <Slider
            label="Trail Length"
            value={trailLength}
            min={0}
            max={1}
            step={0.1}
            onChange={setTrailLength}
          />
          <Toggle label="Grid Snap (Sigil Mode)" checked={gridSnap} onChange={setGridSnap} />
        </Section>

        {/* 3D & Rotation Section */}
        <Section
          title="3D & Rotation"
          expanded={expanded.rotation}
          onToggle={() => toggleSection("rotation")}
        >
          <Toggle label="Auto Rotate" checked={autoRotate} onChange={setAutoRotate} />
          {autoRotate && (
            <Slider
              label="Rotation Speed"
              value={rotationSpeed}
              min={0}
              max={3}
              step={0.1}
              suffix="x"
              onChange={setRotationSpeed}
            />
          )}
          <Slider
            label="X Rotation"
            value={rotationX}
            min={-1.5}
            max={1.5}
            step={0.05}
            onChange={setRotationX}
          />
          <Slider
            label="Y Rotation"
            value={rotationY}
            min={-3.14}
            max={3.14}
            step={0.1}
            onChange={setRotationY}
          />
        </Section>

        {/* VFX Section */}
        <Section title="VFX" expanded={expanded.vfx} onToggle={() => toggleSection("vfx")}>
          <Toggle label="Enable VFX" checked={vfxEnabled} onChange={setVfxEnabled} />
          {vfxEnabled && (
            <>
              <Slider
                label="Glow Intensity"
                value={glowIntensity}
                min={0}
                max={1}
                step={0.05}
                onChange={setGlowIntensity}
              />
              <Slider
                label="Softness"
                value={softness}
                min={0}
                max={1}
                step={0.05}
                onChange={setSoftness}
              />
              <Slider
                label="Bloom Radius"
                value={bloomRadius}
                min={0}
                max={1}
                step={0.05}
                onChange={setBloomRadius}
              />
            </>
          )}
        </Section>
      </aside>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LANDMARKS TAB (placeholder)
// ═══════════════════════════════════════════════════════════════

function LandmarksTab() {
  return (
    <div className="lab__placeholder">
      <div className="lab__placeholder-icon">◈</div>
      <h3>Landmarks Lab</h3>
      <p>3D rotating particle landmarks with scroll animations.</p>
      <p className="lab__placeholder-note">Coming soon...</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHAPE LAB CONTENT
// ═══════════════════════════════════════════════════════════════

function ShapeLabContent() {
  const [activeTab, setActiveTab] = useState<LabTab>("particles");

  return (
    <div className="lab">
      <LabNavbar />

      {/* Tab Navigation */}
      <nav className="lab__tabs">
        <button
          className={`lab__tab ${activeTab === "particles" ? "lab__tab--active" : ""}`}
          onClick={() => setActiveTab("particles")}
        >
          <span className="lab__tab-icon">◇</span>
          Particles
        </button>
        <button
          className={`lab__tab ${activeTab === "gateway" ? "lab__tab--active" : ""}`}
          onClick={() => setActiveTab("gateway")}
        >
          <span className="lab__tab-icon">◉</span>
          Gateway
        </button>
        <button
          className={`lab__tab ${activeTab === "landmarks" ? "lab__tab--active" : ""}`}
          onClick={() => setActiveTab("landmarks")}
        >
          <span className="lab__tab-icon">◈</span>
          Landmarks
        </button>
      </nav>

      {/* Tab Content */}
      {activeTab === "particles" && <ParticlesTab />}
      {activeTab === "gateway" && (
        <Suspense fallback={<div className="lab__loading">Loading...</div>}>
          <GatewayLabTab />
        </Suspense>
      )}
      {activeTab === "landmarks" && <LandmarksTab />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ADMIN GATE & EXPORT
// ═══════════════════════════════════════════════════════════════

function UnauthorizedView() {
  return (
    <div className="lab lab--unauthorized">
      <h1>Shape Lab</h1>
      <p>This page is restricted to administrators.</p>
      <Link href="/" className="lab__btn">
        ← Return Home
      </Link>
    </div>
  );
}

function AdminGateFallback({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setIsAllowed(true);
      return;
    }
    if (isLoading) {
      setIsAllowed(null);
      return;
    }
    setIsAllowed(isAllowedUserEmail(user?.email));
  }, [user, isLoading]);

  if (isAllowed === null || isAllowed) return null;
  return <>{children}</>;
}

export default function ShapeLabPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="lab lab--loading">
        <p>Loading Shape Lab...</p>
      </div>
    );
  }

  return (
    <>
      <AdminGate>
        <ShapeLabContent />
      </AdminGate>
      <AdminGateFallback>
        <UnauthorizedView />
      </AdminGateFallback>
    </>
  );
}
