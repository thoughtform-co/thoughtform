import { SURI_DRIVE } from "../data/suriCase";
import type { Figure } from "../types";

type SprawlFigure = Extract<Figure, { kind: "sprawl" }>;

const MAPS: Record<SprawlFigure["map"], typeof SURI_DRIVE> = { "suri-drive": SURI_DRIVE };

const G = 5;

function grainPath(gs: readonly (readonly [number, number])[]): string {
  return gs.map(([x, y]) => `M${x} ${y}h${G}v${G}h-${G}z`).join("");
}

function rectPath(rs: readonly (readonly [number, number, number, number, number])[]): string {
  return rs.map(([, x, y, w, h]) => `M${x} ${y}h${w}v${h}h-${w}z`).join("");
}

/**
 * Sprawl: a collection as it was before anything read it. Every folder is a
 * rectangle sized by the files under it, three levels deep, nested the way
 * the Drive nests them; every grain is a share of the files, dropped where
 * they sit; the duplicates are the lit grains. No folder is named: the
 * shape is the point (owner, 2026-10-19: "it should show the number of
 * files and the fact that it was chaotic and unexplored").
 *
 * Server; the shapes are `data/suriCase.ts`, written by
 * `scripts/arcs/prep-suri-case.mjs` from the Drive walk.
 */
export function Sprawl({ figure }: { figure: SprawlFigure }) {
  const d = MAPS[figure.map];
  const [w, h] = d.box;
  const byDepth = [1, 2, 3].map((k) => d.rects.filter((r) => r[0] === k));
  const label =
    `${d.items.toLocaleString("en-GB")} items, ${d.folders.toLocaleString("en-GB")} folders ` +
    `up to ${d.deepest} levels deep, drawn as nested rectangles; ` +
    figure.key.join("; ");
  return (
    <div className="csd-sprawl" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path className="csd-sprawl__dir" data-d="3" d={rectPath(byDepth[2])} />
        <path className="csd-sprawl__dir" data-d="2" d={rectPath(byDepth[1])} />
        <path className="csd-sprawl__dir" data-d="1" d={rectPath(byDepth[0])} />
        <path className="csd-sprawl__grain" d={grainPath(d.grains)} />
        <path className="csd-sprawl__grain csd-sprawl__grain--lit" d={grainPath(d.dups)} />
      </svg>
      <ul className="csd-sprawl__key">
        {figure.key.map((k, i) => (
          <li key={k} data-lit={i === figure.key.length - 1 ? "" : undefined}>
            <i aria-hidden="true" />
            {k}
          </li>
        ))}
      </ul>
    </div>
  );
}
