import { readFileSync } from "fs";
import { join } from "path";

export interface V7Content {
  bodyHtml: string;
  bodyClass: string;
  scopedCss: string;
}

function scopeV7Css(tokensCss: string, inlineStyles: string): string {
  const bootstrap = `.v7-doc {
  position: relative;
  min-height: 100vh;
  --depth: 0;
  --hero-cover: 0;
}`;

  const fixedTokens = tokensCss.replace(/url\(['"]?fonts\//g, "url('/fonts/");

  return [bootstrap, fixedTokens, inlineStyles]
    .join("\n")
    .replace(/:root/g, ".v7-doc")
    .replace(/\[data-theme="light"\]/g, '.v7-doc[data-theme="light"]')
    .replace(/html,\s*body/g, ".v7-doc")
    .replace(/\bbody(?=(?:\.[A-Za-z-]+|\[[^\]]+\]|\s*\{))/g, ".v7-doc");
}

// Build the 21-position depth gauge ticks HTML for a single rail.
function buildDepthTicksHtml(): string {
  const TICK_COUNT = 20;
  const TICK_LABELS: Record<number, string> = {
    0: "0",
    5: "2",
    10: "5",
    15: "7",
    20: "10",
  };
  let html = "";
  for (let i = 0; i <= TICK_COUNT; i += 1) {
    const isMajor = i % 5 === 0;
    const topPct = ((i / TICK_COUNT) * 100).toFixed(4);
    const cls = "hud__rail__tick" + (isMajor ? " hud__rail__tick--major" : "");
    html += `<div class="${cls}" style="top:${topPct}%"></div>`;
    if (isMajor && TICK_LABELS[i] !== undefined) {
      html += `<div class="hud__rail__label" style="top:${topPct}%;transform:translateY(-50%)">${TICK_LABELS[i]}</div>`;
    }
  }
  return html;
}

function injectStaticHudChildren(html: string): string {
  const ticksHtml = buildDepthTicksHtml();

  return html
    .replace(/<div id="leftTicks"><\/div>/, `<div id="leftTicks">${ticksHtml}</div>`)
    .replace(/<div id="rightTicks"><\/div>/, `<div id="rightTicks">${ticksHtml}</div>`);
}

// Shared parse pipeline. Reads a V7-prototype-shaped HTML file plus the canonical
// tokens.css, extracts/cleans the body markup, scopes the styles for runtime use,
// and returns a V7Content the LandingPage component can render directly.
//
// Forked routes (e.g. the Claude-workshop page) reuse this by pointing at a
// different HTML file with the same structural contract (sections, brandmark
// anchors, data-celestial-slot markers, etc.).
function parseV7Html(htmlPath: string, tokensPath: string): V7Content {
  const html = readFileSync(htmlPath, "utf-8");
  const tokensCss = readFileSync(tokensPath, "utf-8");

  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  const inlineStyles = styleMatch?.[1] || "";

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
  const bodyClassMatch = html.match(/<body[^>]*class="([^"]*)"/);
  const bodyClass = bodyClassMatch?.[1] || "theme-instrument density-comfortable";
  let bodyHtml = bodyMatch?.[1] || "";

  bodyHtml = bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, "");
  bodyHtml = bodyHtml.replace(/src="assets\/logos\//g, 'src="/logos/');
  bodyHtml = bodyHtml.replace(
    /src="assets\/vince-portrait\.jpg"/g,
    'src="/images/vince-portrait.jpg"'
  );
  bodyHtml = bodyHtml.replace(/href="#manifesto"/g, 'href="#definition"');

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
  bodyHtml = bodyHtml.replace(
    /(<(?:div|span|section|article)\b[^>]*\bdata-brand-anchor="[^"]+"[^>]*>)\s*<img[^>]*\/?>\s*(<\/(?:div|span|section|article)>)/g,
    "$1$2"
  );

  bodyHtml = injectStaticHudChildren(bodyHtml);

  const scopedCss = scopeV7Css(tokensCss, inlineStyles);

  return { bodyHtml, bodyClass, scopedCss };
}

export function getV7Content(): V7Content {
  const htmlPath = join(process.cwd(), "public/prototypes/v7/landing-v7-motion.html");
  const tokensPath = join(process.cwd(), "public/prototypes/v7/tokens.css");
  return parseV7Html(htmlPath, tokensPath);
}

export function getClaudeWorkshopContent(): V7Content {
  const htmlPath = join(process.cwd(), "public/prototypes/v7/landing-claude-workshop.html");
  const tokensPath = join(process.cwd(), "public/prototypes/v7/tokens.css");
  return parseV7Html(htmlPath, tokensPath);
}

export interface V7Slice {
  /** Markup that lives BEFORE `<main class="stations">` — gateway,
   *  hud chrome, hud nav. Renderable as-is via `dangerouslySetInnerHTML`. */
  hudHtml: string;
  /** Per-section breakdown of the requested station sections, in the
   *  ORDER they appear in the source HTML (not the order requested).
   *  Each entry carries the section's id + its full `<section ...>`
   *  HTML block. Consumers can wrap each block in a sibling element
   *  for opacity / transform gating without breaking nested sections.
   */
  sections: { id: string; html: string }[];
  /** Concatenated convenience — `sections.map(s => s.html).join('\n')`.
   *  Useful when no per-section wrapping is needed. */
  sectionsHtml: string;
  /** Body class lifted from the prototype (theme + density flags). */
  bodyClass: string;
}

/**
 * sliceV7Sections — extract the HUD chrome plus a subset of station
 * sections from the v7 prototype HTML.
 *
 * Powers v2-style routes (e.g. `/test/home-v2`) that want to render
 * the production HUD + a handful of stations without paying for the
 * full v7 LandingPage scroll machinery. The slice runs through the
 * same parse pipeline as `getV7Content` (script-strip, asset paths
 * rewritten to public/, brandmark `<img>` placeholders removed, hud
 * depth ticks injected) so the markup is drop-in renderable.
 *
 * Walks the body twice:
 *   1. Splits at `<main class="stations">` to take everything before
 *      as hudHtml.
 *   2. For each requested station id, scans forward from the matching
 *      `<section ... id="...">` opener, counting balanced
 *      `<section>` / `</section>` pairs so nested sections (the
 *      intelligence-layer chambers) are preserved intact.
 *
 * Sections are concatenated in source order so DOM order matches the
 * prototype — important for any later mounting of v7 hooks that
 * walk by querySelectorAll.
 */
export function sliceV7Sections(sectionIds: readonly string[]): V7Slice {
  const htmlPath = join(process.cwd(), "public/prototypes/v7/landing-v7-motion.html");
  const tokensPath = join(process.cwd(), "public/prototypes/v7/tokens.css");
  const { bodyHtml, bodyClass } = parseV7Html(htmlPath, tokensPath);

  const stationsMarker = '<main class="stations">';
  const stationsStart = bodyHtml.indexOf(stationsMarker);
  if (stationsStart < 0) {
    return { hudHtml: bodyHtml, sections: [], sectionsHtml: "", bodyClass };
  }

  const hudHtml = bodyHtml.slice(0, stationsStart);
  const stationsBody = bodyHtml.slice(stationsStart + stationsMarker.length);

  // Walk the stations body, locating each requested section by id and
  // capturing its full `<section ... id="X"> ... </section>` block with
  // nested section balance. The capture order follows the source so
  // sections render in the same order as the prototype.
  const wantedIds = new Set(sectionIds);
  const captured: { start: number; id: string; html: string }[] = [];

  const sectionOpenRe = /<section\b[^>]*\bid="([^"]+)"[^>]*>/g;
  let openMatch: RegExpExecArray | null;
  while ((openMatch = sectionOpenRe.exec(stationsBody)) !== null) {
    const id = openMatch[1];
    if (!wantedIds.has(id)) continue;

    const startIdx = openMatch.index;
    // Walk forward counting balanced section tags so nested chambers
    // (intelligence-layer has 3 inner `<section>` blocks) don't
    // prematurely close the outer station.
    const tagRe = /<section\b|<\/section>/g;
    tagRe.lastIndex = startIdx;
    let depth = 0;
    let endIdx = -1;
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(stationsBody)) !== null) {
      if (m[0] === "</section>") {
        depth -= 1;
        if (depth === 0) {
          endIdx = m.index + m[0].length;
          break;
        }
      } else {
        depth += 1;
      }
    }
    if (endIdx > startIdx) {
      captured.push({ start: startIdx, id, html: stationsBody.slice(startIdx, endIdx) });
    }
  }

  captured.sort((a, b) => a.start - b.start);
  const sections = captured.map(({ id, html }) => ({ id, html }));
  const sectionsHtml = sections.map((s) => s.html).join("\n");

  return { hudHtml, sections, sectionsHtml, bodyClass };
}
