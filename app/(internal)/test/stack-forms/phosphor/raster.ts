/* The stack as a grid of characters. PURE: the model and nothing else, no
   clock and no dice, so the same grid and the same pose are the same text.

   One buffer holds everything on the panel: the three plates, what crosses
   the gaps between them, the ladder beside them and every typed word. Each
   plate is set in its own FAMILY of glyphs, so the three differ in kind and
   not only in tone:
     team    punctuation and letters: a dotted field, each workstream a block
             of its own initial, its edges in sub-row strokes ( ¯ - _ );
     layer   shade blocks ( ░ ▒ ▓ █ ): the one dense thing, nested squares on
             its top, its three strata as three shades down its walls;
     agents  box-drawing ( ─ │ ┌ ┐ └ ┘ ): a board of traces, a solid chip,
             four modules.

   A second setting, "written" (S5·B; owner, 2026-10-13: "the middle panel
   looks a bit too much like Lego"), keeps the team and sets the other two in
   writing too, with no shade block anywhere: the layer as running words (its
   three holds, row after row, what the team wrote down), its strata as three
   rows of their own word; the agents' chip and modules as ruled frames with
   the tool's name inside. Three kinds of writing: loose letters, dense
   running words, ruled frames. "blocks" (S5) is untouched by it.

   A third, "spare" (S5·C; owner, 2026-10-13, on S5·B: "needs not the 'evals'
   as a material; more minimalistic"), fills no face at all. Every plate is
   its outline. The team is four outlined workstreams, each named once. The
   layer is a ruled page: lines of writing with the words left out, lying on
   it in the plate's own perspective, and its three strata are three edges
   down its walls. The agents are the written setting's ruled frames on a
   quieter board. Beside the stack: a line a plate, the layer's three holds
   set once, the pose and the count. No ladder. The other two settings are
   untouched by it.

   The frame is stated in CELLS: a plate's x runs three columns right and one
   row down, its y three columns left and one row down, z two rows up. With a
   9 x 16 px cell that is 30.6 degrees, the proposal's isometric to within a
   degree, and every plate edge falls exactly one row in three columns. */

import {
  factsOf,
  type Feature,
  type Frame,
  hash2,
  type Hit,
  hit,
  plateFrame,
  PLATES,
  type Plate,
  type Pose,
  poseAt,
  project,
  type Pt,
  SIDE,
  stackBounds,
} from "../model";

/** A cell on screen, in px: PT Mono at 15px advances 9px; the line is 16px. */
export const CELL = { w: 9, h: 16 } as const;

/** Every glyph this drawing may set, all of them in PT Mono (checked against
    the font's own table): a missing one would fall back to another face and
    break the grid. Letters, digits and the space are also allowed. */
export const GLYPHS = "·¯-_=:.+%x─│┌┐└┘├┤░▒▓█";
/** The written setting's: the same, less the four shade blocks, plus a bar. */
export const GLYPHS_WRITTEN = "·¯-_=:.+%x|─│┌┐└┘├┤";
/** The spare setting's: strokes, rules, a cross and a colon. */
export const GLYPHS_SPARE = "¯-_:+─│┌┐└┘├";

/** "blocks" is S5; "written" is S5·B; "spare" is S5·C. */
export type Setting = "blocks" | "written" | "spare";

/** green, gold, bone: the three plates' tones. */
type Tone = 0 | 1 | 2;
/** dim, plain, hot. */
type Level = 0 | 1 | 2;

export interface Run {
  /** "" for unlit cells. */
  cls: string;
  text: string;
}

export interface Raster {
  cols: number;
  rows: number;
  lines: Run[][];
}

/* room kept either side of the stack for the ladder and the typed words */
const LEFT = 28;
const RIGHT = 36;
/* cells a third of a unit: every size keeps a plate's corners on whole cells */
const SIZES = [2, 1.75, 1.5, 1.25, 1, 0.875, 0.75, 0.625, 0.5];

const cellFrame = (b: number, ox: number, oy: number): Frame => ({
  o: [ox, oy],
  ex: [3 * b, b],
  ey: [-3 * b, b],
  ez: [0, -2 * b],
});

