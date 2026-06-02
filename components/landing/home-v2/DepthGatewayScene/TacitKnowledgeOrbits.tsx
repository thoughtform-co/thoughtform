"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { smoothstep, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  cameraSpaceDepth,
  depthFocusOpacity,
  STATION_DIAGNOSTIC,
  type DepthFocusWindow,
} from "./sceneGeom";

/**
 * TacitKnowledgeOrbits — the Navigate→Encode "capture" beat (Refinement
 * 3, ADR-018 world-owned corridor).
 *
 * Tacit-knowledge WORDS (judgment, taste, instinct, …) drift in along
 * the Navigate→Encode leg as free-flying fragments, then get CAPTURED
 * into stable tilted orbits around the Encode station as the camera
 * approaches it — the literal visual of "turn what makes the work good
 * into substrate the intelligence inherits". They are not labelled
 * decoration; they are the judgment being encoded.
 *
 * Mechanics (all world-fixed; the perceived motion is the camera flying
 * past rigid points, plus the slow orbital drift):
 *
 *   - Each fragment has a fixed FREE-FLIGHT inbound position (out along
 *     the leg, toward the camera/+Z, spread in XY) and an ORBIT position
 *     on one of three tilted ellipses centred on the Encode station.
 *   - A per-fragment CAPTURE FACTOR `c ∈ [0,1]` rises from the camera's
 *     forward depth to the station: far away → free-flight (c≈0), parked
 *     in front of the gate → fully orbiting (c≈1). A per-fragment depth
 *     stagger makes them snap in sequentially rather than all at once.
 *   - The drawn position is `lerp(inbound, orbit, c)` PLUS a tangential
 *     SWIRL term that decays as `c→1`, so fragments arc into orbit
 *     instead of sliding straight in.
 *   - The whole group fades in on approach and fades out once the camera
 *     passes the station (depth-focus window on the station centre), so
 *     it never clutters the Build run downstream.
 *
 * Rendering: each word is its own billboard `THREE.Sprite` with a
 * tightly-sized canvas texture (no atlas squish — words are wider than
 * the square token tiles in `LatentFieldTunnel`). Additive blending over
 * the dark corridor reads as glowing, legible text. ~14 sprites — a
 * trivial budget.
 *
 * Mobile-narrow viewports skip the layer (matching the wall / contour
 * gates) so tight viewports keep the Encode composition uncluttered.
 */

// ── Words ────────────────────────────────────────────────────────────

const WORDS = [
  "judgment",
  "taste",
  "instinct",
  "nuance",
  "voice",
  "context",
  "intuition",
  "craft",
  "restraint",
  "timing",
  "tone",
  "discretion",
  "rigor",
  "care",
] as const;

const DAWN_HEX = "#ebe3d6";
const GOLD_HEX = "#caa554";

// ── Orbit catalogue ──────────────────────────────────────────────────

interface OrbitConfig {
  rx: number;
  ry: number;
  /** In-plane rotation of the ellipse (deg). */
  rotateDeg: number;
  /** 3D tilt of the orbital plane (rad). */
  tiltX: number;
  tiltY: number;
  /** Seconds per revolution + direction. */
  periodSec: number;
  dir: 1 | -1;
}

const ORBITS: OrbitConfig[] = [
  { rx: 0.78, ry: 0.52, rotateDeg: 18, tiltX: 0.5, tiltY: 0.2, periodSec: 15, dir: 1 },
  { rx: 1.06, ry: 0.74, rotateDeg: -42, tiltX: -0.35, tiltY: 0.55, periodSec: 21, dir: -1 },
  { rx: 1.4, ry: 1.0, rotateDeg: 72, tiltX: 0.7, tiltY: -0.3, periodSec: 27, dir: 1 },
];

// ── Capture + fade tuning (primary preview knobs) ────────────────────

/** Forward-depth (to the Encode station) where capture BEGINS (c=0) and
 *  COMPLETES (c=1). The station parks at GATE_PARK_DISTANCE (4.5), so
 *  fragments finish settling just as the camera arrives. */
const CAPTURE_FAR = 11;
const CAPTURE_NEAR = 4.5;
/** Per-fragment depth stagger spread, so words capture sequentially. */
const CAPTURE_STAGGER = 2.6;

/** Tangential swirl (world units) at c=0, decaying to 0 at c=1 — the arc
 *  that makes capture read as a spiral, not a slide. */
const SWIRL_AMP = 1.15;

/** Group fade window on the station centre: words emerge from depth on
 *  approach and dissolve once the camera crosses past the Encode read. */
const FADE_WINDOW: DepthFocusWindow = { near: 2, nearFade: 2.4, far: 12, farFade: 4 };

const SPRITE_HEIGHT = 0.42;
const BASE_ALPHA = 0.82;

// ── Helpers ──────────────────────────────────────────────────────────

/** Planar ellipse point (matches `DiagnosticOrbitGate.pointOnEllipse`). */
function ellipseLocal(cfg: OrbitConfig, parametricDeg: number): [number, number] {
  const psi = (parametricDeg * Math.PI) / 180;
  const alpha = (cfg.rotateDeg * Math.PI) / 180;
  const lx = cfg.rx * Math.cos(psi);
  const ly = cfg.ry * Math.sin(psi);
  return [lx * Math.cos(alpha) - ly * Math.sin(alpha), lx * Math.sin(alpha) + ly * Math.cos(alpha)];
}

/** Deterministic [0,1) hash so inbound spread looks scattered but is
 *  stable across reloads. */
