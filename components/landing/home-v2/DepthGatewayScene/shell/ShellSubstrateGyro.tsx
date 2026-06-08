"use client";

/**
 * ShellSubstrateGyro — LAB-ONLY 3D gimbaled gyroscope for the Navigate
 * substrate beat (`/test/navigate-gyroscope`, gated by `gyroLabStore.enabled`).
 *
 * Replaces the flat compass with a genuine 3D instrument:
 *   - Wireframe attitude globe (great-circle meridians + latitude parallels,
 *     bolder equator horizon) painted with a depth-fade line shader so the
 *     far hemisphere dims and the sphere reads as a volume.
 *   - Three counter-rotating gimbal rings on orthogonal axes (OuterArmillary
 *     pattern) with tiny pivot diamonds at ring crossings.
 *   - Sparse surface-particle accent parented to the globe spin group.
 *
 * Motion: the parent `BrandmarkAccretionShell` banks the entire accreted
 * intelligence assembly. This component keeps the globe polar spin and
 * per-ring counter-spin so it remains an instrument inside that assembly.
 *
 * PRODUCTION SAFETY: only mounts when `gyroLabStore.enabled` (default false).
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COLOR_DAWN, COLOR_GOLD } from "@/components/landing/intelligence-artifact/artifactGeom";
import {
  buildDiamondGeometry,
  makeMeshMaterial,
} from "@/components/landing/intelligence-artifact/artifactPrimitives";
import { buildSphereCloudGeometry } from "@/components/landing/v7/intelligence-layer/celestialRingUtils";
import { useGyroLabStore } from "@/lib/stores/gyroLabStore";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers } from "../sceneGeom";
import {
  EMERGE_EPSILON,
  shellWrapEmerge,
  SUBSTRATE_GYRO_DEPTH_FAR,
  SUBSTRATE_GYRO_DEPTH_NEAR,
  SUBSTRATE_GYRO_ENCODE_OPACITY_FLOOR,
  SUBSTRATE_GYRO_GIMBAL_RINGS,
  SUBSTRATE_GYRO_GLOBE_EQUATOR_OPACITY,
  SUBSTRATE_GYRO_GLOBE_LINE_OPACITY,
  SUBSTRATE_GYRO_GLOBE_SEGMENTS,
  SUBSTRATE_GYRO_GLOBE_SPIN,
  SUBSTRATE_GYRO_MERIDIAN_COUNT,
  SUBSTRATE_GYRO_PARALLEL_COUNT,
  SUBSTRATE_GYRO_PARTICLE_COUNT_DESKTOP,
  SUBSTRATE_GYRO_PARTICLE_COUNT_MOBILE,
  SUBSTRATE_GYRO_PARTICLE_OPACITY,
  SUBSTRATE_GYRO_PIVOT_OPACITY,
  SUBSTRATE_GYRO_POINT_SIZE,
  SUBSTRATE_GYRO_RING_LINE_OPACITY,
} from "./shellGeom";

interface ShellSubstrateGyroProps {
  layerKey: "substrate";
  reducedMotion?: boolean;
}

// ── Depth-fade line shader (front-bright / back-dim) ────────────────

const depthFadeVertex = /* glsl */ `
varying float vViewZ;
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vec4 mvCenter = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vViewZ = mvPosition.z - mvCenter.z;
}
`;

const depthFadeFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uNearZ;
uniform float uFarZ;
varying float vViewZ;
void main() {
  float depthFade = smoothstep(uFarZ, uNearZ, vViewZ);
  float alpha = uOpacity * depthFade;
  if (alpha < 0.008) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

function makeDepthFadeLineMaterial(color: THREE.Color, opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: depthFadeVertex,
    fragmentShader: depthFadeFragment,
    uniforms: {
      uColor: { value: color.clone() },
      uOpacity: { value: opacity },
      uNearZ: { value: SUBSTRATE_GYRO_DEPTH_NEAR },
      uFarZ: { value: SUBSTRATE_GYRO_DEPTH_FAR },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// ── Soft-dot surface particle shader ────────────────────────────────

const gyroParticleVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
attribute float aSeed;
attribute float aRank;
attribute float aTint;
varying float vSeed;
varying float vRank;
varying float vTint;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = max(0.4, -mv.z);
  float sizeFactor = clamp(6.0 / dist, 0.5, 2.4);
  gl_PointSize = uPointSize * uPixelRatio * sizeFactor * mix(0.7, 1.55, aRank);
  vSeed = aSeed;
  vRank = aRank;
  vTint = aTint;
}
`;

const gyroParticleFragment = /* glsl */ `
uniform vec3 uColorWarm;
uniform vec3 uColorCool;
uniform float uOpacity;
varying float vSeed;
varying float vRank;
varying float vTint;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float coreR = mix(0.10, 0.18, vRank);
  float core = smoothstep(coreR, 0.0, d);
  float halo = smoothstep(0.5, 0.14, d);
  float soft = max(core, halo * 0.5);
  float jitter = 0.7 + fract(vSeed * 41.0) * 0.3;
  vec3 col = mix(uColorCool, uColorWarm, vTint);
  float alpha = soft * uOpacity * jitter;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col, alpha);
}
`;

function makeParticleMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: gyroParticleVertex,
    fragmentShader: gyroParticleFragment,
    uniforms: {
      uPointSize: { value: SUBSTRATE_GYRO_POINT_SIZE },
      uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
      uColorWarm: { value: new THREE.Color(COLOR_GOLD) },
      uColorCool: { value: new THREE.Color(COLOR_DAWN) },
      uOpacity: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

// ── Geometry builders ───────────────────────────────────────────────

function buildGreatCircle(
  radius: number,
  segments = SUBSTRATE_GYRO_GLOBE_SEGMENTS
): THREE.BufferGeometry {
  const positions = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * radius;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = Math.sin(a) * radius;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

/** Latitude parallel (small circle) at `latRad` from the equator. */
function buildParallel(
  radius: number,
  latRad: number,
  segments = SUBSTRATE_GYRO_GLOBE_SEGMENTS
): THREE.BufferGeometry {
  const y = Math.sin(latRad) * radius;
  const r = Math.cos(latRad) * radius;
  const positions = new Float32Array((segments + 1) * 3);
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(a) * r;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

function addRankTint(geom: THREE.BufferGeometry, count: number, warmBias: number): void {
  const ranks = new Float32Array(count);
  const tints = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    ranks[i] = Math.random() < 0.18 ? 0.8 + Math.random() * 0.2 : Math.random() * 0.45;
    tints[i] = Math.random() < warmBias ? 0.7 + Math.random() * 0.3 : Math.random() * 0.35;
  }
  geom.setAttribute("aRank", new THREE.BufferAttribute(ranks, 1));
  geom.setAttribute("aTint", new THREE.BufferAttribute(tints, 1));
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const PIVOT_SIZE = 0.028;

export function ShellSubstrateGyro({ layerKey, reducedMotion = false }: ShellSubstrateGyroProps) {
  void layerKey;

  const ringCount = useGyroLabStore((s) => s.ringCount);
  const showParticles = useGyroLabStore((s) => s.showParticles);
  const globeRadius = useGyroLabStore((s) => s.globeRadius);
  const globeDensity = useGyroLabStore((s) => s.globeDensity);
  const particleDensity = useGyroLabStore((s) => s.particleDensity);

  const motionFrozen = useMemo(() => reducedMotion || prefersReducedMotion(), [reducedMotion]);

  const rootRef = useRef<THREE.Group>(null);
  const globeSpinRef = useRef<THREE.Group>(null);
  const ringSpinRefs = useRef<(THREE.Group | null)[]>([]);

  const effectiveRingCount = Math.min(Math.max(0, ringCount), SUBSTRATE_GYRO_GIMBAL_RINGS.length);

  const geom = useMemo(() => {
    const meridianCount = Math.max(3, Math.round(SUBSTRATE_GYRO_MERIDIAN_COUNT * globeDensity));
    const parallelCount = Math.max(2, Math.round(SUBSTRATE_GYRO_PARALLEL_COUNT * globeDensity));

    const meridians: THREE.BufferGeometry[] = [];
    for (let i = 0; i < meridianCount; i++) {
      meridians.push(buildGreatCircle(globeRadius));
    }

    const parallels: THREE.BufferGeometry[] = [];
    for (let i = 0; i < parallelCount; i++) {
      const t = (i + 1) / (parallelCount + 1);
      const lat = (t - 0.5) * Math.PI * 0.88;
      parallels.push(buildParallel(globeRadius, lat));
    }
    const equator = buildGreatCircle(globeRadius);

    const gimbalRings: THREE.BufferGeometry[] = [];
    for (let i = 0; i < SUBSTRATE_GYRO_GIMBAL_RINGS.length; i++) {
      gimbalRings.push(buildGreatCircle(SUBSTRATE_GYRO_GIMBAL_RINGS[i].radius));
    }

    const particleCount = Math.max(
      24,
      Math.round(
        (reducedMotion
          ? SUBSTRATE_GYRO_PARTICLE_COUNT_MOBILE
          : SUBSTRATE_GYRO_PARTICLE_COUNT_DESKTOP) * particleDensity
      )
    );
    const particles = buildSphereCloudGeometry(globeRadius, particleCount);
    addRankTint(particles, particleCount, 0.3);

    const pivot = buildDiamondGeometry(PIVOT_SIZE);

    return {
      meridians,
      parallels,
      equator,
      gimbalRings,
      particles,
      pivot,
      meridianCount,
      parallelCount,
    };
  }, [globeRadius, globeDensity, particleDensity, reducedMotion]);

  const mats = useMemo(() => {
    const gold = new THREE.Color(COLOR_GOLD);
    const dawn = new THREE.Color(COLOR_DAWN);
    return {
      meridian: makeDepthFadeLineMaterial(dawn, SUBSTRATE_GYRO_GLOBE_LINE_OPACITY),
      parallel: makeDepthFadeLineMaterial(dawn, SUBSTRATE_GYRO_GLOBE_LINE_OPACITY * 0.85),
      equator: makeDepthFadeLineMaterial(gold, SUBSTRATE_GYRO_GLOBE_EQUATOR_OPACITY),
      ring: makeDepthFadeLineMaterial(gold, SUBSTRATE_GYRO_RING_LINE_OPACITY),
      pivot: makeMeshMaterial(COLOR_GOLD, SUBSTRATE_GYRO_PIVOT_OPACITY),
      particle: makeParticleMaterial(),
    };
  }, []);

  useEffect(() => {
    return () => {
      geom.meridians.forEach((g) => g.dispose());
      geom.parallels.forEach((g) => g.dispose());
      geom.equator.dispose();
      geom.gimbalRings.forEach((g) => g.dispose());
      geom.particles.dispose();
      geom.pivot.dispose();
    };
  }, [geom]);

  useEffect(() => {
    return () => {
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [mats]);

  useFrame((state, delta) => {
    const root = rootRef.current;
    const globeSpin = globeSpinRef.current;
    if (!root || !globeSpin) return;

    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      root.visible = false;
      return;
    }

    const layers = getBrandmarkAccretionLayers(paintProgress);
    const reveal = layers.substrate;
    if (reveal <= EMERGE_EPSILON) {
      root.visible = false;
      return;
    }
    root.visible = true;

    const dt = Math.min(0.1, delta);
    const { idleSpeed } = useGyroLabStore.getState();

    const wrap = shellWrapEmerge(reveal);
    root.scale.setScalar(wrap.scale);

    const opacityCalm = 1 - (1 - SUBSTRATE_GYRO_ENCODE_OPACITY_FLOOR) * layers.orbits;
    const presence = wrap.presence * opacityCalm;

    const lineOpacity = (base: number) => base * presence;
    mats.meridian.uniforms.uOpacity.value = lineOpacity(SUBSTRATE_GYRO_GLOBE_LINE_OPACITY);
    mats.parallel.uniforms.uOpacity.value = lineOpacity(SUBSTRATE_GYRO_GLOBE_LINE_OPACITY * 0.85);
    mats.equator.uniforms.uOpacity.value = lineOpacity(SUBSTRATE_GYRO_GLOBE_EQUATOR_OPACITY);
    mats.ring.uniforms.uOpacity.value = lineOpacity(SUBSTRATE_GYRO_RING_LINE_OPACITY);
    mats.pivot.opacity = SUBSTRATE_GYRO_PIVOT_OPACITY * presence;
    mats.particle.uniforms.uPixelRatio.value = state.viewport.dpr;
    mats.particle.uniforms.uOpacity.value = SUBSTRATE_GYRO_PARTICLE_OPACITY * presence;

    if (motionFrozen) {
      globeSpin.rotation.y = 0.4;
    } else {
      globeSpin.rotation.y += SUBSTRATE_GYRO_GLOBE_SPIN * idleSpeed * dt;
    }

    for (let i = 0; i < effectiveRingCount; i++) {
      const spinNode = ringSpinRefs.current[i];
      if (!spinNode || motionFrozen) continue;
      spinNode.rotation.y += SUBSTRATE_GYRO_GIMBAL_RINGS[i].spin * idleSpeed * dt;
    }
  });

  return (
    <group ref={rootRef} visible={false}>
      {/* Globe spin group — meridians, parallels, equator, particles */}
      <group ref={globeSpinRef}>
        {geom.meridians.map((g, i) => {
          const angle = (i / geom.meridianCount) * Math.PI;
          return (
            <group key={`meridian-${i}`} rotation={[angle, 0, 0]}>
              <lineLoop geometry={g} material={mats.meridian} frustumCulled={false} />
            </group>
          );
        })}

        {geom.parallels.map((g, i) => (
          <lineLoop
            key={`parallel-${i}`}
            geometry={g}
            material={mats.parallel}
            frustumCulled={false}
          />
        ))}

        <lineLoop geometry={geom.equator} material={mats.equator} frustumCulled={false} />

        {showParticles && (
          <points geometry={geom.particles} material={mats.particle} frustumCulled={false} />
        )}
      </group>

      {/* Gimbal cage — counter-rotating rings + pivot diamonds */}
      {SUBSTRATE_GYRO_GIMBAL_RINGS.slice(0, effectiveRingCount).map((axis, ringIdx) => (
        <group key={`gimbal-ring-${ringIdx}`} rotation={[axis.tilt[0], axis.tilt[1], axis.tilt[2]]}>
          <group
            ref={(node) => {
              ringSpinRefs.current[ringIdx] = node;
            }}
          >
            <lineLoop
              geometry={geom.gimbalRings[ringIdx]}
              material={mats.ring}
              frustumCulled={false}
            />
            {/* Pivot diamonds at 0° and 180° on each ring */}
            {[0, Math.PI].map((a, pi) => (
              <mesh
                key={`pivot-${ringIdx}-${pi}`}
                geometry={geom.pivot}
                material={mats.pivot}
                position={[Math.cos(a) * axis.radius, 0, Math.sin(a) * axis.radius]}
                frustumCulled={false}
              />
            ))}
          </group>
        </group>
      ))}
    </group>
  );
}
