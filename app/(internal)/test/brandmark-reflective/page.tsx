"use client";

import { Canvas } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { Gem, Pause, RotateCcw, Sparkles } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import {
  Brandmark3D,
  MATCAP_PRESETS,
  ReflectiveEnvironmentRig,
  type Brandmark3DMaterialMode,
} from "@/components/brand/Brandmark3D";
import { CanvasErrorBoundary } from "@/components/hud";
import { BrandmarkGlyph } from "@/components/landing/v7/BrandmarkGlyph";

type PresetName = "matcap" | "goldGlass" | "mercury" | "oilSlick" | "darkChrome" | "frosted";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

interface GeometrySettings {
  depth: number;
  bevelThickness: number;
  bevelSize: number;
  bevelSegments: number;
  curveSegments: number;
  includeSlivers: boolean;
}

interface PhysicalSettings {
  color: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  iridescence: number;
  envMapIntensity: number;
}

interface TransmissionSettings {
  color: string;
  roughness: number;
  transmission: number;
  thickness: number;
  ior: number;
  attenuationColor: string;
  attenuationDistance: number;
  clearcoat: number;
  clearcoatRoughness: number;
  iridescence: number;
  envMapIntensity: number;
  chromaticAberration: number;
  anisotropy: number;
  distortion: number;
  distortionScale: number;
  temporalDistortion: number;
  samples: number;
  resolution: number;
  backside: boolean;
  backsideThickness: number;
  backsideEnvMapIntensity: number;
  backgroundColor: string;
}

interface EnvironmentSettings {
  intensity: number;
  animated: boolean;
  cards: boolean;
}

interface PostSettings {
  enabled: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
  chromatic: number;
  noise: number;
  vignette: number;
}

interface MotionSettings {
  autoRotate: number;
  pointerParallax: boolean;
  pointerTilt: number;
}

interface LabSettings {
  materialMode: Brandmark3DMaterialMode;
  geometry: GeometrySettings;
  physical: PhysicalSettings;
  transmission: TransmissionSettings;
  environment: EnvironmentSettings;
  post: PostSettings;
  motion: MotionSettings;
  wireframe: boolean;
  flatCompare: boolean;
}

interface PresetDefinition {
  label: string;
  settings: LabSettings;
}

const BASE_GEOMETRY: GeometrySettings = {
  depth: 28,
  bevelThickness: 4,
  bevelSize: 3.2,
  bevelSegments: 8,
  curveSegments: 28,
  includeSlivers: false,
};

const BASE_PHYSICAL: PhysicalSettings = {
  color: "#caa554",
  metalness: 1,
  roughness: 0.12,
  clearcoat: 0.7,
  clearcoatRoughness: 0.04,
  iridescence: 0.08,
  envMapIntensity: 1.5,
};

const BASE_TRANSMISSION: TransmissionSettings = {
  color: "#e7f7ff",
  roughness: 0.06,
  transmission: 1,
  thickness: 0.52,
  ior: 1.45,
  attenuationColor: "#caa554",
  attenuationDistance: 1.55,
  clearcoat: 0.72,
  clearcoatRoughness: 0.035,
  iridescence: 0.22,
  envMapIntensity: 1.65,
  chromaticAberration: 0.045,
  anisotropy: 0.24,
  distortion: 0.08,
  distortionScale: 0.36,
  temporalDistortion: 0.035,
  samples: 6,
  resolution: 512,
  backside: true,
  backsideThickness: 0.3,
  backsideEnvMapIntensity: 0.9,
  backgroundColor: "#050403",
};

const BASE_ENVIRONMENT: EnvironmentSettings = {
  intensity: 1.35,
  animated: true,
  cards: true,
};

const BASE_POST: PostSettings = {
  enabled: true,
  bloomIntensity: 0.62,
  bloomThreshold: 0.42,
  chromatic: 0.0008,
  noise: 0.035,
  vignette: 0.46,
};

