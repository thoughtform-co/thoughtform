"use client";

/**
 * HoloEquilibriumScene — the workshop opener's holographic object (ADR-143
 * U8, U10).
 *
 * One instrument on one axis, read left to right: THOUGHT, holo.ui8's crumpled
 * contour mass in its graduated cradle, alive (its outline drifts); ENCODE,
 * ADR-080's plated collar in gold with the Thoughtform brandmark seated in it,
 * reading level on its fulcrum; FORM, ADR-080's coaxial stack of toothed rings
 * at one pitch, receding. Gold motes drift through the thought, find the axis
 * as it calms, pass through the mark and run down the stack at one rhythm.
 * Every number is `equilibriumGeom.ts`'s, which the static drawing is
 * projected from too.
 *
 * ⚠ IT TURNS ALL THE WAY ROUND (U10), SO DEPTH IS FOG, NEVER BAKED. A shade
 * baked at the rest pose dims the far side for good; turned half round, the
 * near side would be the dim one. Linear fog toward the ground fades whatever
 * is far from the eye NOW, from any side. drei's fat lines carry fog's code
 * but leave it off: every `Line` passes `fog`.
 *
 * ⚠ THE ADR-080 IDIOM (`HoloProgramScene`): drei `Line` for the rings and the
 * bright arcs, drawn on through `instanceCount`; `LineSegments` for slices,
 * teeth, plates and the floor, drawn on through `drawRange`; soft-point
 * shaders for the motes, the dust and the bokeh.
 *
 * ⚠ NOTHING FLICKERS (ADR-097 U12). No dropout, no breathing, no re-scan: the
 * object lives by motion alone — the thought's outline drifts, the two
 * highlights glide, the motes travel — and no brightness ever pulses. The
 * bokeh does not twinkle; it only parts as the object is turned.
 *
 * ⚠ A FADE IS TOWARD THE GROUND, NEVER TOWARD BLACK, ON PAPER: the fog's
 * colour and every tint mix toward `fadeTo`.
 */

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ComponentRef, Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { AnchorChannel } from "@/components/holo-stage/stageAnchors";
import { VolumetricBrandmarkArtifact } from "@/components/landing/home-v2/services/hologram/VolumetricBrandmarkArtifact";

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
  EQ_FLOOR,
  EQ_FLOW,
  EQ_GATE,
  EQ_MARK,
  EQ_STACK,
  eqBokeh,
  eqDust,
  fillThoughtSegments,
  floorSegments,
  flowPoint,
  FLOW_PERIOD,
  gateMarker,
  gatePlateSegments,
  levelBar,
  levelFulcrum,
  levelLit,
  markLines,
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

/** The arrival, ms, told left to right: the thought, its cradle, the gate and
 *  its mark, then the stack ring by ring, then the axis and the flow. */
const INTRO_MS = 3000;

const RAD = Math.PI / 180;

/** The volumetric mark's half-extent at `scale` 1: `sampleBrandmark3D` fits
 *  the larger of its width and height to `MARK_SCALE` 1.74. */
const MARK_NATIVE_HALF = 0.87;

/** Depth as fog, from the rest distance: nothing nearer than `near` fades,
 *  and the farthest ring is about half there at rest. */
const FOG = { near: EQ_CAMERA.distance - 3, far: EQ_CAMERA.distance + 11 } as const;

function smootherstep(a: number, b: number, x: number): number {
  if (b <= a) return x >= b ? 1 : 0;
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** The bokeh's disc: soft-edged, a touch brighter at the rim, as a lens
 *  renders an out-of-focus point. Sized per disc, softened with depth. */
const bokehVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 aColor;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = max(0.5, -mv.z);
    gl_PointSize = aSize * uPixelRatio * clamp(12.0 / dist, 0.55, 2.2);
  }
`;
const bokehFragmentShader = /* glsl */ `
  precision mediump float;
  uniform float uOpacity;
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    /* Out of focus, not a disc: a soft body with a faint brighter rim, gone
       well before the sprite's edge. */
    float body = exp(-d * d * 2.6);
    float rim = smoothstep(0.45, 0.72, d) * (1.0 - smoothstep(0.72, 0.98, d)) * 0.14;
    float a = (body * 0.55 + rim) * (1.0 - smoothstep(0.9, 1.0, d)) * vAlpha * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

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
  color: THREE.Color;
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
  /** Where the eye is (azimuth, elevation, degrees), reported every frame
   *  for the bearing readout. */
  onView?: (azDeg: number, elDeg: number) => void;
  /** On the page (ADR-143 U11): no floor, no dust of its own, no bokeh. The
   *  object and its gold motes are all that is drawn. */
  bare?: boolean;
}

