// ═══════════════════════════════════════════════════════════════
// LAYERED KEY VISUAL SAMPLER
// Converts PNG + depth map into layered particle data (Contour/Fill/Highlight)
// with art-direction controls for density, contrast, gamma, and depth remapping
// ═══════════════════════════════════════════════════════════════

import { loadImage } from "./sampler";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type LayerKind = "contour" | "fill" | "highlight";

/** Per-pixel extracted features (computed once) */
export interface PixelFeatures {
  /** Pixel count */
  count: number;
  /** Image dimensions */
  width: number;
  height: number;
  /** Normalized X positions [-1, 1] adjusted for aspect */
  x: Float32Array;
  /** Normalized Y positions [-1, 1] */
  y: Float32Array;
  /** Raw depth from depth map [0, 1] */
  depthRaw: Float32Array;
  /** Luminance [0, 1] */
  luma: Float32Array;
  /** Alpha [0, 1] */
  alpha: Float32Array;
  /** Edge weight from Sobel [0, 1] */
  edgeWeight: Float32Array;
  /** Original RGB colors [0, 1] per channel */
  r: Float32Array;
  g: Float32Array;
  b: Float32Array;
  /** Source pixel indices for debugging */
  sourceIndex: Uint32Array;
}

/** Configuration for a single layer */
export interface LayerConfig {
  enabled: boolean;
  /** Relative weight (share of maxParticles) */
  weight: number;
  /** Importance mix: how much edge vs luma matters */
  importanceEdgeBias: number; // 0 = all luma, 1 = all edge
  /** Minimum thresholds for inclusion */
  minAlpha: number;
  minLuma: number;
  minEdge: number;
  /** Visual style */
  opacityMultiplier: number;
  sizeMultiplier: number;
  /** Color mode: "image" uses original colors, "tint" uses primary/accent */
  colorMode: "image" | "tint";
}

/** Art-direction controls */
export interface ArtDirectionConfig {
  /** Luma contrast (1 = neutral, >1 = more contrast) */
  contrast: number;
  /** Luma gamma (1 = linear, <1 = brighter mids, >1 = darker mids) */
  gamma: number;
  /** Depth scale multiplier */
  depthScale: number;
  /** Depth gamma curve */
  depthGamma: number;
  /** Invert depth (swap near/far) */
  depthInvert: boolean;
  /** Global luma threshold */
  lumaThreshold: number;
  /** Global alpha threshold */
  alphaThreshold: number;
}

/** Full sampling configuration */
export interface LayeredSamplerConfig {
  /** Maximum total particles across all layers */
  maxParticles: number;
  /** Sampling step (higher = fewer samples, faster) */
  sampleStep: number;
  /** Maximum sample dimension (image scaled to this) */
  maxSampleDim: number;
  /** Aspect ratio override (null = use image aspect) */
  aspectRatio: number | null;
  /** Art-direction controls */
  artDirection: ArtDirectionConfig;
  /** Per-layer configs */
  layers: Record<LayerKind, LayerConfig>;
}

/** Output for a single layer */
export interface LayerData {
  kind: LayerKind;
  count: number;
  /** Positions (x, y, z) interleaved */
  positions: Float32Array;
  /** RGB colors interleaved */
  colors: Float32Array;
  /** Per-particle attributes */
  luma: Float32Array;
  alpha: Float32Array;
  edgeWeight: Float32Array;
  seed: Float32Array;
  /** Config used for this layer */
  config: LayerConfig;
}

/** Full layered output */
export interface LayeredParticleData {
  layers: Record<LayerKind, LayerData>;
  /** Total particle count across all layers */
  totalCount: number;
  /** Original image dimensions */
  imageWidth: number;
  imageHeight: number;
  /** Art-direction config used */
  artDirection: ArtDirectionConfig;
}

