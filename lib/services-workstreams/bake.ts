/**
 * The workstream cards' FACE BAKES (2026-10-08, `/test/services-workstreams`).
 *
 * Each is a `CardFaceBaker` for `ServicesCardRing`'s lab seam: a canvas at
 * `bakeSize(scale)`, drawn in the 840×1360 bake space under `ctx.scale`, on
 * the ring's own `FacePalette` so both themes come out of one drawing. The
 * frame is the TIGHT slab's (BL cut only, the shell open on the right where
 * the slab glint draws the silhouette), and the chit stays top-right — the
 * open affordance, which on this lab opens the evidence deck.
 *
 * THREE DIRECTIONS, AND THEY DIFFER IN WHAT IS DRAWN (the face lab's rule):
 *   ladder    the workstream's work, client by client, on the run-mode axis
 *             (an agent · a tool · a prompt · by hand) — the PDA estate's
 *             reading, one card per workstream
 *   run       one worked run: the ask, the skill, its steps, the gate (the
 *             person, green), the eval held n of m
 *   specimen  the real output, with its verdicts (kept / sent back)
 * The intelligence configuration is the whole section, never a card: the
 * masthead names it and these are its three workstreams.
 *
 * Gold is wayfinding, green is the person and nothing else (ADR-070 U11).
 * Type goes through the four tracking rungs and the weight ceiling
 * (`ringType.ts`, ADR-092): sans for names and sentences, mono for chrome.
 */

import {
  BAKE_H,
  BAKE_W,
  bakeSize,
} from "@/components/landing/home-v2/services/hologram/ringCtaBox";
import type { CardFaceBaker } from "@/components/landing/home-v2/services/hologram/ServicesCardRing";
import { BAKE_CH, loadImage, type FacePalette } from "@/lib/services-ring/portraitBake";
import {
  TRACK_DISPLAY,
  TRACK_EYEBROW,
  TRACK_LABEL,
  WEIGHT_LIT,
  WEIGHT_TEXT,
  setBakeType,
} from "@/lib/services-ring/ringType";

import { workstreamForSlot } from "./plates";
import {
  CLIENT_NAME,
  RUN_MODE_LABEL,
  type RunMode,
  type WorkEntry,
  type Workstream,
} from "./record";

export type WorkstreamFace = "ladder" | "run" | "specimen";
export const WORKSTREAM_FACES: readonly WorkstreamFace[] = ["ladder", "run", "specimen"];

type Theme = "dark" | "light";

/* ── Geometry (bake px) ─────────────────────────────────────────────── */

const PAD = 52;
const MAX_W = BAKE_W - PAD * 2;
const CHIT = 56;
const CHIT_INSET = 34;
const CHIT_X0 = BAKE_W - CHIT_INSET - CHIT;
/** The viz band: under the header, over the paragraph. */
const BAND_TOP = 272;
const LEDE_BOTTOM = BAKE_H - 72;
const LEDE_PX = 32;
const LEDE_LH = 44;

/* ── Inks a palette does not carry ──────────────────────────────────── */

/** Gold as TEXT: raw gold letters at 1.68:1 on parchment, so light takes the
 *  ramp's ink rung (`--gold-ink`, theme.css). Marks keep `pal.gold`. */
const goldInk = (t: Theme) => (t === "light" ? "#6e5216" : "#caa554");
/** Gold as LINE WORK (`--gold-line`). */
const goldLine = (t: Theme, a: number) =>
  t === "light" ? `rgba(138, 107, 32, ${a})` : `rgba(202, 165, 84, ${a})`;
/** The person — `--atreides-ink` / `--atreides-light`, both themes. */
const green = (t: Theme, a = 1) =>
  t === "light" ? `rgba(63, 90, 46, ${a})` : `rgba(122, 158, 106, ${a})`;

/* ── Type ───────────────────────────────────────────────────────────── */

type Ctx = CanvasRenderingContext2D;

const mono = (ctx: Ctx, px: number, track = TRACK_LABEL) =>
  setBakeType(ctx, { family: "mono", px, track, weight: WEIGHT_TEXT });
const sans = (ctx: Ctx, px: number, weight = WEIGHT_TEXT) =>
  setBakeType(ctx, { family: "sans", px, weight, track: 0 });
const display = (ctx: Ctx, px: number) =>
  setBakeType(ctx, { family: "sans", px, weight: WEIGHT_LIT, track: TRACK_DISPLAY });

