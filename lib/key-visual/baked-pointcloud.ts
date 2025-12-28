// ═══════════════════════════════════════════════════════════════
// TFPC (Thoughtform Point Cloud) Binary Format
// Efficient binary encoding for baked particle data
// Supports layer-separated storage for drawRange-based density control
// ═══════════════════════════════════════════════════════════════

import type {
  LayerKind,
  LayerData,
  LayeredParticleData,
  ArtDirectionConfig,
  LayerConfig,
} from "./layered-sampler";
import { DEFAULT_ART_DIRECTION, DEFAULT_LAYER_CONFIG } from "./layered-sampler";

// ═══════════════════════════════════════════════════════════════
// FORMAT SPECIFICATION
// ═══════════════════════════════════════════════════════════════

/**
 * TFPC Binary Format v1:
 *
 * Header (64 bytes):
 *   - Magic: "TFPC" (4 bytes)
 *   - Version: uint32 (4 bytes)
 *   - Total particle count: uint32 (4 bytes)
 *   - Contour count: uint32 (4 bytes)
 *   - Fill count: uint32 (4 bytes)
 *   - Highlight count: uint32 (4 bytes)
 *   - Image width: uint32 (4 bytes)
 *   - Image height: uint32 (4 bytes)
 *   - Reserved: 32 bytes (for future expansion)
 *
 * Art Direction Config (48 bytes):
 *   - contrast: float32
 *   - gamma: float32
 *   - depthScale: float32
 *   - depthGamma: float32
 *   - depthInvert: uint8 (0 or 1)
 *   - lumaThreshold: float32
 *   - alphaThreshold: float32
 *   - padding to 48 bytes
 *
 * Layer Configs (3 × 48 bytes = 144 bytes):
 *   Per layer (contour, fill, highlight):
 *     - enabled: uint8
 *     - weight: float32
 *     - importanceEdgeBias: float32
 *     - minAlpha: float32
 *     - minLuma: float32
 *     - minEdge: float32
 *     - opacityMultiplier: float32
 *     - sizeMultiplier: float32
 *     - colorMode: uint8 (0 = image, 1 = tint)
 *     - padding to 48 bytes
 *
 * Payload (variable size):
 *   Layers stored contiguously in order: contour, fill, highlight
 *   Per particle (36 bytes):
 *     - position: 3 × float32 (12 bytes)
 *     - color: 3 × float32 (12 bytes)
 *     - luma: float32 (4 bytes)
 *     - alpha: float32 (4 bytes)
 *     - edgeWeight: float32 (4 bytes)
 */

const MAGIC = "TFPC";
const VERSION = 1;
const HEADER_SIZE = 64;
const ART_DIRECTION_SIZE = 48;
const LAYER_CONFIG_SIZE = 48;
const LAYER_CONFIGS_SIZE = LAYER_CONFIG_SIZE * 3;
const BYTES_PER_PARTICLE = 36;

// ═══════════════════════════════════════════════════════════════
// ENCODER
// ═══════════════════════════════════════════════════════════════

/**
 * Encode layered particle data into TFPC binary format
 */
