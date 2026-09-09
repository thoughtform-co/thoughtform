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
 * The live `MANIFEST_ENTRIES` index, translated into a position in this
 * roster's own order.
 *
 * Returns **-1** for a section the variant does not show (`voidwalker`,
 * `practice`), which lights nothing — the honest answer, and the same
 * shape as the landing's own known hole for `#practice`.
 */
export function journeyPosition(
  roster: JourneyRoster,
  activeIdx: number,
  proofOwnsServices = false
): number {
  const entry = MANIFEST_ENTRIES[activeIdx];
  if (!entry) return -1;
  // ADR-056: the casefile holds the front of the `#services` runway, so one
  // manifest index covers two beats the reader experiences separately.
  const id = proofOwnsServices && entry.id === "services" ? PROOF_SECTION_ID : entry.id;
  return roster.order.indexOf(id);
}

/** The right rail's SECTOR readout for this roster: 1-based seat and total. */
export function journeySector(
  roster: JourneyRoster,
  activeIdx: number,
  proofOwnsServices = false
): { seat: number; total: number } {
  const entry = MANIFEST_ENTRIES[activeIdx];
  const total = roster.sectorRows.length;
  if (!entry) return { seat: 0, total };
  const raw = proofOwnsServices && entry.id === "services" ? PROOF_SECTION_ID : entry.id;
  const id = isCorridorId(raw) ? ARC_SECTION_ID : raw;
  const seat = roster.sectorRows.indexOf(id);
  // Hero and any unshown section fall back to seat 0 — the same fallback
  // `sectionReadout` makes, so the corner never prints an empty position.
  return { seat: seat >= 0 ? seat : 0, total };
}