/** Greedy word wrap against the context's current font. */
function wrap(ctx: Ctx, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width <= maxW || !line) line = next;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Wrap and clamp to `max` lines, an ellipsis on the last if cut. */
function wrapClamp(ctx: Ctx, text: string, maxW: number, max: number): string[] {
  const lines = wrap(ctx, text, maxW);
  if (lines.length <= max) return lines;
  const kept = lines.slice(0, max);
  let last = kept[max - 1];
  while (last.length > 1 && ctx.measureText(`${last}…`).width > maxW) last = last.slice(0, -1);
  kept[max - 1] = `${last.trimEnd()}…`;
  return kept;
}

function diamond(ctx: Ctx, x: number, y: number, r: number, fill: string) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r, y);
  ctx.closePath();
  ctx.fill();
}

/** A box with the TR + BL chamfer pair (ADR-065's lawful diagonal). */
function chamferBox(ctx: Ctx, x: number, y: number, w: number, h: number, c: number) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w - c, y);
  ctx.lineTo(x + w, y + c);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + c, y + h);
  ctx.lineTo(x, y + h - c);
  ctx.closePath();
}

/* ── The canvas and the frame ───────────────────────────────────────── */

function canvasFor(scale: number): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const { w, h } = bakeSize(scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("services-workstreams: no 2d context");
  ctx.scale(scale, scale);
  return { canvas, ctx };
}

/** Ground, the BL cut and the tight shell (open on the right). The ground
 *  goes first; the chrome is drawn LAST, over the drawing, by `frameChrome`. */
function frameGround(ctx: Ctx, pal: FacePalette) {
  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, 0, BAKE_W, BAKE_H);
}

function frameChrome(ctx: Ctx, pal: FacePalette) {
  ctx.fillStyle = pal.ground;
  ctx.beginPath();
  ctx.moveTo(0, BAKE_H - BAKE_CH);
  ctx.lineTo(BAKE_CH, BAKE_H);
  ctx.lineTo(0, BAKE_H);
  ctx.closePath();
  ctx.fill();

  const shell = ctx.createLinearGradient(0, 0, BAKE_W * 0.25, BAKE_H);
  shell.addColorStop(0, pal.goldA(0.52));
  shell.addColorStop(0.38, pal.washA(0.14));
  shell.addColorStop(0.66, pal.goldA(0.16));
  shell.addColorStop(1, pal.goldA(0.48));
  ctx.strokeStyle = shell;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(BAKE_W - 1.5, 1.5);
  ctx.lineTo(1.5, 1.5);
  ctx.lineTo(1.5, BAKE_H - BAKE_CH);
  ctx.lineTo(BAKE_CH, BAKE_H - 1.5);
  ctx.lineTo(BAKE_W - 1.5, BAKE_H - 1.5);
  ctx.stroke();

  ctx.strokeStyle = pal.goldA(0.85);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(1.5, BAKE_H - BAKE_CH);
  ctx.lineTo(BAKE_CH, BAKE_H - 1.5);
  ctx.stroke();

  // The chit: the open affordance, the drawer's close chit's corner and size.
  ctx.strokeStyle = pal.goldA(0.55);
  ctx.lineWidth = 2;
  ctx.strokeRect(CHIT_X0, CHIT_INSET, CHIT, CHIT);
  const cx = CHIT_X0 + CHIT / 2;
  const cy = CHIT_INSET + CHIT / 2;
  ctx.strokeStyle = pal.gold;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy);
  ctx.lineTo(cx + 10, cy);
  ctx.moveTo(cx, cy - 10);
  ctx.lineTo(cx, cy + 10);
  ctx.stroke();
}

/** The header: a mono kicker on the chit's centre line, the name under it. */
function header(ctx: Ctx, pal: FacePalette, t: Theme, kicker: string, name: string) {
  const chitCY = CHIT_INSET + CHIT / 2;
  mono(ctx, 22, TRACK_EYEBROW);
  ctx.textBaseline = "middle";
  diamond(ctx, PAD + 6, chitCY, 6, pal.gold);
  ctx.fillStyle = goldInk(t);
  ctx.fillText(kicker.toUpperCase(), PAD + 26, chitCY + 1);
  ctx.textBaseline = "alphabetic";

  display(ctx, 64);
  const lines = wrapClamp(ctx, name, CHIT_X0 - 24 - PAD, 2);
  ctx.fillStyle = pal.ink(1);
  lines.forEach((line, i) => ctx.fillText(line, PAD, 172 + i * 68));
}

