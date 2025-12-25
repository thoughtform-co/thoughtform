// ═══════════════════════════════════════════════════════════════════
// SIGIL GEOMETRY GENERATORS
// Generates point arrays for various sigil shapes
// Used by SigilCanvas for particle-based sigil rendering
// ═══════════════════════════════════════════════════════════════════

export type SigilShape =
  | "ring"
  | "torus"
  | "squareGrid"
  | "triangle"
  | "diamond"
  | "hexagon"
  | "spiral"
  | "star4"
  | "star5"
  | "star6"
  | "star8"
  | "cross"
  | "concentricRings"
  | "abstractBlob"
  | "brandmark"
  | "gateway"
  | "manifoldSlice";

export const SIGIL_SHAPE_LABELS: Record<SigilShape, string> = {
  ring: "Ring",
  torus: "Torus",
  squareGrid: "Square Grid",
  triangle: "Triangle",
  diamond: "Diamond",
  hexagon: "Hexagon",
  spiral: "Spiral",
  star4: "Star (4 points)",
  star5: "Star (5 points)",
  star6: "Star (6 points)",
  star8: "Star (8 points)",
  cross: "Cross",
  concentricRings: "Concentric Rings",
  abstractBlob: "Abstract Blob",
  brandmark: "Brandmark",
  gateway: "Gateway",
  manifoldSlice: "Manifold Slice",
};

export interface Point {
  x: number;
  y: number;
  alpha?: number; // Optional per-point alpha
}

export interface GeometryOptions {
  size: number; // Canvas size
  particleCount: number;
  seed?: number; // For deterministic randomness
}

// Seeded random number generator for deterministic shapes
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = Math.sin(s * 9999) * 10000;
    return s - Math.floor(s);
  };
}

// ═══════════════════════════════════════════════════════════════════
// GEOMETRIC PRIMITIVES
// ═══════════════════════════════════════════════════════════════════

export function generateRing(options: GeometryOptions): Point[] {
  const { size, particleCount, seed = 42 } = options;
  const random = seededRandom(seed);
  const points: Point[] = [];
  const center = size / 2;
  const radius = size * 0.35;
  const thickness = size * 0.08;

  for (let i = 0; i < particleCount; i++) {
    const angle = random() * Math.PI * 2;
    const r = radius + (random() - 0.5) * thickness;
    points.push({
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    });
  }
  return points;
}

export function generateTorus(options: GeometryOptions): Point[] {
  const { size, particleCount, seed = 42 } = options;
  const random = seededRandom(seed);
  const points: Point[] = [];
  const center = size / 2;
  const majorRadius = size * 0.3;
  const minorRadius = size * 0.12;

  for (let i = 0; i < particleCount; i++) {
    const theta = random() * Math.PI * 2; // Around the ring
    const phi = random() * Math.PI * 2; // Around the tube

    // 3D torus projected to 2D (top-down view with perspective)
    const x = (majorRadius + minorRadius * Math.cos(phi)) * Math.cos(theta);
    const y = (majorRadius + minorRadius * Math.cos(phi)) * Math.sin(theta);
    const z = minorRadius * Math.sin(phi);

    // Simple perspective projection
    const perspective = 1 + z / (size * 0.5);
    points.push({
      x: center + x * perspective,
      y: center + y * perspective,
      alpha: 0.5 + (0.5 * (z / minorRadius + 1)) / 2, // Depth-based alpha
    });
  }
  return points;
}

export function generateSquareGrid(options: GeometryOptions): Point[] {
  const { size, particleCount, seed = 42 } = options;
  const random = seededRandom(seed);
  const points: Point[] = [];
  const center = size / 2;
  const gridSize = size * 0.6;
  const cellCount = Math.ceil(Math.sqrt(particleCount));
  const cellSize = gridSize / cellCount;

  for (let i = 0; i < cellCount; i++) {
    for (let j = 0; j < cellCount; j++) {
      if (points.length >= particleCount) break;
      const x = center - gridSize / 2 + i * cellSize + cellSize / 2;
      const y = center - gridSize / 2 + j * cellSize + cellSize / 2;
      // Add slight randomness
      points.push({
        x: x + (random() - 0.5) * cellSize * 0.3,
        y: y + (random() - 0.5) * cellSize * 0.3,
      });
    }
  }
  return points;
}

