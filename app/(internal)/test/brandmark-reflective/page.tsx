"use client";

/**
 * /test/brandmark-reflective
 *
 * Unified internal brandmark lab. This route intentionally composes the
 * existing solid SVG-extrusion renderer and the corridor particle core rather
 * than introducing a third brandmark renderer.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { ChevronLeft, ChevronRight, Pause, RotateCcw, Save, Sparkles, Upload } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import {
  Brandmark3D,
  MATCAP_PRESETS,
  ReflectiveEnvironmentRig,
  type Brandmark3DDebugMode,
  type Brandmark3DMaterialFamily,
  type Brandmark3DMaterialMode,
  type Brandmark3DPhysicalParams,
  type Brandmark3DSurfaceKind,
  type Brandmark3DSurfaceParams,
  type Brandmark3DTransmissionParams,
} from "@/components/brand/Brandmark3D";
import {
  BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP,
  BrandmarkPhysicsCore,
  type BrandmarkBasis,
  type BrandmarkCoreBlending,
  type BrandmarkCoreGlyph,
  type BrandmarkCoreShape,
} from "@/components/brand/BrandmarkPhysicsCore";
import { CanvasErrorBoundary } from "@/components/hud";
import {
  ServiceCelestialCard,
  ServicesOrbitMap,
  SERVICES,
} from "@/components/landing/home-v2/services";
import { BrandmarkGlyph } from "@/components/landing/v7/BrandmarkGlyph";
import { supabase } from "@/lib/supabase";
import { clamp, clamp01 } from "@/lib/math";

type LabMode = "solid" | "particle";
type SavedLabMode = LabMode | "scene";
type SceneFrame = "object" | "services-rails" | "terminal-plot" | "active-chamber";
type SignalMode = "none" | "motes" | "scan" | "contours" | "orbits" | "dither" | "wire";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const PREVIEW_ROTATION: [number, number, number] = [0.16, -0.42, 0];
const CENTERED_ROTATION: [number, number, number] = [0, 0, 0];
const LOCAL_PRESET_KEY = "thoughtform.brandmarkLab.presets.v1";
const DEFAULT_SCENE_FRAME: SceneFrame = "services-rails";
const DEFAULT_PRESET_ID = "scene-services-rails";

const PALETTE = {
  void: "#050403",
  ink: "#0a0908",
  panel: "#100d0a",
  dawn: "#ebe3d6",
  gold: "#caa554",
  hotGold: "#f0c36a",
  amber: "#d98232",
  umber: "#5b341d",
  red: "#c84e2f",
  redHot: "#ff5b2e",
  ivory: "#f0e8d8",
  lacquer: "#15110d",
};

interface GeometrySettings {
  depth: number;
  bevelThickness: number;
  bevelSize: number;
  bevelSegments: number;
  curveSegments: number;
  includeSlivers: boolean;
}

interface SolidSettings {
  materialMode: Brandmark3DMaterialMode;
  debugMode: Brandmark3DDebugMode;
  geometry: GeometrySettings;
  physical: Brandmark3DPhysicalParams;
  transmission: Brandmark3DTransmissionParams;
  surface: Brandmark3DSurfaceParams & {
    family: Brandmark3DMaterialFamily;
    kind: Brandmark3DSurfaceKind;
  };
  wireframe: boolean;
}

interface ParticleSettings {
  count: number;
  basis: BrandmarkBasis;
  gridSnap: number;
  shape: BrandmarkCoreShape;
  glyph: BrandmarkCoreGlyph;
  blending: BrandmarkCoreBlending;
  color: string;
  accentColor: string;
  pointSize: number;
  opacity: number;
  ignite: number;
  cleanField: number;
  corridorKeep: number;
  cleanFieldKeep: number;
  cleanFieldDotScale: number;
  cleanFieldEdge: number;
  depth: number;
  scatterRadius: number;
  bulge: number;
  thickness: number;
  shapeStroke: number;
  primitiveAspect: number;
  lineJitter: number;
  freezeMotion: boolean;
  seedAtHome: boolean;
  worldScale: number;
  driftAmpX: number;
  driftAmpY: number;
  driftPeriodX: number;
  driftPeriodY: number;
  showSphere: boolean;
}

interface LightingSettings {
  intensity: number;
  animated: boolean;
  cards: boolean;
  accentColor: string;
  secondaryColor: string;
  exposure: number;
  /** Optional equirectangular `.hdr` used as the real environment map. `null` keeps the procedural Lightformer rig. */
  hdri: string | null;
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
}

interface SignalSettings {
  mode: SignalMode;
  primary: string;
  accent: string;
  intensity: number;
  density: number;
  drift: number;
}

interface UnifiedPreset {
  id: string;
  label: string;
  mode: LabMode;
  scene: SceneFrame;
  description: string;
  solid: SolidSettings;
  particle: ParticleSettings;
  lighting: LightingSettings;
  post: PostSettings;
  signal: SignalSettings;
  motion: MotionSettings;
  saved?: boolean;
}

interface SavedSnapshot {
  v: 3;
  lab: "brandmark-unified";
  label: string;
  mode: SavedLabMode;
  scene: SceneFrame;
  solid: SolidSettings;
  particle: ParticleSettings;
  lighting: LightingSettings;
  post: PostSettings;
  signal: SignalSettings;
  motion: MotionSettings;
}

type SolidSettingsPatch = Omit<
  Partial<SolidSettings>,
  "geometry" | "physical" | "transmission" | "surface"
> & {
  geometry?: Partial<GeometrySettings>;
  physical?: Partial<Brandmark3DPhysicalParams>;
  transmission?: Partial<Brandmark3DTransmissionParams>;
  surface?: Partial<SolidSettings["surface"]>;
};

const BASE_GEOMETRY: GeometrySettings = {
  depth: 32,
  bevelThickness: 4.4,
  bevelSize: 3.4,
  bevelSegments: 8,
  curveSegments: 28,
  includeSlivers: false,
};

const BASE_PHYSICAL: Brandmark3DPhysicalParams = {
  color: PALETTE.gold,
  metalness: 0.9,
  roughness: 0.18,
  clearcoat: 0.82,
  clearcoatRoughness: 0.06,
  iridescence: 0.04,
  envMapIntensity: 1.8,
};

const BASE_TRANSMISSION: Brandmark3DTransmissionParams = {
  color: "#f1dfbd",
  roughness: 0.08,
  transmission: 1,
  thickness: 0.72,
  ior: 1.45,
  attenuationColor: PALETTE.amber,
  attenuationDistance: 1.2,
  clearcoat: 0.82,
  clearcoatRoughness: 0.04,
  iridescence: 0.14,
  envMapIntensity: 1.9,
  chromaticAberration: 0.024,
  anisotropy: 0.26,
  distortion: 0.05,
  distortionScale: 0.24,
  temporalDistortion: 0.018,
  samples: 6,
  resolution: 512,
  backside: true,
  backsideThickness: 0.32,
  backsideEnvMapIntensity: 0.9,
  backgroundColor: PALETTE.void,
};

const BASE_SURFACE: SolidSettings["surface"] = {
  family: "archive-amber",
  kind: "amber-contours",
  primary: PALETTE.amber,
  secondary: PALETTE.red,
  strength: 0.92,
  scale: 1.25,
  bump: 0.08,
  inlay: 0.48,
  sideColor: PALETTE.umber,
  sideRoughness: 0.24,
  sideMetalness: 0.5,
  sideEnvMapIntensity: 1.6,
  sideEmissive: PALETTE.red,
  sideEmissiveIntensity: 0.1,
  capEmissive: PALETTE.red,
  capEmissiveIntensity: 0.03,
};

const BASE_SOLID: SolidSettings = {
  materialMode: "physical",
  debugMode: "none",
  geometry: BASE_GEOMETRY,
  physical: BASE_PHYSICAL,
  transmission: BASE_TRANSMISSION,
  surface: BASE_SURFACE,
  wireframe: false,
};

const BASE_PARTICLE: ParticleSettings = {
  count: BRANDMARK_PHYSICS_CORE_COUNT_DESKTOP,
  basis: "dome-fill",
  gridSnap: 1 / 32,
  shape: "dither",
  glyph: "plus",
  blending: "additive",
  color: PALETTE.gold,
  accentColor: PALETTE.hotGold,
  pointSize: 3.2,
  opacity: 0.85,
  ignite: 1,
  cleanField: 0.2,
  corridorKeep: 1,
  cleanFieldKeep: 0.7,
  cleanFieldDotScale: 0.56,
  cleanFieldEdge: 0.42,
  depth: 1,
  scatterRadius: 0.55,
  bulge: 0.18,
  thickness: 0.06,
  shapeStroke: 0.12,
  primitiveAspect: 2.4,
  lineJitter: 0.08,
  freezeMotion: false,
  seedAtHome: true,
  worldScale: 0.76,
  driftAmpX: 0.12,
  driftAmpY: 0.18,
  driftPeriodX: 17,
  driftPeriodY: 23,
  showSphere: false,
};

const SERVICES_PARTICLE: ParticleSettings = {
  ...BASE_PARTICLE,
  count: 5600,
  basis: "dome-fill",
  shape: "dither",
  blending: "additive",
  pointSize: 5.2,
  opacity: 0.96,
  cleanField: 0.72,
  corridorKeep: 0.27,
  cleanFieldKeep: 1,
  cleanFieldDotScale: 0.78,
  cleanFieldEdge: 0.4,
  bulge: 0.18,
  thickness: 0.04,
  freezeMotion: true,
  color: PALETTE.gold,
  accentColor: PALETTE.red,
  worldScale: 0.78,
  showSphere: false,
};

const SERVICES_SECTION_PARTICLE: ParticleSettings = {
  ...SERVICES_PARTICLE,
  basis: "edge-lattice",
  gridSnap: 0.0165,
  shape: "voxel",
  glyph: "plus",
  blending: "additive",
  pointSize: 3.1,
  opacity: 0.78,
  cleanField: 1,
  corridorKeep: 1,
  cleanFieldKeep: 1,
  cleanFieldDotScale: 0.5,
  cleanFieldEdge: 0.46,
  bulge: 0.12,
  thickness: 0.035,
  scatterRadius: 0.42,
  color: PALETTE.gold,
  accentColor: PALETTE.hotGold,
  freezeMotion: true,
  worldScale: 0.55,
  driftAmpX: 0,
  driftAmpY: 0,
  showSphere: false,
};

const BASE_LIGHTING: LightingSettings = {
  intensity: 1.65,
  animated: true,
  cards: true,
  accentColor: PALETTE.red,
  secondaryColor: PALETTE.gold,
  exposure: 1.22,
  hdri: null,
};

const BASE_POST: PostSettings = {
  enabled: true,
  bloomIntensity: 1.05,
  bloomThreshold: 0.32,
  chromatic: 0.00055,
  noise: 0.055,
  vignette: 0.62,
};

const BASE_SIGNAL: SignalSettings = {
  mode: "motes",
  primary: PALETTE.gold,
  accent: PALETTE.red,
  intensity: 0.42,
  density: 0.36,
  drift: 0.22,
};

const BASE_MOTION: MotionSettings = {
  autoRotate: 0.08,
  pointerParallax: false,
};

function solid(overrides: SolidSettingsPatch): SolidSettings {
  return {
    ...BASE_SOLID,
    ...overrides,
    geometry: { ...BASE_SOLID.geometry, ...overrides.geometry },
    physical: { ...BASE_SOLID.physical, ...overrides.physical },
    transmission: { ...BASE_SOLID.transmission, ...overrides.transmission },
    surface: { ...BASE_SOLID.surface, ...overrides.surface },
  };
}

function particle(overrides: Partial<ParticleSettings>): ParticleSettings {
  return { ...BASE_PARTICLE, ...overrides };
}

