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
 *      visibly converges toward the optical axis.
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
 *     after the camera leaves the opening Thoughtform read; leg 2
 *     resolves BEFORE the Diagnostic/Encode park (revised 2026-06-04)
 *     and the two leg spans nearly meet at the Diagnostic gate, so
 *     the rail shell stays continuously present from the entry
 *     flythrough through to the substrate — the left/right walls no
 *     longer drop out as the camera passes Encode. The opening
 *     Thoughtform park stays clean because leg 1 only lifts once the
 *     entry flythrough begins.
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

/** Longitudinal rails per leg. Bumped 14 -> 20 (2026-06-05 wall
 *  presence pass) so the shell reads as a denser tunnel — the
 *  perceived "you're flying inside walls" cue scales with how many
 *  rails the rays of perspective can catch on. */
const RAIL_COUNT_PER_LEG = 20;

/** Dot counts per rail. Partial rails end midway through the leg
 *  so the shell never closes off into a cage. Bumped 32/16 -> 42/22
 *  (same pass) so each rail reads as a continuous receding line of
 *  dots rather than a sparse scatter, which is the strongest cue
 *  the visitor is inside a long tube. */
const FULL_RAIL_DOTS = 42;
const PARTIAL_RAIL_DOTS = 22;

/** Cross-ring depth slices per leg. A full 360° dotted oval at each
 *  slice gives the shell visible CROSS-SECTIONS the camera flies
 *  through — the strongest "concentric rings receding into a
 *  tunnel" cue (the visual the 1c5494c hemisphere-divergence walls
 *  achieved via left-only cross-rungs, now uniform around the
 *  whole shell so it reads as a unified wormhole, not a split
 *  metaphor). */
const CROSS_RING_COUNT_PER_LEG = 6;
/** Dots around each cross-ring's oval perimeter. 32 reads as a
 *  smooth circle from afar but stays clearly dotted up close. */
const CROSS_RING_DOTS = 32;

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
 *  Leg 1 lifts AFTER the opening Thoughtform park (centre ~0.06),
 *  resolving early in the entry flythrough so the wormhole is already
 *  wrapping you as you fly toward Navigate.
 *
 *  Leg 2 reveal was pulled EARLIER (2026-06-04): it now resolves
 *  BEFORE the Diagnostic/Encode park (0.60) instead of after it.
 *  Previously leg 2 only lifted at 0.63–0.77, so as you scrolled past
 *  Encode the leg-1 rails had already slid behind the camera while
 *  leg 2 hadn't appeared yet — the corridor walls visibly vanished
 *  for a beat. Revealing leg 2 by ~0.57 (combined with the
 *  continuous leg spans below) keeps the left/right rails present the
 *  whole way through, including across the Encode park. */
const LEG_1_REVEAL_START = 0.12;
const LEG_1_REVEAL_END = 0.24;
const LEG_2_REVEAL_START = 0.46;
const LEG_2_REVEAL_END = 0.57;

/** Leg span fractions: rails START just past the source gate and END
 *  just before the destination gate. Tightened toward the gates
 *  (2026-06-04: start 0.12 → 0.06, end 0.94 → 0.99) so leg 1 and
 *  leg 2 very nearly meet at the Diagnostic gate — the residual gap
 *  (~0.7 world units) sits right at the orbit diagram and is masked
 *  by it, so the rail shell reads as ONE continuous tube from the
 *  entry flythrough all the way to the substrate instead of two
 *  disconnected segments with a hole at Encode. */
const LEG_RAIL_START_FRAC = 0.06;
const LEG_RAIL_END_FRAC = 0.99;

// ── Shaders ─────────────────────────────────────────────────────

const wallsVertex = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform vec3 uCameraPos;
uniform float uVisibleNear;
uniform float uVisibleFar;
uniform float uReveal1;
uniform float uReveal2;

attribute vec3 aColor;
attribute float aReveal;
attribute float aSize;