const BASE_MOTION: MotionSettings = {
  autoRotate: 0.08,
  pointerParallax: true,
  pointerTilt: 0.2,
};

const PRESETS: Record<PresetName, PresetDefinition> = {
  matcap: {
    label: "Matcap",
    settings: {
      materialMode: "matcap",
      geometry: { ...BASE_GEOMETRY, depth: 22, bevelThickness: 2.5, bevelSize: 2.4 },
      physical: BASE_PHYSICAL,
      transmission: BASE_TRANSMISSION,
      environment: { ...BASE_ENVIRONMENT, intensity: 0.95, animated: false },
      post: { ...BASE_POST, bloomIntensity: 0.34, chromatic: 0 },
      motion: BASE_MOTION,
      wireframe: false,
      flatCompare: false,
    },
  },
  goldGlass: {
    label: "Gold glass",
    settings: {
      materialMode: "transmission",
      geometry: BASE_GEOMETRY,
      physical: BASE_PHYSICAL,
      transmission: BASE_TRANSMISSION,
      environment: BASE_ENVIRONMENT,
      post: BASE_POST,
      motion: BASE_MOTION,
      wireframe: false,
      flatCompare: false,
    },
  },
  mercury: {
    label: "Mercury",
    settings: {
      materialMode: "physical",
      geometry: { ...BASE_GEOMETRY, depth: 24, bevelThickness: 3.2, bevelSize: 2.8 },
      physical: {
        color: "#d9e4df",
        metalness: 1,
        roughness: 0.04,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        iridescence: 0.12,
        envMapIntensity: 2.1,
      },
      transmission: BASE_TRANSMISSION,
      environment: { ...BASE_ENVIRONMENT, intensity: 1.55 },
      post: { ...BASE_POST, bloomIntensity: 0.74, bloomThreshold: 0.36, chromatic: 0.001 },
      motion: BASE_MOTION,
      wireframe: false,
      flatCompare: false,
    },
  },
  oilSlick: {
    label: "Oil slick",
    settings: {
      materialMode: "transmission",
      geometry: { ...BASE_GEOMETRY, depth: 30, bevelThickness: 4.6, bevelSize: 3.8 },
      physical: BASE_PHYSICAL,
      transmission: {
        ...BASE_TRANSMISSION,
        color: "#cfeeff",
        roughness: 0.035,
        thickness: 0.64,
        attenuationColor: "#5b7a4e",
        attenuationDistance: 1.2,
        iridescence: 0.58,
        chromaticAberration: 0.075,
        distortion: 0.12,
        distortionScale: 0.5,
        temporalDistortion: 0.06,
      },
      environment: { ...BASE_ENVIRONMENT, intensity: 1.5 },
      post: { ...BASE_POST, bloomIntensity: 0.82, bloomThreshold: 0.34, chromatic: 0.0012 },
      motion: BASE_MOTION,
      wireframe: false,
      flatCompare: false,
    },
  },
  darkChrome: {
    label: "Dark chrome",
    settings: {
      materialMode: "physical",
      geometry: { ...BASE_GEOMETRY, depth: 26, bevelThickness: 3.6, bevelSize: 2.8 },
      physical: {
        color: "#363a35",
        metalness: 1,
        roughness: 0.09,
        clearcoat: 1,
        clearcoatRoughness: 0.025,
        iridescence: 0.04,
        envMapIntensity: 2.4,
      },
      transmission: BASE_TRANSMISSION,
      environment: { ...BASE_ENVIRONMENT, intensity: 1.85 },
      post: { ...BASE_POST, bloomIntensity: 0.5, bloomThreshold: 0.48, chromatic: 0.00055 },
      motion: BASE_MOTION,
      wireframe: false,
      flatCompare: false,
    },
  },
  frosted: {
    label: "Frosted",
    settings: {
      materialMode: "transmission",
      geometry: { ...BASE_GEOMETRY, depth: 32, bevelThickness: 5, bevelSize: 4.2 },
      physical: BASE_PHYSICAL,
      transmission: {
        ...BASE_TRANSMISSION,
        color: "#ebe3d6",
        roughness: 0.26,
        thickness: 0.72,
        attenuationColor: "#ebe3d6",
        attenuationDistance: 2.2,
        iridescence: 0.05,
        chromaticAberration: 0.018,
        anisotropy: 0.48,
        distortion: 0.05,
        distortionScale: 0.18,
        temporalDistortion: 0.015,
      },
      environment: { ...BASE_ENVIRONMENT, intensity: 1.15, animated: false },
      post: { ...BASE_POST, bloomIntensity: 0.42, bloomThreshold: 0.5, chromatic: 0.00025 },
      motion: { ...BASE_MOTION, autoRotate: 0.04 },
      wireframe: false,
      flatCompare: false,
    },
  },
};