export function encodeTFPC(data: LayeredParticleData): ArrayBuffer {
  const { layers, totalCount, imageWidth, imageHeight, artDirection } = data;
  const totalSize =
    HEADER_SIZE + ART_DIRECTION_SIZE + LAYER_CONFIGS_SIZE + totalCount * BYTES_PER_PARTICLE;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  // ─── Header ───────────────────────────────────────────────
  // Magic
  for (let i = 0; i < 4; i++) {
    view.setUint8(offset++, MAGIC.charCodeAt(i));
  }

  // Version
  view.setUint32(offset, VERSION, true);
  offset += 4;

  // Total count
  view.setUint32(offset, totalCount, true);
  offset += 4;

  // Per-layer counts
  view.setUint32(offset, layers.contour.count, true);
  offset += 4;
  view.setUint32(offset, layers.fill.count, true);
  offset += 4;
  view.setUint32(offset, layers.highlight.count, true);
  offset += 4;

  // Image dimensions
  view.setUint32(offset, imageWidth, true);
  offset += 4;
  view.setUint32(offset, imageHeight, true);
  offset += 4;

  // Reserved (skip to HEADER_SIZE)
  offset = HEADER_SIZE;

  // ─── Art Direction Config ─────────────────────────────────
  view.setFloat32(offset, artDirection.contrast, true);
  offset += 4;
  view.setFloat32(offset, artDirection.gamma, true);
  offset += 4;
  view.setFloat32(offset, artDirection.depthScale, true);
  offset += 4;
  view.setFloat32(offset, artDirection.depthGamma, true);
  offset += 4;
  view.setUint8(offset, artDirection.depthInvert ? 1 : 0);
  offset += 1;
  // Pad to align
  offset += 3;
  view.setFloat32(offset, artDirection.lumaThreshold, true);
  offset += 4;
  view.setFloat32(offset, artDirection.alphaThreshold, true);
  offset += 4;

  // Skip to end of art direction section
  offset = HEADER_SIZE + ART_DIRECTION_SIZE;

  // ─── Layer Configs ────────────────────────────────────────
  const layerOrder: LayerKind[] = ["contour", "fill", "highlight"];
  for (const kind of layerOrder) {
    const config = layers[kind].config;
    const layerStart = offset;

    view.setUint8(offset, config.enabled ? 1 : 0);
    offset += 1;
    // Pad to align float
    offset += 3;
    view.setFloat32(offset, config.weight, true);
    offset += 4;
    view.setFloat32(offset, config.importanceEdgeBias, true);
    offset += 4;
    view.setFloat32(offset, config.minAlpha, true);
    offset += 4;
    view.setFloat32(offset, config.minLuma, true);
    offset += 4;
    view.setFloat32(offset, config.minEdge, true);
    offset += 4;
    view.setFloat32(offset, config.opacityMultiplier, true);
    offset += 4;
    view.setFloat32(offset, config.sizeMultiplier, true);
    offset += 4;
    view.setUint8(offset, config.colorMode === "tint" ? 1 : 0);
    offset += 1;

    // Skip to next layer config
    offset = layerStart + LAYER_CONFIG_SIZE;
  }

  // ─── Particle Data ────────────────────────────────────────
  offset = HEADER_SIZE + ART_DIRECTION_SIZE + LAYER_CONFIGS_SIZE;

  for (const kind of layerOrder) {
    const layer = layers[kind];
    for (let i = 0; i < layer.count; i++) {
      // Position (3 floats)
      view.setFloat32(offset, layer.positions[i * 3], true);
      offset += 4;
      view.setFloat32(offset, layer.positions[i * 3 + 1], true);
      offset += 4;
      view.setFloat32(offset, layer.positions[i * 3 + 2], true);
      offset += 4;

      // Color (3 floats)
      view.setFloat32(offset, layer.colors[i * 3], true);
      offset += 4;
      view.setFloat32(offset, layer.colors[i * 3 + 1], true);
      offset += 4;
      view.setFloat32(offset, layer.colors[i * 3 + 2], true);
      offset += 4;

      // Attributes (3 floats - no seed, it's regenerated)
      view.setFloat32(offset, layer.luma[i], true);
      offset += 4;
      view.setFloat32(offset, layer.alpha[i], true);
      offset += 4;
      view.setFloat32(offset, layer.edgeWeight[i], true);
      offset += 4;
    }
  }

  return buffer;
}

// ═══════════════════════════════════════════════════════════════
// DECODER
// ═══════════════════════════════════════════════════════════════

export interface DecodedTFPC {
  version: number;
  totalCount: number;
  imageWidth: number;
  imageHeight: number;
  artDirection: ArtDirectionConfig;
  layers: Record<LayerKind, LayerData>;
  /** Layer offsets for efficient drawRange usage */
  offsets: Record<LayerKind, { start: number; count: number }>;
}

/**
 * Decode TFPC binary data back to layered particle data
 */
