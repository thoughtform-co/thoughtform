"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { BrandmarkGlyph } from "@/components/landing/v7/BrandmarkGlyph";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  CAMERA_FOV,
  getBrandmarkWorldHalfExtent,
  getBrandmarkWorldPosition,
  getCameraLookAt,
  getCameraPosition,
  getSubstrateMorph,
} from "./DepthGatewayScene/sceneGeom";

/**
 * ProjectedBrandmarkActor — the primary brandmark painter for the
 * home-v2 depth corridor (ADR-018).
 *
 * Mounts ONCE as a `position: fixed` shell containing the canonical
 * inline `BrandmarkGlyph` SVG (same vector geometry as the production
 * homepage). The brandmark is a TRUE 3D WORLD OBJECT throughout the
 * journey — its screen rect is the perspective projection of a
 * world position through a mirror `THREE.PerspectiveCamera` that
 * traces the SAME path (position dolly + lookAt X pan) as the R3F
 * scene. There is no DOM dock rect mode anywhere; the Thoughtform
 * parked composition is achieved by tuning the world anchor so its
 * projection lands inside the v7 sigil diamond at the start of the
 * corridor.
 *
 * This single-source-of-truth model is what makes the Thoughtform
 * → Diagnostic transit feel like a real 3D camera move: as scroll
 * advances, the camera dollies forward, the lookAt pans from
 * off-axis-right (framing the Thoughtform composition) to on-axis
 * (framing the Diagnostic gate ahead), AND the brandmark's world
 * anchor + half-extent lerp through the same window. The brandmark
 * perspective-scales as the camera approaches and re-frames — not a
 * 2D screen lerp between two anchor points.
 *
 * Visibility:
 *   - `display: none` while the depth stage is inactive (hero, post-
 *     stage scroll) and during the substrate morph window (the R3F
 *     `BrandmarkPointCloud` covers the same silhouette in that beat
 *     — instant cut, mirrors ADR-017's substrate-cut pattern).
 *   - Opacity ramps 1 → 0 across the final 3% of stage progress so
 *     the actor doesn't sit on top of the tail copy.
 *
 * This actor never re-renders React state per frame — all updates go
 * to inline styles via refs.
 */

/** Threshold for the substrate-cut: while `substrateMorph >` this
 *  the projected actor goes `display: none` and the `BrandmarkPointCloud`
 *  covers the same silhouette. */
const SUBSTRATE_CUT_EPSILON = 0.001;

/** Slight perspective-only "tilt" applied to the mark via 3D CSS
 *  during transit so the user feels it travel through space. The
 *  vector itself stays crisp — perspective gives it depth without
 *  blurring. */
const PERSPECTIVE_PX = 1200;

/** Approximate aspect ratio fallback for SSR. Updated on mount. */
const FALLBACK_ASPECT = 16 / 9;

