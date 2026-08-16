import type { ReactNode } from "react";

/**
 * THE FIVE FORMS, AS PARTICLE FIELDS.
 *
 * ⚠ **PORTED FROM THE OWNER'S OWN GENERATORS**, verbatim in behaviour — the
 * `<script>` at the foot of `Substrate Archetypes (Standalone).html`, which
 * frames S1 (seals) and S4 (field cards) both drive. Each painter is one
 * pattern's TEST rendered as its own physics rather than as a word:
 *
 *   voice        three sine baselines with particles riding them — a register
 *   judgment     a threshold, 14 % passing above it, the rest scattered below
 *   validation   a lattice with cases present, absent and drifting off-grid
 *   stakeholder  four reader nodes, each with its own gravity
 *   pattern      a tiling that repeats, with one cell lit
 *
 * ⚠ **SEEDED, SO A RE-RENDER IS THE SAME DRAWING.** `Math.random()` here would
 * re-scatter the field on every React pass and make the capture gates
 * non-deterministic; `rng(seed)` is the mockup's own mulberry-style PRNG.
 *
 * ⚠ **THESE SHIP.** They were lab drawings until reading 03 became the five
 * pattern cards; the shipped drawing paints one field per card, so this file
 * moved out of `app/(internal)/test/**` and the lab imports it from here. One
 * painter, one behaviour — the same argument that deduped `housing` / `band`
 * when reading 02 declared them a second time.
 *
 * ⚠ NOTHING HERE LETTERS, so no fit guard walks it. What covers these marks is
 * the browser smoke's clip gate and the eye: a field is texture, and texture
 * is the one thing on this surface no arithmetic can check.
 *
 * ⚠ **COUNTS ARE ABSOLUTE, NOT PER-AREA.** `voice` paints 260·k marks whether
 * the box is 60 units tall or 500, so a card's field gets DENSER as the stack
 * above it grows, not sparser. That is the right way round — the pattern with
 * fourteen encodes has the least raw substrate left and should look worked —
 * but it means `k` is a payload decision as much as a visual one: five cards
 * at k 1 is roughly 1,300 nodes on the landing's proof surface.
 */

export type FormKey = "voice" | "judgment" | "validation" | "stakeholder" | "pattern";

