/**
 * prep-x-bionic-drive-map — the Drive job's figure on the X-Bionic proposal
 * (ADR-153 U4, the ops job): Suri's marketing Drive as mapped on 9 October
 * 2026, reduced to what a proposal read by another client may show.
 *
 * READS ONLY: the map folder is never written. Output is ONE record,
 * `lib/arcs/content/shared/suriDriveMap.ts`, which the job's figure draws as
 * a grain field (`components/arcs/jobMap.ts`). Prints the counts, the file's
 * size and, ONCE, to the console only, the largest groups' names, so the
 * author can choose the generic words the figure letters.
 *
 *   node scripts/arcs/prep-x-bionic-drive-map.mjs
 *
 * ⚠ NOTHING IDENTIFYING LEAVES THE DATA. The source keys 82,307 items by
 * file id with a position, a group index, neighbours and a kind. The record
 * carries the total, the sixty groups as a count and a centroid, and about
 * 2,400 sample points as (x, y, group index). No group name, no file id, no
 * neighbour and no kind is written; the group names are read here only to
 * print them.
 *
 * ⚠ ONE SCALE FOR BOTH AXES. The positions are a 3D layout read in its first
 * two axes; each axis is normalised by the LARGER range and the narrower one
 * is centred, so the cloud keeps its shape inside the 0..1 crop. Normalising
 * each axis on its own would stretch it to a square. The range is the 1st
 * to 99th percentile, the far outliers clamped to the edge: on the full
 * range the cloud filled under half the crop.
 *
 * ⚠ SEEDED, so a re-run is the same record: the sample is a partial
 * Fisher-Yates per group on the house PRNG (`crewParticles.ts`'s), from one
 * constant seed. The source's own key order is the walk order.
 */

import { readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const SRC = "C:/Users/buyss/suri-drive-map";
const OUT = path.join(process.cwd(), "lib", "arcs", "content", "shared", "suriDriveMap.ts");

/** About this many sample points, spread over the groups by their size. */
const SAMPLE = 2400;
const SEED = 0x5ea1d;

/** The owner's mockup PRNG (`substrateForms.tsx`, `crewParticles.ts`), unchanged. */
function rng(seed) {
  let t = seed;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const q3 = (n) => Math.round(n * 1000) / 1000;

const map = JSON.parse(readFileSync(path.join(SRC, "map-all.json"), "utf8"));
const named = JSON.parse(readFileSync(path.join(SRC, "clusters-named-all.json"), "utf8"));

/* One pass: each item's (x, y, group). */
const items = [];
for (const item of Object.values(map)) {
  const [x, y] = item.p;
  const c = item.c;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isInteger(c)) continue;
  items.push([x, y, c]);
}
const total = items.length;
const groups = named.length;

/* The bounds are the 1st and 99th percentile of each axis, not the extremes:
   a handful of far outliers stretched the full range to more than twice the
   cloud, so the cloud filled under half the crop (measured on the first
   still). The ~1 % past the bounds is clamped to the edge, inside the crop. */
const TRIM = 0.01;
const percentile = (axis, q) => {
  const sorted = items.map((it) => it[axis]).sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
};
const minX = percentile(0, TRIM);
const maxX = percentile(0, 1 - TRIM);
const minY = percentile(1, TRIM);
const maxY = percentile(1, 1 - TRIM);
const rangeX = maxX - minX;
const rangeY = maxY - minY;
const scale = Math.max(rangeX, rangeY);
const padX = (1 - rangeX / scale) / 2;
const padY = (1 - rangeY / scale) / 2;
const clamp = (v) => Math.min(1, Math.max(0, v));
const nx = (x) => clamp((x - minX) / scale + padX);
const ny = (y) => clamp((y - minY) / scale + padY);

/* The groups: count and centroid, in the normalised crop. */
const byGroup = Array.from({ length: groups }, () => ({ count: 0, sx: 0, sy: 0, idx: [] }));
items.forEach(([x, y, c], i) => {
  const g = byGroup[c];
  if (!g) throw new Error(`prep-x-bionic-drive-map: group ${c} is not named`);
  g.count += 1;
  g.sx += nx(x);
  g.sy += ny(y);
  /* Only an item inside the trimmed range may be sampled: a clamped
     outlier would sit on the crop's edge, under a word. The count and the
     centroid still take every item. */
  if (x >= minX && x <= maxX && y >= minY && y <= maxY) g.idx.push(i);
});
const clusters = byGroup.map((g) => ({
  count: g.count,
  x: g.count ? q3(g.sx / g.count) : 0.5,
  y: g.count ? q3(g.sy / g.count) : 0.5,
}));
if (clusters.reduce((s, c) => s + c.count, 0) !== total) {
  throw new Error("prep-x-bionic-drive-map: the groups do not sum to the total");
}

/* The sample: each group's share of SAMPLE, at least one, picked without
   replacement by a partial Fisher-Yates on the one seeded PRNG. */
const R = rng(SEED);
const points = [];
byGroup.forEach((g, c) => {
  if (!g.count) return;
  const k = Math.min(g.count, Math.max(1, Math.round((SAMPLE * g.count) / total)));
  const idx = g.idx.slice();
  for (let i = 0; i < k; i += 1) {
    const j = i + Math.floor(R() * (idx.length - i));
    [idx[i], idx[j]] = [idx[j], idx[i]];
    const [x, y] = items[idx[i]];
    points.push({ x: q3(nx(x)), y: q3(ny(y)), c });
  }
});

const body = [
  'import type { ArcJobMap } from "../../types";',
  "",
  "/**",
  " * SURI'S MARKETING DRIVE, AS MAPPED ON 9 OCTOBER 2026 (the X-Bionic",
  " * proposal's ops job, ADR-153 U4): the total, sixty groups as a count and a",
  " * centroid, and a seeded sample of the items as (x, y, group) in a 0..1 crop.",
  " *",
  " * ⚠ GENERATED by `scripts/arcs/prep-x-bionic-drive-map.mjs` from the map's",
  " * own files on this machine; never edited by hand. Nothing identifying is in",
  " * it: no group name, no file id, no neighbour. The four words the figure",
  " * letters are authored on the job (`shared/jobs.ts`), generic by law.",
  " */",
  "export const SURI_DRIVE_MAP: ArcJobMap = {",
  `  total: ${total},`,
  "  clusters: [",
  ...clusters.map((c) => `    { count: ${c.count}, x: ${c.x}, y: ${c.y} },`),
  "  ],",
  "  points: [",
  ...points.map((p) => `    { x: ${p.x}, y: ${p.y}, c: ${p.c} },`),
  "  ],",
  "};",
  "",
].join("\n");
writeFileSync(OUT, body);

const { size } = statSync(OUT);
console.log(
  `suriDriveMap.ts  ${total} items, ${groups} groups, ${points.length} sample points  ${(size / 1024).toFixed(0)} kB`
);
console.log(`bounds x ${minX}..${maxX}  y ${minY}..${maxY}  (one scale ${scale.toFixed(3)})`);
/* The largest groups, console only: the author picks the figure's words. */
const ranked = clusters
  .map((c, i) => ({ i, count: c.count, x: c.x, y: c.y, name: named[i].name }))
  .sort((p, q) => q.count - p.count)
  .slice(0, 10);
for (const g of ranked) {
  console.log(
    `  #${String(g.i).padStart(2)}  ${String(g.count).padStart(6)}  (${g.x}, ${g.y})  ${g.name}`
  );
}