export function generateTriangle(options: GeometryOptions): Point[] {
  const { size, particleCount, seed = 42 } = options;
  const random = seededRandom(seed);
  const points: Point[] = [];
  const center = size / 2;
  const radius = size * 0.38;

  // Triangle vertices
  const vertices = [
    { x: center, y: center - radius },
    { x: center - radius * Math.cos(Math.PI / 6), y: center + radius * Math.sin(Math.PI / 6) },
    { x: center + radius * Math.cos(Math.PI / 6), y: center + radius * Math.sin(Math.PI / 6) },
  ];

  // Distribute points along edges
  const pointsPerEdge = Math.floor(particleCount / 3);
  for (let edge = 0; edge < 3; edge++) {
    const start = vertices[edge];
    const end = vertices[(edge + 1) % 3];
    for (let i = 0; i < pointsPerEdge; i++) {
      const t = i / pointsPerEdge;
      const thickness = size * 0.04;
      points.push({
        x: start.x + (end.x - start.x) * t + (random() - 0.5) * thickness,
        y: start.y + (end.y - start.y) * t + (random() - 0.5) * thickness,
      });
    }
  }
  return points;
}

export function generateDiamond(options: GeometryOptions): Point[] {
  const { size, particleCount, seed = 42 } = options;
  const random = seededRandom(seed);
  const points: Point[] = [];
  const center = size / 2;
  const radiusX = size * 0.35;
  const radiusY = size * 0.4;

  // Diamond vertices (rotated square)
  const vertices = [
    { x: center, y: center - radiusY },
    { x: center + radiusX, y: center },
    { x: center, y: center + radiusY },
    { x: center - radiusX, y: center },
  ];

  const pointsPerEdge = Math.floor(particleCount / 4);
  for (let edge = 0; edge < 4; edge++) {
    const start = vertices[edge];
    const end = vertices[(edge + 1) % 4];
    for (let i = 0; i < pointsPerEdge; i++) {
      const t = i / pointsPerEdge;
      const thickness = size * 0.04;
      points.push({
        x: start.x + (end.x - start.x) * t + (random() - 0.5) * thickness,
        y: start.y + (end.y - start.y) * t + (random() - 0.5) * thickness,
      });
    }
  }
  return points;
}

export function generateHexagon(options: GeometryOptions): Point[] {
  const { size, particleCount, seed = 42 } = options;
  const random = seededRandom(seed);
  const points: Point[] = [];
  const center = size / 2;
  const radius = size * 0.35;

  // Hexagon vertices
  const vertices: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 2;
    vertices.push({
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    });
  }

  const pointsPerEdge = Math.floor(particleCount / 6);
  for (let edge = 0; edge < 6; edge++) {
    const start = vertices[edge];
    const end = vertices[(edge + 1) % 6];
    for (let i = 0; i < pointsPerEdge; i++) {
      const t = i / pointsPerEdge;
      const thickness = size * 0.04;
      points.push({
        x: start.x + (end.x - start.x) * t + (random() - 0.5) * thickness,
        y: start.y + (end.y - start.y) * t + (random() - 0.5) * thickness,
      });
    }
  }
  return points;
}

// ═══════════════════════════════════════════════════════════════════
// COMPLEX SHAPES
// ═══════════════════════════════════════════════════════════════════

export function generateSpiral(options: GeometryOptions): Point[] {
  const { size, particleCount, seed = 42 } = options;
  const random = seededRandom(seed);
  const points: Point[] = [];
  const center = size / 2;
  const maxRadius = size * 0.4;
  const turns = 3;

  for (let i = 0; i < particleCount; i++) {
    const t = i / particleCount;
    const angle = t * turns * Math.PI * 2;
    const radius = t * maxRadius;
    const thickness = size * 0.03;
    points.push({
      x: center + Math.cos(angle) * radius + (random() - 0.5) * thickness,
      y: center + Math.sin(angle) * radius + (random() - 0.5) * thickness,
    });
  }
  return points;
}

function generateStar(options: GeometryOptions, pointCount: number): Point[] {
  const { size, particleCount, seed = 42 } = options;
  const random = seededRandom(seed);
  const points: Point[] = [];
  const center = size / 2;
  const outerRadius = size * 0.4;
  const innerRadius = size * 0.18;

  // Star vertices (alternating outer and inner)
  const vertices: Point[] = [];
  for (let i = 0; i < pointCount * 2; i++) {
    const angle = (i * Math.PI) / pointCount - Math.PI / 2;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    vertices.push({
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    });
  }

  const totalEdges = pointCount * 2;
  const pointsPerEdge = Math.floor(particleCount / totalEdges);
  for (let edge = 0; edge < totalEdges; edge++) {
    const start = vertices[edge];
    const end = vertices[(edge + 1) % totalEdges];
    for (let i = 0; i < pointsPerEdge; i++) {
      const t = i / pointsPerEdge;
      const thickness = size * 0.03;
      points.push({
        x: start.x + (end.x - start.x) * t + (random() - 0.5) * thickness,
        y: start.y + (end.y - start.y) * t + (random() - 0.5) * thickness,
      });
    }
  }
  return points;
}

