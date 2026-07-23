# Manifold & Gateway Particle System Guide

This document explains how Thoughtform's particle system creates the immersive 3D manifold terrain and gateway portal experiences.

## Overview

The particle system creates a "latent space" navigation experience—a dimensional terrain where meaning exists in AI systems. Users scroll through this space, moving past landmarks that represent different sections of the website.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Navigation Experience                        │
├─────────────────────────────────────────────────────────────────┤
│  ThreeGateway (Three.js)     │  ParticleCanvasV2 (2D Canvas)    │
│  - Hero portal/gateway       │  - Manifold terrain              │
│  - 3D attractors             │  - Landmarks (shapes)            │
│  - Interactive particles     │  - Starfield background          │
│  - Scroll-driven camera      │  - Scroll-driven projection      │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Manifold (Terrain Grid)

The manifold is a procedurally generated 3D terrain rendered as particles on a 2D canvas.

### Configuration (`lib/particle-config.ts`)

```typescript
interface ManifoldConfig {
  color: string; // Hex color for terrain particles (e.g., "#3a3832")
  rows: number; // Number of rows in terrain grid (default: 140)
  columns: number; // Number of columns (default: 60)
  waveAmplitude: number; // Height/amplitude of waves (50-400)
  waveFrequency: number; // Tightness of waves (0.05-0.5)
  spreadX: number; // Horizontal spread multiplier (0.5-2.0)
  spreadZ: number; // Depth spread multiplier (0.5-2.0)
  opacity: number; // Terrain opacity (0.1-1.0)
}
```

### Terrain Generation (`ParticleCanvasV2.tsx`)

The terrain is generated as a grid of particles with wave-based height variation:

```typescript
function initParticles(config: ParticleSystemConfig): Particle[] {
  const particles: Particle[] = [];
  const { manifold, landmarks } = config;
  const manifoldColorRgb = hexToRgb(manifold.color);

  // Extend terrain deeper for far sections
  const terrainRows = Math.max(manifold.rows, 220);
  const terrainColumns = manifold.columns;

  for (let r = 0; r < terrainRows; r++) {
    for (let c = 0; c < terrainColumns; c++) {
      // Calculate world position
      const x = (c - terrainColumns / 2) * (70 * manifold.spreadX);
      const z = 200 + r * (55 * manifold.spreadZ);

      const wavePhase = r * 0.02;

      // Combine multiple wave functions for organic terrain
      let y =
        400 +
        Math.sin(c * manifold.waveFrequency + wavePhase) * manifold.waveAmplitude +
        Math.cos(r * 0.12) * 150 +
        Math.sin(c * 0.35 + r * 0.15) * 70 +
        Math.sin(r * 0.08) * 100;

      // Mountain range in far background (row > 100)
      if (r > 100) {
        const mountainProgress = (r - 100) / (terrainRows - 100);
        const mountainHeight = mountainProgress * 400;

        // Overlapping sine waves create natural mountain silhouette
        const peak1 = Math.pow(Math.max(0, Math.sin(c * 0.08 + 1.5)), 2) * mountainHeight;
        const peak2 = Math.pow(Math.max(0, Math.sin(c * 0.15 + 0.8)), 2) * mountainHeight * 0.6;
        const peak3 = Math.pow(Math.max(0, Math.sin(c * 0.03)), 1.5) * mountainHeight * 0.8;

        y -= (peak1 + peak2 + peak3) * 0.7;
      }

      particles.push(createPoint(x, y, z, "terrain", manifoldColorRgb, 0));
    }
  }

  return particles;
}
```

### Visual Effects

**Depth-based desaturation** creates atmospheric perspective:

```typescript
function desaturateByDepth(rgbString: string, depth: number, intensity: number = 0.8): string {
  const parts = rgbString.split(",").map((s) => parseInt(s.trim()));
  const [r, g, b] = parts;

  // Target: muted warm gray matching the void background
  const targetGray = { r: 35, g: 33, b: 30 };

  // Blend based on depth (far = more gray)
  const blendFactor = Math.min(1, depth * intensity);

  return `${r + (targetGray.r - r) * blendFactor}, ...`;
}
```

**Grid snapping** maintains the digital aesthetic:

```typescript
const GRID = 3;
function snap(value: number): number {
  return Math.floor(value / GRID) * GRID;
}
```

---

## The Gateway (Hero Portal)

The gateway is a Three.js-rendered 3D portal in the hero section that creates the "entrance to latent space" experience.

### Configuration (`lib/particle-config.ts`)

