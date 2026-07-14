"use client";

/**
 * Brandmark3D — R3F group that paints the Thoughtform brandmark as a
 * real beveled 3D solid with selectable finishes:
 *
 *   - Material: a procedural matcap (no scene lights — matches the
 *     corridor's unlit aesthetic) OR a PBR physical material that
 *     reflects an environment map (chrome / liquid-metal; pair with
 *     `<RoomEnvironmentRig>`).
 *   - Wireframe overlay: the triangulated mesh (or feature edges)
 *     drawn over the solid for a technical-model read.
 *   - Half/half cutaway: a clipping plane shows the solid on one side
 *     and the wireframe on the other.
 *
 * Lifecycle:
 *   - Geometry is built async from the SVG via `buildBrandmarkGeometry`,
 *     disposed on swap + unmount.
 *   - Matcap texture / wireframe geometry / materials are memoised and
 *     disposed when they change.
 *   - Motion: slow Y auto-rotation, pointer parallax, and middle-mouse
 *     drag — all applied to the GROUP so the solid + wireframe move
 *     together. Skipped under `prefers-reduced-motion`.
 *
 * The component is shaped so the production move (drop into
 * `DepthGatewayScene`/`BrandmarkAccretionShell`, anchored at
 * `BRANDMARK_ANCHOR_INTELLIGENCE`) is a clean port.
 */

import { MeshTransmissionMaterial } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { clamp } from "@/lib/math";
import {
  buildBrandmarkGeometry,
  DEFAULT_BRANDMARK_SVG_URL,
  type BuildBrandmarkGeometryOptions,
} from "./buildBrandmarkGeometry";
import {
  DEFAULT_GOLD_MATCAP_STOPS,
  makeMatcapTexture,
  type GoldMatcapStops,
  type MatcapStyle,
} from "./makeGoldMatcap";

export type Brandmark3DMaterialMode = "matcap" | "physical" | "transmission";

export type Brandmark3DMaterialFamily =
  | "default"
  | "tensor-glass"
  | "surveyor-brass"
  | "holographic-ceramic"
  | "archive-amber"
  | "blueprint-prism"
  | "epsilon-dither"
  | "celestial-lacquer"
  | "vector-relic"
  | "frosted-ivory"
  | "provenance-glass";

export type Brandmark3DDebugMode = "none" | "uv" | "albedo" | "roughness" | "normal";

export type Brandmark3DSurfaceKind =
  | "none"
  | "tensor-bands"
  | "brushed-brass"
  | "ceramic-speckle"
  | "amber-contours"
  | "blueprint-slices"
  | "epsilon-dither"
  | "celestial-lacquer"
  | "vector-etch"
  | "frosted-grain"
  | "provenance-grain";

export interface Brandmark3DSurfaceParams {
  /** Lab-only material-family recipe identifier. Default `default`. */
  family?: Brandmark3DMaterialFamily;
  /** Procedural material map family. Default `none`. */
  kind?: Brandmark3DSurfaceKind;
  /** Base map tint. Keep close to the material colour. */
  primary?: string;
  /** Inlay / grain / line tint. */
  secondary?: string;
  /** Visibility of the colour and roughness map. Default 0.65. */
  strength?: number;
  /** Pattern scale multiplier. Default 1. */
  scale?: number;
  /** Raised / etched bump depth. Default 0.08. */
  bump?: number;
  /** Additive surface inlay opacity. Default 0.25. */
  inlay?: number;
  /** Extrusion side tint. Uses the secondary colour by default. */
  sideColor?: string;
  /** Extrusion side roughness override. */
  sideRoughness?: number;
  /** Extrusion side metalness override. */
  sideMetalness?: number;
  /** Extrusion side environment reflection strength. */
  sideEnvMapIntensity?: number;
  /** Extrusion side emissive colour. */
  sideEmissive?: string;
  /** Extrusion side emissive intensity. */
  sideEmissiveIntensity?: number;
  /** Cap emissive colour for inlay/emissive-family presets. */
  capEmissive?: string;
  /** Cap emissive intensity. */
  capEmissiveIntensity?: number;
  /** Texture resolution. Default 512. */
  resolution?: number;
}

export interface Brandmark3DPhysicalParams {
  /** Base colour / metal tint. Default `#caa554` (brand gold). */
  color?: string;
  /** 0 = dielectric, 1 = metal. Default 1. */
  metalness?: number;
  /** 0 = mirror, 1 = fully rough. Default 0.15. */
  roughness?: number;
  /** Clearcoat layer strength 0..1. Default 0. */
  clearcoat?: number;
  /** Clearcoat roughness 0..1. Default 0.1. */
  clearcoatRoughness?: number;
  /** Thin-film iridescence strength 0..1. Default 0. */
  iridescence?: number;
  /** Reflection strength from the env map. Default 1. */
  envMapIntensity?: number;
}

export interface Brandmark3DTransmissionParams {
  /** Main glass tint. Default `#e7f7ff`. */
  color?: string;
  /** 0 = mirror-clear, 1 = frosted. Default 0.08. */
  roughness?: number;
  /** Transmission strength 0..1. Default 1. */
  transmission?: number;
  /** Volume thickness for refraction. Default 0.45. */
  thickness?: number;
  /** Index of refraction. Default 1.45. */
  ior?: number;
  /** Internal attenuation tint. Default `#caa554`. */
  attenuationColor?: string;
  /** Internal attenuation distance. Default 1.6. */
  attenuationDistance?: number;
  /** Clearcoat layer strength 0..1. Default 0.6. */
  clearcoat?: number;
  /** Clearcoat roughness 0..1. Default 0.04. */
  clearcoatRoughness?: number;
  /** Thin-film iridescence strength 0..1. Default 0.18. */
  iridescence?: number;
  /** Reflection strength from the env map. Default 1.5. */
  envMapIntensity?: number;
  /** RGB edge split used by Drei's transmission shader. Default 0.04. */
  chromaticAberration?: number;
  /** Directional blur/refraction strength. Default 0.2. */
  anisotropy?: number;
  /** Static distortion. Default 0.08. */
  distortion?: number;
  /** Multiplier for distortion. Default 0.35. */
  distortionScale?: number;
  /** Time-varying distortion. Default 0.04. */
  temporalDistortion?: number;
  /** Internal render target samples. Default 6. */
  samples?: number;
  /** Internal render target resolution. Default 512. */
  resolution?: number;
  /** Render the backside pass for thicker glass. Default true. */
  backside?: boolean;
  /** Backside volume thickness. Default 0.28. */
  backsideThickness?: number;
  /** Backside env contribution. Default 0.9. */
  backsideEnvMapIntensity?: number;
  /** Use the transmission sampler path. Default false. */
  transmissionSampler?: boolean;
  /** Background color sampled by the transmission material. */
  backgroundColor?: string;
}