function lighting(overrides: Partial<LightingSettings>): LightingSettings {
  return { ...BASE_LIGHTING, ...overrides };
}

function post(overrides: Partial<PostSettings>): PostSettings {
  return { ...BASE_POST, ...overrides };
}

function signal(overrides: Partial<SignalSettings>): SignalSettings {
  return { ...BASE_SIGNAL, ...overrides };
}

function preset(config: {
  id: string;
  label: string;
  mode: LabMode;
  scene?: SceneFrame;
  description: string;
  solid?: SolidSettingsPatch;
  particle?: Partial<ParticleSettings>;
  lighting?: Partial<LightingSettings>;
  post?: Partial<PostSettings>;
  signal?: Partial<SignalSettings>;
  motion?: Partial<MotionSettings>;
}): UnifiedPreset {
  return {
    id: config.id,
    label: config.label,
    mode: config.mode,
    scene: config.scene ?? DEFAULT_SCENE_FRAME,
    description: config.description,
    solid: solid(config.solid ?? {}),
    particle: particle(config.particle ?? {}),
    lighting: lighting(config.lighting ?? {}),
    post: post(config.post ?? {}),
    signal: signal(config.signal ?? {}),
    motion: { ...BASE_MOTION, ...config.motion },
  };
}

const BUILT_IN_PRESETS: ReadonlyArray<UnifiedPreset> = [
  preset({
    id: "solid-umber-glass",
    label: "Umber Glass",
    mode: "solid",
    description: "Thick amber transmission glass with red-gold edge refraction.",
    solid: {
      materialMode: "transmission",
      geometry: { depth: 38, bevelThickness: 5.2, bevelSize: 4.2 },
      transmission: {
        color: "#f2c07a",
        roughness: 0.1,
        thickness: 0.92,
        attenuationColor: PALETTE.umber,
        attenuationDistance: 0.92,
        iridescence: 0.11,
        chromaticAberration: 0.026,
        distortion: 0.06,
      },
      surface: {
        family: "archive-amber",
        kind: "amber-contours",
        primary: "#e4a55c",
        secondary: PALETTE.red,
        strength: 1.02,
        scale: 1.12,
        bump: 0.07,
        inlay: 0.5,
        sideColor: PALETTE.red,
        sideEmissive: PALETTE.red,
        sideEmissiveIntensity: 0.16,
        sideRoughness: 0.18,
        sideMetalness: 0.05,
        sideEnvMapIntensity: 2.2,
      },
    },
    lighting: { intensity: 1.9, accentColor: PALETTE.redHot, secondaryColor: PALETTE.hotGold },
    post: { bloomIntensity: 1.28, bloomThreshold: 0.28, noise: 0.05 },
    signal: { mode: "contours", intensity: 0.38, density: 0.46 },
  }),
  preset({
    id: "solid-surveyor-brass",
    label: "Surveyor Brass",
    mode: "solid",
    description: "Brushed brass caps, oxidized umber sides, restrained tactical bands.",
    solid: {
      materialMode: "physical",
      geometry: { depth: 32, bevelThickness: 3.4, bevelSize: 2.6 },
      physical: {
        color: "#d0a34d",
        metalness: 1,
        roughness: 0.3,
        clearcoat: 0.9,
        clearcoatRoughness: 0.14,
        iridescence: 0.01,
        envMapIntensity: 2.1,
      },
      surface: {
        family: "surveyor-brass",
        kind: "brushed-brass",
        primary: "#caa554",
        secondary: PALETTE.ivory,
        strength: 1.08,
        scale: 1.9,
        bump: 0.13,
        inlay: 0.44,
        sideColor: PALETTE.umber,
        sideRoughness: 0.52,
        sideMetalness: 1,
        sideEnvMapIntensity: 1.35,
        sideEmissive: "#000000",
        sideEmissiveIntensity: 0,
      },
    },
    lighting: { intensity: 1.55 },
    post: { bloomIntensity: 0.72, bloomThreshold: 0.46, noise: 0.04 },
    signal: { mode: "scan", intensity: 0.3, density: 0.42 },
  }),
  preset({
    id: "solid-ivory-phosphor",
    label: "Ivory Phosphor",
    mode: "solid",
    description: "Calm ceramic face with warm phosphor rim and low color split.",
    solid: {
      materialMode: "physical",
      geometry: { depth: 30, bevelThickness: 4.4, bevelSize: 3.2 },
      physical: {
        color: PALETTE.ivory,
        metalness: 0.04,
        roughness: 0.34,
        clearcoat: 0.78,
        clearcoatRoughness: 0.08,
        iridescence: 0.2,
        envMapIntensity: 1.24,
      },
      surface: {
        family: "holographic-ceramic",
        kind: "ceramic-speckle",
        primary: PALETTE.ivory,
        secondary: PALETTE.hotGold,
        strength: 0.92,
        scale: 1.18,
        bump: 0.052,
        inlay: 0.24,
        sideColor: PALETTE.hotGold,
        sideRoughness: 0.38,
        sideMetalness: 0.08,
        sideEnvMapIntensity: 1.35,
        sideEmissive: PALETTE.amber,
        sideEmissiveIntensity: 0.06,
      },
    },
    lighting: { intensity: 1.25, animated: false },
    post: { bloomIntensity: 0.5, bloomThreshold: 0.56, noise: 0.025 },
    signal: { mode: "motes", intensity: 0.18, density: 0.18 },
  }),
  preset({
    id: "solid-black-lacquer",
    label: "Black Lacquer",
    mode: "solid",
    description: "Deep lacquer body with gold inlay and hot reflection lines.",
    solid: {
      materialMode: "physical",
      geometry: { depth: 34, bevelThickness: 4.2, bevelSize: 3.4 },
      physical: {
        color: PALETTE.lacquer,
        metalness: 0.42,
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        iridescence: 0.02,
        envMapIntensity: 2.9,
      },
      surface: {
        family: "celestial-lacquer",
        kind: "celestial-lacquer",
        primary: PALETTE.lacquer,
        secondary: PALETTE.gold,
        strength: 1,
        scale: 1.02,
        bump: 0.05,
        inlay: 0.82,
        sideColor: PALETTE.gold,
        sideRoughness: 0.15,
        sideMetalness: 0.85,
        sideEnvMapIntensity: 2.5,
        sideEmissive: PALETTE.gold,
        sideEmissiveIntensity: 0.18,
        capEmissive: PALETTE.gold,
        capEmissiveIntensity: 0.05,
      },
    },
    lighting: { intensity: 2.0, accentColor: PALETTE.red, secondaryColor: PALETTE.hotGold },
    post: { bloomIntensity: 1.18, bloomThreshold: 0.34, noise: 0.045 },
    signal: { mode: "orbits", intensity: 0.44, density: 0.42 },
  }),
  preset({
    id: "solid-epsilon-enamel",
    label: "Epsilon Enamel",
    mode: "solid",
    description: "Dark enamel with red-orange emissive dither embedded in the caps.",
    solid: {
      materialMode: "physical",
      geometry: { depth: 28, bevelThickness: 3.2, bevelSize: 2.7 },
      physical: {
        color: "#3d2718",
        metalness: 0.7,
        roughness: 0.18,
        clearcoat: 0.9,
        clearcoatRoughness: 0.05,
        iridescence: 0.03,
        envMapIntensity: 1.8,
      },
      surface: {
        family: "epsilon-dither",
        kind: "epsilon-dither",
        primary: "#3d2718",
        secondary: PALETTE.redHot,
        strength: 1.12,
        scale: 1.7,
        bump: 0.08,
        inlay: 0.76,
        sideColor: PALETTE.red,
        sideRoughness: 0.25,
        sideMetalness: 0.75,
        sideEnvMapIntensity: 1.7,
        sideEmissive: PALETTE.redHot,
        sideEmissiveIntensity: 0.24,
        capEmissive: PALETTE.red,
        capEmissiveIntensity: 0.08,
      },
    },
    lighting: { intensity: 1.75, accentColor: PALETTE.redHot },
    post: { bloomIntensity: 1.35, bloomThreshold: 0.3, noise: 0.08 },
    signal: { mode: "dither", intensity: 0.66, density: 0.72 },
  }),
  preset({
    id: "solid-vector-relic",
    label: "Vector Relic",
    mode: "solid",
    description: "Aged gold object with etched drafting traces and no green provenance tint.",
    solid: {
      materialMode: "physical",
      geometry: { depth: 40, bevelThickness: 2.8, bevelSize: 2.2 },
      physical: {
        color: "#b58a43",
        metalness: 0.88,
        roughness: 0.36,
        clearcoat: 0.65,
        clearcoatRoughness: 0.1,
        iridescence: 0.02,
        envMapIntensity: 1.85,
      },
      surface: {
        family: "vector-relic",
        kind: "vector-etch",
        primary: "#a9782c",
        secondary: PALETTE.red,
        strength: 1,
        scale: 1.35,
        bump: 0.12,
        inlay: 0.54,
        sideColor: PALETTE.umber,
        sideRoughness: 0.46,
        sideMetalness: 0.9,
        sideEnvMapIntensity: 1.2,
        sideEmissive: PALETTE.red,
        sideEmissiveIntensity: 0.09,
      },
      wireframe: true,
    },
    lighting: { intensity: 1.45 },
    post: { bloomIntensity: 0.82, bloomThreshold: 0.42, noise: 0.06 },
    signal: { mode: "wire", intensity: 0.52, density: 0.58 },
  }),
  preset({
    id: "solid-frosted-dawn",
    label: "Frosted Dawn",
    mode: "solid",
    description: "Matte translucent resin with grainy roughness and a soft gold edge.",
    solid: {
      materialMode: "transmission",
      geometry: { depth: 34, bevelThickness: 5.4, bevelSize: 4.5 },
      transmission: {
        color: PALETTE.ivory,
        roughness: 0.33,
        thickness: 1.0,
        attenuationColor: PALETTE.gold,
        attenuationDistance: 1.55,
        iridescence: 0.04,
        chromaticAberration: 0.012,
        distortion: 0.035,
      },
      surface: {
        family: "frosted-ivory",
        kind: "frosted-grain",
        primary: PALETTE.ivory,
        secondary: PALETTE.gold,
        strength: 1.05,
        scale: 2.0,
        bump: 0.14,
        inlay: 0.22,
        sideColor: PALETTE.gold,
        sideRoughness: 0.45,
        sideMetalness: 0.08,
        sideEnvMapIntensity: 1.2,
        sideEmissive: PALETTE.gold,
        sideEmissiveIntensity: 0.08,
      },
    },
    lighting: { intensity: 1.32, animated: false },
    post: { bloomIntensity: 0.64, bloomThreshold: 0.5, noise: 0.04 },
    signal: { mode: "none", intensity: 0 },
  }),
  preset({
    id: "particle-services-dither",
    label: "Services Dither Core",
    mode: "particle",
    description: "Production-adjacent Services particle mark, converted to red-gold dither.",
    particle: SERVICES_PARTICLE,
    lighting: { intensity: 1.4 },
    post: { bloomIntensity: 1.18, bloomThreshold: 0.28, noise: 0.06 },
    signal: { mode: "scan", intensity: 0.16, density: 0.32 },
  }),
  preset({
    id: "particle-terminal-scan",
    label: "Terminal Scan",
    mode: "particle",
    description: "Horizontal scan primitives with hot amber/red phosphor bloom.",
    particle: {
      ...SERVICES_PARTICLE,
      basis: "svg-outline",
      shape: "scan",
      blending: "additive",
      pointSize: 4.8,
      primitiveAspect: 4.2,
      shapeStroke: 0.07,
      lineJitter: 0.2,
      color: PALETTE.hotGold,
      accentColor: PALETTE.redHot,
      cleanField: 0.4,
      showSphere: false,
    },
    lighting: { intensity: 1.7, accentColor: PALETTE.redHot },
    post: { bloomIntensity: 1.45, bloomThreshold: 0.24, chromatic: 0.001, noise: 0.075 },
    signal: { mode: "scan", primary: PALETTE.redHot, intensity: 0.56, density: 0.72 },
  }),
  preset({
    id: "particle-vector-wire",
    label: "Vector Wire Artifact",
    mode: "particle",
    description: "Contour particles fan into depth like a layered drafting object.",
    particle: {
      ...SERVICES_PARTICLE,
      basis: "model-wire",
      shape: "dash",
      blending: "additive",
      pointSize: 3.8,
      primitiveAspect: 3.4,
      shapeStroke: 0.065,
      lineJitter: 0.1,
      bulge: 0.28,
      thickness: 0,
      color: PALETTE.gold,
      accentColor: PALETTE.red,
      showSphere: true,
    },
    lighting: { intensity: 1.6 },
    post: { bloomIntensity: 1.08, bloomThreshold: 0.34, noise: 0.05 },
    signal: { mode: "wire", intensity: 0.58, density: 0.62 },
  }),
  preset({
    id: "particle-raster-heat",
    label: "Raster Heat Field",
    mode: "particle",
    description: "Filled silhouette on a coarse terminal lattice with hot dither edges.",
    particle: {
      ...SERVICES_PARTICLE,
      basis: "edge-lattice",
      gridSnap: 1 / 24,
      shape: "cell",
      blending: "normal",
      pointSize: 6.2,
      shapeStroke: 0.17,
      color: PALETTE.amber,
      accentColor: PALETTE.redHot,
      showSphere: false,
    },
    lighting: { intensity: 1.5, accentColor: PALETTE.redHot },
    post: { bloomIntensity: 1.25, bloomThreshold: 0.26, noise: 0.085 },
    signal: { mode: "dither", primary: PALETTE.redHot, intensity: 0.5, density: 0.72 },
  }),
  preset({
    id: "particle-hud-glyph",
    label: "HUD Glyph",
    mode: "particle",
    description: "Symbol particles in the canonical silhouette, useful for diagram scenes.",
    particle: {
      ...BASE_PARTICLE,
      basis: "dome-fill",
      shape: "glyph",
      glyph: "plus",
      blending: "additive",
      pointSize: 5.2,
      shapeStroke: 0.075,
      cleanField: 0.7,
      freezeMotion: true,
      color: PALETTE.gold,
      accentColor: PALETTE.ivory,
    },
    lighting: { intensity: 1.25 },
    post: { bloomIntensity: 0.95, bloomThreshold: 0.34, noise: 0.04 },
    signal: { mode: "orbits", intensity: 0.45, density: 0.5 },
  }),
  preset({
    id: "particle-luminous-dust",
    label: "Luminous Gold Dust",
    mode: "particle",
    description: "Soft additive particle halo, kept for comparison with production defaults.",
    particle: {
      ...BASE_PARTICLE,
      basis: "dome-fill",
      shape: "dot",
      blending: "additive",
      pointSize: 2.8,
      opacity: 0.9,
      cleanField: 0,
      freezeMotion: false,
      color: PALETTE.gold,
      accentColor: PALETTE.hotGold,
    },
    post: { bloomIntensity: 0.9, bloomThreshold: 0.36, noise: 0.04 },
    signal: { mode: "motes", intensity: 0.24, density: 0.32 },
  }),
  preset({
    id: "scene-services-rails",
    label: "Services Rails Dither",
    mode: "particle",
    scene: "services-rails",
    description:
      "Exact Services section preview: centered particle sun, orrery, rails, readout card.",
    particle: SERVICES_SECTION_PARTICLE,
    lighting: {
      intensity: 0.85,
      animated: false,
      cards: false,
      accentColor: PALETTE.gold,
      secondaryColor: PALETTE.dawn,
      exposure: 1,
    },
    post: { bloomIntensity: 0.78, bloomThreshold: 0.38, chromatic: 0, noise: 0.03, vignette: 0.36 },
    signal: { mode: "none", intensity: 0, density: 0.18 },
    motion: { autoRotate: 0 },
  }),
  preset({
    id: "scene-services-glass",
    label: "Services Rails Glass",
    mode: "solid",
    scene: "services-rails",
    description: "Same Services frame, but with a solid umber glass brandmark.",
    solid: {
      materialMode: "transmission",
      geometry: { depth: 38, bevelThickness: 5.2, bevelSize: 4.2 },
      transmission: {
        color: "#f2c07a",
        thickness: 0.9,
        attenuationColor: PALETTE.umber,
        attenuationDistance: 0.95,
      },
      surface: {
        family: "archive-amber",
        kind: "amber-contours",
        primary: "#e0a25d",
        secondary: PALETTE.red,
        strength: 1,
        sideColor: PALETTE.red,
        sideEmissive: PALETTE.red,
        sideEmissiveIntensity: 0.18,
      },
    },
    lighting: { intensity: 2.1, accentColor: PALETTE.redHot, secondaryColor: PALETTE.hotGold },
    post: { bloomIntensity: 1.35, bloomThreshold: 0.25, noise: 0.06 },
    signal: { mode: "contours", intensity: 0.38, density: 0.46 },
    motion: { autoRotate: 0.035 },
  }),
  preset({
    id: "scene-terminal-plot",
    label: "Terminal Plot",
    mode: "particle",
    scene: "terminal-plot",
    description: "Red-gold plotter diagram around the mark for fast aesthetic scanning.",
    particle: {
      ...SERVICES_PARTICLE,
      basis: "model-wire",
      shape: "dash",
      pointSize: 3.6,
      primitiveAspect: 3.5,
      color: PALETTE.hotGold,
      accentColor: PALETTE.redHot,
      showSphere: false,
    },
    lighting: { intensity: 1.6, accentColor: PALETTE.redHot },
    post: { bloomIntensity: 1.42, bloomThreshold: 0.25, chromatic: 0.0008, noise: 0.08 },
    signal: { mode: "wire", primary: PALETTE.red, accent: PALETTE.hotGold, intensity: 0.62 },
  }),
  preset({
    id: "scene-active-chamber",
    label: "Active Chamber",
    mode: "solid",
    scene: "active-chamber",
    description: "Cinematic dark chamber lighting without importing the Active Theory asset style.",
    solid: {
      materialMode: "physical",
      geometry: { depth: 36, bevelThickness: 4.4, bevelSize: 3.5 },
      physical: {
        color: PALETTE.lacquer,
        metalness: 0.65,
        roughness: 0.11,
        clearcoat: 1,
        clearcoatRoughness: 0.025,
        envMapIntensity: 3,
      },
      surface: {
        family: "celestial-lacquer",
        kind: "celestial-lacquer",
        primary: PALETTE.lacquer,
        secondary: PALETTE.gold,
        inlay: 0.8,
        sideColor: PALETTE.gold,
        sideEmissive: PALETTE.gold,
        sideEmissiveIntensity: 0.14,
      },
    },
    lighting: { intensity: 2.4, accentColor: PALETTE.red, secondaryColor: PALETTE.hotGold },
    post: { bloomIntensity: 1.55, bloomThreshold: 0.22, chromatic: 0.0007, noise: 0.06 },
    signal: { mode: "motes", intensity: 0.28, density: 0.3 },
    motion: { autoRotate: 0.045 },
  }),
  preset({
    id: "scene-forge-gold",
    label: "Forge Gold",
    mode: "solid",
    scene: "active-chamber",
    description:
      "Blender-developed shiny gold under a real studio HDRI (brown_photostudio_02) — premium reflections instead of the procedural rig.",
    solid: {
      materialMode: "physical",
      geometry: { depth: 36, bevelThickness: 4.4, bevelSize: 3.5 },
      physical: {
        color: PALETTE.gold,
        metalness: 1,
        roughness: 0.16,
        clearcoat: 0.3,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1.6,
      },
      surface: {
        family: "celestial-lacquer",
        kind: "celestial-lacquer",
        primary: PALETTE.gold,
        secondary: PALETTE.hotGold,
        inlay: 0.35,
        sideColor: PALETTE.gold,
        sideEmissive: PALETTE.gold,
        sideEmissiveIntensity: 0.08,
      },
    },
    lighting: {
      intensity: 1.4,
      hdri: "/env/studio.hdr",
      exposure: 1.35,
      accentColor: PALETTE.red,
      secondaryColor: PALETTE.hotGold,
    },
    post: { bloomIntensity: 1.2, bloomThreshold: 0.3, noise: 0.04 },
    signal: { mode: "motes", intensity: 0.2, density: 0.25 },
    motion: { autoRotate: 0.05 },
  }),
];

