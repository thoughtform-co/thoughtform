"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { smoothstep, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  STATION_DIAGNOSTIC,
  STATION_THOUGHTFORM,
  depthOpacityForWorldPosition,
  getBuildApproachFade,
  parkDwellVisibility,
} from "./sceneGeom";

/**
 * LatentTopographyContours — world-fixed topographic shards spaced
 * along the Thoughtform → Diagnostic corridor leg (ADR-018).
 *
 * v3.12 realm-transition pass: the leg-2 (Encode → Build) shard
 * catalogue is RETIRED. Those shards were never physically passed
 * by the camera (it parks at Build short of their Z), so they hung
 * in the wormhole-mouth backdrop as static nested-ring "mandalas" —
 * competing with the exit aperture and the gyroscope. Passthrough-02
 * texture is owned by the wormhole walls / streaks / photons / exit
 * glow; the post-exit backdrop is owned by `SubstrateTopography`.
 *
 * Replaces the earlier `LatentArtifactBands` (literal equations +
 * tokens) with an abstract, more artistic latent-space treatment:
 * fragments of contour lines and gradient arrows reading as the
 * level sets of a loss surface the camera is flying past.
 *
 * Like the previous artifact layer this is NOT camera-relative
 * ambient atmosphere (that role belongs to `LatentFieldTunnel` and
 * `CelestialMotes`). Every shard lives at a FIXED world position.
 * The user literally flies past each one: it appears as a faint
 * distant fragment far down the corridor, intensifies as the
 * camera closes the distance, and recedes / culls as it crosses
 * the camera plane.
 *
 * Visual taxonomy:
 *
 *   - **Contour shards** — 3 nested closed curves with a slight
 *     organic wobble. Read as the level sets around a local
 *     minimum on a 2D loss surface (a "basin"). The most
 *     dominant element.
 *   - **Ridge shards** — single open arc + perpendicular short
 *     tick marks. Read as a contour crossing a ridge, with the
 *     ticks pointing in the direction of steepest descent.
 *   - **Gradient arrows** (vector shards) — short directional
 *     line segments with diamond end markers. Retained from the
 *     previous layer; repurposed as gradient-descent indicators
 *     near the basin shards.
 *
 * Authoring rules:
 *   - Artifacts are HAND-PLACED. Same landmarks every load.
 *   - No shard sits on the optical axis or in the brandmark column
 *     (|x| > 1.4 minimum).
 *   - Two Z bands: leg 1 (passthrough-01) and leg 2 (passthrough-02).
 *     Each leg gets its own progress-reveal gate so the parked
 *     Thoughtform AND parked Diagnostic beats both stay clean —
 *     topography is discovered during travel, not in the parked
 *     reads.
 *   - Each shard's depth-focus window is sized so larger shards
 *     fade in earlier and smaller shards only register when close.
 *
 * Skipped on mobile-narrow viewports (same gate as the previous
 * layer) — the topography would crowd the already-tight copy.
 */

// ── Visual constants ───────────────────────────────────────────

const DAWN_HEX = "#ebe3d6";
const DAWN_SOFT_HEX = "#d6cdb5";
const GOLD_HEX = "#caa554";

const CONTOUR_SEGMENTS = 48;
const RIDGE_SEGMENTS = 32;

// ── Corridor Z bands derived from the gate stations ───────────

const TF_Z = STATION_THOUGHTFORM.position[2];
const DG_Z = STATION_DIAGNOSTIC.position[2];

/** Z position interpolated between two stations. `t = 0` lands at
 *  `fromZ`, `t = 1` at `toZ`. Used so the shard catalogue auto-
 *  adapts if the gate stations are retuned in `sceneGeom`. */
function lerpZ(t: number, fromZ: number, toZ: number): number {
  return fromZ + (toZ - fromZ) * t;
}

// Leg 1 spans passthrough-01 — start 34% past TF (well clear of
// the parked Thoughtform read), end just before the Diagnostic
// gate plane so contours never overlap the orbits.
const LEG_1_START_Z = lerpZ(0.34, TF_Z, DG_Z);
const LEG_1_END_Z = DG_Z + 0.5;

// Leg 2 (passthrough-02) shards RETIRED (v3.12 realm-transition
// pass). The nested contour rings hovering ahead of the camera in
// the Encode→Build leg were never physically passed (the camera
// parks at Build before reaching their Z), so they hung in the
// mouth/Build backdrop as static "mandala" rings — an aesthetic
// the exit sequence explicitly moves away from. The exit zone is
// now owned by the wormhole exit aperture (ring cadence + glow,
// `LatentWormholeWalls`) and the substrate realm topography that
// resolves at the threshold (`SubstrateTopography`).

