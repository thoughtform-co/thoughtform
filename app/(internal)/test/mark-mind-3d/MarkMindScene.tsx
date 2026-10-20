"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironmentRig } from "@/components/brand/Brandmark3D";
import { CROSSING, DEPTH, INNER, LEVEL, SLANT, markSolid } from "./markSolid";

export type Theme = "dark" | "light";

const TONES = {
  dark: { ground: "#0a0908", gold: "#caa554", metal: "#d9b25e", ink: "#ebe3d6", green: "#7a9e6a", lit: "#ffe7a8" },
  light: { ground: "#efe9dc", gold: "#8a6b20", metal: "#b38a35", ink: "#2a2214", green: "#466c3a", lit: "#c88a1c" },
} as const;

/** One turn of the flywheel, seconds. */
const TURN = 80;
/** The stacked layers of the mind, behind and in front of the face. */
const LAYERS = 7;
/** The layers run from just in front of the face back into the ring's depth. */
const FRONT = -0.07;
const BACK = -1.05;

/* ───────────────────────────────────────────── the mind: the particle field

   One square-dot lattice over the disc, repeated in layers through the mark.
   The whole field turns clockwise (the flywheel); each dot decides on the GPU
   which side of the slanted bar it is on now: the people's side sparse, bone,
   a few green; the machine's side dense, gold. Crossing the slanted bar it
   flares and changes colour; the level bar and the ring are kept clear. */

const FIELD_VERT = /* glsl */ `
  attribute vec2 aPolar;   // r, angle at rest
  attribute float aLayer;  // 0..1 through the stack
  attribute float aHash;
  uniform float uTime;
  uniform float uTurn;
  uniform float uSize;
  uniform float uPR;
  uniform vec2 uA;
  uniform vec2 uN;
  uniform float uHalf;
  uniform float uLevelMid;
  uniform float uLevelHalf;
  uniform float uInner;
  uniform vec3 uInk;
  uniform vec3 uGold;
  uniform vec3 uGreen;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float phi = aPolar.y - uTime * 6.2831853 / uTurn;
    vec2 p = aPolar.x * vec2(cos(phi), sin(phi));
    float sd = dot(p - uA, uN);
    float machine = step(0.0, sd);
    float inSlant = 1.0 - smoothstep(uHalf * 0.9, uHalf * 1.25, abs(sd));
    float inLevel = 1.0 - smoothstep(uLevelHalf * 0.9, uLevelHalf * 1.4, abs(p.y - uLevelMid));
    float rim = 1.0 - smoothstep(uInner - 0.05, uInner, aPolar.x);

    // density: people sparse, machine dense; floors every other layer
    float floorLayer = step(0.5, fract(aLayer * 4.0 + 0.25));
    float keepPeople = step(aHash, 0.30) * mix(0.25, 1.0, floorLayer);
    float keepMachine = step(aHash, 0.78);
    float keep = mix(keepPeople, keepMachine, machine);

    vec3 people = mix(uInk, uGreen, step(aHash, 0.035));
    vec3 col = mix(people, uGold, machine);
    // in the slanted bar: the crossing, bone into gold across it
    float across = clamp((sd + uHalf) / (2.0 * uHalf), 0.0, 1.0);
    col = mix(col, mix(uInk, uGold, across), inSlant);
    float flare = inSlant * step(aHash, 0.5);

    float depthFade = 1.0 - aLayer * 0.72;
    vAlpha = (keep * (1.0 - inSlant) + flare) * (1.0 - inLevel) * rim * depthFade;
    vColor = col;

    vec3 pos = vec3(p, ${FRONT.toFixed(3)} + aLayer * ${(BACK - FRONT).toFixed(3)});
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = uSize * (1.0 + flare * 0.8);
    gl_PointSize = vAlpha > 0.001 ? size * uPR / -mv.z : 0.0;
  }
`;

const FIELD_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    // square dots, the swarm's own
    gl_FragColor = vec4(vColor, vAlpha);
  }