export function decodeTFPC(buffer: ArrayBuffer): DecodedTFPC {
  const view = new DataView(buffer);
  let offset = 0;

  // ─── Validate Magic ───────────────────────────────────────
  const magic = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );
  if (magic !== MAGIC) {
    throw new Error(`Invalid TFPC file: expected magic "TFPC", got "${magic}"`);
  }
  offset = 4;

  // ─── Header ───────────────────────────────────────────────
  const version = view.getUint32(offset, true);
  offset += 4;

  if (version !== VERSION) {
    throw new Error(`Unsupported TFPC version: ${version}`);
  }

  const totalCount = view.getUint32(offset, true);
  offset += 4;

  const contourCount = view.getUint32(offset, true);
  offset += 4;
  const fillCount = view.getUint32(offset, true);
  offset += 4;
  const highlightCount = view.getUint32(offset, true);
  offset += 4;

  const imageWidth = view.getUint32(offset, true);
  offset += 4;
  const imageHeight = view.getUint32(offset, true);
  offset += 4;

  // Skip reserved
  offset = HEADER_SIZE;

  // ─── Art Direction Config ─────────────────────────────────
  const artDirection: ArtDirectionConfig = {
    contrast: view.getFloat32(offset, true),
    gamma: view.getFloat32(offset + 4, true),
    depthScale: view.getFloat32(offset + 8, true),
    depthGamma: view.getFloat32(offset + 12, true),
    depthInvert: view.getUint8(offset + 16) === 1,
    lumaThreshold: view.getFloat32(offset + 20, true),
    alphaThreshold: view.getFloat32(offset + 24, true),
  };
  offset = HEADER_SIZE + ART_DIRECTION_SIZE;

  // ─── Layer Configs ────────────────────────────────────────
  const layerOrder: LayerKind[] = ["contour", "fill", "highlight"];
  const layerConfigs: Record<LayerKind, LayerConfig> = {
    contour: { ...DEFAULT_LAYER_CONFIG.contour },
    fill: { ...DEFAULT_LAYER_CONFIG.fill },
    highlight: { ...DEFAULT_LAYER_CONFIG.highlight },
  };

  for (const kind of layerOrder) {
    const layerStart = offset;

    layerConfigs[kind] = {
      enabled: view.getUint8(offset) === 1,
      weight: view.getFloat32(offset + 4, true),
      importanceEdgeBias: view.getFloat32(offset + 8, true),
      minAlpha: view.getFloat32(offset + 12, true),
      minLuma: view.getFloat32(offset + 16, true),
      minEdge: view.getFloat32(offset + 20, true),
      opacityMultiplier: view.getFloat32(offset + 24, true),
      sizeMultiplier: view.getFloat32(offset + 28, true),
      colorMode: view.getUint8(offset + 32) === 1 ? "tint" : "image",
    };

    offset = layerStart + LAYER_CONFIG_SIZE;
  }

  // ─── Particle Data ────────────────────────────────────────
  offset = HEADER_SIZE + ART_DIRECTION_SIZE + LAYER_CONFIGS_SIZE;

  const counts: Record<LayerKind, number> = {
    contour: contourCount,
    fill: fillCount,
    highlight: highlightCount,
  };

  const offsets: Record<LayerKind, { start: number; count: number }> = {
    contour: { start: 0, count: contourCount },
    fill: { start: contourCount, count: fillCount },
    highlight: { start: contourCount + fillCount, count: highlightCount },
  };

  const layers: Record<LayerKind, LayerData> = {} as Record<LayerKind, LayerData>;

  for (const kind of layerOrder) {
    const count = counts[kind];
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const luma = new Float32Array(count);
    const alpha = new Float32Array(count);
    const edgeWeight = new Float32Array(count);
    const seed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Position
      positions[i * 3] = view.getFloat32(offset, true);
      offset += 4;
      positions[i * 3 + 1] = view.getFloat32(offset, true);
      offset += 4;
      positions[i * 3 + 2] = view.getFloat32(offset, true);
      offset += 4;

      // Color
      colors[i * 3] = view.getFloat32(offset, true);
      offset += 4;
      colors[i * 3 + 1] = view.getFloat32(offset, true);
      offset += 4;
      colors[i * 3 + 2] = view.getFloat32(offset, true);
      offset += 4;

      // Attributes
      luma[i] = view.getFloat32(offset, true);
      offset += 4;
      alpha[i] = view.getFloat32(offset, true);
      offset += 4;
      edgeWeight[i] = view.getFloat32(offset, true);
      offset += 4;

      // Generate new seed (not stored)
      seed[i] = Math.random();
    }

    layers[kind] = {
      kind,
      count,
      positions,
      colors,
      luma,
      alpha,
      edgeWeight,
      seed,
      config: layerConfigs[kind],
    };
  }

  return {
    version,
    totalCount,
    imageWidth,
    imageHeight,
    artDirection,
    layers,
    offsets,
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Download TFPC data as a file
 */
export function downloadTFPC(data: LayeredParticleData, filename: string = "gateway.tfpc"): void {
  const buffer = encodeTFPC(data);
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Load TFPC data from a URL
 */
export async function loadTFPC(url: string): Promise<DecodedTFPC> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load TFPC: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return decodeTFPC(buffer);
}

/**
 * Get file size estimate for a particle count
 */
export function estimateTFPCSize(totalParticles: number): number {
  return (
    HEADER_SIZE + ART_DIRECTION_SIZE + LAYER_CONFIGS_SIZE + totalParticles * BYTES_PER_PARTICLE
  );
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