// ═══════════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_LAYER_CONFIG: Record<LayerKind, LayerConfig> = {
  contour: {
    enabled: true,
    weight: 0.45,
    importanceEdgeBias: 0.8, // Heavily favor edges
    minAlpha: 0.1,
    minLuma: 0.02,
    minEdge: 0.15, // Only include pixels with some edge
    opacityMultiplier: 1.0,
    sizeMultiplier: 0.8,
    colorMode: "tint",
  },
  fill: {
    enabled: true,
    weight: 0.45,
    importanceEdgeBias: 0.2, // Favor luma over edges
    minAlpha: 0.1,
    minLuma: 0.05,
    minEdge: 0.0, // Include all pixels
    opacityMultiplier: 0.7,
    sizeMultiplier: 1.2,
    colorMode: "image",
  },
  highlight: {
    enabled: true,
    weight: 0.1,
    importanceEdgeBias: 0.3, // Mix of both, favoring bright areas
    minAlpha: 0.1,
    minLuma: 0.7, // Only bright pixels
    minEdge: 0.0,
    opacityMultiplier: 1.2,
    sizeMultiplier: 1.5,
    colorMode: "tint",
  },
};

export const DEFAULT_ART_DIRECTION: ArtDirectionConfig = {
  contrast: 1.0,
  gamma: 1.0,
  depthScale: 0.8,
  depthGamma: 1.0,
  depthInvert: false,
  lumaThreshold: 0.03,
  alphaThreshold: 0.1,
};

export const DEFAULT_LAYERED_SAMPLER_CONFIG: LayeredSamplerConfig = {
  maxParticles: 50000,
  sampleStep: 2,
  maxSampleDim: 512,
  aspectRatio: null,
  artDirection: DEFAULT_ART_DIRECTION,
  layers: DEFAULT_LAYER_CONFIG,
};

// ═══════════════════════════════════════════════════════════════
// PIXEL FEATURE EXTRACTION
// ═══════════════════════════════════════════════════════════════

/**
 * Compute edge strength at a pixel using Sobel operator
 */
function computeSobelEdge(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number
): number {
  if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) return 0;

  const getLuma = (px: number, py: number): number => {
    const idx = (py * width + px) * 4;
    return (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114) / 255;
  };

  // Sobel kernels
  const gx =
    -getLuma(x - 1, y - 1) +
    getLuma(x + 1, y - 1) +
    -2 * getLuma(x - 1, y) +
    2 * getLuma(x + 1, y) +
    -getLuma(x - 1, y + 1) +
    getLuma(x + 1, y + 1);

  const gy =
    -getLuma(x - 1, y - 1) -
    2 * getLuma(x, y - 1) -
    getLuma(x + 1, y - 1) +
    getLuma(x - 1, y + 1) +
    2 * getLuma(x, y + 1) +
    getLuma(x + 1, y + 1);

  return Math.min(1, Math.sqrt(gx * gx + gy * gy) * 2);
}

/**
 * Extract per-pixel features from image + optional depth map.
 * This is computed once and reused for all layer selections.
 */
