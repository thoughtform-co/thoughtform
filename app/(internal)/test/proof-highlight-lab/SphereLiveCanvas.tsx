"use client";

import { Canvas } from "@react-three/fiber";

import { SubstrateSphereStage } from "../brandmark-in-sphere/SubstrateSphereStage";

/**
 * SphereLiveCanvas — the Arc substrate sphere, live, for the lab's LIVE mode.
 *
 * This exists so the owner can judge a moving artefact against the still before
 * deciding what production gets. It is NOT a proposal for the shipped station:
 * a canvas inside `#proof` would breach ADR-054's no-canvas/no-portal contract
 * AND the landing-performance rule that keeps `three` out of the landing DOM
 * path. The still is what promotion would use unless that trade is explicitly
 * re-opened.
 *
 * `reducedMotion` is passed unconditionally: the gyro then skips its idle spin
 * and drift, which is both the ADR-021 motion rule (no rotation behind readable
 * copy) and what makes the live mode a fair comparison against a frozen still.
 *
 * Imported from the sibling test route — the same cross-lab import
 * `/test/corridor-wire-sphere` already does.
 */
export default function SphereLiveCanvas() {
  return (
    <Canvas
      className="phl-capture__canvas"
      camera={{ position: [0, 0, 4], fov: 35, near: 0.1, far: 100 }}
      gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
      dpr={[1, 1.75]}
      frameloop="always"
    >
      <SubstrateSphereStage showSphere reducedMotion />
    </Canvas>
  );
}
