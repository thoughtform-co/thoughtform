# Thoughtform Particle System

## Overview

The Thoughtform particle system creates a 3D space navigation experience using HTML5 Canvas. It renders a journey through conceptual "latent space" — the dimensional terrain where meaning exists in AI systems.

## Architecture

### Shared Geometry Library (`lib/particle-geometry/`)

The particle system now uses a **shared geometry library** that provides:

1. **Seeded RNG** (`rng.ts`): Deterministic pseudo-random number generation for reproducible shapes
2. **Math Utilities** (`math.ts`): Vector operations, rotations, normalization
3. **ODE Integrators** (`integrators.ts`): Euler/RK4 for flow-field and attractor sampling
4. **Projection Helpers** (`projection.ts`): 3D to 2D projection with depth-based alpha/sizing
5. **Shape Registry** (`registry.ts`): Central registry mapping shape IDs to generators

### Shape Categories

Shapes are organized into categories:

| Category      | Description                                      | Examples                                   |
| ------------- | ------------------------------------------------ | ------------------------------------------ |
| `thoughtform` | New 3D topological, alien-looking shapes         | Filament Field, Vortex Bloom, Trefoil Knot |
| `geometric`   | Basic geometric shapes with 3D depth             | Ring, Torus, Gateway, Triangle             |
| `attractor`   | Mathematical chaotic attractors (landmarks only) | Lorenz, Halvorsen, Rössler                 |

### Shape Registry

All shapes are registered in `lib/particle-geometry/registry.ts`:

```typescript
import { getShapeGenerator, isValidShape, resolveShapeId } from "@/lib/particle-geometry";

// Get a shape generator
const generator = getShapeGenerator("tf_filamentField");
const points = generator({ seed: 42, pointCount: 300, size: 200 });

// Resolve legacy shapes to new ones
const resolved = resolveShapeId("star4"); // → "tf_filamentField"

// Check if shape exists
const valid = isValidShape("tf_vortexBloom"); // → true
```

### Adding New Shapes

To add a new shape:

1. Create the generator function in `lib/particle-geometry/shapes/`:

```typescript
// shapes/thoughtform.ts
export function generateMyNewShape(options: ShapeOptions): Vec3[] {
  const { seed, pointCount } = options;
  const rng = createSeededRandom(seed);
  const points: Vec3[] = [];

  for (let i = 0; i < pointCount; i++) {
    // Generate 3D point
    points.push({ x, y, z });
  }

  return normalizePoints(points); // Normalize to [-1, 1] range
}
```

2. Register it in `lib/particle-geometry/registry.ts`:

```typescript
register({
  id: "tf_myNewShape",
  label: "My New Shape",
  category: "thoughtform",
  generate: generateMyNewShape,
  has3DDepth: true,
});
```

3. For landmarks, add to `LandmarkShape` type in `lib/particle-config.ts`:

```typescript
export type LandmarkShape =
  // ... existing shapes ...
  "tf_myNewShape";
```

## Core Principles

### Brand Alignment

- **Sharp Geometry Only**: All particles are rendered as squares (`fillRect`), never circles
- **Grid Snapping**: All positions snap to a 3px grid for that digital/terminal aesthetic
- **No Glow Effects**: No `shadowBlur` or bloom — clean, precise edges only
- **Scroll-Driven Motion**: Motion is tied to scroll position; subtle animation for sigils

### Seeding Rules

All new Thoughtform shapes use **deterministic seeding**:

1. Each shape generator accepts a `seed` parameter
2. The same seed always produces the same shape
3. Service card sigils use `seed = 42 + cardIndex * 1000`
4. Landmarks use `seed = landmarkIndex * 1000 + shapeId.length * 100`

This ensures:

- Consistent appearance across page loads
- Reproducible shapes for testing
- Variation between instances when needed

### Color Palette

```javascript
const DAWN = "#ebe3d6"; // Primary text/ambient particles
const GOLD = "#caa554"; // Active/highlighted elements (Tensor Gold)
const ALERT = "#ff6b35"; // Event Horizon (final landmark)
```

## Particle Systems

### 1. Service Card Sigils (`SigilCanvas`)

Small 2D/2.5D shapes rendered in service cards.

**Location**: `components/hud/NavigationCockpitV2/SigilCanvas.tsx`

**Available Shapes** (from registry):

- **Thoughtform**: `tf_filamentField`, `tf_foldedFlow`, `tf_vortexBloom`, `tf_trefoilKnot`, `tf_twistedRibbon`, `tf_constellationMesh`, `tf_fractureSpire`, `tf_continuumFold`
- **Geometric**: `ring`, `torus`, `gateway`, `squareGrid`, `triangle`, `diamond`, `hexagon`, `cross`, `abstractBlob`, `brandmark`, `manifoldSlice`

