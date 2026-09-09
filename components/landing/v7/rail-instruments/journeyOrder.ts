/**
 * A variant route's journey roster, clocked on its OWN page order
 * (ADR-093).
 *
 * The landing's roster in `clusters.ts` is resolved against two production
 * tables at module evaluation — `MANIFEST_ENTRIES` for the beat-clocked
 * marks, `READOUT_SECTIONS` for the row-clocked ones. A homepage VARIANT
 * shows the same sections in a different order, and that is exactly what
 * those tables cannot express.
 *
 * ⚠ REORDERING THE PRODUCTION MARKS DOES NOT WORK, and the failure is
 * silent. `markState` decides `passed` / `here` / `ahead` by comparing
 * indices (`markState.ts`), so a mark carries its production POSITION with
 * it: on `/trinny-london`, where About is second, `row("about")` still
 * holds readout index 3 — behind Services at 2 — so About would read
 * `ahead` while the reader is at Services, and Thesis (manifest index 1)
 * would read `passed` while the reader is still in the bio. Every mark
 * renders, nothing throws, and the frame quietly lies about where you are.
 *
 * So a variant gets its own clock: ONE ordered list of section ids, and
 * every mark row-clocked against a position in THAT list. It is the arcs'
 * solution (`components/arcs/arcMarks.ts`, which builds a roster from the
 * page's own menu) applied to a route that still rides the landing's
 * attribute bus.
 *
 * ⚠ PURE AND REACT-FREE, like `clusters.ts` and `markState.ts` beside it,
 * so a roster can be walked by a test with no DOM. It reads the two
 * production tables only to RESOLVE NAMES and to translate the live
 * `activeIdx` — never to seat a mark.
 *
 * ⚠ AND IT RESOLVES LOUDLY. `buildJourneyRoster` throws on an id that is
 * not in the order, on the same argument `clusters.ts` makes for its own
 * `beatIdx`/`rowIdx`: a silently missing mark is precisely the defect this
 * module exists to prevent, and a variant roster has no drift guard of its
 * own to catch it.
 */

import { MANIFEST_ENTRIES } from "@/lib/rail-manifest/entries";
import {
  ARC_SECTION_ID,
  PROOF_SECTION_ID,
  READOUT_SECTIONS,
} from "@/lib/rail-manifest/sectionLabel";

import type { JourneyMark } from "./markState";

/** One mark to build. `range` makes it stand for a span of the order. */
export interface MarkSpec {
  /** A section id in the roster's `order`, or (for a range) its own name. */
  id: string;
  /** Printed by the lab's explain mode. Derived from the production tables
   *  when omitted — every id on a variant is a production section. */
  name?: string;
  /** Inclusive `[firstId, lastId]` span in `order`. The Arc uses it: its
   *  four corridor beats are one mark, exactly as on the landing. */
  range?: readonly [string, string];
  /** A rule opens a new group before this mark. */
  ruleBefore?: boolean;
  /** `SECTION_GLYPHS` key when it is not the mark's own id — a variant that
   *  keeps a production station id for its clock but names the mark for
   *  what the reader sees there (ADR-094: `services` drawn as `proof`). */
  glyph?: string;
}

export interface JourneyRoster {
  /** Every section id the page shows, IN PAGE ORDER. The one clock. */
  order: readonly string[];
  /**
   * The station immediately BEFORE the corridor mount on this page.
   *
   * `resolveActiveIdx`'s seam-gap rule needs it: the mount is not a
   * `.station`, so `data-active-station` lags on whatever station precedes
   * it while the corridor holds the viewport. On `/` that is `hero`; on a
   * variant where About comes first it is `about`, and without this the
   * About mark stays gold through the whole corridor.
   */
  preMountStationId: string;
  /** The top-left row. */
  marks: readonly JourneyMark[];
  /** The bottom-right exit row. */
  exit: readonly JourneyMark[];
  /** The SECTOR readout's rows — `order` minus hero, corridor beats
   *  collapsed to one `arc`, matching what `READOUT_SECTIONS` does for
   *  production. This is the denominator the right rail prints. */
  sectorRows: readonly string[];
}

const manifestName = (id: string): string | null =>
  MANIFEST_ENTRIES.find((e) => e.id === id)?.name ?? null;
const readoutLabel = (id: string): string | null =>
  READOUT_SECTIONS.find((r) => r.id === id)?.label ?? null;

/** Is this id one of the corridor's beats? */
function isCorridorId(id: string): boolean {
  return MANIFEST_ENTRIES.some((e) => e.id === id && e.kind === "corridor");
}

/** Resolve a mark's printed name from the production tables. */
function resolveName(spec: MarkSpec): string {
  if (spec.name) return spec.name;
  const name = readoutLabel(spec.id) ?? manifestName(spec.id);
  if (!name) {
    throw new Error(
      `[journeyOrder] mark "${spec.id}" has no name in READOUT_SECTIONS or MANIFEST_ENTRIES — pass one explicitly`
    );
  }
  return name;
}

/**
 * Build a variant's roster.
 *
 * Every mark is `clock: "row"` and its indices are positions in `order`,
 * so the caller feeds `journeyPosition()` into `MarkRow`'s `seat`.
 */
