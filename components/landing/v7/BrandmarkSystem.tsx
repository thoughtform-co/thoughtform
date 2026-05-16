"use client";

import { forwardRef, useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { BrandmarkActor, type BrandmarkActorHandle } from "./BrandmarkActor";
import { BrandmarkGlyph } from "./BrandmarkGlyph";
import { BrandmarkParticleCanvas } from "@/components/brand/BrandmarkParticleField";

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
        {/* ADR-013: single shared GL canvas that paints the brandmark
            particle cloud continuously throughout the journey. The
            canvas owns ONE `BrandmarkParticleStation` instance that
            reads the `BrandmarkTransform` from `brandmarkJourneyStore`
            every frame — no per-station snapshots, no HARD SWAPs.
            Mounts only when the journey store is in `"particle"` mode
            (set by `useBrandmarkJourney` after a WebGL +
            reduced-motion probe). In `"svg"` mode it renders nothing
            and the actor + portal'd glyphs paint via the SVG
            fallback path. */}
        <BrandmarkParticleCanvas />
      </>
    );
  }
);

BrandmarkSystem.displayName = "BrandmarkSystem";

/** Portal one `BrandmarkGlyph` into a specific anchor's DOM slot.
 *
 *  The glyph inherits its size from the anchor's CSS (each anchor
 *  rule in `landing.css` defines `width`/`height`). Visibility is
 *  driven by parent CSS rules tied to the choreography state
 *  attributes (`[data-brand-on-missing="parked"]`,
 *  `[data-brand-on-rail="parked"]`, etc.) so this component does
 *  not manage opacity — it only ensures *one* canonical glyph is
 *  always present per anchor slot, ready to paint when the parent
 *  rule allows it. */
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

  return createPortal(
    <BrandmarkGlyph
      className={`tf-brandmark tf-brandmark--${anchorKey}`}
      outline={wantsOutline}
      decorative
    />,
    container
  );
}
