/**
 * A black hole made of mathematics, on a terminal (ADR-159 U8, U9).
 *
 * U8 drew it as glyphs rolling round a gold ring; the owner, 2026-10-17:
 * "really this is just like a circle with things rolling around. Particle
 * system, terminal retrofuturistic. That's the briefing." So U9 renders the
 * same physics the way a terminal would: a grid of monospace character
 * cells, nothing drawn between them.
 *
 *   particles   an accretion disk on Keplerian orbits in a tilted plane,
 *               falling slowly in; each one lights the cell it is over, and
 *               the far half lights a second, lensed cell bent over the top
 *               of the horizon (and faintly under it)
 *   phosphor    a cell's light decays, so the orbits leave trails, as a
 *               phosphor screen does
 *   ramp        a cell shows the character its light buys, from a dot to
 *               mathematics: · : - = + × ≈ ∫ ∑ ∂ ∇ ∞ #
 *   horizon     the cells inside it stay blank; the cells on the photon
 *               ring burn in gold, the one lit thing
 *   prompt      the card's own equations, typed at a prompt at the foot
 *   scanlines   a dark line every few pixels, the screen's grain
 *
 * Canvas 2D, no DOM: the act mounts it in the mathematics card's picture.
 */

export interface HoleParticle {
  /** Orbit radius, in horizon radii. */
  r: number;
  th: number;
  /** Out of the disk's plane a little: its thickness. */
  jit: number;
  /** How much light it carries. */
  w: number;
}

/** The equations typed at the prompt: the card's own. */
export const HOLE_EQUATIONS = ["∂u/∂t + (u·∇)u = −∇p + νΔu", "∇·u = 0", "4/n = 1/x + 1/y + 1/z"] as const;
/** From no light to most: a dot, marks, then mathematics. */
const RAMP = ["·", ":", "-", "=", "+", "×", "≈", "∫", "∑", "∂", "∇", "∞"] as const;
/** The innermost orbit: a particle that falls past it is sent back out. */
const INNER = 1.1;

/** The disk, seeded, so it is the same disk every time. */
export function holeSeed(count = 900): HoleParticle[] {
  let s = 20261017;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const out: HoleParticle[] = [];
  for (let k = 0; k < count; k++) {
    out.push({ r: 1.25 + rnd() * 5.2, th: rnd() * Math.PI * 2, jit: (rnd() - 0.5) * 0.16, w: 0.5 + rnd() * 0.5 });
  }
  return out;
}

/** The disk `dt` seconds on: each particle round its orbit, a little further in. */
export function holeStep(parts: HoleParticle[], dt: number, rnd: () => number = Math.random): void {
  for (const p of parts) {
    p.th += dt * 2 * Math.pow(p.r, -1.5);
    p.r -= (dt * 0.07) / p.r;
    if (p.r < INNER) {
      p.r = 5.4 + rnd() * 1.0;
      p.th = rnd() * Math.PI * 2;
    }
  }
}

/** A terminal: its grid of cells and the light each holds. */
export interface HoleScreen {
  cols: number;
  rows: number;
  cw: number;
  ch: number;
  light: Float32Array;
}

/** A screen of cells `ch` px high over `w` × `h` CSS px; `cw` is the font's advance. */
export function holeScreen(w: number, h: number, ch: number, cw: number): HoleScreen {
  const cols = Math.max(1, Math.floor(w / cw));
  const rows = Math.max(1, Math.floor(h / ch));
  return { cols, rows, cw, ch, light: new Float32Array(cols * rows) };
}

export interface HoleTones {
  /** The screen's ground. */
  ground: string;
  ink: string;
  gold: string;
}

/**
 * One frame of the terminal `w` × `h` CSS px (the context already scaled to
 * them), `dt` seconds after the last, at `now` ms.
 */
