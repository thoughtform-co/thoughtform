import { describe, expect, it } from "vitest";

import {
  ALLOC_MICRO,
  ALLOC_ROWS,
  SUB_COLS,
  TEAM_COLS,
  projectField,
  type PlacedSkill,
  type Projection,
} from "@/components/landing/home-v2/services/casefile/skillsFieldLayout";
import { CASES } from "@/lib/cases/registry";

/**
 * The Intelligence Map's field layout (ADR-056 U17).
 *
 * The plate morphs 47 persistent tiles between three projections, so the
 * placement function is load-bearing in a way no eyeball can check: a tile
 * placed outside its projection's declared grid template does not throw,
 * it creates an IMPLICIT track and silently reshapes the whole lattice.
 * These are the guards for that.
 */

/** The live Skill portfolio — still shared by the map track. */
const mapTrack = CASES.flatMap((c) => c.casefile.tracks).find(
  (t) =>
    (t.visual.kind === "registry" || t.visual.kind === "intelligence-map") &&
    t.visual.skills?.length
);

const visual =
  mapTrack?.visual.kind === "registry" || mapTrack?.visual.kind === "intelligence-map"
    ? mapTrack.visual
    : null;
const skills = visual?.skills ?? [];
const placed: PlacedSkill[] = skills.map((skill, i) => ({ skill, ordinal: i + 1 }));

/**
 * ⚠ THE TIER/BAND HALF OF THE FIXTURE IS SYNTHESIZED (ADR-062).
 *
 * `intelligence` and `teamDraw` moved OFF the map visual when the map became
 * a city — it draws districts and mains, not reach/draw tiers. They survive
 * as optional `registry` fields for a second client's browser plate, which
 * no track carries today.
 *
 * So this fixture is now half live (the 47 Skills and their five groups,
 * read off the map track) and half local. The alternative was deleting the
 * only coverage `skillsFieldLayout` has, and the failure it guards is
 * silent: a tile placed outside its projection's declared grid template
 * does not throw, it creates an implicit track and reshapes the lattice.
 */
const TIERS = [
  { name: "Fast", reach: 90, draw: 1 },
  { name: "Everyday", reach: 90, draw: 19 },
  { name: "Deep", reach: 60, draw: 59 },
  { name: "Frontier", reach: 25, draw: 21 },
] as const;

const BANDS = ["light", "steady", "deep", "intensive"] as const;

const teamDraw = [...new Set(skills.map((s) => s.team))].map((team, i) => ({
  team,
  band: BANDS[i % BANDS.length],
  tier: TIERS[i % TIERS.length].name,
}));

const layoutFor = (projection: Projection) =>
  projectField({
    placed,
    groups: visual?.groups ?? [],
    teamDraw,
    tiers: TIERS.map((t) => ({ ...t })),
    projection,
  });

const PROJECTIONS: Projection[] = ["substrate", "team", "allocation"];

