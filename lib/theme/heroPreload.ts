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
 * Dark plate — the AVIF source of the hero's `<picture>`. Since 2026-10-04 it is
 * the Thought + Form key visual (his Midjourney keeper, job 63c6e199; ADR-144):
 * 133 kB at native 2912×1632, with a 313 kB WebP as the fallback `<img src>`.
 * The gateway's dark plate it replaced was 346 kB.
 *
 * ⚠ PRELOADED WITH `type`, which is not decoration: a browser that cannot
 * decode AVIF skips a typed preload, then takes the `<picture>`'s WebP
 * fallback. Drop the `type` and those browsers download the AVIF they
 * cannot use AND the WebP they can — the hero would cost them both plates.
 */
export const HERO_PLATE_DARK = "/images/ThoughtForm_v1.avif";
export const HERO_PLATE_DARK_TYPE = "image/avif";

/** The `<picture>` fallback, for browsers without AVIF (Edge only got it in
 *  121, and this is the LCP element — a blank hero is not an option). */
export const HERO_PLATE_DARK_FALLBACK = "/images/ThoughtForm_v1.webp";

/** The dark plate's intrinsic size, for every `<img>` that names it. */
export const HERO_PLATE_DARK_SIZE = { width: 2912, height: 1632 } as const;

/**
 * The phone hero's PORTRAIT plate (ADR-145, 2026-10-04): MF-04 extended to 9:16
 * by an edit (the world ship's wave 06, `MF-arcfloor916__nano_02`), the head on
 * the floor and the sky above it empty for the copy, which the ≤640 rung seats at
 * the top. 85 kB AVIF at native 1536×2752, 180 kB WebP fallback.
 *
 * ⚠ ONE MEDIA STRING FEEDS THE `<source media>` IN EVERY HERO AND THE PRELOAD.
 * A phone that preloaded the landscape plate and then painted the portrait would
 * pay for two plates on the LCP path, and the two only agree if they read the
 * same query. Light takes its own portrait (`HERO_PLATE_LIGHT_PORTRAIT`) on
 * the same query.
 */
export const HERO_PHONE_MEDIA = "(max-width: 640px)";
export const HERO_PLATE_DARK_PORTRAIT = "/images/ThoughtForm_v1-portrait.avif";
export const HERO_PLATE_DARK_PORTRAIT_FALLBACK = "/images/ThoughtForm_v1-portrait.webp";
export const HERO_PLATE_DARK_PORTRAIT_SIZE = { width: 1536, height: 2752 } as const;

/**
 * Light plate — a CSS background on `.hero__bg` (theme.css BLOCK 5), not an
 * `<img>`. Since ADR-145 (owner, 2026-10-04: "A · obsidian ring") it is the
 * Thought + Form plate in light — MF-04 EDITED so the statue and its ring are
 * black obsidian on a pale ground (the world ship's wave 06), its paper graded
 * onto the light `--void` #ece3d6. WebP q85, 275 kB (the gateway it replaced
 * was 435 kB): AVIF bands parchment flats, so the two plates ship in
 * different formats on purpose (see `scripts/hero-plates/prepare.mjs`). The
 * dark and light heroes are one picture again, ADR-058 U2's premise restored.
 *
 * It needs no fallback for the same reason it is not AVIF — WebP has been
 * universal since Safari 14. So the light path is one file and one format,
 * and the format question only ever arises on the dark side.
 */
export const HERO_PLATE_LIGHT = "/images/ThoughtForm_v1-light.webp";
export const HERO_PLATE_LIGHT_TYPE = "image/webp";
/** The phone's light plate: the obsidian lower-third reframe, 108 kB. A CSS
 *  background like its landscape twin (landing.css's ≤640 rung). */
export const HERO_PLATE_LIGHT_PORTRAIT = "/images/ThoughtForm_v1-portrait-light.webp";

/**
 * The footer's dark plate (ADR-145, 2026-10-04): its OWN picture since the
 * owner asked for "another version" — MF-10 (Midjourney job c8f094c8), the
 * keeper whose left half is quietest under the footer's text band. 156 kB AVIF
 * at native 2912×1632 + a 300 kB WebP fallback, the hero plate's own recipe.
 *
 * ⚠ NOT PRELOADED AND NOT IN `HERO_ROUTES`. Until ADR-145 the footer painted
 * the hero's file, so in dark it was a cache hit; now it is a lazy fetch below
 * the fold, which is exactly where a footer's bytes belong — it must never
 * compete with the hero's LCP. Its LIGHT plate is its own obsidian twin
 * (MF-10 edited, 274 kB WebP), the light hero's recipe.
 */
