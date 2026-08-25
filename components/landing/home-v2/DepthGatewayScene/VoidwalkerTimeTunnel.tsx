"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { useCorridorCount } from "@/lib/hooks/useQualityTier";
import { vwTravelRef } from "@/lib/home-v2/vwTravelRef";
import { getVwFlightConfig } from "@/lib/voidwalker/voidwalkerFlightConfig";
import { buildVoidwalkerRailLayout } from "@/lib/voidwalker/voidwalkerRailLayout";
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

/**
 * LONGITUDINAL RAILS (ADR-081 U5) — the tunnel's direction cue.
 *
 * ⚠ THE DOT SHELL CANNOT SUPPLY THIS AND WAS NEVER MEANT TO. Each wall
 * ring is twisted by `r * 0.19` specifically so consecutive rings do NOT
 * line up into stripes — the right call for the dots (aligned rings read
 * as a cage), and the reason the tunnel had volume but no direction: at
 * rest it was concentric ovals, which is a target painted on a wall, not
 * a bore. The two reads are separate jobs on separate layers. Dots carry
 * VOLUME; rails carry DIRECTION.
 *
 * The grammar is `LatentWormholeWalls`' — the corridor next door already
 * proved it, and its own note is the argument: rails converging toward
 * the optical axis are "the single strongest cue that the user is flying
 * through a tunnel and not past a flat picture". The differences here are
 * that these are drawn LINES rather than dotted runs (the time tunnel is
 * a different instrument, and a continuous rail reads harder at speed),
 * and that they wrap camera-relative like everything else in this file.
 */
const RAIL_COUNT_DESKTOP = 18;
const RAIL_COUNT_TABLET = 14;
const RAIL_COUNT_MOBILE = 9;

/** How far each rail pulls toward the optical axis at the far end of the
 *  span, as a fraction of the shell radius. THIS IS THE VANISHING-POINT
 *  CUE — with it at 0 the rails are a cylinder and the bore reads flat. */
const RAIL_INWARD_PULL = 0.34;

const railVertex = /* glsl */ `
uniform float uCamZ;
uniform float uSpan;
uniform float uWave;
uniform float uVelocity;
uniform float uPull;
// ⚠ BOTH VERTICES OF A DASH WRAP ON THE SAME ANCHOR. Wrapping each
// vertex on its own z lets the modulo boundary fall BETWEEN the two
// ends of one dash per rail per cycle — that dash then stretches the
// entire length of the tunnel, once per wrap, forever. Carrying the
// dash's start as aAnchorZ and its extent as aOffsetZ moves the
// two ends as one rigid segment.
attribute float aAnchorZ;
attribute float aOffsetZ;
attribute float aRank;
varying float vFade;
void main() {
  float rel = mod(uCamZ - aAnchorZ, uSpan);
  float z = uCamZ - rel + aOffsetZ;
  // The same bore breathing the dot shell uses, so the two layers stay
  // welded instead of sliding against each other.
  float bore = 1.0 + sin(z * 0.11) * uWave;
  // Convergence toward the axis with depth. Keyed on the ANCHOR's rel
  // (not the vertex's own z) so a dash never shears across its length.
  float conv = 1.0 - uPull * smoothstep(0.0, uSpan, rel);
  vec4 mv = modelViewMatrix * vec4(position.x * bore * conv, position.y * bore * conv, z, 1.0);
  float dist = -mv.z;
  // ⚠ THE NEAR CLIP IS MUCH SHALLOWER THAN THE DOT SHELL'S, ON PURPOSE.
  // A wall point that passes the lens has to be killed early or it
  // explodes across the frame; a rail is a 1px line and does the exact
  // opposite — the dashes streaking past the frame EDGE are the
  // strongest speed cue the tunnel has, and fading them out at 3.4 units
  // threw away the whole peripheral read.
  float near = smoothstep(0.25, 1.6, dist);
  // ⚠ THE RAILS FOG OUT WELL BEFORE THE VANISHING POINT, AND THAT IS
  // WHAT MAKES THEM A BORE RATHER THAN A STARBURST. Carried out to the
  // dot shell's own far plane they all converge on one pixel dead centre
  // — which is a sunburst, and it is drawn straight through the beat
  // copy that parks there. Killing them by ~0.6 of the span leaves the
  // reading plane clear and leaves only the near/mid streaks, which is
  // both the legible answer and the physically honest one: you cannot
  // see the far wall of a tunnel, you see the near wall going past.
  float far = 1.0 - smoothstep(uSpan * 0.28, uSpan * 0.60, dist);
  float velBoost = 1.0 + clamp(uVelocity, 0.0, 2.0) * 0.45;
  vFade = near * far * (0.55 + 0.45 * aRank) * velBoost;
  gl_Position = projectionMatrix * mv;
}
`;

