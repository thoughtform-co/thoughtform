"use client";

/**
 * HoloEquilibriumScene — the workshop opener's holographic object (ADR-143 U7).
 *
 * One instrument on one axis, read left to right: THOUGHT, holo.ui8's crumpled
 * contour mass in its graduated cradle, alive (its outline drifts); ENCODE,
 * ADR-080's plated collar in gold, reading level on its fulcrum; FORM,
 * ADR-080's coaxial stack of toothed rings at one pitch, receding. Gold motes
 * drift through the thought, find the axis as it calms, and run down the stack
 * at one rhythm. Every number is `equilibriumGeom.ts`'s, which the static
 * drawing is projected from too.
 *
 * ⚠ THE ADR-080 IDIOM (`HoloProgramScene`): drei `Line` for the rings and the
 * bright arcs, drawn on through `instanceCount`; `LineSegments` for slices,
 * teeth, plates and the floor, drawn on through `drawRange`; a soft-point
 * shader for every mote.
 *
 * ⚠ NOTHING FLICKERS (ADR-097 U12). No dropout, no breathing, no re-scan: the
 * object lives by motion alone — the thought's outline drifts, the two
 * highlights glide, the motes travel — and no brightness ever pulses.
 *
 * ⚠ A FADE IS TOWARD THE GROUND, NEVER TOWARD BLACK, ON PAPER. Additive dawn
 * fades to black on void, which is the ground there; on parchment the same
 * multiply walks toward maximum contrast. Every baked shade mixes toward
 * `fadeTo`.
 */

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ComponentRef, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { AnchorChannel } from "@/components/holo-stage/stageAnchors";

import {
  axisRing,
  axisTeeth,
  cradleArc,
  cradleBasis,
  cradleTicks,
  EQ_ANCHORS,
  EQ_AXIS,
  EQ_CAMERA,
  EQ_CRADLE,
  EQ_DROP,
  EQ_FLOOR,
  EQ_FLOW,
  EQ_GATE,
  EQ_STACK,
  eqCameraBasis,
  eqDust,
  fillThoughtSegments,
  floorSegments,
  flowPoint,
  FLOW_PERIOD,
  gateHorizon,
  gateMarker,
  gatePlateSegments,
  levelBar,
  levelFulcrum,
  levelLit,
  reticleLines,
  stackDashes,
  stackRails,
  stackRuler,
  stackX,
  thoughtVertCount,
  type P3,
} from "./equilibriumGeom";
import {
  holoDustFragmentShader,
  holoDustVertexShader,
  holoMoteFragmentShader,
  holoMoteVertexShader,
} from "./holoDustShader";
import type { HoloPalette } from "./holoPalette";

/** The arrival, ms, told left to right: the thought, its cradle, the gate,
 *  then the stack ring by ring, then the axis and the flow. */
const INTRO_MS = 3000;

const RAD = Math.PI / 180;

