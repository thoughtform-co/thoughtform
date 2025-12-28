# Key Visual → Particle System Transformation in TouchDesigner

> **Goal**: Transform the Thoughtform key visual (orbital ring PNG) into particle data that can be blended with the Three.js gateway particle system.

---

## Overview

TouchDesigner excels at real-time image-to-particle transformations. We'll use several approaches:

1. **Instancing from Image** - Use pixel positions/colors to drive particle instances
2. **Point Cloud Generation** - Convert image to 3D point cloud with depth
3. **GLSL Particle Simulation** - Advanced physics-based particle behaviors
4. **Export Pipeline** - Output data for Three.js consumption

---

## Part 1: Project Setup

### 1.1 Create New Project

```
File → New Project
Save as: thoughtform-gateway.toe
```

### 1.2 Set Project Settings

```
Edit → Preferences → General
- Cook Rate: 60 FPS
- Resolution: 1920 x 1080 (match your target)

Edit → Preferences → TOPs
- Default Resolution: 1920 x 1080
```

### 1.3 Import Key Visual

1. Drag your `gateway-keyvisual.png` into the network
2. This creates a **Movie File In TOP**
3. Rename it: `key_visual_source`

---

## Part 2: Image Processing Chain

### 2.1 Alpha/Luminance Extraction

Create this TOP chain:

```
[key_visual_source] → [Threshold TOP] → [Blur TOP] → [Level TOP]
```

**Threshold TOP** (`threshold1`):

- Compare: Luminance
- Threshold: 0.1 (filters out black background)
- Soft: 0.05

**Blur TOP** (`blur1`):

- Size: 2-5 pixels
- Method: Gaussian
- Purpose: Smooth edges for better particle distribution

**Level TOP** (`level1`):

- Black Level: 0.0
- White Level: 1.0
- Gamma: 1.2 (boost mid-tones)

### 2.2 Edge Detection (for edge-weighted particles)

```
[key_visual_source] → [Edge TOP] → [Level TOP]
```

**Edge TOP** (`edge1`):

- Method: Sobel
- Mono: On

**Level TOP** (`edge_level`):

- Amplify edges for visibility
- Gamma: 0.7

### 2.3 Create Depth Map from Luminance

```
[key_visual_source] → [Monochrome TOP] → [Blur TOP] → [Level TOP]
```

**Monochrome TOP** (`depth_mono`):

- RGB to Mono weighting (default is fine)

**Blur TOP** (`depth_blur`):

- Size: 10-20 pixels (smooth depth transitions)

**Level TOP** (`depth_map`):

- Invert if needed (bright = close, dark = far)

---

## Part 3: Point Cloud Generation

### 3.1 TOP to CHOP Conversion

This extracts pixel data as channel data.

```
[processed_image] → [TOP to CHOP] → [Shuffle CHOP]
```

**TOP to CHOP** (`top_to_chop1`):

- Pixel Format: RGBA or RGB
- Download Type: Instant
- Crop: Full Image

### 3.2 SOP-Based Point Cloud

Create a **Grid SOP** with resolution matching your image:

**Grid SOP** (`grid1`):

- Size: 16 x 9 (aspect ratio of image)
- Rows: 512
- Columns: 512
- Orientation: ZX Plane

### 3.3 Apply Image as Displacement

**Point SOP** with expressions:

```python
# In Point SOP expressions:
# ty (Y displacement from luminance):
me.inputPoint.y + chop('depth_map')[me.inputPoint.index] * 0.5

# Or use a Texture SOP for UV-based displacement
```

**Alternative: Noise SOP + Image**

```
[Grid SOP] → [Texture SOP] → [Noise SOP] → [Point SOP]
```

**Texture SOP** (`texture1`):

- TOP: depth_map
- Coord Type: Vertex

---

## Part 4: Particle System Setup

### 4.1 Particle SOP Method

```
[Point Cloud SOP] → [Particle SOP]
```

**Particle SOP** (`particle1`):

- **Birth**:
  - Source: Points
  - Birth Rate: 1000-5000
  - Max Particles: 50000
  - Life Expect: 5-10 seconds
- **State**:
  - Mass: 1
  - Drag: 0.1

- **Forces**:
  - Wind: (0, 0, 0)
  - Gravity: (0, -0.1, 0) or (0, 0, 0) for floating
- **Limits**:
  - Bounce: On
  - Bounce Loss: 0.5

