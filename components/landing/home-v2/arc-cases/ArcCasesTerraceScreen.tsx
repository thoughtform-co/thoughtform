"use client";

/**
 * ArcCasesTerraceScreen — ONE landscape device-slab screen that rises
 * out of the substrate topography at the Build park, showing one
 * production case (Mímir / Vesper / Babylon / Heimdall) at a time
 * (ADR-034 — supersedes the ADR-033 orbit ring).
 *
 * Ownership model (the ADR-033 grammar, carried over):
 *   - CLICK-owned, not scroll-owned. `arcCasesStore` holds `armed` +
 *     the front `slot`; a damped ARM LEVEL (the terrace's only clock)
 *     drives the rise-from-the-ground envelope, the camera's lateral
 *     shift (via `arcCasesLevelRef` — this useFrame is the ref's
 *     SINGLE WRITER, at priority −5 so the level lands before the
 *     camera rig and the topography read it in the same frame), and
 *     the substrate realm boost. Disarm plays everything backwards.
 *   - Scroll GATES rather than drives: `bandGetter` (production: the
 *     Build-band × epilogue-kill × dissipate-guard product assembled
 *     in `ArcCasesTerraceGate`) multiplies presence, so walking out of
 *     the Build park collapses the terrace no matter what the store
 *     says.
 *   - Bake is DEFERRED: faces bake when the Build band first opens (or
 *     on first arm), so visitors who never reach the park never fetch
 *     the case screenshots. Labs pass `preload` for immediate faces.
 *   - Content steps by CROSSFADE (two stacked content planes, the
 *     incoming face damps in over the settled one) — no rotation, no
 *     wall-clock term anywhere (ADR-021).
 *
 * The screen is WORLD-FIXED (a sibling of `SubstrateTopography`, NOT
 * part of the pointer-look instrument): it stands ON the actual
 * heightfield (`terrainGroundY`) to the right of the shifted camera
 * axis. While rising, nothing writes depth, so the terrain dots show
 * through the translucent slab (the "emerging from the ground" read);
 * once settled, the content plane writes depth (hysteresis at
 * opacity 0.55) and occludes cleanly. The whole group renders BELOW
 * renderOrder 0 so nearer terrain rows (drawn later) still paint over
 * the slab while it is translucent.
 */

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { SERVICES_GOLD } from "@/lib/home-v2/goldPalette";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";
import { arcCasesLevelRef } from "@/lib/arc-cases/arcCasesLevelRef";
import {
  ARC_ARM_RATE,
  TERRACE_CROSSFADE_RATE,
  TERRACE_RISE_DEPTH,
  dampLevel,
  terraceRiseEnvelope,
} from "@/lib/arc-cases/terraceMath";
import {
  RING_EDGE_GLINT_OPACITY,
  RING_GLASS_EDGE_OPACITY,
  RING_GLASS_OPACITY,
} from "@/lib/services-ring/ringMath";
import { INT_Z, terrainGroundY } from "../DepthGatewayScene/substrateTerrain";
import {
  TERRACE_BAKE_H,
  TERRACE_BAKE_W,
  TERRACE_DOT_PITCH,
  bakeCaseScreenFace,
  buildGlowCanvas,
  buildTerraceVeilCanvas,
  loadImage,
  waitForCardFonts,
} from "./caseScreenBake";

/** Wall-clock gap treated as an idle resume (the ADR-029 Update-5
 *  conditional snap — never on ordinary frame hitches). */
const RESUME_IDLE_GAP_MS = 500;

/* ── World placement (lab-tunable defaults) ─────────────────────── */

/** Screen centre X — right of the shifted camera axis (camera parks at
 *  x ≈ ARC_CAM_SHIFT_X = 2.1 while armed). */
export const TERRACE_X = 3.05;
/** Screen centre Z — over the terrain's near rows, ~8.8 in front of
 *  the park camera. */
export const TERRACE_Z = INT_Z - 2.6;
/** Slab content width (world units); 16:10 like the bake. */
export const TERRACE_W = 4.35;
export const TERRACE_H = TERRACE_W * (TERRACE_BAKE_H / TERRACE_BAKE_W);
/** Parked bottom edge floats a hair above the terrain dots. */
export const TERRACE_GROUND_CLEAR = 0.12;
/** Faces the shifted camera axis (screen sits slightly right of it). */
export const TERRACE_YAW = -0.1;
/** Leans back a touch — planted in the landscape, not billboarded. */
export const TERRACE_PITCH = -0.05;

/* ── Device-slab proportions — the ring's anatomy re-scaled to the
   terrace's world size (the ring's constants live in its own
   orbit-config space; fractions carry, absolute sizes re-derive). ── */

