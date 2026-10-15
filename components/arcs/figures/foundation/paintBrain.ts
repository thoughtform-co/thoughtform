/**
 * The machine brain, painted (ADR-156 U9): once per pose into a layer, then
 * only its signals per frame. Glass is drawn as glass is lit: a faint body
 * with a highlight falling from the upper left, inner walls and swirls as
 * thin light, the outline brightest under its own halo, glints where the
 * light catches; the machine behind it in gold. On the void the light adds;
 * on parchment it lays down as ink.
 *
 * Canvas only, no DOM: a pure painter over `brain.ts`.
 */

import type { BrainModel, Pt } from "./brain";

export interface Place {
  /** The brain's centre in the viewBox, and viewBox units per brain unit. */
  x: number;
  y: number;
  s: number;
}

export interface Tone {
  ink: string;
  gold: string;
  lit: string;
  green: string;
  red: string;
}

interface Paint {
  /** Device pixels per viewBox unit. */
  k: number;
  dpr: number;
  tone: Tone;
  light: boolean;
  /** 0 to 1: the left a crisp machine, the right loose particles. */
  split: number;
  /** Draw the hanging cables (off where the cords plug into the plates). */
  cables?: boolean;
  /** Draw the glass and the machine (off when the 3D brain draws them, and
      this painter keeps the block, the ports and the cables). */
  body?: boolean;
}

const at = (p: Pt, pl: Place, k: number) => ({
  x: (pl.x + p.x * pl.s) * k,
  y: (pl.y + p.y * pl.s) * k,
});

/** A port's place in the viewBox: a cable leaves here. */
export function portAt(m: BrainModel, pl: Place, i: number): Pt {
  const p = m.ports[i % m.ports.length];
  return { x: pl.x + p.x * pl.s, y: pl.y + p.y * pl.s };
}

/** A point on the brain's flank, in the viewBox: its left or right side,
    high, level or low. */
export function flankAt(pl: Place, side: -1 | 1, j: number): Pt {
  const ys = [-60, 0, 56];
  const xs = [204, 214, 202];
  return { x: pl.x + side * xs[j] * pl.s, y: pl.y + ys[j] * pl.s };
}

