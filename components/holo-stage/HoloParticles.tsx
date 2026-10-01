"use client";

/**
 * HoloParticles — paints a `StageParticleSpec` (ADR-140, round three).
 *
 * ONE `<points>` draw per figure, every population in it, fed by the GPGPU
 * simulation the corridor's brandmark core runs on
 * (`lib/key-visual/gpgpu-simulation`): curl flow, a return-to-home force and
 * turbulence, with the forces lerped from DISPERSED to SEATED over the
 * arrival — so the figure assembles out of dust exactly as the Arc sphere
 * does, and sits with the same faint physics once it has. Ordered
 * populations (a lattice, an edge) then seat EXACTLY on their homes; clouds
 * keep riding the sim and their own drift.
 *
 * ⚠ EVERY PER-FRAME WRITE GOES THROUGH A REF. The uniforms are reached via
 * the mesh ref's material and the sim lives in a ref filled by an effect,
 * because the compiler's immutability rule reads a write to a memoised
 * object as a mutation of a hook argument and the lint ratchet has no
 * headroom.
 *
 * ⚠ THE SIM NEEDS WEBGL2 and a float render target; the canvas host already
 * probes GL and falls back to the SVG without one. On a renderer that cannot
 * build the sim the points simply draw at their homes.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import type { HoloPalette } from "@/components/holo-program/holoPalette";
import { mulberry32 } from "@/components/arcs/framing/iso";
import { createParticleUVs, GPGPUParticleSimulation } from "@/lib/key-visual/gpgpu-simulation";
import { clamp01 } from "@/lib/math";

import { sweepAt, type StageSweep } from "./stageGeom";
import { stageParticleFragmentShader, stageParticleVertexShader } from "./stageParticleShader";
import { PARTICLE_ROLE_ID, PARTICLE_SHAPE_ID, type StageParticleSpec } from "./stageParticles";

/** The scene's clocks, written each frame by `HoloStageScene` and read here. */
export interface StageClock {
  p: number;
  t: number;
  groups: THREE.Vector4;
  front: number;
}

function smootherstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Forces at the two ends of the arrival, world units per second. The
 *  core's own pair, scaled to a stage ~12 units across. */
const DISPERSED = { returnStrength: 0.7, flowStrength: 0.12, turbulence: 0.55 };
const SEATED = { returnStrength: 10, flowStrength: 0.014, turbulence: 0.018 };

/** The assembly runs over this share of the intro clock, then the seat. */
const ASSEMBLE_END = 0.62;

/** How much brighter the lit population paints on dark: past the bloom
 *  threshold, into the white-hot core the references measure. */
const LIT_GAIN = 2.4;

export interface HoloParticlesProps {
  spec: StageParticleSpec;
  palette: HoloPalette;
  sweep?: StageSweep;
  groupNames: readonly string[];
  still: boolean;
  clock: { readonly current: StageClock };
}

