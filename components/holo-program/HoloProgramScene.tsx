"use client";

/**
 * HoloProgramScene — the trajectory as a free 3D artifact.
 *
 * Seven dated waypoints are rings threaded down one axis; a ring's RADIUS is
 * the adoption reach at its date, so the flat board's step ladder and this
 * object encode ONE curve. Around them sit the seeded shells, the wireframe
 * core and the dust that make it a machine rather than a chart. The seat —
 * the terminus — is the single gold assembly.
 *
 * ⚠ ROUND 2. The reader ORBITS this object with real controls, and the DOM
 * labels follow it (`holoAnchorsRef`). Round 1 inverted that — it solved the
 * geometry to sit under fixed labels, which forced one pose, forbade drag,
 * and rendered every ring near edge-on.
 *
 * ⚠ IT IS ALIVE AT REST, by owner ruling (ADR-080 U1) and against ADR-021's
 * standing static-instrument law: breathe, flicker and twinkle run on a
 * wall clock. Scoped — only this object, only while on screen and visible,
 * and it never captures the wheel or moves the page.
 */

import { Line } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ComponentRef, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { VolumetricBrandmarkArtifact } from "@/components/landing/home-v2/services/hologram/VolumetricBrandmarkArtifact";
import {
  buildAxisPoints,
  buildDiamond,
  buildDust,
  buildGroundGrid,
  buildLadderPoints,
  buildPlatedRing,
  buildReticleField,
  buildRingPoints,
  buildShellDashes,
  buildTickField,
  buildWaypointArc,
  disposeAll,
  ringDepthColors,
} from "./holoProgramBuilders";
import { holoDustFragmentShader, holoDustVertexShader } from "./holoDustShader";
import {
  AXIS_HALF,
  BREATHE,
  BREATHE_HZ,
  FLICKER,
  HOLO_SEED,
  INTRO_MS,
  LW_MARK_RING,
  LW_RECORD,
  LW_SEAT,
  LW_SHELL,
  MARK_RING_RADIUS,
  MARK_SCALE,
  RING_SEGMENTS,
  SEAT_INNER_K,
  TWINKLE,
  anchorAngle,
  frontnessFromDepth,
  buildShells,
  mulberry32,
  ringRadius,
  ringReveal,
  waypointZ,
  type HoloWaypoint,
} from "./holoProgramGeom";
import { clearHoloAnchors, publishHoloAnchors, type HoloAnchor } from "./holoAnchorsRef";
import type { HoloPalette } from "./holoPalette";
import { clamp01 } from "@/lib/math";

function smootherstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/* ⚠ NO MODULE-CONSTANT COLOURS. They were the dark theme's literals, and a
   module constant cannot answer to a theme flip — ADR-058's whole finding
   about the corridor's painters. Every colour now comes off the palette. */

/** Resting opacities. ⚠ The record's FLOOR sits above the shells' CEILING
 *  (0.26 in `buildShells`), so the eye can always separate the record from
 *  the machine it lives in, at any angle. */
const O_RING = 0.92;
const O_SEAT = 1;
const O_TICK = 0.42;
const O_AXIS = 0.3;
const O_SHELL = 1; // per-shell alpha is baked into vertex colour
const O_LADDER = 0.72;
/* O_CORE retired with the wireframe core — the brandmark holds the centre. */
const O_DUST = 0.62;
const O_GRID = 0.055;

export interface HoloProgramSceneProps {
  waypoints: readonly HoloWaypoint[];
  /** Arms the intro. False holds the object undrawn so the beat can wait
   *  behind the hero's curtain. */
  armed: boolean;
  /** Resolve everything drawn with no choreography and no life — the
   *  reduced-motion path and the lab's "hold still" control. */
  still?: boolean;
  /** Fires on the first committed frame. */
  onReady?: () => void;
  replayToken?: number;
  /** Lab overrides for the life amounts; production uses the constants. */
  life?: { breathe?: number; flicker?: number; twinkle?: number };
  /** The theme's colour spine. The canvas resolves it and re-keys this
   *  component on a flip, so nothing here has to re-colour in place. */
  palette: HoloPalette;
}

