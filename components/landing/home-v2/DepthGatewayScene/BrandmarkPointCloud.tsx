"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import { BRANDMARK_FULL_PATHS, BRANDMARK_SHAPE_KEYS } from "@/lib/brandmark/shapes";
import { buildSphereCloudGeometry } from "@/components/landing/v7/intelligence-layer/celestialRingUtils";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { smoothstep } from "@/lib/stores/depthGatewayStore";
import { getSubstrateMorph } from "./sceneGeom";
import { brandmarkCloudVertex, brandmarkCloudFragment } from "./shaders/brandmarkCloud";

/** Brandmark SVG viewBox — must match `public/logos/Thoughtform_Brandmark.svg`. */
const BRANDMARK_VIEWBOX = { x: 0, y: 0, width: 430.99, height: 436 } as const;

/** Total point count. Matches the production substrate cloud (1900)
 *  so the morph from brandmark → sphere reads at the same density
 *  as the production triad. */
const POINT_COUNT = 1900;

/** Brandmark anchor target z in scene-space. The cloud's parent
 *  group sits on this z-plane, and dock screen rects are un-
 *  projected onto it. Negative (away from camera) so the cloud
 *  reads as a 3D object beyond the camera near plane. */
const ANCHOR_Z = -2;

/** Fraction of the dock's projected world half-width to use as the
 *  Fibonacci sphere radius. < 1 keeps the morphed sphere from
 *  exceeding the dock's visual footprint while preserving enough
 *  girth to read as a 3D shell. */
const SPHERE_TO_DOCK_RATIO = 0.6;

const GOLD_BODY = new THREE.Color("#caa554");
const GOLD_RIM = new THREE.Color("#e9c97a");

const DOCK_SELECTORS = {
  A: ".home-v2-stage .sigil__mark",
  B: ".home-v2-stage .miss__brand-slot",
  C: ".home-v2-stage .ilayer__brandmark-anchor",
} as const;

interface ChamberRect {
  cx: number;
  cy: number;
  halfW: number;
  halfH: number;
}

const ZERO_RECT: ChamberRect = { cx: 0, cy: 0, halfW: 0, halfH: 0 };

/**
 * BrandmarkPointCloud — one persistent point cloud that lives in
 * the scene for all three chambers of the home-v2 depth gateway.
 *
 * Anchoring model (SubstrateMorphPoints, ADR-017 pattern):
 *
 *   1. Each frame, look up the three chamber dock elements
 *      (`.sigil__mark`, `.miss__brand-slot`,
 *      `.ilayer__brandmark-anchor`) by querySelector.
 *   2. Get each dock's `getBoundingClientRect()`.
 *   3. Take a WEIGHTED AVERAGE of the dock rects using the per-
 *      chamber opacity envelopes (matches what useDepthScroll
 *      writes to the section opacity vars). Cross-fades smoothly
 *      between dock positions during chamber transitions instead
 *      of jumping at the chamberId boundary.
 *   4. Un-project the averaged centre + right edge + bottom edge
 *      onto the z = ANCHOR_Z plane to get world coords.
 *   5. Drive the parent group's position + the shader's
 *      `uBrandmarkSize` / `uSphereRadius` uniforms so the cloud
 *      paints inside the dock rect at v7's exact sizing.
 *
 * Shape morph: `uShapeMorph` interpolates between the brandmark
 * sigil sample and a Fibonacci sphere. Morph is gated by Chamber C
 * progress (see `getSubstrateMorph`). Chambers A and B keep the
 * cloud as a flat brandmark mark; Chamber C ramps it into the
 * sphere.
 */
