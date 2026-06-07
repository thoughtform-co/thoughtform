"use client";

/**
 * ShellSubstrate — Navigate layer 1 of the accreted intelligence shell.
 * Wraps the guiding-star brandmark with the migrated Thoughtform compass
 * read: 4 concentric rings, bearing crosshair + ticks, atmosphere orbit
 * dots, and a FAINT eight-ball horizon / attitude cue behind them.
 *
 * The rings + crosshair + ticks reproduce the opening-beat compass
 * (`ThoughtformCompassGate`) EXACTLY — same radii, dash, colours — so
 * the instrument frames the mark like the previous second section. They
 * stay camera-facing (flat) with only a slow breath spin. The eight-ball
 * horizon / pitch ladder live on a separate sub-group that gimbal-tilts
 * for the attitude-sphere cue, without tilting the flat compass rings.
 *
 * EVOLUTION:
 *   - 2026-06-05: dodecahedron → gold geodesic icosphere.
 *   - 2026-06-06: dropped dawn inner geodesic; shellWrapEmerge.
 *   - 2026-06-07: geodesic replaced by compass instrument; rings sized
 *     to the opening-beat compass; gimbal tilt isolated to the
 *     eight-ball sub-group so the rings frame the mark like before.
 *
 * EMERGE: `shellWrapEmerge(reveal)` — contracts inward from outside.
 * PERSISTS through Encode + Build around `ProjectedBrandmarkActor`.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COLOR_DAWN, COLOR_GOLD } from "@/components/landing/intelligence-artifact/artifactGeom";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers } from "../sceneGeom";
import {
  EMERGE_EPSILON,
  SUBSTRATE_COMPASS_BREATH_RATE,
  SUBSTRATE_COMPASS_CARDINAL_DIAMOND,
  SUBSTRATE_COMPASS_CROSSHAIR_INNER,
  SUBSTRATE_COMPASS_CROSSHAIR_OUTER,
  SUBSTRATE_COMPASS_HORIZON_BAND_Y,
  SUBSTRATE_COMPASS_HORIZON_R,
  SUBSTRATE_COMPASS_ORBIT_DOT_1,
  SUBSTRATE_COMPASS_ORBIT_DOT_2,
  SUBSTRATE_COMPASS_PITCH_LADDER_DEG,
  SUBSTRATE_COMPASS_RING_ALPHA,
  SUBSTRATE_COMPASS_RING_DASH,
  SUBSTRATE_COMPASS_RING_RADII,
  SUBSTRATE_COMPASS_RING_SEGMENTS,
  SUBSTRATE_COMPASS_SHELL_OPACITY,
  SUBSTRATE_COMPASS_TICK_INNER,
  SUBSTRATE_COMPASS_TICK_OUTER,
  SUBSTRATE_COMPASS_TILT_AMP_X,
  SUBSTRATE_COMPASS_TILT_AMP_Z,
  SUBSTRATE_COMPASS_TILT_FREQ_X,
  SUBSTRATE_COMPASS_TILT_FREQ_Z,
  shellWrapEmerge,
} from "./shellGeom";

interface ShellSubstrateProps {
  layerKey: "substrate";
  reducedMotion?: boolean;
}

const D2R = Math.PI / 180;
const TICK_ANGLES_DEG = [30, 60, 120, 150, 210, 240, 300, 330];

const RING_COLORS = [COLOR_DAWN, COLOR_DAWN, COLOR_GOLD, COLOR_GOLD] as const;

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

/** Full-circle horizon + faint parallel band (eight-ball equator, in
 *  the XZ plane so it reads edge-on as a horizon line behind the rings). */
function buildHorizonGeometries(): {
  horizon: THREE.BufferGeometry;
  band: THREE.BufferGeometry;
} {
  const segments = 120;
  const r = SUBSTRATE_COMPASS_HORIZON_R;
  const bandY = SUBSTRATE_COMPASS_HORIZON_BAND_Y;
  const horizonPts: THREE.Vector3[] = [];
  const bandPts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    horizonPts.push(new THREE.Vector3(x, 0, z));
    bandPts.push(new THREE.Vector3(x * 1.007, bandY, z * 1.007));
  }
  return {
    horizon: new THREE.BufferGeometry().setFromPoints(horizonPts),
    band: new THREE.BufferGeometry().setFromPoints(bandPts),
  };
}

