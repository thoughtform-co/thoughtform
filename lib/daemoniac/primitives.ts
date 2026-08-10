// ═══════════════════════════════════════════════════════════════════
// DAEMONIAC — primitive geometry. Every mark knows its own length, any
// point along itself, and its SVG path — which is what lets the same
// composition drive both the plate renderer and the analytic particle
// sampler with no rasterization step (SSR-pure, deterministic).
// ═══════════════════════════════════════════════════════════════════

import type { MarkPrimitive, QuadMark } from "./types";

/** Fixed 8-point Gauss–Legendre nodes/weights on [0, 1] — deterministic
 *  quad arc length with no adaptive iteration. */
const GL8_T = [
  0.0198550717512319, 0.1016667612931866, 0.2372337950418355, 0.4082826787521751,
  0.5917173212478249, 0.7627662049581645, 0.8983332387068134, 0.9801449282487681,
] as const;
const GL8_W = [
  0.0506142681451881, 0.1111905172266872, 0.1568533229389436, 0.181341891689181, 0.181341891689181,
  0.1568533229389436, 0.1111905172266872, 0.0506142681451881,
] as const;

function quadDerivative(q: QuadMark, t: number): readonly [number, number] {
  // B'(t) = 2(1-t)(C-P1) + 2t(P2-C)
  const dx = 2 * (1 - t) * (q.cx - q.x1) + 2 * t * (q.x2 - q.cx);
  const dy = 2 * (1 - t) * (q.cy - q.y1) + 2 * t * (q.y2 - q.cy);
  return [dx, dy];
}

export function primitiveLength(p: MarkPrimitive): number {
  switch (p.kind) {
    case "circle":
      return 2 * Math.PI * p.r;
    case "arc":
      return p.r * Math.abs(p.a1 - p.a0);
    case "line":
      return Math.hypot(p.x2 - p.x1, p.y2 - p.y1);
    case "quad": {
      let len = 0;
      for (let i = 0; i < GL8_T.length; i++) {
        const [dx, dy] = quadDerivative(p, GL8_T[i]);
        len += GL8_W[i] * Math.hypot(dx, dy);
      }
      return len;
    }
  }
}

/** Point at normalized position t ∈ [0, 1] along the primitive, in the
 *  primitive's own draw direction (circles start at `phase`). */
export function primitivePoint(p: MarkPrimitive, t: number): readonly [number, number] {
  switch (p.kind) {
    case "circle": {
      const a = p.phase + t * 2 * Math.PI;
      return [p.cx + p.r * Math.cos(a), p.cy + p.r * Math.sin(a)];
    }
    case "arc": {
      const a = p.a0 + t * (p.a1 - p.a0);
      return [p.cx + p.r * Math.cos(a), p.cy + p.r * Math.sin(a)];
    }
    case "line":
      return [p.x1 + t * (p.x2 - p.x1), p.y1 + t * (p.y2 - p.y1)];
    case "quad": {
      const u = 1 - t;
      return [
        u * u * p.x1 + 2 * u * t * p.cx + t * t * p.x2,
        u * u * p.y1 + 2 * u * t * p.cy + t * t * p.y2,
      ];
    }
  }
}

/** Unit tangent at t (finite ratios are exact for these primitives). */
export function primitiveTangent(p: MarkPrimitive, t: number): readonly [number, number] {
  let dx: number;
  let dy: number;
  switch (p.kind) {
    case "circle": {
      const a = p.phase + t * 2 * Math.PI;
      dx = -Math.sin(a);
      dy = Math.cos(a);
      break;
    }
    case "arc": {
      const a = p.a0 + t * (p.a1 - p.a0);
      dx = -Math.sin(a);
      dy = Math.cos(a);
      break;
    }
    case "line":
      dx = p.x2 - p.x1;
      dy = p.y2 - p.y1;
      break;
    case "quad":
      [dx, dy] = quadDerivative(p, t);
      break;
  }
  const m = Math.hypot(dx, dy) || 1;
  return [dx / m, dy / m];
}

const fmt = (n: number): string => {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? "0" : String(r);
};

/** SVG path `d` for one primitive. */
export function primitiveD(p: MarkPrimitive): string {
  switch (p.kind) {
    case "circle": {
      // Two half arcs from `phase` so a full circle serializes cleanly.
      const [sx, sy] = primitivePoint(p, 0);
      const [mx, my] = primitivePoint(p, 0.5);
      const r = fmt(p.r);
      return `M ${fmt(sx)} ${fmt(sy)} A ${r} ${r} 0 1 1 ${fmt(mx)} ${fmt(my)} A ${r} ${r} 0 1 1 ${fmt(sx)} ${fmt(sy)}`;
    }
    case "arc": {
      const [sx, sy] = primitivePoint(p, 0);
      const [ex, ey] = primitivePoint(p, 1);
      const sweep = Math.abs(p.a1 - p.a0);
      const large = sweep > Math.PI ? 1 : 0;
      const r = fmt(p.r);
      return `M ${fmt(sx)} ${fmt(sy)} A ${r} ${r} 0 ${large} 1 ${fmt(ex)} ${fmt(ey)}`;
    }
    case "line":
      return `M ${fmt(p.x1)} ${fmt(p.y1)} L ${fmt(p.x2)} ${fmt(p.y2)}`;
    case "quad":
      return `M ${fmt(p.x1)} ${fmt(p.y1)} Q ${fmt(p.cx)} ${fmt(p.cy)} ${fmt(p.x2)} ${fmt(p.y2)}`;
  }
}

/** Translate + uniform-scale a primitive (glyph placement). Weights are
 *  NOT scaled — they stay in the enumerated stroke set. */
export function transformPrimitive(
  p: MarkPrimitive,
  dx: number,
  dy: number,
  s: number
): MarkPrimitive {
  switch (p.kind) {
    case "circle":
      return { ...p, cx: p.cx * s + dx, cy: p.cy * s + dy, r: p.r * s };
    case "arc":
      return { ...p, cx: p.cx * s + dx, cy: p.cy * s + dy, r: p.r * s };
    case "line":
      return {
        ...p,
        x1: p.x1 * s + dx,
        y1: p.y1 * s + dy,
        x2: p.x2 * s + dx,
        y2: p.y2 * s + dy,
      };
    case "quad":
      return {
        ...p,
        x1: p.x1 * s + dx,
        y1: p.y1 * s + dy,
        cx: p.cx * s + dx,
        cy: p.cy * s + dy,
        x2: p.x2 * s + dx,
        y2: p.y2 * s + dy,
      };
  }
}
