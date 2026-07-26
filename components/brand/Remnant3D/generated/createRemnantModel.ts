import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type ProceduralModelOptions = {
  wireframe?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  textureSize?: number;
  textureAnisotropy?: number;
  qualityPriority?: 'reference-fidelity' | 'balanced';
};

export type ProceduralModelRuntime = {
  nodes: Record<string, THREE.Object3D>;
  meshes: Record<string, THREE.Mesh>;
  sockets: Record<string, THREE.Object3D>;
  colliders: Record<string, unknown>;
  destructionGroups: Record<string, THREE.Object3D[]>;
};

type SculptMaterialSpec = Record<string, any>;

// bevelEnabled defaults to true on THREE.ExtrudeGeometry and rounds every
// corner — sharp/pointed profiles (blades, fork tines, spikes) need
// bevelEnabled: false plus lineTo()-only path segments near the tip, since a
// curve command cannot produce a true converging point.
function buildExtrudeShape(points: [number, number][], holes?: [number, number][][]): THREE.Shape {
  const shape = new THREE.Shape();
  if (points.length > 0) {
    shape.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) {
      shape.lineTo(points[i][0], points[i][1]);
    }
  }
  // Cutouts (e.g. an oval wire-cutter hole) as THREE.Path added to shape.holes —
  // dep-free boolean subtraction via the tessellator, no CSG library needed.
  for (const loop of holes ?? []) {
    if (loop.length < 3) continue;
    const path = new THREE.Path();
    path.moveTo(loop[0][0], loop[0][1]);
    for (let i = 1; i < loop.length; i += 1) path.lineTo(loop[i][0], loop[i][1]);
    path.closePath();
    shape.holes.push(path);
  }
  return shape;
}

// Build an N-gon oval loop (for hole authoring from a compact {cx,cy,rx,ry} descriptor).
function ovalLoop(cx: number, cy: number, rx: number, ry: number, seg = 24): [number, number][] {
  const loop: [number, number][] = [];
  for (let i = 0; i < seg; i += 1) {
    const a = (i / seg) * Math.PI * 2;
    loop.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return loop;
}

function buildExtrudeGeometry(profile: { points: [number, number][]; depth: number; holes?: [number, number][][]; ovalHoles?: { cx: number; cy: number; rx: number; ry: number }[] }): THREE.ExtrudeGeometry {
  const holes = [...(profile.holes ?? []), ...((profile.ovalHoles ?? []).map((o) => ovalLoop(o.cx, o.cy, o.rx, o.ry)))];
  const shape = buildExtrudeShape(profile.points, holes);
  return new THREE.ExtrudeGeometry(shape, {
    depth: profile.depth,
    bevelEnabled: false,
    steps: 1,
  });
}

// Plan 1.3 F.6 — sweep a thin 2D cross-section along a 3D spine so a curved
// form (hooked blade, handle) reads correctly from EVERY camera angle, not just
// the reference angle a flat extrude happens to match. Uses ExtrudeGeometry's
// native extrudePath; bevelEnabled: false keeps sharp tips (same rule as F.5).
function buildCurveSweepGeometry(
  sweep: { spine: [number, number, number][]; crossSection: { points: [number, number][] }; closed?: boolean },
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const cs = sweep.crossSection.points;
  if (cs.length > 0) {
    shape.moveTo(cs[0][0], cs[0][1]);
    for (let i = 1; i < cs.length; i += 1) shape.lineTo(cs[i][0], cs[i][1]);
    shape.closePath();
  }
  const spine = sweep.spine.map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const path = new THREE.CatmullRomCurve3(spine, sweep.closed ?? false);
  return new THREE.ExtrudeGeometry(shape, {
    extrudePath: path,
    steps: Math.max(24, spine.length * 8),
    bevelEnabled: false,
  });
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function readLayerNumber(value: unknown, keys: string[], fallback: number): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of keys) {
      if (typeof record[key] === 'number') return record[key] as number;
    }
  }
  return fallback;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = /^#[0-9a-f]{3}$/i.test(hex)
    ? '#' + hex.slice(1).split('').map((part) => part + part).join('')
    : hex;
  const value = /^#[0-9a-f]{6}$/i.test(normalized) ? Number.parseInt(normalized.slice(1), 16) : 0x8a7a5f;
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function materialPalette(spec: SculptMaterialSpec): string[] {
  const palette = spec.colorVariation?.palette;
  if (Array.isArray(palette) && palette.length > 0) return palette.filter((value) => typeof value === 'string');
  const secondary = spec.albedo?.secondary;
  const colors = [spec.baseColor ?? spec.color ?? spec.albedo?.dominant, ...(Array.isArray(secondary) ? secondary : [])];
  return colors.filter((value): value is string => typeof value === 'string' && value.startsWith('#'));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothCurve(value: number): number {
  return value * value * (3 - 2 * value);
}

function periodicHash(x: number, y: number, seed: number, periodX: number, periodY: number): number {
  const wrappedX = ((x % periodX) + periodX) % periodX;
  const wrappedY = ((y % periodY) + periodY) % periodY;
  let value = Math.imul(wrappedX + seed * 17, 374761393) ^ Math.imul(wrappedY + seed * 31, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function periodicValueNoise(u: number, v: number, seed: number, periodX: number, periodY: number): number {
  const x = u * periodX;
  const y = v * periodY;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothCurve(x - x0);
  const ty = smoothCurve(y - y0);
  const a = periodicHash(x0, y0, seed, periodX, periodY);
  const b = periodicHash(x0 + 1, y0, seed, periodX, periodY);
  const c = periodicHash(x0, y0 + 1, seed, periodX, periodY);
  const d = periodicHash(x0 + 1, y0 + 1, seed, periodX, periodY);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(a, b, tx), THREE.MathUtils.lerp(c, d, tx), ty);
}

type SurfaceBand = {
  frequency: number;
  amplitude: number;
  stretchX: number;
  stretchY: number;
  ridge: boolean;
};

function surfaceBands(spec: SculptMaterialSpec): SurfaceBand[] {
  const source = Array.isArray(spec.surfaceFrequencyBands) ? spec.surfaceFrequencyBands : [];
  const parsed = source.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return [];
    const band = item as Record<string, unknown>;
    const frequency = typeof band.frequency === 'number' ? band.frequency : 0;
    const amplitude = typeof band.amplitude === 'number' ? band.amplitude : 0;
    if (frequency <= 0 || amplitude <= 0) return [];
    const stretch = Array.isArray(band.stretch) ? band.stretch : [1, 1];
    const description = `${String(band.pattern ?? '')} ${String(band.role ?? '')}`.toLowerCase();
    return [{
      frequency,
      amplitude,
      stretchX: typeof stretch[0] === 'number' ? Math.max(0.1, stretch[0]) : 1,
      stretchY: typeof stretch[1] === 'number' ? Math.max(0.1, stretch[1]) : 1,
      ridge: /(ridge|groove|grain|fiber|striated|crack)/.test(description),
    }];
  });
  return parsed.length > 0 ? parsed : [
    { frequency: 2, amplitude: 0.42, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 12, amplitude: 0.22, stretchX: 1, stretchY: 1, ridge: false },
    { frequency: 56, amplitude: 0.08, stretchX: 1, stretchY: 1, ridge: false },
  ];
}

function sampleSurface(u: number, v: number, bands: SurfaceBand[], seed: number): number {
  let value = 0;
  let weight = 0;
  for (let index = 0; index < bands.length; index += 1) {
    const band = bands[index];
    const periodX = Math.max(1, Math.round(band.frequency * band.stretchX));
    const periodY = Math.max(1, Math.round(band.frequency * band.stretchY));
    let sample = periodicValueNoise(u, v, seed + index * 1013, periodX, periodY);
    if (band.ridge) sample = 1 - Math.abs(sample * 2 - 1);
    value += sample * band.amplitude;
    weight += band.amplitude;
  }
  return weight > 0 ? clamp01(value / weight) : 0.5;
}

function mixPalette(colors: [number, number, number][], value: number): [number, number, number] {
  if (colors.length === 1) return colors[0];
  const scaled = clamp01(value) * (colors.length - 1);
  const index = Math.min(colors.length - 2, Math.floor(scaled));
  const mix = scaled - index;
  const a = colors[index];
  const b = colors[index + 1];
  return [
    Math.round(THREE.MathUtils.lerp(a[0], b[0], mix)),
    Math.round(THREE.MathUtils.lerp(a[1], b[1], mix)),
    Math.round(THREE.MathUtils.lerp(a[2], b[2], mix)),
  ];
}

type ColorGradientStop = { offset: number; color: string };
type ColorGradientSpec = {
  type: 'linear' | 'radial';
  axis: [number, number];
  stops: ColorGradientStop[];
};

function parseRgba(value: string): [number, number, number] {
  const match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(value);
  if (!match) return [138, 122, 95];
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

// Analytical per-pixel gradient sample. The extraction schema's colorGradient carries
// exact rgba(...) stop colors (see extract_part_color_recipe.py), so this samples the
// same trend directly in JS math rather than round-tripping through a Canvas 2D
// createLinearGradient/createRadialGradient object — same visual result, and it composes
// directly with the existing noise/height-correlated colorVariation blend below.
function sampleColorGradient(gradient: ColorGradientSpec, u: number, v: number): [number, number, number] {
  const stops = gradient.stops.length >= 2 ? gradient.stops : [{ offset: 0, color: 'rgba(138,122,95,1)' }, { offset: 1, color: 'rgba(138,122,95,1)' }];
  let t: number;
  if (gradient.type === 'radial') {
    const [cx, cy] = gradient.axis;
    const dx = u - cx;
    const dy = v - cy;
    const maxRadius = Math.max(0.001, Math.hypot(Math.max(cx, 1 - cx), Math.max(cy, 1 - cy)));
    t = clamp01(Math.hypot(dx, dy) / maxRadius);
  } else {
    const [ax, ay] = gradient.axis;
    const projection = (u - 0.5) * ax + (v - 0.5) * ay;
    const maxProjection = 0.5 * (Math.abs(ax) + Math.abs(ay)) || 0.5;
    t = clamp01(projection / maxProjection + 0.5);
  }
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.max(0, Math.floor(scaled)));
  const mix = scaled - index;
  const a = parseRgba(stops[index].color);
  const b = parseRgba(stops[index + 1].color);
  return [
    THREE.MathUtils.lerp(a[0], b[0], mix),
    THREE.MathUtils.lerp(a[1], b[1], mix),
    THREE.MathUtils.lerp(a[2], b[2], mix),
  ];
}

function writePixel(data: Uint8ClampedArray, offset: number, red: number, green: number, blue: number): void {
  data[offset] = Math.max(0, Math.min(255, Math.round(red)));
  data[offset + 1] = Math.max(0, Math.min(255, Math.round(green)));
  data[offset + 2] = Math.max(0, Math.min(255, Math.round(blue)));
  data[offset + 3] = 255;
}

function makeCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function createMapTexture(
  canvas: HTMLCanvasElement,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [2, 2];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 2,
    typeof repeat[1] === 'number' ? repeat[1] : 2,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

type ProceduralTextureSet = {
  albedo: THREE.Texture;
  roughness: THREE.Texture;
  height: THREE.Texture;
  normal: THREE.Texture;
  ao: THREE.Texture;
  source: 'reference-pixel-extraction' | 'procedural';
};

function referenceMapUrl(spec: SculptMaterialSpec, channel: string): string | null {
  const reference = spec.referencePbr;
  if (!reference || typeof reference !== 'object') return null;
  if (reference.usable === false) return null;
  const confidence = typeof reference.confidence === 'number'
    ? reference.confidence
    : (typeof reference.estimatedFidelity === 'number' ? reference.estimatedFidelity : 0);
  const threshold = typeof reference.targetThreshold === 'number' ? reference.targetThreshold : 0.7;
  if (confidence < threshold) return null;
  const maps = reference.maps;
  if (!maps || typeof maps !== 'object') return null;
  const map = (maps as Record<string, unknown>)[channel];
  if (!map || typeof map !== 'object') return null;
  const record = map as Record<string, unknown>;
  const url = typeof record.url === 'string' && record.url.trim() ? record.url : record.path;
  return typeof url === 'string' && url.trim() ? url : null;
}

function createLoadedMapTexture(
  url: string,
  colorSpace: THREE.ColorSpace,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): THREE.Texture {
  const texture = new THREE.TextureLoader().load(url);
  const projection = spec.textureProjection && typeof spec.textureProjection === 'object' ? spec.textureProjection : {};
  const repeat = Array.isArray(projection.repeat) ? projection.repeat : [1, 1];
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(
    typeof repeat[0] === 'number' ? repeat[0] : 1,
    typeof repeat[1] === 'number' ? repeat[1] : 1,
  );
  texture.anisotropy = Math.max(1, Math.round(options.textureAnisotropy ?? projection.anisotropy ?? 8));
  texture.needsUpdate = true;
  return texture;
}

function makeReferenceTextureSet(spec: SculptMaterialSpec, options: ProceduralModelOptions): ProceduralTextureSet | null {
  const albedo = referenceMapUrl(spec, 'albedo');
  const roughness = referenceMapUrl(spec, 'roughness');
  const height = referenceMapUrl(spec, 'height');
  const normal = referenceMapUrl(spec, 'normal');
  const ao = referenceMapUrl(spec, 'ao');
  if (!albedo || !roughness || !height || !normal || !ao) return null;
  return {
    albedo: createLoadedMapTexture(albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createLoadedMapTexture(roughness, THREE.NoColorSpace, spec, options),
    height: createLoadedMapTexture(height, THREE.NoColorSpace, spec, options),
    normal: createLoadedMapTexture(normal, THREE.NoColorSpace, spec, options),
    ao: createLoadedMapTexture(ao, THREE.NoColorSpace, spec, options),
    source: 'reference-pixel-extraction',
  };
}

function makeProceduralTextureSet(
  id: string,
  spec: SculptMaterialSpec,
  options: ProceduralModelOptions,
): ProceduralTextureSet | null {
  if (typeof document === 'undefined') return null;
  const qualityFirst = (options.qualityPriority ?? 'reference-fidelity') === 'reference-fidelity';
  const requested = options.textureSize ?? spec.textureResolution;
  const requestedSize = typeof requested === 'number' && Number.isFinite(requested)
    ? requested
    : (qualityFirst ? 1024 : 512);
  const size = Math.max(256, Math.min(2048, 2 ** Math.round(Math.log2(requestedSize))));
  const canvases = {
    albedo: makeCanvas(size),
    roughness: makeCanvas(size),
    height: makeCanvas(size),
    normal: makeCanvas(size),
    ao: makeCanvas(size),
  };
  const contexts = {
    albedo: canvases.albedo.getContext('2d'),
    roughness: canvases.roughness.getContext('2d'),
    height: canvases.height.getContext('2d'),
    normal: canvases.normal.getContext('2d'),
    ao: canvases.ao.getContext('2d'),
  };
  if (!contexts.albedo || !contexts.roughness || !contexts.height || !contexts.normal || !contexts.ao) return null;
  const images = {
    albedo: contexts.albedo.createImageData(size, size),
    roughness: contexts.roughness.createImageData(size, size),
    height: contexts.height.createImageData(size, size),
    normal: contexts.normal.createImageData(size, size),
    ao: contexts.ao.createImageData(size, size),
  };
  const seed = hashString(id);
  const bands = surfaceBands(spec);
  const heightField = new Float32Array(size * size);
  const roughnessField = new Float32Array(size * size);
  const palette = materialPalette(spec);
  const fallback = typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F';
  const colors = (palette.length >= 2 ? palette : [fallback, '#6E614B', '#A08F70']).map(hexToRgb);
  const baseRoughness = clamp01(readLayerNumber(spec.roughness, ['base'], 0.76));
  const roughnessVariation = clamp01(readLayerNumber(spec.roughness, ['variation'], 0.18));
  const colorAmplitude = clamp01(readLayerNumber(spec.colorVariation, ['amplitude', 'variation'], 0.18));
  const heightCorrelation = clamp01(readLayerNumber(spec.colorVariation, ['heightCorrelation'], 0.3));
  const colorGradient: ColorGradientSpec | undefined = spec.colorGradient;
  for (let y = 0; y < size; y += 1) {
    const v = y / size;
    for (let x = 0; x < size; x += 1) {
      const u = x / size;
      const index = y * size + x;
      const height = sampleSurface(u, v, bands, seed + 101);
      const roughNoise = sampleSurface(u, v, bands, seed + 7001);
      const colorNoise = sampleSurface(u, v, bands, seed + 15013);
      heightField[index] = height;
      roughnessField[index] = clamp01(baseRoughness + (roughNoise - 0.5) * roughnessVariation * 2);
      let color: [number, number, number];
      if (colorGradient) {
        // Evidence-derived spatial gradient (Plan 1.3 Workstream C) takes priority
        // over the noise-based palette blend below — it is a measured trend, not a guess.
        color = sampleColorGradient(colorGradient, u, v);
      } else {
        const paletteValue = clamp01(
          0.5 + (colorNoise - 0.5) * colorAmplitude * 2 + (height - 0.5) * heightCorrelation
        );
        color = mixPalette(colors, paletteValue);
      }
      writePixel(images.albedo.data, index * 4, color[0], color[1], color[2]);
    }
  }
  const normalStrength = Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35));
  const aoStrength = clamp01(readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35));
  for (let y = 0; y < size; y += 1) {
    const up = ((y - 1 + size) % size) * size;
    const down = ((y + 1) % size) * size;
    for (let x = 0; x < size; x += 1) {
      const left = (x - 1 + size) % size;
      const right = (x + 1) % size;
      const index = y * size + x;
      const center = heightField[index];
      const dx = (heightField[y * size + right] - heightField[y * size + left]) * normalStrength * 6;
      const dy = (heightField[down + x] - heightField[up + x]) * normalStrength * 6;
      const inverseLength = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const normalX = -dx * inverseLength;
      const normalY = -dy * inverseLength;
      const normalZ = inverseLength;
      const neighborAverage = (
        heightField[y * size + left] + heightField[y * size + right]
        + heightField[up + x] + heightField[down + x]
      ) * 0.25;
      const cavity = Math.max(0, neighborAverage - center);
      const ao = clamp01(1 - aoStrength * (cavity * 12 + (1 - center) * 0.16));
      const offset = index * 4;
      const heightByte = center * 255;
      const roughnessByte = roughnessField[index] * 255;
      writePixel(images.height.data, offset, heightByte, heightByte, heightByte);
      writePixel(images.roughness.data, offset, roughnessByte, roughnessByte, roughnessByte);
      writePixel(
        images.normal.data, offset,
        (normalX * 0.5 + 0.5) * 255,
        (normalY * 0.5 + 0.5) * 255,
        (normalZ * 0.5 + 0.5) * 255,
      );
      writePixel(images.ao.data, offset, ao * 255, ao * 255, ao * 255);
    }
  }
  contexts.albedo.putImageData(images.albedo, 0, 0);
  contexts.roughness.putImageData(images.roughness, 0, 0);
  contexts.height.putImageData(images.height, 0, 0);
  contexts.normal.putImageData(images.normal, 0, 0);
  contexts.ao.putImageData(images.ao, 0, 0);
  return {
    albedo: createMapTexture(canvases.albedo, THREE.SRGBColorSpace, spec, options),
    roughness: createMapTexture(canvases.roughness, THREE.NoColorSpace, spec, options),
    height: createMapTexture(canvases.height, THREE.NoColorSpace, spec, options),
    normal: createMapTexture(canvases.normal, THREE.NoColorSpace, spec, options),
    ao: createMapTexture(canvases.ao, THREE.NoColorSpace, spec, options),
    source: 'procedural',
  };
}

function createSculptMaterial(id: string, spec: SculptMaterialSpec, options: ProceduralModelOptions): THREE.MeshPhysicalMaterial {
  const textures = makeReferenceTextureSet(spec, options) ?? makeProceduralTextureSet(id, spec, options);
  const material = new THREE.MeshPhysicalMaterial({
    color: textures ? 0xffffff : new THREE.Color(typeof spec.baseColor === 'string' ? spec.baseColor : '#8A7A5F'),
    roughness: textures ? 1 : clamp01(readLayerNumber(spec.roughness, ['base'], 0.76)),
    metalness: clamp01(readLayerNumber(spec.metalness, ['base'], 0.0)),
    clearcoat: clamp01(readLayerNumber(spec.clearcoat, ['base', 'amount'], 0)),
    clearcoatRoughness: clamp01(readLayerNumber(spec.clearcoatRoughness, ['base'], 0.25)),
    transmission: clamp01(readLayerNumber(spec.transmission, ['base', 'amount'], 0)),
    ior: Math.max(1, readLayerNumber(spec.ior, ['base', 'value'], 1.5)),
    thickness: Math.max(0, readLayerNumber(spec.thickness, ['base', 'amount'], 0)),
    attenuationDistance: Math.max(0.001, readLayerNumber(spec.attenuationDistance, ['base', 'value'], Infinity)),
    attenuationColor: new THREE.Color(typeof spec.attenuationColor === 'string' ? spec.attenuationColor : '#ffffff'),
    sheen: clamp01(readLayerNumber(spec.sheen, ['base', 'amount'], 0)),
    sheenColor: new THREE.Color(typeof spec.sheenColor === 'string' ? spec.sheenColor : '#ffffff'),
    sheenRoughness: clamp01(readLayerNumber(spec.sheenRoughness, ['base'], 1.0)),
    iridescence: clamp01(readLayerNumber(spec.iridescence, ['base', 'amount'], 0)),
    iridescenceIOR: Math.max(1, readLayerNumber(spec.iridescenceIOR, ['base', 'value'], 1.3)),
    anisotropy: clamp01(readLayerNumber(spec.anisotropy, ['base', 'amount'], 0)),
    anisotropyRotation: readLayerNumber(spec.anisotropy, ['rotation'], 0),
    specularIntensity: clamp01(readLayerNumber(spec.specularIntensity, ['base'], 1.0)),
    specularColor: new THREE.Color(typeof spec.specularColor === 'string' ? spec.specularColor : '#ffffff'),
    emissive: new THREE.Color(typeof spec.emissive === 'string' ? spec.emissive : '#000000'),
    emissiveIntensity: Math.max(0, readLayerNumber(spec.emissiveIntensity, ['base'], 1.0)),
    opacity: clamp01(readLayerNumber(spec.opacity, ['base'], 1)),
    transparent: readLayerNumber(spec.transmission, ['base', 'amount'], 0) > 0 || readLayerNumber(spec.opacity, ['base'], 1) < 1,
    alphaTest: Math.max(0, readLayerNumber(spec.alpha, ['cutoff', 'alphaTest'], 0)),
    wireframe: options.wireframe ?? false,
    side: spec.doubleSided === true ? THREE.DoubleSide : THREE.FrontSide,
  });
  if (textures) {
    material.map = textures.albedo;
    material.roughnessMap = textures.roughness;
    material.normalMap = textures.normal;
    material.normalScale.setScalar(Math.max(0.05, readLayerNumber(spec.normal, ['strength', 'amplitude'], 0.35)));
    material.aoMap = textures.ao;
    material.aoMap.channel = 0;
    material.aoMapIntensity = readLayerNumber(spec.ambientOcclusion, ['cavityStrength', 'strength'], 0.35);
    const bumpScale = Math.max(0, readLayerNumber(spec.bump, ['amplitude', 'strength'], 0));
    if (bumpScale > 0) {
      material.bumpMap = textures.height;
      material.bumpScale = bumpScale;
    }
    const displacementScale = Math.max(0, readLayerNumber(spec.displacement, ['amplitude', 'strength'], 0));
    if (displacementScale > 0) {
      material.displacementMap = textures.height;
      material.displacementScale = displacementScale;
      material.displacementBias = -displacementScale * 0.5;
    }
  }
  material.envMapIntensity = readLayerNumber(spec, ['envMapIntensity'], 0.8);
  material.userData.sculptMaterial = spec;
  material.userData.proceduralMapsIndependent = true;
  material.userData.pbrTextureSource = textures?.source ?? 'flat-fallback';
  material.userData.referencePbr = spec.referencePbr ?? null;
  material.needsUpdate = true;
  return material;
}

