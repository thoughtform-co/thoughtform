/**
 * lib/musings/rackMath — the jukebox's geometry (ADR-119). Pure, three-free.
 *
 * The owner's ask: the post in view faces the reader, the others sit beside
 * it ROTATED ABOUT THE VERTICAL AXIS so their sides show — "a jukebox or
 * rotodex where you can scroll through the different blog posts", so it reads
 * as flipping through a digital folder.
 *
 * ⚠ THE SLOT TABLE IS LIFTED FROM `components/landing/latent-cases/
 * CaseOrbitStage.tsx`, WHICH IS ARCHIVED PROTOTYPE CODE. That drawing already
 * solved this exact composition in CSS 3D (`DepthGatewayScene/index.tsx`
 * calls it "the archived latent-cases topology"; its only consumer is
 * `/test/latent-cases`). Three things changed on the way over, each for a
 * stated reason:
 *
 *   1. ⚠ **THE RACK IS FIVE CARDS DEEP, NOT THREE.** The lift's table handles
 *      `d ∈ {0, ±1}` and drops everything else to `translateZ: -800` at
 *      opacity 0 — three visible cards, which reads as a triptych rather than
 *      a rack. A `|d| === 2` rung is what makes it a pile you are flipping
 *      through, which is the whole of the ask.
 *   2. ⚠ **IT IS DATA, NOT A RENDER.** The lift's `useLatentCaseScroll` calls
 *      `setState` inside a rAF on every scroll event — a React re-render per
 *      frame across every card. ADR-002's law is ONE writer publishing CSS
 *      custom properties, and this station sits two stations under a live
 *      WebGL corridor. So the geometry is emitted as a transform STRING the
 *      writer assigns, and nothing here touches React.
 *   3. The `reduceMotion` branch is gone. The lift collapsed to a single
 *      visible card; a reading surface degrades to a LIST (see `musings.css`).
 *
 * Everything else — the wrap, the stacked exit plane the rack assembles out
 * of, the per-card entry stagger, the arrival blur — is the lift's, because
 * it is already the answer to "come into view when you scroll away from the
 * era section".
 */
import { clamp01, lerp, smoothstep } from "@/lib/math";

/** A card's resting pose in the rack, by signed distance from the front. */
export interface RackSlot {
  /** `translateX` as a percentage of the card's own width. */
  xPercent: number;
  /** `translateZ`, in px of the rig's perspective space. */
  z: number;
  /** `rotateY`, in degrees. */
  rotY: number;
  scale: number;
  opacity: number;
  /** `brightness()` multiplier — 1 is untouched. */
  dim: number;
  zIndex: number;
}

/** The pose a card is interpolated from — the stacked plane, before the fan. */
export const RACK_ORIGIN = {
  xPercent: 0,
  z: -260,
  rotY: 0,
  scale: 0.34,
} as const;

/** How many cards either side of the front one are drawn. */
export const RACK_DEPTH = 2;

/**
 * Signed distance from the front card, wrapped, so a rack of N reads as a
 * loop rather than a strip with two ends.
 *
 * ⚠ THE TIE AT EXACTLY `n / 2` RESOLVES ONE WAY, AND IT HAS TO. With an even
 * count the card opposite the front is equidistant both ways; `> n / 2` sends
 * it to the negative side, so the pose is a function of `(i, active)` alone
 * and never of which comparison ran first. Both sides are past `RACK_DEPTH`
 * at any N this station will hold, so the choice is invisible — but a rack
 * whose far card flickered between two identical hidden poses would still be
 * a bug nothing could explain.
 */
