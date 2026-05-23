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
 * homepage). Each rAF tick it computes a screen rect from one of two
 * sources:
 *
 *   1. **DOM dock rect** (Thoughtform parked beat).
 *      The actor pins to `.home-v2-stage .sigil__mark`'s
 *      `getBoundingClientRect()` so the brandmark sits inside the v7
 *      sigil compass diagram exactly like the production homepage —
 *      same size (`clamp(155px, 19vw, 232px)`), same screen position,
 *      responsive across viewports.
 *
 *   2. **3D world projection** (passthrough-01 onward).
 *      The actor projects a world position from
 *      `getBrandmarkWorldPosition(progress)` through a mirror
 *      `THREE.PerspectiveCamera` set up with the same camera path
 *      as the R3F scene, then sizes the shell via
 *      `getBrandmarkTargetScreenWidthFrac(progress)`.
 *
 * Across the passthrough-01 beat (0.18 → 0.32) the two sources are
 * lerped so the brandmark leaves the v7 dock and gradually settles
 * onto the corridor's centered world path without a jump.
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

      // ── Compute the world-projected screen rect ────────────────
      // (used for transit / Diagnostic / Intelligence; lerped FROM
      // during passthrough-01).
      const [cx, cy, cz] = getCameraPosition(cameraT);
      const [lx, ly, lz] = getCameraLookAt(cameraT);
      s.pos.set(cx, cy, cz);
      s.lookAt.set(lx, ly, lz);
      s.camera.position.copy(s.pos);
      s.camera.lookAt(s.lookAt);
      s.camera.updateMatrixWorld();

      const [wx, wy, wz] = getBrandmarkWorldPosition(progress);
      s.target.set(wx, wy, wz);
      const camToTargetZ = cz - wz;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let worldLeft = 0;
      let worldTop = 0;
      let worldWidth = 0;
      let worldHeight = 0;
      let worldRectValid = false;
      if (camToTargetZ > 0.2) {
        s.projected.copy(s.target).project(s.camera);
        const screenX = (s.projected.x * 0.5 + 0.5) * vw;
        const screenY = (-s.projected.y * 0.5 + 0.5) * vh;
        const widthFrac = getBrandmarkTargetScreenWidthFrac(progress);
        worldWidth = vw * widthFrac;
        worldHeight = worldWidth * (436 / 430.99);
        worldLeft = screenX - worldWidth / 2;
        worldTop = screenY - worldHeight / 2;
        worldRectValid = true;
      }

      // ── Compute the DOM dock rect at Thoughtform parked ────────
      // The v7 `.sigil__mark` element sits inside the sliced
      // `#definition` chamber DOM. At the Thoughtform beat the
      // sigil compass SVG is visible (homepage layout), so we pin
      // the brandmark exactly to its dock slot — same as how the
      // production v7 brandmark journey pins to the sigil dock.
      let dockLeft = 0;
      let dockTop = 0;
      let dockWidth = 0;
      let dockHeight = 0;
      let dockRectValid = false;
      const needsDock = beat === "thoughtform" || beat === "passthrough-01";
      if (needsDock) {
        const dock = document.querySelector(".home-v2-stage .sigil__mark");
        if (dock) {
          const r = dock.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            dockLeft = r.left;
            dockTop = r.top;
            dockWidth = r.width;
            dockHeight = r.height;
            dockRectValid = true;
          }
        }
      }

      // ── Choose / blend rect sources ────────────────────────────
      // - Thoughtform parked: pure dock rect (homepage fidelity).
      // - Passthrough-01: blend dock → world over the beat so the
      //   brandmark glides off the sigil dock and onto the corridor's
      //   world path without a jump.
      // - All other beats: pure world projection.
      let left: number;
      let top: number;
      let width: number;
      let height: number;
      if (beat === "thoughtform" && dockRectValid) {
        left = dockLeft;
        top = dockTop;
        width = dockWidth;
        height = dockHeight;
      } else if (beat === "passthrough-01" && dockRectValid && worldRectValid) {
        // Smoothstep blend so the handoff has decelerated ends.
        const u = gateProgress < 0 ? 0 : gateProgress > 1 ? 1 : gateProgress;
        const t = u * u * (3 - 2 * u);
        left = dockLeft + (worldLeft - dockLeft) * t;
        top = dockTop + (worldTop - dockTop) * t;
        width = dockWidth + (worldWidth - dockWidth) * t;
        height = dockHeight + (worldHeight - dockHeight) * t;
      } else if (worldRectValid) {
        left = worldLeft;
        top = worldTop;
        width = worldWidth;
        height = worldHeight;
      } else {
        // Behind the camera and no dock available — hide.
        if (s.lastVisible !== false) {
          s.lastVisible = false;
          shell.style.display = "none";
        }
        return;
      }

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
