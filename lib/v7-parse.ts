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
function parseV7Html(htmlPath: string, tokensPath: string, options?: ParseOptions): V7Content {
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

  const scopedCss = scopeV7Css(tokensCss, inlineStyles);

  return { bodyHtml, bodyClass, scopedCss };
}

/**
 * Drop the now-empty `<div class="build-quote-runway">` wrapper that
 * remains after `#buildQuote` is removed. The wrapper only ever held
 * the single buildQuote `<section>` (production formerly portaled the
 * handoff mount into it); once the section is gone the wrapper carries
 * just whitespace and stale CSS hooks. The regex is intentionally
 * narrow — it tolerates leading/trailing whitespace inside the wrapper
 * but won't match a wrapper that still contains real content, so a
 * future markup change that puts siblings inside the runway leaves the
 * wrapper alone.
 */
function removeEmptyBuildQuoteRunway(bodyHtml: string): string {
  return bodyHtml.replace(/<div\s+class="build-quote-runway"\s*>\s*<\/div>\s*/g, "");
}

/**
 * Slice a station block out of its source position and re-insert it
 * immediately after the corridor mount placeholder. Uses the same
 * balanced-tag walker as `removeStationsFromBody` so nested sections
 * are preserved intact. If `dropTrailingConnectorSlot` is provided,
 * a `<div data-celestial-slot="...">` connector immediately following
 * the relocated section is removed too — it would otherwise be left
 * orphaned in the source position (bridging the wrong two sections)
 * AND duplicated at the new position (the section is reinserted alone,
 * so the connector doesn't travel with it).
 */
function relocateStationToMount(
  bodyHtml: string,
  stationId: string,
  mountId: string,
  options?: { dropTrailingConnectorSlot?: string }
): string {
  const openRe = new RegExp(`<section\\b[^>]*\\bid="${stationId}"[^>]*>`);
  const openMatch = openRe.exec(bodyHtml);
  if (!openMatch) return bodyHtml;

  const startIdx = openMatch.index;
  const tagRe = /<section\b|<\/section>/g;
  tagRe.lastIndex = startIdx;
  let depth = 0;
  let endIdx = -1;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(bodyHtml)) !== null) {
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
  if (endIdx <= startIdx) return bodyHtml;

  // Capture the section block on its own. Anything ahead of the section
  // (comments, whitespace) stays where it was — only the section travels.
  const sectionHtml = bodyHtml.slice(startIdx, endIdx);

  // Extend the slice to also consume a trailing connector slot, with
  // any whitespace + HTML comments between them collapsed too.
  let trailingEnd = endIdx;
  if (options?.dropTrailingConnectorSlot) {
    const slotId = options.dropTrailingConnectorSlot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const trailPattern = new RegExp(
      `^(?:\\s|<!--[\\s\\S]*?-->)*<div\\s+data-celestial-slot="${slotId}"\\s*>\\s*</div>\\s*`
    );
    const trailMatch = trailPattern.exec(bodyHtml.slice(endIdx));
    if (trailMatch) trailingEnd = endIdx + trailMatch[0].length;
  }

  const withoutSection = bodyHtml.slice(0, startIdx) + bodyHtml.slice(trailingEnd);

  // Insert the section right after the corridor mount placeholder.
  // Pattern intentionally omits `\b` after the id attribute: the next
  // character is a quote (non-word) followed by a space (also non-word),
  // and `\b` requires a word↔non-word transition, so a `\b` here never
  // matches. `[^>]*` accepts the placeholder's trailing
  // `data-home-corridor-mount` flag attribute on its own.
  const escapedMountId = mountId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const mountPattern = new RegExp(`<div\\s+id="${escapedMountId}"[^>]*></div>`);
  if (!mountPattern.test(withoutSection)) {
    // No placeholder to anchor against — leave the section where the
    // walker first found it (caller mis-configured the relocate, but
    // dropping the section entirely would be worse).
    return bodyHtml;
  }

  return withoutSection.replace(mountPattern, (match) => `${match}\n${sectionHtml}`);
}

/**
 * Walk the body, locate each requested station block by id, and slice
 * it out. Most v7 stations are `<section id="...">`; the legacy
 * approach/flywheel block is a `<div id="approach">`, so the removal
 * supports both tags while preserving same-tag nesting balance.
 * Inserts a single `<div id="${mountId}" data-home-corridor-mount></div>`
 * placeholder at the first removal site so DOM order matches scroll
 * order on the client.
 */