`;

function Mind({ theme }: { theme: Theme }) {
  const clockOf = useClock();
  const T = TONES[theme];
  const pr = useThree((s) => s.viewport.dpr);
  const { geometry, material } = useMemo(() => {
    const STEP = 0.042;
    const polar: number[] = [];
    const layer: number[] = [];
    const hash: number[] = [];
    let n = 0;
    for (let l = 0; l < LAYERS; l++) {
      for (let i = -30; i <= 30; i++) {
        for (let j = -30; j <= 30; j++) {
          // each layer's grid turned by the golden angle, so the stacked
          // grids never line up into spokes
          const x = i * STEP;
          const y = j * STEP;
          const r = Math.hypot(x, y);
          if (r > INNER) continue;
          polar.push(r, Math.atan2(y, x) + l * 2.39996);
          layer.push(l / (LAYERS - 1));
          hash.push(Math.abs(Math.sin(++n * 12.9898) * 43758.5453) % 1);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(layer.length * 3), 3));
    g.setAttribute("aPolar", new THREE.Float32BufferAttribute(polar, 2));
    g.setAttribute("aLayer", new THREE.Float32BufferAttribute(layer, 1));
    g.setAttribute("aHash", new THREE.Float32BufferAttribute(hash, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.2);
    const m = new THREE.ShaderMaterial({
      vertexShader: FIELD_VERT,
      fragmentShader: FIELD_FRAG,
      transparent: true,
      depthWrite: false,
      blending: theme === "dark" ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uTurn: { value: TURN },
        uSize: { value: 15 },
        uPR: { value: 1 },
        uA: { value: new THREE.Vector2(...SLANT.a) },
        uN: { value: new THREE.Vector2(...SLANT.normal) },
        uHalf: { value: SLANT.half },
        uLevelMid: { value: LEVEL.mid },
        uLevelHalf: { value: LEVEL.half },
        uInner: { value: INNER },
        uInk: { value: new THREE.Color(T.ink) },
        uGold: { value: new THREE.Color(T.gold) },
        uGreen: { value: new THREE.Color(T.green) },
      },
    });
    return { geometry: g, material: m };
  }, [theme, T]);
  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material]);
  useFrame((state) => {
    material.uniforms.uTime!.value = clockOf(state);
    material.uniforms.uPR!.value = pr;
  });
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

/** Each layer's edge as a faint ring, so the stack reads as plates. */
function LayerRings({ theme }: { theme: Theme }) {
  const T = TONES[theme];
  const geometry = useMemo(() => {
    const pts: number[] = [];
    for (let l = 0; l < LAYERS; l++) {
      const z = FRONT + (l / (LAYERS - 1)) * (BACK - FRONT);
      for (let i = 0; i < 128; i++) {
        const a0 = (i / 128) * Math.PI * 2;
        const a1 = ((i + 1) / 128) * Math.PI * 2;
        pts.push(Math.cos(a0) * INNER, Math.sin(a0) * INNER, z, Math.cos(a1) * INNER, Math.sin(a1) * INNER, z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={T.ink} transparent opacity={theme === "dark" ? 0.16 : 0.22} depthWrite={false} />
    </lineSegments>
  );
}

/* ─────────────────────────────── the flywheel: light running round the ring */

function RingLight({ theme }: { theme: Theme }) {
  const clockOf = useClock();
  const T = TONES[theme];
  const pr = useThree((s) => s.viewport.dpr);
  const COUNT = 260;
  const { geometry, material } = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const seed = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) seed[i] = i / COUNT;
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(COUNT * 3), 3));
    g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.3);
    const m = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime;
        uniform float uPR;
        uniform vec3 uInk;
        uniform vec3 uGold;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float phi = aSeed * 6.2831853 - uTime * 6.2831853 / ${(TURN / 4).toFixed(1)};
          float r = 0.93 - 0.035 * cos(phi - 3.8327);
          vec3 pos = vec3(r * cos(phi), r * sin(phi), ${(DEPTH / 2 + 0.02).toFixed(3)});
          // a comet: a few bright heads, faint between
          float head = pow(fract(aSeed * 7.0 - uTime * 0.05), 6.0);
          vAlpha = 0.15 + 0.85 * head;
          vColor = mix(uInk, uGold, step(0.0, pos.x + 0.04));
          vec4 mv = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (9.0 + head * 16.0) * uPR / -mv.z;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vAlpha;
        void main() { gl_FragColor = vec4(vColor, vAlpha); }
      `,
      transparent: true,
      depthWrite: false,
      blending: theme === "dark" ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uTime: { value: 0 }, uPR: { value: 1 }, uInk: { value: new THREE.Color(T.ink) }, uGold: { value: new THREE.Color(T.lit) } },
    });
    return { geometry: g, material: m };
  }, [theme, T]);
  useEffect(() => () => (geometry.dispose(), material.dispose()), [geometry, material]);
  useFrame((state) => {
    material.uniforms.uTime!.value = clockOf(state);
    material.uniforms.uPR!.value = pr;
  });
  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

