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
import { COLOR_DAWN, COLOR_GOLD } from "@/components/landing/intelligence-artifact/artifactGeom";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers } from "../sceneGeom";
import {
  EMERGE_EPSILON,
  foldEmerge,
  petalStagger,
  SUBSTRATE_COMPASS_BREATH_RATE,
  SUBSTRATE_COMPASS_CARDINAL_DIAMOND,
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

/** Cardinal diamonds on the outer ring (N/E/S/W), camera-facing. */
function buildCardinalDiamondGeometries(): THREE.BufferGeometry[] {
  const r = SUBSTRATE_COMPASS_RING_RADII[0] * 1.05;
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
  const detailsRef = useRef<THREE.Group>(null);
  const ringScaleRefs = useRef<(THREE.Group | null)[]>([]);
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
      cardinalGeoms.forEach((g) => g.dispose());
      orbitDot1Geom.dispose();
      orbitDot2Geom.dispose();
      ringMats.forEach((m) => m.dispose());
      bearingsMat.dispose();
      cardinalMats.forEach((m) => m.dispose());
      orbitDot1Mat.dispose();
      orbitDot2Mat.dispose();
    };
  }, [
    ringGeoms,
    crosshairGeom,
    ticksGeom,
    cardinalGeoms,
    orbitDot1Geom,
    orbitDot2Geom,
    ringMats,
    bearingsMat,
    cardinalMats,
    orbitDot1Mat,
    orbitDot2Mat,
  ]);

  const hideAll = () => {
    ringMats.forEach((m) => {
      m.opacity = 0;
    });
    bearingsMat.opacity = 0;
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

    // Materials hold FULL target opacity once revealed — the emerge is
    // GEOMETRIC (staggered per-part scale unfold below), never an
    // opacity fade (brandmark Principle 4).
    const shellOpacity = SUBSTRATE_COMPASS_SHELL_OPACITY;

    for (const mat of ringMats) {
      const base = (mat.userData as { baseAlpha: number }).baseAlpha;
      mat.opacity = shellOpacity * base;
    }
    bearingsMat.opacity = shellOpacity * 0.78;
    cardinalMats.forEach((m) => {
      m.opacity = shellOpacity * 0.5;
    });
    orbitDot1Mat.opacity = shellOpacity * SUBSTRATE_COMPASS_ORBIT_DOT_1.alpha;
    orbitDot2Mat.opacity = shellOpacity * SUBSTRATE_COMPASS_ORBIT_DOT_2.alpha;

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

        {/* Reticle details — crosshair, ticks, cardinals, atmosphere
            dots — snap in last as one unfold slot. */}
        <group ref={detailsRef}>
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
    </group>
  );
}