function hash01(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Build a tightly-sized white-on-transparent word texture + its aspect
 *  so the billboard sprite scales without stretching. */
function makeWordTexture(word: string): { texture: THREE.CanvasTexture; aspect: number } {
  const fontPx = 64;
  const padX = 28;
  const padY = 18;
  const font = `600 ${fontPx}px "PT Mono", ui-monospace, monospace`;

  const canvas = document.createElement("canvas");
  const measureCtx = canvas.getContext("2d");
  let textW = word.length * fontPx * 0.6;
  if (measureCtx) {
    measureCtx.font = font;
    textW = measureCtx.measureText(word).width;
  }
  const w = Math.ceil(textW) + padX * 2;
  const h = fontPx + padY * 2;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, w, h);
    ctx.font = font; // re-set: resizing the canvas reset the context
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(word, w / 2, h / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return { texture, aspect: w / h };
}

interface Fragment {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  orbit: OrbitConfig;
  /** Orbital-plane tilt as a quaternion (built once). */
  quat: THREE.Quaternion;
  inbound: THREE.Vector3;
  phaseDeg: number;
  /** Depth at which this fragment's capture window is centred. */
  staggerOffset: number;
}

// ── Component ────────────────────────────────────────────────────────

export function TacitKnowledgeOrbits() {
  const groupRef = useRef<THREE.Group>(null);

  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 760;
  }, []);

  const { group, fragments } = useMemo(() => {
    const grp = new THREE.Group();
    if (!enabled) return { group: grp, fragments: [] as Fragment[] };

    const centre = STATION_DIAGNOSTIC.position;
    const frags: Fragment[] = [];

    for (let i = 0; i < WORDS.length; i++) {
      const orbit = ORBITS[i % ORBITS.length];
      const { texture, aspect } = makeWordTexture(WORDS[i]);
      const tint = i % 3 === 0 ? GOLD_HEX : DAWN_HEX;

      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: new THREE.Color(tint),
        opacity: 0,
      });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(SPRITE_HEIGHT * aspect, SPRITE_HEIGHT, 1);

      const quat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(orbit.tiltX, orbit.tiltY, 0)
      );

      // Free-flight inbound: out along the leg toward the camera (+Z),
      // scattered in XY so they read as drifting fragments, not a ring.
      const h1 = hash01(i + 1);
      const h2 = hash01(i * 3.3 + 7);
      const h3 = hash01(i * 1.7 + 2);
      const angle = h1 * Math.PI * 2;
      const radius = 1.5 + h2 * 1.7;
      const inbound = new THREE.Vector3(
        centre[0] + Math.cos(angle) * radius,
        centre[1] + Math.sin(angle) * radius * 0.7,
        centre[2] + 5.5 + h3 * 4.0
      );

      const phaseDeg = (i / WORDS.length) * 360 + (i % ORBITS.length) * 47;
      const staggerOffset = (i / (WORDS.length - 1) - 0.5) * CAPTURE_STAGGER;

      grp.add(sprite);
      frags.push({ sprite, material, orbit, quat, inbound, phaseDeg, staggerOffset });
    }

    return { group: grp, fragments: frags };
  }, [enabled]);

  useEffect(() => {
    return () => {
      for (const f of fragments) {
        f.material.map?.dispose();
        f.material.dispose();
      }
    };
  }, [fragments]);

  // Scratch vectors reused per frame.
  const orbitVec = useRef(new THREE.Vector3()).current;
  const tangentVec = useRef(new THREE.Vector3()).current;
  const posVec = useRef(new THREE.Vector3()).current;

  useFrame(({ clock }) => {
    if (fragments.length === 0) return;
    const grp = groupRef.current;
    if (!grp) return;

    const { progress, active } = useDepthGatewayStore.getState().transform;
    if (!active) {
      grp.visible = false;
      return;
    }

    const centre = STATION_DIAGNOSTIC.position;
    const depth = cameraSpaceDepth(progress, centre);
    const groupOpacity = depthFocusOpacity(depth, FADE_WINDOW);
    if (groupOpacity <= 0.001) {
      grp.visible = false;
      return;
    }
    grp.visible = true;

    const t = clock.elapsedTime;

    for (const f of fragments) {
      // Capture factor: 0 far out, 1 parked at the gate. smoothstep with
      // edge0 > edge1 inverts cleanly so c rises as depth decreases.
      const c = smoothstep(
        CAPTURE_FAR + f.staggerOffset,
        CAPTURE_NEAR + f.staggerOffset,
        depth
      );

      const parametricDeg = f.phaseDeg + f.orbit.dir * (t / f.orbit.periodSec) * 360;
      const [ex, ey] = ellipseLocal(f.orbit, parametricDeg);
      orbitVec.set(ex, ey, 0).applyQuaternion(f.quat);
      orbitVec.set(orbitVec.x + centre[0], orbitVec.y + centre[1], orbitVec.z + centre[2]);

      // Orbit tangent (for the decaying swirl) from a small lookahead.
      const [ax, ay] = ellipseLocal(f.orbit, parametricDeg + 6 * f.orbit.dir);
      tangentVec.set(ax - ex, ay - ey, 0).applyQuaternion(f.quat);
      if (tangentVec.lengthSq() > 1e-6) tangentVec.normalize();

      // pos = lerp(inbound, orbit, c) + tangent * swirl(1-c)
      posVec.copy(f.inbound).lerp(orbitVec, c);
      const swirl = (1 - c) * SWIRL_AMP;
      posVec.addScaledVector(tangentVec, swirl);
      f.sprite.position.copy(posVec);

      // Brighter once captured so the orbit reads as the settled state.
      f.material.opacity = groupOpacity * BASE_ALPHA * (0.45 + 0.55 * c);
    }
  });

  if (fragments.length === 0) return null;

  return <primitive ref={groupRef} object={group} />;
}