const TERRACE_SLAB_DEPTH = 0.085;
const TERRACE_BEZEL = 0.09;
const TERRACE_CONTENT_LIFT = 0.012;
/** Chamfer cut in world units — the bake's 52px cut carried through
 *  the content-plane scale so the slab cut aligns with the baked
 *  face's chamfered corners. */
const TERRACE_CHAMFER = (52 / TERRACE_BAKE_W) * TERRACE_W;

/** Under-screen ground glow (optional polish; masterOpacity-scaled). */
const TERRACE_GROUND_GLOW_OPACITY = 0.12;

export interface ArcCasesTerraceScreenProps {
  /** Scroll-owned visibility gate 0..1 (Build band × epilogue kill ×
   *  dissipate guard), assembled at the mount. Default 1 (labs). */
  bandGetter?: () => number;
  /** Bake the faces immediately (labs). Production defers the bake
   *  until the band first opens or the store first arms. */
  preload?: boolean;
  /** Drive the arm level directly (lab slider). Null = the real path:
   *  damped toward the store's `armed`. */
  levelOverride?: number | null;
  /* Look-dev tunables — defaults are the shipped constants. */
  x?: number;
  z?: number;
  width?: number;
  yaw?: number;
  pitch?: number;
  groundClear?: number;
  riseDepth?: number;
  armRate?: number;
  crossfadeRate?: number;
  /** Ground glow under the screen footprint (default off). */
  groundGlow?: boolean;
}

