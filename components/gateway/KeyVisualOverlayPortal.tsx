"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { extend } from "@react-three/fiber";
import {
  sampleLayeredParticles,
  mergeLayers,
  type LayeredParticleData,
  type LayerKind,
  type LayerConfig,
  type ArtDirectionConfig,
  DEFAULT_LAYERED_SAMPLER_CONFIG,
  DEFAULT_ART_DIRECTION,
  DEFAULT_LAYER_CONFIG,
} from "@/lib/key-visual/layered-sampler";
import { loadTFPC, type DecodedTFPC } from "@/lib/key-visual/baked-pointcloud";

// ═══════════════════════════════════════════════════════════════
// KEY VISUAL OVERLAY PORTAL
// Layered particle cloud renderer for gateway overlay
// Supports dynamic (image+depth) and baked (TFPC) modes
// Three layers: Contour, Fill, Highlight with independent controls
// ═══════════════════════════════════════════════════════════════

export interface KeyVisualOverlayConfig {
  /** Mode: dynamic samples from images, baked loads TFPC file */
  mode: "dynamic" | "baked";
  /** Source image for dynamic mode */
  imageSrc: string;
  /** Depth map for dynamic mode */
  depthMapSrc: string;
  /** Baked TFPC file URL */
  bakedSrc: string;
  /** Maximum particles (dynamic mode) */
  maxParticles: number;
  /** Sampling step (dynamic mode, higher = fewer particles) */
  sampleStep: number;
  /** Primary particle color (for tinted layers) */
  primaryColor: string;
  /** Accent/glow color (for highlights/contours) */
  accentColor: string;
  /** Overall scale */
  scale: number;
  /** Base particle size */
  particleSize: number;
  /** Interaction strength (pointer attract/repel) */
  interactionStrength: number;
  /** Turbulence/noise strength */
  turbulenceStrength: number;
  /** Breathing animation speed */
  breatheSpeed: number;
  /** Art direction settings */
  artDirection: ArtDirectionConfig;
  /** Per-layer settings */
  layers: Record<
    LayerKind,
    LayerConfig & {
      /** Runtime density multiplier (0-1) */
      density: number;
    }
  >;
  /** Base opacity */
  opacity: number;
  /** Sigil mode: grid-snapped square particles (Thoughtform style) */
  sigilMode: boolean;
  /** Grid size for sigil mode (default: 3px - Thoughtform sacred grid) */
  sigilGridSize: number;
}

export const DEFAULT_OVERLAY_CONFIG: KeyVisualOverlayConfig = {
  mode: "dynamic",
  imageSrc: "",
  depthMapSrc: "",
  bakedSrc: "",
  maxParticles: 50000,
  sampleStep: 2,
  primaryColor: "#ebe3d6",
  accentColor: "#caa554",
  scale: 2.0,
  particleSize: 1.2,
  interactionStrength: 0.15,
  turbulenceStrength: 0.015,
  breatheSpeed: 0.8,
  artDirection: DEFAULT_ART_DIRECTION,
  layers: {
    contour: { ...DEFAULT_LAYER_CONFIG.contour, density: 1.0 },
    fill: { ...DEFAULT_LAYER_CONFIG.fill, density: 1.0 },
    highlight: { ...DEFAULT_LAYER_CONFIG.highlight, density: 1.0 },
  },
  opacity: 1.0,
  sigilMode: false,
  sigilGridSize: 3.0,
};

// ═══════════════════════════════════════════════════════════════
// LAYERED SHADER MATERIAL
// Supports per-layer styling via uniforms + layer index attribute
// ═══════════════════════════════════════════════════════════════

