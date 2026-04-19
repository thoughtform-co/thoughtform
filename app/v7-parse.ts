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

// Build the right-rail section markers HTML (8 stations).
function buildSectionMarkersHtml(): string {
  const markers = [
    { station: "hero", label: "01" },
    { station: "definition", label: "02" },
    { station: "continuum", label: "03" },
    { station: "practice", label: "04" },
    { station: "services", label: "05" },
    { station: "products", label: "06" },
    { station: "about", label: "07" },
    { station: "contact", label: "08" },
  ];
  let html = "";
  markers.forEach((m, i) => {
    const topPct = ((i / Math.max(1, markers.length - 1)) * 100).toFixed(4);
    const activeClass = m.station === "hero" ? " is-active" : "";
    html += `<div class="hud__marker${activeClass}" data-station="${m.station}" style="top:${topPct}%;transform:translateY(-50%)">`;
    html += `<span class="hud__marker__dot"></span>`;
    html += `<span class="hud__marker__label">${m.label}</span>`;
    html += `</div>`;
  });
  return html;
}

function injectStaticHudChildren(html: string): string {
  const ticksHtml = buildDepthTicksHtml();
  const markersHtml = buildSectionMarkersHtml();

  // Containers are empty in the source; inject their children before </div>
  return html
    .replace(/<div id="leftTicks"><\/div>/, `<div id="leftTicks">${ticksHtml}</div>`)
    .replace(/<div id="rightTicks"><\/div>/, `<div id="rightTicks">${ticksHtml}</div>`)
    .replace(/<div id="rightMarkers"><\/div>/, `<div id="rightMarkers">${markersHtml}</div>`);
}

export function getV7Content(): V7Content {
  const htmlPath = join(process.cwd(), "public/prototypes/v7/landing-v7-motion.html");
  const tokensPath = join(process.cwd(), "public/prototypes/v7/tokens.css");

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
  bodyHtml = bodyHtml.replace(/href="#manifesto"/g, 'href="#definition"');

  bodyHtml = injectStaticHudChildren(bodyHtml);

  const scopedCss = scopeV7Css(tokensCss, inlineStyles);

  return { bodyHtml, bodyClass, scopedCss };
}
