"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { useCorridorCount } from "@/lib/hooks/useQualityTier";
import { vwTravelRef } from "@/lib/home-v2/vwTravelRef";
import { getSmoothedVoidTravel } from "./motionFollower";
import { BRANDMARK_ANCHOR_INTELLIGENCE } from "./sceneGeom";

/**
 * VoidwalkerTimeTunnel — the wormhole the through-line is read inside
 * (ADR-081).
 *
 * The corridor already owns a tunnel vocabulary (`LatentWormholeWalls`'
 * dotted longitudinal rails, `LatentFieldTunnel`'s camera-relative
 * respawn cone). This is that grammar re-pointed at TIME: the walls run
 * backwards past the reader, and one GOLD RING per year flies at them,
 * so the graduation the DOM axis draws on the left is the same
 * graduation the space itself is built from. Both come from
 * `voidwalkerTravelClock`, so they cannot drift.
 *
 * ⚠ CAMERA-RELATIVE AND INFINITE. The camera runs a long axial cruise
 * (`VOID_CRUISE_DISTANCE`), so world-fixed geometry would either run out
 * or need to be enormous. Every element here is positioned relative to
 * the camera's own Z and wrapped modulo its spacing — the reader can fly
 * as far as the runway allows and the tunnel is always there. This also
 * answers the ADR-018 v3.12b finding directly: rings placed in a band the
 * camera never passes read as static mandalas, and these are guaranteed
 * to pass.
 *
 * ⚠ It paints NOTHING unless `vwTravelRef.current.engaged` — the uniforms
 * are zeroed and the group is hidden, so a reader who never reaches the
 * through-line pays a couple of buffers and no fill.
 *
 * Mounted inside the corridor canvas, which is already a fixed
 * full-viewport backdrop at this point in the page (the services ambient
 * hold, extended to cover the travel). There is NO second WebGL context.
 */

/** Wall points per ring of the tunnel shell. */
const WALL_RING_POINTS_DESKTOP = 34;
const WALL_RING_POINTS_TABLET = 26;
const WALL_RING_POINTS_MOBILE = 18;

/** How many shell rings exist at once. They wrap, so this is a density,
 *  not a length. */
const WALL_RINGS_DESKTOP = 30;
const WALL_RINGS_TABLET = 22;
const WALL_RINGS_MOBILE = 14;

/** Axial spacing between shell rings, world units. */
const WALL_SPACING = 1.35;
/** Shell radius. Wide enough that the DOM beats (which sit near the
 *  optical axis) never appear to clip its walls. */
const SHELL_RX = 3.15;
const SHELL_RY = 2.15;
/** The shell breathes very slightly along its length so the tunnel reads
 *  as a bored passage rather than an extruded pipe. */
const SHELL_WAVE = 0.14;

/**
 * Year rings — the graduation. One per year, and the spacing is what the
 * reader feels as "a year going by".
 *
 * ⚠ THE SPACING IS DERIVED, NOT PICKED. The rings' apparent speed is
 * `spacing × years` while the walls' is the camera's own
 * `VOID_CRUISE_DISTANCE` (26 units). Choose the spacing freely and the
 * two layers slide against each other — the rings drift through the walls
 * like a separate object, which is exactly the "sticker over a video" read
 * the shared perspective was built to avoid. 26 units over the record's
 * twelve years is 2.17, so 2.2 keeps the rings welded to the shell.
 */
const YEAR_RING_POINTS = 96;
const YEAR_RING_SPACING = 2.2;
const YEAR_RING_COUNT = 7;

const wallVertex = /* glsl */ `
uniform float uPixelRatio;
uniform float uPointSize;
uniform float uCamZ;
uniform float uSpan;
uniform float uWave;
attribute float aRank;
varying float vFade;
void main() {
  vec3 p = position;
  // THE POINT'S OWN Z IS A FIXED WORLD PHASE, AND IT MUST NOT BE OFFSET
  // BY THE CAMERA BEFORE WRAPPING. Adding uCamZ first makes the wrap
  // resolve straight back to uCamZ + p.z -- every ring then holds station
  // relative to the camera, and the tunnel comes out geometrically
  // perfect and completely FROZEN: the reader flies twenty-six units and
  // the walls never move. Wrapping the fixed phase into the window that
  // trails the camera is what makes the shell stream past AND stay
  // infinite.
  float rel = mod(uCamZ - p.z, uSpan);
  float z = uCamZ - rel;
  // A gentle bore: the shell's radius eases along its length.
  float k = 1.0 + sin(z * 0.11) * uWave;
  vec4 mv = modelViewMatrix * vec4(p.x * k, p.y * k, z, 1.0);
  float dist = -mv.z;
  // Near/far fog. The near clip is what stops a wall point from
  // exploding across the frame as it passes the lens.
  float near = smoothstep(0.6, 4.0, dist);
  float far = 1.0 - smoothstep(uSpan * 0.62, uSpan * 0.96, dist);
  vFade = near * far * (0.35 + 0.65 * aRank);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPointSize * uPixelRatio * (12.0 / max(1.0, dist));
}
`;

