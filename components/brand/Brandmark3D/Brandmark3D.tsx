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

  // ── Solid material ────────────────────────────────────────────
  const solidMaterial = useMemo<THREE.Material | null>(() => {
    const clippingProps = cutawayEnabled
      ? { clippingPlanes: [solidPlane], clipShadows: false }
      : {};
    if (materialMode === "transmission") return null;
    if (materialMode === "physical") {
      return new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(physColor),
        metalness: physMetalness,
        roughness: physRoughness,
        clearcoat: physClearcoat,
        clearcoatRoughness: physClearcoatRoughness,
        iridescence: physIridescence,
        envMapIntensity: physEnvIntensity,
        ...clippingProps,
        side: THREE.DoubleSide,
      });
    }
    const tex = matcapTexture ?? proceduralMatcap ?? null;
    return new THREE.MeshMatcapMaterial({
      matcap: tex,
      flatShading: false,
      toneMapped: false,
      transparent: false,
      ...clippingProps,
    });
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
    cutawayEnabled,
    solidPlane,
  ]);

  useEffect(() => {
    return () => {
      solidMaterial?.dispose();
    };
  }, [solidMaterial]);

  // ── Wireframe material ────────────────────────────────────────
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
      {materialMode === "transmission" ? (
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
            {...(cutawayEnabled ? { clippingPlanes: [solidPlane], clipShadows: false } : {})}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : solidMaterial ? (
        <mesh geometry={geometry} material={solidMaterial} />
      ) : null}
      {showWire && wireGeometry ? (
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
