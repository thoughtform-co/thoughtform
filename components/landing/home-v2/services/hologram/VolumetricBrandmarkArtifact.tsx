"use client";

/**
 * VolumetricBrandmarkArtifact — the Services hologram centerpiece, sampled
 * from the REAL 3D Blender brandmark mesh (`/models/brandmark/brandmark.glb`).
 *
 * Two deliberate departures from a flat, billboarded glyph give it genuine
 * depth:
 *
 *   1. GEOMETRY IS VOLUMETRIC. Particles trace the actual extruded mesh's
 *      edges (`sampleBrandmark3D`, wireframe-first) instead of flat SVG paths
 *      staggered in Z. The ring and cross have real thickness and a near/far
 *      side.
 *   2. IT HOLDS A 3D POSE. Instead of billboarding flat to the camera, the
 *      mark rests at a Blender-style 3/4 tilt and drifts with a slow, BOUNDED
 *      wobble (never edge-on, never a full tumble) so parallax reveals the
 *      depth. A genuinely 3D ring+cross reads as the mark from these angles —
 *      the legibility concern that forced billboarding only applied to a FLAT
 *      glyph. `spin` can opt into a slow continuous turntable.
 *
 * Shape-only: the host owns the <Canvas>, camera, and post FX.
 */

import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { sampleBrandmark3D } from "@/lib/brandmark/sampleBrandmark3D";
import { volumetricFragmentShader, volumetricVertexShader } from "./volumetricShaders";

const BRANDMARK_GLB = "/models/brandmark/brandmark.glb";

const DEFAULT_COLOR = "#caa554"; // --gold
const DEFAULT_ACCENT = "#ebe3d6"; // --dawn

/** Blender-render resting pose: top of the ring leans back, turned a touch to
 *  the right, so it reads as a dimensional object the instant it appears. */
const REST_TILT_X = -0.3;
const REST_TILT_Y = 0.5;

export interface VolumetricBrandmarkArtifactProps {
  /** 0 = flat silhouette, 1 = full 3D mesh. */
  flyIn: number;
  /** 0..1 particle density (rank-clip). */
  density?: number;
  /** World radius / scale of the artifact. */
  scale?: number;
  /** Base point size in CSS px. */
  pointSize?: number;
  /** Overall opacity. */
  opacity?: number;
  /** Body tint (gold). */
  color?: string;
  /** Limb accent (dawn). */
  accentColor?: string;
  /** Radar scan-sweep brightness (0 = off). */
  scanGain?: number;
  /** Faint volumetric dust particles. Default 700. */
  shellCount?: number;
  /** Points along the mesh edges (the wireframe). Default 2600. */
  wireCount?: number;
  /** Sparse Fresnel-dimmed surface fill. Default 850. */
  surfaceCount?: number;
  /** Continuous turntable spin in rad/s. Default 0 (off — wobble only). */
  spin?: number;
  /** Parallax wobble amplitude in radians. Default 0.16 (~9°). 0 = static pose. */
  wobble?: number;
}