const wallFragment = /* glsl */ `
precision mediump float;
uniform vec3 uColor;
uniform float uOpacity;
varying float vFade;
void main() {
  vec2 d = gl_PointCoord - vec2(0.5);
  float r = dot(d, d);
  if (r > 0.25) discard;
  float a = vFade * uOpacity * (1.0 - r * 3.4);
  if (a <= 0.001) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

const ringVertex = /* glsl */ `
uniform float uPixelRatio;
uniform float uPointSize;
uniform float uCamZ;
uniform float uSpacing;
uniform float uPhase;
uniform float uCount;
attribute float aRing;
varying float vFade;
void main() {
  // Each ring holds station at a fixed multiple of the spacing ahead of
  // the camera, offset by the flight's own phase — so rings stream past
  // at exactly one per year travelled.
  float slot = aRing - uPhase;
  float wrapped = mod(slot, uCount);
  float z = uCamZ - wrapped * uSpacing;
  vec4 mv = modelViewMatrix * vec4(position.x, position.y, z, 1.0);
  float dist = -mv.z;
  float near = smoothstep(0.4, 3.2, dist);
  float far = 1.0 - smoothstep(uSpacing * uCount * 0.6, uSpacing * uCount * 0.92, dist);
  vFade = near * far;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPointSize * uPixelRatio * (14.0 / max(1.0, dist));
}
`;

const ringFragment = /* glsl */ `
precision mediump float;
uniform vec3 uColor;
uniform float uOpacity;
varying float vFade;
void main() {
  vec2 d = gl_PointCoord - vec2(0.5);
  float r = dot(d, d);
  if (r > 0.25) discard;
  float a = vFade * uOpacity * (1.0 - r * 3.0);
  if (a <= 0.001) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

export function VoidwalkerTimeTunnel() {
  const groupRef = useRef<THREE.Group>(null);
  const wallAlpha = useRef(0);
  const ringAlpha = useRef(0);

  const ringPoints = useCorridorCount(
    WALL_RING_POINTS_DESKTOP,
    WALL_RING_POINTS_TABLET,
    WALL_RING_POINTS_MOBILE
  );
  const ringCount = useCorridorCount(WALL_RINGS_DESKTOP, WALL_RINGS_TABLET, WALL_RINGS_MOBILE);

  /** The shell: `ringCount` rings of `ringPoints`, laid out along −Z and
   *  wrapped in the shader. Built once per quality rung. */
  const wallGeometry = useMemo(() => {
    const n = ringPoints * ringCount;
    const pos = new Float32Array(n * 3);
    const rank = new Float32Array(n);
    let i = 0;
    for (let r = 0; r < ringCount; r++) {
      for (let k = 0; k < ringPoints; k++) {
        // A per-ring twist keeps consecutive rings from lining up into
        // longitudinal stripes, which read as a cage rather than a bore.
        const a = (k / ringPoints) * Math.PI * 2 + r * 0.19;
        pos[i * 3] = Math.cos(a) * SHELL_RX;
        pos[i * 3 + 1] = Math.sin(a) * SHELL_RY;
        pos[i * 3 + 2] = -r * WALL_SPACING;
        // Deterministic per-point brightness — no Math.random, so the
        // tunnel is byte-identical across reloads and captures.
        rank[i] = 0.35 + 0.65 * Math.abs(Math.sin(r * 12.9898 + k * 78.233));
        i++;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aRank", new THREE.BufferAttribute(rank, 1));
    return g;
  }, [ringPoints, ringCount]);

  /** The year rings — the graduation, one gold circle per year. */
  const yearGeometry = useMemo(() => {
    const n = YEAR_RING_POINTS * YEAR_RING_COUNT;
    const pos = new Float32Array(n * 3);
    const ring = new Float32Array(n);
    let i = 0;
    for (let r = 0; r < YEAR_RING_COUNT; r++) {
      for (let k = 0; k < YEAR_RING_POINTS; k++) {
        const a = (k / YEAR_RING_POINTS) * Math.PI * 2;
        // Just inside the shell, so a ring reads as a marker ON the
        // tunnel rather than a hoop floating in it.
        pos[i * 3] = Math.cos(a) * (SHELL_RX * 0.94);
        pos[i * 3 + 1] = Math.sin(a) * (SHELL_RY * 0.94);
        pos[i * 3 + 2] = 0;
        ring[i] = r;
        i++;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aRing", new THREE.BufferAttribute(ring, 1));
    return g;
  }, []);

  const wallMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: wallVertex,
        fragmentShader: wallFragment,
        uniforms: {
          uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
          uPointSize: { value: 2.1 },
          uCamZ: { value: 0 },
          uSpan: { value: WALL_SPACING * WALL_RINGS_DESKTOP },
          uWave: { value: SHELL_WAVE },
          // Dawn, the corridor's own wall ink.
          uColor: { value: new THREE.Color(0.92, 0.89, 0.84) },
          uOpacity: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const ringMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ringVertex,
        fragmentShader: ringFragment,
        uniforms: {
          uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
          uPointSize: { value: 2.6 },
          uCamZ: { value: 0 },
          uSpacing: { value: YEAR_RING_SPACING },
          uPhase: { value: 0 },
          uCount: { value: YEAR_RING_COUNT },
          // Tensor gold — the wayfinding role, and the only colour in the
          // tunnel that means something.
          uColor: { value: new THREE.Color(0.79, 0.65, 0.33) },
          uOpacity: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const t = vwTravelRef.current;

    // Not travelling: hide, zero, and cost nothing.
    if (!t.engaged) {
      if (group.visible) group.visible = false;
      wallAlpha.current = 0;
      ringAlpha.current = 0;
      wallMaterial.uniforms.uOpacity.value = 0;
      ringMaterial.uniforms.uOpacity.value = 0;
      return;
    }
    group.visible = true;

    // ⚠ Per-frame DPR sync is mandatory for any point shader here (the
    // ADR-018 mobile revision's bug 3): setting it once at mount leaves
    // every point the wrong size after a monitor change or a zoom.
    const dpr = state.viewport.dpr;
    wallMaterial.uniforms.uPixelRatio.value = dpr;
    ringMaterial.uniforms.uPixelRatio.value = dpr;

    const camZ = state.camera.position.z;
    wallMaterial.uniforms.uCamZ.value = camZ;
    ringMaterial.uniforms.uCamZ.value = camZ;
    wallMaterial.uniforms.uSpan.value = WALL_SPACING * ringCount;

    // The rings' phase IS the record's year count — the same number the
    // DOM axis puts its marker on.
    ringMaterial.uniforms.uPhase.value = t.rings;

    // The tunnel arrives on the ENTRY dive (as the camera passes through
    // the brandmark) and holds for the flight. An entrance envelope, not
    // a master-opacity crossfade: the walls are already streaming when
    // they become visible, so the reader arrives INTO motion.
    const targetWall = t.entry;
    const targetRing = Math.min(1, t.entry * 1.15);
    const k = 1 - Math.exp(-Math.min(0.1, Math.max(0, delta)) / 0.24);
    wallAlpha.current += (targetWall - wallAlpha.current) * k;
    ringAlpha.current += (targetRing - ringAlpha.current) * k;
    wallMaterial.uniforms.uOpacity.value = wallAlpha.current * 0.5;
    ringMaterial.uniforms.uOpacity.value = ringAlpha.current * 0.85;

    // Keep the shell centred on the tunnel's axis (the brandmark's own
    // X/Y), which is the axis the camera flies and the DOM field is
    // centred on. Read once per frame rather than baked, because the
    // anchor is a scene constant the corridor may re-tune.
    group.position.x = BRANDMARK_ANCHOR_INTELLIGENCE[0];
    group.position.y = BRANDMARK_ANCHOR_INTELLIGENCE[1];
    // Touch the smoothed channel so the follower's settle is observable
    // from here too (and so a future consumer cannot forget it exists).
    void getSmoothedVoidTravel();
  });

  return (
    <group ref={groupRef} visible={false}>
      <points geometry={wallGeometry} material={wallMaterial} frustumCulled={false} />
      <points geometry={yearGeometry} material={ringMaterial} frustumCulled={false} />
    </group>
  );
}
