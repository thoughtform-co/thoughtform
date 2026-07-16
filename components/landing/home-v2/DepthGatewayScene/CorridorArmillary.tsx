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
import { ABOUT_DECK_STAGE, SERVICES_CARD_RING } from "../unifiedServicesInstrument";
import {
  HologramOrbits,
  STRUCTURAL_ORBITS,
} from "@/components/landing/home-v2/services/hologram/HologramOrbits";
import { ServicesCardRing } from "@/components/landing/home-v2/services/hologram/ServicesCardRing";
import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { aboutFlipT } from "@/lib/services-ring/aboutDeckMath";
import { aboutStageProgressRef } from "@/lib/services-ring/aboutStageProgressRef";
import { exitProgressForRunway } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";
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

  useFrame(() => {
    const parked = getSmoothedDissipate() >= ANCHOR_PUBLISH_DISSIPATE;
    const anchorsRef = brandmarkScanAnchorPointsRef.current;
    const probe = probeRef.current;
    if (!parked || !anchorsRef || !probe) {
      if (!clearedRef.current) {
        setAnchors([]);
        setFeatureAnchors([]);
        clearedRef.current = true;
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
    </>
  );
}
