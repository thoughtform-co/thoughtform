---
name: Video Particle Effect
overview: Create a Three.js video-to-particles effect inspired by the Kinect example that renders the voice video as a point cloud in the background when hovering over manifesto voice cards, blending with the existing manifold.
todos:
  - id: video-particle-component
    content: Create VideoParticleBackground Three.js component with video-to-points shader
    status: completed
  - id: hover-callback
    content: Add onHoverVideo callback to ManifestoVideoStack
    status: completed
  - id: wire-up
    content: Wire up state and render VideoParticleBackground in NavigationCockpitV2
    status: completed
---

# Video Particle Effect for Manifesto Voices

## Architecture

```mermaid
flowchart TB
    subgraph trigger [Trigger Layer]
        VoiceCard[ManifestoVideoStack hover]
    end

    subgraph state [State Management]
        HoverState[activeVideoUrl state]
    end

    subgraph rendering [Rendering Layers - back to front]
        VideoParticles[VideoParticleBackground - Three.js]
        Manifold[ParticleCanvasV2 - Canvas 2D]
        Terminal[ManifestoTerminal UI]
        Cards[Voice Cards]
    end

    VoiceCard -->|onMouseEnter| HoverState
    HoverState -->|videoUrl| VideoParticles
    VideoParticles -->|blends behind| Manifold
```

## Implementation

### 1. Create VideoParticleBackground Component

New file: [`components/hud/VideoParticleBackground.tsx`](components/hud/VideoParticleBackground.tsx)

- Three.js component using React Three Fiber
- Samples video frames as a texture
- Renders as a point cloud with custom shaders (similar to the [Kinect example](https://github.com/mrdoob/three.js/blob/master/examples/webgl_video_kinect.html))
- Uses luminance to control point displacement/depth
- Gold/dawn color palette matching your brand
- Fade in/out transitions on hover

Key shader uniforms:

- `map` - VideoTexture from the voice video
- `pointSize` - Match manifold particle size
- `opacity` - For fade transitions
- `colorTint` - Gold tint to blend with manifold

### 2. Create State Bridge

Modify [`ManifestoVideoStack.tsx`](components/hud/NavigationCockpitV2/ManifestoVideoStack.tsx):

- Add callback prop `onHoverVideo?: (videoUrl: string | null) => void`
- Call it on mouse enter/leave with the video URL
- Parent component will pass this URL to VideoParticleBackground

### 3. Wire Up in NavigationCockpitV2

Modify [`components/hud/NavigationCockpitV2/index.tsx`](components/hud/NavigationCockpitV2/index.tsx):

- Add state for `activeBackgroundVideo`
- Pass callback to ManifestoVideoStack
- Render VideoParticleBackground behind ParticleCanvasV2
- Only render when in manifesto section and video URL is set

### 4. Positioning and Blending

- VideoParticleBackground renders at `z-index: 0` (behind manifold)
- Use additive blending to merge with manifold particles
- Position the point cloud in the center-right area (behind voice cards)
- Apply same gold color palette as manifold for visual cohesion

## Key Technical Details

Shader approach (from Kinect example adapted):

```glsl
// Vertex: displace points based on video luminance
float depth = (color.r + color.g + color.b) / 3.0;
vec3 pos = position;
pos.z = depth * depthScale;

// Fragment: tint with gold, blend with manifold
gl_FragColor = vec4(goldTint * luminance, opacity);
```

## Files to Create/Modify

| File | Action |

|------|--------|

| `components/hud/VideoParticleBackground.tsx` | Create - Three.js video particles |

| `components/hud/NavigationCockpitV2/ManifestoVideoStack.tsx` | Modify - Add hover callback |
