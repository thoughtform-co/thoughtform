"use client";

import dynamic from "next/dynamic";

import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";

/**
 * CapturePanel — the shared media core every direction hangs its own frame on.
 *
 * STILL is the production-shaped answer: a captured image of the Arc sphere,
 * which costs the station nothing (no canvas, no `three`, no motion). LIVE
 * mounts the real sphere so the difference can be judged.
 *
 * `ssr: false` alone does NOT make the canvas safe: a runtime throw inside
 * `<Canvas>` (a lost GL context) bubbles to the route error boundary and
 * replaces the whole lab with "System Fault". `CanvasErrorBoundary` is what the
 * production canvases use for exactly this, and one dropped context would
 * otherwise cost the entire study.
 *
 * Frame chrome — brackets, stamps, scope reticles — belongs to the DIRECTIONS,
 * not here; each one dresses the same core differently.
 */
const SphereLiveCanvas = dynamic(() => import("./SphereLiveCanvas"), { ssr: false });

export function CapturePanel({ live }: { live: boolean }) {
  return (
    <div className="phl-capture__media" data-live={live || undefined}>
      {live ? (
        <CanvasErrorBoundary>
          <SphereLiveCanvas />
        </CanvasErrorBoundary>
      ) : (
        // fixed box, never optimised or deployed (see .vercelignore).
        <img
          className="phl-capture__still"
          src="/proof-lab/sphere-still.webp"
          alt=""
          width={900}
          height={900}
          draggable={false}
        />
      )}
    </div>
  );
}