export function HoloProgramScene({
  waypoints,
  armed,
  still = false,
  onReady,
  replayToken = 0,
  life,
  palette,
}: HoloProgramSceneProps) {
  const { invalidate, camera, viewport } = useThree();
  const rigRef = useRef<THREE.Group>(null);

  /* The palette, as three Colors. Rebuilt only when the theme changes. */
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

  const breatheAmt = life?.breathe ?? BREATHE;
  const flickerAmt = life?.flicker ?? FLICKER;
  const twinkleAmt = life?.twinkle ?? TWINKLE;

  /* ── The record's own rings ────────────────────────────────────────── */
  const rings = useMemo(
    () =>
      waypoints.map((wp, i) => ({
        id: wp.id,
        at: wp.at,
        z: waypointZ(wp.at),
        radius: ringRadius(wp.at),
        seat: wp.seat === true,
        reveal: ringReveal(wp.at),
        index: i,
      })),
    [waypoints]
  );

  const ringPts = useMemo(() => rings.map((r) => buildRingPoints(r.z, r.radius)), [rings]);
  /* Per-vertex near/far shading, so a ring weaves through the volume rather
     than sitting flat on it — the corridor's own 0.16 → 1.0 bake. */
  const ringCols = useMemo(
    () => rings.map((r) => ringDepthColors(r.radius, r.seat ? C.gold : C.structure)),
    [rings]
  );
  const arcPts = useMemo(() => rings.map((r) => buildWaypointArc(r.z, r.radius, r.index)), [rings]);
  const seat = rings.find((r) => r.seat) ?? rings[rings.length - 1];
  const seatInner = useMemo(
    () => (seat ? buildRingPoints(seat.z, seat.radius * SEAT_INNER_K) : null),
    [seat]
  );
  const marks = useMemo(
    () => rings.map((r) => buildDiamond(r.z, anchorAngle(r.index), r.radius, 0.062)),
    [rings]
  );

  const ticks = useMemo(() => buildTickField(rings), [rings]);

  /* The reticles — a corner-bracket frame on each marker, the reference's
     own label grammar. The DOM label sits beside one of these. */
  const reticles = useMemo(
    () =>
      buildReticleField(
        rings.map((r) => ({ z: r.z, angle: anchorAngle(r.index), radius: r.radius }))
      ),
    [rings]
  );

  /* THE MARK'S RING — the one fully closed, unbroken ring in the object, at
     the brandmark's shoulder. Everything else is broken, dashed or plated,
     so this reads as the origin the rest opened out of. */
  const markRing = useMemo(() => buildRingPoints(0, MARK_RING_RADIUS, 220), []);
  const markRingCols = useMemo(() => ringDepthColors(MARK_RING_RADIUS, C.gold, 220), []);
  /* A plated companion just outside it — chorded, so the pair reads as a
     machined collar rather than as two drawn circles. */
  const markPlate = useMemo(() => buildPlatedRing(0, MARK_RING_RADIUS * 1.14, 18, 0.55), []);

  /* ── The machine around it ─────────────────────────────────────────── */
  const shells = useMemo(() => buildShells(), []);
  const shellDashes = useMemo(() => buildShellDashes(shells), [shells]);
  const shellRings = useMemo(
    () =>
      shells
        .filter((s) => s.kind !== "dotted")
        .map((s) => ({
          shell: s,
          points:
            s.kind === "frame"
              ? buildRingPoints(s.z, s.radius, 72)
              : buildRingPoints(s.z, s.radius, 72).slice(
                  0,
                  Math.max(4, Math.round((s.sweep / (Math.PI * 2)) * 72))
                ),
        })),
    [shells]
  );

  /* ⚠ THE WIREFRAME CORE IS GONE, AND THE BRANDMARK TAKES ITS PLACE. The
     round-2 "node network" was a misread of the reference anyway — its
     `nodeCount` is a CALLOUT count, and there is no topology generator in
     that bundle at all. The centre was a genuine hole; the mark fills it. */
  const dust = useMemo(() => buildDust(), []);
  const grid = useMemo(() => buildGroundGrid(), []);
  const axisPts = useMemo(() => buildAxisPoints(AXIS_HALF), []);

  const ladderPts = useMemo(() => {
    const samples: [number, number][] = rings.map((r) => [r.z, r.radius]);
    return buildLadderPoints(samples);
  }, [rings]);

  useEffect(
    () => () => disposeAll(ticks.geometry, reticles.geometry, shellDashes, markPlate, dust, grid),
    [ticks.geometry, reticles.geometry, shellDashes, markPlate, dust, grid]
  );

  /** The dust's material. ⚠ A `ShaderMaterial`, never `PointsMaterial` —
   *  three's points chain has no radial mask, so a `PointsMaterial` with no
   *  `map` draws every mote as a HARD OPAQUE SQUARE. That was the owner's
   *  "particles too thick" exactly. */
  const dustMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: holoDustVertexShader,
        fragmentShader: holoDustFragmentShader,
        uniforms: {
          /* ⚠ NOT SMALLER THAN THIS. Chromatic aberration displaces the
             colour channels by a fixed screen offset, so on a 1–2px mote it
             SEPARATES the point into distinct red and green dots instead of
             fringing its edge — the cloud reads as coloured confetti. A
             softer, slightly larger mote lets the same pass smear. */
          uPointSize: { value: 3.4 },
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
  useEffect(() => () => dustMat.dispose(), [dustMat]);

  /* ── Refs the frame writes through ─────────────────────────────────── */
  const ringRefs = useRef<(ComponentRef<typeof Line> | null)[]>([]);
  const arcRefs = useRef<(ComponentRef<typeof Line> | null)[]>([]);
  const markRefs = useRef<(ComponentRef<typeof Line> | null)[]>([]);
  const shellRefs = useRef<(ComponentRef<typeof Line> | null)[]>([]);
  const seatInnerRef = useRef<ComponentRef<typeof Line>>(null);
  const tickRef = useRef<THREE.LineSegments>(null);
  const reticleRef = useRef<THREE.LineSegments>(null);
  const dashRef = useRef<THREE.LineSegments>(null);
  const markRingRef = useRef<ComponentRef<typeof Line>>(null);
  const markPlateRef = useRef<THREE.LineSegments>(null);
  const markGroupRef = useRef<THREE.Group>(null);
  const dustRef = useRef<THREE.Points>(null);
  const ladderRef = useRef<ComponentRef<typeof Line>>(null);
  const axisRef = useRef<ComponentRef<typeof Line>>(null);

  const progress = useRef(0);
  const ready = useRef(false);
  const clock = useRef(0);
  const anchorScratch = useMemo(() => new THREE.Vector3(), []);
  const centreScratch = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    progress.current = still ? 1 : 0;
    invalidate();
  }, [replayToken, still, armed, invalidate]);

  useEffect(() => () => clearHoloAnchors(), []);

  /** Per-ring flicker phases, seeded — no two rings dropout together. */
  const flickerSeeds = useMemo(() => {
    const rnd = mulberry32(HOLO_SEED + 31);
    return rings.map(() => rnd() * 100);
  }, [rings]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    clock.current += dt;
    const t = clock.current;

    if (still) progress.current = 1;
    else if (armed && progress.current < 1) {
      progress.current = Math.min(1, progress.current + (dt * 1000) / INTRO_MS);
    }
    const p = progress.current;

    /* ── BREATHE: the whole object swells and settles ───────────────── */
    const rig = rigRef.current;
    if (rig) {
      const b = still ? 0 : Math.sin(t * Math.PI * 2 * BREATHE_HZ) * breatheAmt * 0.06;
      rig.scale.setScalar(1 + b);
    }

    /* ── The record's rings ─────────────────────────────────────────── */
    rings.forEach((ring, i) => {
      const reveal = smootherstep(ring.reveal[0], ring.reveal[1], p);
      const line = ringRefs.current[i];

      /* FLICKER — a seeded, time-hashed dropout. Brief and per-object, so
         the machine reads as powered rather than as animated. */
      let flick = 1;
      if (!still && flickerAmt > 0) {
        const s = Math.sin(t * 7.3 + flickerSeeds[i]) * Math.sin(t * 3.1 + flickerSeeds[i] * 2.7);
        if (s > 1 - flickerAmt * 0.09) flick = 0.35;
      }

      if (line) {
        line.geometry.instanceCount = Math.max(0, Math.ceil(reveal * RING_SEGMENTS));
        line.material.opacity = (ring.seat ? O_SEAT : O_RING) * flick;
        line.visible = reveal > 0.001;
      }
      const arc = arcRefs.current[i];
      if (arc) {
        arc.material.opacity = reveal * flick;
        arc.visible = reveal > 0.01;
      }
      const mark = markRefs.current[i];
      if (mark) {
        mark.material.opacity = reveal * 0.9 * flick;
        mark.visible = reveal > 0.01;
      }
    });

    if (seatInnerRef.current && seat) {
      const r = smootherstep(0.72, 1, p);
      seatInnerRef.current.geometry.instanceCount = Math.max(0, Math.ceil(r * RING_SEGMENTS));
      seatInnerRef.current.material.opacity = 0.55 * r;
      seatInnerRef.current.visible = r > 0.01;
    }

    /* Ticks populate per ring, just after that ring's stroke closes. */
    if (tickRef.current) {
      let drawn = 0;
      for (let i = 0; i < rings.length; i++) {
        const tt = smootherstep(rings[i].reveal[1] - 0.04, rings[i].reveal[1] + 0.04, p);
        const [, count] = ticks.ranges[i];
        drawn += Math.ceil((tt * count) / 2) * 2;
      }
      tickRef.current.geometry.setDrawRange(0, drawn);
      (tickRef.current.material as THREE.LineBasicMaterial).opacity = O_TICK;
      tickRef.current.visible = drawn > 0;
    }

    /* ── The machine ────────────────────────────────────────────────── */
    const machine = smootherstep(0, 0.45, p);
    shellRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const s = shellRings[i]?.shell;
      if (!s) return;
      ref.material.opacity = s.opacity * machine * O_SHELL;
      ref.visible = machine > 0.01;
    });
    if (dashRef.current) {
      (dashRef.current.material as THREE.LineBasicMaterial).opacity = 0.14 * machine;
      dashRef.current.visible = machine > 0.01;
    }
    /* THE MARK, AND THE RING IT OPENS INTO. The mark arrives first — the
       loops emerge FROM it, so it cannot show up after them. */
    const markIn = smootherstep(0, 0.3, p);
    if (markGroupRef.current) {
      markGroupRef.current.visible = markIn > 0.01;
      markGroupRef.current.scale.setScalar(MARK_SCALE * (0.94 + 0.06 * markIn));
    }
    if (markRingRef.current) {
      markRingRef.current.geometry.instanceCount = Math.max(0, Math.ceil(markIn * 220));
      markRingRef.current.material.opacity = 0.88;
      markRingRef.current.visible = markIn > 0.01;
    }
    if (markPlateRef.current) {
      (markPlateRef.current.material as THREE.LineBasicMaterial).opacity = 0.3 * markIn;
      markPlateRef.current.visible = markIn > 0.01;
    }

    /* The reticles land with their own ring's stroke. */
    if (reticleRef.current) {
      let drawn = 0;
      for (let i = 0; i < rings.length; i++) {
        const rr = smootherstep(rings[i].reveal[1] - 0.02, rings[i].reveal[1] + 0.06, p);
        const [, count] = reticles.ranges[i];
        drawn += Math.ceil((rr * count) / 2) * 2;
      }
      reticleRef.current.geometry.setDrawRange(0, drawn);
      (reticleRef.current.material as THREE.LineBasicMaterial).opacity = 0.5;
      reticleRef.current.visible = drawn > 0;
    }

    if (dustRef.current) {
      /* TWINKLE — the cloud's overall shimmer. Per-mote variation comes from
         the seeded `aRand` attribute baked into the geometry. */
      const tw = still ? 1 : 1 + Math.sin(t * 1.7) * twinkleAmt * 0.16;
      dustMat.uniforms.uOpacity.value = O_DUST * palette.dustScale * machine * tw;
      /* ⚠ The renderer's OWN dpr, never `window.devicePixelRatio` — reading
         the raw value against a capped canvas DPR is the recorded cause of
         the corridor's "thick starfield" bug. */
      dustMat.uniforms.uPixelRatio.value = viewport.dpr;
    }
    if (ladderRef.current) {
      const r = smootherstep(0.45, 0.95, p);
      ladderRef.current.geometry.instanceCount = Math.max(0, Math.ceil(r * (ladderPts.length - 1)));
      ladderRef.current.material.opacity = O_LADDER;
      ladderRef.current.visible = r > 0.01;
    }
    if (axisRef.current) {
      const r = smootherstep(0, 0.3, p);
      axisRef.current.geometry.instanceCount = Math.max(0, Math.ceil(r * (axisPts.length - 1)));
      axisRef.current.material.opacity = O_AXIS;
      axisRef.current.visible = r > 0.01;
    }

    /* ── Publish where each waypoint IS, for the DOM label layer ─────── */
    const cam = camera as THREE.PerspectiveCamera;
    const scale = rig ? rig.scale.x : 1;
    const forward = new THREE.Vector3();
    cam.getWorldDirection(forward);
    const next: HoloAnchor[] = rings.map((ring) => {
      // The label hangs off its ring's rim at that ring's own angle —
      // alternating above and below the cone, so seven labels do not collapse
      // into one diagonal — then rides whatever rotation the reader applied.
      const ang = anchorAngle(ring.index);
      anchorScratch.set(
        Math.cos(ang) * ring.radius * scale,
        Math.sin(ang) * ring.radius * scale,
        ring.z * scale
      );
      if (rig) anchorScratch.applyQuaternion(rig.quaternion);
      const world = anchorScratch.clone();
      const ndc = world.clone().project(cam);
      const toPoint = world.clone().sub(cam.position).normalize();
      /* Frontness: how much this point faces the camera along the axis, so a
         ring behind the core dims its own label rather than shouting over it.
         ⚠ FROM THE REAL CAMERA-SPACE DEPTH, NOT FROM `ndc.z` (ADR-080 U3).
         With `near 0.1 / far 60` the whole object lives in the last
         half-percent of the NDC depth range, so the old expression returned
         its floor for all seven anchors, always — this grammar had never run
         once. `frontnessFromDepth` bands the real distance against the
         object's own half-depth, which no clip-plane change can break. */
      /* The rim's outward normal, projected: the ring's own centre against
         the anchor, in screen space. It is what lets the leader line run back
         down the ring's geometry at any pose (ADR-080 U3). */
      centreScratch.set(0, 0, ring.z * scale);
      if (rig) centreScratch.applyQuaternion(rig.quaternion);
      const cNdc = centreScratch.clone().project(cam);
      const dnx = ndc.x - cNdc.x;
      const dny = -(ndc.y - cNdc.y);
      const dnl = Math.hypot(dnx, dny) || 1;
      return {
        id: ring.id,
        x: ndc.x * 0.5 + 0.5,
        y: 0.5 - ndc.y * 0.5,
        frontness: frontnessFromDepth(world.distanceTo(cam.position)),
        visible: ndc.z < 1 && toPoint.dot(forward) > 0,
        side: ring.index % 2 === 0 ? ("up" as const) : ("dn" as const),
        nx: dnx / dnl,
        ny: dny / dnl,
      };
    });
    publishHoloAnchors(next);

    if (!ready.current) {
      ready.current = true;
      onReady?.();
    }

    /* The object is ALIVE, so the loop stays hot — the canvas pauses it when
       the beat leaves the viewport or the tab is hidden, which is where the
       cost is actually reclaimed. */
    if (!still) invalidate();
    else if (p < 1) invalidate();
  });

  return (
    <group ref={rigRef}>
      {/* THE MACHINE — the seeded shells, dust and core the record sits in. */}
      <lineSegments ref={dashRef} geometry={shellDashes}>
        <lineBasicMaterial
          color={C.machine}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>

      {shellRings.map((s, i) => (
        <Line
          key={`shell-${i}`}
          ref={(el) => {
            shellRefs.current[i] = el;
          }}
          points={s.points}
          color={s.shell.kind === "frame" ? C.structure : C.machine}
          lineWidth={LW_SHELL}
          transparent
          opacity={0}
          depthWrite={false}
        />
      ))}

      <points ref={dustRef} geometry={dust} material={dustMat} />

      {/* ── THE CENTRE ─────────────────────────────────────────────────
          The Thoughtform brandmark, and the loops emerge from it. The Arc
          is a RENEWING arc on live work and repeated arcs accumulate the
          map — so the mark at the origin is what every dated ring came out
          of. ⚠ `entrance="off"` is the default and it MATTERS: the scroll
          read inside that component is gated behind `entrance="scroll"`, so
          at "off" nothing here couples to the corridor's clock. */}
      <group ref={markGroupRef} visible={false}>
        <VolumetricBrandmarkArtifact
          flyIn={1}
          entrance="off"
          wireCount={1500}
          surfaceCount={0}
          shellCount={0}
          depthStrutCount={0}
          scanGain={0}
          blending="normal"
          pointSize={3.6}
          opacity={palette.markOpacity}
          wireStroke={0.075}
          /* ⚠ THE MARK TAKES THE PALETTE TOO. Left to its own defaults it
             paints `TENSOR_GOLD` (#b08b42) in both themes — which is the
             corridor's value, tuned against void, and measures roughly 2:1
             on parchment. The centre of the object cannot be the faintest
             thing in it. */
          color={`#${palette.mark.toString(16).padStart(6, "0")}`}
          accentColor={`#${palette.accent.toString(16).padStart(6, "0")}`}
        />

        {/* ⚠ THE ONE UNBROKEN RING IN THE OBJECT. Abstract — it traces no
            client mark (owner, 2026-08-25); the rhyme with Loop is carried
            by form. Being the only closed ring is what makes it read as the
            origin the others opened out of. */}
        <Line
          ref={markRingRef}
          points={markRing}
          vertexColors={markRingCols}
          lineWidth={LW_MARK_RING}
          transparent
          opacity={0}
          depthWrite={false}
        />
        <lineSegments ref={markPlateRef} geometry={markPlate}>
          <lineBasicMaterial color={C.gold} transparent opacity={0} depthWrite={false} />
        </lineSegments>
      </group>

      <lineSegments geometry={grid}>
        <lineBasicMaterial color={C.structure} transparent opacity={O_GRID} depthWrite={false} />
      </lineSegments>

      {/* THE AXIS, and the record's own ladder riding the rims. */}
      <Line
        ref={axisRef}
        points={axisPts}
        color={C.structure}
        lineWidth={0.9}
        transparent
        opacity={0}
        depthWrite={false}
      />
      <Line
        ref={ladderRef}
        points={ladderPts}
        color={C.green}
        lineWidth={1.9}
        transparent
        opacity={0}
        depthWrite={false}
      />

      {/* THE RECORD — one assembly per dated waypoint. */}
      {rings.map((ring, i) => (
        <Line
          key={ring.id}
          ref={(el) => {
            ringRefs.current[i] = el;
          }}
          points={ringPts[i]}
          vertexColors={ringCols[i]}
          lineWidth={ring.seat ? LW_SEAT : LW_RECORD}
          transparent
          opacity={ring.seat ? O_SEAT : O_RING}
          depthWrite={false}
        />
      ))}

      {seatInner ? (
        <Line
          ref={seatInnerRef}
          points={seatInner}
          color={C.gold}
          lineWidth={1.2}
          transparent
          opacity={0}
          depthWrite={false}
        />
      ) : null}

      <lineSegments ref={tickRef} geometry={ticks.geometry}>
        <lineBasicMaterial color={C.structure} transparent opacity={0} depthWrite={false} />
      </lineSegments>

      {/* The reticles — a corner-bracket frame per marker; the DOM label
          sits beside one of these rather than floating over the object. */}
      <lineSegments ref={reticleRef} geometry={reticles.geometry}>
        <lineBasicMaterial color={C.structure} transparent opacity={0} depthWrite={false} />
      </lineSegments>

      {/* The bloom donors: one bright arc per ring, additive. */}
      {rings.map((ring, i) => (
        <Line
          key={`arc-${ring.id}`}
          ref={(el) => {
            arcRefs.current[i] = el;
          }}
          points={arcPts[i]}
          color={ring.seat ? C.gold : C.accent}
          lineWidth={ring.seat ? 3.4 : 2.4}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
          blending={blend}
        />
      ))}

      {/* The marker each label hangs from. */}
      {rings.map((ring, i) => (
        <Line
          key={`mark-${ring.id}`}
          ref={(el) => {
            markRefs.current[i] = el;
          }}
          points={marks[i]}
          color={ring.seat ? C.gold : C.accent}
          lineWidth={1.4}
          transparent
          opacity={0}
          depthWrite={false}
        />
      ))}
    </group>
  );
}