**Removed Shapes** (legacy, fallback to Thoughtform):

- `star4`, `star5`, `star6`, `star8` → `tf_filamentField`
- `spiral` → `tf_foldedFlow`
- `concentricRings` → `tf_trefoilKnot`

**Configuration**: Via admin panel (`SigilEditorPanel`) or `SigilConfigContext`

### 2. Manifold Landmarks (`ParticleCanvasV2`)

Large 3D shapes that float above the manifold terrain.

**Location**: `components/hud/ParticleCanvasV2.tsx`

**Available Shapes**:

- **Thoughtform**: All `tf_*` shapes from registry
- **Classic**: `gateway`, `tower`, `helix`, `sphere`, `ring`, `ziggurat`
- **Attractors**: `lorenz`, `halvorsen`, `rossler`
- **Decorative**: `orbit`, `gridlines`, `contour`, `wireframeSphere`, `starfield`

**Configuration**: Via admin panel (`ParticleAdminPanel`) or `ParticleConfigContext`

### 3. Hero Gateway (`ThreeGateway`)

Three.js-based 3D gateway portal in the hero section.

**Location**: `components/hud/ThreeGateway.tsx`

**Note**: This system is **out of scope** for the shape registry — it uses its own shape generators including strange attractors and parametric surfaces.

## Rendering

### Depth-Based Effects

Both sigils and landmarks use depth-based rendering:

```typescript
// Alpha fades with distance
const alpha = depthToAlpha(z, minZ, maxZ, 0.3, 1.0);

// Size shrinks with distance
const size = depthToSize(z, minZ, maxZ, minSize, maxSize);

// Sort back-to-front for proper layering
const sorted = sortByDepth(particles);
```

### Grid Snapping

All positions snap to 3px grid:

```javascript
const GRID = 3;
function snap(value: number): number {
  return Math.floor(value / GRID) * GRID;
}
```

### Projection

3D points are projected to 2D using perspective projection:

```typescript
import { toSigilPoints } from "@/lib/particle-geometry";

const sigilPoints = toSigilPoints(points3D, size, {
  rotationX: 0.3,
  rotationY: 0.2,
  scale: 0.38,
});
```

## Testing

### Shape Lab

An internal test page for rapid shape iteration:

**URL**: `/shape-lab`

**Features**:

- Preview any shape from the registry
- Adjust seed and point count
- View in both Sigil and Landmark modes
- Compare Thoughtform vs Geometric categories

## Performance

- **Sigil particles**: 50-500 per card
- **Landmark particles**: 200-800 per shape
- **Terrain particles**: ~8000 (manifold grid)
- **Starfield**: 500 ambient stars (looping)
- **GPU acceleration**: `will-change`, `backface-visibility` hints
- **Depth sorting**: Once per frame, not per particle

## File Structure

```
lib/
├── particle-geometry/          # Shared geometry library (NEW)
│   ├── index.ts               # Main exports
│   ├── rng.ts                 # Seeded PRNG
│   ├── math.ts                # Vector operations
│   ├── integrators.ts         # ODE integrators
│   ├── projection.ts          # 3D→2D projection
│   ├── registry.ts            # Shape registry
│   └── shapes/
│       ├── types.ts           # Shape interfaces
│       ├── thoughtform.ts     # Thoughtform shapes
│       └── geometric.ts       # Geometric shapes
├── sigil-geometries.ts        # Sigil-specific exports (wraps registry)
├── particle-config.ts         # System config types
└── contexts/
    ├── SigilConfigContext.tsx     # Service sigil state
    └── ParticleConfigContext.tsx  # Global particle state

components/
├── hud/
│   ├── ParticleCanvasV2.tsx       # Main 3D manifold + landmarks
│   ├── ThreeGateway.tsx           # Three.js hero gateway
│   ├── ThoughtformSigil.tsx       # Brandmark sigil
│   └── NavigationCockpitV2/
│       ├── SigilCanvas.tsx        # Service card sigils
│       ├── SigilEditorPanel.tsx   # Admin editor
│       └── ServiceCard.tsx        # Card container
└── admin/
    └── ParticleAdminPanel.tsx     # Global particle admin

app/
└── test/
    └── shape-lab/page.tsx         # Shape testing page (NEW)
```

## Migration Notes

### Legacy Shape Handling

If legacy shapes are encountered (e.g., from Supabase database):

1. **API routes** resolve shapes on read/write
2. **Contexts** resolve shapes during load
3. **Renderers** use `resolveShapeId()` as fallback
4. Legacy shapes are mapped to new Thoughtform shapes

### Default Config Changes

Service card defaults changed from:

- Card 0: `gateway` → `tf_constellationMesh`
- Card 1: `torus` → `tf_trefoilKnot`
- Card 2: `spiral` → `tf_vortexBloom`
