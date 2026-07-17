"use client";

/**
 * CorridorArmillary — the #services orbit armillary, mounted INSIDE the corridor
 * canvas around the parked brandmark core (2026-06-25 unification).
 *
 * Previously the orbit armillary lived in the standalone `#services` R3F canvas
 * (`ServicesHologramScene`) and wrapped a SECOND brandmark wireframe that
 * cross-dissolved with the corridor core. Now the corridor core IS the
 * centerpiece; this component renders just the orbits as children of the core's
 * group (see `BrandmarkPhysicsCoreActor`), so they inherit the core's
 * camera-front placement + billboard + drift + scale and depth-interleave with
 * the core's points — one anchored instrument, no swap.
 *
 * Reveal rides the shared corridor-exit dissipate clock (the orbits' own
 * `entrance="scroll"` reads `--corridor-dissipate`), so the rings wrap on as the
 * mark settles, identical to the old #services entrance.
 *
 * Scan anchors (2026-07-02): the CV-scan leader lines target points ON the
 * brandmark wireframe itself — per-service group-local points derived from the
 * sampled GLB homes (`brandmarkScanAnchorPointsRef`, written by
 * `BrandmarkPhysicsCoreWithGLB`). This component projects them to screen pixels
 * each frame via a probe group that shares the mark's `pointerLookRef` space,
 * so the reticles ride the mark through its per-service pose + pointer-look.
 * Publishing is still gated on "parked" (dissipate ≥ threshold) so the
 * KEYNOTE/WORKSHOP/EMBEDDED DOM connectors stay hidden during the fly-in /
 * dive and land on the mark once the instrument is settled.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { getSmoothedDissipate } from "./motionFollower";
import { brandmarkScanAnchorPointsRef, type BrandmarkFeatureId } from "../brandmarkScanAnchorsRef";
import {
  ABOUT_DECK_STAGE,
  CONTINUUM_RAIL_STAGE,
  SERVICES_CARD_RING,
} from "../unifiedServicesInstrument";
import { ContinuumWaistRail } from "@/components/landing/home-v2/services/hologram/ContinuumWaistRail";
import {
  HologramOrbits,
  STRUCTURAL_ORBITS,
  type OrbitConfig,
} from "@/components/landing/home-v2/services/hologram/HologramOrbits";
import { ServicesCardRing } from "@/components/landing/home-v2/services/hologram/ServicesCardRing";
import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { aboutFlipT } from "@/lib/services-ring/aboutDeckMath";
import { aboutStageProgressRef } from "@/lib/services-ring/aboutStageProgressRef";
import { CONTINUUM_WAIST_LEVEL, continuumApproachT } from "@/lib/services-ring/continuumStageMath";
import { continuumStageProgressRef } from "@/lib/services-ring/continuumStageProgressRef";
import { exitProgressForRunway } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";
import { lerp } from "@/lib/math";
import {
  useHologramConnectors,
  type ConnectorAnchor,
  type FeatureAnchor,
} from "@/lib/stores/hologramConnectorStore";

/** Orbit scale relative to the core's group. The core geometry is normalised to
 *  TARGET_HALF = 0.5 half-extent; this lifts the orbit radii (1.06–2.36) so the
 *  waist ring just clears the mark and the outer shells frame it — matching the
 *  mark:orbit ratio at `/test/services-demo`. Tuned by eye in the corridor fov. */
const ARMILLARY_SCALE = 0.62;

/** Publish scan anchors only once the instrument is essentially parked, so the
 *  DOM connectors don't chase the mark during the fly-in / shrink. */
const ANCHOR_PUBLISH_DISSIPATE = 0.88;

/** Decommission dim on the structural armillary lines (ADR-030 Update 1):
 *  as the exit clock runs, the gold orbit lines sink most of the way out so
 *  the receding mark reads alone behind the assembling deck. Under ADR-047
 *  the residue then clears FULLY across the about flip window (the flipped
 *  portrait gets a clean stage); the ambient envelope + canvas release
 *  finish the kill as #continuum arrives. */
const ORBIT_EXIT_DIM = 0.85;
const orbitExitGetter = () =>
  (1 - ORBIT_EXIT_DIM * exitProgressForRunway(servicesRingProgressRef.current.progress)) *
  (ABOUT_DECK_STAGE ? 1 - aboutFlipT(aboutStageProgressRef.current.progress) : 1);