export interface Brandmark3DWireframeParams {
  enabled?: boolean;
  /** `triangles` = every mesh edge (dense, technical); `edges` =
   *  feature edges only (cleaner). Default `edges`. */
  style?: "edges" | "triangles";
  color?: string;
  opacity?: number;
}

export interface Brandmark3DCutawayParams {
  enabled?: boolean;
  /** Split axis in object space. Default `x`. */
  axis?: "x" | "y";
  /** Split position along the axis, in normalized units (mark spans
   *  about ±0.5). Default 0 (centre). */
  offset?: number;
  /** Swap which side is solid vs wireframe. Default false. */
  flip?: boolean;
}

export interface Brandmark3DProps {
  /** Override the source SVG (defaults to the canonical brandmark). */
  svgUrl?: string;
  /** Geometry-shape props — any change triggers an async rebuild. */
  geometry?: BuildBrandmarkGeometryOptions;
  /** Material mode. Default `matcap`. */
  materialMode?: Brandmark3DMaterialMode;
  /** Matcap stops + style — used when `materialMode === "matcap"`. */
  matcap?: Partial<GoldMatcapStops> & {
    resolution?: number;
    style?: MatcapStyle;
  };
  /** Caller-supplied matcap texture (e.g. a captured PNG). Skips the
   *  procedural generator when set. */
  matcapTexture?: THREE.Texture | null;
  /** PBR params — used when `materialMode === "physical"`. */
  physical?: Brandmark3DPhysicalParams;
  /** Glass/refraction params — used when `materialMode === "transmission"`. */
  transmission?: Brandmark3DTransmissionParams;
  /** Procedural surface maps applied to PBR / glass modes. */
  surface?: Brandmark3DSurfaceParams;
  /** Lab-only material-map verification view. Default `none`. */
  debugMode?: Brandmark3DDebugMode;
  /** Wireframe overlay config. */
  wireframe?: Brandmark3DWireframeParams;
  /** Half/half clipping cutaway config. */
  cutaway?: Brandmark3DCutawayParams;
  /** Auto-rotation rate around Y in radians/sec. Default 0.18. */
  autoRotateSpeed?: number;
  /** Increment to reset the group back to its supplied base rotation. */
  rotationResetKey?: number;
  /** Whether to enable pointer-driven parallax tilt. Default true. */
  pointerParallax?: boolean;
  /** Peak pointer-driven tilt in radians. Default 0.22. */
  pointerTiltAmount?: number;
  /** Smoothing factor for pointer parallax lerp (0..1). Default 0.08. */
  pointerLerp?: number;
  /** Enable middle-mouse-button drag rotation. Default true. */
  middleMouseDrag?: boolean;
  /** Radians per pixel of pointer drag. Default π/400. */
  dragSensitivity?: number;
  /** Forwarded position/rotation. */
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Optional scale multiplier on top of the geometry's normalized size. */
  scale?: number;
  /** Called once geometry has finished building, with its size. */
  onReady?: (size: THREE.Vector3) => void;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function Brandmark3D({
  svgUrl = DEFAULT_BRANDMARK_SVG_URL,
  geometry: geometryOpts,
  materialMode = "matcap",
  matcap: matcapStops,
  matcapTexture,
  physical,
  transmission,
  surface,
  debugMode = "none",
  wireframe,
  cutaway,
  autoRotateSpeed = 0.18,
  rotationResetKey = 0,
  pointerParallax = true,
  pointerTiltAmount = 0.22,
  pointerLerp = 0.08,
  middleMouseDrag = true,
  dragSensitivity = Math.PI / 400,
  position,
  rotation,
  scale = 1,
  onReady,
}: Brandmark3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  // Stable scalar deps so effects don't re-fire on `{}` identity.
  const depth = geometryOpts?.depth;
  const bevelThickness = geometryOpts?.bevelThickness;
  const bevelSize = geometryOpts?.bevelSize;
  const bevelSegments = geometryOpts?.bevelSegments;
  const curveSegments = geometryOpts?.curveSegments;
  const includeSlivers = geometryOpts?.includeSlivers;
  const targetSize = geometryOpts?.targetSize;

  const matcapCore = matcapStops?.core;
  const matcapMid = matcapStops?.mid;
  const matcapEdge = matcapStops?.edge;
  const matcapMidStop = matcapStops?.midStop;
  const matcapEdgeStop = matcapStops?.edgeStop;
  const matcapResolution = matcapStops?.resolution;
  const matcapStyle = matcapStops?.style;

  const physColor = physical?.color ?? "#caa554";
  const physMetalness = physical?.metalness ?? 1;
  const physRoughness = physical?.roughness ?? 0.15;
  const physClearcoat = physical?.clearcoat ?? 0;
  const physClearcoatRoughness = physical?.clearcoatRoughness ?? 0.1;
  const physIridescence = physical?.iridescence ?? 0;
  const physEnvIntensity = physical?.envMapIntensity ?? 1;

  const transColor = transmission?.color ?? "#e7f7ff";
  const transRoughness = transmission?.roughness ?? 0.08;
  const transTransmission = transmission?.transmission ?? 1;
  const transThickness = transmission?.thickness ?? 0.45;
  const transIor = transmission?.ior ?? 1.45;
  const transAttenuationColor = transmission?.attenuationColor ?? "#caa554";
  const transAttenuationDistance = transmission?.attenuationDistance ?? 1.6;
  const transClearcoat = transmission?.clearcoat ?? 0.6;
  const transClearcoatRoughness = transmission?.clearcoatRoughness ?? 0.04;
  const transIridescence = transmission?.iridescence ?? 0.18;
  const transEnvIntensity = transmission?.envMapIntensity ?? 1.5;
  const transChromaticAberration = transmission?.chromaticAberration ?? 0.04;
  const transAnisotropy = transmission?.anisotropy ?? 0.2;
  const transDistortion = transmission?.distortion ?? 0.08;
  const transDistortionScale = transmission?.distortionScale ?? 0.35;
  const transTemporalDistortion = transmission?.temporalDistortion ?? 0.04;
  const transSamples = transmission?.samples ?? 6;
  const transResolution = transmission?.resolution ?? 512;
  const transBackside = transmission?.backside ?? true;
  const transBacksideThickness = transmission?.backsideThickness ?? 0.28;
  const transBacksideEnvMapIntensity = transmission?.backsideEnvMapIntensity ?? 0.9;
  const transTransmissionSampler = transmission?.transmissionSampler ?? false;
  const transBackgroundColor = transmission?.backgroundColor;

  const surfaceKind = surface?.kind ?? "none";
  const surfacePrimary = surface?.primary ?? physColor;
  const surfaceSecondary = surface?.secondary ?? "#caa554";
  const surfaceStrength = surface?.strength ?? 0.65;
  const surfaceScale = surface?.scale ?? 1;
  const surfaceBump = surface?.bump ?? 0.08;
  const surfaceInlay = surface?.inlay ?? 0.25;
  const surfaceResolution = surface?.resolution ?? 512;
  const surfaceFamily = surface?.family ?? "default";
  const surfaceSideColor = surface?.sideColor ?? surfaceSecondary;
  const surfaceSideRoughness = surface?.sideRoughness ?? Math.min(0.82, physRoughness + 0.18);
  const surfaceSideMetalness = surface?.sideMetalness ?? physMetalness;
  const surfaceSideEnvIntensity = surface?.sideEnvMapIntensity ?? physEnvIntensity;
  const surfaceSideEmissive = surface?.sideEmissive ?? "#000000";
  const surfaceSideEmissiveIntensity = surface?.sideEmissiveIntensity ?? 0;
  const surfaceCapEmissive = surface?.capEmissive ?? "#000000";
  const surfaceCapEmissiveIntensity = surface?.capEmissiveIntensity ?? 0;

  const wireEnabled = wireframe?.enabled ?? false;
  const wireStyle = wireframe?.style ?? "edges";
  const wireColor = wireframe?.color ?? "#caa554";
  const wireOpacity = wireframe?.opacity ?? 0.5;

  const cutawayEnabled = cutaway?.enabled ?? false;
  const cutawayAxis = cutaway?.axis ?? "x";
  const cutawayOffset = cutaway?.offset ?? 0;
  const cutawayFlip = cutaway?.flip ?? false;

  // The wireframe shows whenever the overlay is on OR a cutaway is
  // active (the cutaway needs the wire half to read).
  const showWire = wireEnabled || cutawayEnabled;

  const gl = useThree((s) => s.gl);

  // ── Async geometry build ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    buildBrandmarkGeometry(svgUrl, {
      depth,
      bevelThickness,
      bevelSize,
      bevelSegments,
      curveSegments,
      includeSlivers,
      targetSize,
    })
      .then((result) => {
        if (cancelled) {
          result.geometry.dispose();
          return;
        }
        setGeometry((prev) => {
          if (prev) prev.dispose();
          return result.geometry;
        });
        onReady?.(result.size);
      })
      .catch((err) => {
        if (cancelled) return;

        console.error("[Brandmark3D] geometry build failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [
    svgUrl,
    depth,
    bevelThickness,
    bevelSize,
    bevelSegments,
    curveSegments,
    includeSlivers,
    targetSize,
    onReady,
  ]);

  useEffect(() => {
    return () => {
      setGeometry((prev) => {
        if (prev) prev.dispose();
        return null;
      });
    };
  }, []);

  // ── Wireframe geometry (derived from the solid geometry) ──────
  const wireGeometry = useMemo(() => {
    if (!geometry || !showWire) return null;
    return wireStyle === "triangles"
      ? new THREE.WireframeGeometry(geometry)
      : new THREE.EdgesGeometry(geometry, 24);
  }, [geometry, showWire, wireStyle]);

  useEffect(() => {
    return () => {
      wireGeometry?.dispose();
    };
  }, [wireGeometry]);

  const capGeometry = useMemo(() => {
    if (!geometry) return null;
    return extractMaterialGroupGeometry(geometry, 0);
  }, [geometry]);

  const sideGeometry = useMemo(() => {
    if (!geometry) return null;
    return extractMaterialGroupGeometry(geometry, 1);
  }, [geometry]);

  useEffect(() => {
    return () => {
      capGeometry?.dispose();
    };
  }, [capGeometry]);

  useEffect(() => {
    return () => {
      sideGeometry?.dispose();
    };
  }, [sideGeometry]);

  // ── Clipping planes ────────────────────────────────────────────
  const { solidPlane, wirePlane } = useMemo(() => {
    const sign = cutawayFlip ? -1 : 1;
    const n = cutawayAxis === "y" ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    return {
      // Solid visible where axis·p ≥ offset; wire on the opposite side.
      solidPlane: new THREE.Plane(n.clone().multiplyScalar(sign), -cutawayOffset * sign),
      wirePlane: new THREE.Plane(n.clone().multiplyScalar(-sign), cutawayOffset * sign),
    };
  }, [cutawayAxis, cutawayOffset, cutawayFlip]);

  // Local clipping must be enabled on the renderer for material
  // `clippingPlanes` to take effect.
  useEffect(() => {
    if (!cutawayEnabled) return;
    const previous = gl.localClippingEnabled;
    Object.assign(gl, { localClippingEnabled: true });
    return () => {
      Object.assign(gl, { localClippingEnabled: previous });
    };
  }, [gl, cutawayEnabled]);

  // ── Matcap texture (matcap mode only) ─────────────────────────
  const proceduralMatcap = useMemo(() => {
    if (materialMode !== "matcap") return null;
    if (matcapTexture) return null;
    if (typeof window === "undefined" || typeof document === "undefined") {
      return null;
    }
    return makeMatcapTexture({
      core: matcapCore ?? DEFAULT_GOLD_MATCAP_STOPS.core,
      mid: matcapMid ?? DEFAULT_GOLD_MATCAP_STOPS.mid,
      edge: matcapEdge ?? DEFAULT_GOLD_MATCAP_STOPS.edge,
      midStop: matcapMidStop ?? DEFAULT_GOLD_MATCAP_STOPS.midStop,
      edgeStop: matcapEdgeStop ?? DEFAULT_GOLD_MATCAP_STOPS.edgeStop,
      style: matcapStyle ?? "metallic",
      resolution: matcapResolution,
    });
  }, [
    materialMode,
    matcapTexture,
    matcapCore,
    matcapMid,
    matcapEdge,
    matcapMidStop,
    matcapEdgeStop,
    matcapStyle,
    matcapResolution,
  ]);

  useEffect(() => {
    return () => {
      proceduralMatcap?.dispose();
    };
  }, [proceduralMatcap]);

  const transmissionBackground = useMemo(() => {
    return transBackgroundColor ? new THREE.Color(transBackgroundColor) : undefined;
  }, [transBackgroundColor]);

  const surfaceMaps = useMemo(() => {
    if (surfaceKind === "none") return null;
    if (typeof document === "undefined") return null;
    return makeBrandmarkSurfaceMaps({
      kind: surfaceKind,
      primary: surfacePrimary,
      secondary: surfaceSecondary,
      strength: surfaceStrength,
      scale: surfaceScale,
      bump: surfaceBump,
      inlay: surfaceInlay,
      resolution: surfaceResolution,
    });
  }, [
    surfaceKind,
    surfacePrimary,
    surfaceSecondary,
    surfaceStrength,
    surfaceScale,
    surfaceBump,
    surfaceInlay,
    surfaceResolution,
  ]);

  useEffect(() => {
    return () => {
      surfaceMaps?.colorMap.dispose();
      surfaceMaps?.roughnessMap.dispose();
      surfaceMaps?.bumpMap.dispose();
      surfaceMaps?.inlayMap.dispose();
    };
  }, [surfaceMaps]);

  const surfaceMaterialProps = useMemo(() => {
    return surfaceMaps
      ? {
          map: surfaceMaps.colorMap,
          roughnessMap: surfaceMaps.roughnessMap,
          bumpMap: surfaceMaps.bumpMap,
          bumpScale: surfaceMaps.bumpScale,
        }
      : {};
  }, [surfaceMaps]);

  // ── Solid material ────────────────────────────────────────────
  const solidMaterial = useMemo<THREE.Material | THREE.Material[] | null>(() => {
    const clippingProps = cutawayEnabled
      ? { clippingPlanes: [solidPlane], clipShadows: false }
      : {};
    if (materialMode === "transmission") return null;
    if (materialMode === "physical") {
      const capMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(physColor),
        metalness: physMetalness,
        roughness: physRoughness,
        clearcoat: physClearcoat,
        clearcoatRoughness: physClearcoatRoughness,
        iridescence: physIridescence,
        envMapIntensity: physEnvIntensity,
        emissive: new THREE.Color(surfaceCapEmissive),
        emissiveIntensity: surfaceCapEmissiveIntensity,
        ...surfaceMaterialProps,
        ...clippingProps,
        side: THREE.DoubleSide,
      });
      capMaterial.name = `brandmark-cap-${surfaceFamily}`;
      const sideMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(surfaceSideColor),
        metalness: surfaceSideMetalness,
        roughness: surfaceSideRoughness,
        clearcoat: physClearcoat,
        clearcoatRoughness: Math.max(physClearcoatRoughness, surfaceSideRoughness * 0.35),
        iridescence: physIridescence,
        envMapIntensity: surfaceSideEnvIntensity,
        emissive: new THREE.Color(surfaceSideEmissive),
        emissiveIntensity: surfaceSideEmissiveIntensity,
        ...clippingProps,
        side: THREE.DoubleSide,
      });
      sideMaterial.name = `brandmark-side-${surfaceFamily}`;
      return [capMaterial, sideMaterial];
    }
    const tex = matcapTexture ?? proceduralMatcap ?? null;
    const capMaterial = new THREE.MeshMatcapMaterial({
      matcap: tex,
      color: new THREE.Color(physColor),
      flatShading: false,
      toneMapped: false,
      transparent: false,
      ...clippingProps,
    });
    capMaterial.name = `brandmark-cap-matcap-${surfaceFamily}`;
    const sideMaterial = new THREE.MeshMatcapMaterial({
      matcap: tex,
      color: new THREE.Color(surfaceSideColor),
      flatShading: false,
      toneMapped: false,
      transparent: false,
      ...clippingProps,
    });
    sideMaterial.name = `brandmark-side-matcap-${surfaceFamily}`;
    return [capMaterial, sideMaterial];
  }, [
    materialMode,
    matcapTexture,
    proceduralMatcap,
    physColor,
    physMetalness,
    physRoughness,
    physClearcoat,
    physClearcoatRoughness,
    physIridescence,
    physEnvIntensity,
    surfaceFamily,
    surfaceSideColor,
    surfaceSideRoughness,
    surfaceSideMetalness,
    surfaceSideEnvIntensity,
    surfaceSideEmissive,
    surfaceSideEmissiveIntensity,
    surfaceCapEmissive,
    surfaceCapEmissiveIntensity,
    surfaceMaterialProps,
    cutawayEnabled,
    solidPlane,
  ]);

  useEffect(() => {
    return () => {
      disposeMaterial(solidMaterial);
    };
  }, [solidMaterial]);

  const surfaceInlayMaterial = useMemo(() => {
    if (!surfaceMaps || surfaceMaps.inlayOpacity <= 0) return null;
    return new THREE.MeshBasicMaterial({
      color: surfaceMaps.inlayColor,
      alphaMap: surfaceMaps.inlayMap,
      transparent: true,
      opacity: surfaceMaps.inlayOpacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      side: THREE.DoubleSide,
    });
  }, [surfaceMaps]);

  useEffect(() => {
    return () => {
      surfaceInlayMaterial?.dispose();
    };
  }, [surfaceInlayMaterial]);

  // ── Wireframe material ────────────────────────────────────────
  const transmissionSideMaterial = useMemo(() => {
    if (materialMode !== "transmission") return null;
    const material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(surfaceSideColor),
      metalness: surfaceSideMetalness,
      roughness: surfaceSideRoughness,
      clearcoat: transClearcoat,
      clearcoatRoughness: Math.max(transClearcoatRoughness, surfaceSideRoughness * 0.28),
      iridescence: transIridescence,
      envMapIntensity: surfaceSideEnvIntensity,
      emissive: new THREE.Color(surfaceSideEmissive),
      emissiveIntensity: surfaceSideEmissiveIntensity,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      blending: surfaceSideEmissiveIntensity > 0 ? THREE.AdditiveBlending : THREE.NormalBlending,
      ...(cutawayEnabled ? { clippingPlanes: [solidPlane], clipShadows: false } : {}),
      side: THREE.DoubleSide,
    });
    material.name = `brandmark-transmission-side-${surfaceFamily}`;
    return material;
  }, [
    materialMode,
    surfaceFamily,
    surfaceSideColor,
    surfaceSideMetalness,
    surfaceSideRoughness,
    surfaceSideEnvIntensity,
    surfaceSideEmissive,
    surfaceSideEmissiveIntensity,
    transClearcoat,
    transClearcoatRoughness,
    transIridescence,
    cutawayEnabled,
    solidPlane,
  ]);

  useEffect(() => {
    return () => {
      transmissionSideMaterial?.dispose();
    };
  }, [transmissionSideMaterial]);

  const debugUvTexture = useMemo(() => {
    if (debugMode !== "uv") return null;
    if (typeof document === "undefined") return null;
    return makeUvDebugTexture(512);
  }, [debugMode]);

  useEffect(() => {
    return () => {
      debugUvTexture?.dispose();
    };
  }, [debugUvTexture]);

  const debugMaterial = useMemo<THREE.Material | THREE.Material[] | null>(() => {
    if (debugMode === "none") return null;
    const clippingProps = cutawayEnabled
      ? { clippingPlanes: [solidPlane], clipShadows: false }
      : {};

    if (debugMode === "normal") {
      return [
        new THREE.MeshNormalMaterial({ ...clippingProps, side: THREE.DoubleSide }),
        new THREE.MeshNormalMaterial({ ...clippingProps, side: THREE.DoubleSide }),
      ];
    }

    if (debugMode === "uv") {
      return [
        new THREE.MeshBasicMaterial({
          map: debugUvTexture,
          toneMapped: false,
          ...clippingProps,
          side: THREE.DoubleSide,
        }),
        new THREE.MeshBasicMaterial({
          map: debugUvTexture,
          toneMapped: false,
          ...clippingProps,
          side: THREE.DoubleSide,
        }),
      ];
    }

    if (debugMode === "roughness") {
      return [
        new THREE.MeshBasicMaterial({
          map: surfaceMaps?.roughnessMap,
          color: surfaceMaps
            ? "#ffffff"
            : grayscaleColor(currentCapRoughness(materialMode, physRoughness, transRoughness)),
          toneMapped: false,
          ...clippingProps,
          side: THREE.DoubleSide,
        }),
        new THREE.MeshBasicMaterial({
          color: grayscaleColor(surfaceSideRoughness),
          toneMapped: false,
          ...clippingProps,
          side: THREE.DoubleSide,
        }),
      ];
    }

    return [
      new THREE.MeshBasicMaterial({
        map: surfaceMaps?.colorMap,
        color: surfaceMaps
          ? "#ffffff"
          : new THREE.Color(materialMode === "transmission" ? transColor : physColor),
        toneMapped: false,
        ...clippingProps,
        side: THREE.DoubleSide,
      }),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(surfaceSideColor),
        toneMapped: false,
        ...clippingProps,
        side: THREE.DoubleSide,
      }),
    ];
  }, [
    debugMode,
    debugUvTexture,
    materialMode,
    physColor,
    transColor,
    physRoughness,
    transRoughness,
    surfaceMaps,
    surfaceSideColor,
    surfaceSideRoughness,
    cutawayEnabled,
    solidPlane,
  ]);

  useEffect(() => {
    return () => {
      disposeMaterial(debugMaterial);
    };
  }, [debugMaterial]);

  const wireMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: new THREE.Color(wireColor),
      transparent: true,
      opacity: clamp01(wireOpacity),
      toneMapped: false,
      depthWrite: false,
      ...(cutawayEnabled ? { clippingPlanes: [wirePlane] } : {}),
    });
  }, [wireColor, wireOpacity, cutawayEnabled, wirePlane]);

  useEffect(() => {
    return () => {
      wireMaterial.dispose();
    };
  }, [wireMaterial]);

  // ── Reduced-motion gate ───────────────────────────────────────
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

  // ── Motion: auto-rotate + parallax + middle-mouse drag ────────
  const pointer = useThree((s) => s.pointer);
  const baseRotationX = rotation?.[0] ?? 0;
  const baseRotationY = rotation?.[1] ?? 0;
  const baseRotationZ = rotation?.[2] ?? 0;
  const tiltState = useRef({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const manualBaseRef = useRef({ x: baseRotationX });

  useEffect(() => {
    const group = groupRef.current;
    draggingRef.current = false;
    tiltState.current = { x: 0, y: 0 };
    manualBaseRef.current.x = baseRotationX;
    if (!group) return;
    group.rotation.set(baseRotationX, baseRotationY, baseRotationZ);
  }, [rotationResetKey, baseRotationX, baseRotationY, baseRotationZ]);

  useEffect(() => {
    if (!middleMouseDrag) return;
    const canvas = gl.domElement;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 1) return;
      e.preventDefault();
      draggingRef.current = true;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // ignore — pointermove still fires on the canvas
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const group = groupRef.current;
      if (!group) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      group.rotation.y += dx * dragSensitivity;
      manualBaseRef.current.x += dy * dragSensitivity;
      group.rotation.x = manualBaseRef.current.x;
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button !== 1 && draggingRef.current === false) return;
      draggingRef.current = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };

    const handlePointerCancel = () => {
      draggingRef.current = false;
    };

    const handleAuxClick = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerCancel);
    canvas.addEventListener("auxclick", handleAuxClick);
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerCancel);
      canvas.removeEventListener("auxclick", handleAuxClick);
      draggingRef.current = false;
    };
  }, [gl, middleMouseDrag, dragSensitivity]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const dragging = draggingRef.current;

    if (!reducedMotion && autoRotateSpeed !== 0 && !dragging) {
      group.rotation.y += autoRotateSpeed * delta;
    }

    if (pointerParallax && !reducedMotion && pointerTiltAmount > 0 && !dragging) {
      const targetX = -pointer.y * pointerTiltAmount;
      const targetY = pointer.x * pointerTiltAmount;
      const a = clamp01(pointerLerp);
      tiltState.current.x += (targetX - tiltState.current.x) * a;
      tiltState.current.y += (targetY - tiltState.current.y) * a;
      group.rotation.x = manualBaseRef.current.x + tiltState.current.x;
      group.rotation.z = baseRotationZ + tiltState.current.y * 0.25;
    } else if (!dragging) {
      group.rotation.x = manualBaseRef.current.x;
      group.rotation.z = baseRotationZ;
    }
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef} position={position} scale={scale} rotation={rotation}>
      {debugMaterial ? (
        <mesh geometry={geometry} material={debugMaterial} />
      ) : materialMode === "transmission" ? (
        <mesh geometry={geometry}>
          <MeshTransmissionMaterial
            color={transColor}
            roughness={transRoughness}
            transmission={transTransmission}
            thickness={transThickness}
            ior={transIor}
            attenuationColor={transAttenuationColor}
            attenuationDistance={transAttenuationDistance}
            clearcoat={transClearcoat}
            clearcoatRoughness={transClearcoatRoughness}
            iridescence={transIridescence}
            envMapIntensity={transEnvIntensity}
            chromaticAberration={transChromaticAberration}
            anisotropy={transAnisotropy}
            distortion={transDistortion}
            distortionScale={transDistortionScale}
            temporalDistortion={transTemporalDistortion}
            samples={transSamples}
            resolution={transResolution}
            backside={transBackside}
            backsideThickness={transBacksideThickness}
            backsideEnvMapIntensity={transBacksideEnvMapIntensity}
            transmissionSampler={transTransmissionSampler}
            background={transmissionBackground}
            {...surfaceMaterialProps}
            {...(cutawayEnabled ? { clippingPlanes: [solidPlane], clipShadows: false } : {})}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : solidMaterial ? (
        <mesh geometry={geometry} material={solidMaterial} />
      ) : null}
      {!debugMaterial &&
      materialMode === "transmission" &&
      sideGeometry &&
      transmissionSideMaterial ? (
        <mesh geometry={sideGeometry} material={transmissionSideMaterial} scale={1.004} />
      ) : null}
      {!debugMaterial && surfaceInlayMaterial ? (
        <mesh geometry={capGeometry ?? geometry} material={surfaceInlayMaterial} scale={1.003} />
      ) : null}
      {!debugMaterial && showWire && wireGeometry ? (
        <lineSegments geometry={wireGeometry} material={wireMaterial} />
      ) : null}
    </group>
  );
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function disposeMaterial(material: THREE.Material | THREE.Material[] | null) {
  if (!material) return;
  if (Array.isArray(material)) {
    for (const entry of material) entry.dispose();
    return;
  }
  material.dispose();
}