/** The paragraph on the bottom margin. Returns its top. */
function lede(ctx: Ctx, pal: FacePalette, text: string) {
  sans(ctx, LEDE_PX);
  const lines = wrapClamp(ctx, text, MAX_W, 3);
  ctx.fillStyle = pal.ink(0.82);
  lines.forEach((line, i) =>
    ctx.fillText(line, PAD, LEDE_BOTTOM - (lines.length - 1 - i) * LEDE_LH)
  );
  return LEDE_BOTTOM - (lines.length - 1) * LEDE_LH - LEDE_PX;
}

/* ── A · THE LADDER ─────────────────────────────────────────────────── */

/** Top to bottom: the rung that runs longest without a person first, the
 *  person's own work last — on its own floor, in green. */
const LADDER: readonly RunMode[] = ["agent", "tool", "prompt", "hand"];
const PER_LANE = 3;

function drawLadder(ctx: Ctx, pal: FacePalette, t: Theme, ws: Workstream, bottom: number) {
  const top = BAND_TOP + 8;
  const gap = 14;
  const cardW = (MAX_W - gap * (PER_LANE - 1)) / PER_LANE;
  const lit = ws.entries.find((e) => e.runMode !== "hand") ?? null;
  const LABEL_H = 40;
  const LANE_GAP = 22;
  const ROW_MIN = 118;
  const ROW_MAX = 168;

  /* A rung with no work is ONE line, not an empty box: the negative space is
     read off the label (ADR-062 keeps person-led work on every sheet for the
     same reason), and the height goes to the rungs that hold work. */
  const lanes = LADDER.map((mode) => {
    const entries = ws.entries.filter((e) => e.runMode === mode);
    return {
      mode,
      entries,
      rows: entries.length ? Math.min(2, Math.ceil(entries.length / PER_LANE)) : 0,
    };
  });
  const fixed = lanes.length * LABEL_H + (lanes.length - 1) * LANE_GAP;
  const avail = bottom - top - fixed;
  let totalRows = lanes.reduce((n, l) => n + l.rows, 0);
  // Two-row rungs fall back to one until the rows clear their floor.
  while (totalRows > 0 && avail / totalRows < ROW_MIN) {
    const two = lanes.find((l) => l.rows === 2);
    if (!two) break;
    two.rows = 1;
    totalRows--;
  }
  const rowH = totalRows
    ? Math.min(
        ROW_MAX,
        (avail - (totalRows - lanes.filter((l) => l.rows).length) * gap) / totalRows
      )
    : 0;

  let y = top;
  lanes.forEach(({ mode, entries, rows }) => {
    const human = mode === "hand";
    mono(ctx, 19, TRACK_EYEBROW);
    ctx.fillStyle = human ? green(t) : pal.ink(entries.length ? 0.62 : 0.38);
    const label = RUN_MODE_LABEL[mode].toUpperCase();
    ctx.fillText(label, PAD, y + 22);
    const lw = ctx.measureText(label).width;
    mono(ctx, 17, TRACK_LABEL);
    ctx.fillStyle = pal.ink(entries.length ? 0.4 : 0.32);
    ctx.textAlign = "right";
    const tag = entries.length ? String(entries.length).padStart(2, "0") : "NOT YET";
    ctx.fillText(tag, PAD + MAX_W, y + 22);
    const tw = ctx.measureText(tag).width;
    ctx.textAlign = "left";
    ctx.strokeStyle = human ? green(t, 0.45) : pal.washA(entries.length ? 0.16 : 0.1);
    ctx.lineWidth = 1.5;
    if (!entries.length) ctx.setLineDash([4, 8]);
    ctx.beginPath();
    ctx.moveTo(PAD + lw + 16, y + 15);
    ctx.lineTo(PAD + MAX_W - tw - 16, y + 15);
    ctx.stroke();
    ctx.setLineDash([]);
    y += LABEL_H;

    if (!rows) {
      y += LANE_GAP;
      return;
    }
    const slots = rows * PER_LANE;
    const overflow = entries.length > slots;
    const shown = overflow ? entries.slice(0, slots - 1) : entries;
    shown.forEach((e, i) => {
      const cx = PAD + (i % PER_LANE) * (cardW + gap);
      const cy = y + Math.floor(i / PER_LANE) * (rowH + gap);
      cartridge(ctx, pal, t, e, cx, cy, cardW, rowH, e === lit);
    });
    if (overflow) {
      const i = slots - 1;
      const x = PAD + (i % PER_LANE) * (cardW + gap);
      const cy = y + Math.floor(i / PER_LANE) * (rowH + gap);
      ctx.strokeStyle = pal.washA(0.22);
      ctx.lineWidth = 1.5;
      chamferBox(ctx, x, cy, cardW, rowH, 14);
      ctx.stroke();
      const rest = entries.slice(slots - 1);
      display(ctx, 44);
      ctx.fillStyle = pal.ink(0.9);
      ctx.fillText(`+${rest.length}`, x + 18, cy + 58);
      mono(ctx, 16, TRACK_LABEL);
      ctx.fillStyle = pal.ink(0.5);
      const who = [...new Set(rest.map((e) => CLIENT_NAME[e.client].toUpperCase()))].join(" · ");
      wrapClamp(ctx, who, cardW - 36, 2).forEach((l, j) =>
        ctx.fillText(l, x + 18, cy + 92 + j * 22)
      );
    }
    y += rows * rowH + (rows - 1) * gap + LANE_GAP;
  });
}

