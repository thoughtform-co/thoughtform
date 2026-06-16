/**
 * Shared types for the v7-parse pipeline. Kept dependency-free so
 * any sub-module (parseBody, stationOps, extractText, scopeCss) can
 * import these without pulling in the full pipeline.
 */

export interface V7Content {
  bodyHtml: string;
  bodyClass: string;
  scopedCss: string;
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