function extractMaterialGroupGeometry(
  source: THREE.BufferGeometry,
  materialIndex: number
): THREE.BufferGeometry | null {
  if (source.index) return null;
  const groups = source.groups.filter((group) => group.materialIndex === materialIndex);
  if (!groups.length) return null;

  const slices = groups.map((group) => sliceRenderableGeometryGroup(source, group));
  if (slices.length === 1) return slices[0];

  const merged = mergeGeometries(slices, false);
  for (const slice of slices) slice.dispose();
  return merged;
}

function sliceRenderableGeometryGroup(
  source: THREE.BufferGeometry,
  group: { start: number; count: number; materialIndex?: number }
): THREE.BufferGeometry {
  const slice = new THREE.BufferGeometry();
  const start = group.start;
  const end = group.start + group.count;

  for (const name of Object.keys(source.attributes)) {
    const attribute = source.getAttribute(name) as THREE.BufferAttribute;
    const from = start * attribute.itemSize;
    const to = end * attribute.itemSize;
    const array = attribute.array.slice(from, to) as THREE.TypedArray;
    slice.setAttribute(
      name,
      new THREE.BufferAttribute(array, attribute.itemSize, attribute.normalized)
    );
  }

  slice.computeBoundingBox();
  slice.computeBoundingSphere();
  return slice;
}