const MODE_LABELS: Record<LabMode, string> = {
  solid: "Solid",
  particle: "Particle",
};

const SHAPE_OPTIONS: ReadonlyArray<BrandmarkCoreShape> = [
  "dot",
  "dither",
  "voxel",
  "glyph",
  "dash",
  "cell",
  "bracket",
  "scan",
];
const BASIS_OPTIONS: ReadonlyArray<BrandmarkBasis> = [
  "dome-fill",
  "svg-outline",
  "edge-lattice",
  "model-wire",
];
const SURFACE_OPTIONS: ReadonlyArray<Brandmark3DSurfaceKind> = [
  "none",
  "tensor-bands",
  "brushed-brass",
  "ceramic-speckle",
  "amber-contours",
  "blueprint-slices",
  "epsilon-dither",
  "celestial-lacquer",
  "vector-etch",
  "frosted-grain",
  "provenance-grain",
];
const SIGNAL_OPTIONS: ReadonlyArray<SignalMode> = [
  "none",
  "motes",
  "scan",
  "contours",
  "orbits",
  "dither",
  "wire",
];

const SERVICES_PREVIEW_STARS = (() => {
  const random = seededRandom("services-section-preview-stars");
  return Array.from({ length: 72 }, (_, i) => ({
    id: i,
    left: `${3 + random() * 94}%`,
    top: `${2 + random() * 92}%`,
    size: `${0.8 + random() * 2.2}px`,
    opacity: 0.12 + random() * 0.46,
  }));
})();

