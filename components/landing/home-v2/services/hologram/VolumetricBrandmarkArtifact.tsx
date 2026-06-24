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
 *   2. IT HOLDS A STATIC 3D POSE. Instead of billboarding flat to the camera,
 *      the mark rests at a fixed Blender-style 3/4 tilt and only nudges toward
 *      the pointer (subtle, damped) — no time-based wobble or spin by default.
 *      A genuinely 3D ring+cross reads as the mark from this angle; the
 *      legibility concern that forced billboarding only applied to a FLAT
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

const DEFAULT_COLOR = "#caa554"; // --gold — unified with the gold orbit armillary
const DEFAULT_ACCENT = "#e9c97a"; // brighter warm gold — luminous Fresnel limb

// Rest pose + pointer-look now live on the shared RIG group
// (ServicesHologramScene) so the mark and its orbits move as ONE anchored
// object. The mark itself only optionally self-spins (`spin`, default 0).

/**
 * Scroll-entrance envelopes, in `--corridor-dissipate` units (0..1) — the
 * corridor-exit dissipate clock. Across the seam the cloud TRANSFORMS from the
 * corridor dome blob into the parked wireframe: particles migrate onto the
 * edges (`uTransform`), the holographic haze settles (`uEntropy`/density/point
 * size), the mark inflates from the dome's apparent size to parked (`uScale`),
 * and the radar scan comes online last. All tunable.
 */
const ENTRANCE_TRANSFORM = { start: 0.4, end: 0.92 }; // dome → wireframe migration
const ENTRANCE_OPACITY = { start: 0.36, end: 0.66 }; // fade up (overlaps the dome)
const ENTRANCE_SETTLE = { start: 0.42, end: 0.97 }; // haze/density/size/scale settle
const ENTRANCE_SCAN = { start: 0.8, end: 1.0 }; // scan sweep online last
const ENTRANCE_SCALE_FROM = 1.7; // ×parked scale at the seam (match dome apparent size)
const ENTRANCE_POINTSIZE_MUL = 1.3; // softer/larger specks mid-morph
const ENTRANCE_ENTROPY = 1.0; // dispersion amount at the seam
const ENTRANCE_GLITCH_PEAK = 1.0; // glitch/latent-resolve intensity at mid-morph (bell)

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
/** Ken Perlin smootherstep (C2-continuous). */
function smootherstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

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
  /** Optional continuous self-spin in rad/s. Default 0 (off). The rig group owns
   *  rest pose + pointer-look; this is only the mark's own turntable. */
  spin?: number;
  /** Scroll-driven entrance. "scroll" = transform from the corridor dome into
   *  the wireframe across `--corridor-dissipate` (the production seam); "off" =
   *  parked wireframe (lab / static hosts). Default "off". */
  entrance?: "scroll" | "off";
  /** Entrance form across the scroll seam: "dome" morphs the corridor dome blob
   *  into the wireframe (reads amorphous/2D mid-morph); "wire" flies the 3D
   *  wireframe in directly (scale + fade + scan + haze settle, no dome, no
   *  glitch) so the mark is ALWAYS 3D. Default "dome". */
  entranceForm?: "dome" | "wire";
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
  entrance = "off",
  entranceForm = "dome",
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
    geom.setAttribute("aDomeHome", new THREE.BufferAttribute(sample.domeHomes, 3));
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
        uTransform: { value: 1 },
        uEntropy: { value: 0 },
        uGlitch: { value: 0 },
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
  // Locally-damped dissipate value (−1 sentinel = snap on first frame).
  const entranceDampRef = useRef(-1);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state, delta) => {
    const u = materialRef.current.uniforms;
    const t = state.clock.elapsedTime;
    u.uTime.value = t;
    u.uFlyIn.value = flyIn;
    u.uPixelRatio.value = gl.getPixelRatio();
    (u.uColor.value as THREE.Color).set(color);
    (u.uAccent.value as THREE.Color).set(accentColor);

    // ── Scroll entrance: transform the corridor dome into the wireframe ──
    // Read the corridor-exit dissipate clock (`--corridor-dissipate` on <html>,
    // an inline-style read) and damp it locally for buttery motion. "off" /
    // absent (lab, /test/services-demo, deep-link into #services, mobile) →
    // parked wireframe, so the mark is never stuck mid-morph or invisible.
    const scrollEntrance = entrance === "scroll";
    let target = 1;
    if (scrollEntrance) {
      const raw = parseFloat(
        document.documentElement.style.getPropertyValue("--corridor-dissipate")
      );
      target = Number.isFinite(raw) ? raw : 1;
    }
    if (entranceDampRef.current < 0)
      entranceDampRef.current = target; // snap on first frame
    else entranceDampRef.current += (target - entranceDampRef.current) * Math.min(1, delta * 8);
    const d = scrollEntrance ? entranceDampRef.current : 1;

    const formT = smootherstep(ENTRANCE_TRANSFORM.start, ENTRANCE_TRANSFORM.end, d);
    const opT = smootherstep(ENTRANCE_OPACITY.start, ENTRANCE_OPACITY.end, d);
    const settleT = smootherstep(ENTRANCE_SETTLE.start, ENTRANCE_SETTLE.end, d);
    const scanT = smootherstep(ENTRANCE_SCAN.start, ENTRANCE_SCAN.end, d);

    // Inflate from the dome's apparent size at the seam, settling to parked.
    const effScale = scale * lerp(ENTRANCE_SCALE_FROM, 1, settleT);
    // "wire" entrance: skip the dome→wireframe morph (and its glitch) so the
    // mark is ALWAYS the 3D wireframe — it still flies in via scale + opacity +
    // haze settle + scan below. "dome" keeps the corridor-sphere morph.
    if (entranceForm === "wire") {
      u.uTransform.value = 1; // always wireframe (3D)
      u.uGlitch.value = 0;
    } else {
      u.uTransform.value = formT; // dome (0) → wireframe (1)
      // Glitch peaks mid-morph (bell) and is 0 at the dome + parked ends.
      u.uGlitch.value = scrollEntrance ? ENTRANCE_GLITCH_PEAK * formT * (1 - formT) * 4 : 0;
    }
    u.uEntropy.value = (1 - settleT) * ENTRANCE_ENTROPY; // dusty haze → 0
    u.uScale.value = effScale;
    u.uOpacity.value = opacity * opT;
    u.uDensity.value = lerp(1, density, settleT); // dense dome → parked density
    u.uPointSize.value = pointSize * lerp(ENTRANCE_POINTSIZE_MUL, 1, settleT);

    // Depth dim mapped to the live camera distance (uses the effective scale so
    // the envelope tracks the mark as it inflates and settles).
    const dist = state.camera.position.length();
    u.uFocal.value = dist;
    u.uNear.value = dist - effScale * 1.35;
    u.uFar.value = dist + effScale * 1.35;

    // Radar scan sweep — gated by scanT so it only fires once the mark settles.
    u.uScanGain.value = scanGain * scanT;
    u.uScanWidth.value = effScale * 0.13;
    const period = 5.2;
    const sweepT = 3.4;
    const tMod = t % period;
    if (tMod > sweepT) {
      u.uScan.value = 9999;
    } else {
      const yTop = effScale * 1.4;
      u.uScan.value = yTop - (tMod / sweepT) * yTop * 2.0;
    }

    // The rig group (ServicesHologramScene) owns the rest pose + pointer-look so
    // the mark and its orbits move as ONE anchored object. Here the mark only
    // applies its optional self-spin (default 0 = still).
    if (groupRef.current) {
      groupRef.current.rotation.set(0, spin * t, 0);
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
