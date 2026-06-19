/**
 * Service sigil shape silhouettes — one loop, three depths.
 *
 * Each entry is a small SVG path union sampled by
 * `lib/brandmark/sampleShape.ts` into a card-scoped particle cloud
 * (`components/landing/home-v2/services/ServiceSigilField.tsx`).
 *
 * The three shapes are progressive **resolutions of the Thoughtform
 * compass mark**:
 *
 *   01 KEYNOTE   - a bare disc                  ("the seed")
 *   02 WORKSHOP  - disc + vertical bar          ("first axis of encoding")
 *   03 EMBEDDED  - disc + full compass cross    ("crystallized practice")
 *
 * Increased silhouette complexity + increased particle count = the
 * visual reads as "deeper" with each card.
 *
 * The viewBox is the same 200x200 square for all three so the painter
 * can size the cloud uniformly across cards.
 */

export type ServiceShapeKey = "loop-forming" | "loop-encoding" | "loop-crystallized";

export interface ServiceShapeSpec {
  /** Stable cache key for `sampleShape`. */
  key: ServiceShapeKey;
  /** SVG path `d` strings — unioned by the sampler. */
  paths: readonly string[];
  /** Source viewBox the paths are authored against. */
  viewBox: { x: number; y: number; width: number; height: number };
  /** Target particle count at desktop density. */
  count: number;
  /** Optional static fallback SVG (rendered when the canvas is
   *  unavailable — reduced motion / no JS / pre-hydration). */
  fallbackSvg: string;
}

const VIEWBOX = { x: 0, y: 0, width: 200, height: 200 } as const;

/** Bare disc — a forming loop, no encoding yet. */
const DISC = "M 100 58 A 42 42 0 1 0 100 142 A 42 42 0 1 0 100 58 Z";

/** Thin vertical bar through the disc — first axis. */
const VBAR = "M 98 16 L 102 16 L 102 184 L 98 184 Z";

/** Thin horizontal bar through the disc — second axis. */
const HBAR = "M 16 98 L 184 98 L 184 102 L 16 102 Z";

export const SERVICE_SHAPES: Record<ServiceShapeKey, ServiceShapeSpec> = {
  "loop-forming": {
    key: "loop-forming",
    paths: [DISC],
    viewBox: VIEWBOX,
    count: 220,
    fallbackSvg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="100" cy="100" r="42" fill="currentColor" />
    </svg>`,
  },
  "loop-encoding": {
    key: "loop-encoding",
    paths: [DISC, VBAR],
    viewBox: VIEWBOX,
    count: 340,
    fallbackSvg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="100" cy="100" r="42" fill="currentColor" />
      <rect x="98" y="16" width="4" height="168" fill="currentColor" />
    </svg>`,
  },
  "loop-crystallized": {
    key: "loop-crystallized",
    paths: [DISC, VBAR, HBAR],
    viewBox: VIEWBOX,
    count: 460,
    fallbackSvg: `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="100" cy="100" r="42" fill="currentColor" />
      <rect x="98" y="16" width="4" height="168" fill="currentColor" />
      <rect x="16" y="98" width="168" height="4" fill="currentColor" />
    </svg>`,
  },
};
