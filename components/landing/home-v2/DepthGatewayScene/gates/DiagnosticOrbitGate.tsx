"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MISS_ORBITS } from "@/lib/celestial/orbits";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { STATION_DIAGNOSTIC } from "../sceneGeom";

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
      return new THREE.BufferGeometry().setFromPoints(points);
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
      return new THREE.BufferGeometry().setFromPoints(points);
    });
  }, []);

  // ── Materials ───────────────────────────────────────────────
  const orbitMats = useMemo(() => {
    return MISS_ORBITS.map((_, idx) => {
      // Match the v7 per-orbit gold weights.
      const stroke = [0.62, 0.72, 0.58, 0.55][idx];
      const col = new THREE.Color("#caa554");
      return new THREE.LineBasicMaterial({
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
      new THREE.LineBasicMaterial({
        color: new THREE.Color(0.93, 0.89, 0.84),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      new THREE.LineBasicMaterial({
        color: new THREE.Color(0.93, 0.89, 0.84),
        transparent: true,
        opacity: 0,
        depthWrite: false,
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

    // Two-stage emergence so the orbits read as DISTANT signal
    // first, then a fully landed instrument:
    //   - 0 before 0.22 — the user is still in the Thoughtform
    //     fly-through; nothing of the Diagnostic gate is on
    //     screen.
    //   - Distant onset across [0.22, 0.36] — orbits appear at
    //     ~25% of their full opacity (faint, far-away signal).
    //     Combined with the gate's farther world Z (park at
    //     0.47), the rings perspective-scale up as the camera
    //     approaches, so the eye reads "an instrument coming
    //     into view at distance" rather than a fade-in pop.
    //   - Approach across [0.36, 0.50] — opacity ramps up to
    //     full as the camera closes the remaining travel.
    //   - Hold at 1 across [0.50, 0.58] (parked gate centred).
    //   - Fade across [0.58, 0.70] as the gate passes behind.
    //
    // Window edges align with BEAT_WINDOWS:
    //   passthrough-01 0.16–0.40, diagnostic 0.40–0.55,
    //   passthrough-02 0.55–0.72.
    const DISTANT_CEILING = 0.25;
    let opacity = 0;
    if (progress > 0.22 && progress < 0.36) {
      // Linear ramp 0 → DISTANT_CEILING.
      opacity = ((progress - 0.22) / 0.14) * DISTANT_CEILING;
    } else if (progress >= 0.36 && progress < 0.5) {
      // Linear ramp DISTANT_CEILING → 1.
      opacity = DISTANT_CEILING + ((progress - 0.36) / 0.14) * (1 - DISTANT_CEILING);
    } else if (progress >= 0.5 && progress <= 0.58) {
      opacity = 1;
    } else if (progress > 0.58 && progress < 0.7) {
      opacity = 1 - (progress - 0.58) / 0.12;
    }

    for (let i = 0; i < orbitMats.length; i++) {
      const m = orbitMats[i];
      const base = (m.userData as { baseAlpha: number }).baseAlpha;
      m.opacity = opacity * base;
    }
    ghostMats[0].opacity = opacity * 0.18;
    ghostMats[1].opacity = opacity * 0.13;
    // Pips need a slightly different envelope: at distance they
    // should NOT show as bright points (they'd read as dust),
    // so they only start appearing during the approach phase
    // after the rings have begun to resolve.
    const pipOpacity = progress > 0.36 ? Math.max(0, opacity - DISTANT_CEILING * 0.5) : 0;
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