/* ──────────────────────────────────────────────────── the mark and the core */

function Mark({ theme }: { theme: Theme }) {
  const T = TONES[theme];
  const geometry = useMemo(() => markSolid(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial color={T.metal} metalness={1} roughness={0.34} clearcoat={0.25} clearcoatRoughness={0.4} envMapIntensity={theme === "dark" ? 0.85 : 1} />
    </mesh>
  );
}

function Core({ theme }: { theme: Theme }) {
  const clockOf = useClock();
  const T = TONES[theme];
  const glow = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    const b = 0.85 + 0.15 * Math.sin(clockOf(state) * 1.3);
    if (glow.current) glow.current.scale.setScalar(b);
    if (light.current) light.current.intensity = 1.6 * b;
  });
  const z = DEPTH / 2 + 0.03;
  return (
    <group position={[CROSSING[0], CROSSING[1], z]}>
      <pointLight ref={light} color={T.lit} distance={1.4} decay={2} />
      <mesh ref={glow}>
        <sphereGeometry args={[0.022, 24, 24]} />
        <meshBasicMaterial color={theme === "dark" ? "#fff4d6" : T.lit} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ───────────────────────────────────────────────────────────────── stage */

/** The clock, or the moment it is frozen at (a still, or reduced motion). */
const Frozen = createContext<number | undefined>(undefined);
function useClock() {
  const frozen = useContext(Frozen);
  return (state: { clock: THREE.Clock }) => frozen ?? state.clock.getElapsedTime();
}

function useSway(still: boolean) {
  const clockOf = useClock();
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = clockOf(state);
    if (!group.current) return;
    // three-quarter view, a slow sway so the depth keeps reading
    group.current.rotation.y = -0.62 + (still ? 0 : 0.12 * Math.sin(t * 0.21));
    group.current.rotation.x = -0.12 + (still ? 0 : 0.04 * Math.sin(t * 0.17));
    group.current.position.z = 0.35;
  });
  return group;
}

function Scene({ theme, still, onReady }: { theme: Theme; still: boolean; onReady: () => void }) {
  const group = useSway(still);
  const ready = useRef(false);
  useFrame(() => {
    if (!ready.current) {
      ready.current = true;
      requestAnimationFrame(onReady);
    }
  });
  return (
    <>
      <RoomEnvironmentRig intensity={theme === "dark" ? 0.9 : 1.1} />
      <ambientLight intensity={theme === "dark" ? 0.15 : 0.5} />
      <directionalLight position={[-2, 3, 4]} intensity={theme === "dark" ? 1.4 : 1.2} />
      <group ref={group}>
        <Mind theme={theme} />
        <LayerRings theme={theme} />
        <Mark theme={theme} />
        <RingLight theme={theme} />
        <Core theme={theme} />
      </group>
      {theme === "dark" ? (
        <EffectComposer>
          <Bloom mipmapBlur luminanceThreshold={0.62} luminanceSmoothing={0.2} intensity={0.9} radius={0.6} />
        </EffectComposer>
      ) : null}
    </>
  );
}

/**
 * The mark is the mind, in 3D: the brand mark as a gold solid, the mind
 * inside it as the swarm's square dots in stacked layers, people on the left
 * of the slanted bar, machine on the right, the field turning clockwise like
 * a flywheel, crossing the bar from one into the other; light running round
 * the ring; the crossing the one lit point. `t` freezes the clock for a still.
 */
export function MarkMindScene({ theme, still, t }: { theme: Theme; still: boolean; t?: number }) {
  const [ready, setReady] = useState(false);
  const [reduced] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const frozenAt = t ?? (reduced ? 0 : undefined);
  return (
    <div data-mark-mind-3d="" data-ready={ready ? "" : undefined} style={{ position: "absolute", inset: 0 }}>
      <Canvas
        dpr={[1, 1.75]}
        frameloop={still || frozenAt !== undefined ? "demand" : "always"}
        camera={{ position: [0, 0.35, 5.6], fov: 30, near: 0.1, far: 50 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = theme === "dark" ? 1.05 : 1.2;
          scene.background = new THREE.Color(TONES[theme].ground);
        }}
        style={{ background: TONES[theme].ground }}
      >
        <Frozen.Provider value={frozenAt}>
          <Scene theme={theme} still={still} onReady={() => setReady(true)} />
        </Frozen.Provider>
      </Canvas>
    </div>
  );
}

