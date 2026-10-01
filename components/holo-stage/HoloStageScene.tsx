"use client";

/**
 * HoloStageScene — paints ONE `HoloStageSpec`, whatever it draws.
 *
 * ⚠ ONE SCENE, EVERY DRAWING. ADR-080's scene is a component per object, and
 * its own record says what that cost: the lab and the page drifted into two
 * compositions with every guard green, twice. Here the drawing is DATA and
 * this file is the only thing that knows how to paint it, so a new beat is a
 * builder (`stageGeom`, `curveGeom`, `spectrumGeom`) rather than a second
 * renderer.
 *
 * ⚠ IT IS ALIVE AT REST, by the same owner ruling ADR-080 U1 records against
 * ADR-021's static-instrument law: flicker and twinkle on a wall clock, scoped
 * to this object, only while it is on screen and the document is visible. It
 * never captures the wheel and never moves the page.
 *
 * ⚠ EVERY COLOUR COMES OFF THE PALETTE, never a module constant — ADR-058's
 * whole finding about the corridor's painters, and the reason `holoPalette`
 * is two genuinely different drawings rather than a token swap.
 *
 * ADR-140 adds four things, all data-driven: the BATCH (every `batch` line in
 * one instanced draw, drawn on and swept in the shader), the SWEEP (a gold
 * front crossing the object once on arrival), reveal GROUPS (a clock per
 * group the canvas eases toward — the curve's second dial rises when its
 * button is pressed) and STRIPS (a ribbon as one triangle strip). The drei
 * donor runs, the shaded faces and the anchor channel are the U4 scene's.
 */

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ComponentRef, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

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
import { buildStageBatch, type StageBatchUniforms } from "./stageBatch";
import { stageDustFragmentShader, stageDustVertexShader } from "./stageDustShader";
import { sweepAt, type HoloStageSpec, type StageLine, type StageRole } from "./stageGeom";

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

/** A reveal group's clock: how long it takes to open or close, in ms. The
 *  SVG's own `.arc-cv__depth` fades over 600; a surface drawing on is read
 *  end to end at this. */
const GROUP_MS = 1100;

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
  /** Which reveal groups are open. Absent = all closed. */
  groups?: Readonly<Record<string, boolean>>;
  onReady?: () => void;
}