export default function BrandmarkUnifiedLabPage() {
  const reducedMotion = usePrefersReducedMotion();
  const [savedPresets, setSavedPresets] = useState<UnifiedPreset[]>(() => readLocalPresets());
  const presets = useMemo(() => [...BUILT_IN_PRESETS, ...savedPresets], [savedPresets]);
  const defaultPreset =
    presets.find((presetItem) => presetItem.id === DEFAULT_PRESET_ID) ?? BUILT_IN_PRESETS[0];
  const [activePresetId, setActivePresetId] = useState(DEFAULT_PRESET_ID);
  const activePreset = presets.find((p) => p.id === activePresetId) ?? defaultPreset;
  const [mode, setMode] = useState<LabMode>(activePreset.mode);
  const [sceneFrame, setSceneFrame] = useState<SceneFrame>(activePreset.scene);
  const [solidSettings, setSolidSettings] = useState<SolidSettings>(() =>
    cloneSolid(activePreset.solid)
  );
  const [particleSettings, setParticleSettings] = useState<ParticleSettings>(() =>
    cloneParticle(activePreset.particle)
  );
  const [lightingSettings, setLightingSettings] = useState<LightingSettings>(() => ({
    ...activePreset.lighting,
  }));
  const [postSettings, setPostSettings] = useState<PostSettings>(() => ({ ...activePreset.post }));
  const [signalSettings, setSignalSettings] = useState<SignalSettings>(() => ({
    ...activePreset.signal,
  }));
  const [motionSettings, setMotionSettings] = useState<MotionSettings>(() => ({
    ...activePreset.motion,
  }));
  const [presentationRotation, setPresentationRotation] =
    useState<[number, number, number]>(PREVIEW_ROTATION);
  const [rotationResetKey, setRotationResetKey] = useState(0);
  const [presetLabel, setPresetLabel] = useState("");
  const [loadSlug, setLoadSlug] = useState("");
  const [presetSlug, setPresetSlug] = useState("");
  const [presetStatus, setPresetStatus] = useState("");
  const [presetBusy, setPresetBusy] = useState(false);

  const applyUnifiedPreset = useCallback(
    (presetId: string, resetRotation = true, applyScene = false) => {
      const next = presets.find((p) => p.id === presetId) ?? defaultPreset;
      setActivePresetId(next.id);
      setMode(next.mode);
      if (applyScene) setSceneFrame(next.scene);
      setSolidSettings(cloneSolid(next.solid));
      setParticleSettings(cloneParticle(next.particle));
      setLightingSettings({ ...next.lighting });
      setPostSettings({ ...next.post });
      setSignalSettings({ ...next.signal });
      setMotionSettings({ ...next.motion });
      if (resetRotation) {
        setPresentationRotation(PREVIEW_ROTATION);
        setRotationResetKey((key) => key + 1);
      }
    },
    [defaultPreset, presets]
  );

  const modePresets = useMemo(
    () => presets.filter((presetItem) => presetItem.mode === mode),
    [mode, presets]
  );

  const selectMode = useCallback(
    (nextMode: LabMode) => {
      setMode(nextMode);
      const first = presets.find((presetItem) => presetItem.mode === nextMode);
      if (first) applyUnifiedPreset(first.id);
    },
    [applyUnifiedPreset, presets]
  );

  const stepPreset = useCallback(
    (direction: -1 | 1) => {
      if (!modePresets.length) return;
      const currentIndex = Math.max(
        0,
        modePresets.findIndex((presetItem) => presetItem.id === activePresetId)
      );
      const nextIndex = (currentIndex + direction + modePresets.length) % modePresets.length;
      applyUnifiedPreset(modePresets[nextIndex].id);
    },
    [activePresetId, applyUnifiedPreset, modePresets]
  );

  const resetCurrentPreset = useCallback(() => {
    applyUnifiedPreset(activePresetId);
  }, [activePresetId, applyUnifiedPreset]);

  const stopRotation = useCallback(() => {
    setPresentationRotation(CENTERED_ROTATION);
    setRotationResetKey((key) => key + 1);
    setMotionSettings((current) => ({ ...current, autoRotate: 0, pointerParallax: false }));
  }, []);

  const updateSolid = useCallback((patch: Partial<SolidSettings>) => {
    setSolidSettings((current) => ({
      ...current,
      ...patch,
      geometry: { ...current.geometry, ...patch.geometry },
      physical: { ...current.physical, ...patch.physical },
      transmission: { ...current.transmission, ...patch.transmission },
      surface: { ...current.surface, ...patch.surface },
    }));
  }, []);

  const updateParticle = useCallback((patch: Partial<ParticleSettings>) => {
    setParticleSettings((current) => ({ ...current, ...patch }));
  }, []);

  const buildSnapshot = useCallback((): SavedSnapshot => {
    const label = presetLabel.trim() || `${activePreset.label} copy`;
    return {
      v: 3,
      lab: "brandmark-unified",
      label,
      mode,
      scene: sceneFrame,
      solid: cloneSolid(solidSettings),
      particle: cloneParticle(particleSettings),
      lighting: { ...lightingSettings },
      post: { ...postSettings },
      signal: { ...signalSettings },
      motion: { ...motionSettings },
    };
  }, [
    activePreset.label,
    lightingSettings,
    mode,
    motionSettings,
    particleSettings,
    postSettings,
    presetLabel,
    sceneFrame,
    signalSettings,
    solidSettings,
  ]);

  const applySnapshot = useCallback((snapshot: unknown, fallbackId = "loaded-preset") => {
    if (!isUnifiedSnapshot(snapshot)) {
      const oldParticle = coerceLegacyParticleSnapshot(snapshot);
      if (!oldParticle) {
        setPresetStatus("Loaded data was not a brandmark lab preset");
        return;
      }
      setMode("particle");
      setSceneFrame(DEFAULT_SCENE_FRAME);
      setParticleSettings(oldParticle);
      setSolidSettings(cloneSolid(BASE_SOLID));
      setLightingSettings({ ...BASE_LIGHTING });
      setPostSettings({ ...BASE_POST });
      setSignalSettings({ ...BASE_SIGNAL, mode: "scan" });
      setMotionSettings({ ...BASE_MOTION });
      setActivePresetId(fallbackId);
      return;
    }

    const snapshotMode = coerceLabMode(snapshot.mode);
    const snapshotScene = coerceSceneFrame(snapshot.scene);
    const savedPreset: UnifiedPreset = {
      id: fallbackId,
      label: snapshot.label || "Loaded preset",
      mode: snapshotMode,
      scene: snapshotScene,
      description: "Saved snapshot loaded from the brandmark preset store.",
      solid: cloneSolid(snapshot.solid),
      particle: cloneParticle(snapshot.particle),
      lighting: { ...snapshot.lighting },
      post: { ...snapshot.post },
      signal: { ...snapshot.signal },
      motion: { ...snapshot.motion },
      saved: true,
    };
    setSavedPresets((current) => upsertPreset(current, savedPreset));
    setMode(savedPreset.mode);
    setSceneFrame(savedPreset.scene);
    setSolidSettings(cloneSolid(savedPreset.solid));
    setParticleSettings(cloneParticle(savedPreset.particle));
    setLightingSettings({ ...savedPreset.lighting });
    setPostSettings({ ...savedPreset.post });
    setSignalSettings({ ...savedPreset.signal });
    setMotionSettings({ ...savedPreset.motion });
    setActivePresetId(savedPreset.id);
    setPresentationRotation(PREVIEW_ROTATION);
    setRotationResetKey((key) => key + 1);
  }, []);

  const savePreset = useCallback(async () => {
    const snapshot = buildSnapshot();
    setPresetBusy(true);
    setPresetStatus("Saving preset...");

    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = makeSlug();
      if (supabase) {
        const { error } = await supabase
          .from("brandmark_presets")
          .insert({ slug, label: snapshot.label, settings: snapshot });
        if (error) {
          if (error.code === "23505") continue;
          setPresetStatus(`Save failed: ${error.message}`);
          setPresetBusy(false);
          return;
        }
      } else {
        writeLocalPreset(slug, snapshot);
      }

      const savedPreset = snapshotToPreset(slug, snapshot);
      setSavedPresets((current) => upsertPreset(current, savedPreset));
      setPresetSlug(slug);
      setLoadSlug(slug);
      setActivePresetId(savedPreset.id);
      setPresetStatus(`Saved preset ${slug}`);
      setPresetBusy(false);
      return;
    }

    setPresetStatus("Save failed: slug collision");
    setPresetBusy(false);
  }, [buildSnapshot]);

  const loadPreset = useCallback(
    async (rawSlug: string) => {
      const slug = rawSlug.trim().toLowerCase();
      if (!slug) {
        setPresetStatus("Enter a preset id");
        return;
      }
      setPresetBusy(true);
      setPresetStatus(`Loading ${slug}...`);

      if (supabase) {
        const { data, error } = await supabase
          .from("brandmark_presets")
          .select("settings,label")
          .eq("slug", slug)
          .maybeSingle();
        if (error) {
          setPresetStatus(`Load failed: ${error.message}`);
          setPresetBusy(false);
          return;
        }
        if (!data) {
          setPresetStatus(`No preset found for ${slug}`);
          setPresetBusy(false);
          return;
        }
        applySnapshot(data.settings, `saved-${slug}`);
        setPresetLabel(typeof data.label === "string" ? data.label : "");
      } else {
        const local = readLocalPreset(slug);
        if (!local) {
          setPresetStatus(`No local preset found for ${slug}`);
          setPresetBusy(false);
          return;
        }
        applySnapshot(local, `saved-${slug}`);
        setPresetLabel(local.label);
      }

      setPresetSlug(slug);
      setLoadSlug(slug);
      setPresetStatus(`Loaded preset ${slug}`);
      setPresetBusy(false);
    },
    [applySnapshot]
  );

  const renderedAsSolid = mode === "solid";
  const isServicesSectionScene = sceneFrame === "services-rails";
  const debugMode = renderedAsSolid ? solidSettings.debugMode : "none";
  const effectsEnabled = postSettings.enabled && !reducedMotion && debugMode === "none";
  const animatedEnvironment = lightingSettings.animated && !reducedMotion;
  const matcap = solidSettings.materialMode === "matcap" ? MATCAP_PRESETS.iridescent : undefined;
  const visibleParticleSettings = useMemo(
    () =>
      activePresetId === "scene-terminal-plot" && particleSettings.showSphere
        ? { ...particleSettings, showSphere: false }
        : particleSettings,
    [activePresetId, particleSettings]
  );

  return (
    <main
      className={`brandmark-lab${isServicesSectionScene ? " brandmark-lab--services-scene" : ""}`}
    >
      <style>{responsiveStyles}</style>
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
          className="brandmark-lab__canvas"
          onCreated={({ gl, scene, camera }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = lightingSettings.exposure;
            if (typeof window !== "undefined") {
              const debug = window as unknown as Record<string, unknown>;
              debug.__BRANDMARK_LAB_SCENE = scene;
              debug.__BRANDMARK_LAB_GL = gl;
              debug.__BRANDMARK_LAB_CAMERA = camera;
            }
          }}
        >
          <color attach="background" args={[isServicesSectionScene ? "#1a1814" : PALETTE.void]} />
          <fog attach="fog" args={[isServicesSectionScene ? "#1a1814" : PALETTE.void, 4.2, 8.2]} />
          <ExposureSync exposure={lightingSettings.exposure} />
          {isServicesSectionScene ? (
            <ServicesSceneLights />
          ) : (
            <ReflectiveEnvironmentRig
              intensity={lightingSettings.intensity}
              animated={animatedEnvironment}
              showReflectionCards={lightingSettings.cards}
              accentColor={lightingSettings.accentColor}
              secondaryColor={lightingSettings.secondaryColor}
              hdri={lightingSettings.hdri}
            />
          )}
          <TurntableRig
            rotation={presentationRotation}
            resetKey={rotationResetKey}
            autoRotate={reducedMotion ? 0 : motionSettings.autoRotate}
            middleMouseDrag
          >
            {renderedAsSolid ? (
              <Brandmark3D
                geometry={solidSettings.geometry}
                materialMode={solidSettings.materialMode}
                matcap={matcap}
                physical={solidSettings.physical}
                transmission={solidSettings.transmission}
                surface={solidSettings.surface}
                debugMode={solidSettings.debugMode}
                wireframe={{
                  enabled: solidSettings.wireframe,
                  style: "edges",
                  color: PALETTE.ivory,
                  opacity: 0.38,
                }}
                autoRotateSpeed={0}
                rotationResetKey={rotationResetKey}
                pointerParallax={false}
                middleMouseDrag={false}
                rotation={[0, 0, 0]}
                scale={isServicesSectionScene ? 0.9 : 1.04}
              />
            ) : (
              <ParticleBrandmark settings={visibleParticleSettings} reducedMotion={reducedMotion} />
            )}
          </TurntableRig>
          {debugMode === "none" && !isServicesSectionScene ? (
            <SignalLayer
              settings={signalSettings}
              reducedMotion={reducedMotion}
              scene={sceneFrame}
            />
          ) : null}
          {!isServicesSectionScene ? <SceneReticle scene={sceneFrame} /> : null}
          <ReflectivePostProcessing settings={postSettings} enabled={effectsEnabled} />
        </Canvas>
      </CanvasErrorBoundary>

      <SceneOverlay scene={sceneFrame} />

      <aside className="brandmark-lab__panel">
        <div className="brandmark-lab__header">
          <div>
            <p className="brandmark-lab__eyebrow">ADR-024 / INTERNAL</p>
            <h1>Brandmark Lab</h1>
          </div>
          <button
            type="button"
            onClick={resetCurrentPreset}
            className="icon-button"
            title="Reset preset"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        <SectionLabel icon={<Sparkles size={12} />}>Mode</SectionLabel>
        <div className="segmented">
          {(["solid", "particle"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => selectMode(value)}
              className={mode === value ? "is-active" : ""}
            >
              {MODE_LABELS[value]}
            </button>
          ))}
        </div>

        <SectionLabel>Preset Browser</SectionLabel>
        <div className="preset-browser">
          <button type="button" onClick={() => stepPreset(-1)} title="Previous preset">
            <ChevronLeft size={14} />
          </button>
          <select
            value={activePresetId}
            onChange={(event) => applyUnifiedPreset(event.target.value)}
            aria-label="Brandmark preset"
          >
            {modePresets.map((presetItem) => (
              <option key={presetItem.id} value={presetItem.id}>
                {presetItem.saved ? "Saved: " : ""}
                {presetItem.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => stepPreset(1)} title="Next preset">
            <ChevronRight size={14} />
          </button>
        </div>
        <p className="preset-description">{activePreset.description}</p>

        <div className="motion-row">
          <button type="button" onClick={stopRotation} className="primary-action">
            <Pause size={12} />
            <span>Stop + center</span>
          </button>
          <ControlSlider
            label="Turntable"
            value={motionSettings.autoRotate}
            min={-0.35}
            max={0.35}
            step={0.005}
            onChange={(autoRotate) => setMotionSettings((current) => ({ ...current, autoRotate }))}
          />
        </div>

        {mode === "solid" ? (
          <details open className="control-group">
            <summary>Solid Material</summary>
            <SegmentedControl
              options={[
                { label: "Matcap", value: "matcap" },
                { label: "Metal", value: "physical" },
                { label: "Glass", value: "transmission" },
              ]}
              value={solidSettings.materialMode}
              onChange={(materialMode) =>
                updateSolid({ materialMode: materialMode as Brandmark3DMaterialMode })
              }
            />
            <SegmentedControl
              options={[
                { label: "Lit", value: "none" },
                { label: "Albedo", value: "albedo" },
                { label: "Rough", value: "roughness" },
                { label: "Normal", value: "normal" },
              ]}
              value={solidSettings.debugMode}
              onChange={(debugMode) =>
                updateSolid({ debugMode: debugMode as Brandmark3DDebugMode })
              }
            />
            {solidSettings.materialMode === "transmission" ? (
              <>
                <ColorRow
                  label="Glass"
                  value={solidSettings.transmission.color ?? PALETTE.ivory}
                  onChange={(color) =>
                    updateSolid({ transmission: { ...solidSettings.transmission, color } })
                  }
                />
                <ColorRow
                  label="Attenuation"
                  value={solidSettings.transmission.attenuationColor ?? PALETTE.amber}
                  onChange={(attenuationColor) =>
                    updateSolid({
                      transmission: { ...solidSettings.transmission, attenuationColor },
                    })
                  }
                />
                <ControlSlider
                  label="Thickness"
                  value={solidSettings.transmission.thickness ?? 0.7}
                  min={0.05}
                  max={1.2}
                  step={0.01}
                  onChange={(thickness) =>
                    updateSolid({ transmission: { ...solidSettings.transmission, thickness } })
                  }
                />
                <ControlSlider
                  label="Roughness"
                  value={solidSettings.transmission.roughness ?? 0.1}
                  min={0}
                  max={0.5}
                  step={0.005}
                  onChange={(roughness) =>
                    updateSolid({ transmission: { ...solidSettings.transmission, roughness } })
                  }
                />
              </>
            ) : (
              <>
                <ColorRow
                  label="Body"
                  value={solidSettings.physical.color ?? PALETTE.gold}
                  onChange={(color) =>
                    updateSolid({ physical: { ...solidSettings.physical, color } })
                  }
                />
                <ControlSlider
                  label="Metal"
                  value={solidSettings.physical.metalness ?? 0}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(metalness) =>
                    updateSolid({ physical: { ...solidSettings.physical, metalness } })
                  }
                />
                <ControlSlider
                  label="Rough"
                  value={solidSettings.physical.roughness ?? 0.2}
                  min={0}
                  max={0.7}
                  step={0.005}
                  onChange={(roughness) =>
                    updateSolid({ physical: { ...solidSettings.physical, roughness } })
                  }
                />
              </>
            )}
            <NativeSelect
              label="Surface"
              value={solidSettings.surface.kind}
              options={SURFACE_OPTIONS}
              onChange={(kind) =>
                updateSolid({
                  surface: { ...solidSettings.surface, kind: kind as Brandmark3DSurfaceKind },
                })
              }
            />
            <ColorRow
              label="Side edge"
              value={solidSettings.surface.sideColor ?? PALETTE.gold}
              onChange={(sideColor) =>
                updateSolid({ surface: { ...solidSettings.surface, sideColor } })
              }
            />
            <ControlSlider
              label="Texture"
              value={solidSettings.surface.strength ?? 0}
              min={0}
              max={1.25}
              step={0.01}
              onChange={(strength) =>
                updateSolid({ surface: { ...solidSettings.surface, strength } })
              }
            />
            <ControlSlider
              label="Depth"
              value={solidSettings.geometry.depth}
              min={8}
              max={60}
              step={1}
              onChange={(depth) => updateSolid({ geometry: { ...solidSettings.geometry, depth } })}
            />
            <Checkbox
              label="Wire edges"
              checked={solidSettings.wireframe}
              onChange={(wireframe) => updateSolid({ wireframe })}
            />
          </details>
        ) : null}

        {mode === "particle" ? (
          <details open className="control-group">
            <summary>Particle Material</summary>
            <NativeSelect
              label="Basis"
              value={particleSettings.basis}
              options={BASIS_OPTIONS}
              onChange={(basis) => updateParticle({ basis: basis as BrandmarkBasis })}
            />
            <NativeSelect
              label="Shape"
              value={particleSettings.shape}
              options={SHAPE_OPTIONS}
              onChange={(shape) => updateParticle({ shape: shape as BrandmarkCoreShape })}
            />
            <SegmentedControl
              options={[
                { label: "Glow", value: "additive" },
                { label: "Flat", value: "normal" },
              ]}
              value={particleSettings.blending}
              onChange={(blending) =>
                updateParticle({ blending: blending as BrandmarkCoreBlending })
              }
            />
            <ColorRow
              label="Body"
              value={particleSettings.color}
              onChange={(color) => updateParticle({ color })}
            />
            <ColorRow
              label="Accent"
              value={particleSettings.accentColor}
              onChange={(accentColor) => updateParticle({ accentColor })}
            />
            <ControlSlider
              label="Point size"
              value={particleSettings.pointSize}
              min={1}
              max={8}
              step={0.1}
              onChange={(pointSize) => updateParticle({ pointSize })}
            />
            <ControlSlider
              label="Clean field"
              value={particleSettings.cleanField}
              min={0}
              max={1}
              step={0.01}
              onChange={(cleanField) => updateParticle({ cleanField })}
            />
            <ControlSlider
              label="Depth"
              value={particleSettings.depth}
              min={0}
              max={1}
              step={0.01}
              onChange={(depth) => updateParticle({ depth })}
            />
            <ControlSlider
              label="Stroke"
              value={particleSettings.shapeStroke}
              min={0.02}
              max={0.26}
              step={0.005}
              onChange={(shapeStroke) => updateParticle({ shapeStroke })}
            />
            <Checkbox
              label="Freeze motion"
              checked={particleSettings.freezeMotion}
              onChange={(freezeMotion) => updateParticle({ freezeMotion })}
            />
          </details>
        ) : null}

        <details className="control-group">
          <summary>Stage + Lighting</summary>
          <NativeSelect
            label="Stage"
            value={sceneFrame}
            options={["services-rails", "terminal-plot", "active-chamber"]}
            onChange={(scene) => setSceneFrame(scene as SceneFrame)}
          />
          <ControlSlider
            label="Light"
            value={lightingSettings.intensity}
            min={0}
            max={3}
            step={0.05}
            onChange={(intensity) => setLightingSettings((current) => ({ ...current, intensity }))}
          />
          <ColorRow
            label="Light accent"
            value={lightingSettings.accentColor}
            onChange={(accentColor) =>
              setLightingSettings((current) => ({ ...current, accentColor }))
            }
          />
          <ControlSlider
            label="Bloom"
            value={postSettings.bloomIntensity}
            min={0}
            max={2}
            step={0.01}
            onChange={(bloomIntensity) =>
              setPostSettings((current) => ({ ...current, bloomIntensity }))
            }
          />
          <ControlSlider
            label="Bloom cut"
            value={postSettings.bloomThreshold}
            min={0}
            max={1}
            step={0.01}
            onChange={(bloomThreshold) =>
              setPostSettings((current) => ({ ...current, bloomThreshold }))
            }
          />
          <NativeSelect
            label="Signal"
            value={signalSettings.mode}
            options={SIGNAL_OPTIONS}
            onChange={(signalMode) =>
              setSignalSettings((current) => ({ ...current, mode: signalMode as SignalMode }))
            }
          />
          <ControlSlider
            label="Signal power"
            value={signalSettings.intensity}
            min={0}
            max={1.2}
            step={0.01}
            onChange={(intensity) => setSignalSettings((current) => ({ ...current, intensity }))}
          />
          <Checkbox
            label="Animated lights"
            checked={lightingSettings.animated}
            onChange={(animated) => setLightingSettings((current) => ({ ...current, animated }))}
          />
        </details>

        <details className="control-group">
          <summary>Save / Load</summary>
          <input
            type="text"
            value={presetLabel}
            onChange={(event) => setPresetLabel(event.target.value)}
            placeholder="Preset label"
            maxLength={120}
            className="text-input"
          />
          <button
            type="button"
            className="primary-action"
            onClick={savePreset}
            disabled={presetBusy}
          >
            <Save size={12} />
            <span>Save preset</span>
          </button>
          {presetSlug ? <p className="preset-id">Saved id: {presetSlug}</p> : null}
          <div className="load-row">
            <input
              type="text"
              value={loadSlug}
              onChange={(event) => setLoadSlug(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (!presetBusy) void loadPreset(loadSlug);
                }
              }}
              placeholder="Paste id..."
              className="text-input"
            />
            <button
              type="button"
              className="icon-button"
              onClick={() => void loadPreset(loadSlug)}
              disabled={presetBusy}
              title="Load preset"
            >
              <Upload size={14} />
            </button>
          </div>
          {presetStatus ? <p className="status-line">{presetStatus}</p> : null}
        </details>

        {reducedMotion ? <p className="status-line">Reduced motion active</p> : null}
      </aside>
    </main>
  );
}