export function HoloEquilibriumScene({
  palette,
  armed,
  still = false,
  onReady,
  channel,
  onView,
  bare = false,
}: HoloEquilibriumSceneProps) {
  const { invalidate, camera, viewport } = useThree();

  const blend = palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
  const C = useMemo(() => {
    const structure = new THREE.Color(palette.structure);
    const gold = new THREE.Color(palette.gold);
    const fadeTo = palette.additive ? new THREE.Color(0, 0, 0) : new THREE.Color(palette.ground);
    return {
      structure,
      gold,
      grid: new THREE.Color(palette.grid),
      /* On void the highlights run hot so bloom takes them; on paper nothing
         may be brighter than the paper, so they are full ink. */
      bright: palette.additive ? structure.clone().multiplyScalar(1.7) : structure.clone(),
      goldHot: palette.additive ? gold.clone().multiplyScalar(2.2) : gold.clone(),
      fadeTo,
      /** A tone `k` of the way from the ground to `base`. */
      tint: (base: THREE.Color, k: number) => fadeTo.clone().lerp(base, k),
    };
  }, [palette]);

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
      const c = C.tint(C.structure, k);
      g.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(
          pts.flatMap(() => [c.r, c.g, c.b]),
          3
        )
      );
      return { id, geometry: g, count: pts.length, reveal, opacity };
    };
    const out: SegLayer[] = [
      make("cradle-ticks", cradleTicks(), [0.3, 0.55], 0.75, 0.75),
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
    /* The mark's own outline, crisp and gold, the same lines the static
       drawing projects: the volumetric mark round it is its depth, and on
       its own it reads as a cloud of dashes rather than as the mark. */
    const mark = markLines().flatMap((l) => {
      const out2: P3[] = [];
      for (let i = 0; i + 1 < l.length; i++) out2.push(l[i], l[i + 1]);
      return out2;
    });
    const mg = new THREE.BufferGeometry();
    mg.setAttribute("position", new THREE.Float32BufferAttribute(mark.flat(), 3));
    const mc = palette.additive ? C.gold.clone().multiplyScalar(1.25) : C.gold;
    mg.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(
        mark.flatMap(() => [mc.r, mc.g, mc.b]),
        3
      )
    );
    out.push({ id: "mark", geometry: mg, count: mark.length, reveal: [0.46, 0.72], opacity: 1 });
    return out;
  }, [C, palette.additive]);

  const lineLayers = useMemo<LineLayer[]>(() => {
    const out: LineLayer[] = [];
    EQ_CRADLE.arcs.forEach(([from, to], k) => {
      out.push({
        id: `cradle-${k}`,
        points: cradleArc(EQ_CRADLE.r, from, to),
        color: C.tint(C.structure, 0.8),
        width: 1,
        reveal: [0.18 + k * 0.06, 0.5 + k * 0.06],
        opacity: 0.85,
      });
    });
    out.push({
      id: "gate-ring",
      points: axisRing(EQ_GATE.x, EQ_GATE.inner, 220),
      color: C.gold,
      width: 1.2,
      reveal: [0.34, 0.6],
      opacity: 0.95,
    });
    out.push({
      id: "gate-outer",
      points: axisRing(EQ_GATE.x, EQ_GATE.outer, 220),
      color: C.structure,
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
      color: C.structure,
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
      const a = 0.5 + i * 0.045;
      out.push({
        id: `stack-${i}`,
        points: axisRing(stackX(i), EQ_STACK.r, 140),
        color: C.structure,
        width: 1.05,
        reveal: [a, a + 0.16],
        opacity: 0.95,
      });
    }
    stackRails().forEach((l, k) =>
      out.push({
        id: `rail-${k}`,
        points: l.map((p) => [p[0], p[1], p[2]] as P3),
        color: C.tint(C.structure, 0.6),
        width: 0.9,
        reveal: [0.75, 0.9],
        opacity: 0.7,
      })
    );
    /* The axis, broken through the gate where the mark is. */
    out.push({
      id: "axis-in",
      points: [
        [EQ_AXIS.x0, 0, 0],
        [-EQ_AXIS.gap, 0, 0],
      ],
      color: C.gold,
      width: 1,
      reveal: [0.7, 0.8],
      opacity: 0.62,
    });
    out.push({
      id: "axis-out",
      points: [
        [EQ_AXIS.gap, 0, 0],
        [EQ_AXIS.x1, 0, 0],
      ],
      color: C.gold,
      width: 1,
      reveal: [0.76, 0.9],
      opacity: 0.62,
    });
    return out;
  }, [C]);

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
    const c = C.tint(C.structure, 0.88);
    for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
    const g = new THREE.BufferGeometry();
    const attr = new THREE.BufferAttribute(pos, 3);
    attr.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", attr);
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return { g, count: n };
  }, [C]);

  const floor = useMemo(() => {
    const pos: number[] = [];
    const col: number[] = [];
    for (const s of floorSegments()) {
      const c = C.tint(C.grid, EQ_FLOOR.alpha * s.fade * (palette.additive ? 1.1 : 1.4));
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

  const bokeh = useMemo(() => {
    const discs = eqBokeh();
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        discs.flatMap((d) => d.p),
        3
      )
    );
    g.setAttribute(
      "aSize",
      new THREE.Float32BufferAttribute(
        discs.map((d) => d.size),
        1
      )
    );
    g.setAttribute(
      "aAlpha",
      new THREE.Float32BufferAttribute(
        discs.map((d) => d.alpha),
        1
      )
    );
    g.setAttribute(
      "aColor",
      new THREE.Float32BufferAttribute(
        discs.flatMap((d) => {
          const c = d.gold ? C.gold : C.structure;
          return [c.r, c.g, c.b];
        }),
        3
      )
    );
    return g;
  }, [C]);

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
          uColor: {
            value: palette.additive ? C.gold.clone().multiplyScalar(1.6) : C.gold.clone(),
          },
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
          uPointSize: { value: 2.2 },
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
  const bokehMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: bokehVertexShader,
        fragmentShader: bokehFragmentShader,
        uniforms: { uPixelRatio: { value: 1 }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: blend,
      }),
    [blend]
  );

  useEffect(
    () => () => {
      for (const l of segLayers) l.geometry.dispose();
      thought.g.dispose();
      floor.dispose();
      flow.dispose();
      dust.dispose();
      bokeh.dispose();
      moteMat.dispose();
      dustMat.dispose();
      bokehMat.dispose();
    },
    [segLayers, thought, floor, flow, dust, bokeh, moteMat, dustMat, bokehMat]
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
  const markRef = useRef<THREE.Group>(null);
  const flowRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);
  const bokehRef = useRef<THREE.Points>(null);

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
    const bokehMatLive = bokehRef.current?.material as THREE.ShaderMaterial | undefined;
    if (motesMat) motesMat.uniforms.uPixelRatio.value = dpr;
    if (dustMatLive) dustMatLive.uniforms.uPixelRatio.value = dpr;
    if (bokehMatLive) bokehMatLive.uniforms.uPixelRatio.value = dpr;

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

    /* The mark settles into the gate: a scale, never a fade. */
    const markIn = smootherstep(0.46, 0.7, p);
    if (markRef.current) {
      markRef.current.visible = markIn > 0.01;
      markRef.current.scale.setScalar(0.94 + 0.06 * markIn);
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

    /* The axis, and the motes running down it. */
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
    const air = smootherstep(0.1, 0.5, p);
    if (dustMatLive) dustMatLive.uniforms.uOpacity.value = air * 0.34 * palette.dustScale;
    if (bokehMatLive) bokehMatLive.uniforms.uOpacity.value = air * (palette.additive ? 1 : 0.45);

    /* Where each word's point IS, and where the eye is. */
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
    if (onView) {
      const c = camera.position;
      const len = c.length() || 1;
      onView(Math.atan2(c.x, c.z) / RAD, Math.asin(c.y / len) / RAD);
    }

    if (!ready.current) {
      ready.current = true;
      onReady?.();
    }
    /* The arrival keeps itself drawing; the life after it is the canvas's
       on-screen pump, so an off-screen object costs nothing. */
    if (armed && p < 1) invalidate();
  });

  const lineMat = { transparent: true, depthWrite: false, fog: true } as const;

  return (
    <>
      <fog attach="fog" args={[C.fadeTo, FOG.near, FOG.far]} />
      <group>
        {bare ? null : (
          <>
            <points ref={bokehRef} geometry={bokeh} material={bokehMat} />
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
          </>
        )}

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
            color={l.color}
            lineWidth={l.width}
            opacity={l.fade ? 0 : l.opacity}
            toneMapped={false}
            {...lineMat}
          />
        ))}

        {/* ── ENCODE IS THE MARK (U10) ─────────────────────────────────────
            The corridor's volumetric brandmark, ADR-080's centre, seated in
            the gold gate and facing upstream (its own +z turned onto −x). The
            static drawing is the same mark's outline at the same size
            (`markLines`). ⚠ `entrance="off"`: nothing here couples to the
            corridor's scroll clock. */}
        <group
          ref={markRef}
          position={[EQ_GATE.x, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          visible={false}
        >
          <Suspense fallback={null}>
            <VolumetricBrandmarkArtifact
              flyIn={1}
              entrance="off"
              scale={EQ_MARK.half / MARK_NATIVE_HALF}
              wireCount={2200}
              surfaceCount={0}
              shellCount={0}
              depthStrutCount={0}
              scanGain={0}
              blending={palette.additive ? "additive" : "normal"}
              pointSize={3.4}
              opacity={palette.markOpacity * 0.6}
              wireStroke={0.075}
              color={`#${palette.mark.toString(16).padStart(6, "0")}`}
              accentColor={`#${palette.accent.toString(16).padStart(6, "0")}`}
            />
          </Suspense>
        </group>

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
    </>
  );
}
