/* Direction C · the board. Drawing first, words second: one isometric board
   (the company's Claude Enterprise) with the layer seated on it as the one
   gold component and Shopify and analytics in front of it, while the four
   workstreams sit behind the board and feed the layer along traces. It reads
   back to front, like a parts drawing, keyed 1 · 2 · 3 to the notes. */

import { OFFER, TOOLS, WORKSTREAMS } from "../copy";
import { Stage } from "../Frame";
import { Glyph } from "../glyphs";
import { boxFaces, makeIso, over, type Box, type Iso, type Pt } from "../iso";
import { LayerSlab, slabBoxes, type SlabGeometry } from "../LayerSlab";

const GOLD = "#caa554";
const TEXT = "#ebe3d6";
const VB_W = 580;
const VB_H = 560;

export function OfferBoard() {
  return (
    <Stage route="S1 · C · board">
      <div className="xbC">
        <div className="xbC__fig">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="The four workstreams feed the X-Bionic layer, seated on Claude Enterprise beside Shopify and analytics"
          >
            <BoardDrawing />
          </svg>
        </div>
        <div className="xbC__text">
          <div className="xb-eyebrow">{OFFER.eyebrow}</div>
          <h2 className="xb-title">
            {OFFER.title[0]}
            <br />
            <span>{OFFER.title[1]}</span>
          </h2>
          <ol className="xbC__notes">
            {OFFER.steps.map((s, i) => (
              <li key={s.n} data-gold={i === 1 || undefined}>
                <span className="xbC__tag">{i + 1}</span>
                <span className="xbC__head">{s.head}</span>
                <p className="xbC__body">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Stage>
  );
}

/* ------------------------------------------------------------------ */

const BOARD: Box = { x0: -5.6, x1: 5.6, y0: -4.2, y1: 4.4, z0: 0, z1: 0.4 };
const TILE = 1.6;
const TILE_X = [-3.3, -1.1, 1.1, 3.3];
const TILE_Y0 = -8.0;
const TOOL_BOX: Box[] = [
  { x0: -3.8, x1: -0.9, y0: 1.5, y1: 3.8, z0: 0.4, z1: 1.05 },
  { x0: 0.9, x1: 3.8, y0: 1.5, y1: 3.8, z0: 0.4, z1: 1.05 },
];
const SLAB: SlabGeometry = { x0: -4.4, x1: 4.4, y0: -3.3, y1: 0.4, z0: 0.4, t: 0.36, gap: 0.07 };

function BoardDrawing() {
  const iso = makeIso(22, 270, 296);
  const strata = slabBoxes(SLAB);
  const slabTop = strata[2].z1;
  const R = 446; // right label column
  const L = 4; // left label column

  return (
    <g>
      {/* Traces on the ground, from each workstream to the board's edge. */}
      {TILE_X.map((cx) => (
        <Trace key={cx} iso={iso} a={[cx, TILE_Y0 + TILE, 0]} b={[cx, BOARD.y0, 0]} />
      ))}

      <Solid iso={iso} b={BOARD} />
      <Dots iso={iso} b={BOARD} />

      {/* On the board: the same traces carried on to the layer's seat. */}
      {TILE_X.map((cx) => (
        <Trace key={cx} iso={iso} a={[cx, BOARD.y0, BOARD.z1]} b={[cx, SLAB.y0, BOARD.z1]} />
      ))}
      {/* From the layer to the two tools. */}
      {TOOL_BOX.map((b) => {
        const x = (b.x0 + b.x1) / 2;
        return <Trace key={x} iso={iso} a={[x, SLAB.y1, BOARD.z1]} b={[x, b.y0, BOARD.z1]} gold />;
      })}

      {TOOL_BOX.map((b, i) => (
        <g key={TOOLS[i].id}>
          <Solid iso={iso} b={b} />
          <Glyph
            name={TOOLS[i].id}
            transform={iso.plane(b.x0 + 0.55, b.y0 + 0.35, b.z1, 1.6 / 24)}
            stroke={TEXT}
            strokeWidth={1}
          />
        </g>
      ))}

      <LayerSlab iso={iso} g={SLAB} />

      {/* The team, behind the board. */}
      {TILE_X.map((cx, i) => {
        const b: Box = {
          x0: cx - TILE / 2,
          x1: cx + TILE / 2,
          y0: TILE_Y0,
          y1: TILE_Y0 + TILE,
          z0: 0,
          z1: 0.18,
        };
        return (
          <g key={WORKSTREAMS[i].id}>
            <Solid iso={iso} b={b} strong />
            <Glyph
              name={WORKSTREAMS[i].id}
              transform={iso.plane(b.x0 + 0.2, b.y0 + 0.2, b.z1, (TILE - 0.4) / 24)}
              stroke={TEXT}
              strokeWidth={1}
            />
          </g>
        );
      })}

      {/* Labels: the team in a staircase over its tiles, under one head. */}
      {TILE_X.map((cx, i) => {
        const at = iso.p(cx - TILE / 2, TILE_Y0, 0.18);
        return (
          <g key={`l-${WORKSTREAMS[i].id}`}>
            <line
              x1={at[0]}
              y1={at[1] - 4}
              x2={at[0]}
              y2={at[1] - 14}
              stroke={TEXT}
              strokeOpacity={0.4}
            />
            <text x={at[0]} y={at[1] - 20} fill={TEXT} fillOpacity={0.8}>
              {WORKSTREAMS[i].name.replace("Creative ", "").toUpperCase()}
            </text>
          </g>
        );
      })}
      {(() => {
        const at = iso.p(TILE_X[0] - TILE / 2, TILE_Y0, 0.18);
        return (
          <g>
            <TagAt pt={[at[0], at[1] - 68]} n={1} />
            <text x={at[0] + 28} y={at[1] - 55} fill={TEXT}>
              THE CREATIVE TEAM
            </text>
          </g>
        );
      })()}

      <Leader at={iso.p(SLAB.x0, SLAB.y0, slabTop)} x={L} text="X-BIONIC LAYER" n={2} gold left />
      <Leader at={iso.p(TOOL_BOX[0].x0, TOOL_BOX[0].y1, 0.72)} x={L} text="SHOPIFY" left />
      <Leader at={iso.p(TOOL_BOX[1].x1, TOOL_BOX[1].y0, TOOL_BOX[1].z1)} x={R} text="ANALYTICS" />
      {(() => {
        const at = iso.p(BOARD.x1, BOARD.y1, 0);
        const y = at[1] + 40;
        return (
          <g>
            <rect x={at[0] - 2} y={at[1] - 2} width={4} height={4} fill={TEXT} />
            <line
              x1={at[0]}
              y1={at[1] + 4}
              x2={at[0]}
              y2={y - 14}
              stroke={TEXT}
              strokeOpacity={0.45}
            />
            <TagAt pt={[at[0] - 9, y - 9]} n={3} />
            <text x={at[0] + 19} y={y + 4} fill={TEXT}>
              CLAUDE ENTERPRISE
            </text>
          </g>
        );
      })()}
    </g>
  );
}

/* ------------------------------------------------------------------ */

function Trace({
  iso,
  a,
  b,
  gold,
}: {
  iso: Iso;
  a: [number, number, number];
  b: [number, number, number];
  gold?: boolean;
}) {
  const s = iso.p(...a);
  const e = iso.p(...b);
  return (
    <line
      x1={s[0]}
      y1={s[1]}
      x2={e[0]}
      y2={e[1]}
      stroke={gold ? GOLD : TEXT}
      strokeOpacity={gold ? 0.9 : 0.45}
      strokeWidth={1}
    />
  );
}

function Solid({ iso, b, strong }: { iso: Iso; b: Box; strong?: boolean }) {
  const f = boxFaces(iso, b);
  const so = strong ? 0.8 : 0.55;
  return (
    <g>
      <polygon points={f.left} fill={over(TEXT, 0.05)} stroke={TEXT} strokeOpacity={so} />
      <polygon points={f.right} fill={over(TEXT, 0.03)} stroke={TEXT} strokeOpacity={so} />
      <polygon points={f.top} fill={over(TEXT, 0.07)} stroke={TEXT} strokeOpacity={so} />
    </g>
  );
}

function Dots({ iso, b }: { iso: Iso; b: Box }) {
  const dots: Pt[] = [];
  for (let x = Math.ceil(b.x0 + 0.4); x <= b.x1 - 0.4; x += 1) {
    for (let y = Math.ceil(b.y0 + 0.4); y <= b.y1 - 0.4; y += 1) dots.push(iso.p(x, y, b.z1));
  }
  return (
    <g>
      {dots.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x - 0.75}
          y={y - 0.75}
          width={1.5}
          height={1.5}
          fill={TEXT}
          fillOpacity={0.3}
        />
      ))}
    </g>
  );
}