function cartridge(
  ctx: Ctx,
  pal: FacePalette,
  t: Theme,
  e: WorkEntry,
  x: number,
  y: number,
  w: number,
  h: number,
  lit: boolean
) {
  const human = e.runMode === "hand";
  chamferBox(ctx, x, y, w, h, 14);
  ctx.fillStyle = lit ? goldLine(t, 0.1) : pal.washA(0.035);
  ctx.fill();
  ctx.strokeStyle = human ? green(t, 0.6) : lit ? goldLine(t, 0.9) : pal.washA(0.24);
  ctx.lineWidth = lit ? 2.5 : 1.5;
  ctx.stroke();

  mono(ctx, 17, TRACK_EYEBROW);
  ctx.fillStyle = human ? green(t) : goldInk(t);
  ctx.fillText(CLIENT_NAME[e.client].toUpperCase(), x + 18, y + 32);

  sans(ctx, 25, WEIGHT_LIT);
  ctx.fillStyle = pal.ink(0.94);
  wrapClamp(ctx, e.title, w - 34, h >= 140 ? 2 : 1).forEach((l, j) =>
    ctx.fillText(l, x + 18, y + 68 + j * 30)
  );

  mono(ctx, 15, TRACK_LABEL);
  ctx.fillStyle = pal.ink(0.48);
  const foot = (e.skill ?? "by hand").toUpperCase();
  ctx.fillText(wrapClamp(ctx, foot, w - 34, 1)[0], x + 18, y + h - 16);
}

/* ── B · THE RUN ────────────────────────────────────────────────────── */

