"use client";

/**
 * ShellSubstrate — Navigate layer 1 of the accreted intelligence shell.
 * Wraps the guiding-star brandmark with the migrated Thoughtform compass
 * read: 4 concentric rings, bearing crosshair + ticks, cardinal markers,
 * and two atmosphere orbit dots.
 *
 * The rings + crosshair + ticks reproduce the opening-beat compass
 * (`ThoughtformCompassGate`) EXACTLY — same radii, dash, colours — so
 * the instrument frames the mark like the previous second section. The
 * whole compass is flat / camera-facing with only a slow breath spin.
 *
 * ORGANIC UNFOLD: rather than fading in, the compass deploys as a
 * staggered geometric cascade — each ring (outer → inner) then the
 * reticle (crosshair + ticks + cardinals + dots) wraps in via
 * `foldEmerge` on its own slot of the substrate reveal window. Full
 * opacity throughout (brandmark Principle 4: geometric emerge).
 *
 * EVOLUTION:
 *   - 2026-06-05: dodecahedron → gold geodesic icosphere.
 *   - 2026-06-06: dropped dawn inner geodesic; shellWrapEmerge.
 *   - 2026-06-07: geodesic replaced by compass instrument; rings sized
 *     to the opening-beat compass; organic staggered unfold.
 *   - 2026-06-07 (later): removed the eight-ball horizon / pitch-ladder
 *     attitude read (the gimbal-tilted ellipses) — the flat compass is
 *     the whole read now.
 *
 * PERSISTS through Encode + Build around `ProjectedBrandmarkActor`.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COLOR_DAWN } from "@/components/landing/intelligence-artifact/artifactGeom";
// Substrate-sphere gold — more-yellow `#caa554` (2026-06-25 harmonization).
import { SPHERE_GOLD as COLOR_GOLD } from "@/lib/home-v2/goldPalette";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getSmoothedAccretionLayers } from "../motionFollower";
import {
  EMERGE_EPSILON,
  foldEmerge,
  petalStagger,
  SUBSTRATE_COMPASS_BREATH_RATE,
  SUBSTRATE_COMPASS_CROSSHAIR_INNER,
  SUBSTRATE_COMPASS_CROSSHAIR_OUTER,
  SUBSTRATE_COMPASS_ORBIT_DOT_1,
  SUBSTRATE_COMPASS_ORBIT_DOT_2,
  SUBSTRATE_COMPASS_RING_ALPHA,
  SUBSTRATE_COMPASS_RING_DASH,
  SUBSTRATE_COMPASS_RING_RADII,
  SUBSTRATE_COMPASS_RING_SEGMENTS,
  SUBSTRATE_COMPASS_SHELL_OPACITY,
  SUBSTRATE_COMPASS_TICK_INNER,
  SUBSTRATE_COMPASS_TICK_OUTER,
} from "./shellGeom";

interface ShellSubstrateProps {
  layerKey: "substrate";
  reducedMotion?: boolean;
}

const TICK_ANGLES_DEG = [30, 60, 120, 150, 210, 240, 300, 330];

const RING_COLORS = [COLOR_DAWN, COLOR_DAWN, COLOR_GOLD, COLOR_GOLD] as const;

/** Organic unfold: the compass deploys as a staggered cascade rather
 *  than fading in. Each part rides its own slot in the substrate reveal
 *  window and wraps in via `foldEmerge` (oversized → settle). Slot
 *  order acquires/locks inward: the rings close from outer to inner,
 *  then the reticle (crosshair + ticks + cardinals + atmosphere dots)
 *  snaps in last. */
const UNFOLD_SLOTS = 5;
const UNFOLD_OVERLAP = 0.5;
/** Slot index per ring (rings array is outer→inner: index 0 = outer). */
const RING_SLOT_BASE = 0;
const DETAILS_SLOT = 4;

