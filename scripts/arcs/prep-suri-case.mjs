/**
 * prep-suri-case — the Suri case's two data figures on the cases page:
 * the Drive as it was (a treemap of its folders, grains for its files) and
 * the library's map in 3D (the layout the asset library draws).
 *
 * READS ONLY: the map folder is never written. Writes two files:
 *
 *   components/arcs/case-dossier/data/suriCase.ts   the Drive's sprawl + the map's groups
 *   public/arcs/suri/map-3d.bin                     the map's points, quantised
 *
 *   node scripts/arcs/prep-suri-case.mjs            (SURI_MAP=… to point elsewhere)
 *
 * ⚠ NOTHING IDENTIFYING LEAVES THE DATA. The inventory carries names, paths,
 * owners and links; the map carries file ids and neighbours. Written out are
 * only shapes and counts: each folder as a rectangle with its depth and its
 * file count (no name), grains placed at random inside it, and each map point
 * as a quantised x, y, z and a group index. Group names are the generic words
 * chosen below, never the clustering's own names, which can name shoots and
 * products. The owner decided on 2026-10-19 that the stripped positions may
 * be published.
 *
 * ⚠ DUPLICATES are read as files sharing a name and a size, which the
 * inventory carries; the Drive walk's own count (19,827, by checksum) is the
 * one the page letters.
 *
 * ⚠ SEEDED, so a re-run writes the same files.
 */

import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const SRC = process.env.SURI_MAP ?? path.join(os.homedir(), "suri-drive-map");
const ROOT = process.cwd();
const OUT_TS = path.join(ROOT, "components", "arcs", "case-dossier", "data", "suriCase.ts");
const OUT_BIN = path.join(ROOT, "public", "arcs", "suri", "map-3d.bin");

/** The treemap reads the folders this many levels under the marketing root. */
const LEVELS = 3;
/** One grain for this many files. */
const PER_GRAIN = 30;
/** About this many map points, spread over the groups by their size. */
const POINTS = 9000;
const SEED = 0x5ea1d;