### 4.2 Advanced: GLSL Particle Simulation

Create a **GLSL TOP** for GPU-accelerated particles:

**Position Texture** (GLSL TOP - `particle_pos`):

```glsl
// Fragment shader for position update
uniform float uTime;
uniform float uDeltaTime;
uniform sampler2D sVelocity;
uniform sampler2D sInitialPos;

out vec4 fragColor;

// Curl noise function
vec3 curlNoise(vec3 p) {
    const float e = 0.1;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);

    vec3 p_x0 = snoise3(p - dx);
    vec3 p_x1 = snoise3(p + dx);
    vec3 p_y0 = snoise3(p - dy);
    vec3 p_y1 = snoise3(p + dy);
    vec3 p_z0 = snoise3(p - dz);
    vec3 p_z1 = snoise3(p + dz);

    float x = (p_y1.z - p_y0.z) - (p_z1.y - p_z0.y);
    float y = (p_z1.x - p_z0.x) - (p_x1.z - p_x0.z);
    float z = (p_x1.y - p_x0.y) - (p_y1.x - p_y0.x);

    return normalize(vec3(x, y, z));
}

void main() {
    vec2 uv = vUV.st;

    vec3 pos = texture(sTD2DInputs[0], uv).xyz;  // Current position
    vec3 vel = texture(sVelocity, uv).xyz;       // Current velocity
    vec3 home = texture(sInitialPos, uv).xyz;    // Home position

    // Curl noise turbulence
    vec3 curl = curlNoise(pos * 2.0 + uTime * 0.1) * 0.01;

    // Return-to-home force
    vec3 homeForce = (home - pos) * 0.02;

    // Update position
    vec3 newPos = pos + vel * uDeltaTime + curl + homeForce;

    fragColor = vec4(newPos, 1.0);
}
```

**Velocity Texture** (GLSL TOP - `particle_vel`):

```glsl
uniform float uTime;
uniform sampler2D sPosition;
uniform vec3 uPointer;      // Mouse/pointer position
uniform float uAttraction;  // Pointer attraction strength

out vec4 fragColor;

void main() {
    vec2 uv = vUV.st;

    vec3 pos = texture(sPosition, uv).xyz;
    vec3 vel = texture(sTD2DInputs[0], uv).xyz;

    // Pointer interaction
    vec3 toPointer = uPointer - pos;
    float dist = length(toPointer);
    vec3 pointerForce = normalize(toPointer) * uAttraction / (dist * dist + 0.1);

    // Damping
    vel *= 0.98;

    // Add forces
    vel += pointerForce;

    fragColor = vec4(vel, 1.0);
}
```

### 4.3 Instancing from Image

This is the most direct approach:

1. **Geometry Instancer COMP** (`geo_instancer`):
   - Instance OP: Points from your Grid SOP
   - Instance CHOP: For per-instance attributes

2. **Instance Attributes**:
   - tx, ty, tz: Position from point cloud
   - cr, cg, cb: Color from image RGB
   - scale: From luminance
   - alpha: From edge weight

```python
# In Geometry COMP, Instance page:
# Point the Instance OP to your processed point cloud SOP
```

---

## Part 5: Rendering for Export

### 5.1 Render Setup

**Camera COMP** (`cam1`):

- Projection: Perspective or Orthographic
- Position: (0, 0, 5)
- Look At: (0, 0, 0)

**Light COMP** (`light1`):

- Type: Point or Directional
- Position: (2, 3, 2)

**Render TOP** (`render1`):

- Camera: cam1
- Light: light1
- Resolution: 1920 x 1080

### 5.2 Post-Processing

```
[Render TOP] → [Bloom TOP] → [Level TOP] → [Composite TOP]
```

**Bloom TOP** (`bloom1`):

- Size: 10-20
- Threshold: 0.7
- Gain: 0.5

---

## Part 6: Export for Three.js

### 6.1 Option A: Sprite Sheet / Texture Sequence

Export rendered frames as PNG sequence:

**Movie File Out TOP** (`export_sequence`):

- File: `./export/gateway_frame_$F4.png`
- Type: PNG
- Record: Manual or Timed

Use in Three.js as animated texture or sprite sheet.

### 6.2 Option B: Export Point Data as JSON

Use a **DAT Execute** to export particle positions:

