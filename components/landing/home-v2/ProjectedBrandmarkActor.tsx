"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BrandmarkGlyph } from "@/components/landing/v7/BrandmarkGlyph";
import {
  BRANDMARK_ANCHOR_INTELLIGENCE,
  BRANDMARK_CORE_HANDOFF_PROGRESS,
  getBrandmarkWrapHalfExtent,
  getBrandmarkWorldPosition,
  getCameraFov,
  getCorridorExitCameraPose,
  getEpilogueCameraPose,
  getThoughtformMobilePhase,
} from "./DepthGatewayScene/sceneGeom";
import { writeBrandmarkScreenRect } from "./brandmarkScreenRectRef";
import { type WorldAnchor, useWorldDomTracker } from "./hooks/useWorldDomTracker";
import { BEAT_ORDER } from "@/lib/home-v2/corridorMap";
import { DOCKED_INSTRUMENT_EPILOGUE_POSE } from "@/lib/home-v2/epilogueTimeline";
import {
  getSmoothedDissipate,
  getSmoothedEpilogueProgress,
} from "./DepthGatewayScene/motionFollower";
import { useDepthGatewayStore } from "@/lib/stores/depthGatewayStore";
import { gyroTilt, useGyroLabStore } from "@/lib/stores/gyroLabStore";
import { TENSOR_GOLD } from "@/lib/home-v2/goldPalette";
import { clamp01 } from "@/lib/math";

/**
 * ProjectedBrandmarkActor — the primary brandmark painter for the
 * home-v2 depth corridor (ADR-018, world-owned rebuild).
 *
 * The brandmark is a TRUE 3D WORLD OBJECT end-to-end:
 *
 *   - Position: `getBrandmarkWorldPosition(progress)` — interpolates
 *     between the three parked gate anchors (`THOUGHTFORM`,
 *     `DIAGNOSTIC`, `INTELLIGENCE`). Because each anchor is rigidly
 *     co-located with its gate group's centre, the mark always
 *     lands at the same visual relationship to the rings/orbits/
 *     sphere regardless of viewport size — the homepage-fidelity
 *     "brandmark inside the diamond" composition is structural,
 *     not calibrated.
 *   - Size: perspective-projected from
 *     `getBrandmarkWrapHalfExtent(progress)` so it dollies + scales
 *     with the camera and grows toward the wrapping sphere before
 *     the particle blend.
 *   - Forward tilt: a small Y rotation scaled by camera dolly so the
 *     mark reads as a 3D plate in motion (the camera path itself is
 *     axial, so no banking roll is applied).
 *
 * NO DOM-dock pinning. The previous hybrid (DOM-pin at parked beats
 * vs world-project during transits) is gone — co-location via the
 * gate group makes dock mode unnecessary.
 *
 * SVG → particle core handoff (2026-06-16, morph rev. 2026-06-17,
 * renderer-ownership pass 2026-06-24, ADR-023): the DOM glyph is THE brandmark
 * only at the section-2 Thoughtform rest and the early fly-in before
 * the substrate wrap. Starting at `BRANDMARK_CORE_HANDOFF_PROGRESS`,
 * the particle core covers early from `getBrandmarkCoreBlend(progress)`.
 * During that cover window this DOM layer drops below the R3F canvas,
 * then cuts out once the flat particle silhouette owns the mark.
 * `BrandmarkPhysicsCoreActor` stays assembled and starts flat, so the
 * visible mark changes medium from crisp vector into particle geometry
 * without a transparent SVG ghost. The core then stays the visible mark
 * through Navigate / Encode / Build as the bright centre of the
 * accreting intelligence-layer artifact.
 * (This reverses the earlier 2026-06-06 "stay 2D SVG" decision; see
 * ADR-023 for the rationale.) The particle core keeps ownership through
 * the epilogue / dock / `#services` handoff.
 *
 * Ride-out + re-centre (2026-06-16, ADR-021 follow-up): the epilogue
 * APPROACH-band opacity fade is GONE. Instead, the mark is WELDED
 * to the substrate sphere centre (`BRANDMARK_ANCHOR_INTELLIGENCE`)
 * via a private mirror camera that follows the SAME pose chain as
 * `FlyingCameraRig` + `EpilogueNewsTicker` (epilogue camera with
 * docked-pose ease, then `getCorridorExitCameraPose` once the
 * dissipate engages). The mark therefore rides the sphere out of
 * the viewport during the BILLIONS beat as the camera tilts up over
 * the pole — geometric exit, no opacity ramp. Once `transform.docked`
 * engages and the dissipate clock starts ramping, the welded screen
 * position lerps toward the viewport centre across the first ~60%
 * of the dissipate, settling at a readable Services-section size
 * while the planet scatters around it. After the dock releases, the
 * `data-services-brandmark` CSS gate (written by
 * `useCorridorExitScroll`) holds the mark fixed-centred in
 * `#services` and fades it out as `#continuum` enters.
 *
 * Pixel-field handoff (2026-06-16, ADR-021 follow-up Phase 2): on
 * the capable path the hook writes `data-services-pixelate="true"`
 * the MOMENT this welded mark has re-centred and shown itself —
 * during the dock TAIL (`dissipate >= MARK_CENTRED_DOCK_PROGRESS`),
 * not only after the dock releases. Under that attribute
 * `home-v2.css` overrides this actor's SVG glyph to `opacity: 0`
 * and reveals `CorridorSeamPixelField`'s 2D canvas, so the visible
 * mark in `#services` is a grid-snapped gold/dawn pixel cloud
 * sampled from the SAME `BRANDMARK_FULL_PATHS` source that
 * progressively dissolves as the user scrolls toward `#continuum`.
 * The actor's welded ride-out + re-centre + post-active painter all
 * stay intact — once the mark is centred the SVG simply hands its
 * pixels to the canvas. The fallback path (no
 * `data-services-pixelate` attribute) keeps the legacy
 * `--services-brandmark` opacity fade on the SVG glyph.
 *
 * There is NO post-Build opacity fade in this component. The mark
 * stays present at Build and exits geometrically with the sphere
 * as the epilogue camera carries the substrate out of view.
 */