// ── Radar sweep (reference: thoughtform-flythrough Navigate shell) ──
/** Arm reaches the outer ring. */
const RADAR_ARM_R = SUBSTRATE_COMPASS_RING_RADII[0];
/** Sweep rotation rate (rad/s). Subtle — well below the reference's 1.1. */
const RADAR_SWEEP_RATE = 0.32;
/** Trailing wedge angle behind the leading arm (radians). */
const RADAR_TAIL_RAD = 0.62;
const RADAR_ARM_ALPHA = 0.5;
const RADAR_WEDGE_ALPHA = 0.1;

// ── Radar contact blip (occasionally lights up + fades out) ─────────
const BLIP_SIZE = 0.014;
const BLIP_PEAK_ALPHA = 0.95;
/** Seconds between blips (randomised in this range). */
const BLIP_MIN_GAP = 2.6;
const BLIP_MAX_GAP = 5.8;
/** Blip light-up + fade duration (seconds). */
const BLIP_DURATION = 0.95;
/** Fraction of the duration spent rising (rest fades out). */
const BLIP_RISE_FRAC = 0.16;
/** Radial band the blip can appear in (world units). */
const BLIP_R_MIN = 0.22;
const BLIP_R_MAX = 0.7;

/** Trailing sweep wedge: a thin triangle fan from centre spanning
 *  `tailRad` behind the leading arm (which sits at local angle 0). */