function BrandmarkPoints({
  flyIn,
  density = 1,
  scale = 1,
  pointSize = 5,
  opacity = 1,
  color = DEFAULT_COLOR,
  accentColor = DEFAULT_ACCENT,
  scanGain = 0.6,
  wireCount = 2600,
  surfaceCount = 850,
  shellCount = 700,
  spin = 0,
  wobble = 0.16,
}: VolumetricBrandmarkArtifactProps) {
  const groupRef = useRef<THREE.Group>(null);
  const gl = useThree((s) => s.gl);
  const { scene } = useGLTF(BRANDMARK_GLB);

  // Pull the first mesh geometry out of the loaded GLB scene.
  const sourceGeometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    scene.traverse((obj) => {
      if (!geo && (obj as THREE.Mesh).isMesh) geo = (obj as THREE.Mesh).geometry;
    });
    return geo;
  }, [scene]);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    // `useGLTF` suspends until the mesh is loaded, so `sourceGeometry` is
    // present whenever this renders; the empty fallback is belt-and-braces.
    if (!sourceGeometry) return geom;
    const sample = sampleBrandmark3D(sourceGeometry, {
      wireCount,
      surfaceCount,
      shellCount,
      radius: 1,
    });
    const armAttr = new THREE.BufferAttribute(sample.armHomes, 3);
    geom.setAttribute("position", armAttr); // draw-count only; real pos comes from attrs
    geom.setAttribute("aArmHome", armAttr);
    geom.setAttribute("aFlatHome", new THREE.BufferAttribute(sample.flatHomes, 3));
    geom.setAttribute("aNormal", new THREE.BufferAttribute(sample.normals, 3));
    geom.setAttribute("aSeed", new THREE.BufferAttribute(sample.seeds, 1));
    geom.setAttribute("aPart", new THREE.BufferAttribute(sample.parts, 1));
    geom.setAttribute("aEdge", new THREE.BufferAttribute(sample.edge, 1));
    geom.setAttribute("aAngle", new THREE.BufferAttribute(sample.angles, 1));
    geom.computeBoundingSphere();
    return geom;
  }, [sourceGeometry, wireCount, surfaceCount, shellCount]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uFlyIn: { value: 0 },
        uTime: { value: 0 },
        uPointSize: { value: pointSize },
        uPixelRatio: { value: 1 },
        uDensity: { value: density },
        uFocal: { value: 3.6 },
        uScale: { value: scale },
        uColor: { value: new THREE.Color(color) },
        uAccent: { value: new THREE.Color(accentColor) },
        uOpacity: { value: opacity },
        uNear: { value: 2.6 },
        uFar: { value: 4.6 },
        uScan: { value: 9999 },
        uScanWidth: { value: 0.14 },
        uScanGain: { value: 0.6 },
        uPrimitiveAspect: { value: 2.8 },
      },
      vertexShader: volumetricVertexShader,
      fragmentShader: volumetricFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const materialRef = useRef(material);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state) => {
    const u = materialRef.current.uniforms;
    const t = state.clock.elapsedTime;
    u.uTime.value = t;
    u.uFlyIn.value = flyIn;
    u.uDensity.value = density;
    u.uPointSize.value = pointSize;
    u.uScale.value = scale;
    u.uOpacity.value = opacity;
    u.uPixelRatio.value = gl.getPixelRatio();
    (u.uColor.value as THREE.Color).set(color);
    (u.uAccent.value as THREE.Color).set(accentColor);

    // Depth dim mapped to the live camera distance so the far side recedes
    // consistently regardless of zoom. Widened vs. the flat artifact because
    // the volume genuinely occupies Z now.
    const dist = state.camera.position.length();
    u.uFocal.value = dist;
    u.uNear.value = dist - scale * 1.35;
    u.uFar.value = dist + scale * 1.35;

    // Radar scan sweep (top → bottom, then a pause off-artifact).
    u.uScanGain.value = scanGain;
    u.uScanWidth.value = scale * 0.13;
    const period = 5.2;
    const sweepT = 3.4;
    const tMod = t % period;
    if (tMod > sweepT) {
      u.uScan.value = 9999;
    } else {
      const yTop = scale * 1.4;
      u.uScan.value = yTop - (tMod / sweepT) * yTop * 2.0;
    }

    // POSE — NOT a billboard. Rest at the Blender 3/4 tilt, then a slow bounded
    // wobble (and optional continuous spin) so depth reads through parallax.
    if (groupRef.current) {
      const wobbleY = Math.sin(t * 0.34) * wobble;
      const wobbleX = Math.cos(t * 0.23) * wobble * 0.45;
      groupRef.current.rotation.set(REST_TILT_X + wobbleX, REST_TILT_Y + spin * t + wobbleY, 0);
    }
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}

/** Wrapper so the GLB load suspends in isolation (host Canvas need not add a
 *  boundary). Renders nothing until the mesh resolves — the 41 KB GLB loads in
 *  a blink and is preloaded below. */
export function VolumetricBrandmarkArtifact(props: VolumetricBrandmarkArtifactProps) {
  return <BrandmarkPoints {...props} />;
}

useGLTF.preload(BRANDMARK_GLB);
