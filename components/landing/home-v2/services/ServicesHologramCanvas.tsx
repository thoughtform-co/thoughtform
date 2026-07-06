"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useRef, useState } from "react";

import { ServicesHologramScene } from "./hologram";
import type { ServiceId } from "./serviceData";
import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import { TENSOR_GOLD, TENSOR_ACCENT } from "@/lib/home-v2/goldPalette";

/**
 * The standalone `#services` hologram canvas — the flag-off / lab path
 * of ServicesStage. With `UNIFIED_SERVICES_ARMILLARY` on (production),
 * the corridor canvas owns the armillary and this never mounts, so it
 * lives in its own lazily-imported module to keep `three`'s
 * postprocessing stack (`@react-three/postprocessing` → `postprocessing`)
 * out of the marketing route's initial JS.
 *
 * Hardening (insurance for a future flag flip, mirroring the corridor's
 * budgets): dpr capped [1, 1.75], glEpoch remount on context restore,
 * constant demand frameloop pumped only while the stage intersects the
 * viewport (the scene's pointer-look damping and scan choreography are
 * time-animated, but only matter on screen).
 *
 * The scene JSX is otherwise verbatim from ServicesStage — prop values
 * are part of the ADR-025 hologram tuning and must not drift from the
 * lab harness (`/test/services-demo`).
 */

/** Pumps invalidate() every rAF while `active`. The corridor's
 *  FrameInvalidator pattern, keyed to viewport intersection. */
function IntersectionFramePump({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const pump = () => {
      invalidate();
      raf = requestAnimationFrame(pump);
    };
    raf = requestAnimationFrame(pump);
    return () => cancelAnimationFrame(raf);
  }, [active, invalidate]);
  return null;
}

export function ServicesHologramCanvas({ activeServiceId }: { activeServiceId: ServiceId }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [glEpoch, setGlEpoch] = useState(0);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      rootMargin: "25% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="services-hologram" aria-hidden="true" ref={wrapperRef}>
      <CanvasErrorBoundary fallback={null}>
        <Canvas
          key={glEpoch}
          camera={{ position: [0, 0, 3.65], fov: 38, near: 0.1, far: 100 }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, alpha: true }}
          frameloop="demand"
          onCreated={({ gl }) => {
            const canvas = gl.domElement;
            const onLost = (e: Event) => e.preventDefault();
            const onRestored = () => setGlEpoch((n) => n + 1);
            canvas.addEventListener("webglcontextlost", onLost as EventListener, false);
            canvas.addEventListener("webglcontextrestored", onRestored, false);
          }}
        >
          <IntersectionFramePump active={onScreen} />
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
      </CanvasErrorBoundary>
    </div>
  );
}
