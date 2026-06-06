"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BrandmarkGlyph } from "@/components/landing/v7/BrandmarkGlyph";
import {
  SUBSTRATE_CROSSFADE_END,
  getBrandmarkWorldHalfExtent,
  getBrandmarkWorldPosition,
  getIntelligenceSubstratePresence,
  getThoughtformMobilePhase,
} from "./DepthGatewayScene/sceneGeom";
import { type WorldAnchor, useWorldDomTracker } from "./hooks/useWorldDomTracker";
import { BEAT_ORDER } from "@/lib/home-v2/corridorMap";

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
 *     `getBrandmarkWorldHalfExtent(progress)` so it dollies + scales
 *     with the camera as a real 3D plate.
 *   - Forward tilt: a small Y rotation scaled by camera dolly so the
 *     mark reads as a 3D plate in motion (the camera path itself is
 *     axial, so no banking roll is applied).
 *
 * NO DOM-dock pinning. The previous hybrid (DOM-pin at parked beats
 * vs world-project during transits) is gone — co-location via the
 * gate group makes dock mode unnecessary.
 *
 * Substrate-cut: during the intelligence beat, when the substrate
 * morph engages (see `getIntelligenceSubstratePresence`), the DOM
 * mark cross-fades out and the in-canvas substrate morph cloud
 * paints the silhouette (ADR-017 pattern). The DOM glyph owns the
 * brandmark across the ENTIRE journey up to that hand-off — the
 * 2026-06-06 traveling-cloud experiment (Phase 4) was reverted on
 * user feedback because the brandmark belongs on the DOM layer
 * across travel, not as particles.
 */

const PERSPECTIVE_PX = 1200;
const TAIL_FADE_OUT_START = 0.97;

/** Aspect ratio of the BrandmarkGlyph SVG (height/width). */
const BRANDMARK_ASPECT = 436 / 430.99;

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

  // Single dynamic anchor that resolves to the brandmark's current
  // travelling world position. The tracker handles the projection +
  // visibility envelope; the onPaint callback writes brandmark-
  // specific size + roll + substrate-cut state.
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

          const { transform, camera, vw, screenX, screenY, worldPos } = ctx;
          const { paintProgress, beat } = transform;
          // Drive geometry off `paintProgress` so during the armed
          // pre-arm pass the mark is sized + placed at parked
          // Thoughtform. We now paint at FULL opacity during armed
          // too, so the brandmark is visible the moment the stage
          // starts rising into view — the second section reads as
          // composed on arrival rather than fading in only after the
          // stage finishes pinning.
          const progress = paintProgress;

          // Substrate cross-fade: drive the DOM brandmark's exit
          // from the SAME `morph` channel used by the substrate
          // cloud (`getIntelligenceSubstratePresence`). The cloud
          // emerges faintly in brandmark form during late
          // `passthrough-02` (depth-driven approach glow, see
          // ADR-018 2026-05-24 revision), but the DOM mark only
          // begins to fade once the morph itself engages — i.e.,
          // once the cloud is actively losing brandmark silhouette
          // for the Fibonacci sphere. This keeps the DOM lead
          // brandmark visible across the approach (so the user
          // still has an artifact to chase into the corridor) and
          // hands off to the particles only when the substrate
          // cloud is structurally taking over the silhouette.
          const { morph } = getIntelligenceSubstratePresence(transform);
          const substrateFadeOut =
            morph <= 0
              ? 1
              : morph >= SUBSTRATE_CROSSFADE_END
                ? 0
                : 1 - morph / SUBSTRATE_CROSSFADE_END;
          // Once the cloud has fully taken over, suppress all DOM
          // updates so we don't spend layout work on an invisible
          // element. The element is left visible (no display:none)
          // so that scrolling back up resumes the fade-in naturally.
          if (substrateFadeOut <= 0.001) {
            element.style.opacity = "0";
            return;
          }
          if (element.style.display === "none") element.style.display = "";

          // Width from world half-extent — project an edge point and
          // measure the screen-space distance from the centre. This
          // picks up camera dolly + camera roll + the beat-to-beat
          // half-extent ramp automatically.
          const halfExtent = getBrandmarkWorldHalfExtent(progress);
          scratch.current.right.setFromMatrixColumn(camera.matrixWorld, 0);
          scratch.current.target.set(worldPos[0], worldPos[1], worldPos[2]);
          scratch.current.edge
            .copy(scratch.current.target)
            .addScaledVector(scratch.current.right, halfExtent);
          scratch.current.edgeProjected.copy(scratch.current.edge).project(camera);
          const edgeScreenX = (scratch.current.edgeProjected.x * 0.5 + 0.5) * vw;
          const halfPixelWidth = Math.abs(edgeScreenX - screenX);
          const width = halfPixelWidth * 2;
          const height = width * BRANDMARK_ASPECT;
          const left = screenX - width / 2;
          const top = screenY - height / 2;

          // The tracker wrote translate3d using the ANCHOR centre.
          // We want the anchor to map to the centre of the
          // brandmark, so override transform with the top-left
          // origin coords here.
          element.style.transform = `translate3d(${left.toFixed(2)}px, ${top.toFixed(2)}px, 0)`;
          element.style.width = `${width.toFixed(2)}px`;
          element.style.height = `${height.toFixed(2)}px`;

          // Tail fade-out. The head transition is a hard hero-gate
          // (above) rather than a fade — the brandmark is already
          // visible the moment we enter Thoughtform (Principle 5:
          // only the post-orbit exit uses an opacity ramp).
          let bookend = 1;
          if (progress > TAIL_FADE_OUT_START) {
            bookend = Math.max(0, 1 - (progress - TAIL_FADE_OUT_START) / (1 - TAIL_FADE_OUT_START));
          }
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
          element.style.opacity = `${(bookend * intensity * substrateFadeOut * diagramFactor).toFixed(3)}`;

          // Forward tilt: the inner div takes a small Y rotation
          // scaled by camera dolly so the mark reads as a 3D plate
          // in motion. No Z roll — the camera path is axial.
          const dollyTilt = (progress - 0.5) * 6; // ±3° across the corridor
          inner.style.transform = `rotateY(${dollyTilt.toFixed(2)}deg)`;
        },
      },
    ];
  }, []);

  // The actor is mounted inside `.home-v2-stage__sticky`. Because
  // the shell is absolute inside the sticky stage (not fixed on
  // document.body), armed-state prepaint is clipped to the incoming
  // Thoughtform section instead of floating over the hero.
  useWorldDomTracker(anchors, shellRef);

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
        zIndex: 24,
        display: "none",
        perspective: `${PERSPECTIVE_PX}px`,
        filter: "drop-shadow(0 0 18px rgba(202, 165, 84, 0.42))",
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
        <BrandmarkGlyph outline={false} decorative />
      </div>
    </div>
  );
}
