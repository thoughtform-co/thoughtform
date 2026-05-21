"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import { BRANDMARK_FULL_PATHS, BRANDMARK_SHAPE_KEYS } from "@/lib/brandmark/shapes";
import { buildSphereCloudGeometry } from "@/components/landing/v7/intelligence-layer/celestialRingUtils";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  getBrandmarkWorldHalfSize,
  getBrandmarkWorldPosition,
  getSubstrateMorph,
} from "./sceneGeom";
import { brandmarkCloudVertex, brandmarkCloudFragment } from "./shaders/brandmarkCloud";

/** Brandmark SVG viewBox — must match `public/logos/Thoughtform_Brandmark.svg`. */
const BRANDMARK_VIEWBOX = { x: 0, y: 0, width: 430.99, height: 436 } as const;

/** Total point count. Matches the production substrate cloud (1900)
 *  so the morph from brandmark → sphere reads at the same density
 *  as the production triad. */
const POINT_COUNT = 1900;

/** Sphere radius as a multiplier on the brandmark half-size at the
 *  current station. < 1 keeps the morphed sphere inside the
 *  brandmark plate's footprint while preserving enough girth to
 *  read as a 3D shell. */
const SPHERE_TO_HALF_RATIO = 0.55;

const GOLD_BODY = new THREE.Color("#caa554");
const GOLD_RIM = new THREE.Color("#e9c97a");

/**
 * BrandmarkPointCloud — one persistent point cloud that lives in
 * the scene for all three chambers of the home-v2 depth gateway.
 *
 * STABLE TRAVELING ARTIFACT MODEL (revised). The cloud no longer
 * un-projects DOM dock rects — it sits at a world-space station
 * and the camera dollies toward it across stage progress. Two
 * stations:
 *
 *   - Station A (chamber A — Definition): off-centre right, matches
 *     v7 `.sigil__mark` placement inside the .tri compass diagram.
 *   - Station B (chambers B + C — Diagnostic / Intelligence):
 *     viewport centre, matches v7 `.miss__brand-slot` and
 *     `.ilayer__brandmark-anchor` placement.
 *
 * Cloud world position lerps smoothly from A → B across the
 * sequenced chamber dead-band (progress 0.30..0.50) so the
 * brandmark visibly TRAVELS between stations during the
 * cross-fade, rather than teleporting via DOM dock changes.
 *
 * The cloud is visible CONTINUOUSLY from chamber A entry through
 * chamber C end — no fade between sections. As the camera dollies
 * forward (z=8 → z=3), the cloud naturally grows on screen,
 * conveying "we are approaching the artifact" travel motion.
 *
 * Shape morph (sigil → Fibonacci sphere) gated by chamber C
 * progress only.
 */
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

  // ── Material with the shape-morph shader ─────────────────────
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: brandmarkCloudVertex,
      fragmentShader: brandmarkCloudFragment,
      uniforms: {
        uTime: { value: 0 },
        uPointSize: { value: 6.0 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uPresence: { value: 1 },
        uShapeMorph: { value: 0 },
        uBrandmarkSize: { value: new THREE.Vector2(1.1, 1.1) },
        uSphereRadius: { value: 0.6 },
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

  // ── Per-frame: position + size + morph ───────────────────────
  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    const transform = useDepthGatewayStore.getState().transform;
    const { progress, chamberC, active } = transform;

    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPixelRatio.value = state.viewport.dpr;

    if (!active) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Position group at the interpolated station — A → B across
    // the cross-station glide window.
    const [px, py, pz] = getBrandmarkWorldPosition(progress);
    group.position.set(px, py, pz);

    // Brandmark plate world half-size (XY extent). The shader's
    // `aHomeBrandmark` lives in [-0.5, 0.5]; multiplying by 2×halfSize
    // expands the local range to [-halfSize, +halfSize] in world units.
    const halfSize = getBrandmarkWorldHalfSize(progress);
    const sz = material.uniforms.uBrandmarkSize.value as THREE.Vector2;
    sz.set(halfSize * 2, halfSize * 2);

    // Sphere radius keyed off the current station's brandmark
    // half-size so the morphed substrate sphere sits inside the
    // plate's apparent footprint.
    material.uniforms.uSphereRadius.value = halfSize * SPHERE_TO_HALF_RATIO;

    // Shape morph: sigil → Fibonacci sphere across chamber C.
    material.uniforms.uShapeMorph.value = getSubstrateMorph(chamberC);
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
