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
