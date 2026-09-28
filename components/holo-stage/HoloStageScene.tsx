"use client";

/**
 * HoloStageScene — paints ONE `HoloStageSpec`, whatever it draws.
 *
 * ⚠ ONE SCENE, FOUR DRAWINGS. ADR-080's scene is a component per object, and
 * its own record says what that cost: the lab and the page drifted into two
 * compositions with every guard green, twice. Here the drawing is DATA and
 * this file is the only thing that knows how to paint it, so a fifth beat is a
 * builder rather than a second renderer.
 *
 * ⚠ IT IS ALIVE AT REST, by the same owner ruling ADR-080 U1 records against
 * ADR-021's static-instrument law: breathe, flicker and twinkle on a wall
 * clock, scoped to this object, only while it is on screen and the document is
 * visible. It never captures the wheel and never moves the page.
 *
 * ⚠ EVERY COLOUR COMES OFF THE PALETTE, never a module constant — ADR-058's
 * whole finding about the corridor's painters, and the reason `holoPalette`
 * is two genuinely different drawings rather than a token swap.
 */

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ComponentRef, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import {
  holoDustFragmentShader,
  holoDustVertexShader,
} from "@/components/holo-program/holoDustShader";
import {
  FLICKER,
  HOLO_SEED,
  INTRO_MS,
  TWINKLE,
  mulberry32,
} from "@/components/holo-program/holoProgramGeom";
import type { HoloPalette } from "@/components/holo-program/holoPalette";
import { clamp01 } from "@/lib/math";

import type { AnchorChannel, HoloAnchor } from "./stageAnchors";
import type { HoloStageSpec, StageLine, StageRole } from "./stageGeom";

function smootherstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** How far a dashed run's gaps run, in world units. ⚠ SEGMENTS, never
 *  `LineDashedMaterial`: it renders nothing without computed line distances
 *  and cannot be revealed by a draw range. */
const DASH_ON = 0.11;
const DASH_OFF = 0.09;

function dashSegments(points: readonly (readonly [number, number, number])[]): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  for (let i = 1; i < points.length; i++) {
    const a = new THREE.Vector3(...points[i - 1]);
    const b = new THREE.Vector3(...points[i]);
    const len = a.distanceTo(b);
    const step = DASH_ON + DASH_OFF;
    const n = Math.max(1, Math.floor(len / step));
    for (let k = 0; k < n; k++) {
      const t0 = (k * step) / len;
      const t1 = Math.min(1, (k * step + DASH_ON) / len);
      out.push(a.clone().lerp(b, t0), a.clone().lerp(b, t1));
    }
  }
  return out;
}

export interface HoloStageSceneProps {
  spec: HoloStageSpec;
  palette: HoloPalette;
  channel: AnchorChannel;
  armed: boolean;
  still?: boolean;
  onReady?: () => void;
}

