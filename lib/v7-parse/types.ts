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

export interface FillSlotSpec {
  /** Bare data attribute marking the empty shell div to fill, e.g.
   *  `"data-proof-body"`. Matched without a value. */
  slotAttribute: string;
  /** Generated inner HTML. Callers own escaping — see
   *  `lib/v7-parse/proofStation.ts` for the reference builder. */
  html: string;
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
  /** Empty authored shells to fill with generated markup (ADR-054).
   *  Powers `#proof`, whose station body is generated from `lib/cases`
   *  at parse time rather than authored in the prototype. A spec whose
   *  shell is absent is a no-op, so routes that don't carry the shell
   *  (the workshop prototype) stay byte-identical. Runs AFTER the
   *  station surgery and BEFORE the comment strip. */
  fillSlots?: readonly FillSlotSpec[];
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
  /** A route's own corridor copy (ADR-143 U3), resolved by
   *  `lib/home-v2/corridorCopy.ts`. Absent on every route but the
   *  workshop's third cut, and absent means today's copy verbatim: the
   *  homepage passes nothing and renders byte-identical. A static prop
   *  read once at mount; nothing subscribes to it. */
  copy?: CorridorCopyOverride;
}

/** The corridor stations whose caption a route may replace. */
export type CorridorCopyStationId = "navigate" | "diagnostic" | "intelligence";

/** The epilogue's signal line: title, its phone aria label, the button,
 *  and whether the headline ticker runs under it. */
export interface CorridorSignalCopy {
  /** Desktop title, one `<br>` between its two lines, `<em>` on the close. */
  titleHtml: string;
  /** The phone block's region label, the title said as a sentence. */
  ariaLabel: string;
  /** The button's label, upper case as printed. */
  cta: string;
  /** Whether the headline ticker arcs over the planet under the title. */
  ticker: boolean;
}

/** The thesis's three phase glyphs, by the label they carry. */
export type CorridorPhaseId = "navigate" | "encode" | "build";

/** The Build station's right-hand column (ADR-143 U6): its head and one
 *  label per surface tip, in order. The item ids, and so the world anchors
 *  the labels are projected on, are the scene's own and never move. */
export interface CorridorStackCopy {
  /** The column head's name, e.g. "Intelligence". */
  surfacesTitle: string;
  /** The column head's sub-line, e.g. "what you rent". */
  surfacesSub: string;
  /** One label per surface tip, top to bottom. */
  surfaceLabels: readonly string[];
  /** The index of the chip given the gold lift, or null for none. */
  surfaceLit: number | null;
}

/** What a route may override. Each station's caption replaces both its
 *  `supportHtml` and its `floorHtml`; titles and telemetry stay the map's.
 *  `phaseSubs` replaces the thesis glyphs' second words (See / Crystallize /
 *  Ship); `stack` replaces the Build station's right-hand column whole. */
export interface CorridorCopyOverride {
  stations?: Partial<Record<CorridorCopyStationId, string>>;
  signal?: Partial<CorridorSignalCopy>;
  phaseSubs?: Partial<Record<CorridorPhaseId, string>>;
  stack?: CorridorStackCopy;
}