type AttachmentEndpoint = {
  start: THREE.Vector3;
  midpoint: THREE.Vector3;
  quaternion: THREE.Quaternion;
  length: number;
  baseRadius: number;
  endRadius: number;
};

function readVector3(value: unknown, fallback: [number, number, number]): THREE.Vector3 {
  if (Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'number')) {
    return new THREE.Vector3(value[0], value[1], value[2]);
  }
  return new THREE.Vector3(fallback[0], fallback[1], fallback[2]);
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function makeAttachmentEndpoint(attachment: unknown): AttachmentEndpoint | null {
  if (!attachment || typeof attachment !== 'object') return null;
  const record = attachment as Record<string, unknown>;
  const start = readVector3(record.localStart, [0, 0, 0]);
  const end = readVector3(record.localEnd, [0, 1, 0]);
  const delta = end.clone().sub(start);
  const length = delta.length();
  if (length <= 0.0001) return null;
  const direction = delta.clone().normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  const baseRadius = Math.max(0.005, readNumber(record.baseRadius, 0.06));
  const endRadius = Math.max(0.003, readNumber(record.endRadius, baseRadius * 0.55));
  return {
    start,
    midpoint: delta.multiplyScalar(0.5),
    quaternion,
    length,
    baseRadius,
    endRadius,
  };
}