export function generateStar4(options: GeometryOptions): Point[] {
  return generateStar(options, 4);
}

export function generateStar5(options: GeometryOptions): Point[] {
  return generateStar(options, 5);
}

export function generateStar6(options: GeometryOptions): Point[] {
  return generateStar(options, 6);
}

export function generateStar8(options: GeometryOptions): Point[] {
  return generateStar(options, 8);
}

export function generateCross(options: GeometryOptions): Point[] {
  const { size, particleCount, seed = 42 } = options;
  const random = seededRandom(seed);
  const points: Point[] = [];
  const center = size / 2;
  const length = size * 0.38;
  const thickness = size * 0.08;

  const halfPoints = Math.floor(particleCount / 2);

  // Horizontal bar
  for (let i = 0; i < halfPoints; i++) {
    const t = i / halfPoints;
    points.push({
      x: center - length + t * length * 2,
      y: center + (random() - 0.5) * thickness,
    });
  }

  // Vertical bar
  for (let i = 0; i < halfPoints; i++) {
    const t = i / halfPoints;
    points.push({
      x: center + (random() - 0.5) * thickness,
      y: center - length + t * length * 2,
    });
  }

  return points;
}

export function generateConcentricRings(options: GeometryOptions): Point[] {
  const { size, particleCount, seed = 42 } = options;
  const random = seededRandom(seed);
  const points: Point[] = [];
  const center = size / 2;
  const ringCount = 4;
  const maxRadius = size * 0.4;
  const minRadius = size * 0.1;

  const pointsPerRing = Math.floor(particleCount / ringCount);

  for (let ring = 0; ring < ringCount; ring++) {
    const radius = minRadius + ((maxRadius - minRadius) * ring) / (ringCount - 1);
    const thickness = size * 0.03;
    for (let i = 0; i < pointsPerRing; i++) {
      const angle = random() * Math.PI * 2;
      points.push({
        x: center + Math.cos(angle) * (radius + (random() - 0.5) * thickness),
        y: center + Math.sin(angle) * (radius + (random() - 0.5) * thickness),
      });
    }
  }
  return points;
}

export function generateAbstractBlob(options: GeometryOptions): Point[] {
  const { size, particleCount, seed = 42 } = options;
  const random = seededRandom(seed);
  const points: Point[] = [];
  const center = size / 2;
  const baseRadius = size * 0.3;

  // Generate organic blob using noise-like deformation
  for (let i = 0; i < particleCount; i++) {
    const angle = random() * Math.PI * 2;
    // Create wavy radius using multiple sine waves
    const wave1 = Math.sin(angle * 3) * 0.2;
    const wave2 = Math.sin(angle * 5 + seed) * 0.15;
    const wave3 = Math.sin(angle * 7 + seed * 2) * 0.1;
    const radiusVariation = 1 + wave1 + wave2 + wave3;
    const r = baseRadius * radiusVariation * (0.8 + random() * 0.4);
    points.push({
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    });
  }
  return points;
}

// ═══════════════════════════════════════════════════════════════════
// THOUGHTFORM-SPECIFIC
// ═══════════════════════════════════════════════════════════════════

export function generateBrandmark(options: GeometryOptions): Point[] {
  const { size, particleCount, seed = 42 } = options;
  const random = seededRandom(seed);
  const points: Point[] = [];
  const center = size / 2;

  // Simplified brandmark: compass-like shape
  // Outer ring
  const ringPoints = Math.floor(particleCount * 0.5);
  const radius = size * 0.35;
  for (let i = 0; i < ringPoints; i++) {
    const angle = random() * Math.PI * 2;
    const thickness = size * 0.04;
    points.push({
      x: center + Math.cos(angle) * (radius + (random() - 0.5) * thickness),
      y: center + Math.sin(angle) * (radius + (random() - 0.5) * thickness),
    });
  }

  // Diagonal vector (like the brandmark's diagonal line)
  const diagonalPoints = Math.floor(particleCount * 0.3);
  for (let i = 0; i < diagonalPoints; i++) {
    const t = i / diagonalPoints;
    const startX = center - size * 0.2;
    const startY = center + size * 0.25;
    const endX = center + size * 0.15;
    const endY = center - size * 0.3;
    const thickness = size * 0.02;
    points.push({
      x: startX + (endX - startX) * t + (random() - 0.5) * thickness,
      y: startY + (endY - startY) * t + (random() - 0.5) * thickness,
    });
  }

  // Horizontal bar
  const barPoints = particleCount - ringPoints - diagonalPoints;
  for (let i = 0; i < barPoints; i++) {
    const t = i / barPoints;
    const thickness = size * 0.02;
    points.push({
      x: center - size * 0.35 + t * size * 0.7,
      y: center + (random() - 0.5) * thickness,
    });
  }

  return points;
}