function drawRun(ctx: Ctx, pal: FacePalette, t: Theme, ws: Workstream, bottom: number) {
  const run = ws.run;
  let y = BAND_TOP + 22;

  mono(ctx, 19, TRACK_EYEBROW);
  ctx.fillStyle = pal.ink(0.55);
  ctx.fillText(`THE ASK · ${CLIENT_NAME[run.client].toUpperCase()}`, PAD, y);
  y += 44;
  sans(ctx, 32);
  ctx.fillStyle = pal.ink(0.96);
  const ask = wrapClamp(ctx, `“${run.ask}”`, MAX_W, 3);
  ask.forEach((l, i) => ctx.fillText(l, PAD, y + i * 42));
  y += (ask.length - 1) * 42 + 40;

  // The skill: one outlined plate, its companions beside it.
  mono(ctx, 22, TRACK_LABEL);
  const sk = run.skill;
  const skW = ctx.measureText(sk).width + 40;
  ctx.strokeStyle = goldLine(t, 0.85);
  ctx.lineWidth = 2;
  ctx.strokeRect(PAD, y, skW, 48);
  ctx.fillStyle = goldInk(t);
  ctx.fillText(sk, PAD + 20, y + 32);
  if (run.also.length) {
    mono(ctx, 18, TRACK_LABEL);
    ctx.fillStyle = pal.ink(0.5);
    ctx.fillText(
      wrapClamp(ctx, `+ ${run.also.join(" · ")}`, MAX_W - skW - 24, 1)[0],
      PAD + skW + 20,
      y + 31
    );
  }
  y += 48;

  // The gate and the eval are seated on the band's floor; the steps take
  // what is left between, as many as fit.
  const evalH = run.evalCase ? 64 : 0;
  const gateH = 132;
  const gateY = bottom - evalH - gateH - 18;

  const spineX = PAD + 12;
  let sy = y + 40;
  sans(ctx, 24);
  const stepLh = 32;
  let drawn = 0;
  const stepsTop = sy - 24;
  for (const step of run.steps) {
    const lines = wrapClamp(ctx, step, MAX_W - 48, 2);
    const need = lines.length * stepLh + 14;
    if (sy + need > gateY - 18) break;
    diamond(ctx, spineX, sy - 8, 7, drawn === 0 ? pal.gold : pal.goldA(0.6));
    ctx.fillStyle = pal.ink(0.82);
    lines.forEach((l, i) => ctx.fillText(l, PAD + 40, sy + i * stepLh));
    sy += need;
    drawn++;
  }
  ctx.strokeStyle = pal.goldA(0.3);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(spineX, stepsTop);
  ctx.lineTo(spineX, gateY);
  ctx.stroke();

  // The gate — the person, the one green object.
  ctx.fillStyle = green(t, t === "light" ? 0.1 : 0.14);
  ctx.fillRect(PAD, gateY, MAX_W, gateH);
  ctx.fillStyle = green(t);
  ctx.fillRect(PAD, gateY, 4, gateH);
  mono(ctx, 18, TRACK_EYEBROW);
  ctx.fillStyle = green(t);
  ctx.fillText("THE GATE", PAD + 26, gateY + 34);
  sans(ctx, 28, WEIGHT_LIT);
  ctx.fillStyle = pal.ink(1);
  ctx.fillText(run.gate.who, PAD + 26, gateY + 72);
  sans(ctx, 21);
  ctx.fillStyle = pal.ink(0.7);
  ctx.fillText(wrapClamp(ctx, run.gate.line, MAX_W - 52, 1)[0], PAD + 26, gateY + 108);

  if (run.evalCase) {
    const ey = gateY + gateH + 18;
    const c = run.evalCase;
    mono(ctx, 18, TRACK_EYEBROW);
    ctx.fillStyle = pal.ink(0.55);
    ctx.fillText("EVAL", PAD, ey + 30);
    mono(ctx, 18, TRACK_LABEL);
    ctx.fillStyle = pal.ink(0.8);
    const name = wrapClamp(ctx, c.name, 360, 1)[0];
    ctx.fillText(name, PAD + 84, ey + 30);
    pips(ctx, pal, t, c.with, PAD + MAX_W, ey + 22, true);
    if (c.without) pips(ctx, pal, t, c.without, PAD + MAX_W, ey + 52, false);
  }
}

