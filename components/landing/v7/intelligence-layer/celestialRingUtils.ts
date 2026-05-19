import * as THREE from "three";
import { RING_SEGMENTS } from "./intelligenceLayerGeom";

/** Tilted ellipse as a closed hairline loop (replaces TubeGeometry rings). */
export function buildTiltedRingLineLoop(
  radius: number,
  tilt: readonly [number, number, number],
  segments = RING_SEGMENTS,
  eccentricity = 0.92
): THREE.BufferGeometry {
  const curve = new THREE.EllipseCurve(
    0,
    0,
    radius,
    radius * eccentricity,
    0,
    Math.PI * 2,
    false,
    0
  );
  const pts2d = curve.getPoints(segments);
  const euler = new THREE.Euler(tilt[0], tilt[1], tilt[2]);
  const points = pts2d.map((p) => new THREE.Vector3(p.x, p.y, 0).applyEuler(euler));
  return new THREE.BufferGeometry().setFromPoints(points);
}

/** Short arc segment (inflow track) from outer radius to rim pip. */
export function buildInflowArcGeometry(
  angleDeg: number,
  outerRadius: number,
  rimRadius: number,
  tilt: readonly [number, number, number],
  segments = 24
): THREE.BufferGeometry {
  const startRad = ((angleDeg - 8) * Math.PI) / 180;
  const endRad = (angleDeg * Math.PI) / 180;
  const euler = new THREE.Euler(tilt[0], tilt[1], tilt[2]);
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const rad = startRad + (endRad - startRad) * t;
    const r = outerRadius + (rimRadius - outerRadius) * t;
    points.push(new THREE.Vector3(Math.sin(rad) * r, Math.cos(rad) * r, 0.01).applyEuler(euler));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

/** Radial rail from rim outward (surfaces outflow). */
export function buildOutflowRailGeometry(
  angleDeg: number,
  rimRadius: number,
  outerRadius: number,
  tilt: readonly [number, number, number]
): THREE.BufferGeometry {
  const rad = (angleDeg * Math.PI) / 180;
  const euler = new THREE.Euler(tilt[0], tilt[1], tilt[2]);
  const inner = new THREE.Vector3(
    Math.sin(rad) * rimRadius,
    Math.cos(rad) * rimRadius,
    0.01
  ).applyEuler(euler);
  const outer = new THREE.Vector3(
    Math.sin(rad) * outerRadius,
    Math.cos(rad) * outerRadius,
    0.01
  ).applyEuler(euler);
  return new THREE.BufferGeometry().setFromPoints([inner, outer]);
}

/** Local pip position on the tilted orbital plane (0° = top, clockwise). */
export function pipLocalPosition(
  angleDeg: number,
  radiusMul: number,
  ringRadius: number,
  tilt: readonly [number, number, number]
): THREE.Vector3 {
  const rad = (angleDeg * Math.PI) / 180;
  const r = ringRadius * radiusMul;
  const euler = new THREE.Euler(tilt[0], tilt[1], tilt[2]);
  return new THREE.Vector3(Math.sin(rad) * r, Math.cos(rad) * r, 0.02).applyEuler(euler);
}
