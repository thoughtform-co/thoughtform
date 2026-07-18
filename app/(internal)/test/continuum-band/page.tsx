"use client";

/**
 * /test/continuum-band
 *
 * Look-dev lab for the ADR-049 WEBGL CONTINUUM BAND: the tool ↔ collaborator
 * spectrum integrated INTO the armillary's near-horizontal Saturn waist ring
 * as a layered beam (companion ellipses + particle annulus + graduation ticks
 * + Tool/Collaborator poles + a camera-facing traveler reticle). The whole
 * layer forms on a `formT` clock; the SCROLL sliders drive it exactly like
 * production (continuum p + the #about-exit prelude via `continuumFormT`), and
 * the LAYERS toggles isolate the mark / orbits / band / cards so the
 * "layered brandmark" reads clearly. VALUES at the panel foot is what gets
 * promoted into `lib/services-ring/continuumBandMath.ts`.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  ContinuumBand,
  HologramOrbits,
  ServicesCardRing,
  ServicesHologramScene,
  type OrbitConfig,
} from "@/components/landing/home-v2/services/hologram";
import { STRUCTURAL_ORBITS } from "@/components/landing/home-v2/services/hologram/HologramOrbits";
import { TENSOR_ACCENT, TENSOR_GOLD } from "@/lib/home-v2/goldPalette";
import { lerp } from "@/lib/math";
import {
  BAND_INNER_MUL,
  BAND_MINOR_TICKS_PER_SPAN,
  BAND_OUTER_MUL,
  BAND_PARTICLE_SIZE,
  BAND_PARTICLE_Z_JITTER,
  BAND_POLE_R,
  BAND_TICK_MAJOR_HALF,
} from "@/lib/services-ring/continuumBandMath";
import { CONTINUUM_WAIST_LEVEL, continuumFormT } from "@/lib/services-ring/continuumStageMath";
import type { AboutStageProgress } from "@/lib/services-ring/aboutStageProgressRef";
import type { ServicesRingProgress } from "@/lib/services-ring/ringProgressRef";

const PALETTE = {
  void: "#050403",
  gold: "#caa554",
  faint: "rgba(235, 227, 214, 0.42)",
  dim: "rgba(235, 227, 214, 0.26)",
};

const INSTRUMENT_SCALE = 0.62;
const PARKED_GROUP_SCALE = 1.0;

interface BandLabConfig {
  continuumP: number;
  aboutExitP: number;
  formOverride: number; // -1 = off (use the clocks)
  entrance: "off" | "scroll";
  dissipate: number;
  innerMul: number;
  outerMul: number;
  lineOpacityMul: number;
  zJitter: number;
  particleCount: number;
  particleSize: number;
  particleOpacity: number;
  tickMajorHalf: number;
  minorTicksPerSpan: number;
  tickOpacity: number;
  travelerScaleMul: number;
  travelerPeriodS: number;
  poleR: number;
  showMark: boolean;
  markOpacity: number;
  showOrbits: boolean;
  showBand: boolean;
  showCards: boolean;
  pointerParallax: number;
  camDist: number;
  bloom: boolean;
}

const DEFAULTS: BandLabConfig = {
  continuumP: 0.5,
  aboutExitP: 0,
  formOverride: -1,
  entrance: "off",
  dissipate: 1,
  innerMul: BAND_INNER_MUL,
  outerMul: BAND_OUTER_MUL,
  lineOpacityMul: 1,
  zJitter: BAND_PARTICLE_Z_JITTER,
  particleCount: 720,
  particleSize: BAND_PARTICLE_SIZE,
  particleOpacity: 1,
  tickMajorHalf: BAND_TICK_MAJOR_HALF,
  minorTicksPerSpan: BAND_MINOR_TICKS_PER_SPAN,
  tickOpacity: 1,
  travelerScaleMul: 1,
  travelerPeriodS: 7,
  poleR: BAND_POLE_R,
  showMark: true,
  markOpacity: 0.6,
  showOrbits: true,
  showBand: true,
  showCards: false,
  pointerParallax: 0.12,
  camDist: 3.2,
  bloom: false,
};

function CameraRig({ dist }: { dist: number }) {
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    if (camera.position.z !== dist) {
      camera.position.z = dist;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

/* ── Hand-rolled control panel (services-orbit lab conventions) ─────────── */