describe("skills field layout (ADR-056 U17)", () => {
  it("the Skill half of the fixture is still the live portfolio", () => {
    expect(visual, "no track with skills found").not.toBeNull();
    expect(placed.length).toBeGreaterThan(0);
    expect(visual?.groups.length).toBe(4 + 1);
    // The synthesized half, asserted so a future edit cannot quietly empty it.
    expect(TIERS.length).toBe(4);
    expect(teamDraw.length).toBeGreaterThan(0);
  });

  it("places every Skill exactly once in every projection", () => {
    for (const projection of PROJECTIONS) {
      const { tiles } = layoutFor(projection);
      expect(tiles.size, `${projection}: placed ${tiles.size} of ${placed.length}`).toBe(
        placed.length
      );
      // Every Skill by name, and no two in the same cell.
      const cells = new Set<string>();
      for (const p of placed) {
        const at = tiles.get(p.skill.name);
        expect(at, `${projection}: "${p.skill.name}" unplaced`).toBeDefined();
        const key = `${at!.row}:${at!.column}`;
        expect(cells.has(key), `${projection}: collision at ${key}`).toBe(false);
        cells.add(key);
      }
    }
  });

  it("keeps every placement inside its declared grid template", () => {
    // The whole point of the guard: an out-of-template placement creates an
    // implicit track rather than failing, and the lattice quietly deforms.
    const bounds: Record<Projection, { rows: number; cols: number }> = {
      // label column + SUB_COLS tiles + count column
      substrate: { rows: 5, cols: SUB_COLS + 2 },
      // label + TEAM_COLS + count + band
      team: { rows: 14, cols: TEAM_COLS + 3 },
      // head row + ALLOC_ROWS cell rows; 4 columns of ALLOC_MICRO + gutters
      allocation: { rows: ALLOC_ROWS + 1, cols: 4 * (ALLOC_MICRO + 1) },
    };

    for (const projection of PROJECTIONS) {
      const { tiles, chrome } = layoutFor(projection);
      const b = bounds[projection];
      for (const [name, at] of tiles) {
        expect(at.row, `${projection}: "${name}" row ${at.row}`).toBeGreaterThanOrEqual(1);
        expect(at.row, `${projection}: "${name}" row ${at.row} > ${b.rows}`).toBeLessThanOrEqual(
          b.rows
        );
        expect(at.column, `${projection}: "${name}" col ${at.column}`).toBeGreaterThanOrEqual(1);
        expect(
          at.column,
          `${projection}: "${name}" col ${at.column} > ${b.cols}`
        ).toBeLessThanOrEqual(b.cols);
      }
      for (const c of chrome) {
        expect(c.row, `${projection}: chrome "${c.key}" row`).toBeLessThanOrEqual(b.rows);
        expect(
          c.column + (c.span ?? 1) - 1,
          `${projection}: chrome "${c.key}" spans past the template`
        ).toBeLessThanOrEqual(b.cols);
      }
    }
  });

  it("substrate rows match the registry groups and their printed counts", () => {
    const { chrome } = layoutFor("substrate");
    const groups = visual?.groups ?? [];
    expect(chrome.length).toBe(groups.length);
    chrome.forEach((row, i) => {
      expect(row.label).toBe(groups[i].name);
      // The count a reader can check against the group's printed figure.
      if (groups[i].count) expect(String(row.count)).toBe(groups[i].count);
    });
  });

  it("team rows carry a band, and there are as many rows as teams", () => {
    const { chrome } = layoutFor("team");
    const teams = new Set(skills.map((s) => s.team));
    expect(chrome.length).toBe(teams.size);
    for (const row of chrome) {
      expect(row.band, `team row "${row.label}" has no band`).toBeDefined();
    }
  });

  it("allocation clusters by tier lean, heads span their columns, rows never exceed the template", () => {
    const { chrome, tiles } = layoutFor("allocation");
    const tiers = TIERS;
    expect(chrome.length, "one head per tier, always — even an empty one").toBe(tiers.length);

    for (const head of chrome) {
      expect(head.span).toBe(ALLOC_MICRO);
      expect(head.row).toBe(1);
    }

    // Every tile files under the tier its team leans on.
    const tierByTeam = new Map(teamDraw.map((t) => [t.team, t.tier]));
    const perTier = new Map<string, number>();
    for (const p of placed) {
      const at = tiles.get(p.skill.name)!;
      const tierIdx = Math.floor((at.column - 1) / (ALLOC_MICRO + 1));
      const tierName = tiers[tierIdx]?.name;
      expect(tierName, `"${p.skill.name}" landed outside any tier column`).toBeDefined();
      expect(tierName, `"${p.skill.name}" filed under the wrong tier`).toBe(
        tierByTeam.get(p.skill.team)
      );
      perTier.set(tierName!, (perTier.get(tierName!) ?? 0) + 1);
    }

    // Cluster masses sum to the portfolio, and no cluster needs more rows
    // than the template declares.
    const total = [...perTier.values()].reduce((a, b) => a + b, 0);
    expect(total).toBe(placed.length);
    for (const [name, n] of perTier) {
      const rows = Math.ceil(n / ALLOC_MICRO);
      expect(
        rows,
        `tier "${name}" needs ${rows} rows, template has ${ALLOC_ROWS}`
      ).toBeLessThanOrEqual(ALLOC_ROWS);
    }
  });

  it("nav rows cover every Skill exactly once, in every projection", () => {
    // The arrows walk this model; if it disagreed with the geometry, a
    // right-arrow would land somewhere other than the tile to the right.
    for (const projection of PROJECTIONS) {
      const { navRows, tiles } = layoutFor(projection);
      const seen = navRows.flat();
      expect(seen.length, `${projection}: nav covers ${seen.length} of ${placed.length}`).toBe(
        placed.length
      );
      expect(new Set(seen.map((p) => p.skill.name)).size).toBe(placed.length);

      // Each nav row is one visual row: same grid row, ascending columns.
      for (const row of navRows) {
        const cells = row.map((p) => tiles.get(p.skill.name)!);
        const gridRow = cells[0].row;
        for (const c of cells)
          expect(c.row, `${projection}: nav row spans grid rows`).toBe(gridRow);
        for (let i = 1; i < cells.length; i += 1) {
          expect(cells[i].column, `${projection}: nav row not left-to-right`).toBeGreaterThan(
            cells[i - 1].column
          );
        }
      }
    }
  });
});
