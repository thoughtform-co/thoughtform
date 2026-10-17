import { SURI_DRIVE_MAP } from "@/lib/arcs/content/shared/suriDriveMap";

import type { Figure } from "../types";

/** The map's own shape, read structurally: no type from the arcs. */
interface GrainMap {
  total: number;
  clusters: readonly { count: number; x: number; y: number }[];
  points: readonly { x: number; y: number; c: number }[];
}

const MAPS: Record<Extract<Figure, { kind: "field" }>["map"], GrainMap> = {
  "suri-drive": SURI_DRIVE_MAP,
};

/** The drawing's box: grains in the left square, names in the column right. */
const VB_W = 1400;
const VB_H = 1000;
const FIELD = 1000;
const GRAIN = 4.2;
const COL = 1040;
/* enough for a name on two lines at a phone's width */
const GAP = 130;

export function grainsPer(map: GrainMap): number {
  return Math.round(map.total / map.points.length);
}

function grainPath(points: readonly { x: number; y: number }[]): string {
  return points
    .map(
      (p) => `M${(p.x * FIELD).toFixed(1)} ${(p.y * FIELD).toFixed(1)}h${GRAIN}v${GRAIN}h-${GRAIN}z`
    )
    .join("");
}

/**
 * The names, in the order of their groups down the drawing, held at least a
 * line apart; each leader a level run from its group, a 45° jog to its name's
 * height, and a level run into the column.
 */
export function placeNames(
  map: GrainMap,
  labels: readonly { group: number; text: string }[]
): { group: number; text: string; ly: number; leader: string }[] {
  const seats = labels
    .map((l) => ({
      ...l,
      cx: map.clusters[l.group].x * FIELD,
      cy: map.clusters[l.group].y * FIELD,
    }))
    .sort((a, b) => a.cy - b.cy);
  const out: { group: number; text: string; ly: number; leader: string }[] = [];
  let floor = -Infinity;
  for (const s of seats) {
    const ly = Math.min(VB_H - 30, Math.max(s.cy, floor + GAP));
    floor = ly;
    const jog = Math.abs(ly - s.cy);
    const knee = Math.max(s.cx + 8, COL - 12 - jog);
    out.push({
      group: s.group,
      text: s.text,
      ly,
      leader: `M${s.cx.toFixed(1)} ${s.cy.toFixed(1)}H${knee.toFixed(1)}L${(knee + jog).toFixed(1)} ${ly.toFixed(1)}H${COL}`,
    });
  }
  return out;
}

/**
 * Field: a collection drawn as grains, one grain for a fixed number of items,
 * grouped where the model put them. At most four groups are named, with
 * generic words, beside the drawing on straight leaders (a level run, a 45°
 * jog, a level run). One group may be lit; the rest only run in dawn.
 */
export function Field({ figure }: { figure: Extract<Figure, { kind: "field" }> }) {
  const map = MAPS[figure.map];
  const named = new Set(figure.labels.map((l) => l.group));
  const lit = figure.lit;
  const quiet = map.points.filter((p) => !named.has(p.c) && p.c !== lit);
  const loud = map.points.filter((p) => named.has(p.c) && p.c !== lit);
  const gold = lit === undefined ? [] : map.points.filter((p) => p.c === lit);

  const placed = placeNames(map, figure.labels);

  const label =
    `${map.total.toLocaleString("en-GB")} items in ${map.clusters.length} groups, ` +
    `one grain for about ${grainsPer(map)} items; named: ` +
    figure.labels.map((l) => l.text.toLowerCase()).join(", ");

  return (
    <div className="csd-field" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} aria-hidden="true" focusable="false">
        <path className="csd-field__grain" d={grainPath(quiet)} />
        <path className="csd-field__grain csd-field__grain--named" d={grainPath(loud)} />
        {gold.length ? (
          <path className="csd-field__grain csd-field__grain--lit" d={grainPath(gold)} />
        ) : null}
        {placed.map((p) => (
          <path
            key={p.group}
            className="csd-field__leader"
            data-lit={p.group === lit ? "" : undefined}
            d={p.leader}
          />
        ))}
      </svg>
      {placed.map((p) => (
        <span
          key={p.group}
          className="csd-field__name"
          data-lit={p.group === lit ? "" : undefined}
          style={{ left: `${((COL + 14) / VB_W) * 100}%`, top: `${(p.ly / VB_H) * 100}%` }}
        >
          {p.text}
        </span>
      ))}
    </div>
  );
}
