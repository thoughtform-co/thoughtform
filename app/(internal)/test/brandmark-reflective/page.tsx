"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { Gem, Pause, RotateCcw, Sparkles } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import {
  Brandmark3D,
  MATCAP_PRESETS,
  ReflectiveEnvironmentRig,
  type Brandmark3DMaterialMode,
} from "@/components/brand/Brandmark3D";
import { CanvasErrorBoundary } from "@/components/hud";
import { BrandmarkGlyph } from "@/components/landing/v7/BrandmarkGlyph";

type PresetName =
  | "tensorGlass"
  | "surveyorBrass"
  | "holographicCeramic"
  | "archiveAmber"
  | "blueprintPrism"
  | "epsilonDither"
  | "celestialLacquer"
  | "vectorRelic"
  | "frostedIvory"
  | "provenanceGlass";

type SignalMode = "none" | "motes" | "scanlines" | "contours" | "orbits" | "dither" | "wireDepth";

const SIGNAL_OPTIONS: Array<{ label: string; value: SignalMode }> = [
  { label: "None", value: "none" },
  { label: "Motes", value: "motes" },
  { label: "Scan", value: "scanlines" },
  { label: "Contours", value: "contours" },
  { label: "Orbits", value: "orbits" },
  { label: "Dither", value: "dither" },
  { label: "Wire", value: "wireDepth" },
];

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

interface SignalSettings {
  mode: SignalMode;
  color: string;
  accentColor: string;
  intensity: number;
  density: number;
  animation: number;
}

