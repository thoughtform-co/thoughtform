"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { GatewayShape } from "@/lib/particle-config";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { buildCelestialWeave, type CelestialWeaveGeometry } from "./celestialGatewayGeometry";
import { LatentPortalContour } from "./LatentPortalContour";

const DEFAULT_PRIMARY = "#d4ccc0";
const DEFAULT_ACCENT = "#caa554";

/** Match `InteriorFill`'s `scale.z = 7 * tunnelDepth` so the weave threads
 * through the same tunnel depth as the portal interior, just inside the
 * deepest receding ring (which uses `scale.z = 8 * tunnelDepth`). */
const WEAVE_Z_SCALE = 7;

function computeSceneOpacity(scrollProgress: number, fadeStart: number, fadeEnd: number): number {
  if (scrollProgress <= fadeStart) return 1;
  if (scrollProgress >= fadeEnd) return 0;
  return 1 - (scrollProgress - fadeStart) / (fadeEnd - fadeStart);
}

function InstrumentCamera({
  scrollProgress,
  cameraZMax,
  lookAhead,
}: {
  scrollProgress: number;
  cameraZMax: number;
  lookAhead: number;
}) {
  const { camera } = useThree();
  useFrame(() => {
    const z = scrollProgress * cameraZMax;
    camera.position.set(0, 0, z);
    camera.lookAt(0, 0, z + lookAhead);
  });
  return null;
}

function InstrumentScene({
  scrollProgress,
  fadeStart,
  fadeEnd,
  cameraZMax,
  lookAhead,
  reduceMotion,
  geometry,
  shape,
  density,
  tunnelDepth,
  tunnelCurve,
  tunnelWidth,
  primaryColor,
  accentColor,
}: {
  scrollProgress: number;
  fadeStart: number;
  fadeEnd: number;
  cameraZMax: number;
  lookAhead: number;
  reduceMotion: boolean;
  geometry: CelestialWeaveGeometry;
  shape: GatewayShape;
  density: number;
  tunnelDepth: number;
  tunnelCurve: number;
  tunnelWidth: number;
  primaryColor: string;
  accentColor: string;
}) {
  const innerDawnMat = useRef<THREE.PointsMaterial>(null);
  const innerGoldMat = useRef<THREE.PointsMaterial>(null);
  const outerDawnMat = useRef<THREE.PointsMaterial>(null);
  const outerGoldMat = useRef<THREE.PointsMaterial>(null);

  const gateFade = computeSceneOpacity(scrollProgress, fadeStart, fadeEnd);

  const innerDawnGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(geometry.inner.dawnPoints, 3));
    return g;
  }, [geometry.inner.dawnPoints]);

  const innerGoldGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(geometry.inner.goldPoints, 3));
    return g;
  }, [geometry.inner.goldPoints]);

  const outerDawnGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(geometry.outer.dawnPoints, 3));
    return g;
  }, [geometry.outer.dawnPoints]);

  const outerGoldGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(geometry.outer.goldPoints, 3));
    return g;
  }, [geometry.outer.goldPoints]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breath = reduceMotion ? 1 : 0.94 + Math.sin(t * 0.35) * 0.06;
    const scrollBoost = reduceMotion ? 1 : 0.9 + scrollProgress * 0.1;

    const id = innerDawnMat.current;
    if (id) id.opacity = 0.6 * gateFade * breath * scrollBoost * density;
    const ig = innerGoldMat.current;
    if (ig) ig.opacity = 0.78 * gateFade * breath * scrollBoost * density;

    const od = outerDawnMat.current;
    if (od) od.opacity = 0.92 * gateFade * breath * scrollBoost * density;
    const og = outerGoldMat.current;
    if (og) og.opacity = 1.0 * gateFade * breath * scrollBoost * density;
  });

  return (
    <>
      <InstrumentCamera
        scrollProgress={scrollProgress}
        cameraZMax={cameraZMax}
        lookAhead={lookAhead}
      />
      <group position={[0, 0, 4]} scale={1}>
        <LatentPortalContour
          shape={shape}
          opacity={gateFade}
          density={density}
          tunnelDepth={tunnelDepth}
          tunnelCurve={tunnelCurve}
          tunnelWidth={tunnelWidth}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />

        {/* Outer celestial field — co-planar with the mouth (no z-stretch).
            Larger/brighter material so it reads as the gateway's surrounding
            instrument, visible through any parallax reveal. */}
        <points geometry={outerDawnGeo} frustumCulled={false}>
          <pointsMaterial
            ref={outerDawnMat}
            attach="material"
            color={primaryColor}
            size={0.009}
            sizeAttenuation
            transparent
            depthWrite={false}
            opacity={0.92}
          />
        </points>

        <points geometry={outerGoldGeo} frustumCulled={false}>
          <pointsMaterial
            ref={outerGoldMat}
            attach="material"
            color={accentColor}
            size={0.0115}
            sizeAttenuation
            transparent
            depthWrite={false}
            opacity={1}
          />
        </points>

        {/* Inner woven instrument — stretched along the tunnel via scale.z. */}
        <group scale={[1, 1, WEAVE_Z_SCALE * tunnelDepth]}>
          <points geometry={innerDawnGeo} frustumCulled={false}>
            <pointsMaterial
              ref={innerDawnMat}
              attach="material"
              color={primaryColor}
              size={0.0055}
              sizeAttenuation
              transparent
              depthWrite={false}
              opacity={0.6}
            />
          </points>

          <points geometry={innerGoldGeo} frustumCulled={false}>
            <pointsMaterial
              ref={innerGoldMat}
              attach="material"
              color={accentColor}
              size={0.0072}
              sizeAttenuation
              transparent
              depthWrite={false}
              opacity={0.78}
            />
          </points>
        </group>
      </group>
    </>
  );
}

