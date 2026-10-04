"use client";

/**
 * HoloRiverScene — the opener's second figure (ADR-143 U9): a river of data
 * through an isolated diorama. Contoured high ground upstream, a gate where
 * the valley opens, a plain ruled into plots downstream with four straight
 * channels out through the cut face, the block floating over its shadow.
 * Every number is `equilibriumRiverGeom.ts`'s, which the static drawing is
 * projected from too.
 *
 * ⚠ THE ADR-080 IDIOM, as `HoloEquilibriumScene`: drei `Line` for the water
 * and the gate, drawn on through `instanceCount`; `LineSegments` for the
 * block, the contours and the plots, drawn on through `drawRange`; the shared
 * soft-point shader for the motes.
 *
 * ⚠ NOTHING FLICKERS (ADR-097 U12): the arrival draws the land on from the
 * source down, the water traces after it, and from then on the only motion is
 * the data travelling. No brightness ever pulses.
 *
 * ⚠ A FADE IS TOWARD THE GROUND, NEVER TOWARD BLACK, ON PAPER.
 */

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ComponentRef, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { AnchorChannel } from "@/components/holo-stage/stageAnchors";

import type { P3 } from "./eqCamera";
import {
  channelLines,
  contourLines,
  faceLines,
  FLOW,
  flowAt,
  flowRoutes,
  gateDetail,
  gateFrame,
  gateMarker,
  gateOuter,
  gateSill,
  gateStalk,
  mainLine,
  outletNotches,
  plinthTicks,
  plotLines,
  RIVER_ANCHORS,
  RIVER_CAMERA,
  reticleLines,
  rimLoop,
  riverCameraBasis,
  shadowLoop,
  sourceStalk,
  tributaryLines,
} from "./equilibriumRiverGeom";
import { holoMoteFragmentShader, holoMoteVertexShader } from "./holoDustShader";
import type { HoloPalette } from "./holoPalette";

/** The arrival, ms: the block, the land from the source down, the water, the
 *  gate, the plain, then the data. */
const INTRO_MS = 3200;

function smootherstep(a: number, b: number, x: number): number {
  if (b <= a) return x >= b ? 1 : 0;
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** A polyline as segment pairs. */
function pairs(points: readonly P3[]): P3[] {
  const out: P3[] = [];
  for (let i = 0; i + 1 < points.length; i++) out.push(points[i], points[i + 1]);
  return out;
}

/** A closed loop cut into a dashed run (every other pair). */
function dashedLoop(points: readonly P3[], per = 0.12): P3[] {
  const out: P3[] = [];
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i];
    const b = points[i + 1];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const n = Math.max(1, Math.round(l / per));
    for (let k = 0; k < n; k++) {
      const t0 = k / n;
      const t1 = (k + 0.5) / n;
      out.push(
        [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0, a[2] + (b[2] - a[2]) * t0],
        [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1, a[2] + (b[2] - a[2]) * t1]
      );
    }
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
  fade?: boolean;
}

export interface HoloRiverSceneProps {
  palette: HoloPalette;
  armed: boolean;
  still?: boolean;
  onReady?: () => void;
  channel: AnchorChannel;
  /** Where the eye is (azimuth, elevation, degrees), reported every frame
   *  for the bearing readout. */
  onView?: (azDeg: number, elDeg: number) => void;
}