export function wrapDistance(i: number, active: number, n: number): number {
  if (n <= 0) return 0;
  let d = i - active;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

/**
 * The resting slot for a signed distance.
 *
 * Sign convention: `d < 0` is a card BEFORE the front one, seated to the
 * LEFT, and it rotates POSITIVE about Y — which brings its right edge
 * forward, i.e. the side cards angle to face the centre. That is the whole
 * reason the rack reads as a rack and not as a row of flat cards.
 */
export function rackSlot(d: number): RackSlot {
  const side = Math.sign(d);
  const a = Math.abs(d);

  if (a === 0) return { xPercent: 0, z: 80, rotY: 0, scale: 1, opacity: 1, dim: 1, zIndex: 30 };

  if (a === 1)
    return {
      xPercent: side * 104,
      z: -200,
      rotY: -side * 44,
      scale: 0.84,
      opacity: 0.74,
      dim: 0.8,
      zIndex: 20,
    };

  if (a === 2)
    return {
      xPercent: side * 178,
      z: -420,
      rotY: -side * 56,
      scale: 0.7,
      opacity: 0.4,
      dim: 0.62,
      zIndex: 10,
    };

  /* Past the rack's depth: parked behind, drawn at zero. Kept on the same
     side it left on, so a card entering the rack travels in rather than
     fading in on the spot. */
  return {
    xPercent: side * 210,
    z: -760,
    rotY: -side * 60,
    scale: 0.58,
    opacity: 0,
    dim: 0.5,
    zIndex: 1,
  };
}

/** The pose a card is actually drawn at, given the two arrival clocks. */
export interface RackPose {
  /** Ready for `element.style.transform`. */
  transform: string;
  opacity: number;
  /** Ready for `element.style.filter`, or `"none"`. */
  filter: string;
  zIndex: number;
}

/**
 * Compose a card's pose.
 *
 * `entry` is the rack assembling out of the stacked plane (the station's
 * arrival); `fan` is the side cards opening out of it once the front one has
 * landed. Both are `[0, 1]` and both are pure functions of scroll, so
 * scrolling back unwinds exactly — ADR-021, and the reason nothing here
 * keeps state.
 *
 * ⚠ THE FRONT CARD DOES NOT WAIT FOR THE FAN. It travels on `entry` alone and
 * `fan` opens the rack around it, which is what makes the beat read as one
 * object arriving and then revealing what is behind it, rather than five
 * objects arriving together.
 */
export function rackPose(d: number, entry: number, fan: number): RackPose {
  const slot = rackSlot(d);
  const a = Math.abs(d);

  /* The nearer cards land first. The lift's 0.07 a step, kept. */
  const stagger = a * 0.07;
  const e = clamp01((clamp01(entry) - stagger) / Math.max(0.001, 1 - stagger));

  /* The front card is seated by `entry`; a side card's seat opens on `fan`. */
  const seat = a === 0 ? 1 : smoothstep(0.08, 1, clamp01(fan));
  const t = e * seat;

  const x = lerp(RACK_ORIGIN.xPercent, slot.xPercent, t);
  const z = lerp(RACK_ORIGIN.z, slot.z, t);
  const rotY = lerp(RACK_ORIGIN.rotY, slot.rotY, t);
  const scale = lerp(RACK_ORIGIN.scale, slot.scale, t);

  const opacity =
    lerp(0, slot.opacity, smoothstep(0.04, 0.42, e)) *
    (a === 0 ? 1 : smoothstep(0.05, 0.38, clamp01(fan)));

  /* Arrival blur, resolving into the slot's own dim. A card is out of focus
     only while it is still travelling — past 0.9 it takes its resting look,
     so the rack at rest carries no filter it does not need. */
  const filter =
    e < 0.9
      ? `blur(${((1 - e) * 2.8).toFixed(2)}px) brightness(${(0.72 + e * 0.28).toFixed(2)})`
      : slot.dim === 1
        ? "none"
        : `brightness(${slot.dim.toFixed(2)})`;

  return {
    transform: [
      "translate(-50%, -50%)",
      `translateX(${x.toFixed(2)}%)`,
      `translateZ(${z.toFixed(1)}px)`,
      `rotateY(${rotY.toFixed(2)}deg)`,
      `scale(${scale.toFixed(3)})`,
    ].join(" "),
    opacity,
    filter,
    zIndex: slot.zIndex,
  };
}

/**
 * The front card for a rack clock.
 *
 * ⚠ IT IS A DETENT, BY THE OWNER'S RULING — "each scroll step advances one
 * card" — so the index is ROUNDED and the travel between two cards is a CSS
 * transition on the card, not a scrubbed angle. A continuously scrubbed rack
 * was offered beside it and refused: the centre card is never quite still,
 * which is the one thing a card carrying a title and a summary has to be.
 */
export function rackIndex(i: number, n: number): number {
  if (n <= 0) return 0;
  return Math.min(n - 1, Math.max(0, Math.round(i)));
}

/**
 * The rack's clock, from the station's own progress.
 *
 * `entry` assembles the rack, `fan` opens it, `index` is the fractional
 * card position the detent rounds. The windows are fractions of the pinned
 * travel, so the runway's length is a dial and never a re-tune of these.
 */
export interface RackClock {
  entry: number;
  fan: number;
  index: number;
  /** The whole-rack idle yaw, in degrees — the lift's own ±3°. */
  drift: number;
}

export const RACK_ENTRY = [0.0, 0.16] as const;
export const RACK_FAN = [0.1, 0.28] as const;
export const RACK_READ = [0.24, 0.94] as const;

export function rackClock(p: number, n: number): RackClock {
  const t = clamp01(p);
  const entry = smoothstep(RACK_ENTRY[0], RACK_ENTRY[1], t);
  const fan = smoothstep(RACK_FAN[0], RACK_FAN[1], t);

  /* The reading band is divided by the GAPS between cards, not by the cards:
     n cards have n − 1 steps, so the first card is seated for the whole
     approach and the last one holds to the end of the band. */
  const read = clamp01((t - RACK_READ[0]) / Math.max(0.001, RACK_READ[1] - RACK_READ[0]));
  const index = read * Math.max(0, n - 1);

  const drift = (read - 0.5) * 6 * smoothstep(0.85, 1, entry) * smoothstep(0.2, 1, fan);

  return { entry, fan, index, drift };
}
