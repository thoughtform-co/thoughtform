"use client";

import { useEffect, useRef } from "react";
import { BrandmarkGlyph } from "@/components/landing/v7/BrandmarkGlyph";
import { BrandmarkRingGlyph } from "./BrandmarkRingGlyph";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";

/**
 * BrandmarkVectorActor — the vector-first painter for the v7
 * brandmark journey.
 *
 * Mounts ONCE inside `BrandmarkSystem` in particle mode (the default).
 * Reads the `BrandmarkTransform` from `brandmarkJourneyStore` on every
 * rAF tick and writes the rect (left/top/width/height) + opacity +
 * rotation directly to the actor's inline styles. No React re-renders.
 *
 * Replaces the previous "brandmark is a particle cloud" model: the
 * mark is now rendered as inline SVG end-to-end, vector-crisp at any
 * size. The particle field (now `BrandmarkAtmosphere`) is reserved
 * for atmospheric grain and transit exhaust — never the brandmark
 * shape itself.
 *
 * Two stacked SVG glyphs (`BrandmarkGlyph` filled vs
 * `BrandmarkRingGlyph` outer-arc-only) crossfade via the
 * `transform.shapeBlend` channel:
 *
 *   - `shapeBlend = 0` → full mark (sigil, miss, rail, orbit, transits)
 *   - `shapeBlend = 1` → ring-only (substrate hold beat)
 *
 * Both glyphs are pure code from the canonical shape table in
 * `lib/brandmark/shapes.ts`, so the morph is a single opacity dial —
 * no path interpolation needed.
 *
 * Rotation is honest 3D: the journey's `rotationY` is applied via CSS
 * `perspective(...) rotateY(...)` rather than the shader's 2D squash
 * approximation. At rotationY = 0 this is identity.
 *
 * Visible only when the journey store mode is `"particle"`. In SVG
 * fallback mode (reduced motion / no WebGL) the legacy
 * `BrandmarkActor` paints transit and the native dock SVGs handle
 * parked states.
 */

/** Perspective distance for the 3D Y rotation. Tuned visually — high
 *  enough that the squash reads as a tilt rather than a flat collapse,
 *  low enough that the front-on read at rotationY = 0 looks correct. */
const PERSPECTIVE_PX = 900;

/** Visibility cutoff. The shell is skipped (display: none via CSS)
 *  when the journey transform's opacity is below this. */
const VISIBILITY_EPSILON = 0.005;

/** Park-handoff opacity threshold. Mirrors the same constant in
 *  `useBrandmarkJourney` — the actor gates itself OFF when
 *  `parkedAt != null && opacity > THRESHOLD`, which is exactly when
 *  the journey hook writes `data-brand-parked-at` so the portal'd
 *  dock glyph CSS-fades in. Both painters share this threshold so
 *  their 120ms opacity transitions crossfade symmetrically. */
const PARKED_OPACITY_THRESHOLD = 0.99;

export function BrandmarkVectorActor() {
  const shellRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const fullRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const shell = shellRef.current;
    const inner = innerRef.current;
    const full = fullRef.current;
    const ring = ringRef.current;
    if (!shell || !inner || !full || !ring) return;

    // Cache last-written values so we only touch the DOM when
    // something actually changes. rAF runs at 60+ fps and the
    // journey hook writes a fresh transform every scroll frame, so
    // most ticks here are "nothing to do".
    let lastLeft = -1;
    let lastTop = -1;
    let lastWidth = -1;
    let lastHeight = -1;
    let lastEffectiveOpacity = -1;
    let lastRotation = -999;
    let lastShapeBlend = -1;
    let lastVisible: boolean | null = null;

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const transform = useBrandmarkJourneyStore.getState().transform;

      const shouldBeVisible = transform.visible && transform.opacity > VISIBILITY_EPSILON;
      if (shouldBeVisible !== lastVisible) {
        lastVisible = shouldBeVisible;
        shell.style.display = shouldBeVisible ? "block" : "none";
      }
      if (!shouldBeVisible) return;

      const { rect, opacity, rotationY, shapeBlend, parkedAt } = transform;

      if (rect.left !== lastLeft) {
        shell.style.left = `${rect.left}px`;
        lastLeft = rect.left;
      }
      if (rect.top !== lastTop) {
        shell.style.top = `${rect.top}px`;
        lastTop = rect.top;
      }
      if (rect.width !== lastWidth) {
        shell.style.width = `${rect.width}px`;
        lastWidth = rect.width;
      }
      if (rect.height !== lastHeight) {
        shell.style.height = `${rect.height}px`;
        lastHeight = rect.height;
      }
      // Park-handoff gate. While the journey is FULLY parked at a
      // keyframe (parkedAt non-null AND opacity at full), the portal'd
      // dock glyph inside the section's DOM is the visible painter
      // — so the actor stays at opacity 0. The threshold mirrors the
      // journey hook's `data-brand-parked-at` write gate so the
      // 120ms CSS opacity transitions on both painters crossfade
      // symmetrically at the handoff edge.
      //
      // Outside the fully-parked window the actor paints normally
      // at `transform.opacity`:
      //   - Transit beats: parkedAt === null → actor at opacity.
      //   - Entrance fade (parkedAt="sigil", opacity ramps 0→1):
      //     actor handles the ramp; portal'd glyph stays hidden
      //     until opacity crosses the threshold and the CSS gate
      //     flips on.
      //   - Post-orbit fade (parkedAt="orbit", opacity ramps 1→0):
      //     symmetric mirror.
      const fullyParked =
        parkedAt != null &&
        (parkedAt === "sigil" || parkedAt === "miss" || opacity > PARKED_OPACITY_THRESHOLD);
      const effectiveOpacity = fullyParked ? 0 : opacity;
      if (effectiveOpacity !== lastEffectiveOpacity) {
        shell.style.opacity = `${effectiveOpacity}`;
        lastEffectiveOpacity = effectiveOpacity;
      }
      if (rotationY !== lastRotation) {
        // Honest 3D Y-axis rotation. At rotationY = 0 this is identity.
        // CSS `perspective` lives on the parent shell so the inner can
        // rotate around its own centre without skewing the rect math.
        inner.style.transform = `rotateY(${rotationY}rad)`;
        lastRotation = rotationY;
      }
      if (shapeBlend !== lastShapeBlend) {
        // shapeBlend = 0 → full mark visible, ring hidden.
        // shapeBlend = 1 → ring visible, full hidden.
        // Both are absolutely positioned on top of each other so
        // the crossfade is a clean opacity swap.
        full.style.opacity = `${1 - shapeBlend}`;
        ring.style.opacity = `${shapeBlend}`;
        lastShapeBlend = shapeBlend;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={shellRef}
      className="tf-brandmark-vector-actor"
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
        filter: "drop-shadow(0 0 18px rgba(202, 165, 84, 0.32))",
        willChange: "left, top, width, height, opacity",
        // 120ms opacity transition smooths the park-handoff crossfade
        // when the journey hook flips data-brand-parked-at on/off.
        // Position changes are not transitioned — they need to track
        // the rect instantly during transit.
        transition: "opacity 120ms linear",
      }}
    >
      <div
        ref={innerRef}
        className="tf-brandmark-vector-actor__inner"
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <div
          ref={fullRef}
          className="tf-brandmark-vector-actor__full"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 1,
          }}
        >
          <BrandmarkGlyph outline={false} decorative />
        </div>
        <div
          ref={ringRef}
          className="tf-brandmark-vector-actor__ring"
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
          }}
        >
          <BrandmarkRingGlyph decorative />
        </div>
      </div>
    </div>
  );
}
