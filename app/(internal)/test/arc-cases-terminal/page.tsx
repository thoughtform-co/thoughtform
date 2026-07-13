"use client";

import { useEffect, useRef, useState } from "react";

import "@/components/landing/home-v2/home-v2.css";

import { ArcCasesTerminal } from "@/components/landing/home-v2/arc-cases";
import { PROJECT_CASES } from "@/components/landing/v7/tools-cards/toolCardData";
import { arcCasesLevelRef } from "@/lib/arc-cases/arcCasesLevelRef";
import { useArcCasesStore } from "@/lib/stores/arcCasesStore";

/**
 * Arc Cases Terminal lab (ADR-035) — pure-DOM look-dev for the fixed
 * converging overlay, isolated from the corridor.
 *
 * The real `ArcCasesTerminal` is mounted with `bandGetter={() => 1}` so
 * the scroll-owned Build band is pinned open and the arm ENVELOPE is the
 * only thing that moves — arm/disarm the real store and watch the halves
 * converge / the level ramp. Everything the production overlay does
 * (the damped level writer, the clip-path unfurl, the stepper) runs
 * here byte-identically; only the band is stubbed.
 *
 * Requires a desktop-capable viewport (ARC_CASES_MEDIA ≥ 1101×760, no
 * reduced motion) — the overlay renders null otherwise, same as prod.
 */
export default function ArcCasesTerminalLabPage() {
  const armed = useArcCasesStore((s) => s.armed);
  const slot = useArcCasesStore((s) => s.slot);
  const toggle = useArcCasesStore((s) => s.toggle);
  const disarm = useArcCasesStore((s) => s.disarm);
  const step = useArcCasesStore((s) => s.step);
  const select = useArcCasesStore((s) => s.select);

  // Live level readout — the ref is written by the overlay's rAF, so a
  // tiny display rAF mirrors it into state for the readout.
  const [level, setLevel] = useState(0);
  const rafRef = useRef(0);
  useEffect(() => {
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      setLevel(arcCasesLevelRef.current.level);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050403",
        color: "#ece3d6",
        fontFamily: "var(--font-pt-mono, ui-monospace, monospace)",
      }}
    >
      {/* The real overlay, band pinned open. */}
      <ArcCasesTerminal bandGetter={() => 1} />

      {/* Lab controls — fixed bottom-left so the overlay stays centred. */}
      <div
        style={{
          position: "fixed",
          left: 24,
          bottom: 24,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          zIndex: 40,
          fontSize: 12,
          letterSpacing: "0.12em",
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={toggle}>
            {armed ? "DISARM" : "ARM"}
          </button>
          <button type="button" onClick={disarm}>
            close
          </button>
          <button type="button" onClick={() => step(-1)}>
            ◂ prev
          </button>
          <button type="button" onClick={() => step(1)}>
            next ▸
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {PROJECT_CASES.map((projectCase, i) => (
            <button
              key={projectCase.id}
              type="button"
              onClick={() => select(i)}
              data-active={i === slot || undefined}
              style={{ opacity: i === slot ? 1 : 0.5 }}
            >
              {projectCase.index} {projectCase.codename}
            </button>
          ))}
        </div>
        <div style={{ opacity: 0.7 }}>
          armed: <b>{String(armed)}</b> · slot: <b>{slot}</b> · level: <b>{level.toFixed(3)}</b>
        </div>
      </div>
    </main>
  );
}
