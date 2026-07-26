"use client";

/**
 * Remnant3D — the Gateway key visual's coiled remnant, as real 3D geometry.
 *
 * Two layers, because neither alone gets there:
 *
 *   1. SOLID — the tapered multi-ply ribbon from `buildRemnantRibbon`,
 *      materialled against the existing brand vocabulary (`MeshPhysicalMaterial`
 *      + `RoomEnvironmentRig`, same family as `Brandmark3D`) rather than the
 *      generic PBR the img2threejs pass emits.
 *
 *   2. FRAY — an edge-first point cloud weighted toward the spar tip. The plate's
 *      identity is a silhouette that is *coming apart*; procedural primitives
 *      cannot produce that, and it is exactly what this codebase's point-cloud
 *      work is good at.
 *
 * Ply tonal alternation is what makes the lamination legible — without it the
 * stack reads as one solid and the object stops looking like rolled sheet.
 *
 * See `/test/remnant-3d` for live tuning and the plate A/B overlay.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RIBBON_DEFAULTS, buildRemnantRibbon, sampleRibbonFray } from "./buildRemnantRibbon";
import { DEFAULT_SPINE_PARAMS, TILT_EULER, type SpineParams } from "./remnantSpine";

export interface Remnant3DProps {
  plies?: number;
  /** 0 = plies end together, 1 = fully ragged terminus. */
  fray?: number;
  /** Particle count in the fray cloud. 0 disables it. */
  frayParticles?: number;
  fraySize?: number;
  /** Bone-white plating colour. */
  plateColor?: string;
  /** Dark stratified substrate between plies. */
  substrateColor?: string;
  roughness?: number;
  metalness?: number;
  /** Strength of the per-ply tonal alternation, 0..1. */
  plyContrast?: number;
  envIntensity?: number;
  wireframe?: boolean;
  /** Radians/sec about the coil axis. 0 = static. */
  autoRotate?: number;
  spine?: SpineParams;
  scale?: number;
  /**
   * Normalize so the object's bounding sphere has radius 1. The spar's length and
   * out-of-plane rise are fitted parameters, so the raw extent changes whenever
   * they are tuned — without this the object walks out of frame mid-slider.
   */
  fitToUnitSphere?: boolean;
}

const PLATE = "#d8d0c2";
const SUBSTRATE = "#2a2622";

export function Remnant3D({
  plies = RIBBON_DEFAULTS.plies,
  fray = RIBBON_DEFAULTS.fray,
  frayParticles = 9000,
  fraySize = 0.004,
  plateColor = PLATE,
  substrateColor = SUBSTRATE,
  roughness = 0.72,
  metalness = 0,
  plyContrast = 0.55,
  envIntensity = 1,
  wireframe = false,
  autoRotate = 0,
  spine = DEFAULT_SPINE_PARAMS,
  scale = 1,
  fitToUnitSphere = true,
}: Remnant3DProps) {
  const group = useRef<THREE.Group>(null);

  const ribbon = useMemo(
    () =>
      buildRemnantRibbon({
        plies,
        fray,
        spine,
        stations: RIBBON_DEFAULTS.stations,
        plyGap: RIBBON_DEFAULTS.plyGap,
      }),
    [plies, fray, spine]
  );

  const frayCloud = useMemo(
    () => (frayParticles > 0 ? sampleRibbonFray(ribbon, frayParticles) : null),
    [ribbon, frayParticles]
  );

  // Dispose geometry when the memo produces a replacement, or the lab's sliders
  // leak a new BufferGeometry per change.
  useEffect(() => () => ribbon.geometry.dispose(), [ribbon]);
  useEffect(() => () => frayCloud?.dispose(), [frayCloud]);

  const material = useMemo(() => {
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(plateColor),
      roughness,
      metalness,
      clearcoat: 0.12,
      clearcoatRoughness: 0.7,
      side: THREE.DoubleSide,
      wireframe,
    });

    // Tonal alternation per ply + a darkening toward the band edges, injected
    // into the standard PBR shader so the material keeps real env reflections.
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSubstrate = { value: new THREE.Color(substrateColor) };
      shader.uniforms.uPlyContrast = { value: plyContrast };
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
           attribute float aPlyT;
           attribute float aSweepT;
           varying float vPlyT;
           varying float vSweepT;
           varying vec2 vRibbonUv;`
        )
        .replace(
          "#include <uv_vertex>",
          `#include <uv_vertex>
           vPlyT = aPlyT;
           vSweepT = aSweepT;
           vRibbonUv = uv;`
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
           uniform vec3 uSubstrate;
           uniform float uPlyContrast;
           varying float vPlyT;
           varying float vSweepT;
           varying vec2 vRibbonUv;`
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
           // Alternating lamina tone — this is what makes the stack legible.
           float parity = step(0.5, fract(vPlyT * 14.0));
           // The cut edge of the roll is substrate; the broad face is plating.
           float edgeFace = smoothstep(0.30, 0.02, min(vRibbonUv.y, 1.0 - vRibbonUv.y));
           float substrateMix = clamp(uPlyContrast * (0.35 * parity + 0.85 * edgeFace), 0.0, 1.0);
           diffuseColor.rgb = mix(diffuseColor.rgb, uSubstrate, substrateMix);
           // Plating thins and dirties toward the spar tip.
           diffuseColor.rgb *= mix(0.62, 1.0, smoothstep(0.0, 0.42, vSweepT));`
        );
    };
    // envMapIntensity is set here rather than in a follow-up effect: mutating a
    // memoized material from an effect is what react-hooks/immutability flags,
    // and the material is cheap enough to rebuild when the slider moves.
    mat.envMapIntensity = envIntensity;
    mat.needsUpdate = true;
    return mat;
  }, [plateColor, substrateColor, roughness, metalness, plyContrast, wireframe, envIntensity]);

  useEffect(() => () => material.dispose(), [material]);

  const frayMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: new THREE.Color(plateColor),
        size: fraySize,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [plateColor, fraySize]
  );

  useEffect(() => () => frayMaterial.dispose(), [frayMaterial]);

  useFrame((_, delta) => {
    if (autoRotate && group.current) group.current.rotation.y += autoRotate * delta;
  });

  // The tilt is applied here, to the whole object, because the ribbon is built in
  // the coil's own frame (coil axis = +Z). Baking it into the spine would break
  // the width direction — see the note on TILT_EULER.
  const fit = useMemo(() => {
    if (!fitToUnitSphere) return 1;
    const r = ribbon.geometry.boundingSphere?.radius ?? 1;
    return r > 1e-6 ? 1 / r : 1;
  }, [ribbon, fitToUnitSphere]);

  // The tilt is applied here, to the whole object, because the ribbon is built in
  // the coil's own frame (coil axis = +Z). Baking it into the spine would break
  // the width direction — see the note on TILT_EULER.
  return (
    <group ref={group} scale={scale * fit}>
      <group rotation={TILT_EULER}>
        <mesh geometry={ribbon.geometry} material={material} />
        {frayCloud ? <points geometry={frayCloud} material={frayMaterial} /> : null}
      </group>
    </group>
  );
}