export default function BrandmarkReflectiveLabPage() {
  const [presetName, setPresetName] = useState<PresetName>("goldGlass");
  const [settings, setSettings] = useState<LabSettings>(PRESETS.goldGlass.settings);
  const [rotationResetKey, setRotationResetKey] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  const applyPreset = useCallback((name: PresetName) => {
    setPresetName(name);
    setSettings(cloneSettings(PRESETS[name].settings));
  }, []);

  const resetCurrentPreset = useCallback(() => {
    setSettings(cloneSettings(PRESETS[presetName].settings));
  }, [presetName]);

  const updateGeometry = useCallback((patch: Partial<GeometrySettings>) => {
    setSettings((current) => ({ ...current, geometry: { ...current.geometry, ...patch } }));
  }, []);

  const updatePhysical = useCallback((patch: Partial<PhysicalSettings>) => {
    setSettings((current) => ({ ...current, physical: { ...current.physical, ...patch } }));
  }, []);

  const updateTransmission = useCallback((patch: Partial<TransmissionSettings>) => {
    setSettings((current) => ({
      ...current,
      transmission: { ...current.transmission, ...patch },
    }));
  }, []);

  const updateEnvironment = useCallback((patch: Partial<EnvironmentSettings>) => {
    setSettings((current) => ({
      ...current,
      environment: { ...current.environment, ...patch },
    }));
  }, []);

  const updatePost = useCallback((patch: Partial<PostSettings>) => {
    setSettings((current) => ({ ...current, post: { ...current.post, ...patch } }));
  }, []);

  const updateMotion = useCallback((patch: Partial<MotionSettings>) => {
    setSettings((current) => ({ ...current, motion: { ...current.motion, ...patch } }));
  }, []);

  const stopRotation = useCallback(() => {
    setRotationResetKey((key) => key + 1);
    updateMotion({ autoRotate: 0, pointerParallax: false });
  }, [updateMotion]);

  const setMaterialMode = useCallback((materialMode: Brandmark3DMaterialMode) => {
    setSettings((current) => ({ ...current, materialMode }));
  }, []);

  const matcap = settings.materialMode === "matcap" ? MATCAP_PRESETS.iridescent : undefined;
  const effectsEnabled = settings.post.enabled && !reducedMotion;
  const animatedEnvironment = settings.environment.animated && !reducedMotion;

  return (
    <main style={pageStyle}>
      <CanvasErrorBoundary fallback={<CanvasFallback />}>
        <Canvas
          camera={{ position: [0, 0, 3.15], fov: 34, near: 0.1, far: 100 }}
          dpr={[1, 1.6]}
          gl={{
            alpha: true,
            antialias: true,
            premultipliedAlpha: false,
            powerPreference: "high-performance",
          }}
          style={canvasStyle}
          onCreated={({ gl, scene, camera }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.12;
            if (typeof window !== "undefined") {
              const debug = window as unknown as Record<string, unknown>;
              debug.__BRANDMARK_REFLECTIVE_SCENE = scene;
              debug.__BRANDMARK_REFLECTIVE_GL = gl;
              debug.__BRANDMARK_REFLECTIVE_CAMERA = camera;
            }
          }}
        >
          <color attach="background" args={["#050403"]} />
          <fog attach="fog" args={["#050403", 4.8, 8]} />
          <ReflectiveEnvironmentRig
            intensity={settings.environment.intensity}
            animated={animatedEnvironment}
            showReflectionCards={settings.environment.cards}
          />
          <Brandmark3D
            geometry={settings.geometry}
            materialMode={settings.materialMode}
            matcap={matcap}
            physical={settings.physical}
            transmission={settings.transmission}
            wireframe={{
              enabled: settings.wireframe,
              style: "edges",
              color: "#ebe3d6",
              opacity: 0.42,
            }}
            autoRotateSpeed={reducedMotion ? 0 : settings.motion.autoRotate}
            rotationResetKey={rotationResetKey}
            pointerParallax={settings.motion.pointerParallax && !reducedMotion}
            pointerTiltAmount={settings.motion.pointerTilt}
            middleMouseDrag
            scale={1.04}
          />
          <SceneReticle />
          <ReflectivePostProcessing settings={settings.post} enabled={effectsEnabled} />
        </Canvas>
      </CanvasErrorBoundary>

      <ViewportOverlay />

      {settings.flatCompare ? (
        <div aria-hidden style={flatCompareStyle}>
          <BrandmarkGlyph outline={false} decorative />
          <span style={flatCompareLabelStyle}>Flat SVG</span>
        </div>
      ) : null}

      <aside style={panelStyle}>
        <div style={panelHeaderStyle}>
          <div>
            <p style={eyebrowStyle}>ADR-024 / INTERNAL</p>
            <h1 style={titleStyle}>Reflective Brandmark</h1>
          </div>
          <button
            type="button"
            onClick={resetCurrentPreset}
            style={iconButtonStyle}
            title="Reset preset"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        <SectionLabel icon={<Sparkles size={12} />}>Preset</SectionLabel>
        <div style={presetGridStyle}>
          {(Object.keys(PRESETS) as PresetName[]).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => applyPreset(name)}
              style={{
                ...presetButtonStyle,
                ...(presetName === name ? presetButtonActiveStyle : null),
              }}
            >
              {PRESETS[name].label}
            </button>
          ))}
        </div>

        <SectionLabel icon={<Gem size={12} />}>Material</SectionLabel>
        <SegmentedControl
          options={[
            { label: "Matcap", value: "matcap" },
            { label: "Chrome", value: "physical" },
            { label: "Glass", value: "transmission" },
          ]}
          value={settings.materialMode}
          onChange={(value) => setMaterialMode(value as Brandmark3DMaterialMode)}
        />

        {settings.materialMode === "transmission" ? (
          <>
            <ColorRow
              label="Tint"
              value={settings.transmission.color}
              onChange={(color) => updateTransmission({ color })}
            />
            <ColorRow
              label="Attenuation"
              value={settings.transmission.attenuationColor}
              onChange={(attenuationColor) => updateTransmission({ attenuationColor })}
            />
            <ControlSlider
              label="Roughness"
              value={settings.transmission.roughness}
              min={0}
              max={0.5}
              step={0.005}
              onChange={(roughness) => updateTransmission({ roughness })}
            />
            <ControlSlider
              label="Thickness"
              value={settings.transmission.thickness}
              min={0.05}
              max={1.2}
              step={0.01}
              onChange={(thickness) => updateTransmission({ thickness })}
            />
            <ControlSlider
              label="Iridescence"
              value={settings.transmission.iridescence}
              min={0}
              max={1}
              step={0.01}
              onChange={(iridescence) => updateTransmission({ iridescence })}
            />
            <ControlSlider
              label="Chromatic"
              value={settings.transmission.chromaticAberration}
              min={0}
              max={0.12}
              step={0.001}
              onChange={(chromaticAberration) => updateTransmission({ chromaticAberration })}
            />
            <ControlSlider
              label="Distortion"
              value={settings.transmission.distortion}
              min={0}
              max={0.24}
              step={0.005}
              onChange={(distortion) => updateTransmission({ distortion })}
            />
          </>
        ) : (
          <>
            <ColorRow
              label="Tint"
              value={settings.physical.color}
              onChange={(color) => updatePhysical({ color })}
            />
            <ControlSlider
              label="Metalness"
              value={settings.physical.metalness}
              min={0}
              max={1}
              step={0.01}
              onChange={(metalness) => updatePhysical({ metalness })}
            />
            <ControlSlider
              label="Roughness"
              value={settings.physical.roughness}
              min={0}
              max={0.6}
              step={0.005}
              onChange={(roughness) => updatePhysical({ roughness })}
            />
            <ControlSlider
              label="Clearcoat"
              value={settings.physical.clearcoat}
              min={0}
              max={1}
              step={0.01}
              onChange={(clearcoat) => updatePhysical({ clearcoat })}
            />
            <ControlSlider
              label="Iridescence"
              value={settings.physical.iridescence}
              min={0}
              max={1}
              step={0.01}
              onChange={(iridescence) => updatePhysical({ iridescence })}
            />
          </>
        )}

        <SectionLabel>Geometry</SectionLabel>
        <ControlSlider
          label="Depth"
          value={settings.geometry.depth}
          min={8}
          max={60}
          step={1}
          onChange={(depth) => updateGeometry({ depth })}
        />
        <ControlSlider
          label="Bevel"
          value={settings.geometry.bevelSize}
          min={0}
          max={8}
          step={0.1}
          onChange={(bevelSize) => updateGeometry({ bevelSize })}
        />
        <ControlSlider
          label="Bevel steps"
          value={settings.geometry.bevelSegments}
          min={1}
          max={14}
          step={1}
          onChange={(bevelSegments) => updateGeometry({ bevelSegments })}
        />
        <Checkbox
          label="Hairline ticks"
          checked={settings.geometry.includeSlivers}
          onChange={(includeSlivers) => updateGeometry({ includeSlivers })}
        />

        <SectionLabel>Environment</SectionLabel>
        <ControlSlider
          label="Env intensity"
          value={settings.environment.intensity}
          min={0}
          max={3}
          step={0.05}
          onChange={(intensity) => updateEnvironment({ intensity })}
        />
        <Checkbox
          label="Animated highlights"
          checked={settings.environment.animated}
          onChange={(animated) => updateEnvironment({ animated })}
        />
        <Checkbox
          label="Reflection cards"
          checked={settings.environment.cards}
          onChange={(cards) => updateEnvironment({ cards })}
        />

        <SectionLabel>Post</SectionLabel>
        <Checkbox
          label="Effects"
          checked={settings.post.enabled}
          onChange={(enabled) => updatePost({ enabled })}
        />
        <ControlSlider
          label="Bloom"
          value={settings.post.bloomIntensity}
          min={0}
          max={1.6}
          step={0.01}
          onChange={(bloomIntensity) => updatePost({ bloomIntensity })}
        />
        <ControlSlider
          label="Bloom threshold"
          value={settings.post.bloomThreshold}
          min={0}
          max={1}
          step={0.01}
          onChange={(bloomThreshold) => updatePost({ bloomThreshold })}
        />
        <ControlSlider
          label="RGB offset"
          value={settings.post.chromatic}
          min={0}
          max={0.003}
          step={0.0001}
          onChange={(chromatic) => updatePost({ chromatic })}
        />
        <ControlSlider
          label="Grain"
          value={settings.post.noise}
          min={0}
          max={0.12}
          step={0.005}
          onChange={(noise) => updatePost({ noise })}
        />

        <SectionLabel>Motion</SectionLabel>
        <button
          type="button"
          onClick={stopRotation}
          style={motionActionButtonStyle}
          title="Stop automatic rotation and center the brandmark"
          aria-label="Stop automatic rotation and center the brandmark"
        >
          <Pause size={12} />
          <span>Stop + center</span>
        </button>
        <ControlSlider
          label="Auto rotate"
          value={settings.motion.autoRotate}
          min={-0.4}
          max={0.4}
          step={0.005}
          onChange={(autoRotate) => updateMotion({ autoRotate })}
        />
        <ControlSlider
          label="Pointer tilt"
          value={settings.motion.pointerTilt}
          min={0}
          max={0.45}
          step={0.01}
          onChange={(pointerTilt) => updateMotion({ pointerTilt })}
        />
        <Checkbox
          label="Pointer parallax"
          checked={settings.motion.pointerParallax}
          onChange={(pointerParallax) => updateMotion({ pointerParallax })}
        />
        <Checkbox
          label="Wire edges"
          checked={settings.wireframe}
          onChange={(wireframe) => setSettings((current) => ({ ...current, wireframe }))}
        />
        <Checkbox
          label="Flat compare"
          checked={settings.flatCompare}
          onChange={(flatCompare) => setSettings((current) => ({ ...current, flatCompare }))}
        />

        {reducedMotion ? <p style={statusStyle}>Reduced motion active</p> : null}
      </aside>
    </main>
  );
}

