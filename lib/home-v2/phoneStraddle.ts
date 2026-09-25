/**
 * phoneStraddle — the beats' seat lines on the phone, derived from the frame
 * (ADR-125 U1).
 *
 * On the phone each beat's title cluster hangs ABOVE the station line and its
 * caption card BELOW it, at a world-unit STRADDLE (`stationHeaderPosition`'s
 * `mobileStraddleY`). Those straddles were constants tuned at 390×844 — and
 * the clusters are fixed pixels while a world unit is `vh × 0.117` px at the
 * park, so the same constant put the Navigate title 93px under the top on
 * the toolbar-hidden frame and INSIDE the top chrome band on the
 * toolbar-showing one (≈676 tall, the small viewport the cell composes in).
 * The owner's read on the 844 frame: "so much unused space above and below".
 *
 * So the straddle is DERIVED: `useWorldDomTracker` projects each seated
 * anchor's base pose at its park once per resize, measures the cluster, and
 * solves the world-Y offset that puts the cluster's anchored edge on the
 * chrome band plus `PHONE_SEAT_AIR_PX`. `sceneGeom`'s anchors read the result
 * here with their old literal as the fallback (the first frame before a
 * derive, and the desktop, where nothing writes). The sphere's phone scale is
 * solved the same way — the largest ring that clears both clusters on the
 * tightest beat, capped — so it fills what the frame has, small frame or tall.
 *
 * ⚠ THREE-FREE AND DOM-FREE: pure arithmetic and a registry. The tracker does
 * the projecting and the measuring; `sceneGeom` only reads.
 */

/** Air between a cluster's anchored edge and its chrome band, px. The same
 *  air keeps the sphere's ring off both clusters. */
export const PHONE_SEAT_AIR_PX = 12;

export type PhoneSeatEdge = "top" | "bottom";

export interface PhoneStraddleInput {
  /** Which chrome band the cluster seats on. `top` is a `bottom-center`
   *  anchored title (its BOTTOM edge is the anchor), `bottom` a
   *  `top-center` anchored caption (its TOP edge is the anchor). */
  edge: PhoneSeatEdge;
  /** The projection cell's height, px (`100svh` on the phone). */
  vh: number;
  /** The chrome band plus the seat air, px from that edge of the cell. */
  seatLinePx: number;
  /** The cluster's UNSCALED box height, px (`offsetHeight`). */
  clusterPx: number;
  /** The tracker's perspective scale at the park (≈1.016 at 6.1 units). */
  scale: number;
  /** The station line — the anchor at straddle 0 — projected, px from the
   *  top of the cell. */
  centreY: number;
  /** Screen px per world unit of Y at the anchor's depth, positive. */
  pxPerUnit: number;
}

/** The world-Y straddle that seats the cluster's anchored edge on its band:
 *  positive above the station line (a title), negative below (a caption). */
export function phoneStraddleWorldY(a: PhoneStraddleInput): number {
  const anchoredY =
    a.edge === "top"
      ? a.seatLinePx + a.clusterPx * a.scale
      : a.vh - a.seatLinePx - a.clusterPx * a.scale;
  return (a.centreY - anchoredY) / a.pxPerUnit;
}

export interface PhoneSphereInput {
  /** From the sphere's projected centre to the nearer cluster edge, px. */
  halfBandPx: number;
  /** The sphere's outer ring, projected, at the BASE phone scale, px. */
  ringPxAtBase: number;
  /** The base phone scale (`MOBILE_GYRO_SPHERE_SCALE`) — the floor. */
  base: number;
  /** The cap (`MOBILE_GYRO_SPHERE_SCALE_MAX`). */
  max: number;
}

/** The largest sphere scale whose ring clears the band by the seat air,
 *  never under the base and never over the cap. */
export function phoneSphereScale(a: PhoneSphereInput): number {
  if (!(a.ringPxAtBase > 0) || !Number.isFinite(a.halfBandPx)) return a.base;
  const fit = a.base * ((a.halfBandPx - PHONE_SEAT_AIR_PX) / a.ringPxAtBase);
  return Math.min(a.max, Math.max(a.base, fit));
}

// ── The registry ────────────────────────────────────────────────────

const straddles = new Map<string, number>();
let sphereScale: number | null = null;

/** An anchor's derived straddle, or its literal until the tracker has
 *  measured the frame (and on the desktop, where nothing writes). */
export function readPhoneStraddle(id: string, fallback: number): number {
  return straddles.get(id) ?? fallback;
}

export function writePhoneStraddle(id: string, y: number): void {
  if (Number.isFinite(y)) straddles.set(id, y);
}

/** The solved sphere scale, or the base until the first derive. */
export function readPhoneSphereScale(fallback: number): number {
  return sphereScale ?? fallback;
}

export function writePhoneSphereScale(s: number): void {
  if (Number.isFinite(s)) sphereScale = s;
}

/** Test hook — the registry is module state. */
export function resetPhoneSeats(): void {
  straddles.clear();
  sphereScale = null;
}
