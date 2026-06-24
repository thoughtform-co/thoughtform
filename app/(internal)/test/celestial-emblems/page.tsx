"use client";

/**
 * /test/celestial-emblems
 *
 * Look-dev lab for SYMBOLIC astral emblems built from the celestial diagram
 * primitives (pure SVG). Left: a live workbench composing the primitives
 * directly from the controls. Right: the two registered presets
 * (`astralEmblem`, `orrerySigil`) rendered through `DiagramSvg` exactly as the
 * production connector system would, as a reference for the locked look.
 *
 * Prototype surface only — the primitives + presets are host-agnostic; once a
 * look is locked it can be assigned to a celestial slot (data-driven) or reused
 * wherever a diagram is rendered.
 */

import Link from "next/link";
import { useState } from "react";

import { DiagramSvg } from "@/components/landing/v7/CelestialConnector/DiagramSvg";
import {
  BearingTicks,
  Constellation,
  DiagramLabels,
  OrbitalNodes,
  type OrbitDef,
  PlanetBody,
  RadialSpokes,
  Reticle,
  Rings,
} from "@/components/landing/v7/CelestialConnector/shapes";
import { DEFAULT_CONFIG, type CelestialConfig } from "@/lib/celestial/schema";

const PALETTE = {
  void: "#050403",
  panel: "rgba(16, 13, 10, 0.82)",
  border: "rgba(202, 165, 84, 0.25)",
  gold: "#caa554",
  dawn: "#ebe3d6",
  dim: "rgba(235, 227, 214, 0.5)",
};

interface Settings {
  type: "astral" | "orrery";
  seed: number;
  ringCount: number;
  spokeCount: number;
  spokeArrows: boolean;
  orbitCount: number;
  nodesPerOrbit: number;
  tilt: number;
  showPlanet: boolean;
  showStars: boolean;
  showTicks: boolean;
  spin: boolean;
}

const DEFAULTS: Settings = {
  type: "astral",
  seed: 42,
  ringCount: 3,
  spokeCount: 8,
  spokeArrows: false,
  orbitCount: 2,
  nodesPerOrbit: 6,
  tilt: -12,
  showPlanet: true,
  showStars: true,
  showTicks: true,
  spin: false,
};

function buildOrbits(s: Settings): OrbitDef[] {
  const radii = [70, 96, 116];
  return Array.from({ length: Math.min(s.orbitCount, radii.length) }, (_, i) => {
    const r = radii[i];
    if (s.type === "orrery") {
      return {
        rx: r,
        ry: r * 0.42,
        tilt: s.tilt,
        nodes: Math.max(1, s.nodesPerOrbit - i),
        nodeR: 3 - i * 0.4,
        dash: "4 4",
        hollow: i % 2 === 1,
        opacity: 0.8 - i * 0.15,
        spin: s.spin ? 28 + i * 10 : undefined,
        rev: i % 2 === 1,
      } satisfies OrbitDef;
    }
    return {
      rx: r,
      ry: r,
      nodes: s.nodesPerOrbit,
      nodeR: 2.4,
      dash: "1 7",
      hollow: i % 2 === 1,
      opacity: 0.6,
      spin: s.spin ? 36 + i * 12 : undefined,
      rev: i % 2 === 1,
    } satisfies OrbitDef;
  });
}

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
        <span style={{ color: PALETTE.gold }}>{value}</span>
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

function PresetCard({ preset, title }: { preset: CelestialConfig["preset"]; title: string }) {
  const config: CelestialConfig = {
    ...DEFAULT_CONFIG,
    preset,
    diagram: {
      ...DEFAULT_CONFIG.diagram,
      rings: { count: 3, tickDensity: 0, showMeridian: false },
      reticle: { crosshair: false, centerShape: "diamond" },
      constellation: { seed: 7, points: 7, density: "sparse" },
    },
  };
  return (
    <div
      style={{
        width: 300,
        border: `1px solid ${PALETTE.border}`,
        borderRadius: 10,
        padding: 12,
        background: "rgba(10, 9, 8, 0.4)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.12em",
          color: PALETTE.gold,
          marginBottom: 8,
          textTransform: "uppercase",
          fontFamily: "ui-monospace, monospace",
        }}
      >
        {title}
      </div>
      <div style={{ width: "100%", aspectRatio: "1 / 1" }}>
        <DiagramSvg config={config} />
      </div>
    </div>
  );
}

