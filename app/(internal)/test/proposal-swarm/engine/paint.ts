/* One frame, painted. No React; the canvases are handed in.

   S4·E's own order, bottom plate first, with one change: a plate hides what
   is behind it by CUTTING its silhouette out of what has been painted
   (`destination-out`), where S4·E fills it with its ground's colour. The
   canvas lies over a page here, so it has to stay clear where no dot is.

   What runs and what falls is S4·E's own, by reference (`swarm/clear.ts`),
   and only while every dot is on the stack: a plate in flight sheds nothing.

   TWO LAYERS. A dot that has not left the opening belongs to the opening: it
   has to go where that section goes, with nothing between the scroll and the
   pixel. So the opening has a canvas of its own inside its own screen (the
   SEAT), and it holds the stack while it rests there, every dot of it that
   has not left yet, and the files tied to it. Everything else, a dot from
   the moment it leaves, is on the canvas that holds still on the screen (the
   FLIGHT). Both are painted from one frame, in one order, with the same
   silhouettes, so a dot leaving is hidden behind a plate still standing. */

import { drawFalls, drawRunners, type Falls, halo } from "../../stack-forms/swarm/clear";
import { HEX, hash2 } from "../../stack-forms/model";
import { STYLE } from "../../stack-forms/swarm/dots";

import type { Frame, Glow, Seat } from "./flight";
import { along, SHOW } from "./formations";
import { DIM, paletteOf, type Tones } from "./palette";
import { inGap, stationAt } from "./traces";
import type { World } from "./world";

type Ctx = CanvasRenderingContext2D;

/** Which of the frame a canvas shows: the opening's own dots, the rest, or,
    on a page with one canvas only, everything. */
type Layer = "seat" | "flight" | "both";

export interface Paint {
  tones: Tones;
  /** The last frame's time, seconds: what falls takes one ordinary step
      after a long frame, never the whole absence. */
  tLast: number;
  palette: string[];
  key: string;
  /** Whether each gap was raining last frame, the team's gap first; null
      before the first frame. */
  rain: [boolean, boolean] | null;
}

export const newPaint = (tones: Tones): Paint => ({
  tones,
  tLast: 0,
  palette: [],
  key: "",
  rain: null,
});

/** How long after a gap's first stream its last one starts, in ways. */
const STAGGER = 0.15;

/** A gap's rain starts again from the top. Without this a gap was full of
    drops the frame it began (owner, 2026-10-14: "they just appear out of
    nowhere"); put back a whole way, a stream could take half a way to show
    ("can happen a bit sooner"). So a stream's drops go back together,
    keeping their spacing, until its first is just under the upper plate,
    and the streams start one after another, nearest the corner first, over
    `STAGGER` of a way. */
function restart(f: Falls) {
  const streams = new Map<string, number[]>();
  for (let q = 0; q < f.count; q++) {
    const key = `${f.x[q]}:${f.speed[q]}`;
    const qs = streams.get(key);
    if (qs) qs.push(q);
    else streams.set(key, [q]);
  }
  const wrap = (v: number) => ((v % 1) + 1) % 1;
  let s = 0;
  for (const qs of streams.values()) {
    const lead = Math.max(...qs.map((q) => wrap(f.prog[q])));
    const wait = (STAGGER * s++) / Math.max(1, streams.size - 1);
    for (const q of qs) f.prog[q] = wrap(f.prog[q]) - lead - wait;
  }
}

const GOLD = [1, 3, 5].map((at) => parseInt(HEX.gold.slice(at, at + 2), 16));

/** The layer's light on a turning stack: S4·E's halo (`swarm/clear.ts`),
    drawn in the plane of the layer's top face as the camera has it. */
