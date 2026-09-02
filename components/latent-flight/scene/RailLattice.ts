import * as THREE from "three";

import { GLASS_DEPTH, LATTICE_SPAN, type LatticeGeometry } from "@/lib/latent-flight/rail/railLattice";
import { VISTA } from "@/lib/latent-flight/vistaPalette";

import { rawColor } from "./color";

import { railFragment, railVertex } from "../shaders/rail";

/**
 * The rail lattice — the site's two rails extruded along the course.
 *
 * Two `LineSegments`: the 26 longitudinal STRINGS (13 ticks × 2 sides) and
 * the RUNGS that repeat every two units. Both share the rail shader; only
 * the rungs may go gold (`uGoldable`), because the gold rung is the
 * ladder's "current tick" and a string is not a tick. Additive dawn over
 * the void, no depth write, drawn after the cosmos and before the dust.
 */

export interface RailLattice {
  group: THREE.Group;
  setShip(arc: number, velocity: number): void;
  setLevel(level: number): void;
  dispose(): void;
}

function material(goldable: number, opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: railVertex,
    fragmentShader: railFragment,
    uniforms: {
      uShipArc: { value: 0 },
      uGlass: { value: GLASS_DEPTH },
      uSpan: { value: LATTICE_SPAN },
      uVelocity: { value: 0 },
      uGoldable: { value: goldable },
      uColor: { value: rawColor(VISTA.dawn) },
      uGold: { value: rawColor(VISTA.gold) },
      uOpacity: { value: opacity },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });
}

function lines(
  positions: Float32Array,
  rank: Float32Array | null,
  arc: Float32Array,
  mat: THREE.ShaderMaterial
): THREE.LineSegments {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute(
    "aRank",
    new THREE.BufferAttribute(rank ?? new Float32Array(positions.length / 3).fill(1), 1)
  );
  g.setAttribute("aArc", new THREE.BufferAttribute(arc, 1));
  const l = new THREE.LineSegments(g, mat);
  l.frustumCulled = false;
  return l;
}

/** At rest the corridor is a suggestion; under way it comes up to full. */
const REST_LEVEL = 0.55;
const BASE_STRING = 0.34;
const BASE_RUNG = 0.2;

export function createRailLattice(geom: LatticeGeometry): RailLattice {
  // ⚠ No gold on the lattice. The "current rung" was drawn gold for one
  // pass and read as a stray vertical line inside the frame — the ladder's
  // current tick is the course mark on the chrome, and gold buys one thing.
  const stringMat = material(0, BASE_STRING);
  const rungMat = material(0, BASE_RUNG);
  const strings = lines(geom.strings, geom.stringRank, geom.stringArc, stringMat);
  const rungs = lines(geom.rungs, null, geom.rungArc, rungMat);
  const group = new THREE.Group();
  group.add(strings, rungs);
  group.renderOrder = 1;
  let level = 1;
  let speed = 0;
  const apply = () => {
    const k = level * (REST_LEVEL + (1 - REST_LEVEL) * Math.min(1, speed));
    stringMat.uniforms.uOpacity.value = BASE_STRING * k;
    rungMat.uniforms.uOpacity.value = BASE_RUNG * k;
  };
  apply();
  return {
    group,
    setShip(arc, velocity) {
      stringMat.uniforms.uShipArc.value = arc;
      rungMat.uniforms.uShipArc.value = arc;
      stringMat.uniforms.uVelocity.value = velocity;
      rungMat.uniforms.uVelocity.value = velocity;
      speed = velocity / 2;
      apply();
    },
    setLevel(l) {
      level = l;
      apply();
    },
    dispose() {
      strings.geometry.dispose();
      rungs.geometry.dispose();
      stringMat.dispose();
      rungMat.dispose();
    },
  };
}