/** The mockup's PRNG, unchanged. */
function rng(seed: number) {
  let t = seed;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const dawn = (a: number) => `rgba(var(--dawn-rgb), ${a.toFixed(2)})`;
const gold = (a: number) => `rgba(var(--gold-rgb), ${a.toFixed(2)})`;

type Mark = ReactNode;

const sq = (k: string, x: number, y: number, s: number, fill: string): Mark => (
  <rect key={k} x={x.toFixed(1)} y={y.toFixed(1)} width={s} height={s} fill={fill} />
);

const dia = (k: string, cx: number, cy: number, s: number, fill: string): Mark => (
  <rect
    key={k}
    x={(cx - s / 2).toFixed(1)}
    y={(cy - s / 2).toFixed(1)}
    width={s}
    height={s}
    transform={`rotate(45 ${cx} ${cy})`}
    fill={fill}
  />
);

const line = (k: string, d: string, stroke: string): Mark => (
  <path key={k} d={d} fill="none" stroke={stroke} />
);

export interface FieldOpts {
  w: number;
  h: number;
  seed: number;
  /** Particle density multiplier — the mockup's `data-k`. */
  k?: number;
  /** Lattice pitch, validation only — the mockup's `data-p`. */
  p?: number;
}

const PAINT: Record<FormKey, (o: Required<Pick<FieldOpts, "w" | "h">> & FieldOpts) => Mark[]> = {
  voice({ w, h, seed, k = 1 }) {
    const R = rng(seed);
    const out: Mark[] = [];
    for (let b = 0; b < 3; b += 1) {
      const base = h * (0.26 + 0.24 * b);
      const amp = h * 0.07;
      const f = 1.5 + b * 0.7;
      let d = `M0 ${base.toFixed(1)}`;
      for (let x = 0; x <= w; x += 4) {
        d += `L${x} ${(base + Math.sin((x / w) * 6.283 * f) * amp).toFixed(1)}`;
      }
      out.push(line(`b${b}`, d, b === 1 ? gold(0.3) : dawn(0.12)));
    }
    const n = Math.round(260 * k);
    for (let i = 0; i < n; i += 1) {
      const x = R() * w;
      const b = Math.floor(R() * 3);
      const base = h * (0.26 + 0.24 * b);
      const amp = h * 0.07;
      const f = 1.5 + b * 0.7;
      const y = base + Math.sin((x / w) * 6.283 * f) * amp + (R() - 0.5) * h * 0.06;
      const a = 0.15 + R() * 0.45;
      out.push(sq(`p${i}`, x, y, R() < 0.15 ? 1.8 : 1.1, b === 1 && R() < 0.3 ? gold(a) : dawn(a)));
    }
    return out;
  },

  judgment({ w, h, seed, k = 1 }) {
    const R = rng(seed);
    const thr = h * 0.3;
    const out: Mark[] = [
      line("thr", `M0 ${thr}H${w}`, gold(0.5)),
      line("thr2", `M0 ${thr + 3}H${w}`, gold(0.18)),
    ];
    const n = Math.round(300 * k);
    for (let i = 0; i < n; i += 1) {
      const pass = R() < 0.14;
      const x = R() * w;
      if (pass) {
        out.push(sq(`p${i}`, x, thr - 6 - R() ** 2 * (thr - 12), 1.4, gold(0.35 + R() * 0.4)));
      } else {
        out.push(
          sq(`p${i}`, x, thr + 6 + R() ** 1.6 * (h - thr - 14), 1.1, dawn(0.1 + R() ** 2 * 0.4))
        );
      }
    }
    out.push(dia("gate", w / 2, thr, 6, gold(0.9)));
    return out;
  },

  validation({ w, h, seed, p = 14 }) {
    const R = rng(seed);
    const out: Mark[] = [];
    /* ⚠ THE PITCH IS A LOOP STEP, AND THIS IS THE ONLY PAINTER WHERE A CALLER'S
       NUMBER BECOMES ONE. A destructuring default only fires on `undefined`, so
       a caller passing an explicit 0 — which the substrate lab's `Field` wrapper
       did, by defaulting its own pass-through to 0 — steps `x += 0` and hangs
       the render before React ever commits. The page then never mounts, so
       there is no drawing on screen to say what happened, and the `?v=` the
       shell writes into the URL means a refresh re-enters the same hang. Clamp
       rather than trust: a bad pitch draws the default lattice, never a spin. */
    const g = p > 0 ? p : 14;
    for (let x = g; x < w; x += g) out.push(line(`v${x}`, `M${x} 0V${h}`, dawn(0.05)));
    for (let y = g; y < h; y += g) out.push(line(`h${y}`, `M0 ${y}H${w}`, dawn(0.05)));
    for (let x = g; x < w; x += g) {
      for (let y = g; y < h; y += g) {
        const r = R();
        if (r < 0.72) {
          out.push(
            sq(`c${x}-${y}`, x - 0.8, y - 0.8, 1.6, r < 0.1 ? gold(0.6) : dawn(0.2 + R() * 0.4))
          );
        } else if (r > 0.94) {
          out.push(
            sq(
              `d${x}-${y}`,
              x - 0.6 + (R() - 0.5) * g * 0.8,
              y - 0.6 + (R() - 0.5) * g * 0.8,
              1.2,
              dawn(0.12)
            )
          );
        }
      }
    }
    return out;
  },

  stakeholder({ w, h, seed, k = 1 }) {
    const R = rng(seed);
    const out: Mark[] = [];
    const nodes: [number, number][] = [
      [w * 0.3, h * 0.22],
      [w * 0.72, h * 0.4],
      [w * 0.35, h * 0.62],
      [w * 0.68, h * 0.82],
    ];
    nodes.forEach(([cx, cy], j) => {
      out.push(
        <ellipse
          key={`e${j}`}
          cx={cx}
          cy={cy}
          rx={w * 0.22}
          ry={w * 0.1}
          fill="none"
          stroke={dawn(0.1)}
        />
      );
      out.push(dia(`n${j}`, cx, cy, 5, gold(0.85)));
      const n = Math.round(70 * k);
      for (let i = 0; i < n; i += 1) {
        const ang = R() * 6.283;
        const rad = R() ** 1.8 * w * 0.24;
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad * 0.5;
        if (x < 0 || x > w || y < 0 || y > h) continue;
        out.push(sq(`p${j}-${i}`, x, y, 1.1, dawn(0.12 + (1 - rad / (w * 0.24)) * 0.4)));
      }
    });
    return out;
  },

  pattern({ w, h, seed }) {
    const R = rng(seed);
    const out: Mark[] = [
      line("d1", `M0 ${h}L${w} 0`, dawn(0.08)),
      line("d2", `M0 ${h * 0.55}L${w * 0.75} 0`, dawn(0.05)),
    ];
    const p = 17;
    const goldRow = Math.floor(h / p / 2);
    for (let row = 0; row * p < h + p; row += 1) {
      for (let col = -1; col * p < w + p; col += 1) {
        const x = col * p + (row % 2) * (p / 2);
        const y = row * p + 4;
        if (x < 2 || x > w - 6 || y > h - 6) continue;
        const a = 0.14 + R() * 0.3;
        const f = row === goldRow && col === 2 ? gold(0.8) : dawn(a);
        out.push(sq(`a${row}-${col}`, x, y, 2, f));
        out.push(sq(`b${row}-${col}`, x + 4, y, 2, f));
        out.push(sq(`c${row}-${col}`, x, y + 4, 2, f));
      }
    }
    return out;
  },
};

/** Paint one form's field into a `w × h` box at the origin. */
export function FormField({ form, ...o }: FieldOpts & { form: FormKey }) {
  return <>{PAINT[form](o)}</>;
}

/** The record's five keys, in the order the painters are written for. */
export const isFormKey = (k: string): k is FormKey =>
  k === "voice" || k === "judgment" || k === "validation" || k === "stakeholder" || k === "pattern";
