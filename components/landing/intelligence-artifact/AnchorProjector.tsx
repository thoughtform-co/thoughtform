"use client";

/**
 * AnchorProjector — leader-line label support.
 *
 * Mounted inside each variant's R3F tree alongside the parent group
 * that the artifact's auto-spin rotates. Every frame the component:
 *
 *   1. Reads the three world-space anchor points (Sources / Substrate
 *      / Surfaces) supplied by the parent variant. The anchors are
 *      defined in the parent group's local frame, so we multiply them
 *      by the parent's world matrix to get the actual world position
 *      after any rotation the variant applies.
 *   2. Projects each world point through the active camera to NDC,
 *      then to canvas pixel coordinates.
 *   3. Writes the result as CSS variables on the `.ia-canvas-wrap`
 *      element so DOM labels can read them: `--anchor-sources-x`,
 *      `--anchor-sources-y`, ..., in `px`.
 *   4. Imperatively updates the matching SVG leader line's `x1` /
 *      `y1` attributes so the leader's geometry-end visibly follows
 *      the anchor as the artifact rotates. SVG attribute updates are
 *      cheaper than React re-renders for 60fps targets.
 *
 * Pattern adapted from `TriadScene.tsx`. The `lastWrite` cache
 * suppresses no-op writes so the DOM isn't churned on every frame.
 *
 * The component renders nothing (returns null).
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ANCHOR_KEYS, type ArtifactAnchors } from "./artifactGeom";

interface AnchorProjectorProps {
  /** Per-variant anchor positions in the parent group's local frame.
   *  The projector applies the parent matrix so callers can keep
   *  anchors in the same coordinate system as their geometry. */
  anchors: ArtifactAnchors;
  /** Ref to the group whose world matrix should be applied to the
   *  local anchor positions before projection. If null/unmounted, the
   *  anchors are treated as world-space already. */
  trackGroupRef?: React.RefObject<THREE.Group | null>;
}

export function AnchorProjector({ anchors, trackGroupRef }: AnchorProjectorProps) {
  const { camera, scene } = useThree();
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const lastWrite = useRef<Record<string, string>>({});

  // Stable local-space anchor vectors, rebuilt only when the anchor
  // tuples change. Storing them as Vector3 avoids allocating in the
  // hot loop below.
  const local = useMemo(
    () => ({
      sources: new THREE.Vector3(...anchors.sources),
      substrate: new THREE.Vector3(...anchors.substrate),
      surfaces: new THREE.Vector3(...anchors.surfaces),
    }),
    [anchors.sources, anchors.substrate, anchors.surfaces]
  );

  // Cached refs to the SVG leader lines + the canvas wrap element so
  // we don't repeat the DOM queries every frame.
  const leaderRefs = useRef<Record<string, SVGLineElement | null>>({});
  const canvasWrapRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    canvasWrapRef.current = document.querySelector(".ia-canvas-wrap") as HTMLElement | null;
    leaderRefs.current = {
      sources: document.querySelector(".ia-leader--sources") as SVGLineElement | null,
      substrate: document.querySelector(".ia-leader--substrate") as SVGLineElement | null,
      surfaces: document.querySelector(".ia-leader--surfaces") as SVGLineElement | null,
    };
  }, []);

  useFrame(() => {
    const wrap = canvasWrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return;

    scene.updateMatrixWorld();
    const parentMatrix = trackGroupRef?.current?.matrixWorld ?? null;

    for (const key of ANCHOR_KEYS) {
      scratch.copy(local[key]);
      if (parentMatrix) scratch.applyMatrix4(parentMatrix);
      scratch.project(camera);

      // Behind / outside the camera — skip update so the leader
      // sticks to its last visible position instead of jumping to
      // the corner of the screen.
      if (!Number.isFinite(scratch.x) || !Number.isFinite(scratch.y)) continue;
      if (scratch.z > 1.05 || scratch.z < -1.05) continue;

      const px = ((scratch.x + 1) / 2) * rect.width;
      const py = ((1 - scratch.y) / 2) * rect.height;

      const xKey = `--anchor-${key}-x`;
      const yKey = `--anchor-${key}-y`;
      const xVal = `${px.toFixed(1)}px`;
      const yVal = `${py.toFixed(1)}px`;
      if (lastWrite.current[xKey] !== xVal) {
        wrap.style.setProperty(xKey, xVal);
        lastWrite.current[xKey] = xVal;
      }
      if (lastWrite.current[yKey] !== yVal) {
        wrap.style.setProperty(yKey, yVal);
        lastWrite.current[yKey] = yVal;
      }

      // Update SVG leader endpoint (geometry side).
      const leader = leaderRefs.current[key];
      if (leader) {
        leader.setAttribute("x1", px.toFixed(1));
        leader.setAttribute("y1", py.toFixed(1));
      }
    }
  });

  return null;
}
