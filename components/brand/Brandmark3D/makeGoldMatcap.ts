/**
 * makeGoldMatcap — a procedural gold matcap as a `THREE.CanvasTexture`.
 *
 * A matcap (material-capture) texture is a 2D image sampled by the
 * view-space normal of each fragment: `uv = (n.xy * 0.5 + 0.5)`.
 * Centre of the texture (`uv ≈ 0.5, 0.5`) maps to fragments whose
 * normals face the camera (the highlight); the edge of the unit
 * disc maps to fragments whose normals are grazing the camera (the
 * rim). A simple radial gradient — hot core → gold body → deep
 * bronze edge — therefore reads as a polished metal under no actual
 * scene lights, which is exactly what we want for the corridor
 * (entirely unlit shaders today).
 *
 * Plug-in path for a higher-fidelity look: drop a captured-photo
 * gold matcap PNG into `/public/matcaps/` and pass its texture into
 * `<Brandmark3D matcapTexture={...} />` instead of using this
 * procedural generator. The procedural version is the default so
 * the lab works with zero binary assets.
 */

import * as THREE from "three";

/**
 * Matcap shading style:
 *   - `metallic`   — a 3-stop radial (core → mid → edge). Reads as a
 *                    polished metal under no lights (the default gold).
 *   - `iridescent` — a multi-hue radial that sweeps through the
 *                    spectrum from core to rim, giving an oil-slick /
 *                    thin-film read. The `mid` stop tints the gold
 *                    band so the brand colour still anchors it.
 */
export type MatcapStyle = "metallic" | "iridescent";

export interface GoldMatcapStops {
  /** Hot core (centre of the sphere). Default near-white-gold `#fff3d6`. */
  core: string;
  /** Mid stop — the brand gold body. Default `#caa554`. */
  mid: string;
  /** Outer rim — deep bronze that catches the bevel. Default `#3a2a14`. */
  edge: string;
  /** Normalised radius (0..1) at which `mid` is reached. Default 0.35. */
  midStop: number;
  /** Normalised radius (0..1) at which `edge` is reached. Default 0.92. */
  edgeStop: number;
}

export const DEFAULT_GOLD_MATCAP_STOPS: GoldMatcapStops = {
  core: "#fff3d6",
  mid: "#caa554",
  edge: "#3a2a14",
  midStop: 0.35,
  edgeStop: 0.92,
};

export interface MatcapPreset extends GoldMatcapStops {
  style: MatcapStyle;
}

export type MatcapPresetName = "gold" | "chrome" | "gunmetal" | "iridescent" | "holographic";

/**
 * Named matcap presets surfaced in the lab. Each is a full stop set
 * plus a style; the lab's colour pickers can still override any stop
 * after a preset is applied.
 */
export const MATCAP_PRESETS: Record<MatcapPresetName, MatcapPreset> = {
  gold: { ...DEFAULT_GOLD_MATCAP_STOPS, style: "metallic" },
  chrome: {
    core: "#ffffff",
    mid: "#aab2ba",
    edge: "#15191e",
    midStop: 0.42,
    edgeStop: 0.95,
    style: "metallic",
  },
  gunmetal: {
    core: "#d4dade",
    mid: "#565d64",
    edge: "#0b0d0f",
    midStop: 0.3,
    edgeStop: 0.9,
    style: "metallic",
  },
  iridescent: {
    core: "#fff6e2",
    mid: "#caa554",
    edge: "#160e22",
    midStop: 0.4,
    edgeStop: 0.96,
    style: "iridescent",
  },
  holographic: {
    core: "#ffffff",
    mid: "#9ad8ff",
    edge: "#0d0a1c",
    midStop: 0.5,
    edgeStop: 0.98,
    style: "iridescent",
  },
};

export interface MakeMatcapOptions extends Partial<GoldMatcapStops> {
  /** Shading style. Default `metallic`. */
  style?: MatcapStyle;
  /** Square pixel resolution. Default 256. */
  resolution?: number;
}

/** Back-compat alias for the original gold-only signature. */
export type MakeGoldMatcapOptions = Partial<GoldMatcapStops> & {
  resolution?: number;
};

/**
 * Returns a fresh `CanvasTexture` configured for matcap use, in
 * either a metallic or iridescent style.
 *
 * Callers own the lifecycle — call `.dispose()` on unmount (and on
 * regeneration, before swapping the new one in). Calling twice with
 * the same options produces two independent textures.
 */
export function makeMatcapTexture(options: MakeMatcapOptions = {}): THREE.CanvasTexture {
  const style = options.style ?? "metallic";
  const resolution = options.resolution ?? 256;
  const core = options.core ?? DEFAULT_GOLD_MATCAP_STOPS.core;
  const mid = options.mid ?? DEFAULT_GOLD_MATCAP_STOPS.mid;
  const edge = options.edge ?? DEFAULT_GOLD_MATCAP_STOPS.edge;
  const midStop = clamp01(options.midStop ?? DEFAULT_GOLD_MATCAP_STOPS.midStop);
  const edgeStop = clamp01(options.edgeStop ?? DEFAULT_GOLD_MATCAP_STOPS.edgeStop);

  const canvas = document.createElement("canvas");
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    // Fallback flat texture — used only if 2D canvas is unavailable
    // (extremely rare; matcap on a black square would still render).
    return new THREE.CanvasTexture(canvas);
  }

  // Paint the "outside the sphere" region first — fragments with
  // normals pointing away (which shouldn't happen, but might at the
  // bevel rim) sample this colour.
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, resolution, resolution);

  const cx = resolution / 2;
  const cy = resolution / 2;
  const radius = resolution / 2;
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);

  if (style === "iridescent") {
    // Thin-film sweep: hot core → spectral ring sequence → dark rim.
    // The gold `mid` band sits at ~0.62 so the brand colour still
    // reads as the dominant body tone.
    gradient.addColorStop(0, core);
    gradient.addColorStop(0.16, "hsl(276, 82%, 66%)");
    gradient.addColorStop(0.33, "hsl(205, 86%, 62%)");
    gradient.addColorStop(0.5, "hsl(152, 70%, 56%)");
    gradient.addColorStop(clamp01(midStop > 0.55 ? midStop : 0.62), mid);
    gradient.addColorStop(0.84, "hsl(330, 74%, 52%)");
    gradient.addColorStop(clamp01(Math.max(edgeStop, 0.86)), edge);
    gradient.addColorStop(1, edge);
  } else {
    gradient.addColorStop(0, core);
    // Guarantee ordered stops even if user nudges midStop past edgeStop.
    const orderedMid = Math.min(midStop, edgeStop);
    gradient.addColorStop(orderedMid, mid);
    gradient.addColorStop(edgeStop, edge);
    gradient.addColorStop(1, edge);
  }

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  // Matcaps are sampled in screen-space; sRGB encoding keeps the
  // hex stops looking the way they read in design tools.
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Back-compat wrapper — the original gold-only generator. Equivalent
 * to `makeMatcapTexture({ ...stops, style: "metallic" })`.
 */
export function makeGoldMatcap(options: MakeGoldMatcapOptions = {}): THREE.CanvasTexture {
  return makeMatcapTexture({ ...options, style: "metallic" });
}

function clamp01(v: number): number {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
