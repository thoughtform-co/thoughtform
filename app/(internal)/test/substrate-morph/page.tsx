"use client";

/**
 * /test/substrate-morph â€” dev preview for the substrate-sphere morph
 * point cloud (ADR-017).
 *
 * Mounts a minimal R3F canvas with `<SubstrateMorphPoints>` alone +
 * a fake DOM brandmark anchor that the painter un-projects to. A
 * slider drives `substrateMorph` directly so you can scrub the
 * morph from brandmark shape (slider = 0) to Fibonacci sphere
 * (slider = 1) without scrolling the real intelligence-layer
 * section.
 *
 * Internal route â€” blocked from production by `proxy.ts`.
 */

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import {
  CAMERA_PARAMS,
  CAMERA_TILT,
} from "@/components/landing/v7/intelligence-layer/intelligenceLayerGeom";
import { SubstrateMorphPoints } from "@/components/landing/v7/intelligence-layer/SubstrateMorphPoints";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

export default function SubstrateMorphPreviewPage() {
  const [morph, setMorph] = useState(0);
  const [anchorX, setAnchorX] = useState(50);
  const [anchorY, setAnchorY] = useState(50);
  const [anchorSize, setAnchorSize] = useState(280);
  const anchorRef = useRef<HTMLDivElement>(null);

  // Force particle mode on the journey store so SubstrateMorphPoints
  // mounts with the brandmark-shape painter active. Drive the
  // transform's substrateMorph slider directly each tick â€” this
  // mirrors what the production journey hook does inside the
  // substrate scroll window.
  useEffect(() => {
    useBrandmarkJourneyStore.getState().setMode("particle");
    return () => {
      useBrandmarkJourneyStore.getState().reset();
    };
  }, []);

  useEffect(() => {
    const tick = () => {
      useBrandmarkJourneyStore.getState().setTransform({
        rect: { left: 0, top: 0, width: 0, height: 0 },
        opacity: 1,
        density: 0,
        dispersion: 0,
        rotationY: 0,
        ringsActive: morph > 0,
        ringProgress: morph,
        shapeBlend: 0,
        vectorOpacity: 1,
        substrateMorph: morph,
        silhouetteMorph: 1,
        visible: true,
        parkedAt: "substrate",
      });
    };
    tick();
    const id = window.setInterval(tick, 16);
    return () => window.clearInterval(id);
  }, [morph]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--surface-0, #0a0908)",
        color: "var(--dawn, #ece3d6)",
        position: "relative",
        overflow: "hidden",
        fontFamily: "var(--font-pp-neue-montreal, ui-sans-serif), sans-serif",
      }}
    >
      {/* Synthetic intelligence-layer DOM scaffold â€” the painter
          queries `#intelligence-layer .ilayer__brandmark-anchor` to
          compute the brandmark target. We mock both selectors so
          un-projection works without the full landing page. */}
      <section
        id="intelligence-layer"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      >
        <div
          ref={anchorRef}
          className="ilayer__brandmark-anchor"
          aria-hidden
          style={{
            position: "absolute",
            left: `calc(${anchorX}% - ${anchorSize / 2}px)`,
            top: `calc(${anchorY}% - ${anchorSize / 2}px)`,
            width: anchorSize,
            height: anchorSize,
            border: "1px dashed rgba(202, 165, 84, 0.3)",
            borderRadius: 8,
          }}
        />
      </section>

      {/* R3F canvas sized to the viewport. The morph mesh lives
          inside the same rotation group the production scene uses
          (CAMERA_TILT) so the screenâ†’world un-projection math
          matches production exactly. */}
      <Canvas
        camera={{
          fov: CAMERA_PARAMS.fov,
          near: CAMERA_PARAMS.near,
          far: CAMERA_PARAMS.far,
          position: CAMERA_PARAMS.position,
        }}
        onCreated={({ camera }) => {
          const [lx, ly, lz] = CAMERA_PARAMS.lookAt;
          camera.lookAt(lx, ly, lz);
        }}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <group rotation={[CAMERA_TILT.x, CAMERA_TILT.y, 0]}>
          <SubstrateMorphPoints />
        </group>
      </Canvas>

      <div
        style={{
          position: "fixed",
          top: 24,
          right: 24,
          width: 320,
          padding: 20,
          background: "rgba(15, 14, 12, 0.92)",
          border: "1px solid rgba(202, 165, 84, 0.35)",
          color: "var(--dawn, #ece3d6)",
          zIndex: 50,
          fontFamily: "var(--font-pt-mono, ui-monospace), monospace",
          fontSize: 11,
          letterSpacing: "0.04em",
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: 16,
            fontSize: 13,
            color: "var(--gold, #caa554)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Substrate Morph Lab
        </h1>

        <ControlSlider
          label="substrateMorph"
          value={morph}
          min={0}
          max={1}
          step={0.001}
          onChange={setMorph}
        />
        <ControlSlider
          label="Anchor X (%)"
          value={anchorX}
          min={0}
          max={100}
          step={1}
          onChange={setAnchorX}
        />
        <ControlSlider
          label="Anchor Y (%)"
          value={anchorY}
          min={0}
          max={100}
          step={1}
          onChange={setAnchorY}
        />
        <ControlSlider
          label="Anchor size (px)"
          value={anchorSize}
          min={100}
          max={600}
          step={4}
          onChange={setAnchorSize}
        />

        <p
          style={{
            marginTop: 18,
            fontSize: 10,
            color: "rgba(236, 227, 214, 0.45)",
            lineHeight: 1.6,
          }}
        >
          ADR-017. At 0 the cloud paints the brandmark inside the dashed anchor. At 1 the cloud
          occupies the canonical Fibonacci sphere at the substrate body&apos;s centre. The dashed
          rectangle is the brandmark-anchor scaffold the painter un-projects to.
        </p>
      </div>
    </main>
  );
}

interface ControlSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

function ControlSlider({ label, value, min, max, step, onChange }: ControlSliderProps) {
  return (
    <label
      style={{
        display: "block",
        marginBottom: 10,
        color: "var(--dawn-70, rgba(236,227,214,0.7))",
      }}
    >
      <span
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 4,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          fontSize: 10,
        }}
      >
        <span>{label}</span>
        <span style={{ color: "var(--gold, #caa554)" }}>{value.toFixed(3)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: "var(--gold, #caa554)" }}
      />
    </label>
  );
}