// Generated from ObjectSculptSpec target: Remnant Structure 07LF
// Sculpt build pass: blockout
// This factory is intentionally pass-gated. Finish browser screenshot review before unlocking deeper passes.
export function createRemnantStructure07LFModel(options: ProceduralModelOptions = {}): THREE.Group {
  const root = new THREE.Group();
  root.name = "Remnant Structure 07LF";
  root.userData.reconstructionEvidence = {"itemFamily": null, "subtype": null, "componentAdapter": null, "route": null, "exactnessTier": null, "referenceCamera": {"solved": false, "fovDegrees": 40.0, "aspect": 1.0, "orientation": {"yaw": 0.0, "pitch": 0.0, "roll": 0.0}, "positionHint": [0.0, 0.0, 3.0], "note": "For likeness work, solve the reference camera (forge/stage1_intake/solve_camera_pose.py) so the review render aligns with the photo and the reference can be projected. Confirm by overlay review."}, "approximationNotes": []};

  const materialMap: Record<string, THREE.Material> = {};
  materialMap["mat-plated-bone"] = createSculptMaterial(
    "mat-plated-bone",
    {"id": "mat-plated-bone", "name": "Bone-white plated hull", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#D8D0C2", "color": "#D8D0C2", "albedo": {"dominant": "#D6CBC4", "secondary": ["#BCB1AB", "#E7DDD5", "#161618"], "samplingNotes": "Reference-derived from foreground pixels; de-lit to reduce baked shadows/highlights.", "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-plated-bone\\mat-plated-bone_albedo.png", "url": "mat-plated-bone_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}}, "colorVariation": {"palette": ["#D6CBC4", "#BCB1AB", "#E7DDD5", "#161618", "#857C78"], "pattern": "reference-derived pixel palette", "amplitude": 0.34, "heightCorrelation": 0.42}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.52, "role": "reference-derived broad albedo and height breakup"}, {"id": "meso", "frequency": 14.0, "amplitude": 0.35, "role": "reference-derived cracks, ridges, pores, grain, or leaf clusters"}, {"id": "micro", "frequency": 72.0, "amplitude": 0.14, "role": "reference-derived micro highlight breakup under grazing light"}], "roughness": {"base": 0.711, "variation": 0.151, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-plated-bone\\mat-plated-bone_roughness.png", "url": "mat-plated-bone_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "localResponse": "reference-derived roughness estimate; cavities and textured zones trend rougher, bright highlights trend smoother"}, "metalness": {"base": 0.0, "variation": 0.05}, "normal": {"pattern": "reference-derived height-gradient normal map", "strength": 0.242, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-plated-bone\\mat-plated-bone_normal.png", "url": "mat-plated-bone_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "heightSource": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-plated-bone\\mat-plated-bone_height.png", "url": "mat-plated-bone_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "space": "tangent"}, "bump": {"pattern": "reference-derived height field", "amplitude": 0.033, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-plated-bone\\mat-plated-bone_height.png", "url": "mat-plated-bone_height.png", "channel": "height", "source": "reference-pixel-extraction"}}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.38, "contactShadowBias": 0.35, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-plated-bone\\mat-plated-bone_ao.png", "url": "mat-plated-bone_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}, "notes": "Reference-derived cavity estimate from local height minima; verify against grazing-light screenshot."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "rim-sheen", "name": "Eroded rim polish", "roughness": 0.26, "maskSource": "curvature-convex", "notes": "Only low-roughness zone on the object."}, {"id": "ochre-oxide", "name": "Ochre oxide wash", "color": "#8A6A46", "roughness": 0.86, "maskSource": "cavity-and-spall", "notes": "Concentrated in delamination gaps and around spall sites; absent on intact plating."}, {"id": "travel-abrasion", "name": "Directional travel abrasion", "roughness": 0.62, "maskSource": "anisotropic-streak-along-sweep", "notes": "Streaks parallel to the sweep direction."}, {"id": "reference-pbr-pixel-evidence", "type": "material-map-evidence", "evidenceRefs": ["full-object"], "channels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "notes": "Use generated maps as material evidence, then refine after browser screenshot comparison."}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there.", "Reference-derived maps are estimates from image pixels; verify with neutral, grazing, and reference-matched renders.", "Do not treat baked image shadows as final albedo; rerun extraction with a tighter material crop if highlights/shadows pollute the maps."], "notes": "Replace with image-derived color, roughness, noise, and edge-wear notes.", "materialClass": "ceramic", "referencePbr": {"version": "1.0", "sourceImage": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-plated-bone.png", "extractor": "stage1_intake/extract_pbr_evidence.py", "method": "single-image pixel evidence with de-lighting estimate; not photogrammetry", "usable": true, "verdict": "pass", "confidence": 0.86, "estimatedFidelity": 0.86, "targetThreshold": 0.7, "hardLimit": "A single image cannot uniquely recover true albedo/roughness/normal/AO; maps are reference-derived estimates.", "maps": {"albedo": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-plated-bone\\mat-plated-bone_albedo.png", "url": "mat-plated-bone_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-plated-bone\\mat-plated-bone_roughness.png", "url": "mat-plated-bone_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-plated-bone\\mat-plated-bone_height.png", "url": "mat-plated-bone_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-plated-bone\\mat-plated-bone_normal.png", "url": "mat-plated-bone_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-plated-bone\\mat-plated-bone_ao.png", "url": "mat-plated-bone_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}, "diagnostics": {"sourceWidth": 512, "sourceHeight": 512, "mapSize": 1024, "cropBBoxPixels": {"x": 0, "y": 0, "width": 458, "height": 512}, "mask": {"backgroundColor": "#1A1A1C", "backgroundNoise": 41.665, "transparentPixelFraction": 0.0, "foregroundCoverage": 0.5892}, "mapStats": {"valueRange": 0.8094, "heightP90Gradient": 0.07314, "roughnessBase": 0.711, "roughnessVariation": 0.151, "normalStrength": 0.242, "blurRadius": 21}, "palette": ["#D6CBC4", "#BCB1AB", "#E7DDD5", "#161618", "#857C78"]}, "warnings": ["single-image inverse rendering cannot prove true physical PBR; confidence is capped"]}},
    options
  );
  materialMap["mat-lamina-substrate"] = createSculptMaterial(
    "mat-lamina-substrate",
    {"id": "mat-lamina-substrate", "name": "Dark stratified substrate", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#2A2622", "color": "#2A2622", "albedo": {"dominant": "#17181C", "secondary": ["#0F1014", "#09090C", "#3C3431"], "samplingNotes": "Reference-derived from foreground pixels; de-lit to reduce baked shadows/highlights.", "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-lamina-substrate\\mat-lamina-substrate_albedo.png", "url": "mat-lamina-substrate_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}}, "colorVariation": {"palette": ["#17181C", "#0F1014", "#09090C", "#3C3431", "#E1DEDD"], "pattern": "reference-derived pixel palette", "amplitude": 0.08, "heightCorrelation": 0.42}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.335, "role": "reference-derived broad albedo and height breakup"}, {"id": "meso", "frequency": 14.0, "amplitude": 0.321, "role": "reference-derived cracks, ridges, pores, grain, or leaf clusters"}, {"id": "micro", "frequency": 72.0, "amplitude": 0.14, "role": "reference-derived micro highlight breakup under grazing light"}], "roughness": {"base": 0.68, "variation": 0.077, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-lamina-substrate\\mat-lamina-substrate_roughness.png", "url": "mat-lamina-substrate_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "localResponse": "reference-derived roughness estimate; cavities and textured zones trend rougher, bright highlights trend smoother"}, "metalness": {"base": 0.0, "variation": 0.05}, "normal": {"pattern": "reference-derived height-gradient normal map", "strength": 0.204, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-lamina-substrate\\mat-lamina-substrate_normal.png", "url": "mat-lamina-substrate_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "heightSource": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-lamina-substrate\\mat-lamina-substrate_height.png", "url": "mat-lamina-substrate_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "space": "tangent"}, "bump": {"pattern": "reference-derived height field", "amplitude": 0.018, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-lamina-substrate\\mat-lamina-substrate_height.png", "url": "mat-lamina-substrate_height.png", "channel": "height", "source": "reference-pixel-extraction"}}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.38, "contactShadowBias": 0.35, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-lamina-substrate\\mat-lamina-substrate_ao.png", "url": "mat-lamina-substrate_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}, "notes": "Reference-derived cavity estimate from local height minima; verify against grazing-light screenshot."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "ply-contrast", "name": "Per-ply tonal alternation", "roughness": 0.9, "maskSource": "ply-index-parity", "notes": "Alternating lamina tone is what makes the stack legible."}, {"id": "reference-pbr-pixel-evidence", "type": "material-map-evidence", "evidenceRefs": ["full-object"], "channels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "notes": "Use generated maps as material evidence, then refine after browser screenshot comparison."}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there.", "Reference-derived maps are estimates from image pixels; verify with neutral, grazing, and reference-matched renders.", "Do not treat baked image shadows as final albedo; rerun extraction with a tighter material crop if highlights/shadows pollute the maps."], "notes": "Replace with image-derived color, roughness, noise, and edge-wear notes.", "materialClass": "stone", "referencePbr": {"version": "1.0", "sourceImage": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-lamina-substrate.png", "extractor": "stage1_intake/extract_pbr_evidence.py", "method": "single-image pixel evidence with de-lighting estimate; not photogrammetry", "usable": true, "verdict": "pass", "confidence": 0.852, "estimatedFidelity": 0.852, "targetThreshold": 0.7, "hardLimit": "A single image cannot uniquely recover true albedo/roughness/normal/AO; maps are reference-derived estimates.", "maps": {"albedo": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-lamina-substrate\\mat-lamina-substrate_albedo.png", "url": "mat-lamina-substrate_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-lamina-substrate\\mat-lamina-substrate_roughness.png", "url": "mat-lamina-substrate_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-lamina-substrate\\mat-lamina-substrate_height.png", "url": "mat-lamina-substrate_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-lamina-substrate\\mat-lamina-substrate_normal.png", "url": "mat-lamina-substrate_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-lamina-substrate\\mat-lamina-substrate_ao.png", "url": "mat-lamina-substrate_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}, "diagnostics": {"sourceWidth": 512, "sourceHeight": 512, "mapSize": 1024, "cropBBoxPixels": {"x": 0, "y": 0, "width": 512, "height": 512}, "mask": {"backgroundColor": "#313034", "backgroundNoise": 113.679, "transparentPixelFraction": 0.0, "foregroundCoverage": 0.1626}, "mapStats": {"valueRange": 0.1568, "heightP90Gradient": 0.04064, "roughnessBase": 0.68, "roughnessVariation": 0.077, "normalStrength": 0.204, "blurRadius": 21}, "palette": ["#17181C", "#0F1014", "#09090C", "#3C3431", "#E1DEDD"]}, "warnings": ["single-image inverse rendering cannot prove true physical PBR; confidence is capped", "low value range weakens height/roughness inference"]}},
    options
  );
  materialMap["mat-cavity-shadow"] = createSculptMaterial(
    "mat-cavity-shadow",
    {"id": "mat-cavity-shadow", "name": "Cavity interior", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#141210", "color": "#141210", "albedo": {"dominant": "#17191D", "secondary": ["#0E0E12", "#48474B", "#2F2F33"], "samplingNotes": "Reference-derived from foreground pixels; de-lit to reduce baked shadows/highlights.", "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-cavity-shadow\\mat-cavity-shadow_albedo.png", "url": "mat-cavity-shadow_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}}, "colorVariation": {"palette": ["#17191D", "#0E0E12", "#48474B", "#2F2F33", "#605F63"], "pattern": "reference-derived pixel palette", "amplitude": 0.139, "heightCorrelation": 0.42}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.396, "role": "reference-derived broad albedo and height breakup"}, {"id": "meso", "frequency": 14.0, "amplitude": 0.318, "role": "reference-derived cracks, ridges, pores, grain, or leaf clusters"}, {"id": "micro", "frequency": 72.0, "amplitude": 0.14, "role": "reference-derived micro highlight breakup under grazing light"}], "roughness": {"base": 0.68, "variation": 0.083, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-cavity-shadow\\mat-cavity-shadow_roughness.png", "url": "mat-cavity-shadow_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "localResponse": "reference-derived roughness estimate; cavities and textured zones trend rougher, bright highlights trend smoother"}, "metalness": {"base": 0.0, "variation": 0.05}, "normal": {"pattern": "reference-derived height-gradient normal map", "strength": 0.203, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-cavity-shadow\\mat-cavity-shadow_normal.png", "url": "mat-cavity-shadow_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "heightSource": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-cavity-shadow\\mat-cavity-shadow_height.png", "url": "mat-cavity-shadow_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "space": "tangent"}, "bump": {"pattern": "reference-derived height field", "amplitude": 0.018, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-cavity-shadow\\mat-cavity-shadow_height.png", "url": "mat-cavity-shadow_height.png", "channel": "height", "source": "reference-pixel-extraction"}}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.38, "contactShadowBias": 0.35, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-cavity-shadow\\mat-cavity-shadow_ao.png", "url": "mat-cavity-shadow_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}, "notes": "Reference-derived cavity estimate from local height minima; verify against grazing-light screenshot."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "occlusion-falloff", "name": "Depth-driven occlusion", "roughness": 0.95, "maskSource": "ambient-occlusion", "notes": "Cavity darkens sharply with depth; keeps the hole reading as a hole."}, {"id": "reference-pbr-pixel-evidence", "type": "material-map-evidence", "evidenceRefs": ["full-object"], "channels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "notes": "Use generated maps as material evidence, then refine after browser screenshot comparison."}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there.", "Reference-derived maps are estimates from image pixels; verify with neutral, grazing, and reference-matched renders.", "Do not treat baked image shadows as final albedo; rerun extraction with a tighter material crop if highlights/shadows pollute the maps."], "notes": "Replace with image-derived color, roughness, noise, and edge-wear notes.", "materialClass": "stone", "referencePbr": {"version": "1.0", "sourceImage": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-cavity-shadow.png", "extractor": "stage1_intake/extract_pbr_evidence.py", "method": "single-image pixel evidence with de-lighting estimate; not photogrammetry", "usable": true, "verdict": "pass", "confidence": 0.83, "estimatedFidelity": 0.83, "targetThreshold": 0.7, "hardLimit": "A single image cannot uniquely recover true albedo/roughness/normal/AO; maps are reference-derived estimates.", "maps": {"albedo": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-cavity-shadow\\mat-cavity-shadow_albedo.png", "url": "mat-cavity-shadow_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-cavity-shadow\\mat-cavity-shadow_roughness.png", "url": "mat-cavity-shadow_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-cavity-shadow\\mat-cavity-shadow_height.png", "url": "mat-cavity-shadow_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-cavity-shadow\\mat-cavity-shadow_normal.png", "url": "mat-cavity-shadow_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-cavity-shadow\\mat-cavity-shadow_ao.png", "url": "mat-cavity-shadow_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}, "diagnostics": {"sourceWidth": 512, "sourceHeight": 512, "mapSize": 1024, "cropBBoxPixels": {"x": 353, "y": 0, "width": 159, "height": 321}, "mask": {"backgroundColor": "#1A1A1C", "backgroundNoise": 0.0, "transparentPixelFraction": 0.0, "foregroundCoverage": 0.0697}, "mapStats": {"valueRange": 0.3311, "heightP90Gradient": 0.03991, "roughnessBase": 0.68, "roughnessVariation": 0.083, "normalStrength": 0.203, "blurRadius": 21}, "palette": ["#17191D", "#0E0E12", "#48474B", "#2F2F33", "#605F63"]}, "warnings": ["foreground mask is very small", "single-image inverse rendering cannot prove true physical PBR; confidence is capped"]}},
    options
  );
  materialMap["mat-spall-debris"] = createSculptMaterial(
    "mat-spall-debris",
    {"id": "mat-spall-debris", "name": "Spall debris", "type": "standard", "shaderModel": "MeshStandardMaterial / PBR approximation", "baseColor": "#C4B7A4", "color": "#C4B7A4", "albedo": {"dominant": "#CFC0B7", "secondary": ["#B7A79E", "#96867C", "#E7D9D0"], "samplingNotes": "Reference-derived from foreground pixels; de-lit to reduce baked shadows/highlights.", "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-spall-debris\\mat-spall-debris_albedo.png", "url": "mat-spall-debris_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}}, "colorVariation": {"palette": ["#CFC0B7", "#B7A79E", "#96867C", "#E7D9D0", "#5C504A"], "pattern": "reference-derived pixel palette", "amplitude": 0.225, "heightCorrelation": 0.42}, "textureResolution": 1024, "textureProjection": {"mode": "uv", "repeat": [2.0, 2.0], "anisotropy": 8, "texelDensityIntent": "Preserve stable world/object-scale detail; do not stretch micro detail with component scale."}, "surfaceFrequencyBands": [{"id": "macro", "frequency": 2.0, "amplitude": 0.467, "role": "reference-derived broad albedo and height breakup"}, {"id": "meso", "frequency": 14.0, "amplitude": 0.35, "role": "reference-derived cracks, ridges, pores, grain, or leaf clusters"}, {"id": "micro", "frequency": 72.0, "amplitude": 0.14, "role": "reference-derived micro highlight breakup under grazing light"}], "roughness": {"base": 0.683, "variation": 0.15, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-spall-debris\\mat-spall-debris_roughness.png", "url": "mat-spall-debris_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "localResponse": "reference-derived roughness estimate; cavities and textured zones trend rougher, bright highlights trend smoother"}, "metalness": {"base": 0.0, "variation": 0.05}, "normal": {"pattern": "reference-derived height-gradient normal map", "strength": 0.243, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-spall-debris\\mat-spall-debris_normal.png", "url": "mat-spall-debris_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "heightSource": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-spall-debris\\mat-spall-debris_height.png", "url": "mat-spall-debris_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "space": "tangent"}, "bump": {"pattern": "reference-derived height field", "amplitude": 0.033, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-spall-debris\\mat-spall-debris_height.png", "url": "mat-spall-debris_height.png", "channel": "height", "source": "reference-pixel-extraction"}}, "displacement": {"pattern": "none", "amplitude": 0.0, "scale": 1.0, "silhouetteAffects": false}, "ambientOcclusion": {"cavityStrength": 0.38, "contactShadowBias": 0.35, "map": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-spall-debris\\mat-spall-debris_ao.png", "url": "mat-spall-debris_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}, "notes": "Reference-derived cavity estimate from local height minima; verify against grazing-light screenshot."}, "wear": {"edgeWear": 0.0, "scratches": [], "chips": []}, "dirt": {"amount": 0.0, "cavityBias": 0.0, "color": "#2F2A22"}, "localOverrides": [{"id": "fracture-face", "name": "Fresh fracture face", "color": "#E6DFD2", "roughness": 0.68, "maskSource": "fracture-normal", "notes": "Broken faces are brighter than weathered plating."}, {"id": "reference-pbr-pixel-evidence", "type": "material-map-evidence", "evidenceRefs": ["full-object"], "channels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "notes": "Use generated maps as material evidence, then refine after browser screenshot comparison."}], "shaderNotes": ["Prefer MeshPhysicalMaterial when clearcoat, sheen, transmission, or thin-surface response is observed; otherwise use MeshStandardMaterial-compatible PBR channels.", "Generate albedo, roughness, height/normal, and AO independently; never alias albedo into roughness.", "Use normal/bump/displacement only when they map to observed surface relief.", "Use displacement geometry when the observed relief changes the close-up silhouette; texture-only relief is insufficient there.", "Reference-derived maps are estimates from image pixels; verify with neutral, grazing, and reference-matched renders.", "Do not treat baked image shadows as final albedo; rerun extraction with a tighter material crop if highlights/shadows pollute the maps."], "notes": "Replace with image-derived color, roughness, noise, and edge-wear notes.", "materialClass": "ceramic", "referencePbr": {"version": "1.0", "sourceImage": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-spall-debris.png", "extractor": "stage1_intake/extract_pbr_evidence.py", "method": "single-image pixel evidence with de-lighting estimate; not photogrammetry", "usable": true, "verdict": "pass", "confidence": 0.86, "estimatedFidelity": 0.86, "targetThreshold": 0.7, "hardLimit": "A single image cannot uniquely recover true albedo/roughness/normal/AO; maps are reference-derived estimates.", "maps": {"albedo": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-spall-debris\\mat-spall-debris_albedo.png", "url": "mat-spall-debris_albedo.png", "channel": "albedo", "source": "reference-pixel-extraction"}, "roughness": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-spall-debris\\mat-spall-debris_roughness.png", "url": "mat-spall-debris_roughness.png", "channel": "roughness", "source": "reference-pixel-extraction"}, "height": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-spall-debris\\mat-spall-debris_height.png", "url": "mat-spall-debris_height.png", "channel": "height", "source": "reference-pixel-extraction"}, "normal": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-spall-debris\\mat-spall-debris_normal.png", "url": "mat-spall-debris_normal.png", "channel": "normal", "source": "reference-pixel-extraction"}, "ao": {"path": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\work\\pbr\\mat-spall-debris\\mat-spall-debris_ao.png", "url": "mat-spall-debris_ao.png", "channel": "ao", "source": "reference-pixel-extraction"}}, "diagnostics": {"sourceWidth": 512, "sourceHeight": 512, "mapSize": 1024, "cropBBoxPixels": {"x": 0, "y": 0, "width": 512, "height": 501}, "mask": {"backgroundColor": "#1A1A1C", "backgroundNoise": 16.186, "transparentPixelFraction": 0.0, "foregroundCoverage": 0.4422}, "mapStats": {"valueRange": 0.5351, "heightP90Gradient": 0.07383, "roughnessBase": 0.683, "roughnessVariation": 0.15, "normalStrength": 0.243, "blurRadius": 21}, "palette": ["#CFC0B7", "#B7A79E", "#96867C", "#E7D9D0", "#5C504A"]}, "warnings": ["single-image inverse rendering cannot prove true physical PBR; confidence is capped"]}},
    options
  );

  const nodes: Record<string, THREE.Object3D> = { root };
  const meshes: Record<string, THREE.Mesh> = {};
  const sockets: Record<string, THREE.Object3D> = {};
  const colliders: Record<string, unknown> = {};
  const destructionGroups: Record<string, THREE.Object3D[]> = {};

  const attachment_root_0 = null;
  const endpoint_root_0 = makeAttachmentEndpoint(attachment_root_0);
  const node_root_0 = new THREE.Group();
  node_root_0.name = "Remnant Structure 07LF__pivot";
  if (endpoint_root_0) {
    node_root_0.position.copy(endpoint_root_0.start);
    node_root_0.rotation.set(0, 0, 0);
    node_root_0.scale.set(1, 1, 1);
  } else {
    node_root_0.position.set(0.0, 0.0, 0.0);
    node_root_0.rotation.set(0.0, 0.0, 0.0);
    node_root_0.scale.set(1.0, 1.0, 1.0);
  }
  node_root_0.userData.sculptComponent = {"id": "root", "name": "Remnant Structure 07LF", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.7, "primitive": "curve-sweep", "topologyClass": "continuous-sculpt", "topologyRationale": "One continuous ribbon swept along a logarithmic spiral. Reading outward-to-inward: the spar enters top-left, broadens, then winds ~1.4 turns clockwise into the coil. The arm and the coil are the SAME sweep at different arc lengths — they are not attached parts, which is why no attachment contract is declared between them.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-1.0453, 0.7073, 3.5213], [-0.9809, 0.6891, 3.2408], [-0.9197, 0.6652, 2.9701], [-0.8618, 0.6355, 2.7093], [-0.807, 0.6002, 2.4586], [-0.7552, 0.5593, 2.2182], [-0.7062, 0.5128, 1.9883], [-0.6599, 0.4609, 1.7692], [-0.6162, 0.4037, 1.5611], [-0.5747, 0.3414, 1.3643], [-0.5353, 0.274, 1.1793], [-0.4977, 0.2018, 1.0065], [-0.4614, 0.125, 0.8465], [-0.426, 0.044, 0.7002], [-0.3906, -0.0408, 0.5687], [-0.3542, -0.1286, 0.4538], [-0.3147, -0.2182, 0.3587], [-0.2654, -0.3053, 0.2939], [-0.1809, -0.3739, 0.2675], [-0.0893, -0.4222, 0.2284], [0.0047, -0.4481, 0.1787], [0.0961, -0.4509, 0.1211], [0.1806, -0.4311, 0.0589], [0.2541, -0.39, -0.0048], [0.313, -0.3303, -0.0668], [0.3549, -0.2555, -0.124], [0.3779, -0.1696, -0.1736], [0.3815, -0.0772, -0.2133], [0.3658, 0.0169, -0.2414], [0.3321, 0.1079, -0.2567], [0.2825, 0.1914, -0.2587], [0.22, 0.2633, -0.2477], [0.1478, 0.3202, -0.2246], [0.0699, 0.3598, -0.1907], [-0.0096, 0.3804, -0.148], [-0.0868, 0.3814, -0.0989], [-0.1578, 0.3632, -0.0461], [-0.2192, 0.3272, 0.0079], [-0.2682, 0.2757, 0.0602], [-0.3025, 0.2115, 0.1082], [-0.3209, 0.1382, 0.1497], [-0.3227, 0.0597, 0.1827], [-0.3083, -0.0199, 0.2057], [-0.2787, -0.0967, 0.2179], [-0.2359, -0.1668, 0.2188], [-0.1822, -0.2269, 0.2088], [-0.1206, -0.2742, 0.1885], [-0.0544, -0.3066, 0.1592], [0.0129, -0.3228, 0.1226], [0.078, -0.3225, 0.0807], [0.1377, -0.3059, 0.0357], [0.189, -0.2745, -0.0099], [0.2297, -0.2299, -0.054], [0.2578, -0.1749, -0.0944], [0.2724, -0.1124, -0.1291], [0.2729, -0.0457, -0.1564], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.111136, -0.03], [0.111136, -0.03], [0.1208, -0.020336], [0.1208, 0.020336], [0.111136, 0.03], [-0.111136, 0.03], [-0.1208, 0.020336], [-0.1208, -0.020336]]}, "closed": false}}, "parent": null, "attachment": null, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "root", "pivot": {"mode": "explicit", "localPosition": [0.28, -0.12, 0.0], "axis": [0.18, 0.12, 0.98], "confidence": 0.6}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "spine-arc-entry", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}, {"id": "spine-arc-inner", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}], "collider": {"type": "compound", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Compound proxy: one cylinder for the coil, one tapered capsule for the spar."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone", "mat-lamina-substrate"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "root", "dominantAlbedo": "rgba(217, 206, 199, 1.0)", "secondaryAlbedo": "rgba(40, 39, 41, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.6, "roughnessEstimate": 0.239, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\c-root.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.411}}};
  node_root_0.userData.actionProfile = {"animationRole": "root", "pivot": {"mode": "explicit", "localPosition": [0.28, -0.12, 0.0], "axis": [0.18, 0.12, 0.98], "confidence": 0.6}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "spine-arc-entry", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}, {"id": "spine-arc-inner", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}], "collider": {"type": "compound", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Compound proxy: one cylinder for the coil, one tapered capsule for the spar."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["root"] ?? root).add(node_root_0);
  nodes["root"] = node_root_0;
  const mesh_root_0Geometry = endpoint_root_0
    ? new THREE.CylinderGeometry(endpoint_root_0.endRadius, endpoint_root_0.baseRadius, endpoint_root_0.length, 32, 12)
    : buildCurveSweepGeometry({"spine": [[-1.0453, 0.7073, 3.5213], [-0.9809, 0.6891, 3.2408], [-0.9197, 0.6652, 2.9701], [-0.8618, 0.6355, 2.7093], [-0.807, 0.6002, 2.4586], [-0.7552, 0.5593, 2.2182], [-0.7062, 0.5128, 1.9883], [-0.6599, 0.4609, 1.7692], [-0.6162, 0.4037, 1.5611], [-0.5747, 0.3414, 1.3643], [-0.5353, 0.274, 1.1793], [-0.4977, 0.2018, 1.0065], [-0.4614, 0.125, 0.8465], [-0.426, 0.044, 0.7002], [-0.3906, -0.0408, 0.5687], [-0.3542, -0.1286, 0.4538], [-0.3147, -0.2182, 0.3587], [-0.2654, -0.3053, 0.2939], [-0.1809, -0.3739, 0.2675], [-0.0893, -0.4222, 0.2284], [0.0047, -0.4481, 0.1787], [0.0961, -0.4509, 0.1211], [0.1806, -0.4311, 0.0589], [0.2541, -0.39, -0.0048], [0.313, -0.3303, -0.0668], [0.3549, -0.2555, -0.124], [0.3779, -0.1696, -0.1736], [0.3815, -0.0772, -0.2133], [0.3658, 0.0169, -0.2414], [0.3321, 0.1079, -0.2567], [0.2825, 0.1914, -0.2587], [0.22, 0.2633, -0.2477], [0.1478, 0.3202, -0.2246], [0.0699, 0.3598, -0.1907], [-0.0096, 0.3804, -0.148], [-0.0868, 0.3814, -0.0989], [-0.1578, 0.3632, -0.0461], [-0.2192, 0.3272, 0.0079], [-0.2682, 0.2757, 0.0602], [-0.3025, 0.2115, 0.1082], [-0.3209, 0.1382, 0.1497], [-0.3227, 0.0597, 0.1827], [-0.3083, -0.0199, 0.2057], [-0.2787, -0.0967, 0.2179], [-0.2359, -0.1668, 0.2188], [-0.1822, -0.2269, 0.2088], [-0.1206, -0.2742, 0.1885], [-0.0544, -0.3066, 0.1592], [0.0129, -0.3228, 0.1226], [0.078, -0.3225, 0.0807], [0.1377, -0.3059, 0.0357], [0.189, -0.2745, -0.0099], [0.2297, -0.2299, -0.054], [0.2578, -0.1749, -0.0944], [0.2724, -0.1124, -0.1291], [0.2729, -0.0457, -0.1564], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.111136, -0.03], [0.111136, -0.03], [0.1208, -0.020336], [0.1208, 0.020336], [0.111136, 0.03], [-0.111136, 0.03], [-0.1208, 0.020336], [-0.1208, -0.020336]]}, "closed": false});
  const mesh_root_0 = new THREE.Mesh(
    mesh_root_0Geometry,
    materialMap["mat-plated-bone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_root_0.name = "Remnant Structure 07LF";
  if (endpoint_root_0) {
    mesh_root_0.position.copy(endpoint_root_0.midpoint);
    mesh_root_0.quaternion.copy(endpoint_root_0.quaternion);
  }
  mesh_root_0.castShadow = options.castShadow ?? true;
  mesh_root_0.receiveShadow = options.receiveShadow ?? true;
  mesh_root_0.userData.sculptComponent = {"id": "root", "name": "Remnant Structure 07LF", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.7, "primitive": "curve-sweep", "topologyClass": "continuous-sculpt", "topologyRationale": "One continuous ribbon swept along a logarithmic spiral. Reading outward-to-inward: the spar enters top-left, broadens, then winds ~1.4 turns clockwise into the coil. The arm and the coil are the SAME sweep at different arc lengths — they are not attached parts, which is why no attachment contract is declared between them.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-1.0453, 0.7073, 3.5213], [-0.9809, 0.6891, 3.2408], [-0.9197, 0.6652, 2.9701], [-0.8618, 0.6355, 2.7093], [-0.807, 0.6002, 2.4586], [-0.7552, 0.5593, 2.2182], [-0.7062, 0.5128, 1.9883], [-0.6599, 0.4609, 1.7692], [-0.6162, 0.4037, 1.5611], [-0.5747, 0.3414, 1.3643], [-0.5353, 0.274, 1.1793], [-0.4977, 0.2018, 1.0065], [-0.4614, 0.125, 0.8465], [-0.426, 0.044, 0.7002], [-0.3906, -0.0408, 0.5687], [-0.3542, -0.1286, 0.4538], [-0.3147, -0.2182, 0.3587], [-0.2654, -0.3053, 0.2939], [-0.1809, -0.3739, 0.2675], [-0.0893, -0.4222, 0.2284], [0.0047, -0.4481, 0.1787], [0.0961, -0.4509, 0.1211], [0.1806, -0.4311, 0.0589], [0.2541, -0.39, -0.0048], [0.313, -0.3303, -0.0668], [0.3549, -0.2555, -0.124], [0.3779, -0.1696, -0.1736], [0.3815, -0.0772, -0.2133], [0.3658, 0.0169, -0.2414], [0.3321, 0.1079, -0.2567], [0.2825, 0.1914, -0.2587], [0.22, 0.2633, -0.2477], [0.1478, 0.3202, -0.2246], [0.0699, 0.3598, -0.1907], [-0.0096, 0.3804, -0.148], [-0.0868, 0.3814, -0.0989], [-0.1578, 0.3632, -0.0461], [-0.2192, 0.3272, 0.0079], [-0.2682, 0.2757, 0.0602], [-0.3025, 0.2115, 0.1082], [-0.3209, 0.1382, 0.1497], [-0.3227, 0.0597, 0.1827], [-0.3083, -0.0199, 0.2057], [-0.2787, -0.0967, 0.2179], [-0.2359, -0.1668, 0.2188], [-0.1822, -0.2269, 0.2088], [-0.1206, -0.2742, 0.1885], [-0.0544, -0.3066, 0.1592], [0.0129, -0.3228, 0.1226], [0.078, -0.3225, 0.0807], [0.1377, -0.3059, 0.0357], [0.189, -0.2745, -0.0099], [0.2297, -0.2299, -0.054], [0.2578, -0.1749, -0.0944], [0.2724, -0.1124, -0.1291], [0.2729, -0.0457, -0.1564], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.111136, -0.03], [0.111136, -0.03], [0.1208, -0.020336], [0.1208, 0.020336], [0.111136, 0.03], [-0.111136, 0.03], [-0.1208, 0.020336], [-0.1208, -0.020336]]}, "closed": false}}, "parent": null, "attachment": null, "dimensions": {"width": 1.0, "height": 1.0, "depth": 1.0, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "root", "pivot": {"mode": "explicit", "localPosition": [0.28, -0.12, 0.0], "axis": [0.18, 0.12, 0.98], "confidence": 0.6}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "spine-arc-entry", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}, {"id": "spine-arc-inner", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}], "collider": {"type": "compound", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Compound proxy: one cylinder for the coil, one tapered capsule for the spar."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone", "mat-lamina-substrate"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "root", "dominantAlbedo": "rgba(217, 206, 199, 1.0)", "secondaryAlbedo": "rgba(40, 39, 41, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.6, "roughnessEstimate": 0.239, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\c-root.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.411}}};
  node_root_0.add(mesh_root_0);
  meshes["root"] = mesh_root_0;
  colliders["root"] = {"type": "compound", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Compound proxy: one cylinder for the coil, one tapered capsule for the spar."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_root_0);
  const socket_root_spine_arc_entry_0 = new THREE.Object3D();
  socket_root_spine_arc_entry_0.name = "spine-arc-entry";
  socket_root_spine_arc_entry_0.position.set(0.0, 0.0, 0.0);
  socket_root_spine_arc_entry_0.rotation.set(0, 0, 0);
  socket_root_spine_arc_entry_0.userData.socket = {"id": "spine-arc-entry", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6};
  node_root_0.add(socket_root_spine_arc_entry_0);
  sockets["root:spine-arc-entry"] = socket_root_spine_arc_entry_0;
  const socket_root_spine_arc_inner_1 = new THREE.Object3D();
  socket_root_spine_arc_inner_1.name = "spine-arc-inner";
  socket_root_spine_arc_inner_1.position.set(0.0, 0.0, 0.0);
  socket_root_spine_arc_inner_1.rotation.set(0, 0, 0);
  socket_root_spine_arc_inner_1.userData.socket = {"id": "spine-arc-inner", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6};
  node_root_0.add(socket_root_spine_arc_inner_1);
  sockets["root:spine-arc-inner"] = socket_root_spine_arc_inner_1;

  const attachment_ribbon_coil_1 = {"parentId": "root", "parentSocket": "spine-arc-entry", "localStart": [-0.5, 0.16, -0.04], "localEnd": [0.19, -0.3, 0.06], "contactType": "continuous-sweep", "overlap": 0.14, "gapTolerance": 0.002, "notes": "Shares arc length with ribbon-outer-arm; the seam is a sweep parameter, not a joint."};
  const endpoint_ribbon_coil_1 = makeAttachmentEndpoint(attachment_ribbon_coil_1);
  const node_ribbon_coil_1 = new THREE.Group();
  node_ribbon_coil_1.name = "Wound coil (inner ~1.4 turns)__pivot";
  if (endpoint_ribbon_coil_1) {
    node_ribbon_coil_1.position.copy(endpoint_ribbon_coil_1.start);
    node_ribbon_coil_1.rotation.set(0, 0, 0);
    node_ribbon_coil_1.scale.set(1, 1, 1);
  } else {
    node_ribbon_coil_1.position.set(0.3, -0.16, 0.0);
    node_ribbon_coil_1.rotation.set(0.0, 0.0, 0.0);
    node_ribbon_coil_1.scale.set(1.0, 1.0, 1.0);
  }
  node_ribbon_coil_1.userData.sculptComponent = {"id": "ribbon-coil", "name": "Wound coil (inner ~1.4 turns)", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.7, "primitive": "curve-sweep", "topologyClass": "continuous-sculpt", "topologyRationale": "Ribbon cross-section swept along a decaying-radius spiral; the cavity is a true through-hole, confirmed by the depth map reading it as far-field.", "geometryDescriptor": {"topologyIntent": "Swept band, rectangular section with eased long edges, 1.4 turns, radius 0.50 -> 0.19.", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-0.2654, -0.3053, 0.2939], [-0.1809, -0.3739, 0.2675], [-0.0893, -0.4222, 0.2284], [0.0047, -0.4481, 0.1787], [0.0961, -0.4509, 0.1211], [0.1806, -0.4311, 0.0589], [0.2541, -0.39, -0.0048], [0.313, -0.3303, -0.0668], [0.3549, -0.2555, -0.124], [0.3779, -0.1696, -0.1736], [0.3815, -0.0772, -0.2133], [0.3658, 0.0169, -0.2414], [0.3321, 0.1079, -0.2567], [0.2825, 0.1914, -0.2587], [0.22, 0.2633, -0.2477], [0.1478, 0.3202, -0.2246], [0.0699, 0.3598, -0.1907], [-0.0096, 0.3804, -0.148], [-0.0868, 0.3814, -0.0989], [-0.1578, 0.3632, -0.0461], [-0.2192, 0.3272, 0.0079], [-0.2682, 0.2757, 0.0602], [-0.3025, 0.2115, 0.1082], [-0.3209, 0.1382, 0.1497], [-0.3227, 0.0597, 0.1827], [-0.3083, -0.0199, 0.2057], [-0.2787, -0.0967, 0.2179], [-0.2359, -0.1668, 0.2188], [-0.1822, -0.2269, 0.2088], [-0.1206, -0.2742, 0.1885], [-0.0544, -0.3066, 0.1592], [0.0129, -0.3228, 0.1226], [0.078, -0.3225, 0.0807], [0.1377, -0.3059, 0.0357], [0.189, -0.2745, -0.0099], [0.2297, -0.2299, -0.054], [0.2578, -0.1749, -0.0944], [0.2724, -0.1124, -0.1291], [0.2729, -0.0457, -0.1564], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.111136, -0.03], [0.111136, -0.03], [0.1208, -0.020336], [0.1208, 0.020336], [0.111136, 0.03], [-0.111136, 0.03], [-0.1208, 0.020336], [-0.1208, -0.020336]]}, "closed": false}}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "spine-arc-entry", "localStart": [-0.5, 0.16, -0.04], "localEnd": [0.19, -0.3, 0.06], "contactType": "continuous-sweep", "overlap": 0.14, "gapTolerance": 0.002, "notes": "Shares arc length with ribbon-outer-arm; the seam is a sweep parameter, not a joint."}, "dimensions": {"width": 1.0, "height": 1.0, "depth": 0.34, "units": "relative", "confidence": 0.7}, "transform": {"position": [0.3, -0.16, 0.0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "primary-form", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "coil-outer-surface", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}, {"id": "coil-inner-surface", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["coil-outer-rim-edge", "coil-inner-cavity-wall"], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "ribbon-coil", "dominantAlbedo": "rgba(222, 212, 204, 1.0)", "secondaryAlbedo": "rgba(176, 165, 159, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.6, "roughnessEstimate": 0.266, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-plated-bone.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.713}}};
  node_ribbon_coil_1.userData.actionProfile = {"animationRole": "primary-form", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "coil-outer-surface", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}, {"id": "coil-inner-surface", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["root"] ?? root).add(node_ribbon_coil_1);
  nodes["ribbon-coil"] = node_ribbon_coil_1;
  const mesh_ribbon_coil_1Geometry = endpoint_ribbon_coil_1
    ? new THREE.CylinderGeometry(endpoint_ribbon_coil_1.endRadius, endpoint_ribbon_coil_1.baseRadius, endpoint_ribbon_coil_1.length, 32, 12)
    : buildCurveSweepGeometry({"spine": [[-0.2654, -0.3053, 0.2939], [-0.1809, -0.3739, 0.2675], [-0.0893, -0.4222, 0.2284], [0.0047, -0.4481, 0.1787], [0.0961, -0.4509, 0.1211], [0.1806, -0.4311, 0.0589], [0.2541, -0.39, -0.0048], [0.313, -0.3303, -0.0668], [0.3549, -0.2555, -0.124], [0.3779, -0.1696, -0.1736], [0.3815, -0.0772, -0.2133], [0.3658, 0.0169, -0.2414], [0.3321, 0.1079, -0.2567], [0.2825, 0.1914, -0.2587], [0.22, 0.2633, -0.2477], [0.1478, 0.3202, -0.2246], [0.0699, 0.3598, -0.1907], [-0.0096, 0.3804, -0.148], [-0.0868, 0.3814, -0.0989], [-0.1578, 0.3632, -0.0461], [-0.2192, 0.3272, 0.0079], [-0.2682, 0.2757, 0.0602], [-0.3025, 0.2115, 0.1082], [-0.3209, 0.1382, 0.1497], [-0.3227, 0.0597, 0.1827], [-0.3083, -0.0199, 0.2057], [-0.2787, -0.0967, 0.2179], [-0.2359, -0.1668, 0.2188], [-0.1822, -0.2269, 0.2088], [-0.1206, -0.2742, 0.1885], [-0.0544, -0.3066, 0.1592], [0.0129, -0.3228, 0.1226], [0.078, -0.3225, 0.0807], [0.1377, -0.3059, 0.0357], [0.189, -0.2745, -0.0099], [0.2297, -0.2299, -0.054], [0.2578, -0.1749, -0.0944], [0.2724, -0.1124, -0.1291], [0.2729, -0.0457, -0.1564], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.111136, -0.03], [0.111136, -0.03], [0.1208, -0.020336], [0.1208, 0.020336], [0.111136, 0.03], [-0.111136, 0.03], [-0.1208, 0.020336], [-0.1208, -0.020336]]}, "closed": false});
  const mesh_ribbon_coil_1 = new THREE.Mesh(
    mesh_ribbon_coil_1Geometry,
    materialMap["mat-plated-bone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_ribbon_coil_1.name = "Wound coil (inner ~1.4 turns)";
  if (endpoint_ribbon_coil_1) {
    mesh_ribbon_coil_1.position.copy(endpoint_ribbon_coil_1.midpoint);
    mesh_ribbon_coil_1.quaternion.copy(endpoint_ribbon_coil_1.quaternion);
  }
  mesh_ribbon_coil_1.castShadow = options.castShadow ?? true;
  mesh_ribbon_coil_1.receiveShadow = options.receiveShadow ?? true;
  mesh_ribbon_coil_1.userData.sculptComponent = {"id": "ribbon-coil", "name": "Wound coil (inner ~1.4 turns)", "level": "macro", "role": "body", "importance": 1.0, "confidence": 0.7, "primitive": "curve-sweep", "topologyClass": "continuous-sculpt", "topologyRationale": "Ribbon cross-section swept along a decaying-radius spiral; the cavity is a true through-hole, confirmed by the depth map reading it as far-field.", "geometryDescriptor": {"topologyIntent": "Swept band, rectangular section with eased long edges, 1.4 turns, radius 0.50 -> 0.19.", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-0.2654, -0.3053, 0.2939], [-0.1809, -0.3739, 0.2675], [-0.0893, -0.4222, 0.2284], [0.0047, -0.4481, 0.1787], [0.0961, -0.4509, 0.1211], [0.1806, -0.4311, 0.0589], [0.2541, -0.39, -0.0048], [0.313, -0.3303, -0.0668], [0.3549, -0.2555, -0.124], [0.3779, -0.1696, -0.1736], [0.3815, -0.0772, -0.2133], [0.3658, 0.0169, -0.2414], [0.3321, 0.1079, -0.2567], [0.2825, 0.1914, -0.2587], [0.22, 0.2633, -0.2477], [0.1478, 0.3202, -0.2246], [0.0699, 0.3598, -0.1907], [-0.0096, 0.3804, -0.148], [-0.0868, 0.3814, -0.0989], [-0.1578, 0.3632, -0.0461], [-0.2192, 0.3272, 0.0079], [-0.2682, 0.2757, 0.0602], [-0.3025, 0.2115, 0.1082], [-0.3209, 0.1382, 0.1497], [-0.3227, 0.0597, 0.1827], [-0.3083, -0.0199, 0.2057], [-0.2787, -0.0967, 0.2179], [-0.2359, -0.1668, 0.2188], [-0.1822, -0.2269, 0.2088], [-0.1206, -0.2742, 0.1885], [-0.0544, -0.3066, 0.1592], [0.0129, -0.3228, 0.1226], [0.078, -0.3225, 0.0807], [0.1377, -0.3059, 0.0357], [0.189, -0.2745, -0.0099], [0.2297, -0.2299, -0.054], [0.2578, -0.1749, -0.0944], [0.2724, -0.1124, -0.1291], [0.2729, -0.0457, -0.1564], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.111136, -0.03], [0.111136, -0.03], [0.1208, -0.020336], [0.1208, 0.020336], [0.111136, 0.03], [-0.111136, 0.03], [-0.1208, 0.020336], [-0.1208, -0.020336]]}, "closed": false}}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "spine-arc-entry", "localStart": [-0.5, 0.16, -0.04], "localEnd": [0.19, -0.3, 0.06], "contactType": "continuous-sweep", "overlap": 0.14, "gapTolerance": 0.002, "notes": "Shares arc length with ribbon-outer-arm; the seam is a sweep parameter, not a joint."}, "dimensions": {"width": 1.0, "height": 1.0, "depth": 0.34, "units": "relative", "confidence": 0.7}, "transform": {"position": [0.3, -0.16, 0.0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "primary-form", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "coil-outer-surface", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}, {"id": "coil-inner-surface", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["coil-outer-rim-edge", "coil-inner-cavity-wall"], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "ribbon-coil", "dominantAlbedo": "rgba(222, 212, 204, 1.0)", "secondaryAlbedo": "rgba(176, 165, 159, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.6, "roughnessEstimate": 0.266, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-plated-bone.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.713}}};
  node_ribbon_coil_1.add(mesh_ribbon_coil_1);
  meshes["ribbon-coil"] = mesh_ribbon_coil_1;
  colliders["ribbon-coil"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_ribbon_coil_1);
  const socket_ribbon_coil_coil_outer_surface_0 = new THREE.Object3D();
  socket_ribbon_coil_coil_outer_surface_0.name = "coil-outer-surface";
  socket_ribbon_coil_coil_outer_surface_0.position.set(0.0, 0.0, 0.0);
  socket_ribbon_coil_coil_outer_surface_0.rotation.set(0, 0, 0);
  socket_ribbon_coil_coil_outer_surface_0.userData.socket = {"id": "coil-outer-surface", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6};
  node_ribbon_coil_1.add(socket_ribbon_coil_coil_outer_surface_0);
  sockets["ribbon-coil:coil-outer-surface"] = socket_ribbon_coil_coil_outer_surface_0;
  const socket_ribbon_coil_coil_inner_surface_1 = new THREE.Object3D();
  socket_ribbon_coil_coil_inner_surface_1.name = "coil-inner-surface";
  socket_ribbon_coil_coil_inner_surface_1.position.set(0.0, 0.0, 0.0);
  socket_ribbon_coil_coil_inner_surface_1.rotation.set(0, 0, 0);
  socket_ribbon_coil_coil_inner_surface_1.userData.socket = {"id": "coil-inner-surface", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6};
  node_ribbon_coil_1.add(socket_ribbon_coil_coil_inner_surface_1);
  sockets["ribbon-coil:coil-inner-surface"] = socket_ribbon_coil_coil_inner_surface_1;

  const attachment_ribbon_outer_arm_2 = {"parentId": "root", "parentSocket": "spine-arc-entry", "localStart": [-1.02, 0.62, -0.2], "localEnd": [-0.5, 0.16, -0.04], "contactType": "continuous-sweep", "overlap": 0.14, "gapTolerance": 0.002, "notes": "Outer run of the same spiral. Tangent-continuous with ribbon-coil at the shoulder."};
  const endpoint_ribbon_outer_arm_2 = makeAttachmentEndpoint(attachment_ribbon_outer_arm_2);
  const node_ribbon_outer_arm_2 = new THREE.Group();
  node_ribbon_outer_arm_2.name = "Unrolled outer spar__pivot";
  if (endpoint_ribbon_outer_arm_2) {
    node_ribbon_outer_arm_2.position.copy(endpoint_ribbon_outer_arm_2.start);
    node_ribbon_outer_arm_2.rotation.set(0, 0, 0);
    node_ribbon_outer_arm_2.scale.set(1, 1, 1);
  } else {
    node_ribbon_outer_arm_2.position.set(-0.42, 0.34, -0.1);
    node_ribbon_outer_arm_2.rotation.set(0.0, 0.0, 0.38);
    node_ribbon_outer_arm_2.scale.set(1.0, 1.0, 1.0);
  }
  node_ribbon_outer_arm_2.userData.sculptComponent = {"id": "ribbon-outer-arm", "name": "Unrolled outer spar", "level": "macro", "role": "body", "importance": 0.95, "confidence": 0.65, "primitive": "curve-sweep", "topologyClass": "continuous-sculpt", "topologyRationale": "The same ribbon before it enters the coil: near-straight run that tapers to a frayed point. Continuous with ribbon-coil, not a child appendage.", "geometryDescriptor": {"topologyIntent": "Tapered swept band; width 0.30 at the coil shoulder decaying to ~0.02 at the tip.", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-1.0453, 0.7073, 3.5213], [-0.9875, 0.6913, 3.2699], [-0.9323, 0.6707, 3.0262], [-0.8798, 0.6455, 2.7905], [-0.8297, 0.6158, 2.5629], [-0.7821, 0.5815, 2.3434], [-0.7368, 0.5428, 2.1323], [-0.6938, 0.4997, 1.9296], [-0.6528, 0.4522, 1.7356], [-0.6139, 0.4006, 1.5504], [-0.5768, 0.3448, 1.3744], [-0.5414, 0.2849, 1.2077], [-0.5075, 0.2212, 1.0507], [-0.4747, 0.1538, 0.9039], [-0.4427, 0.0829, 0.7678], [-0.4111, 0.0087, 0.643], [-0.3793, -0.0682, 0.5305], [-0.3463, -0.1474, 0.432], [-0.3102, -0.2276, 0.3501], [-0.2654, -0.3053, 0.2939]], "crossSection": {"points": [[-0.06890432, -0.024], [0.06890432, -0.024], [0.074896, -0.01800832], [0.074896, 0.01800832], [0.06890432, 0.024], [-0.06890432, 0.024], [-0.074896, 0.01800832], [-0.074896, -0.01800832]]}, "closed": false}}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "spine-arc-entry", "localStart": [-1.02, 0.62, -0.2], "localEnd": [-0.5, 0.16, -0.04], "contactType": "continuous-sweep", "overlap": 0.14, "gapTolerance": 0.002, "notes": "Outer run of the same spiral. Tangent-continuous with ribbon-coil at the shoulder."}, "dimensions": {"width": 1.15, "height": 0.3, "depth": 0.16, "units": "relative", "confidence": 0.65}, "transform": {"position": [-0.42, 0.34, -0.1], "rotation": [0.0, 0.0, 0.38], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "primary-form", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "arm-outer-surface", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}, {"id": "arm-shear-edge", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["arm-tip-fray", "delamination-shear-zone"], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "ribbon-outer-arm", "dominantAlbedo": "rgba(227, 216, 208, 1.0)", "secondaryAlbedo": "rgba(174, 159, 151, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.6, "roughnessEstimate": 0.299, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\c-tail-mid.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.508}}};
  node_ribbon_outer_arm_2.userData.actionProfile = {"animationRole": "primary-form", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "arm-outer-surface", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}, {"id": "arm-shear-edge", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["root"] ?? root).add(node_ribbon_outer_arm_2);
  nodes["ribbon-outer-arm"] = node_ribbon_outer_arm_2;
  const mesh_ribbon_outer_arm_2Geometry = endpoint_ribbon_outer_arm_2
    ? new THREE.CylinderGeometry(endpoint_ribbon_outer_arm_2.endRadius, endpoint_ribbon_outer_arm_2.baseRadius, endpoint_ribbon_outer_arm_2.length, 32, 12)
    : buildCurveSweepGeometry({"spine": [[-1.0453, 0.7073, 3.5213], [-0.9875, 0.6913, 3.2699], [-0.9323, 0.6707, 3.0262], [-0.8798, 0.6455, 2.7905], [-0.8297, 0.6158, 2.5629], [-0.7821, 0.5815, 2.3434], [-0.7368, 0.5428, 2.1323], [-0.6938, 0.4997, 1.9296], [-0.6528, 0.4522, 1.7356], [-0.6139, 0.4006, 1.5504], [-0.5768, 0.3448, 1.3744], [-0.5414, 0.2849, 1.2077], [-0.5075, 0.2212, 1.0507], [-0.4747, 0.1538, 0.9039], [-0.4427, 0.0829, 0.7678], [-0.4111, 0.0087, 0.643], [-0.3793, -0.0682, 0.5305], [-0.3463, -0.1474, 0.432], [-0.3102, -0.2276, 0.3501], [-0.2654, -0.3053, 0.2939]], "crossSection": {"points": [[-0.06890432, -0.024], [0.06890432, -0.024], [0.074896, -0.01800832], [0.074896, 0.01800832], [0.06890432, 0.024], [-0.06890432, 0.024], [-0.074896, 0.01800832], [-0.074896, -0.01800832]]}, "closed": false});
  const mesh_ribbon_outer_arm_2 = new THREE.Mesh(
    mesh_ribbon_outer_arm_2Geometry,
    materialMap["mat-plated-bone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_ribbon_outer_arm_2.name = "Unrolled outer spar";
  if (endpoint_ribbon_outer_arm_2) {
    mesh_ribbon_outer_arm_2.position.copy(endpoint_ribbon_outer_arm_2.midpoint);
    mesh_ribbon_outer_arm_2.quaternion.copy(endpoint_ribbon_outer_arm_2.quaternion);
  }
  mesh_ribbon_outer_arm_2.castShadow = options.castShadow ?? true;
  mesh_ribbon_outer_arm_2.receiveShadow = options.receiveShadow ?? true;
  mesh_ribbon_outer_arm_2.userData.sculptComponent = {"id": "ribbon-outer-arm", "name": "Unrolled outer spar", "level": "macro", "role": "body", "importance": 0.95, "confidence": 0.65, "primitive": "curve-sweep", "topologyClass": "continuous-sculpt", "topologyRationale": "The same ribbon before it enters the coil: near-straight run that tapers to a frayed point. Continuous with ribbon-coil, not a child appendage.", "geometryDescriptor": {"topologyIntent": "Tapered swept band; width 0.30 at the coil shoulder decaying to ~0.02 at the tip.", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-1.0453, 0.7073, 3.5213], [-0.9875, 0.6913, 3.2699], [-0.9323, 0.6707, 3.0262], [-0.8798, 0.6455, 2.7905], [-0.8297, 0.6158, 2.5629], [-0.7821, 0.5815, 2.3434], [-0.7368, 0.5428, 2.1323], [-0.6938, 0.4997, 1.9296], [-0.6528, 0.4522, 1.7356], [-0.6139, 0.4006, 1.5504], [-0.5768, 0.3448, 1.3744], [-0.5414, 0.2849, 1.2077], [-0.5075, 0.2212, 1.0507], [-0.4747, 0.1538, 0.9039], [-0.4427, 0.0829, 0.7678], [-0.4111, 0.0087, 0.643], [-0.3793, -0.0682, 0.5305], [-0.3463, -0.1474, 0.432], [-0.3102, -0.2276, 0.3501], [-0.2654, -0.3053, 0.2939]], "crossSection": {"points": [[-0.06890432, -0.024], [0.06890432, -0.024], [0.074896, -0.01800832], [0.074896, 0.01800832], [0.06890432, 0.024], [-0.06890432, 0.024], [-0.074896, 0.01800832], [-0.074896, -0.01800832]]}, "closed": false}}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "spine-arc-entry", "localStart": [-1.02, 0.62, -0.2], "localEnd": [-0.5, 0.16, -0.04], "contactType": "continuous-sweep", "overlap": 0.14, "gapTolerance": 0.002, "notes": "Outer run of the same spiral. Tangent-continuous with ribbon-coil at the shoulder."}, "dimensions": {"width": 1.15, "height": 0.3, "depth": 0.16, "units": "relative", "confidence": 0.65}, "transform": {"position": [-0.42, 0.34, -0.1], "rotation": [0.0, 0.0, 0.38], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "primary-form", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [{"id": "arm-outer-surface", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}, {"id": "arm-shear-edge", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6}], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["arm-tip-fray", "delamination-shear-zone"], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "ribbon-outer-arm", "dominantAlbedo": "rgba(227, 216, 208, 1.0)", "secondaryAlbedo": "rgba(174, 159, 151, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.6, "roughnessEstimate": 0.299, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\c-tail-mid.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.508}}};
  node_ribbon_outer_arm_2.add(mesh_ribbon_outer_arm_2);
  meshes["ribbon-outer-arm"] = mesh_ribbon_outer_arm_2;
  colliders["ribbon-outer-arm"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_ribbon_outer_arm_2);
  const socket_ribbon_outer_arm_arm_outer_surface_0 = new THREE.Object3D();
  socket_ribbon_outer_arm_arm_outer_surface_0.name = "arm-outer-surface";
  socket_ribbon_outer_arm_arm_outer_surface_0.position.set(0.0, 0.0, 0.0);
  socket_ribbon_outer_arm_arm_outer_surface_0.rotation.set(0, 0, 0);
  socket_ribbon_outer_arm_arm_outer_surface_0.userData.socket = {"id": "arm-outer-surface", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6};
  node_ribbon_outer_arm_2.add(socket_ribbon_outer_arm_arm_outer_surface_0);
  sockets["ribbon-outer-arm:arm-outer-surface"] = socket_ribbon_outer_arm_arm_outer_surface_0;
  const socket_ribbon_outer_arm_arm_shear_edge_1 = new THREE.Object3D();
  socket_ribbon_outer_arm_arm_shear_edge_1.name = "arm-shear-edge";
  socket_ribbon_outer_arm_arm_shear_edge_1.position.set(0.0, 0.0, 0.0);
  socket_ribbon_outer_arm_arm_shear_edge_1.rotation.set(0, 0, 0);
  socket_ribbon_outer_arm_arm_shear_edge_1.userData.socket = {"id": "arm-shear-edge", "localPosition": [0, 0, 0], "axis": [0, 0, 1], "confidence": 0.6};
  node_ribbon_outer_arm_2.add(socket_ribbon_outer_arm_arm_shear_edge_1);
  sockets["ribbon-outer-arm:arm-shear-edge"] = socket_ribbon_outer_arm_arm_shear_edge_1;

  const attachment_ribbon_inner_terminus_3 = {"parentId": "root", "parentSocket": "spine-arc-inner", "localStart": [0.19, -0.3, 0.06], "localEnd": [0.3, -0.06, 0.11], "contactType": "continuous-sweep", "overlap": 0.06, "gapTolerance": 0.002, "notes": "Final quarter-turn; terminates free inside the cavity."};
  const endpoint_ribbon_inner_terminus_3 = makeAttachmentEndpoint(attachment_ribbon_inner_terminus_3);
  const node_ribbon_inner_terminus_3 = new THREE.Group();
  node_ribbon_inner_terminus_3.name = "Inner spiral terminus__pivot";
  if (endpoint_ribbon_inner_terminus_3) {
    node_ribbon_inner_terminus_3.position.copy(endpoint_ribbon_inner_terminus_3.start);
    node_ribbon_inner_terminus_3.rotation.set(0, 0, 0);
    node_ribbon_inner_terminus_3.scale.set(1, 1, 1);
  } else {
    node_ribbon_inner_terminus_3.position.set(0.22, -0.2, 0.05);
    node_ribbon_inner_terminus_3.rotation.set(0.0, 0.0, 0.0);
    node_ribbon_inner_terminus_3.scale.set(1.0, 1.0, 1.0);
  }
  node_ribbon_inner_terminus_3.userData.sculptComponent = {"id": "ribbon-inner-terminus", "name": "Inner spiral terminus", "level": "macro", "role": "body", "importance": 0.6, "confidence": 0.45, "primitive": "curve-sweep", "topologyClass": "continuous-sculpt", "topologyRationale": "Short arc of ribbon visible inside the cavity — the inner end of the spiral. Only partially visible; the far half is inferred.", "geometryDescriptor": {"topologyIntent": "Quarter-turn band at radius ~0.19, receding into shadow.", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-0.0261, -0.3154, 0.1446], [0.0262, -0.3241, 0.1145], [0.0768, -0.3226, 0.0816], [0.124, -0.3113, 0.0467], [0.1666, -0.2907, 0.011], [0.2033, -0.2615, -0.0243], [0.2331, -0.2249, -0.0583], [0.2551, -0.182, -0.0898], [0.269, -0.1343, -0.118], [0.2743, -0.0834, -0.1421], [0.2712, -0.0309, -0.1613], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.09557696, -0.021599999999999998], [0.09557696, -0.021599999999999998], [0.10388800000000001, -0.013288959999999997], [0.10388800000000001, 0.013288959999999997], [0.09557696, 0.021599999999999998], [-0.09557696, 0.021599999999999998], [-0.10388800000000001, 0.013288959999999997], [-0.10388800000000001, -0.013288959999999997]]}, "closed": false}}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "spine-arc-inner", "localStart": [0.19, -0.3, 0.06], "localEnd": [0.3, -0.06, 0.11], "contactType": "continuous-sweep", "overlap": 0.06, "gapTolerance": 0.002, "notes": "Final quarter-turn; terminates free inside the cavity."}, "dimensions": {"width": 0.34, "height": 0.34, "depth": 0.2, "units": "relative", "confidence": 0.45}, "transform": {"position": [0.22, -0.2, 0.05], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-lamina-substrate", "materialLayers": ["mat-lamina-substrate"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "ribbon-inner-terminus", "dominantAlbedo": "rgba(33, 32, 34, 1.0)", "secondaryAlbedo": "rgba(87, 81, 80, 1.0)", "materialClass": "stone", "materialClassConfidence": 0.671, "roughnessEstimate": 0.149, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\c-innerwall.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.363}}};
  node_ribbon_inner_terminus_3.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["root"] ?? root).add(node_ribbon_inner_terminus_3);
  nodes["ribbon-inner-terminus"] = node_ribbon_inner_terminus_3;
  const mesh_ribbon_inner_terminus_3Geometry = endpoint_ribbon_inner_terminus_3
    ? new THREE.CylinderGeometry(endpoint_ribbon_inner_terminus_3.endRadius, endpoint_ribbon_inner_terminus_3.baseRadius, endpoint_ribbon_inner_terminus_3.length, 32, 12)
    : buildCurveSweepGeometry({"spine": [[-0.0261, -0.3154, 0.1446], [0.0262, -0.3241, 0.1145], [0.0768, -0.3226, 0.0816], [0.124, -0.3113, 0.0467], [0.1666, -0.2907, 0.011], [0.2033, -0.2615, -0.0243], [0.2331, -0.2249, -0.0583], [0.2551, -0.182, -0.0898], [0.269, -0.1343, -0.118], [0.2743, -0.0834, -0.1421], [0.2712, -0.0309, -0.1613], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.09557696, -0.021599999999999998], [0.09557696, -0.021599999999999998], [0.10388800000000001, -0.013288959999999997], [0.10388800000000001, 0.013288959999999997], [0.09557696, 0.021599999999999998], [-0.09557696, 0.021599999999999998], [-0.10388800000000001, 0.013288959999999997], [-0.10388800000000001, -0.013288959999999997]]}, "closed": false});
  const mesh_ribbon_inner_terminus_3 = new THREE.Mesh(
    mesh_ribbon_inner_terminus_3Geometry,
    materialMap["mat-lamina-substrate"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_ribbon_inner_terminus_3.name = "Inner spiral terminus";
  if (endpoint_ribbon_inner_terminus_3) {
    mesh_ribbon_inner_terminus_3.position.copy(endpoint_ribbon_inner_terminus_3.midpoint);
    mesh_ribbon_inner_terminus_3.quaternion.copy(endpoint_ribbon_inner_terminus_3.quaternion);
  }
  mesh_ribbon_inner_terminus_3.castShadow = options.castShadow ?? true;
  mesh_ribbon_inner_terminus_3.receiveShadow = options.receiveShadow ?? true;
  mesh_ribbon_inner_terminus_3.userData.sculptComponent = {"id": "ribbon-inner-terminus", "name": "Inner spiral terminus", "level": "macro", "role": "body", "importance": 0.6, "confidence": 0.45, "primitive": "curve-sweep", "topologyClass": "continuous-sculpt", "topologyRationale": "Short arc of ribbon visible inside the cavity — the inner end of the spiral. Only partially visible; the far half is inferred.", "geometryDescriptor": {"topologyIntent": "Quarter-turn band at radius ~0.19, receding into shadow.", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-0.0261, -0.3154, 0.1446], [0.0262, -0.3241, 0.1145], [0.0768, -0.3226, 0.0816], [0.124, -0.3113, 0.0467], [0.1666, -0.2907, 0.011], [0.2033, -0.2615, -0.0243], [0.2331, -0.2249, -0.0583], [0.2551, -0.182, -0.0898], [0.269, -0.1343, -0.118], [0.2743, -0.0834, -0.1421], [0.2712, -0.0309, -0.1613], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.09557696, -0.021599999999999998], [0.09557696, -0.021599999999999998], [0.10388800000000001, -0.013288959999999997], [0.10388800000000001, 0.013288959999999997], [0.09557696, 0.021599999999999998], [-0.09557696, 0.021599999999999998], [-0.10388800000000001, 0.013288959999999997], [-0.10388800000000001, -0.013288959999999997]]}, "closed": false}}, "parent": "root", "attachment": {"parentId": "root", "parentSocket": "spine-arc-inner", "localStart": [0.19, -0.3, 0.06], "localEnd": [0.3, -0.06, 0.11], "contactType": "continuous-sweep", "overlap": 0.06, "gapTolerance": 0.002, "notes": "Final quarter-turn; terminates free inside the cavity."}, "dimensions": {"width": 0.34, "height": 0.34, "depth": 0.2, "units": "relative", "confidence": 0.45}, "transform": {"position": [0.22, -0.2, 0.05], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-lamina-substrate", "materialLayers": ["mat-lamina-substrate"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "ribbon-inner-terminus", "dominantAlbedo": "rgba(33, 32, 34, 1.0)", "secondaryAlbedo": "rgba(87, 81, 80, 1.0)", "materialClass": "stone", "materialClassConfidence": 0.671, "roughnessEstimate": 0.149, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\c-innerwall.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.363}}};
  node_ribbon_inner_terminus_3.add(mesh_ribbon_inner_terminus_3);
  meshes["ribbon-inner-terminus"] = mesh_ribbon_inner_terminus_3;
  colliders["ribbon-inner-terminus"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_ribbon_inner_terminus_3);

  const attachment_plated_topface_coil_4 = {"parentId": "ribbon-coil", "parentSocket": "coil-outer-surface", "localStart": [-0.5, 0.16, 0.02], "localEnd": [0.19, -0.3, 0.09], "contactType": "conformal-shell", "overlap": 0.008, "gapTolerance": 0.002, "notes": "Shell offset along the ribbon normal; never leaves the parent surface."};
  const endpoint_plated_topface_coil_4 = makeAttachmentEndpoint(attachment_plated_topface_coil_4);
  const node_plated_topface_coil_4 = new THREE.Group();
  node_plated_topface_coil_4.name = "Coil outer plated face__pivot";
  if (endpoint_plated_topface_coil_4) {
    node_plated_topface_coil_4.position.copy(endpoint_plated_topface_coil_4.start);
    node_plated_topface_coil_4.rotation.set(0, 0, 0);
    node_plated_topface_coil_4.scale.set(1, 1, 1);
  } else {
    node_plated_topface_coil_4.position.set(0.0, 0.0, 0.0);
    node_plated_topface_coil_4.rotation.set(0.0, 0.0, 0.0);
    node_plated_topface_coil_4.scale.set(1.0, 1.0, 1.0);
  }
  node_plated_topface_coil_4.userData.sculptComponent = {"id": "plated-topface-coil", "name": "Coil outer plated face", "level": "meso", "role": "body", "importance": 0.9, "confidence": 0.7, "primitive": "curve-sweep", "topologyClass": "conforming-shell", "topologyRationale": "Shell conforming to the coil's outer sweep surface, carrying the hull plating.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-0.2654, -0.3053, 0.2939], [-0.1809, -0.3739, 0.2675], [-0.0893, -0.4222, 0.2284], [0.0047, -0.4481, 0.1787], [0.0961, -0.4509, 0.1211], [0.1806, -0.4311, 0.0589], [0.2541, -0.39, -0.0048], [0.313, -0.3303, -0.0668], [0.3549, -0.2555, -0.124], [0.3779, -0.1696, -0.1736], [0.3815, -0.0772, -0.2133], [0.3658, 0.0169, -0.2414], [0.3321, 0.1079, -0.2567], [0.2825, 0.1914, -0.2587], [0.22, 0.2633, -0.2477], [0.1478, 0.3202, -0.2246], [0.0699, 0.3598, -0.1907], [-0.0096, 0.3804, -0.148], [-0.0868, 0.3814, -0.0989], [-0.1578, 0.3632, -0.0461], [-0.2192, 0.3272, 0.0079], [-0.2682, 0.2757, 0.0602], [-0.3025, 0.2115, 0.1082], [-0.3209, 0.1382, 0.1497], [-0.3227, 0.0597, 0.1827], [-0.3083, -0.0199, 0.2057], [-0.2787, -0.0967, 0.2179], [-0.2359, -0.1668, 0.2188], [-0.1822, -0.2269, 0.2088], [-0.1206, -0.2742, 0.1885], [-0.0544, -0.3066, 0.1592], [0.0129, -0.3228, 0.1226], [0.078, -0.3225, 0.0807], [0.1377, -0.3059, 0.0357], [0.189, -0.2745, -0.0099], [0.2297, -0.2299, -0.054], [0.2578, -0.1749, -0.0944], [0.2724, -0.1124, -0.1291], [0.2729, -0.0457, -0.1564], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.111896, -0.0066], [0.111896, -0.0066], [0.117176, -0.00132], [0.117176, 0.00132], [0.111896, 0.0066], [-0.111896, 0.0066], [-0.117176, 0.00132], [-0.117176, -0.00132]]}, "closed": false}}, "parent": "ribbon-coil", "attachment": {"parentId": "ribbon-coil", "parentSocket": "coil-outer-surface", "localStart": [-0.5, 0.16, 0.02], "localEnd": [0.19, -0.3, 0.09], "contactType": "conformal-shell", "overlap": 0.008, "gapTolerance": 0.002, "notes": "Shell offset along the ribbon normal; never leaves the parent surface."}, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.7}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["panel-plate-grid", "scribe-linework", "greeble-clusters"], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "plated-topface-coil", "dominantAlbedo": "rgba(222, 212, 204, 1.0)", "secondaryAlbedo": "rgba(176, 165, 159, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.6, "roughnessEstimate": 0.266, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-plated-bone.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.713}}};
  node_plated_topface_coil_4.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["ribbon-coil"] ?? root).add(node_plated_topface_coil_4);
  nodes["plated-topface-coil"] = node_plated_topface_coil_4;
  const mesh_plated_topface_coil_4Geometry = endpoint_plated_topface_coil_4
    ? new THREE.CylinderGeometry(endpoint_plated_topface_coil_4.endRadius, endpoint_plated_topface_coil_4.baseRadius, endpoint_plated_topface_coil_4.length, 32, 12)
    : buildCurveSweepGeometry({"spine": [[-0.2654, -0.3053, 0.2939], [-0.1809, -0.3739, 0.2675], [-0.0893, -0.4222, 0.2284], [0.0047, -0.4481, 0.1787], [0.0961, -0.4509, 0.1211], [0.1806, -0.4311, 0.0589], [0.2541, -0.39, -0.0048], [0.313, -0.3303, -0.0668], [0.3549, -0.2555, -0.124], [0.3779, -0.1696, -0.1736], [0.3815, -0.0772, -0.2133], [0.3658, 0.0169, -0.2414], [0.3321, 0.1079, -0.2567], [0.2825, 0.1914, -0.2587], [0.22, 0.2633, -0.2477], [0.1478, 0.3202, -0.2246], [0.0699, 0.3598, -0.1907], [-0.0096, 0.3804, -0.148], [-0.0868, 0.3814, -0.0989], [-0.1578, 0.3632, -0.0461], [-0.2192, 0.3272, 0.0079], [-0.2682, 0.2757, 0.0602], [-0.3025, 0.2115, 0.1082], [-0.3209, 0.1382, 0.1497], [-0.3227, 0.0597, 0.1827], [-0.3083, -0.0199, 0.2057], [-0.2787, -0.0967, 0.2179], [-0.2359, -0.1668, 0.2188], [-0.1822, -0.2269, 0.2088], [-0.1206, -0.2742, 0.1885], [-0.0544, -0.3066, 0.1592], [0.0129, -0.3228, 0.1226], [0.078, -0.3225, 0.0807], [0.1377, -0.3059, 0.0357], [0.189, -0.2745, -0.0099], [0.2297, -0.2299, -0.054], [0.2578, -0.1749, -0.0944], [0.2724, -0.1124, -0.1291], [0.2729, -0.0457, -0.1564], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.111896, -0.0066], [0.111896, -0.0066], [0.117176, -0.00132], [0.117176, 0.00132], [0.111896, 0.0066], [-0.111896, 0.0066], [-0.117176, 0.00132], [-0.117176, -0.00132]]}, "closed": false});
  const mesh_plated_topface_coil_4 = new THREE.Mesh(
    mesh_plated_topface_coil_4Geometry,
    materialMap["mat-plated-bone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_plated_topface_coil_4.name = "Coil outer plated face";
  if (endpoint_plated_topface_coil_4) {
    mesh_plated_topface_coil_4.position.copy(endpoint_plated_topface_coil_4.midpoint);
    mesh_plated_topface_coil_4.quaternion.copy(endpoint_plated_topface_coil_4.quaternion);
  }
  mesh_plated_topface_coil_4.castShadow = options.castShadow ?? true;
  mesh_plated_topface_coil_4.receiveShadow = options.receiveShadow ?? true;
  mesh_plated_topface_coil_4.userData.sculptComponent = {"id": "plated-topface-coil", "name": "Coil outer plated face", "level": "meso", "role": "body", "importance": 0.9, "confidence": 0.7, "primitive": "curve-sweep", "topologyClass": "conforming-shell", "topologyRationale": "Shell conforming to the coil's outer sweep surface, carrying the hull plating.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-0.2654, -0.3053, 0.2939], [-0.1809, -0.3739, 0.2675], [-0.0893, -0.4222, 0.2284], [0.0047, -0.4481, 0.1787], [0.0961, -0.4509, 0.1211], [0.1806, -0.4311, 0.0589], [0.2541, -0.39, -0.0048], [0.313, -0.3303, -0.0668], [0.3549, -0.2555, -0.124], [0.3779, -0.1696, -0.1736], [0.3815, -0.0772, -0.2133], [0.3658, 0.0169, -0.2414], [0.3321, 0.1079, -0.2567], [0.2825, 0.1914, -0.2587], [0.22, 0.2633, -0.2477], [0.1478, 0.3202, -0.2246], [0.0699, 0.3598, -0.1907], [-0.0096, 0.3804, -0.148], [-0.0868, 0.3814, -0.0989], [-0.1578, 0.3632, -0.0461], [-0.2192, 0.3272, 0.0079], [-0.2682, 0.2757, 0.0602], [-0.3025, 0.2115, 0.1082], [-0.3209, 0.1382, 0.1497], [-0.3227, 0.0597, 0.1827], [-0.3083, -0.0199, 0.2057], [-0.2787, -0.0967, 0.2179], [-0.2359, -0.1668, 0.2188], [-0.1822, -0.2269, 0.2088], [-0.1206, -0.2742, 0.1885], [-0.0544, -0.3066, 0.1592], [0.0129, -0.3228, 0.1226], [0.078, -0.3225, 0.0807], [0.1377, -0.3059, 0.0357], [0.189, -0.2745, -0.0099], [0.2297, -0.2299, -0.054], [0.2578, -0.1749, -0.0944], [0.2724, -0.1124, -0.1291], [0.2729, -0.0457, -0.1564], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.111896, -0.0066], [0.111896, -0.0066], [0.117176, -0.00132], [0.117176, 0.00132], [0.111896, 0.0066], [-0.111896, 0.0066], [-0.117176, 0.00132], [-0.117176, -0.00132]]}, "closed": false}}, "parent": "ribbon-coil", "attachment": {"parentId": "ribbon-coil", "parentSocket": "coil-outer-surface", "localStart": [-0.5, 0.16, 0.02], "localEnd": [0.19, -0.3, 0.09], "contactType": "conformal-shell", "overlap": 0.008, "gapTolerance": 0.002, "notes": "Shell offset along the ribbon normal; never leaves the parent surface."}, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.7}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["panel-plate-grid", "scribe-linework", "greeble-clusters"], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "plated-topface-coil", "dominantAlbedo": "rgba(222, 212, 204, 1.0)", "secondaryAlbedo": "rgba(176, 165, 159, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.6, "roughnessEstimate": 0.266, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-plated-bone.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.713}}};
  node_plated_topface_coil_4.add(mesh_plated_topface_coil_4);
  meshes["plated-topface-coil"] = mesh_plated_topface_coil_4;
  colliders["plated-topface-coil"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_plated_topface_coil_4);

  const attachment_plated_topface_arm_5 = {"parentId": "ribbon-outer-arm", "parentSocket": "arm-outer-surface", "localStart": [-1.02, 0.62, -0.16], "localEnd": [-0.5, 0.16, 0.02], "contactType": "conformal-shell", "overlap": 0.008, "gapTolerance": 0.002, "notes": "Same shell continued along the spar, shrinking with the taper."};
  const endpoint_plated_topface_arm_5 = makeAttachmentEndpoint(attachment_plated_topface_arm_5);
  const node_plated_topface_arm_5 = new THREE.Group();
  node_plated_topface_arm_5.name = "Spar plated face__pivot";
  if (endpoint_plated_topface_arm_5) {
    node_plated_topface_arm_5.position.copy(endpoint_plated_topface_arm_5.start);
    node_plated_topface_arm_5.rotation.set(0, 0, 0);
    node_plated_topface_arm_5.scale.set(1, 1, 1);
  } else {
    node_plated_topface_arm_5.position.set(0.0, 0.0, 0.0);
    node_plated_topface_arm_5.rotation.set(0.0, 0.0, 0.0);
    node_plated_topface_arm_5.scale.set(1.0, 1.0, 1.0);
  }
  node_plated_topface_arm_5.userData.sculptComponent = {"id": "plated-topface-arm", "name": "Spar plated face", "level": "meso", "role": "body", "importance": 0.85, "confidence": 0.65, "primitive": "curve-sweep", "topologyClass": "conforming-shell", "topologyRationale": "Same plated shell continued along the spar; plating shrinks with the taper.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-1.0453, 0.7073, 3.5213], [-0.9875, 0.6913, 3.2699], [-0.9323, 0.6707, 3.0262], [-0.8798, 0.6455, 2.7905], [-0.8297, 0.6158, 2.5629], [-0.7821, 0.5815, 2.3434], [-0.7368, 0.5428, 2.1323], [-0.6938, 0.4997, 1.9296], [-0.6528, 0.4522, 1.7356], [-0.6139, 0.4006, 1.5504], [-0.5768, 0.3448, 1.3744], [-0.5414, 0.2849, 1.2077], [-0.5075, 0.2212, 1.0507], [-0.4747, 0.1538, 0.9039], [-0.4427, 0.0829, 0.7678], [-0.4111, 0.0087, 0.643], [-0.3793, -0.0682, 0.5305], [-0.3463, -0.1474, 0.432], [-0.3102, -0.2276, 0.3501], [-0.2654, -0.3053, 0.2939]], "crossSection": {"points": [[-0.06768, -0.006], [0.06768, -0.006], [0.07248, -0.0011999999999999997], [0.07248, 0.0011999999999999997], [0.06768, 0.006], [-0.06768, 0.006], [-0.07248, 0.0011999999999999997], [-0.07248, -0.0011999999999999997]]}, "closed": false}}, "parent": "ribbon-outer-arm", "attachment": {"parentId": "ribbon-outer-arm", "parentSocket": "arm-outer-surface", "localStart": [-1.02, 0.62, -0.16], "localEnd": [-0.5, 0.16, 0.02], "contactType": "conformal-shell", "overlap": 0.008, "gapTolerance": 0.002, "notes": "Same shell continued along the spar, shrinking with the taper."}, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.65}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["panel-plate-grid"], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "plated-topface-arm", "dominantAlbedo": "rgba(227, 216, 208, 1.0)", "secondaryAlbedo": "rgba(174, 159, 151, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.6, "roughnessEstimate": 0.299, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\c-tail-mid.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.508}}};
  node_plated_topface_arm_5.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["ribbon-outer-arm"] ?? root).add(node_plated_topface_arm_5);
  nodes["plated-topface-arm"] = node_plated_topface_arm_5;
  const mesh_plated_topface_arm_5Geometry = endpoint_plated_topface_arm_5
    ? new THREE.CylinderGeometry(endpoint_plated_topface_arm_5.endRadius, endpoint_plated_topface_arm_5.baseRadius, endpoint_plated_topface_arm_5.length, 32, 12)
    : buildCurveSweepGeometry({"spine": [[-1.0453, 0.7073, 3.5213], [-0.9875, 0.6913, 3.2699], [-0.9323, 0.6707, 3.0262], [-0.8798, 0.6455, 2.7905], [-0.8297, 0.6158, 2.5629], [-0.7821, 0.5815, 2.3434], [-0.7368, 0.5428, 2.1323], [-0.6938, 0.4997, 1.9296], [-0.6528, 0.4522, 1.7356], [-0.6139, 0.4006, 1.5504], [-0.5768, 0.3448, 1.3744], [-0.5414, 0.2849, 1.2077], [-0.5075, 0.2212, 1.0507], [-0.4747, 0.1538, 0.9039], [-0.4427, 0.0829, 0.7678], [-0.4111, 0.0087, 0.643], [-0.3793, -0.0682, 0.5305], [-0.3463, -0.1474, 0.432], [-0.3102, -0.2276, 0.3501], [-0.2654, -0.3053, 0.2939]], "crossSection": {"points": [[-0.06768, -0.006], [0.06768, -0.006], [0.07248, -0.0011999999999999997], [0.07248, 0.0011999999999999997], [0.06768, 0.006], [-0.06768, 0.006], [-0.07248, 0.0011999999999999997], [-0.07248, -0.0011999999999999997]]}, "closed": false});
  const mesh_plated_topface_arm_5 = new THREE.Mesh(
    mesh_plated_topface_arm_5Geometry,
    materialMap["mat-plated-bone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_plated_topface_arm_5.name = "Spar plated face";
  if (endpoint_plated_topface_arm_5) {
    mesh_plated_topface_arm_5.position.copy(endpoint_plated_topface_arm_5.midpoint);
    mesh_plated_topface_arm_5.quaternion.copy(endpoint_plated_topface_arm_5.quaternion);
  }
  mesh_plated_topface_arm_5.castShadow = options.castShadow ?? true;
  mesh_plated_topface_arm_5.receiveShadow = options.receiveShadow ?? true;
  mesh_plated_topface_arm_5.userData.sculptComponent = {"id": "plated-topface-arm", "name": "Spar plated face", "level": "meso", "role": "body", "importance": 0.85, "confidence": 0.65, "primitive": "curve-sweep", "topologyClass": "conforming-shell", "topologyRationale": "Same plated shell continued along the spar; plating shrinks with the taper.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-1.0453, 0.7073, 3.5213], [-0.9875, 0.6913, 3.2699], [-0.9323, 0.6707, 3.0262], [-0.8798, 0.6455, 2.7905], [-0.8297, 0.6158, 2.5629], [-0.7821, 0.5815, 2.3434], [-0.7368, 0.5428, 2.1323], [-0.6938, 0.4997, 1.9296], [-0.6528, 0.4522, 1.7356], [-0.6139, 0.4006, 1.5504], [-0.5768, 0.3448, 1.3744], [-0.5414, 0.2849, 1.2077], [-0.5075, 0.2212, 1.0507], [-0.4747, 0.1538, 0.9039], [-0.4427, 0.0829, 0.7678], [-0.4111, 0.0087, 0.643], [-0.3793, -0.0682, 0.5305], [-0.3463, -0.1474, 0.432], [-0.3102, -0.2276, 0.3501], [-0.2654, -0.3053, 0.2939]], "crossSection": {"points": [[-0.06768, -0.006], [0.06768, -0.006], [0.07248, -0.0011999999999999997], [0.07248, 0.0011999999999999997], [0.06768, 0.006], [-0.06768, 0.006], [-0.07248, 0.0011999999999999997], [-0.07248, -0.0011999999999999997]]}, "closed": false}}, "parent": "ribbon-outer-arm", "attachment": {"parentId": "ribbon-outer-arm", "parentSocket": "arm-outer-surface", "localStart": [-1.02, 0.62, -0.16], "localEnd": [-0.5, 0.16, 0.02], "contactType": "conformal-shell", "overlap": 0.008, "gapTolerance": 0.002, "notes": "Same shell continued along the spar, shrinking with the taper."}, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.65}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["panel-plate-grid"], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "plated-topface-arm", "dominantAlbedo": "rgba(227, 216, 208, 1.0)", "secondaryAlbedo": "rgba(174, 159, 151, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.6, "roughnessEstimate": 0.299, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\c-tail-mid.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.508}}};
  node_plated_topface_arm_5.add(mesh_plated_topface_arm_5);
  meshes["plated-topface-arm"] = mesh_plated_topface_arm_5;
  colliders["plated-topface-arm"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_plated_topface_arm_5);

  const attachment_lamina_stack_coil_6 = null;
  const endpoint_lamina_stack_coil_6 = makeAttachmentEndpoint(attachment_lamina_stack_coil_6);
  const node_lamina_stack_coil_6 = new THREE.Group();
  node_lamina_stack_coil_6.name = "Coil ply stack__pivot";
  if (endpoint_lamina_stack_coil_6) {
    node_lamina_stack_coil_6.position.copy(endpoint_lamina_stack_coil_6.start);
    node_lamina_stack_coil_6.rotation.set(0, 0, 0);
    node_lamina_stack_coil_6.scale.set(1, 1, 1);
  } else {
    node_lamina_stack_coil_6.position.set(0.0, 0.0, 0.0);
    node_lamina_stack_coil_6.rotation.set(0.0, 0.0, 0.0);
    node_lamina_stack_coil_6.scale.set(1.0, 1.0, 1.0);
  }
  node_lamina_stack_coil_6.userData.sculptComponent = {"id": "lamina-stack-coil", "name": "Coil ply stack", "level": "meso", "role": "body", "importance": 0.9, "confidence": 0.6, "primitive": "extrude", "topologyClass": "continuous-sculpt", "topologyRationale": "The ribbon's thickness resolved into discrete plies; read edge-on as stacked arcs on the coil's shadowed flank.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "ribbon-coil", "attachment": null, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.6}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-lamina-substrate", "materialLayers": ["mat-lamina-substrate"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["ply-edge-striations"], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "lamina-stack-coil", "dominantAlbedo": "rgba(15, 16, 20, 1.0)", "secondaryAlbedo": "rgba(26, 27, 30, 1.0)", "materialClass": "stone", "materialClassConfidence": 0.6, "roughnessEstimate": 0.128, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-lamina-substrate.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.541}}};
  node_lamina_stack_coil_6.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["ribbon-coil"] ?? root).add(node_lamina_stack_coil_6);
  nodes["lamina-stack-coil"] = node_lamina_stack_coil_6;
  const mesh_lamina_stack_coil_6Geometry = endpoint_lamina_stack_coil_6
    ? new THREE.CylinderGeometry(endpoint_lamina_stack_coil_6.endRadius, endpoint_lamina_stack_coil_6.baseRadius, endpoint_lamina_stack_coil_6.length, 32, 12)
    : buildExtrudeGeometry({"points": [[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]], "depth": 0.1});
  const mesh_lamina_stack_coil_6 = new THREE.Mesh(
    mesh_lamina_stack_coil_6Geometry,
    materialMap["mat-lamina-substrate"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_lamina_stack_coil_6.name = "Coil ply stack";
  if (endpoint_lamina_stack_coil_6) {
    mesh_lamina_stack_coil_6.position.copy(endpoint_lamina_stack_coil_6.midpoint);
    mesh_lamina_stack_coil_6.quaternion.copy(endpoint_lamina_stack_coil_6.quaternion);
  }
  mesh_lamina_stack_coil_6.castShadow = options.castShadow ?? true;
  mesh_lamina_stack_coil_6.receiveShadow = options.receiveShadow ?? true;
  mesh_lamina_stack_coil_6.userData.sculptComponent = {"id": "lamina-stack-coil", "name": "Coil ply stack", "level": "meso", "role": "body", "importance": 0.9, "confidence": 0.6, "primitive": "extrude", "topologyClass": "continuous-sculpt", "topologyRationale": "The ribbon's thickness resolved into discrete plies; read edge-on as stacked arcs on the coil's shadowed flank.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "ribbon-coil", "attachment": null, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.6}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-lamina-substrate", "materialLayers": ["mat-lamina-substrate"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["ply-edge-striations"], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "lamina-stack-coil", "dominantAlbedo": "rgba(15, 16, 20, 1.0)", "secondaryAlbedo": "rgba(26, 27, 30, 1.0)", "materialClass": "stone", "materialClassConfidence": 0.6, "roughnessEstimate": 0.128, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-lamina-substrate.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.541}}};
  node_lamina_stack_coil_6.add(mesh_lamina_stack_coil_6);
  meshes["lamina-stack-coil"] = mesh_lamina_stack_coil_6;
  colliders["lamina-stack-coil"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_lamina_stack_coil_6);

  const attachment_lamina_stack_arm_7 = null;
  const endpoint_lamina_stack_arm_7 = makeAttachmentEndpoint(attachment_lamina_stack_arm_7);
  const node_lamina_stack_arm_7 = new THREE.Group();
  node_lamina_stack_arm_7.name = "Spar ply stack__pivot";
  if (endpoint_lamina_stack_arm_7) {
    node_lamina_stack_arm_7.position.copy(endpoint_lamina_stack_arm_7.start);
    node_lamina_stack_arm_7.rotation.set(0, 0, 0);
    node_lamina_stack_arm_7.scale.set(1, 1, 1);
  } else {
    node_lamina_stack_arm_7.position.set(0.0, 0.0, 0.0);
    node_lamina_stack_arm_7.rotation.set(0.0, 0.0, 0.0);
    node_lamina_stack_arm_7.scale.set(1.0, 1.0, 1.0);
  }
  node_lamina_stack_arm_7.userData.sculptComponent = {"id": "lamina-stack-arm", "name": "Spar ply stack", "level": "meso", "role": "body", "importance": 0.85, "confidence": 0.6, "primitive": "extrude", "topologyClass": "continuous-sculpt", "topologyRationale": "Ply stack along the spar; the plies are what visibly separate at the shear zone.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "ribbon-outer-arm", "attachment": null, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.6}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-lamina-substrate", "materialLayers": ["mat-lamina-substrate"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "lamina-stack-arm", "dominantAlbedo": "rgba(29, 28, 30, 1.0)", "secondaryAlbedo": "rgba(216, 201, 192, 1.0)", "materialClass": "stone", "materialClassConfidence": 0.647, "roughnessEstimate": 0.179, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\c-delam.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.45}}};
  node_lamina_stack_arm_7.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["ribbon-outer-arm"] ?? root).add(node_lamina_stack_arm_7);
  nodes["lamina-stack-arm"] = node_lamina_stack_arm_7;
  const mesh_lamina_stack_arm_7Geometry = endpoint_lamina_stack_arm_7
    ? new THREE.CylinderGeometry(endpoint_lamina_stack_arm_7.endRadius, endpoint_lamina_stack_arm_7.baseRadius, endpoint_lamina_stack_arm_7.length, 32, 12)
    : buildExtrudeGeometry({"points": [[-0.3, -0.3], [0.3, -0.3], [0.3, 0.3], [-0.3, 0.3]], "depth": 0.1});
  const mesh_lamina_stack_arm_7 = new THREE.Mesh(
    mesh_lamina_stack_arm_7Geometry,
    materialMap["mat-lamina-substrate"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_lamina_stack_arm_7.name = "Spar ply stack";
  if (endpoint_lamina_stack_arm_7) {
    mesh_lamina_stack_arm_7.position.copy(endpoint_lamina_stack_arm_7.midpoint);
    mesh_lamina_stack_arm_7.quaternion.copy(endpoint_lamina_stack_arm_7.quaternion);
  }
  mesh_lamina_stack_arm_7.castShadow = options.castShadow ?? true;
  mesh_lamina_stack_arm_7.receiveShadow = options.receiveShadow ?? true;
  mesh_lamina_stack_arm_7.userData.sculptComponent = {"id": "lamina-stack-arm", "name": "Spar ply stack", "level": "meso", "role": "body", "importance": 0.85, "confidence": 0.6, "primitive": "extrude", "topologyClass": "continuous-sculpt", "topologyRationale": "Ply stack along the spar; the plies are what visibly separate at the shear zone.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "ribbon-outer-arm", "attachment": null, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.6}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-lamina-substrate", "materialLayers": ["mat-lamina-substrate"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "lamina-stack-arm", "dominantAlbedo": "rgba(29, 28, 30, 1.0)", "secondaryAlbedo": "rgba(216, 201, 192, 1.0)", "materialClass": "stone", "materialClassConfidence": 0.647, "roughnessEstimate": 0.179, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\c-delam.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.45}}};
  node_lamina_stack_arm_7.add(mesh_lamina_stack_arm_7);
  meshes["lamina-stack-arm"] = mesh_lamina_stack_arm_7;
  colliders["lamina-stack-arm"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_lamina_stack_arm_7);

  const attachment_delamination_shear_zone_8 = null;
  const endpoint_delamination_shear_zone_8 = makeAttachmentEndpoint(attachment_delamination_shear_zone_8);
  const node_delamination_shear_zone_8 = new THREE.Group();
  node_delamination_shear_zone_8.name = "Delamination shear zone__pivot";
  if (endpoint_delamination_shear_zone_8) {
    node_delamination_shear_zone_8.position.copy(endpoint_delamination_shear_zone_8.start);
    node_delamination_shear_zone_8.rotation.set(0, 0, 0);
    node_delamination_shear_zone_8.scale.set(1, 1, 1);
  } else {
    node_delamination_shear_zone_8.position.set(0.0, 0.0, 0.0);
    node_delamination_shear_zone_8.rotation.set(0.0, 0.0, 0.0);
    node_delamination_shear_zone_8.scale.set(1.0, 1.0, 1.0);
  }
  node_delamination_shear_zone_8.userData.sculptComponent = {"id": "delamination-shear-zone", "name": "Delamination shear zone", "level": "meso", "role": "body", "importance": 0.8, "confidence": 0.55, "primitive": "plane-card", "topologyClass": "surface-relief", "topologyRationale": "Plies separating and shearing past one another along the spar's lower edge, producing stepped overlapping tongues.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "ribbon-outer-arm", "attachment": null, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.55}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-lamina-substrate", "materialLayers": ["mat-lamina-substrate"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "delamination-shear-zone", "dominantAlbedo": "rgba(29, 28, 30, 1.0)", "secondaryAlbedo": "rgba(216, 201, 192, 1.0)", "materialClass": "stone", "materialClassConfidence": 0.647, "roughnessEstimate": 0.179, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\c-delam.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.45}}};
  node_delamination_shear_zone_8.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["ribbon-outer-arm"] ?? root).add(node_delamination_shear_zone_8);
  nodes["delamination-shear-zone"] = node_delamination_shear_zone_8;
  const mesh_delamination_shear_zone_8Geometry = endpoint_delamination_shear_zone_8
    ? new THREE.CylinderGeometry(endpoint_delamination_shear_zone_8.endRadius, endpoint_delamination_shear_zone_8.baseRadius, endpoint_delamination_shear_zone_8.length, 32, 12)
    : new THREE.PlaneGeometry(1, 1, 24, 24);
  const mesh_delamination_shear_zone_8 = new THREE.Mesh(
    mesh_delamination_shear_zone_8Geometry,
    materialMap["mat-lamina-substrate"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_delamination_shear_zone_8.name = "Delamination shear zone";
  if (endpoint_delamination_shear_zone_8) {
    mesh_delamination_shear_zone_8.position.copy(endpoint_delamination_shear_zone_8.midpoint);
    mesh_delamination_shear_zone_8.quaternion.copy(endpoint_delamination_shear_zone_8.quaternion);
  }
  mesh_delamination_shear_zone_8.castShadow = options.castShadow ?? true;
  mesh_delamination_shear_zone_8.receiveShadow = options.receiveShadow ?? true;
  mesh_delamination_shear_zone_8.userData.sculptComponent = {"id": "delamination-shear-zone", "name": "Delamination shear zone", "level": "meso", "role": "body", "importance": 0.8, "confidence": 0.55, "primitive": "plane-card", "topologyClass": "surface-relief", "topologyRationale": "Plies separating and shearing past one another along the spar's lower edge, producing stepped overlapping tongues.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "ribbon-outer-arm", "attachment": null, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.55}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-lamina-substrate", "materialLayers": ["mat-lamina-substrate"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "delamination-shear-zone", "dominantAlbedo": "rgba(29, 28, 30, 1.0)", "secondaryAlbedo": "rgba(216, 201, 192, 1.0)", "materialClass": "stone", "materialClassConfidence": 0.647, "roughnessEstimate": 0.179, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\c-delam.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.45}}};
  node_delamination_shear_zone_8.add(mesh_delamination_shear_zone_8);
  meshes["delamination-shear-zone"] = mesh_delamination_shear_zone_8;
  colliders["delamination-shear-zone"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_delamination_shear_zone_8);

  const attachment_arm_tip_fray_9 = null;
  const endpoint_arm_tip_fray_9 = makeAttachmentEndpoint(attachment_arm_tip_fray_9);
  const node_arm_tip_fray_9 = new THREE.Group();
  node_arm_tip_fray_9.name = "Spar tip fray__pivot";
  if (endpoint_arm_tip_fray_9) {
    node_arm_tip_fray_9.position.copy(endpoint_arm_tip_fray_9.start);
    node_arm_tip_fray_9.rotation.set(0, 0, 0);
    node_arm_tip_fray_9.scale.set(1, 1, 1);
  } else {
    node_arm_tip_fray_9.position.set(0.0, 0.0, 0.0);
    node_arm_tip_fray_9.rotation.set(0.0, 0.0, 0.0);
    node_arm_tip_fray_9.scale.set(1.0, 1.0, 1.0);
  }
  node_arm_tip_fray_9.userData.sculptComponent = {"id": "arm-tip-fray", "name": "Spar tip fray", "level": "meso", "role": "body", "importance": 0.85, "confidence": 0.5, "primitive": "instanced-cluster", "topologyClass": "fiber-strand", "topologyRationale": "The terminus is not a clean taper — it dissolves into separated ply slivers. Fiber-strand because the surviving material reads as discrete shards, not a shell.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "ribbon-outer-arm", "attachment": null, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-spall-debris", "materialLayers": ["mat-spall-debris"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["spall-chips"], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "arm-tip-fray", "dominantAlbedo": "rgba(215, 200, 192, 1.0)", "secondaryAlbedo": "rgba(172, 156, 147, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.619, "roughnessEstimate": 0.214, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-spall-debris.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.452}}};
  node_arm_tip_fray_9.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["ribbon-outer-arm"] ?? root).add(node_arm_tip_fray_9);
  nodes["arm-tip-fray"] = node_arm_tip_fray_9;
  const mesh_arm_tip_fray_9Geometry = endpoint_arm_tip_fray_9
    ? new THREE.CylinderGeometry(endpoint_arm_tip_fray_9.endRadius, endpoint_arm_tip_fray_9.baseRadius, endpoint_arm_tip_fray_9.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_arm_tip_fray_9 = new THREE.Mesh(
    mesh_arm_tip_fray_9Geometry,
    materialMap["mat-spall-debris"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_arm_tip_fray_9.name = "Spar tip fray";
  if (endpoint_arm_tip_fray_9) {
    mesh_arm_tip_fray_9.position.copy(endpoint_arm_tip_fray_9.midpoint);
    mesh_arm_tip_fray_9.quaternion.copy(endpoint_arm_tip_fray_9.quaternion);
  }
  mesh_arm_tip_fray_9.castShadow = options.castShadow ?? true;
  mesh_arm_tip_fray_9.receiveShadow = options.receiveShadow ?? true;
  mesh_arm_tip_fray_9.userData.sculptComponent = {"id": "arm-tip-fray", "name": "Spar tip fray", "level": "meso", "role": "body", "importance": 0.85, "confidence": 0.5, "primitive": "instanced-cluster", "topologyClass": "fiber-strand", "topologyRationale": "The terminus is not a clean taper — it dissolves into separated ply slivers. Fiber-strand because the surviving material reads as discrete shards, not a shell.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "ribbon-outer-arm", "attachment": null, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-spall-debris", "materialLayers": ["mat-spall-debris"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["spall-chips"], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "arm-tip-fray", "dominantAlbedo": "rgba(215, 200, 192, 1.0)", "secondaryAlbedo": "rgba(172, 156, 147, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.619, "roughnessEstimate": 0.214, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-spall-debris.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.452}}};
  node_arm_tip_fray_9.add(mesh_arm_tip_fray_9);
  meshes["arm-tip-fray"] = mesh_arm_tip_fray_9;
  colliders["arm-tip-fray"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_arm_tip_fray_9);

  const attachment_coil_outer_rim_edge_10 = {"parentId": "ribbon-coil", "parentSocket": "coil-outer-surface", "localStart": [-0.5, 0.16, 0.04], "localEnd": [0.19, -0.3, 0.11], "contactType": "edge-fillet", "overlap": 0.006, "gapTolerance": 0.002, "notes": "Narrow eased band riding the convex turn-over of the plated face."};
  const endpoint_coil_outer_rim_edge_10 = makeAttachmentEndpoint(attachment_coil_outer_rim_edge_10);
  const node_coil_outer_rim_edge_10 = new THREE.Group();
  node_coil_outer_rim_edge_10.name = "Coil outer rim__pivot";
  if (endpoint_coil_outer_rim_edge_10) {
    node_coil_outer_rim_edge_10.position.copy(endpoint_coil_outer_rim_edge_10.start);
    node_coil_outer_rim_edge_10.rotation.set(0, 0, 0);
    node_coil_outer_rim_edge_10.scale.set(1, 1, 1);
  } else {
    node_coil_outer_rim_edge_10.position.set(0.0, 0.0, 0.0);
    node_coil_outer_rim_edge_10.rotation.set(0.0, 0.0, 0.0);
    node_coil_outer_rim_edge_10.scale.set(1.0, 1.0, 1.0);
  }
  node_coil_outer_rim_edge_10.userData.sculptComponent = {"id": "coil-outer-rim-edge", "name": "Coil outer rim", "level": "meso", "role": "body", "importance": 0.75, "confidence": 0.65, "primitive": "curve-sweep", "topologyClass": "surface-relief", "topologyRationale": "Narrow eased edge where the bright plated face turns over into the dark flank; carries the only polished highlight on the object.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-0.2654, -0.3053, 0.2939], [-0.1809, -0.3739, 0.2675], [-0.0893, -0.4222, 0.2284], [0.0047, -0.4481, 0.1787], [0.0961, -0.4509, 0.1211], [0.1806, -0.4311, 0.0589], [0.2541, -0.39, -0.0048], [0.313, -0.3303, -0.0668], [0.3549, -0.2555, -0.124], [0.3779, -0.1696, -0.1736], [0.3815, -0.0772, -0.2133], [0.3658, 0.0169, -0.2414], [0.3321, 0.1079, -0.2567], [0.2825, 0.1914, -0.2587], [0.22, 0.2633, -0.2477], [0.1478, 0.3202, -0.2246], [0.0699, 0.3598, -0.1907], [-0.0096, 0.3804, -0.148], [-0.0868, 0.3814, -0.0989], [-0.1578, 0.3632, -0.0461], [-0.2192, 0.3272, 0.0079], [-0.2682, 0.2757, 0.0602], [-0.3025, 0.2115, 0.1082], [-0.3209, 0.1382, 0.1497], [-0.3227, 0.0597, 0.1827], [-0.3083, -0.0199, 0.2057], [-0.2787, -0.0967, 0.2179], [-0.2359, -0.1668, 0.2188], [-0.1822, -0.2269, 0.2088], [-0.1206, -0.2742, 0.1885], [-0.0544, -0.3066, 0.1592], [0.0129, -0.3228, 0.1226], [0.078, -0.3225, 0.0807], [0.1377, -0.3059, 0.0357], [0.189, -0.2745, -0.0099], [0.2297, -0.2299, -0.054], [0.2578, -0.1749, -0.0944], [0.2724, -0.1124, -0.1291], [0.2729, -0.0457, -0.1564], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.01778176, -0.009], [0.01778176, -0.009], [0.019328, -0.007453759999999999], [0.019328, 0.007453759999999999], [0.01778176, 0.009], [-0.01778176, 0.009], [-0.019328, 0.007453759999999999], [-0.019328, -0.007453759999999999]]}, "closed": false}}, "parent": "ribbon-coil", "attachment": {"parentId": "ribbon-coil", "parentSocket": "coil-outer-surface", "localStart": [-0.5, 0.16, 0.04], "localEnd": [0.19, -0.3, 0.11], "contactType": "edge-fillet", "overlap": 0.006, "gapTolerance": 0.002, "notes": "Narrow eased band riding the convex turn-over of the plated face."}, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.65}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "coil-outer-rim-edge", "dominantAlbedo": "rgba(218, 207, 200, 1.0)", "secondaryAlbedo": "rgba(186, 174, 168, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.651, "roughnessEstimate": 0.174, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\c-rim.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.579}}};
  node_coil_outer_rim_edge_10.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["ribbon-coil"] ?? root).add(node_coil_outer_rim_edge_10);
  nodes["coil-outer-rim-edge"] = node_coil_outer_rim_edge_10;
  const mesh_coil_outer_rim_edge_10Geometry = endpoint_coil_outer_rim_edge_10
    ? new THREE.CylinderGeometry(endpoint_coil_outer_rim_edge_10.endRadius, endpoint_coil_outer_rim_edge_10.baseRadius, endpoint_coil_outer_rim_edge_10.length, 32, 12)
    : buildCurveSweepGeometry({"spine": [[-0.2654, -0.3053, 0.2939], [-0.1809, -0.3739, 0.2675], [-0.0893, -0.4222, 0.2284], [0.0047, -0.4481, 0.1787], [0.0961, -0.4509, 0.1211], [0.1806, -0.4311, 0.0589], [0.2541, -0.39, -0.0048], [0.313, -0.3303, -0.0668], [0.3549, -0.2555, -0.124], [0.3779, -0.1696, -0.1736], [0.3815, -0.0772, -0.2133], [0.3658, 0.0169, -0.2414], [0.3321, 0.1079, -0.2567], [0.2825, 0.1914, -0.2587], [0.22, 0.2633, -0.2477], [0.1478, 0.3202, -0.2246], [0.0699, 0.3598, -0.1907], [-0.0096, 0.3804, -0.148], [-0.0868, 0.3814, -0.0989], [-0.1578, 0.3632, -0.0461], [-0.2192, 0.3272, 0.0079], [-0.2682, 0.2757, 0.0602], [-0.3025, 0.2115, 0.1082], [-0.3209, 0.1382, 0.1497], [-0.3227, 0.0597, 0.1827], [-0.3083, -0.0199, 0.2057], [-0.2787, -0.0967, 0.2179], [-0.2359, -0.1668, 0.2188], [-0.1822, -0.2269, 0.2088], [-0.1206, -0.2742, 0.1885], [-0.0544, -0.3066, 0.1592], [0.0129, -0.3228, 0.1226], [0.078, -0.3225, 0.0807], [0.1377, -0.3059, 0.0357], [0.189, -0.2745, -0.0099], [0.2297, -0.2299, -0.054], [0.2578, -0.1749, -0.0944], [0.2724, -0.1124, -0.1291], [0.2729, -0.0457, -0.1564], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.01778176, -0.009], [0.01778176, -0.009], [0.019328, -0.007453759999999999], [0.019328, 0.007453759999999999], [0.01778176, 0.009], [-0.01778176, 0.009], [-0.019328, 0.007453759999999999], [-0.019328, -0.007453759999999999]]}, "closed": false});
  const mesh_coil_outer_rim_edge_10 = new THREE.Mesh(
    mesh_coil_outer_rim_edge_10Geometry,
    materialMap["mat-plated-bone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_coil_outer_rim_edge_10.name = "Coil outer rim";
  if (endpoint_coil_outer_rim_edge_10) {
    mesh_coil_outer_rim_edge_10.position.copy(endpoint_coil_outer_rim_edge_10.midpoint);
    mesh_coil_outer_rim_edge_10.quaternion.copy(endpoint_coil_outer_rim_edge_10.quaternion);
  }
  mesh_coil_outer_rim_edge_10.castShadow = options.castShadow ?? true;
  mesh_coil_outer_rim_edge_10.receiveShadow = options.receiveShadow ?? true;
  mesh_coil_outer_rim_edge_10.userData.sculptComponent = {"id": "coil-outer-rim-edge", "name": "Coil outer rim", "level": "meso", "role": "body", "importance": 0.75, "confidence": 0.65, "primitive": "curve-sweep", "topologyClass": "surface-relief", "topologyRationale": "Narrow eased edge where the bright plated face turns over into the dark flank; carries the only polished highlight on the object.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-0.2654, -0.3053, 0.2939], [-0.1809, -0.3739, 0.2675], [-0.0893, -0.4222, 0.2284], [0.0047, -0.4481, 0.1787], [0.0961, -0.4509, 0.1211], [0.1806, -0.4311, 0.0589], [0.2541, -0.39, -0.0048], [0.313, -0.3303, -0.0668], [0.3549, -0.2555, -0.124], [0.3779, -0.1696, -0.1736], [0.3815, -0.0772, -0.2133], [0.3658, 0.0169, -0.2414], [0.3321, 0.1079, -0.2567], [0.2825, 0.1914, -0.2587], [0.22, 0.2633, -0.2477], [0.1478, 0.3202, -0.2246], [0.0699, 0.3598, -0.1907], [-0.0096, 0.3804, -0.148], [-0.0868, 0.3814, -0.0989], [-0.1578, 0.3632, -0.0461], [-0.2192, 0.3272, 0.0079], [-0.2682, 0.2757, 0.0602], [-0.3025, 0.2115, 0.1082], [-0.3209, 0.1382, 0.1497], [-0.3227, 0.0597, 0.1827], [-0.3083, -0.0199, 0.2057], [-0.2787, -0.0967, 0.2179], [-0.2359, -0.1668, 0.2188], [-0.1822, -0.2269, 0.2088], [-0.1206, -0.2742, 0.1885], [-0.0544, -0.3066, 0.1592], [0.0129, -0.3228, 0.1226], [0.078, -0.3225, 0.0807], [0.1377, -0.3059, 0.0357], [0.189, -0.2745, -0.0099], [0.2297, -0.2299, -0.054], [0.2578, -0.1749, -0.0944], [0.2724, -0.1124, -0.1291], [0.2729, -0.0457, -0.1564], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.01778176, -0.009], [0.01778176, -0.009], [0.019328, -0.007453759999999999], [0.019328, 0.007453759999999999], [0.01778176, 0.009], [-0.01778176, 0.009], [-0.019328, 0.007453759999999999], [-0.019328, -0.007453759999999999]]}, "closed": false}}, "parent": "ribbon-coil", "attachment": {"parentId": "ribbon-coil", "parentSocket": "coil-outer-surface", "localStart": [-0.5, 0.16, 0.04], "localEnd": [0.19, -0.3, 0.11], "contactType": "edge-fillet", "overlap": 0.006, "gapTolerance": 0.002, "notes": "Narrow eased band riding the convex turn-over of the plated face."}, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.65}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "coil-outer-rim-edge", "dominantAlbedo": "rgba(218, 207, 200, 1.0)", "secondaryAlbedo": "rgba(186, 174, 168, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.651, "roughnessEstimate": 0.174, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\c-rim.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.579}}};
  node_coil_outer_rim_edge_10.add(mesh_coil_outer_rim_edge_10);
  meshes["coil-outer-rim-edge"] = mesh_coil_outer_rim_edge_10;
  colliders["coil-outer-rim-edge"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_coil_outer_rim_edge_10);

  const attachment_coil_inner_cavity_wall_11 = {"parentId": "ribbon-coil", "parentSocket": "coil-inner-surface", "localStart": [-0.3, 0.06, 0.02], "localEnd": [0.19, -0.24, 0.08], "contactType": "conformal-shell", "overlap": 0.008, "gapTolerance": 0.002, "notes": "Inner shell bounding the through-hole; mirrors the outer sweep inward."};
  const endpoint_coil_inner_cavity_wall_11 = makeAttachmentEndpoint(attachment_coil_inner_cavity_wall_11);
  const node_coil_inner_cavity_wall_11 = new THREE.Group();
  node_coil_inner_cavity_wall_11.name = "Coil cavity wall__pivot";
  if (endpoint_coil_inner_cavity_wall_11) {
    node_coil_inner_cavity_wall_11.position.copy(endpoint_coil_inner_cavity_wall_11.start);
    node_coil_inner_cavity_wall_11.rotation.set(0, 0, 0);
    node_coil_inner_cavity_wall_11.scale.set(1, 1, 1);
  } else {
    node_coil_inner_cavity_wall_11.position.set(0.0, 0.0, 0.0);
    node_coil_inner_cavity_wall_11.rotation.set(0.0, 0.0, 0.0);
    node_coil_inner_cavity_wall_11.scale.set(1.0, 1.0, 1.0);
  }
  node_coil_inner_cavity_wall_11.userData.sculptComponent = {"id": "coil-inner-cavity-wall", "name": "Coil cavity wall", "level": "meso", "role": "body", "importance": 0.8, "confidence": 0.55, "primitive": "curve-sweep", "topologyClass": "conforming-shell", "topologyRationale": "Shadowed inner wall bounding the through-hole; shows the ply stack in section.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-0.2654, -0.3053, 0.2939], [-0.1809, -0.3739, 0.2675], [-0.0893, -0.4222, 0.2284], [0.0047, -0.4481, 0.1787], [0.0961, -0.4509, 0.1211], [0.1806, -0.4311, 0.0589], [0.2541, -0.39, -0.0048], [0.313, -0.3303, -0.0668], [0.3549, -0.2555, -0.124], [0.3779, -0.1696, -0.1736], [0.3815, -0.0772, -0.2133], [0.3658, 0.0169, -0.2414], [0.3321, 0.1079, -0.2567], [0.2825, 0.1914, -0.2587], [0.22, 0.2633, -0.2477], [0.1478, 0.3202, -0.2246], [0.0699, 0.3598, -0.1907], [-0.0096, 0.3804, -0.148], [-0.0868, 0.3814, -0.0989], [-0.1578, 0.3632, -0.0461], [-0.2192, 0.3272, 0.0079], [-0.2682, 0.2757, 0.0602], [-0.3025, 0.2115, 0.1082], [-0.3209, 0.1382, 0.1497], [-0.3227, 0.0597, 0.1827], [-0.3083, -0.0199, 0.2057], [-0.2787, -0.0967, 0.2179], [-0.2359, -0.1668, 0.2188], [-0.1822, -0.2269, 0.2088], [-0.1206, -0.2742, 0.1885], [-0.0544, -0.3066, 0.1592], [0.0129, -0.3228, 0.1226], [0.078, -0.3225, 0.0807], [0.1377, -0.3059, 0.0357], [0.189, -0.2745, -0.0099], [0.2297, -0.2299, -0.054], [0.2578, -0.1749, -0.0944], [0.2724, -0.1124, -0.1291], [0.2729, -0.0457, -0.1564], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.037786240000000006, -0.0165], [0.037786240000000006, -0.0165], [0.041072000000000004, -0.01321424], [0.041072000000000004, 0.01321424], [0.037786240000000006, 0.0165], [-0.037786240000000006, 0.0165], [-0.041072000000000004, 0.01321424], [-0.041072000000000004, -0.01321424]]}, "closed": false}}, "parent": "ribbon-coil", "attachment": {"parentId": "ribbon-coil", "parentSocket": "coil-inner-surface", "localStart": [-0.3, 0.06, 0.02], "localEnd": [0.19, -0.24, 0.08], "contactType": "conformal-shell", "overlap": 0.008, "gapTolerance": 0.002, "notes": "Inner shell bounding the through-hole; mirrors the outer sweep inward."}, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.55}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-cavity-shadow", "materialLayers": ["mat-cavity-shadow"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["ply-edge-striations"], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "coil-inner-cavity-wall", "dominantAlbedo": "rgba(20, 21, 25, 1.0)", "secondaryAlbedo": "rgba(89, 88, 92, 1.0)", "materialClass": "stone", "materialClassConfidence": 0.6, "roughnessEstimate": 0.125, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-cavity-shadow.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.493}}};
  node_coil_inner_cavity_wall_11.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["ribbon-coil"] ?? root).add(node_coil_inner_cavity_wall_11);
  nodes["coil-inner-cavity-wall"] = node_coil_inner_cavity_wall_11;
  const mesh_coil_inner_cavity_wall_11Geometry = endpoint_coil_inner_cavity_wall_11
    ? new THREE.CylinderGeometry(endpoint_coil_inner_cavity_wall_11.endRadius, endpoint_coil_inner_cavity_wall_11.baseRadius, endpoint_coil_inner_cavity_wall_11.length, 32, 12)
    : buildCurveSweepGeometry({"spine": [[-0.2654, -0.3053, 0.2939], [-0.1809, -0.3739, 0.2675], [-0.0893, -0.4222, 0.2284], [0.0047, -0.4481, 0.1787], [0.0961, -0.4509, 0.1211], [0.1806, -0.4311, 0.0589], [0.2541, -0.39, -0.0048], [0.313, -0.3303, -0.0668], [0.3549, -0.2555, -0.124], [0.3779, -0.1696, -0.1736], [0.3815, -0.0772, -0.2133], [0.3658, 0.0169, -0.2414], [0.3321, 0.1079, -0.2567], [0.2825, 0.1914, -0.2587], [0.22, 0.2633, -0.2477], [0.1478, 0.3202, -0.2246], [0.0699, 0.3598, -0.1907], [-0.0096, 0.3804, -0.148], [-0.0868, 0.3814, -0.0989], [-0.1578, 0.3632, -0.0461], [-0.2192, 0.3272, 0.0079], [-0.2682, 0.2757, 0.0602], [-0.3025, 0.2115, 0.1082], [-0.3209, 0.1382, 0.1497], [-0.3227, 0.0597, 0.1827], [-0.3083, -0.0199, 0.2057], [-0.2787, -0.0967, 0.2179], [-0.2359, -0.1668, 0.2188], [-0.1822, -0.2269, 0.2088], [-0.1206, -0.2742, 0.1885], [-0.0544, -0.3066, 0.1592], [0.0129, -0.3228, 0.1226], [0.078, -0.3225, 0.0807], [0.1377, -0.3059, 0.0357], [0.189, -0.2745, -0.0099], [0.2297, -0.2299, -0.054], [0.2578, -0.1749, -0.0944], [0.2724, -0.1124, -0.1291], [0.2729, -0.0457, -0.1564], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.037786240000000006, -0.0165], [0.037786240000000006, -0.0165], [0.041072000000000004, -0.01321424], [0.041072000000000004, 0.01321424], [0.037786240000000006, 0.0165], [-0.037786240000000006, 0.0165], [-0.041072000000000004, 0.01321424], [-0.041072000000000004, -0.01321424]]}, "closed": false});
  const mesh_coil_inner_cavity_wall_11 = new THREE.Mesh(
    mesh_coil_inner_cavity_wall_11Geometry,
    materialMap["mat-cavity-shadow"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_coil_inner_cavity_wall_11.name = "Coil cavity wall";
  if (endpoint_coil_inner_cavity_wall_11) {
    mesh_coil_inner_cavity_wall_11.position.copy(endpoint_coil_inner_cavity_wall_11.midpoint);
    mesh_coil_inner_cavity_wall_11.quaternion.copy(endpoint_coil_inner_cavity_wall_11.quaternion);
  }
  mesh_coil_inner_cavity_wall_11.castShadow = options.castShadow ?? true;
  mesh_coil_inner_cavity_wall_11.receiveShadow = options.receiveShadow ?? true;
  mesh_coil_inner_cavity_wall_11.userData.sculptComponent = {"id": "coil-inner-cavity-wall", "name": "Coil cavity wall", "level": "meso", "role": "body", "importance": 0.8, "confidence": 0.55, "primitive": "curve-sweep", "topologyClass": "conforming-shell", "topologyRationale": "Shadowed inner wall bounding the through-hole; shows the ply stack in section.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry", "curveSweep": {"spine": [[-0.2654, -0.3053, 0.2939], [-0.1809, -0.3739, 0.2675], [-0.0893, -0.4222, 0.2284], [0.0047, -0.4481, 0.1787], [0.0961, -0.4509, 0.1211], [0.1806, -0.4311, 0.0589], [0.2541, -0.39, -0.0048], [0.313, -0.3303, -0.0668], [0.3549, -0.2555, -0.124], [0.3779, -0.1696, -0.1736], [0.3815, -0.0772, -0.2133], [0.3658, 0.0169, -0.2414], [0.3321, 0.1079, -0.2567], [0.2825, 0.1914, -0.2587], [0.22, 0.2633, -0.2477], [0.1478, 0.3202, -0.2246], [0.0699, 0.3598, -0.1907], [-0.0096, 0.3804, -0.148], [-0.0868, 0.3814, -0.0989], [-0.1578, 0.3632, -0.0461], [-0.2192, 0.3272, 0.0079], [-0.2682, 0.2757, 0.0602], [-0.3025, 0.2115, 0.1082], [-0.3209, 0.1382, 0.1497], [-0.3227, 0.0597, 0.1827], [-0.3083, -0.0199, 0.2057], [-0.2787, -0.0967, 0.2179], [-0.2359, -0.1668, 0.2188], [-0.1822, -0.2269, 0.2088], [-0.1206, -0.2742, 0.1885], [-0.0544, -0.3066, 0.1592], [0.0129, -0.3228, 0.1226], [0.078, -0.3225, 0.0807], [0.1377, -0.3059, 0.0357], [0.189, -0.2745, -0.0099], [0.2297, -0.2299, -0.054], [0.2578, -0.1749, -0.0944], [0.2724, -0.1124, -0.1291], [0.2729, -0.0457, -0.1564], [0.2597, 0.0216, -0.1753]], "crossSection": {"points": [[-0.037786240000000006, -0.0165], [0.037786240000000006, -0.0165], [0.041072000000000004, -0.01321424], [0.041072000000000004, 0.01321424], [0.037786240000000006, 0.0165], [-0.037786240000000006, 0.0165], [-0.041072000000000004, 0.01321424], [-0.041072000000000004, -0.01321424]]}, "closed": false}}, "parent": "ribbon-coil", "attachment": {"parentId": "ribbon-coil", "parentSocket": "coil-inner-surface", "localStart": [-0.3, 0.06, 0.02], "localEnd": [0.19, -0.24, 0.08], "contactType": "conformal-shell", "overlap": 0.008, "gapTolerance": 0.002, "notes": "Inner shell bounding the through-hole; mirrors the outer sweep inward."}, "dimensions": {"width": 0.5, "height": 0.5, "depth": 0.2, "units": "relative", "confidence": 0.55}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-cavity-shadow", "materialLayers": ["mat-cavity-shadow"], "deformations": [], "joints": [], "seams": [], "localFeatures": ["ply-edge-striations"], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "coil-inner-cavity-wall", "dominantAlbedo": "rgba(20, 21, 25, 1.0)", "secondaryAlbedo": "rgba(89, 88, 92, 1.0)", "materialClass": "stone", "materialClassConfidence": 0.6, "roughnessEstimate": 0.125, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-cavity-shadow.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.493}}};
  node_coil_inner_cavity_wall_11.add(mesh_coil_inner_cavity_wall_11);
  meshes["coil-inner-cavity-wall"] = mesh_coil_inner_cavity_wall_11;
  colliders["coil-inner-cavity-wall"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_coil_inner_cavity_wall_11);

  const attachment_panel_plate_grid_12 = null;
  const endpoint_panel_plate_grid_12 = makeAttachmentEndpoint(attachment_panel_plate_grid_12);
  const node_panel_plate_grid_12 = new THREE.Group();
  node_panel_plate_grid_12.name = "Hull plating panels__pivot";
  if (endpoint_panel_plate_grid_12) {
    node_panel_plate_grid_12.position.copy(endpoint_panel_plate_grid_12.start);
    node_panel_plate_grid_12.rotation.set(0, 0, 0);
    node_panel_plate_grid_12.scale.set(1, 1, 1);
  } else {
    node_panel_plate_grid_12.position.set(0.0, 0.0, 0.0);
    node_panel_plate_grid_12.rotation.set(0.0, 0.0, 0.0);
    node_panel_plate_grid_12.scale.set(1.0, 1.0, 1.0);
  }
  node_panel_plate_grid_12.userData.sculptComponent = {"id": "panel-plate-grid", "name": "Hull plating panels", "level": "micro", "role": "body", "importance": 0.8, "confidence": 0.7, "primitive": "plane-card", "topologyClass": "surface-relief", "topologyRationale": "Rectangular plating, 4:1 to 12:1 aspect, aligned to the sweep with occasional cross-breaks. Shallow relief — affects normals, not silhouette.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "plated-topface-coil", "attachment": null, "dimensions": {"width": 0.08, "height": 0.02, "depth": 0.08, "units": "relative", "confidence": 0.7}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "panel-plate-grid", "dominantAlbedo": "rgba(222, 212, 204, 1.0)", "secondaryAlbedo": "rgba(176, 165, 159, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.6, "roughnessEstimate": 0.266, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-plated-bone.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.713}}};
  node_panel_plate_grid_12.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["plated-topface-coil"] ?? root).add(node_panel_plate_grid_12);
  nodes["panel-plate-grid"] = node_panel_plate_grid_12;
  const mesh_panel_plate_grid_12Geometry = endpoint_panel_plate_grid_12
    ? new THREE.CylinderGeometry(endpoint_panel_plate_grid_12.endRadius, endpoint_panel_plate_grid_12.baseRadius, endpoint_panel_plate_grid_12.length, 32, 12)
    : new THREE.PlaneGeometry(1, 1, 24, 24);
  const mesh_panel_plate_grid_12 = new THREE.Mesh(
    mesh_panel_plate_grid_12Geometry,
    materialMap["mat-plated-bone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_panel_plate_grid_12.name = "Hull plating panels";
  if (endpoint_panel_plate_grid_12) {
    mesh_panel_plate_grid_12.position.copy(endpoint_panel_plate_grid_12.midpoint);
    mesh_panel_plate_grid_12.quaternion.copy(endpoint_panel_plate_grid_12.quaternion);
  }
  mesh_panel_plate_grid_12.castShadow = options.castShadow ?? true;
  mesh_panel_plate_grid_12.receiveShadow = options.receiveShadow ?? true;
  mesh_panel_plate_grid_12.userData.sculptComponent = {"id": "panel-plate-grid", "name": "Hull plating panels", "level": "micro", "role": "body", "importance": 0.8, "confidence": 0.7, "primitive": "plane-card", "topologyClass": "surface-relief", "topologyRationale": "Rectangular plating, 4:1 to 12:1 aspect, aligned to the sweep with occasional cross-breaks. Shallow relief — affects normals, not silhouette.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "plated-topface-coil", "attachment": null, "dimensions": {"width": 0.08, "height": 0.02, "depth": 0.08, "units": "relative", "confidence": 0.7}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "panel-plate-grid", "dominantAlbedo": "rgba(222, 212, 204, 1.0)", "secondaryAlbedo": "rgba(176, 165, 159, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.6, "roughnessEstimate": 0.266, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-plated-bone.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.713}}};
  node_panel_plate_grid_12.add(mesh_panel_plate_grid_12);
  meshes["panel-plate-grid"] = mesh_panel_plate_grid_12;
  colliders["panel-plate-grid"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_panel_plate_grid_12);

  const attachment_scribe_linework_13 = null;
  const endpoint_scribe_linework_13 = makeAttachmentEndpoint(attachment_scribe_linework_13);
  const node_scribe_linework_13 = new THREE.Group();
  node_scribe_linework_13.name = "Scribe linework__pivot";
  if (endpoint_scribe_linework_13) {
    node_scribe_linework_13.position.copy(endpoint_scribe_linework_13.start);
    node_scribe_linework_13.rotation.set(0, 0, 0);
    node_scribe_linework_13.scale.set(1, 1, 1);
  } else {
    node_scribe_linework_13.position.set(0.0, 0.0, 0.0);
    node_scribe_linework_13.rotation.set(0.0, 0.0, 0.0);
    node_scribe_linework_13.scale.set(1.0, 1.0, 1.0);
  }
  node_scribe_linework_13.userData.sculptComponent = {"id": "scribe-linework", "name": "Scribe linework", "level": "micro", "role": "body", "importance": 0.6, "confidence": 0.65, "primitive": "plane-card", "topologyClass": "material-only", "topologyRationale": "Hairline sub-divisions finer than the panel breaks. No geometry — a height/normal contribution only.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "plated-topface-coil", "attachment": null, "dimensions": {"width": 0.08, "height": 0.02, "depth": 0.08, "units": "relative", "confidence": 0.65}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout"};
  node_scribe_linework_13.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["plated-topface-coil"] ?? root).add(node_scribe_linework_13);
  nodes["scribe-linework"] = node_scribe_linework_13;
  const mesh_scribe_linework_13Geometry = endpoint_scribe_linework_13
    ? new THREE.CylinderGeometry(endpoint_scribe_linework_13.endRadius, endpoint_scribe_linework_13.baseRadius, endpoint_scribe_linework_13.length, 32, 12)
    : new THREE.PlaneGeometry(1, 1, 24, 24);
  const mesh_scribe_linework_13 = new THREE.Mesh(
    mesh_scribe_linework_13Geometry,
    materialMap["mat-plated-bone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_scribe_linework_13.name = "Scribe linework";
  if (endpoint_scribe_linework_13) {
    mesh_scribe_linework_13.position.copy(endpoint_scribe_linework_13.midpoint);
    mesh_scribe_linework_13.quaternion.copy(endpoint_scribe_linework_13.quaternion);
  }
  mesh_scribe_linework_13.castShadow = options.castShadow ?? true;
  mesh_scribe_linework_13.receiveShadow = options.receiveShadow ?? true;
  mesh_scribe_linework_13.userData.sculptComponent = {"id": "scribe-linework", "name": "Scribe linework", "level": "micro", "role": "body", "importance": 0.6, "confidence": 0.65, "primitive": "plane-card", "topologyClass": "material-only", "topologyRationale": "Hairline sub-divisions finer than the panel breaks. No geometry — a height/normal contribution only.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "plated-topface-coil", "attachment": null, "dimensions": {"width": 0.08, "height": 0.02, "depth": 0.08, "units": "relative", "confidence": 0.65}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout"};
  node_scribe_linework_13.add(mesh_scribe_linework_13);
  meshes["scribe-linework"] = mesh_scribe_linework_13;
  colliders["scribe-linework"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_scribe_linework_13);

  const attachment_greeble_clusters_14 = null;
  const endpoint_greeble_clusters_14 = makeAttachmentEndpoint(attachment_greeble_clusters_14);
  const node_greeble_clusters_14 = new THREE.Group();
  node_greeble_clusters_14.name = "Greeble clusters__pivot";
  if (endpoint_greeble_clusters_14) {
    node_greeble_clusters_14.position.copy(endpoint_greeble_clusters_14.start);
    node_greeble_clusters_14.rotation.set(0, 0, 0);
    node_greeble_clusters_14.scale.set(1, 1, 1);
  } else {
    node_greeble_clusters_14.position.set(0.0, 0.0, 0.0);
    node_greeble_clusters_14.rotation.set(0.0, 0.0, 0.0);
    node_greeble_clusters_14.scale.set(1.0, 1.0, 1.0);
  }
  node_greeble_clusters_14.userData.sculptComponent = {"id": "greeble-clusters", "name": "Greeble clusters", "level": "micro", "role": "body", "importance": 0.7, "confidence": 0.55, "primitive": "instanced-cluster", "topologyClass": "assembled-solid", "topologyRationale": "Grouped boxy protrusions breaking the plating plane, densest at the coil shoulder. Real geometry — they break the silhouette at grazing angles.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "plated-topface-coil", "attachment": null, "dimensions": {"width": 0.08, "height": 0.02, "depth": 0.08, "units": "relative", "confidence": 0.55}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "greeble-clusters", "dominantAlbedo": "rgba(222, 212, 204, 1.0)", "secondaryAlbedo": "rgba(176, 165, 159, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.6, "roughnessEstimate": 0.266, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-plated-bone.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.713}}};
  node_greeble_clusters_14.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["plated-topface-coil"] ?? root).add(node_greeble_clusters_14);
  nodes["greeble-clusters"] = node_greeble_clusters_14;
  const mesh_greeble_clusters_14Geometry = endpoint_greeble_clusters_14
    ? new THREE.CylinderGeometry(endpoint_greeble_clusters_14.endRadius, endpoint_greeble_clusters_14.baseRadius, endpoint_greeble_clusters_14.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_greeble_clusters_14 = new THREE.Mesh(
    mesh_greeble_clusters_14Geometry,
    materialMap["mat-plated-bone"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_greeble_clusters_14.name = "Greeble clusters";
  if (endpoint_greeble_clusters_14) {
    mesh_greeble_clusters_14.position.copy(endpoint_greeble_clusters_14.midpoint);
    mesh_greeble_clusters_14.quaternion.copy(endpoint_greeble_clusters_14.quaternion);
  }
  mesh_greeble_clusters_14.castShadow = options.castShadow ?? true;
  mesh_greeble_clusters_14.receiveShadow = options.receiveShadow ?? true;
  mesh_greeble_clusters_14.userData.sculptComponent = {"id": "greeble-clusters", "name": "Greeble clusters", "level": "micro", "role": "body", "importance": 0.7, "confidence": 0.55, "primitive": "instanced-cluster", "topologyClass": "assembled-solid", "topologyRationale": "Grouped boxy protrusions breaking the plating plane, densest at the coil shoulder. Real geometry — they break the silhouette at grazing angles.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "plated-topface-coil", "attachment": null, "dimensions": {"width": 0.08, "height": 0.02, "depth": 0.08, "units": "relative", "confidence": 0.55}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-plated-bone", "materialLayers": ["mat-plated-bone"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "greeble-clusters", "dominantAlbedo": "rgba(222, 212, 204, 1.0)", "secondaryAlbedo": "rgba(176, 165, 159, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.6, "roughnessEstimate": 0.266, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-plated-bone.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.713}}};
  node_greeble_clusters_14.add(mesh_greeble_clusters_14);
  meshes["greeble-clusters"] = mesh_greeble_clusters_14;
  colliders["greeble-clusters"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_greeble_clusters_14);

  const attachment_spall_chips_15 = null;
  const endpoint_spall_chips_15 = makeAttachmentEndpoint(attachment_spall_chips_15);
  const node_spall_chips_15 = new THREE.Group();
  node_spall_chips_15.name = "Spall chips__pivot";
  if (endpoint_spall_chips_15) {
    node_spall_chips_15.position.copy(endpoint_spall_chips_15.start);
    node_spall_chips_15.rotation.set(0, 0, 0);
    node_spall_chips_15.scale.set(1, 1, 1);
  } else {
    node_spall_chips_15.position.set(0.0, 0.0, 0.0);
    node_spall_chips_15.rotation.set(0.0, 0.0, 0.0);
    node_spall_chips_15.scale.set(1.0, 1.0, 1.0);
  }
  node_spall_chips_15.userData.sculptComponent = {"id": "spall-chips", "name": "Spall chips", "level": "micro", "role": "body", "importance": 0.75, "confidence": 0.5, "primitive": "instanced-cluster", "topologyClass": "assembled-solid", "topologyRationale": "Detached and half-detached flakes along the frayed upper edge, size decaying toward the tip.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "arm-tip-fray", "attachment": null, "dimensions": {"width": 0.08, "height": 0.02, "depth": 0.08, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-spall-debris", "materialLayers": ["mat-spall-debris"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "spall-chips", "dominantAlbedo": "rgba(215, 200, 192, 1.0)", "secondaryAlbedo": "rgba(172, 156, 147, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.619, "roughnessEstimate": 0.214, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-spall-debris.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.452}}};
  node_spall_chips_15.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["arm-tip-fray"] ?? root).add(node_spall_chips_15);
  nodes["spall-chips"] = node_spall_chips_15;
  const mesh_spall_chips_15Geometry = endpoint_spall_chips_15
    ? new THREE.CylinderGeometry(endpoint_spall_chips_15.endRadius, endpoint_spall_chips_15.baseRadius, endpoint_spall_chips_15.length, 32, 12)
    : new THREE.BoxGeometry(1, 1, 1, 12, 12, 12);
  const mesh_spall_chips_15 = new THREE.Mesh(
    mesh_spall_chips_15Geometry,
    materialMap["mat-spall-debris"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_spall_chips_15.name = "Spall chips";
  if (endpoint_spall_chips_15) {
    mesh_spall_chips_15.position.copy(endpoint_spall_chips_15.midpoint);
    mesh_spall_chips_15.quaternion.copy(endpoint_spall_chips_15.quaternion);
  }
  mesh_spall_chips_15.castShadow = options.castShadow ?? true;
  mesh_spall_chips_15.receiveShadow = options.receiveShadow ?? true;
  mesh_spall_chips_15.userData.sculptComponent = {"id": "spall-chips", "name": "Spall chips", "level": "micro", "role": "body", "importance": 0.75, "confidence": 0.5, "primitive": "instanced-cluster", "topologyClass": "assembled-solid", "topologyRationale": "Detached and half-detached flakes along the frayed upper edge, size decaying toward the tip.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "arm-tip-fray", "attachment": null, "dimensions": {"width": 0.08, "height": 0.02, "depth": 0.08, "units": "relative", "confidence": 0.5}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-spall-debris", "materialLayers": ["mat-spall-debris"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "spall-chips", "dominantAlbedo": "rgba(215, 200, 192, 1.0)", "secondaryAlbedo": "rgba(172, 156, 147, 1.0)", "materialClass": "ceramic", "materialClassConfidence": 0.619, "roughnessEstimate": 0.214, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-spall-debris.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.452}}};
  node_spall_chips_15.add(mesh_spall_chips_15);
  meshes["spall-chips"] = mesh_spall_chips_15;
  colliders["spall-chips"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_spall_chips_15);

  const attachment_ply_edge_striations_16 = null;
  const endpoint_ply_edge_striations_16 = makeAttachmentEndpoint(attachment_ply_edge_striations_16);
  const node_ply_edge_striations_16 = new THREE.Group();
  node_ply_edge_striations_16.name = "Ply edge striations__pivot";
  if (endpoint_ply_edge_striations_16) {
    node_ply_edge_striations_16.position.copy(endpoint_ply_edge_striations_16.start);
    node_ply_edge_striations_16.rotation.set(0, 0, 0);
    node_ply_edge_striations_16.scale.set(1, 1, 1);
  } else {
    node_ply_edge_striations_16.position.set(0.0, 0.0, 0.0);
    node_ply_edge_striations_16.rotation.set(0.0, 0.0, 0.0);
    node_ply_edge_striations_16.scale.set(1.0, 1.0, 1.0);
  }
  node_ply_edge_striations_16.userData.sculptComponent = {"id": "ply-edge-striations", "name": "Ply edge striations", "level": "micro", "role": "body", "importance": 0.8, "confidence": 0.6, "primitive": "plane-card", "topologyClass": "surface-relief", "topologyRationale": "Fine concentric grooves where each lamina meets the cut face; spacing tightens toward the cavity.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "coil-inner-cavity-wall", "attachment": null, "dimensions": {"width": 0.08, "height": 0.02, "depth": 0.08, "units": "relative", "confidence": 0.6}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-lamina-substrate", "materialLayers": ["mat-lamina-substrate"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "ply-edge-striations", "dominantAlbedo": "rgba(15, 16, 20, 1.0)", "secondaryAlbedo": "rgba(26, 27, 30, 1.0)", "materialClass": "stone", "materialClassConfidence": 0.6, "roughnessEstimate": 0.128, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-lamina-substrate.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.541}}};
  node_ply_edge_striations_16.userData.actionProfile = {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}};
  (nodes["coil-inner-cavity-wall"] ?? root).add(node_ply_edge_striations_16);
  nodes["ply-edge-striations"] = node_ply_edge_striations_16;
  const mesh_ply_edge_striations_16Geometry = endpoint_ply_edge_striations_16
    ? new THREE.CylinderGeometry(endpoint_ply_edge_striations_16.endRadius, endpoint_ply_edge_striations_16.baseRadius, endpoint_ply_edge_striations_16.length, 32, 12)
    : new THREE.PlaneGeometry(1, 1, 24, 24);
  const mesh_ply_edge_striations_16 = new THREE.Mesh(
    mesh_ply_edge_striations_16Geometry,
    materialMap["mat-lamina-substrate"] ?? new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  mesh_ply_edge_striations_16.name = "Ply edge striations";
  if (endpoint_ply_edge_striations_16) {
    mesh_ply_edge_striations_16.position.copy(endpoint_ply_edge_striations_16.midpoint);
    mesh_ply_edge_striations_16.quaternion.copy(endpoint_ply_edge_striations_16.quaternion);
  }
  mesh_ply_edge_striations_16.castShadow = options.castShadow ?? true;
  mesh_ply_edge_striations_16.receiveShadow = options.receiveShadow ?? true;
  mesh_ply_edge_striations_16.userData.sculptComponent = {"id": "ply-edge-striations", "name": "Ply edge striations", "level": "micro", "role": "body", "importance": 0.8, "confidence": 0.6, "primitive": "plane-card", "topologyClass": "surface-relief", "topologyRationale": "Fine concentric grooves where each lamina meets the cut face; spacing tightens toward the cavity.", "geometryDescriptor": {"topologyIntent": "low-poly blockout with bevel-ready edges", "edgeTreatment": {"type": "none", "bevelRadius": 0.0, "segments": 1}, "deformationStack": [], "uvStrategy": "generated procedural coordinates", "normalStrategy": "vertex normals from generated geometry"}, "parent": "coil-inner-cavity-wall", "attachment": null, "dimensions": {"width": 0.08, "height": 0.02, "depth": 0.08, "units": "relative", "confidence": 0.6}, "transform": {"position": [0, 0, 0], "rotation": [0, 0, 0], "scale": [1, 1, 1]}, "actionProfile": {"animationRole": "static", "pivot": {"mode": "center", "localPosition": [0, 0, 0], "axis": [0, 1, 0], "confidence": 0.5}, "transformChannels": {"translate": true, "rotate": true, "scale": true, "bend": false, "twist": false, "detach": false, "visibility": true, "materialState": true}, "sockets": [], "collider": {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."}, "constraints": [], "destruction": {"breakable": false, "fractureGroup": "root", "seamRefs": [], "detachableFragments": [], "breakImpulse": 0.0, "debrisMaterial": "base"}}, "material": "mat-lamina-substrate", "materialLayers": ["mat-lamina-substrate"], "deformations": [], "joints": [], "seams": [], "localFeatures": [], "surfaceDetail": {"macroRoughness": 0.0, "microRoughness": 0.0, "bumpAmplitude": 0.0, "normalPattern": "", "displacementPattern": "", "occlusionPattern": "", "edgeWearPattern": "", "notes": ""}, "evidenceRefs": ["full-object"], "details": [], "fidelityTier": "blockout", "colorMaterialRecipe": {"componentId": "ply-edge-striations", "dominantAlbedo": "rgba(15, 16, 20, 1.0)", "secondaryAlbedo": "rgba(26, 27, 30, 1.0)", "materialClass": "stone", "materialClassConfidence": 0.6, "roughnessEstimate": 0.128, "metalnessEstimate": 0.0, "highlightEvidence": "sharp, tight specular hotspot — supports low roughness/high specularity", "sourceCropPath": "C:\\Users\\buyss\\AppData\\Local\\Temp\\claude\\C--Users-buyss-Manifold-Delta-Artifacts-01-thoughtform\\e7cde757-b585-46da-adaa-7d39f5abe29a\\scratchpad\\refs\\mat\\mat-lamina-substrate.png", "labClusterMeta": {"clusterCount": 3, "dominantClusterSharePct": 0.541}}};
  node_ply_edge_striations_16.add(mesh_ply_edge_striations_16);
  meshes["ply-edge-striations"] = mesh_ply_edge_striations_16;
  colliders["ply-edge-striations"] = {"type": "box", "offset": [0, 0, 0], "scale": [1, 1, 1], "isTrigger": false, "notes": "Replace with sphere/capsule/compound proxy when the object shape demands it."};
  destructionGroups["root"] ??= [];
  destructionGroups["root"].push(node_ply_edge_striations_16);

  root.userData.sculptRuntime = { nodes, meshes, sockets, colliders, destructionGroups } satisfies ProceduralModelRuntime;
  root.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": true, "targetThreshold": 0.7, "stopOnLowConfidence": true, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "single-image extraction is reference-derived inference, not exact photogrammetry"}, "mustAvoid": ["single flat albedo per material", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  root.userData.actionReadiness = {
    note: 'Use root.userData.sculptRuntime.nodes for transforms, sockets for attachments, colliders for physics proxies, and destructionGroups for breakable sets.',
  };
  return root;
}

export function createRemnantStructure07LFLookDevLights(
  mode: 'neutral' | 'grazing' | 'reference' = 'neutral',
): THREE.Group {
  const lights = new THREE.Group();
  lights.name = "Remnant Structure 07LF look-dev lights";
  const hemi = new THREE.HemisphereLight(
    mode === 'reference' ? 0xfff0d6 : 0xf2f4ff,
    0x363b42,
    mode === 'grazing' ? 0.28 : mode === 'reference' ? 0.72 : 0.85,
  );
  lights.add(hemi);
  const key = new THREE.DirectionalLight(
    mode === 'reference' ? 0xffcf8a : 0xfff4e8,
    mode === 'grazing' ? 4.2 : mode === 'reference' ? 2.6 : 2.15,
  );
  if (mode === 'grazing') key.position.set(7.5, 1.1, 4.0);
  else if (mode === 'reference') key.position.set(-4.5, 7.5, 5.0);
  else key.position.set(-4.0, 6.0, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.bias = -0.00025;
  key.shadow.normalBias = 0.018;
  key.shadow.radius = 7;
  key.shadow.blurSamples = 24;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 2.6;
  key.shadow.camera.bottom = -2.6;
  key.shadow.camera.updateProjectionMatrix();
  lights.add(key);
  const fill = new THREE.DirectionalLight(0xa8c4ff, mode === 'grazing' ? 0.12 : 0.42);
  fill.position.set(4.0, 3.0, 3.5);
  lights.add(fill);
  const rim = new THREE.DirectionalLight(0xfff1c4, mode === 'grazing' ? 0.28 : 0.85);
  rim.position.set(0.5, 4.5, -6.0);
  lights.add(rim);
  lights.userData.reviewMode = mode;
  lights.userData.lightingFromPhoto = [{"id": "key", "role": "key light", "type": "directional", "direction": [0.62, 0.55, 0.56], "intensity": 3.1, "color": "#FFF4E2", "evidence": "The plated band is blown toward white along its upper-right flank while the cavity wall stays near-black — a single hard key from camera-right and above, no visible second highlight."}, {"id": "fill", "role": "fill light", "type": "hemisphere", "direction": [-0.4, -0.2, 0.3], "intensity": 0.26, "color": "#2A3038", "evidence": "Shadowed ply stack retains faint cool separation rather than crushing to the background value — a weak cool bounce, roughly 8% of key."}, {"id": "rim", "role": "rim light", "type": "directional", "direction": [-0.7, 0.25, -0.62], "intensity": 0.85, "color": "#C8D4E0", "evidence": "A thin cool edge separates the spar's upper contour from the field, strongest at the tip where the material thins."}, {"id": "environment", "role": "environment light", "type": "environment", "intensity": 0.18, "color": "#101418", "evidence": "Near-black surround; the environment contributes occlusion context, not illumination."}, {"id": "exposure", "role": "exposure and tone mapping", "toneMapping": "ACESFilmic", "exposure": 0.92, "background": "#0A0908", "contactShadow": "none — the object is free-floating, so no contact shadow exists in the reference", "evidence": "Highlights roll off without clipping to pure white except on the rim."}];
  lights.userData.lookDevTargets = {"qualityPriority": "reference-fidelity", "materialPass": {"albedoPaletteRequired": true, "roughnessVariationRequired": true, "normalOrBumpRequired": true, "localOverridesRequired": true, "minimumTextureResolution": 1024, "preferredTextureResolution": 2048, "independentMapChannels": ["albedo", "roughness", "height", "normal", "ambient-occlusion"], "requiredSurfaceFrequencyBands": ["macro", "meso", "micro"], "geometryReliefRequiredWhenSilhouetteAffected": true, "referencePbrExtraction": {"requiredWhenSourceImagePresent": true, "targetThreshold": 0.7, "stopOnLowConfidence": true, "script": "forge/stage1_intake/extract_pbr_evidence.py", "acceptedLimitation": "single-image extraction is reference-derived inference, not exact photogrammetry"}, "mustAvoid": ["single flat albedo per material", "uniform roughness", "albedo texture reused as roughness/height/normal/AO", "single-frequency random noise", "plastic-looking smooth bark, stone, cloth, foliage, or aged material", "local color/detail described only in prose without material masks", "claiming exact PBR recovery when confidence is below the target threshold"]}, "lightingPass": {"requiredTerms": ["key light", "fill light", "rim or environment light", "exposure", "tone mapping", "background", "contact shadow"], "mustAvoid": ["ambient-only lighting", "flat value range", "missing contact shadow", "reference lighting copied without separating material readability"]}, "screenshotReview": ["Compare albedo palette and local color zones.", "Compare roughness/normal/bump response under light.", "Compare cavity dirt, edge wear, stains, moss, scratches, or other local masks.", "Compare key/fill/rim structure, exposure, tone mapping, background, and contact shadows.", "Capture a neutral-light render to verify material readability without reference lighting.", "Capture a grazing-light close-up to expose flat normals, uniform roughness, tiling, and plastic highlights.", "Capture a reference-matched render from the same camera framing as the source."]};
  return lights;
}

// PBR materials (clearcoat/iridescence/transmission/anisotropy) need an environment
// map to visually behave as intended — call this once per renderer and assign the
// result to scene.environment before rendering. No external HDR asset required.
export function createRemnantStructure07LFEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return texture;
}

// Plan 1.3 §3.2 — auto-framing by bounding box. The Divine Eye can only compare a
// render to the reference if the object is FRAMED consistently (an object framed
// differently scores as wrong even when its shape is right). This positions the camera
// deterministically from the object's bounding box so it fills the frame at a stable
// margin, and sets near/far to the object scale. Call after adding the model to the
// scene, and again on resize (after updating camera.aspect).
export function frameRemnantStructure07LFCamera(
  camera: THREE.PerspectiveCamera,
  object: THREE.Object3D,
  options: { margin?: number; azimuthDeg?: number; elevationDeg?: number } = {},
): void {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const margin = options.margin ?? 1.15;
  const maxDim = Math.max(size.x, size.y, size.z) * margin;
  const fov = (camera.fov * Math.PI) / 180;
  // distance so the largest object dimension fits vertically in the frame
  const distance = (maxDim / 2) / Math.tan(fov / 2);
  const az = ((options.azimuthDeg ?? 0) * Math.PI) / 180;
  const el = ((options.elevationDeg ?? 0) * Math.PI) / 180;
  const dir = new THREE.Vector3(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  );
  camera.position.copy(center).addScaledVector(dir, distance);
  camera.near = Math.max(0.01, distance - maxDim);
  camera.far = distance + maxDim * 2;
  camera.lookAt(center);
  camera.updateProjectionMatrix();
}

// Plan 1.3 §3.2c — PRESENTATION composer (DOF + bloom). CRITICAL (R-POSTFX): this is
// for the showcase/hero render ONLY. The Divine Eye's EVALUATION render MUST use a
// plain renderer with NO composer — bloom blows highlights and DOF blurs edges, which
// would corrupt the deterministic IoU/DCD/edge/blowout signals. Enable dof/bloom ONLY
// when the reference photo actually exhibits them (detect_reference_effects.py authorizes).
export function createRemnantStructure07LFPresentationComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: { dof?: boolean; bloom?: boolean; bloomStrength?: number; dofFocus?: number; dofAperture?: number } = {},
): EffectComposer {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  if (options.dof) {
    composer.addPass(new BokehPass(scene, camera, {
      focus: options.dofFocus ?? 10.0,
      aperture: options.dofAperture ?? 0.0002,
      maxblur: 0.01,
    }));
  }
  if (options.bloom) {
    const size = new THREE.Vector2();
    renderer.getSize(size);
    composer.addPass(new UnrealBloomPass(size, options.bloomStrength ?? 0.4, 0.4, 0.85));
  }
  return composer;
}

export function configureRemnantStructure07LFRenderer(renderer: THREE.WebGLRenderer): void {
  // Load-bearing for view-dependent finishes (anodized / Doppler): without ACES + sRGB
  // the environment reflection reads flat/washed instead of a believable metal response.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

export function createRemnantStructure07LFInspectControls(
  camera: THREE.Camera,
  domElement: HTMLElement,
): OrbitControls {
  // View-dependent finishes only read correctly once the user orbits — their color
  // comes from the environment reflection, not albedo, so free rotation matters here.
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.minDistance = 1.0;
  controls.maxDistance = 8.0;
  controls.autoRotate = false;
  return controls;
}
