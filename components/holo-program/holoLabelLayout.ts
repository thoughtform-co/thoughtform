/**
 * holoLabelLayout — where the seven station labels go, given where the rings
 * currently are.
 *
 * ⚠ THREE-FREE AND PURE, so the page, the lab AND a unit test all call the
 * same function. ADR-080 records twice that a harness whose composition
 * differs from production's is measuring a different drawing; the label
 * placement is the part of this beat most likely to drift that way, because
 * a collision only shows at one viewport in one pose.
 *
 * ⚠ THE DECLUTTER IS A MECHANISM, NOT A SAFETY NET. Measured at the shipping
 * shapes: the tightest same-lane pitch is ~155px at 1280×720 against a 147px
 * block, and `anchorAngle`'s own lean moves an anchor ±17px — so two labels
 * genuinely overlap at rest, before anyone turns anything. Pushing them apart
 * and letting the leader line carry the displacement is what makes seven
 * two-line labels fit a frame at all. It is deterministic and stateless, so
 * the same anchors always give the same layout.
 */

import type { HoloAnchor } from "./holoAnchorsRef";

export interface LabelMetrics {
  /** The label block's own box, in CSS pixels. */
  blockW: number;
  blockH: number;
  /** How far the block stands off its ring's rim, along the rim normal. */
  standOff: number;
  /** Keep-out from the canvas edges. */
  pad: number;
}

export interface LabelBox {
  id: string;
  /** The block's CENTRE, in canvas pixels. */
  x: number;
  y: number;
  /** The rim anchor the leader line runs back to. */
  ax: number;
  ay: number;
  side: "up" | "dn";
  frontness: number;
  visible: boolean;
  /** How far the declutter had to move it — for a guard, and for a readout. */
  pushed: number;
}

/** The label metrics at a given canvas width, mirroring the CSS clamps so the
 *  arithmetic and the stylesheet cannot disagree about the block's size. */
export function labelMetrics(width: number): LabelMetrics {
  const w = clamp(140, 0.115 * width, 200);
  return {
    blockW: w,
    // Two lines (date + name), the name wrapping at most twice.
    blockH: Math.round(clamp(46, 0.042 * width, 62)),
    standOff: Math.round(clamp(22, 0.017 * width, 32)),
    pad: 10,
  };
}

function clamp(lo: number, v: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Place the seven blocks.
 *
 * The anchor is a point on its ring's rim; the block stands off it along the
 * rim's own outward normal (`nx`/`ny`, published by the scene) so the label
 * leaves the object rather than floating over it. Then one declutter pass per
 * lane, then a clamp into the canvas.
 */
export function layoutHoloLabels(
  anchors: readonly HoloAnchor[],
  canvas: { w: number; h: number },
  m: LabelMetrics
): LabelBox[] {
  const boxes: LabelBox[] = anchors.map((a) => {
    const ax = a.x * canvas.w;
    const ay = a.y * canvas.h;
    /* The normal is published in screen space; fall back to straight up/down
       so a scene that has not published one yet still lays out sanely. */
    const nx = a.nx ?? 0;
    const ny = a.ny ?? (a.side === "up" ? -1 : 1);
    const nl = Math.hypot(nx, ny) || 1;
    const off = m.standOff + m.blockH / 2;
    return {
      id: a.id,
      x: ax + (nx / nl) * off,
      y: ay + (ny / nl) * off,
      ax,
      ay,
      side: a.side,
      frontness: a.frontness,
      visible: a.visible,
      pushed: 0,
    };
  });

  /* ── Declutter, per lane ────────────────────────────────────────────────
     Four sweeps of "if two neighbours are closer than a block plus a gap,
     push both apart by half the overlap". The FRONT label holds its ground,
     so a name in front of the core never gets shoved by one behind it. */
  for (const side of ["up", "dn"] as const) {
    const lane = boxes.filter((b) => b.side === side && b.visible).sort((p, q) => p.x - q.x);
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 1; i < lane.length; i++) {
        const a = lane[i - 1];
        const b = lane[i];
        const need = m.blockW + 10;
        const gap = b.x - a.x;
        if (gap >= need) continue;
        const push = (need - gap) / 2;
        /* Weight the shove toward the label that is further back, so the
           front one keeps the slot its ring earned. */
        const wA = b.frontness >= a.frontness ? 1.4 : 0.6;
        const wB = 2 - wA;
        a.x -= push * wA;
        b.x += push * wB;
        a.pushed += push * wA;
        b.pushed += push * wB;
      }
    }
  }

  /* ── Into the frame ─────────────────────────────────────────────────────
     A label may leave its ring; it may not leave the canvas. */
  const halfW = m.blockW / 2;
  const halfH = m.blockH / 2;
  for (const b of boxes) {
    const x = clamp(halfW + m.pad, b.x, canvas.w - halfW - m.pad);
    const y = clamp(halfH + m.pad, b.y, canvas.h - halfH - m.pad);
    b.pushed += Math.abs(x - b.x) + Math.abs(y - b.y);
    b.x = x;
    b.y = y;
  }
  return boxes;
}

/** Do any two visible blocks overlap? The guard's question, in one place. */
export function labelCollisions(boxes: readonly LabelBox[], m: LabelMetrics): string[] {
  const hits: string[] = [];
  const live = boxes.filter((b) => b.visible);
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const a = live[i];
      const b = live[j];
      if (Math.abs(a.x - b.x) < m.blockW && Math.abs(a.y - b.y) < m.blockH) {
        hits.push(`${a.id}/${b.id}`);
      }
    }
  }
  return hits;
}
