"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import type { DepthGatewayTransform, Beat } from "@/lib/stores/depthGatewayStore";
import { BEAT_WINDOWS, useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { CAMERA_FOV, getCameraLookAt, getCameraPosition } from "../DepthGatewayScene/sceneGeom";

/**
 * useWorldDomTracker — the central per-frame projector for the
 * home-v2 depth corridor (ADR-018, world-owned rebuild).
 *
 * Projects named WORLD anchors to screen pixels every frame and
 * writes inline `transform: translate3d(...)` + `opacity` to DOM
 * elements found via `[data-world-anchor="{id}"]`. The single
 * mirror camera traces the SAME path as the R3F scene's
 * `FlyingCameraRig` (position dolly + lookAt X-pan), so DOM and
 * canvas content move as one cohesive frame — copy and labels
 * ride the world like gate annotations on Star Atlas.
 *
 * Anchors with a static position pass `[x, y, z]` directly. Anchors
 * with a dynamic position (e.g. the travelling brandmark) pass a
 * resolver `(transform) => [x, y, z]`.
 *
 * Per-anchor opacity is driven by `visibilityBeats` membership, with
 * a smooth fade-in / fade-out at the outer boundaries of the
 * combined visibility window. Anchors behind the camera are hidden.
 *
 * `onPaint` is an optional per-anchor hook called after the inline
 * styles are written, for consumers that need to compute extra
 * frame state (e.g. the brandmark actor's perspective-correct
 * width/height + tilt).
 */

export type WorldAnchorPosition =
  | readonly [number, number, number]
  | ((transform: DepthGatewayTransform) => readonly [number, number, number]);

export interface WorldAnchor {
  /** DOM lookup: `[data-world-anchor="{id}"]`. */
  id: string;
  /** Static `[x, y, z]` or dynamic resolver. */
  position: WorldAnchorPosition;
  /** Beats during which the anchor is visible (opacity 1). Outside,
   *  fades to 0 with a soft envelope (see `fadeFrac`). */
  visibilityBeats: Beat[];
  /** Fade window (fraction of the FULL combined visibility window)
   *  applied at both outer boundaries. Default 0.15. */
  fadeFrac?: number;
  /** Optional per-frame hook fired after inline transform + opacity
   *  are written. Use for extra frame state (perspective-correct
   *  width/height, custom tilt, etc.). */
  onPaint?: (ctx: PaintContext, element: HTMLElement) => void;
}

export interface PaintContext {
  /** Latest depth-gateway transform. */
  transform: DepthGatewayTransform;
  /** The mirror camera (already updated this frame). */
  camera: THREE.PerspectiveCamera;
  /** Current viewport width (px). */
  vw: number;
  /** Current viewport height (px). */
  vh: number;
  /** Anchor's world position resolved this frame. */
  worldPos: readonly [number, number, number];
  /** Projected screen position (px). */
  screenX: number;
  screenY: number;
  /** False if the anchor is behind the camera. */
  inFront: boolean;
  /** Computed visibility opacity (0..1). */
  visibilityOpacity: number;
}

/** Map `data-anchor-origin` keyword → `translate(x%, y%)` value. The
 *  percent translate is applied AFTER the pixel translate3d in the
 *  combined transform string, so it shifts the element by a fraction
 *  of its OWN size — landing the named anchor point on the projected
 *  screen position.
 *
 *    "center"        : centre of the element on the anchor
 *    "top-center"    : top edge centred horizontally on the anchor
 *    "bottom-center" : bottom edge centred horizontally on the anchor
 *    "left-center"   : left edge centred vertically on the anchor
 *    "right-center"  : right edge centred vertically on the anchor
 *    "top-left"      : element's top-left corner on the anchor (no shift)
 */
const ANCHOR_ORIGINS: Record<string, string> = {
  center: "-50%, -50%",
  "top-center": "-50%, 0%",
  "bottom-center": "-50%, -100%",
  "left-center": "0%, -50%",
  "right-center": "-100%, -50%",
  "top-left": "0%, 0%",
};

/** Make a mirror camera mounted to the same FOV as the R3F scene. */
function makeMirrorCamera(): THREE.PerspectiveCamera {
  const aspect = typeof window !== "undefined" ? window.innerWidth / window.innerHeight : 16 / 9;
  return new THREE.PerspectiveCamera(CAMERA_FOV, aspect, 0.1, 100);
}

/** Sync the mirror camera to the corridor camera path for the
 *  given progress. */
function syncMirrorCamera(camera: THREE.PerspectiveCamera, progress: number) {
  const [cx, cy, cz] = getCameraPosition(progress);
  const [lx, ly, lz] = getCameraLookAt(progress);
  camera.position.set(cx, cy, cz);
  camera.up.set(0, 1, 0);
  camera.lookAt(lx, ly, lz);
  camera.updateMatrixWorld();
}

/** Resolve an anchor's world position (static or dynamic). */
function resolvePosition(
  position: WorldAnchorPosition,
  transform: DepthGatewayTransform
): readonly [number, number, number] {
  return typeof position === "function" ? position(transform) : position;
}

/** Compute per-anchor visibility opacity (0..1) from beat membership.
 *
 *  The combined "visible" window is the union of the start of the
 *  earliest beat and the end of the latest beat in `visibilityBeats`.
 *  Inside the window the anchor is at 1; outside, it ramps to 0
 *  across `fadeFrac * (windowWidth)` at each edge. */
function computeVisibilityOpacity(anchor: WorldAnchor, progress: number): number {
  const windows = BEAT_WINDOWS.filter((w) => anchor.visibilityBeats.includes(w.beat));
  if (windows.length === 0) return 0;
  const start = Math.min(...windows.map((w) => w.start));
  const end = Math.max(...windows.map((w) => w.end));
  const fadeFrac = anchor.fadeFrac ?? 0.15;
  const fade = (end - start) * fadeFrac;
  if (progress >= start && progress <= end) return 1;
  if (progress > start - fade && progress < start) {
    return (progress - (start - fade)) / fade;
  }
  if (progress > end && progress < end + fade) {
    return 1 - (progress - end) / fade;
  }
  return 0;
}

export function useWorldDomTracker(
  anchors: readonly WorldAnchor[],
  rootRef: RefObject<HTMLElement | null>
): void {
  // Refs persist across frames so we don't allocate per tick.
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const projectedRef = useRef<THREE.Vector3 | null>(null);
  const fwdRef = useRef<THREE.Vector3 | null>(null);
  const toAnchorRef = useRef<THREE.Vector3 | null>(null);
  const lastStateRef = useRef<Map<string, { x: number; y: number; o: number; visible: boolean }>>(
    new Map()
  );
  const elementCacheRef = useRef<Map<string, HTMLElement | null>>(new Map());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    cameraRef.current = makeMirrorCamera();
    projectedRef.current = new THREE.Vector3();
    fwdRef.current = new THREE.Vector3();
    toAnchorRef.current = new THREE.Vector3();
    lastStateRef.current = new Map();
    elementCacheRef.current = new Map();

    const onResize = () => {
      const cam = cameraRef.current;
      if (!cam) return;
      cam.aspect = window.innerWidth / window.innerHeight;
      cam.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);

      const root = rootRef.current;
      const cam = cameraRef.current;
      const proj = projectedRef.current;
      const fwd = fwdRef.current;
      const toA = toAnchorRef.current;
      if (!root || !cam || !proj || !fwd || !toA) return;

      const transform = useDepthGatewayStore.getState().transform;
      // Use `paintProgress` so during the `armed` pre-arm pass the
      // mirror camera sits at parked Thoughtform (progress 0) — the
      // first `active` frame then already has every anchor's
      // transform written, so the room reads as "furnished on
      // arrival" rather than filling in as the user scrolls.
      const painting = transform.active || transform.armed;
      const paintProgress = transform.paintProgress;
      syncMirrorCamera(cam, paintProgress);

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Camera-forward (used for behind-camera culling).
      const [lx, ly, lz] = getCameraLookAt(paintProgress);
      fwd.set(lx, ly, lz).sub(cam.position).normalize();

      for (const anchor of anchors) {
        const elementCache = elementCacheRef.current;
        let element = elementCache.get(anchor.id);
        if (!element) {
          element = root.querySelector<HTMLElement>(`[data-world-anchor="${anchor.id}"]`);
          if (element) elementCache.set(anchor.id, element);
        }
        if (!element) continue;

        const worldPos = resolvePosition(anchor.position, transform);

        // Behind-camera cull.
        toA.set(worldPos[0], worldPos[1], worldPos[2]).sub(cam.position);
        const camToAnchor = toA.dot(fwd);
        const visibilityOpacity = computeVisibilityOpacity(anchor, paintProgress);
        const inFront = camToAnchor > 0.2;
        // Paint (write transform) while armed OR active. Opacity is
        // forced to 0 while only armed so nothing is visually shown
        // until the stage actually pins. The first `active` frame
        // then flips opacity to its computed visibility value with
        // every transform already in place.
        const visible = inFront && visibilityOpacity > 0.001 && painting;

        const lastState = lastStateRef.current;
        const last = lastState.get(anchor.id);

        if (!visible) {
          if (!last || last.visible) {
            element.style.opacity = "0";
            element.style.pointerEvents = "none";
            lastState.set(anchor.id, {
              x: last?.x ?? 0,
              y: last?.y ?? 0,
              o: 0,
              visible: false,
            });
          }
          continue;
        }

        // Project world -> NDC -> screen.
        proj.set(worldPos[0], worldPos[1], worldPos[2]).project(cam);
        const screenX = (proj.x * 0.5 + 0.5) * vw;
        const screenY = (-proj.y * 0.5 + 0.5) * vh;

        const becameVisible = !last || !last.visible;
        if (becameVisible) {
          // Clear any inline display:none set by a consumer (notably
          // ProjectedBrandmarkActor during the substrate-cut window).
          element.style.pointerEvents = "";
          element.style.display = "";
        }

        // Resolve anchor origin from `data-anchor-origin` attribute.
        // The pixel translate places the element's TOP-LEFT corner at
        // (screenX, screenY); the percent translate (applied AFTER
        // because CSS transforms read left-to-right) shifts the
        // element by a fraction of its OWN size so the desired
        // origin lands on (screenX, screenY).
        const origin = element.getAttribute("data-anchor-origin") ?? "center";
        const originPercent = ANCHOR_ORIGINS[origin] ?? ANCHOR_ORIGINS.center;
        const transformValue = `translate3d(${screenX.toFixed(2)}px, ${screenY.toFixed(
          2
        )}px, 0) translate(${originPercent})`;

        if (
          !last ||
          becameVisible ||
          Math.abs(screenX - last.x) > 0.25 ||
          Math.abs(screenY - last.y) > 0.25
        ) {
          element.style.transform = transformValue;
        }

        // While armed, suppress opacity so the pre-armed transform
        // doesn't flash visible before the stage pins.
        const writeOpacity = transform.active ? visibilityOpacity : 0;
        if (!last || becameVisible || Math.abs(writeOpacity - last.o) > 0.005) {
          element.style.opacity = `${writeOpacity.toFixed(3)}`;
        }

        lastState.set(anchor.id, { x: screenX, y: screenY, o: writeOpacity, visible: true });

        if (anchor.onPaint) {
          anchor.onPaint(
            {
              transform,
              camera: cam,
              vw,
              vh,
              worldPos,
              screenX,
              screenY,
              inFront,
              visibilityOpacity,
            },
            element
          );
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", onResize);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [anchors, rootRef]);
}