const railFragment = /* glsl */ `
precision mediump float;
uniform vec3 uColor;
uniform float uOpacity;
varying float vFade;
void main() {
  float a = vFade * uOpacity;
  if (a <= 0.001) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

const wallVertex = /* glsl */ `
uniform float uPixelRatio;
uniform float uPointSize;
uniform float uCamZ;
uniform float uSpan;
uniform float uWave;
uniform float uVelocity;
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
  // Velocity brightens the rank spread — fast scroll makes the wall
  // read hotter without changing the geometry. Clamped so a burst is
  // additive, not saturating: at v=0 identity; at v=1 +0.5.
  float velBoost = 1.0 + clamp(uVelocity, 0.0, 2.0) * 0.5;
  vFade = near * far * (0.35 + 0.65 * aRank) * velBoost;
  gl_Position = projectionMatrix * mv;
  // Velocity elongates the point along the axis of travel by growing
  // its size proportional to the rate — the visible speed cue.
  float velStretch = 1.0 + clamp(uVelocity, 0.0, 2.0) * 0.35;
  gl_PointSize = uPointSize * uPixelRatio * (12.0 / max(1.0, dist)) * velStretch;
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
uniform float uEntryBurst;
attribute float aRing;
varying float vFade;
varying float vBurst;
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
  // Entry burst: the nearest ring blooms during the dive. 0 in
  // production (config default), so byte-identical.
  vBurst = uEntryBurst * far * (1.0 - smoothstep(0.0, uSpacing * 2.0, dist));
  gl_Position = projectionMatrix * mv;
  gl_PointSize =
    uPointSize * uPixelRatio * (14.0 / max(1.0, dist)) * (1.0 + vBurst * 0.6);
}
`;

const ringFragment = /* glsl */ `
precision mediump float;
uniform vec3 uColor;
uniform float uOpacity;
varying float vFade;
varying float vBurst;
void main() {
  vec2 d = gl_PointCoord - vec2(0.5);
  float r = dot(d, d);
  if (r > 0.25) discard;
  // Entry burst brightens the nearest ring during the dive; capped so
  // fragment alpha stays ≤ 1.
  float a = (vFade + vBurst * 0.6) * uOpacity * (1.0 - r * 3.0);
  a = clamp(a, 0.0, 1.0);
  if (a <= 0.001) discard;
  gl_FragColor = vec4(uColor, a);
}
`;

export function VoidwalkerTimeTunnel() {
  const groupRef = useRef<THREE.Group>(null);
  const wallAlpha = useRef(0);
  const ringAlpha = useRef(0);
  const railAlpha = useRef(0);

  // ⚠ THE DENSITY MULTIPLIER IS RESOLVED AT REMOUNT-EDGE, NOT PER FRAME.
  // The wall geometry is a `useMemo` — changing the count re-allocates
  // the buffer, which is the RIGHT behaviour when the LAB dials it, but
  // must not happen every frame in production. The mount below listens
  // for `vw-flight-config` events (dispatched only by the lab route);
  // production never dispatches, so this is a no-op there.
  const [configEpoch, setConfigEpoch] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const on = () => setConfigEpoch((e) => e + 1);
    window.addEventListener("vw-flight-config", on);
    return () => window.removeEventListener("vw-flight-config", on);
  }, []);
  const mul = getVwFlightConfig().wallDensityMul;
  const basePoints = useCorridorCount(
    WALL_RING_POINTS_DESKTOP,
    WALL_RING_POINTS_TABLET,
    WALL_RING_POINTS_MOBILE
  );
  const baseRings = useCorridorCount(WALL_RINGS_DESKTOP, WALL_RINGS_TABLET, WALL_RINGS_MOBILE);
  const ringPoints = Math.max(6, Math.round(basePoints * mul));
  const ringCount = Math.max(6, Math.round(baseRings * mul));
  // Rails ride the SAME quality rung as the shell, then their own
  // density knob. At `railDensity = 0` the layer is not built at all —
  // no geometry, no material bind, no draw call.
  const baseRails = useCorridorCount(RAIL_COUNT_DESKTOP, RAIL_COUNT_TABLET, RAIL_COUNT_MOBILE);
  const railDensity = getVwFlightConfig().railDensity;
  const railCount = railDensity <= 0 ? 0 : Math.max(4, Math.round(baseRails * railDensity));
  // The epoch invalidates the wall geometry memo below so a new density
  // rebuilds the buffer instead of scaling the same point cloud.
  void configEpoch;

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

  /** The rails: `railCount` dashed lines running the span, converging in
   *  the shader. Rebuilt with the shell so the two share a wrap span. */
  const railGeometry = useMemo(() => {
    if (railCount <= 0) return null;
    const layout = buildVoidwalkerRailLayout(
      railCount,
      WALL_SPACING * ringCount,
      SHELL_RX,
      SHELL_RY
    );
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(layout.positions, 3));
    g.setAttribute("aAnchorZ", new THREE.Float32BufferAttribute(layout.anchors, 1));
    g.setAttribute("aOffsetZ", new THREE.Float32BufferAttribute(layout.offsets, 1));
    g.setAttribute("aRank", new THREE.Float32BufferAttribute(layout.ranks, 1));
    return g;
  }, [railCount, ringCount]);

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
          uVelocity: { value: 0 },
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

  const railMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: railVertex,
        fragmentShader: railFragment,
        uniforms: {
          uCamZ: { value: 0 },
          uSpan: { value: WALL_SPACING * WALL_RINGS_DESKTOP },
          uWave: { value: SHELL_WAVE },
          uVelocity: { value: 0 },
          uPull: { value: RAIL_INWARD_PULL },
          // Dawn, matched to the dot shell — the rails are the same
          // material as the wall, drawn the long way.
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
          uEntryBurst: { value: 0 },
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

  /** One-shot latch for the warm frame below. */
  const warmed = useRef(false);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const t = vwTravelRef.current;

    // Not travelling: hide, zero, and cost nothing.
    if (!t.engaged) {
      wallAlpha.current = 0;
      ringAlpha.current = 0;
      railAlpha.current = 0;
      wallMaterial.uniforms.uOpacity.value = 0;
      ringMaterial.uniforms.uOpacity.value = 0;
      railMaterial.uniforms.uOpacity.value = 0;

      // ⚠ THE WARM FRAME. three's renderer skips invisible objects
      // entirely, so a material on one is never compiled — and this
      // group is invisible for the whole page before the travel. The
      // first frame of the entry dive was therefore ALSO the frame that
      // compiled two point shaders, at the moment the camera is moving
      // fastest and any hitch is most visible.
      //
      // So when the reader comes within reach, draw once at zero alpha:
      // the renderer walks the group, compiles both programs, and the
      // reader sees nothing (uOpacity is 0 and the blend is additive).
      // One frame, one time, two viewports before it is needed.
      if (t.near && !warmed.current) {
        warmed.current = true;
        group.visible = true;
        return;
      }
      if (group.visible) group.visible = false;
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
    const span = WALL_SPACING * ringCount;
    wallMaterial.uniforms.uCamZ.value = camZ;
    ringMaterial.uniforms.uCamZ.value = camZ;
    wallMaterial.uniforms.uSpan.value = span;
    // ⚠ THE RAILS' SPAN MUST EQUAL THE SHELL'S. They wrap on the same
    // modulo; a mismatch drifts the two layers apart at a beat rate.
    railMaterial.uniforms.uCamZ.value = camZ;
    railMaterial.uniforms.uSpan.value = span;
    railMaterial.uniforms.uVelocity.value = t.velocity;
    // Feed the reader's scroll velocity into the wall shader. The hook
    // multiplies raw velocity by the lab's `velocityStrength` (0 in
    // production, so the boost is a no-op), and the shader clamps
    // internally — nothing here can escape the safe range.
    wallMaterial.uniforms.uVelocity.value = t.velocity;

    // The rings' phase IS the record's year count — the same number the
    // DOM axis puts its marker on.
    ringMaterial.uniforms.uPhase.value = t.rings;
    // Entry burst: nearest ring blooms during the dive, scaled by the
    // lab's `entryReactionStrength`. Peaks with the entry dive itself
    // (sin(π·entry)) so it grows AND fades, and returns to 0 the moment
    // the reader is past the mark. Config default is 0 → no burst.
    const burstStrength = getVwFlightConfig().entryReactionStrength;
    const burstPhase = t.entry > 0 && t.entry < 1 ? Math.sin(Math.PI * t.entry) : 0;
    ringMaterial.uniforms.uEntryBurst.value = burstStrength * burstPhase;

    // The tunnel arrives on the ENTRY dive (as the camera passes through
    // the brandmark) and holds for the flight. An entrance envelope, not
    // a master-opacity crossfade: the walls are already streaming when
    // they become visible, so the reader arrives INTO motion.
    const targetWall = t.entry;
    const targetRing = Math.min(1, t.entry * 1.15);
    const k = 1 - Math.exp(-Math.min(0.1, Math.max(0, delta)) / 0.24);
    wallAlpha.current += (targetWall - wallAlpha.current) * k;
    ringAlpha.current += (targetRing - ringAlpha.current) * k;
    // The rails come up on the SAME envelope as the walls but land a
    // touch later, so the bore's volume reads first and its direction
    // resolves under it — arriving together makes the entry read as a
    // diagram switching on.
    railAlpha.current += (Math.max(0, t.entry * 1.25 - 0.25) - railAlpha.current) * k;
    wallMaterial.uniforms.uOpacity.value = wallAlpha.current * 0.5;
    ringMaterial.uniforms.uOpacity.value = ringAlpha.current * 0.85;
    railMaterial.uniforms.uOpacity.value = railAlpha.current * 0.9;

    // Keep the shell centred on the tunnel's axis (the brandmark's own
    // X/Y), which is the axis the camera flies and the DOM field is
    // centred on. Read once per frame rather than baked, because the
    // anchor is a scene constant the corridor may re-tune.
    group.position.x = BRANDMARK_ANCHOR_INTELLIGENCE[0];
    group.position.y = BRANDMARK_ANCHOR_INTELLIGENCE[1];
  });

  return (
    <group ref={groupRef} visible={false}>
      <points geometry={wallGeometry} material={wallMaterial} frustumCulled={false} />
      {railGeometry ? (
        <lineSegments geometry={railGeometry} material={railMaterial} frustumCulled={false} />
      ) : null}
      <points geometry={yearGeometry} material={ringMaterial} frustumCulled={false} />
    </group>
  );
}
