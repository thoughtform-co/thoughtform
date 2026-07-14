"use client";

/**
 * ArcCasesCard — ONE in-canvas 3D portrait tools card (the ADR-029/033
 * device-slab grammar) mounted between the two Build-park stack columns,
 * in front of the accretion sphere (ADR-036 — supersedes the ADR-035 DOM
 * overlay). The four production cases (Mímir / Vesper / Babylon / Heimdall)
 * crossfade through this one slab.
 *
 * WHY IN-CANVAS: the ADR-035 reveal was a fixed DOM overlay whose middle
 * "just floated" while the node streams latched onto its screen-rect
 * borders via per-frame viewport unprojection. This replaces it with a real
 * 3D object in shared world space — a glass slab with gold side walls and a
 * baked face — so the source/surface streams fold onto the card's ACTUAL
 * left/right side walls by DIRECT shell-local math. The card is a rigid
 * child of the same `gyroAssembly` group the streams live in, so when the
 * assembly banks with the pointer the card and the folded lines bank
 * together and the latch stays welded for free (no unprojection, no
 * panelRect, no live-camera re-solve — all retired with the overlay).
 *
 * Ownership model (carried from the terrace / ring):
 *   - CLICK-owned, not scroll-owned. `arcCasesStore` holds `armed` + the
 *     front `slot`. A damped ARM LEVEL (the card's only clock) drives the
 *     materialize (opacity ramp + slight scale-in) and the fold (published
 *     via `arcCasesLevelRef`; this useFrame at priority −5 is the ref's
 *     SINGLE WRITER, before ShellStack folds at 0 — no two-rAF lag).
 *   - Scroll GATES rather than drives: `bandGetter` (production: Build-band
 *     × epilogue-kill × dissipate-guard) multiplies presence, so walking
 *     out of the Build band collapses the card no matter what the store
 *     says.
 *   - Bake is DEFERRED: faces bake when the Build band first opens (or on
 *     first arm). Content steps by CROSSFADE (two stacked content planes,
 *     the terrace pattern) — no rotation, no wall-clock term (ADR-021).
 *
 * DEVICE ANATOMY, renderOrder (< 1, so the brandmark point pass at 1 and
 * the terrain layer composite correctly), depth-write hysteresis on the
 * settled content plane only, opaque-void chamfers, NormalBlending:
 * identical to the ring — see ArcCasesRing @ 55afc8a for the full rationale.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { SERVICES_GOLD } from "@/lib/home-v2/goldPalette";
import { arcCasesLevelRef } from "@/lib/arc-cases/arcCasesLevelRef";
import {
  ARC_ARM_RATE,
  arcBandFactor,
  arcCardPresence,
  dampLevel,
} from "@/lib/arc-cases/arcCasesMath";
import { getCardGeometry } from "@/lib/arc-cases/cardLayout";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  RING_CONTENT_LIFT,
  RING_EDGE_GLINT_OPACITY,
  RING_GLASS_EDGE_OPACITY,
  RING_GLASS_OPACITY,
  RING_GLOW_OPACITY,
} from "@/lib/services-ring/ringMath";
import {
  getSmoothedDissipate,
  getSmoothedEpilogueProgress,
} from "../DepthGatewayScene/motionFollower";
import { getStackColumnLocalX } from "../DepthGatewayScene/sceneGeom";
import { ARC_CASES_MEDIA } from "../arcCasesCard";
import {
  BAKE_W,
  DOT_PITCH,
  bakeCaseCardFace,
  buildGlowCanvas,
  buildVeilCanvas,
  loadImage,
  waitForCardFonts,
} from "./caseCardBake";

/** Wall-clock gap treated as an idle resume (the ADR-029 Update-5
 *  conditional snap — never on ordinary frame hitches). */
const RESUME_IDLE_GAP_MS = 500;

/** Content-face crossfade rate (per second) — the terrace value. */
const CARD_CROSSFADE_RATE = 6;

/** Scale-in floor as the card materializes (0.94 → 1 across the arm). */
const CARD_SCALE_IN_FROM = 0.94;

/** Depth-write hysteresis on the SETTLED content plane (master presence):
 *  translucent while materializing (the sphere shows through — the emerge
 *  read), opaque once settled so it occludes cleanly. The terrace pair. */