export async function extractPixelFeatures(
  imageSrc: string,
  depthMapSrc: string | null,
  config: Pick<LayeredSamplerConfig, "sampleStep" | "maxSampleDim" | "aspectRatio">
): Promise<PixelFeatures> {
  const { sampleStep, maxSampleDim, aspectRatio } = config;

  // Load images
  const img = await loadImage(imageSrc);
  const depthImg = depthMapSrc ? await loadImage(depthMapSrc) : null;

  // Create canvases
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not get 2D context");

  // Scale to sample resolution
  const scale = Math.min(1, maxSampleDim / Math.max(img.width, img.height));
  const sampleWidth = Math.floor(img.width * scale);
  const sampleHeight = Math.floor(img.height * scale);

  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
  const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
  const data = imageData.data;

  // Load depth map if provided
  let depthData: Uint8ClampedArray | null = null;
  if (depthImg) {
    const depthCanvas = document.createElement("canvas");
    const depthCtx = depthCanvas.getContext("2d", { willReadFrequently: true });
    if (depthCtx) {
      depthCanvas.width = sampleWidth;
      depthCanvas.height = sampleHeight;
      depthCtx.drawImage(depthImg, 0, 0, sampleWidth, sampleHeight);
      depthData = depthCtx.getImageData(0, 0, sampleWidth, sampleHeight).data;
    }
  }

  // Count candidate pixels
  const candidateCount = Math.ceil(sampleWidth / sampleStep) * Math.ceil(sampleHeight / sampleStep);

  // Allocate typed arrays
  const x = new Float32Array(candidateCount);
  const y = new Float32Array(candidateCount);
  const depthRaw = new Float32Array(candidateCount);
  const luma = new Float32Array(candidateCount);
  const alpha = new Float32Array(candidateCount);
  const edgeWeight = new Float32Array(candidateCount);
  const r = new Float32Array(candidateCount);
  const g = new Float32Array(candidateCount);
  const b = new Float32Array(candidateCount);
  const sourceIndex = new Uint32Array(candidateCount);

  const aspect = aspectRatio ?? sampleWidth / sampleHeight;
  let count = 0;

  for (let py = 0; py < sampleHeight; py += sampleStep) {
    for (let px = 0; px < sampleWidth; px += sampleStep) {
      const idx = (py * sampleWidth + px) * 4;

      // Extract raw pixel data
      const pr = data[idx];
      const pg = data[idx + 1];
      const pb = data[idx + 2];
      const pa = data[idx + 3] / 255;

      // Compute luma
      const pLuma = (pr * 0.299 + pg * 0.587 + pb * 0.114) / 255;

      // Compute edge
      const pEdge = computeSobelEdge(data, px, py, sampleWidth, sampleHeight);

      // Compute depth from depth map or fallback to luma
      let pDepth = 0.5;
      if (depthData) {
        pDepth = depthData[idx] / 255;
      } else {
        pDepth = pLuma; // Fallback: brighter = closer
      }

      // Normalized positions
      const nx = ((px / sampleWidth) * 2 - 1) * aspect;
      const ny = -((py / sampleHeight) * 2 - 1); // Flip Y for Three.js

      // Store
      x[count] = nx;
      y[count] = ny;
      depthRaw[count] = pDepth;
      luma[count] = pLuma;
      alpha[count] = pa;
      edgeWeight[count] = pEdge;
      r[count] = pr / 255;
      g[count] = pg / 255;
      b[count] = pb / 255;
      sourceIndex[count] = py * sampleWidth + px;
      count++;
    }
  }

  // Trim arrays to actual count
  return {
    count,
    width: sampleWidth,
    height: sampleHeight,
    x: x.subarray(0, count),
    y: y.subarray(0, count),
    depthRaw: depthRaw.subarray(0, count),
    luma: luma.subarray(0, count),
    alpha: alpha.subarray(0, count),
    edgeWeight: edgeWeight.subarray(0, count),
    r: r.subarray(0, count),
    g: g.subarray(0, count),
    b: b.subarray(0, count),
    sourceIndex: sourceIndex.subarray(0, count),
  };
}

// ═══════════════════════════════════════════════════════════════
// ART-DIRECTION TRANSFORMS
// ═══════════════════════════════════════════════════════════════

/**
 * Apply contrast adjustment to a value
 */
function applyContrast(value: number, contrast: number): number {
  // Contrast around 0.5 midpoint
  return Math.max(0, Math.min(1, (value - 0.5) * contrast + 0.5));
}

/**
 * Apply gamma correction
 */
function applyGamma(value: number, gamma: number): number {
  return Math.pow(Math.max(0, value), gamma);
}

/**
 * Remap depth with art-direction settings
 */
function remapDepth(rawDepth: number, art: ArtDirectionConfig): number {
  let d = rawDepth;
  if (art.depthInvert) d = 1 - d;
  d = applyGamma(d, art.depthGamma);
  return (d - 0.5) * art.depthScale;
}

// ═══════════════════════════════════════════════════════════════
// LAYER SELECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Compute importance score for a pixel in a given layer
 */
function computeImportance(luma: number, edgeWeight: number, layerConfig: LayerConfig): number {
  const edgeBias = layerConfig.importanceEdgeBias;
  return edgeWeight * edgeBias + luma * (1 - edgeBias);
}

/**
 * Check if a pixel passes the layer's threshold filters
 */
function passesThresholds(
  alpha: number,
  luma: number,
  edgeWeight: number,
  layerConfig: LayerConfig,
  art: ArtDirectionConfig
): boolean {
  if (alpha < Math.max(layerConfig.minAlpha, art.alphaThreshold)) return false;
  if (luma < Math.max(layerConfig.minLuma, art.lumaThreshold)) return false;
  if (edgeWeight < layerConfig.minEdge) return false;
  return true;
}

/**
 * Select particles for a single layer from pixel features
 */
