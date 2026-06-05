"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import { BRANDMARK_FULL_PATHS, BRANDMARK_SHAPE_KEYS } from "@/lib/brandmark/shapes";
import { buildSphereCloudGeometry } from "@/components/landing/v7/intelligence-layer/celestialRingUtils";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { STATION_INTELLIGENCE, getIntelligenceSubstratePresence } from "../sceneGeom";
import { brandmarkCloudVertex, brandmarkCloudFragment } from "../shaders/brandmarkCloud";

/**
 * IntelligenceGate — the world-rigid 3D group at
 * `STATION_INTELLIGENCE` (ADR-018, world-owned rebuild).
 *
 * All children sit in LOCAL coords relative to the gate centre, so the
 * entire intelligence beat can be moved by changing
 * `STATION_INTELLIGENCE.position`.
 *
 * Composition:
 *
 *   - Substrate morph cloud (centre): brandmark shape <-> Fibonacci
 *     sphere morph driven by `getIntelligenceSubstratePresence`.
 *     This is the substrate-cut cover for the projected vector
 *     brandmark (ADR-017 pattern). At landing it IS the substrate
 *     sphere at the heart of the shell.
 *
 * The wrapping dodecahedron cage + solar-system source orbits +
 * outer surfaces skin are NOT mounted here — they arrive via the
 * accreted `BrandmarkAccretionShell`, which co-locates with the
 * substrate sphere at landing (both centred on
 * `STATION_INTELLIGENCE.position + [0,0,0.1]`). The previous
 * holographic grid/panels/streams `BuildArtifact` was removed in
 * the shell-into-corridor pass — the assembled shell IS the climax.
 *
 * Behaviour:
 *   - Substrate morph cloud paints only during the intelligence beat
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

// ── IntelligenceGate — the consolidated gate group ───────────────

export function IntelligenceGate() {
  return (
    <group position={STATION_INTELLIGENCE.position}>
      <SubstrateMorphCloud />
    </group>
  );
}