export function bakeBrain(ctx: CanvasRenderingContext2D, m: BrainModel, pl: Place, o: Paint) {
  const { k, dpr, tone, light, split } = o;
  const P = (p: Pt) => at(p, pl, k);
  const lw = (w: number) => Math.max(0.6, w * dpr * Math.min(1.4, pl.s * 1.4));
  const side = (p: Pt) => (p.x < 0 ? -1 : 1);
  const crisp = (p: Pt) => (side(p) < 0 ? split : 0);
  const loose = (p: Pt) => (side(p) > 0 ? split : 0);
  const path = (pts: Pt[], close = false) => {
    ctx.beginPath();
    pts.forEach((p, i) => {
      const q = P(p);
      if (i) ctx.lineTo(q.x, q.y);
      else ctx.moveTo(q.x, q.y);
    });
    if (close) ctx.closePath();
  };
  const stroke = (pts: Pt[], col: string, w: number, a: number, halo = 0) => {
    ctx.strokeStyle = col;
    if (halo && !light) {
      ctx.globalAlpha = a * 0.14;
      ctx.lineWidth = lw(w + halo);
      path(pts);
      ctx.stroke();
    }
    ctx.globalAlpha = a;
    ctx.lineWidth = lw(w);
    path(pts);
    ctx.stroke();
  };
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = light ? "source-over" : "lighter";
  const body = o.body !== false;

  if (body) {
    // 1. The glass's body: faint, lit from the upper left.
    for (const g of [...m.glass.map((x) => x.outline), ...m.pods.map((p) => p.outline)]) {
      const c = P({ x: g[0].x < 0 ? -150 : 70, y: -150 });
      const r = 300 * pl.s * k;
      const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
      grad.addColorStop(0, light ? "rgba(60, 46, 20, 0.07)" : "rgba(236, 228, 212, 0.085)");
      grad.addColorStop(1, light ? "rgba(60, 46, 20, 0.015)" : "rgba(236, 228, 212, 0.012)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = grad;
      path(g, true);
      ctx.fill();
    }

    // 2. The machine behind the glass: its fine back layer first, dim.
    ctx.strokeStyle = tone.gold;
    ctx.lineWidth = lw(0.6);
    ctx.globalAlpha = light ? 0.2 : 0.24;
    ctx.beginPath();
    for (const [a, b] of m.micro) {
      if (loose(a) > 0.5) continue;
      const s = P(a);
      const e = P(b);
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e.x, e.y);
    }
    ctx.stroke();
    ctx.fillStyle = tone.gold;
    for (const [, b] of m.micro) {
      if (loose(b) > 0.5) continue;
      const e = P(b);
      ctx.fillRect(e.x - dpr, e.y - dpr, 2 * dpr, 2 * dpr);
    }
    for (const b of m.boards) {
      const a = 1 - 0.5 * loose({ x: b.x + b.w / 2, y: 0 });
      const c = [
        { x: b.x, y: b.y },
        { x: b.x + b.w, y: b.y },
        { x: b.x + b.w, y: b.y + b.h },
        { x: b.x, y: b.y + b.h },
        { x: b.x, y: b.y },
      ];
      ctx.globalAlpha = (light ? 0.1 : 0.16) * a;
      ctx.fillStyle = tone.gold;
      path(c, true);
      ctx.fill();
      stroke(c, tone.gold, 1, 0.85 * a, 2.5);
      // The die inside the package, and its pins.
      const inset = Math.min(b.w, b.h) * 0.28;
      stroke(
        [
          { x: b.x + inset, y: b.y + inset },
          { x: b.x + b.w - inset, y: b.y + inset },
          { x: b.x + b.w - inset, y: b.y + b.h - inset },
          { x: b.x + inset, y: b.y + b.h - inset },
          { x: b.x + inset, y: b.y + inset },
        ],
        tone.lit,
        0.8,
        0.7 * a
      );
      ctx.strokeStyle = tone.gold;
      ctx.globalAlpha = 0.7 * a;
      ctx.lineWidth = lw(0.8);
      ctx.beginPath();
      for (const [p, q] of b.pins) {
        const s = P(p);
        const e = P(q);
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
      }
      ctx.stroke();
    }
    for (const t of m.traces) stroke(t, tone.gold, 0.9, 0.6 * (1 - 0.5 * loose(t[0])));
    for (const l of [...m.lenses, ...m.pods.map((p) => p.lens)]) {
      for (const r of l.r) {
        const pts: Pt[] = [];
        for (let j = 0; j <= 40; j++)
          pts.push({
            x: l.c.x + Math.cos((j / 40) * Math.PI * 2) * r,
            y: l.c.y + Math.sin((j / 40) * Math.PI * 2) * r,
          });
        stroke(
          pts,
          tone.lit,
          r === l.r[0] ? 1.1 : 0.8,
          0.9 * (1 - 0.4 * loose(l.c)),
          r === l.r[0] ? 2.5 : 0
        );
      }
    }
    for (const c of m.coils) {
      stroke(c.path, tone.ink, 5, light ? 0.12 : 0.1);
      ctx.strokeStyle = tone.ink;
      ctx.globalAlpha = 0.55 * (1 - 0.5 * loose(c.path[0]));
      ctx.lineWidth = lw(1);
      ctx.beginPath();
      for (const [p, q] of c.ribs) {
        const s = P(p);
        const e = P(q);
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(e.x, e.y);
      }
      ctx.stroke();
    }
    stroke(m.spine.left, tone.ink, 1, 0.6);
    stroke(m.spine.right, tone.ink, 1, 0.6);
    for (const r of m.spine.ribs) stroke(r, tone.lit, 1, 0.75);

    // 3. The glass: walls and swirls as thin light, the outline brightest.
    m.glass.forEach((g) => {
      const s = g.outline[0];
      const dim = 1 - 0.6 * loose(s);
      const goldish = crisp(s) > 0.5;
      const edge = goldish ? tone.lit : tone.ink;
      // A glass tube: its body a faint wide stroke, its two walls thin light,
      // a highlight running along its upper wall.
      for (const t of g.tubes) {
        stroke(t.path, edge, t.w, (light ? 0.05 : 0.06) * dim);
        const off = (d: number) =>
          t.path.map((p, i) => {
            const a = t.path[Math.max(0, i - 1)];
            const b = t.path[Math.min(t.path.length - 1, i + 1)];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const l = Math.hypot(dx, dy) || 1;
            return { x: p.x - (dy / l) * d, y: p.y + (dx / l) * d };
          });
        stroke(off(t.w / 2), edge, 0.9, 0.5 * dim, 3);
        stroke(off(-t.w / 2), edge, 1.1, 0.8 * dim, 3);
        // The highlight: a bright run along the upper wall, a glint at its peak.
        const hi = off(-t.w / 4);
        stroke(
          hi.slice(Math.floor(hi.length * 0.12), Math.floor(hi.length * 0.6)),
          tone.lit,
          1.6,
          0.9 * dim,
          5
        );
        stroke(
          hi.slice(Math.floor(hi.length * 0.3), Math.floor(hi.length * 0.38)),
          "#fff8e8",
          2.2,
          light ? 0 : 0.8 * dim,
          6
        );
      }
      for (const w of g.walls) stroke(w, edge, 1, 0.5 * dim, 3);
      stroke(g.outline, edge, 1.6, 0.95 * dim, 7);
      // The rim light: the outline thickened where the light falls, upper outer.
      const n = g.outline.length;
      const rim =
        g.outline[0].x < 0
          ? g.outline.slice(Math.floor(n * 0.08), Math.floor(n * 0.34))
          : g.outline.slice(Math.floor(n * 0.08), Math.floor(n * 0.34));
      stroke(rim, tone.lit, 2.4, 0.55 * dim, 8);
    });
    for (const p of m.pods) stroke(p.outline, tone.ink, 1.3, 0.85, 5);

    // 4. The texture: particles on the glass.
    for (const d of m.dust) {
      const l = loose(d);
      const q = P(d);
      ctx.globalAlpha = (0.5 + 0.4 * l) * (1 - 0.5 * crisp(d));
      ctx.fillStyle = l > 0.5 ? tone.green : tone.ink;
      const s = (1.1 + 0.9 * l) * dpr;
      ctx.fillRect(q.x - s / 2, q.y - s / 2, s, s);
    }
  }

  // 5. The block, the manifold and its ports.
  for (const r of m.block.rects) {
    const c = [
      { x: r.x, y: r.y },
      { x: r.x + r.w, y: r.y },
      { x: r.x + r.w, y: r.y + r.h },
      { x: r.x, y: r.y + r.h },
      { x: r.x, y: r.y },
    ];
    ctx.globalAlpha = light ? 0.06 : 0.1;
    ctx.fillStyle = tone.ink;
    path(c, true);
    ctx.fill();
    stroke(c, tone.ink, 1, 0.8, 2);
  }
  if (o.cables) {
    for (const c of m.cables) {
      // A cable fades as it hangs, into the ground.
      const top = P(c.path[0]);
      const end = P(c.path[c.path.length - 1]);
      const fade = ctx.createLinearGradient(0, top.y, 0, end.y);
      fade.addColorStop(0, tone.ink);
      fade.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.strokeStyle = fade;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = lw(c.w);
      path(c.path);
      ctx.stroke();
      for (const f of c.ferrules) {
        const i = Math.floor(f * (c.path.length - 1));
        const q = P(c.path[i]);
        const w = (c.w + 5) * pl.s * k;
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = tone.gold;
        ctx.fillRect(q.x - w / 2, q.y - 6 * pl.s * k, w, 12 * pl.s * k);
      }
    }
  }
  ctx.fillStyle = tone.lit;
  for (const p of m.ports) {
    const q = P(p);
    const s = 5 * dpr;
    ctx.globalAlpha = 1;
    ctx.fillRect(q.x - s / 2, q.y - s / 2, s, s);
  }

  // 6. Glints, where the light catches the glass at the upper left.
  if (body)
    m.glass.forEach((g, gi) => {
      const n = g.outline.length;
      const from = gi === 0 ? 0.08 : 0.92;
      const seg: Pt[] = [];
      for (let i = 0; i < 18; i++)
        seg.push(g.outline[Math.floor(((from + (gi === 0 ? 1 : -1) * i * 0.006) * n + n) % n)]);
      stroke(seg, tone.lit, 2.2, 0.9, 6);
    });
  ctx.restore();
}