function ReflectivePostProcessing({
  settings,
  enabled,
}: {
  settings: PostSettings;
  enabled: boolean;
}) {
  const chromaOffset = useMemo(
    () => new THREE.Vector2(settings.chromatic, settings.chromatic * 0.58),
    [settings.chromatic]
  );

  if (!enabled) return null;

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={settings.bloomIntensity}
        luminanceThreshold={settings.bloomThreshold}
        luminanceSmoothing={0.24}
        mipmapBlur
      />
      {settings.chromatic > 0 ? <ChromaticAberration offset={chromaOffset} /> : <></>}
      {settings.noise > 0 ? <Noise opacity={settings.noise} premultiply /> : <></>}
      <Vignette offset={0.22} darkness={settings.vignette} eskil={false} />
    </EffectComposer>
  );
}

function SceneReticle() {
  return (
    <group position={[0, 0, -0.72]}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                -1.35, 0, 0, -0.72, 0, 0, 0.72, 0, 0, 1.35, 0, 0, 0, -1.2, 0, 0, -0.62, 0, 0, 0.62,
                0, 0, 1.2, 0,
              ]),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#caa554" transparent opacity={0.24} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

function ViewportOverlay() {
  return (
    <div aria-hidden style={overlayStyle}>
      <div style={overlayCenterLineXStyle} />
      <div style={overlayCenterLineYStyle} />
      <div style={cornerTlStyle} />
      <div style={cornerBlStyle} />
      <div style={cornerBrStyle} />
    </div>
  );
}

