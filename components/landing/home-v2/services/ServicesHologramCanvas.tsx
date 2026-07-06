"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";

import { ServicesHologramScene } from "./hologram";
import type { ServiceId } from "./serviceData";
import { TENSOR_GOLD, TENSOR_ACCENT } from "@/lib/home-v2/goldPalette";

/**
 * The standalone `#services` hologram canvas — the flag-off / lab path
 * of ServicesStage. With `UNIFIED_SERVICES_ARMILLARY` on (production),
 * the corridor canvas owns the armillary and this never mounts, so it
 * lives in its own lazily-imported module to keep `three`'s
 * postprocessing stack (`@react-three/postprocessing` → `postprocessing`)
 * out of the marketing route's initial JS.
 *
 * The JSX is moved verbatim from ServicesStage — prop values are part
 * of the ADR-025 hologram tuning and must not drift from the lab
 * harness (`/test/services-demo`).
 */
export function ServicesHologramCanvas({ activeServiceId }: { activeServiceId: ServiceId }) {
  return (
    <div className="services-hologram" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 3.65], fov: 38, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ServicesHologramScene
          activeServiceId={activeServiceId}
          accentColor={TENSOR_ACCENT}
          blending="normal"
          color={TENSOR_GOLD}
          density={0.9}
          depthStrutCount={2200}
          edgeThresholdDeg={5}
          entrance="scroll"
          entranceForm="wire"
          flyIn={1}
          opacity={0.74}
          pointSize={4.3}
          publishAnchors
          restTiltX={0}
          restTiltY={0}
          scale={0.72}
          scanGain={0.24}
          showShell
          shellCount={120}
          surfaceCount={160}
          wireCount={6800}
          wireStroke={0.084}
        />
        <EffectComposer>
          <Bloom intensity={0.3} luminanceThreshold={0.42} luminanceSmoothing={0.9} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
