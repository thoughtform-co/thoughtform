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

/** Fibonacci-sphere point cloud — even, organic distribution across the
 *  unit sphere, used as the particle skin for each celestial body. Returns
 *  a `BufferGeometry` carrying `position`, `aNormal` (surface normal) and
 *  `aSeed` (per-point golden-ratio seed for shader variation). */
export function buildSphereCloudGeometry(radius: number, count: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const yUnit = 1 - (i / Math.max(1, count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - yUnit * yUnit));
    const theta = golden * i;
    const xUnit = Math.cos(theta) * r;
    const zUnit = Math.sin(theta) * r;

    const seed = (((i * 0.6180339887) % 1) + 1) % 1;
    // Shell jitter — particles live in a thin shell around radius so the
    // cloud has depth without becoming a fuzzy ball.
    const shell = 0.965 + seed * 0.07;

    positions[i * 3] = xUnit * radius * shell;
    positions[i * 3 + 1] = yUnit * radius * shell;
    positions[i * 3 + 2] = zUnit * radius * shell;
    normals[i * 3] = xUnit;
    normals[i * 3 + 1] = yUnit;
    normals[i * 3 + 2] = zUnit;
    seeds[i] = seed;
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geom.setAttribute("aNormal", new THREE.BufferAttribute(normals, 3));
  geom.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return geom;
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
