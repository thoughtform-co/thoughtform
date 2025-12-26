// ═══════════════════════════════════════════════════════════════════
// PARTICLE GEOMETRY LIBRARY
// Shared geometry kernel for Thoughtform particle systems
// ═══════════════════════════════════════════════════════════════════

// RNG
export { createRNG, createSeededRandom, hashString, combineSeed, type SeededRandom } from "./rng";

// Math
export {
  vec2,
  vec3,
  add2,
  add3,
  sub3,
  scale2,
  scale3,
  dot3,
  cross3,
  length2,
  length3,
  normalize2,
  normalize3,
  lerp,
  lerp3,
  distance3,
  computeBounds3,
  normalizePoints,
  rotateX,
  rotateY,
  rotateZ,
  clamp,
  smoothstep,
  remap,
  degToRad,
  radToDeg,
  type Vec2,
  type Vec3,
  type Bounds3,
} from "./math";

// Integrators
export {
  eulerStep,
  rk2Step,
  rk4Step,
  generateTrajectory,
  lorenzODE,
  rosslerODE,
  thomasODE,
  halvorsenODE,
  aizawaODE,
  curlNoiseODE,
  type ODE3,
  type Integrator,
} from "./integrators";

// Projection
export {
  projectPoint,
  projectPoints,
  depthToAlpha,
  depthToSize,
  sortByDepth,
  toSigilPoints,
  type ProjectionConfig,
  type ProjectedPoint,
  type SigilPoint,
} from "./projection";

// Shapes
export {
  type ShapeOptions,
  type ShapeGenerator,
  type SigilShapeGenerator,
  type ShapeCategory,
  type ShapeDefinition,
  type ShapePoint,
} from "./shapes/types";

export {
  generateFilamentField,
  generateFoldedFlow,
  generateVortexBloom,
  generateTrefoilKnot,
  generateTwistedRibbon,
  generateConstellationMesh,
  generateFractureSpire,
  generateContinuumFold,
} from "./shapes/thoughtform";

export {
  generateRing,
  generateTorus,
  generateGateway,
  generateSquareGrid,
  generateTriangle,
  generateDiamond,
  generateHexagon,
  generateCross,
  generateAbstractBlob,
  generateBrandmark,
  generateManifoldSlice,
} from "./shapes/geometric";

// Registry
export {
  getShape,
  getShapeGenerator,
  isValidShape,
  getAllShapes,
  getShapesByCategory,
  getAllShapeIds,
  getShapeLabels,
  DEFAULT_SIGIL_SHAPE,
  DEFAULT_LANDMARK_SHAPE,
  resolveShapeId,
  isLegacyShape,
  getSigilShapeIds,
  getSigilShapeOptions,
} from "./registry";