function ExposureSync({ exposure }: { exposure: number }) {
  useFrame(({ gl }) => {
    gl.toneMappingExposure = exposure;
  });
  return null;
}

function TurntableRig({
  rotation,
  resetKey,
  autoRotate,
  middleMouseDrag,
  children,
}: {
  rotation: [number, number, number];
  resetKey: number;
  autoRotate: number;
  middleMouseDrag: boolean;
  children: ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const dragRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    rx: number;
    ry: number;
  } | null>(null);
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.set(rotation[0], rotation[1], rotation[2]);
  }, [resetKey, rotation]);

  useEffect(() => {
    if (!middleMouseDrag) return;
    const canvas = gl.domElement;
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 1) return;
      event.preventDefault();
      const group = groupRef.current;
      if (!group) return;
      dragRef.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        rx: group.rotation.x,
        ry: group.rotation.y,
      };
      canvas.setPointerCapture?.(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      const group = groupRef.current;
      if (!drag || !group || drag.pointerId !== event.pointerId) return;
      event.preventDefault();
      const sensitivity = Math.PI / 420;
      group.rotation.y = drag.ry + (event.clientX - drag.x) * sensitivity;
      group.rotation.x = clamp(drag.rx + (event.clientY - drag.y) * sensitivity, -1.1, 1.1);
    };
    const onPointerUp = (event: PointerEvent) => {
      if (dragRef.current?.pointerId === event.pointerId) {
        dragRef.current = null;
        canvas.releasePointerCapture?.(event.pointerId);
      }
    };
    const onAuxClick = (event: MouseEvent) => {
      if (event.button === 1) event.preventDefault();
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("auxclick", onAuxClick);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("auxclick", onAuxClick);
    };
  }, [gl, middleMouseDrag]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group || !autoRotate || dragRef.current) return;
    group.rotation.y += autoRotate * delta;
  });

  return <group ref={groupRef}>{children}</group>;
}

