"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { type ParticleSceneAnchorId, useParticleScene } from "@/lib/contexts/ParticleSceneContext";

export interface AnchorScreenState {
  screenX: number;
  screenY: number;
  scale: number;
  visible: boolean;
}

type AnchorTarget =
  | {
      x: number;
      y: number;
      z: number;
      visible?: boolean;
      scale?: number;
    }
  | null
  | (() => {
      x: number;
      y: number;
      z: number;
      visible?: boolean;
      scale?: number;
    } | null);

const DEFAULT_STATE: AnchorScreenState = {
  screenX: 0,
  screenY: 0,
  scale: 1,
  visible: false,
};

/**
 * Projects a world-space position to screen pixels using the live R3F camera.
 * Updates on rAF. Returns a state object that re-renders the consumer on change.
 *
 * For hot paths, pass `onUpdate` to write directly to a DOM element's transform
 * without triggering a React render.
 */
export function useParticleAnchor(
  target: AnchorTarget,
  onUpdate?: (state: AnchorScreenState) => void
) {
  const { cameraRef, dimensionsRef } = useParticleScene();
  const [state, setState] = useState<AnchorScreenState>(DEFAULT_STATE);
  const lastRef = useRef<AnchorScreenState>(DEFAULT_STATE);
  const vecRef = useRef(new THREE.Vector3());
  const readTarget = useCallback(
    () => (typeof target === "function" ? target() : target),
    [target]
  );

  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      const camera = cameraRef.current;
      const dims = dimensionsRef.current;
      const world = readTarget();

      if (camera && dims && dims.width > 0 && world) {
        const v = vecRef.current.set(world.x, world.y, world.z);
        v.project(camera);
        const screenX = (v.x * 0.5 + 0.5) * dims.width;
        const screenY = (-v.y * 0.5 + 0.5) * dims.height;
        const visible =
          world.visible !== false &&
          v.z > -1 &&
          v.z < 1 &&
          screenX > -200 &&
          screenX < dims.width + 200;
        // Simple scale approximation from ndc z (closer to camera = larger).
        const projectedScale = Math.max(0.1, Math.min(2.5, 1 - v.z * 0.8));
        const scale = projectedScale * (world.scale ?? 1);

        const next: AnchorScreenState = { screenX, screenY, scale, visible };
        const last = lastRef.current;
        const moved =
          Math.abs(next.screenX - last.screenX) > 0.5 ||
          Math.abs(next.screenY - last.screenY) > 0.5 ||
          Math.abs(next.scale - last.scale) > 0.01 ||
          next.visible !== last.visible;

        if (moved) {
          lastRef.current = next;
          if (onUpdate) {
            onUpdate(next);
          } else {
            setState(next);
          }
        }
      } else if (lastRef.current.visible) {
        lastRef.current = DEFAULT_STATE;
        if (onUpdate) {
          onUpdate(DEFAULT_STATE);
        } else {
          setState(DEFAULT_STATE);
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [cameraRef, dimensionsRef, onUpdate, readTarget]);

  return state;
}

export function useParticleAnchorById(
  anchorId: ParticleSceneAnchorId,
  onUpdate?: (state: AnchorScreenState) => void
): AnchorScreenState {
  const { anchorsRef } = useParticleScene();
  const readAnchor = useCallback(
    () => anchorsRef.current?.[anchorId] ?? null,
    [anchorId, anchorsRef]
  );

  return useParticleAnchor(readAnchor, onUpdate);
}