function removeStationsFromBody(bodyHtml: string, ids: readonly string[], mountId: string): string {
  const wantedIds = new Set(ids);
  type Range = { start: number; end: number };
  const ranges: Range[] = [];

  for (const tag of ["section", "div"] as const) {
    const openRe = new RegExp(`<${tag}\\b[^>]*\\bid="([^"]+)"[^>]*>`, "g");
    let openMatch: RegExpExecArray | null;
    while ((openMatch = openRe.exec(bodyHtml)) !== null) {
      const id = openMatch[1];
      if (!wantedIds.has(id)) continue;

      const startIdx = openMatch.index;
      const tagRe = new RegExp(`<${tag}\\b|<\\/${tag}>`, "g");
      tagRe.lastIndex = startIdx;
      let depth = 0;
      let endIdx = -1;
      let m: RegExpExecArray | null;
      while ((m = tagRe.exec(bodyHtml)) !== null) {
        if (m[0] === `</${tag}>`) {
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
        ranges.push({ start: startIdx, end: endIdx });
      }
    }
  }

  if (ranges.length === 0) return bodyHtml;

  ranges.sort((a, b) => a.start - b.start);
  const placeholder = `<div id="${mountId}" data-home-corridor-mount></div>`;

  // Build the result by walking the source forward, skipping the
  // ranges. Place the placeholder at the FIRST removed range so the
  // mount slot sits in the same DOM position the corridor's entry
  // anchor used to occupy.
  let out = "";
  let cursor = 0;
  for (let i = 0; i < ranges.length; i += 1) {
    const r = ranges[i];
    out += bodyHtml.slice(cursor, r.start);
    if (i === 0) out += placeholder;
    cursor = r.end;
  }
  out += bodyHtml.slice(cursor);
  return out;
}

/**
 * Strip `<a href="#X" data-station="..." ...>...</a>` entries from
 * `#hudNav` whose href hash matches one of the removed station ids.
 * Surrounding whitespace between entries is collapsed. Kept tolerant
 * of class attributes (e.g. `is-active`) and any extra attributes
 * the prototype might add.
 */
function removeHudNavEntries(bodyHtml: string, ids: readonly string[]): string {
  let out = bodyHtml;
  for (const id of ids) {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Allow attributes in any order; the prototype's nav entries
    // follow `<a href="#id" data-station="..."...>`. Whitespace before
    // the `<a>` is consumed so the stripped line collapses cleanly.
    const re = new RegExp(`\\s*<a\\b[^>]*\\bhref="#${escaped}"[^>]*>[\\s\\S]*?</a>`, "g");
    out = out.replace(re, "");
  }
  return out;
}

export interface RelocateStationSpec {
  /** Station id (the `<section id="X">` to slice out) that should move
   *  to right after the corridor mount placeholder. */
  stationId: string;
  /** Optional `data-celestial-slot` value of a connector div that
   *  immediately follows the section in source order. When set, the
   *  connector is dropped during the relocate so it isn't orphaned
   *  bridging the wrong two sections AND duplicated at the new
   *  position. */
  dropTrailingConnectorSlot?: string;
}

export interface ParseOptions {
  /** Station ids to strip from `<main class="stations">`. The first
   *  removed section is replaced with a `<div id="${corridorMountId}"
   *  data-home-corridor-mount>` placeholder. The matching `#hudNav`
   *  anchors are also stripped, and any leftover `href="#${id}"` cross
   *  links are redirected to the corridor mount. */
  removeStations?: readonly string[];
  /** Stations that should be sliced out of their source position and
   *  re-inserted immediately after the corridor mount placeholder.
   *  Powers the production corridor-exit reorder (ADR-021). Runs AFTER
   *  `removeStations` so the relocated section can't collide with a
   *  station scheduled for removal. */
  relocateStationsToMount?: readonly RelocateStationSpec[];
  /** Id used for the mount placeholder div + the redirected cross-
   *  links. Defaults to `"home-corridor-mount"`. */
  corridorMountId?: string;
}

export function getV7Content(options?: ParseOptions): V7Content {
  const htmlPath = join(process.cwd(), "public/prototypes/v7/landing-v7-motion.html");
  const tokensPath = join(process.cwd(), "public/prototypes/v7/tokens.css");
  return parseV7Html(htmlPath, tokensPath, options);
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

// ────────────────────────────────────────────────────────────────
// Structured text extraction for the home-v2 depth corridor (ADR-018)
// ────────────────────────────────────────────────────────────────

export interface V7CorridorText {
  thoughtform: {
    /** "THOUGHTFORM /θɔːtfɔːrm · THAWT-form/" */
    bridge: string;
    /** Title with inline `<em>` markers preserved. */
    titleHtml: string;
    /** First lede paragraph. */
    body1Html: string;
    /** Second lede paragraph. */
    body2Html: string;
    /** CTA label, e.g. "See the thesis". */
    cta: string;
    /** "North star" caption title. */
    northStarTitle: string;
    /** "the interface, not the algorithm" caption desc. */
    northStarDesc: string;
    /** NAVIGATE / ENCODE / BUILD ring node labels. */
    phaseLabels: { navigate: string; encode: string; build: string };
  };
  diagnostic: {
    /** Title with `<em>` preserved. */
    titleHtml: string;
    /** "Same pattern, four ways." */
    bridge: string;
    /** 4 orbit labels (numeric prefix + tag). */
    labels: { id: "01" | "02" | "03" | "04"; n: string; tag: string }[];
  };
  intelligence: {
    /** Title with `<em>` preserved. */
    titleHtml: string;
    /** Lede paragraph with `<em>` preserved. */
    ledeHtml: string;
    /** Left side body label. */
    leftLabel: string;
    /** Right side body label. */
    rightLabel: string;
  };
}

/** Strip all HTML tags + collapse whitespace. */
function stripTags(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Capture the inner HTML of the first element matching a tag with
 *  the given class on it. Class match is "contains the className as a
 *  whole-word token". */
function innerHtmlForClass(
  html: string,
  tag: string,
  className: string,
  occurrence = 0
): string | null {
  const re = new RegExp(
    `<${tag}\\b[^>]*\\bclass="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)</${tag}>`,
    "gi"
  );
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(html)) !== null) {
    if (i === occurrence) return m[1];
    i += 1;
  }
  return null;
}

/** Inner HTML by element id. */
function innerHtmlForId(html: string, tag: string, id: string): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*\\bid="${id}"[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = re.exec(html);
  return m ? m[1] : null;
}

/** Capture each `class="miss__label--N"` block + its tag text. */
function extractMissLabels(html: string) {
  const out: { id: "01" | "02" | "03" | "04"; n: string; tag: string }[] = [];
  for (const id of ["01", "02", "03", "04"] as const) {
    const re = new RegExp(
      `<a\\b[^>]*\\bclass="[^"]*\\bmiss__label--${id}\\b[^"]*"[^>]*>([\\s\\S]*?)</a>`,
      "i"
    );
    const m = re.exec(html);
    if (!m) continue;
    const inner = m[1];
    const nMatch =
      /<span\b[^>]*\bclass="[^"]*\bmiss__label-n\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(inner);
    const tagMatch =
      /<span\b[^>]*\bclass="[^"]*\bmiss__label-tag\b[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(inner);
    out.push({
      id,
      n: nMatch ? stripTags(nMatch[1]) : id,
      tag: tagMatch ? stripTags(tagMatch[1]) : "",
    });
  }
  return out;
}