function CanvasFallback() {
  return (
    <div style={fallbackStyle}>
      <div style={{ width: 220, height: 220, color: "var(--gold, #caa554)" }}>
        <BrandmarkGlyph outline={false} decorative />
      </div>
    </div>
  );
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
}

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot(): boolean {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia(REDUCED_MOTION_QUERY).matches
    : false;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}

function cloneSettings(settings: LabSettings): LabSettings {
  return {
    ...settings,
    geometry: { ...settings.geometry },
    physical: { ...settings.physical },
    transmission: { ...settings.transmission },
    environment: { ...settings.environment },
    post: { ...settings.post },
    motion: { ...settings.motion },
  };
}

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

function ControlSlider({ label, value, min, max, step, onChange }: ControlSliderProps) {
  return (
    <label style={controlStyle}>
      <span style={controlLabelStyle}>
        <span>{label}</span>
        <span style={controlValueStyle}>{formatValue(value, step)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={rangeStyle}
      />
    </label>
  );
}

interface ColorRowProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorRow({ label, value, onChange }: ColorRowProps) {
  return (
    <label style={colorRowStyle}>
      <span style={colorLabelStyle}>{label}</span>
      <span style={colorValueStyle}>{value}</span>
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={colorInputStyle}
      />
    </label>
  );
}

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function Checkbox({ label, checked, onChange }: CheckboxProps) {
  return (
    <label style={checkboxStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={checkboxInputStyle}
      />
      <span>{label}</span>
    </label>
  );
}

interface SegmentedControlProps {
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}

function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div style={segmentedStyle}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          style={{
            ...segmentButtonStyle,
            ...(value === option.value ? segmentButtonActiveStyle : null),
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SectionLabel({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div style={sectionLabelStyle}>
      {icon}
      <span>{children}</span>
    </div>
  );
}

function formatValue(value: number, step: number): string {
  if (step >= 1) return value.toFixed(0);
  if (step >= 0.01) return value.toFixed(2);
  return value.toFixed(4);
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at 52% 42%, rgba(202,165,84,0.12), transparent 32%), #050403",
  color: "var(--dawn, #ebe3d6)",
  fontFamily: "var(--font-pp-neue-montreal, ui-sans-serif), sans-serif",
  position: "relative",
  overflow: "hidden",
};

const canvasStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "auto",
};

const panelStyle: CSSProperties = {
  position: "fixed",
  top: 18,
  right: 18,
  width: "min(372px, calc(100vw - 36px))",
  maxHeight: "calc(100vh - 36px)",
  overflowY: "auto",
  padding: 18,
  background: "rgba(10, 9, 8, 0.86)",
  border: "1px solid rgba(235, 227, 214, 0.16)",
  boxShadow: "0 24px 70px rgba(0, 0, 0, 0.52)",
  zIndex: 20,
  fontFamily: "var(--font-pt-mono, ui-monospace), monospace",
  fontSize: 11,
};

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 14,
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  marginBottom: 4,
  color: "rgba(202, 165, 84, 0.72)",
  fontSize: 9,
  textTransform: "uppercase",
  letterSpacing: "0.16em",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "var(--dawn, #ebe3d6)",
  fontSize: 15,
  fontWeight: 500,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const iconButtonStyle: CSSProperties = {
  width: 34,
  height: 34,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(202, 165, 84, 0.1)",
  color: "var(--gold, #caa554)",
  border: "1px solid rgba(202, 165, 84, 0.38)",
  cursor: "pointer",
};

const presetGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 6,
  marginBottom: 12,
};

const presetButtonStyle: CSSProperties = {
  minHeight: 34,
  padding: "7px 8px",
  background: "rgba(235, 227, 214, 0.03)",
  color: "rgba(235, 227, 214, 0.72)",
  border: "1px solid rgba(235, 227, 214, 0.12)",
  cursor: "pointer",
  font: "inherit",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

const presetButtonActiveStyle: CSSProperties = {
  color: "var(--gold, #caa554)",
  border: "1px solid rgba(202, 165, 84, 0.55)",
  background: "rgba(202, 165, 84, 0.12)",
};

const sectionLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  marginTop: 14,
  marginBottom: 8,
  paddingTop: 10,
  borderTop: "1px solid rgba(235, 227, 214, 0.1)",
  color: "rgba(202, 165, 84, 0.76)",
  fontSize: 9,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
};

const segmentedStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  border: "1px solid rgba(235, 227, 214, 0.12)",
  marginBottom: 12,
};

