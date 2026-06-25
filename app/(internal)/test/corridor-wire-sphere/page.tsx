"use client";

/**
 * /test/corridor-wire-sphere
 *
 * Focused lab for the corridor-to-Services question: what happens if
 * the intelligence-layer sphere carries the wireframe brandmark from
 * the opening read. Production is untouched; this route reuses the
 * real substrate sphere freeze harness and the existing ADR-023 GLB
 * wireframe target used by the current particle brandmark.
 */

import { useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import * as THREE from "three";

import {
  BrandmarkPhysicsCore,
  BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP,
} from "@/components/brand/BrandmarkPhysicsCore";
import { StaticStarfield } from "@/components/landing/home-v2/DepthGatewayScene/StaticStarfield";
import { SUBSTRATE_GYRO_DOTTED_SHELL_RADIUS_MUL } from "@/components/landing/home-v2/DepthGatewayScene/shell/shellGeom";
import { BRANDMARK_GLB } from "@/components/landing/home-v2/services/hologram";
import { sampleBrandmark3D } from "@/lib/brandmark/sampleBrandmark3D";
import { useGyroLabStore } from "@/lib/stores/gyroLabStore";

import {
  LAB_GYRO_ASSEMBLY_SCALE,
  SubstrateSphereStage,
} from "../brandmark-in-sphere/SubstrateSphereStage";

type Mode = "wire" | "dust" | "sphere";
type Blend = "additive" | "normal";

const MODE_OPTIONS: readonly { id: Mode; label: string }[] = [
  { id: "wire", label: "GLB wire" },
  { id: "dust", label: "Dust core" },
  { id: "sphere", label: "Sphere only" },
];

const DEFAULT_SPHERE_RADIUS = 0.72;

const DEFAULTS = {
  mode: "wire" as Mode,
  blend: "additive" as Blend,
  markOpacity: 0.96,
  wirePointSize: 4.45,
  dustPointSize: 4.0,
  sphereRadius: DEFAULT_SPHERE_RADIUS,
  sphereDensity: 1,
  surfaceDensity: 0.74,
  idleSpeed: 0.65,
  cameraDistance: 3.95,
  cameraFov: 34,
};

export default function CorridorWireSpherePage() {
  const [mode, setMode] = useState<Mode>(DEFAULTS.mode);
  const [blend, setBlend] = useState<Blend>(DEFAULTS.blend);
  const [markOpacity, setMarkOpacity] = useState(DEFAULTS.markOpacity);
  const [wirePointSize, setWirePointSize] = useState(DEFAULTS.wirePointSize);
  const [dustPointSize, setDustPointSize] = useState(DEFAULTS.dustPointSize);
  const [sphereRadius, setSphereRadius] = useState(DEFAULTS.sphereRadius);
  const [sphereDensity, setSphereDensity] = useState(DEFAULTS.sphereDensity);
  const [surfaceDensity, setSurfaceDensity] = useState(DEFAULTS.surfaceDensity);
  const [idleSpeed, setIdleSpeed] = useState(DEFAULTS.idleSpeed);
  const [cameraDistance, setCameraDistance] = useState(DEFAULTS.cameraDistance);
  const [cameraFov, setCameraFov] = useState(DEFAULTS.cameraFov);

  useEffect(() => {
    useGyroLabStore.getState().set({
      ringCount: 3,
      globeRadius: sphereRadius,
      globeDensity: sphereDensity,
      particleDensity: surfaceDensity,
      showParticles: true,
      idleSpeed,
    });
  }, [sphereRadius, sphereDensity, surfaceDensity, idleSpeed]);

  const sphereEnvelopeRadius = getSphereEnvelopeRadius(sphereRadius);

  const reset = () => {
    setMode(DEFAULTS.mode);
    setBlend(DEFAULTS.blend);
    setMarkOpacity(DEFAULTS.markOpacity);
    setWirePointSize(DEFAULTS.wirePointSize);
    setDustPointSize(DEFAULTS.dustPointSize);
    setSphereRadius(DEFAULTS.sphereRadius);
    setSphereDensity(DEFAULTS.sphereDensity);
    setSurfaceDensity(DEFAULTS.surfaceDensity);
    setIdleSpeed(DEFAULTS.idleSpeed);
    setCameraDistance(DEFAULTS.cameraDistance);
    setCameraFov(DEFAULTS.cameraFov);
  };

  return (
    <main className="corridor-wire-sphere" style={pageStyle}>
      <Canvas
        camera={{ position: [0, 0, cameraDistance], fov: cameraFov, near: 0.1, far: 100 }}
        dpr={[1, 1.75]}
        frameloop="always"
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
        style={canvasStyle}
      >
        <StaticStarfield count={1800} />
        <SubstrateSphereStage showSphere reducedMotion={idleSpeed === 0} />
        {mode !== "sphere" ? (
          <group scale={sphereEnvelopeRadius * 2}>
            {mode === "wire" ? (
              <Suspense fallback={null}>
                <ServicesWireBrandmarkCore
                  count={BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP}
                  blending={blend}
                  pointSize={wirePointSize}
                  opacity={markOpacity}
                />
              </Suspense>
            ) : (
              <BrandmarkPhysicsCore
                count={BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP}
                reducedMotion
                seedAtHome
                basis="dome-fill"
                shape="dot"
                blending="additive"
                pointSize={dustPointSize}
                opacity={markOpacity * 0.9}
                color="#caa554"
                accentColor="#f0db9a"
                corridorKeep={0.27}
                cleanFieldKeep={0.65}
                cleanFieldDotScale={0.5}
                cleanFieldEdge={0.4}
                depth={1}
                coverMorph={1}
                bulge={0.18}
                thickness={0.06}
                renderOrder={4}
              />
            )}
          </group>
        ) : null}
      </Canvas>

      <div className="corridor-wire-sphere__hud-frame" style={hudFrameStyle} aria-hidden="true">
        <div style={cornerTopLeftStyle} />
        <div style={cornerTopRightStyle} />
        <div style={cornerBottomLeftStyle} />
        <div style={cornerBottomRightStyle} />
      </div>

      <section
        className="corridor-wire-sphere__headline"
        style={headlineStyle}
        aria-label="Corridor seam preview"
      >
        <p style={kickerStyle}>INTELLIGENCE LAYER</p>
        <h1 style={titleStyle}>
          EVERYONE IS RACING TO
          <br />
          BUILD <span style={goldTextStyle}>THIS LAYER.</span>
        </h1>
      </section>

      <aside className="corridor-wire-sphere__panel" style={panelStyle}>
        <div style={panelHeaderStyle}>
          <p style={panelEyebrowStyle}>TEST / CORRIDOR</p>
          <h2 style={panelTitleStyle}>Wire Sphere</h2>
        </div>

        <SectionLabel>Read</SectionLabel>
        <div style={buttonGridStyle}>
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id)}
              style={option.id === mode ? activeButtonStyle : buttonStyle}
            >
              {option.label}
            </button>
          ))}
        </div>

        <SectionLabel>Wire</SectionLabel>
        <div style={buttonGridStyle}>
          <button
            type="button"
            onClick={() => setBlend("additive")}
            style={blend === "additive" ? activeButtonStyle : buttonStyle}
          >
            Glow
          </button>
          <button
            type="button"
            onClick={() => setBlend("normal")}
            style={blend === "normal" ? activeButtonStyle : buttonStyle}
          >
            Ink
          </button>
        </div>
        <ControlSlider
          label="Core point"
          value={wirePointSize}
          min={1.4}
          max={6}
          step={0.05}
          onChange={setWirePointSize}
        />
        <ControlSlider
          label="Opacity"
          value={markOpacity}
          min={0.15}
          max={1}
          step={0.01}
          onChange={setMarkOpacity}
        />

        <SectionLabel>Sphere</SectionLabel>
        <ControlSlider
          label="Radius"
          value={sphereRadius}
          min={0.48}
          max={1.05}
          step={0.01}
          onChange={setSphereRadius}
        />
        <Readout label="Envelope" value={sphereEnvelopeRadius} />
        <ControlSlider
          label="Globe density"
          value={sphereDensity}
          min={0.45}
          max={1.4}
          step={0.05}
          onChange={setSphereDensity}
        />
        <ControlSlider
          label="Surface density"
          value={surfaceDensity}
          min={0.2}
          max={1.3}
          step={0.05}
          onChange={setSurfaceDensity}
        />
        <ControlSlider
          label="Idle speed"
          value={idleSpeed}
          min={0}
          max={1.5}
          step={0.05}
          onChange={setIdleSpeed}
        />

        <SectionLabel>Camera</SectionLabel>
        <ControlSlider
          label="Distance"
          value={cameraDistance}
          min={2.4}
          max={6.5}
          step={0.05}
          onChange={setCameraDistance}
        />
        <ControlSlider
          label="FOV"
          value={cameraFov}
          min={24}
          max={58}
          step={1}
          onChange={setCameraFov}
        />

        <button type="button" onClick={reset} style={resetButtonStyle}>
          Reset
        </button>
      </aside>
      <style jsx>{`
        @media (max-width: 760px) {
          .corridor-wire-sphere__hud-frame {
            inset: 18px !important;
          }

          .corridor-wire-sphere__headline {
            top: 28px !important;
            width: min(92vw, 520px) !important;
          }

          .corridor-wire-sphere__panel {
            top: auto !important;
            right: 14px !important;
            bottom: 14px !important;
            left: 14px !important;
            width: auto !important;
            max-height: 36svh !important;
            padding: 14px !important;
          }
        }
      `}</style>
    </main>
  );
}