export function buildJourneyRoster(
  order: readonly string[],
  preMountStationId: string,
  tl: readonly MarkSpec[],
  exit: readonly MarkSpec[]
): JourneyRoster {
  const at = (id: string, who: string): number => {
    const i = order.indexOf(id);
    if (i < 0) throw new Error(`[journeyOrder] ${who} names "${id}", which is not in the order`);
    return i;
  };
  if (order.indexOf(preMountStationId) < 0) {
    throw new Error(`[journeyOrder] preMountStationId "${preMountStationId}" is not in the order`);
  }

  const toMark = (spec: MarkSpec): JourneyMark => {
    const idx = spec.range ? at(spec.range[0], `${spec.id}.range[0]`) : at(spec.id, "mark");
    const mark: JourneyMark = {
      id: spec.id,
      name: resolveName(spec),
      clock: "row",
      idx,
    };
    if (spec.range) {
      const end = at(spec.range[1], `${spec.id}.range[1]`);
      if (end <= idx) {
        throw new Error(`[journeyOrder] ${spec.id} range ends at or before it starts`);
      }
      mark.idxEnd = end;
    }
    if (spec.ruleBefore) mark.ruleBefore = true;
    if (spec.glyph) mark.glyph = spec.glyph;
    return mark;
  };

  /* The SECTOR denominator, derived the way `READOUT_SECTIONS` derives its
     own: hero has no readout row, and the corridor's beats are ONE section
     on this surface. Deriving it (rather than authoring a second list) is
     what stops the row count and the marks disagreeing. */
  const sectorRows: string[] = [];
  let arcSeated = false;
  for (const id of order) {
    if (id === "hero") continue;
    if (isCorridorId(id)) {
      if (arcSeated) continue;
      arcSeated = true;
      sectorRows.push(ARC_SECTION_ID);
      continue;
    }
    sectorRows.push(id);
  }

  return {
    order,
    preMountStationId,
    marks: tl.map(toMark),
    exit: exit.map(toMark),
    sectorRows,
  };
}

/**
 * A station the ROSTER shows that the production MANIFEST does not know.
 *
 * ADR-094: a variant may add stations of its own (`#trinny`, `#proposition`
 * on the Trinny London page). `useLandingScroll` publishes their id on the
 * `data-active-station` bus like any other, but `resolveActiveIdx` can only
 * translate ids into `MANIFEST_ENTRIES` — an unknown id falls to index 0,
 * which is the hero, and the HOME mark would light over the proposal with
 * nothing throwing. So the roster answers such an id DIRECTLY: it is in the
 * page's own order, and the order is the clock (ADR-093).
 *
 * Returns the id when it is one of these, `null` otherwise — a production
 * station id (`services`, `about`…) goes through the manifest as before,
 * because that path carries the proof/services split and the corridor's
 * beat granularity, which a bare station id cannot.
 */
export function rosterDirectId(
  roster: JourneyRoster,
  stationId: string | null | undefined
): string | null {
  if (!stationId) return null;
  if (roster.order.indexOf(stationId) < 0) return null;
  const known = MANIFEST_ENTRIES.some((e) => e.kind === "station" && e.targetId === stationId);
  return known ? null : stationId;
}

/**
 * The live `MANIFEST_ENTRIES` index, translated into a position in this
 * roster's own order.
 *
 * Returns **-1** for a section the variant does not show (`voidwalker`,
 * `practice`), which lights nothing — the honest answer, and the same
 * shape as the landing's own known hole for `#practice`.
 *
 * `stationId` is the raw `data-active-station` value, consulted only for a
 * roster-only station (see `rosterDirectId`); every three-argument caller
 * is unchanged.
 */
export function journeyPosition(
  roster: JourneyRoster,
  activeIdx: number,
  proofOwnsServices = false,
  stationId?: string | null
): number {
  const direct = rosterDirectId(roster, stationId);
  if (direct) return roster.order.indexOf(direct);
  const entry = MANIFEST_ENTRIES[activeIdx];
  if (!entry) return -1;
  // ADR-056: the casefile holds the front of the `#services` runway, so one
  // manifest index covers two beats the reader experiences separately —
  // on a roster that SHOWS both. A roster with no `proof` row (ADR-094: the
  // stack is the whole station) keeps the reader on `services` rather than
  // lighting nothing while the offer's clock happens to read "held".
  const id = splitServices(roster, entry.id, proofOwnsServices);
  return roster.order.indexOf(id);
}

function splitServices(roster: JourneyRoster, id: string, proofOwnsServices: boolean): string {
  if (!proofOwnsServices || id !== "services") return id;
  return roster.order.indexOf(PROOF_SECTION_ID) >= 0 ? PROOF_SECTION_ID : id;
}

/** The right rail's SECTOR readout for this roster: 1-based seat and total. */
export function journeySector(
  roster: JourneyRoster,
  activeIdx: number,
  proofOwnsServices = false,
  stationId?: string | null
): { seat: number; total: number } {
  const total = roster.sectorRows.length;
  const direct = rosterDirectId(roster, stationId);
  if (direct) {
    const seat = roster.sectorRows.indexOf(direct);
    return { seat: seat >= 0 ? seat : 0, total };
  }
  const entry = MANIFEST_ENTRIES[activeIdx];
  if (!entry) return { seat: 0, total };
  const raw = splitServices(roster, entry.id, proofOwnsServices);
  const id = isCorridorId(raw) ? ARC_SECTION_ID : raw;
  const seat = roster.sectorRows.indexOf(id);
  // Hero and any unshown section fall back to seat 0 — the same fallback
  // `sectionReadout` makes, so the corner never prints an empty position.
  return { seat: seat >= 0 ? seat : 0, total };
}
