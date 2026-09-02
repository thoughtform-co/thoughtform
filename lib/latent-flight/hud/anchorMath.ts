/**
 * lib/latent-flight/hud/anchorMath — the glass HUD's arithmetic, three-free.
 *
 * `ndcToScreen` turns a projected point into CSS px; `clampToFrame` pins an
 * off-screen point to the frame's inner rectangle and says which edge it
 * hit, so a waypoint behind or beside the vessel becomes an edge marker
 * rather than vanishing; `quartile` sizes a mark by range.
 */

export interface FrameRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function ndcToScreen(nx: number, ny: number, w: number, h: number): [number, number] {
  return [(nx * 0.5 + 0.5) * w, (0.5 - ny * 0.5) * h];
}

export type Edge = "left" | "right" | "top" | "bottom" | null;

export interface Pinned {
  x: number;
  y: number;
  edge: Edge;
}

/**
 * Pin a point to `frame` when it lies outside it (or behind the camera,
 * `behind` = true, in which case the point is mirrored through the centre
 * first so it lands on the edge opposite its true direction, the way a
 * target behind you sits at the bottom of a HUD).
 */
export function clampToFrame(x: number, y: number, behind: boolean, frame: FrameRect): Pinned {
  const cx = (frame.left + frame.right) / 2;
  const cy = (frame.top + frame.bottom) / 2;
  let px = x;
  let py = y;
  if (behind) {
    px = cx - (x - cx);
    py = cy - (y - cy);
    // A point behind the camera projects mirrored; a mark for it always
    // pins to the frame, never floats in the field.
    const dx = px - cx;
    const dy = py - cy;
    const scale = Math.max(Math.abs(dx) / (frame.right - cx), Math.abs(dy) / (frame.bottom - cy), 1e-6);
    px = cx + dx / scale;
    py = cy + dy / scale;
  }
  const inside = px >= frame.left && px <= frame.right && py >= frame.top && py <= frame.bottom;
  if (inside && !behind) return { x: px, y: py, edge: null };
  const dx = px - cx;
  const dy = py - cy;
  const sx = Math.abs(dx) / Math.max(1e-6, frame.right - cx);
  const sy = Math.abs(dy) / Math.max(1e-6, frame.bottom - cy);
  const s = Math.max(sx, sy, 1e-6);
  const ex = cx + dx / s;
  const ey = cy + dy / s;
  const edge: Edge =
    sx >= sy ? (dx >= 0 ? "right" : "left") : dy >= 0 ? "bottom" : "top";
  return { x: Math.min(frame.right, Math.max(frame.left, ex)), y: Math.min(frame.bottom, Math.max(frame.top, ey)), edge };
}

/** 0 (nearest quarter) … 3 (farthest) of a normalised range. */
export function quartile(range: number): 0 | 1 | 2 | 3 {
  if (range < 0.25) return 0;
  if (range < 0.5) return 1;
  if (range < 0.75) return 2;
  return 3;
}

/** Diamond size in px by range quartile — weight by distance, no colour. */
export const MARK_SIZE_PX: readonly [number, number, number, number] = [12, 10, 8, 6];

/** Exponential approach with a time constant, frame-rate independent. */
export function damp(current: number, target: number, tauS: number, dt: number): number {
  const k = 1 - Math.exp(-dt / Math.max(1e-6, tauS));
  return current + (target - current) * k;
}
