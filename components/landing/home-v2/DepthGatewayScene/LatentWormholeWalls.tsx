"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { lerp, smoothstep, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { STATION_DIAGNOSTIC, STATION_INTELLIGENCE, STATION_THOUGHTFORM } from "./sceneGeom";

/**
 * LatentWormholeWalls — subtle particle-based wormhole topology
 * around BOTH passthrough legs (ADR-018, world-owned corridor).
 *
 * The corridor between gates used to read as "open space with a few
 * shards drifting past". This layer turns each travel leg into a
 * loose particle shell so the viewer feels enclosed by a wormhole
 * while flying from one gate to the next — without ever building a
 * literal grid tube.
 *
 * Composition per leg (Thoughtform → Diagnostic and
 * Diagnostic → Intelligence):
 *
 *   1. **Longitudinal rails** — 14 dotted lines that run along Z
 *      around an oval shell. About a third are partial rails (end
 *      midway through the leg) so the shell never reads as a closed
 *      cage. Rails drift slightly inward with depth so the shell
 *      visibly converges toward the optical axis. The two HEMISPHERES
 *      diverge in character (Refinement 3): the LEFT (−X) is a rigid
 *      cool-steel "Tool" lattice (straight rails + horizontal
 *      cross-rungs), the RIGHT (+X) an organic warm "Collaborator"
 *      flow (curved, jittered rails that subtly breathe). The
 *      brandmark + copy travel the X≈0 seam between them.
 *
 *   2. **Aperture frames** — 3 sparse depth-gate frames per leg.
 *      Four gold corner anchors with short dawn arms in two
 *      directions plus mid-edge ticks. Sized just inside the rail
 *      shell so the camera passes through "stations" without ever
 *      seeing a closed rectangle.
 *
 *   3. **Topographic shelves** — a few rows of low-alpha dawn-soft
 *      dots below the optical axis. Faintly waved across X+Z so
 *      they suggest a latent floor receding into the corridor,
 *      mirroring the archived `pushTopographicFloor` recipe in
 *      `components/landing/latent-cases/celestialGatewayGeometry.ts`.
 *
 * Visibility contract (ADR-018):
 *
 *   - Geometry is WORLD-FIXED. Positions are generated once from a
 *     deterministic catalogue tied to the gate stations. There is
 *     NO idle motion — every dot holds still when the user stops
 *     scrolling, and the perceived flow comes from the camera
 *     dollying past the world-rigid points.
 *   - Each leg has its OWN progress reveal envelope. Leg 1 resolves
 *     after the camera leaves the parked Thoughtform read; leg 2
 *     resolves after the parked Diagnostic read. Parked beats
 *     therefore stay clean.
 *   - Per-point camera-space depth fade is computed in the vertex
 *     shader so dots ahead of the camera fade in as they approach
 *     and clip out as they cross the near plane — same depth-focus
 *     pattern used by every other world-rigid layer on this route.
 *   - A small scroll-velocity opacity lift sharpens the read during
 *     active travel, but the baseline alpha cap stays subtle (peak
 *     centre-of-dot alpha ~0.35 even with lift).
 *
 * Pairs with:
 *   - `LatentFieldTunnel`        : camera-relative ambient field +
 *                                 embedding vectors (sits BEHIND
 *                                 this layer in paint order).
 *   - `LatentTopographyContours` : world-fixed contour shards inside
 *                                 the shell (paints ABOVE this layer
 *                                 so contours read on the rails).
 *   - `InterGateCorridor`        : ring debris bands — the walls
 *                                 enclose the same Z bands that
 *                                 already host the debris.
 *
 * Mobile-narrow viewports skip the layer entirely, matching the
 * `LatentTopographyContours` gate, so tight viewports keep the
 * copy + brandmark composition uncluttered.
 */

// ── Palette ──────────────────────────────────────────────────────

const DAWN_HEX = "#ebe3d6";
const DAWN_SOFT_HEX = "#d6cdb5";
const GOLD_HEX = "#caa554";

/** Tool hemisphere (left, −X) — cool steel tints. The rigid lattice
 *  reads against the warm Collaborator flow on the right. */
const TOOL_HEX = "#c9d2db";
const TOOL_SOFT_HEX = "#9fb0bf";

// ── Shell geometry ──────────────────────────────────────────────

/** Oval cross-section of the wormhole shell. Wider than tall so the
 *  rails read with the 16:9-leaning corridor frame and clear the HUD
 *  rails (which sit roughly at the viewport extremes). */