/** Reveal envelope — leg-1 only after the v3.12 retirement. Becomes
 *  visible as the camera leaves the parked Thoughtform read. */
function legReveal(progress: number): number {
  return smoothstep(0.14, 0.28, progress);
}

// Park-dwell suppression (hide these "mandala" contour shards across
// the Navigate AND Encode parks so the parked instrument reads clean)
// is now the shared `parkDwellVisibility` from sceneGeom — it covers
// both front-corridor parks instead of Navigate alone, which is what
// left the shards ringing the Encode sphere.

// ── Artifact catalogue ────────────────────────────────────────

interface ContourShardArtifact {
  kind: "contour";
  /** World position of the basin centre. */
  pos: [number, number, number];
  /** Outermost ring's half-extent. Inner rings nest at fractions
   *  of this radius. */
  outerRadius: number;
  /** Aspect ratio `ry / rx`. Default 1 (round basin); < 1 reads
   *  as a stretched valley, > 1 as a tall basin. */
  aspect?: number;
  /** Rotation of the basin in radians around Z. Tilting suggests
   *  a non-axis-aligned ravine. */
  rotation?: number;
  /** Number of nested rings (3 = standard, 4 = denser). */
  rings?: number;
  /** Tint. Defaults to dawn-soft (subtle backdrop). */
  color?: string;
}

interface RidgeShardArtifact {
  kind: "ridge";
  /** World position of the arc midpoint. */
  pos: [number, number, number];
  /** Arc's half-length along the curve (world units). */
  arcRadius: number;
  /** How "tall" the arc bows out (world units; > 0 = bow upward,
   *  < 0 = bow downward). */
  bow: number;
  /** Rotation in radians. */
  rotation?: number;
  /** Number of perpendicular gradient-direction ticks along the
   *  arc. Default 3. */
  tickCount?: number;
  color?: string;
}

interface VectorShardArtifact {
  kind: "vector";
  /** Origin of the arrow. */
  pos: [number, number, number];
  /** Direction (will be normalised then scaled by `length`). */
  dir: [number, number, number];
  /** World length of the segment. */
  length: number;
  color?: string;
}

type Artifact = ContourShardArtifact | RidgeShardArtifact | VectorShardArtifact;

/** Catalogue — 5 contour + 3 ridge + 4 vector on leg 1 = 12 shards
 *  total (leg 2 retired in v3.12). Z positions distribute evenly
 *  inside the leg's span via `lerpZ`, so retuning the stations in
 *  `sceneGeom.ts` moves the whole layer without manual respacing. */