export interface LatentInstrumentProps {
  /** 0..1 wormhole travel */
  scrollProgress: number;
  reduceMotion: boolean;
  fadeStart?: number;
  fadeEnd?: number;
  cameraZMax?: number;
  lookAhead?: number;
  layerZIndex?: number;
  /** Portal contour — same union as hero `ThreeGateway` (non-attractor uses geometric outline) */
  shape?: GatewayShape;
  density?: number;
  tunnelDepth?: number;
  tunnelCurve?: number;
  tunnelWidth?: number;
  primaryColor?: string;
  accentColor?: string;
}

/**
 * Latent showcase WebGL instrument: v1 portal particle stack
 * (`LatentPortalContour`) interwoven with a celestial weave
 * (`celestialGatewayGeometry`) that anchors bearing ticks, register frames,
 * cardinal crosses, ecliptic orbits, radial spokes, constellation, and
 * waypoint diamonds across the same tunnel depth.
 */
export function LatentInstrument({
  scrollProgress,
  reduceMotion,
  fadeStart = 0.76,
  fadeEnd = 0.995,
  cameraZMax = 52,
  lookAhead = 11,
  layerZIndex = 1,
  shape = "diamond",
  density = 1.0,
  tunnelDepth = 1.1,
  tunnelCurve = 0,
  tunnelWidth = 1.0,
  primaryColor = DEFAULT_PRIMARY,
  accentColor = DEFAULT_ACCENT,
}: LatentInstrumentProps) {
  const isMobile = useIsMobile();
  const scroll = Math.max(0, Math.min(1, scrollProgress));
  const geometry = useMemo(() => buildCelestialWeave(shape), [shape]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: layerZIndex,
        pointerEvents: "none",
        width: "100%",
        height: "100%",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 0], fov: 60 }}
        gl={{
          antialias: !isMobile,
          alpha: true,
          powerPreference: isMobile ? "low-power" : "default",
        }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
        dpr={isMobile ? 1 : undefined}
      >
        <InstrumentScene
          scrollProgress={scroll}
          fadeStart={fadeStart}
          fadeEnd={fadeEnd}
          cameraZMax={cameraZMax}
          lookAhead={lookAhead}
          reduceMotion={reduceMotion}
          geometry={geometry}
          shape={shape}
          density={density}
          tunnelDepth={tunnelDepth}
          tunnelCurve={tunnelCurve}
          tunnelWidth={tunnelWidth}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />
      </Canvas>
    </div>
  );
}
