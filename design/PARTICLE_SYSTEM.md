# Thoughtform Particle System

## Overview

The Thoughtform particle system creates a 3D space navigation experience using HTML5 Canvas. It renders a journey through conceptual "latent space" — the dimensional terrain where meaning exists in AI systems.

## Core Principles

### Brand Alignment
- **Sharp Geometry Only**: All particles are rendered as squares (`fillRect`), never circles
- **Grid Snapping**: All positions snap to a 3px grid for that digital/terminal aesthetic
- **No Glow Effects**: No `shadowBlur` or bloom — clean, precise edges only
- **Scroll-Driven Motion**: No continuous rotation or ambient animation; all movement is tied to scroll position

### Color Palette
```javascript
const DAWN = "#ebe3d6";   // Primary text/ambient particles
const GOLD = "#caa554";   // Active/highlighted elements
const ALERT = "#ff6b35";  // Event Horizon (final landmark)
```

## Architecture

### Particle Structure
```typescript
interface Particle {
  x: number;      // 3D X position
  y: number;      // 3D Y position  
  z: number;      // 3D Z (depth) position
  type: "star" | "geo";  // Ambient vs landmark
  color: string;  // DAWN, GOLD, or ALERT
  char: string;   // ASCII character for close rendering
  size: number;   // Base size multiplier
}
```

### ASCII Characters
Close-up geometric particles render as semantic ASCII symbols:
```javascript
const CHARS = ["λ", "δ", "θ", "φ", "ψ", "Σ", "π", "∇", "∞", "∂", "⟨", "⟩"];
```

These represent mathematical/logical concepts — reinforcing the "navigating intelligence" metaphor.

## Spatial Layout

The particle system spans Z: 0 to ~7500 units, with distinct landmarks at different depths:

```
Z: 0 ────────────────────────────────────────────────────> Z: 7500

  GATEWAY        TERRAIN        ORBIT         TUNNEL        HORIZON
  (200-700)      (1000-2200)    (2500-3500)   (4000-5500)   (6000-7500)
     ◯              ▓▓▓            ○○○           |||           ●●●
   Portal        Meaning       Recursive     Direction     Singularity
   Entry         Topology      Patterns      Purpose       Convergence
```

## Landmarks

### 1. Gateway Portal (Z: 200-700)
**Concept**: The entry point — inviting users to enter the latent space

- 15 concentric rings that recede into distance
- Inner spiral drawing the eye inward
- Offset 200px to the right (avoids hero text)
- Creates tunnel/portal effect centered on screen initially

```javascript
// Ring creation
for (let layer = 0; layer < 15; layer++) {
  const z = 200 + layer * 40;
  const radius = 350 - layer * 18;
  // Points distributed around circle...
}
```

### 2. Semantic Terrain (Z: 1000-2200)
**Concept**: Meaning has topology — ideas exist as landscapes

- 40×40 grid of particles
- Height varies via multi-wave sine function
- Creates rolling hills/valleys effect
- Represents the "alien terrain" of AI understanding

```javascript
const y = 350 + 
  Math.sin(c * 0.18) * 120 +   // Primary wave
  Math.cos(r * 0.12) * 100 +   // Secondary wave
  Math.sin(c * 0.4 + r * 0.2) * 40;  // Detail wave
```

### 3. Polar Orbit (Z: 2500-3500)
**Concept**: Cyclical thinking, recursive patterns

- 6 concentric rings with wave-modulated Z
- Central spiral expanding outward
- Associated with Manifesto section

### 4. Trajectory Tunnel (Z: 4000-5500)
**Concept**: Direction, purpose, moving toward a goal

- Helix structure (500 particles)
- 12 receding rectangular frames
- Creates sense of forward momentum
- Associated with Services section

### 5. Event Horizon (Z: 6000-7500)
**Concept**: The singularity, point of convergence

- Spherical distribution (800 particles)
- Uses ALERT color (#ff6b35)
- 4 core rings at center
- Associated with Contact section

## Rendering System

### Projection
Simple perspective projection with configurable focal length:

```javascript
const FOCAL = 400;
const MAX_DEPTH = 3500;

const scale = FOCAL / relZ;
const screenX = centerX + particle.x * scale;
const screenY = centerY + particle.y * scale;
```

### Dynamic Vanishing Point
The geometric landmark vanishing point shifts based on scroll:

```javascript
// Starts centered (0.5), shifts to right (0.68) as you scroll
const scrollT = Math.min(1, scrollProgress * 4);
const cx_geo = width * (0.5 + scrollT * 0.18);
```

This creates the effect of:
1. **Hero section**: Portal directly in front (immersive entry)
2. **Scrolling**: Shifts to cockpit side-view (navigation mode)

### Trail Effect
Partial clearing creates motion blur:

```javascript
ctx.fillStyle = "rgba(5, 5, 4, 0.85)";
ctx.fillRect(0, 0, width, height);
```

### Depth-Based Rendering
- **Close particles (scale > 0.35)**: Render as ASCII characters
- **Distant particles**: Render as grid-snapped squares
- **Stars**: Always squares, 40% opacity

```javascript
if (p.type === "geo" && scale > 0.35) {
  // ASCII rendering
  ctx.font = `${fontSize}px "IBM Plex Sans", sans-serif`;
  ctx.fillText(p.char, snap(x), snap(y));
} else {
  // Square rendering
  ctx.fillRect(snap(x), snap(y), size - 1, size - 1);
}
```

### Grid Snapping
All positions snap to 3px grid:

```javascript
function snap(value: number): number {
  return Math.floor(value / GRID) * GRID;
}
```

## Scroll Integration

The particle system depth is driven by scroll progress:

```javascript
const scrollZ = scrollProgress * 7500;

// Each particle's relative Z
let relZ = particle.z - scrollZ;

// Stars loop infinitely
if (particle.type === "star") {
  while (relZ < 0) relZ += 8000;
  while (relZ > 8000) relZ -= 8000;
}
```

## Performance Considerations

- **Particle count**: ~3500 total particles
- **Starfield**: 500 ambient stars (looping)
- **Landmarks**: ~3000 geometric particles
- **requestAnimationFrame**: Single render loop
- **Depth sorting**: Particles sorted back-to-front each frame
- **Culling**: Particles outside view frustum are skipped

## React Integration

```tsx
interface ParticleCanvasProps {
  scrollProgress: number;  // 0-1 from Lenis scroll
}

export function ParticleCanvas({ scrollProgress }: ParticleCanvasProps) {
  // Canvas ref for rendering
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Scroll progress stored in ref to avoid re-renders
  const scrollProgressRef = useRef(0);
  
  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);
  
  // Render loop runs independently
  // ...
}
```

## File Location

The particle system is implemented in:
```
components/hud/ParticleCanvas.tsx
```

## Future Enhancements

Potential additions while maintaining brand guidelines:
- Interactive landmark highlighting on section hover
- Particle density variation based on viewport size
- Additional landmark types for new sections
- Subtle parallax between star layers