const LayeredParticleMaterial = shaderMaterial(
  {
    uTime: 0,
    uPrimaryColor: new THREE.Color("#ebe3d6"),
    uAccentColor: new THREE.Color("#caa554"),
    uOpacity: 1.0,
    uPointSize: 3.0,
    uPointer: new THREE.Vector3(0, 0, -10),
    uInteractionStrength: 0.15,
    uTurbulenceStrength: 0.015,
    // Per-layer uniforms (0=contour, 1=fill, 2=highlight)
    uLayerOpacity: new THREE.Vector3(1.0, 0.7, 1.2),
    uLayerSize: new THREE.Vector3(0.8, 1.2, 1.5),
    uLayerColorMode: new THREE.Vector3(1.0, 0.0, 1.0), // 0=image, 1=tint
    // Art-direction uniforms for shader-side adjustments
    uContrastGamma: new THREE.Vector2(1.0, 1.0), // x=contrast, y=gamma
    uLumaThreshold: 0.03,
    // Sigil mode: grid-snapped square particles
    uSigilMode: 0.0, // 0=organic, 1=sigil
    uSigilGridSize: 3.0, // Grid cell size (Thoughtform sacred grid = 3)
  },
  // Vertex shader
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uPointer;
    uniform float uInteractionStrength;
    uniform float uTurbulenceStrength;
    uniform float uPointSize;
    uniform vec3 uLayerSize;
    uniform float uSigilMode;
    uniform float uSigilGridSize;
    
    attribute float aLuma;
    attribute float aAlpha;
    attribute float aEdgeWeight;
    attribute float aSeed;
    attribute vec3 aColor;
    attribute float aLayerIndex;
    
    varying float vLuma;
    varying float vAlpha;
    varying float vEdgeWeight;
    varying vec3 vColor;
    varying float vLayerIndex;
    varying float vSigilMode;
    
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
      
      return vec3(
        (snoise(p + dy) - snoise(p - dy)) - (snoise(p + dz) - snoise(p - dz)),
        (snoise(p + dz) - snoise(p - dz)) - (snoise(p + dx) - snoise(p - dx)),
        (snoise(p + dx) - snoise(p - dx)) - (snoise(p + dy) - snoise(p - dy))
      ) / (2.0 * e);
    }
    
    // Grid snap function for Sigil mode
    vec3 snapToGrid(vec3 p, float gridSize) {
      // Snap X and Y to grid; preserve Z for depth layering
      float gridScale = gridSize * 0.01; // Convert pixel-ish to world space
      return vec3(
        floor(p.x / gridScale + 0.5) * gridScale,
        floor(p.y / gridScale + 0.5) * gridScale,
        floor(p.z / gridScale + 0.5) * gridScale
      );
    }
    
    void main() {
      vLuma = aLuma;
      vAlpha = aAlpha;
      vEdgeWeight = aEdgeWeight;
      vColor = aColor;
      vLayerIndex = aLayerIndex;
      vSigilMode = uSigilMode;
      
      vec3 pos = position;
      
      // In Sigil mode, snap positions to grid BEFORE animation
      if (uSigilMode > 0.5) {
        pos = snapToGrid(pos, uSigilGridSize);
      }
      
      // Breathing animation (reduced in Sigil mode for precision)
      float breatheAmount = uSigilMode > 0.5 ? 0.005 : 0.015;
      float breathe = sin(uTime * 0.5 + aSeed * 6.28) * breatheAmount;
      pos *= 1.0 + breathe;
      
      // Turbulence / curl noise displacement (reduced in Sigil mode)
      float turbMult = uSigilMode > 0.5 ? 0.3 : 1.0;
      vec3 noisePos = pos * 2.0 + vec3(uTime * 0.08, 0.0, aSeed * 10.0);
      vec3 curl = curlNoise(noisePos) * uTurbulenceStrength * turbMult;
      pos += curl;
      
      // Pointer interaction (attract/repel) - reduced in Sigil mode
      float interactionMult = uSigilMode > 0.5 ? 0.4 : 1.0;
      vec3 toPointer = uPointer - pos;
      float dist = length(toPointer);
      float influence = 1.0 / (1.0 + dist * dist * 4.0);
      vec3 interactionForce = normalize(toPointer) * influence * uInteractionStrength * interactionMult;
      
      // Repel close particles, attract distant ones
      if (dist < 0.5) {
        interactionForce *= -1.0;
      }
      pos += interactionForce;
      
      // In Sigil mode, snap AGAIN after animation for crisp grid alignment
      if (uSigilMode > 0.5) {
        pos = snapToGrid(pos, uSigilGridSize);
      }
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Size based on layer, depth, luma, and edge weight
      int layerIdx = int(aLayerIndex + 0.5);
      float layerSizeMult = layerIdx == 0 ? uLayerSize.x : (layerIdx == 1 ? uLayerSize.y : uLayerSize.z);
      
      // In Sigil mode, use more uniform sizing (grid-aligned)
      float sizeVariation = uSigilMode > 0.5 
        ? 1.0 + aEdgeWeight * 0.15  // Subtle variation in Sigil mode
        : 1.0 + aEdgeWeight * 0.3 + aLuma * 0.2;  // More variation in Organic mode
      float sizeMultiplier = layerSizeMult * sizeVariation;
      
      // Sigil mode uses slightly larger base size for crisp squares
      float baseSizeMult = uSigilMode > 0.5 ? 1.3 : 1.0;
      gl_PointSize = uPointSize * sizeMultiplier * baseSizeMult * (300.0 / -mvPosition.z);
    }
  `,
  // Fragment shader
  /* glsl */ `
    uniform vec3 uPrimaryColor;
    uniform vec3 uAccentColor;
    uniform float uOpacity;
    uniform float uTime;
    uniform vec3 uLayerOpacity;
    uniform vec3 uLayerColorMode;
    uniform vec2 uContrastGamma;
    uniform float uLumaThreshold;
    uniform float uSigilMode;
    
    varying float vLuma;
    varying float vAlpha;
    varying float vEdgeWeight;
    varying vec3 vColor;
    varying float vLayerIndex;
    varying float vSigilMode;
    
    void main() {
      vec2 center = gl_PointCoord - 0.5;
      float alpha;
      
      if (vSigilMode > 0.5) {
        // SIGIL MODE: Square particles with sharp edges
        // Use max of abs coords to create square shape
        float squareDist = max(abs(center.x), abs(center.y));
        
        // Hard edge with tiny antialiasing
        if (squareDist > 0.45) discard;
        alpha = smoothstep(0.45, 0.4, squareDist);
        
        // Inner glow effect for Sigil mode (subtle)
        float innerGlow = 1.0 - squareDist * 1.5;
        alpha *= 0.85 + innerGlow * 0.15;
      } else {
        // ORGANIC MODE: Circular points with soft edges
        float dist = length(center);
        if (dist > 0.5) discard;
        alpha = smoothstep(0.5, 0.15, dist);
      }
      
      // Apply contrast/gamma to luma for shader-side adjustments
      float adjustedLuma = pow(max(0.0, (vLuma - 0.5) * uContrastGamma.x + 0.5), uContrastGamma.y);
      
      // Early discard for sub-threshold pixels
      if (adjustedLuma < uLumaThreshold) discard;
      
      // Determine layer color mode
      int layerIdx = int(vLayerIndex + 0.5);
      float colorMode = layerIdx == 0 ? uLayerColorMode.x : (layerIdx == 1 ? uLayerColorMode.y : uLayerColorMode.z);
      
      // Compute colors
      vec3 imageColor = vColor;
      vec3 tintColor = mix(uPrimaryColor, uAccentColor, vEdgeWeight * 0.5 + adjustedLuma * 0.3);
      vec3 color = mix(imageColor, tintColor, colorMode);
      
      // In Sigil mode, boost the gold/accent colors for that "digital sacred" look
      if (vSigilMode > 0.5) {
        // Slight warm tint boost
        color = mix(color, uAccentColor, 0.1 + vEdgeWeight * 0.15);
        // Slight brightness boost for definition
        color *= 1.05;
      }
      
      // Subtle pulse for highlights
      if (layerIdx == 2) {
        float pulseAmount = vSigilMode > 0.5 ? 0.04 : 0.08;
        float pulse = sin(uTime * 2.0 + vLuma * 6.28) * pulseAmount + 1.0;
        color *= pulse;
      }
      
      // Layer opacity
      float layerOpacity = layerIdx == 0 ? uLayerOpacity.x : (layerIdx == 1 ? uLayerOpacity.y : uLayerOpacity.z);
      
      // Final alpha - Sigil mode has slightly higher base opacity for definition
      float opacityBoost = vSigilMode > 0.5 ? 1.1 : 1.0;
      float finalAlpha = alpha * vAlpha * uOpacity * layerOpacity * opacityBoost;
      
      gl_FragColor = vec4(color, finalAlpha);
    }
  `
);

// Extend Three.js with our custom material
extend({ LayeredParticleMaterial });

// Type declaration for custom R3F material
declare global {
  namespace JSX {
    interface IntrinsicElements {
      layeredParticleMaterial: {
        ref?: React.Ref<THREE.ShaderMaterial>;
        uTime?: number;
        uPrimaryColor?: THREE.Color;
        uAccentColor?: THREE.Color;
        uOpacity?: number;
        uPointSize?: number;
        uPointer?: THREE.Vector3;
        uInteractionStrength?: number;
        uTurbulenceStrength?: number;
        uLayerOpacity?: THREE.Vector3;
        uLayerSize?: THREE.Vector3;
        uLayerColorMode?: THREE.Vector3;
        uContrastGamma?: THREE.Vector2;
        uLumaThreshold?: number;
        uSigilMode?: number;
        uSigilGridSize?: number;
        attach?: string;
        transparent?: boolean;
        depthWrite?: boolean;
        blending?: THREE.Blending;
      };
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface KeyVisualOverlayPortalProps {
  config?: Partial<KeyVisualOverlayConfig>;
  scrollProgress?: number;
  visible?: boolean;
  /** Pre-loaded particle data (skip sampling if provided) */
  preloadedData?: LayeredParticleData | null;
}

export function KeyVisualOverlayPortal({
  config = {},
  scrollProgress = 0,
  visible = true,
  preloadedData = null,
}: KeyVisualOverlayPortalProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const { viewport, pointer } = useThree();

  // Merge config with defaults
  const opts = useMemo((): KeyVisualOverlayConfig => {
    return {
      ...DEFAULT_OVERLAY_CONFIG,
      ...config,
      artDirection: { ...DEFAULT_OVERLAY_CONFIG.artDirection, ...config.artDirection },
      layers: {
        contour: { ...DEFAULT_OVERLAY_CONFIG.layers.contour, ...config.layers?.contour },
        fill: { ...DEFAULT_OVERLAY_CONFIG.layers.fill, ...config.layers?.fill },
        highlight: { ...DEFAULT_OVERLAY_CONFIG.layers.highlight, ...config.layers?.highlight },
      },
    };
  }, [config]);

  // State for particle data
  const [mergedData, setMergedData] = useState<{
    positions: Float32Array;
    colors: Float32Array;
    luma: Float32Array;
    alpha: Float32Array;
    edgeWeight: Float32Array;
    seed: Float32Array;
    layerIndex: Float32Array;
    totalCount: number;
    offsets: Record<LayerKind, { start: number; count: number }>;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load particle data (preloaded, dynamic, or baked)
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError(null);

    const load = async () => {
      try {
        let layeredData: LayeredParticleData | null = null;

        // Use preloaded data if provided (skip sampling)
        if (preloadedData) {
          layeredData = preloadedData;
        } else if (opts.mode === "baked" && opts.bakedSrc) {
          // Load baked TFPC
          const decoded = await loadTFPC(opts.bakedSrc);
          // Convert decoded to LayeredParticleData format
          layeredData = {
            layers: decoded.layers,
            totalCount: decoded.totalCount,
            imageWidth: decoded.imageWidth,
            imageHeight: decoded.imageHeight,
            artDirection: decoded.artDirection,
          };
        } else if (opts.mode === "dynamic" && opts.imageSrc) {
          // Sample from images
          layeredData = await sampleLayeredParticles(opts.imageSrc, opts.depthMapSrc || null, {
            maxParticles: opts.maxParticles,
            sampleStep: opts.sampleStep,
            artDirection: opts.artDirection,
            layers: {
              contour: opts.layers.contour,
              fill: opts.layers.fill,
              highlight: opts.layers.highlight,
            },
          });
        }

        if (!layeredData || !mounted) return;

        // Merge layers for single-draw rendering
        const merged = mergeLayers(layeredData.layers);

        if (mounted) {
          setMergedData(merged);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load particles");
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [
    preloadedData,
    opts.mode,
    opts.imageSrc,
    opts.depthMapSrc,
    opts.bakedSrc,
    opts.maxParticles,
    opts.sampleStep,
    opts.artDirection,
    opts.layers,
  ]);

  // Update draw range when density changes
  useEffect(() => {
    if (!geometryRef.current || !mergedData) return;

    // Calculate total visible count based on density multipliers
    let visibleCount = 0;
    const { offsets } = mergedData;
    const layerOrder: LayerKind[] = ["contour", "fill", "highlight"];

    for (const kind of layerOrder) {
      const layerConfig = opts.layers[kind];
      if (layerConfig.enabled) {
        const layerVisibleCount = Math.round(offsets[kind].count * layerConfig.density);
        visibleCount += layerVisibleCount;
      }
    }

    // For now, use simple drawRange (full data, density controlled via shader discard)
    // A more optimized approach would sort by importance and use actual drawRange
    geometryRef.current.setDrawRange(0, mergedData.totalCount);
  }, [mergedData, opts.layers]);

  // Convert pointer to 3D position
  const pointerPosition = useMemo(() => new THREE.Vector3(), []);

  // Animation loop
  useFrame((state) => {
    if (!materialRef.current || !visible) return;

    const time = state.clock.elapsedTime;
    materialRef.current.uniforms.uTime.value = time;

    // Update pointer position
    pointerPosition.set(pointer.x * viewport.width * 0.5, pointer.y * viewport.height * 0.5, 0);
    materialRef.current.uniforms.uPointer.value = pointerPosition;

    // Scroll-based fade (matches gateway timing)
    const fadeStart = 0.06;
    const fadeEnd = 0.16;
    const fadeOpacity =
      scrollProgress < fadeStart
        ? 1
        : scrollProgress > fadeEnd
          ? 0
          : 1 - (scrollProgress - fadeStart) / (fadeEnd - fadeStart);

    // Morph/dissolve effect
    const morphStart = 0.04;
    const morphFull = 0.15;
    const morphProgress = Math.min(
      1,
      Math.max(0, (scrollProgress - morphStart) / (morphFull - morphStart))
    );

    // Increase turbulence during morph
    const baseTurbulence = opts.turbulenceStrength;
    materialRef.current.uniforms.uTurbulenceStrength.value = baseTurbulence + morphProgress * 0.12;

    // Reduce interaction during fade
    const interactionFade = Math.max(0, 1 - morphProgress * 2);
    materialRef.current.uniforms.uInteractionStrength.value =
      opts.interactionStrength * interactionFade;

    // Apply final opacity
    materialRef.current.uniforms.uOpacity.value = opts.opacity * fadeOpacity;

    // Update per-layer uniforms
    materialRef.current.uniforms.uLayerOpacity.value.set(
      opts.layers.contour.opacityMultiplier * opts.layers.contour.density,
      opts.layers.fill.opacityMultiplier * opts.layers.fill.density,
      opts.layers.highlight.opacityMultiplier * opts.layers.highlight.density
    );
    materialRef.current.uniforms.uLayerSize.value.set(
      opts.layers.contour.sizeMultiplier,
      opts.layers.fill.sizeMultiplier,
      opts.layers.highlight.sizeMultiplier
    );
    materialRef.current.uniforms.uLayerColorMode.value.set(
      opts.layers.contour.colorMode === "tint" ? 1.0 : 0.0,
      opts.layers.fill.colorMode === "tint" ? 1.0 : 0.0,
      opts.layers.highlight.colorMode === "tint" ? 1.0 : 0.0
    );

    // Art-direction uniforms
    materialRef.current.uniforms.uContrastGamma.value.set(
      opts.artDirection.contrast,
      opts.artDirection.gamma
    );
    materialRef.current.uniforms.uLumaThreshold.value = opts.artDirection.lumaThreshold;

    // Sigil mode uniforms
    materialRef.current.uniforms.uSigilMode.value = opts.sigilMode ? 1.0 : 0.0;
    materialRef.current.uniforms.uSigilGridSize.value = opts.sigilGridSize;
  });

  // Create geometry
  const geometry = useMemo(() => {
    if (!mergedData) return null;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(mergedData.positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(mergedData.colors, 3));
    geo.setAttribute("aLuma", new THREE.BufferAttribute(mergedData.luma, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(mergedData.alpha, 1));
    geo.setAttribute("aEdgeWeight", new THREE.BufferAttribute(mergedData.edgeWeight, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(mergedData.seed, 1));
    geo.setAttribute("aLayerIndex", new THREE.BufferAttribute(mergedData.layerIndex, 1));

    geometryRef.current = geo;
    return geo;
  }, [mergedData]);

  if (isLoading || !geometry) {
    return null;
  }

  if (error) {
    console.warn("KeyVisualOverlayPortal error:", error);
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
      <layeredParticleMaterial
        ref={materialRef}
        attach="material"
        uTime={0}
        uPrimaryColor={new THREE.Color(opts.primaryColor)}
        uAccentColor={new THREE.Color(opts.accentColor)}
        uOpacity={opts.opacity}
        uPointSize={opts.particleSize * 2}
        uPointer={new THREE.Vector3(0, 0, -10)}
        uInteractionStrength={opts.interactionStrength}
        uTurbulenceStrength={opts.turbulenceStrength}
        uLayerOpacity={new THREE.Vector3(1.0, 0.7, 1.2)}
        uLayerSize={new THREE.Vector3(0.8, 1.2, 1.5)}
        uLayerColorMode={new THREE.Vector3(1.0, 0.0, 1.0)}
        uContrastGamma={new THREE.Vector2(1.0, 1.0)}
        uLumaThreshold={0.03}
        uSigilMode={opts.sigilMode ? 1.0 : 0.0}
        uSigilGridSize={opts.sigilGridSize}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default KeyVisualOverlayPortal;
