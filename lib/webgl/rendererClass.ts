/**
 * lib/webgl/rendererClass — one-shot GPU renderer classification.
 *
 * `probeWebGL()` answers "is there a WebGL context at all?"; this answers
 * "is the context backed by real hardware, or by a software rasterizer /
 * a known-weak GPU?" via the `WEBGL_debug_renderer_info` UNMASKED_RENDERER
 * string. It exists so the corridor can:
 *
 *   1. Route software renderers (SwiftShader, llvmpipe, Microsoft Basic
 *      Render Driver, Mesa "softpipe") to the STATIC text fallback — a
 *      2-canvas 3D corridor on a CPU rasterizer is a guaranteed jank
 *      device — see `corridorCapable()` in `lib/hooks/useDeviceTier.ts`.
 *   2. Seed the quality governor (`lib/hooks/useQualityTier.ts`) with a
 *      reduced starting DPR ceiling + particle multiplier for
 *      genuinely weak-but-real GPUs, so those devices open at a lighter
 *      budget instead of discovering it through dropped frames.
 *
 * The result is cached for the session (one throwaway context, read once).
 * Conservative by construction: an unreadable / unknown renderer is
 * treated as `"ok"` so we never strand a capable device on a false
 * negative. The extension is unavailable in a few privacy configs — that
 * also resolves to `"ok"`.
 */

export type RendererClass = "software" | "low" | "ok" | "unknown";

let cached: RendererClass | null = null;

/** Substrings (lower-cased) that mark a CPU / software rasterizer. */
const SOFTWARE_MARKERS = [
  "swiftshader",
  "llvmpipe",
  "softpipe",
  "microsoft basic render",
  "software",
  "google swiftshader",
];

/** Substrings that mark a weak-but-real mobile/integrated GPU family we
 *  want to open at a lighter budget (not fall back — just governed). Kept
 *  deliberately small and specific to avoid demoting mid-range parts. */
const LOW_END_MARKERS = [
  "mali-4", // ARM Mali-4xx (very old)
  "mali-t6", // Mali-T6xx
  "mali-t7", // Mali-T7xx
  "adreno (tm) 3", // Adreno 3xx
  "adreno (tm) 4", // Adreno 4xx
  "powervr sgx",
  "videocore",
];

export function classifyRenderer(): RendererClass {
  if (typeof document === "undefined") return "unknown";
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) {
      cached = "unknown";
      return cached;
    }
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) {
      cached = "ok";
      return cached;
    }
    const raw = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
    const renderer = typeof raw === "string" ? raw.toLowerCase() : "";
    if (!renderer) {
      cached = "ok";
      return cached;
    }
    if (SOFTWARE_MARKERS.some((m) => renderer.includes(m))) {
      cached = "software";
    } else if (LOW_END_MARKERS.some((m) => renderer.includes(m))) {
      cached = "low";
    } else {
      cached = "ok";
    }
  } catch {
    cached = "unknown";
  }
  return cached;
}

/** Test-only: reset the session cache. */
export function __resetRendererClassForTests(): void {
  cached = null;
}
