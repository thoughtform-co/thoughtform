"use client";

/**
 * /test/services-orbit
 *
 * Look-dev lab for the ADR-029 SERVICES CARD RING: the four service photo
 * cards orbit the brandmark armillary inside ONE rig (mark + orbits + ring
 * tilt together), rotation driven by a simulate-scroll slider through the
 * same bounded spring production uses. Every ring tunable is a slider; the
 * VALUES block at the panel foot is what gets promoted into
 * `lib/services-ring/ringMath.ts` once the composition is locked.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  ServicesCardRing,
  ServicesHologramScene,
} from "@/components/landing/home-v2/services/hologram";
import { STRUCTURAL_ORBITS } from "@/components/landing/home-v2/services/hologram/HologramOrbits";
import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import { TENSOR_ACCENT, TENSOR_GOLD } from "@/lib/home-v2/goldPalette";
import {
  RING_CARD_HEIGHT,
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
  RING_SLAB_BEZEL,
  RING_SLAB_DEPTH,
  RING_SPRING_OMEGA,
  RING_SPRING_ZETA,
  RING_SWAY_CAP_RAD,
  RING_TRAVEL_FRAC,
  RING_Y_OFFSET,
  activeServiceForProgress,
} from "@/lib/services-ring/ringMath";
import type { AboutStageProgress } from "@/lib/services-ring/aboutStageProgressRef";
import type { ServicesRingProgress } from "@/lib/services-ring/ringProgressRef";

const PALETTE = {
  void: "#050403",
  gold: "#caa554",
  faint: "rgba(235, 227, 214, 0.42)",
  dim: "rgba(235, 227, 214, 0.26)",
};

/** Armillary/ring scale + parked rig scale — the corridor instrument's
 *  values (CorridorArmillary ARMILLARY_SCALE × the parked group scale;
 *  the latter = CENTER_TARGET_SCALE, 1.15 → 1.0 with ADR-044). */
const INSTRUMENT_SCALE = 0.62;
const PARKED_GROUP_SCALE = 1.0;

interface OrbitLabConfig {
  progress: number;
  aboutP: number;
  entrance: "off" | "scroll";
  dissipate: number;
  orbitBase: number;
  orbitSpread: number;
  orbitTiltAmp: number;
  cardHeight: number;
  yOffset: number;
  scaleMin: number;
  opacityMin: number;
  opacityMax: number;
  opacityWinHi: number;
  travelFrac: number;
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
  poseAmp: number;
  pointerParallax: number;
  camDist: number;
  bloom: boolean;
}