export function HoloStageScene({
  spec,
  palette,
  channel,
  armed,
  still = false,
  onReady,
}: HoloStageSceneProps) {
  const { invalidate, camera, viewport } = useThree();
  const rigRef = useRef<THREE.Group>(null);

  const C = useMemo(
    () => ({
      structure: new THREE.Color(palette.structure),
      machine: new THREE.Color(palette.machine),
      gold: new THREE.Color(palette.gold),
      accent: new THREE.Color(palette.accent),
      green: new THREE.Color(palette.green),
      grid: new THREE.Color(palette.grid),
    }),
    [palette]
  );
  const blend = palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
  const colourOf = (role: StageRole) =>
    role === "gold"
      ? C.gold
      : role === "green"
        ? C.green
        : role === "grid"
          ? C.grid
          : role === "machine"
            ? C.machine
            : C.structure;

  /* ── Geometry, built once per spec ──────────────────────────────────── */

  /** Solid runs ride drei's fat `Line` (a real width at any distance). */
  const solids = useMemo(
    () =>
      spec.lines
        .filter((l) => !l.dashed)
        .map((l) => ({ line: l, points: l.points.map((p) => new THREE.Vector3(...p)) })),
    [spec]
  );

  /** Dashed runs are ONE buffer per spec: a hundred hairlines would otherwise
   *  be a hundred draw calls, and the reveal is a draw range on the lot. */
  const dashed = useMemo(() => {
    const groups = new Map<StageRole, { pos: number[]; ranges: [StageLine, number, number][] }>();
    for (const l of spec.lines) {
      if (!l.dashed) continue;
      const g = groups.get(l.role) ?? { pos: [], ranges: [] };
      const start = g.pos.length / 3;
      for (const v of dashSegments(l.points)) g.pos.push(v.x, v.y, v.z);
      g.ranges.push([l, start, g.pos.length / 3 - start]);
      groups.set(l.role, g);
    }
    return [...groups.entries()].map(([role, g]) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(g.pos, 3));
      return { role, geometry, ranges: g.ranges };
    });
  }, [spec]);

  /** How far a face is mixed off the ground toward its role's colour: the
   *  fallback's own ladder (arcs.css `--arc-iso-*`), top lightest. */
  const faceColour = useMemo(() => {
    const ground = new THREE.Color(palette.ground);
    const MIX = { top: 0.12, left: 0.07, right: 0.04 } as const;
    const GOLD = { top: 0.28, left: 0.2, right: 0.14 } as const;
    return (role: StageRole, shade: "top" | "left" | "right" = "top") =>
      ground
        .clone()
        .lerp(role === "gold" ? C.gold : C.structure, role === "gold" ? GOLD[shade] : MIX[shade]);
  }, [palette.ground, C]);

  const faceGeom = useMemo(
    () =>
      spec.faces.map((f) => {
        const g = new THREE.BufferGeometry();
        const [p0, p1, p2, p3] = f.quad;
        g.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(
            [...p0, ...p1, ...p2, ...p0, ...p2, ...p3].map(Number),
            3
          )
        );
        return { face: f, geometry: g };
      }),
    [spec]
  );

  const dustGeom = useMemo(
    () =>
      spec.dust.map((d) => {
        const g = new THREE.BufferGeometry();
        const pos = new Float32Array(d.points.length * 3);
        const rand = new Float32Array(d.points.length);
        const rnd = mulberry32(HOLO_SEED + 17);
        d.points.forEach((p, i) => {
          pos[i * 3] = p[0];
          pos[i * 3 + 1] = p[1];
          pos[i * 3 + 2] = p[2];
          rand[i] = rnd();
        });
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        g.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
        return { dust: d, geometry: g };
      }),
    [spec]
  );

  /** ⚠ A `ShaderMaterial`, never `PointsMaterial` — three's points chain has
   *  no radial mask, so a mote renders as a hard opaque square (the owner's
   *  "particles too thick", recorded one folder over). */
  const dustMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: holoDustVertexShader,
        fragmentShader: holoDustFragmentShader,
        uniforms: {
          /* ⚠ THE SHADER SOFTENS PERSPECTIVE BY CAMERA DISTANCE (9 / dist,
             clamped to 0.4) and this camera stands 30 units off in a parallel
             view, so every mote lands on the 0.4 floor. The size is scaled
             back by the same factor: ~2.8px, the trajectory's own grain. */
          uPointSize: { value: 7 },
          uPixelRatio: { value: 1 },
          uColor: { value: new THREE.Color(palette.machine) },
          uOpacity: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: blend,
      }),
    [blend, palette.machine]
  );

  useEffect(
    () => () => {
      for (const d of dashed) d.geometry.dispose();
      for (const f of faceGeom) f.geometry.dispose();
      for (const d of dustGeom) d.geometry.dispose();
      dustMat.dispose();
    },
    [dashed, faceGeom, dustGeom, dustMat]
  );

  /* ── Refs the frame writes through ──────────────────────────────────── */
  const solidRefs = useRef<(ComponentRef<typeof Line> | null)[]>([]);
  const dashRefs = useRef<(THREE.LineSegments | null)[]>([]);
  const faceRefs = useRef<(THREE.Mesh | null)[]>([]);
  const dustRefs = useRef<(THREE.Points<THREE.BufferGeometry> | null)[]>([]);

  const progress = useRef(0);
  const ready = useRef(false);
  const clock = useRef(0);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const fromScratch = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    progress.current = still ? 1 : 0;
    invalidate();
  }, [spec, still, armed, invalidate]);

  useEffect(() => () => channel.clear(), [channel]);

  /** Per-line flicker phases, seeded — no two runs drop out together. */
  const flickerSeeds = useMemo(() => {
    const rnd = mulberry32(HOLO_SEED + 31);
    return spec.lines.map(() => rnd() * 100);
  }, [spec]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    const t = clock.current;

    if (still) progress.current = 1;
    else if (armed && progress.current < 1) {
      progress.current = Math.min(1, progress.current + (dt * 1000) / INTRO_MS);
    }
    const p = progress.current;

    /* ⚠ NO BREATHING ON A FRAMING STAGE (ADR-130 U4). The words are the SVG
       fallback's own DOM spans, seated by fraction over a drawing that must
       not move under them; the object lives by its flicker, its twinkle and
       its dust instead. */
    const rig = rigRef.current;

    const flickOf = (i: number) => {
      if (still || FLICKER <= 0) return 1;
      const s = Math.sin(t * 7.3 + flickerSeeds[i]) * Math.sin(t * 3.1 + flickerSeeds[i] * 2.7);
      return s > 1 - FLICKER * 0.09 ? 0.4 : 1;
    };

    /* Solid runs: the reveal is a draw range, so a line DRAWS ON rather than
       fading in — the register's own law, in three dimensions. */
    let si = 0;
    for (let i = 0; i < spec.lines.length; i++) {
      const l = spec.lines[i];
      if (l.dashed) continue;
      const ref = solidRefs.current[si];
      si++;
      if (!ref) continue;
      const r = smootherstep(l.reveal[0], l.reveal[1], p);
      const segs = Math.max(0, l.points.length - 1);
      ref.geometry.instanceCount = Math.max(0, Math.ceil(r * segs));
      ref.material.opacity = l.opacity * flickOf(i);
      ref.visible = r > 0.001;
    }

    dashed.forEach((g, gi) => {
      const el = dashRefs.current[gi];
      if (!el) return;
      let drawn = 0;
      for (const [line, , count] of g.ranges) {
        const r = smootherstep(line.reveal[0], line.reveal[1], p);
        drawn += Math.ceil((r * count) / 2) * 2;
      }
      el.geometry.setDrawRange(0, drawn);
      el.visible = drawn > 0;
    });

    faceGeom.forEach((f, i) => {
      const el = faceRefs.current[i];
      if (!el) return;
      const r = smootherstep(f.face.reveal[0], f.face.reveal[1], p);
      const m = el.material as THREE.MeshBasicMaterial;
      m.opacity = f.face.shade ? r : f.face.opacity * r;
      /* A block becomes solid only once it has arrived: until then it is
         see-through, which is the draw-on of a volume. */
      m.transparent = r < 0.999;
      m.depthWrite = r >= 0.999;
      el.visible = r > 0.01;
    });

    const machine = smootherstep(0, 0.45, p);
    const tw = still ? 1 : 1 + Math.sin(t * 1.7) * TWINKLE * 0.16;
    dustGeom.forEach((d, i) => {
      const el = dustRefs.current[i];
      if (!el) return;
      const m = el.material as THREE.ShaderMaterial;
      m.uniforms.uOpacity.value = d.dust.opacity * palette.dustScale * machine * tw;
      /* ⚠ The RENDERER's own dpr, never `window.devicePixelRatio` — reading
         the raw value against a capped canvas is the recorded cause of the
         corridor's "thick starfield". */
      m.uniforms.uPixelRatio.value = viewport.dpr;
      el.visible = machine > 0.01;
    });

    /* ── Publish where each anchor IS, for the DOM label layer ────────── */
    const cam = camera as THREE.PerspectiveCamera;
    const scale = rig ? rig.scale.x : 1;
    const forward = new THREE.Vector3();
    cam.getWorldDirection(forward);
    const next: HoloAnchor[] = spec.anchors.map((a) => {
      scratch.set(a.p[0] * scale, a.p[1] * scale, a.p[2] * scale);
      if (rig) scratch.applyQuaternion(rig.quaternion);
      const world = scratch.clone();
      const ndc = world.clone().project(cam);
      fromScratch.set(a.from[0] * scale, a.from[1] * scale, a.from[2] * scale);
      if (rig) fromScratch.applyQuaternion(rig.quaternion);
      const fNdc = fromScratch.clone().project(cam);
      /* The stand-off direction, in SCREEN space: away from `from`. Without
         it a leader stops pointing at anything the moment the object turns. */
      const dnx = ndc.x - fNdc.x;
      const dny = -(ndc.y - fNdc.y);
      const dnl = Math.hypot(dnx, dny) || 1;
      const toPoint = world.clone().sub(cam.position).normalize();
      return {
        id: a.id,
        x: ndc.x * 0.5 + 0.5,
        y: 0.5 - ndc.y * 0.5,
        frontness: 1,
        visible: ndc.z < 1 && toPoint.dot(forward) > 0,
        side: a.side,
        nx: dnx / dnl,
        ny: dny / dnl,
      };
    });
    channel.publish(next);

    if (!ready.current) {
      ready.current = true;
      onReady?.();
    }
    if (!still) invalidate();
    else if (p < 1) invalidate();
  });

  return (
    <group ref={rigRef}>
      {dashed.map((g, i) => (
        <lineSegments
          key={`dash-${g.role}`}
          ref={(el) => {
            dashRefs.current[i] = el;
          }}
          geometry={g.geometry}
        >
          <lineBasicMaterial
            color={colourOf(g.role)}
            transparent
            opacity={g.role === "grid" ? 0.1 : 0.24}
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>
      ))}

      {faceGeom.map((f, i) => (
        <mesh
          key={f.face.id}
          ref={(el) => {
            faceRefs.current[i] = el;
          }}
          geometry={f.geometry}
        >
          <meshBasicMaterial
            color={f.face.shade ? faceColour(f.face.role, f.face.shade) : colourOf(f.face.role)}
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={f.face.shade ? THREE.NormalBlending : blend}
            toneMapped={false}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      ))}

      {dustGeom.map((d, i) => (
        <points
          key={d.dust.id}
          ref={(el) => {
            dustRefs.current[i] = el as THREE.Points<THREE.BufferGeometry> | null;
          }}
          geometry={d.geometry}
          material={dustMat}
        />
      ))}

      {solids.map((s, i) => (
        <Line
          key={s.line.id}
          ref={(el) => {
            solidRefs.current[i] = el;
          }}
          points={s.points}
          color={colourOf(s.line.role)}
          lineWidth={s.line.width}
          transparent
          opacity={s.line.opacity}
          depthWrite={false}
          toneMapped={!s.line.donor}
          blending={s.line.donor ? blend : THREE.NormalBlending}
        />
      ))}
    </group>
  );
}
