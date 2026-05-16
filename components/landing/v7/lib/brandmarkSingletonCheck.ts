/**
 * Brandmark singleton invariant check (dev-only).
 *
 * Enumerates every place on the v7 landing page where a brandmark
 * glyph can paint and verifies that at most one of them is visible at
 * the sampled scroll position. The v7 architecture distributes the
 * canonical `BrandmarkGlyph` across five dock slots (`.sigil__mark`,
 * `.miss__brand-slot`, `.ilayer__brandmark-anchor`, `.crail__brand`,
 * `.approach__orbit__mark`) plus one fixed travel actor
 * (`.tf-brandmark-actor`) plus the global particle canvas — at any
 * given scroll position, exactly zero or one of these should be
 * painting. More than one indicates a regression: a leak in the
 * journey, a wrong CSS gate, or a native dock paint that survived
 * a transit handoff.
 *
 * Per ADR-013 the brandmark journey is a single continuous transform
 * with ONE painter (the global particle canvas in particle mode, or
 * the SVG actor + native dock SVGs in SVG mode). The R3F intelligence-
 * layer scene paints rings only — it does not count as a brandmark
 * painter and is excluded from this check.
 *
 * The check runs as a `requestAnimationFrame` loop in dev (and only
 * in dev — production never imports this module) and logs a
 * `console.warn` whenever it observes a multi-instance frame.
 *
 * @see `BrandmarkSystem.tsx`
 * @see `useBrandmarkJourney.ts`
 * @see ADR-013.
 */

import { useEffect, type RefObject } from "react";

/** All selectors that can render a paint of the brandmark on v7.
 *  The fixed travel actor uses its own selector; each native dock
 *  site is paired with both `img` and `svg` because the portal'd
 *  glyph may be either depending on the BrandmarkGlyph render path.
 *  The global particle canvas is the single painter in particle mode
 *  (ADR-013) — it paints continuously, so it always counts as ONE
 *  visible painter while the brandmark is on screen. */
const BRANDMARK_RENDER_SELECTORS: readonly string[] = [
  '[data-brand-anchor="sigil"] :where(img, svg)',
  '[data-brand-anchor="missing"] :where(img, svg)',
  '[data-brand-anchor="substrate"] :where(img, svg)',
  '[data-brand-anchor="rail"] :where(img, svg)',
  '[data-brand-anchor="orbit"] :where(img, svg)',
  ".tf-brandmark-actor",
  ".tf-brandmark-particle-canvas",
];

/** Opacity below which a brandmark element is considered "not
 *  visible" for the singleton check. The 0.04 floor leaves headroom
 *  against opacity rounding noise. */
const VISIBILITY_OPACITY_THRESHOLD = 0.04;

interface VisibleBrandmark {
  selector: string;
  el: Element;
  rect: DOMRect;
  opacity: number;
  cssVisibility: string;
}

/** Determine whether an element is currently "painting" the
 *  brandmark. Walks up the parent chain to compute *effective*
 *  visibility — many v7 brandmark anchors set `opacity: 0` on the
 *  *parent* slot (e.g. `.crail__brand` itself, not the inner `<svg>`),
 *  so a naïve `getComputedStyle(el).opacity` check on the inner SVG
 *  would mis-report it as painting. The check accumulates opacity by
 *  multiplication and short-circuits on `display: none` /
 *  `visibility: hidden` at any ancestor up to (but not including)
 *  the document element. */
function isElementPainting(el: Element): {
  painting: boolean;
  opacity: number;
  visibility: string;
} {
  const ownStyle = window.getComputedStyle(el);
  const ownVisibility = ownStyle.visibility;
  let effectiveOpacity = 1;
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const cs = window.getComputedStyle(node);
    if (cs.display === "none") {
      return { painting: false, opacity: 0, visibility: cs.visibility };
    }
    if (cs.visibility === "hidden" || cs.visibility === "collapse") {
      return { painting: false, opacity: 0, visibility: cs.visibility };
    }
    const layerOpacity = parseFloat(cs.opacity || "1");
    if (Number.isFinite(layerOpacity)) effectiveOpacity *= layerOpacity;
    if (effectiveOpacity <= VISIBILITY_OPACITY_THRESHOLD) {
      return { painting: false, opacity: effectiveOpacity, visibility: ownVisibility };
    }
    node = node.parentElement;
  }
  const rect = el.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return { painting: false, opacity: effectiveOpacity, visibility: ownVisibility };
  }
  // Off-viewport elements aren't painting from the visitor's
  // perspective — ignore them. Use a small margin so a brandmark
  // about to scroll into view doesn't flicker the check.
  const vh = window.innerHeight || 0;
  if (rect.bottom < -32 || rect.top > vh + 32) {
    return { painting: false, opacity: effectiveOpacity, visibility: ownVisibility };
  }
  return { painting: true, opacity: effectiveOpacity, visibility: ownVisibility };
}

