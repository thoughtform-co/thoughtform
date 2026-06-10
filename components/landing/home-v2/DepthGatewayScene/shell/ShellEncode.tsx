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
import { getSmoothedAccretionLayers } from "../motionFollower";
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

/** Per-cardinal stagger overlap for the slot dock. Mirrors the
 *  `ENCODE_CARTRIDGE_OVERLAP` in `sceneGeom.ts` (single source of
 *  truth, but duplicated here to avoid cross-module coupling) so
 *  each slot draws on as its cartridge label lands, instead of all
 *  four arcs drawing together. 0.62 (2026-06-08 elegance pass) =
 *  longer per-arc draw; was 0.45. */
const ENCODE_DOCK_OVERLAP = 0.62;

/** Per-slot draw window inside the cardinal's staggered local
 *  progress: arc traces 0 → ARC_LOCAL_DRAW_END, then bracket fades
 *  over the back half. The whole window completes by stagger = 1
 *  so the end state is byte-identical to the pre-stagger version. */
const ARC_LOCAL_DRAW_END = 0.7;
const BRACKET_LOCAL_START = 0.55;
const BRACKET_LOCAL_END = 1.0;

const SLOT_ARC_ALPHA = 0.42;
const SLOT_BRACKET_ALPHA = 0.78;

function smoother(t: number): number {
  const x = t < 0 ? 0 : t > 1 ? 1 : t;
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** Petal stagger duplicated locally to avoid cross-module coupling.
 *  Matches `shellGeom.petalStagger`. */
function petalStaggerLocal(reveal: number, idx: number, total: number, overlap: number): number {
  if (total <= 1) return reveal;
  const f = 1 / ((1 - overlap) * (total - 1) + 1);
  const step = (1 - f) / (total - 1);
  const start = idx * step;
  const t = (reveal - start) / f;
  return t < 0 ? 0 : t > 1 ? 1 : t;
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

// Per-arc → cardinal mapping: each arc draws on as its LATER
// cardinal (in `ENCODE_CARTRIDGE_ORDER`) arrives, so the slot wall
// reads as completing once the cartridge has docked. Order in
// `SLOT_ARC_BOUNDS` (right-top → top-left → left-bottom → bottom-right)
// crosses cardinals as:
//   arc 0: East(1) → North(0) ⇒ later in order = taste (idx 1)
//   arc 1: North(0) → West(3) ⇒ later = voice  (idx 3)
//   arc 2: West(3)  → South(2) ⇒ later = voice  (idx 3)
//   arc 3: South(2) → East(1) ⇒ later = craft (idx 2)
// (SHELL_PRIMITIVES order: judgment=0, taste=1, craft=2, voice=3.)
const ARC_CARDINAL_IDX = [1, 3, 3, 2] as const;

// 8 brackets ↔ 4 cardinals (2 brackets per cardinal slot). The
// SLOT_BRACKET_ANGLES order pairs as (0,1)=East, (2,3)=North,
// (4,5)=West, (6,7)=South.
const BRACKET_CARDINAL_IDX = [1, 1, 0, 0, 3, 3, 2, 2] as const;

const ENCODE_CARDINAL_TOTAL = 4;
// Mirror `sceneGeom.encodeCartridgeStagger` so each cardinal index
// resolves to the same stagger window without importing from there.
function cardinalStagger(orbits: number, cardinalIdx: number): number {
  // SHELL_PRIMITIVES idx already matches ENCODE_CARTRIDGE_ORDER
  // [0,1,2,3] in `sceneGeom.ts`, so the slot can be the idx directly.
  return petalStaggerLocal(orbits, cardinalIdx, ENCODE_CARDINAL_TOTAL, ENCODE_DOCK_OVERLAP);
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

  // One material per arc + per bracket so each can fade independently
  // as its corresponding cartridge lands. Allocating four arc + eight
  // bracket materials adds nothing measurable to GPU state, and
  // keeps the per-cardinal stagger clean (no shared-uniform fights).
  const arcMats = useMemo(
    () => SLOT_ARC_BOUNDS.map(() => makeLineMaterial(COLOR_GOLD, SLOT_ARC_ALPHA, false)),
    []
  );
  const bracketMats = useMemo(
    () => SLOT_BRACKET_ANGLES.map(() => makeLineMaterial(COLOR_GOLD, SLOT_BRACKET_ALPHA, false)),
    []
  );

  const arcVertCounts = useMemo(() => arcGeoms.map((g) => g.attributes.position.count), [arcGeoms]);

  // Open `THREE.Line` per arc so `setDrawRange` traces an arc on,
  // rather than chord-closing as a `LineLoop` would. Each line gets
  // its own material so the per-cardinal stagger doesn't fight a
  // shared uniform.
  const arcLines = useMemo(
    () =>
      arcGeoms.map((g, i) => {
        const line = new THREE.Line(g, arcMats[i]);
        line.frustumCulled = false;
        g.setDrawRange(0, 0);
        return line;
      }),
    [arcGeoms, arcMats]
  );

  useEffect(() => {
    return () => {
      arcGeoms.forEach((g) => g.dispose());
      bracketGeoms.forEach((g) => g.dispose());
      arcMats.forEach((m) => m.dispose());
      bracketMats.forEach((m) => m.dispose());
    };
  }, [arcGeoms, bracketGeoms, arcMats, bracketMats]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const { active, armed } = useDepthGatewayStore.getState().transform;
    if (!active && !armed) {
      group.visible = false;
      return;
    }

    // Temporally-smoothed reveal (motionFollower) — the staggered
    // cartridge fold-in always plays out on wall-clock time, even
    // when the user flicks through the orbits window in one frame.
    //
    // Epilogue v4 (2026-06-10 flywheel pass): the BUILD_OUT clear is
    // gone. The cartridges DOCK with the assembly and stay legible
    // beside the flywheel panel through the whole epilogue.
    const reveal = getSmoothedAccretionLayers().orbits;
    if (reveal <= EMERGE_EPSILON) {
      group.visible = false;
      return;
    }
    group.visible = true;

    // Per-arc draw + alpha: each arc's local progress is its
    // cardinal's staggered progress mapped onto [0, ARC_LOCAL_DRAW_END].
    // Arc trace + opacity both follow that local curve so the slot
    // wall reads as completing on the cartridge's lock.
    for (let i = 0; i < arcGeoms.length; i++) {
      const cardinalIdx = ARC_CARDINAL_IDX[i];
      const stagger = reducedMotion ? 1 : cardinalStagger(reveal, cardinalIdx);
      const local = Math.min(1, stagger / ARC_LOCAL_DRAW_END);
      const arcT = smoother(local);
      arcMats[i].opacity = arcT * SLOT_ARC_ALPHA;
      const count = arcVertCounts[i];
      const drawn = Math.max(0, Math.min(count, Math.round(arcT * count)));
      arcGeoms[i].setDrawRange(0, drawn);
    }

    // Per-bracket fade — windows fall in the back-half of each
    // cardinal's stagger, so the slot "snaps" defined once the
    // cartridge has locked and the arc wall has drawn.
    for (let i = 0; i < bracketMats.length; i++) {
      const cardinalIdx = BRACKET_CARDINAL_IDX[i];
      const stagger = reducedMotion ? 1 : cardinalStagger(reveal, cardinalIdx);
      const local = (stagger - BRACKET_LOCAL_START) / (BRACKET_LOCAL_END - BRACKET_LOCAL_START);
      const bracketT = smoother(Math.max(0, Math.min(1, local)));
      bracketMats[i].opacity = bracketT * SLOT_BRACKET_ALPHA;
    }
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
          material={bracketMats[i]}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