export function ProjectedBrandmarkActor() {
  const shellRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // ── Mirror camera + scratch vectors ──────────────────────────
  // Single instance shared across frames so we don't allocate
  // every tick.
  const stateRef = useRef<{
    camera: THREE.PerspectiveCamera;
    pos: THREE.Vector3;
    lookAt: THREE.Vector3;
    target: THREE.Vector3;
    projected: THREE.Vector3;
    right: THREE.Vector3;
    edge: THREE.Vector3;
    edgeProjected: THREE.Vector3;
    fwd: THREE.Vector3;
    toBrand: THREE.Vector3;
    lastLeft: number;
    lastTop: number;
    lastWidth: number;
    lastHeight: number;
    lastOpacity: number;
    lastVisible: boolean | null;
  } | null>(null);

  useEffect(() => {
    const shell = shellRef.current;
    const inner = innerRef.current;
    if (!shell || !inner) return;

    const aspect = window.innerWidth / window.innerHeight || FALLBACK_ASPECT;
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, aspect, 0.1, 100);
    stateRef.current = {
      camera,
      pos: new THREE.Vector3(),
      lookAt: new THREE.Vector3(),
      target: new THREE.Vector3(),
      projected: new THREE.Vector3(),
      right: new THREE.Vector3(),
      edge: new THREE.Vector3(),
      edgeProjected: new THREE.Vector3(),
      fwd: new THREE.Vector3(),
      toBrand: new THREE.Vector3(),
      // Sentinel values well outside any plausible value so the first
      // frame's `Math.abs(newValue - lastValue) > epsilon` always
      // fires and updates the DOM. NaN would defeat the diff check
      // (all NaN comparisons return false) and the shell would never
      // pick up its initial position.
      lastLeft: -1e9,
      lastTop: -1e9,
      lastWidth: -1,
      lastHeight: -1,
      lastOpacity: -1,
      lastVisible: null,
    };

    const onResize = () => {
      if (!stateRef.current) return;
      stateRef.current.camera.aspect = window.innerWidth / window.innerHeight;
      stateRef.current.camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const s = stateRef.current;
      if (!s) return;

      const transform = useDepthGatewayStore.getState().transform;
      const { progress, cameraT, beat, gateProgress, active } = transform;

      // Substrate-cut: hide whenever the point cloud is painting.
      const morph = beat === "intelligence" ? getSubstrateMorph(gateProgress) : 0;
      const morphCut = morph > SUBSTRATE_CUT_EPSILON;

      const shouldBeVisible = active && !morphCut;
      if (shouldBeVisible !== s.lastVisible) {
        s.lastVisible = shouldBeVisible;
        shell.style.display = shouldBeVisible ? "block" : "none";
      }
      if (!shouldBeVisible) return;

      // ── 3D world projection (used everywhere — no DOM dock mode) ─
      // The brandmark is a coherent 3D world object end-to-end. Its
      // screen rect is derived from a perspective projection through
      // a mirror camera that traces the SAME path as the R3F scene
      // (position dolly + lookAt X pan), so the Thoughtform →
      // Diagnostic transit reads as a real camera move — not a 2D
      // screen lerp between two anchor points.
      const [cx, cy, cz] = getCameraPosition(cameraT);
      const [lx, ly, lz] = getCameraLookAt(cameraT);
      s.pos.set(cx, cy, cz);
      s.lookAt.set(lx, ly, lz);
      s.camera.position.copy(s.pos);
      s.camera.lookAt(s.lookAt);
      s.camera.updateMatrixWorld();

      const [wx, wy, wz] = getBrandmarkWorldPosition(progress);
      s.target.set(wx, wy, wz);

      // Camera-forward distance to the brandmark — for perspective
      // culling (skip the frame if the brandmark is behind the
      // camera).
      s.fwd.subVectors(s.lookAt, s.pos).normalize();
      s.toBrand.subVectors(s.target, s.pos);
      const camToBrand = s.toBrand.dot(s.fwd);
      if (camToBrand <= 0.2) {
        if (s.lastVisible !== false) {
          s.lastVisible = false;
          shell.style.display = "none";
        }
        return;
      }

      s.projected.copy(s.target).project(s.camera);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const screenX = (s.projected.x * 0.5 + 0.5) * vw;
      const screenY = (-s.projected.y * 0.5 + 0.5) * vh;

      // Perspective-correct screen size from world half-extent.
      // Project a point at `target + cameraRight * halfExtent` and
      // measure the screen-space distance between that point and
      // the centre. This picks up camera dolly, camera roll, and
      // the beat-to-beat world half-extent ramp automatically.
      const halfExtent = getBrandmarkWorldHalfExtent(progress);
      s.right.setFromMatrixColumn(s.camera.matrixWorld, 0);
      s.edge.copy(s.target).addScaledVector(s.right, halfExtent);
      s.edgeProjected.copy(s.edge).project(s.camera);
      const edgeScreenX = (s.edgeProjected.x * 0.5 + 0.5) * vw;
      const halfPixelWidth = Math.abs(edgeScreenX - screenX);
      const width = halfPixelWidth * 2;
      const height = width * (436 / 430.99);
      const left = screenX - width / 2;
      const top = screenY - height / 2;

      // Write to inline styles only when meaningfully changed (avoid
      // touching the DOM on every rAF if the user is idle).
      if (Math.abs(left - s.lastLeft) > 0.25) {
        s.lastLeft = left;
        shell.style.left = `${left}px`;
      }
      if (Math.abs(top - s.lastTop) > 0.25) {
        s.lastTop = top;
        shell.style.top = `${top}px`;
      }
      if (Math.abs(width - s.lastWidth) > 0.25) {
        s.lastWidth = width;
        shell.style.width = `${width}px`;
      }
      if (Math.abs(height - s.lastHeight) > 0.25) {
        s.lastHeight = height;
        shell.style.height = `${height}px`;
      }

      // Opacity bookends.
      //
      // No hero fade-in: at the start of the stage the actor is
      // pinned to the v7 `.sigil__mark` dock rect (homepage layout),
      // so it must be at full intensity the moment the chamber
      // section appears — the same way the production homepage
      // shows the brandmark crisply at #definition.
      //
      // Tail fade-out only: ramps 1 → 0 across the final 3% of
      // stage progress so the actor doesn't sit huge on top of the
      // tail copy after the user scrolls past the corridor.
      // Parked beats are slightly brighter than transit beats so the
      // mark feels "lit" when it lands.
      const TAIL_FADE_OUT_START = 0.97;
      let bookend = 1;
      if (progress > TAIL_FADE_OUT_START) {
        bookend = Math.max(0, 1 - (progress - TAIL_FADE_OUT_START) / (1 - TAIL_FADE_OUT_START));
      }
      const isParkedBeat =
        beat === "thoughtform" || beat === "diagnostic" || beat === "intelligence";
      const intensity = isParkedBeat ? 1 : 0.92;
      const targetOpacity = bookend * intensity;
      if (Math.abs(targetOpacity - s.lastOpacity) > 0.005) {
        s.lastOpacity = targetOpacity;
        shell.style.opacity = `${targetOpacity}`;
      }

      // Apply a tiny perspective rotation tied to camera travel so
      // the mark reads as a 3D object in motion. The inner div takes
      // the rotation; the outer shell holds layout.
      const tiltDeg = (cameraT - 0.5) * 8; // ±4° across the stage
      inner.style.transform = `rotateY(${tiltDeg.toFixed(2)}deg)`;
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className="home-v2-projected-brandmark"
      aria-hidden="true"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        opacity: 0,
        pointerEvents: "none",
        zIndex: 24,
        display: "none",
        perspective: `${PERSPECTIVE_PX}px`,
        filter: "drop-shadow(0 0 18px rgba(202, 165, 84, 0.42))",
        willChange: "left, top, width, height, opacity",
        transition: "opacity 120ms linear",
      }}
    >
      <div
        ref={innerRef}
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <BrandmarkGlyph outline={false} decorative />
      </div>
    </div>
  );
}
