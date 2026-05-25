"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MISS_ORBITS } from "@/lib/celestial/orbits";
import { smoothstep, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { STATION_DIAGNOSTIC, cameraSpaceDepth } from "../sceneGeom";

/**
 * DiagnosticOrbitGate — the world-space diagnostic constellation
 * parked at `STATION_DIAGNOSTIC` (ADR-018).
 *
 * Re-renders the v7 `.miss__orbits` geometry as 3D line loops at the
 * gate's world Z. Reuses `MISS_ORBITS` from `lib/celestial/orbits.ts`
 * so the diagnostic family is consistent between this corridor view
 * and the production homepage.
 *
 * The orbits are flat (XY) but the whole group sits at a real Z
 * station, so the camera approaches → fills → passes → leaves
 * across the diagnostic + passthrough-02 beats.
 *
 * Anchor pips on each orbit pick out where the diagnostic labels
 * would attach (the DOM `.miss__label` pills are still rendered as
 * an overlay during this beat).
 */

// Scale orbit SVG units → world units. MISS_VIEWBOX is 1100 wide,
// so a scale of 1 / 240 yields ~4.6 world units across the system —
// roughly matching the diagnostic gate's halfExtent (2.2).
const SVG_TO_WORLD = 1 / 240;
const RING_SEGMENTS = 128;
/** Distance band where the Diagnostic constellation constructs
 *  itself. The gate stays absent while very far away, then the
 *  ellipses trace on as the camera closes in. This avoids both
 *  "pre-visible backdrop" and "opacity pop" reads. */
const DIAGNOSTIC_FORM_START_DEPTH = 9.4;
const DIAGNOSTIC_FORM_FULL_DEPTH = 5.2;
const DIAGNOSTIC_NEAR_DEPTH = 0.9;
const DIAGNOSTIC_NEAR_FADE = 2.4;

const PIP_POSITIONS = [
  { id: "01", parametricDeg: 205 },
  { id: "02", parametricDeg: -35 },
  { id: "03", parametricDeg: 155 },
  { id: "04", parametricDeg: 10 },
] as const;

function pointOnEllipse(rx: number, ry: number, rotateDeg: number, parametricDeg: number) {
  const psi = (parametricDeg * Math.PI) / 180;
  const alpha = (rotateDeg * Math.PI) / 180;
  const lx = rx * Math.cos(psi);
  const ly = ry * Math.sin(psi);
  return [lx * Math.cos(alpha) - ly * Math.sin(alpha), lx * Math.sin(alpha) + ly * Math.cos(alpha)];
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function buildDashedGeometry(points: THREE.Vector3[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const lineDistances = new Float32Array(points.length);
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    totalLength += points[i - 1].distanceTo(points[i]);
    lineDistances[i] = totalLength;
  }
  geometry.setAttribute("lineDistance", new THREE.BufferAttribute(lineDistances, 1));
  geometry.userData.lineLength = totalLength;
  return geometry;
}

function geometryLength(geometry: THREE.BufferGeometry): number {
  const length = geometry.userData.lineLength;
  return typeof length === "number" && length > 0 ? length : 1;
}

function formationFromDepth(depth: number): number {
  return 1 - smoothstep(DIAGNOSTIC_FORM_FULL_DEPTH, DIAGNOSTIC_FORM_START_DEPTH, depth);
}

function nearPresenceFromDepth(depth: number): number {
  if (depth <= 0) return 0;
  return smoothstep(DIAGNOSTIC_NEAR_DEPTH - DIAGNOSTIC_NEAR_FADE, DIAGNOSTIC_NEAR_DEPTH, depth);
}

function setFormationDash(
  material: THREE.LineDashedMaterial,
  lineLength: number,
  formation: number
) {
  material.dashSize = Math.max(0.0001, lineLength * (formation >= 0.995 ? 1.2 : formation));
  material.gapSize = lineLength * 2;
}

export function DiagnosticOrbitGate() {
  const groupRef = useRef<THREE.Group>(null);

  // ── Orbit ring geometries ───────────────────────────────────
  const orbitGeoms = useMemo(() => {
    return MISS_ORBITS.map((orbit) => {
      const points: THREE.Vector3[] = [];
      const rotAlpha = (orbit.rotateDeg * Math.PI) / 180;
      for (let i = 0; i <= RING_SEGMENTS; i++) {
        const t = (i / RING_SEGMENTS) * Math.PI * 2;
        // Local ellipse point.
        const lx = orbit.rx * Math.cos(t);
        const ly = orbit.ry * Math.sin(t);
        // Rotate around centre. v7 SVG has y-down; we flip Y so it
        // reads the same on our y-up world.
        const x = lx * Math.cos(rotAlpha) - ly * Math.sin(rotAlpha);
        const y = -(lx * Math.sin(rotAlpha) + ly * Math.cos(rotAlpha));
        points.push(new THREE.Vector3(x * SVG_TO_WORLD, y * SVG_TO_WORLD, 0));
      }
      return buildDashedGeometry(points);
    });
  }, []);

  // Ghost orbits — fainter additional arcs for navigation chart
  // density. Two extra ellipses sit slightly bigger than the
  // labelled four.
  const ghostGeoms = useMemo(() => {
    const ghosts = [
      { rx: 510, ry: 200, rotateDeg: 6 },
      { rx: 420, ry: 90, rotateDeg: -22 },
    ];
    return ghosts.map((g) => {
      const points: THREE.Vector3[] = [];
      const rotAlpha = (g.rotateDeg * Math.PI) / 180;
      for (let i = 0; i <= RING_SEGMENTS; i++) {
        const t = (i / RING_SEGMENTS) * Math.PI * 2;
        const lx = g.rx * Math.cos(t);
        const ly = g.ry * Math.sin(t);
        const x = lx * Math.cos(rotAlpha) - ly * Math.sin(rotAlpha);
        const y = -(lx * Math.sin(rotAlpha) + ly * Math.cos(rotAlpha));
        points.push(new THREE.Vector3(x * SVG_TO_WORLD, y * SVG_TO_WORLD, -0.05));
      }
      return buildDashedGeometry(points);
    });
  }, []);

  // ── Materials ───────────────────────────────────────────────
  const orbitMats = useMemo(() => {
    return MISS_ORBITS.map((_, idx) => {
      // Match the v7 per-orbit gold weights.
      const stroke = [0.62, 0.72, 0.58, 0.55][idx];
      const col = new THREE.Color("#caa554");
      return new THREE.LineDashedMaterial({
        color: col,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        // hairline-ish; LineBasicMaterial doesn't support sub-px
        // widths on all platforms but the additive feel comes from
        // alpha.
        linewidth: 1,
        toneMapped: false,
        // Use a custom property so future tints can read.
        userData: { baseAlpha: stroke },
      });
    });
  }, []);

  const ghostMats = useMemo(
    () => [
      new THREE.LineDashedMaterial({
        color: new THREE.Color(0.93, 0.89, 0.84),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        dashSize: 0.0001,
        gapSize: 10,
      }),
      new THREE.LineDashedMaterial({
        color: new THREE.Color(0.93, 0.89, 0.84),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        dashSize: 0.0001,
        gapSize: 10,
      }),
    ],
    []
  );

  // ── Anchor pips (diamonds at the four label attachment points) ──
  const pipPositions = useMemo(() => {
    return PIP_POSITIONS.map(({ id, parametricDeg }) => {
      const orbit = MISS_ORBITS.find((o) => o.id === id)!;
      const [x, y] = pointOnEllipse(orbit.rx, orbit.ry, orbit.rotateDeg, parametricDeg);
      // Flip Y for our y-up world (matches the orbit ring flip).
      return new THREE.Vector3(x * SVG_TO_WORLD, -y * SVG_TO_WORLD, 0.01);
    });
  }, []);

  const pipGeom = useMemo(() => {
    const r = 0.04;
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, r, 0),
      new THREE.Vector3(r, 0, 0),
      new THREE.Vector3(0, -r, 0),
      new THREE.Vector3(-r, 0, 0),
      new THREE.Vector3(0, r, 0),
    ]);
  }, []);

  const pipMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#caa554"),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    []
  );

  useEffect(() => {
    return () => {
      orbitGeoms.forEach((g) => g.dispose());
      ghostGeoms.forEach((g) => g.dispose());
      pipGeom.dispose();
      orbitMats.forEach((m) => m.dispose());
      ghostMats.forEach((m) => m.dispose());
      pipMat.dispose();
    };
  }, [orbitGeoms, ghostGeoms, pipGeom, orbitMats, ghostMats, pipMat]);

  // ── Per-frame visibility envelope ───────────────────────────
  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const { progress, active } = useDepthGatewayStore.getState().transform;
    if (!active) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Star Atlas-style persistence: the Diagnostic gate lives at a
    // fixed world Z. As the camera approaches, the linework constructs
    // itself by draw distance rather than appearing as an opacity fade.
    const depth = cameraSpaceDepth(progress, STATION_DIAGNOSTIC.position);
    const formation = formationFromDepth(depth);
    const nearPresence = nearPresenceFromDepth(depth);
    if (formation <= 0.001 || nearPresence <= 0.001) {
      group.visible = false;
      return;
    }

    group.visible = true;
    const builtPresence = smoothstep(0.02, 0.12, formation) * nearPresence;

    for (let i = 0; i < orbitMats.length; i++) {
      const m = orbitMats[i];
      const { baseAlpha } = m.userData as { baseAlpha: number };
      const staggeredFormation = clamp01((formation - i * 0.045) / 0.82);
      setFormationDash(m, geometryLength(orbitGeoms[i]), staggeredFormation);
      m.opacity = builtPresence * baseAlpha;
    }

    for (let i = 0; i < ghostMats.length; i++) {
      const ghostFormation = clamp01((formation - 0.12 - i * 0.06) / 0.75);
      setFormationDash(ghostMats[i], geometryLength(ghostGeoms[i]), ghostFormation);
    }
    ghostMats[0].opacity = builtPresence * 0.18;
    ghostMats[1].opacity = builtPresence * 0.13;

    // Pips resolve only after the orbit skeleton is mostly formed.
    const pipResolve = smoothstep(0.62, 0.92, formation);
    const pipOpacity = builtPresence * pipResolve;
    pipMat.opacity = pipOpacity * 0.95;
  });

  return (
    <group ref={groupRef} position={STATION_DIAGNOSTIC.position} visible={false}>
      {ghostGeoms.map((g, i) => (
        <lineLoop key={`ghost-${i}`} geometry={g} material={ghostMats[i]} />
      ))}
      {orbitGeoms.map((g, i) => (
        <lineLoop key={`orbit-${i}`} geometry={g} material={orbitMats[i]} />
      ))}
      {pipPositions.map((pos, i) => (
        <lineLoop key={`pip-${i}`} geometry={pipGeom} material={pipMat} position={pos} />
      ))}
    </group>
  );
}