export const FOOTER_PLATE_DARK = "/images/ThoughtForm_footer_v1.avif";
export const FOOTER_PLATE_DARK_FALLBACK = "/images/ThoughtForm_footer_v1.webp";
export const FOOTER_PLATE_DARK_SIZE = { width: 2912, height: 1632 } as const;
export const FOOTER_PLATE_LIGHT = "/images/ThoughtForm_footer_v1-light.webp";

/**
 * The routes that render the hero on THIS key visual. `/arcs/thoughtform/claude-workshop-corridor`
 * mounts the same `LandingPage` with the same plate, and
 * `/arcs/loop/portfolio` declares `hero.plate: "gateway"` (ADR-075) so it
 * paints the same two files; every other route would be preloading an
 * image it never shows.
 *
 * ⚠ AN ARC EARNS ITS ROW BY DECLARING THE PLATE, and the arc route drops
 * its own static `<link rel="preload">` in exchange — a static link
 * always pulls the dark plate, because the preload scanner runs before
 * the script that knows the theme. An arc keeping its own key visual has
 * one file for both themes and keeps the static link instead.
 */
/* ⚠ HAND-WRITTEN, NOT DERIVED. This is the set of routes whose hero has TWO
   files, one per theme — the only case a script-injected preload solves,
   because a static link always names the dark one. `/arcs/loop/portfolio` left it
   in ADR-078 U1 (a Loop key visual, one file) and came back in U2 (a film
   frame is evidence, not wallpaper — the plate is the house visual again).
   `/arcs/trinny-london/proposal` joined on ADR-093: it mounts the same `LandingPage` on the
   same plate. ⚠ It is LIGHT-LOCKED, so it can only ever preload the light
   file — but it still earns a row here rather than a static link, because
   the preload scanner runs before the bootstrap and a static link would
   name the DARK plate on the one route that never paints it.
   A route that changes its plate has to be moved here BY HAND; nothing
   derives this, so nothing else would say so. */
export const HERO_ROUTES = [
  "/",
  "/arcs/thoughtform/claude-workshop-corridor",
  "/arcs/trinny-london/proposal",
  "/arcs/loop/portfolio",
  "/arcs/suri/proposal",
  "/arcs/perfect-ted/proposal",
  "/arcs/hungry-minds/proposal",
  "/arcs/pandora/proposal",
  "/arcs/plopsa/workshop",
  "/arcs/suri/workshop",
  "/arcs/suri/lunch-and-learn",
  "/arcs/suri/configuration",
  "/arcs/thoughtform/workshop-v1",
  "/arcs/thoughtform/workshop-v2",
  "/arcs/thoughtform/workshop-v3",
  "/arcs/thoughtform/armada",
  "/arcs/thoughtform/ai-storytelling",
  "/arcs/thoughtform/ai-storytelling-class-1",
  "/arcs/ap-hogeschool/lecture",
] as const;

/**
 * The inline script. Reads the attribute the theme bootstrap just stamped
 * rather than re-deriving the mode — one theme decision per document.
 */
export const heroPreloadScript = (): string =>
  `(function(){try{` +
  `var p=location.pathname.replace(/\\/+$/,"")||"/";` +
  `if(${JSON.stringify(HERO_ROUTES)}.indexOf(p)<0)return;` +
  `var l=document.documentElement.getAttribute("data-theme")==="light";` +
  `var m=window.matchMedia&&matchMedia(${JSON.stringify(HERO_PHONE_MEDIA)}).matches;` +
  `var e=document.createElement("link");` +
  `e.rel="preload";e.as="image";e.fetchPriority="high";` +
  `e.href=l?(m?${JSON.stringify(HERO_PLATE_LIGHT_PORTRAIT)}:${JSON.stringify(HERO_PLATE_LIGHT)}):m?${JSON.stringify(HERO_PLATE_DARK_PORTRAIT)}:${JSON.stringify(HERO_PLATE_DARK)};` +
  `e.type=l?${JSON.stringify(HERO_PLATE_LIGHT_TYPE)}:${JSON.stringify(HERO_PLATE_DARK_TYPE)};` +
  `document.head.appendChild(e);` +
  `}catch(e){}})();`;