const SHELL_RX = 2.15;
const SHELL_RY = 1.35;

/** How much each rail pulls inward at its far end. A larger inward
 *  drift gives the shell a clearer vanishing-point read — the rails
 *  visibly converge toward the optical axis as they recede, which
 *  is the single strongest cue that the user is flying through a
 *  tunnel and not past a flat picture. */
const RAIL_INWARD_PULL = 0.28;

/** Longitudinal rails per leg. */
const RAIL_COUNT_PER_LEG = 14;

/** Collaborator hemisphere (right, +X) flow: the rail centreline curves
 *  along Z (sine in X, gentler cosine in Y) so the right wall reads as
 *  an organic, breathing flow rather than a ruled cage. */
const RIGHT_FLOW_FREQ = 0.9;
const RIGHT_FLOW_AMP = 0.13;

/** Tool hemisphere (left, −X) cross-rungs: horizontal connectors strung
 *  between angularly-adjacent left rails at fixed Z intervals. These are
 *  what make the left wall read as a rigid orthogonal lattice / ladder. */
const CROSS_RUNG_Z_SPACING = 1.3;
const CROSS_RUNG_DOTS = 4;

/** Dot counts per rail. Partial rails end midway through the leg
 *  so the shell never closes off into a cage. */
const FULL_RAIL_DOTS = 32;
const PARTIAL_RAIL_DOTS = 16;

/** Aperture depth-gate frames per leg. */
const APERTURE_FRAMES_PER_LEG = 3;
/** Dots along each corner's two short arms. */
const APERTURE_ARM_DOTS = 5;
/** Dots along the dashed edge segments between corners (per side).
 *  Used to give the aperture a clear rectangular outline read while
 *  the corner anchors still carry the gold-accent registration. */
const APERTURE_EDGE_DOTS = 6;

/** Topographic shelf rows per leg + dots per row. */
const SHELF_ROW_COUNT = 3;
const SHELF_Z_SLICES = 5;
const SHELF_X_SAMPLES = 8;

// ── Visibility constants ────────────────────────────────────────

/** Camera-space distance band where wall points are visible. Wider
 *  than the latent field's because rails span more world Z and
 *  should fade in gently as they approach. */
const VISIBLE_NEAR = 0.6;
const VISIBLE_FAR = 22;

/** Reveal envelopes per leg, in global progress units.
 *
 *  Leg 1 lifts AFTER the trimmed Thoughtform park (centre 0.07),
 *  resolving by progress 0.30 — well inside the long passthrough-01
 *  window (0.14 → 0.46).
 *
 *  Leg 2 lifts AFTER the Diagnostic park (centre 0.53), resolving
 *  by progress 0.66 — comfortably inside passthrough-02
 *  (0.60 → 0.76). */
const LEG_1_REVEAL_START = 0.18;
const LEG_1_REVEAL_END = 0.3;
const LEG_2_REVEAL_START = 0.56;
const LEG_2_REVEAL_END = 0.66;

/** Leg span fractions: rails START slightly past the source gate and
 *  END slightly before the destination gate so they don't intersect
 *  the gate group geometry directly. */
const LEG_RAIL_START_FRAC = 0.12;
const LEG_RAIL_END_FRAC = 0.94;

// ── Shaders ─────────────────────────────────────────────────────

const wallsVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform vec3 uCameraPos;
uniform float uVisibleNear;
uniform float uVisibleFar;
uniform float uReveal1;
uniform float uReveal2;
uniform float uTime;

attribute vec3 aColor;
attribute float aReveal;
attribute float aSize;
attribute float aSide;

varying vec3 vColor;
varying float vAlpha;

