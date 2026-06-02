"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import { BRANDMARK_FULL_PATHS, BRANDMARK_SHAPE_KEYS } from "@/lib/brandmark/shapes";
import { createSphereCloudMaterial } from "@/components/landing/v7/intelligence-layer/celestialMaterials";
import {
  buildSphereCloudGeometry,
  buildTiltedRingLineLoop,
} from "@/components/landing/v7/intelligence-layer/celestialRingUtils";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  SIDE_BODY_SCALE,
  STATION_INTELLIGENCE,
  getIntelligenceSideBodyPresence,
  getIntelligenceSubstratePresence,
} from "../sceneGeom";
import { brandmarkCloudVertex, brandmarkCloudFragment } from "../shaders/brandmarkCloud";
import { BuildArtifact } from "../BuildArtifact";

/**
 * IntelligenceGate — the world-rigid 3D group at
 * `STATION_INTELLIGENCE` (ADR-018, world-owned rebuild).
 *
 * Consolidates the previous two-component composition (the side
 * `IntelligenceChamber` + the brandmark `BrandmarkPointCloud`) into
 * one cohesive gate group. All children sit in LOCAL coords relative
 * to the gate centre, so the entire intelligence beat can be moved
 * by changing `STATION_INTELLIGENCE.position`.
 *
 * Composition (paint order, near -> far):
 *
 *   - Substrate morph cloud (centre): brandmark shape <-> Fibonacci
 *     sphere morph driven by `getIntelligenceSubstratePresence`.
 *     This is the substrate-cut cover for the projected vector
 *     brandmark (ADR-017 pattern).
 *   - Left side body: Fibonacci point cloud + tilted ring at
 *     local [-3.0, -0.1, 0.2]. Presence comes from
 *     `getIntelligenceSideBodyPresence` — camera-space depth focus,
 *     so the bodies emerge from distance during late passthrough-02.
 *   - Right side body: mirror of left at [+3.0, -0.1, 0.2].
 *
 * Behaviour:
 *   - Group is hidden when `!active` (corridor not engaged).
 *   - During passthrough-02 + intelligence beats, side bodies fade
 *     in via `getIntelligenceSideBodyPresence` (camera-space depth).
 *   - The substrate morph paints only during the intelligence beat
 *     and its early cross-fade window.
 */

// ── Constants ────────────────────────────────────────────────────

const BRANDMARK_VIEWBOX = { x: 0, y: 0, width: 430.99, height: 436 } as const;
const SUBSTRATE_POINT_COUNT = 1900;
/** World half-extent of the cloud in BRANDMARK FORM (morph = 0).
 *  Matches the DOM brandmark's half-extent at the Intelligence beat
 *  (`BRANDMARK_WORLD_HALF_EXTENT.intelligence = 0.22`) so the
 *  substrate-cut handoff is seamless — the cloud appears at the
 *  same apparent size as the DOM brandmark it replaces. The cloud
 *  then GROWS into the sphere as the shape morph progresses, which
 *  reads as "the brandmark dissolves into the substrate" rather
 *  than "the brandmark suddenly leaps toward the camera". */
const SUBSTRATE_HALF = 0.22;
/** Sphere radius as a multiple of `SUBSTRATE_HALF`. The final
 *  sphere is meant to be substantial at the parked Intelligence
 *  beat, so this ratio (2.5) puts the sphere at 0.55 world radius
 *  — the same final size the cloud used to start with in
 *  brandmark form. The morph now visibly EXPANDS the cloud as the
 *  brandmark silhouette dissolves into the Fibonacci sphere. */
const SUBSTRATE_TO_SPHERE_RATIO = 2.5;

const GOLD_BODY = new THREE.Color("#caa554");
const GOLD_RIM = new THREE.Color("#e9c97a");