const ARTIFACTS: Artifact[] = [
  // ── Leg 1 (passthrough-01) ────────────────────────────────────
  // Contour basins along the left + right peripheral rails.
  {
    kind: "contour",
    pos: [-1.85, 0.7, lerpZ(0.1, LEG_1_START_Z, LEG_1_END_Z)],
    outerRadius: 0.55,
    aspect: 0.7,
    rotation: 0.4,
    color: DAWN_SOFT_HEX,
  },
  {
    kind: "contour",
    pos: [2.05, -0.45, lerpZ(0.28, LEG_1_START_Z, LEG_1_END_Z)],
    outerRadius: 0.7,
    aspect: 1.2,
    rotation: -0.25,
    color: DAWN_SOFT_HEX,
  },
  {
    kind: "contour",
    pos: [-2.15, -0.85, lerpZ(0.48, LEG_1_START_Z, LEG_1_END_Z)],
    outerRadius: 0.6,
    aspect: 0.85,
    rotation: 0.15,
    rings: 4,
    color: GOLD_HEX,
  },
  {
    kind: "contour",
    pos: [1.7, 1.05, lerpZ(0.66, LEG_1_START_Z, LEG_1_END_Z)],
    outerRadius: 0.5,
    aspect: 0.9,
    rotation: -0.55,
    color: DAWN_SOFT_HEX,
  },
  {
    kind: "contour",
    pos: [-1.95, 0.5, lerpZ(0.86, LEG_1_START_Z, LEG_1_END_Z)],
    outerRadius: 0.45,
    aspect: 1.1,
    rotation: 0.3,
    color: DAWN_HEX,
  },

  // Ridge shards on alternate rails.
  {
    kind: "ridge",
    pos: [2.2, 0.95, lerpZ(0.18, LEG_1_START_Z, LEG_1_END_Z)],
    arcRadius: 0.85,
    bow: 0.18,
    rotation: -0.6,
    color: DAWN_SOFT_HEX,
  },
  {
    kind: "ridge",
    pos: [-1.55, -0.4, lerpZ(0.4, LEG_1_START_Z, LEG_1_END_Z)],
    arcRadius: 0.75,
    bow: -0.15,
    rotation: 0.3,
    color: DAWN_HEX,
  },
  {
    kind: "ridge",
    pos: [1.85, -1.0, lerpZ(0.78, LEG_1_START_Z, LEG_1_END_Z)],
    arcRadius: 0.7,
    bow: 0.2,
    rotation: -0.2,
    color: DAWN_SOFT_HEX,
  },

  // Gradient arrows — pointed toward nearby basins, suggesting
  // descent into the minimum.
  {
    kind: "vector",
    pos: [-1.2, 0.95, lerpZ(0.2, LEG_1_START_Z, LEG_1_END_Z)],
    dir: [-0.6, -0.3, -0.4],
    length: 0.9,
    color: GOLD_HEX,
  },
  {
    kind: "vector",
    pos: [1.45, -0.7, lerpZ(0.38, LEG_1_START_Z, LEG_1_END_Z)],
    dir: [0.55, 0.3, -0.4],
    length: 0.85,
  },
  {
    kind: "vector",
    pos: [-1.4, -1.05, lerpZ(0.6, LEG_1_START_Z, LEG_1_END_Z)],
    dir: [-0.65, 0.3, -0.4],
    length: 0.9,
    color: GOLD_HEX,
  },
  {
    kind: "vector",
    pos: [1.25, 0.55, lerpZ(0.82, LEG_1_START_Z, LEG_1_END_Z)],
    dir: [0.55, 0.45, -0.4],
    length: 0.85,
  },

  // Leg 2 (passthrough-02) shards retired — see the v3.12 note above
  // `legReveal`. The Encode→Build leg's backdrop is owned by the exit
  // aperture + substrate realm now.
];

// ── Geometry builders ─────────────────────────────────────────

/** Build one closed contour ring with an organic wobble so the
 *  level set doesn't read as a perfect ellipse. */
