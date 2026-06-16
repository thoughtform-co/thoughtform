/**
 * String-level surgery on the v7 prototype's `<main class="stations">`
 * tree. Every helper here is pure (string in, string out) so the
 * pipeline can be unit-tested without touching the filesystem.
 *
 * The behaviour is byte-identical to the previous monolithic
 * `lib/v7-parse.ts` — the parser tests in `tests/lib/v7-parse.test.ts`
 * lock that contract.
 */

/**
 * Walk the body, locate each requested station block by id, and slice
 * it out. Most v7 stations are `<section id="...">`; the legacy
 * approach/flywheel block is a `<div id="approach">`, so the removal
 * supports both tags while preserving same-tag nesting balance.
 * Inserts a single `<div id="${mountId}" data-home-corridor-mount></div>`
 * placeholder at the first removal site so DOM order matches scroll
 * order on the client.
 */
export function removeStationsFromBody(
  bodyHtml: string,
  ids: readonly string[],
  mountId: string
): string {
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
export function removeHudNavEntries(bodyHtml: string, ids: readonly string[]): string {
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
export function removeEmptyBuildQuoteRunway(bodyHtml: string): string {
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
export function relocateStationToMount(
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
 * Walk the body, locate each requested `<section id="...">` block,
 * and capture its full HTML (including nested `<section>` chambers
 * via balanced-tag counting). Sections are returned in source order
 * regardless of the `sectionIds` argument order.
 *
 * Used by `sliceV7Sections` (lab/test routes) to take the HUD chrome
 * + a hand-picked subset of stations without paying for the full
 * v7 LandingPage scroll machinery.
 */
export function captureSections(
  stationsBody: string,
  sectionIds: readonly string[]
): { id: string; html: string; start: number }[] {
  const wantedIds = new Set(sectionIds);
  const captured: { id: string; html: string; start: number }[] = [];

  const sectionOpenRe = /<section\b[^>]*\bid="([^"]+)"[^>]*>/g;
  let openMatch: RegExpExecArray | null;
  while ((openMatch = sectionOpenRe.exec(stationsBody)) !== null) {
    const id = openMatch[1];
    if (!wantedIds.has(id)) continue;

    const startIdx = openMatch.index;
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
  return captured;
}
