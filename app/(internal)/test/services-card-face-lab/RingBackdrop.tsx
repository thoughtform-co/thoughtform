"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useRef } from "react";

import {
  ServicesCardRing,
  ServicesHologramScene,
} from "@/components/landing/home-v2/services/hologram";
import type {
  CardFaceVariant,
  CardTitleStyle,
} from "@/components/landing/home-v2/services/hologram/ServicesCardRing";
import { STRUCTURAL_ORBITS } from "@/components/landing/home-v2/services/hologram/HologramOrbits";
import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import { TENSOR_ACCENT, TENSOR_GOLD } from "@/lib/home-v2/goldPalette";
import type { AboutStageProgress } from "@/lib/services-ring/aboutStageProgressRef";
import { activeServiceForProgress } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

/**
 * RingBackdrop — the real ADR-029 card ring, with the face variant swappable.
 *
 * Forked from `/test/services-anchor-lab`. Everything tunable stays FIXED at
 * the orbit lab's sanctioned defaults: this lab judges what the card SAYS, not
 * how the ring moves. The two live inputs are `servicesRingProgressRef` (the
 * same module bridge `useServicesStageScroll` writes in production) and
 * `faceVariant`.
 */

/** Armillary/ring scale + parked rig scale — the corridor instrument's values. */
const INSTRUMENT_SCALE = 0.62;
const PARKED_GROUP_SCALE = 1.0;

/** CALIBRATED against the live corridor's published ring anchors (the
 *  `.svc-ring-hits__hit` rects, measured on the real landing at 1600×1000,
 *  runway p = 0.5: front card h ≈ 753px, centre-y ≈ 588 / 59%). Inherited
 *  verbatim from the anchor lab — this is the reason the lab's card geometry
 *  matches production, and why the plate that seats on those rects can be
 *  trusted here. The orbit lab's flat camera (dist 3.2, group y 0) parks the
 *  same cards ~14% higher and ~13% smaller. Calibrated at ~1.6 aspect; the
 *  production fov is aspect-aware, so extreme aspects drift a little. */
const CAM_DIST = 2.95;
const RIG_Y = -0.21;

interface RingBackdropProps {
  /** Mirrored from lab state only to pick the hologram's active service —
   *  the ring itself reads the module ref per WebGL frame. */
  progress: number;
  faceVariant: CardFaceVariant;
  /** How the service title is set — the lab's second axis. */
  titleStyle: CardTitleStyle;
  /** ADR-050 rev 3: mount the in-canvas drawer (V2 only). Its open/closed
   *  state comes from `openPlateRef`, written by the lab shell. */
  openDrawer: boolean;
}

export default function RingBackdrop({
  progress,
  faceVariant,
  titleStyle,
  openDrawer,
}: RingBackdropProps) {
  // ADR-047's about clock stays parked: the deck flip is not part of this
  // study, and the ring's rest pose needs `engaged: false`.
  const aboutRef = useRef<AboutStageProgress>({ progress: 0, engaged: false });

  // Late-mount canvas sizing nudge (services-demo / services-orbit convention).
  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
    return () => clearTimeout(t);
  }, []);

  const activeServiceId = SERVICES[activeServiceForProgress(progress)].id;

  return (
    <Canvas
      camera={{ position: [0, 0, CAM_DIST], fov: 38, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0, zIndex: 2 }}
    >
      <group position={[0, RIG_Y, 0]} scale={PARKED_GROUP_SCALE}>
        <ServicesHologramScene
          activeServiceId={activeServiceId}
          accentColor={TENSOR_ACCENT}
          blending="normal"
          color={TENSOR_GOLD}
          density={0.9}
          depthStrutCount={2200}
          edgeThresholdDeg={5}
          entrance="off"
          flyIn={1}
          opacity={0.74}
          orbits={STRUCTURAL_ORBITS}
          pointSize={4.3}
          pointerParallax={0.12}
          scale={INSTRUMENT_SCALE}
          scanGain={0.24}
          servicePoseAmp={0}
          showShell
          shellCount={120}
          surfaceCount={160}
          wireCount={6800}
          wireStroke={0.084}
        >
          <ServicesCardRing
            scale={INSTRUMENT_SCALE}
            progressRef={servicesRingProgressRef}
            aboutProgressRef={aboutRef}
            entrance="off"
            faceVariant={faceVariant}
            titleStyle={titleStyle}
            openDrawer={openDrawer}
            publishAnchors
          />
        </ServicesHologramScene>
      </group>
      <EffectComposer>
        <Bloom intensity={0.3} luminanceThreshold={0.42} luminanceSmoothing={0.9} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