```typescript
interface GatewayConfig {
  enabled: boolean;
  shape: GatewayShape; // "circle", "lorenz", "torus", etc.
  primaryColor: string; // Main portal color
  accentColor: string; // Gold highlights
  scale: number; // Size multiplier (0.5-3.0)
  positionX: number; // Horizontal offset (-3 to 3)
  positionY: number; // Vertical offset (-2 to 2)
  density: number; // Particle density (0.3-2.0)
  tunnelDepth: number; // Depth of tunnel effect (0.5-2.0)
  rotationY: number; // Portal ring rotation
  tunnelCurve: number; // Tunnel curvature (-1 to 1)
  tunnelWidth: number; // Tunnel width multiplier
  algorithmicEffects: boolean; // Enable latent space field effects
  algorithmicIntensity: number; // Intensity of effects (0.0-2.0)
  algorithmicPattern: string; // "spiral", "lissajous", "fieldLines", etc.
}
```

### Gateway Shape Types

#### 1. Geometric Shapes (2D Outlines)

Circle, hexagon, octagon, diamond, arch, ellipse—rendered as particle-filled outlines with tunnel depth.

```typescript
// Shape point generators map normalized angle (0-1) to (x, y)
const geometricShapeGenerators: Record<string, ShapePointFn> = {
  circle: (t, radius) => ({
    x: Math.cos(t * Math.PI * 2) * radius,
    y: Math.sin(t * Math.PI * 2) * radius,
  }),
  hexagon: (t, radius) => {
    const sides = 6;
    const segment = Math.floor(t * sides) % sides;
    // ... interpolate between vertices
  },
  // ... more shapes
};
```

#### 2. Strange Attractors (3D Chaos Systems)

Mathematical chaos systems that create organic, swirling particle clouds:

```typescript
function generateAttractorPoints(type: GatewayShape, count: number): AttractorPoint[] {
  const points: AttractorPoint[] = [];
  let x = 0.1,
    y = 0.1,
    z = 0.1;
  const dt = 0.005;

  for (let i = 0; i < count; i++) {
    let dx = 0,
      dy = 0,
      dz = 0;

    switch (type) {
      case "lorenz":
        // Lorenz butterfly attractor
        const sigma = 10,
          rho = 28,
          beta = 8 / 3;
        dx = sigma * (y - x);
        dy = x * (rho - z) - y;
        dz = x * y - beta * z;
        break;
      case "thomas":
        // Thomas symmetric attractor
        const b = 0.208186;
        dx = Math.sin(y) - b * x;
        dy = Math.sin(z) - b * y;
        dz = Math.sin(x) - b * z;
        break;
      // ... more attractors: aizawa, sprott, rossler, dadras, galaxy
    }

    // Euler integration
    x += dx * dt;
    y += dy * dt;
    z += dz * dt;

    points.push({ x, y, z });
  }

  return normalizeAttractorPoints(points);
}
```

#### 3. Portal-like Surfaces (Parametric Geometry)

```typescript
case "torus":
  // Donut portal
  const R = 0.6, r = 0.3;  // Major/minor radius
  const u = (idx / count) * Math.PI * 2;
  const v = ((idx % 20) / 20) * Math.PI * 2;
  points.push({
    x: (R + r * Math.cos(v)) * Math.cos(u),
    y: (R + r * Math.cos(v)) * Math.sin(u),
    z: r * Math.sin(v),
  });
  break;

case "vortex":
  // Spiraling whirlpool portal
  const t = (idx / count) * Math.PI * 4;
  const vortexR = Math.min(t * 0.15, 1.0);
  points.push({
    x: vortexR * Math.cos(t),
    y: Math.sin(t * 2) * 0.3,
    z: vortexR * Math.sin(t),
  });
  break;
```

### Gateway Components (`ThreeGateway.tsx`)

The gateway is composed of multiple particle layers:

```typescript
// Geometric gateway structure
<>
  {/* Main solid ring with torus cross-section */}
  <SolidShapeRing opacity={opacity} color={primaryColor} density={density} shape={shape} />

  {/* Glowing edge effect - multiple particle layers */}
  <EdgeGlowRing opacity={opacity} color={primaryColor} density={density} shape={shape} />

  {/* Tunnel depth - rings receding into the portal */}
  <TunnelDepthRings
    opacity={opacity}
    tunnelDepth={tunnelDepth}
    tunnelCurve={tunnelCurve}
    tunnelWidth={tunnelWidth}
  />

  {/* Inner gold accent ring */}
  <InnerAccentRing opacity={opacity} color={accentColor} density={density} shape={shape} />

  {/* Spiral particles drawing eye inward */}
  <DepthSpiral
    opacity={opacity}
    tunnelDepth={tunnelDepth}
    tunnelCurve={tunnelCurve}
    tunnelWidth={tunnelWidth}
  />

  {/* Interior fill particles */}
  <InteriorFill opacity={opacity} tunnelDepth={tunnelDepth} />

  {/* Gold depth markers - pulsing rings inside tunnel */}
  <GoldDepthMarkers opacity={opacity} color={accentColor} tunnelDepth={tunnelDepth} />
</>
```