/** The pose with its pitch on whole rows, so every plate sits on the grid. */
function onRows(pose: Pose, b: number): Pose {
  const pitch = Math.max(1, Math.round(pose.pitch * 2 * b)) / (2 * b);
  return { open: pose.open, pitch, lift: [pitch, 0, -pitch] };
}

/** The largest stack that leaves room for its words, seated for the OPENED
    pose so opening never rescales it. */
function seat(cols: number, rows: number): { f: Frame; b: number } | null {
  for (const b of SIZES) {
    const box = stackBounds(cellFrame(b, 0, 0), onRows(poseAt(1), b));
    const w = box.x1 - box.x0;
    const h = box.y1 - box.y0;
    if (h + 5 > rows || w + LEFT + RIGHT > cols) continue;
    const half = w / 2;
    const ox = Math.min(cols - RIGHT - half, Math.max(LEFT + half, Math.round(cols * 0.46)));
    const oy = Math.round(rows / 2 - (box.y0 + box.y1) / 2);
    return { f: cellFrame(b, Math.round(ox), oy), b };
  }
  return null;
}

/** What the team wrote down: the layer's three holds, over and over. */
const WRITING = `${PLATES[1].holds.map((w) => w.toLowerCase()).join(" ")} `;
/** Which of those words each of its characters belongs to (a space, to the
    word before it). */
const WORD_OF = PLATES[1].holds.flatMap((w, n) => Array.from({ length: w.length + 1 }, () => n));

const featureAt = (plate: Plate, x: number, y: number): Feature | undefined =>
  plate.features.find((ft) => x >= ft.box.x0 && x <= ft.box.x1 && y >= ft.box.y0 && y <= ft.box.y1);

/** The cells a polyline passes through, in order, each a step left, right, up
    or down from the one before. */
function cellsAlong(pts: readonly Pt[], closed: boolean): [number, number][] {
  const out: [number, number][] = [];
  const push = (c: number, r: number) => {
    const last = out[out.length - 1];
    if (last && last[0] === c && last[1] === r) return;
    if (last && last[0] !== c && last[1] !== r) out.push([c, last[1]]);
    out.push([c, r]);
  };
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % pts.length];
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 6));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      push(Math.floor(ax + (bx - ax) * t), Math.floor(ay + (by - ay) * t));
    }
  }
  if (closed && out.length > 1) {
    const [fc, fr] = out[0];
    const [lc, lr] = out[out.length - 1];
    if (fc === lc && fr === lr) out.pop();
  }
  return out;
}

/** The box-drawing glyph that joins a cell to the one before and the one after. */
function joint(
  prev: [number, number] | null,
  cur: [number, number],
  next: [number, number] | null
) {
  const dir = (o: [number, number] | null) =>
    !o ? "" : o[0] < cur[0] ? "L" : o[0] > cur[0] ? "R" : o[1] < cur[1] ? "U" : "D";
  const key = [dir(prev), dir(next)].sort().join("");
  switch (key) {
    case "DR":
      return "┌";
    case "DL":
      return "┐";
    case "RU":
      return "└";
    case "LU":
      return "┘";
    case "DU":
    case "D":
    case "U":
    case "DD":
    case "UU":
      return "│";
    default:
      return "─";
  }
}