/** Waist-ring master opacity across the continuum stage (ADR-049): lerps
 *  the cleared exit level TOWARD CONTINUUM_WAIST_LEVEL (> 1 brightens the
 *  0.68-base line above its rest, capped at 1 in OrbitRing) as the approach
 *  opens. continuumApproachT is 0 outside #continuum, so this equals
 *  orbitExitGetter() everywhere else — the waist tracks the meridian
 *  through #services / #about, then re-brightens alone here. */
const waistContinuumGetter = () =>
  lerp(
    orbitExitGetter(),
    CONTINUUM_WAIST_LEVEL,
    continuumApproachT(continuumStageProgressRef.current.progress)
  );

/** Per-ring getter selector: the waist re-brightens on the continuum
 *  approach; every other structural ring keeps the plain exit getter
 *  (stays cleared through #continuum). Absent when the flag is off ⇒
 *  HologramOrbits falls back to `masterOpacityGetter` (byte-identical). */
const continuumWaistSelector = (o: OrbitConfig): (() => number) | undefined =>
  o.id === "shell-waist" ? waistContinuumGetter : orbitExitGetter;

/** Sub-pixel deadband for the anchor publish delta gate. Anchors are
 *  screen-space pixels; a quarter-pixel drift is invisible under the
 *  1px connector strokes, while pointer-look motion moves whole pixels
 *  per frame and re-opens publishing immediately. */
const ANCHOR_PUBLISH_EPSILON_PX = 0.25;

function anchorsWithinEpsilon(a: ConnectorAnchor[], b: ConnectorAnchor[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const p = a[i];
    const q = b[i];
    if (
      p.serviceId !== q.serviceId ||
      p.visible !== q.visible ||
      Math.abs(p.x - q.x) > ANCHOR_PUBLISH_EPSILON_PX ||
      Math.abs(p.y - q.y) > ANCHOR_PUBLISH_EPSILON_PX ||
      Math.abs(p.depth - q.depth) > 0.001
    ) {
      return false;
    }
  }
  return true;
}

function featuresWithinEpsilon(a: FeatureAnchor[], b: FeatureAnchor[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const p = a[i];
    const q = b[i];
    if (
      p.featureId !== q.featureId ||
      p.visible !== q.visible ||
      Math.abs(p.x - q.x) > ANCHOR_PUBLISH_EPSILON_PX ||
      Math.abs(p.y - q.y) > ANCHOR_PUBLISH_EPSILON_PX ||
      Math.abs(p.depth - q.depth) > 0.001
    ) {
      return false;
    }
  }
  return true;
}

