"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useRef } from "react";

import {
  ServicesCardRing,
  ServicesHologramScene,
} from "@/components/landing/home-v2/services/hologram";
import { STRUCTURAL_ORBITS } from "@/components/landing/home-v2/services/hologram/HologramOrbits";
import { SERVICES } from "@/components/landing/home-v2/services/serviceData";
import { TENSOR_ACCENT, TENSOR_GOLD } from "@/lib/home-v2/goldPalette";
import type { AboutStageProgress } from "@/lib/services-ring/aboutStageProgressRef";
import { activeServiceForProgress } from "@/lib/services-ring/ringMath";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

/**
 * RingBackdrop — the real ADR-029 card ring as the masthead's backdrop.
 *
 * In production these four photo cards are WebGL planes orbiting the parked
 * brandmark INSIDE the corridor canvas (via `CorridorArmillary`), not part of
 * the services DOM — so a lab that wants them must mount its own canvas. This
 * is the `/test/services-orbit` seam, reproduced with that lab's sanctioned
 * look-dev values (which themselves read the live `RING_*` constants, so this
 * cannot drift from `ringMath.ts`).
 *
 * Everything tunable in the orbit lab is FIXED here at its default: this is a
 * backdrop for judging masthead composition, not a ring look-dev surface. The
 * one live input is `servicesRingProgressRef` — the same module-level bridge
 * `useServicesStageScroll` writes in production — driven by the lab slider so
 * the front card can be parked per service.
 */

/** Armillary/ring scale + parked rig scale — the corridor instrument's values
 *  (CorridorArmillary ARMILLARY_SCALE × the parked group scale). */
const INSTRUMENT_SCALE = 0.62;
const PARKED_GROUP_SCALE = 1.0;

/** Seat the instrument where PRODUCTION seats it. The corridor frames the
 *  parked armillary through an aspect-aware fov + Z dolly with the group at
 *  the sphere centre — reproducing that rig verbatim would drag half of
 *  `sceneGeom` into the lab, so instead the flat camera is CALIBRATED
 *  against the live corridor's published ring anchors (the
 *  `.svc-ring-hits__hit` rects, measured on the real landing at 1600×1000,
 *  runway p = 0.5):
 *
 *    front card  h ≈ 753px, centre-y ≈ 588 (59%)   [from the CTA hit ×
 *    side cards  centre-y ≈ 558–570 (56–57%)        RING_CARD_CTA_BOX]
 *
 *  The orbit lab's flat camera (dist 3.2, group y 0) parks the same cards
 *  ~14% higher and ~13% smaller — which is exactly the "cards invade the
 *  H1 band" overlap this calibration kills. Distance closes 3.2 → 2.95 to
 *  match the front card's apparent height; the group drops so the ring
 *  equator lands at the production seat below viewport centre
 *  (shift ≈ screen-fraction × frustum height at the card plane,
 *  2 · (dist − z_front) · tan(fov/2)). Calibrated at ~1.6 aspect — the
 *  production fov is aspect-aware, so extreme aspects drift a little;
 *  re-check against the live corridor's hit rects if it ever looks off.
 *  The lab mounts the same hit-area layer, so both sides of the comparison
 *  are always one `getBoundingClientRect` away. */
const CAM_DIST = 2.95;
const RIG_Y = -0.21;

interface RingBackdropProps {
  /** Mirrored from lab state only to pick the hologram's active service —
   *  the ring itself reads the module ref per WebGL frame. */
  progress: number;
}

export default function RingBackdrop({ progress }: RingBackdropProps) {
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