export function rasterise(
  cols: number,
  rows: number,
  open: number,
  setting: Setting = "blocks"
): Raster | null {
  const written = setting === "written";
  const spare = setting === "spare";
  const seated = seat(cols, rows);
  if (!seated) return null;
  const { f, b } = seated;
  const truth = poseAt(open);
  const pose = onRows(truth, b);
  const ox = f.o[0];

  const ch: string[] = new Array(cols * rows).fill(" ");
  const st = new Uint8Array(cols * rows);
  const at = (c: number, r: number) => r * cols + c;
  const inside = (c: number, r: number) => c >= 0 && c < cols && r >= 0 && r < rows;
  /* a style is a tone, a level and, in the written setting, a weight */
  const put = (c: number, r: number, g: string, tone: Tone, level: Level, bold = false) => {
    if (!inside(c, r)) return;
    ch[at(c, r)] = g;
    st[at(c, r)] = g === " " ? 0 : 1 + tone * 3 + level + (bold ? 9 : 0);
  };
  const type = (c: number, r: number, s: string, tone: Tone, level: Level) => {
    for (let i = 0; i < s.length; i++) put(c + i, r, s[i], tone, level);
  };

  /* -- what is at every cell ------------------------------------------- */

  const box = stackBounds(f, pose);
  const hits: (Hit | null)[] = new Array(cols * rows).fill(null);
  for (let r = Math.max(0, Math.floor(box.y0) - 1); r <= Math.min(rows - 1, Math.ceil(box.y1)); r++)
    for (
      let c = Math.max(0, Math.floor(box.x0) - 1);
      c <= Math.min(cols - 1, Math.ceil(box.x1));
      c++
    )
      hits[at(c, r)] = hit(f, pose, c + 0.5, r + 0.5);

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const h = hits[at(c, r)];
      if (!h) continue;
      const plate = PLATES[h.plate];
      const tone = h.plate as Tone;
      /* a sliver of a lower stratum's top shows between the layer's strata:
         it is wall */
      const wall = h.face !== "top" || (h.plate === 1 && h.z < plate.top - 0.01);
      /* spare: no face is filled */
      if (spare) continue;
      if (written) {
        if (h.plate === 0) {
          /* the team as S5 sets it, its walls ruled instead of shaded */
          if (wall) put(c, r, h.face === "right" ? ":" : "|", tone, h.face === "right" ? 0 : 1);
          else {
            const ft = featureAt(plate, h.x, h.y);
            if (ft?.kind === "tile") put(c, r, ft.id[0], tone, 1);
            else if (ft?.kind === "rail") put(c, r, "=", tone, 0);
            else if ((c + r) % 2 === 0) put(c, r, "·", tone, 0);
          }
        } else if (h.plate === 1) {
          if (wall) {
            /* a stripe a stratum, each of its own initial (context at the
               base, then skills, then evals): plain weight, so the walls stand
               apart from the bold words of the top; the far wall dimmer */
            const k = Math.min(2, Math.max(0, Math.floor(h.z / (plate.top / 3) - 0.001)));
            const right = h.face === "right" || (h.face === "top" && h.x > h.y);
            put(c, r, plate.holds[k][0].toLowerCase(), tone, right ? 0 : 1);
          } else {
            /* what was written down, row after row; each row starts further
               along, so no letter stands in a column; a word in six burns
               white-hot */
            const start = c + ((r * 8) % WRITING.length);
            const g = WRITING[start % WRITING.length];
            const word = Math.floor(start / WRITING.length) * 3 + WORD_OF[start % WRITING.length];
            const hot = hash2(word, r, 5) < 0.16;
            /* words are parted by a small dot, so the weave has no holes */
            if (g === " ") put(c, r, "·", tone, 0);
            else put(c, r, g, tone, hot ? 2 : 1, true);
          }
        } else if (wall) put(c, r, h.face === "right" ? "·" : "│", tone, 0);
        else if (!featureAt(plate, h.x, h.y) && c % 4 === 0 && r % 2 === 0) put(c, r, "·", tone, 0);
      } else if (h.plate === 0) {
        if (wall) put(c, r, h.face === "right" ? "░" : "▒", tone, 1);
        else {
          const ft = featureAt(plate, h.x, h.y);
          if (ft?.kind === "tile") put(c, r, ft.id[0], tone, 1);
          else if (ft?.kind === "rail") put(c, r, "=", tone, 0);
          else if ((c + r) % 2 === 0) put(c, r, "·", tone, 0);
        }
      } else if (h.plate === 1) {
        if (wall) {
          /* three strata, three shades: context at the base, evals on top */
          const k = Math.min(2, Math.max(0, Math.floor(h.z / (plate.top / 3) - 0.001)));
          const right = h.face === "right" || (h.face === "top" && h.x > h.y);
          put(c, r, (right ? "░▒▓" : "▒▓█")[k], tone, k === 2 ? 2 : 1);
        } else {
          /* nested squares about the middle: the one lit thing */
          const d = Math.max(Math.abs(h.x - SIDE / 2), Math.abs(h.y - SIDE / 2));
          if (d < 0.9) put(c, r, "█", tone, 2);
          else if (d < 1.7) put(c, r, "░", tone, 1);
          else if (d < 2.5) put(c, r, "█", tone, 2);
          else if (d < 3.3) put(c, r, "▒", tone, 1);
          else put(c, r, "▓", tone, 1);
        }
      } else {
        if (wall) put(c, r, h.face === "right" ? "░" : "▒", tone, 0);
        else {
          const ft = featureAt(plate, h.x, h.y);
          /* solid, but never as bright as the layer: that is the lit one */
          if (ft?.kind === "chip") put(c, r, "█", tone, 1);
          else if (ft?.kind === "module") put(c, r, "▒", tone, 1);
          else if (c % 4 === 0 && r % 2 === 0) put(c, r, "·", tone, 0);
        }
      }
    }

  /* -- the team's edges, in sub-row strokes ----------------------------- */

  const edge = (a: Pt, e: Pt, plate: 0 | 1 | 2) => {
    const [x0, x1] = a[0] < e[0] ? [a[0], e[0]] : [e[0], a[0]];
    for (let c = Math.ceil(x0 - 0.5); c + 0.5 <= x1; c++) {
      const t = (c + 0.5 - a[0]) / (e[0] - a[0]);
      const y = a[1] + (e[1] - a[1]) * t;
      const r = Math.floor(y);
      if (!inside(c, r)) continue;
      const h = hits[at(c, r)];
      if (h && h.plate !== plate) continue;
      const frac = y - r;
      put(c, r, frac < 1 / 3 ? "¯" : frac < 2 / 3 ? "-" : "_", plate as Tone, 2);
    }
  };
  if (!spare) {
    const pf = plateFrame(f, pose, 0);
    const z = PLATES[0].top;
    const k = [
      project(pf, 0, 0, z),
      project(pf, SIDE, 0, z),
      project(pf, SIDE, SIDE, z),
      project(pf, 0, SIDE, z),
    ];
    for (let i = 0; i < 4; i++) edge(k[i], k[(i + 1) % 4], 0);
  }

  /* written: the layer's two far edges too, so the words end on a line */
  if (written) {
    const pf = plateFrame(f, pose, 1);
    const z = PLATES[1].top;
    edge(project(pf, 0, SIDE, z), project(pf, 0, 0, z), 1);
    edge(project(pf, 0, 0, z), project(pf, SIDE, 0, z), 1);
  }

  /* -- spare: the team and the layer as outlines, the layer a ruled page -- */

  if (spare) {
    /* a stroke a column along a line, as `edge` sets them, at any level.
       `onTop` keeps it to the plate's own top face (what lies on a plate);
       otherwise it may also stand on the bare ground beside the plate (an
       outline), and only a plate in front hides it */
    const lies = (h: Hit | null, plate: 0 | 1) =>
      !!h && h.plate === plate && h.face === "top" && h.z >= PLATES[plate].top - 0.01;
    const stroke = (a: Pt, e: Pt, plate: 0 | 1, level: Level, onTop = false, bold = false) => {
      const [x0, x1] = a[0] < e[0] ? [a[0], e[0]] : [e[0], a[0]];
      for (let c = Math.ceil(x0 - 0.5); c + 0.5 <= x1; c++) {
        /* a hair down, so a line that runs exactly along a third of a row
           takes the same stroke in every column */
        const y = a[1] + ((e[1] - a[1]) * (c + 0.5 - a[0])) / (e[0] - a[0]) + 1e-6;
        const r = Math.floor(y);
        if (!inside(c, r)) continue;
        const h = hits[at(c, r)];
        if (onTop ? !lies(h, plate) : h && h.plate !== plate) continue;
        put(c, r, "¯-_"[Math.min(2, Math.floor((y - r) * 3))], plate, level, bold);
      }
    };
    /* the lower plate first: where two outlines share a bare cell, the
       upper one is in front */
    for (const i of [1, 0] as const) {
      const pf = plateFrame(f, pose, i);
      const plate = PLATES[i];
      const top = plate.top;
      const at3 = (x: number, y: number, z: number) => project(pf, x, y, z);
      /* the two near edges at a height: down the left wall, down the right */
      const near = (z: number, left: Level, right: Level, bold = false) => {
        stroke(at3(0, SIDE, z), at3(SIDE, SIDE, z), i, left, false, bold);
        stroke(at3(SIDE, SIDE, z), at3(SIDE, 0, z), i, right, false, bold);
      };
      /* a plate is a sheet: one outline. The layer is three, so under its
         outline come its floor and the edge of each stratum below the top
         one: the strata are told apart by these edges and by nothing else */
      if (plate.body.length > 1) {
        near(0, 0, 0);
        for (const solid of plate.body.slice(0, -1)) near(solid.z1, 1, 0);
      }
      const lit: Level = plate.lit ? 2 : 1;
      stroke(at3(0, SIDE, top), at3(0, 0, top), i, lit, false, plate.lit);
      stroke(at3(0, 0, top), at3(SIDE, 0, top), i, lit, false, plate.lit);
      near(top, lit, lit, plate.lit);

      if (i === 0) {
        /* each workstream an outline, to be named inside it; under seven
           rows tall four of them are a tangle, and the name stands alone */
        for (const ft of plate.features) {
          if (ft.kind !== "tile") continue;
          const { x0, x1, y0, y1 } = ft.box;
          if ((x1 - x0) * 2 * b < 7) continue;
          const k = [at3(x0, y0, top), at3(x1, y0, top), at3(x1, y1, top), at3(x0, y1, top)];
          for (let n = 0; n < 4; n++) stroke(k[n], k[(n + 1) % 4], 0, 0, true);
        }
      } else {
        /* the page: lines of writing with the words left out. A rule across
           every other row, each word a run of it and each space a bare cell;
           a line starts a margin in from the plate's edge and ends where it
           ends, a few of them short. Laid out on the whole face, whatever
           the plate above hides, so opening the stack uncovers the same
           page. */
        const [cx, cy] = at3(SIDE / 2, SIDE / 2, top);
        const mid = Math.floor(cy);
        const margin = Math.max(2, Math.round(2.5 * b));
        for (let r = Math.ceil(cy - SIDE * b); r <= Math.floor(cy + SIDE * b); r++) {
          const j = r - mid;
          if (j % 2 !== 0) continue;
          const half = 3 * (SIDE * b - Math.abs(r + 0.5 - cy)) - margin;
          const c0 = Math.ceil(cx - half - 0.5);
          const width = Math.floor(cx + half - 0.5) - c0 + 1;
          if (width < 12) continue;
          const short = hash2(j, 3, 7) < 0.3;
          const len = Math.round(
            width * (short ? 0.4 + 0.25 * hash2(j, 1, 7) : 0.84 + 0.16 * hash2(j, 2, 7))
          );
          for (let n = 0, w = 0; len - n >= 2; w++) {
            const run = Math.min(len - n, 3 + Math.floor(hash2(j, w, 11) * 8));
            /* the part of a word the plate above leaves in sight; under
               three cells of it would be a stray mark, and is not set */
            const seen: number[] = [];
            for (let k = 0; k < run; k++) {
              const c = c0 + n + k;
              if (inside(c, r) && lies(hits[at(c, r)], 1)) seen.push(c);
            }
            if (seen.length >= 3) for (const c of seen) put(c, r, "─", 1, 1);
            n += run + 1 + (hash2(j, w, 13) < 0.2 ? 1 : 0);
          }
        }
      }
    }
  }

  /* each workstream's name across the middle of its block, where it fits */
  let teamNamed = false;
  {
    const pf = plateFrame(f, pose, 0);
    const tiles = PLATES[0].features.filter((ft) => ft.kind === "tile");
    /* a tile's middle row is its widest: six columns a unit of its side */
    const room = Math.floor((tiles[0].box.x1 - tiles[0].box.x0) * 6 * b) - 3;
    const names = tiles.map((ft) => ft.label.replace(/^Creative /, "").toUpperCase());
    teamNamed = Math.max(...names.map((n) => n.length)) + 2 <= room;
    if (teamNamed)
      tiles.forEach((ft, i) => {
        const mid = project(
          pf,
          (ft.box.x0 + ft.box.x1) / 2,
          (ft.box.y0 + ft.box.y1) / 2,
          PLATES[0].top
        );
        const s = ` ${names[i]} `;
        const c0 = Math.round(mid[0] - s.length / 2);
        const r = Math.floor(mid[1]);
        for (let n = 0; n < s.length; n++) {
          const h = inside(c0 + n, r) ? hits[at(c0 + n, r)] : null;
          if (h && h.plate === 0 && h.face === "top") put(c0 + n, r, s[n], 0, 2);
        }
      });
    else if (spare)
      /* spare, too small to name them here: a cross where each one is, and
         their names in the list beside the plate */
      for (const ft of tiles) {
        const mid = project(
          pf,
          (ft.box.x0 + ft.box.x1) / 2,
          (ft.box.y0 + ft.box.y1) / 2,
          PLATES[0].top
        );
        const [c, r] = [Math.floor(mid[0]), Math.floor(mid[1])];
        const h = inside(c, r) ? hits[at(c, r)] : null;
        if (h && h.plate === 0 && h.face === "top") put(c, r, "+", 0, 2);
      }
  }

  /* -- the agents' board: its rim and its traces, in box-drawing -------- */

  let toolsNamed = false;
  {
    const pf = plateFrame(f, pose, 2);
    const plate = PLATES[2];
    const z = plate.body[0].z1;
    const lay = (pts: readonly Pt[], closed: boolean, level: Level, onBoard: boolean) => {
      const cells = cellsAlong(
        pts.map(([x, y]) => project(pf, x, y, z)),
        closed
      );
      cells.forEach((cur, i) => {
        const prev = i > 0 ? cells[i - 1] : closed ? cells[cells.length - 1] : null;
        const next = i < cells.length - 1 ? cells[i + 1] : closed ? cells[0] : null;
        const [c, r] = cur;
        if (!inside(c, r)) return;
        const h = hits[at(c, r)];
        if (h && h.plate !== 2) return;
        if (onBoard) {
          if (!h || h.face !== "top" || featureAt(plate, h.x, h.y)) return;
        } else if (h && h.face !== "top" && !spare) return;
        /* (spare leaves the board's wall bare, so its rim may stand on it:
           the near edges run whole) */
        put(c, r, joint(prev, cur, next), 2, level);
      });
    };
    lay(
      [
        [0, 0],
        [SIDE, 0],
        [SIDE, SIDE],
        [0, SIDE],
      ],
      true,
      spare ? 0 : 1,
      false
    );
    for (const tr of plate.traces) lay(tr.pts, false, spare ? 0 : 1, true);

    if (written || spare) {
      /* the chip and the four modules as ruled frames, each tool's name
         inside where every one of them fits, else two letters of it */
      const parts = plate.features.filter((ft) => ft.kind === "chip" || ft.kind === "module");
      for (const ft of parts) {
        const { x0, x1, y0, y1 } = ft.box;
        lay(
          [
            [x0, y0],
            [x1, y0],
            [x1, y1],
            [x0, y1],
          ],
          true,
          ft.kind === "chip" ? 2 : 1,
          false
        );
      }
      /* a square's row `dy` rows off its middle is this many cells wide,
         less its frame and a space either side */
      const roomAt = (ft: Feature, dy: number) =>
        Math.floor(2 * ((ft.box.x1 - ft.box.x0) * 3 * b - 3 * Math.abs(dy))) - 4;
      const linesOf = (ft: Feature) => ft.label.split(" ");
      const rowOf = (n: number, of: number) => Math.floor(n - (of - 1) / 2);
      const named = parts.every((ft) => {
        const words = linesOf(ft);
        return words.every((w, n) => w.length <= roomAt(ft, rowOf(n, words.length)));
      });
      toolsNamed = named;
      for (const ft of parts) {
        /* short of room, two letters each: a name's first two, or the
           initials of a name of two words, so no two frames read alike */
        const words = named
          ? linesOf(ft).map((w) => w.toUpperCase())
          : [
              (linesOf(ft).length > 1
                ? linesOf(ft)
                    .map((w) => w[0])
                    .join("")
                : ft.label.slice(0, 2)
              ).toUpperCase(),
            ];
        const mid = project(pf, (ft.box.x0 + ft.box.x1) / 2, (ft.box.y0 + ft.box.y1) / 2, z);
        /* where each letter would sit, with a clear cell either end; a name
           half hidden behind the layer, or run up against it, is not set */
        const cells = words.flatMap((w, n) => {
          const r = Math.floor(mid[1]) + rowOf(n, words.length);
          const c0 = Math.round(mid[0] - w.length / 2);
          return [...` ${w} `].map((g, i) => ({ c: c0 - 1 + i, r, g }));
        });
        const shows = cells.every(({ c, r }) => {
          const h = inside(c, r) ? hits[at(c, r)] : null;
          return !!h && h.plate === 2 && h.face === "top" && featureAt(plate, h.x, h.y) === ft;
        });
        if (shows)
          for (const { c, r, g } of cells)
            if (g !== " ") put(c, r, g, 2, ft.kind === "chip" ? 2 : 1);
      }
    }
  }

  /* -- what crosses the gaps: a dotted column from plate to plate -------- */

  if (spare) {
    /* two of them, plumb under the plates' outer corners: one stack */
    const edges = [Math.round(ox - SIDE * 3 * b), Math.round(ox + SIDE * 3 * b) - 1];
    for (const i of [0, 1] as const) {
      const under = PLATES[i + 1];
      const from = Math.floor(project(plateFrame(f, pose, i), 0, SIDE, 0)[1]) + 1;
      const to = Math.floor(
        project(
          plateFrame(f, pose, (i + 1) as 1 | 2),
          0,
          SIDE,
          under.body[under.body.length - 1].z1
        )[1]
      );
      for (let r = from; r < to; r++)
        for (const c of edges)
          if (inside(c, r) && !hits[at(c, r)] && ch[at(c, r)] === " ") put(c, r, ":", i, 0);
    }
  } else {
    const every = Math.max(4, Math.round(6 * b));
    for (let c = Math.max(0, Math.floor(box.x0)); c <= Math.min(cols - 1, Math.ceil(box.x1)); c++) {
      if ((((c - ox) % every) + every) % every !== 0) continue;
      let above = -1;
      let gap: number[] = [];
      for (let r = 0; r < rows; r++) {
        const h = hits[at(c, r)];
        if (!h) {
          if (above >= 0) gap.push(r);
          continue;
        }
        if (above >= 0 && h.plate === above + 1 && gap.length > 1)
          for (const g of gap.slice(1, -1)) put(c, g, ":", above as Tone, 0);
        above = h.plate;
        gap = [];
      }
    }
  }

  /* -- the ladder: each plate's floor, at its true height ---------------- */

  const floors = [0, 1, 2].map((i) =>
    Math.floor(project(plateFrame(f, pose, i as 0 | 1 | 2), 0, SIDE, 0)[1])
  );
  if (!spare) {
    const corner = Math.round(ox - SIDE * 3 * b);
    const lc = corner - 5;
    /* a rung every unit of height, where a unit is a whole number of rows */
    const rung = 2 * b;
    for (let r = floors[0]; r <= floors[2]; r++)
      put(lc, r, Number.isInteger(rung) && (r - floors[1]) % rung === 0 ? "┤" : "│", 2, 0);
    floors.forEach((r, i) => {
      put(lc, r, "├", 2, 1);
      for (let c = lc + 1; c < corner - 1; c++) put(c, r, "─", i as Tone, 0);
      const lift = truth.lift[i];
      const s = `${lift > 0 ? "+" : lift < 0 ? "-" : " "}${Math.abs(lift).toFixed(2)} u`;
      type(lc - 1 - s.length, r, s, i as Tone, 1);
    });
  }

  /* -- a typed line a plate, level with it, and what it holds ------------ */

  {
    const corner = Math.round(ox + SIDE * 3 * b);
    const col = corner + 9;
    const pitchRows = floors[1] - floors[0];
    const longest = Math.max(...PLATES.map((p) => p.holds.length));
    const lists = pitchRows - 1 >= 1 + longest && floors[2] + longest + 1 < rows;
    /* spare: what a plate holds is set once. The team's and the agents' are
       on the plates, so they are listed only when they did not fit there */
    const onPlate = [teamNamed, false, toolsNamed];
    PLATES.forEach((plate, i) => {
      const tone = i as Tone;
      const r = floors[i];
      for (let c = corner + 2; c < col - 1; c++) put(c, r, "─", tone, 0);
      let c = col;
      type(c, r, plate.n, tone, 2);
      c += plate.n.length + 1;
      type(c, r, plate.step.toUpperCase(), tone, 2);
      c += plate.step.length + 2;
      type(c, r, plate.name, tone, 1);
      c += plate.name.length + 2;
      if (!spare) type(c, r, String(plate.holds.length), tone, 2);
      if (lists && !(spare && onPlate[i]))
        plate.holds.forEach((held, n) => {
          type(col + 3, r + 1 + n, n === plate.holds.length - 1 ? "└" : "├", tone, 0);
          type(col + 5, r + 1 + n, held, tone, 1);
        });
    });
  }

  /* -- the facts, typed: every one of them true --------------------------- */

  /* beside the ladder's head, level with the top of the opened stack */
  const fc = Math.max(2, Math.round(ox - SIDE * 3 * b) - 5 - 27);
  const fr = Math.max(1, Math.round(stackBounds(f, onRows(poseAt(1), b)).y0));
  let cursor: [number, number] = [fc, fr];
  {
    const facts = factsOf(truth);
    const lines: [string, string][] = spare
      ? [["OPEN", `${facts.openPct} %`]]
      : [
          ["STACK", `${facts.plates} plates  ${facts.side} x ${facts.side}`],
          ["OPEN", `${facts.openPct} %`],
          ["PITCH", `${facts.pitch.toFixed(2)} u`],
          ["HEIGHT", `${facts.height.toFixed(2)} u`],
          ["GRID", `${cols} x ${rows}`],
        ];
    lines.forEach(([k, v], n) => {
      type(fc, fr + n, k, 2, 0);
      type(fc + 8, fr + n, v, 2, 1);
    });
    /* the count of lit cells includes its own digits */
    const row = fr + lines.length;
    type(fc, row, "GLYPHS", 2, 0);
    let lit = 0;
    for (let i = 0; i < st.length; i++) if (st[i]) lit++;
    let total = lit + 1;
    for (let d = 1; d <= 7; d++)
      if (String(lit + d + 1).length === d) {
        total = lit + d + 1;
        break;
      }
    type(fc + 8, row, String(total), 2, 1);
    cursor = [fc, row + 2];
  }
  /* the cursor is the one cell that may blink; it counts as lit */
  ch[at(cursor[0], cursor[1])] = setting === "blocks" ? "█" : "_";
  st[at(cursor[0], cursor[1])] = 255;

  /* -- runs of one style a row ------------------------------------------- */

  const lines: Run[][] = [];
  for (let r = 0; r < rows; r++) {
    const runs: Run[] = [];
    let c = 0;
    let end = cols;
    while (end > 0 && st[at(end - 1, r)] === 0) end--;
    while (c < end) {
      const s = st[at(c, r)];
      let e = c + 1;
      while (e < end && st[at(e, r)] === s) e++;
      runs.push({
        cls:
          s === 0
            ? ""
            : s === 255
              ? "sfx-cursor"
              : `sfx-${s > 9 ? "b" : "t"}${Math.floor(((s - 1) % 9) / 3)}${(s - 1) % 3}`,
        text: ch.slice(at(c, r), at(e, r)).join(""),
      });
      c = e;
    }
    lines.push(runs);
  }
  return { cols, rows, lines };
}
