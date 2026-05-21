"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { BrandmarkGlyph } from "@/components/landing/v7/BrandmarkGlyph";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import {
  CAMERA_FOV,
  getBrandmarkTargetScreenWidthFrac,
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
 * homepage). Each rAF tick it:
 *
 *   1. Reads `progress`, `cameraT`, `beat`, and `gateProgress` from
 *      `depthGatewayStore`.
 *   2. Computes the brandmark's WORLD position from
 *      `getBrandmarkWorldPosition(progress)`.
 *   3. Projects that world position through a mirror
 *      `THREE.PerspectiveCamera` set up with the same camera path
 *      as the R3F scene (so the actor's screen position is exactly
 *      where the camera would render a point at that world location).
 *   4. Resolves the target on-screen width via
 *      `getBrandmarkTargetScreenWidthFrac(progress)`, calibrated to
 *      match v7 dock CSS sizes (`.sigil__mark` ~19vw,
 *      `.miss__brand-slot` ~11vw, `.ilayer__brandmark-anchor` ~22vw).
 *   5. Writes the shell's `left/top/width/height` inline styles.
 *
 * Visibility:
 *   - Opacity 0 at hero (stage inactive) and during the substrate
 *     morph window (the R3F `BrandmarkPointCloud` covers the same
 *     silhouette in that beat — instant `display: none` cut so the
 *     swap is invisible, mirrors ADR-017's substrate cut pattern).
 *   - Opacity 1 everywhere else during the corridor.
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

      // Build the mirror camera.
      const [cx, cy, cz] = getCameraPosition(cameraT);
      const [lx, ly, lz] = getCameraLookAt(cameraT);
      s.pos.set(cx, cy, cz);
      s.lookAt.set(lx, ly, lz);
      s.camera.position.copy(s.pos);
      s.camera.lookAt(s.lookAt);
      s.camera.updateMatrixWorld();

      // Project the brandmark world position to NDC.
      const [wx, wy, wz] = getBrandmarkWorldPosition(progress);
      s.target.set(wx, wy, wz);
      // If behind the camera, hide (cz > target z + small margin).
      const camToTargetZ = cz - wz;
      if (camToTargetZ <= 0.2) {
        if (s.lastVisible !== false) {
          s.lastVisible = false;
          shell.style.display = "none";
        }
        return;
      }

      s.projected.copy(s.target).project(s.camera);

      // NDC → screen pixels.
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const screenX = (s.projected.x * 0.5 + 0.5) * vw;
      const screenY = (-s.projected.y * 0.5 + 0.5) * vh;

      // Target on-screen width fraction → pixel width. Height
      // follows the brandmark's intrinsic 430.99 × 436 ratio so the
      // mark stays square-ish at every parked station.
      const widthFrac = getBrandmarkTargetScreenWidthFrac(progress);
      const width = vw * widthFrac;
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

      // Opacity bookends. The brandmark fades IN across the first
      // few percent of stage progress (so it doesn't pop in during
      // the hero → stage handoff) and fades OUT at the very end
      // (so it doesn't sit huge on top of the tail copy after the
      // user scrolls past the corridor). Parked beats are slightly
      // brighter than transit beats so the mark feels "lit" when
      // it lands.
      const HERO_FADE_IN = 0.05;
      const TAIL_FADE_OUT_START = 0.97;
      let bookend = 1;
      if (progress < HERO_FADE_IN) {
        bookend = Math.max(0, progress / HERO_FADE_IN);
      } else if (progress > TAIL_FADE_OUT_START) {
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
