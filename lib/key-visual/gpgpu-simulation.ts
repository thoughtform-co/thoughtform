// ═══════════════════════════════════════════════════════════════
// GPGPU PARTICLE SIMULATION
// GPU-based particle simulation using ping-pong textures
// Enables TouchDesigner-like flow fields, morphing, and forces
// ═══════════════════════════════════════════════════════════════

import * as THREE from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";

// Simulation shader for position updates
const positionShader = /* glsl */ `
  uniform float uTime;
  uniform float uDeltaTime;
  uniform float uMorphProgress;
  uniform float uFlowStrength;
  uniform float uReturnStrength;
  uniform vec3 uPointer;
  uniform float uPointerStrength;
  uniform float uTurbulence;
  
  // Simplex noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3  ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  // Curl noise for flow field
  vec3 curlNoise(vec3 p) {
    const float e = 0.1;
    
    float n1 = snoise(p + vec3(e, 0.0, 0.0));
    float n2 = snoise(p - vec3(e, 0.0, 0.0));
    float n3 = snoise(p + vec3(0.0, e, 0.0));
    float n4 = snoise(p - vec3(0.0, e, 0.0));
    float n5 = snoise(p + vec3(0.0, 0.0, e));
    float n6 = snoise(p - vec3(0.0, 0.0, e));
    
    return vec3(
      (n3 - n4) - (n5 - n6),
      (n5 - n6) - (n1 - n2),
      (n1 - n2) - (n3 - n4)
    ) / (2.0 * e);
  }
  
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // Sample current position and velocity from textures
    vec4 posData = texture2D(texturePosition, uv);
    vec4 velData = texture2D(textureVelocity, uv);
    
    vec3 pos = posData.xyz;
    vec3 vel = velData.xyz;
    vec3 origin = vec3(posData.w, velData.w, 0.0); // Store origin in w components
    
    // === FLOW FIELD (curl noise) ===
    vec3 flowPos = pos * 2.0 + vec3(uTime * 0.1, 0.0, 0.0);
    vec3 flow = curlNoise(flowPos) * uFlowStrength;
    
    // === RETURN TO ORIGIN FORCE ===
    vec3 toOrigin = origin - pos;
    vec3 returnForce = toOrigin * uReturnStrength;
    
    // === POINTER INTERACTION ===
    vec3 toPointer = uPointer - pos;
    float pointerDist = length(toPointer);
    float pointerInfluence = 1.0 / (1.0 + pointerDist * pointerDist * 4.0);
    vec3 pointerForce = vec3(0.0);
    
    if (pointerDist < 0.5) {
      // Repel when close
      pointerForce = -normalize(toPointer) * pointerInfluence * uPointerStrength;
    } else {
      // Gentle attract when far
      pointerForce = normalize(toPointer) * pointerInfluence * uPointerStrength * 0.3;
    }
    
    // === TURBULENCE ===
    vec3 turbPos = pos * 3.0 + vec3(uTime * 0.2, uTime * 0.15, uTime * 0.1);
    vec3 turbulence = vec3(
      snoise(turbPos),
      snoise(turbPos + vec3(100.0)),
      snoise(turbPos + vec3(200.0))
    ) * uTurbulence;
    
    // === COMBINE FORCES ===
    vec3 totalForce = flow + returnForce + pointerForce + turbulence;
    
    // Update velocity with damping
    vel = vel * 0.95 + totalForce * uDeltaTime;
    
    // Clamp velocity
    float maxSpeed = 0.5;
    float speed = length(vel);
    if (speed > maxSpeed) {
      vel = vel / speed * maxSpeed;
    }
    
    // Update position
    pos += vel * uDeltaTime;
    
    // Output
    gl_FragColor = vec4(pos, posData.w);
  }
`;

// Velocity shader (mostly passes through with some damping)
const velocityShader = /* glsl */ `
  uniform float uDeltaTime;
  
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 velData = texture2D(textureVelocity, uv);
    
    // Apply damping
    vec3 vel = velData.xyz * 0.98;
    
    gl_FragColor = vec4(vel, velData.w);
  }
`;

