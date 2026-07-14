"use client";

import { useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
import * as THREE from "three";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import type { GatewayVisualEntry } from "@/lib/gateway-motion/manifest";
import { coverUv, MESH_FRAG, MESH_VERT } from "./shaders";
import { SizeSync } from "./SizeSync";
import { useGatewayTextures, type GatewayTextureSet } from "./useGatewayTextures";
import type { PointerLerpRef } from "./usePointerLerp";
import { readProgress, type ScrollProgressRef } from "./useScrollProgressRef";

export interface MeshConfig extends Record<string, number> {
  /** Relief depth in world units (plane height is ~2 * tan(fov/2) * camZ). */
  relief: number;
  /** Depth pivot that stays in the plane (background pushes back from it). */
  focus: number;
  /** Max orbit angle from pointer, degrees. */
  orbitDeg: number;
  /** Scroll dolly travel as a fraction of the camera distance. */
  dolly: number;
  /** Border displacement fade (uv units) — prevents silhouette tearing. */
  edgeFade: number;
  grain: number;
  /** Distance of the background plate behind the relief plane. */
  bgDistance: number;
}

export const MESH_DEFAULTS: MeshConfig = {
  // Relief + orbit deliberately calm: past ~0.7 relief the silhouette
  // starts taffy-stretching at steep depth edges (verified on gateway-v1).
  relief: 0.55,
  focus: 0.35,
  orbitDeg: 2.0,
  dolly: 0.12,
  edgeFade: 0.08,
  grain: 0.055,
  bgDistance: 1.6,
};

const FOCUS_X = 0.68;
const FOCUS_Y = 0.45; // image coords, y-down
const CAM_Z = 4;
const FOV = 32;

function ReliefScene({
  entry,
  textures,
  config,
  pointerRef,
  progressRef,
  segments,
}: {
  entry: GatewayVisualEntry;
  textures: GatewayTextureSet;
  config: MeshConfig;
  pointerRef: MutableRefObject<PointerLerpRef>;
  progressRef: MutableRefObject<ScrollProgressRef>;
  segments: [number, number];
}) {
  const size = useThree((s) => s.size);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const bgRef = useRef<THREE.Mesh>(null);

  // Plane sized to fill the view at z=0 from CAM_Z, with overscan so the
  // border never peeks in during orbit; background plane scaled for its
  // own depth so it also always covers.
  const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * CAM_Z;
  const aspect = size.width / Math.max(1, size.height);
  const overscan = 1.08;
  const planeH = viewH * overscan;
  const planeW = viewH * aspect * overscan;
  const bgScale = (CAM_Z + config.bgDistance) / CAM_Z + 0.06;

  const uniforms = useMemo(
    () => ({
      uPlate: { value: null as THREE.Texture | null },
      uDepth: { value: null as THREE.Texture | null },
      uCover: { value: new THREE.Vector4(1, 1, 0, 0) },
      uRelief: { value: MESH_DEFAULTS.relief },
      uFocus: { value: MESH_DEFAULTS.focus },
      uEdgeFade: { value: MESH_DEFAULTS.edgeFade },
      uTime: { value: 0 },
      uGrain: { value: MESH_DEFAULTS.grain },
    }),
    []
  );

  useFrame((state) => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms;
    u.uPlate.value = textures.plate;
    u.uDepth.value = textures.depth;
    u.uCover.value.fromArray(
      coverUv(
        size.width,
        size.height,
        entry.source.width,
        entry.source.height,
        FOCUS_X,
        1 - FOCUS_Y
      )
    );
    u.uRelief.value = config.relief;
    u.uFocus.value = config.focus;
    u.uEdgeFade.value = config.edgeFade;
    u.uGrain.value = config.grain;
    u.uTime.value = state.clock.elapsedTime;

    // Micro-orbit from the (already lerped) pointer + scroll dolly-in.
    const progress = readProgress(progressRef.current);
    const pointer = pointerRef.current;
    const maxRad = THREE.MathUtils.degToRad(config.orbitDeg);
    const yaw = pointer.x * maxRad;
    const pitch = -pointer.y * maxRad * 0.7;
    const dist = CAM_Z * (1 - progress * config.dolly);
    const cam = state.camera;
    cam.position.set(Math.sin(yaw) * dist, Math.sin(pitch) * dist, Math.cos(yaw) * dist);
    cam.lookAt(0, 0, 0);
  });

  return (
    <>
      {/* Cleaned background plate — revealed at silhouette edges during orbit. */}
      {textures.background ? (
        <mesh ref={bgRef} position={[0, 0, -config.bgDistance]} scale={[bgScale, bgScale, 1]}>
          <planeGeometry args={[planeW, planeH]} />
          <meshBasicMaterial map={textures.background} toneMapped={false} />
        </mesh>
      ) : null}
      <mesh frustumCulled={false}>
        <planeGeometry args={[planeW, planeH, segments[0], segments[1]]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={MESH_VERT}
          fragmentShader={MESH_FRAG}
          uniforms={uniforms}
        />
      </mesh>
    </>
  );
}

/**
 * Treatment 3 — the plate as true 2.5D relief: a subdivided plane
 * vertex-displaced by the depth master, micro-orbited by the pointer and
 * dollied by scroll, with the inpainted background plate behind it so
 * revealed edges show void instead of stretching. This is "convert to 3D"
 * without leaving the image domain (generative image→3D was rejected —
 * it melts the greeble fidelity the plates live on).
 */
export function DepthMeshGateway({
  entry,
  active,
  pointerRef,
  progressRef,
  config = MESH_DEFAULTS,
  showStats = false,
}: {
  entry: GatewayVisualEntry;
  active: boolean;
  pointerRef: MutableRefObject<PointerLerpRef>;
  progressRef: MutableRefObject<ScrollProgressRef>;
  config?: MeshConfig;
  showStats?: boolean;
}) {
  const tier = useDeviceTier();
  const isMobile = tier === "mobile";
  const dprCap = isMobile ? 1.4 : 1.75;
  const segments: [number, number] = isMobile ? [192, 108] : [320, 180];
  const [glEpoch, setGlEpoch] = useState(0);
  const textures = useGatewayTextures(entry, { depth: true, background: true }, dprCap);

  if (!textures) return null;

  return (
    <Canvas
      key={`${entry.id}-${glEpoch}`}
      flat
      linear
      dpr={[1, dprCap]}
      frameloop={active ? "always" : "demand"}
      camera={{ fov: FOV, near: 0.1, far: 20, position: [0, 0, CAM_Z] }}
      gl={{
        alpha: true,
        antialias: !isMobile,
        powerPreference: "low-power",
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;
        // Element-lifetime listeners (intentionally no removal): the canvas
        // and these handlers are discarded together when `key={glEpoch}`
        // remounts <Canvas>; no global target to unhook.
        canvas.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
        canvas.addEventListener("webglcontextrestored", () => setGlEpoch((n) => n + 1), false);
      }}
      style={{ position: "absolute", inset: 0, background: "transparent" }}
    >
      <SizeSync />
      <ReliefScene
        entry={entry}
        textures={textures}
        config={config}
        pointerRef={pointerRef}
        progressRef={progressRef}
        segments={segments}
      />
      {showStats ? <Stats /> : null}
    </Canvas>
  );
}