const motionActionButtonStyle: CSSProperties = {
  width: "100%",
  minHeight: 36,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  marginBottom: 10,
  background: "rgba(202, 165, 84, 0.1)",
  color: "var(--gold, #caa554)",
  border: "1px solid rgba(202, 165, 84, 0.38)",
  cursor: "pointer",
  font: "inherit",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
};

const segmentButtonStyle: CSSProperties = {
  minHeight: 32,
  background: "transparent",
  color: "rgba(235, 227, 214, 0.62)",
  border: 0,
  borderRight: "1px solid rgba(235, 227, 214, 0.12)",
  cursor: "pointer",
  font: "inherit",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

const segmentButtonActiveStyle: CSSProperties = {
  color: "var(--gold, #caa554)",
  background: "rgba(202, 165, 84, 0.12)",
};

const controlStyle: CSSProperties = {
  display: "block",
  marginBottom: 10,
};

const controlLabelStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 5,
  color: "rgba(235, 227, 214, 0.68)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  fontSize: 10,
};

const controlValueStyle: CSSProperties = {
  color: "var(--gold, #caa554)",
};

const rangeStyle: CSSProperties = {
  width: "100%",
  accentColor: "var(--gold, #caa554)",
};

const colorRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto 34px",
  alignItems: "center",
  gap: 8,
  marginBottom: 10,
};

