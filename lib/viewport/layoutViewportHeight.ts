/**
 * The LAYOUT viewport's height, in CSS px — the number `100svh` resolves to on
 * iOS Safari, and the one every svh-authored runway on this site is measured
 * against (ADR-113).
 *
 * `window.innerHeight` is the DYNAMIC viewport there: it grows by the toolbar's
 * height (~99px on an iPhone 14) as the bar collapses and shrinks back as it
 * returns. A scroll clock that divides an svh-sized runway by `innerHeight`
 * therefore moves while the thumb is still — the ring rotates a fraction of a
 * beat, the proof pile's `--pc-depth` steps its scale and opacity, the corridor
 * camera drifts — which the owner read as "the section takes a bit to settle".
 * `document.documentElement.clientHeight` is the initial containing block,
 * i.e. the small viewport, and holds through the animation.
 *
 * Equal to `innerHeight` wherever no HORIZONTAL scrollbar is rendered (the ICB
 * excludes only that bar), so every desktop clock is byte-identical; this site
 * never renders one (`base.css`'s `overflow-x: hidden`, the ≤960 root clip).
 * jsdom reports `clientHeight` 0, so the fallback keeps every test that stubs
 * `innerHeight` where it was.
 *
 * Three-free and DOM-only on purpose: the writers that read it live on the
 * landing's DOM seam. Since ADR-123 the hero is `100svh` and `--hero-lift`
 * reads this too — no deliberate `innerHeight` reader remains on the landing
 * (`tests/lib/layout-viewport-height.test.ts` pins the adopters).
 */
export function layoutViewportHeight(): number {
  return document.documentElement.clientHeight || window.innerHeight || 1;
}