### Tunnel Depth System

The tunnel creates depth through receding rings that respect curvature and width settings:

```typescript
function TunnelDepthRings({ tunnelDepth, tunnelCurve, tunnelWidth, shape }) {
  const positions = useMemo(() => {
    const points: number[] = [];
    const RING_COUNT = 40;
    const PARTICLES_PER_RING = 150;

    for (let ring = 0; ring < RING_COUNT; ring++) {
      const t = ring / (RING_COUNT - 1); // 0-1 depth progress
      const radius = startRadius * (1 - t * 0.4); // Shrinks toward back

      for (let i = 0; i < PARTICLES_PER_RING; i++) {
        const pointT = i / PARTICLES_PER_RING;
        const { x, y } = getPoint(pointT, radius); // Shape-specific position

        // Apply curve and width transformations
        const widthScale = 1 + (tunnelWidth - 1) * t * 2;
        const curveOffset = tunnelCurve * t * t * 2;

        points.push(x * widthScale + curveOffset, y * widthScale, t);
      }
    }
    return new Float32Array(points);
  }, [shape]);

  useFrame(() => {
    // Scale Z based on tunnel depth setting
    pointsRef.current.scale.z = 8 * tunnelDepth;
  });
}
```

### Algorithmic Effects (Latent Space Field)

When enabled, mathematical patterns emanate from the gateway:

```typescript
function LatentSpaceField({ pattern, intensity, radius }) {
  const patterns = useMemo(() => {
    const linePoints: number[] = [];
    const particlePoints: number[] = [];

    if (pattern === "spiral" || pattern === "all") {
      // Logarithmic spirals emanating from gateway
      for (let s = 0; s < 8; s++) {
        const angleOffset = (s / 8) * Math.PI * 2;
        for (let i = 0; i < 50; i++) {
          const t = i / 50;
          const r = baseRadius + (outerRadius - baseRadius) * t;
          const angle = angleOffset + t * Math.PI * 4;
          particlePoints.push(
            r * Math.cos(angle),
            r * Math.sin(angle),
            Math.sin(t * Math.PI * 2) * 0.3 * intensity
          );
        }
      }
    }

    if (pattern === "lissajous" || pattern === "all") {
      // Figure-8 Lissajous curves
      for (let l = 0; l < 6; l++) {
        const freqX = 2 + l;
        const freqY = 3 + l * 0.5;
        // ... parametric generation
      }
    }

    // ... fieldLines, particleStreams patterns

    return { linePoints, particlePoints };
  }, [pattern, intensity, radius]);
}
```

---

## Scroll-Driven Animation

### Camera Movement

The manifold uses a virtual camera that moves through the particle field:

```typescript
// In render loop
const currentConfig = configRef.current;
const camera = currentConfig.camera;
const FOCAL = camera.focalLength;
const MAX_DEPTH = camera.maxDepth || 8800;

// Scroll drives depth position (0-1 → 0-MAX_DEPTH)
const scrollZ = scrollP * MAX_DEPTH;

// Calculate perspective projection
const cosYaw = Math.cos((camera.yaw * Math.PI) / 180);
const sinYaw = Math.sin((camera.yaw * Math.PI) / 180);
const cosPitch = Math.cos((camera.pitch * Math.PI) / 180);
const sinPitch = Math.sin((camera.pitch * Math.PI) / 180);
const cosRoll = Math.cos((camera.roll * Math.PI) / 180);
const sinRoll = Math.sin((camera.roll * Math.PI) / 180);

// Project each particle
for (const p of particles) {
  // Relative depth from camera
  const relZ = p.z - scrollZ;

  // Apply yaw rotation
  let worldX = p.x - camera.truckX;
  const rotX = worldX * cosYaw - relZ * sinYaw;
  const rotZ = worldX * sinYaw + relZ * cosYaw;

  // Perspective projection
  const scale = FOCAL / rotZ;
  const screenX = centerX + rotX * scale;
  const screenY = centerY + p.y * scale * cosPitch;

  // Draw particle with depth-based effects
  const alpha = calculateAlpha(relZ, p.type);
  drawPixel(ctx, screenX, screenY, p.color, alpha, p.size * scale);
}
```

### Gateway Fade-Out

The gateway fades as users scroll past it:

```typescript
// ThreeGateway.tsx
const opacity = scrollProgress > 0.06 ? Math.max(0, 1 - (scrollProgress - 0.06) * 10) : 1;

// ParticleCanvasV2.tsx - for 2D gateway particles
if (p.type === "gateway") {
  if (scrollP > 0.15) {
    particleAlpha = Math.max(0, 1 - (scrollP - 0.15) * 4);
  }
}
```

---

## Mobile Optimizations