void main() {
  // Collaborator hemisphere (aSide = 1) breathes: a small radial pulse
  // animated by uTime. The Tool hemisphere (aSide = 0 — left rails,
  // cross-rungs, apertures, shelves) stays perfectly rigid.
  vec3 pos = position;
  if (aSide > 0.5) {
    vec2 radial = pos.xy;
    float rl = length(radial);
    if (rl > 0.001) {
      radial /= rl;
      float breathe = sin(uTime * 0.6 + pos.z * 0.9) * 0.045;
      pos.xy += radial * breathe;
    }
  }

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float dist = distance(pos, uCameraPos);

  // Camera-space depth focus. Walls behind the camera or beyond the
  // far plane vanish; rails ahead fade in as they approach.
  float farFade = smoothstep(uVisibleFar, uVisibleFar - 5.0, dist);
  float nearFade = smoothstep(uVisibleNear, uVisibleNear + 1.2, dist);

  // Per-point leg gate: aReveal = 0 for leg 1, aReveal = 1 for leg 2.
  float reveal = mix(uReveal1, uReveal2, aReveal);

  gl_Position = projectionMatrix * mv;

  vColor = aColor;
  vAlpha = reveal * farFade * nearFade;

  // Distance-based size with a generous floor so far rails still
  // resolve as individual dots, not pixel dust.
  float sizeFactor = clamp(7.0 / max(0.5, dist), 0.55, 2.6);
  gl_PointSize = uPointSize * uPixelRatio * sizeFactor * aSize;
}
`;

const wallsFragment = /* glsl */ `
uniform float uOpacity;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  // Soft round dots. No halo — keeps the lattice crisp.
  float core = smoothstep(0.5, 0.0, d);
  float alpha = core * vAlpha * uOpacity;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor, alpha);
}
`;

// ── Geometry builders ───────────────────────────────────────────

function clampUnit(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

interface PointBuffers {
  positions: number[];
  colors: number[];
  reveals: number[];
  sizes: number[];
  /** 0 = Tool hemisphere (rigid), 1 = Collaborator hemisphere (breathes). */
  sides: number[];
}

function pushPoint(
  buf: PointBuffers,
  x: number,
  y: number,
  z: number,
  color: THREE.Color,
  reveal: number,
  size: number,
  side: number
): void {
  buf.positions.push(x, y, z);
  buf.colors.push(color.r, color.g, color.b);
  buf.reveals.push(reveal);
  buf.sizes.push(size);
  buf.sides.push(side);
}

/** Build the longitudinal dotted rails around the oval shell for one
 *  leg. The two HEMISPHERES diverge in character (Refinement 3): the
 *  LEFT (−X) is a rigid orthogonal "Tool" lattice — straight rails, even
 *  spacing, cool steel tint, plus horizontal cross-rungs (built after)
 *  — while the RIGHT (+X) is an organic "Collaborator" flow — the rail
 *  centreline curves along Z, spacing is jittered, and the tint warms to
 *  gold/dawn. The brandmark + section copy travel down the X≈0 seam
 *  between the two walls, so the metaphor (intelligence sitting between
 *  tool and collaborator) is structural, not labelled. */
function buildLegRails(fromZ: number, toZ: number, legIdx: 0 | 1, buf: PointBuffers): void {
  const steel = new THREE.Color(TOOL_HEX);
  const steelSoft = new THREE.Color(TOOL_SOFT_HEX);
  const warmGold = new THREE.Color(GOLD_HEX);
  const warmDawn = new THREE.Color(DAWN_HEX);

  // Left-hemisphere rail base positions, collected for the cross-rungs.
  const leftRails: { x: number; y: number }[] = [];

  for (let i = 0; i < RAIL_COUNT_PER_LEG; i++) {
    // Even angular distribution around the shell with a per-leg
    // phase offset so the two legs don't have rails at identical
    // angles — keeps the second wormhole visually distinct from
    // the first.
    const angle = (i / RAIL_COUNT_PER_LEG) * Math.PI * 2 + legIdx * 0.18;
    const baseX = Math.cos(angle) * SHELL_RX;
    const baseY = Math.sin(angle) * SHELL_RY;
    const isLeft = baseX < 0; // Tool hemisphere
    const sideVal = isLeft ? 0 : 1;

    // Every third rail is "partial" — ends midway through the leg.
    const isFull = i % 3 !== 2;
    const dotCount = isFull ? FULL_RAIL_DOTS : PARTIAL_RAIL_DOTS;
    const railEndZ = isFull ? toZ : lerp(fromZ, toZ, 0.55);

    // Hemisphere tint: cool steel on the Tool side, warm gold/dawn on
    // the Collaborator side. Each tier keeps a quiet two-tone mix.
    const railColor = isLeft
      ? i % 4 === 0
        ? steel
        : steelSoft
      : i % 3 === 0
        ? warmGold
        : warmDawn;
    const railSize = isFull ? 1.0 : 0.85;

    if (isLeft) leftRails.push({ x: baseX, y: baseY });

    for (let d = 0; d < dotCount; d++) {
      const baseT = dotCount > 1 ? d / (dotCount - 1) : 0;
      // LEFT: even spacing (rigid). RIGHT: deterministic jitter so the
      // flow reads irregular / hand-strung rather than ruled.
      const t = isLeft
        ? baseT
        : clampUnit(baseT + (Math.sin(d * 1.7 + i * 2.3) * 0.5) / dotCount);
      const z = lerp(fromZ, railEndZ, t);
      // Inward perspective pull at far end — small but cumulative
      // across many rails it makes the shell visibly converge.
      const inward = 1 - t * RAIL_INWARD_PULL;
      let x = baseX * inward;
      let y = baseY * inward;
      if (!isLeft) {
        // Organic centreline flow — curve the rail along Z.
        x += Math.sin(z * RIGHT_FLOW_FREQ + angle * 1.3) * RIGHT_FLOW_AMP;
        y += Math.cos(z * RIGHT_FLOW_FREQ * 0.8 + angle) * RIGHT_FLOW_AMP * 0.6;
      }
      pushPoint(buf, x, y, z, railColor, legIdx, railSize, sideVal);
    }
  }

  buildLeftCrossRungs(fromZ, toZ, legIdx, leftRails, buf);
}

/** Build the Tool-hemisphere cross-rungs: short straight dot-runs strung
 *  between angularly-adjacent left rails at fixed Z intervals. The
 *  resulting ladder reads as a rigid orthogonal lattice — the structural
 *  opposite of the curved Collaborator flow on the right. */
function buildLeftCrossRungs(
  fromZ: number,
  toZ: number,
  legIdx: 0 | 1,
  leftRails: { x: number; y: number }[],
  buf: PointBuffers
): void {
  if (leftRails.length < 2) return;
  const steel = new THREE.Color(TOOL_HEX);

  // Order rails around the arc so adjacency is along the shell.
  const sorted = [...leftRails].sort(
    (a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x)
  );
  const span = Math.abs(toZ - fromZ);
  const slices = Math.max(2, Math.round(span / CROSS_RUNG_Z_SPACING));

  for (let s = 1; s < slices; s++) {
    const frac = s / slices;
    const z = lerp(fromZ, toZ, frac);
    // Match the longitudinal rails' inward convergence so the rungs sit
    // flush on the shell rather than floating off it.
    const inward = 1 - frac * RAIL_INWARD_PULL;
    for (let r = 0; r < sorted.length - 1; r++) {
      const a = sorted[r];
      const b = sorted[r + 1];
      for (let k = 1; k < CROSS_RUNG_DOTS; k++) {
        const t = k / CROSS_RUNG_DOTS;
        const x = lerp(a.x, b.x, t) * inward;
        const y = lerp(a.y, b.y, t) * inward;
        pushPoint(buf, x, y, z, steel, legIdx, 0.8, 0);
      }
    }
  }
}

/** Build one depth-gate aperture frame — four gold corner anchors
 *  with short inward arms, a dashed rectangular outline between
 *  them, and a mid-edge tick on top + bottom only. Reads as a
 *  rectangular station the camera passes through. */
function buildAperture(
  centreZ: number,
  halfX: number,
  halfY: number,
  legIdx: 0 | 1,
  buf: PointBuffers
): void {
  const gold = new THREE.Color(GOLD_HEX);
  const dawn = new THREE.Color(DAWN_HEX);
  const dawnSoft = new THREE.Color(DAWN_SOFT_HEX);

  const corners: [number, number][] = [
    [-halfX, -halfY],
    [halfX, -halfY],
    [halfX, halfY],
    [-halfX, halfY],
  ];
  const armLength = 0.22;

  for (const [cx, cy] of corners) {
    // Corner anchor — gold accent. Apertures stay symmetric + rigid
    // (side 0) — the rails/rungs carry the Tool/Collaborator metaphor.
    pushPoint(buf, cx, cy, centreZ, gold, legIdx, 1.3, 0);

    // Inward arms — short horizontal + short vertical dotted runs.
    const dirX = -Math.sign(cx);
    const dirY = -Math.sign(cy);
    for (let k = 1; k <= APERTURE_ARM_DOTS; k++) {
      const t = k / APERTURE_ARM_DOTS;
      pushPoint(buf, cx + dirX * armLength * t, cy, centreZ, dawn, legIdx, 0.95, 0);
      pushPoint(buf, cx, cy + dirY * armLength * t, centreZ, dawn, legIdx, 0.95, 0);
    }
  }

  // Dashed rectangular outline — interior edge dots between the
  // corner anchors. Skip the endpoint slots (corners already own
  // those) and the slot adjacent to the corner (the inward arms
  // already populate that). This leaves a sparse interior dash
  // pattern that closes the rectangle without making it feel
  // solid.
  for (let side = 0; side < 4; side++) {
    const [ax, ay] = corners[side];
    const [bx, by] = corners[(side + 1) % 4];
    for (let k = 2; k <= APERTURE_EDGE_DOTS; k++) {
      const t = k / (APERTURE_EDGE_DOTS + 2);
      const x = ax + (bx - ax) * t;
      const y = ay + (by - ay) * t;
      pushPoint(buf, x, y, centreZ, dawnSoft, legIdx, 0.85, 0);
    }
  }

  // Mid-edge accent ticks — top + bottom only. Sides are left clear
  // so the HUD rails (which sit at the viewport extremes) don't
  // fight the aperture for the eye.
  pushPoint(buf, 0, halfY, centreZ, dawn, legIdx, 1.0, 0);
  pushPoint(buf, 0, -halfY, centreZ, dawn, legIdx, 1.0, 0);
}

/** Build the lower topographic shelves for one leg — a few rows of
 *  faintly waved dots below the optical axis. Reads as a latent
 *  floor receding into the corridor, mirroring the archived
 *  `pushTopographicFloor` recipe but using particle dots rather
 *  than literal landscape mesh. */
function buildShelves(fromZ: number, toZ: number, legIdx: 0 | 1, buf: PointBuffers): void {
  const dawnSoft = new THREE.Color(DAWN_SOFT_HEX);
  for (let s = 0; s < SHELF_ROW_COUNT; s++) {
    const sT = SHELF_ROW_COUNT > 1 ? s / (SHELF_ROW_COUNT - 1) : 0;
    const y = -1.1 - sT * 0.25;
    const xExtent = 1.85 - sT * 0.15;

    for (let zi = 0; zi < SHELF_Z_SLICES; zi++) {
      const zT = (zi + 0.5) / SHELF_Z_SLICES;
      const baseZ = lerp(fromZ, toZ, zT);
      for (let xi = 0; xi < SHELF_X_SAMPLES; xi++) {
        const xT = SHELF_X_SAMPLES > 1 ? xi / (SHELF_X_SAMPLES - 1) : 0;
        const x = -xExtent + xT * 2 * xExtent;
        // Deterministic wave so the shelf reads as terrain, not a
        // perfectly ruled grid.
        const wave = Math.sin(x * 2.4 + baseZ * 1.7 + s * 1.3 + legIdx * 0.9) * 0.05;
        pushPoint(buf, x, y + wave, baseZ, dawnSoft, legIdx, 0.7, 0);
      }
    }
  }
}

/** Assemble both legs into a single deterministic point buffer. */
function buildWormholeWalls(): {
  positions: Float32Array;
  colors: Float32Array;
  reveals: Float32Array;
  sizes: Float32Array;
  sides: Float32Array;
} {
  const buf: PointBuffers = {
    positions: [],
    colors: [],
    reveals: [],
    sizes: [],
    sides: [],
  };

  const tfZ = STATION_THOUGHTFORM.position[2];
  const dgZ = STATION_DIAGNOSTIC.position[2];
  const intZ = STATION_INTELLIGENCE.position[2];

  // Leg 1 — Thoughtform → Diagnostic.
  const leg1Start = lerp(tfZ, dgZ, LEG_RAIL_START_FRAC);
  const leg1End = lerp(tfZ, dgZ, LEG_RAIL_END_FRAC);
  buildLegRails(leg1Start, leg1End, 0, buf);
  buildShelves(leg1Start, leg1End, 0, buf);
  for (let i = 0; i < APERTURE_FRAMES_PER_LEG; i++) {
    const t = (i + 1) / (APERTURE_FRAMES_PER_LEG + 1);
    const z = lerp(leg1Start, leg1End, t);
    // Apertures shrink as they recede so the camera reads a
    // perspective convergence — same vanishing-point hint as the
    // rail inward pull.
    const halfX = 1.95 - t * 0.45;
    const halfY = 1.2 - t * 0.32;
    buildAperture(z, halfX, halfY, 0, buf);
  }

  // Leg 2 — Diagnostic → Intelligence.
  const leg2Start = lerp(dgZ, intZ, LEG_RAIL_START_FRAC);
  const leg2End = lerp(dgZ, intZ, LEG_RAIL_END_FRAC);
  buildLegRails(leg2Start, leg2End, 1, buf);
  buildShelves(leg2Start, leg2End, 1, buf);
  for (let i = 0; i < APERTURE_FRAMES_PER_LEG; i++) {
    const t = (i + 1) / (APERTURE_FRAMES_PER_LEG + 1);
    const z = lerp(leg2Start, leg2End, t);
    const halfX = 1.95 - t * 0.45;
    const halfY = 1.2 - t * 0.32;
    buildAperture(z, halfX, halfY, 1, buf);
  }

  return {
    positions: new Float32Array(buf.positions),
    colors: new Float32Array(buf.colors),
    reveals: new Float32Array(buf.reveals),
    sizes: new Float32Array(buf.sizes),
    sides: new Float32Array(buf.sides),
  };
}

// ── Component ───────────────────────────────────────────────────

/** Baseline material opacity once a leg has fully revealed. Tuned so
 *  the rail lattice reads as architecture during travel (centre-of-
 *  dot final alpha ≈ 0.42 after the soft-disk falloff) while still
 *  feeling quiet enough that the gate diagrams + brandmark stay the
 *  dominant centre of attention. */
const OPACITY_BASE = 0.84;
/** Maximum opacity lift from scroll velocity. Small — base already
 *  reads architecturally; this just sharpens the lattice during
 *  active flight without flashing the walls bright. */
const OPACITY_VELOCITY_LIFT_MAX = 0.16;
/** How quickly the opacity tracks the target (smoothing factor). */
const OPACITY_RESPONSE = 5;

export function LatentWormholeWalls() {
  const pointsRef = useRef<THREE.Points>(null);
  const opacityRef = useRef<number>(0);
  const lastTime = useRef<number>(-1);

  // Skip on narrow viewports — same gate as `LatentTopographyContours`.
  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 760;
  }, []);

  const geometry = useMemo(() => {
    if (!enabled) return null;
    const { positions, colors, reveals, sizes, sides } = buildWormholeWalls();
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geom.setAttribute("aReveal", new THREE.BufferAttribute(reveals, 1));
    geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute("aSide", new THREE.BufferAttribute(sides, 1));
    return geom;
  }, [enabled]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: wallsVertex,
      fragmentShader: wallsFragment,
      uniforms: {
        uPointSize: { value: 5.0 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uCameraPos: { value: new THREE.Vector3() },
        uVisibleNear: { value: VISIBLE_NEAR },
        uVisibleFar: { value: VISIBLE_FAR },
        uReveal1: { value: 0 },
        uReveal2: { value: 0 },
        uOpacity: { value: 0 },
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useEffect(() => {
    return () => {
      material.dispose();
      geometry?.dispose();
    };
  }, [material, geometry]);

  useFrame((state) => {
    if (!geometry) return;
    const { camera, viewport } = state;
    const now = state.clock.elapsedTime;
    const lastT = lastTime.current;
    lastTime.current = now;
    const dt = lastT < 0 ? 0 : Math.min(0.1, now - lastT);

    const transform = useDepthGatewayStore.getState().transform;
    const { paintProgress, active, armed, velocity } = transform;
    const painting = active || armed;

    material.uniforms.uPixelRatio.value = viewport.dpr;
    material.uniforms.uTime.value = now;
    (material.uniforms.uCameraPos.value as THREE.Vector3).copy(camera.position);

    if (!painting) {
      opacityRef.current = 0;
      material.uniforms.uOpacity.value = 0;
      material.uniforms.uReveal1.value = 0;
      material.uniforms.uReveal2.value = 0;
      return;
    }

    const reveal1 = smoothstep(LEG_1_REVEAL_START, LEG_1_REVEAL_END, paintProgress);
    const reveal2 = smoothstep(LEG_2_REVEAL_START, LEG_2_REVEAL_END, paintProgress);
    material.uniforms.uReveal1.value = reveal1;
    material.uniforms.uReveal2.value = reveal2;

    // Velocity lift sharpens the lattice during active travel.
    // |velocity| is in progress-units / sec; a 2x multiplier reaches
    // the lift cap at moderate scroll speeds.
    const absV = Math.abs(velocity);
    const velocityT = Math.min(1, absV * 2.0);
    const target = OPACITY_BASE + velocityT * OPACITY_VELOCITY_LIFT_MAX;

    // Critically-damped tracking so the lift doesn't snap.
    const k = 1 - Math.exp(-OPACITY_RESPONSE * dt);
    opacityRef.current += (target - opacityRef.current) * k;
    material.uniforms.uOpacity.value = Math.min(1, opacityRef.current);
  });

  if (!geometry) return null;

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