interface LabSettings {
  materialMode: Brandmark3DMaterialMode;
  geometry: GeometrySettings;
  physical: PhysicalSettings;
  transmission: TransmissionSettings;
  environment: EnvironmentSettings;
  post: PostSettings;
  motion: MotionSettings;
  signal: SignalSettings;
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

const BASE_SIGNAL: SignalSettings = {
  mode: "motes",
  color: "#caa554",
  accentColor: "#58dac7",
  intensity: 0.42,
  density: 0.36,
  animation: 0.22,
};

const PRESETS: Record<PresetName, PresetDefinition> = {
  tensorGlass: {
    label: "Tensor Glass",
    settings: {
      materialMode: "transmission",
      geometry: { ...BASE_GEOMETRY, depth: 34, bevelThickness: 5.2, bevelSize: 4.1 },
      physical: BASE_PHYSICAL,
      transmission: {
        ...BASE_TRANSMISSION,
        color: "#f1e7d2",
        roughness: 0.08,
        thickness: 0.86,
        attenuationColor: "#caa554",
        attenuationDistance: 1.35,
        iridescence: 0.16,
        chromaticAberration: 0.028,
        anisotropy: 0.32,
        distortion: 0.05,
        distortionScale: 0.22,
        temporalDistortion: 0.018,
      },
      environment: { ...BASE_ENVIRONMENT, intensity: 1.2 },
      post: { ...BASE_POST, bloomIntensity: 0.48, bloomThreshold: 0.48, chromatic: 0.00035 },
      motion: BASE_MOTION,
      signal: { ...BASE_SIGNAL, mode: "motes", intensity: 0.28, density: 0.24 },
      wireframe: false,
      flatCompare: false,
    },
  },
  surveyorBrass: {
    label: "Surveyor Brass",
    settings: {
      materialMode: "physical",
      geometry: { ...BASE_GEOMETRY, depth: 30, bevelThickness: 3.4, bevelSize: 2.6 },
      physical: {
        color: "#c3a15c",
        metalness: 1,
        roughness: 0.2,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        iridescence: 0.02,
        envMapIntensity: 1.75,
      },
      transmission: BASE_TRANSMISSION,
      environment: { ...BASE_ENVIRONMENT, intensity: 1.15 },
      post: {
        ...BASE_POST,
        bloomIntensity: 0.32,
        bloomThreshold: 0.58,
        chromatic: 0.0002,
        noise: 0.026,
      },
      motion: { ...BASE_MOTION, autoRotate: 0.06 },
      signal: {
        ...BASE_SIGNAL,
        mode: "scanlines",
        color: "#caa554",
        accentColor: "#ebe3d6",
        intensity: 0.34,
        density: 0.42,
        animation: 0.14,
      },
      wireframe: false,
      flatCompare: false,
    },
  },
  holographicCeramic: {
    label: "Holographic Ceramic",
    settings: {
      materialMode: "physical",
      geometry: { ...BASE_GEOMETRY, depth: 28, bevelThickness: 4.4, bevelSize: 3.3 },
      physical: {
        color: "#ebe3d6",
        metalness: 0.08,
        roughness: 0.28,
        clearcoat: 0.9,
        clearcoatRoughness: 0.05,
        iridescence: 0.34,
        envMapIntensity: 1.28,
      },
      transmission: BASE_TRANSMISSION,
      environment: { ...BASE_ENVIRONMENT, intensity: 0.96, animated: false },
      post: {
        ...BASE_POST,
        bloomIntensity: 0.28,
        bloomThreshold: 0.62,
        chromatic: 0.00015,
        noise: 0.018,
      },
      motion: { ...BASE_MOTION, autoRotate: 0.035, pointerTilt: 0.14 },
      signal: {
        ...BASE_SIGNAL,
        mode: "motes",
        color: "#ebe3d6",
        accentColor: "#58dac7",
        intensity: 0.16,
        density: 0.16,
        animation: 0.1,
      },
      wireframe: false,
      flatCompare: false,
    },
  },
  archiveAmber: {
    label: "Archive Amber",
    settings: {
      materialMode: "transmission",
      geometry: { ...BASE_GEOMETRY, depth: 36, bevelThickness: 4.8, bevelSize: 3.9 },
      physical: BASE_PHYSICAL,
      transmission: {
        ...BASE_TRANSMISSION,
        color: "#e5b066",
        roughness: 0.14,
        thickness: 0.78,
        attenuationColor: "#c47635",
        attenuationDistance: 1.05,
        clearcoat: 0.82,
        iridescence: 0.1,
        chromaticAberration: 0.025,
        anisotropy: 0.38,
        distortion: 0.06,
        distortionScale: 0.24,
        temporalDistortion: 0.02,
      },
      environment: { ...BASE_ENVIRONMENT, intensity: 1.08 },
      post: {
        ...BASE_POST,
        bloomIntensity: 0.42,
        bloomThreshold: 0.5,
        chromatic: 0.0003,
        noise: 0.045,
      },
      motion: { ...BASE_MOTION, autoRotate: 0.055 },
      signal: {
        ...BASE_SIGNAL,
        mode: "contours",
        color: "#caa554",
        accentColor: "#c86a3a",
        intensity: 0.44,
        density: 0.52,
        animation: 0.18,
      },
      wireframe: false,
      flatCompare: false,
    },
  },
  blueprintPrism: {
    label: "Blueprint Prism",
    settings: {
      materialMode: "transmission",
      geometry: { ...BASE_GEOMETRY, depth: 30, bevelThickness: 3.8, bevelSize: 3.1 },
      physical: BASE_PHYSICAL,
      transmission: {
        ...BASE_TRANSMISSION,
        color: "#dcefff",
        roughness: 0.05,
        thickness: 0.62,
        attenuationColor: "#8fb7cf",
        attenuationDistance: 1.6,
        iridescence: 0.28,
        chromaticAberration: 0.04,
        anisotropy: 0.52,
        distortion: 0.04,
        distortionScale: 0.18,
        temporalDistortion: 0.012,
      },
      environment: { ...BASE_ENVIRONMENT, intensity: 1.1 },
      post: {
        ...BASE_POST,
        bloomIntensity: 0.36,
        bloomThreshold: 0.54,
        chromatic: 0.00045,
        noise: 0.026,
      },
      motion: BASE_MOTION,
      signal: {
        ...BASE_SIGNAL,
        mode: "scanlines",
        color: "#d7ecff",
        accentColor: "#58dac7",
        intensity: 0.38,
        density: 0.66,
        animation: 0.16,
      },
      wireframe: true,
      flatCompare: false,
    },
  },
  epsilonDither: {
    label: "Epsilon Dither",
    settings: {
      materialMode: "physical",
      geometry: { ...BASE_GEOMETRY, depth: 26, bevelThickness: 3.2, bevelSize: 2.7 },
      physical: {
        color: "#5a4528",
        metalness: 0.82,
        roughness: 0.18,
        clearcoat: 0.88,
        clearcoatRoughness: 0.05,
        iridescence: 0.04,
        envMapIntensity: 1.6,
      },
      transmission: BASE_TRANSMISSION,
      environment: { ...BASE_ENVIRONMENT, intensity: 1.18 },
      post: {
        ...BASE_POST,
        bloomIntensity: 0.56,
        bloomThreshold: 0.43,
        chromatic: 0.00055,
        noise: 0.065,
      },
      motion: { ...BASE_MOTION, autoRotate: 0.065 },
      signal: {
        ...BASE_SIGNAL,
        mode: "dither",
        color: "#caa554",
        accentColor: "#c84e2f",
        intensity: 0.58,
        density: 0.7,
        animation: 0.18,
      },
      wireframe: false,
      flatCompare: false,
    },
  },
  celestialLacquer: {
    label: "Celestial Lacquer",
    settings: {
      materialMode: "physical",
      geometry: { ...BASE_GEOMETRY, depth: 32, bevelThickness: 4.1, bevelSize: 3.5 },
      physical: {
        color: "#12100d",
        metalness: 0.36,
        roughness: 0.16,
        clearcoat: 1,
        clearcoatRoughness: 0.025,
        iridescence: 0.02,
        envMapIntensity: 2.2,
      },
      transmission: BASE_TRANSMISSION,
      environment: { ...BASE_ENVIRONMENT, intensity: 1.45 },
      post: {
        ...BASE_POST,
        bloomIntensity: 0.38,
        bloomThreshold: 0.55,
        chromatic: 0.00022,
        noise: 0.034,
      },
      motion: { ...BASE_MOTION, autoRotate: 0.045 },
      signal: {
        ...BASE_SIGNAL,
        mode: "orbits",
        color: "#caa554",
        accentColor: "#ebe3d6",
        intensity: 0.46,
        density: 0.48,
        animation: 0.2,
      },
      wireframe: false,
      flatCompare: false,
    },
  },
  vectorRelic: {
    label: "Vector Relic",
    settings: {
      materialMode: "physical",
      geometry: { ...BASE_GEOMETRY, depth: 38, bevelThickness: 2.8, bevelSize: 2.2 },
      physical: {
        color: "#a98b4a",
        metalness: 0.9,
        roughness: 0.24,
        clearcoat: 0.72,
        clearcoatRoughness: 0.09,
        iridescence: 0.03,
        envMapIntensity: 1.5,
      },
      transmission: BASE_TRANSMISSION,
      environment: { ...BASE_ENVIRONMENT, intensity: 1.05 },
      post: {
        ...BASE_POST,
        bloomIntensity: 0.34,
        bloomThreshold: 0.58,
        chromatic: 0.00018,
        noise: 0.04,
      },
      motion: { ...BASE_MOTION, autoRotate: 0.04, pointerTilt: 0.16 },
      signal: {
        ...BASE_SIGNAL,
        mode: "wireDepth",
        color: "#caa554",
        accentColor: "#5b7a4e",
        intensity: 0.52,
        density: 0.58,
        animation: 0.12,
      },
      wireframe: true,
      flatCompare: false,
    },
  },
  frostedIvory: {
    label: "Frosted Ivory",
    settings: {
      materialMode: "transmission",
      geometry: { ...BASE_GEOMETRY, depth: 34, bevelThickness: 5.4, bevelSize: 4.5 },
      physical: BASE_PHYSICAL,
      transmission: {
        ...BASE_TRANSMISSION,
        color: "#ebe3d6",
        roughness: 0.32,
        thickness: 0.92,
        attenuationColor: "#ebe3d6",
        attenuationDistance: 2.5,
        iridescence: 0.04,
        chromaticAberration: 0.014,
        anisotropy: 0.56,
        distortion: 0.035,
        distortionScale: 0.14,
        temporalDistortion: 0.01,
      },
      environment: { ...BASE_ENVIRONMENT, intensity: 0.9, animated: false },
      post: {
        ...BASE_POST,
        bloomIntensity: 0.24,
        bloomThreshold: 0.66,
        chromatic: 0.00012,
        noise: 0.022,
      },
      motion: { ...BASE_MOTION, autoRotate: 0.03, pointerTilt: 0.12 },
      signal: {
        ...BASE_SIGNAL,
        mode: "motes",
        color: "#ebe3d6",
        accentColor: "#caa554",
        intensity: 0.14,
        density: 0.12,
        animation: 0.08,
      },
      wireframe: false,
      flatCompare: false,
    },
  },
  provenanceGlass: {
    label: "Provenance Glass",
    settings: {
      materialMode: "transmission",
      geometry: { ...BASE_GEOMETRY, depth: 32, bevelThickness: 4.7, bevelSize: 3.7 },
      physical: BASE_PHYSICAL,
      transmission: {
        ...BASE_TRANSMISSION,
        color: "#9fb08a",
        roughness: 0.1,
        thickness: 0.74,
        attenuationColor: "#5b7a4e",
        attenuationDistance: 1.28,
        iridescence: 0.12,
        chromaticAberration: 0.022,
        anisotropy: 0.36,
        distortion: 0.045,
        distortionScale: 0.2,
        temporalDistortion: 0.014,
      },
      environment: { ...BASE_ENVIRONMENT, intensity: 1.05 },
      post: {
        ...BASE_POST,
        bloomIntensity: 0.3,
        bloomThreshold: 0.58,
        chromatic: 0.0002,
        noise: 0.032,
      },
      motion: { ...BASE_MOTION, autoRotate: 0.045 },
      signal: {
        ...BASE_SIGNAL,
        mode: "motes",
        color: "#caa554",
        accentColor: "#5b7a4e",
        intensity: 0.28,
        density: 0.22,
        animation: 0.14,
      },
      wireframe: false,
      flatCompare: false,
    },
  },
};

export default function BrandmarkReflectiveLabPage() {
  const [presetName, setPresetName] = useState<PresetName>("tensorGlass");
  const [settings, setSettings] = useState<LabSettings>(PRESETS.tensorGlass.settings);
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

  const updateSignal = useCallback((patch: Partial<SignalSettings>) => {
    setSettings((current) => ({ ...current, signal: { ...current.signal, ...patch } }));
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
          <ReflectiveSignalLayer settings={settings.signal} reducedMotion={reducedMotion} />
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

        <SectionLabel>Signal</SectionLabel>
        <SegmentedControl
          options={SIGNAL_OPTIONS}
          value={settings.signal.mode}
          onChange={(mode) => updateSignal({ mode: mode as SignalMode })}
        />
        {settings.signal.mode !== "none" ? (
          <>
            <ColorRow
              label="Primary"
              value={settings.signal.color}
              onChange={(color) => updateSignal({ color })}
            />
            <ColorRow
              label="Accent"
              value={settings.signal.accentColor}
              onChange={(accentColor) => updateSignal({ accentColor })}
            />
            <ControlSlider
              label="Intensity"
              value={settings.signal.intensity}
              min={0}
              max={1.2}
              step={0.01}
              onChange={(intensity) => updateSignal({ intensity })}
            />
            <ControlSlider
              label="Density"
              value={settings.signal.density}
              min={0}
              max={1}
              step={0.01}
              onChange={(density) => updateSignal({ density })}
            />
            <ControlSlider
              label="Drift"
              value={settings.signal.animation}
              min={0}
              max={1}
              step={0.01}
              onChange={(animation) => updateSignal({ animation })}
            />
          </>
        ) : null}

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

function ReflectiveSignalLayer({
  settings,
  reducedMotion,
}: {
  settings: SignalSettings;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const buffers = useMemo(
    () => buildSignalGeometry(settings.mode, settings.density),
    [settings.mode, settings.density]
  );

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group || settings.mode === "none") return;
    const t = reducedMotion ? 0 : clock.elapsedTime * settings.animation;
    group.rotation.z = Math.sin(t * 0.22) * 0.024;
    group.rotation.y = Math.sin(t * 0.18) * 0.035;
    group.position.y = Math.sin(t * 0.3) * 0.018;
  });

  if (settings.mode === "none" || settings.intensity <= 0) return null;

  const intensity = clamp(settings.intensity, 0, 1.2);
  const lineOpacity = clamp(intensity * 0.36, 0, 0.5);
  const accentLineOpacity = clamp(intensity * 0.24, 0, 0.36);
  const pointOpacity = clamp(intensity * 0.58, 0, 0.76);
  const accentPointOpacity = clamp(intensity * 0.42, 0, 0.62);

  return (
    <group ref={groupRef} position={[0, 0, -0.26]} renderOrder={1}>
      {buffers.lines ? (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[buffers.lines, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color={settings.color}
            transparent
            opacity={lineOpacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </lineSegments>
      ) : null}
      {buffers.accentLines ? (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[buffers.accentLines, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color={settings.accentColor}
            transparent
            opacity={accentLineOpacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </lineSegments>
      ) : null}
      {buffers.points ? (
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[buffers.points, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color={settings.color}
            size={buffers.pointSize}
            sizeAttenuation
            transparent
            opacity={pointOpacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>
      ) : null}
      {buffers.accentPoints ? (
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[buffers.accentPoints, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color={settings.accentColor}
            size={buffers.pointSize * 0.78}
            sizeAttenuation
            transparent
            opacity={accentPointOpacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>
      ) : null}
    </group>
  );
}

interface SignalGeometryBuffers {
  lines?: Float32Array;
  accentLines?: Float32Array;
  points?: Float32Array;
  accentPoints?: Float32Array;
  pointSize: number;
}

function buildSignalGeometry(mode: SignalMode, density: number): SignalGeometryBuffers {
  const d = clamp(density, 0, 1);
  switch (mode) {
    case "motes":
      return buildMoteSignal(d);
    case "scanlines":
      return buildScanlineSignal(d);
    case "contours":
      return buildContourSignal(d);
    case "orbits":
      return buildOrbitSignal(d);
    case "dither":
      return buildDitherSignal(d);
    case "wireDepth":
      return buildWireDepthSignal(d);
    default:
      return { pointSize: 0.012 };
  }
}

function buildMoteSignal(density: number): SignalGeometryBuffers {
  const primaryCount = Math.round(70 + density * 260);
  const accentCount = Math.round(16 + density * 64);
  return {
    points: makeRadialPoints(primaryCount, 1.24, 0.72, 0.32, 19),
    accentPoints: makeRadialPoints(accentCount, 0.96, 0.54, 0.22, 113),
    pointSize: 0.013 + density * 0.01,
  };
}

function buildDitherSignal(density: number): SignalGeometryBuffers {
  const columns = Math.round(38 + density * 52);
  const rows = Math.round(28 + density * 42);
  const primary: number[] = [];
  const accent: number[] = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const h = hash01(x * 37.1 + y * 71.7);
      const threshold = 0.12 + density * 0.12;
      if (h > threshold) continue;
      const px = -1.02 + (x / Math.max(1, columns - 1)) * 2.04;
      const py = -0.68 + (y / Math.max(1, rows - 1)) * 1.36;
      const edgeBias = Math.abs(px) * 0.12 + Math.abs(py) * 0.08;
      const target = h < threshold * 0.24 ? accent : primary;
      target.push(px + (hash01(h * 41) - 0.5) * 0.012, py, -0.34 - edgeBias);
    }
  }

  return {
    points: new Float32Array(primary),
    accentPoints: new Float32Array(accent),
    pointSize: 0.017 + density * 0.012,
  };
}

function buildScanlineSignal(density: number): SignalGeometryBuffers {
  const rows = Math.round(14 + density * 36);
  const primary: number[] = [];
  const accent: number[] = [];

  for (let i = 0; i < rows; i += 1) {
    const y = -0.74 + (i / Math.max(1, rows - 1)) * 1.48;
    const fragments = 2 + Math.floor(hash01(i * 17.3) * 4);
    for (let f = 0; f < fragments; f += 1) {
      const start = -1.08 + (f / fragments) * 2.16 + hash01(i * 31 + f) * 0.08;
      const span = 0.16 + hash01(i * 47 + f * 2) * (0.36 + density * 0.24);
      const x1 = clamp(start, -1.12, 1.06);
      const x2 = clamp(start + span, -1.08, 1.12);
      const z = -0.42 + (hash01(i * 11 + f) - 0.5) * 0.08;
      (hash01(i * 13 + f * 7) > 0.82 ? accent : primary).push(x1, y, z, x2, y, z);
    }
  }

  return {
    lines: new Float32Array(primary),
    accentLines: new Float32Array(accent),
    pointSize: 0.014,
  };
}

function buildContourSignal(density: number): SignalGeometryBuffers {
  const bands = Math.round(7 + density * 13);
  const steps = 56;
  const primary: number[] = [];
  const accent: number[] = [];

  for (let band = 0; band < bands; band += 1) {
    const baseY = -0.58 + (band / Math.max(1, bands - 1)) * 1.16;
    const target = band % 4 === 1 ? accent : primary;
    for (let step = 0; step < steps; step += 1) {
      const x1 = -0.92 + (step / steps) * 1.84;
      const x2 = -0.92 + ((step + 1) / steps) * 1.84;
      const y1 = contourY(x1, baseY, band, density);
      const y2 = contourY(x2, baseY, band, density);
      const z = -0.44 + band * 0.006;
      target.push(x1, y1, z, x2, y2, z);
    }
  }

  return {
    lines: new Float32Array(primary),
    accentLines: new Float32Array(accent),
    pointSize: 0.014,
  };
}

function buildOrbitSignal(density: number): SignalGeometryBuffers {
  const rings = Math.round(3 + density * 5);
  const steps = 96;
  const primary: number[] = [];
  const accent: number[] = [];

  for (let ring = 0; ring < rings; ring += 1) {
    const rx = 0.72 + ring * 0.085;
    const ry = 0.38 + ring * 0.038;
    const tilt = -0.54 + ring * 0.18;
    const target = ring === 1 || ring === rings - 1 ? accent : primary;
    for (let step = 0; step < steps; step += 1) {
      const a1 = (step / steps) * Math.PI * 2;
      const a2 = ((step + 1) / steps) * Math.PI * 2;
      appendOrbitSegment(target, a1, a2, rx, ry, tilt, ring);
    }
  }

  return {
    lines: new Float32Array(primary),
    accentLines: new Float32Array(accent),
    points: makeRadialPoints(Math.round(24 + density * 90), 1.16, 0.7, 0.25, 271),
    pointSize: 0.012 + density * 0.006,
  };
}

function buildWireDepthSignal(density: number): SignalGeometryBuffers {
  const layers = Math.round(5 + density * 7);
  const primary: number[] = [];
  const accent: number[] = [];
  const layerPoints: Array<Array<[number, number, number]>> = [];

  for (let layer = 0; layer < layers; layer += 1) {
    const scale = 0.56 + layer * 0.07;
    const z = -0.14 - layer * 0.055;
    const skew = (layer - layers / 2) * 0.018;
    const pts: Array<[number, number, number]> = [
      [-scale * 0.78 + skew, -scale * 0.42, z],
      [-scale * 0.24 + skew, -scale * 0.62, z],
      [scale * 0.7 + skew, -scale * 0.36, z],
      [scale * 0.48 + skew, scale * 0.46, z],
      [scale * 0.06 + skew, scale * 0.66, z],
      [-scale * 0.66 + skew, scale * 0.34, z],
    ];
    appendPolyline(layer % 3 === 1 ? accent : primary, pts, true);
    layerPoints.push(pts);
  }

  for (let layer = 0; layer < layerPoints.length - 1; layer += 1) {
    const current = layerPoints[layer];
    const next = layerPoints[layer + 1];
    for (let i = 0; i < current.length; i += 2) {
      appendSegment(layer % 2 === 0 ? accent : primary, current[i], next[i]);
    }
  }

  return {
    lines: new Float32Array(primary),
    accentLines: new Float32Array(accent),
    pointSize: 0.014,
  };
}

function makeRadialPoints(
  count: number,
  radiusX: number,
  radiusY: number,
  zSpread: number,
  seed: number
): Float32Array {
  const points = new Float32Array(count * 3);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const h1 = hash01(seed + i * 19.19);
    const h2 = hash01(seed + i * 43.43);
    const r = Math.sqrt(h1);
    const a = i * goldenAngle + h2 * 0.2;
    points[i * 3] = Math.cos(a) * r * radiusX;
    points[i * 3 + 1] = Math.sin(a) * r * radiusY;
    points[i * 3 + 2] = -0.3 + (hash01(seed + i * 97.97) - 0.5) * zSpread;
  }
  return points;
}

function contourY(x: number, baseY: number, band: number, density: number): number {
  const ridge = Math.exp(-Math.pow(x * 1.5 - 0.2, 2)) * (0.12 + density * 0.08);
  const trough = Math.exp(-Math.pow(x * 2.2 + 0.62, 2)) * (0.04 + density * 0.04);
  return baseY + Math.sin(x * 6.2 + band * 0.72) * 0.025 + ridge - trough;
}

function appendOrbitSegment(
  target: number[],
  a1: number,
  a2: number,
  rx: number,
  ry: number,
  tilt: number,
  ring: number
) {
  const p1 = orbitPoint(a1, rx, ry, tilt, ring);
  const p2 = orbitPoint(a2, rx, ry, tilt, ring);
  appendSegment(target, p1, p2);
}

function orbitPoint(
  a: number,
  rx: number,
  ry: number,
  tilt: number,
  ring: number
): [number, number, number] {
  const x = Math.cos(a) * rx;
  const y = Math.sin(a) * ry * Math.cos(tilt) + Math.sin(a + ring) * 0.035;
  const z = -0.32 + Math.sin(a) * ry * Math.sin(tilt);
  return [x, y, z];
}

function appendPolyline(
  target: number[],
  points: Array<[number, number, number]>,
  closed: boolean
) {
  for (let i = 0; i < points.length - 1; i += 1) appendSegment(target, points[i], points[i + 1]);
  if (closed) appendSegment(target, points[points.length - 1], points[0]);
}

function appendSegment(target: number[], a: [number, number, number], b: [number, number, number]) {
  target.push(a[0], a[1], a[2], b[0], b[1], b[2]);
}

function hash01(value: number): number {
  const x = Math.sin(value * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
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
    signal: { ...settings.signal },
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