```python
# Script in DAT Execute
import json

def onFrameEnd(frame):
    # Get point data from SOP
    sop = op('point_cloud')
    points = []

    for point in sop.points:
        points.append({
            'x': point.x,
            'y': point.y,
            'z': point.z,
            'r': point.r if hasattr(point, 'r') else 1,
            'g': point.g if hasattr(point, 'g') else 1,
            'b': point.b if hasattr(point, 'b') else 1,
        })

    # Export to JSON
    with open('./export/particles.json', 'w') as f:
        json.dump(points, f)
```

### 6.3 Option C: Export Position Texture (Float32)

For GPGPU simulation in Three.js, export a **float texture**:

**TOP to File**:

- Format: EXR (32-bit float per channel)
- File: `./export/particle_positions.exr`

Load in Three.js with `EXRLoader` for GPGPU initialization.

### 6.4 Option D: Real-time WebSocket Stream (WebWelder)

For live TouchDesigner → Three.js connection:

1. Install **WebWelder** (github.com/AchimPie);
2. Create WebSocket Server in TD
3. Stream particle data as JSON or binary

```python
# In TD CHOP Execute
import json

def onValueChange(channel, sampleIndex, val, prev):
    ws_dat = op('websocket_out')
    data = {
        'positions': [...],  # Your particle positions
        'time': absTime.frame
    }
    ws_dat.send(json.dumps(data))
```

---

## Part 7: Recommended Network Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                      IMAGE PROCESSING                            │
│                                                                  │
│  [key_visual] → [threshold] → [blur] → [level] → [processed]    │
│       ↓                                                          │
│  [edge_detect] → [edge_level] → [edge_map]                      │
│       ↓                                                          │
│  [mono] → [blur] → [depth_map]                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      POINT CLOUD                                 │
│                                                                  │
│  [grid_sop] → [texture_sop] → [noise_sop] → [point_cloud]       │
│                                    ↓                             │
│  [particle_sop] or [glsl_particles]                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      RENDER & EXPORT                             │
│                                                                  │
│  [geo_instancer] → [render_top] → [bloom] → [out]               │
│                         ↓                                        │
│                  [movie_file_out] or [websocket]                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 8: Key Parameters to Experiment With

### Particle Density

- Grid SOP Rows/Columns: 256-1024
- Threshold level: 0.05-0.3
- Birth Rate: 1000-10000

### Depth Effect

- Displacement multiplier: 0.1-1.0
- Blur on depth map: 5-30 pixels
- Z-scale in Point SOP

### Motion

- Curl noise frequency: 0.5-5.0
- Curl noise amplitude: 0.001-0.05
- Return-to-home strength: 0.01-0.1
- Damping: 0.9-0.99

### Visual Style

- Point size: 1-10 pixels
- Bloom threshold: 0.5-0.9
- Color tint from image vs uniform

---

## Part 9: Integration with Three.js Gateway

### 9.1 Load Exported Data

```typescript
// In Three.js / React Three Fiber
import particleData from "./export/particles.json";

// Or load EXR for GPGPU
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";

const loader = new EXRLoader();
loader.load("./export/particle_positions.exr", (texture) => {
  // Use as initial positions for GPGPU simulation
});
```

### 9.2 Blend with Existing Gateway

The exported particles can be:

1. **Added as a new layer** in the existing particle system
2. **Morphed to/from** using scroll progress
3. **Used as attractor points** for existing particles

---

## Quick Start Checklist

- [ ] Create new project, save as `thoughtform-gateway.toe`
- [ ] Import key visual PNG
- [ ] Create threshold + blur + level chain
- [ ] Create edge detection chain
- [ ] Create depth map from luminance
- [ ] Build Grid SOP → Texture SOP → Point Cloud
- [ ] Add Particle SOP or GLSL simulation
- [ ] Set up instancing with colors from image
- [ ] Configure render with bloom
- [ ] Export as PNG sequence or JSON

---

## Resources

- [TouchDesigner Wiki - Particles](https://docs.derivative.ca/Particle_SOP)
- [TouchDesigner Wiki - GLSL](https://docs.derivative.ca/GLSL_TOP)
- [TouchDesigner Wiki - Instancing](https://docs.derivative.ca/Instance)
- [Three.js GPUComputationRenderer](https://threejs.org/docs/#examples/en/misc/GPUComputationRenderer)
- [WebWelder for TD-Web Bridge](https://github.com/AchimPieters/WebWelder)

---

_Last updated: December 2024_
_Thoughtform Design System_
