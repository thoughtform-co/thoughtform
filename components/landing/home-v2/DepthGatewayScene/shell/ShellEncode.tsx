"use client";

/**
 * ShellEncode — the inside-out layer 2 of the accreted intelligence
 * shell (Encode). Renders the SLOT DOCK RING: an additional outer
 * ring at `SLOT_RING_R` (just outside the compass outer ring) with
 * four cardinal SLOTS that the four primitive labels plug into.
 *
 * Composition:
 *   - Four arc segments at radius `SLOT_RING_R`, spanning the angles
 *     between cardinals (~50° each), trim-path draw on as Encode
 *     emerges.
 *   - Eight slot brackets — short radial ticks at each slot edge —
 *     fade in after the arcs draw, marking the notches.
 *   - Four DOM labels (`encode.primitive.*` anchors in CopyAnchors)
 *     seat into the slots on the same accretion envelope.
 *
 * Flat in XY (camera-facing). Persists assembled through Build.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COLOR_GOLD } from "@/components/landing/intelligence-artifact/artifactGeom";
import { makeLineMaterial } from "@/components/landing/intelligence-artifact/artifactPrimitives";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { getBrandmarkAccretionLayers } from "../sceneGeom";
import {
  EMERGE_EPSILON,
  SLOT_ARC_BOUNDS,
  SLOT_BRACKET_ANGLES,
  SLOT_BRACKET_HALF_LEN,
  SLOT_RING_R,
} from "./shellGeom";

interface ShellEncodeProps {
  layerKey: "orbits";
  reducedMotion?: boolean;
}

/** Per-arc tessellation. ~50° arc / 32 = 1.6° per segment — smooth. */
const ARC_SEGMENTS = 32;

/** Arc draw + bracket fade-in windows inside the orbits envelope. */
const ARC_DRAW_END = 0.6;
const BRACKET_FADE_START = 0.45;
const BRACKET_FADE_END = 0.85;

const SLOT_ARC_ALPHA = 0.42;
const SLOT_BRACKET_ALPHA = 0.78;

function smoother(t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function buildArcGeometry(
  startRad: number,
  endRad: number,
  radius: number,
  segments: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const a = startRad + (endRad - startRad) * t;
    positions.push(Math.cos(a) * radius, Math.sin(a) * radius, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return g;
}

function buildBracketGeometry(
  angleRad: number,
  radius: number,
  halfLen: number
): THREE.BufferGeometry {
  const cx = Math.cos(angleRad);
  const cy = Math.sin(angleRad);
  const positions = new Float32Array([
    cx * (radius - halfLen),
    cy * (radius - halfLen),
    0,
    cx * (radius + halfLen),
    cy * (radius + halfLen),
    0,
  ]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return g;
}

export function ShellEncode({ layerKey, reducedMotion = false }: ShellEncodeProps) {
  void layerKey;
  const groupRef = useRef<THREE.Group>(null);

  const arcGeoms = useMemo(
    () =>
      SLOT_ARC_BOUNDS.map((b) => buildArcGeometry(b.startRad, b.endRad, SLOT_RING_R, ARC_SEGMENTS)),
    []
  );

  const bracketGeoms = useMemo(
    () =>
      SLOT_BRACKET_ANGLES.map((a) => buildBracketGeometry(a, SLOT_RING_R, SLOT_BRACKET_HALF_LEN)),
    []
  );

  const arcMat = useMemo(() => makeLineMaterial(COLOR_GOLD, SLOT_ARC_ALPHA, false), []);
  const bracketMat = useMemo(() => makeLineMaterial(COLOR_GOLD, SLOT_BRACKET_ALPHA, false), []);

  const arcVertCounts = useMemo(() => arcGeoms.map((g) => g.attributes.position.count), [arcGeoms]);

  // Open `THREE.Line` per arc so `setDrawRange` traces an arc on,
  // rather than chord-closing as a `LineLoop` would.
  const arcLines = useMemo(
    () =>
      arcGeoms.map((g) => {
        const line = new THREE.Line(g, arcMat);
        line.frustumCulled = false;
        g.setDrawRange(0, 0);
        return line;
      }),
    [arcGeoms, arcMat]
  );

  useEffect(() => {
    return () => {
      arcGeoms.forEach((g) => g.dispose());
      bracketGeoms.forEach((g) => g.dispose());
      arcMat.dispose();
      bracketMat.dispose();
    };
  }, [arcGeoms, bracketGeoms, arcMat, bracketMat]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      group.visible = false;
      return;
    }

    const reveal = getBrandmarkAccretionLayers(paintProgress).orbits;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Arcs trim-draw on over `0 → ARC_DRAW_END`; opacity matches the
    // draw so the line doesn't snap from empty to full alpha.
    const arcT = reducedMotion ? 1 : smoother(Math.min(1, reveal / ARC_DRAW_END));
    arcMat.opacity = arcT * SLOT_ARC_ALPHA;
    for (let i = 0; i < arcGeoms.length; i++) {
      const count = arcVertCounts[i];
      const drawn = Math.max(0, Math.min(count, Math.round(arcT * count)));
      arcGeoms[i].setDrawRange(0, drawn);
    }

    // Brackets fade in after the arcs have drawn most of the way —
    // the slots "snap" defined once the dock ring is on.
    const bracketRaw = reducedMotion
      ? 1
      : Math.max(0, (reveal - BRACKET_FADE_START) / (BRACKET_FADE_END - BRACKET_FADE_START));
    const bracketT = smoother(Math.min(1, bracketRaw));
    bracketMat.opacity = bracketT * SLOT_BRACKET_ALPHA;
  });

  return (
    <group ref={groupRef} visible={false}>
      {arcLines.map((line, i) => (
        <primitive key={`slot-arc-${i}`} object={line} />
      ))}
      {bracketGeoms.map((g, i) => (
        <lineSegments
          key={`slot-bracket-${i}`}
          geometry={g}
          material={bracketMat}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
