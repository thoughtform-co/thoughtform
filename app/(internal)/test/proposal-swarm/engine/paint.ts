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

import { drawFalls, drawRunners, halo } from "../../stack-forms/swarm/clear";
import { hash2 } from "../../stack-forms/model";
import { STYLE } from "../../stack-forms/swarm/dots";

import type { Frame } from "./flight";
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
}

export const newPaint = (tones: Tones): Paint => ({ tones, tLast: 0, palette: [], key: "" });

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
  const masks = (plate: 0 | 1 | 2, poly: Int32Array, wholeOnly: boolean) => {
    for (const m of F.masks) {
      if (layer === "seat" && !m.home) continue;
      const a = m.alpha[plate];
      const band = m.band?.[plate];
      /* a solid on the board hides what is behind it only while its plate
         stands whole */
      if (wholeOnly ? a < 0.999 || band : a <= 0) continue;
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
      masks(2, seg.mask, true);
    } else if (seg.plate === 1 && !layerDone) {
      layerDone = true;
      if (whole)
        inSeat(lit(F.level[1]), () =>
          drawFalls(
            ctx,
            S,
            W.falls[1],
            whole.lift[1],
            whole.lift[2],
            whole.lift[2] - whole.lift[1] - W.thick[2] * row,
            STYLE.fallGold,
            dt
          )
        );
      masks(1, seg.mask, false);
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
    } else if (seg.plate === 0 && !teamDone) {
      teamDone = true;
      if (whole)
        inSeat(lit(F.level[0]), () =>
          drawFalls(
            ctx,
            S,
            W.falls[0],
            whole.lift[0],
            whole.lift[1],
            whole.lift[1] - whole.lift[0] - W.thick[1] * row,
            STYLE.fallGreen,
            dt
          )
        );
      masks(0, seg.mask, false);
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
 * the whole stack stands on, so both may be handed the frame's own step.
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
  for (const ctx of seat ? [seat, flight] : [flight]) {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
  }
  if (seat && (F.state === "opening" || F.state === "hop1"))
    draw(seat, W, F, t, dt, P.palette, w, "seat");
  draw(flight, W, F, t, dt, P.palette, w, seat ? "flight" : "both");
}
