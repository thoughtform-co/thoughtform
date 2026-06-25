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
 * mark settles, identical to the old #services entrance. Scan anchors publish to
 * `hologramConnectorStore` only once parked, so the KEYNOTE/WORKSHOP/EMBEDDED
 * DOM connectors stay hidden during the fly-in / dive and land on the orbit
 * nodes once the instrument is settled.
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

import { getSmoothedDissipate } from "./motionFollower";
import {
  HologramOrbits,
  DEFAULT_ORBITS,
} from "@/components/landing/home-v2/services/hologram/HologramOrbits";
import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import { useHologramConnectors, type ConnectorAnchor } from "@/lib/stores/hologramConnectorStore";

/** Orbit scale relative to the core's group. The core geometry is normalised to
 *  TARGET_HALF = 0.5 half-extent; this lifts the orbit radii (1.06–2.36) so the
 *  waist ring just clears the mark and the outer shells frame it — matching the
 *  mark:orbit ratio at `/test/services-demo`. Tuned by eye in the corridor fov. */
const ARMILLARY_SCALE = 0.62;

/** Publish scan anchors only once the instrument is essentially parked, so the
 *  DOM connectors don't chase the nodes during the fly-in / shrink. */
const ANCHOR_PUBLISH_DISSIPATE = 0.88;

export function CorridorArmillary({ scale = ARMILLARY_SCALE }: { scale?: number }) {
  const activeServiceId = useHologramConnectors((s) => s.activeServiceId) ?? SERVICES[0].id;
  const setAnchors = useHologramConnectors((s) => s.setAnchors);
  // Gate anchor publishing on "parked". `clearedRef` makes the un-park clear the
  // HUD anchors exactly once (so connectors vanish on reverse-scroll) without
  // spamming the store every frame.
  const parkedRef = useRef(false);
  const clearedRef = useRef(true);

  useFrame(() => {
    const parked = getSmoothedDissipate() >= ANCHOR_PUBLISH_DISSIPATE;
    parkedRef.current = parked;
    if (!parked && !clearedRef.current) {
      setAnchors([]);
      clearedRef.current = true;
    }
  });

  const publishAnchors = (anchors: ConnectorAnchor[]) => {
    if (!parkedRef.current) return;
    clearedRef.current = false;
    setAnchors(anchors);
  };

  return (
    <HologramOrbits
      orbits={DEFAULT_ORBITS}
      entrance="scroll"
      scale={scale}
      activeServiceId={activeServiceId}
      publishAnchors={publishAnchors}
    />
  );
}