function TagAt({ pt, n, gold }: { pt: Pt; n: number; gold?: boolean }) {
  const c = gold ? GOLD : TEXT;
  return (
    <g>
      <rect x={pt[0]} y={pt[1]} width={18} height={18} fill="none" stroke={c} strokeOpacity={0.6} />
      <text x={pt[0] + 9} y={pt[1] + 13} textAnchor="middle" fill={c} style={{ letterSpacing: 0 }}>
        {n}
      </text>
    </g>
  );
}

function Leader({
  at,
  x,
  text,
  sub,
  n,
  gold,
  left,
}: {
  at: Pt;
  x: number;
  text: string;
  sub?: string;
  n?: number;
  gold?: boolean;
  left?: boolean;
}) {
  const c = gold ? GOLD : TEXT;
  const y = at[1];
  const tx = n !== undefined ? x + 28 : x;
  const end = left ? tx + text.length * 8.2 + 10 : x - 8;
  return (
    <g>
      <rect x={at[0] - 2} y={at[1] - 2} width={4} height={4} fill={c} />
      <path
        d={`M${at[0] + (left ? -4 : 4)} ${y}H${end}`}
        fill="none"
        stroke={c}
        strokeOpacity={0.45}
      />
      {n !== undefined && <TagAt pt={[x, y - 9]} n={n} gold={gold} />}
      <text x={tx} y={y + 4} fill={c}>
        {text}
      </text>
      {sub && (
        <text x={tx} y={y + 24} fill={c} fillOpacity={0.6}>
          {sub}
        </text>
      )}
    </g>
  );
}