const PANEL_FONT = 'var(--font-ibm-plex-mono, "IBM Plex Mono"), ui-monospace, monospace';

function Row({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>{children}</div>
  );
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
    <Row>
      <span style={{ width: 92, fontSize: 10, letterSpacing: "0.08em", color: PALETTE.faint }}>
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: PALETTE.gold }}
      />
      <span style={{ width: 44, fontSize: 10, color: PALETTE.gold, textAlign: "right" }}>
        {value.toFixed(step < 0.01 ? 3 : 2)}
      </span>
    </Row>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: "0.3em",
          color: PALETTE.gold,
          marginBottom: 8,
          borderBottom: "1px solid rgba(202, 165, 84, 0.18)",
          paddingBottom: 4,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function LabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: PANEL_FONT,
        fontSize: 10,
        letterSpacing: "0.08em",
        padding: "4px 8px",
        cursor: "pointer",
        color: active ? "#0a0908" : PALETTE.gold,
        background: active ? PALETTE.gold : "transparent",
        border: `1px solid ${active ? PALETTE.gold : "rgba(202, 165, 84, 0.4)"}`,
      }}
    >
      {label}
    </button>
  );
}

export default function ContinuumBandLabPage() {
  // `?p=0.5` deep-links an initial continuum progress (scripted screenshots).
  const [cfg, setCfg] = useState<BandLabConfig>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    const p = parseFloat(new URLSearchParams(window.location.search).get("p") ?? "");
    return Number.isFinite(p) ? { ...DEFAULTS, continuumP: Math.min(1, Math.max(0, p)) } : DEFAULTS;
  });
  const set = (patch: Partial<BandLabConfig>) => setCfg((c) => ({ ...c, ...patch }));

  // The band + waist getters read the formation clocks per WebGL frame from
  // this ref — the sliders write it (production reads the module progress refs
  // the same way). override < 0 ⇒ use the composed clock.
  const formRef = useRef({
    aboutExitP: DEFAULTS.aboutExitP,
    continuumP: DEFAULTS.continuumP,
    override: DEFAULTS.formOverride,
  });
  useEffect(() => {
    formRef.current.aboutExitP = cfg.aboutExitP;
    formRef.current.continuumP = cfg.continuumP;
    formRef.current.override = cfg.formOverride;
  }, [cfg.aboutExitP, cfg.continuumP, cfg.formOverride]);

  // The band's formation clock (honours the isolation override).
  const bandFormGetter = useCallback(() => {
    const s = formRef.current;
    return s.override >= 0 ? s.override : continuumFormT(s.aboutExitP, s.continuumP);
  }, []);

  // Waist re-brighten — lerps the base line toward CONTINUUM_WAIST_LEVEL on the
  // RAW composed clock (never the band's isolation override), mirroring
  // production's `continuumWaistSelector` so the lab shows the ADR-049 waist
  // brighten the live page can't preview (open item 3).
  const labWaistSelector = useMemo(() => {
    const getter = () => {
      const s = formRef.current;
      return lerp(1, CONTINUUM_WAIST_LEVEL, continuumFormT(s.aboutExitP, s.continuumP));
    };
    return (o: OrbitConfig): (() => number) | undefined =>
      o.id === "shell-waist" ? getter : undefined;
  }, []);

  // Simulated corridor-exit dissipate clock — same CSS var production writes,
  // so the orbits' draw-on entrance path is exercised.
  useEffect(() => {
    const root = document.documentElement;
    if (cfg.entrance === "scroll") {
      root.style.setProperty("--corridor-dissipate", cfg.dissipate.toFixed(4));
    } else {
      root.style.removeProperty("--corridor-dissipate");
    }
    return () => {
      root.style.removeProperty("--corridor-dissipate");
    };
  }, [cfg.entrance, cfg.dissipate]);

  // Late-mount canvas sizing nudge (services-demo convention).
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
    return () => clearTimeout(t);
  }, []);

  // Parked card-ring refs (the CARDS layer is context only — no deck flip).
  const cardProgressRef = useRef<ServicesRingProgress>({ progress: 0.3 });
  const cardAboutRef = useRef<AboutStageProgress>({ progress: 0, engaged: false });

  const promoted = `BAND_INNER_MUL = ${cfg.innerMul.toFixed(3)}
BAND_OUTER_MUL = ${cfg.outerMul.toFixed(3)}
BAND_PARTICLE_Z_JITTER = ${cfg.zJitter.toFixed(3)}
BAND_PARTICLES_DESKTOP = ${cfg.particleCount.toFixed(0)}
BAND_PARTICLE_SIZE = ${cfg.particleSize.toFixed(3)}
BAND_TICK_MAJOR_HALF = ${cfg.tickMajorHalf.toFixed(3)}
BAND_MINOR_TICKS_PER_SPAN = ${cfg.minorTicksPerSpan.toFixed(0)}
BAND_POLE_R = ${cfg.poleR.toFixed(3)}
THUMB_PERIOD_S = ${cfg.travelerPeriodS.toFixed(1)}`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: `radial-gradient(130% 100% at 42% 45%, #0d0a07 0%, ${PALETTE.void} 72%)`,
        overflow: "hidden",
        fontFamily: PANEL_FONT,
      }}
    >
      <div style={{ position: "absolute", top: 34, left: 40, zIndex: 6 }}>
        <div style={{ fontSize: 12, letterSpacing: "0.32em", color: PALETTE.gold }}>
          CONTINUUM BAND
        </div>
        <div style={{ fontSize: 12, letterSpacing: "0.06em", color: PALETTE.faint, marginTop: 6 }}>
          Tool ↔ Collaborator on the waist ring — formT{" "}
          {(cfg.formOverride >= 0
            ? cfg.formOverride
            : continuumFormT(cfg.aboutExitP, cfg.continuumP)
          ).toFixed(2)}
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 0, DEFAULTS.camDist], fov: 38, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      >
        <CameraRig dist={cfg.camDist} />
        <group scale={PARKED_GROUP_SCALE}>
          <ServicesHologramScene
            accentColor={TENSOR_ACCENT}
            blending="normal"
            color={TENSOR_GOLD}
            density={0.9}
            depthStrutCount={2200}
            edgeThresholdDeg={5}
            entrance={cfg.entrance}
            flyIn={1}
            opacity={cfg.showMark ? cfg.markOpacity : 0}
            pointSize={4.3}
            pointerParallax={cfg.pointerParallax}
            scale={INSTRUMENT_SCALE}
            scanGain={0.24}
            servicePoseAmp={0}
            showOrbits={false}
            showShell={cfg.showMark}
            shellCount={120}
            surfaceCount={160}
            wireCount={6800}
            wireStroke={0.084}
          >
            {cfg.showOrbits && (
              <HologramOrbits
                orbits={STRUCTURAL_ORBITS}
                scale={INSTRUMENT_SCALE}
                entrance={cfg.entrance}
                masterOpacityGetterFor={labWaistSelector}
              />
            )}
            {cfg.showBand && (
              <ContinuumBand
                scale={INSTRUMENT_SCALE}
                formTGetter={bandFormGetter}
                innerMul={cfg.innerMul}
                outerMul={cfg.outerMul}
                lineOpacityMul={cfg.lineOpacityMul}
                zJitter={cfg.zJitter}
                particleCount={cfg.particleCount}
                particleSize={cfg.particleSize}
                particleOpacity={cfg.particleOpacity}
                tickMajorHalf={cfg.tickMajorHalf}
                minorTicksPerSpan={cfg.minorTicksPerSpan}
                tickOpacity={cfg.tickOpacity}
                poleR={cfg.poleR}
                travelerScaleMul={cfg.travelerScaleMul}
                travelerPeriodS={cfg.travelerPeriodS}
              />
            )}
            {cfg.showCards && (
              <ServicesCardRing
                scale={INSTRUMENT_SCALE}
                progressRef={cardProgressRef}
                aboutProgressRef={cardAboutRef}
                entrance="off"
              />
            )}
          </ServicesHologramScene>
        </group>
        {cfg.bloom && (
          <EffectComposer>
            <Bloom intensity={0.3} luminanceThreshold={0.42} luminanceSmoothing={0.9} mipmapBlur />
          </EffectComposer>
        )}
      </Canvas>

      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          bottom: 16,
          zIndex: 6,
          width: 292,
          overflowY: "auto",
          padding: "16px 16px 20px",
          background: "rgba(8, 7, 6, 0.92)",
          border: "1px solid rgba(202, 165, 84, 0.22)",
        }}
      >
        <Section title="SCROLL">
          <Slider
            label="continuum p"
            value={cfg.continuumP}
            min={0}
            max={1}
            step={0.001}
            onChange={(v) => set({ continuumP: v })}
          />
          <Slider
            label="about exit"
            value={cfg.aboutExitP}
            min={0}
            max={1}
            step={0.001}
            onChange={(v) => set({ aboutExitP: v })}
          />
          <Row>
            <LabButton
              label={cfg.formOverride >= 0 ? "formT OVERRIDE" : "formT: CLOCKS"}
              active={cfg.formOverride >= 0}
              onClick={() => set({ formOverride: cfg.formOverride >= 0 ? -1 : 0.5 })}
            />
          </Row>
          {cfg.formOverride >= 0 && (
            <Slider
              label="formT"
              value={cfg.formOverride}
              min={0}
              max={1}
              step={0.001}
              onChange={(v) => set({ formOverride: v })}
            />
          )}
        </Section>

        <Section title="LAYERS">
          <Row>
            <LabButton
              label="MARK"
              active={cfg.showMark}
              onClick={() => set({ showMark: !cfg.showMark })}
            />
            <LabButton
              label="ORBITS"
              active={cfg.showOrbits}
              onClick={() => set({ showOrbits: !cfg.showOrbits })}
            />
          </Row>
          <Row>
            <LabButton
              label="BAND"
              active={cfg.showBand}
              onClick={() => set({ showBand: !cfg.showBand })}
            />
            <LabButton
              label="CARDS"
              active={cfg.showCards}
              onClick={() => set({ showCards: !cfg.showCards })}
            />
          </Row>
          <Slider
            label="mark op"
            value={cfg.markOpacity}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => set({ markOpacity: v })}
          />
        </Section>

        <Section title="ENTRANCE">
          <Row>
            <LabButton
              label="PARKED"
              active={cfg.entrance === "off"}
              onClick={() => set({ entrance: "off" })}
            />
            <LabButton
              label="SCROLL"
              active={cfg.entrance === "scroll"}
              onClick={() => set({ entrance: "scroll" })}
            />
          </Row>
          {cfg.entrance === "scroll" && (
            <Slider
              label="dissipate"
              value={cfg.dissipate}
              min={0}
              max={1}
              step={0.001}
              onChange={(v) => set({ dissipate: v })}
            />
          )}
        </Section>

        <Section title="BAND">
          <Slider
            label="inner mul"
            value={cfg.innerMul}
            min={0.9}
            max={1.0}
            step={0.005}
            onChange={(v) => set({ innerMul: v })}
          />
          <Slider
            label="outer mul"
            value={cfg.outerMul}
            min={1.0}
            max={1.15}
            step={0.005}
            onChange={(v) => set({ outerMul: v })}
          />
          <Slider
            label="line op"
            value={cfg.lineOpacityMul}
            min={0}
            max={1.5}
            step={0.01}
            onChange={(v) => set({ lineOpacityMul: v })}
          />
          <Slider
            label="z jitter"
            value={cfg.zJitter}
            min={0}
            max={0.04}
            step={0.001}
            onChange={(v) => set({ zJitter: v })}
          />
        </Section>

        <Section title="PARTICLES">
          <Slider
            label="count"
            value={cfg.particleCount}
            min={100}
            max={1500}
            step={10}
            onChange={(v) => set({ particleCount: Math.round(v) })}
          />
          <Slider
            label="size"
            value={cfg.particleSize}
            min={0.004}
            max={0.03}
            step={0.001}
            onChange={(v) => set({ particleSize: v })}
          />
          <Slider
            label="opacity"
            value={cfg.particleOpacity}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => set({ particleOpacity: v })}
          />
        </Section>

        <Section title="TICKS">
          <Slider
            label="major half"
            value={cfg.tickMajorHalf}
            min={0.02}
            max={0.15}
            step={0.002}
            onChange={(v) => set({ tickMajorHalf: v })}
          />
          <Slider
            label="minors/span"
            value={cfg.minorTicksPerSpan}
            min={0}
            max={8}
            step={1}
            onChange={(v) => set({ minorTicksPerSpan: Math.round(v) })}
          />
          <Slider
            label="tick op"
            value={cfg.tickOpacity}
            min={0}
            max={1.5}
            step={0.01}
            onChange={(v) => set({ tickOpacity: v })}
          />
        </Section>

        <Section title="TRAVELER">
          <Slider
            label="scale mul"
            value={cfg.travelerScaleMul}
            min={0.5}
            max={2}
            step={0.01}
            onChange={(v) => set({ travelerScaleMul: v })}
          />
          <Slider
            label="period s"
            value={cfg.travelerPeriodS}
            min={3}
            max={12}
            step={0.1}
            onChange={(v) => set({ travelerPeriodS: v })}
          />
          <Slider
            label="pole r"
            value={cfg.poleR}
            min={0.01}
            max={0.08}
            step={0.002}
            onChange={(v) => set({ poleR: v })}
          />
        </Section>

        <Section title="RIG">
          <Slider
            label="pointer look"
            value={cfg.pointerParallax}
            min={0}
            max={0.3}
            step={0.005}
            onChange={(v) => set({ pointerParallax: v })}
          />
          <Slider
            label="cam dist"
            value={cfg.camDist}
            min={2.8}
            max={4.4}
            step={0.01}
            onChange={(v) => set({ camDist: v })}
          />
        </Section>

        <Section title="RENDER">
          <Row>
            <LabButton
              label={cfg.bloom ? "BLOOM ON" : "BLOOM OFF"}
              active={cfg.bloom}
              onClick={() => set({ bloom: !cfg.bloom })}
            />
            <LabButton label="RESET" onClick={() => setCfg(DEFAULTS)} />
          </Row>
        </Section>

        <Section title="VALUES → continuumBandMath.ts">
          <pre
            style={{
              margin: 0,
              fontSize: 9.5,
              lineHeight: 1.6,
              color: PALETTE.dim,
              whiteSpace: "pre-wrap",
            }}
          >
            {promoted}
          </pre>
        </Section>
      </div>

      <Link
        href="/test/services-orbit"
        style={{
          position: "absolute",
          bottom: 18,
          left: 22,
          zIndex: 6,
          fontSize: 11,
          letterSpacing: "0.08em",
          color: PALETTE.faint,
          textDecoration: "none",
        }}
      >
        {"<- services orbit"}
      </Link>
    </div>
  );
}