const colorLabelStyle: CSSProperties = {
  color: "rgba(235, 227, 214, 0.68)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  fontSize: 10,
};

const colorValueStyle: CSSProperties = {
  color: "var(--gold, #caa554)",
  fontSize: 10,
  textTransform: "uppercase",
};

const colorInputStyle: CSSProperties = {
  width: 32,
  height: 24,
  padding: 0,
  background: "transparent",
  border: "1px solid rgba(202,165,84,0.4)",
  cursor: "pointer",
};

const checkboxStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginBottom: 9,
  color: "rgba(235, 227, 214, 0.68)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  fontSize: 10,
  cursor: "pointer",
};

const checkboxInputStyle: CSSProperties = {
  accentColor: "var(--gold, #caa554)",
};

const statusStyle: CSSProperties = {
  margin: "14px 0 0",
  color: "rgba(235, 227, 214, 0.48)",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
};

const overlayStyle: CSSProperties = {
  position: "absolute",
  inset: "5vmin",
  pointerEvents: "none",
  zIndex: 4,
};

const overlayCenterLineXStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "7%",
  bottom: "7%",
  width: 1,
  background: "linear-gradient(to bottom, transparent, rgba(202,165,84,0.18), transparent)",
};

const overlayCenterLineYStyle: CSSProperties = {
  position: "absolute",
  left: "7%",
  right: "7%",
  top: "50%",
  height: 1,
  background: "linear-gradient(to right, transparent, rgba(202,165,84,0.16), transparent)",
};

