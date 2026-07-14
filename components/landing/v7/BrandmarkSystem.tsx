"use client";

import { forwardRef, useLayoutEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { BrandmarkActor, type BrandmarkActorHandle } from "./BrandmarkActor";
import { BrandmarkGlyph } from "./BrandmarkGlyph";
import { CanvasErrorBoundary } from "@/components/hud/CanvasErrorBoundary";
import { BrandmarkVectorActor, BrandmarkRingGlyph } from "@/components/brand/BrandmarkVectorActor";

// Lazy seam (2026-07-14 perf pass): the particle canvas is the LAST
// static consumer of three/@react-three/fiber in the landing's initial
// graph — splitting it moves the whole WebGL runtime out of First Load
// JS. `ssr: false` is contract-identical (the R3F canvas never paints
// on the server), and a late-arriving chunk is visually benign by
// design: the vector actor + dock glyphs ARE the brand mark; this
// canvas only adds atmosphere grain + transit exhaust (see the
// error-boundary note at the render site).
const BrandmarkParticleCanvas = dynamic(
  () =>
    import("@/components/brand/BrandmarkParticleField").then((m) => ({
      default: m.BrandmarkParticleCanvas,
    })),
  { ssr: false }
);

/**
 * BrandmarkSystem
 *
 * Single React entry point for the v7 landing-page brandmark.
 *
 * ADR-013: the brandmark journey is a single continuous transform
 * owned by `useBrandmarkJourney`. This component mounts the rendering
 * surface for both render modes:
 *
 *   - PARTICLE mode (default): the global `BrandmarkParticleCanvas`
 *     is the SOLE painter for the brandmark cloud throughout the
 *     entire journey. It reads the `BrandmarkTransform` from
 *     `brandmarkJourneyStore` every frame. The portal'd `BrandmarkGlyph`
 *     dock SVGs are present in DOM but hidden by CSS via the
 *     `[data-brandmark-mode="particle"]` gate. The fixed
 *     `BrandmarkActor` is also hidden via CSS (it has no role in
 *     particle mode).
 *
 *   - SVG mode (reduced motion / no WebGL): the particle canvas
 *     does not mount. The native dock SVGs paint at their parked
 *     positions via `data-brand-on-*="parked"` CSS gates (set by
 *     `useBrandmarkJourney` in SVG mode). The fixed `BrandmarkActor`
 *     paints during transit beats (pinned to the journey transform's
 *     rect by `useBrandmarkJourney`).
 *
 * Responsibilities:
 *   1. Discover anchor slots in the parsed prototype HTML via
 *      `data-brand-anchor`.
 *   2. Portal one `BrandmarkGlyph` into each anchor — every dock
 *      paints from the same code source, not from separate raster
 *      `<img>` copies.
 *   3. Render one `BrandmarkActor` for the SVG-mode travel pass.
 *   4. Render the `BrandmarkParticleCanvas` (which mounts its own
 *      R3F context only in particle mode).
 *
 * @see `BrandmarkGlyph.tsx` — canonical SVG geometry source.
 * @see `useBrandmarkJourney.ts` — scroll-driven journey hook.
 * @see ADR-013 (`sentinel/decisions/013-brandmark-journey-refactor.md`).
 */

type AnchorKey = "sigil" | "missing" | "substrate" | "rail" | "orbit";

const ANCHOR_KEYS: readonly AnchorKey[] = ["sigil", "missing", "substrate", "rail", "orbit"];

export interface BrandmarkSystemProps {
  /** Reference to the landing page root that wraps the parsed
   *  prototype HTML. Anchor slots (`data-brand-anchor="..."`) are
   *  queried inside this ref. */
  rootRef: RefObject<HTMLElement | null>;
}

/** Render the canonical brandmark system for a v7 landing page.
 *
 *  Forwards a ref to the underlying `BrandmarkActor` so
 *  `useBrandmarkJourney` can drive transit pins via the imperative
 *  `pinToRect` / `hide` API in SVG-fallback mode. In particle mode
 *  the global `BrandmarkParticleCanvas` is the painter and the
 *  actorRef is unused. */
export const BrandmarkSystem = forwardRef<BrandmarkActorHandle, BrandmarkSystemProps>(
  function BrandmarkSystem({ rootRef }, ref) {
    /** Map of anchor key → DOM element, resolved after the prototype
     *  HTML mounts. `null` entries are tolerated (e.g. on short
     *  prototypes that omit a station). */
    const [anchorEls, setAnchorEls] = useState<Partial<Record<AnchorKey, HTMLElement>>>({});

    useLayoutEffect(() => {
      const root = rootRef.current;
      if (!root) return;

      // Discover anchor slots. The parser has already stripped the
      // placeholder `<img>` from each slot, so the elements should be
      // empty — we don't need to clear children defensively, but we
      // do log a warning in dev if the parser missed a slot.
      const els: Partial<Record<AnchorKey, HTMLElement>> = {};
      for (const key of ANCHOR_KEYS) {
        const el = root.querySelector<HTMLElement>(`[data-brand-anchor="${key}"]`);
        if (el) {
          if (process.env.NODE_ENV !== "production" && el.children.length > 0) {
            console.warn(
              `[BrandmarkSystem] Anchor slot "${key}" still has child nodes; ` +
                `the v7 parser should have stripped them. Children:`,
              el.children
            );
          }
          els[key] = el;
        }
      }
      setAnchorEls(els);

      // Re-observe on layout-only DOM updates that might re-inject
      // the anchors (e.g. admin edits, prototype reloads). This is
      // defensive — under normal navigation the layout effect above
      // is sufficient.
      const observer = new MutationObserver(() => {
        let dirty = false;
        const next: Partial<Record<AnchorKey, HTMLElement>> = {};
        for (const key of ANCHOR_KEYS) {
          const el = root.querySelector<HTMLElement>(`[data-brand-anchor="${key}"]`);
          if (el !== els[key]) dirty = true;
          if (el) next[key] = el;
        }
        if (dirty) setAnchorEls(next);
      });
      observer.observe(root, { childList: true, subtree: true });
      return () => observer.disconnect();
    }, [rootRef]);

    return (
      <>
        {ANCHOR_KEYS.map((key) => {
          const el = anchorEls[key];
          if (!el) return null;
          return <BrandmarkAnchorPortal key={key} container={el} anchorKey={key} />;
        })}
        <BrandmarkActor ref={ref} />
        {/* Vector-first brandmark painter. Mounts once and reads the
            journey transform from `brandmarkJourneyStore` on every
            rAF tick, writing rect / opacity / rotation / shapeBlend
            directly to inline styles. Hidden in SVG-fallback mode by
            the `[data-brandmark-mode="svg"]` CSS gate; in particle
            mode this is the primary brandmark painter and the
            particle canvas paints only atmospheric grain + transit
            exhaust around it. */}
        <BrandmarkVectorActor />
        {/* Shared R3F canvas. In the vector-first model the canvas
            no longer paints the brandmark shape — it paints
            atmospheric grain (sparse luminous dust during the
            substrate window) and transit exhaust (motion trails
            during inter-keyframe lerps). The single
            `BrandmarkParticleStation` (renamed `BrandmarkAtmosphere`
            in subsequent phases) reads the same journey transform
            but consumes it as atmosphere, not as the mark itself.
            Boundary fallback is null on purpose: if the painter
            crashes, the vector actor + dock glyphs above keep the
            brand visible — losing atmosphere grain is invisible. */}
        <CanvasErrorBoundary fallback={null}>
          <BrandmarkParticleCanvas />
        </CanvasErrorBoundary>
      </>
    );
  }
);

BrandmarkSystem.displayName = "BrandmarkSystem";

/** Portal one (or two) `BrandmarkGlyph` instances into a specific
 *  anchor's DOM slot.
 *
 *  The glyph inherits its size from the anchor's CSS (each anchor
 *  rule in `landing.css` defines `width`/`height`). Visibility is
 *  driven by parent CSS rules tied to the choreography state
 *  attributes (`[data-brand-on-missing="parked"]`,
 *  `[data-brand-on-rail="parked"]`, and the new
 *  `[data-brand-parked-at]` particle-mode handoff gate), so this
 *  component does not manage opacity — it only ensures the canonical
 *  glyph(s) are always present per anchor slot, ready to paint when
 *  the parent rule allows it.
 *
 *  The substrate anchor is special: while parked at substrate the
 *  brandmark morphs between the full mark and the ring-only
 *  topology (ADR-015). To support a CSS-driven crossfade (no JS per
 *  frame), we portal BOTH the full `BrandmarkGlyph` and a stacked
 *  `BrandmarkRingGlyph` into the anchor. The journey hook publishes
 *  `--brandmark-shape-blend` on documentElement; CSS opacity on each
 *  glyph reads that variable to fade between the two topologies. */
function BrandmarkAnchorPortal({
  container,
  anchorKey,
}: {
  container: HTMLElement;
  anchorKey: AnchorKey;
}) {
  // The orbit dock uses the outline overlay during the quote-cover
  // state, so it needs the outline `<image>` layer present even
  // though it stays at opacity 0 most of the time. All other docks
  // paint filled-only.
  const wantsOutline = anchorKey === "orbit";

  if (anchorKey === "substrate") {
    return createPortal(
      <>
        <BrandmarkGlyph
          className="tf-brandmark tf-brandmark--substrate tf-brandmark--substrate-full"
          outline={false}
          decorative
        />
        <BrandmarkRingGlyph
          className="tf-brandmark tf-brandmark--substrate tf-brandmark--substrate-ring"
          decorative
        />
      </>,
      container
    );
  }

  return createPortal(
    <BrandmarkGlyph
      className={`tf-brandmark tf-brandmark--${anchorKey}`}
      outline={wantsOutline}
      decorative
    />,
    container
  );
}
