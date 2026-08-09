/**
 * ThemeGlyph — the light/dark toggle's mark (ADR-058).
 *
 * A sun and a crescent moon, rasterised onto the 18px canvas.
 *
 * ⚠ DELIBERATE DEPARTURE from the particle-icon grammar
 * (`thoughtform-design/references/particle-icon-grammar.md`), owner
 * 2026-08-09. That grammar bans curved constructions, caps an icon at 16
 * skeleton+signal pixels, and asks every icon to carry a drift pixel. The
 * previous glyph obeyed all three, and its two states — a sparse dot ring
 * against a denser dot ring — were not tellable apart at 18px, which is
 * the only job this control has. So the silhouettes are now the
 * conventional ones every visitor already knows from everywhere else.
 *
 * What still holds, so this is not a free-for-all:
 *   - SQUARES ONLY. No `<circle>`, no arc, no border-radius — both discs
 *     are rasterised into grid cells, so the shape law survives as
 *     geometry even though the silhouette reads round.
 *   - The rects paint `currentColor`, which is what lets the button's own
 *     CSS keep owning hover / focus / theme colour with no prop plumbing
 *     (`.theme-toggle { color: var(--dawn-70) }` → `var(--gold)`), and
 *     means the glyph cannot drift from the tokens.
 *   - The glyph shows the theme you would GET, not the one you are in —
 *     the button's aria-label says so explicitly.
 *
 * Three things were measured rather than guessed, all of them the
 * difference between "a moon" and "a smudge":
 *   - THE CRESCENT IS AUTHORED BY THICKNESS (`t = R − BITE_R + BITE_D`),
 *     not by the bite's position. Driving it from centre offsets is how
 *     the first cuts came out as fat blobs with a notch: the bite has to
 *     overlap the main disc enough to carve the CENTRE out, and thickness
 *     is the only number that says whether it does.
 *   - THE GRID HAD TO GET FINER. On the old 3px grid (6 cells) and on a
 *     2px one (9 cells) a TILTED crescent rasterises with a horizontal
 *     spur at the lower horn and reads as a boot; only an untilted "C"
 *     survived, and a vertical C in HUD chrome reads as a bracket. At 1px
 *     the tilt is clean, so the moon can sit at its conventional −30°.
 *   - THE SUN'S RAYS ARE SPOKES, NOT BLOCKS. Square ray blocks read as a
 *     ring of dots around a disc; a one-cell spoke swept along the radius
 *     reads as a ray. The gap between core and spokes is deliberate.
 */

import type { ThemeMode } from "@/lib/theme/themeModeRef";

const SIZE = 18;
const CELL = 1;
const CELLS = SIZE / CELL;
const MID = (CELLS - 1) / 2;

/** Crescent, in cells. Thickness = MOON_R − MOON_BITE_R + MOON_BITE_D ≈ 6. */
const MOON_R = 8.6;
const MOON_BITE_R = 7.2;
const MOON_BITE_D = 4.6;
const MOON_BITE_DEG = -30;

/** Sun, in cells: a core disc, and eight spokes standing clear of it. */
const SUN_CORE_R = 4.8;
const SUN_RAY_IN = 6.0;
const SUN_RAY_OUT = 8.8;
const SUN_RAYS = 8;

type Cell = { cx: number; cy: number };
type Run = { x: number; y: number; w: number };

const cellKey = (cx: number, cy: number) => `${cx},${cy}`;

/** Drop cells joined to the rest of the shape only at a corner. */
function dropOrphans(cells: Cell[]): Cell[] {
  const present = new Set(cells.map((c) => cellKey(c.cx, c.cy)));
  return cells.filter(
    ({ cx, cy }) =>
      present.has(cellKey(cx - 1, cy)) ||
      present.has(cellKey(cx + 1, cy)) ||
      present.has(cellKey(cx, cy - 1)) ||
      present.has(cellKey(cx, cy + 1))
  );
}

/** Merge each row's consecutive cells into one rect — ~110 nodes become ~20. */
function toRuns(cells: Cell[]): Run[] {
  const rows = new Map<number, number[]>();
  for (const { cx, cy } of cells) {
    const row = rows.get(cy);
    if (row) row.push(cx);
    else rows.set(cy, [cx]);
  }
  const runs: Run[] = [];
  for (const [cy, xs] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    xs.sort((a, b) => a - b);
    let start = xs[0];
    let prev = xs[0];
    for (let i = 1; i <= xs.length; i++) {
      if (i < xs.length && xs[i] === prev + 1) {
        prev = xs[i];
        continue;
      }
      runs.push({ x: start * CELL, y: cy * CELL, w: (prev - start + 1) * CELL });
      start = xs[i];
      prev = xs[i];
    }
  }
  return runs;
}

function moonCells(): Cell[] {
  const bearing = (MOON_BITE_DEG * Math.PI) / 180;
  const bx = MID + Math.cos(bearing) * MOON_BITE_D;
  const by = MID + Math.sin(bearing) * MOON_BITE_D;
  const cells: Cell[] = [];
  for (let cy = 0; cy < CELLS; cy++) {
    for (let cx = 0; cx < CELLS; cx++) {
      const inDisc = (cx - MID) ** 2 + (cy - MID) ** 2 <= MOON_R ** 2;
      const inBite = (cx - bx) ** 2 + (cy - by) ** 2 <= MOON_BITE_R ** 2;
      if (inDisc && !inBite) cells.push({ cx, cy });
    }
  }
  return dropOrphans(cells);
}

function sunCells(): Cell[] {
  const cells: Cell[] = [];
  const present = new Set<string>();
  const add = (cx: number, cy: number) => {
    if (cx < 0 || cy < 0 || cx >= CELLS || cy >= CELLS) return;
    if (present.has(cellKey(cx, cy))) return;
    present.add(cellKey(cx, cy));
    cells.push({ cx, cy });
  };

  for (let cy = 0; cy < CELLS; cy++) {
    for (let cx = 0; cx < CELLS; cx++) {
      if ((cx - MID) ** 2 + (cy - MID) ** 2 <= SUN_CORE_R ** 2) add(cx, cy);
    }
  }
  for (let i = 0; i < SUN_RAYS; i++) {
    const bearing = (i / SUN_RAYS) * Math.PI * 2;
    // Half-cell steps so a diagonal spoke lands on every cell it crosses.
    for (let r = SUN_RAY_IN; r <= SUN_RAY_OUT + 1e-6; r += 0.5) {
      add(Math.round(MID + Math.cos(bearing) * r), Math.round(MID + Math.sin(bearing) * r));
    }
  }
  return cells;
}

/** Both shapes are constant — build them once, not per render. */
const MOON = toRuns(moonCells());
const SUN = toRuns(sunCells());

/** `target` is the theme the click would switch TO. */
export function ThemeGlyph({ target }: { target: ThemeMode }) {
  const runs = target === "light" ? SUN : MOON;
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", imageRendering: "pixelated" }}
    >
      {runs.map((r) => (
        <rect
          key={`${r.y}-${r.x}`}
          x={r.x}
          y={r.y}
          width={r.w}
          height={CELL}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}
