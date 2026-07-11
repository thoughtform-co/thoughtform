"use client";

import { useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
import * as THREE from "three";
import { useDeviceTier } from "@/lib/hooks/useDeviceTier";
import type { GatewayVisualEntry } from "@/lib/gateway-motion/manifest";
import { coverUv, FULLSCREEN_VERT, PARALLAX_FRAG } from "./shaders";
import { SizeSync } from "./SizeSync";
import { useGatewayTextures, type GatewayTextureSet } from "./useGatewayTextures";
import type { PointerLerpRef } from "./usePointerLerp";
import { readProgress, type ScrollProgressRef } from "./useScrollProgressRef";

export interface ParallaxConfig extends Record<string, number> {
  /** Max parallax shift at |depth - focus| = 1, in px at 1080p reference. */
  parallaxPx: number;
  /** Depth value that stays pinned (the artifact body sits ~0.7-0.9). */
  focus: number;
  /** Scroll dolly zoom amount (0.12 → 12% zoom-in at full scroll). */
  dollyZoom: number;
  grain: number;
  shimmer: number;
  /** 0 = off, 1 = time loop, 2 = scroll-driven. */
  sweepMode: number;
  sweepIntensity: number;
  sweepWidth: number;
}

export const PARALLAX_DEFAULTS: ParallaxConfig = {
  parallaxPx: 26,
  focus: 0.35,
  dollyZoom: 0.12,
  grain: 0.055,
  shimmer: 0.35,
  sweepMode: 1,
  sweepIntensity: 0.22,
  sweepWidth: 0.14,
};

/** Origin the dolly zoom + cover crop bias toward (artifact right-of-center). */
const FOCUS_X = 0.68;
const FOCUS_Y = 0.45; // image coords, y-down

const SWEEP_PERIOD_S = 9;
const SWEEP_COLOR = new THREE.Color("#caa554");

function ParallaxQuad({
  entry,
  textures,
  config,
  pointerRef,
  progressRef,
}: {
  entry: GatewayVisualEntry;
  textures: GatewayTextureSet;
  config: ParallaxConfig;
  pointerRef: MutableRefObject<PointerLerpRef>;
  progressRef: MutableRefObject<ScrollProgressRef>;
}) {
  const size = useThree((s) => s.size);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uPlate: { value: null as THREE.Texture | null },
      uDepth: { value: null as THREE.Texture | null },
      uMask: { value: null as THREE.Texture | null },
      uHasMask: { value: 0 },
      uCover: { value: new THREE.Vector4(1, 1, 0, 0) },
      uShift: { value: new THREE.Vector2(0, 0) },
      uFocus: { value: PARALLAX_DEFAULTS.focus },
      uZoom: { value: 1 },
      uOrigin: { value: new THREE.Vector2(FOCUS_X, 1 - FOCUS_Y) },
      uTime: { value: 0 },
      uGrain: { value: PARALLAX_DEFAULTS.grain },
      uSweepPos: { value: -1 },
      uSweepWidth: { value: PARALLAX_DEFAULTS.sweepWidth },
      uSweepColor: { value: SWEEP_COLOR },
      uSweepIntensity: { value: PARALLAX_DEFAULTS.sweepIntensity },
      uShimmer: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms;

    u.uPlate.value = textures.plate;
    u.uDepth.value = textures.depth;
    u.uMask.value = textures.mask;
    u.uHasMask.value = textures.mask ? 1 : 0;

    // Texture uv is y-up (flipY), image-space focus is y-down.
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

    const progress = readProgress(progressRef.current);
    const pointer = pointerRef.current;
    // parallaxPx is specified at 1080p reference height → uv units.
    const shiftUv = (config.parallaxPx * (size.height / 1080)) / size.height;
    u.uShift.value.set(pointer.x * shiftUv, -pointer.y * shiftUv);
    u.uZoom.value = 1 - progress * config.dollyZoom;
    u.uFocus.value = config.focus;
    u.uGrain.value = config.grain;
    u.uShimmer.value = config.shimmer;
    u.uTime.value = state.clock.elapsedTime;
    u.uSweepWidth.value = config.sweepWidth;
    u.uSweepIntensity.value = config.sweepIntensity;
    if (config.sweepMode === 1) {
      // Loop with a rest: band travels far→near over the first 60% of the
      // period, then stays off — an occasional caress, not a strobe.
      const t = (state.clock.elapsedTime % SWEEP_PERIOD_S) / SWEEP_PERIOD_S;
      u.uSweepPos.value = t < 0.6 ? t / 0.6 : -1;
    } else if (config.sweepMode === 2) {
      u.uSweepPos.value = progress;
    } else {
      u.uSweepPos.value = -1;
    }
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={FULLSCREEN_VERT}
        fragmentShader={PARALLAX_FRAG}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Treatment 2 — depth parallax on a fullscreen quad. Pointer steers a
 * small reprojection shift (occlusion-aware in the shader), scroll drives
 * a dolly zoom, plus live grain / interior shimmer / an occasional
 * depth-driven light sweep. Canvas recipe (dpr caps, demand frameloop,
 * context-loss remount) follows DepthGatewayScene.
 */
export function DepthParallaxGateway({
  entry,
  active,
  pointerRef,
  progressRef,
  config = PARALLAX_DEFAULTS,
  showStats = false,
}: {
  entry: GatewayVisualEntry;
  active: boolean;
  pointerRef: MutableRefObject<PointerLerpRef>;
  progressRef: MutableRefObject<ScrollProgressRef>;
  config?: ParallaxConfig;
  showStats?: boolean;
}) {
  const tier = useDeviceTier();
  const isMobile = tier === "mobile";
  const dprCap = isMobile ? 1.4 : 1.75;
  const [glEpoch, setGlEpoch] = useState(0);
  const textures = useGatewayTextures(entry, { depth: true, mask: true }, dprCap);

  if (!textures) return null;

  return (
    <Canvas
      key={`${entry.id}-${glEpoch}`}
      flat
      linear
      dpr={[1, dprCap]}
      frameloop={active ? "always" : "demand"}
      gl={{
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl }) => {
        const canvas = gl.domElement;
        canvas.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
        canvas.addEventListener("webglcontextrestored", () => setGlEpoch((n) => n + 1), false);
      }}
      style={{ position: "absolute", inset: 0, background: "transparent" }}
    >
      <SizeSync />
      <ParallaxQuad
        entry={entry}
        textures={textures}
        config={config}
        pointerRef={pointerRef}
        progressRef={progressRef}
      />
      {showStats ? <Stats /> : null}
    </Canvas>
  );
}