const DEG = Math.PI / 180;
const SIDE_RING_TILT_LEFT: [number, number, number] = [16 * DEG, 0, 8 * DEG];
const SIDE_RING_TILT_RIGHT: [number, number, number] = [16 * DEG, 0, -8 * DEG];
const SIDE_RING_RADIUS = 0.62;
const SIDE_SPHERE_RADIUS = 0.46;
const SIDE_SPHERE_POINT_COUNT = 1100;

/** Side body local positions relative to the gate centre. */
const LEFT_BODY_LOCAL: [number, number, number] = [-3.0, -0.1, 0.2];
const RIGHT_BODY_LOCAL: [number, number, number] = [3.0, -0.1, 0.2];

/** Substrate morph cloud local position relative to the gate centre.
 *  Sits slightly in front of Z=0 so it composites above any background
 *  geometry at the same station. */
const SUBSTRATE_LOCAL: [number, number, number] = [0, 0, 0.1];

// ── Substrate morph cloud (was BrandmarkPointCloud) ──────────────

function SubstrateMorphCloud() {
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    if (typeof document === "undefined") return null;

    const sphereGeom = buildSphereCloudGeometry(1.0, SUBSTRATE_POINT_COUNT);
    const spherePos = sphereGeom.getAttribute("position") as THREE.BufferAttribute | undefined;
    const sphereNormal = sphereGeom.getAttribute("aNormal") as THREE.BufferAttribute | undefined;
    const sphereSeeds = sphereGeom.getAttribute("aSeed") as THREE.BufferAttribute | undefined;
    if (!spherePos || !sphereNormal || !sphereSeeds) {
      sphereGeom.dispose();
      return null;
    }

    const sample = sampleShape({
      shapeKey: BRANDMARK_SHAPE_KEYS.full,
      paths: BRANDMARK_FULL_PATHS,
      viewBox: BRANDMARK_VIEWBOX,
      count: SUBSTRATE_POINT_COUNT,
    });

    const brandmarkAttrib = new Float32Array(SUBSTRATE_POINT_COUNT * 2);
    if (sample.count >= SUBSTRATE_POINT_COUNT) {
      brandmarkAttrib.set(sample.home.subarray(0, SUBSTRATE_POINT_COUNT * 2));
    } else if (sample.count > 0) {
      for (let i = 0; i < SUBSTRATE_POINT_COUNT; i++) {
        const src = i % sample.count;
        brandmarkAttrib[i * 2] = sample.home[src * 2];
        brandmarkAttrib[i * 2 + 1] = sample.home[src * 2 + 1];
      }
    } else {
      brandmarkAttrib.fill(0);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", spherePos.clone());
    geom.setAttribute("aHomeBrandmark", new THREE.BufferAttribute(brandmarkAttrib, 2));
    geom.setAttribute("aHomeSphere", spherePos.clone());
    geom.setAttribute("aSphereNormal", sphereNormal.clone());
    geom.setAttribute("aSeed", sphereSeeds.clone());

    sphereGeom.dispose();
    return geom;
  }, []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: brandmarkCloudVertex,
      fragmentShader: brandmarkCloudFragment,
      uniforms: {
        uTime: { value: 0 },
        uPointSize: { value: 6.0 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uPresence: { value: 0 },
        uShapeMorph: { value: 0 },
        uBrandmarkSize: {
          value: new THREE.Vector2(SUBSTRATE_HALF * 2, SUBSTRATE_HALF * 2),
        },
        uSphereRadius: { value: SUBSTRATE_HALF * SUBSTRATE_TO_SPHERE_RATIO },
        uColor: { value: GOLD_BODY.clone() },
        uRimColor: { value: GOLD_RIM.clone() },
        uOpacity: { value: 0.95 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useEffect(() => {
    return () => {
      material.dispose();
      geometry?.dispose();
    };
  }, [material, geometry]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    const transform = useDepthGatewayStore.getState().transform;
    const { active } = transform;

    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPixelRatio.value = state.viewport.dpr;

    if (!active) {
      group.visible = false;
      material.uniforms.uPresence.value = 0;
      return;
    }

    // Depth-aware substrate emergence (Star Atlas-style depth focus,
    // see ADR-018 2026-05-24 revision). `getIntelligenceSubstratePresence`
    // combines:
    //   - a capped depth-based approach during late `passthrough-02`
    //     (cloud emerges from distance in brandmark form, painting
    //      a faint particle bloom beyond the DOM lead brandmark), and
    //   - the existing morph envelope during the intelligence beat
    //     (cloud blooms into Fibonacci sphere, then collapses back).
    // This removes the beat-boundary pop at progress 0.72 where the
    // substrate previously appeared instead of emerging from depth.
    const { presence, morph } = getIntelligenceSubstratePresence(transform);
    if (presence <= 0.001) {
      group.visible = false;
      material.uniforms.uPresence.value = 0;
      return;
    }

    group.visible = true;
    material.uniforms.uShapeMorph.value = morph;
    material.uniforms.uPresence.value = presence;
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef} position={SUBSTRATE_LOCAL} visible={false}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}

// ── Side body (left + right Fibonacci-sphere clouds) ─────────────

interface SideBodyProps {
  id: "left" | "right";
  localPosition: readonly [number, number, number];
  ringTilt: readonly [number, number, number];
}

function SideBody({ id, localPosition, ringTilt }: SideBodyProps) {
  const groupRef = useRef<THREE.Group>(null);

  const cloudGeom = useMemo(
    () => buildSphereCloudGeometry(SIDE_SPHERE_RADIUS, SIDE_SPHERE_POINT_COUNT),
    []
  );
  const cloudMat = useMemo(
    () =>
      createSphereCloudMaterial(new THREE.Color("#ebe3d6"), new THREE.Color("#f3ecdb"), 0.78, 3.6),
    []
  );
  const ringGeom = useMemo(() => buildTiltedRingLineLoop(SIDE_RING_RADIUS, ringTilt), [ringTilt]);
  const ringMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#caa554"),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    return () => {
      cloudGeom.dispose();
      cloudMat.dispose();
      ringGeom.dispose();
      ringMat.dispose();
    };
  }, [cloudGeom, cloudMat, ringGeom, ringMat]);

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;
    const transform = useDepthGatewayStore.getState().transform;
    const { active } = transform;

    if (!active) {
      group.visible = false;
      return;
    }
    group.visible = true;

    const t = state.clock.elapsedTime;
    group.rotation.y = t * 0.03 * (id === "left" ? -1 : 1);

    // Depth-driven side-body presence: the constellation flanks
    // start to register in late `passthrough-02` as the camera
    // closes in on the Intelligence station, and resolve fully
    // through the intelligence beat.
    const opacity = getIntelligenceSideBodyPresence(transform);
    cloudMat.uniforms.uPresence.value = opacity;
    cloudMat.uniforms.uTime.value = t;
    cloudMat.uniforms.uPixelRatio.value = state.viewport.dpr;
    ringMat.opacity = opacity * 0.5;
  });

  return (
    <group ref={groupRef} position={localPosition} scale={SIDE_BODY_SCALE}>
      <points geometry={cloudGeom} material={cloudMat} />
      <lineLoop geometry={ringGeom} material={ringMat} />
    </group>
  );
}

// ── IntelligenceGate — the consolidated gate group ───────────────

export function IntelligenceGate() {
  return (
    <group position={STATION_INTELLIGENCE.position}>
      <SubstrateMorphCloud />
      <BuildArtifact />
      <SideBody id="left" localPosition={LEFT_BODY_LOCAL} ringTilt={SIDE_RING_TILT_LEFT} />
      <SideBody id="right" localPosition={RIGHT_BODY_LOCAL} ringTilt={SIDE_RING_TILT_RIGHT} />
    </group>
  );
}
