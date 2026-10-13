/* The stack's arrival into Navigate, Encode, Build, as arithmetic. PURE.

   The stack sits closed and centred in the section above (`StackHero`, the
   donor). As the steps' runway rises through the screen the RECEIVER draws
   it, out of its own box, on the way from the donor's seat to its own: the
   pattern `NetworkPlug` uses to take the stack over one section later, and
   simpler here, because donor and receiver share one projection. Only three
   things change on the way: where the stack is, how large, and how far
   apart its plates are. It arrives OPENED, which is the receiver's own state
   at the top of its pin, so everything after the arrival is unchanged.

   `q` is the arrival's clock: 0 when the runway's top is at the bottom of
   the screen, 1 when it reaches the top and pins. */

/** The stack's own numbers, shared by the donor and the receiver. They are
    `EmbedStack`'s (`makeIso(26, 350, 70)`, plates 8 units square). */
export const STACK = {
  /** The drawing's viewBox width in `EmbedStack`. */
  vbW: 700,
  unit: 26,
  ox: 350,
  oy: 70,
  /** The plates' pitch when the stack is closed. */
  closed: 72,
  /** The point the pose is stated for: the team plate's top-face centre. */
  ref: [350, 70 + 8 * 0.5 * 26] as const,
} as const;

/** The donor's crop of that drawing: the closed stack with a little air.
    One unit here is one unit in `EmbedStack`'s drawing. */
export const HERO_BOX = { x: 138, y: 22, w: 424, h: 424 } as const;

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
/** `iso.ts`'s ease, restated so this module imports nothing. */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** The arrival's clock from the runway's top edge and the screen's height. */
export const arrivalQ = (runwayTop: number, vh: number) => clamp01(1 - runwayTop / vh);

/** A seat: where the reference point is on screen, and the drawing's scale
    there (screen pixels per drawing unit). */
export interface Seat {
  x: number;
  y: number;
  k: number;
}

export interface Arrival {
  /** The plates' pitch, from closed to the receiver's open gap. */
  gap: number;
  /** Where the reference point is on screen, and at what scale. */
  seat: Seat;
  /** The eased clock. */
  e: number;
}

/**
 * The stack on its way: at `q = 0` it is the donor's (closed, at `from`), at
 * `q = 1` the receiver's own top-of-pin state (open, at `to`).
 */
export function arrive(q: number, from: Seat, to: Seat, open: number): Arrival {
  const e = ease(clamp01(q));
  return {
    e,
    gap: lerp(STACK.closed, open, e),
    seat: { x: lerp(from.x, to.x, e), y: lerp(from.y, to.y, e), k: lerp(from.k, to.k, e) },
  };
}

/**
 * The transform that puts the reference point on `seat`, for a group inside
 * a drawing whose own origin is at `origin` on screen at scale `k`:
 * `translate(tx ty) scale(s)`, in the drawing's units. At the receiver's own
 * seat it is the identity.
 */
export function poseIn(seat: Seat, origin: { x: number; y: number }, k: number) {
  const s = seat.k / k;
  return {
    s,
    tx: (seat.x - origin.x) / k - s * STACK.ref[0],
    ty: (seat.y - origin.y) / k - s * STACK.ref[1],
  };
}