/** Faint pitch-ladder parallels (±latitudes on the attitude sphere). */
function buildPitchLadderGeometries(): THREE.BufferGeometry[] {
  const r = SUBSTRATE_COMPASS_HORIZON_R;
  const segments = 96;
  return SUBSTRATE_COMPASS_PITCH_LADDER_DEG.flatMap((latDeg) => {
    const geoms: THREE.BufferGeometry[] = [];
    for (const sign of [1, -1] as const) {
      const lat = latDeg * D2R * sign;
      const y = Math.sin(lat) * r;
      const rr = Math.cos(lat) * r;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * rr, y, Math.sin(a) * rr));
      }
      geoms.push(new THREE.BufferGeometry().setFromPoints(pts));
    }
    return geoms;
  });
}

/** Cardinal diamonds on the horizon (N/E/S/W), in the camera-facing plane. */
function buildCardinalDiamondGeometries(): THREE.BufferGeometry[] {
  const r = SUBSTRATE_COMPASS_HORIZON_R * 1.05;
  const s = SUBSTRATE_COMPASS_CARDINAL_DIAMOND;
  const dirs: [number, number][] = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];
  return dirs.map(([dx, dy]) => {
    const cx = dx * r;
    const cy = dy * r;
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(cx, cy + s, 0.03),
      new THREE.Vector3(cx + s, cy, 0.03),
      new THREE.Vector3(cx, cy - s, 0.03),
      new THREE.Vector3(cx - s, cy, 0.03),
      new THREE.Vector3(cx, cy + s, 0.03),
    ]);
  });
}

type RingMaterial = THREE.LineBasicMaterial | THREE.LineDashedMaterial;

