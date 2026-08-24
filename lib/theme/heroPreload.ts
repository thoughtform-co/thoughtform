/**
 * The hero key visual's preload, chosen by theme at document time.
 *
 * The landing hero is the LCP element and has always carried a page-level
 * `<link rel="preload" as="image">` so the fetch starts with the document
 * rather than after the `dangerouslySetInnerHTML` commit. Since ADR-058
 * Update 2 there are TWO plates — a dark AVIF and a light WebP — and only
 * one of them is wanted per visit.
 *
 * ⚠ THIS CANNOT BE A STATIC `<link>`. The preload scanner fetches a static
 * link before any script runs, so a server-rendered link would always pull
 * the dark plate: a light visitor would pay for both. The theme is only
 * known client-side (the pre-paint bootstrap reads `?theme=` then
 * `localStorage`), so the preload has to be injected by a script in the
 * same head, immediately after that bootstrap has stamped the attribute.
 *
 * ⚠ IT MUST NOT BE GATED ON `THEME_TOGGLE`. Flipping that flag off is
 * ADR-058's rollback — it stops the bootstrap rendering, leaving no
 * `data-theme` attribute and therefore the dark plate, which is exactly
 * what an un-themed site wants. If this script were inside the gate, the
 * rollback would silently drop the hero preload too and cost LCP on the
 * default path.
 *
 * What is knowingly given up, versus the static link it replaces:
 *   · No-JS clients and non-executing crawlers get no preload. The hero
 *     `<img>` still loads at first layout; it is `alt=""` decoration.
 *   · Client-side navigations to `/` no longer get a nav-time preload from
 *     the hoisted link. The fetch starts at commit instead, and the toggle
 *     path is covered by the glitch controller's idle prefetch of both
 *     plates.
 */

/**
 * Dark plate — the AVIF source of the hero's `<picture>`. 346 kB, down from
 * the 835 kB WebP that is still there as the fallback `<img src>`.
 *
 * ⚠ PRELOADED WITH `type`, which is not decoration: a browser that cannot
 * decode AVIF skips a typed preload, then takes the `<picture>`'s WebP
 * fallback. Drop the `type` and those browsers download the AVIF they
 * cannot use AND the WebP they can — the hero would cost them both plates.
 */
export const HERO_PLATE_DARK = "/images/Gateway_v1b.avif";
export const HERO_PLATE_DARK_TYPE = "image/avif";

/** The `<picture>` fallback, for browsers without AVIF (Edge only got it in
 *  121, and this is the LCP element — a blank hero is not an option). */
export const HERO_PLATE_DARK_FALLBACK = "/images/Gateway_v1b.webp";

/**
 * Light plate — a CSS background on `.hero__bg` (theme.css BLOCK 5), not an
 * `<img>`. WebP q85, 435 kB: AVIF bands this artwork's parchment flats, so
 * the two plates ship in different formats on purpose (see
 * `scripts/hero-plates/prepare.mjs`).
 *
 * It needs no fallback for the same reason it is not AVIF — WebP has been
 * universal since Safari 14. So the light path is one file and one format,
 * and the format question only ever arises on the dark side.
 */
export const HERO_PLATE_LIGHT = "/images/Gateway_v2-light.webp";
export const HERO_PLATE_LIGHT_TYPE = "image/webp";

/**
 * The routes that render the hero on THIS key visual. `/claude-workshop`
 * mounts the same `LandingPage` with the same plate, and
 * `/arcs/portfolio` declares `hero.plate: "gateway"` (ADR-075) so it
 * paints the same two files; every other route would be preloading an
 * image it never shows.
 *
 * ⚠ AN ARC EARNS ITS ROW BY DECLARING THE PLATE, and the arc route drops
 * its own static `<link rel="preload">` in exchange — a static link
 * always pulls the dark plate, because the preload scanner runs before
 * the script that knows the theme. An arc keeping its own key visual has
 * one file for both themes and keeps the static link instead.
 */
/* ⚠ `/arcs/portfolio` LEFT THIS LIST (ADR-078 U1): its hero carries a Loop
   key visual now rather than the Gateway plate, so it has one file for both
   themes and takes the static link back. A row here for an own-plate route
   would script-inject a preload for a plate that page never paints — and
   this list is hand-written, not derived, so nothing else would say so. */
export const HERO_ROUTES = ["/", "/claude-workshop"] as const;

/**
 * The inline script. Reads the attribute the theme bootstrap just stamped
 * rather than re-deriving the mode — one theme decision per document.
 */
export const heroPreloadScript = (): string =>
  `(function(){try{` +
  `var p=location.pathname.replace(/\\/+$/,"")||"/";` +
  `if(${JSON.stringify(HERO_ROUTES)}.indexOf(p)<0)return;` +
  `var l=document.documentElement.getAttribute("data-theme")==="light";` +
  `var e=document.createElement("link");` +
  `e.rel="preload";e.as="image";e.fetchPriority="high";` +
  `e.href=l?${JSON.stringify(HERO_PLATE_LIGHT)}:${JSON.stringify(HERO_PLATE_DARK)};` +
  `e.type=l?${JSON.stringify(HERO_PLATE_LIGHT_TYPE)}:${JSON.stringify(HERO_PLATE_DARK_TYPE)};` +
  `document.head.appendChild(e);` +
  `}catch(e){}})();`;
