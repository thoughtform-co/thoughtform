import { readFileSync, statSync } from "fs";

import { injectStaticHudChildren } from "./hudTicks";
import { scopeV7Css } from "./scopeCss";
import {
  fillStationSlot,
  relocateStationToMount,
  removeEmptyBuildQuoteRunway,
  removeHudNavEntries,
  removeStationsFromBody,
} from "./stationOps";
import type { ParseOptions, V7Content } from "./types";

// Memo cache for the parse pipeline, keyed on (paths, options) and
// validated against file mtimes. The landing route runs this pipeline
// more than once per render (`getV7Content` + `extractV7Text`), and in
// dev every request re-renders the page — without the cache each of
// those re-reads a ~234 KB prototype file and re-runs the full regex
// surgery + CSS scoping. The mtime check keeps the dev loop honest:
// editing the prototype HTML or tokens.css still re-parses.
//
// V7Content is a bag of immutable strings that callers never mutate,
// so sharing one object between callers is safe.
const parseCache = new Map<
  string,
  { htmlMtimeMs: number; tokensMtimeMs: number; content: V7Content }
>();

/**
 * Shared parse pipeline. Reads a V7-prototype-shaped HTML file plus the
 * canonical tokens.css, extracts/cleans the body markup, scopes the
 * styles for runtime use, and returns a V7Content the LandingPage
 * component can render directly.
 *
 * Forked routes (e.g. the Claude-workshop page) reuse this by pointing
 * at a different HTML file with the same structural contract
 * (sections, brandmark anchors, data-celestial-slot markers, etc.).
 *
 * Results are memoized per (htmlPath, tokensPath, options) and
 * invalidated when either source file's mtime changes. Options come
 * from module-level const literals at every call site, so their JSON
 * serialization is a stable cache key.
 */
export function parseV7Html(
  htmlPath: string,
  tokensPath: string,
  options?: ParseOptions
): V7Content {
  const htmlMtimeMs = statSync(htmlPath).mtimeMs;
  const tokensMtimeMs = statSync(tokensPath).mtimeMs;
  const cacheKey = `${htmlPath}|${tokensPath}|${JSON.stringify(options ?? null)}`;
  const cached = parseCache.get(cacheKey);
  if (cached && cached.htmlMtimeMs === htmlMtimeMs && cached.tokensMtimeMs === tokensMtimeMs) {
    return cached.content;
  }
  const content = parseV7HtmlUncached(htmlPath, tokensPath, options);
  parseCache.set(cacheKey, { htmlMtimeMs, tokensMtimeMs, content });
  return content;
}