/**
 * extractV7Text — pull the corridor's text content out of the v7
 * prototype HTML so the home-v2 corridor can render it inside the
 * `CopyAnchors` overlay (ADR-018, world-owned model).
 *
 * Mirrors `sliceV7Sections`'s parse pipeline so we operate on the
 * cleaned bodyHtml. Falls back to sensible defaults (the canonical
 * copy hardcoded against the May 2026 prototype snapshot) if a
 * specific field can't be found — keeps the corridor renderable
 * even if the source markup drifts.
 */
export function extractV7Text(): V7CorridorText {
  const htmlPath = join(process.cwd(), "public/prototypes/v7/landing-v7-motion.html");
  const tokensPath = join(process.cwd(), "public/prototypes/v7/tokens.css");
  let bodyHtml = "";
  try {
    bodyHtml = parseV7Html(htmlPath, tokensPath).bodyHtml;
  } catch {
    bodyHtml = "";
  }

  // Slice out the relevant station blocks for narrower regex scope.
  const tfMatch = /<section\b[^>]*\bid="definition"[^>]*>([\s\S]*?)<\/section>/i.exec(bodyHtml);
  const dgMatch = /<section\b[^>]*\bid="missing-layer"[^>]*>([\s\S]*?)<\/section>/i.exec(bodyHtml);
  const ilMatch = /<section\b[^>]*\bid="intelligence-layer"[^>]*>([\s\S]*?)<\/section>/i.exec(
    bodyHtml
  );
  const tfHtml = tfMatch ? tfMatch[1] : "";
  const dgHtml = dgMatch ? dgMatch[1] : "";
  const ilHtml = ilMatch ? ilMatch[1] : "";

  // ── Thoughtform (definition) ───────────────────────────────────
  const tfBridge =
    innerHtmlForClass(tfHtml, "div", "tri__ipa") ?? "THOUGHTFORM /θɔːtfɔːrm · THAWT-form/";
  const tfTitle =
    innerHtmlForClass(tfHtml, "h2", "tri__title") ??
    "AI collapsed the distance between <em>thought</em> and <em>form</em>.";
  const tfBody1 =
    innerHtmlForClass(tfHtml, "p", "tri__title--secondary", 0) ??
    "What it can’t see is the <em>judgment</em> that makes your work good.";
  const tfBody2 =
    innerHtmlForClass(tfHtml, "p", "tri__title--secondary", 1) ??
    "We navigate with your team, encode how they work, and build what they own.";
  const tfCtaMatch = /<a\b[^>]*\bclass="[^"]*\bbtn--solid\b[^"]*"[^>]*>([\s\S]*?)<\/a>/i.exec(
    tfHtml
  );
  const tfCta = tfCtaMatch ? stripTags(tfCtaMatch[1]) : "See the thesis";

  // North star caption.
  const tfNorthMatch = /<div\b[^>]*\bclass="[^"]*\bsigil__cap\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(
    tfHtml
  );
  let tfNorthTitle = "North star";
  let tfNorthDesc = "the interface, not the algorithm";
  if (tfNorthMatch) {
    const inner = tfNorthMatch[1];
    const k = /<span\b[^>]*\bclass="k"[^>]*>([\s\S]*?)<\/span>/i.exec(inner);
    const v = /<span\b[^>]*\bclass="v"[^>]*>([\s\S]*?)<\/span>/i.exec(inner);
    if (k) tfNorthTitle = stripTags(k[1]);
    if (v) tfNorthDesc = stripTags(v[1]);
  }

  // ── Diagnostic (missing-layer) ─────────────────────────────────
  const dgTitle =
    innerHtmlForClass(dgHtml, "h2", "miss__title") ??
    "The missing layer is rarely <em>the model.</em>";
  const dgBridge = stripTags(
    innerHtmlForClass(dgHtml, "p", "miss__bridge") ?? "Same pattern, four ways."
  );
  const dgLabels = extractMissLabels(dgHtml);
  const fallbackLabels: V7CorridorText["diagnostic"]["labels"] = [
    { id: "01", n: "01", tag: "Brand voice drifts across every channel." },
    { id: "02", n: "02", tag: "Creative briefs arrive without the thinking." },
    { id: "03", n: "03", tag: "Every product concept looks feasible." },
    { id: "04", n: "04", tag: "Customer service depends on who picks up." },
  ];
  const diagnosticLabels = dgLabels.length === 4 ? dgLabels : fallbackLabels;

  // ── Intelligence layer ─────────────────────────────────────────
  const ilTitle =
    innerHtmlForClass(ilHtml, "h2", "ilayer__title") ??
    "The fix is an<br><em>intelligence layer.</em>";
  const ilLede =
    innerHtmlForClass(ilHtml, "p", "ilayer__lede") ??
    "The intelligence layer sits in the middle. When sources and surfaces dock around it, the full <em>stack</em> lives.";
  const ilLeft = stripTags(
    innerHtmlForId(ilHtml, "h3", "ilayer-chamber-sources") ?? "Trusted sources"
  );
  const ilRight = stripTags(
    innerHtmlForId(ilHtml, "h3", "ilayer-chamber-surfaces") ?? "Headless surfaces"
  );

  return {
    thoughtform: {
      bridge: stripTags(tfBridge),
      titleHtml: tfTitle.trim(),
      body1Html: tfBody1.trim(),
      body2Html: tfBody2.trim(),
      cta: tfCta,
      northStarTitle: tfNorthTitle,
      northStarDesc: tfNorthDesc,
      phaseLabels: { navigate: "Navigate", encode: "Encode", build: "Build" },
    },
    diagnostic: {
      titleHtml: dgTitle.trim(),
      bridge: dgBridge,
      labels: diagnosticLabels,
    },
    intelligence: {
      titleHtml: ilTitle.trim(),
      ledeHtml: ilLede.trim(),
      leftLabel: ilLeft,
      rightLabel: ilRight,
    },
  };
}
