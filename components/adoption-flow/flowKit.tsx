"use client";

/**
 * The adoption-flow lab's shared kit: ADR-080's idiom at its smallest.
 * Fat drei `Line`s for the rings that carry the drawing, `LineSegments` for
 * teeth, ticks and slices, soft points for the motes, linear fog for depth,
 * and DOM trackers that follow points on the object (holo.ui8's
 * `KEY · X Y · LOCK`, as the equilibrium letters it).
 *
 * ⚠ ADDITIVE ON DARK ONLY (holoPalette): on parchment additive light is
 * invisible, so every material reads `palette.additive`.
 * ⚠ NOTHING PULSES IN BRIGHTNESS (ADR-097 U12): the objects live by motion.
 */

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type RefObject, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  holoMoteFragmentShader,
  holoMoteVertexShader,
} from "@/components/holo-program/holoDustShader";
import type { HoloPalette } from "@/components/holo-program/holoPalette";

export type P3 = [number, number, number];
export type Axis = "x" | "y" | "z";

export const TAU = Math.PI * 2;

export const blendOf = (p: HoloPalette) =>
  p.additive ? THREE.AdditiveBlending : THREE.NormalBlending;

export function smoothstep(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export const frac = (x: number) => x - Math.floor(x);

/** A seeded unit random per index, stable across renders. */
export function rand(i: number, salt = 0): number {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/** A point on a circle of radius `r` around `c`, in the plane normal to `axis`. */
export function onCircle(c: P3, r: number, axis: Axis, a: number): P3 {
  const u = Math.cos(a) * r;
  const v = Math.sin(a) * r;
  if (axis === "x") return [c[0], c[1] + u, c[2] + v];
  if (axis === "y") return [c[0] + u, c[1], c[2] + v];
  return [c[0] + u, c[1] + v, c[2]];
}

/** A closed polygon of `n` sides (a circle when `n` is large). */
export function ringPts(c: P3, r: number, axis: Axis, n = 96, phase = 0): P3[] {
  const out: P3[] = [];
  for (let i = 0; i <= n; i++) out.push(onCircle(c, r, axis, phase + (i / n) * TAU));
  return out;
}

/** An open arc from `a0` to `a1`. */
export function arcPts(c: P3, r: number, axis: Axis, a0: number, a1: number, n = 48): P3[] {
  const out: P3[] = [];
  for (let i = 0; i <= n; i++) out.push(onCircle(c, r, axis, a0 + ((a1 - a0) * i) / n));
  return out;
}

/** A ring drawn as four corner brackets: the gate a run stops at. */
export function bracketRing(c: P3, r: number, axis: Axis, open = 0.42): P3[][] {
  return [0, 1, 2, 3].map((q) => {
    const mid = (q + 0.5) * (TAU / 4);
    return arcPts(c, r, axis, mid - (TAU / 8) * (1 - open), mid + (TAU / 8) * (1 - open), 16);
  });
}

/* ── Materials ─────────────────────────────────────────────────────── */

export function Ring({
  points,
  color,
  opacity = 1,
  width = 1,
  palette,
  dashed = false,
}: {
  points: P3[];
  color: number;
  opacity?: number;
  width?: number;
  palette: HoloPalette;
  dashed?: boolean;
}) {
  return (
    <Line
      points={points}
      color={color}
      lineWidth={width}
      transparent
      opacity={opacity}
      depthWrite={false}
      blending={blendOf(palette)}
      dashed={dashed}
      dashSize={0.08}
      gapSize={0.07}
      fog
    />
  );
}

/** Pairs of points as one `LineSegments`. `geomRef` lets a scene rewrite
 *  positions in place each frame (the mass's drifting slices). */
export function Segs({
  pairs,
  color,
  opacity = 1,
  palette,
  geomRef,
}: {
  pairs: P3[];
  color: number;
  opacity?: number;
  palette: HoloPalette;
  geomRef?: RefObject<THREE.BufferGeometry | null>;
}) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(pairs.length * 3);
    pairs.forEach((p, i) => arr.set(p, i * 3));
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [pairs]);
  useEffect(() => {
    if (geomRef) geomRef.current = geom;
    return () => geom.dispose();
  }, [geom, geomRef]);
  return (
    <lineSegments geometry={geom}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={blendOf(palette)}
        fog
      />
    </lineSegments>
  );
}