export function generateGateway(options: GeometryOptions): Point[] {
  const { size, particleCount, seed = 42 } = options;
  const random = seededRandom(seed);
  const points: Point[] = [];
  const center = size / 2;

  // Three concentric dotted rings (gateway-inspired)
  const rings = [
    { radius: size * 0.38, dots: 24 },
    { radius: size * 0.3, dots: 18 },
    { radius: size * 0.22, dots: 12 },
  ];

  const pointsPerDot = Math.floor(particleCount / rings.reduce((sum, r) => sum + r.dots, 0));

  for (const ring of rings) {
    for (let i = 0; i < ring.dots; i++) {
      const angle = (i / ring.dots) * Math.PI * 2;
      // Create small cluster for each "dot"
      for (let j = 0; j < pointsPerDot; j++) {
        const dotRadius = size * 0.02;
        const px = center + Math.cos(angle) * ring.radius + (random() - 0.5) * dotRadius;
        const py = center + Math.sin(angle) * ring.radius + (random() - 0.5) * dotRadius;
        points.push({ x: px, y: py });
      }
    }
  }

  return points;
}

export function generateManifoldSlice(options: GeometryOptions): Point[] {
  const { size, particleCount, seed = 42 } = options;
  const random = seededRandom(seed);
  const points: Point[] = [];
  const center = size / 2;

  // Organic flowing shape with multiple lobes
  for (let i = 0; i < particleCount; i++) {
    const t = i / particleCount;
    const angle = t * Math.PI * 2;

    // Create flowing, organic radius
    const baseRadius = size * 0.25;
    const flow1 = Math.sin(angle * 2 + seed) * 0.3;
    const flow2 = Math.cos(angle * 3 + seed * 0.5) * 0.2;
    const flow3 = Math.sin(angle * 5 + seed * 1.5) * 0.1;
    const radiusMod = 1 + flow1 + flow2 + flow3;
    const r = baseRadius * radiusMod + (random() - 0.5) * size * 0.05;

    // Add slight drift perpendicular to radius
    const drift = Math.sin(angle * 4 + seed * 2) * size * 0.05;
    const perpAngle = angle + Math.PI / 2;

    points.push({
      x: center + Math.cos(angle) * r + Math.cos(perpAngle) * drift,
      y: center + Math.sin(angle) * r + Math.sin(perpAngle) * drift,
      alpha: 0.6 + 0.4 * Math.abs(Math.sin(angle * 3)),
    });
  }

  return points;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN GENERATOR FUNCTION
// ═══════════════════════════════════════════════════════════════════

export function generateSigilPoints(shape: SigilShape, options: GeometryOptions): Point[] {
  switch (shape) {
    case "ring":
      return generateRing(options);
    case "torus":
      return generateTorus(options);
    case "squareGrid":
      return generateSquareGrid(options);
    case "triangle":
      return generateTriangle(options);
    case "diamond":
      return generateDiamond(options);
    case "hexagon":
      return generateHexagon(options);
    case "spiral":
      return generateSpiral(options);
    case "star4":
      return generateStar4(options);
    case "star5":
      return generateStar5(options);
    case "star6":
      return generateStar6(options);
    case "star8":
      return generateStar8(options);
    case "cross":
      return generateCross(options);
    case "concentricRings":
      return generateConcentricRings(options);
    case "abstractBlob":
      return generateAbstractBlob(options);
    case "brandmark":
      return generateBrandmark(options);
    case "gateway":
      return generateGateway(options);
    case "manifoldSlice":
      return generateManifoldSlice(options);
    default:
      return generateTorus(options); // Default fallback
  }
}

// Get all available shape keys
export const SIGIL_SHAPES: SigilShape[] = [
  "ring",
  "torus",
  "squareGrid",
  "triangle",
  "diamond",
  "hexagon",
  "spiral",
  "star4",
  "star5",
  "star6",
  "star8",
  "cross",
  "concentricRings",
  "abstractBlob",
  "brandmark",
  "gateway",
  "manifoldSlice",
];