/** The house PRNG (`crewParticles.ts`), unchanged. */
function rng(seed) {
  let t = seed;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const r3 = (n) => Math.round(n * 1000) / 1000;

/* ── 1. The Drive: folders as a treemap, files as grains ─────────────── */

const FOLDER = "application/vnd.google-apps.folder";
const lines = readFileSync(path.join(SRC, "inventory.jsonl"), "utf8").split("\n").filter(Boolean);
const files = [];
let folders = 0;
let deepest = 0;
for (const l of lines) {
  const r = JSON.parse(l);
  if (r.mimeType === FOLDER || r.kind === FOLDER) {
    folders++;
    continue;
  }
  deepest = Math.max(deepest, r.depth);
  /* the path is the file's folder; its first segment is the marketing root */
  const segs = String(r.path).split("/").slice(1).map((s) => s.trim());
  files.push({ segs, key: `${r.name}\u0000${r.size ?? ""}` });
}
const seen = new Map();
for (const f of files) seen.set(f.key, (seen.get(f.key) ?? 0) + 1);

/** The folder tree to LEVELS, each node's files counted with everything under it. */
function node() {
  return { files: 0, dups: 0, kids: new Map() };
}
const tree = node();
for (const f of files) {
  const dup = seen.get(f.key) > 1;
  let at = tree;
  at.files++;
  if (dup) at.dups++;
  for (const s of f.segs.slice(0, LEVELS)) {
    if (!at.kids.has(s)) at.kids.set(s, node());
    at = at.kids.get(s);
    at.files++;
    if (dup) at.dups++;
  }
}

/** Squarified treemap (Bruls et al.), rows laid along the shorter side. */
function squarify(items, x, y, w, h) {
  const out = [];
  const total = items.reduce((s, i) => s + i.v, 0);
  if (!total) return out;
  const scale = (w * h) / total;
  let rest = items.map((i) => ({ ...i, a: i.v * scale }));
  let bx = x;
  let by = y;
  let bw = w;
  let bh = h;
  while (rest.length) {
    const side = Math.min(bw, bh);
    let row = [];
    let best = Infinity;
    for (const it of rest) {
      const next = [...row, it];
      const s = next.reduce((t, i) => t + i.a, 0);
      const mx = Math.max(...next.map((i) => i.a));
      const mn = Math.min(...next.map((i) => i.a));
      const worst = Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
      if (worst > best) break;
      best = worst;
      row = next;
    }
    const s = row.reduce((t, i) => t + i.a, 0);
    const thick = s / side;
    let off = 0;
    for (const it of row) {
      const len = it.a / thick;
      out.push(
        bw >= bh
          ? { ...it, x: bx, y: by + off, w: thick, h: len }
          : { ...it, x: bx + off, y: by, w: len, h: thick }
      );
      off += len;
    }
    if (bw >= bh) {
      bx += thick;
      bw -= thick;
    } else {
      by += thick;
      bh -= thick;
    }
    rest = rest.slice(row.length);
  }
  return out;
}

const W = 1600;
const H = 1000;
const PAD = [0, 6, 3, 2];
const rects = [];
function lay(n, depth, x, y, w, h) {
  const kids = [...n.kids.values()].filter((k) => k.files > 0).sort((a, b) => b.files - a.files);
  /* files that sit in this folder itself, beside its subfolders */
  const own = n.files - kids.reduce((s, k) => s + k.files, 0);
  const items = kids.map((k) => ({ v: k.files, n: k }));
  if (own > 0 && kids.length) items.push({ v: own, n: { files: own, dups: 0, kids: new Map(), own: true } });
  for (const it of squarify(items, x, y, w, h)) {
    const p = PAD[Math.min(depth, PAD.length - 1)];
    const r = { d: depth, x: it.x, y: it.y, w: it.w, h: it.h, f: it.n.files, u: it.n.dups };
    if (!it.n.own) rects.push(r);
    if (it.n.kids.size && depth < LEVELS) {
      lay(it.n, depth + 1, it.x + p, it.y + p, Math.max(0, it.w - 2 * p), Math.max(0, it.h - 2 * p));
    } else {
      r.leaf = true;
      if (it.n.own) rects.push(r);
    }
  }
}
lay(tree, 1, 0, 0, W, H);

/* grains, at random inside each leaf, the duplicates among them by share */
const rand = rng(SEED);
const grains = [];
const dupGrains = [];
for (const r of rects.filter((x) => x.leaf)) {
  const n = Math.floor(r.f / PER_GRAIN + rand());
  const nd = Math.round((n * r.u) / Math.max(1, r.f));
  for (let i = 0; i < n; i++) {
    const g = [Math.round(r.x + 2 + rand() * Math.max(0, r.w - 6)), Math.round(r.y + 2 + rand() * Math.max(0, r.h - 6))];
    (i < nd ? dupGrains : grains).push(g);
  }
}
const folderRects = rects
  .filter((r) => r.w * r.h >= 90 && r.w >= 3 && r.h >= 3)
  .map((r) => [r.d, Math.round(r.x), Math.round(r.y), Math.round(r.w), Math.round(r.h)]);

/* ── 2. The map, in 3D ───────────────────────────────────────────────── */

const map = JSON.parse(readFileSync(path.join(SRC, "map-all.json"), "utf8"));
const byGroup = new Map();
for (const v of Object.values(map)) {
  if (!byGroup.has(v.c)) byGroup.set(v.c, []);
  byGroup.get(v.c).push(v.p);
}
const total = Object.keys(map).length;
const groups = [...byGroup.keys()].sort((a, b) => a - b);
/* a seeded sample per group, by size, at least a few points each */
const pts = [];
for (const g of groups) {
  const all = byGroup.get(g);
  const k = Math.max(12, Math.round((all.length / total) * POINTS));
  const idx = all.map((_, i) => i);
  for (let i = 0; i < Math.min(k, idx.length); i++) {
    const j = i + Math.floor(rand() * (idx.length - i));
    [idx[i], idx[j]] = [idx[j], idx[i]];
    pts.push([...all[idx[i]], g]);
  }
}
/* centre and scale by the largest axis range (1st–99th percentile) */
const axis = (a) => pts.map((p) => p[a]).sort((x, y) => x - y);
const pc = (s, q) => s[Math.floor(q * (s.length - 1))];
const lo = [0, 1, 2].map((a) => pc(axis(a), 0.01));
const hi = [0, 1, 2].map((a) => pc(axis(a), 0.99));
const mid = lo.map((l, a) => (l + hi[a]) / 2);
const half = Math.max(...hi.map((h, a) => h - lo[a])) / 2;
const xyz = new Int16Array(pts.length * 3);
const grp = new Uint8Array(pts.length);
pts.forEach((p, i) => {
  for (let a = 0; a < 3; a++) {
    const v = Math.max(-1.2, Math.min(1.2, (p[a] - mid[a]) / half));
    xyz[i * 3 + a] = Math.round(v * 32767 / 1.2);
  }
  grp[i] = p[3];
});
const counts = groups.map((g) => byGroup.get(g).length);

mkdirSync(path.dirname(OUT_BIN), { recursive: true });
/* layout: u32 count, then int16 x,y,z per point (÷32767×1.2), then u8 group per point */
const head = new Uint32Array([pts.length]);
writeFileSync(
  OUT_BIN,
  Buffer.concat([Buffer.from(head.buffer), Buffer.from(xyz.buffer), Buffer.from(grp.buffer)])
);

/* group centroids, for the labels */
const cent = groups.map((g) => {
  const s = [0, 0, 0];
  let n = 0;
  pts.forEach((p, i) => {
    if (grp[i] !== g) return;
    for (let a = 0; a < 3; a++) s[a] += xyz[i * 3 + a] / (32767 / 1.2);
    n++;
  });
  return s.map((v) => r3(v / Math.max(1, n)));
});

mkdirSync(path.dirname(OUT_TS), { recursive: true });
const ts = `/**
 * The Suri case's data, written by \`scripts/arcs/prep-suri-case.mjs\` from the
 * Drive walk of 7 October 2026 and the library's map. Shapes and counts only:
 * no folder name, file id, person or group name from the data. Do not edit.
 */

/** The Drive as it was: folders as rectangles in a ${W}×${H} box, files as grains. */
export const SURI_DRIVE = {
  box: [${W}, ${H}] as const,
  items: ${files.length + folders},
  files: ${files.length},
  folders: ${folders},
  deepest: ${deepest},
  perGrain: ${PER_GRAIN},
  /** [depth, x, y, w, h] */
  rects: ${JSON.stringify(folderRects)} as readonly (readonly [number, number, number, number, number])[],
  grains: ${JSON.stringify(grains)} as readonly (readonly [number, number])[],
  dups: ${JSON.stringify(dupGrains)} as readonly (readonly [number, number])[],
};

/** The map: ${pts.length} of its ${total.toLocaleString("en-GB")} points, in \`/arcs/suri/map-3d.bin\`. */
export const SURI_MAP_3D = {
  src: "/arcs/suri/map-3d.bin",
  total: ${total},
  points: ${pts.length},
  /** each group's size in the whole map, and its centre in the drawing's units */
  groups: ${JSON.stringify(counts.map((c, i) => [c, ...cent[i]]))} as readonly (readonly [number, number, number, number])[],
};
`;
writeFileSync(OUT_TS, ts);

const kb = (p) => `${(statSync(p).size / 1024).toFixed(1)} KB`;
console.log(`drive: ${files.length} files, ${folders} folders, deepest ${deepest}`);
console.log(`  ${folderRects.length} folders drawn, ${grains.length} grains + ${dupGrains.length} duplicate grains`);
console.log(`map: ${pts.length} of ${total} points, ${groups.length} groups`);
console.log(`wrote ${OUT_TS} (${kb(OUT_TS)}), ${OUT_BIN} (${kb(OUT_BIN)})`);
/* to the console only, never written: the largest groups' own names, so the
   author can choose generic words for the figure */
const named = JSON.parse(readFileSync(path.join(SRC, "clusters-named-all.json"), "utf8"));
groups
  .map((g) => [g, byGroup.get(g).length])
  .sort((a, b) => b[1] - a[1])
  .slice(0, 12)
  .forEach(([g, n]) => console.log(`  group ${g}: ${n}  ${named[g]?.name ?? ""}`));
