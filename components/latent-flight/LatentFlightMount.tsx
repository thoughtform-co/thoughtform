"use client";

import { useEffect, useRef, useState } from "react";

import type { LfFlags } from "@/lib/latent-flight/flags";

import { LatentFlightEngine } from "./LatentFlightEngine";
import { createSystems } from "./systems";

/**
 * LatentFlightMount — one canvas, one engine, one effect.
 *
 * React's job ends at the `<canvas>`: the engine is constructed in the mount
 * effect and owns every frame from there. Two things this component does on
 * purpose:
 *
 *   - `key={epoch}` remounts the canvas (and therefore the engine) when the
 *     WebGL context is restored after a loss. Rebuilding is simpler and safer
 *     than re-uploading every resource into a context that came back from
 *     the dead — the corridor's own `key={glEpoch}` recipe.
 *   - the effect's cleanup disposes the engine, so React Strict Mode's
 *     construct → dispose → construct cycle in development leaves exactly
 *     one engine running on the reused canvas.
 *
 * ⚠ `flags` must be referentially stable across renders (the shell memoises
 * it); a fresh object every render would rebuild the engine every render.
 */
export function LatentFlightMount({
  flags,
  reducedMotion,
}: {
  flags: LfFlags;
  reducedMotion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = canvas?.parentElement;
    if (!canvas || !root) return;
    const engine = new LatentFlightEngine({
      canvas,
      root,
      flags,
      reducedMotion,
      systems: createSystems(flags),
    });
    const off = engine.events.on("gl-epoch", () => setEpoch((e) => e + 1));
    engine.start();
    return () => {
      off();
      engine.dispose();
    };
  }, [epoch, flags, reducedMotion]);

  return <canvas key={epoch} ref={canvasRef} className="lf-canvas" aria-hidden="true" />;
}