/** Static points (a stipple, a point-ring column). */
export function Dots({
  points,
  color,
  size = 2,
  opacity = 1,
  palette,
}: {
  points: P3[];
  color: number;
  size?: number;
  opacity?: number;
  palette: HoloPalette;
}) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(points.length * 3);
    points.forEach((p, i) => arr.set(p, i * 3));
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, [points]);
  useEffect(() => () => geom.dispose(), [geom]);
  return (
    <points geometry={geom}>
      <pointsMaterial
        color={color}
        size={size}
        sizeAttenuation={false}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={blendOf(palette)}
        fog
      />
    </points>
  );
}

/**
 * Motes: `count` soft points whose position and fade are written by `step`
 * each frame. `step(i, t, out, o)` writes `out[o..o+2]` and returns the fade.
 */
export function Motes({
  count,
  step,
  color,
  size = 5,
  opacity = 1,
  palette,
}: {
  count: number;
  step: (i: number, t: number, out: Float32Array, o: number) => number;
  color: number;
  size?: number;
  opacity?: number;
  palette: HoloPalette;
}) {
  const gl = useThree((s) => s.gl);
  const { geom, pos, fade } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3);
    const f = new Float32Array(count);
    const r = new Float32Array(count);
    for (let i = 0; i < count; i++) r[i] = rand(i, 9);
    g.setAttribute("position", new THREE.BufferAttribute(p, 3));
    g.setAttribute("aFade", new THREE.BufferAttribute(f, 1));
    g.setAttribute("aRand", new THREE.BufferAttribute(r, 1));
    return { geom: g, pos: p, fade: f };
  }, [count]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: holoMoteVertexShader,
        fragmentShader: holoMoteFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: blendOf(palette),
        uniforms: {
          uPointSize: { value: size },
          uPixelRatio: { value: gl.getPixelRatio() },
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity * (palette.additive ? 1 : palette.dustScale * 1.6) },
        },
      }),
    [palette, size, color, opacity, gl]
  );
  useEffect(
    () => () => {
      geom.dispose();
      material.dispose();
    },
    [geom, material]
  );
  /* three.js buffers are mutated in place each frame, so they ride a ref */
  const live = useRef({ geom, pos, fade });
  useEffect(() => {
    live.current = { geom, pos, fade };
  }, [geom, pos, fade]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const { geom: g, pos: p, fade: f } = live.current;
    for (let i = 0; i < count; i++) f[i] = step(i, t, p, i * 3);
    g.attributes.position.needsUpdate = true;
    g.attributes.aFade.needsUpdate = true;
  });
  return <points geometry={geom} material={material} frustumCulled={false} />;
}

/* ── Trackers ──────────────────────────────────────────────────────── */

export interface TrackerDef {
  key: string;
  label: string;
  /** Letter the label to the left of the bracket (a crowded side). */
  side?: "left";
}

/**
 * Projects each tracked point to the canvas and seats its DOM tracker there,
 * writing the live readout (`X0.46 Y0.32`). `points` is a scene-owned array
 * the scene may move each frame; `group` carries a tilt the points are in.
 */
export function TrackerSync({
  points,
  els,
  group,
}: {
  points: RefObject<THREE.Vector3[]>;
  els: RefObject<(HTMLElement | null)[]>;
  group?: RefObject<THREE.Object3D | null>;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useRef(new THREE.Vector3());
  useFrame(() => {
    const list = points.current;
    const nodes = els.current;
    if (!list || !nodes) return;
    list.forEach((p, i) => {
      const el = nodes[i];
      if (!el) return;
      v.current.copy(p);
      if (group?.current) v.current.applyMatrix4(group.current.matrixWorld);
      v.current.project(camera);
      const x = (v.current.x * 0.5 + 0.5) * size.width;
      const y = (-v.current.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      const ro = el.querySelector<HTMLElement>("[data-ro]");
      if (ro)
        ro.textContent = `X${(x / size.width).toFixed(2)} Y${(y / size.height).toFixed(2)} · LOCK`;
    });
  });
  return null;
}

/** A scene-owned list of tracked points, filled once from `at`. */
export function useTracked(at: P3[]): RefObject<THREE.Vector3[]> {
  const ref = useRef<THREE.Vector3[]>(at.map((p) => new THREE.Vector3(...p)));
  return ref;
}
