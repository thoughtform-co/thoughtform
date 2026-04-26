/**
 * Canvas-baked particle sprites for the latent gateway.
 *
 * Three shapes — soft `dot`, hollow `ring`, filled `diamond` — replace the
 * default round soft-circle that `PointsMaterial` ships with so each portal
 * layer gets a particle vocabulary that matches its semantic role
 * (mouth body, tunnel station, accent marker) and harmonizes with the
 * celestial weave's brand grammar without copying it.
 *
 * Lazy-init module singletons. Guarded for SSR even though
 * `LatentInstrument` is `dynamic({ ssr: false })`.
 */
import * as THREE from "three";

const SPRITE_SIZE = 64;

let dotSprite: THREE.CanvasTexture | null = null;
let ringSprite: THREE.CanvasTexture | null = null;
let diamondSprite: THREE.CanvasTexture | null = null;

function makeCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable");
  ctx.clearRect(0, 0, size, size);
  return { canvas, ctx };
}

function finalize(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  tex.premultiplyAlpha = true;
  tex.needsUpdate = true;
  return tex;
}

/** Soft white dot — radial gradient. Tinted per-material via `color`. */
export function getDotSprite(): THREE.CanvasTexture | null {
  if (typeof window === "undefined") return null;
  if (dotSprite) return dotSprite;
  const { canvas, ctx } = makeCanvas(SPRITE_SIZE);
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2;
  const r = SPRITE_SIZE * 0.46;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0.0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.85)");
  grad.addColorStop(0.75, "rgba(255,255,255,0.25)");
  grad.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  dotSprite = finalize(canvas);
  return dotSprite;
}

/** Hollow stroked circle — reads as a calibrated tunnel station node. */
export function getRingSprite(): THREE.CanvasTexture | null {
  if (typeof window === "undefined") return null;
  if (ringSprite) return ringSprite;
  const { canvas, ctx } = makeCanvas(SPRITE_SIZE);
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2;
  const r = SPRITE_SIZE * 0.36;
  ctx.strokeStyle = "rgba(255,255,255,1)";
  ctx.lineWidth = SPRITE_SIZE * 0.07;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ringSprite = finalize(canvas);
  return ringSprite;
}

/** Rotated filled square — diamond accent. Echoes the celestial waypoint
 *  diamond grammar used in `celestialGatewayGeometry.ts`. */
export function getDiamondSprite(): THREE.CanvasTexture | null {
  if (typeof window === "undefined") return null;
  if (diamondSprite) return diamondSprite;
  const { canvas, ctx } = makeCanvas(SPRITE_SIZE);
  const cx = SPRITE_SIZE / 2;
  const cy = SPRITE_SIZE / 2;
  const r = SPRITE_SIZE * 0.34;
  ctx.fillStyle = "rgba(255,255,255,1)";
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fill();
  diamondSprite = finalize(canvas);
  return diamondSprite;
}
