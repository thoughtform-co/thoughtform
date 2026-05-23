"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BrandmarkGlyph } from "@/components/landing/v7/BrandmarkGlyph";
import {
  getBrandmarkWorldHalfExtent,
  getBrandmarkWorldPosition,
  getCameraRoll,
  getSubstrateMorph,
} from "./DepthGatewayScene/sceneGeom";
import { type WorldAnchor, useWorldDomTracker } from "./hooks/useWorldDomTracker";

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
 *   - Roll: matches `getCameraRoll(progress)` so during the
 *     passthrough-01 bank the mark tilts with the camera.
 *
 * NO DOM-dock pinning. The previous hybrid (DOM-pin at parked beats
 * vs world-project during transits) is gone — co-location via the
 * gate group makes dock mode unnecessary.
 *
 * Substrate-cut: during the intelligence beat, when
 * `getSubstrateMorph(gateProgress) > 0`, the actor goes
 * `display: none` and the in-canvas substrate morph cloud paints the
 * silhouette (ADR-017 pattern).
 */

const PERSPECTIVE_PX = 1200;
const TAIL_FADE_OUT_START = 0.97;
const SUBSTRATE_CUT_EPSILON = 0.001;

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
        position: (transform) => getBrandmarkWorldPosition(transform.progress),
        // Brandmark is visible across all five beats; substrate-cut
        // is handled inside onPaint so the DOM hides during the
        // intelligence morph window.
        visibilityBeats: [
          "thoughtform",
          "passthrough-01",
          "diagnostic",
          "passthrough-02",
          "intelligence",
        ],
        fadeFrac: 0,
        onPaint: (ctx, element) => {
          const inner = innerRef.current;
          if (!inner) return;

          const { transform, camera, vw, screenX, screenY, worldPos } = ctx;
          const { progress, beat, gateProgress } = transform;

          // Hero-gate: during the hero scroll, `progress` stays
          // clamped at 0 (stage rect.top is still positive) even
          // though the tracker has flagged us active. We don't want
          // the brandmark painting over the pinned hero — it should
          // appear AT FULL OPACITY the moment the Thoughtform
          // section reaches the viewport (progress > 0), since
          // Thoughtform is the start of the journey.
          //
          // Substrate-cut: hide the DOM brandmark whenever the in-
          // canvas substrate morph cloud is painting (ADR-017).
          const heroGate = progress <= 0;
          const morph = beat === "intelligence" ? getSubstrateMorph(gateProgress) : 0;
          const substrateCut = morph > SUBSTRATE_CUT_EPSILON;
          if (heroGate || substrateCut) {
            element.style.display = "none";
            return;
          }
          // Neither gate active — clear any prior display:none set
          // by a previous frame (either hero-gate before the user
          // reached Thoughtform, or substrate-cut inside the
          // intelligence morph window).
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
          const isParkedBeat =
            beat === "thoughtform" || beat === "diagnostic" || beat === "intelligence";
          const intensity = isParkedBeat ? 1 : 0.92;
          element.style.opacity = `${(bookend * intensity).toFixed(3)}`;

          // Roll: the inner div takes the perspective rotation so
          // the outer shell stays a clean layout box.
          const roll = getCameraRoll(progress);
          // Add a small forward tilt that scales with camera dolly
          // so the mark reads as a 3D plate in motion.
          const dollyTilt = (progress - 0.5) * 6; // ±3° across the corridor
          inner.style.transform = `rotateZ(${(roll * (180 / Math.PI)).toFixed(
            2
          )}deg) rotateY(${dollyTilt.toFixed(2)}deg)`;
        },
      },
    ];
  }, []);

  const layerRef = useRef<HTMLElement | null>(null);
  // Bind the layer ref to the document body so the tracker scopes
  // its `[data-world-anchor]` query to the whole document. Using
  // `document.body` keeps the brandmark mountable even when the
  // page renders the actor outside the corridor stage.
  if (typeof document !== "undefined" && layerRef.current === null) {
    layerRef.current = document.body;
  }
  // The hook only reads from layerRef.current, so wrap into a stable
  // RefObject-shaped value once.
  const stableRef = useRef<HTMLElement | null>(null);
  stableRef.current = layerRef.current;
  useWorldDomTracker(anchors, stableRef);

  return (
    <div
      ref={shellRef}
      data-world-anchor="home-v2.brandmark"
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
