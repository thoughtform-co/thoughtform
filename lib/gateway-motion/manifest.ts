// Gateway Motion — manifest contract between the prep pipeline
// (scripts/gateway-prep/) and the runtime treatments
// (components/gateway/motion/). Generated file: public/gateway-motion/manifest.json.

export interface PlateSource {
  w: number;
  src: string;
}

export interface SequenceMeta {
  fps: number;
  frameCount: number;
  /** e.g. "/gateway-motion/gateway-v1/frames/f_{index4}.webp" */
  urlPattern: string;
  width: number;
  height: number;
  poster: string;
  format: "webp" | "avif";
}

export type TreatmentKey = "kenburns" | "parallax" | "mesh" | "living" | "scrub";

export interface GatewayVisualEntry {
  id: string;
  name: string;
  source: { file: string; width: number; height: number };
  plate: { avif: PlateSource[]; webp: PlateSource[]; lqip: string };
  depth: { src8: string; srcPacked: string | null; width: number; height: number } | null;
  masks: {
    artifact: string | null;
    stars: string | null;
    background: string | null;
  };
  sequence: SequenceMeta | null;
  /** Optional per-visual tuning overrides, merged over treatment defaults. */
  tuning?: Partial<Record<TreatmentKey, Record<string, number>>>;
}

export interface GatewayMotionManifest {
  version: 1;
  generatedAt: string;
  visuals: GatewayVisualEntry[];
}

export class ManifestMissingError extends Error {
  constructor(url: string, cause?: unknown) {
    super(
      `Gateway Motion manifest not found at ${url}. Run \`npm run gateway:prep\` to generate assets.`
    );
    this.name = "ManifestMissingError";
    this.cause = cause;
  }
}

const MANIFEST_URL = "/gateway-motion/manifest.json";

function isEntry(v: unknown): v is GatewayVisualEntry {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.name === "string" &&
    typeof e.plate === "object" &&
    e.plate !== null
  );
}

export async function loadGatewayManifest(
  url: string = MANIFEST_URL
): Promise<GatewayMotionManifest> {
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-cache" });
  } catch (err) {
    throw new ManifestMissingError(url, err);
  }
  if (!res.ok) throw new ManifestMissingError(url);
  const json = (await res.json()) as GatewayMotionManifest;
  if (json.version !== 1 || !Array.isArray(json.visuals) || !json.visuals.every(isEntry)) {
    throw new Error(`Gateway Motion manifest at ${url} has an unexpected shape`);
  }
  return json;
}

/** True when the browser can decode AVIF (cached after first probe). */
let avifSupport: Promise<boolean> | null = null;
export function supportsAvif(): Promise<boolean> {
  if (avifSupport) return avifSupport;
  avifSupport = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0);
    img.onerror = () => resolve(false);
    // Minimal 1x1 AVIF probe (same approach as modernizr's avif check).
    img.src =
      "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=";
  });
  return avifSupport;
}

/**
 * Pick the smallest plate that still covers the rendered size.
 * `cssWidth` is the layout width of the stage, `dpr` the (capped) device
 * pixel ratio. Falls back to the largest available.
 */
export function pickPlate(
  entry: GatewayVisualEntry,
  cssWidth: number,
  dpr: number,
  avifOk: boolean
): PlateSource {
  const sources = avifOk && entry.plate.avif.length ? entry.plate.avif : entry.plate.webp;
  const needed = cssWidth * Math.max(1, dpr);
  const sorted = [...sources].sort((a, b) => a.w - b.w);
  for (const s of sorted) {
    if (s.w >= needed) return s;
  }
  return sorted[sorted.length - 1];
}

/** Merge manifest tuning overrides over a treatment's defaults. */
export function resolveTuning<T extends Record<string, number>>(
  defaults: T,
  entry: GatewayVisualEntry | null | undefined,
  key: TreatmentKey
): T {
  const overrides = entry?.tuning?.[key];
  return overrides ? { ...defaults, ...overrides } : { ...defaults };
}