export default function CelestialEmblemsLabPage() {
  const [s, setS] = useState<Settings>(DEFAULTS);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setS((prev) => ({ ...prev, [key]: value }));

  const isOrrery = s.type === "orrery";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: `radial-gradient(120% 90% at 50% 45%, #0c0a07 0%, ${PALETTE.void} 70%)`,
        overflow: "auto",
        color: PALETTE.dawn,
      }}
    >
      {/* rotate / rotateRev keyframes (mirrors landing.css) for optional spin. */}
      <style>{`
        @keyframes rotate { from { transform: rotate(0); } to { transform: rotate(360deg); } }
        @keyframes rotateRev { from { transform: rotate(0); } to { transform: rotate(-360deg); } }
      `}</style>

      <div style={{ display: "flex", gap: 24, padding: 20, minHeight: "100%" }}>
        {/* ── Controls ─────────────────────────────────────────────── */}
        <div
          style={{
            width: 260,
            flexShrink: 0,
            padding: 18,
            alignSelf: "flex-start",
            position: "sticky",
            top: 20,
            background: PALETTE.panel,
            backdropFilter: "blur(12px)",
            border: `1px solid ${PALETTE.border}`,
            borderRadius: 10,
            fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
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
            Astral Emblem
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {(["astral", "orrery"] as const).map((t) => (
              <button
                key={t}
                onClick={() => set("type", t)}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  background: s.type === t ? "rgba(202,165,84,0.18)" : "transparent",
                  border: `1px solid ${PALETTE.border}`,
                  borderRadius: 6,
                  color: s.type === t ? PALETTE.gold : PALETTE.dim,
                  fontSize: 11,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  textTransform: "uppercase",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <Slider
            label="Seed"
            value={s.seed}
            min={1}
            max={200}
            step={1}
            onChange={(v) => set("seed", v)}
          />
          <Slider
            label="Ring count"
            value={s.ringCount}
            min={0}
            max={5}
            step={1}
            onChange={(v) => set("ringCount", v)}
          />
          <Slider
            label="Spoke count"
            value={s.spokeCount}
            min={0}
            max={24}
            step={1}
            onChange={(v) => set("spokeCount", v)}
          />
          <Slider
            label="Orbits"
            value={s.orbitCount}
            min={0}
            max={3}
            step={1}
            onChange={(v) => set("orbitCount", v)}
          />
          <Slider
            label="Nodes / orbit"
            value={s.nodesPerOrbit}
            min={1}
            max={12}
            step={1}
            onChange={(v) => set("nodesPerOrbit", v)}
          />
          <Slider
            label="Tilt (deg)"
            value={s.tilt}
            min={-45}
            max={45}
            step={1}
            onChange={(v) => set("tilt", v)}
          />

          <div style={{ height: 1, background: PALETTE.border, margin: "12px 0" }} />

          <Toggle
            label="Spoke arrows"
            checked={s.spokeArrows}
            onChange={(v) => set("spokeArrows", v)}
          />
          <Toggle
            label="Center planet"
            checked={s.showPlanet}
            onChange={(v) => set("showPlanet", v)}
          />
          <Toggle label="Stars" checked={s.showStars} onChange={(v) => set("showStars", v)} />
          <Toggle
            label="Bearing ticks"
            checked={s.showTicks}
            onChange={(v) => set("showTicks", v)}
          />
          <Toggle label="Spin" checked={s.spin} onChange={(v) => set("spin", v)} />

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

          <Link
            href="/test"
            style={{
              display: "block",
              marginTop: 14,
              fontSize: 11,
              letterSpacing: "0.08em",
              color: PALETTE.dim,
              textDecoration: "none",
            }}
          >
            ← /test
          </Link>
        </div>

        {/* ── Workbench + preset references ────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            alignContent: "flex-start",
          }}
        >
          <div
            style={{
              width: "min(560px, 100%)",
              aspectRatio: "1 / 1",
              border: `1px solid ${PALETTE.border}`,
              borderRadius: 12,
              background: "rgba(10, 9, 8, 0.35)",
            }}
          >
            <svg viewBox="-120 -120 240 240" fill="none" width="100%" height="100%">
              {s.ringCount > 0 && (
                <Rings
                  config={{
                    count: Math.min(s.ringCount, 5) as 1 | 2 | 3 | 4 | 5,
                    tickDensity: 0,
                    showMeridian: false,
                  }}
                />
              )}
              {s.showTicks && <BearingTicks density={48} />}
              {s.spokeCount > 0 && (
                <RadialSpokes
                  count={s.spokeCount}
                  inner={isOrrery ? 26 : 16}
                  length={isOrrery ? 78 : 92}
                  arrow={s.spokeArrows}
                  dash={isOrrery ? "3 5" : undefined}
                  opacity={0.42}
                />
              )}
              {s.orbitCount > 0 && <OrbitalNodes orbits={buildOrbits(s)} />}
              {s.showStars && (
                <Constellation config={{ seed: s.seed, points: 7, density: "sparse" }} />
              )}
              {isOrrery && s.showPlanet ? (
                <PlanetBody radius={16} ringTilt={s.tilt} />
              ) : (
                <Reticle config={{ crosshair: false, centerShape: "diamond" }} />
              )}
              <DiagramLabels
                topLeft={isOrrery ? "fig · E" : "ASTRA"}
                bottomRight={`seed · ${s.seed}`}
              />
            </svg>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                color: PALETTE.dim,
                textTransform: "uppercase",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              Registered presets (DiagramSvg)
            </div>
            <PresetCard preset="astralEmblem" title="astralEmblem" />
            <PresetCard preset="orrerySigil" title="orrerySigil" />
          </div>
        </div>
      </div>
    </div>
  );
}
