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
 * After the 2026-05-25 richness pass this gate borrows the diversity
 * mechanisms the Thoughtform compass uses to read as a real
 * instrument (ADR-018):
 *
 *   - Per-orbit linework signatures (solid / long-dash / dotted /
 *     sparse) so the four orbits no longer collapse into "four
 *     near-identical rings".
 *   - A small palette mix (gold / dawn / dawn-soft) across the four
 *     orbits so the field reads as a layered chart, not a single-
 *     hue compass.
 *   - One orbiting "planet" pip per orbit — small camera-facing
 *     diamonds that revolve along their orbit at distinct periods
 *     in alternating directions. Two extra pips ride the ghost
 *     orbits for atmospheric density. Mirrors the v7 compass
 *     atmosphere orbit dots.
 *   - A small static sparkle field scattered inside the gate XY
 *     plane, reading as dust caught between the orbital paths.
 *
 * All four sub-systems are gated on the existing formation reveal
 * (depth-driven construct-on-approach), so the additions intensify
 * the same beat without adding new visibility envelopes.
 *
 * Anchor pips on each orbit pick out where the diagnostic labels
 * attach (the DOM `.miss__label` pills are still rendered as an
 * overlay during this beat).
 */

// ── Palette ──────────────────────────────────────────────────────

const ORBIT_PALETTE = {
  gold: "#caa554",
  dawn: "#ebe3d6",
  dawnSoft: "#d6cdb5",
} as const;

// ── Per-orbit configuration ──────────────────────────────────────

interface OrbitConfig {
  /** Matches the orbit id in `MISS_ORBITS`. */
  id: "01" | "02" | "03" | "04";
  /** Stroke color for the ring + its orbiting planet pip. */
  color: string;
  /** Base alpha at full presence — a higher value reads as the more
   *  "primary" information path. */
  baseAlpha: number;
  /** Dash signature applied AFTER the formation reveal completes.
   *  `gapFrac <= 0.001` reads as effectively solid. The formation
   *  draw-on takes precedence while the orbit is still constructing,
   *  so this only governs the parked / fully-formed appearance. */
  dashSignature: { dashFrac: number; gapFrac: number };
  /** Period (seconds) for the orbiting planet pip to complete one
   *  revolution of its ellipse. Longer = slower. */
  planetPeriodSec: number;
  /** Travel direction: +1 = positive parametric angle (CCW in math
   *  convention), -1 = CW. Alternating directions per orbit so the
   *  field reads as multi-body, not one coordinated sweep. */
  planetDir: 1 | -1;
  /** Starting parametric angle (degrees) so the four planets don't
   *  all start at the same place. */
  planetPhaseDeg: number;
  /** World radius of the planet's diamond outline. */
  planetRadius: number;
}

const ORBIT_CONFIGS: readonly OrbitConfig[] = [
  {
    id: "01",
    color: ORBIT_PALETTE.gold,
    baseAlpha: 0.72,
    // Solid hairline — the densest "primary" information path.
    dashSignature: { dashFrac: 1.0, gapFrac: 0.0 },
    planetPeriodSec: 220,
    planetDir: -1,
    planetPhaseDeg: 35,
    planetRadius: 0.028,
  },
  {
    id: "02",
    color: ORBIT_PALETTE.dawn,
    baseAlpha: 0.55,
    // Long dash / long gap — the "secondary" horizon path.
    dashSignature: { dashFrac: 0.06, gapFrac: 0.04 },
    planetPeriodSec: 180,
    planetDir: 1,
    planetPhaseDeg: 110,
    planetRadius: 0.024,
  },
  {
    id: "03",
    color: ORBIT_PALETTE.dawnSoft,
    baseAlpha: 0.58,
    // Fine dotted — the "track" stitching its way around.
    dashSignature: { dashFrac: 0.012, gapFrac: 0.025 },
    planetPeriodSec: 140,
    planetDir: -1,
    planetPhaseDeg: 240,
    planetRadius: 0.022,
  },
  {
    id: "04",
    color: ORBIT_PALETTE.gold,
    baseAlpha: 0.52,
    // Sparse dash — the "outlier orbit" with the most breathing room.
    dashSignature: { dashFrac: 0.03, gapFrac: 0.06 },
    planetPeriodSec: 110,
    planetDir: 1,
    planetPhaseDeg: 320,
    planetRadius: 0.026,
  },
];

