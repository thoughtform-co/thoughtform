/**
 * A black hole made of mathematics (ADR-159 U8, owner 2026-10-17: the
 * mathematics card "is just ugly and looks like a glorified PowerPoint.
 * Really use our particle system ... to make something like a black hole
 * made out of mathematics at the center"), picked as M1 on the Claude Design
 * canvas with the Readout card.
 *
 * An accretion disk whose particles are mathematics: glyphs, and a few of
 * the card's own equations (Navier–Stokes, Erdős–Straus) on the outer
 * orbits, each on a Keplerian orbit in a tilted plane, falling slowly in.
 * Painted back to front: the far half of the disk, the horizon over it, the
 * far half again bent over the top of the horizon and faintly under it (the
 * lensed image), the photon ring in gold (the one lit thing), the near half
 * in front of everything. Hotter and brighter the nearer a glyph falls,
 * brighter on the side that comes toward the reader, gone at the horizon.
 *
 * Canvas 2D, no DOM: the act mounts it in the mathematics card's media rect.
 */

export interface HoleGlyph {
  g: string;
  /** An equation, not a glyph: outer orbits only, dimmer, upright. */
  frag: boolean;
  /** Orbit radius, in horizon radii. */
  r: number;
  th: number;
  sz: number;
  /** The disk's thickness: a small offset out of its plane. */
  jit: number;
  italic: boolean;
}

const GLYPHS = ["∫", "∑", "∂", "π", "∞", "∇", "λ", "φ", "Δ", "μ", "√", "ε", "θ", "=", "+", "−", "×", "e", "i", "n", "x", "y", "z", "0", "1", "2", "3", "4", "5", "7", "9"];
const EQUATIONS = ["∂u/∂t + (u·∇)u = −∇p + νΔu", "∇·u = 0", "4/n = 1/x + 1/y + 1/z", "Navier–Stokes", "Erdős–Straus"];
/** The innermost orbit: a glyph that falls past it is sent back out. */
const INNER = 1.1;

/** The disk, seeded, so it is the same disk every time. */
export function holeSeed(count = 820): HoleGlyph[] {
  let s = 20261017;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const out: HoleGlyph[] = [];
  for (let k = 0; k < count; k++) {
    const frag = k < 12;
    out.push({
      g: frag ? EQUATIONS[k % EQUATIONS.length] : GLYPHS[Math.floor(rnd() * GLYPHS.length)],
      frag,
      r: frag ? 4.4 + rnd() * 1.8 : 1.25 + rnd() * 4.9,
      th: rnd() * Math.PI * 2,
      sz: frag ? 1 : 0.55 + rnd() * 0.8,
      jit: (rnd() - 0.5) * 0.14,
      italic: rnd() < 0.7,
    });
  }
  return out;
}

/** The disk `dt` seconds on: each glyph round its orbit, a little further in. */
export function holeStep(parts: HoleGlyph[], dt: number, rnd: () => number = Math.random): void {
  for (const p of parts) {
    p.th += dt * 2 * Math.pow(p.r, -1.5);
    p.r -= (dt * 0.07) / p.r;
    if (p.r < INNER) {
      p.r = p.frag ? 4.4 + rnd() * 1.8 : 5.2 + rnd() * 1.0;
      p.th = rnd() * Math.PI * 2;
    }
  }
}

export interface HoleTones {
  /** The ground the card's media sits on. */
  ground: string;
  ink: string;
  /** The hottest glyphs, a warmer ink. */
  warm: string;
  gold: string;
  /** The horizon. */
  void: string;
}

/** The hole on a canvas `w` × `h` CSS px (the context already scaled to
    them). `size` is the horizon's radius as a share of the frame (the disk
    runs to six of them, past the frame's sides when large); `tilt` is how
    open the disk lies. */
export function paintHole(
  ctx: CanvasRenderingContext2D,
  parts: readonly HoleGlyph[],
  w: number,
  h: number,
  tones: HoleTones,
  font: string,
  { size = 0.07, tilt = 0.24 }: { size?: number; tilt?: number } = {}
): void {
  ctx.globalAlpha = 1;
  ctx.fillStyle = tones.ground;
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2 + h * 0.03;
  const R = Math.min(w, h * 1.6) * size;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const glyph = (p: HoleGlyph, x: number, y: number, gain: number, scale: number) => {
    const heat = Math.max(0, Math.min(1, (3.4 - p.r) / 2.2));
    const fade = Math.max(0, Math.min(1, (p.r - INNER) / 0.45));
    const beam = 1 + 0.42 * Math.cos(p.th);
    let alpha = (0.26 + 0.62 * heat) * fade * beam * gain;
    if (p.frag) alpha *= 0.55;
    if (alpha <= 0.01) return;
    const size = (p.frag ? 0.15 : 0.22) * scale * p.sz * (1 + 0.35 * heat);
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.fillStyle = heat > 0.75 ? tones.warm : tones.ink;
    ctx.font = `${p.italic && !p.frag ? "italic " : ""}${size.toFixed(1)}px ${font}`;
    ctx.fillText(p.g, x, y);
  };
  const onDisk = (p: HoleGlyph): [number, number] => [cx + p.r * R * Math.cos(p.th), cy + p.r * R * Math.sin(p.th) * tilt + p.jit * R];
  // the far half of the disk, behind the horizon
  for (const p of parts) {
    if (Math.sin(p.th) < 0) glyph(p, ...onDisk(p), 1, R);
  }
  // the horizon
  ctx.globalAlpha = 1;
  ctx.fillStyle = tones.void;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  // the far half again, bent over the top of the horizon and faintly under it
  for (const p of parts) {
    if (Math.sin(p.th) >= 0 || p.r > 4.2 || p.frag) continue;
    const rho = R * (1.12 + 0.13 * (p.r - INNER));
    glyph(p, cx + rho * Math.cos(p.th), cy + rho * Math.sin(p.th), 0.55, R * 0.62);
    if (p.r < 2.6) {
      const rho2 = R * (1.04 + 0.05 * (p.r - INNER));
      glyph(p, cx + rho2 * Math.cos(p.th), cy - rho2 * Math.sin(p.th), 0.2, R * 0.5);
    }
  }
  // the photon ring: the one lit thing
  ctx.save();
  ctx.strokeStyle = tones.gold;
  ctx.shadowColor = tones.gold;
  ctx.shadowBlur = 10;
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.04, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.18;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 1.17, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // the near half of the disk, in front of it all
  for (const p of parts) {
    if (Math.sin(p.th) >= 0) glyph(p, ...onDisk(p), 1, R);
  }
  ctx.globalAlpha = 1;
}