function ParticleBrandmark({
  settings,
  reducedMotion,
}: {
  settings: ParticleSettings;
  reducedMotion: boolean;
}) {
  return (
    <CenterpieceDriftRig
      scale={settings.worldScale}
      cleanField={settings.cleanField}
      ampX={settings.driftAmpX}
      ampY={settings.driftAmpY}
      periodX={settings.driftPeriodX}
      periodY={settings.driftPeriodY}
      reducedMotion={reducedMotion || settings.freezeMotion}
    >
      {settings.showSphere ? <WireframeSphere radius={0.7} detail={2} /> : null}
      <BrandmarkPhysicsCore
        count={settings.count}
        ignite={settings.ignite}
        pointSize={settings.pointSize}
        color={settings.color}
        accentColor={settings.accentColor}
        opacity={settings.opacity}
        basis={settings.basis}
        gridSnap={settings.gridSnap}
        shape={settings.shape}
        glyph={settings.glyph}
        shapeStroke={settings.shapeStroke}
        primitiveAspect={settings.primitiveAspect}
        lineJitter={settings.lineJitter}
        freezeMotion={settings.freezeMotion}
        seedAtHome={settings.seedAtHome}
        blending={settings.blending}
        cleanField={settings.cleanField}
        corridorKeep={settings.corridorKeep}
        cleanFieldKeep={settings.cleanFieldKeep}
        cleanFieldDotScale={settings.cleanFieldDotScale}
        cleanFieldEdge={settings.cleanFieldEdge}
        depth={settings.depth}
        scatterRadius={settings.scatterRadius}
        bulge={settings.bulge}
        thickness={settings.thickness}
        reducedMotion={reducedMotion}
      />
    </CenterpieceDriftRig>
  );
}

function CenterpieceDriftRig({
  scale,
  cleanField,
  ampX,
  ampY,
  periodX,
  periodY,
  reducedMotion,
  children,
}: {
  scale: number;
  cleanField: number;
  ampX: number;
  ampY: number;
  periodX: number;
  periodY: number;
  reducedMotion: boolean;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    const group = ref.current;
    if (!group || reducedMotion) return;
    const t = state.clock.elapsedTime;
    const k = clamp01(cleanField);
    group.rotation.x = Math.sin((t / Math.max(1, periodX)) * Math.PI * 2) * ampX * k;
    group.rotation.y = Math.sin((t / Math.max(1, periodY)) * Math.PI * 2) * ampY * k;
  });
  return (
    <group ref={ref} scale={scale}>
      {children}
    </group>
  );
}

function WireframeSphere({ radius, detail }: { radius: number; detail: number }) {
  const geometry = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(radius, detail);
    const edges = new THREE.EdgesGeometry(ico);
    ico.dispose();
    return edges;
  }, [detail, radius]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color={PALETTE.gold}
        transparent
        opacity={0.18}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
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
        luminanceSmoothing={0.2}
        mipmapBlur
      />
      {settings.chromatic > 0 ? <ChromaticAberration offset={chromaOffset} /> : <></>}
      {settings.noise > 0 ? <Noise opacity={settings.noise} premultiply /> : <></>}
      <Vignette offset={0.22} darkness={settings.vignette} eskil={false} />
    </EffectComposer>
  );
}

function SignalLayer({
  settings,
  reducedMotion,
  scene,
}: {
  settings: SignalSettings;
  reducedMotion: boolean;
  scene: SceneFrame;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const buffers = useMemo(
    () => buildSignalBuffers(settings.mode, settings.density, scene),
    [scene, settings.density, settings.mode]
  );

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group || reducedMotion || settings.mode === "none") return;
    const t = clock.elapsedTime * settings.drift;
    group.rotation.z = Math.sin(t * 0.22) * 0.024;
    group.rotation.y = Math.sin(t * 0.18) * 0.035;
  });

  if (settings.mode === "none" || settings.intensity <= 0) return null;

  return (
    <group ref={groupRef} position={[0, 0, -0.18]}>
      {buffers.points ? (
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[buffers.points, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color={settings.primary}
            size={0.012}
            transparent
            opacity={0.65 * settings.intensity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>
      ) : null}
      {buffers.lines ? (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[buffers.lines, 3]} />
          </bufferGeometry>
          <lineBasicMaterial
            color={settings.accent}
            transparent
            opacity={0.5 * settings.intensity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </lineSegments>
      ) : null}
    </group>
  );
}

function buildSignalBuffers(
  mode: SignalMode,
  density: number,
  scene: SceneFrame
): { points?: Float32Array; lines?: Float32Array } {
  if (mode === "none") return {};
  const count = Math.max(24, Math.round(240 * clamp01(density)));
  const random = seededRandom(`${mode}-${scene}-${count}`);

  if (mode === "scan") {
    const lines: number[] = [];
    const rows = Math.max(10, Math.round(28 * clamp01(density)));
    for (let i = 0; i < rows; i++) {
      const y = -0.8 + (i / Math.max(1, rows - 1)) * 1.6;
      const width = 0.35 + random() * 1.35;
      const x = (random() - 0.5) * 0.55;
      lines.push(x - width / 2, y, -0.02, x + width / 2, y, -0.02);
    }
    return { lines: new Float32Array(lines) };
  }

  if (mode === "orbits" || mode === "contours" || mode === "wire") {
    const lines: number[] = [];
    const rings = mode === "wire" ? 8 : mode === "contours" ? 6 : 4;
    for (let r = 0; r < rings; r++) {
      const radiusX = 0.68 + r * 0.08;
      const radiusY = 0.48 + r * 0.055;
      const segments = 96;
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        const b = ((i + 1) / segments) * Math.PI * 2;
        const skew = mode === "orbits" ? 0.34 : mode === "wire" ? -0.18 : 0;
        lines.push(
          Math.cos(a) * radiusX,
          Math.sin(a) * radiusY,
          Math.sin(a + r) * skew,
          Math.cos(b) * radiusX,
          Math.sin(b) * radiusY,
          Math.sin(b + r) * skew
        );
      }
    }
    return { lines: new Float32Array(lines) };
  }

  const points: number[] = [];
  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const radius = mode === "dither" ? 0.35 + random() * 0.75 : 0.75 + random() * 0.7;
    points.push(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.72, (random() - 0.5) * 0.5);
  }
  return { points: new Float32Array(points) };
}

function ServicesSceneLights() {
  return (
    <>
      <ambientLight intensity={0.42} color="#d7c18c" />
      <directionalLight position={[0.8, 1.1, 2.5]} intensity={0.9} color="#ffe890" />
      <pointLight position={[-1.2, -0.5, 1.2]} intensity={0.8} color="#caa554" distance={4} />
    </>
  );
}

function SceneReticle({ scene }: { scene: SceneFrame }) {
  const opacity = scene === "object" ? 0.18 : 0.28;
  return (
    <group position={[0, 0, -0.78]}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array([
                -1.45, 0, 0, -0.82, 0, 0, 0.82, 0, 0, 1.45, 0, 0, 0, -1.24, 0, 0, -0.64, 0, 0, 0.64,
                0, 0, 1.24, 0,
              ]),
              3,
            ]}
          />
        </bufferGeometry>
        <lineBasicMaterial color={PALETTE.gold} transparent opacity={opacity} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

function SceneOverlay({ scene }: { scene: SceneFrame }) {
  if (scene === "services-rails") {
    return <ServicesSectionOverlay />;
  }

  return (
    <div className={`scene-overlay scene-overlay--${scene}`} aria-hidden>
      <div className="corner corner--tl" />
      <div className="corner corner--bl" />
      <div className="corner corner--br" />
      {scene !== "object" ? (
        <>
          <div className="scene-rail scene-rail--left" />
          <div className="scene-rail scene-rail--right" />
          <div className="scene-title">
            <span>03</span>
            <strong>Services</strong>
          </div>
          <div className="scene-caption">Navigate / Encode / Build</div>
        </>
      ) : null}
    </div>
  );
}

function ServicesSectionOverlay() {
  const service = SERVICES.find((item) => item.id === "keynote") ?? SERVICES[0];
  if (!service) return null;

  return (
    <div className="services-preview">
      <div className="services-preview__stars">
        {SERVICES_PREVIEW_STARS.map((star) => (
          <span
            key={star.id}
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
      <ServicesHudRail side="left" />
      <ServicesHudRail side="right" />
      <div className="services-preview__top-status">
        <strong>VINCE</strong>
        <span>ACTIVE</span>
        <b>▼</b>
      </div>
      <div className="services-preview__compass">N</div>
      <div className="services-stage services-stage--lab" data-active-step="0">
        <div className="services-stage__items">
          <ServicesOrbitMap />
          <div className="services-cards">
            <ServiceCelestialCard service={service} index={0} />
          </div>
        </div>
      </div>
      <span className="services-preview__scroll-pill" />
    </div>
  );
}

function ServicesHudRail({ side }: { side: "left" | "right" }) {
  return (
    <div className={`services-preview__rail services-preview__rail--${side}`}>
      <span className="services-preview__corner services-preview__corner--top" />
      <span className="services-preview__corner services-preview__corner--bottom" />
      <span className="services-preview__rail-line" />
      <span className="services-preview__tick services-preview__tick--a" />
      <span className="services-preview__tick services-preview__tick--b" />
      <span className="services-preview__tick services-preview__tick--c" />
      <span className="services-preview__tick services-preview__tick--d" />
      <span className="services-preview__tick services-preview__tick--e" />
      {side === "left" ? (
        <>
          <span className="services-preview__rail-index services-preview__rail-index--top">2</span>
          <span className="services-preview__rail-index services-preview__rail-index--bottom">
            5
          </span>
          <span className="services-preview__rail-diamond" />
        </>
      ) : null}
    </div>
  );
}

function CanvasFallback() {
  return (
    <div className="canvas-fallback">
      <BrandmarkGlyph outline={false} decorative />
    </div>
  );
}

function SectionLabel({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="section-label">
      {icon}
      <span>{children}</span>
    </div>
  );
}

function ControlSlider({
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
  onChange: (value: number) => void;
}) {
  return (
    <label className="control">
      <span>
        <span>{label}</span>
        <b>{formatValue(value, step)}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseFloat(event.target.value))}
      />
    </label>
  );
}

function NativeSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<T>;
  onChange: (value: T) => void;
}) {
  return (
    <label className="select-row">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as T)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="color-row">
      <span>{label}</span>
      <b>{value}</b>
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="checkbox-row">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: ReadonlyArray<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="segmented">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "is-active" : ""}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, () => false);
}

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener?.("change", onStoreChange);
  return () => media.removeEventListener?.("change", onStoreChange);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function cloneSolid(value: SolidSettings): SolidSettings {
  return {
    ...value,
    geometry: { ...value.geometry },
    physical: { ...value.physical },
    transmission: { ...value.transmission },
    surface: { ...value.surface },
  };
}