export function HoloParticles({
  spec,
  palette,
  sweep,
  groupNames,
  still,
  clock,
}: HoloParticlesProps) {
  const gl = useThree((s) => s.gl);
  const viewport = useThree((s) => s.viewport);
  const pointsRef = useRef<THREE.Points>(null);
  const simRef = useRef<GPGPUParticleSimulation | null>(null);

  /* ── Buffers, built once per spec ──────────────────────────────────── */
  const buffers = useMemo(() => {
    const n = spec.populations.reduce((k, p) => k + p.points.length, 0);
    const ts = Math.max(2, 2 ** Math.ceil(Math.log2(Math.ceil(Math.sqrt(Math.max(1, n))))));
    const total = ts * ts;
    const home = new Float32Array(total * 3);
    const start = new Float32Array(total * 3);
    const meta0 = new Float32Array(total * 4);
    const meta1 = new Float32Array(total * 4);
    const meta2 = new Float32Array(total * 4);
    const reveal = new Float32Array(total * 2);
    const rnd = mulberry32(911 + n);
    const scatter = still ? 0 : spec.scatter;
    let i = 0;
    for (const pop of spec.populations) {
      const gi = pop.group ? groupNames.indexOf(pop.group) + 1 : 0;
      pop.points.forEach((pt, k) => {
        home[i * 3] = pt[0];
        home[i * 3 + 1] = pt[1];
        home[i * 3 + 2] = pt[2];
        /* The dispersed cloud: off the home in a random direction, most of
           the way out — a shell rather than a ball, so the assembly reads as
           dust gathering IN rather than a blur sharpening. */
        const u = rnd() * 2 - 1;
        const ph = rnd() * Math.PI * 2;
        const rr = Math.sqrt(Math.max(0, 1 - u * u));
        const dist = scatter * (0.45 + 0.55 * rnd());
        start[i * 3] = pt[0] + rr * Math.cos(ph) * dist;
        start[i * 3 + 1] = pt[1] + u * dist * 0.7;
        start[i * 3 + 2] = pt[2] + rr * Math.sin(ph) * dist;
        meta0[i * 4] = PARTICLE_ROLE_ID[pop.role];
        meta0[i * 4 + 1] = PARTICLE_SHAPE_ID[pop.shape];
        meta0[i * 4 + 2] = pop.size;
        meta0[i * 4 + 3] = pop.opacity;
        meta1[i * 4] = rnd();
        meta1[i * 4 + 1] = pop.angles?.[k] ?? 0;
        meta1[i * 4 + 2] = typeof pop.order === "number" ? pop.order : (pop.order?.[k] ?? 1);
        meta1[i * 4 + 3] = pop.drift ?? 0;
        meta2[i * 4] = gi;
        meta2[i * 4 + 1] = pop.lit ? 1 : 0;
        meta2[i * 4 + 2] = pop.twinkle ?? 0;
        meta2[i * 4 + 3] = pop.sizeVar ?? 0;
        reveal[i * 2] = pop.reveal[0];
        reveal[i * 2 + 1] = pop.reveal[1];
        i++;
      });
    }
    /* Padding texels: parked on the first home, drawn at size zero. */
    for (; i < total; i++) {
      home[i * 3] = home[0];
      home[i * 3 + 1] = home[1];
      home[i * 3 + 2] = home[2];
      start[i * 3] = home[0];
      start[i * 3 + 1] = home[1];
      start[i * 3 + 2] = home[2];
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(home, 3));
    geometry.setAttribute("aUV", new THREE.BufferAttribute(createParticleUVs(ts), 2));
    geometry.setAttribute("aMeta0", new THREE.BufferAttribute(meta0, 4));
    geometry.setAttribute("aMeta1", new THREE.BufferAttribute(meta1, 4));
    geometry.setAttribute("aMeta2", new THREE.BufferAttribute(meta2, 4));
    geometry.setAttribute("aReveal", new THREE.BufferAttribute(reveal, 2));
    geometry.computeBoundingSphere();
    return { geometry, home, start, total, ts };
  }, [spec, groupNames, still]);

  const material = useMemo(() => {
    const c = (hex: number) => new THREE.Color(hex);
    const m = new THREE.ShaderMaterial({
      vertexShader: stageParticleVertexShader,
      fragmentShader: stageParticleFragmentShader,
      uniforms: {
        uPositions: { value: null },
        uPixelRatio: { value: 1 },
        uSizeScale: { value: 1 },
        uProgress: { value: 0 },
        uGroups: { value: new THREE.Vector4() },
        uTime: { value: 0 },
        uSeat: { value: still ? 1 : 0 },
        uSweepOn: { value: !!sweep },
        uSweepAxis: { value: sweep?.axis ?? 0 },
        uSweep: { value: 0 },
        uSweepWidth: { value: sweep?.width ?? 1 },
        uRoleColors: {
          value: [
            c(palette.structure),
            c(palette.machine),
            c(palette.gold),
            c(palette.green),
            c(palette.grid),
            c(palette.accent),
          ],
        },
        uSweepColor: { value: c(palette.additive ? palette.accent : palette.gold) },
        uLitGain: { value: LIT_GAIN },
        uAlphaScale: { value: 1 },
        uAdditive: { value: palette.additive },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor,
      blendDst: palette.additive ? THREE.OneFactor : THREE.OneMinusSrcAlphaFactor,
      toneMapped: false,
    });
    return m;
  }, [palette, sweep, still]);

  /* The simulation, in a ref so the frame may drive it. */
  useEffect(() => {
    let sim: GPGPUParticleSimulation | null = null;
    try {
      sim = new GPGPUParticleSimulation({
        renderer: gl,
        particleCount: buffers.total,
        initialPositions: buffers.start,
        homePositions: buffers.home,
      });
    } catch {
      sim = null;
    }
    simRef.current = sim;
    return () => {
      sim?.dispose();
      if (simRef.current === sim) simRef.current = null;
    };
  }, [gl, buffers]);

  useEffect(
    () => () => {
      buffers.geometry.dispose();
      material.dispose();
    },
    [buffers, material]
  );

  const alphaScale = palette.additive ? palette.dustScale : palette.dustScale * 1.5;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const pts = pointsRef.current;
    if (!pts) return;
    const u = (pts.material as THREE.ShaderMaterial).uniforms;
    const { p, t, groups, front } = clock.current;

    /* The arrival's envelope: dispersed → seated. */
    const ignite = still ? 1 : smootherstep(0.0, ASSEMBLE_END, p);
    const sim = simRef.current;
    if (sim) {
      if (!still) {
        sim.updateUniforms({
          time: t,
          deltaTime: dt,
          flowStrength:
            DISPERSED.flowStrength + (SEATED.flowStrength - DISPERSED.flowStrength) * ignite,
          returnStrength:
            DISPERSED.returnStrength + (SEATED.returnStrength - DISPERSED.returnStrength) * ignite,
          turbulence: DISPERSED.turbulence + (SEATED.turbulence - DISPERSED.turbulence) * ignite,
          pointerStrength: 0,
        });
        sim.compute();
      }
      u.uPositions.value = sim.getPositionTexture();
    }
    u.uSeat.value = still ? 1 : smootherstep(0.7, 1, ignite);
    u.uProgress.value = p;
    (u.uGroups.value as THREE.Vector4).copy(groups);
    u.uTime.value = t;
    u.uPixelRatio.value = viewport.dpr;
    u.uSizeScale.value = 1;
    u.uAlphaScale.value = alphaScale;
    u.uSweepOn.value = !!sweep;
    if (sweep) {
      u.uSweep.value = still ? sweep.to + sweep.width * 4 : front || sweepAt(sweep, p);
      u.uSweepWidth.value = sweep.width;
    }
    /* No sim (no WebGL2 float targets): the homes stand in. */
    if (!sim) u.uSeat.value = 1;
  });

  return (
    <points ref={pointsRef} geometry={buffers.geometry} material={material} frustumCulled={false} />
  );
}
