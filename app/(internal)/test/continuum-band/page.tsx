"use client";

/**
 * /test/continuum-band
 *
 * Look-dev lab for the ADR-049 Update 3 MARK-BAND CONTINUUM: the tool ↔
 * collaborator spectrum is the brandmark ITSELF — at #continuum the mark
 * comes closer / bigger and its INNER HORIZONTAL BAND carries the spectrum:
 * a softly lit base band + a bright PENDULUM head swinging left ↔ right
 * (eased at the turnarounds) with a comet TRAIL decaying behind its
 * direction of travel. No orbits, no rails, no overlay chrome; the radar
 * scan is OFF here (its top-to-bottom sweep misread as the band motion).
 *
 * SWING (default) runs the pendulum continuously; AUTO drives the gain from
 * the scroll formation clock (production preview — the first half-swing
 * plays Tool → Collaborator as the band breathes in); MANUAL scrubs the head
 * by hand. TOOL / COLLABORATOR labels are projected from the band's actual
 * 3D endpoints every frame, so they ride the mark instead of being plastered
 * over it. VALUES promotes into `lib/services-ring/continuumBandMath.ts`.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import * as THREE from "three";

import { ServicesHologramScene } from "@/components/landing/home-v2/services/hologram";
import { STRUCTURAL_ORBITS } from "@/components/landing/home-v2/services/hologram/HologramOrbits";
import { TENSOR_ACCENT, TENSOR_GOLD } from "@/lib/home-v2/goldPalette";
import { lerp } from "@/lib/math";
import {
  BAND_BASE_GAIN,
  BAND_HALF,
  BAND_HEAD_GAIN,
  BAND_HEAD_W,
  BAND_SIZE_BOOST,
  BAND_SOFT,
  BAND_SWING_MIN,
  BAND_SWING_PERIOD_S,
  BAND_TRAIL_GAIN,
  BAND_TRAIL_LEN,
  BAND_X_HALF,
  BAND_Y,
  bandGainT,
  bandPendulumDir,
  bandPendulumX,
} from "@/lib/services-ring/continuumBandMath";
import { continuumFormT } from "@/lib/services-ring/continuumStageMath";

const PALETTE = {
  void: "#050403",
  gold: "#caa554",
  dawn: "#ebe3d6",
  faint: "rgba(235, 227, 214, 0.42)",
  dim: "rgba(235, 227, 214, 0.26)",
};

const INSTRUMENT_SCALE = 0.62;
const PARKED_GROUP_SCALE = 1.0;

type SweepMode = "swing" | "auto" | "manual";

interface BandLabConfig {
  continuumP: number;
  aboutExitP: number;
  formOverride: number; // -1 = off (use the clocks)
  // Approach — "the mark comes closer, becomes bigger".
  approachZoom: number;
  markOpFrom: number;
  markOpTo: number;
  // Band slab.
  bandY: number;
  bandHalf: number;
  bandSoft: number;
  bandXHalf: number;
  // Swing + trail.
  sweepMode: SweepMode;
  manualX: number;
  manualDir: 1 | -1;
  swingPeriodS: number;
  spanInset: number;
  headW: number;
  headGainMul: number;
  trailLen: number;
  trailGainMul: number;
  baseGainMul: number;
  sizeBoost: number;
  // Labels.
  showLabels: boolean;
  labelGapPx: number;
  // Context + rig.
  showOrbits: boolean;
  pointerParallax: number;
  camDist: number;
  bloom: boolean;
}

const DEFAULTS: BandLabConfig = {
  continuumP: 0.5,
  aboutExitP: 0,
  formOverride: -1,
  approachZoom: 0.22,
  markOpFrom: 0.34,
  markOpTo: 0.8,
  bandY: BAND_Y,
  bandHalf: BAND_HALF,
  bandSoft: BAND_SOFT,
  bandXHalf: BAND_X_HALF,
  sweepMode: "swing",
  manualX: 0.5,
  manualDir: 1,
  swingPeriodS: BAND_SWING_PERIOD_S,
  spanInset: BAND_SWING_MIN,
  headW: BAND_HEAD_W,
  headGainMul: 1,
  trailLen: BAND_TRAIL_LEN,
  trailGainMul: 1,
  baseGainMul: 1,
  sizeBoost: BAND_SIZE_BOOST,
  showLabels: true,
  labelGapPx: 18,
  showOrbits: false,
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

/** Advances the pendulum phase on the R3F clock (clamped delta — the
 *  production discipline: no wall clock, tab-hide must not jump). Manual
 *  mode freezes the phase (the slider owns the head). */
