"use client";

/**
 * /test/services-hologram
 *
 * Look-dev lab for the Services hologram centerpiece: the brandmark as a
 * volumetric armillary artifact that morphs open from its flat glyph, with
 * the three service orbits as real 3D rings sharing the same perspective
 * camera. Drag to orbit, scroll to zoom, scrub "Fly-in" to drive the morph.
 *
 * Prototype surface only — the scene (`ServicesHologramScene`) is host-
 * agnostic and gets promoted into the production Services stage once the
 * look is locked.
 */

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ServicesHologramScene } from "@/components/landing/home-v2/services/hologram";

const PALETTE = {
  void: "#050403",
  panel: "rgba(16, 13, 10, 0.82)",
  border: "rgba(202, 165, 84, 0.25)",
  gold: "#caa554",
  dawn: "#ebe3d6",
  dim: "rgba(235, 227, 214, 0.5)",
};

interface Settings {
  flyIn: number;
  autoMorph: boolean;
  density: number;
  autoRotate: number;
  pointSize: number;
  opacity: number;
  scale: number;
  showOrbits: boolean;
  showShell: boolean;
  color: string;
  accentColor: string;
  bloom: boolean;
  bloomIntensity: number;
  scanGain: number;
}

const DEFAULTS: Settings = {
  flyIn: 1,
  autoMorph: false,
  density: 1,
  autoRotate: 0.12,
  pointSize: 4.5,
  opacity: 0.92,
  scale: 1,
  showOrbits: true,
  showShell: true,
  color: "#caa554",
  accentColor: "#ebe3d6",
  bloom: true,
  bloomIntensity: 0.85,
  scanGain: 0.6,
};

function Slider({
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
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: "block", marginBottom: 10 }}>
      <span
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          letterSpacing: "0.04em",
          color: PALETTE.dim,
          marginBottom: 4,
        }}
      >
        <span>{label}</span>
        <span style={{ color: PALETTE.gold }}>{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: PALETTE.gold }}
      />
    </label>
  );
}

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
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11,
        letterSpacing: "0.04em",
        color: PALETTE.dim,
        marginBottom: 10,
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: PALETTE.gold }}
      />
      {label}
    </label>
  );
}

export default function ServicesHologramLabPage() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  // Auto-morph: triangle wave 0 → 1 → 0.
  useEffect(() => {
    if (!s.autoMorph) return;
    let raf = 0;
    let start: number | null = null;
    const period = 6500;
    const loop = (ts: number) => {
      if (start === null) start = ts;
      const phase = ((ts - start) % period) / period;
      const tri = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
      setS((prev) => ({ ...prev, flyIn: tri }));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [s.autoMorph]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: `radial-gradient(120% 90% at 50% 45%, #0c0a07 0%, ${PALETTE.void} 70%)`,
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 3.6], fov: 38, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ServicesHologramScene
          flyIn={s.flyIn}
          density={s.density}
          orbitsRotate={s.autoRotate}
          pointSize={s.pointSize}
          opacity={s.opacity}
          scale={s.scale}
          color={s.color}
          accentColor={s.accentColor}
          scanGain={s.scanGain}
          shellCount={s.showShell ? 900 : 0}
          showOrbits={s.showOrbits}
        />
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={1.8}
          maxDistance={9}
          rotateSpeed={0.7}
          minPolarAngle={Math.PI * 0.22}
          maxPolarAngle={Math.PI * 0.78}
        />
        {s.bloom && (
          <EffectComposer>
            <Bloom
              intensity={s.bloomIntensity}
              luminanceThreshold={0.18}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        )}
      </Canvas>

      {/* ── Control panel ─────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          width: 260,
          padding: 18,
          background: PALETTE.panel,
          backdropFilter: "blur(12px)",
          border: `1px solid ${PALETTE.border}`,
          borderRadius: 10,
          fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
          color: PALETTE.dawn,
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.12em",
            color: PALETTE.gold,
            marginBottom: 14,
            textTransform: "uppercase",
          }}
        >
          Services Hologram
        </div>

        <Slider
          label="Fly-in (morph)"
          value={s.flyIn}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => set("flyIn", v)}
        />
        <Toggle
          label="Auto-morph loop"
          checked={s.autoMorph}
          onChange={(v) => set("autoMorph", v)}
        />
        <Slider
          label="Density"
          value={s.density}
          min={0.1}
          max={1}
          step={0.01}
          onChange={(v) => set("density", v)}
        />
        <Slider
          label="Orbit spin"
          value={s.autoRotate}
          min={0}
          max={0.4}
          step={0.01}
          onChange={(v) => set("autoRotate", v)}
        />
        <Slider
          label="Point size"
          value={s.pointSize}
          min={1}
          max={12}
          step={0.1}
          onChange={(v) => set("pointSize", v)}
        />
        <Slider
          label="Opacity"
          value={s.opacity}
          min={0.1}
          max={1}
          step={0.01}
          onChange={(v) => set("opacity", v)}
        />
        <Slider
          label="Scale"
          value={s.scale}
          min={0.5}
          max={1.8}
          step={0.01}
          onChange={(v) => set("scale", v)}
        />

        <div style={{ height: 1, background: PALETTE.border, margin: "12px 0" }} />

        <Toggle label="Show orbits" checked={s.showOrbits} onChange={(v) => set("showOrbits", v)} />
        <Toggle
          label="Show dust shell"
          checked={s.showShell}
          onChange={(v) => set("showShell", v)}
        />

        <div style={{ height: 1, background: PALETTE.border, margin: "12px 0" }} />

        <Toggle label="Bloom glow" checked={s.bloom} onChange={(v) => set("bloom", v)} />
        <Slider
          label="Bloom intensity"
          value={s.bloomIntensity}
          min={0}
          max={2}
          step={0.05}
          onChange={(v) => set("bloomIntensity", v)}
        />
        <Slider
          label="Scan sweep"
          value={s.scanGain}
          min={0}
          max={1.5}
          step={0.05}
          onChange={(v) => set("scanGain", v)}
        />

        <button
          onClick={() => setS(DEFAULTS)}
          style={{
            marginTop: 6,
            width: "100%",
            padding: "8px 0",
            background: "transparent",
            border: `1px solid ${PALETTE.border}`,
            borderRadius: 6,
            color: PALETTE.gold,
            fontSize: 11,
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          RESET
        </button>
      </div>

      <Link
        href="/test"
        style={{
          position: "absolute",
          bottom: 18,
          left: 22,
          fontSize: 11,
          letterSpacing: "0.08em",
          color: PALETTE.dim,
          fontFamily: "ui-monospace, monospace",
          textDecoration: "none",
        }}
      >
        ← /test
      </Link>
    </div>
  );
}