// ── Ghost orbits ────────────────────────────────────────────────

interface GhostOrbit {
  rx: number;
  ry: number;
  rotateDeg: number;
  baseAlpha: number;
  planetPeriodSec: number;
  planetDir: 1 | -1;
  planetPhaseDeg: number;
  planetRadius: number;
}

const GHOST_ORBITS: readonly GhostOrbit[] = [
  {
    rx: 510,
    ry: 200,
    rotateDeg: 6,
    baseAlpha: 0.18,
    planetPeriodSec: 260,
    planetDir: 1,
    planetPhaseDeg: 60,
    planetRadius: 0.018,
  },
  {
    rx: 420,
    ry: 90,
    rotateDeg: -22,
    baseAlpha: 0.13,
    planetPeriodSec: 95,
    planetDir: -1,
    planetPhaseDeg: 200,
    planetRadius: 0.016,
  },
];

// Scale orbit SVG units → world units. MISS_VIEWBOX is 1100 wide,
// so a scale of 1 / 240 yields ~4.6 world units across the system —
// roughly matching the diagnostic gate's halfExtent (2.2).
const SVG_TO_WORLD = 1 / 240;
const RING_SEGMENTS = 128;
const DIAMOND_SEGMENTS = 4;

/** Distance band where the Diagnostic constellation constructs
 *  itself. The gate stays absent while very far away, then the
 *  ellipses trace on as the camera closes in. This avoids both
 *  "pre-visible backdrop" and "opacity pop" reads. */
const DIAGNOSTIC_FORM_START_DEPTH = 9.4;
const DIAGNOSTIC_FORM_FULL_DEPTH = 5.2;
const DIAGNOSTIC_NEAR_DEPTH = 0.9;
const DIAGNOSTIC_NEAR_FADE = 2.4;

/** Static label-attachment pip metadata (anchor diamonds at the
 *  four labelled attachment points). Position is fixed; opacity
 *  follows the formation reveal. */
const PIP_POSITIONS = [
  { id: "01", parametricDeg: 205 },
  { id: "02", parametricDeg: -35 },
  { id: "03", parametricDeg: 155 },
  { id: "04", parametricDeg: 10 },
] as const;

/** Sparkle motes inside the gate XY plane — non-orbiting dust that
 *  fills the negative space between the orbital paths. Lives inside
 *  the existing formation envelope so it appears alongside the
 *  orbits, no separate visibility window. */
const MOTE_COUNT = 14;

// ── Geometry helpers ────────────────────────────────────────────

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

function buildEllipseGeometry(
  rx: number,
  ry: number,
  rotateDeg: number,
  z: number
): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const rotAlpha = (rotateDeg * Math.PI) / 180;
  for (let i = 0; i <= RING_SEGMENTS; i++) {
    const t = (i / RING_SEGMENTS) * Math.PI * 2;
    const lx = rx * Math.cos(t);
    const ly = ry * Math.sin(t);
    const x = lx * Math.cos(rotAlpha) - ly * Math.sin(rotAlpha);
    // Flip Y for y-up world.
    const y = -(lx * Math.sin(rotAlpha) + ly * Math.cos(rotAlpha));
    points.push(new THREE.Vector3(x * SVG_TO_WORLD, y * SVG_TO_WORLD, z));
  }
  return buildDashedGeometry(points);
}