function cloneParticle(value: ParticleSettings): ParticleSettings {
  return { ...BASE_PARTICLE, ...value };
}

function isUnifiedSnapshot(value: unknown): value is SavedSnapshot {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return record.v === 3 && record.lab === "brandmark-unified";
}

function coerceLegacyParticleSnapshot(value: unknown): ParticleSettings | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.shape !== "string" && typeof record.basis !== "string") return null;
  return {
    ...SERVICES_PARTICLE,
    count: numberValue(record.count, SERVICES_PARTICLE.count),
    basis: stringValue(record.basis, SERVICES_PARTICLE.basis) as BrandmarkBasis,
    gridSnap: numberValue(record.gridSnap, SERVICES_PARTICLE.gridSnap),
    shape: stringValue(record.shape, SERVICES_PARTICLE.shape) as BrandmarkCoreShape,
    glyph: stringValue(record.glyph, SERVICES_PARTICLE.glyph) as BrandmarkCoreGlyph,
    blending: stringValue(record.blending, SERVICES_PARTICLE.blending) as BrandmarkCoreBlending,
    color: stringValue(record.color, SERVICES_PARTICLE.color),
    accentColor: stringValue(record.accentColor, SERVICES_PARTICLE.accentColor),
    pointSize: numberValue(record.pointSize, SERVICES_PARTICLE.pointSize),
    opacity: numberValue(record.opacity, SERVICES_PARTICLE.opacity),
    cleanField: numberValue(record.cleanField, SERVICES_PARTICLE.cleanField),
    corridorKeep: numberValue(record.corridorKeep, SERVICES_PARTICLE.corridorKeep),
    cleanFieldKeep: numberValue(record.cleanFieldKeep, SERVICES_PARTICLE.cleanFieldKeep),
    cleanFieldDotScale: numberValue(
      record.cleanFieldDotScale,
      SERVICES_PARTICLE.cleanFieldDotScale
    ),
    cleanFieldEdge: numberValue(record.cleanFieldEdge, SERVICES_PARTICLE.cleanFieldEdge),
    depth: numberValue(record.depth, SERVICES_PARTICLE.depth),
    scatterRadius: numberValue(record.scatterRadius, SERVICES_PARTICLE.scatterRadius),
    bulge: numberValue(record.bulge, SERVICES_PARTICLE.bulge),
    thickness: numberValue(record.thickness, SERVICES_PARTICLE.thickness),
    shapeStroke: numberValue(record.shapeStroke, SERVICES_PARTICLE.shapeStroke),
    primitiveAspect: numberValue(record.primitiveAspect, SERVICES_PARTICLE.primitiveAspect),
    lineJitter: numberValue(record.lineJitter, SERVICES_PARTICLE.lineJitter),
    freezeMotion:
      typeof record.freezeMotion === "boolean"
        ? record.freezeMotion
        : SERVICES_PARTICLE.freezeMotion,
    seedAtHome: true,
  };
}

function snapshotToPreset(slug: string, snapshot: SavedSnapshot): UnifiedPreset {
  return {
    id: `saved-${slug}`,
    label: snapshot.label || slug,
    mode: coerceLabMode(snapshot.mode),
    scene: coerceSceneFrame(snapshot.scene),
    description: "Saved snapshot from this unified brandmark lab.",
    solid: cloneSolid(snapshot.solid),
    particle: cloneParticle(snapshot.particle),
    lighting: { ...snapshot.lighting },
    post: { ...snapshot.post },
    signal: { ...snapshot.signal },
    motion: { ...snapshot.motion },
    saved: true,
  };
}

function readLocalPresets(): UnifiedPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_PRESET_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, SavedSnapshot>) : {};
    return Object.entries(parsed)
      .filter(([, snapshot]) => isUnifiedSnapshot(snapshot))
      .map(([slug, snapshot]) => snapshotToPreset(slug, snapshot));
  } catch {
    return [];
  }
}

function readLocalPreset(slug: string): SavedSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_PRESET_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, SavedSnapshot>) : {};
    const snapshot = parsed[slug];
    return isUnifiedSnapshot(snapshot) ? snapshot : null;
  } catch {
    return null;
  }
}

function writeLocalPreset(slug: string, snapshot: SavedSnapshot): void {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(LOCAL_PRESET_KEY);
  const parsed = raw ? (JSON.parse(raw) as Record<string, SavedSnapshot>) : {};
  parsed[slug] = snapshot;
  window.localStorage.setItem(LOCAL_PRESET_KEY, JSON.stringify(parsed));
}

function upsertPreset(current: UnifiedPreset[], next: UnifiedPreset): UnifiedPreset[] {
  const rest = current.filter((presetItem) => presetItem.id !== next.id);
  return [...rest, next];
}

function makeSlug(): string {
  let slug = "";
  for (let i = 0; i < 6; i++) slug += ((Math.random() * 36) | 0).toString(36);
  return slug;
}

function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// `clamp` and `clamp01` now come from `@/lib/math` (Phase-5 consolidation).

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringValue<T extends string>(value: unknown, fallback: T): string {
  return typeof value === "string" ? value : fallback;
}

function coerceLabMode(value: unknown, fallback: LabMode = "particle"): LabMode {
  if (value === "solid" || value === "particle") return value;
  return fallback;
}

function coerceSceneFrame(value: unknown): SceneFrame {
  if (value === "services-rails" || value === "terminal-plot" || value === "active-chamber") {
    return value;
  }
  return DEFAULT_SCENE_FRAME;
}

function formatValue(value: number, step: number): string {
  if (step >= 1) return value.toFixed(0);
  if (step >= 0.1) return value.toFixed(1);
  if (step >= 0.01) return value.toFixed(2);
  return value.toFixed(3);
}

