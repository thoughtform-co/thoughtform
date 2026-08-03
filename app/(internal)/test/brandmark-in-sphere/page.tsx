"use client";

/**
 * /test/brandmark-in-sphere â€” designer lab for the brandmark
 * particle look that sits at the centre of the Navigate substrate
 * sphere (the Navigate beat in `home-v2`).
 *
 * Renders the REAL `ShellSubstrateGyro` instrument frozen + fully
 * revealed (via the freeze harness in `SubstrateSphereStage`) and
 * lets the designer swap the centre brandmark painter between four
 * approaches â€” including a fully tunable `LabBrandmarkCloud` that
 * exposes density, sprite style, motion, and brandmark<->sphere
 * morph as live controls.
 *
 * The point of this lab is the COMPOSITION read: any change to the
 * centre mark is judged inside the real sphere, not in isolation.
 *
 * Internal route â€” blocked from production by `proxy.ts`. The
 * inline control panel mirrors the visual language of the existing
 * `/test/brandmark-physics-core` and `/test/brandmark-3d` labs.
 */

import { Canvas } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Brandmark3D,
  MATCAP_PRESETS,
  type Brandmark3DMaterialMode,
  type MatcapPresetName,
} from "@/components/brand/Brandmark3D";
import {
  BrandmarkPhysicsCore,
  BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP,
} from "@/components/brand/BrandmarkPhysicsCore";
import { useGyroLabStore } from "@/lib/stores/gyroLabStore";

import {
  LabBrandmarkCloud,
  SPRITE_STYLES,
  type LabBlendMode,
  type LabSpriteStyle,
  type LabTopology,
} from "./LabBrandmarkCloud";
import { SubstrateSphereStage } from "./SubstrateSphereStage";

// â”€â”€ System (centre-mark painter) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type System = "static-cloud" | "physics-core" | "extruded-3d" | "none";

const SYSTEMS: readonly { id: System; label: string }[] = [
  { id: "static-cloud", label: "Static cloud (configurable)" },
  { id: "physics-core", label: "Physics core (GPGPU, current production)" },
  { id: "extruded-3d", label: "3D extruded mesh" },
  { id: "none", label: "Hidden â€” sphere only" },
];

type Background = "dark" | "void" | "test";

const DEFAULTS = {
  // System
  system: "static-cloud" as System,

  // Centre group â€” world half-extent (the wrapping group is scaled
  // by 2 Ã— this, matching the production
  // `BrandmarkPhysicsCoreActor` convention).
  worldHalfExtent: 0.34,

  // Static cloud
  cloudCount: 1300,
  cloudDensity: 1,
  cloudPointSize: 2.8,
  cloudColor: "#caa554",
  cloudAccent: "#e9c97a",
  cloudOpacity: 0.78,
  cloudStyle: "soft-dot" as LabSpriteStyle,
  cloudTopology: "full" as LabTopology,
  cloudDepth3D: true,
  cloudSphereMorph: 0,
  cloudTwinkle: 0.35,
  cloudWander: 0.25,
  cloudSpinRate: 0.06,
  cloudBlend: "additive" as LabBlendMode,

  // Physics core
  coreCount: BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP,
  coreIgnite: 1,
  corePointSize: 2.8,
  coreColor: "#caa554",
  coreAccent: "#e9c97a",
  coreOpacity: 0.78,
  coreScatterRadius: 0.55,
  coreBulge: 0.18,
  coreThickness: 0.06,
  corePaused: false,

  // 3D extruded
  extrudedDepth: 20,
  extrudedBevelSize: 2,
  extrudedMatcapPreset: "gold" as MatcapPresetName,
  extrudedAutoRotate: 0.18,

  // Sphere â€” gyroLabStore patches
  sphereShow: true,
  sphereRingCount: 3,
  sphereGlobeRadius: 0.72,
  sphereGlobeDensity: 1,
  sphereParticleDensity: 0.7,
  sphereShowParticles: true,
  sphereIdleSpeed: 1,

  // Camera
  cameraDistance: 4,
  cameraFov: 35,

  // Background
  background: "dark" as Background,
} satisfies Record<string, unknown>;