/** One-shot enumeration: returns every brandmark element on the
 *  page that is currently painting. The fixed actor is multiplied
 *  by its parents' computed opacity because the CSS hides it via
 *  `[data-brand-on-missing="parked"]` / `[data-brand-on-rail=
 *  "parked"]` rules that target the actor directly, which
 *  `getComputedStyle().opacity` reflects.  */
export function enumerateVisibleBrandmarks(): VisibleBrandmark[] {
  if (typeof document === "undefined") return [];
  const visible: VisibleBrandmark[] = [];
  for (const selector of BRANDMARK_RENDER_SELECTORS) {
    let nodes: NodeListOf<Element>;
    try {
      nodes = document.querySelectorAll(selector);
    } catch {
      continue;
    }
    nodes.forEach((el) => {
      const { painting, opacity, visibility } = isElementPainting(el);
      if (painting) {
        visible.push({
          selector,
          el,
          rect: el.getBoundingClientRect(),
          opacity,
          cssVisibility: visibility,
        });
      }
    });
  }
  return visible;
}

/** Run the singleton invariant check periodically while the
 *  document is mounted. Logs warnings (not errors) whenever more
 *  than one brandmark instance is observed painting at the same
 *  time.
 *
 *  The loop uses `requestAnimationFrame` driven by scroll events
 *  + a low-frequency periodic backstop, so it does not waste paints
 *  on idle pages. The warning message includes the offending
 *  selectors + their viewport rects so the regression can be
 *  pinpointed quickly from the console.
 *
 *  No-ops on first call in production (the guard module is
 *  imported only in dev — this defensive check is belt-and-braces).
 */
export function useBrandmarkSingletonCheck(rootRef?: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (typeof window === "undefined") return;

    let rafId = 0;
    let lastWarnAt = 0;
    const WARN_COOLDOWN_MS = 500;

    const check = () => {
      rafId = 0;
      const visible = enumerateVisibleBrandmarks();
      if (visible.length <= 1) return;

      // Per ADR-013 there are no painter crossfades. The journey's
      // mode is set ONCE at init; in particle mode the global canvas
      // is the only painter and all native dock SVGs + the actor are
      // hidden by a single CSS gate. In SVG mode there is no
      // particle canvas, the native dock SVGs paint at parked
      // positions only, and the actor paints transit + orbit.
      //
      // The combined-opacity tolerance is kept low because there is
      // no design-intended overlap window — anything above 1.1 is a
      // real leak worth warning about.
      const combinedOpacity = visible.reduce((s, v) => s + v.opacity, 0);
      const CROSSFADE_TOLERANCE = 1.1;
      if (combinedOpacity <= CROSSFADE_TOLERANCE) return;

      // Throttle warnings so a sustained leak doesn't spam.
      const now = performance.now();
      if (now - lastWarnAt < WARN_COOLDOWN_MS) return;
      lastWarnAt = now;
      const summary = visible
        .map((v) => `${v.selector} @ y=${Math.round(v.rect.y)} op=${v.opacity.toFixed(3)}`)
        .join(" | ");

      console.warn(
        `[brandmark-singleton] ${visible.length} brandmark instances visible (sum=${combinedOpacity.toFixed(3)}): ${summary}`
      );
    };

    const schedule = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(check);
    };

    // Run on scroll (the primary state-change driver) and on
    // a low-frequency interval as a backstop for non-scroll
    // state changes (admin overlay, resize, etc).
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const intervalId = window.setInterval(schedule, 1500);

    // Kick off one check immediately so the developer sees a
    // baseline reading on first paint.
    schedule();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.clearInterval(intervalId);
      if (rafId) cancelAnimationFrame(rafId);
    };
    // rootRef is accepted for future use (scoping queries inside
    // the v7 root); current implementation queries the whole
    // document because the fixed actor lives outside the root.
  }, [rootRef]);
}
