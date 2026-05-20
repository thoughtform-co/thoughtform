"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { TRAJECTORY_CURVES, orbitEmerge } from "./intelligenceLayerGeom";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

const DAWN = new THREE.Color("#ebe3d6");
const GOLD = new THREE.Color("#caa554");
const SEGMENTS = 128;

function curveGeometry(
  points: readonly [number, number, number][],
  ghost: boolean
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  // Ghost arcs use fewer samples + a sparse "stitch" pattern (every other
  // sample) so they read as discontinuous hairlines without needing
  // computeLineDistances() (which lives on THREE.Line, not the geometry).
  const sampled = curve.getPoints(SEGMENTS);
  if (!ghost) {
    return new THREE.BufferGeometry().setFromPoints(sampled);
  }
  const stitched: THREE.Vector3[] = [];
  for (let i = 0; i < sampled.length - 2; i += 4) {
    stitched.push(sampled[i]);
    stitched.push(sampled[i + 2]);
  }
  const g = new THREE.BufferGeometry().setFromPoints(stitched);
  return g;
}

export function InterSphereTrajectories() {
  const specs = useMemo(() => TRAJECTORY_CURVES.filter((t) => !t.cometHost), []);

  const geoms = useMemo(() => specs.map((s) => curveGeometry(s.points, !!s.ghost)), [specs]);

  const materials = useMemo(
    () =>
      specs.map((spec) => {
        return new THREE.LineBasicMaterial({
          color: spec.color === "gold" ? GOLD : DAWN,
          transparent: true,
          opacity: spec.ghost ? 0.13 : spec.color === "gold" ? 0.42 : 0.36,
          depthWrite: false,
        });
      }),
    [specs]
  );

  const matsRef = useRef(materials);
  matsRef.current = materials;

  // R3F v9 / React 19 / @types/react 19: lowercase `<line>` clashes
  // with SVG's `<line>` element type. Pre-build the `THREE.Line`
  // instances (only for non-ghost specs — ghost specs render as
  // `<lineSegments>`, which has no SVG namespace conflict) and
  // mount them via `<primitive>`.
  const lineObjects = useMemo(
    () => specs.map((spec, i) => (spec.ghost ? null : new THREE.Line(geoms[i], materials[i]))),
    [specs, geoms, materials]
  );

  useFrame(() => {
    const presence =
      0.45 + orbitEmerge(useBrandmarkJourneyStore.getState().transform.ringProgress) * 0.55;
    matsRef.current.forEach((mat, i) => {
      const spec = specs[i];
      const base = spec.ghost ? 0.13 : spec.color === "gold" ? 0.42 : 0.36;
      mat.opacity = presence * base;
    });
  });

  return (
    <group>
      {specs.map((spec, i) => {
        if (spec.ghost) {
          return <lineSegments key={spec.id} geometry={geoms[i]} material={materials[i]} />;
        }
        const lineObj = lineObjects[i];
        if (!lineObj) return null;
        return <primitive key={spec.id} object={lineObj} />;
      })}
    </group>
  );
}