function buildContourRingGeometry(
  rx: number,
  ry: number,
  rotation: number,
  ringIndex: number
): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  for (let i = 0; i <= CONTOUR_SEGMENTS; i++) {
    const a = (i / CONTOUR_SEGMENTS) * Math.PI * 2;
    // Per-ring wobble keeps each level set distinct and suggests
    // an organic surface rather than perfectly nested ellipses.
    const wob = 1 + Math.sin(a * 3 + ringIndex * 1.3) * 0.04;
    const px = Math.cos(a) * rx * wob;
    const py = Math.sin(a) * ry * wob;
    points.push(new THREE.Vector3(px * cosR - py * sinR, px * sinR + py * cosR, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

/** Build a ridge arc + its perpendicular gradient-direction ticks.
 *  Returns the arc as one geometry plus the tick segments as a
 *  second `LineSegments` geometry. */
function buildRidgeGeometry(
  arcRadius: number,
  bow: number,
  rotation: number,
  tickCount: number
): { arc: THREE.BufferGeometry; ticks: THREE.BufferGeometry } {
  const arcPts: THREE.Vector3[] = [];
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  for (let i = 0; i <= RIDGE_SEGMENTS; i++) {
    const t = i / RIDGE_SEGMENTS;
    // Curve spans x in [-arcRadius, +arcRadius]; y bows by `bow`
    // at the midpoint, falling to 0 at the ends — a parabolic arc.
    const x = (t - 0.5) * 2 * arcRadius;
    const y = bow * (1 - Math.pow((t - 0.5) * 2, 2));
    arcPts.push(new THREE.Vector3(x * cosR - y * sinR, x * sinR + y * cosR, 0));
  }
  const arc = new THREE.BufferGeometry().setFromPoints(arcPts);

  const tickPts: THREE.Vector3[] = [];
  const tickLength = 0.07;
  for (let i = 0; i < tickCount; i++) {
    // Spread ticks evenly along the arc (skip the very ends).
    const t = (i + 1) / (tickCount + 1);
    const idx = Math.floor(t * RIDGE_SEGMENTS);
    const idxNext = Math.min(RIDGE_SEGMENTS, idx + 1);
    const p = arcPts[idx];
    const pNext = arcPts[idxNext];
    // Perpendicular = (-dy, dx) normalised.
    const dx = pNext.x - p.x;
    const dy = pNext.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    // Tick segment from arc point, normal direction outward (away
    // from the bow centre) — reads as the gradient pointing
    // downhill from the ridge.
    const tickEndX = p.x + nx * tickLength * Math.sign(bow || 1);
    const tickEndY = p.y + ny * tickLength * Math.sign(bow || 1);
    tickPts.push(p.clone());
    tickPts.push(new THREE.Vector3(tickEndX, tickEndY, 0));
  }
  const ticks = new THREE.BufferGeometry().setFromPoints(tickPts);
  return { arc, ticks };
}

// ── Sub-components ────────────────────────────────────────────

function ContourShard({
  pos,
  outerRadius,
  aspect = 1,
  rotation = 0,
  rings = 3,
  color = DAWN_SOFT_HEX,
}: Omit<ContourShardArtifact, "kind">) {
  const geoms = useMemo(() => {
    const arr: THREE.BufferGeometry[] = [];
    for (let r = 0; r < rings; r++) {
      // Ring fraction: outer (r=rings-1) gets t=1, innermost gets
      // a small value so the basin has a clear centre.
      const t = (r + 1) / rings;
      arr.push(buildContourRingGeometry(outerRadius * t, outerRadius * aspect * t, rotation, r));
    }
    return arr;
  }, [outerRadius, aspect, rotation, rings]);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    [color]
  );

  // Depth-focus window — larger basins fade in earlier.
  const depthWindow = useMemo(
    () => ({
      near: 0.4,
      nearFade: 0.5,
      far: 4.5 + outerRadius * 3,
      farFade: Math.max(1.0, outerRadius * 2),
    }),
    [outerRadius]
  );

  useEffect(() => {
    return () => {
      geoms.forEach((g) => g.dispose());
      material.dispose();
    };
  }, [geoms, material]);

  useFrame(() => {
    const { paintProgress, active } = useDepthGatewayStore.getState().transform;
    if (!active) {
      material.opacity = 0;
      return;
    }
    const reveal = legReveal(paintProgress);
    const depthOpacity = depthOpacityForWorldPosition(paintProgress, pos, depthWindow);
    // Cap at 0.32 — contours are a backdrop layer, never compete
    // with the orbits or the brandmark. Suppressed across the Navigate
    // AND Encode parks so both compasses read clean there. Build-
    // approach declutter (v3.1) fades the whole layer out across the
    // approach to the Build park.
    material.opacity =
      depthOpacity *
      reveal *
      0.32 *
      parkDwellVisibility(paintProgress) *
      getBuildApproachFade(paintProgress);
  });

  return (
    <group position={pos}>
      {geoms.map((g, i) => (
        <lineLoop key={`ring-${i}`} geometry={g} material={material} />
      ))}
    </group>
  );
}

function RidgeShard({
  pos,
  arcRadius,
  bow,
  rotation = 0,
  tickCount = 3,
  color = DAWN_SOFT_HEX,
}: Omit<RidgeShardArtifact, "kind">) {
  const { arc: arcGeom, ticks: ticksGeom } = useMemo(
    () => buildRidgeGeometry(arcRadius, bow, rotation, tickCount),
    [arcRadius, bow, rotation, tickCount]
  );

  const arcMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    [color]
  );

  const tickMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    [color]
  );

  // R3F's `<line>` JSX intrinsic collides with SVG's `<line>` in
  // TypeScript, so the arc is constructed as a `THREE.Line` instance
  // and mounted through `<primitive>`. Same dodge as the previous
  // LatentArtifactBands.tsx vector shards.
  const arcObject = useMemo(() => {
    const line = new THREE.Line(arcGeom, arcMat);
    line.position.set(pos[0], pos[1], pos[2]);
    return line;
  }, [arcGeom, arcMat, pos]);

  const ticksObject = useMemo(() => {
    const lines = new THREE.LineSegments(ticksGeom, tickMat);
    lines.position.set(pos[0], pos[1], pos[2]);
    return lines;
  }, [ticksGeom, tickMat, pos]);

  const depthWindow = useMemo(
    () => ({
      near: 0.4,
      nearFade: 0.5,
      far: 4.8,
      farFade: 1.4,
    }),
    []
  );

  useEffect(() => {
    return () => {
      arcGeom.dispose();
      ticksGeom.dispose();
      arcMat.dispose();
      tickMat.dispose();
    };
  }, [arcGeom, ticksGeom, arcMat, tickMat]);

  useFrame(() => {
    const { paintProgress, active } = useDepthGatewayStore.getState().transform;
    if (!active) {
      arcMat.opacity = 0;
      tickMat.opacity = 0;
      return;
    }
    const reveal = legReveal(paintProgress);
    const depthOpacity = depthOpacityForWorldPosition(paintProgress, pos, depthWindow);
    const base =
      depthOpacity *
      reveal *
      parkDwellVisibility(paintProgress) *
      getBuildApproachFade(paintProgress);
    arcMat.opacity = base * 0.45;
    tickMat.opacity = base * 0.7;
  });

  return (
    <group>
      <primitive object={arcObject} />
      <primitive object={ticksObject} />
    </group>
  );
}

