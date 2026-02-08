// ═══════════════════════════════════════════════════════════════
// FIGMA REST API CLIENT
// ═══════════════════════════════════════════════════════════════
// Typed wrapper around the Figma REST API (v1).
// All methods are server-side only (uses env token).

import type {
  FigmaFileResponse,
  FigmaFileNodesResponse,
  FigmaImagesResponse,
  FigmaVariablesResponse,
  FigmaExportOptions,
} from "./types";

const FIGMA_API_BASE = "https://api.figma.com";

function getToken(): string {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    throw new Error("FIGMA_ACCESS_TOKEN is not set. Add it to .env.local (see .env.example)");
  }
  return token;
}

function getDefaultFileKey(): string {
  const key = process.env.FIGMA_FILE_KEY;
  if (!key) {
    throw new Error("FIGMA_FILE_KEY is not set. Add it to .env.local (see .env.example)");
  }
  return key;
}

async function figmaFetch<T>(path: string): Promise<T> {
  const token = getToken();
  const url = `${FIGMA_API_BASE}${path}`;

  const res = await fetch(url, {
    headers: {
      "X-Figma-Token": token,
    },
    // Cache for 60s to avoid hitting rate limits
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(`Figma API error ${res.status}: ${res.statusText}. ${errorBody}`);
  }

  return res.json() as Promise<T>;
}

// ═══════════════════════════════════════════════════════════════
// FILE ENDPOINTS
// ═══════════════════════════════════════════════════════════════

export interface GetFileOptions {
  depth?: number;
  ids?: string[];
  geometry?: "paths";
}

/**
 * GET /v1/files/:key
 * Returns the full file structure as JSON.
 */
export async function getFile(fileKey?: string, opts?: GetFileOptions): Promise<FigmaFileResponse> {
  const key = fileKey || getDefaultFileKey();
  const params = new URLSearchParams();

  if (opts?.depth) params.set("depth", String(opts.depth));
  if (opts?.ids?.length) params.set("ids", opts.ids.join(","));
  if (opts?.geometry) params.set("geometry", opts.geometry);

  const qs = params.toString();
  return figmaFetch<FigmaFileResponse>(`/v1/files/${key}${qs ? `?${qs}` : ""}`);
}

/**
 * GET /v1/files/:key/nodes
 * Returns specific nodes by ID.
 */
export async function getFileNodes(
  nodeIds: string[],
  fileKey?: string,
  opts?: { depth?: number; geometry?: "paths" }
): Promise<FigmaFileNodesResponse> {
  const key = fileKey || getDefaultFileKey();
  const params = new URLSearchParams();

  params.set("ids", nodeIds.join(","));
  if (opts?.depth) params.set("depth", String(opts.depth));
  if (opts?.geometry) params.set("geometry", opts.geometry);

  return figmaFetch<FigmaFileNodesResponse>(`/v1/files/${key}/nodes?${params.toString()}`);
}

// ═══════════════════════════════════════════════════════════════
// IMAGE ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /v1/images/:key
 * Renders nodes as images (SVG, PNG, JPG, PDF).
 * Returns URLs to rendered images.
 */
export async function getImages(
  nodeIds: string[],
  fileKey?: string,
  opts?: FigmaExportOptions
): Promise<FigmaImagesResponse> {
  const key = fileKey || getDefaultFileKey();
  const params = new URLSearchParams();

  params.set("ids", nodeIds.join(","));
  params.set("format", opts?.format || "svg");
  if (opts?.scale) params.set("scale", String(opts.scale));
  if (opts?.svgOutlineText !== undefined)
    params.set("svg_outline_text", String(opts.svgOutlineText));
  if (opts?.svgIncludeId !== undefined) params.set("svg_include_id", String(opts.svgIncludeId));

  return figmaFetch<FigmaImagesResponse>(`/v1/images/${key}?${params.toString()}`);
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * Returns all components from the file.
 * Uses the components map from the file response.
 */
export async function getComponents(fileKey?: string) {
  const file = await getFile(fileKey, { depth: 1 });
  return {
    components: file.components,
    componentSets: file.componentSets || {},
    styles: file.styles,
  };
}

// ═══════════════════════════════════════════════════════════════
// VARIABLES ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /v1/files/:key/variables/local
 * Returns local variables from the file.
 * Note: Requires at minimum a Professional plan.
 */
export async function getVariables(fileKey?: string): Promise<FigmaVariablesResponse> {
  const key = fileKey || getDefaultFileKey();
  return figmaFetch<FigmaVariablesResponse>(`/v1/files/${key}/variables/local`);
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Fetch the raw SVG content from a Figma image URL.
 */
export async function fetchSvgContent(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch SVG: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

/**
 * Convert a Figma RGBA color to CSS hex.
 */
export function figmaColorToHex(color: { r: number; g: number; b: number; a?: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Convert a Figma RGBA color to CSS rgba().
 */
export function figmaColorToRgba(color: { r: number; g: number; b: number; a?: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a ?? 1;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
