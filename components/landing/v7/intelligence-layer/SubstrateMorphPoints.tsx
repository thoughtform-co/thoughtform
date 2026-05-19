"use client";

/**
 * SubstrateMorphPoints — the substrate sphere's particle cloud
 * (ADR-017). Replaces the legacy fixed Fibonacci-sphere `<points>`
 * inside `CelestialBody` (substrate variant).
 *
 * Each frame the painter:
 *
 *   1. Reads `transform.substrateMorph` from the brandmark journey
 *      store (0 = brandmark shape; 1 = Fibonacci sphere).
 *   2. Reads the substrate brandmark anchor's screen rect
 *      (`.ilayer__brandmark-anchor`), which is where the brandmark
 *      vector is parked when the substrate window engages.
 *   3. Un-projects that screen rect onto the substrate body's z
 *      plane (in scene-space) to compute `uBrandmarkCenter` and
 *      `uBrandmarkSize` uniforms.
 *   4. Writes uniforms; the shader does the rest.
 *
 * The sphere target is fixed: `uSphereCenter = BODY_POSITIONS.substrate`,
 * `uSphereRadius = 0.46 × BODY_SCALES.substrate` — same world-space
 * footprint as the legacy `buildSphereCloudGeometry(0.46, …)` inside
 * the substrate body's group.
 *
 * The brandmark vector is hidden by a separate gate
 * (`BrandmarkVectorActor` reads `substrateMorph > 0`), so the swap
 * between vector mark and particle mark is invisible — the
 * particles already cover the same shape at the same screen
 * position the moment the morph begins.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";
import { sampleShape } from "@/lib/brandmark/sampleShape";
import { BRANDMARK_FULL_PATHS, BRANDMARK_SHAPE_KEYS } from "@/lib/brandmark/shapes";
import { buildSphereCloudGeometry } from "./celestialRingUtils";
import { BODY_POSITIONS, BODY_SCALES } from "./intelligenceLayerGeom";
import { substrateMorphVertex, substrateMorphFragment } from "./shaders/substrateMorph";

/** Brandmark SVG viewBox — must match `public/logos/Thoughtform_Brandmark.svg`. */
const BRANDMARK_VIEWBOX = { x: 0, y: 0, width: 430.99, height: 436 } as const;

/** Substrate cloud point count — matches `BODY_CLOUD_COUNT.substrate`
 *  in the legacy CelestialBody implementation so the journey
 *  through the morph paints the same density of particles end-to-end. */
const POINT_COUNT = 1900;

/** Local-space sphere radius. Multiplied by `uSphereRadius` (=
 *  BODY_SCALES.substrate) to land on the same screen-space footprint
 *  the legacy `buildSphereCloudGeometry(0.46, ...) × scale 1.85` had. */
const SPHERE_LOCAL_RADIUS = 0.46;

/** Brandmark cloud screen size when the morph begins, expressed as
 *  a multiplier on the substrate anchor's screen width/height. The
 *  brandmark fills the whole anchor — same as the vector mark. */
const BRANDMARK_SIZE_MULT = 1.0;

const GOLD_BODY = new THREE.Color("#caa554");
const GOLD_RIM = new THREE.Color("#e9c97a");

interface SubstrateMorphPointsProps {
  /** Sphere centre in scene-space (the parent rotation group's
   *  coordinate frame). Defaults to `BODY_POSITIONS.substrate`. */
  sphereCenter?: readonly [number, number, number];
  /** Sphere world-space scale. Defaults to `BODY_SCALES.substrate`. */
  sphereScale?: number;
  /** Optional override for the point count. Defaults to 1900. */
  pointCount?: number;
}