function parseV7HtmlUncached(
  htmlPath: string,
  tokensPath: string,
  options?: ParseOptions
): V7Content {
  const html = readFileSync(htmlPath, "utf-8");
  const tokensCss = readFileSync(tokensPath, "utf-8");

  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  const inlineStyles = styleMatch?.[1] || "";

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
  const bodyClassMatch = html.match(/<body[^>]*class="([^"]*)"/);
  const bodyClass = bodyClassMatch?.[1] || "theme-instrument density-comfortable";
  let bodyHtml = bodyMatch?.[1] || "";

  bodyHtml = sanitizeBodyMarkup(bodyHtml);
  bodyHtml = injectStaticHudChildren(bodyHtml);

  // Optional surgery: strip a set of `<section id="...">` station blocks
  // from `<main class="stations">` and inject a single mount placeholder
  // where the FIRST removed station used to be. Powers the production
  // home page swap where #definition + #missing-layer + #intelligence-
  // layer are replaced by the home-v2 depth corridor (ADR-018).
  if (options?.removeStations && options.removeStations.length) {
    const removeIds = options.removeStations;
    const mountId = options.corridorMountId ?? "home-corridor-mount";
    bodyHtml = removeStationsFromBody(bodyHtml, removeIds, mountId);

    // Strip the matching nav entries so the HUD nav doesn't show
    // dead links. Kept in lockstep with the section removal so the
    // numbering stays as authored (gaps appear at the removed
    // positions; the corridor itself gets no nav entry).
    bodyHtml = removeHudNavEntries(bodyHtml, removeIds);

    // Redirect any leftover cross-links pointing at removed sections
    // to the corridor mount, so e.g. the Hero CTA still has somewhere
    // sensible to scroll. Done here (per-route) rather than in the
    // shared cleanup above so other routes (`getClaudeWorkshopContent`)
    // keep their own anchor semantics intact.
    for (const id of removeIds) {
      const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      bodyHtml = bodyHtml.replace(new RegExp(`href="#${escaped}"`, "g"), `href="#${mountId}"`);
    }

    // After #buildQuote is stripped, its sole-purpose wrapper
    // `<div class="build-quote-runway">` is left holding only
    // whitespace. The wrapper had no semantics of its own (the
    // production handoff used to mount its `HandoffOrbitEmbed`
    // root into the inner section) — keeping it as an empty ghost
    // would leave an orphan container at the corridor seam.
    bodyHtml = removeEmptyBuildQuoteRunway(bodyHtml);
  }

  // Optional surgery: slice a station out of its source position and
  // re-insert it right after the corridor mount placeholder. Powers
  // the production corridor-exit reorder (ADR-021): #services moves
  // up to directly follow the corridor so the labs/billions epilogue
  // hands off into the practical "Three ways to bring the practice
  // in" copy via the new zoom-dissipate seam.
  if (options?.relocateStationsToMount && options.relocateStationsToMount.length) {
    const mountId = options.corridorMountId ?? "home-corridor-mount";
    for (const spec of options.relocateStationsToMount) {
      bodyHtml = relocateStationToMount(bodyHtml, spec.stationId, mountId, {
        dropTrailingConnectorSlot: spec.dropTrailingConnectorSlot,
      });
    }
  }

  // Optional surgery: fill empty authored shells with generated markup
  // (ADR-054). Runs AFTER the station surgery — so a filled slot can
  // never be sliced or relocated with stale content — and BEFORE the
  // comment strip below, which the generators are required not to need
  // (their output carries no HTML comments).
  if (options?.fillSlots && options.fillSlots.length) {
    for (const spec of options.fillSlots) {
      bodyHtml = fillStationSlot(bodyHtml, spec.slotAttribute, spec.html);
    }
  }

  // Ship-weight trim (2026-07-14 perf pass): the prototype's design
  // annotation comments (~26 kB raw in the source file) are inert in the
  // rendered tree but ship TWICE — once in the SSR HTML and once in the
  // RSC flight payload (~22 kB of the served document). Strip them at
  // the END of the pipeline: the station surgery above tolerates but
  // never requires them, and inline <script> blocks were already removed
  // by sanitizeBodyMarkup, so the pattern cannot eat script text.
  bodyHtml = bodyHtml.replace(/<!--[\s\S]*?-->/g, "");

  const scopedCss = scopeV7Css(tokensCss, inlineStyles);

  return { bodyHtml, bodyClass, scopedCss };
}

/**
 * Sanitize the prototype body markup before any optional station
 * surgery runs:
 *
 *   1. Strip `<script>` blocks so prototype-only JS never re-executes
 *      inside the React tree.
 *   2. Rewrite `assets/...` paths to live under `/public/...` so the
 *      Next.js static pipeline serves them.
 *   3. Redirect the prototype's legacy `#manifesto` anchor to the
 *      `#definition` station the v7 page actually uses.
 *   4. Strip the placeholder `<img>` from each brandmark anchor slot
 *      (the React tree replaces it with a single canonical
 *      `BrandmarkGlyph` portal).
 *
 * Pure: takes a body HTML string in, returns the cleaned string out.
 */
function sanitizeBodyMarkup(bodyHtml: string): string {
  let out = bodyHtml;
  out = out.replace(/<script[\s\S]*?<\/script>/gi, "");
  out = out.replace(/src="assets\/logos\//g, 'src="/logos/');
  out = out.replace(/src="assets\/vince-portrait\.jpg"/g, 'src="/images/vince-portrait.jpg"');
  out = out.replace(/href="#manifesto"/g, 'href="#definition"');

  // Strip the placeholder <img> from each brandmark anchor slot.
  //
  // The prototype HTML keeps an <img src="...Thoughtform_Brandmark.svg">
  // inside each dock site so designers can view the static prototype
  // standalone. At runtime on the React-rendered landing page we
  // replace that raster placeholder with a single canonical
  // `BrandmarkGlyph` portal'd into the slot by `BrandmarkSystem`, so
  // every dock paints from the same pure-code SVG source instead of
  // a parallel raster fetched per slot. The empty slot keeps its
  // layout box (size + position) intact for the choreography to read
  // anchor rects.
  //
  // Matches any element carrying `data-brand-anchor="..."` with a
  // single `<img>` direct child surrounded by whitespace, and drops
  // the `<img>`. The closing-tag pattern is restricted to common
  // wrappers (div / span / section / article) to avoid the regex
  // overshooting on accidental nested structures.
  out = out.replace(
    /(<(?:div|span|section|article)\b[^>]*\bdata-brand-anchor="[^"]+"[^>]*>)\s*<img[^>]*\/?>\s*(<\/(?:div|span|section|article)>)/g,
    "$1$2"
  );

  return out;
}
