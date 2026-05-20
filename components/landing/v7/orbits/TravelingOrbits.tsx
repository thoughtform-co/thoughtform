"use client";

/**
 * TravelingOrbits — the persistent four-ring painter that travels
 * with the brandmark from the sigil dock (concentric circles in
 * `#definition`) to the miss dock (eccentric tilted ellipses in
 * `#missing-layer`) (ADR-017).
 *
 * Replaces the legacy two-tree handoff:
 *
 *   - `#definition .sigil__orbits` — sigil-side rings (scaled in place)
 *   - `#missing-layer .miss__orbits` — miss-side ellipses (faded in)
 *
 * The legacy SVG markup is hidden in particle mode by a
 * `[data-brandmark-mode="particle"]` CSS gate so this painter is
 * the sole orbit visual. SVG fallback (`mode === "svg"`) skips the
 * painter and the legacy markup remains visible — the existing
 * crossfade behaviour survives untouched.
 *
 * Architecture mirrors `BrandmarkVectorActor`:
 *
 *   - One imperative subscription to `useBrandmarkJourneyStore`.
 *   - Per-frame writes go directly to refs via `style.transform` —
 *     never through React state. Re-rendering the SVG every scroll
 *     frame would be catastrophic.
 *   - The component returns null in SVG mode.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useBrandmarkJourneyStore } from "@/lib/stores/brandmarkJourneyStore";
import { ORBIT_RINGS, computeOrbitsTransform } from "./orbitsJourney";

interface TravelingOrbitsProps {
  /** Landing-page root element (where `data-brandmark-mode` is set). */
  rootRef: React.RefObject<HTMLElement | null>;
}

// Mirrors `BRANDMARK_KEYFRAMES.miss.parkViewportFrac` in
// `lib/brandmark/journey.ts`. The orbits painter shares the journey
// timing exactly so the four rings land at the diagnostic
// constellation centre on the same scroll frame the brandmark vector
// docks at `.miss__brand-slot`. See the journey file's `miss` block
// for the rationale on the 0.72 value (the morph completes a clear
// beat before the visitor reaches the diagnostic title's reading
// position).
const MISS_PARK_VIEWPORT_FRAC = 0.72;

const BASE_VIEWBOX_WIDTH = 1100;
const BASE_VIEWBOX_HEIGHT = 650;

