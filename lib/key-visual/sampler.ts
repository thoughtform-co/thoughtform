// ═══════════════════════════════════════════════════════════════
// KEY VISUAL SAMPLER
// Converts a PNG image into particle positions + attributes
// for use in Three.js Points geometry
// ═══════════════════════════════════════════════════════════════

export interface SampledParticle {
  x: number;
  y: number;
  z: number;
  r: number; // Original red (0-1)
  g: number; // Original green (0-1)
  b: number; // Original blue (0-1)
  luma: number;
  alpha: number;
  edgeWeight: number;
  seed: number;
}

export interface SamplerOptions {
  /** Maximum number of particles to generate */
  maxParticles?: number;
  /** Minimum luminance threshold (0-1) to include a pixel */
  lumaThreshold?: number;
  /** Whether to use luminance as pseudo-depth (brighter = closer) */
  lumaAsDepth?: boolean;
  /** Depth scale multiplier when using luma as depth */
  depthScale?: number;
  /** Edge detection strength (0 = no edge weighting, 1 = full) */
  edgeStrength?: number;
  /** Sampling step (higher = fewer particles, faster) */
  sampleStep?: number;
  /** Aspect ratio to maintain (width/height), or null to use image aspect */
  aspectRatio?: number | null;
}

const DEFAULT_OPTIONS: Required<SamplerOptions> = {
  maxParticles: 50000,
  lumaThreshold: 0.05,
  lumaAsDepth: true,
  depthScale: 0.5,
  edgeStrength: 0.5,
  sampleStep: 2,
  aspectRatio: null,
};

/**
 * Load an image from a URL and return as HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Compute edge strength at a pixel using Sobel operator approximation
 */
function computeEdgeStrength(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number
): number {
  if (x <= 0 || x >= width - 1 || y <= 0 || y >= height - 1) return 0;

  const getPixelLuma = (px: number, py: number): number => {
    const idx = (py * width + px) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
  };

  // Sobel kernels (simplified)
  const gx =
    -getPixelLuma(x - 1, y - 1) +
    getPixelLuma(x + 1, y - 1) +
    -2 * getPixelLuma(x - 1, y) +
    2 * getPixelLuma(x + 1, y) +
    -getPixelLuma(x - 1, y + 1) +
    getPixelLuma(x + 1, y + 1);

  const gy =
    -getPixelLuma(x - 1, y - 1) +
    -2 * getPixelLuma(x, y - 1) +
    -getPixelLuma(x + 1, y - 1) +
    getPixelLuma(x - 1, y + 1) +
    2 * getPixelLuma(x, y + 1) +
    getPixelLuma(x + 1, y + 1);

  return Math.sqrt(gx * gx + gy * gy);
}

/**
 * Sample an image and convert to particle data
 * Returns positions normalized to [-1, 1] range (centered on origin)
 */
export async function sampleImageToParticles(
  imageSrc: string,
  options: SamplerOptions = {}
): Promise<{
  particles: SampledParticle[];
  positions: Float32Array;
  colors: Float32Array; // RGB colors per particle
  attributes: {
    luma: Float32Array;
    alpha: Float32Array;
    edgeWeight: Float32Array;
    seed: Float32Array;
  };
  imageWidth: number;
  imageHeight: number;
}> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Load the image
  const img = await loadImage(imageSrc);

  // Create offscreen canvas for pixel sampling
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Could not get 2D context");

  // Use a reasonable sample resolution (not the full image)
  const maxSampleDim = 512;
  const scale = Math.min(1, maxSampleDim / Math.max(img.width, img.height));
  const sampleWidth = Math.floor(img.width * scale);
  const sampleHeight = Math.floor(img.height * scale);

  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);

  const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
  const data = imageData.data;

  // First pass: collect candidate particles
  const candidates: SampledParticle[] = [];
  const step = opts.sampleStep;

  for (let py = 0; py < sampleHeight; py += step) {
    for (let px = 0; px < sampleWidth; px += step) {
      const idx = (py * sampleWidth + px) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3] / 255;

      // Skip transparent or very dark pixels
      if (a < 0.1) continue;

      const luma = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      if (luma < opts.lumaThreshold) continue;

      // Compute edge weight
      const edge = computeEdgeStrength(data, px, py, sampleWidth, sampleHeight);
      const edgeWeight = Math.min(1, edge * 2) * opts.edgeStrength;

      // Normalize position to [-1, 1] centered
      const aspect = opts.aspectRatio ?? sampleWidth / sampleHeight;
      const x = ((px / sampleWidth) * 2 - 1) * aspect;
      const y = -((py / sampleHeight) * 2 - 1); // Flip Y for Three.js

      // Compute Z from luminance (brighter = closer)
      const z = opts.lumaAsDepth ? (luma - 0.5) * opts.depthScale : 0;

      candidates.push({
        x,
        y,
        z,
        r: r / 255, // Store normalized RGB
        g: g / 255,
        b: b / 255,
        luma,
        alpha: a,
        edgeWeight,
        seed: Math.random(),
      });
    }
  }

  // Subsample if we have too many particles
  let particles = candidates;
  if (candidates.length > opts.maxParticles) {
    // Sort by importance (edge weight + luma) and take top N
    candidates.sort((a, b) => {
      const importanceA = a.edgeWeight * 0.6 + a.luma * 0.4;
      const importanceB = b.edgeWeight * 0.6 + b.luma * 0.4;
      return importanceB - importanceA;
    });
    particles = candidates.slice(0, opts.maxParticles);
  }

  // Create typed arrays for Three.js
  const count = particles.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3); // RGB per particle
  const lumaArr = new Float32Array(count);
  const alphaArr = new Float32Array(count);
  const edgeArr = new Float32Array(count);
  const seedArr = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const p = particles[i];
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
    colors[i * 3] = p.r;
    colors[i * 3 + 1] = p.g;
    colors[i * 3 + 2] = p.b;
    lumaArr[i] = p.luma;
    alphaArr[i] = p.alpha;
    edgeArr[i] = p.edgeWeight;
    seedArr[i] = p.seed;
  }

  return {
    particles,
    positions,
    colors,
    attributes: {
      luma: lumaArr,
      alpha: alphaArr,
      edgeWeight: edgeArr,
      seed: seedArr,
    },
    imageWidth: img.width,
    imageHeight: img.height,
  };
}

