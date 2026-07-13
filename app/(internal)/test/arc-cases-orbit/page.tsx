"use client";

/**
 * /test/arc-cases-orbit
 *
 * Look-dev lab for the ADR-033 ARC CASES ORBIT: the four production case
 * cards orbiting a stand-in Build sphere, CLICK-armed through the real
 * `arcCasesStore` + damped arm level + the shipped ring spring. The ARM
 * toggle and case buttons drive the exact production state path; the
 * LEVEL override slider scrubs the entrance envelope by hand. The VALUES
 * block at the panel foot is what gets promoted into
 * `lib/arc-cases/orbitMath.ts` once the composition is locked.
 *
 * The sphere here is a cheap dotted stand-in (the real accretion shell is
 * depth-store-coupled) — final compositing is verified on the landing
 * behind ARC_CASES_ORBIT. The SOURCES/SURFACES chips are DOM stand-ins so
 * the armed dims can be judged.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";

import { ArcCasesRing } from "@/components/landing/home-v2/arc-cases";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";
import {
  ARC_ARM_RATE,
  ARC_CARD_HEIGHT,
  ARC_ENTRANCE_RADIUS_FROM,
  ARC_RING_Y_OFFSET,
  ARC_SOURCE_DIM,
  ARC_SURFACE_DIM,
  caseSlot,
} from "@/lib/arc-cases/orbitMath";
import {
  RING_EDGE_GLINT_OPACITY,
  RING_FACING_BLEND,
  RING_GLASS_EDGE_OPACITY,
  RING_GLASS_OPACITY,
  RING_GLOW_OPACITY,
  RING_OPACITY_RANGE,
  RING_OPACITY_WINDOW,
  RING_ORBIT_BASE_RADIUS,
  RING_ORBIT_RADIUS_SPREAD,
  RING_ORBIT_TILT_AMP,
  RING_SCALE_RANGE,
  RING_SPRING_OMEGA,
  RING_SPRING_ZETA,
  RING_SWAY_CAP_RAD,
} from "@/lib/services-ring/ringMath";

const PALETTE = {
  void: "#050403",
  gold: "#caa554",
  faint: "rgba(235, 227, 214, 0.42)",
  dim: "rgba(235, 227, 214, 0.26)",
};

/** Armillary/ring scale + parked rig scale — the corridor instrument's
 *  values (the services-orbit lab convention; the Build park frames the
 *  rig at a near-identical apparent size, ADR-033). */
const INSTRUMENT_SCALE = 0.62;
const PARKED_GROUP_SCALE = 1.15;

const SOURCE_NAMES = ["SNOWFLAKE", "NOTION", "MONDAY", "FRONTIFY", "CRM"];
const SURFACE_NAMES = ["CURSOR", "CLAUDE", "WEB APP", "REST", "SLACK", "AGENTS"];

interface ArcLabConfig {
  levelOverrideOn: boolean;
  levelOverride: number;
  armRate: number;
  entranceRadius: number;
  orbitBase: number;
  orbitSpread: number;
  orbitTiltAmp: number;
  cardHeight: number;
  yOffset: number;
  scaleMin: number;
  opacityMin: number;
  opacityMax: number;
  opacityWinHi: number;
  springOmega: number;
  springZeta: number;
  swayCap: number;
  facingBlend: number;
  masterOpacity: number;
  slabDepth: number;
  bezel: number;
  glassOp: number;
  glassEdgeOp: number;
  glintOp: number;
  glowOp: number;
  trackOp: number;
  surfaceDim: number;
  sourceDim: number;
  sphereR: number;
  camDist: number;
  bloom: boolean;
}

