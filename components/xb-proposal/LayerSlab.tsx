/* The X-Bionic layer as one object: three strata, Context at the base, then
   Skills, then Evals. Every drawing in the proposal draws THIS slab, closed,
   docked or pulled apart, so the second section opens what the first drew. */

import { STRATA } from "./copy";
import { boxFaces, tint, type Box, type Iso } from "./iso";

/* Tokens with the lab's hex as fallbacks: byte-equal in dark, re-derived
   in light where the proposal page mounts the slab. */
const GOLD = "var(--gold-line, #caa554)";
const WASH = "var(--gold, #caa554)";

export interface SlabGeometry {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  /** Height of the slab's underside. */
  z0: number;
  /** Thickness of one stratum. */
  t: number;
  /** Air between strata: near 0 closed, larger pulled apart. */
  gap: number;
}

/** The three boxes, base first, so a caller can anchor labels on them. */
export function slabBoxes(g: SlabGeometry): Box[] {
  return STRATA.map((_, i) => {
    const z0 = g.z0 + i * (g.t + g.gap);
    return { x0: g.x0, x1: g.x1, y0: g.y0, y1: g.y1, z0, z1: z0 + g.t };
  });
}

interface LayerSlabProps {
  iso: Iso;
  g: SlabGeometry;
  /** 0 is a dashed ghost of where the layer will be, 1 is the layer drawn. */
  presence?: number;
  /** Flat marks on the top face: the slab's own name, etched. */
  etch?: boolean;
  /** How many strata are written yet, base first (section 2's growth). */
  count?: 1 | 2 | 3;
  /** A notch at the top-right of every stratum (the house's single TR
      notch, in the plane), in world units. 0, the default, is the slab every
      other drawing draws, unchanged. */
  notch?: number;
}

/** A box's faces with its (x1, y0) corner notched: the top loses the corner,
    the right face starts past the cut. The cut's own face is edge-on in this
    projection, so the outline carries it. */
function notchedFaces(iso: Iso, b: Box, c: number) {
  if (c <= 0) return boxFaces(iso, b);
  const { p } = iso;
  const pts = (list: (readonly [number, number])[]) =>
    list.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const f = boxFaces(iso, b);
  return {
    ...f,
    top: pts([
      p(b.x0, b.y0, b.z1),
      p(b.x1 - c, b.y0, b.z1),
      p(b.x1, b.y0 + c, b.z1),
      p(b.x1, b.y1, b.z1),
      p(b.x0, b.y1, b.z1),
    ]),
    right: pts([
      p(b.x1, b.y0 + c, b.z1),
      p(b.x1, b.y1, b.z1),
      p(b.x1, b.y1, b.z0),
      p(b.x1, b.y0 + c, b.z0),
    ]),
  };
}

export function LayerSlab({
  iso,
  g,
  presence = 1,
  etch = true,
  count = 3,
  notch = 0,
}: LayerSlabProps) {
  const boxes = slabBoxes(g).slice(0, count);
  const ghost = 1 - presence;
  return (
    <g>
      {ghost > 0.001 && (
        <g opacity={ghost * 0.55}>
          <polygon
            points={boxFaces(iso, { ...boxes[0], z1: boxes[boxes.length - 1].z1 }).outline}
            fill="none"
            stroke={GOLD}
            strokeWidth={1}
            strokeDasharray="3 5"
          />
        </g>
      )}
      {presence > 0.001 && (
        <g opacity={presence}>
          {boxes.map((b, i) => {
            const f = notchedFaces(iso, b, notch);
            const lift = 0.06 * i;
            return (
              <g key={STRATA[i].id}>
                <polygon
                  points={f.left}
                  fill={tint(WASH, 0.1 + lift)}
                  stroke={GOLD}
                  strokeWidth={1}
                />
                <polygon
                  points={f.right}
                  fill={tint(WASH, 0.05 + lift)}
                  stroke={GOLD}
                  strokeWidth={1}
                />
                <polygon
                  points={f.top}
                  fill={tint(WASH, 0.16 + lift)}
                  stroke={GOLD}
                  strokeWidth={1}
                />
              </g>
            );
          })}
          {etch && <SlabEtch iso={iso} b={boxes[boxes.length - 1]} notch={notch} />}
        </g>
      )}
    </g>
  );
}

/** A fine grid of cells on the top face: the layer reads as written,
    structured material rather than a blank lid. */
function SlabEtch({ iso, b, notch = 0 }: { iso: Iso; b: Box; notch?: number }) {
  const lines: string[] = [];
  const inset = 0.35;
  const cols = Math.max(2, Math.round((b.x1 - b.x0) / 0.9));
  const rows = Math.max(2, Math.round((b.y1 - b.y0) / 0.9));
  const x0 = b.x0 + inset;
  const x1 = b.x1 - inset;
  const y0 = b.y0 + inset;
  const y1 = b.y1 - inset;
  for (let i = 0; i <= cols; i++) {
    const x = x0 + ((x1 - x0) * i) / cols;
    /* past the notch the line starts below the cut: y ≥ y0 + c − (x1 − x) */
    const ys = notch > 0 ? Math.max(y0, b.y0 + notch - (b.x1 - x) + 0.2) : y0;
    if (ys >= y1) continue;
    const a = iso.p(x, ys, b.z1);
    const c = iso.p(x, y1, b.z1);
    lines.push(`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${c[0].toFixed(1)} ${c[1].toFixed(1)}`);
  }
  for (let j = 0; j <= rows; j++) {
    const y = y0 + ((y1 - y0) * j) / rows;
    const xe = notch > 0 ? Math.min(x1, b.x1 - notch + (y - b.y0) - 0.2) : x1;
    if (xe <= x0) continue;
    const a = iso.p(x0, y, b.z1);
    const c = iso.p(xe, y, b.z1);
    lines.push(`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${c[0].toFixed(1)} ${c[1].toFixed(1)}`);
  }
  return (
    <path d={lines.join("")} fill="none" stroke={GOLD} strokeOpacity={0.28} strokeWidth={0.75} />
  );
}