const cornerBaseStyle: CSSProperties = {
  position: "absolute",
  width: 42,
  height: 42,
};

const cornerTlStyle: CSSProperties = {
  ...cornerBaseStyle,
  top: 0,
  left: 0,
  borderTop: "1px solid rgba(235, 227, 214, 0.28)",
  borderLeft: "1px solid rgba(235, 227, 214, 0.28)",
};

const cornerBlStyle: CSSProperties = {
  ...cornerBaseStyle,
  bottom: 0,
  left: 0,
  borderBottom: "1px solid rgba(235, 227, 214, 0.28)",
  borderLeft: "1px solid rgba(235, 227, 214, 0.28)",
};

const cornerBrStyle: CSSProperties = {
  ...cornerBaseStyle,
  bottom: 0,
  right: 0,
  borderBottom: "1px solid rgba(235, 227, 214, 0.28)",
  borderRight: "1px solid rgba(235, 227, 214, 0.28)",
};

const flatCompareStyle: CSSProperties = {
  position: "fixed",
  left: 22,
  bottom: 22,
  width: 150,
  height: 150,
  padding: 12,
  color: "var(--gold, #caa554)",
  background: "rgba(10, 9, 8, 0.78)",
  border: "1px dashed rgba(202, 165, 84, 0.35)",
  zIndex: 18,
  pointerEvents: "none",
};

const flatCompareLabelStyle: CSSProperties = {
  position: "absolute",
  left: 9,
  top: 7,
  color: "rgba(235, 227, 214, 0.58)",
  fontFamily: "var(--font-pt-mono, ui-monospace), monospace",
  fontSize: 9,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
};

const fallbackStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--void, #0a0908)",
};
