"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Minimal FPS chip for the non-R3F treatments (KenBurns / Living / Scrub);
 * the WebGL treatments use drei <Stats/> instead. Updates once per second
 * so the meter itself stays out of the frame budget.
 */
export function FpsMeter({ active = true }: { active?: boolean }) {
  const [fps, setFps] = useState(0);
  const frames = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    last.current = performance.now();
    frames.current = 0;
    const tick = (t: number) => {
      frames.current++;
      if (t - last.current >= 1000) {
        setFps(Math.round((frames.current * 1000) / (t - last.current)));
        frames.current = 0;
        last.current = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 1000,
        padding: "4px 8px",
        background: "rgba(8, 7, 6, 0.85)",
        border: "1px solid rgba(202, 165, 84, 0.3)",
        borderRadius: 3,
        fontFamily: "var(--font-mono, 'PT Mono', monospace)",
        fontSize: 10,
        color: fps >= 50 ? "#ebe3d6" : "#c96f4a",
      }}
    >
      {fps} FPS
    </div>
  );
}