export function ShellSubstrate({ layerKey, reducedMotion = false }: ShellSubstrateProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);
  const instrumentRef = useRef<THREE.Group>(null);
  const attitudeRef = useRef<THREE.Group>(null);
  const orbitDot1Ref = useRef<THREE.Group>(null);
  const orbitDot2Ref = useRef<THREE.Group>(null);

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
  const { horizon: horizonGeom, band: bandGeom } = useMemo(() => buildHorizonGeometries(), []);
  const pitchLadderGeoms = useMemo(() => buildPitchLadderGeometries(), []);
  const cardinalGeoms = useMemo(() => buildCardinalDiamondGeometries(), []);
  const orbitDot1Geom = useMemo(
    () => new THREE.CircleGeometry(SUBSTRATE_COMPASS_ORBIT_DOT_1.size, 20),
    []
  );
  const orbitDot2Geom = useMemo(
    () => new THREE.CircleGeometry(SUBSTRATE_COMPASS_ORBIT_DOT_2.size, 20),
    []
  );

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

  const horizonMat = useMemo(
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

  const horizonBandMat = useMemo(
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

  const pitchLadderMats = useMemo(
    () =>
      pitchLadderGeoms.map(
        () =>
          new THREE.LineBasicMaterial({
            color: new THREE.Color(COLOR_DAWN),
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false,
          })
      ),
    [pitchLadderGeoms]
  );

  const cardinalMats = useMemo(
    () =>
      cardinalGeoms.map(
        () =>
          new THREE.LineBasicMaterial({
            color: new THREE.Color(COLOR_GOLD),
            transparent: true,
            opacity: 0,
            depthWrite: false,
            toneMapped: false,
          })
      ),
    [cardinalGeoms]
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

  useEffect(() => {
    return () => {
      ringGeoms.forEach((g) => g.dispose());
      crosshairGeom.dispose();
      ticksGeom.dispose();
      horizonGeom.dispose();
      bandGeom.dispose();
      pitchLadderGeoms.forEach((g) => g.dispose());
      cardinalGeoms.forEach((g) => g.dispose());
      orbitDot1Geom.dispose();
      orbitDot2Geom.dispose();
      ringMats.forEach((m) => m.dispose());
      bearingsMat.dispose();
      horizonMat.dispose();
      horizonBandMat.dispose();
      pitchLadderMats.forEach((m) => m.dispose());
      cardinalMats.forEach((m) => m.dispose());
      orbitDot1Mat.dispose();
      orbitDot2Mat.dispose();
    };
  }, [
    ringGeoms,
    crosshairGeom,
    ticksGeom,
    horizonGeom,
    bandGeom,
    pitchLadderGeoms,
    cardinalGeoms,
    orbitDot1Geom,
    orbitDot2Geom,
    ringMats,
    bearingsMat,
    horizonMat,
    horizonBandMat,
    pitchLadderMats,
    cardinalMats,
    orbitDot1Mat,
    orbitDot2Mat,
  ]);

  const hideAll = () => {
    ringMats.forEach((m) => {
      m.opacity = 0;
    });
    bearingsMat.opacity = 0;
    horizonMat.opacity = 0;
    horizonBandMat.opacity = 0;
    pitchLadderMats.forEach((m) => {
      m.opacity = 0;
    });
    cardinalMats.forEach((m) => {
      m.opacity = 0;
    });
    orbitDot1Mat.opacity = 0;
    orbitDot2Mat.opacity = 0;
  };

  useFrame((state) => {
    const group = groupRef.current;
    if (!group) return;

    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      group.visible = false;
      hideAll();
      return;
    }

    const reveal = getBrandmarkAccretionLayers(paintProgress).substrate;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      hideAll();
      return;
    }
    group.visible = true;

    const { scale, presence } = shellWrapEmerge(reveal);
    group.scale.setScalar(scale);

    const shellOpacity = SUBSTRATE_COMPASS_SHELL_OPACITY * presence;

    // Flat compass rings — the dominant read (full alpha weights).
    for (const mat of ringMats) {
      const base = (mat.userData as { baseAlpha: number }).baseAlpha;
      mat.opacity = shellOpacity * base;
    }
    bearingsMat.opacity = shellOpacity * 0.78;
    // Eight-ball horizon / attitude — kept fainter than the rings but
    // still legible behind them.
    horizonMat.opacity = shellOpacity * 0.62;
    horizonBandMat.opacity = shellOpacity * 0.28;
    pitchLadderMats.forEach((m, i) => {
      m.opacity = shellOpacity * (i % 2 === 0 ? 0.22 : 0.13);
    });
    cardinalMats.forEach((m) => {
      m.opacity = shellOpacity * 0.5;
    });
    orbitDot1Mat.opacity = shellOpacity * SUBSTRATE_COMPASS_ORBIT_DOT_1.alpha;
    orbitDot2Mat.opacity = shellOpacity * SUBSTRATE_COMPASS_ORBIT_DOT_2.alpha;

    const t = state.clock.elapsedTime;

    // Whole instrument: slow breath spin (matches the opening compass).
    if (instrumentRef.current) {
      instrumentRef.current.rotation.z = reducedMotion ? 0 : t * SUBSTRATE_COMPASS_BREATH_RATE;
    }

    // Eight-ball sub-group: gentle gimbal attitude seek. Isolated here
    // so the flat compass rings stay camera-facing.
    if (attitudeRef.current) {
      if (reducedMotion) {
        attitudeRef.current.rotation.set(0, 0, 0);
      } else {
        attitudeRef.current.rotation.x =
          Math.sin(t * SUBSTRATE_COMPASS_TILT_FREQ_X) * SUBSTRATE_COMPASS_TILT_AMP_X;
        attitudeRef.current.rotation.z =
          Math.sin(t * SUBSTRATE_COMPASS_TILT_FREQ_Z + 1) * SUBSTRATE_COMPASS_TILT_AMP_Z;
      }
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
  });

  return (
    <group ref={groupRef} visible={false}>
      <group ref={instrumentRef}>
        {/* Eight-ball horizon / pitch ladder — gimbal-tilted behind the
            flat rings for the attitude-sphere cue. */}
        <group ref={attitudeRef}>
          <lineLoop geometry={horizonGeom} material={horizonMat} frustumCulled={false} />
          <lineLoop geometry={bandGeom} material={horizonBandMat} frustumCulled={false} />
          {pitchLadderGeoms.map((g, i) => (
            <lineLoop
              key={`pitch-${i}`}
              geometry={g}
              material={pitchLadderMats[i]}
              frustumCulled={false}
            />
          ))}
        </group>

        {/* Flat camera-facing compass — the dominant read. */}
        {ringGeoms.map((g, i) => (
          <lineLoop
            key={`compass-ring-${i}`}
            geometry={g}
            material={ringMats[i]}
            frustumCulled={false}
          />
        ))}
        <lineSegments geometry={crosshairGeom} material={bearingsMat} frustumCulled={false} />
        <lineSegments geometry={ticksGeom} material={bearingsMat} frustumCulled={false} />

        {cardinalGeoms.map((g, i) => (
          <lineLoop
            key={`cardinal-${i}`}
            geometry={g}
            material={cardinalMats[i]}
            frustumCulled={false}
          />
        ))}

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
      </group>
    </group>
  );
}