export function CorridorArmillary({ scale = ARMILLARY_SCALE }: { scale?: number }) {
  const activeServiceId = useHologramConnectors((s) => s.activeServiceId) ?? SERVICES[0].id;
  const setAnchors = useHologramConnectors((s) => s.setAnchors);
  const setFeatureAnchors = useHologramConnectors((s) => s.setFeatureAnchors);
  // ADR-029 card ring — mount gate MUST match the services DOM gate
  // (`useHologramCanvas` in ServicesStage): below 961px / reduced motion the
  // plate accordion carries the cards, so the ring must not mount (and must
  // not fetch its photo textures) there.
  const ringCapable = useMediaQuery(
    "(min-width: 961px) and (prefers-reduced-motion: no-preference)"
  );
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  // Probe group at identity — its matrixWorld IS the pointer-look space the
  // mark (and this armillary) live in, so local anchor points projected
  // through it track the mark's pose exactly.
  const probeRef = useRef<THREE.Group>(null);
  const worldRef = useRef(new THREE.Vector3());
  // `clearedRef` makes the un-park clear the HUD anchors exactly once (so
  // connectors vanish on reverse-scroll) without spamming the store.
  const clearedRef = useRef(true);
  // Publish delta gate (2026-07-16 perf pass, ADR-047 U5): while parked
  // with no pointer/scroll motion the projected anchors are static, but
  // the store publish fired every frame — and every publish re-renders
  // the DOM subscribers (ServicesDesignationLayer, ServicesPlateCluster,
  // ServiceScanInterface). Hold the last published arrays and skip the
  // store writes when every point is within a sub-pixel epsilon and the
  // ids/visibility flags match; pointer-look motion trivially exceeds
  // the epsilon, so live tracking is untouched.
  const lastPublishedRef = useRef<{
    anchors: ConnectorAnchor[];
    features: FeatureAnchor[];
  } | null>(null);

  useFrame(() => {
    const parked = getSmoothedDissipate() >= ANCHOR_PUBLISH_DISSIPATE;
    const anchorsRef = brandmarkScanAnchorPointsRef.current;
    const probe = probeRef.current;
    if (!parked || !anchorsRef || !probe) {
      if (!clearedRef.current) {
        setAnchors([]);
        setFeatureAnchors([]);
        clearedRef.current = true;
        lastPublishedRef.current = null;
      }
      return;
    }

    const world = worldRef.current;
    // Service corner anchors — plate connectors terminate here.
    const anchors: ConnectorAnchor[] = SERVICES.map((service) => {
      const [x, y, z] = anchorsRef.points[service.id];
      world.set(x, y, z).applyMatrix4(probe.matrixWorld);
      const projected = world.project(camera);
      return {
        serviceId: service.id,
        x: (projected.x * 0.5 + 0.5) * size.width,
        y: (-projected.y * 0.5 + 0.5) * size.height,
        depth: projected.z,
        visible: projected.z < 1 && projected.z > -1,
      };
    });
    // Named designation features — ServicesDesignationLayer subscribes.
    // Object.entries preserves insertion order (BrandmarkFeatureId keys),
    // which the designation set relies on for stable stagger indices.
    const featureAnchors: FeatureAnchor[] = (
      Object.entries(anchorsRef.features) as Array<
        [BrandmarkFeatureId, readonly [number, number, number]]
      >
    ).map(([featureId, [x, y, z]]) => {
      world.set(x, y, z).applyMatrix4(probe.matrixWorld);
      const projected = world.project(camera);
      return {
        featureId,
        x: (projected.x * 0.5 + 0.5) * size.width,
        y: (-projected.y * 0.5 + 0.5) * size.height,
        depth: projected.z,
        visible: projected.z < 1 && projected.z > -1,
      };
    });
    clearedRef.current = false;
    // Skip both store writes while the projection is static (see the
    // delta-gate note above). Compared together so the two anchor sets
    // can never desync a frame apart.
    const prev = lastPublishedRef.current;
    if (
      prev &&
      anchorsWithinEpsilon(prev.anchors, anchors) &&
      featuresWithinEpsilon(prev.features, featureAnchors)
    ) {
      return;
    }
    lastPublishedRef.current = { anchors, features: featureAnchors };
    setAnchors(anchors);
    setFeatureAnchors(featureAnchors);
  });

  return (
    <>
      <group ref={probeRef} />
      {/* STRUCTURAL_ORBITS (ADR-025 Update 8): the production armillary is
          waist + meridian only — the service rings retired with the
          wireframe-seed pass (their anchor role moved to the mark's own
          wireframe points in 2026-07-02; see the scan-anchor block above).
          `activeServiceId` stays wired: inert against structural rings
          (no ServiceId ids), harmless, and future-proof if a service ring
          ever returns. The active-service signal lives in the DOM
          connectors, the open plate, and the mark's per-service pose. */}
      <HologramOrbits
        orbits={STRUCTURAL_ORBITS}
        entrance="scroll"
        scale={scale}
        activeServiceId={activeServiceId}
        masterOpacityGetter={SERVICES_CARD_RING ? orbitExitGetter : undefined}
        masterOpacityGetterFor={CONTINUUM_RAIL_STAGE ? continuumWaistSelector : undefined}
      />
      {/* ADR-029: the four service cards orbit the mark in this same rig —
          scroll-owned rotation (runway progress via servicesRingProgressRef),
          entrance staggered off the same dissipate clock as the orbit
          wrap-on, card rects published for the DOM hit-areas. */}
      {SERVICES_CARD_RING && ringCapable && (
        <ServicesCardRing
          scale={scale}
          progressRef={servicesRingProgressRef}
          dissipateGetter={getSmoothedDissipate}
          entrance="scroll"
          publishAnchors
        />
      )}
      {/* ADR-049: the tool ↔ collaborator thumb + tick diamonds riding the
          waist ring's front arc, gated to the continuum approach envelope
          (invisible + inert everywhere else). Shares this rig, so it banks
          with the parked instrument. */}
      {CONTINUUM_RAIL_STAGE && ringCapable && <ContinuumWaistRail scale={scale} />}
    </>
  );
}