export interface GPGPUSimulationOptions {
  /** WebGL renderer instance */
  renderer: THREE.WebGLRenderer;
  /** Number of particles (will be rounded to nearest power of 2) */
  particleCount: number;
  /** Initial positions (Float32Array with x,y,z per particle) */
  initialPositions: Float32Array;
}

export interface GPGPUSimulationUniforms {
  time: number;
  deltaTime: number;
  morphProgress: number;
  flowStrength: number;
  returnStrength: number;
  pointer: THREE.Vector3;
  pointerStrength: number;
  turbulence: number;
}

export class GPGPUParticleSimulation {
  private gpuCompute: GPUComputationRenderer;
  private positionVariable: any;
  private velocityVariable: any;
  private textureSize: number;
  private particleCount: number;

  constructor(options: GPGPUSimulationOptions) {
    const { renderer, particleCount, initialPositions } = options;

    // Calculate texture size (power of 2)
    this.textureSize = Math.ceil(Math.sqrt(particleCount));
    // Round up to nearest power of 2
    this.textureSize = Math.pow(2, Math.ceil(Math.log2(this.textureSize)));
    this.particleCount = this.textureSize * this.textureSize;

    // Create GPU computation renderer
    this.gpuCompute = new GPUComputationRenderer(this.textureSize, this.textureSize, renderer);

    // Check for WebGL2 support
    if (!renderer.capabilities.isWebGL2) {
      console.warn("GPGPU simulation requires WebGL2");
    }

    // Create initial position texture
    const positionTexture = this.gpuCompute.createTexture();
    const velocityTexture = this.gpuCompute.createTexture();

    // Fill position texture with initial data
    this.fillPositionTexture(positionTexture, initialPositions);
    this.fillVelocityTexture(velocityTexture);

    // Create position variable
    this.positionVariable = this.gpuCompute.addVariable(
      "texturePosition",
      positionShader,
      positionTexture
    );

    // Create velocity variable
    this.velocityVariable = this.gpuCompute.addVariable(
      "textureVelocity",
      velocityShader,
      velocityTexture
    );

    // Set dependencies
    this.gpuCompute.setVariableDependencies(this.positionVariable, [
      this.positionVariable,
      this.velocityVariable,
    ]);
    this.gpuCompute.setVariableDependencies(this.velocityVariable, [this.velocityVariable]);

    // Add uniforms to position shader
    const posUniforms = this.positionVariable.material.uniforms;
    posUniforms.uTime = { value: 0.0 };
    posUniforms.uDeltaTime = { value: 0.016 };
    posUniforms.uMorphProgress = { value: 0.0 };
    posUniforms.uFlowStrength = { value: 0.1 };
    posUniforms.uReturnStrength = { value: 0.5 };
    posUniforms.uPointer = { value: new THREE.Vector3(0, 0, -10) };
    posUniforms.uPointerStrength = { value: 0.3 };
    posUniforms.uTurbulence = { value: 0.02 };

    // Add uniforms to velocity shader
    const velUniforms = this.velocityVariable.material.uniforms;
    velUniforms.uDeltaTime = { value: 0.016 };

    // Initialize
    const error = this.gpuCompute.init();
    if (error !== null) {
      console.error("GPGPU init error:", error);
    }
  }