const DEFAULTS: OrbitLabConfig = {
  progress: 0.3, // beat-1 midpoint: service 01 front, settled
  aboutP: 0, // ADR-047 about stage clock (deck flip; needs progress = 1)
  entrance: "off",
  dissipate: 1,
  orbitBase: RING_ORBIT_BASE_RADIUS,
  orbitSpread: RING_ORBIT_RADIUS_SPREAD,
  orbitTiltAmp: RING_ORBIT_TILT_AMP,
  cardHeight: RING_CARD_HEIGHT,
  yOffset: RING_Y_OFFSET,
  scaleMin: RING_SCALE_RANGE[0],
  opacityMin: RING_OPACITY_RANGE[0],
  opacityMax: RING_OPACITY_RANGE[1],
  opacityWinHi: RING_OPACITY_WINDOW[1],
  travelFrac: RING_TRAVEL_FRAC,
  springOmega: RING_SPRING_OMEGA,
  springZeta: RING_SPRING_ZETA,
  swayCap: RING_SWAY_CAP_RAD,
  facingBlend: RING_FACING_BLEND,
  masterOpacity: 1,
  slabDepth: RING_SLAB_DEPTH,
  bezel: RING_SLAB_BEZEL,
  glassOp: RING_GLASS_OPACITY,
  glassEdgeOp: RING_GLASS_EDGE_OPACITY,
  glintOp: RING_EDGE_GLINT_OPACITY,
  glowOp: RING_GLOW_OPACITY,
  trackOp: 1,
  poseAmp: 0, // ring mode: per-service rig pose retired (ADR-029)
  pointerParallax: 0.12,
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

export default function ServicesOrbitLabPage() {
  // `?p=0.5` deep-links an initial progress (scripted screenshots). Read
  // lazily so the page needs no useSearchParams/Suspense (project-cards
  // lab convention).
  const [cfg, setCfg] = useState<OrbitLabConfig>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    const p = parseFloat(new URLSearchParams(window.location.search).get("p") ?? "");
    return Number.isFinite(p) ? { ...DEFAULTS, progress: Math.min(1, Math.max(0, p)) } : DEFAULTS;
  });
  const set = (patch: Partial<OrbitLabConfig>) => setCfg((c) => ({ ...c, ...patch }));

  // The ring reads progress per WebGL frame from this ref — the slider writes
  // it (and mirrors into state for display), exactly like production's
  // servicesRingProgressRef written by useServicesStageScroll.
  const progressRef = useRef<ServicesRingProgress>({ progress: DEFAULTS.progress });
  useEffect(() => {
    progressRef.current.progress = cfg.progress;
  }, [cfg.progress]);

  // Simulated ADR-047 about stage clock — the deck STACK needs runway
  // progress at 1 (exit clock pinned) before the flip reads correctly, so
  // the slider drives both refs the way the page's scroll geometry would.
  const aboutRef = useRef<AboutStageProgress>({ progress: DEFAULTS.aboutP, engaged: false });
  useEffect(() => {
    aboutRef.current.progress = cfg.aboutP;
    aboutRef.current.engaged = cfg.aboutP > 0;
  }, [cfg.aboutP]);

  // Simulated corridor-exit dissipate clock — written to the same CSS var
  // production writes, so the scene + ring exercise their real entrance path.
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

  const activeIndex = activeServiceForProgress(cfg.progress);
  const activeServiceId = SERVICES[activeIndex].id;

  const promoted = `RING_ORBIT_BASE_RADIUS = ${cfg.orbitBase.toFixed(2)}
RING_ORBIT_RADIUS_SPREAD = ${cfg.orbitSpread.toFixed(3)}
RING_ORBIT_TILT_AMP = ${cfg.orbitTiltAmp.toFixed(3)}
RING_CARD_HEIGHT = ${cfg.cardHeight.toFixed(2)}
RING_Y_OFFSET = ${cfg.yOffset.toFixed(2)}
RING_TRAVEL_FRAC = ${cfg.travelFrac.toFixed(2)}
RING_SPRING_OMEGA = ${cfg.springOmega.toFixed(1)}
RING_SPRING_ZETA = ${cfg.springZeta.toFixed(2)}
RING_SWAY_CAP_RAD = ${cfg.swayCap.toFixed(2)}
RING_FACING_BLEND = ${cfg.facingBlend.toFixed(2)}
RING_SCALE_RANGE = [${cfg.scaleMin.toFixed(2)}, ${RING_SCALE_RANGE[1]}]
RING_OPACITY_RANGE = [${cfg.opacityMin.toFixed(2)}, ${cfg.opacityMax.toFixed(2)}]
RING_OPACITY_WINDOW = [${RING_OPACITY_WINDOW[0]}, ${cfg.opacityWinHi.toFixed(2)}]
RING_SLAB_DEPTH = ${cfg.slabDepth.toFixed(3)}
RING_SLAB_BEZEL = ${cfg.bezel.toFixed(3)}
RING_GLASS_OPACITY = ${cfg.glassOp.toFixed(3)}
RING_GLASS_EDGE_OPACITY = ${cfg.glassEdgeOp.toFixed(2)}
RING_EDGE_GLINT_OPACITY = ${cfg.glintOp.toFixed(2)}
RING_GLOW_OPACITY = ${cfg.glowOp.toFixed(3)}`;

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
          SERVICES ORBIT
        </div>
        <div style={{ fontSize: 12, letterSpacing: "0.06em", color: PALETTE.faint, marginTop: 6 }}>
          Card ring look-dev — SVC {String(activeIndex + 1).padStart(2, "0")}/04 ·{" "}
          {SERVICES[activeIndex].verb}
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
            activeServiceId={activeServiceId}
            accentColor={TENSOR_ACCENT}
            blending="normal"
            color={TENSOR_GOLD}
            density={0.9}
            depthStrutCount={2200}
            edgeThresholdDeg={5}
            entrance={cfg.entrance}
            flyIn={1}
            opacity={0.74}
            orbits={STRUCTURAL_ORBITS}
            pointSize={4.3}
            pointerParallax={cfg.pointerParallax}
            scale={INSTRUMENT_SCALE}
            scanGain={0.24}
            servicePoseAmp={cfg.poseAmp}
            showShell
            shellCount={120}
            surfaceCount={160}
            wireCount={6800}
            wireStroke={0.084}
          >
            <ServicesCardRing
              scale={INSTRUMENT_SCALE}
              progressRef={progressRef}
              aboutProgressRef={aboutRef}
              entrance={cfg.entrance}
              facingBlend={cfg.facingBlend}
              masterOpacity={cfg.masterOpacity}
              orbitBase={cfg.orbitBase}
              orbitSpread={cfg.orbitSpread}
              orbitTiltAmp={cfg.orbitTiltAmp}
              cardHeight={cfg.cardHeight}
              yOffset={cfg.yOffset}
              travelFrac={cfg.travelFrac}
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
            label="progress"
            value={cfg.progress}
            min={0}
            max={1}
            step={0.001}
            onChange={(v) => set({ progress: v })}
          />
          <Row>
            {SERVICES.map((service, i) => (
              <LabButton
                key={service.id}
                label={`0${i + 1}`}
                active={activeIndex === i && cfg.progress > 0.2}
                onClick={() => set({ progress: (i + 1.5) / 5 })}
              />
            ))}
            <LabButton
              label="LEAD"
              active={cfg.progress <= 0.2}
              onClick={() => set({ progress: 0.1 })}
            />
          </Row>
        </Section>

        <Section title="ABOUT DECK (ADR-047)">
          {/* The flip needs the deck assembled: progress 1 pins the exit
              clock (stack converged), then aboutP flips it. The slot ref is
              left invalid here, so the deck targets the fallback NDC anchor
              — orientation + seat math exercise without a DOM stage. */}
          <Row>
            <LabButton
              label="STACK (p=1)"
              active={cfg.progress === 1}
              onClick={() => set({ progress: 1, entrance: "scroll", dissipate: 1 })}
            />
            <LabButton
              label="FLIPPED"
              active={cfg.aboutP >= 0.3}
              onClick={() => set({ progress: 1, entrance: "scroll", dissipate: 1, aboutP: 0.32 })}
            />
            <LabButton label="RESET" onClick={() => set({ aboutP: 0 })} />
          </Row>
          <Slider
            label="about p"
            value={cfg.aboutP}
            min={0}
            max={1}
            step={0.001}
            onChange={(v) => set({ aboutP: v })}
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
        </Section>

        <Section title="TRACKS">
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
            label="travel frac"
            value={cfg.travelFrac}
            min={0.15}
            max={0.85}
            step={0.01}
            onChange={(v) => set({ travelFrac: v })}
          />
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
            max={0.3}
            step={0.005}
            onChange={(v) => set({ swayCap: v })}
          />
        </Section>

        <Section title="RIG">
          <Slider
            label="pose amp"
            value={cfg.poseAmp}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => set({ poseAmp: v })}
          />
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

        <Section title="VALUES → ringMath.ts">
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
        href="/test/services-demo"
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
        {"<- services demo"}
      </Link>
    </div>
  );
}