/** "2 of 3" as filled and open pips, right-aligned at `xr`. */
function pips(
  ctx: Ctx,
  pal: FacePalette,
  t: Theme,
  score: string | undefined,
  xr: number,
  y: number,
  withSkill: boolean
) {
  const m = score?.match(/(\d+)\s+of\s+(\d+)/);
  if (!m) return;
  const got = Number(m[1]);
  const of = Number(m[2]);
  mono(ctx, 15, TRACK_LABEL);
  const tag = withSkill ? "WITH THE SKILL" : "WITHOUT";
  ctx.fillStyle = pal.ink(withSkill ? 0.6 : 0.4);
  ctx.textAlign = "right";
  ctx.fillText(tag, xr - of * 26 - 10, y + 5);
  ctx.textAlign = "left";
  for (let i = 0; i < of; i++) {
    const cx = xr - (of - i) * 26 + 10;
    ctx.beginPath();
    ctx.rect(cx - 7, y - 7, 14, 14);
    if (i < got) {
      ctx.fillStyle = withSkill ? pal.gold : pal.ink(0.45);
      ctx.fill();
    } else {
      ctx.strokeStyle = withSkill ? goldLine(t, 0.6) : pal.ink(0.3);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

/* ── C · THE SPECIMEN ───────────────────────────────────────────────── */

const imageCache = new Map<string, Promise<HTMLImageElement | null>>();
function image(src: string) {
  let p = imageCache.get(src);
  if (!p) {
    p = loadImage(src).catch(() => null);
    imageCache.set(src, p);
  }
  return p;
}

async function drawSpecimen(ctx: Ctx, pal: FacePalette, t: Theme, ws: Workstream, bottom: number) {
  const sp = ws.specimen;
  // Prefer the frames that carry a verdict: the reading IS the verdict.
  const ranked = [...sp.frames].sort((a, b) => Number(!!b.verdict) - Number(!!a.verdict));
  const frames = ranked.slice(0, 4);
  const imgs = await Promise.all(frames.map((f) => image(f.src)));

  const top = BAND_TOP + 4;
  const capH = 40;
  const gridBottom = bottom - capH - 12;
  const gap = 12;
  const cols = 2;
  const rows = Math.ceil(frames.length / cols);
  const cw = (MAX_W - gap) / cols;
  const chh = (gridBottom - top - gap * (rows - 1)) / rows;

  frames.forEach((f, i) => {
    const x = PAD + (i % cols) * (cw + gap);
    const y = top + Math.floor(i / cols) * (chh + gap);
    const img = imgs[i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, cw, chh);
    ctx.clip();
    ctx.fillStyle = pal.washA(0.06);
    ctx.fillRect(x, y, cw, chh);
    if (img) {
      const s = Math.max(cw / img.naturalWidth, chh / img.naturalHeight);
      const dw = img.naturalWidth * s;
      const dh = img.naturalHeight * s;
      ctx.drawImage(img, x + (cw - dw) / 2, y + (chh - dh) / 2, dw, dh);
    }
    // A foot scrim for the label, the ground's own colour.
    const g = ctx.createLinearGradient(0, y + chh - 90, 0, y + chh);
    g.addColorStop(0, `rgba(${pal.scrimRgb}, 0)`);
    g.addColorStop(1, `rgba(${pal.scrimRgb}, 0.88)`);
    ctx.fillStyle = g;
    ctx.fillRect(x, y + chh - 90, cw, 90);
    ctx.restore();

    ctx.strokeStyle =
      f.verdict === "kept" ? green(t, 0.8) : f.verdict ? goldLine(t, 0.8) : pal.washA(0.25);
    ctx.lineWidth = f.verdict ? 2.5 : 1.5;
    ctx.strokeRect(x, y, cw, chh);

    if (f.verdict) {
      mono(ctx, 16, TRACK_EYEBROW);
      const v = f.verdict === "kept" ? "KEPT" : "SENT BACK";
      const vw = ctx.measureText(v).width + 24;
      ctx.fillStyle = f.verdict === "kept" ? green(t) : pal.chipFill;
      ctx.fillRect(x + 12, y + 12, vw, 34);
      ctx.fillStyle = f.verdict === "kept" ? pal.ground : pal.chipInk;
      ctx.fillText(v, x + 24, y + 35);
    }
    sans(ctx, 19);
    ctx.fillStyle = pal.ink(0.9);
    const label = f.label.replace(/^(Kept|Sent back) · /, "");
    ctx.fillText(wrapClamp(ctx, label, cw - 28, 1)[0], x + 14, y + chh - 16);
  });

  mono(ctx, 18, TRACK_EYEBROW);
  ctx.fillStyle = goldInk(t);
  ctx.fillText(
    wrapClamp(ctx, `${CLIENT_NAME[sp.client]} · ${sp.caption}`.toUpperCase(), MAX_W, 1)[0],
    PAD,
    bottom - 14
  );
}

/* ── The bakers ─────────────────────────────────────────────────────── */

const KICKER: Record<WorkstreamFace, string> = {
  ladder: "Workstream · the work",
  run: "Workstream · one run",
  specimen: "Workstream · the output",
};

function makeBaker(face: WorkstreamFace): CardFaceBaker {
  return async (plate, _index, { pal, scale, theme }) => {
    const t: Theme = theme === "light" ? "light" : "dark";
    const { canvas, ctx } = canvasFor(scale);
    frameGround(ctx, pal);
    const ws = workstreamForSlot(plate.id);
    /* The fourth slot carries no card (the ring hides it); its texture is the
       ground alone, never sampled on screen. */
    if (!ws) return canvas;
    const ledeTop = lede(ctx, pal, ws.line);
    const bandBottom = ledeTop - 44;
    header(ctx, pal, t, KICKER[face], ws.name);
    if (face === "ladder") drawLadder(ctx, pal, t, ws, bandBottom);
    else if (face === "run") drawRun(ctx, pal, t, ws, bandBottom);
    else await drawSpecimen(ctx, pal, t, ws, bandBottom);
    frameChrome(ctx, pal);
    return canvas;
  };
}

/** One baker per direction, MODULE CONSTANTS (the ring re-bakes on the
 *  baker's identity). */
export const WORKSTREAM_BAKERS: Readonly<Record<WorkstreamFace, CardFaceBaker>> = {
  ladder: makeBaker("ladder"),
  run: makeBaker("run"),
  specimen: makeBaker("specimen"),
};
