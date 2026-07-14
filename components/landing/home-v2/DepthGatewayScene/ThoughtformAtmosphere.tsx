"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useCorridorCount } from "@/lib/hooks/useQualityTier";
import { lerp, smoothstep, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { SPHERE_GOLD } from "@/lib/home-v2/goldPalette";
import { getSmoothedThoughtformOffsetX } from "./motionFollower";
import {
  STATION_THOUGHTFORM,
  cameraSpaceDepth,
  depthFocusOpacity,
  getThoughtformBootEnvelope,
} from "./sceneGeom";

/**
 * ThoughtformAtmosphere — scoped atmosphere around the Thoughtform
 * gate, on top of the global `StaticStarfield`.
 *
 * Three layers:
 *
 *   1. Local star cluster — a denser, slightly brighter field of
 *      stars in a thin volume BEHIND the brandmark plane (world Z
 *      roughly 3..5, behind the gate at z=5.5). The parked
 *      Thoughtform composition reads with visible depth behind it
 *      instead of empty void. Opacity ramps in during the
 *      centering pan and decays via camera-space focus as the
 *      camera dollies past the gate during passthrough-01.
 *
 *   2. Boot-up glow disk — a soft warm radial gradient seated
 *      slightly BEHIND the gate plane that fades up during the
 *      centering pan and gently relaxes as the camera moves into
 *      passthrough-01. Reads as "the gateway is powering on"
 *      lighting — never solid, sits behind the rings + brandmark,
 *      gives the parked composition a small ambient bath of warm
 *      light without thickening any existing linework.
 *
 *   3. Stargate-lock shockwave — a thin gold ring at the gate Z
 *      that expands outward and dissipates at the pan-completion
 *      boundary (progress ~0.16). Reads as a subtle "the stargate
 *      has locked into view" beat, matching the moment the
 *      compass + brandmark + copy finish centring. Pairs with the
 *      sustained boot glow: shockwave is the punctuation, glow is
 *      the ambient.
 *
 * All effects are localised to the Thoughtform beat + early
 * passthrough-01. They fade out naturally as the camera passes
 * the gate; no progress-only hard cuts.
 */

// ── Local star cluster ──────────────────────────────────────────

/** Desktop star count. Tier-gated below (was a fixed 420 on every tier —
 *  Phase 4, ADR-038). Desktop is unchanged. */
const STAR_COUNT_DESKTOP = 420;
const STAR_COUNT_TABLET = 300;
const STAR_COUNT_MOBILE = 200;

/** Volume bounding box (world units). X/Y are half-widths centred
 *  on the optical axis after the Thoughtform pan completes; Z
 *  range sits BEHIND the brandmark (gate at z=5.5) so the stars
 *  read as parallax depth backdrop to the compass. */
const STAR_HALF_X = 5.6;
const STAR_HALF_Y = 2.8;
const STAR_Z_MIN = 1.6;
const STAR_Z_MAX = 5.2;

/** Focus window applied to a representative point inside the
 *  cluster volume so the whole field fades together as the camera
 *  approaches and passes through the cluster. */
const STAR_DEPTH_WINDOW = {
  near: 0.6,
  nearFade: 1.6,
  far: 7.5,
  farFade: 2.4,
} as const;

const STAR_COLOR = new THREE.Color(0.96, 0.92, 0.86);

const starVertexShader = /* glsl */ `
uniform float uPointSize;
uniform float uPixelRatio;
uniform float uTime;
attribute float aSeed;
varying float vSeed;
varying float vTwinkle;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  // Per-star size variation via seed so the cluster has visual
  // hierarchy. Distance falloff is deliberately gentle — the
  // cluster sits 4-8 world units from the camera, and at these
  // depths a strict perspective shrink would render every star
  // sub-pixel and invisible. We want stars that READ as stars,
  // not as a perspective study.
  float sizeJitter = 0.7 + fract(aSeed * 7.0) * 1.1;
  float distFactor = clamp(7.0 / max(0.4, -mv.z), 0.7, 1.6);
  gl_PointSize = uPointSize * uPixelRatio * sizeJitter * distFactor;
  // Slow twinkle, phase-shifted per star via the seed
  vTwinkle = 0.78 + 0.22 * sin(uTime * 0.55 + aSeed * 19.0);
  vSeed = aSeed;
}
`;

const starFragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vSeed;
varying float vTwinkle;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  // Tight bright core + soft falloff so the dots read as stars,
  // not blurry dust. The inner smoothstep gives a tiny brilliant
  // centre; the outer falloff is gentler so the field reads soft.
  float core = smoothstep(0.16, 0.0, d);
  float halo = smoothstep(0.5, 0.18, d);
  float soft = max(core, halo * 0.55);
  float jitter = 0.7 + fract(vSeed * 41.0) * 0.3;
  float alpha = soft * jitter * vTwinkle * uOpacity;
  if (alpha < 0.012) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

/** Progress-driven ramp that fades the local stars in during the
 *  Thoughtform centering pan (the moment the composition shifts
 *  into the middle) and holds at full thereafter, while the
 *  camera-space focus window owns the eventual fade-out as the
 *  camera passes the gate. */
function thoughtformStarsProgressRamp(progress: number): number {
  if (progress <= 0.04) return 0;
  if (progress >= 0.14) return 1;
  return smoothstep(0.04, 0.14, progress);
}

// ── Stargate-lock shockwave ─────────────────────────────────────

const SHOCKWAVE_SEGMENTS = 96;
const SHOCKWAVE_START = 0.13;
const SHOCKWAVE_PEAK = 0.18;
const SHOCKWAVE_END = 0.28;
const SHOCKWAVE_RADIUS_START = 0.4;
const SHOCKWAVE_RADIUS_END = 4.6;
const SHOCKWAVE_MAX_OPACITY = 0.4;

const SHOCKWAVE_COLOR = new THREE.Color(SPHERE_GOLD);

/** Returns the shockwave's instantaneous scale (world units) and
 *  opacity for the given progress. Outside the [START, END]
 *  window the shockwave is invisible. Opacity rises sharply to
 *  the peak (just after the pan completes) then dissipates as
 *  the ring expands toward its outer radius. */
function shockwaveState(progress: number): { scale: number; opacity: number } {
  if (progress <= SHOCKWAVE_START || progress >= SHOCKWAVE_END) {
    return { scale: SHOCKWAVE_RADIUS_START, opacity: 0 };
  }
  const t = (progress - SHOCKWAVE_START) / (SHOCKWAVE_END - SHOCKWAVE_START);
  const peakT = (SHOCKWAVE_PEAK - SHOCKWAVE_START) / (SHOCKWAVE_END - SHOCKWAVE_START);
  // Quadratic ease-out for radius: starts slow, accelerates.
  const radiusT = t * t * (3 - 2 * t);
  const scale = lerp(SHOCKWAVE_RADIUS_START, SHOCKWAVE_RADIUS_END, radiusT);
  // Opacity: rise to peak, then fall to 0.
  let envelope: number;
  if (t < peakT) {
    envelope = t / peakT; // 0 → 1
  } else {
    envelope = 1 - (t - peakT) / (1 - peakT); // 1 → 0
  }
  const opacity = Math.max(0, envelope) * SHOCKWAVE_MAX_OPACITY;
  return { scale, opacity };
}

// ── Boot-up glow disk ───────────────────────────────────────────

/** Half-extent of the glow plane (world units). Set wide enough
 *  that the warm bath extends beyond the outer compass ring
 *  (r ≈ 0.75) without feeling like a hard disk edge — the radial
 *  falloff handles the visual softness. */
const BOOT_GLOW_HALF = 3.6;

/** Peak alpha of the glow at full boot. Set to 0 (2026-06-19, design
 *  request) to disable the warm gateway boot-up bloom — the local star
 *  cluster + stargate shockwave are kept. Restore to 0.18 to bring the
 *  warm radial bloom back. */
const BOOT_GLOW_PEAK_OPACITY = 0;

/** Z offset behind the gate plane so the glow composites BEHIND
 *  the compass rings + brandmark — the rings read against it, the
 *  brandmark sits on top of it. */
const BOOT_GLOW_Z_BEHIND_GATE = -0.45;

const BOOT_GLOW_INNER_COLOR = new THREE.Color("#caa554");
const BOOT_GLOW_OUTER_COLOR = new THREE.Color(0.42, 0.3, 0.16);

/** Boot-glow ramp-OUT window (paintProgress). The warm gateway glow
 *  used to be gated off by the camera-space depth focus
 *  (`depthFocusOpacity`), which snaps to 0 the instant the camera
 *  crosses the gate plane (~0.355) — exactly when "Navigate the
 *  intelligence" arrives, so the glow visibly POPPED out. Instead we
 *  cross-fade it across this window with a smoothstep so it hands off
 *  to Navigate's own gold radial + the wormhole exit-glow plateau. The
 *  boot envelope still owns the ramp-IN; this only governs the
 *  ramp-OUT. */
const BOOT_GLOW_HANDOFF_START = 0.3;
const BOOT_GLOW_HANDOFF_END = 0.45;

const bootGlowVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const bootGlowFragmentShader = /* glsl */ `
uniform vec3 uInnerColor;
uniform vec3 uOuterColor;
uniform float uOpacity;
uniform float uBreath;
varying vec2 vUv;
void main() {
  // Radial distance from disk centre (0 at centre, 1 at edge).
  vec2 centred = vUv - 0.5;
  float d = length(centred) * 2.0;
  if (d >= 1.0) discard;
  // Two-stage falloff: bright warm core, soft cool halo. Reads as
  // a luminous source (the gateway itself) bathing the surrounding
  // void in light, rather than a flat tinted disk.
  float core = smoothstep(0.55, 0.0, d);
  float halo = smoothstep(1.0, 0.18, d);
  vec3 color = mix(uOuterColor, uInnerColor, core);
  float alpha = mix(halo * 0.45, 1.0, core) * uOpacity * uBreath;
  if (alpha < 0.005) discard;
  gl_FragColor = vec4(color, alpha);
}
`;

// ── Component ────────────────────────────────────────────────────

export function ThoughtformAtmosphere() {
  const starsRef = useRef<THREE.Points>(null);
  const bootGlowRef = useRef<THREE.Mesh>(null);
  const shockwaveRef = useRef<THREE.LineLoop>(null);

  const starCount = useCorridorCount(STAR_COUNT_DESKTOP, STAR_COUNT_TABLET, STAR_COUNT_MOBILE);

  // Star geometry — randomly distributed inside the cluster volume.
  const starGeometry = useMemo(() => {
    const positions = new Float32Array(starCount * 3);
    const seeds = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2 * STAR_HALF_X;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2 * STAR_HALF_Y;
      positions[i * 3 + 2] = STAR_Z_MIN + Math.random() * (STAR_Z_MAX - STAR_Z_MIN);
      seeds[i] = Math.random();
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geom;
  }, [starCount]);

  const starMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      uniforms: {
        uPointSize: { value: 6 },
        uPixelRatio: { value: typeof window !== "undefined" ? window.devicePixelRatio : 1 },
        uColor: { value: STAR_COLOR.clone() },
        uOpacity: { value: 0 },
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  // Shockwave geometry — unit circle, scaled per frame.
  const shockwaveGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= SHOCKWAVE_SEGMENTS; i++) {
      const a = (i / SHOCKWAVE_SEGMENTS) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  const shockwaveMaterial = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: SHOCKWAVE_COLOR.clone(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    });
  }, []);

  // Boot-up glow disk — a single quad with a radial-gradient shader.
  // Sized larger than the compass so the warm bath extends beyond
  // the outer ring; the radial falloff in the shader handles the
  // soft edge so the disk never reads as a hard shape.
  const bootGlowGeometry = useMemo(
    () => new THREE.PlaneGeometry(BOOT_GLOW_HALF * 2, BOOT_GLOW_HALF * 2, 1, 1),
    []
  );

  const bootGlowMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: bootGlowVertexShader,
      fragmentShader: bootGlowFragmentShader,
      uniforms: {
        uInnerColor: { value: BOOT_GLOW_INNER_COLOR.clone() },
        uOuterColor: { value: BOOT_GLOW_OUTER_COLOR.clone() },
        uOpacity: { value: 0 },
        uBreath: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);

  useEffect(() => {
    return () => {
      starGeometry.dispose();
      starMaterial.dispose();
      shockwaveGeometry.dispose();
      shockwaveMaterial.dispose();
      bootGlowGeometry.dispose();
      bootGlowMaterial.dispose();
    };
  }, [
    starGeometry,
    starMaterial,
    shockwaveGeometry,
    shockwaveMaterial,
    bootGlowGeometry,
    bootGlowMaterial,
  ]);

  useFrame((state) => {
    const stars = starsRef.current;
    const shockwave = shockwaveRef.current;
    const bootGlow = bootGlowRef.current;
    if (!stars || !shockwave || !bootGlow) return;

    const { paintProgress, active, armed } = useDepthGatewayStore.getState().transform;
    const painting = active || armed;
    if (!painting) {
      stars.visible = false;
      shockwave.visible = false;
      bootGlow.visible = false;
      return;
    }

    starMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    starMaterial.uniforms.uPixelRatio.value = state.viewport.dpr;

    // Local star cluster — combine the centering-pan ramp with a
    // camera-space focus opacity sampled at the cluster's centre.
    // The cluster sits in a 7-unit wide / 3.6 tall slab behind
    // the brandmark, so its visibility is governed by the camera's
    // depth relative to that slab. Outside the focus window it
    // gracefully fades.
    //
    // W4 (plan 03adb0dd): the cluster X now follows the same
    // centering pan as the shockwave + boot glow + compass + copy
    // (`getThoughtformCenterOffsetX(paintProgress)`), so the local
    // stars stay anchored under the off-axis brandmark (lateralX
    // ~1.1) instead of sitting on the camera axis. Without this,
    // the 420-star slab drifted to the optical centre while every
    // other Thoughtform element sat to its right — reading as a
    // floating cluster beside the mark during the opening beat.
    const clusterCentreZ = (STAR_Z_MIN + STAR_Z_MAX) * 0.5;
    // 2026-06-09 elegance pass: smoothed follower value so the cluster
    // pans with the same temporally-eased offset as the compass + copy.
    const panX = getSmoothedThoughtformOffsetX();
    stars.position.x = STATION_THOUGHTFORM.position[0] + panX;
    const depth = cameraSpaceDepth(paintProgress, [
      STATION_THOUGHTFORM.position[0] + panX,
      0,
      clusterCentreZ,
    ]);
    const depthAlpha = depthFocusOpacity(depth, STAR_DEPTH_WINDOW);
    const ramp = thoughtformStarsProgressRamp(paintProgress);
    const starsOpacity = depthAlpha * ramp;
    if (starsOpacity < 0.005) {
      stars.visible = false;
    } else {
      stars.visible = true;
      starMaterial.uniforms.uOpacity.value = starsOpacity;
    }

    // Shockwave — expanding ring at the gate Z. Uses the same
    // camera-space depth gate so it can never show through after
    // the camera has passed the gate plane.
    const sw = shockwaveState(paintProgress);
    const shockwaveX = STATION_THOUGHTFORM.position[0] + getSmoothedThoughtformOffsetX();
    shockwave.position.x = shockwaveX;
    if (sw.opacity < 0.005 || depth < 0.4) {
      shockwave.visible = false;
    } else {
      shockwave.visible = true;
      const scale = sw.scale;
      shockwave.scale.set(scale, scale, 1);
      shockwaveMaterial.opacity = sw.opacity;
    }

    // Boot-up glow disk — ambient warm lighting that ramps up as
    // the Thoughtform composition centres, holds briefly, then
    // relaxes as the camera moves into passthrough-01. The disk
    // tracks the centering pan (same X offset as the compass +
    // brandmark + copy) so the light source stays under the
    // gateway, not anchored off-axis. A gentle breath modulates
    // alpha by ±4 % over ~7 s so the lighting feels alive without
    // distracting.
    //
    // Ramp-out is a SMOOTH paintProgress cross-fade (not the
    // camera-space depth cull, which snapped to 0 the instant the
    // camera crossed the gate plane and made the glow pop out exactly
    // as Navigate arrived). `boot` owns the ramp-in; the handoff fade
    // eases the glow off across [0.30, 0.45] so it hands over to the
    // Navigate header glow + wormhole exit plateau.
    const boot = getThoughtformBootEnvelope(paintProgress);
    const glowHandoff =
      1 - smoothstep(BOOT_GLOW_HANDOFF_START, BOOT_GLOW_HANDOFF_END, paintProgress);
    const glowAlpha = boot * glowHandoff * BOOT_GLOW_PEAK_OPACITY;
    if (glowAlpha < 0.003) {
      bootGlow.visible = false;
    } else {
      bootGlow.visible = true;
      bootGlow.position.x = shockwaveX;
      bootGlow.position.z = STATION_THOUGHTFORM.position[2] + BOOT_GLOW_Z_BEHIND_GATE;
      const breath = 1 + Math.sin(state.clock.elapsedTime * 0.9) * 0.04;
      bootGlowMaterial.uniforms.uBreath.value = breath;
      bootGlowMaterial.uniforms.uOpacity.value = glowAlpha;
    }
  });

  return (
    <group>
      {/* Boot-up glow disk — paints BEFORE the local star cluster
          so the warm bath sits behind the stars too. The mesh's
          additive blending means the stars in front of it pick up
          a slight warm tint at peak boot, reinforcing the lit-up
          atmosphere read. */}
      <mesh
        ref={bootGlowRef}
        geometry={bootGlowGeometry}
        material={bootGlowMaterial}
        visible={false}
      />
      <points
        ref={starsRef}
        geometry={starGeometry}
        material={starMaterial}
        frustumCulled={false}
      />
      <lineLoop
        ref={shockwaveRef}
        geometry={shockwaveGeometry}
        material={shockwaveMaterial}
        position={[STATION_THOUGHTFORM.position[0], 0, STATION_THOUGHTFORM.position[2] + 0.05]}
        visible={false}
      />
    </group>
  );
}
