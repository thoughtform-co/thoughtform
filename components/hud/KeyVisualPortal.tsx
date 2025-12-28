"use client";

import React, { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Points, shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { extend } from "@react-three/fiber";
import { sampleImageToParticles, sampleWithDepthMap } from "@/lib/key-visual/sampler";

// ═══════════════════════════════════════════════════════════════
// KEY VISUAL PORTAL
// Transforms a PNG key visual into an interactive particle cloud
// with pointer-based interaction and breathing/turbulence effects
// ═══════════════════════════════════════════════════════════════

export interface KeyVisualPortalConfig {
  /** Path to the key visual image */
  imageSrc: string;
  /** Optional path to depth map */
  depthMapSrc?: string;
  /** Primary particle color */
  primaryColor?: string;
  /** Accent/glow color */
  accentColor?: string;
  /** Overall scale */
  scale?: number;
  /** Maximum particles */
  maxParticles?: number;
  /** Particle size multiplier */
  particleSize?: number;
  /** Interaction strength (pointer attract/repel) */
  interactionStrength?: number;
  /** Turbulence/noise strength */
  turbulenceStrength?: number;
  /** Breathing animation speed */
  breatheSpeed?: number;
  /** Depth scale for Z positioning */
  depthScale?: number;
  /** Base opacity */
  opacity?: number;
}

const DEFAULT_CONFIG: Required<KeyVisualPortalConfig> = {
  imageSrc: "/images/key-visual.png",
  depthMapSrc: "",
  primaryColor: "#ebe3d6",
  accentColor: "#caa554",
  scale: 1.0,
  maxParticles: 30000,
  particleSize: 1.0,
  interactionStrength: 0.3,
  turbulenceStrength: 0.02,
  breatheSpeed: 1.0,
  depthScale: 0.5,
  opacity: 1.0,
};

// Custom shader material for the key visual particles
const KeyVisualParticleMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color("#ebe3d6"),
    uAccentColor: new THREE.Color("#caa554"),
    uOpacity: 1.0,
    uPointSize: 3.0,
    uPointer: new THREE.Vector3(0, 0, -10),
    uInteractionStrength: 0.3,
    uTurbulenceStrength: 0.02,
    uUseImageColors: 1.0, // 1.0 = use image colors, 0.0 = use uniform colors
  },
  // Vertex shader
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uPointer;
    uniform float uInteractionStrength;
    uniform float uTurbulenceStrength;
    uniform float uPointSize;
    
    attribute float aLuma;
    attribute float aAlpha;
    attribute float aEdgeWeight;
    attribute float aSeed;
    attribute vec3 aColor;  // RGB color from image
    
    varying float vLuma;
    varying float vAlpha;
    varying float vEdgeWeight;
    varying vec3 vColor;
    
    // Simplex noise functions
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
    
    // Curl noise for organic motion
    vec3 curlNoise(vec3 p) {
      const float e = 0.1;
      vec3 dx = vec3(e, 0.0, 0.0);
      vec3 dy = vec3(0.0, e, 0.0);
      vec3 dz = vec3(0.0, 0.0, e);
      
      float n = snoise(p);
      float nx = snoise(p + dx);
      float ny = snoise(p + dy);
      float nz = snoise(p + dz);
      
      return vec3(
        (snoise(p + dy) - snoise(p - dy)) - (snoise(p + dz) - snoise(p - dz)),
        (snoise(p + dz) - snoise(p - dz)) - (snoise(p + dx) - snoise(p - dx)),
        (snoise(p + dx) - snoise(p - dx)) - (snoise(p + dy) - snoise(p - dy))
      ) / (2.0 * e);
    }
    
    void main() {
      vLuma = aLuma;
      vAlpha = aAlpha;
      vEdgeWeight = aEdgeWeight;
      vColor = aColor;
      
      vec3 pos = position;
      
      // Breathing animation (subtle scale oscillation)
      float breathe = sin(uTime * 0.5 + aSeed * 6.28) * 0.02;
      pos *= 1.0 + breathe;
      
      // Turbulence / curl noise displacement
      vec3 noisePos = pos * 2.0 + vec3(uTime * 0.1, 0.0, aSeed * 10.0);
      vec3 curl = curlNoise(noisePos) * uTurbulenceStrength;
      pos += curl;
      
      // Pointer interaction (attract/repel)
      vec3 toPointer = uPointer - pos;
      float dist = length(toPointer);
      float influence = 1.0 / (1.0 + dist * dist * 4.0);
      vec3 interactionForce = normalize(toPointer) * influence * uInteractionStrength;
      
      // Repel close particles, attract distant ones
      if (dist < 0.5) {
        interactionForce *= -1.0; // Repel
      }
      pos += interactionForce;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size based on depth, luma, and edge weight
      float sizeMultiplier = 1.0 + aEdgeWeight * 0.5 + aLuma * 0.3;
      gl_PointSize = uPointSize * sizeMultiplier * (300.0 / -mvPosition.z);
    }
  `,
  // Fragment shader
  /* glsl */ `
    uniform vec3 uColor;
    uniform vec3 uAccentColor;
    uniform float uOpacity;
    uniform float uTime;
    uniform float uUseImageColors;
    
    varying float vLuma;
    varying float vAlpha;
    varying float vEdgeWeight;
    varying vec3 vColor;
    
    void main() {
      // Circular point shape
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      if (dist > 0.5) discard;
      
      // Soft edge with tighter falloff for crispness
      float alpha = smoothstep(0.5, 0.15, dist);
      
      // Use actual image colors or fall back to uniform colors
      vec3 imageColor = vColor;
      vec3 uniformColor = mix(uColor, uAccentColor, vEdgeWeight * 0.5 + vLuma * 0.3);
      vec3 color = mix(uniformColor, imageColor, uUseImageColors);
      
      // Very subtle pulse (reduced from 0.1 to 0.03)
      float pulse = sin(uTime * 1.5 + vLuma * 6.28) * 0.03 + 0.97;
      color *= pulse;
      
      // Final alpha - use vAlpha from image
      float finalAlpha = alpha * vAlpha * uOpacity;
      
      gl_FragColor = vec4(color, finalAlpha);
    }
  `
);

// Extend Three.js with our custom material
extend({ KeyVisualParticleMaterial });

// Type declaration for the custom material
// Type declaration for custom R3F material
declare global {
  namespace JSX {
    interface IntrinsicElements {
      keyVisualParticleMaterial: {
        ref?: React.Ref<THREE.ShaderMaterial>;
        uTime?: number;
        uColor?: THREE.Color;
        uAccentColor?: THREE.Color;
        uOpacity?: number;
        uPointSize?: number;
        uPointer?: THREE.Vector3;
        uInteractionStrength?: number;
        uTurbulenceStrength?: number;
        uUseImageColors?: number;
        attach?: string;
        transparent?: boolean;
        depthWrite?: boolean;
        blending?: THREE.Blending;
      };
    }
  }
}

interface KeyVisualPortalProps {
  config?: Partial<KeyVisualPortalConfig>;
  scrollProgress?: number;
  visible?: boolean;
}

export function KeyVisualPortal({
  config = {},
  scrollProgress = 0,
  visible = true,
}: KeyVisualPortalProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport, pointer } = useThree();

  const opts = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  // State for loaded particle data
  const [particleData, setParticleData] = useState<{
    positions: Float32Array;
    colors: Float32Array;
    luma: Float32Array;
    alpha: Float32Array;
    edgeWeight: Float32Array;
    seed: Float32Array;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load and sample the image
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    const loadParticles = async () => {
      try {
        const result = opts.depthMapSrc
          ? await sampleWithDepthMap(opts.imageSrc, opts.depthMapSrc, {
              maxParticles: opts.maxParticles,
              depthScale: opts.depthScale,
            })
          : await sampleImageToParticles(opts.imageSrc, {
              maxParticles: opts.maxParticles,
              depthScale: opts.depthScale,
            });

        if (mounted) {
          setParticleData({
            positions: result.positions,
            colors: result.colors,
            luma: result.attributes.luma,
            alpha: result.attributes.alpha,
            edgeWeight: result.attributes.edgeWeight,
            seed: result.attributes.seed,
          });
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load image");
          setIsLoading(false);
        }
      }
    };

    loadParticles();
    return () => {
      mounted = false;
    };
  }, [opts.imageSrc, opts.depthMapSrc, opts.maxParticles, opts.depthScale]);

  // Convert pointer to 3D position
  const pointerPosition = useMemo(() => new THREE.Vector3(), []);

  // Animation loop
  useFrame((state) => {
    if (!materialRef.current || !visible) return;

    const time = state.clock.elapsedTime;
    materialRef.current.uniforms.uTime.value = time;

    // Update pointer position in world space
    pointerPosition.set(pointer.x * viewport.width * 0.5, pointer.y * viewport.height * 0.5, 0);
    materialRef.current.uniforms.uPointer.value = pointerPosition;

    // ═══════════════════════════════════════════════════════════════
    // SCROLL BLENDING
    // Match the existing hero/gateway transition timing
    // scrollProgress 0.00-0.06: full visibility
    // scrollProgress 0.06-0.12: fade out
    // ═══════════════════════════════════════════════════════════════

    // Calculate fade opacity (matches ThreeGateway.tsx timing)
    const fadeStart = 0.06;
    const fadeEnd = 0.16;
    const fadeOpacity =
      scrollProgress < fadeStart
        ? 1
        : scrollProgress > fadeEnd
          ? 0
          : 1 - (scrollProgress - fadeStart) / (fadeEnd - fadeStart);

    // Calculate morph/dissolve effect (particles spread out as user scrolls)
    const morphStart = 0.04;
    const morphFull = 0.15;
    const morphProgress = Math.min(
      1,
      Math.max(0, (scrollProgress - morphStart) / (morphFull - morphStart))
    );

    // Increase turbulence as we morph/dissolve
    const baseTurbulence = opts.turbulenceStrength;
    const morphTurbulence = baseTurbulence + morphProgress * 0.15; // Gradually increase turbulence
    materialRef.current.uniforms.uTurbulenceStrength.value = morphTurbulence;

    // Reduce interaction strength as we fade (prevents jarring pointer effects during transition)
    const interactionFade = Math.max(0, 1 - morphProgress * 2);
    materialRef.current.uniforms.uInteractionStrength.value =
      opts.interactionStrength * interactionFade;

    // Apply final opacity
    materialRef.current.uniforms.uOpacity.value = opts.opacity * fadeOpacity;
  });

  // Create geometry with attributes
  const geometry = useMemo(() => {
    if (!particleData) return null;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(particleData.positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(particleData.colors, 3));
    geo.setAttribute("aLuma", new THREE.BufferAttribute(particleData.luma, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(particleData.alpha, 1));
    geo.setAttribute("aEdgeWeight", new THREE.BufferAttribute(particleData.edgeWeight, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(particleData.seed, 1));

    return geo;
  }, [particleData]);

  if (isLoading || !geometry) {
    return null;
  }

  if (error) {
    console.warn("KeyVisualPortal error:", error);
    return null;
  }

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      scale={opts.scale}
      visible={visible}
      frustumCulled={false}
    >
      <keyVisualParticleMaterial
        ref={materialRef}
        attach="material"
        uTime={0}
        uColor={new THREE.Color(opts.primaryColor)}
        uAccentColor={new THREE.Color(opts.accentColor)}
        uOpacity={opts.opacity}
        uPointSize={opts.particleSize * 2}
        uPointer={new THREE.Vector3(0, 0, -10)}
        uInteractionStrength={opts.interactionStrength}
        uTurbulenceStrength={opts.turbulenceStrength}
        transparent={true}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

export default KeyVisualPortal;