function smootherstep(a: number, b: number, x: number): number {
  if (b <= a) return x >= b ? 1 : 0;
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** A polyline as segment pairs, for a `LineSegments` buffer. */
function pairs(points: readonly P3[]): P3[] {
  const out: P3[] = [];
  for (let i = 0; i + 1 < points.length; i++) out.push(points[i], points[i + 1]);
  return out;
}

/** The two-point drop, cut into a dashed run of `n` dashes. */
function dashedRun(a: P3, b: P3, n: number): P3[] {
  const out: P3[] = [];
  for (let i = 0; i < n; i++) {
    const t0 = i / n;
    const t1 = (i + 0.5) / n;
    out.push(
      [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0, a[2] + (b[2] - a[2]) * t0],
      [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1, a[2] + (b[2] - a[2]) * t1]
    );
  }
  return out;
}

interface SegLayer {
  id: string;
  geometry: THREE.BufferGeometry;
  count: number;
  reveal: readonly [number, number];
  opacity: number;
}

interface LineLayer {
  id: string;
  points: P3[];
  colors?: [number, number, number][];
  color?: THREE.Color;
  width: number;
  reveal: readonly [number, number];
  opacity: number;
  /** Fades in rather than drawing on (a short mark, or a gliding arc). */
  fade?: boolean;
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
  const C = useMemo(() => {
    const structure = new THREE.Color(palette.structure);
    const gold = new THREE.Color(palette.gold);
    return {
      structure,
      gold,
      grid: new THREE.Color(palette.grid),
      /* On void the highlights run hot so bloom takes them alone; on paper
         nothing may be brighter than the paper, so they are full ink. */
      bright: palette.additive ? structure.clone().multiplyScalar(1.7) : structure.clone(),
      goldHot: palette.additive ? gold.clone().multiplyScalar(2.2) : gold.clone(),
      fadeTo: palette.additive ? new THREE.Color(0, 0, 0) : new THREE.Color(palette.ground),
    };
  }, [palette]);

  /* Near bright, far receding, baked at the rest pose (a drag turns the
     object, not its shading). The stack runs away from the eye, so its far
     rings recede: the line running off into depth. */
  const shade = useMemo(() => {
    const cam = eqCameraBasis();
    const centre = EQ_CAMERA.distance;
    return (p: P3, base: THREE.Color, k = 1): [number, number, number] => {
      const d =
        (p[0] - cam.eye[0]) * cam.fwd[0] +
        (p[1] - cam.eye[1]) * cam.fwd[1] +
        (p[2] - cam.eye[2]) * cam.fwd[2];
      const front = Math.min(1, Math.max(0, 0.55 - (d - centre) / 5.2));
      /* Paper reads weaker at equal alpha (ADR-063 U2), so its far floor is
         higher: the line still recedes, and is still there. */
      const near = palette.additive ? 0.28 : 0.44;
      const c = C.fadeTo.clone().lerp(base, (near + (1 - near) * front) * k);
      return [c.r, c.g, c.b];
    };
  }, [C, palette.additive]);

  /* ── Static layers ─────────────────────────────────────────────────── */
  const segLayers = useMemo<SegLayer[]>(() => {
    const make = (
      id: string,
      pts: readonly P3[],
      reveal: readonly [number, number],
      opacity: number,
      k = 1
    ): SegLayer => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
      g.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(
          pts.flatMap((p) => shade(p, C.structure, k)),
          3
        )
      );
      return { id, geometry: g, count: pts.length, reveal, opacity };
    };
    const out: SegLayer[] = [
      make("cradle-ticks", cradleTicks(), [0.3, 0.55], 0.75, 0.75),
      make(
        "reticle",
        reticleLines().flatMap((l) => pairs(l)),
        [0.4, 0.56],
        0.95
      ),
      make("gate-plates", gatePlateSegments(), [0.4, 0.62], 0.9, 0.9),
      make(
        "gate-teeth",
        axisTeeth(
          EQ_GATE.x,
          EQ_GATE.outer,
          EQ_GATE.teeth.step,
          EQ_GATE.teeth.len,
          EQ_GATE.teeth.majorEvery
        ),
        [0.48, 0.68],
        0.8,
        0.7
      ),
      make("gate-horizon", gateHorizon(), [0.55, 0.7], 0.9, 0.85),
    ];
    for (let i = 0; i < EQ_STACK.count; i++) {
      const a = 0.5 + i * 0.045;
      out.push(
        i % 2 === 0
          ? make(
              `stack-teeth-${i}`,
              axisTeeth(
                stackX(i),
                EQ_STACK.r,
                EQ_STACK.teeth.step,
                EQ_STACK.teeth.len,
                EQ_STACK.teeth.majorEvery
              ),
              [a + 0.06, a + 0.2],
              0.8,
              0.72
            )
          : make(`stack-dash-${i}`, stackDashes(i), [a + 0.06, a + 0.2], 0.7, 0.66)
      );
    }
    out.push(make("stack-ruler", stackRuler(), [0.78, 0.92], 0.8, 0.7));
    out.push(make("drop", dashedRun(EQ_DROP[0], EQ_DROP[1], 9), [0.82, 0.95], 0.7, 0.7));
    return out;
  }, [C, shade]);

  const lineLayers = useMemo<LineLayer[]>(() => {
    const cols = (pts: P3[], k = 1) => pts.map((p) => shade(p, C.structure, k));
    const out: LineLayer[] = [];
    EQ_CRADLE.arcs.forEach(([from, to], k) => {
      const pts = cradleArc(EQ_CRADLE.r, from, to);
      out.push({
        id: `cradle-${k}`,
        points: pts,
        colors: cols(pts, 0.8),
        width: 1,
        reveal: [0.18 + k * 0.06, 0.5 + k * 0.06],
        opacity: 0.85,
      });
    });
    const gateRing = axisRing(EQ_GATE.x, EQ_GATE.inner, 220);
    out.push({
      id: "gate-ring",
      points: gateRing,
      color: C.gold,
      width: 1.2,
      reveal: [0.34, 0.6],
      opacity: 0.95,
    });
    const gateOuter = axisRing(EQ_GATE.x, EQ_GATE.outer, 220);
    out.push({
      id: "gate-outer",
      points: gateOuter,
      colors: cols(gateOuter),
      width: 1,
      reveal: [0.4, 0.64],
      opacity: 0.9,
    });
    out.push({
      id: "gate-marker",
      points: gateMarker(),
      color: C.bright,
      width: 1.3,
      reveal: [0.6, 0.72],
      opacity: 1,
      fade: true,
    });
    out.push({
      id: "level-bar",
      points: levelBar(),
      colors: cols(levelBar()),
      width: 1,
      reveal: [0.55, 0.7],
      opacity: 0.9,
    });
    levelLit().forEach((l, k) =>
      out.push({
        id: `level-lit-${k}`,
        points: l,
        color: C.bright,
        width: 1.4,
        reveal: [0.62, 0.74],
        opacity: 1,
        fade: true,
      })
    );
    out.push({
      id: "level-fulcrum",
      points: levelFulcrum(),
      color: C.bright,
      width: 1.2,
      reveal: [0.6, 0.72],
      opacity: 1,
      fade: true,
    });
    for (let i = 0; i < EQ_STACK.count; i++) {
      const ring = axisRing(stackX(i), EQ_STACK.r, 140);
      const a = 0.5 + i * 0.045;
      out.push({
        id: `stack-${i}`,
        points: ring,
        colors: cols(ring),
        width: 1.05,
        reveal: [a, a + 0.16],
        opacity: 0.95,
      });
    }
    stackRails().forEach((l, k) => {
      const pts = l.map((p) => [p[0], p[1], p[2]] as P3);
      out.push({
        id: `rail-${k}`,
        points: pts,
        colors: cols(pts, 0.6),
        width: 0.9,
        reveal: [0.75, 0.9],
        opacity: 0.7,
      });
    });
    out.push({
      id: "axis",
      points: [
        [EQ_AXIS.x0, 0, 0],
        [EQ_AXIS.x1, 0, 0],
      ],
      color: C.gold,
      width: 1,
      reveal: [0.7, 0.88],
      opacity: 0.62,
    });
    return out;
  }, [C, shade]);

  /* The two gliding highlights, in their own turning groups, so gliding one
     costs a rotation, never a rebuilt line. */
  const gateArcPts = useMemo(
    () => axisRing(EQ_GATE.x, EQ_GATE.inner, 220, 0, EQ_GATE.arc.span),
    []
  );
  const cradle = useMemo(() => {
    const { e1, e2 } = cradleBasis();
    const n = new THREE.Vector3(...e1).cross(new THREE.Vector3(...e2)).normalize();
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(...e1), new THREE.Vector3(...e2), n);
    m.setPosition(new THREE.Vector3(...EQ_CRADLE.centre));
    const steps = 60;
    const pts: P3[] = Array.from({ length: steps + 1 }, (_, i) => {
      const th = ((EQ_CRADLE.bright.span * i) / steps) * RAD;
      return [EQ_CRADLE.r * Math.cos(th), EQ_CRADLE.r * Math.sin(th), 0];
    });
    return { matrix: m, pts };
  }, []);

  /* ── The living thought ────────────────────────────────────────────── */
  const thought = useMemo(() => {
    const n = thoughtVertCount();
    const pos = new Float32Array(n * 3);
    fillThoughtSegments(0, pos);
    const col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const c = shade([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]], C.structure, 0.88);
      col.set(c, i * 3);
    }
    const g = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(pos, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", attr);
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { g, count: n };
  }, [C, shade]);

  const floor = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    for (const s of floorSegments()) {
      const c = C.fadeTo
        .clone()
        .lerp(C.grid, EQ_FLOOR.alpha * s.fade * (palette.additive ? 1.1 : 1.4));
      pos.push(...s.a, ...s.b);
      col.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, [C, palette.additive]);

  const flow = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = EQ_FLOW.count;
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Array(n * 3).fill(0), 3));
    g.setAttribute("aFade", new THREE.Float32BufferAttribute(new Array(n).fill(0), 1));
    g.setAttribute(
      "aRand",
      new THREE.Float32BufferAttribute(
        Array.from({ length: n }, (_, i) => (i * 0.618) % 1),
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

  /* ⚠ A `ShaderMaterial`, never `PointsMaterial` (a hard opaque square
     without a map — ADR-080's "particles too thick"). */
  const moteMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: holoMoteVertexShader,
        fragmentShader: holoMoteFragmentShader,
        uniforms: {
          uPointSize: { value: palette.additive ? 6.6 : 6 },
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
          /* ⚠ THE DUST IS THE STRUCTURE'S TONE: gold is the flow's alone. */
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
      for (const l of segLayers) l.geometry.dispose();
      thought.g.dispose();
      floor.dispose();
      flow.dispose();
      dust.dispose();
      moteMat.dispose();
      dustMat.dispose();
    },
    [segLayers, thought, floor, flow, dust, moteMat, dustMat]
  );

  /* ── Refs the frame writes through ─────────────────────────────────── */
  const segRefs = useRef<Record<string, THREE.LineSegments | null>>({});
  const lineRefs = useRef<Record<string, ComponentRef<typeof Line> | null>>({});
  const thoughtRef = useRef<THREE.LineSegments>(null);
  const floorRef = useRef<THREE.LineSegments>(null);
  const gateSpinRef = useRef<THREE.Group>(null);
  const gateArcRef = useRef<ComponentRef<typeof Line>>(null);
  const cradleSpinRef = useRef<THREE.Group>(null);
  const cradleArcRef = useRef<ComponentRef<typeof Line>>(null);
  const flowRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);

  /* ⚠ EVERY PER-FRAME WRITE GOES THROUGH A REF (the stage scene's own rule):
     the compiler's immutability rule reads a write to a memoised object as a
     mutation of a hook argument, and the lint ratchet has no headroom. */
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
    /* The life runs only once armed, and holds still for the lab's frame. */
    if (armed && !still) clock.current += dt;
    const t = clock.current;
    if (still) progress.current = 1;
    else if (armed && progress.current < 1) {
      progress.current = Math.min(1, progress.current + (dt * 1000) / INTRO_MS);
    }
    const p = progress.current;
    const dpr = viewport.dpr;
    const motes = flowRef.current;
    const motesMat = motes?.material as THREE.ShaderMaterial | undefined;
    const dustMatLive = dustRef.current?.material as THREE.ShaderMaterial | undefined;
    if (motesMat) motesMat.uniforms.uPixelRatio.value = dpr;
    if (dustMatLive) dustMatLive.uniforms.uPixelRatio.value = dpr;

    const floorR = smootherstep(0, 0.25, p);
    if (floorRef.current) {
      (floorRef.current.material as THREE.LineBasicMaterial).opacity = floorR;
      floorRef.current.visible = floorR > 0.001;
    }

    /* The thought draws on, then drifts: its outline is rewritten in place. */
    const th = thoughtRef.current;
    if (th) {
      const attr = th.geometry.attributes.position as THREE.BufferAttribute;
      if (t > 0) {
        fillThoughtSegments(t, attr.array as Float32Array);
        attr.needsUpdate = true;
      }
      const tr = smootherstep(0.02, 0.42, p);
      th.geometry.setDrawRange(0, Math.floor((tr * thought.count) / 2) * 2);
      th.visible = tr > 0.001;
    }

    for (const l of segLayers) {
      const seg = segRefs.current[l.id];
      if (!seg) continue;
      const v = smootherstep(l.reveal[0], l.reveal[1], p);
      seg.geometry.setDrawRange(0, Math.floor((v * l.count) / 2) * 2);
      seg.visible = v > 0.001;
    }
    for (const l of lineLayers) {
      const line = lineRefs.current[l.id];
      if (!line) continue;
      const v = smootherstep(l.reveal[0], l.reveal[1], p);
      if (l.fade) {
        line.material.opacity = l.opacity * v;
      } else {
        line.geometry.instanceCount = Math.max(0, Math.ceil(v * (l.points.length - 1)));
      }
      line.visible = v > 0.001;
    }

    /* The two highlights glide; neither changes its brightness. */
    if (gateSpinRef.current) {
      gateSpinRef.current.rotation.x = EQ_GATE.arc.start * RAD + t * EQ_GATE.arc.speed;
    }
    if (gateArcRef.current) {
      const v = smootherstep(0.66, 0.85, p);
      gateArcRef.current.material.opacity = v;
      gateArcRef.current.visible = v > 0.001;
    }
    if (cradleSpinRef.current) {
      cradleSpinRef.current.rotation.z = EQ_CRADLE.bright.from * RAD - t * 0.035;
    }
    if (cradleArcRef.current) {
      const v = smootherstep(0.5, 0.7, p);
      cradleArcRef.current.material.opacity = v;
      cradleArcRef.current.visible = v > 0.001;
    }

    /* The flow: through the thought, down the axis, down the stack. */
    const moteR = smootherstep(0.82, 1, p);
    if (motes) {
      const pos = motes.geometry.attributes.position as THREE.BufferAttribute;
      const fade = motes.geometry.attributes.aFade as THREE.BufferAttribute;
      for (let i = 0; i < EQ_FLOW.count; i++) {
        const m = flowPoint(t + (i / EQ_FLOW.count) * FLOW_PERIOD, i);
        pos.setXYZ(i, m.p[0], m.p[1], m.p[2]);
        fade.setX(i, m.fade);
      }
      pos.needsUpdate = true;
      fade.needsUpdate = true;
      motes.visible = moteR > 0.001;
    }
    if (motesMat) motesMat.uniforms.uOpacity.value = moteR * (palette.additive ? 0.95 : 1);
    if (dustMatLive) {
      dustMatLive.uniforms.uOpacity.value = smootherstep(0.1, 0.5, p) * 0.3 * palette.dustScale;
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

  const lineMat = { transparent: true, depthWrite: false } as const;

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
      <points ref={dustRef} geometry={dust} material={dustMat} />

      <lineSegments ref={thoughtRef} geometry={thought.g}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.92}
          depthWrite={false}
          blending={blend}
        />
      </lineSegments>

      {segLayers.map((l) => (
        <lineSegments
          key={l.id}
          ref={(el) => {
            segRefs.current[l.id] = el;
          }}
          geometry={l.geometry}
        >
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={l.opacity}
            depthWrite={false}
            blending={blend}
          />
        </lineSegments>
      ))}

      {lineLayers.map((l) => (
        <Line
          key={l.id}
          ref={(el) => {
            lineRefs.current[l.id] = el;
          }}
          points={l.points as [number, number, number][]}
          {...(l.colors ? { vertexColors: l.colors } : { color: l.color })}
          lineWidth={l.width}
          opacity={l.fade ? 0 : l.opacity}
          toneMapped={false}
          {...lineMat}
        />
      ))}

      <group ref={gateSpinRef}>
        <Line
          ref={gateArcRef}
          points={gateArcPts as [number, number, number][]}
          color={C.goldHot}
          lineWidth={2.6}
          opacity={0}
          toneMapped={false}
          {...lineMat}
        />
      </group>
      <group matrixAutoUpdate={false} matrix={cradle.matrix}>
        <group ref={cradleSpinRef}>
          <Line
            ref={cradleArcRef}
            points={cradle.pts as [number, number, number][]}
            color={C.bright}
            lineWidth={2.4}
            opacity={0}
            toneMapped={false}
            {...lineMat}
          />
        </group>
      </group>

      <points ref={flowRef} geometry={flow} material={moteMat} />
    </group>
  );
}