```typescript
// Reduced density on mobile
const mobileConfig = useMemo(() => {
  if (!isMobile) return config;

  return {
    ...config,
    manifold: {
      ...config.manifold,
      rows: Math.floor(config.manifold.rows * 0.5), // Half rows
      columns: Math.floor(config.manifold.columns * 0.6), // 60% columns
    },
    landmarks: config.landmarks.map((l) => ({
      ...l,
      density: l.density * 0.5, // Half density
    })),
  };
}, [config, isMobile]);

// Gateway mobile overrides
export const DEFAULT_MOBILE_GATEWAY: Partial<GatewayConfig> = {
  positionX: 0, // Center on mobile
  positionY: 0,
  scale: 0.85, // Smaller scale
  density: 0.5, // Half density for performance
};
```

---

## Orrery: Gateway Tab

The Orrery (`/orrery`) includes a dedicated **Gateway** tab for experimenting with image-based particle gateways.

### Features

- **Image Upload**: Upload any PNG/JPEG as the key visual source
- **Depth Map Support**: Add a grayscale depth map (white = close, black = far)
- **Live Preview**: Real-time Three.js preview with orbit controls
- **Presets**: Pre-configured gateway styles including Thoughtform Gateway I
- **3 Layer System**: Contour (edges), Fill (interior), Highlight (bright areas)
- **Art Direction**: Contrast, gamma, depth scale/gamma/invert, luma threshold
- **Per-Layer Controls**: Density, opacity, size, color mode (image vs tint)
- **Bake & Export**: Generate TFPC binary files for runtime loading

### Processing Pipeline

```
FileReader → Canvas 2D → Pixel Features → Layer Selection → Art Direction → Three.js → GLSL
```

1. **FileReader API** - Converts uploaded PNG to base64 data URL
2. **Canvas 2D API** - Samples image at ≤512px resolution
3. **Sobel Edge Detection** - Computes edge weights for particle prioritization
4. **Importance Sampling** - Prioritizes edges + bright pixels (up to maxParticles)
5. **Three.js BufferGeometry** - Float32Arrays sent to GPU
6. **Custom GLSL Shaders** - Simplex noise, curl noise, pointer interaction

### Depth Map Integration

When a depth map is provided, the Z-position of each particle is determined by the depth map pixel value instead of luminance:

```typescript
// Z from depth map (white = 1.0 = close, black = 0.0 = far)
const depthValue = depthMap[idx] / 255;
const z = (depthValue - 0.5) * depthScale;
```

### Available Presets

| Preset                | Description                            | Recommended Settings           |
| --------------------- | -------------------------------------- | ------------------------------ |
| Gateway Hero          | Default hero portal                    | 30K particles, 0.8 depth scale |
| Thoughtform Gateway I | Custom artwork with AI-generated depth | 45K particles, 1.2 depth scale |

---

## Admin Control

Both the manifold and gateway are configurable via the admin panel with live preview. Configuration is stored in Supabase and loaded via `ParticleConfigContext`.

### Available Controls

**Manifold:**

- Grid dimensions (rows × columns)
- Wave amplitude and frequency
- Spread factors (X and Z)
- Color and opacity

**Gateway:**

- Shape selection (geometric, attractors, surfaces)
- Position and scale
- Tunnel depth, curve, and width
- Color scheme (primary + accent)
- Algorithmic effects toggle and patterns

---

## File Reference

| File                                      | Purpose                                       |
| ----------------------------------------- | --------------------------------------------- |
| `lib/particle-config.ts`                  | Type definitions, defaults, utility functions |
| `lib/contexts/ParticleConfigContext.tsx`  | Global config state management                |
| `components/hud/ParticleCanvasV2.tsx`     | 2D canvas manifold + landmarks                |
| `components/hud/ThreeGateway.tsx`         | Three.js 3D gateway portal                    |
| `components/hud/KeyVisualPortal.tsx`      | Image-based particle gateway (Three.js)       |
| `lib/key-visual/sampler.ts`               | PNG → particle sampling with edge detection   |
| `app/orrery/page.tsx`                     | Orrery with Particles & Gateway tabs          |
| `app/orrery/GatewayLabTab.tsx`            | Gateway Lab interactive testing interface     |
| `components/admin/ParticleAdminPanel.tsx` | Admin configuration UI                        |
| `lib/particle-geometry/`                  | Shared geometry library for shapes            |

### Gateway Image Assets

| File                                                    | Description                      |
| ------------------------------------------------------- | -------------------------------- |
| `public/images/gateway-hero.png`                        | Default gateway key visual       |
| `public/images/gateway-depth.png`                       | Default gateway depth map        |
| `public/images/gateway/thoughtform-gateway-1.png`       | Thoughtform Gateway I key visual |
| `public/images/gateway/thoughtform-gateway-1-depth.png` | Thoughtform Gateway I depth map  |
