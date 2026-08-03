import type {
  CaseModelTier,
  CaseRegistryGroup,
  CaseSkillEntry,
  CaseTeamDraw,
} from "@/lib/cases/types";

/**
 * skillsFieldLayout — where every Skill sits, in every projection
 * (ADR-056 U17).
 *
 * The Intelligence Map is ONE PERSISTENT FIELD of 47 tiles that FLIP-morph
 * between three projections. For the morph to be a morph and not a swap,
 * the same 47 DOM nodes have to survive the switch — which means they
 * cannot be nested inside per-row containers that come and go. They are
 * flat children of one CSS supergrid, and this module is the pure function
 * that says which grid cell each one lands in.
 *
 * PURE INTEGER MATH, NO MEASUREMENT. Every placement below is derived from
 * the data and four constants. Nothing here reads the DOM, so the layout
 * costs nothing per frame on a surface that sits over live WebGL, and a
 * window resize reflows natively because the grid tracks are `1fr`.
 *
 * ⚠ THE CONSTANTS ARE SHARED WITH THE CSS. `SUB_COLS`, `TEAM_COLS` and
 * `ALLOC_MICRO` appear in `casefile.css` as the `repeat()` counts for each
 * projection's `grid-template-columns`. A placement outside the declared
 * template does not error — it creates an IMPLICIT track and silently
 * reshapes the grid, which is the failure mode `skills-field-layout.test.ts`
 * exists to catch. Change them in both places or not at all.
 *
 * The nav model comes out of the same function for the same reason: if the
 * arrow keys walked a different row model than the geometry, the two would
 * drift the first time either changed.
 */

/** Substrate projection: 5 shape rows, up to 14 Skills each (Pattern). */
export const SUB_COLS = 14;
/** Team projection: 14 team rows, up to 7 Skills each (Studio). */
export const TEAM_COLS = 7;
/** Allocation: each tier column is this many micro-columns wide. */
export const ALLOC_MICRO = 7;
/** Cell rows declared per tier column. Everyday (35) needs 5; the extra
 *  absorbs the 7→6 micro-column degrade without implicit tracks. */
export const ALLOC_ROWS = 6;

export type Projection = "substrate" | "team" | "allocation";

/** A Skill with its stable ordinal — identity, not position. */
export interface PlacedSkill {
  skill: CaseSkillEntry;
  /** Registry order, 1-based. Constant across projections, like an
   *  atomic number: the tile IS this number wherever it flies. */
  ordinal: number;
}

/** A tile's grid cell, 1-based as CSS wants it. */
export interface TilePlacement {
  row: number;
  column: number;
}

/** One chrome element's placement — row labels, counts, column heads. */
export interface ChromePlacement {
  key: string;
  label: string;
  /** The group's own count, where it prints one. */
  count?: number;
  row: number;
  column: number;
  /** Columns to span (tier heads span their micro-columns). */
  span?: number;
  /** Present on team rows only — drives the gradient mark. */
  band?: CaseTeamDraw["band"];
  /** Present on allocation heads only. */
  tier?: CaseModelTier;
}

export interface FieldLayout {
  /** Tile placement by skill name. */
  tiles: Map<string, TilePlacement>;
  /** Row labels / counts (substrate, team) or tier heads (allocation). */
  chrome: ChromePlacement[];
  /**
   * The keyboard neighbour model: the visual rows the arrows walk. Derived
   * from the SAME chunking as the geometry above, so a tile's left/right
   * neighbours are always the ones beside it on screen.
   */
  navRows: PlacedSkill[][];
}

/** Most-shipped-first: a row's solid head is what runs today. */
const STATUS_RANK: Record<string, number> = {
  Shipped: 0,
  "In use": 1,
  "In build": 2,
  Scoped: 3,
};

const byStatus = (a: PlacedSkill, b: PlacedSkill) =>
  (STATUS_RANK[a.skill.status] ?? 9) - (STATUS_RANK[b.skill.status] ?? 9);

/** Group into rows of `n`, preserving order. */
function chunk<T>(items: readonly T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += n) out.push(items.slice(i, i + n));
  return out;
}

export interface ProjectFieldArgs {
  placed: readonly PlacedSkill[];
  groups: readonly CaseRegistryGroup[];
  teamDraw?: readonly CaseTeamDraw[];
  tiers?: readonly CaseModelTier[];
  projection: Projection;
}

/**
 * The one entry point. Returns placements for all 47 tiles, the chrome
 * that labels them, and the nav rows the arrow keys walk.
 */
export function projectField({
  placed,
  groups,
  teamDraw,
  tiers,
  projection,
}: ProjectFieldArgs): FieldLayout {
  const tiles = new Map<string, TilePlacement>();
  const chrome: ChromePlacement[] = [];
  const navRows: PlacedSkill[][] = [];

  if (projection === "allocation" && tiers?.length) {
    /* FOUR TIER COLUMNS. A team's Skills fly to the tier that team leans
       on, so the clusters end up deliberately lopsided: the Skills mass
       sits on Everyday while the consumption mass sits on Deep and
       Frontier. That gap is the argument, made physical. */
    const tierByTeam = new Map((teamDraw ?? []).map((t) => [t.team, t.tier]));

    tiers.forEach((tier, tierIdx) => {
      const members = placed
        .filter((p) => tierByTeam.get(p.skill.team) === tier.name)
        .sort(byStatus);

      // The head spans its column's micro-columns, on the head row.
      chrome.push({
        key: `tier-${tier.name}`,
        label: tier.name,
        row: 1,
        column: tierIdx * (ALLOC_MICRO + 1) + 1,
        span: ALLOC_MICRO,
        tier,
      });

      const rows = chunk(members, ALLOC_MICRO);
      rows.forEach((row, rowIdx) => {
        row.forEach((p, cellIdx) => {
          tiles.set(p.skill.name, {
            // Row 1 is the head; cells start at row 2.
            row: rowIdx + 2,
            column: tierIdx * (ALLOC_MICRO + 1) + cellIdx + 1,
          });
        });
        navRows.push(row);
      });
    });

    return { tiles, chrome, navRows };
  }

  /* SUBSTRATE and TEAM are the same shape with a different grouping key:
     labelled rows, tiles left-packed, count at the right edge. */
  const isTeam = projection === "team";
  const bandByTeam = new Map((teamDraw ?? []).map((t) => [t.team, t.band]));

  const order = isTeam
    ? // FIRST APPEARANCE in the registry, so a copy edit cannot reshuffle
      // the lattice under a reader.
      [...new Set(placed.map((p) => p.skill.team))]
    : groups.map((g) => g.name);

  let row = 0;
  for (const name of order) {
    const members = placed
      .filter((p) => (isTeam ? p.skill.team : p.skill.engine) === name)
      .sort(byStatus);
    if (!members.length) continue;
    row += 1;

    chrome.push({
      key: name,
      label: name,
      count: members.length,
      row,
      column: 1,
      band: isTeam ? bandByTeam.get(name) : undefined,
    });

    members.forEach((p, cellIdx) => {
      // Column 1 is the label; tiles start at column 2.
      tiles.set(p.skill.name, { row, column: cellIdx + 2 });
    });
    navRows.push(members);
  }

  return { tiles, chrome, navRows };
}

/** Column index (1-based) where a projection's trailing count sits. */
export function countColumn(projection: Projection): number {
  return (projection === "team" ? TEAM_COLS : SUB_COLS) + 2;
}