function glow(ctx: Ctx, g: Glow, alpha: number) {
  if (alpha <= 0 || g.reach <= 0) return;
  const [r, gr, b] = GOLD;
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.transform(g.plane[0], g.plane[1], g.plane[2], g.plane[3], 0, 0);
  ctx.globalAlpha = alpha;
  const light = ctx.createRadialGradient(0, 0, 0, 0, 0, g.reach);
  light.addColorStop(0, `rgba(${r}, ${gr}, ${b}, 0.34)`);
  light.addColorStop(0.35, `rgba(${r}, ${gr}, ${b}, 0.14)`);
  light.addColorStop(1, `rgba(${r}, ${gr}, ${b}, 0)`);
  ctx.fillStyle = light;
  ctx.beginPath();
  ctx.arc(0, 0, g.reach, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const lit = (level: number) => DIM + (1 - DIM) * level;

function cut(ctx: Ctx, poly: Int32Array, ox: number, oy: number, alpha: number) {
  if (poly.length < 6 || alpha <= 0) return;
  ctx.globalCompositeOperation = "destination-out";
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.beginPath();
  ctx.moveTo(poly[0] + ox, poly[1] + oy);
  for (let q = 2; q < poly.length; q += 2) ctx.lineTo(poly[q] + ox, poly[q + 1] + oy);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

/** The dots of one run that belong on this layer. A dot in the opening's
    seat is stated in the seat's own space: on a canvas that holds still it
    is drawn where the opening has scrolled to. */
function dots(
  ctx: Ctx,
  F: Frame,
  palette: readonly string[],
  from: number,
  to: number,
  layer: Layer
) {
  let style = -1;
  for (let d = from; d < to; d++) {
    const show = F.show[d];
    if (show === SHOW.no) continue;
    const seated = show === SHOW.seat;
    if (layer === "seat" ? !seated : layer === "flight" && seated) continue;
    if (F.style[d] !== style) {
      style = F.style[d];
      ctx.fillStyle = palette[style];
    }
    const size = F.size[d];
    const y = seated && layer === "both" ? F.y[d] - F.ride : F.y[d];
    if (show === SHOW.window) {
      if (F.alpha[d] <= 0.01) continue;
      ctx.globalAlpha = F.alpha[d];
      ctx.fillRect(F.x[d] - (size >> 1), y - (size >> 1), size, size);
      ctx.globalAlpha = 1;
    } else ctx.fillRect(F.x[d] - (size >> 1), y - (size >> 1), size, size);
    /* a falling dot's trail: two dots behind it on its way, each a size
       smaller, as S4·E's own drops trail */
    if (F.trails && !seated) {
      for (let k = 0; k < 2; k++) {
        const tx = F.trail[d * 4 + k * 2];
        if (Number.isNaN(tx)) break;
        const ty = F.trail[d * 4 + k * 2 + 1];
        const dot = Math.max(1, size - 1 - k);
        ctx.fillRect(tx - (dot >> 1), ty - (dot >> 1), dot, dot);
      }
    }
  }
}

/* -- the opening's files ---------------------------------------------------------- */

const FILE = [STYLE.team, STYLE.layer, STYLE.agents] as const;
const WALKER = [STYLE.teamLit, STYLE.layerLit, STYLE.agentsHot] as const;
/** Stations a second a walker covers. */
const PACE = 6;

function files(ctx: Ctx, W: World, F: Frame, t: number, palette: readonly string[], dy: number) {
  const T = W.traces;
  if (F.reel >= 1 || T.count === 0) return;
  const at = [0, 0];
  const size = W.sizes[1];
  let style = -1;
  for (let i = 0; i < T.count; i++) {
    if (!stationAt(T, i, F.reel, at)) continue;
    const trace = T.traces[T.of[i]];
    const mine = trace.lit ? STYLE.layer : FILE[trace.plate];
    if (mine !== style) {
      style = mine;
      ctx.fillStyle = palette[style];
    }
    ctx.fillRect(Math.round(at[0]) - (size >> 1), Math.round(at[1]) + dy - (size >> 1), size, size);
  }
  /* one brighter dot a file, stepping station to station the way the work
     flows; they stop with the reel */
  if (F.reel > 0) return;
  T.traces.forEach((trace, n) => {
    const stations = Math.max(1, Math.floor(trace.lane.len / T.pitch));
    const head = Math.floor(hash2(n, 5, 23) * stations + t * PACE) % stations;
    const tail = [
      [0, 3, trace.lit ? STYLE.layerLit : WALKER[trace.plate]],
      [1, 2, trace.lit ? STYLE.layerLit : WALKER[trace.plate]],
      [2, 1, trace.lit ? STYLE.layer : FILE[trace.plate]],
    ] as const;
    for (const [back, tier, paint] of tail) {
      const s = (head - back + 0.5) * T.pitch;
      if (s <= 0) continue;
      along(trace.lane, s, at);
      if (inGap(T.gaps, at[0], at[1])) continue;
      const dot = W.sizes[tier];
      ctx.fillStyle = palette[paint];
      ctx.fillRect(Math.round(at[0]) - (dot >> 1), Math.round(at[1]) + dy - (dot >> 1), dot, dot);
    }
  });
}

/* -- a team's lane, once walked ----------------------------------------------------- */

function lanes(ctx: Ctx, W: World, F: Frame, t: number, palette: readonly string[]) {
  const at = [0, 0];
  const pitch = 7 * W.metrics.dpr;
  F.walked.forEach((walked, team) => {
    if (walked <= 0) return;
    const lane = W.org.lanes[team][W.org.mid];
    const stations = Math.max(1, Math.floor(lane.len / pitch));
    const head = Math.floor(hash2(team, 9, 31) * stations + t * PACE) % stations;
    ctx.globalAlpha = walked;
    for (const [back, tier] of [
      [0, 2],
      [1, 1],
    ] as const) {
      const s = (head - back + 0.5) * pitch;
      if (s <= 0) continue;
      along(lane, s, at);
      const dot = W.sizes[tier];
      ctx.fillStyle = palette[STYLE.layerLit];
      ctx.fillRect(Math.round(at[0]) - (dot >> 1), Math.round(at[1]) - (dot >> 1), dot, dot);
    }
    ctx.globalAlpha = 1;
  });
}

/* -- one layer of the frame ----------------------------------------------------------- */

function draw(
  ctx: Ctx,
  W: World,
  F: Frame,
  t: number,
  dt: number,
  palette: readonly string[],
  w: number,
  layer: Layer
) {
  const S = W.scene;
  const row = W.L.b * W.L.g;
  /* on a canvas that holds still, what stands in the opening's seat is
     where the opening has scrolled to */
  const home = layer === "seat" ? 0 : -F.ride;
  /* the stack as a standing thing belongs to the layer it stands on */
  const whole = F.whole && (layer === "both" || (layer === "seat") === F.home) ? F.whole : null;
  const wholeY = whole ? whole.oy + (F.home ? home : 0) : 0;

  if (layer !== "flight") files(ctx, W, F, t, palette, home);

  const inSeat = (alpha: number, paint: () => void) => {
    if (!whole || alpha <= 0) return;
    ctx.save();
    ctx.translate(whole.ox, wholeY);
    ctx.globalAlpha = alpha;
    paint();
    ctx.restore();
  };
  /* what falls between two plates: on the whole stack, or, while the hop
     still brings the rest, on the plates already landed in the steps */
  const rain: { seat: Seat; y: number; on: readonly [number, number] } | null = whole
    ? { seat: whole, y: wholeY, on: [1, 1] }
    : F.rain && layer !== "seat"
      ? { seat: F.rain.seat, y: F.rain.seat.oy, on: F.rain.on }
      : null;
  const fall = (gap: 0 | 1, level: number, style: number) => {
    if (!rain) return;
    const alpha = lit(level) * rain.on[gap];
    if (alpha <= 0) return;
    const { lift } = rain.seat;
    ctx.save();
    ctx.translate(rain.seat.ox, rain.y);
    ctx.globalAlpha = alpha;
    drawFalls(
      ctx,
      S,
      W.falls[gap],
      lift[gap],
      lift[gap + 1],
      lift[gap + 1] - lift[gap] - W.thick[gap + 1] * row,
      style,
      dt
    );
    ctx.restore();
  };
  const masks = (n: number, plate: 0 | 1 | 2, poly: Int32Array, wholeOnly: boolean) => {
    for (const m of F.masks) {
      if (layer === "seat" && !m.home) continue;
      const a = m.alpha[plate];
      const band = m.band?.[plate];
      /* a solid on the board hides what is behind it only while its plate
         stands whole */
      if (wholeOnly ? a < 0.999 || band : a <= 0) continue;
      if (m.poly) {
        /* a silhouette of its own, on the canvas as it is: a turning plate */
        const own = m.poly[n];
        if (own) cut(ctx, own, 0, 0, a);
        continue;
      }
      const dy = m.home ? home : 0;
      if (band) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, band[0] + dy, w, band[1] - band[0]);
        ctx.clip();
        cut(ctx, poly, m.ox, m.oy + dy + m.lift[plate], a);
        ctx.restore();
      } else cut(ctx, poly, m.ox, m.oy + dy + m.lift[plate], a);
    }
  };

  let layerDone = false;
  let teamDone = false;
  W.pool.segs.forEach((seg, n) => {
    if (seg.block) {
      /* a solid on the board hides the board behind it, while it stands */
      masks(n, 2, seg.mask, true);
    } else if (seg.plate === 1 && !layerDone) {
      layerDone = true;
      fall(1, F.level[1], STYLE.fallGold);
      masks(n, 1, seg.mask, false);
      /* the layer's own light, on the layer it stands on */
      for (const m of F.masks) {
        if (layer === "seat" ? !m.home : layer === "flight" && m.home) continue;
        if (m.alpha[1] <= 0 || m.share[1] <= 0) continue;
        ctx.save();
        ctx.translate(m.ox, m.oy + (m.home ? home : 0));
        ctx.globalAlpha = m.alpha[1] * m.share[1] * lit(F.level[1]);
        halo(ctx, S, m.lift[1]);
        ctx.restore();
      }
      /* and on a turning stack, in the plane of its top face */
      if (F.glow && layer !== "seat") glow(ctx, F.glow, F.glow.alpha * lit(F.level[1]));
    } else if (seg.plate === 0 && !teamDone) {
      teamDone = true;
      fall(0, F.level[0], STYLE.fallGreen);
      masks(n, 0, seg.mask, false);
    }
    dots(ctx, F, palette, seg.from, seg.to, layer);
    /* the runners on the agents' traces, over the bare board and under
       what stands on it */
    if (n === 0 && whole)
      inSeat(lit(F.level[2]), () => drawRunners(ctx, S, S.plates[2].runners, whole.lift[2], t));
  });

  if (layer !== "seat" && F.state === "network") lanes(ctx, W, F, t, palette);
}

/* -- the frame -------------------------------------------------------------------- */

/**
 * One frame onto the canvas that holds still (`flight`) and the opening's
 * own (`seat`); both are `w` by `h`. On a page without the second, the one
 * canvas takes everything. What falls is drawn by one layer only, the one
 * the whole stack stands on (or, while it lands, the one that holds still),
 * so both may be handed the frame's own step.
 */
export function paint(
  flight: Ctx,
  seat: Ctx | null,
  W: World,
  F: Frame,
  t: number,
  P: Paint,
  w: number,
  h: number
) {
  const dt = Math.min(0.1, Math.max(0, t - P.tLast));
  P.tLast = t;
  const key = F.level.map((v) => v.toFixed(3)).join();
  if (key !== P.key) {
    P.key = key;
    P.palette = paletteOf(F.level, P.tones);
  }
  /* a gap that begins to rain starts from the top; one already raining when
     the page opens is the rain it is at rest, and so is every gap of a still
     (its clock stands at 0, so a restarted gap would stay empty) */
  const raining: [boolean, boolean] = [
    !!F.whole || (F.rain?.on[0] ?? 0) > 0,
    !!F.whole || (F.rain?.on[1] ?? 0) > 0,
  ];
  if (P.rain && t > 0)
    for (const gap of [0, 1] as const) if (raining[gap] && !P.rain[gap]) restart(W.falls[gap]);
  P.rain = raining;
  for (const ctx of seat ? [seat, flight] : [flight]) {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
  }
  if (seat && (F.state === "opening" || F.state === "hop1"))
    draw(seat, W, F, t, dt, P.palette, w, "seat");
  draw(flight, W, F, t, dt, P.palette, w, seat ? "flight" : "both");
}