const PERSPECTIVE_PX = 1200;

/** Aspect ratio of the BrandmarkGlyph SVG (height/width). */
const BRANDMARK_ASPECT = 436 / 430.99;

/** Brandmark half-extent in WORLD units when welded to the sphere
 *  centre during the epilogue / dock. Matches the corridor's
 *  Intelligence-park value so the welded mark reads at the SAME scale
 *  as inside the Build park — the transition into the welded path is
 *  size-continuous. */
const EPILOGUE_WELDED_HALF_EXTENT = 0.34;

const PROJECTED_BRANDMARK_TOP_Z_INDEX = 24;
const PROJECTED_BRANDMARK_UNDER_CANVAS_Z_INDEX = 4;

/** Core-shrink handoff (2026-06-20): across the epilogue / dock /
 *  Services seam the in-canvas particle core (`BrandmarkPhysicsCoreActor`)
 *  owns the mark — it shrinks from sphere-fill down to the centred
 *  Services centerpiece. This SVG actor therefore stays HIDDEN through
 *  the whole epilogue + dock (`corridorVisibility = 0` on `useEpilogueOverride`);
 *  it only paints the crisp glyph at the section-2 Thoughtform rest. The
 *  welded ride-out / re-centre + dissipate-fade band are retired. */

/** Smoothed-blend time constant for the dock pose ease — identical to
 *  `FlyingCameraRig` + `EpilogueNewsTicker` so all three painters
 *  arrive at / depart from the docked instrument pose on the same
 *  curve. */
const DOCK_BLEND_TAU_S = 0.28;

// `clamp01` now comes from `@/lib/math` (Phase-5 consolidation).

/** Mutable per-actor scratch + cache for the epilogue / dock welded
 *  projection. Holds the mirror camera, vector scratch, dock blend
 *  state, and the last valid welded projection (for the brief frames
 *  the dissipate fly-in crosses the planet centre). Shared between
 *  `onPaint` (corridor-active path, via tracker) and the parallel
 *  post-active rAF, which never run on the same frame. */
