"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import { BRANDMARK_FULL_PATHS, BRANDMARK_SHAPE_KEYS } from "@/lib/brandmark/shapes";
import { buildSphereCloudGeometry } from "@/components/landing/v7/intelligence-layer/celestialRingUtils";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  SUBSTRATE_SCALE,
  getBrandmarkPosition,
  getBrandmarkScale,
  getSubstrateMorph,
} from "./sceneGeom";
import { brandmarkCloudVertex, brandmarkCloudFragment } from "./shaders/brandmarkCloud";

/** Brandmark SVG viewBox — must match `public/logos/Thoughtform_Brandmark.svg`. */
const BRANDMARK_VIEWBOX = { x: 0, y: 0, width: 430.99, height: 436 } as const;

/** Total point count. Matches the intelligence-layer substrate cloud
 *  (1900) so the morph from brandmark → sphere reads at the same
 *  density as the production triad. */
const POINT_COUNT = 1900;

/** Local-space half-size of the flat brandmark plate. The brandmark
 *  SVG is roughly square (430.99 × 436), so we use a unit-ish plate
 *  scaled by the parent group's `getBrandmarkScale` value. */
const BRANDMARK_LOCAL_HALF: [number, number] = [0.55, 0.55];

/** Local-space Fibonacci sphere radius. Matches the brandmark plate's
 *  half-size so the sphere reads as roughly the same screen footprint
 *  as the brandmark at morph = 0. The parent group's scale (driven
 *  by `getBrandmarkScale`) handles the final visual sizing. */
const SPHERE_LOCAL_RADIUS = 0.46;

const GOLD_BODY = new THREE.Color("#caa554");
const GOLD_RIM = new THREE.Color("#e9c97a");

/**
 * BrandmarkPointCloud — one persistent point cloud that lives in the
 * scene for all three chambers of the home-v2 depth gateway.
 *
 * Two per-vertex attributes give each particle a START and an END
 * home in local space:
 *   - `aHomeBrandmark` — sampled from the brandmark SVG via
 *     `sampleShape` (cached, deterministic). 2D, in [-0.5, 0.5].
 *   - `aHomeSphere`    — Fibonacci sphere on the unit shell (same
 *     distribution as the v7 intelligence-layer substrate body).
 *
 * The shader (`brandmarkCloud.ts`) lerps between them by
 * `uShapeMorph`, which is driven by Chamber C's local progress
 * (`getSubstrateMorph`). The parent `<group>` is repositioned and
 * rescaled every frame by reading `depthGatewayStore` directly —
 * the rAF scroll hook is the only writer, this component is the
 * only consumer, and React never re-renders during scroll.
 *
 * When the substrate morph completes the cloud occupies the same
 * Fibonacci shell at the same local radius as the intelligence-layer
 * substrate body, so the visual register matches the production
 * triad.
 */
export function BrandmarkPointCloud() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Points>(null);

  // ── Geometry: brandmark sample + Fibonacci sphere ────────────
  // `useMemo` returns null until `document` is available + the
  // sampler has produced points. SSR / first-paint return null and
  // the cloud appears once hydration completes.
  const geometry = useMemo(() => {
    if (typeof document === "undefined") return null;

    const sphereGeom = buildSphereCloudGeometry(SPHERE_LOCAL_RADIUS, POINT_COUNT);
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
      // Pad by recycling earlier samples so the buffer length stays
      // stable. Rare path — stratified sampling normally produces
      // exactly POINT_COUNT samples at our density.
      for (let i = 0; i < POINT_COUNT; i++) {
        const src = i % sample.count;
        brandmarkAttrib[i * 2] = sample.home[src * 2];
        brandmarkAttrib[i * 2 + 1] = sample.home[src * 2 + 1];
      }
    } else {
      brandmarkAttrib.fill(0);
    }

    const geom = new THREE.BufferGeometry();
    // Three.js needs a `position` attribute for bounding-box calc;
    // initialise with sphere positions so the bounding sphere covers
    // the maximal cloud extent. The vertex shader ignores `position`
    // and uses `aHomeBrandmark` / `aHomeSphere` directly.
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
        uPointSize: { value: 5.4 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uPresence: { value: 1 },
        uShapeMorph: { value: 0 },
        uBrandmarkSize: {
          value: new THREE.Vector2(BRANDMARK_LOCAL_HALF[0], BRANDMARK_LOCAL_HALF[1]),
        },
        uSphereRadius: { value: SPHERE_LOCAL_RADIUS },
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

  // ── Per-frame state → group transform + uniforms ────────────
  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    const transform = useDepthGatewayStore.getState().transform;
    const { progress, chamberA, chamberC, active } = transform;

    // Time + DPR uniforms are always updated; everything else is
    // gated on whether the stage is engaged so we don't pay layout
    // costs when the scene is offscreen.
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPixelRatio.value = state.viewport.dpr;

    if (!active) {
      // Stage scrolled past — hide the cloud so it doesn't paint
      // behind unrelated tail content. (Tail content actually sits
      // above the canvas in z-order, but hiding is cheaper than
      // letting the shader run for no visible gain.)
      group.visible = false;
      return;
    }
    group.visible = true;

    // Position + scale the parent group from sceneGeom helpers. The
    // brandmark drifts right → centre across Chamber A, then settles
    // at the BRANDMARK_REST position for Chambers B and C. Once
    // settled it stays put — the morph shader does the rest.
    const [px, py, pz] = getBrandmarkPosition(progress, chamberA);
    group.position.set(px, py, pz);

    // During Chamber C the brandmark mesh expands to match the
    // intelligence-layer substrate body's screen footprint so the
    // morph reads as "the brandmark becomes the centre of the
    // triad". We blend the BRANDMARK scale → SUBSTRATE_SCALE across
    // Chamber C so the cloud grows into its sphere form.
    const baseScale = getBrandmarkScale(progress, chamberA);
    const scale = baseScale + (SUBSTRATE_SCALE - baseScale) * chamberC;
    group.scale.setScalar(scale);

    // Substrate morph — 0 in Chambers A/B (cloud paints the
    // brandmark), 1 by Chamber C end (cloud paints the Fibonacci
    // sphere). Smoothstep'd in sceneGeom.
    material.uniforms.uShapeMorph.value = getSubstrateMorph(chamberC);
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef}>
      <points ref={meshRef} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