/** The signals: pulses along the traces, down the spine and out of the ports. */
export function paintSignals(
  ctx: CanvasRenderingContext2D,
  m: BrainModel,
  pl: Place,
  o: { k: number; dpr: number; tone: Tone; now: number; light: boolean }
) {
  const { k, dpr, tone, now } = o;
  const P = (p: Pt) => at(p, pl, k);
  ctx.save();
  ctx.globalCompositeOperation = o.light ? "source-over" : "lighter";
  ctx.fillStyle = tone.lit;
  m.traces.forEach((t, i) => {
    const u = (now / 1400 + i * 0.137) % 1;
    const segs = t.length - 1;
    const f = u * segs;
    const s = Math.min(segs - 1, Math.floor(f));
    const a = t[s];
    const b = t[s + 1];
    const q = P({ x: a.x + (b.x - a.x) * (f - s), y: a.y + (b.y - a.y) * (f - s) });
    ctx.globalAlpha = 1;
    const r = 3.2 * dpr;
    ctx.fillRect(q.x - r / 2, q.y - r / 2, r, r);
  });
  // Down the spine, in step.
  for (let j = 0; j < 3; j++) {
    const u = (now / 2200 + j / 3) % 1;
    const q = P({ x: 0, y: -160 + 272 * u });
    ctx.globalAlpha = 0.9;
    ctx.fillRect(q.x - 6 * dpr, q.y - 1.5 * dpr, 12 * dpr, 3 * dpr);
  }
  ctx.restore();
}
