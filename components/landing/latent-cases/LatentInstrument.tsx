"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { GatewayShape } from "@/lib/particle-config";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import {
  buildCelestialWeave,
  type CelestialWeaveGeometry,
  type CelestialZoneGeometry,
} from "./celestialGatewayGeometry";
import { LatentPortalContour } from "./LatentPortalContour";

const DEFAULT_PRIMARY = "#d4ccc0";
const DEFAULT_ACCENT = "#caa554";

/** Threads the celestial weave through the deeper corridor: sits inside the
 *  `TunnelDepthRings` (`scale.z = 14 * tunnelDepth`) so the bearing ticks /
 *  data bands / register frames pass the camera as it dollies through,
 *  exposing the tunnel walls as architecture not foreground. */
const WEAVE_Z_SCALE = 12;

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

interface ZoneGeometries {
  /** Null when the zone's dawn buffer is empty (zero vertices) — three.js
   *  WebGLAttributes throws if we render a `<points>` with a 0-length
   *  BufferAttribute, especially across hot-reloads. */
  dawnGeo: THREE.BufferGeometry | null;
  goldGeo: THREE.BufferGeometry | null;
}

function makeZoneGeometries(zone: CelestialZoneGeometry): ZoneGeometries {
  let dawnGeo: THREE.BufferGeometry | null = null;
  let goldGeo: THREE.BufferGeometry | null = null;
  if (zone.dawnPoints.length > 0) {
    dawnGeo = new THREE.BufferGeometry();
    dawnGeo.setAttribute("position", new THREE.BufferAttribute(zone.dawnPoints, 3));
  }
  if (zone.goldPoints.length > 0) {
    goldGeo = new THREE.BufferGeometry();
    goldGeo.setAttribute("position", new THREE.BufferAttribute(zone.goldPoints, 3));
  }
  return { dawnGeo, goldGeo };
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
  const outerDawnMat = useRef<THREE.PointsMaterial>(null);
  const outerGoldMat = useRef<THREE.PointsMaterial>(null);
  const dataDawnMat = useRef<THREE.PointsMaterial>(null);
  const codeDawnMat = useRef<THREE.PointsMaterial>(null);
  const codeGoldMat = useRef<THREE.PointsMaterial>(null);
  const celestialDawnMat = useRef<THREE.PointsMaterial>(null);
  const celestialGoldMat = useRef<THREE.PointsMaterial>(null);
  const topologyDawnMat = useRef<THREE.PointsMaterial>(null);

  const dataGroupRef = useRef<THREE.Group>(null);
  const codeGroupRef = useRef<THREE.Group>(null);
  const celestialGroupRef = useRef<THREE.Group>(null);

  const gateFade = computeSceneOpacity(scrollProgress, fadeStart, fadeEnd);

  const outer = useMemo(() => makeZoneGeometries(geometry.outer), [geometry.outer]);
  const data = useMemo(() => makeZoneGeometries(geometry.data), [geometry.data]);
  const code = useMemo(() => makeZoneGeometries(geometry.code), [geometry.code]);
  const celestial = useMemo(() => makeZoneGeometries(geometry.celestial), [geometry.celestial]);
  const topology = useMemo(() => makeZoneGeometries(geometry.topology), [geometry.topology]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const breath = reduceMotion ? 1 : 0.94 + Math.sin(t * 0.35) * 0.06;
    const scrollBoost = reduceMotion ? 1 : 0.9 + scrollProgress * 0.1;
    const baseFade = gateFade * breath * scrollBoost * density;

    // Outer field — locked silhouette context.
    if (outerDawnMat.current) outerDawnMat.current.opacity = 0.92 * baseFade;
    if (outerGoldMat.current) outerGoldMat.current.opacity = 1.0 * baseFade;

    // Data ring — slow CW (binary scroll feel), low opacity, smallest dots.
    if (dataDawnMat.current) dataDawnMat.current.opacity = 0.5 * baseFade;
    if (dataGroupRef.current) {
      dataGroupRef.current.rotation.z = reduceMotion ? 0 : t * -0.012;
    }

    // Code ring — medium CCW, brighter for instrument anchors.
    if (codeDawnMat.current) codeDawnMat.current.opacity = 0.7 * baseFade;
    if (codeGoldMat.current) codeGoldMat.current.opacity = 0.85 * baseFade;
    if (codeGroupRef.current) {
      codeGroupRef.current.rotation.z = reduceMotion ? 0 : t * 0.025;
    }

    // Celestial ring — slowest, drifts CCW.
    if (celestialDawnMat.current) celestialDawnMat.current.opacity = 0.62 * baseFade;
    if (celestialGoldMat.current) celestialGoldMat.current.opacity = 0.78 * baseFade;
    if (celestialGroupRef.current) {
      celestialGroupRef.current.rotation.z = reduceMotion ? 0 : t * 0.008;
    }

    // Topology — wall rails + floor + gate frames stay locked (architecture).
    if (topologyDawnMat.current) topologyDawnMat.current.opacity = 0.55 * baseFade;
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
          reduceMotion={reduceMotion}
        />

        {/* Outer celestial field — co-planar with mouth, locked. */}
        {outer.dawnGeo && (
          <points geometry={outer.dawnGeo} frustumCulled={false}>
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
        )}
        {outer.goldGeo && (
          <points geometry={outer.goldGeo} frustumCulled={false}>
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
        )}

        {/* Inner zones — stretched along the tunnel via scale.z. */}
        <group scale={[1, 1, WEAVE_Z_SCALE * tunnelDepth]}>
          {/* Topology: wall rails, topographic floor, rectangular depth gates.
              Architecture stays locked so the corridor feels structural. */}
          {topology.dawnGeo && (
            <points geometry={topology.dawnGeo} frustumCulled={false}>
              <pointsMaterial
                ref={topologyDawnMat}
                attach="material"
                color={primaryColor}
                size={0.0042}
                sizeAttenuation
                transparent
                depthWrite={false}
                opacity={0.55}
              />
            </points>
          )}

          {/* Data ring — slow CW. */}
          <group ref={dataGroupRef}>
            {data.dawnGeo && (
              <points geometry={data.dawnGeo} frustumCulled={false}>
                <pointsMaterial
                  ref={dataDawnMat}
                  attach="material"
                  color={primaryColor}
                  size={0.004}
                  sizeAttenuation
                  transparent
                  depthWrite={false}
                  opacity={0.5}
                />
              </points>
            )}
          </group>

          {/* Code ring — medium CCW. */}
          <group ref={codeGroupRef}>
            {code.dawnGeo && (
              <points geometry={code.dawnGeo} frustumCulled={false}>
                <pointsMaterial
                  ref={codeDawnMat}
                  attach="material"
                  color={primaryColor}
                  size={0.0058}
                  sizeAttenuation
                  transparent
                  depthWrite={false}
                  opacity={0.7}
                />
              </points>
            )}
            {code.goldGeo && (
              <points geometry={code.goldGeo} frustumCulled={false}>
                <pointsMaterial
                  ref={codeGoldMat}
                  attach="material"
                  color={accentColor}
                  size={0.0072}
                  sizeAttenuation
                  transparent
                  depthWrite={false}
                  opacity={0.85}
                />
              </points>
            )}
          </group>

          {/* Celestial ring — slowest CCW drift. */}
          <group ref={celestialGroupRef}>
            {celestial.dawnGeo && (
              <points geometry={celestial.dawnGeo} frustumCulled={false}>
                <pointsMaterial
                  ref={celestialDawnMat}
                  attach="material"
                  color={primaryColor}
                  size={0.005}
                  sizeAttenuation
                  transparent
                  depthWrite={false}
                  opacity={0.62}
                />
              </points>
            )}
            {celestial.goldGeo && (
              <points geometry={celestial.goldGeo} frustumCulled={false}>
                <pointsMaterial
                  ref={celestialGoldMat}
                  attach="material"
                  color={accentColor}
                  size={0.0072}
                  sizeAttenuation
                  transparent
                  depthWrite={false}
                  opacity={0.78}
                />
              </points>
            )}
          </group>
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
 * (`LatentPortalContour`) interwoven with five differentiated celestial
 * zones (outer field, data ring, code ring, celestial ring, topology) each
 * rendered with its own material and rotation rate so the gate reads as a
 * retrofuturistic navigation instrument with visible architecture, not as
 * a mandala.
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
