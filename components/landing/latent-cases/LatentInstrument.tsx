"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { GatewayShape } from "@/lib/particle-config";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { buildLatentInstrumentGeometry, type InstrumentGeometry } from "./instrumentGeometry";
import { LatentPortalContour } from "./LatentPortalContour";

const DEFAULT_PRIMARY = "#d4ccc0";
const DEFAULT_ACCENT = "#caa554";

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
  geometry: InstrumentGeometry;
  shape: GatewayShape;
  density: number;
  tunnelDepth: number;
  tunnelCurve: number;
  tunnelWidth: number;
  primaryColor: string;
  accentColor: string;
}) {
  const dawnOverlayMat = useRef<THREE.PointsMaterial>(null);
  const goldOverlayMat = useRef<THREE.PointsMaterial>(null);

  const gateFade = computeSceneOpacity(scrollProgress, fadeStart, fadeEnd);

  const dawnGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(geometry.dawnPoints, 3));
    return g;
  }, [geometry.dawnPoints]);

  const goldGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(geometry.goldPoints, 3));
    return g;
  }, [geometry.goldPoints]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breath = reduceMotion ? 1 : 0.94 + Math.sin(t * 0.35) * 0.06;
    const scrollBoost = reduceMotion ? 1 : 0.88 + scrollProgress * 0.12;

    const d = dawnOverlayMat.current;
    if (d) d.opacity = 0.35 * gateFade * breath * scrollBoost;

    const g = goldOverlayMat.current;
    if (g) g.opacity = 0.45 * gateFade * breath * scrollBoost;
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

        <points geometry={dawnGeo} frustumCulled={false}>
          <pointsMaterial
            ref={dawnOverlayMat}
            attach="material"
            color={primaryColor}
            size={0.0048}
            sizeAttenuation
            transparent
            depthWrite={false}
            opacity={0.35}
          />
        </points>

        <points geometry={goldGeo} frustumCulled={false}>
          <pointsMaterial
            ref={goldOverlayMat}
            attach="material"
            color={accentColor}
            size={0.006}
            sizeAttenuation
            transparent
            depthWrite={false}
            opacity={0.45}
          />
        </points>
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
 * Latent showcase WebGL: v1 portal particle stack (`LatentPortalContour`) plus a subordinate
 * celestial diagram overlay (orbits, spokes, constellation, gold cross + waypoints).
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
  const geometry = useMemo(() => buildLatentInstrumentGeometry(), []);

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