export function HoloStageScene({
  spec,
  palette,
  channel,
  armed,
  still = false,
  groups,
  onReady,
}: HoloStageSceneProps) {
  const { invalidate, camera, viewport, size } = useThree();
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

  /* ── The groups' clocks ─────────────────────────────────────────────── */
  const groupNames = useMemo(() => spec.groups ?? [], [spec]);
  const groupIndex = useMemo(
    () => (g: string | undefined) => (g ? groupNames.indexOf(g) + 1 : 0),
    [groupNames]
  );
  /* Each group's eased progress 0..1. Seeded at its TARGET on the first
     frame (never during render — a ref read there is a lint finding), so a
     canvas that arrives with a group open does not replay its rise. */
  const groupP = useRef<number[] | null>(null);
  const clockOf = (g: string | undefined, p: number) => {
    if (!g) return p;
    const i = groupNames.indexOf(g);
    return i < 0 ? p : (groupP.current?.[i] ?? 0);
  };

  /* ── Geometry, built once per spec ──────────────────────────────────── */

  const sweepColour = palette.additive ? C.accent : C.gold;

  /** The dense structure: one instanced draw (ADR-140). */
  const batch = useMemo(
    () =>
      buildStageBatch(
        spec.lines,
        { colourOf, additive: palette.additive },
        groupIndex,
        sweepColour
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- colourOf is derived from `C`, which is derived from `palette`
    [spec, palette, C, groupIndex, sweepColour]
  );

  /** The lit runs ride drei's fat `Line` (a real width, a draw-range reveal, bloom). */
  const solids = useMemo(
    () =>
      spec.lines
        .filter((l) => !l.dashed && !l.batch)
        .map((l) => ({ line: l, points: l.points.map((p) => new THREE.Vector3(...p)) })),
    [spec]
  );

  /** Dashed runs are ONE buffer per role: the reveal is a draw range on the lot. */
  const dashed = useMemo(() => {
    const byRole = new Map<StageRole, { pos: number[]; ranges: [StageLine, number, number][] }>();
    for (const l of spec.lines) {
      if (!l.dashed || l.batch) continue;
      const g = byRole.get(l.role) ?? { pos: [], ranges: [] };
      const start = g.pos.length / 3;
      for (const v of dashSegments(l.points)) g.pos.push(v.x, v.y, v.z);
      g.ranges.push([l, start, g.pos.length / 3 - start]);
      byRole.set(l.role, g);
    }
    return [...byRole.entries()].map(([role, g]) => {
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

  /** A ribbon between two rails, as one triangle strip (ADR-140). */
  const stripGeom = useMemo(
    () =>
      (spec.strips ?? []).map((s) => {
        const g = new THREE.BufferGeometry();
        const n = Math.min(s.left.length, s.right.length);
        const pos = new Float32Array(n * 2 * 3);
        const idx: number[] = [];
        for (let i = 0; i < n; i++) {
          const l = s.left[i];
          const r = s.right[i];
          pos.set(l, i * 6);
          pos.set(r, i * 6 + 3);
          if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
        }
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        g.setIndex(idx);
        return { strip: s, geometry: g };
      }),
    [spec]
  );

  const dustGeom = useMemo(
    () =>
      spec.dust.map((d) => {
        const g = new THREE.BufferGeometry();
        const pos = new Float32Array(d.points.length * 3);
        const rand = new Float32Array(d.points.length);
        const order = new Float32Array(d.points.length);
        const rnd = mulberry32(HOLO_SEED + 17);
        d.points.forEach((p, i) => {
          pos[i * 3] = p[0];
          pos[i * 3 + 1] = p[1];
          pos[i * 3 + 2] = p[2];
          rand[i] = rnd();
          order[i] = d.order ? d.order[i] : 1;
        });
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        g.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
        g.setAttribute("aOrder", new THREE.BufferAttribute(order, 1));
        /* ⚠ A `ShaderMaterial`, never `PointsMaterial` — three's points chain
           has no radial mask, so a mote renders as a hard opaque square (the
           owner's "particles too thick", recorded one folder over). */
        const material = new THREE.ShaderMaterial({
          vertexShader: stageDustVertexShader,
          fragmentShader: stageDustFragmentShader,
          uniforms: {
            /* ⚠ THE SHADER SOFTENS PERSPECTIVE BY CAMERA DISTANCE (9 / dist,
               clamped to 0.4) and the stage camera stands 30 units off in a
               parallel view, so every mote lands on the 0.4 floor: 7 paints
               ~2.8px, the trajectory's own grain. The flat view takes 1. */
            uPointSize: { value: d.size ?? 7 },
            uPixelRatio: { value: 1 },
            uColor: { value: colourOf(d.role ?? "machine").clone() },
            uSweepColor: { value: sweepColour.clone() },
            uOpacity: { value: 0 },
            uTime: { value: 0 },
            uDrift: { value: d.drift ?? 0 },
            uFlat: { value: spec.view === "flat" },
            uSweepOn: { value: false },
            uSweepAxis: { value: spec.sweep?.axis ?? 0 },
            uSweep: { value: 0 },
            uSweepWidth: { value: spec.sweep?.width ?? 1 },
          },
          transparent: true,
          depthWrite: false,
          blending: blend,
        });
        return { dust: d, geometry: g, material };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- colourOf/sweepColour derive from `C`
    [spec, blend, C, sweepColour]
  );

  useEffect(
    () => () => {
      batch?.dispose();
      for (const d of dashed) d.geometry.dispose();
      for (const f of faceGeom) f.geometry.dispose();
      for (const s of stripGeom) s.geometry.dispose();
      for (const d of dustGeom) {
        d.geometry.dispose();
        d.material.dispose();
      }
    },
    [batch, dashed, faceGeom, stripGeom, dustGeom]
  );

  /* ── Refs the frame writes through ──────────────────────────────────── */
  /* ⚠ EVERY PER-FRAME WRITE GOES THROUGH A REF, never through the memoised
     value it was built from: the compiler's immutability rule reads a write
     to `batch.uniforms` as a mutation of a hook argument, and the lint
     ratchet has no headroom (`--max-warnings` sits AT its count). */
  const batchMeshRef = useRef<THREE.Mesh>(null);
  const groupsVecRef = useRef<THREE.Vector4 | null>(null);
  const solidRefs = useRef<(ComponentRef<typeof Line> | null)[]>([]);
  const dashRefs = useRef<(THREE.LineSegments | null)[]>([]);
  const faceRefs = useRef<(THREE.Mesh | null)[]>([]);
  const stripRefs = useRef<(THREE.Mesh | null)[]>([]);
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

  /* A group opening or closing wakes the loop; the frame eases it. */
  useEffect(() => {
    invalidate();
  }, [groups, invalidate]);

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

    /* The groups ease toward their targets, at one speed either way. */
    if (!groupP.current || groupP.current.length !== groupNames.length) {
      groupP.current = groupNames.map((g) => (groups?.[g] ? 1 : 0));
    }
    const gp = groupP.current;
    let groupsMoving = false;
    groupNames.forEach((g, i) => {
      const target = groups?.[g] ? 1 : 0;
      const cur = gp[i];
      if (cur === target) return;
      const step = still ? 1 : (dt * 1000) / GROUP_MS;
      gp[i] = cur < target ? Math.min(target, cur + step) : Math.max(target, cur - step);
      groupsMoving = true;
    });
    if (!groupsVecRef.current) groupsVecRef.current = new THREE.Vector4();
    const groupsVec = groupsVecRef.current;
    groupsVec.set(gp[0] ?? 0, gp[1] ?? 0, gp[2] ?? 0, gp[3] ?? 0);

    /* The sweep's front, in world. Past the intro it has crossed everything. */
    const sweep = spec.sweep;
    const front = sweep ? (still ? sweep.to + sweep.width * 4 : sweepAt(sweep, p)) : 0;

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

    const batchMesh = batchMeshRef.current;
    if (batchMesh) {
      const u = (batchMesh.material as THREE.RawShaderMaterial)
        .uniforms as unknown as StageBatchUniforms;
      u.res.value.set(size.width, size.height);
      u.pxScale.value = viewport.dpr;
      u.uProgress.value = p;
      u.uGroups.value.copy(groupsVec);
      u.uSweepOn.value = !!sweep;
      if (sweep) {
        u.uSweepAxis.value = sweep.axis;
        u.uSweep.value = front;
        u.uSweepWidth.value = sweep.width;
      }
    }

    /* Solid runs: the reveal is a draw range, so a line DRAWS ON rather than
       fading in — the register's own law, in three dimensions. */
    let si = 0;
    for (let i = 0; i < spec.lines.length; i++) {
      const l = spec.lines[i];
      if (l.dashed || l.batch) continue;
      const ref = solidRefs.current[si];
      si++;
      if (!ref) continue;
      const r = smootherstep(l.reveal[0], l.reveal[1], clockOf(l.group, p));
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
        const r = smootherstep(line.reveal[0], line.reveal[1], clockOf(line.group, p));
        drawn += Math.ceil((r * count) / 2) * 2;
      }
      el.geometry.setDrawRange(0, drawn);
      el.visible = drawn > 0;
    });

    faceGeom.forEach((f, i) => {
      const el = faceRefs.current[i];
      if (!el) return;
      const r = smootherstep(f.face.reveal[0], f.face.reveal[1], clockOf(f.face.group, p));
      const m = el.material as THREE.MeshBasicMaterial;
      m.opacity = f.face.shade ? r : f.face.opacity * r;
      /* A block becomes solid only once it has arrived: until then it is
         see-through, which is the draw-on of a volume. */
      m.transparent = !f.face.shade || r < 0.999;
      m.depthWrite = !!f.face.shade && r >= 0.999;
      el.visible = r > 0.01;
    });

    stripGeom.forEach((s, i) => {
      const el = stripRefs.current[i];
      if (!el) return;
      const r = smootherstep(s.strip.reveal[0], s.strip.reveal[1], clockOf(s.strip.group, p));
      const m = el.material as THREE.MeshBasicMaterial;
      m.opacity = s.strip.opacity * r;
      el.visible = r > 0.01;
    });

    const machine = smootherstep(0, 0.45, p);
    const tw = still ? 1 : 1 + Math.sin(t * 1.7) * TWINKLE * 0.16;
    dustGeom.forEach((d, i) => {
      const el = dustRefs.current[i];
      if (!el) return;
      const m = el.material as THREE.ShaderMaterial;
      const r = d.dust.group ? clockOf(d.dust.group, p) : machine;
      const ink = palette.additive ? 1 : (d.dust.inkScale ?? 1);
      m.uniforms.uOpacity.value = d.dust.opacity * palette.dustScale * ink * r * tw;
      m.uniforms.uTime.value = t;
      /* ⚠ The RENDERER's own dpr, never `window.devicePixelRatio` — reading
         the raw value against a capped canvas is the recorded cause of the
         corridor's "thick starfield". */
      m.uniforms.uPixelRatio.value = viewport.dpr;
      m.uniforms.uSweepOn.value = !!sweep && !d.dust.group;
      m.uniforms.uSweep.value = front;
      el.visible = r > 0.01;
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
    const drifting = spec.dust.some((d) => (d.drift ?? 0) > 0);
    if (!still || drifting) invalidate();
    else if (p < 1 || groupsMoving) invalidate();
  });

  return (
    <group ref={rigRef}>
      {batch ? <primitive ref={batchMeshRef} object={batch.mesh} /> : null}

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

      {stripGeom.map((s, i) => (
        <mesh
          key={s.strip.id}
          ref={(el) => {
            stripRefs.current[i] = el;
          }}
          geometry={s.geometry}
        >
          <meshBasicMaterial
            color={colourOf(s.strip.role)}
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={blend}
            toneMapped={false}
          />
        </mesh>
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
          material={d.material}
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