function selectLayerParticles(
  features: PixelFeatures,
  layerKind: LayerKind,
  layerConfig: LayerConfig,
  art: ArtDirectionConfig,
  targetCount: number
): LayerData {
  if (!layerConfig.enabled || targetCount <= 0) {
    return {
      kind: layerKind,
      count: 0,
      positions: new Float32Array(0),
      colors: new Float32Array(0),
      luma: new Float32Array(0),
      alpha: new Float32Array(0),
      edgeWeight: new Float32Array(0),
      seed: new Float32Array(0),
      config: layerConfig,
    };
  }

  // Build candidate list with importance scores
  const candidates: Array<{ index: number; importance: number }> = [];

  for (let i = 0; i < features.count; i++) {
    // Apply art-direction transforms to luma
    const rawLuma = features.luma[i];
    const adjustedLuma = applyGamma(applyContrast(rawLuma, art.contrast), art.gamma);

    if (
      !passesThresholds(features.alpha[i], adjustedLuma, features.edgeWeight[i], layerConfig, art)
    ) {
      continue;
    }

    const importance = computeImportance(adjustedLuma, features.edgeWeight[i], layerConfig);
    candidates.push({ index: i, importance });
  }

  // Sort by importance (highest first)
  candidates.sort((a, b) => b.importance - a.importance);

  // Take top N
  const selected = candidates.slice(0, targetCount);
  const count = selected.length;

  // Allocate output arrays
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const lumaOut = new Float32Array(count);
  const alphaOut = new Float32Array(count);
  const edgeOut = new Float32Array(count);
  const seedOut = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const idx = selected[i].index;

    // Position with remapped depth
    positions[i * 3] = features.x[idx];
    positions[i * 3 + 1] = features.y[idx];
    positions[i * 3 + 2] = remapDepth(features.depthRaw[idx], art);

    // Colors
    colors[i * 3] = features.r[idx];
    colors[i * 3 + 1] = features.g[idx];
    colors[i * 3 + 2] = features.b[idx];

    // Attributes (store adjusted luma for shader use)
    lumaOut[i] = applyGamma(applyContrast(features.luma[idx], art.contrast), art.gamma);
    alphaOut[i] = features.alpha[idx];
    edgeOut[i] = features.edgeWeight[idx];
    seedOut[i] = Math.random();
  }

  return {
    kind: layerKind,
    count,
    positions,
    colors,
    luma: lumaOut,
    alpha: alphaOut,
    edgeWeight: edgeOut,
    seed: seedOut,
    config: layerConfig,
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN LAYERED SAMPLING FUNCTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate layered particle data from an image + depth map.
 *
 * @param imageSrc - URL of the source image
 * @param depthMapSrc - URL of the depth map (optional)
 * @param config - Full sampling configuration
 * @returns Layered particle data ready for rendering
 */
export async function sampleLayeredParticles(
  imageSrc: string,
  depthMapSrc: string | null,
  config: Partial<LayeredSamplerConfig> = {}
): Promise<LayeredParticleData> {
  // Merge with defaults
  const fullConfig: LayeredSamplerConfig = {
    ...DEFAULT_LAYERED_SAMPLER_CONFIG,
    ...config,
    artDirection: { ...DEFAULT_ART_DIRECTION, ...config.artDirection },
    layers: {
      contour: { ...DEFAULT_LAYER_CONFIG.contour, ...config.layers?.contour },
      fill: { ...DEFAULT_LAYER_CONFIG.fill, ...config.layers?.fill },
      highlight: { ...DEFAULT_LAYER_CONFIG.highlight, ...config.layers?.highlight },
    },
  };

  // Extract pixel features once
  const features = await extractPixelFeatures(imageSrc, depthMapSrc, {
    sampleStep: fullConfig.sampleStep,
    maxSampleDim: fullConfig.maxSampleDim,
    aspectRatio: fullConfig.aspectRatio,
  });

  // Calculate per-layer particle counts
  const { layers, maxParticles, artDirection } = fullConfig;
  const enabledLayers = (Object.keys(layers) as LayerKind[]).filter((k) => layers[k].enabled);
  const totalWeight = enabledLayers.reduce((sum, k) => sum + layers[k].weight, 0);

  const layerCounts: Record<LayerKind, number> = {
    contour: 0,
    fill: 0,
    highlight: 0,
  };

  if (totalWeight > 0) {
    for (const kind of enabledLayers) {
      layerCounts[kind] = Math.round(maxParticles * (layers[kind].weight / totalWeight));
    }
  }

  // Select particles for each layer
  const layerData: Record<LayerKind, LayerData> = {
    contour: selectLayerParticles(
      features,
      "contour",
      layers.contour,
      artDirection,
      layerCounts.contour
    ),
    fill: selectLayerParticles(features, "fill", layers.fill, artDirection, layerCounts.fill),
    highlight: selectLayerParticles(
      features,
      "highlight",
      layers.highlight,
      artDirection,
      layerCounts.highlight
    ),
  };

  const totalCount = layerData.contour.count + layerData.fill.count + layerData.highlight.count;

  // Get original image dimensions (need to load again or cache)
  const img = await loadImage(imageSrc);

  return {
    layers: layerData,
    totalCount,
    imageWidth: img.width,
    imageHeight: img.height,
    artDirection,
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: DENSITY ADJUSTMENT (for runtime without re-sampling)
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate draw counts for each layer based on density multipliers.
 * Use this with geometry.setDrawRange() for runtime density control.
 */
export function calculateDrawCounts(
  layerData: Record<LayerKind, LayerData>,
  densityMultipliers: Record<LayerKind, number>
): Record<LayerKind, number> {
  return {
    contour: Math.round(
      layerData.contour.count * Math.max(0, Math.min(1, densityMultipliers.contour))
    ),
    fill: Math.round(layerData.fill.count * Math.max(0, Math.min(1, densityMultipliers.fill))),
    highlight: Math.round(
      layerData.highlight.count * Math.max(0, Math.min(1, densityMultipliers.highlight))
    ),
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITY: MERGE LAYERS (for single-geometry rendering)
// ═══════════════════════════════════════════════════════════════

/**
 * Merge all layers into a single set of typed arrays.
 * Layers are stored contiguously so each can be controlled via drawRange.
 * Returns offsets for each layer within the merged arrays.
 */
export function mergeLayers(layerData: Record<LayerKind, LayerData>): {
  positions: Float32Array;
  colors: Float32Array;
  luma: Float32Array;
  alpha: Float32Array;
  edgeWeight: Float32Array;
  seed: Float32Array;
  layerIndex: Float32Array; // 0 = contour, 1 = fill, 2 = highlight
  totalCount: number;
  offsets: Record<LayerKind, { start: number; count: number }>;
} {
  const order: LayerKind[] = ["contour", "fill", "highlight"];
  const totalCount = order.reduce((sum, k) => sum + layerData[k].count, 0);

  const positions = new Float32Array(totalCount * 3);
  const colors = new Float32Array(totalCount * 3);
  const luma = new Float32Array(totalCount);
  const alpha = new Float32Array(totalCount);
  const edgeWeight = new Float32Array(totalCount);
  const seed = new Float32Array(totalCount);
  const layerIndex = new Float32Array(totalCount);

  const offsets: Record<LayerKind, { start: number; count: number }> = {
    contour: { start: 0, count: 0 },
    fill: { start: 0, count: 0 },
    highlight: { start: 0, count: 0 },
  };

  let offset = 0;
  for (let li = 0; li < order.length; li++) {
    const kind = order[li];
    const layer = layerData[kind];
    offsets[kind] = { start: offset, count: layer.count };

    for (let i = 0; i < layer.count; i++) {
      const outIdx = offset + i;
      positions[outIdx * 3] = layer.positions[i * 3];
      positions[outIdx * 3 + 1] = layer.positions[i * 3 + 1];
      positions[outIdx * 3 + 2] = layer.positions[i * 3 + 2];
      colors[outIdx * 3] = layer.colors[i * 3];
      colors[outIdx * 3 + 1] = layer.colors[i * 3 + 1];
      colors[outIdx * 3 + 2] = layer.colors[i * 3 + 2];
      luma[outIdx] = layer.luma[i];
      alpha[outIdx] = layer.alpha[i];
      edgeWeight[outIdx] = layer.edgeWeight[i];
      seed[outIdx] = layer.seed[i];
      layerIndex[outIdx] = li;
    }
    offset += layer.count;
  }

  return {
    positions,
    colors,
    luma,
    alpha,
    edgeWeight,
    seed,
    layerIndex,
    totalCount,
    offsets,
  };
}
