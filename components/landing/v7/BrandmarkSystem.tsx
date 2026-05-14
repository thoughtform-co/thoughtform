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
 * The v7 landing has one travelling artifact (the Thoughtform
 * brandmark) that flows through:
 *
 *     hero → sigil → diagnostic → asking-gap → continuum rail
 *          → practice orbit → hidden
 *
 * Two render modes carry it:
 *
 *   - DOCK (parked): the canonical `BrandmarkGlyph` is portal'd into
 *     a section-owned anchor slot (`data-brand-anchor="..."`). The
 *     glyph rides inside that section's DOM, so it scrolls naturally
 *     with the page — no fixed-position jiggle while the visitor
 *     reads.
 *   - LIFT (travel): the fixed `BrandmarkActor` (also a
 *     `BrandmarkGlyph` under the hood) takes over for the transit
 *     legs between docks (and for the asking-gap backdrop / practice
 *     orbit pin, which have no native dock — the actor renders the
 *     glyph there directly).
 *
 * The `BrandmarkSystem` here is the single source of truth that:
 *   1. Discovers anchor slots in the parsed prototype HTML via
 *      `data-brand-anchor` (added in `landing-v7-motion.html` and
 *      stripped of their `<img>` placeholders by `lib/v7-parse.ts`).
 *   2. Portals one `BrandmarkGlyph` into each anchor — so every dock
 *      site on the page paints from the same code source, not from
 *      separate raster `<img>` copies that could drift in geometry
 *      or tint.
 *   3. Renders one `BrandmarkActor` for the fixed travel/backdrop
 *      passes.
 *
 * The choreography hook (`useSigilChoreography`) consumes the actor
 * via the `actorRef` forwarded through this component — same API as
 * before, so the GSAP timelines / ScrollTrigger / data-attr writes
 * are unchanged. What changes is what *paints*: instead of five
 * parallel `<img>` raster copies + one inline-SVG actor, we now have
 * four portal'd glyphs (one per anchor) + one actor, all rendered
 * from `BrandmarkGlyph`. Visibility gating remains driven by the
 * existing `[data-brand-on-missing="parked"]` and
 * `[data-brand-on-rail="parked"]` CSS rules.
 *
 * @see `BrandmarkGlyph.tsx` — canonical SVG geometry source.
 * @see `useSigilChoreography.ts` — scroll-driven state machine.
 * @see ADR-010 (`sentinel/decisions/010-brandmark-choreography.md`).
 */

type AnchorKey = "sigil" | "missing" | "rail" | "orbit";

const ANCHOR_KEYS: readonly AnchorKey[] = ["sigil", "missing", "rail", "orbit"];

export interface BrandmarkSystemProps {
  /** Reference to the landing page root that wraps the parsed
   *  prototype HTML. Anchor slots (`data-brand-anchor="..."`) are
   *  queried inside this ref. */
  rootRef: RefObject<HTMLElement | null>;
}

/** Render the canonical brandmark system for a v7 landing page.
 *
 *  Forwards a ref to the underlying `BrandmarkActor` so the
 *  choreography hook can drive transit and backdrop morphs via the
 *  imperative `morphRects` / `pinToRect` / `hide` API. */
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
            // eslint-disable-next-line no-console
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
        {/* Shared GL canvas that paints brandmark particles. Mounts
            only when the store is in `"particle"` mode (set by
            `useSigilChoreography` after a WebGL + reduced-motion
            probe). In `"svg"` mode it renders nothing and the
            existing actor + portal'd glyphs above paint unchanged.

            Phase B wires every station: sigil + miss + backdrop +
            rail + orbit. The dock stations run at full density and
            zero dispersion (visually indistinguishable from the
            SVG); the backdrop runs at the sparse "diagnostic" tier.
            CSS (`[data-brandmark-mode="particle"]`) hides the SVG
            actor + native dock glyphs at the parked states so the
            particle field is the sole painter. Transit between
            stations still uses the SVG actor — Phase C replaces
            that with a particle dispersion choreography. */}
        <BrandmarkParticleCanvas stations={["sigil", "miss", "backdrop", "rail", "orbit"]} />
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