export function HoloRiverScene({
  palette,
  armed,
  still = false,
  onReady,
  channel,
  onView,
}: HoloRiverSceneProps) {
  const { invalidate, camera, viewport } = useThree();

  const blend = palette.additive ? THREE.AdditiveBlending : THREE.NormalBlending;
  const C = useMemo(() => {
    const structure = new THREE.Color(palette.structure);
    const gold = new THREE.Color(palette.gold);
    return {
      structure,
      gold,
      grid: new THREE.Color(palette.grid),
      bright: palette.additive ? structure.clone().multiplyScalar(1.7) : structure.clone(),
      goldHot: palette.additive ? gold.clone().multiplyScalar(2.2) : gold.clone(),
      fadeTo: palette.additive ? new THREE.Color(0, 0, 0) : new THREE.Color(palette.ground),
    };
  }, [palette]);

  /* Near bright, far receding, baked at the rest pose. */
  const shade = useMemo(() => {
    const cam = riverCameraBasis();
    const centre = RIVER_CAMERA.distance;
    const near = palette.additive ? 0.3 : 0.46;
    return (p: P3, base: THREE.Color, k = 1): [number, number, number] => {
      const d =
        (p[0] - cam.eye[0]) * cam.fwd[0] +
        (p[1] - cam.eye[1]) * cam.fwd[1] +
        (p[2] - cam.eye[2]) * cam.fwd[2];
      const front = Math.min(1, Math.max(0, 0.55 - (d - centre) / 6.5));
      const c = C.fadeTo.clone().lerp(base, (near + (1 - near) * front) * k);
      return [c.r, c.g, c.b];
    };
  }, [C, palette.additive]);

  /* ── The dry layers ───────────────────────────────────────────────── */
  const segLayers = useMemo<SegLayer[]>(() => {
    const make = (
      id: string,
      pts: readonly P3[],
      reveal: readonly [number, number],
      opacity: number,
      k = 1,
      base: THREE.Color = C.structure
    ): SegLayer => {
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
      g.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(
          pts.flatMap((p) => shade(p, base, k)),
          3
        )
      );
      return { id, geometry: g, count: pts.length, reveal, opacity };
    };
    const faces = faceLines();
    return [
      make("shadow", dashedLoop(shadowLoop()), [0, 0.24], 0.5, 0.45, C.grid),
      make("edges", faces.edges, [0, 0.22], 0.9, 0.8),
      make("rim", pairs(rimLoop()), [0.02, 0.3], 0.95, 0.9),
      make("strata", faces.strata, [0.06, 0.32], 0.7, 0.42),
      make("plinth", plinthTicks(), [0.1, 0.3], 0.8, 0.55),
      /* Upstream first: the land draws on from the source down. */
      make(
        "contours",
        contourLines().flatMap((l) => pairs(l)),
        [0.12, 0.56],
        0.85,
        0.66
      ),
      make("plots", plotLines(), [0.46, 0.64], 0.8, 0.48),
      make("outlets", outletNotches(), [0.72, 0.82], 0.9, 0.85),
      make("gate-detail", gateDetail(), [0.56, 0.72], 0.9, 0.85),
      make("stalks", [...gateStalk(), ...sourceStalk()], [0.62, 0.78], 0.8, 0.75),
      make(
        "reticle",
        reticleLines().flatMap((l) => pairs(l)),
        [0.66, 0.8],
        0.95,
        0.95
      ),
    ];
  }, [C, shade]);

  const lineLayers = useMemo<LineLayer[]>(() => {
    const cols = (pts: P3[], base: THREE.Color, k = 1) => pts.map((p) => shade(p, base, k));
    const out: LineLayer[] = [];
    tributaryLines().forEach((pts, k) =>
      out.push({
        id: `trib-${k}`,
        points: pts,
        colors: cols(pts, C.gold, 0.85),
        width: 1,
        reveal: [0.42 + k * 0.03, 0.62 + k * 0.03],
        opacity: 0.85,
      })
    );
    const main = mainLine();
    out.push({
      id: "main",
      points: main,
      colors: cols(main, C.gold),
      width: 1.7,
      reveal: [0.44, 0.74],
      opacity: 1,
    });
    channelLines().forEach((pts, k) =>
      out.push({
        id: `channel-${k}`,
        points: pts,
        colors: cols(pts, C.gold),
        width: 1.35,
        reveal: [0.72 + k * 0.02, 0.9 + k * 0.02],
        opacity: 1,
      })
    );
    out.push({
      id: "gate",
      points: gateFrame(),
      color: C.bright,
      width: 1.3,
      reveal: [0.56, 0.7],
      opacity: 1,
    });
    out.push({
      id: "gate-outer",
      points: gateOuter(),
      colors: cols(gateOuter(), C.structure),
      width: 1,
      reveal: [0.58, 0.72],
      opacity: 0.95,
    });
    out.push({
      id: "sill",
      points: gateSill(),
      color: C.goldHot,
      width: 2.6,
      reveal: [0.7, 0.8],
      opacity: 1,
      fade: true,
    });
    out.push({
      id: "marker",
      points: gateMarker(),
      color: C.bright,
      width: 1.3,
      reveal: [0.72, 0.82],
      opacity: 1,
      fade: true,
    });
    return out;
  }, [C, shade]);

  /* ── The data ─────────────────────────────────────────────────────── */
  const routes = useMemo(() => flowRoutes(), []);
  const moteCount = routes.length * FLOW.perRoute;
  const flow = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(new Array(moteCount * 3).fill(0), 3)
    );
    g.setAttribute("aFade", new THREE.Float32BufferAttribute(new Array(moteCount).fill(0), 1));
    g.setAttribute(
      "aRand",
      new THREE.Float32BufferAttribute(
        Array.from({ length: moteCount }, (_, i) => (i * 0.618) % 1),
        1
      )
    );
    return g;
  }, [moteCount]);

  const moteMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: holoMoteVertexShader,
        fragmentShader: holoMoteFragmentShader,
        uniforms: {
          uPointSize: { value: palette.additive ? 6.2 : 5.6 },
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

  useEffect(
    () => () => {
      for (const l of segLayers) l.geometry.dispose();
      flow.dispose();
      moteMat.dispose();
    },
    [segLayers, flow, moteMat]
  );

  /* ── Refs the frame writes through ─────────────────────────────────── */
  const segRefs = useRef<Record<string, THREE.LineSegments | null>>({});
  const lineRefs = useRef<Record<string, ComponentRef<typeof Line> | null>>({});
  const flowRef = useRef<THREE.Points>(null);
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
    if (armed && !still) clock.current += dt;
    const t = clock.current;
    if (still) progress.current = 1;
    else if (armed && progress.current < 1) {
      progress.current = Math.min(1, progress.current + (dt * 1000) / INTRO_MS);
    }
    const p = progress.current;

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
      if (l.fade) line.material.opacity = l.opacity * v;
      else line.geometry.instanceCount = Math.max(0, Math.ceil(v * (l.points.length - 1)));
      line.visible = v > 0.001;
    }

    /* The data: down every course, slow on the meanders, steady after the gate. */
    const motes = flowRef.current;
    const mat = motes?.material as THREE.ShaderMaterial | undefined;
    const moteR = smootherstep(0.84, 1, p);
    if (motes) {
      const pos = motes.geometry.attributes.position as THREE.BufferAttribute;
      const fade = motes.geometry.attributes.aFade as THREE.BufferAttribute;
      let i = 0;
      for (const r of routes) {
        for (let k = 0; k < FLOW.perRoute; k++, i++) {
          const m = flowAt(r, t + (k / FLOW.perRoute) * r.period);
          pos.setXYZ(i, m.p[0], m.p[1], m.p[2]);
          fade.setX(i, m.fade);
        }
      }
      pos.needsUpdate = true;
      fade.needsUpdate = true;
      motes.visible = moteR > 0.001;
    }
    if (mat) {
      mat.uniforms.uPixelRatio.value = viewport.dpr;
      mat.uniforms.uOpacity.value = moteR * (palette.additive ? 0.95 : 1);
    }

    channel.publish(
      (Object.keys(RIVER_ANCHORS) as (keyof typeof RIVER_ANCHORS)[]).map((id) => {
        const v = scratch.current.set(...RIVER_ANCHORS[id]).project(camera);
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
      onView((Math.atan2(c.x, c.z) * 180) / Math.PI, (Math.asin(c.y / len) * 180) / Math.PI);
    }

    if (!ready.current) {
      ready.current = true;
      onReady?.();
    }
    if (armed && p < 1) invalidate();
  });

  const lineMat = { transparent: true, depthWrite: false } as const;

  return (
    <group>
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
      <points ref={flowRef} geometry={flow} material={moteMat} />
    </group>
  );
}