varying vec3 vColor;
varying float vAlpha;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = distance(position, uCameraPos);

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

interface PointBuffers {
  positions: number[];
  colors: number[];
  reveals: number[];
  sizes: number[];
}

function pushPoint(
  buf: PointBuffers,
  x: number,
  y: number,
  z: number,
  color: THREE.Color,
  reveal: number,
  size: number
): void {
  buf.positions.push(x, y, z);
  buf.colors.push(color.r, color.g, color.b);
  buf.reveals.push(reveal);
  buf.sizes.push(size);
}

/** Build the longitudinal dotted rails around the oval shell for one
 *  leg. Rails are deterministically distributed around the full 360°
 *  so the user is enclosed by the lattice; alternating full/partial
 *  rails plus a colour mix prevent the shell from reading as a
 *  perfect cage. */
function buildLegRails(fromZ: number, toZ: number, legIdx: 0 | 1, buf: PointBuffers): void {
  const dawn = new THREE.Color(DAWN_HEX);
  const dawnSoft = new THREE.Color(DAWN_SOFT_HEX);

  for (let i = 0; i < RAIL_COUNT_PER_LEG; i++) {
    // Even angular distribution around the shell with a per-leg
    // phase offset so the two legs don't have rails at identical
    // angles — keeps the second wormhole visually distinct from
    // the first.
    const angle = (i / RAIL_COUNT_PER_LEG) * Math.PI * 2 + legIdx * 0.18;
    const baseX = Math.cos(angle) * SHELL_RX;
    const baseY = Math.sin(angle) * SHELL_RY;

    // Every third rail is "partial" — ends midway through the leg.
    // Mix gold sparingly: only on the cardinal-ish rails.
    const isFull = i % 3 !== 2;
    const dotCount = isFull ? FULL_RAIL_DOTS : PARTIAL_RAIL_DOTS;
    const railEndZ = isFull ? toZ : lerp(fromZ, toZ, 0.55);

    // Color tiering: a quarter of the rails read in dawn (brighter),
    // the rest in dawn-soft. Keeps the lattice palette quiet.
    const railColor = i % 4 === 0 ? dawn : dawnSoft;
    const railSize = isFull ? 1.0 : 0.85;

    for (let d = 0; d < dotCount; d++) {
      const t = dotCount > 1 ? d / (dotCount - 1) : 0;
      const z = lerp(fromZ, railEndZ, t);
      // Inward perspective pull at far end — small but cumulative
      // across many rails it makes the shell visibly converge.
      const inward = 1 - t * RAIL_INWARD_PULL;
      pushPoint(buf, baseX * inward, baseY * inward, z, railColor, legIdx, railSize);
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
    // Corner anchor — gold accent.
    pushPoint(buf, cx, cy, centreZ, gold, legIdx, 1.3);

    // Inward arms — short horizontal + short vertical dotted runs.
    const dirX = -Math.sign(cx);
    const dirY = -Math.sign(cy);
    for (let k = 1; k <= APERTURE_ARM_DOTS; k++) {
      const t = k / APERTURE_ARM_DOTS;
      pushPoint(buf, cx + dirX * armLength * t, cy, centreZ, dawn, legIdx, 0.95);
      pushPoint(buf, cx, cy + dirY * armLength * t, centreZ, dawn, legIdx, 0.95);
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
      pushPoint(buf, x, y, centreZ, dawnSoft, legIdx, 0.85);
    }
  }

  // Mid-edge accent ticks — top + bottom only. Sides are left clear
  // so the HUD rails (which sit at the viewport extremes) don't
  // fight the aperture for the eye.
  pushPoint(buf, 0, halfY, centreZ, dawn, legIdx, 1.0);
  pushPoint(buf, 0, -halfY, centreZ, dawn, legIdx, 1.0);
}

/** Build full 360° cross-section rings around the wormhole shell at
 *  evenly-spaced Z slices through the leg. Each ring is a dotted
 *  oval at the SHELL_RX/SHELL_RY cross-section (with the same inward
 *  perspective pull as the longitudinal rails so the rings sit flush
 *  on the shell as it converges).
 *
 *  This is the single strongest "you are inside a tunnel" cue — when
 *  the camera flies along Z it passes THROUGH the rings, and from
 *  off-centre the rings read as the prominent concentric arcs on the
 *  left and right walls of the wormhole. Restored 2026-06-05 as a
 *  uniform replacement for the retired hemisphere-divergence
 *  cross-rungs (see ADR-018 wall-presence revision). */
function buildCrossRings(fromZ: number, toZ: number, legIdx: 0 | 1, buf: PointBuffers): void {
  // Alternating dawn / gold / dawn-soft so successive rings don't
  // collapse into one uniform colour — keeps the ring stack reading
  // as a layered chart rather than monotone shells.
  const dawn = new THREE.Color(DAWN_HEX);
  const dawnSoft = new THREE.Color(DAWN_SOFT_HEX);
  const gold = new THREE.Color(GOLD_HEX);
  const ringColors = [dawn, dawnSoft, gold];

  for (let s = 0; s < CROSS_RING_COUNT_PER_LEG; s++) {
    // Spread rings evenly through the interior of the leg span,
    // skipping the very start/end so they don't crowd the gate
    // geometry at the leg boundaries.
    const zT = (s + 1) / (CROSS_RING_COUNT_PER_LEG + 1);
    const z = lerp(fromZ, toZ, zT);
    const inward = 1 - zT * RAIL_INWARD_PULL;
    const rx = SHELL_RX * inward;
    const ry = SHELL_RY * inward;
    const color = ringColors[(s + legIdx) % ringColors.length];
    // Slightly smaller dot size on the rings than on the rails so the
    // rails still read as the primary structure and the rings as
    // depth annotations layered on top.
    const dotSize = 0.85;

    for (let d = 0; d < CROSS_RING_DOTS; d++) {
      const angle = (d / CROSS_RING_DOTS) * Math.PI * 2 + legIdx * 0.07;
      const x = Math.cos(angle) * rx;
      const y = Math.sin(angle) * ry;
      pushPoint(buf, x, y, z, color, legIdx, dotSize);
    }
  }
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
        pushPoint(buf, x, y + wave, baseZ, dawnSoft, legIdx, 0.7);
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
} {
  const buf: PointBuffers = {
    positions: [],
    colors: [],
    reveals: [],
    sizes: [],
  };

  const tfZ = STATION_THOUGHTFORM.position[2];
  const dgZ = STATION_DIAGNOSTIC.position[2];
  const intZ = STATION_INTELLIGENCE.position[2];

  // Leg 1 — Thoughtform → Diagnostic.
  const leg1Start = lerp(tfZ, dgZ, LEG_RAIL_START_FRAC);
  const leg1End = lerp(tfZ, dgZ, LEG_RAIL_END_FRAC);
  buildLegRails(leg1Start, leg1End, 0, buf);
  buildCrossRings(leg1Start, leg1End, 0, buf);
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
  buildCrossRings(leg2Start, leg2End, 1, buf);
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
    const { positions, colors, reveals, sizes } = buildWormholeWalls();
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geom.setAttribute("aReveal", new THREE.BufferAttribute(reveals, 1));
    geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return geom;
  }, [enabled]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: wallsVertex,
      fragmentShader: wallsFragment,
      uniforms: {
        uPointSize: { value: 6.5 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uCameraPos: { value: new THREE.Vector3() },
        uVisibleNear: { value: VISIBLE_NEAR },
        uVisibleFar: { value: VISIBLE_FAR },
        uReveal1: { value: 0 },
        uReveal2: { value: 0 },
        uOpacity: { value: 0 },
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