function buildSweepWedgeGeometry(
  radius: number,
  tailRad: number,
  segments = 20
): THREE.BufferGeometry {
  const positions: number[] = [0, 0, 0];
  for (let i = 0; i <= segments; i++) {
    const a = -tailRad + (i / segments) * tailRad;
    positions.push(Math.cos(a) * radius, Math.sin(a) * radius, 0);
  }
  const index: number[] = [];
  for (let i = 1; i <= segments; i++) index.push(0, i, i + 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  return g;
}

function buildCircleGeometry(radius: number, segments: number): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

function buildSegmentsGeometry(verts: [number, number, number][]): THREE.BufferGeometry {
  return new THREE.BufferGeometry().setFromPoints(
    verts.map((v) => new THREE.Vector3(v[0], v[1], v[2]))
  );
}

function computeLineDistancesOnGeometry(geom: THREE.BufferGeometry): void {
  const positionAttribute = geom.attributes.position;
  const lineDistances: number[] = [0];
  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  for (let i = 1; i < positionAttribute.count; i++) {
    start.fromBufferAttribute(positionAttribute, i - 1);
    end.fromBufferAttribute(positionAttribute, i);
    lineDistances[i] = lineDistances[i - 1] + start.distanceTo(end);
  }
  geom.setAttribute("lineDistance", new THREE.Float32BufferAttribute(lineDistances, 1));
}

function buildTickVerts(): [number, number, number][] {
  const verts: [number, number, number][] = [];
  for (const angDeg of TICK_ANGLES_DEG) {
    const a = (angDeg * Math.PI) / 180;
    const cx = Math.cos(a);
    const cy = Math.sin(a);
    verts.push([cx * SUBSTRATE_COMPASS_TICK_INNER, cy * SUBSTRATE_COMPASS_TICK_INNER, 0.02]);
    verts.push([cx * SUBSTRATE_COMPASS_TICK_OUTER, cy * SUBSTRATE_COMPASS_TICK_OUTER, 0.02]);
  }
  return verts;
}

const CROSSHAIR_VERTS: [number, number, number][] = [
  [0, SUBSTRATE_COMPASS_CROSSHAIR_INNER, 0.02],
  [0, SUBSTRATE_COMPASS_CROSSHAIR_OUTER, 0.02],
  [0, -SUBSTRATE_COMPASS_CROSSHAIR_INNER, 0.02],
  [0, -SUBSTRATE_COMPASS_CROSSHAIR_OUTER, 0.02],
  [-SUBSTRATE_COMPASS_CROSSHAIR_INNER, 0, 0.02],
  [-SUBSTRATE_COMPASS_CROSSHAIR_OUTER, 0, 0.02],
  [SUBSTRATE_COMPASS_CROSSHAIR_INNER, 0, 0.02],
  [SUBSTRATE_COMPASS_CROSSHAIR_OUTER, 0, 0.02],
];

type RingMaterial = THREE.LineBasicMaterial | THREE.LineDashedMaterial;

export function ShellSubstrate({ layerKey, reducedMotion = false }: ShellSubstrateProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const instrumentRef = useRef<THREE.Group>(null);
  const detailsRef = useRef<THREE.Group>(null);
  const ringScaleRefs = useRef<(THREE.Group | null)[]>([]);
  const orbitDot1Ref = useRef<THREE.Group>(null);
  const orbitDot2Ref = useRef<THREE.Group>(null);
  const radarSweepRef = useRef<THREE.Group>(null);
  const blipRef = useRef<THREE.Mesh>(null);
  // Blip scheduler — `next` is the elapsed time of the next blip;
  // `start` is the elapsed time the current blip began (-1 = idle).
  const blipState = useRef({ initialized: false, next: 0, start: -1 });

  const ringGeoms = useMemo(
    () =>
      SUBSTRATE_COMPASS_RING_RADII.map((r, i) => {
        const g = buildCircleGeometry(r, SUBSTRATE_COMPASS_RING_SEGMENTS);
        if (SUBSTRATE_COMPASS_RING_DASH[i]) computeLineDistancesOnGeometry(g);
        return g;
      }),
    []
  );

  const crosshairGeom = useMemo(() => buildSegmentsGeometry(CROSSHAIR_VERTS), []);
  const ticksGeom = useMemo(() => buildSegmentsGeometry(buildTickVerts()), []);
  const orbitDot1Geom = useMemo(
    () => new THREE.CircleGeometry(SUBSTRATE_COMPASS_ORBIT_DOT_1.size, 20),
    []
  );
  const orbitDot2Geom = useMemo(
    () => new THREE.CircleGeometry(SUBSTRATE_COMPASS_ORBIT_DOT_2.size, 20),
    []
  );
  const radarArmGeom = useMemo(
    () =>
      buildSegmentsGeometry([
        [0, 0, 0.022],
        [RADAR_ARM_R, 0, 0.022],
      ]),
    []
  );
  const sweepWedgeGeom = useMemo(() => buildSweepWedgeGeometry(RADAR_ARM_R, RADAR_TAIL_RAD), []);
  const blipGeom = useMemo(() => new THREE.CircleGeometry(BLIP_SIZE, 18), []);

  const ringMats = useMemo<RingMaterial[]>(() => {
    return SUBSTRATE_COMPASS_RING_ALPHA.map((alpha, i) => {
      const dash = SUBSTRATE_COMPASS_RING_DASH[i];
      const color = new THREE.Color(RING_COLORS[i]);
      const mat: RingMaterial = dash
        ? new THREE.LineDashedMaterial({
            color,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false,
            dashSize: dash.dashSize,
            gapSize: dash.gapSize,
          })
        : new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false,
          });
      (mat.userData as { baseAlpha: number }).baseAlpha = alpha;
      return mat;
    });
  }, []);

  const bearingsMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(COLOR_DAWN),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );

  const orbitDot1Mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(COLOR_GOLD),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    []
  );
  const orbitDot2Mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(COLOR_DAWN),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    []
  );
  const radarArmMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(COLOR_GOLD),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    []
  );
  const sweepWedgeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(COLOR_GOLD),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const blipMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(COLOR_GOLD),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useEffect(() => {
    return () => {
      ringGeoms.forEach((g) => g.dispose());
      crosshairGeom.dispose();
      ticksGeom.dispose();
      orbitDot1Geom.dispose();
      orbitDot2Geom.dispose();
      radarArmGeom.dispose();
      sweepWedgeGeom.dispose();
      blipGeom.dispose();
      ringMats.forEach((m) => m.dispose());
      bearingsMat.dispose();
      orbitDot1Mat.dispose();
      orbitDot2Mat.dispose();
      radarArmMat.dispose();
      sweepWedgeMat.dispose();
      blipMat.dispose();
    };
  }, [
    ringGeoms,
    crosshairGeom,
    ticksGeom,
    orbitDot1Geom,
    orbitDot2Geom,
    radarArmGeom,
    sweepWedgeGeom,
    blipGeom,
    ringMats,
    bearingsMat,
    orbitDot1Mat,
    orbitDot2Mat,
    radarArmMat,
    sweepWedgeMat,
    blipMat,
  ]);

  const hideAll = () => {
    ringMats.forEach((m) => {
      m.opacity = 0;
    });
    bearingsMat.opacity = 0;
    orbitDot1Mat.opacity = 0;
    orbitDot2Mat.opacity = 0;
    radarArmMat.opacity = 0;
    sweepWedgeMat.opacity = 0;
    blipMat.opacity = 0;
  };

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    const { active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      group.visible = false;
      hideAll();
      return;
    }

    // Temporally-smoothed reveal (motionFollower) — see ShellSubstrateGyro.
    const reveal = getSmoothedAccretionLayers().substrate;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      hideAll();
      return;
    }
    group.visible = true;

    // Materials hold FULL target opacity once revealed — the emerge is
    // GEOMETRIC (staggered per-part scale unfold below), never an
    // opacity fade (brandmark Principle 4).
    const shellOpacity = SUBSTRATE_COMPASS_SHELL_OPACITY;

    for (const mat of ringMats) {
      const base = (mat.userData as { baseAlpha: number }).baseAlpha;
      mat.opacity = shellOpacity * base;
    }
    bearingsMat.opacity = shellOpacity * 0.78;
    orbitDot1Mat.opacity = shellOpacity * SUBSTRATE_COMPASS_ORBIT_DOT_1.alpha;
    orbitDot2Mat.opacity = shellOpacity * SUBSTRATE_COMPASS_ORBIT_DOT_2.alpha;
    radarArmMat.opacity = shellOpacity * RADAR_ARM_ALPHA;
    sweepWedgeMat.opacity = shellOpacity * RADAR_WEDGE_ALPHA;

    // ── Organic unfold: staggered per-part wrap-in (geometric) ──────
    for (let i = 0; i < ringScaleRefs.current.length; i++) {
      const wrap = ringScaleRefs.current[i];
      if (!wrap) continue;
      const s = foldEmerge(
        petalStagger(reveal, RING_SLOT_BASE + i, UNFOLD_SLOTS, UNFOLD_OVERLAP)
      ).scale;
      wrap.visible = s > EMERGE_EPSILON;
      wrap.scale.setScalar(Math.max(s, 1e-4));
    }
    const detScale = foldEmerge(
      petalStagger(reveal, DETAILS_SLOT, UNFOLD_SLOTS, UNFOLD_OVERLAP)
    ).scale;
    if (detailsRef.current) {
      detailsRef.current.visible = detScale > EMERGE_EPSILON;
      detailsRef.current.scale.setScalar(Math.max(detScale, 1e-4));
    }

    const t = state.clock.elapsedTime;

    // Whole instrument: slow breath spin (matches the opening compass).
    if (instrumentRef.current) {
      instrumentRef.current.rotation.z = reducedMotion ? 0 : t * SUBSTRATE_COMPASS_BREATH_RATE;
    }

    // Atmosphere orbit dots — independent continuous rotation.
    if (orbitDot1Ref.current) {
      orbitDot1Ref.current.rotation.z = reducedMotion
        ? 0
        : t * SUBSTRATE_COMPASS_ORBIT_DOT_1.angularVelocity;
    }
    if (orbitDot2Ref.current) {
      orbitDot2Ref.current.rotation.z = reducedMotion
        ? 0
        : t * SUBSTRATE_COMPASS_ORBIT_DOT_2.angularVelocity;
    }

    // ── Radar sweep arm + occasional contact blip ───────────────────
    if (radarSweepRef.current) {
      // Leading arm sits at local +X; negative z-rotation sweeps it
      // clockwise. Frozen under reduced motion.
      radarSweepRef.current.rotation.z = reducedMotion ? 0 : -t * RADAR_SWEEP_RATE;
    }

    const blip = blipState.current;
    if (reducedMotion) {
      blipMat.opacity = 0;
    } else {
      if (!blip.initialized) {
        blip.initialized = true;
        blip.next = t + BLIP_MIN_GAP + Math.random() * (BLIP_MAX_GAP - BLIP_MIN_GAP);
      }
      // Start a new blip at a fresh contact point.
      if (blip.start < 0 && t >= blip.next) {
        blip.start = t;
        const ang = Math.random() * Math.PI * 2;
        const rr = BLIP_R_MIN + Math.random() * (BLIP_R_MAX - BLIP_R_MIN);
        if (blipRef.current)
          blipRef.current.position.set(Math.cos(ang) * rr, Math.sin(ang) * rr, 0.03);
      }
      if (blip.start >= 0) {
        const e = (t - blip.start) / BLIP_DURATION;
        if (e >= 1) {
          // Done — schedule the next blip.
          blip.start = -1;
          blip.next = t + BLIP_MIN_GAP + Math.random() * (BLIP_MAX_GAP - BLIP_MIN_GAP);
          blipMat.opacity = 0;
        } else {
          // Quick rise, slow fade.
          const env =
            e < BLIP_RISE_FRAC
              ? e / BLIP_RISE_FRAC
              : 1 - (e - BLIP_RISE_FRAC) / (1 - BLIP_RISE_FRAC);
          blipMat.opacity = shellOpacity * BLIP_PEAK_ALPHA * Math.max(0, env);
        }
      } else {
        blipMat.opacity = 0;
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={instrumentRef}>
        {/* Flat camera-facing compass — the dominant read. Each ring
            sits in its own scale group so it can wrap in on its own
            slot of the unfold cascade. */}
        {ringGeoms.map((g, i) => (
          <group
            key={`compass-ring-${i}`}
            ref={(node) => {
              ringScaleRefs.current[i] = node;
            }}
          >
            <lineLoop geometry={g} material={ringMats[i]} frustumCulled={false} />
          </group>
        ))}

        {/* Reticle details — crosshair, ticks, atmosphere dots — snap in
            last as one unfold slot. (Cardinal diamond markers removed —
            Encode primitive labels own N/E/S/W.) */}
        <group ref={detailsRef}>
          <lineSegments geometry={crosshairGeom} material={bearingsMat} frustumCulled={false} />
          <lineSegments geometry={ticksGeom} material={bearingsMat} frustumCulled={false} />

          {/* Atmosphere orbit dots. */}
          <group ref={orbitDot1Ref}>
            <mesh
              geometry={orbitDot1Geom}
              material={orbitDot1Mat}
              position={[SUBSTRATE_COMPASS_ORBIT_DOT_1.radius, 0, 0.01]}
            />
          </group>
          <group ref={orbitDot2Ref}>
            <mesh
              geometry={orbitDot2Geom}
              material={orbitDot2Mat}
              position={[-SUBSTRATE_COMPASS_ORBIT_DOT_2.radius, 0, 0.01]}
            />
          </group>

          {/* Radar sweep — leading arm + faint trailing wedge,
              rotating subtly around the mark. */}
          <group ref={radarSweepRef}>
            <mesh geometry={sweepWedgeGeom} material={sweepWedgeMat} frustumCulled={false} />
            <lineSegments geometry={radarArmGeom} material={radarArmMat} frustumCulled={false} />
          </group>

          {/* Radar contact blip — lights up + fades out occasionally. */}
          <mesh ref={blipRef} geometry={blipGeom} material={blipMat} frustumCulled={false} />
        </group>
      </group>
    </group>
  );
}
