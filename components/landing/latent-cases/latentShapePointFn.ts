/**
 * Geometric contour sampler for the latent portal particle stack.
 * Duplicated from `components/gateway/ThreeGateway.tsx` (lines ~290–423) so the
 * hero `ThreeGateway` stays untouched; keep in sync if contour math changes.
 */
import { type GatewayShape, GATEWAY_SHAPE_IS_ATTRACTOR } from "@/lib/particle-config";

export type ShapePointFn = (t: number, radius: number) => { x: number; y: number };

function isAttractorShape(shape: GatewayShape): boolean {
  return GATEWAY_SHAPE_IS_ATTRACTOR[shape] ?? false;
}

const geometricShapeGenerators: Record<string, ShapePointFn> = {
  circle: (t, radius) => ({
    x: Math.cos(t * Math.PI * 2) * radius,
    y: Math.sin(t * Math.PI * 2) * radius,
  }),

  hexagon: (t, radius) => {
    const sides = 6;
    const segment = Math.floor(t * sides) % sides;
    const segmentT = (t * sides) % 1;

    const angle1 = (segment / sides) * Math.PI * 2 - Math.PI / 2;
    const angle2 = ((segment + 1) / sides) * Math.PI * 2 - Math.PI / 2;

    const x1 = Math.cos(angle1) * radius;
    const y1 = Math.sin(angle1) * radius;
    const x2 = Math.cos(angle2) * radius;
    const y2 = Math.sin(angle2) * radius;

    return {
      x: x1 + (x2 - x1) * segmentT,
      y: y1 + (y2 - y1) * segmentT,
    };
  },

  octagon: (t, radius) => {
    const sides = 8;
    const segment = Math.floor(t * sides) % sides;
    const segmentT = (t * sides) % 1;

    const angle1 = (segment / sides) * Math.PI * 2 - Math.PI / 8;
    const angle2 = ((segment + 1) / sides) * Math.PI * 2 - Math.PI / 8;

    const x1 = Math.cos(angle1) * radius;
    const y1 = Math.sin(angle1) * radius;
    const x2 = Math.cos(angle2) * radius;
    const y2 = Math.sin(angle2) * radius;

    return {
      x: x1 + (x2 - x1) * segmentT,
      y: y1 + (y2 - y1) * segmentT,
    };
  },

  diamond: (t, radius) => {
    const sides = 4;
    const segment = Math.floor(t * sides) % sides;
    const segmentT = (t * sides) % 1;

    const points = [
      { x: 0, y: radius },
      { x: radius, y: 0 },
      { x: 0, y: -radius },
      { x: -radius, y: 0 },
    ];

    const p1 = points[segment]!;
    const p2 = points[(segment + 1) % 4]!;

    return {
      x: p1.x + (p2.x - p1.x) * segmentT,
      y: p1.y + (p2.y - p1.y) * segmentT,
    };
  },

  arch: (t, radius) => {
    const archHeight = radius * 1.3;
    const archWidth = radius * 0.8;

    if (t < 0.5) {
      const archT = t / 0.5;
      const angle = Math.PI - archT * Math.PI;
      return {
        x: Math.cos(angle) * archWidth,
        y: Math.sin(angle) * archWidth + (archHeight - archWidth),
      };
    } else if (t < 0.65) {
      const sideT = (t - 0.5) / 0.15;
      return {
        x: archWidth,
        y: (archHeight - archWidth) * (1 - sideT) - archHeight * 0.3,
      };
    } else if (t < 0.85) {
      const bottomT = (t - 0.65) / 0.2;
      return {
        x: archWidth - bottomT * archWidth * 2,
        y: -archHeight * 0.3,
      };
    } else {
      const sideT = (t - 0.85) / 0.15;
      return {
        x: -archWidth,
        y: -archHeight * 0.3 + sideT * (archHeight - archWidth + archHeight * 0.3),
      };
    }
  },

  ellipse: (t, radius) => ({
    x: Math.cos(t * Math.PI * 2) * radius * 1.4,
    y: Math.sin(t * Math.PI * 2) * radius * 0.75,
  }),

  thoughtformGateway1: (t, radius) => ({
    x: Math.cos(t * Math.PI * 2) * radius,
    y: Math.sin(t * Math.PI * 2) * radius,
  }),
};

export function getShapeGenerator(shape: GatewayShape): ShapePointFn {
  if (isAttractorShape(shape)) {
    return geometricShapeGenerators.circle!;
  }
  const key = shape as keyof typeof geometricShapeGenerators;
  return geometricShapeGenerators[key] ?? geometricShapeGenerators.circle!;
}