export function SubstrateMorphPoints({
  sphereCenter = BODY_POSITIONS.substrate,
  sphereScale = BODY_SCALES.substrate,
  pointCount = POINT_COUNT,
}: SubstrateMorphPointsProps) {
  const { camera, scene } = useThree();
  const meshRef = useRef<THREE.Points>(null);

  // ─── Pre-built sphere positions (Fibonacci shell) + brandmark sample ──
  // useMemo returns null until `document` is available + the
  // sampler has produced points, so we don't render an empty cloud
  // or a half-built shape on the SSR / first-paint tick.
  const geometry = useMemo(() => {
    if (typeof document === "undefined") return null;

    // Build the Fibonacci sphere (matches the legacy substrate
    // sphere cloud's shape exactly so morph = 1 paints what the
    // user used to see).
    const sphereGeom = buildSphereCloudGeometry(SPHERE_LOCAL_RADIUS, pointCount);
    const spherePos = sphereGeom.getAttribute("position") as THREE.BufferAttribute | undefined;
    const sphereNormal = sphereGeom.getAttribute("aNormal") as THREE.BufferAttribute | undefined;
    const sphereSeeds = sphereGeom.getAttribute("aSeed") as THREE.BufferAttribute | undefined;
    if (!spherePos || !sphereNormal || !sphereSeeds) {
      sphereGeom.dispose();
      return null;
    }

    // Sample the brandmark shape into 2D normalised XY positions.
    // sampleShape returns home in [-0.5, 0.5] with (0, 0) at viewBox
    // centre. We pad to `pointCount` if the sampler returns fewer
    // (rare with stratified sampling at our densities) by recycling
    // earlier samples — keeps the buffer size stable.
    const sample = sampleShape({
      shapeKey: BRANDMARK_SHAPE_KEYS.full,
      paths: BRANDMARK_FULL_PATHS,
      viewBox: BRANDMARK_VIEWBOX,
      count: pointCount,
    });

    const brandmarkAttrib = new Float32Array(pointCount * 2);
    if (sample.count >= pointCount) {
      brandmarkAttrib.set(sample.home.subarray(0, pointCount * 2));
    } else if (sample.count > 0) {
      for (let i = 0; i < pointCount; i++) {
        const src = i % sample.count;
        brandmarkAttrib[i * 2] = sample.home[src * 2];
        brandmarkAttrib[i * 2 + 1] = sample.home[src * 2 + 1];
      }
    } else {
      // Sampler returned nothing (SSR / no canvas yet). Fill with
      // zeros so the brandmark "shape" is just the centre — better
      // than crashing. This branch is exercised only on the first
      // server-rendered tick; subsequent client renders re-sample.
      brandmarkAttrib.fill(0);
    }

    const geom = new THREE.BufferGeometry();
    // Three.js needs a `position` attribute even when we ignore it
    // in the vertex shader (it's used for bounding-box calc).
    // Initialise with the sphere positions so the bounding sphere
    // covers the maximal cloud extent.
    geom.setAttribute("position", spherePos.clone());
    geom.setAttribute("aHomeBrandmark", new THREE.BufferAttribute(brandmarkAttrib, 2));
    geom.setAttribute("aHomeSphere", spherePos.clone());
    geom.setAttribute("aSphereNormal", sphereNormal.clone());
    geom.setAttribute("aSeed", sphereSeeds.clone());

    // Disposal of the helper geom — we already cloned the
    // attributes so the parent buffer isn't needed any more.
    sphereGeom.dispose();
    return geom;
  }, [pointCount]);

  // ─── Material with the morph shader ──────────────────────────────────
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: substrateMorphVertex,
      fragmentShader: substrateMorphFragment,
      uniforms: {
        uTime: { value: 0 },
        uPointSize: { value: 4.2 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uPresence: { value: 1 },
        uSubstrateMorph: { value: 0 },
        uBrandmarkCenter: { value: new THREE.Vector3(...sphereCenter) },
        uBrandmarkZ: { value: sphereCenter[2] },
        uBrandmarkSize: { value: new THREE.Vector2(0.5, 0.5) },
        uSphereCenter: { value: new THREE.Vector3(...sphereCenter) },
        uSphereRadius: { value: sphereScale },
        uColor: { value: GOLD_BODY.clone() },
        uRimColor: { value: GOLD_RIM.clone() },
        uOpacity: { value: 0.95 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, [sphereCenter, sphereScale]);

  useEffect(() => {
    return () => {
      material.dispose();
      geometry?.dispose();
    };
  }, [material, geometry]);

  // ─── Per-frame projection + uniform updates ─────────────────────────
  // Scratch vectors live outside `useFrame` so we don't allocate per
  // tick.
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const planeNormal = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const plane = useMemo(() => new THREE.Plane(planeNormal, 0), [planeNormal]);
  const hitWorld = useMemo(() => new THREE.Vector3(), []);
  const hitWorldRight = useMemo(() => new THREE.Vector3(), []);
  const hitWorldDown = useMemo(() => new THREE.Vector3(), []);
  const hitLocal = useMemo(() => new THREE.Vector3(), []);
  const hitLocalRight = useMemo(() => new THREE.Vector3(), []);
  const hitLocalDown = useMemo(() => new THREE.Vector3(), []);

  /** Un-project a viewport pixel `(x, y)` onto the plane
   *  z = `sphereCenter[2]` (in the parent rotation group's local
   *  coordinate system). Returns the result in `dest`. */
  const screenToLocal = (
    canvas: HTMLCanvasElement,
    canvasRect: DOMRect,
    parentMatrixInverse: THREE.Matrix4 | null,
    targetPlane: THREE.Plane,
    screenX: number,
    screenY: number,
    destWorld: THREE.Vector3,
    destLocal: THREE.Vector3
  ): boolean => {
    const relX = screenX - canvasRect.left;
    const relY = screenY - canvasRect.top;
    if (canvasRect.width <= 0 || canvasRect.height <= 0) return false;
    ndc.x = (relX / canvasRect.width) * 2 - 1;
    ndc.y = -((relY / canvasRect.height) * 2 - 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.ray.intersectPlane(targetPlane, destWorld);
    if (!hit) return false;
    if (parentMatrixInverse) {
      destLocal.copy(destWorld).applyMatrix4(parentMatrixInverse);
    } else {
      destLocal.copy(destWorld);
    }
    void canvas;
    return true;
  };

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    material.uniforms.uTime.value = t;
    material.uniforms.uPixelRatio.value = state.viewport.dpr;

    const journey = useBrandmarkJourneyStore.getState().transform;
    const morph = journey.substrateMorph;
    material.uniforms.uSubstrateMorph.value = morph;

    // The sphere is always parked at its body centre — uniforms only
    // need to be updated if the props change (which they don't at
    // runtime). Brandmark uniforms are recomputed every frame so
    // late layout / resize / scroll all flow through.
    if (morph >= 0.999) {
      // Pure-sphere mode — skip the screen→world projection work
      // entirely. The shader ignores brandmark uniforms when
      // morph = 1 (mix collapses to sphereTarget).
      return;
    }

    // Find the canvas + the substrate anchor in the DOM.
    const canvas = state.gl.domElement;
    const canvasRect = canvas.getBoundingClientRect();
    if (canvasRect.width < 4 || canvasRect.height < 4) return;

    const anchor = document.querySelector<HTMLElement>(
      "#intelligence-layer .ilayer__brandmark-anchor"
    );
    if (!anchor) return;
    const ar = anchor.getBoundingClientRect();
    if (ar.width <= 0 || ar.height <= 0) return;

    // The morph mesh is parented inside the rotation group whose
    // worldMatrix bakes in `CAMERA_TILT`. We invert that matrix to
    // express our brandmark target in the same local frame the
    // sphere positions live in. Walk up from the mesh's parent so
    // any future re-parenting still works.
    const parent = mesh.parent;
    let parentMatrixInverse: THREE.Matrix4 | null = null;
    if (parent) {
      scene.updateMatrixWorld();
      parentMatrixInverse = new THREE.Matrix4().copy(parent.matrixWorld).invert();
    }

    // Plane is at z = sphereCenter[2] in LOCAL frame, but the
    // raycaster works in world. Compute the plane's world position
    // by transforming a local point on the plane through the parent
    // matrix.
    const planeWorldPoint = new THREE.Vector3(0, 0, sphereCenter[2]);
    if (parent) planeWorldPoint.applyMatrix4(parent.matrixWorld);
    // Plane normal in WORLD: parent's local z axis transformed by
    // its rotation. For a small CAMERA_TILT the world z is still
    // roughly (0, 0, 1) — close enough that we use world z=1 as the
    // plane normal. Negligible error vs. the few-mm offset on a
    // 6.4-unit-distant camera.
    plane.setFromNormalAndCoplanarPoint(planeNormal, planeWorldPoint);

    const cx = ar.left + ar.width / 2;
    const cy = ar.top + ar.height / 2;
    if (
      !screenToLocal(canvas, canvasRect, parentMatrixInverse, plane, cx, cy, hitWorld, hitLocal)
    ) {
      return;
    }
    // Right edge — used to compute world half-width.
    if (
      !screenToLocal(
        canvas,
        canvasRect,
        parentMatrixInverse,
        plane,
        cx + ar.width / 2,
        cy,
        hitWorldRight,
        hitLocalRight
      )
    ) {
      return;
    }
    // Bottom edge — used to compute world half-height.
    if (
      !screenToLocal(
        canvas,
        canvasRect,
        parentMatrixInverse,
        plane,
        cx,
        cy + ar.height / 2,
        hitWorldDown,
        hitLocalDown
      )
    ) {
      return;
    }

    const halfWidth = hitLocalRight.distanceTo(hitLocal) * BRANDMARK_SIZE_MULT;
    const halfHeight = hitLocalDown.distanceTo(hitLocal) * BRANDMARK_SIZE_MULT;

    // Brandmark centre + size uniforms — written every frame so
    // scroll / resize / sticky parents flow through immediately.
    const bm = material.uniforms.uBrandmarkCenter.value as THREE.Vector3;
    bm.set(hitLocal.x, hitLocal.y, hitLocal.z);
    material.uniforms.uBrandmarkZ.value = hitLocal.z;
    const sz = material.uniforms.uBrandmarkSize.value as THREE.Vector2;
    sz.set(halfWidth, halfHeight);
  });

  if (!geometry) return null;
  return <points ref={meshRef} geometry={geometry} material={material} frustumCulled={false} />;
}