interface ServicesWireBrandmarkCoreProps {
  count: number;
  blending: Blend;
  pointSize: number;
  opacity: number;
}

function ServicesWireBrandmarkCore({
  count,
  blending,
  pointSize,
  opacity,
}: ServicesWireBrandmarkCoreProps) {
  const { scene } = useGLTF(BRANDMARK_GLB);

  const targetHomes = useMemo(() => {
    const geos: THREE.BufferGeometry[] = [];
    scene.updateMatrixWorld(true);
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      const clone = mesh.geometry.clone();
      clone.applyMatrix4(mesh.matrixWorld);
      geos.push(clone);
    });
    if (geos.length === 0) return null;

    const sample = sampleBrandmark3D(geos, {
      wireCount: count,
      surfaceCount: 0,
      shellCount: 0,
      depthStrutCount: 0,
      edgeThresholdDeg: 18,
      radius: 0.5,
    });
    geos.forEach((geo) => geo.dispose());

    const result = new Float32Array(count * 3);
    const available = Math.min(sample.count, count);
    for (let i = 0; i < available; i++) {
      result[i * 3] = sample.armHomes[i * 3];
      result[i * 3 + 1] = sample.armHomes[i * 3 + 1];
      result[i * 3 + 2] = sample.armHomes[i * 3 + 2];
    }
    fitPositionsToRadius(result, 0.5);
    return result;
  }, [scene, count]);

  return (
    <BrandmarkPhysicsCore
      count={count}
      reducedMotion
      seedAtHome
      targetHomes={targetHomes}
      basis="dome-fill"
      shape="dot"
      glyph="plus"
      blending={blending}
      pointSize={pointSize}
      opacity={opacity}
      color="#caa554"
      accentColor="#f0db9a"
      corridorKeep={0.27}
      cleanFieldKeep={0.65}
      cleanFieldDotScale={0.5}
      cleanFieldEdge={0.4}
      depth={1}
      coverMorph={1}
      bulge={0.18}
      thickness={0.06}
      renderOrder={4}
    />
  );
}

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function ControlSlider({ label, value, min, max, step, onChange }: ControlSliderProps) {
  return (
    <label style={sliderStyle}>
      <span style={sliderLabelStyle}>
        <span>{label}</span>
        <span style={sliderValueStyle}>{formatValue(value, step)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
        style={rangeStyle}
      />
    </label>
  );
}

function Readout({ label, value }: { label: string; value: number }) {
  return (
    <div style={readoutStyle}>
      <span>{label}</span>
      <span style={sliderValueStyle}>{value.toFixed(2)}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div style={sectionLabelStyle}>{children}</div>;
}

function getSphereEnvelopeRadius(globeRadius: number): number {
  return globeRadius * SUBSTRATE_GYRO_DOTTED_SHELL_RADIUS_MUL * LAB_GYRO_ASSEMBLY_SCALE;
}

function fitPositionsToRadius(positions: Float32Array, radius: number): void {
  let maxRadius = 0;
  for (let i = 0; i < positions.length; i += 3) {
    maxRadius = Math.max(maxRadius, Math.hypot(positions[i], positions[i + 1], positions[i + 2]));
  }
  if (maxRadius <= 0) return;

  const scale = radius / maxRadius;
  for (let i = 0; i < positions.length; i++) {
    positions[i] *= scale;
  }
}

function formatValue(value: number, step: number): string {
  if (step >= 1) return value.toFixed(0);
  if (step >= 0.1) return value.toFixed(1);
  return value.toFixed(2);
}

useGLTF.preload(BRANDMARK_GLB);

const pageStyle: CSSProperties = {
  minHeight: "100svh",
  position: "relative",
  overflow: "hidden",
  color: "var(--dawn, #ebe3d6)",
  background:
    "radial-gradient(circle at 50% 58%, rgba(202, 165, 84, 0.13), transparent 34%), #050504",
  fontFamily: "var(--font-pp-neue-montreal, ui-sans-serif), system-ui, sans-serif",
};

const canvasStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "auto",
};

const hudFrameStyle: CSSProperties = {
  position: "fixed",
  inset: 32,
  pointerEvents: "none",
  zIndex: 8,
  borderLeft: "1px solid rgba(235, 227, 214, 0.32)",
  borderRight: "1px solid rgba(235, 227, 214, 0.32)",
};

const cornerBaseStyle: CSSProperties = {
  position: "absolute",
  width: 38,
  height: 38,
  borderColor: "rgba(235, 227, 214, 0.65)",
};

const cornerTopLeftStyle: CSSProperties = {
  ...cornerBaseStyle,
  top: 0,
  left: 0,
  borderTop: "1px solid",
  borderLeft: "1px solid",
};

const cornerTopRightStyle: CSSProperties = {
  ...cornerBaseStyle,
  top: 0,
  right: 0,
  borderTop: "1px solid",
  borderRight: "1px solid",
};

const cornerBottomLeftStyle: CSSProperties = {
  ...cornerBaseStyle,
  bottom: 0,
  left: 0,
  borderBottom: "1px solid",
  borderLeft: "1px solid",
};

const cornerBottomRightStyle: CSSProperties = {
  ...cornerBaseStyle,
  right: 0,
  bottom: 0,
  borderRight: "1px solid",
  borderBottom: "1px solid",
};

const headlineStyle: CSSProperties = {
  position: "fixed",
  top: "clamp(42px, 7vh, 86px)",
  left: "50%",
  transform: "translateX(-50%)",
  width: "min(820px, 72vw)",
  zIndex: 12,
  textAlign: "center",
  pointerEvents: "none",
};

const kickerStyle: CSSProperties = {
  margin: "0 0 10px",
  color: "rgba(202, 165, 84, 0.72)",
  fontFamily: "var(--font-pt-mono, ui-monospace), monospace",
  fontSize: 10,
  letterSpacing: "0.28em",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "clamp(26px, 3.3vw, 54px)",
  lineHeight: 0.98,
  letterSpacing: 0,
  fontWeight: 500,
  textShadow: "0 0 18px rgba(0, 0, 0, 0.75)",
};

const goldTextStyle: CSSProperties = {
  color: "var(--gold, #caa554)",
};

const panelStyle: CSSProperties = {
  position: "fixed",
  right: 24,
  top: 24,
  zIndex: 20,
  width: 330,
  maxHeight: "calc(100svh - 48px)",
  overflowY: "auto",
  padding: 18,
  boxSizing: "border-box",
  background: "rgba(8, 7, 6, 0.88)",
  border: "1px solid rgba(202, 165, 84, 0.36)",
  color: "var(--dawn, #ebe3d6)",
  fontFamily: "var(--font-pt-mono, ui-monospace), monospace",
  backdropFilter: "blur(10px)",
};

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: 12,
  marginBottom: 12,
};