interface EpilogueScratch {
  camera: THREE.PerspectiveCamera | null;
  center: THREE.Vector3;
  edge: THREE.Vector3;
  right: THREE.Vector3;
  proj: THREE.Vector3;
  dockBlend: number;
  lastT: number;
  lastWeldedCx: number;
  lastWeldedCy: number;
  lastWeldedHalfPx: number;
  hasLastWelded: boolean;
}

function ensureEpCamera(ep: EpilogueScratch): THREE.PerspectiveCamera {
  if (!ep.camera) {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    ep.camera = new THREE.PerspectiveCamera(getCameraFov(aspect), aspect, 0.1, 100);
  }
  return ep.camera;
}

/** Compute the welded screen position + recentre lerp for the brandmark
 *  during the epilogue / dock. Same math + scratch state shared with the
 *  parallel post-active rAF — they never run on the same frame (one is
 *  gated on `active||armed`, the other on its complement).
 *
 *  Returns `{ left, top, width, height }` in viewport pixels. The caller
 *  writes the inline styles. */
function computeWeldedRect(
  ep: EpilogueScratch,
  now: number,
  smoothedEp: number,
  docked: boolean,
  dissipateProgress: number,
  vw: number,
  vh: number
): { left: number; top: number; width: number; height: number } {
  // Mirror `FlyingCameraRig`'s dock blend (exp decay toward
  // `DOCKED_INSTRUMENT_EPILOGUE_POSE`) so engaging / leaving the dock
  // glides instead of snapping. Same tau as the rig + the news ticker
  // — identical arrival/departure curve at the docked pose.
  const dt = Math.min(0.1, Math.max(0, (now - ep.lastT) / 1000));
  ep.lastT = now;
  ep.dockBlend += ((docked ? 1 : 0) - ep.dockBlend) * (1 - Math.exp(-dt / DOCK_BLEND_TAU_S));
  // Snap to 0 once fully out so the blend doesn't linger sub-perceptually
  // after a dock visit and keep us on the epilogue branch forever
  // (mirrors `FlyingCameraRig`'s own snap; same root cause).
  if (!docked && smoothedEp <= 1e-4) ep.dockBlend = 0;
  const effectiveEp = smoothedEp + (DOCKED_INSTRUMENT_EPILOGUE_POSE - smoothedEp) * ep.dockBlend;

  const basePose = getEpilogueCameraPose(effectiveEp);
  let camPos = basePose.position;
  let camLook = basePose.lookAt;
  const dissipate = docked ? clamp01(dissipateProgress) : 0;
  if (dissipate > 1e-4) {
    // ADR-021 corridor-exit fly-in. `getCorridorExitCameraPose(0)`
    // === the docked pose by construction, so this lerp is identity
    // at engage. The caller passes the SMOOTHED dissipate (the same
    // motionFollower channel `FlyingCameraRig` flies), so this DOM weld
    // stays glued to the canvas sphere through the eased fly-in
    // (2026-06-18 elegance pass).
    const exitPose = getCorridorExitCameraPose(dissipate);
    const tt = dissipate;
    camPos = [
      basePose.position[0] + (exitPose.position[0] - basePose.position[0]) * tt,
      basePose.position[1] + (exitPose.position[1] - basePose.position[1]) * tt,
      basePose.position[2] + (exitPose.position[2] - basePose.position[2]) * tt,
    ];
    camLook = [
      basePose.lookAt[0] + (exitPose.lookAt[0] - basePose.lookAt[0]) * tt,
      basePose.lookAt[1] + (exitPose.lookAt[1] - basePose.lookAt[1]) * tt,
      basePose.lookAt[2] + (exitPose.lookAt[2] - basePose.lookAt[2]) * tt,
    ];
  }
  const cam = ensureEpCamera(ep);
  cam.position.set(camPos[0], camPos[1], camPos[2]);
  cam.up.set(0, 1, 0);
  cam.lookAt(camLook[0], camLook[1], camLook[2]);
  cam.updateMatrixWorld();

  // Project the sphere centre. If the projection is past / behind the
  // camera (which happens briefly as the dissipate fly-in crosses the
  // planet centre, just like `EpilogueNewsTicker`'s `centreValid`
  // guard) we hold the last good welded pose so the recentre lerp
  // still has a sensible "from" point through the cap.
  ep.center.set(
    BRANDMARK_ANCHOR_INTELLIGENCE[0],
    BRANDMARK_ANCHOR_INTELLIGENCE[1],
    BRANDMARK_ANCHOR_INTELLIGENCE[2]
  );
  ep.proj.copy(ep.center).project(cam);
  const centreValid = ep.proj.z > -1 && ep.proj.z < 1;

  let weldedCx: number;
  let weldedCy: number;
  let weldedHalfPx: number;
  if (centreValid) {
    weldedCx = (ep.proj.x * 0.5 + 0.5) * vw;
    weldedCy = (-ep.proj.y * 0.5 + 0.5) * vh;
    // Half-pixel-width via a limb edge along camera-right — same
    // projection technique the corridor path uses, so the size is
    // C0-continuous across the corridor → epilogue handoff.
    ep.right.setFromMatrixColumn(cam.matrixWorld, 0);
    ep.edge.copy(ep.center).addScaledVector(ep.right, EPILOGUE_WELDED_HALF_EXTENT);
    ep.proj.copy(ep.edge).project(cam);
    const edgeX = (ep.proj.x * 0.5 + 0.5) * vw;
    const edgeY = (-ep.proj.y * 0.5 + 0.5) * vh;
    const halfPx = Math.hypot(edgeX - weldedCx, edgeY - weldedCy);
    weldedHalfPx =
      Number.isFinite(halfPx) && halfPx <= vw * 2
        ? halfPx
        : ep.hasLastWelded
          ? ep.lastWeldedHalfPx
          : 120;
    ep.lastWeldedCx = weldedCx;
    ep.lastWeldedCy = weldedCy;
    ep.lastWeldedHalfPx = weldedHalfPx;
    ep.hasLastWelded = true;
  } else if (ep.hasLastWelded) {
    weldedCx = ep.lastWeldedCx;
    weldedCy = ep.lastWeldedCy;
    weldedHalfPx = ep.lastWeldedHalfPx;
  } else {
    weldedCx = vw * 0.5;
    weldedCy = vh * 0.5;
    weldedHalfPx = 120;
  }

  // ADR-021 amendment (2026-06-19): no in-#services re-centre. The
  // mark stays welded to the sphere geometrically — it rides off-
  // screen with the camera fly-in during the dissipate. Opacity
  // (owned by the caller) fades to 0 across the back half of the
  // clock so the mark is gone by the time the dock releases.
  const cx = weldedCx;
  const cy = weldedCy;
  const halfPx = weldedHalfPx;

  const width = halfPx * 2;
  const height = width * BRANDMARK_ASPECT;
  return { left: cx - width / 2, top: cy - height / 2, width, height };
}