function SwingDriver({
  phaseRef,
  cfgRef,
}: {
  phaseRef: { current: number };
  cfgRef: { current: { periodS: number; running: boolean } };
}) {
  useFrame((_, delta) => {
    const c = cfgRef.current;
    if (c.running) phaseRef.current += Math.min(0.1, delta) / Math.max(0.5, c.periodS);
  });
  return null;
}

/** Screen-projected positions of the band's endpoints + the live gain, shared
 *  with the DOM labels. */
interface BandAnchorState {
  lx: number;
  ly: number;
  rx: number;
  ry: number;
  gain: number;
  visible: boolean;
}

/** Rig child: two probes at the band's mark-local endpoints (±xHalf, y) ×
 *  effScale — the SAME space the shader lights — projected to viewport px
 *  every frame, so the DOM labels ride the instrument through pointer-look /
 *  approach zoom instead of being plastered at fixed positions. */
function BandLabelAnchors({
  bandXHalf,
  bandY,
  effScale,
  driveGetter,
  out,
}: {
  bandXHalf: number;
  bandY: number;
  effScale: number;
  driveGetter: () => { gain: number };
  out: { current: BandAnchorState };
}) {
  const leftRef = useRef<THREE.Object3D>(null);
  const rightRef = useRef<THREE.Object3D>(null);
  const world = useRef(new THREE.Vector3());

  useFrame(({ camera, size }) => {
    const l = leftRef.current;
    const r = rightRef.current;
    if (!l || !r) return;
    l.position.set(-bandXHalf * effScale, bandY * effScale, 0);
    r.position.set(bandXHalf * effScale, bandY * effScale, 0);

    const project = (obj: THREE.Object3D): [number, number, boolean] => {
      obj.getWorldPosition(world.current);
      const p = world.current.project(camera);
      return [(p.x * 0.5 + 0.5) * size.width, (-p.y * 0.5 + 0.5) * size.height, Math.abs(p.z) < 1];
    };
    const [lx, ly, lv] = project(l);
    const [rx, ry, rv] = project(r);
    const s = out.current;
    s.lx = lx;
    s.ly = ly;
    s.rx = rx;
    s.ry = ry;
    s.visible = lv && rv;
    s.gain = driveGetter().gain;
  });

  return (
    <>
      <object3D ref={leftRef} />
      <object3D ref={rightRef} />
    </>
  );
}

/** DOM labels — TOOL (left) / COLLABORATOR (right), docked to the projected
 *  band endpoints with a leader dash pointing at the band. HUD grammar:
 *  uppercase, letter-spaced, dawn text with a gold glow — no italics. */