function buildDiamondGeometry(radius: number): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= DIAMOND_SEGMENTS; i++) {
    const a = (i / DIAMOND_SEGMENTS) * Math.PI * 2 + Math.PI / 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
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

/** Drive a `LineDashedMaterial` through formation + per-orbit dash
 *  signature. While forming, the orbit reads as a single growing
 *  arc (draw-on reveal). Once `formation >= 0.995` the per-orbit
 *  signature takes over: `gapFrac <= 0.001` reads as solid; any
 *  other ratio applies a stable dash pattern that lasts through the
 *  parked beat. */
function setOrbitDash(
  material: THREE.LineDashedMaterial,
  lineLength: number,
  formation: number,
  signature: { dashFrac: number; gapFrac: number }
): void {
  if (formation < 0.995) {
    material.dashSize = Math.max(0.0001, lineLength * formation);
    material.gapSize = lineLength * 2;
    return;
  }
  if (signature.gapFrac <= 0.001) {
    material.dashSize = lineLength * 1.2;
    material.gapSize = lineLength * 2;
    return;
  }
  material.dashSize = Math.max(0.0001, lineLength * signature.dashFrac);
  material.gapSize = lineLength * signature.gapFrac;
}

// ── Sparkle mote shaders ────────────────────────────────────────

const moteVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
attribute float aSeed;
varying float vSeed;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float distFactor = clamp(2.0 / max(0.4, -mv.z), 0.4, 1.4);
  gl_PointSize = uPointSize * uPixelRatio * distFactor * (0.7 + fract(aSeed * 17.0) * 0.6);
  vSeed = aSeed;
}
`;

const moteFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vSeed;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float soft = smoothstep(0.5, 0.0, d);
  float jitter = 0.5 + fract(vSeed * 73.0) * 0.5;
  float alpha = soft * jitter * uOpacity;
  if (alpha < 0.015) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

// ── Component ───────────────────────────────────────────────────

export function DiagnosticOrbitGate() {
  const groupRef = useRef<THREE.Group>(null);
  const orbitPlanetRefs = useRef<(THREE.LineLoop | null)[]>([]);
  const ghostPlanetRefs = useRef<(THREE.LineLoop | null)[]>([]);

  // ── Orbit ring geometries (one per ORBIT_CONFIGS entry) ─────
  const orbitGeoms = useMemo(() => {
    return ORBIT_CONFIGS.map((cfg) => {
      const orbit = MISS_ORBITS.find((o) => o.id === cfg.id);
      if (!orbit) throw new Error(`Missing MISS_ORBITS entry for ${cfg.id}`);
      return buildEllipseGeometry(orbit.rx, orbit.ry, orbit.rotateDeg, 0);
    });
  }, []);

  // ── Ghost orbit geometries — fainter additional arcs for nav
  //    chart density (extra ellipses slightly outside the four). ──
  const ghostGeoms = useMemo(() => {
    return GHOST_ORBITS.map((g) => buildEllipseGeometry(g.rx, g.ry, g.rotateDeg, -0.05));
  }, []);

  // ── Materials ───────────────────────────────────────────────
  const orbitMats = useMemo(() => {
    return ORBIT_CONFIGS.map((cfg) => {
      return new THREE.LineDashedMaterial({
        color: new THREE.Color(cfg.color),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        linewidth: 1,
        toneMapped: false,
        userData: { baseAlpha: cfg.baseAlpha },
      });
    });
  }, []);

  const ghostMats = useMemo(() => {
    return GHOST_ORBITS.map(
      () =>
        new THREE.LineDashedMaterial({
          color: new THREE.Color(0.93, 0.89, 0.84),
          transparent: true,
          opacity: 0,
          depthWrite: false,
          dashSize: 0.0001,
          gapSize: 10,
        })
    );
  }, []);

  // ── Static label-attachment pips ────────────────────────────
  const pipPositions = useMemo(() => {
    return PIP_POSITIONS.map(({ id, parametricDeg }) => {
      const orbit = MISS_ORBITS.find((o) => o.id === id);
      if (!orbit) throw new Error(`Missing MISS_ORBITS entry for pip ${id}`);
      const [x, y] = pointOnEllipse(orbit.rx, orbit.ry, orbit.rotateDeg, parametricDeg);
      // Flip Y for y-up world (matches the orbit ring flip).
      return new THREE.Vector3(x * SVG_TO_WORLD, -y * SVG_TO_WORLD, 0.01);
    });
  }, []);

  const pipGeom = useMemo(() => buildDiamondGeometry(0.04), []);

  const pipMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(ORBIT_PALETTE.gold),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    []
  );

  // ── Orbiting planet pips ────────────────────────────────────
  const orbitPlanetGeoms = useMemo(
    () => ORBIT_CONFIGS.map((cfg) => buildDiamondGeometry(cfg.planetRadius)),
    []
  );

  const orbitPlanetMats = useMemo(() => {
    return ORBIT_CONFIGS.map((cfg) => {
      return new THREE.LineBasicMaterial({
        color: new THREE.Color(cfg.color),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      });
    });
  }, []);

  const ghostPlanetGeoms = useMemo(
    () => GHOST_ORBITS.map((g) => buildDiamondGeometry(g.planetRadius)),
    []
  );

  const ghostPlanetMats = useMemo(() => {
    return GHOST_ORBITS.map(
      () =>
        new THREE.LineBasicMaterial({
          color: new THREE.Color(ORBIT_PALETTE.dawn),
          transparent: true,
          opacity: 0,
          depthWrite: false,
          toneMapped: false,
        })
    );
  }, []);

  // ── Sparkle motes inside the orbital field ──────────────────
  const moteGeom = useMemo(() => {
    const positions = new Float32Array(MOTE_COUNT * 3);
    const seeds = new Float32Array(MOTE_COUNT);
    // Place inside an annulus that wraps the orbital paths without
    // crowding the brandmark centre or the far horizon orbit. r in
    // [0.55, 1.95] world units keeps motes between the inner orbit
    // (rx 305 → ~1.27 world) and the longest horizon (rx 465 →
    // ~1.94 world).
    for (let i = 0; i < MOTE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.55 + Math.random() * 1.4;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.sin(angle) * r;
      positions[i * 3 + 2] = 0;
      seeds[i] = Math.random();
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geom;
  }, []);

  const moteMat = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: moteVertex,
      fragmentShader: moteFragment,
      uniforms: {
        uPointSize: { value: 2.4 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uColor: { value: new THREE.Color(ORBIT_PALETTE.dawnSoft) },
        uOpacity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useEffect(() => {
    return () => {
      orbitGeoms.forEach((g) => g.dispose());
      ghostGeoms.forEach((g) => g.dispose());
      orbitPlanetGeoms.forEach((g) => g.dispose());
      ghostPlanetGeoms.forEach((g) => g.dispose());
      pipGeom.dispose();
      moteGeom.dispose();
      orbitMats.forEach((m) => m.dispose());
      ghostMats.forEach((m) => m.dispose());
      orbitPlanetMats.forEach((m) => m.dispose());
      ghostPlanetMats.forEach((m) => m.dispose());
      pipMat.dispose();
      moteMat.dispose();
    };
  }, [
    orbitGeoms,
    ghostGeoms,
    orbitPlanetGeoms,
    ghostPlanetGeoms,
    pipGeom,
    moteGeom,
    orbitMats,
    ghostMats,
    orbitPlanetMats,
    ghostPlanetMats,
    pipMat,
    moteMat,
  ]);

  // ── Per-frame visibility envelope + planet motion ───────────
  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    const { progress, active } = useDepthGatewayStore.getState().transform;
    if (!active) {
      group.visible = false;
      return;
    }

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

    // Orbits: per-orbit dash signature + per-orbit base alpha.
    for (let i = 0; i < orbitMats.length; i++) {
      const cfg = ORBIT_CONFIGS[i];
      const m = orbitMats[i];
      const staggeredFormation = clamp01((formation - i * 0.045) / 0.82);
      setOrbitDash(m, geometryLength(orbitGeoms[i]), staggeredFormation, cfg.dashSignature);
      m.opacity = builtPresence * cfg.baseAlpha;
    }

    // Ghosts construct slightly later than the labelled orbits.
    for (let i = 0; i < ghostMats.length; i++) {
      const ghostFormation = clamp01((formation - 0.12 - i * 0.06) / 0.75);
      const len = geometryLength(ghostGeoms[i]);
      ghostMats[i].dashSize = Math.max(0.0001, len * ghostFormation);
      ghostMats[i].gapSize = len * 2;
      ghostMats[i].opacity = builtPresence * GHOST_ORBITS[i].baseAlpha;
    }

    // Static label-attachment pips: resolve only after the orbit
    // skeleton is mostly formed.
    const pipResolve = smoothstep(0.62, 0.92, formation);
    pipMat.opacity = builtPresence * pipResolve * 0.95;

    // Orbiting planet pips. Position from per-orbit period +
    // direction; opacity gates on near-presence so they don't
    // suddenly materialise during the very first form-on frames.
    const t = clock.elapsedTime;
    const planetResolve = smoothstep(0.55, 0.92, formation);
    for (let i = 0; i < ORBIT_CONFIGS.length; i++) {
      const cfg = ORBIT_CONFIGS[i];
      const orbit = MISS_ORBITS.find((o) => o.id === cfg.id);
      const ref = orbitPlanetRefs.current[i];
      if (!orbit || !ref) continue;
      const parametricDeg = cfg.planetPhaseDeg + cfg.planetDir * (t / cfg.planetPeriodSec) * 360;
      const [x, y] = pointOnEllipse(orbit.rx, orbit.ry, orbit.rotateDeg, parametricDeg);
      ref.position.set(x * SVG_TO_WORLD, -y * SVG_TO_WORLD, 0.015);
      // Planets read a touch brighter than the orbit they ride on.
      orbitPlanetMats[i].opacity =
        builtPresence * planetResolve * Math.min(1, cfg.baseAlpha + 0.18);
    }

    for (let i = 0; i < GHOST_ORBITS.length; i++) {
      const g = GHOST_ORBITS[i];
      const ref = ghostPlanetRefs.current[i];
      if (!ref) continue;
      const parametricDeg = g.planetPhaseDeg + g.planetDir * (t / g.planetPeriodSec) * 360;
      const [x, y] = pointOnEllipse(g.rx, g.ry, g.rotateDeg, parametricDeg);
      ref.position.set(x * SVG_TO_WORLD, -y * SVG_TO_WORLD, -0.04);
      ghostPlanetMats[i].opacity = builtPresence * planetResolve * Math.min(1, g.baseAlpha + 0.45);
    }

    // Sparkle motes fade in alongside the orbits but stay subtle
    // (cap at 0.55) so they never compete with the linework or the
    // brandmark centre.
    const moteOpacity = builtPresence * smoothstep(0.35, 0.85, formation) * 0.55;
    (moteMat.uniforms.uOpacity as { value: number }).value = moteOpacity;
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
      {ORBIT_CONFIGS.map((cfg, i) => (
        <lineLoop
          key={`planet-${cfg.id}`}
          ref={(node) => {
            orbitPlanetRefs.current[i] = node;
          }}
          geometry={orbitPlanetGeoms[i]}
          material={orbitPlanetMats[i]}
        />
      ))}
      {GHOST_ORBITS.map((_, i) => (
        <lineLoop
          key={`ghost-planet-${i}`}
          ref={(node) => {
            ghostPlanetRefs.current[i] = node;
          }}
          geometry={ghostPlanetGeoms[i]}
          material={ghostPlanetMats[i]}
        />
      ))}
      <points geometry={moteGeom} material={moteMat} frustumCulled={false} />
    </group>
  );
}