const CARD_DEPTH_WRITE_ON = 0.82;
const CARD_DEPTH_WRITE_OFF = 0.68;

/** Behind-slab glow plane proportions (the ring's slabW×1.7 / slabH×1.35). */
const GLOW_W_MUL = 1.7;
const GLOW_H_MUL = 1.35;

/**
 * Production band assembly — carried verbatim from the retired
 * `ArcCasesTerminal.terminalBand()`:
 *   `arcBandFactor(paintProgress, epilogue)` — Build-band rise × epilogue
 *     kill (the exclusivity contract vs the services ring), ×
 *   `(1 − smootherstep(0, 0.15, dissipate))` — the corridor-exit
 *     zoom-dissipate guard. The lab passes `() => 1` to isolate the arm
 *     envelope.
 */
function cardBand(): number {
  const { paintProgress } = useDepthGatewayStore.getState().transform;
  const dissipate = getSmoothedDissipate();
  const dissipateGuard = 1 - smootherstep01(0, 0.15, dissipate);
  return arcBandFactor(paintProgress, getSmoothedEpilogueProgress()) * dissipateGuard;
}

function smootherstep01(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export interface ArcCasesCardProps {
  /** Scroll-owned visibility gate 0..1 (Build band × epilogue kill ×
   *  dissipate guard), assembled at the mount. Default = production. */
  bandGetter?: () => number;
  /** Bake the faces immediately (labs). Production defers. */
  preload?: boolean;
  /** Drive the arm level directly (lab slider). Null = the real path. */
  levelOverride?: number | null;
  /** Look-dev override for the column half-span (lab). */
  colXOverride?: number | null;
  crossfadeRate?: number;
  armRate?: number;
}

function ArcCasesCardOverlay({
  bandGetter = cardBand,
  preload = false,
  levelOverride = null,
  colXOverride = null,
  crossfadeRate = CARD_CROSSFADE_RATE,
  armRate = ARC_ARM_RATE,
}: ArcCasesCardProps) {
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);

  const liveAspect = size.height > 0 ? size.width / size.height : 16 / 9;
  const colX = colXOverride ?? getStackColumnLocalX(liveAspect);
  const geometry = useMemo(() => getCardGeometry(colX), [colX]);

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

  /* ── Slab geometry (chamfered ExtrudeGeometry, depth centered) ── */
  const slabGeometry = useMemo(() => {
    const ch = geometry.chamfer;
    const hw = geometry.slabWidth / 2;
    const hh = geometry.slabHeight / 2;
    const shape = new THREE.Shape();
    shape.moveTo(-hw, hh);
    shape.lineTo(hw - ch, hh);
    shape.lineTo(hw, hh - ch);
    shape.lineTo(hw, -hh);
    shape.lineTo(-hw + ch, -hh);
    shape.lineTo(-hw, -hh + ch);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: geometry.slabDepth, bevelEnabled: false });
    g.translate(0, 0, -geometry.slabDepth / 2);
    return g;
  }, [geometry]);
  const glintGeometry = useMemo(() => new THREE.EdgesGeometry(slabGeometry), [slabGeometry]);
  useEffect(() => {
    return () => {
      slabGeometry.dispose();
      glintGeometry.dispose();
    };
  }, [slabGeometry, glintGeometry]);

  /* ── Textures ── */
  const veilTexture = useMemo(() => {
    const texture = new THREE.CanvasTexture(buildVeilCanvas());
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(BAKE_W / DOT_PITCH, 1);
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
      // Extruded slab: [front/back caps #14110c, side walls SERVICES_GOLD].
      slab: [
        new THREE.MeshBasicMaterial({
          ...shared,
          color: new THREE.Color("#14110c"),
          side: THREE.FrontSide,
        }),
        new THREE.MeshBasicMaterial({
          ...shared,
          color: new THREE.Color(SERVICES_GOLD),
          side: THREE.FrontSide,
        }),
      ] as [THREE.MeshBasicMaterial, THREE.MeshBasicMaterial],
      glint: new THREE.LineBasicMaterial({
        color: new THREE.Color(SERVICES_GOLD),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
      }),
      glow: new THREE.MeshBasicMaterial({ ...shared, map: glowTexture }),
      /** Settled face. */
      contentBack: new THREE.MeshBasicMaterial({ ...shared, side: THREE.DoubleSide }),
      /** Incoming face (crossfade). */
      contentFront: new THREE.MeshBasicMaterial({ ...shared, side: THREE.DoubleSide }),
      veil: new THREE.MeshBasicMaterial({ ...shared, map: veilTexture }),
    };
  }, [veilTexture, glowTexture]);
  useEffect(() => {
    return () => {
      for (const material of materials.slab) material.dispose();
      materials.glint.dispose();
      materials.glow.dispose();
      materials.contentBack.dispose();
      materials.contentFront.dispose();
      materials.veil.dispose();
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
            img = null; // schematic fallback keeps the card whole
          }
          return bakeCaseCardFace(projectCase, img);
        })
      );
      if (disposed) return;
      const maxAniso = gl.capabilities.getMaxAnisotropy?.() ?? 1;
      setTextures(
        baked.map((canvas) => {
          const texture = new THREE.CanvasTexture(canvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = Math.min(8, maxAniso);
          texture.needsUpdate = true;
          return texture;
        })
      );
    })();
    return () => {
      disposed = true;
    };
  }, [gl, bakeRequested]);

  useEffect(() => {
    if (!textures) return;
    // Seed the settled face (and keep it valid across re-bakes).
    materials.contentBack.map = textures[settledSlotRef.current];
    materials.contentBack.needsUpdate = true;
    return () => {
      for (const texture of textures) texture.dispose();
    };
  }, [textures, materials]);

  // Publish the slab side-wall edges (shell-local) so ShellStack folds the
  // node streams onto them by direct math. Rigid in the shared space, so
  // this republishes only when the geometry changes (aspect / colX), never
  // per frame. Null the edges (and the level) on unmount so a torn-down
  // card never leaves ShellStack folding onto stale edges.
  useEffect(() => {
    arcCasesLevelRef.current.cardEdges = {
      leftX: geometry.leftEdgeX,
      rightX: geometry.rightEdgeX,
      centerY: geometry.centerY,
      halfHeight: geometry.halfHeight,
      z: geometry.z,
    };
    return () => {
      arcCasesLevelRef.current.cardEdges = null;
    };
  }, [geometry]);

  // Reset the cross-tree level when the card unmounts (media gate flip /
  // glEpoch remount) — the fold must never outlive its writer.
  useEffect(() => {
    return () => {
      arcCasesLevelRef.current.level = 0;
      arcCasesLevelRef.current.cardPresence = 0;
    };
  }, []);

  /* ── The single level writer — priority −5: BEFORE ShellStack folds at 0
     so the fold reads THIS frame's level (no two-rAF lag). ── */
  useFrame((_, delta) => {
    const now = performance.now();
    const gap = lastWallRef.current < 0 ? Infinity : now - lastWallRef.current;
    lastWallRef.current = now;
    const resumed = gap > RESUME_IDLE_GAP_MS;

    const { armed, slot } = useArcCasesStore.getState();

    // The arm level — the card's one clock. Damped toward the store (or the
    // lab override); an idle resume snaps it (a half-played envelope after a
    // frameloop sleep reads as self-motion).
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

    // Scroll-owned gate — collapses the card off-band regardless of the
    // store (belt-and-suspenders under the CTA's auto-disarm watcher).
    const band = bandGetter();
    const master = armLevelRef.current * band;
    arcCasesLevelRef.current.level = master;

    // Phase split (ADR-041): the fold reads `arcFoldInput(master)` (in
    // ShellStack) and lands FIRST; the CARD reads this later `cardPresence`
    // window, so the slab only materializes into the frame the nodes made.
    // Published on the ref by this single writer so no reader recomputes it.
    const cardPresence = arcCardPresence(master);
    arcCasesLevelRef.current.cardPresence = cardPresence;

    // Deferred bake: kick as soon as the Build band opens.
    if (!bakeRequested && band > 0.01) setBakeRequested(true);

    const group = groupRef.current;
    if (!group) return;

    // Materialize: opacity ramp + a slight scale-in. Both ride the phased
    // card presence (a scroll-out mid-arm fades in place — presence is a
    // pure function of the master, which already folds in the band).
    const scaleIn = CARD_SCALE_IN_FROM + (1 - CARD_SCALE_IN_FROM) * cardPresence;
    group.scale.setScalar(scaleIn);
    group.visible = cardPresence > 0.004;

    // Content crossfade — the incoming face damps in over the settled one;
    // rapid stepping just retargets the same damp (no queue).
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

    materials.slab[0].opacity = RING_GLASS_OPACITY * cardPresence;
    materials.slab[1].opacity = RING_GLASS_EDGE_OPACITY * cardPresence;
    materials.glint.opacity = RING_EDGE_GLINT_OPACITY * cardPresence;
    materials.glow.opacity = RING_GLOW_OPACITY * cardPresence;
    materials.contentBack.opacity = cardPresence;
    materials.contentFront.opacity =
      incomingSlotRef.current !== null ? cardPresence * fadeRef.current : 0;
    materials.veil.opacity = cardPresence;

    // Depth-write hysteresis on the SETTLED content plane only: translucent
    // while materializing (sphere shows through), opaque once settled.
    if (!depthWriteRef.current && cardPresence >= CARD_DEPTH_WRITE_ON) {
      materials.contentBack.depthWrite = true;
      depthWriteRef.current = true;
    } else if (depthWriteRef.current && cardPresence <= CARD_DEPTH_WRITE_OFF) {
      materials.contentBack.depthWrite = false;
      depthWriteRef.current = false;
    }
  }, -5);

  if (!textures) return null;

  const contentZ = geometry.slabDepth / 2 + RING_CONTENT_LIFT;

  return (
    <group ref={groupRef} position={[0, geometry.centerY, geometry.z]} visible={false}>
      {/* Behind-slab halo. */}
      <mesh
        renderOrder={-0.1}
        position={[0, 0, -(geometry.slabDepth / 2 + 0.01)]}
        material={materials.glow}
        frustumCulled={false}
      >
        <planeGeometry args={[geometry.slabWidth * GLOW_W_MUL, geometry.slabHeight * GLOW_H_MUL]} />
      </mesh>
      {/* Chamfered glass slab — caps + gold side walls. */}
      <mesh
        renderOrder={0}
        geometry={slabGeometry}
        material={materials.slab}
        frustumCulled={false}
      />
      {/* Hairline edge glint. */}
      <lineSegments
        renderOrder={0.05}
        geometry={glintGeometry}
        material={materials.glint}
        frustumCulled={false}
      />
      {/* Settled content face. */}
      <mesh
        renderOrder={0.1}
        position={[0, 0, contentZ]}
        material={materials.contentBack}
        frustumCulled={false}
      >
        <planeGeometry args={[geometry.contentWidth, geometry.contentHeight]} />
      </mesh>
      {/* Incoming content face (crossfade). */}
      <mesh
        renderOrder={0.11}
        position={[0, 0, contentZ + 0.003]}
        material={materials.contentFront}
        frustumCulled={false}
      >
        <planeGeometry args={[geometry.contentWidth, geometry.contentHeight]} />
      </mesh>
      {/* Dot-matrix hologram veil. */}
      <mesh
        renderOrder={0.12}
        position={[0, 0, contentZ + 0.006]}
        material={materials.veil}
        frustumCulled={false}
      >
        <planeGeometry args={[geometry.contentWidth, geometry.contentHeight]} />
      </mesh>
    </group>
  );
}

/**
 * Capability gate — matchMedia on `ARC_CASES_MEDIA` (== the CSS hide of the
 * CTA dock + stepper; gate parity). Renders `null` when not capable so the
 * card (and its useFrame + published edges) never exist off-desktop.
 * `bandGetter` defaults to the production band assembly; the lab passes
 * `() => 1`.
 */
export function ArcCasesCardGate(props: ArcCasesCardProps) {
  const [capable, setCapable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia(ARC_CASES_MEDIA);
    const update = () => setCapable(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (!capable) return null;
  return <ArcCasesCardOverlay {...props} />;
}