/**
 * Create Float32Array positions from an optional depth map
 * The depth map modulates the Z position of particles
 */
export async function sampleWithDepthMap(
  imageSrc: string,
  depthMapSrc: string,
  options: SamplerOptions = {}
): Promise<{
  particles: SampledParticle[];
  positions: Float32Array;
  colors: Float32Array;
  attributes: {
    luma: Float32Array;
    alpha: Float32Array;
    edgeWeight: Float32Array;
    seed: Float32Array;
  };
}> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Load both images
  const [img, depthImg] = await Promise.all([loadImage(imageSrc), loadImage(depthMapSrc)]);

  // Create canvases
  const canvas = document.createElement("canvas");
  const depthCanvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const depthCtx = depthCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || !depthCtx) throw new Error("Could not get 2D context");

  // Sample at reduced resolution
  const maxSampleDim = 512;
  const scale = Math.min(1, maxSampleDim / Math.max(img.width, img.height));
  const sampleWidth = Math.floor(img.width * scale);
  const sampleHeight = Math.floor(img.height * scale);

  canvas.width = sampleWidth;
  canvas.height = sampleHeight;
  depthCanvas.width = sampleWidth;
  depthCanvas.height = sampleHeight;

  ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
  depthCtx.drawImage(depthImg, 0, 0, sampleWidth, sampleHeight);

  const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
  const depthData = depthCtx.getImageData(0, 0, sampleWidth, sampleHeight);
  const data = imageData.data;
  const depth = depthData.data;

  const candidates: SampledParticle[] = [];
  const step = opts.sampleStep;

  for (let py = 0; py < sampleHeight; py += step) {
    for (let px = 0; px < sampleWidth; px += step) {
      const idx = (py * sampleWidth + px) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3] / 255;

      if (a < 0.1) continue;

      const luma = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      if (luma < opts.lumaThreshold) continue;

      // Get depth from depth map (red channel, white = close, black = far)
      const depthValue = depth[idx] / 255;

      const edge = computeEdgeStrength(data, px, py, sampleWidth, sampleHeight);
      const edgeWeight = Math.min(1, edge * 2) * opts.edgeStrength;

      const aspect = opts.aspectRatio ?? sampleWidth / sampleHeight;
      const x = ((px / sampleWidth) * 2 - 1) * aspect;
      const y = -((py / sampleHeight) * 2 - 1);

      // Z from depth map instead of luminance
      const z = (depthValue - 0.5) * opts.depthScale;

      candidates.push({
        x,
        y,
        z,
        r: r / 255,
        g: g / 255,
        b: b / 255,
        luma,
        alpha: a,
        edgeWeight,
        seed: Math.random(),
      });
    }
  }

  // Subsample if needed
  let particles = candidates;
  if (candidates.length > opts.maxParticles) {
    candidates.sort((a, b) => {
      const importanceA = a.edgeWeight * 0.6 + a.luma * 0.4;
      const importanceB = b.edgeWeight * 0.6 + b.luma * 0.4;
      return importanceB - importanceA;
    });
    particles = candidates.slice(0, opts.maxParticles);
  }

  const count = particles.length;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const lumaArr = new Float32Array(count);
  const alphaArr = new Float32Array(count);
  const edgeArr = new Float32Array(count);
  const seedArr = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const p = particles[i];
    positions[i * 3] = p.x;
    positions[i * 3 + 1] = p.y;
    positions[i * 3 + 2] = p.z;
    colors[i * 3] = p.r;
    colors[i * 3 + 1] = p.g;
    colors[i * 3 + 2] = p.b;
    lumaArr[i] = p.luma;
    alphaArr[i] = p.alpha;
    edgeArr[i] = p.edgeWeight;
    seedArr[i] = p.seed;
  }

  return {
    particles,
    positions,
    colors,
    attributes: {
      luma: lumaArr,
      alpha: alphaArr,
      edgeWeight: edgeArr,
      seed: seedArr,
    },
  };
}
