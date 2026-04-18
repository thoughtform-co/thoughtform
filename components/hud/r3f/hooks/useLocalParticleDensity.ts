"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useParticleScene } from "@/lib/contexts/ParticleSceneContext";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";

/**
 * Estimates local particle density (0-1) around a screen-space rect.
 * Samples a strided subset of terrain particle positions each frame,
 * projects to screen, counts hits inside the inflated rect, low-pass
 * filters the result.
 *
 * `targetCount` is the approximate number of hits that maps to density=1.
 */
export function useLocalParticleDensity(
  rect: DOMRect | null,
  radius = 80,
  targetCount = 40
): number {
  const { particlesPositionsRef, cameraRef, dimensionsRef } = useParticleScene();
  const isMobile = useIsMobile();
  const [density, setDensity] = useState(0);
  const smoothedRef = useRef(0);
  const vecRef = useRef(new THREE.Vector3());

  useEffect(() => {
    let rafId = 0;
    let tickCount = 0;
    const stride = isMobile ? 12 : 6;

    const run = () => {
      tickCount++;
      // Sample every 3rd frame
      if (tickCount % 3 !== 0 || !rect) {
        rafId = requestAnimationFrame(run);
        return;
      }
      const arr = particlesPositionsRef.current;
      const camera = cameraRef.current;
      const dims = dimensionsRef.current;
      if (!arr || !camera || !dims || dims.width === 0) {
        rafId = requestAnimationFrame(run);
        return;
      }

      const minX = rect.left - radius;
      const maxX = rect.right + radius;
      const minY = rect.top - radius;
      const maxY = rect.bottom + radius;
      let hits = 0;
      const v = vecRef.current;

      for (let i = 0; i < arr.length; i += 3 * stride) {
        v.set(arr[i], arr[i + 1], arr[i + 2]);
        v.project(camera);
        const sx = (v.x * 0.5 + 0.5) * dims.width;
        const sy = (-v.y * 0.5 + 0.5) * dims.height;
        if (sx >= minX && sx <= maxX && sy >= minY && sy <= maxY && v.z > -1 && v.z < 1) {
          hits++;
        }
      }

      // Account for stride so targetCount is in full-sample units
      const estimated = hits * stride;
      const next = Math.min(1, estimated / targetCount);
      smoothedRef.current += (next - smoothedRef.current) * 0.15;

      setDensity(smoothedRef.current);
      rafId = requestAnimationFrame(run);
    };

    rafId = requestAnimationFrame(run);
    return () => cancelAnimationFrame(rafId);
  }, [rect, radius, targetCount, particlesPositionsRef, cameraRef, dimensionsRef, isMobile]);

  return density;
}