export function ProjectedBrandmarkActor() {
  const shellRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Persistent scratch vectors so we don't allocate per frame.
  const scratch = useRef({
    right: new THREE.Vector3(),
    edge: new THREE.Vector3(),
    edgeProjected: new THREE.Vector3(),
    target: new THREE.Vector3(),
  });

  // Persistent state for the epilogue / dock OVERRIDE path. Shared
  // between the tracker-driven `onPaint` (corridor-active path) and
  // the post-active parallel rAF (post-stage dock + services hold).
  // Both paths read the SAME scratch refs / last-welded cache; they
  // never run on the same frame (each is gated on the inverse of the
  // other), so sharing is safe.
  const epRef = useRef<EpilogueScratch>({
    camera: null,
    center: new THREE.Vector3(),
    edge: new THREE.Vector3(),
    right: new THREE.Vector3(),
    proj: new THREE.Vector3(),
    dockBlend: 0,
    lastT: 0,
    lastWeldedCx: 0,
    lastWeldedCy: 0,
    lastWeldedHalfPx: 0,
    hasLastWelded: false,
  });

  // Keep the epilogue mirror camera locked to viewport aspect / fov
  // on resize — matches `useWorldDomTracker` + `EpilogueNewsTicker`.
  useEffect(() => {
    const onResize = () => {
      const cam = epRef.current.camera;
      if (!cam) return;
      const aspect = window.innerWidth / Math.max(1, window.innerHeight);
      cam.aspect = aspect;
      cam.fov = getCameraFov(aspect);
      cam.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Single dynamic anchor that resolves to the brandmark's current
  // travelling world position. The tracker handles the projection +
  // visibility envelope; the onPaint callback writes brandmark-
  // specific size + roll, AND owns the epilogue / dock override path.
  const anchors = useMemo<WorldAnchor[]>(() => {
    return [
      {
        id: "home-v2.brandmark",
        position: (transform) =>
          getBrandmarkWorldPosition(transform.paintProgress, transform.progress),
        // Brandmark is visible across EVERY beat; substrate-cut is
        // handled inside onPaint so the DOM hides during the
        // intelligence morph window. Derived from BEAT_ORDER so it
        // automatically spans new beats (e.g. the Navigate park's
        // pass-01a / navigate / pass-01b sub-beats) without churn.
        visibilityBeats: [...BEAT_ORDER],
        fadeFrac: 0,
        onPaint: (ctx, element) => {
          const inner = innerRef.current;
          if (!inner) return;

          const { transform, camera, vw, vh, screenX, screenY, worldPos } = ctx;
          const { paintProgress, beat, epilogueProgress, docked } = transform;
          // Drive geometry off `paintProgress` so during the armed
          // pre-arm pass the mark is sized + placed at parked
          // Thoughtform. We now paint at FULL opacity during armed
          // too, so the brandmark is visible the moment the stage
          // starts rising into view — the second section reads as
          // composed on arrival rather than fading in only after the
          // stage finishes pinning.
          const progress = paintProgress;

          // Display is resolved after the renderer-ownership check below.
          // Once the particle core owns the silhouette, this DOM layer is
          // cut from rendering instead of opacity-fading above the canvas.

          // ── Decide which projection path owns this frame ─────
          // Corridor path (tracker camera) owns Navigate → Build.
          // Once we enter the epilogue (BUILD_OUT) the corridor
          // camera is parked at CAMERA_END but the LIVE camera flies
          // through the planet landing → docked instrument → fly-in
          // dissipate. Switch to a mirror camera that follows the
          // same pose chain as `FlyingCameraRig` so the welded mark
          // tracks the visible sphere on screen, not the (now stale)
          // corridor parked pose.
          const useEpilogueOverride = docked || epilogueProgress > 1e-3;

          let left: number;
          let top: number;
          let width: number;
          let height: number;

          if (!useEpilogueOverride) {
            // ── Corridor path: tracker-owned world projection ──
            // Width from world half-extent — project an edge point
            // and measure the screen-space distance from the centre.
            // This picks up camera dolly + camera roll + the beat-
            // to-beat half-extent ramp automatically.
            const halfExtent = getBrandmarkWrapHalfExtent(progress);
            scratch.current.right.setFromMatrixColumn(camera.matrixWorld, 0);
            scratch.current.target.set(worldPos[0], worldPos[1], worldPos[2]);
            scratch.current.edge
              .copy(scratch.current.target)
              .addScaledVector(scratch.current.right, halfExtent);
            scratch.current.edgeProjected.copy(scratch.current.edge).project(camera);
            const edgeScreenX = (scratch.current.edgeProjected.x * 0.5 + 0.5) * vw;
            const halfPixelWidth = Math.abs(edgeScreenX - screenX);
            width = halfPixelWidth * 2;
            height = width * BRANDMARK_ASPECT;
            left = screenX - width / 2;
            top = screenY - height / 2;
          } else {
            // ── Epilogue / dock override: weld to live sphere ──
            // Delegated to `computeWeldedRect` so the SAME math + cache
            // also powers the post-active parallel rAF below (which
            // takes over once the corridor stage's sticky cell releases
            // before the dissipate clock completes).
            const rect = computeWeldedRect(
              epRef.current,
              performance.now(),
              getSmoothedEpilogueProgress(),
              docked,
              getSmoothedDissipate(),
              vw,
              vh
            );
            left = rect.left;
            top = rect.top;
            width = rect.width;
            height = rect.height;
          }

          // The tracker wrote translate3d using the ANCHOR centre.
          // We want the anchor to map to the centre of the
          // brandmark, so override transform with the top-left
          // origin coords here.
          element.style.transform = `translate3d(${left.toFixed(2)}px, ${top.toFixed(2)}px, 0)`;
          element.style.width = `${width.toFixed(2)}px`;
          element.style.height = `${height.toFixed(2)}px`;

          // ── Opacity ─────────────────────────────────────────
          // The epilogue v3 APPROACH-band opacity fade is GONE
          // (ADR-021 follow-up, 2026-06-16). The mark now exits
          // GEOMETRICALLY via the welded projection above — it
          // rides the sphere below the viewport during the
          // landing tilt-up, and the docked re-centre brings it
          // back into view as the planet scatters around it. The
          // old post-Build tail fade is also gone: Build must retain
          // the brandmark; it becomes invisible only when the sphere
          // moves it out of view.
          //
          // ADR-023 handoff: across the substrate-wrap band the
          // in-canvas particle core takes renderer ownership. This
          // ownership check only applies to the corridor path; the
          // epilogue / dock branch is always particle-owned.
          //
          // Slightly brighter at parked beats than during transits.
          // The Navigate park is intentionally NOT included: the mark
          // is mid-flight LEADING the camera through Navigate (it is
          // not anchored there), so it stays at transit intensity while
          // the gate + title own the parked moment.
          const isParkedBeat =
            beat === "thoughtform" || beat === "diagnostic" || beat === "intelligence";
          const intensity = isParkedBeat ? 1 : 0.92;
          // Mobile two-moment beat: the mark only fades in for Moment 2
          // (the brandmark + diagram reveal). `diagramFactor` is 1 on
          // desktop and 1 once raw progress passes the dwell, so it's a
          // no-op everywhere except the mobile copy moment.
          const { diagramFactor } = getThoughtformMobilePhase(transform.progress);
          // ── HYBRID SVG-REST + MATCHED-PIXEL HANDOFF (ADR-023, 2026-06-25) ──
          // The corridor brandmark is two painters with an INVISIBLE seam.
          // The DOM SVG owns the rest state at full opacity until corridor
          // progress crosses BRANDMARK_CORE_HANDOFF_PROGRESS (the substrate
          // wrap start, currently 0.30); at the swap frame the SVG cuts to
          // display:none in the SAME frame BrandmarkPhysicsCoreActor seeds
          // the GPGPU sim with world positions that reproject to this rect.
          // The eye sees no swap because the particles ARE the SVG at frame
          // N+1. No opacity ramp — opacity is binary, gated on the
          // pre-handoff band. The epilogue / dock branch is still
          // particle-owned (untouched).
          void intensity;
          void diagramFactor;
          // Publish the current rect every paint frame so the physics-core
          // actor can rasterise against fresh coordinates the instant the
          // swap fires. Cheap — just a ref write — and lets the rasterise
          // run against camera state that matches what the user just saw.
          writeBrandmarkScreenRect(left, top, width, height, performance.now());

          // Visibility:
          //   - Epilogue / dock branch: legacy particle-owned — keep hidden.
          //   - Corridor rest (progress < HANDOFF): SVG is the visible mark.
          //   - Corridor morph onward (progress >= HANDOFF): instant cut to
          //     display:none. The cut is a single style write per frame —
          //     it stays cut as long as progress >= HANDOFF.
          const ownsRestState = !useEpilogueOverride && progress < BRANDMARK_CORE_HANDOFF_PROGRESS;
          if (ownsRestState) {
            element.style.zIndex = `${PROJECTED_BRANDMARK_TOP_Z_INDEX}`;
            element.style.opacity = "1";
            element.style.display = "block";
          } else {
            element.style.zIndex = `${PROJECTED_BRANDMARK_UNDER_CANVAS_Z_INDEX}`;
            element.style.opacity = "0";
            element.style.display = "none";
          }

          // Forward tilt: the inner div takes a small Y rotation
          // scaled by camera dolly so the mark reads as a 3D plate
          // in motion. When the gyro lab is enabled, bank the mark
          // with the gimbal (ref read — no store subscription).
          const dollyTilt = (progress - 0.5) * 6; // ±3° across the corridor
          let gyroBankX = 0;
          let gyroBankY = 0;
          let gyroBankZ = 0;
          if (useGyroLabStore.getState().enabled) {
            gyroBankX = gyroTilt.x * (180 / Math.PI);
            gyroBankY = gyroTilt.y * (180 / Math.PI);
            gyroBankZ = gyroTilt.z * (180 / Math.PI);
          }
          inner.style.transformOrigin = "50% 50%";
          inner.style.transform = `rotateX(${gyroBankX.toFixed(2)}deg) rotateY(${(dollyTilt + gyroBankY).toFixed(2)}deg) rotateZ(${gyroBankZ.toFixed(2)}deg)`;
        },
      },
    ];
  }, []);

  // The actor is mounted inside `.home-v2-stage__sticky`. Because
  // the shell is absolute inside the sticky stage (not fixed on
  // document.body), armed-state prepaint is clipped to the incoming
  // Thoughtform section instead of floating over the hero. Once
  // `data-services-brandmark` is set on `<html>` (see
  // `useCorridorExitScroll`), CSS promotes the shell to `position:
  // fixed` so it can outlive the sticky stage and hold centred in
  // `#services`.
  useWorldDomTracker(anchors, shellRef);

  // ── Post-active painter ────────────────────────────────────────
  // The tracker's onPaint above only runs while `active || armed`
  // (the corridor stage's sticky cell is engaged with the viewport).
  // ADR-021 keeps the canvas docked PAST that boundary: dock engages
  // when `epilogueProgress >= 0.72` and only releases at
  // `dissipateProgress >= 0.999`, ~1 viewport AFTER the stage's
  // sticky cell scrolls past. Without a second painter the brandmark
  // would vanish the moment `active` flips false (Services section
  // top reaching viewport top), instead of completing its recentre
  // lerp into the section.
  //
  // This rAF takes over for that gap. It is gated on the INVERSE of
  // the tracker's `painting` clause, so the two paths never run on
  // the same frame and share `epRef.current` safely. It handles:
  //
  //   1. Post-active dock window — keep painting the welded /
  //      recentre rect via the SAME helper the tracker calls, so the
  //      visible path is continuous across the active boundary. CSS
  //      promotes `.home-v2-projected-brandmark` to `position: fixed`
  //      under `[data-corridor-docked="true"]` so the rect (written in
  //      viewport pixels) lands at the right screen coords once the
  //      sticky containing block is gone.
  //   2. Services hold / fade — `data-services-brandmark` is `"hold"`
  //      while the section's centre band is reading, then `"fade"`
  //      as `#continuum` enters. CSS owns the fixed-centred
  //      transform + opacity via the `--services-brandmark` var
  //      under those gates, so we just CLEAR the inline styles the
  //      tracker / post-active rAF wrote, letting the gate selector
  //      win.
  //   3. Fully released — no dock, no gate. Ensure opacity is 0.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const shell = shellRef.current;
      if (!shell) return;

      const t = useDepthGatewayStore.getState().transform;
      // Tracker owns these frames.
      if (t.active || t.armed) return;

      // Core-shrink handoff (2026-06-20): across the whole epilogue /
      // dock / Services seam the in-canvas particle core owns the mark
      // (it shrinks from sphere-fill to the centred centerpiece). The
      // welded SVG no longer paints here at all, so once the corridor
      // tracker releases `active`/`armed` we simply keep it hidden.
      if (shell.style.opacity !== "0") shell.style.opacity = "0";
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={shellRef}
      data-world-anchor="home-v2.brandmark"
      className="home-v2-projected-brandmark"
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        opacity: 0,
        pointerEvents: "none",
        zIndex: PROJECTED_BRANDMARK_TOP_Z_INDEX,
        display: "none",
        perspective: `${PERSPECTIVE_PX}px`,
        // Unified-gold glow (176,139,66 == TENSOR_GOLD #b08b42) so the rest
        // mark's halo matches its fill + the particle flight + landed wireframe
        // — one continuous darker-orange across the corridor journey (ADR-023).
        filter: "drop-shadow(0 0 18px rgba(176, 139, 66, 0.42))",
        willChange: "transform, width, height, opacity",
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
        <BrandmarkGlyph outline={false} decorative fill={TENSOR_GOLD} />
      </div>
    </div>
  );
}
