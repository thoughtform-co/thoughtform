"use client";

/**
 * ContinuumBand — the WebGL "continuum band" layer (ADR-049 band rev).
 *
 * Integrates the tool ↔ collaborator spectrum INTO the armillary's
 * near-horizontal Saturn waist ring, as a layer ADDED to the brandmark in
 * the #continuum beat. The edge-on waist plane — which made the retired
 * `ContinuumWaistRail` thumb read as a tiny dot — is turned into the feature:
 * a band with real 3D thickness reads edge-on as a bold horizontal BEAM
 * crossing the mark's centre, weaving in front of and behind it.
 *
 * The layer (all inside ONE group rotated to the waist plane, so it shares
 * the rig's billboard + pointer-look for free):
 *   · the two companion ellipses + a sparse particle annulus → the beam body
 *     (the existing waist Line2 stays the spine, re-brightening via the
 *     HologramOrbits per-ring getter — this layer sits WITH it);
 *   · graduation ticks crossing the beam along the plane normal (ruler ticks);
 *   · Tool / Collaborator pole diamonds at f = 1/6, 5/6;
 *   · a camera-facing traveler reticle + plane-local plumb pin riding the
 *     front arc on the shared `continuumThumbFraction` ping-pong.
 *
 * Every marker is placed with `bandRingPoint` (continuumBandMath), which
 * reuses the drawn ring's own parametrization, so nothing drifts off the
 * line. All formation is gated by `formTGetter` → the layer is fully inert
 * (root.visible = false, one ref read/frame) off the continuum beat. Counts
 * flow through the ADR-038 governor; no custom shader (PointsMaterial handles
 * the DPR contract internally); no text (labels stay DOM). Lab-driven at
 * /test/continuum-band; production wiring is a documented follow-up.
 */

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { type ComponentRef, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { SERVICES_GOLD, TENSOR_ACCENT } from "@/lib/home-v2/goldPalette";
import { useCorridorCount } from "@/lib/hooks/useQualityTier";
import { clamp01 } from "@/lib/math";
import {
  THUMB_TICK_FRACTIONS,
  continuumApproachT,
  continuumThumbFraction,
} from "@/lib/services-ring/continuumStageMath";
import { continuumStageProgressRef } from "@/lib/services-ring/continuumStageProgressRef";
import {
  BAND_INNER_MUL,
  BAND_LINES_WINDOW,
  BAND_MINOR_TICKS_PER_SPAN,
  BAND_OUTER_MUL,
  BAND_PARTICLES_DESKTOP,
  BAND_PARTICLES_MOBILE,
  BAND_PARTICLES_TABLET,
  BAND_PARTICLES_WINDOW,
  BAND_PARTICLE_SIZE,
  BAND_PARTICLE_Z_JITTER,
  BAND_PIN_HALF,
  BAND_POLES_WINDOW,
  BAND_POLE_R,
  BAND_TICKS_WINDOW,
  BAND_TICK_MAJOR_HALF,
  BAND_TICK_MINOR_HALF,
  BAND_TRAVELER_CENTRE_POP,
  BAND_TRAVELER_WINDOW,
  bandMinorTickFractions,
  bandRevealT,
  bandRingPoint,
  buildBandParticles,
  travelerCentreWeight,
} from "@/lib/services-ring/continuumBandMath";
import { DEFAULT_ORBITS, STRUCTURAL_ORBITS, type OrbitConfig } from "./HologramOrbits";

/** The waist ring the band lives on — derived live so radius / tilt / ecc can
 *  never drift from the drawn line (shared by STRUCTURAL + DEFAULT orbits). */
const WAIST: OrbitConfig =
  STRUCTURAL_ORBITS.find((o) => o.id === "shell-waist") ?? DEFAULT_ORBITS[0];
const WAIST_ECC = WAIST.eccentricity ?? 0.96;
const WAIST_SEGMENTS = 180;

const THUMB_PERIOD_S = 7;

/** Base material opacities — every companion/annulus base sits at or below the
 *  waist line's 0.68 (recessive law); the small traveler elements are the
 *  sanctioned focal marker. */
const LINE_INNER_OPACITY = 0.34;
const LINE_OUTER_OPACITY = 0.26;
const PARTICLE_OPACITY = 0.38;
const TICK_OPACITY = 0.5;
const POLE_OPACITY = 0.85;
const PIN_OPACITY = 0.6;
const RETICLE_RING_OPACITY = 0.9;
const RETICLE_CORE_OPACITY = 0.95;
const RETICLE_HALO_OPACITY = 0.16;

/** Smootherstep helper (the ringMath/HologramOrbits guard-shape). */
function smoothgate(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** One companion ellipse — the buildRing recipe (front-bright / back-dim
 *  depth colours baked from the waist tilt, so the near arc weaves in front of
 *  the mark and the far arc behind it). */
function buildBandLine(
  radiusMul: number,
  color: string
): {
  points: THREE.Vector3[];
  colors: [number, number, number][];
} {
  const euler = new THREE.Euler(WAIST.tilt[0], WAIST.tilt[1], WAIST.tilt[2], "XYZ");
  const base = new THREE.Color(color);
  const scratch = new THREE.Vector3();
  const points: THREE.Vector3[] = [];
  const colors: [number, number, number][] = [];
  const r = WAIST.radius * radiusMul;
  const ry = r * WAIST_ECC;
  for (let i = 0; i <= WAIST_SEGMENTS; i++) {
    const a = (i / WAIST_SEGMENTS) * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * ry, 0);
    points.push(p);
    const rz = scratch.copy(p).applyEuler(euler).z;
    const frontness = clamp01((rz / r) * 0.5 + 0.5);
    const b = 0.16 + 0.84 * frontness;
    colors.push([base.r * b, base.g * b, base.b * b]);
  }
  return { points, colors };
}

export interface ContinuumBandProps {
  /** World scale shared with the armillary (ARMILLARY_SCALE = 0.62 live). */
  scale?: number;
  /** The formation clock (0 → 1). Default: the continuum approach alone; the
   *  live wiring passes `continuumFormT(aboutP, continuumP)` so the band
   *  pre-warms during the #about exit slide. */
  formTGetter?: () => number;
  // ── Lab tunables (default to the continuumBandMath constants) ──
  innerMul?: number;
  outerMul?: number;
  lineOpacityMul?: number;
  particleCount?: number;
  particleSize?: number;
  particleOpacity?: number;
  tickMajorHalf?: number;
  minorTicksPerSpan?: number;
  tickOpacity?: number;
  poleR?: number;
  travelerScaleMul?: number;
  travelerPeriodS?: number;
  zJitter?: number;
}

export function ContinuumBand({
  scale = 0.62,
  formTGetter,
  innerMul = BAND_INNER_MUL,
  outerMul = BAND_OUTER_MUL,
  lineOpacityMul = 1,
  particleCount,
  particleSize = BAND_PARTICLE_SIZE,
  particleOpacity = 1,
  tickMajorHalf = BAND_TICK_MAJOR_HALF,
  minorTicksPerSpan = BAND_MINOR_TICKS_PER_SPAN,
  tickOpacity = 1,
  poleR = BAND_POLE_R,
  travelerScaleMul = 1,
  travelerPeriodS = THUMB_PERIOD_S,
  zJitter = BAND_PARTICLE_Z_JITTER,
}: ContinuumBandProps) {
  const governedCount = useCorridorCount(
    BAND_PARTICLES_DESKTOP,
    BAND_PARTICLES_TABLET,
    BAND_PARTICLES_MOBILE
  );
  const effectiveCount = particleCount ?? governedCount;

  const rootRef = useRef<THREE.Group>(null);
  const innerLineRef = useRef<ComponentRef<typeof Line>>(null);
  const outerLineRef = useRef<ComponentRef<typeof Line>>(null);
  const particleMatRef = useRef<THREE.PointsMaterial>(null);
  const tickLineRef = useRef<ComponentRef<typeof Line>>(null);
  const poleToolRef = useRef<THREE.Mesh>(null);
  const poleCollabRef = useRef<THREE.Mesh>(null);
  const poleToolMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const poleCollabMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const pinRef = useRef<THREE.Group>(null);
  const pinLineRef = useRef<ComponentRef<typeof Line>>(null);
  const reticleRef = useRef<THREE.Group>(null);
  const reticleRingMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const reticleCoreMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const reticleHaloMatRef = useRef<THREE.MeshBasicMaterial>(null);

  const phaseRef = useRef(0);
  const qScratch = useRef(new THREE.Quaternion());

  const inner = useMemo(() => buildBandLine(innerMul, TENSOR_ACCENT), [innerMul]);
  const outer = useMemo(() => buildBandLine(outerMul, SERVICES_GOLD), [outerMul]);

  // The particle annulus — deterministic positions + a baked front/back +
  // Tool→Collaborator gradient. Keyed on the governed count so a governor step
  // rebuilds it once (ADR-038 pattern).
  const particleGeom = useMemo(() => {
    const { positions, muls } = buildBandParticles(
      effectiveCount,
      WAIST.radius,
      WAIST_ECC,
      zJitter
    );
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const euler = new THREE.Euler(WAIST.tilt[0], WAIST.tilt[1], WAIST.tilt[2], "XYZ");
    const innerCol = new THREE.Color(TENSOR_ACCENT);
    const outerCol = new THREE.Color(SERVICES_GOLD);
    const scratch = new THREE.Vector3();
    const col = new THREE.Color();
    const colors = new Float32Array(effectiveCount * 3);
    const span = Math.max(1e-6, BAND_OUTER_MUL - BAND_INNER_MUL);
    for (let i = 0; i < effectiveCount; i++) {
      const x = positions[i * 3];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const rz = scratch.set(x, y, z).applyEuler(euler).z;
      const frontness = clamp01((rz / WAIST.radius) * 0.5 + 0.5);
      const b = 0.3 + 0.7 * frontness;
      const t = clamp01((muls[i] - BAND_INNER_MUL) / span);
      col.copy(innerCol).lerp(outerCol, t).multiplyScalar(b);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geom.setDrawRange(0, 0);
    return geom;
  }, [effectiveCount, zJitter]);

  // Dispose the annulus geometry on unmount / count step (imperative geom).
  useEffect(() => () => particleGeom.dispose(), [particleGeom]);

  // Graduation ticks — one LineSegments2. Majors at THUMB_TICK_FRACTIONS,
  // minors between; each a segment along the plane normal (crossing the beam),
  // ordered f-ascending so the instanceCount reveal graduates left → right.
  const tickData = useMemo(() => {
    const majors = THUMB_TICK_FRACTIONS.map((f) => ({ f, major: true }));
    const minors = bandMinorTickFractions(minorTicksPerSpan).map((f) => ({ f, major: false }));
    const all = [...majors, ...minors].sort((p, q) => p.f - q.f);
    const points: [number, number, number][] = [];
    for (const { f, major } of all) {
      const [px, py] = bandRingPoint(f, 1, WAIST.radius, WAIST_ECC);
      const h = major ? tickMajorHalf : BAND_TICK_MINOR_HALF;
      points.push([px, py, -h]);
      points.push([px, py, h]);
    }
    return { points, count: all.length };
  }, [tickMajorHalf, minorTicksPerSpan]);

  // Pole marker positions (Tool, Collaborator).
  const [toolX, toolY] = bandRingPoint(THUMB_TICK_FRACTIONS[0], 1, WAIST.radius, WAIST_ECC);
  const [collabX, collabY] = bandRingPoint(
    THUMB_TICK_FRACTIONS[THUMB_TICK_FRACTIONS.length - 1],
    1,
    WAIST.radius,
    WAIST_ECC
  );

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (!root) return;
    const formT = formTGetter
      ? formTGetter()
      : continuumApproachT(continuumStageProgressRef.current.progress);
    const visible = formT > 0.002;
    root.visible = visible;
    if (!visible) return;

    // A soft global brightness gate so the first revealed segments don't pop
    // at full brightness (the count-based draw-on keeps the sweep read).
    const gate = smoothgate(0, 0.15, formT);

    // Companion lines — instanceCount draw-on + gated opacity.
    const linesT = bandRevealT(formT, BAND_LINES_WINDOW);
    const lineInstances = Math.max(0, Math.ceil(linesT * WAIST_SEGMENTS));
    if (innerLineRef.current) {
      innerLineRef.current.geometry.instanceCount = lineInstances;
      innerLineRef.current.material.opacity = LINE_INNER_OPACITY * lineOpacityMul * gate;
      innerLineRef.current.visible = innerLineRef.current.material.opacity > 0.002;
    }
    if (outerLineRef.current) {
      outerLineRef.current.geometry.instanceCount = lineInstances;
      outerLineRef.current.material.opacity = LINE_OUTER_OPACITY * lineOpacityMul * gate;
      outerLineRef.current.visible = outerLineRef.current.material.opacity > 0.002;
    }

    // Particle annulus — drawRange sweep + opacity.
    const partT = bandRevealT(formT, BAND_PARTICLES_WINDOW);
    particleGeom.setDrawRange(0, Math.floor(partT * effectiveCount));
    if (particleMatRef.current) {
      particleMatRef.current.opacity = PARTICLE_OPACITY * particleOpacity * partT;
      particleMatRef.current.visible = particleMatRef.current.opacity > 0.002;
    }

    // Ticks — graduate on left → right.
    const ticksT = bandRevealT(formT, BAND_TICKS_WINDOW);
    if (tickLineRef.current) {
      tickLineRef.current.geometry.instanceCount = Math.max(0, Math.ceil(ticksT * tickData.count));
      tickLineRef.current.material.opacity = TICK_OPACITY * tickOpacity * ticksT;
      tickLineRef.current.visible = tickLineRef.current.material.opacity > 0.002;
    }

    // Pole diamonds — opacity + a small scale settle.
    const polesT = bandRevealT(formT, BAND_POLES_WINDOW);
    const poleScale = 0.6 + 0.4 * polesT;
    if (poleToolRef.current) poleToolRef.current.scale.setScalar(poleScale);
    if (poleCollabRef.current) poleCollabRef.current.scale.setScalar(poleScale);
    if (poleToolMatRef.current) poleToolMatRef.current.opacity = POLE_OPACITY * polesT;
    if (poleCollabMatRef.current) poleCollabMatRef.current.opacity = POLE_OPACITY * polesT;

    // Traveler — the reticle rides the front arc on the shared ping-pong;
    // the plumb pin locks it to the band; front-centre emphasis brightens +
    // grows it as it crosses over the mark. Clamped-delta accumulator (no wall
    // clock — a hidden tab must not jump the phase).
    const travT = bandRevealT(formT, BAND_TRAVELER_WINDOW);
    if (formT > 0.02) phaseRef.current += Math.min(0.1, delta) / travelerPeriodS;
    const f = continuumThumbFraction(phaseRef.current);
    const [px, py] = bandRingPoint(f, 1, WAIST.radius, WAIST_ECC);
    const w = travelerCentreWeight(f);
    const glow = 0.7 + 0.3 * w;

    if (pinRef.current) pinRef.current.position.set(px, py, 0);
    if (pinLineRef.current) {
      pinLineRef.current.material.opacity = PIN_OPACITY * travT * glow;
      pinLineRef.current.visible = pinLineRef.current.material.opacity > 0.002;
    }

    const ret = reticleRef.current;
    if (ret && ret.parent) {
      ret.position.set(px, py, 0);
      // Billboard: cancel the parent's world rotation, then face the camera.
      ret.parent.getWorldQuaternion(qScratch.current);
      ret.quaternion.copy(qScratch.current).invert().multiply(state.camera.quaternion);
      const s = travelerScaleMul * (1 + BAND_TRAVELER_CENTRE_POP * w) * (0.85 + 0.15 * travT);
      ret.scale.setScalar(s);
      if (reticleRingMatRef.current)
        reticleRingMatRef.current.opacity = RETICLE_RING_OPACITY * travT * glow;
      if (reticleCoreMatRef.current)
        reticleCoreMatRef.current.opacity = RETICLE_CORE_OPACITY * travT * glow;
      if (reticleHaloMatRef.current)
        reticleHaloMatRef.current.opacity = RETICLE_HALO_OPACITY * travT * glow;
    }
  });

  return (
    <group ref={rootRef} visible={false}>
      <group rotation={WAIST.tilt} scale={scale}>
        {/* Companion ellipses — the beam's graduated body around the spine. */}
        <Line
          ref={innerLineRef}
          points={inner.points}
          vertexColors={inner.colors}
          lineWidth={1.15}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest
          blending={THREE.NormalBlending}
          toneMapped={false}
        />
        <Line
          ref={outerLineRef}
          points={outer.points}
          vertexColors={outer.colors}
          lineWidth={0.9}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest
          blending={THREE.NormalBlending}
          toneMapped={false}
        />

        {/* Particle annulus — the beam's luminous depth. */}
        <points geometry={particleGeom}>
          <pointsMaterial
            ref={particleMatRef}
            size={particleSize}
            sizeAttenuation
            vertexColors
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>

        {/* Graduation ticks — ruler strokes crossing the beam. */}
        <Line
          ref={tickLineRef}
          points={tickData.points}
          segments
          color={TENSOR_ACCENT}
          lineWidth={1.2}
          transparent
          opacity={0}
          depthWrite={false}
          depthTest
          blending={THREE.NormalBlending}
          toneMapped={false}
        />

        {/* Pole diamonds — Tool (left) + Collaborator (right). */}
        <mesh ref={poleToolRef} position={[toolX, toolY, 0]}>
          <octahedronGeometry args={[poleR, 0]} />
          <meshBasicMaterial
            ref={poleToolMatRef}
            color={TENSOR_ACCENT}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh ref={poleCollabRef} position={[collabX, collabY, 0]}>
          <octahedronGeometry args={[poleR, 0]} />
          <meshBasicMaterial
            ref={poleCollabMatRef}
            color={TENSOR_ACCENT}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Traveler plumb pin — plane-local, crosses the beam at the reticle. */}
        <group ref={pinRef}>
          <Line
            ref={pinLineRef}
            points={[
              [0, 0, -BAND_PIN_HALF],
              [0, 0, BAND_PIN_HALF],
            ]}
            color={TENSOR_ACCENT}
            lineWidth={1.4}
            transparent
            opacity={0}
            depthWrite={false}
            depthTest
            blending={THREE.NormalBlending}
            toneMapped={false}
          />
        </group>

        {/* Traveler reticle — camera-billboarded ring + core + halo. */}
        <group ref={reticleRef}>
          <mesh>
            <ringGeometry args={[0.058, 0.075, 40]} />
            <meshBasicMaterial
              ref={reticleRingMatRef}
              color={TENSOR_ACCENT}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <circleGeometry args={[0.022, 20]} />
            <meshBasicMaterial
              ref={reticleCoreMatRef}
              color={TENSOR_ACCENT}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <circleGeometry args={[0.11, 24]} />
            <meshBasicMaterial
              ref={reticleHaloMatRef}
              color={TENSOR_ACCENT}
              transparent
              opacity={0}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}
