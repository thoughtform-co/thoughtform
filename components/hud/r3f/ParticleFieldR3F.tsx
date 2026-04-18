"use client";

import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { ParticleScene } from "./ParticleScene";
import { SceneBlur } from "./SceneBlur";
import { useParticleScene } from "@/lib/contexts/ParticleSceneContext";
import { getPhaseAtProgress, SCENE_DEPTH } from "./phases";

interface Props {
  /** Scroll progress from the outer DOM (normalized 0-1). */
  scrollProgress: number;
}

/**
 * Outer R3F canvas wrapper. Lives in the DOM as a fixed background;
 * reads scroll from props (passed down from cockpit's useLenis) and
 * writes it into the scene context for consumers inside the canvas.
 */
export function ParticleFieldR3F({ scrollProgress }: Props) {
  const { scrollRef, phaseRef } = useParticleScene();

  // Keep refs in sync with prop updates (cheap — this component only re-renders
  // on scroll, and we write to refs, no React updates inside).
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.progress = scrollProgress;
      scrollRef.current.z = scrollProgress * SCENE_DEPTH;
    }
    const phase = getPhaseAtProgress(scrollProgress);
    if (phaseRef.current) {
      phaseRef.current.section = phase.section;
      phaseRef.current.progress = phase.progress;
    }
  }, [scrollProgress, scrollRef, phaseRef]);

  return (
    <div
      className="space-background"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <Canvas
        camera={{ position: [0, 120, 900], fov: 55, near: 1, far: 6000 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#0a0908"]} />
        <ParticleScene />
        <SceneBlur />
      </Canvas>
    </div>
  );
}
