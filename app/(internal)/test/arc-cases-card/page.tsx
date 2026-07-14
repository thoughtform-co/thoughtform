"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";

import "@/components/landing/home-v2/home-v2.css";

import { ArcCasesCardGate } from "@/components/landing/home-v2/arc-cases";
import { ArcCasesStepper } from "@/components/landing/home-v2/arc-cases";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { arcCasesLevelRef } from "@/lib/arc-cases/arcCasesLevelRef";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";

/**
 * Arc Cases Card lab (ADR-036) — look-dev for the in-canvas 3D tools card,
 * isolated from the corridor. The card is mounted in a bare Canvas with the
 * Build band pinned open (`bandGetter={() => 1}`) and `preload` so the four
 * faces bake immediately; a level slider drives the arm envelope directly
 * (`levelOverride`) so you can inspect the materialize / crossfade / veil at
 * any presence. The DOM stepper rides the same shared level, so it appears
 * once the slider crosses the arrive threshold.
 *
 * NOTE: the node-stream FOLD is a corridor-only read (it lives in ShellStack,
 * which needs the full accretion shell) — verify that on the live route. This
 * lab is for the card's own bake + materialize.
 */
export default function ArcCasesCardLabPage() {
  const armed = useArcCasesStore((s) => s.armed);
  const slot = useArcCasesStore((s) => s.slot);
  const toggle = useArcCasesStore((s) => s.toggle);
  const step = useArcCasesStore((s) => s.step);
  const select = useArcCasesStore((s) => s.select);

  const [level, setLevel] = useState(1);
  const [readout, setReadout] = useState(0);
  const rafRef = useRef(0);
  useEffect(() => {
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      setReadout(arcCasesLevelRef.current.level);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#050403", color: "#ece3d6" }}>
      <div style={{ position: "fixed", inset: 0 }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 40 }} gl={{ antialias: true }}>
          <ArcCasesCardGate bandGetter={() => 1} preload levelOverride={level} />
        </Canvas>
      </div>

      {/* The real DOM stepper — rides the shared level. */}
      <ArcCasesStepper />

      {/* Lab controls. */}
      <div
        style={{
          position: "fixed",
          left: 24,
          bottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 40,
          fontFamily: "var(--font-pt-mono, ui-monospace, monospace)",
          fontSize: 12,
          letterSpacing: "0.12em",
        }}
      >
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          level
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          />
          <b>{level.toFixed(2)}</b>
        </label>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={toggle}>
            {armed ? "DISARM" : "ARM"}
          </button>
          <button type="button" onClick={() => step(-1)}>
            &#9666; prev
          </button>
          <button type="button" onClick={() => step(1)}>
            next &#9656;
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PROJECT_CASES.map((projectCase, i) => (
            <button
              key={projectCase.id}
              type="button"
              onClick={() => select(i)}
              style={{ opacity: i === slot ? 1 : 0.5 }}
            >
              {projectCase.index} {projectCase.codename}
            </button>
          ))}
        </div>
        <div style={{ opacity: 0.7 }}>
          armed: <b>{String(armed)}</b> · slot: <b>{slot}</b> · ref.level:{" "}
          <b>{readout.toFixed(3)}</b>
        </div>
      </div>
    </main>
  );
}