const panelEyebrowStyle: CSSProperties = {
  margin: 0,
  color: "rgba(235, 227, 214, 0.45)",
  fontSize: 9,
  letterSpacing: "0.18em",
};

const panelTitleStyle: CSSProperties = {
  margin: 0,
  color: "var(--gold, #caa554)",
  fontSize: 13,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

const sectionLabelStyle: CSSProperties = {
  marginTop: 14,
  marginBottom: 8,
  paddingTop: 8,
  borderTop: "1px dashed rgba(202, 165, 84, 0.22)",
  color: "rgba(202, 165, 84, 0.75)",
  fontSize: 9,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
};

const buttonGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 6,
  marginBottom: 10,
};

const buttonStyle: CSSProperties = {
  minHeight: 34,
  padding: "7px 8px",
  background: "rgba(235, 227, 214, 0.02)",
  border: "1px solid rgba(235, 227, 214, 0.16)",
  color: "rgba(235, 227, 214, 0.62)",
  fontFamily: "inherit",
  fontSize: 9,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const activeButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "rgba(202, 165, 84, 0.12)",
  borderColor: "rgba(202, 165, 84, 0.62)",
  color: "var(--gold, #caa554)",
};

const sliderStyle: CSSProperties = {
  display: "block",
  marginBottom: 9,
};

const sliderLabelStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 4,
  color: "rgba(235, 227, 214, 0.64)",
  fontSize: 9,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

const sliderValueStyle: CSSProperties = {
  color: "var(--gold, #caa554)",
};

const readoutStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 9,
  color: "rgba(235, 227, 214, 0.64)",
  fontSize: 9,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

const rangeStyle: CSSProperties = {
  width: "100%",
  accentColor: "var(--gold, #caa554)",
};

const resetButtonStyle: CSSProperties = {
  ...buttonStyle,
  width: "100%",
  marginTop: 12,
  borderColor: "rgba(202, 165, 84, 0.52)",
  color: "var(--gold, #caa554)",
};
