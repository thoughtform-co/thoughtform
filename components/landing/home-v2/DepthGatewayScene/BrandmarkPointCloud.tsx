"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import { BRANDMARK_FULL_PATHS, BRANDMARK_SHAPE_KEYS } from "@/lib/brandmark/shapes";
import { buildSphereCloudGeometry } from "@/components/landing/v7/intelligence-layer/celestialRingUtils";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { BRANDMARK_ANCHOR_INTELLIGENCE, getSubstrateMorph } from "./sceneGeom";
import { brandmarkCloudVertex, brandmarkCloudFragment } from "./shaders/brandmarkCloud";

/**
 * BrandmarkPointCloud — substrate morph cover for the home-v2
 * depth corridor (ADR-018, mirrors ADR-017's substrate-cut pattern).
 *
 * Repurposed from the previous "primary brandmark painter" model.
 * The projected vector actor (`ProjectedBrandmarkActor`) owns the
 * crisp brandmark shape throughout the corridor — except during
 * the intelligence beat's substrate morph window, when this point
 * cloud paints the same brandmark silhouette at the same world
 * position and then morphs into the Fibonacci substrate sphere.
 *
 * The cloud is INVISIBLE outside the intelligence beat. Inside it,
 * the cloud:
 *
 *   1. Spawns at the brandmark anchor world position, in the
 *      brandmark shape, at the same on-screen size as the
 *      projected vector actor was at when it cut off.
 *   2. Morphs continuously into a Fibonacci sphere as
 *      `getSubstrateMorph(intelligenceGate)` ramps 0 → 1.
 *   3. Holds the sphere through the read beat.
 *   4. Collapses back into the brandmark shape on the way out.
 *
 * The vector actor reads the same morph channel and CSS-cuts to
 * `display: none` whenever the morph is non-zero — the user sees
 * a single continuous artifact.
 */

const BRANDMARK_VIEWBOX = { x: 0, y: 0, width: 430.99, height: 436 } as const;
const POINT_COUNT = 1900;
const SPHERE_TO_HALF_RATIO = 0.55;

const GOLD_BODY = new THREE.Color("#caa554");
const GOLD_RIM = new THREE.Color("#e9c97a");

/** Local-space half-size of the brandmark plate. Tuned so the
 *  projected on-screen size at the intelligence anchor matches the
 *  v7 `.ilayer__brandmark-anchor` ring. */
const BRANDMARK_LOCAL_HALF = 1.0;

export function BrandmarkPointCloud() {
  const groupRef = useRef<THREE.Group>(null);

  // ── Geometry: brandmark sample + Fibonacci sphere ────────────
  const geometry = useMemo(() => {
    if (typeof document === "undefined") return null;

    const sphereGeom = buildSphereCloudGeometry(1.0, POINT_COUNT);
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
      count: POINT_COUNT,
    });

    const brandmarkAttrib = new Float32Array(POINT_COUNT * 2);
    if (sample.count >= POINT_COUNT) {
      brandmarkAttrib.set(sample.home.subarray(0, POINT_COUNT * 2));
    } else if (sample.count > 0) {
      for (let i = 0; i < POINT_COUNT; i++) {
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
          value: new THREE.Vector2(BRANDMARK_LOCAL_HALF * 2, BRANDMARK_LOCAL_HALF * 2),
        },
        uSphereRadius: { value: BRANDMARK_LOCAL_HALF * SPHERE_TO_HALF_RATIO },
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
    const { active, beat, gateProgress } = transform;

    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPixelRatio.value = state.viewport.dpr;

    if (!active) {
      group.visible = false;
      return;
    }

    // Only paint during the intelligence beat.
    if (beat !== "intelligence") {
      group.visible = false;
      material.uniforms.uPresence.value = 0;
      return;
    }

    group.visible = true;

    // Pin at the intelligence world anchor (same position the
    // projected vector actor was painting at the moment it cut off).
    group.position.set(
      BRANDMARK_ANCHOR_INTELLIGENCE[0],
      BRANDMARK_ANCHOR_INTELLIGENCE[1],
      BRANDMARK_ANCHOR_INTELLIGENCE[2]
    );

    // Shape morph: brandmark → Fibonacci sphere → brandmark.
    const morph = getSubstrateMorph(gateProgress);
    material.uniforms.uShapeMorph.value = morph;

    // Presence ramps to 1 as soon as the substrate morph engages,
    // matching the vector actor's cut threshold. Outside the morph
    // window the cloud is invisible so the vector mark owns the
    // visible artefact.
    const presence = morph > 0.001 ? 1 : 0;
    material.uniforms.uPresence.value = presence;
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef} visible={false}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