export function paintHole(
  ctx: CanvasRenderingContext2D,
  parts: readonly HoleParticle[],
  screen: HoleScreen,
  w: number,
  h: number,
  tones: HoleTones,
  font: string,
  now: number,
  dt: number,
  { size = 0.105, tilt = 0.27, inset = 0 }: { size?: number; tilt?: number; inset?: number } = {}
): void {
  const { cols, rows, cw, ch, light } = screen;
  // the frame: the prompt's row at the foot, the hole in what is left
  const promptRows = 2;
  const field = rows - promptRows;
  const gw = cols * cw;
  const ox = (w - gw) / 2;
  const cx = w / 2;
  const cy = (field * ch) / 2;
  const R = Math.min(w, field * ch * 1.6) * size;
  const at = (x: number, y: number) => {
    const c = Math.floor((x - ox) / cw);
    const r = Math.floor(y / ch);
    return c < 0 || r < 0 || c >= cols || r >= field ? -1 : r * cols + c;
  };
  // phosphor: the light a cell holds fades
  const fade = Math.exp(-dt * 5.5);
  for (let i = 0; i < light.length; i++) light[i] *= fade;
  // the particles light the cells they are over
  const deposit = (x: number, y: number, v: number) => {
    const i = at(x, y);
    if (i >= 0) light[i] = Math.min(1.4, light[i] + v);
  };
  for (const p of parts) {
    const far = Math.sin(p.th) < 0;
    const x = cx + p.r * R * Math.cos(p.th);
    const y = cy + p.r * R * Math.sin(p.th) * tilt + p.jit * R;
    const heat = Math.max(0, Math.min(1, (3.6 - p.r) / 2.4));
    const beam = 1 + 0.45 * Math.cos(p.th);
    const v = (0.042 + 0.13 * heat) * beam * p.w * Math.min(1, (p.r - INNER) / 0.4);
    // the far half is hidden where the horizon stands in front of it
    if (!(far && Math.hypot(x - cx, y - cy) < R * 1.02)) deposit(x, y, v);
    if (far && p.r < 4.4) {
      const rho = R * (1.18 + 0.15 * (p.r - INNER));
      deposit(cx + rho * Math.cos(p.th), cy + rho * Math.sin(p.th), v * 0.6);
      if (p.r < 2.6) {
        const rho2 = R * (1.06 + 0.06 * (p.r - INNER));
        deposit(cx + rho2 * Math.cos(p.th), cy - rho2 * Math.sin(p.th), v * 0.25);
      }
    }
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = tones.ground;
  ctx.fillRect(0, 0, w, h);
  ctx.font = `${Math.round(ch * 0.92)}px ${font}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const ring = R * 1.06;
  const band = Math.max(cw, ch) * 0.62;
  for (let r = 0; r < field; r++) {
    const y = r * ch + ch / 2;
    for (let c = 0; c < cols; c++) {
      const x = ox + c * cw + cw / 2;
      const d = Math.hypot(x - cx, (y - cy) * 1.0);
      if (d < R * 0.98) continue;
      const i = r * cols + c;
      // the photon ring burns in gold, shimmering a little as the light round it moves
      if (Math.abs(d - ring) < band) {
        const a = Math.atan2(y - cy, x - cx);
        const flick = 0.75 + 0.25 * Math.sin(a * 7 + now / 380);
        ctx.globalAlpha = flick;
        ctx.fillStyle = tones.gold;
        ctx.fillText(light[i] > 0.5 ? "∞" : "○", x, y);
        continue;
      }
      const v = light[i];
      if (v < 0.04) {
        // the screen's own grain: a faint dot on every few cells
        if ((c * 7 + r * 13) % 11 === 0) {
          ctx.globalAlpha = 0.09;
          ctx.fillStyle = tones.ink;
          ctx.fillText("·", x, y);
        }
        continue;
      }
      const k = Math.min(RAMP.length - 1, Math.floor(Math.min(1, v) * RAMP.length));
      ctx.globalAlpha = Math.min(1, 0.28 + 0.72 * Math.min(1, v));
      ctx.fillStyle = tones.ink;
      ctx.fillText(RAMP[k], x, y);
    }
  }

  // the prompt: the card's equations typed out, one after another, `inset`
  // px in from the left and the foot (clear of a frame's cut corner)
  const cycle = 6200;
  const which = Math.floor(now / cycle) % HOLE_EQUATIONS.length;
  const eq = HOLE_EQUATIONS[which];
  const typed = Math.min(eq.length, Math.floor(((now % cycle) / 1000) * 16));
  const py = h - inset - ch / 2;
  const px = Math.max(ox + cw * 0.5, inset);
  ctx.textAlign = "left";
  ctx.globalAlpha = 1;
  ctx.fillStyle = tones.gold;
  ctx.fillText(">", px, py);
  ctx.fillStyle = tones.ink;
  ctx.globalAlpha = 0.85;
  ctx.fillText(eq.slice(0, typed), px + cw * 1.5, py);
  if (Math.floor(now / 530) % 2 === 0) {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = tones.gold;
    const tx = px + cw * 1.5 + ctx.measureText(eq.slice(0, typed)).width + cw * 0.2;
    ctx.fillRect(tx, py - ch * 0.42, cw * 0.8, ch * 0.84);
  }

  // scanlines: the screen's grain
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = tones.ground;
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
  ctx.globalAlpha = 1;
}