function BandLabels({
  anchorRef,
  gapPx,
  show,
}: {
  anchorRef: { current: BandAnchorState };
  gapPx: number;
  show: boolean;
}) {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const a = anchorRef.current;
      const l = leftRef.current;
      const r = rightRef.current;
      if (!l || !r) return;
      const op = a.visible ? 0.25 + 0.75 * Math.min(1, Math.max(0, a.gain / BAND_BASE_GAIN)) : 0;
      const clampY = (y: number) => Math.min(window.innerHeight - 40, Math.max(40, y));
      l.style.transform = `translate(${(a.lx - gapPx).toFixed(1)}px, ${clampY(a.ly).toFixed(1)}px) translate(-100%, -50%)`;
      r.style.transform = `translate(${(a.rx + gapPx).toFixed(1)}px, ${clampY(a.ry).toFixed(1)}px) translate(0, -50%)`;
      l.style.opacity = op.toFixed(3);
      r.style.opacity = op.toFixed(3);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [anchorRef, gapPx, show]);

  if (!show) return null;

  const labelStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 12,
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    color: PALETTE.dawn,
    textShadow: "0 0 16px rgba(202, 165, 84, 0.4)",
    whiteSpace: "nowrap",
    opacity: 0,
    willChange: "transform, opacity",
  };
  const dashStyle: CSSProperties = {
    width: 20,
    height: 1,
    background: `linear-gradient(90deg, transparent, ${PALETTE.gold})`,
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }} aria-hidden>
      <div ref={leftRef} style={labelStyle}>
        <span>Tool</span>
        <span style={dashStyle} />
      </div>
      <div ref={rightRef} style={labelStyle}>
        <span style={{ ...dashStyle, transform: "scaleX(-1)" }} />
        <span>Collaborator</span>
      </div>
    </div>
  );
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

  // Per-frame drive state — the getter reads refs (never React state) so the
  // WebGL loop stays render-stable; sliders mirror into the ref.
  const driveRef = useRef({
    aboutExitP: DEFAULTS.aboutExitP,
    continuumP: DEFAULTS.continuumP,
    override: DEFAULTS.formOverride,
    sweepMode: DEFAULTS.sweepMode as SweepMode,
    manualX: DEFAULTS.manualX,
    manualDir: DEFAULTS.manualDir as 1 | -1,
    spanInset: DEFAULTS.spanInset,
    headGainMul: DEFAULTS.headGainMul,
    trailGainMul: DEFAULTS.trailGainMul,
    baseGainMul: DEFAULTS.baseGainMul,
  });
  useEffect(() => {
    const d = driveRef.current;
    d.aboutExitP = cfg.aboutExitP;
    d.continuumP = cfg.continuumP;
    d.override = cfg.formOverride;
    d.sweepMode = cfg.sweepMode;
    d.manualX = cfg.manualX;
    d.manualDir = cfg.manualDir;
    d.spanInset = cfg.spanInset;
    d.headGainMul = cfg.headGainMul;
    d.trailGainMul = cfg.trailGainMul;
    d.baseGainMul = cfg.baseGainMul;
  }, [cfg]);

  const swingPhaseRef = useRef(0);
  const swingCfgRef = useRef({ periodS: DEFAULTS.swingPeriodS, running: true });
  useEffect(() => {
    swingCfgRef.current.periodS = cfg.swingPeriodS;
    swingCfgRef.current.running = cfg.sweepMode !== "manual";
  }, [cfg.swingPeriodS, cfg.sweepMode]);
  // Mode switches restart the swing from the Tool end (left) so the first
  // half-swing always reads left → right — the production entry contract.
  useEffect(() => {
    swingPhaseRef.current = 0;
  }, [cfg.sweepMode]);

  // The band drive — AUTO mirrors what production will compute from
  // continuumFormT in the corridor actor; SWING forces the gain open so the
  // pendulum is always visible; MANUAL scrubs the head by hand.
  const bandDriveGetter = useCallback(() => {
    const d = driveRef.current;
    const formT = d.override >= 0 ? d.override : continuumFormT(d.aboutExitP, d.continuumP);
    const master = d.sweepMode === "auto" ? bandGainT(formT) : 1;
    const x =
      d.sweepMode === "manual"
        ? d.manualX
        : bandPendulumX(swingPhaseRef.current, d.spanInset, 1 - d.spanInset);
    const dir = d.sweepMode === "manual" ? d.manualDir : bandPendulumDir(swingPhaseRef.current);
    return {
      sweep: x,
      dir,
      gain: master * BAND_BASE_GAIN * d.baseGainMul,
      headGain: master * BAND_HEAD_GAIN * d.headGainMul,
      trailGain: master * BAND_TRAIL_GAIN * d.trailGainMul,
    };
  }, []);

  const labelAnchorRef = useRef<BandAnchorState>({
    lx: -100,
    ly: -100,
    rx: -100,
    ry: -100,
    gain: 0,
    visible: false,
  });

  // Late-mount canvas sizing nudge (services-demo convention).
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
    return () => clearTimeout(t);
  }, []);

  // Approach pose — slider-driven (state, not rAF): the mark re-inks + comes
  // closer/bigger with the formation, the ADR-049 "brandmark returns" beat.
  const formTNow =
    cfg.formOverride >= 0 ? cfg.formOverride : continuumFormT(cfg.aboutExitP, cfg.continuumP);
  const approachT = cfg.sweepMode === "auto" ? formTNow : 1;
  const effScale = INSTRUMENT_SCALE * (1 + cfg.approachZoom * approachT);
  const effOpacity = lerp(cfg.markOpFrom, cfg.markOpTo, approachT);

  const promoted = `BAND_Y = ${cfg.bandY.toFixed(3)}
BAND_HALF = ${cfg.bandHalf.toFixed(3)}
BAND_SOFT = ${cfg.bandSoft.toFixed(3)}
BAND_X_HALF = ${cfg.bandXHalf.toFixed(3)}
BAND_SWING_PERIOD_S = ${cfg.swingPeriodS.toFixed(1)}
BAND_SWING_MIN/MAX = ${cfg.spanInset.toFixed(3)} / ${(1 - cfg.spanInset).toFixed(3)}
BAND_HEAD_W = ${cfg.headW.toFixed(3)}
BAND_HEAD_GAIN = ${(BAND_HEAD_GAIN * cfg.headGainMul).toFixed(2)}
BAND_TRAIL_LEN = ${cfg.trailLen.toFixed(3)}
BAND_TRAIL_GAIN = ${(BAND_TRAIL_GAIN * cfg.trailGainMul).toFixed(2)}
BAND_BASE_GAIN = ${(BAND_BASE_GAIN * cfg.baseGainMul).toFixed(2)}
BAND_SIZE_BOOST = ${cfg.sizeBoost.toFixed(2)}
approach zoom = ${cfg.approachZoom.toFixed(2)} · ink ${cfg.markOpFrom.toFixed(2)} → ${cfg.markOpTo.toFixed(2)}`;

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
          CONTINUUM · MARK BAND
        </div>
        <div style={{ fontSize: 12, letterSpacing: "0.06em", color: PALETTE.faint, marginTop: 6 }}>
          Pendulum swing Tool ↔ Collaborator — formT {formTNow.toFixed(2)}
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 0, DEFAULTS.camDist], fov: 38, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      >
        <CameraRig dist={cfg.camDist} />
        <SwingDriver phaseRef={swingPhaseRef} cfgRef={swingCfgRef} />
        <group scale={PARKED_GROUP_SCALE}>
          <ServicesHologramScene
            accentColor={TENSOR_ACCENT}
            blending="normal"
            color={TENSOR_GOLD}
            density={0.9}
            depthStrutCount={2200}
            edgeThresholdDeg={5}
            entrance="off"
            flyIn={1}
            opacity={effOpacity}
            orbits={STRUCTURAL_ORBITS}
            pointSize={4.3}
            pointerParallax={cfg.pointerParallax}
            scale={effScale}
            scanGain={0}
            servicePoseAmp={0}
            showOrbits={cfg.showOrbits}
            showShell
            shellCount={120}
            surfaceCount={160}
            wireCount={6800}
            wireStroke={0.084}
            bandDriveGetter={bandDriveGetter}
            bandY={cfg.bandY}
            bandHalf={cfg.bandHalf}
            bandSoft={cfg.bandSoft}
            bandXHalf={cfg.bandXHalf}
            bandHeadW={cfg.headW}
            bandTrailLen={cfg.trailLen}
            bandSizeBoost={cfg.sizeBoost}
          >
            <BandLabelAnchors
              bandXHalf={cfg.bandXHalf}
              bandY={cfg.bandY}
              effScale={effScale}
              driveGetter={bandDriveGetter}
              out={labelAnchorRef}
            />
          </ServicesHologramScene>
        </group>
        {cfg.bloom && (
          <EffectComposer>
            <Bloom intensity={0.3} luminanceThreshold={0.42} luminanceSmoothing={0.9} mipmapBlur />
          </EffectComposer>
        )}
      </Canvas>

      <BandLabels anchorRef={labelAnchorRef} gapPx={cfg.labelGapPx} show={cfg.showLabels} />

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
        <Section title="SWING">
          <Row>
            <LabButton
              label="SWING"
              active={cfg.sweepMode === "swing"}
              onClick={() => set({ sweepMode: "swing" })}
            />
            <LabButton
              label="AUTO (scroll)"
              active={cfg.sweepMode === "auto"}
              onClick={() => set({ sweepMode: "auto" })}
            />
            <LabButton
              label="MANUAL"
              active={cfg.sweepMode === "manual"}
              onClick={() => set({ sweepMode: "manual" })}
            />
          </Row>
          {cfg.sweepMode === "manual" ? (
            <>
              <Slider
                label="head x"
                value={cfg.manualX}
                min={0}
                max={1}
                step={0.005}
                onChange={(v) => set({ manualX: v })}
              />
              <Row>
                <LabButton
                  label="DIR →"
                  active={cfg.manualDir === 1}
                  onClick={() => set({ manualDir: 1 })}
                />
                <LabButton
                  label="← DIR"
                  active={cfg.manualDir === -1}
                  onClick={() => set({ manualDir: -1 })}
                />
              </Row>
            </>
          ) : (
            <Slider
              label="period s"
              value={cfg.swingPeriodS}
              min={3}
              max={14}
              step={0.1}
              onChange={(v) => set({ swingPeriodS: v })}
            />
          )}
          <Slider
            label="span inset"
            value={cfg.spanInset}
            min={0}
            max={0.25}
            step={0.005}
            onChange={(v) => set({ spanInset: v })}
          />
        </Section>

        <Section title="HEAD + TRAIL">
          <Slider
            label="head w"
            value={cfg.headW}
            min={0.02}
            max={0.2}
            step={0.005}
            onChange={(v) => set({ headW: v })}
          />
          <Slider
            label="head gain"
            value={cfg.headGainMul}
            min={0}
            max={2}
            step={0.05}
            onChange={(v) => set({ headGainMul: v })}
          />
          <Slider
            label="trail len"
            value={cfg.trailLen}
            min={0.05}
            max={0.6}
            step={0.01}
            onChange={(v) => set({ trailLen: v })}
          />
          <Slider
            label="trail gain"
            value={cfg.trailGainMul}
            min={0}
            max={2}
            step={0.05}
            onChange={(v) => set({ trailGainMul: v })}
          />
          <Slider
            label="base glow"
            value={cfg.baseGainMul}
            min={0}
            max={2}
            step={0.05}
            onChange={(v) => set({ baseGainMul: v })}
          />
          <Slider
            label="size boost"
            value={cfg.sizeBoost}
            min={0}
            max={1}
            step={0.02}
            onChange={(v) => set({ sizeBoost: v })}
          />
        </Section>

        <Section title="LABELS">
          <Row>
            <LabButton
              label={cfg.showLabels ? "LABELS ON" : "LABELS OFF"}
              active={cfg.showLabels}
              onClick={() => set({ showLabels: !cfg.showLabels })}
            />
          </Row>
          <Slider
            label="gap px"
            value={cfg.labelGapPx}
            min={6}
            max={60}
            step={1}
            onChange={(v) => set({ labelGapPx: Math.round(v) })}
          />
        </Section>

        <Section title="SCROLL (AUTO mode)">
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

        <Section title="APPROACH">
          <Slider
            label="zoom"
            value={cfg.approachZoom}
            min={0}
            max={0.6}
            step={0.01}
            onChange={(v) => set({ approachZoom: v })}
          />
          <Slider
            label="ink from"
            value={cfg.markOpFrom}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => set({ markOpFrom: v })}
          />
          <Slider
            label="ink to"
            value={cfg.markOpTo}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => set({ markOpTo: v })}
          />
        </Section>

        <Section title="BAND SLAB">
          <Slider
            label="centre y"
            value={cfg.bandY}
            min={-0.5}
            max={0.5}
            step={0.005}
            onChange={(v) => set({ bandY: v })}
          />
          <Slider
            label="half h"
            value={cfg.bandHalf}
            min={0.02}
            max={0.4}
            step={0.005}
            onChange={(v) => set({ bandHalf: v })}
          />
          <Slider
            label="soft"
            value={cfg.bandSoft}
            min={0.005}
            max={0.2}
            step={0.005}
            onChange={(v) => set({ bandSoft: v })}
          />
          <Slider
            label="x half"
            value={cfg.bandXHalf}
            min={0.2}
            max={0.87}
            step={0.005}
            onChange={(v) => set({ bandXHalf: v })}
          />
        </Section>

        <Section title="CONTEXT">
          <Row>
            <LabButton
              label="ORBITS"
              active={cfg.showOrbits}
              onClick={() => set({ showOrbits: !cfg.showOrbits })}
            />
          </Row>
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
            min={2.4}
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
