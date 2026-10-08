"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useRef } from "react";

import {
  ServicesCardRing,
  ServicesHologramScene,
} from "@/components/landing/home-v2/services/hologram";
import type { CardFaceBaker } from "@/components/landing/home-v2/services/hologram/ServicesCardRing";
import { STRUCTURAL_ORBITS } from "@/components/landing/home-v2/services/hologram/HologramOrbits";
import type { ServiceId } from "@/components/landing/home-v2/services/serviceData";
import type { ServicePlate } from "@/components/landing/home-v2/services/servicePlateData";
import { TENSOR_ACCENT, TENSOR_GOLD } from "@/lib/home-v2/goldPalette";
import type { AboutStageProgress } from "@/lib/services-ring/aboutStageProgressRef";
import { servicesRingProgressRef } from "@/lib/services-ring/ringProgressRef";

/**
 * The real ADR-029 ring around the real particle mark, forked from
 * `/test/services-card-face-lab`'s backdrop with its camera CALIBRATION kept
 * to the digit (CAM_DIST 2.95, RIG_Y −0.21 — measured against the live
 * corridor's card rects; the orbit lab's flat camera parks the same cards
 * ~14 % higher and ~13 % smaller).
 *
 * What differs: the faces come from `faceBaker` (the lab seam on
 * `ServicesCardRing`), the face variant is `card` (a drawn face — no photo
 * fetch, no veil, the tight slab), and there is no drawer: the open state on
 * this lab is the DOM evidence deck, so this lab never writes `openPlateRef`
 * (its two writers stay two).
 */

const INSTRUMENT_SCALE = 0.62;
const CAM_DIST = 2.95;
const RIG_Y = -0.21;

interface RingBackdropProps {
  /** Picks the hologram's active service (its pose amp is 0, so it is
   *  bookkeeping); the ring itself reads the module ref per frame. */
  activeId: ServiceId;
  plates: readonly ServicePlate[];
  faceBaker: CardFaceBaker;
  /** Slots with no card — the fourth, on this three-workstream ring. */
  hiddenSlots: readonly number[];
}

export default function RingBackdrop({
  activeId,
  plates,
  faceBaker,
  hiddenSlots,
}: RingBackdropProps) {
  const aboutRef = useRef<AboutStageProgress>({ progress: 0, engaged: false });

  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, CAM_DIST], fov: 38, near: 0.1, far: 100 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0, zIndex: 2 }}
    >
      <group position={[0, RIG_Y, 0]}>
        <ServicesHologramScene
          activeServiceId={activeId}
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
            faceVariant="card"
            openDrawer={false}
            deckFlip={false}
            publishAnchors
            plates={plates}
            faceBaker={faceBaker}
            hiddenSlots={hiddenSlots}
          />
        </ServicesHologramScene>
      </group>
      <EffectComposer>
        <Bloom intensity={0.3} luminanceThreshold={0.42} luminanceSmoothing={0.9} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
