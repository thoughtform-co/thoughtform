"use client";

/**
 * /test/services-demo
 *
 * Composed Services demo: real-brandmark hologram, true 3D service orbits,
 * live scan connectors, compact CV notes, and one expanded service card.
 * This route is the look-dev harness for the production `#services` stage.
 */

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import "@/components/landing/home-v2/services/services.css";

import { ServiceScanInterface } from "@/components/landing/home-v2/services";
import { ServicesHologramScene } from "@/components/landing/home-v2/services/hologram";
import { SERVICES, type ServiceId } from "@/components/landing/home-v2/services/serviceData";
import { TENSOR_GOLD, TENSOR_ACCENT } from "@/lib/home-v2/goldPalette";

const PALETTE = {
  void: "#050403",
  gold: "#caa554",
  faint: "rgba(235, 227, 214, 0.42)",
};

export default function ServicesDemoPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeServiceId, setActiveServiceId] = useState<ServiceId>(SERVICES[0].id);

  useEffect(() => {
    const t = setTimeout(() => window.dispatchEvent(new Event("resize")), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      ref={rootRef}
      className="services-demo"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: `radial-gradient(130% 100% at 42% 45%, #0d0a07 0%, ${PALETTE.void} 72%)`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 34,
          left: 40,
          zIndex: 6,
          fontFamily: "ui-monospace, monospace",
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: "0.32em", color: PALETTE.gold }}>SERVICES</div>
        <div style={{ fontSize: 13, letterSpacing: "0.06em", color: PALETTE.faint, marginTop: 6 }}>
          One loop. Three depths.
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 0, 3.65], fov: 38, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      >
        <ServicesHologramScene
          activeServiceId={activeServiceId}
          accentColor={TENSOR_ACCENT}
          blending="normal"
          color={TENSOR_GOLD}
          density={0.9}
          depthStrutCount={2200}
          edgeThresholdDeg={5}
          flyIn={1}
          opacity={0.74}
          pointSize={4.3}
          publishAnchors
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

      <ServiceScanInterface
        activeServiceId={activeServiceId}
        className="services-scan-interface--demo"
        onSelectService={setActiveServiceId}
      />

      <Link
        href="/test/services-hologram"
        style={{
          position: "absolute",
          bottom: 18,
          left: 22,
          zIndex: 6,
          fontSize: 11,
          letterSpacing: "0.08em",
          color: PALETTE.faint,
          fontFamily: "ui-monospace, monospace",
          textDecoration: "none",
        }}
      >
        {"<- hologram lab"}
      </Link>
    </div>
  );
}
