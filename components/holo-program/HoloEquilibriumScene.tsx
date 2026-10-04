"use client";

/**
 * HoloEquilibriumScene — the workshop opener's holographic object (ADR-143 U7).
 *
 * A contour-sliced core held between two ring systems: UPSTREAM above, tilted
 * up and open, DOWNSTREAM below, tilted down and tight. Graduated bands, one
 * bright arc gliding round each system, gold motes running steadily round the
 * downstream rings and drifting round the upstream one, and motes falling
 * down the axis from one to the other — what works upstream is encoded and
 * runs downstream. Every number is `equilibriumGeom.ts`'s, which the static
 * drawing is projected from too.
 *
 * ⚠ THE ADR-080 IDIOM (`HoloProgramScene`): drei `Line` for the rings, drawn
 * on through `instanceCount`; `LineSegments` for ticks, slices and the floor,
 * drawn on through `drawRange`; the dust shader for every mote.
 *
 * ⚠ NOTHING FLICKERS (ADR-097 U12). ADR-080's per-ring dropout and its
 * breathing are NOT here: the object lives by motion alone — motes travel,
 * the bright arcs glide — and no brightness ever pulses.
 *
 * ⚠ A FADE IS TOWARD THE GROUND, NEVER TOWARD BLACK, ON PAPER. Additive dawn
 * fades to black on void, which is the ground there; on parchment the same
 * multiply walks toward maximum contrast (the Build park's node streams,
 * 2026-09-09). Every baked shade mixes toward `fadeTo`.
 */

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ComponentRef, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { AnchorChannel } from "@/components/holo-stage/stageAnchors";

import {
  coreSlices,
  EQ_ANCHORS,
  EQ_AXIS,
  EQ_CAMERA,
  EQ_FALL,
  EQ_FLOOR,
  EQ_LEVEL,
  EQ_SYSTEMS,
  eqCameraBasis,
  eqDust,
  floorSegments,
  ringLocal,
  ticksLocal,
  toWorld,
  type EqSystem,
  type P3,
} from "./equilibriumGeom";
import { holoDustFragmentShader, holoDustVertexShader } from "./holoDustShader";
import type { HoloPalette } from "./holoPalette";

/** The arrival, ms: the floor and the core, then downstream, then upstream,
 *  then the bright arcs, the axis and the motes. */
const INTRO_MS = 2600;

function smootherstep(a: number, b: number, x: number): number {
  if (b <= a) return x >= b ? 1 : 0;
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** A system's placement as a matrix: local x, y, z on `a`, `n`, `b`. */
function systemMatrix(sys: EqSystem): THREE.Matrix4 {
  const m = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(...sys.a),
    new THREE.Vector3(...sys.n),
    new THREE.Vector3(...sys.b)
  );
  m.setPosition(new THREE.Vector3(...sys.centre));
  return m;
}

export interface HoloEquilibriumSceneProps {
  palette: HoloPalette;
  /** Arms the arrival; until then nothing is drawn. */
  armed: boolean;
  /** Everything drawn, no arrival and no life (the lab's hold-still). */
  still?: boolean;
  onReady?: () => void;
  /** Where each word's point is on screen, for the DOM words. */
  channel: AnchorChannel;
}

