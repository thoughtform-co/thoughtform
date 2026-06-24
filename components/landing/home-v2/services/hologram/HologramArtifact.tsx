"use client";

/**
 * HologramArtifact — the volumetric brandmark for the Services hologram.
 *
 * A single `THREE.Points` cloud whose particles morph between the flat
 * brandmark glyph and a 3D armillary (`sampleArmillary`) under `flyIn`,
 * projected by the real perspective camera so it reads as a holographic
 * artifact floating in the scene (the "spaceship radar" target). Built with
 * imperative geometry + ShaderMaterial so the attribute plumbing is explicit
 * and the per-frame uniform writes are cheap.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { sampleArmillary } from "@/lib/brandmark/sampleArmillary";
import { armillaryFragmentShader, armillaryVertexShader } from "./armillaryShaders";

export interface HologramArtifactProps {
  /** 0 = flat glyph, 1 = full armillary. */
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
  ringCount?: number;
  axisCount?: number;
  shellCount?: number;
}

const DEFAULT_COLOR = "#caa554"; // --gold
const DEFAULT_ACCENT = "#ebe3d6"; // --dawn

export function HologramArtifact({
  flyIn,
  density = 1,
  scale = 1,
  pointSize = 5,
  opacity = 1,
  color = DEFAULT_COLOR,
  accentColor = DEFAULT_ACCENT,
  scanGain = 0.6,
  ringCount = 1600,
  axisCount = 720,
  shellCount = 900,
}: HologramArtifactProps) {
  const groupRef = useRef<THREE.Group>(null);
  const gl = useThree((s) => s.gl);

  // Geometry — rebuilt only when the counts change.
  const geometry = useMemo(() => {
    const sample = sampleArmillary({ ringCount, axisCount, shellCount, radius: 1 });
    const geom = new THREE.BufferGeometry();
    const armAttr = new THREE.BufferAttribute(sample.armHomes, 3);
    // `position` exists only so THREE knows the draw count — the vertex
    // shader computes the real position from aFlatHome / aArmHome.
    geom.setAttribute("position", armAttr);
    geom.setAttribute("aArmHome", armAttr);
    geom.setAttribute("aFlatHome", new THREE.BufferAttribute(sample.flatHomes, 3));
    geom.setAttribute("aSeed", new THREE.BufferAttribute(sample.seeds, 1));
    geom.setAttribute("aPart", new THREE.BufferAttribute(sample.parts, 1));
    geom.setAttribute("aEdge", new THREE.BufferAttribute(sample.edge, 1));
    geom.computeBoundingSphere();
    return geom;
  }, [ringCount, axisCount, shellCount]);

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
      },
      vertexShader: armillaryVertexShader,
      fragmentShader: armillaryFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dispose GPU resources on unmount.
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uFlyIn.value = flyIn;
    u.uDensity.value = density;
    u.uPointSize.value = pointSize;
    u.uScale.value = scale;
    u.uOpacity.value = opacity;
    u.uPixelRatio.value = gl.getPixelRatio();
    (u.uColor.value as THREE.Color).set(color);
    (u.uAccent.value as THREE.Color).set(accentColor);

    // View-depth dim mapped to the live camera distance so the back of the
    // sphere recedes consistently regardless of zoom.
    const dist = state.camera.position.length();
    u.uFocal.value = dist;
    u.uNear.value = dist - scale * 1.05;
    u.uFar.value = dist + scale * 1.05;

    // Radar scan: a band sweeps top → bottom over the artifact, then pauses
    // off-screen before the next pass.
    u.uScanGain.value = scanGain;
    u.uScanWidth.value = scale * 0.13;
    const period = 5.2;
    const sweepT = 3.4;
    const tMod = state.clock.elapsedTime % period;
    if (tMod > sweepT) {
      u.uScan.value = 9999; // parked off-artifact during the pause
    } else {
      const yTop = scale * 1.3;
      u.uScan.value = yTop - (tMod / sweepT) * yTop * 2.0;
    }

    // BILLBOARD: the holographic mark always turns to face the viewer, so the
    // circle + crosshair stay unmistakably the brandmark from ANY camera
    // angle (a flat glyph only reads head-on — letting it tumble guarantees it
    // stops looking like the mark). The 3D feel comes from the orbits rotating
    // around it and the volumetric shell, never from rotating the mark itself.
    // The ring's baked tilt gives it a steady dimensional lean.
    if (groupRef.current) {
      groupRef.current.quaternion.copy(state.camera.quaternion);
    }
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  );
}