const DEFAULTS: ArcLabConfig = {
  levelOverrideOn: false,
  levelOverride: 1,
  armRate: ARC_ARM_RATE,
  entranceRadius: ARC_ENTRANCE_RADIUS_FROM,
  orbitBase: RING_ORBIT_BASE_RADIUS,
  orbitSpread: RING_ORBIT_RADIUS_SPREAD,
  orbitTiltAmp: RING_ORBIT_TILT_AMP,
  cardHeight: ARC_CARD_HEIGHT,
  yOffset: ARC_RING_Y_OFFSET,
  scaleMin: RING_SCALE_RANGE[0],
  opacityMin: RING_OPACITY_RANGE[0],
  opacityMax: RING_OPACITY_RANGE[1],
  opacityWinHi: RING_OPACITY_WINDOW[1],
  springOmega: RING_SPRING_OMEGA,
  springZeta: RING_SPRING_ZETA,
  swayCap: RING_SWAY_CAP_RAD,
  facingBlend: RING_FACING_BLEND,
  masterOpacity: 1,
  slabDepth: 0.045,
  bezel: 0.05,
  glassOp: RING_GLASS_OPACITY,
  glassEdgeOp: RING_GLASS_EDGE_OPACITY,
  glintOp: RING_EDGE_GLINT_OPACITY,
  glowOp: RING_GLOW_OPACITY,
  trackOp: 1,
  surfaceDim: ARC_SURFACE_DIM,
  sourceDim: ARC_SOURCE_DIM,
  sphereR: 1.0,
  camDist: 3.2,
  bloom: true,
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

/** Dotted-sphere stand-in for the Build accretion sphere — a deterministic
 *  Fibonacci distribution (no runtime randomness, lab convention). */
function StandInSphere({ radius }: { radius: number }) {
  const geometry = useMemo(() => {
    const COUNT = 900;
    const positions = new Float32Array(COUNT * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      positions[i * 3] = Math.cos(theta) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(theta) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);
  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);
  return (
    <points geometry={geometry} scale={radius}>
      <pointsMaterial
        color={PALETTE.gold}
        size={0.016}
        transparent
        opacity={0.55}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

/* ── Hand-rolled control panel (gateway-motion lab conventions) ─────────── */

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

/** DOM stand-in for one stack chip column — opacity rides the armed dim
 *  through a CSS transition approximating the damp, so the ARC_*_DIM
 *  values can be judged without the real shell in the lab. */
function ChipColumn({
  names,
  side,
  dimmed,
}: {
  names: string[];
  side: "left" | "right";
  dimmed: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        [side]: 46,
        zIndex: 3,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        alignItems: side === "left" ? "flex-start" : "flex-end",
        opacity: 1 - dimmed,
        transition: "opacity 0.45s ease",
        pointerEvents: "none",
      }}
    >
      {names.map((name) => (
        <span
          key={name}
          style={{
            fontFamily: PANEL_FONT,
            fontSize: 10,
            letterSpacing: "0.22em",
            color: PALETTE.faint,
            border: "1px solid rgba(202, 165, 84, 0.24)",
            padding: "4px 9px",
          }}
        >
          {name}
        </span>
      ))}
    </div>
  );
}

export default function ArcCasesOrbitLabPage() {
  const [cfg, setCfg] = useState<ArcLabConfig>(DEFAULTS);
  const set = (patch: Partial<ArcLabConfig>) => setCfg((c) => ({ ...c, ...patch }));

  const armed = useArcCasesStore((s) => s.armed);
  const caseIndex = useArcCasesStore((s) => s.caseIndex);
  const toggle = useArcCasesStore((s) => s.toggle);
  const stepToCase = useArcCasesStore((s) => s.stepToCase);
  const activeSlot = caseSlot(caseIndex);

  // The lab drives the REAL global store — leave it disarmed on exit so a
  // later landing visit in the same SPA session starts clean.
  useEffect(() => {
    return () => useArcCasesStore.getState().disarm();
  }, []);

  // Late-mount canvas sizing nudge (services-demo convention).
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
    return () => clearTimeout(t);
  }, []);

  // The dim preview follows the effective armed state (override wins).
  const dimLevel = cfg.levelOverrideOn ? cfg.levelOverride : armed ? 1 : 0;

  const promoted = `ARC_ARM_RATE = ${cfg.armRate.toFixed(2)}
ARC_ENTRANCE_RADIUS_FROM = ${cfg.entranceRadius.toFixed(2)}
ARC_RING_Y_OFFSET = ${cfg.yOffset.toFixed(2)}
ARC_CARD_HEIGHT = ${cfg.cardHeight.toFixed(2)}
ARC_SURFACE_DIM = ${cfg.surfaceDim.toFixed(2)}
ARC_SOURCE_DIM = ${cfg.sourceDim.toFixed(2)}
// shared ringMath values (promote only if diverging from services):
RING_ORBIT_BASE_RADIUS = ${cfg.orbitBase.toFixed(2)}
RING_ORBIT_RADIUS_SPREAD = ${cfg.orbitSpread.toFixed(3)}
RING_ORBIT_TILT_AMP = ${cfg.orbitTiltAmp.toFixed(3)}
RING_FACING_BLEND = ${cfg.facingBlend.toFixed(2)}
RING_SPRING_OMEGA = ${cfg.springOmega.toFixed(1)}
RING_SPRING_ZETA = ${cfg.springZeta.toFixed(2)}
RING_SWAY_CAP_RAD = ${cfg.swayCap.toFixed(2)}`;

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
          ARC CASES ORBIT
        </div>
        <div style={{ fontSize: 12, letterSpacing: "0.06em", color: PALETTE.faint, marginTop: 6 }}>
          Build-park look-dev — CASE {PROJECT_CASES[activeSlot].index}/04 ·{" "}
          {PROJECT_CASES[activeSlot].codename}
          {armed ? " · ARMED" : " · DISARMED"}
        </div>
      </div>

      <ChipColumn names={SOURCE_NAMES} side="left" dimmed={cfg.sourceDim * dimLevel} />
      <ChipColumn names={SURFACE_NAMES} side="right" dimmed={cfg.surfaceDim * dimLevel} />

      <Canvas
        camera={{ position: [0, 0, DEFAULTS.camDist], fov: 38, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      >
        <CameraRig dist={cfg.camDist} />
        <group scale={PARKED_GROUP_SCALE}>
          <group scale={INSTRUMENT_SCALE}>
            <StandInSphere radius={cfg.sphereR} />
          </group>
          <ArcCasesRing
            scale={INSTRUMENT_SCALE}
            preload
            levelOverride={cfg.levelOverrideOn ? cfg.levelOverride : null}
            facingBlend={cfg.facingBlend}
            masterOpacity={cfg.masterOpacity}
            armRate={cfg.armRate}
            entranceRadiusFrom={cfg.entranceRadius}
            orbitBase={cfg.orbitBase}
            orbitSpread={cfg.orbitSpread}
            orbitTiltAmp={cfg.orbitTiltAmp}
            cardHeight={cfg.cardHeight}
            yOffset={cfg.yOffset}
            springOmega={cfg.springOmega}
            springZeta={cfg.springZeta}
            swayCap={cfg.swayCap}
            opacityRange={[cfg.opacityMin, cfg.opacityMax]}
            scaleRange={[cfg.scaleMin, RING_SCALE_RANGE[1]]}
            opacityWindow={[RING_OPACITY_WINDOW[0], cfg.opacityWinHi]}
            slabDepth={cfg.slabDepth}
            bezelMargin={cfg.bezel}
            glassOpacity={cfg.glassOp}
            glassEdgeOpacity={cfg.glassEdgeOp}
            glintOpacity={cfg.glintOp}
            glowOpacity={cfg.glowOp}
            trackOpacityMul={cfg.trackOp}
          />
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
        <Section title="ARM (real store)">
          <Row>
            <LabButton label={armed ? "DISARM" : "ARM"} active={armed} onClick={toggle} />
            {PROJECT_CASES.map((projectCase, i) => (
              <LabButton
                key={projectCase.id}
                label={projectCase.index}
                active={activeSlot === i}
                onClick={() => stepToCase(i)}
              />
            ))}
          </Row>
          <Row>
            <LabButton
              label={cfg.levelOverrideOn ? "LEVEL: MANUAL" : "LEVEL: DAMPED"}
              active={cfg.levelOverrideOn}
              onClick={() => set({ levelOverrideOn: !cfg.levelOverrideOn })}
            />
          </Row>
          {cfg.levelOverrideOn && (
            <Slider
              label="level"
              value={cfg.levelOverride}
              min={0}
              max={1}
              step={0.001}
              onChange={(v) => set({ levelOverride: v })}
            />
          )}
          <Slider
            label="arm rate"
            value={cfg.armRate}
            min={0.8}
            max={6}
            step={0.1}
            onChange={(v) => set({ armRate: v })}
          />
          <Slider
            label="fly-in radius"
            value={cfg.entranceRadius}
            min={1}
            max={1.6}
            step={0.01}
            onChange={(v) => set({ entranceRadius: v })}
          />
        </Section>

        <Section title="RING">
          <Slider
            label="orbit base"
            value={cfg.orbitBase}
            min={1.0}
            max={1.8}
            step={0.01}
            onChange={(v) => set({ orbitBase: v })}
          />
          <Slider
            label="radius spread"
            value={cfg.orbitSpread}
            min={0}
            max={0.3}
            step={0.005}
            onChange={(v) => set({ orbitSpread: v })}
          />
          <Slider
            label="tilt spread"
            value={cfg.orbitTiltAmp}
            min={0}
            max={0.15}
            step={0.005}
            onChange={(v) => set({ orbitTiltAmp: v })}
          />
          <Slider
            label="card height"
            value={cfg.cardHeight}
            min={0.7}
            max={1.8}
            step={0.01}
            onChange={(v) => set({ cardHeight: v })}
          />
          <Slider
            label="y offset"
            value={cfg.yOffset}
            min={-0.5}
            max={0.5}
            step={0.01}
            onChange={(v) => set({ yOffset: v })}
          />
          <Slider
            label="scale min"
            value={cfg.scaleMin}
            min={0.3}
            max={1}
            step={0.01}
            onChange={(v) => set({ scaleMin: v })}
          />
          <Slider
            label="opacity min"
            value={cfg.opacityMin}
            min={0}
            max={0.6}
            step={0.01}
            onChange={(v) => set({ opacityMin: v })}
          />
          <Slider
            label="opacity max"
            value={cfg.opacityMax}
            min={0.5}
            max={1}
            step={0.01}
            onChange={(v) => set({ opacityMax: v })}
          />
          <Slider
            label="opacity win"
            value={cfg.opacityWinHi}
            min={0}
            max={0.85}
            step={0.01}
            onChange={(v) => set({ opacityWinHi: v })}
          />
          <Slider
            label="master op"
            value={cfg.masterOpacity}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => set({ masterOpacity: v })}
          />
          <Slider
            label="facing"
            value={cfg.facingBlend}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => set({ facingBlend: v })}
          />
        </Section>

        <Section title="DEVICE">
          <Slider
            label="slab depth"
            value={cfg.slabDepth}
            min={0}
            max={0.08}
            step={0.002}
            onChange={(v) => set({ slabDepth: v })}
          />
          <Slider
            label="bezel"
            value={cfg.bezel}
            min={0}
            max={0.12}
            step={0.002}
            onChange={(v) => set({ bezel: v })}
          />
          <Slider
            label="glass op"
            value={cfg.glassOp}
            min={0}
            max={0.4}
            step={0.005}
            onChange={(v) => set({ glassOp: v })}
          />
          <Slider
            label="edge glass"
            value={cfg.glassEdgeOp}
            min={0}
            max={0.8}
            step={0.01}
            onChange={(v) => set({ glassEdgeOp: v })}
          />
          <Slider
            label="glint op"
            value={cfg.glintOp}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => set({ glintOp: v })}
          />
          <Slider
            label="glow op"
            value={cfg.glowOp}
            min={0}
            max={0.5}
            step={0.005}
            onChange={(v) => set({ glowOp: v })}
          />
          <Slider
            label="track op"
            value={cfg.trackOp}
            min={0}
            max={1.5}
            step={0.01}
            onChange={(v) => set({ trackOp: v })}
          />
        </Section>

        <Section title="MOTION">
          <Slider
            label="spring ω"
            value={cfg.springOmega}
            min={2}
            max={12}
            step={0.1}
            onChange={(v) => set({ springOmega: v })}
          />
          <Slider
            label="spring ζ"
            value={cfg.springZeta}
            min={0.4}
            max={1.2}
            step={0.01}
            onChange={(v) => set({ springZeta: v })}
          />
          <Slider
            label="sway cap"
            value={cfg.swayCap}
            min={0.02}
            max={0.8}
            step={0.005}
            onChange={(v) => set({ swayCap: v })}
          />
        </Section>

        <Section title="ARMED DIMS">
          <Slider
            label="surface dim"
            value={cfg.surfaceDim}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => set({ surfaceDim: v })}
          />
          <Slider
            label="source dim"
            value={cfg.sourceDim}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => set({ sourceDim: v })}
          />
        </Section>

        <Section title="RIG">
          <Slider
            label="sphere r"
            value={cfg.sphereR}
            min={0.6}
            max={1.4}
            step={0.01}
            onChange={(v) => set({ sphereR: v })}
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

        <Section title="VALUES → orbitMath.ts">
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