export function HoloEquilibriumScene({
  palette,
  armed,
  still = false,
  onReady,
  channel,
}: HoloEquilibriumSceneProps) {
  const { invalidate, camera, viewport } = useThree();

  const blend = palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
  const C = useMemo(
    () => ({
      structure: new THREE.Color(palette.structure),
      machine: new THREE.Color(palette.machine),
      gold: new THREE.Color(palette.gold),
      grid: new THREE.Color(palette.grid),
      fadeTo: palette.additive ? new THREE.Color(0, 0, 0) : new THREE.Color(palette.ground),
    }),
    [palette]
  );

  /* Near side bright, far side receding: the corridor's own weave, baked at
     the rest pose (the reader's drag turns the object, not its shading). */
  const shade = useMemo(() => {
    const cam = eqCameraBasis();
    const centre = EQ_CAMERA.distance;
    return (p: P3, base: THREE.Color, k = 1): [number, number, number] => {
      const d =
        (p[0] - cam.eye[0]) * cam.fwd[0] +
        (p[1] - cam.eye[1]) * cam.fwd[1] +
        (p[2] - cam.eye[2]) * cam.fwd[2];
      const front = Math.min(1, Math.max(0, 0.5 - (d - centre) / 3.2));
      const c = C.fadeTo.clone().lerp(base, (0.3 + 0.7 * front) * k);
      return [c.r, c.g, c.b];
    };
  }, [C]);

  /* ── Geometry ─────────────────────────────────────────────────────── */
  const systems = useMemo(
    () =>
      EQ_SYSTEMS.map((spec) => {
        const matrix = systemMatrix(spec.sys);
        const rings = spec.rings.map((r) => {
          const pts = ringLocal(r.r);
          const cols = pts.map((p) => shade(toWorld(spec.sys, p), C.structure));
          if (!r.dashed) return { ring: r, pts, cols, dashes: null };
          /* The exploratory ring as dashes: every other segment. */
          const pos: number[] = [];
          const col: number[] = [];
          for (let i = 0; i + 1 < pts.length; i += 2) {
            pos.push(...pts[i], ...pts[i + 1]);
            col.push(...cols[i], ...cols[i + 1]);
          }
          const g = new THREE.BufferGeometry();
          g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
          g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
          return { ring: r, pts, cols, dashes: g };
        });
        const ticks = spec.ticks.map((t) => {
          const pts = ticksLocal(t);
          const g = new THREE.BufferGeometry();
          g.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
          g.setAttribute(
            "color",
            new THREE.Float32BufferAttribute(
              pts.flatMap((p) => shade(toWorld(spec.sys, p), C.structure, 0.7)),
              3
            )
          );
          return { t, g, count: pts.length };
        });
        const arcPts = ringLocal(spec.arc.r, 160, 0, spec.arc.span);
        const motes = spec.motes.map((m) => {
          const g = new THREE.BufferGeometry();
          g.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(
              m.at.flatMap((deg) => [
                m.r * Math.cos((deg * Math.PI) / 180),
                0,
                m.r * Math.sin((deg * Math.PI) / 180),
              ]),
              3
            )
          );
          g.setAttribute(
            "aRand",
            new THREE.Float32BufferAttribute(
              m.at.map((_, i) => (i * 0.618) % 1),
              1
            )
          );
          return { m, g };
        });
        return { spec, matrix, rings, ticks, arcPts, motes };
      }),
    [C, shade]
  );

  const core = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    for (const slice of coreSlices()) {
      for (let i = 0; i + 1 < slice.length; i++) {
        pos.push(...slice[i], ...slice[i + 1]);
        col.push(...shade(slice[i], C.structure, 0.86), ...shade(slice[i + 1], C.structure, 0.86));
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    return { g, count: pos.length / 3 };
  }, [C, shade]);

  const floor = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    for (const s of floorSegments()) {
      const c = C.fadeTo
        .clone()
        .lerp(C.grid, EQ_FLOOR.alpha * s.fade * (palette.additive ? 1 : 1.3));
      pos.push(...s.a, ...s.b);
      col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, [C, palette.additive]);

  const level = useMemo(() => {
    const pts = ringLocal(EQ_LEVEL.r, 200);
    const pos: number[] = [];
    for (let i = 0; i + 1 < pts.length; i += 2) {
      pos.push(pts[i][0], EQ_LEVEL.y, pts[i][2], pts[i + 1][0], EQ_LEVEL.y, pts[i + 1][2]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);

  const axisPts = useMemo<[number, number, number][]>(
    () => [
      [0, EQ_AXIS.top, 0],
      [0, EQ_AXIS.bottom, 0],
    ],
    []
  );

  const fall = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Array(EQ_FALL.count * 3).fill(0), 3)
    );
    g.setAttribute(
      "aRand",
      new THREE.Float32BufferAttribute(
        Array.from({ length: EQ_FALL.count }, (_, i) => (i * 0.37) % 1),
        1
      )
    );
    return g;
  }, []);

  const dust = useMemo(() => {
    const pts = eqDust();
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
    g.setAttribute(
      "aRand",
      new THREE.Float32BufferAttribute(
        pts.map((_, i) => ((i * 9301 + 49297) % 233280) / 233280),
        1
      )
    );
    return g;
  }, []);

  /* The motes' materials: gold for the record's flow, the machine tone for
     the dust. ⚠ A `ShaderMaterial`, never `PointsMaterial` (a hard opaque
     square without a map — ADR-080's "particles too thick"). */
  const moteMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: holoDustVertexShader,
        fragmentShader: holoDustFragmentShader,
        uniforms: {
          /* The flow has to read as beads, not specks: the soft mask puts
             most of a mote in its halo, so it is drawn larger than dust. */
          uPointSize: { value: palette.additive ? 6.4 : 6 },
          uPixelRatio: { value: 1 },
          uColor: { value: palette.additive ? C.gold.clone().multiplyScalar(1.6) : C.gold.clone() },
          uOpacity: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: blend,
      }),
    [blend, C, palette.additive]
  );
  const dustMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: holoDustVertexShader,
        fragmentShader: holoDustFragmentShader,
        uniforms: {
          /* ⚠ THE DUST IS THE STRUCTURE'S TONE, NOT THE MACHINE'S: on dark
             the machine rung is a gold, and gold dust competed with the gold
             flow (first headed shot). Gold is the flow's alone. */
          uPointSize: { value: 2.6 },
          uPixelRatio: { value: 1 },
          uColor: { value: C.structure.clone() },
          uOpacity: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: blend,
      }),
    [blend, C]
  );

  useEffect(
    () => () => {
      for (const s of systems) {
        for (const r of s.rings) r.dashes?.dispose();
        for (const t of s.ticks) t.g.dispose();
        for (const m of s.motes) m.g.dispose();
      }
      core.g.dispose();
      floor.dispose();
      level.dispose();
      fall.dispose();
      dust.dispose();
      moteMat.dispose();
      dustMat.dispose();
    },
    [systems, core, floor, level, fall, dust, moteMat, dustMat]
  );

  /* ── Refs the frame writes through ─────────────────────────────────── */
  const ringRefs = useRef<Record<string, ComponentRef<typeof Line> | null>>({});
  const dashRefs = useRef<Record<string, THREE.LineSegments | null>>({});
  const tickRefs = useRef<Record<string, THREE.LineSegments | null>>({});
  const arcRefs = useRef<Record<string, ComponentRef<typeof Line> | null>>({});
  const spinRefs = useRef<Record<string, THREE.Group | null>>({});
  const coreRef = useRef<THREE.LineSegments>(null);
  const floorRef = useRef<THREE.LineSegments>(null);
  const levelRef = useRef<THREE.LineSegments>(null);
  const axisRef = useRef<ComponentRef<typeof Line>>(null);
  const fallRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);

  /* ⚠ EVERY PER-FRAME WRITE GOES THROUGH A REF (the stage scene's own rule):
     the compiler's immutability rule reads a write to a memoised object as a
     mutation of a hook argument, and the lint ratchet has no headroom. The
     motes' material is reached through the falling motes' points, the dust's
     through its own. */
  const progress = useRef(still ? 1 : 0);
  const clock = useRef(0);
  const ready = useRef(false);
  const scratch = useRef(new THREE.Vector3());

  useEffect(() => {
    if (still) progress.current = 1;
    invalidate();
  }, [still, armed, invalidate]);
  useEffect(() => () => channel.clear(), [channel]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (armed || still) clock.current += dt;
    const t = clock.current;
    if (still) progress.current = 1;
    else if (armed && progress.current < 1) {
      progress.current = Math.min(1, progress.current + (dt * 1000) / INTRO_MS);
    }
    const p = progress.current;
    const dpr = viewport.dpr;
    const motes = fallRef.current;
    const motesMat = motes?.material as THREE.ShaderMaterial | undefined;
    const dustMatLive = dustRef.current?.material as THREE.ShaderMaterial | undefined;
    if (motesMat) motesMat.uniforms.uPixelRatio.value = dpr;
    if (dustMatLive) dustMatLive.uniforms.uPixelRatio.value = dpr;

    /* The floor, the level and the core arrive first. */
    const floorR = smootherstep(0, 0.28, p);
    if (floorRef.current) {
      (floorRef.current.material as THREE.LineBasicMaterial).opacity = floorR;
      floorRef.current.visible = floorR > 0.001;
    }
    const levelR = smootherstep(0.04, 0.36, p);
    if (levelRef.current) {
      levelRef.current.geometry.setDrawRange(
        0,
        Math.floor((levelR * level.attributes.position.count) / 2) * 2
      );
      levelRef.current.visible = levelR > 0.001;
    }
    const coreR = smootherstep(0, 0.46, p);
    if (coreRef.current) {
      coreRef.current.geometry.setDrawRange(0, Math.floor((coreR * core.count) / 2) * 2);
      coreRef.current.visible = coreR > 0.001;
    }

    /* The rings draw on, their bands populate, the bright arcs glide. */
    for (const s of systems) {
      for (const r of s.rings) {
        const rv = smootherstep(r.ring.reveal[0], r.ring.reveal[1], p);
        if (r.dashes) {
          const seg = dashRefs.current[r.ring.id];
          if (seg) {
            seg.geometry.setDrawRange(
              0,
              Math.floor((rv * r.dashes.attributes.position.count) / 2) * 2
            );
            seg.visible = rv > 0.001;
          }
        } else {
          const line = ringRefs.current[r.ring.id];
          if (line) {
            line.geometry.instanceCount = Math.max(0, Math.ceil(rv * (r.pts.length - 1)));
            line.visible = rv > 0.001;
          }
        }
      }
      for (const tk of s.ticks) {
        const tv = smootherstep(tk.t.reveal[0], tk.t.reveal[1], p);
        const seg = tickRefs.current[tk.t.id];
        if (seg) {
          seg.geometry.setDrawRange(0, Math.floor((tv * tk.count) / 2) * 2);
          seg.visible = tv > 0.001;
        }
      }
      const spin = spinRefs.current[s.spec.sys.id];
      if (spin) spin.rotation.y = -(s.spec.arc.start * Math.PI) / 180 - t * s.spec.arc.speed;
      const arc = arcRefs.current[s.spec.arc.id];
      if (arc) {
        const av = smootherstep(0.68, 0.92, p);
        arc.material.opacity = av;
        arc.visible = av > 0.001;
      }
      for (const m of s.motes) {
        const g = spinRefs.current[m.m.id];
        if (g) g.rotation.y = -t * m.m.speed;
      }
    }

    /* The axis, and the motes falling down it. */
    const axisR = smootherstep(0.62, 0.9, p);
    if (axisRef.current) {
      axisRef.current.geometry.instanceCount = axisR > 0.001 ? 1 : 0;
      axisRef.current.material.opacity = 0.55 * axisR;
      axisRef.current.visible = axisR > 0.001;
    }
    const span = EQ_AXIS.top - EQ_AXIS.bottom;
    const moteR = smootherstep(0.78, 1, p);
    if (motes) {
      const pos = motes.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < EQ_FALL.count; i++) {
        const k = (t / EQ_FALL.period + i / EQ_FALL.count) % 1;
        pos.setXYZ(i, 0, EQ_AXIS.top - k * span, 0);
      }
      pos.needsUpdate = true;
      motes.visible = moteR > 0.001;
    }
    if (motesMat) motesMat.uniforms.uOpacity.value = moteR * (palette.additive ? 0.95 : 1);
    if (dustMatLive) {
      dustMatLive.uniforms.uOpacity.value = smootherstep(0.1, 0.5, p) * 0.32 * palette.dustScale;
    }

    /* Where each word's point IS, for the DOM words. */
    channel.publish(
      (Object.keys(EQ_ANCHORS) as (keyof typeof EQ_ANCHORS)[]).map((id) => {
        const v = scratch.current.set(...EQ_ANCHORS[id]).project(camera);
        return {
          id,
          x: v.x * 0.5 + 0.5,
          y: 0.5 - v.y * 0.5,
          frontness: 1,
          visible: v.z < 1,
          side: "up" as const,
          nx: 0,
          ny: 0,
        };
      })
    );

    if (!ready.current) {
      ready.current = true;
      onReady?.();
    }
    /* The arrival keeps itself drawing; the life after it is the canvas's
       on-screen pump, so an off-screen object costs nothing. */
    if (armed && p < 1) invalidate();
  });

  return (
    <group>
      <lineSegments ref={floorRef} geometry={floor}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0}
          depthWrite={false}
          blending={blend}
        />
      </lineSegments>
      <lineSegments ref={levelRef} geometry={level}>
        <lineBasicMaterial
          color={C.machine}
          transparent
          opacity={palette.additive ? 0.22 : 0.3}
          depthWrite={false}
          blending={blend}
        />
      </lineSegments>
      <points ref={dustRef} geometry={dust} material={dustMat} />

      <lineSegments ref={coreRef} geometry={core.g}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={blend}
        />
      </lineSegments>

      {systems.map((s) => (
        <group key={s.spec.sys.id} matrixAutoUpdate={false} matrix={s.matrix}>
          {s.rings.map((r) =>
            r.dashes ? (
              <lineSegments
                key={r.ring.id}
                ref={(el) => {
                  dashRefs.current[r.ring.id] = el;
                }}
                geometry={r.dashes}
              >
                <lineBasicMaterial
                  vertexColors
                  transparent
                  opacity={r.ring.opacity}
                  depthWrite={false}
                  blending={blend}
                />
              </lineSegments>
            ) : (
              <Line
                key={r.ring.id}
                ref={(el) => {
                  ringRefs.current[r.ring.id] = el;
                }}
                points={r.pts}
                vertexColors={r.cols}
                lineWidth={r.ring.width}
                transparent
                opacity={r.ring.opacity}
                depthWrite={false}
              />
            )
          )}
          {s.ticks.map((tk) => (
            <lineSegments
              key={tk.t.id}
              ref={(el) => {
                tickRefs.current[tk.t.id] = el;
              }}
              geometry={tk.g}
            >
              <lineBasicMaterial
                vertexColors
                transparent
                opacity={0.85}
                depthWrite={false}
                blending={blend}
              />
            </lineSegments>
          ))}
          {/* The bright arc rides its own turning group, so gliding it costs
              a rotation, never a rebuilt line. */}
          <group
            ref={(el) => {
              spinRefs.current[s.spec.sys.id] = el;
            }}
          >
            <Line
              ref={(el) => {
                arcRefs.current[s.spec.arc.id] = el;
              }}
              points={s.arcPts}
              color={palette.additive ? C.gold.clone().multiplyScalar(2.2) : C.gold}
              lineWidth={2.4}
              transparent
              opacity={0}
              depthWrite={false}
              toneMapped={false}
            />
          </group>
          {s.motes.map((m) => (
            <group
              key={m.m.id}
              ref={(el) => {
                spinRefs.current[m.m.id] = el;
              }}
            >
              <points geometry={m.g} material={moteMat} />
            </group>
          ))}
        </group>
      ))}

      <Line
        ref={axisRef}
        points={axisPts}
        color={C.gold}
        lineWidth={1}
        transparent
        opacity={0}
        depthWrite={false}
      />
      <points ref={fallRef} geometry={fall} material={moteMat} />
    </group>
  );
}