const responsiveStyles = `
.brandmark-lab {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 46%, rgba(202, 165, 84, 0.1), transparent 34%),
    linear-gradient(180deg, #050403 0%, #080604 100%);
  color: var(--dawn, #ebe3d6);
  font-family: var(--font-pt-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
}
.brandmark-lab__canvas {
  position: absolute !important;
  inset: 0;
  pointer-events: auto;
}
.brandmark-lab--services-scene {
  --void: #1a1814;
  --dawn: #ebe3d6;
  --dawn-70: rgba(235, 227, 214, 0.7);
  --dawn-60: rgba(235, 227, 214, 0.6);
  --dawn-50: rgba(235, 227, 214, 0.5);
  --dawn-40: rgba(235, 227, 214, 0.4);
  --dawn-08: rgba(235, 227, 214, 0.08);
  --gold: #caa554;
  --gold-30: rgba(202, 165, 84, 0.3);
  --m-ease: cubic-bezier(0.33, 0, 0.2, 1);
  background:
    radial-gradient(circle at 50% 52%, rgba(202, 165, 84, 0.07), transparent 32%),
    radial-gradient(circle at 78% 74%, rgba(202, 165, 84, 0.06), transparent 22%),
    #1a1814;
}
.brandmark-lab--services-scene .brandmark-lab__canvas {
  z-index: 2;
}
.brandmark-lab--services-scene .brandmark-lab__panel {
  right: 22px;
  width: min(360px, calc(100vw - 44px));
  background:
    linear-gradient(90deg, rgba(7, 6, 5, 0.9), rgba(16, 13, 9, 0.88)),
    radial-gradient(circle at 0% 26%, rgba(202, 165, 84, 0.08), transparent 42%);
  backdrop-filter: blur(12px);
}
.services-preview {
  position: absolute;
  inset: 0;
  z-index: 6;
  color: var(--dawn);
  pointer-events: none;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 52%, rgba(235, 227, 214, 0.025), transparent 27%),
    radial-gradient(circle at 52% 52%, transparent 0 23%, rgba(202, 165, 84, 0.025) 24%, transparent 44%),
    linear-gradient(180deg, rgba(26, 24, 20, 0.04), rgba(26, 24, 20, 0.18));
}
.services-preview__stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}
.services-preview__stars span {
  position: absolute;
  border-radius: 999px;
  background: rgba(235, 227, 214, 0.9);
  box-shadow: 0 0 10px rgba(235, 227, 214, 0.24);
}
.services-preview__top-status {
  position: absolute;
  top: 28px;
  right: clamp(40px, 4vw, 70px);
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 9px;
  letter-spacing: 0.13em;
  color: rgba(235, 227, 214, 0.84);
}
.services-preview__top-status strong,
.services-preview__top-status span,
.services-preview__top-status b {
  font: inherit;
  font-weight: 700;
}
.services-preview__top-status span {
  color: rgba(184, 211, 136, 0.72);
}
.services-preview__rail {
  position: absolute;
  top: 42px;
  bottom: 42px;
  width: 48px;
  z-index: 8;
  color: rgba(235, 227, 214, 0.82);
  pointer-events: none;
}
.services-preview__rail--left {
  left: clamp(24px, 2.2vw, 46px);
}
.services-preview__rail--right {
  right: clamp(24px, 2.2vw, 46px);
}
.services-preview__rail-line {
  position: absolute;
  top: 64px;
  bottom: 64px;
  width: 1px;
  background: rgba(235, 227, 214, 0.72);
}
.services-preview__rail--left .services-preview__rail-line {
  left: 0;
}
.services-preview__rail--right .services-preview__rail-line {
  right: 0;
}
.services-preview__corner {
  position: absolute;
  width: 38px;
  height: 38px;
}
.services-preview__rail--left .services-preview__corner {
  left: 0;
  border-left: 2px solid rgba(235, 227, 214, 0.78);
}
.services-preview__rail--right .services-preview__corner {
  right: 0;
  border-right: 2px solid rgba(235, 227, 214, 0.78);
}
.services-preview__corner--top {
  top: 0;
  border-top: 2px solid rgba(235, 227, 214, 0.78);
}
.services-preview__corner--bottom {
  bottom: 0;
  border-bottom: 2px solid rgba(235, 227, 214, 0.78);
}
.services-preview__tick {
  position: absolute;
  width: 16px;
  height: 1px;
  background: rgba(235, 227, 214, 0.76);
}
.services-preview__rail--left .services-preview__tick {
  left: 0;
  transform: translateX(-1px);
}
.services-preview__rail--right .services-preview__tick {
  right: 0;
  transform: translateX(1px);
}
.services-preview__tick--a { top: 22%; }
.services-preview__tick--b { top: 36%; }
.services-preview__tick--c { top: 52%; }
.services-preview__tick--d { top: 66%; }
.services-preview__tick--e { top: 82%; }
.services-preview__rail-index {
  position: absolute;
  left: 12px;
  color: rgba(235, 227, 214, 0.7);
  font-size: 10px;
}
.services-preview__rail-index--top {
  top: 35%;
}
.services-preview__rail-index--bottom {
  top: 66%;
}
.services-preview__rail-diamond {
  position: absolute;
  top: 50%;
  left: -5px;
  width: 11px;
  height: 11px;
  transform: translateY(-50%) rotate(45deg);
  background: #fff2a0;
  box-shadow: 0 0 12px rgba(255, 242, 160, 0.42);
}
.services-preview__compass {
  position: absolute;
  left: clamp(17px, 1.6vw, 34px);
  bottom: clamp(14px, 2vh, 24px);
  z-index: 9;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(235, 227, 214, 0.48);
  border-radius: 999px;
  display: grid;
  place-items: center;
  color: #ebe3d6;
  font-size: 14px;
  line-height: 1;
  background: rgba(0, 0, 0, 0.28);
}
.services-preview__compass::after {
  content: "";
  position: absolute;
  right: 6px;
  top: 6px;
  width: 5px;
  height: 5px;
  border-top: 1px solid #ebe3d6;
  border-right: 1px solid #ebe3d6;
}
.services-preview__scroll-pill {
  position: absolute;
  left: 50%;
  bottom: 13px;
  z-index: 9;
  width: 28px;
  height: 5px;
  transform: translateX(-50%);
  border: 1px solid rgba(235, 227, 214, 0.38);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.18);
}
.services-stage--lab {
  position: absolute;
  inset: 0;
  height: 100%;
  display: block;
  background: transparent;
  pointer-events: none;
  z-index: 4;
}
.services-stage--lab .services-stage__items {
  position: relative;
  width: 100%;
  height: 100%;
}
.services-stage--lab .services-orbit-map {
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(520px, 56vw, 920px);
  max-width: 92vw;
  aspect-ratio: 1;
  pointer-events: none;
  z-index: 4;
  transform: translate(-50%, -50%);
}
.services-stage--lab .services-orbit-map__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.services-stage--lab .svc-cartography {
  opacity: 1;
}
.services-stage--lab .svc-orbit__path {
  filter: drop-shadow(0 0 5px rgba(202, 165, 84, 0.18));
}
.services-stage--lab .svc-orbit__path:not(.svc-orbit__path--dotted) {
  stroke-dasharray: 100;
  stroke-dashoffset: 0;
}
.services-stage--lab .svc-orbit__path--dotted {
  opacity: 0.92;
}
.services-stage--lab .svc-orbit__node {
  fill: var(--gold);
  fill-opacity: 0.88;
  filter: drop-shadow(0 0 5px rgba(255, 239, 144, 0.34));
}
.services-stage--lab .services-cards {
  position: absolute;
  inset: 0;
  z-index: 6;
  pointer-events: none;
}
.services-stage--lab .service-celestial-card {
  position: absolute;
  right: clamp(54px, 7vw, 150px);
  bottom: clamp(44px, 7vh, 86px);
  width: clamp(286px, 21vw, 320px);
  box-sizing: border-box;
  padding: clamp(18px, 1.5vw, 24px);
  pointer-events: auto;
  background-color: rgba(10, 9, 8, 0.62);
  background-image: radial-gradient(rgba(202, 165, 84, 0.05) 0.5px, transparent 0.6px);
  background-size: 4px 4px;
  backdrop-filter: blur(9px);
  border: 1px solid var(--dawn-08);
  box-shadow:
    0 0 0 1px rgba(235, 227, 214, 0.04),
    0 0 60px rgba(202, 165, 84, 0.08),
    0 30px 80px rgba(0, 0, 0, 0.55);
  opacity: 1;
  visibility: visible;
  transform: none;
}
.services-stage--lab .service-celestial-card__leader {
  position: absolute;
  right: calc(100% - 6px);
  top: 16px;
  width: 120px;
  height: 64px;
  overflow: visible;
  pointer-events: none;
}
.services-stage--lab .service-celestial-card__leader svg {
  display: block;
  overflow: visible;
}
.services-stage--lab .service-celestial-card__leader-line,
.services-stage--lab .service-celestial-card__leader-pip {
  opacity: 0.82;
}
.services-stage--lab .service-celestial-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: clamp(12px, 1.2vw, 18px);
}
.services-stage--lab .service-celestial-card__index {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--gold);
}
.services-stage--lab .service-celestial-card__dot {
  width: 4px;
  height: 4px;
  background: var(--gold);
  opacity: 0.7;
}
.services-stage--lab .service-celestial-card__kicker {
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dawn-50);
}
.services-stage--lab .service-celestial-card__verb {
  margin: 0;
  font-family: var(--font-pp-neue-montreal, sans-serif);
  font-weight: 400;
  font-size: clamp(24px, 2.2vw, 30px);
  line-height: 1.02;
  color: var(--dawn);
}
.services-stage--lab .service-celestial-card__tagline {
  margin: 6px 0 0;
  font-family: var(--font-pp-neue-montreal, sans-serif);
  font-weight: 300;
  font-size: clamp(14px, 1.1vw, 16px);
  line-height: 1.3;
  color: var(--dawn-70);
}
.services-stage--lab .service-celestial-card__body {
  margin: clamp(12px, 1.2vw, 16px) 0 0;
  font-family: var(--font-pp-neue-montreal, sans-serif);
  font-weight: 300;
  font-size: clamp(12.5px, 0.95vw, 14px);
  line-height: 1.5;
  color: var(--dawn-60);
}
.services-stage--lab .service-celestial-card__meta {
  margin: clamp(14px, 1.4vw, 20px) 0 0;
  padding: clamp(12px, 1.2vw, 16px) 0 0;
  border-top: 1px solid var(--dawn-08);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.services-stage--lab .service-celestial-card__meta-row {
  display: grid;
  grid-template-columns: minmax(78px, auto) 1fr;
  gap: 12px;
  align-items: baseline;
}
.services-stage--lab .service-celestial-card__meta-label {
  font-size: 9.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--dawn-40);
}
.services-stage--lab .service-celestial-card__meta-value {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--dawn-70);
}
.services-stage--lab .service-celestial-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: clamp(16px, 1.6vw, 22px);
}
.services-stage--lab .service-celestial-card__phase {
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--dawn-60);
  padding: 4px 9px;
  border: 1px solid var(--dawn-08);
}
.services-stage--lab .service-celestial-card__cta {
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--gold);
  text-decoration: none;
  white-space: nowrap;
}
.brandmark-lab__panel {
  position: fixed;
  top: 26px;
  right: 26px;
  width: min(390px, calc(100vw - 52px));
  max-height: calc(100vh - 52px);
  overflow: auto;
  z-index: 20;
  padding: 18px;
  border: 1px solid rgba(202, 165, 84, 0.34);
  background: linear-gradient(90deg, rgba(7, 6, 5, 0.93), rgba(15, 12, 9, 0.9));
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
}
.brandmark-lab__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(235, 227, 214, 0.1);
}
.brandmark-lab__header h1 {
  margin: 0;
  color: #ebe3d6;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: uppercase;
}
.brandmark-lab__eyebrow {
  margin: 0 0 6px;
  color: rgba(202, 165, 84, 0.86);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.section-label {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 14px;
  margin-bottom: 8px;
  color: rgba(202, 165, 84, 0.82);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.segmented {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 1px solid rgba(235, 227, 214, 0.13);
  margin-bottom: 10px;
}
.segmented button,
.preset-browser button,
.icon-button,
.primary-action {
  min-height: 34px;
  border: 0;
  border-right: 1px solid rgba(235, 227, 214, 0.13);
  background: transparent;
  color: rgba(235, 227, 214, 0.62);
  cursor: pointer;
  font: inherit;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.segmented button:last-child {
  border-right: 0;
}
.segmented button.is-active,
.preset-browser button:hover,
.icon-button:hover,
.primary-action:hover {
  color: #caa554;
  background: rgba(202, 165, 84, 0.12);
}
.preset-browser {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 38px;
  border: 1px solid rgba(202, 165, 84, 0.28);
}
.preset-browser button {
  border-right: 1px solid rgba(202, 165, 84, 0.22);
}
.preset-browser button:last-child {
  border-right: 0;
  border-left: 1px solid rgba(202, 165, 84, 0.22);
}
.preset-browser select,
.select-row select,
.text-input {
  min-height: 36px;
  width: 100%;
  border: 0;
  background: rgba(0, 0, 0, 0.24);
  color: #ebe3d6;
  color-scheme: dark;
  font: inherit;
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.preset-browser select option,
.select-row select option {
  background: #15110d;
  color: #ebe3d6;
  text-transform: uppercase;
}
.preset-browser select option:checked {
  background: rgba(202, 165, 84, 0.32);
  color: #f4ecd9;
}
.preset-browser select {
  padding: 0 10px;
}
.preset-description,
.status-line,
.preset-id {
  margin: 9px 0 0;
  color: rgba(235, 227, 214, 0.52);
  font-size: 10px;
  line-height: 1.5;
}
.motion-row {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(235, 227, 214, 0.1);
}
.primary-action {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
  border: 1px solid rgba(202, 165, 84, 0.34);
  background: rgba(202, 165, 84, 0.1);
  color: #caa554;
}
.icon-button {
  width: 36px;
  border: 1px solid rgba(202, 165, 84, 0.34);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.control-group {
  margin-top: 12px;
  border-top: 1px solid rgba(235, 227, 214, 0.1);
  padding-top: 10px;
}
.control-group summary {
  cursor: pointer;
  color: rgba(202, 165, 84, 0.86);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.control,
.select-row,
.color-row,
.checkbox-row {
  display: block;
  margin-bottom: 10px;
  color: rgba(235, 227, 214, 0.68);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.control > span,
.select-row,
.color-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}
.color-row {
  grid-template-columns: minmax(0, 1fr) auto 34px;
}
.control b,
.color-row b,
.preset-id {
  color: #caa554;
  font-weight: 400;
}
.control input[type="range"] {
  width: 100%;
  accent-color: #caa554;
}
.select-row select {
  border: 1px solid rgba(235, 227, 214, 0.13);
  min-width: 150px;
  padding: 0 8px;
}
.color-row input {
  width: 32px;
  height: 24px;
  padding: 0;
  border: 1px solid rgba(202, 165, 84, 0.38);
  background: transparent;
}
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.checkbox-row input {
  accent-color: #caa554;
}
.text-input {
  box-sizing: border-box;
  border: 1px solid rgba(235, 227, 214, 0.13);
  padding: 0 10px;
  margin-bottom: 10px;
}
.load-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 38px;
  gap: 8px;
}
.scene-overlay {
  position: absolute;
  inset: 5vmin;
  z-index: 4;
  pointer-events: none;
}
.corner {
  position: absolute;
  width: 44px;
  height: 44px;
}
.corner--tl {
  top: 0;
  left: 0;
  border-top: 1px solid rgba(235, 227, 214, 0.28);
  border-left: 1px solid rgba(235, 227, 214, 0.28);
}
.corner--bl {
  bottom: 0;
  left: 0;
  border-bottom: 1px solid rgba(235, 227, 214, 0.28);
  border-left: 1px solid rgba(235, 227, 214, 0.28);
}
.corner--br {
  bottom: 0;
  right: 0;
  border-bottom: 1px solid rgba(235, 227, 214, 0.28);
  border-right: 1px solid rgba(235, 227, 214, 0.28);
}
.scene-rail {
  position: absolute;
  top: 12%;
  bottom: 12%;
  width: 1px;
  background: linear-gradient(to bottom, transparent, rgba(202, 165, 84, 0.54), transparent);
}
.scene-rail::before,
.scene-rail::after {
  content: "";
  position: absolute;
  left: -8px;
  width: 17px;
  height: 1px;
  background: rgba(235, 227, 214, 0.38);
}
.scene-rail::before {
  top: 22%;
}
.scene-rail::after {
  bottom: 22%;
}
.scene-rail--left {
  left: 3.4vw;
}
.scene-rail--right {
  right: 3.4vw;
}
.scene-title {
  position: absolute;
  top: 7%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  align-items: baseline;
  color: rgba(235, 227, 214, 0.78);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 11px;
}
.scene-title span,
.scene-caption {
  color: rgba(202, 165, 84, 0.84);
}
.scene-caption {
  position: absolute;
  left: 50%;
  bottom: 8%;
  transform: translateX(-50%);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.canvas-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #050403;
  color: #caa554;
}
.canvas-fallback svg {
  width: min(42vw, 360px);
  height: auto;
}
@media (max-width: 820px) {
  .brandmark-lab__panel {
    top: auto;
    right: 12px;
    left: 12px;
    bottom: 12px;
    width: auto;
    max-height: 45vh;
  }
  .brandmark-lab--services-scene .brandmark-lab__panel {
    right: 12px;
    width: auto;
  }
  .scene-overlay {
    inset: 18px;
  }
  .scene-title {
    top: 4%;
  }
}
`;
