/**
 * Thoughtform Geometric Shape Generators
 * 
 * Three-layer system:
 * - Domain = Base polygon
 * - Role = Structural modifier
 * - Orbital = Surrounding elements
 */

export interface ShapePoint {
  x: number;
  y: number;
  alpha?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN BASE SHAPES
// ═══════════════════════════════════════════════════════════════════════════

function interpolateEdges(vertices: ShapePoint[], pointsPerEdge: number): ShapePoint[] {
  const points: ShapePoint[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const start = vertices[i];
    const end = vertices[(i + 1) % vertices.length];
    for (let j = 1; j <= pointsPerEdge; j++) {
      const t = j / (pointsPerEdge + 1);
      points.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        alpha: 0.7,
      });
    }
  }
  return points;
}

export function trianglePoints(radius: number = 12): ShapePoint[] {
  const points: ShapePoint[] = [];
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      alpha: 1.0,
    });
  }
  const edgePoints = interpolateEdges(points, 4);
  return [...points, ...edgePoints];
}

export function squarePoints(radius: number = 12, rotated: boolean = true): ShapePoint[] {
  const points: ShapePoint[] = [];
  const offset = rotated ? Math.PI / 4 : 0;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + offset;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      alpha: 1.0,
    });
  }
  const edgePoints = interpolateEdges(points, 3);
  return [...points, ...edgePoints];
}

export function pentagonPoints(radius: number = 12): ShapePoint[] {
  const points: ShapePoint[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      alpha: 1.0,
    });
  }
  const edgePoints = interpolateEdges(points, 3);
  return [...points, ...edgePoints];
}

export function hexagonPoints(radius: number = 12): ShapePoint[] {
  const points: ShapePoint[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      alpha: 1.0,
    });
  }
  const edgePoints = interpolateEdges(points, 2);
  return [...points, ...edgePoints];
}

// ═══════════════════════════════════════════════════════════════════════════
// ROLE MODIFIERS
// ═══════════════════════════════════════════════════════════════════════════

export function centerDot(): ShapePoint[] {
  return [{ x: 0, y: 0, alpha: 1.0 }];
}

export function innerRing(radius: number = 5, segments: number = 8): ShapePoint[] {
  const points: ShapePoint[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      alpha: 0.6,
    });
  }
  return points;
}

export function crossAxis(size: number = 8): ShapePoint[] {
  const points: ShapePoint[] = [];
  const step = 3;
  for (let i = -size; i <= size; i += step) {
    if (i !== 0) {
      points.push({ x: i, y: 0, alpha: 0.7 });
      points.push({ x: 0, y: i, alpha: 0.7 });
    }
  }
  return points;
}

export function diagonalAxis(size: number = 8): ShapePoint[] {
  const points: ShapePoint[] = [];
  const step = 3;
  for (let i = -size; i <= size; i += step) {
    if (i !== 0) {
      points.push({ x: i, y: i, alpha: 0.7 });
      points.push({ x: i, y: -i, alpha: 0.7 });
    }
  }
  return points;
}

export function bracketCorners(size: number = 10): ShapePoint[] {
  const points: ShapePoint[] = [];
  const len = 4;
  const positions = [
    { x: -1, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 1 },
    { x: 1, y: 1 },
  ];
  
  positions.forEach(({ x: dx, y: dy }) => {
    const cx = dx * size * 0.8;
    const cy = dy * size * 0.8;
    points.push({ x: cx, y: cy, alpha: 0.9 });
    points.push({ x: cx - dx * len, y: cy, alpha: 0.9 });
    points.push({ x: cx, y: cy - dy * len, alpha: 0.9 });
  });
  
  return points;
}

export function radialSpokes(innerRadius: number = 10, outerRadius: number = 14, count: number = 4): ShapePoint[] {
  const points: ShapePoint[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    points.push({
      x: Math.cos(angle) * innerRadius,
      y: Math.sin(angle) * innerRadius,
      alpha: 0.6,
    });
    points.push({
      x: Math.cos(angle) * outerRadius,
      y: Math.sin(angle) * outerRadius,
      alpha: 0.4,
    });
  }
  return points;
}

export function orbitalDots(radius: number = 14, count: number = 3, offset: number = 0): ShapePoint[] {
  const points: ShapePoint[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + offset;
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      alpha: 0.5,
    });
  }
  return points;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES & DISPATCH
// ═══════════════════════════════════════════════════════════════════════════

export type DomainShapeType = 'triangle' | 'square' | 'pentagon' | 'hexagon';
export type RoleModifierType = 'none' | 'center' | 'inner-ring' | 'cross' | 'diagonal' | 'brackets';
export type OrbitalType = 'none' | 'dots-3' | 'dots-4' | 'dots-6' | 'spokes';

export function generateDomainShape(shape: DomainShapeType, radius: number = 12): ShapePoint[] {
  switch (shape) {
    case 'triangle': return trianglePoints(radius);
    case 'square': return squarePoints(radius, true);
    case 'pentagon': return pentagonPoints(radius);
    case 'hexagon': return hexagonPoints(radius);
    default: return squarePoints(radius, true);
  }
}

export function generateRoleModifier(modifier: RoleModifierType, radius: number = 10): ShapePoint[] {
  switch (modifier) {
    case 'none': return [];
    case 'center': return centerDot();
    case 'inner-ring': return innerRing(radius * 0.4);
    case 'cross': return crossAxis(radius * 0.6);
    case 'diagonal': return diagonalAxis(radius * 0.6);
    case 'brackets': return bracketCorners(radius);
    default: return [];
  }
}

export function generateOrbital(orbital: OrbitalType, radius: number = 14): ShapePoint[] {
  switch (orbital) {
    case 'none': return [];
    case 'dots-3': return orbitalDots(radius, 3);
    case 'dots-4': return orbitalDots(radius, 4, Math.PI / 4);
    case 'dots-6': return orbitalDots(radius, 6);
    case 'spokes': return radialSpokes(radius * 0.7, radius);
    default: return [];
  }
}