export function TravelingOrbits({ rootRef }: TravelingOrbitsProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const ringRefs = useRef<(SVGGElement | null)[]>([]);
  const [mode, setMode] = useState<"particle" | "svg">("svg");

  // Mode subscription. We only render the painter in particle mode;
  // in SVG mode the prototype DOM (sigil + miss orbit SVGs) handles
  // the morph via the legacy `--orbit-morph` / `--miss-orbit-emerge`
  // CSS gates.
  useEffect(() => {
    setMode(useBrandmarkJourneyStore.getState().mode);
    const unsubscribe = useBrandmarkJourneyStore.subscribe((state) => {
      setMode(state.mode);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Per-frame rAF loop that subscribes to the brandmark store, reads
  // the live anchor rects, and writes inline transforms onto the SVG
  // + each ring `<g>`. No React state writes here — this keeps the
  // per-frame cost at three setProperty calls per ring (transform,
  // stroke-width, stroke).
  useLayoutEffect(() => {
    if (mode !== "particle") return;
    const root = rootRef.current;
    if (!root) return;

    let rafId = 0;
    let lastMorph = -1;
    let lastStyleMorph = -1;
    // Start at sentinel values (well outside any plausible viewport
    // offset) so the first-frame comparison ALWAYS forces a transform
    // write. Initialising to NaN would defeat the diff check because
    // `NaN > 0.1` is `false` — the SVG would stay at its default
    // (0, 0) position forever.
    let lastCx = -1e9;
    let lastCy = -1e9;
    let lastVisible: boolean | null = null;
    let lastOpacity = -1;

    const compute = () => {
      rafId = 0;

      const store = useBrandmarkJourneyStore.getState();
      const t = store.transform;

      const sigilEl = root.querySelector<HTMLElement>(".sigil__mark");
      const missEl = root.querySelector<HTMLElement>("#missing-layer .miss__brand-slot");
      const definitionEl = root.querySelector<HTMLElement>("#definition");

      const orbits = computeOrbitsTransform({
        sigilEl,
        missEl,
        definitionEl,
        brandmarkOpacity: t.opacity,
        parkedAt: t.parkedAt,
        missParkViewportFrac: MISS_PARK_VIEWPORT_FRAC,
      });

      const svg = svgRef.current;
      if (!svg) return;

      if (!orbits || !orbits.visible) {
        if (lastVisible !== false) {
          lastVisible = false;
          svg.style.display = "none";
        }
        return;
      }

      if (lastVisible !== true) {
        lastVisible = true;
        svg.style.display = "";
      }

      // SVG-element transform: position the painter origin at the
      // brandmark's centre. The viewBox is `-W/2 -H/2 W H` so the
      // (0, 0) of the inner coordinate system sits at the SVG
      // element's geometric centre — translating the ELEMENT by the
      // brandmark centre's screen position puts every ring's origin
      // exactly where we need it.
      const offsetX = orbits.cx - BASE_VIEWBOX_WIDTH / 2;
      const offsetY = orbits.cy - BASE_VIEWBOX_HEIGHT / 2;
      if (Math.abs(offsetX - lastCx) > 0.1 || Math.abs(offsetY - lastCy) > 0.1) {
        lastCx = offsetX;
        lastCy = offsetY;
        svg.style.transform = `translate3d(${offsetX.toFixed(2)}px, ${offsetY.toFixed(2)}px, 0)`;
      }

      const morph = orbits.morph;
      const styleMorph = orbits.styleMorph;
      const morphChanged = Math.abs(morph - lastMorph) > 0.001;
      const styleMorphChanged = Math.abs(styleMorph - lastStyleMorph) > 0.001;

      if (morphChanged) {
        lastMorph = morph;
        for (let i = 0; i < ORBIT_RINGS.length; i++) {
          const ring = ringRefs.current[i];
          if (!ring) continue;
          const def = ORBIT_RINGS[i];
          const sx = 1 + (def.targetSx - 1) * morph;
          const sy = 1 + (def.targetSy - 1) * morph;
          const rot = def.targetRotateDeg * morph;
          // Inline transform on the inner `<g>`. transform-origin is
          // 0 0 (default for the SVG coord origin we set up).
          ring.setAttribute(
            "transform",
            `rotate(${rot.toFixed(3)}) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`
          );
        }
      }

      if (styleMorphChanged) {
        lastStyleMorph = styleMorph;
        // Per-ring stroke + width interpolation lives on the SVG via
        // CSS variables so the scoped CSS rules (see TRAVELING_ORBITS
        // section in landing.css) interpolate without per-frame JS
        // colour math.
        svg.style.setProperty("--orbit-style-morph", styleMorph.toFixed(3));
      }

      if (Math.abs(orbits.opacity - lastOpacity) > 0.005) {
        lastOpacity = orbits.opacity;
        svg.style.opacity = orbits.opacity.toFixed(3);
      }
    };

    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(compute);
    };

    // The brandmark store updates every scroll/resize frame already
    // (via `useBrandmarkJourney`). We re-derive the orbits transform
    // on the same beat by subscribing to the store.
    const unsubscribe = useBrandmarkJourneyStore.subscribe(() => {
      schedule();
    });

    // Initial compute (covers cases where the brandmark store is
    // already populated before this hook attaches).
    schedule();

    // Resize hook — anchor rects change on resize even when scroll
    // doesn't fire.
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });

    return () => {
      unsubscribe();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [mode, rootRef]);

  if (mode !== "particle") return null;

  return (
    <svg
      ref={svgRef}
      className="tf-traveling-orbits"
      width={BASE_VIEWBOX_WIDTH}
      height={BASE_VIEWBOX_HEIGHT}
      viewBox={`${-BASE_VIEWBOX_WIDTH / 2} ${-BASE_VIEWBOX_HEIGHT / 2} ${BASE_VIEWBOX_WIDTH} ${BASE_VIEWBOX_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      data-orbit-painter="traveling"
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        pointerEvents: "none",
        // z-index sits between the gateway / section background
        // (which is below) and the brandmark canvas (z:23 — see
        // BrandmarkParticleCanvas). Orbits read as a halo BEHIND
        // the crisp vector mark.
        zIndex: 22,
        // Painter starts hidden; the per-frame loop reveals it on
        // first compute.
        display: "none",
        // The brandmark journey already drives a `--orbit-morph`
        // CSS variable on the rootEl; we mirror it here scoped to
        // this SVG so the per-ring stroke/dash CSS rules can react
        // without polluting the global root state.
        ["--orbit-style-morph" as never]: 0,
        willChange: "transform, opacity",
      }}
      overflow="visible"
    >
      <g fill="none" strokeWidth="0.6">
        {ORBIT_RINGS.map((ring, i) => (
          <g
            key={ring.id}
            ref={(el) => {
              ringRefs.current[i] = el;
            }}
            data-ring={ring.id}
            className={`tf-traveling-orbit tf-traveling-orbit--${ring.id}`}
          >
            <circle cx="0" cy="0" r={ring.radius} />
          </g>
        ))}
      </g>
    </svg>
  );
}