function makeUvDebugTexture(size: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Brandmark3D: failed to create UV debug texture");

  const cell = size / 8;
  for (let y = 0; y < 8; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      ctx.fillStyle = (x + y) % 2 === 0 ? "#ebe3d6" : "#14100b";
      ctx.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  ctx.strokeStyle = "#caa554";
  ctx.lineWidth = 2;
  for (let i = 0; i <= 8; i += 1) {
    const p = i * cell;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "rgba(88, 218, 199, 0.68)");
  gradient.addColorStop(0.5, "rgba(202, 165, 84, 0.2)");
  gradient.addColorStop(1, "rgba(200, 78, 47, 0.58)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}

function currentCapRoughness(
  materialMode: Brandmark3DMaterialMode,
  physicalRoughness: number,
  transmissionRoughness: number
): number {
  return materialMode === "transmission" ? transmissionRoughness : physicalRoughness;
}

function grayscaleColor(value: number): THREE.Color {
  const v = clamp01(value);
  return new THREE.Color(v, v, v);
}

interface BrandmarkSurfaceMapOptions {
  kind: Brandmark3DSurfaceKind;
  primary: string;
  secondary: string;
  strength: number;
  scale: number;
  bump: number;
  inlay: number;
  resolution: number;
}

interface BrandmarkSurfaceMapBundle {
  colorMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  inlayMap: THREE.CanvasTexture;
  bumpScale: number;
  inlayOpacity: number;
  inlayColor: THREE.Color;
}

function makeBrandmarkSurfaceMaps(opts: BrandmarkSurfaceMapOptions): BrandmarkSurfaceMapBundle {
  const size = Math.round(clamp(opts.resolution, 128, 1024));
  const colorCanvas = makeCanvas(size);
  const roughnessCanvas = makeCanvas(size);
  const bumpCanvas = makeCanvas(size);
  const inlayCanvas = makeCanvas(size);
  const colorCtx = mustGetContext(colorCanvas);
  const roughCtx = mustGetContext(roughnessCanvas);
  const bumpCtx = mustGetContext(bumpCanvas);
  const inlayCtx = mustGetContext(inlayCanvas);
  const strength = clamp(opts.strength, 0, 1.2);

  fill(colorCtx, opts.primary);
  fill(roughCtx, "#9a9a9a");
  fill(bumpCtx, "#808080");
  fill(inlayCtx, "#000000");

  switch (opts.kind) {
    case "tensor-bands":
      drawTensorBands(colorCtx, roughCtx, bumpCtx, inlayCtx, opts, size, strength);
      break;
    case "brushed-brass":
      drawBrushedBrass(colorCtx, roughCtx, bumpCtx, inlayCtx, opts, size, strength);
      break;
    case "ceramic-speckle":
      drawCeramicSpeckle(colorCtx, roughCtx, bumpCtx, inlayCtx, opts, size, strength);
      break;
    case "amber-contours":
      drawAmberContours(colorCtx, roughCtx, bumpCtx, inlayCtx, opts, size, strength);
      break;
    case "blueprint-slices":
      drawBlueprintSlices(colorCtx, roughCtx, bumpCtx, inlayCtx, opts, size, strength);
      break;
    case "epsilon-dither":
      drawEpsilonDither(colorCtx, roughCtx, bumpCtx, inlayCtx, opts, size, strength);
      break;
    case "celestial-lacquer":
      drawCelestialLacquer(colorCtx, roughCtx, bumpCtx, inlayCtx, opts, size, strength);
      break;
    case "vector-etch":
      drawVectorEtch(colorCtx, roughCtx, bumpCtx, inlayCtx, opts, size, strength);
      break;
    case "frosted-grain":
      drawFrostedGrain(colorCtx, roughCtx, bumpCtx, inlayCtx, opts, size, strength);
      break;
    case "provenance-grain":
      drawProvenanceGrain(colorCtx, roughCtx, bumpCtx, inlayCtx, opts, size, strength);
      break;
  }

  const repeat = clamp(opts.scale, 0.35, 3.5);
  const colorMap = makeCanvasTexture(colorCanvas, repeat, true);
  const roughnessMap = makeCanvasTexture(roughnessCanvas, repeat, false);
  const bumpMap = makeCanvasTexture(bumpCanvas, repeat, false);
  const inlayMap = makeCanvasTexture(inlayCanvas, repeat, false);

  return {
    colorMap,
    roughnessMap,
    bumpMap,
    inlayMap,
    bumpScale: clamp(opts.bump, 0, 0.25),
    inlayOpacity: clamp(opts.inlay, 0, 1),
    inlayColor: new THREE.Color(opts.secondary),
  };
}

function makeCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function mustGetContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable for brandmark surface map");
  return ctx;
}

function makeCanvasTexture(
  canvas: HTMLCanvasElement,
  repeat: number,
  srgb: boolean
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 4;
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function fill(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawTensorBands(
  color: CanvasRenderingContext2D,
  rough: CanvasRenderingContext2D,
  bump: CanvasRenderingContext2D,
  inlay: CanvasRenderingContext2D,
  opts: BrandmarkSurfaceMapOptions,
  size: number,
  strength: number
) {
  for (let i = 0; i < 12; i += 1) {
    const x = (i / 12) * size + hash01(i * 13.7) * size * 0.08;
    const width = size * (0.018 + hash01(i * 23.2) * 0.055);
    color.fillStyle = rgba(opts.secondary, 0.08 * strength);
    color.fillRect(x, 0, width, size);
    rough.fillStyle = `rgba(240,240,240,${0.12 * strength})`;
    rough.fillRect(x, 0, width, size);
    bump.fillStyle = `rgba(210,210,210,${0.16 * strength})`;
    bump.fillRect(x, 0, width * 0.5, size);
  }
  drawDiagonal(color, opts.secondary, size, 0.16 * strength, 8);
  drawDiagonal(inlay, "#ffffff", size, 0.7, 5);
}

function drawBrushedBrass(
  color: CanvasRenderingContext2D,
  rough: CanvasRenderingContext2D,
  bump: CanvasRenderingContext2D,
  inlay: CanvasRenderingContext2D,
  opts: BrandmarkSurfaceMapOptions,
  size: number,
  strength: number
) {
  for (let y = 0; y < size; y += 3) {
    const alpha = 0.04 + hash01(y * 2.7) * 0.13 * strength;
    const jitter = (hash01(y * 7.3) - 0.5) * 18;
    line(color, -20, y, size + 20, y + jitter * 0.08, opts.secondary, alpha, 1);
    line(rough, 0, y, size, y, "#f2f2f2", alpha * 0.7, 1);
    line(bump, 0, y, size, y, "#d8d8d8", alpha, 1);
    if (y % 27 === 0) line(inlay, 0, y, size, y, "#ffffff", 0.45, 1.5);
  }
}

function drawCeramicSpeckle(
  color: CanvasRenderingContext2D,
  rough: CanvasRenderingContext2D,
  bump: CanvasRenderingContext2D,
  inlay: CanvasRenderingContext2D,
  opts: BrandmarkSurfaceMapOptions,
  size: number,
  strength: number
) {
  const count = Math.round(1200 * strength);
  for (let i = 0; i < count; i += 1) {
    const x = hash01(i * 11.13) * size;
    const y = hash01(i * 41.71) * size;
    const r = 0.6 + hash01(i * 89.4) * 2.2;
    dot(color, x, y, r, hash01(i * 5.4) > 0.82 ? opts.secondary : "#ffffff", 0.07);
    dot(rough, x, y, r * 1.3, "#ffffff", 0.16);
    dot(bump, x, y, r, hash01(i) > 0.5 ? "#bdbdbd" : "#ececec", 0.18);
    if (i % 37 === 0) dot(inlay, x, y, r * 0.9, "#ffffff", 0.35);
  }
}

function drawAmberContours(
  color: CanvasRenderingContext2D,
  rough: CanvasRenderingContext2D,
  bump: CanvasRenderingContext2D,
  inlay: CanvasRenderingContext2D,
  opts: BrandmarkSurfaceMapOptions,
  size: number,
  strength: number
) {
  for (let band = 0; band < 16; band += 1) {
    const y = size * (0.08 + band * 0.055);
    drawWave(color, y, size, opts.secondary, 0.12 * strength, 2);
    drawWave(rough, y, size, "#eeeeee", 0.14 * strength, 2);
    drawWave(bump, y, size, "#eeeeee", 0.2 * strength, 2);
    if (band % 3 === 1) drawWave(inlay, y, size, "#ffffff", 0.62, 2.4);
  }
}

function drawBlueprintSlices(
  color: CanvasRenderingContext2D,
  rough: CanvasRenderingContext2D,
  bump: CanvasRenderingContext2D,
  inlay: CanvasRenderingContext2D,
  opts: BrandmarkSurfaceMapOptions,
  size: number,
  strength: number
) {
  for (let y = 14; y < size; y += 14) {
    const alpha = y % 42 === 0 ? 0.2 : 0.1;
    line(color, 0, y, size, y, opts.secondary, alpha * strength, 1);
    line(rough, 0, y, size, y, "#f0f0f0", alpha * strength, 1);
    line(bump, 0, y, size, y, "#efefef", alpha * strength, 1);
    if (y % 28 === 0) line(inlay, 0, y, size, y, "#ffffff", 0.52, 1);
  }
  for (let i = 0; i < 34; i += 1) {
    const y = hash01(i * 9.2) * size;
    const x = hash01(i * 19.4) * size * 0.72;
    line(inlay, x, y, x + size * (0.08 + hash01(i) * 0.22), y, "#ffffff", 0.45, 2);
  }
}

function drawEpsilonDither(
  color: CanvasRenderingContext2D,
  rough: CanvasRenderingContext2D,
  bump: CanvasRenderingContext2D,
  inlay: CanvasRenderingContext2D,
  opts: BrandmarkSurfaceMapOptions,
  size: number,
  strength: number
) {
  const cell = Math.max(4, Math.round(size / 58));
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const h = hash01(x * 3.7 + y * 5.1);
      if (h > 0.22 + strength * 0.16) continue;
      const w = cell * (1 + Math.floor(hash01(h * 19) * 4));
      color.fillStyle = rgba(opts.secondary, 0.18 * strength);
      color.fillRect(x, y, w, cell * 0.74);
      rough.fillStyle = `rgba(240,240,240,${0.16 * strength})`;
      rough.fillRect(x, y, w, cell);
      bump.fillStyle = `rgba(230,230,230,${0.18 * strength})`;
      bump.fillRect(x, y, w, cell);
      if (h < 0.08) {
        inlay.fillStyle = "rgba(255,255,255,0.68)";
        inlay.fillRect(x, y, w, cell);
      }
    }
  }
}

function drawCelestialLacquer(
  color: CanvasRenderingContext2D,
  rough: CanvasRenderingContext2D,
  bump: CanvasRenderingContext2D,
  inlay: CanvasRenderingContext2D,
  opts: BrandmarkSurfaceMapOptions,
  size: number,
  strength: number
) {
  color.fillStyle = rgba(opts.secondary, 0.06 * strength);
  color.fillRect(0, 0, size, size);
  for (let r = 0; r < 5; r += 1) {
    const radius = size * (0.18 + r * 0.085);
    arc(color, size * 0.5, size * 0.52, radius, opts.secondary, 0.18 * strength, 2);
    arc(rough, size * 0.5, size * 0.52, radius, "#efefef", 0.12 * strength, 2);
    arc(bump, size * 0.5, size * 0.52, radius, "#eeeeee", 0.16 * strength, 2);
    arc(inlay, size * 0.5, size * 0.52, radius, "#ffffff", 0.5, 2.6);
  }
  for (let i = 0; i < 70; i += 1) {
    const x = hash01(i * 17.3) * size;
    const y = hash01(i * 31.9) * size;
    dot(inlay, x, y, 0.8 + hash01(i) * 1.5, "#ffffff", 0.35);
  }
}

function drawVectorEtch(
  color: CanvasRenderingContext2D,
  rough: CanvasRenderingContext2D,
  bump: CanvasRenderingContext2D,
  inlay: CanvasRenderingContext2D,
  opts: BrandmarkSurfaceMapOptions,
  size: number,
  strength: number
) {
  for (let layer = 0; layer < 8; layer += 1) {
    const inset = size * (0.08 + layer * 0.045);
    const pts: Array<[number, number]> = [
      [inset, size * 0.34 + layer * 5],
      [size * 0.42, inset],
      [size - inset * 0.8, size * 0.38],
      [size * 0.66, size - inset],
      [inset * 1.2, size * 0.72],
    ];
    polyline(color, pts, true, opts.secondary, 0.12 * strength, 1.4);
    polyline(rough, pts, true, "#ededed", 0.13 * strength, 1.4);
    polyline(bump, pts, true, "#efefef", 0.2 * strength, 1.4);
    if (layer % 2 === 0) polyline(inlay, pts, true, "#ffffff", 0.46, 1.8);
  }
}

function drawFrostedGrain(
  color: CanvasRenderingContext2D,
  rough: CanvasRenderingContext2D,
  bump: CanvasRenderingContext2D,
  inlay: CanvasRenderingContext2D,
  opts: BrandmarkSurfaceMapOptions,
  size: number,
  strength: number
) {
  for (let i = 0; i < 900; i += 1) {
    const x = hash01(i * 8.13) * size;
    const y = hash01(i * 12.91) * size;
    const r = 1 + hash01(i * 51.6) * 6;
    dot(color, x, y, r, hash01(i) > 0.52 ? "#ffffff" : opts.secondary, 0.045 * strength);
    dot(rough, x, y, r * 1.4, "#ffffff", 0.18 * strength);
    dot(bump, x, y, r, hash01(i) > 0.5 ? "#bbbbbb" : "#eeeeee", 0.12 * strength);
    if (i % 89 === 0) dot(inlay, x, y, r * 0.45, "#ffffff", 0.18);
  }
}

function drawProvenanceGrain(
  color: CanvasRenderingContext2D,
  rough: CanvasRenderingContext2D,
  bump: CanvasRenderingContext2D,
  inlay: CanvasRenderingContext2D,
  opts: BrandmarkSurfaceMapOptions,
  size: number,
  strength: number
) {
  for (let i = 0; i < 36; i += 1) {
    const x = hash01(i * 19.7) * size;
    const y = hash01(i * 23.1) * size;
    const radius = size * (0.025 + hash01(i * 5.5) * 0.08);
    arc(color, x, y, radius, opts.secondary, 0.09 * strength, 4);
    arc(rough, x, y, radius, "#e8e8e8", 0.16 * strength, 4);
    arc(bump, x, y, radius, "#dfdfdf", 0.18 * strength, 4);
    if (i % 3 === 0) arc(inlay, x, y, radius, "#ffffff", 0.28, 3);
  }
  for (let y = 0; y < size; y += 9) {
    line(color, 0, y, size, y + Math.sin(y * 0.03) * 6, opts.secondary, 0.035 * strength, 1);
  }
}

function drawDiagonal(
  ctx: CanvasRenderingContext2D,
  color: string,
  size: number,
  alpha: number,
  width: number
) {
  line(ctx, -size * 0.1, size * 0.9, size * 1.1, size * 0.1, color, alpha, width);
}

function drawWave(
  ctx: CanvasRenderingContext2D,
  y: number,
  size: number,
  color: string,
  alpha: number,
  width: number
) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.beginPath();
  for (let x = 0; x <= size; x += 8) {
    const yy = y + Math.sin(x * 0.025 + y * 0.04) * size * 0.035;
    if (x === 0) ctx.moveTo(x, yy);
    else ctx.lineTo(x, yy);
  }
  ctx.stroke();
  ctx.restore();
}

function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  alpha: number,
  width: number
) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function arc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha: number,
  width: number
) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.58, -0.24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function polyline(
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  closed: boolean,
  color: string,
  alpha: number,
  width: number
) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  ctx.beginPath();
  points.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  if (closed) ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function dot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha: number
) {
  ctx.save();
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function rgba(color: string, alpha: number): string {
  const parsed = new THREE.Color(color);
  return `rgba(${Math.round(parsed.r * 255)}, ${Math.round(parsed.g * 255)}, ${Math.round(
    parsed.b * 255
  )}, ${clamp(alpha, 0, 1)})`;
}

function hash01(value: number): number {
  const x = Math.sin(value * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// `clamp` now comes from `@/lib/math` (Phase-5 consolidation, 2026-07-14).
// The local `clamp01` above keeps its own non-finite-guarding variant.

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot(): boolean {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia(REDUCED_MOTION_QUERY).matches
    : false;
}

function getReducedMotionServerSnapshot(): boolean {
  return false;
}