  private fillPositionTexture(texture: THREE.DataTexture, initialPositions: Float32Array): void {
    const data = texture.image.data as unknown as Float32Array;
    const count = this.textureSize * this.textureSize;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      if (i3 < initialPositions.length) {
        // Position in xyz, store origin X in w
        data[i4] = initialPositions[i3];
        data[i4 + 1] = initialPositions[i3 + 1];
        data[i4 + 2] = initialPositions[i3 + 2];
        data[i4 + 3] = initialPositions[i3]; // Store origin X
      } else {
        // Fill remaining slots with zeros
        data[i4] = 0;
        data[i4 + 1] = 0;
        data[i4 + 2] = 0;
        data[i4 + 3] = 0;
      }
    }
  }

  private fillVelocityTexture(texture: THREE.DataTexture): void {
    const data = texture.image.data as unknown as Float32Array;
    const count = this.textureSize * this.textureSize;

    for (let i = 0; i < count; i++) {
      const i4 = i * 4;
      // Initialize with zero velocity, store origin Y in w
      data[i4] = 0;
      data[i4 + 1] = 0;
      data[i4 + 2] = 0;
      data[i4 + 3] = 0; // Will be set from position data
    }
  }

  /**
   * Update simulation uniforms
   */
  updateUniforms(uniforms: Partial<GPGPUSimulationUniforms>): void {
    const posUniforms = this.positionVariable.material.uniforms;

    if (uniforms.time !== undefined) posUniforms.uTime.value = uniforms.time;
    if (uniforms.deltaTime !== undefined) posUniforms.uDeltaTime.value = uniforms.deltaTime;
    if (uniforms.morphProgress !== undefined)
      posUniforms.uMorphProgress.value = uniforms.morphProgress;
    if (uniforms.flowStrength !== undefined)
      posUniforms.uFlowStrength.value = uniforms.flowStrength;
    if (uniforms.returnStrength !== undefined)
      posUniforms.uReturnStrength.value = uniforms.returnStrength;
    if (uniforms.pointer !== undefined) posUniforms.uPointer.value.copy(uniforms.pointer);
    if (uniforms.pointerStrength !== undefined)
      posUniforms.uPointerStrength.value = uniforms.pointerStrength;
    if (uniforms.turbulence !== undefined) posUniforms.uTurbulence.value = uniforms.turbulence;

    // Also update velocity shader delta time
    if (uniforms.deltaTime !== undefined) {
      this.velocityVariable.material.uniforms.uDeltaTime.value = uniforms.deltaTime;
    }
  }

  /**
   * Run one step of the simulation
   */
  compute(): void {
    this.gpuCompute.compute();
  }

  /**
   * Get the current position texture for rendering
   */
  getPositionTexture(): THREE.Texture {
    return this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
  }

  /**
   * Get the texture size (particles = textureSize * textureSize)
   */
  getTextureSize(): number {
    return this.textureSize;
  }

  /**
   * Get actual particle count
   */
  getParticleCount(): number {
    return this.particleCount;
  }

  /**
   * Dispose of GPU resources
   */
  dispose(): void {
    this.positionVariable.material.dispose();
    this.velocityVariable.material.dispose();
  }
}

/**
 * Create UV coordinates for reading from the position texture
 * Each particle needs a unique UV to sample its position
 */
export function createParticleUVs(textureSize: number): Float32Array {
  const count = textureSize * textureSize;
  const uvs = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    const x = (i % textureSize) / textureSize;
    const y = Math.floor(i / textureSize) / textureSize;
    uvs[i * 2] = x;
    uvs[i * 2 + 1] = y;
  }

  return uvs;
}

/**
 * Vertex shader for rendering GPGPU particles
 * Reads position from the simulation texture
 */
export const gpgpuParticleVertexShader = /* glsl */ `
  uniform sampler2D uPositionTexture;
  uniform float uPointSize;
  
  attribute vec2 aUV;
  attribute float aLuma;
  attribute float aEdgeWeight;
  
  varying float vLuma;
  varying float vEdgeWeight;
  
  void main() {
    vLuma = aLuma;
    vEdgeWeight = aEdgeWeight;
    
    // Read position from GPGPU texture
    vec4 posData = texture2D(uPositionTexture, aUV);
    vec3 pos = posData.xyz;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size based on attributes
    float sizeMultiplier = 1.0 + aEdgeWeight * 0.5 + aLuma * 0.3;
    gl_PointSize = uPointSize * sizeMultiplier * (300.0 / -mvPosition.z);
  }
`;

/**
 * Fragment shader for rendering GPGPU particles
 */
export const gpgpuParticleFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uAccentColor;
  uniform float uOpacity;
  uniform float uTime;
  
  varying float vLuma;
  varying float vEdgeWeight;
  
  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;
    
    float alpha = smoothstep(0.5, 0.2, dist);
    vec3 color = mix(uColor, uAccentColor, vEdgeWeight * 0.5 + vLuma * 0.3);
    
    float pulse = sin(uTime * 2.0 + vLuma * 6.28) * 0.1 + 0.9;
    color *= pulse;
    
    gl_FragColor = vec4(color, alpha * uOpacity);
  }
`;