export function BrandmarkPointCloud() {
  const { camera, gl, scene } = useThree();
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
        uBrandmarkSize: { value: new THREE.Vector2(0.5, 0.5) },
        uSphereRadius: { value: 0.3 },
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

  // ── Scratch vectors for per-frame projection ─────────────────
  // Allocated outside useFrame so we don't churn the GC per tick.
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const planeNormal = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const plane = useMemo(() => new THREE.Plane(planeNormal, -ANCHOR_Z), [planeNormal]);
  const hitCenter = useMemo(() => new THREE.Vector3(), []);
  const hitRight = useMemo(() => new THREE.Vector3(), []);
  const hitBottom = useMemo(() => new THREE.Vector3(), []);

  // Cached dock element references — chambers don't unmount, so
  // these resolve once and stay valid. Re-resolved each frame as
  // a safety net (Fast Refresh, late hydration).
  const docksRef = useRef<{
    A: HTMLElement | null;
    B: HTMLElement | null;
    C: HTMLElement | null;
  }>({ A: null, B: null, C: null });

  const lookupDocks = () => {
    if (typeof document === "undefined") return;
    if (!docksRef.current.A) {
      docksRef.current.A = document.querySelector<HTMLElement>(DOCK_SELECTORS.A);
    }
    if (!docksRef.current.B) {
      docksRef.current.B = document.querySelector<HTMLElement>(DOCK_SELECTORS.B);
    }
    if (!docksRef.current.C) {
      docksRef.current.C = document.querySelector<HTMLElement>(DOCK_SELECTORS.C);
    }
  };

  const rectFor = (el: HTMLElement | null): ChamberRect => {
    if (!el) return ZERO_RECT;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return ZERO_RECT;
    return {
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2,
      halfW: r.width / 2,
      halfH: r.height / 2,
    };
  };

  /** Un-project an absolute viewport-px (x, y) coordinate onto the
   *  ANCHOR_Z plane in world space, writing into `dest`. */
  const screenToWorld = (
    canvas: HTMLCanvasElement,
    canvasRect: DOMRect,
    screenX: number,
    screenY: number,
    dest: THREE.Vector3
  ): boolean => {
    const relX = screenX - canvasRect.left;
    const relY = screenY - canvasRect.top;
    if (canvasRect.width <= 0 || canvasRect.height <= 0) return false;
    ndc.x = (relX / canvasRect.width) * 2 - 1;
    ndc.y = -((relY / canvasRect.height) * 2 - 1);
    ray.setFromCamera(ndc, camera);
    return ray.ray.intersectPlane(plane, dest) !== null;
  };

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

    lookupDocks();
    const rectA = rectFor(docksRef.current.A);
    const rectB = rectFor(docksRef.current.B);
    const rectC = rectFor(docksRef.current.C);

    // Per-chamber weights mirror the section opacity envelopes in
    // useDepthScroll so the cloud's blended dock position lines up
    // exactly with whichever chamber section is currently visible.
    const wA = 1 - smoothstep(0.27, 0.39, progress);
    const wB = smoothstep(0.27, 0.39, progress) * (1 - smoothstep(0.61, 0.73, progress));
    const wC = smoothstep(0.61, 0.73, progress);
    const wSum = wA + wB + wC;
    if (wSum < 1e-4) {
      group.visible = false;
      return;
    }

    // Weighted average dock rect. Skipping rects whose dock didn't
    // resolve (rectFor returned ZERO_RECT) by zeroing their weight.
    const safeA = rectA.halfW > 0 ? wA : 0;
    const safeB = rectB.halfW > 0 ? wB : 0;
    const safeC = rectC.halfW > 0 ? wC : 0;
    const safeSum = safeA + safeB + safeC;
    if (safeSum < 1e-4) return;

    const cx = (safeA * rectA.cx + safeB * rectB.cx + safeC * rectC.cx) / safeSum;
    const cy = (safeA * rectA.cy + safeB * rectB.cy + safeC * rectC.cy) / safeSum;
    const halfW = (safeA * rectA.halfW + safeB * rectB.halfW + safeC * rectC.halfW) / safeSum;
    const halfH = (safeA * rectA.halfH + safeB * rectB.halfH + safeC * rectC.halfH) / safeSum;

    // ── Un-project dock centre + right edge + bottom edge to
    //    world space on the ANCHOR_Z plane. ────────────────────
    const canvas = gl.domElement;
    const canvasRect = canvas.getBoundingClientRect();
    if (canvasRect.width < 4 || canvasRect.height < 4) return;

    // Re-establish the plane at the camera-facing depth. With our
    // perspective camera at varying Z (the FlyingCameraRig dollies
    // it), the plane sits at scene-space z = ANCHOR_Z and we
    // un-project to that plane.
    plane.set(planeNormal, -ANCHOR_Z);

    if (!screenToWorld(canvas, canvasRect, cx, cy, hitCenter)) return;
    if (!screenToWorld(canvas, canvasRect, cx + halfW, cy, hitRight)) return;
    if (!screenToWorld(canvas, canvasRect, cx, cy + halfH, hitBottom)) return;

    const worldHalfW = hitRight.distanceTo(hitCenter);
    const worldHalfH = hitBottom.distanceTo(hitCenter);

    // ── Drive the cloud transform ──────────────────────────────
    group.position.set(hitCenter.x, hitCenter.y, hitCenter.z);
    group.scale.setScalar(1);

    // Brandmark plate spans the local [-0.5, 0.5] range × uBrandmarkSize,
    // so to fill the dock's world rect we set uBrandmarkSize to
    // 2 × worldHalf — the local range × this scalar lands at
    // (-worldHalf, +worldHalf), filling the dock exactly.
    const bm = material.uniforms.uBrandmarkSize.value as THREE.Vector2;
    bm.set(worldHalfW * 2, worldHalfH * 2);

    // Sphere radius is keyed off the dock's world half-width so the
    // morphed substrate sphere sits at a stable visual size relative
    // to the dock anchor (smaller than the dock to read as a 3D
    // shell tucked inside the dock's rect rather than overflowing).
    material.uniforms.uSphereRadius.value = worldHalfW * SPHERE_TO_DOCK_RATIO;

    // Shape morph from brandmark to Fibonacci sphere across chamber C.
    material.uniforms.uShapeMorph.value = getSubstrateMorph(chamberC);

    void scene; // keep ref to satisfy lint; scene matrices auto-update
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