export default function BrandmarkInSpherePage() {
  // â”€â”€ System â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [system, setSystem] = useState<System>(DEFAULTS.system);
  const [worldHalfExtent, setWorldHalfExtent] = useState(DEFAULTS.worldHalfExtent);

  // â”€â”€ Static cloud state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [cloudCount, setCloudCount] = useState(DEFAULTS.cloudCount);
  const [cloudDensity, setCloudDensity] = useState(DEFAULTS.cloudDensity);
  const [cloudPointSize, setCloudPointSize] = useState(DEFAULTS.cloudPointSize);
  const [cloudColor, setCloudColor] = useState(DEFAULTS.cloudColor);
  const [cloudAccent, setCloudAccent] = useState(DEFAULTS.cloudAccent);
  const [cloudOpacity, setCloudOpacity] = useState(DEFAULTS.cloudOpacity);
  const [cloudStyle, setCloudStyle] = useState<LabSpriteStyle>(DEFAULTS.cloudStyle);
  const [cloudTopology, setCloudTopology] = useState<LabTopology>(DEFAULTS.cloudTopology);
  const [cloudDepth3D, setCloudDepth3D] = useState(DEFAULTS.cloudDepth3D);
  const [cloudSphereMorph, setCloudSphereMorph] = useState(DEFAULTS.cloudSphereMorph);
  const [cloudTwinkle, setCloudTwinkle] = useState(DEFAULTS.cloudTwinkle);
  const [cloudWander, setCloudWander] = useState(DEFAULTS.cloudWander);
  const [cloudSpinRate, setCloudSpinRate] = useState(DEFAULTS.cloudSpinRate);
  const [cloudBlend, setCloudBlend] = useState<LabBlendMode>(DEFAULTS.cloudBlend);

  // â”€â”€ Physics core state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [coreCount, setCoreCount] = useState(DEFAULTS.coreCount);
  const [coreIgnite, setCoreIgnite] = useState(DEFAULTS.coreIgnite);
  const [corePointSize, setCorePointSize] = useState(DEFAULTS.corePointSize);
  const [coreColor, setCoreColor] = useState(DEFAULTS.coreColor);
  const [coreAccent, setCoreAccent] = useState(DEFAULTS.coreAccent);
  const [coreOpacity, setCoreOpacity] = useState(DEFAULTS.coreOpacity);
  const [coreScatterRadius, setCoreScatterRadius] = useState(DEFAULTS.coreScatterRadius);
  const [coreBulge, setCoreBulge] = useState(DEFAULTS.coreBulge);
  const [coreThickness, setCoreThickness] = useState(DEFAULTS.coreThickness);
  const [corePaused, setCorePaused] = useState(DEFAULTS.corePaused);

  // â”€â”€ 3D extruded state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [extrudedDepth, setExtrudedDepth] = useState(DEFAULTS.extrudedDepth);
  const [extrudedBevelSize, setExtrudedBevelSize] = useState(DEFAULTS.extrudedBevelSize);
  const [extrudedMatcapPreset, setExtrudedMatcapPreset] = useState<MatcapPresetName>(
    DEFAULTS.extrudedMatcapPreset
  );
  const [extrudedAutoRotate, setExtrudedAutoRotate] = useState(DEFAULTS.extrudedAutoRotate);

  // â”€â”€ Sphere state (writes through gyroLabStore) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [sphereShow, setSphereShow] = useState(DEFAULTS.sphereShow);
  const [sphereRingCount, setSphereRingCount] = useState(DEFAULTS.sphereRingCount);
  const [sphereGlobeRadius, setSphereGlobeRadius] = useState(DEFAULTS.sphereGlobeRadius);
  const [sphereGlobeDensity, setSphereGlobeDensity] = useState(DEFAULTS.sphereGlobeDensity);
  const [sphereParticleDensity, setSphereParticleDensity] = useState(
    DEFAULTS.sphereParticleDensity
  );
  const [sphereShowParticles, setSphereShowParticles] = useState(DEFAULTS.sphereShowParticles);
  const [sphereIdleSpeed, setSphereIdleSpeed] = useState(DEFAULTS.sphereIdleSpeed);

  // â”€â”€ Camera + background â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [cameraDistance, setCameraDistance] = useState(DEFAULTS.cameraDistance);
  const [cameraFov, setCameraFov] = useState(DEFAULTS.cameraFov);
  const [background, setBackground] = useState<Background>(DEFAULTS.background);

  // â”€â”€ Sphere â†’ gyroLabStore sync â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // The sphere reads its tuning knobs from the store every frame
  // (subscribes to changes inside `ShellSubstrateGyro`). We keep the
  // panel state local to React and patch the store on change.
  useEffect(() => {
    useGyroLabStore.getState().set({
      ringCount: sphereRingCount,
      globeRadius: sphereGlobeRadius,
      globeDensity: sphereGlobeDensity,
      particleDensity: sphereParticleDensity,
      showParticles: sphereShowParticles,
      idleSpeed: sphereIdleSpeed,
    });
  }, [
    sphereRingCount,
    sphereGlobeRadius,
    sphereGlobeDensity,
    sphereParticleDensity,
    sphereShowParticles,
    sphereIdleSpeed,
  ]);

  // â”€â”€ Resets â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const resetCenterScale = useCallback(() => {
    setWorldHalfExtent(DEFAULTS.worldHalfExtent);
  }, []);

  const resetCloud = useCallback(() => {
    setCloudCount(DEFAULTS.cloudCount);
    setCloudDensity(DEFAULTS.cloudDensity);
    setCloudPointSize(DEFAULTS.cloudPointSize);
    setCloudColor(DEFAULTS.cloudColor);
    setCloudAccent(DEFAULTS.cloudAccent);
    setCloudOpacity(DEFAULTS.cloudOpacity);
    setCloudStyle(DEFAULTS.cloudStyle);
    setCloudTopology(DEFAULTS.cloudTopology);
    setCloudDepth3D(DEFAULTS.cloudDepth3D);
    setCloudSphereMorph(DEFAULTS.cloudSphereMorph);
    setCloudTwinkle(DEFAULTS.cloudTwinkle);
    setCloudWander(DEFAULTS.cloudWander);
    setCloudSpinRate(DEFAULTS.cloudSpinRate);
    setCloudBlend(DEFAULTS.cloudBlend);
  }, []);

  const resetCore = useCallback(() => {
    setCoreCount(DEFAULTS.coreCount);
    setCoreIgnite(DEFAULTS.coreIgnite);
    setCorePointSize(DEFAULTS.corePointSize);
    setCoreColor(DEFAULTS.coreColor);
    setCoreAccent(DEFAULTS.coreAccent);
    setCoreOpacity(DEFAULTS.coreOpacity);
    setCoreScatterRadius(DEFAULTS.coreScatterRadius);
    setCoreBulge(DEFAULTS.coreBulge);
    setCoreThickness(DEFAULTS.coreThickness);
    setCorePaused(DEFAULTS.corePaused);
  }, []);

  const resetExtruded = useCallback(() => {
    setExtrudedDepth(DEFAULTS.extrudedDepth);
    setExtrudedBevelSize(DEFAULTS.extrudedBevelSize);
    setExtrudedMatcapPreset(DEFAULTS.extrudedMatcapPreset);
    setExtrudedAutoRotate(DEFAULTS.extrudedAutoRotate);
  }, []);

  const resetSphere = useCallback(() => {
    setSphereShow(DEFAULTS.sphereShow);
    setSphereRingCount(DEFAULTS.sphereRingCount);
    setSphereGlobeRadius(DEFAULTS.sphereGlobeRadius);
    setSphereGlobeDensity(DEFAULTS.sphereGlobeDensity);
    setSphereParticleDensity(DEFAULTS.sphereParticleDensity);
    setSphereShowParticles(DEFAULTS.sphereShowParticles);
    setSphereIdleSpeed(DEFAULTS.sphereIdleSpeed);
  }, []);

  const resetCamera = useCallback(() => {
    setCameraDistance(DEFAULTS.cameraDistance);
    setCameraFov(DEFAULTS.cameraFov);
    setBackground(DEFAULTS.background);
  }, []);

  const resetAll = useCallback(() => {
    setSystem(DEFAULTS.system);
    resetCenterScale();
    resetCloud();
    resetCore();
    resetExtruded();
    resetSphere();
    resetCamera();
  }, [resetCenterScale, resetCloud, resetCore, resetExtruded, resetSphere, resetCamera]);

  const matcapPreset = useMemo(() => MATCAP_PRESETS[extrudedMatcapPreset], [extrudedMatcapPreset]);

  const backgroundColor =
    background === "dark"
      ? "var(--surface-0, #0a0908)"
      : background === "void"
        ? "#000"
        : "linear-gradient(135deg, #1a1614 0%, #0a0908 50%, #14110d 100%)";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: backgroundColor,
        color: "var(--dawn, #ece3d6)",
        fontFamily: "var(--font-pp-neue-montreal, ui-sans-serif), sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, cameraDistance], fov: cameraFov, near: 0.1, far: 100 }}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
        frameloop="always"
        style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}
      >
        {/* Real Navigate substrate sphere â€” frozen + revealed. The
            stage component patches the depth-gateway store on mount
            and snaps the motion follower every frame so the sphere
            sits at full reveal regardless of scroll. */}
        <SubstrateSphereStage showSphere={sphereShow} reducedMotion={false} />

        {/* Centre brandmark group â€” every system samples the cloud
            in normalised [-0.5, 0.5] space; the wrapper scales by
            `2 Ã— worldHalfExtent` so the mark lands at the same world
            scale the production `BrandmarkPhysicsCoreActor` uses. */}
        <group scale={worldHalfExtent * 2}>
          {system === "static-cloud" && (
            <LabBrandmarkCloud
              count={cloudCount}
              density={cloudDensity}
              pointSize={cloudPointSize}
              color={cloudColor}
              accentColor={cloudAccent}
              opacity={cloudOpacity}
              style={cloudStyle}
              topology={cloudTopology}
              depth3D={cloudDepth3D}
              sphereMorph={cloudSphereMorph}
              twinkle={cloudTwinkle}
              wander={cloudWander}
              spinRate={cloudSpinRate}
              blend={cloudBlend}
            />
          )}
          {system === "physics-core" && (
            <BrandmarkPhysicsCore
              count={coreCount}
              ignite={coreIgnite}
              pointSize={corePointSize}
              color={coreColor}
              accentColor={coreAccent}
              opacity={coreOpacity}
              scatterRadius={coreScatterRadius}
              bulge={coreBulge}
              thickness={coreThickness}
              paused={corePaused}
            />
          )}
          {system === "extruded-3d" && (
            <Brandmark3D
              geometry={{
                depth: extrudedDepth,
                bevelSize: extrudedBevelSize,
                bevelThickness: 2,
                bevelSegments: 4,
                curveSegments: 18,
                targetSize: 1,
              }}
              materialMode={"matcap" as Brandmark3DMaterialMode}
              matcap={{
                core: matcapPreset.core,
                mid: matcapPreset.mid,
                edge: matcapPreset.edge,
                midStop: matcapPreset.midStop,
                edgeStop: matcapPreset.edgeStop,
                style: matcapPreset.style,
              }}
              autoRotateSpeed={extrudedAutoRotate}
              pointerParallax={false}
              middleMouseDrag={false}
            />
          )}
        </group>
      </Canvas>

      {/* â”€â”€ Control panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={panelContainerStyle}>
        <h1 style={panelTitleStyle}>Brandmark in Sphere</h1>
        <p style={panelSubtitleStyle}>
          Compares particle approaches for the centre brandmark inside the real Navigate gimbal
          sphere. Pick a system and tune. Production is the physics core; the static cloud is the
          sandbox for alternatives.
        </p>
        <button type="button" onClick={resetAll} style={primaryResetButtonStyle}>
          Reset all to defaults
        </button>

        <SectionLabel>Centre system</SectionLabel>
        <div style={{ marginBottom: 10 }}>
          {SYSTEMS.map((s) => (
            <RadioRow
              key={s.id}
              label={s.label}
              checked={system === s.id}
              onChange={() => setSystem(s.id)}
            />
          ))}
        </div>
        <ControlSlider
          label="Centre half-extent (world)"
          value={worldHalfExtent}
          min={0.1}
          max={1.2}
          step={0.01}
          onChange={setWorldHalfExtent}
        />
        <button type="button" onClick={resetCenterScale} style={resetButtonStyle}>
          Reset centre scale
        </button>

        {system === "static-cloud" && (
          <>
            <SectionLabel>Cloud â€” sprite + topology</SectionLabel>
            <div style={{ marginBottom: 10 }}>
              {SPRITE_STYLES.map((s) => (
                <RadioRow
                  key={s.id}
                  label={s.label}
                  checked={cloudStyle === s.id}
                  onChange={() => setCloudStyle(s.id)}
                />
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <RadioRow
                label="Full mark"
                checked={cloudTopology === "full"}
                onChange={() => setCloudTopology("full")}
              />
              <RadioRow
                label="Ring only"
                checked={cloudTopology === "ring"}
                onChange={() => setCloudTopology("ring")}
              />
            </div>
            <Checkbox
              label="3D depth (dome + jitter)"
              checked={cloudDepth3D}
              onChange={setCloudDepth3D}
            />
            <ControlSlider
              label="Brandmark <-> sphere morph"
              value={cloudSphereMorph}
              min={0}
              max={1}
              step={0.01}
              onChange={setCloudSphereMorph}
            />

            <SectionLabel>Cloud â€” density + size</SectionLabel>
            <ControlSlider
              label="Particle count"
              value={cloudCount}
              min={300}
              max={6000}
              step={50}
              onChange={(v) => setCloudCount(Math.round(v))}
            />
            <ControlSlider
              label="Visible density"
              value={cloudDensity}
              min={0}
              max={1}
              step={0.01}
              onChange={setCloudDensity}
            />
            <ControlSlider
              label="Point size (CSS px)"
              value={cloudPointSize}
              min={0.5}
              max={14}
              step={0.1}
              onChange={setCloudPointSize}
            />

            <SectionLabel>Cloud â€” colour</SectionLabel>
            <ColorRow label="Body" value={cloudColor} onChange={setCloudColor} />
            <ColorRow label="Accent" value={cloudAccent} onChange={setCloudAccent} />
            <ControlSlider
              label="Opacity"
              value={cloudOpacity}
              min={0}
              max={1}
              step={0.01}
              onChange={setCloudOpacity}
            />
            <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <RadioRow
                label="Additive"
                checked={cloudBlend === "additive"}
                onChange={() => setCloudBlend("additive")}
              />
              <RadioRow
                label="Normal"
                checked={cloudBlend === "normal"}
                onChange={() => setCloudBlend("normal")}
              />
            </div>

            <SectionLabel>Cloud â€” motion</SectionLabel>
            <ControlSlider
              label="Twinkle (alpha jitter)"
              value={cloudTwinkle}
              min={0}
              max={1}
              step={0.01}
              onChange={setCloudTwinkle}
            />
            <ControlSlider
              label="Wander (position drift)"
              value={cloudWander}
              min={0}
              max={1}
              step={0.01}
              onChange={setCloudWander}
            />
            <ControlSlider
              label="Spin rate (rad/s)"
              value={cloudSpinRate}
              min={-0.5}
              max={0.5}
              step={0.01}
              onChange={setCloudSpinRate}
            />
            <button type="button" onClick={resetCloud} style={resetButtonStyle}>
              Reset cloud
            </button>
          </>
        )}

        {system === "physics-core" && (
          <>
            <SectionLabel>Physics core</SectionLabel>
            <ControlSlider
              label="Ignite (0 = dust, 1 = mark)"
              value={coreIgnite}
              min={0}
              max={1}
              step={0.01}
              onChange={setCoreIgnite}
            />
            <ControlSlider
              label="Particle count"
              value={coreCount}
              min={500}
              max={6000}
              step={100}
              onChange={(v) => setCoreCount(Math.round(v))}
            />
            <ControlSlider
              label="Point size (CSS px)"
              value={corePointSize}
              min={1}
              max={12}
              step={0.1}
              onChange={setCorePointSize}
            />
            <ControlSlider
              label="Opacity"
              value={coreOpacity}
              min={0}
              max={1}
              step={0.01}
              onChange={setCoreOpacity}
            />
            <ColorRow label="Body" value={coreColor} onChange={setCoreColor} />
            <ColorRow label="Rim" value={coreAccent} onChange={setCoreAccent} />
            <ControlSlider
              label="Scatter radius (ignite=0)"
              value={coreScatterRadius}
              min={0}
              max={1.5}
              step={0.01}
              onChange={setCoreScatterRadius}
            />
            <ControlSlider
              label="Forward dome (bulge)"
              value={coreBulge}
              min={0}
              max={0.5}
              step={0.005}
              onChange={setCoreBulge}
            />
            <ControlSlider
              label="Thickness jitter"
              value={coreThickness}
              min={0}
              max={0.3}
              step={0.005}
              onChange={setCoreThickness}
            />
            <Checkbox label="Pause sim" checked={corePaused} onChange={setCorePaused} />
            <button type="button" onClick={resetCore} style={resetButtonStyle}>
              Reset core
            </button>
          </>
        )}

        {system === "extruded-3d" && (
          <>
            <SectionLabel>3D extruded mark</SectionLabel>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginBottom: 10,
              }}
            >
              {(["gold", "chrome", "gunmetal", "iridescent", "holographic"] as const).map(
                (name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setExtrudedMatcapPreset(name)}
                    style={{
                      ...presetChipStyle,
                      color:
                        extrudedMatcapPreset === name
                          ? "var(--gold, #caa554)"
                          : presetChipStyle.color,
                      borderColor:
                        extrudedMatcapPreset === name
                          ? "rgba(202, 165, 84, 0.6)"
                          : "rgba(202, 165, 84, 0.3)",
                    }}
                  >
                    {name}
                  </button>
                )
              )}
            </div>
            <ControlSlider
              label="Depth (SVG units)"
              value={extrudedDepth}
              min={0}
              max={80}
              step={1}
              onChange={setExtrudedDepth}
            />
            <ControlSlider
              label="Bevel size"
              value={extrudedBevelSize}
              min={0}
              max={12}
              step={0.25}
              onChange={setExtrudedBevelSize}
            />
            <ControlSlider
              label="Auto-rotate Y (rad/s)"
              value={extrudedAutoRotate}
              min={-1}
              max={1}
              step={0.01}
              onChange={setExtrudedAutoRotate}
            />
            <button type="button" onClick={resetExtruded} style={resetButtonStyle}>
              Reset 3D mark
            </button>
          </>
        )}

        <SectionLabel>Substrate sphere</SectionLabel>
        <Checkbox label="Show sphere" checked={sphereShow} onChange={setSphereShow} />
        <ControlSlider
          label="Ring count"
          value={sphereRingCount}
          min={0}
          max={3}
          step={1}
          onChange={(v) => setSphereRingCount(Math.round(v))}
        />
        <ControlSlider
          label="Globe radius"
          value={sphereGlobeRadius}
          min={0.4}
          max={1.4}
          step={0.01}
          onChange={setSphereGlobeRadius}
        />
        <ControlSlider
          label="Globe wireframe density"
          value={sphereGlobeDensity}
          min={0.4}
          max={1.5}
          step={0.05}
          onChange={setSphereGlobeDensity}
        />
        <ControlSlider
          label="Surface particle density"
          value={sphereParticleDensity}
          min={0.2}
          max={1.5}
          step={0.05}
          onChange={setSphereParticleDensity}
        />
        <Checkbox
          label="Show surface particles"
          checked={sphereShowParticles}
          onChange={setSphereShowParticles}
        />
        <ControlSlider
          label="Idle spin speed"
          value={sphereIdleSpeed}
          min={0}
          max={2}
          step={0.05}
          onChange={setSphereIdleSpeed}
        />
        <button type="button" onClick={resetSphere} style={resetButtonStyle}>
          Reset sphere
        </button>

        <SectionLabel>Camera + background</SectionLabel>
        <ControlSlider
          label="Camera distance (Z)"
          value={cameraDistance}
          min={1.5}
          max={9}
          step={0.05}
          onChange={setCameraDistance}
        />
        <ControlSlider
          label="Camera FOV"
          value={cameraFov}
          min={20}
          max={70}
          step={1}
          onChange={setCameraFov}
        />
        <RadioRow
          label="Dark"
          checked={background === "dark"}
          onChange={() => setBackground("dark")}
        />
        <RadioRow
          label="Pure black"
          checked={background === "void"}
          onChange={() => setBackground("void")}
        />
        <RadioRow
          label="Gradient"
          checked={background === "test"}
          onChange={() => setBackground("test")}
        />
        <button type="button" onClick={resetCamera} style={resetButtonStyle}>
          Reset camera + background
        </button>

        <p style={panelFooterStyle}>
          The substrate sphere is the real `ShellSubstrateGyro` instrument from production, frozen
          at the Navigate park. Production paths are unaffected â€” both stores reset on unmount.
        </p>
      </div>
    </main>
  );
}

// â”€â”€ Panel primitives â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//
// Mirror the inline styling pattern the existing brandmark labs use
// (`/test/brandmark-physics-core`, `/test/brandmark-3d`). The labs
// intentionally inline these primitives instead of factoring them out â€”
// keeps each lab self-contained.

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
    <label
      style={{
        display: "block",
        marginBottom: 10,
        color: "var(--dawn-70, rgba(236,227,214,0.7))",
      }}
    >
      <span
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          fontSize: 10,
        }}
      >
        <span>{label}</span>
        <span style={{ color: "var(--gold, #caa554)" }}>{formatValue(value, step)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "var(--gold, #caa554)" }}
      />
    </label>
  );
}

function formatValue(v: number, step: number): string {
  if (step >= 1) return v.toFixed(0);
  if (step >= 0.1) return v.toFixed(1);
  if (step >= 0.01) return v.toFixed(2);
  return v.toFixed(3);
}

interface ColorRowProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function ColorRow({ label, value, onChange }: ColorRowProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 10,
        color: "var(--dawn-70, rgba(236,227,214,0.7))",
      }}
    >
      <span
        style={{
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          fontSize: 10,
          flex: 1,
        }}
      >
        {label}
      </span>
      <span style={{ color: "var(--gold, #caa554)", fontSize: 10, textTransform: "uppercase" }}>
        {value}
      </span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 32,
          height: 22,
          padding: 0,
          border: "1px solid rgba(202,165,84,0.35)",
          background: "transparent",
          cursor: "pointer",
        }}
      />
    </label>
  );
}

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
        color: "var(--dawn-70, rgba(236,227,214,0.7))",
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: "var(--gold, #caa554)" }}
      />
      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em" }}>
        {label}
      </span>
    </label>
  );
}

interface RadioRowProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

function RadioRow({ label, checked, onChange }: RadioRowProps) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
        color: "var(--dawn-70, rgba(236,227,214,0.7))",
        cursor: "pointer",
      }}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        style={{ accentColor: "var(--gold, #caa554)" }}
      />
      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em" }}>
        {label}
      </span>
    </label>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 14,
        marginBottom: 6,
        fontSize: 9,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: "var(--gold-70, rgba(202,165,84,0.7))",
        borderTop: "1px dashed rgba(202, 165, 84, 0.2)",
        paddingTop: 8,
      }}
    >
      {children}
    </div>
  );
}

// â”€â”€ Static panel styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const panelContainerStyle: React.CSSProperties = {
  position: "fixed",
  top: 24,
  right: 24,
  width: 360,
  maxHeight: "calc(100vh - 48px)",
  overflowY: "auto",
  padding: 20,
  background: "rgba(15, 14, 12, 0.92)",
  border: "1px solid rgba(202, 165, 84, 0.35)",
  color: "var(--dawn, #ece3d6)",
  zIndex: 50,
  fontFamily: "var(--font-pt-mono, ui-monospace), monospace",
  fontSize: 11,
  letterSpacing: "0.04em",
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 4,
  fontSize: 13,
  color: "var(--gold, #caa554)",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

const panelSubtitleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 12,
  fontSize: 10,
  color: "rgba(236, 227, 214, 0.45)",
  lineHeight: 1.5,
};

const panelFooterStyle: React.CSSProperties = {
  marginTop: 18,
  fontSize: 10,
  color: "rgba(236, 227, 214, 0.45)",
  lineHeight: 1.6,
};

const resetButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  marginTop: 4,
  marginBottom: 4,
  background: "transparent",
  border: "1px solid rgba(202, 165, 84, 0.35)",
  color: "var(--gold, #caa554)",
  fontFamily: "var(--font-pt-mono, ui-monospace), monospace",
  fontSize: 10,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const primaryResetButtonStyle: React.CSSProperties = {
  ...resetButtonStyle,
  marginTop: 0,
  marginBottom: 16,
  padding: "8px 10px",
  fontSize: 11,
  background: "rgba(202, 165, 84, 0.12)",
  borderColor: "rgba(202, 165, 84, 0.55)",
  color: "var(--gold, #caa554)",
};

const presetChipStyle: React.CSSProperties = {
  padding: "4px 8px",
  background: "transparent",
  border: "1px solid rgba(202, 165, 84, 0.3)",
  color: "var(--dawn-70, rgba(236,227,214,0.7))",
  fontFamily: "var(--font-pt-mono, ui-monospace), monospace",
  fontSize: 9,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  cursor: "pointer",
};