export function ArcCasesTerraceScreen({
  bandGetter,
  preload = false,
  levelOverride = null,
  x = TERRACE_X,
  z = TERRACE_Z,
  width = TERRACE_W,
  yaw = TERRACE_YAW,
  pitch = TERRACE_PITCH,
  groundClear = TERRACE_GROUND_CLEAR,
  riseDepth = TERRACE_RISE_DEPTH,
  armRate = ARC_ARM_RATE,
  crossfadeRate = TERRACE_CROSSFADE_RATE,
  groundGlow = false,
}: ArcCasesTerraceScreenProps) {
  const height = width * (TERRACE_BAKE_H / TERRACE_BAKE_W);

  const [bakeRequested, setBakeRequested] = useState(preload);
  const [textures, setTextures] = useState<THREE.CanvasTexture[] | null>(null);

  const groupRef = useRef<THREE.Group | null>(null);
  const armLevelRef = useRef(0);
  const lastWallRef = useRef(-1);
  /** Settled face slot + the crossfade toward an incoming one. */
  const settledSlotRef = useRef(0);
  const incomingSlotRef = useRef<number | null>(null);
  const fadeRef = useRef(0);
  const depthWriteRef = useRef(false);

  /** Grounded ONCE from the actual heightfield — no per-frame cost. */
  const parkedY = useMemo(
    () => terrainGroundY(x, z) + height / 2 + groundClear,
    [x, z, height, groundClear]
  );

  /* ── Geometry ── */
  const slabW = width + TERRACE_BEZEL * 2;
  const slabH = height + TERRACE_BEZEL * 2;
  const slabGeometry = useMemo(() => {
    const ch = TERRACE_CHAMFER;
    const hw = slabW / 2;
    const hh = slabH / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-hw, hh);
    shape.lineTo(hw - ch, hh);
    shape.lineTo(hw, hh - ch);
    shape.lineTo(hw, -hh);
    shape.lineTo(-hw + ch, -hh);
    shape.lineTo(-hw, -hh + ch);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: TERRACE_SLAB_DEPTH,
      bevelEnabled: false,
    });
    geometry.translate(0, 0, -TERRACE_SLAB_DEPTH / 2);
    return geometry;
  }, [slabW, slabH]);
  const glintGeometry = useMemo(() => new THREE.EdgesGeometry(slabGeometry), [slabGeometry]);
  useEffect(() => {
    return () => {
      slabGeometry.dispose();
      glintGeometry.dispose();
    };
  }, [slabGeometry, glintGeometry]);

  /* ── Textures ── */
  const veilTexture = useMemo(() => {
    const texture = new THREE.CanvasTexture(buildTerraceVeilCanvas());
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(TERRACE_BAKE_W / TERRACE_DOT_PITCH, 1);
    return texture;
  }, []);
  const glowTexture = useMemo(() => {
    const texture = new THREE.CanvasTexture(buildGlowCanvas());
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => {
    return () => {
      veilTexture.dispose();
      glowTexture.dispose();
    };
  }, [veilTexture, glowTexture]);

  /* ── Materials ── */
  const materials = useMemo(() => {
    const shared = {
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      toneMapped: false,
    } as const;
    return {
      slabCaps: new THREE.MeshBasicMaterial({
        ...shared,
        color: new THREE.Color("#14110c"),
        side: THREE.FrontSide,
      }),
      slabWalls: new THREE.MeshBasicMaterial({
        ...shared,
        color: new THREE.Color(SERVICES_GOLD),
        side: THREE.FrontSide,
      }),
      glint: new THREE.LineBasicMaterial({
        color: new THREE.Color(SERVICES_GOLD),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
      /** Settled face. */
      contentBack: new THREE.MeshBasicMaterial({ ...shared, side: THREE.DoubleSide }),
      /** Incoming face (crossfade). */
      contentFront: new THREE.MeshBasicMaterial({ ...shared, side: THREE.DoubleSide }),
      veil: new THREE.MeshBasicMaterial({ ...shared, map: veilTexture }),
      groundGlow: new THREE.MeshBasicMaterial({ ...shared, map: glowTexture }),
    };
  }, [veilTexture, glowTexture]);
  useEffect(() => {
    return () => {
      for (const material of Object.values(materials)) material.dispose();
    };
  }, [materials]);

  /* ── Deferred bake ── */
  // Arm from the store even before the band opens (a first click can
  // precede the band getter's rise on teleport jumps).
  useEffect(() => {
    if (bakeRequested) return;
    if (useArcCasesStore.getState().armed) {
      setBakeRequested(true);
      return;
    }
    return useArcCasesStore.subscribe((s) => {
      if (s.armed) setBakeRequested(true);
    });
  }, [bakeRequested]);

  // Bake the four faces once requested (fonts + screenshots awaited; a
  // glEpoch canvas remount re-runs this effect and re-bakes).
  useEffect(() => {
    if (!bakeRequested) return;
    let disposed = false;
    (async () => {
      await waitForCardFonts();
      const baked = await Promise.all(
        PROJECT_CASES.map(async (projectCase) => {
          let img: HTMLImageElement | null = null;
          try {
            img = await loadImage(projectCase.image.src);
          } catch {
            img = null; // schematic fallback keeps the screen whole
          }
          return bakeCaseScreenFace(projectCase, img);
        })
      );
      if (disposed) return;
      setTextures(
        baked.map((canvas) => {
          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = 8;
          texture.needsUpdate = true;
          return texture;
        })
      );
    })();
    return () => {
      disposed = true;
    };
  }, [bakeRequested]);

  useEffect(() => {
    if (!textures) return;
    // Seed the settled face (and keep it valid across re-bakes).
    materials.contentBack.map = textures[settledSlotRef.current];
    materials.contentBack.needsUpdate = true;
    return () => {
      for (const texture of textures) texture.dispose();
    };
  }, [textures, materials]);

  // Reset the cross-tree level when the screen unmounts (media gate
  // flip / glEpoch remount) — the camera shift must never outlive its
  // writer.
  useEffect(() => {
    return () => {
      arcCasesLevelRef.current.level = 0;
    };
  }, []);

  /* ── The single writer — priority −5: after MotionFollowerDriver
     (−10), BEFORE FlyingCameraRig and SubstrateTopography (0), so the
     camera and the terrain read this frame's level, not last frame's. ── */
  useFrame((_, delta) => {
    const now = performance.now();
    const gap = lastWallRef.current < 0 ? Infinity : now - lastWallRef.current;
    lastWallRef.current = now;
    const resumed = gap > RESUME_IDLE_GAP_MS;

    const { armed, slot } = useArcCasesStore.getState();

    // The arm level — the terrace's one clock. Damped toward the store
    // (or driven directly by the lab override); an idle resume snaps it
    // (a half-played envelope after a frameloop sleep reads as
    // self-motion).
    if (levelOverride !== null) {
      armLevelRef.current = Math.max(0, Math.min(1, levelOverride));
    } else {
      const target = armed ? 1 : 0;
      armLevelRef.current = resumed
        ? target
        : dampLevel(armLevelRef.current, target, delta, armRate);
      if (armLevelRef.current < 0.001 && !armed) armLevelRef.current = 0;
      if (armLevelRef.current > 0.999 && armed) armLevelRef.current = 1;
    }

    // Scroll-owned gate — collapses the terrace off-band regardless of
    // the store (belt-and-suspenders under the CTA's auto-disarm
    // watcher). Published for the camera rig, the DOM tracker, the
    // topography boost, and the CTA stepper.
    const band = bandGetter ? bandGetter() : 1;
    const eff = armLevelRef.current * band;
    arcCasesLevelRef.current.level = eff;

    // Deferred bake: kick the face bake as soon as the Build band
    // opens, so the textures are ready before the visitor can click.
    if (!bakeRequested && band > 0.01) setBakeRequested(true);

    const group = groupRef.current;
    if (!group) return;

    // Rise + fade off the RAW arm level; the band multiplies opacity
    // only (a scroll-out mid-arm fades in place rather than re-burying).
    const env = terraceRiseEnvelope(armLevelRef.current);
    group.position.y = parkedY - (1 - env.riseT) * riseDepth;
    const master = env.opacity * band;
    group.visible = master > 0.004;

    // Content crossfade — the incoming face damps in over the settled
    // one; rapid stepping just retargets the same damp (no queue).
    if (textures) {
      if (incomingSlotRef.current === null) {
        if (slot !== settledSlotRef.current) {
          incomingSlotRef.current = slot;
          fadeRef.current = 0;
          materials.contentFront.map = textures[slot];
          materials.contentFront.needsUpdate = true;
        }
      } else if (slot !== incomingSlotRef.current) {
        incomingSlotRef.current = slot;
        materials.contentFront.map = textures[slot];
        materials.contentFront.needsUpdate = true;
      }
      if (incomingSlotRef.current !== null) {
        fadeRef.current = resumed ? 1 : dampLevel(fadeRef.current, 1, delta, crossfadeRate);
        if (fadeRef.current >= 0.999) {
          settledSlotRef.current = incomingSlotRef.current;
          materials.contentBack.map = textures[settledSlotRef.current];
          materials.contentBack.needsUpdate = true;
          incomingSlotRef.current = null;
          fadeRef.current = 0;
        }
      }
    }

    materials.slabCaps.opacity = RING_GLASS_OPACITY * master;
    materials.slabWalls.opacity = RING_GLASS_EDGE_OPACITY * master;
    materials.glint.opacity = RING_EDGE_GLINT_OPACITY * master;
    materials.contentBack.opacity = master;
    materials.contentFront.opacity =
      incomingSlotRef.current !== null ? master * fadeRef.current : 0;
    materials.veil.opacity = master;
    materials.groundGlow.opacity = groundGlow ? TERRACE_GROUND_GLOW_OPACITY * eff : 0;

    // Depth-write hysteresis on the SETTLED content plane only: while
    // rising/translucent the terrain dots show through (the emerge
    // read); once settled the opaque face occludes cleanly.
    const write = master > 0.55;
    if (write !== depthWriteRef.current) {
      materials.contentBack.depthWrite = write;
      depthWriteRef.current = write;
    }
  }, -5);

  if (!textures) return null;

  return (
    <group
      ref={groupRef}
      position={[x, parkedY - riseDepth, z]}
      rotation={[pitch, yaw, 0]}
      visible={false}
    >
      {/* Whole slab renders BELOW 0 so later-drawn terrain rows still
          paint over it while translucent; the settled content plane's
          depth write handles occlusion once solid. */}
      <mesh
        renderOrder={-0.24}
        geometry={slabGeometry}
        material={[materials.slabCaps, materials.slabWalls]}
        frustumCulled={false}
      />
      <lineSegments
        renderOrder={-0.22}
        geometry={glintGeometry}
        material={materials.glint}
        frustumCulled={false}
      />
      <mesh
        renderOrder={-0.2}
        position={[0, 0, TERRACE_SLAB_DEPTH / 2 + TERRACE_CONTENT_LIFT]}
        material={materials.contentBack}
        frustumCulled={false}
      >
        <planeGeometry args={[width, height]} />
      </mesh>
      <mesh
        renderOrder={-0.196}
        position={[0, 0, TERRACE_SLAB_DEPTH / 2 + TERRACE_CONTENT_LIFT + 0.004]}
        material={materials.contentFront}
        frustumCulled={false}
      >
        <planeGeometry args={[width, height]} />
      </mesh>
      <mesh
        renderOrder={-0.18}
        position={[0, 0, TERRACE_SLAB_DEPTH / 2 + TERRACE_CONTENT_LIFT + 0.008]}
        material={materials.veil}
        frustumCulled={false}
      >
        <planeGeometry args={[width, height]} />
      </mesh>
      {/* Ground glow — flat on the terrain under the screen footprint
          (local space: undo the group pitch so it lies on the ground). */}
      {groundGlow && (
        <mesh
          renderOrder={-0.26}
          position={[0, -height / 2 - TERRACE_GROUND_CLEAR + 0.02, 0.1]}
          rotation={[-Math.PI / 2 - TERRACE_PITCH, 0, 0]}
          material={materials.groundGlow}
          frustumCulled={false}
        >
          <planeGeometry args={[width * 1.4, width * 0.5]} />
        </mesh>
      )}
    </group>
  );
}
