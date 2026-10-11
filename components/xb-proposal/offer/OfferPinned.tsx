"use client";

/* Direction A · the pinned build. The words hold still on the left; on the
   right one isometric drawing assembles in three moves as the reader
   scrolls: the team, then the layer drawn out of the team's work, then the
   layer seated in the company's Claude Enterprise beside Shopify and
   analytics. `step` fixes a move for a still; without it the scroll drives. */

import { useEffect, useRef, useState } from "react";
import { OFFER, TOOLS, WORKSTREAMS, STRATA } from "../copy";
import { Stage } from "../Frame";
import { Glyph } from "../glyphs";
import { boxFaces, ease, lerp, makeIso, over, type Box, type Pt } from "../iso";
import { LayerSlab, slabBoxes, type SlabGeometry } from "../LayerSlab";

const GOLD = "#caa554";
const TEXT = "#ebe3d6";
const VB_W = 600;
const VB_H = 592;
const LABEL_X = 440;

export function OfferPinned({ step }: { step?: 1 | 2 | 3 }) {
  const fixed = step !== undefined;
  const runway = useRef<HTMLDivElement>(null);
  const [p, setP] = useState<number>(step ?? 1);

  useEffect(() => {
    if (fixed) return;
    let raf = 0;
    const read = () => {
      raf = 0;
      const el = runway.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const t = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      setP(1 + 2 * t);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [fixed]);

  const active = p < 1.5 ? 1 : p < 2.5 ? 2 : 3;
  const stage = (
    <Stage route={fixed ? `S1 · A · step ${step}` : "S1 · A · pinned build"}>
      <div className="xbA">
        <div className="xbA__text">
          <div className="xb-eyebrow">{OFFER.eyebrow}</div>
          <h2 className="xb-title">
            {OFFER.title[0]}
            <br />
            <span>{OFFER.title[1]}</span>
          </h2>
          <ol className="xbA__steps">
            {OFFER.steps.map((s, i) => (
              <li key={s.n} className="xbA__step" data-on={active === i + 1 || undefined}>
                <span className="xbA__n">{s.n}</span>
                <span className="xbA__head">{s.head}</span>
                <p className="xbA__body">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="xbA__fig">
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="The team, the layer and Claude Enterprise, drawn as one assembly"
          >
            <Assembly p={p} />
          </svg>
        </div>
      </div>
    </Stage>
  );

  if (fixed) return stage;
  return (
    <div ref={runway} className="xbA-runway">
      <div className="xbA-pin">{stage}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const BASE: Box = { x0: -6.4, x1: 6.4, y0: -3.4, y1: 3.4, z0: 0, z1: 0.5 };
const TOOL_BOX: Box[] = [
  { x0: 3.1, x1: 5.7, y0: -2.9, y1: -0.5, z0: 0.5, z1: 1.25 },
  { x0: 3.1, x1: 5.7, y0: 0.5, y1: 2.9, z0: 0.5, z1: 1.25 },
];
const TEAM_Z = 10.4;
const PLATE = 1.45;
const TEAM_X = [-4.65, -2.75, -0.85, 1.05];

function Assembly({ p }: { p: number }) {
  const iso = makeIso(23, 226, 424);
  const a2 = ease(p - 1); // the layer arrives
  const d = ease(p - 2); // the layer seats; the company's Claude comes up
  const teamOn = p < 1.5 ? 1 : 0.62;

  const g: SlabGeometry = {
    x0: -5.6,
    x1: 2.0,
    y0: -2.6,
    y1: 2.6,
    z0: lerp(3.9, BASE.z1, d),
    t: 0.4,
    gap: lerp(0.5, 0.05, d),
  };
  const strata = slabBoxes(g);
  const slabTop = strata[2].z1;
  const enterprise = 0.18 + 0.82 * d;

  return (
    <g>
      {/* The company's Claude Enterprise: the board everything seats on. */}
      <Solid iso={iso} b={BASE} presence={enterprise} tone="text" />
      <BoardDots iso={iso} b={BASE} opacity={0.5 * enterprise} />
      {TOOL_BOX.map((b, i) => (
        <g key={TOOLS[i].id}>
          <Solid iso={iso} b={b} presence={enterprise} tone="text" />
          <g opacity={enterprise}>
            <Glyph
              name={TOOLS[i].id}
              transform={iso.plane(b.x0 + 0.5, b.y0 + 0.5, b.z1, 1.4 / 24)}
              stroke={TEXT}
              strokeWidth={1}
            />
          </g>
        </g>
      ))}
      {/* Traces from the layer's seat to the two tools, on the board. */}
      <g opacity={d}>
        {[-1.7, 1.7].map((y) => {
          const s = iso.p(g.x1, y, BASE.z1);
          const e = iso.p(TOOL_BOX[0].x0, y, BASE.z1);
          return (
            <line key={y} x1={s[0]} y1={s[1]} x2={e[0]} y2={e[1]} stroke={GOLD} strokeWidth={1} />
          );
        })}
      </g>

      <LayerSlab iso={iso} g={g} presence={a2} />

      {/* Drop lines: each workstream's work going into the layer. */}
      <g opacity={a2}>
        {TEAM_X.map((cx) => {
          const s = iso.p(cx, 0, TEAM_Z);
          const e = iso.p(cx, 0, slabTop);
          return (
            <g key={cx}>
              <line
                x1={s[0]}
                y1={s[1]}
                x2={e[0]}
                y2={e[1]}
                stroke={GOLD}
                strokeOpacity={0.7}
                strokeWidth={1}
                strokeDasharray="2 4"
              />
              <rect x={e[0] - 2.5} y={e[1] - 2.5} width={5} height={5} fill={GOLD} />
            </g>
          );
        })}
      </g>

      {/* The team: four plates, one per workstream. */}
      {TEAM_X.map((cx, i) => {
        const b: Box = {
          x0: cx - PLATE / 2,
          x1: cx + PLATE / 2,
          y0: -PLATE / 2,
          y1: PLATE / 2,
          z0: TEAM_Z,
          z1: TEAM_Z + 0.16,
        };
        return (
          <g key={WORKSTREAMS[i].id} opacity={0.38 + 0.62 * Math.max(teamOn, 0.62)}>
            <Solid iso={iso} b={b} presence={1} tone="text" strong={p < 1.5} />
            <Glyph
              name={WORKSTREAMS[i].id}
              transform={iso.plane(b.x0 + 0.2, b.y0 + 0.2, b.z1, (PLATE - 0.4) / 24)}
              stroke={TEXT}
              strokeWidth={1}
            />
          </g>
        );
      })}

      {/* Labels. */}
      {TEAM_X.map((cx, i) => {
        const at = iso.p(cx - PLATE / 2, -PLATE / 2, TEAM_Z + 0.16);
        return (
          <g key={`l-${WORKSTREAMS[i].id}`} opacity={p < 1.5 ? 1 : 0.55}>
            <line
              x1={at[0]}
              y1={at[1] - 4}
              x2={at[0]}
              y2={at[1] - 14}
              stroke={TEXT}
              strokeOpacity={0.4}
            />
            <text x={at[0]} y={at[1] - 20} fill={TEXT} fillOpacity={0.85}>
              {WORKSTREAMS[i].name.toUpperCase()}
            </text>
          </g>
        );
      })}

      <g opacity={a2 * (1 - d)}>
        {strata.map((b, i) => (
          <Leader
            key={STRATA[i].id}
            at={iso.p(b.x1, b.y0, (b.z0 + b.z1) / 2)}
            text={STRATA[i].name.toUpperCase()}
            gold
          />
        ))}
      </g>
      <g opacity={a2}>
        <Leader
          at={iso.p(g.x1, g.y0, slabTop)}
          dy={d > 0.5 ? 0 : -26}
          text="X-BIONIC LAYER"
          gold
          strong
        />
      </g>
      <g opacity={enterprise}>
        <Leader at={iso.p(TOOL_BOX[0].x1, TOOL_BOX[0].y0, TOOL_BOX[0].z1)} text="SHOPIFY" />
        <Leader
          at={iso.p(
            TOOL_BOX[1].x1,
            (TOOL_BOX[1].y0 + TOOL_BOX[1].y1) / 2,
            (TOOL_BOX[1].z0 + TOOL_BOX[1].z1) / 2
          )}
          text="ANALYTICS"
        />
        <Leader at={iso.p(BASE.x1, 2.2, 0.25)} text="CLAUDE ENTERPRISE" strong />
      </g>
    </g>
  );
}

function Leader({
  at,
  text,
  gold,
  strong,
  dy = 0,
}: {
  at: Pt;
  text: string;
  gold?: boolean;
  strong?: boolean;
  dy?: number;
}) {
  const c = gold ? GOLD : TEXT;
  const y = at[1] + dy;
  const path =
    dy === 0
      ? `M${at[0] + 4} ${at[1]}H${LABEL_X - 8}`
      : `M${at[0] + 4} ${at[1]}V${y}H${LABEL_X - 8}`;
  return (
    <g>
      <rect x={at[0] - 2} y={at[1] - 2} width={4} height={4} fill={c} />
      <path d={path} fill="none" stroke={c} strokeOpacity={0.45} strokeWidth={1} />
      <text x={LABEL_X} y={y + 4} fill={c} fillOpacity={strong ? 1 : 0.72}>
        {text}
      </text>
    </g>
  );
}

function Solid({
  iso,
  b,
  presence,
  tone,
  strong,
}: {
  iso: ReturnType<typeof makeIso>;
  b: Box;
  presence: number;
  tone: "text";
  strong?: boolean;
}) {
  const f = boxFaces(iso, b);
  const stroke = tone === "text" ? TEXT : GOLD;
  const so = strong ? 0.85 : 0.5;
  if (presence < 0.999) {
    return (
      <g>
        <polygon
          points={f.outline}
          fill="none"
          stroke={stroke}
          strokeOpacity={0.3}
          strokeDasharray="3 5"
          opacity={1 - presence}
        />
        <g opacity={presence}>
          <polygon points={f.left} fill={over(TEXT, 0.05)} stroke={stroke} strokeOpacity={so} />
          <polygon points={f.right} fill={over(TEXT, 0.03)} stroke={stroke} strokeOpacity={so} />
          <polygon points={f.top} fill={over(TEXT, 0.07)} stroke={stroke} strokeOpacity={so} />
        </g>
      </g>
    );
  }
  return (
    <g>
      <polygon points={f.left} fill={over(TEXT, 0.05)} stroke={stroke} strokeOpacity={so} />
      <polygon points={f.right} fill={over(TEXT, 0.03)} stroke={stroke} strokeOpacity={so} />
      <polygon points={f.top} fill={over(TEXT, 0.07)} stroke={stroke} strokeOpacity={so} />
    </g>
  );
}

/** A dot every unit on a board's top face: the surface reads as a board. */
function BoardDots({
  iso,
  b,
  opacity,
}: {
  iso: ReturnType<typeof makeIso>;
  b: Box;
  opacity: number;
}) {
  const dots: Pt[] = [];
  for (let x = Math.ceil(b.x0 + 0.5); x <= b.x1 - 0.5; x += 1) {
    for (let y = Math.ceil(b.y0 + 0.5); y <= b.y1 - 0.5; y += 1) dots.push(iso.p(x, y, b.z1));
  }
  return (
    <g opacity={opacity}>
      {dots.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          x={x - 0.75}
          y={y - 0.75}
          width={1.5}
          height={1.5}
          fill={TEXT}
          fillOpacity={0.5}
        />
      ))}
    </g>
  );
}
