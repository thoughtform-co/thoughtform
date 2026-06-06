"use client";

/**
 * TravelingBrandmarkCloud — the brandmark's PARTICLE form across the
 * entire depth corridor.
 *
 * Phase 4 of the 2026-06-06 wrap-around revision (ADR-018, supersedes
 * the Intelligence-only `SubstrateMorphCloud` for the brandmark): the
 * DOM glyph (`ProjectedBrandmarkActor`) owns the mark only across the
 * Thoughtform park; the moment 3D travel begins (just past
 * `thoughtformHold`) we cut to this particle cloud, which travels
 * with the brandmark through Navigate → Encode → Build, holding its
 * silhouette at every beat. At the Intelligence beat the cloud
 * morphs to the Fibonacci sphere (the substrate sphere climax) per
 * `getSubstrateMorph`, then collapses back into the brandmark
 * silhouette before the corridor ends.
 *
 * The handoff is an INSTANT CUT UNDER MATCHING COVER (ADR-017
 * Principle 3 corollary): the cloud paints the same silhouette at
 * the same world position as the DOM glyph at the cut frame, so
 * even though there's a 0.02-progress crossfade window the
 * perceived swap is single-frame. The cloud's `uBrandmarkSize` is
 * updated per frame from `getBrandmarkWorldHalfExtent` so the
 * silhouette tracks the DOM-glyph size exactly through the
 * Thoughtform → Diagnostic → Intelligence half-extent ramp.
 *
 * Mounted at SCENE ROOT (not inside `IntelligenceGate`) — the cloud
 * is no longer co-located with the Intelligence anchor; it follows
 * `getBrandmarkWorldPosition(paintProgress)` end-to-end.
 *
 * Brandmark Principle 4 (`brandmark-choreography` skill): the cloud
 * never opacity-fades mid-journey. Hero entry (the cut-up at
 * `thoughtformHold`) and post-orbit exit (`TAIL_FADE_OUT_START` at
 * 0.97) are the only opacity bookends (Principle 5).
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { buildSphereCloudGeometry } from "@/components/landing/v7/intelligence-layer/celestialRingUtils";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import { BRANDMARK_FULL_PATHS, BRANDMARK_SHAPE_KEYS } from "@/lib/brandmark/shapes";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  getBrandmarkParticlePresence,
  getBrandmarkWorldHalfExtent,
  getBrandmarkWorldPosition,
} from "./sceneGeom";
import { brandmarkCloudFragment, brandmarkCloudVertex } from "./shaders/brandmarkCloud";

// ── Constants ────────────────────────────────────────────────────

const BRANDMARK_VIEWBOX = { x: 0, y: 0, width: 430.99, height: 436 } as const;

/** Aspect ratio of the brandmark SVG (height / width). Matches
 *  `ProjectedBrandmarkActor.BRANDMARK_ASPECT` exactly so the cloud's
 *  silhouette tracks the DOM glyph through the cut window. */
const BRANDMARK_ASPECT = 436 / 430.99;

/** Particle budget. Matches `SubstrateMorphCloud`'s budget (the cloud
 *  we replaced for the brandmark journey) — 1900 reads as a solid
 *  silhouette at every parked beat and resolves into a clean
 *  Fibonacci sphere at the Build morph. */
const POINT_COUNT = 1900;

/** Sphere radius at the Intelligence morph climax. Multiplier on the
 *  Intelligence half-extent (0.22) so the sphere blooms to 0.55
 *  world units — the same proportion the legacy `SubstrateMorphCloud`
 *  used so the assembled shell still wraps the sphere at the
 *  documented ratio (shell substrate cage at 0.7 / sphere at 0.55 =
 *  1.27x). The sphere only manifests when `uShapeMorph > 0`, i.e.
 *  inside the Intelligence beat. */
const SPHERE_RADIUS = 0.55;

const GOLD_BODY = new THREE.Color("#caa554");
const GOLD_RIM = new THREE.Color("#e9c97a");

export function TravelingBrandmarkCloud() {
  const groupRef = useRef<THREE.Group>(null);

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
        // Sized to the Thoughtform half-extent initially; the per-
        // frame writer below tracks the live `getBrandmarkWorldHalfExtent`
        // so the cloud silhouette matches the DOM glyph through the
        // half-extent ramp.
        uBrandmarkSize: { value: new THREE.Vector2(0.64, 0.64 * BRANDMARK_ASPECT) },
        uSphereRadius: { value: SPHERE_RADIUS },
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

    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPixelRatio.value = state.viewport.dpr;

    const { presence, morph } = getBrandmarkParticlePresence(transform);
    if (presence <= 0.001) {
      group.visible = false;
      material.uniforms.uPresence.value = 0;
      return;
    }

    group.visible = true;

    // Travel with the mark — the cloud lives in world space and is
    // re-anchored to `getBrandmarkWorldPosition` every frame. Drive
    // off `paintProgress` so the armed pre-arm pass already places
    // the cloud at the parked Thoughtform position (same convention
    // ProjectedBrandmarkActor uses).
    const { paintProgress } = transform;
    const [bx, by, bz] = getBrandmarkWorldPosition(paintProgress);
    group.position.set(bx, by, bz);

    // Size to the current world half-extent so the cloud matches the
    // DOM glyph silhouette through Thoughtform → Diagnostic →
    // Intelligence (DOM glyph uses `getBrandmarkWorldHalfExtent` as
    // its world edge too — same source of truth).
    const halfExtent = getBrandmarkWorldHalfExtent(paintProgress);
    const plate = halfExtent * 2;
    material.uniforms.uBrandmarkSize.value.set(plate, plate * BRANDMARK_ASPECT);

    material.uniforms.uPresence.value = presence;
    material.uniforms.uShapeMorph.value = morph;
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef} visible={false}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