function VectorShard({ pos, dir, length, color = DAWN_HEX }: Omit<VectorShardArtifact, "kind">) {
  const { lineGeom, diamondGeom, endPos } = useMemo(() => {
    const dirVec = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
    const end: [number, number, number] = [
      pos[0] + dirVec.x * length,
      pos[1] + dirVec.y * length,
      pos[2] + dirVec.z * length,
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(dirVec.x * length, dirVec.y * length, dirVec.z * length),
    ]);
    const r = 0.028;
    const diamondGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, r, 0),
      new THREE.Vector3(r, 0, 0),
      new THREE.Vector3(0, -r, 0),
      new THREE.Vector3(-r, 0, 0),
      new THREE.Vector3(0, r, 0),
    ]);
    return { lineGeom: lineGeo, diamondGeom: diamondGeo, endPos: end };
  }, [pos, dir, length]);

  const lineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    [color]
  );

  const diamondMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
    [color]
  );

  const depthWindow = useMemo(
    () => ({
      near: 0.4,
      nearFade: 0.5,
      far: 5.4,
      farFade: 1.4,
    }),
    []
  );

  // Sample depth at the midpoint so a vector spanning the near plane
  // still resolves to a sensible single opacity.
  const midpoint = useMemo<[number, number, number]>(
    () => [(pos[0] + endPos[0]) / 2, (pos[1] + endPos[1]) / 2, (pos[2] + endPos[2]) / 2],
    [pos, endPos]
  );

  // R3F `<line>` collides with SVG `<line>` in TSX; build the line
  // as a `THREE.Line` instance and mount via `<primitive>`.
  const lineObject = useMemo(() => {
    const line = new THREE.Line(lineGeom, lineMat);
    line.position.set(pos[0], pos[1], pos[2]);
    return line;
  }, [lineGeom, lineMat, pos]);

  useEffect(() => {
    return () => {
      lineGeom.dispose();
      diamondGeom.dispose();
      lineMat.dispose();
      diamondMat.dispose();
    };
  }, [lineGeom, diamondGeom, lineMat, diamondMat]);

  useFrame(() => {
    const { paintProgress, active } = useDepthGatewayStore.getState().transform;
    if (!active) {
      lineMat.opacity = 0;
      diamondMat.opacity = 0;
      return;
    }
    const reveal = legReveal(paintProgress);
    const depthOpacity = depthOpacityForWorldPosition(paintProgress, midpoint, depthWindow);
    const base =
      depthOpacity *
      reveal *
      parkDwellVisibility(paintProgress) *
      getBuildApproachFade(paintProgress);
    lineMat.opacity = base * 0.6;
    diamondMat.opacity = base * 0.85;
  });

  return (
    <group>
      <primitive object={lineObject} />
      <lineLoop geometry={diamondGeom} material={diamondMat} position={pos} />
      <lineLoop geometry={diamondGeom} material={diamondMat} position={endPos} />
    </group>
  );
}

// ── Root component ─────────────────────────────────────────────

export function LatentTopographyContours() {
  // Skip mounting on mobile-narrow viewports — peripheral shards
  // would crowd the already-tight copy layout. Camera path is the
  // same on every viewport so spatial anchoring isn't lost.
  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 760;
  }, []);

  if (!enabled) return null;

  return (
    <group>
      {ARTIFACTS.map((a, i) => {
        if (a.kind === "contour") {
          return (
            <ContourShard
              key={`contour-${i}`}
              pos={a.pos}
              outerRadius={a.outerRadius}
              aspect={a.aspect}
              rotation={a.rotation}
              rings={a.rings}
              color={a.color}
            />
          );
        }
        if (a.kind === "ridge") {
          return (
            <RidgeShard
              key={`ridge-${i}`}
              pos={a.pos}
              arcRadius={a.arcRadius}
              bow={a.bow}
              rotation={a.rotation}
              tickCount={a.tickCount}
              color={a.color}
            />
          );
        }
        return (
          <VectorShard key={`vec-${i}`} pos={a.pos} dir={a.dir} length={a.length} color={a.color} />
        );
      })}
    </group>
  );
}
